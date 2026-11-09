# v2.15 review RV-B — items 138 and 145: four findings fixed

Branch `v215-rv-b`, from `dbfc7c4`. Each finding was confirmed by an independent skeptic (the repros were
`scratchpad/rv1-b/tree/tools/export-audit/_e1.mjs` to `_e4.mjs`). Every check below fails on `dbfc7c4` unless it is labelled
CONTROL or "holds on dbfc7c4 too" (those three guard the new reading, and each has a mutation that needs them).

## B1 — a board holding nothing takes a plan for the appropriation on screen whole (wrong figure, a v2.15 regression)

`cycInFor` decided "this board holds nothing" with `!has(cur)`. For the appropriation on screen `cur` is `MS`, which always has
`years`, so a package (pkgApply), a consolidated file's ALL (consTakeApply) or a board file (importBoards) for it, taken into an
empty board, dropped its tag, its deltas reference and every PPBE position but none. The same package for another appropriation was
taken whole.

Fix (the skeptic's): `holds = has(cur) && (a non-empty tag || cycHasReqs(cur) || any PPBE position)`, and `whole = !holds && …`
as before. Measured: e4's three doors now take O&M whole, as they take Initial Spares and Full Fund.

## B2 — the budget cache follows the cycle the plan is taken under (wrong figure)

When `cycInTake` gave a plan this board's tag and position, each year's `discSvc`/`mandSvc` stayed as the package had worked them out
under its own cycle. The Spruills printed them under a note naming this board's cycle (e1: Full Fund's FY27 read $292 = PB27's $222
… under "BES28", where BES28 gives $870).

Fix: where the tag or the position under it differs (`made !== I.tag` or the package's position under its tag is not, by `pkgCanon`,
the position now under the taken tag), `cycInBa` deep-copies the years and works each year's cache out again with
`baOf(year, y, {key: tag, P: position, lock: ''})` — the one reading, so this is the figure that appropriation's own board works out
when it opens (the check compares the two). `baOf` reads this board's `SVC` by name and place, so only a plan whose service list
(its data pack's, else `svc`) is exactly `SVC`, at its width, and that has budget components (`bm`), is worked out here.

**Decision a person could reverse:** any other year is *marked* (`baStale`: the cycle it was taken under) rather than worked out
approximately. The Spruills then print — for that year's Available Funding (never $0, never the other cycle's figure), and a note
says why (`.sp-ba-stale`). The appropriation's own board takes the mark off when it works the cache out (`applyBudget`, `baApplyTo`).
Other readers of another appropriation's stored cache (the PMO drill, the chart of accounts, the live view) are not changed: they
still read the stored figure, which for a marked year is the package's. Covering them would be the next step if Brad wants it.

## B3 — a Save that stops after the two-copies question leaves both copies standing (misleading)

`pubsClashAsk` deleted `_tabClash[k]` (and bumped `PUBS[k].ts`) as soon as OK was answered, before anything was written. A Save that
then stopped (a file it could not read, the download fallback, a later Cancel) spent the answer: the next Save wrote without asking.

Fix: the delete is gone. The clash stands until `cycCarrySaved` takes it off after a write that put this page's copy in the file
(it already did, for `_pubsOwn[k] <= at`). The `ts` bump stays (harmless: it is done again, larger, at the next OK). While the clash
stands `pubsFor` skips storage's copy for `k`, so OK still writes this page's copy, as before.

## B4 — a refused copy that storage later took is no clash with another tab (false clash)

`apPut` set `_pubsOwn[k]` on a refusal and never cleared it, so after a later write that storage took, another tab's save of that
appropriation raised a false "two copies" clash and Save asked about it (e3).

Fix, both ways:
- `apStoredOk(k)` (deletes `_pubsOwn[k]` and `_tabClash[k]`) is called wherever another appropriation's plan has been written to
  storage whole: `apPut` on success (⬆ Issue, ⬆ Push, the ladder copy, a package), `importBoards` and `consTakeApply` after their
  `lsAll` commit lands, and `cycApplyAll` when its write lands (`res.ok`; the carry branch still sets `_pubsOwn`).
- `tabWrote` skips the clash when `ev.oldValue === JSON.stringify(PUBS[k])`: the other tab wrote over this page's very copy, so it
  built on it.

## Checks (audit-import, slot "v2.15 review RV-B")

- **(B1)** a fresh board: `cycInFor(MS).whole`; a package for O&M on screen (MS and storage); CONTROL Initial Spares; ALL from a
  consolidated file (O&M as Full Fund); several boards at once (O&M's own file); CONTROL a board holding a requirement; a plan
  logging only a position, or carrying only a tag, is not whole (hold on dbfc7c4 too).
- **(B2)** Full Fund in this browser on BES28 ($800), a package made on PB27 ($222), O&M on screen on BES28: with the same services
  the stored cache is BES28's ([800,60] / [0,10]), the Spruills print $870 under BES28, and Full Fund's own board works out the same;
  with three services on Full Fund (two on screen) the year is marked, the Spruills print — with the note, and Full Fund's own board
  takes the mark off.
- **(B3)** OK then the file cannot be read: both copies still stand; the next Save asks again (Cancel writes nothing), and OK writes
  this page's copy and settles it; the download fallback leaves both standing.
- **(B4)** after a refused ladder copy: the ladder copied again (taken), the cycle chosen for all, one appropriation from a
  consolidated file, several boards at once — each clears the mark, and another tab's later save is no clash, the file carries that
  tab's Full Fund and Save asks nothing of two copies; the storage listener skips a tab that built on this page's copy (CONTROL: one
  that did not is a clash).

27 checks fail on dbfc7c4; all pass here.

## Mutations (`mutate.mjs`, slot RV-B; `recovery/v215/proofs-RV-B.json`, `proved-RV-B.jsonl`)

12 new (`v215-rv-b-*`) and 2 retargeted (`v215-w1-in-never-whole`, `v215-w1-in-always-whole`: their find was the old `!has(cur)`
line, now `!holds`; same defect). All 14 CAUGHT by a failed check (prove.py, JOBS=1). `mcount`: 3,771 entries, each once.

One dropped: `v215-rv-b-holds-no-tag` (the tag term of `holds` removed) SURVIVED as the identity — `cycAll` already counts a tagged
appropriation, so `whole` is false whatever the term says. The term stays as a statement of the rule; the slot says why there is no
mutation on it.

## Results

`npm run check`: all checks passed. Whole suites (heavy.sh, HEAP=8192, one at a time): audit-import, audit-board, audit-other,
audit-recon and audit-inject each ALL CHECKS PASSED; no older expectation moved. Browser checks (HEAP=4096): savetarget, storagefull
and fileimport exit 0.
