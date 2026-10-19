# U2 as two commits: the counter, then the busy-save refusal (drafts and evidence)

Drafted and run on Sunday 11 Oct 2026, 9:10–9:32 PM ET, on disposable copies in this directory. The lead commits; nothing
here was committed.

- `/home/user/orbit-board` was only read: `git status` is clean. Its HEAD moved during this work from `3df5fcd` to `17701c2`
  through three recovery-only commits. The product and tool blobs did not change: board `4d273c06…`, `audit-import.mjs`
  `fc3117a0…`, `mutate.mjs` `8e7a362f…`, `boot.mjs` `9c4f49ad…`.
- `/home/user/orbit-ui` and `u1fix/*` were not touched.
- `mutate.mjs` was never imported or run. Mutation finds were counted as text: `mkvariants.py` checks the new entries, and
  the repo's own `recovery/v200/bin/mcount.py` (copied here, blob `852f06ec…`) checks every entry.
- No full suite, gate, standards, verify:grid or npm mutate was run. Only focused harnesses ran, one at a time, bounded.
  Each harness contains the suite's own block(s) verbatim, plus their helpers by closure.

## The two commits' content

| | board | audit-import | mutate.mjs |
|---|---|---|---|
| **commit 1 (counter)** | `diffs/commit1-board.diff`: in `keptPutBack`, `persist(); DIRTY=true; render();` becomes `persist(); _saveGen++; DIRTY=true; render();`, with a 3-line house-style comment above it | `block1.mjs.txt`, inserted right after `// ==== end v2.00 (R5) ====` (before the scenario-ran guard); `diffs/commit1-audit-import.diff` | `mutations1.mjs.txt` (`v200-u2-putback-gen`), inserted after R5's two entries; `diffs/commit1-mutate.diff` |
| **commit 2 (refusal)** | `diffs/commit2-board.diff`: after `keptPutBack`'s `if(!k){…}` line (anchored on the function header, because that line also occurs in `keptSaveFile`), a 3-line comment and `if(_saveBusy){ setStat('⏳ A save is under way — put the kept work back once it finishes. Nothing was changed: the kept work is still kept, and what is on screen is unchanged.'); render(); return; }` | `block2.mjs.txt`, inserted right after block 1's end marker; `diffs/commit2-audit-import.diff` | `mutations2.mjs.txt` (`v200-u2-putback-while-saving`), inserted after commit 1's entry; `diffs/commit2-mutate.diff` |

`mkvariants.py` builds all of this from `base/`, which is a `git archive` of HEAD plus a `node_modules` link and the shim.
It is text only and fails unless every find matches once (`logs/mkvariants.log`):
- the board edits match once each;
- the block and mutation insertion points match once each;
- each mutant's find matches once on the board it is for.

Neither mutation's find is present on the base board. The refusal mutation's find is not on the commit-1 board either.

Each mutant differs from the board before its commit only by that commit's 3 added comment lines; the statement itself is
undone (`mkvariants.py`, using difflib). Once comment lines are removed, the code is identical to boards the verifier
already reviewed (`logs/vs-u2variants.log`): c1 matches `u2variants` U2a (`5e43f9e8`), and c2 matches U2ab (`5b7a863e`).

**Every existing mutation still applies exactly once** (`logs/mcount.log`):
- 1305 of 1305 on the base board with the base `mutate.mjs`;
- 1306 of 1306 on c1 with c1's mutate text (`out/c1-mutate.mjs.txt`);
- 1307 of 1307 on c2 with c2's mutate text (`out/c2-mutate.mjs.txt`).

That includes `unsaved-flag-never-set`, `impmixed-file-unguarded`, `v200-r5-restore-gen` and `v200-r5-restore-basedirty`.

### Blobs

| what | blob |
|---|---|
| base board (HEAD) | `4d273c0680132caafc4cbc8ca09c1533735c86de` |
| commit-1 board (`c1/`) | `c08c6d2c9a31c5933c8939651c0adbad3c093c22` |
| commit-2 board (`c2/`) | `8a0d23b6d1b3d6438c6ffef71788ac53261b4782` |
| mutant `v200-u2-putback-gen` on c1 | `0d587506d7f6797c3e4bdb42c983af5012859693` |
| mutant `v200-u2-putback-gen` on c2 | `013493328dd09e60f75c30cbbfb2a45ac32e7c39` |
| mutant `v200-u2-putback-while-saving` on c2 | `e766fc38a3f49c1efb9318268bb638a3fc6c7c23` |
| audit-import, commit 1 / commit 2 | `e63768bf23b80e4a34ea24f705c7cecada5e5213` / `a08baed799f8ed05d11a7b07996abbf19df31150` |
| mutate.mjs text, commit 1 / commit 2 | `2ba0f1315706aca75b6e02996e18d6f1ee3775da` / `dafca9cf9348c3666dd0832f1476599542c8b9e0` |
| `block1.mjs.txt` / `block2.mjs.txt` | `320ef31d07188cd5e64dce93738ec74bc31f9a77` / `bfa9554b92fbbece797febf0f425e24e4c9949a4` |
| `mutations1.mjs.txt` / `mutations2.mjs.txt` | `c82e1e72c5875e66358c309c35e4c1455444bcaa` / `e02919b6826cf4831799343600d0499b89f3d373` |
| focused harness: block 1 / block 2 / both | `e98846d5…` / `b87c616b…` / `7320033f…` |
| `boot.mjs` (every copy) / shim (every copy) | `9c4f49ad8cec537097bdf485458cfd2a09b06594` / `6e2ce2e6beda9e7526527530500f254d877d0320` |
| `runner.mjs` / `run.sh` / `mkfocused-u2.py` / `mkvariants.py` | `f720ce18…` / `d51665ff…` / `252c00ef…` / `c90ac1fa…` |

### Insertion points

- The board's `keptPutBack` is at c2 L6945; the refusal is at L6951 and the counter at L6984.
- In c2's audit-import, the blocks are at L7129–7261 and L7262–7428, after R5's end marker and before the guard.
- In c2's mutate text, the entries are at L4212 and L4216.

## How it was run

- **Harness builder.** `mkfocused-u2.py` is `reuse/mkfocused-import.py` with only the block range and the header line
  changed (see the diff at the top of the file). It copies verbatim from the given audit-import: the imports, the failure
  list, `keepBoards`, `SEEN`/`chk`, the block(s) between two markers, every top-level helper they reference by closure
  (`W1H`, plus the inert `MINE`, `base`, `d` and `it`), and the scenario-ran guard with the summary.
- **Verbatim check.** The block texts were checked to be byte-identical inside c1's and c2's audit-import and inside the
  harnesses. Each harness holds only its own block; both blocks sit after R5 and before the guard.
- **Runner.** `runner.mjs` imports the copy's `runtime-encoding-shim.mjs` first, then the copy's own
  `tools/export-audit/boot.mjs`:
  - with `BOARD` unset, asserted to resolve to that copy's own board (base, c1 and c2 runs);
  - or, for mutant runs, with `BOARD` set explicitly to the mutant file (asserted and recorded as `BOARD_set:true`).
  Then it imports the harness.
- **Bounds and records.** `run.sh` runs `setsid -w timeout -k 10 600 node runner.mjs …`, one run at a time.
  - PIDs and commands go to `pids.txt`; `<label> exit=<code> wall_s=<s>` goes to `logs/runs.txt`; output to `logs/<label>.log`.
  - Every check, with its verdict and observed value, is recorded through the suite's own `SUITE_CHECKS` hook in
    `out/<label>.checks.jsonl`.
  - No run timed out, and no process was left over.

## What each block checks, at each commit

The fixture is synthetic, and requirement A's note tells the copies apart:
- `F0`: the first folder copy;
- `K`: the work kept aside;
- `N`: the newer copy from Alice's other browser, which displaced K;
- `S1`: the unsaved work on screen when its save starts;
- `N2`: a second newer copy (block 2 (c) only).

K is kept aside through product paths:
- in the folder: 💾 Save is refused because N was saved after K's copy, then **Load theirs** (`driveResolve('theirs')`);
- in the board file: Alice's other browser saves N into the file, and reopening the file keeps K aside.

The saves are the product's own: `driveStorePush`, `saveInPlace` and `saveInPlaceFile`. They are held by the W1H stand-ins
(`fold.hold.*`, `f.hold.*`).

### Block 1, "work put back during a save stays unsaved" (commit 1)

- **(a) Folder.** S1's save is held at the close of its folder write, and K is put back there.
  1. After the landing: what is on screen, the folder, `DIRTY`, `_baseDirty`, the record, whether the status says "not in the
     folder yet", and the kept slot.
  2. Then **one live tick**. Live is on, as working out of the folder has it: `_liveCfg.on/auto`, `_driveLive`.
  3. Then 💾 Save, and "Save yours over theirs" if it is offered: K ends in the folder, saved.
- **(b) Folder, reopened as soon as the save lands.** A fresh board is booted from this browser's localStorage and the same
  folder, then refreshed by one live tick. Checked: what is on screen, what is kept aside, and the record. K and S1 are each
  still in some copy (screen, kept slot, folder copy or folder history).
- **(c) Board file.** The same race, held at the write. Checked: the landing; the file reopened from localStorage and the
  file on disk; then 💾 Save writes K.
- **(d) No save running.** The put-back moves `_saveGen` by **exactly one**. This is read from board state and is labelled
  as such in the check. A product-level control checks the same put-back: one question, K on screen and unsaved, S1 kept
  aside in its place, and "Put back" said.

**Expected values.** All of them are hand-written literals. Commit 2 makes the race unreachable, because the put-back is
refused, so the race checks are written for the board's two designed outcomes. Each literal is chosen by what is on screen
when the save lands.

| outcome | landing (screen, folder or file, DIRTY, `_baseDirty`, record, "not … yet", kept) | reopen (screen, kept, record dirty) |
|---|---|---|
| MADE (commit 1): the put-back is made and counted | `K, S1, true, true, true, true, S1` | `K, S1, true` |
| REFUSED (commit 2) | `S1, S1, false, false, false, false, K` | `S1, K, false` |

- **On base:** K is on screen at the landing, so the MADE literal applies and the check fails, because the board reads
  saved. Nothing accepts "put back and marked saved".
- **Checks that are the same for both outcomes:**
  - the refresh does not replace what is on screen;
  - K and S1 are each still in a copy;
  - the board says saved only when the folder holds what is on screen;
  - after Save, K is on screen and in the folder or file, and saved.
- **Before the Save, when the put-back was refused:** the scenario puts K back with no save running. That is a product
  action, the retry.

**At commit 1** (MADE): 16 of 16 pass. **At commit 2** (REFUSED): 16 of 16 pass. **On base:** 9 of 16 fail.

The 7 checks that pass on base are:
- the controls: rows 1, 2, 5, 9, 10 and 16;
- (c)'s final Save (row 14). On base, K is still on screen at that point. The landing recorded S1's write as K's
  checkpoint, so that Save writes K without asking.

### Block 2, "put back waits for a save to finish" (commit 2)

Six scenarios cover the three ways a save can end:

| scenario | how the save ends |
|---|---|
| (a) folder | the save goes in (held at the main write's close) |
| (b) folder | it fails: held at the history keep's close, which then throws, so "⛔ Not saved … nothing was written" |
| (c) folder | it is refused by a clash: its read of the folder copy is held while N2 is saved from the other browser, so "Nothing was written" |
| (d) board file | it goes in (held at the write) |
| (e) board file | it fails (held at close, which throws "The disk is full") |
| (f) board file | it is canceled (held at close, which throws an `AbortError`), so "Save canceled — nothing written" |

Each scenario checks, in order:
1. **The refusal during the save.** The save was reached and `_saveBusy` was above 0. `JSON.stringify(MS)` and the kept slot
   are **byte-identical** before and after. No confirm was asked, S1 is still on screen, and the status says a save is under
   way, nothing was changed, the work is still kept, and what is on screen is unchanged.
2. **The landing or the failure.** What is on screen, the folder or file, and the three unsaved flags. Also what the board
   says, and that the kept slot is still byte-identical.
3. **The retry.** One question, K on screen, unsaved by all three flags. S1 is kept aside in its place when no saved copy
   has it: in the fail and cancel cases. After success it is not kept, because S1 is saved.
4. **Folder only: one live tick.** K stays on screen and unsaved, and the folder copy is **not written over unasked**: the
   autosave is refused by the clash.
5. **A reopen.** Folder: booted from localStorage and the same folder, plus a live tick. File: booted from localStorage and
   the file on disk. Checked: what is on screen and what is kept, and that K and S1 are each still in a copy.

**At commit 2:** 29 of 29 pass. **At commit 1:** 25 of 29 fail. **On base:** 27 of 29 fail.

### The counter-only sensitivity evidence

- **At commit 1**, mutant `v200-u2-putback-gen` (the counter removed; board `0d587506`) is caught by block 1:
  - 8 race checks fail (rows 3, 4, 6, 7, 8, 11, 12, 13 below), the product-path evidence;
  - the direct count check (d) also fails, `[0,0]`.
  The race checks are the counter-only sensitivity evidence. They fail exactly as on the base board: K is marked saved, the
  refresh replaces it, and a reopen loses it.
- **At commit 2** (board `01349332`), the same mutant is caught **only** by block 1 (d), `[0,0]` against `[0,1]`. All 15 other
  block-1 checks and all 29 of block 2's pass. That is expected: the refusal makes the race unreachable, so (d) is what keeps
  the counter tested at commit 2.
- **The refusal mutant** `v200-u2-putback-while-saving` on c2 (board `e766fc38`) is caught by block 2: 25 of 29 fail. Block 1
  passes 16 of 16 on it, because it accepts the MADE outcome; that board is c1's behaviour.

## Runs (all exits as shown; none timed out)

| label | board | harness | BOARD | result | exit | wall s | started (ET) |
|---|---|---|---|---|---|---|---|
| B1-on-base | 4d273c06 base | block 1 | unset | 9 of 16 fail (fail-before) | 1 | 13.8 | 9:22:10 PM |
| B1-on-c1 | c08c6d2c c1 | block 1 | unset | 16 of 16 pass | 0 | 13.5 | 9:21:49 PM |
| B1-on-c2 | 8a0d23b6 c2 | block 1 | unset | 16 of 16 pass | 0 | 13.1 | 9:22:32 PM |
| B2-on-base | 4d273c06 base | block 2 | unset | 27 of 29 fail (fail-before) | 1 | 21.2 | 9:24:36 PM |
| B2-on-c1 | c08c6d2c c1 | block 2 | unset | 25 of 29 fail (fail-before) | 1 | 22.0 | 9:24:07 PM |
| B2-on-c2 | 8a0d23b6 c2 | block 2 | unset | 29 of 29 pass | 0 | 21.0 | 9:23:41 PM |
| M1c1-B1 | 0d587506 m1 on c1 | block 1 | set | **caught**: 9 of 16 fail | 1 | 15.0 | 9:25:04 PM |
| M1c2-B1 | 01349332 m1 on c2 | block 1 | set | **caught**: 1 of 16 fail, (d) | 1 | 17.1 | 9:25:23 PM |
| M1c2-B2 | 01349332 m1 on c2 | block 2 | set | not caught by block 2: 29 of 29 pass (expected) | 0 | 26.6 | 9:25:41 PM |
| M2c2-B2 | e766fc38 m2 on c2 | block 2 | set | **caught**: 25 of 29 fail | 1 | 23.8 | 9:26:13 PM |
| M2c2-B1 | e766fc38 m2 on c2 | block 1 | set | 16 of 16 pass (expected: c1 behaviour) | 0 | 14.5 | 9:26:36 PM |
| BOTH-on-c2 | 8a0d23b6 c2 | blocks 1+2 in suite order | unset | 45 of 45 pass | 0 | 32.4 | 9:27:13 PM |
| B1-on-c1-repeat | c08c6d2c | block 1 | unset | 16 of 16 pass | 0 | 12.7 | 9:28:52 PM |
| BOTH-on-c2-repeat | 8a0d23b6 | blocks 1+2 | unset | 45 of 45 pass | 0 | 31.8 | 9:29:05 PM |

Two runs are superseded and kept:
- `logs/B1-on-c1.first.log` (9:21:27 PM, all passed). It was run before `runner.mjs` kept `SUITE_CHECKS`, so it recorded no
  per-check values; the runner blob was then `2c07cb04`.
- `logs/B2-on-c2.superseded-1.log` (harness `752e9395`). Check (e)-2 failed in it: it expected the status line to say "In-place
  save failed", but `publishState()` replaces that status (see below). The check was changed to read the header ("downloaded
  — not on the shared file yet"). Every other check was unchanged and all 29 then passed.

Per-run summaries are in `logs/summary.txt`, and every check's observed value is in the tables below (`out/tables.md`).

## Caveats, shortcuts and observations (said plainly)

- **Wiring at state level, not through product paths:**
  - `wire()` mocks `confirm`, which always answers OK;
  - `connect()` sets `_liveCfg` and `_driveDir`;
  - live view is turned on as `_liveCfg.on=true; _liveCfg.auto=true; _driveLive=true`, as the suite already does at L6604
    (v1.97 W3). The product does this at L26324 when working out of the folder;
  - block 1 (d) reads `_saveGen`; it is labelled as a state read.
- **Mock stand-ins:**
  - block 2 (c) holds the folder read by wrapping the stand-in folder's `getFileHandle` for one call (`holdRead`);
  - block 2 (f)'s cancel is an `AbortError` thrown at the write's close. It reaches the product's own
    `'Save canceled — nothing written.'` branch, but a real cancel would more often come from the file picker.
- **The board file has no live refresh,** so block 2's live-tick checks are folder only. The file's after-retry check is a
  reopen.
- **The commit-1 ASK gap is not asserted.** On commit 1, the save that lands still overwrites K's restored checkpoint. So in
  block 1 (a), the live tick's autosave writes K over S1 without asking; S1 survives in the kept slot and the folder
  history. Block 1 does not assert this. It was measured by the verifier's E1 on U2a (`u2variants/verify`), whose code is
  identical to c1's. Commit 2 removes the race, and block 2 checks that the autosave after a retry does not write over the
  folder copy.
  - In block 1's final Saves at commit 2, the clash choice ("Save yours over theirs") and the file's HOLD ON prompt are
    answered OK by the mock.
  - Whether the Save asked is not asserted in block 1. At commit 1 it does not ask, which is the gap commit 2 closes.
- **Observation, not U2 and not changed: the failed file save's warning is overwritten.** When an in-place file save fails,
  its warning "⚠ In-place save failed (…) — downloading a copy instead." (L8405) is immediately replaced by `publishState()`'s
  "💾 Saved — updated board downloaded to your Downloads folder…" (L8421). The header does say "downloaded — not on the shared
  file yet".
  - This is read from the code, together with the superseded run's failed status check. The exact text displayed was not
    captured.
- **Not covered:**
  - two tabs of one board; a save waiting on another tab's Web Lock (it has not taken its count yet);
  - a real browser's modal confirm;
  - Teams version history.
  All runs were in jsdom. Times inside the board are UTC.
- **The lead's own retests are still due:** the full audit-import alone, and each new mutation through the full audit-import.
  These were not run here, per the rules.

## Files

- **Drafts:** `block1.mjs.txt`, `block2.mjs.txt`, `mutations1.mjs.txt`, `mutations2.mjs.txt`, and `diffs/commit{1,2}-{board,audit-import,mutate}.diff`.
- **Builders and runners:** `mkvariants.py`, `mkfocused-u2.py`, `runner.mjs`, `run.sh`, `show.sh`, `mcount.py` (repo copy).
- **Copies:**
  - `base/`, `c1/` and `c2/`, each with its board, its tools and its own focused harnesses in `tools/export-audit/focused-u2-*.mjs`;
  - `c1/` and `c2/` hold no `mutate.mjs`: it was removed, and its text copies are `out/c{1,2}-mutate.mjs.txt`;
  - the mutants are in `mut/`.
- **Records:** `pids.txt`, `logs/runs.txt`, `logs/<label>.log`, `out/<label>.checks.jsonl`, `logs/summary.txt`,
  `logs/mcount.log`, `logs/mkvariants.log`, `logs/mkfocused.log`, `logs/vs-u2variants.log`.

## Every check: observed value and verdict (✓ pass, ✗ fail), generated from out/<label>.checks.jsonl

### Block 1: observed value and verdict per check

| # | place / claim | B1-on-base | B1-on-c1 | B1-on-c2 | M1c1-B1 | M1c2-B1 | M2c2-B1 |
|---|---|---|---|---|---|---|---|
| 1 | (a) the folder: K kept aside, S1 typed (a CONTROL) — S1 on screen, K kept aside, N in the folder | ✓ `["S1","K","N"]` | ✓ `["S1","K","N"]` | ✓ `["S1","K","N"]` | ✓ `["S1","K","N"]` | ✓ `["S1","K","N"]` | ✓ `["S1","K","N"]` |
| 2 | (a) the folder: K put back while S1’s save writes — the save waited at its write, then went in (a CONTROL) | ✓ `[true,true]` | ✓ `[true,true]` | ✓ `[true,true]` | ✓ `[true,true]` | ✓ `[true,true]` | ✓ `[true,true]` |
| 3 | (a) the folder: K put back while S1’s save writes — once it lands: K on screen, S1 in the folder, unsaved (DIRTY, _baseDirty, the record) and said; S1 kept aside — or, refused, S1 on screen and saved, K still kept | **✗** `["K","S1",false,false,false,false,"S1"]` | ✓ `["K","S1",true,true,true,true,"S1"]` | ✓ `["S1","S1",false,false,false,false,"K"]` | **✗** `["K","S1",false,false,false,false,"S1"]` | ✓ `["S1","S1",false,false,false,false,"K"]` | ✓ `["K","S1",true,true,true,true,"S1"]` |
| 4 | (a) the folder: then the refresh — what is on screen is not replaced (K; refused: S1), and K and S1 are each still in a copy here or in the folder | **✗** `["S1",false,true]` | ✓ `["K",true,true]` | ✓ `["S1",true,true]` | **✗** `["S1",false,true]` | ✓ `["S1",true,true]` | ✓ `["K",true,true]` |
| 5 | (a) the folder: then the refresh — the board says saved only when the folder holds what is on screen | ✓ `true` | ✓ `true` | ✓ `true` | ✓ `true` | ✓ `true` | ✓ `true` |
| 6 | (a) the folder: then 💾 Save — it writes K: K on screen and in the folder, and saved | **✗** `["S1","S1",false,false]` | ✓ `["K","K",false,false]` | ✓ `["K","K",false,false]` | **✗** `["S1","S1",false,false]` | ✓ `["K","K",false,false]` | ✓ `["K","K",false,false]` |
| 7 | (b) the folder: reopened once the save lands, and refreshed — K stays on screen, unsaved by the record, with S1 kept aside — or, refused, S1 on screen and K kept aside | **✗** `["S1","S1",false]` | ✓ `["K","S1",true]` | ✓ `["S1","K",false]` | **✗** `["S1","S1",false]` | ✓ `["S1","K",false]` | ✓ `["K","S1",true]` |
| 8 | (b) the folder: reopened once the save lands, and refreshed — K and S1 are each still in a copy here or in the folder | **✗** `[false,true]` | ✓ `[true,true]` | ✓ `[true,true]` | **✗** `[false,true]` | ✓ `[true,true]` | ✓ `[true,true]` |
| 9 | (c) the board file: K kept aside, S1 typed (a CONTROL) — S1 on screen, K kept aside, N in the file | ✓ `["S1","K","N"]` | ✓ `["S1","K","N"]` | ✓ `["S1","K","N"]` | ✓ `["S1","K","N"]` | ✓ `["S1","K","N"]` | ✓ `["S1","K","N"]` |
| 10 | (c) the board file: K put back while S1’s save writes — the save waited at its write, then wrote once (a CONTROL) | ✓ `[true,1]` | ✓ `[true,1]` | ✓ `[true,1]` | ✓ `[true,1]` | ✓ `[true,1]` | ✓ `[true,1]` |
| 11 | (c) the board file: K put back while S1’s save writes — once it lands: K on screen, S1 in the file, unsaved (DIRTY, _baseDirty, the record) and said; S1 kept aside — or, refused, S1 on screen and saved, K still kept | **✗** `["K","S1",false,false,false,false,"S1"]` | ✓ `["K","S1",true,true,true,true,"S1"]` | ✓ `["S1","S1",false,false,false,false,"K"]` | **✗** `["K","S1",false,false,false,false,"S1"]` | ✓ `["S1","S1",false,false,false,false,"K"]` | ✓ `["K","S1",true,true,true,true,"S1"]` |
| 12 | (c) the board file: reopened once the save lands — K stays on screen, unsaved by the record, with S1 kept aside — or, refused, S1 on screen and K kept aside | **✗** `["S1","S1",false]` | ✓ `["K","S1",true]` | ✓ `["S1","K",false]` | **✗** `["S1","S1",false]` | ✓ `["S1","K",false]` | ✓ `["K","S1",true]` |
| 13 | (c) the board file: reopened once the save lands — K and S1 are each still in a copy here or in the file | **✗** `[false,true]` | ✓ `[true,true]` | ✓ `[true,true]` | **✗** `[false,true]` | ✓ `[true,true]` | ✓ `[true,true]` |
| 14 | (c) the board file: then 💾 Save — it writes K: K on screen and in the file, and saved | ✓ `["K","K",false,false]` | ✓ `["K","K",false,false]` | ✓ `["K","K",false,false]` | ✓ `["K","K",false,false]` | ✓ `["K","K",false,false]` | ✓ `["K","K",false,false]` |
| 15 | (d) K put back with no save running — no save was running, and the put-back moved the change count by exactly one (read from _saveGen) | **✗** `[0,0]` | ✓ `[0,1]` | ✓ `[0,1]` | **✗** `[0,0]` | **✗** `[0,0]` | ✓ `[0,1]` |
| 16 | (d) K put back with no save running — it asked once; K on screen, unsaved (DIRTY, _baseDirty, the record), S1 kept aside, and the board says it was put back (a CONTROL) | ✓ `[1,"K",true,true,true,"S1",true]` | ✓ `[1,"K",true,true,true,"S1",true]` | ✓ `[1,"K",true,true,true,"S1",true]` | ✓ `[1,"K",true,true,true,"S1",true]` | ✓ `[1,"K",true,true,true,"S1",true]` | ✓ `[1,"K",true,true,true,"S1",true]` |

### Block 2: observed value and verdict per check

| # | place / claim | B2-on-base | B2-on-c1 | B2-on-c2 | M1c2-B2 | M2c2-B2 |
|---|---|---|---|---|---|---|
| 1 | (a) the folder: put back while S1’s save writes; the save goes in — S1 on screen and unsaved, K kept aside, N in the folder (a CONTROL) | ✓ `["S1",true,"K","N"]` | ✓ `["S1",true,"K","N"]` | ✓ `["S1",true,"K","N"]` | ✓ `["S1",true,"K","N"]` | ✓ `["S1",true,"K","N"]` |
| 2 | (a) the folder: put back while S1’s save writes; the save goes in — during the save: refused; what is on screen and the kept work are byte for byte as they were; nothing asked; the board says so | **✗** `[true,true,false,false,1,"K",false]` | **✗** `[true,true,false,false,1,"K",false]` | ✓ `[true,true,true,true,0,"S1",true]` | ✓ `[true,true,true,true,0,"S1",true]` | **✗** `[true,true,false,false,1,"K",false]` |
| 3 | (a) the folder: put back while S1’s save writes; the save goes in — once it lands: S1 on screen and in the folder, saved; the kept work byte for byte as it was | **✗** `[true,"K","S1",false,false,false,false]` | **✗** `[true,"K","S1",true,true,true,false]` | ✓ `[true,"S1","S1",false,false,false,true]` | ✓ `[true,"S1","S1",false,false,false,true]` | **✗** `[true,"K","S1",true,true,true,false]` |
| 4 | (a) the folder: put back while S1’s save writes; the save goes in — put back again: one question; K on screen, unsaved; nothing kept in its place (S1 is saved) | **✗** `[1,"S1",true,true,true,null]` | **✗** `[1,"S1",true,true,true,"K"]` | ✓ `[1,"K",true,true,true,null]` | ✓ `[1,"K",true,true,true,null]` | **✗** `[1,"S1",true,true,true,"K"]` |
| 5 | (a) the folder: put back while S1’s save writes; the save goes in — then the refresh: K stays on screen, unsaved, and the folder copy is not written over | **✗** `["S1","S1",true,true,true]` | **✗** `["S1","S1",true,true,true]` | ✓ `["K","S1",true,true,true]` | ✓ `["K","S1",true,true,true]` | **✗** `["S1","S1",true,true,true]` |
| 6 | (a) the folder: put back while S1’s save writes; the save goes in — then reopened and refreshed: on screen and kept aside; K and S1 each still in a copy | **✗** `["S1",null,false,true]` | ✓ `["S1","K",true,true]` | ✓ `["S1","K",true,true]` | ✓ `["S1","K",true,true]` | ✓ `["S1","K",true,true]` |
| 7 | (b) the folder: put back while S1’s save writes; the save fails — during the save: refused; what is on screen and the kept work are byte for byte as they were; nothing asked; the board says so | **✗** `[true,true,false,false,1,"K",false]` | **✗** `[true,true,false,false,1,"K",false]` | ✓ `[true,true,true,true,0,"S1",true]` | ✓ `[true,true,true,true,0,"S1",true]` | **✗** `[true,true,false,false,1,"K",false]` |
| 8 | (b) the folder: put back while S1’s save writes; the save fails — once it fails: S1 on screen and unsaved, N still in the folder, the board says not saved; the kept work byte for byte as it was | **✗** `[false,"K","N",true,true,true,true,false]` | **✗** `[false,"K","N",true,true,true,true,false]` | ✓ `[false,"S1","N",true,true,true,true,true]` | ✓ `[false,"S1","N",true,true,true,true,true]` | **✗** `[false,"K","N",true,true,true,true,false]` |
| 9 | (b) the folder: put back while S1’s save writes; the save fails — put back again: one question; K on screen, unsaved; S1 kept aside in its place | **✗** `[1,"S1",true,true,true,"K"]` | **✗** `[1,"S1",true,true,true,"K"]` | ✓ `[1,"K",true,true,true,"S1"]` | ✓ `[1,"K",true,true,true,"S1"]` | **✗** `[1,"S1",true,true,true,"K"]` |
| 10 | (b) the folder: put back while S1’s save writes; the save fails — then the refresh: K stays on screen, unsaved, and the folder copy is not written over | **✗** `["S1","S1",false,false,false]` | **✗** `["S1","S1",false,false,false]` | ✓ `["K","N",true,true,true]` | ✓ `["K","N",true,true,true]` | **✗** `["S1","S1",false,false,false]` |
| 11 | (b) the folder: put back while S1’s save writes; the save fails — then reopened and refreshed: on screen and kept aside; K and S1 each still in a copy | **✗** `["S1","K",true,true]` | **✗** `["S1","K",true,true]` | ✓ `["K","S1",true,true]` | ✓ `["K","S1",true,true]` | **✗** `["S1","K",true,true]` |
| 12 | (c) the folder: put back while S1’s save reads the folder; the save is refused — during the save: refused; what is on screen and the kept work are byte for byte as they were; nothing asked; the board says so | **✗** `[true,true,false,false,1,"K",false]` | **✗** `[true,true,false,false,1,"K",false]` | ✓ `[true,true,true,true,0,"S1",true]` | ✓ `[true,true,true,true,0,"S1",true]` | **✗** `[true,true,false,false,1,"K",false]` |
| 13 | (c) the folder: put back while S1’s save reads the folder; the save is refused — once it is refused: S1 on screen and unsaved, N2 in the folder, nothing written; the kept work byte for byte as it was | **✗** `[false,"K","N2",true,true,true,true,false]` | **✗** `[false,"K","N2",true,true,true,true,false]` | ✓ `[false,"S1","N2",true,true,true,true,true]` | ✓ `[false,"S1","N2",true,true,true,true,true]` | **✗** `[false,"K","N2",true,true,true,true,false]` |
| 14 | (c) the folder: put back while S1’s save reads the folder; the save is refused — put back again: one question; K on screen, unsaved; S1 kept aside in its place | **✗** `[1,"S1",true,true,true,"K"]` | **✗** `[1,"S1",true,true,true,"K"]` | ✓ `[1,"K",true,true,true,"S1"]` | ✓ `[1,"K",true,true,true,"S1"]` | **✗** `[1,"S1",true,true,true,"K"]` |
| 15 | (c) the folder: put back while S1’s save reads the folder; the save is refused — then the refresh: K stays on screen, unsaved, and the folder copy is not written over | **✗** `["S1","N2",true,true,true]` | **✗** `["S1","N2",true,true,true]` | ✓ `["K","N2",true,true,true]` | ✓ `["K","N2",true,true,true]` | **✗** `["S1","N2",true,true,true]` |
| 16 | (c) the folder: put back while S1’s save reads the folder; the save is refused — then reopened and refreshed: on screen and kept aside; K and S1 each still in a copy | **✗** `["S1","K",true,true]` | **✗** `["S1","K",true,true]` | ✓ `["K","S1",true,true]` | ✓ `["K","S1",true,true]` | **✗** `["S1","K",true,true]` |
| 17 | (d) the board file: put back while S1’s save writes; the save goes in — S1 on screen and unsaved, K kept aside, N in the file (a CONTROL) | ✓ `["S1",true,"K","N"]` | ✓ `["S1",true,"K","N"]` | ✓ `["S1",true,"K","N"]` | ✓ `["S1",true,"K","N"]` | ✓ `["S1",true,"K","N"]` |
| 18 | (d) the board file: put back while S1’s save writes; the save goes in — during the save: refused; what is on screen and the kept work are byte for byte as they were; nothing asked; the board says so | **✗** `[true,true,false,false,1,"K",false]` | **✗** `[true,true,false,false,1,"K",false]` | ✓ `[true,true,true,true,0,"S1",true]` | ✓ `[true,true,true,true,0,"S1",true]` | **✗** `[true,true,false,false,1,"K",false]` |
| 19 | (d) the board file: put back while S1’s save writes; the save goes in — once it lands: S1 on screen and in the file, saved; the kept work byte for byte as it was | **✗** `["K","S1",false,false,false,false]` | **✗** `["K","S1",true,true,true,false]` | ✓ `["S1","S1",false,false,false,true]` | ✓ `["S1","S1",false,false,false,true]` | **✗** `["K","S1",true,true,true,false]` |
| 20 | (d) the board file: put back while S1’s save writes; the save goes in — put back again: one question; K on screen, unsaved; nothing kept in its place (S1 is saved) | **✗** `[1,"S1",true,true,true,null]` | **✗** `[1,"S1",true,true,true,"K"]` | ✓ `[1,"K",true,true,true,null]` | ✓ `[1,"K",true,true,true,null]` | **✗** `[1,"S1",true,true,true,"K"]` |
| 21 | (d) the board file: put back while S1’s save writes; the save goes in — then reopened: on screen and kept aside; K and S1 each still in a copy | **✗** `["S1",null,false,true]` | ✓ `["S1","K",true,true]` | ✓ `["S1","K",true,true]` | ✓ `["S1","K",true,true]` | ✓ `["S1","K",true,true]` |
| 22 | (e) the board file: put back while S1’s save writes; the save fails — during the save: refused; what is on screen and the kept work are byte for byte as they were; nothing asked; the board says so | **✗** `[true,true,false,false,1,"K",false]` | **✗** `[true,true,false,false,1,"K",false]` | ✓ `[true,true,true,true,0,"S1",true]` | ✓ `[true,true,true,true,0,"S1",true]` | **✗** `[true,true,false,false,1,"K",false]` |
| 23 | (e) the board file: put back while S1’s save writes; the save fails — once it fails: S1 on screen and unsaved, N still in the file, the header says not on the shared file yet; the kept work byte for byte as it was | **✗** `["K","N",true,true,true,true,false]` | **✗** `["K","N",true,true,true,true,false]` | ✓ `["S1","N",true,true,true,true,true]` | ✓ `["S1","N",true,true,true,true,true]` | **✗** `["K","N",true,true,true,true,false]` |
| 24 | (e) the board file: put back while S1’s save writes; the save fails — put back again: one question; K on screen, unsaved; S1 kept aside in its place | **✗** `[1,"S1",true,true,true,"K"]` | **✗** `[1,"S1",true,true,true,"K"]` | ✓ `[1,"K",true,true,true,"S1"]` | ✓ `[1,"K",true,true,true,"S1"]` | **✗** `[1,"S1",true,true,true,"K"]` |
| 25 | (e) the board file: put back while S1’s save writes; the save fails — then reopened: on screen and kept aside; K and S1 each still in a copy | **✗** `["S1","K",true,true]` | **✗** `["S1","K",true,true]` | ✓ `["K","S1",true,true]` | ✓ `["K","S1",true,true]` | **✗** `["S1","K",true,true]` |
| 26 | (f) the board file: put back while S1’s save writes; the save is canceled — during the save: refused; what is on screen and the kept work are byte for byte as they were; nothing asked; the board says so | **✗** `[true,true,false,false,1,"K",false]` | **✗** `[true,true,false,false,1,"K",false]` | ✓ `[true,true,true,true,0,"S1",true]` | ✓ `[true,true,true,true,0,"S1",true]` | **✗** `[true,true,false,false,1,"K",false]` |
| 27 | (f) the board file: put back while S1’s save writes; the save is canceled — once it is canceled: S1 on screen and unsaved, N still in the file, the board says nothing was written; the kept work byte for byte as it was | **✗** `["K","N",true,true,true,true,false]` | **✗** `["K","N",true,true,true,true,false]` | ✓ `["S1","N",true,true,true,true,true]` | ✓ `["S1","N",true,true,true,true,true]` | **✗** `["K","N",true,true,true,true,false]` |
| 28 | (f) the board file: put back while S1’s save writes; the save is canceled — put back again: one question; K on screen, unsaved; S1 kept aside in its place | **✗** `[1,"S1",true,true,true,"K"]` | **✗** `[1,"S1",true,true,true,"K"]` | ✓ `[1,"K",true,true,true,"S1"]` | ✓ `[1,"K",true,true,true,"S1"]` | **✗** `[1,"S1",true,true,true,"K"]` |
| 29 | (f) the board file: put back while S1’s save writes; the save is canceled — then reopened: on screen and kept aside; K and S1 each still in a copy | **✗** `["S1","K",true,true]` | **✗** `["S1","K",true,true]` | ✓ `["K","S1",true,true]` | ✓ `["K","S1",true,true]` | **✗** `["S1","K",true,true]` |
