# U20 on the committed head 63bd8b0: a save waiting for another tab's Web Lock (lock-wait probe with controls)

**Verdict: REPRODUCED, on one of the three routes tried.** Board `98eed7e8`. Every run was bounded. Each pass gave
identical results, twice.

**The mechanism is confirmed, in jsdom and in real Chromium.** While tab B's save waits for tab A's `orbit-save` lock,
B's `_saveBusy` is 0. U2's ↶ Put back refusal does not fire, and neither do U13's two guards. Whether that loses anything
depends on what happens during the wait:

| during the wait, in B | outcome on `98eed7e8` | U20 harm? |
|---|---|---|
| (i) ↶ Put back of kept work (folder and file) | The put back goes ahead. B's save then refuses with the choice (folder) or asks HOLD ON (file). That is the same as ↶ Put back followed by 💾 Save with no other tab. | **No.** Not falsely clean, nothing written over unasked, every copy reachable. |
| (ii) a refresh that adopts a newer folder copy | The adoption goes ahead and B's unsaved work is kept aside. B's save then writes the adopted copy back unchanged and records it clean, consistently. That is the same as refresh then Save with no other tab. | **No** (nothing lost, record consistent). Message caveat: observation O2. |
| (ii-b) a refresh that **records** the folder's copy as the one the work came from (U13's other guard: nothing recorded yet, and the folder copy not newer) | B's save writes B-EDIT over the folder's copy F0 **without asking**. The counted control asks. When the folder already has a history copy kept less than ten minutes earlier, F0 is kept only as a `-recent` copy, and **B's next Save prunes it: F0 ends in no copy the board can reach.** | **Yes.** Writes over a copy without asking, attributable to the uncounted wait. A P1 shape on the history variant. |

## Route (ii-b) in detail (REPRODUCED)

Scenarios BR-W, BR-Wtick, BR-Wperm, BR-Wh and BR-Wpermh all write without asking, in r1 and r2. With history
(BR-Wh, BR-Wpermh), F0-BASE is in no copy after the next Save and after a reopen.

**Their controls are healthy** (BR-C1, BR-C1perm and BR-C1h, plus the first Save in BR-C2b and BR-C2bh). B's save running
and counted, or simply not waiting, leaves the record alone, refuses with "Nothing was written", and offers Load theirs or
Save yours over theirs.

**The most realistic route is BR-Wperm(h).**
- This browser has no record of the folder for O&M FY27. It is using the folder through another appropriation's tab, A.
- The folder's edit permission was not kept, so B's opening stopped at "one click".
- Alice presses 💾 Save in B while A's save is writing. Then she presses the bar's Connect.
- Connect's refresh records F0, and the waiting save writes over it.

**This loss path also exists without U20.** With one tab and no lock, a refresh that comes before the first Save (BR-C2a,
BR-C2ah) does exactly the same thing, unasked, and with the same pruning. It is the v1.89 "taken as the base, as it always
was" behaviour (observation O4).
- U20 extends that path to a Save the user pressed **before** the refresh, which the U13 guard is meant to protect.
- The correction proposed in `PROPOSAL.md` closes the U20 part only.

## What was and was not touched

This was reproduction and measurement only. Nothing in `/home/user/orbit-board` or `/home/user/orbit-ui` was edited,
staged, committed or pushed.
- **orbit-board** at 10:58 AM ET: HEAD `97ce86e` (records commits after `63bd8b0`), working tree clean.
  `HEAD:prioritization-board-grid.html` = `63bd8b0:…` = `98eed7e8`, the empty template.
- **orbit-ui** at 10:58 AM ET showed ` M tools/export-audit/audit-ui.mjs`, ` M tools/export-audit/mutate.mjs` and
  `?? node_modules`. None of these were written by this probe: its only contact with orbit-ui was that one `git status`.
  They are presumably the separate UI fix-round session's work in progress. This is reported, not investigated.
- `mutate.mjs` was never imported, executed or read. `playwright install` was never run. Chromium was
  `/opt/pw-browsers/chromium`.

**Timing.** Work in this directory ran from 10:26 AM ET on Mon 12 Oct 2026 (by `TZ=America/New_York date`). The last
bounded command in `logs/runs-small.txt` started at 10:59:45 AM ET, and this README was finalised at 11:02 AM ET. **No earlier U20 attempt existed:** there was no `u20` directory, so nothing was resumed and every run here
is new.

## Identities

| item | blob / commit |
|---|---|
| board under test, `b63/prioritization-board-grid.html` (a `cp -a` of `../base`) | `98eed7e801af20270f755eadffb2fa72355c30e5` |
| `../base/prioritization-board-grid.html` (read only) = `63bd8b0:` = orbit-board `HEAD:` | `98eed7e8…` (same) |
| `b63/tools/export-audit/boot.mjs` | `9c4f49ad8cec537097bdf485458cfd2a09b06594` |
| `b63/runtime-encoding-shim.mjs` | `6e2ce2e6beda9e7526527530500f254d877d0320` |
| `b63/tools/chrome.mjs` / `b63/package.json` | `d0fbdb8a…` / `7cf8186f…` |
| `u20probe.mjs`: the probe; every r1/r2 run printed this blob as `IDS.probe` | `677d6f3f02d7c7700d92b1cebe6d391e8099bd00` |
| `locks-mock.mjs`: the Web Locks mock; every run printed it as `IDS.mock` | `cee3b4700fad43ddd1d2e01f062f7d4d89a0d011` |
| `locktest.mjs`: the mock's own tests (control 3, part 1) | `bb670f12cb5da6612727244253b85c5c53901d09` |
| `chromium-locks.mjs`: the mock against real Chromium, and U20's premise in real tabs | `f325c6eac007522fa9ec90a72df6c40d5ee6b3ff` |
| `check.mjs`: the hand-written expected literals (after the 10:48 correction, see Deviations) | `11472aafbfb9fba9daa5fd8d0ed11a843a81801a` |
| `run.sh` / `q.sh` (bounded runners) | `87cded93…` / `07ff6a04…` |
| `src/show.mjs` / `src/table.mjs` / `src/explore.mjs` (readers; feasibility only) | `1d94a336…` / `7bedffc6…` / `7a9e8e06…` |
| jsdom (resolved through `b63/node_modules` → `/home/user/orbit-board/node_modules`) | 27.4.0 |
| `PROPOSAL.md` / `proposal/U20-count-waiting-save.diff` / `proposal/patched-copy-NEVER-RUN/…html` | `a145590a…` / `b3a5ff25…` / `b00af156…` |

Each probe run asserted that `BOARD` was unset and that boot.mjs's `BOARD` was `b63`'s own board. `run.sh` exports
`TZ=America/New_York`.

## Method

### The tabs: one browser profile, Alice, writer key `a000…2`

- **A** is a second tab on **FULL FUND** (`prio27ff`, folder copy `spmt-2027-ff.json`).
  - It is opened from B's storage and seeded with one requirement.
  - Its 💾 Save is held at the close of its write, so **A holds `orbit-save`**.
  - Because A is on another appropriation, its storage keys and folder file are disjoint from B's. That leaves only three
    things shared with B: the lock, the global preferences, and the folder itself. A's boot added two keys,
    `prio27appn` = FULL FUND and `prio27destdb`; every reopen below therefore opens O&M explicitly.
- **B** is the O&M tab under test.
- **X** is Alice's other machine. It has its own storage and its own lock manager, and it writes the folder copies the
  fixtures need.
- **C** is the reopen at the end: this browser's storage as A and B left it (both closed), and the same folder.

### What the tabs share

- **One storage area, live.** jsdom gives each window its own `localStorage`. The probe points B's and A's Storage
  implementations at one `Map` (jsdom's `Storage-impl._items`, reached through `jsdom/lib/jsdom/living/generated/utils.js`).
  - A's boot-time writes are merged into the shared Map first, because they happened last.
  - Every scenario checks that a write in A is read in B, and that a removal in B is seen by A (`tabA.share` =
    `["from A", null]`).
  - The board has no `storage` event listener (grep: none), so no events are needed.
- **One folder.** This is W1H's folder mock with two harness-only additions. Every operation is tagged with the tab that
  made it (each tab gets its own handle on the one folder). There are also one-shot holds keyed by `{tag, op, path}` and a
  shared permission state (`fold.perm`, used only by the `perm` variants).
- **One Web Locks manager**, below.

### Steps under test

These go through the page's own controls:
- the toolbar's 💾 Save (`#saveBtn` → `saveInPlace` → `saveSerial`);
- the header's ↶ (`#saveState .keptbtn` → `keptPutBack`);
- the status line's buttons;
- the bar's Connect (`driveConnectNow`), `driveStorePull(false)`, and `liveTick()`.

`window.confirm` records every question and answers OK. The file routes answer the HOLD ON question with Cancel.

### Expected values

`check.mjs` holds hand-written literals and reads only the probe's JSON. "Writes over a copy without asking" is decided
from each fixture's hand-written **lineage**. For example, S1 is typed on top of N, so writing S1 over N needs no question,
but writing K (which came from F0) over N does. "Every copy reachable" is checked for the **leaf** copies: screen, browser
storage, kept slot, the folder's copy or its history, or the file. Ancestors that a later edit replaced are not required.

## Routes and scenarios

**Naming.** W is the U20 trigger. C1 is the counted control: B's save is already running in B, held at its read of the
folder's copy (or the file), before it has captured anything. C2a and C2b have no lock contention (ordinary behaviour).

| route | fixture (literal notes on requirement A) | W | controls |
|---|---|---|---|
| **PB**: ↶ Put back, folder (u2variants/u19 R-folder) | F0 saved; K typed; X saves N; B's Save refused; Load theirs keeps K aside (why `folder`); S1 typed, unsaved | **PB-W**: A holds; B 💾 Save waits; ↶ Put back; A released. **PB-Wtick**: the waiting save is B's Live autosave | **PB-C1**; **PB-C2a** (put back, then Save); **PB-C2b** (Save lands, then put back); **PB-NL** (harness check: no `navigator.locks` at all) |
| **AD**: a refresh that adopts | F0 saved by B's earlier session; WORKING typed; B reopened (DIRTY false, record unsaved), harness connect | **AD-W**: A holds; B 💾 Save waits; X saves N2; `driveStorePull(false)`; A released. **AD-Wtick**: the refresh is `liveTick()` (Live and autosave on) | **AD-C1**; **AD-C2a** (refresh, then Save); **AD-C2b** (Save lands; X's N2 then refused at X) |
| **BR**: a refresh that records the base | X saves F0 into an empty folder; B opens the board file in a browser with no record for O&M FY27 and types B-EDIT; F0 not newer than the screen | **BR-W**. **BR-Wtick**: a second Live tick while the first tick's autosave waits. **BR-Wperm**: edit permission not kept, the opening stopped at one click, the refresh is the bar's Connect. **BR-Wh** and **BR-Wpermh**: X saved F00-FIRST then F0, so a spaced history copy is under ten minutes old | **BR-C1**, **BR-C1perm**, **BR-C1h**; **BR-C2b**/**BR-C2bh** (Save first). **Not controls:** BR-C2a/BR-C2ah (refresh first, then Save), the pre-existing path |
| **PF**: ↶ Put back, board file (u19 R-file) | K kept aside (why `file`); N in the file; S1 typed | **PF-W** (A's held save is still its FULL FUND folder save) | **PF-C1**; **PF-C2a** |

Each scenario ends with **the next 💾 Save** (no contention) and **a reopen**:
- the reopen is C: this browser's storage, the harness connect, then `driveStorePull(true)`;
- the file route reopens from the file.

## How faithful the lock mock is (`locks-mock.mjs`)

**Modelled, per the Web Locks API spec:**
- `request(name, cb)` and `request(name, options, cb)`;
- `mode` exclusive (the default) or shared, and `ifAvailable`;
- one manager per browser profile, shared by every tab;
- **strict FIFO per name**: a request is grantable only at the head of its queue;
- grants processed from the head;
- the callback run **in a later task of the requesting window** (that window's `setTimeout 0`), never inside `request()`;
- the lock held until the callback's result settles, then released, and only then does `request()`'s promise settle with
  that result or rejection;
- that promise made in the requesting window's realm;
- `query()`;
- a closing tab drops its pending requests and releases its locks;
- the spec's argument errors (a `-` name, no callback, a bad mode) reject.

**Not modelled:**
- `steal` and `signal`. They are **rejected and counted**, not ignored: `stats.unmodeled` was 0 in every run, because the
  board calls `request('orbit-save', {mode:'exclusive'}, go)` only.
- Separate processes. All tabs share one Node event loop, so the interleaving is at awaits and timers, not true
  parallelism.
- Storage buckets and partitioning, workers, the spec's exact task source, and InvalidStateError for a document that is
  not fully active.

**Control 3 ("never held twice") was checked three ways:**
1. **The mock's own tests** (`locktest.mjs`): 19/19 in r1 and in r2. They cover exclusive FIFO across three tabs, a
   rejection and a throw releasing the lock, release before settle, independent names, ifAvailable, shared then exclusive,
   `query`/close, unmodeled options refused, and a 300-request stress test with seeded random holds.
2. **The mock's instrumentation in every probe run.** At each grant it checks the held set. In the 50 r1/r2 runs that use
   the mock: 0 violations, `maxHeld['orbit-save']` = 1, nothing unmodeled, and every grant released. PB-NL's 2 runs use no
   mock and made 0 requests, as intended.
3. **The same API sequences in real Chromium** (`chromium-locks.mjs` part 1, three tabs of one origin, served at
   `https://orbit.invalid` by request interception): T1, T2, T6 and T7 gave **the same hand-written expected values as the
   mock** (r1 and r2).
   - **T4 (release before settle) was not compared.** It cannot be observed across real tabs; that ordering is the mock's
     reading of the spec.
   - **Real Chromium was not used for the folder routes**, which would need the File System Access API. jsdom plus the mock
     covers those.

## U20's premise in real Chromium (`chromium-locks.mjs` part 2, the board itself in two tabs)

| check | expected (literal) | r1 | r2 |
|---|---|---|---|
| W: tab A's `saveSerial` holds `orbit-save`; tab B's waits: [B `_saveBusy`, B's function ran, held, pending, A `_saveBusy`] | [0, false, 1, 1, 1] | same | same |
| W: ↶ Put back in B while its save waits (work kept aside by `keepAside`, confirm answers Cancel): [refused, asked] | {refused: false, asked: 1} | same | same |
| W: A released, so B's save ran (counted inside, 1) and then nothing was under way (0) | [true, 1, 0] | same | same |
| C1: B's own save running, a second save queued in B: [B `_saveBusy`, second ran] | [1, false] | same | same |
| C1: ↶ Put back while B's own save runs: [refused, asked] | {refused: true, asked: 0} | same | same |
| C2: no contention: B's save runs at once; ↶ Put back then asks, not refused | [true, 0] / {refused: false, asked: 1} | same | same |

In total `chromium-locks` passed 19/19 in r1 and 19/19 in r2. The dev run at 10:55 failed one check, a harness error: the
put-back helper read a stale "Not put back" line left by the previous call. It was fixed by blanking the status line before
each call (harness only), and is not evidence.

## Runs

Each run below was `setsid -w timeout -k 10 600 …` through `run.sh` (probe runs) or `q.sh` (everything else), after checking
for `AUDIT_IMPORT_RUNNING`. That file was never present, so no run waited. Exit 0 throughout unless stated. All times are
**EDT**, on Mon 12 Oct 2026.

| label | start (EDT) | exit | wall s |
|---|---|---|---|
| copy-base, ids (cp -a of `../base`, hashes) | 10:26:17 | 0, 0 | 0.03, 0.03 |
| explore1 (feasibility: storage sharing, `navigator.locks` absent, a FULL FUND tab) | 10:26:34 | 0 | 2.5 |
| locktest-dev / locktest-dev2 | 10:30:23 / 10:30:52 | **1** / 0 | 1.3 / 1.5 |
| dev-PB-W … dev2-BR-C2bh: 27 development runs, not evidence | 10:34:51 – 10:41:13 | 0, except `dev-BR-C2ah` **1** (the scenario was not yet in the list) | 3.8 – 11.3 |
| **locktest-r1** | 10:43:34 | 0 | 2.2 |
| **r1-PB-W … r1-PF-C2a** (26 runs, one at a time) | 10:43:37 – 10:47:30 | 0 (all 26) | 6.5 – 12.6 |
| check-r1 (first, before the AD-C2b correction; superseded) | 10:47:42 | 0 | 0.1 |
| **locktest-r2** | 10:48:05 | 0 | 1.4 |
| **r2-PB-W … r2-PF-C2a** (26 runs) | 10:48:07 – 10:52:13 | 0 (all 26) | 4.9 – 12.5 |
| **check-r1, check-r2** (the corrected `check.mjs`) | 10:52:23 | 0, 0 | 0.2, 0.3 |
| table (r1 vs r2) | 10:52:44 | 0 | 0.2 |
| chromium-dev (superseded, see above) | 10:55:46 | **1** | 8.2 |
| **chromium-r1 / chromium-r2** | 10:56:22 / 10:56:32 | 0 / 0 | 9.9 / 9.7 |
| mk-proposal, cp-proposal, chmod-proposal, mkdiff (`diff` exits 1 when files differ), ids2 | 10:56:49 – 10:57:32 | 0, 0, 0, 1, 0 | ≤ 8.9 |
| ids-all, probe-ids, gs-board, head-board, board-at-head, gs-ui, extract, ls-final, hash-proposal | 10:57:49 – 10:59:45 | 0 | ≤ 9.4 |

- **Full per-run lines:** `logs/runs.txt` (probe runs) and `logs/runs-small.txt` (all others).
- **No run timed out**, and none was killed.

## PIDs

`pids.txt` lists the PID of every `timeout` process and of its child, with the ET time, the process name and the full
command. At the last count (11:02 AM ET) it covered 108 `timeout` processes. It runs to 263 lines because one multi-line
`node -e` command, `extract`, spans several lines. A child shows as `gone` when it ended before `ps` looked; there were 30 of
those.

- **Nothing was killed by this probe.** Every process ended on its own.
- Chromium's own processes were children of the node process in the same `setsid` group, closed by `browser.close()`.

## Expected vs observed

**Totals.** In both passes, `out/checks.r1.json` and `out/checks.r2.json` hold 369 checks: 354 pass, 15 fail. The failing
set is the same in both, and `logs/check-r1.log` is byte-identical to `logs/check-r2.log`. `src/table.mjs` found r1 and r2
identical for all 26 scenarios, setting aside the digits in times.

| kind | what it checks | pass | fail |
|---|---|---|---|
| RUN | finished, no error, board `98eed7e8` | 26 | 0 |
| LCK | mock never held twice, nothing unmodeled, every grant released; locktest 19/19 | 27 | 0 |
| FIX | each fixture's starting state, tab A's identity and the shared storage | 60 | 0 |
| PRE | U20's premise at the action: B `_saveBusy` 0, A's 1, held by A, B pending, no B operation yet; grants A then B. In C1: B 1, held by B, at its read | 36 | 0 |
| CTL | the healthy controls behave correctly | 109 | **0** |
| U20 | the property on the trigger scenarios | 68 | **9** |
| OUT | the same properties on the pre-existing path (refresh before Save, one tab) | 20 | **6** |
| INFO | PB-NL properties (harness check) | 8 | 0 |

**The 9 failing U20 checks** (identical in r1 and r2; hand-written expected values in brackets):

| scenario | step | check | expected | observed |
|---|---|---|---|---|
| BR-W | B's save | did not write over a copy without asking | false | **true** (F0-BASE → B-EDIT, 0 questions, no refusal) |
| BR-Wtick | B's save | same | false | **true** |
| BR-Wperm | B's save | same | false | **true** |
| BR-Wh | B's save | same | false | **true** |
| BR-Wh | the next Save | every leaf copy reachable [B-EDIT, F0-BASE] | [true, true] | **[true, false]** (history: `F00-FIRST`, `…-recent.json=B-EDIT`; F0-BASE's `-recent` copy pruned) |
| BR-Wh | the reopen | same | [true, true] | **[true, false]** |
| BR-Wpermh | B's save | did not write over a copy without asking | false | **true** |
| BR-Wpermh | the next Save / the reopen | every leaf copy reachable | [true, true] | **[true, false]** (two checks) |

**The 6 failing OUT checks**, all on the pre-existing path with no lock involved:
- BR-C2a: B's save writes without asking.
- BR-C2ah: the save writes without asking, and then F0-BASE is in no copy, at the next Save and at the reopen.
- BR-C2b and BR-C2bh: the second Save writes without asking, after the refresh that followed the refused first Save.

**Not falsely clean, anywhere.** No scenario, at any step (save, next Save, reopen), was recorded clean while the folder
held something else or the record named another copy.

### Observed outcome of every scenario

This is `logs/table-r1.md`; r2 is the same. "Premise" is B `_saveBusy` / A `_saveBusy` / held / pending.

| scenario | premise | B's save | next Save | at the reopen, where each copy is |
|---|---|---|---|---|
| PB-W | 0/1/A/B | ↶ Put back went ahead: K on screen, S1 kept (swap). The save wrote nothing: "⛔ … after the copy you are working from. Nothing was written." | nothing | K: screen+storage; S1: kept; N: folder; F0: history |
| PB-Wtick | 0/1/A/B | as PB-W; the autosave refused (clash); then the tick's pull said "⚠ … you have unsaved changes. Nothing was replaced." | nothing | as PB-W |
| PB-C1 | 1/0/B/- | ↶ Put back **refused** ("⏳ Not put back: a save was under way…"); S1's save landed (N → S1, no question needed by lineage) | re-stamp | K: kept; S1: screen+storage+folder+history |
| PB-C2a | - | put back, then Save: refused with the choice, nothing written | nothing | same as PB-W |
| PB-C2b | - | S1 landed; put back: K on screen, nothing kept (S1 saved) | refused with the choice | K: kept; S1: screen+storage+folder |
| PB-NL | (no locks) | B's save read and wrote the folder **while A's save was held**: without Web Locks nothing waits, so in W the wait is the mock's doing | - | - |
| AD-W | 0/1/A/B | the refresh **adopted** N2 and kept WORKING aside; the save wrote N2 → N2 (re-stamp); "✅ Saved …" | re-stamp | WORKING: kept; N2: screen+storage+folder+history |
| AD-Wtick | 0/1/A/B | same as AD-W | re-stamp | same |
| AD-C1 | 1/0/B/- | the refresh **refused** ("⏳ … was not loaded: a save or Load theirs was under way…"); the save refused with the choice; WORKING on screen | nothing | (the reopen's own refresh adopted N2 and kept WORKING aside) WORKING: kept; N2: screen+storage+folder |
| AD-C2a | - | refresh adopted N2 (WORKING kept); Save wrote N2 → N2 | re-stamp | as AD-W |
| AD-C2b | - | WORKING landed; X's N2 refused at X (its own clash) | re-stamp | WORKING: everywhere; N2 only on X's screen |
| BR-W | 0/1/A/B | the refresh **recorded F0** (driveBaseOf 0 → F0); the save **wrote F0-BASE → B-EDIT, unasked** | re-stamp | B-EDIT: everywhere; F0: history (spaced) |
| BR-Wtick | 0/1/A/B | same as BR-W (second tick) | re-stamp | same |
| BR-C1 / C1perm / C1h | 1/0/B/- | the refresh recorded nothing (0); the save **refused** with the choice | refused | B-EDIT: screen+storage; F0: folder |
| BR-C2a (OUT) | - | the refresh recorded F0; Save wrote F0 → B-EDIT unasked | re-stamp | F0: history |
| BR-C2b | - | first Save **refused** (asks); the refresh then recorded F0 | **wrote F0 → B-EDIT unasked** (OUT) | F0: history |
| BR-Wperm | 0/1/A/B | the opening stopped at one click (`_driveNeed` 'click', base 0); the bar's Connect during the wait recorded F0; the save wrote F0 → B-EDIT unasked | re-stamp | F0: history |
| BR-Wh / BR-Wpermh | 0/1/A/B | wrote F0 → B-EDIT unasked; F0 kept only as `…-recent` | re-stamp, **pruning F0** | **F0-BASE: none**; F00-FIRST: history |
| BR-C2ah (OUT) | - | the same as BR-Wh, with no second tab and no lock | re-stamp, pruning F0 | **F0-BASE: none** |
| BR-C2bh | - | first Save refused | wrote F0 → B-EDIT unasked (OUT) | F0: history (`-recent`) |
| PF-W | 0/1/A/B (B's file reads 0) | ↶ Put back went ahead; the file save asked **HOLD ON** (answered Cancel); nothing written | - | K: screen+storage; S1: kept; N: file |
| PF-C1 | 1/0/B/- | ↶ Put back **refused**; S1's file save landed (N → S1) | - | K: kept; S1: screen+storage+file |
| PF-C2a | - | put back, then Save: HOLD ON asked, Cancel, nothing written | - | same as PF-W |

## Observations (no checks fail on them; reported for Brad)

### O1 (P3): B gives no sign that its Save is waiting

While A held the lock, B's status line and header did not change after 💾 Save. For example, in PB-W the status still read
"⬇ Loaded Alice's copy …" and the header "Unsaved changes · ↶ work kept aside". saveSerial's "⏳ A save is already under
way" notice is said only when this tab already counts a save.

### O2 (P2/P3, message): in AD-W and AD-Wtick, the Save reports success for a copy the user did not ask to save

- Alice pressed 💾 Save with WORKING on screen.
- The refresh during the wait adopted N2 and said "⬇ Loaded O&M FY27 from the shared folder — saved by Alice just now. This
  browser held work no saved copy had; it is kept aside: put it back …".
- The Save then wrote N2 and replaced that line with "✅ Saved O&M FY27 to the shared folder — 4 KB."
- **WORKING was not saved.** It is only in the kept slot, and the header still shows "↶ work kept aside".

Nothing is lost and the record is consistent. In the counted control (AD-C1) the adoption is refused and the Save offers the
choice instead.

### O3 (P3): in PB-Wtick, the autosave's clash refusal is replaced at once

The autosave's clash refusal is immediately overwritten by the same tick's pull: "⚠ … you have unsaved changes. Nothing was
replaced." The ⛔ choice line (Load theirs / Save yours over theirs) is no longer on screen.

### O4 (P1 by shape, OUTSIDE U20, pre-existing): with nothing recorded, a refresh takes the folder's copy as the base

**What happens** (one tab, no lock; measured in BR-C2a and BR-C2ah, and in BR-C2b's second Save):
- A refresh with nothing recorded for this appropriation and year, finding the folder's copy not newer than the screen,
  records that copy as the one the work came from.
- The next 💾 Save then writes over it without asking.
- If the folder's newest spaced history copy is under ten minutes old, the copy that was written over is kept only as a
  `-recent` copy. The save after that prunes it.

**Why it matters:** the push's own rule says the opposite. When nothing is recorded "there is no telling, so that asks too",
and BR-C2b's first Save does ask. U13 deliberately left the pull's legacy recording in place for saves that are not under
way.

**Ledger status:** this path is not in the ledger as a finding (searched for "nothing recorded", "always was" and `-recent`;
only U17 mentions `-recent` pruning). It needs its own decision, and **no correction is proposed here.**

### O5 (harness, the same in every scenario): known messages on the reopen

The harness reopen boots the board file `F1`, which is older than the folder's copy. So on reopen the status says "Opened with
this browser's copy of the board — it has changes made after this file was last saved", and in some scenarios the header reads
"Saved hh:mm" over an unsaved record (U15's known shape). These are the same with and without the trigger, and no check
depends on them.

## What was NOT done

- **No fix was applied anywhere.** `PROPOSAL.md` describes one. Its diff was made on a copy that was never booted or run, so
  the claims about the patched behaviour are by code only.
- **Real Chromium was not used for the folder or file routes** (the File System Access API). In Chromium only the premise,
  the U2 refusal and the API semantics were checked. The adoption and base-record outcomes rest on jsdom plus the mock.
- **Not run:** `mutate.mjs` (not imported, executed or read), the full `audit-import.mjs` or `audit-board.mjs`, any other
  suite, `npm run check`, and `playwright install`.
- **How likely this is was not measured.** U20's harm needs all four of the following, and the loss needs both of the extra
  conditions:
  - no record for this appropriation and year;
  - a folder copy not newer than the screen;
  - another tab holding `orbit-save`;
  - a refresh during the wait.
  - For the loss, additionally: a history copy under ten minutes old, and one more save.
- **Not tried:**
  - the U24 paths (`sharedArrived`/`adoptShared`, `bootTakeFile`, `importBoards`) during a lock wait;
  - ✍ Take the pen, whose permission `_takePen` is set before its save waits;
  - Load theirs or Save yours over theirs as the waiting operation;
  - two tabs on the **same** appropriation (they share every storage key, which adds cross-tab effects unrelated to U20);
  - a tab closed while holding the lock.

## Deviations from the standing rules (stated plainly)

- **Read-only commands before `q.sh` existed.** Between 10:14 and 10:26 AM ET, before `q.sh` was written, read-only shell
  commands ran without the `setsid -w timeout` wrapper, with no PIDs recorded: `ls`, `cat`, `grep`, `sed -n`, and
  `git log`/`git status` in orbit-board. Plain `cat`/`awk`/`grep` reads of this directory's own logs also ran unwrapped
  later.
- **One `python3` one-liner ran unbounded** at about 10:30 AM ET. It was a text edit of this directory's own `locktest.mjs`,
  making its waits deadline-bounded, and it finished at once. The rule covers python one-liners, so it is a breach; no PID
  was recorded. Every node and Chromium run was bounded.
- **`check.mjs` was corrected after it first read pass r1** (10:47:42 AM ET). The first version listed N2-NEWER as a leaf
  copy that AD-C2b's board must reach. In AD-C2b, X's save of N2 is refused at X by construction (WORKING landed first), so
  N2 never reaches this board's folder. That raised 3 failures in a healthy control.
  - The correction (10:48 AM ET) changed only that scenario's leaf list and added a check that X's save was refused.
  - Both passes were then checked with the corrected file (354/15 each).
  - The first check's log was overwritten, and its 18-fail summary is quoted here from the terminal.
- **Dev runs are kept and are not evidence:** `out/dev-*.json`, `out/locktest.dev.json` and `out/chromium.dev.json`,
  with their logs.

## Verdict

**REPRODUCED.**
- **Where:** route (ii-b) only. During another tab's save, a refresh records the folder's copy as the one the work came
  from, and the waiting save then writes over that copy without asking. On the history variant, that copy is gone after
  one more Save. The routes are BR-W, BR-Wtick, BR-Wperm, BR-Wh and BR-Wpermh.
- **Controls:** C1 and C1perm/C1h ask; the first Save in C2b and C2bh asks.
- **Routes tried that did not reproduce harm:** (i) ↶ Put back, both the folder (PB-W, PB-Wtick) and the board file (PF-W),
  and (ii) adoption (AD-W, AD-Wtick). In each, the uncounted wait is real, but the waiting save has captured nothing and
  behaves like a save asked after the action.
- **Severity:** P1 by shape on the history variant, with the narrow preconditions listed under "What was NOT done". The same
  loss also exists without U20 (O4).
- **The correction proposed** (`PROPOSAL.md`, not applied) closes only the U20 part.
