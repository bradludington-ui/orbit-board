# v2.09 third review -- clin fixes (notes for the ship notes)

The third independent review of v2.09 (frozen at `d3ce17d`), area clin, found four ways the keyboard lands on another item's
control after a commit. Two were introduced by the second review's fix (`notes-RV2-clin.md`: `focusRestore` finds a control
again by its handler, and runs once the RECORD panel is drawn); two are older (v1.92's count by place, and v1.93's box
controller finding "the same onclick and text"), the same failure in a box. Brad, 27 Oct: fix only what the last fixes
introduced, small and safe, hold the rest for v2.10 -- the task named all four, under one rule. Fixed on branch
`v209-rv3-clin` from `d3ce17d`. BUILD not bumped. What the second review fixed stays fixed (below).

## What was wrong

Many handlers name their item by its PLACE in a list, not by what it is: an award's ✕ is `rmAwd(id, 0)`, its date box
`setAwdIncDate(id, 1, this.value)`, a WBS line's ✕ `wbsDel(…, 0)`, a line of the not-drawn list `ndSetDrawn(5)`, a band's ▲
`bandMove(2, -1)` (also `rlgDelManual`, `coaDelRec`, `pmoMove`, `svcMove`, `coaMoveGroup` and others: grep of the handlers the
board draws). After a commit that takes the item out or re-sorts the list, the handler at that place names the item moved
into it. Measured on `d3ce17d`:
- **rv3-clin-award-remove-hands-next** (introduced): ✕ on the first award from the keyboard left the keyboard on the next
  award's ✕ (`rmAwd("R001",0)` again); a second Enter removed it, with nothing asked; Enter held removed three of four.
- **rv3-clin-award-redate-lands-on-other-award** (introduced): an award's date walked forward with ArrowUp (Chromium commits a
  date box on every step, the box keeping the keyboard) past the next award left the keyboard on that award's date box, and
  the next step re-dated it.
- **rv3-clin-nd-set-drawn-next-requirement** (older): "set to drawn" on a requirement's last line left the keyboard on the next
  line's -- another requirement's -- and a second Enter set that requirement's directed figure to what it drew.
- **rv3-clin-wbs-remove-hands-next** (older): ✕ on a WBS line left the keyboard on the next line's ✕; a second Enter deleted it
  with its dollars by service.
On `ba3c294` and v2.08 the two boxes did the same through `dlgBack` (the box's own search for the control by "the same onclick
and text"), which is why fixing `focusRestore` alone does not fix them.

## What was fixed (one rule)

After a redraw the keyboard goes back to the same control standing for the SAME item, or nowhere.
- **`ctlShape(h)`**: the handler with every number outside a string written `#` -- what it runs, whatever the place.
  `ctlPlaces(box, t, h)`: the controls of the box that run the same writer at other places, in order, each with what it stands
  in: the most of the page around it that holds no other of them (its text and its fields' values). `null` when the handler
  names no number: such a handler names its item itself (a requirement id, a CLIN key), and nothing changes for it.
- **`focusMark`** notes the places in each box of its chain; **`focusRestore`**, having found the control by its handler
  (`ptrFind`), asks **`ctlSame`**: the same number of places, the same handlers in the same order, the control at its own place,
  and every OTHER place standing in what it stood in. Its own place is not compared -- the commit just changed it. If not, the
  keyboard goes nowhere (as a browser leaves it when the focused control is removed) and the old control is marked
  (`__focusGone`). Never the place fallback after a refusal.
- **`dlgBack`**: a box whose control was refused keeps the keyboard on the box itself (its dialog, `tabindex=-1`; Tab goes in
  from there), never on the control its own search finds by "the same onclick and text", and never on its first control (the
  nd box's first is ✕ Close).
- **Why a service's box keeps its place:** the services are a fixed few; a commit never removes or re-orders one, so the other
  services' places read as they did. A minus sign is kept outside the `#`, so a band's ▲ (`bandMove(i,-1)`) and ▼ (`bandMove(i,1)`)
  are two writers: each ▲ stands in its band's whole row, and a move is seen.

## Kept, and checked

- The second review's fix (`fund-svc-commit-focus-jumps-to-next-svc-row`): `audit-board` "v2.09 second review — clin" whole,
  clean on the fixed board; `npm run pointer` G, 40 ok. Fund's allocation box (`setAlloc(id,…)`) names no number, so the rule
  does not apply to it.
- `npm run keys` (all, 0 FAIL): H (Enter on a fit chip keeps the keyboard -- the fit chip's handler changes on a press, so it
  is found by the place fallback, which this does not touch), P, Q; a figure typed then Tab moves on; v1.92's redraw keeps
  the keyboard's place.
- `npm run pointer` A-G all ok.
- The RECORD panel's boxes: a value by service, Disc and Mand (Enter stays, Tab moves on), and an award's dollars by service
  (Enter stays) -- CONTROLs below. The review's own sweep of the panel (`psweep.mjs`, scratchpad: every control with a handler,
  Enter / Tab / ArrowDown, real keys) gives the same answer for all 450 cases it ran on `d3ce17d` (1366 and 1920 sliding, 1366
  docked, Review and Fund), and 0 flags with 1920 docked added; the only "nowhere" answers are buttons that remove themselves
  (put on last, clear, clear all), as on `d3ce17d`.

## Checks

- `audit-board.mjs` "v2.09 third review — clin: a control that names its item by its place is found again only where that item
  still stands" (W1 slot): an award's ✕ (Enter, then Enter again); an award's date re-dated within its slot (CONTROL: the
  keyboard stays) and past the next award (nowhere; the next step re-dates nothing); "set to drawn" in the not-drawn box (the
  keyboard on the box, Y's directed figure unmoved by a second Enter); a WBS line's ✕ in its box; a band's ▲ in the Bands box;
  CONTROLs: an award's USAF dollars Entered keeps the keyboard, Rank's ▲ keeps it on the same requirement's ▲. The boxes'
  parts run with the board's "is it on screen" answered yes (jsdom draws nothing, and a box looks for its control only among
  those on screen); Chromium is pointer H. On `d3ce17d`: 10 failing checks, every non-CONTROL.
- `tools/pointer-edit.mjs` H (`--only H`), Chromium, real keys, 1366 and 1920, sliding and docked: an award's ✕ Entered,
  Entered again, then Enter held on four awards (one goes); the Mar award's month walked with ArrowUp (Apr, May, Jun-09 keep
  the keyboard -- CONTROL; Jul passes Jun and the keyboard goes nowhere, the steps after it re-date nothing); "set to drawn" on a
  requirement's last line (the keyboard on the box, the next requirement's directed figure unmoved); a WBS line's ✕; a band's
  ▲. 32 ok here (8 a layout, "nothing threw" with them); on `d3ce17d` 24 FAIL (every non-CONTROL, every layout).

- Run and clean: `npm run check`; audit-board, audit-other, audit.mjs, audit-hostile, audit-inject, audit-ui whole;
  audit-import slimmed to the blocks that type into a row, the RECORD panel or a box and read the keyboard (v2.00 U40, v1.84
  the copy sends every field, v1.91 copy BAE, the three v2.08 copy blocks); audit-recon slimmed to v2.00 U41. Browser: pointer
  (A-H, 0 FAIL), keys, dialogs, controls, inspector, dropdowns, leftmenu, editors, panels, hostile, standards (nothing new),
  layout (only the 8 carried D). The review's sweep of the rows (`sweep.mjs`: every row and drill control, Review, Rank and
  Fund, four layouts): 1,108 cases, every one the same as on `d3ce17d`, 0 flags.

## Mutations

- New, 7 (`v209-rv3-clin-*`, W1 slot), each CAUGHT by the block above (`proved-RV3-clin.jsonl`): `any-place` (the refusal
  removed), `not-marked` (the places never noted), `count-only` (what each place stands in not compared), `own-place-compared`
  (the control's own place compared too: an award's dollars Entered loses the keyboard), `sign-dropped` (a band's ▲ and ▼ one
  writer), `place-is-the-control` (a place stands in only itself), `box-takes-it-back` (`dlgBack` searches again).
- Re-proved, finds in the functions changed (`focusMark`, `focusRestore`): `v209-rv2-clin-found-by-class`, `-no-place-fallback`,
  `-place-moved`, `-panel-other-requirement`, `-into-closed-drawer` CAUGHT; `-row-unbounded` SURVIVED, as its `equivalent:`
  receipt says (`focusScope` is unchanged).
- None retargeted, none retired. mcount: every entry matches once.

## Known gaps

- **A move keeps nothing.** ▲ on a band, a PMO, a service, a Chart of Accounts group sends the keyboard to the box, so moving an
  item up three places is three Tabs back to its ▲. Following the item to its new place needs an identity the handlers do not
  carry (a key per item); the safe answer was nowhere. v2.10.
- **The press path is not changed.** `ptrAfterRender` (v2.09 item 125: a press lost to a redraw is delivered to the control
  standing in its place) still finds by handler alone. It is reached only when the mousedown's own blur commits a change that
  removes or re-sorts the list holding the pressed control (renumbering a WBS line, then clicking another line's ✕, if the
  lines re-sort). Not measured here; v2.10.
- **Over-strict, safely.** A place whose neighbours' text changes for another reason (a menu tick moving between items whose
  handlers name a year by its number; a scalar trim re-spread across services when one service's value changes) sends the
  keyboard nowhere where it could have stayed. Nowhere is the rule's other answer; no check found one.
- jsdom has no layout: the boxes' parts answer "on screen" for every element, and the step Tab takes is Chromium's (pointer H,
  G).
