# U17 check: re-runs and adversarial routes against the builder's U17 probe (rec/L4/u17)

This check is read-only on the product. Nothing was fixed or applied. The review itself is in **`CHECK.md`**; the proposal, which was not applied or run, is in **`PROPOSAL.md`**.

All times are Eastern, taken from the clock (Monday 12 Oct 2026):
- **First part: 11:48:50 to 11:57:57 ET.** It was cut by the usage limit while `r-c137-V1sameperm-save` was running. That run recorded no exit and left an empty log.
- **Resumed at 15:08:10 ET.** The last run started at 15:18:44 ET, and this file was written at 15:22 ET.

## Verdict: REPRODUCED. I agree with the builder's verdict, not with its attribution of SHd, SHdk and FSHd to the save

- **All 160 of the builder's final runs re-ran identically** on my own copies of 63bd8b0 (board `98eed7e8`) and a8891e1 (board `1375b72b`). That covers every check id, pass/fail, observed tuple and literal, the K1 tuple, and the ids.
  - The 10 measured routes and U25mid are closed on 63bd8b0 and open on 1375b72b.
  - On both boards, SHd, SHdk, FSHd and FBT end falsely clean.
- **FBT reproduced through the board's real offer** of "open the file's version" (XFBT: the file is newer at opening, the kept slot is occupied, and the link is clicked in the DOM during a held save).
  - The next Save wrote X-2 over BRAD-3 and asked nothing. BRAD-3 was then in no copy the board can reach.
  - XFBTC (no save) and XFBTL (the save landed first, the next Save **asks**) are consistent, so FBT is attributable to the save under way.
- **SHd, SHdk and FSHd are not attributable to the save.** The same falsely clean record, and the same overwrite with no question, occur **with no save under way** when the board is clean at the click. This was measured on both boards with these routes:
  - XSHn and XFSHn: no save at all, the real link clicked in the DOM;
  - XSHdL and XFSHdL: the save landed first.

  In file mode (XFSHn, XFSHdL), BRAD-2 is then in no copy the board can reach. The builder's P1 guard (`_saveBusy`) does not apply to these routes (by code).

## Identities

| what | blob / value |
|---|---|
| **b63**: `cp -a` of `rec/L4/base` (git archive of orbit-board 63bd8b0) | board `98eed7e801af20270f755eadffb2fa72355c30e5`; audit-import `4aba2506`; boot.mjs `9c4f49ad`; package.json `7cf8186f`; each equal to `git rev-parse 63bd8b0:<path>` (`logs/ids.log`) |
| **c137**: `git archive a8891e1` (board, tools, package.json) + the base's shim + `node_modules` symlink | board `1375b72b6707faa57c50d528e01ce9611f194998`; audit-import `ed9a3437`; boot.mjs `9c4f49ad`; package.json `7cf8186f`; each equal to `git rev-parse a8891e1:<path>` |
| shim / node_modules | `6e2ce2e6` / symlink to `/home/user/orbit-board/node_modules` |
| my copies vs the builder's | boards and tools: the same (`cmp`, `diff -r`; `logs/ids.log`) |
| **builder's probe, re-run unchanged** | `probe/u17-probe.mjs` `6b65ff659b6f2f374b29b2707cf1ce049a5eecf2`, the same as `rec/L4/u17/u17-probe.mjs` (`cmp`). It is head `403725b1` + W1H `e771578d` + body `08d74d0c`. W1H = audit-import L3745–3813 on both boards = `rec/L2/u13codex/w1h-block.txt`. |
| **my adversarial probe (final, the `x-*` runs)** | `x-probe.mjs` `c47a43b62bf00e391aafa040de32f37109e10699`: a one-line header + the builder's head + W1H (both verbatim, `cmp`'d by `xbuild.sh`) + `src/x-body.mjs` `de79e82f` |
| my adversarial probe (trial, the `xt-*` runs, before the cut) | `x-probe.mjs` `2a3c6014` (x-body `98a4fef4`). That file was overwritten at the resume. Its literals for the five scenarios it ran equal the final ones (`expsame.mjs`, `logs/expsame.log`). |
| runners | `q.sh` `5b9f953c` (lock, bound, PIDs, runs.txt), `rr.sh` `c5467765`, `mm.sh` `375047d5` (the builder's 10 chunks), `mm2.sh` `24ed3daf` (the rest of M137 after the cut), `xr.sh` `afbe7969`, `xmm.sh` `90ad4db5`, `xbuild.sh` `82bb291b`, `ids.sh` `678b14d7` |
| read-only tools | `cmp.mjs` `0385847b`, `xagg.mjs` `cbd652a6`, `expsame.mjs` `09c8caae` |
| proposal (text only, never run) | `prop/mkP3.py` `68c29874`, `prop/proposal-P3.diff` `7e0daad7`, `prop/prioritization-board-grid.P3.html` `82d39ead` |
| orbit-board (read only: `rev-parse` and `hash-object`) | HEAD 239fc7e at 11:48 ET and a386223 at about 15:13 ET, moved by other work. HEAD:board = working board = `98eed7e8` both times. orbit-ui HEAD 5a298b7 at 11:48 ET. |

In every run, `BOARD` and `MUT_FIRST_FAIL` were unset (`q.sh`). Each run's `out/*.json` records its ids, and every `ids.board` is one of the two blobs (191 outputs).

## Expected vs observed

### A. The builder's 160 final runs, re-run (`r-*` vs the builder's `f-*`; `cmp.mjs`, `logs/cmp2.log`)

| | labels | identical | fixture pass/fail | predict pass/fail | contract pass/fail | U18 checks |
|---|---|---|---|---|---|---|
| mine (`r-*`) | 160 | **160** | 868 / 0 | 462 / 0 | 404 / 166 | 12 / 0 |
| builder (`f-*`) | 160 | – | 868 / 0 | 462 / 0 | 404 / 166 | 12 / 0 |

"Identical" means the same check id, kind, pass/fail, observed value and expected literal for every check. It also covers the same `u17state` tuple and the same board, boot.mjs, shim and probe blobs. So every row of the builder's condensed table (its README) holds as observed here.

### B. My adversarial routes (`x-*`, 13 per board; `xagg.mjs`, `logs/xagg1.log`). Every literal passed on both boards, and the two boards are identical

Totals over the 26 runs: fixture 84/84, predict 148/148, contract 4 pass / 22 fail (K1 "not falsely clean"), harness 0.

| route | what it tests | adopt [screen, `_saveBusy`, `_saveGen` unchanged, kept, said] | K1 [screen, clean, base] | next 💾 Save [asked, screen, head/file before, after, says, clean, names head] | reach / V4 |
|---|---|---|---|---|---|
| XSHd | SHd, with a **DOM click** on the button shown during the held save | [SHARED,1,true,BRAD-2,true] | [SHARED,true,BRAD-2] **falsely clean** | [0,SHARED,BRAD-2,SHARED,saved,true,true]; BRAD-2 in the kept slot and `-recent` history | – |
| XSHe | SHd reached from a clean board offered "load the shared one" at once; type, Save held, DOM click | [SHARED,1,true,BRAD-2,true] | **falsely clean** | as XSHd | – |
| XSHdL | **order control**: the save landed first; `adoptShared()` called directly (the link is gone after the landing: a shortcut) | [SHARED,0,true,null,true] | [SHARED,true,BRAD-2] **falsely clean** | [0,SHARED,BRAD-2,SHARED,saved,true,true]; BRAD-2 in `-recent` history only | – |
| XSHn | **no save near the load**: BRAD-2 saved; reopened; the older shared state file offers the link; DOM click | [SHARED,0,true,null,true] | [SHARED,true,BRAD-2] **falsely clean** | as XSHdL | – |
| XFBT | FBT through the **real offer** (`_bootHeld.occupied`); 💾 Save (HOLD ON answered OK) held at close; DOM click on "open the file's version" | [X-2,1,true,BRAD-2,true] | [X-2,true,BRAD-3] **falsely clean** | [0,X-2,BRAD-3,X-2,saved-file,true,true] | BRAD-3 reachable: **false** (earlier file version only) |
| XFBTC | control: no save, the link clicked at opening | [X-2,0,true,BRAD-2,true] | [X-2,true,X-2] consistent | [0,X-2,X-2,X-2,saved-file,true,true] | BRAD-3 false (unsaved, discarded by the person's own confirm) |
| XFBTL | control: the save landed first, then `bootTakeFile()` (shortcut) | [X-2,0,true,BRAD-2,true] | [X-2,true,X-2] consistent | [**1**,X-2,BRAD-3,X-2,saved-file,true,true]: **asks HOLD ON** | BRAD-3 false, after the question was answered OK |
| XFSHd | FSHd, with a DOM click | [SHARED,1,true,BRAD-2,true] | **falsely clean** | [0,SHARED,BRAD-2,SHARED,saved-file,true,true] | BRAD-2 true (kept slot). V4 [BRAD-2,in-file,SHARED,BRAD-2,put back,null,BRAD-2,BRAD-2,saved-file,1] |
| XFSHn | **file mode, no save near the load**: BRAD-2 saved into the file; reopened from it; the older shared state file offers the link; DOM click | [SHARED,0,true,null,true] | [SHARED,true,BRAD-2] **falsely clean** | [0,SHARED,BRAD-2,SHARED,saved-file,true,true] | BRAD-2 reachable: **false** (earlier file version only). V4 [null,none,SHARED,BRAD-2,nothing kept,null,SHARED,SHARED,saved-file,0] |
| XFSHdL | file mode, order control: the save landed first; `adoptShared()` directly | [SHARED,0,true,null,true] | **falsely clean** | as XFSHn | as XFSHn |

**The in-run healthy control.** Before each load, the record was consistent: XSHn and XFSHn reopen fixtures `[BRAD-2, true, BRAD-2]`, and the "landed" fixtures were clean against BRAD-2. So the false state begins at the load. The builder's dirty-start controls, SHdC and FSHdC (re-run in A), stay unclean.

## Runs, PIDs, locks

- **Every node and python run** went through `q.sh`: the lock was checked first, then `setsid -w timeout -k 10 600 …`, and the PIDs of `timeout` and its child were written to `pids.txt` with the command. Chunk wrappers (`bash mm.sh …`, `bash xmm.sh …`) ran through it as well.
- **Counts** (`logs/runs.txt`, 212 run lines and 1 resume note):
  - ids 1;
  - the builder's matrix re-run, `r-*`: 160;
  - chunk wrappers: 12;
  - xbuild: 2;
  - my trials `xt-*`: 5;
  - my final `x-*`: 26;
  - mkP3: 2;
  - cmp: 2;
  - xagg 1 and expsame 1.
- **Exit codes:** all exited 0, except `cmp1`, which exited 1. That was a bug in my read-only tool, which was fixed and re-run as `cmp2`. Nothing timed out.
- **The cut run:** `r-c137-V1sameperm-save`, started 11:57:57 ET, has no exit line. It was superseded by `chunk-M137rest`, which re-ran it at 15:08:16 ET.
- **Wall times:** the longest run was `r-b63-V2live-putback`, 24.5 s; the longest chunk was `chunk-K137`, 204.7 s.
- **PIDs:** `pids.txt` has 428 lines. At 15:19:29 ET none of the recorded PIDs was alive (checked with `ps -p` by PID). Nothing was killed, by PID or otherwise.
- **Lock:** `AUDIT_IMPORT_RUNNING` was checked before every run and was never present (0 lock waits in `runs.txt`).
- **Run in parallel:** up to four probe runs at once, in separate jsdom processes, each with its own `out/` and `logs/` files.

## What was NOT done

- **Nothing was fixed or applied.** The builder's P1 and my P3 were not applied to anything that runs, and neither was booted or run. `rec/L4/base` was only copied; it still hashes to `98eed7e8`.
- **Not run:**
  - `mutate.mjs` was not imported, executed or run;
  - the full audit-import and audit-board were not run;
  - neither Chromium nor playwright was used, and there was no `playwright install`.
- **Nothing in `/home/user/orbit-board` or `/home/user/orbit-ui` was edited, staged, committed or pushed**, and the ledger was not edited.
  - Only `git rev-parse`, `git hash-object` and `git archive` (into my directory) were used there.
  - No `git status` was run.
- **Read-only inspections and edits of my own files ran directly**, not through `q.sh`:
  - inspections: `cat`, `grep`, `sed -n`, `diff`, `cmp`, `git hash-object`, `ps -p`;
  - edits: the Edit tool on `src/x-body.mjs`, heredoc writes of scripts, `sed -i` on `cmp.mjs` and `prop/mkP3.py`, and `chmod`.
- **Not tested:**
  - P1's or P3's behaviour (by code only);
  - Live autosave after a load;
  - the sidecar's real fetch or XHR;
  - two real browser tabs;
  - how likely any route is.
- My XFSHn and XFSHdL literals were written after I had seen XSHn and XSHdL (folder mode) on 63bd8b0.

## Run list (`logs/runs.txt`)

```
ids start=2026-10-12T11:48:50EDT exit=0 wall_s=0.5 
r-b63-S1harness-save start=2026-10-12T11:52:44EDT exit=0 wall_s=5.9 
r-b63-S1harness-putback start=2026-10-12T11:52:50EDT exit=0 wall_s=6.3 
r-b63-S1tick-save start=2026-10-12T11:52:56EDT exit=0 wall_s=6.2 
r-b63-S1tick-putback start=2026-10-12T11:53:02EDT exit=0 wall_s=5.7 
r-b63-S1perm-save start=2026-10-12T11:53:08EDT exit=0 wall_s=5.8 
r-b63-S1perm-putback start=2026-10-12T11:53:14EDT exit=0 wall_s=4.9 
r-b63-S1open-save start=2026-10-12T11:53:19EDT exit=0 wall_s=4.8 
r-b63-S1open-putback start=2026-10-12T11:53:23EDT exit=0 wall_s=4.6 
r-b63-S1pen-save start=2026-10-12T11:53:28EDT exit=0 wall_s=5.1 
r-b63-S1pen-putback start=2026-10-12T11:53:33EDT exit=0 wall_s=5.3 
r-b63-V1same-save start=2026-10-12T11:53:39EDT exit=0 wall_s=5.8 
r-b63-V1same-putback start=2026-10-12T11:53:44EDT exit=0 wall_s=6.5 
r-b63-V1sameperm-save start=2026-10-12T11:53:51EDT exit=0 wall_s=5.7 
r-b63-V1sameperm-putback start=2026-10-12T11:53:57EDT exit=0 wall_s=4.9 
r-b63-V2live-save start=2026-10-12T11:54:01EDT exit=0 wall_s=21.7 
r-b63-V2live-putback start=2026-10-12T11:54:23EDT exit=0 wall_s=24.5 
r-b63-W2pull-save start=2026-10-12T11:54:48EDT exit=0 wall_s=9.2 
r-b63-W2pull-putback start=2026-10-12T11:54:57EDT exit=0 wall_s=7.3 
r-b63-W2tick-save start=2026-10-12T11:55:04EDT exit=0 wall_s=5.6 
r-b63-W2tick-putback start=2026-10-12T11:55:10EDT exit=0 wall_s=5.4 
chunk-M63 start=2026-10-12T11:52:44EDT exit=0 wall_s=151.6 
r-c137-S1harness-save start=2026-10-12T11:56:40EDT exit=0 wall_s=7.1 
xbuild1 start=2026-10-12T11:56:53EDT exit=0 wall_s=0.1 
r-c137-S1harness-putback start=2026-10-12T11:56:47EDT exit=0 wall_s=7.2 
r-c137-S1tick-save start=2026-10-12T11:56:55EDT exit=0 wall_s=7.2 
xt-b63-XSHd-save start=2026-10-12T11:56:59EDT exit=0 wall_s=8.2 
r-c137-S1tick-putback start=2026-10-12T11:57:02EDT exit=0 wall_s=8.9 
xt-b63-XSHe-save start=2026-10-12T11:57:12EDT exit=0 wall_s=6.9 
r-c137-S1perm-save start=2026-10-12T11:57:11EDT exit=0 wall_s=8.7 
xt-b63-XSHdL-save start=2026-10-12T11:57:19EDT exit=0 wall_s=6.9 
r-c137-S1perm-putback start=2026-10-12T11:57:19EDT exit=0 wall_s=7.8 
xt-b63-XSHn-save start=2026-10-12T11:57:26EDT exit=0 wall_s=6.6 
r-c137-S1open-save start=2026-10-12T11:57:27EDT exit=0 wall_s=6.6 
r-c137-S1open-putback start=2026-10-12T11:57:34EDT exit=0 wall_s=5.3 
r-c137-S1pen-save start=2026-10-12T11:57:39EDT exit=0 wall_s=5.1 
r-c137-S1pen-putback start=2026-10-12T11:57:44EDT exit=0 wall_s=4.5 
r-c137-V1same-save start=2026-10-12T11:57:49EDT exit=0 wall_s=4.0 
xt-b63-XFBT-save start=2026-10-12T11:57:52EDT exit=0 wall_s=5.0 
r-c137-V1same-putback start=2026-10-12T11:57:53EDT exit=0 wall_s=4.5 
RESUMED 2026-10-12T15:08:10EDT after the usage limit: r-c137-V1sameperm-save (started 2026-10-12T11:57:57EDT) was cut with no exit recorded and an empty log; chunk-M137 has no exit line. Both are superseded: the rest of M137 is re-run by mm2.sh (chunk-M137rest). None of the cut run's PIDs (13672, 13677) was alive at 2026-10-12T15:08:10EDT.
r-c137-V1sameperm-save start=2026-10-12T15:08:16EDT exit=0 wall_s=6.0 
r-b63-Ca-save start=2026-10-12T15:08:17EDT exit=0 wall_s=6.1 
r-b63-Ca-putback start=2026-10-12T15:08:23EDT exit=0 wall_s=4.4 
r-c137-V1sameperm-putback start=2026-10-12T15:08:23EDT exit=0 wall_s=4.6 
r-b63-Cb-save start=2026-10-12T15:08:27EDT exit=0 wall_s=4.2 
r-b63-Cb-putback start=2026-10-12T15:08:31EDT exit=0 wall_s=3.9 
r-b63-Cc-save start=2026-10-12T15:08:35EDT exit=0 wall_s=4.4 
r-c137-V2live-save start=2026-10-12T15:08:27EDT exit=0 wall_s=15.1 
r-b63-Cc-putback start=2026-10-12T15:08:40EDT exit=0 wall_s=5.6 
r-b63-C1-save start=2026-10-12T15:08:45EDT exit=0 wall_s=4.7 
r-b63-C1-putback start=2026-10-12T15:08:50EDT exit=0 wall_s=5.4 
r-c137-V2live-putback start=2026-10-12T15:08:42EDT exit=0 wall_s=16.1 
r-b63-C3-save start=2026-10-12T15:08:55EDT exit=0 wall_s=5.0 
r-c137-W2pull-save start=2026-10-12T15:08:58EDT exit=0 wall_s=6.5 
r-b63-C3-putback start=2026-10-12T15:09:00EDT exit=0 wall_s=6.5 
r-c137-W2pull-putback start=2026-10-12T15:09:05EDT exit=0 wall_s=7.2 
r-b63-U25ws-save start=2026-10-12T15:09:07EDT exit=0 wall_s=8.4 
r-c137-W2tick-save start=2026-10-12T15:09:12EDT exit=0 wall_s=7.0 
xbuild2 start=2026-10-12T15:09:20EDT exit=0 wall_s=0.1 
r-b63-U25ws-putback start=2026-10-12T15:09:15EDT exit=0 wall_s=7.6 
r-c137-W2tick-putback start=2026-10-12T15:09:19EDT exit=0 wall_s=6.2 
chunk-M137rest start=2026-10-12T15:08:16EDT exit=0 wall_s=68.9 
r-b63-U25wf-save start=2026-10-12T15:09:23EDT exit=0 wall_s=5.2 
r-b63-U25wf-putback start=2026-10-12T15:09:28EDT exit=0 wall_s=5.2 
r-b63-U25mid-save start=2026-10-12T15:09:33EDT exit=0 wall_s=5.1 
x-b63-XSHd-save start=2026-10-12T15:09:39EDT exit=0 wall_s=6.9 
r-b63-U25mid-putback start=2026-10-12T15:09:39EDT exit=0 wall_s=8.0 
r-c137-Ca-save start=2026-10-12T15:09:39EDT exit=0 wall_s=8.2 
x-b63-XSHe-save start=2026-10-12T15:09:46EDT exit=0 wall_s=8.4 
r-b63-L20-save start=2026-10-12T15:09:47EDT exit=0 wall_s=8.3 
r-c137-Ca-putback start=2026-10-12T15:09:47EDT exit=0 wall_s=7.6 
x-b63-XSHdL-save start=2026-10-12T15:09:55EDT exit=0 wall_s=6.3 
r-c137-Cb-save start=2026-10-12T15:09:55EDT exit=0 wall_s=7.4 
r-b63-L20-putback start=2026-10-12T15:09:55EDT exit=0 wall_s=8.4 
chunk-K63 start=2026-10-12T15:08:17EDT exit=0 wall_s=106.8 
x-b63-XSHn-save start=2026-10-12T15:10:01EDT exit=0 wall_s=6.5 
r-c137-Cb-putback start=2026-10-12T15:10:03EDT exit=0 wall_s=6.6 
x-b63-XFBT-save start=2026-10-12T15:10:07EDT exit=0 wall_s=9.6 
r-c137-Cc-save start=2026-10-12T15:10:09EDT exit=0 wall_s=8.6 
r-b63-SHd-none start=2026-10-12T15:10:13EDT exit=0 wall_s=9.4 
r-c137-Cc-putback start=2026-10-12T15:10:18EDT exit=0 wall_s=12.9 
x-b63-XFBTC-save start=2026-10-12T15:10:17EDT exit=0 wall_s=13.9 
r-b63-SHd-save start=2026-10-12T15:10:22EDT exit=0 wall_s=11.9 
r-c137-C1-save start=2026-10-12T15:10:31EDT exit=0 wall_s=10.8 
r-b63-SHd-putback start=2026-10-12T15:10:34EDT exit=0 wall_s=10.8 
x-b63-XFBTL-save start=2026-10-12T15:10:31EDT exit=0 wall_s=14.6 
r-c137-C1-putback start=2026-10-12T15:10:42EDT exit=0 wall_s=10.5 
r-b63-SHdC-none start=2026-10-12T15:10:45EDT exit=0 wall_s=9.0 
x-b63-XFSHd-save start=2026-10-12T15:10:46EDT exit=0 wall_s=8.9 
r-c137-C3-save start=2026-10-12T15:10:52EDT exit=0 wall_s=11.1 
r-b63-SHdC-save start=2026-10-12T15:10:54EDT exit=0 wall_s=11.1 
x-b63-XFSHd-putback start=2026-10-12T15:10:55EDT exit=0 wall_s=10.8 
r-c137-C3-putback start=2026-10-12T15:11:03EDT exit=0 wall_s=12.4 
x-b63-XFSHn-save start=2026-10-12T15:11:06EDT exit=0 wall_s=11.4 
r-b63-SHdC-putback start=2026-10-12T15:11:05EDT exit=0 wall_s=11.7 
r-c137-U25ws-save start=2026-10-12T15:11:16EDT exit=0 wall_s=12.6 
r-b63-SHdk-none start=2026-10-12T15:11:17EDT exit=0 wall_s=11.3 
x-b63-XFSHn-putback start=2026-10-12T15:11:17EDT exit=0 wall_s=11.4 
x-b63-XFSHdL-save start=2026-10-12T15:11:29EDT exit=0 wall_s=9.7 
r-b63-SHdk-save start=2026-10-12T15:11:29EDT exit=0 wall_s=10.6 
r-c137-U25ws-putback start=2026-10-12T15:11:28EDT exit=0 wall_s=12.0 
r-b63-SHdk-putback start=2026-10-12T15:11:39EDT exit=0 wall_s=10.5 
x-b63-XFSHdL-putback start=2026-10-12T15:11:38EDT exit=0 wall_s=11.8 
chunk-X63 start=2026-10-12T15:09:39EDT exit=0 wall_s=131.0 
r-c137-U25wf-save start=2026-10-12T15:11:40EDT exit=0 wall_s=12.5 
r-b63-SHdkC-none start=2026-10-12T15:11:50EDT exit=0 wall_s=12.2 
r-c137-U25wf-putback start=2026-10-12T15:11:53EDT exit=0 wall_s=11.5 
r-b63-SHdkC-save start=2026-10-12T15:12:02EDT exit=0 wall_s=10.5 
r-c137-U25mid-save start=2026-10-12T15:12:05EDT exit=0 wall_s=13.5 
x-c137-XSHd-save start=2026-10-12T15:12:07EDT exit=0 wall_s=11.8 
r-b63-SHdkC-putback start=2026-10-12T15:12:12EDT exit=0 wall_s=10.2 
x-c137-XSHe-save start=2026-10-12T15:12:19EDT exit=0 wall_s=11.5 
r-c137-U25mid-putback start=2026-10-12T15:12:18EDT exit=0 wall_s=12.9 
r-b63-SHa-none start=2026-10-12T15:12:23EDT exit=0 wall_s=11.5 
r-b63-SHaC-none start=2026-10-12T15:12:24EDT exit=0 wall_s=11.0 
x-c137-XSHdL-save start=2026-10-12T15:12:30EDT exit=0 wall_s=12.5 
r-b63-SHa-save start=2026-10-12T15:12:34EDT exit=0 wall_s=10.7 
r-b63-SHaC-save start=2026-10-12T15:12:35EDT exit=0 wall_s=10.8 
r-c137-L20-save start=2026-10-12T15:12:31EDT exit=0 wall_s=16.5 
r-b63-SHa-putback start=2026-10-12T15:12:45EDT exit=0 wall_s=12.7 
chunk-A63a start=2026-10-12T15:10:13EDT exit=0 wall_s=164.7 
r-b63-SHaC-putback start=2026-10-12T15:12:46EDT exit=0 wall_s=11.9 
x-c137-XSHn-save start=2026-10-12T15:12:43EDT exit=0 wall_s=15.1 
mkP3 start=2026-10-12T15:13:03EDT exit=0 wall_s=0.4 
r-c137-L20-putback start=2026-10-12T15:12:48EDT exit=0 wall_s=16.1 
chunk-K137 start=2026-10-12T15:09:39EDT exit=0 wall_s=204.7 
r-b63-BT-none start=2026-10-12T15:12:58EDT exit=0 wall_s=11.2 
mkP3b start=2026-10-12T15:13:11EDT exit=0 wall_s=0.2 
x-c137-XFBT-save start=2026-10-12T15:12:58EDT exit=0 wall_s=14.2 
r-b63-BT-save start=2026-10-12T15:13:09EDT exit=0 wall_s=6.9 
r-b63-BT-putback start=2026-10-12T15:13:16EDT exit=0 wall_s=9.4 
x-c137-XFBTC-save start=2026-10-12T15:13:12EDT exit=0 wall_s=14.7 
r-c137-SHaC-none start=2026-10-12T15:13:18EDT exit=0 wall_s=12.9 
r-c137-SHd-none start=2026-10-12T15:13:18EDT exit=0 wall_s=13.5 
r-b63-BTC-none start=2026-10-12T15:13:26EDT exit=0 wall_s=11.9 
r-c137-SHaC-save start=2026-10-12T15:13:31EDT exit=0 wall_s=12.7 
x-c137-XFBTL-save start=2026-10-12T15:13:27EDT exit=0 wall_s=17.6 
r-c137-SHd-save start=2026-10-12T15:13:31EDT exit=0 wall_s=13.6 
r-b63-BTC-save start=2026-10-12T15:13:37EDT exit=0 wall_s=10.9 
x-c137-XFSHd-save start=2026-10-12T15:13:45EDT exit=0 wall_s=10.7 
r-c137-SHaC-putback start=2026-10-12T15:13:44EDT exit=0 wall_s=13.3 
r-b63-BTC-putback start=2026-10-12T15:13:48EDT exit=0 wall_s=11.0 
r-c137-SHd-putback start=2026-10-12T15:13:45EDT exit=0 wall_s=14.9 
x-c137-XFSHd-putback start=2026-10-12T15:13:55EDT exit=0 wall_s=13.6 
r-c137-BT-none start=2026-10-12T15:13:57EDT exit=0 wall_s=12.9 
r-c137-SHdC-none start=2026-10-12T15:14:00EDT exit=0 wall_s=14.1 
r-b63-IB-none start=2026-10-12T15:14:00EDT exit=0 wall_s=15.3 
r-c137-BT-save start=2026-10-12T15:14:10EDT exit=0 wall_s=10.8 
x-c137-XFSHn-save start=2026-10-12T15:14:09EDT exit=0 wall_s=15.1 
r-c137-SHdC-save start=2026-10-12T15:14:14EDT exit=0 wall_s=12.9 
r-b63-IB-save start=2026-10-12T15:14:15EDT exit=0 wall_s=14.5 
r-c137-BT-putback start=2026-10-12T15:14:21EDT exit=0 wall_s=10.7 
x-c137-XFSHn-putback start=2026-10-12T15:14:24EDT exit=0 wall_s=13.3 
r-c137-SHdC-putback start=2026-10-12T15:14:27EDT exit=0 wall_s=12.5 
r-b63-IB-putback start=2026-10-12T15:14:29EDT exit=0 wall_s=11.9 
r-c137-BTC-none start=2026-10-12T15:14:31EDT exit=0 wall_s=10.1 
x-c137-XFSHdL-save start=2026-10-12T15:14:38EDT exit=0 wall_s=12.1 
r-c137-BTC-save start=2026-10-12T15:14:42EDT exit=0 wall_s=9.7 
r-c137-SHdk-none start=2026-10-12T15:14:39EDT exit=0 wall_s=15.8 
r-b63-IBC-none start=2026-10-12T15:14:41EDT exit=0 wall_s=13.8 
r-c137-BTC-putback start=2026-10-12T15:14:51EDT exit=0 wall_s=10.9 
x-c137-XFSHdL-putback start=2026-10-12T15:14:50EDT exit=0 wall_s=14.4 
chunk-X137 start=2026-10-12T15:12:07EDT exit=0 wall_s=177.3 
r-c137-SHdk-save start=2026-10-12T15:14:55EDT exit=0 wall_s=12.9 
r-b63-IBC-save start=2026-10-12T15:14:55EDT exit=0 wall_s=14.6 
r-c137-IB-none start=2026-10-12T15:15:02EDT exit=0 wall_s=13.0 
r-b63-IBC-putback start=2026-10-12T15:15:10EDT exit=0 wall_s=10.2 
chunk-A63b start=2026-10-12T15:12:24EDT exit=0 wall_s=176.0 
r-c137-SHdk-putback start=2026-10-12T15:15:08EDT exit=0 wall_s=12.8 
r-c137-IB-save start=2026-10-12T15:15:15EDT exit=0 wall_s=8.8 
r-c137-SHdkC-none start=2026-10-12T15:15:21EDT exit=0 wall_s=7.5 
r-c137-IB-putback start=2026-10-12T15:15:24EDT exit=0 wall_s=8.8 
r-b63-FBT-none start=2026-10-12T15:15:29EDT exit=0 wall_s=9.5 
r-c137-SHdkC-save start=2026-10-12T15:15:28EDT exit=0 wall_s=10.3 
r-c137-FBT-none start=2026-10-12T15:15:29EDT exit=0 wall_s=9.5 
r-c137-IBC-none start=2026-10-12T15:15:33EDT exit=0 wall_s=10.4 
r-b63-FBT-save start=2026-10-12T15:15:39EDT exit=0 wall_s=8.7 
r-c137-FBT-save start=2026-10-12T15:15:39EDT exit=0 wall_s=9.0 
r-c137-SHdkC-putback start=2026-10-12T15:15:39EDT exit=0 wall_s=12.3 
r-c137-IBC-save start=2026-10-12T15:15:43EDT exit=0 wall_s=12.1 
r-c137-FBT-putback start=2026-10-12T15:15:48EDT exit=0 wall_s=8.8 
r-b63-FBT-putback start=2026-10-12T15:15:47EDT exit=0 wall_s=9.9 
r-c137-SHa-none start=2026-10-12T15:15:51EDT exit=0 wall_s=11.2 
r-b63-FBTC-none start=2026-10-12T15:15:57EDT exit=0 wall_s=10.2 
r-c137-FBTC-none start=2026-10-12T15:15:57EDT exit=0 wall_s=12.4 
r-c137-IBC-putback start=2026-10-12T15:15:56EDT exit=0 wall_s=13.9 
chunk-A137b start=2026-10-12T15:13:18EDT exit=0 wall_s=171.8 
r-c137-SHa-save start=2026-10-12T15:16:02EDT exit=0 wall_s=12.9 
r-b63-FBTC-save start=2026-10-12T15:16:08EDT exit=0 wall_s=9.6 
r-c137-FBTC-save start=2026-10-12T15:16:09EDT exit=0 wall_s=9.0 
r-c137-SHa-putback start=2026-10-12T15:16:15EDT exit=0 wall_s=10.3 
chunk-A137a start=2026-10-12T15:13:18EDT exit=0 wall_s=188.2 
r-c137-FBTC-putback start=2026-10-12T15:16:18EDT exit=0 wall_s=8.1 
r-b63-FBTC-putback start=2026-10-12T15:16:17EDT exit=0 wall_s=9.3 
r-c137-FSHd-none start=2026-10-12T15:16:26EDT exit=0 wall_s=8.6 
r-b63-FSHd-none start=2026-10-12T15:16:27EDT exit=0 wall_s=10.0 
r-c137-FSHd-save start=2026-10-12T15:16:35EDT exit=0 wall_s=7.0 
r-b63-FSHd-save start=2026-10-12T15:16:37EDT exit=0 wall_s=9.5 
r-c137-FSHd-putback start=2026-10-12T15:16:42EDT exit=0 wall_s=8.9 
r-b63-FSHd-putback start=2026-10-12T15:16:46EDT exit=0 wall_s=8.4 
r-c137-FSHdC-none start=2026-10-12T15:16:51EDT exit=0 wall_s=8.7 
r-b63-FSHdC-none start=2026-10-12T15:16:54EDT exit=0 wall_s=9.6 
r-c137-FSHdC-save start=2026-10-12T15:17:00EDT exit=0 wall_s=7.8 
r-b63-FSHdC-save start=2026-10-12T15:17:04EDT exit=0 wall_s=9.2 
r-c137-FSHdC-putback start=2026-10-12T15:17:08EDT exit=0 wall_s=9.6 
chunk-F137 start=2026-10-12T15:15:29EDT exit=0 wall_s=108.0 
r-b63-FSHdC-putback start=2026-10-12T15:17:13EDT exit=0 wall_s=8.9 
chunk-F63 start=2026-10-12T15:15:29EDT exit=0 wall_s=113.2 
cmp1 start=2026-10-12T15:17:27EDT exit=1 wall_s=0.2 
cmp2 start=2026-10-12T15:17:41EDT exit=0 wall_s=0.3 
xagg1 start=2026-10-12T15:17:47EDT exit=0 wall_s=0.3 
expsame start=2026-10-12T15:18:44EDT exit=0 wall_s=0.2 
```
