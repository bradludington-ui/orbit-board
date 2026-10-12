# ORBIT v2.00 UI — chunk 2

Branch `claude/v200-ui`, local only, not pushed. Chunk 1 ended at `acc8489` (board `863f226c…`). Base product `4a6f7c7` (board `4d273c06…`).

**Board blob at the end of chunk 2: `9f61d32b28035d4b996842b0fde49d09ff71f57e`** (commit `f95fee2`).

Every check, screenshot and result below was taken at `f95fee2`. The board file is still an empty template: "Synthetic" and "SYN-" occur 0 times in it. The synthetic board is seeded at run time only.

Against base, the diff is **insertions only**: 832 lines added, 0 removed.

**Integration stays pending** until this chunk has been reviewed against the evidence below.

## Commits

| Commit | What |
|---|---|
| `5ea7d15` | Slide-over record by default, with docking optional; rows sized to their room; guarded KPI cards; Brief posture strip; permissions; all-or-nothing PMO batch; genuine metadata; Cycle control (board `58643273…`) |
| `f95fee2` | On a phone, the context bar's group wraps rather than pushing the page sideways (board `9f61d32b…`) |
| (this commit) | Screenshots, check scripts with their outputs, and this note. No board change. |

## What was built

### 1. The RECORD panel slides over by default, at every width; docking is a setting

**One editor, the board's own drawer.** The panel is the same `#inspector` element, opened and closed by the same `drawerOpen` / `drawerClose` / `drawerSync`. It keeps the same scrim, Esc and ✕ Close.

- The CSS is the board's own `max-width:1400px` drawer rules, applied at every width under `html.ui-on:not(.ui-dock)`.
- `drawerNarrow()` answers true while the panel slides over.

**Docked beside the table** is a choice under **View › Record panel**. View is the toolbar menu formerly called Density, and it also holds Density.

- The choice is stored per browser in `prio27uiDock`.
- It is written only when the person picks it, with a plain `try{localStorage.setItem}catch`.
- Docked is exactly the board's own layout: docked above 1400px at the board's own width, `clamp(420px,30vw,600px)`, and a drawer below that.
- This fixes S1. Chunk 1's narrowed `clamp(360px,26vw,600px)` is gone. At 1440 the docked panel measures 432px, the same as base, and none of its six money inputs clip.

**The row is sized for the room it actually has.** The board picks its column lists by window width, which assumed the row had the whole window (less the docked panel). `uiRailApply()` now works out the row's real room:

> room = window − sidebar (232, or 64 as the rail) − the docked panel and its gap (docked, above 1400px, not Brief)

It then sets `html.ui-e1400 / ui-e1100 / ui-e940 / ui-e760 / ui-e640`. Each class applies the board's own list, and its own cell hiding, for a window of that width. Those rules are copied from the board's media rules.

**Where the board's own list cuts a nine-digit figure, it is replaced, not copied.** Measured, a nine-digit figure needs 88px at the row's money size and 102px at Brief's.

- The board's 761–940 lists give Rank 80px, Fund 80px and Brief 92px. Its 1100 Brief list gives 100px.
- Base itself fails `layout-fits` J on exactly these lists.
- The replacements hold the figure whole. In Fund and Brief at that room, the money is set one size smaller so every cell still fits the row.
- Brief at a room of 1101–1400 is new as well. The board's nine-track Brief list is 1,282px wide and overflowed at 1120–1340 in base itself.

**900px and narrower.** The sidebar sits as the 64px rail. › opens it **over** the page (`ui-peek`), the way the drawer does, and a click outside, Esc or a choice closes it. Nothing is written for this.

**Chunk-1 rules removed.** These caused the M2 and S1 overflows: the 1400–1760 track lists, the phantom Brief panel column, the ≤1760 Brief list and the narrowed docked panel.

### 2. The KPI cards are guarded

- **scoreboard()'s hand-off is in a try/catch:**
  `try{ if(typeof uiKpis==='function') uiKpis(); }catch(e){ try{ uiKpisNa(e); }catch(x){} }`
- **`uiKpis()` guards its own drawing too.** A card that cannot be drawn makes all four cards say **"unavailable"**, with the note "the card could not be drawn — Funding / the table has the figure". The previous figures are never left in place.
- **The cards print only the board's own figures**: `window.UI_KPI`, handed over by `scoreboard()`, through `fM()`.
- **`uiKpiCard()` refuses a figure that is not a finite number**, rather than printing it.
- **The forced error is a probe only; nothing is shipped.** The probe replaces the page's `uiKpiCard` (or `uiKpis` itself) with a function that throws.

### 3. Brief shows the funding posture strip again

- The rule is now `html.ui-on:not([data-mode="fund"]):not([data-mode="brief"]) #posture{display:none}`, so Brief gets the board's enlarged strip again (`html[data-mode="brief"] .pp .v{font-size:22px}`).
- Where the room is narrow, the strip wraps rather than scrolls: in Brief whenever the room is under 1400px, and in every mode under 1100px (the board's own ≤1100 rule).

### 4. Permissions for Add requirement and PMO Import

**What the board already does, read from the code:**

| Control | Base rule | Where it lives in base |
|---|---|---|
| Add requirement | Review only. No locked-cycle or PMO-copy gate: the guide tells a PMO copy to use ＋ Add requirement. Under a locked cycle, edits are not kept and `save()` refuses. | `#toolAdd` in `#t_review`; the folded Review tools menu (`T.review = I.add + I.mat`) |
| PMO Import (the Program offices group) | Hidden in a PMO copy (`SANDBOX`). In every mode, and under a locked cycle. | File ▾: `(_SB? '' : grp('share','offices',…))` |
| Import itself | Every mode, Brief included. | File ▾, Boards and appropriations |

**What chunk 2 does:**

- **Add requirement:** `#uiAddBtn` shows in Review only. Its handler is now `uiAddReq()`, which refuses outside Review.
- **PMO Import, in a PMO copy:**
  - the PMO card is hidden (`html.ui-sandbox`);
  - `uiImpPick('pmo')` is ignored;
  - `uiImpGo()` refuses;
  - `uiSubMany()` refuses.
- **The Import button stays in every mode**, because base offers its imports in every mode. Chunk 1's review suggested hiding it in Brief; that was not done, so that it follows the existing rule exactly.

**`toggleAdd()` is not guarded: no existing handler was changed.** The checks call it in every mode (`tools/export-audit/hostile.mjs`, `tools/panels-render.mjs`, `tools/layout-fits.mjs`), so a guard would change existing behaviour. The new UI no longer calls it directly; it goes through `uiAddReq()`.

### 5. The PMO batch ("All submissions at once") is all-or-nothing, in pick order

`uiSubMany()` works in four steps. It uses no new merge or apply logic: it uses the board's own door and its own loader, `pmoTake`.

1. **Read and check every file.** Each one goes through the board's door: `inTooBig`, then `inboundCheck`, then recognition exactly as `importState` recognises a submittal (`{spmtPkg, dir:'submit'}`).
2. **One submittal per office.** Two files from the same office in one batch, identical or not, refuse the batch. Which file is meant is the person's call; loading them one by one, the later would silently replace the earlier.
3. **A dry run of `pmoTake`** on a copy of each file, against the review as it stands, using `uiTakeDry`:
   - `alert`, `confirm`, `setStat`, `subOpenReview` and `destPkgIn` are swapped for silent stand-ins inside a try/finally;
   - `PMOSUBS` and `PMOPICK` are restored afterwards;
   - a file that `pmoTake` would not take stops the batch.
4. **Only then is each file handed to `pmoTake` in pick order.** This is exactly what ⬅ Load a submittal file does with one file. If the person answers Cancel to a question `pmoTake` asks (a file with no year, for example), what the batch put in the review is taken back out.

**If the batch is refused at any step**, nothing has been loaded. The review (`PMOSUBS`, `PMOPICK`, `subOpen`) is exactly as it was, and the board is untouched.

**An office already held from an earlier load is replaced**, as loading it singly does. This is the board's existing rule.

### 6. Genuine metadata only

**Last recorded edit.** The RECORD Overview, and History, show this line only when the change journal can answer for this requirement on its own: the newest `MS.jrnl` entry in the year on screen whose path names this requirement (`p[1] === id`). The line gives the time, who made the edit and the field, labelled "(change journal; ranking moves are not journalled)".

The line is **omitted** in each of these cases:

- nothing in the journal names the requirement;
- it is a requirement added on this board (journalled by its place in the list, not by its id);
- a locked cycle is on screen;
- a board-wide line came after the requirement's last entry:
  - a load;
  - the service list;
  - a whole year;
  - removed requirements;
  - changes past the per-save limit;
  - changes that were not recorded.

No board-wide time is ever labelled as a requirement's change. There is no "Last change" label anywhere.

**Lifecycle** shows as **"pending — the board has no lifecycle field for a requirement yet"**. No per-requirement lifecycle field exists: "lifecycle" in the code means the row's ⋯ actions.

### 7. The Cycle control

The **Cycle** button in the context bar opens a menu with three parts:

- **Plan on screen:** "Working plan — the plan you change and save". This calls `cycLeave()`.
- **View a locked cycle (read only):** each locked cycle that holds a plan (`blList()` filtered by `cycHeld()`, the same list Compare's 👁 View buttons use), shown as "PB27 — locked: the plan as it stood when locked · read only: nothing changed while viewing it is kept". Choosing one calls `cycView(k)`. A key that is not such a cycle is ignored.
- **Cycles & compare…**

The menu also says: "The board has one working plan. A locked cycle is a read-only record of it, not a separate plan to edit."

While viewing a cycle, the button reads "PB27 (locked, read only) ▾" and the chip reads "🔒 Read only — locked cycle".

### Chunk-1 review items also fixed

| Item | Fix |
|---|---|
| M1 | The `scoreboard()` hand-off is guarded (item 2). |
| M2 | Rows are sized by their room (item 1). The 700–1900 sweep is clean in every mode and configuration (checks below). |
| S1 | The docked panel is back at the board's own width; no money input clips. |
| S2 | Brief posture strip restored (item 3). |
| S3, S4 | Permissions (item 4). |
| Header labels | Chunk 1's `html.ui-on .hdr .ctx .tlbl{display:inline}` is removed, so `.hdr.tight1` and the ≤1100 rule can drop the labels and `fitTop()` works again. |
| Editable chip | Honest about the pen. It reads "✎ Editable · Pat holds the pen" when the file's `WRITER` is not this browser, with a title explaining that only they save in place. In a PMO copy it reads "✎ Editable · PMO copy — no Save". The writer key is read and never created: `writerIsMe()` is asked only when `prio27writerKey` already exists. |
| Batch order | "All submissions at once" is processed in pick order, all or nothing (item 5). |
| Storage message | UI preferences use a plain `try{localStorage.setItem}catch`, never `lsSet`. |
| Screenshot script | It now imports playwright-core from orbit-ui. |

## Every check and its result (at `f95fee2`)

Every command was bounded with `setsid -w timeout -k 10 600` (or less), with BOARD unset. PIDs are in the scratchpad `uichunk2/pids.txt`.

**Suites.** Each one first checked the AUDIT_IMPORT lock.

- The lock was present when the `5ea7d15` suites queued. They waited until it cleared.
- It was absent for every `f95fee2` suite.
- The jsdom probes and the Chromium screenshot runs are not suites and did not wait.
- `audit-import.mjs` and `audit-board.mjs` were not run, as instructed.

Scripts are in `ui-concept/preview-chunk2/checks/`; their outputs are in `checks/results/`.

| Check | Result |
|---|---|
| Smoke boot (`boot.mjs` via `checks/smoke.mjs`) | **`X.errors = []`**. Storage after opening is `["prio27destdb"]`, the same as base. No `prio27ui*` key is written at opening. `drawerNarrow()` is true (slides over). |
| `node tools/export-audit/boot-same.mjs` | **same**: every page, source, save and error list is identical either way |
| `node tools/export-audit/audit.mjs` | **ALL CHECKS PASSED** |
| `node tools/export-audit/audit-other.mjs` | **ALL CHECKS PASSED** |
| `node tools/export-audit/audit-recon.mjs` | **ALL CHECKS PASSED** |
| Chunk-1 reviewer's smoke (`uichunk1/rv-smoke.mjs`), base vs new | **0 fails**. Saved-file payload is byte-identical to base on the same seed and clock. The saved file is SRC0 plus the payload. Driving every new control leaves the saved file unchanged. The same existing calls write the same storage keys and values as base. KPI = $383,000,000 / $242,000,000 / $34,000,000 / $107,000,000, equal to the posture and the totals. Import routes are unchanged. |
| `checks/probe2.mjs` (jsdom) | **91 PASS, 0 FAIL**. Detail in the rows below. |
| · KPI forced error, a throw in `uiKpiCard` | All four cards read "unavailable" with no `$` left on them. No page error. `render()` completes: 14 rows and the posture strip ("Whole budget · $383,000,000 asked"). An edit plus `save()` gives a posture and a saved payload identical to a twin board without the error, and the same storage keys. |
| · KPI forced error, a throw escaping `uiKpis` | The scoreboard guard turns the cards to "unavailable", and render still completes. Once drawing works again the cards come back with the board's figures. |
| · Permissions | Add: handler and panel open in Review only, matching the base folded menu in all five modes. PMO Import is offered on the working board. In a PMO copy (`pmoCopyHtml`, `SANDBOX` true), File ▾ hides Program offices (base rule); `ui-sandbox` is set; `uiImpPick('pmo')`, `uiImpGo` and `uiSubMany` all refuse. Add is still offered in a PMO copy's Review, as base does. |
| · Batch (a): a valid file, then malformed JSON | **Refused.** Review state identical (submittals, ticks, rows, open). Board payload identical. Storage unchanged. Reopening the review shows the pre-batch TSS submittal. No errors. |
| · Batch (a): a valid file, then a wrong-width submittal (refused by `pmoTake` in the dry run) | Same as the row above. |
| · Batch (b): same office twice, differing content | Same as above. Message: "“AV.json” and “AV-again.json” are both from AV. A batch takes one submittal per office". |
| · Batch (b): same office twice, identical content | Same as above. |
| · Batch: Cancel during the real run | Taken back out. Review and board exactly as before. |
| · Batch (c): storage throwing `QuotaExceededError` on every write, valid batch | Loaded. The review is identical to the same batch with storage working. Board unchanged. Storage unchanged. Reopening shows it. |
| · Batch (c): storage throwing, valid then malformed | Refused. Review preserved exactly. Board and storage unchanged. |
| · Batch success, picked AV, PSM, TSS-second and picked PSM, TSS-second, AV | Identical to loading one by one. Held in pick order. Nothing applied, nothing ticked. |
| · Metadata | Lifecycle "pending". No last-edit line before any edit. After a note on S03, S03 shows its own journal line ("note"); S04 shows none. No "Last change" label anywhere. After a later board-wide `(load)` line, the line is omitted. |
| · Cycle | The menu offers the working plan and the locked cycle, read only. Choosing the cycle sets `CYCVIEW`; the button and chip say read only. Working plan calls `cycLeave`. An unknown key is ignored. |
| · Pen chip | "Pat Writer holds the pen" when it is not this browser. No writer key was written. |
| `checks/sweep2.mjs` (Chromium, chunk-1 `rv-sweep` extended) | Every width 700–1900 in steps of 20, every mode (Review, Rank, Fund, Compare, Brief). Base, plus new with the sidebar open, as the rail, docked, and docked with the rail. Panel-open checks at every 100px and at 1050. Results are in the next three rows. |
| · sweep2, panel closed | **New: no row overflow, no cell past the row and no sideways page scroll in any configuration.** Base's own Brief overflow at 1120–1340 is gone. |
| · sweep2, panel open | No money input clipped. The panel sits inside the window. |
| · sweep2, one exception | One sample, compare at 1900, measured the drawer mid-slide under load. `checks/recheck1900.mjs` shows it is fully on screen at 1440..1900 from 260ms, three times out of three. |
| `checks/sweep9.mjs` (nine-digit figures, layout-fits J's own tests, 700–1900) | **Base** cuts nine-digit figures at 763–940 (Rank, Fund, Brief), Brief 943–1099, and has Brief cells past the row at 1102–1321. **New** has no cut and no cell past the row in any configuration. The only remaining hit is a 1px sideways page at the single width 1291 (and 1123 as the rail): the File/Setup button at the top bar's edge. Base has the same 1px effect at 1301. |
| `node tools/layout-fits.mjs` (new) | **4 failing, against 6 in base.** Base fails J Rank/Fund (761–940) and J Brief, for both themes. New passes all of J, including the phone at 390×844, plus A, B, C, E, F, G, H and I. The 4 that fail are all D (see Unfinished). |
| `checks/permvis.mjs` (Chromium, visible or not) | New Add matches base `#toolAdd` (or the folded menu) in every mode, on the working board, under a locked cycle and in a PMO copy. The new PMO card matches File ▾ Program offices in every case. No page errors. |
| Screenshots | 26 shots, every one measured (`shots.json`): row overflow 0, no cell out, no money input clipped, panel inside the window, no sideways scroll. No page errors. |

## Screenshots (the actual board at `f95fee2`, synthetic data at run time only)

They are in `ui-concept/preview-chunk2/`, taken by `shoot-chunk2.mjs` with the same seed as chunk 1.

| File | What it shows |
|---|---|
| `m-{1000,1050,1440,760}-sidebar-{open,collapsed}-drawer-{closed,open}.png` | The width matrix: 16 shots. At 760, "sidebar open" is the sidebar over the page. |
| `d-1440-docked-sidebar-{open,collapsed}.png` | The docked setting at 1440, with the panel at the board's own 432px |
| `v-1440-view-menu-record-panel-choice.png` | View: Density, plus Record panel (slides over by default, or docked) |
| `b-1440-brief-posture-strip.png` | Brief with the posture strip, wrapped beside the sidebar |
| `e-1440-forced-card-error-unavailable.png`, `e-1440-forced-card-error-board-still-works.png` | The forced card error: four "unavailable" cards, while the rows, posture and record still work |
| `c-1440-cycle-control-open.png`, `c-1440-viewing-locked-cycle-read-only.png` | The Cycle control open, and a locked cycle being viewed read only. The cycle was locked at run time. |
| `i-1440-import-box-pmo-all.png` | The Import box with PMO Import and All submissions at once |
| `p-1440-pmo-copy-import-box-no-pmo-card.png` | The Import box in a PMO copy, with no PMO card |
| `f-1440-fund-no-add-button.png` | Fund, with no Add requirement |

## Existing functions touched

**Base functions (`4a6f7c7`):**

- **`scoreboard()`**: the chunk-1 hand-off line is now try/catch-guarded and, on failure, calls `uiKpisNa`. It still only reads; no figure changes (identical payload, recon passes).
- **`drawerNarrow()`**: 2 lines added. It returns true when `uiSlides()` (the panel slides over). Its old answer is unchanged when docked.

No other base function was changed. `toggleAdd`, `importState`, `pmoTake`, `subOpenReview`, `save` and every money, import, save and persistence function are unchanged.

**Chunk-1 functions changed:**

| Function | Change |
|---|---|
| `uiPrefRead` | Also reads `prio27uiDock`. |
| `uiPrefWrite` | Now `(k, v)` and a plain setItem; no longer `lsSet`. |
| `uiBoot` | Cycle menu markup; `uiRailApply`; guarded `uiKpis`; resize recomputes the room. |
| `uiCycLabel` | Says "(locked, read only)". |
| `uiSync` | Room classes, the pen-honest chip, labels for the rail and the over-the-page sidebar. |
| `uiKpis` | Guarded; draws through `uiKpiCard`. |
| `uiColSet` | Uses the new `uiPrefWrite` signature. |
| `uiPopsClose`, `uiPopFill` | Cycle menu; record-panel choice. |
| `uiRailToggle` | Over the page at ≤900px. |
| `uiGo`, `uiDocClick`, `uiKey` | Close the over-the-page sidebar. |
| `uiDrawerTabs` | Lifecycle pending; last recorded edit. |
| `uiImpOpen`, `uiImpPick`, `uiImpDraw`, `uiImpGo` | PMO-copy rule; batch wording. |
| `uiSubMany` | All or nothing, in pick order. |

**New functions:** `uiSandbox`, `uiSlides`, `uiDockSet`, `uiNarrow`, `uiRoom`, `uiRailApply`, `uiPeekClose`, `uiPenOther`, `uiKpiCard`, `uiKpisNa`, `uiCycKeys`, `uiCycGo`, `uiLastEdit`, `uiLastEditHtml`, `uiAddReq`, `uiFileText`, `uiTakeDry`.

**New variables:** `UI_BATCH`, `UI_KIC`.

**New per-browser key:** `prio27uiDock`. It is written only from the person's choice.

## Unfinished and open

- **`layout-fits` D fails at 4 sizes.** The first row starts at 323px against a 320px limit at 1920, 1440 and 1366, and at 453px at 1024×768. The cause is chunk 1's page heading, KPI cards and toolbar. Chunk 2 does not make it worse: with the same seed, the first row's top is 376/434/434/556 in chunk 1 and 376/401/401/556 now (`checks/firstrow.mjs`). Fixing it means a shorter heading or cards, or KPIs beside the toolbar. That is Brad's call on the look, so it was not done.
- **The batch's dry run swaps five board globals** (`alert`, `confirm`, `setStat`, `subOpenReview`, `destPkgIn`) for the length of one synchronous `pmoTake` call, and restores them in `finally`. This is the only way to use the existing validator without changing it, and a reviewer should look at it specifically.
- **One known side effect is left as base has it.** In the real run, `pmoTake` folds a package's destination list (`destPkgIn` → `persistDest`) exactly as a single load does. If the person then cancels a later file's question, the earlier files are taken out of the review, but their destination-list fold stays, as it would after loading those files one by one.
- **Cosmetic:** the page subtitle lower-cases the cycle label ("pb27 (locked, read only)"). This is chunk 1's `toLowerCase()`.
- **Pre-existing, not introduced:**
  - the RECORD panel's By-service TOTAL "$34,000,000 ↺" is cut with an ellipsis, in base too, at both 460px and 432px;
  - the posture strip's Unfunded by service still prints compact `$75.0M`;
  - the 1px top-bar overflow at a single width (1291 here, 1301 in base).
- **Item 4's toolbar Import button stays visible in Brief**, because base offers imports in every mode.
- **Not run:** `audit-import.mjs` and `audit-board.mjs` (as instructed), and the other `verify:grid` browser tools (`inspector-agrees`, `editors-reachable`, `toolbar-fits` and so on). With the record sliding over by default, any of those that expects the docked panel at 1440 should be checked.
