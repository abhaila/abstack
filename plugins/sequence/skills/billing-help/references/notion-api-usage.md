# Notion API Usage Reference

This document provides detailed specifications for using MCP Notion tools within the billing-help skill.

## Available MCP Tools

### 1. notion-search
**Purpose:** Search for content across the Billing Engine Specification database

**Tool Name:** `mcp__Notion__notion-search`

**Parameters:**
- `query` (string, required): The search query
- `query_type` (string, required): Type of search - use `"internal"`
- `data_source_url` (string, optional): Specific database URL to search within

**Example Usage:**
```
Tool: mcp__Notion__notion-search
Parameters:
{
  "query": "proration",
  "query_type": "internal"
}
```

**Response Format:**
Returns a list of search results with:
- Page ID (for fetching)
- Page URL (for citations)
- Title
- Snippet/preview
- Relevance ranking

### 2. notion-fetch
**Purpose:** Retrieve full content of a specific Notion page

**Tool Name:** `mcp__Notion__notion-fetch`

**Parameters:**
- `id` (string, required): Page ID or URL

**Example Usage:**
```
Tool: mcp__Notion__notion-fetch
Parameters:
{
  "id": "abc123-page-id-here"
}
```

**Response Format:**
Returns page content in enhanced Markdown format including:
- Page title
- Full content with formatting
- Page metadata (created, modified dates)
- Page URL

## Search Tool Details

### Query Type: Internal
Always use `"internal"` query type for searching the billing documentation.

**What "internal" does:**
- Searches across the Notion workspace
- Includes connected sources (if any)
- Provides semantic search capabilities
- Returns ranked results

### Search Scope
The search automatically scopes to accessible content in the Billing Engine Specification database.

### Result Ranking
Results are returned in relevance order. The MCP tool handles ranking, so the first results are typically most relevant.

### Search Limitations
- Search is text-based; doesn't understand complex boolean queries
- No wildcard or regex support
- Case-insensitive by default
- Limited to accessible pages (permissions-based)

### Best Practices for Search
1. Use clear, domain-specific terms
2. Keep queries concise (2-4 words typically)
3. Avoid overly complex queries
4. Trust the relevance ranking
5. Fetch top 3-5 results for best coverage

## Fetch Tool Details

### Page Identification
The `id` parameter accepts:
- Page ID (UUID): `"abc123-def456-ghi789"`
- Page URL: `"https://www.notion.so/sequencehq/Page-Title-abc123"`
- Notion URL with ID: Extract ID from search results

### Content Format
Pages are returned in enhanced Markdown format with:
- Standard Markdown formatting
- Notion-specific blocks (callouts, toggles, etc.)
- Embedded content
- Metadata tags

### Content Structure
Typical page structure:
```markdown
# Page Title

[Page content with standard Markdown formatting]

## Sections

Content organized in sections...

### Subsections

More detailed content...
```

### Fetching Multiple Pages
To fetch multiple pages, make separate fetch calls:

```
1. Fetch page 1 (check cache first)
2. Fetch page 2 (check cache first)
3. Fetch page 3 (check cache first)
...
```

**Optimization:** Always check cache before fetching to reduce API calls.

## Typical Workflow

### Complete Example: Answering "What is proration?"

**Step 1: Search**
```
Tool: mcp__Notion__notion-search
Parameters:
{
  "query": "proration",
  "query_type": "internal"
}

Response:
[
  {
    "id": "page-id-1",
    "url": "https://notion.so/...",
    "title": "Proration Logic",
    "snippet": "Proration calculates proportional charges..."
  },
  {
    "id": "page-id-2",
    "url": "https://notion.so/...",
    "title": "Subscription Upgrades",
    "snippet": "When upgrading, proration applies..."
  }
]
```

**Step 2: Check Cache**
```bash
# Check if page-id-1 is cached
test -f ~/.claude/plugins/billing-help/cache/page-id-1.json

# If exists, read it
cat ~/.claude/plugins/billing-help/cache/page-id-1.json
```

**Step 3: Fetch (if not cached)**
```
Tool: mcp__Notion__notion-fetch
Parameters:
{
  "id": "page-id-1"
}

Response:
{
  "title": "Proration Logic",
  "url": "https://notion.so/...",
  "content": "# Proration Logic\n\nProration calculates..."
}
```

**Step 4: Write to Cache**
```bash
mkdir -p ~/.claude/plugins/billing-help/cache

echo '{
  "pageId": "page-id-1",
  "pageUrl": "https://notion.so/...",
  "title": "Proration Logic",
  "content": "# Proration Logic...",
  "fetchedAt": "2026-01-20T10:30:00Z",
  "expiresAt": "2026-01-27T10:30:00Z"
}' > ~/.claude/plugins/billing-help/cache/page-id-1.json
```

**Step 5: Synthesize and Respond**
```
Proration calculates a proportional charge when a subscription changes mid-cycle.

[Details from fetched page content...]

**Sources:**
- [Proration Logic](https://notion.so/...) - Core proration calculation logic
```

## Error Handling

### Search Errors

**No Results Found**
```json
Response: {
  "results": []
}
```
**Action:** Inform user that specific documentation not found, suggest alternatives.

**Search Failure**
```json
Error: "Search request failed"
```
**Action:** Retry once, if fails again, inform user of technical issue.

### Fetch Errors

**Page Not Found**
```json
Error: "Page not found or not accessible"
```
**Action:** Skip this page, try next search result.

**Fetch Timeout**
```json
Error: "Request timeout"
```
**Action:** Retry once, if fails, use search snippet instead of full content.

**Permission Denied**
```json
Error: "Permission denied"
```
**Action:** Skip this page, note in response that some content may not be accessible.

## Advanced Patterns

### Multi-Page Synthesis
When answering requires multiple pages:

1. Search for primary concept
2. Identify top 3-5 relevant pages
3. Check cache for each
4. Fetch uncached pages
5. Synthesize information from all pages
6. Cite all sources

**Example:** "How do discounts work with graduated pricing?"

```
Search 1: "discounts graduated pricing"
→ Results: [Page A, Page B, Page C]

Check cache for Page A, B, C
Fetch any uncached pages
Synthesize answer from all three
Cite all three sources
```

### Progressive Search
When initial search doesn't provide complete answer:

1. Initial broad search
2. Review results
3. If gaps exist, do targeted search for missing info
4. Combine results

**Example:** "Proration with annual subscriptions"

```
Search 1: "proration"
→ Find general proration info

Search 2: "annual subscriptions proration"
→ Find annual-specific details

Combine both in answer
```

### Related Content Discovery
When providing answer, search for related concepts:

1. Answer primary question
2. Identify related concepts mentioned
3. Quick search for related concepts
4. Mention them as "Related Concepts" in answer

**Example:** After answering about proration, mention:
- Subscription upgrades
- Billing schedules
- Credits and adjustments

## Performance Optimization

### Cache First Strategy
Always check cache before fetching:

```
For each page to fetch:
  1. Check if cache file exists
  2. If exists, read and validate expiry
  3. If valid, use cached content
  4. If not valid or doesn't exist, fetch fresh
  5. Write fresh content to cache
```

### Batch Operations
When processing multiple pages:

1. Collect all page IDs to fetch
2. Check cache for all pages in parallel (if possible)
3. Fetch only uncached pages
4. Update cache for newly fetched pages

### Token Budget Awareness
Monitor token usage:
- Each page fetch can be 10-30k tokens
- Limit to 5 pages maximum per question
- Summarize content in answers, don't include full pages
- Use cache to avoid re-fetching in same conversation

### Selective Fetching
Don't fetch every search result:
- Top result: Always fetch (highest relevance)
- Results 2-3: Fetch if adding new information
- Results 4-5: Fetch only if gaps remain
- Results 6+: Generally skip

## Cache Management

### Cache File Format
```json
{
  "pageId": "unique-page-id",
  "pageUrl": "https://www.notion.so/sequencehq/Page-Title-id",
  "title": "Page Title",
  "content": "Full markdown content of the page",
  "fetchedAt": "2026-01-20T10:30:00Z",
  "expiresAt": "2026-01-27T10:30:00Z"
}
```

### Cache Validation
```javascript
// Pseudocode for cache validation
currentTime = now()
cacheExpiry = parseTimestamp(cache.expiresAt)

if (currentTime < cacheExpiry) {
  // Cache valid, use it
  return cache.content
} else {
  // Cache expired, fetch fresh
  fetchFresh()
}
```

### Cache Cleanup
Expired cache files are deleted when:
- Attempting to read an expired cache
- Manual cleanup by user (delete cache directory)

No automatic background cleanup process needed.

### Cache Directory Structure
```
~/.claude/plugins/billing-help/cache/
├── page-id-1.json
├── page-id-2.json
├── page-id-3.json
└── ...
```

Each page has its own cache file named by page ID.

## Best Practices Summary

1. **Always use `query_type: "internal"`** for searching
2. **Check cache before every fetch** to reduce API calls
3. **Limit page fetches** to 5 maximum per question
4. **Handle errors gracefully** with retries and fallbacks
5. **Write to cache** after every successful fetch
6. **Validate cache expiry** before using cached content
7. **Use search ranking** to prioritize which pages to fetch
8. **Extract page URLs** from search/fetch results for citations
9. **Monitor token usage** to stay within budget
10. **Synthesize, don't copy** entire pages into answers

## Common Pitfalls to Avoid

1. **Don't fetch without checking cache first** - Wastes API calls
2. **Don't fetch all search results** - Exceeds token budget
3. **Don't ignore error responses** - Handle gracefully
4. **Don't forget to cache** - Makes subsequent queries slower
5. **Don't copy entire pages** - Wastes tokens, answer too long
6. **Don't skip citations** - User needs source URLs
7. **Don't use wrong query_type** - Always use "internal"
8. **Don't make overly complex queries** - Keep queries simple
9. **Don't ignore cache expiry** - May serve stale information
10. **Don't fetch pages you won't use** - Be selective

---

**Remember:** Efficient use of MCP Notion tools is key to providing fast, accurate answers while staying within token budgets and rate limits. Cache aggressively, fetch selectively, synthesize effectively.
