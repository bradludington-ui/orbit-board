# summarize.py <outdir>: tables from the lateguard jsonl runs (text only).
import json, sys, os, re, glob
D = sys.argv[1]
def load(name):
    p = os.path.join(D, name + '.jsonl')
    if not os.path.exists(p): return None
    cells, meta = {}, {}
    for l in open(p, encoding='utf8'):
        o = json.loads(l)
        if 'IDS' in o or 'FIXTURE' in o or 'END' in o: meta.update(o); continue
        cells[(o['mode'], o['br'], o['call'])] = o
    return meta, cells
ABBR = [('status', 'S'), ('_statN', 'S'), ('diagN', 'S'), ('LIVEDB', 'L'), ('_drivePerm', 'P'), ('_drivePermProbed', 'P'),
        ('_driveNeed', 'D'), ('_driveLive', 'D'), ('_driveDir', 'H'), ('_autoBusy', 'A'), ('liveTimer', 'T'), ('_liveCfg', 'C'),
        ('saveState', 'V'), ('_saveBusy', 'B')]
def code(o, part='win'):
    if o is None: return '-'
    if 'err' in o: return 'ERR'
    w = o.get(part)
    if w is None: return 'n/a' if o.get('reachedWait') is False else '?'
    letters = set()
    for k in w['listed']:
        if k.startswith('folder:'): letters.add('K'); continue
        for a, b in ABBR:
            if k == a: letters.add(b)
    if w['lockWrites']: letters.add('K')
    if w['prompts']: letters.add('Q')
    if [x for x in w['idbAll'] if x.startswith('createDB')]: letters.add('I')
    if [x for x in w['fnCalls'] if x[0] in ('driveStorePush', 'saveSerial')]: letters.add('A')
    prot = sorted(w['prot'].keys())
    wr = sorted(set(x[0] for x in w['fnWriters']))
    lsw = sorted(set(x[1] for x in w['lsWrites']))
    fw = sorted(set(w['folderWrites']))
    idbw = [x for x in w['idbAll'] if re.match(r'(put|delete):', x)]
    base = ''.join(sorted(letters)) or '.'
    if prot or wr or lsw or fw or idbw:
        bits = []
        if prot: bits.append('chg:' + ','.join(p.replace('localStorage:', 'ls:') for p in prot))
        if wr: bits.append('calls:' + ','.join(wr))
        if lsw: bits.append('ls:' + ','.join(lsw))
        if fw: bits.append('folder:' + ','.join(fw))
        if idbw: bits.append('idb:' + ','.join(idbw))
        return 'WRITE[' + ' '.join(bits) + '] ' + base
    return 'ok ' + base
def ret(o):
    if o is None: return '-'
    r = o.get('ret'); return {True: 'T', False: 'F', '(undefined)': 'u', '(pending)': 'pend'}.get(r, str(r)[:12])
CALLS = ['p1', 'p0', 'cn', 'ac', 'tk', 'tkx']
def table(cells, mode, part='win', title=''):
    brs = sorted(set(b for (m, b, c) in cells if m == mode))
    if not brs: return ''
    out = [f'#### {title or mode}', '', '| branch | ' + ' | '.join(CALLS) + ' |', '|---|' + '---|' * len(CALLS)]
    for b in brs:
        row = []
        for c in CALLS:
            o = cells.get((mode, b, c))
            if o is None: row.append('—'); continue
            extra = ''
            if o.get('saveHeld') is False: extra = ' (save NOT held)'
            if part == 'win' and o.get('busyInWin') and o['busyInWin'] != [1, 1] and mode != 'N': extra += f" busy={o['busyInWin']}"
            row.append(f"{ret(o)} · {code(o, part)}{extra}")
        out.append(f'| {b} | ' + ' | '.join(row) + ' |')
    return '\n'.join(out) + '\n'
def norm(o, part='win'):
    if o is None: return None
    w = o.get(part) or {}
    st = re.sub(r'\d', '#', (o.get('statusAfter') or ''))
    st = re.sub(r'(just now|#+ min ago|#+ hr ago|#+ day\(s\) ago)', 'AGE', st)
    # a history copy's name carries its time; the header's "Saved h:mm" (saveState, V) moves with the clock's minute
    md = lambda x: re.sub(r'(ok|\]) ([A-Z.]*)', lambda m: m.group(1) + ' ' + (m.group(2).replace('V', '') or '.'), re.sub(r'\d{8}-\d{6}', 'YYYYMMDD-HHMMSS', x))
    return json.dumps({'ret': o.get('ret'), 'code': md(code(o, part)), 'prot': sorted(md(k) for k in w.get('prot', {}).keys()),
        'listed': sorted(k for k in w.get('listed', {}).keys() if k != 'saveState'), 'lsw': sorted(set(x[1] for x in w.get('lsWrites', []))),
        'fw': sorted(md(x) for x in w.get('folderWrites', [])), 'lock': sorted(w.get('lockWrites', [])), 'idb': w.get('idbAll', []),
        'fn': [x[0] for x in w.get('fnCalls', [])], 'status': st[:120],
        'land': {k: v for k, v in (o.get('landing') or {}).items() if k != 'status'},
        'landStatus': re.sub(r'(just now|#+ min ago|#+ hr ago)', 'AGE', re.sub(r'\d', '#', (o.get('landing') or {}).get('status', '')))[:90]}, sort_keys=True)
def compare(ca, cb, mode, part='win'):
    keys = sorted(set(k for k in ca if k[0] == mode) | set(k for k in cb if k[0] == mode))
    same, diffs = 0, []
    for k in keys:
        a, b = norm(ca.get(k), part), norm(cb.get(k), part)
        if a == b: same += 1
        else: diffs.append((k, a, b))
    return same, diffs

if __name__ == '__main__':
    runs = {}
    for f in sorted(glob.glob(os.path.join(D, '*.jsonl'))):
        n = os.path.basename(f)[:-6]; runs[n] = load(n)
    for n, (meta, cells) in runs.items():
        print(f'### {n}  board {meta.get("IDS", {}).get("board")}  {meta.get("IDS", {}).get("started")} -> {meta.get("END", {}).get("ended")}  cells {len(cells)}  notClean {meta.get("END", {}).get("notClean")}')
        errs = [k for k, o in cells.items() if 'err' in o]
        if errs: print('  ERRORS:', errs[:10])
        nh = [k for k, o in cells.items() if o.get('saveHeld') is False]
        if nh: print('  save not held:', nh)
        for mode in ['N', 'H1', 'H2', 'WR', 'WA']:
            t = table(cells, mode)
            if t: print(t)
            if mode in ('WR', 'WA'):
                t = table(cells, mode, 'preWait', mode + ' (the call before its wait, no save under way)')
                if t: print(t)
