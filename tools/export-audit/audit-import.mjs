// STATE CROSSING THE FILE BOUNDARY, in both directions.
//
// OUT and back: the board saves by rewriting its own HTML -- buildSavedHtml() replaces the pubState
// script tag inside SRC0 -- and reopening that file is how every save is ever read back. If a value
// does not survive the trip it is gone, silently, and the only evidence is a board that looks
// slightly different from the one that was saved.
//
// IN: importing a state file is the one place the board takes numbers it did not compute. Every
// per-service figure it holds is an array indexed by SVC POSITION, so a file from a board whose
// service list differs lands each of them on the wrong service -- and because the same dollars are
// all still present, every total reconciles and nothing on the board looks wrong.
//
// This suite drives the real adoption path, applyStore(), the way an import does.
import { boot, seed, BOARD } from './boot.mjs';
import { readFileSync } from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';

// boot.mjs cannot help here: the board reads browser storage DURING its own boot script, so the
// storage has to be in place before the page parses. That is what beforeParse is for.
const openWith = (html, store) => {
  const dom = new JSDOM(html, { runScripts: 'dangerously', virtualConsole: new VirtualConsole(),
    url: 'https://example.invalid/board.html',
    beforeParse(w) { Object.keys(store || {}).forEach(k => { try { w.localStorage.setItem(k, store[k]); } catch (e) {} }); } });
  const w = dom.window;
  w.URL.createObjectURL = () => 'blob:stub'; w.URL.revokeObjectURL = () => {};
  w.HTMLAnchorElement.prototype.click = function () {};
  w.alert = () => {}; w.confirm = () => true; w.prompt = () => null;
  for (const g of ['Blob','Response','Request','Headers','ReadableStream','WritableStream',
                   'TransformStream','DecompressionStream','CompressionStream'])
    if (typeof globalThis[g] === 'function') w[g] = globalThis[g];
  return w;
};
const dumpLs = (w) => { const o = {}; const ls = w.localStorage;
  for (let i = 0; i < ls.length; i++) { const k = ls.key(i); o[k] = ls.getItem(k); } return o; };

let failures = [];
const chk = (scenario, where, what, got, want) => {
  const ok = (typeof got === 'number' && typeof want === 'number')
    ? Math.abs(got - want) <= 0.005 : String(got) === String(want);
  if (!ok) failures.push({ scenario, where, what, got, want });
};

const it = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: id,
  event: id, ccar: '', fy26: ask.map(() => 0), ask, alloc: null });

// One board, three services, in this order.
const MINE = ['USAF', 'ANG', 'AFRC'];
const base = () => ({ services: MINE,
  items: [it('A', 'PSM', [9000000, 2000000, 1000000])],
  disc: [9000000, 2000000, 1000000], mand: [0, 0, 0], order: ['A'] });

// A state as another board would have written it: same three services, listed in a different order,
// with its per-service dollars in THAT order.
const theirState = (services, disc) => ({
  order: ['A'], alloc: {}, mc: {}, fsrc: {}, custom: [], removed: [],
  discSvc: disc, mandSvc: disc.map(() => 0),
  dataPack: { services },
});

// Read the per-service vector ITSELF, by position, rather than zipping it against SVC. On a real
// board SVC is baked into the file and fixed (SVC_FROM_DATA), which is the case this guard exists
// for; in this harness it is rebuilt from the store, so zipping through it would be testing the
// harness instead. Position i must hold service i's money either way -- that is the whole claim.
const dvec = (ev) => JSON.parse(ev('JSON.stringify((S.discSvc||[]).map(Math.round))'));

// ── 1. same services, different ORDER: accepted, and every dollar follows its NAME ──────────────
{
  const name = 'reorder';
  const { ev } = boot(); seed(ev, base());
  // AFRC 1M, USAF 9M, ANG 2M — the same money, written in that board's order.
  const st = theirState(['AFRC', 'USAF', 'ANG'], [1000000, 9000000, 2000000]);
  const ok = ev(`applyStore(${JSON.stringify(st)}) !== false`);
  chk(name, 'guard', 'the import is accepted', String(ok), 'true');
  // This board is USAF, ANG, AFRC. The file wrote AFRC 1M, USAF 9M, ANG 2M in ITS order, so a
  // correct remap puts 9M, 2M, 1M here. Placed by position it would read 1M, 9M, 2M -- the
  // same total, every dollar on the wrong service.
  chk(name, 'money', 'each dollar follows its service NAME, not its position',
    dvec(ev).join(','), [9000000, 2000000, 1000000].join(','));
}

// ── 2. a DIFFERENT SET of services: refused, and the board is untouched ─────────────────────────
{
  const name = 'different services';
  const { ev } = boot(); seed(ev, base());
  const before = JSON.stringify(dvec(ev));
  const st = theirState(['STOVL', 'USMC-C', 'USN'], [5000000, 4000000, 3000000]);
  const ok = ev(`applyStore(${JSON.stringify(st)}) !== false`);
  chk(name, 'guard', 'the import is refused', String(ok), 'false');
  chk(name, 'money', 'the board is exactly as it was', JSON.stringify(dvec(ev)), before);
}

// ── 3. no service list at all: caught on ARITY, which is the only tell left ─────────────────────
{
  const name = 'no service list';
  const { ev } = boot(); seed(ev, base());
  const before = JSON.stringify(dvec(ev));
  const st = { order: ['A'], alloc: {}, mc: {}, fsrc: {}, custom: [], removed: [],
               discSvc: [1, 2, 3, 4, 5], mandSvc: [0, 0, 0, 0, 0] };   // five, not three
  const ok = ev(`applyStore(${JSON.stringify(st)}) !== false`);
  chk(name, 'guard', 'a differently-shaped state is refused', String(ok), 'false');
  chk(name, 'money', 'the board is exactly as it was', JSON.stringify(dvec(ev)), before);
}

// ── 4. the board's OWN state: silent, always ────────────────────────────────────────────────────
{
  const name = 'own state';
  const { ev } = boot(); seed(ev, base());
  const before = JSON.stringify(dvec(ev));
  const ok = ev(`applyStore(JSON.parse(JSON.stringify(MS))) !== false`);
  chk(name, 'guard', 'reloading this board’s own state is accepted', String(ok), 'true');
  chk(name, 'money', 'and changes nothing', JSON.stringify(dvec(ev)), before);
}

// ── 5. EXHAUSTIVENESS: no per-service vector may be left in the file's order ────────────────────
// Every vector is filled with the FILE's own service indices [0,1,2]. After a remap by name each
// one must read back as the map. A vector svcRemapState() forgot stays [0,1,2] and fails here --
// the oracle walks the state generically, so it does not share svcRemapState's list of what to fix.
{
  const name = 'exhaustive remap';
  const { ev } = boot(); seed(ev, base());
  const N = MINE.length, ident = [0, 1, 2];
  const st = {
    order: ['A'], removed: [], mc: {},
    discSvc: ident.slice(), mandSvc: ident.slice(),
    bm: { disc: ident.slice(), mand: ident.slice(), adds: [{ vec: ident.slice() }] },
    custom: [{ id: 'X', grp: 'PSM', custom: true, title: 'X', event: 'X', ccar: '',
               ask: ident.slice(), fy26: ident.slice(), alloc: null }],
    asks: { A: ident.slice() },
    alloc: { A: { m: 's', v: ident.slice() } },
    fsrc: { A: { m: 'split', dv: ident.slice(), mv: ident.slice() } },
    clins: { A: [{ ask: ident.slice() }] },
    awards: { A: { mode: 'inc', inc: [{ d: '2026-11', day: 1, sv: ident.slice() }] } },
    years: { 2028: { order: ['A'], discSvc: ident.slice(), mandSvc: ident.slice() } },
    dataPack: { services: ['AFRC', 'USAF', 'ANG'] },
  };
  const out = JSON.parse(ev(`(function(){
    var c = svcCheckPack(${JSON.stringify(st.dataPack)}, null);
    var s = ${JSON.stringify(st)};
    svcRemapState(s, c.map);
    return JSON.stringify({ map: c.map, st: s });
  })()`));
  chk(name, 'guard', 'the reorder is recognised', out.map.join(','), [1, 2, 0].join(','));

  // Generic walk: ANY array of service length made of the file's indices must now be the map.
  const bad = [];
  (function walk(node, path) {
    if (Array.isArray(node)) {
      const numeric = node.length === N && node.every(v => typeof v === 'number');
      if (numeric) {
        if (node.join(',') !== out.map.join(',')) bad.push(path + ' = [' + node.join(',') + ']');
        return;
      }
      node.forEach((v, i) => walk(v, path + '[' + i + ']'));
      return;
    }
    if (node && typeof node === 'object')
      Object.keys(node).forEach(k => { if (k !== 'dataPack') walk(node[k], path + '.' + k); });
  })(out.st, '');
  chk(name, 'exhaustive', 'every per-service vector was remapped'
    + (bad.length ? ' — left in file order: ' + bad.join(', ') : ''), bad.length, 0);
}

// ── 6. a refusal leaves the store byte-identical ─────────────────────────────────────
// Refusing is only useful if it refuses CLEANLY: a guard that rejects the file after half-writing
// it would be worse than no guard, because the board would then be neither the old one nor the new.
//
// LIMIT, STATED RATHER THAN PAPERED OVER: this drives applyStore(), which is the path a POPULATED
// board takes. importState()'s own branch for that case cannot be reached from here -- IS_SHELL is
// a boot-time const off the shipped DATA, and the committed program carries none, by the same rule
// that forbids committing a populated board. So the callers' `if(applyStore(...)===false) return;`
// lines are reviewed, not covered. What they protect is a misleading status line; what the guard
// itself protects is the money, and that is covered above.
{
  const name = 'refusal is clean';
  const { ev } = boot(); seed(ev, base());
  const before = ev('JSON.stringify(MS)');
  const st = theirState(['STOVL', 'USMC-C', 'USN'], [5000000, 4000000, 3000000]);
  const r = ev(`applyStore(${JSON.stringify(st)})`);
  chk(name, 'guard', 'applyStore reports the refusal to its caller', String(r), 'false');
  chk(name, 'state', 'the store is byte-identical to before', ev('JSON.stringify(MS)'), before);
  chk(name, 'state', 'and the board still renders', ev('(render(), "ok")'), 'ok');
}

// ── 7. the service list hiding under a year ───────────────────────────────────────
// A teammate sends a STATE file, not a store. normalizeStore() nests it under years.<fy>, taking
// its dataPack down with it -- so a guard reading only raw.dataPack found nothing to compare and
// waved the file through. That is the commonest shape there is, and it was the shape that got past
// the first version of this guard.
{
  const name = 'pack under a year';
  const { ev } = boot(); seed(ev, base());
  const before = ev('JSON.stringify(MS)');
  const store = { base: 2027, cur: 2027, years: { 2027: {
    order: ['A'], alloc: {}, mc: {}, fsrc: {}, custom: [], removed: [],
    discSvc: [5000000, 4000000, 3000000], mandSvc: [0, 0, 0],
    dataPack: { services: ['STOVL', 'USMC-C', 'USN'] } } } };
  const r = ev(`applyStore(${JSON.stringify(store)})`);
  chk(name, 'guard', 'a pack nested under a year is still found and refused', String(r), 'false');
  chk(name, 'state', 'the store is byte-identical to before', ev('JSON.stringify(MS)'), before);
  // The same shape, with THIS board's services, must still load.
  const mineStore = JSON.parse(JSON.stringify(store));
  mineStore.years[2027].dataPack.services = MINE;
  mineStore.years[2027].discSvc = [9000000, 2000000, 1000000];
  chk(name, 'guard', 'the same shape with this board\u2019s services loads',
    String(ev(`applyStore(${JSON.stringify(mineStore)}) !== false`)), 'true');
}


// A real board has its requirements in DATA when BASE_ITEMS is captured at boot, so dataPackOf()
// carries them into the saved file. seed() runs AFTER boot, so the fixture has to fill BASE_ITEMS
// itself -- without this the file saves items:[] and the reopened board drops every non-custom row.
const asBooted = (ev, sc) => ev(`(function(){
  BASE_ITEMS.length=0;
  ${JSON.stringify(sc.items)}.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
  return 'ok'; })()`);

// pmoOrder is REBUILT from the requirement list on load, so it is derived state rather than saved
// state and is excluded from the whole-store comparison. Everything else has to match exactly.
// SAVE CLOCKS ARE MEANT TO MOVE: buildSavedHtml() calls save(), which stamps a fresh MS.ts, so a
// byte comparison would fail on a millisecond and say nothing about the data. Only the three
// timestamps are zeroed -- by name, not by walking for every key called "t", because `t` elsewhere
// in the store is a title (rcn) and a match string (flow.ents).
const settled = (ev) => { const m = JSON.parse(ev('JSON.stringify(MS)'));
  Object.keys(m.years || {}).forEach(y => { delete m.years[y].pmoOrder; });
  m.ts = 0;
  (m.log || []).forEach(e => { e.ts = 0; });
  (m.jrnl || []).forEach(e => { e.t = 0; });
  return JSON.stringify(m); };

// ══ SAVE → REOPEN ═════════════════════════════════════════════════════════════
// The board persists by rewriting its own HTML. buildSavedHtml() drops the whole store into the
// pubState script tag of SRC0; reopening that file is the ONLY way a save is ever read back. So the
// invariant is simply: what comes back is what went in. Nothing tested this before -- the saved
// file was built, downloaded and trusted.
{
  const name = 'save → reopen';
  const sc = base();
  const { ev } = boot(); seed(ev, sc); asBooted(ev, sc);

  // A board with something in every store worth losing: renames, notes, a per-service split, a
  // trimmed allocation, an award schedule with increments, an MC star, a band, a custom row.
  ev(`
    S.mc['A']=true;
    S.titles['A']='Renamed \u2014 with an em dash, a "quote" and an apostrophe\u2019s tail';
    S.notes['A']='note with <b>markup</b> and a literal <\/script> in it';
    S.desc['A']='description \u2713 with unicode \u00e9\u00e5\u5b57 and an emoji \ud83d\ude80';
    S.ccar['A']='JSF9911'; S.pid['A']='PID-4242';
    S.alloc['A']={m:'t', v:7500001};
    seedSplit('A'); S.fsrc['A'].dv[1]=123456;
    S.awards['A']={mode:'inc', inc:[{d:FYMON[1][0], day:3, sv:[10,20,30]},
                                    {d:FYMON[4][0], day:17, sv:[40,50,60]}]};
    S.minInc['A']=250000; S.absorb='A'; S.absorbFloor=1000;
    S.custom.push({id:'NEW-1',grp:'PSM',sect:'new',custom:true,title:'added row',event:'e',
                   ccar:'',fy26:[0,0,0],ask:[11,22,33],alloc:null});
    S.order.push('NEW-1');
    save(); 'ok'`);

  const before = settled(ev);
  const html   = ev('buildSavedHtml()');
  chk(name, 'file', 'the saved file carries a pubState payload',
    /<script type="application\/json" id="pubState">.+?<\/script>/s.test(html) ? 'yes' : 'no', 'yes');
  // A literal </script> inside a note would end the tag early and truncate the whole store. The
  // writer escapes "<"; this is what proves the escape is load-bearing rather than decorative.
  chk(name, 'file', 'no stray </script> inside the payload',
    (html.match(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/) || [,''])[1]
      .indexOf('</script>') < 0 ? 'clean' : 'truncated', 'clean');

  // Reopen the saved file exactly as a browser would, and read its store back.
  const re = boot({ html });
  chk(name, 'store', 'the reopened board is the board that was saved', settled(re.ev), before);
  chk(name, 'store', 'and it rendered without throwing',
    re.errors.length ? re.errors[0].slice(0, 120) : 'ok', 'ok');
}

// ══ the values most likely to be quietly mangled ════════════════════════════════════
// A whole-store comparison passes the moment both sides are equally wrong, so name the fields that
// would cost real money or real meaning and check them one at a time on the REOPENED board.
{
  const name = 'what survives';
  const sc2 = base();
  const { ev } = boot(); seed(ev, sc2); asBooted(ev, sc2);
  ev(`
    S.alloc['A']={m:'t', v:7500001};
    seedSplit('A'); S.fsrc['A'].dv[1]=123456;
    S.awards['A']={mode:'inc', inc:[{d:FYMON[1][0], day:3, sv:[10,20,30]}]};
    S.titles['A']='a "quoted" \u2014 title'; S.notes['A']='</script> & <b>&amp;</b>';
    S.minInc['A']=250000; save(); 'ok'`);
  const re = boot({ html: ev('buildSavedHtml()') });
  const got = k => re.ev(k);
  chk(name, 'money', 'the trimmed allocation keeps its exact dollars', Number(got("S.alloc['A'].v")), 7500001);
  chk(name, 'money', 'a hand-typed split value survives', Number(got("S.fsrc['A'].dv[1]")), 123456);
  chk(name, 'money', 'and it is still a NUMBER, not a string', got("typeof S.fsrc['A'].dv[1]"), 'number');
  chk(name, 'money', 'the minimum useful increment survives', Number(got("S.minInc['A']")), 250000);
  chk(name, 'schedule', 'the increment day survives', Number(got("S.awards['A'].inc[0].day")), 3);
  chk(name, 'schedule', 'its per-service dollars survive',
    got("JSON.stringify(S.awards['A'].inc[0].sv)"), '[10,20,30]');
  chk(name, 'text', 'a title with quotes and an em dash survives',
    got("S.titles['A']"), 'a "quoted" \u2014 title');
  chk(name, 'text', 'a note containing </script> and entities survives',
    got("S.notes['A']"), '</script> & <b>&amp;</b>');
}

// ══ READING A WORKBOOK ══════════════════════════════════════════════════════════════════════════
// xlsxRead() is a hand-rolled ZIP+XLSX parser, and every offset it follows comes out of the file
// itself. A CCaR pull that did not finish downloading points those offsets anywhere. Unchecked they
// threw "Offset is outside the bounds of the DataView" -- true, and no help at all to someone who
// just wants to know whether to download it again.
//
// The fixture is built by the board's OWN writer, so a workbook that round-trips proves reader and
// writer agree, and damaging that buffer gives realistically-corrupt files rather than invented ones.
{
  const name = 'workbook reader';
  const { w } = boot();
  const r = JSON.parse(await w.eval(`(async function(){
    const mk = () => { const b = buildXlsx([{name:'Pull', cols:[20,12], rows:[
        [{v:'Requirement'},{v:'Amount'}],
        [{v:'O&M <ampersand> "quoted"'},{v:1234567.89}],
        [{v:'second row'},{v:0}]]}]);
      return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); };
    const full = mk();
    const out = { ok:null, errs:{} };
    try { const sh = await xlsxRead(full);
          out.ok = { sheets:Object.keys(sh), rows:sh[Object.keys(sh)[0]] }; }
    catch(e){ out.ok = 'THREW: ' + ((e&&e.message)||e); }
    const eat = async (label, buf) => {
      try { await xlsxRead(buf); out.errs[label] = 'NO ERROR'; }
      catch(e){ out.errs[label] = ((e&&e.message)||String(e)); } };
    await eat('empty', new ArrayBuffer(0));
    await eat('noise', new Uint8Array([1,2,3,4,5,6,7,8,9,10]).buffer);
    await eat('truncated', full.slice(0, Math.floor(full.byteLength*0.6)));
    const at = (b) => { const dv=new DataView(b);
      for(let i=b.byteLength-22;i>=0;i--) if(dv.getUint32(i,true)===0x06054b50) return [dv,i];
      return [dv,-1]; };
    const bad = full.slice(0);   { const [dv,e]=at(bad);  dv.setUint32(e+16, 0x7fffff00, true); }
    await eat('cdOffset', bad);
    // A perfectly valid ZIP that simply is not a workbook -- what you get if someone picks the
    // wrong file, or a .zip of the pull rather than the pull.
    const notBook = _zipStore([['hello.txt', _utf8('this is not a workbook')]]);
    await eat('zipNotWorkbook', notBook.buffer.slice(notBook.byteOffset, notBook.byteOffset+notBook.byteLength));
    // A workbook whose sheet points at shared text that is not there. Handed back unchecked this
    // is undefined, which lands as a blank cell and reads as missing data, not a broken file.
    const P = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    const dangling = _zipStore([
      ['xl/workbook.xml', _utf8(P+'<workbook xmlns:r="r"><sheets><sheet name="Pull" sheetId="1" r:id="rId1"/></sheets></workbook>')],
      ['xl/_rels/workbook.xml.rels', _utf8(P+'<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>')],
      ['xl/worksheets/sheet1.xml', _utf8(P+'<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>99</v></c></row></sheetData></worksheet>')]]);
    await eat('danglingString', dangling.buffer.slice(dangling.byteOffset, dangling.byteOffset+dangling.byteLength));
    const many = full.slice(0);  { const [dv,e]=at(many); dv.setUint16(e+10, 60000, true); }
    await eat('entryCount', many);
    return JSON.stringify(out);
  })()`));

  // The round trip first: a workbook this app wrote, read back by this app.
  chk(name, 'round trip', 'a workbook the board wrote reads back',
    typeof r.ok === 'string' ? r.ok : 'read', 'read');
  if (typeof r.ok !== 'string') {
    chk(name, 'round trip', 'the sheet name survives', r.ok.sheets.join(','), 'Pull');
    // "O&M" is in nearly every budget line, and it is written as an escaped inline string.
    chk(name, 'round trip', 'ampersands and quotes come back unescaped',
      r.ok.rows[1][0], 'O&M <ampersand> "quoted"');
    chk(name, 'round trip', 'a number comes back as a NUMBER', typeof r.ok.rows[1][1], 'number');
    chk(name, 'round trip', 'and keeps its cents', r.ok.rows[1][1], 1234567.89);
    chk(name, 'round trip', 'a zero is kept, not dropped', r.ok.rows[2][1], 0);
  }

  // Then the damaged ones. Each must NAME what is wrong -- never a bare RangeError, and never
  // silence, which would let a half-read pull land on the board as real data.
  const says = (label, must) => {
    const m = r.errs[label] || '(missing)';
    chk(name, 'damaged', `${label}: is rejected`, m === 'NO ERROR' ? 'accepted' : 'rejected', 'rejected');
    chk(name, 'damaged', `${label}: says what is wrong, not "${m.slice(0, 28)}…"`,
      must.test(m) ? 'explains' : m.slice(0, 70), 'explains');
    chk(name, 'damaged', `${label}: is not a raw JS error`,
      /outside the bounds|is not a function|of undefined|Cannot read/.test(m) ? m.slice(0, 60) : 'clean', 'clean');
  };
  says('empty',      /empty/i);
  says('noise',      /not an \.xlsx|end-of-directory/i);
  says('truncated',  /not an \.xlsx|end-of-directory|truncated/i);
  says('cdOffset',   /directory starts at byte \d+/i);
  says('entryCount', /claims \d+ entries/i);
  says('zipNotWorkbook', /no workbook part/i);
  says('danglingString', /shared-string table|points at text/i);
}

// ══ MOVING A REQUIREMENT BETWEEN FISCAL YEARS ═══════════════════════════════════════════════════
// yearCopy() carries a requirement and everything attached to it into another year. Its own comment
// warns that the container list it normalises and the cp() payload below it "MUST STAY IN STEP, IN
// BOTH DIRECTIONS": a container normalised with no cp() arrives on the target EMPTY and the data
// stays behind, which looks exactly like a year nobody has filled in yet. That warning had no test.
//
// The key list is read out of the BOARD'S OWN SOURCE, not restated here, so a container added to
// the normalise list and forgotten in the payload fails this check the day it is added.
{
  const name = 'copy / move between years';
  const src = readFileSync(BOARD, 'utf8');
  const listM = /\n  \['alloc','mc',([\s\S]*?)\]\n    \.forEach\(k=>\{ if\(!T\[k\]\) T\[k\]=\{\}; \}\);/.exec(src);
  const KEYS = listM ? ("['alloc','mc'," + listM[1] + "]").match(/'([a-zA-Z]+)'/g).map(x => x.slice(1, -1)) : [];
  chk(name, 'oracle', 'the container list was read from the board', KEYS.length > 25 ? 'read' : KEYS.length, 'read');

  const { ev } = boot(); seed(ev, base());
  // A marker in every container, shaped the way each one really holds its value.
  const out = JSON.parse(ev(`(function(){
    const KEYS = ${JSON.stringify(KEYS)};
    KEYS.forEach(function(k){ if(!S[k]) S[k]={}; });
    KEYS.forEach(function(k){ S[k]['A'] = 'MK-' + k; });
    S.alloc['A']   = {m:'t', v:7500001};
    S.mc['A']      = true;
    S.minInc['A']  = 42;
    S.fsrc['A']    = {m:'split', dv:[1,2,3], mv:[0,0,0]};
    S.awards['A']  = {mode:'inc', inc:[{d:'2026-11', day:9, sv:[1,2,3]}], d:'2026-11'};
    S.crHalf['A']  = {'2026-11': 1};
    S.upl = S.upl || {}; S.upl['r|A'] = 1;
    save();
    const beforeSrc = JSON.stringify(MS.years[MS.cur]);
    const r = yearCopy('A', 2029, 'c');
    const T = MS.years[2029] || {};
    const got = {};
    KEYS.forEach(function(k){ got[k] = (T[k] && T[k]['A'] !== undefined) ? 'carried' : 'LOST'; });
    return JSON.stringify({
      ok: r && r.ok, tid: r && r.tid,
      got: got,
      order: (T.order||[]).slice(),
      awd: T.awards && T.awards['A'],
      crHalf: T.crHalf && T.crHalf['A'],
      asks: T.asks && T.asks['A'],
      uplTarget: !!(T.upl && T.upl['r|A']),
      srcUnchanged: JSON.stringify(MS.years[MS.cur]) === beforeSrc
    });
  })()`));

  chk(name, 'copy', 'the copy reports success', String(out.ok), 'true');
  chk(name, 'copy', 'the requirement is on the target year’s order',
    out.order.includes('A') ? 'present' : 'missing', 'present');
  // THE CHECK THE WARNING ASKS FOR: every normalised container actually carried something.
  // ONE NAMED EXCEPTION. upl is keyed 'r|<id>', not by the bare id -- the board says so, and
  // cp(T.upl, S.upl[id]) would have copied undefined and looked like it worked. It carries under
  // its real key, which the uplTarget check below proves; it is excluded here by name so the
  // exception is on the record rather than absorbed by a looser sweep.
  const KEYED_DIFFERENTLY = { upl: "keyed 'r|<id>', checked separately below" };
  const lost = KEYS.filter(k => out.got[k] === 'LOST' && !KEYED_DIFFERENTLY[k]);
  chk(name, 'copy', 'every container the target normalises also receives its data'
    + (lost.length ? ' — arrived empty: ' + lost.join(', ') : ''), lost.length, 0);
  // Dates move with the year; a copy two years out must not still say 2026.
  chk(name, 'copy', 'the award date shifts with the year', out.awd && out.awd.d, '2028-11');
  chk(name, 'copy', 'an increment date shifts too',
    out.awd && out.awd.inc && out.awd.inc[0].d, '2028-11');
  chk(name, 'copy', 'the increment keeps its day', out.awd && out.awd.inc && out.awd.inc[0].day, 9);
  chk(name, 'copy', 'the CR half-month key shifts too',
    Object.keys(out.crHalf || {}).join(','), '2028-11');
  chk(name, 'copy', 'the requirement value travels',
    JSON.stringify(out.asks), JSON.stringify([9000000, 2000000, 1000000]));
  chk(name, 'copy', 'the UPL mark travels under its r| key',
    String(out.uplTarget), 'true');
  chk(name, 'copy', 'a COPY leaves this year untouched', String(out.srcUnchanged), 'true');

  // A MOVE takes it out of this year. Anything less leaves the same money in two years at once.
  const mv = JSON.parse(ev(`(function(){
    const r = yearCopy('A', 2030, 'm');
    return JSON.stringify({ ok:r&&r.ok,
      stillHere: S.order.indexOf('A') >= 0,
      removed: (S.removed||[]).indexOf('A') >= 0,
      inTarget: ((MS.years[2030]||{}).order||[]).indexOf('A') >= 0,
      inPmoOrder: Object.keys(S.pmoOrder||{}).some(function(g){
        return (S.pmoOrder[g]||[]).indexOf('A') >= 0; }) });
  })()`));
  chk(name, 'move', 'the move reports success', String(mv.ok), 'true');
  chk(name, 'move', 'it is gone from this year’s order', String(mv.stillHere), 'false');
  chk(name, 'move', 'and recorded as removed, so it is restorable', String(mv.removed), 'true');
  chk(name, 'move', 'it is on the target year', String(mv.inTarget), 'true');
  chk(name, 'move', 'and off every PMO ordering here', String(mv.inPmoOrder), 'false');
}

// ══ THE PMO COPY, AND WHAT COMES BACK FROM IT ═══════════════════════════════════════════════════
// A copy published for a programme office: everything works on screen, nothing reaches the team's
// board, and the one artifact it produces is a submittal the team reviews field by field.
//
// The guardrail is honest about being a guardrail -- the data is in the file and anyone who opens
// it can read all of it. What these checks protect is the part that IS enforceable: that the copy
// cannot write outward, that a submittal carries only what a PMO is invited to propose, and that
// nothing lands on the board without being ticked.
{
  const name = 'PMO copy';
  // TWO REAL REQUIREMENTS. This block corrects a record number on B, and B has to be a requirement
  // the board actually has for that to mean anything: a bag key for an id not in S.order gets no
  // baseline when the copy is published, so it is not a field a programme office can propose --
  // it is a stray key, and the package is right to leave it behind.
  const sc = base();
  sc.items.push(it('B', 'ATL', [3000000, 500000, 250000]));
  sc.order.push('B');
  const { ev } = boot(); seed(ev, sc); asBooted(ev, sc);

  chk(name, 'flag', 'the portfolio board is not a sandbox', String(ev('SANDBOX')), 'false');

  // String.raw: a plain template literal eats the backslashes out of the regex and the \u003c
  // escape, and the page then throws "Invalid regular expression flags" from inside eval.
  const html = ev(String.raw`(function(){
    const mode={sandbox:true, by:'BLL', ts:Date.now(), fy:MS.cur, base:pmoBaseline()};
    return buildSavedHtml().replace(/(<script type="application\/json" id="pubMode">)[\s\S]*?(<\/script>)/,
      function(m,a,b){ return a + JSON.stringify(mode).replace(/</g,'\\u003c') + b; }); })()`);
  const P = boot({ html });
  chk(name, 'flag', 'the published copy knows it is one', String(P.ev('SANDBOX')), 'true');
  chk(name, 'flag', 'and who published it', P.ev('PMODE.by'), 'BLL');

  // OUTBOUND IS SHUT. Each of the four is checked by driving it and watching for the refusal --
  // a button that is merely hidden is still reachable from the console or a stale menu.
  const blocked = (call) => P.ev(`(function(){ var hit=false; var _a=window.alert;
    window.alert=function(){ hit=true; }; try{ ${call}; }catch(e){} window.alert=_a;
    return hit? 'refused' : 'ALLOWED'; })()`);
  chk(name, 'outbound', 'saving to a file is refused',       blocked('saveInPlaceFile()'), 'refused');
  chk(name, 'outbound', 'saving in place is refused',        blocked('saveInPlace()'),     'refused');
  chk(name, 'outbound', 'downloading a board copy is refused', blocked('publishState()'),  'refused');
  chk(name, 'outbound', 'publishing another PMO copy is refused', blocked('publishPmoCopy()'), 'refused');
  // ...but their own work must survive a refresh, or an afternoon of impact statements is lost.
  chk(name, 'outbound', 'their own browser storage still accepts changes', String(P.ev('persist()')), 'true');

  // WHAT TRAVELS BACK. Only the invited fields, only where they differ from the baseline shipped
  // with the copy, and never the priority order -- the ranking stays the portfolio team's.
  // A is PSM's and B is ATL's. The office is PSM, so B's correction must not travel however
  // thoroughly it was typed -- that is the scope, checked here as well as in its own scenario
  // because this is the scenario that proves WHAT a package carries.
  P.ev(`try{ localStorage.setItem('prio27who','PMO Lead');
              localStorage.setItem('prio27pmo','PSM'); }catch(e){}
    S.cons['A'] = 'Depot line stops in March; forty aircraft unsupported. '.repeat(12);
    S.desc['A'] = 'Sustainment of the depot line.';
    S.asks['A'] = [9500000, 2000000, 1000000];
    S.ccar['A'] = 'JSF7777';
    S.ccar['B'] = 'JSF8888';
    S.order = ['B','A'];
    S.mc['A'] = true; S.band['A'] = 'pdm';
    S.alloc['A'] = {m:'t', v:1};
    save(); 'ok'`);
  // pmoSubmitBuild() collects what CHANGED; the scope is applied when the package is built, so
  // this still sees both and the wire package below is where B must disappear.
  const sub = JSON.parse(P.ev('JSON.stringify(pmoSubmitBuild())'));
  chk(name, 'submittal', 'it carries the requirements that changed',
    Object.keys(sub).sort().join(','), 'A,B');
  chk(name, 'submittal', 'A carries exactly the invited fields it changed',
    Object.keys(sub.A || {}).sort().join(','), 'asks,ccar,cons,desc');
  chk(name, 'submittal', 'B carries only its record correction',
    Object.keys(sub.B || {}).sort().join(','), 'ccar');
  // The star, the band and the allocation are the portfolio team's calls. A package that could
  // carry them would turn a review into an argument about who decides what.
  ['mc', 'band', 'alloc', 'fsrc', 'awards', 'minInc'].forEach(k =>
    chk(name, 'submittal', `${k} is NOT something a PMO can propose`,
      JSON.stringify(sub).includes('"' + k + '"') ? 'carried' : 'withheld', 'withheld'));
  chk(name, 'submittal', 'the priority order is not sent',
    JSON.stringify(sub).includes('"order"') ? 'sent' : 'theirs to explore', 'theirs to explore');
  // JRNL_BIG caps a journalled value at 300 characters; an impact statement runs well past it.
  // This is why the package carries values rather than journal entries.
  chk(name, 'submittal', 'a long impact statement survives whole',
    (sub.A && sub.A.cons || '').length > 300 ? 'whole' : 'truncated', 'whole');

  // THE PACKAGE ITSELF, built the way the button builds it. Testing pmoSubmitBuild() alone leaves
  // the packaging untested -- and the baseline, which is the only thing that makes a conflict
  // knowable on the other end, is added during packaging.
  const wire = JSON.parse(P.ev(`(function(){ var cap=null; var _B=window.Blob;
    window.Blob=function(parts,opts){ cap=parts&&parts[0]; return new _B(parts,opts); };
    try{ pmoSubmit(); }catch(e){} window.Blob=_B; return cap; })()`));
  chk(name, 'submittal', 'the package says what it is', wire.dir, 'submit');
  chk(name, 'submittal', 'it is attributed to the sender', wire.by, 'PMO Lead');
  chk(name, 'submittal', 'and to the office it is from', wire.pmo, 'PSM');
  // THE SCOPE BITES HERE, between what changed and what is sent.
  chk(name, 'submittal', 'another office\u2019s requirement does not travel',
    Object.keys(wire.items || {}).sort().join(','), 'A');
  chk(name, 'submittal', 'it says which copy it came from',
    wire.fromTs > 0 ? 'dated' : 'undated', 'dated');
  // Without this the reviewing board has nothing to compare against and every field reads as
  // uncontested, however much has changed since the copy went out.
  chk(name, 'submittal', 'it carries the baseline it was published with',
    Object.keys(wire.base || {}).sort().join(','), 'A');
  chk(name, 'submittal', 'and the baseline holds the value each field started from',
    JSON.stringify((wire.base || {}).A && wire.base.A.asks),
    JSON.stringify([9000000, 2000000, 1000000]));
}

// ── review: nothing lands without a tick, and a clash is visible ────────────────────────────────
{
  const name = 'submittal review';
  const sc = base();
  const { ev } = boot(); seed(ev, sc); asBooted(ev, sc);
  // The board moved on after the copy went out: it rewrote the SAME impact statement.
  ev(`S.cons['A']='Our own earlier wording.'; save(); 'ok'`);
  const pkg = { spmtPkg: 1, dir: 'submit', ap: '', fy: 2027, ts: Date.now(), by: 'PMO Lead',
    fromTs: Date.now() - 86400000,
    items: { A: { cons: 'Theirs: the depot line stops in March.', asks: [9500000, 2000000, 1000000] },
             B: { ccar: 'JSF7777' } },
    base:  { A: { cons: null, asks: [9000000, 2000000, 1000000] }, B: { ccar: null } } };
  ev(`window.alert=function(){}; pmoTake(${JSON.stringify(pkg)}, 'sub.json'); 'ok'`);

  const rows = JSON.parse(ev('JSON.stringify(pmoRows().map(function(r){ return {id:r.id,key:r.key,conflict:r.conflict}; }))'));
  chk(name, 'diff', 'it holds three proposed changes', rows.length, 3);
  // THE CONFLICT IS THE POINT. The baseline travels in the package, so "changed here since" is
  // knowable; diffing against the board's own current values would compare it with itself and
  // every field would look uncontested.
  chk(name, 'diff', 'the field this board also changed is flagged',
    rows.filter(r => r.conflict).map(r => r.id + '|' + r.key).join(','), 'A|cons');
  chk(name, 'diff', 'and the untouched ones are not',
    rows.filter(r => !r.conflict).length, 2);
  chk(name, 'review', 'nothing is ticked to begin with', ev('Object.keys(PMOPICK).length'), 0);
  chk(name, 'review', 'so applying now does nothing',
    ev(`(function(){ var h=false; var _a=window.alert; window.alert=function(){h=true;};
        pmoApply(); window.alert=_a; return h? 'refused':'APPLIED'; })()`), 'refused');
  chk(name, 'review', 'the board is untouched while it is only proposed',
    ev("S.cons['A']"), 'Our own earlier wording.');
  chk(name, 'report', 'a change report builds before anything is applied',
    ev(`(function(){ var n=0; var _c=URL.createObjectURL;
        URL.createObjectURL=function(b){ n=(b&&(b.size||b.length))||1; return 'blob:x'; };
        pmoReport(); URL.createObjectURL=_c; return n>500? 'built':'empty'; })()`), 'built');

  // Tick two of the three; the third must stay where it was.
  ev(`PMOPICK={}; pmoRows().forEach(function(r){ if(r.id==='A'&&(r.key==='cons'||r.key==='asks')) PMOPICK[pickKey(r)]=true; });
    window.confirm=function(){return true;};
      window.alert=function(){}; pmoApply(); 'ok'`);
  chk(name, 'apply', 'the ticked impact statement is applied',
    ev("S.cons['A']"), 'Theirs: the depot line stops in March.');
  chk(name, 'apply', 'the ticked requirement value is applied',
    ev("JSON.stringify(S.asks['A'])"), JSON.stringify([9500000, 2000000, 1000000]));
  chk(name, 'apply', 'the unticked record correction is NOT applied',
    ev("S.ccar['B'] || '(none)'"), '(none)');
  chk(name, 'apply', 'every applied change is in the change journal',
    ev("MS.jrnl.filter(function(e){ return e.p && e.p[0]==='cons'; }).length > 0") ? 'journalled' : 'silent',
    'journalled');
}

// ══ THE HANDOFF, HELD TO "NOTHING IS LOST AND NOTHING IS INVENTED" ══════════════════════════════
// Two directions, one standard: the copy a programme office receives must compute exactly what this
// board computes, and an accepted change must leave the board exactly as if it had been typed here
// by hand. Anything less is a number briefed to leadership that nobody typed.
const fpOf = (ev) => ev(`(function(){ const T=tiers(); const o={};
  S.order.forEach(function(id){ const p=T[id]; if(!p) return;
    o[id]={d:p.d.map(Math.round), m:p.m.map(Math.round), u:p.u.map(Math.round),
           cum:Math.round(p.cum), tier:p.tier, natM:Math.round(p.natM), natU:Math.round(p.natU)}; });
  const TT=tierTotals(T), MC=mcCalc(T);
  o.__tot={dUsed:Math.round(TT.dUsed), mUsed:Math.round(TT.mUsed), uAmt:Math.round(TT.uAmt)};
  o.__mc={tot:MC.tot.map(Math.round), need:MC.need.map(Math.round)};
  o.__ask=S.order.map(function(id){ var x=itemById(id); return x? JSON.stringify(x.ask):'?'; });
  return JSON.stringify(o); })()`);

// A board with the awkward cases on it: six services, a scalar trim, a split, an award, a star,
// and a CUSTOM requirement -- the one whose value does not live where every other one's does.
const handoffSc = () => ({
  services: ['USAF','ANG','AFRC','STOVL','USMC-C','USN'],
  // ONE OFFICE OWNS ALL THREE. This scenario is about what KIND of field survives the trip -- long
  // prose, a per-service vector, a custom requirement -- not about who owns what. A submittal is
  // scoped to its own office now, so a fixture spanning three would quietly shrink to one row and
  // stop testing the thing it exists for. Scoping is proved in 'scoped submittals'.
  items: [it('A','PSM',[9000000,2000000,1000000,4000000,1500000,2500000]),
          it('B','PSM',[3000000,500000,250000,1000000,0,750000]),
          it('C','PSM',[1200000,0,0,300000,200000,100000])],
  disc:[8000000,1500000,600000,3000000,1400000,1600000],
  mand:[4000000,600000,400000,1500000,800000,900000],
  order:['A','B','C'], mc:{A:true},
});
const handoffSeed = (ev, sc) => { asBooted(ev, sc); ev(`
  // THE SIDE DATABASES RIDE ALONGSIDE THE STORE, not inside it: execution data, the ACE cost
  // estimate and the reprogramming log are their own globals and buildSavedHtml() packs each one
  // separately. Left empty in the fixture, a copy that dropped them looked identical to one that
  // carried them -- so seed all three with something recognisable.
  EXDB={ts:1700000000001, all:{'A':{oblig:1234567, comm:7654321}}};
  ACEDB={ts:1700000000002, sets:{'FY27':{'A':{pt:42}}}};
  RPDB={ts:1700000000003, entries:[{id:'r1', k:'ATR', fy:2027, amt:2500000, note:'depot line'}]};
  S.alloc['B']={m:'t',v:3900001}; S.band['A']='pdm'; seedSplit('C');
  S.awards['A']={mode:'single',d:FYMON[2][0],day:7};
  S.custom.push({id:'NEW-1',grp:'PSM',sect:'new',custom:true,title:'Added here',event:'e',
                 ccar:'',fy26:SVC.map(function(){return 0;}), ask:[500000,0,0,0,0,0], alloc:null});
  S.order.push('NEW-1'); applyState(S); save(); 'ok'`); };

{
  const name = 'handoff — out';
  const sc = handoffSc();
  const { ev } = boot(); seed(ev, sc); handoffSeed(ev, sc);
  const boardFp = fpOf(ev);
  const html = ev(String.raw`(function(){
    const mode={sandbox:true, by:'BLL', ts:Date.now(), fy:MS.cur, base:pmoBaseline()};
    return buildSavedHtml().replace(/(<script type="application\/json" id="pubMode">)[\s\S]*?(<\/script>)/,
      function(m,a,b){ return a + JSON.stringify(mode).replace(/</g,'\\u003c') + b; }); })()`);
  const P = boot({ html });

  // IF THE COPY COMPUTES ANYTHING DIFFERENT, every conversation downstream is about a different
  // board. This compares each requirement's lane vectors, its cumulative, its tier, both cutline
  // figures, the portfolio totals, Mission Critical, and every requirement value.
  chk(name, 'figures', 'the copy computes exactly what this board computes', fpOf(P.ev), boardFp);
  chk(name, 'content', 'it carries every requirement', P.ev('S.order.length'), ev('S.order.length'));
  chk(name, 'content', 'including the one added here', P.ev(`S.order.indexOf('NEW-1')>=0`), true);
  chk(name, 'content', 'the baseline covers every requirement',
    P.ev('Object.keys(PMODE.base).length'), ev('S.order.length'));
  // Every per-requirement store, compared whole. A store that failed to travel would look like a
  // programme office that simply had not written anything.
  ['alloc','mc','band','fsrc','awards','asks','notes','desc','cons','ccar','pid','recNames',
   'minInc','rcnAsg','si','wbs','ptype','obCat'].forEach(k =>
    chk(name, 'content', `${k} travelled intact`,
      P.ev(`JSON.stringify(S['${k}']||{})`), ev(`JSON.stringify(S['${k}']||{})`)));
  ['bands','rcn','baselines','snaps','ppbe','pmos'].forEach(k =>
    chk(name, 'content', `${k} travelled intact`,
      P.ev(`JSON.stringify(MS['${k}']||null)`), ev(`JSON.stringify(MS['${k}']||null)`)));
  // The three side databases are their own globals, packed separately by buildSavedHtml(). A copy
  // that dropped one is a copy whose execution read-outs, cost estimate or reprogramming tracker
  // are simply EMPTY -- which reads as a programme with nothing in it rather than as a broken file.
  ['EXDB','ACEDB','RPDB'].forEach(k =>
    chk(name, 'content', `${k} travelled intact`,
      P.ev(`JSON.stringify(${k}||null)`), ev(`JSON.stringify(${k}||null)`)));
  chk(name, 'content', 'and the reprogramming log is not merely present but populated',
    P.ev(`(RPDB.entries||[]).length`), 1);

  // AN INVARIANT, ASSERTED SO AN EQUIVALENCE CLAIM CANNOT ROT. applyState() rebuilds DATA.items
  // from BASE_ITEMS plus the S.custom objects THEMSELVES, so itemById() on a custom requirement
  // returns the store's own object -- which is why applyAskVec()'s `c.ask=` line is belt and braces
  // rather than the only writer, and why the mutation against it is equivalent. If this ever stops
  // holding, that line becomes load-bearing and this check fails first.
  chk(name, 'aliasing', 'itemById() on a custom requirement IS the stored object',
    ev(`itemById('NEW-1')===S.custom.filter(function(c){ return c.id==='NEW-1'; })[0]`), true);
}

{
  const name = 'handoff — back';
  const sc = handoffSc();
  // The office changes four things, including the value on the CUSTOM requirement.
  const { ev: pe } = (() => { const b = boot(); seed(b.ev, sc); handoffSeed(b.ev, sc); return b; })();
  const html = pe(String.raw`(function(){
    const mode={sandbox:true, by:'BLL', ts:Date.now(), fy:MS.cur, base:pmoBaseline()};
    return buildSavedHtml().replace(/(<script type="application\/json" id="pubMode">)[\s\S]*?(<\/script>)/,
      function(m,a,b){ return a + JSON.stringify(mode).replace(/</g,'\\u003c') + b; }); })()`);
  const P = boot({ html });
  const LONG = 'Depot line stops in March 26; forty aircraft unsupported. '.repeat(9);
  P.ev(`try{ localStorage.setItem('prio27who','PMO');
              localStorage.setItem('prio27pmo','PSM'); }catch(e){}
    S.cons['A']=${JSON.stringify(LONG)};
    [3100000,500000,250000,1000000,0,750000].forEach(function(v,i){ setAsk('B',i,String(v)); });
    [777000,0,0,0,0,0].forEach(function(v,i){ setAsk('NEW-1',i,String(v)); });
    S.ccar['C']='JSF4242'; save(); 'ok'`);
  const wire = JSON.parse(P.ev(`(function(){ var cap=null; var _B=window.Blob;
    window.Blob=function(parts,opts){ cap=parts&&parts[0]; return new _B(parts,opts); };
    try{ pmoSubmit(); }catch(e){} window.Blob=_B; return cap; })()`));
  chk(name, 'package', 'it carries the service list it was written against',
    (wire.svc || []).join(','), sc.services.join(','));
  chk(name, 'package', 'the custom requirement’s value is in it',
    JSON.stringify((wire.items || {})['NEW-1']), JSON.stringify({ asks: [777000,0,0,0,0,0] }));

  // PATH 1 — accept every proposed change on a fresh board.
  const X = boot(); seed(X.ev, sc); handoffSeed(X.ev, sc);
  X.ev(`window.alert=function(){}; window.confirm=function(){return true;};
    pmoTake(${JSON.stringify(wire)}, 's.json');
    PMOPICK={}; pmoRows().forEach(function(r){ PMOPICK[pickKey(r)]=true; }); pmoApply(); 'ok'`);
  // PATH 2 — type the same values here, by hand, the way the team would have.
  const Y = boot(); seed(Y.ev, sc); handoffSeed(Y.ev, sc);
  Y.ev(`S.cons['A']=${JSON.stringify(LONG)};
    [3100000,500000,250000,1000000,0,750000].forEach(function(v,i){ setAsk('B',i,String(v)); });
    [777000,0,0,0,0,0].forEach(function(v,i){ setAsk('NEW-1',i,String(v)); });
    S.ccar['C']='JSF4242'; applyState(S); save(); 'ok'`);

  // THE STANDARD. Not "the fields look right" -- the whole board, recomputed, identical.
  chk(name, 'equivalence', 'applying the submittal leaves the board exactly as typing would',
    fpOf(X.ev), fpOf(Y.ev));
  // A CUSTOM requirement keeps its value on its own object and applyState ignores S.asks for it.
  // Writing S.asks alone lost the change in silence while the review reported it applied.
  chk(name, 'custom', 'a custom requirement’s value actually moves',
    X.ev(`JSON.stringify(itemById('NEW-1').ask)`), JSON.stringify([777000,0,0,0,0,0]));
  chk(name, 'custom', 'and it is stored where a reload will find it',
    X.ev(`JSON.stringify(S.custom.filter(function(c){return c.id==='NEW-1';})[0].ask)`),
    JSON.stringify([777000,0,0,0,0,0]));
  chk(name, 'custom', 'with no stale S.asks entry applyState would ignore',
    X.ev(`(S.asks||{})['NEW-1']===undefined`), true);
  chk(name, 'fidelity', 'the impact statement is char-for-char',
    X.ev(`S.cons['A']`), LONG);
  chk(name, 'fidelity', 'the requirement value keeps every dollar',
    X.ev(`JSON.stringify(itemById('B').ask)`), JSON.stringify([3100000,500000,250000,1000000,0,750000]));
}

{
  const name = 'handoff — service alignment';
  const sc = handoffSc();
  // Same services, listed in a different order: remap by NAME, never by position.
  const R = boot(); seed(R.ev, sc); handoffSeed(R.ev, sc);
  R.ev(`window.alert=function(){}; window.confirm=function(){return true;};
    pmoTake({spmtPkg:1,dir:'submit',ap:'',fy:2027,ts:Date.now(),by:'PMO',fromTs:1,
      svc:['USN','USAF','ANG','AFRC','STOVL','USMC-C'],
      items:{A:{asks:[2500000,9500000,2000000,1000000,4000000,1500000]}},
      base:{A:{asks:[2500000,9000000,2000000,1000000,4000000,1500000]}}},'s.json');
    PMOPICK={}; pmoRows().forEach(function(r){ if(r.id==='A'&&r.key==='asks') PMOPICK[pickKey(r)]=true; });
    pmoApply(); 'ok'`);
  chk(name, 'reorder', 'each figure lands on the service it was written for',
    R.ev(`JSON.stringify(itemById('A').ask)`),
    JSON.stringify([9500000,2000000,1000000,4000000,1500000,2500000]));

  // A different SET of services cannot be placed at all. Guessing would be a misallocation that
  // every row total still reconciles -- the exact failure the state-import guard exists for.
  const W = boot(); seed(W.ev, sc); handoffSeed(W.ev, sc);
  const before = W.ev(`JSON.stringify(itemById('A').ask)`);
  W.ev(`window.__a=''; window.alert=function(m){ window.__a=m; };
    pmoTake({spmtPkg:1,dir:'submit',ap:'',fy:2027,ts:Date.now(),by:'PMO',fromTs:1,
      svc:['ARMY','USMC','USCG'], items:{A:{asks:[1,2,3]}}, base:{A:{asks:[0,0,0]}}},'s.json'); 'ok'`);
  chk(name, 'mismatch', 'a submittal for other services is refused',
    W.ev(`/different set of services/.test(window.__a)`) ? 'refused' : 'ACCEPTED', 'refused');
  chk(name, 'mismatch', 'nothing is held for review', W.ev('PMOSUBS.length===0'), true);
  chk(name, 'mismatch', 'and the board is untouched', W.ev(`JSON.stringify(itemById('A').ask)`), before);
}

{
  const name = 'handoff — the review controls';
  const sc = handoffSc();

  // ── THE PER-ROW TICK MUST ACTUALLY TICK ─────────────────────────────────────────────────────
  // "Nothing is applied until you tick it" is the whole promise of the review, and it is made by a
  // checkbox. `pmoPick` was renamed `subPick` in a collision rename and this call site was missed:
  // the box drew, the click raised a ReferenceError into a console nobody reads, and the reviewer's
  // only working control was "Tick all". Drive the RENDERED control, not the function behind it --
  // calling subPick() directly is exactly what missed this for a whole release.
  const T = boot(); seed(T.ev, sc); handoffSeed(T.ev, sc);
  T.ev(`window.alert=function(){}; window.confirm=function(){return true;};
    pmoTake({spmtPkg:1,dir:'submit',ap:'',fy:2027,ts:Date.now(),by:'PMO',fromTs:1,
      svc:SVC.slice(), items:{A:{cons:'Depot line stops.'}}, base:{A:{cons:null}}},'s.json');
    subOpenReview(); 'ok'`);
  chk(name, 'tick', 'the review renders a tick box for the proposed change',
    T.ev(`document.querySelectorAll('#subBody input[type=checkbox]').length`), 1);
  const ticked = T.ev(`(function(){
    var b=document.querySelector('#subBody input[type=checkbox]'); if(!b) return 'no box';
    b.checked=true; b.dispatchEvent(new Event('change'));
    return JSON.stringify(Object.keys(PMOPICK).filter(function(k){ return PMOPICK[k]; }));
  })()`);
  // The key carries the submittal it came from, so a tick can never mean two different things
  // once several are held side by side.
  chk(name, 'tick', 'clicking it records the pick', ticked, JSON.stringify(['0|A|cons']));
  T.ev(`pmoApply(); 'ok'`);
  chk(name, 'tick', 'and applying writes only what was ticked',
    T.ev(`S.cons['A']||''`), 'Depot line stops.');

  // ── A REQUIREMENT ADDED IN THE COPY IS NOT SENT, AND THE OFFICE IS TOLD ──────────────────────
  // The package carries FIELDS of requirements the portfolio board already has. One added after the
  // copy was published has no id there, so it could only ever arrive as a row nobody can tick --
  // while the office believed it had submitted it.
  const A = boot(); seed(A.ev, sc); handoffSeed(A.ev, sc);
  const ahtml = A.ev(String.raw`(function(){
    const mode={sandbox:true, by:'BLL', ts:Date.now(), fy:MS.cur, base:pmoBaseline()};
    return buildSavedHtml().replace(/(<script type="application\/json" id="pubMode">)[\s\S]*?(<\/script>)/,
      function(m,a,b){ return a + JSON.stringify(mode).replace(/</g,'\\u003c') + b; }); })()`);
  const PA = boot({ html: ahtml });
  PA.ev(`try{ localStorage.setItem('prio27who','PMO');
               localStorage.setItem('prio27pmo','PSM'); }catch(e){}
    S.custom.push({id:'PMO-NEW',grp:'PSM',sect:'new',custom:true,title:'Raised by the office',
      event:'e',ccar:'',fy26:SVC.map(function(){return 0;}),
      ask:[250000,0,0,0,0,0],alloc:null});
    S.order.push('PMO-NEW'); S.desc['A']='Rewritten by the office.'; applyState(S); save(); 'ok'`);
  const sent = JSON.parse(PA.ev(`(function(){ var cap=null, msg=''; var _B=window.Blob;
    window.alert=function(m){ msg+=m; };
    window.Blob=function(parts,opts){ cap=parts&&parts[0]; return new _B(parts,opts); };
    try{ pmoSubmit(); }catch(e){} window.Blob=_B;
    return JSON.stringify({pkg:cap, msg:msg}); })()`));
  const pkgA = JSON.parse(sent.pkg || '{}');
  chk(name, 'added', 'a requirement added in the copy is kept out of the package',
    (pkgA.items || {})['PMO-NEW'] === undefined, true);
  chk(name, 'added', 'and the office is told, by name',
    /Raised by the office/.test(sent.msg || '') ? 'named' : 'silent', 'named');
  chk(name, 'added', 'while everything else it edited still goes',
    ((pkgA.items || {})['A'] || {}).desc, 'Rewritten by the office.');

  // ── A PACKAGE WITH NO SERVICE LIST IS NOT READ SILENTLY ──────────────────────────────────────
  // Every submittal this board publishes carries one. A package without it is damaged or hand-made,
  // and its per-service figures would land by position against whatever this board's services are --
  // with every row total still reconciling.
  const N = boot(); seed(N.ev, sc); handoffSeed(N.ev, sc);
  const was = N.ev(`JSON.stringify(itemById('A').ask)`);
  N.ev(`window.__q=''; window.alert=function(){};
    window.confirm=function(m){ window.__q=m; return false; };
    pmoTake({spmtPkg:1,dir:'submit',ap:'',fy:2027,ts:Date.now(),by:'PMO',fromTs:1,
      items:{A:{asks:[1,2,3,4,5,6]}}, base:{A:{asks:[0,0,0,0,0,0]}}},'s.json'); 'ok'`);
  chk(name, 'no list', 'a listless submittal with per-service figures asks first',
    N.ev(`/does not say which services/.test(window.__q)`) ? 'asked' : 'read it anyway', 'asked');
  chk(name, 'no list', 'declining holds nothing for review', N.ev('PMOSUBS.length===0'), true);
  chk(name, 'no list', 'and leaves the board untouched', N.ev(`JSON.stringify(itemById('A').ask)`), was);
  // A listless package that proposes only PROSE has no positional hazard and must not nag. It is
  // scoped, so the only question it could raise is the service one -- which is the point.
  const Q = boot(); seed(Q.ev, sc); handoffSeed(Q.ev, sc);
  Q.ev(`window.__n=0; window.alert=function(){};
    window.confirm=function(){ window.__n++; return true; };
    pmoTake({spmtPkg:1,dir:'submit',ap:'',fy:2027,ts:Date.now(),by:'PMO',pmo:'PSM',fromTs:1,
      items:{A:{desc:'Prose only.'}}, base:{A:{desc:null}}},'s.json'); 'ok'`);
  chk(name, 'no list', 'but a prose-only one is not questioned', Q.ev('window.__n'), 0);
  chk(name, 'no list', 'and is held for review', Q.ev('PMOSUBS.length===1'), true);

  // ── A PACKAGE THAT NAMES NO OFFICE IS SAID OUT LOUD ──────────────────────────────────────────
  // Written before submittals carried a scope. Refusing would strand work already done, so it is
  // taken -- but it can reach ANY office's requirements, which makes it the one package that can
  // still collide with another, so it is never taken quietly.
  const U = boot(); seed(U.ev, sc); handoffSeed(U.ev, sc);
  U.ev(`window.__q=''; window.alert=function(){};
    window.confirm=function(m){ window.__q=String(m); return true; };
    pmoTake({spmtPkg:1,dir:'submit',ap:'',fy:2027,ts:Date.now(),by:'PMO',fromTs:1,
      svc:SVC.slice(), items:{A:{desc:'Prose only.'}}, base:{A:{desc:null}}},'s.json'); 'ok'`);
  chk(name, 'unscoped', 'a submittal naming no office asks before it is reviewed',
    U.ev(`/does not say which programme office/.test(window.__q)`) ? 'asked' : 'taken quietly', 'asked');
  chk(name, 'unscoped', 'and saying yes holds it', U.ev('PMOSUBS.length===1'), true);
  const V = boot(); seed(V.ev, sc); handoffSeed(V.ev, sc);
  V.ev(`window.alert=function(){}; window.confirm=function(){ return false; };
    pmoTake({spmtPkg:1,dir:'submit',ap:'',fy:2027,ts:Date.now(),by:'PMO',fromTs:1,
      svc:SVC.slice(), items:{A:{desc:'Prose only.'}}, base:{A:{desc:null}}},'s.json'); 'ok'`);
  chk(name, 'unscoped', 'saying no holds nothing', V.ev('PMOSUBS.length===0'), true);
}

{
  const name = 'handoff — the copy has its own storage';
  const sc = handoffSc();
  const { ev } = boot(); seed(ev, sc); handoffSeed(ev, sc);
  ev(`S.cons['A']='PORTFOLIO-V2 — what the copy should show.'; save(); 'ok'`);
  const pub = (ts) => ev(String.raw`(function(){
    const mode={sandbox:true, by:'BLL', ts:` + ts + String.raw`, fy:MS.cur, ap:APPN, base:pmoBaseline()};
    return buildSavedHtml().replace(/(<script type="application\/json" id="pubMode">)[\s\S]*?(<\/script>)/,
      function(m,a,b){ return a + JSON.stringify(mode).replace(/</g,'\\u003c') + b; }); })()`);
  const html = pub('1700000000000');

  // ── STALE STORAGE MUST NOT WIN ───────────────────────────────────────────────────────────────
  // Every copy used to share prio27om with the portfolio board and with every other copy, and the
  // boot restore takes browser storage over the file whenever storage's clock is later. Copies are
  // published days before they are distributed, so an office that had worked in ANY earlier copy
  // opened the new one and saw THAT board's numbers under this copy's banner -- silently, because
  // every total still reconciled -- and would then have submitted the old board's text back as new
  // input, against a baseline it never matched. This is the check that would have caught it.
  const { ev: oe } = boot(); seed(oe, sc); handoffSeed(oe, sc);
  oe(`S.cons['A']='STALE — from a copy they had before.'; MS.ts=Date.now()+86400000; 'ok'`);
  const stale = { [ev('_AP.key')]: oe('JSON.stringify(MS)') };
  const X = openWith(html, stale);
  chk(name, 'stale', 'the copy keeps a separate storage key',
    X.eval('_AP.key') === ev('_AP.key') ? 'SHARED' : 'its own', 'its own');
  chk(name, 'stale', 'and shows what was published, not what the browser had',
    X.eval(`(S.cons||{})['A']`), 'PORTFOLIO-V2 — what the copy should show.');
  chk(name, 'stale', 'so it proposes nothing nobody typed',
    X.eval('JSON.stringify(pmoSubmitBuild())'), '{}');

  // ── THEIR OWN WORK STILL SURVIVES A CLOSED TAB ───────────────────────────────────────────────
  // Isolating the key must not cost the office its afternoon: an impact statement is written over
  // days, not in one sitting, and the copy cannot save to a file.
  const d1 = openWith(html, {});
  d1.eval(`S.cons['A']='Written by the office on day one.'; save(); 'ok'`);
  const d2 = openWith(html, dumpLs(d1));
  chk(name, 'their work', 'reopening restores what they wrote',
    d2.eval(`(S.cons||{})['A']`), 'Written by the office on day one.');
  chk(name, 'their work', 'the published baseline is still the one they started from',
    d2.eval(`(PMODE.base['A']||{}).cons||''`), 'PORTFOLIO-V2 — what the copy should show.');
  chk(name, 'their work', 'and the submittal is exactly what they changed',
    d2.eval('JSON.stringify(pmoSubmitBuild())'),
    JSON.stringify({ A: { cons: 'Written by the office on day one.' } }));

  // Two copies of the same board cannot reach each other's storage either.
  const other = openWith(pub('1800000000000'), dumpLs(d1));
  chk(name, 'their work', 'a different copy does not inherit it',
    other.eval(`(S.cons||{})['A']`), 'PORTFOLIO-V2 — what the copy should show.');
  // ── THE COPY OPENS AS THE BOARD IT WAS PUBLISHED FROM ────────────────────────────────────────
  // The appropriation was read from the reader's OWN browser (prio27appn) before the file had any
  // say, so a copy opened on a machine where somebody had once looked at another drill came up as
  // that appropriation -- an empty board under a full banner, with no error anywhere.
  const drift = openWith(html, Object.assign({ prio27appn: 'OPN' }, {}));
  chk(name, 'appropriation', 'a copy opens as the board it was published from',
    drift.eval('APPN'), ev('APPN'));
  chk(name, 'appropriation', 'with the requirements it was published with',
    drift.eval('S.order.length'), ev('S.order.length'));
  chk(name, 'appropriation', 'and switching inside a copy is refused rather than reloading empty',
    drift.eval(`(function(){ var hit=false; window.alert=function(){ hit=true; };
      try{ switchAppn('opn'); }catch(e){} return hit? 'refused' : 'ALLOWED'; })()`), 'refused');

  // ...and neither does the portfolio board sitting on the same machine.
  const pb = openWith(ev('SRC0'), dumpLs(d1));
  chk(name, 'their work', 'the portfolio board keeps its own key', pb.eval('_AP.key'), ev('_AP.key'));
  chk(name, 'their work', 'and is not a sandbox', String(pb.eval('SANDBOX')), 'false');
}

// ══ anything that leaves a PMO copy says so ════════════════════════════════════════════════════
// The amber banner is on SCREEN. A workbook mailed on from a copy carried none of it: an 11-sheet
// export off a November copy was indistinguishable from one off the live board this morning -- same
// filename, same title row -- so a superseded cutline could be briefed onward under this board's own
// name. Read the artefact the office would actually circulate, with the board's own reader.
{
  const name = 'handoff — an export from a copy says it is one';
  const sc = base();
  const { ev } = boot(); seed(ev, sc); asBooted(ev, sc);
  const html = ev(String.raw`(function(){
    const mode={sandbox:true, by:'BLL', ts:1763078400000, fy:MS.cur, ap:APPN, base:pmoBaseline()};
    return buildSavedHtml().replace(/(<script type="application\/json" id="pubMode">)[\s\S]*?(<\/script>)/,
      function(m,a,b){ return a + JSON.stringify(mode).replace(/</g,'\\u003c') + b; }); })()`);

  // Drive the real export and read what comes out -- the name the file lands under and the title
  // row a reader sees first. Recomputing what the mark "should" say would test the restatement.
  const shot = (w) => w.eval(`(async function(){
    var cap=null,_B=window.Blob,name='';
    window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
    var _c=document.createElement.bind(document);
    document.createElement=function(t){ var e=_c(t);
      if(t==='a') Object.defineProperty(e,'download',{set:function(v){ name=v; },get:function(){ return name; }});
      return e; };
    try{ exportExcel(); }catch(e){ return JSON.stringify({err:String((e&&e.message)||e)}); }
    window.Blob=_B; document.createElement=_c;
    var ab=cap.buffer.slice(cap.byteOffset, cap.byteOffset+cap.byteLength);
    var sh=await xlsxRead(ab); var f=Object.keys(sh)[0];
    return JSON.stringify({name:name, title:String((sh[f][0]||[])[0]||''), sheets:Object.keys(sh).length});
  })()`);

  const L = boot(); seed(L.ev, sc); asBooted(L.ev, sc);
  const live = JSON.parse(await shot(L.w));
  const copy = JSON.parse(await shot(boot({ html }).w));

  chk(name, 'live', 'the live board exports the whole workbook', live.sheets > 1 ? 'full' : 'thin', 'full');
  chk(name, 'live', 'and is NOT marked as a copy',
    /PMO COPY/.test(live.name + live.title) ? 'MARKED' : 'clean', 'clean');

  chk(name, 'copy', 'a copy exports the same workbook', copy.sheets, live.sheets);
  // The filename is what a person sees in Teams and in the mail that forwards it.
  chk(name, 'copy', 'its filename says it came from a copy',
    /\[PMO COPY /.test(copy.name) ? 'marked' : 'bare', 'marked');
  chk(name, 'copy', 'and carries the date it was published',
    /\[PMO COPY 2025-11-14\]/.test(copy.name) ? 'dated' : 'undated', 'dated');
  chk(name, 'copy', 'the extension survives the mark',
    /\.xlsx$/.test(copy.name) ? 'xlsx' : copy.name.slice(-12), 'xlsx');
  // The title row is what a person sees on opening it, and on the printout.
  chk(name, 'copy', 'the title row says it is a snapshot',
    /PMO COPY \(snapshot of 2025-11-14, NOT the current plan\)/.test(copy.title) ? 'said' : 'silent', 'said');
  // THE CAVEAT COMES FIRST. Callers append their own sheet name after the title, so a mark tacked
  // on the end lands mid-line and reads like part of that sheet's name.
  chk(name, 'copy', 'and leads with it rather than burying it',
    copy.title.indexOf('PMO COPY') < 4 ? 'leads' : 'buried at ' + copy.title.indexOf('PMO COPY'), 'leads');
  chk(name, 'copy', 'the board and sheet are still named after it',
    /Prioritization Board/.test(copy.title) && copy.title.length > 60 ? 'named' : 'lost', 'named');

  // A file that already says what it is must not say it twice.
  chk(name, 'no double mark', 'a submittal built in a copy is not re-marked',
    boot({ html }).ev(`expName('SPMT SUBMITTAL - J Smith - 2026-09-13.json')`),
    'SPMT SUBMITTAL - J Smith - 2026-09-13.json');
}

// ══ what is reviewed is what would land ════════════════════════════════════════════════════════
// The review, the spreadsheet and pmoApply() all read the same package, but only pmoApply() put a
// requirement value through the board's rule for one. A package is a JSON file -- a hand edit or a
// damaged transfer is all it takes -- and one carrying a negative and a NaN was REPORTED as
// "USAF $-5,000,000 · AFRC $NaN" and APPLIED as zeroes. The team would have signed off a
// spreadsheet that did not describe the board it produced.
{
  const name = 'handoff — the review cannot promise what applying will not do';
  const sc = base();
  const seedOne = () => { const b = boot(); seed(b.ev, sc); asBooted(b.ev, sc);
    b.ev(`window.__a=''; window.alert=function(m){ window.__a=m; };
          window.confirm=function(){ return true; }; 'ok'`); return b; };

  const { ev } = seedOne();
  ev(`pmoTake({spmtPkg:1,dir:'submit',ap:'',fy:2027,ts:Date.now(),by:'PMO',fromTs:1,
    svc:SVC.slice(), items:{A:{asks:[-5000000, 2000000, 'abc'], ccar:{x:1}}},
    base:{A:{asks:[9000000,2000000,1000000]}}},'s.json'); 'ok'`);
  const shown = ev(`pmoFmtVal('asks', pmoRows().filter(function(r){ return r.key==='asks'; })[0].prop)`);
  chk(name, 'values', 'the review shows the value the board would store',
    shown, 'USAF $0 · ANG $2,000,000 · AFRC $0');
  chk(name, 'values', 'and nothing that is not a number',
    /NaN|-\$/.test(shown) ? 'promised a number it cannot store' : 'clean', 'clean');
  chk(name, 'values', 'a record number arriving as an object is shown as text, not as a shape',
    typeof ev(`pmoRows().filter(function(r){ return r.key==='ccar'; })[0].prop`), 'string');
  ev(`PMOPICK={}; pmoRows().forEach(function(r){ if(r.id==='A'&&r.key==='asks') PMOPICK[pickKey(r)]=true; });
    pmoApply(); 'ok'`);
  chk(name, 'values', 'and applying lands exactly that',
    ev(`JSON.stringify(itemById('A').ask)`), JSON.stringify([0, 2000000, 0]));

  // A vector of the wrong WIDTH is not a value to tidy up -- padding it zeroes a service in silence,
  // which is the positional hazard again wearing a different hat.
  const W = seedOne();
  const before = W.ev(`JSON.stringify(itemById('A').ask)`);
  W.ev(`pmoTake({spmtPkg:1,dir:'submit',ap:'',fy:2027,ts:Date.now(),by:'PMO',fromTs:1,
    svc:SVC.slice(), items:{A:{asks:[1,2]}}, base:{A:{asks:[9000000,2000000,1000000]}}},'s.json'); 'ok'`);
  chk(name, 'width', 'a value with the wrong number of services is refused',
    W.ev(`/wrong number of services/.test(window.__a)`) ? 'refused' : 'ACCEPTED', 'refused');
  chk(name, 'width', 'nothing is held for review', W.ev('PMOSUBS.length===0'), true);
  chk(name, 'width', 'and the board is untouched', W.ev(`JSON.stringify(itemById('A').ask)`), before);
}

// ══ the change report is the record the team argues from ═══════════════════════════════════════
// "A pre-audit change report ... so that my team and I fully understand and know what updates have
// been made." A byte count proves it downloaded, not that it says anything true. Read it back with
// the board's OWN workbook reader and compare every cell against the review it claims to describe.
{
  const name = 'handoff — the change report';
  const sc = base();
  sc.items.push(it('B', 'ATL', [3000000, 500000, 250000]));
  sc.order.push('B');
  const { ev, w } = boot(); seed(ev, sc); asBooted(ev, sc);
  ev(`S.cons['A']='Our own earlier wording.'; save(); 'ok'`);
  // Three live rows and one for a requirement this board no longer has, one of them ticked, one of
  // them a conflict -- every state the Status and Conflict columns are supposed to tell apart.
  ev(`window.alert=function(){}; window.confirm=function(){return true;};
    pmoTake({spmtPkg:1,dir:'submit',ap:'',fy:2027,ts:Date.now(),by:'PMO Lead',fromTs:1,
      svc:SVC.slice(),
      items:{A:{cons:'Theirs: the depot line stops in March.', asks:[9500000,2000000,1000000]},
             B:{ccar:'JSF7777'}, ZZ:{desc:'from a requirement since removed'}},
      base:{A:{cons:null, asks:[9000000,2000000,1000000]}, B:{ccar:null}, ZZ:{desc:null}}},'s.json');
    PMOPICK={}; pmoRows().forEach(function(r){ if(r.id==='A'&&r.key==='cons') PMOPICK[pickKey(r)]=true; });
    'ok'`);
  const want = JSON.parse(ev(`JSON.stringify(pmoRows().map(function(r){ return [
    (PMO_LBL[r.key]||r.key), String(pmoFmtVal(r.key,r.now)), String(pmoFmtVal(r.key,r.prop)),
    (r.conflict? 'YES — this board changed too':''),
    (r.gone? 'requirement missing' : (PMOPICK[pickKey(r)]? 'ticked to apply':'not applied')),
    r.from + (r.by && r.by!==r.from? ' ('+r.by+')' : '')]; }))`));
  const before = ev(`JSON.stringify({cons:S.cons, asks:S.asks, ccar:S.ccar, desc:S.desc})`);
  const book = JSON.parse(await w.eval(`(async function(){
    var cap=null, _B=window.Blob;
    window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
    try{ pmoReport(); }catch(e){ return JSON.stringify({err:String((e&&e.message)||e)}); }
    window.Blob=_B;
    if(!cap) return JSON.stringify({err:'no workbook bytes'});
    var ab=cap.buffer.slice(cap.byteOffset, cap.byteOffset+cap.byteLength);
    var sh=await xlsxRead(ab);
    return JSON.stringify({sheets:Object.keys(sh), rows:sh[Object.keys(sh)[0]]}); })()`));
  chk(name, 'reads back', 'the report is a workbook this board can read',
    book.err ? 'THREW: ' + book.err : 'read', 'read');
  const rows = book.rows || [];
  chk(name, 'reads back', 'on one named sheet', (book.sheets || []).join(','), 'Proposed changes');
  chk(name, 'says so', 'the title says nothing has been applied',
    /NOTHING BELOW HAS BEEN APPLIED/.test(String(rows[0] && rows[0][0])) ? 'said' : 'silent', 'said');
  chk(name, 'says so', 'and names who sent it',
    /SUBMITTAL FROM PMO Lead/.test(String(rows[0] && rows[0][0])) ? 'named' : 'anonymous', 'named');
  chk(name, 'columns', 'the header is the one the team reads',
    (rows[3] || []).join('|'),
    'Submitted by|Rank|PMO|Requirement|CCaR|Field|On the board now|Proposed|Conflict|Status|Decision / notes');
  // BY NAME, NOT BY POSITION. These read fixed indices until a column was inserted in the middle of
  // the report, and then every one of them failed for the same uninformative reason. A cell is
  // found the way a reader finds it -- under its heading.
  const HDR = (rows[3] || []).map(String);
  const col = h => HDR.indexOf(h);
  ['Submitted by','Rank','PMO','Requirement','CCaR','Field','On the board now','Proposed',
   'Conflict','Status','Decision / notes'].forEach(h =>
    chk(name, 'columns', `it has a "${h}" column`, col(h) >= 0, true));
  // ONE ROW PER PROPOSED CHANGE, in the review's own order. A report that drops or reorders a row
  // is worse than none: the team signs off a list that is not the list.
  const body = rows.slice(4).filter(r => r.length > 1);
  chk(name, 'rows', 'one row per proposed change', body.length, want.length);
  want.forEach((exp, i) => {
    const got = body[i] || [];
    chk(name, 'rows', `row ${i + 1}: the field it is about`, got[col('Field')], exp[0]);
    chk(name, 'rows', `row ${i + 1}: what the board says now`, got[col('On the board now')], exp[1]);
    chk(name, 'rows', `row ${i + 1}: what the office proposes`, got[col('Proposed')], exp[2]);
    chk(name, 'rows', `row ${i + 1}: the conflict column`, got[col('Conflict')] || '', exp[3]);
    chk(name, 'rows', `row ${i + 1}: the status column`, got[col('Status')], exp[4]);
    // WHO SENT IT is the column that makes several submittals reviewable as one list.
    chk(name, 'rows', `row ${i + 1}: who it came from`, got[col('Submitted by')], exp[5]);
  });
  chk(name, 'rows', 'the requirement this board no longer has is labelled',
    /no longer on this board/.test(String((body[body.length - 1] || [])[col('Requirement')]))
      ? 'labelled' : 'unmarked', 'labelled');
  // Left blank on purpose: it is the reviewer's column, and the report is the record they keep.
  chk(name, 'rows', 'the decision column arrives empty for them to fill in',
    body.every(r => String(r[col('Decision / notes')] || '') === '') ? 'empty' : 'pre-filled', 'empty');
  // PRE-audit. A report that changed anything on the way out would be describing a board that no
  // longer exists by the time it is read.
  chk(name, 'pre-audit', 'exporting it applies nothing',
    ev(`JSON.stringify({cons:S.cons, asks:S.asks, ccar:S.ccar, desc:S.desc})`), before);

  // An impact statement runs to thousands of characters. The on-screen review clips at 300 to keep
  // the table readable; the SPREADSHEET is the copy of record and must carry the whole thing.
  const LONG = 'The depot line stops in March 26 and forty aircraft go unsupported. '.repeat(40);
  const L = boot(); seed(L.ev, sc); asBooted(L.ev, sc);
  L.ev(`window.alert=function(){}; window.confirm=function(){return true;};
    pmoTake({spmtPkg:1,dir:'submit',ap:'',fy:2027,ts:Date.now(),by:'PMO',fromTs:1,
      svc:SVC.slice(), items:{A:{cons:${JSON.stringify(LONG)}}}, base:{A:{cons:null}}},'s.json'); 'ok'`);
  const cell = await L.w.eval(`(async function(){
    var cap=null,_B=window.Blob;
    window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
    try{ pmoReport(); }catch(e){ return 'THREW'; } window.Blob=_B;
    var ab=cap.buffer.slice(cap.byteOffset, cap.byteOffset+cap.byteLength);
    var sh=await xlsxRead(ab), rr=sh[Object.keys(sh)[0]];
    var c=(rr[3]||[]).map(String).indexOf('Proposed');
    return String(rr[4][c]||''); })()`);
  chk(name, 'fidelity', 'a long impact statement reaches the spreadsheet whole', cell.length, LONG.length);
  chk(name, 'fidelity', 'char for char', cell === LONG ? 'exact' : 'altered', 'exact');
}

// ══ appropriation packages: the OTHER path that takes numbers this board did not compute ═══════
// applyStore() is where the service-alignment guard lives, and pkgApply() calls it ONLY for the
// appropriation you are currently viewing. A package for any other one was written straight into
// that appropriation's storage key and its PUBS slot -- the same positional hazard the guard exists
// for, through a door it never watched. Nothing covered pkgApply at all.
{
  const name = 'appropriation package — services';
  const OTHER = 'ff';                                  // a different appropriation on the same board
  const THEIRS = ['USAF', 'ANG', 'AFRC'];              // the services THAT appropriation holds
  // THE BOARD ON SCREEN CARRIES DIFFERENT SERVICES. That is the point of the distinction: two
  // appropriations may legitimately hold different lists, so a package must be checked against the
  // one it is FOR. With both lists the same, checking the wrong one looks identical and the
  // mutation that does so survives -- which is exactly what happened the first time round.
  const ONSCREEN = ['STOVL', 'USMC-C', 'USN'];
  const myBoard = () => ({ services: ONSCREEN,
    items: [it('A', 'PSM', [9000000, 2000000, 1000000])],
    disc: [9000000, 2000000, 1000000], mand: [0, 0, 0], order: ['A'] });

  // A store as the OTHER appropriation already has it, sitting in its own storage key.
  const seedOther = (ev, services) => ev(`(function(){
    const st={base:2027, cur:2027, ts:1,
      dataPack:{services:${JSON.stringify(services)}, items:[{id:'X',grp:'PSM',ask:[1,1,1]}]},
      years:{2027:{order:['X'], alloc:{}, mc:{}, fsrc:{}, custom:[], removed:[],
        discSvc:[100,200,300], mandSvc:[0,0,0], asks:{X:[100,200,300]}}}};
    localStorage.setItem(_SLUGMAP['${OTHER}'].key, JSON.stringify(st));
    return 'ok'; })()`);

  // A package for that appropriation, written against a DIFFERENT ORDER of the same services.
  const pkgFor = (services, vec) => ({
    spmtPkg: 1, ap: OTHER, dir: 'issue', seq: 1, by: 'Manager', ts: Date.now(),
    ms: { base: 2027, cur: 2027, ts: 2,
      dataPack: { services, items: [{ id: 'X', grp: 'PSM', ask: vec }] },
      years: { 2027: { order: ['X'], alloc: {}, mc: {}, fsrc: {}, custom: [], removed: [],
        discSvc: vec.slice(), mandSvc: [0, 0, 0], asks: { X: vec.slice() } } } } });

  const readOther = (ev) => JSON.parse(ev(`(function(){
    const st=JSON.parse(localStorage.getItem(_SLUGMAP['${OTHER}'].key)||'null');
    if(!st) return JSON.stringify(null);
    const y=st.years&&st.years[2027];
    return JSON.stringify({svc:(st.dataPack||{}).services||null,
                           disc:(y||{}).discSvc||null, ask:((y||{}).asks||{}).X||null}); })()`));

  // ── a REORDER must be matched up by name, not taken at face value ────────────────────────────
  {
    const sc = myBoard();
    const { ev } = boot(); seed(ev, sc); asBooted(ev, sc);
    chk(name, 'fixture', 'this board is a consolidated one', ev('pkgIsCons()'), true);
    chk(name, 'fixture', 'and carries different services from the one the package is for',
      ev('SVC.join(",")'), ONSCREEN.join(','));
    chk(name, 'fixture', 'and is NOT the appropriation the package is for',
      ev(`mySlug()!=='${OTHER}'`), true);
    seedOther(ev, THEIRS);
    const mine = ev(`JSON.stringify(itemById('A').ask)`);
    // Their list reordered; the figures are in THAT order, so 7 belongs to AFRC and 9 to USAF.
    const pkg = pkgFor(['AFRC', 'USAF', 'ANG'], [7, 9, 8]);
    ev(`window.alert=function(){}; window.confirm=function(){return true;};
        pkgApply(${JSON.stringify(pkg)}, 'pkg.json'); 'ok'`);
    const got = readOther(ev);
    chk(name, 'reorder', 'the package was taken', got ? 'taken' : 'refused', 'taken');
    chk(name, 'reorder', 'its figures land on the services they were written for',
      JSON.stringify((got || {}).disc), JSON.stringify([9, 8, 7]));
    chk(name, 'reorder', 'the requirement value is remapped too',
      JSON.stringify((got || {}).ask), JSON.stringify([9, 8, 7]));
    // The stored state carries its own service list, and that is what names the services when this
    // appropriation is next opened. Left in the sender's order it would undo the remap on reload.
    chk(name, 'reorder', 'and the state it stores says which order it is now in',
      JSON.stringify((got || {}).svc), JSON.stringify(THEIRS));
    chk(name, 'reorder', 'the appropriation on screen is untouched',
      ev(`JSON.stringify(itemById('A').ask)`), mine);
  }

  // ── a DIFFERENT SET of services cannot be placed, and nothing may be written ─────────────────
  {
    const sc = myBoard();
    const { ev } = boot(); seed(ev, sc); asBooted(ev, sc);
    seedOther(ev, THEIRS);
    const before = JSON.stringify(readOther(ev));
    const mine = ev(`JSON.stringify(itemById('A').ask)`);
    const pkg = pkgFor(['ARMY', 'USMC', 'USCG'], [1, 2, 3]);
    const said = ev(`(function(){ var m=''; window.alert=function(x){ m+=x; };
      window.confirm=function(){ return true; };
      pkgApply(${JSON.stringify(pkg)}, 'pkg.json'); return m; })()`);
    chk(name, 'mismatch', 'a package for other services is refused',
      /different set of services/.test(said) ? 'refused' : 'ACCEPTED: ' + said.slice(0, 70), 'refused');
    chk(name, 'mismatch', 'and that appropriation is left exactly as it was',
      JSON.stringify(readOther(ev)), before);
    chk(name, 'mismatch', 'the appropriation on screen is untouched too',
      ev(`JSON.stringify(itemById('A').ask)`), mine);
    chk(name, 'mismatch', 'and nothing was put in its publish slot',
      ev(`(function(){ try{ return (typeof PUBS!=='undefined' && PUBS && PUBS['${OTHER}'])? 'written' : 'empty'; }
                       catch(e){ return 'empty'; } })()`), 'empty');
  }

  // ── the same services in the same order: silent, and it lands ────────────────────────────────
  {
    const sc = myBoard();
    const { ev } = boot(); seed(ev, sc); asBooted(ev, sc);
    seedOther(ev, THEIRS);
    const pkg = pkgFor(THEIRS.slice(), [11, 22, 33]);
    const said = ev(`(function(){ var m=''; window.alert=function(x){ m+=x; };
      window.confirm=function(){ return true; };
      pkgApply(${JSON.stringify(pkg)}, 'pkg.json'); return m; })()`);
    chk(name, 'match', 'a package that matches is not questioned',
      /different set of services|DIFFERENT ORDER/.test(said) ? 'questioned' : 'silent', 'silent');
    chk(name, 'match', 'and its figures land unchanged',
      JSON.stringify((readOther(ev) || {}).disc), JSON.stringify([11, 22, 33]));
  }
}

// ══ the change journal is the safety net, and nothing tested it ════════════════════════════════
// pmoApply()'s confirmation says, in as many words: "Each one is recorded in the change journal, so
// it can be found and undone later." That sentence is the recourse when a programme office's
// proposal is accepted in error, and it was covered by nothing at all.
{
  const name = 'the change journal';
  const sc = base();
  sc.items.push(it('B', 'ATL', [3000000, 500000, 250000]));
  sc.order.push('B');

  // ── A HAND EDIT IS RECORDED, AND PUTTING IT BACK RESTORES EXACTLY WHAT WAS THERE ─────────────
  {
    const { ev } = boot(); seed(ev, sc); asBooted(ev, sc);
    ev(`try{ localStorage.setItem('prio27who','BLL'); }catch(e){}
        S.desc['A']='What the board said first.'; save(); 'ok'`);
    const before = ev(`JSON.stringify({desc:S.desc, ccar:S.ccar, asks:S.asks})`);
    const n0 = +ev('(MS.jrnl||[]).length');
    // jrnlSync() re-takes the shadow WITHOUT writing entries; jrnlCapture() is what diffs the
    // shadow against now and records. Calling sync twice records nothing at all -- which the first
    // version of this check did, and then read somebody else's entry as its own.
    ev(`jrnlSync(); S.desc['A']='Rewritten.'; jrnlCapture(); save(); 'ok'`);
    chk(name, 'record', 'the change is journalled', +ev('(MS.jrnl||[]).length') > n0 ? 'recorded' : 'silent', 'recorded');
    const e = JSON.parse(ev(`JSON.stringify((MS.jrnl||[])[(MS.jrnl||[]).length-1])`));
    chk(name, 'record', 'with the path it changed', JSON.stringify(e.p), JSON.stringify(['desc', 'A']));
    chk(name, 'record', 'the value before', e.a, 'What the board said first.');
    chk(name, 'record', 'and the value after', e.b, 'Rewritten.');
    chk(name, 'record', 'and it is marked as something that can be put back',
      ev(`jrnlUndoable((MS.jrnl||[])[(MS.jrnl||[]).length-1])`), true);

    const idx = +ev('(MS.jrnl||[]).length') - 1;
    ev(`window.confirm=function(){return true;}; jrnlUndo(${idx}); 'ok'`);
    chk(name, 'undo', 'undoing restores exactly what was there',
      ev(`JSON.stringify({desc:S.desc, ccar:S.ccar, asks:S.asks})`), before);
    // BOTH ENTRIES MUST STAND. Capturing the revert as an ordinary diff folded it into the original
    // entry and then dropped that entry as a no-op, which erased the very change being reverted.
    chk(name, 'undo', 'and the reversal is itself journalled',
      +ev('(MS.jrnl||[]).length') > idx + 1 ? 'recorded' : 'lost', 'recorded');
    chk(name, 'undo', 'the change it reversed still stands',
      ev(`JSON.stringify(((MS.jrnl||[])[${idx}]||{}).p)`), JSON.stringify(['desc', 'A']));
    chk(name, 'undo', 'and the reversal is marked as one',
      ev(`!!((MS.jrnl||[])[${idx + 1}]||{}).f`), true);
  }

  // ── A VALUE TOO LARGE TO RECORD IS NOT UNDOABLE, AND SAYS SO ─────────────────────────────────
  // JRNL_BIG caps a journalled value at 300 characters and stores a SIZE in its place. An impact
  // statement runs well past that. Restoring one from the journal would put back a placeholder --
  // silent data loss on the one field the whole PMO workflow exists to collect -- so the entry must
  // refuse to be undone rather than half-succeed.
  {
    const { ev } = boot(); seed(ev, sc); asBooted(ev, sc);
    const LONG = 'The depot line stops in March and forty aircraft go unsupported. '.repeat(9);
    chk(name, 'big values', 'the fixture is genuinely past the cap', LONG.length > 300, true);
    ev(`try{ localStorage.setItem('prio27who','BLL'); }catch(e){}
        jrnlSync(); S.cons['A']=${JSON.stringify(LONG)}; jrnlCapture(); save(); 'ok'`);
    const last = +ev('(MS.jrnl||[]).length') - 1;
    chk(name, 'big values', 'it is journalled as a size, not as the text',
      ev(`typeof ((MS.jrnl||[])[${last}]||{}).b === 'object'`), true);
    chk(name, 'big values', 'and the entry refuses to be undone',
      ev(`jrnlUndoable((MS.jrnl||[])[${last}])`), false);
    const held = ev(`S.cons['A']`);
    const said = ev(`(function(){ var m=''; setStat=function(x){ m+=x; };
      window.confirm=function(){ return true; }; jrnlUndo(${last}); return m; })()`);
    chk(name, 'big values', 'it says why rather than putting back a placeholder',
      /cannot be put back/.test(said) ? 'said' : 'silent: ' + said.slice(0, 60), 'said');
    chk(name, 'big values', 'and the statement is still there, whole',
      ev(`S.cons['A']`), held);
  }

  // ── THE PROMISE pmoApply MAKES: an accepted proposal can be found and undone ─────────────────
  {
    const { ev } = boot(); seed(ev, sc); asBooted(ev, sc);
    ev(`try{ localStorage.setItem('prio27who','BLL'); }catch(e){}
        S.ccar['B']='CC-ORIGINAL'; save(); 'ok'`);
    const before = ev(`JSON.stringify({ccar:S.ccar, asks:S.asks})`);
    ev(`window.alert=function(){}; window.confirm=function(){return true;};
        pmoTake({spmtPkg:1,dir:'submit',ap:'',fy:2027,ts:Date.now(),by:'PMO',fromTs:1,
          svc:SVC.slice(), items:{B:{ccar:'CC-FROM-PMO'}}, base:{B:{ccar:'CC-ORIGINAL'}}},'s.json');
        PMOPICK={}; pmoRows().forEach(function(r){ if(r.id==='B'&&r.key==='ccar') PMOPICK[pickKey(r)]=true; });
        pmoApply(); 'ok'`);
    chk(name, 'a PMO change', 'it applied', ev(`S.ccar['B']`), 'CC-FROM-PMO');
    const idx = +ev(`(function(){ const j=MS.jrnl||[];
      for(let i=j.length-1;i>=0;i--){ const e=j[i];
        if(e&&Array.isArray(e.p)&&e.p[0]==='ccar'&&e.p[1]==='B') return i; } return -1; })()`);
    chk(name, 'a PMO change', 'and it is in the journal, by path', idx >= 0 ? 'found' : 'NOT FOUND', 'found');
    if (idx >= 0) {
      chk(name, 'a PMO change', 'it can be put back', ev(`jrnlUndoable((MS.jrnl||[])[${idx}])`), true);
      ev(`window.confirm=function(){return true;}; jrnlUndo(${idx}); 'ok'`);
      chk(name, 'a PMO change', 'and undoing it leaves the board as it was',
        ev(`JSON.stringify({ccar:S.ccar, asks:S.asks})`), before);
    }
  }
}

// ══ A SUBMITTAL CARRIES ONE OFFICE'S REQUIREMENTS, AND SEVERAL ARE REVIEWED TOGETHER ══════════
// One office at a time meant a pass and a spreadsheet per office, with no view of the round. Several
// can be held side by side only because each is SCOPED: an office may propose changes to the
// requirements it OWNS (grpOf) and to nothing else, so two packages can never contest one field.
// That is the property the whole feature rests on, so it is checked from both ends -- the copy must
// refuse to SEND another office's row, and the board must refuse to REVIEW one that arrives anyway.
{
  const name = 'scoped submittals';
  const sc = { services: MINE,
    items: [it('A', 'AV', [900, 200, 100]), it('B', 'AV', [400, 100, 50]),
            it('C', 'PSM', [300, 80, 40]),  it('D', 'MxS', [200, 50, 25])],
    disc: [2000, 600, 300], mand: [500, 150, 80], order: ['A', 'B', 'C', 'D'] };
  const { ev } = boot(); seed(ev, sc); asBooted(ev, sc);

  const html = ev(String.raw`(function(){
    const mode={sandbox:true, by:'BLL', ts:Date.now(), fy:MS.cur, base:pmoBaseline()};
    return buildSavedHtml().replace(/(<script type="application\/json" id="pubMode">)[\s\S]*?(<\/script>)/,
      function(m,a,b){ return a + JSON.stringify(mode).replace(/</g,'\\u003c') + b; }); })()`);

  // One office works in the copy and submits. The copy is re-seeded because a published file
  // carries the board's baked DATA, not this fixture's items.
  const submitAs = (pmo, who, edits) => {
    const P = boot({ html });
    seed(P.ev, sc); asBooted(P.ev, sc);
    P.ev(`PMODE.base=pmoBaseline();
          try{ localStorage.setItem('prio27who','${who}'); localStorage.setItem('prio27pmo','${pmo}'); }catch(e){}
          ${edits}; 'ok'`);
    return JSON.parse(P.ev(`(function(){
      let cap=null; const _B=window.Blob;
      window.Blob=function(pt,o){ if(!cap && o && o.type==='application/json') cap=String(pt[0]); return new _B(pt,o); };
      globalThis.__al=[]; const _a=window.alert; window.alert=function(m){ globalThis.__al.push(String(m)); };
      try{ pmoSubmit(); }catch(e){} window.Blob=_B; window.alert=_a;
      return JSON.stringify({pkg: cap? JSON.parse(cap) : null, alerts: globalThis.__al});
    })()`));
  };

  // ── FROM THE COPY: another office's row never leaves ──────────────────────────────────────
  const av = submitAs('AV', 'J. Smith',
    `setDesc('A','AV on its own row'); setDesc('C','AV on a PSM row'); setAsk('B',0,'450')`);
  chk(name, 'submit', 'the package is built', av.pkg ? 'built' : 'nothing', 'built');
  if (av.pkg) {
    chk(name, 'submit', 'it names the office it is from', av.pkg.pmo, 'AV');
    chk(name, 'submit', 'it carries that office’s requirements',
      Object.keys(av.pkg.items).sort().join(','), 'A,B');
    chk(name, 'submit', 'and not another office’s, however hard they were edited',
      Object.keys(av.pkg.items).indexOf('C') >= 0 ? 'C went too' : 'C stayed behind', 'C stayed behind');
    // SILENTLY DROPPING IT IS THE WORSE BUG: the office would believe it had submitted something.
    const told = av.alerts.filter(a => /another programme office/.test(a))[0] || '';
    chk(name, 'submit', 'the office is told, while it is still sitting there', told ? 'told' : 'silent', 'told');
    chk(name, 'submit', 'and the message names the row it dropped', /PSM/.test(told), true);
  }
  const psm = submitAs('PSM', 'R. Jones', `setDesc('C','PSM on its own row'); setCons('C','slips a year')`);
  chk(name, 'submit', 'a second office scopes to its own rows too',
    psm.pkg ? psm.pkg.pmo + ':' + Object.keys(psm.pkg.items).join(',') : 'nothing', 'PSM:C');

  // ── AT THE BOARD: both are held at once, each row tagged with where it came from ──────────
  ev(`window.alert=function(){};
      pmoTake(${JSON.stringify(av.pkg)}, 'av.json');
      pmoTake(${JSON.stringify(psm.pkg)}, 'psm.json'); 'ok'`);
  const held = JSON.parse(ev(`(function(){
    return JSON.stringify({ n:PMOSUBS.length, from:PMOSUBS.map(subFrom),
      rows:pmoRows().map(function(r){ return r.from+'|'+r.id+'|'+r.key; }) }); })()`));
  chk(name, 'review', 'both submittals are held at once', held.n, 2);
  chk(name, 'review', 'each by its office', held.from.join(','), 'AV,PSM');
  chk(name, 'review', 'every proposed field is on the list',
    held.rows.slice().sort().join(' '), 'AV|A|desc AV|B|asks PSM|C|cons PSM|C|desc');
  chk(name, 'review', 'and no field is offered twice',
    held.rows.length, held.rows.map(r => r.split('|').slice(1).join('|'))
      .filter((v, i, a) => a.indexOf(v) === i).length);

  // ── A SECOND ROUND FROM ONE OFFICE REPLACES THE FIRST ─────────────────────────────────────
  // Two rounds from one office held side by side would offer the same field twice with different
  // answers, which is exactly the arbitration the scope exists to avoid.
  ev(`window.alert=function(){}; pmoTake(${JSON.stringify(av.pkg)}, 'av-again.json'); 'ok'`);
  chk(name, 'review', 'a second package from the same office replaces the first',
    Number(ev('PMOSUBS.length')), 2);

  // ── OUT-OF-SCOPE ROWS ARE REFUSED AT THE DOOR TOO ─────────────────────────────────────────
  // The copy drops them, but the package is a JSON file: a hand edit or an older build is all it
  // takes. The board does not trust the sender to have done it.
  const forged = JSON.parse(JSON.stringify(av.pkg));
  forged.items['C'] = { desc: 'AV reaching into PSM by hand' };
  ev(`window.alert=function(){}; PMOSUBS=[]; PMOPICK={};
      pmoTake(${JSON.stringify(forged)}, 'forged.json'); 'ok'`);
  const kept = JSON.parse(ev('JSON.stringify(Object.keys((PMOSUBS[0]||{}).items||{}).sort())'));
  chk(name, 'review', 'a row the sending office does not own is dropped on import',
    kept.join(','), 'A,B');

  // ── APPLYING ACROSS BOTH, IN ONE PASS ─────────────────────────────────────────────────────
  ev(`window.alert=function(){}; window.confirm=function(){ return true; };
      PMOSUBS=[]; PMOPICK={};
      pmoTake(${JSON.stringify(av.pkg)}, 'av.json');
      pmoTake(${JSON.stringify(psm.pkg)}, 'psm.json');
      subPickAll(true); pmoApply(); 'ok'`);
  const after = JSON.parse(ev(`(function(){ return JSON.stringify({
    descA:(S.desc||{}).A||'', descC:(S.desc||{}).C||'', consC:(S.cons||{}).C||'',
    askB:(S.asks||{}).B||null, left:pmoRows().length, stillHeld:PMOSUBS.length }); })()`));
  chk(name, 'apply', 'the first office’s change lands', after.descA, 'AV on its own row');
  chk(name, 'apply', 'the second office’s change lands', after.descC, 'PSM on its own row');
  chk(name, 'apply', 'and its impact statement too', after.consC, 'slips a year');
  chk(name, 'apply', 'a requirement value lands through the board’s own rule',
    Array.isArray(after.askB) ? after.askB[0] : 'not a vector', 450);
  // WHAT WAS APPLIED DROPS OFF; WHAT WAS NOT STAYS. Clearing the packages on apply would throw
  // away every untaken proposal the moment the first batch went in.
  chk(name, 'apply', 'nothing is left proposing what the board now says', after.left, 0);
  chk(name, 'apply', 'and the packages are still held rather than discarded', after.stillHeld, 2);
}

console.log('\n' + '='.repeat(96));
if (!failures.length) { console.log('ALL CHECKS PASSED'); process.exit(0); }
const by = {};
failures.forEach(f => { const k = f.scenario + ' | ' + f.where; (by[k] ||= []).push(f); });
console.log(`${failures.length} FAILING CHECK(S)\n`);
for (const [k, fs] of Object.entries(by)) {
  console.log(`--- ${k}`);
  fs.forEach(f => {
    const g = String(f.got), w = String(f.want);
    if (g.length < 160 && w.length < 160) { console.log(`    ${f.what}\n        got ${g}   want ${w}`); return; }
    // Two multi-kilobyte stores tell you nothing side by side. Point at the first difference.
    let i = 0; while (i < g.length && i < w.length && g[i] === w[i]) i++;
    const cut = Math.max(0, i - 60);
    console.log(`    ${f.what}\n        first differs at char ${i} of ${g.length}/${w.length}`
      + `\n          got  \u2026${g.slice(cut, i + 90)}\u2026`
      + `\n          want \u2026${w.slice(cut, i + 90)}\u2026`);
  });
}
process.exit(1);
