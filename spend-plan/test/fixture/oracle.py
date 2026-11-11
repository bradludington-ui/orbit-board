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
#   python3 -I oracle.py --scenario all|usaf-off|mand-only|disc-only|asof-2026-03|first-2024|gen2|layout|
#                        bae-all|bae-usaf-off|bae-mand-only|bae-entered|bae-entered-off|bae-asof-2027-10|bae-gen2|
#                        obbba|obbba-usaf-off|obbba-first-2026|bae-obbba
#                        --fixture DIR --out expected.json
# A BAE report is one of the --files (or --then): it is known by its headers (§14.1), never by its name.
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
#   refusedThen (only when the --then import was refused), input {files, then, svcOff, lanes[, authorized]}
# With a BAE report among the files (§14; CONTRACT §14.8 lists every key), and only then, each block also carries
#   planned, approvedSrc, covered, authorizedSrc, slide {basis, oblPct, goal, delta, status}, planShort, marks, and its
#   approved, authorized, unobligated, oblPct, delta and status follow §14.3; pmoTabs follow §14.4 (basis, sect,
#   planned, offObligated); aps and summary add planned and marks; "bae" is model.bae (with offReport, review M4-6);
#   "diffBae" follows a second report.
# §15 (FY2025 OBBBA funding is left out), and only when a pull or the report holds a row the predicate names (its
# budget name holds the word OBBBA and its FY reads 2025, readable or not, whatever First FY), so every scenario without
# one is byte for byte what it was before §15 (READING: absent reads as §15.2's zeros):
#   excluded.obbba {rows, cents, obligated, blocks [{ap, fy, rows, cents, obligated}], budgets [{key, name, ap, rows,
#             cents, obligated}]}   the rows §4.3 sets aside for condition 4 (readable, identified, fy >= firstFY), every
#             switch whatever; blocks in model order, budgets one per normKey, first spelling, in row order
#   rawCounted {ap: [[fileIndex, sheet, rowNo, why]]}   every pull row (unidentified ones under "unidentified"), in pull
#             order, by the first §4.3 condition it fails: 'unreadable', 'unidentified', 'beforeFirst', 'obbba', 'switch',
#             else 'yes'. The raw data sheet's Counted for 'obbba' reads "No: FY2025 OBBBA funding (not a reporting year)"
#             (§15.4); the other words are the tool's, which the contract does not spell. A CSV's sheet is its file name.
#   with a report: bae.rows.obbba (readable rows of scope 'obbba'), noBlock[].obbba = true (written only when true:
#             READING, so a noBlock entry without it is byte for byte §14's), and bae.counted gives such a row
#             "FY2025 OBBBA funding (not a reporting year)".
# A refused first import writes {"refused": why, "stage": "files"} instead, and exits 3.
import argparse
import csv
import datetime as dt
import hashlib
import io
import json
import math
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


# §15.1: FY2025 OBBBA funding. One predicate, used by every reader here. READING: \b and the case-folding are
# JavaScript's for /\bOBBBA\b/i (ASCII word characters, ASCII letters folded), so re.ASCII.
OBBBA_FY = 2025
OBBBA_RE = re.compile(r'\bOBBBA\b', re.I | re.A)
OBBBA_WHY = 'FY2025 OBBBA funding (not a reporting year)'


def is_obbba25(name, fy):
    """§15.1 SP.isObbba25: the budget name holds the word OBBBA (whole word, any case) and the FY is 2025."""
    return fy == OBBBA_FY and bool(OBBBA_RE.search('' if name is None else str(name)))


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
    bae_sheets = []               # §14.1: (file index, path, sheet, its rows, header index, header row)
    for fi, p in enumerate(paths):
        sheets, date1904 = read_file(p)
        frep = {'name': os.path.basename(p), 'sheets': []}
        usable = 0
        for sname, src in sheets:
            # §14.1: a sheet holding the report's four headers is a BAE report sheet, even when it is a pull sheet too
            bi, bhrow, _bb = find_bae_header(iter_sheet_rows(src))
            if bi is not None:
                usable += 1
                bae_sheets.append((fi, p, sname, src, bi, bhrow))
                frep['sheets'].append({'name': sname, 'used': True, 'bae': True, 'headerRow': bi + 1})
                continue
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
    if len(bae_sheets) > 1:
        raise Refused('more than one BAE report sheet in one import (%s); one report per import'
                      % '; '.join('%s / %s' % (os.path.basename(s[1]), s[2]) for s in bae_sheets))
    bae = read_bae(*bae_sheets[0]) if bae_sheets else None
    return {'pulls': pulls, 'report': report, 'bae': bae}


# ------------------------------------------------------------------------------------------- §14.1 the BAE report
BAE_FIELDS = (('name', ('budget name',)), ('fy', ('budget fy numeric', 'budget fy')),
              ('approved', ('budget approved amount',)), ('authorized', ('budget authorized amount',)))
BAE_TINY = 10_000_000          # $100,000 in cents: a report whose every non-zero amount is under it is refused


def bae_header_key(v):
    """§14.1: a header compared by normKey after a trailing unit in parentheses is taken off ('… Amount ($M)')."""
    s = '' if v is None else str(v)
    return norm_key(re.sub(r'\([^()]*\)\s*$', '', s.rstrip()))


def find_bae_header(rows_iter):
    """§14.1: the first row within the first 15 holding Budget Name, Budget FY Numeric (or Budget FY), Budget Approved
    Amount and Budget Authorized Amount. -> (index, row, buffered) or (None, None, buffered)."""
    buffered = []
    for i, r in enumerate(rows_iter):
        buffered.append(r)
        keys = {bae_header_key(c) for c in r if not is_blank(c)}
        if all(any(a in keys for a in aliases) for _f, aliases in BAE_FIELDS):
            return i, r, buffered
        if i >= 14:
            break
    return None, None, buffered


def js_round(x):
    # JavaScript's Math.round: the nearest whole number, ties toward +infinity. x - floor(x) is exact for these doubles.
    f = math.floor(x)
    return int(f) + (1 if x - f >= 0.5 else 0)


def bae_amount(v):
    """§14.1 -> (cents | None, how). A number cell is dollars to the cent: Math.round(v*100). A text the §2 parseAmount
    reads as zero (the report's own '$0.000') is 0, a conversion; any other text cannot be read: its unit cannot be
    known. READING: a blank amount cell reads as 0, as parseAmount reads a blank (the fixture writes none)."""
    if v is None:
        return 0, 'blank'
    if isinstance(v, bool) or isinstance(v, (dt.datetime, dt.date)):
        return None, 'bad'
    if isinstance(v, (int, float)):
        if v != v or v in (float('inf'), float('-inf')):
            return None, 'bad'
        return js_round(v * 100), 'number'
    if isinstance(v, str):
        if v.strip() == '':
            return 0, 'blank'
        c, _how = parse_amount(v)
        return (0, 'textZero') if c == 0 else (None, 'text')
    return None, 'bad'


def bae_stamp(fname):
    """§14.1: the report's date from a file name ending _YYYY-MM-DD_HHMMSS ('…2026-01-31_120000.xlsx' -> '2026-01-31
    12:00'), else None."""
    m = re.search(r'_(\d{4}-\d{2}-\d{2})_(\d{2})(\d{2})(\d{2})\.[^.]+$', fname)
    return '%s %s:%s' % (m.group(1), m.group(2), m.group(3)) if m else None


def read_bae(fi, path, sname, src, hi, hrow):
    """§14.1, one report sheet -> its rows, every one either skipped (blank in all four columns the tool reads), the
    report's own total row, or a budget row (readable, or unreadable with its reasons)."""
    cols = {}
    for f, aliases in BAE_FIELDS:
        for a in aliases:                          # READING: 'Budget FY Numeric' first, else 'Budget FY'
            for ci, hv in enumerate(hrow):
                if not is_blank(hv) and bae_header_key(hv) == a:
                    cols.setdefault(f, ci)
            if f in cols:
                break
    it = iter_sheet_rows(src)
    raw, skipped, row_no = [], 0, 0
    for r in it:
        row_no += 1
        if row_no <= hi + 1:
            continue
        vals = {f: (r[ci] if ci < len(r) else None) for f, ci in cols.items()}
        if all(is_blank(v) for v in vals.values()):
            skipped += 1
            continue
        raw.append((row_no, vals))
    # §14.1 the total row: no Budget Name and no FY, holding amounts, after the last budget row. READING: the first
    # such row after the last named row; any other row with no Budget Name is unreadable.
    last_named = max([i for i, (_n, v) in enumerate(raw) if js_string(v['name']).strip() != ''], default=-1)
    total_i = next((i for i, (_n, v) in enumerate(raw) if i > last_named and is_blank(v['name']) and is_blank(v['fy'])
                    and not (is_blank(v['approved']) and is_blank(v['authorized']))), None)
    rows, conv = [], {'approved': 0, 'authorized': 0}
    total = None
    for i, (rn, v) in enumerate(raw):
        a, ah = bae_amount(v['approved'])
        u, uh = bae_amount(v['authorized'])
        if i == total_i:
            total = {'approved': a, 'authorized': u, 'rowNo': rn}
            continue
        name = js_string(v['name']).strip()
        fy = parse_fy(v['fy'])
        bad = []
        if name == '':
            bad.append('Budget Name')
        if fy is None:
            bad.append('FY')
        if a is None:
            bad.append('Approved')
        if u is None:
            bad.append('Authorized')
        # READING: every '$0.000' read is a conversion, in a row that reads or not (each is a cell read as zero)
        conv['approved'] += ah == 'textZero'
        conv['authorized'] += uh == 'textZero'
        rows.append({'rowNo': rn, 'name': name, 'fy': fy, 'approved': a, 'authorized': u, 'bad': bad})
    good = [x for x in rows if not x['bad']]
    if not good:
        raise Refused('the BAE report %s / %s has no readable row' % (os.path.basename(path), sname))
    nz = [c for x in good for c in (x['approved'], x['authorized']) if c != 0]
    # READING: "every non-zero amount" is over the readable rows; a report with none non-zero is not refused by this
    if nz and all(abs(c) < BAE_TINY for c in nz):
        raise Refused('every amount in the BAE report %s is under $100,000: it looks exported in $M, not dollars'
                      % os.path.basename(path))
    check = None
    if total is not None and total['approved'] is not None and total['authorized'] is not None:
        diff = {'approved': total['approved'] - sum(x['approved'] for x in good),
                'authorized': total['authorized'] - sum(x['authorized'] for x in good)}
        # §14.1: within $1 each (a sum of floating-point dollars); diff = the total row less the readable rows
        check = {'ok': abs(diff['approved']) <= 100 and abs(diff['authorized']) <= 100, 'diff': diff}
    return {'fi': fi, 'file': os.path.basename(path), 'sheet': sname, 'stamp': bae_stamp(os.path.basename(path)),
            'headerRow': hi + 1, 'headers': [js_string(h) for h in hrow], 'rows': rows, 'skipped': skipped,
            'conversions': conv, 'total': total, 'totalCheck': check}


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
        # §4.3: readable, appropriation identified (rows reach here only from an identified pull), fy >= firstFY, not
        # FY2025 OBBBA funding (§15), shown
        return (not r['bad']) and r['fy'] >= self.settings['firstFY'] and not is_obbba25(r['budget'], r['fy']) \
            and self.shown(r)

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
                      and not is_obbba25(r['budget'], r['fy']) for ap in AP_IDS for r in derived[ap])
    exist = SERVICES + ([SVC_UNKNOWN] if has_unknown else [])
    out['shown'] = {'services': [s for s in exist if view['svc'].get(s, True)],
                    'lanes': [l for l in ('disc', 'mand') if view['lane'].get(l, True)]}
    out['shown']['all'] = all(view['svc'].get(s, True) for s in exist) and \
        all(view['lane'].get(l, True) for l in ('disc', 'mand'))
    blocks = {}
    block_rows = {}       # the counted rows of each block (for §14 alone; nothing above reads it)
    excluded = {'beforeFirst': 0, 'beforeFirstRows': 0, 'beforeFirstByFy': {}, 'unidentified': 0,
                'unidentifiedRows': 0, 'unreadableRows': 0}
    after_c = after_n = 0
    show_nodate = False
    pmo_rows = {}         # pmo key -> {block key -> [rows]}
    for ap in AP_IDS:
        rows = derived[ap]
        # READING: a block exists for every (ap, fy >= firstFY) holding any row whose FY is readable, whatever the
        # switches; a row whose amount alone is unreadable names its block too. The fixture's unreadable-amount rows
        # sit in blocks that have other rows, so this reading changes no expected value. §15.2: FY2025 OBBBA funding
        # names no block, read or not ("this one would be left out if it read").
        keys = sorted({r['fy'] for r in rows if r['fy'] is not None and r['fy'] >= settings['firstFY']
                       and not is_obbba25(r['budget'], r['fy'])})
        for fy in keys:
            brows = [r for r in rows if r['fy'] == fy and m.counts(r)]
            b = m.figures(ap, fy, brows)
            b.update(m.tree(brows))
            b['na'] = m.na_items(brows)
            blocks['%s|%d' % (ap, fy)] = b
            block_rows['%s|%d' % (ap, fy)] = brows
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
    ob_loaded = obbba_loaded(state)
    if ob_loaded:
        excluded['obbba'] = obbba_excluded(derived, settings)
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
    if ob_loaded:
        out['rawCounted'] = raw_counted(derived, m, settings)
    if (state.get('bae') or {}).get('current'):
        bae_extend(out, m, derived, block_rows, pmo_rows, state, settings, ob_loaded)
    return out


# ---------------------------------------------------------------------------------------- §15 FY2025 OBBBA funding
def obbba_loaded(state):
    """Whether any loaded row is one the §15.1 predicate names: a current pull row (any appropriation, unidentified
    included, read or not) or a current report row, by its name and the FY it reads."""
    for rows in state['current'].values():
        if any(is_obbba25(r['budget'], r['fy']) for r in rows):
            return True
    bae = (state.get('bae') or {}).get('current')
    return bool(bae) and any(is_obbba25(x['name'], x['fy']) for x in bae['rows'])


def obbba_excluded(derived, settings):
    """§15.2 M.excluded.obbba: the rows §4.3 sets aside for condition 4, every switch whatever. A row is set aside for
    the first condition it fails, so an unreadable one is unreadable, one whose appropriation is not identified is
    that, and one before First FY is that. READING: budgets in row order is the oracle's one row order (appropriation
    order, then pull order), which is the import's own order when the files list the appropriations in that order, as
    every §15 scenario does; a budget met in two appropriations (by sheet name alone) takes its first row's."""
    first = settings['firstFY']
    out = {'rows': 0, 'cents': 0, 'obligated': 0, 'blocks': [], 'budgets': []}
    blocks, budgets = {}, {}
    for ap in AP_IDS:
        for r in derived[ap]:
            if r['bad'] or r['fy'] < first or not is_obbba25(r['budget'], r['fy']):
                continue
            ob = r['cents'] if r['status'] == 'exec' else 0
            b = blocks.setdefault((ap, r['fy']), {'ap': ap, 'fy': r['fy'], 'rows': 0, 'cents': 0, 'obligated': 0})
            k = norm_key(r['budget'])
            u = budgets.setdefault(k, {'key': k, 'name': r['budget'], 'ap': ap, 'rows': 0, 'cents': 0, 'obligated': 0})
            for t in (out, b, u):
                t['rows'] += 1
                t['cents'] += r['cents']
                t['obligated'] += ob
    rank = {a: i for i, a in enumerate(AP_IDS)}
    out['blocks'] = [blocks[k] for k in sorted(blocks, key=lambda k: (rank[k[0]], k[1]))]
    out['budgets'] = list(budgets.values())
    return out


def raw_counted(derived, m, settings):
    """§8.7/§15.4 the raw data sheets' Counted, per row, as the first §4.3 condition the row fails (READING: as a code;
    the contract spells only 'Yes' and the OBBBA words). Rows whose appropriation is not identified are on no raw
    sheet; they are listed under 'unidentified' all the same."""
    first = settings['firstFY']
    out = {}
    for ap in AP_IDS + ['unidentified']:
        lst = []
        for r in derived[ap]:
            if r['bad']:
                why = 'unreadable'
            elif ap == 'unidentified':
                why = 'unidentified'
            elif r['fy'] < first:
                why = 'beforeFirst'
            elif is_obbba25(r['budget'], r['fy']):
                why = 'obbba'
            else:
                why = 'yes' if m.shown(r) else 'switch'
            lst.append([r['src'][0], r['src'][1], r['src'][2], why])
        if lst:
            out[ap] = lst
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


# --------------------------------------------------------------------------------------------- §14.2 a budget row
def bae_scope(name, fy=None):
    """(ap, scope): ap by the §3 Budget rule alone (no sheet name); scope 'flyaway' when the name holds the word
    Flyaway (READING: in any case, as every other name rule of §3 is), else 'noap' when no appropriation, else 'obbba'
    when the row is FY2025 OBBBA funding (§15.3: by the name and the FY the row reads; with no FY given, a name's own
    scope), else 'in'."""
    ap = ap_of_budget(name) if name else None
    if re.search(r'\bflyaway\b', name or '', re.I):
        return ap, 'flyaway'
    if ap is None:
        return ap, 'noap'
    return ap, ('obbba' if is_obbba25(name, fy) else 'in')


def off_kind(budget):
    """Review M4-6: a pull row's Budget the report's Approved can never hold, since no report row of that name counts
    (§14.2): 'blank' (no Budget: a report row with no name cannot be read), 'flyaway' (the word, as bae_scope reads it),
    'noap' (the §3 Budget rule places it nowhere; the pull placed it by its sheet), else None."""
    s = (budget or '').strip()
    if s == '':
        return 'blank'
    if re.search(r'\bflyaway\b', s, re.I):
        return 'flyaway'
    return None if ap_of_budget(s) else 'noap'


def pmo_code_index(derived):
    """§14.2 the PMOs a budget's last word is compared with: SP.PMO_ORDER's, then every PMO in the pull. READING:
    'every PMO in the pull' is every PMO named on any row of the current pulls of the four appropriations, whatever
    the switches, the FY or whether the row reads, labelled by its majority spelling (§4.4) and coded by §4.6; so a
    switch never changes which PMO a budget belongs to. -> [(key, label, code)] in that order of comparison."""
    known = [norm_key(l) for l in PMO_ORDER]
    idx = [(norm_key(l), l, pmo_code(l)) for l in PMO_ORDER]
    by = {}
    for ap in AP_IDS:
        for r in derived[ap]:
            by.setdefault(r['k']['pmo'], []).append(r)
    others = []
    for pk, rows in by.items():
        if pk == '' or pk in known:
            continue
        lbl = label_of(sorted(rows, key=lambda r: r['_i']), 'pmo', '(no PMO)')
        others.append((pmo_sort_key(pk, lbl), pk, lbl))
    idx += [(pk, lbl, pmo_code(lbl)) for _s, pk, lbl in sorted(others)]
    return idx, by


def budget_pmo(name, idx):
    """§14.2: the last word of the trimmed name, compared without case against each PMO's code; else (no PMO), key ''."""
    w = (name or '').strip().split()
    last = w[-1].lower() if w else None
    for pk, _lbl, code in idx:
        if last is not None and code.lower() == last:
            return pk
    return ''


def bae_derive_rows(bae, settings, idx):
    out = []
    for x in bae['rows']:
        d = dict(x)
        d['key'] = norm_key(x['name'])
        d['ap'], d['scope'] = bae_scope(x['name'], x['fy'])
        d['svc'], d['lane'] = svc_of(x['name'], settings), lane_of(x['name'], settings)
        d['pmo'] = budget_pmo(x['name'], idx)
        out.append(d)
    return out


# ------------------------------------------------------------------------------ §16 PMO rows from plan events
def split_by_plan(amount, weights):
    """§16.1: share `amount` (whole cents) among the weights in whole cents by largest remainder, so the shares add up to it
    exactly; a weight is max(0, w); a tie goes to the earlier weight (the model's PMO order); a negative amount is split
    as its absolute value and negated. None when no weight is above zero (the budget is unassigned). Python's integers
    are exact, so no product is rounded."""
    w = [max(0, x) for x in weights]
    total = sum(w)
    if total == 0:
        return None
    a = -amount if amount < 0 else amount
    floor = [a * x // total for x in w]
    rem = [a * x % total for x in w]
    left = a - sum(floor)
    for i in sorted([i for i in range(len(w)) if w[i] > 0], key=lambda i: (-rem[i], i))[:left]:
        floor[i] += 1
    return [-v if amount < 0 else v for v in floor]


def plan_pct(w, total):
    """§16.2: a share of the plan as a percent to one decimal. READING: rounded half up, in whole numbers."""
    tenths = (2000 * w + total) // (2 * total)
    return '%d.%d%%' % (tenths // 10, tenths % 10)


def pmo_column(x, share_of, plabel):
    """§16.2 the BAE Report sheet's PMO column: blank on a row that does not count; else each PMO whose plan events take a
    share of its budget in its block, with its share of the plan, largest first; else 'No plan event uses it'. READING:
    that wording too for a budget its plan events use with no plan above zero (§16.2 gives no other), and for a counting
    row of an (ap, fy) the pull has no block for (no plan event of that year uses it)."""
    if not x['counts']:
        return ''
    t = share_of.get('%s|%d' % (x['ap'], x['fy']), {}).get(x['key'])
    if not t:
        return 'No plan event uses it'
    total = sum(wt for _pk, wt in t)
    return '; '.join('%s %s' % (plabel(pk), plan_pct(wt, total)) for pk, wt in t)


# ---------------------------------------------------------------------------- §14.3–14.5 the model with a report
def bae_extend(out, m, derived, block_rows, pmo_rows, state, settings, ob_loaded=False):
    bae = state['bae']['current']
    first, E = settings['firstFY'], m.E
    idx, by_pk = pmo_code_index(derived)
    rows = bae_derive_rows(bae, settings, idx)

    def counting(x):        # §14.2: readable, in scope, fy >= firstFY, and the switches show its service and lane
        return not x['bad'] and x['scope'] == 'in' and x['fy'] >= first and m.shown(x)
    for x in rows:
        x['counts'] = counting(x)
    covered = {(x['ap'], x['fy']) for x in rows if not x['bad'] and x['scope'] == 'in'}   # whatever the switches
    bp_cache = {}

    def bpmo(budget):       # §14.2: every pull row's bpmo, the budget's PMO of its Budget
        if budget not in bp_cache:
            bp_cache[budget] = budget_pmo(budget, idx)
        return bp_cache[budget]
    def plabel(pk):          # the tab's label: its counted rows' majority spelling, else the pull's, else the list's
        if pk in pmo_rows:
            return label_of(sorted([r for rs in pmo_rows[pk].values() for r in rs], key=lambda r: r['_i']), 'pmo', '(no PMO)')
        if pk in by_pk:
            return label_of(sorted(by_pk[pk], key=lambda r: r['_i']), 'pmo', '(no PMO)')
        return next((l for l in PMO_ORDER if norm_key(l) == pk), '(no PMO)')
    blocks = out['blocks']
    tab_rows = {}            # PMO key -> {block key -> figures}
    off_list = []            # review M4-6: each covered block's counted pull money on budgets Approved can never hold
    split_list, unassigned_list = [], []      # §16.3, in model order (the blocks are, here)
    share_of = {}            # block key -> budget key -> [(PMO key, weight)] largest first, or None (unassigned)
    for key, b in blocks.items():
        ap, fy = b['ap'], b['fy']
        cov = (ap, fy) in covered
        rep = [x for x in rows if x['counts'] and x['ap'] == ap and x['fy'] == fy]
        planned = b['approved']              # §14.3: the sum of the counted rows, what approved was in §4.5
        approved = sum(x['approved'] for x in rep) if cov else planned
        entered = key in settings['authorized']
        if entered:
            authorized, asrc = settings['authorized'][key], 'entered'
        elif cov:
            authorized, asrc = sum(x['authorized'] for x in rep), 'report'
        else:
            authorized, asrc = approved, 'approved'
        obl = b['obligated']
        pct = (obl / approved) if approved != 0 else None
        delta = (pct - b['goal']) if (pct is not None and b['goal'] is not None) else None
        slide = {'basis': planned, 'oblPct': b['oblPct'], 'goal': b['goal'], 'delta': b['delta'], 'status': b['status']}
        b.update({'planned': planned, 'approved': approved, 'approvedSrc': 'report' if cov else 'plan', 'covered': cov,
                  'authorized': authorized, 'authorizedSrc': asrc, 'authorizedEntered': entered,
                  'unobligated': approved - obl, 'oblPct': pct, 'delta': delta, 'status': Model.status_of(pct, b['goal']),
                  'slide': slide, 'planShort': cov and approved > 0 and 2 * planned < approved,
                  # READING (answer 8, review I4-4): with a report, an entered Authorized is marked ‡ whatever the switches
                  'marks': {'sect': not cov, 'dagger': asrc == 'approved', 'ddagger': entered}})
        # §16.1 the PMO rows of this block: by the PMO column, the PMOs the tree shows; on a covered block Approved and
        # Authorized are each PMO's shares of the report's budgets its plan events use, by its CCaR plan on each
        brows = block_rows[key]
        by_col = {}
        for r in brows:
            by_col.setdefault(r['k']['pmo'], []).append(r)
        pks = sorted(by_col, key=lambda pk: pmo_sort_key(pk, plabel(pk)))     # the model's PMO order
        pa_by = {pk: 0 for pk in pks}
        pu_by = {pk: 0 for pk in pks}
        if cov:
            # READING: a budget is the normKey of a pull row's Budget and of a report row's Budget Name; a pull row with
            # no Budget is the budget '' (no report row can have that name, so its plan takes no share of anything)
            plan = {}
            for r in brows:
                pp = plan.setdefault(norm_key(r['budget']), {})
                pp[r['k']['pmo']] = pp.get(r['k']['pmo'], 0) + r['cents']
            rb = {}
            for x in rep:                    # the block's counting report rows, in file order
                t = rb.setdefault(x['key'], {'key': x['key'], 'name': x['name'], 'approved': 0, 'authorized': 0})
                t['approved'] += x['approved']
                t['authorized'] += x['authorized']
            splits, unas, cols = [], [], {}
            for bk, t in rb.items():
                weights = [max(0, plan.get(bk, {}).get(pk, 0)) for pk in pks]
                sa, su = split_by_plan(t['approved'], weights), split_by_plan(t['authorized'], weights)
                if sa is None:
                    unas.append(dict(t, why='noplan' if bk in plan else 'nopull'))
                    cols[bk] = None
                    continue
                for i, pk in enumerate(pks):
                    pa_by[pk] += sa[i]
                    pu_by[pk] += su[i]
                # READING: the PMOs a split names are those whose weight is above zero (the ones taking a share), largest
                # share first: by plan, a tie in the model's PMO order (shares by largest remainder never order otherwise)
                takers = sorted([i for i in range(len(pks)) if weights[i] > 0], key=lambda i: (-weights[i], i))
                cols[bk] = [(pks[i], weights[i]) for i in takers]
                if len(takers) > 1:
                    splits.append({'ap': ap, 'fy': fy, 'key': bk, 'name': t['name'], 'approved': t['approved'],
                                   'authorized': t['authorized'],
                                   'pmos': [{'pmo': plabel(pks[i]), 'plan': weights[i], 'approved': sa[i], 'authorized': su[i]}
                                            for i in takers]})
            # READING: within a block, by the budget's name (its first spelling among the block's counting report rows,
            # in file order), then its normKey; an unassigned budget is listed whatever its money (§16.3 lists every
            # budget with no PMO weight), and only the notes ask for money
            split_list.extend(sorted(splits, key=lambda e: (e['name'], e['key'])))
            if unas:
                unas.sort(key=lambda e: (e['name'], e['key']))
                unassigned_list.append({'ap': ap, 'fy': fy, 'approved': sum(u['approved'] for u in unas),
                                        'authorized': sum(u['authorized'] for u in unas), 'budgets': unas})
            share_of[key] = cols
            # READING: one entry per budget (normKey; every row with no Budget is one), first spelling, in row order; an
            # entry whose plan and obligated are both 0 is left out, and a block with none has no entry
            off = {}
            for r in brows:
                kind = off_kind(r['budget'])
                if kind:
                    t = off.setdefault(norm_key(r['budget']), {'key': norm_key(r['budget']), 'name': (r['budget'] or '').strip(),
                                                               'kind': kind, 'rows': 0, 'planned': 0, 'obligated': 0})
                    t['rows'] += 1
                    t['planned'] += r['cents']
                    if r['status'] == 'exec':
                        t['obligated'] += r['cents']
            buds = [t for t in off.values() if t['planned'] or t['obligated']]
            if buds:
                off_list.append({'ap': ap, 'fy': fy, 'planned': sum(t['planned'] for t in buds),
                                 'obligated': sum(t['obligated'] for t in buds), 'budgets': buds})
        for pk in pks:
            prows = by_col[pk]
            f = m.figures(ap, fy, prows)     # the detail below the table: rows by their PMO column, on the plan
            po = f['obligated']               # §16.1: the PMO's own executed rows, the tree's Obligated
            if cov:
                pa, pu, basis = pa_by[pk], pu_by[pk], 'planEvent'
            else:
                pa, basis = f['approved'], 'row'
                pu = pa
            pp = (po / pa) if pa != 0 else None
            pd = (pp - b['goal']) if (pp is not None and b['goal'] is not None) else None
            # offObligated (review M4-6): of the PMO's Obligated, the part on budgets the report's Approved can never hold
            offo = sum(r['cents'] for r in prows if r['status'] == 'exec' and off_kind(r['budget'])) if cov else 0
            tab_rows.setdefault(pk, {})[key] = {
                'approved': pa, 'authorized': pu, 'obligated': po, 'unobligated': pa - po, 'oblPct': pp, 'goal': b['goal'],
                'delta': pd, 'status': Model.status_of(pp, b['goal']), 'basis': basis, 'sect': not cov,
                'planned': f['approved'], 'unprog': f['unprog'], 'execAfterAsOf': f['execAfterAsOf'], 'cols': f['cols'],
                'na': m.na_items(prows), 'offObligated': offo}

    out['pmoTabs'] = {plabel(pk): t for pk, t in tab_rows.items()}
    out['pmoCodes'] = {plabel(pk): pmo_code(plabel(pk)) for pk in tab_rows}
    # §14.3 totals
    fields = ('approved', 'planned', 'authorized', 'obligated', 'unobligated')

    def total(bs, extra=()):
        t = {f: sum(b[f] for b in bs) for f in fields + tuple(extra)}
        t['oblPct'] = (t['obligated'] / t['approved']) if t['approved'] else None
        t['marks'] = {k: any(b['marks'][k] for b in bs) for k in ('sect', 'dagger', 'ddagger')}
        return t
    out['aps'] = {ap: total([b for b in blocks.values() if b['ap'] == ap]) for ap in AP_IDS
                  if any(b['ap'] == ap for b in blocks.values())}
    out['summary'] = total(list(blocks.values()), ('unprog',))
    # §14.5 model.bae
    good = [x for x in rows if not x['bad']]
    ins = [x for x in good if x['scope'] == 'in']
    by_block = {}
    for x in ins:
        k = '%s|%d' % (x['ap'], x['fy'])
        t = by_block.setdefault(k, {'approved': 0, 'authorized': 0})
        t['approved'] += x['approved']
        t['authorized'] += x['authorized']
    ap_rank = {a: i for i, a in enumerate(AP_IDS)}
    order = sorted(blocks.values(), key=lambda b: (ap_rank[b['ap']], b['fy']))
    # READING: an (ap, fy) "the report holds counting money for" has a counting row whose Approved or Authorized is not 0
    nb = {}
    for x in rows:
        if x['counts'] and first <= x['fy'] <= E and '%s|%d' % (x['ap'], x['fy']) not in blocks:
            t = nb.setdefault((x['ap'], x['fy']), {'approved': 0, 'authorized': 0, 'money': False})
            t['approved'] += x['approved']
            t['authorized'] += x['authorized']
            t['money'] = t['money'] or x['approved'] != 0 or x['authorized'] != 0
    # §15.3: an (ap, fy) whose pull rows were all FY2025 OBBBA funding (so it would have had a block) carries obbba.
    # READING: "pull rows" are every row of that appropriation whose FY reads that year, read or not; the flag is
    # written only when true.
    all_ob = {}
    for ap in AP_IDS:
        for r in derived[ap]:
            if r['fy'] is not None:
                all_ob[(ap, r['fy'])] = all_ob.get((ap, r['fy']), True) and is_obbba25(r['budget'], r['fy'])

    def nb_entry(ap, fy, t):
        e = {'ap': ap, 'fy': fy, 'approved': t['approved'], 'authorized': t['authorized']}
        if all_ob.get((ap, fy)):
            e['obbba'] = True
        return e
    report_keys = {x['key'] for x in rows if x['name']}
    # READING (§15.2, "treated as a row before First FY is"): an FY2025 OBBBA pull row is still a pull row of its name,
    # as a row before First FY is, so a report name whose only pull rows are FY2025 OBBBA funding is not reportOnly;
    # §15.2 takes such rows out of pullOnly and offReport only, which follow the counted rows
    pull_keys = {norm_key(r['budget']) for ap in AP_IDS + ['unidentified'] for r in derived[ap]}
    # READING: pullOnly is every budget of a COUNTED pull row (§4.3: the switches apply) with no report row of that
    # name at all, a name placed by its sheet included (it can have no report row in scope); a Flyaway name is not
    # sustainment and is left out. reportOnly takes no switches: in-scope readable rows, firstFY..E, money non-zero.
    pull_only = set()
    for ap in AP_IDS:
        for r in derived[ap]:
            if m.counts(r) and not re.search(r'\bflyaway\b', r['budget'], re.I) and norm_key(r['budget']) not in report_keys:
                pull_only.add(norm_key(r['budget']))
    report_only = {x['key'] for x in ins if first <= x['fy'] <= E and (x['approved'] or x['authorized'])
                   and x['key'] not in pull_keys}

    def why(x):              # §14.6 the BAE Report sheet's Counted; READING: the first that applies, in §4.3's order
        if x['bad']:
            return 'Could not be read'
        if x['scope'] == 'flyaway':
            return 'Flyaway (production)'
        if x['scope'] == 'noap':
            return 'Names no appropriation'
        if x['fy'] < first:
            return 'Before the first FY'
        if x['scope'] == 'obbba':          # §15.3: after Before the first FY, before Switch off
            return OBBBA_WHY
        return 'Yes' if m.shown(x) else 'Switch off'
    # READING: a name's scope is the name's (§14.2 without the FY): 'obbba' belongs to a row, its name and FY, so a
    # budget whose first row is FY2025 is not therefore an 'obbba' budget
    budgets = {}
    for x in rows:
        if x['name'] and x['key'] not in budgets:
            budgets[x['key']] = {'name': x['name'], 'ap': x['ap'], 'scope': bae_scope(x['name'])[1], 'svc': x['svc'],
                                 'lane': x['lane'], 'pmo': plabel(x['pmo']) if x['pmo'] else '(no PMO)'}
    pull_bpmo = {}
    for ap in AP_IDS:
        for r in derived[ap]:
            k = norm_key(r['budget'])
            if k not in pull_bpmo:
                pk = bpmo(r['budget'])
                pull_bpmo[k] = plabel(pk) if pk else '(no PMO)'
    out['bae'] = {
        'present': True, 'file': bae['file'], 'sheet': bae['sheet'], 'stamp': bae['stamp'], 'headerRow': bae['headerRow'],
        'rows': dict([('in', len(ins)), ('flyaway', sum(x['scope'] == 'flyaway' for x in good)),
                      ('noap', sum(x['scope'] == 'noap' for x in good))] +
                     ([('obbba', sum(x['scope'] == 'obbba' for x in good))] if ob_loaded else []) +
                     [('bad', len(rows) - len(good))]),
        'skipped': bae['skipped'], 'conversions': bae['conversions'],
        'cents': {'approved': sum(x['approved'] for x in ins), 'authorized': sum(x['authorized'] for x in ins)},
        'total': bae['totalCheck'], 'totalRow': bae['total'], 'byBlock': by_block,
        'uncovered': [{'ap': b['ap'], 'fy': b['fy']} for b in order if not b['covered']],
        'noBlock': [nb_entry(ap, fy, t)
                    for (ap, fy), t in sorted(nb.items(), key=lambda kv: (ap_rank[kv[0][0]], kv[0][1])) if t['money']],
        'planShort': [{'ap': b['ap'], 'fy': b['fy'], 'planned': b['planned'], 'approved': b['approved']}
                      for b in order if b['planShort']],
        'pullOnly': sorted(pull_only), 'reportOnly': sorted(report_only),
        'offReport': sorted(off_list, key=lambda o: (ap_rank[o['ap']], o['fy'])),
        'unreadable': [{'rowNo': x['rowNo'], 'name': x['name'], 'bad': x['bad']} for x in rows if x['bad']],
        'counted': [[x['rowNo'], why(x)] for x in rows],
        'budgets': budgets, 'pullBudgetPmo': pull_bpmo,
        'split': split_list, 'unassigned': unassigned_list,
        'pmoColumn': [[x['rowNo'], pmo_column(x, share_of, plabel)] for x in rows]}


def diff_bae(prev, cur, settings):
    """§14.6 diffBae. byBlock: Approved and Authorized before and after per (ap, fy), over the readable in-scope rows,
    every FY, no switches. budgetsNew / Gone / Changed by name (normKey). READING, each: a name is present in a report
    when it has an in-scope row there, readable or not, as a CCaR with only unreadable rows is in its pull (§4.6), so
    an unreadable row never makes a budget new or gone; a budget changed when any FY's Approved or Authorized moved;
    each entry carries its totals and every FY either side holds; largest change first, the size being the larger of
    the FY-by-FY absolute changes in Approved and in Authorized, added up; ties by name. A budget with an in-scope row
    that could not be read, on either side, is in none of those three: it is listed apart in budgetsUnread, with
    unread [before, after] row counts, when it is in one report only, its figures moved or its count of such rows did,
    as the pull's lines with such a row are (§4.6, review M1, I4-3); unread counts every such row on each side."""
    def side(bae):
        blocks, figs, present, names, unread = {}, {}, set(), {}, {}
        for x in bae['rows']:
            if not x['name']:
                continue
            ap, scope = bae_scope(x['name'], x['fy'])
            if scope != 'in':               # Flyaway, naming no appropriation and FY2025 OBBBA funding (§15.3) are out
                continue
            k = norm_key(x['name'])
            present.add(k)
            names.setdefault(k, x['name'])
            if x['bad']:
                unread[k] = unread.get(k, 0) + 1
                continue
            bk = '%s|%d' % (ap, x['fy'])
            t = blocks.setdefault(bk, [0, 0])
            t[0] += x['approved']
            t[1] += x['authorized']
            f = figs.setdefault(k, {}).setdefault(str(x['fy']), [0, 0])
            f[0] += x['approved']
            f[1] += x['authorized']
        return blocks, figs, present, names, unread
    b0, f0, p0, n0, u0 = side(prev)
    b1, f1, p1, n1, u1 = side(cur)
    by_block = {}
    for k in sorted(set(b0) | set(b1)):
        x, y = b0.get(k, [0, 0]), b1.get(k, [0, 0])
        by_block[k] = {'approved': [x[0], y[0]], 'authorized': [x[1], y[1]]}

    def entry(k):
        a, b = f0.get(k, {}), f1.get(k, {})
        fys = sorted(set(a) | set(b))
        by = {fy: {'approved': [a.get(fy, [0, 0])[0], b.get(fy, [0, 0])[0]],
                   'authorized': [a.get(fy, [0, 0])[1], b.get(fy, [0, 0])[1]]} for fy in fys}
        size = max(sum(abs(v['approved'][1] - v['approved'][0]) for v in by.values()),
                   sum(abs(v['authorized'][1] - v['authorized'][0]) for v in by.values()))
        return {'key': k, 'name': n1.get(k, n0.get(k)), 'size': size,
                'approved': [sum(v['approved'][0] for v in by.values()), sum(v['approved'][1] for v in by.values())],
                'authorized': [sum(v['authorized'][0] for v in by.values()), sum(v['authorized'][1] for v in by.values())],
                'byFy': by}

    def ranked(keys, with_unread=False):
        out = []
        for k in keys:
            e = entry(k)
            if with_unread:
                e['unread'] = [u0.get(k, 0), u1.get(k, 0)]
            out.append(e)
        return sorted(out, key=lambda e: (-e['size'], e['key']))
    unr = set(u0) | set(u1)
    changed = [k for k in (p0 & p1) - unr if f0.get(k, {}) != f1.get(k, {})]
    apart = [k for k in unr if k not in p0 or k not in p1 or u0.get(k, 0) != u1.get(k, 0) or f0.get(k, {}) != f1.get(k, {})]
    return {'byBlock': by_block, 'unread': [sum(u0.values()), sum(u1.values())],
            'budgetsNew': ranked(p1 - p0 - unr), 'budgetsGone': ranked(p0 - p1 - unr),
            'budgetsChanged': ranked(changed), 'budgetsUnread': ranked(apart, True)}


# -------------------------------------------------------------------------------------------------- state & CLI
def apply_import(state, parsed):
    """§11 applyImport: each appropriation in the import replaces its current pull; the replaced one is previous.
    READING: rows whose appropriation is not identified are treated like one more appropriation here."""
    for ap, rows in parsed['pulls'].items():
        if ap in state['current']:
            state['previous'][ap] = state['current'][ap]
        state['current'][ap] = rows
    # §14.7: a report replaces the current report whole, and the one it replaces becomes previous; it never touches a pull
    if parsed.get('bae'):
        b = state.setdefault('bae', {'current': None, 'previous': None})
        if b['current'] is not None:
            b['previous'] = b['current']
        b['current'] = parsed['bae']


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
    # §14: the BAE report imported with the pull. bae-entered types an Authorized on a covered block (O&M FY2026) and
    # on one the report does not cover (Initial Spares FY2025); bae-entered-off is the same with a switch off. A
    # pull's (ap, fy) range is FY2025-2027 for every appropriation, so a report (ap, fy) with money and no block
    # needs E past 2027: bae-asof-2027-10 (E = 2028).
    'bae-all': dict(files=['pull-all.xlsx', 'bae.xlsx']),
    'bae-usaf-off': dict(files=['pull-all.xlsx', 'bae.xlsx'], svc_off=['USAF']),
    'bae-mand-only': dict(files=['pull-all.xlsx', 'bae.xlsx'], lanes='mand'),
    'bae-entered': dict(files=['pull-all.xlsx', 'bae.xlsx'], authorized={'om|2026': 39_876_543_210, 'sp|2025': 8_000_000_000}),
    'bae-entered-off': dict(files=['pull-all.xlsx', 'bae.xlsx'], authorized={'om|2026': 39_876_543_210, 'sp|2025': 8_000_000_000},
                            svc_off=['USN (USN CV)']),
    'bae-asof-2027-10': dict(files=['pull-all.xlsx', 'bae.xlsx'], asof='2027-10'),
    'bae-gen2': dict(files=['pull-all.xlsx', 'bae.xlsx'], then=['gen2/pull-om.xlsx', 'gen2/pull-ff.csv', 'gen2/bae.xlsx']),
    # §15.5: FY2025 OBBBA funding is left out. obbba-first-2026 makes every FY2025 OBBBA row a row before First FY
    # instead (§4.3: condition 3 comes first).
    'obbba': dict(files=['obbba/pull-om.xlsx', 'obbba/pull-ff.csv']),
    'obbba-usaf-off': dict(files=['obbba/pull-om.xlsx', 'obbba/pull-ff.csv'], svc_off=['USAF']),
    'obbba-first-2026': dict(files=['obbba/pull-om.xlsx', 'obbba/pull-ff.csv'], first=2026),
    'bae-obbba': dict(files=['obbba/pull-om.xlsx', 'obbba/pull-ff.csv', 'obbba/bae.xlsx']),
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
    sc_auth = SCENARIOS[args.scenario].get('authorized') if args.scenario else None
    if sc_auth:
        settings['authorized'].update(sc_auth)
    view = make_view(args)
    state = {'current': {}, 'previous': {}, 'bae': {'current': None, 'previous': None}}
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
        if state['bae']['current'] and state['bae']['previous']:
            out['diffBae'] = diff_bae(state['bae']['previous'], state['bae']['current'], settings)
    out['input'] = {'files': [os.path.basename(f) for f in args.files],
                    'then': [os.path.basename(f) for f in (args.then or [])],
                    'svcOff': sorted(args.svc_off or []), 'lanes': args.lanes}
    if sc_auth:
        out['input']['authorized'] = sc_auth
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
