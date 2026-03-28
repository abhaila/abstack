# SQL Query Patterns for Debugging

Common SQL patterns for investigating production issues.

## Finding Entities

### By Exact ID
```sql
SELECT * FROM accounts_sequence_accounts WHERE id = '019991d3-a33a-71d3-9462-9a49f29f0697' LIMIT 1
```

### By Partial Name Match
```sql
SELECT * FROM accounts_sequence_accounts WHERE name ILIKE '%acme%' LIMIT 20
```

### By Account ID
```sql
SELECT * FROM invoices_invoices WHERE account_id = '<uuid>' ORDER BY created_at DESC LIMIT 50
```

## Time-Based Queries

### Recent Records
```sql
SELECT * FROM invoices_invoices
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 100
```

### Date Range
```sql
SELECT * FROM invoices_invoices
WHERE created_at >= '2026-01-01'
  AND created_at < '2026-02-01'
ORDER BY created_at
LIMIT 500
```

### Records Modified Today
```sql
SELECT * FROM accounts_sequence_accounts
WHERE updated_at >= CURRENT_DATE
ORDER BY updated_at DESC
LIMIT 50
```

## Status and State Queries

### Filter by Status
```sql
SELECT * FROM invoices_invoices
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 50
```

### Multiple Statuses
```sql
SELECT * FROM billing_billing_runs
WHERE status IN ('pending', 'in_progress', 'failed')
ORDER BY created_at DESC
LIMIT 50
```

### NULL Checks
```sql
SELECT * FROM accounts_sequence_accounts
WHERE deleted_at IS NULL
LIMIT 50
```

## Aggregation Patterns

### Count by Status
```sql
SELECT status, COUNT(*) as count
FROM invoices_invoices
WHERE account_id = '<uuid>'
GROUP BY status
ORDER BY count DESC
```

### Sum by Category
```sql
SELECT product_type, SUM(amount) as total
FROM invoices_line_items
WHERE invoice_id = '<uuid>'
GROUP BY product_type
```

### Count per Day
```sql
SELECT DATE(created_at) as date, COUNT(*) as count
FROM invoices_invoices
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC
```

## Join Patterns

### One-to-Many (Account to Invoices)
```sql
SELECT a.name, i.id as invoice_id, i.total_amount, i.status
FROM accounts_sequence_accounts a
JOIN invoices_invoices i ON i.account_id = a.id
WHERE a.id = '<uuid>'
ORDER BY i.created_at DESC
LIMIT 50
```

### Invoice with Line Items
```sql
SELECT i.id as invoice_id, i.status, li.description, li.amount
FROM invoices_invoices i
JOIN invoices_line_items li ON li.invoice_id = i.id
WHERE i.account_id = '<uuid>'
ORDER BY i.created_at DESC
LIMIT 50
```

### LEFT JOIN (Include Missing)
```sql
SELECT a.id, a.name, COUNT(i.id) as invoice_count
FROM accounts_sequence_accounts a
LEFT JOIN invoices_invoices i ON i.account_id = a.id
WHERE a.created_at > NOW() - INTERVAL '30 days'
GROUP BY a.id, a.name
ORDER BY invoice_count DESC
LIMIT 50
```

## Subquery Patterns

### Correlated Subquery
```sql
SELECT a.*
FROM accounts_sequence_accounts a
WHERE EXISTS (
  SELECT 1 FROM invoices_invoices i
  WHERE i.account_id = a.id
    AND i.status = 'failed'
)
LIMIT 50
```

### IN Subquery
```sql
SELECT * FROM invoices_invoices
WHERE account_id IN (
  SELECT id FROM accounts_sequence_accounts
  WHERE status = 'active'
)
LIMIT 100
```

## CTE (Common Table Expression) Patterns

### Simple CTE
```sql
WITH recent_invoices AS (
  SELECT * FROM invoices_invoices
  WHERE created_at > NOW() - INTERVAL '30 days'
)
SELECT account_id, COUNT(*) as count, SUM(total_amount) as total
FROM recent_invoices
GROUP BY account_id
ORDER BY total DESC
LIMIT 20
```

### Multiple CTEs
```sql
WITH
failed_invoices AS (
  SELECT * FROM invoices_invoices WHERE status = 'failed'
),
failed_accounts AS (
  SELECT DISTINCT account_id FROM failed_invoices
)
SELECT a.id, a.name, COUNT(fi.id) as failed_count
FROM accounts_sequence_accounts a
JOIN failed_accounts fa ON fa.account_id = a.id
JOIN failed_invoices fi ON fi.account_id = a.id
GROUP BY a.id, a.name
ORDER BY failed_count DESC
LIMIT 20
```

## Performance Investigation

### Check Query Plan
```sql
EXPLAIN ANALYZE
SELECT * FROM invoices_invoices
WHERE account_id = '<uuid>'
LIMIT 10
```

### Find Missing Indexes (Slow Queries)
```sql
EXPLAIN SELECT * FROM invoices_invoices WHERE status = 'pending'
```

## Pagination

### Offset-Based
```sql
SELECT * FROM invoices_invoices ORDER BY created_at DESC LIMIT 100 OFFSET 0

SELECT * FROM invoices_invoices ORDER BY created_at DESC LIMIT 100 OFFSET 100
```

### Keyset Pagination (Better for Large Tables)
```sql
SELECT * FROM invoices_invoices
ORDER BY created_at DESC, id DESC
LIMIT 100

SELECT * FROM invoices_invoices
WHERE (created_at, id) < ('2026-01-15T10:00:00Z', 'last-id')
ORDER BY created_at DESC, id DESC
LIMIT 100
```
