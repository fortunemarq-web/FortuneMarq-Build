# Obsidian RAG — Claude Memory System

A self-updating, Claude-powered knowledge base inspired by Andrej Karpathy's Obsidian RAG architecture. Claude reads, reasons over, and writes to this wiki, giving it persistent long-term memory that compounds with every new source ingested.

---

## Folder Structure

```
obsidian-rag/
├── cla.md              ← Claude's identity, voice, and rules (read every session)
├── README.md           ← This file
│
├── raw/                ← Drop new source material here for Claude to process
│   └── YYYY-MM-DD_title.md
│
├── wiki/               ← Claude's living knowledge base
│   ├── index.md        ← Master index — every page listed here
│   └── [Topic].md      ← One page per concept, person, project, or decision
│
├── schema/
│   └── SCHEMA.md       ← Rulebook: conventions, workflows, tagging system
│
└── scripts/
    └── lint.py         ← Health checker for the wiki
```

---

## Quick Start

### 1. Open in Obsidian
Open the `obsidian-rag/` folder as an Obsidian vault. You'll get graph view, backlinks, and the web clipper integration for free.

### 2. Start a Claude session
At the start of every session, tell Claude:

> "Read `cla.md` and `wiki/index.md`, then check `raw/` for any unprocessed sources."

### 3. Add new sources
Drop any Markdown file into `raw/` using the naming convention `YYYY-MM-DD_title.md`, then ask Claude to ingest it:

> "Process the new source in `raw/` and update the wiki."

### 4. Run the linter (weekly)
```bash
cd obsidian-rag
python3 scripts/lint.py
```

---

## Memory Architecture

| Layer | File | Role |
|-------|------|------|
| **Identity** | `cla.md` | Claude's rules, voice, and stable instructions |
| **Working Memory** | `wiki/` | Active knowledge, reasoning, decisions |
| **Raw Input** | `raw/` | Unprocessed sources waiting to be ingested |
| **Rulebook** | `schema/SCHEMA.md` | Conventions and workflow governance |

---

## Tips

- **Use the Obsidian web clipper** (browser extension) to save articles directly into `raw/` as Markdown.
- **Keep pages atomic** — one concept per file, ~400–800 words max.
- **Review `#needs-review` pages weekly** to resolve contradictions before they drift.
- **Don't aim for completeness up front** — let the wiki grow organically from what you actually use.

---

*Setup date: 2026-04-28*
