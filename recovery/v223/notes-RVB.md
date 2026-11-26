# v2.23 review RV-B — two defects in Across the FYDP (item 158)

Fixer RV-B, branch `v223-rvb` from `56aa6c6`. Both defects were confirmed by a reviewer and a skeptic (probes `rv2/`, `sk2/f1.mjs`,
`f1fix.mjs`, `f2.mjs`), and were reproduced again here before the fix.

## B1 — Add to a year linked forward, and the work could go into a year twice

**What the reader saw.** The setup: base FY27, FY28 and FY29 rolled forward, FY29 on screen, and Kit made in FY29 (NEW-1, unlinked).

1. On Kit's page, Across the FYDP: Add to FY28. It works: FY28's Kit is linked to FY29's.
2. Then Add to FY27. The box starts from FY28, the nearest year, and the board said "linked to FY28's". FY27's heading still read
   "not in FY27's plan / Add to FY27…".
3. A further Add put a second Kit in FY27 (NEW-2).

**Why.**
- `xfAddDo` linked the new requirement to the year it started from (`reqCreate(..., {y:A.sy, id:A.sid})` sets `prior`). Here
  that year was a LATER one.
- `fydpLineKeys` walks the years oldest first. When it reads FY27 it has not yet keyed FY28, so the link `{2028, NEW-1}` became
  `new|2028|NEW-1`, a line of its own. FY28's Kit and FY29's Kit sit on `new|2029|NEW-1`.

**The fix** (`fydpLineKeys` and the five-year workbook's join are NOT changed; that question is Brad's, notes-W2 Q1):

- **`xfLineLink(id, sy, sid, ty, row)`** works out the link from the LINE, not the source.
  - Which line: first the line the tab reads the work by (the on-screen requirement's key), then the source's own key.
  - The candidates, in order: the key's anchor (`new|Y|ID` → `{Y, ID}`; `id|X` → `X`), then every year's member of that line,
    then the source itself.
  - The one taken is the first whose simulated key (`xfLineSim`) reproduces the line. `xfLineSim` runs `fydpLineKeys` on the years
    as they are plus one placeholder row in the target year.
  - It returns `{fy, id, k, ks, ok}`.
- **`xfLinkLine(nid, L)`** re-points the `prior` that `reqCreate` made. A requirement `reqCreate` did not link is left alone, so
  `v223-w2-add-unlinked` keeps its meaning.
- **`xfAddOpen`** works the link out when the box opens (`XFA.lfy`). **`xfAddDo`** works it out again at the press.
- **The box and the status line** name the year actually linked ("linked to FY29's"). "Starts from FY28" still names the source.
- **Defence in depth: `xfLineHeld(ty, ks)`.** `xfAddDo` refuses ("FY30 already holds this work, as NEW-1") when the target year
  already holds a requirement on any of the work's lines, the source's line included.
  - The tab's own test (`Y.r`) reads only the on-screen line.
  - So a year can hold the work on the source's line without the tab seeing it. The first cut made exactly such a requirement when
    it started from a year the tab found only as a rolled copy (`xfRolledIn`).
- A link no candidate makes reach the line is refused (`!L.ok`).

**Why the on-screen line comes first.** The source is the same work as the requirement on screen. But where the tab found it only
by `xfRolledIn` (a year between them numbered other work with the id), the source's own key is a line of its own. A requirement
linked there stays "not in" that year to the tab.

- Fixture 2 has this case: Add to FY32 starts from FY31's rolled copy.
- `xfLineLink` links FY32's requirement to FY27's line, and the tab then reads FY32 as holding it.

**Why the simulation.** The anchor is not always the link that reaches the line. Fixture 3 shows it:

- FY27's P carries a forward link to FY29's NEW-1, which is other work linked to a year before the window.
- P's line is `new|2029|NEW-1`, yet a link to FY29's NEW-1, read from inside FY29, lands on the other work's line.
- The link chosen is FY27's P.

**One existing check changed on purpose** (W2's block, commented `// v2.23 RV-B (B1)`):

- FY30's new requirement is now linked to FY27's NEW-1, the anchor of the line FY29's NEW-2 is on, not to FY29's NEW-2.
- The box says "Starts from FY29" and "linked to FY27's".
- FY30's requirement is found by its title wherever the block looked it up by `prior.id==='NEW-2'` (three places).
- `tools/fydp-across.mjs` D is unchanged. Its requirement is from the board's data (`id|R001`), so the link still names FY29.

## B2 — the FYDP total on Disc and Mand said nothing about what was directed

**What the reader saw.** USAF discretionary boxes of 300 in FY27 and in FY28, each with "drew $100" under it, over a FYDP total of
$200. Nothing said why.

**Why.** `tot()` summed the drawn figures. The boxes above it hold the directed ones.

**The fix.** For `d`, `tot()` also sums:
- the directed figure (`r.dv? r.dv[i] : r.d[i]`);
- the cap (`r.bs[i]`).

For `m` it sums the same, only in years where mandatory is on:
- the directed figure (`r.mv? r.mv[i] : r.m[i]`);
- the cap (`r.bs[i] - r.d[i]`).

It appends `directedLine(dir, drawn, cap)`, the one implementation the RECORD card and Funding by service already print under their
totals.

## Checks

`audit-board.mjs` "v2.23 review RV-B — Across the FYDP: Add to a year links to the line, never forward to the year it started from;
the Disc and Mand totals say what was directed". It drives the tab through `reqPageOpen(id,'fydp')`, its rendered Add to FYxx…
buttons, the box's own Add and Cancel buttons, and the boxes' change events.

- **B1, fixture 1** (the reported case): the box and the status line name FY29; FY27's Kit is linked `{2029, NEW-1}`; FY27 reads as
  held, with no Add to FY27; all three years are on one line; the RECORD strip shows FY27.
- **B1, fixture 2** (a source found only as a rolled copy, and a year already holding the work on that copy's line): Add to FY30 is
  refused; Add to FY32 links to FY27's line and reads as held.
- **B1, fixture 3** (the anchor is not the link).
- **B2.**
  - The Disc total reads "$200 directed $600", against the lanes.
  - The Mand total is $200 with no line (CONTROL). Then, with FY27 directed 150, it reads "directed $250", against the allocation.
  - With mandatory off in FY28, it reads "$100 directed $150".

**On 56aa6c6 the block fails 13 checks** (`BOARD=<56aa6c6's board>`). Fixture 3 passes there: the old code linked to the source,
which in that fixture is the right link. Fixture 3 is there for `v223-rvb-link-unsimulated`.

**Mutations:** 14 `v223-rvb-*`, each matching once (`mcount`: 3,536 of 3,536). Proved against their own check on the final board with
`prove.py`: **14 of 14 CAUGHT**, none by a block that threw (`proofs-RVB.json` / `proved-RVB.jsonl`).

W2's 32 mutations were proved again on this board, into a scratch file: 31 CAUGHT. `v222-w3-years-by-id` got no verdict, because its
check, v2.22 W3 "bar", fails on the unmutated board (below).

A link to a requirement from the board's data (`id|X`) is the same line in every year, so it names the year the requirement starts
from. That keeps `tools/fydp-across.mjs` D, and audit-import's W2 copy block, linking to FY29's and FY28's.

## Runs on the final board

- `npm run check`: all checks passed.
- `audit-import`, whole: ALL CHECKS PASSED.
- `npm run keys`: passed. `npm run standards`: nothing new (0 findings).
- `audit-board`, whole: 4 FAILING CHECKS, **every one already failing on 56aa6c6, and none mine**:
  - v2.22 W3 "bar": the bar now carries W1's *Open full page*. I confirmed it fails the same way on 56aa6c6.
  - v2.23 W1 "tabs" and "a tab fails" (three checks): they expect no Across the FYDP tab. I confirmed all three fail on 56aa6c6.
  - Both are integration's: W1's and v2.22's expectations were never updated for W2's tab.
- My block and W2's block, run alone: ALL CHECKS PASSED.
- `npm run across`: D now passes. **F (the strip's Manage inside the card) and "the section ran" fail at 1440 and 1024**, and I ran
  `node tools/fydp-across.mjs --board <56aa6c6's board>` to check: they fail identically there. Not mine.

An exit 137 (the kernel) cost one whole run of audit-board, which was then rerun.

## Left

- `!L.ok` (no candidate reaches the line, and the year holds nothing on it) has no fixture that reaches it. I could not construct
  one: every case I tried was either reached by a candidate or held. It stays as a refusal. It has no mutation, because the mutation
  would be the identity on every fixture.
- **`fydpLineKeys` is unchanged, so the five-year workbook joins as before.**
  - The tab and the RECORD strip read the years right.
  - Two cases would still print as separate lines in the workbook:
    - a board saved with a forward link from the first cut;
    - a requirement rolled behind a year that numbered other work.
  - Whether `fydpLineKeys` should look further is notes-W2 Q1, for Brad.
- A year holding the work on another line (fixture 2's FY30) still reads "not in FY30's plan" on the tab. Add now refuses there and
  names the requirement. Reading it as held would change the tab's rule of what is the same work, which is the same question.
