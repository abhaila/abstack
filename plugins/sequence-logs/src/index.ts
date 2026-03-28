import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Logging } from "@google-cloud/logging";
import { z } from "zod";

const PROJECT_MAP = {
  dev: "non-production-339214",
  sandbox: "sandbox-348617",
  production: "production-eu-345914",
} as const;

type Environment = keyof typeof PROJECT_MAP;

const DROPPED_FIELDS = new Set([
  "insertId",
  "receiveTimestamp",
  "logName",
  "@version",
  "level_value",
  "release_tag",
  "thread_name",
  "span_id",
  "trace_flags",
]);

function parseTimeRange(timeRange: string): { start: Date; end: Date } {
  const end = new Date();

  // Check for duration format (e.g., "1h", "30m", "7d")
  const durationMatch = timeRange.match(/^(\d+)([mhd])$/);
  if (durationMatch) {
    const value = parseInt(durationMatch[1], 10);
    const unit = durationMatch[2];
    const ms =
      unit === "m"
        ? value * 60 * 1000
        : unit === "h"
          ? value * 60 * 60 * 1000
          : value * 24 * 60 * 60 * 1000;
    return { start: new Date(end.getTime() - ms), end };
  }

  // Check for ISO timestamp
  const isoDate = new Date(timeRange);
  if (!isNaN(isoDate.getTime())) {
    return { start: isoDate, end };
  }

  // Default to 1 hour
  return { start: new Date(end.getTime() - 60 * 60 * 1000), end };
}

function escapeLogfmtValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  const str = String(value);
  if (str.includes(" ") || str.includes('"') || str.includes("=")) {
    return `"${str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
  }

  return str;
}

function isDateArray(value: unknown): value is number[] {
  return Array.isArray(value) &&
    value.length === 3 &&
    typeof value[0] === "number" &&
    value[0] > 1900 &&
    value[0] < 2100;
}

function flattenObject(
  obj: Record<string, unknown>,
  prefix = ""
): Array<[string, unknown]> {
  const result: Array<[string, unknown]> = [];

  for (const [key, value] of Object.entries(obj)) {
    if (DROPPED_FIELDS.has(key)) continue;

    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (isDateArray(value)) {
      result.push([fullKey, formatDateArray(value)]);
    } else if (Array.isArray(value)) {
      result.push([`${fullKey}.count`, value.length]);
      if (value.length > 0 && typeof value[0] === "object" && value[0] !== null) {
        result.push(...flattenObject(value[0] as Record<string, unknown>, `${fullKey}.0`));
      }
    } else if (value !== null && typeof value === "object") {
      result.push(...flattenObject(value as Record<string, unknown>, fullKey));
    } else {
      result.push([fullKey, value]);
    }
  }

  return result;
}

function formatDateArray(arr: number[]): string {
  if (arr.length === 3) {
    return `${arr[0]}-${String(arr[1]).padStart(2, "0")}-${String(arr[2]).padStart(2, "0")}`;
  }
  return JSON.stringify(arr);
}

interface LogEntry {
  metadata: {
    timestamp?: string;
    severity?: string;
    resource?: {
      labels?: {
        service_name?: string;
      };
    };
  };
  data?: string | Record<string, unknown>;
}

function entryToLogfmt(entry: LogEntry): string {
  const parts: string[] = [];

  const metadata = entry.metadata || {};
  const resourceLabels = metadata.resource?.labels || {};

  // Handle textPayload (string) vs jsonPayload (object)
  const rawData = entry.data;
  const isTextPayload = typeof rawData === "string";
  const data: Record<string, unknown> = isTextPayload ? {} : (rawData as Record<string, unknown>) || {};

  // Core fields first
  const timestamp = (data["@timestamp"] as string) || metadata.timestamp;
  if (timestamp) {
    parts.push(`ts=${escapeLogfmtValue(timestamp)}`);
  }

  const svc = resourceLabels.service_name;
  if (svc) {
    parts.push(`svc=${escapeLogfmtValue(svc)}`);
  }

  const level = data.level || metadata.severity;
  if (level) {
    parts.push(`level=${escapeLogfmtValue(level)}`);
  }

  // For textPayload, use the raw string as the message
  const msg = isTextPayload ? rawData : data.message;
  if (msg) {
    parts.push(`msg=${escapeLogfmtValue(msg)}`);
  }

  // If textPayload, we're done - no additional fields to process
  if (isTextPayload) {
    return parts.join(" ");
  }

  // Logger name (shortened to class name)
  const loggerName = data.logger_name as string | undefined;
  if (loggerName) {
    const shortName = loggerName.split(".").pop() || loggerName;
    parts.push(`logger=${escapeLogfmtValue(shortName)}`);
  }

  // Trace ID
  if (data.trace_id) {
    parts.push(`trace_id=${escapeLogfmtValue(data.trace_id)}`);
  }

  // Account ID (can be either accountId or sequenceAccountId)
  const accountId = data.accountId || data.sequenceAccountId;
  if (accountId) {
    parts.push(`accountId=${escapeLogfmtValue(accountId)}`);
  }

  // Stack trace
  if (data.stack_trace) {
    parts.push(`stack=${escapeLogfmtValue(data.stack_trace)}`);
  }

  // Remaining fields from data
  const skipFields = new Set([
    "@timestamp",
    "message",
    "level",
    "logger_name",
    "trace_id",
    "accountId",
    "sequenceAccountId",
    "stack_trace",
    ...DROPPED_FIELDS,
  ]);

  for (const [key, value] of Object.entries(data)) {
    if (skipFields.has(key)) continue;

    if (Array.isArray(value)) {
      // Check if it's a date array [year, month, day]
      if (value.length === 3 && typeof value[0] === "number" && value[0] > 1900 && value[0] < 2100) {
        parts.push(`${key}=${formatDateArray(value as number[])}`);
      } else if (value.length === 0) {
        parts.push(`${key}=[]`);
      } else if (typeof value[0] !== "object" || value[0] === null) {
        // Array of primitives (strings, numbers, etc.) - output as JSON array
        parts.push(`${key}=${escapeLogfmtValue(JSON.stringify(value))}`);
      } else {
        // Array of objects - show count and flatten first element
        parts.push(`${key}.count=${value.length}`);
        for (const [flatKey, flatValue] of flattenObject(
          value[0] as Record<string, unknown>,
          `${key}.0`
        )) {
          if (Array.isArray(flatValue) && flatValue.length === 3 && typeof flatValue[0] === "number") {
            parts.push(`${flatKey}=${formatDateArray(flatValue as number[])}`);
          } else {
            parts.push(`${flatKey}=${escapeLogfmtValue(flatValue)}`);
          }
        }
      }
    } else if (value !== null && typeof value === "object") {
      for (const [flatKey, flatValue] of flattenObject(
        value as Record<string, unknown>,
        key
      )) {
        if (Array.isArray(flatValue) && flatValue.length === 3 && typeof flatValue[0] === "number" && (flatValue[0] as number) > 1900) {
          parts.push(`${flatKey}=${formatDateArray(flatValue as number[])}`);
        } else {
          parts.push(`${flatKey}=${escapeLogfmtValue(flatValue)}`);
        }
      }
    } else {
      parts.push(`${key}=${escapeLogfmtValue(value)}`);
    }
  }

  return parts.join(" ");
}

async function searchLogs(
  environment: Environment,
  query: string,
  timeRange: string,
  limit: number
): Promise<string> {
  const projectId = PROJECT_MAP[environment];
  const logging = new Logging({ projectId });

  const { start, end } = parseTimeRange(timeRange);

  const filter = `timestamp >= "${start.toISOString()}" AND timestamp <= "${end.toISOString()}" AND (${query})`;

  const [entries] = await logging.getEntries({
    filter,
    pageSize: limit,
    orderBy: "timestamp desc",
  });

  const lines: string[] = [`env=${environment} count=${entries.length}`];

  for (const entry of entries) {
    lines.push(entryToLogfmt(entry as unknown as LogEntry));
  }

  return lines.join("\n");
}

const server = new McpServer({
  name: "sequence-logs",
  version: "1.6.5",
});

server.tool(
  "search_logs",
  `Search GCP Cloud Logging. CRITICAL: Use jsonPayload.level="ERROR" for errors (NOT severity). Use jsonPayload.logger_name=~"package" for logger filtering (NOT logger, and use =~ not :). Example: jsonPayload.logger_name=~"com.sequencehq.billing" AND jsonPayload.level="ERROR"`,
  {
    environment: z
      .enum(["dev", "sandbox", "production"])
      .describe("Target environment to query"),
    query: z
      .string()
      .describe('GCP filter syntax. Use jsonPayload.level="ERROR" for errors, jsonPayload.logger_name=~"package" for logger. Example: jsonPayload.logger_name=~"com.sequencehq" AND jsonPayload.level="ERROR"'),
    timeRange: z
      .string()
      .optional()
      .default("1h")
      .describe("Duration (1h, 30m, 7d) or ISO timestamp. Default: 1h"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .default(5)
      .describe("Maximum log entries to return. Default: 5, Max: 50"),
  },
  async ({ environment, query, timeRange, limit }) => {
    try {
      const result = await searchLogs(
        environment as Environment,
        query,
        timeRange ?? "1h",
        limit ?? 5
      );
      return { content: [{ type: "text", text: result }] };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        content: [{ type: "text", text: `error=true msg=${escapeLogfmtValue(message)}` }],
        isError: true,
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
