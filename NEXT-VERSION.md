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
1. **No PMO in the name = a legacy budget, never usable** (decided by Brad, 23 Sep). It is never
   offered, never auto-assigned, and never taken over from last year's choice or from the CCaR pull:
   a requirement that arrives pointing at one is flagged for a fresh pick. Examples:
   `USAF O&M - ANG CAM`, `USAF O&M- BOS`, `USMC STOVL APN Spares Initial`, `USMC STOVL O&M -1A9A`,
   `USN APN Full Fund SUPT PES USN CV`. The PMO is read as the last word of the name
   (AV, MxS, PP, PSM, TSS, CDS, BOP, ATL, any case).
2. **Hand-pick-only lines:** CONG, BOS, OCO, Withhold and Spares **TrngDev** (all decided by
   Brad, 23 Sep). Never
   chosen automatically, never taken over from last year or the CCaR pull; offered only when
   Brad picks by hand.
   **Out of scope entirely:** Modifications, RDT&E and Flyaway budgets (decided 23 Sep). They are
   never offered, as today.
   **Spares TrngDev is part of the Spares board** (decided 23 Sep): a separate, low-dollar pot.
   Today the board ignores those names; they must be read as Spares budgets
   (`USMC STOVL APN Spares TrngDev AV`, `... TrngDev PP`, `... TrngDev TSS`) and offered by hand,
   so an ordinary Spares requirement still goes to its *Spares Initial* name automatically.
3. **Service, PMO, then lane exactly;** where the office's names carry no lane, its one lane-less
   name takes both lanes; where no name fits, the line is flagged, never guessed.
4. **The funding line.** O&M: CAM (hand-pick lines aside). **Full Fund: the requirement's cost
   element, one to one** (decided by Brad, 23 Sep). The board already holds a cost element per Full
   Fund requirement and carries it forward each year; a fixed table ties each of its cost elements
   to the words the BAE names use (all rows confirmed by Brad, 23 Sep):

   | Cost element on the board | Funding line in the BAE name |
   |---|---|
   | Airframe PGSE | Airframe PGSE |
   | Engine PGSE | ENGINE PGSE |
   | Avionics PGSE | Avionics PGSE |
   | Peculiar Training Equip | PEC TRNG |
   | Full Mission Simulators | Full Mission Sims |
   | Pubs/Tech Data | PUBS/TECH DATA |
   | Other ILS Production | OTHER ILS |
   | Fixed JPO Support | FIXED JPO SUPT POA |
   | Depot Standup Software | Depot Software |
   | Depot Standup Air Vehicle | Depot Standup (the PMO picks AV, PP or PSM) |
   | Depot Standup Propulsion | Depot Standup (the PMO picks AV, PP or PSM) |
   | JRE | the BAE line that names JRE, once one exists (CDS JRE requirements start next year); until then a JRE requirement is flagged for a hand pick |
   | **Production Engineering Support** *(new, #8 in the list)* | PES |

   Matching ignores case and spacing. A Full Fund requirement with **no cost element** is flagged to
   have one set, not guessed. Anywhere a line is still open after this (a new appropriation's
   pattern, say), the fallback is the line CCaR already files the record under, then last year's
   choice, then a one-time pick from only the lines that exist for that service and PMO.

**Measured on every example name sent (20 cases, the legacy rule applied):** 16 resolve to exactly one name with nothing
chosen — all USAF O&M, all Marine Corps O&M, Spares, and Full Fund BOP. For example:
ANG discretionary AV → `USAF O&M - ANG CAM Discretionary AV`; ANG CDS → `USAF O&M - ANG CAM CDS`;
STOVL O&M PSM → `USMC STOVL O&M -1A9A AT ATF Discretionary PSM`; STOVL Spares PP →
`USMC STOVL APN Spares Initial Discretionary PP`. With the cost element added (rule 4), **all 56 service + PMO +
cost element combinations in the Full Fund examples resolve to exactly one name**, e.g. STOVL PSM
on Other ILS Production → `USMC STOVL APN Full Fund SUPT OTHER ILS Discretionary PSM`, CV TSS on
Full Mission Simulators → `USN APN Full Fund SUPT USMC CV Full Mission Sims TSS`, STOVL BOP on Fixed
JPO Support → `USMC STOVL APN Full Fund SUPT FIXED JPO SUPT POA Discretionary BOP`. One (CV Spares PP) found none because the photo shows only its CONG
name; with the whole file it will find the ordinary one, or flag it.

#### Proposed fix
1. **Keep the BAE list once, for the whole board:** stored beside the appropriations rather than
   inside one, written into the saved file, read by every appropriation. A board saved with the old
   layout is moved over when it opens, so a list already imported is not lost.
2. Apply the rule above; read `NON AFRC NON ANG` as the active Air Force. Add **Production
   Engineering Support** to the board's cost elements as **#8, right before Fixed JPO Support**
   (Brad, 23 Sep; the name confirmed as *Production*, not Program), matched to `PES`. The list becomes: 1 Airframe PGSE, 2 Engine PGSE,
   3 Avionics PGSE, 4 Peculiar Training Equip, 5 Full Mission Simulators, 6 Pubs/Tech Data,
   7 Other ILS Production, **8 Production Engineering Support**, 9 Fixed JPO Support, 10 Depot Standup
   Software, 11 Depot Standup Air Vehicle, 12 Depot Standup Propulsion, 13 JRE. A requirement's cost
   element is saved by name, not number, so no existing choice moves; only a number typed into the
   cost element prompt follows the new order (checked 23 Sep: that prompt is the one place the
   board reads the list by position). A board saved before this loads unchanged.
3. Split each service's line by lane in the Spend Plan Source, each with its own budget, keeping the
   dollars whole — the lines still add to the funded total, held by the trace matrix and a mutation.
4. Print the name exactly as the BAE cell holds it (the leading indent trimmed, nothing else).
5. No BAE loaded: Budget blank, and a warning before the export.
6. Before export, list every line still without a budget, so nothing reaches CCaR blank by accident.
7. Tests: the round-trip fuzz fills the BAE list and proves it survives save, reopen and a switch of
   appropriation; the audits check the rule's picks and the lane split; mutations prove each check bites.

#### Needed before building — nothing; every question answered 23 Sep
1. ~~OCO and Withhold~~ — answered 23 Sep: by hand only.
2. ~~Modifications, RDT&E, Flyaway~~ — answered 23 Sep: stay out.
3. ~~Spares TrngDev~~ — answered 23 Sep: part of the Spares board, a low-dollar pot, by hand only.
4. ~~Full Fund default~~ — answered 23 Sep: the budget follows the cost element, one to one.
5. ~~Cost element table~~ — answered 23 Sep: Depot Standup Software → Depot Software; both Depot
   Standup cost elements → Depot Standup, with the PMO choosing AV, PP or PSM; PES is **Production
   Engineering Support**, a cost element the board is missing and gains in this version; JRE
   requirements (CDS) start next year, so JRE follows the BAE line that names it once one exists.

## Withdrawn

### 1. PIDs show up in the CCaR column of the Excel workbook
- **Withdrawn 23 Sep 2026 by Brad:** the PID is in the right column now. No change.
- What testing had shown, kept for the record: the export places the CCaR number and the PID in
  their own columns on every sheet, including a requirement with a PID and no CCaR number.

## Shipped

*(nothing yet under this process)*
