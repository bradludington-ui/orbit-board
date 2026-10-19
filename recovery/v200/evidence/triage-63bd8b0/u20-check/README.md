# U20 checker: the builder's runs re-run, plus controls that remove only the trigger and routes with no shortcut

**Verdict: REPRODUCED. I agree with the builder.** On board `98eed7e8` (orbit-board `63bd8b0`), a save waiting for another
tab's `orbit-save` Web Lock is not counted in `_saveBusy`. A refresh during that wait records the folder's copy as the one the
work came from. The waiting save then writes over that copy **without asking**. With a history copy under ten minutes old,
the overwritten copy is **in no place the board can reach** after one more Save.

This reproduces:
- on the builder's runs, re-run here and byte-identical;
- on routes with **no harness shortcut** (BR-Wreal, BR-Wrealtick, BR-Wrealh);
- against controls that **remove only the trigger** (`*count`), which behave correctly.

Routes (i) ↶ Put back and (ii) adoption do no harm, as the builder found. The critique of the builder's work is in
**`CHECK.md`**. The proposal for the separate O4 path, which is not applied and was not run, is in **`PROPOSAL.md`**.

**When.** Times are Eastern, from `TZ=America/New_York date`, on Mon 12 Oct 2026.
- Work in this directory ran from **11:38 to 11:57 AM ET**.
- A usage-limit break followed.
- It resumed from **3:19 PM ET** and ended at **3:30 PM ET**. The last bounded run, `labels-diff`, started at 3:30:14 PM
  ET; it found that every label in `runs.txt` has PIDs in `pids.txt`, and every label in `pids.txt` has a line in `runs.txt`.

## What was and was not touched

- **Reproduction and measurement only.** Nothing in `/home/user/orbit-board` or `/home/user/orbit-ui` was edited, staged,
  committed or pushed.
  - orbit-board at 3:21 PM ET: HEAD `a386223` (records commits by other work since `63bd8b0`), working tree clean.
    `HEAD:prioritization-board-grid.html` = `63bd8b0:` = `98eed7e8`, the empty template.
  - orbit-ui at 3:21 PM ET: ` M ui-concept/CHUNK3.md`, `?? node_modules`, from the separate UI session. They were not written
    here; this check only ran `git status` there.
- **The builder's files were never edited.** They were copied into `rerun/` and re-hashed unchanged at 3:21 PM ET.
- **The rules held:**
  - `mutate.mjs` was never imported, executed or read;
  - `playwright install` was never run, and Chromium was `/opt/pw-browsers/chromium` through `b63/tools/chrome.mjs`;
  - the full `audit-import.mjs` and `audit-board.mjs` were not run;
  - `AUDIT_IMPORT_RUNNING` was checked before every node or Chromium run. It was never present, so no run waited.

## Identities

| item | blob |
|---|---|
| board under test, `b63/prioritization-board-grid.html` (a `cp -a` of `../base`) = `../base/…` = builder's `../u20/b63/…` = `63bd8b0:` = orbit-board `HEAD:` | `98eed7e801af20270f755eadffb2fa72355c30e5` |
| `x/out/second-copy/Board-copy.html` (a second copy for the two-files Chromium case) | `98eed7e8…` (same) |
| `b63/tools/export-audit/boot.mjs` / `b63/runtime-encoding-shim.mjs` / `b63/tools/chrome.mjs` / `b63/package.json` | `9c4f49ad…` / `6e2ce2e6…` / `d0fbdb8a…` / `7cf8186f…` |
| jsdom (`b63/node_modules` → `/home/user/orbit-board/node_modules`) | 27.4.0 |
| **builder's harness, byte-identical copies in `rerun/`:** `u20probe.mjs` / `locks-mock.mjs` / `locktest.mjs` / `check.mjs` / `chromium-locks.mjs` / `src/table.mjs` / `src/show.mjs` | `677d6f3f…` / `cee3b470…` / `bb670f12…` / `11472aaf…` / `f325c6ea…` / `7bedffc6…` / `1d94a336…` |
| builder's `PROPOSAL.md` / `U20-count-waiting-save.diff` / `patched-copy-NEVER-RUN/…html` / `README.md` | `a145590a…` / `b3a5ff25…` / `b00af156…` / `b143532a…` |
| **checker's harness:** `x/u20x.mjs` (the builder's probe plus the added scenarios; every xc2/xc3 run printed it as `IDS.probe`) | `795f0928ab3b8d885fd06a1fee849fb102f86a31` |
| `x/xcheck.mjs` (hand-written literals for the added scenarios) / `x/xshow.mjs` (reader) / `x/chromium-file.mjs` | `d13089db…` / `0970372c…` / `1f0753b1…` |
| `x/locks-mock.mjs` | `cee3b470…` (= the builder's) |
| `q.sh` / `pass.sh` / `xpass.sh` / `chrome.sh` | `06c8d975…` / `34caf7fa…` / `076843b3…` / `81ea3044…` |
| `PROPOSAL.md` (O4, the checker's) / `proposal/O4-record-base-only-when-on-screen.diff` | `2868d783…` / `d54b6cd3…` |

**How `x/u20x.mjs` differs from the builder's probe:**
- the header comment and the scenario list;
- a null guard in `closeTab` (O4 has no tab A);
- `runPB` and `runAD` take the scenario's full name, to see `count`;
- `runBR` also parses `count` and `real`.

Everything else is added code: 80 added lines (`diff`, `logs/diff-probe-x.log`). The builder's own scenarios were run from
the unmodified `rerun/u20probe.mjs`.

## Method

**Runner.** Every run went through `q.sh <label> <cmd…>`. Each is one `setsid -w timeout -k 10 600` call, with a wait for
`AUDIT_IMPORT_RUNNING` first when the command names node, python or chromium. The `timeout` PID and its child go to
`pids.txt` with the command, and `<label> start= exit= wall_s=` goes to `logs/runs.txt`.
- `pass.sh <p>`: the builder's locktest and its 26 scenarios, one at a time.
- `xpass.sh <p>`: my 11 added scenarios.
- `chrome.sh <p>`: `chromium-locks.mjs` and `chromium-file.mjs`.

**My added scenarios (`x/u20x.mjs`)** use the builder's tabs (A on FULL FUND holding the lock with a real held 💾 Save, B,
X and C), its folder mock, its lock mock and its lineage and leaf rules:

| scenario | what it is | why |
|---|---|---|
| **PB-Wcount, AD-Wcount, BR-Wcount** | the W scenario exactly, except that B's `navigator.locks.request` is wrapped: B's `_saveBusy++` when the lock is asked for, `--` when `request()` settles | Removes **only** the trigger. The builder's C1 also differs in that B's save is already running. |
| **BR-Wreal, BR-Wrealtick, BR-Wrealh** | BR without the harness-connect shortcut. B opens first and connects through the product's `driveAutoConnect()`; the folder holds no O&M copy, so nothing is recorded. **Then** X saves (F00-FIRST and) F0, and **then** B types B-EDIT. The refresh is Live view's ↻ Refresh now (`livePoll(false)`) or the Live timer (`liveTick`). | The builder's BR-W, BR-Wtick and BR-Wh skip the opening pull. By code, a real opening would have adopted F0 and recorded it. |
| **BR-C1real** | BR-Wreal's counted control: B's save running, held at its read | healthy control for the `*real` fixture |
| **BR-Wrealcount** | BR-Wreal with the count wrapper | the trigger removed on the product route |
| **O4-tick, O4-tickh** | ONE tab, no tab A, no lock contention, no button: the `*real` fixture with Live view and autosave on; tick 1, tick 2, then the next 💾 Save and the reopen | Is O4 reached by the timer alone? |
| **BR-Wrealtickcount** | BR-Wrealtick with the count wrapper | What the U20 correction would leave once the timer goes on ticking |

**`x/chromium-file.mjs`** tests the builder's Chromium shortcut (`https://orbit.invalid` by request interception).
- **F1:** two tabs of the board opened from the same `file://` path, one browser context. Tab A's `saveSerial` holds
  `orbit-save`, and B's waits.
- **F2:** the same on two different file paths. INFO only, not checked against literals.

## Expected vs observed

### The builder's runs, re-run (c1, c2)

`check.mjs` (the builder's literals) gave **369 checks: 354 pass, 15 fail, in each pass**, the same as the builder's r1 and
r2. `logs/check-c1.log` is byte-identical to `../u20/logs/check-r1.log`, and `check-c2.log` to `check-r2.log`.

| kind | pass | fail |
|---|---|---|
| RUN | 26 | 0 |
| LCK | 27 | 0 |
| FIX | 60 | 0 |
| PRE | 36 | 0 |
| CTL | 109 | 0 |
| U20 | 68 | **9** |
| OUT | 20 | **6** |
| INFO | 8 | 0 |

**The 9 failing U20 checks:**
- BR-W, BR-Wtick, BR-Wperm, BR-Wh and BR-Wpermh: "B's save did not write over a copy without asking" expected `false`,
  observed `true`.
- BR-Wh and BR-Wpermh, at the next Save and at the reopen: "every leaf copy reachable [B-EDIT, F0-BASE]" expected
  `[true,true]`, observed `[true,false]`.

The 6 OUT checks are BR-C2a, BR-C2ah, BR-C2b and BR-C2bh, the one-tab path with the refresh before the Save. The
per-scenario table is `logs/table-c1c2.log`: c1 and c2 are identical for 26 of 26, and the same as the builder's table
once digits are set aside.

### Real Chromium (c1, c2; the two logs identical)

| check | expected (literal) | c1 | c2 |
|---|---|---|---|
| `chromium-locks.mjs` (builder's): T1/T2/T6/T7 API semantics, and U20's premise with the board in two tabs (W: [B busy, B ran, held, pending, A busy] = [0,false,1,1,1]; ↶ Put back while B waits = {refused:false, asked:1}; C1 refused; C2 asks) | 19 literals | 19/19 | 19/19 |
| F1, same `file://` path, two tabs: [A holds, A err, A busy, B busy, B ran, B err] | `[true,null,1,0,false,null]` | same | same |
| F1, then B runs counted inside, and ends: [ran, busy inside, busy after, err] | `[true,1,0,null]` | same | same |
| F2, two different files (INFO, raw) | — | A holds; B busy 0, B not run, pending 1; then B ran | same |

### The added scenarios (`x/xcheck.mjs` literals; xc2 and xc3 byte-identical logs)

**184 pass, 10 fail in each pass.** By kind:

| kind | pass | fail |
|---|---|---|
| RUN | 11 | 0 |
| LCK | 11 | 0 |
| FIX | 37 | 0 |
| PRE | 25 | 0 |
| CNT | 45 | 0 |
| CTL | 10 | 0 |
| INFO | 4 | 0 |
| U20 | 19 | **5** |
| O4 | 22 | **5** |

| scenario | premise B busy / A busy / held / pending | the step under test | expected (literal) | observed |
|---|---|---|---|---|
| PB-Wcount | 1/1/A/B | ↶ Put back during the counted wait: [screen, kept, MS same, kept same, said "Not put back…", asked] | `[S1,K,true,true,true,0]` | same: **refused**; S1's save then lands |
| AD-Wcount | 1/1/A/B | refresh: [screen, unchanged, said "was not loaded"]; save: [folder, screen, saved, "Nothing was written", wrote] | `[WORKING,true,true]`; `[N2,WORKING,false,true,0]` | same |
| BR-Wcount | 1/1/A/B | refresh records nothing (base); save: [wrote, folder, choice offered] | `0`; `[0,F0,true]` | same |
| **BR-Wreal** | 0/1/A/B | B's save wrote over a copy without asking | `false` | **`true`** (F0-BASE → B-EDIT, 0 questions). INFO: the refresh recorded F0's stamp. |
| **BR-Wrealtick** | 0/1/A/B | same | `false` | **`true`** |
| **BR-Wrealh** | 0/1/A/B | same; then every leaf reachable at the next Save and at the reopen [B-EDIT, F0-BASE] | `false`; `[true,true]` ×2 | **`true`; `[true,false]` ×2**. F0 was kept only as `-recent` and pruned by the next Save. |
| BR-C1real | 1/–/B/– | refresh records nothing; save refuses with the choice | `0`; `[0,F0,true]` | same (healthy) |
| BR-Wrealcount | 1/1/A/B | as BR-Wcount | `0`; `[0,F0,true]` | same (healthy) |
| **O4-tick** | one tab, grants B only | tick 1: [wrote, folder]; tick 2's autosave wrote over a copy without asking | `[0,F0]`; `false` | `[0,F0]` ("⛔ … Nothing was written. Load theirs · Save yours over theirs"); **`true`**. Tick 2 wrote F0-BASE → B-EDIT: "✓ Saved to the shared folder automatically". |
| **O4-tickh** | one tab | the same; then every leaf reachable at the next Save and at the reopen | `false`; `[true,true]` ×2 | **`true`; `[true,false]` ×2** (F0 pruned from `-recent`) |
| **BR-Wrealtickcount** | 1/1/A/B | B's save (counted): records nothing, refuses (CNT); **the next 💾 Save** wrote over a copy without asking (O4) | CNT as above; `false` | CNT passes. The next Save **`true`**: tick 1's own refresh after the refusal recorded F0 (INFO), and the Save wrote F0 → B-EDIT unasked. |

**Lock mock instrumentation.** In all 22 evidence runs: 0 violations, `maxHeld['orbit-save']` = 1, nothing unmodeled, and
grants = releases.

## Runs

There are 172 runs: every line of `logs/runs.txt` up to `ids-final` (3:27:30 PM ET). The full table is at the end of this
file. In summary:

| group | start (ET) | runs | exit | wall s |
|---|---|---|---|---|
| clock0, ls-base, copy-base, copy-harness, copy-src, ids0, gs-board, head-board, blobs-board, wt-board, gs-ui | 11:38:25 – 11:41:48 | 11 | 0 | 0.08 – 8.7 |
| locktest-c1, c1-PB-W … c1-PF-C2a (the builder's 26) | 11:42:17 – 11:46:47 | 27 | 0 | 5.0 – 17.6 |
| mk-x, cp-x, cp-x2 (making `x/`) | 11:42:59 – 11:43:19 | 3 | 0 | ≤ 10.9 |
| xdev-BR-Wreal, xdev-O4-tick, xshow-dev (**development, not evidence**) | 11:47:00 – 11:47:38 | 3 | 0 | ≤ 8.6 |
| check-c1, cmp-check-c1-vs-r1 | 11:47:48 – 11:47:54 | 2 | 0 | ≤ 3.0 |
| locktest-c2, c2-PB-W … c2-PF-C2a | 11:48:01 – 11:50:56 | 27 | 0 | 4.1 – 9.3 |
| rediff-proposal (`diff` exits 1 when the files differ, as expected), cmp-rediff, grep-patched-runs, ls-patched, jsdom-ver | 11:49:00 – 11:49:17 | 5 | 1, 0, 0, 0, 0 | ≤ 6.9 |
| xc1-* (**preview, not evidence**: two runs used an earlier probe blob), ids-x, xshow-c1-BRperm, xcheck-c1-preview | 11:51:01 – 11:52:19 | 14 | 0 | ≤ 7.4 |
| xc2-* (11 runs, evidence), check-c2, cmp-check-c2-vs-r2, cmp-check-c1-vs-c2, table-c1c2, grep-table-agree, table-vs-builder, xcheck-c2 | 11:52:14 – 11:53:40 | 18 | 0 | ≤ 6.6 |
| xc3-* (11 runs, evidence), grep-xc2, grep-xc2-probe, xshow-c2-a | 11:53:35 – 11:54:31 | 14 | 0 | ≤ 6.7 |
| chromium-locks-c1/c2, chromium-file-c1/c2 | 11:54:37 – 11:54:56 | 4 | 0 | 5.6 – 7.5 |
| applycheck-O4, applycheck-both (**128**: my diff text was malformed, which I then fixed), applycheck-U20, applycheck-O4b, applycheck-bothb, board-unchanged, board-unchanged2 | 11:54:45 – 11:55:10 | 7 | 128, 128, then 0 | ≤ 8.2 |
| xcheck-c3, cmp-xcheck-c2-c3, grep-chrome-c2, grep-xc3-probe, grep-chrome-ids, xshow-c3-b, grep-xshow-c3-b, grep-waits (1 = no match, as expected), count-*, clock1, labels-in-pids, wall-ranges | 11:55:27 – 11:57:45 | 17 | 0, except grep-waits 1 | ≤ 4.4 |
| **resumed:** clock2, gs-board2, blobs-board2, wt-board2, gs-ui2, ids-builder2, grep-xc3-props, b-count-timeout, b-count-gone, b-nonzero, b-r-count, b-waits (1 = no match), diff-probe-x, diff-probe-x-stat, cmp-mock, clock3, grep-builder-patched-boot (1 = no match), ls-x-out-second, hash-second, ids-final | 3:21:11 – 3:27:30 PM | 20 | 0, except the two no-match greps | ≤ 9.1 |

**No run timed out, and none waited for the lock.** No `TIMED OUT`, `waiting for` or `SKIPPED` line appears in
`logs/runs.txt`. Runs after `ids-final` (the README table and the final counts) are also in `logs/runs.txt`.

## PIDs

`pids.txt` lists, for every run, the PID of its `timeout` process and, when `ps` found one, its child's PID. Each line has
the ET time, the process name and the full command.

At 3:29 PM ET it had 306 lines. The name field reads:
- `timeout` on 112 lines;
- `gone` on 86 lines, where the process had ended before `ps` looked;
- the child's own name (`node`, `git`, `cp`, …) on the rest.

The builder's "108 `timeout` processes" is the same kind of count: lines whose name reads `timeout`, not the number of runs.

**Nothing was killed by this check.** Every process ended on its own. At 3:23 PM ET one recorded PID, 21434, was alive. It
had been `cmp-xcheck-c2-c3` (11:55 AM ET), and the number had since been reused by **another session's `run.sh`**
(started 3:23 PM ET). It was not touched.

## What was NOT done

- **No fix was applied anywhere.**
  - My `PROPOSAL.md` (O4) and the builder's `PROPOSAL.md` (U20) were only checked with `git apply --check` on `b63`, which
    writes nothing; both diffs apply, alone and together.
  - No patched board was made or run here. The claims about patched behaviour are by code only.
  - The `*count` wrapper is a harness **stand-in** for the U20 diff, not the diff itself.
- **The O4 diff's effect on U20's route (ii-b) is by code only.** That diff stops the refresh recording while B-EDIT is on
  screen, so the waiting save would refuse. This was not measured.
- **Real Chromium was not used for the folder routes** (File System Access API). Chromium checked the Web Locks semantics,
  U20's premise and the U2 refusal (builder's script), and the `file://` premise (mine).
- **Likelihood was not measured.**
- **Not tried, by the builder or by me:**
  - Load theirs, or Save yours over theirs, as the waiting operation;
  - ✍ Take the pen;
  - the U24 paths (`sharedArrived`/`adoptShared`, `bootTakeFile`, `importBoards`);
  - two tabs on the same appropriation;
  - a tab closed while holding the lock;
  - a real measurement that the product's opening pull adopts F0 in the builder's BR-W fixture (stated by code,
    `driveStorePull`).
- **Not run:** `mutate.mjs` (not imported, executed or read), the full `audit-import.mjs` or `audit-board.mjs`, any other
  suite, `npm run check`, and `playwright install`.

## Deviations

- **Read-only commands ran without `setsid -w timeout`:**
  - before `q.sh` existed (before 11:38 AM ET);
  - at the start of the resumed session (3:19–3:24 PM ET): `ls`, `cat`, `sed -n`, `grep`, `diff`, `stat`, `ps`, and a
    `/proc` loop checking whether my recorded PIDs were alive.

  No node, python or Chromium command ran unbounded.
- **`x/xcheck.mjs`'s header is inaccurate.** It says "written … BEFORE any added scenario was run". In fact two development
  runs (11:47 AM ET) had been run and viewed. Its literals were last edited at 11:51:20 AM ET, while pass xc1 was running
  and before any check of any output.
- **Pass xc1 is a preview only.** `x/u20x.mjs` was edited at 11:51:11 AM ET during it, adding BR-Wrealtickcount, so its first
  two runs carry probe blob `e06019f9`. The evidence is xc2 and xc3: 22 runs on `795f0928`, with identical check logs.
- **My first O4 diff text was malformed** (`git apply --check` exit 128, "corrupt patch"). It was fixed and re-checked
  (exit 0).

## Full run table (from `logs/runs.txt`)

| label | start (ET) | exit | wall s |
|---|---|---|---|
| clock0 | 2026-10-12 11:38:25 EDT | 0 | 8.67 |
| ls-base | 2026-10-12 11:38:39 EDT | 0 | 7.57 |
| copy-base | 2026-10-12 11:41:23 EDT | 0 | 0.16 |
| copy-harness | 2026-10-12 11:41:24 EDT | 0 | 0.13 |
| copy-src | 2026-10-12 11:41:24 EDT | 0 | 8.36 |
| ids0 | 2026-10-12 11:41:41 EDT | 0 | 0.12 |
| gs-board | 2026-10-12 11:41:47 EDT | 0 | 0.13 |
| head-board | 2026-10-12 11:41:47 EDT | 0 | 0.16 |
| blobs-board | 2026-10-12 11:41:47 EDT | 0 | 0.08 |
| wt-board | 2026-10-12 11:41:48 EDT | 0 | 0.11 |
| gs-ui | 2026-10-12 11:41:48 EDT | 0 | 7.14 |
| locktest-c1 | 2026-10-12 11:42:17 EDT | 0 | 1.81 |
| c1-PB-W | 2026-10-12 11:42:19 EDT | 0 | 10.08 |
| c1-PB-Wtick | 2026-10-12 11:42:29 EDT | 0 | 14.40 |
| c1-PB-C1 | 2026-10-12 11:42:43 EDT | 0 | 13.99 |
| mk-x | 2026-10-12 11:42:59 EDT | 0 | 9.37 |
| c1-PB-C2a | 2026-10-12 11:42:57 EDT | 0 | 14.73 |
| cp-x | 2026-10-12 11:43:08 EDT | 0 | 10.88 |
| cp-x2 | 2026-10-12 11:43:19 EDT | 0 | 10.10 |
| c1-PB-C2b | 2026-10-12 11:43:12 EDT | 0 | 17.56 |
| c1-PB-NL | 2026-10-12 11:43:29 EDT | 0 | 12.10 |
| c1-AD-W | 2026-10-12 11:43:42 EDT | 0 | 13.16 |
| c1-AD-Wtick | 2026-10-12 11:43:55 EDT | 0 | 16.12 |
| c1-AD-C1 | 2026-10-12 11:44:11 EDT | 0 | 15.36 |
| c1-AD-C2a | 2026-10-12 11:44:26 EDT | 0 | 14.35 |
| c1-AD-C2b | 2026-10-12 11:44:41 EDT | 0 | 12.56 |
| c1-BR-W | 2026-10-12 11:44:53 EDT | 0 | 8.61 |
| c1-BR-Wtick | 2026-10-12 11:45:02 EDT | 0 | 10.76 |
| c1-BR-C1 | 2026-10-12 11:45:13 EDT | 0 | 8.98 |
| c1-BR-C2a | 2026-10-12 11:45:22 EDT | 0 | 9.70 |
| c1-BR-C2b | 2026-10-12 11:45:31 EDT | 0 | 7.23 |
| c1-BR-Wperm | 2026-10-12 11:45:39 EDT | 0 | 10.68 |
| c1-BR-C1perm | 2026-10-12 11:45:49 EDT | 0 | 8.66 |
| c1-BR-Wh | 2026-10-12 11:45:58 EDT | 0 | 8.69 |
| c1-BR-C1h | 2026-10-12 11:46:07 EDT | 0 | 7.71 |
| c1-BR-Wpermh | 2026-10-12 11:46:15 EDT | 0 | 5.56 |
| c1-BR-C2ah | 2026-10-12 11:46:20 EDT | 0 | 5.04 |
| c1-BR-C2bh | 2026-10-12 11:46:25 EDT | 0 | 7.25 |
| c1-PF-W | 2026-10-12 11:46:32 EDT | 0 | 8.77 |
| c1-PF-C1 | 2026-10-12 11:46:41 EDT | 0 | 6.16 |
| c1-PF-C2a | 2026-10-12 11:46:47 EDT | 0 | 8.53 |
| xdev-BR-Wreal | 2026-10-12 11:47:00 EDT | 0 | 8.31 |
| xdev-O4-tick | 2026-10-12 11:47:08 EDT | 0 | 8.59 |
| xshow-dev | 2026-10-12 11:47:38 EDT | 0 | 0.12 |
| check-c1 | 2026-10-12 11:47:48 EDT | 0 | 0.08 |
| cmp-check-c1-vs-r1 | 2026-10-12 11:47:54 EDT | 0 | 3.00 |
| locktest-c2 | 2026-10-12 11:48:01 EDT | 0 | 1.43 |
| c2-PB-W | 2026-10-12 11:48:03 EDT | 0 | 7.15 |
| c2-PB-Wtick | 2026-10-12 11:48:10 EDT | 0 | 8.02 |
| c2-PB-C1 | 2026-10-12 11:48:18 EDT | 0 | 7.20 |
| c2-PB-C2a | 2026-10-12 11:48:25 EDT | 0 | 6.76 |
| c2-PB-C2b | 2026-10-12 11:48:32 EDT | 0 | 7.63 |
| c2-PB-NL | 2026-10-12 11:48:39 EDT | 0 | 9.29 |
| c2-AD-W | 2026-10-12 11:48:49 EDT | 0 | 8.25 |
| rediff-proposal | 2026-10-12 11:49:00 EDT | 1 | 0.11 |
| c2-AD-Wtick | 2026-10-12 11:48:57 EDT | 0 | 8.02 |
| cmp-rediff | 2026-10-12 11:49:00 EDT | 0 | 5.82 |
| grep-patched-runs | 2026-10-12 11:49:06 EDT | 0 | 6.91 |
| c2-AD-C1 | 2026-10-12 11:49:05 EDT | 0 | 8.26 |
| ls-patched | 2026-10-12 11:49:13 EDT | 0 | 4.21 |
| c2-AD-C2a | 2026-10-12 11:49:13 EDT | 0 | 8.33 |
| jsdom-ver | 2026-10-12 11:49:17 EDT | 0 | 4.89 |
| c2-AD-C2b | 2026-10-12 11:49:22 EDT | 0 | 7.09 |
| c2-BR-W | 2026-10-12 11:49:29 EDT | 0 | 6.28 |
| c2-BR-Wtick | 2026-10-12 11:49:35 EDT | 0 | 7.03 |
| c2-BR-C1 | 2026-10-12 11:49:42 EDT | 0 | 5.54 |
| c2-BR-C2a | 2026-10-12 11:49:48 EDT | 0 | 7.73 |
| c2-BR-C2b | 2026-10-12 11:49:55 EDT | 0 | 5.48 |
| c2-BR-Wperm | 2026-10-12 11:50:01 EDT | 0 | 6.04 |
| c2-BR-C1perm | 2026-10-12 11:50:07 EDT | 0 | 5.54 |
| c2-BR-Wh | 2026-10-12 11:50:13 EDT | 0 | 6.68 |
| c2-BR-C1h | 2026-10-12 11:50:19 EDT | 0 | 6.44 |
| c2-BR-Wpermh | 2026-10-12 11:50:26 EDT | 0 | 6.57 |
| c2-BR-C2ah | 2026-10-12 11:50:32 EDT | 0 | 6.16 |
| c2-BR-C2bh | 2026-10-12 11:50:39 EDT | 0 | 7.86 |
| c2-PF-W | 2026-10-12 11:50:46 EDT | 0 | 5.92 |
| c2-PF-C1 | 2026-10-12 11:50:52 EDT | 0 | 4.13 |
| c2-PF-C2a | 2026-10-12 11:50:56 EDT | 0 | 4.23 |
| xc1-PB-Wcount | 2026-10-12 11:51:01 EDT | 0 | 6.05 |
| xc1-AD-Wcount | 2026-10-12 11:51:07 EDT | 0 | 6.68 |
| xc1-BR-Wcount | 2026-10-12 11:51:13 EDT | 0 | 5.94 |
| xc1-BR-Wreal | 2026-10-12 11:51:19 EDT | 0 | 7.36 |
| xc1-BR-Wrealtick | 2026-10-12 11:51:27 EDT | 0 | 7.30 |
| xc1-BR-C1real | 2026-10-12 11:51:34 EDT | 0 | 7.15 |
| ids-x | 2026-10-12 11:51:38 EDT | 0 | 7.09 |
| xc1-BR-Wrealcount | 2026-10-12 11:51:41 EDT | 0 | 7.25 |
| xc1-BR-Wrealh | 2026-10-12 11:51:49 EDT | 0 | 6.71 |
| xshow-c1-BRperm | 2026-10-12 11:51:59 EDT | 0 | 0.20 |
| xc1-O4-tick | 2026-10-12 11:51:55 EDT | 0 | 6.14 |
| xc1-O4-tickh | 2026-10-12 11:52:01 EDT | 0 | 6.35 |
| xc1-BR-Wrealtickcount | 2026-10-12 11:52:08 EDT | 0 | 5.91 |
| xcheck-c1-preview | 2026-10-12 11:52:19 EDT | 0 | 0.14 |
| xc2-PB-Wcount | 2026-10-12 11:52:14 EDT | 0 | 6.49 |
| xc2-AD-Wcount | 2026-10-12 11:52:20 EDT | 0 | 5.67 |
| check-c2 | 2026-10-12 11:52:30 EDT | 0 | 0.11 |
| xc2-BR-Wcount | 2026-10-12 11:52:26 EDT | 0 | 4.92 |
| cmp-check-c2-vs-r2 | 2026-10-12 11:52:30 EDT | 0 | 3.29 |
| cmp-check-c1-vs-c2 | 2026-10-12 11:52:33 EDT | 0 | 3.28 |
| table-c1c2 | 2026-10-12 11:52:36 EDT | 0 | 0.11 |
| xc2-BR-Wreal | 2026-10-12 11:52:31 EDT | 0 | 5.68 |
| grep-table-agree | 2026-10-12 11:52:36 EDT | 0 | 3.95 |
| xc2-BR-Wrealtick | 2026-10-12 11:52:37 EDT | 0 | 6.29 |
| table-vs-builder | 2026-10-12 11:52:46 EDT | 0 | 0.07 |
| xc2-BR-C1real | 2026-10-12 11:52:43 EDT | 0 | 5.10 |
| xc2-BR-Wrealcount | 2026-10-12 11:52:48 EDT | 0 | 5.75 |
| xc2-BR-Wrealh | 2026-10-12 11:52:54 EDT | 0 | 6.57 |
| xc2-O4-tick | 2026-10-12 11:53:00 EDT | 0 | 5.07 |
| xc2-O4-tickh | 2026-10-12 11:53:05 EDT | 0 | 5.29 |
| xc2-BR-Wrealtickcount | 2026-10-12 11:53:11 EDT | 0 | 5.15 |
| xcheck-c2 | 2026-10-12 11:53:40 EDT | 0 | 0.11 |
| xc3-PB-Wcount | 2026-10-12 11:53:35 EDT | 0 | 6.16 |
| grep-xc2 | 2026-10-12 11:53:41 EDT | 0 | 3.68 |
| grep-xc2-probe | 2026-10-12 11:53:44 EDT | 0 | 3.33 |
| xc3-AD-Wcount | 2026-10-12 11:53:41 EDT | 0 | 6.59 |
| xc3-BR-Wcount | 2026-10-12 11:53:48 EDT | 0 | 4.83 |
| xshow-c2-a | 2026-10-12 11:53:53 EDT | 0 | 0.09 |
| xc3-BR-Wreal | 2026-10-12 11:53:52 EDT | 0 | 4.95 |
| xc3-BR-Wrealtick | 2026-10-12 11:53:57 EDT | 0 | 5.05 |
| xc3-BR-C1real | 2026-10-12 11:54:02 EDT | 0 | 4.21 |
| xc3-BR-Wrealcount | 2026-10-12 11:54:07 EDT | 0 | 5.23 |
| xc3-BR-Wrealh | 2026-10-12 11:54:12 EDT | 0 | 6.69 |
| xc3-O4-tick | 2026-10-12 11:54:19 EDT | 0 | 5.78 |
| xc3-O4-tickh | 2026-10-12 11:54:24 EDT | 0 | 6.64 |
| xc3-BR-Wrealtickcount | 2026-10-12 11:54:31 EDT | 0 | 5.98 |
| chromium-locks-c1 | 2026-10-12 11:54:37 EDT | 0 | 5.60 |
| chromium-file-c1 | 2026-10-12 11:54:43 EDT | 0 | 5.55 |
| applycheck-O4 | 2026-10-12 11:54:45 EDT | 128 | 8.16 |
| applycheck-U20 | 2026-10-12 11:54:54 EDT | 0 | 0.09 |
| applycheck-both | 2026-10-12 11:54:54 EDT | 128 | 0.11 |
| chromium-locks-c2 | 2026-10-12 11:54:49 EDT | 0 | 7.49 |
| board-unchanged | 2026-10-12 11:54:54 EDT | 0 | 7.94 |
| chromium-file-c2 | 2026-10-12 11:54:56 EDT | 0 | 5.91 |
| applycheck-O4b | 2026-10-12 11:55:10 EDT | 0 | 0.09 |
| applycheck-bothb | 2026-10-12 11:55:10 EDT | 0 | 0.07 |
| board-unchanged2 | 2026-10-12 11:55:10 EDT | 0 | 0.07 |
| xcheck-c3 | 2026-10-12 11:55:27 EDT | 0 | 0.09 |
| cmp-xcheck-c2-c3 | 2026-10-12 11:55:27 EDT | 0 | 3.58 |
| grep-chrome-c2 | 2026-10-12 11:55:30 EDT | 0 | 3.66 |
| grep-xc3-probe | 2026-10-12 11:55:34 EDT | 0 | 4.37 |
| grep-chrome-ids | 2026-10-12 11:55:39 EDT | 0 | 3.28 |
| xshow-c3-b | 2026-10-12 11:55:51 EDT | 0 | 0.10 |
| grep-xshow-c3-b | 2026-10-12 11:55:51 EDT | 0 | 3.91 |
| grep-waits | 2026-10-12 11:56:01 EDT | 1 | 4.10 |
| count-runs | 2026-10-12 11:56:05 EDT | 0 | 0.20 |
| count-nonzero | 2026-10-12 11:56:05 EDT | 0 | 3.91 |
| count-pids | 2026-10-12 11:56:09 EDT | 0 | 3.16 |
| clock1 | 2026-10-12 11:56:13 EDT | 0 | 3.34 |
| count-pidlines | 2026-10-12 11:56:23 EDT | 0 | 2.60 |
| count-gone | 2026-10-12 11:56:26 EDT | 0 | 2.82 |
| count-node | 2026-10-12 11:56:28 EDT | 0 | 2.79 |
| labels-in-pids | 2026-10-12 11:56:31 EDT | 0 | 0.04 |
| wall-ranges | 2026-10-12 11:57:45 EDT | 0 | 0.03 |
| clock2 | 2026-10-12 15:21:11 EDT | 0 | 7.82 |
| gs-board2 | 2026-10-12 15:21:18 EDT | 0 | 0.08 |
| blobs-board2 | 2026-10-12 15:21:19 EDT | 0 | 8.00 |
| wt-board2 | 2026-10-12 15:21:27 EDT | 0 | 0.09 |
| gs-ui2 | 2026-10-12 15:21:27 EDT | 0 | 8.41 |
| ids-builder2 | 2026-10-12 15:21:35 EDT | 0 | 0.93 |
| grep-xc3-props | 2026-10-12 15:24:11 EDT | 0 | 0.13 |
| b-count-timeout | 2026-10-12 15:24:22 EDT | 0 | 8.86 |
| b-count-gone | 2026-10-12 15:24:31 EDT | 0 | 9.10 |
| b-nonzero | 2026-10-12 15:24:40 EDT | 0 | 8.19 |
| b-r-count | 2026-10-12 15:24:48 EDT | 0 | 0.13 |
| b-waits | 2026-10-12 15:24:48 EDT | 1 | 8.53 |
| diff-probe-x | 2026-10-12 15:25:19 EDT | 0 | 5.47 |
| diff-probe-x-stat | 2026-10-12 15:25:24 EDT | 0 | 5.42 |
| cmp-mock | 2026-10-12 15:25:30 EDT | 0 | 0.08 |
| clock3 | 2026-10-12 15:26:07 EDT | 0 | 3.22 |
| grep-builder-patched-boot | 2026-10-12 15:26:10 EDT | 1 | 3.53 |
| ls-x-out-second | 2026-10-12 15:26:14 EDT | 0 | 7.50 |
| hash-second | 2026-10-12 15:26:22 EDT | 0 | 0.35 |
| ids-final | 2026-10-12 15:27:30 EDT | 0 | 0.13 |
| count-runs2 | 2026-10-12 15:28:55 EDT | 0 | 9.39 |

This table was generated at 3:29:04 PM ET (mk-runs-table) and ends with count-runs2. The runs after it are only in logs/runs.txt: mk-runs-table, count-pids2, count-gone2, count-pidlines2, waits2 (exit 1 = no wait/skip/timeout line, as expected), clock4 (3:29:35 PM ET), append-runs-table and labels-check. All exit 0 except waits2.
