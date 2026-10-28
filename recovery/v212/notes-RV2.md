# v2.12 RV2 -- the second review's W2 findings: one reading of a stored paragraph, one rule for what goes out with no WBS

Branch `v212-fix2`, from `c23e8a0` (`v212-int`: W1, W2 and W3 merged). Findings from `recovery/v212/review-W2int.json`
(`K00`-`K17` = its `kept` list in order); my set: K00 K01 K02 K03 K04 K05 K06 K07 K09 K14 K15 K16 K17. Each was read with
both skeptics' votes, and fixed as the votes narrowed it. `BUILD` not bumped, nothing pushed or merged, CLAUDE.md untouched.

## Per finding

**K00, K07 -- a stored paragraph written "code - name" was read two ways, and the boxes rewrote it unasked. Fixed.**
- *Wrong:* `wbsUnlisted`, `matBulk().wbs.get` and `aceWbsOf` read a stored paragraph whole (`aceNormWbs`), so "1.2.1 -
  Organizational" (taken as typed before an estimate named O&M, or pasted from CCaR's column) was flagged *not in the
  estimate* by Needs attention, the WBS lines and Classify, and claimed "1.2.1-ORGANIZATIONAL" in the tie-out, while the
  edit box, `wbsTake` and the Spend Plan Source read it as 1.2.1. And `erUpdate`, `arUpdate` and the quick box's `pick`
  ran `wbsPickedIn` on the text the field opened with: the edit box opened dirty, ↓ asked to discard typing nobody did, and a
  Save of any other field rewrote the paragraph; the Add box finishing From another year and the quick box's OK did the same.
- *Changed:* the one reader is `wbsCodeIn` -- `wbsUnlisted`, `matBulk().wbs.get`, `aceWbsOf` (both its loops; W1's, §08)
  now read with it. `erUpdate` shortens a pick only while the field differs from `erSnap.wbs`; `arUpdate` only while it
  differs from `arFin.wbsFrom`; `wbsQuick`'s `pick` only while it differs from `was`. A stored paragraph is kept exactly as
  stored unless the person changes the field.
- *Check:* audit-other "v2.12 RV2 — a paragraph stored as CCaR writes it is read as its code everywhere, and nothing rewrites
  it unasked (K00, K07)" (Needs attention, the WBS lines, Classify's get and grid cell, `aceWbsOf`, the edit box open/↓/Save,
  the quick box open/OK; C a CONTROL); the Add box half is in the K17 block (K3). Every non-CONTROL part fails on c23e8a0.
- *Mutations:* `v212-rv2-unlisted-whole-text`, `v212-rv2-bulk-get-whole-text`, `v212-rv2-acewbsof-whole-text`,
  `v212-rv2-er-rewrites-stored`, `v212-rv2-ar-rewrites-carried`, `v212-rv2-quick-rewrites-stored`.

**K01, K05, K09, K14 -- Without a WBS, its heading and the Spend Plan Source's message were two rules. Fixed, as one.**
- *Wrong:* Needs attention listed a requirement only when no line had a paragraph (a prime: a CLIN carrying money had none),
  while the export sent blank: a split's unassigned remainder, a prime's money on a service no CLIN carries, and (case c) used
  a prime's hidden requirement-level `S.wbs` that `wbsStateOf` ignored. The heading counted every funded dollar of a
  requirement with any paragraph; `srcNoWbsSay` sent the person to "each requirement's record (Needs attention lists them)",
  a list that did not hold them and, for a prime, a record with no WBS field; W2's check cut the sentence at the dash.
- *Changed (the lead's rule: one function both read):* the list is read off the export's own lines.
  - `srcRowsOf(fy, St, T, rec, only)`: with `only` it records the lines and builds no row; each line records why its column
    goes out blank (`nw`: none, clin, rest, line, noclin), from `srcWbsParts`, which now returns that as a third element.
  - `srcWbsParts`: a prime's money on no CLIN goes out blank (`noclin`) -- a prime's requirement-level paragraph is read
    nowhere, as `wbsStateOf`, the edit box and `reqApply` already treat it (kept as stored, never dropped).
  - `wbsBlankOf()` runs it on the funded plan (bare `tiers()`, as the export; never the ◨ view) inside **`clinReadOnly`** --
    the SI tab's `clinRead` hoisted beside `clinListRO` (monSheet now calls it), because `clinList`/`clinVec` create CLIN
    containers and a draw must write nothing. `wbsBlankSum(rec)` is the one reading (amount, lines, why with dollars);
    `wbsBlankWhy` words each reason; `wbsWhyOf` adds wbsStateOf's reasons for an unfunded structural case.
  - `attLists`: listed when wbsStateOf finds no paragraph (as before) **or** any funded dollar goes out blank; each row
    carries `blank` and `why`; the heading's funded dollars are those that go out on a paragraph (`cov.f += funded - blank`);
    `funded` on both WBS lists is the funded plan's. `attBody` draws *What goes out with no WBS* · *No WBS* · *Funded*.
    `ATT_KIND.wbs.why` says what is listed. Guide `t-wbs` reworded (net 11 characters shorter; the guide is 69,002 < 70,000).
  - `srcNoWbsSay(rec)` reads `wbsBlankSum`: "… — Needs attention › ▦ without a WBS lists each, with what to fix." Every
    requirement it names is on the list by construction.
- *Check:* audit-other "v2.12 RV2 — Without a WBS, its heading and the Spend Plan Source’s message are one reading of what
  goes out blank (K01, K05, K09, K14, K16)" -- eight requirements (a split with a remainder, no paragraph, whole, a prime
  funded ANG on no CLIN, a CLIN allocated money with no paragraph, a CLIN with a request and $0 allocated, the same in the old
  array form, an unfunded prime): the list, why, dollars, heading, the list as drawn, the posture, the workbook's blank lines
  read from its bytes equal to the list's, the whole message, the draw writing nothing, a prime's requirement-level paragraph,
  and fixed in the drill. Fails on c23e8a0. Moved on purpose (each with `// v2.12 RV2:`): W2's Needs attention block (heading
  $890 not $690; rows carry why and the blank dollars) and W2's Spend Plan Source block (the whole sentence, and B and C on
  the list with their blank dollars).
- *Mutations:* `v212-rv2-att-any-line`, `v212-rv2-cov-all-funded`, `v212-rv2-list-view-funded`, `v212-rv2-prime-req-wbs-read`,
  `v212-rv2-say-old-pointer`, `v212-rv2-blank-sum-skips-clin`, `v212-rv2-draw-writes`, `v212-rv2-draw-why` (hostile).

**K02 -- the WBS quick box dropped typing on Esc. Fixed.** `#uipVal` has `data-held="1"` (saved only by its own OK), so the box
controller asks before Esc throws typing away. Checks: audit-other "v2.12 RV2 — the WBS quick box asks before Esc throws away
what was typed (K02)" (declined, accepted, nothing typed as CONTROL), and keyboard-reach T in Chromium ("the quick box: Esc
with a paragraph typed asks first, and Cancel keeps the box, the typing and the keyboard"; its dialog handler records and
can answer Cancel). Both fail on c23e8a0 (keys run with `--board`). dialogs-keyboard still skips uipPanel (its Cancel
discards as it says and its backdrop closes nothing, which that sweep's three ways of closing would read as typing lost); the
skip's reason was false since v2.12 and now names the two checks that hold it. Mutation: `v212-rv2-quick-esc-unguarded`.

**K03 -- the CLIN drill and the PMO review showed a bare code. Fixed.** `wbsClinSay(pid, key)` under the drill's WBS button: the
paragraph's path, or "⚠ not in the … estimate: 4.4" for any the estimate does not hold (reads `wbsClin`, creates nothing).
`wbsReviewTxt` in `pmoFmtVal('wbs')` (the review table and the change report): "1.2.1 — path", or "9.9 (not in the …)".
Check: audit-other "v2.12 RV2 — the CLIN drill and the PMO review name a paragraph, and flag one the estimate does not hold
(K03)" (the drill as drawn, the words, and a submittal through `pmoTake` read off the drawn review). Fails on c23e8a0.
hostile.mjs plants a hostile paragraph on PRIME-2's base CLIN (`clinwbs0`, now in MUST_SHOW). Mutations:
`v212-rv2-drill-no-name`, `v212-rv2-drill-unflagged`, `v212-rv2-draw-clinsay` (hostile), `v212-rv2-review-bare`,
`v212-rv2-review-unflagged`. Not done: a proposed new requirement's own WBS (`pmoFmtVal('__new')`) is still not printed in
the review -- not in the finding; noted for the lead.

**K04 -- Classify said a split requirement "never offers" the field. Fixed.** A bulk entry may say why it leaves a row alone
(`skip(it)` → [one, many]); `matBulkPreview` counts the left-alone rows by it and `matSkipSay` words the preview, the confirm
and the status line; an entry without one reads exactly as before. WBS: "N primes, whose WBS is per CLIN, left alone" and
"N with a WBS split, left alone so the split is kept" (a single line with dollars typed by paragraph counts as a split -- the
second vote's case). Check: audit-other "v2.12 RV2 — Classify says why a bulk WBS leaves a requirement alone (K04)" (preview,
confirm, status; MIPR's unchanged default wording as CONTROL). W2's Classify preview check moved (`// v2.12 RV2:`).
Mutations: `v212-rv2-skip-said-never`, `v212-rv2-skip-split-as-prime`.

**K06 -- a paragraph's Spend Plan Source total drifted from what the office typed. Fixed.** `srcWbsSpread(St, id, it, i, pcs)`:
a service's pieces (lanes × increments × CLIN parts) are collected first; each group (the requirement, or each CLIN) is split
over its paragraphs ONCE by `srcWbsParts` on its whole draw (d + m -- the second vote's correction: per-lane-once still
drifts), then each piece, in the order its lines go out, by largest remainder from what each paragraph still has to take.
Both margins exact; lines and every other cell unchanged; a non-whole (modelled) group falls back to the per-piece split.
Check: audit-other "v2.12 RV2 — the Spend Plan Source sends each paragraph what the office typed for it, measured against the
allocation (K06, K15)", board ONE (twelve increments of $25 over $100 × 3; $151 + $149 over $100 × 3): totals $100 each, every
line the suite's `w2Spread` oracle, each increment's lines adding to it on its own date. Fails on c23e8a0 (108/96/96). W2's
Spend Plan Source oracle restated as `w2Spread` (`// v2.12 RV2:`; on its fixture both rules agree). Mutations:
`v212-rv2-spread-per-piece`, `v212-rv2-spread-not-left`.

**K15 -- the Spend Plan Source check could not see the base a split is measured against. Fixed (check).** Board TWO of the same
block: B asks $700, is allocated $600, drawn $251 + $249 (ask, allocation and draw give three answers); Q's CLIN 0001 split
$60 / $30 of its own CLIN's $100 (prime $300), both typed through `wbsAdd` / `wbsSetNum` / `wbsSetVal`. Its lines pass on
c23e8a0 (the base was right there: CONTROLs for the mutations); its last part, Without a WBS on the funded plan under ◨, is
K01's and fails there. Mutations: `v212-rv2-split-base-ask`, `v212-rv2-split-clin-base-prime`.

**K16 -- no fixture reached wbsClinMoneyRO's allocation branch. Fixed (check).** In the K01 block: Q's CLIN 0002 requests $0
and is allocated $100 in the drill (`setClinSvc`); R's requests $100 and is allocated $0 (stays unlisted); R2 the same with
`S.clinAlloc` in the old array form (asserted still an array when read); U, unfunded, allocated $50 on a CLIN with no paragraph.
Mutations: `v212-rv2-clin-money-keyed-ignored`, `v212-rv2-clin-money-array-ignored`.

**K17 -- a paragraph carried from another year was kept but nothing tested it. Fixed (check).** audit-other "v2.12 RV2 — a
paragraph carried from another year is kept as stored, even one the estimate does not hold (K17)": FY26 holds three of AV's
requirements made in the Add box, each missing its description; K1 on 4.4 (not in the estimate) opens flagged *kept as stored*
and is added unchanged; K2 changed to 5.5 is refused with the typing kept, changed to 1.2 is taken; K3 on "1.2.1 -
Organizational" opens holding it whole (K00) and is added as stored. K1/K2 pass on c23e8a0 (CONTROLs for the mutation); K3
fails there. Mutation: `v212-rv2-carried-refused` (`return wbsTake(raw);`).

## Not fixed, and why
None of my thirteen. One related point left as it is: `aceWbsOf` still reads a requirement's own lines AND its CLINs' for every
requirement, whatever its type (pre-v2.12, W1's tie-out). The Spend Plan Source, Needs attention and the edit box now agree
that a prime's WBS is its CLINs' only; aligning the tie-out's claims to that would change which office claims a line under
AV + PSM for a prime switched from OGC (or the reverse) -- for the lead / Brad.

## Checks that fail on c23e8a0 (each block run against `git show c23e8a0:prioritization-board-grid.html`, BOARD=that)
38 failing checks over the six new blocks and the four moved W2 checks; every non-CONTROL part of each new block fails there
(listed above per finding). keyboard-reach T's new step fails there (`--board`). The stated CONTROLs pass there.

## Mutations
29 new (`v212-rv2-*`), 2 retargeted with `// v2.12 RV2:` comments -- `v212-w2-att-cov-of-dropped` (the coverage reads `wf` now)
and `v209-w4-clin-read-leaves-state` (the SI tab's `clinRead` is `clinReadOnly` now, beside `clinListRO`). None retired.
Proved: `JOBS=1 HEAP=8192 prove.py recovery/v212/proofs-RV2.json recovery/v212/proved-RV2.jsonl`: **31 of 31 CAUGHT**, none
threw, none survived at the end. On the way `v212-rv2-draw-why` SURVIVED: the hostile CLIN number is cut to 20 characters in
the why column, so no whole planted value reached it; hostile.mjs now allocates PRIME-2's CLINs nothing on the hostile service,
so "<hostile service> money on no CLIN" is drawn, and it is caught (re-proved with `draw-clinsay` after that change).
`mcount`: 2,984 targets (2,955 + 29), every one once.

## Runs (on the final tree)
- `npm run check`: all checks passed. Money map: `node tools/money-map.mjs --check` holds -- 322 cells, 119 proven, 202 n/a, 1
  open (the v2.04 `aiExport` follow-up, as before); `ot.v212rv2src` added (exportSrc's service and requirement cells), the
  report regenerated.
- jsdom, each WHOLE, one at a time: audit-other, audit-hostile, audit-board, audit (export), boot-same, legacy-fsrc,
  audit-inject, audit-ui, audit-recon (8 GB), audit-import (8 GB) -- see the final answer for the import result.
- Browser: panels, dialogs, hostile-render, controls, editors, dropdowns, leftmenu, menus, keys (T included), pointer, pmosave,
  pmoyears, standards (0 findings, nothing new) -- all pass; layout -- only the 8 carried D results. pmosave failed once (G,
  "the copy as published, opened next, follows that choice") while audit-recon ran beside it; it passed on c23e8a0 and again on
  this tree on the next two runs -- a timing flake under load, not this change.
- Render cost: on a 115-requirement board with primes, CLINs, splits and increments, `attLists()` takes ~10 ms (it was ~1 ms):
  it now reads the export's lines. A draw (render) went from ~680 to ~750 ms in jsdom; the CLIN containers are unchanged by it.

## For the integration
- **Expected conflicts.** RV1 (W1's §08): `aceWbsOf` (two lines, the reader). RV3 (W3): `attLists` (the WBS part only),
  `ATT_KIND.wbs`, `attBody`'s column branches, the guide's `t-wbs` (I did not touch `t-alloc`'s list), `scoreboard`'s posture
  (untouched), and the guide's 70 KB budget (mine is 11 characters shorter). `mutate.mjs`: my ids are in the W2 slot; the two
  retargets are the W2 slot's `v212-w2-att-cov-of-dropped` and the v2.09 W4 entry `v209-w4-clin-read-leaves-state`. hostile.mjs:
  two plants under PRIME-2 (`clinWbs.b0`, `clinAlloc`), `clinwbs0` in MUST_SHOW, one sweep step (`attShow('wbs')`).
- **Browser tools changed:** keyboard-reach T (a dialog handler that can answer Cancel, and the Esc step), dialogs-keyboard
  (the uipPanel skip's reason only).

## For Brad
- The coverage heading now counts **dollars that go out on a paragraph**, and a requirement with a paragraph is listed when part
  of its funded money still goes out blank (a split's unassigned part, a prime's money on no CLIN) -- the lead's reading of the
  two votes, which called counting remainders a design choice. Worth confirming.
- A paragraph left on a requirement switched to a prime is no longer sent on the prime's money that no CLIN carries (no box
  shows it); it is kept as stored.
