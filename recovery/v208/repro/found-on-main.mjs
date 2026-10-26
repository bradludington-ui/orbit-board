// node recovery/v208/repro/found-on-main.mjs   (from the repository root; BOARD=<file> to aim it at another build)
// Seven defects found while writing the v2.08 handoff (25-26 Oct 2026): 1-4 by the item 122 audit, 5-7 by the handoff's own
// claim-by-claim check. Each is reproduced here in jsdom on main f508fdb (v2.07), and all seven are older than v2.07. This
// prints PRESENT or GONE for each and always exits 0: it is evidence, not a check. When one is fixed, its own check goes in a
// suite with a mutation, as every fix does; this file only says what was found.
import { boot, seed } from '../../../tools/export-audit/boot.mjs';
const it = (id, grp, ask) => ({ id, title: 'Req ' + id, event: 'EV-' + id, grp, ask });
const say = (k, present, what) => console.log((present ? 'PRESENT ' : 'GONE    ') + k + ' -- ' + what);
const board = sc => { const b = boot(); seed(b.ev, sc); b.ev('render(); "ok"'); return b; };
// A board whose requirements are in DATA at boot, as a real board's are (BASE_ITEMS is captured at boot and seed() runs after
// it), and a PMO copy published from it -- the audit-import pattern.
const withBase = (ev, items) => ev(`(function(){ BASE_ITEMS.length=0; ${JSON.stringify(items)}.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); return 'ok'; })()`);
const copyOf = ev => boot({ html: ev(String.raw`(function(){ const mode={sandbox:true, by:'BLL', ts:Date.now(), fy:MS.cur, ap:APPN,
  base:pmoBaseline(), pv:PMO_PV, ord:JSON.parse(JSON.stringify(S.pmoOrder||{}))}; return pmoCopyHtml(mode); })()`) });

// 1. Clearing a requirement's decision band deletes its impact statement (setBand('') also deletes S.cons[id]). A statement
//    whose saved form runs past 300 characters (JRNL_BIG; about 299 typed) is journalled as its size, so the journal cannot
//    put it back.
{
  const { ev } = board({ services: ['USAF'], items: [it('A', 'PSM', [100])], disc: [100], mand: [0], order: ['A'] });
  ev(`S.cons=S.cons||{}; S.cons.A='Depot line stops in March. '+'x'.repeat(400); S.band=S.band||{}; S.band.A='b1'; save(); "ok"`);
  ev(`setBand('A',''); "ok"`);
  say('band-clears-impact', !ev(`(S.cons||{}).A`), 'clearing the band in the RECORD panel deletes the impact statement');
}
// 2. A redraw while the Impact or Description & note pop-up is open replaces what was typed with what is stored; so does a
//    redraw of the RECORD panel's own typed figures before they are committed (the value by service, the minimum useful
//    increment). render() redraws them (fldBody, inspectorBody), and with Live view on every tick calls render() (liveStart
//    -> liveTick -> livePoll -> render(), on success and on failure): every 30 s by default, settable from 10 to 600 s. The
//    redraw is measured here; the tick is read from the code, not run against a real folder.
{
  const { ev } = board({ services: ['USAF'], items: [it('A', 'PSM', [100])], disc: [100], mand: [0], order: ['A'] });
  // v2.08: the pop-ups went with item 122; the edit box holds the same two fields (fld-* before, er* since)
  const box = ev(`typeof openFld==='function'? 'fld' : 'er'`);
  const fid = k => box === 'fld' ? 'fld-' + k : ({ cons: 'erCons', desc: 'erDesc' })[k];
  const open = k => box === 'fld' ? `openFld('A',${JSON.stringify(k === 'desc' ? 'dn' : k)})` : `openEdit('A',${JSON.stringify(k)})`;
  const close = box === 'fld' ? 'fldClose()' : 'erClose()';
  ev(`${open('cons')}; var x=document.getElementById(${JSON.stringify(fid('cons'))}); x.value='typed, not yet saved'; x.dispatchEvent(new Event('input')); render(); "ok"`);
  const a = ev(`(document.getElementById(${JSON.stringify(fid('cons'))})||{}).value`);
  ev(`${close}; ${open('desc')}; var x=document.getElementById(${JSON.stringify(fid('desc'))}); x.value='typed, not yet saved'; x.dispatchEvent(new Event('input')); render(); "ok"`);
  const b = ev(`(document.getElementById(${JSON.stringify(fid('desc'))})||{}).value`);
  say('popup-redraw-loses-typing', a !== 'typed, not yet saved' || b !== 'typed, not yet saved',
      'a render() while a written-field pop-up is open replaces the typing (impact: ' + JSON.stringify(a) + ', description: ' + JSON.stringify(b) + ')');
  ev(`${close}; setCur('A'); render(); "ok"`);
  const typed = ev(`(function(){ var a=document.querySelector('#inspector input[onchange^="setAsk("]'), m=document.querySelector('#inspector input[onchange^="setMinInc("]');
    if(!a||!m) return 'no inputs'; a.value='123456'; a.dispatchEvent(new Event('input')); m.value='777'; m.dispatchEvent(new Event('input')); render();
    a=document.querySelector('#inspector input[onchange^="setAsk("]'); m=document.querySelector('#inspector input[onchange^="setMinInc("]');
    return JSON.stringify([a&&a.value, m&&m.value]); })()`);
  say('record-redraw-loses-typing', typed !== '["123456","777"]',
      'a render() while a RECORD panel figure is typed but not committed puts back the stored one ([value, minimum increment] after: ' + typed + ')');
}
// 3. Setting a requirement's office to the office it is already in moves it to the bottom of that office's ranking, and the
//    move is not journalled (pmoOrder is in JRNL_SKIP). Classify's bulk PMO setter calls setGrp on every row, so a bulk set
//    of an office reorders every row already in it.
{
  const { ev } = board({ services: ['USAF'], items: [it('A', 'PSM', [100]), it('B', 'PSM', [100]), it('C', 'PSM', [100])], disc: [300], mand: [0], order: ['A', 'B', 'C'] });
  ev(`S.pmoOrder=S.pmoOrder||{}; S.pmoOrder.PSM=['A','B','C']; save(); setGrp('A','PSM'); "ok"`);
  const o = ev(`JSON.stringify(S.pmoOrder.PSM)`);
  say('same-office-reranks', o !== '["A","B","C"]', 'setGrp(A, its own office) leaves the PSM ranking ' + o);
}
// 4. Changing Goes to from a government activity to a prime keeps the old "Which awards to" and the MIPR type, which the
//    RECORD panel then hides. destEndOf() still answers the old second hop, and the funds flow read by final destination
//    (flowDestResolve, axis 'end') files the prime's money there.
{
  const { ev } = board({ services: ['USAF'], items: [it('A', 'PSM', [100])], disc: [100], mand: [0], order: ['A'] });
  ev(`setDest('A','to','pax'); setDest('A','end','lm'); setMipr('A','direct'); setDest('A','to','pw'); "ok"`);
  const end = ev(`destEndOf(itemById('A'))`), mipr = ev(`(S.mipr||{}).A||''`);
  say('prime-keeps-ogc-fields', end !== 'pw' || mipr !== '', 'after Goes to = Pratt & Whitney: final destination ' + JSON.stringify(end) + ', MIPR type ' + JSON.stringify(mipr));
}
// 5. In a PMO copy, renaming the plan event or the record name of a requirement the portfolio board ADDED is shown on the
//    copy and never sent. editTitle and editRecName write an added requirement's it.event / it.title, while the submittal
//    reads S.titles / S.recNames (pmoVal); and it is in the copy's baseline, so it is not a proposal either. The office is
//    told nothing. (A board-data requirement's renames are sent.)
{
  const items = [it('A', 'PSM', [100])];
  const { ev } = board({ services: ['USAF'], items, disc: [300], mand: [0], order: ['A'] });
  withBase(ev, items); ev('render(); "ok"');
  const nid = ev(`(function(){ const n=reqCreate('PSM', {title:'', event:'EV-NEW', ask:[50]}, null, {event:'EV-NEW'}); save(); render(); return n; })()`);
  const P = copyOf(ev);
  // v2.08: the renames are made in the edit box (editTitle and the record-name rename are retired; the record name is read)
  const ren = (id, t) => P.ev(`typeof editTitle==='function'
      ? (window.prompt=function(){ return ${JSON.stringify(t)}; }, editTitle(${JSON.stringify(id)}), 'ok')
      : (openEdit(${JSON.stringify(id)},'titles'), document.getElementById('erEvent').value=${JSON.stringify(t)}, erSave(), 'ok')`);
  ren(nid, 'EV-RENAMED');
  P.ev(`typeof editRecName==='function'? (window.prompt=function(){ return 'RECNAME-X'; }, editRecName(${JSON.stringify(nid)}), 'ok') : 'retired'`);
  ren('A', 'A-RENAMED');
  const shown = P.ev(`dispTitle(itemById(${JSON.stringify(nid)}))`), sent = P.ev('JSON.stringify(pmoSubmitBuild())');
  say('copy-drops-added-renames', shown === 'EV-RENAMED' && sent.indexOf('EV-RENAMED') < 0 && sent.indexOf('RECNAME-X') < 0,
      'the copy shows ' + JSON.stringify(shown) + ' for ' + nid + '; its submittal holds ' + sent);
}
// 6. In a PMO copy, the CLIN drill of a prime is open for editing (a CLIN added, its number, CCaR, WBS and RCN/EEIC) and none
//    of it is sent: no clin* container is in PMO_FIELDS, and the drill's writers carry no copy lock or notice.
{
  const items = [it('A', 'PSM', [100, 50, 0])];
  const { ev } = board({ services: ['USAF', 'ANG', 'AFRC'], items, disc: [300, 300, 300], mand: [0, 0, 0], order: ['A'] });
  withBase(ev, items); ev(`S.ptype.A='PRIME'; save(); render(); "ok"`);
  const P = copyOf(ev);
  P.ev(`window.prompt=function(){ return 'CLIN99'; }; clinAdd('A'); "ok"`);
  const k = P.ev(`(clinList('A').slice(-1)[0]||{}).key`);
  P.ev(`wbsStore('clin','A',${JSON.stringify(k)},[{w:'P1.2.3',v:[]}]); window.prompt=function(){ return 'JSF5555'; }; clinSetField('A',${JSON.stringify(k)},'ccar'); save(); "ok"`);
  const held = P.ev(`JSON.stringify((S.clinNew||{}).A||null)`), sent = P.ev('JSON.stringify(pmoSubmitBuild())');
  say('copy-drops-clin-edits', !!k && held.indexOf('JSF5555') >= 0 && sent.indexOf('JSF5555') < 0 && sent.indexOf('P1.2.3') < 0,
      'the copy holds CLIN ' + held.slice(0, 120) + '...; its submittal holds ' + sent);
}
// 7. Classify's per-service RCN/EEIC columns (↳ USAF ...) share their label with the bulk per-service BAE budget setter, so a
//    bulk set of "↳ USAF" offers budget names and writes S.budgetAsg on every row shown -- not the RCN/EEIC the column holds.
{
  const { ev } = board({ services: ['USAF', 'ANG', 'AFRC'], items: [it('A', 'AV', [100, 50, 0]), it('B', 'AV', [10, 0, 0])],
    disc: [300, 300, 300], mand: [0, 0, 0], order: ['A', 'B'] });
  const OM = ['USAF O&M - ANG CAM Discretionary AV', 'USAF O&M- CAM Discretionary AV', 'USAF O&M - CAM OBBBA Mandatory AV'];
  ev(`BUDDB={ts:1700000000009, files:[], rows:${JSON.stringify(OM)}.map(budParseName).filter(Boolean)}; _budRegCache=null; matOpen=true; rcnSvcOpen['A']=true; render(); "ok"`);
  const offered = ev(`JSON.stringify([].map.call((document.querySelectorAll('#matBody .mat-bulk select')[0]||{options:[]}).options, function(o){ return o.value; }))`);
  ev(`matSet('bulkF','\u21b3 USAF'); matSet('bulkV','USAF O&M- CAM Discretionary AV'); window.confirm=function(){ return true; }; matApplyBulk(); "ok"`);
  const bud = ev('JSON.stringify(S.budgetAsg||{})'), rcn = ev('JSON.stringify(S.rcnSvc||{})');
  say('classify-rcn-column-writes-budgets', offered.indexOf('\u21b3 USAF') >= 0 && bud.indexOf('"B"') >= 0,
      'bulk "↳ USAF" (offered beside the per-service RCN/EEIC columns) wrote budgetAsg ' + bud + ' and rcnSvc ' + rcn);
}
