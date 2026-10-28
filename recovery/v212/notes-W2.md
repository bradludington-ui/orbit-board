# v2.12 W2 — item 132's requirements: a WBS paragraph is picked from the estimate, and goes everywhere it is owed

Built on branch `v212-w2` from the slot commit `d732259`, to `recovery/v212/contract.md` § "W2 -- item 132's requirements".
The WBS tree is read only through the slot commit's readers (`aceWbsMap`, `aceWbsNode`, `aceWbsPath`, `wbsPickKey`); every
check builds its own `ACEDB` set carrying `set.wbs[ap][CODE]={n,lv,up}` by hand, so nothing here waits on W1's import.
`BUILD` is not bumped (integration does it).

## What was built

**One list, one rule** (beside `wbsLabel`, `// ---- v2.12 (item 132)` block):

- `wbsPick(ap)` → `{k, ap, codes, has, path, name}`: the paragraphs of the estimate `wbsPickKey(ap)` names, in the estimate's
  own order (`wbsCmp`: P6.2 before P6.10, P6.2.2 before P6.2.2.1 before P6.2.2E), each with its path (`aceWbsPath`) and own
  name. Maps without a prototype. Cached per tree object (a `WeakMap`), so an import that replaces the tree is seen at once.
  A key not written as `aceNormWbs` writes a code is not offered (`aceWbsNode` could not find it).
- `wbsTake(val, P)` — THE rule for a paragraph typed or picked anywhere: blank clears; no estimate names this appropriation
  → `codeTake` (as before v2.12); a code the list holds (read by `wbsCodeIn`: the text before a spaced dash, normalised) →
  stored as the estimate writes it; anything else refused: *The WBS “9.9” is not a paragraph of the 2026ACE estimate for O&M;
  pick one from its list. Nothing was changed* — the length refusal first, as `codeTake`.
- `wbsPickedIn(el)`: a pick puts the option's "code — path" in the field; the field then holds the code alone (only text in
  the picker's own form is shortened, never a code being typed under the caret).
- `wbsFieldSay(text, P, ccar, kept)`: what a field says beside itself — the paragraph's name (`CODE — path`); *⚠ X is not a
  paragraph of the … — kept as stored; pick one to replace it* for a stored one the list does not hold; *⚠ Not a paragraph of
  the … — pick one from the list* for one being typed; *No cost estimate names O&M’s WBS paragraphs: the paragraph is taken as
  typed*; and the suggestions.
- `wbsSuggest(ccar, P)`: the paragraphs of the estimate's lines (this appropriation's) whose `ccar` is the requirement's CCaR
  record (case-insensitive), only ones the list holds. First in every list, `label="suggested — on CCaR X"`. Never set.
- `wbsUnlisted`, `wbsPathOf`, `wbsStateOf(id)` (a prime's per CLIN: WITHOUT a WBS while any CLIN carrying money has none, or
  while no CLIN has one; `wbsClinMoneyRO` reads the CLIN's allocation, else its request, creating nothing), `wbsUnlistedOf`.

**The four pickers** — each a text input with a `<datalist>` of "code — path", so the box controller, the F2 hold and the
keyboard work as they did:

- **WBS panel** (`wbsBody`): every line's paragraph field reads `#wbsDl`; the name (or the flag) under each line (`.wbsnm`);
  the source and the suggestions in a hint; `wbsSetNum` judges a changed line by `wbsTake` and takes an unchanged stored one
  back as it is. The table is `fctab wbstab` with a `<colgroup>`, and the box is 1000px wide: the code was cut and the name
  ran one word to a line at 760.
- **Add box** `#arWbs` (`arWbsTake`, `arWbsCc`): list, name in `#arWbsNote`, refusal on Add with the text kept and the field
  marked; the codes loop reads the WBS through `arWbsTake` (a picked "code — path" is over 40 characters). A requirement
  brought in from another year keeps its WBS as carried (`arFin.wbsFrom`).
- **Edit box** `#erWbs`: now FIRST OF THE ACCOUNTING LINES in the middle column, its name on the label's line
  (`.er-wbsl`); the **Navy SI code moved to Classification** in the first column to make the room (see Decided). `erRead`
  normalises a pick; `erSave` refuses a changed WBS by `wbsTake` with the typing kept and the keyboard back on the field; a
  split shows its paragraphs and flags the ones not in the estimate (`erUpdate`).
- **Quick box** (`wbsQuick`, reached from Classify's WBS cell): `uiPrompt(msg, def, cb, o)` takes `{list, say, pick}`; with a
  list it never uses `window.prompt` (a browser prompt has no list) and draws `#uipList` and `#uipNote`. Refused → the box
  opens again holding the text.

**Needs attention**: `attLists()` gains `wbs` (every requirement without a WBS, Funded = d + m, with `cov = {n, of, f, fof}`)
and `wbsx` (a stored paragraph the list does not hold, as stored). `ATT_KIND.wbs` (▦ WITHOUT A WBS — heading *4 of 7
requirements have one · $690 of $1,340 funded*) and `ATT_KIND.wbsx` (≠ WBS NOT IN THE ESTIMATE); `attBody` columns;
`attGo` opens the edit box at the WBS (a prime: `clinGo`; a split: the box at its *Open the WBS split…* button); posture
entries `▦ N without a WBS` and `≠ N WBS not in the estimate`, last; the comment at `let attOpen`; the guide's list.

**Classify**: `matBulk` gains `wbs` while an estimate names the appropriation — options from the same list, `applies(it)`:
not a prime, not already split (a bulk set would erase the split); `set` writes `S.wbs[id]=[{w, v:[]}]`. `matBulkOk` exempts
`wbs` only when there is no list. The grid's WBS cell carries the name, or the flag.

**Spend Plan Source column 23** (`srcWbsCell`, `srcWbsParts`, `srcNoWbsSay`): `CODE - name` (the name when the estimate has
one); a requirement or a prime's CLIN on several paragraphs goes out a line per paragraph per service and lane, its amount
`apportion`ed over `wbsResolve`'s per-service figures, the remainder on a blank-WBS line, so the lines add to the line they
replace and every other cell is that line's own (a modelled, non-whole amount is split proportionally, last part the
balance). The status line names the requirements whose lines go out blank. No other column moves (`QPE_READS` reads by
position); `srcWbsPara` reads the cell back to the code.

**FYDP Spend Plan**: `fydpSvcFold(s)` (USMC-B → STOVL); `fydpBookModel` folds service names, `fydpBookVal` sums every index
whose folded name is the tab's. One STOVL tab whichever board is open; the service tabs still partition the appropriation tab.

**Guide**: `t-wbs` (*A requirement’s WBS paragraph*, 2,299 characters), the two Needs attention entries in `t-alloc`'s list,
and one paragraph in `t-fydp` on STOVL. The guide is 63,822 characters.

## Decided in the build

1. **Refused when committed, warned while typed.** "Refused when typed" is read as: the field says *⚠ Not a paragraph …* as
   it is typed, and the value is refused when it would be stored — the edit box's Save, the Add box's Add, the quick box's
   OK, a WBS line's change — with the text kept, the field marked and the reason said, as `codeTake` refuses. Refusing on
   every keystroke would refuse every code before it is finished.
2. **A stored paragraph unchanged is never judged again.** Save, the WBS panel and the quick box take a stored value the
   list does not hold back as it is (kept, flagged), so opening and saving a record never drops or rewrites it.
3. **The code is stored as the estimate writes it** (`aceNormWbs`: capitals, no spaces), so `p6.2` typed is `P6.2`.
4. **A name typed alone is not taken**: it finds its paragraph in the list (Chromium matches a datalist by substring), and the
   pick puts the code in. Matching names to codes by text would have to choose among repeated names ("Officer").
5. **The edit box moved two fields.** The WBS (with its name) is first of the Accounting lines in the middle column, and the
   Navy SI code moved from Accounting lines to Classification. Measured at 1366 × 657 (layout N and Q): under the field in
   the first column a long path ran that column past the box, and so did a WBS section of its own in the middle column; the
   middle column is the widest. The name sits on the label's line, after it, and wraps there.
6. **Coverage counts the year on screen**, requirements and funded dollars (d + m), the way the list's own Funded column
   reads.
7. **The quick box never uses `window.prompt` while there is a list** (a browser prompt cannot show one); with no estimate it
   behaves exactly as before.
8. **Spend Plan Source, a modelled (non-whole) amount** — only reachable outside the board's own whole-dollar model — is split
   proportionally, the last part taking the balance, rather than refused.

## Checks (each fails on `d732259` unless labelled CONTROL)

jsdom, `tools/export-audit/audit-other.mjs`, the W2 slot:

- *v2.12 W2 — a WBS paragraph is picked from the estimate: the Add box, the edit box, the WBS lines and the quick box (item
  132)* — the list and its order, suggestions first and marked (and only this appropriation's lines), a code typed, a pick
  leaving the code, refusals with the text kept in all four, no estimate (CONTROL parts: typed as before), kept-as-stored on
  open and on Save, the split flagged.
- *v2.12 W2 — Needs attention lists every requirement without a WBS, and every WBS the estimate does not hold (item 132)* —
  the lists from the fixture (a prime by its CLINs' money), the coverage heading, the posture entries, Go to it.
- *v2.12 W2 — Classify sets one WBS paragraph on many requirements, from the estimate (item 132)* — the options, the reach
  (no prime, no split), what is written, `matBulkOk`.
- *v2.12 W2 — the Spend Plan Source carries each line’s WBS paragraph, split as the office typed it (item 132)* — every
  line's column 23 and amount from the bytes, the split worked in the suite by largest remainder, every other column against
  the same export with the WBS taken off, a CLIN line, the blank lines named.
- *v2.12 W2 — the FYDP Spend Plan’s STOVL tab carries Full Fund’s USMC-B, whichever board is open (item 132)* — modelled on
  v2.10 A-1: O&M, Full Fund and a Spares board carrying both STOVL and USMC-B; every tab against the fixture's literals, the
  service tabs adding up to each appropriation tab, the Summary's By service, the panel's views.
- Moved on purpose: *v1.93 — Needs attention…* expects the new posture entry `BUTTON ▦ 4 without a WBS`
  (`// v2.12 W2:` comment).

jsdom, `tools/export-audit/hostile.mjs` (run by `audit-hostile` and `hostile-render`): hostile WBS names planted in
`set.wbs` (a heading and a paragraph) and a hostile CCaR on a line the requirement suggests; `wbstop`, `wbsname`, `wbsccar`
must be SEEN, escaped; the `attPanel` special opens `wbsx`.

Browser:

- `tools/layout-fits.mjs` **Q** — a paragraph whose path runs to ~160 characters picked in the Add box (M's fullest state),
  the edit box (N's state, its per-service RCN rows folded as the box opens them) and the WBS panel on a split with one line
  the estimate does not hold: list with the CCaR record's paragraph first, the code alone in the field, the name whole and
  inside its box, each box still whole; 1366 × 657 and 1920 × 969, Harbor and Midnight, this font and the Segoe stand-in.
  M and N still pass with the moves.
- `tools/keyboard-reach.mjs` **T** — Needs attention's ▦ entry (Funding), its Go to it and the edit box's WBS by the keys;
  the list with the CCaR record's paragraph first; a code typed named; a pick (stood in for: automated Chromium does not open
  a datalist's popup from the keys — measured — so the option's text goes in as one input, as a pick does); a code the
  estimate does not hold refused on Save with the text kept and the keyboard back on the field; one it holds saved by
  Enter; the Add box's field by Tab; Classify's WBS cell opening the quick box, Enter taking it.

## Mutations

52 new, `v212-w2-*`, in the W2 slot of `tools/export-audit/mutate.mjs` (`recovery/v212/proofs-W2.json`: 49 caught by
`other`, 3 by `hostile`). 5 retargeted to where the same defect now lives, each with its `// v2.12 (item 132): retargeted …`
comment: `fydp-service-shifted`, `v200-u41-strip-silent`, `v207-rv2-wbs-mark-off-early`, `v207-rv2-wbs-mark-never-off`,
`v199-newreq-ccar-cut`. None retired. `mcount`: 2,851 targets, every one matching once.

**Proved** (`JOBS=1 HEAP=8192 prove.py recovery/v212/proofs-W2.json recovery/v212/proved-W2.jsonl`, on the final board):
52 of 52 CAUGHT, none survived, none crashed. The first full run had one SURVIVED, `v212-w2-er-raw-stored` (the edit box
stores a pick as typed): a pick fires `input`, which already puts the code alone in the field, so the check never met the
case `erRead`'s normalising exists for -- a code typed as the estimate does not write it. The first block now types
` 1.2.2 e ` into the edit box (a lettered paragraph put in the tree for that check and taken out after it) and wants
`1.2.2E` stored; caught. Three (`take-unlisted`, `ar-unchecked`, `er-save-unchecked`) were caught only by the block
throwing: the check's own read of a field the closed box no longer had. Those reads are now null-safe, so each is caught by
its check first (`fails: 2`); the block still throws after it, which `proved-W2.jsonl` reports beside the verdict.

## Runs (on the final tree unless said)

- `npm run check`: all checks passed. `npm run coverage:money`: 25/25. `npm run money-map`: 308 cells, 112 proven, 195 n/a,
  1 open (the v2.04 `aiExport` follow-up, as before).
- jsdom, each WHOLE, one at a time: audit-other (twice: before and after the last check change), audit-board, audit,
  audit-hostile, audit-inject, audit-ui, legacy-fsrc, boot-same, audit-recon (8 GB, 1,015 s), audit-import (8 GB, 1,161 s):
  every one ALL CHECKS PASSED / its own pass line. (The guide's "shows under it" became "shows beside it" while
  audit-board was running; the later suites read the new word, and no check reads that sentence.)
- Browser: controls, panels, dialogs, leftmenu, menus, editors, dropdowns, hostile, pointer, standards (0 findings, nothing
  new), keys (T included) -- all pass; layout -- only the 8 carried D results fail, M, N and Q pass.
- On `d732259`: the five audit-other blocks fail (29 failing checks, among them the blocks that throw); keys T fails (no ▦
  entry, no list); layout Q fails (8 states, each "could not be read": `d732259` has no picker). Q first crashed the tool
  there; a state that throws is now a finding of that state, so Q fails by name. M, N and Q were run again on the final
  board after that change: all pass.
- `mcount`: 2,851 / 2,851 once.

## For the integration

- **Conflicts to expect.** W1: `hostile.mjs` plants (I add `set.wbs` and a line to the set under `P('aceset')`), the guide
  (`t-wbs` is new; `t-alloc` and `t-fydp` each gain a sentence), `aceBody`/ACE code (I only read through the slot readers).
  W3: `attLists`, `ATT_KIND`, the posture entries (`ae(…)` list in `scoreboard()`), the guide's Needs attention list in
  `t-alloc`, the v1.93 posture expectation in audit-other, `fydpBookSheets` (I changed `fydpBookModel`/`fydpBookVal` only).
  The edit box's markup moved (the SI code and the WBS): anyone editing `erDraw` meets it.
- **Registries.** `tools/money-map.json` gains checks `ot.v212w2src` (cited on exportSrc's service and requirement cells) and
  `ot.v212w2stovl` (exportFydpPlan's service cell, with a note); `money-map.md` regenerated. `money-coverage` unchanged
  (25/25). No new npm script.
- **Size.** The guide is 63,822 characters before W1's and W3's sections.

## Known gaps

- **The edit box's name has room for about 85 characters in N's fullest state** (OGC fields, every per-service RCN / EEIC row
  open, the Segoe stand-in, 1366 × 657); a longer name there makes the middle column scroll. With those rows folded, as the
  box opens them, ~160 characters fit (layout Q). The 2026 estimate's real names have not been seen here; Q's are invented.
- **A datalist's popup cannot be driven from the keys in automated Chromium**, so keyboard T stands in for the pick (above).
- The Spend Plan Source's split of a non-whole (modelled) amount is proportional, not by largest remainder: the board's own
  amounts are whole dollars, so this branch is not reached from the board.
