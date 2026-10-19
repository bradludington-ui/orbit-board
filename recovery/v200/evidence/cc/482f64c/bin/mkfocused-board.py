# mkfocused-board.py <suite audit-board.mjs> <out> : a FOCUSED audit-board harness, VERBATIM from the suite: its preamble (every
# line before "const SCENARIOS = {"), the four PPBE CYCLES blocks (from "// ═══ PPBE CYCLES — THE LOCK IS THE WINDOW, FROZEN" to the
# line before "// v1.89, ITEM 22:"), and the scenario-ran guard with the summary. Nothing is edited.
import sys
src = open(sys.argv[1], encoding='utf-8').read(); out_p = sys.argv[2]
def once(t):
    assert src.count(t) == 1, (t, src.count(t)); return src.index(t)
pre = src[:once('\nconst SCENARIOS = {') + 1]
a = once('// ═══ PPBE CYCLES — THE LOCK IS THE WINDOW, FROZEN'); b = once('// v1.89, ITEM 22: A REQUIREMENT ADDED BY ITS TOTAL')
tail = src[once("{\n  const src = _selfRead(_selfPath(import.meta.url), 'utf8');"):]
out = '// FOCUSED HARNESS: audit-board preamble, the PPBE CYCLES blocks and the guard, VERBATIM from ' + sys.argv[1] + '\n' + pre + src[a:b] + tail
open(out_p, 'w', encoding='utf-8').write(out); print('written', out_p, len(out.split('\n')), 'lines')
