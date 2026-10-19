# VERDICT on the U2 probe: sound, with issues

Checked Sunday 11 Oct 2026, 20:48–20:55 ET. How it was checked is in `verify/README.md`.

## What holds

**The runs reproduce exactly.** The builder's probe (363beee7) was rerun unchanged on the builder's four boards (4d273c06, 5e43f9e8, 4e303ff3, 5b7a863e).
- The unchanged `check.mjs` gives the same totals: BASE 16/2, U2a 20/2, U2b 24/0, U2ab 24/0.
- Every PASS/FAIL line and every `got` value matches the builder's log.
- A comparison of every recorded value, with timestamps rendered symbolically, finds 0 differences in all four outputs.

**The boards are what the builder says.**
- The blobs are right, and every find matched once: U2a's line occurs once and sits inside `keptPutBack` (L6977); U2b's `if(!k)` line occurs twice, so it is anchored on the function header.
- The recorded diffs regenerate byte for byte. U2a changes 1 line, U2b adds 1, and U2ab does both.
- The inserted text is exactly what the task gave.
- The base board is still the product's own board, 4d273c06 at commit 4a6f7c7.

**The expected values are hand-written literals**, apart from NR (see issue 2).

**The scenario is realistic.**
- K is kept aside through product paths: the clash refusal, then "Load theirs" (`driveResolve('theirs')`) in the folder, and the board file's own opening for the file.
- The saves are the product's own: `driveStorePush`, which is the Save button's folder path, and `saveInPlaceFile`.
- Each save is held after it records its change count (`gen`), at the write.
- The "↶ work kept aside" button in the header and the File-menu entry are never disabled while a save runs (L25842, L26172), so a person can reach this race. Working out of the folder autosaves every 30 s whenever there are unsaved changes, which makes it more likely.
- The shortcuts are harness wiring (`_liveCfg`, `_driveDir`, `FH`, `confirm`). None of them creates the effect.

**The controls are sensitive.** Each check below changed when a disposable mutant broke the thing it measures:

| control | mutant | effect |
|---|---|---|
| Kept copy unchanged | M1 (refusal also touches the kept slot) | only B1 and B2 failed |
| Screen unchanged | M2 (refusal moves `MS.ts` by 1 ms) | only B1 failed |
| No-race and retry | M3 (always refuse) | NR, B4, B5, B6 and ASK failed |
| Defect checks | BASE judged with U2a's output | D1, D2 and P2 failed |
| Refusal and reopen | BASE judged as U2b | B1 and B3 failed (in the verifier's guarded check) |

**The diagnosis of U2a holds.** When it lands, a save records the copy it wrote as the checkpoint, unconditionally:
- folder: `driveBaseSet(ap, wroteTs, …)`, so t0 becomes `s1Save`
- file: `LASTKNOWN=wrote`, so F1 becomes f2

That is why U2a's next Save does not ask. Mutant M5 (U2a, with the checkpoint recorded only when nothing moved) makes ASK pass in both the folder and the file.

**The no-race baseline holds.** With no save running, the put-back's promise is kept: 💾 Save is refused with the choice, and the autosave tick is refused (E2, E3). So the failures of U2a and BASE come from the race itself.

## What the extra runs add (they change no verdict, but the severity is understated)

**On BASE, K is lost in the same session.** When the board works out of the folder, live view is on (L26324). With no reopen, one live tick after the landing replaces K with S1: the pull sees DIRTY false and a record marked saved. K is then in no copy, and the status still reads "✅ Saved …". The README says K is lost "after a reopen". It is lost within one tick, 30 s by default.

**On U2a, the unasked overwrite happens by itself.** The same tick's autosave writes K over S1 with no confirm ("✓ Saved to the shared folder automatically"). S1 survives in the kept slot and the folder history; in the file case, only in the kept slot. So the ASK gap is not only about the next Save the person presses.

**U2b keeps K in both of those runs.**

## Issues

1. **Should fix: the harness runs the folder with live off.** It sets `connect()` with `on:false`, and `_driveLive` is never set. That hides the two manifestations above, so the README and the summary understate BASE ("after a reopen") and U2a ("the next Save").
2. **Minor: NR is not a hand-written literal.**
   - NR's expected value is BASE's own observed output, so on BASE the check compares the output with itself (2 of BASE's 16 passes).
   - The README's "expected values are literals written by hand" is therefore not true of NR.
   - The verifier's literal NRL check confirms the same values, so no result changes.
3. **Minor: U2ab does not match U2b in "every value".** The summary claims it does. Every check matches, but 9 recorded values differ: the internal `_saveGen` count, which U2ab's counter moves on the no-race and retry put-backs.
4. **Minor: `check.mjs` crashes instead of failing.** At L47 it throws a TypeError when the U2b retry did not run. A U2b board that lost its refusal would therefore crash the checker rather than report B4 as FAIL. That is loud, but it is not a per-check result.
5. **Minor: two things are not said plainly.**
   - On BASE and U2a the retry put-back was not run, because K was already on screen; only the Save was run.
   - `connect()` and `wire()` are state-level wiring.

## Not covered (stated, not claimed)

- Two tabs of one board in one browser. They share the `.base` record and the main storage key.
- Web Locks across tabs. By construction this does no harm: a save waiting for the lock has not yet recorded its change count.
- A real browser's modal confirm.
- Teams version history.
