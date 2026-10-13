// probe/regtext.mjs <copyRoot> : REGTEXT investigation on a copy (synthetic data built at run time; the board file is read as is).
// The RCN / EEIC list's text (rcn, eeic, t), through typing (rcnSet), a file opened, Import a full board; and where it leaves:
// the screen (the hostile sweep), the workbook's bytes (exportExcel, exportSrc), the saved file. Plus the destination list's
// names (flowSetEnt) and a requirement title, as controls for what is registry-specific.
// Every expectation printed beside an observation is a hand-written literal.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
const root = resolve(process.argv[2]);
const only = process.argv[3] || '';
delete process.env.BOARD;
await import(pathToFileURL(root + '/runtime-encoding-shim.mjs').href);
const { boot, seed, BOARD } = await import(pathToFileURL(root + '/tools/export-audit/boot.mjs').href);
const { buildHostile, hostileSweep, P } = await import(pathToFileURL(root + '/tools/export-audit/hostile.mjs').href);
console.log('BOARD', BOARD);
const J = JSON.stringify;
const out = (k, v) => console.log(k.padEnd(44) + ' ' + (typeof v === 'string' ? v : J(v)));
const it = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: 'Req ' + id, event: 'Ev ' + id, ccar: 'CC' + id, fy26: ask.map(() => 0), ask, alloc: null });
const SC = { services: ['USAF', 'ANG', 'AFRC'], items: [it('R1', 'AV', [900, 200, 0]), it('R2', 'AV', [300, 0, 0])], disc: [5000, 5000, 5000], mand: [0, 0, 0], order: ['R1', 'R2'] };
const mk = (rcn, asg, extra = '') => {
  const X = boot();
  seed(X.ev, SC);
  X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    S.awards={R1:{mode:'single', d:FYMON[2][0], day:3}, R2:{mode:'single', d:FYMON[2][0], day:3}};
    MS.rcn=${J(rcn)}; S.rcnAsg=${J(asg)}; ${extra} applyState(S); save(); 'ok'`);
  return X;
};
// THE WORKBOOK'S BYTES: the board stores its zip uncompressed (_zipStore), so each part is read straight from the bytes,
// decoded as UTF-8, and asked: any <f> (a formula), any character XML 1.0 forbids, any U+FFFD (a lone surrogate the encoder
// replaced). The board's own reader then gives the cells.
const book = (W, fn) => W.eval(`(async function(){
  var cap=null,_B=window.Blob,msg='';
  window.alert=function(m){ msg+=String(m); }; window.confirm=function(){ return true; };
  window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
  try{ ${fn}(); }catch(e){ window.Blob=_B; return JSON.stringify({__err:'threw '+String((e&&e.message)||e)}); }
  window.Blob=_B;
  if(!cap) return JSON.stringify({__err:'no file: '+msg.slice(0,80)});
  var u=cap instanceof Uint8Array? cap : new Uint8Array(cap.buffer||cap), parts=[], i=0, dec=new TextDecoder('utf-8');
  while(i+30<=u.length && u[i]===0x50 && u[i+1]===0x4b && u[i+2]===0x03 && u[i+3]===0x04){
    var meth=u[i+8]|(u[i+9]<<8), csz=(u[i+18]|(u[i+19]<<8)|(u[i+20]<<16)|(u[i+21]<<24))>>>0, nl=u[i+26]|(u[i+27]<<8), xl=u[i+28]|(u[i+29]<<8);
    var name=dec.decode(u.subarray(i+30,i+30+nl)), body=u.subarray(i+30+nl+xl, i+30+nl+xl+csz);
    var t=meth===0? dec.decode(body) : '';
    parts.push({name:name, meth:meth, f:(t.match(/<f[ >]/g)||[]).length, bad:(t.match(/[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\uFFFE\\uFFFF]/g)||[]).map(function(c){ return c.charCodeAt(0).toString(16); }),
      fffd:(t.match(/\\uFFFD/g)||[]).length});
    i+=30+nl+xl+csz; }
  var ab=u.buffer.slice(u.byteOffset,u.byteOffset+u.byteLength), rd;
  try{ rd=await xlsxRead(ab); }catch(e){ rd={__readErr:String((e&&e.message)||e)}; }
  return JSON.stringify({parts:parts, sheets:rd}); })()`);
// every cell, in every sheet, holding one of the given strings (exactly, or within)
const cellsWith = (sheets, needles) => { const r = [];
  for (const [sn, rows] of Object.entries(sheets || {})) { if (!Array.isArray(rows)) continue;
    rows.forEach((row, ri) => (row || []).forEach((c, ci) => { const s = String(c ?? ''); needles.forEach(n => { if (n && s.indexOf(n) >= 0) r.push([sn, ri, ci, s.length > 120 ? s.slice(0, 120) + '…(' + s.length + ')' : s]); }); })); }
  return r; };
const xlsxSummary = async (W, fn, needles) => { const b = JSON.parse(await book(W, fn)); if (b.__err) return { err: b.__err };
  const badParts = b.parts.filter(p => p.f || p.bad.length || p.fffd || p.meth !== 0).map(p => [p.name, 'f' + p.f, 'bad' + p.bad.join('/'), 'fffd' + p.fffd, 'meth' + p.meth]);
  return { nparts: b.parts.length, badParts, readErr: (b.sheets && b.sheets.__readErr) || '', cells: cellsWith(b.sheets, needles) }; };

const K = (k, rcn, eeic, t) => ({ k, rcn, eeic, t, svc: ['USAF', 'ANG', 'AFRC'] });

// ---------------- 1. TYPING (rcnSet) ----------------
if (!only || only === 'type') {
  console.log('\n=== 1. typing into the RCN / EEIC list (rcnSet), one entry K1 11111 / AAAAA "base"');
  const cases = [
    ['t 80 x (control)', 't', 'x'.repeat(80)],
    ['t 81 A', 't', 'A'.repeat(81)],
    ['t 79 a + U+1F600 (81 units)', 't', 'a'.repeat(79) + '\u{1F600}'],
    ['t 200 B', 't', 'B'.repeat(200)],
    ['t with U+000B (Word soft break)', 't', 'line1\u000Bline2'],
    ['t =HYPERLINK', 't', '=HYPERLINK("http://example.invalid","x")'],
    ['rcn 10 digits (control)', 'rcn', '1234567890'],
    ['rcn 11 digits', 'rcn', '12345678901'],
    ['rcn with U+0001', 'rcn', '123\u000145'],
    ['eeic ß x10 (R2 control)', 'eeic', 'ß'.repeat(10)],
    ['eeic " abcde " (control)', 'eeic', ' abcde '],
  ];
  for (const [nm, f, v] of cases) {
    const X = mk([K('K1', '11111', 'AAAAA', 'base')], { R1: 'K1' });
    const r = JSON.parse(X.ev(`(function(){ var el=document.createElement('input'); el.value=${J(v)}; setStat('');
      rcnSet(0, ${J(f)}, ${J(v)}, el);
      var e=rcnReg()[0], s=e[${J(f)}];
      return JSON.stringify({len:String(s).length, tail:String(s).slice(-3).split('').map(function(c){ return c.charCodeAt(0).toString(16); }).join(' '),
        same:s===${J(v)}, stat:(document.getElementById('shareStat')||{}).textContent||'', marked:el.getAttribute('aria-invalid')||''}); })()`));
    out('typed ' + nm + ' (' + v.length + ' units)', r);
    X.w.close();
  }
}

// ---------------- 2. A FILE: opened, and imported whole ----------------
const FILE_LIST = [
  K('K1', '11111', 'aaaaa', 'lower-case EEIC'),
  K('K2', '22222', 'ß'.repeat(10), 'eszett EEIC'),
  K('K3', '33333', 'ABCDEFGHIJKLMNOPQRST', 'EEIC of 20'),
  K('K4', ' 44444 ', ' DDDDD ', '  padded  '),
  K('K5', '55555', 'EEEEE', 'T'.repeat(300)),
  K('K6', '66666', 'FFFFF', '=1+1'),
  K('K7', '+77777', '@SUM1', '-cmd|x'),
  K('K8', '88888', 'HHHHH', 'bad\u0001char\u000Bvt'),
  K('K9', '99999', 'IIIII', 'a'.repeat(79) + '\uD83D'),
];
const ASG = { R1: 'K8', R2: 'K5' };
if (!only || only === 'file') {
  console.log('\n=== 2. a file whose RCN / EEIC list holds the entries below; R1 on K8 (control characters), R2 on K5 (300-char title)');
  FILE_LIST.forEach(e => out('  in the file ' + e.k, { rcn: e.rcn, eeic: e.eeic, tlen: e.t.length, t: e.t.slice(0, 30) }));
  const F = mk(FILE_LIST, ASG);
  const file = F.ev('buildSavedHtml()');
  const own = boot(); seed(own.ev, SC); own.ev(`save(); 'ok'`); const ownHtml = own.ev('buildSavedHtml()');
  const needles = ['aaaaa', 'ß'.repeat(10), 'ABCDEFGHIJKLMNOPQRST', '44444', 'DDDDD', 'TTTTTTTTTT', '=1+1', '+77777', '@SUM1', '-cmd|x', 'bad', 'aaaaaaaaaa'];
  const read = async (W, ev, tag) => {
    out(tag + ' list', JSON.parse(ev(`JSON.stringify(rcnReg().map(function(e){ return [e.k, e.rcn, e.eeic, String(e.t).length]; }))`)));
    out(tag + ' codeIssues (list)', JSON.parse(ev(`JSON.stringify(codeIssues().filter(function(c){ return !c.id; }).map(function(c){ return c.label.slice(0,90); }))`)));
    out(tag + ' exportExcel', await xlsxSummary(W, 'exportExcel', needles));
    out(tag + ' exportSrc', await xlsxSummary(W, 'exportSrc', needles));
  };
  out('door (inboundCheck) on the file', F.ev(`inboundCheck(${J(file)})`) || '(passes)');
  const O = boot({ html: file });
  await read(O.w, O.ev, 'opened');
  const O2 = boot({ html: O.ev('buildSavedHtml()') });
  await read(O2.w, O2.ev, 'opened, saved, reopened');
  const T = boot({ html: ownHtml });
  const r = JSON.parse(T.ev(`(function(){ window.confirm=function(){ return true; }; var al=[]; window.alert=function(m){ al.push(String(m)); };
    var ret, threw=''; try{ ret=fullImportText(${J(file)}, 'regtext.html'); }catch(e){ threw=String((e&&e.message)||e); }
    return JSON.stringify({ret:ret, threw:threw, alerts:al.map(function(a){ return a.slice(0,160); })}); })()`));
  out('Import a full board', r);
  const ls = JSON.parse(T.ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })()`));
  const R = boot({ html: ownHtml, ls });
  await read(R.w, R.ev, 'imported, reopened');
  [F, own, O, O2, T, R].forEach(b => { try { b.w.close(); } catch {} });
}

// ---------------- 3. CONTROLS: the same characters in a requirement title and a destination name ----------------
if (!only || only === 'ctl') {
  console.log('\n=== 3. controls: is the workbook problem the registry\'s alone?');
  const X = mk([K('K1', '11111', 'AAAAA', 'plain')], { R1: 'K1' }, `S.titles={R1:'Title\\u000Bwith VT'};`);
  out('requirement title with U+000B, exportExcel', await xlsxSummary(X.w, 'exportExcel', ['Title']));
  const Y = mk([K('K1', '11111', 'AAAAA', 'plain')], { R1: 'K1' });
  out('ordinary list, exportExcel (control)', await xlsxSummary(Y.w, 'exportExcel', ['11111']));
  out('ordinary list, exportSrc (control)', await xlsxSummary(Y.w, 'exportSrc', ['11111', 'AAAAA']));
  // destination names: typed, then a second typed with the same name in another case
  const D = JSON.parse(Y.ev(`(function(){ flowAddEnt(); var i=flowEnts().length-1; flowSetEnt(i,'n','  Alpha  Depot '); flowAddEnt(); var j=flowEnts().length-1; flowSetEnt(j,'n','ALPHA DEPOT');
    flowAddEnt(); var k=flowEnts().length-1; flowSetEnt(k,'n','N'.repeat(5000));
    return JSON.stringify({a:flowEnts()[i].n, b:flowEnts()[j].n, same:destName(flowEnts()[i].n)===destName(flowEnts()[j].n), long:flowEnts()[k].n.length}); })()`));
  out('destination names typed', D);
  [X, Y].forEach(b => { try { b.w.close(); } catch {} });
}

// ---------------- 4. THE SCREEN: the hostile sweep with the list's text planted ----------------
if (!only || only === 'sweep') {
  console.log('\n=== 4. the hostile sweep, with hostile text in the RCN / EEIC list (rcn, eeic, t)');
  const H0 = buildHostile(readFileSync(BOARD, 'utf8'));
  const B = H0.board;
  B.ev(`(function(){ var P=function(t){ return ${J(P('@@'))}.split('@@').join(t); };
    MS.rcn=[{k:'K1', rcn:P('regrcn'), eeic:P('regeeic'), t:P('regt'), svc:['USAF','ANG','AFRC']}];
    S.rcnAsg={}; S.order.forEach(function(id){ S.rcnAsg[id]='K1'; });
    applyState(S); save(); return 'ok'; })()`);
  const saved = B.ev('buildSavedHtml()');
  const H = boot({ html: saved });
  const reg = H.ev(`JSON.stringify(rcnReg().map(function(e){ return [e.k, String(e.rcn).slice(0,6), String(e.t).slice(0,4)]; }))`);
  out('the list as opened', reg);
  const r = await hostileSweep(code => H.ev(code));
  out('sweep reach', { ids: r.ids, panels: r.panels, menus: r.menus });
  out('planted registry tags seen as text', ['regrcn', 'regeeic', 'regt'].filter(t => r.shown.has(t)));
  out('handlers carrying a planted call', [...r.found.values()].slice(0, 8));
  // the RCN / EEIC panel itself, opened directly
  H.ev(`(function(){ try{ rcnOpen=true; render(); }catch(e){} return 'ok'; })()`);
  out('rcnBody: img elements / regt as value', JSON.parse(H.ev(`JSON.stringify({img:document.querySelectorAll('#rcnBody img').length,
    inputs:[].slice.call(document.querySelectorAll('#rcnBody input')).map(function(e){ return (e.value||'').slice(0,8); }).filter(function(v){ return /^reg/.test(v); })})`)));
  out('workbook bytes (exportExcel)', await xlsxSummary(H.w, 'exportExcel', ['regrcn', 'regeeic', 'regt']));
  [B, H].forEach(b => { try { b.w.close(); } catch {} });
}

// ---------------- 5. MORE: two entries with the same text; markup and formula text with money; an SI code from a file ----------------
if (!only || only === 'more') {
  console.log('\n=== 5. more');
  const X = mk([K('K1', '11111', 'AAAAA', 'same'), K('K2', '11111', 'AAAAA', 'same')], { R1: 'K1', R2: 'K2' });
  const a = await xlsxSummary(X.w, 'exportExcel', ['11111 / AAAAA']);
  out('same text, two keys: RCN-EEIC by Month rows', a.cells.filter(c => c[0] === 'RCN-EEIC by Month').slice(0, 6));
  out('same text, two keys: the sheet rows with money', JSON.parse(await X.w.eval(`(async function(){ var cap=null,_B=window.Blob; window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
    exportExcel(); window.Blob=_B; var u=cap; var rd=await xlsxRead(u.buffer.slice(u.byteOffset,u.byteOffset+u.byteLength)); var rc=rd['RCN-EEIC by Month']||[];
    return JSON.stringify(rc.slice(0,12).map(function(r){ return [String(r[0]||'').slice(0,40), r[3], r[14]]; })); })()`)));
  const Y = mk([K('K1', '11111', 'AAAAA', '<b>&amp; =1+1')], { R1: 'K1' });
  out('markup + formula title with money', await xlsxSummary(Y.w, 'exportExcel', ['<b>&amp; =1+1']));
  const Z = mk([K('K1', '11111', 'AAAAA', 'x')], { R1: 'K1' }, `S.si={R1:'la', R2:'LA '};`);
  const file = Z.ev('buildSavedHtml()');
  out('SI codes in the file', JSON.parse(Z.ev(`JSON.stringify(MS.years[MS.cur].si||null)`)));
  const O = boot({ html: file });
  out('SI codes once the file is opened', JSON.parse(O.ev(`JSON.stringify({si:S.si||null, R1:siOf(itemById('R1')), R2:siOf(itemById('R2')), door:inboundCheck(${J(file)})})`)));
  [X, Y, Z, O].forEach(b => { try { b.w.close(); } catch {} });
}
