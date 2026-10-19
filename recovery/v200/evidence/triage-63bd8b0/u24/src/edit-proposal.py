# edit-proposal.py <PROPOSAL.md> : line count fix and the path-A alternative paragraph (text edit, anchors asserted once)
import sys
p = sys.argv[1]; t = open(p, encoding='utf-8').read()
def rep(old, new):
    global t
    assert t.count(old) == 1, ('anchor', t.count(old), old[:70]); t = t.replace(old, new)
rep("`proposal/P1.diff` (`8adfbcbd`), +27 lines", "`proposal/P1.diff` (`8adfbcbd`), +21 lines")
rep("**Risks.**\n- **The offer is lost once the save lands.**",
"""**Alternative for path A only (described, no diff): count and mark instead of refusing.**
- After `applyStore` in `adoptShared` and in `sharedArrived`'s automatic load, the board would do what `save()` does to the record:
  `_saveGen++; DIRTY=true; if(!_baseDirty){ _baseDirty=true; baseSet({dirty:true}); }`.
- A save landing afterwards would then stay unsaved: its `gen` has moved, and the record stays dirty across a reopen. That is
  consistent, and it would also close O4, the shared state file's loads leaving a clean record falsely clean with no save
  (README).
- It departs from Brad's U13 rule (refuse), so it is offered only as his choice.
- It does not fit `bootTakeFile` in file mode, whose load is meant to be clean against the file it opens.

**Risks.**
- **The offer is lost once the save lands.**""")
open(p, 'w', encoding='utf-8').write(t); print('ok')
