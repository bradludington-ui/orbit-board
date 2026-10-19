# U24 check (`rec/L4/u24-check`): re-run of the U24 probe, plus added controls and routes

The independent adversarial check of the U24 probe in `rec/L4/u24`. The review itself, with the problems found, is in
**`CHECK.md`**. This README holds the evidence: identities, every run with its exit and wall time, the PIDs, the
expected-vs-observed tables, what was not done, and the deviations. `PROPOSAL.md` holds amendments to the builder's proposal
tests; it proposes no product diff.

Work ran on Mon 12 Oct 2026 from 3:23 PM ET (`TZ=America/New_York date`). Every node run went through `q.sh`: `setsid -w timeout
-k 10 600`, the timeout PID and its child recorded in `pids.txt`, and the `AUDIT_IMPORT_RUNNING` lock waited for first. The lock
was absent throughout.

## Verdict: the builder's verdict STANDS on every path

| path | mode | builder's verdict | this check |
|---|---|---|---|
| `adoptShared` (the "load the shared one" link) | folder, file | REPRODUCED | **REPRODUCED** (x1 = r2 = r3). Attributed: the Wedit and Wread controls are healthy, and Whist reproduces at a second hold point. |
| `sharedArrived` (the page's own answer from the state file) | folder | REPRODUCED, persistent | **REPRODUCED, persistent** (x1). Also **without clock skew** (SHa-fold-Wlate). |
| `sharedArrived` | file | NOT REPRODUCED | **NOT REPRODUCED** (x1). By code, DIRTY is set by `save()` inside `buildSavedHtml()`. |
| `bootTakeFile` ("open the file's version") | file | REPRODUCED | **REPRODUCED** (x1). The CAROL-F loss at the reopen is caused by the false record (counterfactual BT-file-Wcf); the builder's leaves leave it out. |
| `bootTakeFile` | folder | INCONCLUSIVE | **INCONCLUSIVE** (x1). The no-save control is falsely clean (O1). |
| `importBoards` (File menu) | both | NOT REPRODUCED (counted) | **NOT REPRODUCED** (x1). IB-fold-Wclean's reopen loss is O2: the same happens with no save at all (IB-fold-C3clean, IB-fold-C1oldclean). |

Conditions and caveats (details in CHECK.md):
- Path A needs the state file to be requested: the board served over http(s), or on `file://` with
  `localStorage.spmtSidecar==='1'`. The `file://` route is untested; jsdom gives a `file://` page no localStorage (measured).
- With Live view's autosave as the held save (SHc-fold-Wauto), the board is falsely clean only until the same tick's refresh. That
  refresh quietly loads the folder copy back under a "Shared state loaded" line.

## Identities (`git hash-object`)
| item | blob |
|---|---|
| board under test: my `b63/prioritization-board-grid.html` (`cp -a rec/L4/base` at 15:24 ET) = `rec/L4/base/…` = builder's `b63/…` = orbit-board working tree = `HEAD:` = `63bd8b0:` (checked 15:24 and 15:42 ET) | `98eed7e801af20270f755eadffb2fa72355c30e5` |
| `b63/tools/export-audit/boot.mjs` / `b63/runtime-encoding-shim.mjs` / `b63/package.json` | `9c4f49ad…` / `6e2ce2e6…` / `7cf8186f…` (= the builder's) |
| jsdom (through `b63/node_modules` → `/home/user/orbit-board/node_modules`) / node | 27.4.0 / v22.22.0 |
| the builder's probe, copied unchanged: `probe-copy/u24probe.mjs` = `rec/L4/u24/u24probe.mjs` (run in x0 and x1) | `6d3a0eb2ad20d0d262d472dca4834cac172cdd62` |
| the builder's checker, copied unchanged: `probe-copy/check.mjs` = `rec/L4/u24/check.mjs` | `aee1460398d6c183e405566247bd364147c3ab32` |
| my variant `x/u24probe-x.mjs`, **final** (run in y4dev, y4) | `d9e816ec53a05c2d0121e4118be7030fe547ac73` |
| my variant as run in y1 / in y2 and y3 (earlier states; each later state only added scenarios) | `47859d60…` / `5e445298…` |
| my expectations `x/xcheck.mjs`, final (y4) / as first written (y1) / after BT-file-Wcf (y2, y3) | `d393aaa0…` / `55d67f35…` / `0be3025b…` |
| `q.sh` / `mx.sh` / `mxx.sh` | `7eb995f6…` / `23522e7f…` / `bd380aa6…` |
| readers: `cmp.mjs` / `reach.mjs` / `x/xtable.mjs` / `x/fileorigin.mjs` | `f7f60982…` / `b7cf0a79…` / `e0387e95…` / `9155fb50…` |
| the builder's harness files, hashed against its Appendix E (all equal): `check.mjs`, `run.sh`, `q.sh`, `matrix.sh`, `src/*.mjs`, `src/*.py`, `PROPOSAL.md`, `proposal/mkpatch.py`, `proposal/P1–P4.diff`, the four patched copies | as listed there (`logs/u24-ids.log`, `logs/p-blobs.log`) |
| `CHECK.md`, `PROPOSAL.md`, this README | `logs/final-ids.txt` (hashed last) |

## Passes
| pass | probe | scenarios | when (ET) | result |
|---|---|---|---|---|
| x0 | builder's `6d3a0eb2` | SHc-fold-W (harness smoke) | 15:28:17 | exit 0 |
| **x1** | builder's `6d3a0eb2` | all 38, as two bounded halves in parallel (mx1a, mx1b) | 15:28:43 to about 15:32:24 (mx1a 201.7 s, mx1b 220.3 s) | 38 × exit 0. `check.mjs x1`: **560 checks, 25 fail, all CONTRACT**. **Identical to r2 and to r3 on all 560 rows** (verdict, observed, expected). |
| y1 | mine `47859d60` | 8 added | 15:33:56 to 15:34:47 | 8 × exit 0. `xcheck y1`: 88 checks, 0 fail. |
| y2 | mine `5e445298` | BT-file-Wcf | 15:37:01 | exit 0. All BT-file-Wcf checks held. |
| y3 | mine `5e445298` | 9 added | 15:37:36 to 15:38:26 | 9 × exit 0. 99 checks, 0 fail. Identical to y1 on the 88 shared rows. |
| y4dev | mine `d9e816ec` | SHc-fold-Wauto | 15:41:20 | exit 0. All its checks held. |
| **y4** | mine `d9e816ec` (final) | all 10 added | 15:41:36 to 15:42:32 | 10 × exit 0. `xcheck y4`: **113 checks, 0 fail**. Identical to y3 on the 99 shared rows. |

The builder's own records, read: r1 = r2 on 469 shared rows; 145 run lines (only its recorded bad call is non-zero); `pids.txt` has
381 lines; no `mutate`, `audit-import`, `audit-board`, Playwright or Chromium run in it.

## The added scenarios (my variant; the builder's code otherwise unchanged; every addition marked `CHECKER:` in the file)
| scenario | what it is | why |
|---|---|---|
| SHc-fold-Wedit, SHc-file-Wedit | the held save; an **ordinary edit** to SHARED/$600 through `setNote`/`setAlloc` (the row inputs' `onchange`) instead of the link | Harness control: does the hold itself break the board's counter? (No.) |
| SHc-fold-Wread, SHc-file-Wread | the save held at its **read**, then the link | Timing control: before the bytes are built, the adoption is written consistently. |
| SHc-fold-Whist | the folder save held at the close of its **history** copy (`history/spmt-2027-om-<stamp>.json`) | Is the effect specific to the builder's hold point? (No.) |
| SHc-fold-Wauto | Live autosave on; the page's own `liveTick()` is the held save; a second hold at the same tick's refresh read | A route the builder did not try. |
| SHa-fold-Wlate | the state file written at real time **after** the save began, then answered | Is the hour-fast clock needed? (No.) |
| BT-file-Wcf | BT-file-W, then (**COUNTERFACTUAL, not a product path**) the harness marks the record unsaved after K1, before the reopen | Is CAROL-F's loss at the reopen caused by the false record? (Yes.) |
| IB-fold-C3clean | clean record; the save lands; then the import; then the reopen | Is IB-fold-Wclean's reopen loss caused by the concurrent save? (No.) |
| IB-fold-C1oldclean | clean record; the imported board **older** than the folder copy; no save at all | The same question, with no save at all. |

## Every run (from `logs/runs.txt`; each through q.sh; output in `logs/<label>.log`)
Non-zero exits are all harness slips, explained in `logs/deviations.txt`:
- ls-lock 2: the lock file was absent.
- xcheck-y2-fails 1: grep over a filtered log.
- end-ob-head 128: `--short` with a tree path.
- xtable-y4 1: `grep -c` counted 0 mismatches.

| label | start (ET) | exit | wall s |
|---|---|---|---|
| clock0 | 2026-10-12 15:23:31 EDT | 0 | 0.1 |
| ls-base | 2026-10-12 15:23:44 EDT | 0 | 10.6 |
| ls-lock | 2026-10-12 15:23:55 EDT | 2 | 10.3 |
| cp-base | 2026-10-12 15:24:17 EDT | 0 | 0.2 |
| cp-probe | 2026-10-12 15:24:17 EDT | 0 | 0.2 |
| hash-ids | 2026-10-12 15:24:17 EDT | 0 | 0.5 |
| ledger-u24 | 2026-10-12 15:27:55 EDT | 0 | 0.1 |
| ob-status | 2026-10-12 15:28:02 EDT | 0 | 0.2 |
| ob-head | 2026-10-12 15:28:02 EDT | 0 | 0.1 |
| ob-blobs | 2026-10-12 15:28:03 EDT | 0 | 0.1 |
| ob-wt | 2026-10-12 15:28:03 EDT | 0 | 0.1 |
| oui-status | 2026-10-12 15:28:03 EDT | 0 | 0.1 |
| x0-SHc-fold-W | 2026-10-12 15:28:17 EDT | 0 | 10.7 |
| x1-SHa-file-C2 | 2026-10-12 15:28:43 EDT | 0 | 9.8 |
| x1-SHc-fold-W | 2026-10-12 15:28:43 EDT | 0 | 11.2 |
| x1-SHc-fold-C1 | 2026-10-12 15:28:54 EDT | 0 | 10.8 |
| x1-BT-file-W | 2026-10-12 15:28:53 EDT | 0 | 13.0 |
| x1-SHc-fold-C2 | 2026-10-12 15:29:05 EDT | 0 | 12.3 |
| x1-BT-file-C1 | 2026-10-12 15:29:06 EDT | 0 | 13.8 |
| x1-SHc-file-W | 2026-10-12 15:29:17 EDT | 0 | 11.4 |
| x1-BT-file-C2 | 2026-10-12 15:29:20 EDT | 0 | 12.2 |
| x1-SHc-file-C1 | 2026-10-12 15:29:29 EDT | 0 | 11.2 |
| x1-BT-file-C3 | 2026-10-12 15:29:32 EDT | 0 | 12.4 |
| x1-SHc-file-C2 | 2026-10-12 15:29:40 EDT | 0 | 9.6 |
| x1-SHc-fold-Wclean | 2026-10-12 15:29:50 EDT | 0 | 8.3 |
| x1-BT-fold-W | 2026-10-12 15:29:44 EDT | 0 | 15.2 |
| x1-SHc-fold-C1clean | 2026-10-12 15:29:58 EDT | 0 | 10.6 |
| x1-BT-fold-C1 | 2026-10-12 15:30:00 EDT | 0 | 15.4 |
| x1-SHc-file-C1clean | 2026-10-12 15:30:09 EDT | 0 | 10.3 |
| x1-BT-fold-C2 | 2026-10-12 15:30:15 EDT | 0 | 13.0 |
| x1-SHa-fold-Wclean | 2026-10-12 15:30:19 EDT | 0 | 10.4 |
| x1-SHa-fold-C1clean | 2026-10-12 15:30:29 EDT | 0 | 10.2 |
| x1-BT-fold-C3 | 2026-10-12 15:30:28 EDT | 0 | 14.0 |
| x1-SHa-file-C1clean | 2026-10-12 15:30:40 EDT | 0 | 10.4 |
| mkx | 2026-10-12 15:30:52 EDT | 0 | 0.1 |
| x1-IB-fold-W | 2026-10-12 15:30:42 EDT | 0 | 11.0 |
| x1-SHa-fold-W | 2026-10-12 15:30:50 EDT | 0 | 9.9 |
| x1-IB-fold-C1 | 2026-10-12 15:30:53 EDT | 0 | 11.2 |
| x1-SHa-fold-Wnow | 2026-10-12 15:31:00 EDT | 0 | 11.1 |
| x1-IB-fold-C2 | 2026-10-12 15:31:04 EDT | 0 | 10.9 |
| x1-SHa-fold-C1 | 2026-10-12 15:31:11 EDT | 0 | 11.3 |
| x1-IB-fold-Wclean | 2026-10-12 15:31:15 EDT | 0 | 10.9 |
| x1-SHa-fold-C2 | 2026-10-12 15:31:22 EDT | 0 | 11.0 |
| x1-IB-fold-C1clean | 2026-10-12 15:31:26 EDT | 0 | 9.5 |
| x1-SHa-file-W | 2026-10-12 15:31:33 EDT | 0 | 10.1 |
| x1-IB-file-W | 2026-10-12 15:31:36 EDT | 0 | 10.7 |
| x1-SHa-file-Wread | 2026-10-12 15:31:44 EDT | 0 | 11.0 |
| x1-IB-file-C1 | 2026-10-12 15:31:46 EDT | 0 | 10.9 |
| clock1 | 2026-10-12 15:32:02 EDT | 0 | 0.1 |
| x1-SHa-file-C1 | 2026-10-12 15:31:55 EDT | 0 | 9.9 |
| mx1a | 2026-10-12 15:28:43 EDT | 0 | 201.7 |
| x1-IB-file-C2 | 2026-10-12 15:31:57 EDT | 0 | 8.8 |
| x1-IB-file-Wclean | 2026-10-12 15:32:06 EDT | 0 | 9.5 |
| x1-IB-file-C1clean | 2026-10-12 15:32:16 EDT | 0 | 7.5 |
| mx1b | 2026-10-12 15:28:43 EDT | 0 | 220.3 |
| snapdir | 2026-10-12 15:33:19 EDT | 0 | 0.1 |
| check-x1 | 2026-10-12 15:33:25 EDT | 0 | 0.1 |
| check-x1-head | 2026-10-12 15:33:29 EDT | 0 | 0.1 |
| cmp-x1-r2 | 2026-10-12 15:33:43 EDT | 0 | 0.3 |
| cmp-x1-r3 | 2026-10-12 15:33:43 EDT | 0 | 0.1 |
| xhash | 2026-10-12 15:33:56 EDT | 0 | 0.1 |
| y1-SHc-fold-Wedit | 2026-10-12 15:33:56 EDT | 0 | 7.2 |
| y1-SHc-file-Wedit | 2026-10-12 15:34:03 EDT | 0 | 7.0 |
| y1-SHc-fold-Wread | 2026-10-12 15:34:10 EDT | 0 | 6.1 |
| y1-SHc-file-Wread | 2026-10-12 15:34:16 EDT | 0 | 5.2 |
| y1-SHc-fold-Whist | 2026-10-12 15:34:22 EDT | 0 | 5.9 |
| y1-SHa-fold-Wlate | 2026-10-12 15:34:28 EDT | 0 | 7.2 |
| y1-IB-fold-C3clean | 2026-10-12 15:34:35 EDT | 0 | 5.8 |
| y1-IB-fold-C1oldclean | 2026-10-12 15:34:41 EDT | 0 | 6.4 |
| mxx1 | 2026-10-12 15:33:56 EDT | 0 | 51.0 |
| xcheck-y1 | 2026-10-12 15:34:50 EDT | 0 | 0.1 |
| reach-bt | 2026-10-12 15:36:00 EDT | 0 | 0.1 |
| reach-shc | 2026-10-12 15:36:00 EDT | 0 | 0.1 |
| xhash2 | 2026-10-12 15:37:01 EDT | 0 | 0.0 |
| y2-BT-file-Wcf | 2026-10-12 15:37:01 EDT | 0 | 6.3 |
| mxx2 | 2026-10-12 15:37:01 EDT | 0 | 6.4 |
| xcheck-y2 | 2026-10-12 15:37:08 EDT | 0 | 0.1 |
| xcheck-y2-fails | 2026-10-12 15:37:15 EDT | 1 | 0.0 |
| reach-cf | 2026-10-12 15:37:15 EDT | 0 | 0.1 |
| xcheck-y2-full | 2026-10-12 15:37:21 EDT | 0 | 0.1 |
| xcheck-y2-fails2 | 2026-10-12 15:37:21 EDT | 0 | 0.0 |
| y3-SHc-fold-Wedit | 2026-10-12 15:37:36 EDT | 0 | 5.8 |
| y3-SHc-file-Wedit | 2026-10-12 15:37:42 EDT | 0 | 5.5 |
| y3-SHc-fold-Wread | 2026-10-12 15:37:48 EDT | 0 | 4.6 |
| y3-SHc-file-Wread | 2026-10-12 15:37:52 EDT | 0 | 4.1 |
| p-blobs | 2026-10-12 15:37:58 EDT | 0 | 0.8 |
| out-boards | 2026-10-12 15:37:59 EDT | 0 | 0.3 |
| pids-forbidden | 2026-10-12 15:37:59 EDT | 0 | 0.2 |
| y3-SHc-fold-Whist | 2026-10-12 15:37:56 EDT | 0 | 5.7 |
| y3-SHa-fold-Wlate | 2026-10-12 15:38:02 EDT | 0 | 7.4 |
| y3-IB-fold-C3clean | 2026-10-12 15:38:09 EDT | 0 | 5.7 |
| y3-IB-fold-C1oldclean | 2026-10-12 15:38:15 EDT | 0 | 4.7 |
| y3-progress | 2026-10-12 15:38:20 EDT | 0 | 0.0 |
| y3-BT-file-Wcf | 2026-10-12 15:38:20 EDT | 0 | 5.7 |
| mxx3 | 2026-10-12 15:37:36 EDT | 0 | 49.2 |
| xcheck-y3 | 2026-10-12 15:38:25 EDT | 0 | 0.1 |
| xcheck-y3-sum | 2026-10-12 15:38:26 EDT | 0 | 0.0 |
| cmp-r1-r2 | 2026-10-12 15:38:44 EDT | 0 | 0.2 |
| u24-logs-check | 2026-10-12 15:38:44 EDT | 0 | 0.0 |
| y3-sum | 2026-10-12 15:38:52 EDT | 0 | 0.0 |
| xcheck-y1-final | 2026-10-12 15:39:07 EDT | 0 | 0.1 |
| cmp-y1-y3 | 2026-10-12 15:39:07 EDT | 0 | 0.1 |
| u24-ids | 2026-10-12 15:39:07 EDT | 0 | 0.0 |
| fileorigin | 2026-10-12 15:39:40 EDT | 0 | 0.7 |
| u24-runs | 2026-10-12 15:39:54 EDT | 0 | 0.0 |
| xhash3 | 2026-10-12 15:41:20 EDT | 0 | 0.0 |
| y4dev-SHc-fold-Wauto | 2026-10-12 15:41:20 EDT | 0 | 6.0 |
| mxx4dev | 2026-10-12 15:41:20 EDT | 0 | 6.0 |
| xcheck-y4dev | 2026-10-12 15:41:26 EDT | 0 | 0.1 |
| xcheck-y4dev-sum | 2026-10-12 15:41:26 EDT | 0 | 0.1 |
| y4-SHc-fold-Wedit | 2026-10-12 15:41:36 EDT | 0 | 6.0 |
| y4-SHc-file-Wedit | 2026-10-12 15:41:42 EDT | 0 | 5.8 |
| y4-SHc-fold-Wread | 2026-10-12 15:41:48 EDT | 0 | 5.9 |
| y4-SHc-file-Wread | 2026-10-12 15:41:54 EDT | 0 | 4.8 |
| y4-SHc-fold-Whist | 2026-10-12 15:41:59 EDT | 0 | 6.0 |
| y4-SHc-fold-Wauto | 2026-10-12 15:42:05 EDT | 0 | 5.8 |
| y4-SHa-fold-Wlate | 2026-10-12 15:42:10 EDT | 0 | 6.7 |
| y4-BT-file-Wcf | 2026-10-12 15:42:17 EDT | 0 | 5.7 |
| y4-IB-fold-C3clean | 2026-10-12 15:42:23 EDT | 0 | 4.7 |
| y4-IB-fold-C1oldclean | 2026-10-12 15:42:28 EDT | 0 | 4.6 |
| mxx4 | 2026-10-12 15:41:36 EDT | 0 | 56.2 |
| xcheck-y4 | 2026-10-12 15:42:32 EDT | 0 | 0.1 |
| xcheck-y4-sum | 2026-10-12 15:42:32 EDT | 0 | 0.1 |
| end-blobs | 2026-10-12 15:42:44 EDT | 0 | 0.1 |
| end-ob-status | 2026-10-12 15:42:44 EDT | 0 | 0.0 |
| end-ob-head | 2026-10-12 15:42:44 EDT | 128 | 0.0 |
| end-lock | 2026-10-12 15:42:44 EDT | 0 | 0.1 |
| end-ob-head2 | 2026-10-12 15:42:52 EDT | 0 | 0.0 |
| clock2 | 2026-10-12 15:42:52 EDT | 0 | 0.0 |
| ob-newcommits | 2026-10-12 15:42:57 EDT | 0 | 0.0 |
| pids-table | 2026-10-12 15:43:03 EDT | 0 | 0.0 |
| xtable-y4 | 2026-10-12 15:43:45 EDT | 1 | 0.1 |
| table-x1 | 2026-10-12 15:45:11 EDT | 0 | 0.1 |
| runs-table | 2026-10-12 15:45:11 EDT | 0 | 0.1 |
| my-ids | 2026-10-12 15:45:40 EDT | 0 | 0.1 |
| x1-times | 2026-10-12 15:46:22 EDT | 0 | 0.1 |
| reach-cf-y4 | 2026-10-12 15:47:05 EDT | 0 | 0.1 |
| reach-auto-y4 | 2026-10-12 15:47:05 EDT | 0 | 0.0 |

(This README's own assembly, `mkreadme`, and anything after it, are in `logs/runs.txt` and `pids.txt`, not in the tables above or below.)

## Expected (literal) vs observed

### x1: the builder's 38 scenarios with the builder's literals (`probe-copy/check.mjs`)
The 25 rows that differ are below. All are CONTRACT rows, and each is the same in r2 and r3. The other 497 non-RUN rows are
equal; all 522 are in `logs/table-x1.md`, and per-scenario counts are in `logs/check-x1.log`. How to read them:
- On a W scenario, a CONTRACT ≠ is a reproduction.
- On a control, it means the control is unhealthy, and the builder does not attribute that path (O1, O2, O4).
- IB-fold-Wclean's REACH ≠ is O2. My IB-fold-C3clean and IB-fold-C1oldclean show the same loss with no save.

| scenario | kind | check | expected (literal) | observed (x1) |
|---|---|---|---|---|
| SHc-fold-W | CONTRACT | K1: the end state is not falsely clean | false | **≠** true |
| SHc-file-W | CONTRACT | K1: the end state is not falsely clean | false | **≠** true |
| SHc-fold-Wclean | CONTRACT | K1: the end state is not falsely clean | false | **≠** true |
| SHc-fold-C1clean | CONTRACT | K1: the end state is not falsely clean | false | **≠** true |
| SHc-file-C1clean | CONTRACT | K1: the end state is not falsely clean | false | **≠** true |
| SHa-fold-Wclean | CONTRACT | K1: the end state is not falsely clean | false | **≠** true |
| SHa-fold-Wclean | CONTRACT | K2: after a quiet refresh, not falsely clean | false | **≠** true |
| SHa-fold-Wclean | CONTRACT | K3: reopened, not falsely clean | false | **≠** true |
| SHa-fold-C1clean | CONTRACT | K1: the end state is not falsely clean | false | **≠** true |
| SHa-fold-C1clean | CONTRACT | K2: after a quiet refresh, not falsely clean | false | **≠** true |
| SHa-fold-C1clean | CONTRACT | K3: reopened, not falsely clean | false | **≠** true |
| SHa-file-C1clean | CONTRACT | K1: the end state is not falsely clean | false | **≠** true |
| SHa-file-C1clean | CONTRACT | K3: reopened, not falsely clean | false | **≠** true |
| SHa-fold-W | CONTRACT | K1: the end state is not falsely clean | false | **≠** true |
| SHa-fold-W | CONTRACT | K2: after a quiet refresh, not falsely clean | false | **≠** true |
| SHa-fold-W | CONTRACT | K3: reopened, not falsely clean | false | **≠** true |
| BT-file-W | CONTRACT | K1: the end state is not falsely clean | false | **≠** true |
| BT-fold-W | CONTRACT | K1: the end state is not falsely clean | false | **≠** true |
| BT-fold-C1 | CONTRACT | K1: the end state is not falsely clean | false | **≠** true |
| BT-fold-C1 | CONTRACT | K2: after a quiet refresh, not falsely clean | false | **≠** true |
| BT-fold-C1 | CONTRACT | K3: reopened, not falsely clean | false | **≠** true |
| IB-fold-Wclean | CONTRACT | REACH (reopened): BRAD-1, IMPORT each in a copy the board holds or fetches | [true,true] | **≠** [true,false] |
| IB-fold-Wclean | CONTRACT | REACH (reopened + one edit): BRAD-1, IMPORT each in a copy the board holds or fetches | [true,true] | **≠** [true,false] |
| IB-fold-C1clean | CONTRACT | K3: reopened, not falsely clean | false | **≠** true |
| IB-file-C1clean | CONTRACT | K3: reopened, not falsely clean | false | **≠** true |

### Leaf positions behind problem 1 (`reach.mjs`, read from the runs)
BT-file-W (x1, the builder's probe), where CAROL-F is the content the person last chose:
- end: CAROL-F in screen and storage; BRAD-2 in the file; KEPT-0 kept. Recorded clean against BRAD-2, so falsely clean. Status
  "💾 Saved in place by Carol".
- reopened: BRAD-2 opened from the file, and CAROL-F not kept aside: it is in storage only until the next write.
- reopened + one edit: **CAROL-F only `outside:versionHistory`**.

BT-file-Wcf (y4, the counterfactual: the record marked unsaved before the reopen):
- reopened: the file is held back ("… already keeps earlier work aside … not loaded"). CAROL-F stays on screen and in storage.
- reopened + one edit: CAROL-F still in screen and storage.

### Added scenarios: expected (hand-written in `x/xcheck.mjs` before each was first run) vs observed, pass y4
| scenario | kind | check | expected (literal) | observed (y4) |
|---|---|---|---|---|
| SHc-fold-Wedit | HOLD | held [reached, busy, target, DIRTY, asked] | [true,1,"BRAD-1",true,0] | = [true,1,"BRAD-1",true,0] |
| SHc-fold-Wedit | FIX | an ordinary edit was typed during the held save (no question) | ["typed",0] | = ["typed",0] |
| SHc-fold-Wedit | PRED | the action [screen, busy, gen moved, DIRTY, record dirty, kept] | ["SHARED",1,true,true,true,null] | = ["SHARED",1,true,true,true,null] |
| SHc-fold-Wedit | PRED | end | ["SHARED",false,"BRAD-2","BRAD-2",false] | = ["SHARED",false,"BRAD-2","BRAD-2",false] |
| SHc-fold-Wedit | PRED | reopen | ["SHARED",false,"BRAD-2",false] | = ["SHARED",false,"BRAD-2",false] |
| SHc-fold-Wedit | PRED | refresh | ["SHARED",false,false] | = ["SHARED",false,false] |
| SHc-fold-Wedit | K | K1/K2/K3 falsely clean | [false,false,false] | = [false,false,false] |
| SHc-fold-Wedit | REACH | end: BRAD-2, SHARED in a board copy | [true,true] | = [true,true] |
| SHc-fold-Wedit | REACH | reopened: BRAD-2, SHARED in a board copy | [true,true] | = [true,true] |
| SHc-fold-Wedit | REACH | edited: BRAD-2, SHARED in a board copy | [true,true] | = [true,true] |
| SHc-file-Wedit | HOLD | held [reached, busy, target, DIRTY, asked] | [true,1,"BRAD-1",true,0] | = [true,1,"BRAD-1",true,0] |
| SHc-file-Wedit | FIX | an ordinary edit was typed during the held save (no question) | ["typed",0] | = ["typed",0] |
| SHc-file-Wedit | PRED | the action [screen, busy, gen moved, DIRTY, record dirty, kept] | ["SHARED",1,true,true,true,null] | = ["SHARED",1,true,true,true,null] |
| SHc-file-Wedit | PRED | end | ["SHARED",false,"BRAD-2","BRAD-2",false] | = ["SHARED",false,"BRAD-2","BRAD-2",false] |
| SHc-file-Wedit | PRED | reopen | ["SHARED",false,"BRAD-2",false] | = ["SHARED",false,"BRAD-2",false] |
| SHc-file-Wedit | K | K1/K2/K3 falsely clean | [false,null,false] | = [false,null,false] |
| SHc-file-Wedit | REACH | end: BRAD-2, SHARED in a board copy | [true,true] | = [true,true] |
| SHc-file-Wedit | REACH | reopened: BRAD-2, SHARED in a board copy | [true,true] | = [true,true] |
| SHc-file-Wedit | REACH | edited: BRAD-2, SHARED in a board copy | [true,true] | = [true,true] |
| SHc-fold-Wread | HOLD | held [reached, busy, target, DIRTY, asked] | [true,1,"BRAD-1",true,0] | = [true,1,"BRAD-1",true,0] |
| SHc-fold-Wread | FIX | the person clicked 'load the shared one' (no question) | ["clicked",0] | = ["clicked",0] |
| SHc-fold-Wread | PRED | the action [screen, busy, gen moved, DIRTY, record dirty, kept] | ["SHARED",1,false,true,true,"BRAD-2"] | = ["SHARED",1,false,true,true,"BRAD-2"] |
| SHc-fold-Wread | PRED | end | ["SHARED",true,"SHARED","SHARED",false] | = ["SHARED",true,"SHARED","SHARED",false] |
| SHc-fold-Wread | PRED | reopen | ["SHARED",true,"SHARED",false] | = ["SHARED",true,"SHARED",false] |
| SHc-fold-Wread | PRED | refresh | ["SHARED",true,false] | = ["SHARED",true,false] |
| SHc-fold-Wread | K | K1/K2/K3 falsely clean | [false,false,false] | = [false,false,false] |
| SHc-fold-Wread | REACH | end: BRAD-2, SHARED in a board copy | [true,true] | = [true,true] |
| SHc-fold-Wread | REACH | reopened: BRAD-2, SHARED in a board copy | [true,true] | = [true,true] |
| SHc-fold-Wread | REACH | edited: BRAD-2, SHARED in a board copy | [true,true] | = [true,true] |
| SHc-file-Wread | HOLD | held [reached, busy, target, DIRTY, asked] | [true,1,"BRAD-1",true,0] | = [true,1,"BRAD-1",true,0] |
| SHc-file-Wread | FIX | the person clicked 'load the shared one' (no question) | ["clicked",0] | = ["clicked",0] |
| SHc-file-Wread | PRED | the action [screen, busy, gen moved, DIRTY, record dirty, kept] | ["SHARED",1,false,true,true,"BRAD-2"] | = ["SHARED",1,false,true,true,"BRAD-2"] |
| SHc-file-Wread | PRED | end | ["SHARED",true,"SHARED","SHARED",false] | = ["SHARED",true,"SHARED","SHARED",false] |
| SHc-file-Wread | PRED | reopen | ["SHARED",true,"SHARED",false] | = ["SHARED",true,"SHARED",false] |
| SHc-file-Wread | K | K1/K2/K3 falsely clean | [false,null,false] | = [false,null,false] |
| SHc-file-Wread | REACH | end: BRAD-2, SHARED in a board copy | [true,true] | = [true,true] |
| SHc-file-Wread | REACH | reopened: BRAD-2, SHARED in a board copy | [true,true] | = [true,true] |
| SHc-file-Wread | REACH | edited: BRAD-2, SHARED in a board copy | [true,true] | = [true,true] |
| SHc-fold-Whist | HOLD | held [reached, busy, target, DIRTY, asked] | [true,1,"BRAD-1",true,0] | = [true,1,"BRAD-1",true,0] |
| SHc-fold-Whist | HOLD | the hold was hit at the history copy, not the head | true | = true |
| SHc-fold-Whist | FIX | the person clicked 'load the shared one' (no question) | ["clicked",0] | = ["clicked",0] |
| SHc-fold-Whist | PRED | the action [screen, busy, gen moved, DIRTY, record dirty, kept] | ["SHARED",1,false,true,true,"BRAD-2"] | = ["SHARED",1,false,true,true,"BRAD-2"] |
| SHc-fold-Whist | PRED | end | ["SHARED",true,"BRAD-2","BRAD-2",true] | = ["SHARED",true,"BRAD-2","BRAD-2",true] |
| SHc-fold-Whist | PRED | reopen | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| SHc-fold-Whist | PRED | refresh | ["BRAD-2",true,false] | = ["BRAD-2",true,false] |
| SHc-fold-Whist | K | K1/K2/K3 falsely clean | [true,false,false] | = [true,false,false] |
| SHc-fold-Whist | REACH | end: BRAD-2, SHARED in a board copy | [true,true] | = [true,true] |
| SHc-fold-Whist | REACH | reopened: BRAD-2, SHARED in a board copy | [true,true] | = [true,true] |
| SHc-fold-Whist | REACH | edited: BRAD-2, SHARED in a board copy | [true,true] | = [true,true] |
| SHa-fold-Wlate | HOLD | held [reached, busy, target, DIRTY, asked] | [true,1,"BRAD-1",false,0] | = [true,1,"BRAD-1",false,0] |
| SHa-fold-Wlate | FIX | the state file was stamped after the save restamped the board (no clock skew), within 5 s | true | = true |
| SHa-fold-Wlate | FIX | the answer arrived | true | = true |
| SHa-fold-Wlate | PRED | the action [screen, busy, gen moved, DIRTY, record dirty, kept] | ["SHARED",1,false,false,true,"BRAD-2"] | = ["SHARED",1,false,false,true,"BRAD-2"] |
| SHa-fold-Wlate | PRED | end | ["SHARED",true,"BRAD-2","BRAD-2",true] | = ["SHARED",true,"BRAD-2","BRAD-2",true] |
| SHa-fold-Wlate | PRED | reopen | ["SHARED",true,"BRAD-2",true] | = ["SHARED",true,"BRAD-2",true] |
| SHa-fold-Wlate | PRED | refresh | ["SHARED",true,true] | = ["SHARED",true,true] |
| SHa-fold-Wlate | K | K1/K2/K3 falsely clean | [true,true,true] | = [true,true,true] |
| SHa-fold-Wlate | REACH | end: BRAD-2, SHARED in a board copy | [true,true] | = [true,true] |
| SHa-fold-Wlate | REACH | reopened: BRAD-2, SHARED in a board copy | [true,true] | = [true,true] |
| SHa-fold-Wlate | REACH | edited: BRAD-2, SHARED in a board copy | [true,true] | = [true,true] |
| IB-fold-C3clean | FIX | the save alone landed [questions asked] | [0] | = [0] |
| IB-fold-C3clean | FIX | the batch asked once, answered OK, and finished | [1,true] | = [1,true] |
| IB-fold-C3clean | PRED | the action [screen, busy, gen moved, DIRTY, record dirty, kept] | ["IMPORT",0,true,true,false,null] | = ["IMPORT",0,true,true,false,null] |
| IB-fold-C3clean | PRED | end | ["IMPORT",false,"BRAD-1","BRAD-1",false] | = ["IMPORT",false,"BRAD-1","BRAD-1",false] |
| IB-fold-C3clean | PRED | reopen | ["BRAD-1",true,"BRAD-1",false] | = ["BRAD-1",true,"BRAD-1",false] |
| IB-fold-C3clean | PRED | refresh | ["IMPORT",false,false] | = ["IMPORT",false,false] |
| IB-fold-C3clean | K | K1/K2/K3 falsely clean | [false,false,false] | = [false,false,false] |
| IB-fold-C3clean | REACH | end: BRAD-1, IMPORT in a board copy | [true,true] | = [true,true] |
| IB-fold-C3clean | REACH | reopened: BRAD-1, IMPORT in a board copy | [true,false] | = [true,false] |
| IB-fold-C3clean | REACH | edited: BRAD-1, IMPORT in a board copy | [true,false] | = [true,false] |
| IB-fold-C1oldclean | FIX | the imported board is older than the folder copy | true | = true |
| IB-fold-C1oldclean | FIX | the batch asked once, answered OK, and finished | [1,true] | = [1,true] |
| IB-fold-C1oldclean | PRED | the action [screen, busy, gen moved, DIRTY, record dirty, kept] | ["IMPORT",0,true,true,false,null] | = ["IMPORT",0,true,true,false,null] |
| IB-fold-C1oldclean | PRED | end | ["IMPORT",false,"BRAD-1","BRAD-1",false] | = ["IMPORT",false,"BRAD-1","BRAD-1",false] |
| IB-fold-C1oldclean | PRED | reopen | ["BRAD-1",true,"BRAD-1",false] | = ["BRAD-1",true,"BRAD-1",false] |
| IB-fold-C1oldclean | PRED | refresh | ["IMPORT",false,false] | = ["IMPORT",false,false] |
| IB-fold-C1oldclean | K | K1/K2/K3 falsely clean | [false,false,false] | = [false,false,false] |
| IB-fold-C1oldclean | REACH | end: BRAD-1, IMPORT in a board copy | [true,true] | = [true,true] |
| IB-fold-C1oldclean | REACH | reopened: BRAD-1, IMPORT in a board copy | [true,false] | = [true,false] |
| IB-fold-C1oldclean | REACH | edited: BRAD-1, IMPORT in a board copy | [true,false] | = [true,false] |
| BT-file-Wcf | HOLD | held [reached, busy, target, DIRTY, asked] | [true,1,"CAROL-F",true,1] | = [true,1,"CAROL-F",true,1] |
| BT-file-Wcf | FIX | the person clicked 'open the file’s version' and answered its one question OK | ["clicked",1] | = ["clicked",1] |
| BT-file-Wcf | CF | COUNTERFACTUAL mark applied: [DIRTY, record dirty, screen] | [true,true,"CAROL-F"] | = [true,true,"CAROL-F"] |
| BT-file-Wcf | PRED | the action [screen, busy, gen moved, DIRTY, record dirty, kept] | ["CAROL-F",1,false,false,false,"KEPT-0"] | = ["CAROL-F",1,false,false,false,"KEPT-0"] |
| BT-file-Wcf | PRED | end | ["CAROL-F",true,"BRAD-2","BRAD-2",true] | = ["CAROL-F",true,"BRAD-2","BRAD-2",true] |
| BT-file-Wcf | PRED | reopen | ["CAROL-F",false,"BRAD-2",false] | = ["CAROL-F",false,"BRAD-2",false] |
| BT-file-Wcf | K | K1/K2/K3 falsely clean | [true,null,false] | = [true,null,false] |
| BT-file-Wcf | REACH | end: BRAD-2, KEPT-0, CAROL-F in a board copy | [true,true,true] | = [true,true,true] |
| BT-file-Wcf | REACH | reopened: BRAD-2, KEPT-0, CAROL-F in a board copy | [true,true,true] | = [true,true,true] |
| BT-file-Wcf | REACH | edited: BRAD-2, KEPT-0, CAROL-F in a board copy | [true,true,true] | = [true,true,true] |
| SHc-fold-Wauto | HOLD | held [reached, busy, target, DIRTY, asked] | [true,1,"BRAD-1",true,0] | = [true,1,"BRAD-1",true,0] |
| SHc-fold-Wauto | FIX | the person clicked 'load the shared one' (no question) | ["clicked",0] | = ["clicked",0] |
| SHc-fold-Wauto | FIX | the autosave was on and armed before the tick [auto, live, DIRTY] | [true,true,true] | = [true,true,true] |
| SHc-fold-Wauto | PRED | after the autosave landed, before its refresh [screen, busy, recorded clean, base, FALSELY CLEAN] | ["SHARED",0,true,"BRAD-2",true] | = ["SHARED",0,true,"BRAD-2",true] |
| SHc-fold-Wauto | PRED | what the status line says at the end | "shared-loaded" | = "shared-loaded" |
| SHc-fold-Wauto | PRED | the action [screen, busy, gen moved, DIRTY, record dirty, kept] | ["SHARED",1,false,true,true,"BRAD-2"] | = ["SHARED",1,false,true,true,"BRAD-2"] |
| SHc-fold-Wauto | PRED | end | ["BRAD-2",true,"BRAD-2","BRAD-2",false] | = ["BRAD-2",true,"BRAD-2","BRAD-2",false] |
| SHc-fold-Wauto | PRED | reopen | ["BRAD-2",true,"BRAD-2",false] | = ["BRAD-2",true,"BRAD-2",false] |
| SHc-fold-Wauto | PRED | refresh | ["BRAD-2",true,false] | = ["BRAD-2",true,false] |
| SHc-fold-Wauto | K | K1/K2/K3 falsely clean | [false,false,false] | = [false,false,false] |
| SHc-fold-Wauto | REACH | end: BRAD-2, SHARED in a board copy | [true,true] | = [true,true] |
| SHc-fold-Wauto | REACH | reopened: BRAD-2, SHARED in a board copy | [true,true] | = [true,true] |
| SHc-fold-Wauto | REACH | edited: BRAD-2, SHARED in a board copy | [true,true] | = [true,true] |

## PIDs (from `pids.txt`: the `setsid -w timeout` PID, then its child; "gone" = the child had already exited when it was looked up)
No process was killed or signalled by this check. q.sh's `kill -0` sends no signal: it only asks whether its own child still
exists.

| label | PIDs |
|---|---|
| clock0 | 22894(timeout), 22903(gone) |
| ls-base | 23678(gone) |
| ls-lock | 25316(gone) |
| cp-base | 27170(gone), 27173(gone) |
| cp-probe | 27196(gone) |
| hash-ids | 27218(timeout), 27224(git) |
| ledger-u24 | 11940(gone), 11946(gone) |
| ob-status | 12096(timeout), 12098(gone) |
| ob-head | 12124(gone), 12130(gone) |
| ob-blobs | 12149(gone), 12155(gone) |
| ob-wt | 12174(gone), 12179(gone) |
| oui-status | 12199(gone), 12205(gone) |
| x0-SHc-fold-W | 12241(timeout), 12247(node) |
| mx1a | 12294(timeout), 12297(bash) |
| x1-SHc-fold-W | 12309(timeout), 12315(node) |
| mx1b | 12341(timeout), 12348(bash) |
| x1-SHa-file-C2 | 12354(timeout), 12358(node) |
| x1-BT-file-W | 12394(timeout), 12400(node) |
| x1-SHc-fold-C1 | 12452(timeout), 12461(node) |
| x1-SHc-fold-C2 | 13947(timeout), 13950(node) |
| x1-BT-file-C1 | 13980(timeout), 13994(node) |
| x1-SHc-file-W | 15376(timeout), 15382(node) |
| x1-BT-file-C2 | 15771(timeout), 15782(node) |
| x1-SHc-file-C1 | 17089(timeout), 17094(node) |
| x1-BT-file-C3 | 17579(timeout), 17581(node) |
| x1-SHc-file-C2 | 18704(timeout), 18707(node) |
| x1-BT-fold-W | 19207(timeout), 19213(node) |
| x1-SHc-fold-Wclean | 19243(timeout), 19249(node) |
| x1-SHc-fold-C1clean | 19281(timeout), 19287(node) |
| x1-BT-fold-C1 | 19313(timeout), 19319(node) |
| x1-SHc-file-C1clean | 19722(timeout), 19726(node) |
| x1-BT-fold-C2 | 19829(timeout), 19835(node) |
| x1-SHa-fold-Wclean | 19890(timeout), 19896(node) |
| x1-BT-fold-C3 | 19967(timeout), 19973(node) |
| x1-SHa-fold-C1clean | 19999(timeout), 20005(node) |
| x1-SHa-file-C1clean | 20192(timeout), 20198(node) |
| x1-IB-fold-W | 20226(timeout), 20228(node) |
| x1-SHa-fold-W | 20339(timeout), 20341(node) |
| mkx | 20364(gone), 20370(gone) |
| x1-IB-fold-C1 | 20424(timeout), 20430(node) |
| x1-SHa-fold-Wnow | 20552(timeout), 20558(node) |
| x1-IB-fold-C2 | 20585(timeout), 20588(node) |
| x1-SHa-fold-C1 | 20767(timeout), 20769(node) |
| x1-IB-fold-Wclean | 20799(timeout), 20801(node) |
| x1-SHa-fold-C2 | 20838(timeout), 20841(node) |
| x1-IB-fold-C1clean | 20899(timeout), 20905(node) |
| x1-SHa-file-W | 21001(timeout), 21007(node) |
| x1-IB-file-W | 21033(timeout), 21035(node) |
| x1-SHa-file-Wread | 21072(timeout), 21078(node) |
| x1-IB-file-C1 | 21104(timeout), 21106(node) |
| x1-SHa-file-C1 | 21143(timeout), 21145(node) |
| x1-IB-file-C2 | 21183(timeout), 21185(node) |
| clock1 | 21210(gone) |
| x1-IB-file-Wclean | 21265(timeout), 21271(node) |
| x1-IB-file-C1clean | 21308(timeout), 21314(node) |
| snapdir | 21816(gone), 21822(gone) |
| check-x1 | 21889(timeout), 21895(node) |
| check-x1-head | 22032(gone) |
| cmp-x1-r2 | 22114(timeout), 22117(node) |
| cmp-x1-r3 | 22146(timeout), 22148(gone) |
| xhash | 22192(gone) |
| mxx1 | 22214(timeout), 22220(bash) |
| y1-SHc-fold-Wedit | 22229(timeout), 22236(node) |
| y1-SHc-file-Wedit | 22306(timeout), 22308(node) |
| y1-SHc-fold-Wread | 22342(timeout), 22344(node) |
| y1-SHc-file-Wread | 22384(timeout), 22390(node) |
| y1-SHc-fold-Whist | 22420(timeout), 22426(node) |
| y1-SHa-fold-Wlate | 22546(timeout), 22548(node) |
| y1-IB-fold-C3clean | 22580(timeout), 22586(node) |
| y1-IB-fold-C1oldclean | 22647(timeout), 22653(node) |
| xcheck-y1 | 22722(timeout), 22724(node) |
| reach-bt | 22989(timeout), 22995(node) |
| reach-shc | 23026(timeout), 23032(gone) |
| xhash2 | 24684(gone) |
| mxx2 | 24706(timeout), 24709(bash) |
| y2-BT-file-Wcf | 24723(timeout), 24726(node) |
| xcheck-y2 | 24764(timeout), 24770(bash) |
| xcheck-y2-fails | 24808(gone) |
| reach-cf | 24830(timeout), 24832(node) |
| xcheck-y2-full | 25094(timeout), 25097(node) |
| xcheck-y2-fails2 | 25126(gone) |
| mxx3 | 25980(timeout), 25986(bash) |
| y3-SHc-fold-Wedit | 25996(timeout), 25998(node) |
| y3-SHc-file-Wedit | 26705(timeout), 26708(node) |
| y3-SHc-fold-Wread | 27352(timeout), 27354(node) |
| y3-SHc-file-Wread | 27480(timeout), 27486(node) |
| y3-SHc-fold-Whist | 27545(timeout), 27547(node) |
| p-blobs | 27576(timeout), 27582(bash) |
| out-boards | 27602(timeout), 27608(bash) |
| pids-forbidden | 27630(timeout), 27633(bash) |
| y3-SHa-fold-Wlate | 28128(timeout), 28130(node) |
| y3-IB-fold-C3clean | 29322(timeout), 29327(node) |
| y3-IB-fold-C1oldclean | 30488(timeout), 30490(node) |
| y3-BT-file-Wcf | 30527(timeout), 30532(node) |
| y3-progress | 30554(gone) |
| xcheck-y3 | 30800(timeout), 30802(node) |
| xcheck-y3-sum | 30831(gone) |
| cmp-r1-r2 | 30886(timeout), 30888(bash) |
| u24-logs-check | 30927(timeout), 30933(gone) |
| y3-sum | 31005(timeout), 31011(gone) |
| xcheck-y1-final | 31489(timeout), 31495(node) |
| cmp-y1-y3 | 31520(timeout), 31522(bash) |
| u24-ids | 31554(timeout), 31556(gone) |
| fileorigin | 31925(timeout), 31927(node) |
| u24-runs | 32080(gone), 32086(gone) |
| xhash3 | 32674(gone) |
| mxx4dev | 32696(timeout), 32698(bash) |
| y4dev-SHc-fold-Wauto | 32709(timeout), 32717(node) |
| xcheck-y4dev | 306(timeout), 308(node) |
| xcheck-y4dev-sum | 337(gone) |
| mxx4 | 386(timeout), 389(bash) |
| y4-SHc-fold-Wedit | 401(timeout), 407(node) |
| y4-SHc-file-Wedit | 487(timeout), 490(node) |
| y4-SHc-fold-Wread | 522(timeout), 528(node) |
| y4-SHc-file-Wread | 554(timeout), 556(node) |
| y4-SHc-fold-Whist | 603(timeout), 610(node) |
| y4-SHc-fold-Wauto | 720(timeout), 722(node) |
| y4-SHa-fold-Wlate | 981(timeout), 984(node) |
| y4-BT-file-Wcf | 1063(timeout), 1066(node) |
| y4-IB-fold-C3clean | 1330(timeout), 1332(node) |
| y4-IB-fold-C1oldclean | 1429(timeout), 1432(node) |
| xcheck-y4 | 1483(timeout), 1489(node) |
| xcheck-y4-sum | 1514(timeout), 1520(bash) |
| end-blobs | 1828(timeout), 1831(git) |
| end-ob-status | 1853(gone), 1859(gone) |
| end-ob-head | 1885(gone) |
| end-lock | 1907(gone), 1911(gone) |
| end-ob-head2 | 2546(gone) |
| clock2 | 2568(gone) |
| ob-newcommits | 2609(gone) |
| pids-table | 2643(gone), 2649(gone) |
| xtable-y4 | 3324(timeout), 3326(bash) |
| table-x1 | 5695(timeout), 5699(bash) |
| runs-table | 5731(gone), 5738(gone) |
| my-ids | 10865(timeout), 10868(bash) |
| x1-times | 13589(gone), 13591(gone) |
| reach-cf-y4 | 15303(timeout), 15309(node) |
| reach-auto-y4 | 15334(timeout), 15337(node) |

## What was NOT done
- **Nothing in `/home/user/orbit-board` or `/home/user/orbit-ui` was edited, staged, committed or pushed.**
  - orbit-board was read only, with `git --no-optional-locks` (status, log, rev-parse) and `git hash-object`. It stayed clean.
    Its HEAD moved from `a386223` to `9ef4f28` during the check: records-only commits by other sessions, 15:37 to 15:39 ET. The
    board blob stayed `98eed7e8`.
  - orbit-ui was only `git status`-ed. It shows ` M ui-concept/CHUNK3.md`, which is not mine.
- **Not run:**
  - `mutate.mjs` was never read, imported or run.
  - The full `audit-import.mjs` and `audit-board.mjs` were not run, and no suite was run.
  - No Chromium or Playwright, and no `playwright install`.
- **Nothing in the builder's directory `rec/L4/u24` was changed.** Its probe and checker were copied to `probe-copy/` and run from
  there. Its outputs were only read.
- **No fix was applied and no product diff was written.** `PROPOSAL.md` amends the builder's proposal tests only.
- **Not tried:**
  - the `file://` XHR sidecar route (jsdom refuses localStorage for `file://`, measured in `logs/fileorigin.log`);
  - a second tab or Web Locks (U20);
  - the next 💾 Save or ↶ Put back from the falsely-clean states (U17);
  - `bootTakeFile`'s "no room" offer;
  - the autosave route for BT and IB (only SHc-fold-Wauto was run).
- **Not re-run separately:** the builder's dev, dev2 and r1 passes. x1 re-runs all 38 scenarios of the final probe; r1's agreement
  with r2 was checked from the builder's own outputs.
- **Real-world frequency** of a slow write, a slow state-file answer, or a click during a save was not measured. The holds stand
  in for the slowness.

## Deviations (full list in `logs/deviations.txt`)
- A few small read-only shell utilities ran directly, not through q.sh:
  - `ls`, `mkdir -p` of my own directory, `tail`, `cat`/`grep`/`ls` of my own logs;
  - the x0 smoke loop itself, whose node run was bounded.
- None was node, Python or Chromium.

README assembled at 3:47 PM ET on Mon 12 Oct 2026 (by `TZ=America/New_York date`).
