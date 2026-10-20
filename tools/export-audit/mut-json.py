# The mutation list as JSON, read from mutate.mjs as TEXT. Loading mutate.mjs starts the old sweep, so it is never
# imported or executed: recovery/v200/bin/mcread.py decodes the find and repl literals, and this adds the area, the
# description and whether the entry declares itself equivalent. Run with python -I.
#   python3 -I tools/export-audit/mut-json.py [mutate.mjs] > mutations.json
import sys, os, re, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', '..', 'recovery', 'v200', 'bin'))
import mcread
path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'mutate.mjs')
src = open(path, encoding='utf-8').read()
pairs = mcread.entries(src)
# the same segmentation mcread uses, for the fields it does not read
a = src.index('const MUTATIONS = ['); b = src.index('\n];', a); body = src[a:b]
starts = list(re.finditer(r'(?:^  |\},[ \t]+)\{ id: ([\'"])([^\'"]+)\1', body, re.M))
out = []
for k, m in enumerate(starts):
    seg = body[m.start(): starts[k+1].start() if k+1 < len(starts) else len(body)]
    # a comment saying "equivalent" is not a claim; only the entry's own field is
    code = '\n'.join(l for l in seg.split('\n') if not l.lstrip().startswith('//'))
    def field(key):
        f = re.search(r'\b' + key + r':\s*([\'"`])((?:\\.|(?!\1).)*)\1', code, re.S)
        return f.group(2) if f else ''
    fr = pairs.get(m.group(2))
    out.append({'id': m.group(2), 'area': field('area'), 'what': field('what'),
                'find': fr[0] if fr else None, 'repl': fr[1] if fr else None,
                'equivalent': bool(re.search(r'\bequivalent:\s*\S', code)), 'unreadable': fr is None})
json.dump(out, sys.stdout)
