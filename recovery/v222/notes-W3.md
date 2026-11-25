# v2.22 W3 — the RECORD card and the edit box (contract §1.3, §1.4)

Branch `v222-w3`, from the slot commit `41ea5d7`. Everything new in the board is in the `// ==== v2.22 W3 ====` slot and
`<style id="v222w3">`, except edits made in place to the functions W3 owns (`inspectorDraw`/`inspectorBody`, `setCur`, the record's
keyboard, `awardBlockHtml` and `awdFixHtml`, `budRecordHtml` and `BUD_HOW`, `uiDrawerTabs`/`uiDTab` (the record's strip), `er*`).

## What was built

- **The record as a card** (item 155, the concept's record): a card with a pinned head -- the bar, the name, the Overview /
  Funding / History strip -- in one sticky block (`.rechead`); the lane in APEX's status colours with its word, the office, and the
  ★ switch on one line (`recChipsHtml`); the one line of figures; the lines that say what it is; the three buttons and what is still
  needed. Presentation is `<style id="v222w3">`; every control keeps its call.
- **149.18** A click on another row moves the record to it: the scrim of the sliding record still dims the page but passes clicks
  through (`pointer-events:none`), so a row clicked is selected by the ordinary delegate, and anything else (Filter, Save, the left
  menu) gets its click. A click on the page itself, on nothing that does anything, closes the record, as the scrim did. **J and K are
  buttons**: ‹ Previous and Next › in the bar, and the keys take the same step (`recStep`), the keyboard left on the button pressed.
- **149.19** One pinned bar: the position ("#3 of 36 · Record"), ‹ Previous, Next ›, ✕ Close (where the record slides); the name under
  it. RECORD and the position are said once each. A record opened -- another requirement, or the same one reopened by a click --
  starts at its top (`setCur`).
- **149.20** The ★ switch in the record, by the row's own call (`S.mc[id]=!S.mc[id];save();render()`; there is no `toggleMC`
  function in the board -- the contract names one; the switch uses the row's exact handler so the two cannot differ). The edit box's
  sentence now says ★ is set by the switch at the top of the record. `tools/row-controls.json` re-recorded (below).
- **149.21** "Save and next" in the edit box's foot (`erSaveGo('next')`: saves, then the next requirement in the list as shown, at the
  top of the box); "Save and go to the value and budgets" (`#erToPanel`, `erSaveGo('record')`: saves, then the record's value -- it
  asked to throw away what was typed); what is still needed listed by name under the three buttons (`recNeedHtml`, from `reqNeeds`),
  each a button to its field (`recNeedGo`: a record field opens the box at it; the value and the budgets are the record's own and
  take the keyboard there). A refused save or an office move answered Cancel leaves the box open with the typing.
- **149.23** Down and Up in the By service table go to the same column on the next / previous service (a document keydown on
  `#inspector .insp-split input`, the inputs carrying `data-col` and `data-si`); the field is left first (`blur`), so Chromium applies
  its figure and redraws, then the keyboard goes to the box standing in the next service's place.
- **149.24 (c)** "by rule — not picked" where nobody picked (`BUD_HOW.rule`); the Help guide's sentence follows.
- **149.27** A figure the board refuses is said inside the record (`#recMsg`): a capture/bubble pair of `change` listeners on the
  record's fields reads what `setStat` said while the field was changed (`_statN`), keeps a refusal (`diagIsWarn`) for that
  requirement (`REC_MSG`), and clears it when a figure is taken on it. The words are the board's own; nothing in `amtNo` changed.
- **149.28** The first click on another row is kept after typing (docked, and sliding): the press is noted (`REC_ROWP`); if no click
  reached a row and the row pressed was redrawn, the row in its place under the pointer is selected. Tab inside the open sliding
  record was already kept (v2.17). **PMO › Reassign names the requirement**: the label is `pmoReassignLbl()` -- the menu line itself
  is in `syncBtns` (W1's): see For the integration. A damaged award date on the row ("needs repair") is the row's: W1.
- **149.31** One line in place of the six boxes: Requirement, Funded (d+m paid), Unfunded (the requirement's own, `unfSvcOf`), and
  ★ MC shortage only when starred and short (`mcShortSvcOf`). The cycle delta field stays in the line. Discretionary and Mandatory
  are the By service table's TOTAL line.
- **149.32** The fixed "Lifecycle pending" line is gone; the last recorded edit stays (`.uiDOv`, empty when there is none).
- **149.33** The strip's jumps land just under the pinned head (`uiDTab`: Overview to the top, Funding to the By service heading,
  History to its section), and the highlight follows the scroll (`recTabSync`, a scroll listener on the record).
- **149.34** Each budget line prints the budget the Spend Plan Source prints (`budResolve`'s `effective`) once, whole, wrapping
  (`.budname`), above its picker; a line the rule settles no longer repeats the rule's name in the picker ("— keep the rule —"). A
  chosen line's picker still offers "— back to the rule: NAME —", since that name is not said anywhere else on the line.
- **149.40** Plain words in the edit box: the office option no longer says "(from the file)" (it says "(where it was first filed)"
  only for a requirement moved this year); "typed before v2.08, kept" → "typed by hand earlier, kept"; "from the file" →
  "the requirement’s own title"; "— follows the PMO and prime rules —" → "— the code its office and contract give —"; the year is
  said once, in the heading ("recorded against FY27 only" and "FY27 only" under the office are gone; the office note says "this year
  only").
- **149.41** Requirement and Unfunded in the By service table's headings (they read Req and UFR) and in the line under it.
- **149.42** The record never scrolls sideways (`#inspector{overflow-x:hidden}` with the new bar sized inside; checked in Chromium).
- **149.43** One block per award, stacked (`.awdone`: its Date, a box per service, its total, how it splits, what remains), the
  services' totals and the balance as a table a row per service (`tr.awdsvc`, then `tr.awdbal`), the tools under it; a repaired
  award's saved record as a sentence (`awdOrigSay`). The figures are the table's: the same `incTot`, `awdSplitOf`, balance.
- **149.47** One line of obligation category, WBS and Goes to (`recFieldsHtml`), each through its own reader.
- **149.48** A prime's record: "Prime contract, 3 CLINs, requested $X. Open the CLIN breakdown" (`recClinHtml`, read through
  `clinReadOnly`, so drawing it writes nothing; the button is `clinGo`).
- **149.49** In a locked view the record says it is read only, with Leave the view (`recRoHtml`, `cycLeave()`).
- **149.50** The requirement's value in each year of the window (`recYearsOf`/`recYearsHtml`), each another year a button to it
  (`recYearGo`: `switchYear`, then `reqShow`). The requirement in another year is the same WORK by v2.16's rule: `fydpSameIn` over
  `fydpLineKeys` -- `fydpSameIn` was removed with the AI review in v2.19 and is put back in the W3 slot exactly as v2.16 wrote it
  (249abe0). The values are each year's projection (`fydpData('working')` → `cycProjOf`), read once per change of the board (the key
  holds `_saveGen`, `MS.cur`, the held years, `CYCVIEW`, `_fyMoves` and the identity of `MS`) and BEFORE the record's requirement is
  looked up, since `aceWithYear` rebuilds the requirement list.

## Decided in the build (Brad can reverse each)

1. **The card is beside the table where the record docks today, and slides where it slides today.** The contract says "where the
   window is wide enough to dock (today's docked widths) the RECORD is a card beside the table"; Brad's answer to 149.18 says "keep the
   record sliding by default". Docking is still the per-browser choice View › Record panel › Docked beside the table (above 1400px);
   the default stays sliding, and the card look is the same in both. Making the card docked by default above 1400px is one line
   (`uiPrefRead`: `UI2.dock` when nothing is stored) -- but it changes what every person sees, every browser check's default layout,
   and W1's row widths at 1440 -- so it is left for Brad's word.
2. The name under the bar wraps rather than being cut to one line: layout-fits K fails on any text the record cuts.
3. A click on the dimmed page closes the sliding record only when it lands on nothing that does anything; a click on Filter, Save or
   the left menu does what it does and leaves the record open.
4. The budget picker of a chosen or refused line still names the rule's budget ("— back to the rule: NAME —"): that is the only place
   the line says what the rule would give.
5. "Open the CLIN breakdown" uses `clinGo`, which closes the sliding record to open the drill in the row (as the edit box's way in).

## Checks

- **audit-board "v2.22 W3 — the RECORD card …"** (new; fails on the slot commit `41ea5d7`: the record there has no figures line,
  bar, switch or any of the rest). Fixture: two services; A starred and covered by discretionary, B starred, trimmed and short, C
  short and unstarred, D with two awards and its record fields, E with a repaired award, P a prime with two CLINs; then FY28 started
  EMPTY holding its own NEW-1 (a different requirement from FY27's NEW-1 -- read by id, the line would print it) and later a
  requirement brought in from FY27, linked, with a number of its own.
- **tools/record-card.mjs** (new, `npm run record` to add): A–J in Chromium at 1600 docked, 1440 and 1024 sliding (see its header).
  Fails on the slot commit (no `.recbar`).
- **Changed on purpose, each with its `// v2.22 W3` comment:** audit-other v1.91 BAE "rule" (the picker no longer repeats the rule's
  name; the line prints it: `name` read from `.budname`), v2.08 review "SI code" and "words", v2.08 second review "record name
  source", v2.15 W4 `FOL` (149.40's words); audit-board v1.93 "award block" balance cells (the balance is a row per service now);
  tools/inspector-agrees.mjs (Discretionary and Mandatory read from the By service TOTAL line; the MC shortage field only where
  starred and short; Funded held to d+m).

## Mutations

36 new (`v222-w3-*`), each caught by audit-board "v2.22 W3 — the RECORD card"; 4 retargeted (`v208-122-proposal-office-open`,
`v208-rv-si-follows-gone`, `v208-rv-rectag-fixed`, `v208-rv2-panel-wrong-requirement`: the edit box's words and `erToRecord`, the
same defects), each by its original catcher. None retired. Proofs: `proofs-W3.json`, results `proved-W3.jsonl`.

## For the integration

- **The PMO menu's Reassign line** (`syncBtns`, W1's): `mi('⇄ Reassign a requirement…', …)` → `mi(esc(pmoReassignLbl()), …)`.
  `pmoReassignLbl()` returns TEXT (a title), so it must be escaped where the menu writes it.
- **`toggleMC`**: the contract names it; the board has none. The record's switch uses the row's inline handler verbatim. If W1 makes a
  `toggleMC(id)`, point both at it together (and re-record `row-controls.json`).
- **The row** (W1): 149.28's "needs repair" on the row, 149.51's hand pointer -- not W3's. W1's rows keep `.tt` and `.mcb`?
  `tools/record-card.mjs` clicks `[id="row-X"] .tt` and reads `#row-X .mcb`; if W1 renames them, follow in that tool.
- **A pre-existing write on a draw** (found here, not fixed: not W3's): `reqDraftOf(id)` → `recFields` → `clinList` makes CLIN
  containers (`S.clinMeta[id]`, `S.clinRm[id]`, `S.clinAlloc[id]`) for a prime the first time its record is drawn -- the 📋 button's
  count has called it on every record draw since v2.08. v2.12's rule says a draw writes nothing; wrapping `recFields`' CLIN read in
  `clinReadOnly` would close it.

## npm script to add

`"record": "node tools/record-card.mjs"` (and into `verify:grid`).

## Known gaps

- What only a browser sees (the scroll to the top, the jumps' landing and the highlight, Chromium's change on the arrow keys, the
  pinned bar's place) is held by `npm run record`, which prove.py cannot run; those lines' mutations were proved by hand (below).
