# Item 165 — every rule in the old CLAUDE.md, and where it went

The old `CLAUDE.md` (471,142 bytes at `87b981fa`) is now `HISTORY.md`, byte for byte, below a short preface. The new `CLAUDE.md`
is the rulebook. This list takes the old file section by section, in its order, and marks each rule:

- **kept §N** — stated in the new `CLAUDE.md`, in that section (§0 is the top: the opening, "source of truth", "Before every commit").
- **merged → X** — folded into another rule, named.
- **history only** — not in the rulebook, with why: the feature is removed, it was a one-off event, it is a measurement of the
  day, or it is an implementation detail of a current feature that the code and `HISTORY.md` carry and a change need not
  observe as a rule.

A "rule" is any statement of how things must be done, what must hold, or a lesson stated as a rule. Where a section is only
narrative (what happened, numbers measured), that is said once for the section.

New `CLAUDE.md` sections: §0 top · §1 Brad's standing rules · §2 The funding model · §3 Exports and workbooks · §4 How it saves ·
§5 Imports, PMO copies and submittals · §6 Escaping, keys and the network · §7 Requirements, years, cycles and the journal ·
§8 The screen · §9 Colour and accessibility · §10 Checks: what to run · §11 Writing checks: the lessons · §12 Hand-edit points,
appropriations and the file map · §13 House style.

---

## (title and opening)
- ORBIT is a single self-contained HTML file, no dependencies, runs from `file://` with no internet route — **kept §0**.

## One build: `prioritization-board-grid.html` (since v1.88)
- The grid file is the only program file; every tool points at it — **kept §0**.
- The file kept its name so nothing saved or linked changes — **kept §0**.
- `parity.mjs` / `parity-allow.json` retired; `row-controls.json` holds the controls — **merged → §8 "npm run controls"**.
- Card-only code paths removed in v2.03 — **history only** (one-off event).
- `render()` stays wrapped (`renderBoard` then `gridAfterRender()`) because the board renders while the script is still read — **kept §8**.
- A `gridAfterRender` that throws empties the RECORD panel and says so — **kept §8**.
- The saved format is shared; a card-build board opens in the grid (full-import test from v1.80–v1.87) — **kept §0** (opens) / history only (the fixture list).
- Read "the grid" wherever historical sections say "both" — **kept §0**.

## ORBIT is local, and owned locally (Brad, 26 Nov 2026)
- Local only, single file is the product; items 100 and 107 withdrawn; "the Azure build" reads as not planned — **kept §0, §1**.
- Hardening the file is item 106 — **history only** (an item reference, tracked in NEXT-VERSION/SHIPPED).

## This file is the source of truth
- The HTML in git is the source, edited directly, no build step — **kept §0**.
- Comments naming the build script / the suite / companion artifacts are historical; do not run them — **kept §0**.
- Things the build script injected are hand edits — **kept §0, §12**.

## Before every commit
- Run `npm run check` before every commit; it exits non-zero — **kept §0**.
- What it holds (parses, six tables, save target, no data, nothing external, `jsa()` in handlers) — **kept §0** (list extended with later additions).

### Seeing the board
- `npm run shoot` photographs the real board; the only way to verify appearance — **kept §10** (command).
- Chromium found through `tools/chrome.mjs`; never `playwright install` — **kept §10**.
- Shoot HEAD and the working copy and compare when furniture moves — **merged → §10 shoot** (the practice is implied; stated as a command).
- Globals are `const`/`let` in the lexical environment; reach by bare identifier; never shadow — **kept §10**.

### Where every action lives: the left menu (v2.00, menu)
- Each action has exactly one home; top right holds only the message line and Help — **kept §8**.
- The left menu's order and contents (Views, Reports & exports, Board…) — **kept §8** (as now: FYDP and Budget Year contents after v2.19/v2.24).
- Save in the header since v2.21 — **kept §8**.
- The menu is words only, always 168px — **kept §8**.
- `syncBtns()` writes every list; flyouts borrow from `#uiHold` — **kept §8**.
- No item in the left menu's boxes and panels carries an icon (`uiPlain()`); tick/●○/…/▸ stay — **kept §8**.
- A menu path names the entry without an icon; `npm run menus` checks — **kept §8, §1 (plain words)**.
- `npm run leftmenu` holds the whole map with named exceptions — **kept §8**.
- Version sections name the menus as they were; read through this map — **kept §8**.

## The funding model — get this right before touching any export
- Exactly two lanes; `tiers()` the only authority; walk order; d/m/u; everything derived never recomputed — **kept §2**.
- `d + m + u == basisSvcOf()` per service and total — **kept §2**.
- `basisSvcOf()` is the allocation clamped to the ask — **kept §2**.
- `beyond + trim == shortfall` per service — **kept §2**.
- The five floors became inert and were declared equivalent only because the invariant is checked — **kept §2**.
- Leave the floors in the code — **kept §2**.

### Every dollar the board holds is a whole dollar
- Money rounded at the door: `D$`, `parseAmt`, `money()`, `askVecOf`, budget authority; no cents — **kept §2**.
- Floats prorated left fractions that surfaced as phantom unfunded — **history only** (the motivating failure; clause kept in spirit).
- Never spread a total by hand; use `apportion` (largest remainder) — **kept §2**.
- Every proration goes through it (svcAlloc, legacy split, addReq, BA seeding, increments, zeroSpread, absorber) — **merged → §2 "Every proration goes through it"**.
- The check is `Number.isInteger`, not a tolerance — **kept §2**.

### Directed is not drawn
- drawn = min(directed, lane left, basis); the excess lands in UFR — **kept §2**.
- A split editor owes the second reading from one implementation (`drewLine`, `directedLine`, `drewTip`, `drewGap`) — **kept §2**.
- The input always keeps what was typed — **kept §2**.
- "Both builds … the card in the row expander" — **history only** (card build retired).

### Unspent discretionary is not a failed flow
- Trims cannot be paid by a flush lane; no auto flows — **kept §2** (as "a decision nobody made").
- `trimAbsorb(T)` and its formulae — **kept §2**.
- The order is priority, never size (`trim-absorb-unordered`) — **kept §2**.
- Per service, never netted (`trim-absorb-netted`) — **kept §2**.
- "Still beyond the lane" stays a separate column — **kept §2**.

### The band is stated on the grid's row, and set on its panel
- The row's band chip is a plain label with no handler — **kept §8**.
- The editor is the RECORD panel's Classification `<select>` — **kept §8**.
- The card keeps its picker — **history only** (card retired).
- `row-controls.mjs` records a replacement, not a loss — **merged → §8 "npm run controls"**.

### Reading a workbook, and moving one between years
- Every offset `xlsxRead()` follows is bounded and each fault is named — **kept §3**.
- OOXML `_xHHHH_` read once (`_xunesc`, `_xdecode`); a code for a character a workbook cannot hold is kept as written — **kept §3** (first half) / merged (second half → same rule).
- `xlsxEscSaid()` counts on each import line — **history only** (implementation detail).
- The reader fixture is built by the board's own writer; damaging it gives realistic corruption — **history only** (test design note; the general rule "read bytes as another program does" is §11).
- `yearCopy()`'s normalise list and `cp()` payload in step both directions; oracle reads from source — **kept §7**.
- `upl` keyed `'r|<id>'` checked separately — **history only** (implementation detail).
- Dates and CR half-month keys shift with the year; value travels; COPY leaves source untouched; MOVE clears order and PMO orderings — **kept §7** (MOVE clears) / history only (the rest: test coverage list).

### Save → reopen is an invariant, and it is tested
- `buildSavedHtml()` into `pubState`; reopening is the only way a save is read back — **kept §4**.
- The whole-store comparison's three exclusions (`ts`/`log[].ts`/`jrnl[].t` by name; `pmoOrder` derived) — **history only** (test design; the "zeroed by name, never every `t`" point is a fixture rule — see note at end).
- A whole-store comparison passes when both sides are equally wrong; check named fields too — **merged → §11 "Check an identity on every row… enumerate"**.
- The `<` escape is load-bearing (`save-no-lt-escape`) — **kept §4**.
- A fixture that could not happen tests nothing (`BASE_ITEMS` filled explicitly) — **kept §11**.

### Imported state is POSITIONAL, and position is not a service
- Every per-service figure is positional; a different service list misplaces and reconciles — **kept §5**.
- `applyStore()` is the single choke point; returns false and leaves the store byte-identical — **kept §5**.
- `svcCheckPack()` table (match/reorder/mismatch/arity/unknown) — **kept §5**.
- A partial remap is worse than no guard; the test walks every service-width array generically — **kept §5**.
- `packOfStore()` looks top, current year, every year — **kept §5**.
- `importState()`'s populated-board branch is unreachable from the harness; the mutation was removed rather than faked — **history only** (a stated limit of the day).

### The PMO copy, and what comes back — a no-fail round trip
- Neither leg may lose or misplace a figure — **merged → §5 (the PMO copy and what comes back)**.
- Outbound: same HTML plus `pubMode`/`SANDBOX`; sandbox gates outbound writes and leaves `persist()` alone; nothing about money stripped — **kept §5**.
- Inbound fields; since v1.84 every field but the allocation — **kept §5**.
- Package carries `svc`, `base` (travelling with the package), an editor name — **kept §5**.
- Nothing applied until ticked; `pmoRows`/`pmoReport`/`pmoApply` — **kept §5**.
- A rename that misses a call site does not throw: `check.mjs` resolves every inline handler; drive the rendered checkbox with a real event — **kept §0** (handler names) and **merged → §11 "Read the rendered page"** (drive the control, not the function).
- A requirement added in the copy (pre-v2.07 rule: dropped and named) — **merged → §5 "A new requirement travels whole"** (superseded by v1.95/v2.07 proposals).
- A package with no service list is questioned — **merged → §5** (superseded: v1.95 item 51 refuses one with figures).
- A PMO copy gets its own browser storage key suffixed with its publish stamp; `PMODE.ap` pins the appropriation — **kept §5**.
- Anything that leaves a PMO copy says so; `expName()`/`expTitle()` choke points; the mark goes in front; not marked twice — **kept §3, §5**.
- Never title a sheet off raw `document.title` — **kept §3**.
- A transform inserts what it defines after it rewrites what it matches (`expTitle` ate itself) — **kept §11**.
- Side databases ride alongside the store; the handoff fixture seeds all of them — **history only** (EXDB/ACEDB/RPDB: ACE removed v2.19; the carry rule is §5).
- What is reviewed must be what would land: `askVecOf()` single statement; `pmoTake()` normalises at the door; wrong-width refused, not padded — **kept §5**.
- The change report is read back with the board's own workbook reader, cell by cell, untruncated — **kept §5** (summary) / **merged → §11 "a byte count proves only that it downloaded"**.
- `applyState()` does not own the requirement value; `applyAskVec()` is the one writer; `setAsk()` routes through it — **kept §5**.

### Appropriation packages were the other unguarded door
- `pkgApply()` must guard every appropriation, not just the one on screen — **merged → §5 "Appropriation packages are checked…"**.
- Checked against the services that appropriation holds; `svcCheckPack`/`svcGuardImport` take the target list — **kept §5**.
- The guard runs before `pkgStrip()` and the preview — **kept §5**.
- The remapped `dataPack.services` is rewritten to the target order — **kept §5**.
- A fixture where the two lists coincide proves nothing — **merged → §11 "fixture makes the alternatives disagree"**.

### The change journal is the safety net, and nothing tested it
- Hand edit journalled with path/before/after; undo restores; the reversal is journalled (both stand) — **kept §7**.
- A value too large (`JRNL_BIG`) refuses to be undone (`jrnlUndoable`) — **kept §7**.
- Drive the journal the way the board does (`jrnlCapture` records; `jrnlSync` does not) — **kept §7**.

### The spend plan sends what DISCRETIONARY paid, and only that
- Basis is not the allocation (unfunded money was exported) — **kept §3** (now FUNDED, see v1.83).
- `SRC_BASIS='disc'` / sends discretionary only — **history only** (reversed by Brad in v1.83: now `'funded'`, both lanes).
- Stated once in `srcSvcOf(it, T)`, read by its callers — **kept §3** (`srcLaneOf`/`srcSvcOf`).
- `p.d` invariant under the discretionary-only view; no `[DISC-ONLY]` marker — **history only** (true of `p.d`, but the Spend Plan Source now sends mandatory too; flagged below).
- The lane walk answers only for the ACTIVE year; another year skipped and named — **kept §3**.
- It had no money check; now covered — **history only** (one-off).

### Both unfunded readings, on every surface that states one
- Both readings stated on every surface that states one — **kept §2**.
- The dashboard tile shows both; `tierTotals` returns `u1Amt`/`u2Amt` — **kept §2**.
- Columns read by name (`colOf` throws) — **kept §11**.
- Slice at a boundary row, not an exclusion list — **kept §11**.
- A money column is filled, not padded — **kept §11**.
- The list of surfaces (deck, synopsis…) — **history only** (deck and synopsis removed v2.05).

### Two unfunded readings, both measured against the ASK
- Unfunded never measured against a trimmed allocation; formulae — **kept §2**.
- `discUnfSvcOf()` single implementation; `mcShortSvcOf()` delegates — **kept §2**.
- Both floored per service — **kept §2**.

### A directed split states its own allocation
- `svcAlloc()` reads the directed dollars; nothing caps them but lane and requirement — **kept §2**.
- basis/trim/u formulae, `beyond + trim == unfunded` holds — **kept §2**.
- `seedSplit()` fills from the lane walk so a recorded source moves no money — **kept §2**.
- Every other source keeps a live, settable row allocation; a dead control is the same defect — **kept §2**.

### The CLIN grid feeds nothing
- CLIN lines are a visual breakout, never an input to the funding math — **kept §2**.
- `clinToRow()` not offered on a row that states its own allocation — **kept §2**.
- Nothing else reads `S.clinAlloc` into a lane — **merged → §2 "The CLIN grid feeds nothing"**.

### A submittal carries one office's requirements
- Scope is `grpOf`, the requirement's own office — **kept §5**.
- Enforced twice: in the copy (named) and at the board — **kept §5**.
- The office travels inside the package (`pkg.pmo`) and the filename — **history only** (implementation detail; scope rule kept).
- A package with no `pmo` is taken with a warning; a field ticked from two submittals is refused — **kept §5** (refused) / history only (the no-`pmo` warning, a legacy path).
- Applying does not clear held packages — **kept §5**.

### A banded heading is a merge, and the order of the XML decides whether the file opens
- `mergeCells` after `sheetData` — **kept §3**.
- Every cell a merge covers is emitted with the band's style — **kept §3**.
- Bands checked at the byte level — **merged → §11 "read the bytes the way another program does"**.
- Band colours are the board's language — **kept §3**.

### The offices are chosen in one place
- The PMO filter and prime/OGC filter are one menu; no control with two homes — **merged → §8 "each action has exactly one home"**.
- The button carries the selection — **merged → §8** via v2.18's `pmoBtnLabel()` rule (see v2.18).
- An office with nothing in it is still listed, under its own heading — **history only** (not restated; flagged below).
- Counts come from `grpOf()` — **history only** (implementation detail).
- `pmoSync()` runs before the normalisation that deletes unknown-office assignments — **kept §5**.

### Three quantities, and only two may be called "Unfunded"
- The three quantities and their labels — **kept §2**.
- A surface that says Unfunded reads `unfSvcOf`/`unfTotOf`; `p.u` only under its own name — **kept §2**.

### No requirement is gated behind a mode switch
- Disc/Mand boxes live on every requirement; typing is the conversion; seeded from the draw — **kept §2**.
- The seeding must not round or re-base — **kept §2** (seedSplit unrounded).

### Two limits refuse a dollar, and they are not the same sentence
- `drewWhy()` decides the sentence from the cap the cell was measured against (caps listed) — **kept §2**.
- Blaming a flush lane sent the reader hunting money — **history only** (motivating failure).

### The row is triage; the RECORD panel is the editor
- The approved wording (Brad, 30 Sep 2026) — **kept §8** verbatim.
- The Fund allocation box stays on the row (no total-allocation editor in the panel) — **kept §8** (in the quote).
- CCaR, PID, funding mode and award date are quiet text with no handler; `gridDedupe()` strips — **history only** (`gridDedupe` removed v2.03; quiet text remains, implementation detail).
- `npm run controls` inventories controls with SURFACE; lost/unrecorded/moved fails; `--record` with a reason — **kept §8**.
- When you demote a control to a badge, check where its capability went — **kept §8**.
- The impact statement is a ROW chip, not band-gated — **history only** (superseded: v1.86/v2.08 moved it to the RECORD panel's buttons and the edit box).
- The audit matches on the live `onclick` attribute, not a regex over innerHTML — **merged → §11 "a check must test the thing"**.

### Harbor is the default in both builds
- Harbor default; `null` vs `''` distinguished — **kept §9**.
- `themeGet()` byte-identical / left `parity-allow.json` — **history only** (parity retired).
- The pre-paint bootstrap is authoritative, clears a baked attribute, paints default when storage is refused — **kept §9**.

### Do the totals add up? — the reconciliation suite
- Never call a board helper to build an expectation; assert arithmetic that must hold — **merged → §11 "Derive expectations from the fixture"**.
- The five identities (conservation, capacity, cross-foot, row closes, agreement) — **history only** (suite design; flagged below as worth restoring if the lead wants it).
- Getting the identity right: trim is a fourth term — **merged → §2 (beyond + trim)**.
- Runs on five (now six) board shapes — **history only** (suite fact).
- Thirteen export paths; refusals must give a reason — **history only** (many of those exports removed).
- Two Spend Plans: `<SVC> asked`; asked = funded + short — **kept §3**.
- The A vs B tab: widths array and header row authored apart; one width per heading — **kept §3**.
- Award dates spelled once in `awdDateLbl()`, oldest first, sorted in the helper — **kept §2**.
- PMO tab obligation report: months from `monSpreadOf()`, Unscheduled a column, office's share, UFR outside the total — **kept §3**.
- Before writing a check, ask what value makes it matter and assert the fixture has it — **kept §11**.
- Check an identity on every row, not just the total — **kept §11**.
- Matching only bare names / stopping at the first header / taking the first Subtotal: checks that cannot run — **merged → §11 "A check that cannot run reads as a pass"**.
- Roll-ups name the services they cover; CR column `TOTAL IN WINDOW` — **kept §3**.
- Every lookup asserts it found what it looked for; sheets checked for existence by name — **kept §11**.
- Match a roll-up by what it is (`— TOTAL BY MONTH`) not a changeable name — **merged → §11 "Locate every cell by name"** (by what it is).

### A hidden overlay is still a grid item
- A `position:fixed` overlay belongs outside the grid it covers — **kept §8**.
- Declare `display:none`'s resting state at top level — **kept §8**.
- `editors-reachable.mjs` asserts where the panel is — **history only** (check fact).

### Layout is a correctness property, and jsdom cannot see it
- jsdom has no layout; check layout in Chromium at real widths — **kept §11**.
- Below 1400 the panel is a drawer (opens on select, Esc/scrim close, focus returns) — **kept §8**.
- `minmax(0,1fr)` not `1fr` with nowrap content; don't give a sticky header's ancestor `overflow:auto` — **history only** (CSS detail; flagged below).
- Hover/pointer affordances key off `[onclick]` — **kept §8**.
- An empty board passes every layout check while saying nothing — **merged → §11 "fixture that cannot reach its target"**.

### One implementation, two behaviours, decided at runtime
- Write machinery once and branch at runtime (`fldHasPanel()`) — **history only** (card build and `fldHasPanel` gone).
- Mutations cannot be scoped to a build, so drive the function directly in both — **history only** (one build now).

### The band is a field in the panel, not an un-stripped chip
- Make a field editable with a real field, not by un-stripping an echo — **kept §8** ("Panel echoes of chips are stripped and read-only").

### `npm run audit` runs BOTH builds. It used to run one.
- `audit` runs both builds; twelve banners healthy — **history only** (one build since v1.88).
- One build: six banners plus legacy (since grown to eight) — **kept §10** (eight + legacy, as now).
- The check follows the build and prints which surface answered — **history only**.

### The row carries identity, money and the band
- What dropped from the row and where it is reachable — **history only** (superseded by v1.90's row).
- `rowChipsHtml` allowlisted; reason must be rewritten when divergence changes — **history only** (parity retired; `rowChipsHtml` removed v1.90).
- One mutation must match both builds — **history only**.

### Removing the L/M/H tier
- `proposedOrder()` sorts band → current position — **history only** (implementation detail).
- Measure "inert" before assuming it — **merged → §11 "measure before anything has run"**.
- Existing `S.tier` data is left; deleting user data to tidy up is not a trade — **kept §1**.
- Removing a column is four edits — **kept §3**.

### Photograph every panel, because arithmetic checks cannot see a panel
- Spruills read `APPNS` for the board's own appropriation — **history only** (Spruills removed v2.19).
- The oracle derived from the scenario, never read back — **kept §11**.
- `chip()` escapes its own label; don't escape twice — **merged → §6 "Escape where drawn, and nowhere else"**.
- A JS escape written into markup is text — **kept §8**.
- `.fr` declared at top level — **kept §8**.
- `.fctab` fixed layout: use `width`, not `min-width` — **kept §8**.
- `npm run panels` asserts opens / no escaped entity or `\u` / no clipped input; openers read off the DOM; context panels driven; no entry fails; closing resets the open flag — **kept §11**.
- `boot.mjs` resolves `BOARD` once; boot a build from its own bytes — **kept §10**.

### Where a split is edited, per build
- The RECORD inspector owns the Split editor; the row does not repeat it — **merged → §8 (row is triage quote)**.
- `migrateSplit(id)` is a shared function so removing an editor could not take the migration with it — **history only** (implementation detail).
- The split table is `table-layout:fixed` with a colgroup so columns don't resize while typing — **history only** (CSS detail; v2.01's fit rule covers the panel, see below).

### Every requirement carries an explicit Split
- `auto (lanes)` gone; `tiers()` still walks for no override — **kept §2**.
- `seedSplit`, `convertAllToSplit` (confirms, no undo), `addReq` seeds on Split — **kept §2** (addReq → `reqCreate` seeds, §7).
- Conversion is lossless; asserted with a fractional-trim fixture — **kept §2**.

### MIPR type, and the matrix column nobody could sweep
- `S.mipr` `'direct'`/`'reimb'`, `MIPR_LBL` only spelling, `setMipr()` refuses others — **kept §7**.
- Gate is `destIsOgc(it)` by KIND, never a name list; the Goes-to rule calls the predicate — **kept §7**.
- Not on the Spend Plan Source (measured mirror; columns by index) — **kept §3** (columns only by re-measuring).
- A footer true of every field but one is worse than no footer — **history only** (one-off wording; flagged below as a possible general rule).
- Any new record field rendering a `<select>` needs a `matBulk()` entry with options read off the same constant — **kept §7**.
- `matBulkOk()` empty on a routed board is asserted — **history only** (check fact).

### A recorded funding source moves no money
- Basis is the allocation for every requirement — **kept §2**.
- The rule was written three times; all read `basisSvcOf()` now — **merged → §13 "One implementation per rule"**.
- `seedSplit()` no longer rounds — **kept §2**.
- Every per-service figure floored per service; a service and its variant are each their own pot — **kept §2**.
- `unfSvcOf`/`beyondSvcOf`/`trimSvcOf` single implementations beside `mcCalc()` — **kept §2**.
- `funded + unfunded == max(ask, funded)` — **kept §2**.
- A starred requirement carried by mandatory is fully short; trimmed is short by the trim — **merged → §2 Mission Critical** (follows from "against discretionary alone").
- Exports carry two MC memo figures, never added into a lane total — **merged → §2 Mission Critical**.
- "By PMO" means `pmoSharesOf`, weighted per service — **kept §2**.
- Never iterate `GROUPS` alone; use `pmoKeys()` — **kept §2**.
- A by-PMO count column totals the board's requirements — **kept §2**.

### The ◨/◧ view toggle — discretionary only vs discretionary + mandatory
- `scenView`/`scenOpt()` → `{noMand:true}`; no second engine — **kept §2**.
- What follows the toggle (spend-plan family) — **kept §2**.
- The 1A9A does not follow it (fixed external format) — **kept §2, §3**.
- What must not follow: every other sheet, the deck, the board's totals — **kept §2** (the deck: history only, removed v2.05).
- A "differs under the toggle" check can be satisfied by its own marker; compare numbers with labels stripped and assert figures — **kept §11**.
- Compare every sheet between views, not one — **kept §11** ("enumerate the everything").
- The Two-Plan Forecast sheet is invariant; do not "fix" it to match the tab — **kept §2**.
- Fail when the sheet is missing rather than skip (`if (fc)`) — **merged → §11 "A check that cannot run reads as a pass"**.
- The marker is part of the behaviour; asserted both directions; never ship a figure that moves with the view without a marker — **kept §2**.

### Auditing the exports
- Commands (`audit`, `audit:export`, `audit:other`, `audit:board`, `BOARD=`) — **kept §10**.
- Which exports do lane math (now `exportExcel` and `exportCSV`) — **kept §3**.
- ACE Tie-Out, Chart of Accounts, ATR/BTR Log stay outside — **history only** (removed v2.02/v2.19).
- The month sheets spread `tiers()` (`monSpreadOf`, `forecast()`); two copies that must not drift — **kept §2**.
- Increments are dollars against the board's allocation, shape only for a modelled plan — **history only** (implementation detail of `landSvc`'s `literal`; flagged below).
- Conservation: every funded dollar lands in a month or UNSCHEDULED — **kept §2**.
- The suite's epsilon is 0.005 dollars; scale $M to dollars — **kept §11**.
- `tools/export-audit/` boots in jsdom; add a scenario before changing export math — **kept §3**.
- jsdom is dev tooling; the board has no dependencies — **kept §0** (no dependencies).

### The nightly IA review — how it looks, and where things are filed
- `ia:census`, `ia:shots`, `ia` commands — **history only** (commands exist; not restated; flagged below).
- The Routine at 08:00 UTC is advisory and forbidden from changing code — **kept §10**.
- Market scan rotation by weekday — **history only** (Routine's own prompt carries it).
- WebSearch works, WebFetch/curl blocked; evidence is snippets and the report says so; listicles = nothing usable — **kept §10** (compressed).
- Tools state facts; agent forms opinion; OBSERVED/ASSUMPTIONS/RECOMMENDATIONS; "no change" legitimate — **kept §10**.
- Menu item measurement (label vs hint; `.chk`) — **history only** (tool internals).
- The shot set is fixed on purpose; `closeAll()` resets flags — **history only** (tool internals).
- A wrong selector is silent; pinned and throws if the scoreboard moves — **merged → §11 "Every lookup asserts it found what it looked for"**.

### The trace matrix — one quantity, every surface that states it
- Cross-foot every quantity on every surface against a truth from the fixture — **kept §10**.
- A cell is ok / MISMATCH / `--` (silence is not an error) — **history only** (tool semantics; flagged below).
- Every cell located by name; units normalised, not ignored — **merged → §11 "Locate every cell by name"**.
- The deck surfaces and counts (10 × 12, 60 cells) — **history only** (deck removed; counts of the day).
- The Unfunded Requirements sheet's own columns are not mapped — **history only** (tool detail).

### The funds flow's plan year is the lane draw
- Entire section — **history only** (funds flow removed v2.19). Its lesson "funded is the lane draw, never the allocation" — **merged → §3 five-year plan (Allocated = d + m) and §7 cycles (fund = d+m)**.

### PPBE cycles: a lock is the FYDP window, whole, in its own store
- A cycle is every year in the window under one key with a per-year projection, in `CYCDB` per appropriation — **kept §7**.
- Merged on import like an approved estimate (key not held taken, held left) — **history only** (implementation detail).
- `MS.cycle` and `MS.cycleRef`; locking an untagged plan tags it — **kept §7** (tagging via v2.12 `cycLock`).
- `cycWindowYears()`; a blank year is "no plan", never empty — **kept §7** (window) / merged (blank → §3 "— never 0").
- `fund` is d + m and `alloc` is the allocation, kept apart — **kept §7**.
- One-year baselines migrate as partial cycles; the legacy container deleted once carried — **history only** (one-off migration).

### Viewing a locked cycle: the store is set aside, a throwaway copy goes on the page
- `cycView` stashes the working store; no second renderer — **kept §4**.
- Every write refuses and puts the pristine year back (`cycReapply`) — **kept §4**.
- `cycLeave()` restores byte for byte — **kept §4**.
- The gates that must refuse (buildSavedHtml throws, outbound, applyStore, cycLock, …) — **merged → §4 "A cycle view is read-only"**.
- `CYCVIEW` declared beside `let MS` (TDZ) — **kept §4** (lets beside `let MS`).
- The trace harness syncs `BASE_ITEMS` after `seed()` — **history only** (harness detail).
- Banner, tag, title, `expName` say which lock is on screen — **merged → §3 "Name and title through the choke points"**.

### Verifying the file you brief from
- `npm run verify:file` certifies a real board (LOADS/SURVIVES/TIES/CROSS-FOOTS/MOVED) — **kept §10** (command).
- The file is read, never copied into the repo — **kept §1**.
- `--selftest` must notice planted faults; a verifier that cannot fail is a rumour — **kept §10** (selftest) / merged (rumour → §11 "A new check is not finished until a mutation has made it go red").
- Lock-and-view harvests run under a scratch cycle — **history only** (tool detail).

### Deltas against the reference cycle: the same two definitions, subtracted
- `cycDelta` is one definition less itself a lock ago, never a second computation — **kept §7**.
- Reads only the year on screen; cached per render — **history only** (implementation detail).
- Rows account for the totals (✓/✗) — **kept §7**.
- Who and when from the journal; a pure rank change says so — **history only** (implementation detail).
- Retag offers (PB → BES …) — **history only** (implementation detail).

### The five-year spend plan: one shape for both sources
- `fydpData(src)` one shape for working plan and lock; working plan via `aceWithYear(y, cycProjOf)` — **merged → §3 five-year plan (one model)**.
- A locked cycle's report reads its projection as locked, never recomputed — **kept §3**.
- Funded d + m; Allocated; Unfunded floored per service — **kept §3**.
- A year not held prints —, never 0, outside totals — **kept §3**.
- Workbook sheets (By Requirement, By PMO, By Service) — **history only** (rebuilt in v2.04 item 112).
- The panel's year-block layout and unchanged cell markup — **history only**.

### Comparing two cycles: the same shape twice, and the rows account for the totals
- `cycCmpData` reads both through `fydpData`; Σ row deltas = total delta, printed CHECK — **kept §3**.
- ADDED / REMOVED carry the whole figure — **history only** (implementation detail).
- Must agree with `cycDelta` for the year on screen — **history only** (check fact; flagged below).
- Same source twice refused; a year one source holds is stated — **history only**.
- The old one-year compare removed as a third computation — **merged → §13 "One implementation per rule"**.

### The PPBE position beside the plan, and what a PMO copy carries
- By Service sheet prints the position; read live, never copied into a lock — **history only** (By Service sheet removed v2.04; superseded by v2.12's live budget).
- A service or year with nothing logged prints —, never 0 — **merged → §3 "— never 0"**.
- A PMO copy carries one cycle as a projection only (`cycRefOnlyDb`) — **kept §5**.
- `pmoCopyHtml(mode)` is the one builder — **merged → §4 "savedHtmlOf is the one assembly"**.

### A suite that dies is not a suite that caught something
- A death is not a catch; read the banner; retry once then CRASHED; crash fails the sweep — **kept §10**.
- Every scenario block wraps its body in try/catch so a throw is a failing check — **kept §11**.
- Keep the error message in the crash report — **history only** (tool detail).

### The five money-coverage gaps are closed
- Each gap closed with a fixture-derived check and a mutation inside the surface — **merged → §10 money coverage**.
- The surfaces named (crData, exportFlow, exportCoa, exportReprog, exportAceTieout) — **history only** (three removed; one-off).
- On the board's own appropriation the override is already written; the fixture must stand up the slot — **merged → §11 "fixture that cannot reach its target"**.

### A block after `process.exit()` never runs, and reads as a pass
- Every suite asserts every `const name` was heard from — **kept §11**.
- Names built by concatenation count when a heard name starts with the literal — **history only** (tool detail).
- A proof that cannot reach its target reads as a pass too — **merged → §11**.

### A submittal can carry a new requirement, whole
- Travels whole in `added`, accepted or declined as one — **kept §5**.
- Gated in the copy (`pmoProposalGate`, now `reqNeeds`); withheld by name, not the whole submit — **kept §5** (gate) / history only (the v1.86 field list, superseded by v2.07 `reqNeeds`).
- Accepted the way `addReq()` adds, through `save()` — **kept §5** (`reqCreate`).
- Provenance `from:{pmo,nid}` stops the double-add — **kept §5**.
- Provisional id carries the office; the number is the last segment everywhere — **kept §5**.

### A bulk write lands only where the field is offered
- `matApplyBulk` must not land where the field is not offered — **kept §7**.
- Each `matBulk()` entry says who it applies to (`applies`), default everyone; keyed on the same predicate as the panel — **kept §7**.
- `matBulkRows()` decides reach for preview, confirm and write — **kept §7**.

### The data-loss fuzz — the other can't-fail
- `npm run fuzz`, seed printed and replayable — **kept §10**.
- Every container populated with awkward values, driven through the trips — **history only** (tool design).
- Which containers exist is read from the board's source, never listed in the tool; an empty one fails; `EXCUSED` cannot rot — **merged → §11 "A check with a hand-kept list cannot fail on what the list forgot"**.
- Buy lines duplicated on reopen — **history only** (defect, registered).
- The fuzz is a stage of the gate — **kept §10** (validate:nightly).
- The seed is the whole point; a failure you cannot reproduce is a rumour — **kept §10** (seed printed and replayable).

### The export delta — which numbers moved
- `npm run delta`; no baseline file; always exits 0 — **kept §10**.
- "Is the math right" and "what moved" are different questions — **history only** (rationale).
- Phantom movement is the one thing it must not produce; nearest header above each row — **history only** (tool internals).

### The nightly math validation, and the one thing the suites cannot tell you
- Commands `validate:math`, `coverage:money` — **kept §10** (validate:math only on Brad's go, §1).
- The Routine is forbidden from committing, pushing or fixing — **kept §10**.
- Every stage runs even when an earlier fails; exits non-zero — **history only** (tool behaviour).

### What the run costs, and why the suite order is a cost decision
- Suite order in the sweep is a cost decision (short-circuit on first catch); `audit-import` last — **history only** (tool tuning; flagged below).
- `MUT_JOBS`; mutations concurrent, suites within one not — **history only**.
- The 11 equivalent mutations still run every night to detect a stale equivalence — **merged → §10 "Mark a mutation equivalent only with a receipt"** (flagged below).
- Timings — **history only** (measurements).

### The defect register — every math error this board has shipped
- Every math defect gets an entry naming its check and mutations; the stage fails if a mutation id disappears — **kept §10**.
- Write the symptom as the person saw it — **kept §10**.
- It asserts guards exist; the sweep proves they bite — **history only** (rationale).
- `guarded:false` is debt, reported — **kept §10**.
- `coverage:money` fails three ways (unregistered, dead registry name, paid gap) — **kept §10**.
- A fixture that cannot reach the code it aims at (split walked first) — **kept §11**.
- When a check defends an ORDER, RULE or CHOICE the fixture makes the alternatives disagree — **kept §11**.
- A new check is not finished until a mutation has survived against it once / made it go red — **kept §11**.
- A gap is debt, not a pass; fails the moment a new one appears — **kept §10**.
- Watch the gate: gate on the exit code, banner count reported, legacy line asserted — **kept §10**.

### The sweep runs on Brad's named go (20 Oct 2026)
- mutate.mjs text only during development; `mkmut.py`, `mcount.py`; never import mutate.mjs; never `npm run mutate`/`validate:math` — **kept §1**.
- Prove a new check on the board and on its own mutant — **kept §1**.
- A sweep only when Brad names one, committed tree, saved batches, nothing else running, reports and changes nothing — **kept §1**.
- Why not drop the sweep (~880 targets proven one at a time) — **history only** (state of the day; item 167 tracks it).
- Show only what changed (21 Oct 2026) — **kept §1**.
- The nightly runs every stage but the sweep (`validate:nightly`); its pass line says so — **kept §10**.
- The sharded sweep: cutting, calibration, verdict, order, proof — **history only** (tool design; command named in §1).
- `sweep-shards.mjs` resumable via `results.jsonl` — **kept §1** (saved batches) / history only (flag details).

### Measuring the suites — run this after adding checks
- `npm run mutate` commands — **history only** (only on Brad's go; §1 says so).
- NOT APPLIED is never caught — **kept §10**.
- NEVER EDIT A SUITE WHILE A SWEEP IS RUNNING; commit first, sweep the committed tree; if a suite must change, kill and restart — **kept §10** (and §1 committed tree).
- Every surviving mutation: add the check, do not delete the mutation — **kept §10**.
- Conservation is not enough (lane oracle re-derives the walk) — **history only** (suite design; principle merged → §11 derive from fixture).
- A check that cannot run reads as a pass — **kept §11**.
- An oracle that asks the code under test will agree with it — **kept §11**.
- A path with no fixture has no coverage — **merged → §11 "fixture that cannot reach its target"**.
- A figure the board shows but never exports needs `audit-board.mjs` — **history only** (where-to-add guidance; flagged below).
- Read the rendered page, do not recompute; a pattern that no longer matches is a failure — **kept §11**.
- `typeof x === 'function'` on an out-of-scope name fails open; call the helper — **kept §11, §13**.
- A rendered figure with no assertion is decoration — **kept §11**.
- A scenario absent is a rule untested (no starred requirement) — **merged → §11 "ask what value makes the thing matter"**.
- "Nothing else moved" checked on everything — **kept §11**.
- A string check in a numeric harness; widen the comparator with the assertion — **kept §11**.
- Equivalent only with a receipt (asserted invariant) — **kept §10**.

## Never commit a populated board
- `pubState` null, `APPNS` empty, `check.mjs` enforces — **kept §1**.
- Describe the data shape rather than uploading the board — **kept §1**.

## How it saves — read this before changing anything structural
- `SRC0` capture; `buildSavedHtml()`; `savedHtmlOf` one assembly — **kept §4**.
- `saveInPlace()` via File System Access, handle under the page's address, Open window first, `saveDrops` — **kept §4**.
- Collision guard by identity (`LASTKNOWN`) — **kept §4**.
- A file it cannot read or not a board is never written over — **kept §4**.
- One save at a time (`saveSerial`, Web Lock), `_saveGen`, one writer (`WRITER`) — **kept §4**.
- `pubState` tag's literal shape is load-bearing; `check.mjs` guards — **kept §4**.
- localStorage is a cache; the file is the record — **kept §4**.
- The storage key list — **kept §4** (summarised, full list pointed to HISTORY.md "How it saves").
- `<key>.base` carries `blank:true` (stray rule) — **merged → §4 stray rule**.

## Hand-edit points
- Table (BUILD, FNAME, fiscal year, APPN_SLUGS); find by symbol not line — **kept §12**.
- Bump `BUILD` on every functional change; `LIVE_VER` separate, raise only on wire-format change — **kept §12**.

### Adding or removing an appropriation
- Six tables change together; a missed slug does not throw — **kept §12**.
- `APPN_SLUGS` stays in the first module (`FLOW_APPNS`) — **kept §12**.

## File map
- Regions and line ranges — **kept §12** (summarised, without line numbers, which have drifted).
- The XLSX writer carries its own stylesheet; the PPTX template removed — **kept §12** / history (PPTX).
- The reader uses `DecompressionStream`, no zip library — **kept §12**.

## Section 508 / WCAG 2.2 — the one outside standard
- `npm run standards` measures against 36 CFR 1194 / WCAG; every finding names its criterion — **kept §9**.
- Measures what the browser painted, on a populated board, every theme — **kept §9**.
- Findings grouped by problem, not instance — **kept §9**.

### The baseline is debt, gated — never a pass
- New finding fails; a recorded finding that stops occurring fails; `--emit` and name the closed criterion — **kept §9**.
- 2.1.1 Keyboard: click handler on a non-native element fails; `check.mjs` holds the same against markup — **kept §0, §9**.

### Never print a band's hue as text — derive a readable one
- `readableOn()` derives; never hand-picked — **kept §9**.
- `bandInk` removed in v2.03 — **history only**.
- Rank ▲▼ meet 2.5.8; measure before assuming a bigger control costs height — **merged → §9 24×24 rule**.

### The name: ORBIT, formerly SPMT (v1.81)
- Rename is display only; `spmtTheme`, `spmtSeen`, `spmtPkg` keep the old prefix and must not be tidied — **kept §4, §12**.
- File names keep their names — **kept §12**.
- Routines' attached repository via redirect; repo renamed by hand — **history only** (one-off event).
- After a rename the new repository name must be attached (add_repo) — **kept §12**.

### v1.83: BAE budget names by rule …
- No list of budget names in the program — **kept §2**.
- `BUDDB` one list for the whole board; older layouts read via `budSrc()` — **kept §2** (one list) / history only (`budSrc` migration).
- The rule (legacy, hand, exclude, service/PMO/lane, Full Fund by cost element, CCaR tiebreak) — **kept §2** (as now: v2.24 replaced the CCaR tiebreak with "Not set, picked by hand").
- A budget is per service and lane — **merged → §2 BAE rule**.
- Spend Plan Source carries mandatory dollars (SRC_BASIS='funded') — **kept §3**.
- No BAE list → Budget blank; asks before writing a file with a blank Budget — **kept §3**.
- CCaR reconciliation on the funded basis — **history only** (ORBIT vs CCaR removed v2.24).
- Two Spend Plans lists every requirement — **kept §3**.
- Cost element order (PES #8) — **history only** (data detail).

### v1.84: the PMO copy does the legwork …
- Every field but the allocation travels — **kept §5**.
- A copy says which field set it carries (`PMODE.pv`, `PMO_PV=2`); `pmoVal()` reads absent/empty alike — **kept §5** (PMO_PV stays 2) / history only (pmoVal detail).
- Checked at the door field by field (`pmoNorm`): left out and named, never shaped to fit — **kept §5** (pmoTake normalises).
- Scope by the office at publication (`pmoHomeOf`) — **kept §5**.
- The office's own ranking travels, applied only to `S.pmoOrder[office]`; must not call `jrnlSync()` first — **kept §5**.
- The allocation is locked in a copy (`allocLocked()` in every writer) — **kept §5**.
- A copy points to Submit input, never Save — **kept §5** (now also Save of the office's own file, v2.09).
- A refused appropriation switch puts the box back — **history only** (detail).
- One appropriation back from a consolidated file (`consTakePick`, nothing by default) — **kept §5**.
- "What did I change since the file left" is read from the journal (`pkgMineSince`) — **history only** (implementation detail).
- The preview names every container (`pkgDiff`) — **history only**.

### v1.85: the five-year spend plan by PMO …
- PMO tabs etc. — **history only** (workbook rebuilt in v2.04).
- Other appropriations are read by opening each as its own board, never recomputed (no second engine) — **kept §7** (in the cycles rule).
- Checked before a figure is used; refused blocks say so — **history only** (`fydpTake` detail).
- Data-loss fix: a save kept only the cycle stores this browser held (`CYC_FILE`, `cycStoreOf`) — **history only** (defect, fixed).
- A PMO copy's workbook stamped on every sheet — **merged → §3 "Name and title through the choke points"**.

### How changes ship: queued, then one version on "go" (from 23 Sep 2026)
- Log in NEXT-VERSION.md; nothing changes until go; on go build, gate once, bump once, push once, move to Shipped — **kept §1** (Shipped now SHIPPED.md; "gate once" now the gate Brad's rules allow).
- Logging commits NEXT-VERSION.md alone — **kept §1**.
- Investigating before go is fine; changing the board is not — **kept §1**.

### The logo: the O is the orbit (v1.82)
- Inline in the header (one-file rule; mask id `logoO`) — **kept §12**.
- Favicon a percent-encoded `data:` URI (raw `&amp;` breaks it) — **kept §12**.
- One colour elsewhere (`currentColor`, `--orbit-accent`) — **history only** (asset detail).
- The lockup is for large uses only — **kept §12**.
- `gen.py` regenerates — **kept §12**.

### A check that greps the serialised world fails on the clock
- A check must test the thing, not a substring of everything — **kept §11**.

### The cost estimate beside the five-year plan (v1.80)
- Entire section — **history only** (cost estimate removed v2.19).

### The PMO menu never opened, and the menu check never looked (v1.78)
- `syncBtns()` reads the toolbar off the page — **history only** (toolbar replaced by the left menu).
- A check with a hand-kept list cannot fail on what the list forgot — **kept §11**.

### 1.4.11 and 2.5.8 closed …
- `--edge` per theme (3:1 on every surface), `--edge2` hover (4.5:1); controls draw edges in `--edge`; dividers keep `--line` — **kept §9**.
- Every pointer target ≥ 24×24; inline targets grow by padding — **kept §9**.
- `[onclick]` weighs as a class, so specific rules must name the attribute — **history only** (CSS detail; flagged below).

### 1.4.3 closed: the dim ink clears 4.5:1 …
- `--dim` walked to clear 4.5:1 on the worst surface — **kept §9**.
- A criterion that cannot fire reports a vacuous pass — **kept §9**.
- Findings keyed by colour pair, not control — **merged → §9 "grouped by problem"**.
- The 16 Sep baseline table — **history only** (measurement).

### v1.86: one destination list, the editors on top, mandatory in the months, …
- `DESTDB` one list; keys meaningful only beside their list; every plan carries its list; `destMigrate` — **kept §7**.
- Locked cycles re-pointed once and marked (`CYCDB.dv`) — **history only** (migration).
- `flowEntsAZ()` / `flowEnts()`; delete refused while in use; tombstones — **history only** (implementation detail; `flowEntsAZ` per-draw cache in v2.24 noted).
- The migration calls `flowCfg()` not a bare object — **history only**.
- Written editors at the top of the RECORD panel — **history only** (superseded by v2.08 edit box, v2.22 card).
- Description & note pop-up writes only the changed part — **merged → §8 edit box (writes only what changed via `reqApply`)**.
- Mandatory lands in the months by one rule (`landSvc`) — **kept §2** (as v1.93 restated it).
- The CR views and the 1A9A adopt the rule — **kept §2** (one landing rule).
- What does not draw is found, flagged and fixed (`ndData`) — **kept §2**.
- Full imports (`fullImportText`), reports survive reload, refuses pre-v1.80 — **kept §5**.
- `importStores` merges per appropriation; `cycTake` takes cycles for every appropriation taken — **history only** (defects fixed).
- The guide is inside the file; never opens itself; menu paths `.mp[data-m]`, buttons `.bt[data-q]` checked — **kept §8**.
- `check.mjs`'s external-link rule reads one tag — **kept §0** (one tag at a time).
- `audit-recon` finds deck tables by header — **history only** (deck removed).
- A test of a guarded path has to meet the guard — **kept §11**.
- Run each block as `await (async () => {…})()`, close boards, let the loop turn; sweep caps heap — **kept §11** (free boards) / history only (heap cap detail).
- `fld-stale-stays-open` lesson (kinds from `FLD_DEF`) — **history only** (FLD_DEF removed v2.08).
- Boot sets the program in rather than parsing it; `BOOT_PARSE=1`; `boot-same.mjs` — **kept §10**.
- The sweep tries last catcher first (order only) — **merged → §10 `FIRST_BY_PREFIX` / order only**.

### v1.87: the math gate, shortened (tests only)
- `keepBoards()` spread a 3.2 MB string — spread objects only — **history only** (defect fixed).
- `SUITE_CHECKS=<file>` records every check — **history only** (tool option).
- `stopAtFirstFailure` under `MUT_FIRST_FAIL=1`; write with `writeSync`; safe because no suite removes a failure — **kept §10** (MUT_FIRST_FAIL) / history only (detail).

### v1.88: one board file, and a file from someone else is data …
- One build; `row-controls.mjs --check` — **kept §0, §8**.
- `inboundCheck(txt)` reads a whole file before use; `inRefuse` one message; at every door; `inTooBig` — **kept §5**.
- What a file may carry (limits, prototype names, numbers, amounts, text, ids, names, band colours) — **kept §5, §6**.
- Fields the door does not recognise are left as they are (not dropped) — **kept §5**.
- `esc()` covers the single quote; `jsa(v)` is the only way into handler code; `check.mjs` "handler values" — **kept §6**.
- `readableOn()` turns non-hex band colours grey — **kept §6**.
- `audit-hostile.mjs` and `hostile-render.mjs`; each planted field must be seen — **history only** (suite design; flagged below: "a field never drawn cannot pass by not being looked at").
- `IN_KEY_BAD` is a Set (object literal answered from the prototype) — **kept §6**.
- jsdom drops markup inside `<select>` — **kept §11**.
- When a change rewrites handler text, search `mutate.mjs` for the old spelling — **kept §10**.
- Workbook imports not covered by the door; their text is drawn escaped — **history only** (stated limit).

### v1.89: whole dollars on every add, work never overwritten unasked, ids that never repeat
- A requirement added by its total goes through `apportion`; non-whole values refused — **kept §2** (every proration).
- A cell formatted to show whole dollars must hold one — **history only** (check rule; flagged below).
- `REQ_MAPS` one list; `reqPurge`, `newReqSeq`, `T.newSeq` never reused — **kept §7**.
- Removing a board requirement keeps its fields; deleting an added one purges — **kept §7**.
- Fuzz TRIP 5 reads `REQ_MAPS` from the board — **history only** (tool detail).
- Which saved copy work came from is kept in browser (`<key>.base`), never in the file — **kept §4**.
- Save compares by identity, not order; unsaved is a flag, never two clocks — **kept §4**.
- Opening a newer file keeps unsaved work aside; no room → not opened — **kept §4**.
- `saveInPlaceFile` refuses a file it cannot read or not a board — **kept §4**.
- A download does not clear unsaved — **kept §4**.
- The shared folder: checkpoint persists; clash offers Load theirs / Save yours over theirs (theirs kept first) — **kept §4** (folder rule) / history only (button detail).
- `driveStoreRead` null only on NotFoundError — **kept §4**.
- History names never repeat — **history only** (defect fixed).
- The journal says what it could not record (`(more)`, `(unrecorded)`); not undoable — **kept §7**.

### v1.90 (item 27): the layout …
- `#topStack` one sticky element; controls keep their ids — **history only** (layout superseded by the left menu/APEX look; ids rule flagged below).
- `fitTop()` measures, never guesses a breakpoint; steps — **kept §8** (fitTop steps).
- Menus grouped by task, by the same calls — **merged → §8 left-menu map**.
- Modes and densities are this browser's, never the board's; a mode changes no figure — **kept §8** (quote) / §4 (keys).
- The row as triage; drag starts only from ⠿ — **kept §8** (quote names ⠿).
- Selection and focus differ (`--sel`, focus ring) — **history only** (CSS detail).
- The status line beside the save state — **history only** (superseded by v2.03 messages).
- `layout-fits.mjs` A–H; each proved against a planted defect — **history only** (check facts).

### v1.91 (items 28–35)
- "lane short" on two lines — **history only** (superseded by v2.01's fit rule).
- The message button; a `role=status` is visually hidden, never `display:none` — **kept §8**.
- Record fields are buttons — **merged → §9 "every clickable element is a native button"**.
- Modes are buttons with `aria-pressed`, no tab roles — **kept §9**.
- 761–1023px; below 760 review only — **kept §8**.
- What the row may edit (quote) — **kept §8**.
- One Chromium lookup (`tools/chrome.mjs`) — **kept §10**.
- The BAE budget in the RECORD panel (`budRecordHtml`, `budLines`, …) — **history only** (implementation detail; the rule "budResolve is the authority" kept §2).
- A name chosen for one lane is never used on the other — **merged → §2 BAE rule (lane matches exactly)**.

### v1.92 (items 18, 36, 37)
- `budResolve()` one authority; an unusable choice is never replaced by the rule — **kept §2**.
- A line with no money resolved as the discretionary lane — **kept §2**.
- `budLineClear` deletes the stored key, never a value worked out from the rule — **history only** (detail; flagged below).
- Funding-line discovery never looks at budgets — **history only** (detail).
- The IDS export — **history only** (removed v2.19).
- Every clickable element is a native button; `role="button"` only on labelled SVG groups; no ARIA menu roles — **kept §9**.
- A redraw keeps the keyboard's place — **kept §8**.
- Dialog focus deferred — **history only** (built in v1.93).
- Save diagnostics: nothing sent; never put a raw value into `DIAG` — **kept §6**.
- `csvCell` — **kept §3**.
- `buildXlsx` writes an integer verbatim — **kept §3**.
- Test against the exact starting state, not after earlier writes — **merged → §11 "Measure before anything has run"**.

### v1.93 (items 39–44)
- One landing rule; discretionary forward, mandatory backward; uncovered = UNSCHEDULED; share applied after the fill — **kept §2**.
- The award block's split, `fillLastAwd` by date, `toggleAwdInc` seeds d+m — **history only** (implementation detail).
- The forecast by view (`fcViewData` drawn and exported, so they cannot differ) — **history only** (detail; principle §13 one implementation).
- Needs attention lists (`attLists`) — **history only** (implementation detail).
- `fitMenus()` positions every menu by measurement — **kept §8**.
- One controller for every box: shape, `dlgSync`, inert, Tab trap, Esc asks if dirty, `data-held` — **kept §8**.
- jsdom observers are async: call `dlgSync()` in tests — **kept §11**.
- IDS Approved by lane — **history only** (IDS removed).

### v1.94 (items 45, 46)
- The award's date alone places CR cash; `awdDay`; `S.crHalf` decides nothing, carried — **kept §2**.
- `crMovedList()` / `crClearOldMarks()` — **history only** (implementation detail).
- `awdCmp` the one award order; equal dates keep stored order; check refuses other sorts — **kept §2, §0**.
- On a slow container ask Brad before running the gate outside the cap — **merged → §1 (sweeps/gate only on Brad's go)**.

### v1.95 (items 47–60)
- A save acknowledges exactly what it wrote; one save at a time; a queued folder save refuses a changed year — **kept §4**.
- Work kept aside is never replaced without asking; `'occupied'`; put back swaps — **kept §4**.
- One writer per board file; cooperative only; folder permissions are the guarantee — **kept §4**.
- A full import is all or nothing (`lsAll`); rescue files; the mixed hold blocks writes to the file — **kept §4**.
- Sharing a cost estimate — **history only** (removed v2.19).
- `savedHtmlOf` one assembly — **kept §4**.
- The journal keeps fiscal years apart — **history only** (implementation detail; flagged below).
- The PMO drill and spruills by year — **history only** (removed v2.19).
- Five-year plan and comparison file each year under that year's PMO — **history only** (detail; flagged below).
- The award-order checker with self-test; Windows font stand-in — **kept §0** (award order) / history only (font stand-in tool).
- The money map — **kept §10**.
- A submittal's awards follow service names (`pkgSvcEach`); refused with figures and no list — **kept §5**.
- A held submittal applies only to its own year — **merged → §5** (superseded by v2.09's five-year packages).
- One award check at every door and opening (`awdNorm`) — **kept §2**.
- `awdNorm` runs before `IN_MAX_AMT` etc. exist (read only early-declared constants) — **history only** (detail; the TDZ rule is §4).
- F1 figures stored as they are; F2 one line per increment; F3–F6 — **kept §3** (F1, F2, F6 via CLIN whole dollars) / history only (F3 synopsis removed; F5 footnote).
- Board imports that reorder services carry WBS and CLIN figures — **kept §5**.
- A workstream's presweep does not see an old target it broke: count them all after every merge — **kept §10**.
- A consumer moving away from a line turns its mutation equivalent; only the sweep sees it — **kept §10**.
- Review fixes: Publish now is the folder save; ordinary import all or nothing; Put back keeps unsaved aside; hold lifts when keys written — **kept §4**.

### v1.96 (items 64–70)
- Long menus fold (`grp`), items stay in the page, one group open, `.mdd [hidden]` — **kept §8** (folding) / history only (detail).
- `syncBtns` ends with `fitMenus()` — **merged → §8 fitMenus**.
- Guide paths name their group — **merged → §8 guide paths checked**.
- Browser checks reach the repaired-award controls — **history only** (check fact).
- `.modal .x` meets 1.4.11 and 2.5.8 — **merged → §9**.
- NR01 Put back decides the keep after the last await — **kept §4** (read again after any wait).
- NR02 several boards commit through `lsAll` — **kept §4**.
- NR03 reprogramming share — **history only** (share removed v2.02).
- NR05 the legacy shared state file keeps work aside; timestamps never decide local work is disposable — **kept §4** (unsaved is a flag).
- NR04 a repaired award's original kept whole in pieces — **kept §2**.

### v1.97 (items 62, 72–81)
- `amtRead` reads the whole entry; `parseAmt` null/NaN; `amtNo`; all callers audited; `amtReadM` — **kept §2**.
- `setBATot` and `clinSetReq` spread with `apportion` — **merged → §2 every proration**.
- `svcAlloc` floors at 0; saved negatives listed — **kept §2**.
- `scalarSrcVec`; both read it — **kept §2**.
- Every list the file carries marks it unsaved via `lsSet()`; side lists stay out of `DIRTY` — **kept §4**.
- Import/restore/folder fixes (77–79): refuse a locked cycle first, two files for one appropriation, service set; pins before first await; keep exact bytes; prune only after landing — **kept §4, §5**.
- Service list edits (item 80) — **kept §5**.
- The reprogramming log (item 81) whole dollars — **history only** (tracker removed v2.02; carry rule kept §5).
- The nine money-map cells; `fsDirVec` — **kept §2** (fsDirVec) / history only (cells).

### v1.98 (item 83)
- `rcnOfClinSvc` the rule; every RCN surface asks it — **kept §3**.
- A key the list does not hold is NONE — **kept §3**.
- `aceAlignRows` — **history only** (ACE removed).
- Hygiene: `rcnDel` clears CLIN maps; added CLIN removal clears its maps — **history only** (detail; flagged below).

### v1.99 (items 85–98)
- `apportion` is exact (BigInt) — **kept §2**.
- A batch that cannot be put back: `lsPutBack`, rescue, hold — **kept §4**.
- The whole $M entry — **history only** (reprogramming removed).
- A cycle's own RCN/EEIC list stored on the lock — **kept §7**.
- Quantities `qtyRead`/`buyDollars`; constants read through a function during early `applyState` — **kept §2** / history only (detail).
- Codes `codeTake`: refused, never cut, typing kept — **kept §7**.
- `clinListRO` for reads that must not create entries — **kept §4** (a read never writes).
- Funds flow scope — **history only** (removed).
- ACE tie-out estimate-only offices — **history only** (removed).
- Side lists staged; across a reload (`sideBootNote`); opening writes no new time unless a key moved — **history only** (implementation detail; flagged below).
- An estimate's earlier copies — **history only** (removed).
- Classify counts CLINs with own RCN — **history only** (detail).
- What a cycle keeps (help text) — **history only**.

### v2.00 (item 99)
- Escape where drawn, however it arrived; look at siblings of a fixed sink — **kept §6**.
- Escape where drawn and nowhere else; text forms vs markup forms; decode with `diagPlain()` — **kept §6**.
- `wholeOr` for year/sequence fields on load; counts drawn as whole numbers — **history only** (implementation detail; flagged below).
- Structural guards (`jrnlPathSafe`, `inShapeWhy`, `pkgApply` seq/ap, `confSameHost`, `linkOpenable`) — **kept §7** (journal path) / history only (Confluence removed; others detail).
- Built-in names: the door refuses; `IN_VAL_KEYS`; workbook maps `Object.create(null)`; fixed tables read by own key; never key an ordinary `{}` by imported value — **kept §6**.
- Section banners (`// §NN`) — **kept §12**.
- PPTX template fence — **history only** (deck removed).
- A runtime check must call the board's function, not build its own markup — **merged → §11 "Read the rendered page; do not recompute"**.
- A K-check input must reach only the rule it is for — **merged → §11 "fixture makes the alternatives disagree"**.
- A mutation's catch is claimed only from a run that saw it fail — **merged → §10 (prove each mutation; NOT APPLIED/CRASHED not coverage)**.
- `FIRST_BY_PREFIX` order only — **kept §10**.
- The lean gate and what was not run — **history only** (one-off).

### v2.01
- Before pushing for a PR, check `merged` — **kept §1**.
- `_xesc` writes CR as `&#13;` — **kept §3**.
- A text check on an export reads the bytes like another program — **kept §11**.
- The RECORD panel prints nothing it cannot show whole (`.fig`, `inspSplitFit`); a new control must pass layout K — **history only** (superseded by v2.22's card; flagged below).
- A PID is up to 35 characters — **history only** (data detail; `codeMax` holds it).

### v2.02
- ATR/BTR tracking removed — **history only**.
- The log is carried byte for byte; its service meaning kept through service edits — **kept §5**.

### v2.03
- Unreachable code is found by a call graph, not a name count — **kept §10** (`npm run deadcode`).
- `render()` keeps its wrapper — **kept §8**.
- A message that matters stays until read; `statKeep()` for an import's result; session only — **kept §8**.
- Shown as text so an old message's buttons cannot act — **history only** (detail).
- `REQ_FIELD` registry; code compares keys; a new field gets an entry first; first slice moved as touched — **kept §8**.
- Two browser checks failing unseen; run keys/dropdowns/dialogs/leftmenu/standards yourself — **kept §10**.

### v2.04
- The CCaR record name is read, never copied; Description is the person's text — **kept §7**.
- The AI review — **history only** (removed v2.19).
- Clear this computer; a new storage key must start `prio27`/`spmt` — **kept §4, §6**.
- Confluence, SharePoint, JSON endpoint removed; do not bring a network transport back — **kept §6**.
- The CSP and `npm run csp` (read from the violation event) — **kept §6**.
- The five-year workbook rebuilt (`fydpBookModel`, Allocated = d+m) — **kept §3**.
- Every report workbook passes `xlsxHouse`, or is listed with its reason; values dressed = plain — **kept §3**.
- recon and import need `git fetch --unshallow` and an 8 GB heap — **kept §10**.
- A `let` that `syncBtns` reads is declared beside `let MS` — **kept §4**.
- Mutation ids are single-quoted — **kept §10**.

### v2.05 (items 114–116)
- The deck, synopsis and executive decision removed; `edCompute`/`edWalk` stay for Preview proposed order — **history only** (removal; flagged below).
- Reports & exports: plain lists, title case, format tag, Find with Pre-Flight — **kept §8**.
- Find reads the tag's words; taking words out of a title is a search change — **kept §8** (Find reads tags) / merged.
- No icons on the left menu (`uiPlain`); nav entries keep theirs — **kept §8** (nav icons removed v2.21).
- Side panels must not scroll sideways (`leftmenu` G) — **history only** (check fact).
- Each appropriation's lock named (`cycApTxt`), Locks by appropriation, Go to — **kept §7**.
- Locking stays on each appropriation's own board (no second engine) — **kept §7**.
- Who can lock is not enforced; "the Azure build would enforce the role" — **kept §7, restated for local-only** (folder permissions are the guard; no sign-in planned).
- A change of wording is a change to every suite that quotes it: grep before the run — **kept §10**.
- A test inside `ev(\`…\`)` is a template literal — **kept §11**.

### v2.06 (items 117–120)
- From another year makes a new linked requirement (`it.prior`), not Copy to year — **kept §7**.
- An added requirement's id is its year's own; match by id only for board data — **kept §7**.
- PPBE positions box: label width, totals, $K; the model stays whole dollars; `P.kx` undo — **kept §7**.
- Review fixes: linked requirement is the same work (`yearLinkOf`); proposals carry renames; $K survives rename; ALL SERVICES adds its column; `reqNewId` safe; Reset year keeps numbers; copy submits only its year — **kept §7** (same work, numbers) / history only (rest: detail).
- Second review: `svcListBlock` refuses a rename onto a name a position holds — **kept §5**.

### v2.07 (item 121)
- Add requirement is one box (`#addPanel`), drawn once, toggled by `render()` — **kept §8**.
- One office per box; a keyboard move only moves — **kept §8** / history only (key detail).
- What the box holds and not (Brad's list) — **history only** (feature detail; flagged below).
- `reqNeeds(draft)` one required list; a budget asked for only where one can be chosen — **kept §7** / history only (waiver detail).
- `reqCreate` one writer — **kept §7**.
- Fits whole at 1366×768 — **history only** (layout fact; layout M).
- The reviewer sees what the box required — **history only** (detail).
- `budParseName` escaped office names; `budReg` cache keyed on offices — **history only** (defects).
- Review fixes: same work by name only where there is a name; what the form holds is never thrown away; the queue — **kept §7** (same-work needs a title) / history only (queue detail; flagged below).

### v2.08 (items 122, 123; F1–F7)
- One edit box; a held draft; `reqApply` one edit writer; refuses when changed under it — **kept §7, §8**.
- No money in the edit box — **kept §8**.
- The required list warns — **kept §7**.
- A PMO copy says up front when an edit will not be sent (`erNotSent`) — **history only** (detail).
- Kept as saved: a stored value the lists don't hold is offered as itself and left alone — **kept §4**.
- The review compares as read, not stored (`pmoBare`) — **kept §5**.
- A rename is an override filed by id — **merged → §7 journal (filed by id)**.
- F2 in Chromium: change fires on removal; `inspHeldBack` — **kept §8**.
- Fire a stand-in event where the browser fires it — **kept §11**.
- `prove.py` runs only named blocks; run every suite whole before calling a fix done — **kept §10**.
- Defects F1–F7 (`setBand`, `setGrp`, `destOf`, `clinLocked`, field ids in Classify, absorber locked) — **kept §5** (clinLocked, allocLocked) / history only (rest: defects fixed).
- Item 123 security review kit — **history only**.

### v2.09 (items 125–128)
- A click on a control uses the control; pressed control survives a redraw (`PTR`) — **kept §8**.
- The F2 hold covers the rows — **kept §8**.
- A CLIN's request is per service; `clinGo` the one route into the drill — **kept §2** / history only (clinGo).
- A check of a pointer path clicks with a real pointer — **kept §11**.
- A PMO copy carries every year of the FYDP; `PMO_PV` stays 2 — **kept §5**.
- Save in a PMO copy (`pmoSaveCopy`, the office's own handle, `MS.pmoFor`) — **kept §4**.
- A PMO copy comes in only through the PMO import screen — **kept §5**.
- A new storage key a copy writes is sealed with `SIDE_SFX` — **kept §4**.
- The SI tab by code — **history only** (feature detail).
- A link to a proposal names the copy that minted it; a fallback looser than its rule is a defect — **kept §5** / flagged below (the general lesson).
- A control is found again by what names it, only where that item still stands — **kept §8**.
- The boot writes storage only where it has just kept unsaved work aside — **kept §4**.
- The office belongs to the page and follows the work — **history only** (detail; flagged below).
- Prove every mutation together on the merged board — **kept §10**.
- A copy takes nothing through a board door, gives nothing out except Submit — **kept §5**.
- `validate:nightly` gives suites 8 GB — **kept §10**.

### v2.10 (item 130)
- FYDP Disconnects — **history only** (removed v2.19).
- A service grouped by its name; a sheet that should add up to another is checked by adding it up — **merged → §11 "Check an identity on every row… enumerate"** (flagged).
- Another appropriation's folder copy read strictly (only NotFoundError means none) — **kept §4**.
- A redraw on a change event waits when a pointer is moving the keyboard — **history only** (detail; flagged below).
- `buildXlsx` new options opt-in; an indent needs a horizontal alignment — **kept §3**.
- On-screen band text navy (contrast) — **history only** (feature removed).
- A fix round that runs only some suites leaves others' expectations unrun — **kept §10** (run every suite whole).

### v2.11
- Entire section — **history only** (FYDP Disconnects removed). Lessons: size a wrapped row by lines its words wrap to — **history only**; a box note and workbook note from one string — **merged → §13 one implementation**.

### v2.12 (items 132, 134)
- ACE import by header titles, the tree, PSM inside Air Vehicle — **history only** (ACE removed v2.19).
- WBS picked from the ACE — **history only** (v2.19: WBS is typed; kept §7).
- `wbsStateOf`, Without a WBS reads the export's own lines — **history only** (detail).
- Every year's budget read live from the PPBE position (`baOf`, `baLiveAll`, no save) — **kept §2**.
- One figure per line is one rule (`ppLanesOf`) — **kept §2**.
- `cycLock` tags an untagged plan before projecting; keeps `pos` — **kept §7** (tags) / history only (pos detail).
- The fit model; UPL last line, never on the Spend Plan Source — **kept §2**.
- The door holds every position to the shapes the board reads (`inPosWhy`) — **kept §5**.
- A stored value has one reader, and a box never rewrites it on opening — **kept §4**.
- A rule written in two places is two rules — **kept §13**.
- Code moved onto the draw path meets every shape a file can carry; make the reader unable to throw and let the door refuse — **kept §5**.
- A header is read by title, never position — **merged → §11 "Locate every cell by name"**.
- The year on screen hides a missing refresh — **kept §11**.
- Measure before anything has run — **kept §11**.
- A retarget is a new mutation and needs its own proof — **kept §10**.
- A later round's fix can put an earlier mutation out of reach; prove together — **kept §10**.
- Run `mcount` and audit-inject after every merge — **kept §10**.
- The guide's size is what the browser draws — **kept §8**.
- Two proof runs never share a tree — **kept §10**.
- A browser check never sets storage from an init script; seed from a page of its own — **kept §11**.
- Left as found / known gaps — **history only**.

### v2.13 (item 136)
- One PPBE cycle for the board, chosen in `#m_cyc` — **kept §7**.
- `cycApplyAll` reads again after the question; never key a write to another appropriation off a copy read before a wait — **kept §4, §7**.
- What counts toward Mixed; a key is a cycle only by `cycKeyOk` — **kept §7**.
- A change of cycle is one journal line, never put back — **kept §7**.
- The figure is read, never worked out on a draw path — **history only** (detail; flagged below).
- A PMO copy shows its cycle read only — **history only** (detail).
- A test fixture's time must be able to lose — **history only** (flagged below — a check-writing lesson not restated).

### v2.14 (items 140, 141, 129, 124; U35, U63, U64)
- Save writes only to its own file; handle under the page's address; `FNAME` only released — **kept §4**.
- The first Save goes through the Open window; the Save window empties a chosen file — **kept §4**.
- `saveDrops`, `saveDropsAsk` — **kept §4**.
- A Save that stops puts storage back only while this page wrote it last — **kept §4**.
- No borrowed save; one record writer (`baseMarkDirty`); the stray rule — **kept §4**.
- A full import too big for storage goes into a new file — **kept §4**.
- E1/E2 import paths; after landing records dirty; trims nothing — **history only** (detail).
- Browser storage refused or full: `memOnlyNow`, leaving asks, `reopenPage`, doors refuse — **kept §4**.
- Put back means as saved (`lsMarks`) — **history only** (detail; flagged).
- Writer key and editor name kept for the page — **history only** (detail).
- Packages and other appropriations read `apStoreOf`; held → refuse and say why — **kept §4**.
- Item 129: `baseMarkDirty`; twin rule reads the copy stamp — **kept §4** / history only (stamp detail).
- Item 124: journal files an added requirement's fields by id — **kept §7**.
- Older ORBIT lines shown, not offered (`jrnlOlderLine`) — **history only** (detail).
- `customMend` mends a damaged added-requirement list — **history only** (detail; flagged).
- U63/U64/U35 — **history only** (defects).
- A new storage key starts `prio27`/`spmt`; a copy's sealed with `SIDE_SFX`; writes through `lsSet`/`lsAll` — **kept §4**.
- A var the opening sets is declared above the opening — **kept §4**.
- Nothing remembered before every check passes; no page reaches another's handle — **kept §4**.
- Every deliberate reopen is `reopenPage()` — **kept §4**.
- A guard that tells two kinds of record apart is checked with both — **merged → §11 "fixture makes the alternatives disagree"**.
- Browser check rules (storage event, both pickers, empty on pick, wait by clock, let writes finish) — **kept §11**.
- A fix that departs from a contract decision says so — **kept §1**.
- `strayOther` and `_bootStray` are one rule written twice — **merged → §4** (since v2.15 one rule, `strayRule`).
- Run heavy suites one at a time; exit 137 is the container — **kept §10**.
- Run every suite whole on the merged tree — **kept §10**.

### v2.15 (items 137–139, 142–146)
- The context bar is one line; `fitTop` steps — **kept §8**.
- An incoming plan keeps this board's cycle; Retag moves every locked appropriation; Lock refuses another cycle's plan — **kept §7**.
- `DATA` follows `_bootPre` — **kept §4**.
- Save records every appropriation it wrote — **history only** (detail).
- `lsSet(key, val, what, {own, lose, say})` — **kept §4**.
- `tabWrote`, `_tabClash` — **history only** (detail; flagged).
- `strayRule` one rule — **kept §4**.
- A CLIN request read through `clinFig`/`clinAskIn` — **history only** (detail; principle §13).
- A fix in one workstream can put another's state on a path it never considered; follow every route that puts a copy back — **kept §4**.
- Judge "holds nothing" by what a plan holds, never whether the object exists — **kept §4**.
- `_pubsOwn` cleared on every write that lands; an answer spent only by the write it allowed — **kept §4**.
- A retag button is built from what OK writes; anything read before a question is read again after — **kept §4** (read again) / history only (button).
- A cache moved to another cycle is worked out again or marked stale — **history only** (flagged).
- One reader for a figure held as text — **kept §13** (one implementation).
- Stamp a reason when the line is recorded — **history only** (flagged).
- A stop before a Save's write puts back exactly what that Save changed — **kept §4**.
- Lock's refusal meets fixtures that lock a second cycle (`OLD_LOCK`) — **history only** (fixture detail).

### v2.16 (item 148)
- An added requirement's id is its own year's number; never join years by it; `fydpLineKeys`/`fydpSameIn`; a new reader spanning years reads it — **kept §3, §7**.
- `cycProjOf` rows carry `custom` and `prior` — **history only** (detail).
- A fixture must give a link something to do — **merged → §11 "fixture that cannot reach its target"**.

### v2.17 (item 149.1–149.6)
- A date box is taken when it is left; any new date box goes through these — **kept §2**.
- An award dated outside its year is listed — **history only** (detail).
- The closed drawer is inert; Esc puts a half-typed figure back; a route into a panel field opens the panel first — **kept §8** (inert, Esc) / history only (route note; flagged).
- Restore all asks first; Cancel restores nothing; a Removed-list line is not offered to Put back — **kept §7**.
- A year not started is started only on purpose; tests answer `[false, true]` — **kept §7** / history only (test detail).
- Reset to the full requirement only in Fund where it changes something; Reset priority order names the year — **history only** (detail).

### v2.18 (item 149.7–149.17)
- A row's MC short is `mcShortSvcOf` — **kept §2**.
- Unfunded counts follow the dollars (`u2N`, `fitUnf`) — **kept §2**.
- `ATT_WHERE`: a message that sends a reader somewhere names the place as it is — **history only** (flagged below — general).
- `priorGo`; never leave `curRow` naming an id across a year switch — **history only** (flagged).
- `pmoBtnLabel()` one statement; never read a label off another control's face — **history only** (flagged).
- `erOrder`; journal naming helpers — **history only** (detail).
- A box someone types in is never redrawn by its own input handler — **kept §8**.
- Help is at its size limit — **kept §8**.
- A wording change reaches every suite that quotes it — **kept §10**.

### v2.19 (item 150)
- The scope (what ORBIT is for) and the removals — **kept §0** (what ORBIT is for) / history only (list of removals, referenced in HISTORY preface).
- Removed features' data dropped on opening, never refused (`retiredDrop()`); `MS.flow` keeps destinations and rules — **kept §5**.
- The over list is the Fit box's successor — **kept §2**.
- A WBS is typed — **kept §7**.
- The BUILD stamp's exact shape — **kept §12, §0**.
- What it leaves: tests dropped with their surfaces; first sweep is the measure — **history only**.

### v2.20 (item 151)
- `ppMigPlan` one statement of a copy; source never changed; `kx` never copied — **kept §7**.
- A writer outside the journal keeps its own undo record and undoes only while the position equals what it wrote — **kept §7**.
- A copy into the tagged cycle moves the live budget; into a newer one offers the retag — **history only** (detail).

### v2.21 (items 152, 153)
- The look is one style sheet after `uiV2css`; restyles, moves no control — **kept §12** (location) / history only (no-move statement, a one-off).
- Save moved into the header; `fitTop` `tight4`; a new step goes in the `remove` list — **kept §8**.
- APEX status colours with their word; selectors through `#list .row > .lanec[...]` — **kept §9** / history only (selector detail).
- Gridlines are the gap trick; a figure box pads 2px — **history only** (CSS detail).
- The rail is gone; flyout placement — **history only**.
- Cleaner code: the call graph found nothing more — **history only**.

### v2.22 (items 155, 154; 149.18–149.53)
- One find box / palette; actions run by clicking the left-menu item; a new action is a left-menu item — **kept §8**.
- Tiles, money bar, Funded meter, title-band chips — **history only** (feature detail).
- A new filter joins all four places and the "N on" count — **kept §8**.
- The Funding page tiles; under ◨ the mandatory pot reads withheld — **history only** (flagged).
- The RECORD card; other years by the work; years filled when idle and updated in place — **history only** (detail; the by-the-work rule kept §3/§7).
- A refusal said in the record belongs to one requirement/year/view/plan — **history only** (detail).
- Closing what holds the keyboard hands it home first (`uiFocusHome`) — **kept §8**.
- A draft is a read: `reqDraftOf` under `clinReadOnly` — **kept §4** (a read never writes).
- The docked record leaves room below the table — **history only**.
- `npm run check` refuses a function declared twice — **kept §0**.
- The summary folds (this browser's) — **history only** (detail; key listed §4).

### v2.23 (items 156, 158, 159)
- The requirement page adds tabs via `REQPG_TABS`, reads the funded plan, redraws through `heldRedraw` — **kept §8, §2**.
- A new surface with money boxes redrawn by something else goes through the hold — **kept §8**.
- Rank by band is view only and keeps ◨ — **kept §2**.
- Across the FYDP writes another year through the same setter, journalled; Add to a year links to the line — **kept §8** / history only (link detail).
- Allocate holds a draft; Save re-reads every stored figure; `avSync`; draft counts as unsaved; `avDraftDrop` — **kept §8**.
- Mandatory on or off per year; `mandOn`, `mandLive`, `mandLeftOf`; exports keep Mandatory columns ($0); `yearCopy` lands $0; Put back refuses — **kept §2** (exports $0: history only; flagged).
- A block that opens boards frees them — **kept §11**.
- Update every check that counts a bar's buttons or a page's tabs in the same commit — **kept §10**.
- `pkill -f` kills other agents' runs; stop your own by pid — **kept §10**.
- A check reads an element null-safely — **kept §11**.

### v2.24 (items 160–164, as recorded in the v2.24 section)
- What Allocate prints goes through `avM(v)`, never `fM` — **kept §8**.
- Wording naming Put back follows `jrnlMandBack` — **history only** (detail).
- ORBIT takes no CCaR pull in; `EXDB` carried; do not add a reader of `EXDB` — **kept §5**.
- The BAE rule has four steps; more than one fitting is Not set — **kept §2**.
- Dead code found by `npm run deadcode`; remove what it lists unless a test calls it — **kept §10**.
- A draw reads the lanes through `tiersDraw()` and `flowEntsAZ()`; a new per-draw cache empties at draw start/end and after a save, with a check — **kept §2** (tiersDraw) / history only (flowEntsAZ detail; flagged).
- The Budget Year screens are one quiet table style; a figure never carries an inline colour inside a `tr.tot` — **kept §9**.
- `npm run standards` measures both screens with figures — **history only** (check fact).

## Colour: one token, one job
- Split a token that does two jobs (`--red`→`--unf`; `--onGold`→`--onChip`, never overridden) — **kept §9**.
- Harbor built for colour-deficient reading; unfunded neutral; nothing colour-alone — **kept §9**.
- Check colour with numbers (`npm run colours`); validator vendored — **kept §9**.
- Charts carry meaning by fill density off one blue ramp — **kept §9**.
- The checks table (chart references no lane hue; one ramp; Harbor ΔE ≥ 8; no regression; WCAG text) — **kept §9**.
- Measured ΔE per theme; baseline not a gate — **kept §9** (no theme worse than baseline) / history only (numbers).
- "The card build still defaults to Midnight" — **history only** (card retired).

## House style
- Match what is there; comments explain why, recording the motivating failure — **kept §13**.
- Errors degrade rather than throw; unknown slug falls back to itself — **kept §13**.

---

## Counts

Each line above counted once, by its first mark:

- **kept:** 534
- **merged:** 68
- **history only:** 203

805 rule lines over the old file's 127 sections (plus the title). A run of related statements a section made as one
rule is one line. Where a line carries two marks ("kept §7 / history only (…)"), part of it is a rule kept and part a detail
of the day; it is counted by the first.

## Unsure — for the lead to decide

These are true today and were left out of the rulebook to keep it short. Each could be restored as a one-line rule:

1. **Never read a label off another control's face**, and **a message that sends a reader somewhere names the place as it is**
   (v2.18). History only.
2. **A cache moved to another cycle is worked out again or marked stale** and **stamp a reason when the line is recorded**
   (v2.15). History only.
3. **A test fixture's time must be able to lose** (v2.13). History only; a check-writing lesson.
4. **The reconciliation suite's five identities** (conservation, capacity, cross-foot, row closes, agreement) and **the trace
   matrix's ok / MISMATCH / `--` (silence is not an error)**. History only as suite design.
5. **`p.d` is invariant under the discretionary-only view** — the old reason the Spend Plan Source needed no `[DISC-ONLY]` mark.
   Since v1.83 the Spend Plan Source also sends mandatory; whether it must follow ◨ or carry a mark is not stated in the old
   file either. Marked history only.
6. **An office with nothing in it is still listed** (offices section). History only.
7. **Suite order in the sweep is a cost decision; the equivalent mutations still run to detect a stale equivalence.** Merged
    partly into §10; the sweep's own design is in HISTORY.
8. **CSS lessons**: `minmax(0,1fr)` not `1fr` with nowrap content; never give a sticky header's ancestor `overflow:auto`;
    `[onclick]` weighs as a class. History only.
9. **The five-year plan and comparison file each year under that year's PMO** (v1.95 item 55), and **the journal joins an
    entry only within one fiscal year** (v1.95 item 54). History only as implementation details.
10. **Mandatory off: exports keep their Mandatory columns at $0** (v2.23). History only.
11. **The over list / ◨ withheld wording** (v2.22: under ◨ the mandatory pot reads "withheld", never "all drawn"). History only.
