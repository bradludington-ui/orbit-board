# Next version — queued changes

Changes are logged here as they come up and built together as ONE version when Brad says **go**.
Nothing on this list touches the board until then. On go: build every open item, run the full
math gate once, bump the version once, push once, and move the items to *Shipped* with the version.

Current version: **v1.82**. Next: **v1.83**.

## Open

### 2. Spend Plan Source: full, verbatim BAE budget names, assigned automatically
- **Logged:** 23 Sep 2026, Brad, with photos of a Spend Plan Source export, the USAF O&M names
  (USAF BAE 2026) and the Marine Corps Full Fund Support names (BAE Import List). Each photo is a
  partial listing; the board works from whatever BAE file is imported.
- **What Brad sees:** the Budget column says `USAF O&M`, `ANG O&M`, `USMC STOVL O&M`, `USN O&M`.
  CCaR rejects anything that is not the budget's name exactly as the BAE file spells it.
- **What Brad needs:** the full BAE name, verbatim, on every Spend Plan Source line, for all four
  appropriations (O&M, Full Fund, Spares, OPN), assigned automatically from the requirement's
  **service** (ANG money to an ANG budget, and so on), **lane** (discretionary dollars to a
  Discretionary budget, mandatory to a Mandatory one) and **PMO**. A requirement funded from both
  lanes gets **two lines per service**, one per lane, each with its own budget.

#### What the code does today (read and measured 23 Sep)
- With **no BAE file loaded** the export makes a name up per service (`USAF O&M`), which CCaR will
  always reject. Brad's export shows these, so that board had no BAE loaded when it exported.
- With a BAE file loaded it narrows by appropriation, service, PMO and lane, and fills a name in only
  when **exactly one** fits; otherwise the cell is blank. It counts rollup headings as fits, and it
  knows nothing about the **funding line** a name carries, so it almost never gets to one:
  - O&M, USAF photo: 3 or 4 fits in every case tried (ANG AV discretionary 4, AFRC MxS 3, ...).
  - Full Fund, Marine Corps photos: STOVL PSM discretionary **7** fits across 6 funding lines,
    STOVL AV 10, USMC CV PSM 6, USMC CV TSS 6.
- It misreads `USAF O&M NON AFRC NON ANG` as an **ANG** budget ("NON ANG" contains ANG).
- A requirement drawing both lanes is not narrowed by lane, and gets one line per service, not one
  per lane.
- It already carries a requirement's budget choice forward from last year, and it already records,
  from each Spend Plan Source pull, which budget every CCaR record is filed under.
- The BAE spelling is not uniform, so names are copied, never built: `O&M - ` beside `O&M- `,
  `MXS` beside `MxS`, `PES MxS` on STOVL beside `PES MXS` on CV, and `Full Mission Sims Discretionary
  TSS` on STOVL beside `Full Mission Sims TSS` on CV.

#### The funding line is the missing fact
Every BAE name is *service + appropriation + funding line + [Discretionary | OBBBA Mandatory] + PMO*.
Service, lane and PMO the board knows. The funding line it does not:
- **O&M:** CAM, CONG, BOS. Decided 23 Sep: **always CAM** unless Brad picks CONG or BOS by hand.
- **Full Fund:** 12 lines in the photos — Airframe PGSE, Avionics PGSE, CONG, Depot Software, Depot
  Standup, ENGINE PGSE, FIXED JPO SUPT POA, Full Mission Sims, OTHER ILS, PEC TRNG, PES,
  PUBS/TECH DATA. There is no single default the way CAM is for O&M.
- **Spares and OPN:** not seen yet.

#### Proposed fix
1. A **budget line** on each requirement, one per appropriation, filled in this order and shown
   so it can be changed:
   a. O&M: CAM.
   b. The line CCaR already has this record under, from the last Spend Plan Source pull.
   c. Last year's line, carried forward (already happens for the whole budget choice).
   d. Otherwise asked once, from a list of only the lines that exist for that requirement's service
      and PMO. CONG and BOS are only ever chosen by hand.
2. With the line known, service + PMO + lane + line picks the name. Leave rollup headings out
   (no PMO and no lane); match the lane exactly; where the line's names carry no lane, use its one
   name for both lanes. Checked on the O&M photo this gives one correct name in 11 of 12 cases, e.g.
   ANG discretionary AV → `USAF O&M - ANG CAM Discretionary AV`, ANG CDS → `USAF O&M - ANG CAM
   CDS`. The twelfth, active Air Force **mandatory CDS**, has no budget in the photo; it is flagged
   for a hand pick, never guessed. On Full Fund, a STOVL PSM requirement on OTHER ILS gets
   `USMC STOVL APN Full Fund SUPT OTHER ILS Discretionary PSM`.
3. Read `NON AFRC NON ANG` as the active Air Force, not as ANG.
4. Split each service's line by lane in the Spend Plan Source, each with its own budget, keeping the
   dollars whole: the lines must still add to the funded total, held by the trace matrix and a new
   mutation.
5. Print the name exactly as the BAE cell holds it (trimmed of the leading indent only).
6. With no BAE loaded, leave Budget blank and say so before the export, never a made-up name.
7. Before export, list every line still without a budget, so nothing reaches CCaR blank by accident.

#### Needed before building
1. Photos of the **Spares Initial** and **OPN** names, like the Full Fund ones.
2. A photo of the **Navy / Marine Corps O&M** names (the export shows `USMC STOVL O&M`,
   `USMC CV O&M` and `USN O&M` lines, so those budgets exist).
3. **Full Fund default:** is there a usual funding line per PMO (for example PSM normally OTHER ILS),
   or does each requirement's line come from CCaR and last year, and get picked once otherwise?
4. **Mandatory on Full Fund, Spares and OPN:** the Full Fund photos show no Mandatory names. Does
   mandatory money occur on those appropriations, and under what name?
5. Is there an active Air Force **mandatory CDS** O&M budget? The O&M photo shows none.
6. Confirm the blank-and-warn behaviour when no BAE is loaded.
7. `USN APN Full Fund SUPT PES USN CV` names no PMO. Is it a real budget, and for which PMO?

## Withdrawn

### 1. PIDs show up in the CCaR column of the Excel workbook
- **Withdrawn 23 Sep 2026 by Brad:** the PID is in the right column now. No change.
- What testing had shown, kept for the record: the export places the CCaR number and the PID in
  their own columns on every sheet, including a requirement with a PID and no CCaR number.

## Shipped

*(nothing yet under this process)*
