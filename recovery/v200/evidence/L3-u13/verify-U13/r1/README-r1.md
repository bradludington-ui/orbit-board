# verify-U13: the adversarial verifier's directory (12 Oct 2026, 06:52–07:25 ET)

Verifier of the U13 build in `rec/L3/u13`. The verdict is in `VERDICT.md`. This file records what was done, with blobs,
runs, PIDs and what was not done. No product file was changed by me: the only diffs are my mutants of the after board.
Nothing was written, staged, committed or pushed in `/home/user/orbit-board`; I only read it (`git status`, `git log`,
`git hash-object`).

## Copies and blobs (git hash-object)
- `before/` and `after/` are `cp -r` of `rec/L3/base` (node_modules symlink kept, `chmod -R u+w`). `mutate.mjs` was
  removed from both; it is kept only as text: `mutate.base.mjs.txt` (`9f9168fa`) and `mutate.after.mjs.txt`
  (`60d70a54`, copied from the builder).
- **Boards:**
  - `before/prioritization-board-grid.html`: `1375b72b6707faa57c50d528e01ce9611f194998`.
  - `after/prioritization-board-grid.html`: `a88a1e5b932b94225a29cdcfec0678f828847ddd` (copied from the builder).
  - These are the same as orbit-board HEAD `bbc0e05` and, later, `d988a73` (records-only commits).
- **audit-import:**
  - before: `ed9a3437745b35690424cc2610b5bf2e5155f632`.
  - after: `a4b6970fca8c0aaba0a5ff246e22d9c08574f77d` (290 lines added at 7460a and none removed; the added lines equal
    the builder's `src/u13-block.mjs.txt`).
- **Copied unchanged from the builder or the base:** `boot.mjs` `9c4f49ad`, shim `6e2ce2e6`, runner (the builder's,
  copied) `e835140a`, `mkfocused.py` (the builder's `mkfocused-u13.py`, copied) `e50f2a92`.
- **Harnesses I regenerated** (identical to the builder's): `h/focused-u13.mjs` `bb7958ab`, `h/focused-u2-block1.mjs`
  `8d02189b`, `h/focused-u2-block2.mjs` `7771c3ba`. The builder's probe, copied: `h/u13-observe.mjs` `cf57f05c`.
- **My files:**

  | file | blob |
  |---|---|
  | `run.sh` | `88d57819` |
  | `show.py` | `1fe5525c` |
  | `mkmine.py` | `eac46749` |
  | `mkmine2.py` | `d320402c` |
  | `matrix.py` | `62a2c767` |
  | `probe-body.mjs.txt` | `c2f35bc0` |
  | `h/verify-probe.mjs` | `9bd2976d` (the focused harness head up to the U13 block, plus the probe body; observations only) |
  | `diffs/mine-mutants.diff` | `287013f5` |
  | `diffs/var-entry-only.diff` | `9d77a1d7` |
- **Mutants** (`mut/`):
  - The builder's three, rebuilt with `rec/bin/mkmut.py` from the text, are identical to the builder's:
    `v200-u13-pull-while-saving` `270b7833`, `v200-u13-base-while-saving` `ebfcf7d0`, `v200-u13-pull-unchecked`
    `328c1c3d`.
  - The variant `var-entry-only--on-before` is `1eeb45a6`, identical to the builder's.
  - My 22 mutants are listed with their blobs below, and the exact diffs are in `diffs/mine-mutants.diff`.
    `mine-no-base-guard` is byte-identical to the builder's `v200-u13-base-while-saving` mutant (`ebfcf7d0`): a
    cross-check.

| mutant | what it does | blob | failing checks (of 58) |
|---|---|---|---|
| mine-entry-only | check only at entry (before the waits), both after-wait checks removed | 31ffb6ea | 5: 3a 3b Cb |
| mine-entry-plus-base | entry check, base guard kept, adoption re-check removed | 00deacda | 5: 3a 3b Cb |
| mine-between-waits | re-check between `driveDir` and `driveStoreRead` | facc69e9 | 3: 3a Cb |
| mine-after-keepaside | re-check after `keepAside` | a7484212 | 21 |
| mine-after-apply | re-check after `applyStore`/`driveBaseSet`/`persist` | 799ab176 | 32 |
| mine-quiet-only | refused only when quiet | 9fea84bd | 19 |
| mine-loud-only | refused only when not quiet | edbd879b | 27 |
| mine-said-quiet | the Live timer speaks too | cc83a0c5 | 7 |
| mine-silent | a Connect refuses silently | 5f886d58 | 7 |
| mine-returns-true | refusal returns true | 3f753df1 | 6 |
| mine-busy-gt1 | `_saveBusy>1` | 6d877cf0 | 32 |
| mine-autobusy | `_autoBusy` instead | 0c3b4cde | 32 |
| mine-count-instead | `_saveGen++` and adopt | 5f579d6c | 32 |
| mine-refuse-records-base | refused, but the base recorded | e9e4f2e9 | 6: 2 4c |
| mine-refuse-persists | refused, but persist() | dd14be4a | 15 |
| mine-words-no-when | words lose "once the save has finished" | 43fa81b3 | 7 |
| mine-no-render | no render() in the refusal | aab3d338 | **0 (escapes; harmless)** |
| mine-base-else-clash | base guard folded into the condition: a false clash said during a save | 9b00a538 | **0 (escapes: gap)** |
| mine-before-dirty | re-check moved before the DIRTY guard | ae29fe3e | 1: Cb |
| mine-before-notnewer | re-check moved before the not-newer branch | c7fa6435 | 1: Cb |
| mine-no-base-guard | base guard dropped | ebfcf7d0 | 2: 3c |
| mine-shell-only | re-check only on the template shell's branch | e59e055d | 32 |

`out/matrix.txt` lists every focused run and the cases that fail in it. `python3 -I show.py out/<label>.checks.jsonl x`
prints one run's failing checks.

## Runs (all through `run.sh`: `setsid -w timeout -k 10 600`, lock checked first and never present, one at a time)
`logs/runs.txt` has every run, in order, with its start time (ET), exit code, wall seconds and log path. There are 57
runs. The main ones:

| label | start (ET) | exit | wall s | log |
|---|---|---|---|---|
| mkf-u13 / mkf-u2b1 / mkf-u2b2 | 06:58:54–06:58:55 | 0 | <0.5 | logs/mkf-*.log |
| mcount-after-on-after | 06:59:18 | 0 | 2.1 | logs/mcount-after-on-after.log (1310/1310 once) |
| mcount-base-on-before / -on-after | 06:59:20 / 06:59:22 | 0 / 0 | 2.3 / 2.5 | 1307/1307 once each |
| mcount-new-on-before | 06:59:25 | 0 | 2.5 | the 3 new finds missing, as they should be |
| mkmut-v200-u13-* ×3 | 06:59:43–06:59:44 | 0 | <0.3 | 1 match each |
| mkmine | 07:00:58 | 0 | 1.0 | logs/mkmine.log |
| re-u13-on-before | 07:01:07 | 1 | 21.0 | logs/re-u13-on-before.log (34 fail) |
| re-u13-on-after | 07:01:29 | 0 | 19.4 | logs/re-u13-on-after.log |
| re-M-v200-u13-pull-while-saving | 07:01:48 | 1 | 18.8 | 32 fail |
| re-M-v200-u13-base-while-saving | 07:02:07 | 1 | 20.5 | 2 fail |
| re-M-v200-u13-pull-unchecked | 07:02:27 | 1 | 21.6 | 34 fail |
| re-var-entry-only | 07:02:49 | 1 | 20.8 | 11 fail |
| re-u2-block1-on-after / block2 | 07:03:33 / 07:03:44 | 0 / 0 | 10.7 / 24.2 | pass |
| re-u13-on-after-rep2 / rep3 | 07:04:08 / 07:04:29 | 0 / 0 | 21.0 / 20.3 | pass |
| my-mine-* ×20 | 07:04:54–07:11:46 | see table above | 18.1–24.5 | logs/my-mine-*.log |
| probe-on-after / probe-on-before | 07:14:22 / 07:15:13 | 0 / 0 | 8.9 / 11.3 | logs/probe-on-*.log (OBS lines P1–P4) |
| check-before / check-after | 07:15:41 / 07:15:43 | 1 / 1 | 2.4 / 2.1 | identical; only the two git-only checks fail |
| bootsame-after | 07:15:55 | 0 | 8.7 | identical either way |
| other-after | 07:16:04 | 0 | 30.4 | ALL CHECKS PASSED |
| audit-after | 07:16:43 | 0 | 10.0 | ALL CHECKS PASSED |
| recon-after | 07:16:57 | 0 | 57.9 | ALL CHECKS PASSED |
| mkmine2; my-mine-between-waits; my-mine-shell-only | 07:18:52; 07:18:52; 07:19:22 | 0; 1; 1 | 0.3; 30.2; 28.2 | 3 and 32 fail |
| syntax-after-import | 07:21:02 | 0 | 0.1 | `node --check` OK |
| re-obs2-on-after / -on-before | 07:21:02 / 07:21:22 | 0 / 0 | 19.2 / 14.2 | the builder's 17 OBS lines reproduced on both boards |
| matrix; mkdiffs | 07:22:58; 07:24:48 | 0; 0 | <0.3 | out/matrix.txt; diffs/ |

## Probe observations (`h/verify-probe.mjs`, observations only, no expected values)
- **P1** (`logs/probe-on-after.log`, the after board): `driveConnectNow()` and `driveAutoConnect()` during a held save.
  The folder holds newer execution data, shared through the product by Alice's board. Status: "⏳ Nothing was loaded from
  the shared folder: a save was under way. Nothing was changed: what is on screen is as it was. …". In the same Connect,
  `EXDB.ts` went 0 → set, its keys [] → [om], and `prio27execdb` was rewritten. The board flags were unchanged. Once the
  save landed: "✅ Saved …", with WORKING on screen and in the folder's copy.
- **P2:** a refresh held at its read while a whole save runs and lands, then let go. It returns false and changes
  nothing; the next refresh and a reopen agree. The read happens after the gate, so no stale copy is read. Same on
  before.
- **P3:** a Connect while Load theirs waits at its read. It is refused with the words "a save was under way" (on the
  after board). Load theirs then loads REMOTE and keeps WORKING aside. On the before board, the Connect loaded REMOTE
  first, and Load theirs then said the kept slot was occupied.
- **P4:** a quiet refresh during an autosave (DIRTY). The unsaved-changes warning is said by a quiet refresh, and once
  the autosave has landed it is still on screen (false then). Identical on before: pre-existing.

## PIDs
`pids.txt` has 115 lines: a header, then 57 timeout PIDs, each with its child (43 node, 13 python3, 1 bash for
`mkdiffs`). Each line gives the PID, the ET time, the command name, the label and the command. Nothing was killed.
Nothing is still running from this directory. At 07:25 ET, the node processes I saw belonged to
`rec/L3/verify-U13-lateguard`, another agent's directory; I did not touch them.

## Not done (plainly)
- I did not run the full `audit-import.mjs` or `audit-board.mjs` (the lead's). I did not import, execute or run
  `mutate.mjs`; I used text helpers only.
- No Chromium or Playwright: there is no layout change. No playwright install.
- I did not re-run the builder's superseded `dev1-*` runs.
- I did not build or test a corrected wording. The VERDICT gives the suggested words and the check to add.
- I did not measure how often P1 occurs. It needs a Connect during a save while the folder holds newer execution data,
  reprogramming rows or estimates.
- The reprogramming-log and cost-estimate halves of P1 are by code reading only. I ran the execution-data half.
- **Not bounded:** short inline `python3 -I -c` comparison snippets (verdict and value diffs against the builder's
  jsonl, the CONTROL count, the OBS comparison, and writing `mut/var-entry-only--on-before.html`). Shell utilities
  (`grep`, `sed`, `diff`, `cp`, `ls`, `git hash-object`, read-only `git status`/`log` in orbit-board) were not bounded
  either. All node runs and the text helpers (`mcount`, `mkmut`, `mkfocused`, `mkmine`, `matrix`) were bounded.
- A first copy command was refused by the harness's safety check before it ran: an `rm -f` of `mutate.mjs` with an
  unguarded variable path. It was re-issued with `${V:?}` guards and removed only the two `mutate.mjs` copies inside my
  own `before/` and `after/`.
