from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

import translator as T

BRAND = '/Users/fortunemarq/Desktop/FortuneMarq_Build/Brand_Assets/'

GREEN = HexColor('#15BA7F')
DARK_GREEN = HexColor('#0D8A5C')
TEXT_DARK = HexColor('#1A1A1A')
TEXT_GREY = HexColor('#666666')
LIGHT_GREY = HexColor('#F5F5F5')
ACCENT_BG = HexColor('#E8F8F2')
WHITE = HexColor('#FFFFFF')
BLACK = HexColor('#000000')

W, H = A4   # 595 x 842
M = 40      # margin
INNER_W = W - 2 * M  # 515pt usable width

_FONTS_REGISTERED = False


def _register_fonts():
    global _FONTS_REGISTERED
    if _FONTS_REGISTERED:
        return
    pdfmetrics.registerFont(TTFont('Alliance1', BRAND + 'alliance1_fixed.ttf'))
    pdfmetrics.registerFont(TTFont('Alliance2', BRAND + 'alliance2_fixed.ttf'))
    pdfmetrics.registerFont(TTFont('JetBrains', BRAND + 'JetBrainsMono-Regular.ttf'))
    pdfmetrics.registerFont(TTFont('Kannada', T.KANNADA_FONT))
    _FONTS_REGISTERED = True


def _pad_list(lst, length, placeholder):
    result = list(lst)
    while len(result) < length:
        result.append(dict(placeholder))
    return result


# ─── Width / fit helpers ─────────────────────────────────────────────────────

def _sw(c, text, font, size):
    """String width shorthand."""
    return c.stringWidth(text, font, size)


def _autofit_size(c, text, font, max_size, max_width, min_size=6):
    """Return the largest font size <= max_size where text fits in max_width."""
    size = float(max_size)
    while size >= float(min_size):
        if _sw(c, text, font, size) <= max_width:
            return size
        size -= 0.5
    return float(min_size)


# ─── Mixed-font rendering helpers ────────────────────────────────────────────
# Each 'part' is a (text, font_name, size) tuple.
# Color must be set on canvas before calling these.

def _parts_total_width(c, parts):
    return sum(_sw(c, t, f, s) for t, f, s in parts)


def _draw_parts(c, x, y, parts):
    """Draw parts left-to-right from x. Returns final x."""
    cur_x = x
    for text, font, size in parts:
        c.setFont(font, size)
        c.drawString(cur_x, y, text)
        cur_x += _sw(c, text, font, size)
    return cur_x


def _draw_parts_right(c, right_x, y, parts):
    total = _parts_total_width(c, parts)
    return _draw_parts(c, right_x - total, y, parts)


def _draw_parts_centred(c, cx, y, parts):
    total = _parts_total_width(c, parts)
    return _draw_parts(c, cx - total / 2, y, parts)


# ─── Static Kannada strings ───────────────────────────────────────────────────

KN = T.STATIC_TRANSLATIONS

_EXTRA = {
    'SOURCE: Google Keyword Planner': 'ಮೂಲ: Google Keyword Planner',
    'The Search Demand prefix': 'ನ ಹುಡುಕಾಟ ಬೇಡಿಕೆ',           # city + this
    'Who Is Getting This Traffic Right Now': 'ಈ ಟ್ರಾಫಿಕ್ ಈಗ ಯಾರು ಪಡೆಯುತ್ತಿದ್ದಾರೆ',
    'GOOGLE BUSINESS PROFILE — TOP 3': 'Google ಬಿಸಿನೆಸ್ ಪ್ರೊಫೈಲ್ — ಟಾಪ್ 3',
    'None of them were yours': 'ಅವುಗಳಲ್ಲಿ ಯಾವುದೂ ನಿಮ್ಮದಲ್ಲ',
    'owns that customer': 'ಆ ಗ್ರಾಹಕ ಹೊಂದಿದೆ',
    'Your competitor — not you': 'ನಿಮ್ಮ ಪ್ರತಿಸ್ಪರ್ಧಿ — ನೀವಲ್ಲ',
    'fortunemarq@gmail.com  ·  fortunemarq.com': 'fortunemarq@gmail.com  ·  fortunemarq.com',
    'Galaxy Mall address': 'Galaxy Mall, First Floor, Shop No. 43, J.C Nagar, Hubli — 580020',
}


def _kn(key):
    return KN.get(key) or _EXTRA.get(key) or key


# ─── Footer ──────────────────────────────────────────────────────────────────

def _draw_footer_kn(c, page_num):
    c.setStrokeColor(GREEN)
    c.setLineWidth(0.5)
    c.line(M, 52, W - M, 52)

    logo = BRAND + 'Logo1_whitebackground.jpg'
    if os.path.exists(logo):
        c.drawImage(logo, M, 18, width=90, height=25,
                    preserveAspectRatio=True, mask='auto')

    c.setFont('Alliance1', 8)
    c.setFillColor(TEXT_DARK)
    c.drawCentredString(W / 2, 34, 'FortuneMarq')

    c.setFont('JetBrains', 8)
    c.setFillColor(GREEN)
    c.drawCentredString(W / 2, 22, '+91 93530 82656')

    # Page number — Kannada words + JetBrains digits, right-aligned
    page_parts = [
        ('ಪುಟ ', 'Kannada', 8),
        (str(page_num), 'JetBrains', 8),
        (' / ', 'Kannada', 8),
        ('5', 'JetBrains', 8),
    ]
    c.setFillColor(TEXT_GREY)
    _draw_parts_right(c, W - M, 22, page_parts)

    # Data source stamp
    c.setFont('Kannada', 6)
    c.setFillColor(TEXT_GREY)
    c.drawCentredString(W / 2, 10,
                        _kn('DATA SOURCE: Google Keyword Planner + Google Search Results'))


# ─── Page header ─────────────────────────────────────────────────────────────

def _draw_page_header_kn(c, title_kn, city_kn, niche_kn):
    c.setFillColor(GREEN)
    c.rect(0, H - 55, W, 55, fill=1, stroke=0)

    # Title — left side, autofit so it never touches the right text
    title_max_w = (W / 2) - M - 10   # ~217pt
    title_size = _autofit_size(c, title_kn, 'Kannada', 12, title_max_w, min_size=7)
    c.setFont('Kannada', title_size)
    c.setFillColor(WHITE)
    c.drawString(M, H - 36, title_kn)

    # Right side: city · niche · month — autofit
    right_text = f'{city_kn} · {niche_kn} · ಮಾರ್ಚ್ 2026'
    right_max_w = (W / 2) - M - 10
    right_size = _autofit_size(c, right_text, 'Kannada', 9, right_max_w, min_size=6)
    c.setFont('Kannada', right_size)
    c.setFillColor(WHITE)
    c.drawRightString(W - M, H - 36, right_text)


# ─── Cover page ───────────────────────────────────────────────────────────────
# cover_headline_lines: list where each element is either:
#   str  → rendered in Kannada font at cover_font_size
#   list of (text, font_name) pairs → rendered mixed at cover_font_size

def _draw_cover_kn(c, niche_data, cover_badge_kn, cover_headline_lines,
                   cover_subheadline_kn, cover_callout_line1_kn, cover_callout_line2_kn):
    niche = niche_data['niche']
    city = niche_data['city']
    volume = niche_data['volume']
    niche_kn = _kn(niche)
    city_kn = _kn(city)

    c.setFillColor(WHITE)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # Logo
    logo = BRAND + 'Logo1_whitebackground.jpg'
    if os.path.exists(logo):
        c.drawImage(logo, M, H - 70, width=140, height=40,
                    preserveAspectRatio=True, mask='auto')

    # Report badge — autofit text inside 150pt badge
    c.setFillColor(GREEN)
    c.roundRect(W - M - 160, H - 58, 160, 26, 5, fill=1, stroke=0)
    badge_size = _autofit_size(c, cover_badge_kn, 'Kannada', 8, 148, min_size=6)
    c.setFont('Kannada', badge_size)
    c.setFillColor(WHITE)
    c.drawCentredString(W - M - 80, H - 40, cover_badge_kn)

    # Thin separator line
    c.setStrokeColor(GREEN)
    c.setLineWidth(1)
    c.line(M, H - 80, W - M, H - 80)

    # City · Niche · MARCH — autofit
    banner_text = f'{city_kn}  ·  {niche_kn}  ·  ಮಾರ್ಚ್ 2026'
    banner_size = _autofit_size(c, banner_text, 'Kannada', 10, INNER_W, min_size=7)
    c.setFont('Kannada', banner_size)
    c.setFillColor(TEXT_GREY)
    c.drawString(M, H - 108, banner_text)

    # Hero box
    c.setFillColor(ACCENT_BG)
    c.roundRect(M, H - 330, INNER_W, 200, 8, fill=1, stroke=0)

    # Headline — 20pt font, 26pt line gap
    # This keeps all niche names on their own lines, never overflows
    hl_size = 20
    hl_gap = 26
    hl_start_y = H - 165
    hl_max_w = INNER_W - 30   # 485pt, starting at M+20=60

    for idx, line in enumerate(cover_headline_lines):
        y = hl_start_y - idx * hl_gap
        if isinstance(line, str):
            # Auto-shrink if this particular line is still too wide
            sz = _autofit_size(c, line, 'Kannada', hl_size, hl_max_w, min_size=10)
            c.setFont('Kannada', sz)
            c.setFillColor(TEXT_DARK)
            c.drawString(M + 20, y, line)
        else:
            # Mixed: list of (text, font_name) — measure total width first
            parts_with_size = [(t, f, hl_size) for t, f in line]
            total_w = _parts_total_width(c, parts_with_size)
            # If overflow, scale down all sizes proportionally
            if total_w > hl_max_w:
                scale = hl_max_w / total_w
                parts_with_size = [(t, f, max(10, hl_size * scale)) for t, f in line]
            c.setFillColor(TEXT_DARK)
            _draw_parts(c, M + 20, y, parts_with_size)

    # Subheadline — just below headline block
    n_lines = len(cover_headline_lines)
    sub_y = hl_start_y - n_lines * hl_gap + 2
    sub_max_w = INNER_W - 30
    sub_sz = _autofit_size(c, cover_subheadline_kn, 'Kannada', 10, sub_max_w, min_size=7)
    c.setFont('Kannada', sub_sz)
    c.setFillColor(TEXT_GREY)
    c.drawString(M + 20, sub_y, cover_subheadline_kn)

    # Big volume number — JetBrains, always
    c.setFont('JetBrains', 80)
    c.setFillColor(GREEN)
    c.drawCentredString(W / 2, H - 420, f'{volume:,}')

    # Number label
    num_label = f'ಮಾಸಿಕ ಹುಡುಕಾಟಗಳು {niche_kn} ಗಾಗಿ {city_kn} ನಲ್ಲಿ'
    num_sz = _autofit_size(c, num_label, 'Kannada', 11, INNER_W, min_size=7)
    c.setFont('Kannada', num_sz)
    c.setFillColor(TEXT_GREY)
    c.drawCentredString(W / 2, H - 445, num_label)

    # Source tag
    c.setFont('Kannada', 8)
    c.setFillColor(TEXT_GREY)
    c.drawCentredString(W / 2, H - 462, _kn('SOURCE: Google Keyword Planner'))

    # Decorative bar
    c.setFillColor(GREEN)
    c.rect(W / 2 - 30, H - 474, 60, 3, fill=1, stroke=0)

    # Bottom callout box
    c.setFillColor(LIGHT_GREY)
    c.roundRect(M, 130, INNER_W, 60, 6, fill=1, stroke=0)

    c1_sz = _autofit_size(c, cover_callout_line1_kn, 'Kannada', 10, INNER_W - 20, min_size=7)
    c.setFont('Kannada', c1_sz)
    c.setFillColor(TEXT_DARK)
    c.drawCentredString(W / 2, 172, cover_callout_line1_kn)

    c2_sz = _autofit_size(c, cover_callout_line2_kn, 'Kannada', 9, INNER_W - 20, min_size=7)
    c.setFont('Kannada', c2_sz)
    c.setFillColor(TEXT_GREY)
    c.drawCentredString(W / 2, 154, cover_callout_line2_kn)

    _draw_footer_kn(c, 1)
    c.showPage()


# ─── Page 2 ───────────────────────────────────────────────────────────────────

def _draw_page2_kn(c, niche_data, p2_callout_line1_kn, p2_callout_line2_kn):
    niche = niche_data['niche']
    city = niche_data['city']
    volume = niche_data['volume']
    traffic = niche_data['traffic']
    niche_kn = _kn(niche)
    city_kn = _kn(city)

    c.setFillColor(WHITE)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    title_kn = f'{city_kn} {_kn("The Search Demand prefix")}'
    _draw_page_header_kn(c, title_kn, city_kn, niche_kn)

    # ── Intro — SPLIT INTO 2 LINES to prevent overflow ──
    # Line 1: "Every month {volume} people in {city}"
    intro1_parts = [
        ('ಪ್ರತಿ ತಿಂಗಳು ', 'Kannada', 10),
        (f'{volume:,}', 'JetBrains', 10),
        (f' ಜನರು {city_kn} ನಲ್ಲಿ', 'Kannada', 10),
    ]
    c.setFillColor(TEXT_DARK)
    _draw_parts(c, M, H - 87, intro1_parts)

    # Line 2: "{niche} ಗಾಗಿ Google ನಲ್ಲಿ ಹುಡುಕುತ್ತಾರೆ."
    line2_text = f'{niche_kn} ಗಾಗಿ Google ನಲ್ಲಿ ಹುಡುಕುತ್ತಾರೆ.'
    l2_sz = _autofit_size(c, line2_text, 'Kannada', 10, INNER_W, min_size=7)
    c.setFont('Kannada', l2_sz)
    c.setFillColor(TEXT_DARK)
    c.drawString(M, H - 100, line2_text)

    # Verified data note
    verified = 'Google Keyword Planner ನಿಂದ ಪರಿಶೀಲಿತ ಮಾಹಿತಿ.'
    v_sz = _autofit_size(c, verified, 'Kannada', 8, INNER_W, min_size=6)
    c.setFont('Kannada', v_sz)
    c.setFillColor(TEXT_GREY)
    c.drawString(M, H - 113, verified)

    # Section label
    section_label = _kn('WHERE THIS TRAFFIC GOES') if 'WHERE THIS TRAFFIC GOES' in _EXTRA else 'ಈ ಟ್ರಾಫಿಕ್ ಎಲ್ಲಿ ಹೋಗುತ್ತದೆ'
    c.setFont('Kannada', 10)
    c.setFillColor(TEXT_DARK)
    c.drawString(M, H - 140, section_label)
    c.setStrokeColor(GREEN)
    c.setLineWidth(1.5)
    c.line(M, H - 144, M + 210, H - 144)

    # Traffic bars
    bar_start_y = H - 162
    bar_row_h = 58
    bar_max_w = 260
    label_col_w = 175
    pct_col_x = M + label_col_w + bar_max_w + 10

    bar_colors = [GREEN, HexColor('#2ECC8A'), HexColor('#7FDDBB'), HexColor('#B8F0DA')]

    traffic_items = [
        (_kn('GMB Profiles'),
         traffic['GMB Profiles'][0], traffic['GMB Profiles'][1]),
        (_kn('Directories') + ' (JustDial)',
         traffic['Directories'][0], traffic['Directories'][1]),
        (_kn('Social Media'),
         traffic['Social Media'][0], traffic['Social Media'][1]),
        (_kn('Local Websites'),
         traffic['Local Websites'][0], traffic['Local Websites'][1]),
    ]

    for i, (label, pct, count) in enumerate(traffic_items):
        row_y = bar_start_y - (i * bar_row_h)
        if i % 2 == 0:
            c.setFillColor(LIGHT_GREY)
            c.roundRect(M, row_y - 42, INNER_W, 50, 4, fill=1, stroke=0)

        # Label — autofit within label column
        lbl_sz = _autofit_size(c, label, 'Kannada', 9, label_col_w - 10, min_size=7)
        c.setFont('Kannada', lbl_sz)
        c.setFillColor(TEXT_DARK)
        c.drawString(M + 8, row_y - 14, label)

        # Count: JetBrains number + Kannada suffix
        c.setFillColor(TEXT_GREY)
        count_parts = [
            (f'{count:,} ', 'JetBrains', 8),
            ('ಹುಡುಕಾಟ/ತಿಂಗಳು', 'Kannada', 8),
        ]
        _draw_parts(c, M + 8, row_y - 28, count_parts)

        bar_w = int((pct / 100) * bar_max_w)
        c.setFillColor(bar_colors[i])
        c.roundRect(M + label_col_w, row_y - 28, bar_w, 18, 3, fill=1, stroke=0)

        # Percentage — always JetBrains
        c.setFont('JetBrains', 18)
        c.setFillColor(bar_colors[i] if i > 0 else GREEN)
        c.drawString(pct_col_x, row_y - 16, f'{pct}%')

    # Callout box
    callout_y = bar_start_y - (4 * bar_row_h) - 20
    c.setFillColor(ACCENT_BG)
    c.setStrokeColor(GREEN)
    c.setLineWidth(1.5)
    c.roundRect(M, callout_y - 50, INNER_W, 62, 6, fill=1, stroke=1)

    c1_sz = _autofit_size(c, p2_callout_line1_kn, 'Kannada', 10, INNER_W - 20, min_size=7)
    c.setFont('Kannada', c1_sz)
    c.setFillColor(TEXT_DARK)
    c.drawCentredString(W / 2, callout_y - 18, p2_callout_line1_kn)

    c2_sz = _autofit_size(c, p2_callout_line2_kn, 'Kannada', 9, INNER_W - 20, min_size=7)
    c.setFont('Kannada', c2_sz)
    c.setFillColor(TEXT_GREY)
    c.drawCentredString(W / 2, callout_y - 36, p2_callout_line2_kn)

    _draw_footer_kn(c, 2)
    c.showPage()


# ─── Page 3 ───────────────────────────────────────────────────────────────────

def _draw_page3_kn(c, niche_data):
    niche = niche_data['niche']
    city = niche_data['city']
    traffic = niche_data['traffic']
    niche_kn = _kn(niche)
    city_kn = _kn(city)

    gbp_list = _pad_list(niche_data['top_gbp'], 3,
                         {'name': '—', 'rating': '—', 'reviews': '—'})
    dir_list = _pad_list(niche_data['top_directories'], 3,
                         {'name': '—', 'description': 'No data'})
    web_list = _pad_list(niche_data['top_websites'], 3,
                         {'domain': '—', 'description': 'No data'})

    gmb_count = traffic['GMB Profiles'][1]
    dir_count = traffic['Directories'][1]
    web_count = traffic['Local Websites'][1]

    c.setFillColor(WHITE)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    _draw_page_header_kn(c, _kn('Who Is Getting This Traffic Right Now'), city_kn, niche_kn)

    # GBP section heading
    gbp_heading = _kn('GOOGLE BUSINESS PROFILE — TOP 3')
    gh_sz = _autofit_size(c, gbp_heading, 'Kannada', 10, INNER_W, min_size=7)
    c.setFont('Kannada', gh_sz)
    c.setFillColor(TEXT_DARK)
    c.drawString(M, H - 88, gbp_heading)
    c.setStrokeColor(GREEN)
    c.setLineWidth(1.5)
    c.line(M, H - 92, M + 290, H - 92)

    # Sub-label with count — single line, autofit
    sub_label_parts = [
        ('Google Maps ಮೂಲಕ ಅಂದಾಜು ', 'Kannada', 8),
        (f'{gmb_count:,}', 'JetBrains', 8),
        (' ಹುಡುಕಾಟ ಪ್ರತಿ ತಿಂಗಳು', 'Kannada', 8),
    ]
    c.setFillColor(TEXT_GREY)
    _draw_parts(c, M, H - 104, sub_label_parts)

    # 3 GBP cards
    card_w = 155
    card_h = 115
    card_gap = 10
    card_start_x = M
    card_y = H - 228

    for i, gbp in enumerate(gbp_list):
        cx = card_start_x + i * (card_w + card_gap)
        pos = ['01', '02', '03'][i]
        name = gbp.get('name', '—')       # keep English
        rating = gbp.get('rating', '—')
        reviews = gbp.get('reviews', '—')

        c.setFillColor(WHITE)
        c.setStrokeColor(HexColor('#E0E0E0'))
        c.setLineWidth(0.5)
        c.roundRect(cx, card_y, card_w, card_h, 6, fill=1, stroke=1)
        c.setFillColor(GREEN)
        c.roundRect(cx, card_y + card_h - 22, card_w, 22, 6, fill=1, stroke=0)
        c.rect(cx, card_y + card_h - 28, card_w, 12, fill=1, stroke=0)

        c.setFont('JetBrains', 13)
        c.setFillColor(WHITE)
        c.drawCentredString(cx + card_w / 2, card_y + card_h - 16, pos)

        # Business name — English, Alliance1
        c.setFont('Alliance1', 9)
        c.setFillColor(TEXT_DARK)
        if len(name) > 18:
            c.drawCentredString(cx + card_w / 2, card_y + 78, name[:18])
            c.drawCentredString(cx + card_w / 2, card_y + 66, name[18:36])
        else:
            c.drawCentredString(cx + card_w / 2, card_y + 72, name)

        # Rating — JetBrains
        c.setFont('JetBrains', 20)
        c.setFillColor(GREEN)
        c.drawCentredString(cx + card_w / 2, card_y + 44, str(rating))

        # Stars
        try:
            rating_val = float(rating)
            full = int(rating_val)
            stars = '★' * full + '☆' * (5 - full)
        except (ValueError, TypeError):
            stars = '—'
        c.setFont('Alliance2', 10)
        c.setFillColor(HexColor('#F4B942'))
        c.drawCentredString(cx + card_w / 2, card_y + 30, stars)

        # Reviews — JetBrains number + Kannada label
        rev_parts = [
            ('(', 'Kannada', 7),
            (str(reviews), 'JetBrains', 7),
            (' ವಿಮರ್ಶೆ)', 'Kannada', 7),
        ]
        c.setFillColor(TEXT_GREY)
        rev_w = _parts_total_width(c, rev_parts)
        _draw_parts(c, cx + card_w / 2 - rev_w / 2, card_y + 14, rev_parts)

    # Directories section
    dir_y = card_y - 28
    c.setFillColor(TEXT_DARK)
    dir_parts = [
        ('ಡೈರೆಕ್ಟರಿಗಳು — ', 'Kannada', 9),
        (f'{dir_count:,}', 'JetBrains', 9),
        (' ಹುಡುಕಾಟ', 'Kannada', 9),
    ]
    _draw_parts(c, M, dir_y, dir_parts)
    c.setStrokeColor(GREEN)
    c.setLineWidth(1.5)
    c.line(M, dir_y - 4, M + 240, dir_y - 4)

    row_h = 32
    for i, d in enumerate(dir_list):
        ry = dir_y - 22 - (i * row_h)
        c.setFillColor(LIGHT_GREY if i % 2 == 0 else WHITE)
        c.roundRect(M, ry - 10, INNER_W, row_h - 2, 3, fill=1, stroke=0)
        c.setFont('Alliance1', 10)
        c.setFillColor(TEXT_DARK)
        c.drawString(M + 10, ry + 8, d.get('name', '—'))
        c.setFont('Alliance2', 9)
        c.setFillColor(TEXT_GREY)
        c.drawString(M + 120, ry + 8, d.get('description', ''))

    # Websites section
    web_y = dir_y - 22 - (3 * row_h) - 18
    c.setFillColor(TEXT_DARK)
    web_parts = [
        ('ಸ್ಥಳೀಯ ವೆಬ್‌ಸೈಟ್‌ಗಳು — ', 'Kannada', 9),
        (f'{web_count:,}', 'JetBrains', 9),
        (' ಹುಡುಕಾಟ', 'Kannada', 9),
    ]
    _draw_parts(c, M, web_y, web_parts)
    c.setStrokeColor(GREEN)
    c.setLineWidth(1.5)
    c.line(M, web_y - 4, M + 260, web_y - 4)

    for i, w in enumerate(web_list):
        ry = web_y - 22 - (i * row_h)
        c.setFillColor(LIGHT_GREY if i % 2 == 0 else WHITE)
        c.roundRect(M, ry - 10, INNER_W, row_h - 2, 3, fill=1, stroke=0)
        c.setFont('JetBrains', 9)
        c.setFillColor(GREEN)
        c.drawString(M + 10, ry + 8, w.get('domain', '—'))
        c.setFont('Alliance2', 9)
        c.setFillColor(TEXT_GREY)
        c.drawString(M + 160, ry + 8, w.get('description', ''))

    _draw_footer_kn(c, 3)
    c.showPage()


# ─── Page 4 ───────────────────────────────────────────────────────────────────
# p4_insight_line1/2: str → Kannada-only, or list of (text,font,size) tuples → mixed

def _draw_page4_kn(c, niche_data, p4_headline_kn, p4_box_labels_kn,
                   p4_insight_line1, p4_insight_line2, p4_sub_kn):
    niche = niche_data['niche']
    city = niche_data['city']
    traffic = niche_data['traffic']
    niche_kn = _kn(niche)
    city_kn = _kn(city)

    gmb_count = traffic['GMB Profiles'][1]
    dir_count = traffic['Directories'][1]
    web_count = traffic['Local Websites'][1]

    c.setFillColor(WHITE)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    _draw_page_header_kn(c, p4_headline_kn, city_kn, niche_kn)

    # 3 boxes
    box_w = 155
    box_h = 140
    box_gap = 10
    box_y = H - 270

    box_nums = [f'{gmb_count:,}', f'{dir_count:,}', f'{web_count:,}']
    box_styles = [
        (GREEN, WHITE, WHITE),
        (DARK_GREEN, WHITE, WHITE),
        (ACCENT_BG, TEXT_DARK, TEXT_DARK),
    ]
    box_subs_kn = [
        _kn('None of them were yours'),
        'JustDial ' + _kn('owns that customer'),
        _kn('Your competitor — not you'),
    ]

    for i in range(3):
        bg, num_col, text_col = box_styles[i]
        bx = M + i * (box_w + box_gap)
        c.setFillColor(bg)
        c.setStrokeColor(GREEN)
        c.setLineWidth(0.5)
        c.roundRect(bx, box_y, box_w, box_h, 8, fill=1, stroke=1)

        # Big number
        c.setFont('JetBrains', 28)
        c.setFillColor(num_col if bg != ACCENT_BG else GREEN)
        c.drawCentredString(bx + box_w / 2, box_y + box_h - 42, box_nums[i])

        # Box label lines
        c.setFont('Kannada', 7)
        c.setFillColor(text_col)
        label_lines = p4_box_labels_kn[i].split('\n')
        for j, line in enumerate(label_lines):
            lbl_sz = _autofit_size(c, line, 'Kannada', 7, box_w - 10, min_size=5)
            c.setFont('Kannada', lbl_sz)
            c.drawCentredString(bx + box_w / 2, box_y + box_h - 62 - (j * 14), line)

        # Sub text
        sub_sz = _autofit_size(c, box_subs_kn[i], 'Kannada', 7, box_w - 8, min_size=5)
        c.setFont('Kannada', sub_sz)
        c.setFillColor(HexColor('#AAAAAA') if bg != ACCENT_BG else TEXT_GREY)
        c.drawCentredString(bx + box_w / 2, box_y + 16, box_subs_kn[i])

    # Insight box
    ins_y = box_y - 30
    c.setFillColor(LIGHT_GREY)
    c.roundRect(M, ins_y - 65, INNER_W, 78, 6, fill=1, stroke=0)

    # Insight line 1
    c.setFillColor(TEXT_DARK)
    if isinstance(p4_insight_line1, str):
        sz = _autofit_size(c, p4_insight_line1, 'Kannada', 10, INNER_W - 20, min_size=7)
        c.setFont('Kannada', sz)
        c.drawCentredString(W / 2, ins_y - 18, p4_insight_line1)
    else:
        _draw_parts_centred(c, W / 2, ins_y - 18, p4_insight_line1)

    # Insight line 2
    if isinstance(p4_insight_line2, str):
        sz = _autofit_size(c, p4_insight_line2, 'Kannada', 10, INNER_W - 20, min_size=7)
        c.setFont('Kannada', sz)
        c.drawCentredString(W / 2, ins_y - 34, p4_insight_line2)
    else:
        _draw_parts_centred(c, W / 2, ins_y - 34, p4_insight_line2)

    # Sub
    sub_sz = _autofit_size(c, p4_sub_kn, 'Kannada', 8, INNER_W - 20, min_size=6)
    c.setFont('Kannada', sub_sz)
    c.setFillColor(TEXT_GREY)
    c.drawCentredString(W / 2, ins_y - 52, p4_sub_kn)

    # Growth Partner section
    need_y = ins_y - 95
    gp_heading = _kn('YOUR GROWTH PARTNER — NOT JUST AN AGENCY')
    gp_sz = _autofit_size(c, gp_heading, 'Kannada', 9, INNER_W, min_size=7)
    c.setFont('Kannada', gp_sz)
    c.setFillColor(TEXT_DARK)
    c.drawString(M, need_y, gp_heading)
    c.setStrokeColor(GREEN)
    c.setLineWidth(1.5)
    c.line(M, need_y - 4, M + 310, need_y - 4)

    # Description — line 1: FortuneMarq + shortened Kannada (fits in INNER_W)
    c.setFillColor(TEXT_GREY)
    desc1_parts = [
        ('FortuneMarq', 'Alliance2', 9),
        (' ನಿಮ್ಮ ಸಂಪೂರ್ಣ ಆನ್‌ಲೈನ್ ಉಪಸ್ಥಿತಿ ನಿರ್ಮಿಸಿ ನಿರ್ವಹಿಸುತ್ತದೆ.', 'Kannada', 9),
    ]
    _draw_parts(c, M, need_y - 20, desc1_parts)

    # Description — line 2
    desc2_parts = [
        ('ನೀವು ವ್ಯವಹಾರ ನಡೆಸಿ — ಗ್ರಾಹಕರು ', 'Kannada', 9),
        ('Google', 'Alliance2', 9),
        (' ನಲ್ಲಿ ನಿಮ್ಮನ್ನು ಕಂಡುಹಿಡಿಯಲಿ.', 'Kannada', 9),
    ]
    _draw_parts(c, M, need_y - 34, desc2_parts)

    # 6 Service tabs
    services_kn = [
        (HexColor('#15BA7F'), HexColor('#0D8A5C'), 'GMB',
         'ಗೂಗಲ್ ಬಿಸಿನೆಸ್\nಪ್ರೊಫೈಲ್',   'Google Maps\nನಲ್ಲಿ ಕಂಡುಬನ್ನಿ'),
        (HexColor('#3B82F6'), HexColor('#1D4ED8'), 'WEB',
         'ಬಿಸಿನೆಸ್\nವೆಬ್‌ಸೈಟ್',           'ಸಂದರ್ಶಕರನ್ನು\nಕರೆಗಳಾಗಿ ಮಾಡಿ'),
        (HexColor('#8B5CF6'), HexColor('#6D28D9'), 'SEO',
         'ಲೋಕಲ್ SEO',                        'Google ನಲ್ಲಿ\nಮೇಲೇರಿ'),
        (HexColor('#F59E0B'), HexColor('#B45309'), 'ADS',
         'Google\nಜಾಹೀರಾತು',               'Google ಟಾಪ್‌ನಲ್ಲಿ\nತಕ್ಷಣ'),
        (HexColor('#EF4444'), HexColor('#B91C1C'), 'META',
         'Meta\nಜಾಹೀರಾತು',                  'Instagram &\nFacebook'),
        (HexColor('#06B6D4'), HexColor('#0E7490'), 'RPT',
         'ಮಾಸಿಕ\nವರದಿಗಳು',                 'ಸ್ಪಷ್ಟ ROI\nಪ್ರತಿ ತಿಂಗಳು'),
    ]

    tab_cols = 3
    tab_w = (INNER_W - (tab_cols - 1) * 8) / tab_cols   # ≈ 163pt
    tab_h = 72
    tab_gap_x = 8
    tab_gap_y = 8
    tab_start_y = need_y - 52

    for i, (bg_col, dark_col, icon_text, title, desc) in enumerate(services_kn):
        col = i % tab_cols
        row = i // tab_cols
        tx = M + col * (tab_w + tab_gap_x)
        ty = tab_start_y - row * (tab_h + tab_gap_y) - tab_h

        c.setFillColor(bg_col)
        c.roundRect(tx, ty, tab_w, tab_h, 7, fill=1, stroke=0)
        c.setFillColor(dark_col)
        c.roundRect(tx, ty + tab_h - 4, tab_w, 4, 2, fill=1, stroke=0)

        # Icon
        icon_cx = tx + 22
        icon_cy = ty + tab_h - 22
        c.setFillColor(WHITE)
        c.circle(icon_cx, icon_cy, 12, fill=1, stroke=0)
        c.setFont('JetBrains', 7)
        c.setFillColor(bg_col)
        c.drawCentredString(icon_cx, icon_cy - 3, icon_text)

        # Service title — Kannada font, autofit per line
        c.setFillColor(WHITE)
        title_lines = title.split('\n')
        for j, line in enumerate(title_lines):
            sz = _autofit_size(c, line, 'Kannada', 8, tab_w - 44, min_size=5)
            c.setFont('Kannada', sz)
            c.drawString(tx + 40, ty + tab_h - 16 - (j * 12), line)

        # Description — Kannada font
        c.setFillColor(WHITE)
        desc_lines = desc.split('\n')
        for j, line in enumerate(desc_lines):
            sz = _autofit_size(c, line, 'Kannada', 7, tab_w - 14, min_size=5)
            c.setFont('Kannada', sz)
            c.drawString(tx + 8, ty + 22 - (j * 12), line)

    _draw_footer_kn(c, 4)
    c.showPage()


# ─── Page 5 ───────────────────────────────────────────────────────────────────

def _draw_page5_kn(c):
    # Top half green
    c.setFillColor(GREEN)
    c.rect(0, H / 2, W, H / 2, fill=1, stroke=0)

    logo_green = BRAND + 'Logo3_greenbackground.jpg'
    logo_white = BRAND + 'Logo1_whitebackground.jpg'
    if os.path.exists(logo_green):
        c.drawImage(logo_green, W / 2 - 100, H - 130, width=200, height=55,
                    preserveAspectRatio=True, mask='auto')
    elif os.path.exists(logo_white):
        c.drawImage(logo_white, W / 2 - 100, H - 130, width=200, height=55,
                    preserveAspectRatio=True, mask='auto')

    # Headline — two separate lines, each autofit
    hl1 = _kn("Let's Talk About")
    hl2 = _kn('Your Growth')
    hl1_sz = _autofit_size(c, hl1, 'Kannada', 24, INNER_W, min_size=14)
    hl2_sz = _autofit_size(c, hl2, 'Kannada', 24, INNER_W, min_size=14)

    c.setFillColor(WHITE)
    c.setFont('Kannada', hl1_sz)
    c.drawCentredString(W / 2, H - 185, hl1)
    c.setFont('Kannada', hl2_sz)
    c.drawCentredString(W / 2, H - 215, hl2)

    # Consultation text
    con1 = 'ಅವಕಾಶ, ವ್ಯಾಪ್ತಿ ಮತ್ತು ನಿಮ್ಮ ವ್ಯವಹಾರ'
    con2 = 'ಬೆಳೆಸುವ ಬಗ್ಗೆ ಉಚಿತ ಸಮಾಲೋಚನೆ ಬುಕ್ ಮಾಡಿ.'
    c1_sz = _autofit_size(c, con1, 'Kannada', 11, INNER_W, min_size=8)
    c2_sz = _autofit_size(c, con2, 'Kannada', 11, INNER_W, min_size=8)
    c.setFont('Kannada', c1_sz)
    c.setFillColor(WHITE)
    c.drawCentredString(W / 2, H - 245, con1)
    c.setFont('Kannada', c2_sz)
    c.drawCentredString(W / 2, H - 262, con2)

    c.setStrokeColor(WHITE)
    c.setLineWidth(0.5)
    c.line(M + 80, H / 2 + 10, W - M - 80, H / 2 + 10)

    # Bottom half white
    c.setFillColor(WHITE)
    c.rect(0, 0, W, H / 2, fill=1, stroke=0)

    btn_w = 300
    btn_h = 52
    btn_x = W / 2 - btn_w / 2
    btn_y = H / 2 - 70

    c.setFillColor(WHITE)
    c.setStrokeColor(GREEN)
    c.setLineWidth(2)
    c.roundRect(btn_x, btn_y, btn_w, btn_h, 8, fill=1, stroke=1)

    btn_text = _kn('Book Your Free Consultation')
    btn_sz = _autofit_size(c, btn_text, 'Kannada', 13, btn_w - 20, min_size=9)
    c.setFont('Kannada', btn_sz)
    c.setFillColor(GREEN)
    c.drawCentredString(W / 2, btn_y + 18, btn_text)

    # Phone — JetBrains
    c.setFont('JetBrains', 14)
    c.setFillColor(TEXT_DARK)
    c.drawCentredString(W / 2, btn_y - 40, '+91 93530 82656')

    # Email / domain — English
    c.setFont('Alliance2', 11)
    c.setFillColor(TEXT_GREY)
    c.drawCentredString(W / 2, btn_y - 60, 'fortunemarq@gmail.com  ·  fortunemarq.com')

    # Address — keep fully English per spec
    c.setFont('Alliance2', 9)
    c.setFillColor(TEXT_GREY)
    c.drawCentredString(W / 2, btn_y - 80,
                        'Galaxy Mall, First Floor, Shop No. 43, J.C Nagar, Hubli — 580020')

    # Tagline
    tagline = _kn('Marketing That Pays You Back')
    tg_sz = _autofit_size(c, tagline, 'Kannada', 10, INNER_W, min_size=7)
    c.setFont('Kannada', tg_sz)
    c.setFillColor(GREEN)
    c.drawCentredString(W / 2, btn_y - 105, tagline)

    # Bottom attribution
    bottom_parts = [
        ('FortuneMarq Media & Marketing  ·  ', 'Alliance2', 6),
        (_kn('DATA SOURCE: Google Keyword Planner + Google Search Results'), 'Kannada', 6),
    ]
    c.setFillColor(TEXT_GREY)
    _draw_parts_centred(c, W / 2, 15, bottom_parts)

    c.showPage()


# ─── PDFGeneratorKN ───────────────────────────────────────────────────────────

class PDFGeneratorKN:

    def generate_type1(self, niche_data, output_path):
        """TYPE 1 — SERP Ranked (Kannada)"""
        _register_fonts()
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        c = canvas.Canvas(output_path, pagesize=A4)

        _draw_cover_kn(
            c, niche_data,
            cover_badge_kn=_kn('VISIBILITY REPORT'),
            cover_headline_lines=[
                'ನೀವು ಈಗಾಗಲೇ ಇದ್ದೀರಿ',
                'Google Page 1 ರಲ್ಲಿ',
            ],
            cover_subheadline_kn='ಆ ದೃಶ್ಯಮಾನತೆ ಏನು ಯೋಗ್ಯ — ಮತ್ತು ಇನ್ನೇನು ಸೆರೆಹಿಡಿಯಬಹುದು',
            cover_callout_line1_kn='ನೀವು ಗೋಚರಿಸುತ್ತಿದ್ದೀರಿ. ಅವಕಾಶ ಗರಿಷ್ಠಗೊಳಿಸಿ',
            cover_callout_line2_kn='ನಿಮ್ಮನ್ನು ಕಂಡುಕೊಳ್ಳುವ ಪ್ರತಿ ಹುಡುಕಾಟ.',
        )
        _draw_page2_kn(
            c, niche_data,
            p2_callout_line1_kn='ನೀವು ಈ ಟ್ರಾಫಿಕ್‌ನ ಒಂದು ಭಾಗ ಸೆರೆಹಿಡಿಯುತ್ತಿದ್ದೀರಿ.',
            p2_callout_line2_kn='ನೀವು ಇನ್ನೆಷ್ಟು ಸೆರೆಹಿಡಿಯಬಹುದು?',
        )
        _draw_page3_kn(c, niche_data)
        _draw_page4_kn(
            c, niche_data,
            p4_headline_kn='ನೀವು ಇನ್ನೂ ಸೆರೆಹಿಡಿಯಬಹುದಾದ ಟ್ರಾಫಿಕ್',
            p4_box_labels_kn=[
                'GMB ಪ್ರೊಫೈಲ್ ನೋಡುತ್ತಾರೆ —\nನಿಮ್ಮದು ಮೊದಲು?',
                'ಡೈರೆಕ್ಟರಿಗಳಿಗೆ ಹೋಗುತ್ತವೆ —\nನೀವು ಪಟ್ಟಿಯಾಗಿದ್ದೀರಾ?',
                'ಸ್ಥಳೀಯ ವೆಬ್‌ಸೈಟ್ ಭೇಟಿ ಮಾಡುತ್ತಾರೆ —\nನಿಮ್ಮದು ಪರಿವರ್ತಿಸುತ್ತಿದೆಯೇ?',
            ],
            p4_insight_line1='Page 1 ರಲ್ಲಿರುವುದು ಮೊದಲ ಹೆಜ್ಜೆ.',
            p4_insight_line2='ಪ್ರತಿ ಭೇಟಿ ಪರಿವರ್ತಿಸುವುದು ಮುಂದಿನ ಹೆಜ್ಜೆ.',
            p4_sub_kn='ಪ್ರತಿ ಚಾನಲ್ ಬಲಪಡಿಸಿ ಪ್ರತಿ ಹುಡುಕಾಟ ಗರಿಷ್ಠಗೊಳಿಸಿ.',
        )
        _draw_page5_kn(c)
        c.save()

    def generate_type2(self, niche_data, output_path):
        """TYPE 2 — No website, not on SERP (Kannada)"""
        _register_fonts()
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        c = canvas.Canvas(output_path, pagesize=A4)
        niche = niche_data['niche']
        city = niche_data['city']
        volume = niche_data['volume']
        niche_kn = _kn(niche)
        city_kn = _kn(city)

        # Cover HL: 3 lines — volume line / niche alone / city + last month
        _draw_cover_kn(
            c, niche_data,
            cover_badge_kn=_kn('MARKET OPPORTUNITY REPORT'),
            cover_headline_lines=[
                [(f'{volume:,}', 'JetBrains'), (' ಜನರು ಹುಡುಕಿದ್ದಾರೆ', 'Kannada')],
                niche_kn,
                f'{city_kn} ನಲ್ಲಿ ಕಳೆದ ತಿಂಗಳು',
            ],
            cover_subheadline_kn='ಆ ಟ್ರಾಫಿಕ್ ಇದೀಗ ಎಲ್ಲಿ ಹೋಗುತ್ತಿದೆ',
            cover_callout_line1_kn='ಸಂಭಾವ್ಯ ಗ್ರಾಹಕರು ಎಲ್ಲಿ ಹೋಗುತ್ತಿದ್ದಾರೆ ಎಂದು ಈ ವರದಿ ತೋರಿಸುತ್ತದೆ',
            cover_callout_line2_kn='ಅವರು ನಿಮ್ಮನ್ನು ಕಂಡುಕೊಳ್ಳಲು ಏನು ಬೇಕು',
        )
        _draw_page2_kn(
            c, niche_data,
            p2_callout_line1_kn='ಈ ಟ್ರಾಫಿಕ್ 100% ಇತರ ವ್ಯವಹಾರಗಳಿಗೆ ಹೋಗುತ್ತಿದೆ',
            p2_callout_line2_kn='ಉತ್ತರಿಸದ ಪ್ರತಿ ಹುಡುಕಾಟ ನಿಮ್ಮ ಪ್ರತಿಸ್ಪರ್ಧಿ ಬಳಿ ಹೋಗುವ ಗ್ರಾಹಕ',
        )
        _draw_page3_kn(c, niche_data)
        _draw_page4_kn(
            c, niche_data,
            p4_headline_kn='ಸಿಗದ ಇರುವುದರ ವೆಚ್ಚ',
            p4_box_labels_kn=[
                'ಈ ತಿಂಗಳು GMB ಪ್ರೊಫೈಲ್\nಕ್ಲಿಕ್ ಮಾಡಿದ್ದಾರೆ',
                'JustDial ಮತ್ತು\nಡೈರೆಕ್ಟರಿಗಳಿಗೆ ಹೋದವು',
                f'ಸ್ಥಳೀಯ {niche_kn}\nವೆಬ್‌ಸೈಟ್ ಭೇಟಿ ಮಾಡಿದ್ದಾರೆ',
            ],
            p4_insight_line1='ಡಿಜಿಟಲ್ ಉಪಸ್ಥಿತಿಯಿಲ್ಲದೆ ಪ್ರತಿ ಹುಡುಕಾಟ',
            p4_insight_line2=[
                (f'{volume:,}', 'JetBrains', 10),
                (' ಮಾಸಿಕ ಹುಡುಕಾಟ ಇನ್ನೊಬ್ಬರ ಬಾಗಿಲಲ್ಲಿ ಕೊನೆಗೊಳ್ಳುತ್ತದೆ.', 'Kannada', 10),
            ],
            p4_sub_kn='ಸಂಪೂರ್ಣ ಡಿಜಿಟಲ್ ಉಪಸ್ಥಿತಿ ಎಂದರೆ ಹುಡುಕಾಟ ಇಳಿಯುವಲ್ಲಿ ಕಾಣಿಸಿಕೊಳ್ಳುವುದು.',
        )
        _draw_page5_kn(c)
        c.save()

    def generate_type3(self, niche_data, output_path):
        """TYPE 3 — Has website, not on SERP (Kannada)"""
        _register_fonts()
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        c = canvas.Canvas(output_path, pagesize=A4)
        niche = niche_data['niche']
        city = niche_data['city']
        volume = niche_data['volume']
        niche_kn = _kn(niche)
        city_kn = _kn(city)

        _draw_cover_kn(
            c, niche_data,
            cover_badge_kn=_kn('WEBSITE PERFORMANCE REPORT'),
            cover_headline_lines=[
                [(f'{volume:,}', 'JetBrains'), (' ಜನರು ಹುಡುಕಿದ್ದಾರೆ', 'Kannada')],
                niche_kn,
                f'{city_kn} ನಲ್ಲಿ ಕಳೆದ ತಿಂಗಳು',
            ],
            cover_subheadline_kn='ನಿಮ್ಮ ವೆಬ್‌ಸೈಟ್ ಇದೆ — ಆದರೆ ಈ ಫಲಿತಾಂಶಗಳಲ್ಲಿ ಇರಲಿಲ್ಲ',
            cover_callout_line1_kn='ವೆಬ್‌ಸೈಟ್ ಹೊಂದುವುದು ಮತ್ತು Google ನಲ್ಲಿ ಸಿಗುವುದು',
            cover_callout_line2_kn='ಎರಡು ಬೇರೆ ಬೇರೆ ವಿಷಯಗಳು',
        )
        _draw_page2_kn(
            c, niche_data,
            p2_callout_line1_kn='ನಿಮ್ಮ ಬಳಿ ವೆಬ್‌ಸೈಟ್ ಇದೆ. ಆದರೆ Google ತೋರಿಸುತ್ತಿಲ್ಲ',
            p2_callout_line2_kn='ಜನರು ನಿಮ್ಮ ಸೇವೆಗಳಿಗಾಗಿ ಹುಡುಕಿದಾಗ.',
        )
        _draw_page3_kn(c, niche_data)
        _draw_page4_kn(
            c, niche_data,
            p4_headline_kn='ನಿಮ್ಮ ವೆಬ್‌ಸೈಟ್ ಮತ್ತು Google ನಡುವಿನ ಅಂತರ',
            p4_box_labels_kn=[
                'Google Maps ಹುಡುಕಿದ್ದಾರೆ —\nGMB ಅನುಕೂಲನ ಬೇಕು',
                'ಡೈರೆಕ್ಟರಿಗಳಿಗೆ ಹೋದವು —\nನೀವು ಪಟ್ಟಿಯಾಗಿದ್ದೀರಾ?',
                'ಸ್ಥಳೀಯ ವೆಬ್‌ಸೈಟ್ ಭೇಟಿ ಮಾಡಿದ್ದಾರೆ —\nನಿಮ್ಮದು ಇರಲಿಲ್ಲ',
            ],
            p4_insight_line1='ನಿಮ್ಮ ವೆಬ್‌ಸೈಟ್ ನಿರ್ಮಿತವಾಗಿದೆ. Google ಅದನ್ನು',
            p4_insight_line2=[
                ('ಪ್ರತಿ ತಿಂಗಳು ', 'Kannada', 10),
                (f'{volume:,}', 'JetBrains', 10),
                (' ಜನರಿಗೆ ತೋರಿಸುವಂತೆ ಮಾಡಬೇಕು.', 'Kannada', 10),
            ],
            p4_sub_kn='SEO ಮತ್ತು GMB ನಿಮ್ಮ ಸೈಟ್ ಮತ್ತು ಗ್ರಾಹಕರ ಅಂತರ ಮುಚ್ಚುತ್ತದೆ.',
        )
        _draw_page5_kn(c)
        c.save()

    def generate_type4(self, niche_data, output_path):
        """TYPE 4 — Low volume (Kannada)"""
        _register_fonts()
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        c = canvas.Canvas(output_path, pagesize=A4)
        niche = niche_data['niche']
        city = niche_data['city']
        volume = niche_data['volume']
        niche_kn = _kn(niche)
        city_kn = _kn(city)

        _draw_cover_kn(
            c, niche_data,
            cover_badge_kn=_kn('NICHE MARKET REPORT'),
            cover_headline_lines=[
                [('ಕೇವಲ ', 'Kannada'), (f'{volume:,}', 'JetBrains'), (' ಜನರು', 'Kannada')],
                niche_kn,
                f'{city_kn} ನಲ್ಲಿ ಪ್ರತಿ ತಿಂಗಳು',
            ],
            cover_subheadline_kn='ಅವರೆಲ್ಲರೂ ಖರೀದಿಸಲು ಸಿದ್ಧ — ಎಲ್ಲರನ್ನೂ ಸೆರೆಹಿಡಿಯುವುದು ಹೀಗೆ',
            cover_callout_line1_kn='ಸಣ್ಣ ಮಾರ್ಕೆಟ್. ಹೆಚ್ಚಿನ ಉದ್ದೇಶ. ಕಡಿಮೆ ಸ್ಪರ್ಧೆ.',
            cover_callout_line2_kn='ಪ್ರತಿ ಹುಡುಕಾಟ ಮುಖ್ಯ.',
        )
        _draw_page2_kn(
            c, niche_data,
            p2_callout_line1_kn='ಕೇಂದ್ರೀಕೃತ ಮಾರ್ಕೆಟ್‌ನಲ್ಲಿ ಪ್ರತಿ ಹುಡುಕಾಟ ಸಂಭಾವ್ಯ ಗ್ರಾಹಕ',
            p2_callout_line2_kn='ನಿರ್ದಿಷ್ಟ ಅಗತ್ಯದೊಂದಿಗೆ — ಗೆಲ್ಲಲು ಕಡಿಮೆ ಸ್ಪರ್ಧೆ.',
        )
        _draw_page3_kn(c, niche_data)
        _draw_page4_kn(
            c, niche_data,
            p4_headline_kn='ಸಣ್ಣ ಮಾರ್ಕೆಟ್ ಅನುಕೂಲ',
            p4_box_labels_kn=[
                'GMB ಕ್ಲಿಕ್ ತಿಂಗಳಿಗೆ —\nಪ್ರೊಫೈಲ್ ಎಲ್ಲ ಸೆರೆಹಿಡಿಯುತ್ತದೆ',
                'ಡೈರೆಕ್ಟರಿ ಹುಡುಕಾಟ —\nಕಡಿಮೆ ಸ್ಪರ್ಧೆ',
                'ವೆಬ್‌ಸೈಟ್ ಸಂದರ್ಶಕರು —\nಖರೀದಿಸಲು ಸಿದ್ಧ',
            ],
            p4_insight_line1='ಕಡಿಮೆ ಪ್ರಮಾಣ ಕಡಿಮೆ ಸ್ಪರ್ಧೆ ಎಂದರ್ಥ.',
            p4_insight_line2='ರ್ಯಾಂಕ್ ಮಾಡಲು ಮಟ್ಟ ಕಡಿಮೆ — ಈಗಲೇ ಹಿಡಿಯಿರಿ.',
            p4_sub_kn='ನಿಶ್ ಮಾರ್ಕೆಟ್‌ನಲ್ಲಿ ಒಂದು ಬಲವಾದ ಉಪಸ್ಥಿತಿ ಎಲ್ಲ ಫಲಿತಾಂಶ ಆಳಬಲ್ಲದು.',
        )
        _draw_page5_kn(c)
        c.save()
