# heldcheck.py <jsonl...>: every non-N cell: the save held, _saveBusy 1 at the hold and at both ends of the window; W
# modes: no save under way when the call started; every save and pending call finished; no cell threw. WF/WS: the save
# landed before the window (busy 0 0).
import json, sys, os
T = 0
for f in sys.argv[1:]:
    n = 0; bad = []
    for l in open(f):
        o = json.loads(l)
        if 'mode' not in o: continue
        n += 1
        if 'err' in o: bad.append(('threw', o['mode'], o['br'], o['call']))
        m = o['mode']
        if m in ('H1', 'H2', 'WR', 'WA'):
            if o.get('saveHeld') is not True or o.get('busyAtHold') != 1 or o.get('busyInWin') != [1, 1]: bad.append(('held?', m, o['br'], o['call']))
            if m in ('WR', 'WA') and (o.get('busyBeforeWait') != 0 or o.get('reachedWait') is not True): bad.append(('W?', m, o['br'], o['call']))
        if m in ('WF', 'WS') and (o.get('busyInWin') != [0, 0] or o.get('saveDone') is not True): bad.append(('WF?', m, o['br'], o['call']))
        if o.get('saveDone') is False or o.get('lateDone') is False: bad.append(('unfinished', m, o['br'], o['call']))
    T += n
    print(f'{os.path.basename(f)[:-6]:14s} cells {n:3d} problems {len(bad)} {bad[:4]}')
print('total cells', T)
