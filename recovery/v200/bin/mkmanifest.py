# mkmanifest.py <mutate.mjs> <board.html> [affected-ids-file] : the exact v2.00 mutation-ID manifest, read from mutate.mjs AS
# TEXT (mcread.py; mutate.mjs is never imported or run). One TSV row per id: id, group, suite that runs it, category, and
# whether its find matches the board exactly once. Categories: new (U13, U1, U14, UI chunk 3), affected (listed in the
# optional file: protections whose code path or catching checks the new commits touch), reimpl (the rest of R1-R5, R4b, U2),
# held (the 135 pre-reset v2.00 hardening mutations: HELD by Brad, 12 Oct; not run).
import importlib.util, re, sys, os
here = os.path.dirname(os.path.abspath(__file__))
s = importlib.util.spec_from_file_location('mc', os.path.join(here, 'mcread.py')); m = importlib.util.module_from_spec(s); s.loader.exec_module(m)
E = m.entries(open(sys.argv[1], encoding='utf-8').read()); board = open(sys.argv[2], encoding='utf-8').read()
aff = set(open(sys.argv[3]).read().split()) if len(sys.argv) > 3 else set()
LEGACY = {'unsaved-flag-never-set': ('R5 (re-anchored)', 'audit-import'), 'impmixed-file-unguarded': ('R4b', 'audit-import')}
SUITE = {'r1': 'audit-recon', 'r2': 'audit-board', 'r3': 'audit-import', 'r4': 'audit-import', 'r5': 'audit-import',
         'u2': 'audit-import', 'u13': 'audit-import', 'u1': 'audit-recon', 'u14': 'audit-recon', 'ui3': 'audit-ui'}
NEW = {'u13', 'u1', 'u14', 'ui3'}
rows = []
for k, (find, repl) in E.items():
    if k in LEGACY: g, suite = LEGACY[k]; key = None
    elif k.startswith('v200-'):
        mm = re.match(r'v200-(r\d+|u\d+|ui3)-', k)
        if not mm: rows.append((k, 'pre-reset v2.00', 'first-catch chain', 'held', board.count(find) == 1)); continue
        key = mm.group(1); g = key.upper(); suite = SUITE.get(key, '?')
    else: continue
    cat = 'new' if key in NEW else ('affected' if k in aff else 'reimpl')
    rows.append((k, g, suite, cat, board.count(find) == 1))
print('id\tgroup\tsuite\tcategory\tapplies_once')
for r in rows: print('\t'.join([r[0], r[1], r[2], r[3], 'yes' if r[4] else 'NO']))
