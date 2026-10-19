# R1 draft — evidence (11 Oct 2026, 4:29–4:57 PM ET; ledger times below are UTC, at each run's end)

`$W` = `/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L2/draft/R1`.

Every suite, probe, harness and benchmark ran through `$W/bin/run.sh`. That script runs `setsid timeout -k 10 600 <cmd>`
in the background, appends the PID to `$W/pids.txt` and waits. It then writes exit code and duration to
`$W/logs/ledger.txt`, and the full output to `$W/logs/<label>.log`. No run timed out: every exit code is 0 or 1. At the
end none of the 50 recorded PIDs, and no member of their process groups, was running.

`/home/user/orbit-board` was never written. `mutate.mjs` was read as text only (Python). No runs of playwright install,
verify:grid, the standards check, the presweep, the gate, validate:math or audit-import.mjs. Nothing was pushed or
posted.

## Pinned blobs

| what | blob |
|---|---|
| base commit | `9b27e8006ddf336b9ebefde54c9c3c4154e52370` (detached in `$W/wt`) |
| base board (`$W/base-board.html`) | `42e8111810b11c0500adb2fd029194c0ccbd9780` |
| patched board (`$W/wt/prioritization-board-grid.html`, final) | `5d811eea8ccabca5f2deaa623c8583552ed0c777` |
| audit-recon.mjs base / patched | `d48361f4787cd90fcc5eca719fa7475fc1f28bdb` / `1f608e7c5a3109018a539f00c929898af671486e` |
| boot.mjs (unchanged) | `9c4f49ad8cec537097bdf485458cfd2a09b06594` |
| mutate.mjs (unchanged, read as text) | `5fc81bf7bb8d5d0645232ce775d296a15215929a` |
| block text (`out/block.mjs.txt`) sha256 | `5d857061435e26805a270ccd36e8429ce2d624155b74a1cad6daa277e6041818` |

- The final board was last written at 20:32:53Z. Every test, probe, mutant and regression run below came after that, so
  all of them ran on blob `5d811ee`. (The 20:30 `probe-fix1` and the 20:31 `bench-fix` runs used an earlier draft;
  later runs superseded them.)
- The block was last written at 20:38:10Z, a comment-only change to its header. The focused fail-before and pass-after
  were run again on the final text (`focused-*-final`).
- The block is verbatim in `audit-recon.mjs` (count 1) and in `$W/focused-recon.mjs` (count 1). `suite.diff` adds
  exactly the block text and nothing else.

## Setup (as given)

```
mkdir -p $W/out $W/logs; git clone -q /home/user/orbit-board $W/wt && git -C $W/wt checkout -q --detach 9b27e80…
ln -s /home/user/orbit-board/node_modules $W/wt/node_modules; cp $W/wt/prioritization-board-grid.html $W/base-board.html
```

## 1. Probe R1 (`money-runtime-probe.mjs`): fail-before and pass-after

- **Probe copies:** made exactly as the task's recipe says, in `$W/probe-base` (the base board copied in) and in
  `$W/probe-final`.
- **Checksums:** `sha256sum` of the four probe files in each copy MATCHES
  `/home/user/orbit-board/recovery/v200/probes/received-2026-10-11/SHA256SUMS` (`probe-*/probe-sums.txt`).
- **Board in each copy:** `cmp` confirms it is the board under test. The probe's own `sourceBlob` reports `42e8111` on
  the base and `5d811ee` on the patched board.
- **BOARD:** unset for every probe run.

| run | cmd | exit | time | result |
|---|---|---|---|---|
| probe-base-money | `node money-runtime-probe.mjs` (cwd probe-base/copy) | 1 | 2.9 s | passed 10, failed 3 |
| probe-final-money | same (cwd probe-final/copy) | 0 | 1.8 s | **passed 13, failed 0** |

On the base, the three defect checks fail (as the lead recorded):

```
R1 carried FY25 execution replaces O&M FY26 plan            got [600000000,100000000,500000000] want [100000000,100000000,0]
R1 exported TOTAL FUNDING agrees with independent carryover got [600000000,600000000] want [100000000,100000000]
R1 exported O&M agrees with independent carryover expectation got [600000000] want [100000000]
```

On the patched board all 13 pass, every control included. The label reads `FY26 · O&M · + OBBBA FY25` (it was
`… · PLANNED (board allocation, O&M) · + OBBBA FY25`). The export reads `TOTAL FUNDING 100000000` twice. The panel's
FY26 button title reads "FY2026 is answered from the imported CCaR QPE".

### Other findings' probes (unchanged by this fix)

| run | exit | time | result |
|---|---|---|---|
| probe-base-code / probe-final-code | 1 / 1 | 2.1 / 2.0 s | 4/6 both; the same two R2 defect checks fail |
| probe-base-races / probe-final-races | 1 / 1 | 7.8 / 8.3 s | 3/6 both; R3, R4 and R5 fail, the 3 CONTROLs pass |

The test names and statuses are identical between base and final. Those are R2–R5, not this finding.

## 2. The new test: fail-before and pass-after

Scenario `v2.00 (R1) — execution precedence by appropriation and effective year` in
`tools/export-audit/audit-recon.mjs`. It sits before the scenario-ran guard, and its `const name` is at two spaces. It
has 19 checks. `SUITE_CHECKS` recorded every one of them in `logs/checks-*.jsonl`.

### Focused harness `$W/focused-recon.mjs`

- It holds the helpers the block needs, copied verbatim from audit-recon.mjs: `failures`/`stopAtFirstFailure`,
  `SEEN`/`chk`, `it`, `num`, `w6Book`, `w6Lbl`, `_w5Append`/`w5Chk`.
- It holds the block verbatim.
- It ends with a failure report and an exit code.
- `./boot.mjs` resolves through the symlink `$W/boot.mjs` to `$W/wt/tools/export-audit/boot.mjs`, so the block's
  `await import('./boot.mjs')` is unchanged.

| run | BOARD | exit | time | result |
|---|---|---|---|---|
| focused-base-final | base-board.html | 1 | 2.8 s | 15 FAILING CHECK(S), 4 pass |
| focused-fix-final | wt board | 0 | 3.0 s | ALL CHECKS PASSED (19/19) |

The four checks that pass on the base are the two CONTROLs ("the board is on O&M, its plan from FY26 …", "variant A ·
FY25 = $40M executed") and the two raw-history guards.

### Full suite `node tools/export-audit/audit-recon.mjs` (MUT_FIRST_FAIL unset)

| run | BOARD | exit | time | result |
|---|---|---|---|---|
| recon-base | base-board.html | 1 | 58.4 s | **15 FAILING CHECK(S)**, every one in the R1 scenario; all other scenarios pass |
| recon-fix | wt board | 0 | 54.4 s | **ALL CHECKS PASSED** (146 SUITE_CHECKS rows; the 19 R1 rows all pass) |

Key fail-before lines from `recon-base`. The full list is in `logs/recon-base-failures.txt`.

```
variant B · FY25          got {"sel":[2025],"t":[0,0,0],"label":"FY25 · O&M"}
                          want {"sel":[2025],"t":[300000000,0,300000000],"label":"FY25 · O&M · PLANNED (board allocation, O&M)"}
variant B · FY26          got t [600000000,100000000,500000000]   want [100000000,100000000,0]
variant B · FY26 · export got US [600000000] O&M [600000000] TOTAL [600000000,600000000]   want 100000000 each
variant B · FY25 + FY26   got t [600000000,100000000,500000000], "FY26 planned, the rest executed"
                          want [400000000,100000000,300000000], "FY25 planned, the rest executed"
variant B · the panel     mixed-total note got [false,false] want [true,true];
                          chips got ["FY25 [on]","FY26 · plan [on]"], "FY26" called PLANNED
                          want ["FY25 · plan [on]","FY26 [on]"], "FY25"
variant B · the export    US [600000000] want [400000000]; NOTE got [] want [true]
variant B · wording       got [true,false,false] want [false,true,true]   ("total is unchanged" present)
variant B · saved FY25 only, reopened   got t [0,0,0] label "FY25 · O&M"; export Scope "FY25 · O&M", US [0]
variant A · FY26          got [600000000,100000000,500000000] want [100000000,100000000,0]
variant A · FY25 + FY26   got [640000000,140000000,500000000] want [140000000,140000000,0]
variant A · the export    got US [640000000] want [140000000]
```

## 3. Mutations

- **Definitions:** `out/mutations.json`.
- **Applicability:** `out/mutations-applicability.txt`. Each find matches the patched board exactly once (Python
  `str.count`) and the base board 0 times.
- **Mutant files:** `$W/mutants/<id>.html`, each the patched board with the find replaced once.
- **Catch:** checked twice. Once with the focused harness (`focused-mut-*`, about 3.5 s each). Once with the full
  `audit-recon.mjs` (`recon-mut-*`, MUT_FIRST_FAIL unset).

Every mutant: exit 1, no "the block threw" or "never ran" line, and failures in the R1 scenario only.

| id | full suite | the failing protection assertion (exact) |
|---|---|---|
| v200-r1-raw-year-exec | exit 1, 56.4 s, 14 failing | variant B · FY26 "FY26 = $100M executed, $0 planned, $100M total, the carried OBBBA named": got t [600000000,100000000,500000000] want [100000000,100000000,0]. Also variant B · FY25 got [0,0,0] want [300000000,0,300000000] |
| v200-r1-saved-year-widens | exit 1, 54.3 s, 8 failing | variant B · saved FY25 only, reopened "the selection stays FY25 (never silently all years) …": got sel [2026,2027,2028,2029,2030] want [2025]. The export Scope got "FY26–FY30 · all years · …" |
| v200-r1-mixed-disclosure-b | exit 1, 56.0 s, 2 failing | variant B · the panel "says planned and executed money in one total …" got [false,false] want [true,true]; variant B · the export "and a NOTE: planned and executed money in one total …" got [] want [true] |
| v200-r1-export-note | exit 1, 56.4 s, 1 failing | variant B · the export "and a NOTE: planned and executed money in one total, FY25 planned, FY26 executed" got [] want [true] |
| v200-r1-help-claim | exit 1, 52.0 s, 1 failing | variant B · wording "the matching rules no longer say the total is unchanged …" got [true,false,false] want [false,true,true] |
| v200-r1-scan-stops-early (new id) | exit 1, 52.2 s, 4 failing | variant A · FY26 "FY26 = $100M executed, $0 planned" got [600000000,100000000,500000000] want [100000000,100000000,0] |
| v200-r1-mix-words-one-kind (new id) | exit 1, 52.3 s, 2 failing | variant B · the panel got [false,true] want [true,true]; variant B · the export NOTE got [false] want [true] |

The focused harness gave the same failing assertions: 14, 8, 2, 1, 1, 4 and 2 failing checks respectively.

### Existing mutate.mjs entries on the patched board

- **Census:** all 1,274 `find:` values were parsed as text.
  - 1,267 are plain JS string literals, decoded by a JS-string unescaper.
  - 7 are `String.raw` templates or top-level string constants, resolved as text.
  - Every one matches exactly once on the patched board, as on the base. **None needs re-anchoring.**
- **Neighbours re-run:** the three entries aimed at the code this fix changes or relies on were built from the patched
  board (find/repl read as text, each matching once) and run through the full `audit-recon.mjs`:

| id | exit, time | caught by its original scenario |
|---|---|---|
| v199-exec-any-appn | 1, 47.3 s, 3 failing | v1.99 items 92–93 · item 93 · FY27 got [800,0,800,800,0] want [5800,5000,800,800,5000] |
| v197w6-flow-no-carry | 1, 47.0 s, 28 failing | v1.97 W6 funds flow · FY25 · appropriation got [1802469,188890,0,433337] want [1580246,111119,0,433337] (and the R1 scenario) |
| v197w6-flow-raw-year | 1, 45.7 s, 20 failing | v1.97 W6 funds flow · FY25 · appropriation (same figures; and the R1 scenario) |

## 4. Regression suites on the patched board (one at a time, MUT_FIRST_FAIL unset)

| run | cmd | exit | time | result |
|---|---|---|---|---|
| regress-audit | `BOARD=<wt board> node tools/export-audit/audit.mjs` | 0 | 7.7 s | ALL CHECKS PASSED |
| regress-audit-other | `… audit-other.mjs` | 0 | 33.4 s | ALL CHECKS PASSED |
| regress-audit-board | `… audit-board.mjs` | 0 | 132.3 s | ALL CHECKS PASSED |

`audit-recon.mjs` (recon-fix, above) also passes in full, including the existing funds-flow scenarios:
"the funds flow", "W6 — the funds flow …", "v1.97 W6 — the funds flow …" and "v1.99 items 92–93 …".

## 5. Cost of reading rows in `flowExecYears` (jsdom; synthetic; `$W/bench/`)

The synthetic set: 4 appropriations × FY25 and FY26 × 1,000 rows each, the OBBBA rule on, ALL YEARS and all
appropriations. The figures are ms for 10 `flowBody()` draws and 10 `flowCalc()` calls.

| data shape | base | patched (final) |
|---|---|---|
| a third of FY25 rows OBBBA (`bench2-*-mode0`, `bench3-fix-mode0`) | 3194 / 1771 | 3150 / 2021 |
| no FY25 row matches (`bench2-*-mode9`, `bench3-fix-mode9`) | 3341 / 2023 | 2824 / 1725 |
| every FY25 row moves (`bench4-*`) | 3031 / 1893 | 6555 / 4071 |

The first patched draft read every row on every call. It took 6309 / 4059 on the first shape (`bench-fix`). The final
code stops once a year's two possible years are both marked, newest year first. The last shape is the remaining worst
case (about 2×), and it is recorded as a limit.

## 6. Panel wording, as drawn (look-B, look-B-all; patched board, Variant B fixture)

FY25 + FY26, O&M:

```
Planned and executed money in one total. FY25: O&M planned; FY26: O&M executed. Executed money is the imported CCaR
QPE; planned money is O&M’s own allocation. $100.00M executed, $300.00M planned.
FY25 is PLANNED, not executed. Nothing in scope has executed in that year yet, … This scope mixes the two: $100.00M
executed, $300.00M planned. A planned year covers O&M only — …
Showing FY25, FY26 · O&M · FY25 planned, the rest executed · 2 lines · total funding $400.00M — separate appropriation
years added together, …
```
