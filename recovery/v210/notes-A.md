# v2.10, builder A (item 130, FYDP Disconnects): the figures and the box

Built on Brad's "Go" of 27 Oct 2026, on `35d0dd0` (branch `v210-a`), to `recovery/v210/item130-contract.md`. The workbook
(`fdcSheets`) is builder B's; this branch calls it as the contract says and does not define it.

## What is on the board

- **`fdcModel(opts)`**: the contract's model, read from the board's own stores, never worked out again.
  - The requirement is the chosen `ACEDB` set's lines for O&M, Full Fund and Spares (`l.ap` om, ff, sp; OPN never), summed over
    the sheet's services, each line's year rounded to a whole dollar at the door (`D$`: an estimate line is $M times a million,
    which a float does not always hold whole).
  - The controls are each appropriation's PPBE Budget Position under the chosen cycle: Discretionary and Mandatory through
    `ppSvcFy`, each service's figure `D$`. The board on screen's from `MS.ppbe`; every other appropriation's from its own store as
    its own board opens it (`fydpStoreLocal`: browser storage, or the file's copy when that is newer).
  - **Null.** A year is null for an appropriation when its position under the cycle logs no figure for that year on any service
    or line (`fdcPosHeld`; a cell emptied is deleted by `ppSetV`, so a logged $0 is a figure). In a held year, a service with
    nothing logged is $0. A year the estimate carries no column for (its `years`, and any year a line holds) is null on the
    requirement side the same way. A delta or % Funded with either side null is null; % Funded is null on a $0 requirement;
    a FYDP total with any of its years null is null; the total section is null in a year any appropriation is null.
  - Years from the cycle key (`BES|2028` gives 2027–2032, total 2028–2032). Labels as the contract and the mock-up name them:
    `2025 ACE` (from the set filed as `2025ACE`), `BES28`, the bands O&M / PROCUREMENT / INITIAL SPARES, Prod Support for Full
    Fund, `USAF F-35A TY$M` and the slide subtitles. Footer: the month and year it is made.
  - `opts`: `{ace, cyc}` to name them (null if either is not held; `fdcState(opts).why` says why), `{intl}` for the
    International figures (the box's own, `FDC_INTL`, otherwise).
- **The box** (`#fdcPanel`, `toggleFdc`): FYDP ▸ FYDP Disconnects…, after the Spruills. A `.modal-bg` under the box controller.
  The cost estimate picker (every set, newest import first; the newest to start) and the PPBE controls picker (every cycle a
  position is logged under in O&M, Full Fund or Spares, newest first, each naming who logged it; the working plan's tag to start
  when one is logged under it, else the newest). The years as text. Export to Excel. Five sheet tabs (buttons, `aria-pressed`).
  The page: white in every theme, the slides' colours as tokens set once on `:root` (`--fdcNavy` …), the CUI marking above the
  title and in the footer. Notes: the International figures are not kept (switching appropriation reloads the board); an
  appropriation it cannot read, one with no position under the cycle, years with none; years the estimate does not carry;
  services counted on the Summary only.
- **The International figures** (`FDC_INTL`, beside `let MS`): per kind, appropriation and fiscal year, typed in $M through
  `amtReadM` (a bare number is millions; whole dollars; never below zero; a refusal keeps the figure and says why), $0 to start,
  in no store, journal, storage or file. Kept by fiscal year, so a figure typed under BES28 for FY28 is FY28's under PB27 too.
- **`exportFdc()`**: `fdcModel()`, `fdcSheets(M)` (B's) into `buildXlsx(sheets, extra)` -- no `xlsxHouse` --, named through
  `expName` (`ORBIT FYDP Disconnects — 2025 ACE vs BES28 — FY27–FY32.xlsx`, with a locked view's mark).
- The Reports & exports box's foot names FYDP Disconnects among the FYDP views; the in-file guide has a paragraph (t-fydp).

## Decided in the build

1. **Not offered in a PMO copy.** It sets three appropriations side by side and a copy holds one; another appropriation's store
   in this browser is the portfolio board's, not the copy's to show. The FYDP flyout leaves it out; `toggleFdc` and `exportFdc`
   refuse with the reason; `fdcStores` reads only the copy's own if called.
2. **A locked cycle view works** (it only reads). Positions are read live, as the five-year plan reads them; the file name
   carries the lock's mark through `expName`.
3. **The appropriation band's text is navy on screen, not white.** White on `#8DB4E2` is 2.15:1, under Section 508's 4.5:1
   (WCAG 1.4.3); `npm run standards` reports it as a new finding when white (proved on a scratch copy). Navy is 5.4:1. The
   workbook keeps the slide's white -- B's to print. Brad may want the screen white anyway; it would be a standards finding.
4. **"Held" is per appropriation and year** (the contract's words), not per service.
5. **Services match by name exactly** (the contract's groups). A service in no group (an estimate line's, or a position's under
   the cycle) counts on the Summary only, and the box names it with where it came from.
6. **The box redraws whole on a pick, a tab and a render, never under a figure being typed** (the v2.08 F2 lesson); a committed
   International figure redraws the cells it moves in place. Found in Chromium: Chromium fires the change with the keyboard
   nowhere while a Tab is on its way, and the cells redrawn had the box controller (`dlgSync`'s "redrawn away" rule) hand the
   keyboard back to the field just typed. `fdcIntlSet` puts the keyboard where the Tab was going first (`_navStep`,
   `dlgTabbables`). Held by keys R in Chromium and by a jsdom stand-in (`v210-a-tab-lost`).
7. Menu paths in the box's messages are written `›` so `npm run menus` checks them (it reads only that spelling).

## Checks

- **audit-other** "v2.10 A — FYDP Disconnects: the figures, read never recomputed, and the box (item 130)": every line of the five
  sheets from the fixture's literals (an oracle in the suite restating the rules: fractional estimate lines, two lines on a
  service, OPN left out, a service in no group in the estimate and in a position, O&M's position on screen, Full Fund's in
  storage, Spares' in the file only with no FY30 and 60 cents on every cell, a newer cycle logged only in Spares, a second
  estimate stopping at FY31, a zero requirement under live controls); whole dollars; the pickers, the tabs, every Summary and two
  service sheets' cells as drawn (red parentheses, —); the notes; International typed through the rendered inputs (millions,
  K, a fraction, refusals), moving the Summary alone, redrawn in place, a render under typing, Tab and Shift+Tab out; PB27's
  years; hostile ACE label drawn as text; nothing stored (MS, storage, PUBS, the journal, `_saveGen`, `DIRTY`) with the figures
  in the box, and gone after a save and reopen; the model handed to the workbook and the file's name; a locked view; a PMO
  copy; no cost estimate. Every check fails on `d3ce17d` except the two labelled CONTROL (the fixture reaches its targets; the
  oracle's service sheets do not move with International).
- **audit-board**, two existing checks changed on purpose (`// v2.10 A:`): FYDP ▸'s calls now include `toggleFdc`; the Reports
  & exports foot names FYDP Disconnects.
- **Browser:** panels-render (the box opened on its Summary and its USAF sheet, with figures; `fdcOpen` closed between passes);
  left-menu (`toggleFdc` once, 69 calls; not in a copy); menu-paths (the guide's path and the two in the box's messages);
  dialogs-keyboard (seeded, so its International fields are typed into and Esc must ask); keyboard-reach R; standards (the box
  measured with its tables, the Summary and USAF, every theme; coverage recorded if it is not on screen); layout-fits O (the
  table whole at 1920, 1440 and 1366; at 800 it scrolls inside its own frame, the box and the page never sideways; nothing cut;
  Harbor and Midnight, this font and the Segoe stand-in; proved failing with the frame's scroll removed).
- **money-coverage** registers `exportFdc` (via the model and the box); **money-map** gives it a row: appropriation, fiscal
  year, service and lane proven by the audit-other scenario (arithmetic), requirement, month and CR half n/a.

## Mutations

54 (`v210-a-*`), each proved CAUGHT against the audit-other scenario on its own mutant (`proofs-A.json`, `proved-A.jsonl`), none
by a throw. mcount: 2,696 targets, each once.

## For the integration

- `fdcSheets(model)` is called exactly as the contract says: `const out=fdcSheets(M); buildXlsx(out.sheets, out.extra)`.
- audit-other "v2.04 (item 113) — the house style … which reports" fails on this branch alone (`exportFdc` writes a workbook with
  no house style, 16 reports where it counts 15): B's item-113 list update is what makes it hold.
- `money-coverage.mjs`: `exportFdc`'s `via` leaves out `fdcSheets` (not on this branch, and a `via` naming a function the board
  lacks fails the run); add it at integration if B does not register it. `money-map.json` / `.md` carry this surface; B's edits
  to them, if any, merge beside it (regenerate `money-map.md` with `node tools/money-map.mjs`).
- `proofs-A.json` is ignored by `*.json`: added with `git add -f`.
