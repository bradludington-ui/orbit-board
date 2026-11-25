# v2.23 review RV-A — the four confirmed defects on item 156 (W1's requirement page)

Branch `v223-rva`, from the fixers' slot commit `56aa6c6`. New board code is in the `// ==== v2.23 review RV-A ====` slot
(`reqPgScen`, `reqPgLockGone`, `rkScen`); W1's functions were edited in place where the fix had to be there (`reqPgDraw`, the page's
Esc listener, `reqPgEdit`, `reqPgHtml`, `rkHtml`), and the board's `input` listener that marks held typing. No CSS was needed
(`<style id="v223rva">` stays empty). BUILD not bumped.

## The fixes

- **A1 (data loss): a figure half typed on the page is never written by a redraw nobody asked for.** `reqPgDraw` now draws through
  the board's own hold, `heldRedraw(pg, el => { el.innerHTML = html; })` (v2.08 F2, v2.09 item 125): the focused, typed-into box has
  its `onchange` taken off while Chromium removes it (Chromium fires change on a focused field as innerHTML removes it, which is what
  wrote $12 over $3,600,000), and the typing, the keyboard and the caret are put back with `__held`, so leaving the box (Tab, Enter)
  applies it once (`heldCommit`). The `input` listener that marks `__pend` now covers `#reqPage` too (`#inspector, #list, #reqPage`).
  W1's own `reqPgHeld` / `reqPgHeldBack` are removed (nothing else used them). Esc on the page puts back the box's stored figure
  (its `defaultValue`, the figure the last redraw drew) and clears `__pend`, `__held` and `__awdKey`, so nothing held is applied as
  the page closes; the `__wasHeld` change filter stops the change Chromium fires as the reverted box is removed.
- **A2: the page reads the funded plan under ◨** (the lead's decision; Brad may reverse). `reqPgHtml` reads bare `tiers()`, so the
  header, Overview and Funding by service agree with Across the FYDP and Allocate. Under ◨ the page carries one line
  (`reqPgScen`, `.rpnote.rpscen`): "◨ Discretionary only is on for the list. This page shows the funded plan: discretionary and
  mandatory as allocated." The RECORD card is unchanged (it sits beside the list's banner).
  - **The Rank board keeps `scenOpt` and carries the banner itself** (`rkScen`, the list's own words, `.cutline.cut-mand.rkscen`).
    Why not bare `tiers()`: the board is "the list as shown, a column per band" and draws the list's cutlines; reading another plan
    than the rows would move a cutline when List / Board is switched in the same view. The list's ◨ banner is drawn inside `#list`,
    which `html.ui-rkboard` hides, so the board said nothing; now it says what the list says.
- **A3: Edit awards focuses an enabled date box.** `reqPgEdit(id,'awd')`: `input[type="date"]:not([disabled])`, else the first
  enabled input or button. A selector list answers in document order, so `'…, input, button'` took an incremental block's disabled
  single-date box and focus went nowhere.
- **A4: a requirement the lock on screen does not hold.** In a locked cycle's view the not-held branch (`reqPgLockGone`) says
  "<O&M PB27>, the locked cycle on screen, does not hold <name> in FY27: it was added after the lock, or removed before it. Leave the
  view to see the working plan's." with the heading "Not in O&M PB27"; the name is read from the working plan set aside
  (`_cycStash.MS.years[fy]`) when the view's year lacks it. Leaving the view shows the requirement.

## Checks — each fails on 56aa6c6, unless a CONTROL

- **audit-board**, RV-A slot, four blocks:
  - "v2.23 review RV-A — A1: …" — Chromium's change-on-removal is stood in for where the browser fires it: `#reqPage`'s innerHTML
    setter fires change on the focused box when its value differs from its baseline (the value it took the keyboard with or last
    committed: a `focus`/`change` capture listener). A redraw the person did not cause (★ toggled behind the page) then: nothing
    written, nothing journalled, the box still says 12 with the keyboard; Esc: 550 put back, nothing journalled, the page closed;
    Enter (a second run): 12 applied once, one journal line.
  - "… A2: …" — under ◨ the Overview and Funding by service equal ◨-off (A: Mandatory 150, Unfunded 0; the what-if reads 150 —
    CONTROL), the note is there (and not with ◨ off — CONTROL), Across's FY27 Unfunded is —; the Rank board carries the banner under
    ◨ and not without.
  - "… A3: …" — on A (incremental: the block's first date box is disabled — CONTROL) `reqPgEdit('A','awd')` leaves the keyboard in
    an enabled date box of the award block.
  - "… A4: …" — PB27 locked, Field kit added after, the page opened on it, the lock viewed: heading and line as above, no "removed
    or deleted", no NEW-1; leaving the view shows Field kit.
  - The blocks' "no page error" ignores jsdom's own `Not implemented: window.scrollTo` (reqPageOpen calls it).
- **Chromium:**
  - `npm run across` **G** (new): the real path from the reviewer's `f1d.mjs` — the page at Across the FYDP, a timer set before the
    typing (as the Live tick is) adopts a copy with R001's ANG figure changed (`applyStore`, `persist`, `render`), "12" typed in
    FY27 USAF with the real keyboard. Then Esc: USAF still $123,456,789, nothing journalled, page closed; on a second page Tab: 12
    applied once, one journal line. **On 56aa6c6 G fails 3 checks** (the load wrote 12; Esc left it written, one line).
  - `npm run reqpage` **F** (new): a real click on Edit awards on R002 (incremental) leaves the keyboard in an enabled date box of
    its award block. **Fails on 56aa6c6** (focus fell to the `<aside>`).
- **Harness fixes found on the way, both failing on 56aa6c6 for reasons unrelated to RV-A:**
  - `npm run across` F read the RECORD card while the requirement page (mounted through `reqPageOpen` since W1 merged) was still
    open and hid it: `inside:false` and a 30 s timeout at 1440 and 1024. F now closes the page first.
  - `npm run reqpage` A (1024, the fydp tab) counted the cells Across the FYDP's grid scrolls inside its own frame as "past the right
    edge" (the frame itself is measured, and `npm run across` A holds it inside the page); and B expected History right after
    Awards, where W2's Across the FYDP now sits (order 40). Both corrected.

## Mutations (`v223-rva-*`, 9 new) and retargets (2)

| id | the defect | caught by |
|---|---|---|
| v223-rva-a1-redraw-unheld | `pg.innerHTML=html` without the hold | board A1 (jsdom stand-in); Chromium: across G |
| v223-rva-a1-page-unmarked | the listener leaves `#reqPage` out | board A1 |
| v223-rva-a1-esc-no-revert | Esc leaves the typing, the close writes it | board A1 |
| v223-rva-a2-page-reads-view | `tiers(null, scenOpt())` back in reqPgHtml | board A2 |
| v223-rva-a2-page-note-gone | no ◨ note on the page | board A2 |
| v223-rva-a2-rank-banner-gone | the Rank board without the banner | board A2 |
| v223-rva-a3-disabled-first | the old selector list | board A3 |
| v223-rva-a4-lock-unsaid | the lock branch off | board A4 |
| v223-rva-a4-lock-names-id | named by the id | board A4 |

Retargeted to the widened listener, the same mutation each: `v208-f2-typing-not-marked`, `v209-w1-row-typing-not-marked` (now
`#inspector, #list, #reqPage` → `#inspector, #reqPage`). `mcount`: every target matches once.

**Proofs.** `recovery/v223/proofs-RVA.json` → `proved-RVA.jsonl`: **11 of 11 CAUGHT** by a failed check (none by a block that threw),
each against its own block on a mutant of this board. `v223-rva-a1-esc-no-revert` SURVIVED the first run and was right to: after a
held redraw the box's change baseline is the figure put back, so the page closing fires nothing whether Esc reverts or not; the revert
matters only for Esc with no redraw before it (typed from the stored baseline). A1 gained that path (a CONTROL: it passes on 56aa6c6,
where W1's Esc already reverted), and the mutation is caught by it.

**Chromium mutants, by hand** (`recovery/v200/bin/mkmut.py`, then the browser check with `--board`):
- `v223-rva-a1-redraw-unheld` → `npm run across`: G fails 3 (the load wrote 12; Esc left it written, one journal line).
- `v223-rva-a1-page-unmarked` → `npm run across`: G fails the same 3.
- `v223-rva-a3-disabled-first` → `npm run reqpage`: F fails at 1440 and 1024 (focus on the `<aside>`).

## Results on the final tree

- `npm run check`: all checks passed. `mcount`: 3,531 entries, every one matches once.
- **audit-other whole: ALL CHECKS PASSED.**
- **audit-board whole: 4 FAILING, all from before RV-A and outside it. The same 4 fail on 56aa6c6** (the two blocks run alone on that
  board): W1's "the requirement page" block expects the tabs without W2's Across the FYDP (`tabs`, and twice under `a tab fails`: 5
  vs 6 tabs), and v2.22 W3's RECORD card bar expects no Open full page. These are the integration's (W1's checks written before W2's
  tab merged, v2.22's before Open full page). Left for the lead; every RV-A block passes.
- Browser: `npm run reqpage` ALL CHECKS PASSED (with F and the two harness fixes); `npm run across` passes A–G at every width;
  `npm run keys` and `npm run record` pass; `npm run standards`: 0 findings, nothing new.

## Known gaps

- The Rank board does not carry the list's 🔒 locked-view line either (the list draws it inside `#list` too); the header tag and the
  title still say which lock is on screen. Not in RV-A's findings; left.
- The clearing of `__pend`/`__held` in the page's Esc is defensive: with the value put back, `heldCommit` and the `__wasHeld` filter
  already pass nothing on, so it has no mutation of its own.
