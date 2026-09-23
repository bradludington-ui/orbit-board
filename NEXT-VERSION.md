# Next version — queued changes

Changes are logged here as they come up and built together as ONE version when Brad says **go**.
Nothing on this list touches the board until then. On go: build every open item, run the full
math gate once, bump the version once, push once, and move the items to *Shipped* with the version.

Current version: **v1.82**. Next: **v1.83**.

## Open

### 2. Spend Plan Source: full, verbatim BAE budget names, assigned automatically
- **Logged:** 23 Sep 2026, Brad (with photos of a Spend Plan Source export and the USAF BAE 2026 file).
- **What Brad sees:** the Budget column says `USAF O&M`, `ANG O&M`, `USMC STOVL O&M`, `USN O&M`.
  CCaR rejects anything that is not the budget's name exactly as the BAE file spells it, e.g.
  `USAF O&M - ANG CAM Discretionary AV`.
- **What Brad needs:**
  1. The full BAE budget name, verbatim, on every Spend Plan Source line.
  2. Assigned automatically from the requirement's facts: its **service** (ANG money to an ANG
     budget, AFRC to AFRC, and so on), its **lane** (discretionary dollars to a *Discretionary*
     budget, mandatory dollars to an *OBBBA Mandatory* one) and its **PMO** (MxS to the MxS budget,
     AV to AV, and so on).
  3. A requirement funded from both lanes gets **two lines per service**: the discretionary dollars
     on the Discretionary budget and the mandatory dollars on the Mandatory budget.
- **What the code does today (read 23 Sep):**
  - With **no BAE file loaded** the export makes a name up per service (`USAF O&M`), which CCaR
    will always reject. Brad's export shows these, so that board had no BAE loaded when it exported.
  - With a BAE file loaded it narrows by appropriation, PMO, service and lane, but fills a name in
    **only when exactly one fits**, and leaves the cell blank otherwise. It counts rollup headings as
    fits, and funding lines the board has no field for. Measured on the names in Brad's USAF photo:
    ANG AV discretionary has 4 fits, ANG MxS mandatory 4, AFRC MxS discretionary 3, USAF AV
    discretionary 4, USAF AV mandatory 4 — so none is ever filled in. A requirement drawing both
    lanes is not narrowed by lane at all, and the export writes one line per service, not one per lane.
  - **A misread found while measuring:** the heading `USAF O&M NON AFRC NON ANG` is read as an **ANG**
    budget, because "NON ANG" contains the word ANG. It shows up as a candidate for every ANG requirement.
  - The BAE spelling is not uniform, so names must be copied, never built: the same file has
    `USAF O&M - ANG ...` and `USAF O&M- CAM ...` (no space before the hyphen), and `MXS` on AFRC
    beside `MxS` on ANG.
- **Proposed fix:**
  1. Leave rollup rows out of the candidates (a name with no PMO and no funding line is a heading).
  2. **CAM only, automatically** (Brad, 23 Sep: "Always CAM unless I pick CONG or BOS by hand").
     CONG and BOS names are never chosen automatically; they are offered only when Brad picks by hand.
  3. Match the lane exactly: discretionary dollars only to a *Discretionary* name, mandatory only to
     an *OBBBA Mandatory* name. Where an office's CAM budgets carry no lane in the name (BOP and CDS
     on ANG and AFRC, BOP on the active Air Force), use that office's one CAM name for both lanes.
     Checked against the photo's names, this leaves exactly one correct name in 11 of 12 cases tried,
     e.g. ANG discretionary AV → `USAF O&M - ANG CAM Discretionary AV`, ANG CDS →
     `USAF O&M - ANG CAM CDS`, active USAF mandatory AV → `USAF O&M - CAM OBBBA Mandatory AV`.
     The twelfth, active Air Force **mandatory CDS**, has no budget in the photo at all; that line
     is flagged for a hand pick, never guessed.
  4. Read "NON AFRC NON ANG" as the active Air Force, not as ANG.
  5. Split each service's line by lane in the Spend Plan Source, each with its own budget, keeping
     the dollars whole — the lines must still add to the funded total, and the trace matrix and a
     new mutation will hold that.
  6. Print the name exactly as the BAE cell holds it (trimmed of the leading indent only).
  7. With no BAE loaded, leave Budget blank and say so before the export, instead of printing a
     name CCaR will reject.
  8. Where no name, or more than one, still fits, keep asking a person, and list those lines before export.
- **Needed before building:**
  1. The Navy / Marine Corps (DON) BAE names for O&M — a photo like the USAF one — so USN,
     USMC STOVL and USMC CV are matched against real names, not assumed ones.
  2. ~~CONG and BOS lines~~ — answered 23 Sep: always CAM; CONG and BOS by hand only.
  3. Confirm the blank-and-warn behaviour when no BAE is loaded.
  4. Is there an active Air Force mandatory CDS budget? The photo stops at row 157 and shows none.

## Withdrawn

### 1. PIDs show up in the CCaR column of the Excel workbook
- **Withdrawn 23 Sep 2026 by Brad:** the PID is in the right column now. No change.
- What testing had shown, kept for the record: the export places the CCaR number and the PID in
  their own columns on every sheet, including a requirement with a PID and no CCaR number.

## Shipped

*(nothing yet under this process)*
