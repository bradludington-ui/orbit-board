# v2.09 W4 — item 128: the SI tab lists the requirements under each SI code

Built on Brad's "Go on v2.09" (26 Oct 2026), from NEXT-VERSION item 128 and the investigation in
`scratchpad/v209/res-si.json` (the skeptic's corrections followed where they disagree). Branch `v209-w4`, from `6405e01`.

## What was built

- **The section** (`monSheet`, `exportExcel`): below the SI tab's roll-up and its note, a title (`REQUIREMENTS UNDER EACH
  SI CODE`, through `scenTitle`, so the ◨ and PMO COPY marks ride it), then for each code in the tab's order (LA, EN, OT,
  FL, AT) and then the requirements carrying none (under the tab's own `— no SI code set —` / `— no recognized SI code —`):
  a heading with the count, the column headings, one row per requirement in board priority order with its master rank,
  a prime's CLIN lines under it, and `TOTAL — <code>`. Then `TOTAL — every requirement above: the roll-up`, and a note.
- **Columns:** `<SVC> funded` for STOVL, USMC CV, USN (`crSvcName`), `Total funded`, then `<SVC> requirement value`. Funded
  is what the lanes drew (d + m) from `Tv`, NO DATE included, so it follows ◨. The requirement value is in no total: TOTAL
  rows leave those columns empty and no row sums them. The rollup's TOTAL column (column 14) is empty on every section row.
- **A pivot of the bag pass, never a second walk:** each row is the requirement's own entries in `bag[g][k].its` (what
  `addTo` was handed: months + NO DATE) and `pend[g][k]` (asks that drew nothing). A code's TOTAL is therefore its row in
  each service block by construction. The option `byReq` is passed by the SI call only.
- **Every asking requirement listed:** the `pend` path and the `anyMoney` exception were gated on `O.detail`; they are now
  `O.detail || O.byReq`. An unfunded requirement is listed at $0; the tab is kept when asks exist and nothing is funded.
- **A prime:** its row, then a line per CLIN: the prime's funded figure and its requirement value on each service split by
  `clinSplit` (whole dollars, adding to the prime). A service the CLIN grid holds nothing for is put on a line of its own
  (`not on a CLIN — the CLIN grid holds nothing for USMC CV`), so the lines add to the prime on every service; with no
  service split at all, one text line says so.
- **The stale words:** the Special Interest overview's note (both branches), the 1A9A CR cash return's status line and
  Needs attention's SI "Go to it" text now name `📋 Requirement edit, at its Navy SI code` (`FLI('rec')`, `FL('si')`),
  where the code has been set since v2.08. The comment above `attGo`'s si branch says the edit box.
- **The money map** registers the section (`re.siByReq`, cited by exportExcel's service and requirement cells);
  `tools/money-map.md` regenerated with `node tools/money-map.mjs`. No top-level helper was added, so money-coverage
  needed nothing.

## Decided in the build (not in the log, or different from it), and why

1. **The five codes always show; the no-code group only when a requirement carries none.** A code with nothing reads
   `(0 requirements)`, a line saying no requirement carries it, and a TOTAL of $0 (the overview's precedent: a zero says
   the code exists). The no-code group is a worklist, not a code, so an empty one is left out.
2. **Laid out as the rollup is** (a section heading per code, the column headings under it, a TOTAL whose label starts
   with the word), so the v2.04 house style dresses it as it dresses the rollup: totals in the grey band, `Total funded`
   gold down the table. Labels never equal `<SVC> TOTAL` or end `— TOTAL BY MONTH`.
3. **CLIN lines split the prime's figure once per service** (`clinSplit(total)`), not month by month as the RCN tab's
   PRIME CONTRACTS does: the section has no month columns. The requirement value is split by the same grid share
   (`clinSplit(ask)`), so it adds to the prime's value too. The Spend Plan Source splits each dated piece and each lane on
   its own, so its CLIN lines can sit a dollar from these; the note says so. A CLIN line leaves blank (not $0) a service its
   grid does not split.
4. **The export changes no state v2.08 did not.** `clinList` and `clinVec` create CLIN containers and write default shares
   into `S.clinAlloc`. On a STOVL / USMC-C / USN board with an unfunded prime nothing else in the workbook splits that prime
   (no RCN tab; the Spend Plan Source splits only funded lines), so the section would have been first, and a default frozen
   into `S.clinAlloc` stops following the CLIN's own ask. `clinRead` puts back the very objects that were there (no JSON
   copy). Measured: the state an export leaves is identical to v2.08's on 6- and 3-service boards, funded and unfunded.
5. **The SI tab's label column is 52 wide (was 34)**, as the RCN breakout's is, for the rank and record name. Every row
   above the section is v2.08's, cell and style; only `cols[0]` changes.
6. **The section's title goes through `scenTitle`** (the skeptic: optional, costs nothing), so a page printed from far down
   the tab still says WHAT-IF / PMO COPY.
7. **The RCN tab is proved unchanged in the suite against v2.08 itself** (`git show ebe702e`, the board v2.09 was built on),
   as CONTROLs: the RCN sheet object (every cell, style, width) and the SI tab above the section, in both views. A broader
   "every other sheet is the same" check was written and then held to a scratch proof only, so that another workstream's (or
   a later version's) deliberate change to another sheet cannot fail item 128's check. Scratch proofs (not in the repo): the
   RCN worksheet part `xl/worksheets/sheet7.xml` is byte-identical to v2.08's in both views; every sheet before the SI tab is
   byte-identical; every sheet after it differs only in style NUMBERS (the house style registers new cell styles in order of
   first use, and the section uses some), identical once each `s="N"` is resolved to its style.
8. **No BUILD bump** (the integration's).

## Checks

- `audit-recon.mjs` "v2.09 W4 (item 128) — the SI tab lists the requirements under each SI code" (the W4 slot), read back
  from the workbook's bytes on a Split board with two not-drawn lines (E: funded 1,100,000, allocation 1,150,000, value
  1,200,000; F: $0 funded, 250,000 allocation): which requirements under which code, in priority order (EN is A, B, D, F; by
  size A, D, B, F), with the master rank; every row's funded figures against the fixture's own, adding across; the
  requirement value from the fixture's asks; each code TOTAL against its rows and against the code's row in each service
  block; the last TOTAL against the service totals and the roll-up; the requirement value in no total; F at $0, and under ◨
  D at $0 too; the prime's CLIN lines (183,333 / 366,667 on STOVL; 300,000 / 200,000 funded and 360,000 / 240,000 value on
  USN; USMC CV on its own line) adding to it; whole dollars by `Number.isInteger`; column 14 empty; no forbidden label; the
  title's ◨ mark; the headings say funded. A second board (STOVL / USMC-C / USN, nothing funded): the tab stays, all three
  listed at $0, one under "no recognized SI code", an unfunded prime's CLIN lines at $0, and reading them leaves the board's
  CLIN containers as they were. The words: the overview's note, the CR return's status line, Needs attention's Go to it.
  Against v2.08: the RCN tab and the SI rollup unchanged, and only the label column wider. 30 checks fail on ebe702e; every
  check that passes there is labelled CONTROL.
- Changed on purpose, in place, with `// v2.09 W4:` comments: audit-recon "v2.00 (U41)" — the overview note's and the CR
  status line's expected wording.
- Run and passing on this board: audit, audit-other, audit-board, audit-hostile, audit-inject whole; audit-recon slimmed to
  this block and the 26 older blocks that read the SI tab, its words or the RCN tab (4 agreement, W6, W7 F1, v1.98 item 83,
  v1.99 item 88, U10, U32/U33, U36, U37, U41, U56/U57, U58/U59, U61); audit-import slimmed to the three blocks that touch
  `S.si` / the SI code (v1.84 ×2, v1.86 months); `npm run check`; the money map and money coverage; in Chromium
  `npm run panels`, `hostile`, `menus`, `standards` (nothing new), `controls` (60 recorded, 60 now) and `dialogs`.

## Mutations

28 new (`v209-w4-*`, in the W4 slot), each proved against its own check with `recovery/v208/bin/prove.py`
(`recovery/v209/proofs-W4.json`, verdicts in `recovery/v209/proved-W4.jsonl`): the section off, the option on the RCN call,
the pend gate, the tab dropped, the allocation printed (funded rows and pend rows), NO DATE dropped, the value in a code
TOTAL and in a row total, the grand total without the no-code group, the no-code group dropped, empty codes hidden, size
order, the position for the rank, CLIN lines gone, the unsplit service dropped, fractional CLIN parts, CLIN value read as
funded, the CLIN read leaving state, the heading "allocated", a `<SVC> TOTAL` label, the title's mark, the TOTAL column used,
the label column narrow, the overview's two notes, the CR status line, Needs attention's Go to it. All 29 (28 new and the
retargeted one) CAUGHT on the final board, none by a block that threw. 1 retargeted:
`v200-u41-workbook-label` (the SI call's last line now ends `crSvcName,` before `{byReq:true})`). None retired.
`mcount.py`: 2,422 entries, every one matching once.

## For the integration

- `recovery/v209/proofs-W4.json` is matched by `.gitignore`'s `*.json` and was added with `git add -f`; v2.08 named its
  proofs file in `.gitignore` (`!recovery/v208/v208-proofs.json`), so `!recovery/v209/proofs-W4.json` belongs there too.
- The recon block reads `ebe702e` from git history: in a shallow clone run `git fetch --unshallow` first (as for the other
  history-reading blocks).
- No npm script needed.

## Known gaps

- The RCN / EEIC registry panel's hint still says "Assign a combo to a requirement from its ⋯ menu" (the same stale words,
  for RCN). Not in item 128; not changed.
- The SI tab's own title row still reads "Special Interest allocations by service and month" for funded dollars (the
  RCN tab's says the same of RCN / EEIC). Left as it was, since the rest of the tab is unchanged by Brad's decision; the
  section's own headings say funded.
- An Air Force-only requirement carrying EN by the PP rule is out of scope (Brad's scope, the tab's own rule): not listed.
- The section's CLIN lines and the Spend Plan Source's CLIN lines are split from different pieces of the same money (once
  per service here; per dated piece and lane there), so a CLIN's two figures can differ by a dollar; the note says so.
