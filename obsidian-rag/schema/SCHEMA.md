# SCHEMA.md — Obsidian RAG Rulebook

> This is the **operational rulebook** for the Claude-powered Obsidian RAG system. It defines conventions, workflows, and quality standards. Claude must follow these rules when reading, writing, or linting the wiki.

---

## 1. Folder Structure

```
obsidian-rag/
├── cla.md                  # Claude's identity and core rules (never auto-update)
├── raw/                    # Unprocessed source material
│   └── YYYY-MM-DD_title.md # Naming convention for raw sources
├── wiki/                   # Claude's living knowledge base
│   ├── index.md            # Master index — every page listed here
│   └── [topic].md          # One file per concept/person/project/decision
├── schema/
│   └── SCHEMA.md           # This file
└── scripts/
    └── lint.py             # Wiki health checker
```

---

## 2. File Naming Conventions

### Raw Sources
- Format: `YYYY-MM-DD_short-title.md`
- Example: `2026-04-28_karpathy-obsidian-rag.md`
- After processing, add a front-matter flag: `processed: true`

### Wiki Pages
- Use `PascalCase` for page names: `MachineLearning.md`, `ProjectAlpha.md`
- Avoid spaces, special characters, or version numbers in filenames
- Each file begins with a `# Title` H1 heading matching the filename

---

## 3. Wiki Page Template

Every new wiki page must follow this structure:

```markdown
# PageTitle

**Last updated:** YYYY-MM-DD  
**Tags:** #tag1 #tag2  
**Related:** [[RelatedPage1]], [[RelatedPage2]]

---

## Summary

One paragraph summary of this topic.

## Detail

Main body — facts, reasoning, examples.

## Open Questions

- [ ] Question or gap to investigate later

## Sources

- [[raw/YYYY-MM-DD_source-title]]
```

---

## 4. Index File Format (`wiki/index.md`)

The index is the map of the entire wiki. It must be updated every time a page is created, renamed, or deleted.

```markdown
# Wiki Index

*Last updated: YYYY-MM-DD — Total pages: N*

## People
- [[PersonName]] — one-line description

## Projects
- [[ProjectName]] — one-line description

## Concepts
- [[ConceptName]] — one-line description

## Decisions
- [[DecisionLog-Topic]] — one-line description

## Research
- [[ResearchTopic]] — one-line description
```

---

## 5. Ingestion Workflow

When a new raw source is dropped into `raw/`:

1. **Read** the source in full.
2. **Identify** 5–15 concepts, people, projects, or decisions mentioned.
3. For each: **check the index** — does a wiki page exist?
   - If yes: **update** the existing page (add new info, update the date, cite the source).
   - If no: **create** a new page using the template above.
4. **Update** `wiki/index.md` with any new pages.
5. **Mark** the raw source as processed by adding `processed: true` to its front matter.
6. **Do not** delete the raw source after processing.

---

## 6. Contradiction Handling

If new information contradicts an existing wiki page:

1. Add a `## Contradictions` section to the affected page.
2. State both claims clearly with their source references.
3. Add a `#needs-review` tag to the page.
4. Do **not** silently overwrite the old claim.
5. Flag the page in `wiki/index.md` with `⚠️` until resolved.

---

## 7. Linting Rules (run via `scripts/lint.py`)

The linter checks for:

| Check | Description |
|-------|-------------|
| Orphan pages | Wiki pages not listed in `index.md` |
| Dead links | `[[PageName]]` references to non-existent pages |
| Stale pages | Pages not updated in > 90 days |
| Unprocessed sources | Raw files missing `processed: true` |
| Oversized pages | Pages exceeding ~800 words |
| Missing tags | Pages without any `#tag` |
| Contradiction flags | Pages tagged `#needs-review` |

Run linting with: `python3 scripts/lint.py`

---

## 8. Tagging Conventions

| Tag | Meaning |
|-----|---------|
| `#active` | Currently in use / relevant project |
| `#archived` | No longer active but kept for reference |
| `#needs-review` | Contains contradiction or unverified claim |
| `#stub` | Page exists but needs more content |
| `#evergreen` | Stable, foundational knowledge |
| `#decision` | Records a decision made |
| `#research` | Research notes and synthesis |
| `#person` | Notes about a specific person |
| `#project` | Notes about a project |

---

## 9. Maintenance Schedule

| Task | Frequency |
|------|-----------|
| Ingest new raw sources | As they arrive |
| Run lint check | Weekly |
| Review `#needs-review` pages | Weekly |
| Archive stale `#active` pages | Monthly |
| Review and update `cla.md` | Quarterly or as needed |

---

*Last reviewed: 2026-04-28*
