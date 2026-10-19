# nvcmp.py <commit-NEXT-VERSION.diff> <NEXT-VERSION-U4.md draft> <LEDGER-and-UNRESOLVED.md draft> : the commit's added NEXT-VERSION lines
# against the track's fix-round drafts (the U4 entry; the Unresolved list's U4 line). Text only.
import sys, re
d=open(sys.argv[1],encoding='utf-8').read().split('\n')
added=[l[1:] for l in d if l.startswith('+') and not l.startswith('+++')]
removed=[l[1:] for l in d if l.startswith('-') and not l.startswith('---')]
dr=open(sys.argv[2],encoding='utf-8').read()
dr=re.sub(r'<!--.*?-->\n?','',dr,flags=re.S).rstrip('\n').split('\n')
led=open(sys.argv[3],encoding='utf-8').read().split('\n')
i=next(k for k,l in enumerate(led) if l.startswith('  - **U4: built as its own commit after U3**'))
j=i+1
while j<len(led) and led[j].startswith('    '): j+=1
uline=led[i:j]
print('added lines', len(added), '| removed', len(removed), removed)
print('draft U4 entry lines', len(dr), '| draft Unresolved U4 lines', len(uline))
exp=dr+uline
print('added == draft entry + draft Unresolved U4 line:', added==exp)
if added!=exp:
    import difflib
    for x in difflib.unified_diff(exp,added,'draft','commit',lineterm='',n=0): print(x)
old=[l for l in led if l.startswith('  - **U4:** the folder save')]
print('removed line == the draft ledger\'s old U4 line:', removed==old, old)
