# v2.22 W2 — Ctrl K, the list's search and Filter, the empty program, new years, the Add box

Builder W2, branch `v222-w2` from the slot commit `41ea5d7` (contract §1.2, §1.4). Brad's decisions read from `NEXT-VERSION.md`
› Open › 155 and 149.22, 149.24, 149.25, 149.26, 149.29, 149.30 (with every **Answer**). No figure is worked out anywhere new:
every money figure the palette prints is `tiers()`, `unfTotOf`, `mcShortSvcOf`, `askTot`, `laneOf`/`laneLbl`, as the row prints them.

## What was built

**Ctrl K — the palette (item 155).** `#cmdPanel`, a `body > .modal-bg` with an `<h3>` (the search icon, a visually hidden label
"Find or run anything", the input `#cmdQ` and the close control, shown as **Esc**), a `role="listbox"` of results and a foot of key
hints. The box controller (v1.93) names it, makes the page inert, keeps Tab inside, closes it on Esc and gives the keyboard back.
- **`cmdOpen()`** is the function W1's `#cmdOpen` calls. Ctrl K and ⌘K (a capture `keydown` on the document) call it from
  anywhere but another open box (that box keeps the keyboard); pressed again while open, it selects the search to type over. It
  closes an open flyout, toolbar menu or popover first.
- **Requirements** by the list's own predicate (`listSearchHit`, below), every requirement of the year on screen in master order,
  eight shown and "and N more"; each row: `#rank title`, then office · CCaR · PID · requirement · *funded in full* or *unfunded $X*
  (`unfTotOf`) · *★ MC short $X* (`mcShortSvcOf`, starred only), and a status pill with its lane word in APEX's colours
  (`laneOf`/`laneLbl`, the row's own). **Enter** (`cmdGoReq`) takes off whatever search or filter hides it and says so
  (`listReveal`, now shared with the Add box's *Add and open its record*), selects it (`setCur`), scrolls its row into view,
  flashes it, and opens its RECORD (the drawer takes the keyboard where it slides; docked, the row does).
- **CCaR records**, when a CCaR records list is loaded (`ccarIdx()`): by number or title, five shown; each says how many
  requirements of the year are on it. **Enter** (`cmdGoRec`) puts the record number in the list's search, so the list shows them.
- **Actions: every left-menu item.** `cmdActions()` reads the left menu as it is: each entry the menu shows (`UI_NAV`, an entry
  that is hidden — Program offices in a PMO copy — offers nothing), a flyout's items as `uiFlyItems()` draws them with the lists
  `syncBtns()` keeps for it (`UI_FLYHOST`, cloned), a box's `.mi` items, the four views, and Save in the header. Each is labelled by
  its own words and its place (`Reports & exports › Working Documents`), found by its words, its place and a report's format words
  (`data-k`). **Enter** (`cmdRunAct`) focuses that left-menu entry, clicks it (its flyout or box opens as a person opens it), finds
  the item by its call and its words, and **clicks that item**: the action runs from its one home, through `uiPanelRun` and `mRun`
  exactly as a click on the menu would, so nothing run here can do what the menu item could not (a PMO copy, a locked view). An item
  no longer there is not guessed at: the entry is closed and the line says so.
- `>` first lists actions only (all of them, unlimited). Matches are ordered: the words start with what is typed, then hold it,
  then only the place does; the menu's order within each.
- Keys: Down/Up move (wrapping), the active option named to the input with `aria-activedescendant` (combobox → listbox; each option
  a `<button role="option" tabindex="-1">`, so a click handler is on a native control); Enter opens; Esc closes; Tab stays inside.

**The list's search (149.25).** `#q` (W2's) gets a **✕** inside its box (`#qClr`, 24×24, shown only with a search on) and Esc clears
a search that is on (`qKey`; with nothing to clear Esc goes on as before). **One predicate**, `listSearchHit(it, q, num)`, factored
out of `render()` (its one call line is W2's): `reqSearchText()` reads what the row shows — the title and the plan event, the office,
the CCaR record, the PID, the record name, the prime contract / OGC tag, the cost element, the note — and the id; digits alone (or
`#12`) also find the requirement listed at that number. Ctrl K reads the same predicate, so the two cannot disagree (checked).
- **No requirements match.** `render()` now tests for no ROW (`h.indexOf('class="row ')<0`), not for an empty string: the cutlines
  are drawn as the order is walked, before a row is filtered out, so a search matching nothing left only the banners (the review's
  finding). `listEmptyHtml(drawn)` keeps the locked view's banner and the discretionary-only one, names what is on (the search, ★,
  the lane filter, the service, prime / OGC, the office) and offers **Clear the search** (only a search on) or **Clear the search and
  filters** (`listClearAll`).
- **While a search is on and its box has scrolled away**, `#qAway` (a navy line right after the title band, sticky under the header)
  says *Searching for "x" — N requirements shown* with **Clear the search**; `html.q-away` moves the column heads down under it.
  `qAwaySync` runs on scroll, resize, every keystroke, and a turn after every list redraw (`listSearchQ`, render()'s read of the search; not a `MutationObserver` on `#list`, whose record queue kept every redraw's removed rows while a top-to-bottom suite ran, and audit-board ran out of heap on them).

**Filter (149.26).** `filterFirstOpen()` opens the Funding group until this browser has opened or closed one of Filter's groups by
hand (kept in memory only; `menuGrp` stores a person's choice as before). The divider above the first group is gone.

**The empty program (149.29).** On the program with no board in it (`IS_SHELL`, no requirement in any year, not a copy, not a locked
view, not connected to the folder: `startHereOn()`), `driveBarHtml()` draws one **Start here** block: *Open your saved board…*,
*Connect the shared folder…*, *Start a new board…* (once services are named: *Add the first requirement…*). Each button runs
its **own left-menu item** through the palette's runner (`startHere` → `cmdRunAct`): Imports & exports › Import a full board (new
version)…, Setup › Live view…, Setup › Who and where › Services…. The shared-folder banner for the program is folded into it (the
banner still shows on a program somebody has started a board in), and the opening line ("🧩 The ORBIT program …") waits behind
the Message button (`_statQuiet`) instead of being cut off beside Save. The list says *Nothing on this board yet — Start here,
above* and offers no Add. **`arCannot()`**: with no services, or no office to add for, Add requirement opens no box (it could never
be finished) and says why, kept unread (`statKeep`).

**New years (149.30, Brad 21 Nov: "Linked one by one").** An empty year's message leads with **Bring requirements in from another
year…** (`arShowYr`: the Add box on From another year) beside **＋ Add a new requirement**; Roll forward stays where it is. The
Removed list says what Restore brings back and what it does not (`rmRestoreSay`), with the same way in. From another year has a
**tick-all** (`#naFromAll`, `naFromTickAll`) over every row that can be brought in; the keyboard stays on it.

**The Add box.** **Add and start another** (149.22, `#arAddMore`, `arAdd(false, true)`): added, the box stays open for the same
office, the form is emptied (`arReset`, which now re-picks the only budget), the keyboard is back on the plan event, and the box says
what it added. After any Add the list scrolls to the new row (`arShowRow`), and after Add requirement the confirmation is opened
whole (`arStatShow`) so it shows at a laptop's width. **The only budget is picked** (149.24 b, in `arBudFill`): exactly one name the
office has for the service, not one offered by hand only, still changeable, said on hover; the required list is unchanged (a picked
name answers it as any chosen name does). `arFormHeld()` no longer counts a budget picker as typing, so a form holding only a
picked budget is not "typed by hand" when one brought in from another year is opened to finish.

## Decided in the build (Brad can reverse any of these)

1. **Where the "search is on" line sits.** The title band (`#gridBand`) is W1's (`uiSync`), so the line is W2's own element
   `#qAway`, placed straight after the band, navy like it, and pinned under the header while the box is out of sight; the column
   heads move down 30px under it (`html.q-away .gridhead`). The lead may fold it into the band once W1's band is final.
2. **`#q` stays where v2.21 put it** (moved into the page's tools row by `uiBoot`). W1 owns the header and places `#cmdOpen`; W2
   did not move the list's search.
3. **Ctrl K does nothing while another box is open**: that box keeps the keyboard (its typing guard, its Esc). From a field on the
   page (the list's search included) it opens.
4. **Enter on a CCaR record** searches the list for it (the list then shows the requirements on it); it opens no box.
5. **The palette lists every requirement of the year on screen** (master order, master number), whatever office or filter is on, and
   takes off what hides the one chosen, saying so — as *Add and open its record* already did.
6. **Digits search the number AND the words**: `2` finds number 2 and every requirement whose words hold a 2 (a CCaR record, a PID);
   `#2` finds number 2 (and a note that says "#2").
7. **The search reads the id too** (NEW-3 finds the third added requirement).
8. **Start here's third way in becomes "Add the first requirement…"** once services are named (the first requirement still asks
   for an office; with none, `arCannot` says so).
9. **The only budget is picked only when it is the only name offered**, and never a name offered by hand only (CONG, BOS, OCO,
   Withhold, Spares TrngDev are "never automatic", v1.83). One name plus a by-hand one: nothing is picked.
10. **No cutline is drawn with no row** (a search or a filter that leaves none): the empty message replaces them; the locked-view and
    discretionary-only banners stay.
11. **The palette's look** follows the concept (white panel, 760px, groups, pills and tags); its backdrop is the board's shared one
    (darker than the concept's).

## Checks

Each new check FAILS ON THE SLOT COMMIT (41ea5d7) unless labelled CONTROL. Run there (`BOARD=<41ea5d7's board>`, the three blocks
slimmed): 14 failing checks — the search block fails on every row-line, number and office search and then throws at the missing ✕;
the Ctrl K block throws at `cmdIsOpen`; the Start here block fails on the block, the banner, the opening line and the list, then
throws at `startHere`. Its CONTROLs (six rows A..F; no Start here on a board with requirements; the title still searched) pass there.
`tools/cmd-palette.mjs` cannot run on the slot board at all (no palette, no `#qClr`, no Start here).

**jsdom, `audit-other.mjs` slot `v2.22 W2`** (three blocks, 74 checks):
- *v2.22 W2 — the list's search reads the row, clears with ✕ and Esc, says when nothing matches; Filter opens on Funding (items
  149.25, 149.26)*: the record name, a note, the cost element, the office, `#2`, `2`; the ✕ (shown, named, a button, clears, keeps
  the keyboard); Esc clears and is held back (CONTROL: with nothing to clear it is not); the note while the box is out of sight and its
  Clear; No requirements match naming the search, its Clear the search; a search with two filters, all named, Clear the search and
  filters; the list and Ctrl K find the same requirements for six queries; Filter's first use opens Funding with nothing above it,
  and a group closed by hand stays closed.
- *v2.22 W2 — Ctrl K finds requirements, CCaR records and every left-menu action, and runs each action from its own menu item (item
  155)*: Ctrl K (held back) and ⌘K open it, a named dialog with the keyboard in its search; every requirement row against the
  fixture's own walk worked by hand (A–C discretionary, D mandatory, E $20 mandatory and short $80 with an MC shortage of $100, F
  short $50); arrows move and wrap, the active option named; Enter on a requirement a filter hides; a CCaR record found by its title
  and Enter on it; **every left-menu item offered, and nothing else** (harvested by opening every entry in the page and reading every
  item, folded groups included, against `cmdActions()`); the views as views; `>` actions only, `>` alone every action; Enter on
  *Change journal…* presses Audit's own item in its flyout and the journal opens; Enter on *Excel Workbook* presses Reports &
  exports' own item in its box and the export runs once; a view runs as its entry; **a PMO copy**: nothing of Program offices is
  offered and Save is ✉ Submit input.
- *v2.22 W2 — Start here in the empty program, an empty year leads with From another year, Add and start another, the only budget
  picked (items 149.22, 149.24, 149.29, 149.30)*: Start here with its three buttons, the banner folded in, the opening line waiting,
  the list pointing at it; each button presses its own left-menu item (Import a full board's picker asked for; Live view opens;
  Services opens); Add refused with no services; CONTROL: no Start here on a board with requirements; FY28 started empty leads with
  From another year, which opens on that tab for PSM; the tick-all (named with its count, ticks PSM's three, keeps the keyboard,
  unticks); one brought in to finish fills the form without asking (the picked budget is not typing); the Removed list's sentence;
  the only budget picked (PSM's USAF), none of two, none by hand only, none of three; Add and start another (the box stays, the
  office kept, the form empty, the only budget picked again, the keyboard on the plan event, what it added, the list at the new row);
  Add requirement (closed, the list at the new row, the confirmation opened whole).

**Browser, `tools/cmd-palette.mjs`** (new; npm script for the integration, below): real keys in Chromium on the populated board
(`ia-fixture`) and on the program — A Ctrl K from the page and from inside the list's search, ⌘K; B typing, Down, Enter selects with
its row in the window and its RECORD on screen; C six Tab / Shift+Tab presses never leave the palette; D Esc gives the keyboard back
to the list's search box; E `> change journal` Enter opens the journal with the keyboard in it, and Esc lands on Audit; F the ✕ is
24×24 inside its box, scrolled down the note shows under the header with the column heads below it, its Clear clears, a search
that finds nothing leaves no cutline and says No requirements match, Esc clears; G the palette inside the window at 1440, 1024 and
390, nothing sideways; H the program at 1440 and 1024: Start here's three buttons whole, the opening line waiting. `--shots DIR`
writes the screenshots below.

**Existing checks changed on purpose** (each with its `// v2.22 W2:` comment):
- `audit-other.mjs` v2.07 Add box: the rail reads *1 of 1* / *2 of 2 chosen* where PSM's (and (AV)'s) only name is now picked;
  reopened, the two pickers hold PSM's only names; the marks step sets USAF's budget back to none before Add (as a person may), so
  its mark is still tested; the empty year runs on a board whose FY26 holds a requirement (a board with nothing in any year is the
  program, with Start here) and clicks *＋ Add a new requirement* by name.
- `audit-import.mjs` v2.02 (U47): the program's opening line is matched as *The ORBIT program* (it said *SHELL TEMPLATE*).
- `tools/panels-render.mjs`: `cmdPanel` in `SPECIAL` (opened with results in it).
- `tools/dialogs-keyboard.mjs`: `cmdClose: 'cmdOpen('` in `KNOWN` (the palette opens from W1's `#cmdOpen`; on this branch, with no
  such button, it is opened by its switch).
- `tools/standards-check.mjs`: the palette measured open with a requirement and an action in it, and the list's search on with its
  ✕; a coverage finding if either was not drawn.
- `audit-board.mjs` v1.96 (a long menu folds): "opened with nothing unfolded" starts Filter's groups as closed by hand
  (`menuGrpOpen={view:''}`); with `{}` Filter now opens its Funding group (Filter 7 rows, not 2).
- `audit-import.mjs` v2.06 (add from another year), *finish*: ANG's and AFRC's only PSM names are picked in the form being
  finished (FY27 stored none), so the form holds them and Add says *5 still needed* (it was 6, the budgets among them).
- `tools/keyboard-reach.mjs` G2 and `tools/dropdowns-visible.mjs`: Filter's groups start closed by hand (keys), or a group already
  open is judged open as it is (dropdowns) — pressing Funding's heading on first use now closes it.

## Mutations

54 new (`v222-w2-*`, in the `v2.22 W2` slot of `mutate.mjs`), 2 retargeted, none retired:
- `v207-121-empty-year-no-way-in` → the empty year's *＋ Add a new requirement* button in `listEmptyHtml` (the same defect: an empty
  year offers no way to add one).
- `v207-rv-open-pmo-filter-kept` → `listReveal`'s PMO-filter line (arOpenRecord takes off what hides the new requirement through it).
- `v207-121-open-record-keeps-star` matched twice while arOpenRecord kept its own copy; arOpenRecord now calls `listReveal`, so it
  matches once again, in `listReveal`, unchanged.

Proofs: `recovery/v222/proofs-W2.json` (56 ids) and `recovery/v222/proved-W2.jsonl`, run with `prove.py` (JOBS=1, under heavy.sh) on
the finished board: **56 of 56 CAUGHT**, each by a failing check of its own block (three of them also throw after failing checks:
`nomatch-banners-only`, `starthere-never`, `tickall-missing`). The first run found `v222-w2-actions-hidden-entry` SURVIVED: in a PMO
copy Program offices' list is also empty, so the copy alone could not tell; the block now also hides Program offices on the board
and requires that none of its items is offered, and the second run caught it. `v222-w2-another-closes` was caught only by a throw in
the first run; its check now reads a missing field as such and fails as a check.
`mcount`: 3,320 entries, every target matches once.

## For the integration

- **`render()` lines W2 changed** (all marked `v2.22 W2`): `const q=listSearchQ();`, the predicate call
  (`if(q && !listSearchHit(it, q, hardOpen? liveRank[id] : rank)) return;`), the empty test
  (`if(h.indexOf('class="row ')<0) h=listEmptyHtml(h);` — it replaced `if(!h) h=…`, and `listEmptyHtml` keeps banners drawn with
  `style="margin:0 0 8px` — the locked view's and discretionary-only's: if W1 restyles those banners, keep that marker or tell
  `listEmptyHtml`), and the Removed list's `rmRestoreSay()+`. If W1 renames the row class, `listEmptyHtml`'s test reads it.
- **`#cmdOpen`** (W1) calls `cmdOpen()`. `tools/dialogs-keyboard.mjs` then finds it as the palette's opener (no change needed).
- **The "search is on" line** is `#qAway` after `#gridBand`; if the band becomes sticky or carries filter chips, the lead may move
  the sentence into it (`qAwaySay()` returns it as HTML) and drop `#qAway` and `html.q-away .gridhead`.
- **The empty program's opening line** is in the opening code after `IS_SHELL` (now quiet); the U47 check reads its new words.
- **npm script to add:** `"palette": "node tools/cmd-palette.mjs"`, and add it to `verify:grid`.
- `syncBtns()`: only the Filter group's lines changed (`filterFirstOpen()`, the divider removed).

## Results on the finished board

- `npm run check`: all checks passed. `mcount`: 3,320 targets, each once.
- Suites whole: audit (export) ALL CHECKS PASSED; audit-other ALL CHECKS PASSED; audit-board ALL CHECKS PASSED (8 GB heap: at 6 GB it
  dies out of heap here, and so does W3's run of it on the slot commit's board); audit-recon (8 GB) ALL CHECKS PASSED; legacy-fsrc
  "every legacy Force setting computes exactly as before"; audit-hostile, audit-inject, audit-ui ALL CHECKS PASSED; boot-same exit 0.
  audit-import: see below.
- audit-import (8 GB): two checks of *v1.86 — the File menu, grouped* fail, and they cannot pass on the slot commit either (its board, read: no
  `data-tip` on any entry, no Save in `#uiSide`): they read each
  left-menu entry's `data-tip` (gone with the rail in v2.21) and look for Save inside `#uiSide .uiSave` (in the header since v2.21).
  Not W2's: v2.21 left them behind. The two v2.06 checks W2's pre-pick changed are updated and pass (run alone). The second whole
  run (after those two were updated) failed those two v1.86 checks and, once, *v1.89 — 240 edits in one save › a package import
  still sees the changes made here since*: it passed in the first whole run on the same board and twice more run alone; it is a
  same-millisecond clock flake (`pkgMineSince` keeps only entries with `t` later than the last shared one) and touches nothing W2
  changed.
- Browser: cmd-palette (26 checks) all hold; dialogs, left-menu (unchanged), menu-paths, panels, toolbar, editors, pointer, controls
  (row-controls --check), colours, pmo-save hold; standards: CONFORMANCE HOLDS, 0 findings, nothing new (the palette measured open);
  layout: only the carried D ×8; keys (169 ok) and dropdowns (560 opened, every item in the window) hold, re-run after their
  Filter change.

## Known gaps

- Start here is measured by the browser check (whole buttons, no sideways scroll) but not by `npm run standards`, which runs on a
  populated board only.
- `#qAway` assumes the header is `--hdrH` tall; if W1's header changes how it is measured, its offset follows `--hdrH`.
- The palette does not search inside a box's own content (a panel's rows); it searches requirements, records and the left menu.
