# Backlog — agreed changes, built and unbuilt

Changes the portfolio office has asked for, recorded here so they survive a session.
Entries marked DONE have been applied; the rest are written to be picked up cold.

Decisions below are settled unless an entry says otherwise. Where a decision closes off a
trap the codebase has already fallen into once, the entry says which.

---

## 1. A PMO copy must be able to propose a NEW requirement

**Asked 14 Sep 2026 · decisions settled · DONE, 19 Sep 2026**

### As built

- **Whole, in its own section.** The package gains `added: […]`, one whole object per proposal
  (`pmoProposalOf`), beside the `items` deltas. A proposal's provisional id is never in `items`.
- **Provisional id carries the office.** `addReq()` on a copy mints `NEW-<office>-<n>`; the number is
  the LAST segment everywhere (`newReqSeq`, and `yearCopy` was reading `split('-')[1]`). On accept the
  board mints its own `NEW-<n>`.
- **The gate is in the copy, and on Pre-flight.** `pmoProposalGate(id)` reads the RECORD fields
  through `recFields().set` and the four extras from state; the two OGC fields are demanded off
  `destIsOgc()`. `pmoSubmit()` withholds an incomplete proposal **by name**, lists each missing
  field, and sends everything else the office edited — the contract the old guard had for an added
  row, kept, because holding forty field edits hostage to one half-filled proposal is a rule people
  learn to work around by deleting the proposal. The Add panel says it is a proposal and lists the
  mandatory set.
- **Review renders it as one row**, accept or decline, with a one-line summary; the change report
  carries it; a re-imported submittal shows it as *already added as NEW-n* and it cannot be ticked.
- **Accept creates it the way `addReq()` does**, at the bottom of the consolidated listing and last
  in its office, with the office's ask values kept, every carried field set, and provenance
  (`from: {pmo, nid, by, ts}`) that is what stops a double-add.
- **Scoped both ends.** A proposal for another office does not travel and the office is told; one
  that arrives for an office the package is not from is refused at the door.
- Guarded by *a copy proposes a new requirement* in `audit-import.mjs` and six mutations:
  `proposal-dropped`, `proposal-gate-open`, `proposal-double-add`, `proposal-lands-on-top`,
  `proposal-ask-dropped`, `proposal-unscoped`.

### As asked

### What is wanted

A programme office working a PMO copy can add a requirement that does not exist on the
portfolio board. It travels back in the submittal **flagged as new**, reviewed as a change
against the file that was sent out. The portfolio office decides whether it is added. The
PMO cannot submit one until every mandatory field is complete.

### Why it is blocked today, and why that guard is right

From `pmoSubmit()`:

> A REQUIREMENT ADDED IN THIS COPY CANNOT BE SENT THIS WAY. The package carries FIELDS of
> requirements the portfolio board already has; a new one has no id there, so it would
> arrive as a row the reviewer can only read and never tick — and the office would believe
> it had been submitted.

`addReq()` already works in a sandbox copy. It is the **submittal format** that cannot carry
one: it is field deltas keyed by an id the portfolio board already holds. This change
replaces the format; it does not loosen the guard.

| Piece | Today |
|---|---|
| `PMO_FIELDS` / `PMO_KEYS` | The 7 contributable fields: `desc`, `cons`, `notes`, `asks`, `ccar`, `pid`, `recNames` |
| `pmoBaseline()` | Snapshot of those fields for every requirement, baked into the copy at publish |
| `pmoSubmitBuild()` | Diffs each field against the baseline → `{id: {key: value}}`, **deltas only** |
| `pmoSubmit()` | Drops ids absent from `PMODE.base`, warns, writes `SPMT SUBMITTAL - <name> - <date>.json` |
| `pmoRows()` / `PMOPICK[id+'|'+key]` | Review model: one tickable row per changed field |
| `addPanel` | Already promises added requirements "flow into the export with Ref NEW-#" — reuse that |

### Mandatory before a PMO may submit a new requirement

**Settled.** The RECORD panel's set, less the two the accounting team owns, plus four more:

| Field | Note |
|---|---|
| Prime contract / OGC | |
| PMO | |
| Obligation category | |
| WBS | |
| Goes to | Completeness rule below |
| Description | added |
| Impact if not funded | added |
| Ask / requirement amount **by service** | added |
| Projected award / obligation date | added — `S.awards[id]` |
| MIPR type (Direct Cite / Reimbursable) | added — see entry 2, and the scope note below |
| ~~RCN / EEIC~~ | **NOT mandatory** — the accounting team sets it |
| ~~Navy SI code~~ | **NOT mandatory** — the accounting team sets it |

**Scope of the MIPR-type requirement.** It is an OGC classification, so it is mandatory on a
proposed requirement **wherever the requirement is an OGC** — i.e. wherever the destination is
not a prime contractor. It does not apply to a requirement going straight to a prime, and the
gate must not demand it there: a mandatory field that cannot apply is a gate people learn to
work around. This is the same Kind test as the "Goes to" rule below, so the two are satisfied
or waived together — implement them off one predicate, not two.

**The "Goes to" completeness rule — settled.** Keyed on the destination's **Kind**, not on a
name list: any destination that is **not a prime contractor** requires the secondary location
(the ultimate recipient) as well as the first hop. Today that is exactly Lockheed Martin and
Pratt & Whitney, so behaviour is identical now — but it does not go stale when a prime is
renamed or a third is added. A hardcoded list is the same trap as the hardcoded year list
that blanked a whole appropriation in Spruills (see CLAUDE.md, `spGather`).

> **Gap closed, 19 Sep 2026 (with entry 7):** the "Which awards to" control is offered for every
> non-prime kind, keyed on `destIsOgc()` — the same predicate as MIPR type, so the two are
> satisfied or waived together as this entry requires. Guarded by `second-hop-gov-only`.

### The rest, settled

- **Placement.** A new requirement lands **within the PMO's own rack-and-stack order** in
  their copy. On the **consolidated listing it drops to the bottom** for placement by the
  SFWG.
- **Values.** It keeps the PMO's proposed ask amounts on accept. The portfolio office can
  change, adjust and modify them once pulled into the main dashboard.
- **Appropriation.** A PMO may propose against **any appropriation this office manages** —
  not only ones they already hold a requirement in. Having none today does not mean having
  none tomorrow. Note the copy pins its appropriation at publish (`ap` in `PMODE`), so the
  proposal has to carry its target appropriation explicitly.

### What building it involves

1. A second section in the submittal (`added: [...]`) carrying whole objects, not deltas.
2. A provisional id minted in the copy so the reviewer has something to tick and two offices
   cannot collide — extend the existing `NEW-#` convention to carry the office (`NEW-PSM-1`)
   and map to a real id on accept.
3. The mandatory gate enforced **in the copy at submit time**, so the person who can fix it is
   told while they are still sitting there. Surface it in `⬇ Export › ✈ Pre-flight check…` too.
4. Review panel renders a proposal as accept-or-decline, not a row of ticks; on accept it
   creates the requirement and places it per the placement rule above.
5. **Guards.** A path that silently drops a proposal, double-adds on a re-imported submittal,
   or accepts one with a mandatory field missing is exactly what the suites exist to catch.
   Needs an `audit-import.mjs` case plus mutations for the drop and for the gate.

---

## 2. Classify OGCs as MIPR Direct Cite or MIPR Reimbursable

**Asked 14 Sep 2026 · DONE, v1.57**

Add a funding-type classification to OGC requirements: **MIPR Direct Cite Funding** or
**MIPR Reimbursable**.

- **Where it lives — settled: on the requirement**, alongside "Goes to". The same government
  activity can take Direct Cite on one requirement and Reimbursable on another, so a
  per-destination default would be wrong silently the first time that happened.
- **Scope — the dashboard captures the classification only.** How the money is sent and its
  timing follow from it, but those are internal decisions and are deliberately **not**
  modelled here. Do not add sending or timing logic.
- Belongs in the record panel beside "Goes to", and on the Spend Plan Source export.
- **Mandatory for a PMO-proposed new requirement — settled** (entry 1). Unlike RCN/EEIC and
  the Navy SI code, this is not an accounting-team field: the PMO knows which it is, and it
  is what decides how the money is sent. It is required wherever the requirement is an OGC —
  see the scope note in entry 1.

### As built, and the one place it departs from the above

`S.mipr[id]` holds `'direct'` or `'reimb'`; `MIPR_LBL` is the sole place either is spelled out.
`setMipr()` refuses anything else. The record panel offers the field only when `destIsOgc(it)` is
true — **the same predicate** the Goes-to completeness rule in entry 1 must use, written once so
the two cannot drift apart. It is in `PMO_FIELDS`, so a submittal carries it, and `yearCopy()` has a
`cp(T.mipr, …)`, so a year copy does. It is **not** in `applyState()`'s normalise list: the container
is created lazily by `setMipr()` (`if(!S.mipr) S.mipr={}`), like `obCat`, `aceMap`, `whatif`, `upl`,
`rcnAsg`, `budgetAsg` and the six `clin*` containers. That is why the round-trip fuzz reads the set of
containers out of the board's source rather than from that list — see CLAUDE.md.

**It is NOT on the Spend Plan Source export**, which is where this entry asked for it. That export
is a measured mirror of a real workbook — its own comment says *"The export mirrors them exactly,
so any change here must come from re-measuring the file, never from taste"* — and `QPE_READS` maps
its columns **by index**, so inserting one would silently re-point every column after it on the
next import. It prints on the **🎯 Priority Drill** instead, and the record panel's footer now says
the export covers these fields *except where a field says otherwise*, with the MIPR field carrying
that exception itself.

> **Found while building, and worth remembering:** `matCols()` derives the classification matrix's
> columns from `recFields()`, so the new field became a matrix column on its own — but `matBulk()`
> is the one list that is deliberately **not** derived, and a list-valued column with no bulk setter
> means the sweep covers less than the grid draws. `matBulkOk()` is the board's own name for that
> gap, and it read `['MIPR type']` the first time a requirement was routed to a government activity.
> Nothing failed, because no suite had ever called it on a board with a destination logged. **Any
> new record field that renders a `<select>` needs a `matBulk()` entry**, and the MIPR block in
> `audit-board.mjs` now asserts `matBulkOk()` is empty on a routed board.

---

## 3. Make band and impact editable in the right-hand panel

**Asked 14 Sep 2026 · DONE, v1.56**

The band assignment shows in the requirement listing and is editable there, and it also shows
in the right-hand panel — but read-only. Make it **editable in the panel**.

**Impact is done (v1.55)** — it is now an editable chip in the panel's *Open on the row* group.
What remains is the **band**.

The obstacle to name: the panel's chip strip is `rowChipsHtml(it)` with every `onclick` stripped
and `cursor:pointer` rewritten, deliberately, so the panel's own fields own the controls. Making
the band editable in the panel therefore means giving it a real panel field, not un-stripping the
echo — un-stripping would make every chip in that strip clickable again, which is the defect
`.chipsro` was introduced to fix.

---

## 4. Remove the Low / Medium / High tier

**Asked 14 Sep 2026 · DONE, v1.55**

Not in use, and how a tier got selected was never clear. Remove the levels and the control.

**Checked — this is behaviourally inert today.** `TIER_OF = id => (S.tier||{})[id] || 'M'`,
so on a board where nobody has set a tier every requirement is already `M`. The one place it
is read is `proposedOrder()`, which sorts **band → tier → current position**; with every
value equal the tier term never decides anything. Removing it leaves the proposed order
sorting **band → current position**, and the order does not move.

Touch points: `S.tier`, `TIER_OF`, `TIER_RANK`, `proposedOrder()`, the row, the record panel,
and the tier column in the exports.

---

## 5. Slim the requirement listing lines

**Asked 14 Sep 2026 · DONE, v1.55**

With editing moving to the right-hand panel, the row should carry key information only.

**Keep:** rank · PMO · title · CCaR + PID · band chip (as a badge) · requirement $ ·
cumulative $ · lane badge · MC star · allocation field · `⋯`

**Drop from the row:** the description preview line · the "Impact — not written" chip · the
funding-source chip (`auto (lanes)`) · the inline `+ type` / `+ band` buttons

Band stays on the row because it is scanned against the 1–N and it drives the proposed order.
Everything dropped becomes panel-only.

> Watch: `tools/row-controls.mjs` (`npm run controls`) diffs the row controls between the two
> builds and expects a declared reason for each divergence. Dropping controls means updating
> that list, not silencing it.

---

## 6. "Open on the row" becomes pop-up editors, from the panel only

**Asked 14 Sep 2026 · DONE, v1.56**

Today the panel's **Open on the row** group has three chips — 📝 Note, 📄 Description,
📋 Record — calling `toggleNote()`, `toggleDesc()`, `toggleRec()`, which open editors **on the
row**.

**Impact has already moved into this group (v1.55)** — it had to, because entry 5 took the impact
chip off the grid row and the panel strips every `onclick` from its echo of the row chips, which
would have left the field with no way in at all. So the group is already
Note · Description · Record · Impact.

Still wanted:

- Each opens a **pop-up window** for the edit instead of expanding the row.
- Reachable **from the right-hand panel only** — not from the row. Note the card build has no
  panel, so on that build these stay where they are.

> Watch, twice over: `npm run editors` (`tools/editors-reachable.mjs`) asserts every editor is
> reachable at every width, and `npm run panels` (`tools/panels-render.mjs`) asserts every
> panel opens and is covered. New pop-ups must be added to `panels-render.mjs` — a panel with
> no entry there fails the sweep rather than being skipped, which is the point. And per
> CLAUDE.md, a chip that looks clickable must key its affordance off `[onclick]`, so removing
> the row route must remove the row affordance with it.

---

## 7. A bulk classification write lands on requirements that never offer the field

**Found 14 Sep 2026 while building entry 2 · DONE, 19 Sep 2026 — option 1, as recommended**

### As built

Each `matBulk()` entry may carry `applies(it)`; an entry without one applies to every requirement.
`MIPR type` and `Which awards to` are keyed on `destIsOgc()` — the predicate the record panel
already uses to offer them, so the sweep and the panel cannot disagree. One function,
`matBulkRows()`, decides the reach for the preview, the confirm and the write, and all three say
how many requirements never offer the field and are left alone. The `↳ USAF`-style per-service
budget setters carry no `applies()` and still reach everyone, which is the case the obvious fix
would have broken. Guarded by *a bulk write lands only where the field is offered* in
`audit-board.mjs` and the `bulk-lands-everywhere` mutation; registered as
`bulk-write-where-the-field-is-not-offered`.

The second-hop control is now offered for **every non-prime kind**, off that same predicate —
which closes the gap entry 1 records below. Guarded by `second-hop-gov-only`.

### As found

`matApplyBulk()` writes to every row `matRows()` returns. `matRows()` filters by PMO and by the
missing-field picker, but **not** by whether the chosen field is one that requirement actually
offers. So a bulk `MIPR type = Direct Cite` with no missing-field filter set writes the
classification onto all 115 requirements, including the ~114 routed to a prime, where the record
panel will never show it. The value is then real: it is in `S.mipr`, so it travels in a submittal
and in a year copy, and nothing on screen says it is there.

**This is pre-existing, not new.** `Which awards to` has behaved this way since it shipped — a bulk
set writes `dest.end` on primes the same way. Entry 2 only made it easier to notice, because MIPR
type is the first field whose *absence* is meaningful rather than merely unanswered.

**The obvious fix is wrong, which is why this is an entry and not a patch.** Scoping the write to
rows whose `recFields()` offers a field with that label would silently no-op the per-service budget
setters: `matBulk()` carries `↳ USAF`, `↳ ANG`, `↳ AFRC` … which have **no** matching record-field
label — they are bulk-only entries with no column. Measured on a 3-service board:

```
bulk keys : [… "Goes to","Which awards to","MIPR type", … "↳ USAF","↳ ANG","↳ AFRC"]
A labels  : [… "Goes to","MIPR type","Which awards to"]        ← offers all three
B labels  : [… "Goes to"]                                       ← offers only the first
```

So the scoping test has to distinguish "this row does not offer this field" from "this field is not
a record field at all", and any fix needs a check covering both. Options worth weighing:

1. Give each `matBulk()` entry an explicit `applies(it)` predicate, defaulting to *always*; MIPR
   type and `Which awards to` use `destIsOgc` / the gov-kind test. Most honest, most typing.
2. Skip rows whose `recFields()` lacks the label **only when some row has it** — clever, and the
   kind of clever that is wrong on a board where no requirement is an OGC yet.
3. Leave the write alone and make the confirm dialog count the rows that do not offer the field, so
   the blast radius is stated rather than scoped. Smallest change; does not stop the write.

Option 1 is the recommendation. Whichever is chosen, the guard is an `audit-board.mjs` case plus a
mutation: a bulk set that reaches a requirement which never offered the field is the defect.

---

## 8. PPBE cycles across the FYDP — lock a cycle's five-year spend plan, allocate the next cycle's deltas, report and compare by cycle

**Asked 19 Sep 2026 · stage 1 BUILT 19 Sep 2026 (v1.71) · stage 2 BUILT 20 Sep 2026 (v1.72) · stage 3 BUILT 20 Sep 2026 (v1.73) · stage 4 BUILT 20 Sep 2026 (v1.74) · stage 5 BUILT 20 Sep 2026 (v1.75) · stage 6 open**

### Stage 5, as built (v1.75)

- **`cycCmpData(a, b)`** — A and B (any locked cycle, or the working plan) read through the
  five-year plan's one shape. Per year both hold, per requirement: A, B, Δ = B − A for requirement,
  allocated, funded and unfunded; rank, band, PMO and star; ADDED / REMOVED / CHANGED / same. The
  rows account for the totals (Σ row Δ = total Δ, per year, per column): computed, printed, asserted.
  A year only one side holds is stated as *not in <cycle>*; the same source twice is refused.
- **The workbook** *⇄ Cycle Comparison (Excel)*: Compare (requirement rows, PMO subtotals, TOTAL,
  CHECK), Changes (per year: the rows that are not the same, with what changed, Σ ROWS, TOTAL Δ,
  CHECK, the pots), By PMO.
- **The panel** *⇄ Compare two cycles…* (FYDP Views): pickers for A and B, per year the totals as
  A, B, Δ with the pots, the ✓ line, and the changed rows. The cycles panel's ⇄ Compare now opens it
  with that cycle as A; the old one-year compare block is removed.
- **Spruills** already reads locked cycles as *Budget source* for every year a cycle holds
  (`blPmoAlloc`, stage 1) — nothing further was needed here.
- **Proved by** *comparing two cycles* (audit-recon: A = the engine before the lock, B = the engine
  after a value, a band, a star, a removal, an addition and a pot moved this year and a rank swap
  next year; kinds; conservation from the data, on both sheets and on the panel; agreement with
  `cycDelta`; two locks that do not follow a later move; a year on one side; the guards), fifteen
  `cmp-*` mutations in both builds, and the trace-matrix surface *xl · Cycle Comparison*.

### Stage 4, as built (v1.74)

- **`fydpData(src)`** — one shape for the working plan (`aceWithYear(y, cycProjOf)` per held year
  of `fydpWindow()`: `base`…`base+4` plus the year on screen) and for a locked cycle (its
  projections **as locked**, never recomputed). Funded is the lane draw, Allocated is `svcAlloc`,
  Unfunded is requirement less funded floored per service. A year not held prints — and is outside
  the FYDP totals.
- **The workbook** *📊 FYDP Spend Plan (Excel)*: By Requirement (rows with PMO, CCaR, band; per FY
  Requirement / Allocated / Funded / Unfunded; FYDP totals; `Subtotal — <PMO>`; TOTAL), By PMO
  (the subtotals and a count), By Service (with Disc BA / Mand BA). Titled with the source and the
  span; the note says which years are held and, for a cycle, when and by whom it was locked.
- **The panel** *📊 Five-year spend plan…* (FYDP Views): a source picker — the working plan, or
  any locked cycle that holds a year — the PMO subtotals and the total across the window.
- **Decision confirmed 20 Sep 2026:** requirement rows with PMO subtotals (not PMO rows only).
- **Proved by** *the five-year spend plan* (audit-recon: the year on screen against
  `boardFigures`, a second year against the engine under a swap, blank years, subtotals, TOTAL, By
  PMO, By Service, the panel, then a PB lock and a moved value the locked report must not follow),
  fourteen `fydp-*` mutations in both builds, and the trace-matrix surface *xl · FYDP Spend Plan*
  (requirement, funded, TOTAL unfunded, both pots). The verifier and the export delta build it.

### Stage 3, as built (v1.73)

- **`cycDelta(fy)`** reads the year on screen against the reference cycle's projection of the same
  year: requirement, allocation and funded per requirement (the board's own `tiers()` and
  `svcAlloc()` less the projection's), rank, band, PMO, star, NEW and REMOVED, plus the pots. The
  totals are accounted for by the rows, and the panel prints that identity.
- **On the row**, in both builds: one chip under the title, only when something changed
  (`Δ PB27 · req +$43 · rank ▲3 · ★ starred`). **In the grid's record panel**: *Since PB27*, was →
  now per figure. **The Changes panel** (🎯 Budget year → Δ Changes since PB27): totals was/now/Δ,
  the pots, every changed row sorted by the size of its funded change, the removed with their locked
  figures, and *who · when* from the journal; a pure rank change says the order is not journaled.
- **Lock, then retag.** After a lock the status offers *Retag it as BES28*; the cycles panel offers
  the same while the working tag equals the reference. `cycNextOf`: PB→BES next year, POM→BES,
  BES→PB. The reference is never touched by a retag.
- **Locking from a PMO copy** is left as it was (allowed into the copy's own store): the office
  confirmed the unlock rule as *anyone, confirmed and stamped*, and a copy's lock never merges back.
- **Proved by** *PPBE cycles — the deltas against the reference* (audit-board), thirteen
  mutations, a coverage entry for `cycDelta`, and a trace-matrix surface for the panel's 'Now'.

### Stage 2, as built (v1.72)

- **A view is the whole store set aside.** `cycView(key)` stashes `MS`, `S`, the dirty flag and
  the title, puts a deep copy on the page with the cycle's years in it, and applies the year
  through `applyState`. Every panel and export reads the lock through the ordinary path — the
  chart of accounts, the flow's plan years, the Spruills, the ACE tie-out — because `MS.years`
  *is* the lock while the view is on. No second renderer.
- **Nothing edited can look kept or reach anything durable.** `save()` and `persist()` refuse and
  put the pristine year back; `buildSavedHtml` throws; the outbound gates, `applyStore`,
  `cycLock`, retagging, the year-level mutators, the service list and the live push refuse.
  `switchYear` stays inside the cycle and refuses a year it never held. A migrated one-year cycle
  cannot be viewed and says why. A cycle that never held the year on screen opens on its first.
- **Everything says so.** A gold banner on the board with *Leave the view*, the header tag, the
  FY menu label, `document.title` (printed by several exports), every file name
  (`… [PB27 LOCKED].xlsx`), a note in the cycles panel, and *View* / *Leave view* buttons there
  and in 🎯 Budget year.
- **Leaving restores the stashed objects themselves**, so the working plan is back byte for byte,
  on the year it was on, dirty flag as it was, journal untouched.
- **Proved by** *PPBE cycles — a locked view is read-only and leaves no trace* (audit-board),
  fifteen `view-*` mutations, and a trace-matrix surface that reads all twelve quantities off the
  view and expects the engine's.

### Stage 1, as built (v1.71)

- **The store.** `CYCDB` — its own browser-storage key per appropriation (`_AP.key+'-cyc'`, so a
  PMO copy's carries the publish stamp), packed into the saved file as `cycDb.byAp[slug]`, stripped
  from a manager package by `pkgStrip`, merged on import like an approved estimate (a key not held
  is taken, a held one left alone and said). It travels into office copies with the other three
  stores rather than being withheld as proposed: copies already carry the execution store, which is
  far larger, and one rule for four stores beat two rules.
- **The lock.** `cycLock()` copies `cycWindowYears()` — `base`…`base+4` plus the year on screen,
  each only where a plan exists — whole, and projects each year from its own state through
  `aceWithYear`. A blank window year is recorded as *no plan* (the proposal's default). The entry
  carries cycle, year, base, window, note, `from` (the working tag at the time), who and when.
- **The working plan** carries `MS.cycle` and `MS.cycleRef`; locking an untagged plan tags it; the
  header shows the tag and, when they differ, the reference. The 📌 panel is now *PPBE cycles*:
  tag picker, reference picker, lock controls with the years it will take, the cycles held with the
  years each holds, and the one-year compare against the board now.
- **Unlocking** keeps its confirm and is stamped (`unlocks[]`, who and when) — **confirmed by the
  office 19 Sep 2026**, as were the cycle names (POM · BES · PB · DoN, with a note per lock) and
  the workflow the model rests on: one cycle in play at a time, each arriving at its point in the
  year, locked individually and then adjusted. Nothing in code restricts locking to the manager
  board; a copy can lock into its own store, and nothing merges that back.
- **Legacy.** A one-year baseline migrates once as a `partial` cycle; the old container goes.
- **Proved by** *PPBE cycles — the lock is the window, frozen* (audit-board), the import suite's
  intact checks (tag, reference and store into a copy), thirteen `cycle-*` mutations, a coverage
  entry for `cycProjOf`, and a trace-matrix surface that reads ask, BA, disc, mand and Funded back
  out of the lock.

### What was asked

Pull the **five-year spend plan** (the budget year plus the next four). Hold **several spend plans
per year, one per PPBE cycle**: allocate against PB27 and lock it, move to BES28 and allocate only
the deltas. **Select a cycle and see its allocations on the drill.** A five-year spend plan report
that is **selectable by cycle** and can **compare two cycles** and account for every change between
them.

### What the board already has, and where each falls short

| exists today | what it is | why it does not answer the ask |
|---|---|---|
| `MS.years[fy]`, `MS.base`…`base+4` | one full working state per fiscal year; the FYDP window; `switchYear`, `yearCopy`, the roll-forward | one plan per year. There is no notion of *which cycle* the plan on screen belongs to |
| `MS.baselines['PB\|2027']` (📌 spend-plan baselines) | ONE fiscal year's plan frozen under a cycle: reqs (ask, alloc by service, band, MC, PMO, CCaR, PID), PMO roll-up, pots, bands; locked; a compare panel vs *the board now* by PMO, plus the requirements that moved | holds one FY per cycle key, so PB27's FY28–31 have nowhere to go; the compare is one year, by PMO, against the working board only; it cannot be *viewed on the drill*; it is a projection, so panels and exports cannot read it |
| `MS.ppbe['PB\|2027']` (🏛 PPBE budget positions) | the official **funding** position by service and line per FY, per cycle | the money side, not the plan side. Stays as it is; the report can later print it beside the plan |
| 📐 Spruills | AFY…AFY+5 requirements vs funding by PMO or service across appropriations; *Budget source* = board, a PPBE position, or a one-year baseline | a reqs-vs-funding view, not the per-requirement allocation plan; the baseline source resolves one year |
| the change journal | every leaf that moved in `MS.years`, with who/when/before/after, 600 entries, skips `order` and the pots | the raw material for *accounting for changes*, not a report; not cycle-aware |
| `aceWithYear(fy, fn)` | read another year through `applyState` without moving the board, restore in `finally` | the pattern the cycle view and the report should reuse: **one renderer, no second code path** |

### The model — the recommendation

**A cycle is a locked copy of the FYDP window, and the working plan carries a cycle tag.**

- `MS.cycle` — the tag of the plan being worked (`'BES|2028'`), shown in the header beside the FY.
  `MS.cycleRef` — the locked cycle deltas are measured against (defaults to the one just locked).
- `MS.cycles[key]` — a locked plan: `{cyc, cycYr, base, years:{fy: full year state}, proj:{fy:
  projection}, ts, by, note, from, locked:true}`. **Lock** deep-copies every year in the window that
  holds state (`base`…`base+4`, and `MS.cur`) and writes the same projection `blSnapshot()` makes
  today, so comparison and Spruills stay cheap while the drill can render the real thing.
- **Legacy baselines migrate**: an existing `MS.baselines[key]` becomes `MS.cycles[key]` with
  `proj:{fy}` only and `partial:true` — comparable and reportable, not viewable on the drill. The
  📌 panel becomes the cycles panel; nothing a user has locked is lost.
- **The lifecycle is lock, then retag, then allocate.** Lock PB27 → the working plan is retagged
  BES28 with `cycleRef='PB|2027'` → ordinary allocation edits are the deltas. Nothing is copied
  *into* the working plan: it already is PB27's plan, continuing. No "delta mode" to get stuck in.
- **Viewing a cycle on the drill is a read-only mode, not a renderer.** `cycView='PB|2027'` applies
  a deep copy of that cycle's `years[MS.cur]` through `applyState`, exactly as `aceWithYear` does,
  under a banner *VIEWING PB27 (locked)*. Every edit handler is gated on it, `save()` refuses while
  it is on, and `switchYear` inside the view stays inside the cycle. Every panel and every export
  therefore reads the locked plan through the same `tiers()` they always use, and prints the cycle
  in its title. This is the single most important choice: a second "cycle renderer" would be the
  fourth parallel money path this codebase has already paid for three times.
- **Deltas are visible where the work is.** Each row shows Δ vs the reference cycle — ask, allocated,
  funded, rank, *new*, *removed* — on the card and in the grid inspector; a *Changes since PB27*
  panel lists them per year with who and when from the journal (entries newer than the lock).
- **The five-year spend plan report** — a panel and a workbook, *FYDP Spend Plan — <cycle>*. Source
  is the working plan or any locked cycle. Rows are requirements (PMO, CCaR, band); per FY in the
  cycle's own window: Requirement, Allocated, Funded (d+m), Unfunded; year totals; PMO and service
  roll-up sheets. Every figure is `tiers()` under a year swap over the chosen state set, so a year's
  Funded on the report **is** the board's Funded for that year (a trace-matrix link, not a claim).
- **Compare two cycles** (A, B; either may be *working*): the same rows with A, B and Δ per FY,
  overlapping years only, a year one cycle lacks printed as *not in <cycle>*; and a **Changes** sheet
  — per FY, per requirement: added, removed, ask changed, allocation changed, funded changed, rank
  changed, band changed, PMO moved, plus the pots — with a conservation rule the recon suite
  asserts: **Σ row deltas = the total delta, per year, per column**. That is what "account for the
  changes" means and it is the check that makes the sheet briefable.
- **Spruills** gains *cycle plan (locked)* budget sources that supply every year the cycle holds;
  the one-year baseline source remains for legacy keys. PPBE positions are unchanged.
- **Office copies never carry locked cycles** (size; not office-editable); a copy carries the
  reference projection so its rows can show Δ. Cycles live per appropriation, like `MS` does.

### Two things to settle before stage 1

1. **Storage.** A full year state on the real board is estimated at ~100–150 KB; five years × four
   cycles a year is a few MB a year of history, against a localStorage budget already shared with
   the working state, EXDB and ACEDB. Recommendation: locked cycles in their **own key**
   (`prio27cycdb`, the EXDB/ACEDB pattern) so a refusal never touches the working plan; measure the
   real size in stage 1 (`JSON.stringify(MS.years[MS.cur]).length` on the live board); if needed,
   gzip the `years` blob with the browser's native `CompressionStream` (JSON of numbers compresses
   about 5×) and keep full state for the last N cycles and projection only beyond. The file save is
   the durable path either way.
2. **Unlocking.** Today a baseline can be unlocked with a confirm. Keep that, journal it, stamp a
   re-lock with a new time — never silent — and lock only from the manager board, never a copy.

### Open decisions for the office

- Cycle tags stay `POM · BES · PB · DoN`? A free-text note per lock is proposed either way.
- Report grain: requirement rows with PMO subtotals (proposed), or PMO rows that drill down.
- Whether a lock captures blank years as *no plan* (proposed) or refuses until every window year
  holds one.
- Whether the comparison also diffs the PPBE **positions** beside the plans (later, not stage 1).

### The gate, per stage

Every stage lands the same way the rest of the board does: money-coverage entry (`exportFydpPlan`,
`via: ['fydpRows','fydpCompare']`), mutations aimed at it (funded-not-d-plus-m, compare drops a year
in one cycle only, changes sheet loses a row so Σ ≠ total, a locked cycle takes an edit, a lock
misses a window year, delta sign, wrong reference cycle), trace-matrix cells for the report's
per-FY Funded, recon blocks for the conservation rules, audit-board cases for immutability and the
view-mode write gate and the legacy migration, the round-trip fuzz taught the new containers
(`cycle`, `cycleRef`, `cycles` — a lock's years must come back byte-identical), the export delta
addressing the new sheets by name, parity on both builds.

### Stages, each gated and pushed on its own

1. Model, migration, lock across the window, the cycle tag in the header, own storage key, fuzz
   containers, immutability checks. The 📌 panel becomes *PPBE cycles*.
2. View a locked cycle on the drill: read-only mode through `applyState`, banner, selector in
   🎯 Budget year, exports titled with the cycle.
3. Δ vs reference: row chips (card and grid inspector), *Changes since* panel with journal
   attribution, the lock → retag flow.
4. FYDP Spend Plan report and workbook for one cycle; trace cells; coverage; mutations.
5. Two-cycle comparison with the Changes sheet and conservation; Spruills reads cycle plans.
6. Later: PPBE position beside the plan per FY; office copies carry the reference projection.
