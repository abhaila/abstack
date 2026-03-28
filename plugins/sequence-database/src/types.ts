export const TUNNEL_CONFIG = {
  dev: { hostname: "alloydb-read-non-production.seqhq.io", port: 55780 },
  sandbox: { hostname: "alloydb-read-sandbox.seqhq.io", port: 55781 },
  production: { hostname: "alloydb-read-production.seqhq.io", port: 55782 },
} as const;

export type Environment = keyof typeof TUNNEL_CONFIG;

export const MAX_ROWS = 500;
export const DEFAULT_TIMEOUT_MS = 10000;
export const MAX_TIMEOUT_MS = 30000;

export interface QueryResult {
  environment: Environment;
  row_count: number;
  columns: string[];
  rows: Record<string, unknown>[];
  truncated: boolean;
  execution_time_ms: number;
}

export interface SchemaInfo {
  environment: Environment;
  schemas: Array<{
    name: string;
    table_count: number;
  }>;
}

export interface TableListInfo {
  environment: Environment;
  schema: string;
  tables: Array<{
    name: string;
    row_count_estimate: number;
  }>;
}

export interface TableDetailInfo {
  environment: Environment;
  table: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    default_value: string | null;
    description: string | null;
  }>;
  primary_key: string[];
  indexes: Array<{
    name: string;
    columns: string[];
    unique: boolean;
    type: string;
  }>;
  foreign_keys: Array<{
    column: string;
    references_table: string;
    references_column: string;
  }>;
  row_count_estimate: number;
  size_bytes: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}
