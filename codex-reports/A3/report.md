BATCH A3  |  base 7ee498a46507972f803cd48ce9f27d5d668acb63  |  started 2026-10-13T12:15:13.619341-04:00 / finished 2026-10-13T12:45:49.510920-04:00 ET

FINDINGS:

U40 reproduced from the handoff's actual supplied `vdest.mjs`: add two destinations through `flowAddEnt` / `flowSetEnt`, name them `Alpha Depot` and `ALPHA DEPOT`, assign R1's literal $900 to the first and R2's literal $300 to the second, and build the actual saved HTML. Opening fresh preserves them. Opening against a newer second-person destination list folds them into one: both requirement pointers name Alpha Depot, and the file saved there preserves that merge. The diagnostic reproduction exits 0 because it prints comparisons; its `DIFFERS` lines are evidence of the defect, not a safety pass.

Expected: R1 owns $900 on Alpha Depot, R2 owns $300 on ALPHA DEPOT, total $1,200, and both identities survive each saved year, both hops, locked cycles and a saved-file reopen. Actual base focused run: 82 failed checks, 34 controls passed, no exception and no scenario skipped. Fixed focused run: 116/116 passed. Actual emitted Funds Flow XLSX bytes were decoded and checked for separate destination detail sheets with R1 $900 and R2 $300; no R2 row is allowed under R1's destination.

An independent reviewer found an additional route in the initial proposal: an older legacy `DESTDB.lmap` can map both source keys to one local key before name matching is reached. The final proposal prevents that cached collapse too. The independent reviewer tested actual legacy saved-file opening through newer cached storage and actual save/reopen; its 17 ownership checks passed after the correction. This is an extension of U40, not a new unrelated finding.

The real generated name input is also exercised through its `change` handler: a refused name remains available to correct, receives a red border, `aria-invalid` and a tooltip naming the actual stored name; refusal preserves focus and stored state. A successful correction stores the literal `Charlie Yard` and clears the stale field marker and tooltip.

Final independent review is scoped clean: no remaining A3 must-fix or should-fix. It ran 13/13 actual generated-field, focus, state, storage and successful-correction checks fresh on final board `2419366b6af4417a64ebc294479721e29ed1706b` (exit 0, 1.681 s). Its same probe on the base has 7 protection failures and 6 passing controls (exit 1, 1.372 s). The earlier 17/17 ownership probe is explicitly reused after `ownership-reuse.json` establishes byte identity of `destFold`, `destRemap`, `destMigrate`, `destJoin`, `destNotice` and unchanged save/reopen scope between corrected board `6e29aa8c10c168027da67d1970034cd931b89e09` and the final board. `A3-review/REVIEW.md` records exact independent commands and raw evidence. No complete-suite or integrated acceptance follows from this scoped review.

PROPOSAL:

- `flowSetEnt`: refuse an entire canonical duplicate name before writes; call the existing `codeRefusedIn` field-marking path.
- `destFold`: keep incoming identities separate for duplicate incoming names, ambiguous local names, a different key in the same v1.86 list, and collapsed cached mappings.
- `destJoin` / `destNotice`: list this session's actual name-based key remaps; compute a persistent-in-view duplicate notice from the entries rather than adding a new saved field.
- Opening / destination editor: append the initial notice without replacing import or storage safety messages, and keep the notice available in the editor after later status messages.
- `audit-import.mjs`: append one async v2.00 block with the exact `bootMark` / `bootRelease(__bm, keepBoards())` / `settleBoards` and scenario-name conventions. Existing assertion lines and expectations are unchanged.
- `mutate.mjs` TEXT: insert ten proposal entries at the specified R3 anchor. None is imported or executed; all 1,328 existing entries remain unmodified and need no retarget.

Exact final proposal blobs (not commits): board `2419366b6af4417a64ebc294479721e29ed1706b`; audit-import `f68e4a54b5471fd67e82071213b99045b1f8242d`; catalog TEXT `5a4d934ad4327dc69f11d351185d8632de80c6ae`. The board's empty `pubState` payload is byte-identical to the base. Synthetic populated saved HTML existed only in memory during tests; no populated board is returned.

All unified diffs against the exact base follow at the end of this report.

RUNS:

Runtime: Node v24.19.0, jsdom 27.0.0, the task-local native encoding adapter; `NODE_OPTIONS`, `BOOT_PARSE`, `MUT_FIRST_FAIL`, `SUITE_CHECKS` unset. The root `runner.py` supervises each own process group, caps it, terminates only that group and records Eastern times. All final runs below completed before their caps; all recorded groups exited.

| Run | Actual child command | Exit | Duration / cap | Actual Eastern interval |
| --- | --- | --- | --- | --- |
| `repro-base` | `node /workspace/orbit-codex-batches-20261013-1205ET/A3/vdest.mjs /workspace/orbit-codex-batches-20261013-1205ET/A3/base` | 0 | 3.391 s / cap 120 s | 2026-10-13T12:15:13.649413-04:00 → 2026-10-13T12:15:17.040471-04:00 |
| `focused-base-complete` | `env BOARD=/workspace/orbit-codex-batches-20261013-1205ET/A3/base/prioritization-board-grid.html node --import /workspace/orbit-codex-batches-20261013-1205ET/A3/base/runtime-encoding-shim.mjs focused.mjs` | 1 | 13.515 s / cap 180 s | 2026-10-13T12:32:07.317528-04:00 → 2026-10-13T12:32:20.832561-04:00 |
| `focused-fix-delivery` | `env BOARD=/workspace/orbit-codex-batches-20261013-1205ET/A3/fix/prioritization-board-grid.html node --import /workspace/orbit-codex-batches-20261013-1205ET/A3/base/runtime-encoding-shim.mjs focused.mjs` | 0 | 14.4 s / cap 180 s | 2026-10-13T12:32:08.582396-04:00 → 2026-10-13T12:32:22.946497-04:00 |
| `legacy-fix-delivery` | `env BOARD=/workspace/orbit-codex-batches-20261013-1205ET/A3/fix/prioritization-board-grid.html node --import /workspace/orbit-codex-batches-20261013-1205ET/A3/base/runtime-encoding-shim.mjs legacy-destinations.mjs` | 0 | 12.292 s / cap 180 s | 2026-10-13T12:32:11.498221-04:00 → 2026-10-13T12:32:23.790177-04:00 |
| `mcount-delivery` | `python3 -I /workspace/orbit-codex-batches-20261013-1205ET/helpers/mcount.py tools/export-audit/mutate.mjs prioritization-board-grid.html` | 0 | 4.6 s / cap 60 s | 2026-10-13T12:32:10.142527-04:00 → 2026-10-13T12:32:14.741798-04:00 |

Results: supplied base reproduction prints the silent reassignment; proposed block on base 34 passed / 82 failed out of 116; proposed block on fixed board 116/116; the first two inherited v1.86 destination scenarios, extracted without changing their assertions, 40/40 on the final board; mcount 1,338 entries, 1,338 once, 0 missing, 0 multiple, 0 unparsed. The 34 checks that pass on both base and fix are explicit healthy controls or preservation invariants; the defect checks fail before and pass after. None derives expected dollars from an ORBIT helper.

Every mutant is made by this bounded command form, reading the catalog as text only:

`python3 runner.py --cap 30 --cwd A3 --log <id>-make.log --meta <id>-make-meta.json -- python3 -I helpers/mkmut.py A3/fix/tools/export-audit/mutate.mjs A3/fix/prioritization-board-grid.html <id> A3/mutants/<id>.html`

Every counted sensitivity run uses this bounded command form:

`python3 runner.py --cap 180 --cwd A3 --log <id>.log --meta <id>-meta.json -- env BOARD=A3/mutants/<id>.html node --import A3/base/runtime-encoding-shim.mjs focused.mjs`

The exact absolute commands, Eastern starts/finishes, exit status, duration and owned group are in each `A3/mutants/<id>-meta.json`; each maker recorded one exact find match. Every mutant failed a named protection-specific assertion, without a thrown block or a never-ran failure:

| Proposed mutant | Exit | Duration / cap | Failing / total checks | Harness exception |
| --- | --- | --- | --- | --- |
| `v200-u40-typed-duplicate-open` | 1 | 3.334 s / cap 180 s | 12 / 116 | no |
| `v200-u40-incoming-duplicate-merged` | 1 | 4.523 s / cap 180 s | 37 / 116 | no |
| `v200-u40-ambiguous-local-first` | 1 | 4.889 s / cap 180 s | 2 / 116 | no |
| `v200-u40-same-list-key-consumed` | 1 | 4.724 s / cap 180 s | 2 / 116 | no |
| `v200-u40-preserved-duplicates-unsaid` | 1 | 5.528 s / cap 180 s | 9 / 116 | no |
| `v200-u40-name-merge-unsaid` | 1 | 6.445 s / cap 180 s | 1 / 116 | no |
| `v200-u40-editor-notice-gone` | 1 | 14.366 s / cap 180 s | 8 / 116 | no |
| `v200-u40-opening-notice-gone` | 1 | 5.515 s / cap 180 s | 2 / 116 | no |
| `v200-u40-cached-map-collapse` | 1 | 4.672 s / cap 180 s | 10 / 116 | no |
| `v200-u40-refusal-field-unmarked` | 1 | 4.314 s / cap 180 s | 2 / 116 | no |

Raw evidence: `A3/repro-base.log`, `A3/focused-base-complete.log`, `A3/focused-fix-delivery.log`, `A3/legacy-fix-delivery.log`, `A3/mcount-delivery.log`, `A3/mutants/results.json` and their metadata. Initial proposal / fixture-debugging / earlier sensitivity runs are kept as superseded and are not the final counts. An independent review's raw source and logs live in `A3-review/`.

NOT DONE / LIMITS:

No branch edits, commits, pushes, PRs, posts, repository checkpoint changes, full gate, full mutation sweep, `mutate.mjs` import/execution, `validate:math` or `playwright install`. No real budget files or shared folders accessed. No B2, C1, C2 or D1 begun.

This report establishes bounded synthetic jsdom execution and real application XLSX/save-HTML bytes. It does not establish native FSA or real two-machine behavior, Chromium visual acceptance, or Excel/LibreOffice acceptance. The complete audit-import suite and browser/standards gates were not run; the added block and two existing destination scenarios were extracted and executed. Whole-suite sensitivity still requires the lead's integration lane.

A later export/save/status message can replace the opening notice. The destination editor recomputes and retains duplicate disclosure, and actual key-remap notices persist for this session; merge history is not added to the saved format. An already saved file that contains only the merged identity and no longer carries its original two source entries cannot reconstruct those lost identities. Ordinary unambiguous cross-copy / legacy name merges are deliberately preserved and disclosed.

QUESTIONS FOR BRAD:

None. This is the authorized A3 sandbox proposal for the lead's independent adoption reviews; it does not approve release or close broader findings.

```diff
diff --git a/prioritization-board-grid.html b/prioritization-board-grid.html
--- a/prioritization-board-grid.html
+++ b/prioritization-board-grid.html
@@ -2370,7 +2370,7 @@
   return d;
 })();
 // var, not let: flowEnts() can be asked for before the lines that would declare these have run
-var _destReady=false, _destOthers=false, _destBusy=false, _destOpening=false;
+var _destReady=false, _destOthers=false, _destBusy=false, _destOpening=false, _destMerges=[];
 // WHAT A FULL IMPORT BROUGHT (v1.86). The import reloads the board to open what it wrote, so the
 // report it owes is kept across the reload and said on the first render after it.
 var _impRep=(function(){ try{ const r=localStorage.getItem('prio27impRep'); if(r) localStorage.removeItem('prio27impRep'); return r; }catch(e){ return null; } })(), _impSaid=false;
@@ -14893,6 +14893,9 @@
 }
 // Match terms are combined; a different KIND is kept as the board has it and named for the owner.
 function destJoin(hit, e, from){
+  // v2.00 (U40): every name-based re-pointing is disclosed in this session, never silently.
+  if(hit.k!==String(e.k) && !_destMerges.some(function(m){ return m.k===String(e.k) && m.to===hit.k && m.from===from; }))
+    _destMerges.push({k:String(e.k), n:String(e.n||''), to:hit.k, name:String(hit.n||''), from:from});
   const toks=flowToks(hit.t);
   flowToks(e.t).forEach(function(t){ if(!toks.some(function(x){ return x.toUpperCase()===t.toUpperCase(); })) toks.push(t); });
   hit.t=toks.join(', ');
@@ -14913,6 +14916,7 @@
 // only while something still points at it.
 function destFold(list, from, v186, refs){
   const al=Object.create(null);
+  const claimed=Object.create(null);   // v2.00 (U40): even an old cached map cannot consume two source identities
   let fresh=false;
   // v1.99 (item 95): `fresh` says a key had to change; `touched` says anything the destination list holds changed -- a
   // destination added under its own key, a joined name, a map entry or the list's signature -- so it is stored and
@@ -14933,9 +14937,15 @@
       hit=destHas(lm[e.k]);
       if(!hit && !used) return;          // read before, and deleted here since
     }
+    if(hit && Object.prototype.hasOwnProperty.call(claimed, hit.k) && claimed[hit.k]!==String(e.k)){ hit=null; first=true; }
     if(hit){ if(v186 && hit.k!==e.k){ destJoin(hit, e, from); touched=true; } }
     else {
       hit=destByName(e.n);
+      // v2.00 (U40): keys beside one list keep distinct destinations. A duplicate name, an ambiguous
+      // local name, or a different key in this same v1.86 list is not permission to move a requirement.
+      if(hit && (list.some(function(x){ return x && x.k!==e.k && destNamed(x.n) && destName(x.n)===destName(e.n); })
+        || DESTDB.ents.filter(function(x){ return destName(x.n)===destName(e.n); }).length>1
+        || (v186 && list.some(function(x){ return x && x.k===hit.k && x.k!==e.k; })))) hit=null;
       if(hit){ if(first){ destJoin(hit, e, from); touched=true; } }
       else {
         if(!used && !destNamed(e.n)) return;       // an unnamed placeholder nobody uses is not carried
@@ -14946,6 +14956,7 @@
         DESTDB.ents.push(hit);
       }
     }
+    claimed[hit.k]=String(e.k);
     if(lm && lm[e.k]!==hit.k){ lm[e.k]=hit.k; touched=true; if(hit.k!==e.k) fresh=true; }
     if(hit.k!==e.k) al[e.k]=hit.k;
   });
@@ -15112,8 +15123,14 @@
 }
 function flowEntUseElse(k, M){ return ((M||flowEntUseMap())[k])||{}; }
 function flowEntUseElseTxt(U){ return Object.keys(U).map(function(w){ return w+' ('+U[w]+')'; }).join(', '); }
-function flowSetEnt(i, field, v){
+function flowSetEnt(i, field, v, el){
   const L=flowEnts(), e=L[i]; if(!e) return;
+  // v2.00 (U40): refuse the whole typed name before changing or saving anything.
+  if(field==='n' && destNamed(v) && L.some(function(x){ return x!==e && destName(x.n)===destName(v); })){
+    codeRefusedIn(el, 'Destination name not changed', 'Not saved: another destination has that name (ignoring case and extra spaces). '
+      +'Stored name: '+String(e.n||'')+'. Give this destination a different name; both destinations and their requirements are unchanged');
+    return;
+  }
   if(field==='kind'){ e.kind=(v==='prime'?'prime':(v==='gov'?'gov':'other'));
     DESTDB.conflicts=DESTDB.conflicts.filter(function(c){ return c.k!==e.k; }); }
   else e[field]=String(v==null?'':v);
@@ -15705,6 +15722,15 @@
 // The registry, editable. Match terms are optional: they let the chart recognise a destination in
 // the source file's own text, which is how a plan event with no requirement behind it can still be
 // placed. A destination with no terms is only ever reached by logging it on a requirement.
+function destNotice(){
+  const L=DESTDB.ents||[], D=L.filter(function(e,i){ return destNamed(e.n) && L.some(function(x,j){ return i!==j && destName(x.n)===destName(e.n); }); });
+  let h=D.length? '⚠ <b>Destinations with matching names were kept separate.</b> '
+    +D.map(function(e){ return esc(e.n)+' ['+esc(e.k)+']'; }).join(' · ')
+    +'. Requirements still point at their own keys. Rename these destinations to make the distinction clear.' : '';
+  if(_destMerges.length) h+=(h? ' ' : '')+'<b>Destination names matched:</b> '+_destMerges.map(function(m){
+    return esc(m.n)+' ['+esc(m.k)+'] → '+esc(m.name)+' ['+esc(m.to)+'] ('+esc(m.from||'an imported list')+')'; }).join(' · ')+'.';
+  return h;
+}
 function flowEntEditor(){
   const L=flowEnts();
   const cf=(DESTDB.conflicts||[]).filter(function(c){ return flowEnt(c.k); });
@@ -15729,7 +15755,7 @@
     const i=L.indexOf(e), used=flowEntUse(e.k), U=flowEntUseElse(e.k, UM), uT=flowEntUseElseTxt(U);
     h+='<tr><td style="text-align:left"><input class="btn" style="font-size:9.5px;padding:3px 6px;width:98%'
       +(destNamed(e.n)? '"' : ';outline:2px solid var(--amber)" data-destnew="1"')+' '
-      +'value="'+esc(e.n)+'" onchange="flowSetEnt('+i+',&quot;n&quot;,this.value)"></td>'
+      +'value="'+esc(e.n)+'" onchange="flowSetEnt('+i+',&quot;n&quot;,this.value,this)"></td>'
       +'<td style="text-align:left"><select class="btn" style="font-size:9.5px;padding:3px 6px" '
       +'onchange="flowSetEnt('+i+',&quot;kind&quot;,this.value)">'
       +[['prime','Contractor'],['gov','Government activity'],['other','Other']]
@@ -15742,6 +15768,7 @@
       +'<td><button class="qb" style="color:var(--red)" onclick="flowDelEnt('+i+')" title="remove">✕</button></td></tr>';
   });
   h+='</table>'
+    +(destNotice()? '<div style="font-size:9.5px;color:var(--amber);margin-top:6px">'+destNotice()+'</div>' : '')
     +(cf.length? '<div style="font-size:9.5px;color:var(--amber);margin-top:6px">\u26a0 Named with a different kind on another appropriation: '
       +cf.map(function(c){ const e=flowEnt(c.k); return esc(e.n)+' ('+esc(c.from==='import'? 'an imported file' : appnName(c.from))+' had '
         +esc({prime:'Contractor', gov:'Government activity', other:'Other'}[c.kind]||c.kind)+')'; }).join(' \u00b7 ')
@@ -31583,6 +31610,12 @@
       +(PMODE&&PMODE.ts? ' on '+esc(new Date(PMODE.ts).toLocaleDateString()):'')
       +'. Your work is kept in this browser, against this copy. <b>\u2709 Submit input</b> sends your office\u2019s changes to the portfolio team.'
     : '📦 Opened with the saved board state — last saved'+(PUB.by? ' by <b>'+esc(PUB.by)+'</b>':'')+' '+fmtTs(PUB.ts)+'. Make changes and 💾 Save to pass it on.'); _statQuiet=false; }
+// v2.00 (U40): opening discloses preserved duplicates and each name-based merge without hiding an
+// import/storage safety warning. The Funds Flow editor also keeps this notice available after later messages.
+if(destNotice()){
+  const de=document.getElementById('shareStat');
+  _statQuiet=false; setStat((de? de.innerHTML+' ' : '')+destNotice());
+}
 function loadShared(cb){
   // file:// (shared drive / synced folder): fetch is blocked, but XHR works when
   // the board is opened via the provided launcher (--allow-file-access-from-files)
```

```diff
diff --git a/tools/export-audit/audit-import.mjs b/tools/export-audit/audit-import.mjs
--- a/tools/export-audit/audit-import.mjs
+++ b/tools/export-audit/audit-import.mjs
@@ -7798,6 +7798,103 @@
 })();
 // ==== end v2.00 (U13) ====
 
+// ==== v2.00 (U40): destination identities survive matching names ====
+await (async () => {
+  const __bm = bootMark();
+  const name = 'v2.00 (U40) — matching destination names never silently move a requirement';
+  try {
+    const sc={services:['USAF','ANG','AFRC'], items:[it('R1','AV',[900,0,0]),it('R2','AV',[300,0,0])],
+      disc:[5000,5000,5000],mand:[0,0,0],order:['R1','R2']};
+    const make=()=>{ const W=boot(); seed(W.ev,sc); W.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); 'ok'`); return W; };
+    const lists=()=>[{k:'U40-A',n:'Alpha Depot',kind:'gov',t:''},{k:'U40-B',n:'ALPHA DEPOT',kind:'gov',t:''}];
+    const storage=W=>JSON.parse(W.ev(`JSON.stringify((function(){var o={}; for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);o[k]=localStorage.getItem(k);} return o;})())`));
+    const state=W=>JSON.parse(W.ev(`JSON.stringify({ents:DESTDB.ents, dest:S.dest, gen:_saveGen, side:_sideGen, dirty:DIRTY, base:_baseDirty})`));
+    const typed=make(); typed.ev(`DESTDB.ents=${JSON.stringify([{k:'U40-A',n:'Alpha Depot',kind:'other',t:''},{k:'U40-B',n:'Bravo Yard',kind:'other',t:''}])}; flowCfg().ents=DESTDB.ents;flowCfg().dv=1; S.dest={R1:{to:'U40-A',end:''},R2:{to:'U40-B',end:''}}; persistDest();save();flowEnts();'ok'`);
+    for(const raw of ['ALPHA DEPOT','  alpha   depot  ']){
+      const before=JSON.stringify(state(typed)), ls=JSON.stringify(storage(typed));
+      typed.ev(`flowSetEnt(1,'n',${JSON.stringify(raw)});'ok'`);
+      chk(name,'typing '+raw,'duplicate name is refused',typed.ev(`DESTDB.ents[1].n`),'Bravo Yard');
+      chk(name,'typing '+raw,'requirements, counters and flags are untouched',JSON.stringify(state(typed)),before);
+      chk(name,'typing '+raw,'no storage writes',JSON.stringify(storage(typed)),ls);
+      chk(name,'typing '+raw,'refusal is explained',/Destination name not changed/.test(typed.ev(`document.getElementById('shareStat').textContent`)),true);
+    }
+    typed.ev(`flowSetEnt(1,'n','Bravo Yard');entOpen=true;render();var el=Array.from(document.querySelectorAll('#entBody input')).filter(function(x){return (x.getAttribute('onchange')||'').startsWith('flowSetEnt(') && (x.getAttribute('onchange')||'').includes(',"n",') && x.value==='Bravo Yard';})[0];if(!el) throw Error('name control absent');el.focus();el.value='ALPHA DEPOT';el.dispatchEvent(new Event('change',{bubbles:true}));globalThis.__u40input=el; 'ok'`);
+    chk(name,'actual name control','the refused draft stays available for correction',typed.ev('__u40input.value'),'ALPHA DEPOT');
+    chk(name,'actual name control','the refused draft is visibly identified as invalid',typed.ev(`__u40input.getAttribute('aria-invalid')`),'true');
+    chk(name,'actual name control','the control names the stored value without claiming the draft was saved',typed.ev('__u40input.title'),'Not saved: another destination has that name (ignoring case and extra spaces). Stored name: Bravo Yard. Give this destination a different name; both destinations and their requirements are unchanged');
+    chk(name,'actual name control','the generated handler leaves the stored name unchanged',typed.ev(`DESTDB.ents[1].n`),'Bravo Yard');
+    chk(name,'actual name control','refusal keeps focus where the person is correcting the draft',typed.ev('document.activeElement===__u40input'),true);
+    typed.ev(`__u40input.value='Charlie Yard';__u40input.dispatchEvent(new Event('change',{bubbles:true}));globalThis.__u40correct=Array.from(document.querySelectorAll('#entBody input')).filter(function(x){return x.value==='Charlie Yard';})[0];'ok'`);
+    chk(name,'successful correction','the actual handler stores a different valid name',typed.ev('DESTDB.ents[1].n'),'Charlie Yard');
+    chk(name,'successful correction','the corrected field has no invalid marker',typed.ev(`__u40correct.getAttribute('aria-invalid')`),null);
+    chk(name,'successful correction','the corrected field has no obsolete refusal tooltip',typed.ev('__u40correct.title'),'');
+    // Controls: own-name normalization and Kind/Match terms remain editable; unnamed additions remain possible.
+    typed.ev(`flowSetEnt(0,'n',' ALPHA   DEPOT ');flowSetEnt(1,'kind','gov');flowSetEnt(1,'t','BRAVO');flowAddEnt();'ok'`);
+    chk(name,'typing controls','an entry may retain its own normalized name',typed.ev(`DESTDB.ents[0].n`),' ALPHA   DEPOT ');
+    chk(name,'typing controls','Kind and Match terms still save',typed.ev(`DESTDB.ents[1].kind+'|'+DESTDB.ents[1].t`),'gov|BRAVO');
+    chk(name,'typing controls','an unnamed placeholder may still be added',typed.ev(`DESTDB.ents[DESTDB.ents.length-1].n`),'New destination');
+    const X=make(); X.ev(`DESTDB.ents=${JSON.stringify(lists())};flowCfg().ents=DESTDB.ents;flowCfg().dv=1;flowCfg().axis='dest';flowCfg().fys=[2027];flowCfg().aps=['om'];S.dest={R1:{to:'U40-A',end:'U40-B'},R2:{to:'U40-B',end:'U40-A'}};MS.years[2028]=JSON.parse(JSON.stringify(S));CYCDB.dv=1;CYCDB.ents=DESTDB.ents;CYCDB.cycles['PB|2027']={cur:2027,base:2027,years:{2027:JSON.parse(JSON.stringify(S))}};persistDest();save();'ok'`);
+    const html=X.ev('buildSavedHtml()');
+    const checkSaved=async(W,where)=>{
+      chk(name,where,'both names survive',W.ev(`JSON.stringify(flowEnts().filter(function(e){return e.k==='U40-A'||e.k==='U40-B';}).map(function(e){return e.n;}))`),'["Alpha Depot","ALPHA DEPOT"]');
+      chk(name,where,'current year keeps both destination identities',W.ev(`S.dest.R1.to+'|'+S.dest.R2.to`),'U40-A|U40-B');
+      chk(name,where,'another saved year keeps both identities',W.ev(`MS.years[2028].dest.R1.to+'|'+MS.years[2028].dest.R2.to`),'U40-A|U40-B');
+      chk(name,where,'locked cycle keeps both identities',W.ev(`CYCDB.cycles['PB|2027'].years[2027].dest.R1.to+'|'+CYCDB.cycles['PB|2027'].years[2027].dest.R2.to`),'U40-A|U40-B');
+      chk(name,where,'current year keeps second-hop identities',W.ev(`S.dest.R1.end+'|'+S.dest.R2.end`),'U40-B|U40-A');
+      chk(name,where,'another year keeps second-hop identities',W.ev(`MS.years[2028].dest.R1.end+'|'+MS.years[2028].dest.R2.end`),'U40-B|U40-A');
+      chk(name,where,'locked cycle keeps second-hop identities',W.ev(`CYCDB.cycles['PB|2027'].years[2027].dest.R1.end+'|'+CYCDB.cycles['PB|2027'].years[2027].dest.R2.end`),'U40-B|U40-A');
+      chk(name,where,'preserved duplicate names are disclosed',/matching names were kept separate/.test(W.ev('flowEntEditor()')),true);
+      const f=JSON.parse(W.ev(`JSON.stringify(flowCalc())`));
+      chk(name,where,'R1 owns its literal $900',f.ext.by['U40-A']?.v,900);
+      chk(name,where,'R2 owns its literal $300',f.ext.by['U40-B']?.v,300);
+      chk(name,where,'literal $1200 total is unchanged',f.tot,1200);
+      const raw=await W.w.eval(`(async function(){var cap=null,_B=window.Blob;window.Blob=function(p,o){if(p&&p[0]&&p[0].byteLength) cap=p[0];return new _B(p,o);};try{exportFlow();}finally{window.Blob=_B;}if(!cap) throw Error('no workbook emitted');return JSON.stringify(await xlsxRead(cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength)));})()`);
+      const book=JSON.parse(raw), sheets=Object.entries(book).filter(([n])=>/^alpha depot(?: \d+)?$/i.test(n)), a=sheets.find(([,r])=>r.some(v=>v[0]==='Req R1')&&!r.some(v=>v[0]==='Req R2')), b=sheets.find(([,r])=>r.some(v=>v[0]==='Req R2')&&!r.some(v=>v[0]==='Req R1'));
+      chk(name,where,'actual XLSX has separate destination sheets',!!a&&!!b,true);
+      chk(name,where,'actual XLSX R1 belongs only to Alpha Depot',JSON.stringify((a?.[1]||[]).filter(r=>r[0]==='Req R1').map(r=>r[5])),'[900]');
+      chk(name,where,'actual XLSX R2 belongs only to ALPHA DEPOT',JSON.stringify((b?.[1]||[]).filter(r=>r[0]==='Req R2').map(r=>r[5])),'[300]');
+      chk(name,where,'actual XLSX never puts R2 under the first destination',(a?.[1]||[]).filter(r=>r[0]==='Req R2').length,0);
+    };
+    const fresh=boot({html});await checkSaved(fresh,'fresh file');
+    // A newer second-person list that contains neither key; also a same-name local entry must not steal either incoming key.
+    for(const local of [[{k:'U40-C',n:'Bravo Yard',kind:'other',t:''}], [{k:'U40-C',n:'Alpha Depot',kind:'other',t:''}]]){
+      const db={ts:Date.now()+10000,ents:local,lmap:{},lsig:{},conflicts:[],gone:[]};
+      const B=boot({html,ls:{prio27destdb:JSON.stringify(db)}});
+      chk(name,'newer '+local[0].n,'opening names the preserved duplicates',/matching names were kept separate/.test(B.ev(`document.getElementById('shareStat').textContent`)),true);
+      await checkSaved(B,'newer '+local[0].n);
+      const reopened=boot({html:B.ev('buildSavedHtml()')});await checkSaved(reopened,'saved after '+local[0].n);
+    }
+    // A same-file key is authoritative even if the newer local list renamed it. A name match must not consume it.
+    const K=make();K.ev(`DESTDB.ents=[{k:'U40-B',n:'Alpha Depot',kind:'other',t:''}]; var L=[{k:'U40-A',n:'Alpha Depot',kind:'other',t:''},{k:'U40-B',n:'Bravo Yard',kind:'other',t:''}]; var al=destFold(L,'om',true,{'U40-A':1,'U40-B':1}); globalThis.__u40map=JSON.stringify(al);'ok'`);
+    chk(name,'same list key','a different incoming key cannot claim its neighbor by name',K.ev('__u40map'),'{}');
+    chk(name,'same list key','both incoming identities remain',K.ev(`JSON.stringify(DESTDB.ents.map(function(e){return e.k;}).sort())`),'["U40-A","U40-B"]');
+    const A=make();A.ev(`DESTDB.ents=${JSON.stringify(lists())};var al=destFold([{k:'U40-C',n:'alpha depot',kind:'other',t:''}],'ff',true,{'U40-C':1});globalThis.__u40map=JSON.stringify(al);'ok'`);
+    chk(name,'ambiguous local name','a first name match is not selected from an ambiguous local list',A.ev('__u40map'),'{}');
+    chk(name,'ambiguous local name','the incoming distinct destination is kept',A.ev(`!!destHas('U40-C')`),true);
+    // A legacy cached map made by the defective board must not collapse two entries that its source still names.
+    const C=make();C.ev(`DESTDB.ents=[{k:'U40-C',n:'Alpha Depot',kind:'other',t:''}]; var q=${JSON.stringify(lists())}; var sg=destSig(q); DESTDB.lmap[sg]={'U40-A':'U40-C','U40-B':'U40-C'}; S.dest={R1:{to:'U40-A',end:''},R2:{to:'U40-B',end:''}}; var a=destFold(q,'om',false,{'U40-A':1,'U40-B':1}); destRemap([S],a);flowCfg().ents=DESTDB.ents;flowCfg().dv=1;flowCfg().axis='dest';flowCfg().fys=[2027];flowCfg().aps=['om'];persistDest();save();'ok'`);
+    const cachedCheck=(W,where)=>{
+      chk(name,where,'cached legacy identities are distinct',W.ev('S.dest.R1.to!==S.dest.R2.to'),true);
+      chk(name,where,'the second entry keeps its own spelling',W.ev('flowEnt(S.dest.R2.to).n'),'ALPHA DEPOT');
+      const f=JSON.parse(W.ev('JSON.stringify(flowCalc())')), keys=JSON.parse(W.ev('JSON.stringify([S.dest.R1.to,S.dest.R2.to])'));
+      chk(name,where,'cached legacy R1 owns $900',f.ext.by[keys[0]].v,900);
+      chk(name,where,'cached legacy R2 owns $300',f.ext.by[keys[1]].v,300);
+      chk(name,where,'cached legacy total is $1200',f.tot,1200);
+      chk(name,where,'the preserved matching names are disclosed',/matching names were kept separate/.test(W.ev('flowEntEditor()')),true);
+    };
+    cachedCheck(C,'cached legacy');cachedCheck(boot({html:C.ev('buildSavedHtml()')}),'cached legacy saved/reopened');
+    // Ordinary unambiguous legacy merge is still by name, and every actual remap is listed.
+    const L=make();L.ev(`DESTDB.ents=[{k:'U40-A',n:'Alpha Depot',kind:'other',t:'OLD'}];var q=[{k:'x1',n:'ALPHA  DEPOT',kind:'other',t:'NEW'}];var a=destFold(q,'ff',false,{x1:1});var b=destFold(q,'ff',false,{x1:1});globalThis.__u40maps=JSON.stringify([a,b]);'ok'`);
+    chk(name,'legacy control','an unambiguous name still maps consistently',L.ev('__u40maps'),'[{"x1":"U40-A"},{"x1":"U40-A"}]');
+    chk(name,'legacy control','only one destination remains',L.ev('DESTDB.ents.length'),1);
+    chk(name,'legacy control','terms from both entries are retained',L.ev('DESTDB.ents[0].t'),'OLD, NEW');
+    chk(name,'legacy merge notice','the actual merge names both keys and both names',/x1.*U40-A/.test(L.ev('flowEntEditor()')),true);
+  } catch(e) { failures.push({scenario:name,where:'harness',what:'the block threw: '+String(e?.message||e),got:'threw',want:'ran'}); }
+  bootRelease(__bm, keepBoards());
+  await settleBoards();
+})();
+// ==== end v2.00 (U40): destination identities survive matching names ====
+
 await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
   const __bm = bootMark();
   const src = _selfRead(_selfPath(import.meta.url), 'utf8');
```

```diff
diff --git a/tools/export-audit/mutate.mjs b/tools/export-audit/mutate.mjs
--- a/tools/export-audit/mutate.mjs
+++ b/tools/export-audit/mutate.mjs
@@ -4285,6 +4285,17 @@
   { id: "v200-u14-notice-plural-it", area: "flowHtml", what: "the panel's notice says \"keeps it\" however many saved years the board cannot answer for: FY24 and FY26 \"stay in the saved selection\", and switching a year \"keeps it\"",
     find: "switching a year on or off keeps '+(F.unavail.length===1?'it':'them')+'.</div>'",
     repl: "switching a year on or off keeps it.</div>'" },
+  // v2.00 (U40): typed uniqueness, distinct incoming keys, and every name-based merge disclosed.
+  { id: "v200-u40-typed-duplicate-open", area: "flowSetEnt", what: "a typed matching destination name is stored instead of refused", find: "if(field==='n' && destNamed(v) && L.some(function(x){ return x!==e && destName(x.n)===destName(v); }))", repl: "if(false)" },
+  { id: "v200-u40-incoming-duplicate-merged", area: "destFold", what: "two matching names beside distinct incoming keys are merged into a local destination", find: "list.some(function(x){ return x && x.k!==e.k && destNamed(x.n) && destName(x.n)===destName(e.n); })", repl: "false" },
+  { id: "v200-u40-ambiguous-local-first", area: "destFold", what: "the first of several matching local names is silently selected", find: "DESTDB.ents.filter(function(x){ return destName(x.n)===destName(e.n); }).length>1", repl: "false" },
+  { id: "v200-u40-same-list-key-consumed", area: "destFold", what: "an incoming name consumes a different key from its same list", find: "(v186 && list.some(function(x){ return x && x.k===hit.k && x.k!==e.k; }))", repl: "false" },
+  { id: "v200-u40-preserved-duplicates-unsaid", area: "destNotice", what: "preserved duplicate names are not disclosed", find: "let h=D.length? '⚠ <b>Destinations with matching names were kept separate.</b> '", repl: "let h=false? '⚠ <b>Destinations with matching names were kept separate.</b> '" },
+  { id: "v200-u40-name-merge-unsaid", area: "destJoin", what: "a name-based key remap is not recorded for disclosure", find: "if(hit.k!==String(e.k) && !_destMerges.some(function(m){ return m.k===String(e.k) && m.to===hit.k && m.from===from; }))", repl: "if(false)" },
+  { id: "v200-u40-editor-notice-gone", area: "flowEntEditor", what: "the destination editor omits the duplicate and merge notice", find: "+(destNotice()? '<div style=\"font-size:9.5px;color:var(--amber);margin-top:6px\">'+destNotice()+'</div>' : '')", repl: "+''" },
+  { id: "v200-u40-opening-notice-gone", area: "opening", what: "an opening does not disclose destinations kept separate", find: "if(destNotice()){\n  const de=document.getElementById('shareStat');", repl: "if(false){\n  const de=document.getElementById('shareStat');" },
+  { id: "v200-u40-cached-map-collapse", area: "destFold", what: "an old cached map sends two source destination identities to one key", find: "if(hit && Object.prototype.hasOwnProperty.call(claimed, hit.k) && claimed[hit.k]!==String(e.k)){ hit=null; first=true; }", repl: "if(false){ hit=null; first=true; }" },
+  { id: "v200-u40-refusal-field-unmarked", area: "flowSetEnt", what: "the refused typed name is shown without its invalid marker and stored-name explanation", find: "codeRefusedIn(el, 'Destination name not changed',", repl: "codeRefusedIn(null, 'Destination name not changed'," },
   // v2.00 (R3, Brad 11 Oct): a save that lands under a locked view says it saved the working plan.
   { id: "v200-r3-landed-view-unsaid", area: "_driveStorePushRun", what: "a folder save that lands while a locked view is on screen says “🔒 Not kept — PB27 is a locked view. ✅ Saved …” again, naming no plan (or, quiet, leaves persist's refusal on screen)",
     find: "  if(CYCVIEW){ _cycRefusedAt=0; setStat('✅ <b>Saved the working plan</b> of '+esc(APPN_LBL[ap]||ap)+' FY'+(fy%100)+' to the shared folder — '\n    +Math.round(body.length/1024)+' KB, built before '+blLbl(CYCVIEW)+' was put on screen. '+blLbl(CYCVIEW)+' is a locked view: nothing in it '\n    +'is saved. Everyone sees the working plan on their next refresh.'+penNote+lateNote); render(); return true; }\n",
```

