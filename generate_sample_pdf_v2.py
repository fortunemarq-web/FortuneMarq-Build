"""
FortuneMarq Market Intelligence PDF Generator
Sample: Hubli Gyms (English)
Design: Light theme, brand compliant
Updated: Page 1 redesign + Page 5 fix
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ── PATHS ─────────────────────────────────────────────────────────────────────
BASE  = os.path.dirname(os.path.abspath(__file__))
BRAND = os.path.join(BASE, "00_MASTER", "Brand_Assets")
OUT   = os.path.join(BASE, "07_DATA_AND_RESEARCH", "Generated_PDFs", "Hubli")
os.makedirs(OUT, exist_ok=True)

# ── FONTS ─────────────────────────────────────────────────────────────────────
pdfmetrics.registerFont(TTFont("JetBrains", os.path.join(BRAND, "JetBrainsMono-Regular.ttf")))
# Alliance fonts use PostScript outlines — fallback to Helvetica
HEADING  = "Helvetica-Bold"
BODY     = "Helvetica"
MONO     = "JetBrains"

# ── BRAND COLORS ──────────────────────────────────────────────────────────────
GREEN       = colors.HexColor("#15BA7F")
GREEN_DARK  = colors.HexColor("#0D9E6A")
GREEN_LIGHT = colors.HexColor("#E8F8F2")
BLACK       = colors.HexColor("#111111")
WHITE       = colors.HexColor("#FFFFFF")
BG          = colors.HexColor("#FFFFFF")
CARD_BG     = colors.HexColor("#F5F5F5")
MUTED       = colors.HexColor("#555555")
BORDER      = colors.HexColor("#E0E0E0")
RED_SOFT    = colors.HexColor("#FF6B6B")
GRAY_SOFT   = colors.HexColor("#CCCCCC")

W, H   = A4
MARGIN = 18 * mm

# ── DATA ──────────────────────────────────────────────────────────────────────
NICHE      = "Gyms"
CITY       = "Hubli"
TOTAL_VOL  = 30000
TOP_KEYWORDS = [
    ("Gym Near Me",            5000),
    ("Gymnasium Near Me",      5000),
    ("Gym In Hubli",           4500),
    ("Fitness Centre Hubli",   3500),
    ("Best Gym Hubli",         3000),
]
COMPETITORS = [
    {"name": "Xtreme Fitness",       "domain": "xtremefitness.co.in",       "authority": 12, "traffic": 3750},
    {"name": "Hubli Gymkhana Club",  "domain": "hubligymkhanaclub.com",      "authority": 6,  "traffic": 2250},
    {"name": "Sanal Ladies Gym",     "domain": "sanaladiesgymandfitness.in", "authority": 1,  "traffic": 1500},
]
DIRECTORY_PCT = 70
LOCAL_PCT     = 25
UNCAPTURED    = 5


# ── HELPERS ───────────────────────────────────────────────────────────────────
def wrap_text(c, text, x, y, max_width, font, size, color, line_height):
    """Draw wrapped text. Returns final y position."""
    c.setFont(font, size)
    c.setFillColor(color)
    words = text.split()
    line  = ""
    cur_y = y
    for word in words:
        test = (line + " " + word).strip()
        if c.stringWidth(test, font, size) <= max_width:
            line = test
        else:
            if line:
                c.drawString(x, cur_y, line)
                cur_y -= line_height
            line = word
    if line:
        c.drawString(x, cur_y, line)
        cur_y -= line_height
    return cur_y


def footer(c, page_num):
    c.setFillColor(BLACK)
    c.rect(0, 0, W, 11*mm, fill=1, stroke=0)
    c.setFont(MONO, 7)
    c.setFillColor(MUTED)
    c.drawString(MARGIN + 6*mm, 4*mm, f"{CITY} — {NICHE} Market Intelligence Report")
    c.setFillColor(MUTED)
    c.drawCentredString(W/2, 4*mm, f"0{page_num} / 05")
    c.setFillColor(GREEN)
    c.drawRightString(W - MARGIN, 4*mm, "fortunemarq.com")


def left_accent(c):
    c.setFillColor(GREEN)
    c.rect(0, 0, 4*mm, H, fill=1, stroke=0)


def section_label(c, x, y, text):
    c.setFont(MONO, 8)
    c.setFillColor(GREEN)
    c.drawString(x, y, text)


def divider(c, y):
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)
    c.line(MARGIN + 6*mm, y, W - MARGIN, y)


# ════════════════════════════════════════════════════════════════════════════════
# PAGE 1 — COVER (REDESIGNED)
# ════════════════════════════════════════════════════════════════════════════════
def page1(c):
    # Background
    c.setFillColor(BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # Full dark top band
    c.setFillColor(BLACK)
    c.rect(0, H - 38*mm, W, 38*mm, fill=1, stroke=0)

    # Green top strip
    c.setFillColor(GREEN)
    c.rect(0, H - 3*mm, W, 3*mm, fill=1, stroke=0)

    # Logo in top band
    logo_path = os.path.join(BRAND, "Logo2_blackbackground.jpg")
    if os.path.exists(logo_path):
        c.drawImage(logo_path, MARGIN, H - 33*mm,
                    width=28*mm, height=18*mm,
                    preserveAspectRatio=True, mask='auto')

    # Agency name in top band
    c.setFont(HEADING, 11)
    c.setFillColor(WHITE)
    c.drawString(MARGIN + 32*mm, H - 18*mm, "FORTUNEMARQ MEDIA & MARKETING")
    c.setFont(MONO, 7)
    c.setFillColor(GREEN)
    c.drawString(MARGIN + 32*mm, H - 25*mm, "fortunemarq.com  ·  +91 93530 82656")

    # DATA SOURCE credibility stamp — right side of top band
    c.setFont(MONO, 6)
    c.setFillColor(MUTED)
    c.drawRightString(W - MARGIN, H - 16*mm, "DATA SOURCE:")
    c.setFillColor(WHITE)
    c.drawRightString(W - MARGIN, H - 22*mm, "Google Keyword Planner")
    c.drawRightString(W - MARGIN, H - 28*mm, "Google Business Profile")

    # Report type label
    c.setFillColor(GREEN)
    c.roundRect(MARGIN, H - 52*mm, 68*mm, 9*mm, 2, fill=1, stroke=0)
    c.setFont(MONO, 7)
    c.setFillColor(WHITE)
    c.drawString(MARGIN + 4*mm, H - 47*mm, "MARKET INTELLIGENCE REPORT")

    # City + Niche headline
    c.setFont(HEADING, 26)
    c.setFillColor(BLACK)
    c.drawString(MARGIN, H - 68*mm, f"{NICHE.upper()} BUSINESSES")
    c.setFillColor(GREEN)
    c.drawString(MARGIN, H - 81*mm, f"IN {CITY.upper()}")

    # Subline
    c.setFont(BODY, 11)
    c.setFillColor(MUTED)
    c.drawString(MARGIN, H - 92*mm,
                 "Here is exactly what your customers are doing online —")
    c.drawString(MARGIN, H - 100*mm,
                 "and where they are going instead of you.")

    # Divider
    divider(c, H - 105*mm)

    # THE BIG NUMBER CARD
    c.setFillColor(BLACK)
    c.roundRect(MARGIN, H - 152*mm, W - MARGIN*2, 42*mm, 4, fill=1, stroke=0)

    # Green left accent on card
    c.setFillColor(GREEN)
    c.roundRect(MARGIN, H - 152*mm, 4*mm, 42*mm, 0, fill=1, stroke=0)

    # The number
    c.setFont(HEADING, 48)
    c.setFillColor(GREEN)
    c.drawString(MARGIN + 12*mm, H - 123*mm, f"{TOTAL_VOL:,}")

    # Context line
    c.setFont(BODY, 12)
    c.setFillColor(WHITE)
    c.drawString(MARGIN + 12*mm, H - 135*mm,
                 f"people searched for {NICHE.lower()} in {CITY} last month.")
    c.setFont(MONO, 8)
    c.setFillColor(GREEN)
    c.drawString(MARGIN + 12*mm, H - 143*mm,
                 "This report shows exactly where they went.")

    # What's inside — 4 tags
    tags = ["Market Demand", "Traffic Split", "Competitor Data", "Your Opportunity"]
    tag_y = H - 168*mm
    tx = MARGIN
    for tag in tags:
        tw = c.stringWidth(tag, MONO, 7) + 10*mm
        c.setFillColor(GREEN_LIGHT)
        c.setStrokeColor(GREEN)
        c.setLineWidth(0.5)
        c.roundRect(tx, tag_y, tw, 8*mm, 3, fill=1, stroke=1)
        c.setFont(MONO, 7)
        c.setFillColor(GREEN_DARK)
        c.drawString(tx + 5*mm, tag_y + 3*mm, tag)
        tx += tw + 4*mm

    # "Inside this report" label above tags
    c.setFont(MONO, 7)
    c.setFillColor(MUTED)
    c.drawString(MARGIN, tag_y + 11*mm, "INSIDE THIS REPORT:")

    # Divider
    divider(c, H - 178*mm)

    # Three stat cards
    card_w = (W - MARGIN*2 - 8*mm) / 3
    card_h = 26*mm
    card_y = H - 210*mm
    stats = [
        ("TOP KEYWORD",        "gym near me"),
        ("MONTHLY SEARCHES",   f"{TOTAL_VOL:,}"),
        ("COMPETITION LEVEL",  "LOW"),
    ]
    for i, (label, val) in enumerate(stats):
        cx = MARGIN + i * (card_w + 4*mm)
        c.setFillColor(CARD_BG)
        c.setStrokeColor(BORDER)
        c.setLineWidth(0.5)
        c.roundRect(cx, card_y, card_w, card_h, 3, fill=1, stroke=1)
        c.setFont(MONO, 6)
        c.setFillColor(MUTED)
        c.drawCentredString(cx + card_w/2, card_y + card_h - 8*mm, label)
        c.setFont(HEADING, 11)
        c.setFillColor(BLACK)
        c.drawCentredString(cx + card_w/2, card_y + 8*mm, val)

    # Disclaimer
    c.setFont(MONO, 6)
    c.setFillColor(MUTED)
    c.drawString(MARGIN, card_y - 8*mm,
                 "All data sourced from Google Keyword Planner and Google Business Profile. Prepared exclusively for this report.")

    # Footer
    c.setFillColor(BLACK)
    c.rect(0, 0, W, 11*mm, fill=1, stroke=0)
    c.setFont(MONO, 7)
    c.setFillColor(GREEN)
    c.drawCentredString(W/2, 4*mm,
                        "Marketing That Pays You Back  ·  fortunemarq.com  ·  +91 93530 82656")

    c.showPage()


# ════════════════════════════════════════════════════════════════════════════════
# PAGE 2 — MARKET DEMAND
# ════════════════════════════════════════════════════════════════════════════════
def page2(c):
    c.setFillColor(BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    left_accent(c)

    section_label(c, MARGIN + 6*mm, H - 20*mm, "MARKET DEMAND")
    c.setFont(HEADING, 18)
    c.setFillColor(BLACK)
    c.drawString(MARGIN + 6*mm, H - 32*mm,
                 "How many people are looking for your business?")
    divider(c, H - 36*mm)

    # Big number card
    c.setFillColor(GREEN_LIGHT)
    c.roundRect(MARGIN + 6*mm, H - 70*mm, W - MARGIN*2 - 6*mm, 28*mm, 4, fill=1, stroke=0)
    c.setFillColor(GREEN)
    c.roundRect(MARGIN + 6*mm, H - 70*mm, 4*mm, 28*mm, 0, fill=1, stroke=0)
    c.setFont(HEADING, 38)
    c.setFillColor(GREEN)
    c.drawString(MARGIN + 16*mm, H - 50*mm, f"{TOTAL_VOL:,}")
    c.setFont(BODY, 11)
    c.setFillColor(BLACK)
    c.drawString(MARGIN + 16*mm, H - 61*mm,
                 f"searches per month for {NICHE.lower()} in {CITY}  ·  Source: Google Keyword Planner")

    # Keyword table
    section_label(c, MARGIN + 6*mm, H - 78*mm, "TOP SEARCH TERMS")
    divider(c, H - 81*mm)

    max_vol = TOP_KEYWORDS[0][1]
    for i, (kw, vol) in enumerate(TOP_KEYWORDS):
        ry = H - 96*mm - i * 13*mm
        if i % 2 == 0:
            c.setFillColor(CARD_BG)
            c.rect(MARGIN + 6*mm, ry - 3*mm, W - MARGIN*2 - 6*mm, 13*mm, fill=1, stroke=0)
        c.setFont(BODY, 10)
        c.setFillColor(BLACK)
        c.drawString(MARGIN + 10*mm, ry + 2*mm, kw)
        # Bar
        bar_max = 65*mm
        bw = (vol / max_vol) * bar_max
        c.setFillColor(GREEN_LIGHT)
        c.roundRect(W - MARGIN - 80*mm, ry + 1*mm, bar_max, 7*mm, 2, fill=1, stroke=0)
        c.setFillColor(GREEN)
        c.roundRect(W - MARGIN - 80*mm, ry + 1*mm, bw, 7*mm, 2, fill=1, stroke=0)
        c.setFont(MONO, 7)
        c.setFillColor(BLACK)
        c.drawRightString(W - MARGIN - 82*mm, ry + 3*mm, f"{vol:,}/mo")

    # Bar chart
    chart_y = H - 230*mm
    chart_h = 48*mm
    chart_w = W - MARGIN*2 - 6*mm
    section_label(c, MARGIN + 6*mm, chart_y + chart_h + 5*mm, "MONTHLY VOLUME BY KEYWORD")
    c.setFillColor(CARD_BG)
    c.roundRect(MARGIN + 6*mm, chart_y, chart_w, chart_h, 3, fill=1, stroke=0)

    vols   = [v for _, v in TOP_KEYWORDS]
    labels = [k.split()[0] for k, _ in TOP_KEYWORDS]
    max_v  = max(vols) * 1.25
    bar_w  = chart_w / (len(vols) + 1)
    for i, (vol, label) in enumerate(zip(vols, labels)):
        bx = MARGIN + 6*mm + (i + 0.5) * bar_w
        bh = (vol / max_v) * (chart_h - 16*mm)
        c.setFillColor(GREEN)
        c.roundRect(bx, chart_y + 10*mm, bar_w * 0.6, bh, 2, fill=1, stroke=0)
        c.setFont(MONO, 6)
        c.setFillColor(BLACK)
        c.drawCentredString(bx + bar_w * 0.3, chart_y + 10*mm + bh + 2*mm, f"{vol:,}")
        c.setFont(BODY, 7)
        c.setFillColor(MUTED)
        c.drawCentredString(bx + bar_w * 0.3, chart_y + 3*mm, label[:10])

    # Insight box
    ins_y = chart_y - 20*mm
    c.setFillColor(BLACK)
    c.roundRect(MARGIN + 6*mm, ins_y, W - MARGIN*2 - 6*mm, 17*mm, 3, fill=1, stroke=0)
    c.setFillColor(GREEN)
    c.roundRect(MARGIN + 6*mm, ins_y, 4*mm, 17*mm, 0, fill=1, stroke=0)
    c.setFont(MONO, 7)
    c.setFillColor(GREEN)
    c.drawString(MARGIN + 14*mm, ins_y + 11*mm, "INSIGHT")
    c.setFont(BODY, 9)
    c.setFillColor(WHITE)
    c.drawString(MARGIN + 14*mm, ins_y + 4*mm,
                 "Most of these searches happen on mobile. Most gym websites in Hubli are not mobile-optimised.")

    footer(c, 2)
    c.showPage()


# ════════════════════════════════════════════════════════════════════════════════
# PAGE 3 — TRAFFIC DISTRIBUTION
# ════════════════════════════════════════════════════════════════════════════════
def page3(c):
    c.setFillColor(BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    left_accent(c)

    section_label(c, MARGIN + 6*mm, H - 20*mm, "TRAFFIC DISTRIBUTION")
    c.setFont(HEADING, 18)
    c.setFillColor(BLACK)
    c.drawString(MARGIN + 6*mm, H - 32*mm,
                 f"Where do those {TOTAL_VOL:,} searches actually go?")
    divider(c, H - 36*mm)

    # Visual split blocks
    blocks = [
        (DIRECTORY_PCT, RED_SOFT,   "DIRECTORIES",     "JustDial, Sulekha, Practo"),
        (LOCAL_PCT,     GREEN,       "LOCAL WEBSITES",  "Gym websites on Google"),
        (UNCAPTURED,    GRAY_SOFT,   "UNCAPTURED",      "Bounce — no result found"),
    ]
    block_y = H - 100*mm
    block_h = 50*mm
    total_w = W - MARGIN*2 - 6*mm
    x_pos = MARGIN + 6*mm
    for pct, col, label, sub in blocks:
        bw = (pct / 100) * total_w
        c.setFillColor(col)
        c.roundRect(x_pos, block_y, bw - 1.5*mm, block_h, 3, fill=1, stroke=0)
        c.setFont(HEADING, 20)
        c.setFillColor(WHITE)
        c.drawCentredString(x_pos + bw/2, block_y + block_h - 14*mm, f"{pct}%")
        c.setFont(MONO, 6)
        c.drawCentredString(x_pos + bw/2, block_y + 9*mm, label)
        # Volume under block
        vol = int(TOTAL_VOL * pct / 100)
        c.setFont(MONO, 7)
        c.setFillColor(MUTED)
        c.drawCentredString(x_pos + bw/2, block_y - 6*mm, f"~{vol:,} searches")
        x_pos += bw

    # 3 explanation boxes
    box_y = H - 185*mm
    box_h = 56*mm
    box_w = (W - MARGIN*2 - 6*mm - 8*mm) / 3
    explanations = [
        ("01", "What Are Directories?",
         [
             "JustDial, Sulekha, and Practo",
             "list your business — but",
             "customers call through their",
             "platform. The directory owns",
             "the relationship, not you.",
         ]),
        ("02", "Why This Hurts You",
         [
             "Every lead from JustDial costs",
             "you money. You pay per enquiry.",
             "You lose control of pricing,",
             "reviews, and customer data.",
             "You are renting your customers.",
         ]),
        ("03", "The Direct Advantage",
         [
             "When customers find YOUR",
             "website on Google, they call",
             "your number. No middleman.",
             "No per-lead cost.",
             "You own the customer.",
         ]),
    ]
    for i, (num, title, lines) in enumerate(explanations):
        bx = MARGIN + 6*mm + i * (box_w + 4*mm)
        c.setFillColor(CARD_BG)
        c.setStrokeColor(BORDER)
        c.setLineWidth(0.5)
        c.roundRect(bx, box_y, box_w, box_h, 3, fill=1, stroke=1)
        # Number badge
        c.setFillColor(GREEN)
        c.roundRect(bx + 4*mm, box_y + box_h - 11*mm, 10*mm, 8*mm, 2, fill=1, stroke=0)
        c.setFont(MONO, 7)
        c.setFillColor(WHITE)
        c.drawCentredString(bx + 9*mm, box_y + box_h - 7.5*mm, num)
        # Title
        c.setFont(HEADING, 9)
        c.setFillColor(BLACK)
        c.drawString(bx + 4*mm, box_y + box_h - 20*mm, title)
        # Body lines
        line_y = box_y + box_h - 28*mm
        for line in lines:
            c.setFont(BODY, 8)
            c.setFillColor(MUTED)
            c.drawString(bx + 4*mm, line_y, line)
            line_y -= 5.5*mm

    # Bold statement
    stmt_y = box_y - 24*mm
    c.setFillColor(BLACK)
    c.roundRect(MARGIN + 6*mm, stmt_y, W - MARGIN*2 - 6*mm, 20*mm, 4, fill=1, stroke=0)
    c.setFillColor(GREEN)
    c.roundRect(MARGIN + 6*mm, stmt_y, 4*mm, 20*mm, 0, fill=1, stroke=0)
    c.setFont(HEADING, 10)
    c.setFillColor(WHITE)
    c.drawString(MARGIN + 14*mm, stmt_y + 13*mm,
                 "Every customer that finds you through JustDial is a customer JustDial owns — not you.")
    c.setFont(BODY, 9)
    c.setFillColor(GREEN)
    c.drawString(MARGIN + 14*mm, stmt_y + 5*mm,
                 "FortuneMarq builds you a system where customers find YOU directly on Google.")

    footer(c, 3)
    c.showPage()


# ════════════════════════════════════════════════════════════════════════════════
# PAGE 4 — COMPETITION
# ════════════════════════════════════════════════════════════════════════════════
def page4(c):
    c.setFillColor(BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    left_accent(c)

    section_label(c, MARGIN + 6*mm, H - 20*mm, "COMPETITION ANALYSIS")
    c.setFont(HEADING, 18)
    c.setFillColor(BLACK)
    c.drawString(MARGIN + 6*mm, H - 32*mm,
                 "Who is currently winning online — and by how much?")
    divider(c, H - 36*mm)

    # 3 competitor cards
    card_w = (W - MARGIN*2 - 6*mm - 8*mm) / 3
    card_h = 64*mm
    card_y = H - 112*mm
    for i, comp in enumerate(COMPETITORS):
        cx = MARGIN + 6*mm + i * (card_w + 4*mm)
        # Card
        c.setFillColor(CARD_BG)
        c.setStrokeColor(GREEN if i == 0 else BORDER)
        c.setLineWidth(1 if i == 0 else 0.5)
        c.roundRect(cx, card_y, card_w, card_h, 3, fill=1, stroke=1)
        # Rank badge
        c.setFillColor(GREEN if i == 0 else GRAY_SOFT)
        c.circle(cx + card_w - 9*mm, card_y + card_h - 8*mm, 5.5*mm, fill=1, stroke=0)
        c.setFont(MONO, 7)
        c.setFillColor(WHITE)
        c.drawCentredString(cx + card_w - 9*mm, card_y + card_h - 10*mm, f"#{i+1}")
        # Name
        name = comp["name"][:18]
        c.setFont(HEADING, 10)
        c.setFillColor(BLACK)
        c.drawString(cx + 4*mm, card_y + card_h - 18*mm, name)
        # Domain
        c.setFont(MONO, 7)
        c.setFillColor(MUTED)
        c.drawString(cx + 4*mm, card_y + card_h - 26*mm, comp["domain"][:24])
        # Divider
        c.setStrokeColor(BORDER)
        c.setLineWidth(0.5)
        c.line(cx + 4*mm, card_y + card_h - 29*mm,
               cx + card_w - 4*mm, card_y + card_h - 29*mm)
        # Authority
        c.setFont(MONO, 6)
        c.setFillColor(MUTED)
        c.drawString(cx + 4*mm, card_y + card_h - 36*mm, "AUTHORITY SCORE")
        c.setFont(HEADING, 14)
        c.setFillColor(BLACK)
        c.drawString(cx + 4*mm, card_y + card_h - 45*mm,
                     f"{comp['authority']} / 100")
        # Traffic
        c.setFont(MONO, 6)
        c.setFillColor(MUTED)
        c.drawString(cx + 4*mm, card_y + card_h - 52*mm, "MONTHLY TRAFFIC")
        c.setFont(HEADING, 14)
        c.setFillColor(GREEN)
        c.drawString(cx + 4*mm, card_y + card_h - 61*mm,
                     f"{comp['traffic']:,} visits")

    # Gap bar chart
    chart_y = H - 200*mm
    chart_h = 55*mm
    chart_w = W - MARGIN*2 - 6*mm
    section_label(c, MARGIN + 6*mm, chart_y + chart_h + 5*mm,
                  "TRAFFIC CAPTURED VS TOTAL MARKET")
    c.setFillColor(CARD_BG)
    c.roundRect(MARGIN + 6*mm, chart_y, chart_w, chart_h, 3, fill=1, stroke=0)

    total_captured = sum(comp["traffic"] for comp in COMPETITORS)
    dir_traffic    = int(TOTAL_VOL * DIRECTORY_PCT / 100)
    uncaptured     = TOTAL_VOL - dir_traffic - total_captured
    chart_data     = [comp["traffic"] for comp in COMPETITORS] + [uncaptured]
    chart_labels   = [comp["name"].split()[0] for comp in COMPETITORS] + ["Uncaptured"]
    chart_colors   = [GREEN, colors.HexColor("#5DD4A8"),
                      colors.HexColor("#A8EDD4"), GRAY_SOFT]
    max_v = max(chart_data) * 1.3
    bw    = chart_w / (len(chart_data) + 1)
    for i, (val, label, col) in enumerate(zip(chart_data, chart_labels, chart_colors)):
        bx = MARGIN + 6*mm + (i + 0.5) * bw
        bh = (val / max_v) * (chart_h - 16*mm)
        c.setFillColor(col)
        c.roundRect(bx, chart_y + 10*mm, bw * 0.65, bh, 2, fill=1, stroke=0)
        c.setFont(MONO, 6)
        c.setFillColor(BLACK)
        c.drawCentredString(bx + bw * 0.325, chart_y + 10*mm + bh + 2*mm, f"{val:,}")
        c.setFont(BODY, 7)
        c.setFillColor(MUTED)
        c.drawCentredString(bx + bw * 0.325, chart_y + 3*mm, label[:10])

    # Verdict
    v_y = chart_y - 22*mm
    c.setFillColor(GREEN_LIGHT)
    c.roundRect(MARGIN + 6*mm, v_y, W - MARGIN*2 - 6*mm, 18*mm, 4, fill=1, stroke=0)
    c.setFillColor(GREEN)
    c.roundRect(MARGIN + 6*mm, v_y, 4*mm, 18*mm, 0, fill=1, stroke=0)
    c.setFont(HEADING, 9)
    c.setFillColor(BLACK)
    c.drawString(MARGIN + 14*mm, v_y + 12*mm,
                 f"Verdict: The top competitor gets {COMPETITORS[0]['traffic']:,} visits from {TOTAL_VOL:,} monthly searches.")
    c.setFont(BODY, 9)
    c.setFillColor(MUTED)
    c.drawString(MARGIN + 14*mm, v_y + 5*mm,
                 f"{uncaptured:,} potential customers find no one. That gap is your opportunity.")

    footer(c, 4)
    c.showPage()


# ════════════════════════════════════════════════════════════════════════════════
# PAGE 5 — OUR SYSTEM + CTA (REDESIGNED)
# ════════════════════════════════════════════════════════════════════════════════
def page5(c):
    c.setFillColor(BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    left_accent(c)

    section_label(c, MARGIN + 6*mm, H - 20*mm, "THE FORTUNEMARQ SYSTEM")
    c.setFont(HEADING, 20)
    c.setFillColor(BLACK)
    c.drawString(MARGIN + 6*mm, H - 33*mm, "This is not an expense.")
    c.setFillColor(GREEN)
    c.drawString(MARGIN + 6*mm, H - 46*mm, "It is a system that pays you back.")
    divider(c, H - 50*mm)

    # Investment framing card
    c.setFillColor(BLACK)
    c.roundRect(MARGIN + 6*mm, H - 72*mm, W - MARGIN*2 - 6*mm, 18*mm, 4, fill=1, stroke=0)
    c.setFillColor(GREEN)
    c.roundRect(MARGIN + 6*mm, H - 72*mm, 4*mm, 18*mm, 0, fill=1, stroke=0)
    c.setFont(HEADING, 10)
    c.setFillColor(WHITE)
    c.drawString(MARGIN + 14*mm, H - 60*mm,
                 "Every rupee you invest should come back multiplied. We build systems that bring customers consistently.")
    c.setFont(BODY, 9)
    c.setFillColor(GREEN)
    c.drawString(MARGIN + 14*mm, H - 67*mm,
                 "Not one-time campaigns. Not JustDial leads. A permanent digital asset that works 24/7.")

    # 5-step timeline
    steps = [
        ("01", "Website",
         "A fast, mobile-optimised website built specifically for your niche and city. Every page is designed to convert a visitor into a phone call or enquiry. Your 24/7 digital storefront."),
        ("02", "Local SEO",
         "Your business appears at the top when customers search on Google for your service in your city. Organic rankings that compound over time — the longer you invest, the stronger you rank."),
        ("03", "Google & Meta Ads",
         "Paid campaigns that put you in front of customers who are actively searching for your service right now. Immediate lead flow while your SEO builds. Full transparency on every rupee spent."),
        ("04", "GMB Optimisation",
         "Your Google Business Profile becomes a lead generation machine. Optimised for calls, direction requests, and reviews. Customers searching locally find you first — before your competitors."),
        ("05", "Monthly Reports",
         "Every month you receive a detailed report — traffic, leads generated, keyword rankings, ad performance. You see exactly what is working and what is planned for next month. No guesswork."),
    ]

    # Timeline start
    tl_x    = MARGIN + 14*mm   # center of timeline dot
    tl_top  = H - 82*mm
    step_h  = 30*mm
    dot_r   = 3.5*mm
    line_x  = tl_x

    for i, (num, title, desc) in enumerate(steps):
        sy = tl_top - i * step_h

        # Vertical line connecting dots (except last)
        if i < len(steps) - 1:
            c.setStrokeColor(GREEN)
            c.setLineWidth(1.5)
            c.line(line_x, sy - dot_r, line_x, sy - step_h + dot_r)

        # Dot
        c.setFillColor(GREEN)
        c.circle(tl_x, sy, dot_r, fill=1, stroke=0)
        c.setFont(MONO, 6)
        c.setFillColor(WHITE)
        c.drawCentredString(tl_x, sy - 2*mm, num)

        # Step title
        c.setFont(HEADING, 11)
        c.setFillColor(BLACK)
        c.drawString(tl_x + 8*mm, sy + 1*mm, title)

        # Description — wrapped
        desc_x     = tl_x + 8*mm
        desc_y     = sy - 6*mm
        max_w      = W - MARGIN - 6*mm - desc_x
        words      = desc.split()
        line_txt   = ""
        for word in words:
            test = (line_txt + " " + word).strip()
            if c.stringWidth(test, BODY, 8) <= max_w:
                line_txt = test
            else:
                if line_txt:
                    c.setFont(BODY, 8)
                    c.setFillColor(MUTED)
                    c.drawString(desc_x, desc_y, line_txt)
                    desc_y -= 4.5*mm
                line_txt = word
        if line_txt:
            c.setFont(BODY, 8)
            c.setFillColor(MUTED)
            c.drawString(desc_x, desc_y, line_txt)

    # CTA Block
    cta_y = 20*mm
    cta_h = 38*mm
    c.setFillColor(BLACK)
    c.roundRect(MARGIN + 6*mm, cta_y, W - MARGIN*2 - 6*mm, cta_h, 4, fill=1, stroke=0)

    # Logo in CTA
    logo_path = os.path.join(BRAND, "Logo2_blackbackground.jpg")
    if os.path.exists(logo_path):
        c.drawImage(logo_path, MARGIN + 10*mm, cta_y + 10*mm,
                    width=22*mm, height=14*mm,
                    preserveAspectRatio=True, mask='auto')

    # WhatsApp button
    c.setFillColor(GREEN)
    c.roundRect(MARGIN + 36*mm, cta_y + 20*mm, 46*mm, 10*mm, 3, fill=1, stroke=0)
    c.setFont(MONO, 8)
    c.setFillColor(WHITE)
    c.drawCentredString(MARGIN + 59*mm, cta_y + 24*mm, "WhatsApp Us Now")

    # Contact info
    c.setFont(MONO, 8)
    c.setFillColor(WHITE)
    c.drawString(MARGIN + 90*mm, cta_y + 30*mm, "+91 93530 82656")
    c.setFont(BODY, 8)
    c.setFillColor(MUTED)
    c.drawString(MARGIN + 90*mm, cta_y + 23*mm, "fortunemarq@gmail.com")
    c.drawString(MARGIN + 90*mm, cta_y + 16*mm, "Galaxy Mall, J.C Nagar, Hubli — 580020")
    c.drawString(MARGIN + 90*mm, cta_y + 9*mm,  "fortunemarq.com")

    # Final footer
    c.setFillColor(GREEN)
    c.rect(0, 0, W, 11*mm, fill=1, stroke=0)
    c.setFont(MONO, 7)
    c.setFillColor(WHITE)
    c.drawCentredString(W/2, 4*mm,
                        "Marketing That Pays You Back  ·  FortuneMarq Media & Marketing  ·  fortunemarq.com")


# ── GENERATE ──────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    out_path = os.path.join(OUT, "Hubli_Gyms_EN.pdf")
    c = canvas.Canvas(out_path, pagesize=A4)
    c.setTitle(f"FortuneMarq — {NICHE} Market Report — {CITY}")
    page1(c)
    page2(c)
    page3(c)
    page4(c)
    page5(c)
    c.save()
    print(f"\n✓ PDF generated successfully: {out_path}\n")
