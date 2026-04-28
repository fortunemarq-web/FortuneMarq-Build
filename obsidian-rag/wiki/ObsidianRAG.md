# ObsidianRAG

**Last updated:** 2026-04-28  
**Tags:** #evergreen #concept  
**Related:** [[index]]

---

## Summary

The Obsidian RAG system is a Claude-powered, self-updating knowledge base that gives Claude persistent, long-term memory across sessions. It uses a structured folder of Markdown files (a wiki) as its memory layer, which Claude can both read from and write to during interactions.

## Detail

Claude's default limitation is context amnesia — it forgets everything between sessions. The Obsidian RAG system solves this by maintaining a wiki of Markdown files that Claude indexes, updates, and cross-references incrementally. Every new source ingested causes Claude to update 5–15 related wiki pages, creating a compounding knowledge effect.

The system has three primary data layers:

- **Raw Sources** (`raw/`): Original documents, articles, PDFs, and transcripts dropped in for processing.
- **Wiki** (`wiki/`): Claude's curated summaries, reasoning, and cross-referenced knowledge pages.
- **Schema** (`schema/SCHEMA.md`): The rulebook that governs how Claude processes, updates, and maintains the wiki.

A fourth stable layer is `cla.md`, which holds Claude's identity, voice, and instructions and does not change automatically.

## Strengths

- Compounds knowledge over time — each new source enriches many existing pages.
- Supports reasoning over relationships (not just keyword recall).
- Human-readable and editable via Obsidian's graph view and markdown editor.
- Works well for small to medium datasets (hundreds of pages, not tens of thousands).

## Limitations

- The index file grows with every page, increasing token cost per session.
- Search is index-based and topic-driven — not semantic similarity search.
- Summaries can become stale without regular linting and maintenance.
- Not suitable for very large static archives (use Pinecone for that instead).

## Comparison: Obsidian RAG vs Pinecone

| Feature | Obsidian RAG | Pinecone |
|---------|-------------|---------|
| Best for | Dynamic, reasoning-heavy knowledge | Large static archives |
| Search type | Index/topic-based | Semantic nearest-neighbour |
| Token cost | Grows with file count | Flat / scalable |
| Reasoning | Yes — graph relationships | No — only retrieval |

## Open Questions

- [ ] What is the optimal wiki size before token costs become prohibitive?
- [ ] How to best integrate Pinecone for the long-term archive layer?

## Sources

- Summary of Andrej Karpathy's Obsidian RAG video (2026-04-28)
