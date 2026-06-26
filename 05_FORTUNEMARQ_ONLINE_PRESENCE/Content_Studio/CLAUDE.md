# Content Studio — Working guide (the creative production pipeline)

Where FortuneMarq's content is **made** — idea → script → shoot → edit — before it's handed to FMOS to
schedule and publish. This is the **upstream** of the system FMOS already has; it feeds it, it doesn't
duplicate it.

## The clean split (don't duplicate — hand off)
| Stage | Lives where |
|---|---|
| Ideas → **Script → Shoot → Edit** → Ready | **here** (this folder) — the creative work a database can't hold |
| Ready → **Scheduled → Published** + insights | **FMOS** — the `content_pieces` table + content Kanban at `/admin/growth` |
| Raw footage + final video/image files | **Google Drive**, linked from here — never in the repo |

FMOS already has the back half: a content Kanban (**Idea → Drafted → Scheduled → Published**) backed by
`content_pieces` (`caption_draft`, `image_prompt`, `scheduled_date`, `channel`, `engagement_rate`). The future
Meta/auto-publishing automation publishes *from* there. So this folder **stops at "Ready"** — scheduling and
publishing stay in FMOS.

## The workflow (one piece, end to end)
1. **`1_Ideas/`** — capture the hook/topic/angle (the idea backlog).
2. **`2_Scripts/`** — write the script/storyboard (reel, carousel, video). Use the template.
3. **`3_Shoot/`** — shot list + shoot plan. Raw footage → Google Drive (paste the link).
4. **`4_Edit/`** — edit brief + revisions. Final render → Google Drive (paste the link).
5. **`5_Ready/`** — approved + final asset linked → **hand off to FMOS**: create a `content_pieces` row
   (`/admin/growth`) with the caption, the Drive asset link, the channel, and a scheduled date. From there
   FMOS owns Scheduled → Published.
- Track in-production pieces (stages 1–4, not yet in FMOS) in `pipeline-board.md`.

## The connective tissue
- Give each piece a **short slug/title** and reuse it as the `content_pieces` title in FMOS, so a folder
  piece maps 1:1 to its FMOS row. That single shared name is all the automation needs to tie them together.

## Boundaries
- Planning/scripts/notes only — no heavy media in the repo (Drive links). No tokens/credentials.
- Don't rebuild scheduling/publishing here — that's FMOS. This folder ends at "Ready".
- Voice: plain, honest, business-owner-friendly; no fake stats, no war/combat language.
