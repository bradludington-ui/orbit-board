# Item 130, FYDP Disconnects: the contract between the two builders (v2.10)

Brad's decisions are in `NEXT-VERSION.md` › item 130; the mock-up (invented figures) is `recovery/v210/item130-mockup/`
(`screen-*.png` is the box, `xlsx-*.png` the workbook; `xlsx.py` and `html.py` build them from `model.py`). This file
fixes the one shape both builders use, so they can work in parallel and meet without guessing.

- **Builder A** (slot `v2.10 A`): the figures and the box. `fdcModel(opts)` builds the model below from the board's own
  stores. It also makes the box (FYDP › FYDP Disconnects), its pickers, tabs, International inputs (session only) and
  tables, and `exportFdc()`, which calls B's `fdcSheets(model)` and writes the workbook.
- **Builder B** (slot `v2.10 B`): the workbook. `fdcSheets(model)` returns `{sheets, extra}` for `buildXlsx(sheets, extra)`,
  with whatever `buildXlsx` needs to draw the slides' look. Everything is driven from the model alone, so B tests with
  hand-built models and needs nothing of A's.

## The model `fdcModel(opts)` returns

```js
{
  ace:  {key, label},             // the cost estimate set chosen (ACEDB.sets key, its label as imported, e.g. '2025 ACE')
  cyc:  {key, label},             // the PPBE cycle chosen ('BES|2028', 'BES28')
  years: [2027, ..., 2032],       // cycle year - 1 .. cycle year + 4
  sum:   [2028, ..., 2032],       // the FYDP total's years: cycle year .. + 4
  marking: 'CUI//REL TO US DoW',  // printed above the title and in the footer of every sheet (Brad, 27 Oct)
  footer:  'October 2026 / Sustainment Finance / PSM',   // month and year of the export
  sheets: [ SHEET, ... ]          // in order: Summary, USAF, STOVL, USMC CV, USN CV
}
SHEET = {
  name:  'Summary' | 'USAF' | 'STOVL' | 'USMC CV' | 'USN CV',     // the Excel tab name
  kind:  'summary' | 'service',
  title: 'F-35 Sustainment Summary' | 'F-35 Sustainment',
  subtitle: '2025 ACE / BES28' | 'BES28 Service Detail – USAF CTOL',
  corner: '(TY$M) Total Position',           // summary only: the small label left of the band over the years
  over:   'Delta from BES28',                // summary only: the navy band over the year columns
  head:   'Appropriation' | 'USAF F-35A TY$M',   // the first cell of the column-heading row
  cols:   ['FY27', ..., 'FY32', 'FY28-32'],  // the year headings, then the FYDP total's
  rows:   [ ROW, ... ]
}
ROW = one of
  {t:'band',  label:'O&M'}                          // summary: an appropriation's light-blue band, white bold text
  {t:'navy',  label:'F-35 Sustainment - Total DoD'} // summary: the total section's navy band
  {t:'gap'}                                         // summary: the blank row between sections
  {t:'sep'}                                         // service: the dark-grey separator between sections
  {t:'line', label, style, vals, tot, input, ap}
    style: 'bold'   -- a total line (ACE required, controls, International Funding)
           'sub'    -- an indented plain line (US Only, International Req Total)
           'ital'   -- an indented italic line (Discretionary, Mandatory)
           'delta'  -- the delta line: a heavy rule above it; a negative shows red in parentheses
           'pct'    -- % Funded: vals and tot are fractions (0.85 is 85%), or null
    vals:  one entry per years[]: whole dollars (Number.isInteger), or null where there is nothing to state (prints '—')
    tot:   the FYDP total over sum[] (whole dollars), or null when any year in sum[] is null
    input: 'ir' (International Req) or 'if' (International Funding) on the Summary's input lines; absent elsewhere
    ap:    'om' | 'ff' | 'sp' on an appropriation's lines; absent on the total section
```

## The figures (A computes them; B only prints them)

- **Requirement (US)**: the chosen set's lines (`ACEDB.sets[key].lines`), `l.ap` in om / ff / sp, summed per year over the
  services of the sheet (Summary: all six; USAF: USAF, ANG, AFRC; STOVL: STOVL; USMC CV: USMC-C; USN CV: USN), whole
  dollars.
- **Controls**: the chosen cycle's PPBE Budget Positions in each appropriation's own store, `d` (Discretionary) and `m`
  (Mandatory), summed over every line of the sheet's services, per year. Each appropriation's store is read the way the
  board already reads another appropriation's (never recomputed). A year that appropriation holds no position for is null.
- **International** (Summary only, per appropriation and year, session only, $0 to start, typed in $M): Req adds to the
  requirement, Funding to the controls.
- **Delta** = (Controls + International Funding) − (US + International Req). **% Funded** = funding ÷ requirement, or null
  when the requirement is 0 or either side is null.
- **The total section** adds the three appropriations line by line (null if any of them is null in that year).

## The look (B draws it; the mock-up's `xlsx.py` is the reference)

Colours: navy `1F3864` (the summary's heading row and the band over the years, the total section's band), light blue
`8DB4E2` (an appropriation's band), service heading row `9BC2E6`, separator `404040`, grid `808080`, text black.
Money: `$#,##0,,;[Red]($#,##0,,)` (whole dollars kept, millions shown); % Funded `0%`. Arial. Titles merged across the
table, 26 and 22 pt. The marking above the title and in the footer row. Column A 52 wide, the rest 13. Landscape, one
page wide. No house style (`xlsxHouse`): this export has the slides' own look, and joins the list of exports that do not
ask for it, with that reason.
