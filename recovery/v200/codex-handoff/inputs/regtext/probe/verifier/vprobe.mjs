// vprobe.mjs <copyRoot> [variantBoard] : the verifier's adversarial probe of the REGTEXT change (LENS A: data loss, money,
// true words). Synthetic data only, built at run time. Every expectation printed is a hand-written literal; board helpers are
// used only to observe.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const root = resolve(process.argv[2]);
if (process.argv[3]) process.env.BOARD = resolve(process.argv[3]); else delete process.env.BOARD;
await import(pathToFileURL(root + '/runtime-encoding-shim.mjs').href);
const { boot, seed, BOARD } = await import(pathToFileURL(root + '/tools/export-audit/boot.mjs').href);
console.log('BOARD', BOARD);
const J = JSON.stringify;
const out = (k, v, want) => console.log(k.padEnd(52) + ' got ' + (typeof v === 'string' ? v : J(v)) + (want !== undefined ? '   want ' + J(want) + (J(v) === J(want) ? '  OK' : '  DIFFERS') : ''));
const it = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: 'Req ' + id, event: 'Ev ' + id, ccar: 'CC' + id, fy26: ask.map(() => 0), ask, alloc: null });
const SC = { services: ['USAF', 'ANG', 'AFRC'], items: [it('R1', 'AV', [900, 200, 0])], disc: [5000, 5000, 5000], mand: [0, 0, 0], order: ['R1'] };
const K = (k, rcn, eeic, t) => ({ k, rcn, eeic, t, svc: ['USAF', 'ANG', 'AFRC'] });
const mk = (rcn) => {
  const X = boot();
  seed(X.ev, SC);
  X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    S.awards={R1:{mode:'single', d:FYMON[2][0], day:3}}; MS.rcn=${J(rcn)}; S.rcnAsg={R1:'K1'}; applyState(S); save(); 'ok'`);
  return X;
};
const stat = X => X.ev(`document.getElementById('shareStat').textContent`);
const A100 = 'L'.repeat(100);

// 1. A TITLE THAT ARRIVED IN A FILE AT 100 CHARACTERS, opened, then edited in the panel's own title field by appending "!"
{
  const X0 = mk([K('K1', '11111', 'AAAAA', A100)]);
  const R = boot({ html: X0.ev('buildSavedHtml()') });
  out('1a file title kept on open (length)', R.ev(`String(rcnReg()[0].t.length)`), '100');
  const r = JSON.parse(R.ev(`JSON.stringify((function(){ setStat(''); rcnOpen=true; render();
    var el=document.querySelector('#rcnBody input[placeholder="what this line funds"]'); if(!el) return 'no field';
    var shown=el.value.length; el.value=el.value+'!'; el.dispatchEvent(new Event('change'));
    return [shown, rcnReg()[0].t.length, el.isConnected, el.getAttribute('aria-invalid')]; })())`));
  out('1b append "!" to it in the panel: [shown, kept len, field on screen, marked]', r);
  out('1c the status after', stat(R));
  const R2 = boot({ html: R.ev('buildSavedHtml()') });
  out('1d saved and reopened: the title length', R2.ev(`String(rcnReg()[0].t.length)`), '100');
  // edit the RCN of the same row: the title is untouched
  const r3 = JSON.parse(R.ev(`JSON.stringify((function(){ rcnOpen=true; render(); var el=document.querySelector('#rcnBody input[placeholder="12345"]');
    el.value='22222'; el.dispatchEvent(new Event('change')); return [rcnReg()[0].rcn, rcnReg()[0].t.length]; })())`));
  out('1e then the RCN typed 22222: [rcn, title len]', r3, ['22222', 100]);
}

// 2. REFUSED, THEN THE PANEL IS REDRAWN BY THE NEXT ACTION (Add a combination; a service box; another row's code)
for (const [nm, act] of [['rcnAdd()', 'rcnAdd()'], ['rcnToggleSvc(0,"AFRC")', 'rcnToggleSvc(0,"AFRC")'],
                         ['row 2 RCN typed', 'rcnSet(1,"rcn","33333")']]) {
  const X = mk([K('K1', '11111', 'AAAAA', 'base'), K('K2', '22222', 'BBBBB', 'two')]);
  const r = JSON.parse(X.ev(`JSON.stringify((function(){ setStat(''); rcnOpen=true; render();
    var el=document.querySelector('#rcnBody input[placeholder="what this line funds"]');
    el.value=${J('Z'.repeat(81))}; el.dispatchEvent(new Event('change'));
    var s1=document.getElementById('shareStat').textContent.slice(0,40);
    ${act};
    var el2=document.querySelector('#rcnBody input[placeholder="what this line funds"]');
    return [s1, rcnReg()[0].t, el.isConnected, el2? el2.value : null, document.getElementById('shareStat').textContent.slice(0,40)]; })())`));
  out('2 refused, then ' + nm + ': [status1, kept, old field on screen, field now, status now]', r);
}

// 3. WHAT THE COUNT SAYS for text a person sees as fewer characters
{
  const X = mk([K('K1', '11111', 'AAAAA', 'base')]);
  const fam = '\u{1F468}‍\u{1F469}‍\u{1F467}';      // one glyph, five code points
  const nfd = 'é';                                         // é as e + combining acute: one glyph, two code points
  for (const [nm, t] of [['20 family emoji (20 glyphs)', fam.repeat(20)], ['41 NFD é (41 glyphs)', nfd.repeat(41)],
                         ['80 NFD é (80 glyphs)', nfd.repeat(80)], ['80 NFC é (80 glyphs)', 'é'.repeat(80)]]) {
    const r = JSON.parse(X.ev(`JSON.stringify((function(){ MS.rcn[0].t='base'; setStat(''); var el=document.createElement('input');
      rcnSet(0,'t',${J(t)},el); return [MS.rcn[0].t===${J(t)}? 'kept' : (MS.rcn[0].t==='base'? 'refused' : 'CUT to '+MS.rcn[0].t.length), document.getElementById('shareStat').textContent.replace(/“[^”]*”/,'“…”')]; })())`));
    out('3 ' + nm, r);
  }
}

// 4. A LOCKED VIEW: a title typed while a locked cycle is on screen
{
  const X = mk([K('K1', '11111', 'AAAAA', 'base')]);
  const r = JSON.parse(X.ev(`JSON.stringify((function(){ window.confirm=function(){ return true; }; blCyc='PB'; blYr=MS.cur; cycLock();
    var ks=Object.keys(CYCDB.cycles||{}); if(!ks.length) return 'no cycle'; cycView(ks[0]);
    var el=document.createElement('input'); setStat(''); rcnSet(0,'t',${J('W'.repeat(81))},el);
    var a=[rcnReg()[0].t, el.getAttribute('aria-invalid'), document.getElementById('shareStat').textContent.replace(/“[^”]*”/,'“…”').slice(0,140)];
    cycLeave(true); return a.concat([rcnReg()[0].t]); })())`));
  out('4 locked view, 81 typed: [view title, marked, status, working title after leaving]', r);
}

// 5. MONEY AND THE WORKBOOK across a refusal: RCN-EEIC by Month after one accepted and one refused title, from the bytes
{
  const X = mk([K('K1', '11111', 'AAAAA', 'base')]);
  const book = await X.w.eval(`(async function(){ var cap=null,_B=window.Blob; window.alert=function(){}; window.confirm=function(){ return true; };
    window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
    var el=document.createElement('input'); rcnSet(0,'t','Ok title',el); rcnSet(0,'t',${J('Q'.repeat(81))},el);
    try{ exportExcel(); }finally{ window.Blob=_B; }
    if(!cap) return JSON.stringify({err:'no file'});
    var u=cap instanceof Uint8Array? cap : new Uint8Array(cap.buffer||cap);
    var rd=await xlsxRead(u.buffer.slice(u.byteOffset,u.byteOffset+u.byteLength));
    var rc=rd['RCN-EEIC by Month']||[]; return JSON.stringify(rc.filter(function(r){ return r && /^11111/.test(String(r[0]||'')); }).map(function(r){ return [r[0], r[14]]; })); })()`);
  out('5 RCN-EEIC by Month rows for K1 [label, col 14]', JSON.parse(book), [['11111 / AAAAA  Ok title', 900], ['11111 / AAAAA  Ok title', 200]]);
}
console.log('done');
