# mkcut.py <h-p1.mjs> <h-p2.mjs> <outdir> : text only. Finer verbatim cuts of the two parts (the method of fr8/bin/mksplit8.py and the tests
# lens's mklock.py: every line kept is verbatim, nothing added or edited), so that a mutant can be run on the one case or section that holds
# the check recorded failing for it. Each cut keeps its part's preamble, the block's helpers, its try/catch and the scenario-ran guard.
#  p1-cNN.mjs : h-p1.mjs with the CASES array holding ONE case (its entry's lines verbatim); the loop over CASES unchanged.
#  p2-sNN.mjs : h-p2.mjs with ONE braced section after the CASES loop (its comment lines and its "    {" ... "    }" lines verbatim).
# Writes cuts.json: each cut, its case label or section's first line, and line range in the part.
import sys, re, json
p1 = open(sys.argv[1], encoding='utf-8').read().split('\n'); p2 = open(sys.argv[2], encoding='utf-8').read().split('\n'); out = sys.argv[3]
idx = {}
# --- P1: cases
a = p1.index('    const CASES = ['); b = p1.index('    ];', a); assert p1.count('    const CASES = [') == 1
starts = [i for i in range(a + 1, b) if p1[i].startswith("      { c: '")]
assert starts and starts[0] == a + 1, 'first entry right after CASES'
for n, s in enumerate(starts):
    e = starts[n + 1] if n + 1 < len(starts) else b
    for i in range(s + 1, e): assert p1[i].startswith('        '), ('continuation line not deeper', i, p1[i][:60])
    c = re.match(r"      \{ c: '([^']*)'", p1[s]).group(1)
    nm = 'p1-c%02d.mjs' % n
    open(out + '/' + nm, 'w', encoding='utf-8').write('\n'.join(p1[:a + 1] + p1[s:e] + p1[b:]))
    idx[nm] = {'part': 'h-p1.mjs', 'case': c, 'lines': [s + 1, e]}
# --- P2: sections, from the first section comment to the line before "  } catch (e) {"
f = next(i for i, l in enumerate(p2) if l.startswith("    // THE FULL IMPORT'S WORDS, TRUE FOR EACH REQUIREMENT"))
z = next(i for i, l in enumerate(p2) if l.startswith("  } catch (e) {") and i > f)
closes = [i for i in range(f, z) if p2[i] == '    }']
assert closes and closes[-1] == z - 1, ('last section closes right before the catch', z, closes[-1:])
prev = f
for n, cl in enumerate(closes):
    sec = p2[prev:cl + 1]
    assert any(l == '    {' for l in sec), ('a section without its own brace', prev)
    for l in sec: assert l.startswith('    ') or l == '', ('a line outside the section indent', l[:60])
    nm = 'p2-s%02d.mjs' % n
    open(out + '/' + nm, 'w', encoding='utf-8').write('\n'.join(p2[:f] + sec + p2[z:]))
    idx[nm] = {'part': 'h-p2.mjs', 'first': sec[0][:100], 'lines': [prev + 1, cl + 1]}
    prev = cl + 1
# every line of the parts' case / section regions is in exactly one cut
assert sum(v['lines'][1] - v['lines'][0] + 1 for v in idx.values() if v['part'] == 'h-p1.mjs') == b - a - 1
assert sum(v['lines'][1] - v['lines'][0] + 1 for v in idx.values() if v['part'] == 'h-p2.mjs') == z - f
json.dump(idx, open(out + '/cuts.json', 'w'), ensure_ascii=False, indent=0)
print(len(starts), 'P1 cases;', len(closes), 'P2 sections; every case and section line in exactly one cut')
