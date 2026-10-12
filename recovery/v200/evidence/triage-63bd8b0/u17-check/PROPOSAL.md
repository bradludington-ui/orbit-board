# U17 check: proposal P3 (not applied, not run)

This comes from the U17 check in `CHECK.md` and `README.md` (this directory). It is a draft for Brad to decide on. It adds to the builder's `rec/L4/u17/PROPOSAL.md` (P1 and P2); it does not replace them.

- Nothing here was applied to `rec/L4/base`, to `/home/user/orbit-board` or to `/home/user/orbit-ui`.
- The diff was produced on a scratch copy, `prop/prioritization-board-grid.P3.html` (blob `82d39ead`), built by `prop/mkP3.py` (`68c29874`) from this directory's b63 board (`98eed7e8`). The script asserts the source blob before editing.
- The scratch copy was **never booted, tested or run**. No test or mutation was written.

## Why P1 is not enough

The builder's P1 refuses `adoptShared` while a save is under way (`if(_saveBusy)`). The check measured the same falsely clean record, and the same unasked overwrite, **with no save under way**. That happens whenever the board is clean when "load the shared one" is pressed. It was measured identically on 63bd8b0 and 1375b72b:

| run | how the board is clean at the click | after the load | next 💾 Save |
|---|---|---|---|
| XSHn (folder) | BRAD-2 saved and landed. The board is reopened, and the older shared state file offers "load the shared one (yours is kept aside first)". The link is clicked in the DOM. | [SHARED, recorded clean, base BRAD-2]; kept slot empty | writes SHARED over BRAD-2, asks nothing; BRAD-2 only in `-recent` history |
| XSHdL (folder) | the save of BRAD-2 landed before the load (`adoptShared()` is called directly, because the link is gone after the landing) | the same | the same |
| XFSHn (file) | as XSHn, with the board file as the save target | [SHARED, recorded clean, file BRAD-2]; kept slot empty | writes SHARED over BRAD-2 in the file and asks nothing. **BRAD-2 is then in no copy the board can reach** (an earlier file version only). |
| XFSHdL (file) | as XSHdL, file mode | the same | the same |

`adoptShared` calls only `applyStore` and `persist()`, which count nothing (b63 L8453-8461, L6509). `sharedKeepMine` keeps nothing aside when `baseGet().dirty` is false (L6902-6904). So the board stays recorded clean against the copy it came from. With `_saveBusy` 0, P1's guard does not apply. This is by code; P1 was not run.

## P3. Count the shared state file put on screen as a change (as U2 counts ↶ Put back)

**Exact diff** (`prop/proposal-P3.diff`, blob `7e0daad7`, against `98eed7e8`):

```diff
--- a/prioritization-board-grid.html
+++ b/prioritization-board-grid.html
@@ -8456,7 +8456,12 @@
   // A refused load leaves the board untouched, so there is nothing to persist and nothing to
   // report as loaded. Saying so beats a status line claiming a load that did not happen.
   if(applyStore(SHARED)===false) return;
-  persist(); render();
+  // PROPOSAL P3 (U17 via U24, rec/L4/u17-check): THE SHARED STATE FILE PUT ON SCREEN IS A CHANGE, counted as an edit is (as U2
+  // counts ↶ Put back). Uncounted, a board recorded clean stayed recorded clean against the copy it came from while showing
+  // the shared one, so 💾 Save wrote over that copy unasked with no save anywhere near (XSHn, XFSHn); and a save under
+  // way landed, found the count unmoved and marked the board saved (SHd, SHdk, FSHd).
+  _baseDirty=true; baseSet({dirty:true});
+  persist(); _saveGen++; DIRTY=true; render();
   setStat('Shared state loaded (published '+fmtTs(SHARED.ts)+').');
 }
 // ==============================================================================================================
```

**What it would change, by code (not run):**
- **XSHn, XSHdL, XFSHn, XFSHdL:** after the load the record is unsaved, and the header and the record now agree with the screen. The next 💾 Save still writes SHARED, as it writes any edit.
- **SHd, SHdk, XSHd, XSHe, FSHd, XFSHd:** the held save lands, finds `_saveGen` moved, and leaves the board unsaved. It says "A change made while it was saving is not in the folder yet" (or "not in the file yet"). This is the same as U2's put-back. P1 would then not be needed for the record, but it does no harm alongside P3.

### Risk

- **Live autosave.** With Live autosave on, the loaded copy would now be written to the folder automatically. This is the same risk as the builder's P2 option (a).
- **The "kept aside first" promise is still not kept for saved work.** In file mode, XFSHn's next Save still leaves BRAD-2 in no copy the board can reach. P3 makes the record honest; it does not keep BRAD-2. To keep the link's promise ("yours is kept aside first") for work that is already saved, `adoptShared` would also have to keep the screen copy aside when it is saved. That would use the one kept slot. **No code is drafted for this**; it is Brad's decision.
- **Not covered:**
  - `sharedArrived`'s automatic load (SHa, SHaC);
  - `bootTakeFile` (BT, BTC, FBT).
  P1 (for FBT) and the builder's P2 still apply to those.
- **The wording is unchanged and not reviewed.**

### Tests it would need

These would go in the `audit-import` U13 block, with the W1H folder and disk mocks. Expected values must be literal.

1. **No save near the load:** XSHn and XFSHn, with the link clicked in the DOM.
   - Right after the load, the literal tuple is [screen SHARED, `DIRTY` true, `baseGet().dirty` true, `_saveGen` moved].
   - K1 holds.
   - The next Save's tuple is literal, and the U17.V3 contract passes because the record is not falsely clean.
2. **Held save:** SHd, SHdk, XSHd, XSHe (folder), and FSHd, XFSHd (file).
   - The landing leaves the board unsaved, with the "not in the folder/file yet" words.
   - K1, K2 and K3 hold.
3. **Reopen after XSHn's load:** the record is still unsaved (K3).
4. **Unchanged:** SHdC, SHdkC and FSHdC keep their current tuples, since the board was already dirty there.
5. **Live autosave on:** a literal for what is written after "load the shared one".
6. **Mutations**, each of which must be caught:
   - drop `_saveGen++` (caught by test 2);
   - drop `_baseDirty=true; baseSet({dirty:true})` (caught by test 3);
   - drop `DIRTY=true` (caught by test 1).
7. **Sensitivity:** run the full audit-import alone, as for U13.
