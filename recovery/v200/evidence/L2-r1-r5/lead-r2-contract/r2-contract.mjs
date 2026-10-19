// Lead's independent R2 cross-check (not one of the received probes): rcnSet with a real DOM field, the contract's two
// refusals and three controls, with literal expected values. Status text read from the board's own status line.
const T = process.argv[2];
await import(T + '/runtime-encoding-shim.mjs');
const { boot, bootRelease } = await import(T + '/tools/export-audit/boot.mjs');
const X = boot(); const { w, ev } = X;
const cases = [
  ['ß×10 (upper-cases to 20)', 'ß'.repeat(10), { eeic: 'AAAAA', marked: true, said: true }],
  ['ﬃ×4 (upper-cases to 12)', 'ﬃ'.repeat(4), { eeic: 'AAAAA', marked: true, said: true }],
  ['control " ab12c "', ' ab12c ', { eeic: 'AB12C', marked: false, said: false }],
  ['control ABCDEFGHIJ (10)', 'ABCDEFGHIJ', { eeic: 'ABCDEFGHIJ', marked: false, said: false }],
  ['control SSSSSSSSSS (10 when upper-cased)', 'ssssssssss', { eeic: 'SSSSSSSSSS', marked: false, said: false }],
];
let bad = 0;
for (const [name, typed, want] of cases) {
  ev(`MS.rcn=[{k:'K1',rcn:'11111',eeic:'AAAAA',t:'',svc:['USAF','ANG']}]; setStat(''); 'ok'`);
  const el = w.document.createElement('input'); el.id = 'xc-eeic'; w.document.body.appendChild(el); el.value = typed;
  ev(`rcnSet(0,'eeic',document.getElementById('xc-eeic').value,document.getElementById('xc-eeic')); 'ok'`);
  const stat = ev(`(document.getElementById('stat')||document.getElementById('shareStat')||{}).textContent||''`);
  const got = { eeic: ev(`rcnReg()[0].eeic`), marked: el.getAttribute('aria-invalid') === 'true', said: /EEIC not changed/.test(stat) };
  const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}${got.said ? ' | ' + stat.slice(0, 160) : ''}`);
  el.remove();
}
console.log(`script errors ${JSON.stringify(X.errors)}`); if (X.errors.length) bad++;
console.log(bad ? `${bad} FAILING` : 'ALL OK'); bootRelease(0); process.exit(bad ? 1 : 0);
