# Item 133 mock-up: writes the Service share workbook from model.py (every figure INVENTED).
#   python3 -I xlsx.py <this folder> <out.xlsx>
# Totals are live Excel formulas: a WBS header is SUBTOTAL(9, ...) over the rows beneath it, which ignores the SUBTOTALs
# nested inside, so each dollar is counted once at every level; a partner figure typed on ANY line (yellow) is added into
# that line's partner total and every header above it, and the line's percentages move with it.
import sys; sys.path.insert(0, sys.argv[1])
from model import *
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter as CL
from openpyxl.worksheet.table import Table, TableStyleInfo

NAVY, BAND, GRID = '1F3864', '8DB4E2', 'A6A6A6'
LVL = {1: 'C9D5EA', 2: 'DCE4F2', 3: 'EAF0F8', 4: 'F5F8FC'}
INPUT = 'FFF2CC'
MONEY = '$#,##0.0,,;[Red]($#,##0.0,,);"–"'
PCT = '0.0%;[Red]-0.0%;"–"'
thin = Side(style='thin', color=GRID)
BOX = Border(left=thin, right=thin, top=thin, bottom=thin)
def fill(c): return PatternFill('solid', start_color=c, end_color=c)
def F(**k): k.setdefault('name', 'Arial'); k.setdefault('size', 10); return Font(**k)

def furniture(ws, ncol, title, sub, partner=True):
  for r, (txt, sz, b) in enumerate([(MARK, 10, True), (title, 16, True), (sub, 11, False)], start=1):
    ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=ncol)
    c = ws.cell(r, 1, txt); c.font = F(size=sz, bold=b, color='C00000' if r == 1 else '000000')
    c.alignment = Alignment(horizontal='center')
  ws.cell(4, 1, '(TY$M)' + ('  ·  yellow cells: type a partner total' if partner else '')).font = F(size=9, italic=True)
  ws.page_setup.orientation = 'landscape'; ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0
  ws.sheet_properties.pageSetUpPr.fitToPage = True

def heads(ws, r, groups, cols):
  # groups: [(first col, last col, text)] on row r; cols: header text per column on row r+1
  for j, t in enumerate(cols, start=1):
    c = ws.cell(r + 1, j, t); c.font = F(bold=True, color='FFFFFF'); c.fill = fill(NAVY); c.border = BOX
    c.alignment = Alignment(horizontal='left' if j == 1 else 'center', vertical='center', wrap_text=True)
    g = ws.cell(r, j); g.fill = fill(NAVY); g.border = BOX
  for (a, b, t) in groups:
    if b > a: ws.merge_cells(start_row=r, start_column=a, end_row=r, end_column=b)
    c = ws.cell(r, a, t); c.font = F(bold=True, color='FFFFFF'); c.alignment = Alignment(horizontal='center')
  ws.row_dimensions[r + 1].height = 28

def tree(ap, items):
  # [('wbs', code) | ('item', obj)] in WBS order, pruned to paragraphs that hold something
  holds = {}
  for it in items:
    w = it['wbs']
    while w: holds[w] = True; w = parent(w)
  out = []
  def walk(w):
    if w not in holds: return
    out.append(('wbs', w))
    for it in [i for i in items if i['wbs'] == w]: out.append(('item', it))
    for k in kids(w): walk(k)
  for top in [w for w in WBS if parent(w) is None]: walk(top)
  return out

def block_end(rows, i, base):
  # last row index (sheet row) of the block that row i heads
  k = rows[i]
  if k[0] != 'wbs': return base + i
  j = i + 1
  while j < len(rows):
    if rows[j][0] == 'wbs' and not (rows[j][1] + '.').startswith(k[1] + '.'): break
    j += 1
  return base + j - 1

def write_tree(ws, start, ap, items, money, formulas, partner, ace, inputs_col):
  """money: {col: fn(item)->$} summed by SUBTOTAL at headers; formulas: {col: fn(r)->'=...'} on every row;
     partner: (typed col, total col); ace: (col, {paragraph: $}) or None. Returns (first row, last row)."""
  rows = tree(ap, items)
  leafs = set(w for (k, w) in [(x[0], x[1] if x[0] == 'wbs' else x[1]['wbs']) for x in rows] if k == 'item')
  for i, (kind, x) in enumerate(rows):
    r = start + i
    if kind == 'wbs':
      e = block_end(rows, i, start); lv = level(x)
      c = ws.cell(r, 1, label(x)); c.font = F(bold=True); c.alignment = Alignment(indent=lv - 1)
      for col in money: ws.cell(r, col, '=SUBTOTAL(9,%s%d:%s%d)' % (CL(col), r + 1, CL(col), e))
      ws.cell(r, partner[1], '=SUM(%s%d:%s%d)' % (CL(partner[0]), r, CL(partner[0]), e))
      if ace:
        col, A = ace
        ws.cell(r, col, A.get(x, 0) if x in leafs else '=SUBTOTAL(9,%s%d:%s%d)' % (CL(col), r + 1, CL(col), e))
      for j in range(1, inputs_col + 1):
        ws.cell(r, j).fill = fill(LVL.get(lv, 'FFFFFF')); ws.cell(r, j).font = F(bold=True)
    else:
      c = ws.cell(r, 1, x['title']); c.alignment = Alignment(indent=level(x['wbs']))
      ws.cell(r, 2, x['contract']); ws.cell(r, 3, x['ccar'])
      for col, fn in money.items(): ws.cell(r, col, fn(x))
      ws.cell(r, partner[1], '=%s%d' % (CL(partner[0]), r))
    for col, fn in formulas.items(): ws.cell(r, col, fn(r))
    p = ws.cell(r, partner[0]); p.fill = fill(INPUT); p.border = BOX
    for j in range(1, inputs_col + 1):
      ws.cell(r, j).border = BOX
  return start, start + len(rows) - 1

def section(ws, r, text, first, last, money, formulas, partner, ace_col, ncol):
  ws.cell(r, 1, text).font = F(bold=True, color=NAVY)
  for col in money + ([ace_col] if ace_col else []): ws.cell(r, col, '=SUBTOTAL(9,%s%d:%s%d)' % (CL(col), first, CL(col), last))
  ws.cell(r, partner[1], '=SUM(%s%d:%s%d)' % (CL(partner[0]), r, CL(partner[0]), last))
  for col, fn in formulas.items(): ws.cell(r, col, fn(r))
  for j in range(1, ncol + 1):
    c = ws.cell(r, j); c.fill = fill(BAND); c.border = BOX; c.font = F(bold=True, color=NAVY)
  p = ws.cell(r, partner[0]); p.fill = fill(INPUT)

def fmt(ws, first, last, money_cols, pct_cols, ncol, widths):
  for r in range(first, last + 1):
    for j in money_cols: ws.cell(r, j).number_format = MONEY; ws.cell(r, j).alignment = Alignment(horizontal='right')
    for j in pct_cols: ws.cell(r, j).number_format = PCT; ws.cell(r, j).alignment = Alignment(horizontal='right')
  for j, w in enumerate(widths, start=1): ws.column_dimensions[CL(j)].width = w

def grp_sum(d, names): return sum(d.get(s, 0) for s in names)

# ---------------------------------------------------------------- a plan year (budget year onward): ORBIT funded
def plan_sheet(wb, fy):
  ws = wb.create_sheet('FY%02d' % (fy % 100)); N = 17
  furniture(ws, N, 'F-35 Sustainment: Service Share by WBS',
            'FY%02d%s  ·  planned: what ORBIT funds  ·  MOCK-UP, every figure invented' % (fy % 100, ' (budget year)' if fy == YEARS[0] else ''))
  heads(ws, 6, [(4, 4, 'Requirement'), (5, 7, 'Funded, by Service'), (8, 9, 'US'), (10, 11, 'Partners'),
                (12, 12, 'Total funded'), (13, 16, 'Share of total funded'), (17, 17, 'ACE')],
        ['WBS / requirement', 'Contract No.', 'CCaR record', 'US requirement', 'Air Force', 'Marine Corps', 'Navy',
         'US funded', 'US unfunded', 'Type here', 'Partner total', 'with partners', 'Air Force', 'Marine Corps', 'Navy',
         'Partners', 'ACE estimate'])
  money = {4: lambda x: sum(x['ask'].values())}
  for k, (g, names) in enumerate(GROUPS): money[5 + k] = (lambda nm: lambda x: grp_sum(x['fund'], nm))(names)
  formulas = {8: lambda r: '=E%d+F%d+G%d' % (r, r, r), 9: lambda r: '=D%d-H%d' % (r, r), 12: lambda r: '=H%d+K%d' % (r, r),
              13: lambda r: '=IF(L%d=0,"",E%d/L%d)' % (r, r, r), 14: lambda r: '=IF(L%d=0,"",F%d/L%d)' % (r, r, r),
              15: lambda r: '=IF(L%d=0,"",G%d/L%d)' % (r, r, r), 16: lambda r: '=IF(L%d=0,"",K%d/L%d)' % (r, r, r)}
  r = 9; spans = []
  for ap in APPNS:
    sec = r; r += 1
    a, b = write_tree(ws, r, ap, PLAN[ap][fy], money, formulas, (10, 11), (17, ACE[ap][fy]), N)
    section(ws, sec, ap.upper(), a, b, list(money), formulas, (10, 11), 17, N); spans.append((sec, b)); r = b + 2
  section(ws, 8, 'ALL APPROPRIATIONS', 9, r - 2, list(money), formulas, (10, 11), 17, N)
  for j in range(1, N + 1): ws.cell(8, j).fill = fill(NAVY); ws.cell(8, j).font = F(bold=True, color='FFFFFF')
  ws.cell(8, 10).fill = fill(INPUT); ws.cell(8, 10).font = F(bold=True)
  ws.cell(r, 1, 'Share of total funded = each Service ÷ (US funded + partner total) on that line. A WBS header adds every '
               'line beneath it, partner figures included. ' + MARK).font = F(size=9, italic=True)
  fmt(ws, 8, r - 1, [4, 5, 6, 7, 8, 9, 10, 11, 12, 17], [13, 14, 15, 16], N,
      [46, 16, 11, 12, 11, 12, 11, 11, 11, 10, 10, 11, 9, 9, 9, 9, 11])
  ws.freeze_panes = 'B8'; ws.print_title_rows = '6:7'

# ---------------------------------------------------------------- the active year: CCaR actuals and planned
def active_items(ap):
  agg = {}
  for e in EVENTS[ap]:
    k = (e['wbs'], e['ccar'])
    it = agg.setdefault(k, {'title': e['title'], 'ccar': e['ccar'], 'contract': e['contract'], 'wbs': e['wbs'],
                             'ob': {}, 'pl': {}, 'mo': [0] * 12})
    side = it['ob'] if e['ob'] else it['pl']; side[e['line']] = side.get(e['line'], 0) + e['amount']
    it['mo'][e['month']] += e['amount']
  return list(agg.values())

def active_sheet(wb):
  ws = wb.create_sheet('FY%02d (active)' % (ACTIVE % 100)); N = 20
  furniture(ws, N, 'F-35 Sustainment: Service Share by WBS',
            'FY%02d active year  ·  actuals and planned, from the CCaR pull through %s  ·  MOCK-UP, every figure invented'
            % (ACTIVE % 100, THROUGH))
  heads(ws, 6, [(4, 5, 'Air Force'), (6, 7, 'Marine Corps'), (8, 9, 'Navy'), (10, 12, 'US'), (13, 14, 'Partners'),
                (15, 15, 'Total'), (16, 19, 'Share of total (obligated + planned)'), (20, 20, 'ACE')],
        ['WBS / CCaR record', 'Contract No.', 'CCaR record', 'Obligated', 'Planned', 'Obligated', 'Planned', 'Obligated',
         'Planned', 'Obligated', 'Planned', 'Total', 'Type here', 'Partner total', 'with partners', 'Air Force',
         'Marine Corps', 'Navy', 'Partners', 'ACE estimate'])
  money = {}
  for k, (g, names) in enumerate(GROUPS):
    money[4 + 2 * k] = (lambda nm: lambda x: grp_sum(x['ob'], nm))(names)
    money[5 + 2 * k] = (lambda nm: lambda x: grp_sum(x['pl'], nm))(names)
  formulas = {10: lambda r: '=D%d+F%d+H%d' % (r, r, r), 11: lambda r: '=E%d+G%d+I%d' % (r, r, r),
              12: lambda r: '=J%d+K%d' % (r, r), 15: lambda r: '=L%d+N%d' % (r, r),
              16: lambda r: '=IF(O%d=0,"",(D%d+E%d)/O%d)' % (r, r, r, r), 17: lambda r: '=IF(O%d=0,"",(F%d+G%d)/O%d)' % (r, r, r, r),
              18: lambda r: '=IF(O%d=0,"",(H%d+I%d)/O%d)' % (r, r, r, r), 19: lambda r: '=IF(O%d=0,"",N%d/O%d)' % (r, r, r)}
  r = 9
  for ap in APPNS:
    sec = r; r += 1
    a, b = write_tree(ws, r, ap, active_items(ap), money, formulas, (13, 14), (20, ACE_ACTIVE[ap]), N)
    section(ws, sec, ap.upper(), a, b, list(money), formulas, (13, 14), 20, N); r = b + 2
  section(ws, 8, 'ALL APPROPRIATIONS', 9, r - 2, list(money), formulas, (13, 14), 20, N)
  for j in range(1, N + 1): ws.cell(8, j).fill = fill(NAVY); ws.cell(8, j).font = F(bold=True, color='FFFFFF')
  ws.cell(8, 13).fill = fill(INPUT); ws.cell(8, 13).font = F(bold=True)
  ws.cell(r, 1, 'Obligated: plan events CCaR shows allocated. Planned: plan events not yet allocated. Each row is one CCaR '
               'record, placed by the WBS paragraph on its plan events. ' + MARK).font = F(size=9, italic=True)
  fmt(ws, 8, r - 1, list(range(4, 16)) + [20], [16, 17, 18, 19], N,
      [40, 16, 11, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 11, 9, 9, 9, 9, 11])
  ws.freeze_panes = 'B8'; ws.print_title_rows = '6:7'

def month_sheet(wb):
  ws = wb.create_sheet('FY%02d by month' % (ACTIVE % 100)); N = 15
  furniture(ws, N, 'F-35 Sustainment: the active year by month (US, all Services)',
            'FY%02d  ·  grey: actual months, obligated  ·  white: planned  ·  CCaR pull through %s  ·  MOCK-UP, invented'
            % (ACTIVE % 100, THROUGH), partner=False)
  cy = ACTIVE - 1
  cols = ['WBS / CCaR record', 'Contract No.'] + ['%s %02d' % (m, (cy if i < 3 else ACTIVE) % 100) for i, m in enumerate(MONTHS)] + ['Total']
  heads(ws, 6, [(3, 3 + ACT_MONTHS - 1, 'Actual'), (3 + ACT_MONTHS, 14, 'Planned')], cols)
  money = {3 + m: (lambda m: lambda x: x['mo'][m])(m) for m in range(12)}
  formulas = {15: lambda r: '=SUM(C%d:N%d)' % (r, r)}
  r = 9
  for ap in APPNS:
    sec = r; r += 1
    a, b = write_tree(ws, r, ap, active_items(ap), money, formulas, (16, 17), None, N)
    for rr in range(a, b + 1):                     # no partner columns on this tab
      for cc in (16, 17): ws.cell(rr, cc).value = None; ws.cell(rr, cc).fill = PatternFill(); ws.cell(rr, cc).border = Border()
    section(ws, sec, ap.upper(), a, b, list(money), formulas, (16, 17), None, N)
    for cc in (16, 17): ws.cell(sec, cc).value = None; ws.cell(sec, cc).fill = PatternFill(); ws.cell(sec, cc).border = Border()
    r = b + 2
  section(ws, 8, 'ALL APPROPRIATIONS', 9, r - 2, list(money), formulas, (16, 17), None, N)
  for cc in (16, 17): ws.cell(8, cc).value = None; ws.cell(8, cc).fill = PatternFill(); ws.cell(8, cc).border = Border()
  for j in range(1, N + 1): ws.cell(8, j).fill = fill(NAVY); ws.cell(8, j).font = F(bold=True, color='FFFFFF')
  for rr in range(9, r - 1):
    for m in range(ACT_MONTHS):
      c = ws.cell(rr, 3 + m)
      if not (c.fill and c.fill.fgColor and c.fill.fgColor.rgb not in (None, '00000000')): c.fill = fill('EDEDED')
  ws.cell(r, 1, MARK).font = F(size=9, italic=True)
  fmt(ws, 8, r - 1, list(range(3, 16)), [], N, [40, 16] + [9] * 12 + [10])
  ws.freeze_panes = 'C8'; ws.print_title_rows = '6:7'

# ---------------------------------------------------------------- one flat table, for pivots and charts
def data_sheet(wb):
  ws = wb.create_sheet('Data')
  H = ['FY', 'Year', 'Status', 'Appropriation', 'WBS L1', 'WBS L2', 'WBS L3', 'WBS L4', 'WBS paragraph', 'WBS name',
       'Requirement / CCaR record', 'CCaR record', 'Contract No.', 'Service', 'Service line', 'Month', 'Amount ($)']
  ws.append(H)
  svc_of = {s: g for g, names in GROUPS for s in names}
  def lv(w): p = w.split('.'); return ['.'.join(p[:i]) if i <= len(p) else '' for i in range(1, 5)]
  for ap in APPNS:
    for e in EVENTS[ap]:
      ws.append(['FY%02d' % (ACTIVE % 100), 'Active', 'Obligated' if e['ob'] else 'Planned', ap] + lv(e['wbs'])
                + [e['wbs'], WBS[e['wbs']] or '', e['title'], e['ccar'], e['contract'], svc_of[e['line']],
                   LINE_NAME[e['line']], MONTHS[e['month']], e['amount']])
    for fy in YEARS:
      for x in PLAN[ap][fy]:
        for st, key in (('Requirement', 'ask'), ('Funded', 'fund')):
          for s in LINES:
            if x[key][s]:
              ws.append(['FY%02d' % (fy % 100), 'Budget year' if fy == YEARS[0] else 'Out-year', st, ap] + lv(x['wbs'])
                        + [x['wbs'], WBS[x['wbs']] or '', x['title'], x['ccar'], x['contract'], svc_of[s], LINE_NAME[s], '', x[key][s]])
  n = ws.max_row
  t = Table(displayName='ShareData', ref='A1:%s%d' % (CL(len(H)), n))
  t.tableStyleInfo = TableStyleInfo(name='TableStyleMedium2', showRowStripes=True); ws.add_table(t)
  for r in range(2, n + 1): ws.cell(r, len(H)).number_format = '$#,##0'
  for j, w in enumerate([6, 11, 11, 13, 7, 7, 8, 9, 13, 22, 40, 12, 16, 13, 12, 7, 14], start=1): ws.column_dimensions[CL(j)].width = w
  ws.freeze_panes = 'A2'

def read_sheet(wb):
  ws = wb.create_sheet('How to read', 0)
  lines = [
    (MARK, 'mark'), ('F-35 Sustainment: Service Share by WBS  ·  MOCK-UP', 'title'),
    ('Every figure, name, CCaR number and contract number in this workbook is invented. Nothing came from a board.', 'warn'),
    ('', ''),
    ('What each tab is', 'h'),
    ('FY%02d (active): the year in execution, read from CCaR. Obligated and planned, by Service, for each CCaR record, placed '
     'under the WBS paragraph its plan events carry.' % (ACTIVE % 100), ''),
    ('FY%02d by month: the same, month by month; actual months are grey.' % (ACTIVE % 100), ''),
    ('FY%02d onward: what ORBIT funds, by Service, for each requirement, under its WBS paragraph.' % (YEARS[0] % 100), ''),
    ('Data: every figure above as one flat table (Insert > PivotTable), with the WBS levels split out.', ''),
    ('', ''),
    ('How the figures work', 'h'),
    ('A WBS header adds every line beneath it: 1.2.2.1 and 1.2.2.3 add into 1.2.2, then 1.2, then 1.', ''),
    ('Share = each Service ÷ the line\'s total funded with partners. The shares on a line add to 100%.', ''),
    ('Yellow cells: type a partner total on any line. It is added into that line\'s total and every header above it, and the '
     'percentages change straight away. ORBIT does not keep these figures; they live in this workbook.', ''),
    ('A requirement on two paragraphs appears under each, with the dollars the office typed for that paragraph.', ''),
    ('Air Force = USAF + ANG + AFRC. Marine Corps = USMC STOVL + USMC CV. Navy = USN CV. The Data tab keeps all six lines.', ''),
    ('WBS names come from the ACE workbook once linked; until then a paragraph shows its number alone (1.3.1 here).', ''),
    ('ACE estimate: the cost estimate for that paragraph, beside the plan. A requirement line has none of its own.', ''),
    ('', ''),
    ('Still to decide', 'h'),
    ('The WBS names\' tab and column in the ACE; the CCaR column for the contract number; the CCaR column for the WBS '
     'paragraph on each plan event; ORBIT\'s requirement id coming back from CCaR.', ''),
    ('', ''), (MARK, 'mark'),
  ]
  for i, (t, k) in enumerate(lines, start=1):
    c = ws.cell(i, 1, t)
    c.font = {'mark': F(bold=True, color='C00000'), 'title': F(size=16, bold=True), 'warn': F(bold=True, color='C00000'),
              'h': F(size=12, bold=True, color=NAVY)}.get(k, F())
    c.alignment = Alignment(wrap_text=True, vertical='top')
  ws.column_dimensions['A'].width = 120
  ws.page_setup.orientation = 'landscape'; ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0
  ws.sheet_properties.pageSetUpPr.fitToPage = True

# the active year's estimate, from the events (invented, like the rest)
ACE_ACTIVE = {}
for ap in APPNS:
  t = {}
  for e in EVENTS[ap]: t[e['wbs']] = t.get(e['wbs'], 0) + e['amount']
  ACE_ACTIVE[ap] = {w: whole(v * rng.uniform(.95, 1.1)) for w, v in t.items()}

wb = Workbook(); wb.remove(wb.active)
active_sheet(wb); month_sheet(wb)
for fy in YEARS: plan_sheet(wb, fy)
data_sheet(wb); read_sheet(wb)
wb.active = 0
wb.calculation.fullCalcOnLoad = True
wb.save(sys.argv[2])
print('wrote', sys.argv[2])
