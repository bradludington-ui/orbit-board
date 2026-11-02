## ace

# ACE (cost estimate) import and everything that reads it: code map for v2.12 items 132 and 134

Line numbers are from the working tree at `4abd107` (`BUILD='v2.11 (27 Oct 2026)'`, line 3317), file `/home/user/orbit-board/prioritization-board-grid.html`. Nothing was changed. `mutate.mjs` was read only as text, through `tools/export-audit/mut-json.py` (`python3 -I`).

## What the decided requirements need from this area (items 132 and 134, briefly)
- **Item 132:**
  - The ACE import must find its header row and every column by title, on any sheet.
  - Fields: *Work Breakdown Structure*, *Level*, CES1–CES8, *$ Type*, *Rollup Value?*, *Support Line Category*, *PALS/O&S*, *Appropriation (US Only)*, *CCAR Element* / *CCAR Description*, *PMO*, *Service*, *T/M/S*, *JPO Managed*, and the year columns.
  - A changed title is asked about once and remembered.
  - It reports the dollars it leaves out: Service Mgd, MILPERS, non-then-year, rollups, blank category, unmapped or disagreeing category.
  - It builds a WBS tree with names.
  - The `ACE_PMO_ALIGN_DEFAULT` rule changes to PSM → AV for every estimate. A stored `{}` on a 2026 set is replaced on opening.
  - Under *AV + PSM*, each office's part is the estimate of the paragraphs only its requirements picked.
- **Item 134** does not touch ACE directly. FYDP Disconnects (`fdcModel`) is the one ACE reader that also reads PPBE positions.

---

## 1. The import flow

### Entry points
- `<input type="file" id="aceFile" accept=".xlsx" ... onchange="importAce(this)">` at **1958**.
- Menu item `I.acei` at **29741**: `mi('📥 Import Annual Cost Estimate…', "mRun(()=>document.getElementById('aceFile').click())", …)`. Its hint lists the held set keys with 🔒.
- It sits in the Data box card `card('ace', 'Annual Cost Estimate', …, lbl('Cost estimates')+I.acei+I.acet)` at **29846–29849**. The card's "when" is the newest `set.ts`.
- `tools/left-menu.mjs:73` lists `'#aceFile'` and `toggleAce` in its map of calls.
- The Spruills panel header has its own **"📥 Import Annual Cost Estimate…" button, which only opens an `alert()`** ("ACE import is staged here — once the standardized cost estimate spreadsheet is settled…") at **24452**. It is stale and not the real import.

### `importAce(inp)` (async, 17180–17229)
1. Refuses at once in a locked cycle view: `cycBlock('Importing a cost estimate')`.
2. `setStat('📈 Reading '+esc(f.name)+'…')`.
3. `xlsxRead(await f.arrayBuffer())`, then `cycBlock` again (in case a view was put on screen meanwhile).
4. **It reads the first sheet only:** `const first=Object.keys(sheets)[0]`, then `aceParse(sheets[first], key)`.
5. **Key and label.** `label=(f.name.match(/(20\d\d)\s*ACE/i)||[null,''])[1]` and `key = label? label+'ACE' : f.name.replace(/\.xlsx$/i,'')`, so "2026 SUST ACE COMPLETE.xlsx" becomes `2026ACE`.
6. It refuses a key that is a built-in name: `if(IN_KEY_BAD.has(key)) throw …'the estimate would be filed as '…`.
7. `if(!Object.keys(set.appn).length) throw new Error('nothing matched the expected columns — check this is the ACE layout')`. On that path the skip counts are never reported.
8. If `ACEDB.sets[key]` exists and is `locked`, it asks with `confirm('⚠ <key> is already loaded and LOCKED …')`. Cancel keeps the old set.
9. It stamps `set.locked=true; set.by=whoAmI(); set.file=f.name; set.fp=aceFingerprint(set)`, then writes `ACEDB.sets[key]=set; ACEDB.ts=Date.now(); persistAce()`.
10. It selects the set and opens the Spruills panel: `spAce=key; MS.spAce=key; persist(); spOpen=true; render()`.
11. **How skips are reported:** one `statKeep()` line — `'<key> loaded and 🔒 locked — N cost lines across n appropriation(s), FY<years[0]>–FY<years[last]>. Not imported: <reason count · …> (sorted by count, descending). 💾 Save to bake it into this file.'` plus `xlsxEscSaid()`.
    - It gives counts only: no dollars and no per-year figures.
    - With nothing skipped it still prints "Not imported: ."
    - The counts are also kept as `set.skip`.
12. Any throw becomes `setStat('⚠ Cost estimate import failed: '+esc(msg))`.

The import does **not** go through `inboundCheck`, which is by design for workbook imports. **I found no PMO-copy (`SANDBOX`) refusal in `importAce`.** In a copy it would write the copy's sealed key, `prio27acedb-pmo<ts>`.

### `xlsxRead(buf)` (async, 14277–14404): the reader's API
- **Input** is an ArrayBuffer. **Output** is `{ [sheetName]: rows }` for **every** sheet in `xl/workbook.xml` that it can read, in insertion order.
  - Because the result is a plain object, a sheet named like an integer ("2026") would come first in `Object.keys`.
  - `rows` is an array of arrays. Each row is dense from column 0 to its last cell, with `''` for gaps.
- **The row index is the order of `<row>` elements, not the `r="N"` attribute.** Rows that are absent from the XML (Excel usually omits empty rows) do not appear. So "header on row 3/5" equals `rows[2]`/`rows[4]` only if the earlier rows are written.
  - A self-closed `<row …/>` is swallowed into the next row's match.
  - A cell's column comes from `r="([A-Z]+)\d+"`. Cells with no `r` are dropped.
- **Cell values:**
  - Shared strings, `inlineStr` and `t="str"` become **strings**, decoded through `_xunesc` (14229) then `_xdecode` (14246).
  - Everything else becomes `parseFloat(<v>)`: numbers, formula cached values, booleans (1/0), errors (NaN), and dates as serials. A `t="d"` ISO date would parse to its leading year.
  - It reads no styles, number formats, merges (only the anchor cell holds the value), hidden flags or defined names.
- **Side output:** the global `XLSX_LAST={names:[…all sheet names…], missing:[], unreadable:[], esc:{dec,kept}}` (declared 14226, reset 14344). `xlsxEscSaid()` (14266) gives the `_xHHHH_` note.
- **An `.xlsb` file is refused** with "…it contains no workbook part (xl/workbook.xml)" (it is a zip without `workbook.xml`).
- Other callers: `importSrc` (14565), `importBud` (16872), `importCcarRecs` (17119).
  - **Precedent for finding columns by title:** `importCcarRecs` (17121–17129) and `importBud` (16878–16880) take `rows[0]` of the first sheet and use `hdr.indexOf('CCaR No')`, `'Title'`, `'Budget Name'` (exact, trimmed) to find columns, and throw if a required title is missing.

### Constants and the parser (14613–14673)
- `ACE_APPN` (14614): `{'O&M':'om','SPARES':'sp','OPN':'opn','SUPPORT':'ff'}`. The key is the upper-cased, trimmed text of the funding-type column.
- `ACE_PMO` (14615–14617): `{'PROPULSION':'PP','AIR VEHICLE':'AV','COMBAT DATA SYSTEMS':'CDS','TRAINING SYSTEMS & SIMULATION':'TSS','MAINTENANCE SYSTEMS':'MxS','PO&A':'BOP','NON-PMO':'Non-PMO'}`.
  - The match is exact on the upper-cased text. "Service Mgd" is not in the map, so it is skipped as `'PMO Service Mgd'`.
  - **No PSM entry exists.**
- `aceSvcOf(svc, variant)` (14618–14626) uses word-boundary regexes on the service text:
  - ANG → `'ANG'`, AFRC → `'AFRC'`.
  - USMC → `'STOVL'` if the variant matches `/F-?35B/`, `'USMC-C'` if it matches `/F-?35C/`, else `null`.
  - USN → `'USN'`, USAF → `'USAF'`, else `null`.
  - **It returns the O&M vocabulary `'STOVL'`**; Full Fund's own service is `'USMC-B'` (see `SVC_ALIAS`, 17262).
- `ACE_COL` (14627–14628), 0-based columns:

  | field | col | letter | read? |
  |---|---|---|---|
  | appn (funding type) | 1 | B | yes |
  | svc | 8 | I | yes |
  | variant | 9 | J | yes |
  | managed (JPO) | 11 | L | yes, `/^y/i` |
  | ce | 22 | W | stored as `line.ce` |
  | ccar | 23 | X | stored as `line.ccar` |
  | ctitle | 25 | Z | **never read** |
  | pmo | 26 | AA | yes |
  | sub | 27 | AB | stored as `line.sub` |
  | wbs | 28 | AC | stored as `line.wbs` |
  | y0..y1 | 39..122 | AN..DS | year columns |

- **`aceParse(rows, label)` (14629–14673):**
  1. The header is `rows[4]`, a fixed 5th row. In AN..DS only, every cell whose `parseInt` falls in 1991–2099 maps year → column (`ycol`). `years` is the sorted list.
  2. Data rows start at `r=5`. For each row:
     - `row[appn]` blank → `continue`, **not counted**.
     - Managed not `/^y/i` → skip `'not JPO managed'`.
     - Funding type not in `ACE_APPN` → skip `'funding type <text>'`.
     - PMO not in `ACE_PMO` → skip `'PMO <text|(blank)>'`.
     - `aceSvcOf` gives null → skip `'service <text>'`.
  3. Per year: `v = number ? raw : parseFloat(String(raw).replace(/[^0-9.\-]/g,''))`. Then `if(v && |v|>1e-9) vec[y]=v*1e6`.
     - The figure is in $M times a million, **not rounded**: `1.005*1e6` is `1004999.9999999999`.
     - "(1.5)" loses its parentheses and reads **+1.5**.
  4. A row with no nonzero year → `continue`, not counted.
  5. Running aggregates go into `appn[ap].tot[y]`, `.pmo[pmo][y]` and `.svc[svc][y]`.
  6. Each kept row pushes a line (shape below).
  7. Returns `{label, ts:Date.now(), years, appn, lines, skip}`.

### Data shapes
```js
ACEDB = { ts: <ms>, sets: { <key>: set } }          // own store; default {ts:0, sets:{}}
set   = { label: <key>, ts: <ms import>, years: [int…],          // every year column in the header, empty or not
          appn: { <'om'|'sp'|'opn'|'ff'>: { tot:{<y>:$}, pmo:{<ACE PMO code>:{<y>:$}}, svc:{<svc>:{<y>:$}} } },
          lines: [line], skip: { <reason>: <row count> },
          locked: true, by: whoAmI(), file: f.name, fp: aceFingerprint(set) }
line  = { ap, pmo /* 'PP'|'AV'|'CDS'|'TSS'|'MxS'|'BOP'|'Non-PMO' */, svc /* 'USAF'|'ANG'|'AFRC'|'STOVL'|'USMC-C'|'USN' */,
          sub, ce, ccar, wbs /* trimmed text of AB, W, X, AC */, v: { <year>: <dollars, float> } }
```
- `aceFingerprint(set)` (16846): a djb2-xor hash of `JSON.stringify(set.appn)+'|'+lines.length`. **It covers only the aggregates and the line count**, so a change to a line's `wbs`, `ce` or `ccar` does not change `fp`.
- `aceIntact` (16852) compares the stored `fp` with a fresh one. `aceStamp` (16853) is the lock / import / count label, and flags "FIGURES CHANGED SINCE IMPORT".
- `aceSetKeys` (16578) and `aceSet(k)` (16579) read the store. `aceYearOf(k)` (16580) returns the leading `20\d\d` of the key, else 0.
- Selection is a shared global, `spAce` (declared 22009; `'board'` means board requirements). It is persisted as `MS.spAce` and restored by `syncViewPrefs` (3220–3236), which falls back to the newest `ts`. `setSpAce` is at 3238. The tie-out and its export use `spAce` if held, else the last key in sort order. FYDP Disconnects has its own pick, `fdcAceK` (6534).

---

## 2. Storage, files, doors

- **Boot pick** (3006–3016): it reads browser storage `ACEDB_KEY` and the file's `PUB.aceDb`, and takes the one with the newer `.ts`. It records `sideBootNote(ACEDB_KEY, fb)`. A pick with no `.sets` becomes `{ts:0,sets:{}}`.
- **The key** is `ACEDB_KEY='prio27acedb'+SIDE_SFX` (2822). `SIDE_SFX` (2821) is `-pmo<ts>` in a PMO copy.
- `persistAce()` (3084) is `lsSet(ACEDB_KEY, JSON.stringify(ACEDB), 'The cost estimates')`. `fileKeyOf` (2913/2916) counts this key as `'side'`, so the change moves `_sideGen` and the board reads unsaved.
- `sideBootCheck` (shape test `!!o.sets`, 29440) and `sideBootSay` ('the cost estimates', 29485) report it on opening.
- **The saved file:** `savedHtmlOf(appns, cycDb)` (8023) writes `aceDb:ACEDB` **whole**. That one function serves Save, the PMO copy (`pmoCopyHtml` 3198 → `buildSavedHtml({refOnly:true})` 8006), the work kept aside, and the pre-import file.
  - A PMO copy therefore carries every estimate. The handoff tests assert this; see the mutation `handoff-copy-drops-ace`.
- **Appropriation packages:** `pkgStrip` (10669) deletes `aceDb`.
- **One appropriation exported:** `oneAppnHtml(k)` (12482) carries `aceDb:J.aceDb` whole.
- **Full import:** `fullImportText` (12108). The summary line is at 12157. At 12218/12222 it writes `prio27acedb` (the **unsealed** key) with the file's whole `aceDb` (`ts=now`) through `lsAll`, and `ACEDB=ace` at 12246. **This replaces the store; it does not merge.**
- **The ordinary import** (`importState` 12524 and `consTakeApply` 11397, both through `importStores(inc)` at 11272; the ACE part is 11296–11316) merges **per set**:
  - a key not held is taken;
  - one held with the same `fp` is left as it is;
  - one held with a different `fp` is reported "disagrees … left alone".
  - `persistAce()` runs only if something was taken.
  - **Neither a mutation nor a check quoting its messages was found.**
  - `importAceNote(st)` (6639) is appended by `importReportHtml` (6653/6664) and still says an estimate is "**not** brought across", which looks inconsistent with `importStores` taking sets that are not held.
- `impMemSnap`/`impMemRestore` (12351/12355) include `ACEDB`.
- **The shared folder** (30985–31263):
  - `driveAceName(k)` = `'spmt-ace-'+k.replace(/[^A-Za-z0-9_.-]+/g,'_')+'.json'`.
  - The file body (`driveAceBody`) is `{v:1, key, fp, by, ts, lines:<count>, set}`.
  - `driveAceFile` (31002) returns `{none}` only on NotFoundError; else `{bad,txt?}` or `{j,txt}`. It checks `j.key`, `j.set.lines[]`, `aceIntact` and the fp.
  - `aceSameAs` is at 31016.
  - `driveAcePush` (31024) writes only where the folder has no copy.
  - `driveAceReplace` (31073) asks first and keeps theirs in `history/`.
  - `aceHistShow`/`aceHistBody`/`aceRestore` (31111/31136/31160) use the history pattern `ACE_HIST_RE=/^spmt-ace-(.+)-(\d{8}-\d{6})(-recent)?\.json$/i`.
  - `driveAcePull` (31215) stages sets, takes keys it does not hold, and reports clashes. A set it takes keeps its own shape.
  - The live panel row with "share mine / check the folder" is at 31525.
- **The door** (`inboundCheck` 11881 → `inWalk` → `inShapeWhy` 11614) has **no ACE-specific shape check**. What applies to `aceDb` is generic:
  - numbers finite and at most `IN_MAX_NUM` 1e15 (not `IN_MAX_AMT`);
  - text at most 200,000 characters;
  - field names not in `IN_KEY_BAD`, which includes the set keys;
  - `IN_VAL_KEYS` (11492): a line's string `ap`, `pmo` and `svc`, and a folder copy's `key`, may not be a built-in name.
  - `MS.aceAlign` values are checked against `IN_KEY_BAD` (11679–11680).
- **Diagnostics:** `diagSecrets` walks `ACEDB` (31813).
- **Hostile fixture** (`tools/export-audit/hostile.mjs:113`): one set under a hostile **key** `P('aceset')`, shaped `{fp, locked, appn:{om:{tot,pmo:{AV},svc:{}}}, lines:[]}`. **No hostile values are planted in line fields** (wbs, ce, pmo, ccar).

---

## 3. Every reader of ACEDB sets or lines

Which line fields each reader uses:

| reader | `ap` | `pmo` | `svc` | `wbs` | `ce` | `ccar`/`sub` | `v` | `set.appn` | `set.years` |
|---|---|---|---|---|---|---|---|---|---|
| tie-out (`aceLinesBy`, `aceAmt`, `aceEstPmo`, `aceBody`, `exportAceTieout`) | ✓ | ✓ (ACE PMO) | – | ✓ | orphan lists only | **never** | ✓ (raw float) | – | – |
| Spruills table (`spBodyDraw`, `aceRows`, `acePmoKeys`) | – | – | – | – | – | – | – | ✓ (tot/pmo/svc) | – |
| Spruills drill (`pmoDetail`) | ✓ | ✓ (= **board** PMO) | ✓ | – | – | – | ✓ | – | – |
| FYDP Disconnects (`fdcModel`, `fdcNotes`, `fdcLoneSay`) | ✓ | – | ✓ | – | – | – | ✓ (`D$` at read) | – | ✓ |
| fingerprint | – | – | – | – | – | – | – | ✓ | – |

`ACE_COL.ctitle`, `line.ccar` and `line.sub` are read by nothing.

### The ACE tie-out (§08, panel `acePanel`)
**Alignment helpers:**
- `ACE_PMO_ALIGN_DEFAULT` (16572–16577) is `{early:{PSM:'AV'}, later:{}}`, keyed board PMO → ACE PMO.
- `aceAlign(k)` (16584–16592) **creates** `MS.aceAlign[k]` on first read, copying `later` if `aceYearOf(k)>=2026`, else `early`.
  - This is a side effect during render, with no `save()`.
  - A key with no year (taken from a file name) gets `early`.
  - Nothing else edits or normalises `MS.aceAlign`; it is stored in `MS`, not per year.
- `acePmoFor(k, boardPmo)` (16594) returns `aceAlign(k)[boardPmo] || boardPmo`.
- `acePmoGroups(k)` (16597–16601) builds `Object.create(null)` `{acePmo:[boardPmo…]}` by iterating **`GROUPS`** (the configured offices, not `pmoKeys()`).

**WBS and mapping helpers:**
- `aceNormWbs(v)` (16603) trims, upper-cases and removes whitespace. Letters are kept, so `P6.2.2.1E` stays distinct.
- `aceWbsOf(id)` (16606) lists every WBS a requirement claims: `wbsReq(id)` (27051, `S.wbs[id]=[{w,v}]`) plus every CLIN list in `S.clinWbs[id]` (27052), normalised and de-duplicated.
- `aceLinesBy(k, ap)` (16614) indexes `{normWbs:[lines]}` for one appropriation.
- `aceMapOf`/`aceIsConfirmed` (16624/16625) read `S.aceMap[id]={w:[normWbs…], ok:bool}`. That is per year, in `S`; it is on `REQ_MAPS` (6863), `yearCopy` `cp` (6971) and `IMP_CATS` (6607).
- `aceSuggestFull(k, id)` (16637–16649) returns `{exact, roll, parents}`:
  - `exact` = this requirement's WBS that are lines;
  - `roll` = lines starting with `w+'.'` when `w` is not itself a line (a suffix is a sibling, not a child).
  - The result is computed, never stored.
- `aceSuggest` is at 16650. `aceSetMap(id, ws, ok)` (16651) writes or deletes `S.aceMap[id]`, then `save(); render()`.
- `aceConfirm` (16817) confirms the exact matches; `aceConfirmRoll` (16825) confirms the rollup lines. The `…Y` wrappers (4080–4082) run inside `aceWithYear`.
- `aceActiveYears` (16756) gives the years in `MS.years`. `aceWithYear(fy, fn)` (16767) swaps `S` to that year and restores it in a `finally`.

**Per-year scan and amounts:**
- `aceScan(k, fy)` (16782–16807), inside that year, returns `{rows:[{id,fy,f:dT+mT,pmo:grpOf,title,rec,ccar,w,ok,hasSug,roll,parents}], orphan:[wbs no confirmed row claims], ces:idx, mapped, mappedMoney, suggested, unmappedMoney, boardTot}`.
- `aceEstPmo(k, acePmo, years)` (16808) sums the lines with `ap===mySlug() && pmo===acePmo` over those years.
- `aceAmt(k, w, fy)` (16834) sums the lines with `ap===mySlug()` and that WBS.

**The panel, `aceBody()` (4125–4335):**
- It has an estimate picker (`setSpAce`) and a year picker (`aceSetYr`, which offers `all`).
- It shows three headline counts.
- Its by-PMO table works over `acePmoGroups(k)`:
  - a combined row for a group present on the board;
  - an `aceestonly` row for a group with an estimate and no requirement in scope;
  - the TOTAL;
  - the accounting line (`aceacct`): estimate = TOTAL + lines under a PMO that is not a key of the groups.
- The working list has the filters `sug`/`none`/`orph`, a cap of 120 per year, and ✓ / ↩ buttons.
- `aceExpandRows` (4097) is the ▸ breakdown, through `aceAlignRows`. It shows only where `alignApplies()` (4094) holds: O&M, or Full Fund with cost elements.

**`aceAlignRows(id, T)` (16669–16733)** does **not** read `ACEDB`. It lays out the board's funding lines:
- per CLIN (`clinList`/`clinVec`/`wbsClin`) or per requirement (`svcAlloc`, `wbsReq`);
- through `wbsResolve` (27069: one line takes the parent whole, more lines are split by their stored vectors and the remainder is reported);
- per RCN/EEIC combination (`rcnOfClinSvc`/`rcnAsgOf`);
- with `T`, `L.f`/`L.ftot` are the lane draw spread by `apportion`.

`alignCodeCells`/`alignRcnPart`/`alignSiPart` are at 16736–16755. `rcnKeysOf(id)` (13488) reads `aceAlignRows`, **not ACE lines**.

**`exportAceTieout()` (34154–34473)** uses `aceScopeYears` (34141) and `aceMatchLbl` (34147). Its sheets:
1. *Mapping by Requirement* — the estimate is the sum of `aceAmt` over confirmed `w`; shared lines are flagged.
2. *Reconciliation by PMO* — over `acePmoGroups`: estimate-only rows, stray lines "(no office on this board reports under it)" kept out of TOTAL, and an "Estimate for this appropriation = …" tie line.
3. *Lines Nothing Claims* — orphans with `ce` and ACE `pmo`.
4. *Across Active Years* — only when more than one year is in scope.
5. 4b *Alignment Breakout* — `aceAlignRows` with Funded, O&M and Full Fund only. This is the "ACE breakout export"; there is no separate function.
6. *How to read this*.

It writes through `buildXlsx(…, xlsxHouse('ACE Tie-Out'))`. Its no-estimate alert still names "FYDP > Import Annual Cost Estimate…".

**Effect of the item 132 PSM rule here:**
- With `later:{}`, a 2026 set prints PSM against ACE PMO `PSM`, which the estimate never carries.
- With PSM → AV, the group becomes `AV:[AV,PSM]`, and any line still filed under `pmo:'PSM'` (only test fixtures have them) becomes a stray line.

### Spruills (§31)
- `spDefs()` (24104) and `spGather()` (24133) do not touch ACE.
- `spBodyDraw(el)` (24400):
  - With `aceSet=ACEDB.sets[spAce]`, it replaces each block's `req[y]` with `appn[slug].tot/pmo[spPmo]/svc[spSvc]` and its rows with `aceRows`.
  - Its "Cost data" picker is at 24447–24451.
- `aceRows(set, slug, years)` (22018) reads `set.appn[slug].pmo` or `.svc`, narrowed by `spPmo`/`spSvc`.
- `acePmoKeys()` (22012) lists the PMOs in `set.appn`, `GROUPS` first.
- By PMO, the rows shown are `GROUPS.filter(g=>b.rows[g])`, so ACE PMOs that are not board offices (Non-PMO, CDS, MxS, BOP) are in the total but not in the rows.
- By Service, on Full Fund the service picker lists `SVC` (`'USMC-B'`) while `appn.svc` holds `'STOVL'`.
- `pmoDetail(pmoKey, years)` (24189–24259) adds `L.v` per `L.svc` for lines with `L.ap===slug && L.pmo===pmoKey`.
  - That compares the **board** PMO with the ACE PMO directly, with **no alignment**, so PSM gets no estimate.
  - It drops a line whose `svc` is not one of that appropriation's services, so `STOVL` lines are dropped on Full Fund.
  - Its consumer is `pmoDrillHtml` (24260).

### FYDP Disconnects (v2.10–v2.11, 24502–24830)
- `fdcAces()` (24540) lists the sets with `lines[]`, newest `ts` first.
- `fdcStores()` (24547) and `fdcFolderRead` read the PPBE positions per appropriation.
- `fdcState(opts)` (24611) picks the estimate and cycle and gives the `why` text.
- `fdcModel(opts)` (24638–24742):
  - `lines` are filtered to objects with `v`;
  - "carried" years are `set.years` plus any `l.v` year;
  - `req(ap, svcs)` sums `D$(+l.v[y])` over lines with `l.ap===ap` whose `l.svc` is in the group (`FDC_GROUPS` 24528, with `SVC_ALIAS`);
  - the controls come from positions (`ppNorm` 23617, `ppSvcFy` 23690, `ppSvcsOf` 23695).
  - Only `om`, `ff` and `sp` count (`FDC_APS` 24519).
  - **It is the one ACE reader that rounds at read.**
- `fdcNotes` (24745) uses `set.years` and line years.
- `fdcLoneSay` (24763) names the line services that are in no group.
- `fdcAceLbl` turns `2025ACE` into "2025 ACE".
- Not offered in a PMO copy (37359).

---

## 4. Tests that build ACE data

### A. Tests that build an ACE workbook with the board's own writer and run the real `importAce` → `xlsxRead` → `aceParse`
All of them use a helper defined in the page: `__wb(sheets, name)` = `buildXlsx(sheets)` wrapped as `{name, arrayBuffer}`; and `__aceRows(t?)`.

**The layout every one uses**, which is positional and reads the board's own `ACE_COL`:
- `rows[0..3]` empty;
- `rows[4][ACE_COL.y0]=2027` (only AN carries a year);
- one data row: `r[ACE_COL.appn]='O&M'`, `r[ACE_COL.svc]` = `'ANG'` or `'USAF'`, `r[ACE_COL.managed]='Y'`, `r[ACE_COL.pmo]='AIR VEHICLE'`, `r[ACE_COL.y0]` = `1.5` or `4.321`, `r[ACE_COL.ce]` = `t` or `'CE1'`;
- holes filled with `''`, one sheet named `'ACE'`.

No WBS, CES, Level or title header exists in any of them. **A parser that finds columns by title will not find these columns, so every one of these fixtures has to be rebuilt.**

- **`tools/export-audit/audit-import.mjs`, block `V197W2`** (prelude at 5698–5706). The `LISTS` entry `k:'ace'` runs `importAce({files:[__wb([{name:'ACE', rows:__aceRows(t)}], '2025 ACE.xlsx')]})` (key `2025ACE`), and the scenarios iterate over it:
  - `'v1.97 — every list the file carries marks the board unsaved, at each wait of the file save'` (5777);
  - `'v1.97 — a folder save never acknowledges a list it does not write'` (5840).
  - (`'v1.97 — a refused browser write never reads as saved'` (5907) uses only `LISTS[0]`, the reprogramming log.)
- **`tools/export-audit/audit-recon.mjs`, `'v2.00 (U10) — a cost estimate, a BAE list, CCaR records or a destination change is refused in a locked view before anything is kept'`** (5809; helpers 5821–5824).
  - The in-view import is refused before it reads the file.
  - **The control at 5913** runs the import on the working plan with `'2027 ACE.xlsx'`. It expects the confirm `'⚠ 2027ACE is already loaded and LOCKED.'`, the lines `[['AV','',4321000]]` (`[pmo, wbs, v[cur]]`), and tie-out mapping and reconciliation rows `[['FY27','AV',4321000,1730,-4319270]]`.
- **audit-recon `'v2.00 (U10) — a file, a package, the band ladder or a shared copy is refused in a locked view before anything is kept'`** (6056; helpers 6074–6078; `FILES.ace` at 6184). The in-view import is refused before reading, and the race version is refused after `xlsxRead` but before `aceParse`. **`aceParse` never runs here.**
- audit-recon `'v2.00 (U10) — a view put on screen while Load theirs reads the shared folder keeps nothing aside'` (6459) defines `__aceRows` (6479) but **never calls `importAce`**.

**No test asserts the import report**: no test quotes "Not imported", the skip reasons or the "cost lines across" line. **No test calls `aceParse` directly**, and none builds a multi-sheet ACE workbook or a header off row 5.

### B. ACEDB built by hand (no import)
- **audit-recon**:
  - prelude `dress2` (113–127): `'2026ACE'`, lines `{ap,pmo,wbs,v}` under PSM, TSS, ATL and NOBODY; `S.wbs`/`S.aceMap` for A and C. Used by `'the ACE tie-out'` (979).
  - `'v1.97 W6 — the ACE tie-out: every fiscal year held to that year’s own board and estimate'` (3029; `'2027ACE'`, PSM/TSS/ATL/AV/NOBODY, two years).
  - `'v1.98 item 83 — … the ACE breakout agree'` (3211).
  - `'v1.99 item 94 — an office with only estimate lines is a row of the ACE reconciliation…'` (3584; `'2027ACE'`, PSM/TSS/ATL/NOBODY).
  - `'v1.95 — the five-year plan files each year under that year’s PMO'` (1466).
  - U10 blocks at 5527, 5809, 5955, 6056 and 6459.
  - `'v2.02 (D5a) — the ACE alignment breakout prints Funded…'` (7973).
  - `'v2.00 (U61) — an RCN / EEIC pointer of "__proto__"…'` (8014).
  - `'v2.00 (U37) — no export writes a character XML 1.0 forbids…'` (8206).
- **audit-other** (FYDP Disconnects): sets `{label,ts,years,lines:[{ap,pmo:'AV',svc,v}],appn:{},skip:{}}` in:
  - `'v2.10 A — FYDP Disconnects: …'` (2910);
  - `'v2.10 review — … USMC-B … (A-1)'` (3235);
  - `'… (A-2)'` (3331);
  - `'… (A-3)'` (3389);
  - `'v2.11 — the FYDP Disconnects workbook says…'` (3857).
- **audit-import** (stores only, no line content):
  - `'submittal review'` (860);
  - the `v14Rich` fixture (3186; `'ACE27'`, `appn` only) used by `'v1.86 — a full import replaces…'` (3259);
  - `'v1.95 — one writer per board file'` (4216);
  - `w2AceBoard` (4500–4509; locked `2025ACE` with `appn` and `lines:[{n}]`) for `'v1.95 — a refused write of the cost estimates…'` (4462), `'…sharing a cost estimate writes only where the folder has none…'` (4519), `'…replacing the folder’s cost estimate…'` (4585), `'…check the folder checks each estimate’s fingerprint…'` (4640) and `'v1.99 — a cost estimate the folder kept can be put back…(item 96)'` (6246);
  - `'v2.09 second review — Submit asks the editor name…'` (14191);
  - `'v2.09 W3 — a copy’s side lists are its own…(item 127)'` (14522/14534).
- **audit-board** `'v2.07 — a BAE file entry with no date, or an estimate with no totals, does not stop the board drawing'` (5530; a set with `appn` and no `tot`).
- **audit-inject:** K3 `'K3 estimate lines, cost elements and MIPR types keyed by name (pmoDetail, ceSummary, MIPR_LBL)'` (374; lines with `svc:'__proto__'`/`'constructor'`). K8 `'K8 lookups by a value the board uses as a key (… acePmoGroups …)'` (459; `MS.aceAlign={X:{AV:'constructor',PSM:'__proto__'}}`).
- **hostile.mjs:113** (above).
- **Browser tools** (the same `2025ACE` FDC shape): `tools/keyboard-reach.mjs:826`, `standards-check.mjs:433`, `panels-render.mjs:38`, `dialogs-keyboard.mjs:132`, `layout-fits.mjs:724`.
- **Other tools:** `tools/verify-file.mjs:390` (`2026ACE`, pmo PSM). `tools/roundtrip-fuzz.mjs:214` fills `S.aceMap` only.

### C. Expectations that rest on today's alignment default (PSM is its own ACE PMO on a 2026+ key)
These move if PSM → AV holds for every estimate:
- audit-recon `'the ACE tie-out'` (`'2026ACE'`; checks `'PSM: the estimate is its line'` = 9,500,000 and `'the FY total estimate is every aligned PMO’s line'`);
- `'v1.97 W6 …'` (both PSM and AV offices, `'2027ACE'`);
- `'v1.99 item 94 …'` (`'2027ACE'`, PSM/TSS);
- `verify-file.mjs:390`.

No test exercises `ACE_PMO_ALIGN_DEFAULT.early`.

### D. Source pins that quote importAce or ACE lines verbatim (`tools/export-audit/audit-inject.mjs`)
- C1 (524–527, 597: `'📈 Reading '+esc(f.name)`; a regex for raw `f.name` in `setStat`);
- A2 (517, 529: `importAceNote`);
- K5 (565: the `spAce` restore line; 566: `if(IN_KEY_BAD.has(key)) throw new Error('the estimate would be filed as '`).

Rewriting these lines breaks the pins.

---

## 5. Mutations (from `tools/export-audit/mutate.mjs`, read as text)
**No mutation's find string sits in `aceParse`, `ACE_COL`, `ACE_APPN`, `ACE_PMO`, `aceSvcOf`, `ACE_PMO_ALIGN_DEFAULT` or `aceAlign`.** A grep of `mutate.mjs` for those names, and for `PSM:'AV'` / `later: {}`, returns nothing.

- **`acePmoGroups`:** `v200-acegroups-plain` (find `'function acePmoGroups(k){\n  const groups=Object.create(null);'`).
- **`importAce`** (the import flow, not the parser):
  - `v200-u10-ace-import-in-view` (`"  if(cycBlock('Importing a cost estimate')){ inp.value=''; return; }\n"`, 17186);
  - `v200-u10-ace-import-race` (the second `cycBlock` line with its `// v2.00 (U10): as importBud` comment, 17190);
  - `v200-fname-ace-raw` (`"'\\ud83d\\udcc8 Reading '+esc(f.name)"`, 17188);
  - `v200-ace-key-open` (the `IN_KEY_BAD.has(key)` line, 17196).

For reference, the other ACE consumers:
- `persistAce`: `ace-store-past-lsset`
- `savedHtmlOf`: `handoff-copy-drops-ace` (`'aceDb:ACEDB,'`)
- `fullImportText`: `full-ace-left`
- `aceBody`: `draw-ace-office`, `v199-ace-estonly-panel`, `v200-acetie-lines-raw`
- `aceScan`: `v197w6-ace-scan-onscreen`
- `aceStamp`: `v200-acestamp-lines-raw`
- `aceAlignRows`: `v198-ace-nosplit`, `v198-ace-rest-dropped`, `v200-uproto-plain-grp`, `v202-d5a-funded-is-allocation`, `v202-d5a-funded-on-first-line`
- `rcnKeysOf`: `v198-keys-old`
- `exportAceTieout`: `ace-total-skips-unconfirmed`, `ace-delta-sign`, `ace-pmo-total-drops-est`, `ace-stray-line-lost`, `v197w6-ace-across-year`, `-breakout-note`, `-breakout-year`, `-est-year`, `-orphan-year`, `-pmo-year`, `-stray-year`, `v199-ace-estonly-dropped`, `v200-stray-plain`, `v200-u37-guard-exportacetieout`, `v202-d5a-column-unprinted`
- `importAceNote`: `v200-acenote-missing-raw`, `v200-acenote-sets-raw`
- `pmoDetail`: `cycle-spruills-one-year`, `spdrill-controls-are-asks`, `spdrill-other-appn-guessed`, `v200-pmodetail-ctl-plain`, `v200-pmodetail-plain`
- `spBodyDraw`: `v207-spruills-estimate-no-totals`
- `driveAceFile`: `acefile-fingerprint-unchecked`, `acefile-half-is-none`, `acefile-unparseable-is-none`, `acefile-unreadable-is-none`
- `driveAcePush`: `acepush-clash-written`
- `driveAceReplace`: `acereplace-no-history`, `-stale`, `-unasked`, `-unreadable`
- `driveAcePull`: `acepull-error-swallowed`, `acepull-unreadable-silent`, `v199-ace-pull-unstaged`
- `aceRestore`: `v199-ace-restore-any-key`, `-no-keep`, `-no-readback`, `-no-reread`, `-unpinned`
- FYDP Disconnects: 21 `v210-a-*`/`v211-*` in `fdcModel`, plus `FDC_GROUPS` (`v210-a-usaf-no-ang`, `v210-rv-a-alias-dropped`), `fdcAces`, `fdcStores`, `fdcState`, `fdcNotes`, `fdcLoneSay`, `fdcFolderRead`

Defect register: `ace-estimate-line-nobody-reports-under-vanished` is guarded by `ace-stray-line-lost`, `ace-total-skips-unconfirmed`, `ace-delta-sign` and `ace-pmo-total-drops-est`.

---

## 6. Gaps and things I could not find
- Nowhere names WBS paragraphs: CES columns, `Level`, *$ Type*, *Rollup Value?*, *Support Line Category*, *PALS/O&S*, *Appropriation (US Only)* and *CCAR Description* have no code. The `ce` field is the raw column W text, and nothing maps it to `COST_ELEMS`.
- No stored "header-to-field mapping" pattern exists for workbooks. The nearest precedents are the exact-title `indexOf` lookups in `importCcarRecs` and `importBud`. A new storage key must start `prio27` or `spmt` (for Clear this computer) and take `SIDE_SFX` in a copy.
- ACE line dollars are not whole dollars at the door; only FYDP Disconnects rounds, at read. Accounting-style negatives "(x)" are read as positive.
- `aceFingerprint` ignores line fields, so re-importing the same file under a new parser changes `appn` (and so `fp`) only if the dollar aggregates change. A set kept from an old file and a newly parsed one under the same key can then read as a "clash" in `importStores` and on the folder.
- I found neither a PMO-copy refusal on `importAce`, nor a mutation or check on `importStores`' ACE merge.
- `acePmoGroups` iterates `GROUPS`, not `pmoKeys()`, so an office missing from the configured list is not grouped.
- On Full Fund, `pmoDetail` drops `STOVL` lines, and the Spruills By Service picker misses them.

## wbs

# The WBS paragraph on a requirement today: a map for v2.12 (items 132 and 134)

This map covers the WBS area only. The board is `/home/user/orbit-board/prioritization-board-grid.html`, and every `L…` below is a line in it. Test files are under `/home/user/orbit-board/tools/`. Item 134 (budget authority read from the PPBE position) touches none of this code. Its one point of contact is that the Spend Plan Source's Amount column is the lane draw (`srcLaneOf`), which item 134's budget authority would feed.

The mutation file was read as text only, through `tools/export-audit/mut-json.py`. One read-only jsdom probe was run (`/tmp/claude-0/-home-user/792dafeb-d944-5a2a-8cfa-66d1840065b4/scratchpad/map/qpe.mjs`); it changes no file.

---

## 1. Data shapes

- **`S.wbs`** is per requirement: `S.wbs[id] = [{w:'1.2.3', v:[]}, …]`.
  - **One line** takes the parent whole and stores no vector (`v:[]`, or no `v`).
  - **Two or more lines** each store `v` as dollars per service, by `SVC` position. These are allocation dollars, not draw dollars.
  - `S.wbs` is on the normalise list in `applyState` (L6270).
- **`S.clinWbs`** is per CLIN of a prime: `S.clinWbs[pid][clinKey] = [{w, v}]`.
  - `clinKey` is `'b<i>'` for a CLIN from the data and `'n<i>'` for an added one.
  - It is **not** on `applyState`'s normalise list. `wbsStore` creates it lazily.
- **The edit box's encoding** (`erStored`, L33185). The box holds `wbs` as one of three things:
  - the line's text, for one line with no vector;
  - `'\u0001'+JSON.stringify(list)` for a split, or for any line that carries a vector;
  - `''` for none.
- **`S.aceMap[id] = {w:[normalised wbs…], ok:bool}`**: the ACE tie-out's mapping. Only a confirmed (`ok`) mapping counts in any total. It is separate from `S.wbs`.
- **An ACE line**, as `aceParse` builds it (L14629–14672): `{ap, pmo, svc, sub, ce, ccar, wbs, v:{fy:$}}`.
  - Columns are read by fixed position (`ACE_COL`, L14627): `wbs:28` (AC), `ctitle:25` is declared and never read, headers come from row 5, and the years from AN–DS.
  - No WBS name and no Level is stored anywhere.
- **A WBS code** is free text of at most 40 characters (`codeMax`, L11501). Nothing checks its format when it is typed.

## 2. The core WBS functions (L11501–11530, L27048–27148, L27698–27762)

- **`codeMax(kind)`** (L11501): the table of code limits; `wbs:40`. **`codeName`** (L11502) gives the code's name for messages.
- **`codeTake(val, kind)`** (L11505): trims the text and returns `{v}`, or `{why}` when it is over the limit. A code over its limit is refused, never cut.
- **`codeRefusedIn(el, head, why)`** (L11512): marks an inline field as invalid (`aria-invalid` and a red border) and states the reason on the status line.
- **`codeIssues()`** (L11519): lists every stored code over its limit, including every `S.wbs[id][].w` and every `S.clinWbs[id][k][].w`. Needs attention's `code` list and Pre-flight's `code` row read it.
- **`wbsReq(id)`** (L27051): `S.wbs[id]`, or `[]`.
- **`wbsClin(pid, key)`** (L27052): `S.clinWbs[pid][key]`, or `[]`.
- **`wbsListOf(kind, a, b)`** (L27053): picks between the two by kind, `'clin'` or `'req'`.
- **`wbsParent(kind, a, b)`** (L27055): what the lines must add up to. That is `svcAlloc(it)` for a requirement and `clinVec(pid, c)` (the CLIN's allocation, falling back to its ask) for a CLIN.
- **`wbsResolve(list, parent)`** (L27069): returns `{rows:[{w, v}], rem, whole, exact}`.
  - No list: no rows, and the whole parent is the remainder.
  - One line: `v` is the parent and `whole:true`. **A stored vector on a single line is ignored.**
  - Two or more lines: each line's stored vector. `rem` is the parent less their sum, and `exact` means `|rem|<0.5` on every service.
- **`wbsStore(kind, a, b, list)`** (L27079): writes the list, or deletes it when empty, then calls `save()`. For `'clin'` it calls `clinLocked()` first, so in a PMO copy it alerts and writes nothing.
- **`wbsAdd(kind, a, b)`** (L27091): appends a line of zeros. Going from one line to two, it first gives the existing line the parent's vector.
- **`wbsDel(kind, a, b, i)`** (L27102): removes line `i`. Back to one line, that line's vector is dropped (`v:[]`).
- **`wbsSetNum(kind, a, b, i, val, el)`** (L27111): sets line `i`'s paragraph through `codeTake`. A refusal goes to `codeRefusedIn`.
- **`wbsSetVal(kind, a, b, i, j, val)`** (L27120): sets line `i`'s dollars for service `j` through `parseAmt`. `amtNo` refuses an entry it cannot read, and a blank stores 0.
- **`wbsQuick(id, typed)`** (L27131): the single-line editor, a `uiPrompt` titled "WBS paragraph number for this requirement".
  - With more than one line it opens the WBS panel instead.
  - A refusal opens the prompt again holding the text.
  - It stores `[{w:t, v:[]}]`, or `[]` to clear.
- **`wbsLabel(kind, a, b)`** (L27143): `''`, the single line's paragraph (`'(blank)'` when it has none), or `"N WBS"`.
- **`wbsOpen`** (L27698, `{kind, a, b}` or null) and **`toggleWbs(kind, a, b)`** (L27699): open and close the WBS panel.
- **`wbsBody()`** (L27703) draws `#wbsPanel` (markup at L2057–2059): a table with one row per line.
  - Each row has a paragraph `<input placeholder="1.2.3">` calling `wbsSetNum`, per-service inputs calling `wbsSetVal` (read-only when `whole`), a ✕ calling `wbsDel`, and ＋ Add WBS calling `wbsAdd`.
  - The table ends with "ALLOCATION TO SPLIT", then "NOT YET ASSIGNED" or "fully assigned".
  - If the requirement is gone, the panel closes itself.

## 3. Where a WBS is edited or shown

- **The row** draws no WBS. Search (title, event, CCaR, PID) does not read it.
- **The RECORD panel** (`inspectorBody`, L35926) has had no WBS of its own since v2.08. Its 📋 Requirement edit button (L36096) shows the `reqNeeds()` count, which includes WBS, and opens the edit box.
- **`recFields(id, it)`** (L27247), section "Work breakdown" (L27273–27287). This feeds Classify and `reqDraftOf` only.
  - A **prime** gets `recF('wbs', true, button clinGo(id) 'Open the 🧾 CLIN drill')`. It is always counted as set.
  - **Any other requirement** gets `recF('wbs', wbsReq(id).length, button wbsQuick(id) labelled wbsLabel(...) || 'Add a WBS paragraph…')`.
  - When it has at least one line, it also gets `recF('wbsSplit', length>1, button toggleWbs("req", id, ""))`.
  - `recF(k, set, ctl, note, lbl)` is at L27164.
- **The field's name.** `REQ_FIELD` (L2801–2811) holds `wbs:{l:'WBS'}` and `wbsSplit:{l:'Split by service'}`. Code reads it with `FL(k)` (L2812).
- **The CLIN drill** (`clinTable`, L27829): each CLIN has a cell button (L27874) calling `toggleWbs("clin", pid, c.key)` and labelled `wbsLabel('clin', …) || '+ WBS'`.
- **The PMO copy dims that button.** The copy's style block (L2832–2846, rule at L2838) applies `pointer-events:none; opacity:.5` to `[onclick^='toggleWbs("clin"']`.
- **The Add box.**
  - `arDraw()` (L32442) draws the WBS input at L32475 through `arField('arWbs', 'wbs', arInp('arWbs', {req:1, ph:'e.g. 1.2.3'}), {req:1, span:1, note:''})`. The note span is `#arWbsNote`.
  - `AR_CTL.wbs='arWbs'` (L32419) is how `arNeedIds` (L32717) and `arMark` (L32710) find the field.
  - `arRead()` (L32605) puts `wbs` into the draft as `true` when `arFin.wbsKeep` is set, and otherwise as the typed text, trimmed.
  - `arUpdate()` (L32637–32642) hides the field for a prime ("logged per CLIN…") or when the WBS is carried from another year ("carried from FYxx: …"). At L32671 it keeps the refused mark while `codeTake` would still refuse the text.
  - `arAdd(open)` (L32727): the WBS goes through `codeTake` (L32736) unless the requirement is a prime or the WBS is carried, and becomes `f.wbs` (L32755).
- **`arFinNext()`** (L32804) finishes a requirement brought in from another year.
  - `wbsKeep` is `wl.length>0 && !one`, where `one` means a single line with no vector. In that case the box carries the WBS and does not show it.
  - Otherwise it puts the single line's text into `arWbs` (L32820).
  - `wbsTxt` joins the paragraphs for the note.
- **The edit box.**
  - `erDraw()` (L33303) draws `#erF_wbs`, `#erWbs`, `#erWbsNote` and `#erWbsGo` at L33338–33342. `#erWbsGo` holds two buttons: `erGo('wbs')` ("Open the WBS split…" or "Split it by service…") and `erGo('clin')`.
  - `ER_AT.wbs='erWbs'` (L33241) is where the box opens when asked to open at the WBS.
  - `erRead()` (L33413), at L33420: a split or a prime keeps the stored `V.wbs`; anything else reads `#erWbs`.
  - `erChanges()` (L33434) compares `wbs` as trimmed text.
  - `erDraft()` (L33446) gives `wbs: ptype==='PRIME' || !!trim`.
  - `erUpdate()` (L33456–33467) shows and hides the field and its buttons.
  - `erGo(what)` (L33506) is where those buttons go: `clinGo(id)` for the CLIN drill, otherwise `toggleWbs('req', id, '')`.
  - `erSave()` (L33522) refuses a WBS over its limit at L33539.
  - **`reqApply(id, ch, D)`** (L33579, WBS at L33598–33599) writes the WBS only when the requirement is not a prime **and** holds at most one line **and** that line has no vector. It writes `S.wbs[id]=[{w:t, v:[]}]`, or deletes it. A split is never written from the box.
- **Classify** (L27393–27690).
  - `matCols()` (L27412) takes its columns from `recFields` of the requirement with the most fields, not from all of them. So **Classify already has a `wbs` column** (the `wbsQuick` button, or the CLIN-drill button on a prime). The `wbsSplit` column appears only if that widest requirement has a WBS line.
  - `matRows()` (L27427) filters by office and by the missing-field picker (`!f.set`).
  - `matBulk()` (L27441) has **no `wbs` entry**.
  - `matBulkOk()` (L27525) exempts `wbs` and `wbsSplit` explicitly (L27528: "free-form: no list to offer").
  - `matBulkRows(B)` (L27536) honours each entry's `B.applies(it)`. A WBS bulk entry would need `applies` to rule out a prime.
  - `matBulkPreview` is at L27549, `matApplyBulk` at L27562 (it leaves alone a row that already says the value), and `matBody` at L27582 (cells render `f.c`).
- **`reqNeeds(d)`** (L8487): the WBS rule is `add('wbs', d.ptype==='PRIME' || d.wbs)` (L8503). It is not waivable apart from the prime exemption.
- **`reqDraftOf(id)`** (L8511): `wbs: has('wbs')`, which reads `recFields().set`. A prime's WBS reads as set.
- **`reqDraftFrom(T, id, src, g)`** (L8537): true when the year's list has any line, unless it is a single line with no vector and a blank paragraph.
- **`pmoProposalGate(id)`** (L8548) is `reqNeeds(reqDraftOf(id))`.
- **`reqCreate(g, rec, from, f)`** (L33033), the one writer of a new requirement.
  - With `from` set, `NA_FROM_CARRY` (L32921, which includes `'wbs'` but **not** `clinWbs`) copies `T.wbs[id]` whole.
  - With `f.wbs` set, it writes `[{w:f.wbs, v:[]}]`, or deletes the entry when blank (L33066).

## 4. Needs attention: how a new list kind is added

There are four places in the board and one comment.

1. **`attLists(T)`** (L3542): add a key to `out={imp, ccar, oblig, awshort, awfix, neg, buy, code, si}` and push rows shaped `{id, rank:MR[id], funded, …}` in its `S.order` walk.
2. **`ATT_KIND`** (L3578): add an entry `{t: heading, go: button text, why: hint HTML}`.
3. **`attBody()`** (L3601): the header money column and the per-row cells branch on the value of `attOpen`, through the `money`, `cells` and total expressions. A new kind with its own column needs its own branch, or it falls through to "Funded".
4. **`attGo(k, id)`** (L3630): routes to a field. `'imp'` and `'ccar'` call `openEdit`, `'si'` calls `openEdit(id, 'si')`, and `'neg'` and `'code'` only select the row. A WBS kind would need `openEdit(id, 'wbs')`, or `clinGo` for a prime.
5. **The posture line** (`att` string, L25901–25916): add `ae(k, glyph, text)`. `ae` is defined at L25901.

Also update the comment on `let attOpen` (L3523).

Browser checks open these lists: `panels-render.mjs:58` (`attShow('oblig')`), `standards-check.mjs:321` and `keyboard-reach.mjs:443` (both `awfix`), and `dialogs-keyboard.mjs:56/145/184`. None asserts which kinds exist.

## 5. Pre-flight

`preflight()` (L16043) has **no WBS check of its own**. A WBS reaches it two ways:
- **In a PMO copy**, the `newreq` block (≈L16106) runs `pmoProposalGate`, which includes `reqNeeds`' WBS rule.
- **The `code` row** (≈L16140) reads `codeIssues()`, which catches a WBS over 40 characters.

## 6. The PMO copy

- **What travels.** `PMO_FIELDS` (L8043) includes `['wbs', FL('wbs')]` at L8064. **`clinWbs` is not on it.** `PMO_KEYS_V1` (L8082) leaves out `wbs`, so a copy from before v1.84 does not send it.
- **`pmoVal(state, key, id)`** (L8088): normalises a field so that an absent value and an empty one compare equal; an empty list reads as null.
- **`pmoNorm('wbs', v)`** (L8140–8152): the door check on an incoming WBS.
  - A value that is not a list, or a line that is not an object, is refused.
  - A vector whose width is not `SVC.length` is refused (`pmo-norm-wbs-width`).
  - Each line is normalised to `{w:String(e.w||'')}`, plus `v` (non-numbers made 0) when a vector is present.
- **`pmoBare('wbs', v)`** (L8963): compares a WBS as it is read, so `v:[]` and no `v` are one answer.
- **`pmoFmtVal`** (L9081): shows a WBS as its paragraphs joined by ` · `.
- **`pkgSvcEach`** (L9427): reorders each WBS line's `v` by service name, in a package's items, base and added requirements.
- **`pmoTake`'s added-requirement loop** (L9710–9715): passes `wbs` through `pmoNorm`. A refused one becomes `[]` and is named.
- **`pmoSubmitBuild()`** (L8436): diffs `wbs` against the year's baseline through `pmoVal` and `pmoSame`.
- **`pmoProposalOf(id)`** (L8552): carries `wbs: wbsReq(id).slice()` (L8557), and no CLIN WBS.
- **On the board.** `pmoAcceptProposal(r)` (L8703) writes `S.wbs[id]` from the proposal (L8738). `pmoApply()` (L9216) writes an accepted WBS edit with `jrnlSet(MS.cur, ['wbs', id], prop)` (L9327).
- **`clinLocked()`** (L26905): in a copy it alerts and returns true.
  - It **does block every CLIN WBS write**, because `wbsStore` calls it for `kind==='clin'`. `wbsAdd`, `wbsDel`, `wbsSetNum` and `wbsSetVal` still call `render()` afterwards.
  - A requirement-level WBS is **not** blocked in a copy.
  - `execWbsApply` counts CLIN proposals as `locked` and skips them (L16555).

## 7. Containers and the year

- **`REQ_MAPS`** (L6862) includes `wbs` and `clinWbs`. Three readers use it:
  - `reqPurge` (L6868) deletes both for an added requirement leaving the year for good;
  - `newReqSeq` (L6877) counts their keys when numbering a new requirement;
  - `yearCopy` (L6893) normalises from it, and its `cp()` lines at L6965–6966 copy `T.wbs` and `T.clinWbs`.
- **`IMP_CATS`** (L6578, rows at L6582/6584) names both in the import report.
- **`svcRemapState`** (L5978; `wbsPick` at L5997–5999) reorders the WBS vectors by service name (`remap-wbs-left`).
- **`clinRemove`** (L26988, the clear at L27000) clears an added CLIN's `clinWbs` when it is deleted for good.
- The labels `JRNL_NAMES` (L7498) and `PKG_DIFF_NAMES` (L10947) each name `wbs:'WBS'`.

## 8. The Spend Plan Source

- **Columns.** `SRC_HDR` (L14398) has `SRC_NCOL=32` columns (L14394). **Index 23 is `'Spares WBS'`**; index 25 is `'CLINs'` and index 31 is `'Cost Element'`.
- **Settings.** `SRC_COLW` is at L14402, `SRC_XTRA` at L14416, `SRC_GRAIN='svc'` at L14427, `SRC_BASIS='funded'` at L14428 and `SRC_YEARS='cur'` at L14429.
- **`srcLaneOf(it, T, lane)`** (L14452): `p.d` or `p.m` from `tiers()`; zeros if `T` has no entry for the requirement.
- **`srcSvcOf(it, T)`** (L14457): the two lanes added together.
- **`srcRowsOf(fy, St, T, rec)`** (L20263), per requirement in `St.order`:
  - **The date.** `dt` is the award date, or 31 August (`srcDefaultObl`, L14473). A day past the month's end is the month's last day.
  - **`datedOf(i, lane, v)`** (L20285–20299) returns `[[serial, amount]]`. A single award, or none, is one piece. An incremental award gives one piece per increment, from `landSvc(aw, i, d, m, true)`: `L.at[]` with `dv`/`mv`, plus `ud`/`um` on 31 August. This is the F2 rule.
  - **`emit(svc, amt, clin, lane, dt)`** (L20303) builds one row:
    - `r[0]` FY; `r[1]` the month serial; `r[2]` the CLIN's own CCaR, else the requirement's; `r[3]` the record title;
    - `r[4]` `budForRow(id, svc, lane)`; `r[7]` the event; `r[8]` the date; `r[9]` the amount; `r[10]` `srcAllocText`;
    - `r[12]` OPR; `r[13]` PID; `r[17]` obligation category; `r[18]` PMO; `r[21]` the SI code (si services only);
    - `r[25]` the CLIN number; `r[26]`/`r[27]` EEIC/RCN, from `rcnOfClinSvc` or `rcnAsgOf`.
    - **`r[23]` is never written.** It prints `''` on every line; confirmed by the jsdom probe.
    - `rec` collects `{id, svc, lane, clin, amt}` for `officeClinRecon`.
  - **The lines** (L20354–20366): for each service, for each of `['disc', lanes.disc]` and `['mand', lanes.mand]`, skipping zero, for each dated piece, `clinSplit(id, i, amount)`.
    - `[]` emits one line for the requirement.
    - Otherwise it emits one line per CLIN part over half a cent.
    - `clinSplit` (L26886) apportions whole dollars by the CLIN grid's per-service allocation (`clinVec`).
- **`exportSrc()`** (L20426):
  - refuses when `budInvalidLines` finds a chosen budget that cannot be used;
  - builds one tab per appropriation (only the page's own appropriation has rows);
  - asks before writing a file with blank Budget cells;
  - writes with `buildXlsx(sheets, SRC_XTRA)` and no house style;
  - says `srcGapNote()` (L14497) on the status line.
- **`officeClinRecon(T)`** (L20385): reads `srcRowsOf`'s `rec` lines.
- **`QPE_READS[23]`** (L20939–20955) records "the WBS paragraph the execution pull reads".
- **`qpeWrites()`** (≈L20964) calls `srcRowsOf(MS.cur, S)` **without `T`**. Every lane then reads 0, no rows are made, and `qpeWrites()` returns `{}` (confirmed by the probe). The QPE coverage panel can therefore never see a column ORBIT writes, column 23 included once it is filled. This is a latent defect, and no test calls `qpeWrites`.
- **Existing precedent for splitting drawn dollars over WBS lines.**
  - `aceAlignRows(id, T)` (L16669) uses `wbsResolve` and pushes a `'rem'` line for the unassigned remainder.
  - With `T`, it spreads the funded figure (d+m) for each service over the lines with `apportion(F[i], lines' v[i])` (L16722–16730).
  - It is used by the ACE alignment breakout (L34375), the aceBody expansion (L4098) and `rcnKeysOf` (L13488).

## 9. WBS from execution data and the ACE

- **`EXWBS_OK`** (L16452): `/^[A-Z]?[0-9]+(\.[0-9]+)*[A-Z]*$/`.
- **`srcWbsPara(v)`** (L16453): takes the text before a spaced dash, upper-cases it and removes spaces, then requires `EXWBS_OK`; anything else gives `''`.
- **`execRowsFor(fys)`** (L16462): the imported execution rows for this appropriation, `EXDB.all[slug].rows[fy]`, read by column position.
- **`execWbsScan(fys)`** (L16472):
  - reads `r[23]`;
  - matches a row to requirements by record name, else by CCaR number;
  - uses the row's CLIN (`r[25]`) for a prime that has that CLIN;
  - gathers per requirement or CLIN the paragraphs proposed, and reports conflicts and unmatched rows.
- **`execWbsApply(fys)`** (L16550): writes `[{w:para, v:[]}]` only where nothing is set, skips CLINs in a copy, then saves.
- **The panel.** `toggleExw`, `exwApply` and `exwBody` are at L4337–4420; `#exwPanel` markup is at L2390. Its menu item is `I.exw`, under Data › Execution — CCaR (L29765, L29844).
- **ACE functions.**
  - `aceNormWbs(v)` (L16603): upper-case, no spaces.
  - `aceWbsOf(id)` (L16606): the requirement's WBS lines plus all of its CLIN WBS lines, normalised and with duplicates removed. Its only caller is `aceSuggestFull`.
  - `aceLinesBy(k, ap)` (L16614): the ACE lines indexed by normalised WBS.
  - `aceSuggestFull(k, id)` (L16637) returns `{exact, roll, parents}`. A rollup matches any line starting with `w+'.'`, so the suffix-E line is a sibling, not a child.
  - `aceSetMap` (L16651) and `aceAmt` (L16834).
  - `ACE_PMO_ALIGN_DEFAULT` (L16584) carries the PSM-to-AV rule: `early:{PSM:'AV'}`, `later:{}`.

## 10. Tests

### Fixtures, and how they are built

- **Hand-built stores.** Most fixtures use `boot()` and `seed(ev, {services, items, disc, mand, order, …})` from `tools/export-audit/boot.mjs` (L80, L157), then sync `BASE_ITEMS` by hand. They assign `S.wbs`/`S.clinWbs` directly, or call `wbsStore(...)` in `ev`.
- **Exports** are captured one of three ways:
  - `buildXlsx` replaced to capture the sheets;
  - `w6Book` (audit-recon L1630), which reads the Blob bytes back with the board's `xlsxRead`;
  - `capture()` in boot.mjs.
- **The Add and edit boxes** are driven through their rendered controls, with `__set` (audit-other L1815/2199) and `boxSet`/`putIn` (audit-import L12946).
- **ACE workbooks** are built by the board's own writer through `__wb` (`buildXlsx`), with rows laid out **by `ACE_COL` position** by `__aceRows`:
  - audit-import L5700, in "v1.97 — typed money is held to the import door’s bound, through save, export and import (item 75)";
  - audit-recon L5822, in "v2.00 (U10) — a cost estimate, a BAE list, CCaR records or a destination change is refused in a locked view before anything is kept";
  - audit-recon L6076, in "v2.00 (U10) — a file, a package, the band ladder or a shared copy is refused in a locked view before anything is kept".

  These three break when the import starts finding its header and columns by title.
- **Every other ACE fixture** hand-builds `ACEDB.sets[...].lines` as `{ap, pmo, wbs, v}`: `dress2` (audit-recon L114–122), L1466, L3218, L3594, L5534, L5818, and `verify-file.mjs:390`.

### jsdom scenarios that exercise WBS (`const name`)

**audit-board.mjs**
- "v1.99 — a code longer than its limit is refused when typed and flagged when imported, never cut (item 91)": `wbsQuick`, `wbsSetNum`, `codeIssues`, the `code` list.
- "v1.97 — typed money is read whole, and a typo never zeroes a figure (item 75)": `wbsSetVal` (L4216).
- "v1.98 item 83 — an added CLIN deleted for good takes its RCN/EEIC and WBS; the next added CLIN starts clean".
- "v1.97 W4 — moving, renaming and removing a service moves its dollars with it, in every year (item 80)".
- "v2.08 — the defects found mapping item 122: …": the CLIN WBS write locked in a copy.
- "v2.08 — the review of the defect fixes: … WBS from execution in a copy …": `execWbsScan` stubbed, `exwApply`.
- "v2.09 — CLIN amounts and the row controls: …": the copy dims the CLIN WBS button (L6038–6040).
- "v2.09 third review — clin: a control that names its item by its place …": `wbsDel` in `#wbsBody` (L6429–6436).
- "v2.03 — a requirement’s fields are named in one place (item 20)".
- "whole dollars — a requirement added by its total": sweeps every figure of every export, `exportSrc` included.
- "an added requirement never inherits the data of a deleted one".
- "restore brings back what remove took".
- "MIPR type" (`matBulkOk()` must be `[]`).
- "a bulk write lands only where the field is offered".

**audit-other.mjs**
- "v2.07 — the Add requirement box (item 121)": the rail list including WBS; a prime is not asked for one.
- "v2.07 — the review of the Add box: rounding, an office named (AV), the marks, …": the WBS mark.
- "v2.08 — the edit box: the whole record, held until Save, written once (item 122)": a split WBS is shown and never retyped.
- "v2.08 — the review of the edit box: kept values, the WBS after OGC, …".
- "spend plan source", "budget names — the owner’s rule", and "v1.91 — the BAE budget in the RECORD panel": the Spend Plan Source Amount and Budget columns. None of them reads column 23.
- "v1.93 — Needs attention: every entry opens its list".

**audit-import.mjs**
- "exhaustive remap": the WBS vectors are remapped by service name.
- "handoff — out".
- "a copy proposes a new requirement".
- "v1.84 — the copy sends every field but the allocation": the WBS travels, and a WBS of the wrong width is refused at the door (L2190–2194).
- "scoped submittals".
- "v1.95 W3 — a submittal’s awards are matched to its services by name (item 51)".
- "v2.06 — add a requirement from another year, linked … (item 117)".
- "v2.07 — the Add box in a PMO copy (item 121)".
- "v2.07 — the review of the Add box: Roll forward, From another year, the budget gate, the reviewer": a null or blank WBS line, and the Ready column.
- "v2.08 — the second review in a PMO copy: what both sides agree on, …": a WBS compared as it is read.

**audit-recon.mjs**
- Spend Plan Source lines: "W7 — F2: the Spend Plan Source dates an incremental award a line per increment", "W7 — F6: a prime’s CLIN lines are whole dollars that add up", "W7 — F2: a single award on a day past its month’s end keeps its month", "v2.02 (E5) — an office’s planning share and the Spend Plan Source’s CLIN amounts, named apart and reconciled", and "v1.98 item 83 — a prime’s CLINs put each service’s money on its own RCN/EEIC, …".
- ACE: "the ACE tie-out", "v1.97 W6 — the ACE tie-out: every fiscal year held to that year’s own board and estimate", "v2.02 (D5a) — the ACE alignment breakout prints Funded beside each line’s allocation", and "v2.00 (U61) — an RCN / EEIC pointer of \"__proto__\" never loses or doubles money in the alignment lines or the ACE tie-out".

**Planted data**
- The hostile board (`hostile.mjs` L73, L83–85, L134) plants WBS and CLIN WBS values; L186 and L235 open `#wbsPanel`.
- The round-trip fuzz (`roundtrip-fuzz.mjs` L149–150, L200, L222) fills `wbs` and `clinWbs`.

### Browser checks

- **`layout-fits.mjs`**: M, the Add box, sets a 37-character `arWbs` (L585; checks L637–650). N, the edit box, sets `erWbs` the same way (L673; checks L697–710).
- **`keyboard-reach.mjs`** M: `arWbs` is among the fields Tab must reach (L694).
- **`panels-render.mjs`**: opens `wbsPanel` (L50), `editPanel` (L49), `matPanel` (L46), `attPanel` (L58) and `addPanel` (L76–88).
- **`dialogs-keyboard.mjs`**: knows the `wbsOpen` box (L64, L146). It also requires at least 10 text fields in `#addPanel` and checks Esc on each (L228–241). Making `arWbs` a `<select>` lowers that count.
- **`pointer-edit.mjs`**: the CLIN WBS button (L197, L553) and `wbsDel` in the box (L730–737).
- **`standards-check.mjs`**: measures every control in `#addPanel` and `#editPanel` (L494, L518).
- **`row-controls.json`**: the only WBS entry is `"row | button | toggleWbs('…','…','…') | log the WBS for this CLIN…"` (L55). The record-surface `openEdit` and `toggleRec` entries are the route to the edit box.

## 11. Mutation ids whose find strings sit in this code

Mapped by the top-level function each find string falls in. Where a recovery proof file names the catching check, it is given after the arrow.

- **`wbs*` functions**
  - `v199-wbs-inline-cut` (wbsSetNum)
  - `v197w1-guard-wbsSetVal` (wbsSetVal)
  - `v208-f6-wbs-open` (wbsStore) → audit-board "v2.08 — the defects…"
  - There are none in `wbsQuick`, `wbsAdd`, `wbsDel`, `wbsResolve`, `wbsParent`, `wbsLabel`, `toggleWbs` or `wbsBody`.
- **WBS from execution**
  - `v200-wbsscan-plain` (execWbsScan)
  - `v208-rv-exw-alerts` (execWbsApply) → audit-board "v2.08 — the review of the defect fixes"
  - `menu-wbs-not-in-data` (syncBtns)
  - There are none in `srcWbsPara`, `aceWbsOf`, `aceNormWbs` or `aceSuggestFull`.
- **WBS elsewhere**
  - `remap-wbs-left` (svcRemapState)
  - `v198-clinrm-left` (clinRemove)
  - `v209-w1-copy-wbs-live` (the copy's style) → audit-board "v2.09 — CLIN amounts"
  - `pmo-norm-wbs-width` (pmoNorm)
  - `v208-rv2-wbs-compared-as-stored` (pmoBare) → audit-import "v2.08 — the second review in a PMO copy"
  - `v207-121-prime-wbs-asked` (reqNeeds) → other "v2.07 — the Add requirement box"
  - `v207-121-wbs-unchecked` (arAdd) → audit-board "v1.99 — a code longer than its limit…"
  - `v207-121-prime-wbs-shown` (arUpdate)
  - `v207-rv2-wbs-mark-off-early`, `v207-rv2-wbs-mark-kept-for-prime`, `v207-rv2-wbs-mark-never-off` (arUpdate) → other "v2.07 — the review of the Add box"
  - `v207-rv-finnext-null-wbs` (arFinNext), and `v207-rv-draftfrom-blank-wbs`, `v207-rv-draftfrom-any-list` (reqDraftFrom) → audit-import "v2.07 — the review of the Add box…"
  - `v208-rv-wbs-by-stored-type` (erRead) and `v208-rv-wbs-one-line-unsplittable` (erUpdate) → other "v2.08 — the review of the edit box"
  - `v208-122-split-wbs-retypeable` (erUpdate) → other "v2.08 — the edit box"
  - `v199-code-cut` (codeTake), `v199-code-pid-unlisted`, `v199-code-ccar-unlisted`, `v199-code-check-creates` (codeIssues), `v201-pid-limit-20` (codeMax)
- **`srcRowsOf`**: `src-lanes-summed`, `src-budget-ignores-lane`, `src-budget-made-up`, `w7-src-inc-one-line`, `w7-src-inc-day-rolls`, `w7-src-inc-rest-dropped`, `w7-src-inc-lane-ignored`, `w7-src-inc-lane-alone`, `src-single-day-rolls`, `v198-src-clin`, `v204-108-clin-src-requirement`.
- **`exportSrc`**: `src-no-warning`, `src-invalid-printed`, `v200-u37-guard-exportsrc`, `v204-113-house-everywhere`.
- **`srcLaneOf`**: `src-basis-allocation`, `src-drops-mandatory`.
- **`clinSplit`**: `clin-split-fraction`, `clin-split-even`.
- **`aceAlignRows`**: `v198-ace-nosplit`, `v198-ace-rest-dropped`, `v200-uproto-plain-grp`, `v202-d5a-funded-is-allocation`, `v202-d5a-funded-on-first-line`.
- **Classify**
  - `mipr-no-bulk-setter`, `mipr-bulk-writes-label`, `v200-u41-bulk-blank`, `v200-u56-*` (3), `v200-u44-awards-bulk-every`, `v208-f7-rcnsvc-*` (2), `v208-rv-rcnsvc-everywhere`, `v208-rv2-bulk-office-counts-proposal` (all in matBulk)
  - `bulk-lands-everywhere` (matBulkRows)
  - `v208-f3-bulk-rewrites-same` (matApplyBulk)
  - `v199-mat-preview-clinown` (matBulkPreview)
- **Needs attention**
  - `att-oblig-funded-only`, `att-oblig-rank-only`, `att-awshort-disc-only`, `w3-attn-repairs-hidden`, `v197w1-neg-not-listed`, `v199-buy-bad-not-listed` (attLists)
  - `att-go-not-selected`, `att-go-no-field`, `v200-u41-goto-row-only` (attGo)
  - `v209-w4-goto-says-record-panel` (ATT_KIND)
- **Containers and the year**: `v198-reqmaps`, `reqmaps-drops-band` (REQ_MAPS); `year-drops-a-container` (it drops `cp(T.mipr…)`, not the WBS) and eight more `year-*`/`v20x` ids in yearCopy.

## 12. What I could not find, and inconsistencies noticed

- **No test reads Spend Plan Source column 23.** None calls `srcWbsPara` or `qpeWrites`. `execWbsScan` is only ever stubbed.
- **NEXT-VERSION item 132 says "Classify has no WBS column or bulk set".** It has the column, as a `wbsQuick` button. It has no bulk set.
- **The board and the edit box disagree about one line with a stored vector.** `wbsResolve` ignores it and takes the parent whole, while `erStored` treats it as a split. Only a file can produce one.
- **WBS split vectors are allocation dollars** (`wbsParent` = `svcAlloc`/`clinVec`), never the draw. Splitting the Spend Plan Source's drawn dollars per paragraph needs a proportional rule; `aceAlignRows`' `apportion` is the existing one.
- **The import door has no WBS shape check** beyond its generic depth, text and number rules. `IN_ID_MAPS` does not include `wbs`.
- **`attBody`'s PMO column prints `it.grp`, not `grpOf(it)`.** An office move made on the board is not shown there.
- **No WBS name, level or CES column is read anywhere**, as item 132 says.
- **`srcRowsOf` has a dead variable** (`alc`, L20268).

## ba

# Budget authority and PPBE positions: code map for v2.12 items 132 and 134

Line numbers refer to `/home/user/orbit-board/prioritization-board-grid.html` as it stands now (37,801 lines). Tests live in `/home/user/orbit-board/tools/export-audit/*.mjs` and `/home/user/orbit-board/tools/*.mjs`. `mutate.mjs` was read as text only, through `tools/export-audit/mut-json.py` (`python3 -I`). No file was changed.

Items 132 and 134 were read first. Item 134 (budget authority read live from the PPBE position) is the one this area serves. Item 132 touches this area only through the ACE import, which is not mapped here.

---

## 1. Where a year's budget authority lives (`S` is one year's state)

### Data shape

Each year has its own budget authority, kept in `MS.years[fy]`:

```js
S.bm = {
  disc: [$ per SVC index],        // discretionary base, whole dollars
  mand: [$ per SVC index],        // mandatory base
  adds: [ {name:'Congressional Add' /*≤40 chars*/, pool:'disc'|'mand', vec:[$ per SVC index, may be negative]} ],
  pp:   {key:'BES|2028', fy:2027, ts, by, cov:['USAF',...], disc:[...], mand:[...]}   // optional; written only by bmSeedFromPp
}
S.discSvc = [...]; S.mandSvc = [...]   // the effective budget authority, a DERIVED cache: applyBudget() rewrites it from S.bm
S.discBA / S.mandBA                    // legacy scalars, read once for seeding, then deleted (6326)
```

- Every vector is positional by `SVC` index. The positions (`MS.ppbe`) are keyed by service **name**.
- `JRNL_SKIP` (7368) leaves `discSvc` and `mandSvc` out of the change journal, so it holds `S.bm` edits and not the cache. `JRNL_NAMES.bm = 'budget'` (7502).

### `applyState(st)` (6260): seeding and normalising

- **The 85% / 15% seed (6311–6323).** `DATA.budget` is padded or cut to `SVC.length`, and `prorate = (vec,tot)=>apportion(tot, vec)`. It runs only when `S.discSvc` is missing or the wrong width:
  - `discSvc = apportion(S.discBA ?? Math.round(budT*0.85), DATA.budget)`
  - `mandSvc = apportion(S.mandBA ?? budT − Σdisc, DATA.budget)`
  - Then `delete S.discBA; delete S.mandBA`.
- **6327.** `if(!S.bm) S.bm={disc:S.discSvc.slice(), mand:S.mandSvc.slice(), adds:[]}`.
- **6338–6356.** `money()` and `fit()` make every vector numeric, whole dollars (`D$`), and `SVC.length` wide. `bmTot` (6353): a base saved with fractions is re-apportioned to its rounded total (v1.97 item 72). Each `adds[].vec` goes through `fit()`.
- **6370.** `applyBudget()` runs on every `applyState`, so `discSvc` and `mandSvc` are always rebuilt from `S.bm`.

### `applyBudget()` (26127)

```js
d = bm.disc + Σ adds where pool!=='mand';  m = bm.mand + Σ adds where pool==='mand'
S.discSvc = d.map(v=>max(0,D$(v)));  S.mandSvc = m.map(...)
```

- Added sources count in budget authority by service and by lane, through their own `pool`.
- They are folded into the effective figure. Only the Budget Management panel shows them apart.
- The effective figure is floored at 0 per service. A negative add, such as a rescission, is allowed (`bmSrcSet` reads with `{neg:true}`).

### `discTot()` and `mandTot()` (25550–25551)

Each is the sum of `S.discSvc` (or `S.mandSvc`).

### The Budget Management panel

- `#bmPanel` markup is at 2525. `toggleBm` is at 25266; `bmBody` (25271) is drawn from `render()` (29071).
- It is reached from the Fund mode's "Budget management" button (1933) and from the menu item `I.bm` (29782, placed in the Fund tools at 29880).
- `bmBody` draws `bmPpRow()` first, then:
  - the Discretionary (base) and Mandatory (base) rows: inputs calling `bmSetBase('disc'|'mand', i, value)`;
  - one row per add: a name input (`bmSrcSet(k,'name',…)`), a pool select (`bmSrcSet(k,'pool',…)`), a box per service (`bmSrcSet(k,'vec',i,…)`) and ✕ (`bmSrcDel(k)`);
  - the EFFECTIVE Discretionary and Mandatory rows, from `S.discSvc` and `S.mandSvc`;
  - "＋ Add funding source" (`bmAddSrc`).

| Function | Line | What it does |
|---|---|---|
| `bmSetBase(kind,i,val)` | 26135 | Reads with `parseAmt`, refuses through `amtNo`, accepts `v>=0`, then `applyBudget(); save()`. |
| `bmAddSrc()` | 26141 | Asks for a name; pushes `{name, pool:'disc', vec:zeros}`. |
| `bmSrcSet(k,field,i,val)` | 26148 | Sets the pool, the name or one vector cell (signed). |
| `bmSrcDel(k)` | 26155 | Confirms, then splices the add out. |

None of these call `allocLocked()`. Budget Management is therefore **editable in a PMO copy**: its CSS lock (2832–2842) does not name these handlers, and `bm` is not in `PMO_FIELDS` (8043), so nothing edited there travels back. In a locked cycle view, `save()` (7607) refuses (`if(CYCVIEW) return cycRefuse('Saving')`) and the year is put back.

### "Take from a PPBE position": a one-year copy (25955–26125)

| Function | Line | What it does |
|---|---|---|
| `bmPpLbl(key)` | 25982 | `'BES|2028'` → `'BES28'`. |
| `bmPp()` | 25986 | `S.bm.pp` or null. |
| `bmPpVec(key, fy)` | 25990 | `P=MS.ppbe[key]`. For each SVC name in `ppSvcsOf(P)`, `ppSvcFy(P,sv,fy)` gives `d` and `m`. Returns `{d:[], m:[], covered:[names], tot, absent:[SVC the position does not name], outside:[position services not on the board]}`. A service the position does not name stays 0 in the vector and is listed as absent; it is never treated as a zero. |
| `bmPpOptions()` | 26010 | Positions with at least one covered service and `tot>0.5` for `MS.cur`. |
| `bmPpState()` | 26018 | Compares `S.bm` with `pp.disc`/`pp.mand` (**edited**) and `bmPpVec(pp.key, pp.fy)` with them (**moved**). Returns `{pp, cov, edited, moved, gone, now}`. It uses `pp.fy`, not `MS.cur`. |
| `bmSeedFromPp(key)` | 26031 | `MS.cur` only. Confirms listing old → new per covered service; `absent` is LEFT ALONE and `outside` IGNORED. Writes `S.bm.disc[i]=D$(v.d[i]); S.bm.mand[i]=D$(v.m[i])` for covered services, then `S.bm.pp={key, fy:MS.cur, ts, by:whoAmI(), cov, disc:copy, mand:copy}`, then `applyBudget(); save(); render()`. Adds are untouched. |
| `bmPpClear()` | 26063 | `delete S.bm.pp`; no figure changes. |
| `bmPpRow()` | 26072 | The panel row: a `<select onchange="bmSeedFromPp">` and five state messages (gone; moved and edited; moved; edited, with "Departed on" per service; matches). |

The design comment at 25955 says this is deliberately "A SEED, NOT A LINK". Item 134 reverses that.

**Gaps in the copy path:**
- `svcRemapState` (5978) remaps `bm.disc`, `bm.mand`, `adds[].vec`, `discSvc` and `mandSvc`, but not the positional `S.bm.pp.disc`/`pp.mand`.
- Roll forward (`switchYear`, 6735) copies `S` whole, so the new year's `bm.pp` keeps the old `fy`.

---

## 2. `MS.ppbe`: the official positions (board-wide per appropriation, not per year)

- **Created** in `applyStore` at 6710 (`if(!MS.ppbe) MS.ppbe={}`). Its comment still shows the v1 shape.
- **Key.** `cyc+'|'+yr`, for example `'BES|2028'`. `ppKey()` at 23570 uses the editor state `ppCyc`/`ppYr` (`let` at 22029). `PPBE_CYCLES=['POM','BES','PB','DoN']` (23560). This is the same shape as `blKey(cyc,yr)` (22047) and `MS.cycle`.
- **v2 shape** (`ppNorm`, 23617, pure; converts v1 `{svc:{fy:$}}` or `{svc:{ce:{fy:$}}}` into a `_legacy` or `ce_<name>` line):

```js
{v:2, split:bool,
 lines:{ <svcName>: [ {k:'si_LA', si:'LA'} | {k:'ce_<costElem>', ce} | {k:'_all', all:true} | {k:'n…', rcn:'', eeic:''} | {k:'_legacy', legacy:true} ] },
 val:  { <svcName>: { <lineKey>: { <fy>: {d:$, m:$} } } },
 unit: { <svcName>: 'k' },                                   // v2.06: figures entered in $K (display and input only; stored in $)
 kx:   { <svcName>: {t, by, n, from, to, cells:[[lineKey, fy, 'd'|'m', $]]} } }   // the ×1,000 record, for undo
```

- `split:false` means one figure per line, kept in the `d` slot: an unsplit position is **all discretionary** as `bmPpVec` reads it. Any `m` left over from an earlier split stays and is still summed.
- **Line kinds** (`ppKind`, 23647): O&M USAF/ANG/AFRC → `rcn`; other O&M → `si`; Full Fund → `ce` (`COST_ELEMS`); others → `none` (`_all`). `ppSeed` is at 23653.

### Readers and writers

| Function | Line | What it does |
|---|---|---|
| `ppPos()` | 23660 | Normalises `MS.ppbe[ppKey()]` in place and returns it (the editor's writer path). |
| `ppLines` / `ppLineLbl` | 23665 / 23670 | The lines of a service; their labels. |
| `ppCell(P,sv,k,fy)` | 23678 | `{d:+c.d||0, m:+c.m||0}`. |
| `ppKeysOf(P,sv)` | 23684 | Every line key, including value keys whose line was removed. |
| `ppSvcFy(Praw,sv,fy)` | 23690 | **The per-service, per-year reading.** Sums every line: `{d, m, t:d+m}`. |
| `ppSvcsOf(Praw)` | 23695 | Every service name in `lines` or `val`. |
| `ppSumFy(Praw,fy)` | 23837 | Every service's `t`. |
| `ppUnitK` / `ppAmtText` / `ppAmtIn` / `ppAmtShow` | 23708–23716 | $K entry: a bare number has `'K'` appended and is read through `parseAmt(…,{neg:true})`; display divides by 1,000. |
| `ppSvcFigs` / `ppSvcSum` | 23722 / 23728 | |
| `ppUnitSet(sv,u)` | 23733 | Turning $K on optionally multiplies existing figures and records `P.kx`. Has a `cycBlock` guard. |
| `ppUnitUndo(sv)` | 23766 | |
| `ppSetV(sv,k,fy,which,val)` | 23789 | **The cell writer.** Own-key guards; deletes a cell that is zero in both lanes; `save(); render()`. No `cycBlock` (save refuses in a view). |
| `ppSplitSet`, `ppLineAdd/Set/Del`, `ppDel` | 23800–23822 | |
| `ppTotCell` | 23831 | |
| `ppBody()` | 23842 | The panel `#ppPanel` (markup 2504, `toggleP2` 23564): cycle and cycle-year pickers, a "Logged" chip list, the split radio, one service at a time with $/$K, the line table across `ppYears()` (`ppYr-2…ppYr+4`), a service TOTAL, the roll-up by service including services no longer on the board, and ALL SERVICES. |
| `ppLblTxt` / `ppLbl` | 23562 / 23563 | `'BES|2028'` → `'BES28'`; `ppLbl` is escaped. |

### Service rename, removal and the change journal

- `svcRenameKeys` (3907–3914) re-keys `P.lines`, `P.val`, `P.unit` and `P.kx` by name.
- `svcListBlock` (3866–3873) refuses a rename onto a name a position still holds.
- `MS.ppbe` is outside the change journal (the comment at 23731 says so; `jrnlSnap` snapshots only `MS.years`).

### `fydpPosKey` no longer exists

Item 134's text cites it; it went with the old five-year plan sheets in v2.04, item 112. The closest equivalents today:
- `fdcState` (24611) defaults the cycle to `MS.cycle` when that is logged, else the newest logged.
- The Spruills' "Budget source" (`spFund`, `let` at 22009) is chosen by hand.

### The import check does not check position amounts

- `inShapeWhy` (around 11640) checks `discSvc`, `mandSvc`, `discBA`, `mandBA`, `bm.disc`, `bm.mand` and `bm.adds[].vec` with `inAmtsWhy` (11649–11653).
- I found **no amount check on `MS.ppbe[*].val` cells**. Only `codeIssues()` (11537) reads `ppbe` line RCN/EEIC lengths. A cell is therefore bounded only by the general number rule (±1e15). A string there is read as 0 by `ppCell`.

---

## 3. Cycle tag, reference, lock and view

- **`MS.cycle` and `MS.cycleRef`** are created at 6711–6712. Both are per-appropriation store fields: **one tag for every year** of the working plan, not one per year.
- **`cycSetWorking(cyc, yr)`** (22316): refuses in a view (`cycBlock`), sets `MS.cycle=blKey(c,y)` or `''`, then `save(); render()`.
- **`cycRetagNext()`** (23198) uses `cycNextOf` (23192): PB→BES yr+1, POM→BES, BES and others→PB.
- **`cycLock()`** (22098) also **tags an untagged plan with the lock's key** (`if(!MS.cycle) MS.cycle=key`, 22151) and sets `MS.cycleRef=key`.
- **`cycProjOf()`** (22076): one year's projection. **A lock does store budget authority:**

```js
{fy, ap, ts, by, svc:SVC.slice(), disc:S.discSvc.slice(), mand:S.mandSvc.slice(), bands, reqs:[{id,title,grp,ccar,pid,band,mc,ask,alloc,d,m,fund}], pmo:{g:{ask,alloc,fund,n}}}
```

  `alloc` is `fund` for an `fsrc` row and `svcAlloc` otherwise.
- **The stored cycle.** `blStore()[key]={cyc, cycYr, base, window, ap, ts, by, note, from:MS.cycle, locked, partial, years:{y: whole copy of MS.years[y] (S.bm with adds and pp included)}, proj:{y: cycProjOf via aceWithYear}, rcn, keep:cycKeepNow(), keepV}`. `persistCyc` is at 3166.
- **`cycKeepNow()`** (23333) keeps the destinations, bands, BAE rows, PMOs, data pack, flow and services. It does **not** keep `MS.ppbe`. The hint at 23544 says the PPBE positions "are read as they are now for every cycle".
- **`cycView(key)`** (23269) and **`cycCopy(c)`** (23294): the view is `V=copy of the working MS` with `V.years=c.years`. Inside a view:
  - `MS.ppbe` and `MS.cycle` are **today's working values**;
  - each year's `S.bm` and `discSvc` are as locked, because `applyState` rebuilds `discSvc` from the locked `S.bm`.

  If live budget authority reads `MS.ppbe[MS.cycle]`, a view would read today's position unless the lock keeps one. Item 134 says locks keep the position as it was locked.
- **Other readers of a lock's budget authority:**
  - `blBody` table, Disc BA and Mand BA columns from `P.disc`/`P.mand` (23513–23533);
  - `cycDelta(fy)` (23103), `pots:{discWas:sum(P.disc), discNow:discTot(), …}` (23140);
  - `cycCmpData` (22900), `pots.disc/mand` from `fydpSum(PA.disc)` and `PB.disc` (22911);
  - `posTake` dated snapshots store `disc`/`mand` (25081).

---

## 4. How the engine reads budget authority, and every surface that prints it

### The engine

- **`tiers(ord, scen)`** (25576): `dRem=S.discSvc.slice(), mRem=noMand? zeros : S.mandSvc.slice()` (25591). It walks `S.order`; each requirement's `basisSvcOf(it)` draws per service, discretionary first, then mandatory.
  - A split `fsrc` draws `min(dv[i], dRem, basis)`, then `min(mv[i], mRem, basis−dd)`.
  - A scalar source goes through `scalarSrcVec` (25562).
  - Returns `out[id]={cum, tier, d, m, u, dT, mT, uT, spill, set, dryA, mDryA, natM, natU}` and `out.__rem={dRem, mRem}`.
  - Budget authority enters only through `S.discSvc` and `S.mandSvc`. The scenario `{noMand:true}` comes from `scenOpt()` (21394) when `scenView==='disc'`.
- **`tierTotals(T)`** (25774): `dUsed, mUsed, uAmt, u1Amt, u2Amt` and the counts, plus `mcCalc`. It does not itself read budget authority. `mcCalc` (25704) puts `bySvc[].ba=S.discSvc[i]` (25715).

### Every surface that prints budget authority

| Surface | Code |
|---|---|
| Scorecards (`#scores`) | `scoreboard()` (25795): `dBA=discTot(), mBA=mandTot()`; `dLeft`/`mLeft` from `T.__rem` floored per service; tile 1 "BA:", tile 2 "Program floor (Discretionary BA + MC need)" `floor=discTot()+mcNeed`, tile 3 "BA:", tile 4 "Whole budget" `dBA+mBA`. |
| Collapsed strip (`#scMini`) | Also in `scoreboard()`. |
| Funding posture (`#posture`) | `scoreboard()`, about 25904–25932: "Discretionary $X BA · $Y left", "Mandatory …", and a meter over `dBA+mBA`. |
| Funding posture hand-off to the KPI cards | `window.UI_KPI={…dBA, mBA…}` → `uiKpis()`. |
| Discretionary fit strip (`#fitBar`) | `fitBySvc(T)` (3360): `ba=S.discSvc[i]`, `used`, `left=max(0,ba−d)`, `over=m+u`. `fitCounts` (3350); `ndStripChip` (3498). |
| Cutline banners in `render()` | 29115–29137, from `discTot()`, `mandTot()`, `S.discSvc[svcFilter]` and `scenMand()`. |
| Funding by service table | `svcSummary()` (26292): Disc BA `S.discSvc[i]`, Mand BA `scenMand(i)` (21406), totals `discTot()` and `scenOn()?0:mandTot()`. |
| Fit chart | `fitChartSvg(T)` (26182): `dBA`, `mBA`. |
| On-screen PMO matrix and cost-element summary | `pmoMatrix()` (27962) BUDGET AUTHORITY row at 28015–28017; `ceSummary()` (28111) at 28160–28162. |
| Excel, PMO Matrix and Cost Element Matrix sheets | `matrixSheet` → `baBlock(rows)` (34617): "BUDGET AUTHORITY" per service Disc and Mand plus totals, "REMAINING (lanes)" and so on. |
| Excel, Funding Streams sheet | 34684–34707: Disc BA and Mand BA columns per service, the TOTAL row, and the "Discretionary topline" row (`mcMemo.discBA`). |
| Excel, Decision Bands sheet | Prints **no** budget-authority row. |
| Priority Drill (`exportCSV`, 33665) | Summary tab "BUDGET AUTHORITY" Discretionary / Mandatory / Whole budget (33800–33801). |
| Two Spend Plans | `planCompute()` (21351): Plan A topline `S.discSvc`; Plan B topline `discSvc+mandSvc`. |
| Proposed order walk | `edCompute` (21909): `edWalk(i, discSvc[i])`, then disc+mand. |
| Service removal message | `svcHeldBy(i)` (4027): `v.ba=discSvc+mandSvc` per year. |
| Live view peers | `livePeerSum` (31390) reads `Y.discSvc`. |
| Spruills | `spGather()` (24133): `block.bud[y]=Σst.discSvc+Σst.mandSvc` from **each stored year object's cached `discSvc`** (24181), for this and other appropriations. `spBodyDraw` (24400): with `spFund` set to a position key, `b.bud[y]=ppSumFy(P,y)` or `undefined` (24417–24426); the options are "board", `'bl|'+lock`, and each position key. |
| Spruills PMO drill | `pmoDetail` (24189): Controls are "board" (the PMO's allocation via `spOwnYear`), a lock (`blPmoAlloc`, 22288), or a position (`ppSvcFy(P,sv,y).t`, 24249–24254). |
| FYDP Disconnects | `fdcStores()` (24547): this appropriation's `MS.ppbe`; others through `fydpStoreLocal` (22648) or the folder (`fdcFolderRead` 24573, `fydpStoreFolder` 22663). `fdcModel` (24638): `pos(ap,svcs)` sums `D$(ppSvcFy(Q,sv,y).d/.m)` per year; null where `!fdcPosHeld(Q,y)` (24603). The cycle comes from `fdcState` (24611). |

### Trace matrix (`/home/user/orbit-board/tools/trace-lib.mjs`)

- Quantities: `discBA: 'Σ[svc] discSvc'`, `mandBA: 'Σ[svc] mandSvc'` (lines 12, 25–26).
- Surfaces that state them (`/home/user/orbit-board/tools/trace-stated.json` 15–30):
  - engine (tiers): `discTot()`/`mandTot()` (lib 88);
  - locked cycle (projection): `sum(P.disc)` (112);
  - locked view (drill): 127;
  - dashboard (screen): regex on the `.sc.disc`/`.sc.mand` "BA: $" text (152–153);
  - xl · Funding Streams: `cellAt(fs,/^Service$/,'Disc BA',/^TOTAL$/)` (169–171);
  - cycle deltas (panel, now): `D.pots.discNow/mandNow` (240).
- Truth in `/home/user/orbit-board/tools/trace-matrix.mjs` 68–69: `sum(FIX.disc)`, `sum(FIX.mand)`.
- Notes:
  - trace-lib's 1b block runs `cycLock()`, which tags an untagged plan.
  - trace-lib 306 restores `MS.cycle` and `MS.cycleRef`.

---

## 5. What "a requirement holds (directed Disc and Mand)" is in code

- **`svcAllocAsSaved(it)`** (25527): for `fsrc={m:'split', dv, mv}` it returns `D$(dv[i])+D$(mv[i])` per service (the directed figures **are** the allocation). Otherwise:
  - `S.alloc[id]` with `m:'s'` gives that vector;
  - `m:'t'` gives `apportion(v, ask)`;
  - none gives the ask.
- **`svcAlloc(it)`** (25524) floors each service at 0.
- **`basisSvcOf(it)`** (25754): `min(D$(alloc[i]), max(0,D$(ask[i])))`, the clamp to the ask.
- **Per-lane "holds" exists only for a split row.** `fo.dv[i]` and `fo.mv[i]` (`S.fsrc[id]`, shape comment at 6285) are the typed Disc and Mand. A row on the lane walk or a total allocation has a per-service allocation, but the lane is decided by `tiers()`.
- **`fsDirVec(it)`** (21281) is the existing "directed per service per lane, clamped" reader, used by the Two Spend Plans (`planWant` 21314, `fsDirected` 21295):
  - split: `d=min(dv,basis)`, `m=min(mv, basis−d)`;
  - legacy split: `scalarSrcVec`;
  - disc or mand: the whole basis in that lane;
  - ufr: zeros;
  - no override: `null`.
- **`seedSplit(id,T)`** (32283) writes `{m:'split', dv:p.d, mv:p.m}` unrounded. `setFsrc` (32294), `convertAllToSplit` (32306), `migrateSplit` (32322), and `setFsrcSvc(id,'d'|'m',i,val)` (32337: seeds on the first keystroke, guarded by `allocLocked`).
- **Not drawn (the fit-to-position precursor):**

| Function | Line | What it does |
|---|---|---|
| `ndData()` | 3463 | Cached in `_ndCache` (`let` 3805; cleared at the top of `render()` 29061). Always runs bare `tiers()`, the funded plan. For each split row and service it adds a line where `drewGap(typed, drawn)`: `{id, rank, i, lane:'d'|'m', typed, drew, gap, short, why}`. `why` is "requirement value stops at $X" when `drew ≥ basis(−dD)`, else "\<svc\> discretionary/mandatory ran out above this rank". Returns `{list, ids:{id:Σgap}, n, tot, shortAll}`. |
| `drewGap` / `drewWhy` | 3425–3434 | |
| `ndRowTip` / `ndRowChip` | 3509 / 3513 | |
| `ndBody()` | 3647 | The `#ndPanel` fix list; offers no fixes in a copy. |
| `ndSetDrawn(k)` | 3676 | `setFsrcSvc(g.id, g.lane, g.i, round(g.drew))`. |
| `ndSetAll()` | 3685 | Confirms, then writes `fo.dv/mv[i]=round(drew)` for every line, then `save(); render()`. |
| `ndOpenRow` | 3697 | |

  The posture's Needs attention puts "▲ N not drawn" (25910) beside the `attLists(T)` entries (3542; keys `imp ccar oblig awshort awfix neg buy code si`; `ATT_KIND` 3585). Nothing in code compares the requirements' directed Disc and Mand with budget authority (or a position) per lane: the only "over" today is a split figure that a lane cannot draw.

---

## 6. The UPL concept today (not item 134's UPL)

There are three unrelated uses, all different from item 134's "added sources nobody has allocated, shown as UPL":

1. **Funding realignment pots** (§09, 4505 onward).
   - `S.upl` holds marks keyed `'x|<title>'`, `'x<fy>|<title>'` (execution titles) or `'r|<id>'` (board requirements).
   - `rlgUplMap` 4553, `rlgUplKey` 4559, `rlgIsUpl(key,fy)` 4561, `rlgToggleUpl` 4566, `rlgToggleUplAll` 4590.
   - `rlgUplScan` (4732) also reads execution rows flagged in column 17 or 20 = UPL (`flowIsUpl`, 17404).
   - Marked pots are spent first in the solves (5057, 5149). They print in the realignment panel (`rlgBody`, around 5331–5790) and its export ("Covered by UPL already free", 4856).
   - `upl` is on `REQ_MAPS` (6860, keyed `'r|'+id`, purged at 6869), copied by `yearCopy` (6981), listed in `IMP_CATS` (6583), and read by `flowPlanRecs` (18611).
2. **The obligation category `'UPL'`** in `OB_CATS` (16334).
3. **The funds flow "Unfunded Priority List"**: `F.upl` (18687–18697), `flowUplTo` 'aside' or 'LM' (17396), the "Unfunded (UPL)" sheet in `exportFlow` (19924), and the drill text at 19521.

**Added funding sources** (`S.bm.adds`) are by lane (`pool`) and by service (`vec`), counted only through `applyBudget`, and shown only in `bmBody`. Nothing tracks how much of an add is "allocated to a requirement".

---

## 7. Year handling and other appropriations

- **`aceWithYear(fy, fn)`** (16767): sets `MS.cur`, `applyState(MS.years[fy])`, runs `fn`, and in `finally` restores the year on screen. Every other-year budget authority is rebuilt from that year's `S.bm` by `applyState` → `applyBudget`. Callers: `cycLock` (proj), `fydpData` (22354), `spOwnYear` (24064), `flowPlanRecs`, the realignment pools (4970), `aceScan`, and others.
- **New years:**
  - Roll forward copies `S` (budget authority and `bm.pp` included), in `switchYear` (6735).
  - `freshYearState()` (6553) is blank: `discSvc` and `mandSvc` zero.
  - `firstYearState()` (6560) has no `discSvc`, so the 85/15 seed applies.
  - `pmoYearStart` (9388) is a PMO copy's start of a year.
- **Other appropriations' stores:** `fydpStoreLocal(k)` (22648) reads `localStorage[_SLUGMAP[k].key]`, or the file's `PUBS[k]` when newer. Each has its own `ppbe`, `cycle` and `years`. `cycStoreOf(k)` (3170) reads cycles; `cycOverview` (22171) reads each one's `st.cycle` tag. The Spruills reads another appropriation's **stored** `st.discSvc` caches without recomputing (24181).
- **`spDefs()`** (24104) builds `{name, data, ms, ppbe, slug}` per appropriation, from storage, then `PUBS`.

---

## 8. Doors, remapping and copies that touch budget authority and positions

- **Import check:** `inShapeWhy` amounts at 11649–11653 (above). `arityOfState` (5933) uses `bm.disc` as one width source.
- **`svcRemapState`** (5978): remaps `bm`, `adds`, `discSvc` and `mandSvc`, not `bm.pp` vectors.
- **Appropriation package diff:** `bm` → "budget authority" (10909); `ppbe` compared at 10933–10934; `PKG_DIFF_KNOWN.bm` (10945).
- **PMO copy:** `MS.ppbe` travels whole (audit-import "handoff — out" checks `MS.ppbe`, `cycle` and `cycleRef` intact, line 901). Budget Management and the positions are editable in a copy and not sent back.
- **Labels:** `JRNL_NAMES.bm` (7502); the door's container labels `discSvc` and `mandSvc` (10953).

---

## 9. Tests that exercise this area, and how their fixtures are built

### The shared harness

- `boot()` and `seed(ev, {services, items, disc, mand, order, mc, fsrc, alloc})` are in `/home/user/orbit-board/tools/export-audit/boot.mjs`, lines 157–186.
- `seed` builds a year state with `discSvc:disc, mandSvc:mand`, calls `applyState` (so `S.bm` is created from them), pushes the items, then writes `S.discSvc` and `S.mandSvc` again directly.
- Most suites follow it with `BASE_ITEMS.length=0; DATA.items.forEach(…BASE_ITEMS.push…)`.
- `MS.cycle` is `''` unless a test sets it, so a fixture that does not tag its plan sees no change if budget authority goes live.

### audit-board.mjs (`/home/user/orbit-board/tools/export-audit/audit-board.mjs`)

- **The `SCENARIOS` loop** (41–318). Each key is its own scenario name: 'plain order, lanes run dry partway', 'nothing funded — every dollar unfunded', 'must-pays that the discretionary lane cannot cover', 'must-pays fully covered by discretionary', 'trimmed rows, partial coverage'. It reads the tiles' figures off the DOM (`.sc.disc` "BA: $", floor, whole), with truth from `sum(sc.disc)` and `sum(sc.mand)`.
- **Other scenarios:**
  - 'Spruills reads the board it is on' (1040)
  - 'v1.95 — the Spruills by service, by year and for another appropriation' (1097; `bmSetBase` per service)
  - 'a recorded funding source moves no money' (1158)
  - 'directed vs drawn — a lane too short for what was directed' (1527)
  - 'a directed split states its own allocation' (1623)
  - 'every requirement takes a typed Disc and Mand' (1864)
  - 'trim absorption — what the remaining lane could take' (2096)
  - 'PPBE cycles — the lock is the window, frozen' (2253; `spFund='bl|PB|…'`)
  - 'PPBE cycles — a locked view is read-only and leaves no trace' (2373)
  - 'v2.02 (D5c, D6a, D7b, D7c) — whole dollars from a position, …' (2665). This is **the only test of `bmSeedFromPp`**. It uses a hand-built `MS.ppbe['POM|2099']={v:2,split:false,lines:{},val:{USAF:{L1:{[MS.cur]:{d:1000.6,m:250.4}}}}}` and checks `S.bm.disc[0]`/`mand[0]` = `[1001,250]`.
  - 'PPBE cycles — the deltas against the reference' (2760; `cycRetagNext`)
  - 'PPBE cycles — a PMO copy carries the reference projection only' (2868)
  - 'the funding posture prints the scorecards’ figures' (3252)
  - 'v1.95 — the PMO drill uses the board’s own allocation' (3669)
  - 'v1.95 — the PMO drill reads another appropriation from its own state' (3757)
  - 'v1.97 — a negative allocation is refused, …' (4084; `bmSrcSet(0,'vec',1,'-25')` signed CONTROL)
  - 'v1.97 — typed money is read whole, …' (4173; `keeps('budget base'…)`, `keeps('funding source'…)`, `keeps('PPBE position', … ppSetV …)`)
  - 'v2.00 (R2) — an EEIC refusal …' (4485; hand-built `S.bm` with adds)
  - 'v1.97 W4 — moving, renaming and removing a service …' (4598; hand-built `MS.ppbe['PB|2027']`)
  - 'v1.97 W4 — a kept PPBE cycle fixes the services it holds' (4680)
  - 'v1.97 W4 — a data pack the board wrote keeps step …' (4781)
  - 'v1.97 W4 — the first service added takes what the board held …' (4841)
  - 'v2.06 — PPBE Budget Positions: the TOTAL corners, and figures entered in $K (items 119, 120)' (5341)
  - 'v2.06 — the pre-merge review’s PPBE fixes: …' (5440)
  - 'v2.06 — the second review: a service is not renamed onto a name a PPBE position still holds' (5489)
  - 'v2.05 — each appropriation is locked on its own board, …' (5251)

### audit-import.mjs

- 'handoff — out' (874; `MS.ppbe`, `cycle` and `cycleRef` travel)
- 'v1.85 — a PMO copy prints its own appropriation, and opens nothing' (2669; `MS.cycle='BES|2028'`)
- 'v1.86 — set to drawn moves no funded dollar and neither unfunded total, only the shortfall' (3118; legacy v1 `MS.ppbe['PB|2027']={USAF:{2027:1100}}`)
- 'v1.97 — a budget base saved with fractions keeps the total that was typed (item 72)' (5620; a saved file built with `file3(...)` carrying `S.bm={disc:[1/3,…],…}`, reopened with `boot({html})`)
- 'v1.97 — a refused browser write never reads as saved' (5907)

### audit-recon.mjs

- '2 capacity' (187): Σ disc ≤ disc BA from `boardFigures` (`S.discSvc`, `S.mandSvc`); fixture `fixture()` plus `dress()`.
- 'W6 — the breakouts workbook: …' (1671): Funding Streams Disc BA / Mand BA and the BUDGET AUTHORITY blocks.
- 'W6 — the priority drill: …' (1879; Summary BUDGET AUTHORITY row).
- 'W6 — a lock keeps each lane apart, …' (2059; `S.bm.disc[1]+=7000; S.bm.mand[2]+=3000; applyState(S)`).
- 'W6 — the cost-element sheets: …' (2108).
- 'comparing two cycles' (1237; edits `S.bm.disc[0]`).
- 'the five-year spend plan' (1071).
- Several v2.00 U1/U14/U34/U10 flow blocks hand-build `S.bm={disc:[…],mand:[0],adds:[]}`.
- 'v2.00 (U10) — a spend-plan choice, a PPBE position or a destination’s kind refused in a locked view leaves no trace' (5955; `cycSetWorking`, `ppSetV` in a view).

### audit.mjs (the Excel workbook)

- `SCENARIOS` (56): 'auto lanes', 'overrides + trims', …, 'zero budget'.
- The PMO Matrix and Cost Element Matrix are sliced at the BUDGET AUTHORITY row (360, 581).

### audit-other.mjs (FYDP Disconnects; the positions hand-built)

- 'v2.10 A — FYDP Disconnects: the figures, read never recomputed, and the box (item 130)' (2910). `posOf()` builds v2 positions with split, lines and val. O&M gets `MS.ppbe=POS.om; MS.cycle='BES|2028'`. Full Fund is placed with `localStorage.setItem(_SLUGMAP.ff.key, …ppbe)`, Spares through `PUBS.sp`.
- The review blocks A-1 (3235), A-2 (3331) and A-3 (3389), and 'v2.11 — …' (3857).
- These **set `MS.cycle='BES|2028'` together with a BES28 position on the O&M board**, so live budget authority would change the O&M fixture's budget authority.

### Other suites and tools

- audit-inject.mjs: T2 'budget-authority question is plain text (bmSeedFromPp confirm)' (635).
- audit-ui.mjs 87, hostile.mjs 97–98 (plants an add name), roundtrip-fuzz.mjs 156–157 and 238 (fills `S.bm.adds`; I found no filling of `MS.ppbe`), pmo-years-render.mjs 44.
- **Browser tools that tag the plan with a position:** `/home/user/orbit-board/tools/keyboard-reach.mjs` 829, `/home/user/orbit-board/tools/layout-fits.mjs` 727, `/home/user/orbit-board/tools/panels-render.mjs` 41 and `/home/user/orbit-board/tools/fydp-frames.mjs` 51 each set `MS.cycle='BES|2028'`, and the first three also set a BES28 position.

### Money coverage

`/home/user/orbit-board/tools/money-coverage.mjs` registers `tiers`, `tierTotals`, `spGather`, `pmoDetail`, `cycProjOf`, `cycDelta`, and `fdcModel` via `fdcStores`. `applyBudget`, `bmSeedFromPp`, `bmBody` and `ppBody` are **not** registered as money surfaces.

---

## 10. Mutation ids aimed at this area (from `mutate.mjs`, read as text)

- **bm and the seed:** `v202-d5c-unrounded`, `v200-confirm-escaped` (bmSeedFromPp); `v197w1-guard-bmSetBase`, `v197w1-guard-bmSrcSet`; `v197w1-bm-reopen-rounded` (applyState bmTot).
- **pp\*:**
  - `v197w1-guard-ppSetV`, `v200-ppsetv-inherited`, `v206-fix-message-raw` (ppSetV)
  - `v200-pplbl-raw`, `v200-pplbltxt-escaped`, `v200-ppkeys-plain`, `v200-ppsvcs-plain`
  - `v206-119-svc-corner-empty`, `v206-119-all-corner-empty`, `v206-118-label-wraps`, `v206-118-column-min-width`, `v206-fix-gone-service-no-row` (ppBody)
  - `v206-119-corner-drops-year`, `v206-119-split-dm-missing` (ppTotCell)
  - `v206-120-bare-as-dollars`, `v206-120-rounded-first`, `v206-120-unit-swallows-suffix` (ppAmtIn); `v206-120-shows-dollars` (ppAmtShow)
  - `v206-120-yes-converts-nothing`, `v206-fix-off-keeps-kx` (ppUnitSet); `v206-120-undo-makes-cents`, `v206-fix-undo-all-figures` (ppUnitUndo)
  - `v197w4-rename-ppbe-left`, `v206-fix-rename-drops-unit` (svcRenameKeys); `v206-fix2-rename-onto-position` (svcListBlock)
- **Engine and readers:**
  - `lane-disc-draw`, `lane-mand-draw`, `cut-natm-unguarded`, `cut-natu-half-guarded`, `cum-skips-unfunded`, `split-share-fractional`, `v197w1-split-mand-same-basis` (tiers)
  - `basis-fsrc`, `basis-over-ask`, `basis-clamps-to-alloc`; `svc-alloc-even`, `svc-alloc-override`, `svcalloc-prorates-raw`, `split-alloc-ignores-directed`, `split-alloc-drops-mand`, `v197w1-alloc-floor-gone`
  - `sb-left-unfloored`, `sb-floor-drops-mc`, `sb-mc-coverage`, `mc-warn-unf-beyond`, `posture-svc-lane-reading`, `posture-total-lane-reading`, `posture-left-is-ba`, `posture-mc-need`, `v200-u41-strip-silent` (scoreboard)
  - `sb-split-as-mand`, `tile-reading1-is-reading2` (tierTotals); `fit-left-unfloored`, `fit-over-drops-unf` (fitBySvc); `lane-table-unf-beyond`, `fit-ignores-view` (svcSummary)
  - `v197w4-held-ba`, `v197w4-held-alloc` (svcHeldBy)
- **Not drawn:** `nd-mand-ignored`, `nd-why-lane-always`, `nd-count-lines`, `nd-follows-view`, `nd-line-short-zero`, `nd-shortall-missing`, `nd-set-wrong-lane`, `nd-setall-noop`, `nd-copy-offers-fix`, `nd-filter-shows-all`, `nd-row-flag-missing`.
- **Split:** `split-seed-drops-mand`, `split-seed-floors` (marked equivalent), `split-seed-swaps-lanes`, `convert-skips-some`, `disc-mand-gated`, `seed-on-type-rebases`, `v197w1-guard-setFsrcSvc`, `alloc-lock-no-fsrcsvc`, `alloc-lock-no-convert`, `v197w6-plans-overalloc` (planWant).
- **Cycles:** `cycle-proj-funded-is-alloc`, `cycle-proj-drops-mand`, `v200-cycproj-plain`, `cycle-lock-shares-state`, `cycle-lock-projects-screen-year`; `delta-*` (cycDelta); `view-shares-cycle-years`, `view-shares-store`, `v199-cyc-view-today`, `v202-89-copy-*`.
- **Spruills:** `spgather-svc-first-service`, `spgather-bud-screen-year` (aimed at the `st.discSvc` budget line), `spgather-other-svc-own-list`, `spgather-own-rebuilt`, `v200-spgather-plain`, `spyear-on-screen-year`; `cycle-spruills-one-year`, `spdrill-controls-are-asks`, `spdrill-other-appn-guessed`, `v200-pmodetail-plain`, `v200-pmodetail-ctl-plain`; `v207-spruills-estimate-no-totals`.
- **FYDP Disconnects (positions):** `v210-a-unheld-year-zero`, `v210-a-pos-unrounded`, `v210-a-lanes-swapped`, `v210-a-own-from-storage`, `v210-a-file-copy-ignored`, `v210-rv-a-folder-not-read`, `v210-rv-a-reading-unsaid` and the other `v210-a-*`; `v211-note-not-carried`.
- **UPL:** `v200-u14-read-writes-marks` (rlgIsUpl), `v200-rlgupl-plain`, `v200-rlgupl-ev-plain`.

---

## 11. Gaps and things I could not find

- `fydpPosKey` does not exist (removed with v2.04 item 112). No function today means "the position under the plan's tag for year y".
- Nothing reads budget authority from a position live. The only route is `bmSeedFromPp`, which copies one year (`MS.cur`), for covered services, after a confirm.
- I found no code that compares what requirements hold per lane with budget authority or a position (an "over / under" per year, appropriation, service and lane). The nearest is `ndData` (typed more than drawn) and `trimAbsorb` (26365).
- I found no amount check at the import check for `MS.ppbe` value cells, and no round-trip fuzz filling of `MS.ppbe`. Save and reopen of `MS.ppbe` is covered only by audit-import's whole-store comparisons and 'handoff — out'.
- `S.bm.pp`'s positional `disc`/`mand` vectors are not remapped by `svcRemapState`, and roll forward keeps the old `pp.fy`.
- Budget Management and PPBE positions are editable in a PMO copy (no `allocLocked`, no CSS lock) and do not travel back.
- A lock keeps budget authority per year (`proj.disc/mand` and the whole `S.bm` in `years`) but not `MS.ppbe`. A locked view reads today's `MS.ppbe` and `MS.cycle`.
- `cycLock()` tags an untagged plan with the lock's key, so after a lock, live-position budget authority would switch on by itself wherever a position exists under that key.
- The Spruills reads other years' and other appropriations' **stored** `discSvc` caches, not a recomputation.
- Several fixtures and browser tools already tag the plan `'BES|2028'` with a BES28 position on the board on screen (the audit-other v2.10 and v2.11 blocks, keyboard-reach, layout-fits, panels-render). These would start reading budget authority from that position under item 134.

## fydp

# Map for v2.12: the FYDP Spend Plan's service join, and how a builder proves a change

All line numbers are in `/home/user/orbit-board/prioritization-board-grid.html` at `4abd107` (BUILD `v2.11 (27 Oct 2026)`). I changed no repository file. One throwaway jsdom probe ran from the scratchpad: `/tmp/claude-0/-home-user/792dafeb-d944-5a2a-8cfa-66d1840065b4/scratchpad/probe/fydp-svc.mjs`.

## (1) The FYDP Spend Plan workbook: how it joins services

### The functions involved

- **`fydpWindow()` — 22342.** Returns `base…base+4`, plus `MS.cur` if that year falls outside the window. It is used by `fydpData('working')`.
- **`fydpData(src)` — 22348.** Returns
  `{src, label, years, held, proj:{[fy]:projection}, svc:SVC.slice(), ts, by}`.
  - For the working plan, each held year is `aceWithYear(y, cycProjOf)`.
  - For a locked cycle, it reads `c.proj[y]` as locked. `out.svc` comes from the first held projection's `svc`.
- **`cycProjOf()` — 22076.** This is the projection shape the book reads:
  `{fy, ap, ts, by, svc:SVC.slice(), disc, mand, bands, reqs:[{id,title,grp,ccar,pid,band,mc,ask,alloc,d,m,fund}], pmo}`.
  Every vector is indexed by **that appropriation's own `SVC`**. So Full Fund's projection says `'USMC-B'` where O&M's says `'STOVL'`.
- **`fydpBookYears(D)` — 22392.** The base year and the next four (a lock's own base for a locked source).
- **`fydpBookApp(X, Y)` — 22398.** Turns one appropriation's `D` into `{held, reqs, order}`. For each year it stores:
  `reqs[id].fy[y] = {grp, svc: P.svc||X.svc, ask:[…], alloc:(r.fund||r.alloc)}`.
  Allocated is the lane draw, d+m. The service **list** is stored per year, by name.
- **`fydpBookVal(M, id, y, f)` — 22414.** One requirement's year under a filter.
  - It returns `null` for a year that is not held.
  - The service filter (line 22418) is the join:
    ```js
    if(f && f.svc!==undefined){ const i=e.svc.indexOf(f.svc); return i<0? {a:0, l:0} : {a:e.ask[i]||0, l:e.alloc[i]||0}; }
    ```
    It matches the **exact name**, takes the **first index only**, and does no alias lookup.
- **`fydpBookHas(M, id, Y, f)` — 22421.** For a service filter, true when any year's `fydpBookVal` is non-zero.
- **`fydpBookLines(M, Y, f)` — 22428.** One block: lines grouped under the CCaR record, case-insensitive, 1-N order, "No CCaR record" last, with per-year totals and a line total at the right.
- **`fydpBookAdd(Y, blocks)` — 22449.** Adds blocks together. A year that no block holds gives `null`.
- **`fydpBookModel(D, A)` — 22457.** The model; `A` comes from `fydpGather`. The service list is built at 22462–22464:
  ```js
  const svcs=[]; SVC.forEach(function(s){ if(svcs.indexOf(s)<0) svcs.push(s); });
  got.forEach(function(p){ p.M.held.forEach(function(y){ ((p.D.proj[y]||{}).svc||p.D.svc||[]).forEach(function(s){ if(svcs.indexOf(s)<0) svcs.push(s); }); }); });
  ```
  - The board on screen's names come first, then any other appropriation's names that are not yet in the list.
  - `svc = svcs.map(s => {name:s, blocks:by({svc:s}), sum})` keeps only services with blocks (line 22470).
  - PMOs go through `pmoKeys(pm)` over an `Object.create(null)` map.
  - Returns `{D, years, apps, got, svc, pmo, total}`.
- **`fydpBookSheets(B)` — 22481.** Writes the sheets: Summary, a tab per appropriation, then `rollTab` per `B.svc` and per `B.pmo` (22566–22575).
  - Each service tab is named `x.name`, through `tab()`, which sanitises the name to Excel's rules.
  - The Summary's "By service" roll-up lists `B.svc`.
- **`exportFydpPlan(src)` — 22582.** Calls `fydpData` → `fydpGather` (22775, which opens the other appropriations as frames) → `fydpBookModel` → `fydpBookSheets` → `buildXlsx(..., FYDP_XTRA, {house:true,…})`.
- **`fydpBody()` — 22821.** The panel. It calls `fydpBookModel(D, [{k:mySlug(), D, own:true}])` with the **board on screen only**. The views are `'s:'+x.name` for each `B.svc`.

### Where Full Fund's USMC-B lands

I confirmed this with the probe:

| Board on screen | Tabs written |
|---|---|
| O&M (`SVC` USAF, ANG, AFRC, **STOVL**, USMC-C, USN) | `Summary \| O&M \| Full Fund \| USAF \| STOVL \| USMC-B \| AV` |
| Full Fund (`SVC` with **USMC-B**) | `Summary \| O&M \| Full Fund \| USAF \| USMC-B \| STOVL \| AV` |

- With O&M on screen, the STOVL tab has sections `STOVL — O&M` only, and the USMC-B tab has `USMC-B — Full Fund` only. The Summary's "By service" lists STOVL and USMC-B as two rows.
- Partition still holds today: every dollar sits on exactly one tab. But the F-35B money is split across two tabs, which is the defect item 132 describes.
- Both names also decide the tab **order**, so the tab names depend on which board is open.

### How FYDP Disconnects joins the same services

- **`SVC_ALIAS` — 17264:** `{STOVL:'USMC-B','USMC-B':'STOVL'}`.
- **`svcBoardOf(sv)` — 17265:** maps a name to **the board on screen's** `SVC`. The FDC comment at 24524–24527 says not to use it for other appropriations.
- **`FDC_GROUPS` — 24528.** Four groups. When the table loads, each group's `svcs` is extended with the alias (24532–24535), so STOVL's group becomes `['STOVL','USMC-B']`.
  - `fdcModel` (24638) matches by **membership**: `inG(svcs, sv)` → `svcs.indexOf(sv)>=0`. It sums every estimate line and every position service whose name is in the group.
  - The Summary takes every service (`svcs` is null).
- **`fdcLoneSay` — 24763.** Names any service that no group holds.
- FDC therefore always names the sheet "STOVL", whichever board is open. That was fixed in v2.10 review A-1.

### What a fix that puts USMC-B on the STOVL tab must change (and keep)

1. **Tab names in `fydpBookModel` (22462–22464).** Fold each name through `SVC_ALIAS` into one name, and dedupe on that name, so only one tab exists for the pair.
   - Brad still has to decide the tab's name. "STOVL" whichever board is open matches item 132's wording and FDC.
   - The alternative is the board on screen's own name, `svcBoardOf`-style. On a Full Fund board that tab would read USMC-B.
   - Read `SVC_ALIAS` by own key, as `FDC_GROUPS` does (`Object.prototype.hasOwnProperty.call`). Any new map keyed by a service name must be `Object.create(null)`; audit-inject K8 builds `fydpBookModel` with a hand-made projection.
2. **The filter in `fydpBookVal` (22418).** Sum **every** index `i` of `e.svc` whose folded name equals `f.svc`, not `indexOf`.
   - This keeps "the service tabs partition the appropriation tab" even if one list carries both names.
   - Folding only the names in `fydpBookApp` and keeping `indexOf` would drop the second index's dollars in that case.
   - `fydpBookHas` follows `fydpBookVal` without any change of its own.
3. **The panel (`fydpBody`, 22830–22832, 22865).** It reads `B.svc` names and finds a view by `z.name===fydpView.slice(2)`. It stays consistent as long as the model's names change. On a Full Fund board the view list would then say STOVL, if that is the name chosen.
4. **Text that describes this.** The comment block at 22374–22390 says "found by the service's NAME in that year's list". The guide paragraph at line 2295 is already stale: it says "after the three summary sheets", which is the v1.85 layout. The menu hint `ri('FYDP Spend Plan…')` is at 29717.
5. **Mutation find strings on the lines a fix would touch** (text only; run `mcount` after the edit):
   - `fydp-service-shifted` — the 22418 line itself, `"return i<0? {a:0, l:0} : {a:e.ask[i]||0, l:e.alloc[i]||0}; }"`. If the line is rewritten, retarget it to the same defect.
   - `v204-112-svc-empty-tab` — 22470, the `const svc=svcs.map(…)\n    .filter(…)` two-line find.
   - `v204-112-svc-lists-everyone` — 22424, in `fydpBookHas`.
   - `v200-fydprows-plain` — 22467, the `pm` map.

### Every mutation whose find lands in these functions

Mapped text-only by the containing top-level function:

| Function | Mutation ids |
|---|---|
| `fydpBookVal` | `fydp-year-missing-as-zero`, `fydp-row-one-pmo`, `fydp-subtotal-is-everyone`, `fydp-service-shifted` |
| `fydpBookHas` | `v204-112-svc-lists-everyone` |
| `fydpBookLines` | `v204-112-order-not-1n`, `pmo-ccar-case-splits`, `pmo-record-drops-one`, `pmo-no-ccar-dropped`, `v204-112-record-every-line`, `fydp-fydp-total-drops-a-year`, `fydp-total-skips-a-row` |
| `fydpBookAdd` | `v204-112-dash-total`, `pmo-total-first-only` |
| `fydpBookApp` | `fydp-fund-is-alloc` |
| `fydpBookYears` | `v204-112-years-window` |
| `fydpBookModel` | `v200-fydprows-plain`, `v204-112-svc-empty-tab` |
| `fydpBookSheets` | `fydp-copy-unstamped`, `fydp-title-unlabelled`, `pmo-alloc-is-ask`, `pmo-missing-year-zero`, `pmo-fydp-alloc-is-ask`, `pmo-tag-unsaid`, `pmo-refusal-silent`, `v204-112-portfolio-one-year`, `v204-113-chart-series-swapped`, `pmo-tab-copy-unstamped`, `pmo-tab-dropped` |
| `fydpBody` | `fydp-panel-funded-is-ask`, `fydp-panel-total-skips-a-row`, `v204-112-panel-view-ignored` |
| `fydpData` | `fydp-cycle-reads-live` |
| `exportFydpPlan` | `fydp-src-ignored`, `v200-u37-guard-exportfydpplan`, `v200-fydp-name-html`, `export-never-frees`, `export-late-never-built` |
| `fydpGather` / `fydpTake` / `fydpStoreLocal` / `fydpStoreFolder` | `frame-no-file-state`, `frame-asks-working`, `frame-appn-unchecked`, `frame-state-unchecked`, `frame-shape-unchecked`, `frame-unreadable-skipped`, `frame-store-older-wins`, `v210-rv-a-strict-none-unreadable`, `v210-rv-a-strict-not-a-board-taken` |
| FDC join | `v210-a-usaf-no-ang`, `v210-rv-a-alias-dropped` (FDC_GROUPS); `v211-lone-estimate-unseen` (fdcLoneSay) |

The v2.04 entries are in `mutate.mjs` around 1066–1110 and in the `// ==== v2.04 (item 112) ====` slot at 6839–6870. Today there are 2,799 targets and each matches once.

### Tests covering the service tabs, and how their fixtures are built

**audit-recon `'the five-year spend plan'`** (block 17, around line 1071; money-map check `re.fydp`)
- Fixture: the suite's top-level board. `boot()` on O&M, `seed()` with `SVCN = ['USAF','ANG','AFRC','STOVL','USMC-C','USN']` and items A–E, `BASE_ITEMS` synced, then `dress` and `dress2`.
- The block zeroes the last service, writes `MS.years[cur+1]` as a JSON copy with A's asks changed and C moved to another office, and sets `MS.base`.
- Oracle (agreement basis): an `ENGINE` function reading `tiers()` per year through `aceWithYear`.
- It reads the workbook back from its bytes (`grabX('exportFydpPlan')` → `xlsxRead`), then checks:
  - the tab order `['Summary', app, …svcs, …offices]`;
  - each service tab's block (`SV.indexOf(f.svc)`);
  - **the partition**: `'the service totals add to the appropriation, each held year'`;
  - the Summary's By service and By PMO, the panel views, and a PB lock printed as locked.
- **One appropriation only, and STOVL only.** It never meets USMC-B.

**audit-recon `'v1.95 — the five-year plan files each year under that year’s PMO'`** (around 1456; `re.fydpPmo`)
- `boot()` on one board; it checks PMO filing.

**audit-import `'v1.85 — every appropriation, read by its own board, ties to the dollar'`** (2449; `im.v185`)
- Fixture: three boards built with `v185Board(html, appn, sc, …)`: `boot({html, appn})`, then `seed`, then `asBooted`, then trims, a second year, and a PB lock.
- The boards are chained through `buildSavedHtml()`, so the O&M file carries Full Fund and Spares.
- `v185Export` stubs `buildXlsx` to capture the sheet objects.
- The reference is the same file booted as each appropriation, with `v185NoFrames`. Every service and PMO tab block is tied to its own board's tab, then footed.
- It asserts the sheet list `'Summary,O&M,Full Fund,Initial Spares,USAF,ANG,AFRC,PSM,AV,CDS,TSS'`. All three boards use `MINE = ['USAF','ANG','AFRC']`, so **no alias case**.
- Related blocks: `'v1.85 — a locked cycle is read as locked…'` (`im.v185lock`), `'… a block that cannot be trusted…'`, `'… the frames answer later…'`, `'… a PMO copy prints its own appropriation…'`.

**Other places that touch it**
- audit-board `'v2.02 (item 89) — a locked cycle keeps its own lists'` reads the Summary's By PMO.
- audit-other `'v2.04 (item 113) — the house style…'` lists `exportFydpPlan()` among the house-style exports.
- audit-inject K8 builds `fydpBookModel` directly with offices named `__proto__` and `constructor`.
- trace-lib 1e (`'xl · FYDP Spend Plan'`) reads only the appropriation tab's TOTAL.
- `npm run frames` (`tools/fydp-frames.mjs`) checks the sealed frames in Chromium.

**The FDC alias test to copy from:** audit-other `'v2.10 review — FYDP Disconnects: Full Fund’s USMC-B is the STOVL sheet’s, and the service sheets add up to the Summary (A-1)'` (around 3235).
- It builds `ACE6` and `FF6` (`'USMC-B'` in place of STOVL).
- It runs once with O&M on screen (`boot()` + `seed`, Full Fund in `localStorage` through `_SLUGMAP.ff.key`) and once with Full Fund on screen (`boot({appn:'FULL FUND', ls:{…}})`, with a `dataPack.services` of FF6).
- It asserts the sheets plus the lone services equal the Summary.

**What a new check needs:** a v185-style chain with O&M on ACE6 and Full Fund on FF6, which is what my probe does, run with each board on screen. It should assert:
- STOVL carries both appropriations' blocks;
- there is no USMC-B tab;
- per appropriation and year, the sum of the service tabs equals the appropriation tab;
- the Summary's By service.

Then:
- in `tools/money-map.json`, add the new check to `checks` and cite it in the `service` cell of `exportFydpPlan`. It currently cites `re.fydp` only. Then regenerate `money-map.md` with `node tools/money-map.mjs`;
- optionally, add a `math-defects.json` entry naming the check and its mutations.

## (2) The test and proof process

### Rules (CLAUDE.md, 20–21 Oct)
- Never `import` or run `mutate.mjs`, `npm run mutate` or `validate:math`. The sweep runs only on Brad's named go.
- `validate:nightly` is `validate-math.mjs --no-sweep`.
- Report a change as only its diff lines. A mutant is reported as its id, find and repl.

### How a version is organised (v2.09 and v2.10)
- **A slot commit first.** It puts an empty pair of markers in every suite and in `mutate.mjs`, so parallel builders merge cleanly:
  - `// ==== v2.1x Wn (item N): title ====`
  - `// ==== end v2.1x Wn ====`
- **Where the slots sit:**
  - In `audit-board.mjs` (6469–6482), `audit-import.mjs` (15184–15191), `audit-recon.mjs` (11470–11475) and `audit.mjs` (1225–1241): last, just before the self-check block. Each has `v2.10 A` and `v2.10 B` slots, still empty.
  - In `audit-other.mjs`: the v2.10 A slot at 2899, B at 3534, v2.11 at 3846 (with content).
  - In `mutate.mjs`: the last slot is `// ==== v2.11 … ====` (8726–8774), just before `];`.
  - `audit-hostile`, `audit-inject` and `audit-ui` have no slots.
- **A contract for parallel builders.** `recovery/v210/item130-contract.md` fixes one shared data shape (the model) so A builds it and B prints it, testing with hand-built models.
- **One notes file per builder** (`recovery/v210/notes-A.md`, `recovery/v209/notes-W1.md`), with these sections: What was built · Decided in the build · Checks (each new check "fails on <base sha>" except the ones labelled CONTROL; existing checks changed on purpose carry a `// v2.0x Wn:` comment) · Mutations (new, retargeted, retired, pinned) · For the integration · npm script to add · Known gaps.
- **Proof files.** `recovery/vX/proofs-*.json` and `proved-*.jsonl`. They are git-ignored by `*.json`, so add them with `git add -f`.

### `mutate.mjs` entry format
```js
{ id: 'v212-…', area: "fydpBookVal", what: "the person-level symptom", find: "exact text, once", repl: "the break" },
```
- `id` must be **single-quoted**: `money-coverage.mjs` reads only `{ id: '`.
- `find` must match the board exactly once. It may name a constant declared above the array (`find: CONST_NAME,`). A template literal holding `${` is reported UNPARSED by mcount.
- `equivalent: '…the invariant that makes it unreachable, and the check that asserts it'` marks an equivalent mutation.
- A retired mutation is a comment where it stood:
  `// <id> RETIRED AS OBSOLETE, not equivalent -- vX.Y (item N): <reason>`.
- A retargeted one has a comment above it: `// vX.Y (item N): retargeted to … -- the same defect, where it now lives`.
- `FIRST_BY_PREFIX` (8829) changes sweep order only, never the verdict.

### How a suite block is written
- **The name line.** It must be exactly `  const name = '…';` (two spaces, single quotes). Both the self-check (`/^  const name = '([^']+)'/gm`, "this scenario never ran") and `slim.py` read it. The block must sit before the self-check, not after `process.exit`.
- **Bare block form** (audit-other, audit-board, older recon blocks):
  ```js
  {
    const name = '…';
    try { … chk(name, where, what, got, want); … }
    catch (e) { failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' }); }
  }
  ```
- **Function form** (audit-import, newer recon blocks):
  ```js
  await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
    const __bm = bootMark();
    const name = '…';
    try { … } catch (e) { failures.push({…}); }
    bootRelease(__bm, keepBoards());   // audit-import keeps V185W, V186L, V14
    await settleBoards();
  })();
  ```
  A recon block can import these itself: `const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs')`.
- **`chk(scenario, where, what, got, want)`.** Two numbers compare within 0.005; anything else compares as `String(got)===String(want)`. audit.mjs uses `Object.is`.
- `stopAtFirstFailure(failures)` is called once per suite.
- **boot.mjs exports:** `boot({html, appn, ls, quiet})`, `seed(ev, {services, items, disc, mand, order, mc, fsrc, alloc})`, `capture`, `cv`, `num`, `bootMark`, `bootRelease`, `settleBoards`, `stopAtFirstFailure`. `boot()` stands in a second board for `fydpFrame`, recorded on `w.__fydpFrames`.
- **The fixture rule.** After `seed()`, sync `BASE_ITEMS` and `BASE_ASK`. Build the fixture so the alternatives disagree.
- **Old builds from git.** Use `execFileSync('git', ['show', '<sha>:prioritization-board-grid.html'])` (as in audit-other v2.11 and recon). This needs full history; the repo is not shallow now.

### Registries
- **`tools/money-coverage.mjs` `REGISTRY`** (line 35):
  - `{money:true, what, via:[helper fns]}`, or `{money:false, reason}`.
  - Any top-level `function export*`, `crExportRows`, `srcRowsOf` or `crData` not in the registry fails the run, as does a `via` name the board lacks.
  - `exportFydpPlan`'s `via` lists `fydpData`, the `fydpBook*` helpers, `fydpBookSheets` and `fydpBody`.
- **`tools/money-map.json`:** `{about, dimensions[7], reasons, checks{id:{file, scenario, anchor:"const name = '…'", basis:'arithmetic'|'agreement', asserts}}, surfaces{name:{registry, money, what, cells:{appropriation, fiscalYear, service, requirement, month, crHalf, lane: {status:'proven', checks:[…]} | {status:'n/a', why:'@reasonKey'|text} | {status:'open', …}}}}, findings, unregistered}`.
  - It fails on a missing row or cell, an anchor no longer in its file, a catalogue check nothing cites, a pending surface that has arrived, or a stale `money-map.md`.
  - Run `node tools/money-map.mjs` to write the report; the gate runs `--check`.
- **`tools/trace-stated.json`:** quantity → surfaces, for example `funded: [… 'xl · FYDP Spend Plan' …]`. Regenerate with `node tools/trace-matrix.mjs --emit > tools/trace-stated.json` and say why in the commit.
- **`math-defects.json`:** `{id, found, foundBy, build, surface, symptom, cause, fix, guarded, checks:[scenario names], mutations:[ids]}`. Checked by `npm run defects`.

### npm scripts (`package.json`)
- **jsdom suites**, all through `audit:suites`: `boot-same.mjs`, then `audit:export` (audit.mjs), `audit:other`, `audit:board`, `audit:import`, `audit:recon`, `audit:legacy` (legacy-fsrc), `audit:hostile`, `audit:inject`, `audit:ui`. `npm run audit` runs `audit:suites`.
- **Browser checks (Chromium):**
  - inside `verify:grid`: `chrome`, `csp`, `controls`, `inspector`, `toolbar`, `editors`, `colours`, `menus`, `panels`, `frames`, `hostile`, `layout`, `keys`, `dropdowns`, `dialogs`, `leftmenu`, `pmosave`, `pmoyears`, `pointer`;
  - outside it: `standards`, `shoot`, `ia:*`.
  - `verify:grid` stops at `layout`, which has failed its 8 D checks since v2.00. Run `keys`, `dropdowns`, `dialogs`, `leftmenu`, `pmosave`, `pmoyears`, `pointer` and `standards` yourself.
- **Static and text:** `check`, `coverage:money`, `money-map`, `defects`, `trace`, `fuzz`, `delta`, `verify:file`, `review:*`.
- **Gates:** `validate:nightly` gives the suites 8 GB through `SUITE_HEAP`. `validate:math` includes the sweep and is forbidden.

### Exact commands (run from `/home/user/orbit-board`; this container has 4 cores and 15 GB)

`NODE_OPTIONS` already holds `--use-openssl-ca`. **Append** the heap setting; never replace the variable.

```bash
# count every target, text only
python3 -I -B recovery/v200/bin/mcount.py tools/export-audit/mutate.mjs prioritization-board-grid.html [--ids id1,id2]

# build one mutant (prints {id, matches, find, repl}; writes only if it matches once)
python3 -I -B recovery/v200/bin/mkmut.py tools/export-audit/mutate.mjs prioritization-board-grid.html <id> /tmp/…/mut.html
BOARD=/tmp/…/mut.html NODE_OPTIONS="$NODE_OPTIONS --max-old-space-size=8192" node tools/export-audit/audit-recon.mjs

# run one block: slim a suite to the named scenarios (substring, or '=exact name'), run it, delete it
python3 -I -B recovery/v208/bin/slim.py tools/export-audit/audit-recon.mjs tools/export-audit/_slim-x.mjs 'the five-year spend plan'
NODE_OPTIONS="$NODE_OPTIONS --max-old-space-size=8192" node tools/export-audit/_slim-x.mjs; rm tools/export-audit/_slim-x.mjs

# prove mutations against their own blocks; each slimmed check runs on the clean board first
#   IDS.json: [{"id":"v212-…","caughtBy":"audit-recon / the five-year spend plan; v1.95 — the five-year plan"}]
#   suites: board|other|import|recon|hostile|inject|audit (hostile and inject always run whole)
JOBS=2 HEAP=8192 python3 -I -B recovery/v208/bin/prove.py recovery/v212/proofs-X.json recovery/v212/proved-X.jsonl [ids…]
#   CALIBRATE_ONLY=1 runs only the clean step. Verdicts: CAUGHT / SURVIVED / CRASHED / NOT APPLIED.
#   Ids already in OUT are skipped. TIMEOUT defaults to 1500 s.
```

Things to keep in mind when running these:
- Keep JOBS × HEAP under about 12 GB.
- A slimmed import block that reads `V185W`, `V186L`, `V14` or a `W2…`/`W3…` variable must also name its writer block. Otherwise it reports NOT CLEAN.
- Prove every mutation together on the merged board, not only each round's own. Then run **every suite whole** once before the gate.
- Run `npm run check` before every commit.

## What I could not find
- **No test builds a five-year workbook where an appropriation names the F-35B service `USMC-B`.** The v1.85 blocks use `MINE` (USAF/ANG/AFRC), and recon uses STOVL only. The defect is unguarded today; the probe is the only evidence.
- **No record of which suite catches each FYDP mutation.** There is no `.math-reports/catchers-*.json` and no `recovery/` proof for the v2.04 item 112 mutations; prove.py dates from v2.08. The blocks named above are the likely catchers, but none has been run against these mutants here.
- **Brad has not said which name the merged tab carries** (STOVL always, or the board on screen's own name). Item 132's text implies STOVL.
- **Whether the guide paragraph at line 2295** (stale: "three summary sheets") and the panel's view label should change with the fix is not decided anywhere.

## surf

## Map: where items 132 and 134 will show on screen, and the guide (board `prioritization-board-grid.html`, line numbers as of this tree)

### 0. Things the logged items assume that the code does not match
- **`fydpPosKey` no longer exists.** Item 134 says "as `fydpPosKey` reads it", but grep finds it nowhere in the board. It went with v2.04 item 112.
  - The working plan's tag is `MS.cycle`, normalised to a string at 6711 and set by `cycSetWorking` (22316) as `blKey(c,y)` = `'BES|2028'`.
  - Positions are keyed the same way: `ppKey()` (23570) = `ppCyc+'|'+ppYr`. So `MS.ppbe[MS.cycle]` is the working tag's position in this appropriation.
  - The header tag `#cycTag` (markup 1893) is written by `blBody()` at 23455 on every render: `BES28`, or `· vs PB27` when a reference is set.
- **Classify already has a WBS column.** Item 132 says it does not, but it does:
  - `matCols()` (27412) takes its columns from `recFields()`. `recFields` (27247) pushes `recF('wbs', …)` and `recF('wbsSplit', …)` at 27274–27285, so the grid draws a `wbsQuick` button per row (`f.c`, `matBody` ~27682).
  - What is missing is a bulk setter. `matBulkOk()` deliberately exempts the two columns at 27528: `if(c==='wbs' || c==='wbsSplit') return; // free-form: no list to offer`.
- **"UPL" already means something else.** `S.upl` holds the Funding Realignment's UPL pot marks: `rlgUplMap` (4553), keyed `'r|<id>'` (6979). Item 134's "UPL last line" is a different idea under the same word.
- **The Needs attention strip is hidden in three of the five modes.** In the v2.00 UI the posture strip (and Needs attention inside it) shows only in Fund and Brief. CSS 1676: `html.ui-on:not([data-mode="fund"]):not([data-mode="brief"]) #posture{display:none}`.

---

### 1. Needs attention

**State and data**
- `let attOpen=null` (3523): which list is open.
- `allocNegOf(id)` (3526): feeds the `neg` list.
- **`attLists(T)` (3542).** One pass over `S.order` returns `{imp, ccar, oblig, awshort, awfix, neg, buy, code, si}` (initialised at 3545).
  - Each row is `{id, rank:MR[id], funded:dT+mT}`, plus per-kind fields: `awshort {ud,um}`, `awfix {how,n}`, and `neg/buy/code/si {n:[strings]}`.
  - `buy` (3563–3564), `code` (`codeIssues()`, 3566–3569) and `si` (`siIssues()`, 3571) are added after the loop.
  - Sorts: `awfix` (3574), `oblig` (3576, funded first, then rank).
- **`ATT_KIND` (3579–3598).** Per kind: `{t: title, go: button label, why: hint HTML}`. The `why` texts use `FL()`/`FLI()`.
- `attShow(k)` (3599): refuses an unknown k, sets `attOpen`, calls `render()`. `attClose()` is 3600.
- **`attBody()` (3601–3628).** It draws `#attBody` and sets `#attTitle`. The columns are chosen by hard-coded `attOpen===` chains:
  - money header at 3609–3611;
  - cells at 3617–3621;
  - TOTAL row at 3625–3626.
  - Kinds: `oblig` gets "Funded · UNSCHEDULED"; `awshort` gets two undated columns; `awfix` gets "What was done"; `neg|buy|code|si` get "As saved" (`n.join(' · ')`); anything else gets "Funded".
- **`attGo(k,id)` (3630–3645).** It does `attOpen=null; setCur(id); goRow(id)`, then routes:
  - `imp` → `openEdit(id,'cons')`, `ccar` → `openEdit(id,'ccar')`, `si` → `openEdit(id,'si')`;
  - `neg|code` → return (selection only);
  - `buy` → `buysOpen=true` and scroll to `#buysWrap`;
  - default → focus the first date input in `#inspector .awdblk`.
  - `ER_AT` (33244) already maps `wbs:'erWbs'`, so `openEdit(id,'wbs')` is available as a target.
- **Markup** (2099–2104): `<div class="modal-bg" id="attPanel" onclick="if(event.target===this)attClose()">` containing `#attTitle` and `#attBody`. `attBody()` is in `render()`'s body list at 29071; `render()` itself starts at 29060.

**The posture buttons, inside `scoreboard()` (25795)**
- `const A=attLists(T)` (25896).
- `ae(k, glyph, text)` (25901) returns `<button type="button" class="e" onclick="attShow(jsa(k))">…<span class="g">glyph</span> text</button>`.
- The `att` string (25903–25916) is fixed in this order: not drawn (`ndOpen=true`), imp, ccar, oblig, awshort, awfix, neg, buy, code, si. Each line is `+(A.x.length? ae('x', …) : '')`.
- It is placed in `<div class="pp ppatt"><div class="k">Needs attention</div><div class="pplist">…` (25932), or "nothing flagged".
- The posture blocks in order are: `.pp` lanes (`.pplanes [data-v]`), `.pp.mc`, `.pp` whole budget, `.pp` unfunded by service (`.ppsvc`), `.pp.ppatt`, `.ppdet`.

**To add a kind ("Without a WBS", or a per-year over/under list), five places change**
1. `attLists`: the key in `out` (3545) and its push. For a list that is not per requirement, see `buy` (3563).
2. `ATT_KIND`: a new `{t, go, why}`.
3. The posture line in `scoreboard` (25903–25916).
4. `attBody`'s three `attOpen===` chains (3609, 3617, 3625), if the kind needs its own columns (dollars per row, or dollars per service and lane).
5. `attGo`'s routing (3630).

Also update the comment at 3523 and the guide's list at 2255 (see §4).

**Tests**
- `audit-other.mjs` "v1.93 — Needs attention: every entry opens its list" (1250).
  - Fixture: `boot()`, `seed()` with one service and A–D; `S.band`, `S.cons` and `S.awards` set by hand; no `S.wbs`.
  - It asserts the posture entries **exactly**: `['BUTTON ⚠ 2 impact statements missing', 'BUTTON ○ 2 without a CCaR record', 'BUTTON 📅 2 without an obligation date', 'BUTTON ◔ 1 award short of its funding']`.
  - A "Without a WBS" kind will fire on all four requirements and change that list.
  - It also opens each list through the rendered posture button and reads `#attBody .atttab tr`, and drives `attGo` for awshort, oblig, imp and ccar.
- `audit-board.mjs`:
  - "v1.95 W3 — opening a saved board repairs its awards…" (3513): `attShow('awfix')`.
  - "v1.97 — a negative allocation is refused…" (4084): `attShow('neg')`, `#attBody .attneg`.
  - "v1.99 — a buy quantity…" (4274).
  - "v1.99 — a code longer than its limit…" (4339).
- `audit-recon.mjs` "v2.00 (U41) — an SI code a file carried…" (4967) reads `button.e[onclick='attShow("si")']`.
- `audit-import.mjs` (5333, 5565) reads `attLists().awfix` and `.neg`.
- Mutations (text only), mutate.mjs 2303–2318: `att-oblig-funded-only`, `att-oblig-rank-only`, `att-awshort-disc-only`, `att-go-not-selected`, `att-go-no-field`.

---

### 2. The cost estimate on screen: tie-out panel, Data card, import report

**Tie-out panel**
- State (4075): `let aceOpen=false, aceYr=null, aceOnly=''`.
- `toggleAce()` (4076), `aceSetYr` (4077), `aceConfirmY`/`aceConfirmRollY`/`aceUnmapY` (4080–4082, each through `aceWithYear(fy,…)`), `aceSetOnly` (4083), `aceToggleExp` (4087), `aceExpandRows(r,multi)` (4097, reading `aceAlignRows`).
- Markup: `#acePanel` / `#aceBody`, 2311–2316, title "📈 ACE TIE-OUT".
- **`aceBody()` (4125–4365), from top to bottom:**
  - No sets: a hint at 4133–4135 naming `Data \u203a 📥 Import Annual Cost Estimate…`. `menu-paths` checks that path.
  - Pickers: the estimate (`setSpAce`) and the fiscal year (`aceActiveYears()` plus "All active years"), then counts: "N cost lines · N WBS in <appn>".
  - Three headline numbers: confirmed, board value not tied, estimate WBS nothing claims.
  - The PMO reconciliation table from `acePmoGroups(k)` (16597): estimate, board funded, delta, confirmed.
    - An office with estimate lines and no requirement gets an `.aceestonly` row (4202–4207).
    - The `.aceacct` "accounted for" line (4228–4233).
  - Filter buttons: `sug`, `none`, `orph` (4236–4240).
  - The orphan table (WBS, estimate, cost element `idx[w][0].ce`), or the working list (PMO, requirement, WBS, board funded, state plus ✓/↩), capped at 120 rows a year.
  - The closing hint (4351–4361).
- Helpers it reads:
  - `ACE_PMO_ALIGN_DEFAULT` (16572): `{early:{PSM:'AV'}, later:{}}`.
  - `aceAlign(k)` (16584): writes `MS.aceAlign[k]` the first time it is read.
  - `acePmoFor` (16594), `aceNormWbs` (16603), `aceWbsOf` (16606), `aceLinesBy` (16614), `aceSuggestFull` (16637), `aceSetMap` (16651), `aceScan` (16782), `aceEstPmo` (16808), `aceAmt` (16834).

**Import entry and Data card**
- The hidden input `#aceFile accept=".xlsx"`, onchange `importAce(this)` (1958).
- Menu items in `syncBtns()`'s `I` object (29698):
  - `acet: mi('📈 ACE tie-out…',"mRun(toggleAce)",aceOpen, '<keys> loaded' | 'no estimate imported yet')` (29739).
  - `acei: mi('📥 Import Annual Cost Estimate…',"mRun(()=>document.getElementById('aceFile').click())",false, 'held: <key> 🔒 · …' | 'ACE workbook (.xlsx)')` (29741).
- The Data box `#uiDataPanel` (markup 2584–2588) holds `#dd_data`. It is written at 29841 by `card(k,title,what,last,body,seen)` (29838), wrapped in `uiPlain` (29557, which strips leading icons).
- The ACE card (29847): `card('ace','Annual Cost Estimate','The cost estimate workbook, one for each year and PPBE cycle, read beside the five-year plan.', <max ts over ACEDB.sets>, lbl('Cost estimates')+I.acei+I.acet)`.
  - It shows only "Last loaded <time>", with **no file name and no counts**. The QPE card shows the file name.
  - The counts are only in the item sub-lines.
- The other cards: `qpe` (29842, which also holds `I.exw`, WBS from execution data), `ccar`, `bae`.
- Opened by `uiGo('data')` → `uiDataOpen()` (37521). Items run through `uiPanelRun` (37335), which closes the box first.

**What happens after an import: `importAce(inp)` (17180–17227)**
- `cycBlock` refusal, then `xlsxRead`. It takes **only the first sheet** (`Object.keys(sheets)[0]`, 17192).
- The key comes from the file name, `(20\d\d)\s*ACE` → `2025ACE` (17194). An `IN_KEY_BAD` key is refused (17197).
- Then `aceParse(sheets[first], key)` (14629). A locked prior set is replaced only after a confirm.
- Then `set.locked/by/file/fp`, `ACEDB.sets[key]=set`, `persistAce()`, `spAce=key`, and `MS.spAce`.
- **It then opens the Spruills box** (`spOpen=true; render()`, 17219).
- **The report is one status line:** `statKeep('📈 <b>KEY</b> loaded and 🔒 locked — N cost lines across N appropriations, FYa–FYb. Not imported: <reason count · …>. 💾 Save…')` (17222–17224).
  - `set.skip` is `{reason: rowCount}` only. No dollars are recorded anywhere.
  - A failure is `setStat('⚠ Cost estimate import failed: …')`.
- `statKeep` (7680) is `setStat(html,{keep:true})` (7681). It is kept unread in `STAT_LOG` (7660) and listed in **Messages this session** (`#msgPanel`, `msgOpen` 7728, `msgBody` 7730), **as plain text**: buttons inside a message do nothing there.
- The only ACE report box today is none. The precedent for a stored report is the QPE's `EXDB.report` (written at 14596), drawn inline by `flowImportReport()` (18856) inside the Funds Flow panel: "Tab it looked for / found as …".
- `importAceNote(st)` (6639) names estimates a board file carried and did not apply.

**ACE fixtures in the suites (all positional)**
- No suite calls `aceParse` directly.
- Every ACE workbook fixture is built by the board's own writer, through `globalThis.__wb(sheets,name)` (= `buildXlsx`), with rows from `__aceRows`. `__aceRows` puts the year header on `rows[4][ACE_COL.y0]` and fills cells by `ACE_COL` index, `ce` included.
  - `audit-import.mjs` 5700, scenario "v1.97 — typed money is held to the import door’s bound…" (5652). Its `edit` writes `r[ACE_COL.ce]=t`.
  - `audit-recon.mjs` 5822, "v2.00 (U10) — a cost estimate, a BAE list, CCaR records or a destination change is refused in a locked view…" (5809).
  - `audit-recon.mjs` 6076, "v2.00 (U10) — a file, a package, the band ladder or a shared copy is refused in a locked view…" (6056).
  - `audit-recon.mjs` 6479, "v2.00 (U10) — a view put on screen while Load theirs reads the shared folder keeps nothing aside" (6459).
  - **All four break once the import finds its header and columns by title.**
- Hand-built `ACEDB.sets` (line shape `{ap, pmo, svc, sub, ce, ccar, wbs, v:{year:$}}`) appear in:
  - audit-recon "v1.99 item 94 — an office with only estimate lines…" (3584), the only `aceBody` test;
  - panels-render `FDC_SEED` (35–40);
  - dialogs-keyboard `PRE.fdcPanel`;
  - hostile.mjs 113.
- No test checks the Data card's "Last loaded" line. audit-board "v1.96 — a long menu folds…" (3803) asserts the four card titles and **"Data 7"** shown items (3822–3824), and that `toggleExw` lives only in `dd_data` (3902).

---

### 3. Budget Management, PPBE positions, and where a per-year over/under flag could go

**Budget Management (no test drives `bmBody` or `bmPpRow`)**
- `let bmOpen=false` (20506). `toggleBm()` (25266). `bmBody()` (25271–25291).
  - It starts with `bmPpRow()`, then the table: Discretionary (base), Mandatory (base), one row per `S.bm.adds[k]` (name input, pool select, vector), EFFECTIVE Disc/Mand (`S.discSvc`/`S.mandSvc`), and "＋ Add funding source".
- Markup: `#bmPanel` / `#bmBody`, 2525–2530.
- Reached only by the Fund tools button (`#t_fund`, 1932–1933, `toggleBm()`) and by `I.bm` (29782) in the folded Tools menu `dd_modetools`. It is **not on the left menu**, and not in left-menu.mjs `WANT`.
- Position helpers:
  - `bmPpLbl` (25982), `bmPp()` (25986);
  - `bmPpVec(key,fy)` (25990) → `{d[], m[], covered[], tot, absent[], outside[]}`;
  - `bmPpOptions` (26010), `bmPpState` (26018, untouched / edited / moved / gone);
  - `bmSeedFromPp(key)` (26031): confirm, write `S.bm.disc/mand`, record `S.bm.pp={key,fy,ts,by,cov,disc,mand}`, then `applyBudget(); save(); render()`;
  - `bmPpClear` (26063), `bmPpRow()` (26072–26125).
- `applyBudget()` (26127): `S.discSvc/mandSvc = D$(base + adds by pool)`, floored at 0.
- Setters: `bmSetBase` (26135), `bmAddSrc` (26141), `bmSrcSet` (26148), `bmSrcDel` (26155).
- `applyState` builds `S.bm` from `discSvc/mandSvc` (6327). The 85% seed is at 6317. It calls `applyBudget()` (6370).
- `discTot`/`mandTot` (25550–25551) sum `S.discSvc`/`S.mandSvc`. `scenMand(i)` is 21406.
- Test fixtures: `boot.mjs` `seed()` (157) writes `S.discSvc`/`S.mandSvc` directly, not `S.bm`.

**PPBE Budget Positions box**
- State (22029): `let ppOpen=false, ppCyc='PB', ppYr=null, ppSvcIdx=0`.
- `PPBE_CYCLES=['POM','BES','PB','DoN']` (23560). `toggleP2()` (23564). Markup `#ppPanel`/`#ppBody` at 2504–2509.
- Shape: `MS.ppbe[key] = {v:2, split, lines:{svc:[{k,…}]}, val:{svc:{lineKey:{fy:{d,m}}}}, unit:{svc:'k'}, kx:{svc:{t,by,n,from,to,cells}}}`.
  - `ppNorm` (23617) is pure. `ppPos` (23660) normalises in place.
- Readers:
  - `ppCell`, `ppKeysOf` (23684);
  - **`ppSvcFy(P,sv,fy)` → `{d,m,t}`**;
  - `ppSvcsOf` (23695);
  - `ppSetV` (~23790);
  - `ppTotCell` (23831), `ppSumFy` (23837).
- **`ppBody()` (23842)**, top to bottom:
  - cycle and cycle-year pickers, the key label, delete, and the "Logged:" chips;
  - the window note, with years outside it;
  - the split radio;
  - service buttons, then the $/$K row (`.ppunit`);
  - the per-service table `.fctab.pptab` (labels in `td.pplbl`), the service TOTAL row;
  - "ROLL-UP BY SERVICE" (23979) and the ALL SERVICES row (23998).
  - The roll-up is the natural home for a per-year "requirements hold vs position" row.
- Tests:
  - audit-board "v2.06 — PPBE Budget Positions: the TOTAL corners, and figures entered in $K" (5341);
  - "v2.06 — the pre-merge review’s PPBE fixes…" (5440);
  - "v2.06 — the second review: a service is not renamed onto a name a PPBE position still holds" (5489);
  - "v2.02 (D5c…)" (2665), the only `bmSeedFromPp` test: a hand-built `MS.ppbe['POM|2099']`;
  - audit-recon "v2.00 (U10) — a spend-plan choice, a PPBE position…" (5955);
  - audit-other "v2.10 A — FYDP Disconnects…" (2910) and "v2.10 review … (A-3)" (3389).
  - All use hand-built `MS.ppbe` objects.
- layout-fits **L** (492) drives `ppLineAdd`/`ppLineSet`/`ppSetV`/`ppSplitSet`/`toggleP2` and reads `#ppBody table.fctab` by what each cell holds.

**Candidate places for a per-year, per-appropriation, per-service, per-lane flag**
- **Posture** (25917–25935).
  - The lanes block prints `dBA` ("BA") from `discTot()`.
  - Positional readers would break if the blocks change: layout-fits A (154–158) and audit-board "the funding posture prints the scorecards’ figures" (3252) read `.pplanes [data-v]` as `[dBA, dLeft, mBA, mLeft]` by index, `.pp.mc .v`, and **`.pp:nth-child(3) .v`** (whole budget).
  - So a new block inserted before the third, or extra `data-v` inside `.pplanes`, breaks both.
  - The scorecard texts say "BA: … · set in 💰 Budget Management (Fund)" (25817, 25829), and both tests regex on `BA: \$`.
- **Needs attention:** a new kind, as in §1.
- **The year menu `dd_fy`** (29596–29615). Each year is `mi('FYxx', switchYear, …, sub)`, with sub = 'working now' / 'has data' / 'not started'. A flag fits in that sub string.
  - audit-board 3803 counts "the year 9" items, so adding items there changes the count.
- **The not-drawn list:**
  - `ndData()` (3463): one entry per Split line where typed > drawn, `{id, rank, i, lane, typed, drew, gap, short, why}`, cached in `_ndCache` (3805).
  - `ndStripChip()` (3498), `ndRowTip`/`ndRowChip` (3509), `ndBody()` (3647), `ndSetDrawn` (3676), `ndSetAll` (3685).
  - Markup `#ndPanel`, 2081–2086.
  - It answers "the lane cannot pay". It is not a comparison against the position.
- **Funding by service** `svcSummary()` (26292): a chart, then a table with columns Service, Ask, Disc BA, Disc funded, Disc remaining, ★ MC need, MC Total, Mand BA, Mand drawn, Mand remaining, Unfunded.
  - layout-fits A takes the **last** column as Unfunded.
  - audit-import "v1.86 — the ◨ switch moves every spend plan together…" (3007) reads the TOTAL row's `slice(7,9)` (Mand BA, Mand drawn) **by position**.
  - audit-board "unfunded means the same thing on every surface" (1780) finds the column by its header "Unfunded".
  - The Disc BA and Mand BA tooltips say "edit in 💰 Budget Management" (26327, 26333).
- **Others:**
  - the header `#cycTag` (above);
  - the KPI cards `uiKpis()` (37167), reading `window.UI_KPI`, set in scoreboard at 25937;
  - the fit strip `fitBySvc` (3360), with BA = `S.discSvc[i]`;
  - the Spruills box (`spBody`, 24392). `importAce` opens it after an import.

---

### 4. The guide `<template id="helpDoc">` (2111–2309)
- **Size:** 61,095 characters between the tags. audit-import "v1.86 — the help guide: in the file, opened only from 📖, and it changes nothing" (3413) fails at `doc.length < 64000` (3423), so there are **about 2,900 characters of room**.
- **It has no section on WBS, the cost estimate import, Budget Management or PPBE positions.** The relevant text:
  - **o-update** "Update your requirements" (2137):
    - 2148: the PPBE $K paragraph ("In <b>PPBE Budget Positions</b> each service can be set to…").
    - 2150: `<h4>Everything else on the requirement</h4>`. The following paragraph lists WBS among the box's fields.
  - **o-new** "Proposing a new requirement" (2153): 2156 lists "WBS (a prime contract’s is logged per CLIN, in its CLIN drill)" among the Add requirements.
  - **t-board** (2213): "Data (everything that brings data in)".
  - **t-add** "Adding a requirement" (2223).
  - **t-alloc** "Allocating, and what does not draw" (2250):
    - 2255 lists the Needs attention entries by hand: ⚠, ○, 📅, ◔, 🔧, ➖, ✈, ✂. It is already missing 🏷 SI.
    - 2258 (`.v199-h91`) gives "WBS 40" as a code limit.
  - **t-fydp** "The five-year plan by PMO" (2294):
    - 2296 `.fdc-help` (FYDP Disconnects, with the Budget Positions as controls);
    - 2297 `.cyc-ap`;
    - 2298 `.cyc-keeps`: "the PPBE positions … are read as they are now".
  - **t-flow** "The funds flow and the ACE tie-out" (2300), with the ACE tie-out at 2303 (`.v199-h94`) and 2304 (`.v199-h96`).
- **`data-fl` used in the guide:** only `cons` (5), `dn` (3) and `rec` (4). **No `data-fl="wbs"`.** `helpSections` fills them from `REQ_FIELD`.
- **`.mp[data-m]` paths in the guide:**
  - `aud` (My editor name, Take the pen), `basis` (◨ Discretionary only), `exec` (CR Cash Needs, Spend Plan Forecast);
  - `fydp` (FYDP Disconnects, Five-year spend plan, Funds Flow);
  - `imp` (five items), `offices` (three items);
  - `rep` (ACE Tie-Out, IDS Batch Import, Excel Workbook);
  - `setup` (RCN / EEIC, Live view, Save diagnostics, Destinations, Services);
  - `view` (Filter ▾ › Funding › ▲ Set higher than it draws).
  - **No path names Data, PPBE Budget Positions or Budget management.**
  - A guide `data-m` must be a `.menu` id suffix (`fy`, `pmo`, `view`, `basis`, `modetools`) or a menu-paths `LEFTM` key (`rep`, `data`, `setup`, `imp`, `offices`, `aud`, `hist`, `fydp`, `exec`). `fund` is **not** valid in the guide; the source-string check does accept `Fund › …`, against `t_fund`.

---

### 5. Browser and static checks that must learn about new boxes or items
- **`check.mjs`:**
  - "every box is one the box controller can drive" (308): `body > .modal-bg[id]` with a `.modal`, an `<h3>` and `h3 button.x`;
  - every handler name resolves (200), values only through `jsa()` (223), keyboard reach in the markup (248);
  - "a requirement's fields are named in one place" (623, 629–661): `recF()` takes a key; `PMO_FIELDS` reads `FL()`.
- **`panels-render.mjs`:**
  - A box opens by its backdrop `fn()`, or by `SPECIAL` (44–103); `attPanel` there is only `attShow('oblig')` (58).
  - A new box's open flag must go in `FALSE` (191–194). That list already has `aceOpen`, `bmOpen`, `ppOpen`. `NUL` (195) has `wbsOpen`, `attOpen`.
  - Every `[id$="Panel"]` must be covered (~225).
- **`dialogs-keyboard.mjs`** (fixture `buildPopulated`, from ia-fixture.mjs, with no WBS, ACE or ppbe):
  - It finds each box's opener from the backdrop's onclick (`KNOWN` map 61–68; `attClose` → `attShow(`), then reaches it by keyboard through a menu, the left menu's `HOST` lists, or any visible button.
  - `PRE` (107–115) seeds context, and a box with a text field gets the discard-guard test, so fields a box saves only on its own button need `data-held`.
- **`left-menu.mjs` A** (`WANT` 49–83; count `=== 69` at 157):
  - Every call reachable from the left menu must appear exactly as often as `WANT` says.
  - The Data box today: `#srcFile`, `#ccarFile`, `toggleExw`, `#aceFile`, `toggleAce`, `#budFile`, `toggleBudReg`.
  - A new item (a WBS list, or an import-report or column-mapping box) means a new `WANT` entry and a new count. G holds "no icon, no sideways scroll".
- **`menu-paths.mjs`:**
  - `MENUS` (34–56) includes `'Data': 'dd_data'` and `'Fund': 't_fund'`.
  - It checks every `<menu> \u203a <item>` string in the source. Today against `dd_data`: 4134, 14511, 14960, 19557, 24618, 31633.
  - A literal `›` (as at 26080, `FYDP › <b>PPBE Budget Positions`) is **not** checked.
  - Guide `.mp` checks are at 175–222.
- **`keyboard-reach.mjs`** sections: A–C, D, D2, E, F, G, G2, G3, L (Needs attention 🔧 via `tabTo('#helpBtn', …, 60)`, in Fund), H, I, J, K, M (Add box), P, Q, R (FYDP Disconnects). A new posture button before 🔧 adds Tab stops to L.
- **`layout-fits.mjs`** letters used: **A–O**, all of them (A 143, B 181, C 220, D 249, E 267, F 281, G 305, H 326, I 342, K 377, J 431, L 492, M 530, N 654, O 714). The next free letter is **P**.
- **`standards-check.mjs`:**
  - `tools/a11y-baseline.json` has `findings: []`.
  - It measures with menus and boxes opened by hand-added drives: the left-menu boxes 290–301, awfix 321, Add, edit, FDC.
  - **It does not open Budget Management, PPBE positions, the ACE tie-out, or any Needs attention list but awfix.** A new box is measured only if a drive and a `coverage` record are added.
- **`row-controls.json`** (build stamp v2.08): the row and RECORD panel controls.
  - Today's WBS control there is only the row's CLIN `toggleWbs('…','…','…')`.
  - The RECORD panel has no WBS control (`recFields`' `wbsQuick` is drawn only in Classify), so a WBS picker added to the RECORD panel must be re-recorded with `--record`.
- **`hostile.mjs`:** `SPECIAL` (184–190) and `MUST_SHOW` (199–206) already include `wbs1`, `aceset`, `bmadd`. Planted WBS names would need drawing somewhere.

---

### 6. `REQ_FIELD` and `FL('wbs')`
- `REQ_FIELD` (2801–2811). Line 2807: `wbs:{l:'WBS'}, wbsSplit:{l:'Split by service'}`.
- `FL(k)` (2812) and `FLI(k)` (2813) read it by own key.
- Uses of the `wbs` key:
  - `PMO_FIELDS` `['wbs', FL('wbs')]` (8064);
  - `reqNeeds` `add('wbs', d.ptype==='PRIME' || d.wbs)` (8503);
  - `recFields` `recF('wbs', …)` (27275, prime → `clinGo`; 27280 → `wbsQuick`) and `recF('wbsSplit', …)` (27283);
  - the Add box `arField('arWbs','wbs', arInp('arWbs',{req:1, ph:'e.g. 1.2.3'}))` (32475);
  - the edit box label `FL('wbs')` with `erInp('erWbs', …, {ph:'e.g. 1.2.3'})` (33338–33339) and `erGo('wbs'|'clin')` (33506);
  - `reqApply`'s WBS write (33599) and `ER_AT.wbs='erWbs'` (33244);
  - `IMP_CATS` `['wbs','WBS (requirement)']` (6582), whose label does not come from the registry;
  - `NA_FROM_CARRY` (32921–32922).
- The three free-text WBS inputs a picker would replace: the WBS panel row input (27731, `placeholder="1.2.3"`, → `wbsSetNum`), `#arWbs`, and `#erWbs`. Also the `wbsQuick` prompt (27131, `uiPrompt`).
- audit-board "v2.03 — a requirement’s fields are named in one place (item 20)" (5170) reads `FL('wbs')` (`r.wbsL`) against `pmoProposalGate`.

---

### 7. Not found
- No ACE import report box, column-mapping prompt or stored import report. Only `set.skip` row counts and one `statKeep` line exist.
- No test of `bmBody`, `bmPpRow` or `bmPpState`. No direct `aceParse` test. No test of the Data card's "Last loaded".
- No guide section, path or `data-fl` for WBS, ACE import, Budget Management or PPBE positions.
- `fydpPosKey` is gone (see §0).