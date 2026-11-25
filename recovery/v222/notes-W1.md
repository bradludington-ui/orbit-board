# v2.22 W1 — the page and the Funding page (item 155; items 154 and 149.28/35–39/41/44–46/51 folded in)

Builder W1, branch `v222-w1` from the slot commit `41ea5d7`. Brad's go of 25 Nov 2026 ("I like it all ... Let's go"); the contract is
`recovery/v222/contract.md` §1.1 and §1.4. Screenshots: `recovery/v222/shots-W1/` (Harbor; Requirements, Rank and the Funding page
at 1440 and 1024).

## What was built

### The header (`#cmdOpen`, the pickers as pills, `fitTop`'s step `cmd1`)
- `#cmdOpen` sits after the wordmark: a `<button>` drawn as a search box reading "Find or run anything" with a `Ctrl K` tag. It
  holds nothing: `cmdOpenGo()` dispatches the Ctrl K keydown on `document`, so W2's one key handler opens the palette (see *For the
  integration*). Its words stay its accessible name at every step.
- The four pickers (`#appnSel`, `#b_fy`, `#b_cyc`, `#b_pmo`) are pills; their labels (`.ctx .tlbl`) are visually hidden at every
  width (they stay the select's label and the buttons' context), so `tight1` takes nothing more from them.
- `fitTop()` gains the find box's own step, `cmd1` (its magnifier alone in a 36px button, the words clipped, never removed), taken
  after the cycle figure has left the bar (`cyc2`) and before the fourth and fifth steps and any wrap. It is taken off with the others
  (`hdr.classList.remove('cmd1')`, a line of its own so v2.15's `v215-w1-fit-not-reset` still matches).
- The plain "✎ Editable" chip is hidden (149.39); a chip that says more (read only, PMO copy, someone else holds the pen) shows.

### The left menu
- PLAN over Requirements … Brief, BOARD over Reports & exports … Setup (the BOARD heading moved up one entry; the entries and their
  order are unchanged).

### The heading line (149.35, 149.36, 149.52)
- `#uiPage .uiHd`: "Requirements" (or the section's name) and ONE line, written by `uiShowSet()`/`uiShowSay()` once the rows are drawn:
  "36 requirements", or "Showing 8 of 36 requirements" while an office, a filter or a search narrows the list. (It repeated the year,
  appropriation, office and cycle that the pickers above already say.)
- The task bar (`.tbar`, by its own ids) moved from the sticky top into the heading line: the modes as a segmented control (Review,
  Rank, Fund, Compare on those four pages; Brief stays the left menu's), the mode's tools, and ONE Add requirement — `#toolAdd`,
  now `btn pri`, last in the line. `#uiAddBtn` (the second one, `uiAddReq`) is gone. The sticky top is the header alone, so the
  rows' header pins under less.
- The tiles (`uiKpis`, `uiKpiCard(cls, lbl, v, x, m)`): Total requirement, Discretionary, Mandatory, Unfunded (149.41), each with a
  meter — funded of the requirement; drawn of the BA; drawn of the BA; unfunded of the requirement — and its line ("of $X BA · $Y
  left" or "· all drawn"; "N of M requirements short"; and "· N incomplete" on the first). "whole board" beside each name while the
  list is narrowed (`uiNarrowed`). No round marks. `scoreboard()` hands `dLeft`, `mLeft` and `wUsed` over in `UI_KPI` beside what it
  handed before; nothing is worked out again.

### Where the money runs out (`cutlinesOf`, `moneyBarHtml`, `moneyBarDraw`, `moneyBarKey`, `moneyBarPick`, `moneyBarFit`)
- `cutlinesOf(T, TT)` is the cutline computation factored out of `render()`: walking `S.order` (tiers' own order), the first
  requirement with `natM+natU` opens the discretionary line, the first with `natU` the full-budget line, Mission Critical's beside the
  first when `TT.mcNeed > 0.5`. `render()` draws the bands at `CL.disc.id`/`CL.unf.id` (the words are unchanged) and the bar reads the
  same object, so the two cannot disagree.
- `#moneyBar`, under the tiles: the WHOLE board in priority order (never the filtered list; its line says so), one block per
  requirement sized by its requirement value (`flex-grow`), RED where `unfTotOf > 0.005`, else GREEN where `laneOf` is `disc`,
  YELLOW for split or mandatory; a run of one colour carries its words and ranks ("Discretionary #1–6"; a yellow run says "Both
  lanes", "Mandatory" or "Mandatory or both lanes" by what it holds); `moneyBarFit()` measures each run's words and shortens them to
  the ranks, or hides them, rather than cut them. Beneath: the cutline sentences from `cutlinesOf`. Hidden in Brief, on the Funding
  page and in a room of 760px or less.
- Each block names its requirement and figures ("#3 B event: requirement $110, funded $60, unfunded $50") and selects it — a click
  (one delegate on `#moneyBar`) or the keyboard (the bar is ONE `role="listbox"` tab stop; arrows, Home, End move
  `aria-activedescendant`; Enter or Space selects). See *Decided in the build* 1.

### The rows ("The row is triage" holds: no control was added to a row or moved)
- Review and Compare columns: # · office chip · requirement (name and one quiet line) · band · Requirement · **Funded** (d+m, the
  record's Funded, with a meter of it against the requirement) · **Status** (the lane word on a pill in APEX's colours, and
  "unfunded $X" under it when `unfTotOf` is not zero, 149.45) · ★ · ⋯. Cumulative left Review and Compare and stays in Rank. Rank,
  Fund and Brief keep their columns (Rank's lane cell is the pill with its lane meter under it). `UI_COLIX` follows.
- The second line: an added requirement says "continues FY27" (its link) or "new" (149.38; ADDED is gone, and the ⚙ before the lane
  word); the CCaR record name only when it adds words (`recNameAdds`, 149.37; no old name, no pencil); "Award needs repair" for a
  single award whose date the board cannot read (149.28); "N to complete" from the record's checklist, its hover naming them
  (149.44: `reqTodoMap()` once per render, each `pmoProposalGate(id)` — reqNeeds' one reading).
- The hand over a row; fields keep their own pointer (149.51).
- The v2.21 status colours moved from the whole cell to the pill (`.lanec[data-lk] .pill[data-lk=…]` in `uiApexCss`).

### The table's title band and filter chips
- `#gridBand` is `#gridBandT` (the title, as v2.21 wrote it) and static chips whose state `uiChipsSync()` writes: All lanes (no lane
  filter), Unfunded N (`laneFilter='unf'`, Filter › Any unfunded portion), a chip for a lane filter set from the Filter menu that
  the chips do not carry (it takes it off), ★ Mission Critical N (`mcOnly`), Incomplete N (`incOnly`, new, 149.44), and Needs
  attention N ▾ (149.46: a popup of the Funding page's own Needs attention entries, copied with their own calls).
- A filter set either way shows on both: the chips read `laneFilter`/`mcOnly`; the Filter menu ticks what a chip set; the header's
  active-filter chips (`#fchips`) name Incomplete too.

### Columns (149.28)
- `uiColWhy(k)`: where the room's own column list already has fewer tracks than every column, each tick box is greyed (`disabled`)
  and says "Not at this width: the row already shows fewer columns, so this choice does not apply. Widen the window to use it."

### The Funding page (item 154)
- `#posture` moved from the sticky top into the page, after the tiles' place, and `scoreboard()` writes it as APEX's tiles:
  Discretionary and Mandatory (BA; "BA, all drawn" or "BA · $X drawn"; a meter; "$Y left"), ★ Mission critical (what stays
  unfunded of the must-pay total "even with mandatory", and what discretionary alone leaves short), Whole budget (unfunded of the
  requirement, funded); Unfunded by service as a bar per service against the largest (never netted); Needs attention as buttons with
  their counts as badges ("Open list →" is CSS, so each entry's text is what it was); one bar of discretionary, mandatory and unfunded
  against the requirement, which add to it exactly; Funding detail ▾ where it was.
- Every `data-v` the checks read is where it was (`.pplanes [data-v]` = BA, left, BA, left; `.pp.mc .v`; `.pp:nth-child(3) .v` the
  whole budget; `.ppsvc [data-v]` per service), and the mutated lines of the posture are kept as text.
- On the Funding page the Requirements page's tiles are not drawn (the posture's tiles state the same figures); Brief keeps both.

## Decided in the build (Brad can reverse each)
1. **The money bar is one list box, not a button per block.** The contract says each block is a button. A button per requirement
   is a tab stop per requirement (155 on Brad's FY28 board), and a block is only as wide as its share — most under 24px, a new 2.5.8
   finding on every one. Each block is an `option` with its name and figures, the bar one tab stop with arrow keys, and a click on a
   block selects it, as a click on a row does (the row-selection delegate is the precedent). Each requirement keeps a full-size way
   to it: its row, and the find box.
2. **Needs attention on the Requirements page is a chip with a popup**, listing the Funding page's own entries with their calls; its
   count is the number of lists that hold something.
3. **Unfunded is a chip** beside All lanes, so a lane filter can be set from the chips at all (All lanes alone only ever takes one
   off); the other lane filters show as a chip only when set from the Filter menu.
4. **The money bar is not on the Funding page** (its own bar of discretionary, mandatory and unfunded is there).
5. **The Requirements page's tiles are not on the Funding page**; Brief shows both, as before.
6. **The mode control shows Review, Rank, Fund and Compare on all four pages** (the concept drew it on Requirements only).
7. **A task bar too wide for the heading line goes onto a line of its own** (right-aligned) before it folds its tools.
8. **The incomplete count is the year's** (like the Filter menu's counts), on the chip and under Total requirement.
9. **Cumulative stays in Rank and in Columns there**; Review's Columns offers PMO, Decision band and Status.
10. **A single award with no readable date reads "Award needs repair"** whether or not the opening recorded a repair.

## Checks
- **audit-board "v2.22 W1 — the money bar, the tiles, the rows, the chips and the Funding page (items 155, 154, 149.35-149.46)"**
  (42 checks, 1 CONTROL): fails on the slot commit (it throws there: no money bar). The fixture makes the rules disagree: a requirement
  forced to mandatory high in the order (the cutline must not fall there), a trimmed requirement whose lane is discretionary (red,
  never green), every colour, a starred requirement short of discretionary.
- **`tools/look-fits.mjs`** (new; `npm run look`, see below) — A the find box (≥170px or 36px, header one line, 1920–820); B the
  money bar (blocks to a pixel of their share, filling the bar, words never cut; not in Brief, Funding, ≤760); C Columns greyed in a
  narrow room and live with room; D the hand over a row; E Funded, the pill and "unfunded $X" whole with a nine-digit figure at
  1920–1024, the chips 24px and clickable; F the Funding page's tiles, bars and entries on screen, no figure cut, entries 24px.
  Fails on the slot commit.
- Existing checks changed on purpose, each with its `// v2.22 W1` comment:
  - audit-board "v2.15 W1 — the context bar gives the PPBE cycle’s figure less room…": the stand-in widths carry `cmd1` (50px), and
    every step after it is 50px further down; the wrap is still last.
  - audit-board "v2.18 — the row, the tiles, …" 149.13: the cumulative is read in Rank.
  - audit-board "v2.21 — ORBIT in APEX’s look…": the band's title is `#gridBandT`; the lane reads its pill's `data-lk` and "Both
    lanes"; the colour rules are the pill's.
  - `tools/keyboard-reach.mjs` M and `tools/dialogs-keyboard.mjs`: the one Add requirement is `#toolAdd`.

## Mutations
New (`v222-w1-*`, 29) and retargeted (`v221-152-lane-key-fixed`, `v221-152-unf-not-red`) — proofs in `proofs-W1.json`,
results in `proved-W1.jsonl`.

## For the integration
- **The find box → the palette (W2):** `cmdOpenGo()` dispatches `keydown {key:'k', ctrlKey:true}` on `document`. If W2's handler
  listens elsewhere, or W2 prefers a direct call, replace `cmdOpenGo`'s body with that call (one line).
- **Incomplete in the Filter menu (W2's group):** a `mi('Incomplete records …', "incOnly=!incOnly;render()", incOnly, …)` in the
  Funding group, `incOnly=false;` in "✕ Clear all filters", and `if(incOnly) …` in `arOpenRecord`'s list of filters it takes off
  (W2's `ar*`; a requirement just added is complete, so Incomplete would hide it).
- **The search predicate (W2):** `render()` counts the rows it draws (`shown++` after the last filter line). W2's predicate call
  replaces the `q` line above it; keep `shown++` after all the filters.
- **The title band (W2's "a search is on" line):** the band is `#gridBandT` + `.gbChips` now; a line of W2's belongs in `#gridBandT`
  or beside it, not as `#gridBand`'s textContent (which would erase the chips).
- **The RECORD card (W3):** the money bar and the chips call `setCur(id)`; the bar marks the selected block on its own redraw and on a
  pick (`moneyBarMark`).

## npm script to add
- `"look": "node tools/look-fits.mjs"`, and add it to `verify:grid` (after `layout`, or before it: `layout` stops the chain on its
  carried D ×8).

## Known gaps
