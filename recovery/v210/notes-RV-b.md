# v2.10 review, fixer b — WB-1: the indented lines are drawn indented

From the review of item 130 (FYDP Disconnects), on the joined board `4c531a0`. Branch `v210-fix-b`. One finding, minor.

## The finding

**WB-1.** In the workbook, the indented lines -- '… - US Only', '… - International Req Total', 'Discretionary', 'Mandatory' --
printed flush with the bold totals. `fdcSheets`' `look()` gave a `sub` and an `ital` label `indent="2"` and no horizontal
alignment (`align:{h:o.h, …}` with `o.h` undefined), so `xl/styles.xml` read `<alignment vertical="center" indent="2"/>`.
Excel draws an indent only under left, right or distributed alignment (XlsxWriter's format.py says the same, lines 1056-1068).
The contract calls them indented lines and the box indents them 22px. Rendered in LibreOffice, every label on the Summary
started at the same x. The mock-up's `xlsx.py` has the same omission, which is why its `xlsx-summary.png` is flush too, and
notes-B's "compared by eye … bold / indented / italic lines" was wrong on the indent: that render was flush as well.

## The fix

`fdcSheets`' `look()`: `align:{h:o.h || (o.indent? 'left' : undefined), v:'center', indent:o.indent||0}`. An indented look is
left-aligned; every other look keeps the alignment it had. Only `fdcSheets`' own extra entries change. `_stylesXml` and
`buildXlsx` are untouched, and `fdcSheets` has one caller, `exportFdc`. The style key is the look `o`, so the styles are
shared and indexed exactly as before.

## Checks

- **audit-other "v2.10 B (item 130)"**, changed in place (`// v2.10 review:`). Its `LK` expects `h:'left'` wherever an
  indent is set. The look of every cell is typed there, so the six indented label cells (four on the Summary, two on USAF) now
  expect left, and every other cell expects what it did. It fails on `4c531a0` by those six rows.
- **audit-other "v2.10 review — the FYDP Disconnects workbook draws its indented lines indented: left alignment beside the
  indent (WB-1)"**, new, before the B slot's end marker. A hand-built model carries every line style, with the indented lines
  plain and italic on both kinds of sheet. The check reads the bytes `buildXlsx` made and, for each line, takes the
  `<alignment>` element of its label's style and its first figure's style, attribute by attribute. Each line is found by its
  label's own text. Expected, typed from the model's style:
  - an indented line: `horizontal="left" vertical="center" indent="2"`;
  - a bold, delta or % line: `vertical="center"` alone, as before;
  - every figure: `horizontal="right" vertical="center"`, as before.

  The block also asserts that the fixture carries indented lines beside lines that are not indented. **CONTROL:** an entry
  that asks for an indent and names no alignment, handed to `buildXlsx` outside FYDP Disconnects, is still written
  `<alignment vertical="center" indent="1"/>`. The left alignment is `fdcSheets`' own, so a workbook whose style asks for an
  indent without one keeps its bytes. The block fails 6 checks on `4c531a0`, every check but the CONTROL, which passes there.

## Mutations (v2.10 B slot)

- `v210-rv-b-indent-flush`: the fix undone, so the indented lines are flush again.
- `v210-rv-b-left-everywhere`: every look with no alignment of its own made left, so the bold, delta and % labels, the
  bands and the footer change too.

Both were proved CAUGHT by the new block (6 and 10 failing checks). The 34 existing v210 mutations whose finds sit in
`fdcSheets` were proved again on the fixed board, each with its own `caughtBy` (audit-other "v2.10 B (item 130)"), and all 34
were CAUGHT. That is 36 of 36 in `proofs-RV-b.json` / `proved-RV-b.jsonl`. `mcount`: 2,761 entries, every one matches once.

## Proof that no other workbook changed

The scratch proof (not in the repo) is in `scratchpad/v210/rev/b/`. `bytes.mjs` is the review's own battery (its
`workbook/bytes.mjs`), with `exportFdc` added. It runs every workbook export on one fixed fixture, on `board-4c531a0.html`
and on `fixed-board.html`, with 3 services and with 6 (`run-bytes.sh`). `cmp.py` compares the results:

- **Byte-identical, 21 of 21 workbooks:** exportExcel, exportCSV, exportSrc, exportPlans, exportFlow, exportCoa,
  exportFydpPlan, exportCycCompare, exportFcView and exportAceTieout with 3 services and with 6, and crExport with 6.
  exportRlgPlan, exportExView and exportIdsReq write no file on this fixture, on either board.
- **exportFdc, with 3 and with 6 services:** the parts are the same and in the same order. Every part is byte-identical but
  `xl/styles.xml`. In that part everything between the cell styles is identical piece by piece, and exactly two `xf` change:
  26 (the `sub` label) and 28 (the `ital` label). Both go from `<alignment vertical="center" indent="2"/>` to
  `<alignment horizontal="left" vertical="center" indent="2"/>`.

**Rendered.** The two exportFdc files went through `soffice --headless --convert-to pdf`, and `labelx.py` read the x of each
label from `pdftotext -bbox`. The fixed workbook draws the indent, and the bold lines stay put:

| page | lines | before | after |
|---|---|---|---|
| Summary | the 'Req - US Only', 'International Req Total', 'Discretionary' and 'Mandatory' lines | 133.097 | 142.947 |
| Summary | every other label | 133.097 | 133.097 |
| USAF | 'Discretionary' and 'Mandatory' | 35.887 | 49.380 |
| USAF | every other label | 35.887 | 35.887 |

## Run

- audit-other, whole: ALL CHECKS PASSED. It holds both B-slot blocks, the A block's end-to-end export and the item 113 block.
  No other suite names `fdcSheets` or `exportFdc`.
- On `4c531a0`, a slim of the two blocks fails 12 checks: 6 in the B block and 6 in the new one.
- `npm run check`: all checks passed.
- Also passed: `npm run coverage:money` (25/25), `npm run money-map` (308 cells, 1 open, as before) and `npm run defects`.
- **Browser checks: none run.** The change is inside the workbook's styles; the box and every page are untouched.
- No sweep.

## Not fixed, noticed

The house style (v2.04, item 113: `_houseBase`, `_housePlan`) writes the same shape: an indent with no horizontal alignment.
It does so on the title band (`indent:1`), the subtitle (`indent:1`) and a text cell in the second column (`indent: ci===1? 1
: 0`). By the same rule, Excel may not draw those indents either. That is outside this finding: the fix changes only
`fdcSheets`' own styles, so every house-dressed workbook keeps its bytes.
