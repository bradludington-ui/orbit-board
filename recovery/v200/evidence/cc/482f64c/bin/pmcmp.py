# pmcmp.py <trackOld> <trackNew> <commitOld> <commitNew> : compares the added and removed lines (difflib, as multisets, in order) of
# the track's copy-to-copy diff with the commit's parent-to-commit diff for one file. Prints EQUAL or the differences. Text only.
import sys, difflib
def pm(a, b):
    A = open(a, encoding='utf-8').read().split('\n'); B = open(b, encoding='utf-8').read().split('\n')
    plus, minus = [], []
    for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, A, B, autojunk=False).get_opcodes():
        if op in ('replace', 'delete'): minus += A[i1:i2]
        if op in ('replace', 'insert'): plus += B[j1:j2]
    return plus, minus
tp, tm = pm(sys.argv[1], sys.argv[2]); cp, cm = pm(sys.argv[3], sys.argv[4])
print(f'track +{len(tp)} -{len(tm)} | commit +{len(cp)} -{len(cm)} |', 'EQUAL (added and removed lines, in order)' if (tp, tm) == (cp, cm) else 'DIFFERENT')
if (tp, tm) != (cp, cm):
    for x in difflib.unified_diff(tp, cp, 'track+', 'commit+', lineterm=''): print(x)
    for x in difflib.unified_diff(tm, cm, 'track-', 'commit-', lineterm=''): print(x)
