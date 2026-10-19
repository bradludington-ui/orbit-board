// A FILE FROM SOMEONE ELSE IS DATA -- never code, and never a figure it should not be (v1.88).
//
// Two halves, both about the files that come into a board from outside: a PMO copy coming back, a
// consolidated file, several boards at once, a package, a submittal, a band ladder, the shared folder.
//
// 1. THE DOOR. inboundCheck() reads a whole file before any of it is used, at every way in, and refuses
//    it -- all of it, with one message saying what and where -- when it carries what no board writes: an
//    id or a name that could end a string or open markup, a figure that is not a figure or is beyond any
//    budget, a field named __proto__, text or nesting past any board's, a file past the size limit. Each
//    refusal is proved at every door the file type uses, and each must leave the board exactly as it was:
//    browser storage and the whole store, compared before and after. And the door must not refuse what
//    the board itself writes: its own saved file, a PMO copy, a submittal, a package, one appropriation
//    exported, a band ladder -- each is put through it and must pass. (The full-import tests in
//    audit-import.mjs send files written by v1.80, v1.83, v1.85 and v1.87 through the same door.)
//
// 2. THE DRAWING. A board saved before v1.88 was never checked, so the board must also draw hostile text
//    as text. The hostile fixture (hostile.mjs) is opened here in jsdom and swept screen by screen, and
//    no inline handler anywhere may carry a planted call as code. tools/hostile-render.mjs runs the same
//    sweep in Chromium, where a planted <img onerror> would also fire; this copy is the one the mutation
//    sweep can see.
import { boot, seed, BOARD, bootMark, bootRelease, settleBoards, stopAtFirstFailure } from './boot.mjs';
import { buildHostile, hostileSweep } from './hostile.mjs';
import { readFileSync } from 'node:fs';
import { readFileSync as _selfRead } from 'node:fs';
import { fileURLToPath as _selfPath } from 'node:url';
import { appendFileSync as _ckAppend } from 'node:fs';

let failures = [];
stopAtFirstFailure(failures);   // in the mutation sweep only: see boot.mjs
const SEEN = new Set();
const CHECKS = process.env.SUITE_CHECKS || '';
const chk = (scenario, where, what, got, want) => {
  SEEN.add(scenario);
  const ok = String(got) === String(want);
  if (CHECKS) _ckAppend(CHECKS, JSON.stringify([scenario, where, what, ok, String(got).slice(0, 400)]) + '\n');
  if (!ok) failures.push({ scenario, where, what, got, want });
};

const it = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: 'Requirement ' + id,
  event: 'Event ' + id, ccar: 'JSF' + id.charCodeAt(0), fy26: ask.map(() => 0), ask, alloc: null });
const SC = { services: ['USAF', 'ANG', 'AFRC'],
  items: [it('A', 'AV', [900000, 200000, 100000]), it('B', 'AV', [400000, 100000, 50000]), it('C', 'PSM', [300000, 80000, 40000])],
  disc: [1200000, 300000, 150000], mand: [300000, 80000, 40000], order: ['A', 'B', 'C'], mc: { A: true } };
const RE = /(<script type="application\/json" id="pubState">)([\s\S]*?)(<\/script>)/;
const pubOf = html => JSON.parse(html.match(RE)[2]);
const withPub = (html, J) => html.replace(RE, (_, a, b, c) => a + JSON.stringify(J).replace(/</g, '\\u003c') + c);

// A FileReader-driven importer, called the way its file input calls it: a real File, and the alerts it
// raises collected. It is done when it clears the input, as every one of them does.
const drive = (ev, fn, files) => ev(`new Promise(function(res){
  var al=[]; window.alert=function(m){ al.push(String(m)); }; window.confirm=function(){ return true; };
  var inp={files:${JSON.stringify(files)}.map(function(f){ return (f[2]!==undefined)? {name:f[0], size:f[2]} : new File([f[1]], f[0]); }), value:'x'};
  try{ ${fn}(inp); }catch(e){ al.push('THREW '+e.message); }
  (function wait(n){ if(inp.value==='' || n>400) return res(JSON.stringify(al)); setTimeout(function(){ wait(n+1); }, 5); })(0);
})`);
const everything = ev => ev(`JSON.stringify((function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); }
  return {ls:o, ms:MS, bands:(typeof BANDS_LIST==='function')? BANDS_LIST() : null}; })())`);

await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.88 — a file that could run code or change a figure is refused, whole, at every way in';
  try {
  // THE BOARD THE FILES COME INTO, and a genuine file of its own to make hostile variants from
  const G = boot(); seed(G.ev, SC);
  G.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
        applyState(S); save(); 'ok'`);
  const L = G.ev('buildSavedHtml()');
  const slug = G.ev('mySlug()');
  const J0 = pubOf(L);
  chk(name, 'fixture', 'the genuine file carries this appropriation, a plan year and its requirement list',
    !!(J0.appns && J0.appns[slug] && J0.appns[slug].years && J0.appns[slug].dataPack && J0.appns[slug].dataPack.items.length), true);
  const fy = Object.keys(J0.appns[slug].years)[0];
  const vary = f => { const J = JSON.parse(JSON.stringify(J0)); const st = J.appns[slug]; f(st, st.years[fy], J); return withPub(L, J); };
  const deep = n => { let o = { end: 1 }; for (let i = 0; i < n; i++) o = { a: o }; return o; };

  // EVERY GENUINE FILE PASSES. What the door must never refuse is everything the board itself writes.
  const genuine = { 'its own saved file': L };
  genuine['one appropriation exported'] = G.ev(`oneAppnHtml(${JSON.stringify(slug)})||''`);
  const cap = (code, type) => G.ev(`(function(){ var cap=null, _B=window.Blob;
    window.Blob=function(pt,o){ if(!cap && o && o.type===${JSON.stringify(type)}) cap=String(pt[0]); return new _B(pt,o); };
    window.confirm=function(){ return true; }; window.alert=function(){};
    try{ localStorage.setItem('prio27who','BLL'); }catch(e){}
    try{ ${code} }catch(e){} window.Blob=_B; return cap||''; })()`);
  genuine['a PMO copy'] = cap('publishPmoCopy();', 'text/html');
  genuine['a band ladder exported'] = cap('bandExport();', 'application/json');
  genuine['an appropriation package'] = cap('pkgIssue(mySlug(), true);', 'application/json');
  const PC = boot({ html: genuine['a PMO copy'] });
  genuine['a submittal from the copy'] = PC.ev(`(function(){ var cap=null, _B=window.Blob;
    try{ localStorage.setItem('prio27who','J. Smith'); localStorage.setItem('prio27pmo','AV'); }catch(e){}
    window.Blob=function(pt,o){ if(!cap && o && o.type==='application/json') cap=String(pt[0]); return new _B(pt,o); };
    window.alert=function(){}; window.confirm=function(){ return true; };
    try{ S.titles.A='Renamed by the office'; save(); pmoSubmit(); }catch(e){} window.Blob=_B; return cap||''; })()`);
  for (const [what, txt] of Object.entries(genuine)) {
    chk(name, 'genuine', `${what} was produced by the board`, txt.length > 20, true);
    chk(name, 'genuine', `${what} passes the door`, G.ev(`inboundCheck(${JSON.stringify(txt)})`) || 'passes', 'passes');
  }
  // v2.00 (item 99) reverses what v1.88 asked here. A key named for something every object inherits (toString, valueOf,
  // hasOwnProperty, isPrototypeOf ...) reads back the built-in rather than the board's entry, and no board writes one, so
  // the door now refuses the file and names the field. Each name is tried in a file of its own, so each is refused for
  // itself rather than behind another.
  for (const k of ['toString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf'])
    chk(name, 'built-in names', `a file carrying a key named ${k} is refused at the door, which names it`,
      G.ev(`inboundCheck(${JSON.stringify(vary(st => { st.zz_keys = { [k]: 1 }; }))})`),
      `it carries a field named “${k}” (at the saved state.appns.${slug}.zz_keys), which no board writes`);
  // and it refuses no more than those names: keys that only look like them are ordinary keys, and pass
  chk(name, 'genuine', 'a file carrying keys that only look like built-in names (ToString, valueOf_, hasOwnproperty, isPrototype, proto, __proto, Constructor) passes the door',
    G.ev(`inboundCheck(${JSON.stringify(vary(st => { st.zz_keys = { ToString: 1, valueOf_: 2, hasOwnproperty: 3, isPrototype: 4, proto: 5, __proto: 6, Constructor: 7 }; }))})`) || 'passes', 'passes');
  // and through the ordinary import, which now runs the door first: taken, not refused
  const B0 = boot({ html: L });
  const took = JSON.parse(await drive(B0.ev, 'importState', [['board.html', L]]));
  chk(name, 'genuine', 'the board’s own file, imported through File → Import, is not refused', took.some(a => /was not imported/.test(a)), false);

  // HOSTILE BOARD FILES: each at the full import, the ordinary import (one appropriation from a
  // consolidated file) and the several-boards import beside a genuine file.
  const BOARDS = [
    ['a requirement id that ends its quotes, in the priority order', /an id may not carry/, vary((st, y) => { y.order[0] = "A'); alert(1); ('"; })],
    ['a requirement id carrying markup, in the requirement list', /an id may not carry/, vary(st => { st.dataPack.items[0].id = 'A<img src=x onerror=alert(1)>'; })],
    ['an added requirement’s id with a double quote', /an id may not carry/, vary((st, y) => { y.custom = [Object.assign({}, st.dataPack.items[0], { id: 'N"1', custom: true })]; })],
    ['a requirement id with a quote, keying a per-requirement map', /an id may not carry/, vary((st, y) => { y.titles = { "A'><b>": 'x' }; })],
    ['a requirement value written as words', /is not a figure/, vary(st => { st.dataPack.items[0].ask[1] = 'lots'; })],
    ['a lane beyond any budget', /is not a real figure/, vary((st, y) => { y.discSvc[0] = 5e13; })],
    ['an allocation that is an object where a figure goes', /is not a figure/, vary((st, y) => { y.alloc = { A: { m: 't', v: { x: 1 } } }; })],
    ['a split figure beyond any budget', /is not a real figure/, vary((st, y) => { y.fsrc = { A: { m: 'split', dv: [1, 2e13, 3], mv: [0, 0, 0] } }; })],
    ['an infinite number', /not a real (figure|number)/, vary((st, y) => { y.discSvc[0] = 987654321987; }).replace('987654321987', '1e999')],
    ['an infinite number where no figure is expected', /the figure at .* is not a real number/, vary(st => { st.zz_n = 918273645546; }).replace('918273645546', '1e999')],
    ['a field named __proto__', /field named .__proto__./, L.replace('"appns":{', '"appns":{"__proto__":{"polluted":true},')],
    ['a field named constructor, inside a plan year', /field named .constructor./, vary((st, y) => { y.zz_marker = 1; }).replace('"zz_marker":1', '"constructor":{"prototype":{"x":1}}')],
    ['a note longer than any board writes', /characters long/, vary((st, y) => { y.notes = { A: 'x'.repeat(200001) }; })],
    ['nesting deeper than any board writes', /nested deeper/, vary(st => { st.zz_deep = deep(80); })],
    ['an office name carrying markup', /a name may not carry/, vary(st => { st.pmos = ['AV', 'PSM', 'X<b>y</b>']; })],
    ['an office reassignment to a name carrying a double quote', /a name may not carry/, vary((st, y) => { y.grp = { A: 'AV"x' }; })],
    ['a service name carrying markup', /a name may not carry/, vary(st => { st.dataPack.services[1] = 'ANG<script>'; })],
    ['a band colour that is not a colour', /is not a colour/, vary(st => { st.bands = [{ id: 'x', n: 'X', rule: 'skip', c: '#fff" onmouseover="alert(1)' }]; })],
  ];
  const before = everything(G.ev);
  for (const [what, why, txt] of BOARDS) {
    // the full import
    const full = JSON.parse(G.ev(`(function(){ var al=[]; window.alert=function(m){ al.push(String(m)); }; window.confirm=function(){ return true; };
      var r=fullImportText(${JSON.stringify(txt)}, 'hostile.html'); return JSON.stringify([r, al]); })()`));
    chk(name, what, 'the full import refuses it, saying why', full[0] === false && full[1].length === 1 && /“hostile\.html” was not imported/.test(full[1][0]) && why.test(full[1][0]), true);
    // the ordinary import
    const one = JSON.parse(await drive(G.ev, 'importState', [['hostile.html', txt]]));
    chk(name, what, 'File → Import refuses it, saying why', one.length === 1 && /was not imported/.test(one[0]) && why.test(one[0]), true);
    // several boards at once, beside a genuine one: none of them is taken
    const many = JSON.parse(await drive(G.ev, 'importBoards', [['good.html', L], ['hostile.html', txt]]));
    chk(name, what, 'several boards at once: the batch is refused, the genuine file with it', many.length === 1 && /“hostile\.html” was not imported/.test(many[0]) && /none of the 2 files/.test(many[0]), true);
    chk(name, what, 'and the board is exactly as it was', everything(G.ev) === before, true);
  }

  // HOSTILE JSON: a submittal, a package, a band ladder -- each through the door its type uses
  const SUB = extra => JSON.stringify(Object.assign({ spmtPkg: 1, dir: 'submit', ap: slug, fy: Number(fy), ts: 1, by: 'PMO', pmo: 'AV', fromTs: 1,
    svc: SC.services, items: {}, added: [] }, extra));
  const JSONS = [
    ['a submittal proposing a change to an id that ends its quotes', /an id may not carry/, 'importState', SUB({ items: { "A');alert(1);('": { titles: 'x' } } })],
    ['a submittal proposing a value written as words', /is not a figure/, 'importState', SUB({ items: { A: { asks: [1, 'lots', 3] } } })],
    ['a submittal proposing a new requirement whose id carries markup', /an id may not carry/, 'importState', SUB({ added: [{ nid: 'N<b>', grp: 'AV', title: 't', ask: [1, 1, 1] }] })],
    ['a submittal proposing a new requirement for an office named with markup', /a name may not carry/, 'importState', SUB({ added: [{ nid: 'N1', grp: 'AV<i>', title: 't', ask: [1, 1, 1] }] })],
    ['a submittal whose service list carries markup', /a name may not carry/, 'importState', SUB({ svc: ['USAF', 'ANG"', 'AFRC'] })],
    ['a package whose plan ranks an id carrying markup', /an id may not carry/, 'importState',
      JSON.stringify({ spmtPkg: 1, ap: slug, seq: 1, body: { years: { [fy]: { order: ['X<b>'], discSvc: [1, 2, 3], alloc: {} } } } })],
    ['a package whose plan holds an infinite figure', /not a real (figure|number)/, 'importState',
      JSON.stringify({ spmtPkg: 1, ap: slug, seq: 1, body: { years: { [fy]: { order: ['A'], discSvc: [111222333444, 2, 3], alloc: {} } } } }).replace('111222333444', '-1e999')],
    ['a band ladder whose colour is not a colour', /is not a colour/, 'bandImport', JSON.stringify({ bands: [{ id: 'a', n: 'A', rule: 'skip', c: 'red;background:url(x)' }] })],
    ['a band ladder carrying a field named __proto__', /field named .__proto__./, 'bandImport', '{"bands":[{"id":"a","n":"A","rule":"skip","c":"#123456","__proto__":{"x":1}}]}'],
  ];
  for (const [what, why, fn, txt] of JSONS) {
    const got = JSON.parse(await drive(G.ev, fn, [['hostile.json', txt]]));
    chk(name, what, 'refused at its door, saying why', got.length === 1 && /“hostile\.json” was not imported/.test(got[0]) && why.test(got[0]), true);
    chk(name, what, 'and the board is exactly as it was', everything(G.ev) === before, true);
  }

  // A FILE PAST THE SIZE LIMIT is refused from its size alone, before a byte of it is read -- at each door
  for (const fn of ['importFullBoard', 'importState', 'importBoards', 'bandImport']) {
    const got = JSON.parse(await drive(G.ev, fn, [['huge.html', '', 65 * 1048576]]));
    chk(name, 'size', `${fn} refuses a 65 MB file before reading it`, got.length === 1 && /takes files up to 64 MB/.test(got[0]), true);
  }
  chk(name, 'size', 'and the text itself is held to the limit wherever it came from',
    /takes files up to 64 MB/.test(G.ev(`inboundCheck('x'.repeat(IN_MAX_BYTES+1))`)), true);
  chk(name, 'size', 'and nothing changed', everything(G.ev) === before, true);

  // THE SHARED FOLDER: a copy somebody else's board wrote goes through the same door, and one that fails
  // it is unreadable, never half-read
  const shared = G.ev(`(function(){ try{ driveParse(${JSON.stringify(JSON.stringify({ store: { years: { [fy]: { order: ["A'x"], mc: {} } } } }))}); return 'read'; }
    catch(e){ return e.refused? e.message : 'threw '+e.message; } })()`);
  chk(name, 'shared folder', 'a copy in the shared folder carrying a hostile id is refused', /refused: .*an id may not carry/.test(shared), true);
  chk(name, 'shared folder', 'and a genuine copy is read', G.ev(`(function(){ try{ return driveParse(${JSON.stringify(JSON.stringify({ store: J0.appns[slug] }))}).store? 'read' : 'empty'; }catch(e){ return e.message; } })()`), 'read');

  // THE ESCAPING COVERS THE SINGLE QUOTE, and a value in a handler is a JSON string, whatever it holds
  chk(name, 'escaping', 'esc() turns a single quote into an entity', G.ev(`esc("a'b\\"<c&")`), 'a&#39;b&quot;&lt;c&amp;');
  chk(name, 'escaping', 'jsa() makes any value one quoted string, safe inside an attribute', G.ev(`jsa("A');x('\\"")`), '&quot;A&#39;);x(&#39;\\&quot;&quot;');
  // THE HOSTILE BOARD ITSELF, handed in as a file, is refused at the door
  const { saved } = buildHostile(readFileSync(BOARD, 'utf8'));
  chk(name, 'hostile board', 'the whole hostile fixture, as a file, is refused', /may not carry/.test(G.ev(`inboundCheck(${JSON.stringify(saved)})`)), true);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();

await (async () => {   // a function, not a bare block: see settleBoards() in boot.mjs
  const __bm = bootMark();
  const name = 'v1.88 — a board holding hostile text draws it as text, on every screen';
  try {
  const { saved, n } = buildHostile(readFileSync(BOARD, 'utf8'));
  const H = boot({ html: saved });
  chk(name, 'fixture', 'the hostile board opens with every requirement', H.ev('S.order.length'), n);
  const r = await hostileSweep(code => H.ev(code));
  chk(name, 'reach', 'the sweep opened every requirement, the panels and the menus', r.ids === n && r.panels >= 30 && r.menus >= 8, true);
  chk(name, 'drawn', 'every planted field was drawn somewhere, so the reading below looked at it', r.unseen.join(', ') || 'all', 'all');
  chk(name, 'code', 'no inline handler on any screen carries a planted call as code',
    [...r.found.values()].slice(0, 4).join(' | ') || 'none', 'none');
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 200), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();

// EVERY NAMED SCENARIO MUST RUN (see audit-import.mjs)
{
  const src = _selfRead(_selfPath(import.meta.url), 'utf8');
  const named = [...src.matchAll(/^  const name = '([^']+)'/gm)].map(m => m[1]);
  named.forEach(n => { if (!SEEN.has(n)) failures.push({ scenario: n, where: 'harness', what: 'this scenario never ran', got: 'never ran', want: 'ran' }); });
}
console.log('\n' + '='.repeat(96));
if (!failures.length) { console.log('ALL CHECKS PASSED'); process.exit(0); }
console.log(`${failures.length} FAILING CHECK(S)\n`);
for (const f of failures) console.log(`--- ${f.scenario} | ${f.where}\n    ${f.what}\n    got:  ${String(f.got).slice(0, 300)}\n    want: ${String(f.want).slice(0, 300)}\n`);
process.exit(1);
