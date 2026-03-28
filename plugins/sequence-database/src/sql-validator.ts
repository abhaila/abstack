import type { ValidationResult } from "./types.js";

// Allowed query patterns (must match at the start after whitespace)
const ALLOWED_PATTERNS = [
  /^\s*SELECT\s/i,
  /^\s*EXPLAIN\s/i,
  /^\s*SHOW\s/i,
  /^\s*WITH\s+[\w"]+\s+AS\s*\(/i, // CTEs - will be followed by SELECT
];

// Blocked keywords that indicate write operations or dangerous commands
const BLOCKED_KEYWORDS = [
  // DML write operations
  "INSERT",
  "UPDATE",
  "DELETE",
  "MERGE",
  "UPSERT",
  // DDL operations
  "DROP",
  "CREATE",
  "ALTER",
  "TRUNCATE",
  "RENAME",
  // Permission operations
  "GRANT",
  "REVOKE",
  // Transaction control (we handle this ourselves)
  "COMMIT",
  "ROLLBACK",
  "SAVEPOINT",
  "BEGIN",
  "START TRANSACTION",
  // Procedural operations
  "EXECUTE",
  "CALL",
  "DO",
  // Data movement
  "COPY",
  "IMPORT",
  "EXPORT",
  "LOAD",
  "UNLOAD",
  // Maintenance operations
  "VACUUM",
  "ANALYZE",
  "CLUSTER",
  "REINDEX",
  "REFRESH",
  // Lock operations
  "LOCK",
  "UNLOCK",
  // Session/config operations
  "SET ",
  "RESET",
  "DISCARD",
  // Security-sensitive
  "SECURITY",
  "OWNER",
  "PASSWORD",
];

// Dangerous patterns to block
const DANGEROUS_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  {
    pattern: /;\s*\S/,
    reason: "Multiple statements are not allowed",
  },
  {
    pattern: /--/,
    reason: "SQL line comments (--) are not allowed",
  },
  {
    pattern: /\/\*/,
    reason: "SQL block comments (/*) are not allowed",
  },
  {
    pattern: /\bINTO\s+(OUTFILE|DUMPFILE)\b/i,
    reason: "File output operations are not allowed",
  },
  {
    pattern: /\bpg_read_file\s*\(/i,
    reason: "File reading functions are not allowed",
  },
  {
    pattern: /\bpg_write_file\s*\(/i,
    reason: "File writing functions are not allowed",
  },
  {
    pattern: /\blo_import\s*\(/i,
    reason: "Large object import is not allowed",
  },
  {
    pattern: /\blo_export\s*\(/i,
    reason: "Large object export is not allowed",
  },
  {
    pattern: /\bdblink\s*\(/i,
    reason: "Database links are not allowed",
  },
  {
    pattern: /\bpg_execute_server_program\s*\(/i,
    reason: "Server program execution is not allowed",
  },
];

// Normalize query for checking (collapse whitespace, trim)
function normalizeQuery(query: string): string {
  return query.replace(/\s+/g, " ").trim();
}

export function validateQuery(query: string): ValidationResult {
  const normalized = normalizeQuery(query);

  if (!normalized) {
    return { valid: false, error: "Query cannot be empty" };
  }

  // Check if query starts with an allowed pattern
  const isAllowedType = ALLOWED_PATTERNS.some((pattern) =>
    pattern.test(normalized)
  );

  if (!isAllowedType) {
    return {
      valid: false,
      error:
        "Only SELECT, EXPLAIN, EXPLAIN ANALYZE, and WITH queries are allowed. " +
        "Write operations (INSERT, UPDATE, DELETE, etc.) are blocked for security.",
    };
  }

  // Check for blocked keywords anywhere in the query
  const upperQuery = normalized.toUpperCase();
  for (const keyword of BLOCKED_KEYWORDS) {
    // Use word boundary matching to avoid false positives
    // e.g., "SELECT password FROM users" should be allowed
    // but "ALTER USER ... PASSWORD" should be blocked
    const keywordUpper = keyword.toUpperCase();

    // For keywords with spaces (like "SET "), check directly
    if (keyword.includes(" ")) {
      if (upperQuery.includes(keywordUpper)) {
        return {
          valid: false,
          error: `Query contains blocked keyword: ${keyword.trim()}. Only read operations are allowed.`,
        };
      }
    } else {
      // For single-word keywords, use word boundary regex
      const regex = new RegExp(`\\b${keywordUpper}\\b`);
      // Check if the keyword appears as a statement (not in a column/table name context)
      // We allow it in SELECT lists or WHERE clauses as identifiers
      const matches = upperQuery.match(regex);
      if (matches) {
        // Check if this keyword appears to be a statement keyword (at start or after semicolon)
        const beforeKeyword = upperQuery.indexOf(keywordUpper);
        const prefix = upperQuery.substring(0, beforeKeyword).trim();

        // If the keyword is at the start or follows a semicolon or open paren in a concerning way
        if (
          beforeKeyword === 0 ||
          prefix.endsWith(";") ||
          // CTE that might contain a write operation
          (prefix.endsWith(")") && keywordUpper !== "SELECT")
        ) {
          return {
            valid: false,
            error: `Query contains blocked operation: ${keyword}. Only read operations are allowed.`,
          };
        }
      }
    }
  }

  // Check for dangerous patterns
  for (const { pattern, reason } of DANGEROUS_PATTERNS) {
    if (pattern.test(query)) {
      return { valid: false, error: reason };
    }
  }

  // Additional check: if it's a WITH query, ensure it ends with SELECT
  if (/^\s*WITH\s/i.test(normalized)) {
    // Find the main query after all CTEs
    // This is a simplified check - just ensure SELECT appears and no write keywords at statement level
    if (!/\)\s*SELECT\s/i.test(normalized) && !/\bSELECT\s/i.test(normalized)) {
      return {
        valid: false,
        error: "WITH (CTE) queries must end with a SELECT statement",
      };
    }
  }

  return { valid: true };
}

// Helper to escape values for logfmt-style output
export function escapeLogfmtValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  const str = String(value);
  if (str.includes(" ") || str.includes('"') || str.includes("=") || str.includes("\n")) {
    return `"${str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
  }

  return str;
}
