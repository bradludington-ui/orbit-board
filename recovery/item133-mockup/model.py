# Item 133 mock-up: the Service share workbook. EVERY FIGURE, NAME, CCaR NUMBER AND CONTRACT NUMBER HERE IS INVENTED.
# Nothing is read from a board, the ACE or CCaR. The WBS names are placeholders: the real ones come from the ACE workbook
# once Brad has found the tab and column that hold them (28 Oct 2026). 1.3.1 has no name, to show the fallback.
import random

ACTIVE, YEARS = 2027, [2028, 2029]          # FY27 is the active year (CCaR), FY28 the budget year, FY29 an out-year
THROUGH = '30 Nov 2026'                      # the CCaR pull's data-through date (invented)
ACT_MONTHS = 2                               # Oct and Nov are actuals; Dec to Sep are planned
MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
MARK = 'CUI//REL TO US DoW'                  # the marking FYDP Disconnects carries (FDC_MARK)

LINES = ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C', 'USN']
GROUPS = [('Air Force', ['USAF', 'ANG', 'AFRC']), ('Marine Corps', ['STOVL', 'USMC-C']), ('Navy', ['USN'])]
LINE_NAME = {'USAF': 'USAF', 'ANG': 'ANG', 'AFRC': 'AFRC', 'STOVL': 'USMC STOVL', 'USMC-C': 'USMC CV', 'USN': 'USN CV'}

WBS = {
  '1': 'Product Support', '1.1': 'Air Vehicle', '1.1.1': 'Depot Repair', '1.1.1.1': 'Airframe Depot Repair',
  '1.1.1.2': 'Component Repair', '1.1.2': 'Air Vehicle Spares', '1.2': 'Propulsion', '1.2.1': 'Engine Depot',
  '1.2.2': 'Engine Spares', '1.2.2.1': 'Module Spares', '1.2.2.3': 'Consumables', '1.3': 'Training Systems',
  '1.3.1': None,
}
def parent(w): return w.rsplit('.', 1)[0] if '.' in w else None
def kids(w): return sorted([k for k in WBS if parent(k) == w], key=lambda k: [int(x) for x in k.split('.')])
def label(w): return w + ('  ' + WBS[w] if WBS[w] else '  (name not linked yet)')
def level(w): return w.count('.') + 1

# Requirements on the ORBIT plan (FY28 onward). split: [(paragraph, fraction)] -- a requirement on two paragraphs carries
# typed dollars on each; here the fraction stands in for what the office typed (Brad: typed, one paragraph takes it all).
REQS = {
  'O&M': [
    ('Airframe depot induction',   'MOCK0101', 'MOCK-26-C-0101', [('1.1.1.1', 1)], {'USAF': 9, 'ANG': 1.2, 'AFRC': .8, 'STOVL': 4, 'USMC-C': 1.5, 'USN': 2.5}),
    ('Landing gear repair',        'MOCK0102', 'MOCK-26-C-0102', [('1.1.1.2', 1)], {'USAF': 3.2, 'STOVL': 2.1, 'USN': 1.1}),
    ('Avionics component repair',  'MOCK0103', 'MOCK-26-C-0103', [('1.1.1.2', 1)], {'USAF': 5.5, 'ANG': .6, 'AFRC': .4, 'STOVL': 1.9, 'USMC-C': .7, 'USN': 1.4}),
    ('Engine depot overhaul',      'MOCK0104', 'MOCK-26-C-0104', [('1.2.1', 1)],   {'USAF': 12, 'ANG': 1.5, 'AFRC': 1, 'STOVL': 6, 'USMC-C': 2, 'USN': 3.5}),
    ('Engine module repair',       'MOCK0105', 'MOCK-26-C-0105', [('1.2.2.1', .6), ('1.2.2.3', .4)], {'USAF': 6, 'STOVL': 3, 'USMC-C': 1, 'USN': 2}),
    ('Engine consumables',         'MOCK0106', 'MOCK-26-C-0106', [('1.2.2.3', 1)], {'USAF': 2.4, 'ANG': .3, 'AFRC': .2, 'STOVL': 1.1, 'USMC-C': .4, 'USN': .8}),
    ('Full mission simulator sustainment', 'MOCK0107', 'MOCK-26-C-0107', [('1.3.1', 1)], {'USAF': 4.5, 'STOVL': 1.8, 'USN': 1.2}),
  ],
  'Full Fund': [
    ('Air vehicle initial spares', 'MOCK0201', 'MOCK-26-C-0201', [('1.1.2', 1)],   {'USAF': 14, 'STOVL': 5, 'USMC-C': 2, 'USN': 4}),
    ('Support equipment spares',   'MOCK0202', 'MOCK-26-C-0202', [('1.1.2', 1)],   {'USAF': 3, 'ANG': .5, 'STOVL': 1.2, 'USN': .9}),
    ('Engine module spares',       'MOCK0203', 'MOCK-26-C-0203', [('1.2.2.1', 1)], {'USAF': 8, 'STOVL': 4, 'USMC-C': 1.2, 'USN': 2.4}),
  ],
}
APPNS = list(REQS)

rng = random.Random(133)
def whole(x): return int(round(x / 1000.0)) * 1000         # invented dollars, whole thousands for readability

# PLAN[appn][fy] = list of {title, ccar, contract, wbs, ask:{line:$}, fund:{line:$}}; one entry per requirement x paragraph
PLAN, ACE = {}, {}
for ap in APPNS:
  PLAN[ap], ACE[ap] = {}, {}
  for fy in YEARS:
    rows, grow = [], 1 + 0.03 * (fy - YEARS[0])
    for (t, ccar, con, split, base) in REQS[ap]:
      ask = {s: whole(base.get(s, 0) * 1e6 * grow * rng.uniform(.97, 1.03)) for s in LINES}
      fund = {s: whole(ask[s] * rng.choice([1, 1, 1, .9, .8, .75])) for s in LINES}
      for (w, f) in split:
        part = (' (part: ' + ' and '.join(x for x, _ in split) + ')') if len(split) > 1 else ''
        rows.append({'title': t + part, 'ccar': ccar, 'contract': con, 'wbs': w,
                     'ask': {s: whole(ask[s] * f) for s in LINES}, 'fund': {s: whole(fund[s] * f) for s in LINES}})
    PLAN[ap][fy] = rows
    leaf = {}
    for r in rows: leaf[r['wbs']] = leaf.get(r['wbs'], 0) + sum(r['ask'].values())
    ACE[ap][fy] = {w: whole(v * rng.uniform(.92, 1.08)) for w, v in leaf.items()}

# The active year, as CCaR holds it: plan events with a WBS paragraph on each row (Brad: being added to CCaR), a month
# and obligated or not. EVENTS[appn] = list of {title, ccar, contract, wbs, line, month (0..11), amount, ob}
EVENTS = {}
for ap in APPNS:
  ev = []
  for (t, ccar, con, split, base) in REQS[ap]:
    for (w, f) in split:
      for s, m in base.items():
        tot = m * 1e6 * f * .97
        for q in range(4):                                   # four plan events a year per service line
          mo = q * 3 + rng.randint(0, 2)
          amt = whole(tot / 4 * rng.uniform(.85, 1.15))
          ev.append({'title': t, 'ccar': ccar, 'contract': con, 'wbs': w, 'line': s, 'month': mo,
                     'amount': amt, 'ob': mo < ACT_MONTHS})
  EVENTS[ap] = ev
