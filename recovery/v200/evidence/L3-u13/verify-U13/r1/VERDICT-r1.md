# U13 verified: a refresh during a save loads nothing. Verdict: sound, with one wording defect to fix

Adversarial verification of `rec/L3/u13` (builder report of 06:51 ET), Monday 12 Oct 2026, 06:52–07:24 ET.
Everything below was re-run or read by me. I wrote nothing in `/home/user/orbit-board`. Its HEAD moved to `d988a73`
during this work, with records only; the board, audit-import and mutate.mjs there are still `1375b72b`, `ed9a3437` and
`9f9168fa`.

## Bottom line
- **The fix is correct where it matters.** While a save is under way, `driveStorePull` changes nothing. Every reported run
  reproduces check for check, with identical observed values. Twenty-two mutants of my own are caught or escape harmlessly.
  The entry-only placement is caught, and so is a check placed between the two waits. Existing behaviour outside
  `driveStorePull` is unchanged.
- **MUST FIX (a false statement, new in this change).** The refusal's words are false in a reachable state. A Connect
  during a save says "⏳ **Nothing was loaded** from the shared folder … Nothing was changed: what is on screen is as it
  was". The same Connect then goes on, quietly, to load newer **execution data** from the shared folder. I observed it
  on `a88a1e5b`: `EXDB` and browser storage were rewritten and the board redrew. By code the same Connect also merges
  the **reprogramming log** and takes cost estimates it does not hold. Both carry money. The fix is wording only, with
  one check (details below).
- Smaller items: a test gap that lets a false clash through, a mislabel in the report ("the controls pass on both"), and
  two unbounded node commands by the builder, which they disclosed.

## (1) Brad's instruction, and nothing beyond it
Brad, 6:00 AM ET (ledger U13 row and the workflow's quote): "implement U13's refusal to adopt another copy while saving,
as a separate commit. Re-check immediately before adoption after any waits. Test preserved copies, unchanged flags on
refusal, and successful retry after saving finishes." Brad, 6:11 AM ET: "M1 and U13 continue as separate fixes with their
focused tests and independent reviews."

- **Own commit:** the change is confined to `driveStorePull` (board diff: 1 line out, 16 in), with an additive
  audit-import block (290 lines, none changed) and 3 mutate entries (10 lines, none changed). **Met.**
- **Re-check after any waits, immediately before adoption:** `if(_saveBusy){…return false;}` comes after the pull's last
  wait (`driveStoreRead`). Everything after it is synchronous: `ownUnsaved` (pure), `keepAside`, `applyStore`,
  `driveBaseSet`, `persist`. **Met.**
  - Placing the check at entry is caught by (3a) and (3b) (`mine-entry-only`, `mine-entry-plus-base`, the builder's
    `var-entry-only`).
  - Placing it between the two waits is caught by (3a) (`mine-between-waits`).
- **Preserved copies:** asserted. REMOTE stays in the folder's history, the kept slot stays byte for byte, WORKING
  becomes the folder's copy, and Bob's board keeps BOB-2. Bob's copy in the folder is **not** preserved; that is U18,
  stated and not asserted, as instructed.
- **Unchanged flags on refusal:** asserted byte for byte across `MS`, `DIRTY`, `_baseDirty`, `_driveBase`, the stored
  record, `_saveGen`, the kept slot and browser storage. **Met.**
- **Retry after the save:** asserted for each way it can end: saved, failed, refused and canceled (4a–4d). **Met.**
- **Beyond adoption, my judgement call for Brad:** the not-newer branch no longer records the folder's copy as the base
  while a save is under way. It is a "flag on refusal", and the builder's brief required it. It is justified by (3c): on
  `1375b72b` the save then wrote MINE over X without asking (X went to history). It only makes the save ask, and it
  causes no loss. **Within scope**, but worth naming to Brad.
- U15–U20 are untouched. N1–N4 are listed, not fixed. **Met.**

## (2) Every reported run, re-run (bounded, lock checked first, one at a time)
I made my own copies of the base (`before` = `1375b72b`, `after` = `a88a1e5b`, with mutate.mjs removed and kept only
as text). I regenerated the harnesses with the builder's `mkfocused-u13.py`, and they came out identical: `bb7958ab`,
`8d02189b`, `7771c3ba`. My mutants built with `mkmut.py` match the builder's blobs (`270b7833`, `ebfcf7d0`, `328c1c3d`).
So does the variant (`1eeb45a6`).

| label | start (ET) | exit | wall s | result vs builder |
|---|---|---|---|---|
| re-u13-on-before | 07:01:07 | 1 | 21.0 | 34/58 fail, identical check for check and value for value |
| re-u13-on-after | 07:01:29 | 0 | 19.4 | 58/58 pass, identical |
| re-M-v200-u13-pull-while-saving | 07:01:48 | 1 | 18.8 | 32 fail, identical |
| re-M-v200-u13-base-while-saving | 07:02:07 | 1 | 20.5 | 2 fail ((3c)), identical |
| re-M-v200-u13-pull-unchecked | 07:02:27 | 1 | 21.6 | 34 fail, identical |
| re-var-entry-only | 07:02:49 | 1 | 20.8 | 11 fail, identical |
| re-u2-block1-on-after | 07:03:33 | 0 | 10.7 | 16/16 pass |
| re-u2-block2-on-after | 07:03:44 | 0 | 24.2 | 41/41 pass |
| re-u13-on-after-rep2 / rep3 | 07:04:08 / 07:04:29 | 0 / 0 | 21.0 / 20.3 | pass / pass |
| re-obs2-on-after / -on-before (the builder's probe `cf57f05c`) | 07:21:02 / 07:21:22 | 0 / 0 | 19.2 / 14.2 | all 17 OBS lines the same as the builder's (times masked), on both boards |
| check-before / check-after | 07:15:41 / 07:15:43 | 1 / 1 | 2.4 / 2.1 | identical except line counts; both fail only the two `git check-ignore` checks (the copies are not repositories); "no data committed: pubState is null, APPNS is empty" passes |
| bootsame-after | 07:15:55 | 0 | 8.7 | identical either way |
| other-after (audit-other) | 07:16:04 | 0 | 30.4 | ALL CHECKS PASSED |
| audit-after (audit.mjs) | 07:16:43 | 0 | 10.0 | ALL CHECKS PASSED (not run by the builder) |
| recon-after (audit-recon) | 07:16:57 | 0 | 57.9 | ALL CHECKS PASSED (not run by the builder) |
| syntax-after-import (`node --check`) | 07:21:02 | 0 | 0.1 | OK (the builder's was unbounded) |
| mcount (text) ×4 | 06:59:18–06:59:25 | 0 | ≤2.5 | after text on after board **1310/1310 once**; base text 1307/1307 once on both boards; the 3 new finds match 0 on the before board |

Not re-run: the builder's superseded `dev1-*` runs (harness `331b6802`; they differ only in a 5 ms pause), and the full
audit-import and audit-board (the lead's).

## (3) Expected values literal; scenarios realistic
- Every expected value is a literal (`J([...])` of strings, numbers and booleans). Board helpers produce only observed
  values: `driveBaseOf`, `state()`, `inHist`, `onHead`.
- No existing check, fixture or expected value was changed. By reading every pull call in audit-import before the block
  (L3610–3642, 3934, 4048–4050, 4124, 6635–6647, and U2's L7160–7444), none runs while a save is still in flight. No
  other suite calls a pull path. So no existing check encodes the rejected behaviour.
- **Where a shortcut could create or hide the effect:**
  - `connect()` sets `_driveDir` directly, which makes precondition P5 (the opening's pull did not load REMOTE) true by
    hand. The permission-not-kept route reaches the same state through the product, and both routes are tested.
  - `live()` sets `_liveCfg.on/auto` and `_driveLive` directly, and `liveTick()` is called rather than fired by the
    timer. This cannot hide U13. It does hide one pre-existing effect: overlapping ticks during a slow autosave (P4
    below).
  - REMOTE is written through the product, with an hour-fast `Date.now` in its own window only.
  - (4d) removes `writer` from the JSON. That stands for a legitimate file written before v1.95.
- **Test gaps:**
  - (3c) never checks what the opening's connect *says* during the save. My mutant `mine-base-else-clash` (during a save,
    with nothing recorded, say the clash "⛔ … after the copy you are working from") passes all 58 checks.
  - No check reads the status line once the save has landed after a refused Connect. The builder relies on observation
    O1 for that.
- **Labelling:** four checks labelled "(a CONTROL)" in (4a)–(4d) **fail on the before board**. The defect changes the
  state they describe, so they are preconditions, not controls. The report's "the controls pass on both" holds only for
  (5) Ca, Cb and Cc.

## (4) Mutations: each applies once and is caught; my own mutants
- **The builder's three mutations:**
  - `v200-u13-pull-while-saving`: 32 checks fail, in (1), (2), (3a), (3b) and (4a)–(4d).
  - `v200-u13-base-while-saving`: 2 checks fail, both in (3c).
  - `v200-u13-pull-unchecked`: 34 checks fail, in (1)–(4).
  - Each find matches the after board exactly once (`mkmut`) and is placed before the R3 landed-view line, in
    `{ id, area, what, find, repl }` form.
  - `pull-unchecked`'s find is 33 lines long and spans the DIRTY guard and the no-requirement-data refusal. Any later
    edit there makes it NOT APPLIED. The builder disclosed this.
- **My mutants** (`mkmine.py`, `mkmine2.py`; each find asserted once; harness `bb7958ab`). Failing checks, and the cases
  they fail in:
  - Caught on placement or condition:
    - `mine-entry-only` (check only before the waits): 5 (3a 3b Cb).
    - `mine-entry-plus-base`: 5 (3a 3b Cb).
    - `mine-between-waits`: 3 (3a Cb).
    - `mine-after-keepaside`: 21.
    - `mine-after-apply`: 32.
    - `mine-quiet-only`: 19.
    - `mine-loud-only`: 27.
    - `mine-busy-gt1`: 32.
    - `mine-autobusy`: 32.
    - `mine-shell-only`: 32.
  - Caught on words or result:
    - `mine-said-quiet`: 7.
    - `mine-silent`: 7.
    - `mine-words-no-when`: 7.
    - `mine-returns-true`: 6.
  - Caught on state:
    - `mine-count-instead` (count the adoption with `_saveGen++` instead of refusing): 32.
    - `mine-refuse-records-base`: 6 (2 4c).
    - `mine-refuse-persists`: 15.
    - `mine-no-base-guard`: 2 (3c).
  - Caught by Cb's words only:
    - `mine-before-dirty`: 1.
    - `mine-before-notnewer`: 1.
  - **Escape:**
    - `mine-no-render` escapes, harmlessly: the refusal changes nothing to redraw.
    - `mine-base-else-clash` escapes: a false clash message during a save is not checked (the gap in section 3).
- Text-only count after the change: **1310/1310 entries match exactly once.** None is missing, none matches twice, and
  none is unparsed.

## (5) Money, save, import and persistence outside the change
The board diff touches only `driveStorePull`. check.mjs gives identical results, and the board is still the empty
template. boot-same is identical, and audit, audit-other and audit-recon all pass on the after board. Both U2 blocks pass.
No existing pull expectation runs during a save.

## (6) Are the words true in every state they reach?
- **MUST FIX: P1.** A Connect during a held save, when the folder holds newer execution data that Alice shared through
  the product (`driveExecPush`). Both `driveConnectNow()` and `driveAutoConnect()` were tried:
  - What the status line says: "⏳ Nothing was loaded from the shared folder: a save was under way. Nothing was changed:
    what is on screen is as it was. …"
  - What the same Connect then did: it loaded `EXDB` from `spmt-exec.json` (ts 0 → 1791803665702, keys [] → [om]),
    rewrote `prio27execdb`, and redrew the board (`logs/probe-on-after.log`).
  - `driveRpPull` (the reprogramming log, which carries money) and `driveAcePull` follow the same way, by code.
  - The words stay on screen until the save says how it ended. If that save is a quiet autosave (queued behind another
    save that cleared DIRTY first, by code), they stay on screen with nothing to replace them.
  - **Fix:** name what was not loaded, as the other refusals in this function do:
    `'⏳ The shared folder’s copy of '+esc(APPN_LBL[mySlug()]||mySlug())+' FY'+(MS.cur%100)+' was <b>not loaded</b>: a save was under way. '+esc(APPN_LBL[...])+' FY.. on screen is as it was. …'`.
    Pin it with a check: a Connect during a held save, with newer execution data in the folder, gives words that name
    the board and do not say nothing was loaded from the folder.
- **Same fix (minor), P3.** A Connect while **Load theirs** (`driveResolve('theirs')`, which runs in `saveSerial` and is
  counted in `_saveBusy`) waits at its read says "a save was under way". No save was under way. The words are replaced
  when Load theirs finishes.
- **Holds:** in every other state reached, the words are replaced by the save's own outcome: Saved, Could not save,
  Nothing was written, or Save canceled. The phrase "checked again on the next refresh once the save has finished
  (📡 Live view → ↻ Refresh now …)" holds; ↻ Refresh now is offered whether Live view is on or off.
- **Pre-existing and outside U13** (reproduced on both boards; Brad's decision, not fixed here):
  - **N1** (the builder's O5): a false clash in the save's last window, which stays on screen after an autosave.
  - **P4**, which sharpens the builder's O4. The **quiet Live tick** during an autosave (overlapping ticks, no user
    action) gives "⚠ … you have unsaved changes. Nothing was replaced. Save yours, or reload to take theirs." This
    stays on screen after the autosave lands and is then false, and it also suppresses "Saved automatically".
  - **N3**: Live view's "Loaded just now" after a refresh that loaded nothing.
  - After a reopen in folder mode, the board says "💾 Save writes them into the file", though Save writes to the folder
    (seen in P2).
- **Builder README, minor:** the claim "every save that can run then is a non-quiet one" is not strictly true. A queued
  quiet autosave can be under way with DIRTY false (by code). The words still hold in that case, apart from P1.

## (7) Rules
- **The builder:**
  - **Broke the bounded-command rule twice** (`node --check` at about 06:34 ET and `node --version` at about 06:42 ET).
    Neither was wrapped in setsid/timeout, the PIDs were not recorded, and the lock was not checked immediately before.
    The builder disclosed both. I re-ran the syntax check bounded (exit 0). Under the standing rule this is the lead's
    call.
  - Otherwise, by the builder's pids.txt (88 lines) and scripts: no `kill`, `pkill` or `killall`; mutate.mjs never
    imported or run (text helpers only); no Chromium; nothing edited in orbit-board; the board is still an empty
    template; times in ET, none later than the clock (README written 06:51 ET).
- **Me:**
  - Every node run and every text helper ran through `run.sh` (`setsid -w timeout -k 10 600`, lock checked first; it
    was never present). There are 57 timeout PIDs, each with its child, in `pids.txt`. I killed nothing.
  - **Not bounded:** short inline `python3 -I -c` comparison snippets (verdict and value diffs, the CONTROL count, the
    OBS comparison, writing the entry-only variant). Shell utilities (`grep`, `sed`, `diff`, `cp`, `git hash-object`,
    `git status`/`log` read-only in orbit-board) were also not bounded.
  - No mutate.mjs import or run, and no playwright install.
