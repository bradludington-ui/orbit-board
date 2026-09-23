# Next version — queued changes

Changes are logged here as they come up and built together as ONE version when Brad says **go**.
Nothing on this list touches the board until then. On go: build every open item, run the full
math gate once, bump the version once, push once, and move the items to *Shipped* with the version.

Current version: **v1.82**. Next: **v1.83**.

## Open

### 1. PIDs show up in the CCaR column of the Excel workbook
- **Logged:** 23 Sep 2026, Brad.
- **What Brad sees:** in the Excel Workbook export (File › Export › *Excel Workbook — full breakouts*),
  PID numbers sit in the CCaR record-number column.
- **What testing showed (23 Sep):** the export places each field correctly. A test board with one
  requirement holding both numbers, one holding only a PID and one holding only a CCaR number put
  every value under its own header on every sheet that carries them (Decision Bands, Funded,
  Unfunded Requirements, each PMO sheet). No import writes either field; only the editors do, and
  each editor is wired to its own field in both builds.
- **Likely cause:** the PIDs are stored in the board's CCaR field. In the card build the expanded
  row shows a **CCaR** box and no PID box — the PID is set only from the small chip on the row line
  — so a PID typed into that box is saved as the CCaR number, and the export then shows it, faithfully,
  under CCaR. The CCaR box holds 12 characters and a PID up to 20, so a longer PID typed there is
  also **cut short**.
- **Needed before building:** a screenshot of the export showing it, or one PID and one CCaR number
  as they really look, and which build it happened in (card or grid).
- **Proposed fix:**
  1. A PID box beside the CCaR box in the expanded row, so each number has an obvious home.
  2. A one-time check that lists requirements whose CCaR value looks like a PID, and offers to move
     each one to PID (never silently).
  3. Warn when a CCaR entry is longer than 12 characters, instead of cutting it off quietly.
  4. An audit check and a mutation that fail if a PID is ever written to the CCaR column.

## Shipped

*(nothing yet under this process)*
