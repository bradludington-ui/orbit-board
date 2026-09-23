# Next version — queued changes

Changes are logged here as they come up and built together as ONE version when Brad says **go**.
Nothing on this list touches the board until then. On go: build every open item, run the full
math gate once, bump the version once, push once, and move the items to *Shipped* with the version.

Current version: **v1.82**. Next: **v1.83**.

## Open

### 2. Spend Plan Source: full, verbatim BAE budget names, assigned automatically
- **Logged:** 23 Sep 2026, Brad. Photos of a Spend Plan Source export and of BAE names (USAF O&M,
  Marine Corps Full Fund, Spares, Modifications and O&M) are **examples only**: the logic must work
  from the structure of the names in whatever BAE file is imported, all 697 of them.
- **What Brad sees:** the Budget column says `USAF O&M`, `ANG O&M`, `USMC STOVL O&M`, `USN O&M`.
  CCaR rejects anything that is not the budget's name exactly as the BAE file spells it.
- **What Brad needs:**
  1. The full BAE name, verbatim, on every Spend Plan Source line, for O&M, Full Fund, Spares and OPN.
  2. Assigned automatically from the requirement's **service**, **lane** (discretionary dollars to a
     Discretionary budget, mandatory to a Mandatory one) and **PMO**.
  3. A requirement funded from both lanes gets **two lines per service**, one per lane.
  4. **Import the BAE once.** The list stays in the saved board and is there on every appropriation.
  5. **No BAE loaded: Budget left blank, with a warning** (decided 23 Sep), never a made-up name.
  6. **CONG and BOS only by hand** (decided 23 Sep); everything else automatic where it can be.

#### What the code does today (read and measured 23 Sep)
- **The BAE list is not kept across appropriations.** The import keeps every appropriation's names,
  but stores them in the open appropriation's own store. Switching appropriation reloads the board
  with a different store, so a list imported on O&M is absent on Full Fund, Spares and OPN, and the
  export falls back to made-up names. That is the reloading Brad has been doing. Nothing in the
  round-trip fuzz or the suites checks that the list survives a save.
- With no BAE loaded, the export makes a name up per service (`USAF O&M`).
- With a BAE loaded, a name is filled in only when exactly one fits. Rollup headings count as fits,
  CONG / BOS count as fits, and the lane only narrows when a requirement is wholly one lane — so it
  almost never gets to one: 3 or 4 fits in every O&M case tried, 6 to 10 on Full Fund.
- It misreads `USAF O&M NON AFRC NON ANG` as an ANG budget ("NON ANG" contains ANG).
- A requirement drawing both lanes gets one line per service, not one per lane.
- The BAE spelling is not uniform, so names are copied, never built: `O&M - ` / `O&M- ` / `O&M -1A9A`,
  `MxS` / `MXS`, `Full Mission Sims Discretionary TSS` on STOVL beside `Full Mission Sims TSS` on CV.

#### The rule (structural, no list of names in the program)
Every name reads as *service + appropriation + funding line + [Discretionary | Mandatory] + PMO*.
1. **Headings are not budgets:** a name with no PMO and no lane (`USAF O&M - ANG CAM`,
   `USMC STOVL APN Spares Initial`, `USMC STOVL O&M -1A9A`) is never assigned.
2. **Hand-pick-only lines:** CONG and BOS (decided); OCO and Withhold proposed the same.
3. **Service, PMO, then lane exactly;** where the office's names carry no lane, its one lane-less
   name takes both lanes; where no name fits, the line is flagged, never guessed.
4. **The funding line**, where rules 1–3 still leave more than one (most of Full Fund): the line CCaR
   already has this record under from the last Spend Plan Source pull, else last year's choice
   (both already recorded by the board), else picked once from only the lines that exist for that
   service and PMO.

**Measured on every example name sent (20 cases):** 16 resolve to exactly one name with nothing
chosen — all USAF O&M, all Marine Corps O&M, Spares, and Full Fund BOP. For example:
ANG discretionary AV → `USAF O&M - ANG CAM Discretionary AV`; ANG CDS → `USAF O&M - ANG CAM CDS`;
STOVL O&M PSM → `USMC STOVL O&M -1A9A AT ATF Discretionary PSM`; STOVL Spares PP →
`USMC STOVL APN Spares Initial Discretionary PP`. Three Full Fund cases leave four names each and
need the funding line (rule 4). One (CV Spares PP) found none because the photo shows only its CONG
name; with the whole file it will find the ordinary one, or flag it.

#### Proposed fix
1. **Keep the BAE list once, for the whole board:** stored beside the appropriations rather than
   inside one, written into the saved file, read by every appropriation. A board saved with the old
   layout is moved over when it opens, so a list already imported is not lost.
2. Apply the rule above; read `NON AFRC NON ANG` as the active Air Force.
3. Split each service's line by lane in the Spend Plan Source, each with its own budget, keeping the
   dollars whole — the lines still add to the funded total, held by the trace matrix and a mutation.
4. Print the name exactly as the BAE cell holds it (the leading indent trimmed, nothing else).
5. No BAE loaded: Budget blank, and a warning before the export.
6. Before export, list every line still without a budget, so nothing reaches CCaR blank by accident.
7. Tests: the round-trip fuzz fills the BAE list and proves it survives save, reopen and a switch of
   appropriation; the audits check the rule's picks and the lane split; mutations prove each check bites.

#### Needed before building
1. **OCO and Withhold:** hand-pick only, like CONG and BOS?
2. **Spares TrngDev** (`USMC STOVL APN Spares TrngDev AV`): part of the Spares board? Today it is
   ignored, like Modifications, RDT&E and Flyaway.
3. **Modifications** (`USMC STOVL APN Modifications Discretionary AV`): stays out, like RDT&E?
4. Optional: a usual Full Fund funding line per PMO, if there is one, would fill more of Full Fund
   automatically before rule 4 has to ask.

## Withdrawn

### 1. PIDs show up in the CCaR column of the Excel workbook
- **Withdrawn 23 Sep 2026 by Brad:** the PID is in the right column now. No change.
- What testing had shown, kept for the record: the export places the CCaR number and the PID in
  their own columns on every sheet, including a requirement with a PID and no CCaR number.

## Shipped

*(nothing yet under this process)*
