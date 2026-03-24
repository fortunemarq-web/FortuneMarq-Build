"""
FortuneMarq — Patch for generate_sample_pdf_v3.py
Fixes: Page 2 spacing gap + Page 3 5% block cut off
"""

filepath = "generate_sample_pdf_v3.py"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# ── FIX 1: Page 3 — Traffic blocks precise width ─────────────────────────────
old_block = '''    # Traffic split blocks — precise width calculation
    blocks = [
        (DIRECTORY_PCT, RED_SOFT,  "DIRECTORIES",    "JustDial, Sulekha, Practo"),
        (LOCAL_PCT,     GREEN,      "LOCAL WEBSITES", "Gym websites on Google"),
        (UNCAPTURED,    GRAY_SOFT,  "UNCAPTURED",     "No result found"),
    ]
    block_y   = H - 100*mm
    block_h   = 52*mm
    gap       = 2*mm
    total_gap = gap * (len(blocks) - 1)
    avail_w   = INNER_W - total_gap   # total width available for all blocks

    x_pos = INNER
    for idx, (pct, col, label, sub) in enumerate(blocks):
        bw = (pct / 100) * avail_w
        # Block
        c.setFillColor(col)
        c.roundRect(x_pos, block_y, bw, block_h, 3, fill=1, stroke=0)

        # Percentage — vertically centered in block
        pct_y = block_y + block_h/2 + 4*mm
        c.setFont(HEADING, 22)
        c.setFillColor(WHITE)
        c.drawCentredString(x_pos + bw/2, pct_y, f"{pct}%")

        # Label — below percentage
        c.setFont(MONO, 6)
        c.setFillColor(WHITE)
        c.drawCentredString(x_pos + bw/2, block_y + 14*mm, label)

        # Sub label
        c.setFont(BODY, 7)
        c.setFillColor(WHITE if pct >= 20 else BLACK)
        c.drawCentredString(x_pos + bw/2, block_y + 8*mm, sub)

        # Volume count BELOW block
        vol = int(TOTAL_VOL * pct / 100)
        c.setFont(MONO, 7)
        c.setFillColor(MUTED)
        c.drawCentredString(x_pos + bw/2, block_y - 7*mm, f"~{vol:,} searches")

        x_pos += bw + gap'''

new_block = '''    # Traffic split blocks — exact fit within margins
    blocks = [
        (DIRECTORY_PCT, RED_SOFT,  "DIRECTORIES",    "JustDial, Sulekha, Practo"),
        (LOCAL_PCT,     GREEN,      "LOCAL WEBSITES", "Gym websites on Google"),
        (UNCAPTURED,    GRAY_SOFT,  "UNCAPTURED",     "No result found"),
    ]
    block_y = H - 100*mm
    block_h = 52*mm
    total_w = W - MARGIN - INNER

    x_pos = INNER
    for idx, (pct, col, label, sub) in enumerate(blocks):
        bw    = (pct / 100) * total_w
        inset = 1.5*mm if idx < len(blocks) - 1 else 0
        c.setFillColor(col)
        c.roundRect(x_pos, block_y, bw - inset, block_h, 3, fill=1, stroke=0)
        mid_x = x_pos + (bw - inset) / 2
        c.setFont(HEADING, 20)
        c.setFillColor(WHITE)
        c.drawCentredString(mid_x, block_y + block_h - 15*mm, f"{pct}%")
        c.setFont(MONO, 6)
        c.setFillColor(WHITE)
        c.drawCentredString(mid_x, block_y + 13*mm, label)
        if bw > 20*mm:
            c.setFont(BODY, 7)
            c.setFillColor(WHITE if pct >= 20 else BLACK)
            c.drawCentredString(mid_x, block_y + 7*mm, sub)
        vol = int(TOTAL_VOL * pct / 100)
        c.setFont(MONO, 7)
        c.setFillColor(MUTED)
        c.drawCentredString(mid_x, block_y - 7*mm, f"~{vol:,} searches")
        x_pos += bw'''

content = content.replace(old_block, new_block)

# ── FIX 2: Page 2 — Tighten spacing ─────────────────────────────────────────
content = content.replace(
    "chart_y = H - 232*mm",
    "chart_y = H - 220*mm"
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch applied. Now run: python generate_sample_pdf_v3.py")
