# For export-review2.test.mjs: a workbook the tool wrote, read back with openpyxl, its own XML and the Carlito font
# (Calibri's metric twin), never with the tool's own reader or its own line estimate.
#
#   python3 -I export-review2.py BOOK.xlsx
#   -> JSON {"short": [[sheet, range, lines, height, need, text], ...],   merged, wrapped one-row texts too short for their words
#            "breaks": {sheet: [first row of each printed page after the first, 1-based]},
#            "after":  {sheet: true when rowBreaks follows headerFooter in the part, as the schema orders them}}
#
# Excel never fits a row's height to a merged cell: a merged, wrapped text with no height of its own shows one line and
# hides the rest (review XP2-1). LibreOffice sizes such a row itself, so its PDF cannot show the defect; this measures.
import sys, json, re, zipfile, os
import openpyxl
from openpyxl.utils import get_column_letter as L
from PIL import ImageFont

FONT_DIR = '/usr/share/fonts/truetype/crosextra/'
if not os.path.exists(FONT_DIR + 'Carlito-Regular.ttf'):
    sys.exit('export-review2.py needs the Carlito font (Calibri\'s metric twin) in ' + FONT_DIR)
FONTS = {}
def font(sz, b, i):
    k = (sz, bool(b), bool(i))
    if k not in FONTS:
        name = 'Carlito-' + ('BoldItalic' if b and i else 'Bold' if b else 'Italic' if i else 'Regular')
        FONTS[k] = ImageFont.truetype(FONT_DIR + name + '.ttf', int(round(sz * 4)))   # 4 px a point at 288 dpi
    return FONTS[k]
def px(s, f): return f.getlength(s) * 96 / 288   # at 96 dpi, Excel's pixels

book = sys.argv[1]
wb = openpyxl.load_workbook(book)
short = []
for ws in wb.worksheets:
    if 'Raw Data' in ws.title: continue
    for m in ws.merged_cells.ranges:
        if m.min_row != m.max_row: continue
        c = ws.cell(m.min_row, m.min_col)
        if not isinstance(c.value, str) or not c.alignment.wrap_text: continue
        f = font(c.font.sz or 11, c.font.b, c.font.i)
        # Excel's column width in pixels for Calibri 11 (a '0' is 7 px): width * 7 + 5; less the cell's padding and indent
        w = sum(int((ws.column_dimensions[L(k)].width or 8.43) * 7 + 5) for k in range(m.min_col, m.max_col + 1))
        w -= 6 + int(c.alignment.indent or 0) * 9
        n = 0
        for para in c.value.split('\n'):
            cur = ''; n += 1
            for word in para.split(' '):
                t = (cur + ' ' + word) if cur else word
                if px(t, f) > w and cur: n += 1; cur = word
                else: cur = t
        ht = ws.row_dimensions[m.min_row].height or 15
        need = n * (c.font.sz or 11) * 1.27
        if need > ht + 0.5: short.append([ws.title, m.coord, n, ht, round(need, 1), c.value[:80]])
    # A label in the first column, right-aligned or centred and not merged, has no empty cell to its left to run into:
    # wider than its column, Excel cuts it unless it wraps in a row tall enough (the Obligation % label, review BP-3).
    merged = set()
    for m in ws.merged_cells.ranges:
        for r in range(m.min_row, m.max_row + 1): merged.add((r, m.min_col))
    w1 = int((ws.column_dimensions['A'].width or 8.43) * 7 + 5)
    for row in ws.iter_rows(min_col=1, max_col=1):
        c = row[0]
        if not isinstance(c.value, str) or (c.row, 1) in merged or c.alignment.horizontal not in ('right', 'center'): continue
        f = font(c.font.sz or 11, c.font.b, c.font.i)
        w = w1 - 6 - int(c.alignment.indent or 0) * 9
        if not c.alignment.wrap_text:
            if px(c.value, f) > w: short.append([ws.title, c.coordinate, 1, ws.row_dimensions[c.row].height or 15, 'cut', c.value[:80]])
            continue
        n, cur = 1, ''
        for word in c.value.split(' '):
            t = (cur + ' ' + word) if cur else word
            if px(t, f) > w and cur: n += 1; cur = word
            else: cur = t
        ht = ws.row_dimensions[c.row].height or 15
        if n * (c.font.sz or 11) * 1.27 > ht + 0.5: short.append([ws.title, c.coordinate, n, ht, round(n * (c.font.sz or 11) * 1.27, 1), c.value[:80]])

# the parts, by sheet name, through the workbook's own relationships
z = zipfile.ZipFile(book)
wbx = z.read('xl/workbook.xml').decode('utf8')
rels = z.read('xl/_rels/workbook.xml.rels').decode('utf8')
target = {}
for el in re.findall(r'<Relationship\b[^>]*>', rels):
    i, t = re.search(r'\bId="([^"]+)"', el), re.search(r'\bTarget="([^"]+)"', el)
    if i and t: target[i.group(1)] = t.group(1)
def unesc(s): return s.replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"').replace('&apos;', "'").replace('&amp;', '&')
after = {}
for m in re.finditer(r'<sheet [^>]*name="([^"]*)"[^>]*r:id="([^"]+)"', wbx):
    name, rid = unesc(m.group(1)), m.group(2)
    t = target[rid]
    part = z.read('xl/' + t if not t.startswith('/') else t[1:]).decode('utf8')
    if '<rowBreaks' in part:
        hf = part.find('</headerFooter>')
        after[name] = hf >= 0 and part.find('<rowBreaks') > hf and part.find('</rowBreaks>') < part.find('</worksheet>')
breaks = {}
for ws in wb.worksheets:
    ids = [b.id for b in ws.row_breaks.brk]
    if ids: breaks[ws.title] = sorted(i + 1 for i in ids)
print(json.dumps({'short': short, 'breaks': breaks, 'after': after}))
