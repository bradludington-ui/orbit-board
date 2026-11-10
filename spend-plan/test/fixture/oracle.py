#!/usr/bin/env python3
# The INDEPENDENT ORACLE for the SFCB Spend Plan dashboard (builder A2).
#
# It reads CCaR pull files and computes, from those files alone, every figure CONTRACT.md §3–§5 defines, and writes
# expected.json (§12). It is written from the contract and from nothing in spend-plan/src: an oracle that shares the
# tool's reading of a rule shares the tool's mistakes, and then every comparison between the two passes whatever the
# rule really says. Python and openpyxl only, so not one line of the tool's JavaScript is reused even by accident.
#
#   python3 -I oracle.py --files F1 [F2 ...] [--then G1 G2 ...] --asof YYYY-MM --first YYYY
#                        [--svc-off NAME ...] [--lanes both|disc|mand] [--special CCAR ...] [--settings S.json]
#                        --out expected.json [--summary]
#   python3 -I oracle.py --scenario all|usaf-off|mand-only|disc-only|asof-2026-03|first-2024|gen2|layout
#                        --fixture DIR --out expected.json
#
# Run it with python3 -I: a pull is untrusted input, and -I keeps a planted module beside a file from being imported.
# Nothing is executed from a file; openpyxl reads cached values only (data_only) and never evaluates a formula.
#
# Readings this oracle takes where the contract leaves a choice are marked "READING:" so they can be argued about by
# name, never discovered as a silent disagreement.
#
# expected.json, every key (c = integer cents; x = a float ratio; labels are the §4.4 majority spellings):
#   asOf "YYYY-MM", E (execution year), firstFY, asOfIndex (1..12, Oct = 1), window {start, end} (ISO, end exclusive)
#   shown {services [names shown, 'Service not identified' included], lanes ['disc','mand'], all bool}
#   special   the special CCaRs as normKeys, sorted
#   showNoDate  true when some COUNTED row has no date
#   blocks {"ap|fy": Block}           every (ap, fy >= firstFY) with a row whose FY reads, whatever the switches
#     Block = {ap, fy, n, curve|null, approved, unprog, obligated, unobligated, authorized, authorizedEntered,
#              oblPct x|null, goal x|null, delta x|null, status 'green'|'yellow'|'red'|null, execAfterAsOf c,
#              cols   {prior, m1..m12, next, nodate: c}
#              cum    {prior..next: c (running sum), nodate: null}
#              obl    {col: [x|null, 'actual'|'plan'], nodate: [null, null]}
#              goalC  {col: x|null}                  (null for next and nodate, and everywhere when there is no curve)
#              statusC{col: [status|null, kind], nodate: [null, null]}   (kind is obl's kind)
#              pmos   {"<PMO>": {total c, cols {..}}}         over counted rows; '(no PMO)' for a blank PMO
#              titles {"<PMO>|<Title>": c}, pes {"<PMO>|<Title>|<Plan Event>": c},
#              ccars  {"<PMO>|<Title>|<Plan Event>|<CCaR>": c}        (no fixture label holds a '|')
#              na     [[colId, statusGroup, itemKey, c, label], ...]  in §5 order; statusGroup 'na'|'unprog'|'fcst'|
#                     'other:<label>'; itemKey 'CC:<ccar normKey>' or 'PE:<plan event normKey>'; $0 items left out}
#   aps {ap: {approved, authorized, obligated, unobligated, oblPct}}
#   summary {approved, authorized, obligated, unobligated, unprog, oblPct}
#   pmoTabs {"<PMO>": {"ap|fy": {approved, authorized (= approved), obligated, unobligated, unprog, oblPct, goal, delta,
#            status, execAfterAsOf, cols, na}}}   one per PMO with a counted row; only the blocks it has rows in
#   pmoCodes {"<PMO>": code}
#   excluded {beforeFirst c, beforeFirstRows, beforeFirstByFy {"2024": c}, unidentified c, unidentifiedRows,
#             unreadableRows}
#   execAfterAsOf {cents, rows}   rowsByAp {om, ff, sp, opn, unidentified: rows in each current pull, unreadable too}
#   crossChecks {bySvc|byLane|byStatus: {"ap|fy": {key: c}}}   NOT in the tool's model: for this suite's own checks
#   diff (only with --then) {ap: {byBlock {"ap|fy": {approved [before, after], obligated [before, after]}},
#             ccarsNew [normKeys], ccarsGone [normKeys], pmoMoves [[ccar normKey, from PMO label, to PMO label]]}}
#   refusedThen (only when the --then import was refused), input {files, then, svcOff, lanes}
# A refused first import writes {"refused": why, "stage": "files"} instead, and exits 3.
import argparse
import csv
import datetime as dt
import hashlib
import io
import json
import os
import re
import sys
from decimal import Decimal, ROUND_HALF_UP, InvalidOperation

import openpyxl
from openpyxl.utils.datetime import CALENDAR_MAC_1904

# ---------------------------------------------------------------------------------------------------------------- §2
APS = [('om', 'O&M', 'om'), ('ff', 'Full Fund', 'proc'), ('sp', 'Initial Spares', 'proc'), ('opn', 'OPN', 'proc')]
AP_IDS = [a[0] for a in APS]
AP_LABEL = {a[0]: a[1] for a in APS}
AP_TYPE = {a[0]: a[2] for a in APS}
SERVICES = ['USAF', 'USAF ANG', 'USAF AFRC', 'USMC B (STOVL)', 'USMC C (USMC CV)', 'USN (USN CV)']
SVC_UNKNOWN = 'Service not identified'
PMO_ORDER = ['Air Vehicle (AV)', 'Business Operations (BOP)', 'Combat Data Systems (CDS)', 'Maintenance Systems (MxS)',
             'Product Support Management (PSM)', 'Propulsion (PP)', 'Training Systems (TSS)']
RAW_HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc',
               'Event Description', 'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC',
               'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code', 'IPT', 'Spares WBS', 'Quantity',
               'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element']
REQUIRED = ['FY', 'CCaR No', 'Title', 'Budget', 'Plan Event', 'Date', 'Amount', 'Alloc', 'PMO']
FORMULA_COLS = ['Svc (auto)', 'Inc (auto)']        # v12's own formula columns: ignored, never kept as extras
SPECIAL_CCARS_DEFAULT = ['PP 2000', 'JSF6654']
GOALS_DEFAULT = {
    'om1': [0, .0833, .1667, .25, .3333, .4167, .5, .5833, .6667, .75, .8333, .9167, 1],
    'om2': [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    'p1': [0, .0667, .1333, .2, .2667, .3333, .4, .4667, .5333, .6, .6667, .7333, .8],
    'p2': [.8, .8083, .8167, .825, .8333, .8417, .85, .8583, .8667, .875, .8833, .8917, .9],
    'p3': [.9, .9083, .9167, .925, .9333, .9417, .95, .9583, .9667, .975, .9833, .9917, 1],
    'p4': [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]}
COLS = ['prior'] + ['m%d' % i for i in range(1, 13)] + ['next', 'nodate']
RUN_COLS = COLS[:-1]          # the running sum (cum) is over prior, m1..m12, next; nodate is outside it (§4.5)
MONTH_ABBR = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
EPS = 1e-12


class Refused(Exception):
    """An import the contract says must change nothing (§3): the message names why, as the tool's would."""


def norm_key(s):
    # §2 normKey: String(s ?? ''), trimmed, every run of whitespace (non-breaking spaces included) one space, lower-cased.
    # Python's \s on str matches Unicode whitespace, U+00A0 included, as JavaScript's \s does.
    return re.sub(r'\s+', ' ', ('' if s is None else str(s)).strip()).lower()


def is_blank(v):
    return v is None or (isinstance(v, str) and v.strip() == '')


# ---------------------------------------------------------------------------------------------------------------- §3
def js_string(v):
    # A non-text value in a text column becomes text the way the tool's String(v) would print it: an integer-valued
    # number without ".0", so a CLIN typed as the number 1 is "1" in both tools.
    if v is None:
        return ''
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, int):
        return str(v)
    if isinstance(v, float):
        return str(int(v)) if v.is_integer() and abs(v) < 1e21 else repr(v)
    if isinstance(v, (dt.datetime, dt.date)):
        # READING: a date-formatted cell in a text column. The tool's reader returns the serial number for a numeric
        # cell; openpyxl returns a date. Never in a field the model reads; printed as ISO here.
        return v.date().isoformat() if isinstance(v, dt.datetime) else v.isoformat()
    return str(v)


def parse_fy(v):
    """§3: a whole number 1990–2100, or text '2026' / 'FY26' / 'FY2026'. Anything else is unreadable (None)."""
    if v is None or isinstance(v, bool):
        return None
    if isinstance(v, (int, float)) and not isinstance(v, bool):
        if isinstance(v, float) and not v.is_integer():
            return None
        n = int(v)
        return n if 1990 <= n <= 2100 else None
    if isinstance(v, str):
        s = v.strip()
        m = re.fullmatch(r'(\d{4})', s)
        if m:
            n = int(m.group(1))
            return n if 1990 <= n <= 2100 else None
        m = re.fullmatch(r'[Ff][Yy](\d{2})', s)
        if m:
            return 2000 + int(m.group(1))
        m = re.fullmatch(r'[Ff][Yy](\d{4})', s)
        if m:
            n = int(m.group(1))
            return n if 1990 <= n <= 2100 else None
        return None
    return None        # a date cell, or anything else, is not a fiscal year


def _ymd(y, m, d):
    try:
        return dt.date(y, m, d).isoformat()
    except ValueError:
        return ''


def parse_date(v, date1904):
    """§3 Month/Date: an Excel serial (using date1904), a date cell, or text YYYY-MM-DD, M/D/YYYY, D Mon YYYY,
    Mon-YYYY (the first of the month). The result is ISO, or '' when blank or unreadable."""
    if v is None or isinstance(v, bool):
        return ''
    if isinstance(v, dt.datetime):
        return v.date().isoformat()
    if isinstance(v, dt.date):
        return v.isoformat()
    if isinstance(v, (int, float)):
        # openpyxl hands back a number for a serial in a General cell; the serial's whole part is the day
        n = int(v // 1)
        if date1904:
            if n < 0:
                return ''
            return (dt.date(1904, 1, 1) + dt.timedelta(days=n)).isoformat()
        if n < 1:
            return ''
        if n < 60:                        # Excel's 1900 system counts a 29 Feb 1900 that never was (serial 60)
            return (dt.date(1899, 12, 31) + dt.timedelta(days=n)).isoformat()
        if n == 60:
            return ''
        return (dt.date(1899, 12, 30) + dt.timedelta(days=n)).isoformat()
    if isinstance(v, str):
        s = v.strip()
        if s == '':
            return ''
        m = re.fullmatch(r'(\d{4})-(\d{2})-(\d{2})', s)
        if m:
            return _ymd(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        m = re.fullmatch(r'(\d{1,2})/(\d{1,2})/(\d{4})', s)
        if m:
            return _ymd(int(m.group(3)), int(m.group(1)), int(m.group(2)))
        m = re.fullmatch(r'(\d{1,2}) ([A-Za-z]{3}) (\d{4})', s)
        if m and m.group(2).lower() in MONTH_ABBR:
            return _ymd(int(m.group(3)), MONTH_ABBR.index(m.group(2).lower()) + 1, int(m.group(1)))
        m = re.fullmatch(r'([A-Za-z]{3})-(\d{4})', s)
        if m and m.group(1).lower() in MONTH_ABBR:
            return _ymd(int(m.group(2)), MONTH_ABBR.index(m.group(1).lower()) + 1, 1)
        return ''
    return ''


_NUM_RE = re.compile(r'(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?|\.(\d+)')


def _cents_of(dec):
    """Decimal dollars -> (whole cents rounded half away from zero, rounded?)."""
    c = dec * 100
    r = c.quantize(Decimal(1), rounding=ROUND_HALF_UP)       # ROUND_HALF_UP is half AWAY from zero in decimal
    return int(r), r != c


def parse_amount(v):
    """§2 parseAmount -> (cents | None, how). A number's value is its shortest decimal form (the text Excel wrote),
    never its binary approximation: 123456.78 is 12345678 cents, and 10.125 is a sub-cent value rounded to 1013."""
    if v is None:
        return 0, 'blank'
    if isinstance(v, bool):
        return None, 'bad'
    if isinstance(v, int):
        return v * 100, 'number'
    if isinstance(v, float):
        if v != v or v in (float('inf'), float('-inf')):
            return None, 'bad'
        cents, rounded = _cents_of(Decimal(repr(v)))
        return cents, ('subcent' if rounded else 'number')
    if not isinstance(v, str):
        return None, 'bad'
    s = v.strip()
    if s == '':
        return 0, 'blank'
    neg = dollar = paren = False
    if s.startswith('-'):
        neg, s = True, s[1:].strip()
    if s.startswith('$'):
        dollar, s = True, s[1:].strip()
    if len(s) >= 2 and s.startswith('(') and s.endswith(')'):
        paren, s = True, s[1:-1].strip()
        if s.startswith('$') and not dollar:
            dollar, s = True, s[1:].strip()
    if neg and paren:
        return None, 'bad'
    m = _NUM_RE.fullmatch(s)
    if not m:
        return None, 'bad'
    txt = s.replace(',', '')
    try:
        dec = Decimal(txt)
    except InvalidOperation:
        return None, 'bad'
    if neg or paren:
        dec = -dec
    cents, rounded = _cents_of(dec)
    if rounded:
        return cents, 'subcent'
    return cents, ('paren' if paren else 'dollar' if dollar else 'text')


def read_csv_text(text):
    # §3 readCsv: RFC 4180 (quoted fields, doubled quotes, newlines inside quotes) after stripping a byte-order mark
    if text.startswith('\ufeff'):
        text = text[1:]
    return [list(r) for r in csv.reader(io.StringIO(text, newline=''))]


def read_file(path):
    """-> (sheets [(name, rows)], date1904). A CSV is one sheet named after its file (READING: the contract names
    no sheet for a CSV; only the Budget text decides a fixture CSV row's appropriation, so the name never matters)."""
    name = os.path.basename(path)
    if name.lower().endswith('.csv'):
        with open(path, 'rb') as f:
            raw = f.read()
        return [(name, read_csv_text(raw.decode('utf-8')))], False
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    date1904 = wb.epoch == CALENDAR_MAC_1904
    sheets = []
    for ws in wb.worksheets:
        sheets.append((ws.title, ws))
    return sheets, date1904


def iter_sheet_rows(rows_or_ws):
    if isinstance(rows_or_ws, list):
        for r in rows_or_ws:
            yield list(r)
    else:
        for r in rows_or_ws.iter_rows(values_only=True):
            yield list(r)


def find_header(rows_iter):
    """§3: the first row within the first 15 holding every one of REQUIRED by name (normKey). -> (index, row, buffered)"""
    req = {norm_key(h) for h in REQUIRED}
    buffered = []
    for i, r in enumerate(rows_iter):
        buffered.append(r)
        names = {norm_key(c) for c in r if not is_blank(c)}
        if req <= names:
            return i, r, buffered
        if i >= 14:
            break
    return None, None, buffered


AP_BUDGET_RULES = [(re.compile(r'spares', re.I), 'sp'), (re.compile(r'full\s*fund', re.I), 'ff'),
                   (re.compile(r'\bopn\b', re.I), 'opn'), (re.compile(r'o&m', re.I), 'om')]


def ap_of_budget(budget):
    for rx, ap in AP_BUDGET_RULES:
        if rx.search(budget):
            return ap
    return None


def ap_of_sheet(sheet):
    # READING: 'O&M Raw Data' is matched whole (normKey); 'FF' and 'OPN' as written, 'Full Fund' and 'Spares' in any
    # case. The fixture names its sheets exactly as v12 does, so a looser reading decides every fixture row the same.
    if norm_key(sheet) == 'o&m raw data':
        return 'om'
    if 'FF' in sheet or 'full fund' in sheet.lower():
        return 'ff'
    if 'spares' in sheet.lower():
        return 'sp'
    if 'OPN' in sheet:
        return 'opn'
    return None


def parse_files(paths):
    """§3 parseFiles. -> {'pulls': {ap: [row]}, 'report': {...}}; raises Refused when the contract refuses the import."""
    seen = {}
    for p in paths:
        with open(p, 'rb') as f:
            h = hashlib.sha256(f.read()).hexdigest()
        if h in seen:
            raise Refused('the same file was given twice: %s and %s' % (os.path.basename(seen[h]), os.path.basename(p)))
        seen[h] = p
    known = {norm_key(h): h for h in RAW_HEADERS}
    formula = {norm_key(h) for h in FORMULA_COLS}
    rows_out = []                 # every data row, in file order, sheet order, row order (§3 Row order)
    report = {'files': [], 'skippedBlank': 0, 'unreadable': [], 'refusedFiles': []}
    for fi, p in enumerate(paths):
        sheets, date1904 = read_file(p)
        frep = {'name': os.path.basename(p), 'sheets': []}
        usable = 0
        for sname, src in sheets:
            it = iter_sheet_rows(src)
            hi, hrow, _buf = find_header(it)
            if hi is None:
                frep['sheets'].append({'name': sname, 'used': False, 'why': 'no header row in the first 15 rows'})
                continue
            usable += 1
            colmap = {}                       # known header -> column index (first occurrence wins)
            extras = {}
            for ci, hv in enumerate(hrow):
                if is_blank(hv):
                    continue
                k = norm_key(hv)
                if k in known:
                    colmap.setdefault(known[k], ci)
                elif k in formula:
                    continue
                else:
                    extras.setdefault(str(hv).strip(), ci)
            n_rows = 0
            row_no = hi + 1                   # 1-based number of the header row
            for r in it:
                row_no += 1
                vals = {h: (r[colmap[h]] if h in colmap and colmap[h] < len(r) else None) for h in RAW_HEADERS}
                if all(is_blank(v) for v in vals.values()):
                    report['skippedBlank'] += 1
                    continue
                n_rows += 1
                rows_out.append(type_row(vals, {e: (r[ci] if ci < len(r) else None) for e, ci in extras.items()},
                                         (fi, sname, row_no), date1904))
            frep['sheets'].append({'name': sname, 'used': True, 'headerRow': hi + 1, 'rows': n_rows,
                                   'extras': sorted(extras)})
        if usable == 0:
            report['refusedFiles'].append(os.path.basename(p))
        report['files'].append(frep)
    if not any(s['used'] for f in report['files'] for s in f['sheets']):
        raise Refused('no file in this import has a sheet with the CCaR headers (%s)' % ', '.join(REQUIRED))
    pulls = {}
    sources = {}
    for row in rows_out:
        ap = row['apRaw']
        pulls.setdefault(ap or 'unidentified', []).append(row)
        if ap:
            key = (row['src'][0], row['src'][1])
            sources.setdefault(ap, {}).setdefault(key, 0)
            sources[ap][key] += 1
        if row['bad']:
            report['unreadable'].append({'src': list(row['src']), 'bad': row['bad']})
    for ap, srcs in sources.items():
        if len(srcs) > 1:
            parts = ['%s / %s: %d rows' % (os.path.basename(paths[fi]), sh, n) for (fi, sh), n in srcs.items()]
            raise Refused('%s rows come from more than one sheet (%s); one sheet per appropriation per import'
                          % (AP_LABEL[ap], '; '.join(parts)))
    return {'pulls': pulls, 'report': report}


def type_row(vals, extras, src, date1904):
    bad = []
    fy = parse_fy(vals['FY'])
    if fy is None:
        bad.append('FY')
    cents, how = parse_amount(vals['Amount'])
    if cents is None:
        bad.append('Amount')
    date = parse_date(vals['Date'], date1904)
    txt = {h: js_string(vals[h]).strip() for h in RAW_HEADERS if h not in ('FY', 'Month', 'Date', 'Amount')}
    row = {'src': src, 'bad': bad, 'fy': fy, 'cents': cents, 'how': how, 'date': date,
           'month': parse_date(vals['Month'], date1904),
           'ccar': txt['CCaR No'], 'title': txt['Title'], 'budget': txt['Budget'], 'pe': txt['Plan Event'],
           'alloc': txt['Alloc'], 'pmo': txt['PMO'], 'extras': extras}
    ap = ap_of_budget(row['budget'])
    if ap is None:
        ap = ap_of_sheet(src[1])
    row['apRaw'] = ap
    return row


# §3 deriveRow
SVC_RULES = [(re.compile(r'\bAFRC\b', re.I), 'USAF AFRC'), (re.compile(r'\bANG\b', re.I), 'USAF ANG'),
             (re.compile(r'STOVL', re.I), 'USMC B (STOVL)'), (re.compile(r'USMC\s+CV', re.I), 'USMC C (USMC CV)'),
             (re.compile(r'USN\s+CV', re.I), 'USN (USN CV)'), (re.compile(r'^\s*USN\b', re.I), 'USN (USN CV)'),
             (re.compile(r'^\s*USAF\b', re.I), 'USAF')]


def svc_of(budget, settings):
    ov = settings['budgets'].get(norm_key(budget), {})
    if ov.get('svc'):
        return ov['svc']
    for rx, svc in SVC_RULES:
        if rx.search(budget):
            return svc
    return SVC_UNKNOWN


def lane_of(budget, settings):
    ov = settings['budgets'].get(norm_key(budget), {})
    if ov.get('lane'):
        return ov['lane']
    return 'mand' if re.search(r'\bmandatory\b', budget, re.I) else 'disc'


def status_of_alloc(alloc):
    a = alloc.strip()
    lo = a.lower()
    if re.match(r'actual execution', lo):
        return 'exec', 'Actual Execution'
    if re.fullmatch(r'not allocated', lo):
        return 'na', 'Not Allocated'
    if re.match(r'unprogrammed', lo):
        return 'unprog', 'Unprogrammed'
    if re.match(r'forecast', lo):
        return 'fcst', 'Forecast'
    if a == '':
        return 'other', '(blank)'
    return 'other', a


def derive(row, ap, settings):
    st, lbl = status_of_alloc(row['alloc'])
    d = dict(row)
    d.update({'ap': ap, 'status': st, 'statusLabel': lbl, 'svc': svc_of(row['budget'], settings),
              'lane': lane_of(row['budget'], settings),
              'k': {'pmo': norm_key(row['pmo']), 'title': norm_key(row['title']), 'pe': norm_key(row['pe']),
                    'ccar': norm_key(row['ccar'])}})
    return d


# ---------------------------------------------------------------------------------------------------------------- §4
def first_of_next_month(y, m):
    return (y + 1, 1) if m == 12 else (y, m + 1)


def majority(spellings):
    """§4.4: the spelling most rows use; a tie goes to the first spelling met in row order."""
    counts, first = {}, {}
    for i, s in enumerate(spellings):
        counts[s] = counts.get(s, 0) + 1
        first.setdefault(s, i)
    return max(counts, key=lambda s: (counts[s], -first[s]))


def label_of(rows, field, blank):
    lbl = majority([r[field] for r in rows])
    return lbl if lbl != '' else blank


def pmo_code(label):
    # §4.6 code: the text in the name's parentheses (READING: the first pair), else its first 12 characters
    m = re.search(r'\(([^()]*)\)', label)
    return m.group(1) if m else label[:12]


def pmo_key_rank(key):
    # the PMO order by key alone (§4.6, a CCaR's PMO in a tie): PMO_ORDER first, then by the key in UTF-16 code-unit
    # order (the tool's comparison; big-endian UTF-16 bytes compare the same way), (no PMO) last
    order = [norm_key(p) for p in PMO_ORDER]
    if key in order:
        return (0, order.index(key), b'')
    if key == '':
        return (2, 0, b'')
    return (1, 0, key.encode('utf-16-be'))


def pmo_sort_key(key, label):
    order = [norm_key(p) for p in PMO_ORDER]
    if key in order:
        return (0, order.index(key), '')
    if key == '':
        return (2, 0, '')
    return (1, 0, label)


class Model:
    def __init__(self, settings, view):
        self.settings = settings
        self.view = view
        y, m = map(int, settings['asOf'].split('-'))
        self.E = y + 1 if m >= 10 else y
        self.wstart = '%04d-10-01' % (self.E - 1)
        self.wend = '%04d-10-01' % self.E
        self.asof_idx = (m - 10) % 12 + 1           # Oct is m1, Sep is m12
        ny, nm = first_of_next_month(y, m)
        self.asof_next = '%04d-%02d-01' % (ny, nm)  # "dated after the as-of month's last day" = on or after this
        # each column's end: prior ends where the window starts; m_k ends on the first of the next month
        self.col_end = {'prior': self.wstart}
        cy, cm = self.E - 1, 10
        for k in range(1, 13):
            ey, em = first_of_next_month(cy, cm)
            self.col_end['m%d' % k] = '%04d-%02d-01' % (ey, em)
            cy, cm = ey, em
        self.closed = {c: (c == 'prior' or (c.startswith('m') and int(c[1:]) <= self.asof_idx)) for c in COLS}
        self.special = {norm_key(s) for s in settings['special']}

    def col_of(self, date):
        if date == '':
            return 'nodate'
        if date < self.wstart:
            return 'prior'
        if date >= self.wend:
            return 'next'
        y, m = int(date[:4]), int(date[5:7])
        return 'm%d' % ((y - (self.E - 1)) * 12 + (m - 10) + 1)

    def shown(self, r):
        return self.view['svc'].get(r['svc'], True) and self.view['lane'].get(r['lane'], True)

    def counts(self, r):
        # §4.3: readable, appropriation identified (rows reach here only from an identified pull), fy >= firstFY, shown
        return (not r['bad']) and r['fy'] >= self.settings['firstFY'] and self.shown(r)

    def curve_of(self, ap, n):
        if n <= 0:
            return None
        if AP_TYPE[ap] == 'om':
            return 'om1' if n == 1 else 'om2'
        return 'p%d' % min(n, 4)

    @staticmethod
    def status_of(pct, goal):
        if pct is None or goal is None:
            return None
        if pct >= goal - EPS:
            return 'green'
        if goal - pct <= 0.10 + EPS:
            return 'yellow'
        return 'red'

    def figures(self, ap, fy, rows):
        """§4.5 over `rows` (the counted rows of a block, or of one PMO within it)."""
        cols = {c: 0 for c in COLS}
        approved = unprog = obligated = after = 0
        for r in rows:
            c = self.col_of(r['date'])
            cols[c] += r['cents']
            approved += r['cents']
            if r['status'] == 'unprog':
                unprog += r['cents']
            if r['status'] == 'exec':
                obligated += r['cents']
                if r['date'] != '' and r['date'] >= self.asof_next:
                    after += r['cents']
        cum, run = {}, 0
        for c in RUN_COLS:
            run += cols[c]
            cum[c] = run
        cum['nodate'] = None      # READING: nodate is outside the running sum, so it has no cumulative figure
        n = self.E - fy + 1
        curve = self.curve_of(ap, n)
        goals = self.settings['goals'][curve] if curve else None
        goal = goals[self.asof_idx] if goals else None
        obl_pct = (obligated / approved) if approved != 0 else None
        delta = (obl_pct - goal) if (obl_pct is not None and goal is not None) else None
        obl, goal_c, status_c = {}, {}, {}
        for i, c in enumerate(COLS):
            if c == 'nodate':
                obl[c] = [None, None]
                goal_c[c] = None
                status_c[c] = [None, None]
                continue
            if self.closed[c]:
                end = self.col_end[c]
                ex = sum(r['cents'] for r in rows if r['status'] == 'exec' and r['date'] != '' and r['date'] < end)
                v = (ex / approved) if approved != 0 else None
                kind = 'actual'
            else:
                v = (cum[c] / approved) if approved != 0 else None
                kind = 'plan'
            obl[c] = [v, kind]
            goal_c[c] = (goals[i] if (goals and c != 'next') else None)
            status_c[c] = [self.status_of(v, goal_c[c]), kind]
        key = '%s|%d' % (ap, fy)
        auth_entered = key in self.settings['authorized']
        authorized = self.settings['authorized'][key] if auth_entered else approved
        return {'ap': ap, 'fy': fy, 'n': n, 'curve': curve, 'approved': approved, 'unprog': unprog,
                'obligated': obligated, 'unobligated': approved - obligated, 'authorized': authorized,
                'authorizedEntered': auth_entered, 'oblPct': obl_pct, 'goal': goal, 'delta': delta,
                'status': self.status_of(obl_pct, goal), 'execAfterAsOf': after,
                'cols': cols, 'cum': cum, 'obl': obl, 'goalC': goal_c, 'statusC': status_c}

    def tree(self, rows):
        """§4.4 PMO -> Title -> Plan Event -> CCaR, grouped by normKey, labelled by the majority spelling."""
        pm = {}
        for r in rows:
            k = r['k']
            pm.setdefault(k['pmo'], {}).setdefault(k['title'], {}).setdefault(k['pe'], {}).setdefault(k['ccar'], []).append(r)
        out = {'pmos': {}, 'titles': {}, 'pes': {}, 'ccars': {}}
        order = []
        for pk, titles in pm.items():
            prows = sorted([r for t in titles.values() for p in t.values() for cc in p.values() for r in cc],
                           key=lambda r: r['_i'])
            order.append((pmo_sort_key(pk, label_of(prows, 'pmo', '(no PMO)')), pk, titles, prows))
        # written in §4.4 PMO order (the list first, others by label, '(no PMO)' last); the order is for reading only
        for _sk, pk, titles, prows in sorted(order, key=lambda o: o[0]):
            plabel = label_of(prows, 'pmo', '(no PMO)')
            pcols = {c: 0 for c in COLS}
            for r in prows:
                pcols[self.col_of(r['date'])] += r['cents']
            out['pmos'][plabel] = {'total': sum(pcols.values()), 'cols': pcols}
            for tk, pes in titles.items():
                trows = sorted([r for p in pes.values() for cc in p.values() for r in cc], key=lambda r: r['_i'])
                tlabel = label_of(trows, 'title', '(no title)')
                out['titles'][plabel + '|' + tlabel] = sum(r['cents'] for r in trows)
                for ek, ccs in pes.items():
                    erows = sorted([r for cc in ccs.values() for r in cc], key=lambda r: r['_i'])
                    elabel = label_of(erows, 'pe', '(no plan event)')
                    out['pes'][plabel + '|' + tlabel + '|' + elabel] = sum(r['cents'] for r in erows)
                    for ck, crows in ccs.items():
                        clabel = label_of(crows, 'ccar', '(no CCaR)')
                        out['ccars'][plabel + '|' + tlabel + '|' + elabel + '|' + clabel] = sum(r['cents'] for r in crows)
        return out

    def na_items(self, rows):
        """§5: counted rows that are not exec, by (column, status group, item key); $0 items hidden; sorted."""
        groups = {}
        for r in rows:
            if r['status'] == 'exec':
                continue
            c = self.col_of(r['date'])
            sg = r['status'] if r['status'] in ('na', 'unprog', 'fcst') else 'other:' + r['statusLabel']
            if r['k']['ccar'] in self.special:
                ik = 'CC:' + r['k']['ccar']
            else:
                ik = 'PE:' + r['k']['pe']
            groups.setdefault((c, sg, ik), []).append(r)
        items = []
        for (c, sg, ik), grows in groups.items():
            cents = sum(r['cents'] for r in grows)
            if cents == 0:
                continue
            # READING: a blank spelling is labelled like the tree's blank node ('(no title)' / '(no plan event)')
            label = label_of(grows, 'title', '(no title)') if ik.startswith('CC:') else label_of(grows, 'pe', '(no plan event)')
            items.append([c, sg, ik, cents, label])
        # READING: after column, cents (largest first) and label, ties fall to status group then item key, compared
        # as plain strings (code points); the fixture has no two items equal on the first three.
        items.sort(key=lambda it: (COLS.index(it[0]), -it[3], it[4], it[1], it[2]))
        return items


def build(state, settings, view):
    """The expected.json for the current pulls of `state`."""
    m = Model(settings, view)
    out = {'asOf': settings['asOf'], 'E': m.E, 'firstFY': settings['firstFY'], 'asOfIndex': m.asof_idx,
           'window': {'start': m.wstart, 'end': m.wend},
           'special': sorted(m.special)}
    derived = {}
    i = 0
    for ap in AP_IDS + ['unidentified']:
        rows = []
        for r in state['current'].get(ap, []):
            d = derive(r, ap if ap != 'unidentified' else None, settings)
            d['_i'] = i            # one global row order: appropriation order, then pull order
            i += 1
            rows.append(d)
        derived[ap] = rows
    # §9: the seventh switch, Service not identified, exists only when some row would count but for the switches and
    # has no service; the switches a plan has are the ones what is shown is stated over (review S2)
    has_unknown = any(not r['bad'] and r['fy'] is not None and r['fy'] >= settings['firstFY'] and r['svc'] == SVC_UNKNOWN
                      for ap in AP_IDS for r in derived[ap])
    exist = SERVICES + ([SVC_UNKNOWN] if has_unknown else [])
    out['shown'] = {'services': [s for s in exist if view['svc'].get(s, True)],
                    'lanes': [l for l in ('disc', 'mand') if view['lane'].get(l, True)]}
    out['shown']['all'] = all(view['svc'].get(s, True) for s in exist) and \
        all(view['lane'].get(l, True) for l in ('disc', 'mand'))
    blocks = {}
    excluded = {'beforeFirst': 0, 'beforeFirstRows': 0, 'beforeFirstByFy': {}, 'unidentified': 0,
                'unidentifiedRows': 0, 'unreadableRows': 0}
    after_c = after_n = 0
    show_nodate = False
    pmo_rows = {}         # pmo key -> {block key -> [rows]}
    for ap in AP_IDS:
        rows = derived[ap]
        # READING: a block exists for every (ap, fy >= firstFY) holding any row whose FY is readable, whatever the
        # switches; a row whose amount alone is unreadable names its block too. The fixture's unreadable-amount rows
        # sit in blocks that have other rows, so this reading changes no expected value.
        keys = sorted({r['fy'] for r in rows if r['fy'] is not None and r['fy'] >= settings['firstFY']})
        for fy in keys:
            brows = [r for r in rows if r['fy'] == fy and m.counts(r)]
            b = m.figures(ap, fy, brows)
            b.update(m.tree(brows))
            b['na'] = m.na_items(brows)
            blocks['%s|%d' % (ap, fy)] = b
            for r in brows:
                pmo_rows.setdefault(r['k']['pmo'], {}).setdefault('%s|%d' % (ap, fy), []).append(r)
                if r['date'] == '':
                    show_nodate = True
                if r['status'] == 'exec' and r['date'] != '' and r['date'] >= m.asof_next:
                    after_c += r['cents']
                    after_n += 1
        for r in rows:
            # READING: each excluded row is named by the first §4.3 condition it fails, and the switches are not one
            # of these: money before firstFY is reported whatever the switches show.
            if r['bad']:
                excluded['unreadableRows'] += 1
            elif r['fy'] < settings['firstFY']:
                excluded['beforeFirst'] += r['cents']
                excluded['beforeFirstRows'] += 1
                k = str(r['fy'])
                excluded['beforeFirstByFy'][k] = excluded['beforeFirstByFy'].get(k, 0) + r['cents']
    for r in derived['unidentified']:
        if r['bad']:
            excluded['unreadableRows'] += 1
        else:
            excluded['unidentified'] += r['cents']
            excluded['unidentifiedRows'] += 1
    out['showNoDate'] = show_nodate
    out['blocks'] = blocks
    aps = {}
    for key, b in blocks.items():
        a = aps.setdefault(b['ap'], {'approved': 0, 'authorized': 0, 'obligated': 0, 'unobligated': 0})
        for f in ('approved', 'authorized', 'obligated', 'unobligated'):
            a[f] += b[f]
    for a in aps.values():
        a['oblPct'] = (a['obligated'] / a['approved']) if a['approved'] else None
    out['aps'] = aps
    s = {'approved': 0, 'authorized': 0, 'obligated': 0, 'unobligated': 0, 'unprog': 0}
    for b in blocks.values():
        for f in s:
            s[f] += b[f]
    s['oblPct'] = (s['obligated'] / s['approved']) if s['approved'] else None
    out['summary'] = s
    # §4.6 pmos / §8.6 PMO tabs: one per PMO with counted rows in any block; Authorized = Approved there
    tabs, codes = {}, {}
    for pk, by_block in pmo_rows.items():
        allrows = sorted([r for rs in by_block.values() for r in rs], key=lambda r: r['_i'])
        label = label_of(allrows, 'pmo', '(no PMO)')
        codes[label] = pmo_code(label)
        t = {}
        for bk, rs in by_block.items():
            ap, fy = bk.split('|')
            f = m.figures(ap, int(fy), rs)
            t[bk] = {'approved': f['approved'], 'authorized': f['approved'], 'obligated': f['obligated'],
                     'unobligated': f['unobligated'], 'unprog': f['unprog'], 'oblPct': f['oblPct'],
                     'goal': f['goal'], 'delta': f['delta'], 'status': f['status'],
                     'execAfterAsOf': f['execAfterAsOf'], 'cols': f['cols'], 'na': m.na_items(rs)}
        tabs[label] = t
    out['pmoTabs'] = tabs
    out['pmoCodes'] = codes
    out['excluded'] = excluded
    out['execAfterAsOf'] = {'cents': after_c, 'rows': after_n}
    # Not part of the tool's model: counted cents per block by service, lane and status, so a test can hold the
    # oracle's reading of the budget names and the Alloc text against what the fixture's generator says it wrote.
    cross = {'bySvc': {}, 'byLane': {}, 'byStatus': {}}
    for ap in AP_IDS:
        for r in derived[ap]:
            if r['fy'] is None or r['bad'] or not m.counts(r):
                continue
            bk = '%s|%d' % (ap, r['fy'])
            sg = r['status'] if r['status'] != 'other' else 'other:' + r['statusLabel']
            for tab, k in (('bySvc', r['svc']), ('byLane', r['lane']), ('byStatus', sg)):
                d = cross[tab].setdefault(bk, {})
                d[k] = d.get(k, 0) + r['cents']
    out['crossChecks'] = cross
    out['rowsByAp'] = {ap: len(state['current'][ap]) for ap in AP_IDS + ['unidentified'] if ap in state['current']}
    return out


def diff_pulls(prev, cur, settings):
    """§4.6 diffPulls, restricted to what §12 asks of expected.json. 'Every row' is every row of every FY (firstFY too is
    a view, and the diff ignores views). §4.6: a row that cannot be read counts in no dollar figure, but its CCaR is in
    its pull all the same, so it never makes a CCaR new or gone; a CCaR's PMO is read from its rows that read, and from
    the others only when none does."""
    res = {}
    for ap in AP_IDS:
        if ap not in prev or ap not in cur:
            continue
        side = []
        for rows in (prev[ap], cur[ap]):
            fig, ccars, unread = {}, {}, {}
            for r in rows:
                d = derive(r, ap, settings)
                if r['bad']:
                    unread.setdefault(d['k']['ccar'], []).append(d)
                    continue
                f = fig.setdefault('%s|%d' % (ap, d['fy']), {'approved': 0, 'obligated': 0})
                f['approved'] += d['cents']
                if d['status'] == 'exec':
                    f['obligated'] += d['cents']
                ccars.setdefault(d['k']['ccar'], []).append(d)
            for k, ds in unread.items():
                ccars.setdefault(k, ds)          # a CCaR none of whose rows reads: present, by those rows alone
            side.append((fig, ccars))
        (f0, c0), (f1, c1) = side
        by_block = {}
        for k in sorted(set(f0) | set(f1)):
            a, b = f0.get(k, {'approved': 0, 'obligated': 0}), f1.get(k, {'approved': 0, 'obligated': 0})
            by_block[k] = {'approved': [a['approved'], b['approved']], 'obligated': [a['obligated'], b['obligated']]}
        moves = []
        for ck in sorted(set(c0) & set(c1)):
            # §4.6: a CCaR's PMO is the PMO most of its rows carry; where PMOs carry as many rows, the first of them in
            # the PMO order (PMO_ORDER, then any other PMO by its normalised name, (no PMO) last), never the first met:
            # by row order, the same rows listed the other way round "moved" a tied CCaR (second review M3). Labelled
            # by the spelling most of those rows use (§4.4)
            def pmo_of(rows):
                counts = {}
                for r in rows:
                    counts[r['k']['pmo']] = counts.get(r['k']['pmo'], 0) + 1
                pk = min(counts, key=lambda k: (-counts[k],) + pmo_key_rank(k))
                return pk, label_of([r for r in rows if r['k']['pmo'] == pk], 'pmo', '(no PMO)')
            p0, l0 = pmo_of(c0[ck])
            p1, l1 = pmo_of(c1[ck])
            if p0 != p1:
                moves.append([ck, l0, l1])
        res[ap] = {'byBlock': by_block, 'ccarsNew': sorted(set(c1) - set(c0)), 'ccarsGone': sorted(set(c0) - set(c1)),
                   'pmoMoves': moves}
    return res


# -------------------------------------------------------------------------------------------------- state & CLI
def apply_import(state, parsed):
    """§11 applyImport: each appropriation in the import replaces its current pull; the replaced one is previous.
    READING: rows whose appropriation is not identified are treated like one more appropriation here."""
    for ap, rows in parsed['pulls'].items():
        if ap in state['current']:
            state['previous'][ap] = state['current'][ap]
        state['current'][ap] = rows


def make_settings(args):
    s = {'asOf': args.asof, 'firstFY': args.first, 'goals': {k: list(v) for k, v in GOALS_DEFAULT.items()},
         'authorized': {}, 'special': list(SPECIAL_CCARS_DEFAULT), 'budgets': {}}
    if args.settings:
        with open(args.settings, encoding='utf-8') as f:
            extra = json.load(f)
        for k in ('goals', 'authorized', 'special'):
            if k in extra:
                s[k] = extra[k] if k != 'goals' else {**s['goals'], **extra['goals']}
        for name, ov in (extra.get('budgets') or {}).items():
            s['budgets'][norm_key(name)] = ov
    if args.special is not None:
        s['special'] = list(args.special)
    if not re.fullmatch(r'\d{4}-(0[1-9]|1[0-2])', s['asOf']):
        raise SystemExit('--asof must be YYYY-MM')
    return s


def make_view(args):
    off = set(args.svc_off or [])
    for n in off:
        if n not in SERVICES + [SVC_UNKNOWN]:
            raise SystemExit('--svc-off: no service named %r (one of: %s)' % (n, ', '.join(SERVICES + [SVC_UNKNOWN])))
    lanes = {'both': ('disc', 'mand'), 'disc': ('disc',), 'mand': ('mand',)}[args.lanes]
    return {'svc': {s: (s not in off) for s in SERVICES + [SVC_UNKNOWN]},
            'lane': {l: (l in lanes) for l in ('disc', 'mand')}}


SCENARIOS = {
    'all': dict(files=['pull-all.xlsx']),
    'usaf-off': dict(files=['pull-all.xlsx'], svc_off=['USAF']),
    'mand-only': dict(files=['pull-all.xlsx'], lanes='mand'),
    'disc-only': dict(files=['pull-all.xlsx'], lanes='disc'),
    'asof-2026-03': dict(files=['pull-all.xlsx'], asof='2026-03'),
    'first-2024': dict(files=['pull-all.xlsx'], first=2024),
    'gen2': dict(files=['pull-all.xlsx'], then=['gen2/pull-om.xlsx', 'gen2/pull-ff.csv']),
    # the layout-independence import: the same O&M and FF rows in other layouts, with pull-all's Spares and OPN
    'layout': dict(files=['pull-om.xlsx', 'pull-ff.csv', 'pull-sp-opn.xlsx']),
}


def main(argv=None):
    ap = argparse.ArgumentParser(description='The independent oracle for the SFCB Spend Plan dashboard (CONTRACT §12).')
    ap.add_argument('--files', nargs='+')
    ap.add_argument('--then', nargs='+', help='a second import, applied after the first (the gen2 case)')
    ap.add_argument('--asof', default='2026-10')
    ap.add_argument('--first', type=int, default=2025)
    ap.add_argument('--svc-off', nargs='+', dest='svc_off')
    ap.add_argument('--lanes', choices=['both', 'disc', 'mand'], default='both')
    ap.add_argument('--special', nargs='*')
    ap.add_argument('--settings', help='a JSON file with any of goals, authorized, special, budgets')
    ap.add_argument('--scenario', choices=sorted(SCENARIOS))
    ap.add_argument('--fixture', help='the fixture directory a --scenario reads')
    ap.add_argument('--out', required=True)
    ap.add_argument('--summary', action='store_true', help='also print Approved per block in $M')
    args = ap.parse_args(argv)
    if args.scenario:
        if not args.fixture:
            raise SystemExit('--scenario needs --fixture DIR')
        sc = SCENARIOS[args.scenario]
        args.files = [os.path.join(args.fixture, f) for f in sc['files']]
        args.then = [os.path.join(args.fixture, f) for f in sc['then']] if sc.get('then') else None
        args.asof = sc.get('asof', '2026-10')
        args.first = sc.get('first', 2025)
        args.svc_off = sc.get('svc_off')
        args.lanes = sc.get('lanes', 'both')
    if not args.files:
        raise SystemExit('give --files or --scenario')
    settings = make_settings(args)
    view = make_view(args)
    state = {'current': {}, 'previous': {}}
    try:
        apply_import(state, parse_files(args.files))
    except Refused as e:
        _write(args.out, {'refused': str(e), 'stage': 'files'})
        print('refused: ' + str(e), file=sys.stderr)
        return 3
    refused_then = None
    if args.then:
        try:
            apply_import(state, parse_files(args.then))
        except Refused as e:
            refused_then = str(e)     # §3: a refused import changes nothing; the first import's state stands
    out = build(state, settings, view)
    if args.then:
        out['diff'] = diff_pulls(state['previous'], state['current'], settings)
        if refused_then:
            out['refusedThen'] = refused_then
    out['input'] = {'files': [os.path.basename(f) for f in args.files],
                    'then': [os.path.basename(f) for f in (args.then or [])],
                    'svcOff': sorted(args.svc_off or []), 'lanes': args.lanes}
    _write(args.out, out)
    if args.summary:
        tot = 0
        for k, b in out['blocks'].items():
            tot += b['approved']
            print('%-8s FY%d  approved %14s M' % (AP_LABEL[b['ap']], b['fy'], '{:,.3f}'.format(b['approved'] / 1e8)))
        print('TOTAL approved %s M' % '{:,.3f}'.format(tot / 1e8))
        print('excluded: %s' % json.dumps(out['excluded']))
    return 0


def _write(path, obj):
    d = os.path.dirname(os.path.abspath(path))
    os.makedirs(d, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
        f.write('\n')


if __name__ == '__main__':
    sys.exit(main())
