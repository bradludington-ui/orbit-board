# reach.py <board.html> <root fn> [<root fn> ...]: a rough static call graph of the board's program (text only).
# Every top-level `function NAME(` / `async function NAME(` is split out by brace matching (strings, template literals,
# regex-free comments skipped). An edge NAME -> CALLEE is any `CALLEE(` in NAME's body outside string literals (onclick
# strings therefore do NOT count: they run on a click, not on render). From the roots, prints every reachable function
# whose own body writes: localStorage.setItem/removeItem/clear, lsSet(, lsAll(, persist(, baseSet(, driveBaseSet(,
# indexedDB, .put(, removeEntry(, createWritable(, driveWrite(, DIRTY=, _baseDirty=, _saveGen++, save(, applyStore(,
# keepAside(, with one shortest call path from the root. An over-approximation: a hit is a candidate to read, not proof.
import sys, re
src = open(sys.argv[1], encoding='utf8').read()
a = src.index('id="pubMode"'); a = src.index('<script>', a) + 8; b = src.rindex('</script>')
code = src[a:b]

def strip(s):
    # code kept; string/template text and comments blanked; template ${...} expressions kept (they run);
    # regex literals blanked (a / where an operand is expected starts one).
    out = []; i = 0; n = len(s); tstack = []   # brace depth inside each open template expression
    prev = ''                                   # last significant code character
    while i < n:
        c = s[i]
        if tstack and c == '}' and tstack[-1] == 0:
            tstack.pop(); out.append('}'); i += 1
            # back inside the template text
            j = i
            while j < n and s[j] != '`':
                if s[j] == '\\': j += 2; continue
                if s[j] == '$' and j + 1 < n and s[j+1] == '{': break
                j += 1
            out.append(' ' * (j - i)); i = j
            if i < n and s[i] == '`': out.append(' '); i += 1; prev = 'x'
            elif i < n: out.append('${'); i += 2; tstack.append(0); prev = '{'
            continue
        if c == '{' and tstack: tstack[-1] += 1
        if c == '}' and tstack: tstack[-1] -= 1
        if c == '/' and i + 1 < n and s[i+1] == '/':
            j = s.find('\n', i); j = n if j < 0 else j; out.append(' ' * (j - i)); i = j; continue
        if c == '/' and i + 1 < n and s[i+1] == '*':
            j = s.find('*/', i + 2); j = n if j < 0 else j + 2; out.append(' ' * (j - i)); i = j; continue
        if c == '/' and (prev == '' or prev in '(,=:[!&|?{};+-*%<>~^' or s[max(0,i-7):i].rstrip().endswith(('return','typeof'))):
            j = i + 1; cls = False
            while j < n and s[j] != '\n':
                if s[j] == '\\': j += 2; continue
                if s[j] == '[': cls = True
                elif s[j] == ']': cls = False
                elif s[j] == '/' and not cls: break
                j += 1
            j += 1
            while j < n and s[j].isalpha(): j += 1
            out.append(' ' * (j - i)); i = j; prev = 'x'; continue
        if c in '\'"':
            j = i + 1
            while j < n and s[j] != c and s[j] != '\n':
                if s[j] == '\\': j += 2; continue
                j += 1
            out.append(' ' * (j + 1 - i)); i = j + 1; prev = 'x'; continue
        if c == '`':
            j = i + 1
            while j < n and s[j] != '`':
                if s[j] == '\\': j += 2; continue
                if s[j] == '$' and j + 1 < n and s[j+1] == '{': break
                j += 1
            out.append(' ' * (j - i)); i = j
            if i < n and s[i] == '`': out.append(' '); i += 1; prev = 'x'
            elif i < n: out.append('${'); i += 2; tstack.append(0); prev = '{'
            continue
        out.append(c)
        if not c.isspace(): prev = c if not (c.isalnum() or c in '_$') else 'x'
        i += 1
    return ''.join(out)

S = strip(code)
fns = {}
for m in re.finditer(r'(?m)^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(', S):
    name = m.group(1); k = S.index('{', m.end()); depth = 0; e = k
    while e < len(S):
        if S[e] == '{': depth += 1
        elif S[e] == '}':
            depth -= 1
            if depth == 0: break
        e += 1
    fns.setdefault(name, S[k:e+1])
WRITE = re.compile(r'localStorage\.(setItem|removeItem|clear)|\blsSet\(|\blsAll\(|\bpersist\(|\bbaseSet\(|\bdriveBaseSet\(|indexedDB|\.put\(|removeEntry\(|createWritable\(|\bdriveWrite\(|\bDIRTY\s*=[^=]|\b_baseDirty\s*=[^=]|_saveGen\+\+|\bsave\(\)|\bapplyStore\(|\bkeepAside\(')
names = set(fns)
edges = {f: sorted(set(x for x in re.findall(r'\b([A-Za-z_$][\w$]*)\s*\(', body) if x in names and x != f)) for f, body in fns.items()}
for root in sys.argv[2:]:
    seen = {root: None}; q = [root]
    while q:
        f = q.pop(0)
        for g in edges.get(f, []):
            if g not in seen: seen[g] = f; q.append(g)
    hits = []
    for f in seen:
        body = fns.get(f, '')
        ws = sorted(set(m.group(0).strip() for m in WRITE.finditer(body)))
        if ws:
            p = []; x = f
            while x: p.append(x); x = seen[x]
            hits.append((len(p), f, ws, ' <- '.join(p)))
    print(f'== {root}: {len(seen)} functions reachable; {len(hits)} with a write-shaped statement')
    for _, f, ws, p in sorted(hits): print(f'  {f}: {ws}\n      path: {p}')
