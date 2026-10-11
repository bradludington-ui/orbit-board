  - **R4: a Save already waiting does not write past a mixed-import hold.** `_saveInPlaceFileRun` checked the hold
    once, before it waited for permission and for the board file's read. If a full import stopped part-way during that
    wait and could not be put back, it set the hold. The Save then built its bytes from the mix and wrote them over the
    board file. The outside probe showed `writes 1`, and the file held the imported Full Fund note `PARTIAL FF`. The
    Save now checks the hold again straight after the read, before it asks anything or builds its bytes. Nothing is
    opened or written, the board file keeps its bytes, and the message line says saving to the board file is refused
    and why. Checked in `audit-import.mjs` by "v2.00 (R4) — a save already waiting does not write past a mixed-import
    hold". It fails on 1c94537: the file is opened and written, and the board says it saved. A control with no import
    writes once. Mutations: `v200-r4-no-recheck`, `v200-r4-held-quietly` and `v200-r4-said-not-held`.
  - **R4b: a Save asked for during the hold is refused before the file is touched (Brad's contract, 11 Oct).** This
    is a test only. The board already refused such a Save at the start of `_saveInPlaceFileRun`. Because of R4's second
    check, removing that first check (`impmixed-file-unguarded`) no longer showed in the v1.95 hold block, which looked
    only at what was written. "v2.00 (R4b) — a Save asked for during the mixed-import hold is refused before the file is
    touched" counts permission requests, reads and opens. It expects `perm 0 · read 0 · open 0`, the request finished,
    and the board saying Save is refused. Then the hold is cleared while a read is held. Nothing is written, and the
    file keeps its bytes. A Save starts a turn after it is asked for, so the test waits until the Save has been decided
    before it clears the hold. It catches `impmixed-file-unguarded` on the before-file-access check
    (`perm 1 · read 1 · open 0`). It passes on 1c94537, because the check it guards was already there.
  - **Open, not changed (for Brad):**
    - Sometimes a Save is asked for while the hold is on and another save is still running. That Save is queued
      ("⏳ A save is already under way"), not refused at once. When its turn comes it is refused before any file
      access, but only if the hold still stands. If the person allows saving again first, the queued Save runs and
      writes. A scratch run showed this. Brad's wording ("refuse immediately") may want `saveInPlaceFile` to refuse it
      at once, as it does for a locked view.
    - Not examined: the folder save (`_driveStorePushRun`) also checks the hold only before its folder read.
