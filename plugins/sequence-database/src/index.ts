import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  executeQuery,
  listSchemas,
  getSchemaInfo,
  getTableInfo,
  closePools,
} from "./connection.js";
import { cleanupTunnels } from "./tunnel-manager.js";
import { escapeLogfmtValue } from "./sql-validator.js";
import {
  type Environment,
  type QueryResult,
  DEFAULT_TIMEOUT_MS,
  MAX_TIMEOUT_MS,
  MAX_ROWS,
} from "./types.js";

const server = new McpServer({
  name: "sequence-database",
  version: "0.1.0",
});

// Format query results as JSON
function formatQueryResultJson(result: QueryResult): string {
  return JSON.stringify(result, null, 2);
}

// Format query results as markdown table
function formatQueryResultMarkdown(result: QueryResult): string {
  const lines: string[] = [];

  lines.push(
    `env=${result.environment} rows=${result.row_count} truncated=${result.truncated} execution_time_ms=${result.execution_time_ms}`
  );
  lines.push("");

  if (result.columns.length === 0 || result.rows.length === 0) {
    lines.push("No results");
    return lines.join("\n");
  }

  // Create markdown table
  lines.push("| " + result.columns.join(" | ") + " |");
  lines.push("| " + result.columns.map(() => "---").join(" | ") + " |");

  for (const row of result.rows) {
    const values = result.columns.map((col) => {
      const val = row[col];
      if (val === null || val === undefined) return "NULL";
      if (typeof val === "object") return JSON.stringify(val);
      return String(val);
    });
    lines.push("| " + values.join(" | ") + " |");
  }

  return lines.join("\n");
}

// db_query tool
server.tool(
  "db_query",
  `Execute read-only SQL queries against AlloyDB read replicas.

SECURITY: Only SELECT, EXPLAIN, EXPLAIN ANALYZE, and WITH queries are allowed. Write operations are blocked.

LIMITS: Maximum ${MAX_ROWS} rows returned per query. Queries are automatically capped.

USAGE:
- Use for debugging production data issues
- Use for investigating customer-reported problems
- Always prefer specific queries over SELECT * to reduce data volume

EXAMPLES:
- SELECT * FROM accounts_sequence_accounts WHERE id = 'abc123' LIMIT 10
- SELECT id, status, total_amount FROM invoices_invoices WHERE account_id = 'abc123' LIMIT 100
- EXPLAIN ANALYZE SELECT * FROM large_table WHERE indexed_column = 'value'`,
  {
    environment: z
      .enum(["dev", "sandbox", "production"])
      .describe("Target environment: dev, sandbox, or production"),
    query: z
      .string()
      .min(1)
      .max(10000)
      .describe(
        "SQL query to execute. Only SELECT/EXPLAIN queries allowed. Example: SELECT * FROM accounts_sequence_accounts WHERE id = 'abc' LIMIT 10"
      ),
    format: z
      .enum(["json", "markdown"])
      .optional()
      .default("json")
      .describe("Output format: json (structured, default) or markdown (table)"),
    timeout_ms: z
      .number()
      .int()
      .min(1000)
      .max(MAX_TIMEOUT_MS)
      .optional()
      .default(DEFAULT_TIMEOUT_MS)
      .describe(
        `Query timeout in milliseconds. Default: ${DEFAULT_TIMEOUT_MS}, Max: ${MAX_TIMEOUT_MS}`
      ),
  },
  async ({ environment, query, format, timeout_ms }) => {
    try {
      const result = await executeQuery(
        environment as Environment,
        query,
        timeout_ms ?? DEFAULT_TIMEOUT_MS
      );

      const formatted =
        format === "markdown"
          ? formatQueryResultMarkdown(result)
          : formatQueryResultJson(result);

      return { content: [{ type: "text", text: formatted }] };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        content: [
          { type: "text", text: `error=true msg=${escapeLogfmtValue(message)}` },
        ],
        isError: true,
      };
    }
  }
);

// db_list_schemas tool
server.tool(
  "db_list_schemas",
  `List all available database schemas.

Use this to discover what data areas are available before querying tables.
System schemas (pg_catalog, information_schema) are filtered out.`,
  {
    environment: z
      .enum(["dev", "sandbox", "production"])
      .describe("Target environment: dev, sandbox, or production"),
    format: z
      .enum(["json", "markdown"])
      .optional()
      .default("json")
      .describe("Output format: json (default) or markdown"),
  },
  async ({ environment, format }) => {
    try {
      const schemas = await listSchemas(environment as Environment);

      if (format === "markdown") {
        const lines = [
          `env=${environment} schema_count=${schemas.length}`,
          "",
          "| Schema | Table Count |",
          "| --- | --- |",
        ];
        for (const schema of schemas) {
          lines.push(`| ${schema.name} | ${schema.table_count} |`);
        }
        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ environment, schemas }, null, 2),
          },
        ],
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        content: [
          { type: "text", text: `error=true msg=${escapeLogfmtValue(message)}` },
        ],
        isError: true,
      };
    }
  }
);

// db_get_schema tool
server.tool(
  "db_get_schema",
  `List all tables in a specific schema with row count estimates.

Use this to discover what tables exist. For column details, indexes, and foreign keys, use db_get_table_info on specific tables.`,
  {
    environment: z
      .enum(["dev", "sandbox", "production"])
      .describe("Target environment: dev, sandbox, or production"),
    schema: z
      .string()
      .min(1)
      .max(63)
      .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Invalid schema name format")
      .optional()
      .default("public")
      .describe("Schema name. Default: public"),
    format: z
      .enum(["json", "markdown"])
      .optional()
      .default("json")
      .describe("Output format: json (default) or markdown"),
  },
  async ({ environment, schema, format }) => {
    try {
      const tables = await getSchemaInfo(environment as Environment, schema);

      if (format === "markdown") {
        const lines = [
          `env=${environment} schema=${schema} table_count=${tables.length}`,
          "",
          "| Table | Estimated Rows |",
          "| --- | --- |",
        ];

        for (const table of tables) {
          lines.push(`| ${table.name} | ~${table.row_count_estimate} |`);
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ environment, schema, tables }, null, 2),
          },
        ],
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        content: [
          { type: "text", text: `error=true msg=${escapeLogfmtValue(message)}` },
        ],
        isError: true,
      };
    }
  }
);

// db_get_table_info tool
server.tool(
  "db_get_table_info",
  `Get detailed information about a specific table.

Returns columns (with types, defaults, descriptions), primary key, indexes, foreign keys, row count estimate, and table size.

Use this to understand table structure, relationships, and performance characteristics before writing queries.`,
  {
    environment: z
      .enum(["dev", "sandbox", "production"])
      .describe("Target environment: dev, sandbox, or production"),
    table: z
      .string()
      .min(1)
      .max(127)
      .regex(
        /^([a-zA-Z_][a-zA-Z0-9_]*\.)?[a-zA-Z_][a-zA-Z0-9_]*$/,
        "Invalid table name format. Use 'table_name' or 'schema.table_name'"
      )
      .describe(
        "Table name, optionally with schema prefix. Examples: 'accounts_sequence_accounts', 'public.invoices_invoices'"
      ),
    format: z
      .enum(["json", "markdown"])
      .optional()
      .default("json")
      .describe("Output format: json (default) or markdown"),
  },
  async ({ environment, table, format }) => {
    try {
      const info = await getTableInfo(environment as Environment, table);

      if (format === "markdown") {
        const lines = [
          `# ${info.table}`,
          "",
          `~${info.row_count_estimate} rows | ${formatBytes(info.size_bytes)}`,
          "",
          "## Columns",
          "",
          "| Column | Type | Nullable | Default | Description |",
          "| --- | --- | --- | --- | --- |",
        ];

        for (const col of info.columns) {
          lines.push(
            `| ${col.name} | ${col.type} | ${col.nullable ? "YES" : "NO"} | ${col.default_value || "-"} | ${col.description || "-"} |`
          );
        }

        if (info.primary_key.length > 0) {
          lines.push("");
          lines.push(`**Primary Key:** ${info.primary_key.join(", ")}`);
        }

        if (info.indexes.length > 0) {
          lines.push("");
          lines.push("## Indexes");
          lines.push("");
          lines.push("| Name | Columns | Unique | Type |");
          lines.push("| --- | --- | --- | --- |");
          for (const idx of info.indexes) {
            lines.push(
              `| ${idx.name} | ${idx.columns.join(", ")} | ${idx.unique ? "YES" : "NO"} | ${idx.type} |`
            );
          }
        }

        if (info.foreign_keys.length > 0) {
          lines.push("");
          lines.push("## Foreign Keys");
          lines.push("");
          lines.push("| Column | References |");
          lines.push("| --- | --- |");
          for (const fk of info.foreign_keys) {
            lines.push(
              `| ${fk.column} | ${fk.references_table}(${fk.references_column}) |`
            );
          }
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ environment, ...info }, null, 2),
          },
        ],
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        content: [
          { type: "text", text: `error=true msg=${escapeLogfmtValue(message)}` },
        ],
        isError: true,
      };
    }
  }
);

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Cleanup on exit
process.on("SIGTERM", () => {
  closePools();
  cleanupTunnels();
  process.exit(0);
});

process.on("SIGINT", () => {
  closePools();
  cleanupTunnels();
  process.exit(0);
});

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
