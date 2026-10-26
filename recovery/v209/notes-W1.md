# v2.09 W1 -- item 125, CLIN amounts cannot be typed with the mouse (notes for the ship notes)

Built on Brad's "Go on v2.09" (26 Oct 2026), parts 1-6 of item 125's *Proposed* and the found-on-the-way fixes, on branch
`v209-w1` from `6405e01` (the slot commit). BUILD not bumped.

## What was built

1. **A click that uses a control is using the control** (the row-selection delegate, beside `setCur`). The row is selected
   quietly -- `setCur(id, true)`: the docked RECORD panel follows, nothing slides over, the keyboard stays -- when the press
   left `document.activeElement` on a control inside the row (read off the page, not a list of tag names), or the click
   landed anywhere in `.clin-detail` (blank parts, and a copy's dimmed boxes whose clicks fall through to their cells). A
   click on the row itself (title, quiet line, empty space) still opens the RECORD panel. Fixes the CLIN boxes, the rank box,
   Fund's allocation box, the RCN / EEIC pickers and the cancelled prompts and confirms.
2. **The pressed control survives the redraw** (`PTR`, `ptrSig`, `ptrLoc`, `ptrFind`, `ptrAfterRender`, beside
   `selNavBlur`). v2.08's `_selPtrDown` is generalised into one press record, `PTR`; `selNavBlur` reads `PTR.down`. The
   control is noted at pointerdown by its handler (which names the requirement, the CLIN and the service), the nearest
   element with an id, and its index among same-handler controls there -- never by position alone. If a redraw takes it
   away before its click, after the WHOLE redraw (`ptrAfterRender()` is called from the render wrapper after
   `gridAfterRender()`, so the RECORD panel's controls are covered) the keyboard goes to its new copy; a button's press is
   delivered once, on pointerup on the new copy, and not again if the browser delivers that click itself. The field just
   left never gets the keyboard back (the v1.92 rule): focus that a redraw put back on the field just left is taken to the
   pressed control instead; focus put anywhere else on purpose (a box that opened) is left there. A press older than 3 s is
   ignored, so a later redraw can never act on a stale press.
3. **A redraw while a row figure is half typed commits nothing** (the render wrapper, around `renderBoard`). v2.08's F2 hold
   (`inspHeld` / `inspHeldBack`) is applied to `#list` too: the field with the keyboard, typed into and not committed, is
   read before the rows are drawn and put back after with the keyboard and caret, its `onchange` off while the rows are
   drawn (Chromium fires change on a focused field as innerHTML removes it). The input listener marks `#inspector, #list`.
4. **Both routes into the drill** go through `clinGo(id)` (beside `toggleClin`): the edit box's *Open the 🧾 CLIN drill…*
   (`erGo('clin')`) and the Classify grid's prime WBS button (`recFields`, which called `toggleClin`). It closes the edit
   box, the Classify grid and the sliding RECORD panel, opens the drill (never toggles), selects the prime, scrolls the
   first box into view and puts the keyboard on it (in a PMO copy, on the row's 🧾 instead of a box that refuses). A prime
   the search or a filter hides: the drill is left open and the status line says why it is not on screen. The row's own
   🧾 still toggles.
5. **A request per service** (`clinSetAsk(pid, key, j, val)`, replacing `clinSetReq`). Each CLIN is two lines in the
   drill -- *Request*, typed service by service (writing `c.ask[j]` only), and *Allocation*, the grid (`setClinSvc`) -- with
   the CLIN's own cells (number, description, CCaR, WBS, RCN / EEIC, ✕) spanning both, so the drill is no wider than before.
   The line's request total is read from its boxes. The request and the grid stay independent (Brad).
6. **The foot**: *CLIN REQUESTS* by service, *REQUIREMENT VALUE (the prime's, by service)* -- `it.ask` -- and *REQUIREMENT −
   CLIN REQUESTS (information only)*, drawn in the muted `td.inf`, never the amber of a mismatch. The header line names the
   requirement value too. Nothing in the drill writes the requirement value; the grid still feeds no funding math.

Found on the way, fixed:
- **Whole dollars.** ↓ Fill from row spreads each service's row figure with `apportion()` in the requests' shape (it stored
  `row*ask/askJ`, 33.333333333333336). ↑ Apply grid to row writes `apportion(D$(grid total), per-service sums)` (it wrote
  the unrounded sums, 6.999999999999999); the confirm prints the figures that will be written.
- **A new CLIN's grid** starts as its first request, service by service (see *Decided*), then stays independent.
- **In a PMO copy the drill's WBS button is dimmed** with the rest (`[onclick^='toggleWbs("clin"']` in the SANDBOX style;
  the request boxes are dimmed by their new writer, `clinSetAsk`).
- **The ⋯ menu's close handler** shuts the menu in place (removes `.open`) instead of `render()`, so the first click into the
  drill, or on a row's title, while a ⋯ menu is open is no longer eaten.
- **A figure put back by a redraw is applied when it is left** (`heldCommit`, beside the hold's listeners; `__held` set in
  `inspHeldBack`). Found by `npm run pointer` C on the rank box: a browser fires change only for a value typed since the
  field took its value, and a value put back by a script counts as taken, so a figure typed whole, then a redraw, then
  Enter or Tab applied nothing -- the box showed it, the board kept the old figure. v2.08's RECORD panel hold had the same
  gap. Now, left (blur, when the field is no longer the page's focus -- a window losing focus is not leaving the field) or
  Entered with exactly the put-back figure, its change is fired once; anything typed after it is the browser's own change.
- The guide (team part, *Allocating, and what does not draw*) gains one paragraph on the drill (`p.v209-h125`).

## Decided in the build (not in the log)

- **"A new CLIN's grid starts as its first request" is read per service**: in `clinSetAsk`, on an ADDED CLIN, a service's
  grid cell takes the figure typed when the service's request was 0 and the cell is 0 (nothing to be independent of yet).
  Read once for the whole line, a USAF request typed first would leave every later service's cell at $0 and reading its
  whole request short -- the defect the fix is for. A cell given exactly $0 by hand before the request was typed follows
  the first request; a CLIN from the board's data keeps today's behaviour (its grid is never moved by a request).
- **The total Request box is gone**, not kept beside the per-service boxes: Brad's decision has the total "read from them",
  and two editors of one figure is what the row rule forbids. `clinSetReq` is removed; nothing else called it.
- **The lost-press delivery is for buttons**; a select or input gets the keyboard back (a select's list is not opened for
  the person). A lost click on a row's own title is not re-delivered.
- **Matched by handler, never guessed**: a pressed control with no handler is not restored. A figure typed into the wrong
  box is the one thing this must not do.
- `clinGo` reports a prime hidden by the search or a filter in the status line rather than taking the filter off (the Add
  box's `arOpenRecord` does take filters off; its code is v2.07's and W2's neighbourhood, so it was not moved or shared).
- The drill's two lines share one set of service columns, with a label column ("Request" / "Allocation") where the Request
  total used to be; the old *CLIN total* header reads *Total* (each line's own).

## Checks

- `tools/pointer-edit.mjs` (new; npm script needed, below): Chromium, page.mouse at each control's centre, in four layouts
  (sliding and docked, 1366 x 768 and 1920 x 1000), on the shared populated fixture with a prime stood up in the page
  (`tools/ia-fixture.mjs` untouched). A: every control the row and the drill record in `tools/row-controls.json` (surface
  "row") -- the request and allocation boxes, the rank box, both RCN / EEIC pickers, the CLIN number / description / CCaR,
  ＋ Add CLIN, ✕ (added and base), ↩, ↓ Fill, ↑ Apply, ↺ Reset, the CLIN WBS, a cancelled prompt and a declined confirm,
  ★, ⋯ and its Reset / copy-to-year / Remove, 🧾, the ⠿ drag, ▲▼ in Rank, Fund's allocation box -- each typed and read
  back, the panel never over the table; CONTROL the title opens it. B: click-then-type-then-click-next in the drill, a drill
  button after typing (asked on the first press), rank then a CLIN box, Fund row to row, the RECORD panel's value by
  service. C: a Live-view-style `render()` while Fund's allocation, a CLIN request and the rank box are half typed, then
  Tab / Enter (and typed whole, redrawn, Tab with nothing typed since). D: both routes, drill shut and open, twice for
  Classify; a ⋯ menu left open. E: every drill box holding $1,234,567,890 unclipped, no figure spilling its cell. 194 ok on
  this board; on v2.08 (`board-ebe702e.html`) 120 FAIL, every section (docked 1920, where v2.08's first click works, passes
  some A checks there, as the investigation found).
- `audit-board.mjs` "v2.09 — CLIN amounts and the row controls: …" (11 parts): the request by service, a new CLIN, whole
  dollars, the foot, quiet selection (click events dispatched, focus as a mousedown gives it), a press a redraw took away
  (pointerdown / blur / change in Chromium's order; the field just left; a button delivered once and not twice; the RECORD
  panel's box), the row hold (change fired inside the `#list` innerHTML set, where Chromium fires it), the panel hold, the
  routes, the ⋯ menu, the copy's style. Every non-CONTROL check fails on v2.08.
- Existing checks changed on purpose (each with a `// v2.09 W1:` comment):
  - audit-board "v1.97 — typed money is read whole…": `keeps('CLIN request', …)` drives `clinSetAsk('P1','n1',0,b)`; the
    CLIN request spread check ("$100 over [1, 2] is [33, 67]") is now "$100.40 typed as a service's request is $100, the
    other service untouched".
  - audit-board "v2.08 — the defects found mapping item 122…" F2: the keyboard and "nothing written" are read before the
    keyboard leaves the value; leaving it for the minimum increment now applies it (`heldCommit`); the minimum increment
    is typed after, held, then committed.
  - audit-board "v2.08 — the defects…" F6: `clinSetAsk('A',k,0,'500')` replaces `clinSetReq('A',k,'500')` (still seven
    refusals).
- `tools/row-controls.json` re-recorded on purpose: `clinSetReq('…','…',this.value)` (the total) is replaced by three
  `clinSetAsk('…','…',j,this.value)` (STOVL, USMC CV, USN -- the fixture's services), all on the row surface.
- Run and clean: `npm run check`; audit-board, audit-other, audit.mjs, audit-hostile, audit-inject whole; audit-import
  slimmed to the blocks that call what changed (v1.84 copy, v1.91 copy BAE, v1.86 not drawn, every v2.08 block); browser:
  controls, keys, editors, panels, dialogs, dropdowns, hostile, menus, leftmenu, inspector, toolbar, standards (no new
  findings), layout (only the 8 carried D), pointer. `npm run coverage:money` and `npm run defects` hold.

## Mutations (2,424 targets, each matching once)

- New, 31 (`v209-w1-*`, in the W1 slot), each proved CAUGHT against its own block (`recovery/v209/proved-W1.jsonl`).
- Retargeted, 3, same defect: `v197w1-guard-clinSetReq` (to `clinSetAsk`'s guard), `v208-f2-typing-not-marked` (the
  listener now marks `#inspector, #list`), `v208-rv-clin-toggled-shut` (to `clinGo`).
- Retired as obsolete, 1: `v197w1-clin-req-scaled` -- the spread of a total across services is gone (the request is typed
  per service). Not declared equivalent.
- Pinned, 1: `v208-rv-f2-any-marked` SURVIVED the v2.08 board's own final suite (checked on `board-ebe702e.html` with the
  `6405e01` suite: all checks pass on the mutant), though its v2.08 proof says CAUGHT -- it was proved before the second
  review rewrote the hold. A CONTROL in the W1 block's *panel hold* now catches it.
- The v2.08 F2 mutations whose check changed were re-proved against it: `v208-f2-held-not-put-back`,
  `v208-f2-keyboard-lost`, `v208-rv2-f2-change-commits-in-redraw`, `v208-rv2-f2-hold-dropped` all CAUGHT.

## npm script the integration should add

```
"pointer": "node tools/pointer-edit.mjs",
```
and `&& npm run pointer --silent` in `verify:grid` (it takes about 6 minutes; `--only A,B,C,D,E` runs sections).

## Known gaps

- `clinVec` still writes on read (Brad: the request and the grid stay independent, as today): a base CLIN's grid is captured
  from its request the first time anything reads it, and a later request edit does not move it.
- **Export movement, on purpose**: a CLIN added after this version, its requests typed, now carries a grid from its first
  request, so `clinSplit` (the Spend Plan Source's CLIN lines, the RCN-EEIC tab's CLIN breakout) gives it its share where it
  had $0. Grids already stored are untouched. Not run through `npm run delta` (its fixture has no added CLIN).
- A lost press on a select does not open its list; a click on a row's title eaten by a redraw is not re-delivered.
- jsdom cannot open a native select or see layout; the pickers, the drag and the measurements are the pointer tool's.
- The `heldCommit` rule changes v2.08's RECORD panel hold as well (a put-back figure is applied when left); a jsdom check
  that moves focus by script after typing into a held field now sees the figure applied, as a browser would.
