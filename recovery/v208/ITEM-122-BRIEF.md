# Item 122 — edit the whole record in one box: a design brief

Written 25–26 Oct 2026 for the session that takes item 122 to Brad, from a read of `main` at `f508fdb` (v2.07), and checked
claim by claim by a second set of agents (each claim re-run against the board; behaviours tested in jsdom). **Nothing here is
approved.** Item 122 in `NEXT-VERSION.md` says *"to be worked out with Brad: which fields, whether the box replaces 📋
Requirement edit, and how it sits beside the rule that the RECORD panel is the editor."* This brief is the groundwork for that
conversation: what edits a record today, what the Add box can lend, what an edit box would collide with, the decisions with
a recommended answer each, and a test plan. Line numbers are in `prioritization-board-grid.html` at `f508fdb` and drift; find
things by symbol name.

## 1. What edits a requirement's record today

| Surface | How it writes | Notes |
|---|---|---|
| RECORD panel (`inspectorBody`) | each control applies at once (`save(); render()`) | title ✎ `editTitle`, CCaR `editCcar`, PID `editPid`, band `setBand`, By service (value `setAsk`, ↺ `resetAsk`, Disc/Mand `setFsrcSvc`, ⚙ pin `setFsrc`), BAE budget, Planning (`setMinInc`, `setAbsorber`, `setAbsorbFloor`), award schedule. Its own text inputs lose uncommitted typing on a redraw (§5 F2). |
| 📋 Requirement edit (`#recPanel`, drawn by `recBody()` from `recFields`; `toggleRec`, `recOpen`) | selects apply on change; buttons open prompts (`pickCostElem`, `wbsQuick`) | No text inputs. ↑ prev / next ↓. Cost element only where `DATA.costElems`; RCN/EEIC and SI only on O&M (`rcnApplies`, `rcnEligible`, `siEligible`). The per-service RCN/EEIC toggle (`rcnToggleSvcRow`) is drawn only here. |
| ⚠ Impact statement and 📄 Description & note pop-ups (`FLD_DEF`, `openFld`, `fldSave`) | held until Save; writes only the parts that changed (`fldSame`) | Both parts changed is **two** `save()`s (`setDesc`, then `setNote`). A redraw while open loses the typing (§5 F2). |
| WBS panel (`#wbsPanel`, `toggleWbs`, `wbsBody`) | each line applies at once | a split WBS, per service (the split lives inside `S.wbs[id]`) |
| CLIN drill (`clinTable`, inside the row) | applies at once | a prime's CLINs: number, description, CCaR, value, WBS, RCN/EEIC. **Not sent from a PMO copy** (§5 F6). |
| Classify requirements grid (`matBody`, `matBulk`) | each row's control applies at once; bulk setters over the rows shown | Draws each `recFields` control (not its note) on up to 90 rows (`MAT_CAP`); keeps the requirement's own RCN/EEIC, SI and the office move reachable. **Not** per-service RCN/EEIC (its toggle is only in Requirement edit), and its ↳ per-service columns collide with the bulk budget setter (§5 F7). |
| the row | ★ toggle; Fund's allocation box; ⋯: rename the record name (`editRecName`), ↺ reset the allocation (`resetAlloc`), copy or move to year, remove | the triage rule |
| Add box (`#addPanel`, v2.07) | drawn once, nothing written until Add, one `save()` through `reqCreate`; judged by `reqNeeds` | creates only |

## 2. Field by field

| Field | REQ_FIELD key | Edited today | In the Add box | A PMO copy sends it | `reqNeeds` asks |
|---|---|---|---|---|---|
| Plan event | `titles` | RECORD title ✎ `editTitle`: a board-data requirement → `S.titles[id]`; an added one → `it.event` | yes | a board-data requirement's: yes. **An added one's: no** (§5 F5) | yes |
| CCaR record name (title) | `recNames` | row ⋯ `editRecName`: board-data → `S.recNames[id]`; added → `it.title`. Shown read-only from the CCaR list (`ccarInspHtml`) | read-only from the list; a typed record name is carried when finishing one from another year (`AR_CARRIED`) | board-data: yes. **Added: no** (§5 F5) | no |
| CCaR record | `ccar` | RECORD `editCcar` (`codeTake`, `ccarDescFill`); a CLIN's in its drill | yes | the requirement's: yes; a CLIN's: no (§5 F6) | no |
| PID | `pid` | RECORD `editPid` | yes | yes | no |
| PMO (office) | `grp` | Requirement edit select and Classify, both `setGrp` (this fiscal year only; moves it to the bottom of the new office's ranking) | chosen once, locked | yes, as a hand-over (`pmoHomeOf`) | no |
| Prime contract / OGC | `ptype` | Requirement edit `togglePtype` (a **toggle**); Classify bulk writes `S.ptype` directly (values only from its fixed list) | yes | yes | yes |
| Obligation category | `obCat` | Requirement edit, Classify: `setObCat` | yes | yes | yes |
| Cost element | `costElem` | Requirement edit `pickCostElem` (only where `DATA.costElems`); Classify bulk writes directly (values only from `COST_ELEMS`) | yes, same gate | yes | no |
| WBS | `wbs` (its split inside it; `wbsSplit` is a registry name) | `wbsQuick` (one line) or the WBS panel; a prime's per CLIN in its drill | one line; never a prime | the requirement's own, split included: yes; a prime's per-CLIN WBS: no (§5 F6) | yes (waived for a prime) |
| RCN / EEIC | `rcnAsg` | Requirement edit, Classify (cells and bulk): `setRcnAsg`; a CLIN's in its drill. O&M only | carried from another year only | the requirement's: yes; a CLIN's: no | no |
| RCN / EEIC by service | `rcnSvc` | `setRcnSvc`, through Requirement edit's "per service…" toggle only | carried only | yes | no |
| Navy SI code | `si` | Requirement edit, Classify: `setSi` | carried only | yes | no |
| Goes to, Which awards to | `dest`, `destEnd` | Requirement edit, Classify: `setDest` | yes (awards-to only for an OGC) | yes | yes (awards-to for an OGC) |
| MIPR type | `mipr` | Requirement edit, Classify: `setMipr` | yes, OGC only | yes | yes, for an OGC |
| BAE budget | `budgetAsg` | RECORD `budLineSet`, `budUnfSet`, `setBudFam`, `budLineClear`, `budClearAll`. Classify's bulk "Budget" is never offered (no `recFields` budget field since v1.91); its ↳ per-service setters appear only through §5 F7's collision | one per service with a value, from the office's discretionary or lane-less names, written by `budPutUnf` as the RECORD panel's not-funded line writes it | yes | yes, where a name can be chosen |
| Value by service | `asks` | RECORD By service `setAsk` → `applyAskVec`; ↺ `resetAsk` (a board-data requirement back to the file's value) | yes (Spread evenly) | yes | yes (total > 0) |
| Description, Note | `desc`, `notes` | 📄 pop-up; RECORD `ccarDescUse` | yes | yes | description |
| Impact statement | `cons` | ⚠ pop-up; **also deleted by `setBand('')`** (§5 F1) | yes | yes | yes |
| Decision band | `band` | RECORD select `setBand` | no (Brad: "allocated by the SFWG"); carried when finishing one from another year | yes | no |
| Mission Critical | `mc` | row ★ | no (Brad: "Starts unstarred") | yes | no |
| Awards | `awards` | RECORD award block | no (Brad: "people are just guessing"); carried, moved forward by the year difference, for one brought in from another year | yes | no |
| CR half-month | `crHalf` | nothing since v1.94 (decides nothing; old marks cleared by `crClearOldMarks`) | no | yes (an older copy may send one) | no |
| Minimum useful increment | `minInc` | RECORD Planning `setMinInc` | carried only | yes | no |
| Shortfall absorber | — | RECORD Planning `setAbsorber`, `setAbsorbFloor` | no | not sent, and **not refused in a copy** (§5) | no |
| Disc / Mand allocation | — | RECORD By service, ⚙ pin, row Fund box, row ⋯ ↺ | no | locked (`allocLocked`) | no |

`REQ_FIELD` also holds `awardProj` (read by one mutation only) and `dn` and `rec` (the names of the 📄 and 📋 editors).

## 3. Decisions for Brad, each with a recommendation

| # | Question | Options | Recommend, and why |
|---|---|---|---|
| D1 | Which fields | (a) the record fields: everything Requirement edit holds, plus plan event, CCaR, PID, description, note, impact. Value, budgets, band, ★, awards, Planning stay where they are. (b) exactly the Add box's fields. (c) everything a PMO copy sends. | **(a)**. It follows his Add-box rulings on ★, the band and award dates. It departs from them on four fields; ask about each: the value and the budgets (in Add by his word, out here: see D4), RCN/EEIC (out of Add, "My O&M appropriation team should be allocating those"; in here through Requirement edit) and the office (locked in Add; editable here: see D8). |
| D2 | Replace or sit beside | (a) replaces 📋 Requirement edit and both pop-ups; the three status buttons stay and each opens the box at its own section. (b) a fourth button. (c) replace Requirement edit only. | **(a)**: fewer editors per field, in the spirit of his 19 Oct one-home rule (given for menu actions). Say which RECORD controls leave the panel: if its title ✎, CCaR and PID stay, those three keep two editors. Classify stays a second editor for every classification field, by design (it is the many-requirements editor). |
| D3 | How it opens | (a) the RECORD panel's buttons, plus Needs attention's Go to and the PMO hint (`pmoReassignHint`) retargeted. (b) also the row ⋯. (c) also a double-click. | **(a)**: (b) breaks the triage rule; (c) is not reachable from the keyboard and clashes with drag, selection and the rank box. |
| D4 | Money in the box | (a) neither the value by service nor budgets. (b) the value only. (c) both, as in Add. | **(a)**, with two caveats. He asked the Add box for "Service dollar requirement amounts" and "I need them to select the appropriate budget". And the box's rail would then list two required items it cannot fix (D5). A funded line's budget is per lane, which the Add box's picker cannot express. (b) or (c) also puts money on a screen: it needs a row in `tools/money-map.json` beside the Add box's (`arUpdate`, `arSpread`), cited to its check, or the gate's money map stage fails. |
| D5 | Required fields on edit | (a) warn: a rail lists what `reqNeeds` still finds missing. (b) block Save. (c) block only a copy's proposal. | **(a)**: older requirements never met the list, and blocking stops a one-field fix; a copy's proposal is still held at Submit. Under D4(a), mark the value and budgets "set in the RECORD panel", with a way there. |
| D6 | Save model | (a) a held draft, one Save, writing only the fields that changed, in one `save()`; Esc asks first; Save refuses if the requirement was removed or changed meanwhile. (b) apply each field at once. (c) mixed. | **(a)**: matches the Add box and avoids the setters that act even when nothing changed (§4). |
| D7 | PMO copy | (a) the same box, saying up front when an edit will not be sent (another office's requirement; the copy on a year it cannot submit; the renames of §5 F5 until fixed). (b) open only on the copy's own office. (c) nothing special. | **(a)**. Judge a board-data requirement by `pmoHomeOf` (its office when the copy was published; for a copy published before v1.84, its office now) and a proposal by `grpOf`, as `pmoSubmit` does, or a hand-over is wrongly called "not sent". |
| D8 | Changing the office | (a) editable, applied on Save after a confirm naming what follows: this fiscal year only; last in the new office's ranking (not journalled); N budget choices name the old office and become unusable, and where such a line is funded the Spend Plan Source refuses until it is picked again. Refused for a requirement the copy itself added. (b) locked. (c) no confirm, as today. | **(a)**. Today nothing asks before the move. "This fiscal year only" is in the select's tooltip and the PMO menu's hint, and "FY.. only, last in <office>" is said after it. The budget effect is said nowhere. |
| D9 | The record title | (a) read-only from the CCaR list; the ⋯ rename stays. (b) read-only, and the rename retired. (c) editable. | Ask. v2.07 kept the ⋯ rename as a build decision, not his; his words for Add ("Nobody should be typing in the Record Title") lean to **(b)**. The rename's own comments give two reasons to keep it (OPN, where every requirement shares one event; a rename can only add a Spend Plan Source match). |
| D10 | Goes to stops being a government activity | (a) Save clears Which awards to and the MIPR type, and `setDest` does the same, whenever the new Goes to is not an OGC by `destKeyIsOgc` (a prime, or nothing). (b) keep them, shown. | **(a)**: kept and hidden, they misfile the money and print a MIPR type against a prime (§5 F4). An "other"-kind destination is an OGC and keeps both. |
| D11 | Which "not set" count the 📋 button shows | (a) `reqNeeds` (the required list). (b) `recFields` (classification), as today. | **(a)**, and say whether it repeats the ⚠ and 📄 states. Also ask: a requirement moved to another office reads as PMO "not set" in `recFields` (since the first commit; the reason is lost with the generator). |
| D12 | Brief | Brief draws no RECORD panel, but its posture keeps Needs attention, whose Go to opens the ⚠ pop-up and Requirement edit today. Under D3(a) that route would open the box in Brief. | Decide whether it does, and test it either way. |

## 4. What carries over from the Add box, and what does not

**Reuse.**
- **`reqNeeds`** for the rail, judged on a draft read from the box's own controls (as the Add box's `arRead` does). Never
  restate the required list. **`reqDraftOf(id)`** reads the stored record: it is the state the box opens with and the
  proposal gate's, never the rail while the box holds typing. The draft needs more than `reqNeeds`' shape: CCaR, PID, cost
  element and note are read separately in `arAdd`.
- **The CCaR description rule:** fill only an empty description, or one the box filled itself (`arDescAuto`); offer the list's
  text where one is written (`ccarInspHtml`), never replace it silently.
- **Draw once and toggle on `render()`** (`arShow`/`arSync`), every field `data-held` with an id.
- **WBS:** one line in place (`codeTake`), as the Add box does. A split or a prime's WBS is shown read-only with a link to the
  WBS panel or the CLIN drill, taken from Requirement edit's `toggleWbs`/`toggleClin` buttons (the Add box shows a note only).

**Factor first, or give the edit box its own ids.** `arField` writes a fixed id (`arF_<key>`), `AR_CTL` maps keys to the Add
box's ids, `arMark` finds `.ar-f`, and `arInp`/`arSel` default to `arUpdate()`. Beyond those: `arRead`, `arUpdate`,
`arNeedIds`, `arAdd`, `arPt`, `arCcarTyped`, `arSpread` and `arBudFill` read the Add box's fixed ids (`arEvent`, `arV<i>`,
`arB<i>`, `arPtype`, `arTo`/`arEnd`/`arMipr`, `arWbs`, `arRecT`, `arChk`, `arAddBtn`…), and the Prime/OGC switch, the
record-title line and the value/budget table are written inline in `arDraw`. A forked second form drifts, as the two builds
did before v1.88.

**Not reusable.**
- **`reqCreate`.** It mints an id, pushes to the order and rankings, seeds a Split, and writes several fields raw: `put()`
  skips the OB_CATS, COST_ELEMS, PRIME/OGC, flowEnt and MIPR_LBL checks. On an existing requirement it would replace a split
  WBS with one line, and write the plan event to `it.event` where a board-data requirement keeps a rename in `S.titles`.
- Add-only parts: the office lock, From another year and its queue, the landing summary, *Add and open its record*.

**Write one edit writer** (for example `reqApply(id, changes)`): the setters' checks without their own `save()`/`render()`,
only the fields that changed, then one `save()` and one `render()`. Four setters do something even when the value has not
changed:
- `setGrp` moves the requirement to the bottom of its office's ranking, unjournalled (§5 F3);
- `togglePtype` toggles;
- `setSi` with a value equal to the derived code deletes the stored one, so the code then follows later changes;
- `editCcar` re-entered with the same number fills an empty description from the CCaR list (`ccarDescFill`).

## 5. Defects found while mapping this (all older than v2.07)

Reproduced in jsdom on `f508fdb` by `node recovery/v208/repro/found-on-main.mjs`, which prints PRESENT or GONE for each.
F1–F4 were found by the item 122 audit, F5–F7 by the handoff's claim-by-claim check. Each fix needs Brad's go, its own check
and a mutation; F4 belongs in `math-defects.json` beside `bulk-write-where-the-field-is-not-offered`.

| # | Defect | Severity | Fix to propose |
|---|---|---|---|
| F1 | Clearing the decision band deletes the impact statement (`setBand('')` also deletes `S.cons[id]`, since the first commit). A statement whose saved form runs past 300 characters (`JRNL_BIG`; about 299 typed) is journalled as its size, so the journal cannot put it back. No check covers it. | data loss | Clearing the band leaves the statement (it is no longer band-gated). |
| F2 | A redraw replaces typing not yet committed: in the ⚠ and 📄 pop-ups (`fldBody`) and in the RECORD panel's own fields (value by service, Disc/Mand, minimum increment, absorber floor). With Live view on, every tick redraws (`liveTick` → `livePoll` → `render()`, on success and on failure): every 30 s by default, settable from 10 to 600 s. The redraw is measured; the tick is read from the code. It is ledger **U35**'s class (the RCN/EEIC registry, deferred as P2 on 13 Oct). | data loss while Live view is on | Draw an open box's fields only when it opens (the Add box's rule), or skip the redraw while it holds typing. Fix and rate with U35. Item 122's box must be built this way from the start. |
| F3 | `setGrp` moves a requirement to the bottom of its office's ranking even when the office is unchanged, unjournalled, while saying "… is already in <office>". Reached through Classify's bulk PMO set, which re-ranks every row already in the office into the listing order while its confirm calls them "already say exactly this"; and in Chromium by arrowing through Requirement edit's PMO select, which commits each office in turn. | silent re-ranking; words untrue | `setGrp` does nothing when the office is unchanged; the bulk set skips rows already set. |
| F4 | Changing Goes to from a government activity to a prime, or clearing it, keeps Which awards to and the MIPR type, which Requirement edit then stops showing and nothing can clear. `destEndOf` still names the old second hop: the funds flow by final destination (chart and export) files the prime's money there (measured: $100 under Lockheed Martin by final destination, Pratt & Whitney by first); the 🎯 Priority Drill prints the MIPR type against the prime; a submittal and a year copy carry both. When cleared, `setDest`'s own message says the requirement "counts under not yet assigned". | money filed under the wrong destination | D10. |
| F5 | In a PMO copy, renaming the plan event or the record name of a requirement **the portfolio board added** is shown on the copy and never sent: the renames go to `it.event`/`it.title`, the submittal reads `S.titles`/`S.recNames`, and the requirement is in the copy's baseline so it is not a proposal either. The office is told nothing. A board-data requirement's renames are sent. | an office's input silently dropped | Send an added requirement's event and title as fields (or store its renames where `pmoVal` reads them), with a round-trip check. |
| F6 | In a PMO copy, a prime's CLIN drill is open for editing (add a CLIN; its number, description, CCaR, WBS, RCN/EEIC) and none of it is sent: no `clin*` container is in `PMO_FIELDS`, and the drill's writers carry no copy lock or notice. | an office's input silently dropped | Either send the CLIN containers (a `PMO_PV` change), or lock the drill in a copy and say why. Brad's call. |
| F7 | Classify's per-service RCN/EEIC columns (↳ USAF…, shown once a requirement's per-service rows are opened in Requirement edit) share their label with the bulk per-service BAE budget setter: a bulk set of "↳ USAF" offers budget names and writes `S.budgetAsg` on every row shown, not RCN/EEIC. | a bulk write to the wrong field | Key `matBulk` entries by field key, not label (they are hard-coded labels today, so a renamed label also drops its bulk setter). |

Also, found by reading and confirmed in the code, not run as a defect:
- `setAbsorber` and `setAbsorbFloor` are not refused in a PMO copy (no `allocLocked`; the copy's CSS does not hide the box),
  although the `PMO_FIELDS` comment says `allocLocked` refuses the absorber. In a copy only the ⚑ ABSORBING memo and the
  absorb line change; no lane figure moves; nothing is sent.
- Classify's bulk Prime/OGC and cost-element entries write `S.ptype`/`S.costElem` directly, not through a setter. Their
  values come only from the lists offered, so nothing unchecked is reachable today; it matters once item 122's writer is
  where the checks live.
- `matBulk()` is keyed by hard-coded labels while `matCols()` reads `FL()`, so a renamed label drops that field's bulk setter
  (`matBulkOk()` then names it). `matCols`/`matRows` compare live labels with each other, against v2.03's keys rule.

## 6. Collisions to plan for

- **The triage rule and `npm run controls`.** The rule's wording is Brad's, approved word for word (30 Sep, v1.91 item 32),
  and kept identically in `CLAUDE.md` (*The row is triage*), `AGENTS.md` and the comment in `render()` (~line 27265): any
  change goes to him and lands in all three in one commit. `tools/row-controls.json` was last recorded at v2.00. Re-record
  it with `--record` and say why; any opener added to the row fails as NOT RECORDED, by design.
- **The box controller.** A box is `body > .modal-bg[id]` with a `.modal` child, a unique id, an `<h3>` and a close control
  (`npm run check`). Esc asks before losing a field only if the field has both `data-held` and an id (`dlgSnap` reads
  `[data-held][id]` when the box opens). Requirement edit's ↑ prev / next ↓ would throw a held draft away: ask first, as the
  Add box does before replacing typing.
- **`let`s that `render()` or `syncBtns()` read** go beside `let MS`, as the Add box's do.
- **The journal.** One Save, one `save()`, one capture: one entry per changed **path** (Goes to and Which awards to are two;
  each WBS line is one), and the same path re-edited within a minute joins its entry (`JRNL_JOIN`). An office change's
  re-ranking (`S.pmoOrder`) is in `JRNL_SKIP` and never journalled.
- **PMO copy.** No allocation control in the box; anything that ever enters must call `allocLocked` and use a handler the
  copy's CSS matches.
- **Locked cycle.** Refuse to open or save through `cycBlock`.
- **Nothing new travels** in a file unless a new field is added; then it needs a `REQ_FIELD` entry first, a place on
  `REQ_MAPS` if it is kept per requirement (`yearCopy`, `reqPurge`, `newReqSeq`), a fill in the round-trip fuzz's
  `populate()`, and the `PMO_FIELDS`/`PMO_PV` and import-door rules.
- **`recFields` stays the registry**: the Classify grid, the proposal gate (`reqDraftOf`) and several mutations read it.
- **The words.** The in-file guide names today's editors (`helpDoc`: the written-fields paragraphs near lines 2049 and 2199,
  the PMO-copy table near 2083, twelve `data-fl` references), and so do `pmoReassignHint`'s alert and the PMO menu's hint.
  Rewrite them in the same commit; the web guide and the PDF are made from the same text. `npm run menus` checks only paths
  and buttons, not this prose.

**Checks pinned to today's editors** (grep the suites for the old labels before running anything):
`editors-reachable.mjs` (the three labels); `check.mjs` (REQ_FIELD `cons`/`dn`/`rec`); audit-board *the pop-up editor*, the
recHead check and *impact is always reachable*; audit-other *v1.93 — every box: named, inert behind, Esc closes, typing
guarded* and *v1.93 — Needs attention: every entry opens its list*; audit-import *v1.95 — the journal keeps fiscal years
apart* and *v2.00 (U19) — put back after a board-file save keeps what it replaces*; audit-recon's SI tests through `#recBody`
(about lines 4984–5289); audit-inject's A6 `recFields` source pins; `panels-render.mjs` (fldPanel, recPanel);
`dialogs-keyboard.mjs` (fldClose, recOpen → toggleRec); layout-fits J (the three `.insp-act`); `hostile.mjs` (its pop-up loop
still uses the retired kinds `desc` and `notes`, so the 📄 pop-up is never swept); `ia-shots.mjs`.

**Mutations pinned to them**, to retarget in the same commit, then recount with `mcount.py`: `fld-save-drops-edit`,
`fld-dn-*`, `fld-impact-old-name`, `fld-stale-stays-open`, `impact-band-gated`, `att-go-not-selected`, `draw-rec-office`,
`v203-20-*`, `second-hop-gov-only`, `v198-record-ignores-clins`, `v200-destkey-*`, `v200-u44-end-picker-every`; the SI ones
`v200-u41-goto-row-only` (the `attGo('si')` find), `v200-u41-field-shows-none`, `v200-u57-record-raw-string`,
`v200-u57-option-value-blank` (and re-check every `v200-u41-*` whose catch reads `#recBody`); and the setter mutations a
shared writer would move: `mipr-takes-anything`, `v200-u41-view-says-none`, `v204-108-no-fill`, `v204-108-desc-overwrites`,
`v199-pid-text-dropped`.

## 7. Test plan sketch

- **audit-other**, *v2.08 — edit the whole record in one box (item 122)*, through the rendered controls: each field opens with
  its value; Save writes exactly the changed fields (S diffed); one `save()` and one capture; an unchanged office leaves the
  ranking byte-identical; prime/OGC set, not toggled; a board-data requirement's plan event goes to `S.titles`; the CCaR
  description fills only an empty one, and re-entering the same CCaR changes nothing; a code over its limit is refused and kept
  in the box; a split WBS kept; OGC fields shown, hidden and cleared per D10; Esc and Cancel write nothing; a `render()` while
  open keeps the typing; the rail equals `reqNeeds` on the box's draft as typed; a locked cycle refuses; a requirement removed
  while open refuses on Save. Migrate the two v1.93 blocks.
- **audit-import**, a PMO copy: edits travel as deltas for the copy's own office; another office's requirement said up front and
  named at Submit; a hand-over judged by `pmoHomeOf`; an added requirement's renames sent (F5); no allocation control; another
  year says edits cannot be sent; submit → review → apply equals typing; an office named with an apostrophe (anything minted
  passes the door). Migrate the v1.95 journal and v2.00 U19 blocks.
- **audit-board**: F1, F3, F4 (and F7) checks if approved; F2's own check on the ⚠ and 📄 pop-ups and the RECORD panel's
  fields if they stay; the migrated pop-up checks.
- **audit-hostile / hostile.mjs**: sweep the box with hostile office, destination, budget, cost element, RCN and SI values; fix
  the dead `desc`/`notes` pop-up kinds.
- **Browser.** `controls` (re-recorded), `editors`, `panels`, `menus` and `hostile` run inside `verify:grid` before `layout`.
  Run `keys` (a new N section), `dialogs` (an opener; Esc asks on every field) and `standards` (open the box) by hand: keys and
  dialogs come after layout, whose carried D ×8 stops the chain, and standards is not in it. `layout` N: the box whole at
  1366 × 657 and 1920 × 969, Harbor and Midnight, both fonts, one column below; K still passes.
- **Mutations** `v208-122-*`, single-quoted ids (`money-coverage.mjs` reads only that form), each proved against its own
  block with `recovery/v208/bin/prove.py`, which runs the block on the unmutated board first (a block that reads another's
  top-level `let` fails there, and would catch every mutant): write-unchanged office,
  ptype toggles, band clears impact, split WBS overwritten, board event to `it.event`, description overwritten by CCaR, field
  not held, a save per field, redraw while open, prev/next discards, copy foreign silent, copy proposal office moved, copy
  other year silent, added-requirement rename not sent, allocation in the box unlocked, cycle not blocked, rail not `reqNeeds`,
  removed under the box saves.
