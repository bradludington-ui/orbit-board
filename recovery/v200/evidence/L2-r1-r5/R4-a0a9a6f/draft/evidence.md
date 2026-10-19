# R4 / R4b draft: evidence

W = /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L2/draft/R4

Raw logs are in W/logs/. `W/logs/runs.txt` lists every run with its PID, exit code and duration. Every run went through
`W/bin/run.sh`, which does `( cd <cwd> && exec setsid timeout -k 10 600 <cmd> ) &` and appends the PID to
`W/pids.txt`. None timed out. At the end, `kill -0` on every recorded PID found none alive.

## Pins

- Clone `W/wt`, detached at 9b27e8006ddf336b9ebefde54c9c3c4154e52370. The base board blob is 42e8111 (= 1c94537).
- Patched board: git blob be23027785a18ca3561732ad8efa8e14ad91db3c, sha256 976b475b…aeb8. Base: sha256 03ad86aa…8ff7.
- Patched `tools/export-audit/audit-import.mjs`: blob 4cda2d0e9b3b40ac3331eb19edc0586d40c52a8b (base 6b522d96).
- The probe copies match `SHA256SUMS` in both probe dirs: money 849c46a7…, code 38e2ac77…, shim e689710a…, races bb784b37….
- The board in `probe-patched/copy` is the same as `W/wt` (976b475b…), and the board in `probe-base/copy` is the same as
  `base-board.html` (03ad86aa…).
- Node v22.22.0, jsdom 27.4.0 (from /home/user/orbit-board/node_modules), NODE_OPTIONS=--max-old-space-size=8192.
  BOARD was never set for the probes.
- The board change is one line in `_saveInPlaceFileRun`, directly below `let p;` (out/board.diff).

## 1. Probe R4: fail before, pass after

```
(cd W/probe-base/races && setsid timeout -k 10 600 node --import ../copy/runtime-encoding-shim.mjs races-probe.mjs)
  exit 1, 13.6 s  (logs/races-base.log, logs/races-base-results.json)
(cd W/probe-patched/races && … same …)
  exit 1, 15.4 s  (logs/races-patched.log, logs/races-patched-results.json)
```

| case | base | patched |
|---|---|---|
| R4 CONTROL normal delayed file save | passed (writes 1, savedFF OLD FF) | passed (writes 1, opens 1, savedFF OLD FF) |
| R4 failed import hold during file read | **failed**: importRet false, hold true, writes 1, opens 1, savedFF "PARTIAL FF", status "💾 Saved in place…" | **passed**: importRet false, hold true, writes 0, opens 0, savedFF "OLD FF", status "⛔ Saving to the board file is refused. A full import stopped part-way in this browser and could not be put back… nothing writes over it…" |
| R3 CONTROL / R5 CONTROL | passed | passed |
| R3 locked / R5 restore | failed | failed (identical; these are other findings, not touched here) |

The exit code is 1 on both boards because R3 and R5 still fail. That is outside this finding.

Regression check (patched board only, other findings): `node money-runtime-probe.mjs` exited 1 in 1.8 s and
`node code-runtime-probe.mjs` exited 1 in 1.9 s, both from W/probe-patched/copy. The results match the lead's base
record exactly:
- R1: the same three defects fail ([600000000,100000000,500000000], [600000000,600000000] and [600000000]), and
  10 controls pass. The label is "FY26 · O&M · PLANNED (board allocation, O&M) · + OBBBA FY25".
- R2: the same two defects fail, and 4 controls pass.

## 2. Test: fail before, pass after (focused harness)

`W/focused.mjs` is built by `W/bin/mkfocused.py`, which reads the patched suite as text. It holds these parts, copied
verbatim from audit-import.mjs:
- the suite's `failures`, `stopAtFirstFailure`, `keepBoards`, `SEEN` and `chk`
- `W1H`
- the W2 helpers, from `W2_MINE` to `w2Import`
- the v2.00 R4 section
- the `_selfRead` guard and the summary

The only change is that boot.mjs is imported by its absolute path in W/wt. A check confirmed that `out/block.mjs.txt`
appears exactly once in both the suite and `focused.mjs` (sha256 38919f3d…).

```
env BOARD=W/base-board.html node W/focused.mjs                 exit 1, 8.9 s  (logs/focused-base.log)
env BOARD=W/wt/prioritization-board-grid.html node W/focused.mjs  exit 0, 9.5 s  (logs/focused-patched.log)
with SUITE_CHECKS: logs/checks-base.jsonl (exit 1, 8.0 s), logs/checks-patched.jsonl (exit 0, 9.6 s)
```

Base: 3 FAILING CHECK(S). All three are on the protection; every control passes.
```
--- v2.00 (R4) … | the import stops part-way during the read
    nothing is written: the file is never opened for writing                  got [1,1]   want [0,0]
    the board file keeps its bytes                                            got false   want true
    the board says the save is refused, and that nothing writes over the board file   got false   want true
```
Passing on base:
- R4 controls: "the save reached the file’s read and waits there" [true,0,0] in both cases; "the save opens and writes
  the board file once" [1,1]; "the import stopped part-way, could not be put back, and the hold is on"
  [false,true,"true"].
- All 13 R4b checks.

Patched: ALL CHECKS PASSED (20 checks: 7 in R4, 13 in R4b).

R4b passes on base by design. The protection it guards, the check at the start of `_saveInPlaceFileRun`, is already in
1c94537. Its sensitivity is shown by the mutant in section 3.

Superseded runs: PIDs 7737, 7920, 8034 and 8058 ran an earlier draft of R4b. That draft awaited the Save's promise and
did not yet check that the request was over. Their logs were overwritten by the final-text runs above.

## 3. Mutants (focused harness, BOARD=<mutant>)

Mutants are in W/mut/. They were built by replacing each find exactly once in the patched board; impmixed-file-unguarded
was read from mutate.mjs as text by `W/bin/mkmut.py`.

| mutant | all-failures run | MUT_FIRST_FAIL=1 run: first failing assertion |
|---|---|---|
| v200-r4-no-recheck | exit 1, 11.6 s, 3 checks | exit 1, 9.4 s: R4 \| the import stops part-way during the read \| nothing is written: the file is never opened for writing \| got [1,1] want [0,0] |
| v200-r4-held-quietly | exit 1, 12.0 s, 1 check | exit 1, 7.3 s: R4 \| … \| the board says the save is refused, and that nothing writes over the board file \| got false want true |
| v200-r4-said-not-held | exit 1, 11.1 s, 3 checks | exit 1, 6.2 s: R4 \| … \| nothing is written: the file is never opened for writing \| got [1,1] want [0,0] |
| impmixed-file-unguarded (existing) | exit 1, 10.8 s, 5 checks, all in R4b | exit 1, 8.2 s: R4b \| hold on, read not held \| refused before the file is touched: no permission request, no read, no open \| got perm 1 · read 1 · open 0 want perm 0 · read 0 · open 0 |

The impmixed-file-unguarded all-failures run (logs/mut-impmixed-file-unguarded.log) failed these R4b checks:
- read not held: perm 1 · read 1 · open 0.
- read held, hold cleared during it: perm 1 · read 1 · open 0; request over and board says so [false,false];
  nothing written [1,1]; bytes kept false.

### Why R4b is needed: masking by R4

`W/focused-v195.mjs` is the same build as `focused.mjs` plus the existing block "v1.95 — after an import that cannot be
put back, nothing writes over the board file until asked", copied verbatim.

| board | exit | s | result |
|---|---|---|---|
| patched | 0 | 10.5 | all pass |
| base | 1 | 10.7 | only the 3 R4 protection checks fail |
| patched + impmixed-file-unguarded | 1 | 11.3 | the **v1.95 block passes**; only R4b fails (5 checks) |
| base + impmixed-file-unguarded | 1 | 9.8 | the v1.95 block catches it (4 checks), and so do R4 and R4b |

### Hand mutant (evidence only, not proposed)

`mut/hand-parked.html` replaces the first check with a loop that waits for the hold to clear. A Save under it is
"parked" and resumes later. Run: exit 1, 7.7 s. It is caught by:
- "Save is refused at once: the request is over, and the board says so", got [false,true], in both hold cases
- "clearing the hold does not bring the refused Save back: nothing is written", got [1,1]
- "the board file keeps its bytes", got false

## 4. Regression check: existing Save blocks (focused, verbatim)

`W/regress.mjs` holds the suite header and helpers (openWith, W1H, the W2 helpers and V197W2), all copied verbatim. It
runs these existing blocks and then the R4 section:
- v1.89 saving never silently overwrites
- v1.95 Save acknowledges exactly what it wrote (the file)
- v1.95 Save acknowledges exactly what it wrote (the shared folder)
- v1.95 one writer per board file
- v1.95 after an import that cannot be put back…
- v1.97 every list the file carries marks the board unsaved…
- v1.97 a folder save never acknowledges…
- v1.97 a refused browser write never reads as saved

```
env BOARD=W/wt/prioritization-board-grid.html node W/regress.mjs   exit 0, 93.1 s  ALL CHECKS PASSED (logs/regress-patched.log)
env BOARD=W/base-board.html node W/regress.mjs (SUITE_CHECKS)      exit 1, 93.0 s  only the 3 R4 protection checks fail;
   every existing block passes (logs/regress-base.log, logs/checks-regress-base.jsonl)
```

Three earlier regress-patched runs did not complete, because the harness was still missing helpers. Their logs were
overwritten by the final run:
- 9285: V197W2 was not defined.
- 9570: JSDOM was not defined.
- 9897: jsdom could not be resolved from W.

`node --check tools/export-audit/audit-import.mjs` reported SYNTAX_OK. The full audit-import was **not** run; the lead
runs it alone.

## 5. Mutation applicability

`W/bin/mcount.py` is a copy of recovery/v200/bin/mcount.py. It reads mutate.mjs as text and never imports or runs it.
- Base: 1274/1274 entries match once.
- Patched: 1274/1274 match once (logs/mcount-*.json).

The first placement of the re-check, directly after the read's catch, made `guard-fails-open` match 0 times. Moving
the re-check below `let p;` restored it. Each new find matches once on patched and 0 times on base. Details are in
out/mutations-applicability.txt.

## 6. Scratch experiment (limit, not a test): a Save queued behind a running save

`W/exp/queued.mjs` ran on the patched board: exit 0, 7.2 s (logs/exp-queued-patched.log).

Steps: Save #1 is held in its read. The import stops part-way and the hold is on. Save #2 is then asked for. Status:
"⏳ A save is already under way — this one runs as soon as it finishes." It is queued, not refused.
- Hold left on: both Saves end with perm 1 · read 1 · open 0 · writes 0. The bytes are kept, and #2 is refused at its
  turn.
- Hold cleared while #2 waits: perm 2 · read 2 · open 2 · writes 2. **The queued Save #2 runs and writes.** The board
  was not changed for this; see notes.md.
