# mkP3.py : TEXT ONLY. Builds prop/prioritization-board-grid.P3.html from the CHECKER's b63 copy (98eed7e8) with the P3 edit,
# then the diff is taken with diff -u. The result is never booted, run or copied anywhere else.
import hashlib, sys
C = '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17-check'
src = open(C + '/b63/prioritization-board-grid.html', encoding='utf-8').read()
blob = lambda b: hashlib.sha1(b'blob %d\0' % len(b) + b).hexdigest()
assert blob(src.encode('utf-8')) == '98eed7e801af20270f755eadffb2fa72355c30e5', 'not 98eed7e8'
old = ("  if(applyStore(SHARED)===false) return;\n"
       "  persist(); render();\n"
       "  setStat('Shared state loaded (published '+fmtTs(SHARED.ts)+').');\n")
new = ("  if(applyStore(SHARED)===false) return;\n"
       "  // PROPOSAL P3 (U17 via U24, rec/L4/u17-check): THE SHARED STATE FILE PUT ON SCREEN IS A CHANGE, counted as an edit is (as U2\n"
       "  // counts ↶ Put back). Uncounted, a board recorded clean stayed recorded clean against the copy it came from while showing\n"
       "  // the shared one, so 💾 Save wrote over that copy unasked with no save anywhere near (XSHn, XFSHn); and a save under\n"
       "  // way landed, found the count unmoved and marked the board saved (SHd, SHdk, FSHd).\n"
       "  _baseDirty=true; baseSet({dirty:true});\n"
       "  persist(); _saveGen++; DIRTY=true; render();\n"
       "  setStat('Shared state loaded (published '+fmtTs(SHARED.ts)+').');\n")
assert src.count(old) == 1, 'adoptShared block not found exactly once: %d' % src.count(old)
out = src.replace(old, new)
open(C + '/prop/prioritization-board-grid.P3.html', 'w', encoding='utf-8').write(out)
print('P3 copy written; blob', blob(out.encode('utf-8')))
