# R3 draft: evidence

- **Times:** Eastern (UTC in parentheses). Runs took place on 11 Oct 2026, 4:54–5:07 PM ET (20:54–21:07 UTC).
- **Paths:** `$W` = `/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L2/draft/R3`.
  Raw logs are in `$W/logs/`, and each run's exit code and duration are in `$W/logs/<log>.meta`.
- **How commands ran:** every node command went through `$W/run.sh <log> <cwd> <cmd…>`. The script:
  - runs the command as `setsid timeout -k 10 600 <cmd>`;
  - appends the PID to `$W/pids.txt` (annotated copy: `logs/pids-annotated.txt`);
  - waits, then records the exit code and duration.
- **Environment:** `NODE_OPTIONS=--max-old-space-size=8192`, Node v22.22.0. Nothing timed out.
- **Leftover processes:** none. All 19 recorded PIDs were checked as process groups at the end; nothing was running, so
  nothing was killed.

## Setup

```
git clone -q /home/user/orbit-board $W/wt && git -C $W/wt checkout -q --detach 9b27e8006ddf336b9ebefde54c9c3c4154e52370
ln -s /home/user/orbit-board/node_modules $W/wt/node_modules ; cp $W/wt/prioritization-board-grid.html $W/base-board.html
```

- **Base:** HEAD `9b27e80…`, board blob `42e8111810b11c0500adb2fd029194c0ccbd9780`. The `base-board.html` sha256 is
  `03ad86aa…8fe8ff7`.
- **Patched:**
  - board blob `c0c31072380d9e8e9bcb95a1c170945897d694d3` (sha256 `860f7e9a…a44ec`);
  - `audit-import.mjs` blob `6b522d9` → `ca54902ec384c46ca4c6715c0999bb96606059db`.
- **Only files edited:** `$W/wt/prioritization-board-grid.html` (+3 lines) and
  `$W/wt/tools/export-audit/audit-import.mjs` (+58 lines). `/home/user/orbit-board` was only cloned from and read with
  `rev-parse`.

## 1. Probes: fail before, pass after

Probe directories were set up as specified: `probe-base/` holds the base board and `probe-patched/` holds the patched
tree. In both copies the sha256 of all four probe files equals `SHA256SUMS` (`logs/probe-base-sha.txt` and
`logs/probe-patched-sha.txt`, then `diff`: `SHA-MATCH`). `probe-patched/copy/prioritization-board-grid.html` is
byte-identical to `wt/prioritization-board-grid.html` (`cmp`; blob `c0c3107…`). BOARD was never set for a probe.

| run | command (cwd) | exit | time |
|---|---|---|---|
| races, base | `node --import ../copy/runtime-encoding-shim.mjs races-probe.mjs` (`probe-base/races`) | 1 | 9.6 s |
| races, patched | the same (`probe-patched/races`) | 1 | 7.5 s |
| R1 money, patched | `node money-runtime-probe.mjs` (`probe-patched/copy`) | 1 | 1.7 s |
| R2 code, patched | `node code-runtime-probe.mjs` (`probe-patched/copy`) | 1 | 1.8 s |

The races runs exit 1 on the patched board only because of R4 and R5. The R3 lines:

| case | base | patched |
|---|---|---|
| R3 locked cycle entered during folder read | **failed**. mainWrites 1, historyWrites 1, written "LOCKED", returned true, status "🔒 Not kept — PB27 is a locked view. ✅ Saved O&M FY27 to the shared folder — 5 KB…" | **passed**. mainWrites 0, historyWrites 0, written null, returned false, status "🔒 Writing to the shared folder is off while PB27 is on screen. It is a locked cycle, read only — the change was not kept. ↩ Leave the view to work the plan." |
| R3 CONTROL normal delayed folder save | passed: mainWrites 1, written "WORKING", "✅ Saved O&M FY27…" | passed (the same) |

The other cases are reported only, because they belong to other drafts:

- **R4 failed import hold during file read:** fails on both. Patched: writes 1, savedFF "PARTIAL FF", the same as base.
- **R5 actual history restore during earlier folder close:** fails on both. After the close, dirty false and
  baseDirty false, the same as base.
- **R4 CONTROL and R5 CONTROL:** pass on both.

R1 and R2 on the patched board give the same result as the lead's base record:

- **R1:** fails "R1 carried FY25 execution replaces O&M FY26 plan", "R1 exported TOTAL FUNDING agrees with independent
  carryover expectation" and "R1 exported O&M agrees with independent carryover expectation". Its 10 controls pass.
- **R2:** fails "R2 normalized over-limit Unicode expansion refused; previous code retained" and "R2 accepted EEIC may
  not exceed10after uppercase normalization". Its 4 controls pass.

The R3 fix does not touch these paths.

## 2. The new test: fail before, pass after (focused harness)

- **Harness:** `$W/focused.mjs`, built by `$W/mkfocused.py` with `--require-in-suite`.
- **What it holds:**
  - copied verbatim from the patched `audit-import.mjs`: `keepBoards`, `SEEN`/`chk`, `W1H`, and
    `w3Hook`/`w3Hist`/`w3Err`;
  - the block text exactly as committed: `out/block.mjs.txt` occurs exactly once in the suite and once in
    `focused.mjs`.
- **Imports:** `$W/wt/tools/export-audit/boot.mjs`.
- **Summary:** prints the scenarios it heard and every failure, and exits 1 on any failure.

| run | command | exit | time | result |
|---|---|---|---|---|
| base | `BOARD=$W/base-board.html node focused.mjs` | 1 | 6.9 s | 4 FAILING CHECK(S) |
| patched | `BOARD=$W/wt/prioritization-board-grid.html node focused.mjs` | 0 | 6.6 s | ALL CHECKS PASSED |
| base, all checks recorded | `SUITE_CHECKS=logs/checks-base.jsonl …` | 1 | 8.7 s | 8 checks: 4 FAIL, 4 PASS |
| patched, all checks recorded | `SUITE_CHECKS=logs/checks-patched.jsonl …` | 0 | 9.1 s | 8 checks: 8 PASS |

The four failures on base (`logs/focused-base.log`), each on the protection:

```
(a) PB27 put on screen during the read | nothing is written to the folder (no copy, no history, no lock), and it is byte-identical
    got [["hist:spmt-2027-om-20261011-210005.json","main:spmt-2027-om.json","lock:spmt-2027-om.lock.json"],false]   want [[],true]
(a) PB27 put on screen during the read | the save does not tell its caller it saved
    got true   want false
(a) PB27 put on screen during the read | the board does not say saved, and says writing to the folder is off
    got [true,false]   want [false,true]
(b) ⬆ Publish now, PB27 put on screen during the read | nothing is written, it reports failure, and no publish is recorded
    got [true,["hist:spmt-2027-om-20261011-210007.json","main:spmt-2027-om.json","lock:spmt-2027-om.lock.json"],false,true,1791752407204]   want [true,[],true,false,1]
```

These pass on base as well as patched, showing the fixture is live:

- "(a) the save reached the read and waited there; PB27 is then on screen";
- "(a) then the view left | the working plan is back, still unsaved";
- "(a) then the view left | the next Save writes the working plan (a CONTROL)";
- "(c) nothing put on screen during the read (a CONTROL) | the delayed save writes the working plan, keeps the copy it
  replaced, and says saved".

**Draft history.** The first draft (`logs/focused-base-draft1.log`) also failed "the working plan is back, still
unsaved" on base, with DIRTY false. Two debug runs (`logs/dbg-base.log`, `logs/dbg-base2.log`, exit 1, 6.7 s and
7.4 s) traced this to the board's own opening timer, `setTimeout(()=>{ DIRTY=false; … }, 0)` at board line 31476. It
fired during the held read and cleared the edit's DIRTY. It was not a board defect.

The block now waits for it, with `await pause(5); // the opening's own bookkeeping runs once the page has loaded`.
This is the idiom audit-import.mjs already uses at its line 5751. After that change, base fails only the four
protection checks above (`logs/focused-base-draft2.log`), and the patched board passes (`logs/focused-patched-draft2.log`).

## 3. Mutant catches

Each mutant is the patched board with the find replaced once (`$W/mutants/<id>.html`). Each was run with
`BOARD=$W/mutants/<id>.html node focused.mjs`.

| id | find count (patched) | exit | time | failing checks (scenario heard; no "threw", no "never ran") |
|---|---|---|---|---|
| v200-r3-cycblock-gone (blob 38dbb3f6) | 1 | 1 | 6.7 s | (a) nothing is written… got `[["hist:…","main:spmt-2027-om.json","lock:spmt-2027-om.lock.json"],false]`; (a) the save does not tell its caller it saved got `true`; (a) the board does not say saved… got `[true,false]`; (b) nothing is written, it reports failure… got `[true,[hist,main,lock],false,true,<time>]` |
| v200-r3-cycblock-falls-through (blob 5e12b4a7) | 1 | 1 | 7.1 s | the same four checks, with the same values |
| v200-r3-cycblock-says-saved (blob f448d0d5) | 1 | 1 | 6.3 s | (a) the save does not tell its caller it saved got `true` want `false`; (b) nothing is written, it reports failure, and no publish is recorded got `[true,[],true,true,<time>]` want `[true,[],true,false,1]` |

Logs: `logs/mut-<id>.log`. All controls passed under every mutant.

## 4. Existing mutation anchors

`python3 -I $W/findscan.py tools/export-audit/mutate.mjs base=… patched=…` reads mutate.mjs as text only; it never
imports or runs it. Results:

- 1274 `find:` entries, all resolved (5 through top-level consts);
- count ≠ 1 on base: 0;
- count ≠ 1 on patched: 0;
- count changed: 0.

No re-anchor is needed. Details are in `out/mutations-applicability.txt`, `logs/findscan.txt` and
`logs/findscan.json`.

## 5. Regression check: the neighbouring folder-save blocks

- **Harness:** `$W/regress.mjs`, built by `$W/mkregress.py`. It holds the same verbatim helpers and these five blocks
  of the patched `audit-import.mjs`, verbatim:
  - "v1.95 — Save acknowledges exactly what it wrote (the shared folder)";
  - "v1.95 — ⬆ Publish now in the shared folder is the folder save, with its checks";
  - "v1.97 — ↶ Put this back pins its appropriation and year before its first wait (item 78)";
  - "v1.97 — a folder save keeps the copy it replaces, or writes nothing (item 79)";
  - the new R3 block.
- **Not run here:** the full `audit-import.mjs`, which the lead runs.

| run | exit | time | result |
|---|---|---|---|
| `BOARD=$W/wt/prioritization-board-grid.html node regress.mjs` | 0 | 63.7 s | ALL CHECKS PASSED (all 5 scenarios heard) |
| `BOARD=$W/base-board.html node regress.mjs` | 1 | 76.3 s | 4 failing checks, all R3 (the four above); the four older blocks pass |

## 6. Informational scratch run (not committed)

`$W/dbg/explore.mjs` ran on the patched board: exit 0, 10.4 s, `logs/explore-patched.log`. It checks where else a
locked view can land during a save.

**Folder save, cycle put on screen at the history, main or lock close** (after the bytes were built):

- the folder gets the working plan ("WORKING TWO"), never the locked one, and the call returns true;
- the board says "🔒 Not kept — PB27 is a locked view. ✅ Saved O&M FY27 to the shared folder …";
- after leaving the view: note "WORKING TWO", DIRTY true, and browser storage holds "WORKING TWO".

This is outside R3's contract, which is the re-check after the read. It is recorded as the limit in `notes.md`.

**File save (`saveInPlaceFile`), cycle put on screen during the file read:**

- writes 0 and downloads 0;
- `buildSavedHtml` already refuses a locked view, so the save fell to `publishState`, which refused too;
- the status says "🔒 Downloading a copy of the board is off while PB27 is on screen…".

Nothing is written, so no change is proposed there.
