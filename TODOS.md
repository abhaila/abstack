# TODOS

Deferred work with enough context to pick up cold. Added by `/plan-ceo-review` 2026-09-10.

## P2 — Approach C: production hybrid retriever

**What:** Harden a measurement-grade local hybrid index (BM25 + dense + RRF over `.kt` and
`.ts`) into a real MCP retriever, exposed alongside grep — never replacing it.

**Why:** This is the thing the original investigation was about: "does a local vectordb
yield better coding results and improve tokens?"

**Context:** Deferred behind the Phase 2 live A/B (see
`~/.gstack/projects/abhaila-abstack/ceo-plans/2026-09-10-retrieval-bench.md`). Measured
baseline: 11.5 code searches/session at mean 323 tokens = 3,697 tokens/session. Token
break-even needs searches to fall to ~4/session (2.8–3.9x at realistic top-k). The
semantic-addressable slice is 17.0% of code-search patterns, 6.1% of all grep calls, and
~1.18% of all tool-output tokens. Anthropic shipped RAG in early Claude Code and removed
it; Turbopuffer's vendor benchmark claims wasted file reads drop from 1-in-3 to 1-in-8.

**Pros:** Only path to the 12-month router ideal. **Cons:** ~10 days; 28.6%/month churn
means permanent index ops; may serve a small slice.

**Effort:** L (human ~10 d / CC ~3-4 h). **Depends on:** Phase 2 landing STRONG POSITIVE.

## P3 — Codex transcript mining (cross-agent comparison)

**What:** Second parser for Codex transcript format, same measurement pipeline, so
"does Codex have the same grep problem?" is answered with data rather than assumption.

**Why:** The original ask named both Claude and Codex. Only Claude Code was measured.

**Context:** Codex transcripts are already on disk. Deferred because it doubles the
parsing surface before the Claude path has produced a single result.

**Effort:** M (human ~1.5 d / CC ~30 min). **Depends on:** Phase 3 harness existing.

## P3 — Churn cost model for a local code index

**What:** Quantify what re-embedding ~3,900 Kotlin files/month actually costs in
wall-clock and compute for a local embedding model.

**Why:** Churn (28.6%/month, 4,753 of 16,591 files in 30 days) was used as an argument
against building a local index **without any cost model behind it**. gbrain already
supports incremental `sync --watch`, so it is plausibly trivial. The claim should be
quantified or retired.

**Effort:** S (human ~0.5 d / CC ~15 min). **Depends on:** nothing.

## P3 — LSP symbol backend

**What:** Replace or supplement ctags with kotlin-language-server / tsserver for the
symbol lookup path.

**Why:** ctags gives definitions only — not references, not a call graph. Exact-identifier
queries are 23.5% of code-search patterns, the second-largest class. If definitions-only
coverage proves insufficient, an LSP backend is scriptable and does resolve references.

**Context:** IntelliJ MCP already provides `search_symbol` / `analyze_calls` at
compiler-grade accuracy, but needs a warm indexed IDE and so cannot run headless.

**Effort:** S-M (human ~1 d / CC ~30 min). **Depends on:** ctags proving insufficient.
