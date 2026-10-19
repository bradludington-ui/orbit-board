# mkmut.py <after board> <out M1> <out M2>: text-only variants of the U13 board.
# M1: the late guard MOVED to the very top of driveStorePull (right after `if(!driveStoreOn()) return false;`); the
#     not-newer branch's base guard is left where it is.
# M2: entry only: the same entry check, and the base guard removed too (`if(!base) driveBaseSet(mySlug(), theirs);`).
import sys
src=open(sys.argv[1],encoding='utf8').read()
guard_start="  if(_saveBusy){\n    if(!quiet) setStat('⏳ <b>Nothing was loaded</b> from the shared folder: a save was under way."
i=src.index(guard_start); assert src.count(guard_start)==1
j=src.index("    render(); return false;\n  }\n", i)+len("    render(); return false;\n  }\n")
block=src[i:j]; assert block.count('\n')==6, block
top="async function driveStorePull(quiet){\n  if(!driveStoreOn()) return false;\n"
assert src.count(top)==1
m1=src[:i]+src[j:]
m1=m1.replace(top, top+block, 1)
bg="    if(!base){ if(!_saveBusy) driveBaseSet(mySlug(), theirs); }\n"
assert m1.count(bg)==1
m2=m1.replace(bg, "    if(!base) driveBaseSet(mySlug(), theirs);\n", 1)
open(sys.argv[2],'w',encoding='utf8').write(m1); open(sys.argv[3],'w',encoding='utf8').write(m2)
print('moved block of', len(block), 'chars,', block.count('\n'), 'lines; M1 len', len(m1), 'M2 len', len(m2))
