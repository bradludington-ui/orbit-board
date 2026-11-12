#!/usr/bin/env python3
# Writes the SYNTHETIC CCaR pulls every SFCB Spend Plan test reads (CONTRACT §12). Builder A2.
#
#   python3 -I make_fixture.py --out DIR [--seed N]
#
# DIR/pull-all.xlsx        v12's four raw tabs (title on row 1, header on row 2, v12's own "Svc (auto)" / "Inc (auto)"
#                          formula columns filled with deliberately wrong values), plus "Misc Export" (rows whose
#                          appropriation no rule identifies) and "Notes" (a sheet with no header). Shared strings.
# DIR/pull-om.xlsx         one sheet "Report": header on row 1, the columns in another order with spelling variants, one
#                          extra column "Remarks", the 1904 date system. The same O&M rows as pull-all, then the same two
#                          unidentified rows pull-all keeps in "Misc Export" (so the two imports below agree on them too).
# DIR/pull-ff.csv          the same FF rows as pull-all, as RFC 4180 text with a byte-order mark and CRLF line ends.
# DIR/pull-sp-opn.xlsx     pull-all's Spares and OPN tabs alone: pull-om.xlsx + pull-ff.csv + this = pull-all.xlsx.
# DIR/gen2/pull-om.xlsx    the later pull of O&M (changed amounts, a new CCaR on a new budget name, a plan event gone)
# DIR/gen2/pull-ff.csv     the later pull of FF (a CCaR moved to another PMO, a CCaR gone, changed amounts)
# DIR/bae.xlsx             the BAE report of budgets (CONTRACT §14), shaped like the real one: one sheet, its 28 headers
#                          on row 1, Approved and Authorized in DOLLARS shown as $M by a number format, '$0.000' text
#                          zeros, a total row at the end. Built from its own random stream after the pulls are
#                          written, so not one pull byte moves. See build_bae for the case each row is there for.
# DIR/gen2/bae.xlsx        the later report: amounts moved, a budget gone and one new, Full Fund FY2025 covered, and
#                          an export's other shapes (two lines above the header, 'Budget FY', no unit on Authorized,
#                          columns reordered, an unreadable FY, a row with no name, a skipped row; the total differs)
# DIR/manifest.json        what the generator MEANT each row to be (appropriation, FY, cents, date, status, service,
#                          lane, names), stated from its own tables and never parsed back out of a file. The tests hold
#                          the oracle's reading of the files against it; the oracle never reads it. Its "bae" part
#                          does the same for every report row (and the budget's PMO of every name, by hand).
#
# Every name and figure is invented. Nothing here comes from a real pull: the budget names are shaped like CCaR's, and
# the two special CCaRs and the seven PMO names are configuration the contract keeps on purpose.
# Deterministic: the same --seed writes the same bytes (fixed zip times and document dates), so a fixture problem can
# be replayed exactly.
import argparse
import copy
import csv
import datetime as dt
import io
import json
import math
import os
import random
import re
import zipfile

import openpyxl
from openpyxl.styles import Alignment, Font
from openpyxl.utils.datetime import CALENDAR_MAC_1904
from openpyxl.worksheet.properties import Outline

RAW_HEADERS = ['FY', 'Month', 'CCaR No', 'Title', 'Budget', 'C/L', 'SB', 'Plan Event', 'Date', 'Amount', 'Alloc',
               'Event Description', 'OPR', 'PMT PID#', 'Contracting POC', 'Material Lead', 'PM/TPOC',
               'Obligation Category', 'PMO', 'Sub-PMO', 'Category', 'Navy SI Code', 'IPT', 'Spares WBS', 'Quantity',
               'CLINs', 'AF EEIC', 'RCN', 'PSR', 'CSR', 'Contract Mod', 'Cost Element']
TABS = {'om': 'O&M Raw Data', 'ff': 'FF Raw Data', 'sp': 'Spares Raw Data', 'opn': 'OPN Raw Data'}
TAB_TITLE = {'om': 'O&M - Raw Data Drop  (Paste fresh export here. Other tabs auto-update.)',
             'ff': 'Full Fund - Raw Data Drop  (Paste fresh export here. Other tabs auto-update.)',
             'sp': 'Initial Spares - Raw Data Drop  (Paste fresh export here. Other tabs auto-update.)',
             'opn': 'OPN - Raw Data Drop  (Paste fresh export here. Other tabs auto-update.)'}

AV, BOP, CDS, MXS, PSM, PP, TSS = ('Air Vehicle (AV)', 'Business Operations (BOP)', 'Combat Data Systems (CDS)',
                                   'Maintenance Systems (MxS)', 'Product Support Management (PSM)', 'Propulsion (PP)',
                                   'Training Systems (TSS)')
SA = 'Sustainment Analytics (SA)'          # an office not in the contract's list

USAF, ANG, AFRC, STOVL, USMCCV, USN, UNK = ('USAF', 'USAF ANG', 'USAF AFRC', 'USMC B (STOVL)', 'USMC C (USMC CV)',
                                           'USN (USN CV)', 'Service not identified')
# What each budget name MEANS, stated by hand from the contract's rules, never by running them: the oracle applies the
# rules to the text, and the tests compare the two. ap None = no rule names it (the sheet name, or nothing, decides).
BUDGETS = {
    'USAF O&M- Fixture Line Discretionary AV': ('om', USAF, 'disc'),
    'USAF O&M- CAM Discretionary Galvor': ('om', USAF, 'disc'),
    'USN O&M- Fixture USN CV LA Discretionary PSM': ('om', USN, 'disc'),
    'USN O&M- Fixture USMC CV LA Discretionary AV': ('om', USMCCV, 'disc'),
    'USAF O&M - ANG Fixture Line Discretionary PP': ('om', ANG, 'disc'),
    'USAF O&M - AFRC Fixture Line Discretionary TSS': ('om', AFRC, 'disc'),
    'USMC STOVL O&M - Fixture Line Discretionary AV': ('om', STOVL, 'disc'),
    'USAF O&M - ANG Fixture Line Mandatory AV': ('om', ANG, 'mand'),
    'USAF O&M - AFRC CAM Discretionary Brimlow': ('om', AFRC, 'disc'),          # gen2's new budget name
    'USAF APXX Full Fund Fixture Line Discretionary AV': ('ff', USAF, 'disc'),
    'USAF APAF Full Fund CHANGE ORDER AV': ('ff', USAF, 'disc'),            # "CHANGE" holds ANG; not a word: USAF
    'USN APN Full Fund SUPT USN CV FIXED JPO SUPT Discretionary BOP': ('ff', USN, 'disc'),
    'USN APN Full Fund SUPT USMC CV FIXED JPO SUPT Discretionary CDS': ('ff', USMCCV, 'disc'),
    'USMC STOVL APN Full Fund SUPT Discretionary PP': ('ff', STOVL, 'disc'),
    'USAF APAF Full Fund ANG SUPT Discretionary MxS': ('ff', ANG, 'disc'),
    'USAF APAF Full Fund AFRC SUPT Discretionary TSS': ('ff', AFRC, 'disc'),
    'USAF APAF Full Fund SUPT PES Mandatory TSS': ('ff', USAF, 'mand'),
    'USN APN Spares Fixture USN CV Discretionary PP': ('sp', USN, 'disc'),
    'USN APN Spares Fixture CONG Discretionary PP': ('sp', USN, 'disc'),     # Navy APN CONG: USN, not v12's USAF
    'USAF APAF Spares Initial Discretionary Kestro': ('sp', USAF, 'disc'),
    'USMC STOVL APN Spares Initial Discretionary Orrin': ('sp', STOVL, 'disc'),
    'USN APN Spares Initial USMC CV Discretionary Hollet': ('sp', USMCCV, 'disc'),
    'USN OPN Fixture Ship Line Discretionary MxS': ('opn', USN, 'disc'),        # Navy OPN: USN, not v12's USAF
    'DLA Reimbursable Line X': (None, UNK, 'disc'),                          # no rule knows it; its sheet says Spares
    'Contractor Furnished Line Q': (None, UNK, 'disc'),                      # nothing identifies it
    'Interagency Reimbursable Z': (None, UNK, 'disc'),
}
GENERIC = {
    'om': ['USAF O&M- Fixture Line Discretionary AV', 'USAF O&M- CAM Discretionary Galvor', 'USN O&M- Fixture USN CV LA Discretionary PSM',
           'USN O&M- Fixture USMC CV LA Discretionary AV', 'USAF O&M - ANG Fixture Line Discretionary PP',
           'USAF O&M - AFRC Fixture Line Discretionary TSS', 'USMC STOVL O&M - Fixture Line Discretionary AV'],
    'ff': ['USAF APXX Full Fund Fixture Line Discretionary AV', 'USN APN Full Fund SUPT USN CV FIXED JPO SUPT Discretionary BOP',
           'USN APN Full Fund SUPT USMC CV FIXED JPO SUPT Discretionary CDS', 'USMC STOVL APN Full Fund SUPT Discretionary PP',
           'USAF APAF Full Fund ANG SUPT Discretionary MxS', 'USAF APAF Full Fund AFRC SUPT Discretionary TSS'],
    'sp': ['USN APN Spares Fixture USN CV Discretionary PP', 'USAF APAF Spares Initial Discretionary Kestro',
           'USMC STOVL APN Spares Initial Discretionary Orrin', 'USN APN Spares Initial USMC CV Discretionary Hollet'],
    'opn': ['USN OPN Fixture Ship Line Discretionary MxS'],
}
EXEC = 'Actual Execution is allocated to a Plan Event'
NA = 'Not Allocated'
UNPROG = 'Unprogrammed - Pending Allocation'
FCST = 'Forecast'
STATUS = {EXEC: ('exec', 'Actual Execution'), NA: ('na', 'Not Allocated'), UNPROG: ('unprog', 'Unprogrammed'),
          FCST: ('fcst', 'Forecast'), '': ('other', '(blank)'), 'Pending Review': ('other', 'Pending Review')}

WORDS = ['Brimlow', 'Castor', 'Delvin', 'Eskar', 'Fennic', 'Galvor', 'Hollet', 'Jurran', 'Kestro', 'Lumen', 'Marrow',
         'Nettle', 'Orrin', 'Pallas', 'Quillon', 'Rasko', 'Sorrel', 'Tamsin', 'Umber', 'Vantor', 'Wexley', 'Yarrow',
         'Zephir', 'Alder', 'Bramble', 'Cinder', 'Dunmore', 'Ember', 'Flint', 'Garnet', 'Heron', 'Ivory', 'Juno']
NOUNS = ['Overhaul', 'Kit Restock', 'Bench Support', 'Depot Labor', 'Software Drop', 'Test Set', 'Repair Pool',
         'Engineering Study', 'Field Team', 'Data Refresh', 'Spares Buy', 'Tooling', 'Training Seats', 'Sim Upgrade',
         'Harness Repair', 'Seal Rework', 'Gearbox Swap', 'Valve Retrofit', 'Panel Repair', 'Coating Line']
PFX = ['KX', 'GX', 'LX', 'RX', 'TX', 'OGC', 'DX', 'NX']
PEOPLE = ['Varn Tolley', 'Imre Quast', 'Sela Dorrin', 'Ottar Venn', 'Pim Halloway', 'Rue Castellan']
EPOCH_FIX = (2026, 11, 1, 0, 0, 0)


def month_end(y, m):
    ny, nm = (y + 1, 1) if m == 12 else (y, m + 1)
    return dt.date(ny, nm, 1) - dt.timedelta(days=1)


def serial1900(d):
    return (d - dt.date(1899, 12, 30)).days


def cents_cell(c):
    # whole dollars as an integer cell, cents as a float whose shortest decimal form is exactly the two-decimal figure
    return c // 100 if c % 100 == 0 else c / 100


class Gen:
    PREFIX = {'om': 'OM', 'ff': 'FF', 'sp': 'SP', 'opn': 'OP', 'misc': 'MX'}     # each row's id: OM-0001 ...

    def __init__(self, seed):
        self.rng = random.Random(seed)
        self.rows = {'om': [], 'ff': [], 'sp': [], 'opn': [], 'misc': []}
        self.n = {'om': 0, 'ff': 0, 'sp': 0, 'opn': 0, 'misc': 0}
        self.used_titles, self.used_pes, self.used_ccars = set(), set(), set()

    # --- names --------------------------------------------------------------------------------------------------
    def title(self):
        while True:
            t = '%s %s' % (self.rng.choice(WORDS), self.rng.choice(NOUNS))
            if t.lower() not in self.used_titles:
                self.used_titles.add(t.lower())
                return t

    def pe(self, fy):
        while True:
            p = '%s - %s%s %s' % (self.rng.choice(PFX), 'FY%02d ' % (fy % 100) if self.rng.random() < .3 else '',
                                  self.rng.choice(WORDS), self.rng.choice(NOUNS))
            if p.lower() not in self.used_pes:
                self.used_pes.add(p.lower())
                return p

    def ccar(self):
        # random numbers stay in JSF9000-9299 and CT-91000-99999, clear of every hand-placed JSF93xx-99xx / CT-90xxx
        while True:
            c = ('JSF9%03d' % self.rng.randint(0, 299)) if self.rng.random() < .6 else ('CT-9%04d' % self.rng.randint(1000, 9999))
            if c.lower() not in self.used_ccars:
                self.used_ccars.add(c.lower())
                return c

    # --- one row ------------------------------------------------------------------------------------------------
    def row(self, tab, fy, ccar, title, budget, pe, date, cents, alloc, pmo, *, fy_cell='=', amount_cell='=',
            date_cell='=', intent_date='=', bad=None, desc=None):
        """One data row. `date` is the intended date (a dt.date or None); a *_cell argument writes that cell some other
        way (text, a serial number, a time of day) while the intent records what that cell must be read as."""
        self.n[tab] += 1
        rid = '%s-%04d' % (self.PREFIX[tab], self.n[tab])
        rng = self.rng
        cells = {h: None for h in RAW_HEADERS}
        cells['FY'] = fy if fy_cell == '=' else fy_cell
        if date_cell == '=':
            cells['Date'] = dt.datetime(date.year, date.month, date.day) if date else None
        else:
            cells['Date'] = date_cell
        idate = (date.isoformat() if date else '') if intent_date == '=' else intent_date
        if idate:
            md = dt.date.fromisoformat(idate)
            cells['Month'] = dt.datetime(md.year, md.month, 1)
        cells['Amount'] = cents_cell(cents) if amount_cell == '=' else amount_cell
        cells['CCaR No'], cells['Title'], cells['Budget'], cells['Plan Event'] = ccar, title, budget, pe
        cells['Alloc'], cells['PMO'] = alloc, pmo
        cells['C/L'], cells['SB'] = 'No', 'No'
        cells['Event Description'] = desc if desc is not None else '%s: %s %s' % (rid, rng.choice(WORDS), rng.choice(NOUNS).lower())
        cells['OPR'] = rng.choice(WORDS).upper()[:6] + rng.choice('ABCDKMPQ')
        cells['PMT PID#'] = 'N00099-%02d-XQ-%04d' % (fy % 100 if isinstance(fy, int) else 26, rng.randint(1, 9999))
        cells['Contracting POC'] = rng.choice(PEOPLE)
        cells['Material Lead'] = rng.choice(PEOPLE) if rng.random() < .5 else None
        cells['PM/TPOC'] = rng.choice(PEOPLE)
        cells['Obligation Category'] = rng.choice(['Prime Contracts', 'OGC', 'Other Services'])
        cells['Sub-PMO'] = 'Sub %s' % rng.choice(WORDS)
        cells['Category'] = rng.choice(['Prime Contracts', 'Organic Support', 'Spares'])
        cells['Navy SI Code'] = rng.choice(['LA', 'EN', None])
        cells['IPT'] = 'IPT %s' % rng.choice(WORDS)
        cells['Quantity'] = rng.choice([None, 1, 2, 12])
        cells['CLINs'] = rng.choice(['0001', '0002', '1001', None])
        cells['AF EEIC'] = rng.choice([None, 57813, 59201])
        cells['RCN'] = rng.choice([None, 83617])
        cells['CSR'] = rng.choice(['Common', None])
        cells['Contract Mod'] = rng.choice(['Basic', 'P000%02d' % rng.randint(1, 40)])
        cells['Cost Element'] = rng.choice(['Sustainment', None])
        bap, bsvc, blane = self.meaning(budget)
        ap = bap
        if tab in ('om', 'ff', 'sp', 'opn') and ap is None:
            ap = tab                 # the sheet name decides (only in v12-named tabs; see the header)
        st, slbl = STATUS[alloc]
        # how a cell was written when not in the ordinary way, so the tests can prove the fixture still covers it
        forms = {}
        if fy_cell != '=':
            forms['fy'] = fy_cell
        if amount_cell != '=':
            forms['amount'] = amount_cell
        if date_cell != '=':
            forms['date'] = date_cell.isoformat() if isinstance(date_cell, dt.datetime) else date_cell
            forms['dateKind'] = ('datetime-with-time' if isinstance(date_cell, dt.datetime) else
                                 'serial' if isinstance(date_cell, (int, float)) else 'text')
        intent = {'id': rid, 'tab': tab, 'ap': ap, 'fy': fy if not (bad and 'FY' in bad) else None,
                  'cents': cents if not (bad and 'Amount' in bad) else None, 'date': idate, 'status': st,
                  'statusLabel': slbl, 'svc': bsvc, 'lane': blane, 'pmo': (pmo or '').strip(),
                  'title': (title or '').strip(), 'pe': (pe or '').strip(), 'ccar': (ccar or '').strip(),
                  'budget': budget, 'bad': sorted(bad or []), 'forms': forms,
                  'raw': {f: v for f, v in (('pmo', pmo), ('title', title), ('pe', pe), ('ccar', ccar))
                          if v is not None and v != v.strip()},
                  'dateCell': 'datetime' if date_cell == '=' and date else ('blank' if date_cell == '=' else
                                                                          type(date_cell).__name__)}
        r = {'cells': cells, 'intent': intent}
        self.rows[tab].append(r)
        return r

    def meaning(self, budget):
        """(ap, service, lane) of a budget name, from the hand-stated table (ObbbaGen adds its own names)."""
        return BUDGETS[budget]

    # --- random programs -------------------------------------------------------------------------------------------
    EXEC_WIN = {2024: (dt.date(2023, 10, 1), dt.date(2026, 6, 30)), 2025: (dt.date(2024, 10, 1), dt.date(2026, 10, 31)),
                2026: (dt.date(2025, 10, 1), dt.date(2026, 10, 31)), 2027: (dt.date(2026, 10, 1), dt.date(2026, 10, 31))}

    def rand_date(self, lo, hi):
        return lo + dt.timedelta(days=self.rng.randint(0, (hi - lo).days))

    def exec_cents(self):
        rng = self.rng
        if rng.random() < .08:
            return -rng.randint(1_000_00, 200_000_00)          # a de-obligation
        c = rng.randint(10_000_00, 4_000_000_00)
        return c - c % 100 if rng.random() < .5 else c

    def na_row(self, tab, fy, ccar, title, budget, pe, pmo):
        rng = self.rng
        roll = rng.random()
        c = rng.randint(50_000_00, 15_000_000_00)
        c = c - c % 100 if rng.random() < .6 else c
        if roll < .62:
            y, m = rng.choice([(2026, 11), (2026, 12)] + [(2027, k) for k in range(1, 10)])
            self.row(tab, fy, ccar, title, budget, pe, month_end(y, m), c, NA, pmo)
        elif roll < .72:
            y, m = rng.choice([(2027, 10), (2027, 11), (2027, 12), (2028, 1), (2028, 3)])
            self.row(tab, fy, ccar, title, budget, pe, month_end(y, m), c, NA, pmo)
        elif roll < .77:
            self.row(tab, fy, ccar, title, budget, pe, None, c, NA, pmo)
        elif roll < .90:
            # planned money whose date has passed sits at $0.00, written as text exactly as CCaR exports it
            y, m = rng.choice([(2026, k) for k in range(1, 11)])
            self.row(tab, fy, ccar, title, budget, pe, month_end(y, m), 0, NA, pmo, amount_cell='$0.00')
        else:
            y, m = rng.choice([(2026, 5), (2026, 7), (2026, 9)])
            self.row(tab, fy, ccar, title, budget, pe, month_end(y, m), c, NA, pmo)

    def program(self, tab, fy, pmo=None, n_budgets=None):
        rng = self.rng
        pmo = pmo or rng.choice([AV, AV, AV, PSM, PSM, PSM, PP, PP, BOP, CDS, MXS, TSS])
        title, ccar = self.title(), self.ccar()
        budgets = rng.sample(GENERIC[tab], k=min(len(GENERIC[tab]), n_budgets or rng.choice([1, 1, 2, 2, 3])))
        for _ in range(rng.choice([1, 2, 2])):
            pe = self.pe(fy)
            for b in budgets:
                n_exec = rng.choice([0, 1, 1, 2]) if fy != 2027 else rng.choice([0, 0, 1])
                for _ in range(n_exec):
                    lo, hi = self.EXEC_WIN[fy]
                    self.row(tab, fy, ccar, title, b, pe, self.rand_date(lo, hi), self.exec_cents(), EXEC, pmo)
                for _ in range(rng.choice([0, 1, 1, 2]) if fy >= 2025 else rng.choice([0, 1])):
                    self.na_row(tab, fy, ccar, title, b, pe, pmo)


def build_gen1(seed):
    g = Gen(seed)
    R = g.row
    D = dt.date
    # ------------------------------------------------------------------------------------------------------- O&M
    # FY2024 money is before firstFY 2025: counted nowhere in "all", counted (p4/om2, n = 4) in "first-2024"
    for _ in range(3):
        g.program('om', 2024)
    for _ in range(7):
        g.program('om', 2025)
    # O&M FY2025 also carries a Mandatory line (the contract's example name), so mand-only has more than one block
    R('om', 2025, 'JSF9501', 'Surge Readiness Funding', 'USAF O&M - ANG Fixture Line Mandatory AV', 'AX - Surge Option A',
      D(2026, 4, 17), 3_250_000_00, EXEC, AV)
    R('om', 2025, 'JSF9501', 'Surge Readiness Funding', 'USAF O&M - ANG Fixture Line Mandatory AV', 'AX - Surge Option A',
      D(2027, 4, 30), 1_125_000_00, NA, AV)
    for _ in range(14):
        g.program('om', 2026)
    # case and space variants of one title: all on one budget, so no switch can change which spelling is the majority
    H = ('JSF9301', 'USN O&M- Fixture USN CV LA Discretionary PSM', 'MX - Hydraulic Pump Teardown', MXS)
    R('om', 2026, H[0], 'Hydraulic Pump Overhaul', H[1], H[2], D(2025, 12, 12), 412_000_00, EXEC, H[3])
    R('om', 2026, H[0], 'Hydraulic Pump Overhaul', H[1], H[2], D(2026, 2, 26), 233_418_75, EXEC, H[3], fy_cell='FY26')
    R('om', 2026, H[0], 'HYDRAULIC PUMP OVERHAUL', H[1], H[2], D(2026, 3, 31), 96_250_00, EXEC, H[3])
    R('om', 2026, H[0], 'Hydraulic Pump Overhaul', H[1], H[2], D(2027, 1, 31), 1_310_000_00, NA, H[3])
    R('om', 2026, H[0], '  Hydraulic   Pump Overhaul ', H[1], H[2], D(2027, 1, 31), 145_500_00, NA, H[3])
    R('om', 2026, H[0], 'Hydraulic Pump Overhaul', H[1], H[2], D(2027, 5, 31), 870_000_00, NA, H[3])
    # a non-breaking space inside a title: one node with 'Radar Shroud Repair', labelled by the majority
    Rd = ('JSF9302', 'USMC STOVL O&M - Fixture Line Discretionary AV', 'AX - Shroud Seal Rework', AV)
    for d, c, a, t in [(D(2025, 11, 20), 515_000_00, EXEC, 'Radar Shroud Repair'),
                       (D(2026, 6, 30), 205_000_00, EXEC, 'Radar\xa0Shroud Repair'),
                       (D(2027, 2, 28), 640_000_00, NA, 'Radar Shroud Repair'),
                       (D(2027, 8, 31), 380_000_00, NA, 'Radar Shroud Repair')]:
        R('om', 2026, Rd[0], t, Rd[1], Rd[2], d, c, a, Rd[3])
    # a title holding markup characters
    T = ('CT-90311', 'Ventral <b>&"\' Fairing Study', 'USAF O&M- Fixture Line Discretionary AV', 'CX - Fairing Load Survey', CDS)
    R('om', 2026, T[0], T[1], T[2], T[3], D(2026, 1, 15), 720_000_00, EXEC, T[4])
    R('om', 2026, T[0], T[1], T[2], T[3], D(2026, 9, 3), 88_000_25, EXEC, T[4])
    R('om', 2026, T[0], T[1], T[2], T[3], D(2027, 2, 28), 455_000_00, NA, T[4])
    # every way CCaR writes an amount, a sub-cent number (rounded half away from zero), an unreadable amount, an
    # unreadable date, a blank Alloc, a blank title, a blank CCaR and a blank plan event
    L = ('JSF9304', 'Ledger Cleanup Batch', 'USAF O&M- CAM Discretionary Galvor', BOP)
    R('om', 2026, L[0], L[1], L[2], 'BX - Prior Year Recoupment', D(2026, 3, 16), -123456, EXEC, L[3], amount_cell='(1,234.56)')
    R('om', 2026, L[0], L[1], L[2], 'BX - Prior Year Recoupment', D(2026, 4, 16), 123450, EXEC, L[3], amount_cell='$1,234.50')
    R('om', 2026, L[0], L[1], L[2], 'BX - Prior Year Recoupment', D(2026, 5, 18), -123400, EXEC, L[3], amount_cell=' -1234 ')
    R('om', 2026, L[0], L[1], L[2], 'BX - Prior Year Recoupment', D(2026, 6, 18), 1013, EXEC, L[3], amount_cell=10.125)
    R('om', 2026, L[0], L[1], L[2], 'BX - Prior Year Recoupment', D(2026, 7, 20), -238, EXEC, L[3], amount_cell=-2.375)
    R('om', 2026, L[0], L[1], L[2], 'BX - Prior Year Recoupment', D(2026, 8, 20), 123450, EXEC, L[3], amount_cell='1,234.50')
    R('om', 2026, L[0], L[1], L[2], 'BX - Prior Year Recoupment', D(2027, 5, 31), None, NA, L[3], amount_cell='TBD',
      bad=['Amount'])
    R('om', 2026, L[0], L[1], L[2], 'BX - Undated Recovery Item', None, 75_000_00, NA, L[3], date_cell='TBD',
      intent_date='')
    R('om', 2026, L[0], L[1], L[2], 'BX - Status Missing Item', D(2027, 2, 28), 310_000_00, '', L[3])
    R('om', 2026, L[0], L[1], L[2], '', D(2026, 2, 12), 77_000_00, EXEC, L[3])
    R('om', 2026, '', '', 'USAF O&M- Fixture Line Discretionary AV', 'MX - Unassigned Labor Charge', D(2026, 5, 7), 125_000_00,
      EXEC, MXS)
    # JSF6654, a special CCaR: its Not Allocated rows are one item per month, labelled by the majority TITLE
    J = ('JSF6654', 'Airframe Annual Readiness Bundle', AV)
    for i, (b, pe) in enumerate([('USAF O&M- Fixture Line Discretionary AV', 'LX - Readiness Option 1'),
                                  ('USN O&M- Fixture USN CV LA Discretionary PSM', 'LX - Readiness Option 2'),
                                  ('USN O&M- Fixture USN CV LA Discretionary PSM', 'LX - Readiness Option 3')]):
        R('om', 2026, J[0], J[1], b, pe, D(2025, 12, 19), 2_100_000_00 + i * 37_000_00, EXEC, J[2])
        R('om', 2026, J[0], J[1], b, pe, D(2027, 4, 30), 1_400_000_00 + i * 11_000_00, NA, J[2])
    R('om', 2026, J[0], 'AIRFRAME ANNUAL READINESS BUNDLE', 'USAF O&M- Fixture Line Discretionary AV', 'LX - Readiness Option 1',
      D(2027, 4, 30), 210_000_00, NA, J[2])
    # PP 2000, the other special CCaR, across two budgets and two plan events (the second goes in gen2)
    P = ('PP 2000', 'Propulsion Engine Support Pool', PP)
    for b in ('USAF O&M - ANG Fixture Line Discretionary PP', 'USAF O&M- CAM Discretionary Galvor'):
        R('om', 2026, P[0], P[1], b, 'EX - Engine Pool Fixed Fee', D(2025, 11, 26), 4_400_000_00, EXEC, P[2])
        R('om', 2026, P[0], P[1], b, 'EX - Engine Pool Fixed Fee', D(2027, 6, 30), 2_750_000_00, NA, P[2])
        R('om', 2026, P[0], P[1], b, 'EX - Engine Pool Repairables', D(2027, 6, 30), 980_000_00, NA, P[2])
        R('om', 2026, P[0], P[1], b, 'EX - Engine Pool Repairables', D(2026, 4, 30), 1_660_000_00, EXEC, P[2])
    # an office not in the contract's list
    g.program('om', 2026, pmo=SA)

    for _ in range(11):
        g.program('om', 2027)
    # a row in every month of the FY2027 window, one plan event, so each month's list has an item
    C = ('CT-90401', 'Fleet Readiness Cadence', 'USAF O&M - AFRC Fixture Line Discretionary TSS', 'PX - Cadence Plan', PSM)
    R('om', 2027, C[0], C[1], C[2], C[3], D(2026, 10, 14), 600_000_00, EXEC, C[4])
    for k, (y, m) in enumerate([(2026, 10), (2026, 11), (2026, 12)] + [(2027, i) for i in range(1, 10)]):
        R('om', 2027, C[0], C[1], C[2], C[3], month_end(y, m), 1_000_000_00 + k * 123_456_78, NA, C[4])
    R('om', 2027, C[0], C[1], C[2], C[3], D(2026, 8, 31), 444_000_00, NA, C[4])          # Prior, not zero
    R('om', 2027, C[0], C[1], C[2], C[3], D(2027, 11, 30), 777_000_00, NA, C[4])         # FY2028+
    R('om', 2027, C[0], C[1], C[2], C[3], None, 333_000_00, NA, C[4])                     # No date
    # PP 2000 again, with a ' pp 2000' spelling (spaces and lower case) that must group, and be special, all the same
    for b, cc, d, c, a in [('USAF O&M- CAM Discretionary Galvor', 'PP 2000', D(2026, 10, 22), 5_200_000_00, EXEC),
                           ('USAF O&M- CAM Discretionary Galvor', 'PP 2000', D(2027, 3, 31), 3_100_000_00, NA),
                           ('USAF O&M- CAM Discretionary Galvor', ' pp 2000', D(2027, 3, 31), 400_000_00, NA),
                           ('USAF O&M- CAM Discretionary Galvor', 'PP 2000', D(2027, 7, 31), 1_900_000_00, NA),
                           ('USAF O&M - ANG Fixture Line Discretionary PP', 'PP 2000', D(2027, 3, 31), 860_000_00, NA),
                           ('USAF O&M - ANG Fixture Line Discretionary PP', 'PP 2000', D(2027, 7, 31), 515_000_00, NA)]:
        R('om', 2027, cc, P[1], b, 'EX - Engine Pool Fixed Fee', d, c, a, P[2])
    R('om', 2027, 'PP 2000', P[1], 'USAF O&M - ANG Fixture Line Discretionary PP', 'EX - Engine Pool Surge', D(2027, 3, 31),
      260_000_00, NA, P[2])
    # a plan event holding a closing script tag, and one longer than 80 characters (v12 cut them, and lost the money)
    S = ('JSF9402', 'Simulator Close-out', 'USMC STOVL O&M - Fixture Line Discretionary AV', 'Close-out </script> review', TSS)
    R('om', 2027, S[0], S[1], S[2], S[3], D(2027, 1, 31), 290_000_00, NA, S[4])
    R('om', 2027, S[0], S[1], S[2], S[3], D(2027, 12, 31), 145_000_00, NA, S[4])
    LONG = 'Integrated Logistics Readiness Analysis for Distributed Depot Nodes, Field Teams and Afloat Units - Phase 2'
    assert len(LONG) > 80
    R('om', 2027, 'JSF9403', 'Afloat Readiness Analysis', 'USN O&M- Fixture USN CV LA Discretionary PSM', LONG,
      D(2027, 3, 31), 1_750_000_00, NA, PSM)
    R('om', 2027, 'JSF9403', 'Afloat Readiness Analysis', 'USN O&M- Fixture USN CV LA Discretionary PSM', LONG,
      D(2027, 7, 31), 925_000_00, NA, PSM)
    # every other status: an Alloc text no rule knows, Forecast, and (in FF) Unprogrammed
    R('om', 2027, 'JSF9404', 'Review Board Holdback', 'USAF O&M- CAM Discretionary Galvor', 'QX - Awaiting Review Item',
      D(2027, 5, 31), 420_000_00, 'Pending Review', BOP)
    R('om', 2027, 'JSF9404', 'Review Board Holdback', 'USAF O&M- CAM Discretionary Galvor', 'FX - Forecast Buy',
      D(2027, 8, 31), 1_230_000_00, FCST, BOP)
    R('om', 2027, 'JSF9404', 'Review Board Holdback', 'USAF O&M- CAM Discretionary Galvor', 'FX - Forecast Buy',
      D(2027, 9, 30), 640_500_00, FCST, BOP)
    # an executed row dated after the as-of month: counted in Obligated, and reported
    R('om', 2027, 'JSF9405', 'Canopy Seal Refresh', 'USAF O&M- Fixture Line Discretionary AV', 'AX - Canopy Seal Lot 1',
      D(2026, 11, 20), 1_850_000_00, EXEC, AV)
    R('om', 2027, 'JSF9405', 'Canopy Seal Refresh', 'USAF O&M- Fixture Line Discretionary AV', 'AX - Canopy Seal Lot 1',
      D(2027, 6, 30), 2_600_000_00, NA, AV)
    # dates written as an Excel serial number, a serial with a time of day, a date cell with a time, and 'Mon-YYYY'
    R('om', 2027, 'JSF9406', 'Wing Seal Kit', 'USAF O&M - AFRC Fixture Line Discretionary TSS', 'TX - Wing Seal Build',
      D(2027, 3, 31), 512_000_00, NA, TSS, date_cell=serial1900(D(2027, 3, 31)))
    R('om', 2027, ' JSF9406 ', '  Wing Seal Kit  ', 'USAF O&M - AFRC Fixture Line Discretionary TSS', 'TX - Wing Seal Build',
      D(2027, 1, 15), 287_000_00, NA, TSS, date_cell=serial1900(D(2027, 1, 15)) + 0.75)
    R('om', 2027, 'JSF9406', 'Wing Seal Kit', 'USAF O&M - AFRC Fixture Line Discretionary TSS', 'TX - Wing Seal Build',
      D(2027, 7, 15), 199_000_00, NA, TSS, date_cell=dt.datetime(2027, 7, 15, 13, 45))
    R('om', 2027, 'JSF9406', 'Wing Seal Kit', 'USAF O&M - AFRC Fixture Line Discretionary TSS', 'TX - Wing Seal Build',
      D(2027, 6, 1), 168_000_00, NA, TSS, date_cell='Jun-2027')
    # a plan event with a leading space on some rows: the same node, the same spelling once trimmed
    for pe, d, c, a in [(' Avionics Bench Spares', D(2026, 10, 9), 351_000_00, EXEC),
                        ('Avionics Bench Spares', D(2027, 2, 28), 612_000_00, NA),
                        (' Avionics Bench Spares', D(2027, 9, 30), 233_000_00, NA)]:
        R('om', 2027, 'JSF9407', 'Avionics Bench Program', 'USN O&M- Fixture USMC CV LA Discretionary AV', pe, d, c, a, MXS)
    # one plan event shared by two programmes in two offices: one Not Allocated item naming both
    R('om', 2027, 'JSF9408', 'Depot Hold Account', 'USN O&M- Fixture USN CV LA Discretionary PSM',
      'Hold - Pending Funds Return', D(2027, 9, 30), 2_015_000_00, NA, PSM)
    R('om', 2027, 'JSF9409', 'Engine Hold Account', 'USMC STOVL O&M - Fixture Line Discretionary AV',
      'Hold - Pending Funds Return', D(2027, 9, 30), 1_104_000_00, NA, PP)
    # a blank PMO (written as spaces: trimmed, it is blank)
    R('om', 2027, 'CT-90405', 'Unowned Shop Supplies', 'USAF O&M - ANG Fixture Line Discretionary PP', 'SX - Shop Consumables',
      D(2026, 10, 5), 92_500_00, EXEC, '   ')
    R('om', 2027, 'CT-90405', 'Unowned Shop Supplies', 'USAF O&M - ANG Fixture Line Discretionary PP', 'SX - Shop Consumables',
      D(2027, 4, 30), 310_250_00, NA, '   ')
    # money for a later year (FY2028, n = 0 in "all": no curve, every goal null)
    R('om', 2028, 'JSF9410', 'Out-year Readiness Placeholder', 'USN O&M- Fixture USN CV LA Discretionary PSM',
      'PX - Out-year Placeholder', D(2027, 12, 31), 2_400_000_00, NA, PSM)

    # ------------------------------------------------------------------------------------------------- Full Fund
    # Everything here also goes out as CSV text, so every cell reads the same both ways: no serial dates, no times.
    for _ in range(3):
        g.program('ff', 2024)
    for _ in range(8):
        g.program('ff', 2025)
    LONGF = 'FY25 Procurement of Depot Standup Test Equipment for Distributed Repair Cells and Mobile Teams - Lot 3'
    assert len(LONGF) > 80
    R('ff', 2025, 'JSF9611', 'Depot Standup Equipment', 'USAF APXX Full Fund Fixture Line Discretionary AV', LONGF,
      D(2025, 3, 14), 3_300_000_00, EXEC, AV)
    R('ff', 2025, 'JSF9611', 'Depot Standup Equipment', 'USAF APXX Full Fund Fixture Line Discretionary AV', LONGF,
      D(2027, 2, 28), 1_480_000_00, NA, AV)
    for _ in range(11):
        g.program('ff', 2026)
    R('ff', 2026, 'JSF9601', 'Lift Fan Change Orders', 'USAF APAF Full Fund CHANGE ORDER AV', 'AX - Change Order 7',
      D(2026, 1, 22), 2_450_000_00, EXEC, AV, fy_cell='FY2026')
    R('ff', 2026, 'JSF9601', 'Lift Fan Change Orders', 'USAF APAF Full Fund CHANGE ORDER AV', 'AX - Change Order 7',
      D(2026, 7, 9), -123456, EXEC, AV, amount_cell='-$1,234.56',
      desc='FF-note: de-obligation after review,\nsecond line kept inside the "quoted" field')
    R('ff', 2026, 'JSF9601', 'Lift Fan Change Orders', 'USAF APAF Full Fund CHANGE ORDER AV', 'AX - Change Order 7',
      D(2026, 8, 6), -123456, EXEC, AV, amount_cell='$(1,234.56)')
    R('ff', 2026, 'JSF9601', 'Lift Fan Change Orders', 'USAF APAF Full Fund CHANGE ORDER AV', 'AX - Change Order 8',
      D(2026, 9, 1), 388, EXEC, AV, amount_cell=3.875)
    R('ff', 2026, 'JSF9601', 'Lift Fan Change Orders', 'USAF APAF Full Fund CHANGE ORDER AV', 'AX - Change Order 8',
      D(2027, 4, 30), None, NA, AV, amount_cell='1,23,456', bad=['Amount'])
    # text dates in each form the contract reads
    R('ff', 2026, 'JSF9602', 'Galvor Seal Kits', 'USN APN Full Fund SUPT USMC CV FIXED JPO SUPT Discretionary CDS',
      'Seal Kit Restock', D(2027, 3, 5), 980_000_00, NA, CDS, date_cell='3/5/2027')
    R('ff', 2026, 'JSF9602', 'Galvor Seal Kits', 'USN APN Full Fund SUPT USMC CV FIXED JPO SUPT Discretionary CDS',
      'SEAL KIT RESTOCK', D(2027, 3, 15), 410_000_00, NA, CDS, date_cell='15 Mar 2027')
    R('ff', 2026, 'JSF9602', 'Galvor Seal Kits', 'USN APN Full Fund SUPT USMC CV FIXED JPO SUPT Discretionary CDS',
      'Seal Kit Restock', D(2027, 3, 31), 615_000_00, NA, CDS)
    R('ff', 2026, 'JSF9602', 'Galvor Seal Kits', 'USN APN Full Fund SUPT USMC CV FIXED JPO SUPT Discretionary CDS',
      'Seal Kit Restock', D(2027, 8, 1), 1_204_000_00, NA, CDS, date_cell='Aug-2027')
    R('ff', 2026, 'JSF9602', 'Galvor Seal Kits', 'USN APN Full Fund SUPT USMC CV FIXED JPO SUPT Discretionary CDS',
      'Seal Kit Restock', D(2026, 2, 3), 2_200_000_00, EXEC, CDS)
    # the image-tag plan event
    for d, c in [(D(2026, 12, 31), 730_000_00), (D(2027, 6, 30), 455_500_00)]:
        R('ff', 2026, 'CT-90603', 'Harness Retrofit Lot', 'USMC STOVL APN Full Fund SUPT Discretionary PP',
          '"><img src=x onerror=alert(1)>', d, c, NA, PP)
    # Mandatory
    R('ff', 2026, 'JSF9604', 'Trainer Mandated Upgrade', 'USAF APAF Full Fund SUPT PES Mandatory TSS', 'TX - Mandate Lot 1',
      D(2026, 3, 30), 3_900_000_00, EXEC, TSS)
    R('ff', 2026, 'JSF9604', 'Trainer Mandated Upgrade', 'USAF APAF Full Fund SUPT PES Mandatory TSS', 'TX - Mandate Lot 1',
      D(2027, 5, 31), 2_250_000_00, NA, TSS)
    # Unprogrammed, as CCaR shows it, and a Forecast
    for b, c, d in [('USN APN Full Fund SUPT USN CV FIXED JPO SUPT Discretionary BOP', 4_020_000_00, D(2027, 9, 30)),
                    ('USAF APXX Full Fund Fixture Line Discretionary AV', 1_515_000_00, D(2027, 9, 30)),
                    ('USMC STOVL APN Full Fund SUPT Discretionary PP', 655_000_00, D(2027, 10, 31))]:
        R('ff', 2026, 'UPL-9XR', 'UPL - Budget Authority Reconciliation Pool', b, 'UPL - Authority Reconciliation', d, c,
          UNPROG, BOP)
    R('ff', 2026, 'JSF9605', 'Forecast Spares Kitting', 'USAF APAF Full Fund ANG SUPT Discretionary MxS', 'MX - Kitting Run',
      D(2027, 1, 31), 545_000_00, FCST, MXS)
    # an executed row dated after the as-of month
    R('ff', 2026, 'JSF9606', 'Bay Door Actuators', 'USAF APAF Full Fund AFRC SUPT Discretionary TSS', 'TX - Actuator Buy',
      D(2027, 2, 10), 1_330_000_00, EXEC, TSS,
      desc='FF-note: obligated early,\r\nwith a carriage return and a comma, inside quotes')
    # gen2 moves this CCaR to another office, and drops the next one entirely
    for d, c, a in [(D(2026, 5, 14), 1_870_000_00, EXEC), (D(2027, 3, 31), 920_000_00, NA), (D(2027, 9, 30), 315_000_00, NA)]:
        R('ff', 2026, 'CT-90612', 'Trainer Visual Upgrade', 'USAF APAF Full Fund AFRC SUPT Discretionary TSS',
          'TX - Visual System Refresh', d, c, a, TSS)
    for d, c, a in [(D(2026, 6, 25), 640_000_00, EXEC), (D(2027, 4, 30), 280_000_00, NA)]:
        R('ff', 2026, 'JSF9613', 'Comms Rack Refit', 'USN APN Full Fund SUPT USMC CV FIXED JPO SUPT Discretionary CDS',
          'CX - Rack Refit', d, c, a, CDS)
    for _ in range(9):
        g.program('ff', 2027)
    C2 = ('CT-90621', 'Depot Line Cadence', 'USN APN Full Fund SUPT USN CV FIXED JPO SUPT Discretionary BOP',
          'BX - Line Cadence', BOP)
    for k, (y, m) in enumerate([(2026, 10), (2026, 11), (2026, 12)] + [(2027, i) for i in range(1, 10)]):
        R('ff', 2027, C2[0], C2[1], C2[2], C2[3], month_end(y, m), 700_000_00 + k * 98_765_43, NA, C2[4])
    g.program('ff', 2027, pmo=SA)

    # ------------------------------------------------------------------------------------------------ Initial Spares
    for _ in range(2):
        g.program('sp', 2024)
    for _ in range(5):
        g.program('sp', 2025)
    R('sp', 2025, 'CT-90701', 'Shipboard Spares Package', 'USN APN Spares Fixture CONG Discretionary PP',
      'PX - Afloat Package 2', D(2025, 5, 30), 1_620_000_00, EXEC, PP)
    R('sp', 2025, 'CT-90701', 'Shipboard Spares Package', 'USN APN Spares Fixture CONG Discretionary PP',
      'PX - Afloat Package 2', D(2027, 1, 31), 840_000_00, NA, PP)
    for _ in range(5):
        g.program('sp', 2026)
    # a budget no rule knows (Spares by its sheet; service not identified), FY as text, and an unreadable FY
    R('sp', 2026, 'CT-90702', 'Consumables Reimbursement', 'DLA Reimbursable Line X', 'DX - Consumables Draw',
      D(2026, 2, 19), 377_000_00, EXEC, PP, fy_cell='2026')
    R('sp', 2026, 'CT-90702', 'Consumables Reimbursement', 'DLA Reimbursable Line X', 'DX - Consumables Draw',
      D(2027, 5, 31), 266_000_00, NA, PP)
    R('sp', 2026, 'CT-90703', 'Bracket Spares Lot', 'USAF APAF Spares Initial Discretionary Kestro', 'AX - Bracket Lot',
      D(2026, 4, 2), 55_000_00, EXEC, AV, fy_cell='FY-TBD', bad=['FY'])
    R('sp', 2026, 'CT-90704', 'Unassigned Spares Pool', 'USMC STOVL APN Spares Initial Discretionary Orrin', 'SX - Pool Draw',
      D(2026, 3, 11), 1_190_000_00, EXEC, '   ')
    R('sp', 2026, 'CT-90704', 'Unassigned Spares Pool', 'USMC STOVL APN Spares Initial Discretionary Orrin', 'SX - Pool Draw',
      D(2027, 6, 30), 735_000_00, NA, '')
    for _ in range(4):
        g.program('sp', 2027)

    # ----------------------------------------------------------------------------------------------------- OPN
    g.program('opn', 2024)
    # a block whose rows net to zero: Approved 0, so every percentage is null
    R('opn', 2025, 'JSF9801', 'Ship Alt Prototype', 'USN OPN Fixture Ship Line Discretionary MxS', 'NX - Prototype Install',
      D(2025, 1, 15), 1_234_567, EXEC, MXS)
    R('opn', 2025, 'JSF9801', 'Ship Alt Prototype', 'USN OPN Fixture Ship Line Discretionary MxS', 'NX - Prototype Install',
      D(2025, 6, 30), -1_234_567, EXEC, MXS)
    R('opn', 2025, 'JSF9801', 'Ship Alt Prototype', 'USN OPN Fixture Ship Line Discretionary MxS', 'NX - Prototype Install',
      D(2026, 9, 30), 0, NA, MXS, amount_cell='$0.00')
    for _ in range(4):
        g.program('opn', 2026)
    for _ in range(3):
        g.program('opn', 2027)

    # ---------------------------------------------------------------------------------- appropriation not identified
    R('misc', 2026, 'CT-90901', 'Contractor Furnished Items', 'Contractor Furnished Line Q', 'QX - Furnished Items',
      D(2026, 4, 9), 640_000_00, EXEC, AV)
    R('misc', 2027, 'CT-90902', 'Interagency Support Line', 'Interagency Reimbursable Z', 'QX - Interagency Draw',
      D(2027, 2, 28), 210_000_00, NA, PSM)
    return g


def build_gen2(g1):
    """The later pull of O&M and FF: changed amounts, a new CCaR on a new budget name, a plan event gone, a CCaR moved to
    another office and one gone. Spares and OPN are not in it, so they stay from gen1."""
    g = copy.deepcopy(g1)
    g.rng = random.Random(4242)
    D = dt.date
    changes = {'gonePe': 'EX - Engine Pool Repairables', 'gonePeAp': 'om', 'newCcar': 'JSF9950', 'newCcarAp': 'om',
               'newBudget': 'USAF O&M - AFRC CAM Discretionary Brimlow', 'goneCcar': 'JSF9613', 'goneCcarAp': 'ff',
               'movedCcar': 'CT-90612', 'movedAp': 'ff', 'movedFrom': TSS, 'movedTo': AV}
    g.rows['om'] = [r for r in g.rows['om'] if r['intent']['pe'] != changes['gonePe']]
    for r in g.rows['om']:
        it = r['intent']
        # changed amounts: the cadence plan's first months shrink as money is executed against them
        if it['title'] == 'Fleet Readiness Cadence' and it['status'] == 'na' and it['date'] in (
                '2026-11-30', '2026-12-31', '2027-01-31'):
            it['cents'] = it['cents'] * 6 // 10
            it['cents'] -= it['cents'] % 100
            r['cells']['Amount'] = cents_cell(it['cents'])
    g.row('om', 2027, 'CT-90401', 'Fleet Readiness Cadence', 'USAF O&M - AFRC Fixture Line Discretionary TSS', 'PX - Cadence Plan',
          D(2026, 10, 29), 1_250_000_00, EXEC, PSM)
    for d, c, a in [(D(2026, 10, 27), 410_000_00, EXEC), (D(2026, 12, 31), 535_000_00, NA), (D(2027, 4, 30), 905_500_00, NA)]:
        g.row('om', 2027, changes['newCcar'], 'Corrosion Mapping Pilot', changes['newBudget'], 'CX - Corrosion Survey',
              d, c, a, CDS)
    g.rows['ff'] = [r for r in g.rows['ff'] if r['intent']['ccar'] != changes['goneCcar']]
    for r in g.rows['ff']:
        it = r['intent']
        if it['ccar'] == changes['movedCcar']:
            it['pmo'] = changes['movedTo']
            r['cells']['PMO'] = changes['movedTo']
        if it['ccar'] == 'UPL-9XR' and it['budget'].endswith('BOP'):
            it['cents'] = 3_610_000_00
            r['cells']['Amount'] = cents_cell(it['cents'])
    return g, changes


# ================================================================================================ the BAE report (§14)
# The report of budgets beside the pull: each budget's Approved and Authorized by FY, in DOLLARS (the "($M)" in a header
# describes the display, a number format, not the value). Shaped like the real report: one sheet, the 28 headers below
# with the header on row 1, a money format that shows $M, '$0.000' written as TEXT where nothing is authorized, styled
# empty cells, and the report's own total row at the end. Every name and figure is invented.
#
# It is drawn from its OWN random stream (seeded from --seed, never the pull's), and only after both pulls are built:
# not one pull row moves, so every scenario that reads the pulls alone keeps its exact expected output.
BAE_HEADERS = ['Budget Name', 'Budget FY Numeric', 'Budget Approved Amount ($M)', 'Budget Authorized Amount ($M)',
               'Budget Service', 'APPN AF', 'APPN SFIS', 'BA SFIS', 'BLI SFIS', 'BPAC', 'BSA SFIS', 'Budget Exec Years',
               'Budget Flex 01', 'Budget Flex 02', 'Budget Flex 03', 'Budget Office', 'DEPT AF', 'DEPT SFIS', 'Limit AF',
               'Limit SFIS', 'OBAN', 'PEC', 'PEC SFIS', 'RCCC', 'Cost Element', 'Project Description', 'Variant',
               'Navy PU']
BAE_NAME, BAE_FY, BAE_APP, BAE_AUTH = BAE_HEADERS[:4]
BAE_MONEY_FMT = '$#,##0.000,,_);($#,##0.000,,)'       # dollars shown as $M, as the real report shows them
BAE_HDR_FMT = '#;#;0;@'
BAE_ZERO = '$0.000'                                     # the report's own zero, written as text
NOPMO = '(no PMO)'
# The budget's PMO (§14.2: the last word of the name, against each PMO's code), stated BY HAND for every name the pull
# uses, never by running the rule: the oracle applies the rule to the text and the tests compare the two.
BUDGET_PMO = {
    'USAF O&M- Fixture Line Discretionary AV': AV, 'USAF O&M- CAM Discretionary Galvor': NOPMO,
    'USN O&M- Fixture USN CV LA Discretionary PSM': PSM, 'USN O&M- Fixture USMC CV LA Discretionary AV': AV,
    'USAF O&M - ANG Fixture Line Discretionary PP': PP, 'USAF O&M - AFRC Fixture Line Discretionary TSS': TSS,
    'USMC STOVL O&M - Fixture Line Discretionary AV': AV, 'USAF O&M - ANG Fixture Line Mandatory AV': AV,
    'USAF O&M - AFRC CAM Discretionary Brimlow': NOPMO,
    'USAF APXX Full Fund Fixture Line Discretionary AV': AV, 'USAF APAF Full Fund CHANGE ORDER AV': AV,
    'USN APN Full Fund SUPT USN CV FIXED JPO SUPT Discretionary BOP': BOP,
    'USN APN Full Fund SUPT USMC CV FIXED JPO SUPT Discretionary CDS': CDS,
    'USMC STOVL APN Full Fund SUPT Discretionary PP': PP, 'USAF APAF Full Fund ANG SUPT Discretionary MxS': MXS,
    'USAF APAF Full Fund AFRC SUPT Discretionary TSS': TSS, 'USAF APAF Full Fund SUPT PES Mandatory TSS': TSS,
    'USN APN Spares Fixture USN CV Discretionary PP': PP, 'USN APN Spares Fixture CONG Discretionary PP': PP,
    'USAF APAF Spares Initial Discretionary Kestro': NOPMO, 'USMC STOVL APN Spares Initial Discretionary Orrin': NOPMO,
    'USN APN Spares Initial USMC CV Discretionary Hollet': NOPMO, 'USN OPN Fixture Ship Line Discretionary MxS': MXS,
    'DLA Reimbursable Line X': NOPMO, 'Contractor Furnished Line Q': NOPMO, 'Interagency Reimbursable Z': NOPMO,
}
# Names only the report carries, and what each MEANS by §14.2, stated by hand: (ap, scope, service, lane, budget's PMO).
# scope 'in' = a sustainment budget; 'flyaway' = Full Fund Flyaway (production); 'noap' = the name places no
# appropriation (Advance Procurement, Modifications, RDT&E, a squadron).
BAE_ONLY = {
    # in scope, money the pull does not plan (reportOnly)
    'USAF O&M- Fixture Depot Line Discretionary PSM': ('om', 'in', USAF, 'disc', PSM),          # gone in gen2
    'USAF O&M- Fixture Bench Line Discretionary mxs': ('om', 'in', USAF, 'disc', MXS),          # a code in lower case
    'USN O&M- Fixture Analytics Line Discretionary SA': ('om', 'in', USN, 'disc', SA),           # a PMO from the pull
    'DoN O&M Fixture Reimbursable Line Discretionary PSM': ('om', 'in', UNK, 'disc', PSM),       # no service rule
    'USAF O&M - AFRC Fixture Line Mandatory TSS': ('om', 'in', AFRC, 'mand', TSS),
    'USMC CV O&M- Fixture Line Discretionary CV': ('om', 'in', USMCCV, 'disc', NOPMO),            # 'CV' is no code
    'USAF O&M- Fixture Line Discretionary CAM': ('om', 'in', USAF, 'disc', NOPMO),
    'USMC STOVL APN Full Fund SUPT Mandatory PP': ('ff', 'in', STOVL, 'mand', PP),
    'USAF APAF Full Fund Fixture Line SUPT': ('ff', 'in', USAF, 'disc', NOPMO),
    'USN APN Spares Fixture Pool Initial': ('sp', 'in', USN, 'disc', NOPMO),
    'USN OPN Fixture Ship Line Non-PMO': ('opn', 'in', USN, 'disc', NOPMO),
    'USN O&M- Fixture Corrosion Line Discretionary CDS': ('om', 'in', USN, 'disc', CDS),         # new in gen2
    # Full Fund Flyaway: aircraft production, out of scope however large (the third spells the word in capitals)
    'USAF APAF Full Fund Flyaway Lot Discretionary AV': ('ff', 'flyaway', USAF, 'disc', AV),
    'USMC STOVL APN Full Fund Flyaway Discretionary AV': ('ff', 'flyaway', STOVL, 'disc', AV),
    'USN APN Full Fund FLYAWAY USN CV Spt Discretionary CDS': ('ff', 'flyaway', USN, 'disc', CDS),
    # names that place no appropriation
    'USAF APAF Advance Procurement Fixture Lot Discretionary AV': (None, 'noap', USAF, 'disc', AV),
    'USAF APAF Modifications Fixture Kit Discretionary AV': (None, 'noap', USAF, 'disc', AV),
    'USAF RDT&E Fixture Development Discretionary AV': (None, 'noap', USAF, 'disc', AV),
    'USN RDT&E Fixture Test Line Mandatory CDS': (None, 'noap', USN, 'mand', CDS),
    'USMC STOVL Squadron VMX-91 Flight Line Discretionary': (None, 'noap', STOVL, 'disc', NOPMO),
}
BAE_LACKS = ['USAF APAF Full Fund CHANGE ORDER AV']     # a sustainment budget the pull counts and the report lacks
BAE_BRIMLOW = 'USAF O&M - AFRC CAM Discretionary Brimlow'     # gen2's new pull budget: in the gen1 report already


def bae_meaning(name):
    """(ap, scope, service, lane, budget's PMO) of a report name, from the hand-stated tables above. The scope is the
    NAME's (§14.2 without the FY): a row of an OBBBA name in FY2025 is 'obbba' (§15), which the row states itself."""
    if name in BAE_ONLY:
        return BAE_ONLY[name]
    if name in OBBBA_NAMES:
        return OBBBA_NAMES[name][:5]
    if name in OBBBA2_NAMES:
        return OBBBA2_NAMES[name][:5]
    ap, svc, lane = BUDGETS[name]
    return ap, ('in' if ap else 'noap'), svc, lane, BUDGET_PMO[name]


def as_written(v):
    # openpyxl writes a float as "%.16g" (openpyxl.compat.strings.safe_string), so a float's 17th digit never reaches
    # the file: the intent must record the value the file holds, or a cent can round the other way on reading
    return float('%.16g' % v)


def js_round(x):
    # JavaScript's Math.round (§14.1 reads a number cell as Math.round(v*100) cents): ties go up, toward +infinity
    f = math.floor(x)
    return int(f) + (1 if x - f >= 0.5 else 0)


class BaeGen:
    def __init__(self, seed):
        self.rng = random.Random(seed * 101 + 13)

    def money(self, cents, style=None):
        """-> (the cell, the cents it must read as, how it was written). Cents chosen here are what §14.1's
        Math.round(v*100) must give back, sub-cent noise included."""
        rng = self.rng
        style = style or rng.choices(['int', 'cents', 'subcent'], weights=[74, 16, 10])[0]
        if style == 'int' or cents == 0:
            c = cents - cents % 100
            return c // 100, c, 'int'
        c = cents if cents % 100 else cents + 37
        if style == 'cents':
            v = as_written(c / 100)
            assert js_round(v * 100) == c
            return v, c, 'cents'
        v = as_written((c + rng.choice([0.13, 0.27, 0.38, -0.21, -0.34])) / 100)   # a fraction of a cent, as the report's floats carry
        assert js_round(v * 100) == c and v * 100 != c
        return v, c, 'subcent'

    def other_cells(self, name):
        """The 24 columns the tool keeps but never reads, invented and fixed per name so gen2 repeats them."""
        ap, scope, svc, lane, _p = bae_meaning(name)
        r = random.Random('bae-cols|' + name)
        usaf = svc in (USAF, ANG, AFRC)
        code = {'om': '7101', 'ff': '7102', 'sp': '7103', 'opn': '7104', None: '7109'}[ap]
        return {
            'Budget Service': 'USAF' if usaf else 'DoN', 'APPN AF': code, 'APPN SFIS': code if usaf else None,
            'BA SFIS': '0%d' % r.randint(1, 6), 'BLI SFIS': '%04d' % r.randint(1000, 9999),
            'BPAC': ('%02dX%03d' % (r.randint(10, 99), r.randint(100, 999))) if r.random() < .25 else None,
            'BSA SFIS': ('F%dX%s' % (r.randint(1, 9), r.choice('ABCD'))) if usaf else None,
            'Budget Exec Years': {'om': 1, 'ff': 3, 'sp': 3, 'opn': 3, None: 2}[ap],
            'Budget Flex 01': r.choice(['FIXT', 'F&X', 'FXT&R']), 'Budget Flex 02': 'MA' if lane == 'mand' else 'DI',
            'Budget Flex 03': r.choice(['FXTR', 'FXR', 'FXT-ONLY']), 'Budget Office': r.choice(['FIXTUREOFC', 'FX/OPS', 'FX/SUST']),
            'DEPT AF': '91' if usaf else None, 'DEPT SFIS': '091', 'Limit AF': '9001' if r.random() < .05 else None,
            'Limit SFIS': None, 'OBAN': ('%04d' % r.randint(1000, 9999)) if r.random() < .1 else None,
            'PEC': ('%05dF' % r.randint(10000, 99999)) if usaf else None, 'PEC SFIS': '08%05dF' % r.randint(10000, 99999),
            'RCCC': ('FXRC%02d' % r.randint(1, 99)) if r.random() < .05 else None,
            'Cost Element': r.choice(['Sustainment Labor', 'Spares', 'FXE', None, None]),
            'Project Description': r.choice(['FX Sustainment', 'FXS', 'FxS Fixture', 'FxS Readiness']),
            'Variant': {USAF: 'CTOL', ANG: 'CTOL', AFRC: 'CTOL', STOVL: 'STOVL', USMCCV: 'CV', USN: 'CV'}.get(svc, 'ALL'),
            'Navy PU': None if usaf else '%04d' % r.randint(1000, 9999),
        }

    def row(self, name, fy, app, auth, *, fy_cell='=', app_style=None, bad=()):
        """One budget row. `app` is cents, or a text written as it is; `auth` is cents, a text, or '=' for the very
        cell Approved holds. The intent records the cents each cell must be read as (None when it cannot be read)."""
        cells = self.other_cells(name) if name else {}
        cells[BAE_NAME] = name
        cells[BAE_FY] = fy if fy_cell == '=' else fy_cell
        forms = {}
        intent = {'kind': 'data', 'name': name, 'fy': None if 'FY' in bad else fy, 'bad': sorted(bad), 'forms': forms}
        for col, key, val in ((BAE_APP, 'approved', app), (BAE_AUTH, 'authorized', auth)):
            if val == '=':
                cells[col], intent[key], forms[key] = cells[BAE_APP], intent['approved'], forms['approved']
            elif isinstance(val, str):
                cells[col] = val
                forms[key] = val
                # the report's own zero reads as 0; any other text cannot be read (its unit cannot be known)
                intent[key] = 0 if val == BAE_ZERO else None
            else:
                cells[col], intent[key], forms[key] = self.money(val, app_style if key == 'approved' else None)
        if fy_cell != '=':
            forms['fy'] = fy_cell
        if name:
            ap, scope, svc, lane, pmo = bae_meaning(name)
            intent.update(ap=ap, scope=scope, svc=svc, lane=lane, pmo=pmo)
        else:
            intent.update(ap=None, scope=None, svc=None, lane=None, pmo=None)
        return {'cells': cells, 'intent': intent}


def plan_by_budget(g):
    """cents per (budget, fy) over the pull's readable rows of an identified appropriation (the generator's own record)."""
    out = {}
    for tab in ('om', 'ff', 'sp', 'opn'):
        for r in g.rows[tab]:
            it = r['intent']
            if it['bad'] or it['fy'] is None:
                continue
            out[(it['budget'], it['fy'])] = out.get((it['budget'], it['fy']), 0) + it['cents']
    return out


def build_bae(g1, seed):
    """The gen1 report. What it is built to hold (CONTRACT §14.8), case by case:
      - every sustainment budget the pull uses, FY2025-2027 where the pull plans it, Approved 1.0-1.3x the plan;
      - except Full Fund FY2025, which holds ONLY Flyaway rows (a block a Flyaway row must not cover), and Initial
        Spares FY2025, which holds ONLY an unreadable row (a block an unreadable row must not cover);
      - OPN FY2026 at 2.6x its plan, and OPN FY2025 (whose plan nets to $0) with money: planShort blocks;
      - O&M FY2028 money only on USAF budgets, so with USAF off a covered block reads Approved $0;
      - one sustainment budget the pull counts left out (BAE_LACKS), and gen2's new pull budget already here;
      - names only the report carries (BAE_ONLY): every service, the unknown one too, both lanes, a PMO code in
        lower case, a PMO known only from the pull (SA), names whose last word is no code;
      - out-years 2028-2031 with nothing authorized ('$0.000' text), one with Approved '$0.000' as well;
      - amounts written as whole dollars, as cents, and with fractions of a cent, a few under $100,000."""
    b = BaeGen(seed)
    rng = b.rng
    plan = plan_by_budget(g1)
    rows = []
    sust = sorted(n for n, (ap, _s, _l) in BUDGETS.items() if ap and n not in BAE_LACKS and n != BAE_BRIMLOW)
    first = {}                            # the first budget met per (ap, fy), for the hand-placed Authorized cases
    for name in sust:
        ap = BUDGETS[name][0]
        for fy in (2025, 2026, 2027):
            if (name, fy) not in plan or (ap in ('ff', 'sp') and fy == 2025):
                continue
            p = plan[(name, fy)]
            base = p if p >= 1_000_000_00 else rng.randint(3_000_000_00, 9_000_000_00)
            factor = 2.6 if (ap, fy) == ('opn', 2026) else rng.uniform(1.0, 1.3)
            a = int(base * factor)
            n = first.setdefault((ap, fy), 0)
            first[(ap, fy)] += 1
            if fy == 2025 and ap == 'om' and n == 0:      # Authorized above Approved, as the real report has now and then
                a -= a % 100
                r = b.row(name, fy, a, a + 250_000_00, app_style='int')
            elif fy == 2025 and ap == 'om' and n == 1:    # Authorized short of Approved in a year already past
                a -= a % 100
                r = b.row(name, fy, a, a * 92 // 100, app_style='int')
            elif fy == 2026 and ap == 'sp' and n == 0:    # an approved year with nothing authorized yet
                r = b.row(name, fy, a, BAE_ZERO)
            elif fy < 2027:
                r = b.row(name, fy, a, '=')
            elif n % 2 == 0:                              # FY2027: half not authorized at all, half in part
                r = b.row(name, fy, a, BAE_ZERO)
            else:
                a -= a % 100
                r = b.row(name, fy, a, a * rng.randint(40, 90) // 100, app_style='int')
            rows.append(r)
    # out-years: nothing authorized yet. O&M FY2028 money sits on USAF budgets only (fixed figures: with USAF off the
    # covered O&M FY2028 block reads $0, and with it on, the block's $2.4M plan is not under half the report).
    for name, c in (('USAF O&M- Fixture Line Discretionary AV', 2_650_000_00), ('USAF O&M- CAM Discretionary Galvor', 1_350_000_00)):
        rows.append(b.row(name, 2028, c, BAE_ZERO))
    forced28 = {'USAF APXX Full Fund Fixture Line Discretionary AV', 'USAF APAF Spares Initial Discretionary Kestro',
                'USN APN Spares Fixture CONG Discretionary PP', 'USN OPN Fixture Ship Line Discretionary MxS'}
    for name in sust + ['USN APN Spares Fixture CONG Discretionary PP']:
        ap = BUDGETS[name][0]
        for fy in (2028, 2029, 2030, 2031):
            if fy == 2028 and ap == 'om':
                continue
            if any(r['intent']['name'] == name and r['intent']['fy'] == fy for r in rows):
                continue
            if (fy == 2028 and name in forced28) or rng.random() < .4:
                rows.append(b.row(name, fy, rng.randint(5_000_000_00, 60_000_000_00), BAE_ZERO))
    # the report's own zero in Approved too
    rows = [r for r in rows if not (r['intent']['name'] == 'USAF O&M - ANG Fixture Line Discretionary PP' and r['intent']['fy'] == 2031)]
    rows.append(b.row('USAF O&M - ANG Fixture Line Discretionary PP', 2031, BAE_ZERO, BAE_ZERO))
    # budgets only the report carries (fixed figures; a few under $100,000)
    Z = BAE_ZERO
    for name, fy, app, auth in [
            (BAE_BRIMLOW, 2027, 14_250_000_00, 7_125_000_00), (BAE_BRIMLOW, 2029, 9_800_000_00, Z),
            ('USAF O&M- Fixture Depot Line Discretionary PSM', 2026, 22_400_000_00, '='),
            ('USAF O&M- Fixture Depot Line Discretionary PSM', 2027, 18_750_000_00, Z),
            ('USAF O&M- Fixture Bench Line Discretionary mxs', 2026, 48_250_00, '='),
            ('USN O&M- Fixture Analytics Line Discretionary SA', 2026, 6_125_000_00, '='),
            ('USN O&M- Fixture Analytics Line Discretionary SA', 2027, 7_300_000_00, 3_650_000_00),
            ('DoN O&M Fixture Reimbursable Line Discretionary PSM', 2027, 3_480_000_00, Z),
            ('USAF O&M - AFRC Fixture Line Mandatory TSS', 2026, 11_900_000_00, '='),
            ('USAF O&M - AFRC Fixture Line Mandatory TSS', 2027, 12_600_000_00, 6_300_000_00),
            ('USMC CV O&M- Fixture Line Discretionary CV', 2026, 2_975_000_55, '='),
            ('USAF O&M- Fixture Line Discretionary CAM', 2027, 1_840_000_00, Z),
            ('USAF O&M- Fixture Line Discretionary CAM', 2030, 2_100_000_00, Z),
            ('USMC STOVL APN Full Fund SUPT Mandatory PP', 2026, 16_500_000_00, '='),
            ('USMC STOVL APN Full Fund SUPT Mandatory PP', 2027, 15_250_000_00, Z),
            ('USAF APAF Full Fund Fixture Line SUPT', 2027, 5_560_000_00, Z),
            ('USN APN Spares Fixture Pool Initial', 2026, 4_410_000_00, '='), ('USN APN Spares Fixture Pool Initial', 2027, 3_925_000_00, 41_500_00),
            ('USN OPN Fixture Ship Line Non-PMO', 2027, 4_200_000_00, Z), ('USN OPN Fixture Ship Line Non-PMO', 2028, 3_100_000_00, Z),
            # Flyaway: out of scope, and large enough that counting it would show
            ('USAF APAF Full Fund Flyaway Lot Discretionary AV', 2025, 1_250_000_000_00, '='),
            ('USAF APAF Full Fund Flyaway Lot Discretionary AV', 2026, 1_410_000_000_00, '='),
            ('USAF APAF Full Fund Flyaway Lot Discretionary AV', 2027, 1_385_500_000_00, Z),
            ('USMC STOVL APN Full Fund Flyaway Discretionary AV', 2025, 612_000_000_00, '='),
            ('USMC STOVL APN Full Fund Flyaway Discretionary AV', 2026, 655_250_000_00, '='),
            ('USN APN Full Fund FLYAWAY USN CV Spt Discretionary CDS', 2026, 402_000_000_00, '='),
            ('USN APN Full Fund FLYAWAY USN CV Spt Discretionary CDS', 2027, 388_400_000_00, Z),
            # names that place no appropriation
            ('USAF APAF Advance Procurement Fixture Lot Discretionary AV', 2026, 210_000_000_00, '='),
            ('USAF APAF Advance Procurement Fixture Lot Discretionary AV', 2027, 198_000_000_00, Z),
            ('USAF APAF Modifications Fixture Kit Discretionary AV', 2025, 45_600_000_00, '='),
            ('USAF APAF Modifications Fixture Kit Discretionary AV', 2026, 52_100_000_00, '='),
            ('USAF RDT&E Fixture Development Discretionary AV', 2025, 88_000_000_00, '='),
            ('USAF RDT&E Fixture Development Discretionary AV', 2026, 91_500_000_00, '='),
            ('USAF RDT&E Fixture Development Discretionary AV', 2027, 94_250_000_00, Z),
            ('USAF RDT&E Fixture Development Discretionary AV', 2028, 97_000_000_00, Z),
            ('USN RDT&E Fixture Test Line Mandatory CDS', 2026, 12_750_000_00, '='),
            ('USMC STOVL Squadron VMX-91 Flight Line Discretionary', 2026, 3_300_000_00, '='),
            ('USMC STOVL Squadron VMX-91 Flight Line Discretionary', 2027, 3_450_000_00, Z)]:
        rows.append(b.row(name, fy, app, auth))
    # an unreadable amount: a text figure that is not the report's zero, so its unit cannot be known. It is the ONLY
    # Initial Spares FY2025 row, so that block stays uncovered: an unreadable row covers nothing.
    rows.append(b.row('USN APN Spares Fixture USN CV Discretionary PP', 2025, '$1.250', BAE_ZERO, bad=('Approved',)))
    rows.sort(key=lambda r: (r['intent']['name'].lower(), r['intent']['fy']))
    return b, rows


def build_bae_gen2(b, rows1, g2):
    """The later report: Approved and Authorized moved, a budget gone, one new, Full Fund FY2025 now covered, OPN FY2026
    no longer short; and the shapes a later export may take: two lines above the header, 'Budget FY' for 'Budget FY
    Numeric', no unit on Authorized, the columns in another order, an FY that cannot be read and a row with no
    Budget Name (both with money the total row still counts, so the total check now differs), a row blank in the
    four columns the tool reads (skipped)."""
    rows = copy.deepcopy(rows1)
    plan = plan_by_budget(g2)
    ch = {'gone': 'USAF O&M- Fixture Depot Line Discretionary PSM', 'new': 'USN O&M- Fixture Corrosion Line Discretionary CDS',
          'raised': None, 'authorizedNow': [], 'ffCovered': 'USAF APXX Full Fund Fixture Line Discretionary AV',
          'opnEased': 'USN OPN Fixture Ship Line Discretionary MxS'}
    rows = [r for r in rows if r['intent']['name'] != ch['gone']]
    sust27 = [r for r in rows if r['intent']['ap'] == 'om' and r['intent']['fy'] == 2027 and r['intent']['scope'] == 'in'
              and r['intent']['name'] in BUDGET_PMO and not r['intent']['bad']]
    up = sust27[0]
    ch['raised'] = up['intent']['name']
    a = up['intent']['approved'] + 25_000_000_00
    a -= a % 100
    rows[rows.index(up)] = b.row(up['intent']['name'], 2027, a, up['cells'][BAE_AUTH] if up['intent']['authorized'] == 0
                                 else up['intent']['authorized'], app_style='int')
    for r in rows:               # the year goes on: what nothing authorized now is half authorized
        it = r['intent']
        if it['ap'] == 'om' and it['fy'] == 2027 and it['scope'] == 'in' and it['authorized'] == 0 and not it['bad'] and it['approved']:
            r['cells'][BAE_AUTH], it['authorized'], it['forms']['authorized'] = b.money(it['approved'] // 2)
            ch['authorizedNow'].append(it['name'])
    rows.append(b.row(ch['new'], 2027, 8_500_000_00, '='))
    p = plan.get((ch['ffCovered'], 2025), 0)
    rows.append(b.row(ch['ffCovered'], 2025, int(max(p, 1_000_000_00) * 1.1), '='))
    for r in rows:
        it = r['intent']
        if it['name'] == ch['opnEased'] and it['fy'] == 2026:
            c = int(max(plan.get((ch['opnEased'], 2026), 0), 15_000_000_00) * 1.2)
            v, c, how = b.money(c, 'int')
            r['cells'][BAE_APP], it['approved'], it['forms']['approved'] = v, c, how
            r['cells'][BAE_AUTH], it['authorized'], it['forms']['authorized'] = v, c, how
    rows.sort(key=lambda r: (r['intent']['name'].lower(), r['intent']['fy']))
    # three rows of other shapes, among the data
    badfy = b.row('USAF O&M- Fixture Line Discretionary AV', None, 3_000_000_00, 0, fy_cell='FY-TBD', app_style='int', bad=('FY',))
    noname = b.row(None, 2027, 1_500_000_00, BAE_ZERO, app_style='int', bad=('Budget Name',))
    skip = {'cells': {'Navy PU': '9001', 'Budget Office': 'FX/OPS'}, 'intent': {'kind': 'skip'}}
    rows[10:10] = [badfy]
    rows[25:25] = [skip]
    rows[40:40] = [noname]
    ch['badFyRow'] = 'USAF O&M- Fixture Line Discretionary AV'
    return rows, ch


BAE_GEN2_ORDER = ['Budget Service', 'APPN AF', BAE_NAME, BAE_FY, BAE_AUTH, BAE_APP] + \
    [h for h in BAE_HEADERS if h not in ('Budget Service', 'APPN AF', BAE_NAME, BAE_FY, BAE_AUTH, BAE_APP)]
BAE_GEN2_LABELS = {BAE_NAME: 'Budget Name ', BAE_FY: 'Budget FY', BAE_AUTH: 'Budget Authorized Amount'}
BAE_GEN2_TOP = ['BAE ALL Services - Fixture Report', 'Run 2026-12-01 06:00 - every service']


# ============================================================================ FY2025 OBBBA funding is left out (§15)
# Brad, 11 Nov 2026: "Just leave FY25 OBBBA funding out. Although it's active technically, it's not a reporting year."
# A row is FY2025 OBBBA funding when its budget name holds the word OBBBA (whole word, any case) and its FY is 2025.
# DIR/obbba/ holds two pulls and a report built for §15 alone (CONTRACT §15.5), every name and figure invented:
#   obbba/pull-om.xlsx  O&M, laid out as pull-om.xlsx is (sheet "Report", the columns in another order, the 1904 date
#                       system). FY2025 holds ONLY FY2025 OBBBA rows, so its block must vanish: obligated and not, two
#                       services and both lanes, one budget spelt two ways, one in lower case, one whose name no
#                       service rule knows, one FY written as text, one obligated after the as-of month, and one with
#                       an unreadable amount, which must not name the block either. FY2026 holds ordinary rows, an
#                       OBBBA budget whose FY2025 row is left out (it counts in FY2026 only) and a name with OBBBA
#                       inside a longer word. Then an OBBBA FY2025 row whose appropriation nothing identifies: it is set
#                       aside for that, the earlier §4.3 condition.
#   obbba/pull-ff.csv   Full Fund, as pull-ff.csv is. FY2025 mixes ordinary and OBBBA rows (the block stays, less them):
#                       obligated and not, two services, both lanes, an OBBBA Flyaway budget (left out, so on no
#                       offReport), and OBBBA inside a longer word with a letter after it and with one before it, which
#                       are ordinary. FY2026 holds an OBBBA budget, which counts.
#   obbba/bae.xlsx      a report shaped as bae.xlsx is: OBBBA FY2025 rows (§15.3 scope 'obbba'; a Flyaway one and one
#                       naming no appropriation, which are those first; one that cannot be read, which is that first;
#                       one in mixed case; one for a Spares year the pulls have no block for), OBBBA rows of FY2026
#                       (ordinary), ordinary O&M FY2025 rows (the noBlock entry with obbba), ordinary rows covering every
#                       block that remains, and out-years. The lower-case pull budget and the unknown-service one are
#                       left out of it, so neither may be in pullOnly.
# They are drawn from their OWN random streams, after every other file is written: not one byte of the files above
# moves (--no-obbba writes the rest alone; fixture.test.mjs compares the two).
#
# What each name MEANS, stated by hand and never by running a rule: (ap, the name's scope by §14.2 without its FY,
# service, lane, the budget's PMO, whether the name holds OBBBA as a whole word). A row of a name holding the word, in
# FY2025, is FY2025 OBBBA funding: the generator states that from this table, never by matching the text.
OBBBA_NAMES = {
    # O&M FY2025: nothing but these (the block vanishes)
    'USAF O&M- OBBBA Fixture Readiness Discretionary AV': ('om', 'in', USAF, 'disc', AV, True),
    'USAF O&M- OBBBA FIXTURE READINESS DISCRETIONARY AV': ('om', 'in', USAF, 'disc', AV, True),   # the same budget, in capitals
    'USN O&M- OBBBA Fixture USN CV Readiness Discretionary PSM': ('om', 'in', USN, 'disc', PSM, True),
    'USAF O&M - ANG OBBBA Fixture Line Mandatory PP': ('om', 'in', ANG, 'mand', PP, True),
    'USAF O&M- obbba Fixture Surge Discretionary TSS': ('om', 'in', USAF, 'disc', TSS, True),       # lower case; no report row
    'DoN O&M- OBBBA Fixture Reimbursable Discretionary PSM': ('om', 'in', UNK, 'disc', PSM, True),  # no service rule; no report row
    'USAF O&M- OBBBA Fixture Sustain Line Discretionary PSM': ('om', 'in', USAF, 'disc', PSM, True),  # FY2025 and FY2026
    # O&M FY2026: OBBBA inside a longer word is an ordinary name (CONTRACT §15.1's own example)
    'USAF O&M- NOBBBAX Fixture Line Discretionary BOP': ('om', 'in', USAF, 'disc', BOP, False),
    # an appropriation nothing identifies (no rule names it, and the sheet "Report" names none)
    'Interagency OBBBA Reimbursable Line': (None, 'noap', UNK, 'disc', NOPMO, True),
    # Full Fund
    'USN APN Full Fund SUPT USN CV OBBBA Discretionary BOP': ('ff', 'in', USN, 'disc', BOP, True),
    'USMC STOVL APN Full Fund OBBBA SUPT Mandatory PP': ('ff', 'in', STOVL, 'mand', PP, True),
    'USAF APAF Full Fund OBBBA Flyaway Lot Discretionary AV': ('ff', 'flyaway', USAF, 'disc', AV, True),
    'USAF APAF Full Fund OBBBAX SUPT Discretionary MxS': ('ff', 'in', USAF, 'disc', MXS, False),     # a letter after the word
    'USN APN Full Fund SUPT NOBBBA Discretionary CDS': ('ff', 'in', USN, 'disc', CDS, False),        # a letter before it
    'USAF APAF Full Fund OBBBA SUPT Discretionary TSS': ('ff', 'in', USAF, 'disc', TSS, True),       # FY2026 only: counts
    # only the report carries these
    'USMC STOVL O&M - OBBBA Fixture Line Discretionary AV': ('om', 'in', STOVL, 'disc', AV, True),   # an unreadable amount
    'USN O&M- Obbba Fixture Analytics Discretionary CDS': ('om', 'in', USN, 'disc', CDS, True),      # mixed case
    'USN APN Spares OBBBA Fixture Initial Discretionary PP': ('sp', 'in', USN, 'disc', PP, True),    # no Spares block here
    'USAF RDT&E OBBBA Fixture Development Discretionary AV': (None, 'noap', USAF, 'disc', AV, True),
}
OBBBA_FILES = {'pull-om': 'obbba/pull-om.xlsx', 'pull-ff': 'obbba/pull-ff.csv', 'bae': 'obbba/bae.xlsx'}
# CONTRACT §14.6 and §15.4, the BAE Report sheet's Counted words, restated for the manifest's "meant"
OBBBA_BAE_WHY = {'bad': 'Could not be read', 'flyaway': 'Flyaway (production)', 'noap': 'Names no appropriation',
                 'before': 'Before the first FY', 'obbba': 'FY2025 OBBBA funding (not a reporting year)', 'yes': 'Yes'}


def obbba_word(name):
    """Whether a name holds OBBBA as a whole word, from the table (False for every name the table does not hold)."""
    return bool(name in OBBBA_NAMES and OBBBA_NAMES[name][5])


def obbba_meant(it, first=2025):
    """What a pull row is MEANT to be at First FY 2025 with every switch on: the first §4.3 condition it fails
    ('unreadable', 'unidentified', 'beforeFirst', 'obbba'), else 'counted'."""
    if it['bad']:
        return 'unreadable'
    if it['ap'] is None:
        return 'unidentified'
    if it['fy'] < first:
        return 'beforeFirst'
    return 'obbba' if it['obbba'] else 'counted'


class ObbbaGen(Gen):
    PREFIX = {'om': 'BO', 'ff': 'BF', 'sp': 'BS', 'opn': 'BP', 'misc': 'BX'}

    def __init__(self, seed):
        super().__init__(seed)
        self.rng = random.Random('obbba-pull|%d' % seed)        # its own stream: the pulls' is never drawn on

    def meaning(self, budget):
        if budget in OBBBA_NAMES:
            o = OBBBA_NAMES[budget]
            return o[0], o[2], o[3]
        return BUDGETS[budget]


def build_obbba(seed):
    """The two pulls of obbba/. Each row's intent gains `case` (why it is there), `obbba` (FY2025 OBBBA funding, from
    OBBBA_NAMES) and `meant` (obbba_meant)."""
    g = ObbbaGen(seed)
    D = dt.date

    def R(case, tab, fy, k, d, c, a, **kw):
        r = g.row(tab, fy, k[0], k[1], kw.pop('budget', k[2]), k[3], d, c, a, k[4], **kw)
        r['intent']['case'] = case
        return r
    # ----------------------------------------------------------- O&M FY2025: nothing but FY2025 OBBBA funding
    O1 = ('JSF9711', 'Readiness Surge Package', 'USAF O&M- OBBBA Fixture Readiness Discretionary AV', 'AX - Surge Spares Lot', AV)
    R('OBBBA FY2025, obligated', 'om', 2025, O1, D(2025, 6, 18), 2_450_000_00, EXEC)
    R('OBBBA FY2025, its budget spelt in capitals: one budget, first spelling', 'om', 2025, O1, D(2026, 2, 11), 1_175_500_00,
      EXEC, budget='USAF O&M- OBBBA FIXTURE READINESS DISCRETIONARY AV')
    R('OBBBA FY2025, obligated after the as-of month', 'om', 2025, O1, D(2026, 12, 15), 640_000_00, EXEC)
    R('OBBBA FY2025, planned', 'om', 2025, O1, D(2027, 1, 31), 3_200_000_00, NA)
    R('OBBBA FY2025 with an unreadable amount: set aside as unreadable, and names no block', 'om', 2025, O1,
      D(2027, 3, 31), None, NA, amount_cell='TBD', bad=['Amount'])
    O2 = ('CT-90711', 'Afloat Readiness Surge', 'USN O&M- OBBBA Fixture USN CV Readiness Discretionary PSM', 'PX - Afloat Surge', PSM)
    R('OBBBA FY2025, a second service, obligated', 'om', 2025, O2, D(2025, 9, 30), 1_880_000_00, EXEC)
    R('OBBBA FY2025, its FY written as text', 'om', 2025, O2, D(2026, 11, 30), 920_000_00, NA, fy_cell='FY25')
    R('OBBBA FY2025, Forecast', 'om', 2025, O2, D(2027, 6, 30), 410_000_00, FCST)
    O3 = ('JSF9712', 'Guard Engine Surge', 'USAF O&M - ANG OBBBA Fixture Line Mandatory PP', 'EX - Guard Engine Lot', PP)
    R('OBBBA FY2025, the Mandatory lane, obligated', 'om', 2025, O3, D(2025, 11, 20), 3_050_000_00, EXEC)
    R('OBBBA FY2025, the Mandatory lane, planned', 'om', 2025, O3, D(2027, 2, 28), 1_420_000_00, NA)
    O4 = ('JSF9713', 'Trainer Surge Upgrade', 'USAF O&M- obbba Fixture Surge Discretionary TSS', 'TX - Trainer Surge', TSS)
    R('OBBBA FY2025, the word in lower case', 'om', 2025, O4, D(2026, 4, 9), 760_000_00, EXEC)
    R('OBBBA FY2025, the word in lower case', 'om', 2025, O4, D(2027, 4, 30), 515_000_00, NA)
    O7 = ('CT-90713', 'Reimbursable Surge Draw', 'DoN O&M- OBBBA Fixture Reimbursable Discretionary PSM', 'DX - Surge Draw', PSM)
    R('OBBBA FY2025 with no service: makes no seventh switch', 'om', 2025, O7, D(2027, 5, 31), 330_000_00, NA)
    O5 = ('JSF9714', 'Sustainment Bridge Fund', 'USAF O&M- OBBBA Fixture Sustain Line Discretionary PSM', 'PX - Bridge Lot 1', PSM)
    R('OBBBA FY2025 on a budget whose other rows are FY2026', 'om', 2025, O5, D(2025, 8, 14), 1_260_000_00, EXEC)
    # ----------------------------------------------------------- O&M FY2026 and FY2027: ordinary
    for _ in range(4):
        g.program('om', 2026)
    R('an OBBBA budget in FY2026: ordinary, counts', 'om', 2026, O5, D(2026, 3, 19), 2_040_000_00, EXEC)
    R('an OBBBA budget in FY2026: ordinary, counts', 'om', 2026, O5, D(2027, 2, 28), 1_150_000_00, NA)
    R('an OBBBA budget in FY2026: ordinary, counts', 'om', 2026, O5, D(2027, 8, 31), 680_000_00, NA)
    N1 = ('CT-90715', 'Ledger Bridge Account', 'USAF O&M- NOBBBAX Fixture Line Discretionary BOP', 'BX - Bridge Account', BOP)
    R('OBBBA inside a longer word: ordinary', 'om', 2026, N1, D(2026, 1, 22), 455_000_00, EXEC)
    R('OBBBA inside a longer word: ordinary', 'om', 2026, N1, D(2027, 3, 31), 290_000_00, NA)
    for _ in range(3):
        g.program('om', 2027)
    # ----------------------------------------------------------- written after the O&M rows: no appropriation
    U = ('CT-90714', 'Interagency Surge Line', 'Interagency OBBBA Reimbursable Line', 'QX - Interagency Surge', PSM)
    R('OBBBA FY2025 whose appropriation nothing identifies: set aside as that first', 'misc', 2025, U, D(2027, 1, 31),
      275_000_00, NA)
    # ----------------------------------------------------------- Full Fund FY2025: ordinary and OBBBA rows mixed
    for _ in range(3):
        g.program('ff', 2025)
    F1 = ('JSF9721', 'Afloat Depot Surge', 'USN APN Full Fund SUPT USN CV OBBBA Discretionary BOP', 'BX - Depot Surge Lot', BOP)
    R('OBBBA FY2025 beside ordinary rows, obligated', 'ff', 2025, F1, D(2025, 7, 9), 4_100_000_00, EXEC, fy_cell='FY2025')
    R('OBBBA FY2025 beside ordinary rows, planned', 'ff', 2025, F1, D(2027, 3, 31), 1_650_000_00, NA)
    R('OBBBA FY2025 beside ordinary rows, Unprogrammed', 'ff', 2025, F1, D(2027, 9, 30), 800_000_00, UNPROG)
    F2 = ('JSF9722', 'Lift System Surge', 'USMC STOVL APN Full Fund OBBBA SUPT Mandatory PP', 'PX - Lift System Lot', PP)
    R('OBBBA FY2025, a second service, the Mandatory lane, obligated', 'ff', 2025, F2, D(2025, 12, 3), 2_725_000_00, EXEC)
    R('OBBBA FY2025, a second service, the Mandatory lane, planned', 'ff', 2025, F2, D(2027, 5, 31), 990_000_00, NA)
    F3 = ('CT-90721', 'Production Surge Lot', 'USAF APAF Full Fund OBBBA Flyaway Lot Discretionary AV', 'AX - Surge Airframes', AV)
    R('OBBBA FY2025 on a Flyaway budget: left out, so on no offReport', 'ff', 2025, F3, D(2025, 10, 16), 9_500_000_00, EXEC)
    F4 = ('JSF9723', 'Tooling Bridge', 'USAF APAF Full Fund OBBBAX SUPT Discretionary MxS', 'MX - Bridge Tooling', MXS)
    R('OBBBA with a letter after it, FY2025: ordinary', 'ff', 2025, F4, D(2025, 4, 22), 1_330_000_00, EXEC)
    R('OBBBA with a letter after it, FY2025: ordinary', 'ff', 2025, F4, D(2027, 1, 31), 470_000_00, NA)
    F6 = ('CT-90722', 'Comms Bridge Kit', 'USN APN Full Fund SUPT NOBBBA Discretionary CDS', 'CX - Bridge Kit', CDS)
    R('OBBBA with a letter before it, FY2025: ordinary', 'ff', 2025, F6, D(2026, 5, 7), 615_000_00, EXEC)
    R('OBBBA with a letter before it, FY2025: ordinary', 'ff', 2025, F6, D(2027, 6, 30), 240_000_00, NA)
    # ----------------------------------------------------------- Full Fund FY2026 and FY2027
    for _ in range(3):
        g.program('ff', 2026)
    F5 = ('JSF9724', 'Trainer Bridge Buy', 'USAF APAF Full Fund OBBBA SUPT Discretionary TSS', 'TX - Bridge Buy', TSS)
    R('an OBBBA budget in FY2026: ordinary, counts', 'ff', 2026, F5, D(2026, 6, 25), 1_875_000_00, EXEC)
    R('an OBBBA budget in FY2026: ordinary, counts', 'ff', 2026, F5, D(2027, 4, 30), 560_000_00, NA)
    for _ in range(2):
        g.program('ff', 2027)
    files = {'om': OBBBA_FILES['pull-om'], 'misc': OBBBA_FILES['pull-om'], 'ff': OBBBA_FILES['pull-ff']}
    for tab in ('om', 'misc', 'ff'):
        for r in g.rows[tab]:
            it = r['intent']
            it.setdefault('case', 'ordinary')
            it['file'] = files[tab]
            it['obbba'] = obbba_word(it['budget']) and it['fy'] == 2025
            it['meant'] = obbba_meant(it)
    return g


class ObbbaBaeGen(BaeGen):
    def __init__(self, seed):
        self.rng = random.Random('obbba-bae|%d' % seed)         # its own stream: the reports' is never drawn on

    def row(self, name, fy, app, auth, case='', **kw):
        """bae_meaning gives the NAME's scope; §15.3 makes a row of an OBBBA name in FY2025 'obbba', after 'flyaway'
        and 'noap'. Each row's intent gains `obbba`, `case` and `meant` (the Counted words at First FY 2025, every
        switch on)."""
        r = super().row(name, fy, app, auth, **kw)
        it = r['intent']
        it['obbba'] = obbba_word(name) and it['fy'] == 2025
        if it['obbba'] and it['scope'] == 'in':
            it['scope'] = 'obbba'
        it['case'] = case
        it['meant'] = OBBBA_BAE_WHY['bad' if it['bad'] else it['scope'] if it['scope'] in ('flyaway', 'noap', 'obbba')
                                    else 'before' if it['fy'] < 2025 else 'yes']
        return r


def build_obbba_bae(g, seed):
    """The report of obbba/: ordinary rows covering every block the two pulls leave (each budget and FY the pulls
    count, Approved 1.0-1.25x its plan), then the §15 cases with fixed figures."""
    b = ObbbaBaeGen(seed)
    rng = b.rng
    plan = {}
    for tab in ('om', 'ff'):
        for r in g.rows[tab]:
            it = r['intent']
            if it['meant'] == 'counted':
                plan[(it['budget'], it['fy'])] = plan.get((it['budget'], it['fy']), 0) + it['cents']
    rows = []
    for (name, fy) in sorted(plan):
        base = max(plan[(name, fy)], 1_500_000_00)
        a = int(base * rng.uniform(1.0, 1.25))
        case = 'an OBBBA budget of FY%d: ordinary, counts' % fy if obbba_word(name) else 'ordinary: covers its block'
        if fy < 2027:
            rows.append(b.row(name, fy, a, '=', case=case))
        elif rng.random() < .5:
            rows.append(b.row(name, fy, a, BAE_ZERO, case=case))
        else:
            a -= a % 100
            rows.append(b.row(name, fy, a, a * rng.randint(40, 90) // 100, app_style='int', case=case))
    Z = BAE_ZERO
    ob = 'OBBBA FY2025: never counts, never covers'
    for name, fy, app, auth, case in [
            ('USAF O&M- OBBBA Fixture Readiness Discretionary AV', 2025, 8_250_000_00, '=', ob),
            ('USN O&M- OBBBA Fixture USN CV Readiness Discretionary PSM', 2025, 3_400_000_00, 3_100_000_00, ob),
            ('USAF O&M - ANG OBBBA Fixture Line Mandatory PP', 2025, 4_600_000_00, '=', ob),
            ('USAF O&M- OBBBA Fixture Sustain Line Discretionary PSM', 2025, 1_500_000_00, '=', ob),
            ('USN APN Full Fund SUPT USN CV OBBBA Discretionary BOP', 2025, 7_100_000_00, '=', ob),
            ('USMC STOVL APN Full Fund OBBBA SUPT Mandatory PP', 2025, 3_900_000_00, '=', ob),
            ('USN O&M- Obbba Fixture Analytics Discretionary CDS', 2025, 2_640_000_00, '=', ob + ' (the word in mixed case)'),
            ('USN APN Spares OBBBA Fixture Initial Discretionary PP', 2025, 5_250_000_00, '=',
             ob + ' (no Spares block: counted, it would be a noBlock)'),
            ('USAF APAF Full Fund OBBBA Flyaway Lot Discretionary AV', 2025, 950_000_000_00, '=', 'OBBBA FY2025 Flyaway: Flyaway first'),
            ('USAF RDT&E OBBBA Fixture Development Discretionary AV', 2025, 42_000_000_00, '=',
             'OBBBA FY2025 naming no appropriation: that first'),
            # ordinary O&M FY2025: money for an (ap, fy) whose only pull rows are FY2025 OBBBA funding (noBlock, obbba)
            ('USAF O&M- Fixture Line Discretionary AV', 2025, 6_300_000_00, '=', 'ordinary O&M FY2025: the obbba noBlock'),
            ('USN O&M- Fixture USN CV LA Discretionary PSM', 2025, 2_180_000_00, 1_900_000_00, 'ordinary O&M FY2025: the obbba noBlock'),
            # OBBBA budgets of other FYs: ordinary
            ('USAF O&M- OBBBA Fixture Readiness Discretionary AV', 2026, 2_750_000_00, '=',
             'an OBBBA budget of FY2026 whose pull rows are all FY2025: counts'),
            ('USN O&M- Obbba Fixture Analytics Discretionary CDS', 2026, 2_910_000_00, '=',
             'an OBBBA budget of FY2026 with no pull row: counts, reportOnly'),
            ('USAF O&M- OBBBA Fixture Sustain Line Discretionary PSM', 2028, 3_000_000_00, Z, 'an out-year, not authorized'),
            ('USAF APAF Full Fund OBBBA SUPT Discretionary TSS', 2029, 4_400_000_00, Z, 'an out-year, not authorized')]:
        assert not any(r['intent']['name'] == name and r['intent']['fy'] == fy for r in rows), (name, fy)
        rows.append(b.row(name, fy, app, auth, case=case))
    # an OBBBA FY2025 row that cannot be read: unreadable first
    rows.append(b.row('USMC STOVL O&M - OBBBA Fixture Line Discretionary AV', 2025, '$2.500', BAE_ZERO, bad=('Approved',),
                      case='OBBBA FY2025 with an unreadable amount: could not be read first'))
    rows.sort(key=lambda r: (r['intent']['name'].lower(), r['intent']['fy']))
    return rows


# ======================================================= FY2025 O&M OBBBA funding, marked in Budget Flex 02 too (§17)
# Brad, 11 Nov 2026: "Yes, leave out OBBBA funding for O&M but leave it in for Spares." A row is FY2025 O&M OBBBA funding
# when its appropriation is O&M, its FY is 2025, and it is marked OBBBA: the word, whole, in any case, in its budget name;
# for a report row, in its Budget Flex 02 cell; for a pull row, when the loaded report holds an O&M FY2025 row of the
# same budget (normKey) whose Budget Flex 02 holds the word. OBBBA money of every other appropriation counts.
# DIR/obbba2/ holds three pulls and a report built for §17 alone (CONTRACT §17.4), every name and figure invented:
#   obbba2/pull-om.xlsx  O&M, one v12 tab "O&M Raw Data" (title on row 1, header on row 2, shared strings). FY2025: rows
#                        on a budget only the report marks (left out with the report, counted without: obligated and
#                        not, one spelt in capitals, one unreadable), rows on a second budget the report marks in lower
#                        case (another service, the Mandatory lane), rows named OBBBA (left out either way: two
#                        services, both lanes), and ordinary rows, so the block stays. Among those: a budget whose report
#                        row holds OBBBAX in Budget Flex 02, one whose report row holds the word in Budget Flex 01 and 03
#                        only, one the report marks in FY2026 only, and one whose name places no appropriation (the sheet
#                        places it in O&M) whose report row is marked but is not O&M, so it marks nothing: all count.
#                        FY2026 and FY2027: ordinary, with FY2026 rows on the marked budget and on a named one (count).
#   obbba2/pull-ff.csv   Full Fund, as pull-ff.csv is: FY2025 rows named OBBBA, and rows on a budget the report marks in
#                        Budget Flex 02 (both count: §17 is for O&M only); FY2026 ordinary.
#   obbba2/pull-sp.xlsx  "Spares Raw Data" and "OPN Raw Data": Initial Spares FY2025 rows on the budget the report marks,
#                        named without the word, and rows named OBBBA; OPN FY2025 rows on a budget the report marks. All
#                        count.
#   obbba2/bae.xlsx      a report shaped as bae.xlsx is, whose Budget Flex 02 holds the word (beside other text, as a real
#                        cell holds it) on: O&M FY2025 rows whose names do not (left out; one in lower case, one with no
#                        pull row), an O&M FY2025 row whose name does too (left out, by its name), an O&M FY2026 row, an
#                        Initial Spares, a Full Fund and an OPN FY2025 row (each counts), a Full Fund Flyaway FY2025 row
#                        (Flyaway first) and a row naming no appropriation (that first). Also an O&M FY2025 row named
#                        OBBBA whose Flex 02 does not hold it (by its name), OBBBAX in Flex 02 once (ordinary), the word
#                        in Budget Flex 01 and 03 only once (ordinary), and ordinary rows covering every block that remains.
# They are drawn from their OWN random streams, after every other file (obbba/ too) is written: not one byte of any other
# file moves (--no-obbba2 writes the rest alone; fixture.test.mjs compares the two).
O2_FLEX = 'USAF O&M- Fixture Bridge Line Discretionary AV'
O2_FLEX_CAPS = 'USAF O&M- FIXTURE BRIDGE LINE DISCRETIONARY AV'           # the same budget (normKey), in capitals
O2_FLEX_LOW = 'USN O&M- Fixture Bridge USN CV Readiness Mandatory PSM'
O2_REPONLY = 'USAF O&M - AFRC Fixture Reserve Bridge Discretionary CDS'
O2_NAMED = 'USAF O&M - ANG OBBBA Fixture Surge Mandatory PP'
O2_NAMED2 = 'USN O&M- OBBBA Fixture Afloat Discretionary CDS'
O2_ORD = 'USAF O&M- Fixture Depot Bridge Discretionary PSM'
O2_LONG = 'USAF O&M- Fixture Ledger Line Discretionary BOP'
O2_FLEX13 = 'USN O&M- Fixture USMC CV Bridge Discretionary MxS'
O2_FLEX26 = 'USMC STOVL O&M - Fixture Bridge Line Discretionary TSS'
O2_NOAP = 'Interagency Fixture Bridge Reimbursable Line'
O2_FF_FLEX = 'USAF APAF Full Fund Fixture Bridge SUPT Discretionary MxS'
O2_FF_NAMED = 'USMC STOVL APN Full Fund OBBBA Bridge SUPT Mandatory PP'
O2_FF_FLY = 'USAF APAF Full Fund Bridge Flyaway Lot Discretionary AV'
O2_SP_FLEX = 'USN APN Spares Fixture Bridge Initial Discretionary PP'
O2_SP_NAMED = 'USAF APAF Spares OBBBA Fixture Initial Discretionary AV'
O2_OPN_FLEX = 'USN OPN Fixture Bridge Ship Line Discretionary MxS'
# What each name MEANS, stated by hand and never by running a rule: (ap, the name's scope by §14.2 without its FY,
# service, lane, the budget's PMO, whether the name holds OBBBA as a whole word, whether the report's FY2025 row of this
# budget holds OBBBA as a whole word in its Budget Flex 02). The report MARKS a budget (§17.1, for pull rows) when that
# last is true and the name is an O&M one: the generator states that from this table, never by matching the text.
OBBBA2_NAMES = {
    O2_FLEX: ('om', 'in', USAF, 'disc', AV, False, True),
    O2_FLEX_CAPS: ('om', 'in', USAF, 'disc', AV, False, True),
    O2_FLEX_LOW: ('om', 'in', USN, 'mand', PSM, False, True),
    O2_REPONLY: ('om', 'in', AFRC, 'disc', CDS, False, True),            # no pull row
    O2_NAMED: ('om', 'in', ANG, 'mand', PP, True, True),                  # the name and Flex 02 both
    O2_NAMED2: ('om', 'in', USN, 'disc', CDS, True, False),               # the name alone
    O2_ORD: ('om', 'in', USAF, 'disc', PSM, False, False),
    O2_LONG: ('om', 'in', USAF, 'disc', BOP, False, False),               # OBBBAX in Flex 02: a longer word
    O2_FLEX13: ('om', 'in', USMCCV, 'disc', MXS, False, False),           # the word in Flex 01 and 03 only
    O2_FLEX26: ('om', 'in', STOVL, 'disc', TSS, False, False),            # Flex 02 marked in FY2026 only
    O2_NOAP: (None, 'noap', UNK, 'disc', NOPMO, False, True),            # marked, but its name places no appropriation
    O2_FF_FLEX: ('ff', 'in', USAF, 'disc', MXS, False, True),
    O2_FF_NAMED: ('ff', 'in', STOVL, 'mand', PP, True, False),
    O2_FF_FLY: ('ff', 'flyaway', USAF, 'disc', AV, False, True),          # no pull row
    O2_SP_FLEX: ('sp', 'in', USN, 'disc', PP, False, True),
    O2_SP_NAMED: ('sp', 'in', USAF, 'disc', AV, True, False),
    O2_OPN_FLEX: ('opn', 'in', USN, 'disc', MXS, False, True),
}
OBBBA2_FILES = {'pull-om': 'obbba2/pull-om.xlsx', 'pull-ff': 'obbba2/pull-ff.csv', 'pull-sp': 'obbba2/pull-sp.xlsx',
                'bae': 'obbba2/bae.xlsx'}
# CONTRACT §14.6, §15.4 and §17.3, the BAE Report sheet's Counted words, restated for the manifest's "meant"
OBBBA2_BAE_WHY = {'bad': 'Could not be read', 'flyaway': 'Flyaway (production)', 'noap': 'Names no appropriation',
                  'before': 'Before the first FY', 'name': 'FY2025 O&M OBBBA funding (not a reporting year)',
                  'flex02': 'FY2025 O&M OBBBA funding (not a reporting year), marked in Budget Flex 02', 'yes': 'Yes'}


def obbba2_marked(name):
    """Whether the report marks a pull row's budget (§17.1): its FY2025 row holds the word in Budget Flex 02 and the name
    is an O&M one (the report row's own appropriation, SP.apOfBudget), from the table."""
    o = OBBBA2_NAMES.get(name)
    return bool(o and o[0] == 'om' and o[6])


def obbba2_meant(it, report, first=2025):
    """What a pull row of obbba2/ is MEANT to be at First FY 2025 with every switch on, without the report or with it: the
    first §4.3 condition it fails, as the oracle's rawCounted codes it ('unreadable', 'unidentified', 'beforeFirst', then
    'obbba' when its name marks it, 'obbbaReport' when only the report's Budget Flex 02 does), else 'counted'."""
    if it['bad']:
        return 'unreadable'
    if it['ap'] is None:
        return 'unidentified'
    if it['fy'] < first:
        return 'beforeFirst'
    if it['ap'] == 'om' and it['fy'] == 2025:
        if it['word']:
            return 'obbba'
        if report and it['marked']:
            return 'obbbaReport'
    return 'counted'


class Obbba2Gen(Gen):
    PREFIX = {'om': 'CO', 'ff': 'CF', 'sp': 'CS', 'opn': 'CP', 'misc': 'CX'}

    def __init__(self, seed):
        super().__init__(seed)
        self.rng = random.Random('obbba2-pull|%d' % seed)       # its own stream: no other file's is drawn on

    def meaning(self, budget):
        if budget in OBBBA2_NAMES:
            o = OBBBA2_NAMES[budget]
            return o[0], o[2], o[3]
        return BUDGETS[budget]


def build_obbba2(seed):
    """The three pulls of obbba2/. Each row's intent gains `case`, `word` and `marked` (from OBBBA2_NAMES), `obbba` (FY2025
    O&M OBBBA funding with no report loaded: its name), `obbbaReport` (with the report: its name or the report's mark),
    `by` (with the report: 'name' | 'report' | None), `elsewhere` (counted OBBBA money of another appropriation, by its
    name, in FY2025: §17.2 M.obbbaElsewhere) and `meant` ({noReport, report}: obbba2_meant)."""
    g = Obbba2Gen(seed)
    D = dt.date

    def R(case, tab, fy, k, d, c, a, **kw):
        r = g.row(tab, fy, k[0], k[1], kw.pop('budget', k[2]), k[3], d, c, a, k[4], **kw)
        r['intent']['case'] = case
        return r
    # ----------------------------------------------------------- O&M FY2025: marked, named and ordinary rows
    K1 = ('JSF9731', 'Bridge Readiness Draw', O2_FLEX, 'AX - Bridge Readiness Lot', AV)
    mk = 'a budget only the report marks (Budget Flex 02): left out with the report, counted without'
    R(mk + ', obligated', 'om', 2025, K1, D(2025, 7, 14), 1_640_000_00, EXEC)
    R(mk + ', spelt in capitals (one budget by normKey), obligated', 'om', 2025, K1, D(2026, 1, 20), 905_000_00, EXEC,
      budget=O2_FLEX_CAPS)
    R(mk + ', obligated after the as-of month', 'om', 2025, K1, D(2026, 12, 9), 415_000_00, EXEC)
    R(mk + ', planned', 'om', 2025, K1, D(2027, 2, 28), 2_310_000_00, NA)
    R(mk + ', with an unreadable amount: unreadable first', 'om', 2025, K1, D(2027, 4, 30), None, NA,
      amount_cell='TBD', bad=['Amount'])
    K2 = ('CT-90731', 'Afloat Bridge Engines', O2_FLEX_LOW, 'PX - Afloat Bridge Engines', PSM)
    mk2 = 'a budget the report marks in lower case (obbba), a second service, the Mandatory lane'
    R(mk2 + ', obligated', 'om', 2025, K2, D(2025, 11, 5), 1_270_000_00, EXEC)
    R(mk2 + ', planned', 'om', 2025, K2, D(2027, 5, 31), 640_000_00, NA)
    R(mk2 + ', Forecast', 'om', 2025, K2, D(2027, 8, 31), 385_000_00, FCST)
    K3 = ('JSF9732', 'Guard Surge Line', O2_NAMED, 'EX - Guard Surge Lot', PP)
    nm = 'named OBBBA (the report marks it in Budget Flex 02 too): left out by its name, with or without the report'
    R(nm + ', the Mandatory lane, obligated', 'om', 2025, K3, D(2025, 12, 2), 2_075_000_00, EXEC)
    R(nm + ', planned', 'om', 2025, K3, D(2027, 3, 31), 1_160_000_00, NA)
    K4 = ('CT-90732', 'Afloat Surge Kit', O2_NAMED2, 'CX - Afloat Surge Kit', CDS)
    nm2 = 'named OBBBA (the report\'s Flex 02 does not hold it): left out by its name, with or without the report'
    R(nm2 + ', obligated', 'om', 2025, K4, D(2026, 3, 17), 1_490_000_00, EXEC)
    R(nm2 + ', Unprogrammed', 'om', 2025, K4, D(2027, 7, 31), 720_000_00, UNPROG)
    for _ in range(3):
        g.program('om', 2025)
    K5 = ('JSF9733', 'Depot Bridge Support', O2_ORD, 'PX - Depot Bridge Labor', PSM)
    R('ordinary O&M FY2025 (the block stays), obligated', 'om', 2025, K5, D(2025, 10, 28), 3_260_000_00, EXEC)
    R('ordinary O&M FY2025 (the block stays), planned', 'om', 2025, K5, D(2027, 1, 31), 1_850_000_00, NA)
    K6 = ('CT-90733', 'Ledger Bridge Kit', O2_LONG, 'BX - Ledger Bridge Kit', BOP)
    lw = 'the report holds OBBBAX in this budget\'s Budget Flex 02 (a longer word): counts'
    R(lw, 'om', 2025, K6, D(2026, 2, 12), 690_000_00, EXEC)
    R(lw, 'om', 2025, K6, D(2027, 6, 30), 330_000_00, NA)
    K7 = ('JSF9734', 'Carrier Bridge Seats', O2_FLEX13, 'MX - Carrier Bridge Seats', MXS)
    f13 = 'the report holds the word in Budget Flex 01 and 03 only, which are never read: counts'
    R(f13, 'om', 2025, K7, D(2025, 9, 3), 845_000_00, EXEC)
    R(f13, 'om', 2025, K7, D(2027, 4, 30), 510_000_00, NA)
    K8 = ('CT-90734', 'Lift Bridge Overhaul', O2_FLEX26, 'TX - Lift Bridge Overhaul', TSS)
    f26 = 'the report marks this budget in FY2026 only: its FY2025 rows count'
    R(f26, 'om', 2025, K8, D(2026, 4, 21), 1_120_000_00, EXEC)
    R(f26, 'om', 2025, K8, D(2027, 2, 28), 465_000_00, NA)
    K9 = ('JSF9735', 'Interagency Bridge Draw', O2_NOAP, 'QX - Interagency Bridge Draw', PSM)
    na_ = ('a name that places no appropriation (the sheet places it in O&M); the report\'s row of it is marked but is not '
           'O&M, so it marks nothing: counts')
    R(na_, 'om', 2025, K9, D(2026, 5, 6), 560_000_00, EXEC)
    R(na_, 'om', 2025, K9, D(2027, 1, 31), 275_000_00, NA)
    # ----------------------------------------------------------- O&M FY2026 and FY2027: ordinary
    for _ in range(3):
        g.program('om', 2026)
    R('the marked budget in FY2026: counts (the report marks FY2025 rows only)', 'om', 2026, K1, D(2026, 6, 16), 1_330_000_00, EXEC)
    R('the marked budget in FY2026: counts (the report marks FY2025 rows only)', 'om', 2026, K1, D(2027, 3, 31), 870_000_00, NA)
    R('named OBBBA in FY2026: counts', 'om', 2026, K3, D(2026, 8, 25), 1_045_000_00, EXEC)
    R('the budget the report marks in FY2026: counts', 'om', 2026, K8, D(2027, 5, 31), 980_000_00, NA)
    for _ in range(2):
        g.program('om', 2027)
    # ----------------------------------------------------------- Full Fund
    for _ in range(3):
        g.program('ff', 2025)
    F1 = ('JSF9741', 'Lift Fan Bridge Lot', O2_FF_NAMED, 'PX - Lift Fan Bridge Lot', PP)
    R('Full Fund FY2025 named OBBBA: counts (§17 is for O&M only), the Mandatory lane, obligated', 'ff', 2025, F1,
      D(2025, 8, 19), 3_420_000_00, EXEC)
    R('Full Fund FY2025 named OBBBA: counts, planned', 'ff', 2025, F1, D(2027, 2, 28), 1_275_000_00, NA)
    F2 = ('CT-90741', 'Tooling Bridge Buy', O2_FF_FLEX, 'MX - Tooling Bridge Buy', MXS)
    R('Full Fund FY2025 on a budget the report marks in Budget Flex 02: counts, obligated', 'ff', 2025, F2,
      D(2026, 1, 13), 2_150_000_00, EXEC)
    R('Full Fund FY2025 on a budget the report marks in Budget Flex 02: counts, planned', 'ff', 2025, F2,
      D(2027, 6, 30), 940_000_00, NA)
    for _ in range(2):
        g.program('ff', 2026)
    # ----------------------------------------------------------- Initial Spares and OPN
    for _ in range(2):
        g.program('sp', 2025)
    S1 = ('JSF9751', 'Bridge Spares Pool', O2_SP_FLEX, 'PX - Bridge Spares Pool', PP)
    sm = 'Initial Spares FY2025 on the budget the report marks in Budget Flex 02, named without the word: counts (Brad)'
    R(sm + ', obligated', 'sp', 2025, S1, D(2025, 10, 7), 2_860_000_00, EXEC)
    R(sm + ', planned', 'sp', 2025, S1, D(2027, 3, 31), 1_430_000_00, NA)
    S2 = ('CT-90751', 'Airframe Bridge Spares', O2_SP_NAMED, 'AX - Airframe Bridge Spares', AV)
    R('Initial Spares FY2025 named OBBBA: counts (Brad), obligated', 'sp', 2025, S2, D(2026, 2, 26), 1_760_000_00, EXEC)
    R('Initial Spares FY2025 named OBBBA: counts (Brad), planned', 'sp', 2025, S2, D(2027, 4, 30), 615_000_00, NA)
    for _ in range(2):
        g.program('sp', 2026)
    for _ in range(2):
        g.program('opn', 2025)
    P1 = ('CT-90761', 'Ship Bridge Line', O2_OPN_FLEX, 'MX - Ship Bridge Line', MXS)
    R('OPN FY2025 on a budget the report marks in Budget Flex 02: counts, obligated', 'opn', 2025, P1, D(2026, 3, 4),
      1_380_000_00, EXEC)
    R('OPN FY2025 on a budget the report marks in Budget Flex 02: counts, planned', 'opn', 2025, P1, D(2027, 5, 31),
      520_000_00, NA)
    files = {'om': OBBBA2_FILES['pull-om'], 'ff': OBBBA2_FILES['pull-ff'], 'sp': OBBBA2_FILES['pull-sp'],
             'opn': OBBBA2_FILES['pull-sp']}
    for tab in ('om', 'ff', 'sp', 'opn'):
        for r in g.rows[tab]:
            it = r['intent']
            it.setdefault('case', 'ordinary')
            it['file'] = files[tab]
            o = OBBBA2_NAMES.get(it['budget'])
            it['word'] = bool(o and o[5])
            it['marked'] = obbba2_marked(it['budget'])
            o25 = it['ap'] == 'om' and it['fy'] == 2025
            it['obbba'] = o25 and it['word']
            it['obbbaReport'] = o25 and (it['word'] or it['marked'])
            it['by'] = ('name' if it['word'] else 'report') if it['obbbaReport'] else None
            it['elsewhere'] = (not it['bad'] and it['ap'] not in (None, 'om') and it['fy'] == 2025 and it['word'])
            it['meant'] = {'noReport': obbba2_meant(it, False), 'report': obbba2_meant(it, True)}
    return g


class Obbba2BaeGen(BaeGen):
    def __init__(self, seed):
        self.rng = random.Random('obbba2-bae|%d' % seed)        # its own stream: no other report's is drawn on

    def row(self, name, fy, app, auth, case='', flex=None, flex_word=False, **kw):
        """bae_meaning gives the NAME's scope; §17.1 makes a row 'obbba' when its name is an O&M one, its FY is 2025 and
        its name or its Budget Flex 02 holds the word, after 'flyaway' and 'noap'. `flex` writes the three Flex cells
        ({'Budget Flex 02': 'DI OBBBA', ...}); `flex_word` STATES whether that Flex 02 holds the word (never matched
        here). Each row's intent gains the three texts, `flexWord`, `word`, `obbba`, `obbbaBy`, `case`, `elsewhere` and
        `meant` (the Counted words at First FY 2025, every switch on)."""
        assert flex_word is False or flex, 'a row said to be marked writes its Budget Flex 02'
        r = super().row(name, fy, app, auth, **kw)
        cells, it = r['cells'], r['intent']
        for col, v in (flex or {}).items():
            cells[col] = v
        it['flex01'], it['flex02'], it['flex03'] = (cells.get('Budget Flex 01'), cells.get('Budget Flex 02'),
                                                    cells.get('Budget Flex 03'))
        it['flexWord'] = bool(flex_word)
        o = OBBBA2_NAMES.get(name)
        it['word'] = bool(o and o[5])
        it['obbba'] = it['ap'] == 'om' and it['fy'] == 2025 and (it['word'] or it['flexWord'])
        if it['obbba'] and it['scope'] == 'in':
            it['scope'] = 'obbba'
        it['obbbaBy'] = ('name' if it['word'] else 'flex02') if it['scope'] == 'obbba' else None
        it['case'] = case
        it['elsewhere'] = (not it['bad'] and it['scope'] == 'in' and it['ap'] != 'om' and it['fy'] == 2025
                           and (it['word'] or it['flexWord']))
        it['meant'] = OBBBA2_BAE_WHY['bad' if it['bad'] else it['scope'] if it['scope'] in ('flyaway', 'noap')
                                     else 'before' if it['fy'] < 2025 else it['obbbaBy'] if it['scope'] == 'obbba'
                                     else 'yes']
        return r


def build_obbba2_bae(g, seed):
    """The report of obbba2/: the §17 cases with fixed figures and their Budget Flex cells, then ordinary rows covering
    every other budget and FY the pulls count with the report loaded (Approved 1.0-1.25x its plan)."""
    b = Obbba2BaeGen(seed)
    rng = b.rng
    F2, F1, F3 = 'Budget Flex 02', 'Budget Flex 01', 'Budget Flex 03'
    hand = [
        # name, FY, Approved, Authorized, the Flex cells, Flex 02 holds the word (stated), why it is there
        (O2_FLEX, 2025, 4_850_000_00, '=', {F2: 'DI OBBBA'}, True,
         'O&M FY2025, marked in Budget Flex 02 only: left out (obbbaBy flex02), and it marks the pull\'s rows of its budget'),
        (O2_FLEX_LOW, 2025, 2_120_000_00, 1_900_000_00, {F2: 'MA obbba'}, True,
         'O&M FY2025, marked in Budget Flex 02 in lower case: left out (obbbaBy flex02)'),
        (O2_REPONLY, 2025, 3_375_000_00, '=', {F2: 'OBBBA DI'}, True,
         'O&M FY2025, marked in Budget Flex 02, no pull row: left out (obbbaBy flex02)'),
        (O2_NAMED, 2025, 5_600_000_00, '=', {F2: 'MA OBBBA'}, True,
         'O&M FY2025, its name and its Budget Flex 02 both: left out (obbbaBy name)'),
        (O2_NAMED2, 2025, 2_480_000_00, '=', {F2: 'DI'}, False,
         'O&M FY2025, its name alone: left out (obbbaBy name)'),
        (O2_LONG, 2025, 1_380_000_00, '=', {F2: 'DI OBBBAX'}, False,
         'O&M FY2025, OBBBAX in Budget Flex 02 (a longer word): counts'),
        (O2_FLEX13, 2025, 1_525_000_00, '=', {F1: 'FIXT OBBBA', F2: 'DI', F3: 'OBBBA FXR'}, False,
         'O&M FY2025, the word in Budget Flex 01 and 03 only (never read): counts'),
        (O2_FLEX26, 2025, 1_910_000_00, '=', {F2: 'DI'}, False, 'O&M FY2025, not marked: counts'),
        (O2_FLEX26, 2026, 1_240_000_00, '=', {F2: 'DI OBBBA'}, True,
         'O&M FY2026, marked in Budget Flex 02: counts (FY2025 only is left out)'),
        (O2_NOAP, 2025, 1_150_000_00, '=', {F2: 'DI OBBBA'}, True,
         'marked in Budget Flex 02 but naming no appropriation: that first; not O&M, so it marks no pull row'),
        (O2_FF_FLEX, 2025, 3_950_000_00, '=', {F2: 'DI OBBBA'}, True,
         'Full Fund FY2025, marked in Budget Flex 02: counts (obbbaElsewhere, by Flex 02)'),
        (O2_FF_NAMED, 2025, 5_125_000_00, 4_600_000_00, {F2: 'MA'}, False,
         'Full Fund FY2025, named OBBBA: counts (obbbaElsewhere, by name)'),
        (O2_FF_FLY, 2025, 875_000_000_00, '=', {F2: 'DI OBBBA'}, True,
         'Full Fund Flyaway FY2025, marked in Budget Flex 02: Flyaway first, so in no obbbaElsewhere'),
        (O2_SP_FLEX, 2025, 4_725_000_00, '=', {F2: 'DI OBBBA'}, True,
         'Initial Spares FY2025, marked in Budget Flex 02: counts (Brad; obbbaElsewhere, by Flex 02)'),
        (O2_SP_NAMED, 2025, 2_840_000_00, '=', {F2: 'DI'}, False,
         'Initial Spares FY2025, named OBBBA: counts (obbbaElsewhere, by name)'),
        (O2_OPN_FLEX, 2025, 2_260_000_00, '=', {F2: 'DI OBBBA'}, True,
         'OPN FY2025, marked in Budget Flex 02: counts (obbbaElsewhere, by Flex 02)'),
    ]
    rows = [b.row(name, fy, app, auth, case=case, flex=flex, flex_word=fw) for name, fy, app, auth, flex, fw, case in hand]
    # the table's Flex 02 column states the same marks as the rows written here (a budget, by normKey, is marked when
    # its FY2025 row says so)
    nk = lambda s: ' '.join(s.split()).lower()
    for name, o in OBBBA2_NAMES.items():
        said = any(nk(n) == nk(name) and fy == 2025 and fw for n, fy, _a, _u, _f, fw, _c in hand)
        assert said == o[6], name
    have = {(nk(r['intent']['name']), r['intent']['fy']) for r in rows}
    plan = {}
    for tab in ('om', 'ff', 'sp', 'opn'):
        for r in g.rows[tab]:
            it = r['intent']
            if it['meant']['report'] == 'counted':
                plan[(it['budget'], it['fy'])] = plan.get((it['budget'], it['fy']), 0) + it['cents']
    for (name, fy) in sorted(plan):
        if (nk(name), fy) in have:
            continue
        have.add((nk(name), fy))
        base = max(plan[(name, fy)], 1_500_000_00)
        a = int(base * rng.uniform(1.0, 1.25))
        case = 'ordinary: covers its block'
        if fy < 2027:
            rows.append(b.row(name, fy, a, '=', case=case))
        elif rng.random() < .5:
            rows.append(b.row(name, fy, a, BAE_ZERO, case=case))
        else:
            a -= a % 100
            rows.append(b.row(name, fy, a, a * rng.randint(40, 90) // 100, app_style='int', case=case))
    rows.sort(key=lambda r: (r['intent']['name'].lower(), r['intent']['fy']))
    return rows


# ----------------------------------------------------------------------------------------------------- writers
def put_row(ws, rno, order, cells, epoch1904=False, extra=None):
    for ci, h in enumerate(order, start=1):
        if h is None:
            continue
        v = extra if h == '__extra__' else cells.get(h)
        if v is None or v == '':
            continue
        if h in ('Date', 'Month') and epoch1904 and isinstance(v, (int, float)) and not isinstance(v, bool):
            v = v - 1462            # the same day, counted from 1904
        c = ws.cell(row=rno, column=ci, value=v)
        if isinstance(v, dt.datetime):
            c.number_format = 'yyyy-mm-dd'


def write_raw_tab(wb, ap, rows, trailing=0, rowkey=None):
    ws = wb.create_sheet(TABS[ap])
    ws.cell(row=1, column=1, value=TAB_TITLE[ap])
    order = RAW_HEADERS + ['Svc (auto)', 'Inc (auto)']
    for ci, h in enumerate(order, start=1):
        ws.cell(row=2, column=ci, value=h)
    rno = 3
    for i, r in enumerate(rows):
        put_row(ws, rno, RAW_HEADERS, r['cells'])
        if rowkey:
            r['intent'][rowkey] = rno           # the sheet row it was written on (obbba2/ only: its manifest records it)
        # v12's formula columns, filled the way its fallback filled them (every unmatched name read as USAF): the
        # tool must ignore both
        ws.cell(row=rno, column=33, value='USAF')
        ws.cell(row=rno, column=34, value=1)
        rno += 1
        if i == 40:
            rno += 1             # a wholly blank row inside the data
    for _ in range(trailing):    # v12 fills its formula columns to row 2600: rows with nothing in the 32 columns
        ws.cell(row=rno, column=33, value='USAF')
        ws.cell(row=rno, column=34, value=0)
        rno += 1
    return ws


def write_misc(wb, rows):
    ws = wb.create_sheet('Misc Export')
    ws.cell(row=1, column=1, value='Combined export')
    ws.cell(row=3, column=1, value='Rows below carry budget names no rule recognises.')
    for ci, h in enumerate(RAW_HEADERS, start=1):
        ws.cell(row=4, column=ci, value=h)
    for i, r in enumerate(rows):
        put_row(ws, 5 + i, RAW_HEADERS, r['cells'])


def write_notes(wb):
    ws = wb.create_sheet('Notes')
    ws.cell(row=1, column=1, value='About this file')
    for ci, h in enumerate(['FY', 'Title', 'Amount'], start=1):      # some of the headers, never all: not a table
        ws.cell(row=3, column=ci, value=h)
    ws.cell(row=4, column=1, value='This sheet carries no data table.')


REPORT_VARIANTS = {'CCaR No': 'CCaR  No', 'PMT PID#': 'pmt pid#', 'Amount': 'AMOUNT', 'Plan Event': ' Plan Event '}


def report_order(seed):
    order = list(RAW_HEADERS)
    random.Random(seed * 7 + 1).shuffle(order)
    order.insert(11, '__extra__')
    return order


def write_report(path, om_rows, misc_rows, seed, rowkey=None):
    wb = openpyxl.Workbook()
    wb.epoch = CALENDAR_MAC_1904
    ws = wb.active
    ws.title = 'Report'
    order = report_order(seed)
    for ci, h in enumerate(order, start=1):
        ws.cell(row=1, column=ci, value='Remarks' if h == '__extra__' else REPORT_VARIANTS.get(h, h))
    rno = 2
    for i, r in enumerate(om_rows):
        put_row(ws, rno, order, r['cells'], epoch1904=True, extra=('checked' if i % 9 == 0 else None))
        if rowkey:
            r['intent'][rowkey] = rno           # the sheet row it was written on (obbba/ only: its manifest records it)
        rno += 1
        if i == 30:
            rno += 1                                   # a blank row
            ws.cell(row=rno, column=order.index('__extra__') + 1, value='(spacer: remarks only, no data)')
            rno += 1
    for r in misc_rows:
        put_row(ws, rno, order, r['cells'], epoch1904=True, extra='combined export line')
        if rowkey:
            r['intent'][rowkey] = rno
        rno += 1
    save_deterministic(wb, path, shared=False)


def csv_text(v):
    if v is None:
        return ''
    if isinstance(v, dt.datetime):
        assert v.time() == dt.time(0), 'a CSV date cannot carry a time of day and still read as the xlsx does'
        return v.date().isoformat()
    if isinstance(v, bool):
        raise ValueError('no booleans in the fixture')
    if isinstance(v, float):
        return repr(v)
    return str(v)


def write_csv(path, rows, rowkey=None):
    buf = io.StringIO(newline='')
    w = csv.writer(buf, lineterminator='\r\n', quoting=csv.QUOTE_MINIMAL)
    w.writerow(RAW_HEADERS)
    rno = 2                                           # the record number: the header is record 1
    for i, r in enumerate(rows):
        for h in ('Date', 'Month'):
            v = r['cells'][h]
            assert v is None or isinstance(v, (dt.datetime, str)), 'FF rows go out as CSV: no serial dates'
        w.writerow([csv_text(r['cells'][h]) for h in RAW_HEADERS])
        if rowkey:
            r['intent'][rowkey] = rno
        rno += 1
        if i == 25:
            w.writerow([''] * len(RAW_HEADERS))       # a blank line of empty fields
            rno += 1
    with open(path, 'w', encoding='utf-8', newline='') as f:
        f.write('\ufeff' + buf.getvalue())


def to_shared_strings(files):
    """openpyxl writes every text cell inline; Excel, and so a real CCaR pull, writes shared strings. Rewrite the
    sheets so the fixture exercises the reader's shared-string path (pull-om.xlsx keeps the inline path)."""
    sst, index = [], {}

    def take(m):
        attrs, text = m.group(1), m.group(3)
        if text not in index:
            index[text] = len(sst)
            sst.append(text)
        return '<c %st="s"%s><v>%d</v></c>' % (attrs, m.group(2), index[text])
    rx = re.compile(r'<c ([^>]*?)t="inlineStr"([^>]*)><is><t(?: xml:space="preserve")?>(.*?)</t></is></c>', re.S)
    for name in list(files):
        if name.startswith('xl/worksheets/sheet') and name.endswith('.xml'):
            files[name] = rx.sub(take, files[name].decode('utf-8')).encode('utf-8')
            assert b'inlineStr' not in files[name]
    files['xl/sharedStrings.xml'] = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<sst xmlns="http://schemas.openxmlformats.org/'
        'spreadsheetml/2006/main" count="%d" uniqueCount="%d">%s</sst>' % (
            len(sst), len(sst), ''.join('<si><t xml:space="preserve">%s</t></si>' % t for t in sst))).encode('utf-8')
    ct = files['[Content_Types].xml'].decode('utf-8')
    ct = ct.replace('</Types>', '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-'
                                'officedocument.spreadsheetml.sharedStrings+xml"/></Types>')
    files['[Content_Types].xml'] = ct.encode('utf-8')
    rels = files['xl/_rels/workbook.xml.rels'].decode('utf-8')
    rels = rels.replace('</Relationships>', '<Relationship Id="rIdSst" Type="http://schemas.openxmlformats.org/'
                                            'officeDocument/2006/relationships/sharedStrings" '
                                            'Target="sharedStrings.xml"/></Relationships>')
    files['xl/_rels/workbook.xml.rels'] = rels.encode('utf-8')


def save_deterministic(wb, path, shared):
    buf = io.BytesIO()
    wb.save(buf)
    zin = zipfile.ZipFile(io.BytesIO(buf.getvalue()))
    names = [i.filename for i in zin.infolist()]
    files = {n: zin.read(n) for n in names}
    # the document's own clock, so the same seed writes the same bytes
    core = files['docProps/core.xml'].decode('utf-8')
    core = re.sub(r'(<dcterms:(?:created|modified)[^>]*>)[^<]*(</dcterms:(?:created|modified)>)',
                  r'\g<1>2026-11-01T00:00:00Z\g<2>', core)
    files['docProps/core.xml'] = core.encode('utf-8')
    if shared:
        to_shared_strings(files)
        names.append('xl/sharedStrings.xml')
    with zipfile.ZipFile(path, 'w') as zout:
        for n in names:
            zi = zipfile.ZipInfo(n, date_time=EPOCH_FIX)
            zi.compress_type = zipfile.ZIP_DEFLATED
            zi.external_attr = 0o600 << 16
            zout.writestr(zi, files[n])


def write_all(path, g, include=('om', 'ff', 'sp', 'opn'), misc=True, notes=True, rowkey=None):
    wb = openpyxl.Workbook()
    wb.remove(wb.active)
    for ap in ('om', 'ff', 'sp', 'opn'):
        if ap in include:
            write_raw_tab(wb, ap, g.rows[ap], trailing=12 if ap in ('om', 'ff') else 0, rowkey=rowkey)
    if misc:
        write_misc(wb, g.rows['misc'])
    if notes:
        write_notes(wb)
    save_deterministic(wb, path, shared=True)


def write_bae(path, rows, order=BAE_HEADERS, labels=None, top=()):
    """The report as its export writes it: lines above the header (none in gen1), the header, every row with all 28
    cells styled (a blank one is a styled empty cell, as in the real file), and the report's own total row: no Budget
    Name, no FY, and in the two money columns the sum of every number above it (text is not summed, so a '$0.000' adds
    nothing). Each row's intent learns the sheet row it was written on; the total row's intent is appended."""
    labels = labels or {}
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'Sheet1'
    mid = Alignment(vertical='center')
    for i, t in enumerate(top, start=1):
        ws.cell(row=i, column=1, value=t)
    hr = len(top) + 1
    for ci, h in enumerate(order, start=1):
        c = ws.cell(row=hr, column=ci, value=labels.get(h, h))
        c.number_format, c.font, c.alignment = BAE_HDR_FMT, Font(bold=True), Alignment(vertical='center', wrap_text=True)
    ws.row_dimensions[hr].height = 27.75
    money = (BAE_APP, BAE_AUTH)
    tot = {BAE_APP: 0.0, BAE_AUTH: 0.0}
    rno = hr + 1
    for r in rows:
        r['intent']['row'] = rno
        for ci, h in enumerate(order, start=1):
            v = r['cells'].get(h)
            c = ws.cell(row=rno, column=ci, value=v)
            c.number_format = BAE_MONEY_FMT if h in money else 'General'
            c.alignment = mid
            if h in money and isinstance(v, (int, float)) and not isinstance(v, bool):
                tot[h] += v
        ws.row_dimensions[rno].height = 27.75
        rno += 1
    tot = {h: as_written(v) for h, v in tot.items()}
    for ci, h in enumerate(order, start=1):
        c = ws.cell(row=rno, column=ci, value=tot[h] if h in money else None)
        c.number_format = BAE_MONEY_FMT if h in money else ('0.00' if h in (BAE_FY, 'Budget Exec Years') else 'General')
        c.alignment = mid
    ws.row_dimensions[rno].height = 27.75
    ws.freeze_panes = 'A%d' % (hr + 1)
    ws.sheet_properties.outlinePr = Outline(summaryBelow=False)
    save_deterministic(wb, path, shared=True)
    rows.append({'intent': {'kind': 'total', 'row': rno, 'approved': tot[BAE_APP], 'authorized': tot[BAE_AUTH]}})


def main():
    ap = argparse.ArgumentParser(description='Write the synthetic CCaR pulls (CONTRACT §12).')
    ap.add_argument('--out', required=True)
    ap.add_argument('--seed', type=int, default=20261109)
    ap.add_argument('--no-obbba', action='store_true', dest='no_obbba',
                    help='leave out obbba/ (fixture.test.mjs uses it to prove obbba/ moves no other byte)')
    ap.add_argument('--no-obbba2', action='store_true', dest='no_obbba2',
                    help='leave out obbba2/ (fixture.test.mjs uses it to prove obbba2/ moves no other byte); --no-obbba '
                         'leaves out obbba/ alone, and obbba2/ is the same with or without it')
    args = ap.parse_args()
    out = args.out
    os.makedirs(os.path.join(out, 'gen2'), exist_ok=True)
    g1 = build_gen1(args.seed)
    g2, changes = build_gen2(g1)
    write_all(os.path.join(out, 'pull-all.xlsx'), g1)
    write_all(os.path.join(out, 'pull-sp-opn.xlsx'), g1, include=('sp', 'opn'), misc=False, notes=False)
    write_report(os.path.join(out, 'pull-om.xlsx'), g1.rows['om'], g1.rows['misc'], args.seed)
    write_csv(os.path.join(out, 'pull-ff.csv'), g1.rows['ff'])
    write_report(os.path.join(out, 'gen2', 'pull-om.xlsx'), g2.rows['om'], g2.rows['misc'], args.seed)
    write_csv(os.path.join(out, 'gen2', 'pull-ff.csv'), g2.rows['ff'])
    # the BAE reports come last, from their own random stream: nothing above moves (§14.8)
    bg, bae1 = build_bae(g1, args.seed)
    bae2, bae2ch = build_bae_gen2(bg, bae1, g2)
    write_bae(os.path.join(out, 'bae.xlsx'), bae1)
    write_bae(os.path.join(out, 'gen2', 'bae.xlsx'), bae2, BAE_GEN2_ORDER, BAE_GEN2_LABELS, BAE_GEN2_TOP)
    # §15's obbba/ comes after everything above, from its own random streams: nothing above moves (§15.5)
    og = obae = None
    if not args.no_obbba:
        os.makedirs(os.path.join(out, 'obbba'), exist_ok=True)
        og = build_obbba(args.seed)
        write_report(os.path.join(out, OBBBA_FILES['pull-om']), og.rows['om'], og.rows['misc'], args.seed, rowkey='row')
        write_csv(os.path.join(out, OBBBA_FILES['pull-ff']), og.rows['ff'], rowkey='row')
        obae = build_obbba_bae(og, args.seed)
        write_bae(os.path.join(out, OBBBA_FILES['bae']), obae)
    # §17's obbba2/ comes after everything above, obbba/ included, from its own random streams: nothing above moves (§17.4)
    o2 = o2bae = None
    if not args.no_obbba2:
        os.makedirs(os.path.join(out, 'obbba2'), exist_ok=True)
        o2 = build_obbba2(args.seed)
        write_all(os.path.join(out, OBBBA2_FILES['pull-om']), o2, include=('om',), misc=False, notes=False, rowkey='row')
        write_csv(os.path.join(out, OBBBA2_FILES['pull-ff']), o2.rows['ff'], rowkey='row')
        write_all(os.path.join(out, OBBBA2_FILES['pull-sp']), o2, include=('sp', 'opn'), misc=False, notes=False, rowkey='row')
        o2bae = build_obbba2_bae(o2, args.seed)
        write_bae(os.path.join(out, OBBBA2_FILES['bae']), o2bae)

    def intents(g, aps):
        return [r['intent'] for a in aps for r in g.rows[a]]
    manifest = {
        'seed': args.seed,
        'note': 'what make_fixture.py meant each row to be; the oracle never reads this file',
        'files': {'pull-all.xlsx': ['O&M Raw Data', 'FF Raw Data', 'Spares Raw Data', 'OPN Raw Data', 'Misc Export', 'Notes'],
                  'pull-om.xlsx': ['Report'], 'pull-ff.csv': [], 'pull-sp-opn.xlsx': ['Spares Raw Data', 'OPN Raw Data'],
                  'gen2/pull-om.xlsx': ['Report'], 'gen2/pull-ff.csv': []},
        'reportOrder': ['Remarks' if h == '__extra__' else h for h in report_order(args.seed)],
        'gen1': intents(g1, ('om', 'ff', 'sp', 'opn', 'misc')),
        'gen2': intents(g2, ('om', 'ff', 'misc')),
        'gen2Changes': changes,
        # The BAE reports: what each row of bae.xlsx and gen2/bae.xlsx was MEANT to be (kind data / skip / total; the
        # sheet row; the name; FY; the cents each money cell must read as, None when it cannot be read; how each was
        # written; and what the name means by §14.2: ap, scope, service, lane, the budget's PMO), stated from this
        # file's own tables. budgetPmo is the budget's PMO of every name the pull uses, by hand.
        'bae': {'headers': BAE_HEADERS, 'gen2Order': BAE_GEN2_ORDER, 'gen2Labels': BAE_GEN2_LABELS, 'gen2Top': BAE_GEN2_TOP,
                'moneyFormat': BAE_MONEY_FMT, 'zero': BAE_ZERO, 'lacks': BAE_LACKS, 'budgetPmo': BUDGET_PMO,
                'names': {n: dict(zip(('ap', 'scope', 'svc', 'lane', 'pmo'), bae_meaning(n)))
                          for n in sorted(set(BAE_ONLY) | {n for n, b in BUDGETS.items() if b[0]})},
                'gen1': [r['intent'] for r in bae1], 'gen2': [r['intent'] for r in bae2], 'gen2Changes': bae2ch},
    }
    if og:
        # §15: what each row of obbba/ was MEANT to be. "pull" is every row of the two pulls in file order (obbba/
        # pull-om.xlsx: its O&M rows, then the row nothing identifies; then obbba/pull-ff.csv), each with the sheet
        # row it was written on, its case, whether it is FY2025 OBBBA funding (from OBBBA_NAMES, never the text) and
        # what it is meant to be at First FY 2025 with every switch on. "bae" is every report row as the "bae" part's
        # rows are, plus obbba, case and the Counted words meant. "names" states each name by hand; "budgetPmo" is the
        # budget's PMO of every name the two pulls use.
        used = sorted({r['intent']['budget'] for t in ('om', 'misc', 'ff') for r in og.rows[t]})
        manifest['obbba'] = {
            'note': 'CONTRACT §15: FY2025 OBBBA funding is left out; the oracle never reads this part either',
            'files': {OBBBA_FILES['pull-om']: ['Report'], OBBBA_FILES['pull-ff']: [], OBBBA_FILES['bae']: ['Sheet1']},
            'names': {n: dict(zip(('ap', 'scope', 'svc', 'lane', 'pmo', 'word'), v)) for n, v in OBBBA_NAMES.items()},
            'budgetPmo': {n: OBBBA_NAMES[n][4] if n in OBBBA_NAMES else BUDGET_PMO[n] for n in used},
            'pull': [r['intent'] for t in ('om', 'misc', 'ff') for r in og.rows[t]],
            'bae': [r['intent'] for r in obae]}
    if o2:
        # §17: what each row of obbba2/ was MEANT to be. "pull" is every row of the three pulls in file order (obbba2/
        # pull-om.xlsx, obbba2/pull-ff.csv, then obbba2/pull-sp.xlsx's Spares and OPN tabs), each with the sheet row it
        # was written on, its case, `word` (its name holds OBBBA) and `marked` (the report marks its budget), both from
        # OBBBA2_NAMES, `obbba` / `obbbaReport` (FY2025 O&M OBBBA funding without the report / with it), `by` (with it:
        # 'name' | 'report'), `elsewhere` (§17.2 obbbaElsewhere's pull side) and `meant` ({noReport, report}: the
        # oracle's rawCounted code at First FY 2025, every switch on). "bae" is every report row as the "bae" part's rows
        # are, plus the three Budget Flex texts written, `flexWord` (Flex 02 holds the word, stated by hand), `word`,
        # `obbba` (the §17.1 predicate), `obbbaBy`, `case`, `elsewhere` and the Counted words meant. "names" states each
        # name by hand; "marks" the names whose budget the report marks for pull rows; "budgetPmo" the budget's PMO of
        # every name the pulls use.
        used2 = sorted({r['intent']['budget'] for t in ('om', 'ff', 'sp', 'opn') for r in o2.rows[t]})
        manifest['obbba2'] = {
            'note': 'CONTRACT §17: FY2025 O&M OBBBA funding is left out, marked in its name or in Budget Flex 02; the '
                    'oracle never reads this part either',
            'files': {OBBBA2_FILES['pull-om']: ['O&M Raw Data'], OBBBA2_FILES['pull-ff']: [],
                      OBBBA2_FILES['pull-sp']: ['Spares Raw Data', 'OPN Raw Data'], OBBBA2_FILES['bae']: ['Sheet1']},
            'names': {n: dict(zip(('ap', 'scope', 'svc', 'lane', 'pmo', 'word', 'flex25'), v)) for n, v in OBBBA2_NAMES.items()},
            'marks': sorted(n for n in OBBBA2_NAMES if obbba2_marked(n)),
            'budgetPmo': {n: OBBBA2_NAMES[n][4] if n in OBBBA2_NAMES else BUDGET_PMO[n] for n in used2},
            'pull': [r['intent'] for t in ('om', 'ff', 'sp', 'opn') for r in o2.rows[t]],
            'bae': [r['intent'] for r in o2bae]}
    with open(os.path.join(out, 'manifest.json'), 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
        f.write('\n')
    n = {a: len(g1.rows[a]) for a in g1.rows}
    print('fixture written to %s: %d rows (%s); gen2 O&M %d, FF %d' % (
        out, sum(n.values()), ', '.join('%s %d' % kv for kv in n.items()), len(g2.rows['om']), len(g2.rows['ff'])))
    if og:
        print('obbba/: O&M %d, unidentified %d, FF %d pull rows; %d report rows' % (
            len(og.rows['om']), len(og.rows['misc']), len(og.rows['ff']), len(obae) - 1))
    if o2:
        print('obbba2/: O&M %d, FF %d, Spares %d, OPN %d pull rows; %d report rows' % (
            len(o2.rows['om']), len(o2.rows['ff']), len(o2.rows['sp']), len(o2.rows['opn']), len(o2bae) - 1))


if __name__ == '__main__':
    main()
