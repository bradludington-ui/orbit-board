# Backlog — agreed but not built

Changes the portfolio office has asked for, recorded here so they survive a session.
**Nothing in this file has been applied.** Each entry is written to be picked up cold.

Decisions below are settled unless an entry says otherwise. Where a decision closes off a
trap the codebase has already fallen into once, the entry says which.

---

## 1. A PMO copy must be able to propose a NEW requirement

**Asked 14 Sep 2026 · decisions settled · not started**

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

> **Gap to close when building:** `S.dest[id]` holds `.to` (first hop) and `.end` (ultimate
> recipient), but the "Which awards to" control is offered **only when the destination's kind
> is `gov`**. An `Other`-kind destination has no second-hop control at all today, so the rule
> cannot be satisfied there. The control has to be offered for every non-prime kind.

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

**Asked 14 Sep 2026 · decisions settled · not started**

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

---

## 3. Make band and impact editable in the right-hand panel

**Asked 14 Sep 2026 · not started**

The band assignment shows in the requirement listing and is editable there, and it also shows
in the right-hand panel — but read-only. Make it **editable in the panel**. Same for
**Impact**.

Pairs with entries 5 and 6: as editing moves to the panel, the row keeps the band as a
*badge*, not a control.

---

## 4. Remove the Low / Medium / High tier

**Asked 14 Sep 2026 · not started**

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

**Asked 14 Sep 2026 · decisions settled · not started**

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

**Asked 14 Sep 2026 · not started**

Today the panel's **Open on the row** group has three chips — 📝 Note, 📄 Description,
📋 Record — calling `toggleNote()`, `toggleDesc()`, `toggleRec()`, which open editors **on the
row**.

Wanted:

- Each opens a **pop-up window** for the edit instead of expanding the row.
- Reachable **from the right-hand panel only** — not from the row.
- **Move Impact down into this group**, so the group is Note · Description · Record · Impact.

> Watch, twice over: `npm run editors` (`tools/editors-reachable.mjs`) asserts every editor is
> reachable at every width, and `npm run panels` (`tools/panels-render.mjs`) asserts every
> panel opens and is covered. New pop-ups must be added to `panels-render.mjs` — a panel with
> no entry there fails the sweep rather than being skipped, which is the point. And per
> CLAUDE.md, a chip that looks clickable must key its affordance off `[onclick]`, so removing
> the row route must remove the row affordance with it.
