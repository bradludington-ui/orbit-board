# R1 follow-up (Brad's decisions of 11 Oct): draft evidence

These are DRAFT checks. They were run in an isolated clone, not on a commit:
- Nothing here is committed-suite sensitivity at a branch SHA, and nothing here is integrated validation.
- `/home/user/orbit-board` was never written to.
- No push, no post.
- The `mutate.mjs` sweep, the gate, `validate:math`, `verify:grid`, the standards check, `playwright install` and the full
  `audit-import.mjs` were not run.
- `mutate.mjs` was read as text only, never imported or run.

`W=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L2/draft/R1b`

## Base, environment and blobs
- **Clone:** `git clone -q /home/user/orbit-board $W/wt`, then
  `git -C $W/wt checkout -q --detach e635775ad1f33abe68af13bbae5557c6c3dd5543`. `node_modules` is symlinked to
  `/home/user/orbit-board/node_modules`. `$W/base-board.html` is a copy of the base board.
- **Environment:** Node v22.22.0, jsdom 27.4.0, `NODE_OPTIONS=--max-old-space-size=8192`, 4 CPUs shared with other agents.
  Heavy commands ran one at a time.
- **Runner:** `$W/bin/run.sh`. Each run uses `setsid env … timeout -k 10 600 <cmd>`, records its PID in `$W/pids.txt` and
  writes start/end/exit/duration into its log. There were 31 runs, and no recorded PID is alive at the end.

| file | base blob (e635775) | draft blob |
|---|---|---|
| prioritization-board-grid.html | fd728f1ce84a5eef85cf33c6e2f2ca23374d3a3f | 2365dacae7053bf69f1a982dcd5de0562966a182 |
| tools/export-audit/audit-recon.mjs | 1f608e7c5a3109018a539f00c929898af671486e | f606712bc7eaf723d4ba61634c639990d204772d |
| tools/export-audit/mutate.mjs | f8d607de1af43236f07b062e714e5a7823f0be78 | unchanged (entries proposed in mutations.json / mutations.mjs.txt) |
| boot.mjs, audit.mjs, audit-other.mjs, audit-board.mjs | 9c4f49a…, cc5af0b…, d89396b…, b57d70f… | unchanged |

`git diff --check e635775` → exit 0.

## The defect as observed on the base (exploration, `$W/explore/explore.mjs`, not a suite)
`explore-base.log`: exit 0, 8.0 s, BOARD=$W/base-board.html. On the R1 fixture:
- **Variant A, ALL YEARS** ($140M executed, $0 planned): the panel box said "Planned and executed money in one total …
  $140.00M executed, $0.00M planned." The export carried the NOTE. The planned note said "FY27, FY28, FY29, FY30 are PLANNED,
  not executed … This scope mixes the two: $140.00M executed, $0.00M planned."
- **Variant B, FY25 + FY26** ($100M executed + $300M planned): "FY25 is PLANNED, not executed. Nothing in scope has executed
  in that year yet …"
- **The FY25 button:** "FY2025 has no O&M execution imported, so O&M is answered from this board’s own allocation". Its only
  O&M row was imported under FY25 and is counted in FY26.
- **Variant B, FY26 + FY27** ($100M executed, $0 planned): the NOTE and the box were present.
- **Probe-like board** (MS.base 2025, FY25 never planned, ALL YEARS: $100M executed, $0 planned): the NOTE and the box were
  present.

`explore-patched.log` (exit 0, 4.1 s) ran on an intermediate draft. Its headline read "This total is"; the final reads "This
total holds". It is not evidence.

## Suites (full runs)
| log | command (cwd $W/wt) | exit | s | key lines |
|---|---|---|---|---|
| recon-base.log | `BOARD=$W/base-board.html SUITE_CHECKS=… node tools/export-audit/audit-recon.mjs` (suite with the new block) | 1 | 76.6 | 9 FAILING CHECK(S): see below |
| recon-patched.log | `SUITE_CHECKS=… node tools/export-audit/audit-recon.mjs` (BOARD unset → draft board) | 0 | 72.3 | ALL CHECKS PASSED; 163 w5 checks, 0 failed |
| audit-patched.log | `node tools/export-audit/audit.mjs` | 0 | 12.3 | ALL CHECKS PASSED |
| audit-other-patched.log | `node tools/export-audit/audit-other.mjs` | 0 | 41.3 | ALL CHECKS PASSED |
| audit-board-patched.log | `node tools/export-audit/audit-board.mjs` | 0 | 142.1 | ALL CHECKS PASSED |

**Base run, by scenario** (`recon-base.checks.jsonl`):
- **"v2.00 (R1) — execution precedence…":** 19 checks, 18 pass, 1 fails. The one failure is the changed expectation, "the year
  chips agree … no year is called PLANNED, not executed": got `[[…],"FY25"]`, want `[[…],""]`.
- **"v2.00 (R1) — mixed totals are said with their amounts…":** 17 checks, 9 pass, 8 fail.
  - The 8 that fail:
    - E panel: no PLANNED headline, and the $40.00M/$500.00M headline;
    - A export: no NOTE;
    - A panel: no box, no PLANNED, the $140.00M/$0.00M headline;
    - B FY26 + FY27 export: no NOTE;
    - B FY26 + FY27 panel;
    - B FY25 + FY26 panel;
    - B FY25 alone, the planned note: stored under FY25 / counted in FY26;
    - B, the FY25 button.
  - The 9 that pass: the 7 CONTROLs, plus the E export NOTE and the E panel box (both "kept", so they pass before and after).
- No other scenario failed.

## Money probe (unchanged), git-archive-style copy
- **Copy:** `$W/probe/copy` holds the draft board, `tools/`, `package.json`, the `node_modules` symlink, and
  `money-runtime-probe.mjs` and `runtime-encoding-shim.mjs` from `recovery/v200/probes/received-2026-10-11`.
- **sha256 match SHA256SUMS:** 849c46a7… for the probe, e689710a… for the shim.
- **Blobs:** the copy's board, boot.mjs and audit-recon.mjs blobs equal the draft's (2365dac…, 9c4f49a…, f606712…). BOARD unset.
- **Run:** `money-probe-patched.log`, `node money-runtime-probe.mjs` in `$W/probe/copy`. Exit 0, 1.9 s,
  `{"passed":13,"failed":0,"sourceBlob":"2365dacae7053bf69f1a982dcd5de0562966a182",…}`. The results file is
  `$W/probe/money-runtime-results.json`.

## Mutation applicability (text only)
- **Readers:**
  - `$W/bin/mcatalog.mjs` is a JS tokenizer over `mutate.mjs` text. It handles single, double and backtick quotes,
    String.raw, `+` concatenation, `const NAME = <literal>` constants, and entries that share a line. Counting is
    `src.split(find).length - 1`, as `mutate.mjs` counts.
  - `$W/bin/mcount-repo-copy.py` is a copy of `recovery/v200/bin/mcount.py`.
  - Both readers decode all 1,286 entries' find and repl identically: 0 differ (`logs/py-entries.json` vs
    `logs/js-entries.json`).
- **Base board:** 1,286 entries, 1,286 match once (both readers).
- **Draft board:** 1,286 entries, 1,285 match once. `v200-r1-mixed-disclosure-b` matches 0 times. Its find was the old
  `flowIsMixed` line.
  - The other six v200-r1-* entries match once each: raw-year-exec, saved-year-widens, export-note, help-claim,
    scan-stops-early, mix-words-one-kind.
- **New entries:** the 10 new entries and the re-anchored `mixed-disclosure-b` match the draft board once each.
- **Integrated copy:** a text copy of `mutate.mjs` with the re-anchor and the 10 entries inserted, `$W/explore/mutate-integrated.mjs.txt` (diff: `out/mutate-integration.diff`).
  - It has 1,296 entries, each matching the draft board once. Both readers agree.
  - `node --check` on a copy of it exits 0. That checks syntax only and executes nothing.
- **Current branch head:** `/home/user/orbit-board` moved during this work, to `1736753` (R2 follow-up, R4, R5, R3
  follow-up). In a scratch clone at `1736753`:
  - `git apply --check` passes for both `board.diff` and `suite.diff`.
  - With both applied, head's catalog has 1,294 entries, 1,293 matching once. Only `v200-r1-mixed-disclosure-b` is missing,
    and the re-anchor fixes it. The 10 new entries and the re-anchor match once each.
  - No suite was run at that head.

## Mutants observed with the full audit-recon (no MUT_FIRST_FAIL, draft board + one mutation each)
| mutation | exit | s | failing checks (all in the R1 scenarios; no other scenario failed) |
|---|---|---|---|
| v200-r1-mixed-by-kind (new) | 1 | 70.4 | 4: A export, A panel, B FY26+FY27 export, B FY26+FY27 panel |
| v200-r1-export-mix-by-kind (new) | 1 | 56.6 | 2: A export, B FY26+FY27 export |
| v200-r1-panel-mix-by-kind (new) | 1 | 68.4 | 2: A panel, B FY26+FY27 panel |
| v200-r1-allyears-note-dropped (new) | 1 | 54.0 | 1: E export (the kept NOTE) |
| v200-r1-allyears-box-dropped (new) | 1 | 56.3 | 1: E panel (the kept box) |
| v200-r1-planned-beside-executed (new) | 1 | 51.9 | 5: E panel, A panel, B FY26+FY27 panel, B FY25+FY26 panel, and R1's changed check |
| v200-r1-amounts-total-as-executed (new) | 1 | 55.6 | 2: E panel ($540.00M said executed), B FY25+FY26 panel |
| v200-r1-stored-tooltip-unsaid (new) | 1 | 76.0 | 1: B, the FY25 button |
| v200-r1-stored-note-unsaid (new) | 1 | 69.6 | 2: B FY25+FY26 panel, B FY25 alone planned note |
| v200-r1-stored-by-effective-year (new) | 1 | 80.4 | 3: B FY25+FY26 panel, B FY25 alone planned note, B FY25 button |
| v200-r1-mixed-disclosure-b (re-anchored) | 1 | 64.0 | 5: R1 "says planned and executed money in one total…", R1 export NOTE, E export, E panel, B FY25+FY26 CONTROL |
| v200-r1-raw-year-exec (existing) | 1 | 60.5 | 27 (14 in the R1 scenario, 13 in the new one) |
| v200-r1-saved-year-widens (existing) | 1 | 47.3 | 14 (8 + 6) |
| v200-r1-export-note (existing) | 1 | 50.5 | 3 (1 + 2) |
| v200-r1-help-claim (existing) | 1 | 64.2 | 1 (R1 wording) |
| v200-r1-scan-stops-early (existing) | 1 | 56.0 | 7 (4 + 3) |
| v200-r1-mix-words-one-kind (existing) | 1 | 68.4 | 4 (2 + 2) |

Summaries are in `logs/mut-summary.txt` and `logs/mutx-summary.txt`; per-check verdicts are in `logs/mut*-*.checks.jsonl`.

## Commands outside the runner (light, no suite)
- `node --check tools/export-audit/audit-recon.mjs`: exit 0, run twice.
- `node -e` syntax check of the board's 4 inline scripts via `new Function`: no errors.
- `timeout -k 10 600 python3 -I` and `timeout -k 10 600 node $W/bin/mcatalog.mjs dumpall` to compare the two readers.
- `node $W/bin/mcatalog.mjs write` (mutant files into `$W/mut`, `$W/mut-existing`).
- `node $W/bin/mcatalog.mjs count` at head 1736753.
- `timeout -k 10 60 node --check` on the integrated `mutate.mjs` copy.
- git read-only commands on `/home/user/orbit-board`: log, status, diff, and clones into `$W/wt` and `$W/head`.
