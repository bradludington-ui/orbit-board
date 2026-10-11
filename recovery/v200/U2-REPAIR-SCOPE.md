# U2 (keptPutBack) repair scope, and the separate folder-pull generation defect (U13) (11 Oct 2026, written 7:30–7:37 PM ET)

Brad, 7:17 PM ET: "Provide the proposed U2 repair scope. Identify which ledger entry covers the separate folder-pull generation
defect; R5's history-restore fix does not establish coverage for that path."

Line numbers are for the current head product, `4a6f7c7` (board `4d273c06…`), and were read from the code. Nothing here has
been built or run, except the reviewer's earlier scratch run for U2, which is cited.

## U2: work put back while a save is writing ends marked saved

**The finding.**
1. A folder save (`_driveStorePushRun`) or a file save (`_saveInPlaceFileRun`) builds its bytes and notes `gen=_saveGen`
   (L26815 / L8380).
2. While it writes, ↶ Put back (`keptPutBack`, L6945–6981) replaces the screen with the kept work.
3. When the write lands, the save finds `_saveGen===gen` (L26843 / L8387) and marks the board clean. It sets
   `DIRTY=false`, and the record becomes `dirty:false` through `driveBaseSet(…, true)` or `baseSet({dirty:false})`.

The folder or file holds the bytes the save wrote, not the work put back. After a reopen, nothing is unsaved, so the work put
back is in no copy at all. Reviewer's scratch run on the R5 draft board:
`scratchpad/rec/L2/draft/R5-verify/logs/scratch-kept2-patched.log`. It showed "✅ Saved O&M FY27 to the shared folder", and
`DIRTY`, `_baseDirty` and the record all false.

**Correction to my 6:20 PM proposal ("R5's two lines in keptPutBack").** `keptPutBack` already sets the record dirty (L6974:
`_baseDirty=true; baseSet({file:LASTKNOWN, folder:b.folder||{}, dirty:true});`) and `DIRTY=true` (L6977). The only missing
piece is the change count. The required change is therefore one statement, not two lines.

### Proposed scope

**U2-a, required: it closes the loss.** Count the put-back as a change.

```diff
-  persist(); DIRTY=true; render();
+  persist(); _saveGen++; DIRTY=true; render();   // v2.00 (U2): a save still writing finds the count moved and leaves this unsaved
```

- **Effect:** a save still writing when the work is put back leaves the board unsaved. Its status adds the existing "A change
  made while it was saving is not in the folder/file yet". The record stays dirty, the next Save writes the work put back,
  and a reopen keeps it aside, never replaced. The same in-flight check serves both the file and the folder save.
- **Test:** an audit-import block, in R5's style, with the folder save held at its write by the existing `disk()` /
  `f.hold` mechanism.
  - (i) **Folder save:** unsaved work K is kept aside (by a restore or a newer copy). A save is held at its write, K is
    put back, and the save is released. Expect: `DIRTY` true, `_baseDirty` true, the record dirty, and the status with
    "not in the folder yet". After a reopen, K is unsaved and kept aside, not replaced by the folder's copy.
  - (ii) **The same for the file save.**
  - (iii) **CONTROL:** a put-back with no save running behaves exactly as today.
- **Mutation:** `v200-u2-putback-gen` removes the `_saveGen++`. Its find must match once; the line is unique.

**U2-b: a further gap found while reading. Not run; for Brad's decision.**
- **The gap:** the landing save also writes its own copy over the checkpoint the put-back restored.
  - The put-back sets `LASTKNOWN=+b.file` and `_driveBase=b.folder` (L6972–6974).
  - The folder save then records `driveBaseSet(ap, wroteTs, clean, fy)` (L26844), and the file save `LASTKNOWN=wrote`
    (L8386). Both happen whatever `clean` is.
- **Consequence (read from the code):** the put-back message promises "💾 Save will ask before it writes over <the shared
  folder / the saved file>, which <who> saved after it". In this race, the next Save would write K over that copy without
  asking.
  - The copy written over is the landing save's own bytes, the work that was on screen. When that work was unsaved, the
    put-back kept it aside (the swap), and the folder keeps it in history. A file keeps no history.
- **Options:**
  1. **Refuse ↶ Put back while a save is running** (`if(_saveBusy){ setStat('⏳ A save is under way — put the kept work back
     once it finishes; nothing was changed.'); return; }`). One line. It removes the whole race for this path, and U2-a
     stays as insurance. The mutation would be `v200-u2-putback-while-saving`.
  2. A "checkpoint generation" counter. `keptPutBack` would bump it, both saves would capture it, and a landing save
     would not move LASTKNOWN or `_driveBase` when it has moved. About six lines in three functions.
  3. Accept it, and change the put-back message so it does not promise to ask in this case.
- **Recommendation:** U2-a plus option 1. They are the smallest pair that leaves no state the message misdescribes.

**Retests if U2 lands:**
- the full audit-import, alone, at 900 s + 20 s (about 9 min);
- the races probe;
- each new mutation through the full audit-import (about 9 min each);
- re-checking that `unsaved-flag-never-set` and the R5 mutations still apply exactly once. The new line does not contain
  their find text; confirm with `mcount.py`.

## The folder-pull generation defect: which ledger entry covers it

**Answer:** only **U11**, and only generically. U11 lists "`driveStorePull` load-theirs" among the neighbouring writer and
restore risks tracked since the morning. It has no mechanism, no evidence, and has not been examined since the reset. No
entry states the generation defect. R5 changed `driveRestore` only (L27070–27071), so it establishes nothing for this path.
The defect is now its own entry, **U13**, and U11 points to it.

**The defect (read from the code, not reproduced):**
- **The adoption path:** `driveStorePull` (L26666) adopts a newer folder copy with
  `applyStore(j.store); driveBaseSet(mySlug(), theirs, true); persist(); render();` (L26744–26746). The template has the
  same shape at L26737–26739.
- **What it lacks:** it moves no `_saveGen`.
- **Not serialized with saves:** the refresh tick (`drivePoll`, L26577) and the two connect paths (L12768, L12797) call it,
  and it does not check `_saveBusy`. Its guards are `DIRTY` (L26703) and `ownUnsaved`.
- **The window:** a folder save running while `DIRTY` is already false. Examples: Save pressed with nothing unsaved, a
  queued save running after the previous one marked the board clean, or Take the pen's save. At the same time, a copy
  someone else saved arrives during that write.
- **What happens:**
  1. The refresh adopts their copy mid-write.
  2. The save lands and finds the count unmoved.
  3. It records `driveBaseSet(ap, wroteTs, true)` and leaves `DIRTY` false.
  4. The screen shows their copy, recorded as saved, with the copy this save wrote as its base. The folder holds what this
     save wrote, over their copy.
  5. Their copy is not in the folder's history: the save kept the copy it read before theirs arrived.
- **Effect:** the board reads "saved" while the folder holds different content.
- **Related:** the write over their copy is the folder save's window (U4 and U11).

**Not affected:** `_driveResolveRun`'s "load theirs" (L26921–26923, `persist(); DIRTY=false;`) runs inside `saveSerial`. No
save can be writing while it runs.

**Proposed scope (for a later decision; nothing built):**
- **The fix:** leave a newer copy for the next refresh while a save is under way. Add
  `if(_saveBusy) return false;` to `driveStorePull` before it adopts anything.
  - Counting the adoption with `_saveGen++` instead would leave the landing save writing `wroteTs` over the adopted copy's
    base. A later Save would then write over the folder without asking.
- **Test:** an audit-import block. A folder save is held at its write while a newer folder copy appears and the refresh
  runs. Expect: nothing is adopted during the write. After the save lands, the next refresh treats their copy as it does
  today, saying the clash. Control: with no save running, the refresh adopts exactly as today.
- **Mutation:** `v200-u13-pull-while-saving`.
- **Retests:** the same as U2.
- **First step:** reproduce it with a bounded synthetic probe before any fix, as was done for U1, U9 and U10.
