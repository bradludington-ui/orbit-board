# Make a disposable mutant: read ONE entry's find/repl from mutate.mjs AS TEXT (never imported or executed),
# count the find in the board, and write the mutant only if it matches exactly once.
import json, re, sys
mut_src, board, mid, out = sys.argv[1:5]
t = open(mut_src, encoding='utf-8').read()
m = re.search(r'\{\s*id:\s*"' + re.escape(mid) + r'"', t)
if not m: sys.exit('no entry ' + mid)
end = t.find('\n  {', m.end())
seg = t[m.start(): end if end > 0 else len(t)]
lit = lambda k: json.loads(re.search(k + r':\s*("(?:[^"\\]|\\.)*")', seg).group(1))
find, repl = lit('find'), lit('repl')
b = open(board, encoding='utf-8').read()
n = b.count(find)
print(json.dumps({'id': mid, 'matches': n, 'find': find, 'repl': repl}, ensure_ascii=False))
if n != 1: sys.exit(2)
open(out, 'w', encoding='utf-8').write(b.replace(find, repl, 1))
