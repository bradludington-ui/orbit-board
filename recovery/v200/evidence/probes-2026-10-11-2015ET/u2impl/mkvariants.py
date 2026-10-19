# mkvariants.py : builds U2's two commits' content on disposable copies, TEXT ONLY, failing unless every find matches once.
#   base/  = git archive of orbit-board HEAD (board 4d273c06, audit-import fc3117a0, mutate.mjs 8e7a362f)
#   c1/    = base + commit 1 (the counter: board line + block1 in audit-import + mutation text in a mutate.mjs TEXT copy)
#   c2/    = c1   + commit 2 (the refusal: board line + block2 + mutation text)
#   mut/   = mutant boards: m1 (v200-u2-putback-gen) on c1 and on c2; m2 (v200-u2-putback-while-saving) on c2
# mutate.mjs is never imported or run: the mutation entries are read here from mutations{1,2}.mjs.txt as JS string literals
# by the repo's own text-only reader (recovery/v200/bin/mcount.py's read_lit, copied below).
import os, shutil, sys, re
U = os.path.dirname(os.path.abspath(__file__))
def rd(p): return open(p, encoding='utf-8').read()
def wr(p, s):
    os.makedirs(os.path.dirname(p), exist_ok=True); open(p, 'w', encoding='utf-8').write(s)
def once(s, find, repl, what):
    n = s.count(find)
    print(f'{what}: find count {n}')
    if n != 1: sys.exit(f'FAIL {what}: find matched {n} times')
    return s.replace(find, repl)
ESC = {'n': '\n', 't': '\t', 'r': '\r', 'b': '\b', 'f': '\f', 'v': '\v', '0': '\0'}
def read_lit(s, i):
    q = s[i]; assert q in '\'"`'; i += 1; out = []
    while True:
        c = s[i]
        if c == q: return ''.join(out), i + 1
        if q == '`' and c == '$' and s[i+1] == '{': raise ValueError('interpolation')
        if c == '\\':
            d = s[i+1]
            if d in ESC: out.append(ESC[d]); i += 2
            elif d == 'u' and s[i+2] == '{': j = s.index('}', i); out.append(chr(int(s[i+3:j], 16))); i = j + 1
            elif d == 'u': out.append(chr(int(s[i+2:i+6], 16))); i += 6
            elif d == 'x': out.append(chr(int(s[i+2:i+4], 16))); i += 4
            else: out.append(d); i += 2
            continue
        if q != '`' and c == '\n': raise ValueError('newline in string')
        out.append(c); i += 1
def entry(txt):
    o = {}
    for k in ('id', 'find', 'repl'):
        m = re.search(r'\b' + k + r': ', txt); o[k] = read_lit(txt, m.end())[0]
    return o

base = os.path.join(U, 'base')
B0 = rd(os.path.join(base, 'prioritization-board-grid.html'))
A0 = rd(os.path.join(base, 'tools/export-audit/audit-import.mjs'))
M0 = rd(os.path.join(base, 'tools/export-audit/mutate.mjs'))
blk1, blk2 = rd(os.path.join(U, 'block1.mjs.txt')), rd(os.path.join(U, 'block2.mjs.txt'))
mt1, mt2 = rd(os.path.join(U, 'mutations1.mjs.txt')), rd(os.path.join(U, 'mutations2.mjs.txt'))

# ---- commit 1: the counter ----
C1_FIND = "  _keptMeta=swapped;\n  persist(); DIRTY=true; render();\n"
C1_REPL = ("  _keptMeta=swapped;\n"
           "  // v2.00 (U2): THE WORK PUT BACK IS A CHANGE, counted as an edit is. A save still writing when it was put back found the\n"
           "  // count unmoved and marked the board saved, while the folder or file holds what that save wrote. Now that save finds the\n"
           "  // count moved, leaves the work put back unsaved and says so, and the next Save writes it.\n"
           "  persist(); _saveGen++; DIRTY=true; render();\n")
B1 = once(B0, C1_FIND, C1_REPL, 'commit1 board (keptPutBack persist line)')
R5_END = "// ==== end v2.00 (R5) ====\n"
A1 = once(A0, R5_END, R5_END + blk1, 'commit1 audit-import (after the R5 block)')
R5_MUT_ANCHOR = "  // v2.00 (R3, Brad 11 Oct): a save that lands under a locked view says it saved the working plan.\n"
M1 = once(M0, R5_MUT_ANCHOR, mt1 + R5_MUT_ANCHOR, 'commit1 mutate.mjs TEXT (before the R3 message entries, after R5)')

# ---- commit 2: the refusal ----
C2_FIND = ("function keptPutBack(){\n  const k=keptCopy();\n"
           "  if(!k){ _keptMeta=null; setStat('Nothing is kept aside in this browser.'); render(); return; }\n")
C2_REPL = (C2_FIND +
           "  // v2.00 (U2): NOT WHILE A SAVE IS UNDER WAY. A save that lands records the copy it wrote as the one the work on screen\n"
           "  // came from, over the checkpoint the kept work brings back, so the next Save would write over that copy without asking.\n"
           "  // Nothing is changed: the kept work stays kept and what is on screen stays as it is, to be put back once the save is done.\n"
           "  // Said in the past tense: a quiet autosave says nothing when it lands, so this line can still be on screen after it.\n"
           "  if(_saveBusy){ setStat('⏳ <b>Not put back</b>: a save was under way. Nothing was changed: the kept work is still kept, and what is on screen is unchanged. Put it back once the save has finished (\\u21b6 work kept aside, in the top bar).'); render(); return; }\n")
B2 = once(B1, C2_FIND, C2_REPL, 'commit2 board (keptPutBack header)')
B1_END = "// ==== end v2.00 (U2) ====\n"
A2 = once(A1, B1_END, B1_END + blk2, 'commit2 audit-import (after block 1)')
M2 = once(M1, R5_MUT_ANCHOR, mt2 + R5_MUT_ANCHOR, 'commit2 mutate.mjs TEXT')

for d, b, a, m in (('c1', B1, A1, M1), ('c2', B2, A2, M2)):
    D = os.path.join(U, d)
    if os.path.exists(D): shutil.rmtree(D)
    shutil.copytree(base, D, symlinks=True)
    wr(os.path.join(D, 'prioritization-board-grid.html'), b)
    wr(os.path.join(D, 'tools/export-audit/audit-import.mjs'), a)
    os.remove(os.path.join(D, 'tools/export-audit/mutate.mjs'))          # never run; its text copy is kept beside, as .txt
    wr(os.path.join(U, 'out', d + '-mutate.mjs.txt'), m)

# ---- the mutants (text-only replacement, find must match once) ----
e1 = entry(mt1); e2 = entry(mt2)
print('mutation ids:', e1['id'], e2['id'])
for (mid, e, board, tag) in ((e1['id'], e1, B1, 'c1'), (e1['id'], e1, B2, 'c2'), (e2['id'], e2, B2, 'c2')):
    wr(os.path.join(U, 'mut', f'{mid}--on-{tag}.html'), once(board, e['find'], e['repl'], f'mutant {mid} on {tag}'))
# the mutation finds on the boards they are NOT for (context only)
for (mid, e) in ((e1['id'], e1), (e2['id'], e2)):
    print(f'context: {mid} find count base={B0.count(e["find"])} c1={B1.count(e["find"])} c2={B2.count(e["find"])}')
# a mutant must undo exactly its commit's own board change
# each mutant differs from the board before its commit only by that commit's comment lines (the statement itself is undone)
import difflib
def only_comments(mut, ref, n):
    d=[l for l in difflib.unified_diff(ref.split('\n'), mut.split('\n'), lineterm='', n=0) if l[:1] in '+-' and l[:3] not in ('+++','---')]
    return all(l.startswith('+  // v2.00 (U2)') or l.startswith('+  // ') for l in d) and len(d)==n, d
print('m1 on c1 vs base: only 3 added comment lines:', only_comments(rd(os.path.join(U, 'mut', e1['id'] + '--on-c1.html')), B0, 3)[0])
print('m2 on c2 vs c1:   only 4 added comment lines:', only_comments(rd(os.path.join(U, 'mut', e2['id'] + '--on-c2.html')), B1, 4)[0])
print('done')
