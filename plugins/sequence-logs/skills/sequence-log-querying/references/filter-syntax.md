# GCP Cloud Logging Filter Syntax Reference

Complete reference for GCP Cloud Logging query language.

## Basic Structure

Filters consist of expressions combined with boolean operators:

```
<field> <operator> <value>
<expression> AND <expression>
<expression> OR <expression>
NOT <expression>
(<expression>)
```

## Field Paths

### Log Entry Fields

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | string | Log entry timestamp (ISO 8601) |
| `severity` | enum | Log severity level |
| `resource.type` | string | Resource type (e.g., "cloud_run_revision") |
| `resource.labels.<key>` | string | Resource labels |
| `logName` | string | Full log name path |
| `textPayload` | string | Plain text log content |
| `jsonPayload` | object | Structured JSON log content |
| `labels.<key>` | string | User-defined labels |
| `trace` | string | Cloud Trace ID |
| `spanId` | string | Cloud Trace span ID |
| `insertId` | string | Unique entry ID |

### JSON Payload Fields

Access nested fields with dot notation:

```
jsonPayload.message
jsonPayload.level
jsonPayload.accountId
jsonPayload.trace_id
jsonPayload.stack_trace
jsonPayload.logger_name
jsonPayload.nested.field.path
```

**Note**: Use snake_case for all field names in queries (e.g., `trace_id`, `logger_name`, `stack_trace`). The logfmt output may display some fields in camelCase, but queries must use the actual storage format which is snake_case.

### Resource Labels

Common resource labels for Cloud Run:

```
resource.labels.service_name      # Service name
resource.labels.revision_name     # Revision name
resource.labels.location          # Region
resource.labels.configuration_name
```

## Operators

### Comparison Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `=` | Equals | `severity=ERROR` |
| `!=` | Not equals | `severity!=DEBUG` |
| `>` | Greater than | `timestamp>"2026-01-20T00:00:00Z"` |
| `>=` | Greater or equal | `severity>=WARNING` |
| `<` | Less than | `timestamp<"2026-01-21T00:00:00Z"` |
| `<=` | Less or equal | `severity<=INFO` |
| `:` | Contains/has | `jsonPayload.message:"error"` |
| `=~` | Regex match | `jsonPayload.message=~"error.*timeout"` |
| `!~` | Regex not match | `jsonPayload.message!~"health.*check"` |

### Boolean Operators

| Operator | Description |
|----------|-------------|
| `AND` | Both conditions must be true |
| `OR` | Either condition must be true |
| `NOT` | Negates the condition |

Precedence: `NOT` > `AND` > `OR`. Use parentheses to control order.

### Contains Operator (`:`)

The `:` operator performs substring matching:

```
jsonPayload.message:"timeout"        # Contains "timeout"
jsonPayload.message:"connection"     # Contains "connection"
textPayload:"exception"              # Text contains "exception"
```

For JSON fields, `:` also checks if a field exists:

```
jsonPayload.stack_trace:*           # Has stack_trace field
jsonPayload.accountId:*             # Has accountId field
```

### Regular Expressions

Use `=~` for regex matching:

```
jsonPayload.message=~"error.*database"
jsonPayload.accountId=~"0195a3a5-.*"
resource.labels.service_name=~"(web|api)"
```

Use `!~` for negative regex:

```
jsonPayload.message!~"health.*check"
```

Regex uses RE2 syntax.

## Severity Levels

Ordered from lowest to highest:

| Level | Numeric | Description |
|-------|---------|-------------|
| `DEFAULT` | 0 | No severity specified |
| `DEBUG` | 100 | Debug information |
| `INFO` | 200 | Routine information |
| `NOTICE` | 300 | Normal but significant |
| `WARNING` | 400 | Warning conditions |
| `ERROR` | 500 | Error conditions |
| `CRITICAL` | 600 | Critical conditions |
| `ALERT` | 700 | Immediate action needed |
| `EMERGENCY` | 800 | System unusable |

Comparison operators work with severity ordering:

```
severity>=ERROR       # ERROR, CRITICAL, ALERT, EMERGENCY
severity>WARNING      # ERROR and above
severity<=INFO        # DEBUG, INFO, DEFAULT
```

## Timestamp Filtering

### ISO 8601 Format

```
timestamp>="2026-01-20T00:00:00Z"
timestamp<"2026-01-21T00:00:00Z"
timestamp>="2026-01-20T10:30:00+00:00"
```

### Relative Time (via tool parameter)

The `search_logs` tool handles relative time via the `timeRange` parameter:

```
timeRange: "1h"   # Last hour
timeRange: "30m"  # Last 30 minutes
timeRange: "7d"   # Last 7 days
```

## Quoting Rules

### String Values

Always quote string values:

```
jsonPayload.accountId="0195a3a5-79ea-7fa4-b901-ea16c15146b7"
resource.labels.service_name="web"
jsonPayload.message:"connection timeout"
```

### Special Characters

Escape quotes inside strings:

```
jsonPayload.message:"said \"hello\""
```

### Numeric Values

Numbers do not need quotes:

```
jsonPayload.statusCode=500
jsonPayload.duration>1000
```

## Global Search

Unqualified strings search all text fields:

```
"NullPointerException"     # Searches everywhere
"billing"                  # Searches everywhere
```

Global search is slower than field-specific queries. Prefer explicit field paths.

## Complex Query Examples

### Multiple Conditions

```
severity>=ERROR AND resource.labels.service_name="web" AND timestamp>="2026-01-20T00:00:00Z"
```

### OR Conditions

```
(resource.labels.service_name="web" OR resource.labels.service_name="api") AND severity>=ERROR
```

### Excluding Patterns

```
severity>=WARNING AND NOT jsonPayload.message:"health check"
```

### Nested Field Access

```
jsonPayload.request.method="POST" AND jsonPayload.request.path:"/api/billing"
```

### Array Fields

GCP Logging does not support direct array indexing. Search for values that appear anywhere in arrays:

```
jsonPayload.tags:"important"        # Array contains "important"
```

### Existence Checks

```
jsonPayload.errorCode:*             # Field exists
NOT jsonPayload.errorCode:*         # Field does not exist
```

## Performance Tips

Filters are evaluated left to right. Place the most selective conditions first:

```
# Good: Specific field first
jsonPayload.accountId="..." AND severity>=ERROR

# Less efficient: Broad condition first
severity>=ERROR AND jsonPayload.accountId="..."
```

Avoid global search when possible:

```
# Slow
"connection timeout"

# Fast
jsonPayload.message:"connection timeout"
```

Use time bounds (handled by `timeRange` parameter) to limit scan scope.

## Common Mistakes

### Missing Quotes

```
# Wrong
jsonPayload.accountId=0195a3a5-79ea-7fa4-b901-ea16c15146b7

# Correct
jsonPayload.accountId="0195a3a5-79ea-7fa4-b901-ea16c15146b7"
```

### Wrong Operator

```
# Wrong: = for substring
jsonPayload.message="timeout"    # Exact match only

# Correct: : for substring
jsonPayload.message:"timeout"    # Contains "timeout"
```

### Case Sensitivity

Field names are case-sensitive:

```
# Wrong
jsonpayload.message:"error"

# Correct
jsonPayload.message:"error"
```

### AND/OR Case

Boolean operators must be uppercase:

```
# Wrong
severity>=ERROR and resource.labels.service_name="web"

# Correct
severity>=ERROR AND resource.labels.service_name="web"
```

## Application-Specific Fields

Common fields in Sequence logs:

| Field | Description |
|-------|-------------|
| `jsonPayload.level` | Application log level (ERROR, WARN, INFO, DEBUG) |
| `jsonPayload.logger_name` | Java logger class (e.g., com.sequencehq.SomeService) |
| `jsonPayload.accountId` | Account UUID |
| `jsonPayload.trace_id` | Distributed trace ID (use snake_case, not camelCase) |
| `jsonPayload.stack_trace` | Exception stack trace |

### Filtering by Logger Name

Use regex (`=~`) to filter by Java package:

```
jsonPayload.logger_name=~"com.sequencehq"                   # All Sequence logs
jsonPayload.logger_name=~"com.sequencehq.core"              # Core package
```

### Filtering by Application Log Level

Use `jsonPayload.level` for application-level filtering:

```
jsonPayload.level="ERROR"    # Application ERROR logs
jsonPayload.level="WARN"     # Application WARN logs
jsonPayload.level="INFO"     # Application INFO logs
```

The GCP `severity` field is set by the logging infrastructure and may not match `jsonPayload.level`. For Sequence application logs, always use `jsonPayload.level`.

### Common Query Patterns

```
# All errors from a package
jsonPayload.logger_name=~"com.sequencehq" AND jsonPayload.level="ERROR"

# Warnings and errors for an account
jsonPayload.accountId="<uuid>" AND (jsonPayload.level="ERROR" OR jsonPayload.level="WARN")

# Logs containing a specific message
jsonPayload.message:"timeout" AND jsonPayload.level="WARN"
```

## External Reference

Full documentation: https://cloud.google.com/logging/docs/view/logging-query-language
