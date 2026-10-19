# mkfocused-board-range.py <suite audit-board.mjs> <out> <start line> <end line> : bin/mkfocused-board.py with the block range given
# (only that changed): a FOCUSED audit-board harness, VERBATIM from the suite -- its preamble (every line before
# "const SCENARIOS = {"), the lines from <start line> to <end line> (each matched as a whole line, exactly once), and the
# scenario-ran guard with the summary. Nothing is edited. Text only.
import sys
src = open(sys.argv[1], encoding='utf-8').read(); out_p, st, en = sys.argv[2], sys.argv[3], sys.argv[4]
def once(t):
    assert src.count(t) == 1, (t, src.count(t)); return src.index(t)
pre = src[:once('\nconst SCENARIOS = {') + 1]
a = once('\n' + st + '\n') + 1; b = once('\n' + en + '\n') + 1 + len(en) + 1
tail = src[once("{\n  const src = _selfRead(_selfPath(import.meta.url), 'utf8');"):]
out = '// FOCUSED HARNESS: audit-board preamble, ' + st + ' .. ' + en + ' and the guard, VERBATIM from ' + sys.argv[1] + '\n' + pre + src[a:b] + tail
open(out_p, 'w', encoding='utf-8').write(out); print('written', out_p, len(out.split('\n')), 'lines')
