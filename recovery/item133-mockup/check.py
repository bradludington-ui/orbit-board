# Item 133 mock-up: proves the workbook's formulas the way a spreadsheet computes them, against figures worked out from
# model.py directly (never read back from the workbook's own formulas).
#   python3 -I check.py <this folder> <mock-up.xlsx> <scratch dir>
# 1. LibreOffice recalculates the workbook; every WBS header, appropriation and ALL row must equal the sum of the
#    requirement (or CCaR record) lines beneath it, every share line must add to 100%, and no cell may hold an error.
# 2. Partner figures are typed into a copy (on a requirement line, a WBS header and an appropriation row), recalculated,
#    and each must land in its own line's total and every header above it, and nowhere else.
import sys, os, shutil, subprocess; sys.path.insert(0, sys.argv[1])
from model import *
from openpyxl import load_workbook

SRC, TMP = sys.argv[2], sys.argv[3]
os.makedirs(TMP, exist_ok=True)
fails = []
def chk(ok, what):
  if not ok: fails.append(what)

def recalc(path, tag):
  out = os.path.join(TMP, tag); os.makedirs(out, exist_ok=True)
  subprocess.run(['soffice', '--headless', '--calc', '--convert-to', 'xlsx', '--outdir', out, path],
                 check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
  return load_workbook(os.path.join(out, os.path.basename(path)), data_only=True)

def rows_of(ws, first=8):
  out = []
  for r in range(first, ws.max_row + 1):
    a = ws.cell(r, 1).value
    if a is None or str(a).startswith(MARK) or str(a).startswith('Share of') or str(a).startswith('Obligated:'): continue
    out.append(r)
  return out

def code_of(a):
  a = str(a).strip(); w = a.split()[0]
  return w if w in WBS else None

def expect_plan(fy):
  # {(appn, code|None for the section): {col: $}} from model.py alone
  E = {}
  grp = {g: names for g, names in GROUPS}
  for ap in APPNS:
    for x in PLAN[ap][fy]:
      v = {4: sum(x['ask'].values())}
      for k, (g, names) in enumerate(GROUPS): v[5 + k] = sum(x['fund'].get(s, 0) for s in names)
      keys = [(ap, None), ('ALL', None)]
      w = x['wbs']
      while w: keys.append((ap, w)); w = parent(w)
      for key in keys:
        d = E.setdefault(key, {})
        for c, n in v.items(): d[c] = d.get(c, 0) + n
  return E

def expect_active():
  E = {}
  for ap in APPNS:
    for e in EVENTS[ap]:
      gi = [k for k, (g, names) in enumerate(GROUPS) if e['line'] in names][0]
      col = 4 + 2 * gi + (0 if e['ob'] else 1)
      keys = [(ap, None), ('ALL', None)]
      w = e['wbs']
      while w: keys.append((ap, w)); w = parent(w)
      for key in keys:
        d = E.setdefault(key, {}); d[col] = d.get(col, 0) + e['amount']
  return E

def walk_keys(ws):
  # (row, key) for the ALL row, each appropriation row and each WBS header, in sheet order
  out, ap = [], None
  for r in rows_of(ws):
    a = str(ws.cell(r, 1).value).strip()
    if a == 'ALL APPROPRIATIONS': out.append((r, ('ALL', None)))
    elif a in [x.upper() for x in APPNS]: ap = APPNS[[x.upper() for x in APPNS].index(a)]; out.append((r, (ap, None)))
    elif code_of(a): out.append((r, (ap, code_of(a))))
  return out

def no_errors(wb):
  for ws in wb.worksheets:
    for row in ws.iter_rows():
      for c in row:
        if isinstance(c.value, str) and c.value.startswith('#'):
          fails.append('%s!%s holds %s' % (ws.title, c.coordinate, c.value))

def check_tree(ws, E, money_cols, tot_col, share_cols, share_parts, tag):
  seen = 0
  for r, key in walk_keys(ws):
    want = E.get(key, {})
    for c in money_cols:
      got = ws.cell(r, c).value or 0
      chk(abs(got - want.get(c, 0)) < 0.5, '%s %s row %d col %d: got %s, want %s' % (tag, key, r, c, got, want.get(c, 0)))
    seen += 1
  for r in rows_of(ws):
    t = ws.cell(r, tot_col).value
    if isinstance(t, (int, float)) and t > 0:
      sh = [ws.cell(r, c).value or 0 for c in share_cols]
      chk(abs(sum(sh) - 1) < 1e-9, '%s row %d: shares add to %s' % (tag, r, sum(sh)))
      for c, parts in zip(share_cols, share_parts):
        want = sum((ws.cell(r, p).value or 0) for p in parts) / t
        chk(abs((ws.cell(r, c).value or 0) - want) < 1e-12, '%s row %d col %d: share %s, want %s' % (tag, r, c, ws.cell(r, c).value, want))
  chk(seen > 10, '%s: only %d header rows found' % (tag, seen))
  return seen

wb = recalc(SRC, 'plain')
no_errors(wb)
n = 0
for fy in YEARS:
  ws = wb['FY%02d' % (fy % 100)]
  n += check_tree(ws, expect_plan(fy), [4, 5, 6, 7], 12, [13, 14, 15, 16], [[5], [6], [7], [11]], 'FY%02d' % (fy % 100))
  for r in rows_of(ws):
    v = [ws.cell(r, c).value or 0 for c in (4, 5, 6, 7, 8, 9, 11, 12)]
    chk(abs(v[4] - (v[1] + v[2] + v[3])) < .5 and abs(v[5] - (v[0] - v[4])) < .5 and abs(v[7] - (v[4] + v[6])) < .5,
        'FY%02d row %d: US funded / unfunded / total do not close' % (fy % 100, r))
wa = wb['FY%02d (active)' % (ACTIVE % 100)]
n += check_tree(wa, expect_active(), list(range(4, 10)), 15, [16, 17, 18, 19], [[4, 5], [6, 7], [8, 9], [14]], 'active')
wm = wb['FY%02d by month' % (ACTIVE % 100)]
for r, key in walk_keys(wm):
  want = sum(v for c, v in expect_active().get(key, {}).items())
  chk(abs((wm.cell(r, 15).value or 0) - want) < .5, 'by month %s: total %s, want %s' % (key, wm.cell(r, 15).value, want))
ACT_TOT = sum(e['amount'] for ap in APPNS for e in EVENTS[ap])
chk(abs((wa.cell(8, 12).value or 0) - ACT_TOT) < .5, 'active ALL total %s, want %s' % (wa.cell(8, 12).value, ACT_TOT))

# ---- 2. partner figures typed into a copy
cp = os.path.join(TMP, 'partner.xlsx'); shutil.copy(SRC, cp)
wf = load_workbook(cp); ws = wf['FY%02d' % (YEARS[0] % 100)]
def find(ws, pred):
  for r in range(8, ws.max_row + 1):
    if pred(str(ws.cell(r, 1).value or '')): return r
  raise SystemExit('row not found')
r_leaf = find(ws, lambda a: a.startswith('Engine module repair'))           # a requirement line under 1.2.2.1 (O&M)
r_12 = find(ws, lambda a: a.startswith('1.2  '))                             # the O&M 1.2 header
r_om = find(ws, lambda a: a == 'O&M')
r_ff = find(ws, lambda a: a == 'FULL FUND')
ws.cell(r_leaf, 10, 2000000); ws.cell(r_12, 10, 1000000); ws.cell(r_om, 10, 500000)
wf.save(cp)
wp = recalc(cp, 'partner'); w2 = wp['FY%02d' % (YEARS[0] % 100)]
no_errors(wp)
def K(r): return w2.cell(r, 11).value or 0
r_1221 = find(w2, lambda a: a.startswith('1.2.2.1'))
r_122 = find(w2, lambda a: a.startswith('1.2.2  '))
r_1 = find(w2, lambda a: a.startswith('1  '))
r_11 = find(w2, lambda a: a.startswith('1.1  '))
for (r, want, what) in [(r_leaf, 2e6, 'the line typed on'), (r_1221, 2e6, '1.2.2.1'), (r_122, 2e6, '1.2.2'),
                        (r_12, 3e6, '1.2 (its own 1M + 2M beneath)'), (r_1, 3e6, '1'), (r_om, 3.5e6, 'O&M (its own 0.5M)'),
                        (r_11, 0, '1.1 (nothing typed beneath)'), (r_ff, 0, 'Full Fund'), (8, 3.5e6, 'ALL')]:
  chk(abs(K(r) - want) < .5, 'partner total on %s: %s, want %s' % (what, K(r), want))
  t = w2.cell(r, 12).value or 0
  if t: chk(abs((w2.cell(r, 16).value or 0) - K(r) / t) < 1e-12, 'partner share on %s' % what)
before = wb['FY%02d' % (YEARS[0] % 100)]
chk((w2.cell(r_leaf, 13).value or 0) < (before.cell(r_leaf, 13).value or 0), 'the typed line\'s Air Force share did not fall')
chk(abs(sum((w2.cell(r_leaf, c).value or 0) for c in (13, 14, 15, 16)) - 1) < 1e-9, 'the typed line\'s shares do not add to 100%')

print('checked %d header rows; partner figures typed on a line, a WBS header and an appropriation' % n)
if fails:
  print('%d FAILING' % len(fails)); [print('  ' + f) for f in fails[:40]]; sys.exit(1)
print('ALL CHECKS PASSED')
