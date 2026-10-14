# Shared text-only reader for mutate.mjs: entries(src) -> {id: (find, repl)}. Decodes JS string literals itself
# ('..', "..", `..` without ${}, String.raw`..`) and named constants declared as  const NAME = <literal>  above the
# array. Never imports or executes mutate.mjs.
import re
ESC = {'n': '\n', 't': '\t', 'r': '\r', 'b': '\b', 'f': '\f', 'v': '\v', '0': '\0'}
def read_lit(s, i):
    raw = False
    if s.startswith('String.raw`', i): raw = True; i += len('String.raw')
    q = s[i]
    if q not in '\'"`': raise ValueError('not a literal')
    i += 1; out = []
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
            elif d == '\n': i += 2
            else: out.append(d); i += 2
            continue
        if q != '`' and c == '\n': raise ValueError('newline in string')
        out.append(c); i += 1
def value(src, seg, key):
    m = re.search(r'\b' + key + r':\s*', seg)
    if not m: raise ValueError('no ' + key)
    im = re.match(r'([A-Z_][A-Z0-9_]*)\s*[,}]', seg[m.end():])
    if im:
        dm = re.search(r'^const ' + im.group(1) + r' = ', src, re.M); return read_lit(src, dm.end())[0]
    return read_lit(seg, m.end())[0]
def entries(src):
    a = src.index('const MUTATIONS = ['); b = src.index('\n];', a); body = src[a:b]
    starts = list(re.finditer(r'(?:^  |\},[ \t]+)\{ id: ([\'"])([^\'"]+)\1', body, re.M))
    out = {}
    for k, m in enumerate(starts):
        seg = body[m.start(): starts[k+1].start() if k+1 < len(starts) else len(body)]
        try: out[m.group(2)] = (value(src, seg, 'find'), value(src, seg, 'repl'))
        except Exception as e: out[m.group(2)] = None
    return out
