#!/usr/bin/env python3
# Writes the import test's workbooks into the directory given, with openpyxl and by hand with zipfile: an independent
# writer, so the tool's reader is never tested only against itself. Run with python3 -I. Deterministic. Every value is
# invented; nothing comes from a real pull.
#
#   python3 -I spend-plan/test/import-fixtures.py OUTDIR
#
# Besides the workbooks it writes expect.json: the rows as written, with what each must read as, and Excel serials worked
# out by openpyxl's own date conversion (the oracle for the tool's serial reading).
import sys, os, json, random, zipfile, datetime
import openpyxl
from openpyxl.utils.datetime import from_excel, CALENDAR_MAC_1904, CALENDAR_WINDOWS_1900
from openpyxl.styles import Font

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
H = ['FY','Month','CCaR No','Title','Budget','C/L','SB','Plan Event','Date','Amount','Alloc','Event Description',
  'OPR','PMT PID#','Contracting POC','Material Lead','PM/TPOC','Obligation Category','PMO','Sub-PMO','Category','Navy SI Code',
  'IPT','Spares WBS','Quantity','CLINs','AF EEIC','RCN','PSR','CSR','Contract Mod','Cost Element']
D = datetime.datetime
EXEC = 'Actual Execution is allocated to a Plan Event'
NA = 'Not Allocated'
HOSTILE_PE = '</script><img src=x onerror=alert(1)>'
HOSTILE_TITLE = '<b>&"\''
expect = {}

def row(**kw):
    r = {h: None for h in H}
    r.update({'FY': 2026, 'Month': D(2025, 11, 1), 'CCaR No': 'TST-0001', 'Title': 'Test Title A', 'Budget': 'USAF O&M- Fixture Line Discretionary AV',
              'Plan Event': 'Test PE A', 'Date': D(2025, 11, 15), 'Amount': 100, 'Alloc': EXEC, 'PMO': 'Air Vehicle (AV)'})
    for k, v in kw.items():
        r[k.replace('_', ' ') if k not in r else k] = v
    return r

# ---------------------------------------------------------------------------------------------------------------------
# hdr1.xlsx: one sheet "Report", the header on ROW 1 in a SHUFFLED column order, an extra column, v12's two formula
# columns, every amount, FY and date form, unreadable rows, blank formula-style rows, and hostile text.
# Each data row carries "exp": what it must read as. cents None = unreadable amount; fy None = unreadable FY.
# ---------------------------------------------------------------------------------------------------------------------
R1 = []
def add(r, **e): r['__exp'] = e; R1.append(r)
add(row(Amount=1000),                                                     cents=100000, how='number', fy=2026, date='2025-11-15', month='2025-11-01')
add(row(FY='2026', Date='2025-12-31', Amount='$0.00', Alloc=NA),            cents=0, how='dollar', fy=2026, date='2025-12-31')
add(row(FY='FY26', Date='1/5/2026', Amount='1,234.50'),                    cents=123450, how='text', fy=2026, date='2026-01-05')
add(row(FY='FY2026', Date='5 Feb 2026', Amount=' -1234 '),                 cents=-123400, how='text', fy=2026, date='2026-02-05')
add(row(FY=2025, Date='Mar-2026', Amount='(1,234.56)'),                    cents=-123456, how='paren', fy=2025, date='2026-03-01')
add(row(Amount='-$1,234.56', Date='26-Nov-2025'),                          cents=-123456, how='dollar', fy=2026, date='2025-11-26')
add(row(Amount='$(1,234.56)', Date='2026-04-30'),                          cents=-123456, how='paren', fy=2026, date='2026-04-30')
add(row(Amount='1.005'),                                                   cents=101, how='subcent', fy=2026)
add(row(Amount=12.345),                                                    cents=1235, how='subcent', fy=2026)
add(row(Amount=None),                                                      cents=0, how='blank', fy=2026)
add(row(Amount=1234.56),                                                   cents=123456, how='number', fy=2026)
add(row(Amount=-0.01),                                                     cents=-1, how='number', fy=2026)
add(row(Amount='twelve'),                                                  cents=None, how='bad', fy=2026, bad=['Amount'])
add(row(FY='abc', Amount=500),                                             cents=50000, how='number', fy=None, bad=['FY'])
add(row(FY=None, Amount=7),                                                cents=700, how='number', fy=None, bad=['FY'])
add(row(FY=1989, Amount=8),                                                cents=800, how='number', fy=None, bad=['FY'])
add(row(Date='31/31/2026', Amount=9),                                      cents=900, how='number', fy=2026, date='', dateBad='31/31/2026')
add(row(Date='2026-02-30', Amount=10),                                     cents=1000, how='number', fy=2026, date='', dateBad='2026-02-30')
add(row(Date=None, Amount=11),                                             cents=1100, how='number', fy=2026, date='')
add(row(**{'Plan Event': HOSTILE_PE, 'Title': HOSTILE_TITLE, 'Amount': 12}), cents=1200, how='number', fy=2026, pe=HOSTILE_PE, title=HOSTILE_TITLE)
add(row(Title='  Spaced Title  ', Amount=13),                              cents=1300, how='number', fy=2026, title='Spaced Title')
add(row(Alloc=None, Amount=14),                                            cents=1400, how='number', fy=2026, status='other', statusLabel='(blank)')
add(row(Alloc='Unprogrammed - Pending Allocation', Amount=15),             cents=1500, how='number', fy=2026, status='unprog')
add(row(Alloc='Forecast - Planned', Amount=16),                            cents=1600, how='number', fy=2026, status='fcst')
add(row(Alloc='Some Other Status', Amount=17),                             cents=1700, how='number', fy=2026, status='other', statusLabel='Some Other Status')
add(row(Budget='USAF BOS Discretionary AV', Amount=18),                    cents=1800, how='number', fy=2026, ap='unidentified')
add(row(Notes='kept note', Amount=19),                                     cents=1900, how='number', fy=2026, extra='kept note')
add(row(**{'CCaR No': 4321, 'AF EEIC': 57.5, 'Amount': 20}),               cents=2000, how='number', fy=2026, ccar='4321')
FORMULA_ROWS = 6     # rows holding only v12's formula columns: blank in all 32
STYLED_ROWS = 3      # rows holding only styled empty cells, or a whitespace-only value
LATE = row(**{'Plan Event': 'After the gap', 'Amount': 21})
LATE['__exp'] = dict(cents=2100, how='number', fy=2026, pe='After the gap')

cols = H + ['Notes', 'Svc (auto)', 'Inc (auto)']
random.Random(7).shuffle(cols)
wb = openpyxl.Workbook()
ws = wb.active
ws.title = 'Report'
ws.append(cols)
def put(r):
    ws.append([r.get(c) for c in cols])
for r in R1: put(r)
ci_svc = cols.index('Svc (auto)') + 1
ci_inc = cols.index('Inc (auto)') + 1
for k in range(FORMULA_ROWS):
    rr = ws.max_row + 1
    ws.cell(rr, ci_svc, '=IF(A%d="","",1)' % rr)
    ws.cell(rr, ci_inc, '=IF(A%d="","",1)' % rr)
for k in range(STYLED_ROWS):
    rr = ws.max_row + 1
    ws.cell(rr, 1).font = Font(bold=True)
    ws.cell(rr, 2).font = Font(bold=True)
    if k == 1: ws.cell(rr, cols.index('Title') + 1, '   ')
put(LATE)
wb.save(os.path.join(OUT, 'hdr1.xlsx'))
expect['hdr1'] = {
    'cols': cols, 'blank': FORMULA_ROWS + STYLED_ROWS,
    'rows': [dict(r['__exp'], rowNo=i + 2) for i, r in enumerate(R1)] + [dict(LATE['__exp'], rowNo=len(R1) + 2 + FORMULA_ROWS + STYLED_ROWS)],
}

# ---------------------------------------------------------------------------------------------------------------------
# hdr2.xlsx: a title row with the header on ROW 2, a report sheet with no header, a sheet named __proto__, a sheet the
# name of which decides nothing, a near-miss header, and the sheet-name fallback.
# ---------------------------------------------------------------------------------------------------------------------
wb = openpyxl.Workbook()
s = wb.active; s.title = 'Summary'
s.append(['F-35 Test Snapshot']); s.append([]); s.append(['Appropriation', 'FY', 'Approved', 'PMO']); s.append(['O&M', 2026, 1.5, 'x'])
def raw_tab(title, rows, hdr_row=2, extra_cols=('Svc (auto)', 'Inc (auto)')):
    t = wb.create_sheet(title)
    if hdr_row == 2: t.append([title.split(' Raw')[0] + ' - Raw Data Drop  (Paste fresh export here.)'])
    t.append(H + list(extra_cols))
    for r in rows: t.append([r.get(h) for h in H])
    return t
raw_tab('FF Raw Data', [
    row(Budget='USN APN Full Fund SUPT USMC CV FIXED Discretionary BOP', Amount=1001, **{'CCaR No': 'FF-1'}),
    row(Budget='USAF APN Full  Fund SUPT Mandatory AV', Amount=1002, **{'CCaR No': 'FF-2'}),
    row(Budget='USAF Misc Discretionary BOP', Amount=1003, **{'CCaR No': 'FF-3'}),      # no appropriation in the name: the sheet decides
])
raw_tab('__proto__', [row(Budget='USN OPN Ship Alts Discretionary MxS', Amount=2001, PMO='Maintenance Systems (MxS)')], hdr_row=1, extra_cols=())
raw_tab('Misc', [row(Budget='USAF BOS Discretionary', Amount=3001)], hdr_row=1, extra_cols=())
raw_tab('Spares Raw Data', [row(Budget='USN APN Spares Fixture CONG Discretionary PP', Amount=4001, FY=2024)])
near = wb.create_sheet('Near miss')
near.append([('Allocation' if h == 'Alloc' else h) for h in H]); near.append([1] * 32)
hdronly = wb.create_sheet('Header only')
hdronly.append(H)
wb.save(os.path.join(OUT, 'hdr2.xlsx'))

# disagree.xlsx: one "Spares Raw Data" sheet holding two Full Fund budgets and one Spares budget: a combined sheet is fine
wb = openpyxl.Workbook(); wb.remove(wb.active)
raw_tab('Spares Raw Data', [
    row(Budget='USN APN Full Fund SUPT Discretionary AV', Amount=5001),
    row(Budget='USN APN Full Fund SUPT Discretionary PP', Amount=5002),
    row(Budget='USN APN Spares Initial Discretionary AV', Amount=5003)])
wb.save(os.path.join(OUT, 'disagree.xlsx'))

# clash.xlsx: O&M rows on two sheets of one workbook (three on its own tab, one misfiled on the FF tab)
wb = openpyxl.Workbook(); wb.remove(wb.active)
raw_tab('O&M Raw Data', [row(Amount=1), row(Amount=2), row(Amount=3)])
raw_tab('FF Raw Data', [row(Budget='USAF APN Full Fund SUPT Discretionary AV', Amount=4),
                        row(Budget='USAF APN Full Fund SUPT Discretionary AV', Amount=5),
                        row(Budget='USAF O&M- Fixture Line Discretionary AV', Amount=6)])
wb.save(os.path.join(OUT, 'clash.xlsx'))
# clash-a.xlsx: O&M rows in another file (with clash-b.csv, written by the test, O&M arrives from two files)
wb = openpyxl.Workbook(); wb.active.title = 'O&M Raw Data'
wb.active.append(H)
for r in [row(Amount=7), row(Amount=8)]: wb.active.append([r.get(h) for h in H])
wb.save(os.path.join(OUT, 'clash-a.xlsx'))

# d1904.xlsx: the 1904 date system; dates written as date cells, so their serials count from 1904
wb = openpyxl.Workbook(); wb.epoch = CALENDAR_MAC_1904
ws = wb.active; ws.title = 'O&M Raw Data'; ws.append(H)
for r in [row(Date=D(2026, 3, 15), Month=D(2026, 3, 1), Amount=31), row(Date=D(2025, 10, 1), Month=D(2025, 10, 1), Amount=32)]:
    ws.append([r.get(h) for h in H])
wb.save(os.path.join(OUT, 'd1904.xlsx'))

# dupkey.xlsx: two columns headed Amount -- which holds the money is not something to guess
wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'O&M Raw Data'
ws.append(H + ['Amount']); ws.append([row().get(h) for h in H] + [999])
wb.save(os.path.join(OUT, 'dupkey.xlsx'))

# nodata.xlsx: only report-like sheets
wb = openpyxl.Workbook(); wb.active.title = 'Summary'; wb.active.append(['Nothing to import here'])
wb.save(os.path.join(OUT, 'nodata.xlsx'))

# ---------------------------------------------------------------------------------------------------------------------
# hand.xlsx, written by hand: every element with a namespace prefix (x:), date1904="true", a relationship Target given
# absolutely and before its Id, shared strings with rich runs, a phonetic run, an empty <x:t/> and _xHHHH_ codes, a
# stored (uncompressed) entry, a <row …/> with no cells, a cell with no reference, inline rich strings, and the cell
# types b, e, d and str. A second sheet points at a part that is not in the zip.
# ---------------------------------------------------------------------------------------------------------------------
NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
RNS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
def esc(s): return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')
sst = [esc(h) for h in H]                      # 0..31: the headers
sst[7] = None                                  # Plan Event as rich runs
SST_XML = []
for i, t in enumerate(sst):
    if i == 7: SST_XML.append('<x:si><x:r><x:t xml:space="preserve">Plan </x:t></x:r><x:r><x:rPr><x:b/></x:rPr><x:t>Event</x:t></x:r></x:si>')
    else: SST_XML.append('<x:si><x:t>%s</x:t></x:si>' % t)
SST_XML.append('<x:si><x:t>Phonetic Title</x:t><x:rPh sb="0" eb="1"><x:t>NOT THIS</x:t></x:rPh></x:si>')   # 32
SST_XML.append('<x:si><x:t/></x:si>')                                                                             # 33: ''
SST_XML.append('<x:si><x:t>Line_x000D_Two &amp; _x005F_x0041_ &#x41; _x0001_</x:t></x:si>')                     # 34
SST_XML.append('<x:si/>')                                                                                         # 35: ''
SST_XML.append('<x:si><x:t>Raw\r\nbreak, raw\rCR, kept &#13; and _x000D_</x:t></x:si>')                          # 36
sst_xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<x:sst xmlns:x="%s" count="%d" uniqueCount="%d">%s</x:sst>' % (NS, len(SST_XML), len(SST_XML), ''.join(SST_XML))
def L(i):  # column letters
    s = ''; n = i + 1
    while n: n, r = divmod(n - 1, 26); s = chr(65 + r) + s
    return s
hdr_cells = ''.join('<x:c r="%s1" t="s"><x:v>%d</x:v></x:c>' % (L(i), i) for i in range(32))
d1904 = lambda d: (d - D(1904, 1, 1)).days
row3 = ''.join([
    '<x:c r="A3"><x:v>2026</x:v></x:c>',
    '<x:c r="B3" t="d"><x:v>2026-01-01T00:00:00Z</x:v></x:c>',
    '<x:c r="C3" t="inlineStr"><x:is><x:t>HAND-1</x:t></x:is></x:c>',
    '<x:c r="D3" t="inlineStr"><x:is><x:r><x:t xml:space="preserve">Inline </x:t></x:r><x:r><x:t>Title</x:t></x:r></x:is></x:c>',
    '<x:c r="E3" t="inlineStr"><x:is><x:t>USAF O&amp;M- CAM Discretionary AV</x:t></x:is></x:c>',
    '<x:c t="b"><x:v>1</x:v></x:c>',                                        # no reference: column F, after E
    '<x:c r="G3" t="e"><x:v>#N/A</x:v></x:c>',
    '<x:c r="H3" t="inlineStr"><x:is><x:t>Hand PE</x:t></x:is></x:c>',
    '<x:c r="I3" t="d"><x:v>2026-01-31T00:00:00Z</x:v></x:c>',
    '<x:c r="J3"><x:v>4500.25</x:v></x:c>',
    '<x:c r="K3" t="inlineStr"><x:is><x:t>Not Allocated</x:t></x:is></x:c>',
    '<x:c r="L3" t="s"><x:v>36</x:v></x:c>',
    '<x:c r="S3" t="inlineStr"><x:is><x:t>Air Vehicle (AV)</x:t></x:is></x:c>',
])
row4 = ''.join([
    '<x:c r="A4" t="str"><x:f>2025+1</x:f><x:v>FY2026</x:v></x:c>',
    '<x:c r="B4"><x:v>%d</x:v></x:c>' % d1904(D(2026, 3, 1)),
    '<x:c r="C4" t="inlineStr"><x:is><x:t>HAND-2</x:t></x:is></x:c>',
    '<x:c r="D4" t="s"><x:v>32</x:v></x:c>',
    '<x:c r="E4" t="inlineStr"><x:is><x:t>USAF O&amp;M- CAM Discretionary AV</x:t></x:is></x:c>',
    '<x:c r="F4" t="s"><x:v>33</x:v></x:c>',
    '<x:c r="G4" t="s"><x:v>35</x:v></x:c>',
    '<x:c r="H4" t="s"><x:v>34</x:v></x:c>',
    '<x:c r="I4"><x:v>%d.75</x:v></x:c>' % d1904(D(2026, 3, 15)),
    '<x:c r="J4" t="str"><x:f>"$"&amp;"12.50"</x:f><x:v>$12.50</x:v></x:c>',
    '<x:c r="K4" t="inlineStr"><x:is><x:t>Actual Execution is allocated to a Plan Event</x:t></x:is></x:c>',
    '<x:c r="L4" t="b"><x:v>0</x:v></x:c>',
    '<x:c r="S4" t="inlineStr"><x:is><x:t>Air Vehicle (AV)</x:t></x:is></x:c>',
    '<x:c r="AG4" t="str"><x:f>"x"</x:f><x:v/></x:c>',
])
sheet_xml = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<x:worksheet xmlns:x="%s"><x:sheetData>'
    '<x:row r="1" spans="1:32">%s</x:row>'
    '<x:row r="2" ht="20" customHeight="1"/>'
    '<x:row r="3">%s</x:row>'
    '<x:row r="4" spans="1:33">%s</x:row>'
    '<x:row r="5"><x:c r="A5" s="1"/><x:c r="B5" s="1" /></x:row>'
    '</x:sheetData></x:worksheet>') % (NS, hdr_cells, row3, row4)
wb_xml = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<x:workbook xmlns:x="%s" xmlns:r="%s">'
    '<x:workbookPr date1904="true"/><x:sheets>'
    '<x:sheet name="O&amp;M Raw Data" sheetId="1" r:id="rId1"/>'
    '<x:sheet name="Ghost" sheetId="2" r:id="rId9"/>'
    '</x:sheets></x:workbook>') % (NS, RNS)
rels_xml = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Target="/xl/worksheets/sheet1.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Id="rId1"/>'
    '<Relationship Id="rId9" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/missing.xml"/>'
    '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>'
    '</Relationships>')
def zipit(path, parts):
    with zipfile.ZipFile(path, 'w') as z:
        for name, data, method in parts:
            z.writestr(zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0)), data, compress_type=method)
zipit(os.path.join(OUT, 'hand.xlsx'), [
    ('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>', zipfile.ZIP_DEFLATED),
    ('xl/workbook.xml', wb_xml, zipfile.ZIP_DEFLATED),
    ('xl/_rels/workbook.xml.rels', rels_xml, zipfile.ZIP_DEFLATED),
    ('xl/sharedStrings.xml', sst_xml, zipfile.ZIP_STORED),
    ('xl/worksheets/sheet1.xml', sheet_xml, zipfile.ZIP_DEFLATED),
])
# hand-badsst.xlsx: a cell pointing past the end of the shared-string table
zipit(os.path.join(OUT, 'hand-badsst.xlsx'), [
    ('xl/workbook.xml', wb_xml.replace('<x:sheet name="Ghost" sheetId="2" r:id="rId9"/>', ''), zipfile.ZIP_DEFLATED),
    ('xl/_rels/workbook.xml.rels', rels_xml, zipfile.ZIP_DEFLATED),
    ('xl/sharedStrings.xml', sst_xml, zipfile.ZIP_DEFLATED),
    ('xl/worksheets/sheet1.xml', sheet_xml.replace('<x:v>33</x:v>', '<x:v>999</x:v>'), zipfile.ZIP_DEFLATED),
])
expect['hand'] = {'month3': '2026-01-01', 'date3': '2026-01-31', 'month4': '2026-03-01', 'date4': '2026-03-15'}

# serials: what openpyxl's own conversion makes of each, in both date systems
ser = {}
for n in [1, 2, 59, 61, 366, 45658, 45962, 46022.75, 46295]:
    ser[str(n)] = {'1900': from_excel(n, CALENDAR_WINDOWS_1900).date().isoformat(), '1904': from_excel(n, CALENDAR_MAC_1904).date().isoformat()}
expect['serials'] = ser
expect['headers'] = H
with open(os.path.join(OUT, 'expect.json'), 'w') as f: json.dump(expect, f, indent=1, default=str)
print('fixtures written to', OUT)
