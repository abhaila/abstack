import pg from "pg";
import { readFileSync } from "fs";
import { resolve } from "path";
import { homedir } from "os";
import { parse as parseDotenv } from "dotenv";
import { ensureTunnel, getTunnelPort } from "./tunnel-manager.js";
import { validateQuery } from "./sql-validator.js";
import {
  type Environment,
  type QueryResult,
  MAX_ROWS,
  DEFAULT_TIMEOUT_MS,
} from "./types.js";

const { Pool } = pg;

// Connection pools per environment
const pools: Map<Environment, pg.Pool> = new Map();

const DEFAULT_DATABASE_NAMES: Record<Environment, string> = {
  dev: "dev-db",
  sandbox: "sandbox-db",
  production: "production-eu-db",
};

// Load credentials ONLY from the dedicated .env file (not process.env).
// This prevents write-access credentials from leaking in from the shell environment.
const ENV_FILE_PATH = resolve(homedir(), ".config/sequence/database.env");

let envFileVars: Record<string, string> = {};
try {
  envFileVars = parseDotenv(readFileSync(ENV_FILE_PATH, "utf-8"));
} catch {
  // Error will surface as a credential-missing error when a tool is invoked
}

function getCredentials(env: Environment): { user: string; password: string; database: string } {
  const envUpper = env.toUpperCase();

  // Read credentials ONLY from the .env file, never from process.env.
  // The READ suffix ensures we only use read-replica credentials.
  const user = envFileVars[`DB_${envUpper}_READ_USER`];
  const password = envFileVars[`DB_${envUpper}_READ_PASSWORD`];

  const database =
    process.env[`DB_${envUpper}_DATABASE`] ||
    process.env.DB_DATABASE ||
    DEFAULT_DATABASE_NAMES[env];

  if (!user || !password) {
    throw new Error(
      `Missing database credentials for ${env}.\n` +
      `Credentials must be set in ${ENV_FILE_PATH}:\n` +
      `  DB_${envUpper}_READ_USER=<username>\n` +
      `  DB_${envUpper}_READ_PASSWORD=<password>\n\n` +
      `This file should be provisioned via 1Password. ` +
      `Each environment requires its own read-specific credentials.`
    );
  }

  return { user, password, database };
}

function getPool(env: Environment): pg.Pool {
  let pool = pools.get(env);
  if (!pool) {
    const { user, password, database } = getCredentials(env);
    const port = getTunnelPort(env);

    pool = new Pool({
      host: "127.0.0.1",
      port,
      user,
      password,
      database,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: {
        rejectUnauthorized: false, // Required for tunneled connections
      },
    });

    pools.set(env, pool);
  }
  return pool;
}

export async function executeQuery(
  env: Environment,
  query: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<QueryResult> {
  // Validate query first
  const validation = validateQuery(query);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Ensure tunnel is running
  await ensureTunnel(env);

  const pool = getPool(env);
  const client = await pool.connect();

  try {
    const startTime = Date.now();

    // Set session to read-only and set timeout
    await client.query("SET TRANSACTION READ ONLY");
    await client.query(`SET statement_timeout = ${timeoutMs}`);

    // Execute the query
    const result = await client.query(query);

    const executionTime = Date.now() - startTime;

    // Process rows
    const rows = result.rows || [];
    const truncated = rows.length >= MAX_ROWS;
    const returnedRows = rows.slice(0, MAX_ROWS);

    // Get column names
    const columns = result.fields?.map((f) => f.name) || [];

    return {
      environment: env,
      row_count: returnedRows.length,
      columns,
      rows: returnedRows,
      truncated,
      execution_time_ms: executionTime,
    };
  } finally {
    client.release();
  }
}

export async function listSchemas(env: Environment): Promise<Array<{ name: string; table_count: number }>> {
  await ensureTunnel(env);

  const pool = getPool(env);
  const client = await pool.connect();

  try {
    await client.query("SET TRANSACTION READ ONLY");

    const result = await client.query(`
      SELECT
        n.nspname as schema_name,
        COUNT(c.relname)::int as table_count
      FROM pg_namespace n
      LEFT JOIN pg_class c ON c.relnamespace = n.oid AND c.relkind IN ('r', 'v', 'm')
      WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
        AND n.nspname NOT LIKE 'pg_temp_%'
        AND n.nspname NOT LIKE 'pg_toast_temp_%'
      GROUP BY n.nspname
      ORDER BY n.nspname
    `);

    return result.rows.map((row) => ({
      name: row.schema_name,
      table_count: row.table_count,
    }));
  } finally {
    client.release();
  }
}

export async function getSchemaInfo(
  env: Environment,
  schemaName: string = "public"
): Promise<Array<{ name: string; row_count_estimate: number }>> {
  await ensureTunnel(env);

  const pool = getPool(env);
  const client = await pool.connect();

  try {
    await client.query("SET TRANSACTION READ ONLY");

    const tablesResult = await client.query(
      `
      SELECT
        c.relname as table_name,
        c.reltuples::bigint as row_estimate
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = $1
        AND c.relkind IN ('r', 'v', 'm')
      ORDER BY c.relname
      `,
      [schemaName]
    );

    return tablesResult.rows.map((row) => ({
      name: row.table_name,
      row_count_estimate: Math.max(0, row.row_estimate),
    }));
  } finally {
    client.release();
  }
}

export async function getTableInfo(
  env: Environment,
  tableName: string
): Promise<{
  table: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    default_value: string | null;
    description: string | null;
  }>;
  primary_key: string[];
  indexes: Array<{ name: string; columns: string[]; unique: boolean; type: string }>;
  foreign_keys: Array<{ column: string; references_table: string; references_column: string }>;
  row_count_estimate: number;
  size_bytes: number;
}> {
  await ensureTunnel(env);

  // Parse schema.table format
  let schemaName = "public";
  let tableNameOnly = tableName;
  if (tableName.includes(".")) {
    const parts = tableName.split(".");
    schemaName = parts[0];
    tableNameOnly = parts[1];
  }

  const pool = getPool(env);
  const client = await pool.connect();

  try {
    await client.query("SET TRANSACTION READ ONLY");

    // Get basic table info
    const tableResult = await client.query(
      `
      SELECT
        c.reltuples::bigint as row_estimate,
        pg_total_relation_size(c.oid) as size_bytes
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = $1 AND c.relname = $2
      `,
      [schemaName, tableNameOnly]
    );

    if (tableResult.rows.length === 0) {
      throw new Error(`Table not found: ${tableName}`);
    }

    const tableInfo = tableResult.rows[0];

    // Get columns with details
    const columnsResult = await client.query(
      `
      SELECT
        a.attname as column_name,
        pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
        NOT a.attnotnull as is_nullable,
        pg_get_expr(d.adbin, d.adrelid) as default_value,
        col_description(c.oid, a.attnum) as description
      FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
      WHERE n.nspname = $1
        AND c.relname = $2
        AND a.attnum > 0
        AND NOT a.attisdropped
      ORDER BY a.attnum
      `,
      [schemaName, tableNameOnly]
    );

    // Get primary key
    const pkResult = await client.query(
      `
      SELECT a.attname as column_name
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      JOIN pg_class c ON c.oid = i.indrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = $1 AND c.relname = $2 AND i.indisprimary
      ORDER BY array_position(i.indkey, a.attnum)
      `,
      [schemaName, tableNameOnly]
    );

    // Get indexes
    const indexesResult = await client.query(
      `
      SELECT
        i.relname as index_name,
        am.amname as index_type,
        ix.indisunique as is_unique,
        array_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum)) as columns
      FROM pg_index ix
      JOIN pg_class t ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      JOIN pg_am am ON am.oid = i.relam
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      WHERE n.nspname = $1 AND t.relname = $2
      GROUP BY i.relname, am.amname, ix.indisunique
      ORDER BY i.relname
      `,
      [schemaName, tableNameOnly]
    );

    // Get foreign keys
    const fkResult = await client.query(
      `
      SELECT
        a.attname as column_name,
        cl.relname as references_table,
        af.attname as references_column
      FROM pg_constraint c
      JOIN pg_class cl ON cl.oid = c.confrelid
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      JOIN pg_attribute af ON af.attrelid = c.confrelid AND af.attnum = ANY(c.confkey)
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = $1 AND t.relname = $2 AND c.contype = 'f'
      `,
      [schemaName, tableNameOnly]
    );

    return {
      table: `${schemaName}.${tableNameOnly}`,
      columns: columnsResult.rows.map((col) => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable,
        default_value: col.default_value,
        description: col.description,
      })),
      primary_key: pkResult.rows.map((row) => row.column_name),
      indexes: indexesResult.rows.map((idx) => ({
        name: idx.index_name,
        columns: idx.columns,
        unique: idx.is_unique,
        type: idx.index_type,
      })),
      foreign_keys: fkResult.rows.map((fk) => ({
        column: fk.column_name,
        references_table: fk.references_table,
        references_column: fk.references_column,
      })),
      row_count_estimate: Math.max(0, tableInfo.row_estimate),
      size_bytes: tableInfo.size_bytes,
    };
  } finally {
    client.release();
  }
}

export function closePools(): void {
  for (const pool of pools.values()) {
    pool.end();
  }
  pools.clear();
}

// Cleanup on process exit
process.on("exit", () => {
  closePools();
});
