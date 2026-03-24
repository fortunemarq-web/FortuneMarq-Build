"""
FortuneMarq Market Intelligence PDF Generator
Sample: Hubli Gyms (English)
v3 — All layout fixes applied
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

BASE  = os.path.dirname(os.path.abspath(__file__))
BRAND = os.path.join(BASE, "00_MASTER", "Brand_Assets")
OUT   = os.path.join(BASE, "07_DATA_AND_RESEARCH", "Generated_PDFs", "Hubli")
os.makedirs(OUT, exist_ok=True)

pdfmetrics.registerFont(TTFont("JetBrains", os.path.join(BRAND, "JetBrainsMono-Regular.ttf")))
HEADING = "Helvetica-Bold"
BODY    = "Helvetica"
MONO    = "JetBrains"

GREEN       = colors.HexColor("#15BA7F")
GREEN_DARK  = colors.HexColor("#0D9E6A")
GREEN_LIGHT = colors.HexColor("#E8F8F2")
BLACK       = colors.HexColor("#111111")
WHITE       = colors.HexColor("#FFFFFF")
BG          = colors.HexColor("#FFFFFF")
CARD_BG     = colors.HexColor("#F5F5F5")
MUTED       = colors.HexColor("#666666")
BORDER      = colors.HexColor("#E0E0E0")
RED_SOFT    = colors.HexColor("#FF6B6B")
GRAY_SOFT   = colors.HexColor("#CCCCCC")

W, H   = A4
MARGIN = 18 * mm
INNER  = MARGIN + 6*mm          # left edge of content after accent bar
INNER_W = W - INNER - MARGIN    # usable content width

NICHE      = "Gyms"
CITY       = "Hubli"
TOTAL_VOL  = 30000
TOP_KEYWORDS = [
    ("Gym Near Me",           5000),
    ("Gymnasium Near Me",     5000),
    ("Gym In Hubli",          4500),
    ("Fitness Centre Hubli",  3500),
    ("Best Gym Hubli",        3000),
]
COMPETITORS = [
    {"name": "Xtreme Fitness",      "domain": "xtremefitness.co.in",       "authority": 12, "traffic": 3750},
    {"name": "Hubli Gymkhana Club", "domain": "hubligymkhanaclub.com",      "authority": 6,  "traffic": 2250},
    {"name": "Sanal Ladies Gym",    "domain": "sanaladiesgymandfitness.in", "authority": 1,  "traffic": 1500},
]
DIRECTORY_PCT = 70
LOCAL_PCT     = 25
UNCAPTURED    = 5

# ── HELPERS ───────────────────────────────────────────────────────────────────
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
    c.line(INNER, y, W - MARGIN, y)

def footer(c, page_num):
    c.setFillColor(BLACK)
    c.rect(0, 0, W, 11*mm, fill=1, stroke=0)
    c.setFont(MONO, 7)
    c.setFillColor(MUTED)
    c.drawString(INNER, 4*mm, f"{CITY} — {NICHE} Market Intelligence Report")
    c.setFillColor(colors.HexColor("#888888"))
    c.drawCentredString(W/2, 4*mm, f"0{page_num} / 05")
    c.setFillColor(GREEN)
    c.drawRightString(W - MARGIN, 4*mm, "fortunemarq.com")

def wrapped_text(c, text, x, y, max_w, font, size, color, lh):
    """Draw wrapped text, return final y."""
    c.setFont(font, size)
    c.setFillColor(color)
    words = text.split()
    line  = ""
    cur_y = y
    for w in words:
        test = (line + " " + w).strip()
        if c.stringWidth(test, font, size) <= max_w:
            line = test
        else:
            if line:
                c.drawString(x, cur_y, line)
                cur_y -= lh
            line = w
    if line:
        c.drawString(x, cur_y, line)
        cur_y -= lh
    return cur_y


# ════════════════════════════════════════════════════════════════════════════════
# PAGE 1 — COVER
# ════════════════════════════════════════════════════════════════════════════════
def page1(c):
    c.setFillColor(BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # Dark top band
    c.setFillColor(BLACK)
    c.rect(0, H - 36*mm, W, 36*mm, fill=1, stroke=0)
    c.setFillColor(GREEN)
    c.rect(0, H - 3*mm, W, 3*mm, fill=1, stroke=0)

    # Logo in band
    logo = os.path.join(BRAND, "Logo2_blackbackground.jpg")
    if os.path.exists(logo):
        c.drawImage(logo, MARGIN, H - 32*mm, width=26*mm, height=17*mm,
                    preserveAspectRatio=True, mask='auto')

    # Agency name
    c.setFont(HEADING, 11)
    c.setFillColor(WHITE)
    c.drawString(MARGIN + 30*mm, H - 17*mm, "FORTUNEMARQ MEDIA & MARKETING")
    c.setFont(MONO, 7)
    c.setFillColor(GREEN)
    c.drawString(MARGIN + 30*mm, H - 24*mm, "fortunemarq.com  ·  +91 93530 82656")

    # Data source — right of band
    c.setFont(MONO, 6)
    c.setFillColor(colors.HexColor("#888888"))
    c.drawRightString(W - MARGIN, H - 15*mm, "DATA SOURCE:")
    c.setFillColor(WHITE)
    c.drawRightString(W - MARGIN, H - 21*mm, "Google Keyword Planner")
    c.drawRightString(W - MARGIN, H - 27*mm, "Google Business Profile")

    # Report badge
    c.setFillColor(GREEN)
    c.roundRect(MARGIN, H - 50*mm, 70*mm, 9*mm, 2, fill=1, stroke=0)
    c.setFont(MONO, 7)
    c.setFillColor(WHITE)
    c.drawString(MARGIN + 4*mm, H - 45*mm, "MARKET INTELLIGENCE REPORT")

    # Headline
    c.setFont(HEADING, 28)
    c.setFillColor(BLACK)
    c.drawString(MARGIN, H - 68*mm, f"{NICHE.upper()} BUSINESSES")
    c.setFillColor(GREEN)
    c.drawString(MARGIN, H - 83*mm, f"IN {CITY.upper()}")

    # Subline
    c.setFont(BODY, 11)
    c.setFillColor(MUTED)
    c.drawString(MARGIN, H - 95*mm,
                 "Here is exactly what your customers are doing online —")
    c.setFillColor(BLACK)
    c.drawString(MARGIN, H - 104*mm,
                 "and where they are going instead of you.")

    divider(c, H - 108*mm)

    # Big number card — full width, properly contained
    card_x = MARGIN
    card_y = H - 158*mm
    card_w = W - MARGIN * 2
    card_h = 44*mm
    c.setFillColor(BLACK)
    c.roundRect(card_x, card_y, card_w, card_h, 4, fill=1, stroke=0)
    c.setFillColor(GREEN)
    c.roundRect(card_x, card_y, 5*mm, card_h, 0, fill=1, stroke=0)

    # Number — centered in card
    c.setFont(HEADING, 46)
    c.setFillColor(GREEN)
    c.drawString(card_x + 12*mm, card_y + card_h - 18*mm, f"{TOTAL_VOL:,}")

    c.setFont(BODY, 12)
    c.setFillColor(WHITE)
    c.drawString(card_x + 12*mm, card_y + card_h - 30*mm,
                 f"people searched for {NICHE.lower()} in {CITY} last month.")
    c.setFont(MONO, 8)
    c.setFillColor(GREEN)
    c.drawString(card_x + 12*mm, card_y + 8*mm,
                 "This report shows exactly where they went.")

    # Inside this report tags
    tags = ["Market Demand", "Traffic Split", "Competitor Data", "Your Opportunity"]
    tag_y = card_y - 18*mm
    c.setFont(MONO, 7)
    c.setFillColor(MUTED)
    c.drawString(MARGIN, tag_y + 11*mm, "INSIDE THIS REPORT:")
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

    divider(c, tag_y - 6*mm)

    # 3 stat cards
    sc_y = tag_y - 36*mm
    sc_h = 28*mm
    sc_w = (W - MARGIN * 2 - 8*mm) / 3
    stats = [
        ("TOP KEYWORD",       "gym near me"),
        ("MONTHLY SEARCHES",  f"{TOTAL_VOL:,}"),
        ("COMPETITION LEVEL", "LOW"),
    ]
    for i, (lbl, val) in enumerate(stats):
        sx = MARGIN + i * (sc_w + 4*mm)
        c.setFillColor(CARD_BG)
        c.setStrokeColor(BORDER)
        c.setLineWidth(0.5)
        c.roundRect(sx, sc_y, sc_w, sc_h, 3, fill=1, stroke=1)
        c.setFont(MONO, 6)
        c.setFillColor(MUTED)
        c.drawCentredString(sx + sc_w/2, sc_y + sc_h - 9*mm, lbl)
        c.setFont(HEADING, 11)
        c.setFillColor(BLACK)
        c.drawCentredString(sx + sc_w/2, sc_y + 8*mm, val)

    # Disclaimer
    c.setFont(MONO, 6)
    c.setFillColor(MUTED)
    c.drawString(MARGIN, sc_y - 7*mm,
                 "All data sourced from Google Keyword Planner and Google Business Profile.")

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

    section_label(c, INNER, H - 20*mm, "MARKET DEMAND")
    c.setFont(HEADING, 18)
    c.setFillColor(BLACK)
    c.drawString(INNER, H - 32*mm, "How many people are looking for your business?")
    divider(c, H - 36*mm)

    # Big number card
    c.setFillColor(GREEN_LIGHT)
    c.roundRect(INNER, H - 70*mm, INNER_W, 28*mm, 4, fill=1, stroke=0)
    c.setFillColor(GREEN)
    c.roundRect(INNER, H - 70*mm, 5*mm, 28*mm, 0, fill=1, stroke=0)
    c.setFont(HEADING, 38)
    c.setFillColor(GREEN)
    c.drawString(INNER + 12*mm, H - 50*mm, f"{TOTAL_VOL:,}")
    c.setFont(BODY, 10)
    c.setFillColor(BLACK)
    c.drawString(INNER + 12*mm, H - 60*mm,
                 f"searches per month for {NICHE.lower()} in {CITY}  ·  Source: Google Keyword Planner")

    # Keyword table
    section_label(c, INNER, H - 77*mm, "TOP SEARCH TERMS")
    divider(c, H - 80*mm)

    max_v = TOP_KEYWORDS[0][1]
    for i, (kw, vol) in enumerate(TOP_KEYWORDS):
        ry = H - 95*mm - i * 13*mm
        if i % 2 == 0:
            c.setFillColor(CARD_BG)
            c.rect(INNER, ry - 3*mm, INNER_W, 13*mm, fill=1, stroke=0)
        c.setFont(BODY, 10)
        c.setFillColor(BLACK)
        c.drawString(INNER + 4*mm, ry + 2*mm, kw)
        bar_max = 62*mm
        bw      = (vol / max_v) * bar_max
        c.setFillColor(GREEN_LIGHT)
        c.roundRect(W - MARGIN - 78*mm, ry + 1.5*mm, bar_max, 7*mm, 2, fill=1, stroke=0)
        c.setFillColor(GREEN)
        c.roundRect(W - MARGIN - 78*mm, ry + 1.5*mm, bw, 7*mm, 2, fill=1, stroke=0)
        c.setFont(MONO, 7)
        c.setFillColor(BLACK)
        c.drawRightString(W - MARGIN - 80*mm, ry + 3*mm, f"{vol:,}/mo")

    # Bar chart
    chart_y = H - 220*mm
    chart_h = 50*mm
    section_label(c, INNER, chart_y + chart_h + 5*mm, "MONTHLY VOLUME BY KEYWORD")
    c.setFillColor(CARD_BG)
    c.roundRect(INNER, chart_y, INNER_W, chart_h, 3, fill=1, stroke=0)
    vols   = [v for _, v in TOP_KEYWORDS]
    labels = [k.split()[0] for k, _ in TOP_KEYWORDS]
    max_vv = max(vols) * 1.25
    bw     = INNER_W / (len(vols) + 1)
    for i, (vol, label) in enumerate(zip(vols, labels)):
        bx = INNER + (i + 0.5) * bw
        bh = (vol / max_vv) * (chart_h - 18*mm)
        c.setFillColor(GREEN)
        c.roundRect(bx, chart_y + 12*mm, bw * 0.6, bh, 2, fill=1, stroke=0)
        c.setFont(MONO, 6)
        c.setFillColor(BLACK)
        c.drawCentredString(bx + bw * 0.3, chart_y + 12*mm + bh + 2*mm, f"{vol:,}")
        c.setFont(BODY, 7)
        c.setFillColor(MUTED)
        c.drawCentredString(bx + bw * 0.3, chart_y + 4*mm, label[:10])

    # Insight
    ins_y = chart_y - 20*mm
    c.setFillColor(BLACK)
    c.roundRect(INNER, ins_y, INNER_W, 16*mm, 3, fill=1, stroke=0)
    c.setFillColor(GREEN)
    c.roundRect(INNER, ins_y, 5*mm, 16*mm, 0, fill=1, stroke=0)
    c.setFont(MONO, 7)
    c.setFillColor(GREEN)
    c.drawString(INNER + 10*mm, ins_y + 10*mm, "INSIGHT")
    c.setFont(BODY, 9)
    c.setFillColor(WHITE)
    c.drawString(INNER + 10*mm, ins_y + 4*mm,
                 "Most of these searches happen on mobile. Most gym websites in Hubli are not mobile-optimised.")

    footer(c, 2)
    c.showPage()


# ════════════════════════════════════════════════════════════════════════════════
# PAGE 3 — TRAFFIC DISTRIBUTION (FIXED)
# ════════════════════════════════════════════════════════════════════════════════
def page3(c):
    c.setFillColor(BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    left_accent(c)

    section_label(c, INNER, H - 20*mm, "TRAFFIC DISTRIBUTION")
    c.setFont(HEADING, 18)
    c.setFillColor(BLACK)
    c.drawString(INNER, H - 32*mm,
                 f"Where do those {TOTAL_VOL:,} searches actually go?")
    divider(c, H - 36*mm)

    # Traffic split blocks — exact fit within margins
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
        x_pos += bw

    # 3 explanation boxes
    box_y = H - 190*mm
    box_h = 60*mm
    gap3  = 4*mm
    box_w = (INNER_W - gap3 * 2) / 3

    explanations = [
        ("01", "What Are Directories?",
         ["JustDial, Sulekha, and Practo",
          "list your business — but",
          "customers call through their",
          "platform. The directory owns",
          "the relationship, not you."]),
        ("02", "Why This Hurts You",
         ["Every lead from JustDial costs",
          "you money. You pay per enquiry.",
          "You lose control of pricing,",
          "reviews, and customer data.",
          "You are renting your customers."]),
        ("03", "The Direct Advantage",
         ["When customers find YOUR",
          "website directly on Google,",
          "they call your number.",
          "No middleman. No per-lead cost.",
          "You own the customer."]),
    ]
    for i, (num, title, lines) in enumerate(explanations):
        bx = INNER + i * (box_w + gap3)
        c.setFillColor(CARD_BG)
        c.setStrokeColor(BORDER)
        c.setLineWidth(0.5)
        c.roundRect(bx, box_y, box_w, box_h, 3, fill=1, stroke=1)
        # Number badge
        c.setFillColor(GREEN)
        c.roundRect(bx + 4*mm, box_y + box_h - 12*mm, 10*mm, 8*mm, 2, fill=1, stroke=0)
        c.setFont(MONO, 7)
        c.setFillColor(WHITE)
        c.drawCentredString(bx + 9*mm, box_y + box_h - 8.5*mm, num)
        # Title
        c.setFont(HEADING, 9)
        c.setFillColor(BLACK)
        c.drawString(bx + 4*mm, box_y + box_h - 22*mm, title)
        # Body lines
        line_y = box_y + box_h - 31*mm
        for line in lines:
            c.setFont(BODY, 8)
            c.setFillColor(MUTED)
            c.drawString(bx + 4*mm, line_y, line)
            line_y -= 5.5*mm

    # Bold statement box
    stmt_y = box_y - 24*mm
    c.setFillColor(BLACK)
    c.roundRect(INNER, stmt_y, INNER_W, 20*mm, 4, fill=1, stroke=0)
    c.setFillColor(GREEN)
    c.roundRect(INNER, stmt_y, 5*mm, 20*mm, 0, fill=1, stroke=0)
    c.setFont(HEADING, 10)
    c.setFillColor(WHITE)
    c.drawString(INNER + 10*mm, stmt_y + 13*mm,
                 "Every customer that finds you through JustDial is a customer JustDial owns — not you.")
    c.setFont(BODY, 9)
    c.setFillColor(GREEN)
    c.drawString(INNER + 10*mm, stmt_y + 5*mm,
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

    section_label(c, INNER, H - 20*mm, "COMPETITION ANALYSIS")
    c.setFont(HEADING, 18)
    c.setFillColor(BLACK)
    c.drawString(INNER, H - 32*mm,
                 "Who is currently winning online — and by how much?")
    divider(c, H - 36*mm)

    # 3 competitor cards
    gap4  = 4*mm
    card_w = (INNER_W - gap4 * 2) / 3
    card_h = 66*mm
    card_y = H - 114*mm
    for i, comp in enumerate(COMPETITORS):
        cx = INNER + i * (card_w + gap4)
        c.setFillColor(CARD_BG)
        c.setStrokeColor(GREEN if i == 0 else BORDER)
        c.setLineWidth(1 if i == 0 else 0.5)
        c.roundRect(cx, card_y, card_w, card_h, 3, fill=1, stroke=1)
        # Rank
        c.setFillColor(GREEN if i == 0 else GRAY_SOFT)
        c.circle(cx + card_w - 9*mm, card_y + card_h - 8*mm, 5.5*mm, fill=1, stroke=0)
        c.setFont(MONO, 7)
        c.setFillColor(WHITE)
        c.drawCentredString(cx + card_w - 9*mm, card_y + card_h - 10.5*mm, f"#{i+1}")
        # Name — truncate cleanly
        name = comp["name"]
        while c.stringWidth(name, HEADING, 10) > card_w - 16*mm and len(name) > 5:
            name = name[:-2]
        if name != comp["name"]:
            name = name + ".."
        c.setFont(HEADING, 10)
        c.setFillColor(BLACK)
        c.drawString(cx + 4*mm, card_y + card_h - 19*mm, name)
        # Domain — truncate cleanly
        domain = comp["domain"]
        while c.stringWidth(domain, MONO, 7) > card_w - 10*mm and len(domain) > 5:
            domain = domain[:-2]
        if domain != comp["domain"]:
            domain = domain + ".."
        c.setFont(MONO, 7)
        c.setFillColor(MUTED)
        c.drawString(cx + 4*mm, card_y + card_h - 27*mm, domain)
        # Line
        c.setStrokeColor(BORDER)
        c.setLineWidth(0.5)
        c.line(cx + 4*mm, card_y + card_h - 30*mm, cx + card_w - 4*mm, card_y + card_h - 30*mm)
        # Authority
        c.setFont(MONO, 6)
        c.setFillColor(MUTED)
        c.drawString(cx + 4*mm, card_y + card_h - 38*mm, "AUTHORITY SCORE")
        c.setFont(HEADING, 14)
        c.setFillColor(BLACK)
        c.drawString(cx + 4*mm, card_y + card_h - 48*mm, f"{comp['authority']} / 100")
        # Traffic
        c.setFont(MONO, 6)
        c.setFillColor(MUTED)
        c.drawString(cx + 4*mm, card_y + card_h - 56*mm, "MONTHLY TRAFFIC")
        c.setFont(HEADING, 14)
        c.setFillColor(GREEN)
        c.drawString(cx + 4*mm, card_y + card_h - 66*mm, f"{comp['traffic']:,} visits")

    # Bar chart
    chart_y = H - 202*mm
    chart_h = 55*mm
    section_label(c, INNER, chart_y + chart_h + 5*mm,
                  "TRAFFIC CAPTURED VS TOTAL MARKET")
    c.setFillColor(CARD_BG)
    c.roundRect(INNER, chart_y, INNER_W, chart_h, 3, fill=1, stroke=0)

    dir_traffic = int(TOTAL_VOL * DIRECTORY_PCT / 100)
    uncaptured  = TOTAL_VOL - dir_traffic - sum(c2["traffic"] for c2 in COMPETITORS)
    chart_data  = [comp["traffic"] for comp in COMPETITORS] + [uncaptured]
    clabels     = [comp["name"].split()[0] for comp in COMPETITORS] + ["Uncaptured"]
    chart_cols  = [GREEN, colors.HexColor("#5DD4A8"),
                   colors.HexColor("#A8EDD4"), GRAY_SOFT]
    max_v = max(chart_data) * 1.3
    bw    = INNER_W / (len(chart_data) + 1)
    for i, (val, lbl, col) in enumerate(zip(chart_data, clabels, chart_cols)):
        bx = INNER + (i + 0.5) * bw
        bh = (val / max_v) * (chart_h - 18*mm)
        c.setFillColor(col)
        c.roundRect(bx, chart_y + 12*mm, bw * 0.65, bh, 2, fill=1, stroke=0)
        c.setFont(MONO, 6)
        c.setFillColor(BLACK)
        c.drawCentredString(bx + bw * 0.325, chart_y + 12*mm + bh + 2*mm, f"{val:,}")
        c.setFont(BODY, 7)
        c.setFillColor(MUTED)
        c.drawCentredString(bx + bw * 0.325, chart_y + 4*mm, lbl[:12])

    # Verdict
    v_y = chart_y - 22*mm
    c.setFillColor(GREEN_LIGHT)
    c.roundRect(INNER, v_y, INNER_W, 18*mm, 4, fill=1, stroke=0)
    c.setFillColor(GREEN)
    c.roundRect(INNER, v_y, 5*mm, 18*mm, 0, fill=1, stroke=0)
    c.setFont(HEADING, 9)
    c.setFillColor(BLACK)
    c.drawString(INNER + 10*mm, v_y + 12*mm,
                 f"Verdict: The top competitor gets {COMPETITORS[0]['traffic']:,} visits from {TOTAL_VOL:,} monthly searches.")
    c.setFont(BODY, 9)
    c.setFillColor(MUTED)
    c.drawString(INNER + 10*mm, v_y + 5*mm,
                 f"{uncaptured:,} potential customers find no one. That gap is your opportunity.")

    footer(c, 4)
    c.showPage()


# ════════════════════════════════════════════════════════════════════════════════
# PAGE 5 — OUR SYSTEM + CTA (FIXED)
# ════════════════════════════════════════════════════════════════════════════════
def page5(c):
    c.setFillColor(BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    left_accent(c)

    section_label(c, INNER, H - 20*mm, "THE FORTUNEMARQ SYSTEM")
    c.setFont(HEADING, 20)
    c.setFillColor(BLACK)
    c.drawString(INNER, H - 33*mm, "This is not an expense.")
    c.setFillColor(GREEN)
    c.drawString(INNER, H - 46*mm, "It is a system that pays you back.")
    divider(c, H - 50*mm)

    # Investment framing card — wrap text properly
    fc_y = H - 74*mm
    fc_h = 20*mm
    c.setFillColor(BLACK)
    c.roundRect(INNER, fc_y, INNER_W, fc_h, 4, fill=1, stroke=0)
    c.setFillColor(GREEN)
    c.roundRect(INNER, fc_y, 5*mm, fc_h, 0, fill=1, stroke=0)

    # Wrap text within card — max width = INNER_W - left padding - right padding
    max_card_w = INNER_W - 16*mm
    line1 = "Every rupee you invest should come back multiplied."
    line2 = "We build systems that bring customers consistently — not one-time campaigns."
    line3 = "Not JustDial leads. A permanent digital asset working 24/7."
    c.setFont(HEADING, 9)
    c.setFillColor(WHITE)
    c.drawString(INNER + 10*mm, fc_y + 14*mm, line1)
    c.setFont(BODY, 8)
    c.setFillColor(GREEN)
    c.drawString(INNER + 10*mm, fc_y + 8*mm, line2)
    c.setFont(BODY, 8)
    c.setFillColor(colors.HexColor("#888888"))
    c.drawString(INNER + 10*mm, fc_y + 3*mm, line3)

    # 5-step timeline
    steps = [
        ("01", "Website",
         "A fast, mobile-optimised website built for your niche and city. Every page is designed to convert a visitor into a phone call or enquiry. Your 24/7 digital storefront."),
        ("02", "Local SEO",
         "Your business appears at the top when customers search on Google for your service in your city. Organic rankings that compound over time — the longer you invest, the stronger you rank."),
        ("03", "Google & Meta Ads",
         "Paid campaigns that put you in front of customers actively searching for your service right now. Immediate lead flow while SEO builds. Full transparency on every rupee spent."),
        ("04", "GMB Optimisation",
         "Your Google Business Profile becomes a lead generation machine — calls, direction requests, reviews. Customers searching locally find you first, before your competitors."),
        ("05", "Monthly Reports",
         "Every month you receive a detailed report — traffic, leads, keyword rankings, ad performance. You see exactly what is working and what is planned for next month. No guesswork."),
    ]

    tl_x   = INNER + 5*mm
    tl_y   = fc_y - 8*mm
    dot_r  = 3.5*mm
    step_h = 27*mm

    for i, (num, title, desc) in enumerate(steps):
        sy = tl_y - i * step_h

        # Connector line
        if i < len(steps) - 1:
            c.setStrokeColor(GREEN)
            c.setLineWidth(1.5)
            c.line(tl_x, sy - dot_r, tl_x, sy - step_h + dot_r)

        # Dot
        c.setFillColor(GREEN)
        c.circle(tl_x, sy, dot_r, fill=1, stroke=0)
        c.setFont(MONO, 6)
        c.setFillColor(WHITE)
        c.drawCentredString(tl_x, sy - 2*mm, num)

        # Title
        tx = tl_x + 8*mm
        c.setFont(HEADING, 11)
        c.setFillColor(BLACK)
        c.drawString(tx, sy + 1.5*mm, title)

        # Description — wrapped, max width = right margin minus text start
        max_desc_w = W - MARGIN - tx - 2*mm
        desc_y     = sy - 6*mm
        words      = desc.split()
        line_txt   = ""
        for word in words:
            test = (line_txt + " " + word).strip()
            if c.stringWidth(test, BODY, 8) <= max_desc_w:
                line_txt = test
            else:
                if line_txt:
                    c.setFont(BODY, 8)
                    c.setFillColor(MUTED)
                    c.drawString(tx, desc_y, line_txt)
                    desc_y -= 4.5*mm
                line_txt = word
        if line_txt:
            c.setFont(BODY, 8)
            c.setFillColor(MUTED)
            c.drawString(tx, desc_y, line_txt)

    # CTA block
    cta_y = 18*mm
    cta_h = 40*mm
    c.setFillColor(BLACK)
    c.roundRect(INNER, cta_y, INNER_W, cta_h, 4, fill=1, stroke=0)

    # Logo
    logo = os.path.join(BRAND, "Logo2_blackbackground.jpg")
    if os.path.exists(logo):
        c.drawImage(logo, INNER + 8*mm, cta_y + 12*mm,
                    width=22*mm, height=14*mm,
                    preserveAspectRatio=True, mask='auto')

    # WhatsApp button
    c.setFillColor(GREEN)
    c.roundRect(INNER + 34*mm, cta_y + 22*mm, 50*mm, 11*mm, 3, fill=1, stroke=0)
    c.setFont(MONO, 8)
    c.setFillColor(WHITE)
    c.drawCentredString(INNER + 59*mm, cta_y + 26.5*mm, "WhatsApp Us Now")

    # Contact details — right side of CTA
    cx2 = INNER + 90*mm
    c.setFont(MONO, 9)
    c.setFillColor(WHITE)
    c.drawString(cx2, cta_y + 30*mm, "+91 93530 82656")
    c.setFont(BODY, 8)
    c.setFillColor(colors.HexColor("#888888"))
    c.drawString(cx2, cta_y + 23*mm, "fortunemarq@gmail.com")
    c.drawString(cx2, cta_y + 17*mm, "Galaxy Mall, J.C Nagar, Hubli — 580020")
    c.drawString(cx2, cta_y + 11*mm, "fortunemarq.com")

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
    cv = canvas.Canvas(out_path, pagesize=A4)
    cv.setTitle(f"FortuneMarq — {NICHE} Market Report — {CITY}")
    page1(cv)
    page2(cv)
    page3(cv)
    page4(cv)
    page5(cv)
    cv.save()
    print(f"\n  PDF generated: {out_path}\n")
