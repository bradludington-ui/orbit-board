# U13 late guard — independent adversarial check of one property

**Property (Brad, 12 Oct 2026, 7:0x AM ET):** "U13: the late guard is the essential protection. Its reviewer should verify
that earlier steps do not change copies, storage, base records or dirty flags before that guard."

**Board checked:** `after/prioritization-board-grid.html` blob `a88a1e5b932b94225a29cdcfec0678f828847ddd` (copied from
`rec/L3/u13/after/` at 07:06 ET), against `before/` `1375b72b6707faa57c50d528e01ce9611f194998`. Work done 07:05–07:5x ET,
Monday 12 Oct 2026 (times from `TZ=America/New_York date`). **Note:** at 07:32 ET the builder's `rec/L3/u13/after/` board
changed to `98eed7e8…` (a "fix round"): only the guard's own message (and a `const lbl=…` inside the guard block); the
statements before the guard are byte-identical. The after/ matrix was re-run on that revision too (section 5).

## Verdict: **holds with listed non-copy side effects**

With a save under way (`_saveBusy` = 1, measured in every cell), nothing that runs before the late guard — in
`driveStorePull` or in the four callers' own steps on the way to it — changed MS, S, DIRTY, `_baseDirty`, `_saveGen`,
`_driveBase`, the stored base record, the kept slot, any other browser-storage key, the folder's copy or its history, or
made an IndexedDB put/delete: **346 of 346** measured cells with a save under way on `a88a1e5b` were clean (byte-for-byte
snapshots, plus logs of every storage write, folder mutation, IndexedDB operation and call to the board's own writers).
The only exception measured is not on the path to the guard: a Connect with no folder name stored opens the folder picker
and never calls the pull (X3, below). What does change before the guard is listed in section 2.3; none of it is a copy, a
storage key holding the board, a base record or a dirty flag. The base-record write that the not-newer branch makes is
itself guarded (`if(!_saveBusy)`) in the same synchronous segment, and it is the only protected write before the guard.

Controls: with no save under way the after/ board behaves exactly as before/ in every cell (66/66, plus 39/39 with the
📡 panel open and 26/26 with Live view on). With a save under way, after/ and before/ differ in exactly the two guarded
places — the not-newer/no-base row (base record) and the adoption row — and nowhere else, in every timing mode. A mutant
that moves the late guard to the very top lets the adoption through (MS, S, `.kept`, `.base`, `prio27om`,
`_baseDirty`) whenever the save starts during the refresh's own wait (9 cells), and the save then lands recording the
board saved against its own copy while the screen shows the loaded one — U13's shape. **Not refuted.**

