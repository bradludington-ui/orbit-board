# v2.09 W2 — item 126: a PMO copy adds and edits requirements in every year of the FYDP

Built on branch `v209-w2` from `6405e01` (the slots), on Brad's decisions of 26 Oct 2026 (1–5) and the skeptics' corrections
recorded with them. `BUILD` is not bumped here (integration does it).

## What a copy carries now

`publishPmoCopy()` keeps the published year exactly where it was (`mode.fy`, `mode.base`, `mode.ord`, `pv:2`) and adds, for every
other year of the FYDP window (`pmoPubYears()`: base…base+4, and the year on screen if it sits outside):

- `mode.yb[fy]` — that year's own baseline, taken by `pmoBaseline()` inside `aceWithYear(fy)`;
- `mode.yord[fy]` — that year's office rankings as published;
- `mode.yn` — the window years the board had not started; each gets `yb[fy]={}` and `yord[fy]={}`.

A five-year copy is one with `mode.yb`. **`PMO_PV` stays 2**: it is the field-set version read by `pmoKeysOf`, and raising it
would make every copy already out read as the pre-v1.84 eight fields.

Every copy-side reader of the baseline reads the year on screen's (`pmoBaseOf(MS.cur)`, `pmoOrdOf(MS.cur)`): `pmoHomeOf`,
`pmoRankBuild`, `pmoSubmitBuild`, `pmoProposalIds`, `erNotSent`, `arCopyOtherYear`. Inside `aceWithYear(y)` that is year y.

## The package (one file per office, every year)

```
{ ...as before, top = the PUBLISHED year: fy, items, base, added, rank?,
  build: BUILD,                 a board older than this refuses the file whole (the door's newer-build rule)
  fys: [2028, …, 2032],         only from a five-year copy: says the package is one, even with one year in it
  byYear: { "2030": {items, base, added, rank?}, … }   every other year with something to send }
```

- Each year is built from its own state (`pmoSubmitYear`, read inside `aceWithYear`), against its own baseline.
- A proposal carries `fy`.
- Proposal ids are unique across the copy: `reqSeqNext()` is one count over every year of the copy. In a copy it stores the
  copy-wide high as the year's `newSeq`; on the board it is `newReqSeq()` unchanged.
- What is withheld (incomplete proposals, another office's requirements, a requirement restored in the copy, a requirement in a
  year the board had not started) is said once for the whole file, grouped under each year (`pmoYrLines`).

## The board side

- `pmoTake(pkg)` sends a five-year file (`pmoFive`: `fys` or `byYear`) to `pmoTakeYears`. That function validates the years, then
  takes each year through `pmoTake`'s own path with `part`: held for that year without a question; its scope, names and
  provenance read in that year; the destination list folded once over every year. It is all or nothing: a refused year
  refuses the file and leaves the review as it was. The file replaces every package its office held before.
- A legacy file (from a copy published before v2.09) takes the old path: a year question, and same office + same year replaces.
  Before v2.09, same office replaced whatever the year; that dropped a whole year from the review.
- `pmoRows`, `subBody` and `pmoReport` read each row in the year its package is held for (`pmoItemIn`, `pmoNow(id,k,fy)`,
  `pmoRanksIn`). They group rows by year, the review under `tr.subyr` headings and the report under one-cell heading rows,
  with the title naming the years. A row for a year this board has not started is `unstarted`: it can be ticked, and is
  never `gone`.
- `pmoApply` (decision 4, replacing item 52's refusal):
  - one question names each year and how many changes go into it;
  - then, for each year not started: roll forward from the year on screen (`pmoYearStart`, switchYear's own seed), start it
    blank, or stop. Stopping starts no year and applies nothing;
  - then `pmoEachYear` writes each year's rows inside `aceWithYear(y)`, oldest first;
  - an edit to a requirement that a just-started year does not hold, or that another office owns there, is not written, and
    is named;
  - the line after Apply counts only rows that can still be accepted.
- `pmoAcceptProposal` records `from.fy`. A link to another of the office's proposals is re-pointed to the requirement that
  proposal became when both are accepted in one Apply. `priorLink` resolves it through provenance when they are accepted in
  two Applies, and says "PSM proposed it, and it has not been accepted" while it has not been.
- The door (`inShapeWhy`) holds every `byYear` section to the top's rules and refuses a key that is not a fiscal year.
  `destPkgIn` walks every year.

## In the copy

- The year tools are off (`copyYearBlock`): Copy and Move to year, Roll requirements forward (both the panel and the apply),
  Set base year and Reset year. The year menu says "off in a PMO copy".
- A year the board had not started opens blank without the roll question (switchYear). The year menu says
  "not started — opens blank, for new requirements".
- The banner names the years (`.subyrs`).
- Pre-flight names an out-year's incomplete proposal under its year.
- `pmoChoices` offers an office whose only requirements are in an out-year.
- The guide:
  - office part, new section `o-years`: which years, what happens to a not-started year, recurring requirements via From
    another year;
  - team part: Publishing says what a copy covers and what is off; Taking submittals back is rewritten for decision 4 and
    five-year files.
- W3's lines (the guide's Save text, `sandboxBlock`, the greeting) and pmoSubmit's first line are untouched.

## Decided in the build

1. **The published year stays at the top of the package; the other years go under `byYear`.** Every older reader of a package
   (the review, the fuzz, older checks) reads the top unchanged, and a v2.08 board is stopped by `build` before it can read
   the top alone and drop the rest.
2. **`fys` only from a five-year copy.** A copy from before v2.09 cannot write one, so its files keep the year question.
3. **A not-started year's rows are tickable** (`unstarted`). If they were "gone", Apply could never be reached to ask how to
   start the year (decision 2).
4. **A just-started year skips an edit to a requirement it does not hold** (started blank, or not in the year it was rolled
   from), and names it. Written anyway, it would be a value filed under a requirement the year does not hold.
5. **The batch loader's one-file-per-office rule is unchanged.** One five-year file per office already passes it, and loosening
   it per year could only be reached with older one-year files, which ask questions the batch refuses anyway.
6. **The provenance key stays office + provisional id**, read in the held year. Ids are unique across a copy, and a proposal
   accepted and then rolled forward by the board must still read as taken there.
7. **`pkgSvcEach` does not walk `byYear`.** `pmoTakeYears` splits the file before the services guard runs, so each year is
   remapped or refused by name through the existing walk. A `byYear` walk would have been dead code, and was taken out.
8. **The single-year take's status line was false under decision 4** ("applies only while FY28 is on screen") and now says
   Apply puts it into its year. The two legacy year questions were reworded for the same reason: "It applies to FY28 alone",
   and "Apply asks how to start it".

## For integration (outside W2's files)

- **`tools/export-audit/audit-ui.mjs` lines 69–72** quote the legacy year questions word for word. Three checks there fail on
  purpose until the two constants read:
  - `Q_NOFY`: `'⚠ That submittal does not say which fiscal year it was written for.\n\nOK — hold it for FY27, the year on
    screen. It applies to FY27 alone.\nCancel — load nothing.'`
  - `Q_FY28`: `'That submittal was written for FY28, and this board is on FY27.\n\nThis board has no FY28 yet: ✔ Apply asks
    how to start it before anything goes into it.\n\nOK — hold it for FY28. It applies to FY28 alone.\nCancel — apply it to
    another year, or load nothing.'`
- **`tools/export-audit/audit-inject.mjs` line 556** pins `const forOf=Object.create(null);`. That was item 52's office-keyed
  map in `pmoApply`, and it is gone with the rule. `v200-forof-plain` is retired as obsolete in `mutate.mjs`. The pin should
  go, or point at a map that replaced it. The new maps are keyed by year, so a pin there guards a number, not a name.
- **The board must be on v2.09 before it receives a v2.09 copy's submittal.** A v2.08 board refuses the file whole, by the
  newer-build rule. The check for that (`a v2.08 board refuses`) builds the package under a bumped build, because `BUILD`
  still reads v2.08 here.
- **Offices should be told:** a copy published before v2.09 still sends its published year only. Out-year work in such a copy
  stays on the copy.

## A browser check, new: `tools/pmo-years-render.mjs`

jsdom cannot tell whether the copy's years and the review's year headings can be read. This tool opens both in Chromium, at
1920, 1366 and 1024 wide, in Harbor and Midnight:

- the copy's bar names the years, on screen and whole;
- the copy's year menu says which year opens blank, and the hint is whole;
- the board's review of a five-year submittal has one heading per year, each on screen, whole, and readable at 4.5:1 on its
  own ground (WCAG 1.4.3); a not-started year says so; the review does not scroll sideways (a control).

61 checks, all pass. On v2.08 (`ebe702e`) 42 fail; the 19 that pass there are the controls. It needs an npm script (suggested
below); W2 may not edit `package.json`.

Suggested script: `"pmoyears": "node tools/pmo-years-render.mjs"`, and add `npm run pmoyears` to `verify:grid`.

## Measured

- **Copy size, 115 requirements, five years held**, each requirement with an 800-character description and impact statement:
  - v2.08 copy: 3,139,423 characters; mode 103,324.
  - v2.09 copy: 3,591,354 characters (+452 KB, +14%); mode 516,340.
  - Script: the scratchpad's `w2/size/measure.mjs`, run on both boards.
- **Every new check** fails on the base board (`ebe702e`) unless labelled a control: 70 failing checks across the six blocks.
