# addrm.py <a_old> <a_new> <b_old> <b_new> : the multiset of added and removed lines of diff(a_old,a_new) vs diff(b_old,b_new), by difflib; text only.
import sys, difflib, collections
def ar(o, n):
    o = open(o, encoding='utf-8').read().split('\n'); n = open(n, encoding='utf-8').read().split('\n')
    a = collections.Counter(); r = collections.Counter()
    for l in difflib.unified_diff(o, n, lineterm='', n=0):
        if l.startswith('+++') or l.startswith('---') or l.startswith('@@'): continue
        if l.startswith('+'): a[l[1:]] += 1
        elif l.startswith('-'): r[l[1:]] += 1
    return a, r
a1, r1 = ar(sys.argv[1], sys.argv[2]); a2, r2 = ar(sys.argv[3], sys.argv[4])
print('track: +%d -%d | commit: +%d -%d | added equal: %s | removed equal: %s' % (sum(a1.values()), sum(r1.values()), sum(a2.values()), sum(r2.values()), a1 == a2, r1 == r2))
if a1 != a2: print('added only in track:', list((a1 - a2).items())[:5], 'only in commit:', list((a2 - a1).items())[:5])
if r1 != r2: print('removed only in track:', list((r1 - r2).items())[:5], 'only in commit:', list((r2 - r1).items())[:5])
