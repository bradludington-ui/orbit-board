# v2.10 B — item 130: FYDP Disconnects, the workbook

Built on Brad's "Go" of 27 Oct 2026, from NEXT-VERSION item 130 (his decisions), `recovery/v210/item130-contract.md` (the shape
shared with builder A) and the mock-up in `recovery/v210/item130-mockup/` (`xlsx.py`, `xlsx-*.png`). Branch `v210-b`, from
`35d0dd0`. Builder A makes the figures (`fdcModel`), the box and `exportFdc()`; this part is the workbook only, driven from the
model alone and tested with hand-built models.

## What was built

- **`fdcSheets(model)` → `{sheets, extra}`** for `buildXlsx(sheets, extra)` (beside `buildXlsx`, §36). It computes nothing:
  every figure is the model's, printed in the column it belongs to (the years in order, the FYDP total last).
  - **Every sheet:** the marking (`model.marking`, bold, centred) merged across the table in row 1; the title (26 pt bold,
    row 36 pt) and subtitle (22 pt bold, row 30 pt) merged across the table; a blank row.
  - **Summary:** the corner label (bold 9 pt) and the navy band over the years (`over`, white bold, centred, merged B:H,
    every cell it covers written in its style); the navy heading row (white bold, the years centred).
  - **Service sheets:** the heading row in the service blue `9BC2E6`, black bold.
  - **Rows:** `band` light blue `8DB4E2` with white bold text across the table; `navy` the total section's navy band;
    `gap` a blank row; `sep` dark grey `404040`, 9 pt tall, across the table; `line` by style -- `bold` bold, `sub` indented
    2, `ital` italic and indented 2, `delta` under a medium black rule across the row, `pct` in `0%`.
  - **Money** cells hold the whole dollars with `$#,##0,,;[Red]($#,##0,,)` (millions shown, a shortfall red in
    parentheses, totals foot to the dollar); a null (or anything not a finite number) is the text "—", never $0.
  - **Footer row**, one blank row under the table: the footer text (12 pt, grey `595959`) in A, the marking again, merged
    B:D -- with A 52 wide and each year 13, that span's centre is the table's own centre, so it sits under the top marking.
  - Grid `808080` thin on every table cell, Arial throughout; column A 52, the rest 13; landscape, one page wide and one tall
    (each sheet prints as one page, as a slide does), centred; no gridlines; no house style.
  - A text the model leaves out (null/undefined) is an empty cell, never the word "undefined".
- **The writer, extended only as this needs, opt-in, every existing workbook byte for byte as before:**
  - `_stylesXml`: a `fontSpec.name` (no name is Calibri, as every font written before); `e.share` shares a fill and a number
    format with every entry that asks for the same one, as house entries already do (so the navy, the money format and the
    percent are declared once).
  - `buildXlsx`: `s.heights` (`{row: points}`) on any sheet; and a sheet with `s.page` or `s.grid===false`, not dressed, is
    written by a new branch: `sheetPr/pageSetUpPr fitToPage` first, `showGridLines="0"`, then after `mergeCells`
    `printOptions horizontalCentered`, `pageMargins`, `pageSetup orientation="landscape" fitToWidth fitToHeight`. A sheet
    asking for none of them goes through the writer's own line, untouched (the `merge-before-sheetdata` target).
- **No house style.** The item 113 check (audit-other "v2.04 (item 113)") now lists `exportFdc` beside the Spend Plan Source and
  the 1A9A as a report that does not ask for it, with the reason: the slides have their own look.

## Decided in the build, and why

1. **One page tall as well as wide** (`fitToHeight="1"`). The contract says "landscape, one page wide"; the mock-up's `xlsx.py`
   (the reference for the look) sets fitToWidth 1 and fitToHeight 1, and each sheet stands for one slide. Change `tall:1` to
   `tall:0` in `fdcSheets` for "as many pages down as it takes".
2. **Printed centred** (`printOptions horizontalCentered`), margins 0.4 in at the sides and 0.5 in top and bottom. The mock-up
   printed from Excel's defaults, left of centre; a slide's table sits in the middle.
3. **The marking's place.** The mock-up carries none. Row 1 holds it, merged across the table and centred; the footer row holds
   the footer text in A and the marking merged B:D, centred on the table (A is four year-columns wide, so a span of n−4 columns
   from B has the table's centre at its centre). Bold Arial 11, black.
4. **The `input` lines** (International Req and Funding) are printed as ordinary lines: the workbook has no inputs; the
   yellow is the box's.
5. **Styled empty cells** (a band across the table, the band over the years) are written as `{v:'', s}`, as every export here
   writes them (an empty inline string with the style), not as a valueless `<c s/>`, so the writer's cell path is unchanged.
6. **A line's style is read by own key** (`hasOwnProperty` on `FDC_LINE`): a style the model does not name is a plain line,
   never a property every object answers to.
7. **The writer's new options are names on the sheet**, not a mode: `heights`, `grid:false`, `page:{wide, tall}`. A later
   export can take any one of them.
8. **The item 113 count.** `exportFdc` is builder A's; on this branch alone there are 15 reports that write a workbook. The
   check expects 16 once `exportFdc` is on the board (`fns.some(f => f.n === 'exportFdc') ? 16 : 15`); the integration should
   make it 16 outright.

## Checks

- **audit-other "v2.10 B (item 130) — the FYDP Disconnects workbook: the slides’ look, read back from the bytes"** (83 checks;
  82 fail on `35d0dd0` -- the base has no `fdcSheets` -- and the one CONTROL passes there). A hand-built model in the contract's
  shape: a Summary (O&M band and ten lines, a gap, PROCUREMENT with a null year inside the FYDP total, the navy total section) and a
  USAF sheet (two sections and a separator), distinct figures on every line and year, negatives and a positive delta, % Funded,
  an imported subtitle holding `<` and a band `O&M`. The workbook is unzipped from the bytes `buildXlsx` made and every part
  parsed with the page's DOMParser; every cell's style resolved through `xl/styles.xml`. Every expectation is typed from the
  contract's look, never read back from `fdcSheets`:
  - per sheet: the rows (numbers) the layout makes; per row, every cell's reference, value and look (fill, font bold/italic/
    size/colour/name, border per side, number format, horizontal alignment, indent); the merges and their count; row heights
    (36, 30, the separator 9, nothing else); column widths; the page (no gridlines, fitToPage, landscape, 1 wide, 1 tall,
    centred); no tab colour or house footer; the worksheet's element order; cells in column order; every style declared; the
    CUI marking above the title and in the footer row;
  - the reader's claims typed out: B11 "—" for a year with no position and H11 its FYDP total still adding FY28–32; H20 "—"
    when a FYDP year is null; C15 a shortfall stored as the negative whole dollars it is, under the money format; C21 a
    positive delta; the delta's medium black rule on A, B and H; C16 0.878 as `0%`; `<` and `&` read back as typed; USAF's
    heading row `9BC2E6` black bold; the separator `404040` 9 pt across the table; every cell Arial;
  - the stylesheet: every declared count is what it holds; the money format and the percent each declared once; the cells wear
    exactly four fills and no fill is declared twice; the package's part order and each sheet in the content types;
  - CONTROL: an ordinary sheet that asks for no page, gridlines or heights is written without them, in Calibri.
- **audit-other "v2.04 (item 113)"** (changed in place, `// v2.10 B:`): `exportFdc` is in the list of reports that do not ask
  for the house style; the count is 16 with it, 15 without.

## Proof that no existing workbook changed

A scratch proof, not in the repo (`scratchpad/v210b/bx/`): `mkold.py` cuts the base board's own `_stylesXml` and `buildXlsx`
out of `35d0dd0` and renames them `*OLD`; a Node loader hook (`hook.mjs`, `loader.mjs`, `bxboot.mjs`) wraps `boot()` so every
board a suite boots carries the old writer beside its own, and every call of `buildXlsx` that returns a workbook and is not
FYDP Disconnects' (no `page`, `grid:false` or `heights` on any sheet) is written by both and compared byte for byte. Results:

| run | boards | workbooks compared | differing |
|---|---|---|---|
| audit-other (whole, the final board) | 42 | 33 | 0 |
| audit (whole) | 16 | 1 | 0 |
| audit-board (whole) | 168 | 3 | 0 |
| audit-hostile, audit-inject, audit-ui, legacy-fsrc (whole) | 146 | 0 | 0 |
| audit-recon, slimmed, 7 batches: "11 every product", the funds flow, the chart of accounts, the ACE tie-out, CR cash needs, W7 F1, the five-year spend plan, comparing two cycles, D4-1, W4, W6 breakouts / priority drill, the two spend plans, U37, v1.95 ×2, E6, U10 ×4 | 109 | 238 | 0 |
| audit-import, slimmed: workbook reader, the change report, E2, v1.84, every v1.85 block, v1.97, v2.06 | 55 | 4 | 0 |
| **in all** | **536** | **279** | **0** |

Every one of those runs passed, but one: U37's checks count the zips an export makes ("made, one zip"), and the hook makes
each workbook twice, so 33 of them read 2 where they want 1 under the hook. The same three blocks run without the hook pass
(`run-r5plain.log`). The `fdc` count in audit-other's run is 1: the B block's own workbook, which has no old writer to agree
with, is skipped by name (any sheet with `page`, `grid:false` or `heights`). Logs: `scratchpad/v210b/bx/run-*.log`.

The hook is not vacuous: with one byte changed in the old writer's font line (a space before `</font>`), audit-other's run
reports 9 of 32 workbooks differing -- every dressed one, which is every one that writes a `fontSpec` -- and 23 the same.

## Mutations

61 new (`v210-b-*`): 49 in `fdcSheets` (every colour, the font, both widths, each line style, the rule, null as $0, a negative
made positive, the total column, the years shifted, % as money, alignment, the label, both markings, the footer text, colour,
blank and centring, both title sizes, the merges and heights, the band over the years, the corner, both heading colours and the
centring of the years, the gap, the band's text, fill and span, the separator's height, gridlines, the page, the style sharing and
indexing, the sheet order) and 12 in the writer (`_stylesXml`'s font name and both shares; `buildXlsx`'s heights, gridlines,
orientation, fitToPage, sheetPr's place, mergeCells' place, both page counts, centring). Each proved CAUGHT by its own block with
`recovery/v208/bin/prove.py` (`proofs-B.json`, `proved-B.jsonl`, run again from scratch on the final board). `mcount`: 2,703
entries, every one matches once. None retargeted, none retired.

## Rendered

`scratchpad/v210b/mkmodel.py` puts the mock-up's own figures (`model.py`) into the contract's shape; `build.mjs` builds the
workbook with the board; `soffice --headless --convert-to pdf` and `pdftoppm -r 80` render it:
`/tmp/claude-0/-home-user/792dafeb-d944-5a2a-8cfa-66d1840065b4/scratchpad/v210b/render/fdc-1.png` (Summary) and `fdc-2.png`
(USAF), `fdc-3..5.png` (STOVL, USMC CV, USN CV). Compared by eye with `recovery/v210/item130-mockup/xlsx-summary.png` and
`xlsx-usaf.png`: the same figures, colours, bands, bold / indented / italic lines, heavy delta rule, red parentheses and footer;
the differences are the ones decided above (the marking above the title and in the footer, the table centred on the page).

## Files

- `prioritization-board-grid.html`: `_stylesXml` (font name, `share`), `buildXlsx` (`heights`, the page branch), `FDC_XL`,
  `FDC_LINE`, `fdcSheets`.
- `tools/export-audit/audit-other.mjs`: the v2.10 B block; the item 113 check's list.
- `tools/export-audit/mutate.mjs`: the v2.10 B slot.
- `recovery/v210/proofs-B.json` (git add -f: `*.json` is ignored), `proved-B.jsonl`, `notes-B.md`.
