// The BAE report of budgets (CONTRACT §14.1, §14.7): reading it beside the CCaR pull, and keeping it in the state.
//
// Every workbook here is written at test time by the Python below (openpyxl, run with python3 -I), another writer than the
// tool's own, into a temporary directory; every name and figure in it is invented. What each row must read as is written
// beside it there (expect.json), from the literal the row was written with, never read back from the tool.
//
// What it holds the tool to:
//   §14.1  a report sheet is known by its four headers, a trailing unit in parentheses set aside ("($M)"), on any of the
//          first 15 rows, alone or beside pull sheets, also when the sheet holds a pull's headers too; every column is kept
//          in the file's order; a number cell is dollars to the cent (Math.round(v*100)), a text amount that reads as zero
//          is 0 and counted, any other text amount makes its row unreadable (its unit cannot be known), as does a blank
//          name, an FY that is not a year or an amount that is not one; the total row is found, never counted, and checked
//          to within $1 each; the date is read from a file name ending _YYYY-MM-DD_HHMMSS; the CSV form reads as the
//          workbook does; two report sheets, a report with no readable row, one whose every non-zero amount is under
//          $100,000, and one with two columns for one of the four are refused, naming them, and nothing changes;
//          SP.apOfBudget is the pull's own Budget rule
//   §14.7  state.bae {current, previous}: a report replaces the current whole, the replaced one becomes previous; one the
//          same row for row keeps previous and records sameSince; one with fewer than half the readable rows of the report
//          on screen is asked about (Cancel changes nothing); no pull is touched, an import holding only a report leaves
//          Data through alone; the history entry records bae {rows, approved, authorized}; the message names the report,
//          its date and rows, and is a warning when rows could not be read; save and reopen keep it byte for byte
//
//   node spend-plan/test/bae-import.test.mjs
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadTool, checks, scratchDir } from './harness.mjs';

const C = checks('bae-import');
const tmp = scratchDir('sfcbsp-bae-');
const J = o => JSON.stringify(o);
const T1 = '2026-11-02T15:00:00.000Z', T2 = '2026-11-09T15:00:00.000Z', T3 = '2026-11-16T15:00:00.000Z', T4 = '2026-11-23T15:00:00.000Z',
  T5 = '2026-11-30T15:00:00.000Z', T6 = '2026-12-07T15:00:00.000Z', T7 = '2026-12-14T15:00:00.000Z';
const STORE = ['util', 'xlsx-read', 'import', 'engine', 'store'];
const has = (s, sub) => typeof s === 'string' && s.includes(sub);
async function refusal(p) { try { await p; return null; } catch (e) { return e; } }
const usd = c => { const a = Math.abs(c), s = '$' + String(Math.floor(a / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + String(a % 100).padStart(2, '0'); return c < 0 ? '-' + s : s; };

// ---------------------------------------------------------------------------------------------------------------------
// THE WORKBOOKS. Amounts are written as the report writes them: dollars in a number cell, shown as $M by the
// $#,##0.000,, format; the report's own zero as the text "$0.000"; a total row with no name and no FY at the end.
// ---------------------------------------------------------------------------------------------------------------------
const PY = String.raw`
import sys, os, json, csv
import openpyxl
from openpyxl.styles import Font
Bold = Font(bold=True)
OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
H28 = ['Budget Name','Budget FY Numeric','Budget Approved Amount ($M)','Budget Authorized Amount ($M)','Budget Service','APPN AF',
  'APPN SFIS','BA SFIS','BLI SFIS','BPAC','BSA SFIS','Budget Exec Years','Budget Flex 01','Budget Flex 02','Budget Flex 03',
  'Budget Office','DEPT AF','DEPT SFIS','Limit AF','Limit SFIS','OBAN','PEC','PEC SFIS','RCCC','Cost Element','Project Description',
  'Variant','Navy PU']
PULL = ['FY','Month','CCaR No','Title','Budget','C/L','SB','Plan Event','Date','Amount','Alloc','Event Description',
  'OPR','PMT PID#','Contracting POC','Material Lead','PM/TPOC','Obligation Category','PMO','Sub-PMO','Category','Navy SI Code',
  'IPT','Spares WBS','Quantity','CLINs','AF EEIC','RCN','PSR','CSR','Contract Mod','Cost Element']
FMT = '$#,##0.000,,_);($#,##0.000,,)'
E = {'h28': H28}
HOSTILE = 'USAF O&M- </script><img src=x onerror=alert(1)> Discretionary AV'

def dollars(c):
    # whole dollars as an int (the report writes 250000000, not 250000000.0), else a float of dollars
    return c // 100 if c % 100 == 0 else c / 100

class Amt:
    # a cell written as given: cents -> a number of dollars; text -> text; ('num', v) -> that number as it is
    def __init__(self, v): self.v = v
    def cell(self):
        if isinstance(self.v, tuple): return self.v[1]
        if isinstance(self.v, int) and not isinstance(self.v, bool): return dollars(self.v)
        return self.v

def report_sheet(ws, rows, total=None, headers=H28, hdr_row=1, title=None, freeze=True):
    if title:
        ws.append([title])
        for k in range(hdr_row - 2): ws.append([])
    ws.append(headers)
    if freeze: ws.freeze_panes = 'A' + str(hdr_row + 1)
    for r in rows:
        ws.append([c.cell() if isinstance(c, Amt) else c for c in r])
        rr = ws.max_row
        ws.cell(rr, 3).number_format = FMT
        ws.cell(rr, 4).number_format = FMT
    if total is not None:
        rr = ws.max_row + 1
        ws.cell(rr, 3, total[0]); ws.cell(rr, 4, total[1])
        ws.cell(rr, 3).number_format = FMT; ws.cell(rr, 4).number_format = FMT
        ws.cell(rr, 2).number_format = '0.00'

def pad(vals, n=28):
    return list(vals) + [None] * (n - len(vals))

# --- report.xlsx: laid out like the real report (28 headers, row 1, frozen, $#,##0.000,, amounts, $0.000 text zeros, a total)
# name, FY, Approved, Authorized, extras {header: value}; then what the row must read as
R = [
  ('USAF O&M- Fixture Line Discretionary AV', 2026, Amt(123456789), Amt(100000000), {'Budget Service': 'USAF', 'Budget Exec Years': 1, 'Project Description': 'Synthetic line one'}),
  ('USAF O&M- Fixture Line Mandatory PSM', 2026, Amt(250000000000), Amt('$0.000'), {'Budget Service': 'USAF', 'Budget Exec Years': 1}),
  ('USN APN Full Fund SUPT Discretionary PP', 2025, Amt(98765432100), Amt(98765432100), {'Budget Service': 'USN', 'Budget Exec Years': 3, 'Navy PU': 'X9'}),
  ('USAF APN Full Fund Flyaway Discretionary AV', 2026, Amt(4000000000000), Amt(3000000000000), {'Budget Service': 'USAF', 'Budget Exec Years': 3}),
  ('USN APN Spares Initial Discretionary CDS', 2027, Amt(5000000000), Amt('$0.000'), {'Budget Service': 'USN', 'Budget Exec Years': 3}),
  ('USN OPN Ship Alts Discretionary MxS', 2026, Amt(12345), Amt(12345), {'Budget Service': 'USN', 'Budget Exec Years': 3, 'Project Description': ' Spaced note '}),
  ('USAF RDT&E Fixture Discretionary', 2026, Amt(777700), Amt(0), {'Budget Service': 'USAF', 'Budget Exec Years': 2}),
  ('USAF O&M- Fixture Line Discretionary BOP', 'FY2026', Amt(123450), Amt(123450), {'Budget Service': 'USAF', 'Budget Exec Years': 1}),
  ('  USN O&M Fixture Line Discretionary TSS  ', 2026, Amt('$0.000'), Amt('$0.000'), {'Budget Service': 'USN', 'Budget Exec Years': 1}),
  ('USMC CV APN Spares Fixture Discretionary PP', 2026, Amt(('num', 10.125)), Amt(1013), {'Budget Service': 'USMC', 'Budget Exec Years': 3}),
  (HOSTILE, 2026, Amt(500000000), Amt(500000000), {'Budget Service': 'USAF', 'Budget Exec Years': 1}),
]
EXP = [  # [name, fy, approved cents, authorized cents]
  ['USAF O&M- Fixture Line Discretionary AV', 2026, 123456789, 100000000],
  ['USAF O&M- Fixture Line Mandatory PSM', 2026, 250000000000, 0],
  ['USN APN Full Fund SUPT Discretionary PP', 2025, 98765432100, 98765432100],
  ['USAF APN Full Fund Flyaway Discretionary AV', 2026, 4000000000000, 3000000000000],
  ['USN APN Spares Initial Discretionary CDS', 2027, 5000000000, 0],
  ['USN OPN Ship Alts Discretionary MxS', 2026, 12345, 12345],
  ['USAF RDT&E Fixture Discretionary', 2026, 777700, 0],
  ['USAF O&M- Fixture Line Discretionary BOP', 2026, 123450, 123450],
  ['USN O&M Fixture Line Discretionary TSS', 2026, 0, 0],
  ['USMC CV APN Spares Fixture Discretionary PP', 2026, 1013, 1013],   # 10.125 dollars: Math.round(1012.5) is 1013
  [HOSTILE, 2026, 500000000, 500000000],
]
def xof(extras):
    # an extra column's value as the tool keeps it: text, trimmed; a whole number as its digits
    return {k: (str(v).strip() if isinstance(v, str) else str(v)) for k, v in extras.items() if v is not None and str(v).strip() != ''}
def rows28(spec):
    out = []
    for (n, fy, a, u, ex) in spec:
        r = pad([n, fy, a, u])
        for k, v in ex.items(): r[H28.index(k)] = v
        out.append(r)
    return out
SUM_A = sum(e[2] for e in EXP); SUM_U = sum(e[3] for e in EXP)
# the total row: Approved 50 cents over the rows' sum (within $1, so it agrees), Authorized exact
TOT = (SUM_A + 50, SUM_U)
wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'Sheet1'
report_sheet(ws, rows28(R), total=(dollars(TOT[0]), dollars(TOT[1])))
NAME = 'Report__BAE_ALL_Services_USAF_and_DoN_2026-01-31_120000.xlsx'
wb.save(os.path.join(OUT, NAME))
E['report'] = {'name': NAME, 'rows': EXP, 'x': [xof(r[4]) for r in R], 'total': [TOT[0], TOT[1], len(R) + 2],
  'sum': [SUM_A, SUM_U], 'stamp': '2026-01-31 12:00', 'zero': 4, 'subcent': 1, 'trimmed': 2, 'blank': 0}

# --- the same report as CSV (plain numbers, as a CSV writes them; the text zeros stay text)
CSVNAME = 'bae_report_2026-02-28_093015.csv'
with open(os.path.join(OUT, CSVNAME), 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(H28)
    for r in rows28(R):
        w.writerow(['' if v is None else (v.cell() if isinstance(v, Amt) else v) for v in r])
    w.writerow(pad(['', '', dollars(TOT[0]), dollars(TOT[1])]))
E['csv'] = {'name': CSVNAME, 'stamp': '2026-02-28 09:30'}

# --- a pull, and a pull with a row whose appropriation is not identified
def pull_row(**kw):
    import datetime
    r = {h: None for h in PULL}
    r.update({'FY': 2026, 'Month': datetime.datetime(2025, 11, 1), 'CCaR No': 'TST-0001', 'Title': 'Test Title A',
      'Budget': 'USAF O&M- Fixture Line Discretionary AV', 'Plan Event': 'Test PE A', 'Date': datetime.datetime(2025, 11, 15),
      'Amount': 100, 'Alloc': 'Actual Execution is allocated to a Plan Event', 'PMO': 'Air Vehicle (AV)'})
    r.update(kw)
    return [r[h] for h in PULL]
wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'O&M Raw Data'
ws.append(PULL)
for k in range(4): ws.append(pull_row(**{'CCaR No': 'TST-000' + str(k), 'Amount': 1000 + k}))
wb.save(os.path.join(OUT, 'pull-om.xlsx'))
wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'Report'
ws.append(PULL)
ws.append(pull_row(Amount=11)); ws.append(pull_row(Budget='USAF BOS Discretionary AV', Amount=12))
wb.save(os.path.join(OUT, 'pull-mixed.xlsx'))

# --- a pull sheet and a report sheet in one workbook
wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'O&M Raw Data'
ws.append(PULL)
ws.append(pull_row(Amount=21)); ws.append(pull_row(Amount=22))
report_sheet(wb.create_sheet('BAE'), rows28(R[:2]), total=(dollars(EXP[0][2] + EXP[1][2]), dollars(EXP[0][3] + EXP[1][3])))
wb.save(os.path.join(OUT, 'combined.xlsx'))

# --- two report sheets in one workbook, the second hidden
wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'Report A'
report_sheet(ws, rows28(R[:2]))
s2 = wb.create_sheet('Report B'); report_sheet(s2, rows28(R[2:4])); s2.sheet_state = 'hidden'
wb.save(os.path.join(OUT, 'two.xlsx'))

# --- every amount under $100,000: a report exported in $M
wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'Sheet1'
report_sheet(ws, [pad(['USAF O&M- Fixture Line Discretionary AV', 2026, 12.34, 9.5]), pad(['USN APN Full Fund SUPT Discretionary PP', 2026, 99999.99, '$0.000']),
  pad(['USN OPN Ship Alts Discretionary MxS', 2026, 0.5, 0])], total=(100012.83, 9.5))
wb.save(os.path.join(OUT, 'small.xlsx'))
E['small'] = {'largest': 9999999}
# one amount of exactly $100,000 is not "under" it
wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'Sheet1'
report_sheet(ws, [pad(['USAF O&M- Fixture Line Discretionary AV', 2026, 100000, 9.5]), pad(['USN OPN Ship Alts Discretionary MxS', 2026, 0.5, 0])])
wb.save(os.path.join(OUT, 'edge100k.xlsx'))

# --- rows that cannot be read, a row with no Budget Name in the middle, and a total that therefore differs.
# The date in the name is not a date (month 13), so the report has none.
U = [
  ['USAF O&M- Fixture Line Discretionary AV', 2026, 500000, 400000],            # row 2: readable
  ['USAF O&M- Fixture Line Discretionary BOP', 2026, '$1.235', 300000],           # row 3: non-zero text: unit unknown
  ['USAF O&M- Fixture Line Discretionary CDS', 2026, 250000, 'abc'],              # row 4: not an amount
  ['USAF O&M- Fixture Line Discretionary MxS', 'abc', 100000, 100000],            # row 5: FY not a year
  [None, 2026, 200000, 200000],                                                   # row 6: no Budget Name, in the middle
  [None, None, 7000, 7000],                                                       # row 7: no name, no FY, amounts: in the middle, so not the total
  ['USAF O&M- Fixture Line Discretionary PSM', None, 100000, 0],                  # row 8: FY blank
  ['USAF O&M- Fixture Line Discretionary TSS', 2026, True, 5],                    # row 9: a TRUE is not an amount
  ['USN APN Full Fund SUPT Discretionary PP', 2026, 600000, 600000],              # row 10: readable
]
wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'Sheet1'
report_sheet(ws, [pad(r) for r in U], total=(500000 + 250000 + 100000 + 200000 + 7000 + 100000 + 600000, 400000 + 300000 + 100000 + 200000 + 7000 + 5 + 600000))
UNAME = 'unreadable_2026-13-01_120000.xlsx'
wb.save(os.path.join(OUT, UNAME))
E['unreadable'] = {'name': UNAME, 'readable': [[2, 'USAF O&M- Fixture Line Discretionary AV', 2026, 50000000, 40000000], [10, 'USN APN Full Fund SUPT Discretionary PP', 2026, 60000000, 60000000]],
  'bad': [[3, 'Budget Approved Amount ($M)', 'unit cannot be known'], [4, 'Budget Authorized Amount ($M)', 'is not an amount'], [5, 'Budget FY Numeric', 'is not a year'],
          [6, 'Budget Name', 'is blank'], [7, 'Budget Name', 'is blank'], [7, 'Budget FY Numeric', 'is blank'], [8, 'Budget FY Numeric', 'is blank'],
          [9, 'Budget Approved Amount ($M)', 'is not an amount']],
  'total': [175700000, 160700500], 'sum': [110000000, 100000000]}

# --- one row that cannot be read, a total that agrees with the readable rows: the warning is the unreadable row's alone
wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'Sheet1'
report_sheet(ws, [pad(['USAF O&M- Fixture Line Discretionary AV', 2026, 2500000, 2000000]), pad(['USN OPN Ship Alts Discretionary MxS', 2026, 'n/a', 0])],
  total=(2500000, 2000000))
wb.save(os.path.join(OUT, 'badrow.xlsx'))

# --- no total row; the header on row 3 under a title; the plain headers (no unit), Budget FY for the FY; a column with no
# header that holds a value; two columns of one unknown header; blank rows and a row with a value only outside the four
wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'Budgets'
ws.append(['Synthetic BAE report, no total']); ws.append([])
ws.append(['Budget Name', 'Budget FY', 'Budget Approved Amount', 'Budget Authorized Amount', None, 'Note', 'Note'])
ws.append(['USAF O&M- Fixture Line Discretionary AV', 2026, 1000000, 900000, 'loose value', 'a', 'b'])
ws.cell(5, 1).font = Bold; ws.cell(5, 3).font = Bold          # row 5: styled, empty: a blank row in the file
ws.append([None, None, None, None, None, 'only a note', None])
ws.append(['USN APN Full Fund SUPT Discretionary PP', 2027, 2000000.5, 2000000, None, None, None])
ws.cell(8, 2).font = Bold                                      # row 8: blank too
wb.save(os.path.join(OUT, 'nototal.xlsx'))
E['nototal'] = {'headers': ['Budget Name', 'Budget FY', 'Budget Approved Amount', 'Budget Authorized Amount', 'Column E', 'Note', 'Note (2)'],
  'rows': [['USAF O&M- Fixture Line Discretionary AV', 2026, 100000000, 90000000], ['USN APN Full Fund SUPT Discretionary PP', 2027, 200000050, 200000000]],
  'x0': {'Column E': 'loose value', 'Note': 'a', 'Note (2)': 'b'}}

# --- Budget FY and Budget FY Numeric both: the numeric is read, the other kept as written
wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'Sheet1'
report_sheet(ws, [['USAF O&M- Fixture Line Discretionary AV', 'FY25', 2026, 1000000, 1000000]],
  headers=['Budget Name', 'Budget FY', 'Budget FY Numeric', 'Budget Approved Amount ($M)', 'Budget Authorized Amount ($M)'])
wb.save(os.path.join(OUT, 'bothfy.xlsx'))

# --- refusals: two columns for one of the four; a header and no rows; no row readable; nearly a report
wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'Sheet1'
ws.append(['Budget Name', 'Budget FY Numeric', 'Budget Approved Amount ($M)', 'Budget Approved Amount', 'Budget Authorized Amount ($M)'])
ws.append(['USAF O&M- Fixture Line Discretionary AV', 2026, 1000000, 1000000, 1000000])
wb.save(os.path.join(OUT, 'dup.xlsx'))
wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'Sheet1'
ws.append(H28); wb.save(os.path.join(OUT, 'norows.xlsx'))
wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'Sheet1'
report_sheet(ws, [pad(['USAF O&M- Fixture Line Discretionary AV', 2026, '1.000', 0]), pad(['USN OPN Ship Alts Discretionary MxS', 2026, '2.500', '$0.000'])])
wb.save(os.path.join(OUT, 'allbad.xlsx'))
wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'Almost'
ws.append(['Budget Name', 'Budget FY Numeric', 'Budget Approved Amount ($M)', 'Budget Service'])
ws.append(['USAF O&M- Fixture Line Discretionary AV', 2026, 1000000, 'USAF'])
wb.save(os.path.join(OUT, 'near.xlsx'))

# --- a sheet holding the pull's headers AND the report's: a report sheet
wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'Both'
ws.append(PULL + ['Budget Name', 'Budget FY Numeric', 'Budget Approved Amount ($M)', 'Budget Authorized Amount ($M)'])
ws.append(pull_row() + ['USAF O&M- Fixture Line Discretionary AV', 2026, 3000000, 3000000])
wb.save(os.path.join(OUT, 'both.xlsx'))

# --- a report CSV separated by semicolons
with open(os.path.join(OUT, 'semi.csv'), 'w', encoding='utf-8') as f:
    f.write('Budget Name;Budget FY Numeric;Budget Approved Amount ($M);Budget Authorized Amount ($M)\n')
    f.write('USAF O&M- Fixture Line Discretionary AV;2026;1000000;1000000\n')

# --- the total check at its edge: within $1 agrees, $1.01 off does not
A2 = [['USAF O&M- Fixture Line Discretionary AV', 2026, 30000000, 20000000], ['USN OPN Ship Alts Discretionary MxS', 2026, 1000050, 500]]
for nm, da, du in (('edge_2026-03-31_235959.xlsx', 100, -100), ('off_2026-03-31_235959.xlsx', 101, -100)):
    wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'Sheet1'
    report_sheet(ws, [pad([r[0], r[1], Amt(r[2]), Amt(r[3])]) for r in A2], total=(dollars(31000050 + da), dollars(20000500 + du)))
    wb.save(os.path.join(OUT, nm))
E['edge'] = {'sum': [31000050, 20000500]}

with open(os.path.join(OUT, 'expect.json'), 'w') as f: json.dump(E, f)
`;

try {
  writeFileSync(join(tmp.dir, 'mk.py'), PY);
  const py = spawnSync('python3', ['-I', join(tmp.dir, 'mk.py'), join(tmp.dir, 'fx')], { encoding: 'utf8' });
  if (py.status !== 0) throw new Error('the fixture writer failed: ' + py.stderr);
  const FX = join(tmp.dir, 'fx');
  const E = JSON.parse(readFileSync(join(FX, 'expect.json'), 'utf8'));
  const ab = n => { const b = readFileSync(join(FX, n)); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); };
  const files = (...ns) => ns.map(n => ({ name: n, data: ab(n) }));
  const t = loadTool({ modules: ['util', 'xlsx-read', 'import'] });
  const SP = t.SP;
  const lines = rep => SP.importReportLines(rep).join('\n');

  // =============================================================================================================
  // §14.1 the report laid out like the real one
  // =============================================================================================================
  const RE = E.report;
  const p1 = await SP.parseFiles(files(RE.name), { now: T1 });
  const b1 = p1.bae;
  C.chk('parseFiles returns {pulls, bae, report}', p1 && typeof p1.pulls === 'object' && b1 && typeof b1 === 'object' && p1.report && typeof p1.report === 'object');
  C.eq('a report alone brings no pull', J(p1.pulls), '{}');
  C.eq('every column is kept, in the file’s order, under the file’s own headers', b1.headers, E.h28);
  C.eq('the four columns read are named by their headers as the file has them', b1.cols, E.h28.slice(0, 4));
  C.eq('every budget row, as [name, FY, Approved cents, Authorized cents]', b1.rows.map(r => r.c), RE.rows);
  C.eq('the other columns of each row are kept, as text (a whole number as its digits)', b1.rows.map(r => J(r.x)), RE.x.map(x => J(x)));
  C.eq('each row says where it came from', b1.rows.map(r => r.src), RE.rows.map((r, i) => [0, 'Sheet1', i + 2]));
  C.chk('no row is marked unreadable', b1.rows.every(r => !r.bad && !r.raw));
  C.eq('the report names its file and sheet', [b1.file, b1.sheet], [RE.name, 'Sheet1']);
  C.eq('the date is read from the file name, …_2026-01-31_120000 -> 2026-01-31 12:00', b1.stamp, RE.stamp);
  C.eq('the total row is found, kept apart and never a row', J(b1.total), J({ approved: RE.total[0], authorized: RE.total[1], rowNo: RE.total[2] }));
  const P1 = p1.report.bae;
  C.chk('the import report has a BAE part', P1 && typeof P1 === 'object');
  C.eq('the BAE part: rows read, readable, blank, sums', [P1.rowsRead, P1.readable, P1.blank, P1.cents.approved, P1.cents.authorized],
    [RE.rows.length, RE.rows.length, RE.blank, RE.sum[0], RE.sum[1]]);
  C.eq('the BAE part: conversions (text zeros, blanks, sub-cent roundings, spaces trimmed)',
    [P1.conversions.zero, P1.conversions.blank, P1.conversions.subcent, P1.conversions.trimmed], [RE.zero, 0, RE.subcent, RE.trimmed]);
  C.eq('the sub-cent rounding is named with its row, column, text and cents', J(P1.subcent),
    J([{ row: 11, column: 'Budget Approved Amount ($M)', raw: '10.125', cents: 1013 }]));
  C.chk('the total check: 50 cents over is within $1, so it agrees', P1.total && P1.total.ok === true && P1.total.diffApproved === 50 && P1.total.diffAuthorized === 0,
    J(P1.total));
  C.eq('the total check states the rows’ own sums', [P1.total.sumApproved, P1.total.sumAuthorized, P1.total.rowNo], [RE.sum[0], RE.sum[1], RE.total[2]]);
  {
    const L = lines(p1.report);
    C.chk('the Import report lists the sheet as the BAE report', has(L, 'Sheet “Sheet1”: the BAE report of budgets — header on row 1; 11 budget rows'), L);
    C.chk('the Import report names the report, its date and its header row',
      has(L, 'BAE report of budgets: “' + RE.name + '” › “Sheet1”, dated 2026-01-31 12:00 by its file name; header on row 1.'), L);
    C.chk('the Import report counts the rows and the conversions', has(L, 'Rows read: 11. Blank rows skipped: 0.')
      && has(L, '4 amounts written as text that reads as zero') && has(L, '1 amount with fractions of a cent') && has(L, '2 values with spaces trimmed'), L);
    C.chk('the Import report says the total agrees', has(L, 'Total row (row 13') && has(L, 'it agrees (within $1 each)'), L);
    C.chk('the Import report states the readable rows’ sums', has(L, 'Approved ' + usd(RE.sum[0]) + ' and Authorized ' + usd(RE.sum[1])), L);
    C.chk('an import of a report alone prints no pull lines (no “Alloc values:”, no pull rows read)', !has(L, 'Alloc values:') && !/^Rows read:/m.test(L), L);
    C.eq('the report is a used sheet, not an ignored one', [p1.report.ignoredSheets.length, p1.report.refusedFiles.length], [0, 0]);
  }
  C.eq('SP.apOfBudget is the pull’s own Budget rule: Spares, Full Fund, OPN, O&M, none',
    ['USN APN Spares Initial', 'USAF APN Full  Fund SUPT', 'USN OPN Ship Alts', 'USAF O&M- Line', 'USAF RDT&E', 'Staff Office', null].map(x => SP.apOfBudget(x)),
    ['sp', 'ff', 'opn', 'om', null, null, null]);
  // names that two rules match: the order the rules are tried in decides, so a copy of the rule in another order differs here
  C.eq('SP.apOfBudget tries the rules in the pull’s order: Spares, then Full Fund, then OPN, then O&M',
    ['USAF O&M Spares Line', 'USN Full Fund OPN Line', 'USN OPN O&M Line', 'Spares Full Fund', 'o&m opn'].map(x => SP.apOfBudget(x)), ['sp', 'ff', 'opn', 'sp', 'opn']);
  C.chk('SP.apOfBudget places a pull row exactly as apOfRow does by its Budget', ['USN APN Spares X', 'USAF APN Full Fund Y', 'USN OPN Z', 'USAF O&M- W',
    'USAF O&M Spares Line', 'USN Full Fund OPN Line', 'USN OPN O&M Line', 'Office Staff', '']
    .every(b => SP.apOfRow({ c: Object.assign(new Array(32).fill(''), { 4: b }) }, 'Report') === SP.apOfBudget(b)));
  C.eq('baeStampOf: a date and time at the end of the name, or none', [SP.baeStampOf('x_2026-01-31_120000.xlsx'), SP.baeStampOf('C:\\dl\\Report_2025-12-01_235959.csv'),
    SP.baeStampOf('x_2026-13-01_120000.xlsx'), SP.baeStampOf('x_2026-02-30_120000.xlsx'), SP.baeStampOf('x_2026-01-31_250000.xlsx'),
    SP.baeStampOf('x_2026-01-31_120000 (1).xlsx'), SP.baeStampOf('report.xlsx'), SP.baeStampOf(null)],
    ['2026-01-31 12:00', '2025-12-01 23:59', null, null, null, null, null, null]);

  // the CSV form reads as the workbook does: the same rows, columns and total
  {
    const p = await SP.parseFiles(files(E.csv.name), { now: T1 });
    C.eq('CSV: the same rows as the workbook', p.bae.rows.map(r => r.c), RE.rows);
    C.eq('CSV: the same columns, kept as text', p.bae.rows.map(r => J(r.x)), RE.x.map(x => J(x)));
    C.eq('CSV: the same headers', p.bae.headers, E.h28);
    C.eq('CSV: the same total, on its own row', J(p.bae.total), J({ approved: RE.total[0], authorized: RE.total[1], rowNo: RE.total[2] }));
    C.eq('CSV: its date from its name, the sheet named for the file', [p.bae.stamp, p.bae.sheet], [E.csv.stamp, 'bae_report_2026-02-28_093015']);
    C.eq('CSV: a plain number is how a CSV writes a number, not a conversion; the text zeros still are',
      [p.report.bae.conversions.zero, p.report.bae.conversions.subcent], [RE.zero, RE.subcent]);
  }

  // =============================================================================================================
  // a report beside pulls, in one import
  // =============================================================================================================
  {
    const p = await SP.parseFiles(files('combined.xlsx'), { now: T1 });
    C.eq('combined: the pull sheet is a pull', [Object.keys(p.pulls), p.pulls.om.rows.length], [['om'], 2]);
    C.eq('combined: the report sheet is the report', [p.bae.sheet, p.bae.rows.length, p.bae.stamp], ['BAE', 2, null]);
    C.eq('combined: the report keeps none of the pull’s rows and the pull none of the report’s', [p.report.rowsRead, p.report.bae.rowsRead], [2, 2]);
    const L = lines(p.report);
    C.chk('combined: the Import report has the pull’s lines and the report’s section', has(L, 'O&M: 2 rows') && has(L, 'Alloc values:')
      && has(L, 'BAE report of budgets: “combined.xlsx” › “BAE”, with no date in its file name') && has(L, 'Sheet “O&M Raw Data”: used'), L);
    const q = await SP.parseFiles(files('pull-om.xlsx', RE.name), { now: T1 });
    C.eq('a pull file and a report file in one import: each read as itself', [Object.keys(q.pulls), q.pulls.om.rows.length, q.bae.rows.length, q.bae.rows[0].src[0]],
      [['om'], 4, RE.rows.length, 1]);
    const b = await SP.parseFiles(files('both.xlsx'), { now: T1 });
    C.chk('a sheet with the pull’s headers and the report’s is a report sheet', b.bae && b.bae.rows.length === 1 && J(b.pulls) === '{}', J(Object.keys(b.pulls)));
    C.eq('… and keeps the pull’s columns as its own, in order', b.bae.headers.length, 36);
    C.eq('… reading the report’s four', b.bae.rows[0].c, ['USAF O&M- Fixture Line Discretionary AV', 2026, 300000000, 300000000]);
  }

  // =============================================================================================================
  // refusals: nothing is imported, and the message names what and where
  // =============================================================================================================
  {
    let e = await refusal(SP.parseFiles(files('two.xlsx'), { now: T1 }));
    C.chk('two report sheets in one workbook refuse the import', e && e.refused === true, e && e.message);
    C.chk('… naming both, the hidden one as hidden', e && has(e.message, '“two.xlsx” › “Report A”') && has(e.message, '“two.xlsx” › “Report B” (a hidden sheet)')
      && has(e.message, 'one import takes one report'), e && e.message);
    e = await refusal(SP.parseFiles(files(RE.name, 'combined.xlsx'), { now: T1 }));
    C.chk('two report sheets in two files refuse the import, naming both', e && e.refused && has(e.message, '“' + RE.name + '” › “Sheet1”')
      && has(e.message, '“combined.xlsx” › “BAE”'), e && e.message);
    e = await refusal(SP.parseFiles(files('small.xlsx'), { now: T1 }));
    C.chk('a report whose every non-zero amount is under $100,000 is refused, saying the figures look like $M', e && e.refused
      && has(e.message, 'is under $100,000') && has(e.message, 'largest is ' + usd(E.small.largest)) && has(e.message, 'exported in $M'), e && e.message);
    const k = await SP.parseFiles(files('edge100k.xlsx'), { now: T1 });
    C.eq('one amount of exactly $100,000 is not under it: the report is read', k.bae.rows.map(r => r.c[2]), [10000000, 50]);
    e = await refusal(SP.parseFiles(files('dup.xlsx'), { now: T1 }));
    C.chk('two columns for one of the four refuse the import, naming both columns', e && e.refused
      && has(e.message, '“Budget Approved Amount ($M)” (C) and “Budget Approved Amount” (D), are both the Budget Approved Amount'), e && e.message);
    e = await refusal(SP.parseFiles(files('norows.xlsx'), { now: T1 }));
    C.chk('a report with its headers and no rows is refused by name', e && e.refused && has(e.message, 'The BAE report “norows.xlsx” › “Sheet1” has no row that can be read')
      && has(e.message, 'no budget rows below them'), e && e.message);
    e = await refusal(SP.parseFiles(files('allbad.xlsx'), { now: T1 }));
    C.chk('a report with no readable row is refused by name, and its report lists every row', e && e.refused
      && has(e.message, '“allbad.xlsx” › “Sheet1” has no row that can be read') && e.report && e.report.bae && e.report.bae.unreadable.length === 2, e && e.message);
    e = await refusal(SP.parseFiles(files('allbad.xlsx', 'pull-om.xlsx'), { now: T1 }));
    C.chk('… also beside a pull that could be imported: nothing is', e && e.refused && has(e.message, 'has no row that can be read'), e && e.message);
    e = await refusal(SP.parseFiles(files('near.xlsx'), { now: T1 }));
    C.chk('a sheet that is nearly a report is ignored, and the Import report says which header it lacks', e && e.refused && e.report
      && has(lines(e.report), 'Sheet “Almost”: ignored — no row in the first 15 holds all 9 required column headers')
      && has(lines(e.report), 'row 1 looks like a BAE report’s header but has no “Budget Authorized Amount”'), e && e.report && lines(e.report));
    C.chk('a file with no usable sheet is told it holds neither pull rows nor a BAE report', e && has(e.message, 'nor a BAE report of budgets (Budget Name'), e && e.message);
    e = await refusal(SP.parseFiles(files('semi.csv'), { now: T1 }));
    C.chk('a report CSV separated by semicolons is refused saying so', e && e.refused && has(e.message, 'separated by semicolons, not commas'), e && e.message);
  }

  // =============================================================================================================
  // rows that cannot be read: kept, named, counted in no figure
  // =============================================================================================================
  const UE = E.unreadable;
  const pu = await SP.parseFiles(files(UE.name), { now: T1 });
  {
    const b = pu.bae;
    C.eq('unreadable: every row is kept, in order', b.rows.map(r => r.src[2]), [2, 3, 4, 5, 6, 7, 8, 9, 10]);
    C.eq('unreadable: the readable rows read in full', b.rows.filter(r => !r.bad).map(r => [r.src[2]].concat(r.c)), UE.readable);
    for (const [row, col, why] of UE.bad) {
      const r = b.rows.find(x => x.src[2] === row);
      C.chk('unreadable: row ' + row + ' says ' + col + ' ' + why, r && Array.isArray(r.bad) && r.bad.some(s => has(s, col) && has(s, why)), J(r && r.bad));
    }
    C.eq('unreadable: a non-zero text amount is kept as written, and read as nothing', [b.rows[1].c[2], b.rows[1].raw['Budget Approved Amount ($M)']], [null, '$1.235']);
    C.eq('unreadable: an FY that is not a year is kept as written', [b.rows[3].c[1], b.rows[3].raw['Budget FY Numeric']], [null, 'abc']);
    C.eq('unreadable: a row with no Budget Name in the middle is a row, not the total', [b.rows[4].c[0], b.rows[4].c[1], b.rows[4].c[2]], ['', 2026, 20000000]);
    C.eq('unreadable: a row with no name and no FY that holds amounts, with budget rows after it, is a row too, not the total',
      [b.rows[5].c, b.total && b.total.rowNo], [['', null, 700000, 700000], 11]);
    C.eq('unreadable: a date that is not a date in the file name gives no date', b.stamp, null);
    const P = pu.report.bae;
    C.eq('unreadable: the BAE part counts them, and sums only the readable rows', [P.rowsRead, P.readable, P.unreadable.length, P.cents.approved, P.cents.authorized],
      [9, 2, 7, UE.sum[0], UE.sum[1]]);
    C.chk('unreadable: the total check says it differs, by how much', P.total && P.total.ok === false && P.total.diffApproved === UE.total[0] - UE.sum[0]
      && P.total.diffAuthorized === UE.total[1] - UE.sum[1], J(P.total));
    const L = lines(pu.report);
    C.chk('unreadable: the Import report lists each row in full', has(L, 'Unreadable rows (kept, counted in no figure): 7.')
      && has(L, '“' + UE.name + '” › “Sheet1” row 3: Budget Approved Amount ($M) “$1.235” is text, not a number: its unit cannot be known')
      && has(L, 'Budget Approved Amount ($M) “$1.235”, Budget Authorized Amount ($M) $300,000.00.') && has(L, 'row 6: Budget Name is blank'), L);
    C.chk('unreadable: the Import report says the total differs, and by how much', has(L, 'it differs, the total less the rows being +' + usd(UE.total[0] - UE.sum[0])
      + ' on Approved and +' + usd(UE.total[1] - UE.sum[1]) + ' on Authorized (the unreadable rows are not in the rows’ sum)'), L);
    C.chk('unreadable: the Import report says the report has no date in its name', has(L, 'with no date in its file name'), L);
  }

  // the total check at its edge, and a report with no total row, its header under a title, plain headers
  {
    const ok = await SP.parseFiles(files('edge_2026-03-31_235959.xlsx'), { now: T1 });
    C.chk('total within $1 each (+$1.00, -$1.00) agrees', ok.report.bae.total.ok === true && ok.report.bae.total.diffApproved === 100
      && ok.report.bae.total.diffAuthorized === -100, J(ok.report.bae.total));
    const off = await SP.parseFiles(files('off_2026-03-31_235959.xlsx'), { now: T1 });
    C.chk('total $1.01 off on one figure does not agree', off.report.bae.total.ok === false && off.report.bae.total.diffApproved === 101, J(off.report.bae.total));
    const n = await SP.parseFiles(files('nototal.xlsx'), { now: T1 });
    C.eq('no total: the header is found on row 3, under a title', n.report.bae.headerRow, 3);
    C.eq('no total: headers without a unit, and Budget FY, are the report’s', n.bae.rows.map(r => r.c), E.nototal.rows);
    C.eq('no total: every column kept, a column with no header by its letter, a second “Note” as “Note (2)”', n.bae.headers, E.nototal.headers);
    C.eq('no total: … and the values under them', J(n.bae.rows[0].x), J(E.nototal.x0));
    C.eq('no total: none found, and none invented', [n.bae.total, n.report.bae.total], [null, null]);
    C.eq('no total: blank rows skipped and counted; a row with a value only outside the four listed with it',
      [n.report.bae.blank, J(n.report.bae.extraOnly)], [2, J([{ row: 6, values: [['Note', 'only a note']] }])]);
    const L = lines(n.report);
    C.chk('no total: the Import report says no total row was found', has(L, 'Total row: none found'), L);
    C.chk('no total: the Import report lists the row held outside the four', has(L, 'row 6: Note “only a note”.'), L);
    const f = await SP.parseFiles(files('bothfy.xlsx'), { now: T1 });
    C.eq('Budget FY and Budget FY Numeric: the numeric is read, the other kept as written', [f.bae.rows[0].c[1], f.bae.rows[0].x['Budget FY'], f.bae.cols[1]],
      [2026, 'FY25', 'Budget FY Numeric']);
  }
  t.close();

  // =============================================================================================================
  // §14.7 the store
  // =============================================================================================================
  {
    const s = loadTool({ modules: STORE });
    const S = s.SP;
    S.storeInit();
    C.eq('the store boots with no script errors', s.errors, []);
    C.eq('an empty page holds no report', J(S.state.bae), J({ current: null, previous: null }));
    const pr = await S.parseFiles(files(RE.name), { now: T1 });
    const want = JSON.parse(J(pr.bae));
    const r1 = S.applyImport(pr);
    C.chk('a report alone imports', r1 && r1.ok === true, J(r1));
    C.eq('… as the current report, with its import time', J(S.state.bae.current), J(Object.assign({}, want, { importedAt: T1 })));
    C.eq('… with nothing before it', S.state.bae.previous, null);
    C.eq('… touching no pull', J(S.state.pulls), J({ current: {}, previous: {} }));
    C.eq('… leaving Data through alone: an empty page’s settings stay unset', S.state.settings, null);
    C.eq('… with one history entry recording the report', J(S.state.history), J([{ importedAt: T1, aps: [], totals: {},
      bae: { rows: RE.rows.length, approved: RE.sum[0], authorized: RE.sum[1] } }]));
    C.chk('… the message names the report, its date and its rows', has(r1.message, 'Imported the BAE report “' + RE.name + '” › “Sheet1”, dated 2026-01-31 12:00: 11 rows'), r1.message);
    C.chk('… and is not a warning: every row was read and the total agrees', r1.warn === false, J(r1));
    C.chk('… and says nothing of a pull or of Data through', !has(r1.message, 'No row in this import') && !has(r1.message, 'Data through'), r1.message);
    C.chk('… the import is unsaved work', S.isDirty() === true);
    C.eq('… the last import report holds the BAE part', J(S.state.lastImport.report.bae), J(pr.report.bae));

    // the same report again: previous stays as it was (none), sameSince records since when its rows have been on screen
    const r2 = S.applyImport(await S.parseFiles(files(RE.name), { now: T2 }));
    C.eq('the same report again: current is this import’s, recording since when', [S.state.bae.current.importedAt, S.state.bae.current.sameSince], [T2, T1]);
    C.eq('… previous stays as it was', S.state.bae.previous, null);
    C.chk('… the message says it is the same, with nothing earlier to compare', has(r2.message, 'The BAE report is the same as the one on screen, row for row; there is no earlier report'), r2.message);
    C.eq('… a second history entry', S.state.history.length, 2);

    // a pull, then a report alone: the report leaves the pull and Data through as they are
    S.applyImport(await S.parseFiles(files('pull-mixed.xlsx'), { now: T3 }));
    S.setSettings({ asOf: '2026-03' });
    const pullsBefore = J(S.state.pulls), setBefore = J(S.state.settings);
    // a report with fewer than half the readable rows: the question first; Cancel changes nothing
    let asked = null;
    s.window.confirm = q => { asked = q; return false; };
    const pu2 = await S.parseFiles(files(UE.name), { now: T4 });
    const stateBefore = J(S.state);
    const r3 = S.applyImport(pu2);
    C.chk('a report with fewer than half the readable rows of the one on screen is asked about', typeof asked === 'string'
      && has(asked, 'This import brings a BAE report of 9 rows, and only 2 of them can be read') && has(asked, 'fewer than half the 11 readable rows of the BAE report on screen')
      && has(asked, 'Import anyway?'), asked);
    C.chk('… Cancel imports nothing, and says so', r3 && r3.ok === false && has(r3.message, 'Nothing was imported') && has(r3.message, 'the BAE report')
      && has(r3.message, 'Import the whole BAE report when you have it.'), J(r3));
    C.eq('… and changes nothing at all', J(S.state), stateBefore);
    asked = null;
    s.window.confirm = q => { asked = q; return true; };
    const r4 = S.applyImport(pu2);
    C.chk('… OK imports it', r4 && r4.ok === true && typeof asked === 'string', J(r4));
    C.eq('… the report on screen becomes previous, whole', J(S.state.bae.previous), J(Object.assign({}, want, { importedAt: T2, sameSince: T1 })));
    C.eq('… the new report is current', J(S.state.bae.current.rows), J(JSON.parse(J(pu2.bae.rows))));
    // the rows of no appropriation now carry the time of the import they came with: the last import is no longer theirs
    // (CONTRACT §11); nothing else of any pull moves
    const pullsWant = JSON.parse(pullsBefore);
    pullsWant.current.unidentified.importedAt = T3;
    C.eq('… no pull is touched, the rows of no appropriation included', J(S.state.pulls), J(pullsWant));
    C.eq('… an import holding only a report leaves Data through (and every setting) alone', J(S.state.settings), setBefore);
    C.chk('… the message is a warning: it asked, rows could not be read, the total disagrees', r4.warn === true
      && has(r4.message, 'Check: the BAE report now has 2 readable rows') && has(r4.message, '7 rows of the BAE report could not be read')
      && has(r4.message, 'Check: the BAE report’s own total row (row 11) does not agree'), r4.message);
    C.chk('… it names the report it replaces, kept for What changed', has(r4.message, 'The BAE report it replaces, “' + RE.name + '” › “Sheet1” (dated 2026-01-31 12:00), is kept for What changed.'), r4.message);
    C.chk('… it names no date the report does not have', has(r4.message, '“' + UE.name + '” › “Sheet1”, which has no date in its file name: 9 rows, 2 of them readable'), r4.message);
    C.chk('… Data through stays where the person put it, and the message says so', has(r4.message, 'Data through stays Mar-2026'), r4.message);
    C.eq('… the history entry records the readable rows', J(S.state.history[S.state.history.length - 1].bae), J({ rows: 2, approved: UE.sum[0], authorized: UE.sum[1] }));
    C.chk('… the pulls kept are said to be kept', has(r4.message, 'O&M keeps its pull of'), r4.message);

    // a report beside a pull, in one import: both go in; Data through follows the pull
    asked = null;
    const pc = await S.parseFiles(files('combined.xlsx'), { now: T5 });
    const r5 = S.applyImport(pc);
    C.chk('pull and report in one import: no question (2 readable rows replace 2)', asked === null, asked);
    C.eq('… the pull and the report are both current', [S.state.pulls.current.om.rows.length, S.state.bae.current.sheet], [2, 'BAE']);
    C.eq('… the report it replaced is previous', S.state.bae.previous.file, UE.name);
    C.eq('… Data through follows the pull', S.state.settings.asOf, '2026-10');
    C.eq('… one history entry with both', [S.state.history[S.state.history.length - 1].aps, J(S.state.history[S.state.history.length - 1].bae)],
      [['om'], J({ rows: 2, approved: RE.rows[0][2] + RE.rows[1][2], authorized: RE.rows[0][3] + RE.rows[1][3] })]);
    C.chk('… the message names the pull and the report', has(r5.message, 'Imported O&M (2 rows).') && has(r5.message, 'Imported the BAE report “combined.xlsx” › “BAE”'), r5.message);

    // an identical report after a replacement keeps previous (the report before it)
    const r6 = S.applyImport(await S.parseFiles(files('combined.xlsx'), { now: T6 }));
    C.eq('the same report after a replacement: previous stays the one before it', [S.state.bae.previous.file, S.state.bae.current.sameSince], [UE.name, T5]);
    C.chk('… and the message says What changed still compares it with the report before it', has(r6.message, 'so What changed still compares it with the report before it'), r6.message);

    // SAVED AND REOPENED: the reports come back byte for byte, a hostile name included
    S.applyImport(await S.parseFiles(files(RE.name), { now: T7 }));
    C.chk('the hostile name is in the state as text', S.state.bae.current.rows.some(r => r.c[0].includes('</script>')));
    const html = S.savedHtml();
    const re = loadTool({ html });
    const ri = re.SP.storeInit();
    C.chk('saved and reopened: it opens', ri.ok === true, J(ri));
    C.eq('saved and reopened: the state, the reports with it, deeply equal', J(re.SP.state), J(S.state));
    C.chk('saved and reopened: the opening message names the report', has(ri.message, 'It holds the BAE report “' + RE.name + '” › “Sheet1” (dated 2026-01-31 12:00).'), ri.message);
    C.eq('saved, reopened and saved again: the page is the same, byte for byte', re.SP.savedHtml(), html);
    C.chk('saved and reopened: nothing unsaved', re.SP.isDirty() === false);
    C.eq('saved and reopened: no script errors', re.errors, []);
    re.close();

    // a saved plan holding only a report is taken whole
    const solo = loadTool({ modules: STORE });
    solo.SP.storeInit();
    solo.SP.applyImport(await solo.SP.parseFiles(files(RE.name), { now: T1 }));
    const soloHtml = solo.SP.savedHtml();
    solo.close();
    const tk = loadTool({ modules: STORE });
    tk.SP.storeInit();
    const tr = tk.SP.takePlan(soloHtml, 'solo.html');
    C.chk('a saved plan holding only a BAE report is taken, saying it holds the report', tr.ok === true && has(tr.message, '(the BAE report)')
      && has(tr.message, 'BAE reports'), J(tr));
    C.eq('… with its report', tk.SP.state.bae.current && tk.SP.state.bae.current.file, RE.name);
    tk.close();
    s.close();
  }

  // one row that cannot be read, beside a total that agrees, on an empty page: the warning is that row's
  {
    const s = loadTool({ modules: STORE });
    s.SP.storeInit();
    const r = s.SP.applyImport(await s.SP.parseFiles(files('badrow.xlsx'), { now: T1 }));
    C.chk('a report with a row that cannot be read imports, as a warning that says so', r.ok === true && r.warn === true
      && has(r.message, '1 row of the BAE report could not be read (Budget Name, FY or an amount): it is kept and counted nowhere') && !has(r.message, 'Check:'), J(r));
    C.eq('… the row is kept in the report, marked', s.SP.state.bae.current.rows.map(x => !!x.bad), [false, true]);
    s.close();
  }

  // A REPORT KEPT OVER A LATER IMPORT OF PULLS: that import's report says nothing of it, so its unreadable rows are listed
  // from the stored report (SP.baeKeptLines), and a pull import leaves the report on screen and in previous as it was
  {
    const s = loadTool({ modules: STORE });
    const S = s.SP;
    S.storeInit();
    S.applyImport(await S.parseFiles(files('badrow.xlsx'), { now: T1 }));
    C.eq('kept: the import that brought the report lists it itself, so baeKeptLines says nothing', S.baeKeptLines(S.state.bae.current, S.state.lastImport.report), []);
    const baeBefore = J(S.state.bae);
    const rp = S.applyImport(await S.parseFiles(files('pull-om.xlsx'), { now: T2 }));
    C.eq('kept: an import of pulls alone leaves the reports as they were', J(S.state.bae), baeBefore);
    C.chk('kept: … and its message says nothing of a report', !has(rp.message, 'BAE'), rp.message);
    C.chk('kept: … and its history entry has no bae', !('bae' in S.state.history[S.state.history.length - 1]));
    const K = S.baeKeptLines(S.state.bae.current, S.state.lastImport.report).join('\n');
    C.chk('kept: the report on screen is listed from the stored rows, its import named', has(K, 'BAE report of budgets on screen, kept from an earlier import (2026-11-02 ')
      && has(K, '“badrow.xlsx” › “Sheet1”, with no date in its file name'), K);
    C.chk('kept: its unreadable row in full, from the stored row', has(K, 'Unreadable rows (kept, counted in no figure): 1.')
      && has(K, '“badrow.xlsx” › “Sheet1” row 3: Budget Approved Amount ($M) “n/a” is not an amount') && has(K, 'Budget Approved Amount ($M) “n/a”, Budget Authorized Amount ($M) $0.00.'), K);
    C.chk('kept: the total check, worked out again from the stored rows', has(K, 'Total row (row 4') && has(K, 'it agrees (within $1 each)'), K);
    C.eq('kept: no report, no lines', [S.baeKeptLines(null, null), S.baeKeptLines({ rows: 'x' }, null)], [[], []]);
    s.close();
  }

  // a report-only import into a page holding unidentified rows leaves them exactly where they are
  {
    const s = loadTool({ modules: STORE });
    const S = s.SP;
    S.storeInit();
    S.applyImport(await S.parseFiles(files('pull-mixed.xlsx'), { now: T1 }));
    const unid = J(S.state.pulls.current.unidentified.rows);
    const ru = S.applyImport(await S.parseFiles(files(RE.name), { now: T2 }));
    C.chk('report alone: the message says nothing of the rows of no appropriation, which it did not touch', !has(ru.message, 'not identified'), ru.message);
    C.eq('report alone: the rows of no appropriation stay current, row for row', J(S.state.pulls.current.unidentified.rows), unid);
    C.chk('report alone: they are not moved to previous', !S.state.pulls.previous.unidentified);
    C.eq('report alone: they keep the time of the import they came with', S.state.pulls.current.unidentified.importedAt, T1);
    s.close();
  }
} catch (e) {
  C.chk('the test ran to the end', false, (e && e.stack) || String(e));
} finally {
  tmp.rm();
}
C.done();
