---
name: sql-query-analysis
description: Systematically analyze SQL query performance by tracing call paths, generating concrete examples, analyzing query plans, and suggesting targeted improvements
trigger: Use when analyzing slow database queries, investigating query performance issues, or when user provides a parameterized SQL query for optimization
---

# SQL Query Performance Analysis

A systematic approach to analyzing and optimizing SQL queries by understanding execution flow, generating concrete examples, and providing evidence-based recommendations.

## Overview

This skill follows a disciplined, multi-phase approach:
1. **Call Path Analysis** - Find where the query originates
2. **Concrete Example Generation** - Create runnable SQL with real parameters
3. **Query Plan Analysis** - Systematic bottleneck identification
4. **Evidence-Based Recommendations** - Targeted improvements with expected impact

**Critical Rule**: NEVER suggest optimizations before analyzing the actual query plan. Always wait for execution evidence.

---

## Phase 1: Query Discovery & Call Path Analysis

When the user provides a parameterized SQL query, analyze the codebase to understand its context.

### Step 1.1: Identify the Query Location

Use Grep to search for distinctive patterns from the query:

```kotlin
// Search for unique table combinations
Grep: "revenue_recognition_journals.*revenue_recognition_journal_entries"

// Search for specific aggregation patterns
Grep: "SUM.*CASE.*balance_type"

// Search for GROUP BY patterns
Grep: "groupBy.*ledgerAccountTable.*journalEntryTable"
```

**Key files to check**:
- Repository implementations (`*Repository.kt`)
- SQL builder classes (`*SqlBuilder.kt`)
- Exposed DSL query builders (`ExposedDsl*.kt`)

### Step 1.2: Trace the Execution Flow

Once you find the query, document the complete call chain:

```
API Endpoint → Handler → Use Case/Service → Repository → SQL Query
```

**Example**:
```
GET /api/revenue/charts/data
  ↓
RevenueChartsEndpoint.handler()
  ↓
RevenueChartsDataReader.getData()
  ↓
JournalsRepository.getRevenueChartsAggregation()
  ↓
SQL Query (Exposed DSL → PostgreSQL)
```

### Step 1.3: Document Query Purpose

Explain:
- **What** the query does
- **Why** it exists (business purpose)
- **When** it's called (frequency, triggers)
- **Who** uses it (endpoints, features)

---

## Phase 2: Concrete Example Generation

### Step 2.1: Gather Required Parameters

**ALWAYS ask the user for parameters before generating examples**. Never assume or fabricate values.

Required information:
- UUIDs (ledger_id, account_id, product_ids, customer_ids)
- Date ranges
- Filter values (journal types, account names)
- Any other parameterized values ($1, $2, etc.)

**Example prompt**:
```
To generate a concrete SQL example, I need:
1. ledger_id - Run: SELECT id FROM revenue_recognition_ledgers LIMIT 5;
2. sequence_account_id - Run: SELECT DISTINCT sequence_account_id FROM revenue_recognition_journals LIMIT 5;
3. Date range (or I'll use a default)
4. Any specific filters? (products, customers, invoices)
```

### Step 2.2: Create Parameter Mapping Table

Document what each parameter represents:

| Parameter | Value | Description |
|-----------|-------|-------------|
| `$1` | ledger_id | The ledger UUID |
| `$2` | sequence_account_id | The account UUID |
| `$3-$6` | Account names | RECOGNIZED_REVENUE, etc. |
| `$7-$8` | Date range | Start and end dates |
| `$9-$N` | Filters | Optional filters (TRUE if unused) |

### Step 2.3: Generate Concrete SQL

Replace all parameters with actual values:

```sql
-- Concrete example with real parameters
SELECT
  ...
FROM
  revenue_recognition_journals
WHERE
  ledger_id = '0191db9e-9ea9-72ae-8369-c1855ebfcd6a'::uuid  -- $1
  AND sequence_account_id = '0191db9e-9995-7ad0-9c3a-567f81f2f635'::uuid  -- $2
  AND date BETWEEN '2024-01-09'::date AND '2026-02-09'::date  -- $3, $4
  AND TRUE  -- $5: optional filter
  ...
```

### Step 2.4: Provide Query Variations

Show examples with filters applied:

```sql
-- Example 1: No filters (baseline)
-- Example 2: Filter by journal type (SYSTEM only)
-- Example 3: Filter by specific product
-- Example 4: Combined filters
```

---

## Phase 3: Wait for Query Plan (CRITICAL CHECKPOINT)

**STOP HERE**. Do NOT proceed to recommendations until the user provides the query plan.

Instruct the user:
```
Please run this query with EXPLAIN ANALYZE on your database:

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
<your concrete SQL query>;

Paste the complete query plan output, and I'll analyze it for bottlenecks.
```

**Why this is critical**:
- Prevents premature optimization
- Ensures recommendations are evidence-based
- Respects the "measure first, optimize second" principle
- Avoids wasted effort on non-issues

---

## Phase 4: Query Plan Analysis (After Receiving Plan)

### Step 4.1: Extract Key Metrics

Document the current state:

```
Execution Time: X seconds
Rows Returned: N rows
Rows Scanned: M rows (journals), P rows (entries)
Scan Methods: Seq Scan, Index Scan, etc.
Sort Methods: quicksort (memory), external merge (disk)
Workers: N parallel workers
```

### Step 4.2: Identify Bottlenecks

**Systematically analyze each operation** in the query plan:

#### Look for Sequential Scans
```
Seq Scan on table_name
  Cost: XXXXX
  Rows: XXXXX
  Filter: ...
  Rows Removed by Filter: XXXXX  ← RED FLAG
```

**Red flags**:
- High cost (> 10,000)
- Large "Rows Removed by Filter" (> 10% of scanned)
- No index usage on filtered columns

#### Look for Disk Sorts
```
Sort Method: external merge  Disk: XXXXkB  ← RED FLAG
```

**Red flag**: Any disk-based sorting indicates memory pressure.

#### Look for Hash Join Issues
```
Hash Join
  Batches: 8 (originally 1)  ← RED FLAG
  Memory Usage: XXXXkB
```

**Red flag**: Batches > 1 indicates hash table doesn't fit in memory.

### Step 4.3: Calculate Wasted Work

For each bottleneck, quantify the waste:

```
Table: revenue_recognition_journals
- Total rows scanned: 1,750,000
- Rows after filter: 370,000
- Rows rejected: 1,380,000 (79% wasted)
- Estimated I/O waste: ~100MB read unnecessarily
```

### Step 4.4: Identify Root Causes

Common root causes:
- **Missing indexes** on filter columns
- **Insufficient work_mem** causing disk sorts
- **Outdated statistics** causing poor query plans
- **Poor index selectivity** (table needs VACUUM ANALYZE)
- **Query structure issues** (rare - usually index problem)

---

## Phase 5: Evidence-Based Recommendations

### Step 5.1: Prioritize Issues

Rank bottlenecks by impact:

1. **Critical** (> 50% of execution time): Sequential scans on large tables
2. **High** (20-50% of time): Disk sorts, inefficient joins
3. **Medium** (10-20% of time): Suboptimal indexes
4. **Low** (< 10% of time): Minor optimizations

### Step 5.2: Provide Targeted Index Recommendations

For each critical bottleneck, provide:

1. **Concrete index definition**:
```sql
CREATE INDEX CONCURRENTLY idx_name
ON table_name (column1, column2, column3)
WHERE deleted_at IS NULL;
```

2. **Rationale**: Why this index helps
3. **Expected impact**: Time reduction estimate
4. **Trade-offs**: Write performance, disk space

**Index Design Principles**:
- Put equality filters first in index
- Put range filters last
- Use WHERE clause for partial indexes
- Use INCLUDE for covering indexes
- Always use CONCURRENTLY in production

### Step 5.3: Provide Performance Projections

**Before/After Comparison**:

```
BEFORE (Current):
- Execution Time: 6,300ms
- Scan Method: Sequential Scan
- Rows Scanned: 10M entries + 5M journals
- Wasted I/O: ~80% of reads

AFTER (With Indexes):
- Execution Time: ~300-600ms (10-20x faster)
- Scan Method: Index Scan
- Rows Scanned: Only matched rows
- Wasted I/O: <5% of reads
```

### Step 5.4: Provide Implementation Steps

```sql
-- Step 1: Create the most critical index
CREATE INDEX CONCURRENTLY idx_journals_aggregation
ON revenue_recognition_journals (...);

-- Step 2: Monitor index creation
SELECT phase, round(100.0 * blocks_done / nullif(blocks_total, 0), 1) AS "% Complete"
FROM pg_stat_progress_create_index;

-- Step 3: Update statistics
ANALYZE table_name;

-- Step 4: Verify index usage
EXPLAIN (ANALYZE, BUFFERS)
<query>;
```

### Step 5.5: Provide Verification Checklist

After implementing changes, verify:

```
✅ Index appears in query plan (Index Scan, not Seq Scan)
✅ "Rows Removed by Filter" drastically reduced
✅ Execution time meets target (< 1 second for interactive queries)
✅ No performance regression on writes
✅ Disk space usage acceptable
```

---

## Phase 6: Follow-Up Analysis (Optional)

If the user provides a new query plan after changes:

1. **Compare metrics** (before/after table)
2. **Verify improvements** match predictions
3. **Identify remaining bottlenecks** (if any)
4. **Suggest further optimizations** if needed

---

## Red Flags - STOP and Reassess

If you encounter these, pause and clarify with the user:

- **User wants recommendations without query plan**: Refuse politely, explain need for evidence
- **Multiple bottlenecks of similar magnitude**: Ask which to prioritize
- **Query plan shows different behavior than expected**: Verify parameters match production
- **Recommended index already exists**: Check why it's not being used (statistics, query structure)
- **User asks to "just add all indexes"**: Explain trade-offs, suggest incremental approach

---

## Anti-Patterns to Avoid

❌ **Don't**: Suggest indexes before seeing the query plan
✅ **Do**: Wait for execution evidence

❌ **Don't**: Make assumptions about parameter values
✅ **Do**: Ask the user for real production values

❌ **Don't**: Suggest "try this and see if it works"
✅ **Do**: Explain why each recommendation will help

❌ **Don't**: Provide generic advice ("add indexes", "tune work_mem")
✅ **Do**: Provide specific, actionable commands with rationale

❌ **Don't**: Ignore trade-offs (write performance, disk space)
✅ **Do**: Discuss costs and benefits of each recommendation

❌ **Don't**: Suggest rewriting the query without understanding context
✅ **Do**: Respect the existing query structure unless clearly problematic

---

## Example Session Flow

```
USER: [Pastes parameterized SQL query]

ASSISTANT: [Phase 1: Analyzes codebase, finds call path]
"This query is from ExposedDslJournalRepository.getRevenueChartsAggregation()..."

USER: [Provides parameters if asked]

ASSISTANT: [Phase 2: Generates concrete SQL examples]
"Here's the concrete query with your parameters..."

ASSISTANT: [Phase 3: Waits for query plan]
"Please run EXPLAIN ANALYZE and paste the output."

USER: [Runs query, provides execution plan]

ASSISTANT: [Phase 4: Analyzes query plan systematically]
"Bottleneck #1: Sequential scan on journals (3.2s)..."
"Bottleneck #2: Disk sort spilling (1.5s)..."

ASSISTANT: [Phase 5: Provides evidence-based recommendations]
"CREATE INDEX CONCURRENTLY idx_journals_aggregation..."
"Expected improvement: 10-20x faster (6s → 300ms)"

USER: [Creates indexes]

ASSISTANT: [Phase 6: Verifies improvements if user provides new plan]
```

---

## Success Criteria

A successful analysis session achieves:

✅ Clear understanding of query purpose and call path
✅ Concrete, runnable SQL examples
✅ Systematic identification of bottlenecks with evidence
✅ Specific, actionable recommendations with rationale
✅ Performance projections with before/after comparison
✅ Implementation steps with verification checklist

---

## Related Skills

- **superpowers:systematic-debugging** - Root cause investigation principles
- **superpowers:verification-before-completion** - Verify indexes are actually used
- **sequence:kotlin-engineer** - For understanding Kotlin/Exposed query code

---

## Notes

- Always use `CREATE INDEX CONCURRENTLY` to avoid table locks
- Consider index maintenance (REINDEX, VACUUM) in recommendations
- Monitor index usage after creation with pg_stat_user_indexes
- Be conservative with index recommendations (3-5 indexes max per table)
- Discuss index bloat and maintenance strategies for high-write tables
