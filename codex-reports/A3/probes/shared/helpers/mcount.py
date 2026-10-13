# mcount.py <mutate.mjs> <board.html> [--list] [--ids id1,id2]
# Counts each MUTATIONS entry's find on a board, reading mutate.mjs AS TEXT ONLY: the find literal is decoded by a
# small JS string-literal reader here ('..', "..", `..`, String.raw`..`). Nothing from mutate.mjs is imported or run.
# A template holding ${ is reported UNPARSED, never guessed.
import json, re, sys
src = open(sys.argv[1], encoding='utf-8').read(); board = open(sys.argv[2], encoding='utf-8').read()
ESC = {'n': '\n', 't': '\t', 'r': '\r', 'b': '\b', 'f': '\f', 'v': '\v', '0': '\0'}
def read_lit(s, i):
    raw = False
    if s.startswith('String.raw`', i): raw = True; i += len('String.raw')
    q = s[i]; assert q in '\'"`'; i += 1; out = []
    while True:
        c = s[i]
        if c == q: return ''.join(out), i + 1
        if q == '`' and c == '$' and s[i+1] == '{': raise ValueError('interpolation')
        if c == '\\':
            if raw: out.append(s[i:i+2]); i += 2; continue
            d = s[i+1]
            if d in ESC: out.append(ESC[d]); i += 2
            elif d == 'u' and s[i+2] == '{': j = s.index('}', i); out.append(chr(int(s[i+3:j], 16))); i = j + 1
            elif d == 'u': out.append(chr(int(s[i+2:i+6], 16))); i += 6
            elif d == 'x': out.append(chr(int(s[i+2:i+4], 16))); i += 4
            elif d == '\n': i += 2                      # line continuation
            else: out.append(d); i += 2
            continue
        if q != '`' and c == '\n': raise ValueError('newline in string')
        out.append(c); i += 1
a = src.index('const MUTATIONS = ['); b = src.index('\n];', a)
body = src[a:b]
# an entry starts a line ("  { id: ...") or follows the previous entry's "}," on the same line (two entries do)
starts = [m for m in re.finditer(r'(?:^  |\},[ \t]+)\{ id: ([\'"])([^\'"]+)\1', body, re.M)]
want = None
if '--ids' in sys.argv: want = set(sys.argv[sys.argv.index('--ids') + 1].split(','))
res = {'entries': len(starts), 'once': 0, 'missing': [], 'multiple': [], 'unparsed': [], 'detail': {}}
for k, m in enumerate(starts):
    seg = body[m.start(): starts[k+1].start() if k+1 < len(starts) else len(body)]
    fm = re.search(r'\bfind:\s*', seg)
    mid = m.group(2)
    if not fm: res['unparsed'].append(mid); continue
    try:
        im = re.match(r'([A-Z_][A-Z0-9_]*)\s*,', seg[fm.end():])
        if im:                                   # a named constant declared above the array: read ITS literal, as text
            dm = re.search(r'^const ' + im.group(1) + r' = ', src, re.M); f, _ = read_lit(src, dm.end())
        else: f, _ = read_lit(seg, fm.end())
    except Exception as e: res['unparsed'].append(mid + ' (' + str(e) + ')'); continue
    n = board.count(f)
    if want is not None and mid in want: res['detail'][mid] = n
    if n == 1: res['once'] += 1
    elif n == 0: res['missing'].append(mid)
    else: res['multiple'].append([mid, n])
if want is None: del res['detail']
print(json.dumps(res, ensure_ascii=False))
