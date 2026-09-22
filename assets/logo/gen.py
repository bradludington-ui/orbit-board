# ORBIT logo generator. Run: pip install fonttools && python3 assets/logo/gen.py -- writes every option into
# assets/logo/generated/ (not committed). The committed files are option B copied out of there:
#   orbit-lockup.svg <- orbit-b-lockup.svg   orbit-wordmark.svg <- orbit-b-wordmark.svg
#   orbit-mark.svg   <- orbit-b-favicon.svg  orbit-favicon.svg  <- orbit-b-favicon-baked.svg
# The wordmark inline in both builds' header is orbit-wordmark.svg with width/height dropped, class="logo",
# aria-label "ORBIT" and the mask id renamed to logoO; the favicon <link> is orbit-favicon.svg percent-encoded.
#
# ORBIT logo generator: three options, each as a lockup SVG, a mark/favicon SVG, and a preview page.
# Wordmarks are font outlines (Liberation Sans Bold, metric-compatible with Arial Bold, the board's
# fallback face), so no SVG depends on an installed font. Every SVG is single-colour via currentColor;
# the budget-year bead / satellite takes var(--orbit-accent) when the host page defines it.
import math, os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'generated'); os.makedirs(OUT, exist_ok=True)
FONT = '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'
f = TTFont(FONT); gs = f.getGlyphSet(); cmap = f.getBestCmap()
CAP = f['OS/2'].sCapHeight
fmt = lambda v: ('%.2f' % v).rstrip('0').rstrip('.') if abs(v) > 1e-9 else '0'

def gbounds(g):
    bp = BoundsPen(gs); g.draw(bp); return bp.bounds  # xMin,yMin,xMax,yMax in font units

def text(text, cap_h, x, baseline, track=0.0):
    """Outline `text` at cap height cap_h, left edge exactly at x. Returns (path d, width)."""
    s = cap_h / CAP; parts = []; cx = x; first = True; right = x
    for ch in text:
        if ch == ' ':
            cx += gs[cmap[ord(' ')]].width * s + track * cap_h; continue
        g = gs[cmap[ord(ch)]]; b = gbounds(g)
        if first: cx -= b[0] * s; first = False
        pen = SVGPathPen(gs, ntos=fmt); g.draw(TransformPen(pen, (s, 0, 0, -s, cx, baseline)))
        parts.append(pen.getCommands()); right = cx + b[2] * s
        cx += g.width * s + track * cap_h
    return ' '.join(parts), right - x

def text_width(t, cap_h, track=0.0):
    return text(t, cap_h, 0, 0, track)[1]

I_b = gbounds(gs[cmap[ord('I')]]); STEM = (I_b[2] - I_b[0]) / CAP      # stem as a fraction of cap height
O_b = gbounds(gs[cmap[ord('O')]]); O_adv = gs[cmap[ord('O')]].width / CAP

SUB = 'OUT-YEAR REQUIREMENTS & BUDGET INTEGRATION TOOL'
ACC = 'var(--orbit-accent, currentColor)'

def svg(w, h, body, cls=''):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %s %s" width="%s" height="%s" role="img" '
            'aria-label="ORBIT — Out-year Requirements &amp; Budget Integration Tool"%s>%s</svg>'
            % (fmt(w), fmt(h), fmt(w), fmt(h), (' class="%s"' % cls) if cls else '', body))

# ── Option A: "Orbit Five" — a body, one tilted orbit, five beads: the budget year and four out-years ──
def ellipse_pt(t, cx, cy, rx, ry, th):
    x, y = rx * math.cos(t), ry * math.sin(t)
    return (cx + x * math.cos(th) - y * math.sin(th), cy + x * math.sin(th) + y * math.cos(th))

def mark_a(size=100, beads=True, idp='a'):
    cx = cy = size / 2; rx, ry = size * .44, size * .24; th = math.radians(-30)
    sw = size * .05; core = size * .12
    p0 = ellipse_pt(0, cx, cy, rx, ry, th); p1 = ellipse_pt(math.pi, cx, cy, rx, ry, th)
    deg = fmt(math.degrees(th))
    arc = lambda a, b: 'M%s %s A%s %s %s 0 1 %s %s' % (fmt(a[0]), fmt(a[1]), fmt(rx), fmt(ry), deg, fmt(b[0]), fmt(b[1]))
    back = arc(p1, p0); front = arc(p0, p1)
    body = ('<path d="%s" fill="none" stroke="currentColor" stroke-width="%s" stroke-linecap="round"/>'
            '<circle cx="%s" cy="%s" r="%s" fill="currentColor"/>'
            '<path d="%s" fill="none" stroke="currentColor" stroke-width="%s" stroke-linecap="round"/>'
            % (back, fmt(sw), fmt(cx), fmt(cy), fmt(core), front, fmt(sw)))
    # beads by arc length along the front half, left to right: budget year first, then four out-years
    N = 400; pts = [ellipse_pt(math.pi - math.pi * i / N, cx, cy, rx, ry, th) for i in range(N + 1)]
    cum = [0.0]
    for i in range(1, N + 1):
        cum.append(cum[-1] + math.dist(pts[i - 1], pts[i]))
    L = cum[-1]
    def at(frac):
        tgt = frac * L
        for i in range(1, N + 1):
            if cum[i] >= tgt: return pts[i]
        return pts[-1]
    fr = [.1, .3, .5, .7, .9] if beads else [.12]
    for k, frac in enumerate(fr):
        x, y = at(frac)
        if k == 0:
            body += '<circle cx="%s" cy="%s" r="%s" fill="%s"/>' % (fmt(x), fmt(y), fmt(size * .075), ACC)
        else:
            body += '<circle cx="%s" cy="%s" r="%s" fill="currentColor"/>' % (fmt(x), fmt(y), fmt(size * .045))
    return body

def lockup_a():
    H = 100; mark = mark_a(H)
    wx = 122; cap_w = 62; base = 64
    d, ww = text('ORBIT', cap_w, wx, base, track=.06)
    sub_track = .16; nat = text_width(SUB, 10, sub_track); cap_s = 10 * ww / nat
    ds, ws = text(SUB, cap_s, wx, base + cap_s + 15, sub_track)
    W = wx + ww + 6
    return svg(W, H, mark + '<path d="%s" fill="currentColor"/><path d="%s" fill="currentColor"/>' % (d, ds)), cap_s

# ── Option B: "Orbital O" — the board's own bold face; the O is the orbit, with the body and a satellite ──
def orbital_o(cx, cy, r_out, stem, idp, sat_deg=-38, core=True):
    sw = stem; r = r_out - sw / 2
    sx, sy = cx + r * math.cos(math.radians(sat_deg)), cy + r * math.sin(math.radians(sat_deg))
    sr = sw * .62; gap = sr + sw * .32
    ext = r_out + 2
    m = ('<mask id="%s" maskUnits="userSpaceOnUse" x="%s" y="%s" width="%s" height="%s">'
         '<rect x="%s" y="%s" width="%s" height="%s" fill="#fff"/><circle cx="%s" cy="%s" r="%s" fill="#000"/></mask>'
         % (idp, fmt(cx - ext), fmt(cy - ext), fmt(2 * ext), fmt(2 * ext), fmt(cx - ext), fmt(cy - ext), fmt(2 * ext), fmt(2 * ext), fmt(sx), fmt(sy), fmt(gap)))
    b = m + '<circle cx="%s" cy="%s" r="%s" fill="none" stroke="currentColor" stroke-width="%s" mask="url(#%s)"/>' % (fmt(cx), fmt(cy), fmt(r), fmt(sw), idp)
    if core:
        b += '<circle cx="%s" cy="%s" r="%s" fill="currentColor"/>' % (fmt(cx), fmt(cy), fmt(sw * .48))
    b += '<circle cx="%s" cy="%s" r="%s" fill="%s"/>' % (fmt(sx), fmt(sy), fmt(sr), ACC)
    return b

def lockup_b(idp='b'):
    cap_w = 100; base = 108; s = cap_w / CAP
    r_out = (O_b[3] - O_b[1]) * s / 2; ocy = base - (O_b[3] + O_b[1]) * s / 2; ocx = 2 + r_out
    stem = STEM * cap_w * .95
    track = .06
    body = orbital_o(ocx, ocy, r_out, stem, idp + '-o')
    rx = 2 + O_adv * cap_w + track * cap_w - O_b[0] * s   # where the real O's advance would have put R
    d, ww = text('RBIT', cap_w, rx, base, track)
    total_w = rx + ww - 2
    sub_track = .16; nat = text_width(SUB, 10, sub_track); cap_s = 10 * total_w / nat
    ds, ws = text(SUB, cap_s, 2, base + cap_s + 22, sub_track)
    W = 2 + total_w + 4; H = base + cap_s + 30
    return svg(W, H, body + '<path d="%s" fill="currentColor"/><path d="%s" fill="currentColor"/>' % (d, ds)), cap_s

def icon_b(size=100, idp='b-icon'):
    stem = STEM * size * .92 * .9
    return svg(size, size, orbital_o(size / 2, size / 2, size * .47, stem, idp))

# ── Option C: "Monoline" — every letter drawn from the same stroke as the orbit; no font at all ──
def lockup_c(idp='c'):
    H = 100; w = 15; r = 43; track = 26
    parts = []; x = 0
    # O
    parts.append(orbital_o(x + 50, 50, r + w / 2, w, idp + '-o', core=True)); x += 100 + track
    stroke = lambda d: '<path d="%s" fill="none" stroke="currentColor" stroke-width="%s" stroke-linecap="round" stroke-linejoin="round"/>' % (d, fmt(w))
    # R
    parts.append(stroke('M%s 8 V92 M%s 8 H%s A22 22 0 0 1 %s 52 H%s M%s 52 L%s 92' % (x + 8, x + 8, x + 36, x + 36, x + 8, x + 38, x + 64))); x += 72 + track
    # B
    parts.append(stroke('M%s 8 V92 M%s 8 H%s A21 21 0 0 1 %s 50 H%s M%s 50 H%s A21 21 0 0 1 %s 92 H%s' % (x + 8, x + 8, x + 32, x + 32, x + 8, x + 8, x + 36, x + 36, x + 8))); x += 65 + track
    # I
    parts.append(stroke('M%s 8 V92' % (x + 8))); x += 16 + track
    # T
    parts.append(stroke('M%s 8 H%s M%s 8 V92' % (x + 6, x + 78, x + 42))); x += 84
    total_w = x
    sub_track = .16; nat = text_width(SUB, 10, sub_track); cap_s = 10 * total_w / nat
    ds, ws = text(SUB, cap_s, 0, 100 + cap_s + 22, sub_track)
    return svg(total_w + 2, 100 + cap_s + 30, ''.join(parts) + '<path d="%s" fill="currentColor"/>' % ds), cap_s

def icon_c(size=100, idp='c-icon'):
    return svg(size, size, orbital_o(size / 2, size / 2, size * .47, size * .15, idp))

def icon_a(size=100):
    return svg(size, size, mark_a(size, beads=False))

# ── write files ──
A, capA = lockup_a(); B, capB = lockup_b(); C, capC = lockup_c()
files = {'orbit-a-lockup.svg': A, 'orbit-a-mark.svg': svg(100, 100, mark_a(100)), 'orbit-a-favicon.svg': icon_a(),
         'orbit-b-lockup.svg': B, 'orbit-b-favicon.svg': icon_b(),
         'orbit-c-lockup.svg': C, 'orbit-c-favicon.svg': icon_c()}
for n, s in files.items():
    open(os.path.join(OUT, n), 'w').write(s + '\n')

def wordmark_b(idp='b-wm'):
    cap_w = 100; base = 104; s = cap_w / CAP
    r_out = (O_b[3] - O_b[1]) * s / 2; ocy = base - (O_b[3] + O_b[1]) * s / 2; ocx = 2 + r_out
    stem = STEM * cap_w * .95; track = .06
    body = orbital_o(ocx, ocy, r_out, stem, idp + '-o')
    rx = 2 + O_adv * cap_w + track * cap_w - O_b[0] * s
    d, ww = text('RBIT', cap_w, rx, base, track)
    W = rx + ww + 2; H = 108
    return svg(W, H, body + '<path d="%s" fill="currentColor"/>' % d)

def favicon_b_baked(ink='#0f5a91', acc='#d4a24e'):
    s = icon_b(100, 'f')
    return s.replace('var(--orbit-accent, currentColor)', acc).replace('currentColor', ink)

files['orbit-b-wordmark.svg'] = wordmark_b()
files['orbit-b-favicon-baked.svg'] = favicon_b_baked()
for n in ('orbit-b-wordmark.svg', 'orbit-b-favicon-baked.svg'):
    open(os.path.join(OUT, n), 'w').write(files[n] + '\n')
print('wordmark/favicon written')

print('subtitle cap heights as %% of wordmark cap: A %.1f  B %.1f  C %.1f' % (capA / 62 * 100, capB, capC))
print('stem fraction of cap:', round(STEM, 3))

# ── preview page ──
def card(theme, inner, label):
    return '<div class="card %s"><div class="lbl">%s</div>%s</div>' % (theme, label, inner)
def sized(s, px):
    return s.replace('width="100" height="100"', 'width="%d" height="%d"' % (px, px), 1)
def row(letter, name, why, lockup, mark, icon):
    return ('<section><h2><span class="tag">%s</span>%s</h2><p class="why">%s</p><div class="grid">'
            % (letter, name, why)
            + card('light', '<div class="lk">%s</div>' % lockup, 'Default theme · two-tone')
            + card('navy', '<div class="lk">%s</div>' % lockup, 'Navy theme · two-tone')
            + card('light mono', '<div class="lk">%s</div>' % lockup, 'Print · one colour')
            + card('light', '<div class="icons">%s%s%s%s</div>' % (sized(mark, 96), sized(icon, 48), sized(icon, 32), sized(icon, 16)), 'Mark · favicon at 48 / 32 / 16 px')
            + card('navy', '<div class="icons">%s%s%s%s</div>' % (sized(mark, 96), sized(icon, 48), sized(icon, 32), sized(icon, 16)), 'Mark on navy')
            + card('parch', '<div class="lk">%s</div>' % lockup, 'Parchment theme')
            + '</div></section>')
markA = files['orbit-a-mark.svg']
html = '''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ORBIT Logo Options</title>
<style>
:root{--bg:#e6eaef;--ink:#10233a;--mut:#41586e;--line:#c3cfda;--accent:#0f5a91}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font-family:'Segoe UI',Arial,sans-serif;padding:28px 16px 48px;max-width:1180px;margin:0 auto}
h1{font-size:22px;letter-spacing:.3px;margin-bottom:4px}
.sub{color:var(--mut);font-size:13px;max-width:70ch;margin-bottom:26px;line-height:1.45}
section{margin-bottom:34px}
h2{font-size:16px;font-weight:700;display:flex;align-items:center;gap:10px;margin-bottom:4px}
.tag{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:6px;background:var(--ink);color:#fff;font-size:13px}
.why{color:var(--mut);font-size:12.5px;max-width:78ch;line-height:1.45;margin-bottom:12px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px}
.card{border-radius:10px;padding:26px 22px 20px;min-height:150px;display:flex;flex-direction:column;justify-content:center;position:relative;border:1px solid var(--line)}
.card .lbl{position:absolute;top:8px;left:12px;font-size:9.5px;letter-spacing:1.6px;text-transform:uppercase;font-weight:700;opacity:.6}
.card.light{background:#eef2f5;color:#10233a;--orbit-accent:#0f5a91}
.card.navy{background:#141c2b;color:#eef2f8;--orbit-accent:#e0bd72;border-color:#35435c}
.card.parch{background:#f7f3ea;color:#2a2418;--orbit-accent:#87610f;border-color:#ddd5c4}
.card.mono{--orbit-accent:currentColor;background:#fff}
.lk svg{width:100%;height:auto;max-width:420px;display:block}
.icons{display:flex;align-items:center;gap:22px}
.icons svg{display:block;flex:none}
</style></head><body>
<h1>ORBIT logo options</h1>
<p class="sub">Every mark is one colour by default, so it prints and works in every board theme. The budget-year bead or the satellite takes the theme's accent when the host page sets it. All wordmarks are outlines of Liberation Sans Bold, the metric twin of Arial Bold that the board already falls back to, so nothing depends on an installed font.</p>
''' + row('A', 'Orbit Five', 'A body, one orbit, five beads: the budget year in the accent colour and the four out-years behind it, the FYDP window drawn as an orbit. The mark stands alone; the favicon keeps the body, the orbit and the budget year.', A, markA, files['orbit-a-favicon.svg']) \
    + row('B', 'Orbital O', 'The wordmark in the board\'s own bold face, with the O replaced by an orbit around a body and a satellite on the ring. The O alone is the favicon. Closest to the header as it looks today.', B, files['orbit-b-favicon.svg'], files['orbit-b-favicon.svg']) \
    + row('C', 'Monoline', 'Every letter drawn from the same round stroke as the orbit, no typeface at all. Lighter and more technical; the O is the same orbit as B.', C, files['orbit-c-favicon.svg'], files['orbit-c-favicon.svg']) \
    + '</body></html>'
open(os.path.join(OUT, 'orbit-logo-options.html'), 'w').write(html)
print('wrote', ', '.join(sorted(files)), 'and orbit-logo-options.html')
