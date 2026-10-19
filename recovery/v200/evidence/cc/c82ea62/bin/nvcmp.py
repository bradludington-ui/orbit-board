# nvcmp.py <draft> <commit NEXT-VERSION diff> <k> : piece (k) of the draft (lines after its "(k) ..." header to the next header,
# blank edge lines stripped, placeholders U<n>.. filled as U51-U55) vs the added lines of the commit's diff, exactly.
import re, sys
src = open(sys.argv[1], encoding='utf-8').read(); d = open(sys.argv[2], encoding='utf-8').read().split('\n'); k = int(sys.argv[3])
heads = list(re.finditer(r'^\((\d+)\) [^\n]*\n', src, re.M))
m = heads[k-1]; end = heads[k].start()
p = src[m.end():end].strip('\n')
for a, b in (('U<n+5>', 'U55'), ('U<n+3>', 'U54'), ('U<n+2>', 'U53'), ('U<n+1>', 'U52'), ('U<n>', 'U51')): p = p.replace(a, b)
add = '\n'.join(l[1:] for l in d if l.startswith('+') and not l.startswith('+++'))
rem = [l for l in d if l.startswith('-') and not l.startswith('---')]
print('piece lines', len(p.split('\n')), '| added lines', len(add.split('\n')), '| removed', len(rem), '| equal', p == add, '| placeholders left', 'U<' in add)
if p != add:
    import difflib; print('\n'.join(difflib.unified_diff(p.split('\n'), add.split('\n'), 'draft', 'commit', lineterm='')))
