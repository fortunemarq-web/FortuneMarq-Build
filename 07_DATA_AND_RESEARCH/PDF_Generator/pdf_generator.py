from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os
import math

# --- PATHS ---
BRAND = os.environ.get('FM_BRAND_DIR', '/Users/fortunemarq/FortuneMarq-Build/Brand_Assets/')

# --- LANGUAGE / KANNADA SHAPING ---
import report_copy as RC
from kn_shape import ShapingCanvas, wrap as kn_wrap
KN_REG = os.environ.get('FM_KN_REGULAR',
    '/Users/fortunemarq/FortuneMarq-Build/01_CRM_AND_TOOL/fmos/public/fonts/NotoSansKannada-Regular.ttf')
KN_BOLD = os.environ.get('FM_KN_BOLD',
    '/Users/fortunemarq/FortuneMarq-Build/01_CRM_AND_TOOL/fmos/public/fonts/NotoSansKannada-Bold.ttf')
_LANG = 'en'
_S = RC.SHARED['en']
_G = RC.GROWTH['en']


def _set_lang(lang):
    global _LANG, _S, _G
    _LANG = lang
    _S = RC.SHARED.get(lang, RC.SHARED['en'])
    _G = RC.GROWTH.get(lang, RC.GROWTH['en'])


def _ctx(nd):
    return {'city': nd['city'], 'niche': nd['niche'],
            'niche_l': nd['niche'].lower(), 'volume': f"{nd['volume']:,}"}

# --- COLORS ---
GREEN = HexColor('#15BA7F')
DARK_GREEN = HexColor('#0D8A5C')
TEXT_DARK = HexColor('#1A1A1A')
TEXT_GREY = HexColor('#666666')
LIGHT_GREY = HexColor('#F5F5F5')
ACCENT_BG = HexColor('#E8F8F2')
WHITE = HexColor('#FFFFFF')
BLACK = HexColor('#000000')

# --- PAGE SETUP ---
W, H = A4  # 595 x 842
M = 40     # margin

_FONTS_REGISTERED = False


def _register_fonts():
    global _FONTS_REGISTERED
    if _FONTS_REGISTERED:
        return
    pdfmetrics.registerFont(TTFont('Alliance1', BRAND + 'alliance1_fixed.ttf'))
    pdfmetrics.registerFont(TTFont('Alliance2', BRAND + 'alliance2_fixed.ttf'))
    pdfmetrics.registerFont(TTFont('JetBrains', BRAND + 'JetBrainsMono-Regular.ttf'))
    _FONTS_REGISTERED = True


def _pad_list(lst, length, placeholder):
    result = list(lst)
    while len(result) < length:
        result.append(dict(placeholder))
    return result


def _truncate(text, font, size, max_w):
    """Trim text (with ellipsis) so it fits within max_w points."""
    text = str(text)
    if pdfmetrics.stringWidth(text, font, size) <= max_w:
        return text
    ell = '…'
    while text and pdfmetrics.stringWidth(text + ell, font, size) > max_w:
        text = text[:-1]
    return (text + ell) if text else ''


def _wrap2(text, font, size, max_w):
    """Wrap text onto at most 2 lines on word boundaries, each fitting max_w."""
    words = str(text).split()
    lines, cur = [], ''
    for w in words:
        trial = (cur + ' ' + w).strip()
        if pdfmetrics.stringWidth(trial, font, size) <= max_w or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = w
            if len(lines) == 2:
                break
    if cur and len(lines) < 2:
        lines.append(cur)
    return [_truncate(l, font, size, max_w) for l in lines[:2]]


def _star_points(cx, cy, R):
    pts, r = [], R * 0.382
    for i in range(5):
        ao = math.radians(-90 + i * 72)
        ai = math.radians(-90 + i * 72 + 36)
        pts.append((cx + R * math.cos(ao), cy - R * math.sin(ao)))
        pts.append((cx + r * math.cos(ai), cy - r * math.sin(ai)))
    return pts


def _draw_stars(c, center_x, cy, rating, n=5):
    """Draw 5 vector stars (font-independent — Alliance has no ★ glyph)."""
    try:
        full = int(float(rating))
    except (ValueError, TypeError):
        full = 0
    R, gap = 5.0, 13.0
    sx = center_x - (n * gap - 3) / 2 + R
    for i in range(n):
        pts = _star_points(sx + i * gap, cy, R)
        p = c.beginPath()
        p.moveTo(*pts[0])
        for x, y in pts[1:]:
            p.lineTo(x, y)
        p.close()
        c.setFillColor(HexColor('#F4B942') if i < full else HexColor('#E0E0E0'))
        c.drawPath(p, fill=1, stroke=0)


def _draw_footer(c, page_num):
    c.setStrokeColor(GREEN)
    c.setLineWidth(0.5)
    c.line(M, 52, W - M, 52)
    logo = BRAND + 'Logo1_whitebackground.jpg'
    if os.path.exists(logo):
        c.drawImage(logo, M, 18, width=90, height=25, preserveAspectRatio=True, mask='auto')
    c.setFont('Alliance1', 8)
    c.setFillColor(TEXT_DARK)
    c.drawCentredString(W / 2, 34, 'FortuneMarq')
    c.setFont('JetBrains', 8)
    c.setFillColor(GREEN)
    c.drawCentredString(W / 2, 22, '+91 93530 82656')
    c.setFont('Alliance2', 8)
    c.setFillColor(TEXT_GREY)
    c.drawRightString(W - M, 22, f'Page {page_num} of 5')
    c.setFont('Alliance2', 7)
    c.drawCentredString(W / 2, 10, 'DATA SOURCE: Google Keyword Planner + Google Search Results')


def _draw_page_header(c, title, city, niche):
    c.setFillColor(GREEN)
    c.rect(0, H - 55, W, 55, fill=1, stroke=0)
    c.setFont('Alliance1', 15)
    c.setFillColor(WHITE)
    c.drawString(M, H - 36, title)
    c.setFont('Alliance2', 9)
    c.drawRightString(W - M, H - 36, f'{city} · {niche} · March 2026')


def _draw_cover(c, niche_data, cover_badge, cover_headline_lines, cover_subheadline,
                cover_callout_line1, cover_callout_line2):
    niche = niche_data['niche']
    city = niche_data['city']
    volume = niche_data['volume']

    c.setFillColor(WHITE)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # Logo top left
    logo = BRAND + 'Logo1_whitebackground.jpg'
    if os.path.exists(logo):
        c.drawImage(logo, M, H - 70, width=140, height=40, preserveAspectRatio=True, mask='auto')

    # Report type badge top right
    c.setFillColor(GREEN)
    c.roundRect(W - M - 160, H - 58, 160, 26, 5, fill=1, stroke=0)
    c.setFont('Alliance2', 9)
    c.setFillColor(WHITE)
    c.drawCentredString(W - M - 80, H - 40, cover_badge)

    # Thin green line
    c.setStrokeColor(GREEN)
    c.setLineWidth(1)
    c.line(M, H - 80, W - M, H - 80)

    # City + Niche label
    c.setFont('Alliance2', 10)
    c.setFillColor(TEXT_GREY)
    c.drawString(M, H - 108, f'{city.upper()}  ·  {niche.upper()}  ·  MARCH 2026')

    # Hero background box
    c.setFillColor(ACCENT_BG)
    c.roundRect(M, H - 330, W - (M * 2), 200, 8, fill=1, stroke=0)

    # Main headline lines
    font_size = 30
    line_gap = 38
    start_y = H - 170
    c.setFont('Alliance1', font_size)
    c.setFillColor(TEXT_DARK)
    for idx, line in enumerate(cover_headline_lines):
        c.drawString(M + 20, start_y - idx * line_gap, line)

    # Subheadline
    c.setFont('Alliance2', 12)
    c.setFillColor(TEXT_GREY)
    # Position below the headline block
    sub_y = start_y - len(cover_headline_lines) * line_gap + 2
    c.drawString(M + 20, sub_y, cover_subheadline)

    # Big number section
    c.setFont('JetBrains', 80)
    c.setFillColor(GREEN)
    c.drawCentredString(W / 2, H - 420, f'{volume:,}')

    # Number label
    c.setFont('Alliance2', 12)
    c.setFillColor(TEXT_GREY)
    c.drawCentredString(W / 2, H - 445, RC.fmt(_S['hero_label'], **_ctx(niche_data)))

    # Source tag
    c.setFont('Alliance2', 9)
    c.setFillColor(TEXT_GREY)
    c.drawCentredString(W / 2, H - 465, _S['source_tag'])

    # Decorative green bar
    c.setFillColor(GREEN)
    c.rect(W / 2 - 30, H - 478, 60, 3, fill=1, stroke=0)

    # Bottom callout
    c.setFillColor(LIGHT_GREY)
    c.roundRect(M, 130, W - (M * 2), 60, 6, fill=1, stroke=0)
    c.setFont('Alliance1', 11)
    c.setFillColor(TEXT_DARK)
    c.drawCentredString(W / 2, 172, cover_callout_line1)
    c.setFont('Alliance2', 10)
    c.setFillColor(TEXT_GREY)
    c.drawCentredString(W / 2, 154, cover_callout_line2)

    _draw_footer(c, 1)
    c.showPage()


def _draw_page2(c, niche_data, p2_callout_line1, p2_callout_line2):
    niche = niche_data['niche']
    city = niche_data['city']
    volume = niche_data['volume']
    traffic = niche_data['traffic']

    c.setFillColor(WHITE)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    _draw_page_header(c, RC.fmt(_S['page2_header'], **_ctx(niche_data)), city, niche)

    # Intro text
    c.setFont('Alliance1', 13)
    c.setFillColor(TEXT_DARK)
    c.drawString(M, H - 90, RC.fmt(_S['page2_intro'], **_ctx(niche_data)))
    c.setFont('Alliance2', 10)
    c.setFillColor(TEXT_GREY)
    c.drawString(M, H - 108, _S['page2_verified'])

    # Section label
    c.setFont('Alliance1', 11)
    c.setFillColor(TEXT_DARK)
    c.drawString(M, H - 140, _S['where_traffic_goes'])
    c.setStrokeColor(GREEN)
    c.setLineWidth(1.5)
    c.line(M, H - 144, M + 180, H - 144)

    # Traffic bars
    bar_start_y = H - 165
    bar_row_h = 58
    bar_max_w = 260
    label_col_w = 175
    pct_col_x = M + label_col_w + bar_max_w + 10

    bar_colors = [GREEN, HexColor('#2ECC8A'), HexColor('#7FDDBB'), HexColor('#B8F0DA')]

    traffic_items = [
        (_S['bar_gmb'], traffic['GMB Profiles'][0], traffic['GMB Profiles'][1]),
        (_S['bar_directories'], traffic['Directories'][0], traffic['Directories'][1]),
        (_S['bar_social'], traffic['Social Media'][0], traffic['Social Media'][1]),
        (_S['bar_websites'], traffic['Local Websites'][0], traffic['Local Websites'][1]),
    ]

    for i, (label, pct, count) in enumerate(traffic_items):
        row_y = bar_start_y - (i * bar_row_h)
        if i % 2 == 0:
            c.setFillColor(LIGHT_GREY)
            c.roundRect(M, row_y - 42, W - (M * 2), 50, 4, fill=1, stroke=0)
        c.setFont('Alliance2', 10)
        c.setFillColor(TEXT_DARK)
        c.drawString(M + 8, row_y - 14, label)
        c.setFont('Alliance2', 8)
        c.setFillColor(TEXT_GREY)
        c.drawString(M + 8, row_y - 28, RC.fmt(_S['searches_per_month'], count=f'{count:,}'))
        bar_w = int((pct / 100) * bar_max_w)
        c.setFillColor(bar_colors[i])
        c.roundRect(M + label_col_w, row_y - 28, bar_w, 18, 3, fill=1, stroke=0)
        c.setFont('JetBrains', 18)
        c.setFillColor(bar_colors[i] if i > 0 else GREEN)
        c.drawString(pct_col_x, row_y - 16, f'{pct}%')

    # Callout box
    callout_y = bar_start_y - (4 * bar_row_h) - 20
    c.setFillColor(ACCENT_BG)
    c.setStrokeColor(GREEN)
    c.setLineWidth(1.5)
    c.roundRect(M, callout_y - 50, W - (M * 2), 62, 6, fill=1, stroke=1)
    c.setFont('Alliance1', 12)
    c.setFillColor(TEXT_DARK)
    c.drawCentredString(W / 2, callout_y - 18, p2_callout_line1)
    c.setFont('Alliance2', 10)
    c.setFillColor(TEXT_GREY)
    c.drawCentredString(W / 2, callout_y - 36, p2_callout_line2)

    _draw_footer(c, 2)
    c.showPage()


def _draw_page3(c, niche_data):
    niche = niche_data['niche']
    city = niche_data['city']
    volume = niche_data['volume']
    traffic = niche_data['traffic']

    gbp_list = _pad_list(niche_data['top_gbp'], 3, {'name': '—', 'rating': '—', 'reviews': '—'})
    dir_list = _pad_list(niche_data['top_directories'], 3, {'name': '—', 'description': 'No data available'})
    web_list = _pad_list(niche_data['top_websites'], 3, {'domain': '—', 'description': 'No data available'})

    gmb_count = traffic['GMB Profiles'][1]
    dir_count = traffic['Directories'][1]
    web_count = traffic['Local Websites'][1]

    c.setFillColor(WHITE)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    _draw_page_header(c, _S['page3_header'], city, niche)

    # GBP Section label
    c.setFont('Alliance1', 11)
    c.setFillColor(TEXT_DARK)
    c.drawString(M, H - 88, _S['gbp_top3_label'])
    c.setStrokeColor(GREEN)
    c.setLineWidth(1.5)
    c.line(M, H - 92, M + 290, H - 92)
    c.setFont('Alliance2', 9)
    c.setFillColor(TEXT_GREY)
    c.drawString(M, H - 106, RC.fmt(_S['gbp_capture_line'], count=f'{gmb_count:,}'))

    # 3 GBP Cards
    card_w = 155
    card_h = 115
    card_gap = 10
    card_start_x = M
    card_y = H - 230

    positions = ['01', '02', '03']
    for i, gbp in enumerate(gbp_list):
        cx = card_start_x + i * (card_w + card_gap)
        pos = positions[i]
        name = gbp.get('name', '—')
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
        c.setFont('Alliance1', 9)
        c.setFillColor(TEXT_DARK)
        name_lines = _wrap2(name, 'Alliance1', 9, card_w - 16)
        if len(name_lines) <= 1:
            c.drawCentredString(cx + card_w / 2, card_y + 72, name_lines[0] if name_lines else '—')
        else:
            c.drawCentredString(cx + card_w / 2, card_y + 78, name_lines[0])
            c.drawCentredString(cx + card_w / 2, card_y + 66, name_lines[1])

        # Rating — handle non-numeric gracefully
        c.setFont('JetBrains', 20)
        c.setFillColor(GREEN)
        c.drawCentredString(cx + card_w / 2, card_y + 44, str(rating))

        # Stars (vector — font has no ★ glyph)
        _draw_stars(c, cx + card_w / 2, card_y + 32, rating)

        c.setFont('Alliance2', 8)
        c.setFillColor(TEXT_GREY)
        c.drawCentredString(cx + card_w / 2, card_y + 14, RC.fmt(_S['reviews_suffix'], reviews=reviews))

    # Directories section
    dir_y = card_y - 30
    c.setFont('Alliance1', 11)
    c.setFillColor(TEXT_DARK)
    c.drawString(M, dir_y, RC.fmt(_S['directories_capture'], count=f'{dir_count:,}'))
    c.setStrokeColor(GREEN)
    c.setLineWidth(1.5)
    c.line(M, dir_y - 4, M + 270, dir_y - 4)

    row_h = 32
    for i, d in enumerate(dir_list):
        ry = dir_y - 24 - (i * row_h)
        c.setFillColor(LIGHT_GREY if i % 2 == 0 else WHITE)
        c.roundRect(M, ry - 10, W - (M * 2), row_h - 2, 3, fill=1, stroke=0)
        c.setFont('Alliance1', 10)
        c.setFillColor(TEXT_DARK)
        c.drawString(M + 10, ry + 8, _truncate(d.get('name', '—'), 'Alliance1', 10, 300))
        c.setFont('Alliance2', 9)
        c.setFillColor(TEXT_GREY)
        c.drawString(M + 330, ry + 8, d.get('description') or RC.fmt(_S['dir_item'], niche=niche))

    # Websites section
    web_y = dir_y - 24 - (3 * row_h) - 20
    c.setFont('Alliance1', 11)
    c.setFillColor(TEXT_DARK)
    c.drawString(M, web_y, RC.fmt(_S['websites_capture'], count=f'{web_count:,}'))
    c.setStrokeColor(GREEN)
    c.setLineWidth(1.5)
    c.line(M, web_y - 4, M + 290, web_y - 4)

    for i, w in enumerate(web_list):
        ry = web_y - 24 - (i * row_h)
        c.setFillColor(LIGHT_GREY if i % 2 == 0 else WHITE)
        c.roundRect(M, ry - 10, W - (M * 2), row_h - 2, 3, fill=1, stroke=0)
        c.setFont('JetBrains', 9)
        c.setFillColor(GREEN)
        c.drawString(M + 10, ry + 8, w.get('domain', '—'))
        c.setFont('Alliance2', 9)
        c.setFillColor(TEXT_GREY)
        c.drawString(M + 160, ry + 8, w.get('description') or RC.fmt(_S['web_item'], niche=niche))

    _draw_footer(c, 3)
    c.showPage()


def _draw_page4(c, niche_data, p4_headline, p4_box_labels, p4_insight_line1,
                p4_insight_line2, p4_sub):
    niche = niche_data['niche']
    city = niche_data['city']
    volume = niche_data['volume']
    traffic = niche_data['traffic']

    gmb_count = traffic['GMB Profiles'][1]
    dir_count = traffic['Directories'][1]
    web_count = traffic['Local Websites'][1]

    c.setFillColor(WHITE)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    _draw_page_header(c, p4_headline, city, niche)

    # 3 calculation boxes
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
    box_subs = _G['card_subs']

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
        # Label lines (KN wraps to width; EN keeps its manual \n breaks)
        lbl_size = 8 if _LANG == 'kn' else 9
        c.setFont('Alliance2', lbl_size)
        c.setFillColor(text_col)
        if _LANG == 'kn':
            label_lines = kn_wrap(p4_box_labels[i], KN_REG, lbl_size, box_w - 18)
        else:
            label_lines = p4_box_labels[i].split('\n')
        for j, line in enumerate(label_lines):
            c.drawCentredString(bx + box_w / 2, box_y + box_h - 62 - (j * 12), line)
        # Sub text
        c.setFont('Alliance1', 8)
        c.setFillColor(HexColor('#AAAAAA') if bg != ACCENT_BG else TEXT_GREY)
        c.drawCentredString(bx + box_w / 2, box_y + 16, box_subs[i])

    # Insight box
    ins_y = box_y - 30
    c.setFillColor(LIGHT_GREY)
    c.roundRect(M, ins_y - 65, W - (M * 2), 78, 6, fill=1, stroke=0)
    c.setFont('Alliance1', 12)
    c.setFillColor(TEXT_DARK)
    c.drawCentredString(W / 2, ins_y - 18, p4_insight_line1)
    c.drawCentredString(W / 2, ins_y - 34, p4_insight_line2)
    c.setFont('Alliance2', 10)
    c.setFillColor(TEXT_GREY)
    c.drawCentredString(W / 2, ins_y - 52, p4_sub)

    # Growth Partner Section
    need_y = ins_y - 95
    c.setFont('Alliance1', 11)
    c.setFillColor(TEXT_DARK)
    c.drawString(M, need_y, _G['section'])
    c.setStrokeColor(GREEN)
    c.setLineWidth(1.5)
    c.line(M, need_y - 4, M + 295, need_y - 4)

    c.setFont('Alliance2', 10)
    c.setFillColor(TEXT_GREY)
    for bi, bline in enumerate(_G['blurb']):
        c.drawString(M, need_y - 20 - bi * 14, bline)

    # 6 service tabs — 3 columns x 2 rows (colours here, copy from _G)
    service_colors = [
        (HexColor('#15BA7F'), HexColor('#0D8A5C')),
        (HexColor('#3B82F6'), HexColor('#1D4ED8')),
        (HexColor('#8B5CF6'), HexColor('#6D28D9')),
        (HexColor('#F59E0B'), HexColor('#B45309')),
        (HexColor('#EF4444'), HexColor('#B91C1C')),
        (HexColor('#06B6D4'), HexColor('#0E7490')),
    ]
    services = [(c0, c1, ic, ti, de) for (c0, c1), (ic, ti, de)
                in zip(service_colors, _G['services'])]

    tab_cols = 3
    tab_w = (W - (M * 2) - (tab_cols - 1) * 8) / tab_cols
    tab_h = 72
    tab_gap_x = 8
    tab_gap_y = 8
    tab_start_y = need_y - 52

    for i, (bg_col, dark_col, icon_text, title, desc) in enumerate(services):
        col = i % tab_cols
        row = i // tab_cols
        tx = M + col * (tab_w + tab_gap_x)
        ty = tab_start_y - row * (tab_h + tab_gap_y) - tab_h

        c.setFillColor(bg_col)
        c.roundRect(tx, ty, tab_w, tab_h, 7, fill=1, stroke=0)

        # Dark accent strip at top
        c.setFillColor(dark_col)
        c.roundRect(tx, ty + tab_h - 4, tab_w, 4, 2, fill=1, stroke=0)

        # Icon circle (white bg)
        icon_cx = tx + 22
        icon_cy = ty + tab_h - 22
        c.setFillColor(WHITE)
        c.circle(icon_cx, icon_cy, 12, fill=1, stroke=0)
        c.setFont('JetBrains', 7)
        c.setFillColor(bg_col)
        c.drawCentredString(icon_cx, icon_cy - 3, icon_text)

        # Service title
        c.setFont('Alliance1', 9)
        c.setFillColor(WHITE)
        title_lines = title.split('\n')
        for j, line in enumerate(title_lines):
            c.drawString(tx + 40, ty + tab_h - 16 - (j * 12), line)

        # Description
        c.setFont('Alliance2', 8)
        c.setFillColor(WHITE)
        desc_lines = desc.split('\n')
        for j, line in enumerate(desc_lines):
            c.drawString(tx + 10, ty + 22 - (j * 12), line)

    _draw_footer(c, 4)
    c.showPage()


def _draw_page5(c):
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

    c.setFont('Alliance1', 26)
    c.setFillColor(WHITE)
    for i, line in enumerate(_S['cta_headline']):
        c.drawCentredString(W / 2, H - 185 - i * 33, line)

    c.setFont('Alliance2', 12)
    c.setFillColor(WHITE)
    for i, line in enumerate(_S['cta_sub']):
        c.drawCentredString(W / 2, H - 250 - i * 17, line)

    c.setStrokeColor(WHITE)
    c.setLineWidth(0.5)
    c.line(M + 80, H / 2 + 10, W - M - 80, H / 2 + 10)

    # Bottom half white
    c.setFillColor(WHITE)
    c.rect(0, 0, W, H / 2, fill=1, stroke=0)

    btn_w = 320
    btn_h = 52
    btn_x = W / 2 - btn_w / 2
    btn_y = H / 2 - 70
    c.setFillColor(WHITE)
    c.setStrokeColor(GREEN)
    c.setLineWidth(2)
    c.roundRect(btn_x, btn_y, btn_w, btn_h, 8, fill=1, stroke=1)
    c.setFont('Alliance1', 15)
    c.setFillColor(GREEN)
    c.drawCentredString(W / 2, btn_y + 18, _S['cta_button'])

    c.setFont('JetBrains', 14)
    c.setFillColor(TEXT_DARK)
    c.drawCentredString(W / 2, btn_y - 40, '+91 93530 82656')

    c.setFont('Alliance2', 11)
    c.setFillColor(TEXT_GREY)
    c.drawCentredString(W / 2, btn_y - 60, 'fortunemarq@gmail.com  ·  fortunemarq.com')

    c.setFont('Alliance2', 9)
    c.setFillColor(TEXT_GREY)
    c.drawCentredString(W / 2, btn_y - 80, 'Galaxy Mall, First Floor, Shop No. 43, J.C Nagar, Hubli — 580020')

    c.setFont('Alliance1', 10)
    c.setFillColor(GREEN)
    c.drawCentredString(W / 2, btn_y - 105, _S['tagline'])

    c.setFont('Alliance2', 7)
    c.setFillColor(TEXT_GREY)
    c.drawCentredString(W / 2, 15, 'FortuneMarq Media & Marketing  ·  DATA SOURCE: Google Keyword Planner + Google Search Results')

    c.showPage()


class PDFGenerator:

    # report-type number -> copy letter (A Visibility, B Website Perf,
    # C Market Opportunity, D Niche). Matches the app's lead pitch_type.
    TYPE_LETTER = {1: 'A', 2: 'C', 3: 'B', 4: 'D'}

    def _render(self, niche_data, output_path, lang, num):
        _register_fonts()
        _set_lang(lang)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        raw = canvas.Canvas(output_path, pagesize=A4)
        c = ShapingCanvas(raw, KN_REG, KN_BOLD) if lang == 'kn' else raw
        ctx = _ctx(niche_data)
        T = RC.TYPES.get(lang, RC.TYPES['en'])[self.TYPE_LETTER[num]]

        def f(s):
            return RC.fmt(s, **ctx)

        _draw_cover(c, niche_data,
                    cover_badge=f(T['badge']),
                    cover_headline_lines=[f(x) for x in T['headline']],
                    cover_subheadline=f(T['subheadline']),
                    cover_callout_line1=f(T['cover_callout_1']),
                    cover_callout_line2=f(T['cover_callout_2']))
        _draw_page2(c, niche_data,
                    p2_callout_line1=f(T['page2_callout_1']),
                    p2_callout_line2=f(T['page2_callout_2']))
        _draw_page3(c, niche_data)
        _draw_page4(c, niche_data,
                    p4_headline=f(T['page4_headline']),
                    p4_box_labels=[f(x) for x in T['page4_box_labels']],
                    p4_insight_line1=f(T['page4_insight_1']),
                    p4_insight_line2=f(T['page4_insight_2']),
                    p4_sub=f(T['page4_sub']))
        _draw_page5(c)
        c.save()

    def generate_type1(self, niche_data, output_path, lang='en'):
        """TYPE 1 — Visibility (A)"""
        self._render(niche_data, output_path, lang, 1)

    def generate_type2(self, niche_data, output_path, lang='en'):
        """TYPE 2 — Market Opportunity / no website (C)"""
        self._render(niche_data, output_path, lang, 2)

    def generate_type3(self, niche_data, output_path, lang='en'):
        """TYPE 3 — Website Performance / has website (B)"""
        self._render(niche_data, output_path, lang, 3)

    def generate_type4(self, niche_data, output_path, lang='en'):
        """TYPE 4 — Niche Market / low volume (D)"""
        self._render(niche_data, output_path, lang, 4)
