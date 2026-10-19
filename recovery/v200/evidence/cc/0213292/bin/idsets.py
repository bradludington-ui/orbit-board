# idsets.py <mutA> <mutB> : the entry ids of two mutate texts (read AS TEXT by rec/bin/mcread.py, nothing run): counts, and the ids only in each.
import sys, importlib.util
spec = importlib.util.spec_from_file_location('mc', '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/bin/mcread.py')
mc = importlib.util.module_from_spec(spec); spec.loader.exec_module(mc)
a = mc.entries(open(sys.argv[1], encoding='utf-8').read()); b = mc.entries(open(sys.argv[2], encoding='utf-8').read())
print('A', len(a), 'B', len(b), 'only-A', len(set(a) - set(b)), 'only-B', len(set(b) - set(a)), 'same find/repl on common', sum(1 for k in set(a) & set(b) if a[k] == b[k]), 'of', len(set(a) & set(b)))
import collections
pre = collections.Counter(k.split('-')[0] + '-' + k.split('-')[1] if k.count('-') else k for k in set(b) - set(a))
print('only-B by prefix', dict(pre.most_common(20)))
print('only-A', sorted(set(a) - set(b))[:20])
