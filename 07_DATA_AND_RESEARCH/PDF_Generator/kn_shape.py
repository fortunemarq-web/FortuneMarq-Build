#!/usr/bin/env python3
"""
Kannada (and any complex-script) text shaping for reportlab.

reportlab draws glyphs in codepoint order with no Indic shaping, so Kannada
conjuncts/vowel-signs render wrong. This module shapes text with HarfBuzz and
rasterises the positioned glyphs with FreeType into a transparent RGBA image,
which can then be placed into a reportlab canvas via drawImage — giving correct
Kannada while leaving the original (English) design untouched.
"""
import uharfbuzz as hb
import freetype
from PIL import Image

_KN = range(0x0C80, 0x0D00)


def has_kannada(s):
    return any(ord(ch) in _KN for ch in str(s))


_hb_cache, _ft_cache = {}, {}


def _hb(path):
    if path not in _hb_cache:
        face = hb.Face(hb.Blob.from_file_path(path))
        _hb_cache[path] = (face, hb.Font(face))
    return _hb_cache[path]


def _ft(path):
    if path not in _ft_cache:
        _ft_cache[path] = freetype.Face(path)
    return _ft_cache[path]


def _runs(text):
    """Split text into same-script runs (Kannada vs other) so each is shaped
    with the correct script. Whitespace/punctuation sticks to the current run."""
    out, cur, curcls = [], "", None

    def cls(ch):
        o = ord(ch)
        if 0x0C80 <= o <= 0x0CFF:
            return "kn"
        if ch.isspace() or not ch.isalnum():
            return None  # sticky — stays in current run
        return "other"

    for ch in text:
        cl = cls(ch)
        if cl is None:
            cl = curcls or "other"
        if curcls is None:
            cur, curcls = ch, cl
        elif cl == curcls:
            cur += ch
        else:
            out.append((cur, curcls))
            cur, curcls = ch, cl
    if cur:
        out.append((cur, curcls))
    return out


def shape_to_image(text, font_path, size_px, color=(0, 0, 0)):
    """Return (PIL.RGBA image of shaped text, baseline_px from top).
    Mixed Kannada/Latin is itemised into per-script runs to avoid overlap."""
    face_hb, font_hb = _hb(font_path)
    upem = face_hb.upem
    font_hb.scale = (upem, upem)
    scale = size_px / upem

    ft = _ft(font_path)
    ft.set_pixel_sizes(0, size_px)
    asc = ft.size.ascender / 64.0
    desc = -ft.size.descender / 64.0
    height = int(round(asc + desc)) + 6
    baseline = int(round(asc)) + 3

    shaped, total = [], 0.0
    for rtext, _cls in _runs(str(text)):
        buf = hb.Buffer()
        buf.add_str(rtext)
        buf.guess_segment_properties()
        hb.shape(font_hb, buf, {"kern": True, "liga": True})
        infos, poss = list(buf.glyph_infos), list(buf.glyph_positions)
        shaped.append((infos, poss))
        total += sum(p.x_advance for p in poss) * scale
    width = max(int(round(total)) + 6, 2)

    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    penx = 3.0
    for infos, poss in shaped:
        for info, pos in zip(infos, poss):
            ft.load_glyph(info.codepoint, freetype.FT_LOAD_RENDER)
            bmp = ft.glyph.bitmap
            w, h, pitch = bmp.width, bmp.rows, bmp.pitch
            if w > 0 and h > 0:
                data = bytes(bmp.buffer)
                if pitch != w:
                    data = b"".join(data[i * pitch:i * pitch + w] for i in range(h))
                mask = Image.frombytes("L", (w, h), data)
                solid = Image.new("RGBA", (w, h), (color[0], color[1], color[2], 0))
                solid.putalpha(mask)
                gx = int(round(penx + pos.x_offset * scale + ft.glyph.bitmap_left))
                gy = int(round(baseline - pos.y_offset * scale - ft.glyph.bitmap_top))
                img.alpha_composite(solid, (gx, gy))
            penx += pos.x_advance * scale
    return img, baseline


def measure(text, font_path, size_pt):
    """Width in points of the shaped text (no rasterisation)."""
    face_hb, font_hb = _hb(font_path)
    upem = face_hb.upem
    font_hb.scale = (upem, upem)
    scale = size_pt / upem
    total = 0.0
    for rtext, _cls in _runs(str(text)):
        buf = hb.Buffer()
        buf.add_str(rtext)
        buf.guess_segment_properties()
        hb.shape(font_hb, buf, {"kern": True, "liga": True})
        total += sum(p.x_advance for p in buf.glyph_positions) * scale
    return total


def wrap(text, font_path, size_pt, max_w):
    """Word-wrap text to lines that each fit within max_w points."""
    words, lines, cur = str(text).split(" "), [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if not cur or measure(trial, font_path, size_pt) <= max_w:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def _rgb(color):
    try:
        return (int(color.red * 255), int(color.green * 255), int(color.blue * 255))
    except Exception:
        return (0, 0, 0)


class ShapingCanvas:
    """Wrap a reportlab canvas; auto-shape any draw*String containing Kannada.

    Non-Kannada text falls through to the native canvas unchanged, so the
    English design renders identically. Kannada text is shaped (HarfBuzz),
    rasterised (FreeType) and placed as a transparent image at the right
    baseline/anchor, honouring the current font size + fill colour.
    """

    def __init__(self, canvas, kn_regular, kn_bold, ss=4):
        self._c = canvas
        self._kn_reg = kn_regular
        self._kn_bold = kn_bold
        self._ss = ss
        self._size = 10.0
        self._name = "Alliance2"
        self._rgb = (0, 0, 0)

    def __getattr__(self, name):
        return getattr(self._c, name)

    def setFont(self, name, size, leading=None):
        self._name, self._size = name, size
        if leading is None:
            self._c.setFont(name, size)
        else:
            self._c.setFont(name, size, leading)

    def setFillColor(self, color, alpha=None):
        self._rgb = _rgb(color)
        self._c.setFillColor(color) if alpha is None else self._c.setFillColor(color, alpha)

    def setFillColorRGB(self, r, g, b, alpha=None):
        self._rgb = (int(r * 255), int(g * 255), int(b * 255))
        self._c.setFillColorRGB(r, g, b) if alpha is None else self._c.setFillColorRGB(r, g, b, alpha)

    def _font_path(self):
        return self._kn_bold if "Alliance1" in self._name else self._kn_reg

    def _place(self, x, y, text, anchor):
        from reportlab.lib.utils import ImageReader
        im, bl = shape_to_image(text, self._font_path(),
                                max(8, int(round(self._size * self._ss))), self._rgb)
        wpt, hpt = im.width / self._ss, im.height / self._ss
        if anchor == "middle":
            x -= wpt / 2
        elif anchor == "end":
            x -= wpt
        ybottom = y - (im.height - bl) / self._ss
        self._c.drawImage(ImageReader(im), x, ybottom, width=wpt, height=hpt, mask="auto")

    def drawString(self, x, y, text, *a, **k):
        self._place(x, y, str(text), "start") if has_kannada(text) else self._c.drawString(x, y, text, *a, **k)

    def drawCentredString(self, x, y, text, *a, **k):
        self._place(x, y, str(text), "middle") if has_kannada(text) else self._c.drawCentredString(x, y, text, *a, **k)

    def drawRightString(self, x, y, text, *a, **k):
        self._place(x, y, str(text), "end") if has_kannada(text) else self._c.drawRightString(x, y, text, *a, **k)


if __name__ == "__main__":
    FONT = "/Users/fortunemarq/FortuneMarq-Build/01_CRM_AND_TOOL/fmos/public/fonts/NotoSansKannada-Regular.ttf"
    tests = {
        "kn_test_pure": "ನೀವು ಈಗಾಗಲೇ ಗೂಗಲ್ ಪೇಜ್‌ನಲ್ಲಿ ಇದ್ದೀರಿ",
        "kn_test_conj": "ಹುಬ್ಬಳ್ಳಿಯಲ್ಲಿ ಜಿಮ್‌ಗಳಿಗಾಗಿ ಪ್ರತಿ ತಿಂಗಳು ಹುಡುಕಾಟ",
    }
    for name, txt in tests.items():
        im, bl = shape_to_image(txt, FONT, 110, (26, 26, 26))
        im.save(f"/tmp/{name}.png")
        print(f"{name}: {im.size} baseline={bl} -> /tmp/{name}.png")
