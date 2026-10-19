# body.py <a.diff> <b.diff> : compares the added and removed lines (in order) of two unified diffs, ignoring headers and hunk positions.
import sys
def body(p):
    out=[]
    for l in open(p,encoding='utf-8'):
        if l.startswith('+++') or l.startswith('---'): continue
        if l.startswith('+') or l.startswith('-'): out.append(l.rstrip('\n'))
    return out
a,b=body(sys.argv[1]),body(sys.argv[2])
print('SAME' if a==b else 'DIFFERENT', len(a), len(b), '+%d -%d'%(sum(x[0]=='+' for x in a),sum(x[0]=='-' for x in a)))
