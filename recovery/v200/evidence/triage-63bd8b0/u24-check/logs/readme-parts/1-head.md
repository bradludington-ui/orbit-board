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
