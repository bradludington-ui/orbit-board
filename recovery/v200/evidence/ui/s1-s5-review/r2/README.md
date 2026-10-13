# ORBIT v2.00 UI chunk 3, part 2 (S1–S5), fix round: the verifier's record

Written 13 Oct 2026, 05:07 ET (`TZ=America/New_York date`), by the adversarial verifier. The verdict is in `VERDICT.md` beside this file. The first round's record and verdict (12 Oct, 19:38–19:39 ET) are one folder up, kept as they were written. All times are Eastern (EDT).

## What was verified

- **Branch.** `claude/v200-ui` in `/home/user/orbit-ui` (a worktree of `/home/user/orbit-board/.git`), HEAD `dd1595666b54f9a646385cacc650da1477ffcb6b`. Local only: `git branch -vv` shows no upstream for it. The working tree shows only `?? node_modules`.
- **The round.** Nine commits on top of `7a71245`, the head the first round reviewed: `e950efe`, `e7b7cbb`, `fe8ffa0`, `7950a4f`, `147ef2a`, `f2fa0ff`, `9519595`, `8783a2d` (19:57:11–20:29:40 ET, 12 Oct) and `dd15956` (00:04:23 ET, 13 Oct). Each is by `Claude <noreply@anthropic.com>`, and each message ends with exactly the two required lines.
- **The board is unchanged.** `git rev-parse <c>:prioritization-board-grid.html` is `5e9e5a5e383e0553342f822050b36da7d23e9eab` at every one of the nine commits. That is the board the first round verified, from `8325909` on. `git diff --stat 7a71245 dd15956` lists eight files, 311 insertions and 40 deletions, none of them the board.
- **File blobs.** `git rev-parse 7a71245:<f>` → `dd15956:<f>` match the builder's table exactly:

  | File | `7a71245` | `dd15956` |
  |---|---|---|
  | `prioritization-board-grid.html` | `5e9e5a5e` | unchanged |
  | `package.json` | `6255966f` | unchanged |
  | `tools/layout-fits.mjs` | `abfe1386` | `2ee21034` |
  | `tools/dropdowns-visible.mjs` | `948ec264` | `894e8cdc` |
  | `tools/keyboard-reach.mjs` | `28276bb3` | `632b31ac` |
  | `tools/toolbar-fits.mjs` | `447bdd0b` | `36682c7e` |
  | `tools/dialogs-keyboard.mjs` | `dd3ae677` | `0ba0f8d0` |
  | `tools/export-audit/audit-ui.mjs` | `ff485279` | `c77133f8` |
  | `tools/export-audit/mutate.mjs` | `a28f6578` | `d28e9356` |
  | `ui-concept/CHUNK3.md` | `049eb6a3` | `d8051e5f` |

- **The exact diff.** `git diff 7a71245 dd15956` is saved as `diff-7a71245..dd15956.diff` (blob `a7f2eab7`, 638 lines). It is byte-identical to the builder's `p2/fix1/diffs/7a71245..dd15956.diff`. The browser tools' whole change since base, `git diff 4a6f7c7 dd15956 -- tools/*.mjs`, is saved as `diff-4a6f7c7..dd15956-browser-tools.diff` (741 lines).
  - `audit-ui.mjs` gains 59 lines and loses none. `mutate.mjs` gains 8 and loses none. Every existing fixture, assertion and expected value is kept.

## This check was stopped once, and resumed

- **First attempt.** It ran from 00:24 ET: copies, then runs from 00:27:17 to 00:53:44 ET. 61 runs finished; they are above the `# RESUMED` line in `runs.txt`.
- **The stop.** It was a usage limit. The container then restarted: uptime was 1 minute at 04:13 ET, and no process of the first attempt was still alive.
- **Four runs were cut off.** Each has only its header:
  - `mut-v200-ui3-check-blind-dest` (00:53:13)
  - `mut-v200-ui3-check-blind-plan` (00:53:14)
  - `mut-vS2b-removed-len1` (00:52:16)
  - `dropdowns-visible@mut-fx-dock-ignored` (00:53:44)
- **What I checked after the restart.** All my files were on disk. `copies/dd15956` and `copies/7a71245` still matched their commits file by file (636 files each, 0 differing). Each mutant copy held the final `tools/` and its mutant board.
- **The resume.** Every run not yet finished was run again from 04:16:16 ET, with labels ending `@resume`. The first attempt's cut-off logs are kept as they are. No result of the first attempt was re-used for a run that did not finish.

## Scratch copies (nothing run in `/home/user/orbit-ui` or `/home/user/orbit-board`)

- **`copies/dd15956` and `copies/7a71245`.** These are `git archive` copies, with `node_modules` linked to `/home/user/orbit-ui/node_modules`. Each matches its commit file by file: 636 files, 0 differing (checked at 04:14 ET).
  - The one file I added is `copies/dd15956/tools/export-audit/audit-ui-vcount.mjs` (blob `5bd000fe`, also kept as `bin/audit-ui-vcount.mjs`). It is `audit-ui.mjs` with a check counter. The exact diff:

    ```
    17c17
    <   SEEN.add(scenario);
    ---
    >   SEEN.add(scenario); globalThis.__nchk=(globalThis.__nchk||0)+1; (globalThis.__per||(globalThis.__per={}))[scenario]=((globalThis.__per[scenario])||0)+1;
    1299a1300
    > console.log('checks run: '+globalThis.__nchk); Object.entries(globalThis.__per).forEach(([k,v])=>console.log('  per-scenario '+v+' | '+k));
    ```
- **`clone/`.** A `git clone` of `/home/user/orbit-ui` at `dd15956`, used only so that `check`'s two "tracked by git" checks can run outside the repository. Nothing was pushed from it.
- **`boards/`:**

  | File | Blob |
  |---|---|
  | `final.html`, `b-2ce11b6.html` | `5e9e5a5e` |
  | `b-670c467.html` | `2d1d855e` |
  | `b-f95fee2.html` | `9f61d32b` |
  | `b-4a6f7c7.html` | `4d273c06` |

- **`copies/mut-<id>/`.** Each holds `dd15956`'s `tools/`, its `package.json`, the `node_modules` link and the mutant board as `prioritization-board-grid.html`, checked with `cmp` and `diff -rq`.
  - `copies/old7a-save/` holds `7a71245`'s tools with the `vR-save-right-covered` board.

## Brad's instruction for this track, checked literally

The fix round's scope is the first round's verdict on S1–S5, inside Brad's S1–S5 text (quoted in CHUNK3.md part 2). It holds a must-fix, three should-fixes and six minors.

| Item | Brad / the verdict | Done? | Evidence (my runs) |
|---|---|---|---|
| must-fix: docked coverage | S4: "update tools for … the slide-over default, **retaining docked coverage**"; 6:00 AM: "while retaining checks for optional docking" | **Yes** | On base, C, D, E, F and I in layout-fits, dropdowns-visible (1536, 1920) and dialogs-keyboard (1600) ran beside the docked panel. Each now has a docked pass at exactly those sizes, and each pass checks where the panel is. Base's sizes are kept: dropdowns-visible's `SIZES` are the same 8, and docked on base meant only 1536 and 1920. |
| should-fix 1: S2's same-year rules | test the same-year half | **Yes** | 12 new checks. `vS2-removed-ignored` and `vS2-empty-path-ignored` are now the entries `v200-ui3-lastedit-removed-ignored` and `-whole-year-ignored` (byte-identical to my boards). Each fails 2 checks, the two of its own case. |
| should-fix 2: toolbar-fits "whole" | test the edges against the sidebar | **Yes** | The 60px mutant fails 14 of 20 width-and-mode pairs. My `vR-save-right-covered` (Help over Save's right edge) fails 20 of 20 with the final tool. |
| should-fix 3: keyboard-reach D2 and L | check placement | **Yes** | With the docked setting ignored, D2 and L fail on their own (`position: fixed`). |
| minors | CHUNK3.md S3 line, A, toolbar-fits summary, row-controls count, PID command lines, bounding | **Yes**, each | See below. The bounding minor is improved, not closed: lanes still run above 600 s. |

**Nothing beyond the instruction was applied.**

- The board is unchanged.
- Every tool change maps to an item.
- D and F's docked passes and dialogs-keyboard's go beyond the three tools the verdict named, but they are what "retaining docked coverage" means. Each ran beside the docked panel on base.
- No assertion was deleted or loosened, and no expected value changed (next section).

## Every changed assertion, base `4a6f7c7` → `dd15956` (the seven browser tools are unchanged from `4a6f7c7` to `670c467`)

All of `git diff 4a6f7c7 dd15956 -- tools/*.mjs` was read, and every removed non-comment line was matched to its replacement. "S4" marks part 2's commits (`0af09b6`, `df05821`, `2ce11b6`); "fix" marks this round's.

| Tool and check | Old (base) | New (`dd15956`) | Stricter, same, or looser |
|---|---|---|---|
| layout-fits C | one pass (docked above 1400 on base); `fails.length === 0` | two passes, sliding over and docked, the same condition; plus "the RECORD panel was …" per mode and pass (fix) | same condition, plus placement |
| layout-fits D | one pass; `r.bottom <= h && r.top < 320` | two passes, the same condition; plus placement per pass (fix) | same, plus placement |
| layout-fits E | `controls === 0 && drag === 0`; `panel === 'none'` | the same, twice; plus "the docked setting was on/off" (fix) | same, plus a check |
| layout-fits F | `r.out.length === 0` | twice; plus placement (fix) | same, plus placement |
| layout-fits I | `fails.length === 0 && notes > 0`; `big >= 9` | twice; plus placement (fix) | same, plus placement |
| dropdowns-visible | `judge()` for every toolbar menu, group and row menu at 8 sizes × 2 fonts | unchanged, then again docked at 1536 and 1920 × 2 heights × 2 fonts, after a placement check (fix) | same, plus a pass |
| dialogs-keyboard | `KNOWN` with no `uiImpClose`; one pass at 1600 | `uiImpClose: 'uiImpOpen('` and 16 focus-return checks (S4); the whole tool twice, each pass checking placement, problems marked "docked:" (fix) | same, plus checks |
| panels-render | no `SPECIAL.uiImpPanel` | `uiImpPanel: 'uiImpOpen();'` (S4) | the box is opened by its own opener; checks unchanged |
| inspector-agrees | one pass, docked at 1700 | sliding over (placement and Esc-closes checked) and docked (`prio27uiDock='1'`) (S4) | same, plus checks |
| editors-reachable | `wantDocked = w > 1400` | `wantDocked = docked && w > 1400`, two passes, "the docked setting did not take" (S4); the docked pass is the old rule word for word | same, plus a pass |
| keyboard-reach A | `tabTo('#q','#statBtn')`, `steps > 0` | S4: from the control found before `#statBtn` (`#b_pmo`, 1 Tab); fix: from `#uiCycBtn` written out (4 Tabs); `steps > 0` | same condition; the start is no longer derived from the answer |
| keyboard-reach D, D2 | one pass; `!!shape && shape.tag==='BUTTON' && steps>=0 && got===value` / `tag==='BUTTON' && steps>=0 && r.fsrc==='split' && !r.chip` | two passes, the same conditions; D's placement (S4), D2's (fix) | same, plus placement |
| keyboard-reach F | `#tab_review → #tab_fund`, `mode==='fund' && pressed==='tab_fund'` | the sidebar `#uiNav_req → #uiNav_fund`, the same plus `current==='uiNav_fund'`; plus Review → Rank on the task bar (S4) | stricter |
| keyboard-reach L | Review, Tab from `#q`; four conditions | Funding, Tab from `#b_share`; the same four conditions, twice (S4); placement (fix) | same, plus placement |
| toolbar-fits | `ok = oneLine && maxRight<=w && docW<=w && missing===0` | the same `&& unusable.length===0` (S4), where unusable includes "under the sidebar" and "its <side> edge covered" (fix); summary text (fix) | stricter |

## Every reported run, re-run (each through `bin/run.sh`; my result against the builder's)

| What | Builder | Mine | Same? |
|---|---|---|---|
| `audit-ui` at `dd15956` | ALL CHECKS PASSED | `audit-ui@dd15956` 00:28:11, exit 0, 241.4 s: ALL CHECKS PASSED | yes |
| counted | 616 = 510 + 56 + 50 | `audit-ui-count@dd15956` 00:32:12, exit 0, 224.8 s: 616; M1 510, S2 44 + 12, S3 50 | yes |
| counted on `670c467` | 8 failed, S2's first section; the new section passes | `audit-ui-count-on-670c467` 00:35:57, exit 1, 250.1 s: 616 run, 8 failed, all 4 board-wide cases × 2; none in the new section | yes |
| counted on `f95fee2` | 278 failed (254 M1, 8 S2, 16 S3) | `audit-ui-count-on-f95fee2` 00:40:07, exit 1, 197.7 s: 278 failed; none in the new section | yes |
| mcount (text) | 1,342 / 1,335 / 1,309 / 1,305 once | `mcount-on-final` 00:27:35, `-b-670c467`, `-b-f95fee2`, `-b-4a6f7c7` (exit 0 each, about 3 s each): 1,342 entries; 1,342 once on the final board, none twice, none unparsed; 1,335 on `670c467` (the 7 `lastedit` missing), 1,309 on `f95fee2` (33 missing), 1,305 on base (the 37 `v200-ui3-*` missing) | yes |
| boot-same | same ×4 | `boot-same@dd15956` 00:43:25, exit 0, 32.3 s: same in all 4 | yes |
| audit-other, audit, audit-recon | ALL CHECKS PASSED | 00:43:57 (63.9 s), 00:45:01 (19.3 s), 00:45:21 (185.0 s), exit 0 each: ALL CHECKS PASSED | yes |
| `check` | only the 10 `jsa()` values (in the repo) | `check@clone-dd15956` 00:48:26, exit 1, 6.9 s: only the 10 `jsa()` values, the same text as the builder's `check-repo-dd15956.log`; "pubState is null", "APPNS is empty"; both git checks pass. `check@copy-dd15956` 00:48:33: the same, plus the two git checks (an archive is not a repository) | yes |
| the 37 `v200-ui3-*` mutants | all caught, 616 run, none threw; counts in the table below | all 37 caught, 616 run each, no block threw, **every count identical** (table below) | yes |
| verify:grid at `dd15956`, each tool | chain 1; row-controls 1; toolbar-fits 1; layout-fits 1 (72/80, D ×4 per pass); 11 pass | lane G 00:28:11–00:45:04 (table below): the same exits; with times, clocks, colours and paths masked every tool's output is **identical** to the builder's `fix1/grid/<tool>-dd15956.log`. The chain differs only by npm's own header | yes |
| preservation at the final board | fails [], savedPayloadSame true, 130/0, refused, IDENTICAL WRITE LISTS true | `pres-rv-smoke@final` 00:31:45 (38.0 s), `pres-rv2-probe@final` 00:32:23 (81.7 s), `pres-rv2-m1@final` 00:33:45 (7.9 s), `pres-openwrites@final` 00:33:53 (15.8 s), exit 0 each: `fails: []`, `savedPayloadSame: true`, `src0SameApartFromStaticBlocks: true`; 130 PASS 0 FAIL; m1 `ok:false, taken:0, same:true`, "None of the 2 submittal files was loaded"; `IDENTICAL WRITE LISTS: true` | yes |
| browser mutants through the final tools | see the builder's table | the six I ran give the same results (below) | yes |

### verify:grid at `dd15956` (lane G, `bin/laneG.sh`, BOARD unset, the copy's own board `5e9e5a5e`)

| Tool | Start (ET) | Exit | Wall (s) | Result |
|---|---|---|---|---|
| `npm run verify:grid` | 00:28:11 | 1 | 7.7 | stops at row-controls |
| chrome | 00:28:18 | 0 | 0.5 | |
| row-controls | 00:28:19 | 1 | 6.5 | 56 recorded, 61 now; 3 entries not recorded (`mRun(showLog)`, `mRun(toggleJrnl)`, `uiDTab('…')` ×3) |
| inspector-agrees | 00:28:25 | 0 | 12.0 | both passes |
| toolbar-fits | 00:28:38 | 1 | 30.4 | 1152 review and fund wrap; "2 width(s) failed: 2 wrap, overflow or miss a control; 0 with a control not usable" |
| editors-reachable | 00:29:08 | 0 | 84.1 | |
| colour-check | 00:30:32 | 0 | 22.2 | |
| menu-paths | 00:30:54 | 0 | 14.2 | |
| panels-render | 00:31:09 | 0 | 24.8 | |
| fydp-frames | 00:31:34 | 0 | 7.4 | |
| hostile-render | 00:31:41 | 0 | 55.8 | |
| layout-fits | 00:32:37 | 1 | 286.6 | 72 ok, 8 FAIL: D ×4 sliding over and ×4 docked (1440 docked: top 420px); C docked: the grid 248–955px at 1401; I 837 notes, the nine-digit figure 18 times, each pass |
| keyboard-reach | 00:37:24 | 0 | 68.1 | 95 ok (91 at `7a71245`, 79 at base); A: 4 Tabs from `#uiCycBtn` |
| dropdowns-visible | 00:38:32 | 0 | 194.1 | 608 drop-downs, both fonts, sliding over and docked |
| dialogs-keyboard | 00:41:46 | 0 | 198.1 | 44 boxes and 16 of 16 Import returns in each pass |

### The 37 `v200-ui3-*` mutants (counted audit-ui, `copies/dd15956`, each board built as text by `rec/bin/mkmut.py` from the final board, every find matching once)

Every board is byte-identical to the builder's `p2/fix1/mut-f2fa0ff/<id>.html` (37 of 37, `cmp`). Blobs are in `logs/buildmut37.log`. "resumed" marks a run made after the restart.

| Mutation | Checks run | Failing | Block threw | Exit | Start (ET) | Wall (s) | Builder (616) | At `2ce11b6` (604) |
|---|---|---|---|---|---|---|---|---|
| `v200-ui3-asks-loaded` | 616 | 31 | 0 | 1 | 00:32:13 | 222.3 | 31 | 31 |
| `v200-ui3-dry-asks-unheard` | 616 | 31 | 0 | 1 | 00:36:08 | 251.6 | 31 | 31 |
| `v200-ui3-no-putback` | 616 | 218 | 0 | 1 | 00:35:56 | 248.2 | 218 | 218 |
| `v200-ui3-putback-no-dest` | 616 | 132 | 0 | 1 | 00:40:19 | 206.0 | 132 | 132 |
| `v200-ui3-putback-dest-copy` | 616 | 129 | 0 | 1 | 00:40:04 | 196.0 | 129 | 129 |
| `v200-ui3-putback-no-storage` | 616 | 106 | 0 | 1 | 00:43:45 | 221.9 | 106 | 106 |
| `v200-ui3-putback-no-save-state` | 616 | 79 | 0 | 1 | 00:43:20 | 231.7 | 79 | 79 |
| `v200-ui3-putback-writes-all` | 616 | 19 | 0 | 1 | 00:47:27 | 167.1 | 19 | 19 |
| `v200-ui3-pick-lost` | 616 | 107 | 0 | 1 | 00:47:12 | 180.6 | 107 | 107 |
| `v200-ui3-claim-unchecked` | 616 | 15 | 0 | 1 | 00:50:14 | 88.6 | 15 | 15 |
| `v200-ui3-check-blind-storage` | 616 | 19 | 0 | 1 | 00:50:13 | 89.1 | 19 | 19 |
| `v200-ui3-putback-shallow-dest` | 616 | 26 | 0 | 1 | 00:51:43 | 90.2 | 26 | 26 |
| `v200-ui3-snapshot-before-reads` | 616 | 10 | 0 | 1 | 00:51:42 | 92.5 | 10 | 10 |
| `v200-ui3-check-blind-dest` | 616 | 6 | 0 | 1 | 04:16:16 (resumed) | 89.6 | 6 | 6 |
| `v200-ui3-check-blind-plan` | 616 | 9 | 0 | 1 | 04:16:17 (resumed) | 91.1 | 9 | 9 |
| `v200-ui3-check-blind-save` | 616 | 3 | 0 | 1 | 04:17:45 (resumed) | 115.9 | 3 | 3 |
| `v200-ui3-check-blind-review` | 616 | 7 | 0 | 1 | 04:17:48 (resumed) | 117.2 | 7 | 7 |
| `v200-ui3-check-blind-added-keys` | 616 | 6 | 0 | 1 | 04:19:41 (resumed) | 155.6 | 6 | 6 |
| `v200-ui3-putback-dest-key-only` | 616 | 8 | 0 | 1 | 04:19:45 (resumed) | 158.6 | 8 | 8 |
| `v200-ui3-early-measured-before-reads` | 616 | 18 | 0 | 1 | 04:22:17 (resumed) | 135.1 | 18 | 18 |
| `v200-ui3-partway-before-run` | 616 | 3 | 0 | 1 | 04:22:24 (resumed) | 149.1 | 3 | 3 |
| `v200-ui3-wrote-anyones` | 616 | 1 | 0 | 1 | 04:24:32 (resumed) | 193.9 | 1 | 1 |
| `v200-ui3-reads-same-list` | 616 | 1 | 0 | 1 | 04:24:53 (resumed) | 188.6 | 1 | 1 |
| `v200-ui3-snapshot-keeps-old-save` | 616 | 2 | 0 | 1 | 04:27:46 (resumed) | 121.2 | 2 | 2 |
| `v200-ui3-check-ls-dest-only` | 616 | 8 | 0 | 1 | 04:28:02 (resumed) | 115.7 | 8 | 8 |
| `v200-ui3-check-added-dest-only` | 616 | 4 | 0 | 1 | 04:29:47 (resumed) | 138.4 | 4 | 4 |
| `v200-ui3-lastedit-year-first` | 616 | 8 | 0 | 1 | 04:29:58 (resumed) | 136.3 | 8 | 8 |
| `v200-ui3-lastedit-services-only` | 616 | 6 | 0 | 1 | 04:32:06 (resumed) | 140.4 | 6 | 6 |
| `v200-ui3-lastedit-writer-wide` | 616 | 2 | 0 | 1 | 04:32:14 (resumed) | 139.6 | 2 | 2 |
| `v200-ui3-lastedit-removed-wide` | 616 | 2 | 0 | 1 | 04:34:26 (resumed) | 190.8 | 2 | 2 |
| `v200-ui3-lastedit-no-year-filter` | 616 | 9 | 0 | 1 | 00:32:06 | 241.3 | 9 | 7 |
| `v200-ui3-dry-marks-unsaved` | 616 | 6 | 0 | 1 | 04:34:34 (resumed) | 191.9 | 6 | 6 |
| `v200-ui3-dry-writes-journal` | 616 | 119 | 0 | 1 | 04:37:37 (resumed) | 268.1 | 119 | 119 |
| `v200-ui3-dry-writes-storage` | 616 | 69 | 0 | 1 | 04:37:46 (resumed) | 290.0 | 69 | 69 |
| `v200-ui3-dry-folds-dest` | 616 | 114 | 0 | 1 | 04:42:05 (resumed) | 257.1 | 114 | 114 |
| `v200-ui3-lastedit-removed-ignored` | 616 | 2 | 0 | 1 | 00:28:11 | 235.2 | 2 | new |
| `v200-ui3-lastedit-whole-year-ignored` | 616 | 2 | 0 | 1 | 00:28:11 | 242.3 | 2 | new |

37 of 37 caught; every failing count is the builder's. `lastedit-no-year-filter` fails 9 against 7 at `2ce11b6`: the two more are the new section's CONTROL (with no year filter FY28's whole-year line suppresses the note), as the builder says. Each new entry fails exactly the two checks of its own case ("FY27: no last edit is named for S03" and "the record says nothing of a last edit…").

### My own mutants (each built as text from the final board, each find matching exactly once; scratch only)

| Mutant (blob) | What it changes | Run (final tools) | Start (ET) | Exit | Wall (s) | Result |
|---|---|---|---|---|---|---|
| `vS2b-created-only` (`372efd61`) | S2: only a whole year *created* (`a == null`) suppresses | counted audit-ui | 00:48:41 | 1 | 121.6 | **caught**, 2: the whole-year case (its line has `a:{_b:4100}`) |
| `vS2b-removed-same-id` (`fa5b7d8f`) | S2: only a removal of *this* requirement suppresses | counted audit-ui | 00:50:42 | 1 | 94.0 | **caught**, 2: the S05-removed case |
| `vS2b-removed-len1` (`e7f99752`) | S2: only a removal line with no index suppresses | counted audit-ui | 04:42:36 (resumed) | 1 | 229.2 | **caught**, 2: the S05-removed case (its path is `['removed', 0]`) |
| `vR-room-no-dock` (`0c00eda9`) | docked only: the row sized as if the docked panel took no room (the v1.89 kind) | layout-fits | 00:49:56 | 1 | 228.4 | **caught, docked pass only**: C docked ×3 (38, 38, 57 controls past the grid at 1440–1680); sliding over C passes (+ D ×8, m7, as on the final board). At `7a71245` no gate tool ran docked layout-fits, so this escaped |
| | | dropdowns-visible | 04:31:13 (resumed) | 1 | 160.9 | **caught, as a crash** in the docked pass: the click on row R000's ⋯ is taken by the docked panel (`page.click: Timeout`) |
| `vR-dock-focus-lost` (`4a8ccdb6`) | docked only: a closed box does not hand the keyboard back | dialogs-keyboard | 04:22:34 (resumed) | 1 | 185.2 | **caught, docked pass only**: 31 problems, every one "docked:" (15 boxes and 16 Import returns) |
| `vR-dock-menu-cut` (`8f1ae465`) | docked only: the toolbar's drop-downs `max-height:90px; overflow:hidden` | dropdowns-visible | 04:28:12 (resumed) | 0 | 181.2 | **ESCAPED** (both passes). `judge()` calls `scrollIntoView()` on each item before it looks, which scrolls even an `overflow:hidden` box, so a menu a person cannot scroll passes. `judge()` is unchanged since base (`git diff 4a6f7c7 dd15956` touches only the docked loop), so this is a gap from before S1–S5, not this round's |
| `vR-save-right-covered` (`a79c6c4d`) | every width: Help pulled 16px left over Save's right edge (Save's centre still shows) | toolbar-fits | 04:27:12 (resumed) | 1 | 29.3 | **caught** at 20 of 20 pairs: "#saveBtn: its right edge covered by #helpBtn" |
| | | toolbar-fits of `7a71245` (`copies/old7a-save`) | 04:59:12 (resumed) | 1 | 41.0 | **the old tool misses it**: every pair "all on screen, whole and clickable"; it fails only 1152's one-line rule, as on the final board. The fix round's edge check is what catches it |
| `vR-dock-narrowed-1600` (`a53cabed`) | a silent narrowing: docked beside the table only above 1600px; at 1401–1600 the setting is on but the panel is the drawer | layout-fits | 04:46:57 (resumed) | 1 | 253.2 | **caught, docked pass only**: placement fails in C ×3 (1440–1600), D (1440), F (1440) and I (1440): "the RECORD panel is a drawer, not docked beside the grid"; 14 failed with D's 8 |
| | | dropdowns-visible | 04:51:10 (resumed) | 1 | 189.5 | **caught, docked pass only**: 4 problems, 1536 at both heights in both fonts, "not docked beside the list" (1920 is above 1600) |
| | | keyboard-reach | 04:54:20 (resumed) | 1 | 64.9 | **caught, docked pass only**: D, D2 and L "the panel was docked beside the table (docked) — position: fixed" (at 1440) |
| `vR-docked-rowmenu-clipped-narrow` (`5af3dc54`) | docked, at 1401–1535 only (the narrowest docked grid): the lower half of a row's open ⋯ menu cut off | dropdowns-visible | 04:55:25 (resumed) | 0 | 227.2 | **ESCAPED**. dropdowns-visible's docked pass runs at 1536 and 1920 only, the sizes at which base ran docked. layout-fits C checks the ⋯ button inside the grid at 1401–1535, not the open menu. So a docked-only row-menu fault at the narrowest docked grid passes the gate, as it would have on base: a gap from before S1–S5, not a loss |

### The builder's browser mutants, through the final tools (boards byte-identical to the builder's quoted blobs)

| Mutant (blob) | Run | Start (ET) | Exit | Wall (s) | Result (the builder's, confirmed) |
|---|---|---|---|---|---|
| `fx-dock-ignored` (`d3039ebd`, = my round-1 `vDock-ignored`) | layout-fits | 00:45:15 | 1 | 280.7 | docked pass only: placement C ×3, D, F, I and E's setting (+ D ×8, m7) |
| | dropdowns-visible | 04:16:18 (resumed) | 1 | 188.0 | 8 problems, all docked: "not docked beside the list" (4 sizes × 2 fonts) |
| | dialogs-keyboard | 04:19:26 (resumed) | 1 | 188.2 | 1 problem: "docked: the RECORD panel is not docked beside the table (position fixed, docked setting off)" |
| | keyboard-reach | 04:25:39 (resumed) | 1 | 93.0 | D2 and L docked "position: fixed"; D docked times out |
| `fx-hdr-under-sidebar-60` (`e3f26a85`, = my round-1 `vTF-hdr-under-sidebar`) | toolbar-fits | 04:27:42 (resumed) | 1 | 29.7 | 14 of 20 pairs: `#uiCycBtn` under the sidebar (201 < 232; 33 < 64 at 900 and 820); 1440 and wider pass, where the shifted button sits at 243px, still right of 232 (my round-1 `hdrpos@mut-vTF` log) |
| `fx-docked-rows-wide` (`12c13f25`) | layout-fits | 04:33:54 (resumed) | 1 | 268.7 | C docked ×3 (38, 38, 57 at 1920–1680); sliding over passes (+ D ×8) |
| `fx-docked-note-cut` (`ea594a39`) | layout-fits | 04:38:22 (resumed) | 1 | 314.9 | I docked ("lane short$980,000" 48>30); sliding over passes (+ D ×8) |
| `fx-docked-rowmenu-clipped` (`fc03a112`) | dropdowns-visible | 04:43:37 (resumed) | 1 | 198.2 | 96 problems, every one docked (the tool prints the first 60) |
| `fx-docked-rowmenu-shift` (`afc07fa3`), `fx-docked-rowmenu-offscreen` (`d1be0519`) and the final board | the builder's `rowmenu-probe.mjs`, my copy `probes/rowmenu-probe-r2.mjs` (blob `bc452475`; only its three import lines changed, exact diff below) | 05:01:14 (`rowmenu-probe-r2b`; the first try, `rowmenu-probe-r2` at 04:59:53, exited 1 in 0.5 s because a bare `playwright-core` does not resolve from my folder) | 0 | 177.4 | as the builder found: the open menu's box is the same on all three boards (1044–1307 at 1920×960, 775–1039 at 1536×730), 5 of 5 items on top; `fitMenus()`'s inline left takes up the stylesheet's shift (624 and −876px at 1920, 355.2 and −760.8px at 1536). So a shift-type mutant cannot reach the row menus; a clip can (`fx-docked-rowmenu-clipped`, above) |

## The docked setting: the tools' route against a person's

The tools set `prio27uiDock='1'` before the page loads. A person clicks View › Record panel › Docked beside the table. That is a shortcut that could hide an effect, so I tested it:

- `probes/dockclick.mjs` compares the two routes, at once and after a reload, at 1920, 1600, 1440, 1401 and 1366.
  - `dockclick@final` (00:45:09, exit 0, 29.5 s): the click route matched the tools' route at every width. After the reload the same held, except at 1366, where the reload came back with the setting gone (`stored: null`).
  - `dockclick@final-2` (00:47:14, exit 0, 33.5 s): every width matched, the reload at 1366 included.
- `probes/dockreload.mjs` (`dockreload@final`, 00:46:47, exit 0, 16.9 s) logs every write and removal of a `prio27ui` key in the page. At 1366 and 1401 the setting was kept, and the only write was `LS set prio27uiDock=1`.
- `probes/dockreload2.mjs` (`dockreload2@final`, 05:00:12, exit 0, 49.6 s, after the restart, load about 20) repeats the click and the reload 4 times at 1366 and 4 at 1440, each in a fresh context, with the same hook. The setting was kept 8 of 8 times, and no removal was logged. The one loss in `dockclick@final` (00:45, under heavy load, the reload made at once after the click) is not reproduced in 6 more reloads at 1366 (one in `dockclick@final-2`, one in `dockreload@final`, four here). In no hooked run did the board remove the key. I record it as not reproduced and not shown to be the board's. It does not touch the tools, which set the key before the page loads, and the board did not change in this round.
- **So the tools' route is a fair stand-in for a person's.** At 1401–1920 the click gives the same class, panel position, grid edges, room class and row columns as the tools' pre-set key, at once and after a reload. At 1366 both give the drawer.

## Screenshots

- The 37 committed PNGs in `ui-concept/preview-chunk3/part2/` are unchanged since `83c589f` (`git diff --stat 7a71245 dd15956 -- ui-concept/preview-chunk3` is empty).
- They were taken at board `5e9e5a5e`, which is still the board. The first round retook all 37 at that blob and compared them: 30 pixel-identical, 7 differing by 2–32 pixels from anti-aliasing.
- I viewed `d-1440-docked-sidebar-open.png` and `t-1152-review-context-bar-wraps-every-control-usable.png` again (copies in `shots/`, blobs `df24afba` and `655bc59f`, the same as the committed files). The first shows the docked layout this round's passes check: the grid at 248–982, the panel beside it, the row ⋯ buttons inside the grid. The second shows 1152 with the context bar on two lines and every control showing.
- They show the synthetic rows each shot builds at run time. The committed board stays the empty template.

## The rules

- **`mutate.mjs` was never imported or run**, by me or by the builder.
  - I read it only as text, through `rec/bin/mkmut.py` (37 boards) and `rec/L2/u2impl/mcount.py` (4 counts), with `python3 -I`, each bounded.
  - The builder's scripts read it only through `mkmut.py`, `mcount.py` and a `re.findall` of ids. 82 PID lines name it, and every one is `mkmut.py`, `mcount.py`, the timeout wrapper or a lane.
- **The mutation entries.** UIX, the UI track's own rule (`rec/L3/wf/ui.js`), puts UI entries at the END of `MUTATIONS` as one contiguous `v200-ui3-` group. The R3 anchor in the general rule is for the safety branch. The two new entries close that group (lines 4375–4382, before `];` at 4383), and every entry still matches the final board once.
- **Bounding.**
  - Every node, Chromium and python run that produced a result went through `bin/run.sh` (`setsid -w timeout -k 10 <cap>`, PIDs recorded). The cap was 600 s, or 300 and 120 s for small runs.
  - The lane scripts were bounded too, but with caps above 600 s (3600–7000 s), because each holds several runs.
  - Not bounded:
    - read-only git
    - `git archive` and the local `git clone` that made the copies (first attempt)
    - `cp`, `ln`, `mkdir`, `sed`, `grep`, `diff`, `cmp`, `stat`
    - inline `python3 -I` reads of my own logs
    - the `timeout 280`–`285` wait loops
  - Nothing was killed. No PID outside my list was touched, and the restart ended the first attempt's processes, not I.
- **The lock** was checked before every run and was never present: `lockwaits.txt` was never written. The builder's `fix1/lockwaits.txt` does not exist either.
- **`/home/user/orbit-board`.** Nothing was edited, staged or committed there by me. Its working tree is clean.
  - Its log in this window holds only the lead's recovery commits (`a5e8fba` 23:13, `321ac94` 00:43, `e3ef350` 00:44, `674b6c5` 04:14). The fix round's commits show in `git log --all` only because `orbit-ui` is a worktree of the same repository.
  - Nothing in the builder's `fix1/bin` or `runs.txt` names `orbit-board`.
- **The board stays the empty template.** It is the same blob, and `check` reports "pubState is null" and "APPNS is empty".
- **Times.**
  - The builder's README fix-round section was saved at 00:22:01 ET. Its latest time is 00:21:21, and it is headed 00:21.
  - CHUNK3.md's latest time is 23:23:48, in a commit made at 00:04:23.
  - None is later than its file. Every time in this file was taken from `TZ=America/New_York date` and is earlier than when it was written.
- **Not pushed.** `claude/v200-ui` has no upstream. I pushed nothing, anywhere.

## Exact diffs of everything I copied and changed, or built

`probes/rowmenu-probe-r2.mjs` against the builder's `p2/fix1/probes/rowmenu-probe.mjs`:

```
1c1
< // rowmenu-probe.mjs (resumed builder, scratch): where a row's ⋯ menu lands with the RECORD panel docked, on the final board
---
> // rowmenu-probe-r2.mjs (the verifier's copy of the builder's probe; only its three import paths changed: two to the verifier's dd15956 copy, and playwright-core by its full path, since a bare name does not resolve from this folder): where a row's ⋯ menu lands with the RECORD panel docked, on the final board
5,7c5,7
< import { chromium } from 'playwright-core';
< import { CHROME } from '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/p2/fix1/grid/copy-8783a2d/tools/chrome.mjs';
< import { buildPopulated } from '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/p2/fix1/grid/copy-8783a2d/tools/ia-fixture.mjs';
---
> import { chromium } from '/home/user/orbit-ui/node_modules/playwright-core/index.mjs';
> import { CHROME } from '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/verify-S1-S5/r2/copies/dd15956/tools/chrome.mjs';
> import { buildPopulated } from '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk3/verify-S1-S5/r2/copies/dd15956/tools/ia-fixture.mjs';
```

Each mutant board against `boards/final.html` (`diff`; one inserted or replaced line each):

```
== vR-dock-focus-lost (4a8ccdb6)
31427c31427
<     if(to) dlgFocus(to);
---
>     if(to && !document.documentElement.classList.contains('ui-dock')) dlgFocus(to);
== vR-dock-menu-cut (8f1ae465)
1388a1389
> html.ui-dock .menu .mdd{max-height:90px!important;overflow:hidden!important}
== vR-dock-narrowed-1600 (a53cabed)
1388a1389
> @media (max-width:1600px){html.ui-on.ui-dock .gridsplit{grid-template-columns:minmax(0,1fr)} html.ui-on.ui-dock .inspector{position:fixed;top:0;right:0;bottom:0;left:auto;width:min(460px,92vw);max-height:none;height:100%;z-index:60;transform:translateX(102%)}}
== vR-docked-rowmenu-clipped-narrow (5af3dc54)
1388a1389
> @media (min-width:1401px) and (max-width:1535px){html.ui-on.ui-dock #list .rowmenu.open > .mdd{clip-path:inset(0 0 50% 0)}}
== vR-room-no-dock (0c00eda9)
31911c31911
<   const dockW=(UI2.dock && w>1400 && uiMode!=='brief')? Math.min(600, Math.max(420, w*0.30))+10 : 0;
---
>   const dockW=0;
== vR-save-right-covered (a79c6c4d)
1388a1389
> #helpBtn{margin-left:-16px!important;position:relative;z-index:3}
== vS2b-created-only (372efd61)
32271c32271
<       if(!e.p.length || k==='removed') return null;
---
>       if((!e.p.length && e.a==null) || k==='removed') return null;
== vS2b-removed-len1 (e7f99752)
32271c32271
<       if(!e.p.length || k==='removed') return null;
---
>       if(!e.p.length || (k==='removed' && e.p.length===1)) return null;
== vS2b-removed-same-id (fa5b7d8f)
32271c32271
<       if(!e.p.length || k==='removed') return null;
---
>       if(!e.p.length || (k==='removed' && String(e.b)===String(id))) return null;
== fx-dock-ignored (d3039ebd, the builder's)
31885c31885
<   try{ UI2.dock = localStorage.getItem('prio27uiDock')==='1'; }catch(e){}
---
>   try{ UI2.dock = false; }catch(e){}
== fx-docked-note-cut (ea594a39, the builder's)
1454a1455
> html.ui-on.ui-dock #inspector .insp-split .drew{max-width:30px;overflow:hidden;white-space:nowrap}
== fx-docked-rowmenu-clipped (fc03a112, the builder's)
1454a1455
> html.ui-on.ui-dock #list .rowmenu.open > .mdd{clip-path:inset(0 0 50% 0)}
== fx-docked-rows-wide (12c13f25, the builder's)
1454a1455
> @media (min-width:1401px){html.ui-on.ui-dock #list .row{min-width:1200px}}
== fx-hdr-under-sidebar-60 (e3f26a85, the builder's)
1454a1455
> html.ui-on .hdr{margin-left:-60px}
== fx-docked-rowmenu-shift (afc07fa3, the builder's)
1454a1455
> html.ui-on.ui-dock #list .menu.open > .mdd{transform:translateX(420px)}
== fx-docked-rowmenu-offscreen (d1be0519, the builder's)
1454a1455
> html.ui-on.ui-dock #list .rowmenu.open > .mdd{transform:translateX(100vw)}
```

The 37 `v200-ui3-*` boards are each entry's own find → repl, applied once by `mkmut.py` (its record per board in `mut/<id>.json`).

My scripts and probes (blobs, `git hash-object`):

| File | Blob | What it does |
|---|---|---|
| `bin/run.sh` | 49b1672e | the lock wait (20 s polls, up to 30 min, then SKIPPED), `setsid -w timeout -k 10 <cap>`, the PIDs and their command lines (and the command as given) into `pids.txt`, start and end ET, exit and wall seconds into the log and `runs.txt` |
| `bin/audit-ui-vcount.mjs` | 5bd000fe | `audit-ui.mjs` at `dd15956` with a check counter (diff above) |
| `bin/buildmut.sh` | 1166c75f | the 37 `v200-ui3-*` boards, as text, by `mkmut.py` |
| `bin/mutlane.sh`, `bin/mutlane2.sh` | 8b22902f, 67c8a32b | the counted audit-ui on each board, one after another (`2`: after the restart, labels `@resume`) |
| `bin/laneG.sh` | 0dd89e8d | every verify:grid tool on its own, the chain first |
| `bin/laneJ.sh` | 4c9ec53f | the jsdom suites and `check` |
| `bin/laneP.sh` | 18aabb39 | the four preservation probes |
| `bin/myjs.sh` | a802b7b4 | my S2 mutants after the jsdom lane |
| `bin/brlane.sh`, `bin/brall.sh` | f84d95b1, ada64fd6 | the browser mutants (first attempt) |
| `bin/brlane2.sh`, `bin/br3.sh`, `bin/br4.sh` | 54c8fa61, 22ab4a0d, 4e2fd2e4 | the browser mutants and probes after the restart |
| `bin/mymut2.py`, `bin/mymut3.py` | 31c38af8, 9b47cb71 | my mutants, as text, each find matching exactly once or nothing written |
| `bin/tables.py` | 9b9ffb66 | the two tables at the end of this file, from `runs.txt` and `pids.txt` (text only) |
| `probes/rv-smoke-r2.mjs`, `rv2-probe-r2.mjs`, `rv2-m1-r2.mjs`, `openwrites-r2.mjs` | d7febecd, 4cb9d850, f76ee6ac, 4778f4bf | the chunk 1 and chunk 2 reviewers' preservation probes, with only the board path (`boards/final.html`) and `boot.mjs` (my `dd15956` copy's) changed |
| `probes/dockclick.mjs`, `dockreload.mjs`, `dockreload2.mjs` | 2159ef1b, c64fb442, 791bf38f | the docked setting by View's click against the tools' pre-set key; the reload and every write of the key |
| `probes/rowmenu-probe-r2.mjs` | bc452475 | the builder's probe (diff above) |

The four preservation probes against the first round's copies (`../probes/<name>-final.mjs`): only the `boot.mjs` import (now `r2/copies/dd15956`) and the board path (now `r2/boards/final.html`) differ; `rv2-probe`'s trailing comment on that line also says "the final board".

## Not done, said plainly

- **Not run:**
  - the full `audit-import.mjs` and `audit-board.mjs` (the lead's)
  - `mutate.mjs` itself
  - `playwright install`
  - the final-tree queue, the presweep and the full gate
- **Not repeated this round:**
  - verify:grid at `8783a2d`. Its tools and board are the final commit's, and I ran the final.
  - the builder's three runs of `fydp-frames`. Mine passed once.
  - the builder's `fx-docked-panel-over-menus` and `fx-docked-rowmenu-rightwards` mutants. I ran `-shift` and `-offscreen`, through its probe.
- **Screenshots were not retaken**, because the board is unchanged since the first round retook all 37.
- The tables below were made by `bin/tables.py` (text only) from `runs.txt` and `pids.txt`.

### Runs (`runs.txt`, in the order they finished; each through `bin/run.sh`)

| # | Run | Start (ET) | Exit | Wall (s) | Log |
|---|---|---|---|---|---|
| 1 | `buildmut37` | 2026-10-13 00:27:17 | 0 | 9.3 | `logs/buildmut37.log` |
| 2 | `mcount-on-final` | 2026-10-13 00:27:35 | 0 | 3.0 | `logs/mcount-on-final.log` |
| 3 | `mcount-on-b-670c467` | 2026-10-13 00:27:38 | 0 | 2.8 | `logs/mcount-on-b-670c467.log` |
| 4 | `mcount-on-b-f95fee2` | 2026-10-13 00:27:41 | 0 | 2.8 | `logs/mcount-on-b-f95fee2.log` |
| 5 | `mcount-on-b-4a6f7c7` | 2026-10-13 00:27:43 | 0 | 2.8 | `logs/mcount-on-b-4a6f7c7.log` |
| | # lanes started 2026-10-13 00:27:56 EDT | | | | |
| 6 | `grid-chain@dd15956` | 2026-10-13 00:28:11 | 1 | 7.7 | `logs/grid-chain@dd15956.log` |
| 7 | `grid-chrome@dd15956` | 2026-10-13 00:28:18 | 0 | 0.5 | `logs/grid-chrome@dd15956.log` |
| 8 | `grid-row-controls@dd15956` | 2026-10-13 00:28:19 | 1 | 6.5 | `logs/grid-row-controls@dd15956.log` |
| 9 | `grid-inspector-agrees@dd15956` | 2026-10-13 00:28:25 | 0 | 12.0 | `logs/grid-inspector-agrees@dd15956.log` |
| 10 | `grid-toolbar-fits@dd15956` | 2026-10-13 00:28:38 | 1 | 30.4 | `logs/grid-toolbar-fits@dd15956.log` |
| 11 | `grid-editors-reachable@dd15956` | 2026-10-13 00:29:08 | 0 | 84.1 | `logs/grid-editors-reachable@dd15956.log` |
| 12 | `mymut2` | 2026-10-13 00:30:43 | 0 | 0.8 | `logs/mymut2.log` |
| 13 | `grid-colour-check@dd15956` | 2026-10-13 00:30:32 | 0 | 22.2 | `logs/grid-colour-check@dd15956.log` |
| 14 | `grid-menu-paths@dd15956` | 2026-10-13 00:30:54 | 0 | 14.2 | `logs/grid-menu-paths@dd15956.log` |
| 15 | `grid-panels-render@dd15956` | 2026-10-13 00:31:09 | 0 | 24.8 | `logs/grid-panels-render@dd15956.log` |
| 16 | `grid-fydp-frames@dd15956` | 2026-10-13 00:31:34 | 0 | 7.4 | `logs/grid-fydp-frames@dd15956.log` |
| 17 | `mut-v200-ui3-lastedit-removed-ignored` | 2026-10-13 00:28:11 | 1 | 235.2 | `logs/mut-v200-ui3-lastedit-removed-ignored.log` |
| 18 | `audit-ui@dd15956` | 2026-10-13 00:28:11 | 0 | 241.4 | `logs/audit-ui@dd15956.log` |
| 19 | `mut-v200-ui3-lastedit-whole-year-ignored` | 2026-10-13 00:28:11 | 1 | 242.3 | `logs/mut-v200-ui3-lastedit-whole-year-ignored.log` |
| 20 | `pres-rv-smoke@final` | 2026-10-13 00:31:45 | 0 | 38.0 | `logs/pres-rv-smoke@final.log` |
| 21 | `grid-hostile-render@dd15956` | 2026-10-13 00:31:41 | 0 | 55.8 | `logs/grid-hostile-render@dd15956.log` |
| 22 | `pres-rv2-probe@final` | 2026-10-13 00:32:23 | 0 | 81.7 | `logs/pres-rv2-probe@final.log` |
| 23 | `pres-rv2-m1@final` | 2026-10-13 00:33:45 | 0 | 7.9 | `logs/pres-rv2-m1@final.log` |
| 24 | `pres-openwrites@final` | 2026-10-13 00:33:53 | 0 | 15.8 | `logs/pres-openwrites@final.log` |
| | LANEP-DONE 00:34:09 EDT | | | | |
| 25 | `lane-P` | 2026-10-13 00:31:45 | 0 | 143.7 | `logs/lane-P.log` |
| 26 | `mut-v200-ui3-asks-loaded` | 2026-10-13 00:32:13 | 1 | 222.3 | `logs/mut-v200-ui3-asks-loaded.log` |
| 27 | `audit-ui-count@dd15956` | 2026-10-13 00:32:12 | 0 | 224.8 | `logs/audit-ui-count@dd15956.log` |
| 28 | `mut-v200-ui3-lastedit-no-year-filter` | 2026-10-13 00:32:06 | 1 | 241.3 | `logs/mut-v200-ui3-lastedit-no-year-filter.log` |
| 29 | `grid-layout-fits@dd15956` | 2026-10-13 00:32:37 | 1 | 286.6 | `logs/grid-layout-fits@dd15956.log` |
| 30 | `grid-keyboard-reach@dd15956` | 2026-10-13 00:37:24 | 0 | 68.1 | `logs/grid-keyboard-reach@dd15956.log` |
| 31 | `mut-v200-ui3-no-putback` | 2026-10-13 00:35:56 | 1 | 248.2 | `logs/mut-v200-ui3-no-putback.log` |
| 32 | `audit-ui-count-on-670c467` | 2026-10-13 00:35:57 | 1 | 250.1 | `logs/audit-ui-count-on-670c467.log` |
| 33 | `mut-v200-ui3-dry-asks-unheard` | 2026-10-13 00:36:08 | 1 | 251.6 | `logs/mut-v200-ui3-dry-asks-unheard.log` |
| 34 | `grid-dropdowns-visible@dd15956` | 2026-10-13 00:38:32 | 0 | 194.1 | `logs/grid-dropdowns-visible@dd15956.log` |
| 35 | `mut-v200-ui3-putback-dest-copy` | 2026-10-13 00:40:04 | 1 | 196.0 | `logs/mut-v200-ui3-putback-dest-copy.log` |
| 36 | `audit-ui-count-on-f95fee2` | 2026-10-13 00:40:07 | 1 | 197.7 | `logs/audit-ui-count-on-f95fee2.log` |
| 37 | `mut-v200-ui3-putback-no-dest` | 2026-10-13 00:40:19 | 1 | 206.0 | `logs/mut-v200-ui3-putback-no-dest.log` |
| 38 | `boot-same@dd15956` | 2026-10-13 00:43:25 | 0 | 32.3 | `logs/boot-same@dd15956.log` |
| 39 | `audit-other@dd15956` | 2026-10-13 00:43:57 | 0 | 63.9 | `logs/audit-other@dd15956.log` |
| 40 | `grid-dialogs-keyboard@dd15956` | 2026-10-13 00:41:46 | 0 | 198.1 | `logs/grid-dialogs-keyboard@dd15956.log` |
| 41 | `lane-G` | 2026-10-13 00:28:11 | 0 | 1013.3 | `logs/lane-G.log` |
| | # brall starts after GRIDDONE 00:33:49 EDT | | | | |
| 42 | `audit@dd15956` | 2026-10-13 00:45:01 | 0 | 19.3 | `logs/audit@dd15956.log` |
| 43 | `dockclick@final` | 2026-10-13 00:45:09 | 0 | 29.5 | `logs/dockclick@final.log` |
| | # CORRECTION (00:45:53 EDT): the line above '# brall starts after GRIDDONE 00:33:49 EDT' carries the time brall.sh was WRITTEN (the heredoc expanded date then); brall waited for GRIDDONE (00:45:04 EDT) and its first run is the next BR entry below | | | | |
| 44 | `dockreload@final` | 2026-10-13 00:46:47 | 0 | 16.9 | `logs/dockreload@final.log` |
| 45 | `mut-v200-ui3-putback-no-save-state` | 2026-10-13 00:43:20 | 1 | 231.7 | `logs/mut-v200-ui3-putback-no-save-state.log` |
| 46 | `mut-v200-ui3-putback-no-storage` | 2026-10-13 00:43:45 | 1 | 221.9 | `logs/mut-v200-ui3-putback-no-storage.log` |
| 47 | `dockclick@final-2` | 2026-10-13 00:47:14 | 0 | 33.5 | `logs/dockclick@final-2.log` |
| 48 | `audit-recon@dd15956` | 2026-10-13 00:45:21 | 0 | 185.0 | `logs/audit-recon@dd15956.log` |
| 49 | `check@clone-dd15956` | 2026-10-13 00:48:26 | 1 | 6.9 | `logs/check@clone-dd15956.log` |
| 50 | `check@copy-dd15956` | 2026-10-13 00:48:33 | 1 | 7.9 | `logs/check@copy-dd15956.log` |
| | LANEJ-DONE 00:48:40 EDT | | | | |
| 51 | `lane-J` | 2026-10-13 00:28:11 | 0 | 1229.7 | `logs/lane-J.log` |
| 52 | `layout-fits@mut-fx-dock-ignored` | 2026-10-13 00:45:15 | 1 | 280.7 | `logs/layout-fits@mut-fx-dock-ignored.log` |
| 53 | `mut-v200-ui3-pick-lost` | 2026-10-13 00:47:12 | 1 | 180.6 | `logs/mut-v200-ui3-pick-lost.log` |
| 54 | `mut-v200-ui3-putback-writes-all` | 2026-10-13 00:47:27 | 1 | 167.1 | `logs/mut-v200-ui3-putback-writes-all.log` |
| 55 | `mut-vS2b-created-only` | 2026-10-13 00:48:41 | 1 | 121.6 | `logs/mut-vS2b-created-only.log` |
| 56 | `mut-v200-ui3-check-blind-storage` | 2026-10-13 00:50:13 | 1 | 89.1 | `logs/mut-v200-ui3-check-blind-storage.log` |
| 57 | `mut-v200-ui3-claim-unchecked` | 2026-10-13 00:50:14 | 1 | 88.6 | `logs/mut-v200-ui3-claim-unchecked.log` |
| 58 | `mut-vS2b-removed-same-id` | 2026-10-13 00:50:42 | 1 | 94.0 | `logs/mut-vS2b-removed-same-id.log` |
| 59 | `mut-v200-ui3-putback-shallow-dest` | 2026-10-13 00:51:43 | 1 | 90.2 | `logs/mut-v200-ui3-putback-shallow-dest.log` |
| 60 | `mut-v200-ui3-snapshot-before-reads` | 2026-10-13 00:51:42 | 1 | 92.5 | `logs/mut-v200-ui3-snapshot-before-reads.log` |
| 61 | `layout-fits@mut-vR-room-no-dock` | 2026-10-13 00:49:56 | 1 | 228.4 | `logs/layout-fits@mut-vR-room-no-dock.log` |
| | # RESUMED after the usage-limit stop and the container restart (uptime 1 min at 04:13 ET); runs cut off at the stop and not finished: mut-v200-ui3-check-blind-dest (00:53:13), mut-v200-ui3-check-blind-plan (00:53:14), mut-vS2b-removed-len1 (00:52:16), dropdowns-visible@mut-fx-dock-ignored (00:53:44): each has only its header; each is re-run below with '@resume'. Written 2026-10-13 04:15:40 EDT | | | | |
| | # resume lanes started 2026-10-13 04:16:16 EDT | | | | |
| 62 | `mut-v200-ui3-check-blind-dest@resume` | 2026-10-13 04:16:16 | 1 | 89.6 | `logs/mut-v200-ui3-check-blind-dest@resume.log` |
| 63 | `mut-v200-ui3-check-blind-plan@resume` | 2026-10-13 04:16:17 | 1 | 91.1 | `logs/mut-v200-ui3-check-blind-plan@resume.log` |
| 64 | `dropdowns-visible@mut-fx-dock-ignored@resume` | 2026-10-13 04:16:18 | 1 | 188.0 | `logs/dropdowns-visible@mut-fx-dock-ignored@resume.log` |
| 65 | `mut-v200-ui3-check-blind-save@resume` | 2026-10-13 04:17:45 | 1 | 115.9 | `logs/mut-v200-ui3-check-blind-save@resume.log` |
| 66 | `mut-v200-ui3-check-blind-review@resume` | 2026-10-13 04:17:48 | 1 | 117.2 | `logs/mut-v200-ui3-check-blind-review@resume.log` |
| 67 | `mut-v200-ui3-check-blind-added-keys@resume` | 2026-10-13 04:19:41 | 1 | 155.6 | `logs/mut-v200-ui3-check-blind-added-keys@resume.log` |
| 68 | `mut-v200-ui3-putback-dest-key-only@resume` | 2026-10-13 04:19:45 | 1 | 158.6 | `logs/mut-v200-ui3-putback-dest-key-only@resume.log` |
| 69 | `dialogs-keyboard@mut-fx-dock-ignored@resume` | 2026-10-13 04:19:26 | 1 | 188.2 | `logs/dialogs-keyboard@mut-fx-dock-ignored@resume.log` |
| 70 | `mymut3` | 2026-10-13 04:24:27 | 0 | 0.6 | `logs/mymut3.log` |
| 71 | `mut-v200-ui3-early-measured-before-reads@resume` | 2026-10-13 04:22:17 | 1 | 135.1 | `logs/mut-v200-ui3-early-measured-before-reads@resume.log` |
| 72 | `mut-v200-ui3-partway-before-run@resume` | 2026-10-13 04:22:24 | 1 | 149.1 | `logs/mut-v200-ui3-partway-before-run@resume.log` |
| 73 | `dialogs-keyboard@mut-vR-dock-focus-lost@resume` | 2026-10-13 04:22:34 | 1 | 185.2 | `logs/dialogs-keyboard@mut-vR-dock-focus-lost@resume.log` |
| 74 | `keyboard-reach@mut-fx-dock-ignored@resume` | 2026-10-13 04:25:39 | 1 | 93.0 | `logs/keyboard-reach@mut-fx-dock-ignored@resume.log` |
| 75 | `toolbar-fits@mut-vR-save-right-covered@resume` | 2026-10-13 04:27:12 | 1 | 29.3 | `logs/toolbar-fits@mut-vR-save-right-covered@resume.log` |
| 76 | `mut-v200-ui3-wrote-anyones@resume` | 2026-10-13 04:24:32 | 1 | 193.9 | `logs/mut-v200-ui3-wrote-anyones@resume.log` |
| 77 | `mut-v200-ui3-reads-same-list@resume` | 2026-10-13 04:24:53 | 1 | 188.6 | `logs/mut-v200-ui3-reads-same-list@resume.log` |
| 78 | `toolbar-fits@mut-fx-hdr-under-sidebar-60@resume` | 2026-10-13 04:27:42 | 1 | 29.7 | `logs/toolbar-fits@mut-fx-hdr-under-sidebar-60@resume.log` |
| 79 | `mut-v200-ui3-snapshot-keeps-old-save@resume` | 2026-10-13 04:27:46 | 1 | 121.2 | `logs/mut-v200-ui3-snapshot-keeps-old-save@resume.log` |
| 80 | `mut-v200-ui3-check-ls-dest-only@resume` | 2026-10-13 04:28:02 | 1 | 115.7 | `logs/mut-v200-ui3-check-ls-dest-only@resume.log` |
| 81 | `dropdowns-visible@mut-vR-dock-menu-cut@resume` | 2026-10-13 04:28:12 | 0 | 181.2 | `logs/dropdowns-visible@mut-vR-dock-menu-cut@resume.log` |
| 82 | `mut-v200-ui3-check-added-dest-only@resume` | 2026-10-13 04:29:47 | 1 | 138.4 | `logs/mut-v200-ui3-check-added-dest-only@resume.log` |
| 83 | `mut-v200-ui3-lastedit-year-first@resume` | 2026-10-13 04:29:58 | 1 | 136.3 | `logs/mut-v200-ui3-lastedit-year-first@resume.log` |
| 84 | `dropdowns-visible@mut-vR-room-no-dock@resume` | 2026-10-13 04:31:13 | 1 | 160.9 | `logs/dropdowns-visible@mut-vR-room-no-dock@resume.log` |
| 85 | `mut-v200-ui3-lastedit-services-only@resume` | 2026-10-13 04:32:06 | 1 | 140.4 | `logs/mut-v200-ui3-lastedit-services-only@resume.log` |
| 86 | `mut-v200-ui3-lastedit-writer-wide@resume` | 2026-10-13 04:32:14 | 1 | 139.6 | `logs/mut-v200-ui3-lastedit-writer-wide@resume.log` |
| 87 | `mut-v200-ui3-lastedit-removed-wide@resume` | 2026-10-13 04:34:26 | 1 | 190.8 | `logs/mut-v200-ui3-lastedit-removed-wide@resume.log` |
| 88 | `mut-v200-ui3-dry-marks-unsaved@resume` | 2026-10-13 04:34:34 | 1 | 191.9 | `logs/mut-v200-ui3-dry-marks-unsaved@resume.log` |
| 89 | `layout-fits@mut-fx-docked-rows-wide@resume` | 2026-10-13 04:33:54 | 1 | 268.7 | `logs/layout-fits@mut-fx-docked-rows-wide@resume.log` |
| 90 | `mut-v200-ui3-dry-writes-journal@resume` | 2026-10-13 04:37:37 | 1 | 268.1 | `logs/mut-v200-ui3-dry-writes-journal@resume.log` |
| 91 | `mut-v200-ui3-dry-writes-storage@resume` | 2026-10-13 04:37:46 | 1 | 290.0 | `logs/mut-v200-ui3-dry-writes-storage@resume.log` |
| 92 | `layout-fits@mut-fx-docked-note-cut@resume` | 2026-10-13 04:38:22 | 1 | 314.9 | `logs/layout-fits@mut-fx-docked-note-cut@resume.log` |
| 93 | `mut-v200-ui3-dry-folds-dest@resume` | 2026-10-13 04:42:05 | 1 | 257.1 | `logs/mut-v200-ui3-dry-folds-dest@resume.log` |
| 94 | `lane-MA2` | 2026-10-13 04:16:16 | 0 | 1806.6 | `logs/lane-MA2.log` |
| 95 | `mut-vS2b-removed-len1@resume` | 2026-10-13 04:42:36 | 1 | 229.2 | `logs/mut-vS2b-removed-len1@resume.log` |
| 96 | `lane-MB2` | 2026-10-13 04:16:17 | 0 | 1808.2 | `logs/lane-MB2.log` |
| 97 | `dropdowns-visible@mut-fx-docked-rowmenu-clipped@resume` | 2026-10-13 04:43:37 | 1 | 198.2 | `logs/dropdowns-visible@mut-fx-docked-rowmenu-clipped@resume.log` |
| | BRDONE BR2 04:46:56 EDT | | | | |
| 98 | `lane-BR2` | 2026-10-13 04:16:18 | 0 | 1837.8 | `logs/lane-BR2.log` |
| | # br3 starts after BRDONE BR2: 2026-10-13 04:46:57 EDT | | | | |
| 99 | `layout-fits@mut-vR-dock-narrowed-1600@resume` | 2026-10-13 04:46:57 | 1 | 253.2 | `logs/layout-fits@mut-vR-dock-narrowed-1600@resume.log` |
| 100 | `dropdowns-visible@mut-vR-dock-narrowed-1600@resume` | 2026-10-13 04:51:10 | 1 | 189.5 | `logs/dropdowns-visible@mut-vR-dock-narrowed-1600@resume.log` |
| 101 | `keyboard-reach@mut-vR-dock-narrowed-1600@resume` | 2026-10-13 04:54:20 | 1 | 64.9 | `logs/keyboard-reach@mut-vR-dock-narrowed-1600@resume.log` |
| 102 | `dropdowns-visible@mut-vR-docked-rowmenu-clipped-narrow@resume` | 2026-10-13 04:55:25 | 0 | 227.2 | `logs/dropdowns-visible@mut-vR-docked-rowmenu-clipped-narrow@resume.log` |
| | BRDONE BR3 04:59:12 EDT | | | | |
| 103 | `toolbar-fits-7a71245@mut-vR-save-right-covered@resume` | 2026-10-13 04:59:12 | 1 | 41.0 | `logs/toolbar-fits-7a71245@mut-vR-save-right-covered@resume.log` |
| 104 | `rowmenu-probe-r2` | 2026-10-13 04:59:53 | 1 | 0.5 | `logs/rowmenu-probe-r2.log` |
| | BR3-DONE 2026-10-13 04:59:53 EDT | | | | |
| 105 | `lane-BR3` | 2026-10-13 04:24:56 | 0 | 2097.4 | `logs/lane-BR3.log` |
| 106 | `dockreload2@final` | 2026-10-13 05:00:12 | 0 | 49.6 | `logs/dockreload2@final.log` |
| | BR4-DONE 2026-10-13 05:01:02 EDT | | | | |
| 107 | `lane-BR4` | 2026-10-13 04:26:30 | 0 | 2071.2 | `logs/lane-BR4.log` |
| 108 | `rowmenu-probe-r2b` | 2026-10-13 05:01:14 | 0 | 177.4 | `logs/rowmenu-probe-r2b.log` |

### PIDs (`pids.txt`: the `timeout` PID first, then its children as read from /proc 0.4 s after the start)

| timeout PID | children | run | start (ET) |
|---|---|---|---|
| 6008 | 6010 6014 | `buildmut37` | 2026-10-13 00:27:17 |
| 6282 | 6284 | `mcount-on-final` | 2026-10-13 00:27:35 |
| 6325 | 6327 | `mcount-on-b-670c467` | 2026-10-13 00:27:38 |
| 6380 | 6382 | `mcount-on-b-f95fee2` | 2026-10-13 00:27:41 |
| 6459 | 6461 | `mcount-on-b-4a6f7c7` | 2026-10-13 00:27:43 |
| 6956 | 6958 6959 6962 | `lane-G` | 2026-10-13 00:28:11 |
| 6962 | 6964 6963 | `grid-chain@dd15956` | 2026-10-13 00:28:11 |
| 6975 | 6977 | `lane-J` | 2026-10-13 00:28:11 |
| 6981 | 6978 6981 6983 7109 7110 | `audit-ui@dd15956` | 2026-10-13 00:28:11 |
| 7001 | 7003 7005 | `lane-MA` | 2026-10-13 00:28:11 |
| 7009 | 7009 7011 7162 | `mut-v200-ui3-lastedit-removed-ignored` | 2026-10-13 00:28:11 |
| 7032 | 7044 7048 | `lane-MB` | 2026-10-13 00:28:11 |
| 7080 | 7082 7080 7205 | `mut-v200-ui3-lastedit-whole-year-ignored` | 2026-10-13 00:28:11 |
| 7443 | — | `grid-chrome@dd15956` | 2026-10-13 00:28:18 |
| 7468 | 7470 | `grid-row-controls@dd15956` | 2026-10-13 00:28:19 |
| 7683 | 7685 | `grid-inspector-agrees@dd15956` | 2026-10-13 00:28:25 |
| 7969 | 7971 | `grid-toolbar-fits@dd15956` | 2026-10-13 00:28:38 |
| 8842 | 8848 | `grid-editors-reachable@dd15956` | 2026-10-13 00:29:08 |
| 11510 | 11512 | `grid-colour-check@dd15956` | 2026-10-13 00:30:32 |
| 11773 | 11775 | `mymut2` | 2026-10-13 00:30:43 |
| 12154 | 12156 | `grid-menu-paths@dd15956` | 2026-10-13 00:30:54 |
| 12661 | 12663 | `grid-panels-render@dd15956` | 2026-10-13 00:31:09 |
| 13382 | 13384 | `grid-fydp-frames@dd15956` | 2026-10-13 00:31:34 |
| 13617 | 13621 | `grid-hostile-render@dd15956` | 2026-10-13 00:31:41 |
| 13775 | 13778 13779 13798 | `lane-P` | 2026-10-13 00:31:45 |
| 13798 | 13801 13799 | `pres-rv-smoke@final` | 2026-10-13 00:31:45 |
| 14363 | 14365 | `mut-v200-ui3-lastedit-no-year-filter` | 2026-10-13 00:32:06 |
| 14413 | 14415 | `audit-ui-count@dd15956` | 2026-10-13 00:32:12 |
| 14483 | 14485 | `mut-v200-ui3-asks-loaded` | 2026-10-13 00:32:13 |
| 14704 | 14706 | `pres-rv2-probe@final` | 2026-10-13 00:32:23 |
| 14888 | 14890 | `grid-layout-fits@dd15956` | 2026-10-13 00:32:37 |
| 16907 | 16910 | `pres-rv2-m1@final` | 2026-10-13 00:33:45 |
| 17230 | 17232 | `pres-openwrites@final` | 2026-10-13 00:33:53 |
| 17291 | 17295 17299 | `lane-BR` | 2026-10-13 00:33:54 |
| 17465 | 17467 17483 | `lane-MY` | 2026-10-13 00:34:00 |
| 20493 | 20495 | `mut-v200-ui3-no-putback` | 2026-10-13 00:35:56 |
| 20538 | 20540 | `audit-ui-count-on-670c467` | 2026-10-13 00:35:57 |
| 20621 | 20623 | `mut-v200-ui3-dry-asks-unheard` | 2026-10-13 00:36:08 |
| 21524 | 21526 | `grid-keyboard-reach@dd15956` | 2026-10-13 00:37:24 |
| 22621 | 22623 | `grid-dropdowns-visible@dd15956` | 2026-10-13 00:38:32 |
| 23534 | 23536 | `mut-v200-ui3-putback-dest-copy` | 2026-10-13 00:40:04 |
| 23583 | 23585 | `audit-ui-count-on-f95fee2` | 2026-10-13 00:40:07 |
| 23695 | 23697 | `mut-v200-ui3-putback-no-dest` | 2026-10-13 00:40:19 |
| 24583 | 24585 | `grid-dialogs-keyboard@dd15956` | 2026-10-13 00:41:46 |
| 25595 | 25597 | `mut-v200-ui3-putback-no-save-state` | 2026-10-13 00:43:20 |
| 25741 | 25743 | `boot-same@dd15956` | 2026-10-13 00:43:25 |
| 25894 | 25896 | `mut-v200-ui3-putback-no-storage` | 2026-10-13 00:43:45 |
| 26063 | 26065 | `audit-other@dd15956` | 2026-10-13 00:43:57 |
| 26727 | 26729 | `audit@dd15956` | 2026-10-13 00:45:01 |
| 26854 | 26856 | `dockclick@final` | 2026-10-13 00:45:09 |
| 26957 | 26959 | `layout-fits@mut-fx-dock-ignored` | 2026-10-13 00:45:15 |
| 27121 | 27123 | `audit-recon@dd15956` | 2026-10-13 00:45:21 |
| 29618 | 29620 | `dockreload@final` | 2026-10-13 00:46:47 |
| 30295 | 30297 | `mut-v200-ui3-pick-lost` | 2026-10-13 00:47:12 |
| 30403 | 30406 | `dockclick@final-2` | 2026-10-13 00:47:14 |
| 30751 | 30753 | `mut-v200-ui3-putback-writes-all` | 2026-10-13 00:47:27 |
| 31818 | 31820 31842 | `check@clone-dd15956` | 2026-10-13 00:48:26 |
| 31911 | 31913 31920 | `check@copy-dd15956` | 2026-10-13 00:48:33 |
| 32018 | 32020 | `mut-vS2b-created-only` | 2026-10-13 00:48:41 |
| 768 | 770 | `layout-fits@mut-vR-room-no-dock` | 2026-10-13 00:49:56 |
| 1212 | 1214 | `mut-v200-ui3-check-blind-storage` | 2026-10-13 00:50:13 |
| 1285 | 1287 | `mut-v200-ui3-claim-unchecked` | 2026-10-13 00:50:14 |
| 1884 | 1886 | `mut-vS2b-removed-same-id` | 2026-10-13 00:50:42 |
| 2959 | 2961 | `mut-v200-ui3-snapshot-before-reads` | 2026-10-13 00:51:42 |
| 3014 | 3016 | `mut-v200-ui3-putback-shallow-dest` | 2026-10-13 00:51:43 |
| 3167 | 3169 | `mut-vS2b-removed-len1` | 2026-10-13 00:52:16 |
| 3324 | 3326 | `mut-v200-ui3-check-blind-dest` | 2026-10-13 00:53:13 |
| 3357 | 3359 | `mut-v200-ui3-check-blind-plan` | 2026-10-13 00:53:14 |
| 3496 | 3498 | `dropdowns-visible@mut-fx-dock-ignored` | 2026-10-13 00:53:44 |
| 3570 | 3572 3574 | `lane-MA2` | 2026-10-13 04:16:16 |
| 3577 | 3577 3579 | `mut-v200-ui3-check-blind-dest@resume` | 2026-10-13 04:16:16 |
| 3627 | 3629 | `lane-MB2` | 2026-10-13 04:16:17 |
| 3634 | 3631 3636 3634 3662 | `mut-v200-ui3-check-blind-plan@resume` | 2026-10-13 04:16:17 |
| 3689 | 3691 3692 | `lane-BR2` | 2026-10-13 04:16:18 |
| 3696 | 3693 3698 3696 3729 | `dropdowns-visible@mut-fx-dock-ignored@resume` | 2026-10-13 04:16:18 |
| 5334 | 5336 | `mut-v200-ui3-check-blind-save@resume` | 2026-10-13 04:17:45 |
| 5387 | 5389 | `mut-v200-ui3-check-blind-review@resume` | 2026-10-13 04:17:48 |
| 6367 | 6369 | `dialogs-keyboard@mut-fx-dock-ignored@resume` | 2026-10-13 04:19:26 |
| 6594 | 6596 | `mut-v200-ui3-check-blind-added-keys@resume` | 2026-10-13 04:19:41 |
| 6665 | 6667 | `mut-v200-ui3-putback-dest-key-only@resume` | 2026-10-13 04:19:45 |
| 8259 | 8264 | `mut-v200-ui3-early-measured-before-reads@resume` | 2026-10-13 04:22:17 |
| 8395 | 8397 | `mut-v200-ui3-partway-before-run@resume` | 2026-10-13 04:22:24 |
| 8627 | 8629 | `dialogs-keyboard@mut-vR-dock-focus-lost@resume` | 2026-10-13 04:22:34 |
| 10170 | 10172 | `mymut3` | 2026-10-13 04:24:27 |
| 10237 | 10239 | `mut-v200-ui3-wrote-anyones@resume` | 2026-10-13 04:24:32 |
| 10441 | 10443 | `mut-v200-ui3-reads-same-list@resume` | 2026-10-13 04:24:53 |
| 10480 | 10482 10484 | `lane-BR3` | 2026-10-13 04:24:56 |
| 10972 | 10974 | `keyboard-reach@mut-fx-dock-ignored@resume` | 2026-10-13 04:25:39 |
| 11609 | 11611 11613 | `lane-BR4` | 2026-10-13 04:26:30 |
| 13063 | 13065 | `toolbar-fits@mut-vR-save-right-covered@resume` | 2026-10-13 04:27:12 |
| 13750 | 13752 | `toolbar-fits@mut-fx-hdr-under-sidebar-60@resume` | 2026-10-13 04:27:42 |
| 13929 | 13931 | `mut-v200-ui3-snapshot-keeps-old-save@resume` | 2026-10-13 04:27:46 |
| 14315 | 14317 | `mut-v200-ui3-check-ls-dest-only@resume` | 2026-10-13 04:28:02 |
| 14505 | 14507 | `dropdowns-visible@mut-vR-dock-menu-cut@resume` | 2026-10-13 04:28:12 |
| 15601 | 15603 | `mut-v200-ui3-check-added-dest-only@resume` | 2026-10-13 04:29:47 |
| 15688 | 15690 | `mut-v200-ui3-lastedit-year-first@resume` | 2026-10-13 04:29:58 |
| 16465 | 16467 | `dropdowns-visible@mut-vR-room-no-dock@resume` | 2026-10-13 04:31:13 |
| 17185 | 17187 | `mut-v200-ui3-lastedit-services-only@resume` | 2026-10-13 04:32:06 |
| 17291 | 17293 | `mut-v200-ui3-lastedit-writer-wide@resume` | 2026-10-13 04:32:14 |
| 18319 | 18321 | `layout-fits@mut-fx-docked-rows-wide@resume` | 2026-10-13 04:33:54 |
| 19078 | 19080 | `mut-v200-ui3-lastedit-removed-wide@resume` | 2026-10-13 04:34:26 |
| 19244 | 19246 | `mut-v200-ui3-dry-marks-unsaved@resume` | 2026-10-13 04:34:34 |
| 21928 | 21930 | `mut-v200-ui3-dry-writes-journal@resume` | 2026-10-13 04:37:37 |
| 21985 | 21987 | `mut-v200-ui3-dry-writes-storage@resume` | 2026-10-13 04:37:46 |
| 22508 | 22510 | `layout-fits@mut-fx-docked-note-cut@resume` | 2026-10-13 04:38:22 |
| 26241 | 26243 | `mut-v200-ui3-dry-folds-dest@resume` | 2026-10-13 04:42:05 |
| 26413 | 26415 | `mut-vS2b-removed-len1@resume` | 2026-10-13 04:42:36 |
| 27235 | 27237 | `dropdowns-visible@mut-fx-docked-rowmenu-clipped@resume` | 2026-10-13 04:43:37 |
| 29078 | 29080 | `layout-fits@mut-vR-dock-narrowed-1600@resume` | 2026-10-13 04:46:57 |
| 1152 | 1154 | `dropdowns-visible@mut-vR-dock-narrowed-1600@resume` | 2026-10-13 04:51:10 |
| 2928 | 2930 | `keyboard-reach@mut-vR-dock-narrowed-1600@resume` | 2026-10-13 04:54:20 |
| 4680 | 4684 | `dropdowns-visible@mut-vR-docked-rowmenu-clipped-narrow@resume` | 2026-10-13 04:55:25 |
| 12477 | 12482 | `toolbar-fits-7a71245@mut-vR-save-right-covered@resume` | 2026-10-13 04:59:12 |
| 13971 | 13973 | `rowmenu-probe-r2` | 2026-10-13 04:59:53 |
| 14598 | 14600 | `dockreload2@final` | 2026-10-13 05:00:12 |
| 15756 | 15762 | `rowmenu-probe-r2b` | 2026-10-13 05:01:14 |

The table run itself (`tables`, 05:05:50, exit 0, 0.5 s) and anything after it are in `runs.txt` and `pids.txt` only. One PID in my list, 14507 (the node child of `dropdowns-visible@mut-vR-dock-menu-cut@resume`, which ended at 04:31:13), has since been given by the system to another session's process (`timeout … env SUITE_CHECKS=…`); I left it alone. Every run of mine had finished by 05:04 ET. PIDs from before the restart (the first attempt, above the resume line) belong to a machine that has since restarted.
