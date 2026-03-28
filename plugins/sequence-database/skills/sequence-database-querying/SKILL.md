---
name: Database Querying
description: Use when the user asks to query the database, investigate data issues, debug production problems using DB data, or explore database schema. Triggers include "query the database", "check the DB", "look up in production DB", "find account in database", "what tables exist", "show me the schema". MUST be invoked before using db_query, db_list_schemas, db_get_schema, or db_get_table_info MCP tools.
---

# Database Querying

Query AlloyDB read replicas across dev, sandbox, and production environments using the database MCP tools.

## Critical Rules - READ FIRST

### Security Restrictions

1. **READ-ONLY**: Only SELECT, EXPLAIN, and EXPLAIN ANALYZE queries are allowed
2. **NO WRITES**: INSERT, UPDATE, DELETE, DROP, CREATE, ALTER are blocked
3. **NO COMMENTS**: SQL comments (`--`, `/* */`) are blocked to prevent injection
4. **NO MULTI-STATEMENT**: Only single statements allowed (no `;` separators)
5. **ROW LIMIT**: Maximum 500 rows returned per query

### Best Practices

1. **Always use LIMIT** - Don't query unbounded result sets
2. **Prefer specific columns** - Avoid `SELECT *` on wide tables
3. **Use indexed columns** - Check table info for indexes before filtering
4. **Start with schema exploration** - Use `db_list_schemas` and `db_get_schema` before querying

## Available Tools

### `db_query` - Execute SQL Queries

Execute read-only SQL against the database.

**Parameters:**
- `environment`: "dev", "sandbox", or "production"
- `query`: SQL query (SELECT/EXPLAIN only)
- `format`: "json" (default) or "markdown"
- `timeout_ms`: Query timeout (default: 10000, max: 30000)

**Examples:**

```sql
SELECT * FROM accounts_sequence_accounts WHERE id = '019991d3-a33a-71d3-9462-9a49f29f0697' LIMIT 1

SELECT id, status, total_amount, created_at
FROM invoices_invoices
WHERE account_id = '019991d3-a33a-71d3-9462-9a49f29f0697'
ORDER BY created_at DESC
LIMIT 20

EXPLAIN ANALYZE SELECT * FROM large_table WHERE indexed_column = 'value'
```

### `db_list_schemas` - List Database Schemas

Discover available schemas and their table counts.

**Parameters:**
- `environment`: "dev", "sandbox", or "production"
- `format`: "json" (default) or "markdown"

### `db_get_schema` - List Tables in Schema

List all table names and row count estimates in a schema. Use `db_get_table_info` for column details.

**Parameters:**
- `environment`: "dev", "sandbox", or "production"
- `schema`: Schema name (default: "public")
- `format`: "json" (default) or "markdown"

### `db_get_table_info` - Get Table Details

Get detailed table info including columns, indexes, foreign keys.

**Parameters:**
- `environment`: "dev", "sandbox", or "production"
- `table`: Table name (e.g., "accounts_sequence_accounts" or "public.invoices_invoices")
- `format`: "json" (default) or "markdown"

## Common Tables

These are the key tables you will encounter most frequently. Use `db_get_table_info` to get full column details.

| Table | Description |
|-------|-------------|
| `accounts_sequence_accounts` | Customer accounts |
| `invoices_invoices` | Invoices generated for accounts |
| `invoices_line_items` | Individual line items on invoices |
| `billing_billing_runs` | Billing run executions |
| `billing_billing_schedules` | Billing schedule configurations |

## Workflow: Investigating Data Issues

### Step 1: Understand the Schema

```
1. db_list_schemas → See what schemas exist
2. db_get_schema(schema="public") → See table names and row counts
3. db_get_table_info(table="accounts_sequence_accounts") → Get column details for a specific table
```

### Step 2: Find the Entity

```sql
SELECT * FROM accounts_sequence_accounts WHERE id = '<uuid>' LIMIT 1

SELECT * FROM accounts_sequence_accounts WHERE name ILIKE '%acme%' LIMIT 10

SELECT id, status, total_amount FROM invoices_invoices WHERE status = 'pending' LIMIT 10
```

### Step 3: Follow Relationships

Use `db_get_table_info` to find foreign keys, then join:

```sql
SELECT a.id, a.name, i.id as invoice_id, i.status
FROM accounts_sequence_accounts a
JOIN invoices_invoices i ON i.account_id = a.id
WHERE a.id = '<uuid>'
LIMIT 20
```

### Step 4: Check Related Data

```sql
SELECT * FROM invoices_invoices
WHERE account_id = '<uuid>'
ORDER BY created_at DESC
LIMIT 10

SELECT * FROM billing_billing_runs
WHERE account_id = '<uuid>'
ORDER BY period_start DESC
LIMIT 10
```

## Common Query Patterns

### Finding Records by ID

```sql
SELECT * FROM accounts_sequence_accounts WHERE id = '<uuid>' LIMIT 1
```

### Finding Records by Time Range

```sql
SELECT * FROM invoices_invoices
WHERE created_at >= '2026-01-01' AND created_at < '2026-02-01'
ORDER BY created_at DESC
LIMIT 100
```

### Counting Records

```sql
SELECT COUNT(*) FROM invoices_invoices WHERE status = 'pending'
```

### Aggregations

```sql
SELECT status, COUNT(*) as count
FROM invoices_invoices
WHERE account_id = '<uuid>'
GROUP BY status
```

### Using CTEs

```sql
WITH recent_invoices AS (
  SELECT * FROM invoices_invoices
  WHERE created_at > NOW() - INTERVAL '30 days'
)
SELECT account_id, COUNT(*) as invoice_count
FROM recent_invoices
GROUP BY account_id
ORDER BY invoice_count DESC
LIMIT 10
```

## Troubleshooting

### "Tunnel failed to become ready"

- Ensure `cloudflared` is installed: `brew install cloudflared`
- Ensure you're authenticated: `cloudflared login`
- Check VPN connection if required

### "Query contains blocked keyword"

The query validator detected a write operation or dangerous pattern. Only SELECT, EXPLAIN, and WITH...SELECT are allowed.

### "Query timeout"

Increase `timeout_ms` parameter (max 30000) or optimize the query:
- Add LIMIT clause
- Use indexed columns in WHERE
- Check query plan with EXPLAIN ANALYZE

### "Maximum rows exceeded"

Queries are capped at 500 rows. Add more specific filters or pagination:
```sql
SELECT * FROM invoices_invoices
WHERE account_id = '<uuid>'
ORDER BY created_at DESC
LIMIT 500 OFFSET 0

SELECT * FROM invoices_invoices
WHERE account_id = '<uuid>'
ORDER BY created_at DESC
LIMIT 500 OFFSET 500
```

## When to Use Each Environment

- **dev**: Testing queries, exploring schema, low-risk investigation
- **sandbox**: Pre-production data, testing with realistic data
- **production**: Actual customer data debugging (use with care)

Always start with dev/sandbox when exploring, then query production only when necessary for the specific issue.
