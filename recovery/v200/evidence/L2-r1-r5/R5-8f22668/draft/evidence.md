# R5 draft: evidence

- **Times:** UTC; Eastern is UTC−4. Runs took place on 11 Oct 2026, 21:13–21:30 UTC (5:13–5:30 PM ET).
- **Paths:** `$W` = `/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L2/draft/R5`.
  Raw logs are in `$W/logs/<label>.log`. Every run's time, PID, exit code, duration, BOARD and command are in
  `$W/logs/commands.txt`.
- **How commands ran:** every node command that ran a probe or harness went through
  `$W/bin/run.sh <label> <cwd> <cmd…>`. The script:
  - runs the command as `setsid timeout -k 10 600 <cmd>`, in the background;
  - appends the PID, which is also the process-group id, to `$W/pids.txt`;
  - waits, then records the exit code and duration.
- **Environment:** Node v22.22.0, jsdom 27.4.0, `NODE_OPTIONS=--max-old-space-size=8192`.
  - Runs were one at a time. The machine was shared, with load averages of 1.6 to 8.1.
  - Nothing timed out.
  - `node --check` (syntax only) was also run on the suite and on the harnesses.
- **Not run (per the rules):** the full `audit-import.mjs` and any other full suite, `verify:grid`, the standards check,
  `npm run mutate`, the gate, `validate:math`, and `playwright install`. `mutate.mjs` was read as text only.
- **Leftover processes:** none. All 20 PIDs in `pids.txt` were checked as process groups (`ps -g`) at the end. None was
  alive, so nothing was killed.
- **`/home/user/orbit-board`:** only cloned from and read (`git status`, `rev-parse`, `worktree list`; files read with
  `grep`/`sed`). Its status is clean.

## Setup

```
W=…/draft/R5; mkdir -p $W/out $W/logs
git clone -q /home/user/orbit-board $W/wt && git -C $W/wt checkout -q --detach 9b27e8006ddf336b9ebefde54c9c3c4154e52370
ln -s /home/user/orbit-board/node_modules $W/wt/node_modules
cp $W/wt/prioritization-board-grid.html $W/base-board.html
```

- **Base:** HEAD `9b27e80…`, board blob `42e8111810b11c0500adb2fd029194c0ccbd9780`, `base-board.html` sha256
  `03ad86aa…fe8ff7`. `audit-import.mjs` blob `6b522d96424381af5db5e5fe26114f4894f23585`.
- **Patched:**
  - board blob `33b091d5804a744d974e35c9adb06b25e6ef2cef` (sha256 `4497f8e1…2a91`);
  - `audit-import.mjs` blob `3e2a3103fbd398a1bebf115e5356671ec93bb8d0` (sha256 `d27a3b1c…31b7`).
- **Only files edited:**
  - `$W/wt/prioritization-board-grid.html`: +5 / −1 (the R5 lines and a 3-line comment, in `driveRestore`);
  - `$W/wt/tools/export-audit/audit-import.mjs`: +64, the block, inserted after `// ==== end v1.97 W6 ====` and
    before the scenario-ran guard.
- **Also created:** `$W/node_modules`, a symlink to `/home/user/orbit-board/node_modules`, so a harness in `$W` can
  import `jsdom`.

## 1. Probes: fail before, pass after

The probe directories were set up as specified (`probe-base/` with `base-board.html` copied in, and `probe-patched/`).
In both copies, the sha256 of all four probe files equals `SHA256SUMS` (`diff` printed `SUMS-MATCH`). This was checked
before the runs and again after them.
- `probe-patched/copy/prioritization-board-grid.html` is byte-identical to `wt/…` (`cmp`).
- The money probe's own `sourceBlob` reads `33b091d…`.
- BOARD was never set for a probe.

| run | command (cwd) | exit | time |
|---|---|---|---|
| races, base | `node --import ../copy/runtime-encoding-shim.mjs races-probe.mjs` (`probe-base/races`) | 1 | 9.1 s |
| races, patched | the same (`probe-patched/races`) | 1 | 10.9 s |
| R1 money, patched | `node money-runtime-probe.mjs` (`probe-patched/copy`) | 1 | 3.2 s |
| R2 code, patched | `node code-runtime-probe.mjs` (`probe-patched/copy`) | 1 | 3.9 s |

The R5 lines (`logs/races-base.log`, `logs/races-patched.log`; results in `logs/races-*-results.json`):

| case | base | patched |
|---|---|---|
| R5 actual history restore during earlier folder close | **failed**. afterRestore gen 3, note RESTORED, dirty true, baseDirty true; after the close gen 3, note RESTORED, **dirty false, baseDirty false**; written WORKING; status "✅ Saved O&M FY27 to the shared folder — 4 KB…" | **passed**. afterRestore **gen 4**, note RESTORED, dirty true, baseDirty true; after the close note RESTORED, **dirty true, baseDirty true**; written WORKING; status "✅ Saved O&M FY27 … A change made while it was saving is not in the folder yet — it is saved next time." |
| R5 CONTROL delayed folder close without restore | passed: note WORKING, written WORKING, dirty false | passed (the same) |

The other cases are reported only, because they belong to other drafts.
- **R3 locked cycle and R4 failed import hold:** fail on both, with the same values as the lead's record.
- **R3 CONTROL and R4 CONTROL:** pass on both.
- So the races runs exit 1 on the patched board only because of R3 and R4.
- **R1 and R2 on the patched board:** the same result as the lead's base record. R1 fails its 3 checks and passes 10.
  R2 fails its 2 checks and passes 4.

## 2. The test: fail before, pass after

- **Block:** `out/block.mjs.txt`. It occurs exactly once in `wt/tools/export-audit/audit-import.mjs`, at a two-space
  `  const name = 'v2.00 (R5) — a restore during a save stays unsaved';`.
- **Guard:** the suite's scenario-ran regex finds the name (96 named scenarios), and the block sits before the guard.
- **Harness:** `out/focused.mjs`, a copy of `$W/focused.mjs`, built by `bin/mkharness.py`. It slices `keepBoards`,
  SEEN/`chk` and `W1H` verbatim from the patched suite, and the block from its leading comment to its `})();`. A check
  confirmed that the block in the harness is byte-identical to the suite's. It imports `$W/wt/tools/export-audit/boot.mjs`.

| run | BOARD | exit | time | result |
|---|---|---|---|---|
| focused-base | base-board.html | 1 | 8.3 s | 4 FAILING CHECK(S) |
| focused-base-checks (SUITE_CHECKS) | base-board.html | 1 | 9.3 s | 7 checks: 3 pass (the controls), 4 fail |
| focused-patched | wt/…grid.html | 0 | 9.1 s | ALL CHECKS PASSED |
| focused-patched-rep1/2/3 (SUITE_CHECKS) | wt/…grid.html | 0 / 0 / 0 | 12.6 / 9.6 / 11.1 s | 7 of 7 pass each time |

On base, the four failures are on the protection itself:
```
(a) WORKING saved, HISTORY put back during its write
    HISTORY on screen, WORKING in the folder, and unsaved: DIRTY, _baseDirty, the stored record
        got ["HISTORY","WORKING",false,false,false]   want ["HISTORY","WORKING",true,true,true]
(a) … the board says the change is not in the folder yet        got false   want true
(b) a clean board saved, HISTORY put back during its write
    HISTORY on screen, CURRENT in the folder, and unsaved: DIRTY, _baseDirty, the stored record
        got [true,true,"HISTORY","CURRENT",false,false,false]   want [true,true,"HISTORY","CURRENT",true,true,true]
(b) … the board says the change is not in the folder yet        got false   want true
```
These pass on base, as controls:
- (a) the save waited at its write, then went in;
- (a) then Save writes HISTORY with no clash, ends saved, and WORKING is kept in the history;
- (c) a save with no restore ends saved, `DIRTY`, `_baseDirty` and the record false, and says "✅ Saved".

An earlier draft of the same block, with the same checks but its tuple nested as a JSON string, ran as `focused-draft-*`.
It failed the same 4 checks on base and passed on patched. Its text was then flattened, and that is not the committed
text.

## 3. Mutant catches

Each mutant is the patched board with the find replaced once (`$W/mut/<id>.html`). Applicability is in
`mutations-applicability.txt`.

| mutant | harness | exit | time | failing assertion(s) |
|---|---|---|---|---|
| v200-r5-restore-gen | focused.mjs | 1 | 6.4 s | 4: the same as base, (a) and (b) unsaved tuples and both status checks |
| v200-r5-restore-basedirty | focused.mjs | 1 | 7.5 s | 1: (b) got `[true,true,"HISTORY","CURRENT",true,false,false]`, want `[…,true,true,true]` |
| unsaved-flag-never-set (re-anchored) | regress.mjs | 1 | 98.9 s | 18, e.g. "v1.95 — Save acknowledges exactly what it wrote (the shared folder) \| edit during the main write": got `BEFORE\|true\|false`, want `BEFORE\|true\|true` |
| unsaved-flag-never-set (re-anchored) | focused.mjs | 0 | 9.0 s | none. The R5 block alone does not see it, as expected; see the applicability file |

## 4. Regression check: existing blocks around the change

- **Harness:** `$W/regress.mjs`, built the same way. It holds these five existing `audit-import.mjs` blocks verbatim,
  plus the W3 hook helpers (`w3Hook`, `w3Hist`, `w3Err`) and the suite's `jsdom` import:
  - "v1.89 — saving never silently overwrites somebody’s work", which includes its put-back-then-Save case;
  - "v1.95 — Save acknowledges exactly what it wrote (the shared folder)";
  - "v1.95 — ↶ Put this back keeps unsaved work aside first";
  - "v1.96 — ↶ Put this back never drops an edit typed while the folder is written (NR01)";
  - "v1.97 — ↶ Put this back pins its appropriation and year before its first wait (item 78)".
- **Coverage:** these are every block that calls `driveRestore`, plus the folder save's acknowledgement block.

| run | BOARD | exit | time | result |
|---|---|---|---|---|
| regress-patched (first attempt) | wt/…grid.html | 1 | 52.5 s | harness error: "JSDOM is not defined". The first harness lacked the suite's `jsdom` import. Not a board result; its log was overwritten by the next run |
| regress-patched | wt/…grid.html | 0 | 61.4 s | ALL CHECKS PASSED, 79 checks |
| regress-base | base-board.html | 0 | 88.5 s | ALL CHECKS PASSED, 79 checks |

From the SUITE_CHECKS logs, base and patched have the same 79 checks with the same verdicts, and every value read is
identical (`logs/regress-*-checks.jsonl`).

## 5. Existing mutation finds on the patched board

- **mcount.py:** `recovery/v200/bin/mcount.py`, copied byte-identical (sha256 `9e120fa9…`). Result: 1,274 entries;
  1,273 match once; `unsaved-flag-never-set` matches twice. On base, all 1,274 match once.
- **findscan.py:** my own regex-plus-`json.loads` scan agrees (`logs/findscan.txt`).
- **The re-anchor and its catch:** in `mutations-applicability.txt` §3.

## 6. Scratch observation (outside R5; not a deliverable check)

`$W/scratch-keptputback.mjs` ran on the patched board: exit 0, 4.1 s, `logs/scratch-keptputback.log`.
- **What it did:** UNSAVED work was kept aside by a restore, and HISTORY was saved. Then, while a folder save was held
  at its write, `keptPutBack()` put the kept work back.
- **Result:**
  - right after the put-back: note UNSAVED, `DIRTY` true, `_baseDirty` true;
  - after the save landed: note UNSAVED, folder HISTORY, and `DIRTY`, `_baseDirty` and the record all false, with status
    "✅ Saved O&M FY27 to the shared folder — 5 KB…".
- **Meaning:** `keptPutBack` has the same race as R5. It was not changed, because it is not in R5's finding. It is
  recorded in `notes.md` as a limit.
