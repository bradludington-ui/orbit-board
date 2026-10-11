# mkmut.py <mutate.mjs> <board.html> <id> <out.html>
# Disposable mutant: read ONE entry's find/repl from mutate.mjs AS TEXT ONLY (the same JS string-literal reader as
# mcount.py: '..', "..", `..`, String.raw`..`, named constants), count the find on the board, and write the mutant
# only when it matches exactly once. Exits non-zero (and writes nothing) otherwise. Nothing from mutate.mjs is run.
import json, re, sys, importlib.util, os
spec = importlib.util.spec_from_file_location('mc', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'mcread.py'))
mc = importlib.util.module_from_spec(spec); spec.loader.exec_module(mc)
mut_src, board, mid, out = sys.argv[1:5]
src = open(mut_src, encoding='utf-8').read()
ent = mc.entries(src).get(mid)
if ent is None: sys.exit('no entry ' + mid)
find, repl = ent
b = open(board, encoding='utf-8').read(); n = b.count(find)
print(json.dumps({'id': mid, 'matches': n, 'find': find, 'repl': repl}, ensure_ascii=False))
if n != 1: sys.exit(2)
open(out, 'w', encoding='utf-8').write(b.replace(find, repl, 1))
