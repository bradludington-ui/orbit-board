# Item 133 mock-up: writes the Service share workbook from model.py (every figure INVENTED).
#   python3 -I xlsx.py <this folder> <out.xlsx>
# The Data tab is the one source: one row per figure, with a separate column for each measure. Every figure on every other
# tab is a SUMIFS over the Data tab, keyed by the row's own hidden keys (year, appropriation, WBS level, paragraph, line), so
# a total never depends on where a row sits: sorting, filtering or inserting rows cannot move one, and money with no WBS
# paragraph still reaches its appropriation and the ALL row. A partner figure is typed in $M on any line (yellow); a
# header adds every partner figure on its own row and beneath it, keyed the same way.
import sys; sys.path.insert(0, sys.argv[1])
from model import *
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter as CL
from openpyxl.worksheet.table import Table, TableStyleInfo
from openpyxl.worksheet.datavalidation import DataValidation

NAVY, BAND, GRID, GREY = '1F3864', '8DB4E2', 'A6A6A6', 'D9D9D9'
LVL = {1: 'C9D5EA', 2: 'DCE4F2', 3: 'EAF0F8', 4: 'F5F8FC', 5: 'FAFBFD'}
INPUT = 'FFF2CC'
MONEY = '$#,##0.0,,"M";[Red]($#,##0.0,,"M");"–"'
KMONEY = '$#,##0,"K";[Red]($#,##0,"K");"–"'
PCT = '0.0%;[Red]-0.0%;"–"'
NL = 5                                     # WBS levels carried as keys (the real ACE may need more)
thin = Side(style='thin', color=GRID)
BOX = Border(left=thin, right=thin, top=thin, bottom=thin)
def fill(c): return PatternFill('solid', start_color=c, end_color=c)
def F(**k): k.setdefault('name', 'Arial'); k.setdefault('size', 10); return Font(**k)
def fyl(fy): return 'FY%02d' % (fy % 100)

def wbs_label(w):
  if w == NONE: return 'No WBS paragraph yet'
  return w + '  ' + (WBS[w] if w in WBS else '(name not linked yet)')
def in_ace(w, est): return w != NONE and any(k == w or k.startswith(w + '.') for k in est)   # a line at it or beneath it
def key(w): return 'W|' + w          # a prefix, so Excel never reads a key such as 1.1 as a number (and 1.10 as the same)
def head(ws):                        # the marking on every printed page, beside the one on screen
  ws.oddHeader.center.text = MARK; ws.oddFooter.center.text = MARK

# ---------------------------------------------------------------- the Data tab: every figure once, one measure per column
DCOLS = ['FY', 'Year', 'Record', 'Appropriation', 'WBS paragraph', 'WBS name', 'In the ACE'] + ['WBS L%d' % i for i in range(1, NL + 1)] + \
  ['Requirement / CCaR record', 'Split across', 'CCaR record', 'Contract No.', 'Req id', 'Service', 'Service line', 'Board name',
   'Month', 'Requirement ($)', 'Funded ($)', 'CCaR plan ($)', 'Obligated ($)', 'Planned to obligate ($)', 'ACE estimate, US ($)',
   'Line key', 'PK'] + \
  ['K%d' % i for i in range(1, NL + 1)]
D = {n: CL(i + 1) for i, n in enumerate(DCOLS)}
def DR(n): return 'Data!$%s:$%s' % (D[n], D[n])

def akey(e): return e['ccar'] + '|' + e['title'] + '|' + e['contract']   # a CCaR row carries no ORBIT id (yet)

def data_rows():
  out = []
  def base(fy, yr, rec, ap, w, est):
    ch = chain(w) if w != NONE else [NONE]
    r = {'FY': fyl(fy), 'Year': yr, 'Record': rec, 'Appropriation': ap, 'WBS paragraph': w,
         'WBS name': WBS.get(w, '') if w != NONE else '', 'In the ACE': 'Yes' if in_ace(w, est) else 'No', 'PK': key(w)}
    for i in range(NL):
      r['WBS L%d' % (i + 1)] = wbs_label(ch[i]) if i < len(ch) else None
      r['K%d' % (i + 1)] = key(ch[i]) if i < len(ch) else None
    return r
  for ap in APPNS:
    for e in EVENTS[ap]:
      r = base(ACTIVE, 'Active', 'CCaR plan event', ap, e['wbs'], ACE_ACTIVE[ap])
      r.update({'Requirement / CCaR record': e['title'], 'Split across': ', '.join(e['split']) if e['split'] else None,
                'CCaR record': e['ccar'], 'Contract No.': e['contract'], 'Service': group_of(e['line']),
                'Service line': LINE_NAME[canon(e['line'])], 'Board name': e['line'], 'Month': month_date(e['month']),
                'CCaR plan ($)': e['amount'], 'Obligated ($)': e['amount'] if e['ob'] else None,
                'Planned to obligate ($)': None if e['ob'] else e['amount'], 'Line key': akey(e)})
      out.append(r)
    for w, d in ACE_ACTIVE[ap].items():
      for s, v in d.items():
        r = base(ACTIVE, 'Active', 'ACE line', ap, w, ACE_ACTIVE[ap])
        r.update({'Service': group_of(s), 'Service line': LINE_NAME[canon(s)], 'Board name': s, 'ACE estimate, US ($)': v})
        out.append(r)
    for fy in YEARS:
      yr = 'Budget year' if fy == YEARS[0] else 'Out-year'
      for x in PLAN[ap][fy]:
        for s in BOARD_LINES[ap]:
          if not (x['ask'][s] or x['fund'][s]): continue
          r = base(fy, yr, 'ORBIT plan', ap, x['wbs'], ACE[ap][fy])
          r.update({'Requirement / CCaR record': x['title'], 'Split across': ', '.join(x['split']) if x['split'] else None,
                    'CCaR record': x['ccar'], 'Contract No.': x['contract'], 'Req id': x['id'], 'Service': group_of(s),
                    'Service line': LINE_NAME[canon(s)], 'Board name': s, 'Requirement ($)': x['ask'][s] or None,
                    'Funded ($)': x['fund'][s] or None, 'Line key': x['id']})
          out.append(r)
      for w, d in ACE[ap][fy].items():
        for s, v in d.items():
          r = base(fy, yr, 'ACE line', ap, w, ACE[ap][fy])
          r.update({'Service': group_of(s), 'Service line': LINE_NAME[canon(s)], 'Board name': s, 'ACE estimate, US ($)': v})
          out.append(r)
  return out

def data_sheet(wb, rows):
  ws = wb.create_sheet('Data'); head(ws)
  ws.append([MARK]); ws['A1'].font = F(bold=True, color='C00000')
  ws.append(DCOLS)
  for r in rows: ws.append([r.get(n) for n in DCOLS])
  n = ws.max_row
  t = Table(displayName='ShareData', ref='A2:%s%d' % (CL(len(DCOLS)), n))
  t.tableStyleInfo = TableStyleInfo(name='TableStyleMedium2', showRowStripes=True); ws.add_table(t)
  for nm in ('Requirement ($)', 'Funded ($)', 'CCaR plan ($)', 'Obligated ($)', 'Planned to obligate ($)', 'ACE estimate, US ($)'):
    for r in range(3, n + 1): ws['%s%d' % (D[nm], r)].number_format = '$#,##0'
  for r in range(3, n + 1): ws['%s%d' % (D['Month'], r)].number_format = 'mmm yy'
  W = {'FY': 6, 'Year': 11, 'Record': 15, 'Appropriation': 13, 'WBS paragraph': 11, 'WBS name': 24, 'In the ACE': 8,
       'Requirement / CCaR record': 32, 'Split across': 16, 'Service line': 12, 'Contract No.': 16, 'Month': 9}
  for nm, c in D.items():
    ws.column_dimensions[c].width = W.get(nm, 24 if nm.startswith('WBS L') else 14)
  for i in range(1, NL + 1): ws.column_dimensions[D['K%d' % i]].hidden = True
  ws.column_dimensions[D['PK']].hidden = True
  ws.freeze_panes = 'A3'

# ---------------------------------------------------------------- the tree tabs
def tree_rows(fy, kind):
  """[(type, dict)] for one tab: ALL, then per appropriation a section, its WBS tree (headers with their lines), then
     'No WBS paragraph yet' and its lines. Paragraphs come from the lines AND the estimate (an ACE line nothing claims)."""
  out = [('all', {})]
  for ap in APPNS:
    if kind == 'plan': lines = [(x['wbs'], x['id'], x) for x in PLAN[ap][fy]]
    else:
      seen = {}
      for e in EVENTS[ap]: seen.setdefault((e['wbs'], akey(e)), e)
      lines = [(w, k, e) for (w, k), e in seen.items()]
    flag = ACE[ap][fy] if kind == 'plan' else ACE_ACTIVE[ap]
    est = flag if kind != 'month' else {}
    paras = set(w for w, _, _ in lines if w != NONE) | set(est)
    nodes = set(a for w in paras for a in chain(w))
    out.append(('section', {'ap': ap}))
    def walk(w):
      out.append(('head', {'ap': ap, 'code': w, 'inace': in_ace(w, flag)}))
      for (lw, k, x) in lines:
        if lw == w: out.append(('line', {'ap': ap, 'para': w, 'key': k, 'x': x}))
      for c in sorted([n for n in nodes if parent(n) == w], key=natkey): walk(c)
    for root in sorted([n for n in nodes if parent(n) is None], key=natkey): walk(root)
    nl = [(k, x) for (lw, k, x) in lines if lw == NONE]
    if nl:
      out.append(('head', {'ap': ap, 'code': NONE}))
      for k, x in nl: out.append(('line', {'ap': ap, 'para': NONE, 'key': k, 'x': x}))
  return out

def mcrit(m, col):                   # a month column's criterion: its own header date, or before / after the year
  if isinstance(m, tuple): return '"%s"&DATE(%d,%d,%d)' % (m[0], m[1].year, m[1].month, m[1].day)
  return '%s$7' % col

def tree_sheet(wb, name, fy, kind, title, sub, cols, groups, widths, first=8):
  """cols: [(header, spec)] spec: ('label'|'wbs'|'con'|'ccar') | ('m', measure, service or None, month or None)
     | ('f', fn(r, L) -> formula) | ('pt',) partner typed | ('ptot',) partner total."""
  ws = wb.create_sheet(name); head(ws)
  NV = len(cols)
  keys = ['kFY', 'kAP', 'kTYPE'] + ['kL%d' % i for i in range(1, NL + 1)] + ['kPARA', 'kLINE']
  K = {k: CL(NV + 1 + i) for i, k in enumerate(keys)}
  L = {}                                   # visible column letter by spec name
  for j, (h, spec) in enumerate(cols, start=1): L[h] = CL(j)
  for r, (txt, sz, b) in enumerate([(MARK, 10, True), (title, 16, True), (sub, 11, False)], start=1):
    ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=NV)
    c = ws.cell(r, 1, txt); c.font = F(size=sz, bold=b, color='C00000' if r == 1 else '000000'); c.alignment = Alignment(horizontal='center')
  ws.cell(4, 1, 'Figures in $M' if kind != 'month' else 'Figures in $K').font = F(size=9, italic=True)
  # headers
  for j in range(1, NV + 1):
    for rr in (6, 7):
      c = ws.cell(rr, j); c.fill = fill(NAVY); c.border = BOX; c.font = F(bold=True, color='FFFFFF')
      c.alignment = Alignment(horizontal='left' if j == 1 else 'center', vertical='center', wrap_text=True)
  for (a, b, t) in groups:
    if b > a: ws.merge_cells(start_row=6, start_column=a, end_row=6, end_column=b)
    ws.cell(6, a, t)
  for j, (h, spec) in enumerate(cols, start=1):
    dated = spec[0] == 'm' and spec[3] is not None and not isinstance(spec[3], tuple)
    ws.cell(7, j, spec[3] if dated else h)
    if dated: ws.cell(7, j).number_format = 'mmm yy'
    if (dated and spec[3] <= THROUGH) or (spec[0] == 'm' and isinstance(spec[3], tuple) and spec[3][0] == '<'):
      ws.cell(7, j).fill = fill('595959')
  ws.row_dimensions[7].height = 30
  for i, k in enumerate(keys): ws.cell(7, NV + 1 + i, k).font = F(size=8, color='808080')
  rows = tree_rows(fy, kind)
  dv = DataValidation(type='decimal', operator='greaterThanOrEqual', formula1='0', allow_blank=True, showInputMessage=True,
                      showErrorMessage=True, promptTitle='Partner total, $M',
                      prompt='Type this line\'s partner total in $M (2.5 = $2.5M). It adds into this line and every header above it.',
                      errorTitle='A partner total is a figure in $M', error='Type a number of $M, 0 or more (2.5 = $2.5M).')
  ws.add_data_validation(dv)
  r = first
  for (typ, d) in rows:
    ap, code = d.get('ap'), d.get('code')
    ch = chain(code) if code and code != NONE else ([NONE] if code == NONE else [])
    if typ == 'line': ch = chain(d['para']) if d['para'] != NONE else [NONE]
    kv = {'kFY': fyl(fy), 'kAP': ap, 'kTYPE': typ}
    for i in range(NL): kv['kL%d' % (i + 1)] = key(ch[i]) if i < len(ch) else None
    if typ == 'line': kv['kPARA'], kv['kLINE'] = key(d['para']), d['key']
    for k, v in kv.items(): ws['%s%d' % (K[k], r)] = v
    lv = len(ch)
    # the SUMIFS criteria this row stands for
    crit = [(D['FY'], '$%s%d' % (K['kFY'], r))]
    if typ != 'all': crit.append((D['Appropriation'], '$%s%d' % (K['kAP'], r)))
    if typ == 'head': crit.append((D['K%d' % lv], '$%s%d' % (K['kL%d' % lv], r)))
    if typ == 'line': crit += [(D['PK'], '$%s%d' % (K['kPARA'], r)), (D['Line key'], '$%s%d' % (K['kLINE'], r))]
    pk = [(K['kFY'], '$%s%d' % (K['kFY'], r))]
    if typ != 'all': pk.append((K['kAP'], '$%s%d' % (K['kAP'], r)))
    if typ == 'head': pk.append((K['kL%d' % lv], '$%s%d' % (K['kL%d' % lv], r)))
    for j, (h, spec) in enumerate(cols, start=1):
      c = ws.cell(r, j); col = CL(j)
      if spec[0] == 'label':
        c.value = {'all': ' + '.join(a.upper() for a in APPNS), 'section': (ap or '').upper(),
                   'head': (wbs_label(code) + ('  (not in the ACE)' if code != NONE and not d.get('inace', True) else ''))
                   if code else ''}.get(typ)
        if typ == 'line':
          x = d['x']; c.value = x['title'] + ((' (part: ' + ' and '.join(x['split']) + ')') if x.get('split') else '')
        c.alignment = Alignment(indent=(lv if typ == 'line' else max(lv - 1, 0)))
      elif spec[0] == 'wbs': c.value = (code if typ == 'head' else d['para'] if typ == 'line' else None)
      elif spec[0] == 'con' and typ == 'line': c.value = d['x']['contract']
      elif spec[0] == 'ccar' and typ == 'line': c.value = d['x']['ccar']
      elif spec[0] == 'm':
        if typ == 'line' and spec[1] == 'ACE estimate, US ($)': continue
        cr = list(crit)
        if spec[2]: cr.append((D['Service'], '"%s"' % spec[2]))
        if spec[3] is not None: cr.append((D['Month'], mcrit(spec[3], col)))
        c.value = '=SUMIFS(%s,%s)' % (DR(spec[1]), ','.join('Data!$%s:$%s,%s' % (a, a, b) for a, b in cr))
      elif spec[0] == 'f': c.value = spec[1](r, L)
      elif spec[0] == 'pt':
        c.fill = fill(INPUT); c.number_format = '0.0'; dv.add('%s%d' % (col, r))
      elif spec[0] == 'ptot':
        p = L[[h2 for h2, s2 in cols if s2[0] == 'pt'][0]]
        c.value = ('=%s%d*1000000' % (p, r)) if typ == 'line' else \
          '=SUMIFS($%s:$%s,%s)*1000000' % (p, p, ','.join('$%s:$%s,%s' % (a, a, b) for a, b in pk))
      c.border = BOX
    # dress
    if typ in ('all', 'section'):
      for j in range(1, NV + 1):
        cc = ws.cell(r, j)
        if cols[j - 1][1][0] != 'pt': cc.fill = fill(NAVY if typ == 'all' else BAND)
        cc.font = F(bold=True, color='FFFFFF' if typ == 'all' and cols[j - 1][1][0] != 'pt' else NAVY)
    elif typ == 'head':
      for j in range(1, NV + 1):
        cc = ws.cell(r, j)
        if cols[j - 1][1][0] != 'pt': cc.fill = fill(LVL.get(lv, 'FFFFFF'))
        cc.font = F(bold=True, color='C00000' if (not d.get('inace', True) and code != NONE and j == 1) else '000000')
    ws.row_dimensions[r].outlineLevel = 0 if typ in ('all', 'section') else min(lv if typ == 'head' else lv + 1, 7)
    r += 1
    if typ == 'all' and kind == 'month':                     # of which obligated / planned to obligate, by month
      for lbl, meas in (('of which obligated', 'Obligated ($)'), ('of which planned to obligate', 'Planned to obligate ($)')):
        ws.cell(r, 1, lbl).alignment = Alignment(indent=1)
        for j, (h, spec) in enumerate(cols, start=1):
          if spec[0] == 'm':
            ws.cell(r, j, '=SUMIFS(%s,Data!$%s:$%s,%s,Data!$%s:$%s,%s)' % (DR(meas), D['FY'], D['FY'], '"%s"' % fyl(fy), D['Month'], D['Month'], mcrit(spec[3], CL(j))))
          elif spec[0] == 'f': ws.cell(r, j, spec[1](r, L))
          ws.cell(r, j).border = BOX; ws.cell(r, j).font = F(italic=True)
        r += 1
  last = r - 1
  ws.cell(r + 1, 1, MARK).font = F(size=9, bold=True, color='C00000')
  for j, (h, spec) in enumerate(cols, start=1):
    fmt_ = {'m': KMONEY if kind == 'month' else MONEY, 'ptot': MONEY, 'pt': '0.0'}.get(spec[0])
    if spec[0] == 'f': fmt_ = PCT if h.startswith('%') or 'share' in h.lower() or spec[2:] == ('pct',) else (KMONEY if kind == 'month' else MONEY)
    for rr in range(first, last + 1):
      if fmt_: ws.cell(rr, j).number_format = fmt_
      if j > 1: ws.cell(rr, j).alignment = Alignment(horizontal='right' if spec[0] not in ('wbs', 'con', 'ccar') else 'left')
  for j, w in enumerate(widths, start=1): ws.column_dimensions[CL(j)].width = w
  for k in keys: ws.column_dimensions[K[k]].hidden = True
  ws.sheet_properties.outlinePr.summaryBelow = False
  ws.freeze_panes = 'B8'; ws.print_title_rows = '6:7'
  ws.page_setup.orientation = 'landscape'; ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0
  ws.sheet_properties.pageSetUpPr.fitToPage = True
  ws.print_area = 'A1:%s%d' % (CL(NV), r + 1)
  return ws

def share(num, tot): return lambda r, L: '=IF(%s%d=0,"",(%s)/%s%d)' % (L[tot], r, '+'.join('%s%d' % (L[n], r) for n in num), L[tot], r)
def add(*ns): return lambda r, L: '=' + '+'.join('%s%d' % (L[n], r) for n in ns)

def plan_sheet(wb, fy):
  cols = [('WBS / requirement', ('label',)), ('WBS', ('wbs',)), ('Contract No.', ('con',)), ('CCaR record', ('ccar',)),
          ('US requirement', ('m', 'Requirement ($)', None, None)),
          ('Air Force', ('m', 'Funded ($)', 'Air Force', None)), ('Marine Corps', ('m', 'Funded ($)', 'Marine Corps', None)),
          ('Navy', ('m', 'Funded ($)', 'Navy', None)),
          ('US funded', ('f', add('Air Force', 'Marine Corps', 'Navy'))),
          ('US unfunded', ('f', lambda r, L: '=%s%d-%s%d' % (L['US requirement'], r, L['US funded'], r))),
          ('Partner, type $M', ('pt',)), ('Partner total', ('ptot',)),
          ('Total funded with partners', ('f', lambda r, L: '=%s%d+%s%d' % (L['US funded'], r, L['Partner total'], r))),
          ('% Air Force', ('f', share(['Air Force'], 'Total funded with partners'), 'pct')),
          ('% Marine Corps', ('f', share(['Marine Corps'], 'Total funded with partners'), 'pct')),
          ('% Navy', ('f', share(['Navy'], 'Total funded with partners'), 'pct')),
          ('% Partners', ('f', share(['Partner total'], 'Total funded with partners'), 'pct')),
          ('ACE estimate (US)', ('m', 'ACE estimate, US ($)', None, None))]
  tree_sheet(wb, fyl(fy), fy, 'plan', 'F-35 Sustainment: Service Share by WBS',
             '%s%s  ·  funded (plan): what ORBIT funds, one line per ORBIT requirement  ·  ACE: %s  ·  MOCK-UP, every figure invented'
             % (fyl(fy), ' budget year' if fy == YEARS[0] else ' out-year', ACE_SET),
             cols, [(5, 5, 'Requirement'), (6, 8, 'Funded, by Service'), (9, 10, 'US'), (11, 12, 'Partners'),
                    (13, 13, 'Total'), (14, 17, 'Share of total funded'), (18, 18, 'ACE')],
             [44, 10, 16, 11, 12, 11, 12, 11, 11, 11, 9, 11, 12, 9, 9, 9, 9, 12])

def active_sheet(wb):
  g = [('Air Force', 'AF'), ('Marine Corps', 'MC'), ('Navy', 'NV'), ('Service not identified', 'NI')]
  cols = [('WBS / CCaR record', ('label',)), ('WBS', ('wbs',)), ('Contract No.', ('con',)), ('CCaR record', ('ccar',))]
  for full, s in g:
    cols += [(s + ' obligated', ('m', 'Obligated ($)', full, None)), (s + ' planned', ('m', 'Planned to obligate ($)', full, None))]
  cols += [('US obligated', ('f', add('AF obligated', 'MC obligated', 'NV obligated', 'NI obligated'))),
           ('US planned', ('f', add('AF planned', 'MC planned', 'NV planned', 'NI planned'))),
           ('US total', ('f', add('US obligated', 'US planned'))),
           ('Partner, type $M', ('pt',)), ('Partner total', ('ptot',)),
           ('Total with partners', ('f', add('US total', 'Partner total'))),
           ('% Air Force', ('f', share(['AF obligated', 'AF planned'], 'Total with partners'), 'pct')),
           ('% Marine Corps', ('f', share(['MC obligated', 'MC planned'], 'Total with partners'), 'pct')),
           ('% Navy', ('f', share(['NV obligated', 'NV planned'], 'Total with partners'), 'pct')),
           ('% Not identified', ('f', share(['NI obligated', 'NI planned'], 'Total with partners'), 'pct')),
           ('% Partners', ('f', share(['Partner total'], 'Total with partners'), 'pct')),
           ('ACE estimate (US)', ('m', 'ACE estimate, US ($)', None, None))]
  ws = tree_sheet(wb, fyl(ACTIVE) + ' (active)', ACTIVE, 'active', 'F-35 Sustainment: Service Share by WBS',
                  '%s active year  ·  CCaR: obligated and planned to obligate, one line per CCaR record, from the pull through %s'
                  '  ·  ACE: %s  ·  MOCK-UP, every figure invented' % (fyl(ACTIVE), THROUGH.strftime('%d %b %Y'), ACE_SET), cols,
                  [(5, 6, 'Air Force'), (7, 8, 'Marine Corps'), (9, 10, 'Navy'), (11, 12, 'Service not identified'),
                   (13, 15, 'US'), (16, 17, 'Partners'), (18, 18, 'Total'), (19, 23, 'Share of obligated + planned'), (24, 24, 'ACE')],
                  [40, 10, 16, 11] + [10] * 11 + [9, 11, 12, 9, 9, 9, 10, 9, 12])
  for j, t in [(5, 'Obligated'), (6, 'Planned'), (7, 'Obligated'), (8, 'Planned'), (9, 'Obligated'), (10, 'Planned'),
               (11, 'Obligated'), (12, 'Planned'), (13, 'Obligated'), (14, 'Planned'), (15, 'Total')]: ws.cell(7, j, t)

def month_sheet(wb):
  cols = [('WBS / CCaR record', ('label',)), ('WBS', ('wbs',)), ('Contract No.', ('con',)),
          ('Before ' + MONTHS[0].strftime('%b %y'), ('m', 'CCaR plan ($)', None, ('<', MONTHS[0])))]
  for m in MONTHS: cols.append((m.strftime('%b %y'), ('m', 'CCaR plan ($)', None, m)))
  cols.append(('After ' + MONTHS[-1].strftime('%b %y'), ('m', 'CCaR plan ($)', None, ('>', MONTHS[-1]))))
  first, last = cols[3][0], cols[-1][0]
  cols.append(('Total', ('f', lambda r, L: '=SUM(%s%d:%s%d)' % (L[first], r, L[last], r))))
  past = sum(1 for m in MONTHS if m <= THROUGH)
  tree_sheet(wb, fyl(ACTIVE) + ' by month', ACTIVE, 'month', 'F-35 Sustainment: the active year by month (US, all Services)',
             '%s  ·  each CCaR plan event in the month it is dated, obligated or not (procurement can run past September)  ·  '
             'CCaR pull through %s  ·  MOCK-UP, invented' % (fyl(ACTIVE), THROUGH.strftime('%d %b %Y')), cols,
             [(4, 4, 'Earlier'), (5, 4 + past, 'Past months'), (5 + past, 16, 'Coming months'), (17, 17, 'Later'), (18, 18, '')],
             [40, 10, 16, 10] + [9] * 12 + [10, 11])

def read_sheet(wb):
  ws = wb.create_sheet('How to read', 0); head(ws)
  lines = [
    (MARK, 'mark'), ('F-35 Sustainment: Service Share by WBS  ·  MOCK-UP', 'title'),
    ('Every figure, name, CCaR number and contract number in this workbook is invented. Nothing came from a board.', 'warn'),
    ('', ''), ('What each tab is', 'h'),
    ('%s (active): the year in execution, from the CCaR pull. Obligated and planned to obligate, by Service, for each CCaR '
     'record, title and contract, under the WBS paragraph its plan events carry.' % fyl(ACTIVE), ''),
    ('%s by month: each CCaR plan event in the month it is dated, obligated or not; the rows under the top line say how much '
     'of each month is obligated. Grey months are past (to %s). Earlier and Later hold plan events dated outside the fiscal '
     'year (procurement obligates for about three years).' % (fyl(ACTIVE), THROUGH.strftime('%d %b %Y')), ''),
    ('%s onward: what ORBIT funds (the plan), by Service, for each ORBIT requirement, under its WBS paragraph.' % fyl(YEARS[0]), ''),
    ('Data: every figure in this workbook, one row each, with a column per measure: Requirement and Funded (ORBIT), CCaR '
     'plan, Obligated and Planned to obligate (CCaR), ACE estimate. Insert > PivotTable on it; never add two measure columns '
     'together.', ''),
    ('The active year and the years after it come from two systems: %s lines are CCaR records, %s lines are ORBIT '
     'requirements, and they do not line up row by row. Compare years by WBS paragraph and Service, not by line.'
     % (fyl(ACTIVE), fyl(YEARS[0])), ''),
    ('', ''), ('How the figures work', 'h'),
    ('Every figure is worked out from the Data tab. Change a figure there and every tab follows; a figure typed over on '
     'another tab is not added into anything.', ''),
    ('A WBS header adds every line beneath it: 1.2.2.1 and 1.2.2.3 add into 1.2.2, then 1.2, then 1. A letter-suffixed '
     'paragraph (1.1.1.1E) sits beside 1.1.1.1, not under it. Totals do not depend on where a row sits, so sorting, '
     'filtering or collapsing (+/−) never changes one.', ''),
    ('Share, plan years: each Service ÷ the line\'s total funded with partners. Share, active year: each Service\'s '
     'obligated + planned ÷ the line\'s total with partners. The shares on a line add to 100%.', ''),
    ('Partner box (yellow): type the partner total in $M (2.5 = $2.5M). It adds into that line and every header above it, '
     'and the line\'s percentages change straight away. A header\'s own box is for partner money not already typed on a '
     'line beneath it. A requirement on two paragraphs appears under each: split its partner figure across its rows. ORBIT '
     'does not keep these figures; they live in this workbook.', ''),
    ('Air Force = USAF + ANG + AFRC. Marine Corps = USMC STOVL (Full Fund\'s USMC-B) + USMC CV. Navy = USN CV. A CCaR row '
     'whose budget name names no Service is under "Service not identified", in every total. The Data tab keeps all six '
     'lines, and the board\'s own name beside each.', ''),
    ('WBS names come from the ACE workbook once linked; a paragraph with no name linked shows its number (1.3.1 here). A '
     'paragraph the estimate holds no line for is flagged red, "(not in the ACE)" (1.4 here). Money with no paragraph yet '
     'sits under "No WBS paragraph yet" in its appropriation, and is in every total above it.', ''),
    ('ACE estimate (US): the %s cost estimate, US services only, for the paragraph and everything beneath it, including lines '
     'no requirement claims (1.1.1.3 here). A requirement line has none of its own.' % ACE_SET, ''),
    ('The top line names the appropriations it covers: OPN is not in this mock-up until it is decided.', ''),
    ('', ''), ('Still to decide', 'h'),
    ('The WBS names\' tab and column in the ACE. The CCaR columns for the contract number and the WBS paragraph on each plan '
     'event. ORBIT\'s requirement id coming back from CCaR. OPN. Whether earlier years\' procurement money obligating this '
     'year belongs on the active-year tab. The dissemination marking, to confirm with security.', ''),
    ('', ''), (MARK, 'mark'),
  ]
  for i, (t, k) in enumerate(lines, start=1):
    c = ws.cell(i, 1, t)
    c.font = {'mark': F(bold=True, color='C00000'), 'title': F(size=16, bold=True), 'warn': F(bold=True, color='C00000'),
              'h': F(size=12, bold=True, color=NAVY)}.get(k, F())
    c.alignment = Alignment(wrap_text=True, vertical='top')
  ws.column_dimensions['A'].width = 130
  ws.page_setup.orientation = 'landscape'; ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0
  ws.sheet_properties.pageSetUpPr.fitToPage = True

wb = Workbook(); wb.remove(wb.active)
active_sheet(wb); month_sheet(wb)
for fy in YEARS: plan_sheet(wb, fy)
data_sheet(wb, data_rows()); read_sheet(wb)
wb.active = 0
wb.calculation.fullCalcOnLoad = True
wb.save(sys.argv[2])
print('wrote', sys.argv[2])
