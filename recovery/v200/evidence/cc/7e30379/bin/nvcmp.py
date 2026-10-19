# nvcmp.py <draft> <commit-diff> : the draft's piece (1) vs the lines the commit adds to NEXT-VERSION.md
import re, sys, difflib
src = open(sys.argv[1], encoding='utf-8').read()
heads = list(re.finditer(r'^\((\d+)\) [^\n]*\n', src, re.M))
p1 = src[heads[0].end():heads[1].start()].strip('\n').split('\n')
add = [l[1:] for l in open(sys.argv[2], encoding='utf-8').read().split('\n') if l.startswith('+') and not l.startswith('+++')]
rem = [l for l in open(sys.argv[2], encoding='utf-8').read().split('\n') if l.startswith('-') and not l.startswith('---')]
print('draft piece (1) lines', len(p1), '; commit added', len(add), '; removed', len(rem))
d = [l for l in difflib.unified_diff(p1, add, 'draft(1)', 'commit+', lineterm='', n=0)]
print('\n'.join(d) if d else 'IDENTICAL')
