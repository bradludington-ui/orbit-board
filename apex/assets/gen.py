# APEX logo generator. Run: pip install fonttools && python3 apex/assets/gen.py   -- rewrites the three SVGs beside it.
# The logo is in ORBIT's theme (assets/logo/gen.py): a ring the weight of the letter stems with a satellite at two
# o'clock and a gap masked out of the ring around it, one colour (currentColor) with the satellite in the host's accent,
# and the name in outlines of Liberation Sans Bold so no file depends on an installed font. Where ORBIT's ring holds a
# body at its centre, APEX's holds a T-Rex, head and shoulders, with its two small arms (Brad, 12 Nov 2026).
#   apex-mark.svg      the ring and the T-Rex alone (the favicon-sized mark)
#   apex-wordmark.svg  the mark, then APEX
#   apex-logo.svg      the wordmark over "Appropriation Planning & Execution", for slides and documents
# The wordmark inline in the page's top bar (src/90-ui.js UI_MARK) is apex-wordmark.svg with width/height dropped.
import math, os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

HERE = os.path.dirname(os.path.abspath(__file__))
f = TTFont('/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'); gs = f.getGlyphSet(); cmap = f.getBestCmap()
CAP = f['OS/2'].sCapHeight
fmt = lambda v: ('%.2f' % v).rstrip('0').rstrip('.') if abs(v) > 1e-9 else '0'

def text(t, cap_h, x, baseline, track=0.0, face=None):
    g_s, cm = (gs, cmap) if face is None else face
    s = cap_h / CAP; parts = []; cx = x; first = True; right = x
    for ch in t:
        g = g_s[cm[ord(ch)]]
        if ch == ' ': cx += g.width * s + track * cap_h; continue
        bp = BoundsPen(g_s); g.draw(bp); b = bp.bounds
        if first: cx -= b[0] * s; first = False
        pen = SVGPathPen(g_s, ntos=fmt); g.draw(TransformPen(pen, (s, 0, 0, -s, cx, baseline)))
        parts.append(pen.getCommands()); right = cx + b[2] * s
        cx += g.width * s + track * cap_h
    return ' '.join(parts), right - x

# ---- the T-Rex, in a 100 x 100 box whose ring is centred on (50, 50). Head first (the lip, the teeth of both jaws, the
# lower jaw, the throat), then the chest with its two small arms, the belly, and the back up to the skull.
HEAD = [(60,25.5),(56,25),(54.2,30.5),(51.4,25.6),(48.6,31.4),(45.8,26.2),(43,32),(40.2,26.8),(37.4,32.4),(34.6,27.6),(31.8,32.6),(29,28.6),
        (24.5,33.5),(28,37.6),(30.6,35),(33.4,40),(36.2,36.8),(39,42),(41.8,38.6),(44.6,43.8),(47.4,40.4),(50.2,45),(52.6,42.2),(56,45.5),
        (54,50),(42,54),(29,52),(24,47.5)]
SKULL = [(5.5,44),(9.5,29),(16.5,18.5),(25,11.5),(31,13.2),(37,10.2),(46,11.6),(54,13),(60,18.2),(61.5,22)]
EYE = [(25.5,17.4),(34.4,19.2),(33,22.4),(27.2,21.2)]
NOSE = [(54.4,16.6),(57.2,17.8),(56.6,19.4),(53.9,18.4)]
K, TX, TY = 0.72, 31.0, 14.0                                   # the head's scale and place in the ring
FLIP = lambda pts: [(100 - x, y) for x, y in pts]              # it faces left, away from the satellite behind its head
hp = lambda pts: FLIP([(TX + K * x, TY + K * y) for x, y in pts])
BODY = FLIP([(51,56),                                          # chest, under the throat
        (58,58.5),(63,63),(60.8,62.6),(61,65.6),(58.8,63.4),(57.6,66),(56,62.8),(51.6,62.4),            # the upper arm, two claws
        (52,68),
        (58,70.5),(61.5,75),(59.3,74.4),(59.1,77.4),(57.3,75),(55.7,77.2),(54.9,74),(52.2,73.4),        # the lower arm
        (53.5,84),(52,100),(19,100),(22,82),(27,66),(32,54)])                                          # belly, base, back
def poly(pts): return 'M' + ' L'.join(fmt(x) + ' ' + fmt(y) for x, y in pts) + ' Z'
REX = poly(hp(HEAD) + BODY + hp(SKULL)) + ' ' + poly(hp(EYE)) + ' ' + poly(hp(NOSE))

R, SW = 41.0, 10.0                                             # the ring: radius and weight
A = math.radians(38)                                           # the satellite, at two o'clock
SX, SY = 50 + R * math.cos(A), 50 - R * math.sin(A)
SAT, GAP = 8.6, 13.4

def mark(idp, ox=0.0, oy=0.0, k=1.0):
    """The ring, its satellite and the T-Rex, scaled by k and moved to (ox, oy)."""
    t = 'transform="translate(%s %s) scale(%s)"' % (fmt(ox), fmt(oy), fmt(k))
    return ('<mask id="%s-ring" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect width="100" height="100" fill="#fff"/>'
            '<circle cx="%s" cy="%s" r="%s" fill="#000"/></mask><clipPath id="%s-in"><circle cx="50" cy="50" r="%s"/></clipPath>'
            '<g %s><circle cx="50" cy="50" r="%s" fill="none" stroke="currentColor" stroke-width="%s" mask="url(#%s-ring)"/>'
            '<path clip-path="url(#%s-in)" fill="currentColor" fill-rule="evenodd" d="%s"/>'
            '<circle cx="%s" cy="%s" r="%s" fill="var(--apex-accent, currentColor)"/></g>'
            % (idp, fmt(SX), fmt(SY), fmt(GAP), idp, fmt(R - SW / 2 + 0.5), t, fmt(R), fmt(SW), idp, idp, REX, fmt(SX), fmt(SY), fmt(SAT)))

def svg(w, h, body, label): return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %s %s" width="%s" height="%s" role="img" aria-label="%s">%s</svg>\n'
                                    % (fmt(w), fmt(h), fmt(w), fmt(h), label, body))
LABEL = 'APEX — Appropriation Planning &amp; Execution'
open(os.path.join(HERE, 'apex-mark.svg'), 'w').write(svg(100, 100, mark('a-m'), LABEL))
H = 108.0; k = H / 100; cap = 78.0
d, w = text('APEX', cap, 0, 0, track=0.035)
gap = 22.0; x0 = H + gap; base = (H + cap) / 2
d, w = text('APEX', cap, x0, base, track=0.035)
open(os.path.join(HERE, 'apex-wordmark.svg'), 'w').write(svg(x0 + w, H, mark('a-w', 0, 0, k) + '<path fill="currentColor" d="%s"/>' % d, LABEL))
reg = TTFont('/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'); face = (reg.getGlyphSet(), reg.getBestCmap())
sub, sw_ = text('Appropriation Planning & Execution', 15.5, x0, H + 30, track=0.06, face=face)
W2 = max(x0 + w, x0 + sw_)
open(os.path.join(HERE, 'apex-logo.svg'), 'w').write(svg(W2, H + 39, mark('a-l', 0, 0, k) + '<path fill="currentColor" d="%s"/><path fill="currentColor" opacity=".78" d="%s"/>' % (d, sub), LABEL))
print('wrote apex-mark.svg, apex-wordmark.svg (%s x %s), apex-logo.svg' % (fmt(x0 + w), fmt(H)))
