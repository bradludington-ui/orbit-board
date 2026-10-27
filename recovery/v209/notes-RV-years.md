# v2.09 review — the five-years fixes (item 126)

Branch `v209-rv-years` from `9bc5496` (the integrated board the review froze). Five confirmed findings, each fixed in the board,
each with a block in `audit-import.mjs`'s W2 slot that fails on `9bc5496`, and each with mutations that undo the fix, proved
caught by `recovery/v208/bin/prove.py` (`proofs-RV-years.json`, `proved-RV-years.jsonl`). `BUILD` is not bumped here.

## What was fixed

1. **A second copy reused an id the board had already filed** (`second-copy-reuses-accepted-provisional-id`).
   The board files an accepted proposal under its own `NEW-n`, numbered by that year alone. The copy's id survives only in the
   provenance (`from.nid`), and no count read it. So the next copy, numbering from the busiest year, minted the same id. Its office's new,
   different requirement then read "ALREADY ADDED AS NEW-1", had no checkbox, and could never be accepted.
   - `reqSeqNext()` now counts, in a copy, past the trailing number of every `from.nid` that any year it holds carries. It
     counts only up to nine digits, so a hand-made huge id cannot push the count to a number floating point cannot step.
   - **The older form, two copies out at once, is fixed as well.** Two copies published one after the other, before either
     proposal was taken, number from the same count. An accepted proposal now records which copy it came from
     (`from.pub`, the package's `fromTs`, which is the copy's publish stamp).
     - `pmoProvIn(T, office, nid, pub)` is the one reader of provenance. It finds the same copy's proposal where both sides carry
       a stamp. It finds any copy's where either side does not: one accepted before this fix carries none and reads as before.
     - `pmoTakenAs` reads through `pmoProvIn`.
     - `pmoTakenElse` names a different copy's proposal under the same id. The review row and the change report then say
       "ANOTHER COPY’S PROPOSAL UNDER THIS ID IS ON THIS BOARD AS NEW-3 — check it is not the same work". The row stays tickable,
       so the reviewer decides (Brad, v2.06: duplicates are caught and discussed in reviews).
   - `priorLink` reads through `pmoProvIn` too.
   - W2's decision 6 stands: the key is still office + provisional id, read in the held year. The stamp only tells two copies
     apart when both say which copy they are.

2. **A proposal into a year Apply starts by rolling forward duplicated what the roll brought in**
   (`unstarted-year-roll-duplicates-linked-proposal`). This is how it now works in `pmoApply`:
   - **Before anything is asked,** each not-started year is worked out as the roll forward would start it (`rolled[y]`).
   - **The roll-forward question** names every ticked proposal whose link that year would already hold. It says "Rolled
     forward, FY32 would already hold what 1 of the ticked proposals continues …".
   - **Once every year is chosen,** one question asks about the duplicates. It runs against the states that will actually be
     started (`started[y]`), so a year started blank asks nothing. OK accepts them. Cancel leaves them unapplied and still held
     for review, and everything else ticked is applied.
   - **The years are then started from exactly those states.** Nothing is written before the last question.
   - **The review and the change report say it too,** on a proposal for a year not started. The review row (`.subroll`) reads
     "ROLLED FORWARD FROM FY28, FY32 WOULD HOLD A — accepting adds it again", read against the year on screen, which is what
     Apply rolls forward.
   - **Once the year exists,** the ordinary "FY32 ALREADY HOLDS" warning is given, and accepting is the reviewer's call.

   `pmoPriorHere(p, fy, from, T0)` takes the year state to read (`T0`) and the row's office and copy (`from`).

3. **A link to another of the office's proposals stayed on the copy's provisional id** (`link-to-office-proposal-stays-provisional`).
   - **The re-point now has one place.** `pmoRepointLinks()` runs at the end of every Apply, over every year. It re-points
     every link that names an office's provisional id (`pmoProvId`: `NEW-<office>-n`, never `NEW-n`) once the board has accepted
     that proposal in the year the link names. The re-point inside `pmoAcceptProposal` is gone: it only reached a proposal
     accepted *before* the link, and it was redundant once the end-of-Apply pass existed.
   - **A link with no provenance of its own** belongs to a requirement the team rolled forward before its original was
     accepted. It is re-pointed only where exactly one accepted proposal carries that id.
   - **What reads the stored link:** `yearHas`, `yearLinkOf`, `naFromHere` and Roll requirements forward all read it, and it
     names the board's own id.
   - **A link on an incoming proposal is resolved too.** `pmoPriorHere` resolves it through the provenance: the proposal
     itself, filed in that year (a whole-year roll carries `from`), or the requirement it became in the year the link names.
     So the review's "ALREADY HOLDS" fires for a proposal that continues an accepted, rolled sibling.

4. **Apply into a year it started folded every accepted change into one journal line** (`unstarted-year-apply-not-journalled`,
   the same as cross's `apply-started-year-not-journalled`).
   - `pmoApply` calls `jrnlCapture()` once the years are started (`if(need.length)`).
   - Starting the year becomes its own "created" line (not undoable, correctly). Every accepted change is then journalled field
     by field, with Put back, at the closing `save()`.
   - The review used `jrnlCapture()`, the cross skeptic `save()`. The capture was chosen: it records the start and retakes the
     shadow without persisting a half-applied board.

5. **Submit outside the copy's years said "Nothing to send yet"** (`submit-outside-window-says-nothing-to-send`). The board can
   still hold a year before its window, such as FY27 after the base moved to FY28. A copy opens that year, keeps what is typed
   there, and sends none of it. Three helpers do the work:
   - `pmoOutYears()` lists the years a copy holds and does not submit for.
   - `pmoOutChanged()` lists, of those, the year on screen and every one the change journal shows edited since publication.
   - `pmoOutSay(L)` gives the one sentence that names them.

   That sentence is said:
   - **In the year menu:** "has data — not sent from this copy".
   - **On switching there:** appended to the Working FYxx status line.
   - **In the RECORD panel,** where the value boxes edit: `.insp-notsent`.
   - **At Submit,** in two cases:
     - nothing to send from the copy's years: "Nothing to send. This copy submits for FY28–FY32. FY27 is not one of them …
       Nothing was sent." replaces "Nothing to send yet";
     - otherwise: an alert in the withheld alerts' form, and a clause on the status line.

   The edit box's `erNotSent` is unchanged. A copy holding FY27 with nothing edited there says nothing at Submit (a control).

   The guide's office section *Which years you can work in* (`o-years`) gains one paragraph. It says such a year reads "not sent
   from this copy", that nothing changed there is sent, and that the record and Submit say so.

## Decided in the fix

- **The stamp, for two copies out at once.** The skeptic offered `from.pub` for the older form. It is kept as an addition to
  the office + id key, never in place of it. A different copy's proposal under the same id is *named* and left tickable, never
  dropped and never added silently.
- **The duplicate question's Cancel leaves only the duplicates out.** It does not stop the whole Apply. Stopping everything is
  still the start question's Cancel, then Cancel again. The roll-forward question names the duplicates first, so the reviewer
  has that choice with the facts in front of them.
- **One re-point, at the end of Apply.** The skeptic suggested keeping the re-point in `pmoAcceptProposal` beside the new pass.
  With the pass there, the old one changes nothing a check can see, and its mutation (`v209-w2-link-not-repointed`) would have
  turned equivalent without a word. So it is removed, and that mutation is retargeted to the pass.
- **What counts as an edit in a year the copy does not submit for** is a journal entry since publication with a path past its
  container. A visit that only normalises containers is not counted. The wording names the year, not "your edits", so a false
  positive cannot be untrue.

## Checks (audit-import, W2 slot, named "v2.09 review — …")

| Block | Fails on 9bc5496 |
|---|---|
| a second copy never reuses an id the board has filed, and two copies out at once keep their proposals apart | copy 2's id, its checkbox, its landing; the two copies |
| a proposal into a year Apply starts names what the roll forward would duplicate, and the reviewer decides | review, report, both questions, left out, the line; its own accepted proposal rolled whole |
| a link to another of the office’s proposals names the board’s own id once that one is accepted | the re-point in one Apply and a later one, Roll forward's plan, the review's ALREADY HOLDS, a rolled copy with no provenance |
| Apply into a year it starts records every accepted change in the journal, each with Put back | the per-field entries and Put back |
| a year the copy holds and does not submit for is said to be not sent, at the edit and at Submit | menu, switch, RECORD panel, Submit from FY27 and from FY28, the line |

Run on 9bc5496 (`BOARD=…/board-9bc5496.html`): 32 failing checks across the five blocks; every non-control check fails.

**Browser:** `tools/pmo-years-render.mjs` gains a section. The fixture also holds the year before its base, and in both themes
at every width the tool checks two things:
- the year menu's "not sent from this copy" hint is whole;
- the RECORD panel's note is on screen, whole, and reads at 4.5:1.

That makes 73 checks, all passing. On 9bc5496 the 12 new ones fail: two per width, times three widths, times two themes.

## Mutations (mutate.mjs W2 slot, `v209-rv-years-*`)

25 new, among them `v209-rv-years-seq-unbounded` for the nine-digit bound, whose block plants a thirty-digit provenance id.
Plus 3 older ones retargeted in place:
- `proposal-double-add` (pmoTakenAs reads through pmoProvIn);
- `v206-fix-review-no-warning` (the review passes the row's office);
- `v209-w2-link-not-repointed` (the re-point moved to pmoRepointLinks).

All 28 were proved CAUGHT against their own blocks. No sweep was run.
