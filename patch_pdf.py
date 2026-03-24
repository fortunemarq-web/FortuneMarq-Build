"""
FortuneMarq — Patch for generate_sample_pdf_v3.py
Fixes: Page 2 spacing gap + Page 3 5% block cut off
Run this to patch the existing file
"""

import re

filepath = "generate_sample_pdf_v3.py"

with open(filepath, "r") as f:
    content = f.read()

# ── FIX 1: Page 3 — Traffic blocks ───────────────────────────────────────────
# Problem: blocks overflow because gap eats into available width
# Fix: use exact pixel-level calculation with no gaps, use padding instead

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

new_block = '''    # Traffic split blocks — precise calculation fitting exactly within margins
    blocks = [
        (DIRECTORY_PCT, RED_SOFT,  "DIRECTORIES",    "JustDial, Sulekha, Practo"),
        (LOCAL_PCT,     GREEN,      "LOCAL WEBSITES", "Gym websites on Google"),
        (UNCAPTURED,    GRAY_SOFT,  "UNCAPTURED",     "No result found"),
    ]
    block_y  = H - 100*mm
    block_h  = 52*mm
    # Use exact content width — no gaps between blocks, use rounded corners as visual separator
    total_w  = W - MARGIN - INNER   # exact available width from INNER to right margin

    x_pos = INNER
    for idx, (pct, col, label, sub) in enumerate(blocks):
        bw = (pct / 100) * total_w
        # Block — no gaps, tight fit
        c.setFillColor(col)
        # Add small right inset on all but last to create visual gap
        inset = 1.5*mm if idx < len(blocks) - 1 else 0
        c.roundRect(x_pos, block_y, bw - inset, block_h, 3, fill=1, stroke=0)

        mid_x = x_pos + (bw - inset) / 2

        # Percentage — upper center of block
        c.setFont(HEADING, 20)
        c.setFillColor(WHITE)
        c.drawCentredString(mid_x, block_y + block_h - 15*mm, f"{pct}%")

        # Label
        c.setFont(MONO, 6)
        c.setFillColor(WHITE)
        c.drawCentredString(mid_x, block_y + 13*mm, label)

        # Sub label — only show if block wide enough
        if bw > 20*mm:
            c.setFont(BODY, 7)
            c.setFillColor(WHITE if pct >= 20 else BLACK)
            c.drawCentredString(mid_x, block_y + 7*mm, sub)

        # Volume count below block
        vol = int(TOTAL_VOL * pct / 100)
        c.setFont(MONO, 7)
        c.setFillColor(MUTED)
        c.drawCentredString(mid_x, block_y - 7*mm, f"~{vol:,} searches")

        x_pos += bw'''

content = content.replace(old_block, new_block)

# ── FIX 2: Page 2 — Remove extra spacing gap between table and chart ──────────
old_spacing = '''    # Bar chart
    chart_y = H - 232*mm'''

new_spacing = '''    # Bar chart — tightened spacing
    chart_y = H - 220*mm'''

content = content.replace(old_spacing, new_spacing)

with open(filepath, "w") as f:
    f.write(content)

print("Patch applied successfully.")
print("Now run: python generate_sample_pdf_v3.py")
