# R2 evidence: an EEIC is checked in the form it is stored

`$W` = `/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L2/draft/R2`.
Every run: Node v22.22.0, jsdom 27.4.0, `NODE_OPTIONS=--max-old-space-size=8192`. Each run went through `$W/run.sh <label> <cwd> <cmd…>`.
That script turns job control off (`set +m`) and runs `setsid timeout -k 10 600 <cmd>` in the background. It appends `$!` to
`$W/pids.txt`, waits, and logs the exit code and duration to `$W/logs/runs.txt`. After each run it checks that the process
group is gone. With job control off, `setsid` does not fork, so the recorded PID is the session leader and the group id.
Suites ran with `MUT_FIRST_FAIL` unset, and the probes ran with `BOARD` unset. Raw logs are in `$W/logs/<label>.log`.
Heavy runs went one at a time.

There is one procedural slip. The very first focused run on the base (pid 1720) used an inline function with job control on.
`setsid` forked, so neither the exit code nor the duration was captured. It finished, and its output was the same as the
re-run below (pid 1812). The re-run is the one recorded.

## Setup

```
git clone -q /home/user/orbit-board $W/wt && git -C $W/wt checkout -q --detach 9b27e8006ddf336b9ebefde54c9c3c4154e52370
ln -s /home/user/orbit-board/node_modules $W/wt/node_modules; cp $W/wt/prioritization-board-grid.html $W/base-board.html
```
- HEAD is 9b27e80. The base board blob is `42e8111810b11c0500adb2fd029194c0ccbd9780` (sha256 `03ad86aa…`).
- The patched board blob is `62276be5b97e730243dea4b693750e51338baf2b` (sha256 `0bfb9c37…`).
- The patched `audit-board.mjs` blob is `b57d70fd408e7141997f1ff95b89cbe1d94cefd1`.
- `/home/user/orbit-board`: read-only git only. `git status --porcelain` there is empty at the end.

A pre-check that upper-casing never adds edge whitespace (`node -e`, scanning every code point) found:
`edge:0, grow:102, maxg:2, nonidem:0`. So `codeTake`'s own trim is a no-op on the trimmed, upper-cased string, and the
checked form is exactly the stored form. Other values: ß×10 upper-cases to 20 characters, ﬃ×4 to `FFIFFIFFIFFI` (12), and
ß×5 to `SSSSSSSSSS`.

## Probe R2 (`code-runtime-probe.mjs`): 4/6 before, 6/6 after

The probe copies were built exactly as the task specifies (`$W/probe-base`, `$W/probe-patched`). In both copies the sha256 of
all four probe files equals `received-2026-10-11/SHA256SUMS` (`$W/probe-*/sums.txt`: "SHA256SUMS match: True").

| run | cmd (cwd `$W/probe-<x>/copy`) | exit | dur | result |
|---|---|---|---|---|
| probe-code-base | `node code-runtime-probe.mjs` | 1 | 1.7 s | `{"passed":4,"failed":2}` |
| probe-code-patched | same | 0 | 1.7 s | `{"passed":6,"failed":0}` |

On the base, two checks fail:
- "R2 normalized over-limit Unicode expansion refused; previous code retained": actual `"SSSSSSSSSSSSSSSSSSSS"`, expected `"ABCDE"`.
- "R2 accepted EEIC may not exceed10after uppercase normalization": actual `false`, expected `true`.

This matches the lead's fail-before. On the patched board those two checks pass (actual `"ABCDE"` and `true`). All four controls
pass on both boards, including "whole-board boot has no jsdom script errors" `[]`.
The result files are `$W/probe-base/code-runtime-results.json` and `$W/probe-patched/code-runtime-results.json`.

## Test: full `audit-board.mjs` (the new block committed in `$W/wt`), fail before and pass after

| run | BOARD | exit | dur | result |
|---|---|---|---|---|
| suite-board-base | `$W/base-board.html` | 1 | 144.9 s | `2 FAILING CHECK(S)`, both R2 |
| suite-board-patched | `$W/wt/prioritization-board-grid.html` | 0 | 137.0 s | `ALL CHECKS PASSED` |
| suite-board-patched-final (with `SUITE_CHECKS`) | patched | 0 | 146.0 s | `ALL CHECKS PASSED`; 1510 checks, 0 failing, 69 scenarios |

On the base (`logs/suite-board-base.log`) these two checks fail:
```
--- v2.00 (R2) — an EEIC is checked in the form it is stored | EEIC typed as ß×10
    upper-cased it is 20 characters: refused, the list keeps AAAAA, the field keeps what was typed, marked, the status says EEIC not changed
        got ["SSSSSSSSSSSSSSSSSSSS",null,"ßßßßßßßßßß",false]   want ["AAAAA","true","ßßßßßßßßßß",true]
--- v2.00 (R2) — an EEIC is checked in the form it is stored | EEIC typed as ﬃ×4
    upper-cased it is 12 characters: refused, the list keeps AAAAA, the field keeps what was typed, marked, the status says EEIC not changed
        got ["FFIFFIFFIFFI",null,"ﬃﬃﬃﬃ",false]   want ["AAAAA","true","ﬃﬃﬃﬃ",true]
```
The four CONTROLs pass on the base, and no other check in the suite fails.

The patched `SUITE_CHECKS` ledger is `logs/suite-board-patched-checks.jsonl`. Its R2 rows all pass:
```
EEIC typed as ß×10        ["AAAAA","true","ßßßßßßßßßß",true]
EEIC typed as ﬃ×4         ["AAAAA","true","ﬃﬃﬃﬃ",true]
EEIC typed as ABCDEFGHIJK ["AAAAA","true","ABCDEFGHIJK",true]      (CONTROL)
EEIC typed as " ab12c "   ["AB12C",null," ab12c ",false]           (CONTROL)
EEIC typed as ABCDEFGHIJ  ["ABCDEFGHIJ",null,"ABCDEFGHIJ",false]   (CONTROL)
EEIC typed as ß×5         ["SSSSSSSSSS",null,"ßßßßß",false]        (CONTROL)
```
The block sits before the `_selfRead` "every named scenario must run" guard. Its `const name` is at a two-space indent, and
the guard sees it: the base failures name it, and the patched run reports no "never ran".

## Focused harness (`$W/focused.mjs`)

The harness imports `boot`/`seed` from `$W/wt/tools/export-audit/boot.mjs`. It holds `chk`, `it` and the W1 helpers
(`_w1Mark`/`_w1Release`/`_w1Settle`, `w1ev`, `w1json`), copied verbatim from `audit-board.mjs`, and the R2 block exactly as
committed. Its text equals `out/block.mjs.txt`, checked by a Python `count == 1` in both the suite and the harness. It prints
the failures and exits 1 on any failure.

| run | BOARD | exit | dur | result |
|---|---|---|---|---|
| focused-base | base | 1 | 2.4 s | 2 failing: ß×10, ﬃ×4 (the same got/want as above) |
| focused-patched | patched | 0 | 2.5 s | ALL CHECKS PASSED |

## Mutants: applicability and catch are recorded separately

Applicability (finds counted as text on the patched board) is in `out/mutations-applicability.txt`. Each proposed find
matches the patched board once and the base board 0 times. The mutant boards are in `$W/mutants/`.

| mutant | find count (patched) | focused (exit, dur) | full audit-board (exit, dur) | failing assertions, suite |
|---|---|---|---|---|
| v200-r2-eeic-checked-raw | 1 | 1, 2.3 s | 1, 148.6 s | 2: R2 "EEIC typed as ß×10" and "EEIC typed as ﬃ×4" |
| v200-r2-eeic-not-upper | 1 | 1, 2.4 s (rerun pid 3305) | 1, 147.3 s | 2: the same two R2 refusal checks |
| v199-rcn-cut (existing, unchanged find) | 1 | 1, 2.8 s | 1, 157.0 s | 4: item 91 "RCN and EEIC, typed" plus R2 ß×10, ﬃ×4 and the 11-character CONTROL |

The assertions the full suite reported:
- **v200-r2-eeic-checked-raw** (`logs/suite-board-mut-v200-r2-eeic-checked-raw.log`). The mutant equals the base board apart from
  the comment.
  - ß×10: got `["SSSSSSSSSSSSSSSSSSSS",null,"ßßßßßßßßßß",false]`, want `["AAAAA","true","ßßßßßßßßßß",true]`
  - ﬃ×4: got `["FFIFFIFFIFFI",null,"ﬃﬃﬃﬃ",false]`, want `["AAAAA","true","ﬃﬃﬃﬃ",true]`
- **v200-r2-eeic-not-upper** (`logs/suite-board-mut-v200-r2-eeic-not-upper.log`): the same two got/want pairs.
- **v199-rcn-cut** (`logs/suite-board-mut-v199-rcn-cut.log`):
  - item 91 "11 characters each: refused…": got `["1234567890","ABCDEFGHIJ",null]`, want `["11111","AAAAA","true"]`
  - R2 ß×10: got `["SSSSSSSSSSSSSSSSSSSS",null,"ßßßßßßßßßß",false]`
  - R2 ﬃ×4: got `["FFIFFIFFIFFI",null,"ﬃﬃﬃﬃ",false]`
  - R2 CONTROL ABCDEFGHIJK: got `["ABCDEFGHIJ",null,"ABCDEFGHIJK",false]`

None of these was a crash, a boot error or a skipped scenario: every failure is a got/want on a named check, and no
"the block threw" or "never ran" appears.

One extra was hand-checked and is NOT proposed: the storage side, where the EEIC is kept trimmed but not upper-cased (`mutants/extra-eeic-kept-not-upper.html`,
find count 1). Focused run: exit 1, 2.3 s. It is caught only by CONTROL-labelled checks:
- `" ab12c "` got `["ab12c",null," ab12c ",false]`, want `["AB12C",…]`
- ß×5 got `["ßßßßß",null,"ßßßßß",false]`, want `["SSSSSSSSSS",…]`

It is recorded here for the lead to decide on.

`v200-r2-eeic-not-upper` and `v200-r2-eeic-checked-raw` behave the same for string input, because `codeTake` trims. They are
different source edits: one reverts the check to the typed text, and the other drops only the upper-casing.

## Existing mutation finds

`count_finds.py` reads `tools/export-audit/mutate.mjs` as text and never imports or runs it. It found 1274 entries and 1274
finds; 1272 were resolved as literals or constants, and the 2 `String.raw` finds were read verbatim. Every find matches exactly
once on the patched board and on the base board. None changed, and no re-anchor is needed (`logs/mutate-find-counts.txt`).

## Regression checks on the patched board

| run | cmd | exit | dur | result |
|---|---|---|---|---|
| suite-recon-patched | `BOARD=<patched> node tools/export-audit/audit-recon.mjs` (it calls `rcnSet` with ASCII codes) | 0 | 49.8 s | ALL CHECKS PASSED |
| probe-money-patched | `node money-runtime-probe.mjs` | 1 | 1.7 s | `{"passed":10,"failed":3}`. The same three R1 defect checks fail with the same got values as the lead's base record ([600000000,100000000,500000000], [600000000,600000000], [600000000]). R1 is not in this change. |
| probe-races-patched | `node --import ../copy/runtime-encoding-shim.mjs races-probe.mjs` (cwd `races`) | 1 | 8.2 s | The three CONTROLs pass. R3, R4 and R5 fail as in the lead's base record: R3 mainWrites 1, written "LOCKED"; R4 writes 1, savedFF "PARTIAL FF"; R5 after dirty false, baseDirty false. Not in this change. |

Not run, per the rules: audit-import, verify:grid, the standards check, the presweep (`npm run mutate`), the gate,
validate:math and playwright install.

## Processes

`$W/pids.txt` holds 20 PIDs: the 19 runs in `$W/logs/runs.txt`, plus pid 1720, the forked first run noted above. After the last run, no recorded
pid or group answers `kill -0`, and `ps` shows no process of this draft. Nothing is left running.
