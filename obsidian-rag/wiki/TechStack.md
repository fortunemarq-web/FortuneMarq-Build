# TechStack

**Last updated:** 2026-04-28  
**Tags:** #evergreen #decision  
**Related:** [[FMOS]], [[FortuneMarq]], [[LockedDecisions]]

---

## Summary

All technology decisions at FortuneMarq are locked. The stack is Next.js + Supabase + Hostinger + Antigravity + Claude. No changes unless Jabeer explicitly opens a review.

## FMOS Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 + TypeScript (strict mode) |
| Styling | Tailwind CSS v4 |
| Database | Supabase PostgreSQL (Project ID: cnwooodktqwvpzkucskm) |
| Auth | @supabase/ssr v0.8.0 (server-side cookie sessions) |
| Charts | Recharts v3.5.1 |
| Icons | Lucide React |
| Animation | Framer Motion |
| PDF | @react-pdf/renderer |
| AI (Strategy) | Claude API — claude-sonnet-4-20250514 |
| AI (Sales Brain) | OpenRouter — Mistral 7B instruct free |

## Infrastructure

| Purpose | Tool |
|---------|------|
| Hosting | Hostinger Business Plan |
| Domain | fortunemarq.com (Hostinger) |
| FMOS URL | fmos.fortunemarq.com |
| DB Hosting | Supabase cloud |
| Website Builder | Antigravity |
| Design | Canva |

## AI & Automation

| Tool | Use |
|------|-----|
| Claude Pro | Jabeer's browser — strategic work, content |
| Claude Code (terminal) | Building FMOS |
| Anthropic Claude API | FMOS strategy engine |
| OpenRouter | FMOS sales brain (free tier Mistral 7B) |
| Python | PDF generation, data processing |
| Git + GitHub Actions | Deployment pipeline for client websites |
| Celery + Redis | Planned: task queue for automation |

## Marketing & Analytics

- Meta Ads Manager
- Google Ads
- DataForSEO API (planned for keyword tracking)

## Fonts & Brand

- JetBrains Mono (Regular, .ttf and .woff2)
- Degarism Alliance (2 variants)
- Primary accent color: #42CA80 (green)
- UI: SaaS Light theme, Tailwind slate grays

## Open Questions

- [ ] When to upgrade OpenRouter from free to paid (Mistral 7B) for reliability?
- [ ] Celery + Redis — when to implement task queue?

## Sources

- [[raw/2026-04-28_tech-stack]]
- [[raw/2026-04-28_fmos-crm]]
