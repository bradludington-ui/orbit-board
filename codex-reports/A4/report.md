BATCH A4  |  base 7ee498a46507972f803cd48ce9f27d5d668acb63  |  started 2026-10-13T12:16:43.837304-04:00 / finished 2026-10-13T12:51:07.506892-04:00 ET
FINDINGS:

U41 reproduced on the base with a real synthetic saved-file payload carrying `S.si={R1:'at',R2:'EN'}`. Opening discarded `R1:'at'`, gave the ordinary opening message, and saving/reopening retained only `R2:'EN'`. The expected stored map is the literal original map. The independent proposal test also makes R1 otherwise derive LA; the base then silently files its $900 Navy / $200 USMC CV under LA. The fix keeps raw `at`, explicitly lists it and counts those dollars under no recognized SI code, without guessing LA or uppercasing to AT.

The final literal fixture has Navy $1,500 = 900 + 300 + 50 + 60 + 70 + 80 + 40, USMC CV $390 = 200 + 100 + 90, STOVL $0, total $1,890. In actual emitted/read XLSX, USMC CV EN is $100 and no-code $290; Navy LA $50, EN $340, OT $60, FL $70, AT $80, no-code $900. The screen's no-code share is 63.0% = 1,190 / 1,890; the valid EN/OT/FL/AT shares are 23.3% / 3.2% / 3.7% / 4.2%. All expectations are written literals; no ORBIT helper computes them. The same checks run after saving and reopening. Raw `LA `, `la`, `ZZ` and `__proto__` are also retained and listed without normalization. Empty and all five valid codes plus an ordinary derived EN control retain their previous meaning.

U42 reproduced from actual XLSX bytes: a destination `D` repeated 27 times followed by 😀 and `tail` produces a sheet name with U+FFFD on the base; `'Quoted depot'` keeps forbidden apostrophes. The final tests additionally exercise a collision whose 26-unit repeat cut bisects 😀, and an apostrophe exposed by the first 28-unit cut. Expected names are literal `DDDDDDDDDDDDDDDDDDDDDDDDDDD`, `Quoted depot`, `EEEEEEEEEEEEEEEEEEEEEEEEE😀A`, `EEEEEEEEEEEEEEEEEEEEEEEEE 2` and `FFFFFFFFFFFFFFFFFFFFFFFFFFF`. Interior `O'Brien` remains unchanged. Actual workbook XML parses, names remain unique, and the $900 USAF + $200 ANG = $1,100 destination detail and grand total agree before and after reopening; the original full destination names remain uncut in saved data.

Input receipt: handoff branch pinned at `bbe728556dc394c50d84ad9a09facc5fa163e42b`; probes/rows were inspected from its regtext inputs. Base board blob is `fce8a391bd8a248d5185e199d22190c1687eaea0`. Proposed empty-template board blob is `5053534a287c100341af8e4fd2a5752ba04def0f`.

The independent review found a completeness defect in the first proposal: an unsupported SI on a non-Navy O&M requirement had no correction field. That is corrected in this final diff by a narrow stored-unsupported-code eligibility branch and a selected raw option. New tests use actual DOM change events to clear or select AT on USAF $900 / ANG $200, reopen the saved result, verify no unrelated blank requirement gains an SI editor, retain money/office ownership, and retain the existing locked-cycle refusal for a known EN code.

PROPOSAL:

- U41 board: retain unsupported raw SI values on opening; list them under dedicated Needs attention/Pre-flight repair items; use no recognized code while held raw, with explicit wording, rather than silently deriving a different classification.
- U42 board: retain existing UTF-16 bounds while dropping a trailing high surrogate exposed by either cut; remove edge apostrophes before and after cuts, including repeat names; preserve interior apostrophes and all source names.
- Suite: add two existing-style asynchronous audit-recon blocks before its scenario guard, including actual non-Navy correction controls; all original suite bytes remain exactly present, with no existing check or expectation changed.
- Catalog TEXT: add six focused mutations before the prescribed R3 marker; do not execute/import the catalog.

```diff
--- a/prioritization-board-grid.html
+++ b/prioritization-board-grid.html
@@ -2846,7 +2846,7 @@
 function attLists(T){
   T=T||tiers();
   const MR=masterRanks();
-  const out={imp:[], ccar:[], oblig:[], awshort:[], awfix:[], neg:[], buy:[], code:[]};
+  const out={imp:[], ccar:[], oblig:[], awshort:[], awfix:[], neg:[], buy:[], code:[], si:[]};
   (S.order||[]).forEach(function(id){
     const it=itemById(id); if(!it) return;
     const p=T[id]||{dT:0, mT:0, d:[], m:[]}, funded=(p.dT||0)+(p.mT||0);
@@ -2873,12 +2873,15 @@
     let r=out.code.find(function(x){ return x.id===c.id; });
     if(!r){ r={id:c.id, rank:MR[c.id], funded:0, n:[]}; out.code.push(r); }
     r.n.push(c.label); });
+  siIssues().forEach(function(c){ if(itemById(c.id)) out.si.push({id:c.id, rank:MR[c.id], funded:0, n:[c.label]}); });
   // the funded ones first -- their dollars are UNSCHEDULED in every spend plan -- then by rank
   out.awfix.sort(function(a,b){ return ((b.how==='repair')-(a.how==='repair')) || ((a.rank||9e9)-(b.rank||9e9)); });
   out.oblig.sort(function(a,b){ return ((b.funded>0.5)-(a.funded>0.5)) || ((a.rank||9e9)-(b.rank||9e9)); });
   return out;
 }
 const ATT_KIND={
+  si:{t:'SI CODES TO REPAIR', go:'Go to it',
+    why:'These SI codes arrived in a file and are kept exactly as saved. They are not one of LA, EN, OT, FL or AT. Their money is shown under no SI code, never a guessed or derived code, until corrected in the requirement’s Navy SI code field.'},
   imp:{t:'⚠ IMPACT STATEMENTS MISSING', go:'Write it',
     why:'Each is in a band that needs the consequence in the requester’s words; without it the unfunded requirement cannot be written. <b>Go to it</b> selects the requirement and opens its Impact statement.'},
   ccar:{t:'○ WITHOUT A CCaR RECORD', go:'Go to it',
@@ -2908,7 +2911,7 @@
   if(!L.length){ el.innerHTML=h+'<div style="padding:10px;color:var(--green);font-weight:700">✓ Nothing left on this list.</div>'; return; }
   const money=attOpen==='oblig'? '<th>Funded · UNSCHEDULED</th>' : (attOpen==='awshort'? '<th>Discretionary undated</th><th>Mandatory undated</th>'
     : (attOpen==='awfix'? '<th style="text-align:left">What was done, and the split used</th>'
-    : ((attOpen==='neg' || attOpen==='buy' || attOpen==='code')? '<th style="text-align:left">As saved</th>' : '<th>Funded</th>')));
+    : ((attOpen==='neg' || attOpen==='buy' || attOpen==='code' || attOpen==='si')? '<th style="text-align:left">As saved</th>' : '<th>Funded</th>')));
   h+='<table class="fctab atttab" style="width:100%"><tr><th style="text-align:left">#</th><th style="text-align:left">Requirement</th>'
     +'<th style="text-align:left">PMO</th>'+money+'<th></th></tr>';
   let t1=0, t2=0;
@@ -2916,14 +2919,14 @@
     const cells=attOpen==='awshort'? '<td>'+fM(r.ud)+'</td><td style="color:var(--purp)">'+fM(r.um)+'</td>'
       : (attOpen==='awfix'? '<td class="awfixwhat" style="text-align:left;white-space:normal"><b>'+(r.how==='repair'? 'NEEDS REPAIR' : (r.how==='split'? 'Inferred split' : 'Converted'))+'</b> \u2014 '
           +esc((Array.isArray(r.n)? r.n : []).join(' \u00b7 '))+'</td>'
-      : ((attOpen==='neg' || attOpen==='buy' || attOpen==='code')? '<td class="att'+attOpen+'" style="text-align:left;white-space:normal">'+esc(r.n.join(' \u00b7 '))+'</td>'
+      : ((attOpen==='neg' || attOpen==='buy' || attOpen==='code' || attOpen==='si')? '<td class="att'+attOpen+'" style="text-align:left;white-space:normal">'+esc(r.n.join(' \u00b7 '))+'</td>'
       : '<td>'+(r.funded>0.5? fM(r.funded) : '—')+'</td>'));
     t1+=attOpen==='awshort'? r.ud : r.funded; t2+=attOpen==='awshort'? r.um : 0;
     h+='<tr><td>'+(r.rank||'—')+'</td><td class="t" style="text-align:left">'+esc(dispTitle(it))+'</td>'
       +'<td style="text-align:left">'+esc(it.grp||'')+'</td>'+cells
       +'<td><button class="qb attgo" onclick="attGo('+jsa(attOpen)+','+jsa(r.id)+')">'+K.go+'</button></td></tr>'; });
   h+='<tr class="tot"><td></td><td style="text-align:left">'+L.length+' requirement'+(L.length===1?'':'s')+'</td><td></td>'
-    +(attOpen==='awshort'? '<td>'+fM(t1)+'</td><td>'+fM(t2)+'</td>' : ((attOpen==='awfix' || attOpen==='neg' || attOpen==='buy' || attOpen==='code')? '<td></td>' : '<td>'+(t1>0.5? fM(t1) : '—')+'</td>'))+'<td></td></tr></table>';
+    +(attOpen==='awshort'? '<td>'+fM(t1)+'</td><td>'+fM(t2)+'</td>' : ((attOpen==='awfix' || attOpen==='neg' || attOpen==='buy' || attOpen==='code' || attOpen==='si')? '<td></td>' : '<td>'+(t1>0.5? fM(t1) : '—')+'</td>'))+'<td></td></tr></table>';
   el.innerHTML=h;
 }
 // GO TO IT: the list closes, the requirement is selected, and the RECORD panel is at the field to fill
@@ -2933,7 +2936,7 @@
   goRow(id);
   if(k==='imp'){ openFld(id, 'cons'); return; }
   if(k==='ccar'){ editCcar(id); return; }
-  if(k==='neg' || k==='code') return;
+  if(k==='neg' || k==='code' || k==='si') return;
   if(k==='buy'){ buysOpen=true; render(); try{ const w=document.getElementById('buysWrap'); if(w && w.scrollIntoView) w.scrollIntoView({block:'start'}); }catch(e){} return; }
   try{ const ins=document.getElementById('inspector'), blk=ins && ins.querySelector('.awdblk');
     if(blk){ if(blk.scrollIntoView) blk.scrollIntoView({block:'center'});
@@ -5782,10 +5785,8 @@
   // office would put a requirement in a list nothing reads.
   if(!S.dest||typeof S.dest!=='object'||Array.isArray(S.dest)) S.dest={};
   if(!S.si||typeof S.si!=='object'||Array.isArray(S.si)) S.si={};
-  Object.keys(S.si).forEach(function(rid){
-    const v=S.si[rid];
-    if(v!=='' && ['LA','EN','OT','FL','AT'].indexOf(v)<0) delete S.si[rid];
-  });
+  // v2.00 (U41): a file's unknown SI code is kept exactly as saved and listed for correction.
+  // Never trim, uppercase, discard it or replace it with a derived classification on opening.
   if(!S.grp||typeof S.grp!=='object'||Array.isArray(S.grp)) S.grp={};
   // BEFORE the line below, always. That line deletes any assignment naming a PMO the list does not
   // carry, so a list not yet refreshed from state discards every move to an added office.
@@ -9475,6 +9476,14 @@
 // Every stored code longer than its limit, however it arrived: [{id (a requirement, or '' for a board-level list), kind,
 // label}]. Read straight from the stored maps -- the accessors that create an empty entry on a read are not called (a prime's
 // CLINs through clinListRO).
+// v2.00 (U41): unsupported SI text stays raw; only recognized codes are used as classifications.
+function siKnown(v){ return ['', 'LA', 'EN', 'OT', 'FL', 'AT'].indexOf(v)>=0; }
+function siIssues(){
+  const out=[];
+  Object.keys(S.si||{}).forEach(function(id){ const v=S.si[id];
+    if(!siKnown(v)) out.push({id:id, label:'SI '+inShow(v)+' is not one of LA, EN, OT, FL or AT. Kept as saved; its money is shown under no SI code until corrected.'}); });
+  return out;
+}
 function codeIssues(){
   const out=[], over=function(v, kind){ const t=String(v==null? '' : v); return t.length>codeMax(kind); };
   const lab=function(kind, v, where){ const t=String(v); return codeName(kind)+(where? ' ('+where+')' : '')+' '+inShow(t)+' — '+t.length+' characters, at most '+codeMax(kind); };
@@ -11131,7 +11140,7 @@
   });
   return {m:m, unsch:unsch};
 }
-function siOf(it){ if(!it || !siApplies()) return ''; const v=(S.si||{})[it.id]; return v!==undefined? v : siDefault(it); }
+function siOf(it){ if(!it || !siApplies()) return ''; const v=(S.si||{})[it.id]; return v!==undefined? (siKnown(v)? v : '') : siDefault(it); }
 function siIsDerived(it){ return it? ((S.si||{})[it.id]===undefined) : false; }
 // siApplies() gates the BOARD (O&M only). THIS gates the REQUIREMENT, exactly as rcnEligible
 // does for the Air Force codes: measured, 73 of 155 O&M requirements hold no Navy or Marine
@@ -11142,6 +11151,8 @@
 function siEligible(it){
   if(!it || !siApplies()) return false;
   if(siOf(it)) return true;
+  // A file's unsupported code must stay correctable even without Navy/Marine money.
+  if(Object.prototype.hasOwnProperty.call(S.si||{}, it.id) && !siKnown(S.si[it.id])) return true;
   const idx=CR_SVCS.map(function(sv){ return SVC.indexOf(sv); })
                    .filter(function(i){ return i>=0; });
   return idx.some(function(i){ return (it.ask && it.ask[i]>0.005); });
@@ -13637,6 +13648,11 @@
       +'(a cut code can be another record), and the exports print them as they are, so CCaR may not match them. Correct each '
       +'where it is set.',
       ci.map(function(c){ return {id:c.id, label:c.id? pfName(c.id) : 'Board list', sub:c.label}; })); }
+
+  { const si=siIssues();
+    add('fix','si','SI codes to repair',
+      'Kept exactly as saved. Their money is shown under no SI code until a recognized code is chosen.',
+      si.map(function(c){ return {id:c.id, label:pfName(c.id), sub:c.label}; })); }
 
   // ---- WORTH KNOWING ---------------------------------------------------------
   {
@@ -16812,9 +16828,14 @@
   // a tab per category: "what is in that box" is answerable from the file, without the tool open
   const used={};
   const tabName=(nm,fallback)=>{
-    let t=String(nm||fallback).replace(/[\\\/?*\[\]:]/g,' ').slice(0,28).trim()||fallback;
+    // v2.00 (U42): keep the existing UTF-16 length bound without leaving half a character,
+    // and Excel forbids an apostrophe at either edge (including one exposed by a cut).
+    const edge=t=>t.replace(/^[\s']+|[\s']+$/g,'');
+    const cut=(t,n)=>edge(t.slice(0,n).replace(/[\uD800-\uDBFF]$/,''));
+    const clean=t=>edge(String(t).replace(/[\\\/?*\[\]:]/g,' '));
+    let t=cut(clean(nm||fallback),28)||cut(clean(fallback),28)||'Sheet';
     let i=2; const base=t;
-    while(used[t.toLowerCase()]) t=(base.slice(0,26)+' '+(i++));
+    while(used[t.toLowerCase()]){ const suffix=' '+(i++); t=cut(base,Math.min(26,31-suffix.length))+suffix; }
     used[t.toLowerCase()]=1; return t;
   };
   const sheets=[
@@ -22276,7 +22297,8 @@
             : pl(A.awfix.length,'award repaired on opening','awards repaired on opening')) : '')
         +(A.neg.length? ae('neg', '\u2796', pl(A.neg.length,'negative allocation to repair','negative allocations to repair')) : '')
         +(A.buy.length? ae('buy', '\u2708', pl(A.buy.length,'buy line to repair','buy lines to repair')) : '')
-        +(A.code.length? ae('code', '\u2702', pl(A.code.length,'requirement with a code over its limit','requirements with a code over its limit')) : '');
+        +(A.code.length? ae('code', '\u2702', pl(A.code.length,'requirement with a code over its limit','requirements with a code over its limit')) : '')
+        +(A.si.length? ae('si', '\u26a0', pl(A.si.length,'SI code to repair','SI codes to repair')) : '');
       pe.innerHTML = !SVC.length? '' :
         '<div class="pp"><div class="pplanes">'
           +'<span class="k">Discretionary</span><span class="n" data-v="'+Math.round(dBA)+'">'+fM(dBA)+' BA</span><span class="l" data-v="'+Math.round(dLeft)+'">'+fM(dLeft)+' left</span>'
@@ -23827,6 +23849,7 @@
   if(siEligible(it)) acct.push(recF('Navy SI code', siOf(it),
     recSel('setSi('+jsa(id)+',this.value)', 'Special Interest code for the 1A9A cash return',
       '<option value=""'+(siOf(it)?'':' selected')+'>— none —</option>'
+      +((S.si||{})[id]!==undefined && !siKnown(S.si[id])? '<option value="'+esc(S.si[id])+'" selected>'+esc(S.si[id])+' — unrecognized, kept as saved</option>' : '')
       +SI_CODES.map(function(c){ return '<option value="'+c[0]+'"'+(siOf(it)===c[0]?' selected':'')+'>'
         +c[0]+' — '+c[1]+(siDefault(it)===c[0]?' (derived)':'')+'</option>'; }).join(''))));
   // v1.91 (item 35): the BAE budget left Requirement edit for the RECORD panel -- one editor for the field.
```

```diff
--- a/tools/export-audit/audit-recon.mjs
+++ b/tools/export-audit/audit-recon.mjs
@@ -5124,6 +5124,163 @@
 })();
 // ==== end v2.00 (U14) ====
 
+// ==== v2.00 (U41): an unknown SI code in a file is kept, listed and never guessed ====
+await (async () => {
+  const name = 'v2.00 (U41): an unknown SI code in a file is kept, listed and never guessed';
+  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
+  const __bm = bootMark();
+  const keepBoards = () => [];
+  try {
+    const J = JSON.stringify;
+    const X = boot();
+    seed(X.ev, { services:['STOVL','USMC-C','USN'], items:[it('R1','AV',[0,200,900]),it('R2','AV',[0,100,300]),
+      it('R3','AV',[0,0,50]),it('R4','AV',[0,0,60]),it('R5','AV',[0,0,70]),it('R6','AV',[0,0,80]),
+      it('R7','AV',[0,90,0]),it('R8','PP',[0,0,40])], disc:[5000,5000,5000], mand:[0,0,0],
+      order:['R1','R2','R3','R4','R5','R6','R7','R8'] });
+    X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
+      flowCfg().rules.lm='Req R1'; S.ptype={R1:'PRIME'}; applyState(S); save(); 'ok'`);
+    // A saved file carries the raw entry. No applyState is called after putting it in the file.
+    X.ev(`S.si={R1:'at',R2:'EN',R3:'LA',R4:'OT',R5:'FL',R6:'AT',R7:''}; MS.years[MS.cur]=S; 'ok'`);
+    const html = X.ev('buildSavedHtml()');
+    const R = boot({html});
+    const Q = boot({html:R.ev('buildSavedHtml()')});
+    for (const [where,B] of [['opened',R],['saved and reopened',Q]]) {
+      chk(name,where,'unknown raw code is kept exactly, alongside all five valid codes and blank',
+        B.ev('JSON.stringify(S.si)'),J({R1:'at',R2:'EN',R3:'LA',R4:'OT',R5:'FL',R6:'AT',R7:''}));
+      chk(name,where,'CONTROL — normal LA/EN/OT/FL/AT, blank, and derived Propulsion are unchanged',
+        B.ev(`JSON.stringify(['R2','R3','R4','R5','R6','R7','R8'].map(function(id){ return siOf(itemById(id)); }))`),
+        J(['EN','LA','OT','FL','AT','','EN']));
+      chk(name,where,'unknown at is not uppercased or replaced by the otherwise-derived LA', B.ev(`siOf(itemById('R1'))`),'');
+      chk(name,where,'the exact raw code is listed with its requirement, with no invented normalization',
+        B.ev(`JSON.stringify((attLists().si||[]).map(function(r){ return [r.id,r.n[0]]; }))`),
+        J([['R1','SI “at” is not one of LA, EN, OT, FL or AT. Kept as saved; its money is shown under no SI code until corrected.']]));
+      chk(name,where,'Pre-flight lists the same raw value',
+        B.ev(`JSON.stringify(preflight().find.filter(function(f){ return f.k==='si'; }).map(function(f){ return f.rows.map(function(r){ return [r.id,r.sub]; }); }))`),
+        J([[['R1','SI “at” is not one of LA, EN, OT, FL or AT. Kept as saved; its money is shown under no SI code until corrected.']]]));
+      B.ev(`render(); attShow('si'); 'ok'`);
+      chk(name,where,'the visible correction list names at and never claims it was dropped',
+        B.ev(`document.getElementById('attBody').textContent.includes('SI “at”')`),true);
+      chk(name,where,'CONTROL — service, requirement, office and amount ownership stay exact',
+        B.ev(`JSON.stringify(['R1','R2'].map(function(id){ var p=tiers()[id]; return [id,grpOf(itemById(id)),p.d,p.m]; }))`),
+        J([['R1','AV',[0,200,900],[0,0,0]],['R2','AV',[0,100,300],[0,0,0]]]));
+      B.ev(`siShown=true; siOpen=true; siMatrix(); 'ok'`);
+      chk(name,where,'SI screen shows no-code money, never an invisible or derived unknown bucket',
+        B.ev(`JSON.stringify(Array.from(document.querySelectorAll('#siBody tr')).filter(function(r){return r.cells.length && r.cells[0].textContent.includes('no code set');}).map(function(r){return r.cells[r.cells.length-1].textContent;}))`),J(['63.0%']));
+      chk(name,where,'CONTROL — valid EN, OT, FL and AT screen shares agree with 440, 60, 70, 80 of 1,890',
+        B.ev(`JSON.stringify(Array.from(document.querySelectorAll('#siBody tr')).filter(function(r){return r.cells.length && /^(EN|OT|FL|AT) /.test(r.cells[0].textContent);}).map(function(r){return r.cells[r.cells.length-1].textContent;}))`),J(['23.3%','3.2%','3.7%','4.2%']));
+      const bk=JSON.parse(await B.w.eval(`(async function(){ var cap=null,old=window.Blob;
+        window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new old(p,o); };
+        try{ exportExcel(); }finally{ window.Blob=old; }
+        if(!cap) throw Error('no XLSX'); return JSON.stringify(await xlsxRead(cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength))); })()`));
+      const si=bk['SI Codes by Month']||[];
+      chk(name,where,'CONTROL — actual XLSX reconciles 1,500 Navy + 390 Marines = 1,890 dollars',
+        J(si.filter(r=>['USN TOTAL','USMC CV TOTAL','ALL SERVICES — TOTAL BY MONTH'].includes(String(r[0]||''))).map(r=>[r[0],r[14]])),
+        J([['USMC CV TOTAL',390],['USN TOTAL',1500],['ALL SERVICES — TOTAL BY MONTH',1890]]));
+      chk(name,where,'all valid SI codes including LA keep only their assigned literal dollars in actual XLSX',
+        J(si.filter(r=>/^(LA|EN|OT|FL|AT)  /.test(String(r[0]||''))).map(r=>[r[0],r[14]])),
+        J([['EN  Engine',100],['LA  Airframe',50],['EN  Engine',340],['OT  Other Government Costs',60],['FL  Fuel',70],['AT  Audit',80]]));
+      chk(name,where,'unrecognized code money is in no-code, not the derived LA bucket, on actual XLSX',
+        J(si.filter(r=>String(r[0]||'')==='— no SI code set —').map(r=>r[14])),J([290,900]));
+    }
+    // A non-Navy requirement still needs a real correction route for a code retained from a file.
+    const N=boot();
+    seed(N.ev,{services:['USAF','ANG','AFRC'],items:[it('R1','AV',[900,200,0]),it('R2','AV',[300,0,0])],
+      disc:[5000,5000,5000],mand:[0,0,0],order:['R1','R2']});
+    N.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
+      applyState(S); S.si={R1:'at'}; MS.years[MS.cur]=S; 'ok'`);
+    const nh=N.ev('buildSavedHtml()'), NC=boot({html:nh}), NR=boot({html:nh});
+    const selectSi=B=>B.w.document.querySelector('#recBody select[onchange^="setSi("]');
+    for(const B of [NC,NR]){
+      B.ev(`goRow('R1');toggleRec('R1');render();'ok'`);
+      chk(name,'non-Navy','raw file SI stays correctable despite no Navy/Marine ask',Boolean(selectSi(B)),true);
+      chk(name,'non-Navy','the real field presents the retained unsupported raw code',selectSi(B)?selectSi(B).value:'NO FIELD','at');
+      chk(name,'non-Navy','CONTROL — an unrelated blank non-Navy requirement gains no SI editor',
+        B.ev(`siEligible(itemById('R2'))`),false);
+    }
+    const cs=selectSi(NC); if(cs){cs.value='';cs.dispatchEvent(new NC.w.Event('change',{bubbles:true}));}
+    const clear=boot({html:NC.ev('buildSavedHtml()')});
+    chk(name,'non-Navy clearing','the real clear action was reachable, and its cleared SI remains clear after reopen',
+      J([!!cs,JSON.parse(clear.ev(`JSON.stringify([Object.prototype.hasOwnProperty.call(S.si,'R1'),(attLists().si||[]).length])`))]),J([true,[false,0]]));
+    const rs=selectSi(NR);if(rs){rs.value='AT';rs.dispatchEvent(new NR.w.Event('change',{bubbles:true}));}
+    const repair=boot({html:NR.ev('buildSavedHtml()')});
+    chk(name,'non-Navy repair','a person can select AT, which saves and reopens exactly, clearing the notice',
+      repair.ev(`JSON.stringify([S.si.R1,(attLists().si||[]).length])`),J(['AT',0]));
+    for(const B of [clear,repair]) chk(name,'non-Navy changes','CONTROL — correction changes no Air Force service dollars or office ownership',
+      B.ev(`JSON.stringify((function(){var p=tiers().R1;return [grpOf(itemById('R1')),p.d,p.m];})())`),J(['AV',[900,200,0],[0,0,0]]));
+    // The existing locked-cycle refusal restores the pristine state; this proposal adds no save path.
+    NR.ev(`S.si={R1:'EN'};MS.years[MS.cur]=S;CYCDB.cycles['PB|2027']={ts:1700000000000,locked:true,base:MS.base,
+      years:JSON.parse(JSON.stringify(MS.years))};cycView('PB|2027');goRow('R1');recOpen='R1';render();'ok'`);
+    const locked=selectSi(NR);if(locked){locked.value='AT';locked.dispatchEvent(new NR.w.Event('change',{bubbles:true}));}
+    NR.ev(`setSi('R1','AT');'ok'`);
+    chk(name,'locked control','CONTROL — a correction in a locked cycle is refused and its known SI stays pristine',
+      NR.ev(`JSON.stringify([S.si.R1,/not kept/i.test(document.getElementById('shareStat').textContent)])`),J(['EN',true]));
+    // These are distinct raw file values: do not trim, change case, or reinterpret them as object keys.
+    for (const raw of ['LA ','la','ZZ','__proto__']) {
+      X.ev(`S.si.R1=${J(raw)}; MS.years[MS.cur]=S; 'ok'`);
+      const V=boot({html:X.ev('buildSavedHtml()')});
+      chk(name,'raw '+J(raw),'raw file code stays byte-for-byte',V.ev('JSON.stringify(S.si.R1)'),J(raw));
+      chk(name,'raw '+J(raw),'raw unsupported code has its own repair item',(JSON.parse(V.ev('JSON.stringify(attLists().si||[])')).filter(r=>r.id==='R1')).length,1);
+    }
+  } catch(e) { failures.push({scenario:name,where:'harness',what:'the block threw: '+String(e&&e.message||e),got:'threw',want:'ran'}); }
+  bootRelease(__bm, keepBoards());
+  await settleBoards();
+})();
+// ==== end v2.00 (U41) ====
+
+// ==== v2.00 (U42): funds-flow tab names keep whole characters and safe apostrophe edges ====
+await (async () => {
+  const name = 'v2.00 (U42): funds-flow tab names keep whole characters and safe apostrophe edges';
+  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
+  const __bm = bootMark();
+  const keepBoards = () => [];
+  try {
+    const J=JSON.stringify, X=boot();
+    seed(X.ev,{services:['USAF','ANG','AFRC'],items:[it('R1','AV',[900,200,0])],disc:[5000,5000,5000],mand:[0,0,0],order:['R1']});
+    const names=['DDDDDDDDDDDDDDDDDDDDDDDDDDD😀tail',"'Quoted depot'",'EEEEEEEEEEEEEEEEEEEEEEEEE😀A-one',
+      'EEEEEEEEEEEEEEEEEEEEEEEEE😀A-two',"FFFFFFFFFFFFFFFFFFFFFFFFFFF'tail","O'Brien",'Plain depot'];
+    X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
+      applyState(S); save(); ${J(names)}.forEach(function(n){ flowAddEnt(); flowSetEnt(flowEnts().length-1,'n',n); });
+      S.dest={R1:{to:flowEnts()[flowEnts().length-1].k,end:''}}; flowSetAxis('dest'); 'ok'`);
+    const html=X.ev('buildSavedHtml()');
+    for(const [where,B] of [['working',X],['saved and reopened',boot({html})]]){
+      const got=JSON.parse(await B.w.eval(`(async function(){var cap=null,old=window.Blob;
+        window.Blob=function(p,o){if(p&&p[0]&&p[0].byteLength)cap=p[0];return new old(p,o);};
+        try{exportFlow();}finally{window.Blob=old;} if(!cap)throw Error('no XLSX');
+        var u=cap instanceof Uint8Array?cap:new Uint8Array(cap),i=0,wb='',dec=new TextDecoder();
+        while(i+30<=u.length && u[i]===80 && u[i+1]===75 && u[i+2]===3 && u[i+3]===4){
+          var dv=new DataView(u.buffer,u.byteOffset+i),sz=dv.getUint32(18,true),nl=dv.getUint16(26,true),xl=dv.getUint16(28,true);
+          var fn=dec.decode(u.subarray(i+30,i+30+nl));
+          if(fn==='xl/workbook.xml'){if(dv.getUint16(8,true)!==0)throw Error('unexpected ZIP compression');wb=dec.decode(u.subarray(i+30+nl+xl,i+30+nl+xl+sz));}
+          i+=30+nl+xl+sz;
+        } if(!wb)throw Error('missing workbook.xml');
+        var doc=new DOMParser().parseFromString(wb,'application/xml');
+        var book=await xlsxRead(cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength));
+        return JSON.stringify({names:Array.from(doc.getElementsByTagName('sheet')).map(function(x){return x.getAttribute('name');}),
+          replacement:wb.includes('\\uFFFD'),xmlErrors:doc.getElementsByTagName('parsererror').length,book:book});})()`));
+      chk(name,where,'a cut before the emoji drops its whole character, never writes U+FFFD',got.names.includes('DDDDDDDDDDDDDDDDDDDDDDDDDDD'),true);
+      chk(name,where,'no replacement character occurs in the actual workbook part',got.replacement,false);
+      chk(name,where,'leading and trailing apostrophes are removed',got.names.includes('Quoted depot'),true);
+      chk(name,where,'an apostrophe exposed at the first cut is removed',got.names.includes('FFFFFFFFFFFFFFFFFFFFFFFFFFF'),true);
+      chk(name,where,'the repeat cut also never leaves half an emoji',got.names.includes('EEEEEEEEEEEEEEEEEEEEEEEEE 2'),true);
+      chk(name,where,'CONTROL — an emoji that fits and an interior apostrophe stay exactly',
+        J(got.names.filter(n=>n==='EEEEEEEEEEEEEEEEEEEEEEEEE😀A'||n==="O'Brien")),J(['EEEEEEEEEEEEEEEEEEEEEEEEE😀A',"O'Brien"]));
+      chk(name,where,'CONTROL — names are unique, no longer than 31 UTF-16 units and XML parses',
+        got.xmlErrors===0 && new Set(got.names.map(n=>n.toLowerCase())).size===got.names.length && got.names.every(n=>n.length<=31),true);
+      const flow=got.book['Funds Flow']||[],plain=got.book['Plain depot']||[];
+      chk(name,where,'CONTROL — actual funds-flow workbook total stays 900 + 200 = 1,100',
+        J(flow.filter(r=>r[0]==='TOTAL FUNDING'&&typeof r[1]==='number').slice(-1).map(r=>r[1])),J([1100]));
+      chk(name,where,'CONTROL — destination detail still owns those literal service amounts',
+        J(plain.slice(1).filter(r=>r[0]==='Req R1').map(r=>[r[2],r[3],r[4],r[5]])),
+        J([['O&M','AV','USAF',900],['O&M','AV','ANG',200]]));
+      chk(name,where,'CONTROL — full destination names in saved data are never cut',
+        B.ev('JSON.stringify(flowEnts().slice(-7).map(function(e){return e.n;}))'),J(names));
+    }
+  }catch(e){failures.push({scenario:name,where:'harness',what:'the block threw: '+String(e&&e.message||e),got:'threw',want:'ran'});}
+  bootRelease(__bm, keepBoards());
+  await settleBoards();
+})();
+// ==== end v2.00 (U42) ====
+
 {
   const src = _selfRead(_selfPath(import.meta.url), 'utf8');
   const named = [...src.matchAll(/^  const name = '([^']+)'/gm)].map(m => m[1]);   // a scenario's own line, never this one
```

```diff
--- a/tools/export-audit/mutate.mjs
+++ b/tools/export-audit/mutate.mjs
@@ -4285,6 +4285,25 @@
   { id: "v200-u14-notice-plural-it", area: "flowHtml", what: "the panel's notice says \"keeps it\" however many saved years the board cannot answer for: FY24 and FY26 \"stay in the saved selection\", and switching a year \"keeps it\"",
     find: "switching a year on or off keeps '+(F.unavail.length===1?'it':'them')+'.</div>'",
     repl: "switching a year on or off keeps it.</div>'" },
+  // v2.00 (U41/U42, Codex proposal): preserve unsupported SI text and safe funds-flow tab names.
+  { id: "v200-u41-raw-si-lost", area: "applyState", what: "an unsupported SI code from a saved file disappears on opening",
+    find: "  // v2.00 (U41): a file's unknown SI code is kept exactly as saved and listed for correction.\n  // Never trim, uppercase, discard it or replace it with a derived classification on opening.",
+    repl: "  Object.keys(S.si).forEach(function(id){ if(!siKnown(S.si[id])) delete S.si[id]; });" },
+  { id: "v200-u41-si-unlisted", area: "siIssues", what: "a file’s unsupported SI code has no correction notice",
+    find: "    if(!siKnown(v)) out.push({id:id, label:",
+    repl: "    if(false && !siKnown(v)) out.push({id:id, label:" },
+  { id: "v200-u41-si-derived", area: "siOf", what: "an unsupported saved SI code is falsely replaced by a derived code",
+    find: "return v!==undefined? (siKnown(v)? v : '') : siDefault(it);",
+    repl: "return v!==undefined? (siKnown(v)? v : siDefault(it)) : siDefault(it);" },
+  { id: "v200-u42-tab-half", area: "exportFlow", what: "a tab-name truncation can leave half a Unicode character",
+    find: "    const cut=(t,n)=>edge(t.slice(0,n).replace(/[\\uD800-\\uDBFF]$/,''));",
+    repl: "    const cut=(t,n)=>edge(t.slice(0,n));" },
+  { id: "v200-u42-tab-apostrophe", area: "exportFlow", what: "a sheet-name edge keeps a forbidden apostrophe",
+    find: "    const edge=t=>t.replace(/^[\\s']+|[\\s']+$/g,'');",
+    repl: "    const edge=t=>t.trim();" },
+  { id: "v200-u41-si-uncorrectable", area: "siEligible", what: "an imported unsupported SI code cannot be corrected without Navy or Marine funding",
+    find: "  if(Object.prototype.hasOwnProperty.call(S.si||{}, it.id) && !siKnown(S.si[it.id])) return true;\n",
+    repl: "" },
   // v2.00 (R3, Brad 11 Oct): a save that lands under a locked view says it saved the working plan.
   { id: "v200-r3-landed-view-unsaid", area: "_driveStorePushRun", what: "a folder save that lands while a locked view is on screen says “🔒 Not kept — PB27 is a locked view. ✅ Saved …” again, naming no plan (or, quiet, leaves persist's refusal on screen)",
     find: "  if(CYCVIEW){ _cycRefusedAt=0; setStat('✅ <b>Saved the working plan</b> of '+esc(APPN_LBL[ap]||ap)+' FY'+(fy%100)+' to the shared folder — '\n    +Math.round(body.length/1024)+' KB, built before '+blLbl(CYCVIEW)+' was put on screen. '+blLbl(CYCVIEW)+' is a locked view: nothing in it '\n    +'is saved. Everyone sees the working plan on their next refresh.'+penNote+lateNote); render(); return true; }\n",
```

RUNS:

Independent scoped re-review is clean at these exact final board/suite/catalog blobs; its first no-Navy correction-path finding is closed. The reviewer independently ran the exact 63-check blocks (63/63), an actual correction DOM probe (4/4), and text-only target count (1,334 once), and inspected the final before/after full-suite and six sensitivity artifacts. Its separate commands and metadata are in `../A4-review/REVIEW.md` and `../A4-review/REVIEW.json`; these are independent reviewer executions, not additional builder runs. The unchanged U42 exporter retained its independent 12/12 adversarial check under exact source identity.

The supervised runner starts an owned process group, caps each test at 180 s (mcount 60 s), terminates only that group, and records command, exit, duration and Eastern timestamps. No timeout occurred. Node v24.19.0 / jsdom 27.0.0; the task-local native TextEncoder/TextDecoder adapter is `runtime-encoding-shim.mjs` (SHA-256 `e689710a2895d6843a66207d18ec886688b16f3c166b6ddada296e40a51c7981`). `MUT_FIRST_FAIL`, `NODE_OPTIONS` and `BOOT_PARSE` were unset. This is synthetic jsdom execution, not native-browser acceptance.

- `BOARD=/workspace/orbit-codex-batches-20261013-1205ET/base/prioritization-board-grid.html python3 /workspace/orbit-codex-batches-20261013-1205ET/runner.py --cap 180 --cwd /workspace/orbit-codex-batches-20261013-1205ET/A4 --log /workspace/orbit-codex-batches-20261013-1205ET/A4/focused-base-final-r2.log --meta /workspace/orbit-codex-batches-20261013-1205ET/A4/focused-base-final-r2.meta.json -- node --import /workspace/orbit-codex-batches-20261013-1205ET/runtime-encoding-shim.mjs /workspace/orbit-codex-batches-20261013-1205ET/A4/focused.mjs` | exit 1 | 9.852 s | 63 checks; 40/40 defect checks fail, 23/23 controls pass. 2026-10-13T12:45:13.431432-04:00 → 2026-10-13T12:45:23.283407-04:00; log `focused-base-final-r2.log`.
- `python3 /workspace/orbit-codex-batches-20261013-1205ET/runner.py --cap 180 --cwd /workspace/orbit-codex-batches-20261013-1205ET/A4 --log /workspace/orbit-codex-batches-20261013-1205ET/A4/focused-fix-final-r2.log --meta /workspace/orbit-codex-batches-20261013-1205ET/A4/focused-fix-final-r2.meta.json -- node --import /workspace/orbit-codex-batches-20261013-1205ET/runtime-encoding-shim.mjs /workspace/orbit-codex-batches-20261013-1205ET/A4/focused.mjs` | exit 0 | 5.224 s | 63/63 pass. 2026-10-13T12:44:33.724044-04:00 → 2026-10-13T12:44:38.948166-04:00; log `focused-fix-final-r2.log`.
- `BOARD=/workspace/orbit-codex-batches-20261013-1205ET/base/prioritization-board-grid.html python3 /workspace/orbit-codex-batches-20261013-1205ET/runner.py --cap 180 --cwd /workspace/orbit-codex-batches-20261013-1205ET/A4/fix --log /workspace/orbit-codex-batches-20261013-1205ET/A4/full-recon-base-r2.log --meta /workspace/orbit-codex-batches-20261013-1205ET/A4/full-recon-base-r2.meta.json -- node --import /workspace/orbit-codex-batches-20261013-1205ET/runtime-encoding-shim.mjs tools/export-audit/audit-recon.mjs` | exit 1 | 137.113 s | 40 failures, all and only the proposed defect checks; every old scenario passes. 2026-10-13T12:45:29.823317-04:00 → 2026-10-13T12:47:46.935923-04:00; log `full-recon-base-r2.log`.
- `python3 /workspace/orbit-codex-batches-20261013-1205ET/runner.py --cap 180 --cwd /workspace/orbit-codex-batches-20261013-1205ET/A4/fix --log /workspace/orbit-codex-batches-20261013-1205ET/A4/full-recon-fix-r2.log --meta /workspace/orbit-codex-batches-20261013-1205ET/A4/full-recon-fix-r2.meta.json -- node --import /workspace/orbit-codex-batches-20261013-1205ET/runtime-encoding-shim.mjs tools/export-audit/audit-recon.mjs` | exit 0 | 139.148 s | ALL CHECKS PASSED; unchanged original checks plus the 63 new checks. 2026-10-13T12:45:21.543899-04:00 → 2026-10-13T12:47:40.692135-04:00; log `full-recon-fix-r2.log`.
- `BOARD=/workspace/orbit-codex-batches-20261013-1205ET/A4/mutants/v200-u41-raw-si-lost.html python3 /workspace/orbit-codex-batches-20261013-1205ET/runner.py --cap 180 --cwd /workspace/orbit-codex-batches-20261013-1205ET/A4 --log /workspace/orbit-codex-batches-20261013-1205ET/A4/v200-u41-raw-si-lost.log --meta /workspace/orbit-codex-batches-20261013-1205ET/A4/v200-u41-raw-si-lost.meta.json -- node --import /workspace/orbit-codex-batches-20261013-1205ET/runtime-encoding-shim.mjs /workspace/orbit-codex-batches-20261013-1205ET/A4/focused.mjs` | exit 1 | 21.343 s | 30 protection failures in the appropriate block; 63 checks executed; no crash or never-ran. 2026-10-13T12:45:50.394827-04:00 → 2026-10-13T12:46:11.737406-04:00; log `v200-u41-raw-si-lost.log`.
- `BOARD=/workspace/orbit-codex-batches-20261013-1205ET/A4/mutants/v200-u41-si-unlisted.html python3 /workspace/orbit-codex-batches-20261013-1205ET/runner.py --cap 180 --cwd /workspace/orbit-codex-batches-20261013-1205ET/A4 --log /workspace/orbit-codex-batches-20261013-1205ET/A4/v200-u41-si-unlisted.log --meta /workspace/orbit-codex-batches-20261013-1205ET/A4/v200-u41-si-unlisted.meta.json -- node --import /workspace/orbit-codex-batches-20261013-1205ET/runtime-encoding-shim.mjs /workspace/orbit-codex-batches-20261013-1205ET/A4/focused.mjs` | exit 1 | 24.179 s | 10 protection failures in the appropriate block; 63 checks executed; no crash or never-ran. 2026-10-13T12:46:12.216538-04:00 → 2026-10-13T12:46:36.395809-04:00; log `v200-u41-si-unlisted.log`.
- `BOARD=/workspace/orbit-codex-batches-20261013-1205ET/A4/mutants/v200-u41-si-derived.html python3 /workspace/orbit-codex-batches-20261013-1205ET/runner.py --cap 180 --cwd /workspace/orbit-codex-batches-20261013-1205ET/A4 --log /workspace/orbit-codex-batches-20261013-1205ET/A4/v200-u41-si-derived.log --meta /workspace/orbit-codex-batches-20261013-1205ET/A4/v200-u41-si-derived.meta.json -- node --import /workspace/orbit-codex-batches-20261013-1205ET/runtime-encoding-shim.mjs /workspace/orbit-codex-batches-20261013-1205ET/A4/focused.mjs` | exit 1 | 18.76 s | 8 protection failures in the appropriate block; 63 checks executed; no crash or never-ran. 2026-10-13T12:46:37.026361-04:00 → 2026-10-13T12:46:55.786287-04:00; log `v200-u41-si-derived.log`.
- `BOARD=/workspace/orbit-codex-batches-20261013-1205ET/A4/mutants/v200-u42-tab-half.html python3 /workspace/orbit-codex-batches-20261013-1205ET/runner.py --cap 180 --cwd /workspace/orbit-codex-batches-20261013-1205ET/A4 --log /workspace/orbit-codex-batches-20261013-1205ET/A4/v200-u42-tab-half.log --meta /workspace/orbit-codex-batches-20261013-1205ET/A4/v200-u42-tab-half.meta.json -- node --import /workspace/orbit-codex-batches-20261013-1205ET/runtime-encoding-shim.mjs /workspace/orbit-codex-batches-20261013-1205ET/A4/focused.mjs` | exit 1 | 14.264 s | 6 protection failures in the appropriate block; 63 checks executed; no crash or never-ran. 2026-10-13T12:46:56.225244-04:00 → 2026-10-13T12:47:10.488895-04:00; log `v200-u42-tab-half.log`.
- `BOARD=/workspace/orbit-codex-batches-20261013-1205ET/A4/mutants/v200-u42-tab-apostrophe.html python3 /workspace/orbit-codex-batches-20261013-1205ET/runner.py --cap 180 --cwd /workspace/orbit-codex-batches-20261013-1205ET/A4 --log /workspace/orbit-codex-batches-20261013-1205ET/A4/v200-u42-tab-apostrophe.log --meta /workspace/orbit-codex-batches-20261013-1205ET/A4/v200-u42-tab-apostrophe.meta.json -- node --import /workspace/orbit-codex-batches-20261013-1205ET/runtime-encoding-shim.mjs /workspace/orbit-codex-batches-20261013-1205ET/A4/focused.mjs` | exit 1 | 12.7 s | 4 protection failures in the appropriate block; 63 checks executed; no crash or never-ran. 2026-10-13T12:47:10.892262-04:00 → 2026-10-13T12:47:23.591741-04:00; log `v200-u42-tab-apostrophe.log`.
- `BOARD=/workspace/orbit-codex-batches-20261013-1205ET/A4/mutants/v200-u41-si-uncorrectable.html python3 /workspace/orbit-codex-batches-20261013-1205ET/runner.py --cap 180 --cwd /workspace/orbit-codex-batches-20261013-1205ET/A4 --log /workspace/orbit-codex-batches-20261013-1205ET/A4/v200-u41-si-uncorrectable.log --meta /workspace/orbit-codex-batches-20261013-1205ET/A4/v200-u41-si-uncorrectable.meta.json -- node --import /workspace/orbit-codex-batches-20261013-1205ET/runtime-encoding-shim.mjs /workspace/orbit-codex-batches-20261013-1205ET/A4/focused.mjs` | exit 1 | 11.938 s | 6 protection failures in the appropriate block; 63 checks executed; no crash or never-ran. 2026-10-13T12:47:23.901068-04:00 → 2026-10-13T12:47:35.839389-04:00; log `v200-u41-si-uncorrectable.log`.
- `python3 /workspace/orbit-codex-batches-20261013-1205ET/runner.py --cap 120 --cwd /workspace/orbit-codex-batches-20261013-1205ET/A4/fix --log /workspace/orbit-codex-batches-20261013-1205ET/A4/probe-vsi-base.log --meta /workspace/orbit-codex-batches-20261013-1205ET/A4/probe-vsi-base.meta.json -- node /workspace/orbit-codex-batches-20261013-1205ET/inputs/regtext/probe/verifier/vsi.mjs /workspace/orbit-codex-batches-20261013-1205ET/A4/fix /workspace/orbit-codex-batches-20261013-1205ET/base/prioritization-board-grid.html` | exit 0 | 1.883 s | reference diagnostic reproduced the reported defects; 2026-10-13T12:17:42.254958-04:00 → 2026-10-13T12:17:44.138262-04:00.
- `python3 /workspace/orbit-codex-batches-20261013-1205ET/runner.py --cap 120 --cwd /workspace/orbit-codex-batches-20261013-1205ET/A4/fix --log /workspace/orbit-codex-batches-20261013-1205ET/A4/probe-vflow-base.log --meta /workspace/orbit-codex-batches-20261013-1205ET/A4/probe-vflow-base.meta.json -- node /workspace/orbit-codex-batches-20261013-1205ET/inputs/regtext/probe/verifier/vflow.mjs /workspace/orbit-codex-batches-20261013-1205ET/A4/fix /workspace/orbit-codex-batches-20261013-1205ET/base/prioritization-board-grid.html` | exit 0 | 1.478 s | reference diagnostic reproduced the reported defects; 2026-10-13T12:17:55.834207-04:00 → 2026-10-13T12:17:57.312513-04:00.
- `python3 /workspace/orbit-codex-batches-20261013-1205ET/runner.py --cap 60 --cwd /workspace/orbit-codex-batches-20261013-1205ET/A4 --log /workspace/orbit-codex-batches-20261013-1205ET/A4/mcount-fixed-r2.log --meta /workspace/orbit-codex-batches-20261013-1205ET/A4/mcount-fixed-r2.meta.json -- python3 -I /workspace/orbit-codex-batches-20261013-1205ET/helpers/mcount.py /workspace/orbit-codex-batches-20261013-1205ET/A4/fix/tools/export-audit/mutate.mjs /workspace/orbit-codex-batches-20261013-1205ET/A4/fix/prioritization-board-grid.html` | exit 0 | 1.843 s | **1,334 entries, 1,334 exactly once, zero missing/multiple/unparsed**; includes every one of the 1,328 existing entries. Applicability is not catch evidence.
- Each disposable mutant was built from catalog TEXT by `python3 -I /workspace/orbit-codex-batches-20261013-1205ET/helpers/mkmut.py /workspace/orbit-codex-batches-20261013-1205ET/A4/fix/tools/export-audit/mutate.mjs /workspace/orbit-codex-batches-20261013-1205ET/A4/fix/prioritization-board-grid.html <id> /workspace/orbit-codex-batches-20261013-1205ET/A4/mutants/<id>.html`; each find matched exactly once. Exact decoded find/repl and applicability are in each `<id>.apply.log`. These were individual focused-block sensitivity runs, not a full catalog sweep.
- Reference probe commands and results are recorded below. These print observations rather than fail assertions; their exit 0 is not a defect-check pass. Their observed defects are independently asserted in the final 63-check block runs above.
- Raw primary log hashes, exact commands/timestamps/durations, source blob receipts and the unchanged-original-suite proof are saved in `EVIDENCE.json`, `identities.json` and `runtime.json`. All this task's recorded process groups have exited.

NOT DONE / LIMITS:

No repository branch/file was edited, committed or pushed; these are proposals in this batch's private disposable copy. No populated board file is returned: saved HTML fixtures existed only in memory. Nothing ran/imported mutate.mjs, no playwright install, no sweeps, no full gate and no later batch.

The final counted runs are separate from early draft harness errors (wrong preflight/ZIP/UI helper assumptions and initial fixture bookkeeping), and the superseded first proposal before the independent correction-reachability repair; those early logs remain labelled by filename and are not pass evidence. The original input vflow probe also contains a control-character name from U37; A4 does not repair XML control characters (A2 owns that).

No Excel/LibreOffice or native Chromium run was made. No saved-file PMO/cycle/one-appropriation import matrix, real budget/shared-folder experiment or complete audit set ran. Whole grapheme clusters (joined emoji/combining marks) are not promised: U42 prevents splitting UTF-16 surrogate pairs while preserving the old size bounds. U41 deliberately preserves unsupported raw values but does not normalize or adopt them as new SI classifications; its repair notice explicitly explains no-code accounting. A4 exercised O&M only: unsupported SI data on other appropriations is not a tested correction route and the existing board-wide SI restriction remains. New dynamic UI repair controls still require the lead's applicable UI/accessibility acceptance. Existing unrelated findings remain open.

QUESTIONS FOR BRAD: none for this assigned proposal; adoption remains with the lead's independent reviews and integration process.
