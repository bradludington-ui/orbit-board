# VERDICT on U2 as two commits (counter, then busy-save refusal): sound, with issues

Checked Sunday 11 Oct 2026, 9:49–10:15 PM ET, by an adversarial verifier. Everything below ran on disposable copies.

- `/home/user/orbit-board` was only read. HEAD was `17701c2` at the start and at the end, and `git status` was clean both
  times. `/home/user/orbit-ui` was not touched, and neither was `u1fix/`.
- No full suite, gate, standards, verify:grid or `npm run mutate` was run. `mutate.mjs` was never imported or run; mutation
  finds were counted as text.
- Every run was a bounded focused harness: `setsid -w timeout -k 10 600`, one at a time. Each run's PIDs are in
  `verify/pids.txt` (none still alive), and its exit code and wall time are in `verify/logs/runs.txt`. None timed out.
- The builder's files were not modified: their blobs are unchanged, and nothing outside `verify/` is newer than the README.

## What holds

**The drafts are what the builder says, and they apply once.**
- On a fresh copy of the base files, `git apply` of the six diffs applies cleanly, in order.
  - After commit 1: board `c08c6d2c`, audit-import `e63768bf`, mutate `2ba0f131`.
  - After commit 2: board `8a0d23b6`, audit-import **`72a7fda3`** (see issue 1), mutate `dafca9cf`.
- Counted in the text:
  - the counter line occurs 0 / 1 / 1 times on base / c1 / c2;
  - the refusal line occurs 0 / 0 / 1 times;
  - `block1.mjs.txt` and `block2.mjs.txt` each occur exactly once in c2's audit-import.
- The product and tool blobs are the same at `3df5fcd` and `17701c2`.

**The commits match what the earlier review already accepted.** Apart from comment lines, c1 is identical to the
`u2variants` board U2a (`5e43f9e8`), and c2 to U2ab (`5b7a863e`). This was checked here with `diff`.

**The mutation entries are sound** (`verify/logs/mcount-verify.log`, the repo's own `mcount.py` `852f06ec`, text only).
- Every entry finds its text exactly once on its board: 1305/1305 on base, 1306/1306 on c1, 1307/1307 on c2. That
  includes `putback-drops-screen`, `unsaved-flag-never-set` and both R5 entries.
- `v200-u2-putback-while-saving` finds nothing on c1, as it should.
- Each mutant board differs from the board before its commit only by that commit's three comment lines.

**The blocks follow house style.**
- `==== v2.00 (U2) … ====` start and end markers. Block 2's end marker follows the R3 "message" precedent. No end
  marker is duplicated.
- A two-space `  const name = '…'` line. The guard's regex is `/^  const name = '([^']+)'/gm`, and the harness
  reads itself, so the guard sees both names.
- `bootMark` / `try` / `failures.push` on a throw / `bootRelease(__bm, keepBoards())` / `settleBoards()`, the same
  shape as R5.

**The focused harnesses are verbatim.**
- `mkfocused-u2.py`, rerun here on the drafted audit-imports, regenerates all three harnesses byte for byte
  (`e98846d5`, `b87c616b`, `7320033f`).
- Every harness line after the 2-line header appears, in order, in c2's audit-import.

**Every builder run reproduces exactly.**
- All 13 non-superseded runs were rerun unchanged: the builder's `runner.mjs` (`f720ce18`) and harnesses, with only the
  record locations moved to `verify/`.
- Every verdict and every recorded value in `out/*.checks.jsonl` is **byte-identical** to the builder's.

| run | board | result (identical to builder) |
|---|---|---|
| B1-on-base / B1-on-c1 / B1-on-c2 | 4d273c06 / c08c6d2c / 8a0d23b6 | 9/16 fail / 16 pass / 16 pass |
| B2-on-base / B2-on-c1 / B2-on-c2 | same | 27/29 fail / 25/29 fail / 29 pass |
| M1c1-B1, M1c2-B1, M1c2-B2 | 0d587506, 01349332, 01349332 | 9/16 fail, 1/16 fail (d), 29 pass |
| M2c2-B2, M2c2-B1 | e766fc38 | 25/29 fail, 16 pass |
| BOTH-on-c2, BOTH-on-c2-repeat | 8a0d23b6 | 45/45 pass, twice |

**The fail-before / pass-after pattern is right.** Block 1 fails on base and passes on c1 and c2. Block 2 fails on base
and on c1, and passes on c2.

**Each mutant behaves exactly like the board it reverts to.**
- M1c1-B1's output is byte-identical to B1-on-base's.
- M2c2-B1 is identical to B1-on-c1, and M2c2-B2 to B2-on-c1.
- M1c2-B2 is identical to B2-on-c2.
- M1c2-B1 differs from B1-on-c2 in row 15 only.

**The counter-only sensitivity evidence is genuine.**
- The commit-1 mutant `0d587506` is base plus three comment lines.
- Block 1 catches it with the same 8 race checks as base: rows 3, 4, 6, 7, 8, 11, 12 and 13. They are product-path
  checks: the landing marked saved, K replaced by the refresh, and K lost on reopen.
- At commit 2 the counter has no effect a person can see in a single tab, so only (d), a labelled state read, can pin it.
  I confirmed this from the code: both change-count snapshots, `gen=_saveGen` at L8380 and L26815, are taken inside a
  `saveSerial` function, after `_saveBusy++`. Every caller of `_saveInPlaceFileRun` and `_driveStorePushRun` is
  serialized, including L26896 and L26905 inside `_driveResolveRun`. So the refusal covers the whole window.
- The c1 runs (B1-on-c1, M1c1-B1) are the only product-level evidence for the counter. They should be kept in the
  record, because the committed suite at commit 2 cannot reproduce them.

**Every expectation is a hand-written literal.**
- Block 1 picks one of two hand-written literals, `MADE` or `REFUSED`, by what is on screen at the landing. The builder
  declared this. Neither literal accepts "put back and marked saved".
- The byte-identity checks compare an observed value before and after, against the literal `true`.

**The checks measure the product, not the test setup.**
- K is kept aside through product paths: the clash, then Load theirs; and the file's opening.
- The saves are the product's own. The holds only widen the window.
- Live is switched on by state, but the values match the product's defaults: `auto` defaults to true (L26270), and
  `store` sets `on` and `_driveLive` (L26324).
- Disposable mutant V1 (below) shows the "folder copy not written over" check depends on the product's real
  checkpoint-and-clash path, not on the harness.

## Sensitivity: disposable one-line mutants of c2 (verify/mut, built by verify/mkmut.py, both blocks run)

| mutant (blob) | what it breaks | result |
|---|---|---|
| V1 `692b5621` | put-back does not restore the folder checkpoint in memory | **caught**: B2 rows 5, 6, 10. The autosave writes K over the folder copy. (c) is not affected: N2 clashes anyway |
| V2 `b1b15d48` | put-back does not restore the file checkpoint | **not caught by either U2 block**. It is caught by the existing v1.89 block, run focused (`V189-on-V2`: "Save, put back, asks before writing over the colleague's file") |
| V3 `6bf23aa7` | refusal touches the kept slot (one trailing space) | **caught**: 12 rows, the six refusal checks and the six "kept byte for byte" checks |
| V4 `d85d62f7` | refusal moves `MS.ts` by 1 ms | **caught**: the six refusal checks |
| V5 `41b8b88d` | refusal only after the confirm | **caught**: the six refusal checks ("nothing asked" = 1) |
| V6 `c1643626` | refusal says nothing | **caught**: the six refusal checks |
| V7 `9df6242e` | the busy count is not brought down when a save **throws** | **NOT caught: 45/45 pass** (issue 2) |
| V8 `ad125928` | refusal clears `_keptMeta`, which hides the "↶ work kept aside" header button and the File-menu entry | **NOT caught: 45/45 pass** (issue 5) |

## Verifier probes (verify/c2v, a copy of c2: board 8a0d23b6, boot 9c4f49ad, shim 6e2ce2e6)

**(g), a thrown save** (`mkprobe.py`; harness `821bb060`, then v2 `e17c8596` with a header check added).
- The setup: Live on; the autosave (`liveTick()`) is held at the close of the folder copy's write, which then throws.
  The put-back is refused there, then retried, then refreshed, then reopened.
- **c2 passes, 34/34 and then 35/35.** The thrown save leaves `_saveBusy` at 0, and the board says "Automatic save … failed".
  The retry works: K on screen, S1 kept. The refresh and the reopen keep K.
- **V7 fails 4.** `_saveBusy` stays at 1, so the retry is refused for the rest of the session.
- **c1 fails 30**, as expected.
- **V8 fails** the header check (v2).

**(h), the status line after an autosave lands** (`mkprobe2.py`, `d66fc8bf`).
- The setup: the put-back is refused during an autosave that then lands.
- **On c2**, S1 is saved and `_saveBusy` is 0. But the status line still reads "⏳ A save is under way — put the kept
  work back once it finishes…" (issue 3).

## Issues

1. **Should fix: a wrong blob in the record.**
   - The README and the report give commit 2's audit-import as `a08baed7…`.
   - The drafted file (`c2/tools/export-audit/audit-import.mjs`), the file the diffs produce, and A1 + `block2.mjs.txt`
     are all **`72a7fda32a3ef59339ee60aa5f6c3fe79d641aa6`**.
   - `a08baed7` is most likely the c2 audit-import from before block 2's (e)-2 change (superseded harness `752e9395`).
     Nothing in the directory has that blob.
   - The lead should check the commit against `72a7fda3`.
2. **Should fix: block 2 does not test a failed save that throws.**
   - Block 2's failures are a history copy that cannot be kept, a clash, and the file's caught errors. All of them make
     the save function **return**.
   - None covers a save that **throws** through the save queue. The autosave's main-write failure is one: liveTick
     catches it, but only outside `saveSerial`.
   - Commit 2 makes ↶ Put back depend on `_saveBusy` being exact. A count left up after a thrown save (V7) would refuse
     every put-back until reload, and block 2 passes it 29/29.
   - Today's code is correct: `.finally` brings the count down, and probe (g) passes on c2.
   - Suggested fix: add probe (g) to block 2. It is block-2 style, with hand-written literals, and it catches V7.
   - This bears on Brad's "retry works after … failed … saves".
3. **Should fix, or Brad's call: commit 2's refusal message can stay on screen after the save it names has finished.**
   - It happens when the refusal comes during a **quiet autosave** that then succeeds.
   - Such an autosave says nothing itself (base L26861). liveTick's "✓ Saved … automatically" is then suppressed, because the
     refusal's `setStat` moved `_statN` (base L26357 and L26361).
   - So the board keeps saying "A save is under way" when no save is (probe (h)).
   - No data is at risk: the retry works. But the line states something false.
   - Possible fixes:
     - word the refusal so it cannot go stale, for example "A save was under way, so … was not put back; put it back
       once the save has finished";
     - or let the landing autosave say it has finished.
4. **Minor: block 2 (c)'s comment, which would be committed, and the README describe the order wrongly.**
   - They say N2 is saved "while S1's save reads the folder".
   - In the code, N2 is saved **before** S1's save starts; only the read is then held.
   - Either fix the wording, or move N2's save inside the hold. The wrapper lets the second read through.
5. **Minor: the retry's way back for a person is not checked.**
   - The retry is a direct `keptPutBack()` call. No check confirms that the header's "↶ work kept aside" button (or the
     File-menu entry, both gated on `_keptMeta`) is still offered after a refusal.
   - V8 passes 45/45. A one-line header check (probe (g) v2) catches it.
6. **Minor: the file's "Save will ask" after a retry is not checked by the U2 blocks** (V2 passes both).
   - It is covered elsewhere: the kept slot is checked byte for byte, so the checkpoint comes back intact, and the
     existing v1.89 block catches V2.
   - Worth saying in the README. No change is needed.
7. **Minor: block 1 row 5 passes on every board, base included.**
   - Row 5 is "the board says saved only when the folder holds what is on screen". It runs after the refresh tick, which
     on base has already replaced K.
   - The README lists it among base's passing "controls", but its label does not say CONTROL.
   - Moved before the tick, it would fail on base.
8. **Minor: wording.**
   - "HEAD moved … through recovery-only commits": root `NEXT-VERSION.md` also changed between `3df5fcd` and `17701c2`.
     It is a document; no product or tool blob changed.
   - "Block 2 … the autosave is refused by the clash": the check asserts that the folder copy is unchanged, not the
     clash itself. V1 shows the clash path is what keeps it unchanged.

## Not covered and not run (stated, not claimed)

- **Two tabs of one board.** They share `.base` and the main storage key, and `_saveBusy` is per tab.
- **A save queued behind another tab's Web Lock.** It has not counted itself busy yet, so a put-back is allowed. Its
  bytes and checkpoint are taken afterwards, so it clashes and asks rather than writing over anything.
- **A real modal confirm and a real file picker.** In a real browser the picker is modal, so a picker cancel cannot race
  a put-back. (f)'s `AbortError` at close is a stand-in.
- **Teams version history.** Not covered.
- **The lead's retests.** The full audit-import, each new mutation through the full suite, the gate and standards are
  still to run. Two focused runs (BOTH, at 34–36 s each here) suggest the blocks add about 30 s to audit-import; that
  was not measured in the full suite.
- **The builder's side observation** that a failed in-place file save's "⚠ In-place save failed" is replaced at once by
  `publishState()`'s "💾 Saved — updated board downloaded…" holds as code reading (L8405, then L8421). It is outside U2.

## Files (verify/)

- **Scripts and copies:**
  - `run.sh` (`da5dc1d9`): the builder's `run.sh` with only the record paths changed.
  - `mkmut.py` (`a9d2b754`) and the mutants in `mut/`.
  - `mkprobe.py` (`e2438dbd`) and `mkprobe2.py` (`9e896406`).
  - `c2v/`, with `probe-u2-g.mjs` (`e17c8596`; v1 kept as `probe-u2-g.v1.mjs.txt`, `821bb060`), `probe-u2-h.mjs`
    (`d66fc8bf`) and `focused-v189.mjs` (`ed54e613`, built by the builder's `mkfocused-u2.py` from c2's audit-import).
  - `tmp/apply1` and `tmp/apply-c1only`: the diffs applied. `tmp/harness`: the regenerated harnesses.
- **Records:**
  - `logs/<label>.log`, `out/<label>.checks.jsonl`, `logs/runs.txt` (with start times in ET), `pids.txt`;
  - `logs/mcount-verify.log`, `logs/mkmut.log`, `logs/orbit-board-start.txt`.
