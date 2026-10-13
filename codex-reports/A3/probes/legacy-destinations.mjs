import {boot,seed,bootMark,bootRelease,settleBoards} from './base/tools/export-audit/boot.mjs';
let failures=[],checks=[];const keepBoards=()=>[];const it=(id,grp,ask)=>({id,grp,team:grp,sect:'',custom:false,title:'Req '+id,event:'Ev '+id,ccar:'CC'+id,fy26:ask.map(()=>0),ask,alloc:null});
const chk=(scenario,where,what,got,want)=>{const ok=String(got)===String(want);checks.push({scenario,where,what,got,want,ok});if(!ok)failures.push({scenario,where,what,got,want});};
const MINE=['USAF','ANG','AFRC'];
const asBooted = (ev, sc) => ev(`(function(){
  BASE_ITEMS.length=0;
  ${JSON.stringify(sc.items)}.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
  return 'ok'; })()`);
const v185It = (id, grp, ask, ccar) => ({ ...it(id, grp, ask), title: 'Req ' + id, event: 'Req ' + id, ccar });
const V185 = {
  om: { services: MINE, items: [v185It('A', 'AV', [900, 200, 100], 'JSF5594'), v185It('B', 'AV', [400, 100, 50], 'JSF5594'),
        v185It('C', 'PSM', [300, 80, 40], ''), v185It('D', 'AV', [200, 50, 25], ' jsf5594 '), v185It('E', 'TSS', [150, 40, 20], 'JSF1000')],
        disc: [1200, 300, 150], mand: [300, 80, 40], order: ['A', 'B', 'C', 'D', 'E'] },
  ff: { services: MINE, items: [v185It('F', 'AV', [700, 100, 60], 'JSF7000'), v185It('G', 'TSS', [500, 90, 30], 'JSF1000'),
        v185It('H', 'CDS', [250, 60, 20], '')],
        disc: [900, 150, 60], mand: [200, 40, 20], order: ['F', 'G', 'H'] },
  sp: { services: MINE, items: [v185It('I', 'PSM', [120, 30, 10], 'JSF3300'), v185It('J', 'AV', [80, 20, 5], 'JSF5594')],
        disc: [150, 40, 10], mand: [0, 0, 0], order: ['I', 'J'] },
};

const V186DEF = JSON.parse(boot().ev('JSON.stringify(flowDefEnts())'));
const V186OM = V186DEF.map(e => e.k === 'pw' ? { ...e, n: 'Boeing', t: 'BOEING' } : e).concat([
  { k: 'x1', n: 'Raytheon', kind: 'other', t: 'RTX' }, { k: 'x2', n: '  zeta  works', kind: 'other', t: '' },
  { k: 'x3', n: 'Pratt & Whitney', kind: 'prime', t: 'PW' }, { k: 'x4', n: 'New destination', kind: 'other', t: '' }]);
const V186FF = V186DEF.map(e => e.k === 'lm' ? { ...e, n: 'Lockheed Martin Aeronautics' } : e).concat([
  { k: 'x1', n: 'RAYTHEON', kind: 'gov', t: 'RAYTHEON, RAY' }, { k: 'x2', n: 'Acme Corp', kind: 'other', t: '' },
  { k: 'x3', n: 'Zeta Works', kind: 'other', t: 'ZETA' }]);
const d = (to, end = '') => ({ to, end });
const v186Legacy = (html, appn, sc, list, d27, d28, lock, after27) => {
  const B = boot({ html, appn }); seed(B.ev, sc); asBooted(B.ev, sc);
  B.ev(`(function(){ _destReady=false; applyState(S); MS.years[MS.cur]=S;
    MS.flow={ents:${JSON.stringify(list)}}; S.dest=${JSON.stringify(d27)};
    const y2=JSON.parse(JSON.stringify(S)); y2.dest=${JSON.stringify(d28)}; MS.years[MS.cur+1]=y2;
    MS.cycle='BES|2028'; save(); ${lock ? "blCyc='PB'; blYr=MS.cur; cycLock();" : ''}
    Object.assign(S.dest, ${JSON.stringify(after27 || {})}); save(); return 'ok'; })()`);
  return B;
};
const V186RE = /(<script type="application\/json" id="pubState">)([\s\S]*?)(<\/script>)/;
const v186Pub = (html) => JSON.parse(html.match(V186RE)[2]);
// what v1.85 wrote: no board list, a list in each plan, cycles written against their plan's list
const v186AsV185 = (html) => {
  const J = v186Pub(html);
  delete J.destDb;
  Object.values(J.appns || {}).forEach(st => { if (st.flow) delete st.flow.dv; });
  Object.values((J.cycDb || {}).byAp || {}).forEach(c => { delete c.dv; delete c.ents; });
  return html.replace(V186RE, (_, a, b, c) => a + JSON.stringify(J).replace(/</g, '\\u003c') + c);
};
// every requirement's destination BY NAME, in every year the plan holds and every locked cycle
const v186Names = (ev) => JSON.parse(ev(`(function(){
  const nm=function(st){ const o={}; Object.keys((st&&st.dest)||{}).sort().forEach(function(id){ const x=st.dest[id];
    o[id]=(flowEntName(x.to)||'?'+x.to)+(x.end? ' > '+(flowEntName(x.end)||'?'+x.end) : ''); }); return o; };
  const out={};
  Object.keys(MS.years).sort().forEach(function(fy){ out['FY'+fy]=nm(+fy===+MS.cur? S : MS.years[fy]); });
  Object.keys(CYCDB.cycles||{}).sort().forEach(function(c){ Object.keys(CYCDB.cycles[c].years||{}).sort().forEach(function(fy){
    out[c+' FY'+fy]=nm(CYCDB.cycles[c].years[fy]); }); });
  return JSON.stringify(out); })()`));
const v186Ls = (ev) => JSON.parse(ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })()`));
const v186AZ = (ev) => JSON.parse(ev('JSON.stringify(flowEntsAZ().map(function(e){ return e.n; }))'));
const V186OM_WANT = {
  FY2027: { A: 'Boeing', B: 'Boeing', C: 'NAWCAD Patuxent River > Boeing', D: 'Pratt & Whitney', E: 'zeta works' },
  FY2028: { A: 'Raytheon', D: 'Lockheed Martin' },
  'PB|2027 FY2027': { A: 'Boeing', B: 'Raytheon', C: 'NAWCAD Patuxent River > Boeing', D: 'Pratt & Whitney', E: 'zeta works' },
  'PB|2027 FY2028': { A: 'Raytheon', D: 'Lockheed Martin' } };
const V186FF_WANT = { FY2027: { F: 'Raytheon', G: 'Acme Corp', H: 'zeta works' }, FY2028: { F: 'Lockheed Martin Aeronautics' } };
const V186AZ_WANT = ['Acme Corp', 'Boeing', 'Defense Logistics Agency', 'FRC East, Cherry Point', 'Lockheed Martin',
  'Lockheed Martin Aeronautics', 'NAWCAD Lakehurst', 'NAWCAD Patuxent River', 'NAWCWD China Lake', 'OC-ALC Oklahoma City',
  'Pratt & Whitney', 'Raytheon', 'zeta works'];
// the first spelling seen is the one kept: opened from Full Fund first, its spellings lead
const v186Spell = (o) => JSON.parse(JSON.stringify(o).replace(/"Raytheon"/g, '"RAYTHEON"').replace(/zeta works/g, 'Zeta Works')
  .replace(/"(Raytheon|RAYTHEON)"/g, '"RAYTHEON"'));
let V186L = null;
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.86 — the four lists become one, and no requirement moves';
  try {
  const F = v186Legacy(null, 'FULL FUND', V185.ff, V186FF, { F: d('x1'), G: d('x2'), H: d('x3') }, { F: d('lm') }, false, {});
  const O = v186Legacy(F.ev('buildSavedHtml()'), null, V185.om, V186OM,
    { A: d('pw'), B: d('x1'), C: d('pax', 'pw'), D: d('x3'), E: d('x2') }, { A: d('x1'), D: d('lm') }, true, { B: d('pw') });
  const L = v186AsV185(O.ev('buildSavedHtml()'));
  const LJ = v186Pub(L);
  chk(name, 'fixture', 'the file is what v1.85 wrote: a list in each plan and none for the board',
    [!!LJ.destDb, !!LJ.appns.om.flow.dv, !!LJ.appns.ff.flow.dv, LJ.appns.om.flow.ents.length, LJ.appns.ff.flow.ents.length, !!LJ.cycDb.byAp.om.dv].join(','),
    'false,false,false,12,11,false');
  chk(name, 'fixture', 'and O&M holds a locked cycle', Object.keys(LJ.cycDb.byAp.om.cycles).join(','), 'PB|2027');
  V186L = L;

  // (i) O&M OPENED FIRST, in a browser that has never held this board
  const A = boot({ html: L });
  chk(name, 'O&M first', 'every requirement keeps its destination, every year and the locked cycle', JSON.stringify(v186Names(A.ev)), JSON.stringify(V186OM_WANT));
  chk(name, 'O&M first', 'the list is both appropriations’ names, each once, A to Z', JSON.stringify(v186AZ(A.ev)), JSON.stringify(V186AZ_WANT));
  chk(name, 'O&M first', 'two different names are never merged (Lockheed Martin and Lockheed Martin Aeronautics)',
    A.ev(`flowEntsAZ().filter(function(e){ return /^lockheed/i.test(e.n); }).length`), 2);
  chk(name, 'O&M first', 'a name that differs only in case or spacing is merged (Raytheon, zeta works)',
    A.ev(`flowEnts().filter(function(e){ return /^(raytheon|zeta works)$/i.test(e.n); }).length`), 2);
  chk(name, 'O&M first', 'an unnamed placeholder nobody used is not carried', A.ev(`flowEnts().some(function(e){ return e.n==='New destination'; })`), false);
  chk(name, 'O&M first', 'match terms are combined', A.ev(`[destByName('Raytheon').t, destByName('zeta works').t].join(' | ')`), 'RTX, RAYTHEON, RAY | ZETA');
  chk(name, 'O&M first', 'the kind the two disagree on is named for you to settle',
    A.ev(`JSON.stringify(DESTDB.conflicts.map(function(c){ return flowEntName(c.k)+'|'+c.from+'|'+c.kind; }))`), '["Raytheon|ff|gov"]');
  chk(name, 'O&M first', 'and the panel says so', /Named with a different kind on another appropriation: Raytheon \(Full Fund had Government activity\)/.test(A.ev('flowEntEditor()')), true);
  chk(name, 'O&M first', 'the funds flow keeps the order destinations were added, not A to Z',
    A.ev(`flowEnts().map(function(e){ return e.n; }).slice(0,3).join('|')`), 'Lockheed Martin|Boeing|NAWCAD Patuxent River');

  // (ii) FULL FUND FIRST, then O&M in the same browser: here O&M's old "pw" (renamed Boeing) is not
  // the board's Pratt & Whitney, and its x3 IS -- so x3 becomes pw while pw becomes something else.
  const Fb = boot({ html: L, appn: 'FULL FUND' });
  chk(name, 'Full Fund first', 'every Full Fund requirement keeps its destination', JSON.stringify(v186Names(Fb.ev)), JSON.stringify(v186Spell(V186FF_WANT)));
  const Ob = boot({ html: L, appn: 'O&M', ls: v186Ls(Fb.ev) });
  chk(name, 'Full Fund first', 'O&M opened after it in the same browser: every requirement keeps its destination',
    JSON.stringify(v186Names(Ob.ev)), JSON.stringify(v186Spell(V186OM_WANT)));
  chk(name, 'Full Fund first', 'where an old key is another destination’s new one', Ob.ev(`S.dest.D.to+'|'+(S.dest.A.to!=='pw')`), 'pw|true');
  chk(name, 'Full Fund first', 'the same places, A to Z, in Full Fund’s spelling', JSON.stringify(v186AZ(Ob.ev)), JSON.stringify(v186Spell(V186AZ_WANT)));
  // REOPENED BEFORE ANYTHING IS SAVED: the plan is read again from its old list; the cycles, already
  // kept re-pointed, must not be moved a second time
  const Oc = boot({ html: L, appn: 'O&M', ls: v186Ls(Ob.ev) });
  chk(name, 'reopened unsaved', 'every requirement still keeps its destination, the locked cycle included',
    JSON.stringify(v186Names(Oc.ev)), JSON.stringify(v186Spell(V186OM_WANT)));
  chk(name, 'reopened unsaved', 'on the same keys', Oc.ev(`JSON.stringify([S.dest, CYCDB.cycles['PB|2027'].years[2027].dest])`),
    Ob.ev(`JSON.stringify([S.dest, CYCDB.cycles['PB|2027'].years[2027].dest])`));
  const Fc = boot({ html: L, appn: 'FULL FUND', ls: v186Ls(Oc.ev) });
  chk(name, 'reopened unsaved', 'and Full Fund, switched back to', JSON.stringify(v186Names(Fc.ev)), JSON.stringify(v186Spell(V186FF_WANT)));
  chk(name, 'reopened unsaved', 'lands on the keys O&M uses for the same places',
    Fc.ev(`S.dest.F.to+'|'+S.dest.H.to`), Oc.ev(`destByName('raytheon').k+'|'+destByName('zeta works').k`));

  // SAVED, AND REOPENED IN ANOTHER BROWSER: the file carries the list
  const L2 = A.ev('buildSavedHtml()');
  chk(name, 'saved', 'the file carries the board list', (v186Pub(L2).destDb || { ents: [] }).ents.length, 13);
  const A2 = boot({ html: L2 });
  chk(name, 'saved', 'reopened, nothing moved', JSON.stringify(v186Names(A2.ev)), JSON.stringify(V186OM_WANT));
  chk(name, 'saved', 'on the same keys, the same list', A2.ev(`JSON.stringify([MS.years, flowEnts()])`), A.ev(`JSON.stringify([MS.years, flowEnts()])`));
  const F2 = boot({ html: L2, appn: 'FULL FUND' });
  chk(name, 'saved', 'Full Fund from that file keeps its destinations', JSON.stringify(v186Names(F2.ev)), JSON.stringify(V186FF_WANT));
  chk(name, 'saved', 'on the keys O&M uses for the same places', F2.ev(`S.dest.F.to+'|'+S.dest.G.to+'|'+S.dest.H.to`),
    A.ev(`destByName('Raytheon').k+'|'+destByName('Acme Corp').k+'|'+destByName('zeta works').k`));
  chk(name, 'saved', 'and sees the same list', JSON.stringify(v186AZ(F2.ev)), JSON.stringify(V186AZ_WANT));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();
await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.86 — added once, there on every appropriation; picked A to Z; removed only when nothing points at it';
  try {
  const A = boot({ html: boot({ html: V186L }).ev('buildSavedHtml()') });
  A.ev(`window.confirm=function(){ return true }; window.alert=function(){}; flowAddEnt(); flowSetEnt(flowEnts().length-1,'n','Aardvark Depot'); 'ok'`);
  const k = A.ev(`destByName('Aardvark Depot').k`);
  chk(name, 'add', 'a new destination gets a key of its own, not the next x', /^d[0-9a-z]{8,}$/.test(k), true);
  chk(name, 'add', 'and reads first, A to Z', v186AZ(A.ev)[0], 'Aardvark Depot');
  chk(name, 'pickers', 'the Goes to bulk list reads A to Z', A.ev(`JSON.stringify(matBulk()['Goes to'].opts.map(function(o){ return o[1].replace(/ \\(gov\\)$/,''); }))`),
    JSON.stringify(['Aardvark Depot'].concat(V186AZ_WANT)));
  chk(name, 'pickers', 'the panel reads A to Z', JSON.stringify([...A.ev('flowEntEditor()').matchAll(/<input[^>]*value="([^"]*)" onchange="flowSetEnt\(\d+,&quot;n&quot;/g)].map(m => m[1].replace(/&amp;/g, '&'))),
    JSON.stringify(['Aardvark Depot'].concat(V186AZ_WANT)));
  const L3 = A.ev('buildSavedHtml()');
  const F = boot({ html: L3, appn: 'FULL FUND' });
  chk(name, 'add', 'Full Fund, opened from the saved file, has it', F.ev(`!!destByName('Aardvark Depot')`), true);
  chk(name, 'add', 'on the same key', F.ev(`destByName('Aardvark Depot').k`), k);
  F.ev(`setDest('G','to','${k}'); 'ok'`);
  chk(name, 'add', 'and a requirement there can go to it', F.ev(`flowEntName(S.dest.G.to)`), 'Aardvark Depot');

  // REMOVING. What another appropriation or a locked cycle points at stays; what nothing points at goes,
  // and a year that is not on screen is cleared too.
  const del = (ev, n) => ev(`(function(){ globalThis.__al=[]; window.alert=function(m){ globalThis.__al.push(String(m)); };
    const i=flowEnts().indexOf(destByName(${JSON.stringify(n)})); flowDelEnt(i); return JSON.stringify([!!destByName(${JSON.stringify(n)}), globalThis.__al.join(' ')]); })()`);
  const acme = JSON.parse(del(A.ev, 'Acme Corp'));
  chk(name, 'remove', 'one Full Fund uses is not removed', acme[0], true);
  chk(name, 'remove', 'and it says where', /requirements point at it on Full Fund \(1\)/.test(acme[1]), true);
  const boe = JSON.parse(del(A.ev, 'Boeing'));
  chk(name, 'remove', 'one a locked cycle names is not removed', boe[0] + '|' + /on O&M locked PB27 \(2\)\./.test(boe[1]), 'true|true');
  A.ev(`MS.years[2028].dest.A={to:'${k}', end:''}; save(); 'ok'`);
  const aa = JSON.parse(del(A.ev, 'Aardvark Depot'));
  chk(name, 'remove', 'one only this plan uses is removed', aa[0], false);
  chk(name, 'remove', 'and cleared from a year not on screen', A.ev(`JSON.stringify(MS.years[2028].dest.A||null)`), 'null');
  const ok = JSON.parse(del(A.ev, 'OC-ALC Oklahoma City'));
  chk(name, 'remove', 'one nothing uses is removed', ok[0], false);
  const L4 = A.ev('buildSavedHtml()');
  const F4 = boot({ html: L4, appn: 'FULL FUND' });
  chk(name, 'remove', 'and does not come back from Full Fund’s old list', F4.ev(`!!destByName('OC-ALC Oklahoma City')`), false);
  chk(name, 'remove', 'while Full Fund keeps every destination it uses', JSON.stringify(v186Names(F4.ev)), JSON.stringify(V186FF_WANT));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, keepBoards());   // v1.86: close this block's boards, keeping those later blocks reuse,
  await settleBoards();   // and let the loop turn: a closed board is freed only then
})();

console.log(JSON.stringify({checks:checks.length,passed:checks.filter(x=>x.ok).length,failed:failures.length,failures},null,2));process.exit(failures.length?1:0);
