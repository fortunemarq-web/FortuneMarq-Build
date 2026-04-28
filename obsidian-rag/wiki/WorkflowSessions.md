# WorkflowSessions

**Last updated:** 2026-04-28  
**Tags:** #evergreen  
**Related:** [[SayedJabeer]], [[FortuneMarq]], [[FMOS]]

---

## Summary

FortuneMarq uses a structured session-based workflow to maintain continuity across long Claude Code sessions. Every folder has a CONTEXT.md file. Every session starts by reading context and ends by updating it. This is how the build system stays coherent across hundreds of hours of work.

## Session Protocol

1. **Open Claude Code** in the specific project folder
2. **Start session** with: "Read CONTEXT.md and continue"
3. Claude reads full context, orients itself, and resumes work
4. **End session** with: "Update CONTEXT.md with everything we decided today"
5. Next session opens the updated CONTEXT.md and picks up exactly where the last one ended

## The CONTEXT.md Structure

Each CONTEXT.md file covers:
- Folder purpose
- What exists (complete)
- What's pending
- What's blocked
- Connections to other folders
- Decisions made this session
- Session history log

## Golden Rule

Every decision made in any folder must be considered in context of the full system. If a decision affects another folder, note it in both folders' CONTEXT.md files.

## The 11-Folder System

| Folder | Purpose |
|--------|---------|
| 00_MASTER | Master context, decisions, blueprints |
| 01_CRM_AND_TOOL | FMOS (Next.js + Supabase agency OS) |
| 02_SERVICE_DELIVERY_AUTOMATION | Website Brief App, SEO, Ads automation |
| 03_SALES_SYSTEM | Scripts, templates, proposals, agreements |
| 04_CLIENT_MANAGEMENT | Onboarding, health scoring, upsells, renewals |
| 05_FORTUNEMARQ_ONLINE_PRESENCE | GMB, Instagram, LinkedIn, agency SEO |
| 06_PAID_MARKETING | FortuneMarq's own Meta/Google campaigns |
| 07_DATA_AND_RESEARCH | Leads, keywords, competitors, PDFs |
| 08_FINANCE | Invoicing, GST, expense tracking, P&L |
| 09_LEGAL_AND_OPERATIONS | Agreements, policies, compliance |
| 10_PERSONAL_GROWTH | Jabeer's learning and skill development |

## This Obsidian RAG System

This wiki (`obsidian-rag/`) is the memory layer that sits *above* the folder system — distilling decisions and knowledge from all 11 folders into a cross-referenced, searchable wiki that Claude can read at the start of any session without needing to re-read 11 CONTEXT.md files.

**Session start with this wiki:**
1. Read `cla.md`
2. Read `wiki/index.md`
3. Check `raw/` for unprocessed sources
4. Jump into work

## Sources

- [[raw/2026-04-28_fortunemarq-overview]]
