---
name: GCP Log Querying
description: Use when the user explicitly asks to query GCP Cloud Logging, search production/dev/sandbox logs, or investigate errors/traces in cloud environments. Triggers: "search GCP logs", "query cloud logging", "check production logs", "find errors in production/dev/sandbox", "trace request in logs", "investigate logs for [account/service]", "look up error logs in [environment]". DO NOT use for local file searches (use grep), code searches (use code search), or when user specifies a file path. MUST be invoked before using the search_logs MCP tool.
---

# GCP Log Querying

Query GCP Cloud Logging across dev, sandbox, and production environments using the `search_logs` MCP tool.

## Critical Rules - READ BEFORE QUERYING

**NEVER use `severity`** - It does not work. Do not use `severity>=ERROR` or any severity filter.

**ALWAYS use `jsonPayload.level="ERROR"`** - This is the only way to filter by log level.

**ALWAYS use `jsonPayload.logger_name=~`** - Note: the field is `logger_name` (not `logger`), and use `=~` for regex (not `:`).

**ALWAYS use `jsonPayload.trace_id`** - Note: the field is `trace_id` (snake_case), NOT `traceId` (camelCase). The camelCase version appears only in output formatting.

### Correct Query Format

```
jsonPayload.logger_name=~"com.sequencehq.billing" AND jsonPayload.level="ERROR"
```

### Working Examples - USE THESE

```
# Errors in a package
jsonPayload.logger_name=~"com.sequencehq.billing" AND jsonPayload.level="ERROR"

# All errors
jsonPayload.level="ERROR"

# Warnings and errors for an account
jsonPayload.accountId="<uuid>" AND jsonPayload.level="ERROR"

# Logs from a package (any level)
jsonPayload.logger_name=~"com.sequencehq.billing"

# Errors containing a message
jsonPayload.message:"timeout" AND jsonPayload.level="ERROR"

# FREE TEXT SEARCH - when you don't know which field contains the ID
"019991d3-a33a-71d3-9462-9a49f29f0697" AND jsonPayload.level="ERROR"
```

### Free Text Search

When searching for an ID (invoice, billing run, etc.) and you don't know which field it's in, use free text search:

```
# CORRECT - searches across ALL fields
"<uuid>" AND jsonPayload.level="ERROR"

# WRONG - only searches invoiceId field (may not exist)
jsonPayload.invoiceId="<uuid>" AND jsonPayload.level="ERROR"

# WRONG - substring search on message only
jsonPayload.message:"<uuid>" AND jsonPayload.level="ERROR"
```

**Why this matters**: Log entries may store IDs in different fields (`invoiceId`, `billingRunId`, `entityId`, or nested in objects). Free text search finds the ID regardless of which field contains it.

### Common Mistakes - DO NOT DO THESE

```
# WRONG - severity does not work
severity>=ERROR

# WRONG - field is logger_name, not logger
jsonPayload.logger:"com.sequencehq.billing"

# WRONG - use =~ for regex, not :
jsonPayload.logger_name:"com.sequencehq.billing"
```

## Field Name Reference - CRITICAL

GCP log entries use snake_case field names. The logfmt output uses camelCase for display, but queries MUST use snake_case.

### Query Fields (snake_case) vs Output Fields (camelCase)

| Query Field (USE THIS)          | Output Field | Type | Description |
|---------------------------------|--------------|------|-------------|
| `jsonPayload.trace_id`          | `traceId` | string | Distributed trace ID - USE THIS for tracing |
| `jsonPayload.logger_name`       | `logger` | string | Java logger class (shortened in output) |
| `jsonPayload.level`             | `level` | string | Log level: ERROR, WARN, INFO, DEBUG |
| `jsonPayload.accountId`         | `accountId` | string | Account UUID |
| `jsonPayload.sequenceAccountId` | `sequenceAccountId` | string | Account UUID |
| `jsonPayload.message`           | `msg` | string | Log message text |
| `jsonPayload.stack_trace`       | `stack` | string | Exception stack trace (truncated) |
| `resource.labels.service_name`  | `svc` | string | Service: web, worker, api |
| `timestamp`                     | `ts` | timestamp | ISO 8601 timestamp |

### CRITICAL: trace_id vs traceId

```
❌ WRONG - Uses camelCase (does not exist in GCP):
jsonPayload.traceId="6cbd242f1753671907b100ff01671321"

✅ CORRECT - Uses snake_case:
jsonPayload.trace_id="6cbd242f1753671907b100ff01671321"
```

**Why this matters**: The GCP logging backend stores fields in snake_case. The logfmt output formatter converts to camelCase for readability, but queries must use the actual storage format.

## When to Use

Activate this skill when:
- Investigating errors or incidents
- Debugging production issues
- Tracing requests across services
- Finding logs for a specific account or entity
- Checking service health via log patterns

## Progressive Disclosure - Handling Long Traces

A single trace_id can generate hundreds or thousands of log entries. Fetching all logs for a trace may exceed token limits.

### Strategy: Two-Dimensional Progressive Disclosure

Progressive disclosure works on **two axes**:

1. **Log Level Axis**: ERROR → WARN → INFO
2. **Time Proximity Axis**: ±1s → ±1m → ±1h → Full trace

### Finding Traces Across Time

**Problem**: You know the trace_id but don't know when it occurred. Default timeRange is 1h.

**Solution**: Progressively expand the time window until you find the trace.

**Search Pattern for Unknown Trace Timing**:

```
Step 1: Recent search (1h - default)
query: jsonPayload.trace_id="X" AND jsonPayload.level="ERROR"
timeRange: 1h
→ If count=0, trace not in last hour

Step 2: Today (24h)
query: jsonPayload.trace_id="X" AND jsonPayload.level="ERROR"
timeRange: 24h
→ If count=0, trace not today

Step 3: Recent days (48h)
query: jsonPayload.trace_id="X" AND jsonPayload.level="ERROR"
timeRange: 48h
→ If count=0, trace not in last 2 days

Step 4: Past week (7d)
query: jsonPayload.trace_id="X" AND jsonPayload.level="ERROR"
timeRange: 7d
→ If count=0, trace very old or doesn't exist

Step 5: If still not found, try without ERROR filter
query: jsonPayload.trace_id="X"
timeRange: 7d
→ Trace may have no errors
```

**Example - The scenario from feedback**:

```
User: "Look up logs for trace 6cbd242f1753671907b100ff01671321"

Query 1: trace_id + level=ERROR + timeRange:1h
Result: count=0 (trace not in last hour)

Query 2: trace_id + level=ERROR + timeRange:24h
Result: count=0 (trace not today)

Query 3: trace_id + level=ERROR + timeRange:48h
Result: count=5 (found errors 2 days ago!)
→ Errors found at 2026-01-26T09:26:05.981Z

Now proceed to temporal proximity around the error (see next section)
```

**CRITICAL**: When searching for a trace_id:
1. Always start with ERROR level filter
2. If count=0, expand timeRange: 1h → 24h → 48h → 7d
3. Only remove ERROR filter if no results after 7d
4. Once trace found, use temporal proximity to get context around errors

**Never**:
- Start with 24h timeRange without trying 1h first (wastes tokens if trace is recent)
- Remove ERROR filter before expanding timeRange (wastes tokens getting INFO logs)
- Give up after first 0-result query

### Temporal Progressive Disclosure

When user finds an error at timestamp `T`, expand context gradually:

**Level 1: The Error Itself**
```
query: jsonPayload.trace_id="X" AND jsonPayload.level="ERROR"
```
Result: Shows ERROR at timestamp 2026-01-26T10:15:06.855Z

**Level 2: Immediate Context (±1 second)**
```
query: jsonPayload.trace_id="X"
       AND timestamp >= "2026-01-26T10:15:05.855Z"
       AND timestamp <= "2026-01-26T10:15:07.855Z"
```
Shows: What happened in the immediate moment around the error

**Level 3: Near Context (±1 minute)**
```
query: jsonPayload.trace_id="X"
       AND timestamp >= "2026-01-26T10:14:06.855Z"
       AND timestamp <= "2026-01-26T10:16:06.855Z"
```
Shows: Request processing leading up to and after error

**Level 4: Broad Context (±1 hour)**
```
query: jsonPayload.trace_id="X"
       AND timestamp >= "2026-01-26T09:15:06.855Z"
       AND timestamp <= "2026-01-26T11:15:06.855Z"
```
Shows: Full pattern, retries, related requests

**Level 5: Full Trace**
```
query: jsonPayload.trace_id="X"
```
Shows: Everything (only if really needed)

### Combining Both Axes

You can combine log level and time proximity:

**Example: Investigating an error**

1. **Start narrow**: ERROR at specific time
   ```
   jsonPayload.trace_id="X" AND jsonPayload.level="ERROR"
   → Found error at 10:15:06
   ```

2. **Expand temporally first**: All logs ±1 second
   ```
   jsonPayload.trace_id="X"
   AND timestamp >= "10:15:05" AND timestamp <= "10:15:07"
   → Shows immediate context (all levels, 2-second window)
   ```

3. **If still unclear, expand time further**: All logs ±1 minute
   ```
   jsonPayload.trace_id="X"
   AND timestamp >= "10:14:06" AND timestamp <= "10:16:06"
   → Shows request processing (all levels, 2-minute window)
   ```

4. **Last resort**: Full trace, but still filter by level if possible
   ```
   jsonPayload.trace_id="X" AND (jsonPayload.level="ERROR" OR jsonPayload.level="WARN")
   → Removes INFO noise while showing full time span
   ```

### Why Temporal Proximity Matters

**Problem**: A trace spanning 30 minutes might have 10,000 log entries

**Solution**: Most debugging needs only logs near the error:
- 90% of root causes visible within ±1 second
- 95% of root causes visible within ±1 minute
- 99% of root causes visible within ±1 hour

**Token Savings**:
- Full trace: 10,000 entries = 500k-1M tokens ❌
- ±1 second: 10-50 entries = 2k-10k tokens ✅
- ±1 minute: 50-200 entries = 10k-50k tokens ✅

### Practical Example

User: "Investigate error in trace 6cbd242f1753671907b100ff01671321"

**Step 1**: Find the error
```
query: jsonPayload.trace_id="6cbd242f1753671907b100ff01671321" AND jsonPayload.level="ERROR"
limit: 10
```
Result: Error at `2026-01-26T09:26:05.981Z` - "BillingRunInProgressException"

**Step 2**: Get immediate context (±1 second)
```
query: jsonPayload.trace_id="6cbd242f1753671907b100ff01671321"
       AND timestamp >= "2026-01-26T09:26:04.981Z"
       AND timestamp <= "2026-01-26T09:26:06.981Z"
limit: 50
```
Result: 12 logs showing what happened in that exact moment

**Step 3**: If needed, expand to ±1 minute for full request flow
```
query: jsonPayload.trace_id="6cbd242f1753671907b100ff01671321"
       AND timestamp >= "2026-01-26T09:25:05.981Z"
       AND timestamp <= "2026-01-26T09:27:05.981Z"
limit: 100
```
Result: 87 logs showing full request processing

This approach:
- ✅ Finds root cause quickly (±1s context)
- ✅ Uses minimal tokens (2k-10k instead of 500k)
- ✅ Avoids "too many tokens" error
- ✅ Lets user request more context if needed

### Progressive Query Patterns

**For investigating a trace with errors:**

1. **Start with ERRORs only**:
   ```
   query: jsonPayload.trace_id="<id>" AND jsonPayload.level="ERROR"
   limit: 10
   ```
   Result: Identifies error timestamp(s)

2. **Expand temporally around the error** (±1 second):
   ```
   query: jsonPayload.trace_id="<id>"
          AND timestamp >= "<error_time - 1s>"
          AND timestamp <= "<error_time + 1s>"
   limit: 50
   ```
   Result: Immediate context showing what triggered error

3. **If still unclear, expand to ±1 minute**:
   ```
   query: jsonPayload.trace_id="<id>"
          AND timestamp >= "<error_time - 1m>"
          AND timestamp <= "<error_time + 1m>"
   limit: 100
   ```
   Result: Request flow leading to error

4. **For broader pattern, expand to ±1 hour** (with level filter):
   ```
   query: jsonPayload.trace_id="<id>"
          AND (jsonPayload.level="ERROR" OR jsonPayload.level="WARN")
          AND timestamp >= "<error_time - 1h>"
          AND timestamp <= "<error_time + 1h>"
   limit: 100
   ```
   Result: Related errors/warnings in time period

**For investigating a trace without known errors:**

1. **Start with ERRORs in default time window**:
   ```
   query: jsonPayload.trace_id="<id>" AND jsonPayload.level="ERROR"
   timeRange: 1h
   limit: 10
   ```

2. **If no errors, check WARNs**:
   ```
   query: jsonPayload.trace_id="<id>" AND jsonPayload.level="WARN"
   timeRange: 1h
   limit: 50
   ```

3. **If need full picture, use short time window**:
   ```
   query: jsonPayload.trace_id="<id>"
   timeRange: 5m
   limit: 100
   ```

4. **Last resort: Full trace with level filter**:
   ```
   query: jsonPayload.trace_id="<id>"
          AND (jsonPayload.level="ERROR" OR jsonPayload.level="WARN" OR jsonPayload.level="INFO")
   timeRange: 1h
   limit: 200
   ```

### When Trace Has Many Logs

If user asks for "all logs for trace X":

1. **Don't fetch all at once** - this will hit token limits
2. **Start with ERROR filtering**: Show errors first
3. **Ask user**: "Found X errors. Would you like to see WARNs or INFO logs too?"
4. **Segment by time**: If trace spans hours, ask which time window to focus on
5. **Segment by service**: If trace spans multiple services, ask which service to examine

**Example conversation**:
```
User: "Show me all logs for trace 6cbd242f1753671907b100ff01671321"

Claude: "I'll start by checking for errors in this trace."
[Queries with trace_id + level=ERROR]
[Finds 3 errors]

Claude: "Found 3 errors in this trace. Analyzing them now..."
[Shows errors]

Claude: "These errors show X happening. Would you like to see WARNING or INFO logs for additional context?"
```

### Time Window Segmentation

For traces that span a long time period:

```
# If trace spans 2 hours, segment by time:
1. Start: trace_id + level=ERROR + timeRange: 1h (first hour)
2. If needed: trace_id + level=ERROR + timeRange from 1h-2h ago
3. Narrow further based on findings
```

### Extracting Timestamps for Temporal Filtering

When you find an error and want to expand context temporally, extract the timestamp from the logfmt output:

**Example logfmt output:**
```
ts=2026-01-26T09:26:05.981Z svc=worker level=ERROR msg="Failed to process billing run" ...
```

**Extract timestamp:** `2026-01-26T09:26:05.981Z`

**Calculate temporal bounds:**
```
±1 second:
  start: 2026-01-26T09:26:04.981Z
  end:   2026-01-26T09:26:06.981Z

±1 minute:
  start: 2026-01-26T09:25:05.981Z
  end:   2026-01-26T09:27:05.981Z

±1 hour:
  start: 2026-01-26T08:26:05.981Z
  end:   2026-01-26T10:26:05.981Z
```

**Use in query:**
```
jsonPayload.trace_id="<id>"
AND timestamp >= "2026-01-26T09:26:04.981Z"
AND timestamp <= "2026-01-26T09:26:06.981Z"
```

**Important**: Always use ISO 8601 format with timezone (Z for UTC) in timestamp filters.

## Available Tool

**Tool:** `mcp__plugin_sequence-logs_sequence-logs__search_logs`

**Parameters:**
- `environment` (required): `dev`, `sandbox`, or `production`
- `query` (required): GCP Cloud Logging filter syntax
- `timeRange` (optional): Duration (`1h`, `30m`, `7d`) or ISO timestamp. Default: `1h`
- `limit` (optional): Max entries 1-200. Default: 50

## Environment Selection

| Environment | Project | Use Case |
|-------------|---------|----------|
| `dev` | non-production-339214 | Development testing, feature work |
| `sandbox` | sandbox-348617 | Integration testing, demos |
| `production` | production-eu-345914 | Live issues, incident investigation |

Start with `production` for incident investigation. Use `dev` or `sandbox` for development debugging.

## Handling "Too Many Tokens" Error

### The Error

When MCP returns:
```
Error: result (90,368 characters) exceeds maximum allowed tokens.
Output has been saved to /Users/alen/.claude/projects/.../tool-results/...
```

This means: **Your query was too broad and returned too much data.**

### WRONG Response

```
❌ Claude tries to read the output file
❌ Claude tries to grep the output file
❌ Claude asks user to look at the file
❌ Claude tries to process the file locally
```

### CORRECT Response

```
✅ Claude recognizes query was too broad
✅ Claude refines query to be more specific
✅ Claude adds filters to reduce result size
✅ Claude never mentions or touches the output file
```

### Automatic Query Refinement Pattern

When you see "exceeds maximum allowed tokens":

1. **Identify refinement strategy** (try in order):

   **Option A: Add level filter**
   - If querying by trace_id → Add `AND jsonPayload.level="ERROR"`
   - If querying by accountId → Add `AND jsonPayload.level="ERROR"`
   - If querying by logger_name → Add `AND jsonPayload.level="ERROR"`

   **Option B: Add temporal bounds**
   - If trace has errors, use temporal proximity: `timestamp >= <error_time - 1m> AND timestamp <= <error_time + 1m>`
   - If no specific time known, narrow time window: `timeRange: 1h` → `timeRange: 15m`

   **Option C: Combine both**
   - Level filter + temporal bounds for maximum reduction
   - Example: `trace_id + level=ERROR + timestamp within ±1m`

2. **Apply refinement immediately**:
   ```
   # Original query (too broad):
   jsonPayload.trace_id="6cbd242f1753671907b100ff01671321"
   limit: 200
   → Error: Too many tokens

   # Refinement Strategy 1: Add level filter
   jsonPayload.trace_id="6cbd242f1753671907b100ff01671321" AND jsonPayload.level="ERROR"
   limit: 50
   → Result: 5 errors found at various timestamps

   # If still too many, Refinement Strategy 2: Add temporal bounds around first error
   jsonPayload.trace_id="6cbd242f1753671907b100ff01671321"
   AND timestamp >= "2026-01-26T09:25:05Z" AND timestamp <= "2026-01-26T09:27:05Z"
   limit: 100
   → Result: 87 logs in 2-minute window
   ```

3. **Explain to user**:
   ```
   "The trace has many logs (exceeded token limit). I'll start by showing ERRORs first."
   [Execute refined query]

   Or if temporal filtering:
   "The trace spans a long time. I'll focus on logs around the error at 09:26:05 (±1 minute)."
   [Execute temporally-bounded query]
   ```

### Examples

**Scenario 1: Trace with thousands of logs**
```
Initial query:
  jsonPayload.trace_id="abc123"

Error: Too many tokens (trace spans 2 hours, 5000+ logs)

Refined query #1 - Add level filter:
  jsonPayload.trace_id="abc123" AND jsonPayload.level="ERROR"

Result: 3 errors found at timestamps: 10:15:06, 10:18:22, 10:45:33

Refined query #2 - Temporal proximity around first error (±1 minute):
  jsonPayload.trace_id="abc123"
  AND timestamp >= "2026-01-26T10:14:06Z"
  AND timestamp <= "2026-01-26T10:16:06Z"
  limit: 100

Result: 87 logs showing context around first error
```

**Scenario 2: Account with many errors over 24 hours**
```
Initial query:
  jsonPayload.accountId="uuid" AND jsonPayload.level="ERROR"
  timeRange: 24h

Error: Too many tokens (200+ errors in 24 hours)

Refined query #1 - Narrow time window:
  jsonPayload.accountId="uuid" AND jsonPayload.level="ERROR"
  timeRange: 1h

Result: 8 errors in last hour

Refined query #2 - Add service filter if still too many:
  jsonPayload.accountId="uuid" AND jsonPayload.level="ERROR"
  AND resource.labels.service_name="worker"
  timeRange: 1h

Result: 3 errors from worker service
```

**Scenario 3: Package with many logs**
```
Initial query:
  jsonPayload.logger_name=~"com.sequencehq.billing"

Error: Too many tokens (billing package is very active)

Refined query #1 - Add level filter + time window:
  jsonPayload.logger_name=~"com.sequencehq.billing" AND jsonPayload.level="ERROR"
  timeRange: 1h
  limit: 50

Result: 12 errors in last hour

Refined query #2 - If investigating specific issue, add temporal bounds:
  jsonPayload.logger_name=~"com.sequencehq.billing" AND jsonPayload.level="ERROR"
  AND timestamp >= "2026-01-26T09:00:00Z"
  AND timestamp <= "2026-01-26T09:15:00Z"
  limit: 50

Result: 4 errors in specific 15-minute window
```

**Scenario 4: Long-running trace (the example from user feedback)**
```
Initial query:
  jsonPayload.trace_id="6cbd242f1753671907b100ff01671321"
  timeRange: 24h
  limit: 200

Error: result (90,368 characters) exceeds maximum allowed tokens

Refined query #1 - Find errors first:
  jsonPayload.trace_id="6cbd242f1753671907b100ff01671321"
  AND jsonPayload.level="ERROR"

Result: 5 errors, earliest at 09:26:05.981Z

Refined query #2 - Temporal proximity (±1 second) around first error:
  jsonPayload.trace_id="6cbd242f1753671907b100ff01671321"
  AND timestamp >= "2026-01-26T09:26:04.981Z"
  AND timestamp <= "2026-01-26T09:26:06.981Z"

Result: 8 logs showing immediate error context

Refined query #3 - If need more context, expand to ±1 minute:
  jsonPayload.trace_id="6cbd242f1753671907b100ff01671321"
  AND timestamp >= "2026-01-26T09:25:05.981Z"
  AND timestamp <= "2026-01-26T09:27:05.981Z"
  limit: 100

Result: 92 logs showing full request flow around error

✅ Never tries to read the output file
✅ Automatically refines with temporal bounds
✅ Gets to root cause with minimal tokens
```

### Response Template

When encountering "too many tokens" error:

```
"The query returned too many results (exceeded token limit). I'll refine it to show [ERROR logs / recent errors / specific service] first."

[Execute refined query with added filters]
```

**Never say**:
- "The results were saved to a file"
- "Let me read the output file"
- "Let me grep the results"
- "Would you like me to process the file?"

## Query Syntax Essentials

GCP Cloud Logging uses a filter language. Build queries by combining conditions with `AND` and `OR`.

### Filtering by Log Level

For application logs (JSON payload), use `jsonPayload.level`:

```
jsonPayload.level="ERROR"                  # Application-level ERROR
jsonPayload.level="WARN"                   # Application-level WARN
jsonPayload.level="INFO"                   # Application-level INFO
```

The GCP `severity` field is different from `jsonPayload.level`. For Sequence logs, always use `jsonPayload.level`.

### Filtering by Logger Name (Package/Class)

Use regex (`=~`) to filter by Java package or class name:

```
jsonPayload.logger_name=~"com.sequencehq"                   # All Sequence logs
jsonPayload.logger_name=~"com.sequencehq.core"              # Core package
jsonPayload.logger_name="com.sequencehq.SomeService"        # Exact class
```

### JSON Payload Fields

Access log data via `jsonPayload`:

```
jsonPayload.accountId="0195a3a5-79ea-7fa4-b901-ea16c15146b7"
jsonPayload.message:"timeout"                               # Contains
jsonPayload.trace_id="69746fa4000000001bdec61ad30b0053"
jsonPayload.billingRunId="..."
jsonPayload.invoiceId="..."
```

### Service Filtering

```
resource.labels.service_name="web"
resource.labels.service_name="worker"
resource.labels.service_name="api"
```

### Combining Conditions

```
jsonPayload.logger_name=~"com.sequencehq" AND jsonPayload.level="ERROR"
jsonPayload.accountId="..." AND jsonPayload.level="WARN"
jsonPayload.logger_name=~"core" AND jsonPayload.message:"timeout"
```

## Query Strategy - Filter in MCP, Never Post-Process

The search_logs MCP tool supports up to 200 log entries. Each entry can be 100-500 tokens.

### The Token Cost Problem

| Result Count | Token Cost | Risk Level |
|--------------|-----------|------------|
| 1-20 entries | 2k-10k | ✅ Good |
| 20-50 entries | 10k-25k | ✅ Acceptable |
| 50-100 entries | 25k-50k | ⚠️ High - consider narrowing |
| 100-200 entries | 50k-100k | ❌ Excessive - must narrow |

**When query returns 100+ entries**: This indicates the query is too broad. Refine it before analyzing.

### Filter Selectivity Hierarchy

Prioritize filters by how much they reduce results (most selective first):

1. **Exact match filters** (most selective):
   - `jsonPayload.accountId="<uuid>"` - reduces to single account
   - `jsonPayload.trace_id="<trace-id>"` - reduces to single trace
   - `resource.labels.service_name="worker"` - reduces to single service

2. **Time-bound filters** (highly selective):
   - `timeRange: "15m"` - last 15 minutes
   - `timeRange: "1h"` - last hour

3. **Log level filters** (moderately selective):
   - `jsonPayload.level="ERROR"` - reduces by ~90-95%
   - `jsonPayload.level="WARN"` - reduces by ~80-90%

4. **Pattern filters** (least selective):
   - `jsonPayload.logger_name=~"com.sequencehq.billing"` - package prefix
   - `jsonPayload.message:"timeout"` - message substring

### Combining Filters

Always combine multiple filters to narrow results:

```
# Good - combines 3 filters:
jsonPayload.accountId="uuid" AND jsonPayload.level="ERROR" AND resource.labels.service_name="worker"
timeRange: 1h

# Bad - single broad filter:
jsonPayload.level="ERROR"
timeRange: 24h
```

### NEVER Post-Process Results

```
❌ WRONG Pattern:
1. Fetch jsonPayload.level="ERROR" (200 results)
2. Grep output for "timeout"
3. Filter for specific accountId
4. Process in Claude
Result: 50k tokens wasted, slow, error-prone

✅ RIGHT Pattern:
1. Fetch jsonPayload.level="ERROR" AND jsonPayload.message:"timeout" AND jsonPayload.accountId="uuid"
Result: 10 results, 2k tokens, fast, accurate
```

### Query Refinement Decision Tree

```
User asks for logs
  ↓
Do they provide trace_id?
  Yes → Use trace_id + level=ERROR
  No ↓
Do they provide accountId?
  Yes → Use accountId + level=ERROR + timeRange:1h
  No ↓
Do they provide service name?
  Yes → Use service_name + level=ERROR + timeRange:1h
  No ↓
Do they provide logger/package?
  Yes → Use logger_name + level=ERROR + timeRange:1h
  No ↓
Ask user for more specificity:
  "Which environment, account, service, or time window should I search?"
```

## Common Query Patterns

### Errors in a Package

```
query: jsonPayload.logger_name=~"com.sequencehq" AND jsonPayload.level="ERROR"
timeRange: 1h
```

### Find Errors for an Account

```
query: jsonPayload.accountId="<uuid>" AND jsonPayload.level="ERROR"
timeRange: 1h
```

### Trace a Request

```
query: jsonPayload.trace_id="<trace-id>"
timeRange: 24h
limit: 100
```

### Service Errors

```
query: resource.labels.service_name="worker" AND jsonPayload.level="ERROR"
timeRange: 30m
```

### Search by Message Content

```
query: jsonPayload.message:"timeout" AND jsonPayload.level="WARN"
timeRange: 2h
```

### Stack Traces

```
query: jsonPayload.stack_trace:"IllegalArgumentException"
timeRange: 1h
```

### Free Text Search (Unknown Field)

When you have an ID but don't know which field contains it:

```
query: "<uuid>" AND jsonPayload.level="ERROR"
timeRange: 24h
```

### All Logs from a Package

```
query: jsonPayload.logger_name=~"com.sequencehq.billing"
timeRange: 30m
limit: 50
```

## Response Format

Results return in logfmt format for token efficiency:

```
env=production count=3
ts=2026-01-24T07:07:16.593Z svc=web level=ERROR msg="Unhandled error" accountId=... traceId=...
ts=2026-01-24T07:06:12.123Z svc=worker level=ERROR msg="Connection timeout" ...
```

**Key fields:**
- `ts` - Timestamp
- `svc` - Service name
- `level` - Log level
- `msg` - Log message
- `accountId` - Account identifier
- `traceId` - Distributed trace ID
- `logger` - Logger class name (shortened)
- `stack` - Stack trace (truncated to 500 chars)

Nested objects are flattened with dots: `servicePeriod.from=2026-01-01`

Arrays show count and first item: `items.count=3 items.0.title="Voided Checks"`

## Workflow

1. **Clarify the target**: Ask user for environment, time window, and key identifier (accountId, trace_id, service)

2. **Start specific**: Begin with the most selective filters available
   - If user provides trace_id → Use trace_id + level=ERROR
   - If user provides accountId → Use accountId + level=ERROR + timeRange:1h
   - If investigating service → Use service_name + level=ERROR + timeRange:1h
   - Default time window: 1h (expand to 24h only if needed)

3. **Execute and evaluate**: Run query, check result count
   - **0 results**:
     - If searching by trace_id: Expand timeRange (1h → 24h → 48h → 7d)
     - If searching by accountId/service: Try WARN level, or expand time
     - Only remove ERROR filter after trying all time windows
   - **1-50 results**: Perfect - analyze directly
   - **50-100 results**: Consider adding filter (time, service, level)
   - **100-200 results**: Too broad - MUST add filters before analyzing
   - **"Too many tokens" error**: Immediately refine query with additional filters

4. **Progressive disclosure for traces**: If investigating a trace:
   - Start with ERROR level only
   - If user needs more context, add WARN level
   - If still need more, remove level filter but narrow time window
   - Never fetch all logs for a trace at once

5. **Follow traces across services**: Use trace_id from results to follow request flow:
   ```
   # Find the trace_id from an error:
   jsonPayload.accountId="uuid" AND jsonPayload.level="ERROR"

   # Then follow the full trace:
   jsonPayload.trace_id="<id-from-result>" AND jsonPayload.level="ERROR"
   ```

6. **Never post-process**: Always refine the query instead of filtering results locally
   - Don't grep output
   - Don't ask user to filter results
   - Don't read saved result files
   - Don't process results in Claude to narrow them

### Example: Right Workflow

```
User: "Find errors for account 0195a3a5-79ea-7fa4-b901-ea16c15146b7"

Claude: [Queries]
  query: jsonPayload.accountId="0195a3a5-79ea-7fa4-b901-ea16c15146b7" AND jsonPayload.level="ERROR"
  timeRange: 1h
  limit: 50

Result: 3 errors found

Claude: "Found 3 errors in the last hour for this account. Analyzing..."
[Shows 3 errors directly]
```

### Example: Wrong Workflow

```
User: "Find errors for account 0195a3a5-79ea-7fa4-b901-ea16c15146b7"

Claude: [Queries]
  query: jsonPayload.level="ERROR"  ❌ Too broad
  timeRange: 24h                     ❌ Too long
  limit: 200                         ❌ Too many

Result: 200 errors (50k tokens)

Claude: "Let me filter these for your account..."  ❌ Post-processing
[Greps through 200 results]  ❌ Wasting tokens
```

## Error Handling

Common errors and responses:

**Permission denied**: User lacks `roles/logging.viewer` on the project. Run `gcloud auth application-default login` and verify IAM permissions.

**Invalid filter**: Check filter syntax. Strings must be quoted. Field names are case-sensitive.

**No results**:
- For trace_id queries: Expand timeRange systematically (1h → 24h → 48h → 7d) while keeping ERROR filter
- For other queries: Relax filters (try WARN, expand time, remove service filter) or check environment is correct

## Tips

- Use `jsonPayload.level="ERROR"` for application log level, not `severity>=ERROR`
- Use `=~` for regex matching on logger names: `jsonPayload.logger_name=~"com.sequencehq.billing"`
- **Always use `jsonPayload.trace_id` (snake_case), NOT `traceId` (camelCase)** - the camelCase version only appears in output
- Always quote string values: `jsonPayload.accountId="uuid"` not `jsonPayload.accountId=uuid`
- Use `:` for substring matching: `jsonPayload.message:"error"` finds "Connection error occurred"
- Use `=` for exact matching, `=~` for regex matching
- Combine with `AND`/`OR` (uppercase)
- Start with small limits (20-50) then increase if needed
- Check `count` in response to gauge result volume
- **When "too many tokens" error occurs**: Immediately refine query with additional filters (level, time, service) - never try to read the output file
- **For long traces**: Use progressive disclosure - start with ERROR level, then expand temporally (±1s, ±1m) around errors instead of fetching all logs at once
- **When searching by trace_id with 0 results**: Don't give up - expand timeRange systematically (1h → 24h → 48h → 7d) before removing ERROR filter

## Additional Resources

### Reference Files

For complete filter syntax and operators, consult:
- **`references/filter-syntax.md`** - Full GCP Cloud Logging filter syntax reference

## Prerequisites

Users must have:
- Google Cloud SDK installed
- Application Default Credentials configured: `gcloud auth application-default login`
- `roles/logging.viewer` permission on target projects
