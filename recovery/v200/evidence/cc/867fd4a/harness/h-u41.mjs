// FOCUSED HARNESS: audit-recon preamble helpers, the blocks v2.00 (U41): an SI code a file carried and the guard, VERBATIM from /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/867fd4a/after/tools/export-audit/audit-recon.mjs
import { boot, seed, stopAtFirstFailure, capture } from './boot.mjs';

let failures = [];
stopAtFirstFailure(failures);   // in the mutation sweep only: see boot.mjs
// EVERY NAMED SCENARIO MUST RUN. A block appended after process.exit() never executes and reads as
// a pass -- the proposal scenario in audit-import.mjs sat there for a whole verification round and
// five mutations aimed at it survived. chk() records every scenario it hears from; at the summary,
// any `const name = '...'` in this file it never heard from is a failure, not a pass.
import { readFileSync as _selfRead } from 'node:fs';
import { fileURLToPath as _selfPath } from 'node:url';
const SEEN = new Set();
const chk = (scenario, where, what, got, want) => {
  SEEN.add(scenario);
  const ok = (typeof got === 'number' && typeof want === 'number')
    ? Math.abs(got - want) <= 0.005 : String(got) === String(want);
  if (!ok) failures.push({ scenario, where, what, got, want });
};
// Compare at CENTS. Summing floats gives 2422222.0000000005, which is the same money as 2422222
// and a different string -- the first run of this suite reported exactly that as a mismatch.
const money = n => String(Math.round(n * 100) / 100);

const it = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: 'Req ' + id,
  event: 'Ev ' + id, ccar: 'CC' + id, fy26: ask.map(() => 0), ask, alloc: null });
const num = v => { if (typeof v === 'number') return v;
  const n = parseFloat(String(v ?? '').replace(/[$,\s]/g, '')); return isFinite(n) ? n : null; };
const w6Book = (W, fn) => W.eval(`(async function(){
  var cap=null,_B=window.Blob,msg='';
  window.alert=function(m){ msg+=String(m); }; window.confirm=function(){ return true; };
  window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
  try{ ${fn}(); }catch(e){ window.Blob=_B; return JSON.stringify({__err:'threw '+String((e&&e.message)||e)}); }
  window.Blob=_B;
  if(!cap) return JSON.stringify({__err:'no file: '+msg.slice(0,80)});
  var ab=cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength);
  return JSON.stringify(await xlsxRead(ab)); })()`);
const w6Lbl = r => String((r || [])[0] ?? '').trim();
import { appendFileSync as _w5Append } from 'node:fs';
const w5Chk = (scenario, where, what, got, want) => {
  if (process.env.SUITE_CHECKS) _w5Append(process.env.SUITE_CHECKS, JSON.stringify([scenario, where, what, String(got) === String(want), String(got).slice(0, 300)]) + '\n');
  chk(scenario, where, String(what), String(got), String(want));
};
// ==== v2.00 (U41): an SI code a file carried that is not one of the five is kept, listed and never guessed ====
// applyState deleted any S.si value outside LA/EN/OT/FL/AT, so a year's file holding one opened without it and saved
// without it, with nothing said, and the requirement fell back to its derived code (siOf -> siDefault): an LM prime's
// money moved to LA in the Special Interest overview, the workbook's SI tab and the CR cash return.
// THE FILE: O&M, services STOVL / USMC-C / USN, every ask funded (pots $5,000,000 each), every award in November.
//   R1 AV, an LM prime (derived LA), si 'at'   [0, 200,000, 900,000]     R2 AV si 'EN' [0, 100,000, 300,000]
//   R3 AV si 'LA' [0, 0, 50,000]   R4 'OT' [0, 0, 60,000]   R5 'FL' [0, 0, 70,000]   R6 'AT' [0, 0, 80,000]
//   R7 AV si '' (none, by hand) [0, 90,000, 0]   R8 PP, no si (derived EN) [0, 0, 40,000]   R9 AV si 'ZZ' [0, 0, 20,000]
//   USMC CV 200 + 100 + 90 = 390 thousand; USN 900 + 300 + 50 + 60 + 70 + 80 + 40 + 20 = 1,520 thousand; 1,910 in all.
// KEPT: both codes stay exactly as saved, opened and after a save and reopen; neither is the derived code.
// COUNTED: R1's and R9's money is under no recognized code, never LA: USMC CV 200 + 90 (R7) = 290, USN 900 + 20 = 920,
//   1,210 = 63.4% of 1,910; LA is R3's 50 alone (2.6%); EN 100 + 340 = 440 (23.0%), OT 60 (3.1%), FL 70 (3.7%), AT 80 (4.2%).
//   Of the 1,210, 1,120 is R1's and R9's and 90 is R7's, and the overview says so. The workbook's row and the overview's
//   row say "no recognized" code. The CR cash return prints both SI cells blank and says 1 with no SI code and 2 with a
//   code that is not one of the five.
// SAID AND CHOSEN AGAIN: Needs attention (its entry on the strip, its list) and Pre-flight name both, as saved; Go to it
//   opens the RECORD panel at the Navy SI code, which shows "at" selected; a bulk write counts it as an answer it would
//   overwrite (blank 1, same 1, differ 7 for AT on all nine). Choosing AT for R1 and none for R9 in the field: saved and
//   reopened, the list is empty, R1's money is under AT (USN 80 + 900 = 980, USMC CV 200), the rows say "no SI code set"
//   again, and the journal holds R1's change from "at" to AT.
// OTHER VALUES: 'LA ', 'la', '__proto__', 7, {"x":1} and null are each kept as saved and listed, none read as a code, and the
//   CR cash return counts all six apart: "6 with an SI code from a file that is not one of ..." -- no "no SI code", no "too".
// FULL FUND: SI codes are an O&M classification -- the value is kept, nothing lists it.
// A USAF/ANG/AFRC requirement holding such a code (no Navy or Marine money) still has the field, and choosing AT there
//   saves and reopens; an unrelated blank one gains no field.
// A LOCKED CYCLE holding R1 'at': in its view the code is kept and listed; choosing AT there is refused, the code stays,
//   and the status line says R1 keeps SI "at" (never "has no SI code"); left, the working plan still holds it.
// FAILS ON 7ee498a: the codes are gone (opened and reopened), R1 reads LA and its 1,100 thousand is under LA (1,150), no
// list, no Pre-flight row, no field value, the bulk question counts R1 as LA and R9 as blank, the journal never had "at",
// the other values are gone, Full Fund drops it, the non-Navy requirement has no field, the view drops it and its status
// line names LA. Passing there too: the controls (the five codes, blank, derived EN, ownership, the CR total, Full Fund's
// EN, the blank USAF requirement, the locked cycle's own copy).
await (async () => {
  const name = 'v2.00 (U41) — an SI code a file carried that is not one of the five is kept, listed, counted under no recognized code and chosen again in its field';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  const keepBoards = () => [];
  try {
    const J = JSON.stringify, K = 1000;
    const cell = c => (c && typeof c === 'object' && 'v' in c) ? c.v : c;
    // an export read back from its bytes, with the status line it left
    const book = async (B, fn) => JSON.parse(await B.w.eval(`(async function(){ var cap=null, _B=window.Blob;
      window.alert=function(){}; window.confirm=function(){ return true; };
      window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
      try{ ${fn}(); }catch(e){ window.Blob=_B; return JSON.stringify({err:'threw '+String((e&&e.message)||e)}); }
      window.Blob=_B; if(!cap) return JSON.stringify({err:'no file'});
      return JSON.stringify({book:await xlsxRead(cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength)),
        stat:document.getElementById('shareStat').textContent}); })()`));
    const siTab = async B => { const b = await book(B, 'exportExcel');
      return (((b.book || {})['SI Codes by Month']) || []).filter(r => r && typeof cell(r[14]) === 'number').map(r => [cell(r[0]), cell(r[14])]); };
    const field = B => B.w.document.querySelector('#recBody select[onchange^="setSi("]');
    const choose = (B, id, v) => { B.ev(`recOpen=${J(id)}; render(); 'ok'`); const f = field(B);
      if (f) { f.value = v; f.dispatchEvent(new B.w.Event('change', { bubbles: true })); } return !!f; };
    const X = boot();
    seed(X.ev, { services: ['STOVL', 'USMC-C', 'USN'], items: [
      it('R1', 'AV', [0, 200 * K, 900 * K]), it('R2', 'AV', [0, 100 * K, 300 * K]), it('R3', 'AV', [0, 0, 50 * K]),
      it('R4', 'AV', [0, 0, 60 * K]), it('R5', 'AV', [0, 0, 70 * K]), it('R6', 'AV', [0, 0, 80 * K]),
      it('R7', 'AV', [0, 90 * K, 0]), it('R8', 'PP', [0, 0, 40 * K]), it('R9', 'AV', [0, 0, 20 * K])],
      disc: [5000 * K, 5000 * K, 5000 * K], mand: [0, 0, 0], order: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9'] });
    X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      flowCfg().rules.lm='Req R1'; S.ptype={R1:'PRIME'};
      S.order.forEach(function(id){ S.awards[id]={mode:'single', d:FYMON[1][0], day:5}; });
      applyState(S); save(); 'ok'`);
    // the file carries the map as written; nothing on this board runs applyState over it before it is saved
    X.ev(`S.si={R1:'at',R2:'EN',R3:'LA',R4:'OT',R5:'FL',R6:'AT',R7:'',R9:'ZZ'}; MS.years[MS.cur]=S; 'ok'`);
    const html = X.ev('buildSavedHtml()');
    const R = boot({ html }), Q = boot({ html: R.ev('buildSavedHtml()') });
    const L1 = 'SI “at” is not one of LA, EN, OT, FL or AT', L9 = 'SI “ZZ” is not one of LA, EN, OT, FL or AT';
    for (const [where, B] of [['opened', R], ['saved and reopened', Q]]) {
      w5Chk(name, where, 'both codes are kept exactly as saved, beside the five and the blank',
        B.ev('JSON.stringify(S.si)'), J({ R1: 'at', R2: 'EN', R3: 'LA', R4: 'OT', R5: 'FL', R6: 'AT', R7: '', R9: 'ZZ' }));
      w5Chk(name, where, 'R1, whose derived code is LA, has no code: never LA, never AT',
        B.ev(`JSON.stringify([siOf(itemById('R1')), siOf(itemById('R9'))])`), J(['', '']));
      w5Chk(name, where, 'CONTROL — R2-R6 read as set, R7 none by hand, R8 its derived EN',
        B.ev(`JSON.stringify(['R2','R3','R4','R5','R6','R7','R8'].map(function(id){ return siOf(itemById(id)); }))`),
        J(['EN', 'LA', 'OT', 'FL', 'AT', '', 'EN']));
      w5Chk(name, where, 'CONTROL — R1 keeps its office and its money: AV, disc [0, 200,000, 900,000], mand 0',
        B.ev(`JSON.stringify((function(){ var p=tiers().R1; return [grpOf(itemById('R1')), p.d, p.m]; })())`), J(['AV', [0, 200 * K, 900 * K], [0, 0, 0]]));
      B.ev(`render(); 'ok'`);
      w5Chk(name, where, 'Needs attention: an entry on the strip, and a list naming each as saved',
        J([B.ev(`(function(){ var b=document.querySelector('button.e[onclick=\\'attShow("si")\\']'); return b? b.textContent : 'NO ENTRY'; })()`),
           JSON.parse(B.ev(`JSON.stringify((attLists().si||[]).map(function(r){ return [r.id, r.n]; }))`))]),
        J(['🏷 2 SI codes to repair', [['R1', [L1]], ['R9', [L9]]]]));
      w5Chk(name, where, 'Pre-flight lists both, to fix, with the same words',
        B.ev(`JSON.stringify(preflight().find.filter(function(f){ return f.k==='si'; }).map(function(f){ return [f.sev, f.t, f.rows.map(function(r){ return [r.id, r.label, r.sub]; })]; }))`),
        J([['fix', 'SI codes the board does not recognize', [['R1', 'Ev R1', L1], ['R9', 'Ev R9', L9]]]]));
      B.ev(`attShow('si'); 'ok'`);
      w5Chk(name, where, 'the list as shown: its title, and each row with its rank, office and the code as saved',
        B.ev(`JSON.stringify([document.getElementById('attTitle').textContent, Array.from(document.querySelectorAll('#attBody tr')).slice(1,3).map(function(r){ return Array.from(r.cells).slice(0,4).map(function(c){ return c.textContent; }); })])`),
        J(['🏷 SI CODES TO REPAIR', [['1', 'Ev R1', 'AV', L1], ['9', 'Ev R9', 'AV', L9]]]));
      B.ev(`attGo('si','R1'); 'ok'`);
      w5Chk(name, where, 'Go to it opens the RECORD panel at the Navy SI code, which shows "at" selected and has the keyboard',
        B.ev(`JSON.stringify([recOpen, (function(){ var s=document.querySelector('#recBody select[onchange^="setSi("]'); return s? [s.value, s.options[s.selectedIndex].text, Array.from(s.options).map(function(o){ return o.value; }), document.activeElement===s] : 'NO FIELD'; })()])`),
        J(['R1', ['at', '“at” — not one of the five, kept as saved', ['', 'at', 'LA', 'EN', 'OT', 'FL', 'AT'], true]]));
      B.ev(`recOpen=null; render(); 'ok'`);
      w5Chk(name, where, 'a bulk write of AT on all nine counts R1 and R9 as answers it would overwrite: blank 1, same 1, differ 7',
        B.ev(`(function(){ matBulkF='Navy SI code'; matBulkV='AT'; matPmo='ALL'; matMissing=''; var P=matBulkPreview(); return JSON.stringify([P.n, P.blank, P.same, P.differ]); })()`),
        J([9, 1, 1, 7]));
      B.ev(`siShown=true; siOpen=true; siMatrix(); 'ok'`);
      w5Chk(name, where, 'the Special Interest overview: LA is R3’s $50,000 alone; R1’s and R9’s money is in the no recognized code row, 63.4%',
        B.ev(`JSON.stringify(Array.from(document.querySelectorAll('#siBody tr')).slice(1).map(function(r){ return Array.from(r.cells).map(function(c){ return c.textContent; }).join(' | '); }))`),
        J(['LA Airframe | — | — | $50,000 | $50,000 | 2.6%', 'EN Engine | — | $100,000 | $340,000 | $440,000 | 23.0%',
          'OT Other Government Costs | — | — | $60,000 | $60,000 | 3.1%', 'FL Fuel | — | — | $70,000 | $70,000 | 3.7%',
          'AT Audit | — | — | $80,000 | $80,000 | 4.2%', '— no recognized code — | — | $290,000 | $920,000 | $1,210,000 | 63.4%',
          'TOTAL | $0 | $390,000 | $1,520,000 | $1,910,000 | ']));
      w5Chk(name, where, 'the overview’s note says how much of that row is under a code the board does not recognize, and how much has none',
        J(['$1,210,000 carries no recognized code: $1,120,000 of it is on 2 requirements whose SI code from a file is not one of LA, EN, OT, FL or AT (kept as saved, listed in Needs attention) and $90,000 carries no code yet — set one from a requirement’s ⋯ menu.',
           '1 of 6 coded requirements take a derived code'].map(s => B.ev(`(document.querySelector('#siBody .hint')||{}).textContent||''`).includes(s))),
        J([true, true]));
      w5Chk(name, where, 'the workbook’s SI Codes by Month tab, from its bytes: LA only $50,000 on USN, the rest of R1’s and R9’s money in the no recognized SI code rows',
        J(await siTab(B)),
        J([['STOVL TOTAL', 0], ['EN  Engine', 100 * K], ['— no recognized SI code —', 290 * K], ['USMC CV TOTAL', 390 * K],
          ['LA  Airframe', 50 * K], ['EN  Engine', 340 * K], ['OT  Other Government Costs', 60 * K], ['FL  Fuel', 70 * K], ['AT  Audit', 80 * K],
          ['— no recognized SI code —', 920 * K], ['USN TOTAL', 1520 * K], ['ALL SERVICES — TOTAL BY MONTH', 1910 * K]]));
      const cr = await book(B, 'crExport'), crRows = (((cr.book || {})['O&M,N']) || []);
      w5Chk(name, where, 'the CR cash return prints R1’s and R9’s SI code blank, never LA',
        J(crRows.filter(r => /^Ev R\d$/.test(String(cell((r || [])[0])))).map(r => [cell(r[0]), cell(r[4])])),
        J([['Ev R1', ''], ['Ev R2', 'EN'], ['Ev R3', 'LA'], ['Ev R4', 'OT'], ['Ev R5', 'FL'], ['Ev R6', 'AT'], ['Ev R7', ''], ['Ev R8', 'EN'], ['Ev R9', '']]));
      w5Chk(name, where, 'its status line counts R7 as no SI code and R1, R9 apart, as codes that are not one of the five',
        String(cr.stat || cr.err).replace(/^.*Oct–Mar\./, ''),
        ' 1 with no SI code — those cells are blank; set them from each row’s ⋯ menu. 2 with an SI code from a file that is not one of LA, EN, OT, FL or AT (kept as saved, listed in Needs attention) — their cells are blank too.');
      w5Chk(name, where, 'CONTROL — the CR cash return’s TOTAL row still adds to 1,910 ($K)',
        J(crRows.filter(r => cell((r || [])[0]) === 'TOTAL').map(r => r.slice(7).map(cell).reduce((a, v) => a + (typeof v === 'number' ? v : 0), 0))), J([1910]));
    }
    // CHOSEN AGAIN in the field: AT for R1, none for R9; saved and reopened
    const C = boot({ html });
    const picked = [choose(C, 'R1', 'AT'), choose(C, 'R9', '')];
    const C2 = boot({ html: C.ev('buildSavedHtml()') });
    w5Chk(name, 'chosen in the field, saved and reopened', 'CONTROL — R1 is AT, R9’s code is gone by choice, the list and the Pre-flight row are empty',
      J([picked, JSON.parse(C2.ev(`JSON.stringify([Object.keys(S.si).sort().map(function(k){ return [k, S.si[k]]; }), (attLists().si||[]).length, preflight().find.filter(function(f){ return f.k==='si'; }).length])`))]),
      J([[true, true], [[['R1', 'AT'], ['R2', 'EN'], ['R3', 'LA'], ['R4', 'OT'], ['R5', 'FL'], ['R6', 'AT'], ['R7', '']], 0, 0]]));
    w5Chk(name, 'chosen in the field, saved and reopened', 'the journal holds R1’s change from the code as saved, so it can be put back',
      C2.ev(`JSON.stringify((MS.jrnl||[]).filter(function(e){ return e.p && e.p[0]==='si' && e.p[1]==='R1'; }).map(function(e){ return [e.a, e.b]; }).slice(-1))`),
      J([['at', 'AT']]));
    w5Chk(name, 'chosen in the field, saved and reopened', 'CONTROL — the workbook: R1’s money under AT (USMC CV 200,000, USN 80,000 + 900,000), the rows say no SI code set again',
      J(await siTab(C2)),
      J([['STOVL TOTAL', 0], ['EN  Engine', 100 * K], ['AT  Audit', 200 * K], ['— no SI code set —', 90 * K], ['USMC CV TOTAL', 390 * K],
        ['LA  Airframe', 50 * K], ['EN  Engine', 340 * K], ['OT  Other Government Costs', 60 * K], ['FL  Fuel', 70 * K], ['AT  Audit', 980 * K],
        ['— no SI code set —', 20 * K], ['USN TOTAL', 1520 * K], ['ALL SERVICES — TOTAL BY MONTH', 1910 * K]]));
    // OTHER VALUES a file can hold, each kept and listed, none read as a code
    const V = boot();
    seed(V.ev, { services: ['USN'], items: [it('V1', 'AV', [10 * K]), it('V2', 'AV', [10 * K]), it('V3', 'AV', [10 * K]), it('V4', 'AV', [10 * K]),
      it('V5', 'AV', [10 * K]), it('V6', 'AV', [10 * K])], disc: [500 * K], mand: [0], order: ['V1', 'V2', 'V3', 'V4', 'V5', 'V6'] });
    V.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.order.forEach(function(id){ S.awards[id]={mode:'single', d:FYMON[1][0], day:5}; }); applyState(S); save();
      S.si={V1:'LA ', V2:'la', V3:'__proto__', V4:7, V5:{x:1}, V6:null}; MS.years[MS.cur]=S; 'ok'`);
    const VR = boot({ html: V.ev('buildSavedHtml()') });
    w5Chk(name, 'other values', '"LA ", "la", "__proto__", 7, {"x":1} and null are kept as saved, none read as a code, each listed',
      VR.ev(`JSON.stringify([S.si, S.order.map(function(id){ return siOf(itemById(id)); }), (attLists().si||[]).map(function(r){ return r.n[0]; })])`),
      J([{ V1: 'LA ', V2: 'la', V3: '__proto__', V4: 7, V5: { x: 1 }, V6: null }, ['', '', '', '', '', ''],
        ['SI “LA ” is not one of LA, EN, OT, FL or AT', 'SI “la” is not one of LA, EN, OT, FL or AT', 'SI “__proto__” is not one of LA, EN, OT, FL or AT',
         'SI “7” is not one of LA, EN, OT, FL or AT', 'SI “{"x":1}” is not one of LA, EN, OT, FL or AT', 'SI “null” is not one of LA, EN, OT, FL or AT']]));
    const vcr = await book(VR, 'crExport');
    w5Chk(name, 'other values', 'the CR cash return counts all six as codes that are not one of the five: blank cells, none of them "no SI code", and never "Every row carries an SI code"',
      String(vcr.stat || vcr.err).replace(/^.*Oct–Mar\./, ''),
      ' 6 with an SI code from a file that is not one of LA, EN, OT, FL or AT (kept as saved, listed in Needs attention) — their cells are blank.');
    // FULL FUND: nothing reads an SI code there; the value is kept and nothing lists it
    const F = boot({ appn: 'FULL FUND' });
    seed(F.ev, { services: ['STOVL', 'USMC-C', 'USN'], items: [it('R1', 'AV', [0, 200 * K, 900 * K]), it('R2', 'AV', [0, 100 * K, 300 * K])],
      disc: [5000 * K, 5000 * K, 5000 * K], mand: [0, 0, 0], order: ['R1', 'R2'] });
    F.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save();
      S.si={R1:'at', R2:'EN'}; MS.years[MS.cur]=S; 'ok'`);
    const FR = boot({ html: F.ev('buildSavedHtml()'), appn: 'FULL FUND' }), FQ = boot({ html: FR.ev('buildSavedHtml()'), appn: 'FULL FUND' });
    w5Chk(name, 'Full Fund', 'the code is kept, opened and after a save and reopen, and nothing lists it (SI codes are an O&M classification)',
      J([JSON.parse(FR.ev(`JSON.stringify([mySlug(), S.si, (attLists().si||[]).length, preflight().find.filter(function(f){ return f.k==='si'; }).length])`)),
         JSON.parse(FQ.ev('JSON.stringify(S.si)'))]),
      J([['ff', { R1: 'at', R2: 'EN' }, 0, 0], { R1: 'at', R2: 'EN' }]));
    // A REQUIREMENT WITH NO NAVY OR MARINE MONEY still has the field
    const N = boot();
    seed(N.ev, { services: ['USAF', 'ANG', 'AFRC'], items: [it('R1', 'AV', [900 * K, 200 * K, 0]), it('R2', 'AV', [300 * K, 0, 0])],
      disc: [5000 * K, 5000 * K, 5000 * K], mand: [0, 0, 0], order: ['R1', 'R2'] });
    N.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save();
      S.si={R1:'at'}; MS.years[MS.cur]=S; 'ok'`);
    const NR = boot({ html: N.ev('buildSavedHtml()') });
    NR.ev(`recOpen='R1'; render(); 'ok'`);
    w5Chk(name, 'no Navy or Marine money', 'R1 (USAF/ANG only) has the Navy SI code field, showing "at"; CONTROL — blank R2 gains none',
      J([field(NR) ? field(NR).value : 'NO FIELD', NR.ev(`siEligible(itemById('R2'))`)]), J(['at', false]));
    const picked2 = choose(NR, 'R1', 'AT');
    const NQ = boot({ html: NR.ev('buildSavedHtml()') });
    w5Chk(name, 'no Navy or Marine money', 'AT chosen there saves and reopens, the list is empty, and R1 keeps its office and money',
      J([picked2, JSON.parse(NQ.ev(`JSON.stringify([S.si, (attLists().si||[]).length, (function(){ var p=tiers().R1; return [grpOf(itemById('R1')), p.d, p.m]; })()])`))]),
      J([true, [{ R1: 'AT' }, 0, ['AV', [900 * K, 200 * K, 0], [0, 0, 0]]]]));
    // A LOCKED CYCLE whose plan holds R1 'at' (the cycle is in the file): put on screen, a choice is refused there
    const Lk = boot();
    seed(Lk.ev, { services: ['STOVL', 'USMC-C', 'USN'], items: [it('R1', 'AV', [0, 200 * K, 900 * K]), it('R2', 'AV', [0, 100 * K, 300 * K])],
      disc: [5000 * K, 5000 * K, 5000 * K], mand: [0, 0, 0], order: ['R1', 'R2'] });
    Lk.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      flowCfg().rules.lm='Req R1'; S.ptype={R1:'PRIME'}; applyState(S); save(); S.si={R1:'at', R2:'EN'}; MS.years[MS.cur]=S;
      blStore()['PB|2027']={ts:1700000000000, locked:true, by:'suite', base:MS.base, years:JSON.parse(JSON.stringify(MS.years))}; 'ok'`);
    const LR = boot({ html: Lk.ev('buildSavedHtml()') });
    LR.ev(`cycView('PB|2027'); 'ok'`);
    w5Chk(name, 'locked cycle view', 'the view holds R1’s code as saved, reads it as no code (never LA) and lists it',
      LR.ev(`JSON.stringify([CYCVIEW, S.si, siOf(itemById('R1')), (attLists().si||[]).map(function(r){ return r.id; })])`),
      J(['PB|2027', { R1: 'at', R2: 'EN' }, '', ['R1']]));
    const pickedL = choose(LR, 'R1', 'AT');
    w5Chk(name, 'locked cycle view', 'AT chosen there is refused: the code stays as saved, and the status line says R1 keeps it',
      J([pickedL, JSON.parse(LR.ev('JSON.stringify(S.si)')),
         LR.ev(`(document.getElementById('shareStat')||{}).textContent||''`).replace(/^🔒 Not kept — PB27 is a locked view\. /, '')]),
      J([true, { R1: 'at', R2: 'EN' }, '🏷 Ev R1 keeps SI “at” as saved, not one of LA, EN, OT, FL or AT. The CR cash export leaves the cell blank.']));
    LR.ev(`cycLeave(true); 'ok'`);
    w5Chk(name, 'locked cycle view', 'left, the working plan still holds R1’s code as saved',
      LR.ev(`JSON.stringify([CYCVIEW, S.si])`), J(['', { R1: 'at', R2: 'EN' }]));
    w5Chk(name, 'locked cycle view', 'CONTROL — the locked cycle’s own copy of the plan still holds both codes',
      LR.ev(`JSON.stringify((function(){ var c=blGet('PB|2027'); return c.years[Object.keys(c.years)[0]].si; })())`), J({ R1: 'at', R2: 'EN' }));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());
  await settleBoards();
})();
// ==== end v2.00 (U41) ====
{
  const src = _selfRead(_selfPath(import.meta.url), 'utf8');
  const named = [...src.matchAll(/^  const name = '([^']+)'/gm)].map(m => m[1]);   // a scenario's own line, never this one
  // A name built by concatenation ('convert to split — ' + label) is heard only in its finished
  // forms, so a literal that any heard scenario STARTS WITH has run. A dead block's literal has none.
  named.forEach(n => { if (![...SEEN].some(s => s === n || s.startsWith(n))) failures.push({ scenario: n, where: 'harness',
    what: 'this scenario never ran — is its block after process.exit()?', got: 'never ran', want: 'ran' }); });
}
console.log('\n' + '='.repeat(96));
if (!failures.length) { console.log('ALL CHECKS PASSED'); process.exit(0); }
const by = {};
failures.forEach(f => { const k = f.scenario + ' | ' + f.where; (by[k] ||= []).push(f); });
console.log(`${failures.length} FAILING CHECK(S)\n`);
for (const [k, fs] of Object.entries(by)) {
  console.log(`--- ${k}`);
  fs.forEach(f => console.log(`    ${f.what}\n        got ${f.got}   want ${f.want}`));
}
process.exit(1);
