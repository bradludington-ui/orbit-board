# Item 133 mock-up: the Service share workbook. EVERY FIGURE, NAME, CCaR NUMBER AND CONTRACT NUMBER HERE IS INVENTED.
# Nothing is read from a board, the ACE or CCaR. The WBS names are placeholders: the real ones come from the ACE workbook
# once Brad has found the tab and column that hold them (28 Oct 2026).
# The fixture carries every case the review of the first cut (28 Oct) said real data will: Full Fund names the B model
# USMC-B; a letter-suffixed paragraph (1.1.1.1E, a sibling of 1.1.1.1); an ACE line no requirement claims (1.1.1.3); a
# requirement on a parent that also has children (1.2.2); a requirement with no WBS paragraph yet; one on a paragraph the
# ACE does not hold (1.4); one CCaR record carrying two contracts; a plan event that slipped (dated Oct, not obligated) and
# one obligated early (dated Jun).
import random, re, datetime

ACTIVE, YEARS = 2027, [2028, 2029]          # FY27 is the active year (CCaR), FY28 the budget year, FY29 an out-year
THROUGH = datetime.date(2026, 11, 30)        # the CCaR pull's data-through date (invented)
MONTHS = [datetime.date(2026 + (m > 2), (m + 9) % 12 + 1, 1) for m in range(12)]    # Oct 26 .. Sep 27
MARK = 'CUI//REL TO US DoW'                  # the marking FYDP Disconnects carries (FDC_MARK)
NONE = '(none)'                              # the paragraph of a line with no WBS paragraph yet

APPNS = ['O&M', 'Full Fund', 'Initial Spares']
SVC_ALIAS = {'USMC-B': 'STOVL'}              # the board's own alias (SVC_ALIAS); Full Fund calls STOVL "USMC-B"
BOARD_LINES = {'O&M': ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C', 'USN'],
               'Full Fund': ['USAF', 'ANG', 'AFRC', 'USMC-B', 'USMC-C', 'USN'],
               'Initial Spares': ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C', 'USN']}
GROUPS = [('Air Force', ['USAF', 'ANG', 'AFRC']), ('Marine Corps', ['STOVL', 'USMC-C']), ('Navy', ['USN'])]
LINE_NAME = {'USAF': 'USAF', 'ANG': 'ANG', 'AFRC': 'AFRC', 'STOVL': 'USMC STOVL', 'USMC-C': 'USMC CV', 'USN': 'USN CV',
             'Other': 'Not identified'}
def canon(s): return SVC_ALIAS.get(s, s)
def group_of(s): return ([g for g, names in GROUPS if canon(s) in names] or ['Service not identified'])[0]

WBS = {   # paragraph -> name, from the names tab once linked (placeholders). 1.3.1 is in the ACE with no name linked yet;
         # 1.4 is in neither. 1.10 sits beside 1.1 (a key Excel could read as the number 1.1 without a prefix)
  '1': 'Product Support', '1.1': 'Air Vehicle', '1.1.1': 'Depot Repair', '1.1.1.1': 'Airframe Depot Repair',
  '1.1.1.1E': 'Airframe Depot Repair (surge)', '1.1.1.2': 'Component Repair', '1.1.1.3': 'Depot Activation',
  '1.1.2': 'Air Vehicle Spares', '1.2': 'Propulsion', '1.2.1': 'Engine Depot', '1.2.2': 'Engine Spares',
  '1.2.2.1': 'Module Spares', '1.2.2.3': 'Consumables', '1.3': 'Training Systems', '1.10': 'Sustaining Engineering',
}
NOT_IN_ACE = {'1.4'}                          # paragraphs a requirement carries that the estimate holds no line for
ACE_SET = '2026ACE'                           # the estimate shown (invented)
def parent(w): return w.rsplit('.', 1)[0] if '.' in w else None     # 1.1.1.1E -> 1.1.1: a suffix is a sibling, not a child
def chain(w):                                                       # [1, 1.2, 1.2.2, 1.2.2.1]
  out = []
  while w: out.insert(0, w); w = parent(w)
  return out
def level(w): return w.count('.') + 1
def natkey(w):                                                       # 1.1.1.1 < 1.1.1.1E < 1.1.1.2; tolerates a P prefix
  return [(m.group(1), int(m.group(2)), m.group(3)) for m in (re.match(r'([A-Za-z]*)(\d+)([A-Za-z]*)$', s) for s in w.split('.'))]
def name_of(w): return WBS.get(w)
def month_date(i): return datetime.date(2026 + (i + 9) // 12, (i + 9) % 12 + 1, 1)    # 0 = Oct 26; may run past Sep 27

# Requirements on the ORBIT plan (FY28 onward): (title, CCaR, contract, [(paragraph or None, fraction)], {board line: $M})
# A requirement on two paragraphs carries the dollars the office typed for each; the fraction stands in for that typing.
REQS = {
  'O&M': [
    ('Airframe depot induction',   'MOCK0101', 'MOCK-26-C-0101', [('1.1.1.1', 1)], {'USAF': 9, 'ANG': 1.2, 'AFRC': .8, 'STOVL': 4, 'USMC-C': 1.5, 'USN': 2.5}),
    ('Airframe surge repair',      'MOCK0109', 'MOCK-26-C-0109', [('1.1.1.1E', 1)], {'USAF': 2.2, 'STOVL': 1.1, 'USN': .6}),
    ('Landing gear repair',        'MOCK0102', 'MOCK-26-C-0102', [('1.1.1.2', 1)], {'USAF': 3.2, 'STOVL': 2.1, 'USN': 1.1}),
    ('Avionics component repair',  'MOCK0103', 'MOCK-26-C-0103', [('1.1.1.2', 1)], {'USAF': 5.5, 'ANG': .6, 'AFRC': .4, 'STOVL': 1.9, 'USMC-C': .7, 'USN': 1.4}),
    ('Avionics software support',  'MOCK0103', 'MOCK-26-C-0108', [('1.1.1.2', 1)], {'USAF': 1.6, 'STOVL': .7, 'USN': .5}),
    ('Engine depot overhaul',      'MOCK0104', 'MOCK-26-C-0104', [('1.2.1', 1)],   {'USAF': 12, 'ANG': 1.5, 'AFRC': 1, 'STOVL': 6, 'USMC-C': 2, 'USN': 3.5}),
    ('Engine depot MIPR, FRC East', 'MOCK0120', '',              [('1.2.1', 1)],   {'STOVL': 2.4, 'USMC-C': .8, 'USN': 1.2}),
    ('Engine depot MIPR, OC-ALC',  'MOCK0120', '',               [('1.2.1', 1)],   {'USAF': 1.3, 'ANG': .3, 'AFRC': .2}),
    ('Sustaining engineering',     'MOCK0113', 'MOCK-26-C-0113', [('1.10', 1)],    {'USAF': 2.0, 'STOVL': .9, 'USMC-C': .3, 'USN': .6}),
    ('Engine spares management',   'MOCK0110', 'MOCK-26-C-0110', [('1.2.2', 1)],   {'USAF': 1.4, 'STOVL': .6, 'USN': .4}),
    ('Engine module repair',       'MOCK0105', 'MOCK-26-C-0105', [('1.2.2.1', .6), ('1.2.2.3', .4)], {'USAF': 6, 'STOVL': 3, 'USMC-C': 1, 'USN': 2}),
    ('Engine consumables',         'MOCK0106', 'MOCK-26-C-0106', [('1.2.2.3', 1)], {'USAF': 2.4, 'ANG': .3, 'AFRC': .2, 'STOVL': 1.1, 'USMC-C': .4, 'USN': .8}),
    ('Full mission simulator sustainment', 'MOCK0107', 'MOCK-26-C-0107', [('1.3.1', 1)], {'USAF': 4.5, 'STOVL': 1.8, 'USN': 1.2}),
    ('Site activation study',      'MOCK0111', 'MOCK-26-C-0111', [('1.4', 1)],     {'USAF': .9, 'USN': .3}),
    ('Logistics data support',     'MOCK0112', 'MOCK-26-C-0112', [(None, 1)],      {'USAF': 1.8, 'STOVL': .8, 'USMC-C': .3, 'USN': .6}),
  ],
  'Full Fund': [
    ('Air vehicle initial spares', 'MOCK0201', 'MOCK-26-C-0201', [('1.1.2', 1)],   {'USAF': 14, 'USMC-B': 5, 'USMC-C': 2, 'USN': 4}),
    ('Support equipment spares',   'MOCK0202', 'MOCK-26-C-0202', [('1.1.2', 1)],   {'USAF': 3, 'ANG': .5, 'USMC-B': 1.2, 'USN': .9}),
    ('Engine module spares',       'MOCK0203', 'MOCK-26-C-0203', [('1.2.2.1', 1)], {'USAF': 8, 'USMC-B': 4, 'USMC-C': 1.2, 'USN': 2.4}),
  ],
  'Initial Spares': [
    ('Initial spares, air vehicle', 'MOCK0301', 'MOCK-26-C-0301', [('1.1.2', 1)],  {'USAF': 4, 'STOVL': 1.5, 'USN': 1}),
    ('Initial spares, engine',     'MOCK0302', 'MOCK-26-C-0302', [('1.2.2.1', 1)], {'USAF': 2.5, 'STOVL': 1, 'USMC-C': .4, 'USN': .7}),
  ],
}
ACE_ONLY = {('O&M', '1.1.1.3'): {'USAF': 2.0, 'STOVL': .8, 'USN': .5}}   # an estimate line no requirement claims ($M)

rng = random.Random(133)
def whole(x): return int(round(x / 1000.0)) * 1000         # invented dollars, whole thousands for readability
def parts(total, fracs):                                    # split a whole-dollar total; the parts add back exactly
  out = [whole(total * f) for f in fracs[:-1]]
  return out + [total - sum(out)]

# PLAN[appn][fy] = [{title, ccar, contract, wbs, split (paragraphs or None), ask:{board line:$}, fund:{board line:$}}]
PLAN, ACE = {}, {}
for ap in APPNS:
  PLAN[ap], ACE[ap] = {}, {}
  for fy in YEARS:
    rows, grow = [], 1 + 0.03 * (fy - YEARS[0])
    for n, (t, ccar, con, split, base) in enumerate(REQS[ap]):
      rid = '%s-%02d' % (ap.split()[0].upper(), n + 1)
      ask = {s: whole(base.get(s, 0) * 1e6 * grow * rng.uniform(.97, 1.03)) for s in BOARD_LINES[ap]}
      fund = {s: whole(ask[s] * rng.choice([1, 1, 1, .9, .8, .75])) for s in BOARD_LINES[ap]}
      fr = [f for _, f in split]
      ap_, fp_ = {s: parts(ask[s], fr) for s in ask}, {s: parts(fund[s], fr) for s in fund}
      for i, (w, f) in enumerate(split):
        rows.append({'id': rid, 'title': t, 'ccar': ccar, 'contract': con, 'wbs': w or NONE,
                     'split': [x or NONE for x, _ in split] if len(split) > 1 else None,
                     'ask': {s: ap_[s][i] for s in ask}, 'fund': {s: fp_[s][i] for s in fund}})
    PLAN[ap][fy] = rows
    # the estimate: per paragraph per service line; none for a paragraph the ACE lacks (1.4) or for no paragraph
    est = {}
    for r in rows:
      if r['wbs'] != NONE and r['wbs'] not in NOT_IN_ACE:
        for s, v in r['ask'].items(): est.setdefault(r['wbs'], {})[canon(s)] = est.get(r['wbs'], {}).get(canon(s), 0) + v
    for (a, w), b in ACE_ONLY.items():
      if a == ap: est[w] = {s: v * 1e6 * grow for s, v in b.items()}
    ACE[ap][fy] = {w: {s: whole(v * rng.uniform(.92, 1.08)) for s, v in d.items() if v} for w, d in est.items()}

# The active year, as CCaR holds it: plan events with a WBS paragraph on each row (Brad: being added to CCaR), a month and
# obligated or not. EVENTS[appn] = [{title, ccar, contract, wbs, split, line (board name), month (0..11), amount, ob}]
EVENTS, ACE_ACTIVE = {}, {}
for ap in APPNS:
  ev = []
  for (t, ccar, con, split, base) in REQS[ap]:
    for (w, f) in split:
      for s, m in base.items():
        tot = m * 1e6 * f * .97
        for q in range(4):                                   # four plan events a year per service line
          mo = q * 3 + rng.randint(0, 2)
          ev.append({'title': t, 'ccar': ccar, 'contract': con, 'wbs': w or NONE,
                     'split': [x or NONE for x, _ in split] if len(split) > 1 else None, 'line': s, 'month': mo,
                     'amount': whole(tot / 4 * rng.uniform(.85, 1.15)), 'ob': month_date(mo) <= THROUGH})
  EVENTS[ap] = ev
EVENTS['O&M'][0]['month'], EVENTS['O&M'][0]['ob'] = 0, False      # slipped: dated October, not yet obligated
late = [e for e in EVENTS['O&M'] if e['month'] == 8][0]; late['ob'] = True    # obligated early: dated June, obligated
EVENTS['Full Fund'].append(dict(EVENTS['Full Fund'][0], month=16, ob=False, amount=1250000))   # procurement dated Feb 28
EVENTS['O&M'].append(dict(EVENTS['O&M'][1], line='Other', amount=420000))     # a budget name that names no Service
for ap in APPNS:
  est = {}
  for e in EVENTS[ap]:
    if e['wbs'] != NONE and e['wbs'] not in NOT_IN_ACE: d = est.setdefault(e['wbs'], {}); d[canon(e['line'])] = d.get(canon(e['line']), 0) + e['amount']
  for (a, w), b in ACE_ONLY.items():
    if a == ap: est[w] = {s: v * 1e6 for s, v in b.items()}
  ACE_ACTIVE[ap] = {w: {s: whole(v * rng.uniform(.95, 1.1)) for s, v in d.items() if v} for w, d in est.items()}
