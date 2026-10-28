# Item 133 mock-up: proves the workbook the way a spreadsheet computes it, against figures worked out from model.py
# directly -- the Service groups are written out here by hand (Marine Corps includes Full Fund's "USMC-B"), never taken
# from the builder's own GROUPS or SVC_ALIAS, so a builder that drops an alias cannot agree with this by construction.
#   python3 -I check.py <this folder> <mock-up.xlsx> <scratch dir>
# 1. LibreOffice recalculates the workbook. Every row of every tab -- ALL, each appropriation, each WBS header, each line,
#    "No WBS paragraph yet" -- must equal the sum of the model's figures that row stands for (found by the row's own hidden
#    keys), every share line must add to 100%, and no cell may hold an error.
# 2. No formula on a tree tab may point at another row (only its own row, the header row, or whole columns): that is what
#    makes sorting, filtering and inserting rows unable to move a total.
# 3. Partner figures are typed in $M into a copy, on a requirement line, a WBS header, an appropriation and the active
#    tab; each must land, x 1,000,000, in its own line and every header above it, and nowhere else.
# 4. The Data tab: one measure per column, Funded = Obligated + Planned on every active-year row.
import sys, os, re, shutil, subprocess; sys.path.insert(0, sys.argv[1])
from model import *
from openpyxl import load_workbook

SRC, TMP = sys.argv[2], sys.argv[3]
os.makedirs(TMP, exist_ok=True)
fails = []
def chk(ok, what):
  if not ok: fails.append(what)
GRP = {'Air Force': {'USAF', 'ANG', 'AFRC'}, 'Marine Corps': {'STOVL', 'USMC-B', 'USMC-C'}, 'Navy': {'USN'}}
def fyl(fy): return 'FY%02d' % (fy % 100)

def recalc(path, tag):
  out = os.path.join(TMP, tag); os.makedirs(out, exist_ok=True)
  subprocess.run(['soffice', '--headless', '--calc', '--convert-to', 'xlsx', '--outdir', out, path],
                 check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
  return load_workbook(os.path.join(out, os.path.basename(path)), data_only=True)

def cols_of(ws):
  c7 = {ws.cell(7, j).value: j for j in range(1, ws.max_column + 1)}
  c6 = {ws.cell(6, j).value: j for j in range(1, ws.max_column + 1) if ws.cell(6, j).value}
  return c6, c7

def rows_of(ws, c7):
  out = []
  for r in range(8, ws.max_row + 1):
    t = ws.cell(r, c7['kTYPE']).value
    if t: out.append((r, {k: ws.cell(r, c7[k]).value for k in c7 if k and str(k).startswith('k')}))
  return out

def matches(k, ap, w, key=None):
  """does a model figure (appropriation ap, paragraph w, line key) belong to the row with hidden keys k?"""
  t = k['kTYPE']
  if t == 'all': return True
  if ap != k['kAP']: return False
  if t == 'section': return True
  if t == 'line': return w == k['kPARA'] and key == k['kLINE']
  lv = max(i for i in range(1, 6) if k.get('kL%d' % i))
  code = k['kL%d' % lv]
  if code == NONE: return w == NONE
  return w != NONE and len(chain(w)) >= lv and chain(w)[lv - 1] == code

def expect_plan(k, fy):
  e = {'req': 0, 'ace': 0, 'Air Force': 0, 'Marine Corps': 0, 'Navy': 0}
  for ap in APPNS:
    for x in PLAN[ap][fy]:
      if matches(k, ap, x['wbs'], x['ccar'] + '|' + x['contract']):
        e['req'] += sum(x['ask'].values())
        for g, names in GRP.items(): e[g] += sum(v for s, v in x['fund'].items() if s in names)
    if k['kTYPE'] != 'line':
      for w, d in ACE[ap][fy].items():
        if matches(k, ap, w): e['ace'] += sum(d.values())
  return e

def expect_active(k, month=None):
  e = {'ace': 0, 'tot': 0, 'ob': 0, 'pl': 0}
  for g in GRP: e[g + ' ob'] = e[g + ' pl'] = 0
  for ap in APPNS:
    for x in EVENTS[ap]:
      if month is not None and x['month'] != month: continue
      if matches(k, ap, x['wbs'], x['ccar'] + '|' + x['contract']):
        g = [g for g, n in GRP.items() if x['line'] in n][0]
        e[g + (' ob' if x['ob'] else ' pl')] += x['amount']; e['tot'] += x['amount']; e['ob' if x['ob'] else 'pl'] += x['amount']
    if k['kTYPE'] != 'line' and month is None:
      for w, d in ACE_ACTIVE[ap].items():
        if matches(k, ap, w): e['ace'] += sum(d.values())
  return e

def v(ws, r, c): x = ws.cell(r, c).value; return x if isinstance(x, (int, float)) else 0

def no_errors(wb):
  for ws in wb.worksheets:
    for row in ws.iter_rows():
      for c in row:
        if isinstance(c.value, str) and c.value.startswith('#'): fails.append('%s!%s holds %s' % (ws.title, c.coordinate, c.value))

def check_plan(ws, fy, partner=None):
  c6, c7 = cols_of(ws); n = 0
  for r, k in rows_of(ws, c7):
    e = expect_plan(k, fy); n += 1
    for name, col in [('req', 'US requirement'), ('Air Force', 'Air Force'), ('Marine Corps', 'Marine Corps'), ('Navy', 'Navy')]:
      chk(abs(v(ws, r, c7[col]) - e[name]) < .5, '%s row %d %s %s: got %s, want %s' % (ws.title, r, k['kTYPE'], col, v(ws, r, c7[col]), e[name]))
    if k['kTYPE'] != 'line':
      chk(abs(v(ws, r, c7['ACE estimate (US)']) - e['ace']) < .5, '%s row %d ACE: got %s, want %s' % (ws.title, r, v(ws, r, c7['ACE estimate (US)']), e['ace']))
    usf = e['Air Force'] + e['Marine Corps'] + e['Navy']
    chk(abs(v(ws, r, c7['US funded']) - usf) < .5 and abs(v(ws, r, c7['US unfunded']) - (e['req'] - usf)) < .5, '%s row %d US funded/unfunded' % (ws.title, r))
    p = partner(k) if partner else 0
    chk(abs(v(ws, r, c7['Partner total']) - p) < .5, '%s row %d partner total: got %s, want %s' % (ws.title, r, v(ws, r, c7['Partner total']), p))
    tot = usf + p
    if tot:
      for col, num in [('% Air Force', e['Air Force']), ('% Marine Corps', e['Marine Corps']), ('% Navy', e['Navy']), ('% Partners', p)]:
        chk(abs(v(ws, r, c7[col]) - num / tot) < 1e-9, '%s row %d %s: got %s, want %s' % (ws.title, r, col, v(ws, r, c7[col]), num / tot))
  return n

def check_active(ws, partner=None):
  c6, c7 = cols_of(ws); n = 0
  for r, k in rows_of(ws, c7):
    e = expect_active(k); n += 1
    for g in GRP:
      chk(abs(v(ws, r, c6[g]) - e[g + ' ob']) < .5 and abs(v(ws, r, c6[g] + 1) - e[g + ' pl']) < .5,
          'active row %d %s %s: got %s/%s, want %s/%s' % (r, k['kTYPE'], g, v(ws, r, c6[g]), v(ws, r, c6[g] + 1), e[g + ' ob'], e[g + ' pl']))
    us = c6['US']
    chk(abs(v(ws, r, us) - e['ob']) < .5 and abs(v(ws, r, us + 1) - e['pl']) < .5 and abs(v(ws, r, us + 2) - e['tot']) < .5, 'active row %d US' % r)
    if k['kTYPE'] != 'line': chk(abs(v(ws, r, c6['ACE']) - e['ace']) < .5, 'active row %d ACE: got %s, want %s' % (r, v(ws, r, c6['ACE']), e['ace']))
    p = partner(k) if partner else 0
    chk(abs(v(ws, r, c6['Partners'] + 1) - p) < .5, 'active row %d partner total' % r)
    tot = e['tot'] + p
    if tot:
      sh = [v(ws, r, c6['Share of obligated + planned'] + i) for i in range(4)]
      want = [(e[g + ' ob'] + e[g + ' pl']) / tot for g in GRP] + [p / tot]
      chk(all(abs(a - b) < 1e-9 for a, b in zip(sh, want)), 'active row %d shares %s, want %s' % (r, sh, want))
  return n

def check_month(ws):
  c6, c7 = cols_of(ws); n = 0
  mcol = [j for j in range(1, ws.max_column + 1) if hasattr(ws.cell(7, j).value, 'year')]
  chk(len(mcol) == 12, 'by month: %d month columns' % len(mcol))
  for r, k in rows_of(ws, c7):
    n += 1
    for i, j in enumerate(mcol):
      want = expect_active(k, i)['tot']
      chk(abs(v(ws, r, j) - want) < .5, 'by month row %d %s month %d: got %s, want %s' % (r, k['kTYPE'], i, v(ws, r, j), want))
  for lbl, key in (('of which obligated', 'ob'), ('of which planned to obligate', 'pl')):
    r = [rr for rr in range(8, 12) if ws.cell(rr, 1).value == lbl][0]
    for i, j in enumerate(mcol):
      want = expect_active({'kTYPE': 'all'}, i)[key]
      chk(abs(v(ws, r, j) - want) < .5, 'by month "%s" month %d: got %s, want %s' % (lbl, i, v(ws, r, j), want))
  return n

def static_refs(wb):
  # no formula on a tree tab may point at another row: only its own row, the header row 7, or whole columns
  bad = 0
  for ws in wb.worksheets:
    if ws.title in ('Data', 'How to read'): continue
    for row in ws.iter_rows(min_row=8):
      for c in row:
        if isinstance(c.value, str) and c.value.startswith('='):
          for m in re.finditer(r'(?<![A-Za-z!$])\$?[A-Z]{1,3}\$?(\d+)', re.sub(r'"[^"]*"', '""', c.value).replace('Data!', 'Data_')):
            if int(m.group(1)) not in (c.row, 7): bad += 1; fails.append('%s!%s points at row %s: %s' % (ws.title, c.coordinate, m.group(1), c.value[:80]))
  return bad

# ---- 1 and 2: the workbook as built
raw = load_workbook(SRC)
static_refs(raw)
from openpyxl.utils.cell import range_boundaries
def dv_cells(ws):
  out = set()
  for dv in ws.data_validations.dataValidation:
    for rg in dv.sqref.ranges:
      c1, r1, c2, r2 = range_boundaries(rg.coord); out |= {(r, c) for r in range(r1, r2 + 1) for c in range(c1, c2 + 1)}
  return out
for t, col in ((fyl(YEARS[0]), 'Partner, type $M'), (fyl(ACTIVE) + ' (active)', None)):
  ws = raw[t]; c6, c7 = cols_of(ws); j = c7[col] if col else c6['Partners']
  rows_ = [r for r, k in rows_of(ws, c7)]
  chk(all((r, j) in dv_cells(ws) for r in rows_), '%s: a partner box without its validation' % t)
wb = recalc(SRC, 'plain'); no_errors(wb)
n = 0
for fy in YEARS: n += check_plan(wb[fyl(fy)], fy)
n += check_active(wb[fyl(ACTIVE) + ' (active)']); n += check_month(wb[fyl(ACTIVE) + ' by month'])
# the whole of the model reaches ALL, money with no paragraph and on a paragraph the ACE lacks included
all_req = sum(sum(x['ask'].values()) for ap in APPNS for x in PLAN[ap][YEARS[0]])
ws = wb[fyl(YEARS[0])]; c6, c7 = cols_of(ws)
chk(abs(v(ws, 8, c7['US requirement']) - all_req) < .5, 'ALL US requirement %s, want every requirement %s' % (v(ws, 8, c7['US requirement']), all_req))
none_rows = [r for r, k in rows_of(ws, c7) if k['kTYPE'] == 'head' and k['kL1'] == NONE]
chk(len(none_rows) == 1, 'one "No WBS paragraph yet" block on %s (found %d)' % (ws.title, len(none_rows)))
chk(any(str(ws.cell(r, 1).value).startswith('1.4') and 'not in the ACE' in str(ws.cell(r, 1).value) for r in range(8, ws.max_row + 1)), '1.4 is flagged as not in the ACE')
chk(any(str(ws.cell(r, 1).value).startswith('1.1.1.3') for r in range(8, ws.max_row + 1)), 'the ACE line nothing claims (1.1.1.3) has a row')
# ---- 4: the Data tab
dws = wb['Data']; H = {dws.cell(1, j).value: j for j in range(1, dws.max_column + 1)}
fund_by_fy = {}
for r in range(2, dws.max_row + 1):
  rec, fy = dws.cell(r, H['Record']).value, dws.cell(r, H['FY']).value
  f, o, p = [v(dws, r, H[c]) for c in ('Funded ($)', 'Obligated ($)', 'Planned to obligate ($)')]
  if rec == 'CCaR plan event': chk(abs(f - (o + p)) < .5 and (o == 0 or p == 0), 'Data row %d: Funded is not Obligated + Planned' % r)
  fund_by_fy[fy] = fund_by_fy.get(fy, 0) + f
for fy in YEARS:
  w = wb[fyl(fy)]; c6x, c7x = cols_of(w)
  chk(abs(fund_by_fy[fyl(fy)] - v(w, 8, c7x['US funded'])) < .5, 'Data Funded for %s = the tab\'s ALL US funded' % fyl(fy))
wa = wb[fyl(ACTIVE) + ' (active)']; c6a, c7a = cols_of(wa)
chk(abs(fund_by_fy[fyl(ACTIVE)] - v(wa, 8, c6a['US'] + 2)) < .5, 'Data Funded for the active year = obligated + planned on its tab')

# ---- 3: partner figures typed in $M into a copy
cp = os.path.join(TMP, 'partner.xlsx'); shutil.copy(SRC, cp)
wf = load_workbook(cp)
def find_row(ws, pred):
  c6, c7 = cols_of(ws)
  for r, k in rows_of(ws, c7):
    if pred(k, str(ws.cell(r, 1).value)): return r
  raise SystemExit('row not found')
ws = wf[fyl(YEARS[0])]; c6, c7 = cols_of(ws); PT = c7['Partner, type $M']
typed = [(lambda k, a: k['kTYPE'] == 'line' and k['kAP'] == 'O&M' and k['kPARA'] == '1.2.2.1', 2.5),
         (lambda k, a: k['kTYPE'] == 'head' and k['kAP'] == 'O&M' and a.startswith('1.2  '), 1.0),
         (lambda k, a: k['kTYPE'] == 'section' and k['kAP'] == 'O&M', 0.5),
         (lambda k, a: k['kTYPE'] == 'line' and k['kAP'] == 'Full Fund' and k['kPARA'] == '1.2.2.1', 0.25)]
TY = []
for pred, m in typed:
  r = find_row(ws, pred); ws.cell(r, PT, m)
  TY.append(({kk: ws.cell(r, c7[kk]).value for kk in c7 if kk and str(kk).startswith('k')}, m * 1e6))
wsa = wf[fyl(ACTIVE) + ' (active)']; c6a, c7a = cols_of(wsa)
ra = find_row(wsa, lambda k, a: k['kTYPE'] == 'line' and k['kAP'] == 'O&M' and k['kPARA'] == '1.1.1.2')
wsa.cell(ra, c6a['Partners'], 1.5)
TA = [({kk: wsa.cell(ra, c7a[kk]).value for kk in c7a if kk and str(kk).startswith('k')}, 1.5e6)]
wf.save(cp)
def partner_of(T):
  def f(k):
    s = 0
    for tk, amt in T:
      if k['kTYPE'] == 'line': s += amt if (tk['kTYPE'] == 'line' and tk['kPARA'] == k['kPARA'] and tk['kLINE'] == k['kLINE'] and tk['kAP'] == k['kAP']) else 0
      elif k['kTYPE'] == 'all': s += amt
      elif k['kTYPE'] == 'section': s += amt if tk['kAP'] == k['kAP'] else 0
      else:
        lv = max(i for i in range(1, 6) if k.get('kL%d' % i))
        s += amt if (tk['kAP'] == k['kAP'] and tk.get('kL%d' % lv) == k['kL%d' % lv]) else 0
    return s
  return f
wp = recalc(cp, 'partner'); no_errors(wp)
check_plan(wp[fyl(YEARS[0])], YEARS[0], partner_of(TY))
check_active(wp[fyl(ACTIVE) + ' (active)'], partner_of(TA))
w2 = wp[fyl(YEARS[0])]; c6b, c7b = cols_of(w2)
chk(abs(v(w2, 8, c7b['Partner total']) - 4.25e6) < .5, 'ALL partner total %s, want $4.25M' % v(w2, 8, c7b['Partner total']))

print('checked %d rows on four tabs; partner figures typed in $M on a line, a WBS header, an appropriation and the active tab' % n)
if fails:
  print('%d FAILING' % len(fails)); [print('  ' + f) for f in fails[:40]]; sys.exit(1)
print('ALL CHECKS PASSED')
