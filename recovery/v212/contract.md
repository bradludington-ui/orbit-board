# v2.12: the contract between the three builders (items 132 and 134)

Brad's go: *"Go on v2.12"* (28 Oct 2026). The decided requirements are `NEXT-VERSION.md` › item 132 and item 134 (read
both whole first). The code map every builder starts from is `recovery/v212/map.md` (five read-only mappers, 28 Oct):
line numbers there are as of `4abd107`, so find code by symbol. This file fixes what the builders share and decides what
the logged items left open; where it says **Decided in the build**, report it in your notes under that heading so the ship
notes can say so to Brad.

Base: the slot commit (the commit that adds this file). Branches: `v212-w1`, `v212-w2`, `v212-w3`, each from it. Nobody
bumps `BUILD`, pushes, merges or touches another builder's slot. Integration (the lead) merges, reviews and bumps.

## Who builds what

| | Item | Slot (suites and `mutate.mjs`) | Mutation ids | layout-fits | keyboard-reach |
|---|---|---|---|---|---|
| **W1** | 132: the ACE import by header title, the import report, the WBS tree, PSM inside AV, the AV/PSM split | `v2.12 W1` | `v212-w1-*` | P | S |
| **W2** | 132: a WBS paragraph on every requirement, picked; Needs attention; Classify; the Spend Plan Source's column 23; the FYDP Spend Plan's STOVL tab | `v2.12 W2` | `v212-w2-*` | Q | T |
| **W3** | 134: budget authority read live from the PPBE position; over and under; UPL; locks keep their position | `v2.12 W3` | `v212-w3-*` | R | U |

Notes file: `recovery/v212/notes-Wn.md` (the v2.09/v2.10 sections: What was built · Decided in the build · Checks ·
Mutations · For the integration · Known gaps). Proofs: `recovery/v212/proofs-Wn.json`, `proved-Wn.jsonl` (`git add -f`).

## The shared shape: the WBS tree an estimate names (W1 writes it, W2 reads it)

The slot commit already holds the readers, in §08 beside `aceNormWbs`: `aceWbsMap(k, ap)`, `aceWbsNode(k, ap, code)`,
`aceWbsUp(k, ap, code)` (the paragraph, then each heading above it), `aceWbsPath(k, ap, code)` (names from the top down,
joined by " › ") and `wbsPickKey(ap)` (the estimate the pickers offer). **Neither builder changes their signatures or what
they return**; W1 may fix a defect in them and says so.

```js
ACEDB.sets[key] = {
  label, ts, years, appn, lines, skip, locked, by, file, fp,     // as today (map.md §1); `skip` stays (row counts)
  wbs:  { <ap slug>: { <CODE>: {n:'name', lv:<int>, up:'<PARENT CODE>' | ''} } },   // NEW, W1
  rep:  { ... the import report, W1's shape ... },                                  // NEW, W1
  cols: { sheet:'PMO Database Output', row:<0-based>, sig:'<header signature>', map:{<field>: '<title as in file>'} }  // NEW, W1
}
line = { ap, pmo, svc, wbs /* aceNormWbs form */, lv, ce /* ORBIT's cost element name, or '' */, slc /* the file's
         Support Line Category */, ccar /* CCAR Element */, cdesc /* CCAR Description */, sub, v:{<year>: whole dollars} }
```

- `CODE` is `aceNormWbs(text)` (upper case, no spaces), letters kept: `P6.2.2.1E` is not `P6.2.2.1`, `P6` is not `6`.
- A set imported before v2.12 has no `wbs`: the pickers treat it as naming nothing (they fall back as below).
- A node exists for every paragraph a kept line carries and every heading above it (the E rule below); `up` is `''` at
  the top. `n` is `''` where no CES column names it.
- Codes are per appropriation (an O&S paragraph and a PALS one never share a map).

## W1 -- item 132's import

**The header, by title, on any sheet.** Every sheet `xlsxRead` returns is searched; the header row is the row matching the
most known titles (ties: the first sheet in file order, then the first row). Titles are compared after lower-casing and
removing everything that is not a letter or digit ("Rollup Value?" = "rollupvalue"). Fields: Work Breakdown Structure,
Level, CES1–CES8, Service, T/M/S, JPO Managed, $ Type, Rollup Value?, Support Line Category, PALS/O&S, Appropriation (US
Only), PMO, US/PTN/FMS, CCAR Element, CCAR Description, and the fiscal years (every header that is a year 1991–2099).
Required: WBS, Level, CES1, Service, T/M/S, JPO Managed, $ Type, Rollup Value?, Support Line Category, PALS/O&S,
Appropriation (US Only), PMO and at least one year. Optional: CES2–CES8 (absent ones name nothing), US/PTN/FMS, CCAR
Element, CCAR Description. **Decided in the build:** the import says which sheet and row it read.

**A title that has changed.** A required field the file does not title is asked for once, in a box listing the file's own
headers (`#aceColPanel`); the answer is stored in `ACEDB.cols` keyed by the header row's signature (its normalised titles
joined), so a file laid out the same way is read without asking. Cancel imports nothing. A field still unmatched refuses
the file and names the field. Nothing is read by position. **Decided:** the remembered answers travel with the board (they
are in `ACEDB`, so a colleague's import reads the same file the same way).

**What a row is, in this order; each reason counted by rows and dollars by year, kept in `set.rep`:**
1. A row with no WBS and no dollar in any year column: not data (formatting), not counted.
2. *$ Type* not then-year (normalised value starts `ty`, or reads `then year`): left out, "other dollar type". A file with no
   then-year row is refused, naming the types it holds.
3. *Rollup Value?* = Yes (starts `y`): a subtotal, left out.
4. *Support Line Category* blank: a summary row, left out; a blank row whose *Rollup Value?* is not Yes is NAMED.
5. *Appropriation (US Only)* = MILPERS: left out.
6. *US/PTN/FMS* present and not US: partner or FMS, left out.
7. *JPO Managed* not Yes: left out.
8. *PMO* = Service Mgd: left out (its own reason, dollars by year); any other PMO not in `ACE_PMO`: left out and named.
9. *Support Line Category* not in the map (below): left out and named.
10. *PALS/O&S* disagreeing with the category (O&S with anything but O&S, PALS with O&S): left out and named.
11. The service unreadable (`aceSvcOf` null): left out and named.
12. Kept. Named but kept: a WBS whose P disagrees with PALS/O&S (PALS starts with P, O&S does not); a *Level* that is not
    the paragraph's segment count; a paragraph two kept rows name differently (the first name in file order is kept).

**The category map** (one table, replacing `ACE_APPN` and the old `ce` column), matched as titles are:

| Support Line Category | ap | cost element (`COST_ELEMS` name) |
|---|---|---|
| O&S | om | '' |
| Initial Spares | sp | '' |
| Other Proc (OPN) | opn | '' |
| Airframe PGSE / Avionics PGSE / Engine PGSE / Fixed JPO Support / JRE | ff | the same name |
| Other ILS | ff | Other ILS Production |
| PEC TRNG EQ | ff | Peculiar Training Equip |
| PEC TRNG EQ (Full Mission Sims) | ff | Full Mission Simulators |
| Production Eng Support | ff | Production Engineering Support |
| Pubs / Tech Data | ff | Pubs/Tech Data |
| Depot Activation | ff | CES2 = Software Depot Standup → Depot Standup Software; else PMO = Propulsion → Depot Standup Propulsion; else PMO = Air Vehicle → Depot Standup Air Vehicle; else '' and named (dollars kept) |

**Dollars:** the year cells are $M; `(1.5)` is −1.5 (**decided:** accounting parentheses are negative; v2.11 read them as
+1.5); each line's figure is a whole dollar at the door (`D$(v*1e6)`), so `l.v` is never fractional.

**The tree (`set.wbs[ap]`)**, from kept lines: a line's own node is named by CES*lv*. A heading at level *k* above line
*C* is the first *k* segments of *C* -- except that a line whose last segment carries a letter suffix (`….1E`) puts that
suffix on the level-*k* heading wherever its own CES*k* differs from the name an UNSUFFIXED line gives that heading
(`P6.2.2.1E` → `P6.2.2E` *ECU Propulsion* → `P6.2` → `P6`; `P6.5.1.2E` → `P6.5.1` *Government*). Names from unsuffixed
lines are gathered first. A suffixed heading inherits the unsuffixed heading's parent.

**PSM inside AV.** `ACE_PMO_ALIGN_DEFAULT` becomes PSM → AV for every estimate. An alignment stored as exactly `{}` for a
set whose year is 2026 or later is the old default (nothing in ORBIT edits the alignment): it is replaced on opening and
said once. **The AV + PSM split** in the tie-out (`aceBody` and `exportAceTieout`, by PMO): under a group of several board
offices, each office's line is the estimate of the lines only its requirements claim (a requirement claims a line when one
of its WBS paragraphs -- `aceWbsOf(id)` -- is the line's paragraph or a heading above it, by `aceWbsUp`); a line no office
or more than one office claims is on the shared line; the parts and the shared line add up to the group's estimate.

**The report** (`#aceRepPanel`, reopenable from the Data card for the newest set): the sheet and row read, the mapping,
every reason above with rows and dollars by year, every named row (capped on screen, whole in the record), the tree's
count of paragraphs per appropriation, conflicts. The status line points to it (`statKeep`). After an import the report
opens (not the Spruills, as today). The stale Spruills header button that only `alert()`s opens the real import.

**Fixtures:** every test that builds a positional ACE workbook (`__aceRows`; map.md §4A lists four) is rebuilt with a
titled header, in place, with a `// v2.12 W1:` comment. Expectations that rested on PSM being its own ACE PMO from 2026
(map.md §4C) move with a `// v2.12 W1:` comment.

## W2 -- item 132's requirements

**Picked, not typed.** The WBS panel's paragraph field, the Add box's `#arWbs`, the edit box's `#erWbs` and `wbsQuick`
offer the paragraphs of `wbsPickKey(mySlug())` for this appropriation (a `<datalist>` of "code — path" is the expected
form; keep each field a text input so the box controller, the F2 hold and the keyboard work as today). Whatever form: a
code in the list is taken; a code not in the list is refused when typed (text kept, the reason said, as `codeTake` does);
with no estimate naming this appropriation, typing is taken as today and the field says there is nothing to pick from. The
name (`aceWbsPath`) shows beside every paragraph shown. A paragraph already stored that the list does not hold is kept,
shown, and flagged -- never dropped or rewritten. **Suggestions:** paragraphs of the lines whose `ccar` (CCAR Element) is
the requirement's CCaR record are offered first, marked as suggested -- never set.

**Needs attention:** *Without a WBS* (every requirement that has none; a prime is without one when any CLIN with money has
none) with Funded dollars, and the coverage count in its heading (requirements and funded dollars with a WBS, of all);
*WBS not in the estimate* (a stored paragraph `wbsPickKey`'s tree does not hold). Each opens the edit box at the WBS (a
prime: the CLIN drill). Update the posture line, `ATT_KIND`, `attBody`, `attGo`, the comment at `let attOpen`, and the
guide's list of entries.

**Classify:** a bulk set for WBS, its options from the same list, `applies(it)`: not a prime and not a requirement already
split across paragraphs (a bulk set would erase the split); `matBulkOk` stops exempting `wbs` when a list exists.

**The Spend Plan Source's column 23** (`r[23]`, *Spares WBS*): each emitted line carries its paragraph -- `CODE` and, when
named, `' - '` and the paragraph's own name (`srcWbsPara` must read it back to `CODE`). A requirement (or CLIN) on several
paragraphs emits a line per paragraph, each line's amount split by `apportion` over the paragraphs' stored per-service
dollars (`wbsResolve`), its unassigned remainder on a blank-WBS line; the lines add to the line they replace, to the dollar.
A line with no paragraph goes out blank, and the export names those requirements (it does not refuse). No other column
moves (`QPE_READS` reads by index).

**The FYDP Spend Plan's STOVL tab** joins Full Fund's USMC-B (`SVC_ALIAS`): one tab, named STOVL whichever board is open
(**decided:** as FYDP Disconnects names it); `fydpBookVal` sums every index whose folded name is the tab's; the service
tabs still partition the appropriation tab.

**PMO copy:** `wbs` travels as today; `clinWbs` does not (**decided:** the CLIN drill is read-only in a copy, v2.08 F6).

## W3 -- item 134

**One source, read live.** `applyBudget()` is where it happens and the only place: for the year being applied (`MS.cur`),
when the working plan is tagged (`MS.cycle`) and `MS.ppbe[MS.cycle]` logs that year (any cell in that year, as
`fdcPosHeld`), each service the position names (`ppSvcsOf`) takes `ppSvcFy(P, sv, fy)` d and m (whole dollars) as its
base; a service it does not name, a year it does not log, or an untagged plan keeps the board's own base (`S.bm.disc/mand`,
never overwritten -- untagging gives it back). Added sources add on top, by pool, as today. A module-level record (not in
`S`, not saved) says where each service's base came from, for the panels. Guard the first pass at boot (`applyStore` runs at
top level, line ~7220, before the positions code's `let`s and `const`s: `ppNorm` and what it reads may be in the temporal
dead zone).

**Every year, not just the one on screen.** Every writer of `MS.ppbe` or `MS.cycle` (the cell writer, the split, lines,
delete, $K conversion and undo, retag, lock's tag, an import that brings positions, a service rename) re-applies every held
year (`aceWithYear`) so each year's cached `discSvc`/`mandSvc` -- which the Spruills, the live view and other appropriations
read straight from the stored year -- is the live figure; and once at the end of opening. Opening and refreshing write
nothing on their own (no `save()`, no unsaved mark): the caches are derived.

**Locks keep the position.** `cycLock` tags an untagged plan BEFORE it projects (so the lock is taken under the tag it gives
the plan) and stores a copy of the position it read: `c.pos = {key, P}` (or `null`). A locked view's budget reads the
lock's own copy (a lock without one -- taken before v2.12 -- reads no position: its years' bases are as locked). The
working plan alone reads live.

**Over and under, per year, service and lane** (`d`, `m`), on the funded plan (bare `tiers()`, never the ◨ view):

```
held   = Σ over requirements of what each directs to the lane: fsDirVec(it) (a Split's typed Disc/Mand, clamped to its
         basis; a forced lane; a legacy split), or, with no override, what the lane walk drew for it
BA     = the year's budget authority (the base above, plus added sources, floored at 0 per service)
over   = max(0, held − BA)      "requirements hold $X more than BES28 -- reduce a requirement"
unalloc= max(0, BA − held)      nobody has allocated it
UPL    = min(max(0, added sources in that lane), unalloc)    added funding no requirement holds
```

Over lists every requirement holding money in that service and lane, in priority order, with held and drawn, and marks
those the lane cannot pay; ORBIT reduces nothing. **Decided in the build:** the fit model is computed per held year in the
window, cached until the next `save()` or position change (not per render: each other year costs an `aceWithYear`).

**Where it shows:** a box, *Fit to the PPBE position* (`#fitPanel`, FYDP › on the left menu, and from Budget Management,
the PPBE Budget Positions box and Needs attention): per held year, per service and lane: position (or the board's own, said),
added, BA, held, drawn, over / unallocated / UPL, and each over's requirement list with Go to. Needs attention: one entry
while any year is over ("🏛 N over BES28"). Budget Management: for a tagged plan, the base shows the position's figure per
service, read-only, naming where it comes from; "Take from a PPBE position" stays only for an untagged plan.

**UPL, the last line** (**decided:** after the requirements and after their TOTAL, labelled *UPL — added funding no
requirement holds*, never inside the TOTAL, so every cross-foot still holds), by service and lane, wherever it is not zero:
the board's list (a line after the last row, not a requirement: no rank, no drag, no selection), the Excel workbook's
Funding Streams sheet, the Priority Drill's 1–N tab, and each year of the FYDP Spend Plan's appropriation tabs (the
projection carries it: `cycProjOf` adds `upl:{d:[],m:[]}`, so a lock freezes it and another appropriation's board supplies
its own). Not on the Spend Plan Source (**decided:** a UPL line there would become a CCaR plan event; CCaR flags its own
UPL), the Two Spend Plans or the unfunded sheets.

**Fixtures** that tag the plan with a position on screen (map.md "ba" §9: the v2.10/v2.11 FDC blocks, keyboard-reach,
layout-fits, panels-render) now read live: move their expectations with a `// v2.12 W3:` comment, or untag where the test is
not about the budget.

## For every builder

- Read `CLAUDE.md` (the project rules) and `AGENTS.md`. The rules that bite here: escape where drawn (`esc`, `jsa` for every
  handler value); maps keyed by a value from a file are `Object.create(null)` or read by own key; whole dollars at the door
  (`D$`, `apportion`); every new box is `body > .modal-bg[id]` with `.modal`, `<h3>` and `h3 button.x` (the box controller);
  a field a box saves only with its own button has `data-held="1"`; new storage keys start `prio27` and carry `SIDE_SFX`;
  nothing called from `render()` may throw on the first draw at boot.
- **Checks:** each new check fails on the slot commit (say so, by name, in your notes) unless labelled a CONTROL. Fixtures
  make the alternatives disagree (a CLAUDE.md rule learned four times). Read exports back from their bytes.
- **Mutations:** text only. Never import or run `mutate.mjs`, `npm run mutate` or `validate:math`. Add ids in your slot,
  single-quoted, find matching once. Prove each with `recovery/v208/bin/prove.py` against its own block (JOBS=1). After
  your last edit, `mcount` must report every target once (2,799 at the slot commit plus yours).
- **Memory:** one other builder runs beside you on a 4-core, 15 GB box. Run one jsdom suite at a time; `--max-old-space-size=8192`
  only for audit-import and audit-recon (append to `NODE_OPTIONS`), 4096 otherwise. A suite that dies (exit 134/137) is
  rerun once, alone, before it means anything.
- **Before you stop:** `npm run check`; your blocks; every suite you touched, whole; the browser checks your change can
  move (`panels`, `dialogs`, `leftmenu`, `menus`, `keys`, `layout`, `standards`, `controls`, `editors`, `dropdowns` as
  relevant); `mcount`; notes; commit on your branch with the attribution lines. Do not push.
- **Guide:** each item gets one short section or paragraph in `<template id="helpDoc">` (W1 the cost estimate import, W2
  the WBS, W3 budget authority from the position); the guide's budget is 70 KB, about 2,900 characters each.
