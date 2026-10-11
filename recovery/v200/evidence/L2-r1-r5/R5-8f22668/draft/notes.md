  - **R5: a restore during a save stays unsaved.**
    - **What was wrong.** ↶ Put this back (`driveRestore`) set the board unsaved (`DIRTY`), but it did not count as a
      change (`_saveGen`) and did not mark this browser's record unsaved (`_baseDirty`, `baseGet().dirty`). Suppose a
      folder save was still writing when an earlier copy was put back. When that save finished, it found the count
      unchanged and marked the board saved: `DIRTY`, `_baseDirty` and the stored record were all false, and the board
      said "✅ Saved". Yet the earlier copy was on screen and the folder held what the save had written. Nothing showed
      that a Save was still needed. After a reopen, the stored record decides whether a newer folder copy keeps the work
      aside first (`ownUnsaved`). It said saved, so the copy put back could be replaced unasked. That last step comes
      from reading the code; it was not run.
    - **The fix.** `driveRestore` now does what `save()` does for an edit, at the point where it adopts the copy:
      `_saveGen++`, then marks the record unsaved if it was not. The save that was writing now leaves the board unsaved,
      and its status adds "A change made while it was saving is not in the folder yet". The folder keeps what that save
      wrote, and the next Save writes the copy put back, with no clash. That is two lines and a comment, in one place.
    - **The test.** `audit-import.mjs`, "v2.00 (R5) — a restore during a save stays unsaved". Each case holds a folder
      save at the close of its write of the copy, then lets it land.
      - (a) WORKING is saved, and HISTORY is put back while it writes. HISTORY is on screen, the folder holds WORKING, and
        `DIRTY`, `_baseDirty` and the stored record all say unsaved. The board says the change is not in the folder yet.
        Then Save (a control): it writes HISTORY with no clash, ends saved, and WORKING is kept in the folder's history.
      - (b) The same with nothing new saved (⬆ Publish now, or Save again). The board was clean, so this browser's record
        said saved before the restore. Afterwards, all three say unsaved.
      - (c) A control: the same held save with nothing put back ends saved and says "✅ Saved".
      - On `9b27e80` four checks fail: the unsaved state and the "not in the folder yet" status, in (a) and (b). With the
        fix, all seven pass, in four runs. The races probe's R5 case fails on `9b27e80` and passes with the fix. Its
        control passes on both.
    - **Mutations.** Each is caught by the block:
      - `v200-r5-restore-gen` drops the `_saveGen++`. The (a) and (b) unsaved checks and the status checks fail.
      - `v200-r5-restore-basedirty` drops the record line. The (b) check fails: `_baseDirty` and the record are false.
      - `unsaved-flag-never-set` is re-anchored on its indent (`"\n  try{ if(!_baseDirty)…"`), because the R5 line
        repeats the line it targets. It still removes only `save()`'s line, and existing blocks still catch it, for
        example "v1.95 — Save acknowledges exactly what it wrote (the shared folder)".
      - Both new finds match the board once. Every other existing mutation still matches exactly once.
    - **Limit, not changed.** ↶ Put back of work kept aside (`keptPutBack`) has the same gap. It sets `DIRTY` and the
      record but does not count a change. In a scratch run on the patched board, kept work put back while a folder save
      was writing was then marked saved: `DIRTY`, `_baseDirty` and the record were false, and the folder held HISTORY,
      not the work put back. R5 covers ↶ Put this back only, so this is left for a decision. It is not covered by a check.
