# U24 proposals (NOT applied, NOT run): separate from U13, for Brad's decision

Written 12 Oct 2026, during the U24 probe (this directory). **Nothing here was applied to the base or to orbit-board.** Each
proposal is an exact diff against `63bd8b0:prioritization-board-grid.html` (board `98eed7e8`). Each comes with a patched copy,
made only so that the diff is exact; **no patched copy was booted or run.** `proposal/mkpatch.py` makes the copies; each anchor is
asserted to occur exactly once. The README gives the evidence each proposal answers.

| proposal | answers | diff (blob) | patched copy (blob) |
|---|---|---|---|
| **P1**: U24's paths refuse while a save is under way | U24, reproduced on `adoptShared` (folder and file), `sharedArrived` (folder) and `bootTakeFile` (file) | `proposal/P1.diff` (`8adfbcbd`), +21 lines | `bffdc809` |
| P2: `bootTakeFile` in folder mode leaves the board unsaved | Observation O1: the folder-mode control is falsely clean with no save | `proposal/P2.diff` (`4881b89e`) | `4dd1b42a` |
| P3: `importBoards` marks this browser's record | Observation O2: the import is counted in the session, but a reopen treats it as saved | `proposal/P3.diff` (`6b268336`) | `486edfaf` |
| P4: the in-place save names who wrote the bytes | Observation O3: "💾 Saved in place by **Carol**" when Brad's bytes were written | `proposal/P4.diff` (`cbb505cc`) | `fd7f916d` |

P2–P4 are outside U24. Brad asked that fixes be proposed separately and that U13 not be widened. They are listed so that they
are not lost, and none of them is needed for P1.

## P1: refuse, as U13 does, on the three paths (exact diff: `proposal/P1.diff`)

```diff
@@ -7026,6 +7026,12 @@ function bootTakeFile(){
   if(!(PUB && (PUB.years||Array.isArray(PUB.order)))) return;
   if(!confirm('Open the saved file’s version and replace what is on screen?\n\n'
     +'This browser’s own work is NOT kept — only in a copy you saved yourself.')) return;
+  // U24 (proposed): NOT WHILE A SAVE IS UNDER WAY (see adoptShared). Checked after the question, immediately before the load.
+  if(_saveBusy){
+    setStat('⏳ The saved file’s version was <b>not opened</b>: a save was under way, so nothing was replaced. '
+      +'Once it has finished, reopen the file to see what it holds.');
+    return;
+  }
   if(applyStore(PUB)===false) return;
   LASTKNOWN=PUB_FILE_TS; _baseDirty=false; baseSet({file:LASTKNOWN, dirty:false});
   persist(); DIRTY=false; render();
@@ -8452,6 +8458,14 @@ function sharedKeepMine(st){
 }
 function adoptShared(){
   if(!SHARED) return;
+  // U24 (proposed): NOT WHILE A SAVE IS UNDER WAY, as driveStorePull since U13. A save landing afterwards records the copy IT
+  // wrote as the one the work came from and marks the board saved, while the screen would show this one. Nothing is changed:
+  // what is on screen, the work kept aside and this browser's record stay as they were.
+  if(_saveBusy){
+    setStat('⏳ The shared state file was <b>not loaded</b>: a save was under way, so nothing was replaced. '
+      +'Once it has finished, reopen the board to be offered the shared state file again.');
+    return;
+  }
   if(!sharedKeepMine(SHARED)) return;
   // A refused load leaves the board untouched, so there is nothing to persist and nothing to
   // report as loaded. Saying so beats a status line claiming a load that did not happen.
@@ -31591,6 +31605,13 @@ function sharedArrived(st){
   // opened and somebody has typed, and a later time on it -- another clock -- said nothing about whether the work on screen
   // was in any saved copy. Work typed in this session: nothing is replaced. Work no saved copy has from before: kept
   // aside first, or nothing is loaded.
+  // U24 (proposed): AN ANSWER THAT ARRIVES WHILE A SAVE IS UNDER WAY replaces nothing (see adoptShared); it is offered instead.
+  if(_saveBusy){
+    setStat('⏳ The shared state file ('+esc(fmtTs(st.ts))+') arrived while a save was under way, so <b>nothing was replaced</b>. '
+      +'Once the save has finished: <button type="button" class="nb lnk" onclick="adoptShared()">load the shared one</button> '
+      +'(what you have is kept aside first).');
+    return;
+  }
   if(DIRTY){
     setStat('⚠ The shared state file ('+esc(fmtTs(st.ts))+') arrived after you started working, so <b>nothing was replaced</b>. '
       +'💾 Save yours, or <button type="button" class="nb lnk" onclick="adoptShared()">load the shared one</button> '
```

**Why refusal and not counting.** P1 follows Brad's U13 decision (6:00 AM ET): refuse adopting another copy while a save is under
way, re-checked immediately before adoption. For U13 the ledger records that counting the adoption (`_saveGen++`) alone does not
fix the record. The U24 paths have no wait between the check and the load: `bootTakeFile`'s question is a modal `confirm`, and
P1 checks after it. No save can start or land in between. `importBoards` needs no P1 change: it is counted (see the README).

**Alternative for path A only (described, no diff): count and mark instead of refusing.**
- After `applyStore` in `adoptShared` and in `sharedArrived`'s automatic load, the board would do what `save()` does to the record:
  `_saveGen++; DIRTY=true; if(!_baseDirty){ _baseDirty=true; baseSet({dirty:true}); }`.
- A save landing afterwards would then stay unsaved: its `gen` has moved, and the record stays dirty across a reopen. That is
  consistent, and it would also close O4, the shared state file's loads leaving a clean record falsely clean with no save
  (README).
- It departs from Brad's U13 rule (refuse), so it is offered only as his choice.
- It does not fit `bootTakeFile` in file mode, whose load is meant to be clean against the file it opens.

**Risks.**
- **The offer is lost once the save lands.** The status line is the only place `bootTakeFile` and `adoptShared` are offered, and a
  landing 💾 Save's "Saved" line replaces it (measured on the base: BT-file-C3, BT-fold-C3). The refusal's own line, with its
  link in the `sharedArrived` case, is replaced the same way. The person then has to reopen. The words say so. Nothing is lost
  meanwhile: `SHARED` stays in memory and in the shared state file, and `PUB` stays in the board file unless the save wrote over it.
- **A refusal during a quiet autosave can stay on screen after the autosave lands.** U26 has the same behaviour today.
- **A save waiting for another tab's lock is not counted** (U20), so P1 cannot see it, just as U13's guards cannot.
- **A new case for the shared state file.** It arriving during a file save's read (SHa-file-Wread) was adopted before the bytes
  were built and then written consistently. Under P1 it is refused and offered instead. The outcome is still consistent, but it
  is a behaviour change.
- **New words**: three status lines. P1 does not change any existing line.

**Tests P1 would need** (an `audit-import` block in the U13 style, plus mutations; full `audit-import` and `audit-board` in the
final-tree queue):
1. **Refusal.** Each W scenario here (SHc-fold-W, SHc-file-W, SHa-fold-W, BT-file-W, BT-fold-W) must come out refused. Measure
   the screen, the kept slot, the record (`baseGet()`, `LASTKNOWN`, `DIRTY`, `_baseDirty`, `_saveGen`) and storage before and
   after the refused action, and check they are byte-identical. Check the refusal's words. Then, once the save lands: K1/K2/K3 hold,
   and BRAD-2 and SHARED/CAROL-F are each in a reachable copy.
2. **Unchanged controls.** C1 and C2 of every path must give the observed values recorded here. SHa-fold-Wnow and SHa-file-W
   (DIRTY guard) must be unchanged. SHa-file-Wread changes to a refusal, which the test must state.
3. **Retry.** After the save lands, reopening re-offers the shared state file. `adoptShared` clicked with no save under way
   loads it (C1). `bootTakeFile` is offered again only by a reopen whose opening holds the file back.
4. **Mutations.** Removing each of the three guards must be caught, and so must changing `_saveBusy` to `0` in each.

## P2 (outside U24): `bootTakeFile` in folder mode leaves the board unsaved (exact diff: `proposal/P2.diff`)
```diff
   if(applyStore(PUB)===false) return;
-  LASTKNOWN=PUB_FILE_TS; _baseDirty=false; baseSet({file:LASTKNOWN, dirty:false});
-  persist(); DIRTY=false; render();
+  // (proposed, outside U24) WORKING OUT OF THE SHARED FOLDER, the file's version is not the folder's copy: it stays unsaved, so a
+  // reopen keeps it aside before a folder copy replaces it, and the header does not say Saved. The file's time is still recorded.
+  const fold=driveStoreOn();
+  LASTKNOWN=PUB_FILE_TS; _baseDirty=fold; baseSet({file:LASTKNOWN, dirty:fold});
+  persist(); DIRTY=fold; render();
```
- **Answers.** BT-fold-C1 (measured, no save). After "open the file's version" in folder mode, the board is recorded clean
  against the folder copy BRAD-1 while it shows CAROL-F, and it stays that way through a refresh and a reopen. The next folder
  Save would write CAROL-F over BRAD-1 without asking (BRAD-1 would go to history; by code, not run).
- **Risk.** The header then says "Unsaved changes" after a load. The folder save that follows writes the file's version over the
  folder copy without asking, because the folder record still matches. That is arguably what the person asked for, but it is a
  decision for Brad.
- **Tests.** BT-fold-C1 must be not falsely clean at K1/K2/K3. The file-mode BT-file-C1 must be unchanged.

## P3 (outside U24): `importBoards` marks this browser's record (exact diff: `proposal/P3.diff`)
```diff
-    if(applied){ persist(); render(); }
+    // (proposed, outside U24) THE BOARD ON SCREEN TOOK AN IMPORT, and this browser's record says so. It said nothing: a reopen in a
+    // new session took the imported board as saved, and a newer folder copy then replaced it with nothing kept aside.
+    if(applied){ try{ if(!_baseDirty){ _baseDirty=true; baseSet({dirty:true}); } }catch(e){} persist(); render(); }
```
- **Answers.** IB-fold-C1clean and IB-file-C1clean (measured, no save): a reopen is falsely clean. IB-fold-Wclean (measured):
  the folder copy restamped by a save lands newer than the import, so the reopen loads it and keeps nothing aside. IMPORT is then
  in no copy the board holds; only the person's own import file has it.
- **Risk.** The import is still counted in the session (`lsSet` → `fileMark`), so P3 changes only what a reopen does. The kept
  slot can then be 'occupied', and an opening refuses to load (the existing rule).
- **Tests.** The two clean controls and IB-fold-Wclean must hold at K3 and REACH, and the other IB scenarios must be unchanged.
  The `importBoards` all-or-nothing tests in `audit-import` must be unchanged.

## P4 (wording, outside U24): the in-place save names who wrote the bytes (exact diff: `proposal/P4.diff`)
```diff
-    const gen=_saveGen, wrote=fileTsOf({appns:PUBS});
+    const gen=_saveGen, wrote=fileTsOf({appns:PUBS}), byWrote=MS.by||whoAmI();   // (proposed) who these bytes say saved them
-    setStat('💾 Saved in place by <b>'+esc(MS.by||whoAmI())+'</b> — "'+esc(h.name||FNAME)+'" now carries this state. '+fmtTs(Date.now())
+    setStat('💾 Saved in place by <b>'+esc(byWrote)+'</b> — "'+esc(h.name||FNAME)+'" now carries this state. '+fmtTs(Date.now())
```
- **Answers.** O3, measured in SHc-file-W, BT-file-W and IB-file-W: "💾 Saved in place by **Carol**" when the file holds Brad's
  bytes. IB-file-W is counted correctly, so O3 occurs there even though that save is recorded correctly.
- **Risk:** none known. It changes one name in one line.
- **Tests.** The three file W scenarios must say "by Brad". A file save with nothing on screen changed must say the same as
  today.
