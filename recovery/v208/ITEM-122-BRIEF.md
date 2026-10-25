# Item 122 — edit the whole record in one box: a design brief

Written 25 Oct 2026 for the session that takes item 122 to Brad, from a read of `main` at `f508fdb` (v2.07). **Nothing here
is approved.** Item 122 in `NEXT-VERSION.md` says *"to be worked out with Brad: which fields, whether the box replaces 📋
Requirement edit, and how it sits beside the rule that the RECORD panel is the editor."* This brief is the groundwork for
that conversation: what edits a record today, what the Add box can lend, what an edit box would collide with, the
decisions with a recommended answer each, and a test plan. Line numbers are in `prioritization-board-grid.html` at
`f508fdb`; find things by symbol name.

## 1. What edits a requirement's record today

Six surfaces, and the Add box is the odd one out:

| Surface | How it writes | Notes |
|---|---|---|
| RECORD panel (`inspectorBody`) | each control applies at once (`save(); render()`) | title ✎, CCaR, PID, band, By service (value, Disc, Mand), BAE budget, Planning, award schedule |
| 📋 Requirement edit (`recPanel`, built from `recFields`) | each control applies at once | the classification fields; ↑ prev / next ↓ |
| ⚠ Impact statement and 📄 Description & note pop-ups (`FLD_DEF`, `openFld`, `fldSave`) | held until Save; writes only the parts that changed (`fldSame`) | Description & note with both changed is **two** `save()`s (setDesc, then setNote) |
| Classify requirements grid (`matBody`, `matBulk`) | every `recFields` control on every row, plus bulk setters | the bulk editor for many requirements; keeps RCN/EEIC, SI and the office move alive whatever happens to Requirement edit |
| the row | ★ toggle; Fund's allocation box; ⋯ lifecycle actions (rename the record name, copy/move to year, remove) | the triage rule |
| Add box (`#addPanel`, v2.07) | drawn once, nothing written until Add, one `save()` through `reqCreate`; judged by `reqNeeds` | creates only |

## 2. Field by field

| Field | REQ_FIELD key | Edited today | In the Add box | PMO copy may edit | `reqNeeds` asks |
|---|---|---|---|---|---|
| Plan event | `titles` | RECORD title ✎ `editTitle` (a board requirement → `S.titles[id]`; an added one → `it.event`) | yes | yes | yes |
| CCaR record name (title) | `recNames` | row ⋯ `editRecName`; shown read-only from the CCaR list (`ccarInspHtml`) | read-only, from the list | yes | no |
| CCaR record | `ccar` | RECORD `editCcar` (`codeTake`, `ccarDescFill`) | yes | yes | no |
| PID | `pid` | RECORD `editPid` | yes | yes | no |
| PMO (office) | `grp` | Requirement edit select / Classify `setGrp` (this fiscal year only; moves it to the bottom of the new office's ranking) | chosen once, locked | yes (as a hand-over, `pmoHomeOf`) | no |
| Prime contract / OGC | `ptype` | Requirement edit `togglePtype` (a **toggle**); Classify bulk writes `S.ptype` directly | yes | yes | yes |
| Obligation category | `obCat` | Requirement edit / Classify `setObCat` | yes | yes | yes |
| Cost element | `costElem` | Requirement edit `pickCostElem`; Classify bulk writes directly | yes | yes | no |
| WBS (and its split) | `wbs`, `wbsSplit` | `wbsQuick` (one line) or the WBS panel; a prime's in its CLIN drill | one line; never a prime | yes | yes (waived for a prime) |
| RCN / EEIC (and by service) | `rcnAsg`, `rcnSvc` | Requirement edit / Classify `setRcnAsg`, `setRcnSvc`; a CLIN's in its drill | carried from another year only | yes | no |
| Navy SI code | `si` | Requirement edit / Classify `setSi` | carried only | yes | no |
| Goes to, Which awards to | `dest`, `destEnd` | Requirement edit / Classify `setDest` | yes (OGC only for awards-to) | yes | yes (awards-to for an OGC) |
| MIPR type | `mipr` | Requirement edit / Classify `setMipr` | yes, OGC only | yes | yes, for an OGC |
| BAE budget | `budgetAsg` | RECORD `budLineSet`, `budUnfSet`, `setBudFam`, `budLineClear`, `budClearAll`; Classify bulk `setBudFam`, `setBudAsg` | not-funded line only, through `budPutUnf` | yes | yes, where a name can be chosen |
| Value by service | `asks` | RECORD By service `setAsk` → `applyAskVec` | yes (Spread evenly) | yes | yes (total > 0) |
| Description, Note | `desc`, `notes` | 📄 pop-up; RECORD `ccarDescUse` | yes | yes | description |
| Impact statement | `cons` | ⚠ pop-up; **also deleted by `setBand('')`** (§5 F1) | yes | yes | yes |
| Decision band | `band` | RECORD select `setBand` | no (Brad: the SFWG sets it); carried when finishing one from another year | yes | no |
| Mission Critical | `mc` | row ★ | no (Brad: starts unstarred) | yes | no |
| Awards | `awards` | RECORD award block | no (Brad: guesses this far out) | yes | no |
| Minimum useful increment | `minInc` | RECORD Planning | carried only | yes | no |
| Absorber | — | RECORD Planning `setAbsorber` | no | **not refused in a copy** (§5) | no |
| Disc / Mand allocation | — | RECORD By service, row Fund box | no | locked (`allocLocked`) | no |

`REQ_FIELD` also has `awardProj`, which no board code reads (one mutation does).

## 3. Decisions for Brad, each with a recommendation

| # | Question | Options | Recommend, and why |
|---|---|---|---|
| D1 | Which fields | (a) the record fields: everything Requirement edit holds, plus plan event, CCaR, PID, description, note, impact. Value, budgets, band, ★, awards, Planning stay where they are. (b) exactly the Add box's fields. (c) everything a PMO copy may edit. | **(a)**: it follows his Add-box rulings field by field. |
| D2 | Replace or sit beside | (a) replaces 📋 Requirement edit and both pop-ups; the three status buttons stay and each opens the box at its own section. (b) a fourth button. (c) replace Requirement edit only. | **(a)**: one editor per field (his 19 Oct rule), and the at-a-glance state from item 12 stays. Classify stays as the many-requirements editor. |
| D3 | How it opens | (a) the RECORD panel's buttons, plus Needs attention's Go to and the PMO hint retargeted. (b) also the row ⋯. (c) also a double-click. | **(a)**: (b) breaks the triage rule; (c) is not reachable from the keyboard and clashes with drag, selection and the rank box. |
| D4 | Money in the box | (a) neither the value by service nor budgets. (b) the value only. (c) both, as in Add. | **(a)**, with the honest caveat: his 30 Sep one-place budget rule already has two other writers (Classify bulk and the Add box), and he asked the Add box for "all the main information". A funded line's budget is per lane, which the Add box's picker cannot express. |
| D5 | Required fields on edit | (a) warn: a rail lists what `reqNeeds` still finds missing. (b) block Save. (c) block only a copy's proposal. | **(a)**: older requirements never met the list; blocking stops a one-field fix. A copy's proposal is still held at Submit. |
| D6 | Save model | (a) a held draft, one Save, writing only the fields that changed, in one `save()`; Esc asks first; Save refuses if the requirement was removed or changed meanwhile. (b) apply each field at once. (c) mixed. | **(a)**: matches the Add box and avoids the setters that act even when nothing changed (§4). |
| D7 | PMO copy | (a) the same box, saying up front when an edit will not be sent (another office's requirement, or the copy on a year it cannot submit). (b) open only on the copy's own office. (c) nothing special. | **(a)**. Judge a board requirement by `pmoHomeOf` (its office when the copy was published) and a proposal by `grpOf`, as `pmoSubmit` does, or a hand-over is wrongly called "not sent". |
| D8 | Changing the office | (a) editable, applied on Save after a confirm naming what follows: this fiscal year only; last in the new office's ranking; N budget choices become unusable and the Spend Plan Source refuses until they are picked again. Refused for a requirement the copy itself added. (b) locked. (c) no confirm, as today. | **(a)**: none of those side effects is said on screen today. |
| D9 | The record title | (a) read-only from the CCaR list; the ⋯ rename stays. (b) read-only and the rename retired. (c) editable. | **(a)**, which is what he kept in v2.07; ask whether he now wants (b). |
| D10 | Goes to changes from a government activity to a prime | (a) Save clears Which awards to and MIPR type (as Add does) and `setDest` does the same. (b) keep them, shown. | **(a)**: kept and hidden, they misfile the prime's money in the funds flow by final destination (§5 F4). |
| D11 | Which "not set" count the 📋 button shows | (a) `reqNeeds` (the required list). (b) `recFields` (classification), as today. | **(a)**. Also ask: a requirement moved to another office reads as PMO "not set" in `recFields` (since the first commit, reason unknown). |

## 4. What carries over from the Add box, and what does not

**Reuse.**
- `reqNeeds` and `reqDraftOf` for the rail. Never restate the required list. The draft needs more than `reqNeeds`' shape:
  CCaR, PID, cost element and note are read separately in `arAdd`.
- The CCaR description rule: fill only an empty description, or one the box filled itself (`arDescAuto`); offer the
  list's text where one is written (`ccarInspHtml`), never replace it silently.
- Draw once and toggle on `render()` (`arShow`/`arSync`). Every field `data-held`.
- WBS: one line in place (`codeTake`); a split or a prime's shown read-only with a link to the WBS panel or the CLIN drill.

**Factor first.** `arField` writes a fixed id (`arF_<key>`), `AR_CTL` maps keys to the Add box's ids, `arMark` finds
`.ar-f`, and `arInp`/`arSel` default to `arUpdate()`. Factor the section builders so Add and Edit draw the same controls from
one place; a forked second form drifts, as the two builds did before v1.88.

**Not reusable.**
- `reqCreate`. It mints an id, pushes to the order and rankings, seeds a Split, and writes several fields raw (`put()`
  skips the OB_CATS, flowEnt and MIPR_LBL checks). On an existing requirement it would replace a split WBS with one line,
  and write the plan event to `it.event` when a board requirement keeps a rename in `S.titles`.
- Add-only parts: the office lock, From another year and its queue, the landing summary, *Add and open its record*.

**Write one edit writer** (for example `reqApply(id, changes)`): the setters' checks without their own `save()`/`render()`,
only the fields that changed, then one `save()` and one `render()`. Three setters do something even when the value has
not changed:
- `setGrp` moves the requirement to the bottom of its office's ranking, unjournalled (§5 F3);
- `togglePtype` toggles;
- `setSi` with a value equal to the derived code deletes the stored one, so the code then follows later changes.

## 5. Defects found while mapping this (all older than v2.07)

Reproduced in jsdom on `f508fdb` by `recovery/v208/repro/found-on-main.mjs`, which prints PRESENT or GONE for each. Each
fix needs Brad's go and its own check and mutation.

| # | Defect | Severity | Fix to propose |
|---|---|---|---|
| F1 | Clearing the decision band deletes the impact statement (`setBand('')` also deletes `S.cons[id]`, since the first commit). A statement over 300 characters is journalled as its size, so the journal cannot put it back. No suite or mutation covers it. | data loss | Clearing the band leaves the statement (it is no longer band-gated). |
| F2 | A `render()` while the ⚠ or 📄 pop-up is open replaces what was typed with what is stored (`fldBody` rebuilds the textarea). With Live view on in shared-folder mode every tick calls `render()` (`liveTick` → `livePoll`; at least every 10 s, 30 by default). The redraw is measured; the tick is read from the code, not run against a real folder. Requirement edit's text inputs are rebuilt the same way. | data loss while Live view is on | Draw an open box's fields only when it opens (the Add box's rule), or skip the redraw while it holds typing. Item 122's box must be built this way from the start. |
| F3 | Setting a requirement's office to the office it is already in moves it to the bottom of that office's ranking, unjournalled. Classify's bulk PMO set does it to every row already in the office. | silent re-ranking | `setGrp` does nothing when the office is unchanged. |
| F4 | Changing Goes to from a government activity to a prime keeps Which awards to and the MIPR type, which the panel then hides; `destEndOf` still names the old second hop, and the funds flow by final destination (chart and export) files the prime's money there. | money filed under the wrong destination | Clear both in `setDest` when the new destination is not a government activity (D10). |

Also found by reading, not reproduced: `setAbsorber` is not refused in a PMO copy (the copy's figures move and the change is
never sent); Classify's bulk Prime/OGC and cost-element setters write with no check; `matCols`/`matRows` match fields by
label, against v2.03's rule that code compares keys, so a renamed label would empty the grid's missing-field filter.

## 6. Collisions to plan for

- **The triage rule and `npm run controls`.** `tools/row-controls.json` was last recorded at v2.00. Re-record it with
  `--record` and say why; any opener added to the row fails as NOT RECORDED, by design.
- **The box controller.** A box is `body > .modal-bg[id]` with an `<h3>` and a close control (`npm run check`). Esc asks
  before losing a `data-held` field. Requirement edit's ↑ prev / next ↓ would throw a held draft away: ask first, as the
  Add box does before replacing typing.
- **`let`s that `render()` or `syncBtns()` read** go beside `let MS`, as the Add box's do (the BANDS_STD rule).
- **The journal.** One Save, one `save()`, one capture: one entry per changed field. Values over 300 characters are
  journalled as their size.
- **PMO copy.** No allocation control in the box; anything that ever enters must call `allocLocked` and use a handler the
  copy's CSS matches.
- **Locked cycle.** Refuse to open or save through `cycBlock`. Brief draws no RECORD panel, so it has no opener.
- **Nothing new travels** in a file unless a new field is added; then it needs a `REQ_FIELD` entry first, and the
  `PMO_FIELDS`/`PMO_PV` and import-door rules apply.
- **`recFields` stays the registry**: the Classify grid, the proposal gate (`reqDraftOf`) and several mutations read it.

**Checks and mutations pinned to today's editors**, to migrate in the same commit (grep the suites for the old labels
first):
- Checks: `editors-reachable.mjs` (the three labels), `check.mjs` (REQ_FIELD `cons`/`dn`/`rec`), audit-board *the pop-up
  editor* and the recHead check, audit-recon's SI tests through `#recBody` (to about line 5289), `attGo('si')`,
  `panels-render.mjs` (fldPanel), `dialogs-keyboard.mjs` (fldClose), `hostile.mjs` (its pop-up loop still uses the retired
  kinds `desc` and `notes`, so the 📄 pop-up is never swept), `ia-shots.mjs`.
- Mutations: `fld-save-drops-edit`, `fld-dn-*`, `fld-impact-old-name`, `fld-stale-stays-open`, `impact-band-gated`,
  `v203-20-*`, the `attGo('si')` find, `second-hop-gov-only`, `v198-record-ignores-clins`, `v200-destkey-*`, the
  `v200-u41`/`u57` SI ids, `v200-u44-end-picker-every`. Recount with `mcount.py` after every change.

## 7. Test plan sketch

- **audit-other**, *v2.08 — edit the whole record in one box (item 122)*, through the rendered controls: each field
  opens with its value; Save writes exactly the changed fields (S diffed); one `save()` and one capture; an unchanged office
  leaves the ranking byte-identical; prime/OGC set, not toggled; a board requirement's plan event goes to `S.titles`; the CCaR
  description fills only an empty one; a code over its limit is refused and kept in the box; a split WBS kept; OGC fields
  shown, hidden and cleared per D10; Esc and Cancel write nothing; a `render()` while open keeps the typing (F2); the rail
  equals `reqNeeds(reqDraftOf(id))`; a locked cycle refuses; a requirement removed while open refuses on Save.
- **audit-import**, a PMO copy: edits travel as deltas for the copy's own office; another office's requirement said up
  front and named at Submit; a hand-over judged by `pmoHomeOf`; no allocation control; another year says edits cannot be
  sent; submit → review → apply equals typing; an office named with an apostrophe (anything minted passes the door).
- **audit-board**: F1, F3 and F4's checks if approved; the migrated pop-up checks.
- **audit-hostile / hostile.mjs**: sweep the box with hostile office, destination, budget, cost element, RCN and SI values;
  fix the dead `desc`/`notes` pop-up kinds.
- **Browser**, each by hand (`verify:grid` stops at `layout`): `controls` re-recorded; `dialogs` (an opener; Esc asks on
  every field); `keys` N; `layout` N (whole at 1366 × 657 and 1920 × 969, Harbor and Midnight, both fonts, one column
  below) with K still passing; `editors`, `panels`, `standards` (open the box), `menus`, `hostile`.
- **Mutations** `v208-122-*`, each proved against its own block with `recovery/v208/bin/prove.py`: write-unchanged office,
  ptype toggles, band clears impact, split WBS overwritten, board event to `it.event`, description overwritten by CCaR,
  field not held, a save per field, redraw while open, prev/next discards, copy foreign silent, copy proposal office moved,
  copy other year silent, allocation in the box unlocked, cycle not blocked, rail not `reqNeeds`, removed under the box saves.
