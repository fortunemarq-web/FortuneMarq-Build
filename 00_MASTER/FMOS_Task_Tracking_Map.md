# Offline → FMOS — Task Creation & Progress Tracking Map

**Created:** 2026-06-25.
How the offline planning folders connect to FMOS for **creating tasks** and **tracking progress**.
Rule of thumb: the **folder holds the plan/thinking**; **FMOS holds the live tasks + progress**.

## The bridge: the Strategy → Task engine
FMOS has a **strategy-to-task engine** at `/admin/strategy` (`extractStrategyTasks`) that ingests a
plan/strategy document and **auto-extracts actionable tasks** (title, description, due date, priority,
assignee, tag). So any plan doc in these folders can be fed in and become tracked tasks.
The `tasks` table supports `tags`, `client_id`, `project_id`, `section_tag`, `due_date`, `status`,
`assigned_to` — so tasks link to clients/projects and filter by area. General task UI: `/tasks` + `/projects`.

## Map (built this session)
| Folder / plan | FMOS surface for tasks + progress | Status |
|---|---|---|
| `04_CLIENT_MANAGEMENT/Clients/` | `/admin/clients` + tasks (linked via `client_id`) + `/projects`; onboarding auto-creates tasks | Connected |
| `Website/` (site + landing pages) | `/tasks` (tag: website) + `/admin/growth/seo` Pages Tracker (per-page status) | Connected |
| `05_FORTUNEMARQ_ONLINE_PRESENCE/GMB/` | `/admin/growth/gmb` | Connected |
| `05_FORTUNEMARQ_ONLINE_PRESENCE/Instagram_Facebook/` + `LinkedIn/` | `/admin/growth/instagram` · `/facebook` · `/linkedin` | Connected |
| `05_FORTUNEMARQ_ONLINE_PRESENCE/SEO_and_Local_SEO/karnataka-seo-scale-plan.md` | `/admin/strategy` (plan → tasks) + `/admin/growth/seo` (keywords + pages) + `/admin/growth/acquisition/[city]` (city-wise) | Strong fit |
| `05_FORTUNEMARQ_ONLINE_PRESENCE/Content_Studio/` | hands off to the **content_pieces** Kanban at `/admin/growth` (by design) | Connected |
| `08_FINANCE/gst-status-and-gaps.md` | dev tasks → `/admin/strategy` or `/tasks`; tracked at `/admin/finance` | Connected |
| `09_LEGAL_AND_OPERATIONS/open-tasks.md` | `/admin/strategy` or `/tasks` | Connected |
| `06_PAID_MARKETING/` | generic tagged tasks in `/tasks` + `/admin/growth/acquisition` — **no dedicated campaign tracker yet** | Gap (see `06_PAID_MARKETING/open-tasks.md`) |

## The one gap
Paid marketing has **no dedicated campaign-tracking UI** in FMOS — every other channel has a purpose-built
home. Future build: a Campaign tracker under the growth hub (mirror `acquisition/[city]`). Captured as a task
in `06_PAID_MARKETING/open-tasks.md`.

## How to use this
1. Plan/think in the folder.
2. Feed the plan into `/admin/strategy` (or add tasks directly in `/tasks`).
3. Track progress in the matching surface above (growth hub / clients / finance / content Kanban).
