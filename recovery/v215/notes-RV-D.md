# v2.15 review RV-D — CLIN request figures, journal place titles, the guide's deck, W3-1's own-file case, a null CLIN request

Fixer RV-D, branch `v215-rv-d`, from `dbfc7c4`. Findings were confirmed by skeptics; the repros are in the scratchpad's `rv1-d/`
(`clin2.mjs`, `clin3.mjs`, `jrnl.mjs`).

## What changed

**D1 — a CLIN request held as text (wrong figure).**
- **The defect.** A request such as `['5','7']` or `['1,000','$2,000']` passes the import check (`inAmtWhy`). W4 fixed only
  `clinAskTot`, with `+b||0`, which reads `'1,000'` as 0 without saying so. Elsewhere:
  - `clinVec` seeded the grid with the text itself.
  - `clinSvcTot` joined the strings, so the drill's Allocation line read $57 for $12.
  - Set row from grid (`clinToRow`) wrote $211/$296, which is $507, into `S.alloc`.
- **One reader.**
  - `clinFig(x)` reads one figure: a finite number as it is; a string the way the import check reads it,
    `Number(x.replace(/[$,\s]/g,''))`, then whole dollars through `D$`; anything else 0.
  - `clinAskIn(v)` returns `Array.from(v, clinFig)`, which also fills holes in a sparse list with 0.
- **Where it is applied.** At the point the list is read:
  - `clinList`: base, edited (`clinAskIn(m.ask)`, which was `m.ask.slice()`) and added requests;
  - `clinAskTot`, now `clinAskIn(c.ask)` summed.
  - So every CLIN that `clinList` returns carries numbers.
- **Also read through `clinFig`** (as a backstop):
  - `clinVec`'s seed;
  - `clinSplit`'s shares;
  - `clinSvcTot`;
  - `clinSetAsk`;
  - `clinFromRow`'s weights;
  - the drill's `rq`.
- **A grid saved in text.** `clinVec` now reads a stored grid that holds anything but numbers through `clinFig`, and stores the
  result. Such a grid could be saved by a build before v2.15 seeded it from a text request.
- **The comment** that said clinVec read figures the same way as clinAskTot is corrected.

**D2 — a journal place line's title.**
- **The defect.** `jrnlPlaceTitle` judged the year as it stands now.
- **The fix.**
  - `jrnlWalk` stamps `rep:1` on every line it files by place because the list of added requirements has a repeated id (new
    helper `jrnlIdsRepeat`).
  - `jrnlCapture` carries `rep` onto the entry, and `jrnlAdd`'s join keeps it.
  - `jrnlPlaceTitle` returns `JRNL_NOT_PLACE_REP` if and only if `e.rep`.
- **Older lines.** A place line recorded without the stamp (before v2.14) reads "Recorded before v2.14", whatever the year holds now.
- **Not stamped.** A list walked by place because an element has no id is not stamped. `customMend` repairs those on opening.

**D3 — the guide.** Dropped "and the deck’s chart" from the spend-plan paragraph of the guide. The two comments (`landSvc`'s header,
the forecast's `bump`) no longer list the deck as a surface; `landSvc`'s says it was one until v2.05. The guide gets shorter, so the
size budget still holds. `flowPng`'s "slide asset" comment was left alone: it describes that function, not the removed deck.

**Lesser — W3-1's `ownStat` case** (audit-inject).
- **The defect.** The case passed `fhOwnName()+payload`, so `impFileIsOwn` was false and the own-file branch was never drawn.
- **The fix.**
  - The case now sets `FH={name: payload}`, so the file this board saves to carries the planted name, and puts `FH` back after.
  - A check that the own-file branch was reached is added: `R.rescue.ownFile` is true, and the line says "is this board’s own file".
  - The box is drawn too (`ownBox`).
- **CONTROL.** The board already escapes this on `dbfc7c4`. The check that bites is the mutation `v215-rv-d-name-own`, which drops
  the escape on the own-file branch only.

**Lesser — a null CLIN request.**
- **Decided:** null is no request.
  - The import check takes it. Refusing it would strand an older file.
  - The board reads it as none (`clinAskIn`, and an edited null falls back to the board data's request).
  - Opening no longer calls it "not a list of figures": `clinAskBadOf`'s `bad` excludes null.

## Checks (audit-board RV-D slot, and audit-inject W3-1)

**"v2.15 review RV-D — a CLIN request held as text is read as figures everywhere: the drill, Set row from grid, the split (D1)"**
- Fails on `dbfc7c4` with 9 failures:
  - the drill's lines for A and B;
  - B's $3,000, read as 0;
  - D's edited text request;
  - the seeded grid;
  - the stored grid;
  - the split;
  - Set row from grid: $211/$296 for A, $0 for B;
  - the null request said on opening.
- The stored grid's drill-and-held check was added after the first proof run. There, `v215-rv-d-grid-text-kept` SURVIVED, because
  `clinSvcTot` reads through `clinFig` and so cannot see the stored text.
- CONTROLs: the door takes the fixture; a request held as numbers; the door takes a null request.

**"v2.15 review RV-D — a line filed by place says why it was, whatever the year holds now (D2)"**
- Fails on `dbfc7c4` with 2 failures, and passes after.
- CONTROL: the fixture's place line.

**"v2.15 review RV-D — the guide names no deck, removed in v2.05 (D3)"**
- Fails on `dbfc7c4`.
- CONTROL: the paragraph is there.

**audit-inject W3-1:** the own-file case and its reach check, as above.

## Mutations

**10 new, in the RV-D slot:**
- D1:
  - `v215-rv-d-clinfig-commas`
  - `v215-rv-d-clinfig-text-kept`
  - `v215-rv-d-edit-text`
  - `v215-rv-d-grid-text-kept`
  - `v215-rv-d-null-said`
- D2:
  - `v215-rv-d-jrnl-rep-unstamped`
  - `v215-rv-d-jrnl-rep-dropped`
  - `v215-rv-d-jrnl-title-now`
- D3: `v215-rv-d-guide-deck`
- W3-1: `v215-rv-d-name-own`

**4 retargeted in place**, each with a `// v2.15 review RV-D: retargeted` comment:
- `v215-w4-clin-ask-text`: now on `clinAskIn`. Summed as stored, text joins: '057'.
- `v215-w4-clinask-list-counted`: the `bad` line with null.
- `v212-rv5-clin-base-ask-unread`: the `clinList` line, now read through `clinAskIn`.
- `v209-w1-ask-every-service`: `clinSetAsk` reads through `clinFig`.

**Re-proved because their behaviour moved:** `v215-w4-jrnl-place-title-old` and `-always`.

**Left without a mutation.** The `clinFig` reads in `clinSvcTot` and `clinSplit` are backstops behind `clinVec`, which stores numbers.
A mutation there would be equivalent, so none was added.

`mcount`: 3,769 entries, each matching exactly once.

## Proof

`recovery/v215/proved-RV-D.jsonl`: 16 of 16 CAUGHT, by a failed check (none by a throw).
- `v215-rv-d-grid-text-kept` SURVIVED the first run, before the stored-grid drill check was added.
- It was re-proved after that check: CAUGHT.

## Results

- `npm run check`: all checks passed.
- Suites run whole (HEAP=8192, one at a time through heavy.sh): audit-board, audit-other, audit-import, audit-recon, audit-inject and
  audit.mjs each ALL CHECKS PASSED. No older expectation had to move.
- The first chain was cut off by the session's 30-minute background limit partway through audit-recon. audit-recon, audit-inject and
  audit.mjs were then run again and passed.
- Browser: `npm run panels` passed; `npm run standards` has 0 findings and nothing new.
