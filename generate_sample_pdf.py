"""
FortuneMarq Market Intelligence PDF Generator
Sample: Hubli Gyms (English)
Design: Light theme, brand compliant
"""

import os
import csv
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing, Rect, String, Line
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics import renderPDF

# ── PATHS ─────────────────────────────────────────────────────────────────────
BASE = os.path.dirname(os.path.abspath(__file__))
BRAND = os.path.join(BASE, "00_MASTER", "Brand_Assets")
DATA  = os.path.join(BASE, "07_DATA_AND_RESEARCH")
OUT   = os.path.join(BASE, "07_DATA_AND_RESEARCH", "Generated_PDFs", "Hubli")
os.makedirs(OUT, exist_ok=True)

# ── FONTS ─────────────────────────────────────────────────────────────────────
# Alliance1 fallback to Helvetica
# Alliance2 fallback to Helvetica
pdfmetrics.registerFont(TTFont("JetBrains", os.path.join(BRAND, "JetBrainsMono-Regular.ttf")))

# ── BRAND COLORS ──────────────────────────────────────────────────────────────
GREEN       = colors.HexColor("#15BA7F")
BLACK       = colors.HexColor("#111111")
WHITE       = colors.HexColor("#FFFFFF")
BG          = colors.HexColor("#FFFFFF")
CARD_BG     = colors.HexColor("#F5F5F5")
MUTED       = colors.HexColor("#555555")
BORDER      = colors.HexColor("#E0E0E0")
GREEN_LIGHT = colors.HexColor("#E8F8F2")

W, H = A4  # 595 x 842 pts
MARGIN = 20 * mm

# ── DATA ──────────────────────────────────────────────────────────────────────
NICHE       = "Gyms"
CITY        = "Hubli"
TOTAL_VOL   = 30000
TOP_KEYWORDS = [
    ("gym near me",            5000),
    ("gymnasium near me",      5000),
    ("gym in hubli",           4500),
    ("fitness centre hubli",   3500),
    ("best gym hubli",         3000),
]
COMPETITORS = [
    {"name": "Xtreme Fitness",        "domain": "xtremefitness.co.in",        "authority": 12, "traffic": 3750},
    {"name": "Hubli Gymkhana Club",   "domain": "hubligymkhanaclub.com",       "authority": 6,  "traffic": 2250},
    {"name": "Sanal Ladies Gym",      "domain": "sanaladiesgymandfitness.in",  "authority": 1,  "traffic": 1500},
]
DIRECTORY_PCT = 70
LOCAL_PCT     = 25
UNCAPTURED    = 5

# ── CANVAS HELPER ─────────────────────────────────────────────────────────────
class PDFCanvas:
    def __init__(self, path):
        self.c = canvas.Canvas(path, pagesize=A4)
        self.c.setTitle(f"FortuneMarq — {NICHE} Market Report — {CITY}")

    def save(self):
        self.c.save()

    def new_page(self):
        self.c.showPage()

    # Background
    def bg(self, color=None):
        c = color or BG
        self.c.setFillColor(c)
        self.c.rect(0, 0, W, H, fill=1, stroke=0)

    # Green header bar
    def header_bar(self, height=14*mm):
        self.c.setFillColor(GREEN)
        self.c.rect(0, H - height, W, height, fill=1, stroke=0)

    # Footer bar
    def footer_bar(self, height=10*mm):
        self.c.setFillColor(BLACK)
        self.c.rect(0, 0, W, height, fill=1, stroke=0)

    # Text
    def text(self, x, y, txt, font="Helvetica-Bold", size=11, color=BLACK, align="left"):
        self.c.setFont(font, size)
        self.c.setFillColor(color)
        if align == "center":
            self.c.drawCentredString(x, y, txt)
        elif align == "right":
            self.c.drawRightString(x, y, txt)
        else:
            self.c.drawString(x, y, txt)

    # Colored rect
    def rect(self, x, y, w, h, fill=CARD_BG, stroke_color=None, radius=3):
        self.c.setFillColor(fill)
        if stroke_color:
            self.c.setStrokeColor(stroke_color)
            self.c.setLineWidth(0.5)
            self.c.roundRect(x, y, w, h, radius, fill=1, stroke=1)
        else:
            self.c.roundRect(x, y, w, h, radius, fill=1, stroke=0)

    # Horizontal line
    def line(self, x1, y1, x2, y2, color=BORDER, width=0.5):
        self.c.setStrokeColor(color)
        self.c.setLineWidth(width)
        self.c.line(x1, y1, x2, y2)

    # Logo
    def logo(self, x, y, size=8*mm, dark=True):
        logo_file = "Logo1_whitebackground.jpg" if not dark else "Logo2_blackbackground.jpg"
        logo_path = os.path.join(BRAND, logo_file)
        if os.path.exists(logo_path):
            self.c.drawImage(logo_path, x, y, width=size*3.2, height=size,
                           preserveAspectRatio=True, mask='auto')

    # Bar chart (manual drawing)
    def bar_chart(self, x, y, w, h, data, labels, color=GREEN, bg=CARD_BG):
        # Background
        self.rect(x, y, w, h, fill=bg)
        if not data:
            return
        max_val = max(data) * 1.2
        bar_w = (w - 20*mm) / len(data)
        pad = 5*mm
        chart_h = h - 20*mm
        # Bars
        for i, (val, label) in enumerate(zip(data, labels)):
            bar_h = (val / max_val) * chart_h if max_val > 0 else 0
            bx = x + pad + i * bar_w + bar_w * 0.1
            by = y + 12*mm
            bw = bar_w * 0.75
            # Bar fill
            self.c.setFillColor(color)
            self.c.roundRect(bx, by, bw, bar_h, 2, fill=1, stroke=0)
            # Value label on top
            self.c.setFont("JetBrains", 6)
            self.c.setFillColor(BLACK)
            self.c.drawCentredString(bx + bw/2, by + bar_h + 2*mm,
                                     f"{val:,}")
            # X label
            self.c.setFont("Helvetica", 6)
            self.c.setFillColor(MUTED)
            # Wrap long labels
            short = label[:12] + ".." if len(label) > 14 else label
            self.c.drawCentredString(bx + bw/2, y + 4*mm, short)

    # Donut-style pie (simplified as colored blocks)
    def traffic_split(self, cx, cy, r):
        import math
        segments = [
            (DIRECTORY_PCT, colors.HexColor("#FF6B6B"), "Directories\n(JustDial, Sulekha)"),
            (LOCAL_PCT,     GREEN,                       "Local Websites"),
            (UNCAPTURED,    colors.HexColor("#AAAAAA"),  "Uncaptured"),
        ]
        start = 90
        for pct, col, label in segments:
            sweep = pct * 3.6
            self.c.setFillColor(col)
            self.c.wedge(cx - r, cy - r, cx + r, cy + r,
                        start, sweep, fill=1, stroke=0)
            start += sweep


# ════════════════════════════════════════════════════════════════════════════════
# PAGE 1 — COVER
# ════════════════════════════════════════════════════════════════════════════════
def page1(p):
    p.bg(BG)

    # Top green strip
    p.c.setFillColor(GREEN)
    p.c.rect(0, H - 3*mm, W, 3*mm, fill=1, stroke=0)

    # Left green accent bar
    p.c.setFillColor(GREEN)
    p.c.rect(0, 0, 4*mm, H, fill=1, stroke=0)

    # Logo top right
    p.logo(W - 52*mm, H - 22*mm, size=10*mm, dark=False)

    # "MARKET INTELLIGENCE REPORT" label
    p.text(MARGIN + 6*mm, H - 35*mm, "MARKET INTELLIGENCE REPORT",
           font="JetBrains", size=8, color=GREEN)

    # Divider line
    p.line(MARGIN + 6*mm, H - 38*mm, W - MARGIN, H - 38*mm, color=BORDER)

    # City + Niche
    p.text(MARGIN + 6*mm, H - 52*mm, f"{CITY.upper()} — {NICHE.upper()}",
           font="Helvetica-Bold", size=28, color=BLACK)

    # THE BIG NUMBER
    p.c.setFillColor(GREEN_LIGHT)
    p.c.roundRect(MARGIN + 6*mm, H - 110*mm, W - MARGIN*2 - 6*mm, 48*mm, 4, fill=1, stroke=0)

    p.text(W/2, H - 78*mm,
           f"{TOTAL_VOL:,}",
           font="Helvetica-Bold", size=52, color=GREEN, align="center")

    p.text(W/2, H - 96*mm,
           "people search for gyms in Hubli every month.",
           font="Helvetica", size=13, color=BLACK, align="center")

    # Divider
    p.line(MARGIN + 6*mm, H - 118*mm, W - MARGIN, H - 118*mm, color=BORDER)

    # Subheadline
    p.text(MARGIN + 6*mm, H - 130*mm,
           "This report shows where that traffic goes,",
           font="Helvetica", size=12, color=MUTED)
    p.text(MARGIN + 6*mm, H - 141*mm,
           "who is capturing it — and the gap you can own.",
           font="Helvetica", size=12, color=BLACK)

    # Three stat cards
    card_w = (W - MARGIN*2 - 6*mm - 8*mm) / 3
    card_h = 28*mm
    card_y = H - 185*mm
    stats = [
        ("TOP KEYWORD", "gym near me"),
        ("MONTHLY SEARCHES", f"{TOTAL_VOL:,}"),
        ("COMPETITION LEVEL", "LOW"),
    ]
    for i, (label, val) in enumerate(stats):
        cx = MARGIN + 6*mm + i * (card_w + 4*mm)
        p.rect(cx, card_y, card_w, card_h, fill=CARD_BG, stroke_color=BORDER)
        p.text(cx + card_w/2, card_y + card_h - 8*mm,
               label, font="JetBrains", size=6, color=MUTED, align="center")
        p.text(cx + card_w/2, card_y + 8*mm,
               val, font="Helvetica-Bold", size=13, color=BLACK, align="center")

    # Bottom tagline
    p.c.setFillColor(BLACK)
    p.c.rect(0, 0, W, 22*mm, fill=1, stroke=0)
    p.text(MARGIN + 6*mm, 8*mm,
           "Marketing That Pays You Back",
           font="Helvetica", size=10, color=GREEN)
    p.text(W - MARGIN, 8*mm,
           "fortunemarq.com",
           font="JetBrains", size=8, color=WHITE, align="right")

    # Page number
    p.text(W/2, 4*mm, "01 / 05", font="JetBrains", size=7, color=MUTED, align="center")
    p.new_page()


# ════════════════════════════════════════════════════════════════════════════════
# PAGE 2 — MARKET DEMAND
# ════════════════════════════════════════════════════════════════════════════════
def page2(p):
    p.bg(BG)
    p.c.setFillColor(GREEN)
    p.c.rect(0, 0, 4*mm, H, fill=1, stroke=0)

    # Header
    p.text(MARGIN + 6*mm, H - 22*mm,
           "MARKET DEMAND", font="JetBrains", size=9, color=GREEN)
    p.text(MARGIN + 6*mm, H - 34*mm,
           "How many people are looking for your business?",
           font="Helvetica-Bold", size=18, color=BLACK)
    p.line(MARGIN + 6*mm, H - 38*mm, W - MARGIN, H - 38*mm, color=BORDER)

    # Big number + context
    p.c.setFillColor(GREEN_LIGHT)
    p.c.roundRect(MARGIN + 6*mm, H - 72*mm, W - MARGIN*2 - 6*mm, 28*mm, 4, fill=1, stroke=0)
    p.text(MARGIN + 18*mm, H - 52*mm,
           f"{TOTAL_VOL:,}", font="Helvetica-Bold", size=40, color=GREEN)
    p.text(MARGIN + 18*mm, H - 63*mm,
           f"searches per month for {NICHE.lower()} in {CITY}",
           font="Helvetica", size=11, color=BLACK)

    # Keyword table header
    p.text(MARGIN + 6*mm, H - 84*mm,
           "TOP SEARCH TERMS", font="JetBrains", size=8, color=MUTED)
    p.line(MARGIN + 6*mm, H - 87*mm, W - MARGIN, H - 87*mm, color=BORDER)

    # Keyword rows
    row_h = 11*mm
    max_kw_vol = TOP_KEYWORDS[0][1]
    for i, (kw, vol) in enumerate(TOP_KEYWORDS):
        ry = H - 100*mm - i * row_h
        # Alternating background
        if i % 2 == 0:
            p.rect(MARGIN + 6*mm, ry - 2*mm,
                   W - MARGIN*2 - 6*mm, row_h, fill=CARD_BG)
        # Keyword
        p.text(MARGIN + 10*mm, ry + 3*mm,
               kw.title(), font="Helvetica", size=10, color=BLACK)
        # Volume bar
        bar_max_w = 60*mm
        bar_w_val = (vol / max_kw_vol) * bar_max_w
        p.c.setFillColor(GREEN_LIGHT)
        p.c.roundRect(W - MARGIN - 75*mm, ry + 2*mm, bar_max_w, 6*mm, 2, fill=1, stroke=0)
        p.c.setFillColor(GREEN)
        p.c.roundRect(W - MARGIN - 75*mm, ry + 2*mm, bar_w_val, 6*mm, 2, fill=1, stroke=0)
        # Volume number
        p.text(W - MARGIN - 12*mm, ry + 3*mm,
               f"{vol:,}/mo", font="JetBrains", size=8, color=BLACK, align="right")

    # Bar chart - keyword volumes
    chart_y = H - 230*mm
    chart_h = 50*mm
    chart_w = W - MARGIN*2 - 6*mm
    p.text(MARGIN + 6*mm, chart_y + chart_h + 6*mm,
           "MONTHLY SEARCH VOLUME BY KEYWORD", font="JetBrains", size=8, color=MUTED)
    vols   = [v for _, v in TOP_KEYWORDS]
    labels = [k.split()[0].title() for k, _ in TOP_KEYWORDS]
    p.bar_chart(MARGIN + 6*mm, chart_y, chart_w, chart_h, vols, labels)

    # Insight box
    insight_y = chart_y - 22*mm
    p.c.setFillColor(BLACK)
    p.c.roundRect(MARGIN + 6*mm, insight_y, W - MARGIN*2 - 6*mm, 18*mm, 4, fill=1, stroke=0)
    p.text(MARGIN + 12*mm, insight_y + 11*mm,
           "💡  Insight:", font="JetBrains", size=8, color=GREEN)
    p.text(MARGIN + 12*mm, insight_y + 4*mm,
           "Most of these searches happen on mobile. Most gym websites in Hubli are not mobile-optimised.",
           font="Helvetica", size=9, color=WHITE)

    # Footer
    p.c.setFillColor(BLACK)
    p.c.rect(0, 0, W, 12*mm, fill=1, stroke=0)
    p.text(MARGIN + 6*mm, 4*mm, f"{CITY} — {NICHE} Market Report",
           font="JetBrains", size=7, color=MUTED)
    p.text(W/2, 4*mm, "02 / 05", font="JetBrains", size=7, color=MUTED, align="center")
    p.text(W - MARGIN, 4*mm, "fortunemarq.com",
           font="JetBrains", size=7, color=GREEN, align="right")
    p.new_page()


# ════════════════════════════════════════════════════════════════════════════════
# PAGE 3 — TRAFFIC DISTRIBUTION
# ════════════════════════════════════════════════════════════════════════════════
def page3(p):
    p.bg(BG)
    p.c.setFillColor(GREEN)
    p.c.rect(0, 0, 4*mm, H, fill=1, stroke=0)

    # Header
    p.text(MARGIN + 6*mm, H - 22*mm,
           "TRAFFIC DISTRIBUTION", font="JetBrains", size=9, color=GREEN)
    p.text(MARGIN + 6*mm, H - 34*mm,
           "Where do those 30,000 searches actually go?",
           font="Helvetica-Bold", size=18, color=BLACK)
    p.line(MARGIN + 6*mm, H - 38*mm, W - MARGIN, H - 38*mm, color=BORDER)

    # Visual split — 3 large blocks
    block_y = H - 105*mm
    block_h = 55*mm
    total_w = W - MARGIN*2 - 6*mm
    blocks = [
        (DIRECTORY_PCT, colors.HexColor("#FF6B6B"), "DIRECTORIES", "JustDial, Sulekha,\nPracto & others"),
        (LOCAL_PCT,     GREEN,                       "LOCAL WEBSITES", "Gym websites\nranking on Google"),
        (UNCAPTURED,    colors.HexColor("#CCCCCC"),  "UNCAPTURED", "No result found,\nbounce back"),
    ]
    x_pos = MARGIN + 6*mm
    for pct, col, label, sub in blocks:
        bw = (pct / 100) * total_w
        p.c.setFillColor(col)
        p.c.roundRect(x_pos, block_y, bw - 1*mm, block_h, 3, fill=1, stroke=0)
        # Percentage
        p.c.setFont("Helvetica-Bold", 22)
        p.c.setFillColor(WHITE)
        p.c.drawCentredString(x_pos + bw/2, block_y + block_h - 14*mm, f"{pct}%")
        # Label
        p.c.setFont("JetBrains", 6)
        p.c.drawCentredString(x_pos + bw/2, block_y + 6*mm, label)
        x_pos += bw

    # Volume numbers under blocks
    x_pos = MARGIN + 6*mm
    for pct, col, label, sub in blocks:
        bw = (pct / 100) * total_w
        vol = int(TOTAL_VOL * pct / 100)
        p.text(x_pos + bw/2, block_y - 8*mm,
               f"~{vol:,} searches", font="JetBrains", size=7,
               color=MUTED, align="center")
        x_pos += bw

    # 3 explanation boxes
    box_y = H - 185*mm
    box_h = 52*mm
    box_w = (W - MARGIN*2 - 6*mm - 8*mm) / 3
    explanations = [
        ("01", "What Are Directories?",
         "JustDial, Sulekha, and Practo list your business — but customers call through their platform. The directory owns the relationship, not you."),
        ("02", "Why This Hurts You",
         "Every lead from JustDial costs you money. You pay per enquiry. You lose control of pricing, reviews, and customer data."),
        ("03", "The Direct Traffic Advantage",
         "When customers find YOUR website directly on Google, they call your number. No middleman. No per-lead cost. You own the customer."),
    ]
    for i, (num, title, body) in enumerate(explanations):
        bx = MARGIN + 6*mm + i * (box_w + 4*mm)
        p.rect(bx, box_y, box_w, box_h, fill=CARD_BG, stroke_color=BORDER)
        # Number badge
        p.c.setFillColor(GREEN)
        p.c.roundRect(bx + 4*mm, box_y + box_h - 10*mm, 8*mm, 7*mm, 2, fill=1, stroke=0)
        p.text(bx + 8*mm, box_y + box_h - 7*mm,
               num, font="JetBrains", size=7, color=WHITE, align="center")
        # Title
        p.text(bx + 4*mm, box_y + box_h - 18*mm,
               title, font="Helvetica-Bold", size=10, color=BLACK)
        # Body — wrap text manually
        words = body.split()
        line = ""
        line_y = box_y + box_h - 28*mm
        for word in words:
            test = line + " " + word if line else word
            if len(test) > 32:
                p.text(bx + 4*mm, line_y, line, font="Helvetica", size=8, color=MUTED)
                line_y -= 5*mm
                line = word
            else:
                line = test
        if line:
            p.text(bx + 4*mm, line_y, line, font="Helvetica", size=8, color=MUTED)

    # Bold statement
    stmt_y = box_y - 22*mm
    p.c.setFillColor(BLACK)
    p.c.roundRect(MARGIN + 6*mm, stmt_y, W - MARGIN*2 - 6*mm, 18*mm, 4, fill=1, stroke=0)
    p.c.setFillColor(GREEN)
    p.c.roundRect(MARGIN + 6*mm, stmt_y, 3*mm, 18*mm, 0, fill=1, stroke=0)
    p.text(MARGIN + 14*mm, stmt_y + 11*mm,
           "Every customer that finds you through JustDial is a customer JustDial owns — not you.",
           font="Helvetica-Bold", size=10, color=WHITE)
    p.text(MARGIN + 14*mm, stmt_y + 4*mm,
           "FortuneMarq builds you a system where customers find YOU directly.",
           font="Helvetica", size=9, color=GREEN)

    # Footer
    p.c.setFillColor(BLACK)
    p.c.rect(0, 0, W, 12*mm, fill=1, stroke=0)
    p.text(MARGIN + 6*mm, 4*mm, f"{CITY} — {NICHE} Market Report",
           font="JetBrains", size=7, color=MUTED)
    p.text(W/2, 4*mm, "03 / 05", font="JetBrains", size=7, color=MUTED, align="center")
    p.text(W - MARGIN, 4*mm, "fortunemarq.com",
           font="JetBrains", size=7, color=GREEN, align="right")
    p.new_page()


# ════════════════════════════════════════════════════════════════════════════════
# PAGE 4 — COMPETITION
# ════════════════════════════════════════════════════════════════════════════════
def page4(p):
    p.bg(BG)
    p.c.setFillColor(GREEN)
    p.c.rect(0, 0, 4*mm, H, fill=1, stroke=0)

    # Header
    p.text(MARGIN + 6*mm, H - 22*mm,
           "COMPETITION ANALYSIS", font="JetBrains", size=9, color=GREEN)
    p.text(MARGIN + 6*mm, H - 34*mm,
           "Who is currently winning online — and by how much?",
           font="Helvetica-Bold", size=18, color=BLACK)
    p.line(MARGIN + 6*mm, H - 38*mm, W - MARGIN, H - 38*mm, color=BORDER)

    # 3 competitor cards
    card_w = (W - MARGIN*2 - 6*mm - 8*mm) / 3
    card_h = 60*mm
    card_y = H - 112*mm
    for i, comp in enumerate(COMPETITORS):
        cx = MARGIN + 6*mm + i * (card_w + 4*mm)
        # Card bg
        p.rect(cx, card_y, card_w, card_h, fill=CARD_BG, stroke_color=BORDER)
        # Rank badge
        rank_col = GREEN if i == 0 else colors.HexColor("#AAAAAA")
        p.c.setFillColor(rank_col)
        p.c.circle(cx + card_w - 8*mm, card_y + card_h - 8*mm, 5*mm, fill=1, stroke=0)
        p.text(cx + card_w - 8*mm, card_y + card_h - 10*mm,
               f"#{i+1}", font="JetBrains", size=7, color=WHITE, align="center")
        # Business name
        name = comp["name"]
        if len(name) > 18:
            name = name[:16] + ".."
        p.text(cx + 4*mm, card_y + card_h - 18*mm,
               name, font="Helvetica-Bold", size=10, color=BLACK)
        # Domain
        p.text(cx + 4*mm, card_y + card_h - 26*mm,
               comp["domain"], font="JetBrains", size=7, color=MUTED)
        # Divider
        p.line(cx + 4*mm, card_y + card_h - 29*mm,
               cx + card_w - 4*mm, card_y + card_h - 29*mm, color=BORDER)
        # Stats
        stats = [
            ("AUTHORITY", str(comp["authority"]) + " / 100"),
            ("MONTHLY TRAFFIC", f"{comp['traffic']:,}"),
        ]
        for j, (label, val) in enumerate(stats):
            sy = card_y + card_h - 38*mm - j * 12*mm
            p.text(cx + 4*mm, sy + 5*mm,
                   label, font="JetBrains", size=6, color=MUTED)
            p.text(cx + 4*mm, sy,
                   val, font="Helvetica-Bold", size=12, color=GREEN if j == 1 else BLACK)

    # Gap bar chart
    chart_y = H - 195*mm
    chart_h = 52*mm
    p.text(MARGIN + 6*mm, chart_y + chart_h + 6*mm,
           "TRAFFIC CAPTURED vs TOTAL MARKET", font="JetBrains", size=8, color=MUTED)
    total_captured = sum(c["traffic"] for c in COMPETITORS)
    uncaptured = TOTAL_VOL - int(TOTAL_VOL * DIRECTORY_PCT / 100) - total_captured
    chart_data = [c["traffic"] for c in COMPETITORS] + [uncaptured]
    chart_labels = [c["name"].split()[0] for c in COMPETITORS] + ["Uncaptured"]
    chart_colors = [GREEN, colors.HexColor("#15BA7F80"),
                    colors.HexColor("#15BA7F40"), colors.HexColor("#EEEEEE")]

    # Manual grouped bar
    bar_area_w = W - MARGIN*2 - 6*mm
    bar_w = bar_area_w / (len(chart_data) + 1)
    max_v = max(chart_data) * 1.3
    for i, (val, label) in enumerate(zip(chart_data, chart_labels)):
        bx = MARGIN + 6*mm + (i + 0.5) * bar_w
        bh = (val / max_v) * (chart_h - 15*mm)
        col = chart_colors[i] if i < len(chart_colors) else MUTED
        p.c.setFillColor(col)
        p.c.roundRect(bx, chart_y + 10*mm, bar_w * 0.7, bh, 2, fill=1, stroke=0)
        p.c.setFont("JetBrains", 6)
        p.c.setFillColor(BLACK)
        p.c.drawCentredString(bx + bar_w * 0.35, chart_y + 10*mm + bh + 2*mm, f"{val:,}")
        p.c.setFont("Helvetica", 6)
        p.c.setFillColor(MUTED)
        p.c.drawCentredString(bx + bar_w * 0.35, chart_y + 3*mm, label[:10])

    # Verdict
    verdict_y = chart_y - 22*mm
    total_captured_all = sum(c["traffic"] for c in COMPETITORS)
    missed = TOTAL_VOL - int(TOTAL_VOL * DIRECTORY_PCT / 100) - total_captured_all
    p.c.setFillColor(GREEN_LIGHT)
    p.c.roundRect(MARGIN + 6*mm, verdict_y, W - MARGIN*2 - 6*mm, 18*mm, 4, fill=1, stroke=0)
    p.c.setFillColor(GREEN)
    p.c.roundRect(MARGIN + 6*mm, verdict_y, 3*mm, 18*mm, 0, fill=1, stroke=0)
    p.text(MARGIN + 14*mm, verdict_y + 11*mm,
           f"Verdict: The top gym website in {CITY} gets {COMPETITORS[0]['traffic']:,} visits from {TOTAL_VOL:,} monthly searches.",
           font="Helvetica-Bold", size=9, color=BLACK)
    p.text(MARGIN + 14*mm, verdict_y + 4*mm,
           f"{missed:,} potential customers find no one. That gap is your opportunity.",
           font="Helvetica", size=9, color=MUTED)

    # Footer
    p.c.setFillColor(BLACK)
    p.c.rect(0, 0, W, 12*mm, fill=1, stroke=0)
    p.text(MARGIN + 6*mm, 4*mm, f"{CITY} — {NICHE} Market Report",
           font="JetBrains", size=7, color=MUTED)
    p.text(W/2, 4*mm, "04 / 05", font="JetBrains", size=7, color=MUTED, align="center")
    p.text(W - MARGIN, 4*mm, "fortunemarq.com",
           font="JetBrains", size=7, color=GREEN, align="right")
    p.new_page()


# ════════════════════════════════════════════════════════════════════════════════
# PAGE 5 — OUR SYSTEM + CTA
# ════════════════════════════════════════════════════════════════════════════════
def page5(p):
    p.bg(BG)
    p.c.setFillColor(GREEN)
    p.c.rect(0, 0, 4*mm, H, fill=1, stroke=0)

    # Header
    p.text(MARGIN + 6*mm, H - 22*mm,
           "THE FORTUNEMARQ SYSTEM", font="JetBrains", size=9, color=GREEN)
    p.text(MARGIN + 6*mm, H - 34*mm,
           "This is not an expense. It is a return.",
           font="Helvetica-Bold", size=20, color=BLACK)
    p.line(MARGIN + 6*mm, H - 38*mm, W - MARGIN, H - 38*mm, color=BORDER)

    # Investment framing
    p.c.setFillColor(GREEN_LIGHT)
    p.c.roundRect(MARGIN + 6*mm, H - 62*mm, W - MARGIN*2 - 6*mm, 20*mm, 4, fill=1, stroke=0)
    p.text(MARGIN + 12*mm, H - 48*mm,
           "Every rupee you invest in digital marketing should come back multiplied.",
           font="Helvetica-Bold", size=11, color=BLACK)
    p.text(MARGIN + 12*mm, H - 57*mm,
           "We build systems that bring customers to you consistently — not one-time campaigns.",
           font="Helvetica", size=10, color=MUTED)

    # 5-step system
    steps = [
        ("01", "Website",          "A fast, mobile-optimised website built for your niche. Designed to convert visitors into calls."),
        ("02", "Local SEO",        "Your business appears when customers search on Google. Rank above competitors organically."),
        ("03", "Google & Meta Ads","Paid campaigns that put you in front of customers actively looking for your service right now."),
        ("04", "GMB Optimisation", "Your Google Business Profile becomes a lead generation machine — calls, directions, reviews."),
        ("05", "Monthly Reports",  "Every month you see exactly what happened — traffic, leads, rankings. Full transparency."),
    ]
    step_y = H - 72*mm
    step_h = 22*mm
    for i, (num, title, desc) in enumerate(steps):
        sy = step_y - i * (step_h + 2*mm)
        # Step background
        bg_col = BLACK if i % 2 == 0 else CARD_BG
        txt_col = WHITE if i % 2 == 0 else BLACK
        desc_col = colors.HexColor("#AAAAAA") if i % 2 == 0 else MUTED
        p.rect(MARGIN + 6*mm, sy - step_h + 4*mm,
               W - MARGIN*2 - 6*mm, step_h, fill=bg_col)
        # Number
        p.c.setFillColor(GREEN)
        p.c.roundRect(MARGIN + 8*mm, sy - step_h + 7*mm, 10*mm, 10*mm, 2, fill=1, stroke=0)
        p.text(MARGIN + 13*mm, sy - step_h + 10*mm,
               num, font="JetBrains", size=7, color=WHITE, align="center")
        # Title
        p.text(MARGIN + 22*mm, sy - step_h + 14*mm,
               title, font="Helvetica-Bold", size=11, color=txt_col)
        # Description
        p.text(MARGIN + 22*mm, sy - step_h + 7*mm,
               desc[:70] + ".." if len(desc) > 70 else desc,
               font="Helvetica", size=8, color=desc_col)

    # CTA Block
    cta_y = 30*mm
    p.c.setFillColor(BLACK)
    p.c.roundRect(MARGIN + 6*mm, cta_y, W - MARGIN*2 - 6*mm, 26*mm, 4, fill=1, stroke=0)
    # WhatsApp button look
    p.c.setFillColor(GREEN)
    p.c.roundRect(MARGIN + 10*mm, cta_y + 14*mm, 45*mm, 9*mm, 3, fill=1, stroke=0)
    p.text(MARGIN + 32*mm, cta_y + 17*mm,
           "WhatsApp Us", font="JetBrains", size=8, color=WHITE, align="center")
    # Contact details
    p.text(MARGIN + 60*mm, cta_y + 20*mm,
           "+91 93530 82656", font="JetBrains", size=9, color=WHITE)
    p.text(MARGIN + 60*mm, cta_y + 13*mm,
           "fortunemarq@gmail.com", font="JetBrains", size=8, color=MUTED)
    p.text(MARGIN + 60*mm, cta_y + 6*mm,
           "Galaxy Mall, J.C Nagar, Hubli — 580020",
           font="Helvetica", size=8, color=MUTED)

    # Logo bottom left
    p.logo(MARGIN + 6*mm, 14*mm, size=10*mm, dark=False)

    # Footer
    p.c.setFillColor(GREEN)
    p.c.rect(0, 0, W, 12*mm, fill=1, stroke=0)
    p.text(W/2, 4*mm, "05 / 05  —  FortuneMarq Media & Marketing  —  fortunemarq.com",
           font="JetBrains", size=7, color=WHITE, align="center")


# ── GENERATE ──────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    out_path = os.path.join(OUT, "Hubli_Gyms_EN.pdf")
    p = PDFCanvas(out_path)
    page1(p)
    page2(p)
    page3(p)
    page4(p)
    page5(p)
    p.save()
    print(f"✓ PDF generated: {out_path}")
