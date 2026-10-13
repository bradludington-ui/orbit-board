> **Fix round (13 Oct):** the record of the fix-round check is in `r2/README.md`, and its verdict in `r2/VERDICT.md`. This file is the first round's record (12 Oct, 19:39 ET), kept as written.

# ORBIT v2.00 UI chunk 3, part 2 (S1–S5): verifier's record

Written 12 Oct 2026, 19:39 ET, by the adversarial verifier. The verdict is in `VERDICT.md`. All times are Eastern (EDT), taken from `TZ=America/New_York date`.

## What was verified

- **Branch and commit.** `claude/v200-ui` in `/home/user/orbit-ui`, HEAD `7a712455885c87c40db8b225e26f22208057198b`. It is local only: no `origin/claude/v200-ui` exists. The working tree status shows only `?? node_modules`.
- **Base of part 2.** `670c467` (M1), board `2d1d855edda98f9179d7254ef0d4c5ff7f46b26f`.
- **Final board.** `5e9e5a5e383e0553342f822050b36da7d23e9eab`, from `8325909` to `7a71245`. It is checked with `git rev-parse <c>:prioritization-board-grid.html` for each commit, and `git hash-object` gives the same on every extracted copy.
- **Board blob after each commit.** These match the builder's table:

  | Commit | Board blob |
  |---|---|
  | `2916f0a` | `80457192…` |
  | `088acf8` | `832e8384…` |
  | `cb86178` | `e0a90736…` |
  | `8f331a8` | `773c5af3…` |
  | `8325909` | `5e9e5a5e…` |

  `0af09b6`, `df05821`, `2ce11b6`, `83c589f` and `7a71245` leave the board unchanged.
- **Other file blobs** at `670c467` → `7a71245` are exactly as the builder's README lists them: `audit-ui.mjs` `ff485279…`, `mutate.mjs` `a28f6578…`, and the seven tools, `sweep3.mjs`, the shoot script and `CHUNK3.md`. `package.json` is unchanged (`6255966f…`).
- **Commit messages.** Every one of the ten ends with the two required lines. The author is `Claude <noreply@anthropic.com>`.
- **Brad's instruction.** The 6:11 AM ET text quoted in CHUNK3.md part 2 is identical to the one in the builder's instructions (`rec/L3/wf/ui.js`, `SX`), together with the 6:00 AM sentence on docking. I checked each scope sentence literally; see `VERDICT.md`.

## Scratch copies (nothing run in `/home/user/orbit-ui` or `/home/user/orbit-board`)

- **The four copies.** `copies/7a71245`, `copies/670c467`, `copies/f95fee2` and `copies/4a6f7c7` are `git archive` copies. Each has `node_modules` linked to `/home/user/orbit-ui/node_modules`, which is itself a link to orbit-board's.
- **Boards.** The extracted boards are in `boards/`:

  | File | Blob |
  |---|---|
  | `final-5e9e5a5e.html` | `5e9e5a5e` |
  | `m1-670c467.html` | `2d1d855e` |
  | `c2-f95fee2.html` | `9f61d32b` |
  | `base-4a6f7c7.html` | `4d273c06` |
  | `p2-2916f0a.html` | `80457192` |
  | `p2-088acf8.html` | `832e8384` |
  | `p2-cb86178.html` | `e0a90736` |
  | `p2-8f331a8.html` | `773c5af3` |

- **Variants I added to the scratch copies.** They are not in the repo:

  | File | Blob | What it is |
  |---|---|---|
  | `copies/7a71245/tools/export-audit/audit-ui-vcount.mjs` | `f7f1a3bd` | `audit-ui.mjs` with a check counter and a per-scenario count; nothing else changed (diff in the log of its first run) |
  | `copies/7a71245/tools/layout-fits-docked.mjs` | `eba2a9b3` | `layout-fits.mjs` with `prio27uiDock='1'` set in both page-opening helpers, and C printing where the panel is |
  | `copies/7a71245/tools/dropdowns-visible-docked.mjs` | `d15f8eef` | `dropdowns-visible.mjs` with `prio27uiDock='1'` |
  | `copies/4a6f7c7/tools/layout-fits-where.mjs` | `48faf4b0` | base's `layout-fits.mjs`, with C printing where the RECORD panel is |
  | `copies/4a6f7c7/tools/toolbar-fits-new.mjs` and `copies/670c467/tools/toolbar-fits-new.mjs` | — | the final `toolbar-fits.mjs`, run against the older boards |

- **Mutant copies.** `copies/mut-<id>/` each hold a copy of the final `tools/`, `package.json`, the `node_modules` link, and the mutant board as `prioritization-board-grid.html`.

## My scripts (blobs, `git hash-object`)

| File | Blob | What it does |
|---|---|---|
| `bin/run.sh` | `e099912a` | lock wait (poll every 20 s, up to 30 min), `setsid -w timeout -k 10 <cap>`, PIDs into `pids.txt`, start/end ET, exit and wall time into the log and `runs.txt` |
| `bin/grid.sh` | `2e1835da` | each verify:grid tool on its own, the npm chain first |
| `bin/suites.sh` | `83e5e07f` | jsdom suites at the final commit |
| `bin/mutlane.sh` | `3eadccce` | the counted audit-ui on each mutant board |
| `bin/probesA.sh` | `9cfcad72` | Chromium probes and mutants |
| `bin/probesB.sh` | `d8a695b7` | Chromium probes and mutants |
| `bin/mymut.py` | `fccb00e5` | my own mutants, each find matching exactly once (text only) |
| `probes/impfocus.mjs` | `55c1b03a` | where the keyboard lands when the Import box closes (5 widths × 2 openers × key / click / focus-less click × Esc / ✕ / outside), and whether that control is in the window and on top |
| `probes/topctl.mjs` | `51ac31c5` | the top controls toolbar-fits counts, per width and mode |
| `probes/hdrpos.mjs` | `55c230ca` | where the context bar's first controls sit against the sidebar |
| `probes/pixdiff.mjs` | `00bc352d` | the chunk 2 reviewer's pixel comparison |
| `probes/rv-smoke-final.mjs` | `40bd3cf4` | the chunk 1 and chunk 2 reviewers' preservation probe, with only the board path (my final board copy) and `boot.mjs` (my copy) changed |
| `probes/rv2-probe-final.mjs` | `f9b6e6f7` | as above |
| `probes/rv2-probe-2916f0a.mjs` | `df58db2c` | as above |
| `probes/rv2-m1-final.mjs` | `165daca3` | as above |
| `probes/openwrites-final.mjs` | `73570aef` | as above |

The mutant boards and their blobs are listed in `mutant-blobs.txt`:

- `mut/` holds my 21 mutants.
- `mut35/` holds the 35 `v200-ui3-*` entries, built as text with `rec/bin/mkmut.py`. Each is byte-identical to the builder's `p2/mut-2ce11b6/<id>.html`.

## Text-only work (not node, not Chromium)

- **mcount.py** (`rec/L2/u2impl/mcount.py`, `python3 -I`, each under `setsid -w timeout -k 10 120`, 18:43:54–18:44:00 ET) on the final `mutate.mjs`. Logs are in `logs/mcount-*.json`:

  | Board | Entries | Matching once | Missing |
  |---|---|---|---|
  | Final | 1,340 | 1,340 | 0 |
  | `670c467` | 1,340 | 1,335 | 5, the `lastedit` entries |
  | `f95fee2` | 1,340 | 1,309 | 31 |
  | Base | 1,340 | 1,305 | 35 |

  None matches twice and none is unparsed.
- **mkmut.py** for the 35 mutants and **mymut.py** for mine: every find matched exactly once, and nothing in `mutate.mjs` was imported or run.
- **Function comparison** by text extraction: final against base and against `670c467`.

## Runs (`runs.txt`; every node and Chromium run went through `bin/run.sh`)

The AUDIT_IMPORT lock was checked before every run and was never present: `lockwaits.txt` was never written. Each run is bounded by `setsid -w timeout -k 10 <cap>`, where the cap is 600 s, or 300 or 120 s for small runs.

Runs went in parallel lanes, never more than three heavy at once. Lanes started at:

| Lane | Started (ET) |
|---|---|
| final grid | 18:41:19 |
| suites | 18:50:34 |
| base grid | 18:50:34 |
| own mutants | 18:51:41 |
| probesA | 18:57:27 |
| chunk 2 grid | 19:03:06 |
| 35 mutants | 19:03:53 |
| probesB | 19:12:18 |

These runs were started by hand, each still through `run.sh`: the four preservation probes at the final board, `rv2-probe@2916f0a`, `check@670c467`, `hdrpos` (×2), `toolbar-fits@mut-vTF-hdr-under-sidebar-120`, `pixdiff@shots` and `layout-fits-where-early@4a6f7c7`.

| Run | Start (ET) | Exit | Wall (s) | Log |
|---|---|---|---|---|
| `grid-chain@7a71245` | 18:41:19 | 1 | 3.9 | `logs/grid-chain@7a71245.log` |
| `grid-chrome@7a71245` | 18:41:23 | 0 | 0.4 | `logs/grid-chrome@7a71245.log` |
| `grid-row-controls@7a71245` | 18:41:23 | 1 | 3.3 | `logs/grid-row-controls@7a71245.log` |
| `grid-inspector-agrees@7a71245` | 18:41:27 | 0 | 8.4 | `logs/grid-inspector-agrees@7a71245.log` |
| `grid-toolbar-fits@7a71245` | 18:41:35 | 1 | 19.8 | `logs/grid-toolbar-fits@7a71245.log` |
| `grid-editors-reachable@7a71245` | 18:41:55 | 0 | 41.6 | `logs/grid-editors-reachable@7a71245.log` |
| `grid-colour-check@7a71245` | 18:42:36 | 0 | 7.8 | `logs/grid-colour-check@7a71245.log` |
| `grid-menu-paths@7a71245` | 18:42:44 | 0 | 4.1 | `logs/grid-menu-paths@7a71245.log` |
| `grid-panels-render@7a71245` | 18:42:48 | 0 | 7.8 | `logs/grid-panels-render@7a71245.log` |
| `grid-fydp-frames@7a71245` | 18:42:56 | 0 | 4.7 | `logs/grid-fydp-frames@7a71245.log` |
| `grid-hostile-render@7a71245` | 18:43:01 | 0 | 25.1 | `logs/grid-hostile-render@7a71245.log` |
| `grid-layout-fits@7a71245` | 18:43:26 | 1 | 153.7 | `logs/grid-layout-fits@7a71245.log` |
| `grid-keyboard-reach@7a71245` | 18:46:00 | 0 | 41.3 | `logs/grid-keyboard-reach@7a71245.log` |
| `grid-dropdowns-visible@7a71245` | 18:46:41 | 0 | 107.6 | `logs/grid-dropdowns-visible@7a71245.log` |
| `grid-dialogs-keyboard@7a71245` | 18:48:29 | 0 | 79.4 | `logs/grid-dialogs-keyboard@7a71245.log` |
| `audit-ui@7a71245` | 18:50:34 | 0 | 54.9 | `logs/audit-ui@7a71245.log` |
| `grid-chain@4a6f7c7` | 18:50:34 | 1 | 262.7 | `logs/grid-chain@4a6f7c7.log` |
| `audit-ui-count@7a71245` | 18:51:29 | 0 | 63.6 | `logs/audit-ui-count@7a71245.log` |
| `mut-vS2-empty-path-ignored` | 18:51:41 | 0 | 65.1 | `logs/mut-vS2-empty-path-ignored.log` |
| `audit-ui-count-on-670c467` | 18:52:32 | 1 | 62.2 | `logs/audit-ui-count-on-670c467.log` |
| `mut-vS2-load-not-wide` | 18:52:46 | 1 | 64.0 | `logs/mut-vS2-load-not-wide.log` |
| `audit-ui-count-on-f95fee2` | 18:53:35 | 1 | 62.1 | `logs/audit-ui-count-on-f95fee2.log` |
| `mut-vS2-more-not-wide` | 18:53:50 | 1 | 63.4 | `logs/mut-vS2-more-not-wide.log` |
| `audit-ui-count-on-2916f0a` | 18:54:37 | 1 | 60.4 | `logs/audit-ui-count-on-2916f0a.log` |
| `mut-vS2-removed-ignored` | 18:54:53 | 0 | 61.0 | `logs/mut-vS2-removed-ignored.log` |
| `grid-chrome@4a6f7c7` | 18:54:57 | 0 | 0.4 | `logs/grid-chrome@4a6f7c7.log` |
| `grid-row-controls@4a6f7c7` | 18:54:57 | 0 | 3.7 | `logs/grid-row-controls@4a6f7c7.log` |
| `grid-inspector-agrees@4a6f7c7` | 18:55:01 | 0 | 4.1 | `logs/grid-inspector-agrees@4a6f7c7.log` |
| `grid-toolbar-fits@4a6f7c7` | 18:55:05 | 0 | 20.4 | `logs/grid-toolbar-fits@4a6f7c7.log` |
| `grid-editors-reachable@4a6f7c7` | 18:55:25 | 0 | 23.6 | `logs/grid-editors-reachable@4a6f7c7.log` |
| `boot-same@7a71245` | 18:55:37 | 0 | 7.9 | `logs/boot-same@7a71245.log` |
| `audit-other@7a71245` | 18:55:45 | 0 | 26.4 | `logs/audit-other@7a71245.log` |
| `grid-colour-check@4a6f7c7` | 18:55:49 | 0 | 8.9 | `logs/grid-colour-check@4a6f7c7.log` |
| `mut-vS2-unrecorded-not-wide` | 18:55:54 | 1 | 64.9 | `logs/mut-vS2-unrecorded-not-wide.log` |
| `grid-menu-paths@4a6f7c7` | 18:55:58 | 0 | 4.8 | `logs/grid-menu-paths@4a6f7c7.log` |
| `grid-panels-render@4a6f7c7` | 18:56:03 | 0 | 9.2 | `logs/grid-panels-render@4a6f7c7.log` |
| `grid-fydp-frames@4a6f7c7` | 18:56:12 | 0 | 5.2 | `logs/grid-fydp-frames@4a6f7c7.log` |
| `audit@7a71245` | 18:56:12 | 0 | 6.6 | `logs/audit@7a71245.log` |
| `grid-hostile-render@4a6f7c7` | 18:56:17 | 0 | 28.5 | `logs/grid-hostile-render@4a6f7c7.log` |
| `audit-recon@7a71245` | 18:56:18 | 0 | 46.8 | `logs/audit-recon@7a71245.log` |
| `grid-layout-fits@4a6f7c7` | 18:56:46 | 1 | 153.3 | `logs/grid-layout-fits@4a6f7c7.log` |
| `mut-vS2-wide-other-years-only` | 18:56:59 | 1 | 59.5 | `logs/mut-vS2-wide-other-years-only.log` |
| `check@7a71245` | 18:57:05 | 1 | 2.7 | `logs/check@7a71245.log` |
| `layout-fits-docked@7a71245` | 18:57:27 | 1 | 160.0 | `logs/layout-fits-docked@7a71245.log` |
| `check@670c467` | 18:57:33 | 1 | 3.2 | `logs/check@670c467.log` |
| `rv-smoke@final` | 18:57:49 | 0 | 12.7 | `logs/rv-smoke@final.log` |
| `mut-vS3-dry-dest-ts` | 18:57:59 | 1 | 65.3 | `logs/mut-vS3-dry-dest-ts.log` |
| `rv2-probe@final` | 18:58:02 | 0 | 32.5 | `logs/rv2-probe@final.log` |
| `rv2-m1@final` | 18:58:35 | 0 | 3.1 | `logs/rv2-m1@final.log` |
| `openwrites@final` | 18:58:38 | 0 | 7.0 | `logs/openwrites@final.log` |
| `mut-vS3-dry-note-in-plan` | 18:59:04 | 1 | 64.0 | `logs/mut-vS3-dry-note-in-plan.log` |
| `rv2-probe@2916f0a` | 18:59:18 | 0 | 32.7 | `logs/rv2-probe@2916f0a.log` |
| `grid-keyboard-reach@4a6f7c7` | 18:59:19 | 0 | 37.9 | `logs/grid-keyboard-reach@4a6f7c7.log` |
| `grid-dropdowns-visible@4a6f7c7` | 18:59:57 | 0 | 110.4 | `logs/grid-dropdowns-visible@4a6f7c7.log` |
| `impfocus@final` | 19:00:07 | 0 | 144.1 | `logs/impfocus@final.log` |
| `mut-vS3-dry-removes-key` | 19:00:08 | 1 | 55.5 | `logs/mut-vS3-dry-removes-key.log` |
| `mut-vS3-dry-review-leaks` | 19:01:04 | 1 | 55.9 | `logs/mut-vS3-dry-review-leaks.log` |
| `grid-dialogs-keyboard@4a6f7c7` | 19:01:47 | 0 | 72.4 | `logs/grid-dialogs-keyboard@4a6f7c7.log` |
| `mut-vS3-dry-savegen` | 19:02:00 | 1 | 53.3 | `logs/mut-vS3-dry-savegen.log` |
| `impfocus@8f331a8` | 19:02:31 | 0 | 144.4 | `logs/impfocus@8f331a8.log` |
| `mut-vS3-dry-saves` | 19:02:53 | 1 | 52.8 | `logs/mut-vS3-dry-saves.log` |
| `grid-chain@f95fee2` | 19:03:06 | 1 | 4.1 | `logs/grid-chain@f95fee2.log` |
| `grid-chrome@f95fee2` | 19:03:10 | 0 | 0.4 | `logs/grid-chrome@f95fee2.log` |
| `grid-row-controls@f95fee2` | 19:03:11 | 1 | 3.7 | `logs/grid-row-controls@f95fee2.log` |
| `grid-inspector-agrees@f95fee2` | 19:03:15 | 1 | 32.8 | `logs/grid-inspector-agrees@f95fee2.log` |
| `grid-toolbar-fits@f95fee2` | 19:03:47 | 1 | 21.1 | `logs/grid-toolbar-fits@f95fee2.log` |
| `mut-v200-ui3-asks-loaded` | 19:03:53 | 1 | 57.6 | `logs/mut-v200-ui3-asks-loaded.log` |
| `grid-editors-reachable@f95fee2` | 19:04:09 | 1 | 23.5 | `logs/grid-editors-reachable@f95fee2.log` |
| `grid-colour-check@f95fee2` | 19:04:32 | 0 | 9.0 | `logs/grid-colour-check@f95fee2.log` |
| `grid-menu-paths@f95fee2` | 19:04:41 | 0 | 4.5 | `logs/grid-menu-paths@f95fee2.log` |
| `grid-panels-render@f95fee2` | 19:04:46 | 1 | 8.5 | `logs/grid-panels-render@f95fee2.log` |
| `mut-v200-ui3-check-added-dest-only` | 19:04:51 | 1 | 58.3 | `logs/mut-v200-ui3-check-added-dest-only.log` |
| `grid-fydp-frames@f95fee2` | 19:04:54 | 0 | 5.0 | `logs/grid-fydp-frames@f95fee2.log` |
| `topctl@final` | 19:04:55 | 0 | 6.3 | `logs/topctl@final.log` |
| `grid-hostile-render@f95fee2` | 19:04:59 | 0 | 27.3 | `logs/grid-hostile-render@f95fee2.log` |
| `topctl@base` | 19:05:01 | 0 | 6.2 | `logs/topctl@base.log` |
| `toolbar-fits-new-on-base` | 19:05:08 | 0 | 21.2 | `logs/toolbar-fits-new-on-base.log` |
| `grid-layout-fits@f95fee2` | 19:05:26 | 1 | 152.1 | `logs/grid-layout-fits@f95fee2.log` |
| `toolbar-fits-new-on-670c467` | 19:05:29 | 1 | 21.7 | `logs/toolbar-fits-new-on-670c467.log` |
| `mut-v200-ui3-check-blind-added-keys` | 19:05:50 | 1 | 55.1 | `logs/mut-v200-ui3-check-blind-added-keys.log` |
| `dialogs-keyboard-on-8f331a8` | 19:05:50 | 1 | 83.6 | `logs/dialogs-keyboard-on-8f331a8.log` |
| `mut-v200-ui3-check-blind-dest` | 19:06:45 | 1 | 53.5 | `logs/mut-v200-ui3-check-blind-dest.log` |
| `dialogs-keyboard@mut-vS4-no-opener-focus` | 19:07:14 | 1 | 82.9 | `logs/dialogs-keyboard@mut-vS4-no-opener-focus.log` |
| `mut-v200-ui3-check-blind-plan` | 19:07:38 | 1 | 53.2 | `logs/mut-v200-ui3-check-blind-plan.log` |
| `grid-keyboard-reach@f95fee2` | 19:07:59 | 1 | 64.3 | `logs/grid-keyboard-reach@f95fee2.log` |
| `mut-v200-ui3-check-blind-review` | 19:08:31 | 1 | 54.8 | `logs/mut-v200-ui3-check-blind-review.log` |
| `dialogs-keyboard@mut-vS4-sidebar-no-btn` | 19:08:37 | 1 | 83.5 | `logs/dialogs-keyboard@mut-vS4-sidebar-no-btn.log` |
| `grid-dropdowns-visible@f95fee2` | 19:09:03 | 1 | 111.8 | `logs/grid-dropdowns-visible@f95fee2.log` |
| `mut-v200-ui3-check-blind-save` | 19:09:26 | 1 | 54.3 | `logs/mut-v200-ui3-check-blind-save.log` |
| `dialogs-keyboard@mut-vS4-toolbar-no-this` | 19:10:00 | 1 | 83.4 | `logs/dialogs-keyboard@mut-vS4-toolbar-no-this.log` |
| `mut-v200-ui3-check-blind-storage` | 19:10:21 | 1 | 53.0 | `logs/mut-v200-ui3-check-blind-storage.log` |
| `grid-dialogs-keyboard@f95fee2` | 19:10:55 | 1 | 73.6 | `logs/grid-dialogs-keyboard@f95fee2.log` |
| `mut-v200-ui3-check-ls-dest-only` | 19:11:14 | 1 | 54.7 | `logs/mut-v200-ui3-check-ls-dest-only.log` |
| `toolbar-fits@mut-vTF-hdr-under-sidebar` | 19:11:24 | 1 | 21.6 | `logs/toolbar-fits@mut-vTF-hdr-under-sidebar.log` |
| `inspector-agrees@mut-vDock-ignored` | 19:11:46 | 1 | 37.7 | `logs/inspector-agrees@mut-vDock-ignored.log` |
| `mut-v200-ui3-claim-unchecked` | 19:12:08 | 1 | 58.4 | `logs/mut-v200-ui3-claim-unchecked.log` |
| `sweep3-posture@final` | 19:12:18 | 0 | 84.5 | `logs/sweep3-posture@final.log` |
| `editors-reachable@mut-vDock-ignored` | 19:12:23 | 1 | 47.2 | `logs/editors-reachable@mut-vDock-ignored.log` |
| `hdrpos@mut-vTF` | 19:12:52 | 0 | 3.4 | `logs/hdrpos@mut-vTF.log` |
| `hdrpos@final` | 19:12:56 | 0 | 3.6 | `logs/hdrpos@final.log` |
| `mut-v200-ui3-dry-asks-unheard` | 19:13:07 | 1 | 54.4 | `logs/mut-v200-ui3-dry-asks-unheard.log` |
| `keyboard-reach@mut-vDock-ignored` | 19:13:10 | 1 | 72.2 | `logs/keyboard-reach@mut-vDock-ignored.log` |
| `toolbar-fits@mut-vTF-hdr-under-sidebar-120` | 19:13:13 | 1 | 21.3 | `logs/toolbar-fits@mut-vTF-hdr-under-sidebar-120.log` |
| `sweep3-posture@mut-vS1-no-wrap` | 19:13:42 | 1 | 81.1 | `logs/sweep3-posture@mut-vS1-no-wrap.log` |
| `mut-v200-ui3-dry-folds-dest` | 19:14:01 | 1 | 51.5 | `logs/mut-v200-ui3-dry-folds-dest.log` |
| `mut-v200-ui3-dry-marks-unsaved` | 19:14:53 | 1 | 51.3 | `logs/mut-v200-ui3-dry-marks-unsaved.log` |
| `shoot@final` | 19:15:03 | 0 | 74.8 | `logs/shoot@final.log` |
| `mut-v200-ui3-dry-writes-journal` | 19:15:44 | 1 | 49.8 | `logs/mut-v200-ui3-dry-writes-journal.log` |
| `sweep3-reports@final` | 19:16:18 | 0 | 322.7 | `logs/sweep3-reports@final.log` |
| `mut-v200-ui3-dry-writes-storage` | 19:16:34 | 1 | 54.1 | `logs/mut-v200-ui3-dry-writes-storage.log` |
| `pixdiff@shots` | 19:16:39 | 0 | 3.4 | `logs/pixdiff@shots.log` |
| `layout-fits-where-early@4a6f7c7` | 19:17:06 | 1 | 170.0 | `logs/layout-fits-where-early@4a6f7c7.log` |
| `mut-v200-ui3-early-measured-before-reads` | 19:17:28 | 1 | 66.1 | `logs/mut-v200-ui3-early-measured-before-reads.log` |
| `mut-v200-ui3-lastedit-no-year-filter` | 19:18:34 | 1 | 80.2 | `logs/mut-v200-ui3-lastedit-no-year-filter.log` |
| `mut-v200-ui3-lastedit-removed-wide` | 19:19:54 | 1 | 70.6 | `logs/mut-v200-ui3-lastedit-removed-wide.log` |
| `mut-v200-ui3-lastedit-services-only` | 19:21:05 | 1 | 72.8 | `logs/mut-v200-ui3-lastedit-services-only.log` |
| `sweep3-reports@mut-vS5-short-of-edge` | 19:21:41 | 1 | 302.6 | `logs/sweep3-reports@mut-vS5-short-of-edge.log` |
| `mut-v200-ui3-lastedit-writer-wide` | 19:22:18 | 1 | 63.5 | `logs/mut-v200-ui3-lastedit-writer-wide.log` |
| `mut-v200-ui3-lastedit-year-first` | 19:23:21 | 1 | 59.9 | `logs/mut-v200-ui3-lastedit-year-first.log` |
| `mut-v200-ui3-no-putback` | 19:24:21 | 1 | 56.1 | `logs/mut-v200-ui3-no-putback.log` |
| `mut-v200-ui3-partway-before-run` | 19:25:17 | 1 | 55.2 | `logs/mut-v200-ui3-partway-before-run.log` |
| `mut-v200-ui3-pick-lost` | 19:26:12 | 1 | 52.7 | `logs/mut-v200-ui3-pick-lost.log` |
| `dropdowns-visible@mut-vS5-no-wrap` | 19:26:43 | 1 | 111.9 | `logs/dropdowns-visible@mut-vS5-no-wrap.log` |
| `mut-v200-ui3-putback-dest-copy` | 19:27:05 | 1 | 59.1 | `logs/mut-v200-ui3-putback-dest-copy.log` |
| `mut-v200-ui3-putback-dest-key-only` | 19:28:04 | 1 | 55.1 | `logs/mut-v200-ui3-putback-dest-key-only.log` |
| `dropdowns-visible@mut-vS5-short-of-edge` | 19:28:35 | 1 | 110.4 | `logs/dropdowns-visible@mut-vS5-short-of-edge.log` |
| `mut-v200-ui3-putback-no-dest` | 19:28:59 | 1 | 53.7 | `logs/mut-v200-ui3-putback-no-dest.log` |
| `mut-v200-ui3-putback-no-save-state` | 19:29:53 | 1 | 56.5 | `logs/mut-v200-ui3-putback-no-save-state.log` |
| `layout-fits-where@4a6f7c7` | 19:30:26 | 1 | 151.7 | `logs/layout-fits-where@4a6f7c7.log` |
| `mut-v200-ui3-putback-no-storage` | 19:30:50 | 1 | 58.1 | `logs/mut-v200-ui3-putback-no-storage.log` |
| `mut-v200-ui3-putback-shallow-dest` | 19:31:48 | 1 | 57.8 | `logs/mut-v200-ui3-putback-shallow-dest.log` |
| `mut-v200-ui3-putback-writes-all` | 19:32:46 | 1 | 57.0 | `logs/mut-v200-ui3-putback-writes-all.log` |
| `dropdowns-visible-docked@7a71245` | 19:32:57 | 0 | 114.4 | `logs/dropdowns-visible-docked@7a71245.log` |
| `mut-v200-ui3-reads-same-list` | 19:33:43 | 1 | 60.0 | `logs/mut-v200-ui3-reads-same-list.log` |
| `mut-v200-ui3-snapshot-before-reads` | 19:34:43 | 1 | 54.7 | `logs/mut-v200-ui3-snapshot-before-reads.log` |
| `mut-v200-ui3-snapshot-keeps-old-save` | 19:35:37 | 1 | 53.4 | `logs/mut-v200-ui3-snapshot-keeps-old-save.log` |
| `mut-v200-ui3-wrote-anyones` | 19:36:31 | 1 | 52.7 | `logs/mut-v200-ui3-wrote-anyones.log` |

137 runs


## PIDs (`pids.txt`)

- **Runs.** 137 run entries: each is the `timeout` PID with its command line, its label and start time, then every descendant with its command line.
  - Three entries (`grid-chrome@…`) have an empty command line. `chrome --selftest` finished within the 0.4 s before the wrapper read `/proc`; the command is in the run's log.
- **Lane scripts.** 8 `WRAPPER` lines, one per lane script (shell PIDs that ran only `run.sh` calls). Their start time is when I wrote the line, up to about 10 s after the lane began.
- **Nothing was killed.** No PID needed it, and nothing was killed by name or pattern.

## What I did not do, said plainly

- **Not run:**
  - `audit-import.mjs`, `audit-board.mjs`, the final-tree queue, the presweep and the full gate.
  - `mutate.mjs` itself, which I read as text only.
  - `playwright install`.
- **Pre-fix runs only for the S4 focus check.** I re-ran the builder's preservation probes at the final board, and the chunk 2 reviewer's probe at `2916f0a` (before S2). I did not re-run them after each of the ten commits, the builder's `pres.sh` loop.
  - The only pre-fix runs I made are for the S4 focus check, at `8f331a8`: `impfocus` and dialogs-keyboard.
  - I did not re-run the builder's `focus-*.mjs` harnesses or its negative toolbar-fits copy (`p2/neg`). I used my own mutants instead.
- **`npm run check` ran in a `git archive` copy**, so its two "tracked by git" checks fail for that reason alone (not a repository). The `jsa()` check was compared as text against `670c467`'s run.
- **Not every command was bounded.** git (read-only), grep, sed, cp, diff, the python text helpers (`mkmut.py`, `mymut.py`, inline `python3 -I` analysis) and the until-loops that waited on `runs.txt` ran directly, as short commands, or in the background for the waits. Only the `mcount` runs and a few python analyses were wrapped in `setsid -w timeout`.
- **Nothing was edited, staged or committed** in `/home/user/orbit-ui` or `/home/user/orbit-board`, and nothing was pushed. All my files are in this directory.
