  - **R3: a locked view is never written to the working folder.**
    - **What was wrong.** A folder save (💾 Save, the autosave, ⬆ Publish now) checked for a locked cycle on screen
      only before its first wait. Suppose a cycle was put on screen (👁 View) while the save was reading the folder's
      copy. The save then built its bytes from that locked plan and wrote them over the working plan's copy, keeping
      that copy in the history. The board said "✅ Saved", after a "🔒 Not kept" prefix, and the save reported success
      to its caller.
    - **The fix.** `_driveStorePushRun` checks `cycBlock` again once the copy is read, before the year check and before
      it builds anything. With a locked cycle on screen:
      - nothing is written: no copy, no history copy, no lock;
      - the folder stays byte-identical;
      - the save returns false, so the autosave and ⬆ Publish now do not count it as saved;
      - the board says writing to the shared folder is off while that cycle is on screen.
    - **The test.** `audit-import.mjs`, "v2.00 (R3) — a locked view is never written to the working folder". Each case
      holds a folder save at its read of the folder's copy, puts PB27 on screen, then lets the save go on.
      - (a) Save. Nothing reaches the folder, the save does not report success, and the board does not say saved.
        After leaving the view, the working plan is still unsaved, and the next Save writes it (a control).
      - (b) ⬆ Publish now. Nothing is written, and no publish is recorded.
      - (c) A control: the same held save with nothing put on screen writes the working plan and says saved.
      - On `9b27e80` four checks fail; with the fix all eight pass. The races probe's R3 case fails on `9b27e80` and
        passes with the fix, and its control passes on both.
    - **Mutations.** Each is caught by the block, on the checks named:
      - `v200-r3-cycblock-gone` removes the check: the no-write, return and status checks fail.
      - `v200-r3-cycblock-falls-through` says the refusal but goes on writing: the same checks fail.
      - `v200-r3-cycblock-says-saved` refuses but returns true: the return check and ⬆ Publish now's "no publish
        recorded" check fail.
      - Each new find matches the board once, and every existing mutation still matches exactly once.
    - **Limit, not changed.** A cycle put on screen after the bytes are built (while the history copy, the copy itself or
      the lock is being written) is not checked again. The folder still gets the working plan, which is correct, but the
      board then says "🔒 Not kept — … ✅ Saved …". After leaving the view, the board shows unsaved until the next Save.
      This was seen in a scratch run and is not covered by a check.
