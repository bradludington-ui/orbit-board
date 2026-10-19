// FOCUSED HARNESS: audit-recon preamble helpers, the blocks v1.98 item 83 | v1.99 item 88 | v2.00 (U10): a refused edit | v2.00 (U10, beside the codes) | v2.00 (U10, the shared lists) | v2.00 (U10, the spend plan's choices) | v2.00 (U10, the files, packages, ladder and shared copies) and the guard, VERBATIM from /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/224f878/before/tools/export-audit/audit-recon.mjs
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
const headerRow = (rows, ...must) => rows.findIndex(r =>
  must.every(m => (r || []).some(c => String(c ?? '').trim().toLowerCase() === m.toLowerCase())));
const colOf = (rows, hdr, name) => (rows[hdr] || [])
  .findIndex(c => String(c ?? '').trim().toLowerCase() === name.toLowerCase());
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
// ==== v1.98 item 83: RCN/EEIC by service on a prime's CLINs; every RCN/EEIC surface reads one rule ====
// THE ORACLE IS THIS TABLE, typed from the fixture's own numbers. A prime P with two CLINs and a different amount on every
// service of every CLIN; a requirement R with its own ANG combination; Q with none. Which combination each dollar is on
// (Brad, 5 Oct 2026: the CLIN wins): the CLIN's choice for the service, then the CLIN's standard, then the requirement's
// choice for the service, then the requirement's own.
//   P: requirement K4, its ANG K2.  CLIN 0001: standard K1, AFRC K3.  CLIN 0002: nothing of its own.
//      CLIN 0001: USAF 401 K1 · ANG 251 K1 (the CLIN wins over P's ANG K2) · AFRC 31 K3 · USN 41 (Navy: no RCN/EEIC)
//      CLIN 0002: USAF 299 K4 (P's own) · AFRC 59 K4
//   R: K1, its ANG K2 -- USAF 503 K1 · ANG 127 K2.   Q: nothing -- USAF 71 on no combination.
// FAILS ON v1.97: the RCN-EEIC by Month summary filed P's money under P's own (USAF 700 K4, ANG 251 K2, AFRC 90 K4); the
// Spend Plan Source put CLIN 0001's AFRC on K1; the ACE breakout printed one code per line (K1 beside ANG's and AFRC's
// money on CLIN 0001, K1 beside R's ANG) and the mapping counted P's combinations as 2 and R's as 1.
const v198K = { K1: ['11111', 'AAAAA'], K2: ['22222', 'BBBBB'], K3: ['33333', 'CCCCC'], K4: ['44444', 'DDDDD'] };
const v198Lab = k => v198K[k][0] + ' / ' + v198K[k][1];
const v198NONE = '— no RCN/EEIC assigned —';
const v198Board = (state) => {
  const X = boot();
  seed(X.ev, { services: ['USAF', 'ANG', 'AFRC', 'USN'], items: [it('PRIME_P', 'AV', [700, 251, 90, 41]), it('R', 'AV', [503, 127, 0, 0]), it('Q', 'AV', [71, 0, 0, 0])],
    disc: [5000, 5000, 5000, 5000], mand: [0, 0, 0, 0], order: ['PRIME_P', 'R', 'Q'] });
  X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    S.ptype={PRIME_P:'PRIME'};
    S.clinNew={PRIME_P:[{key:'n1',clin:'0001',desc:'air vehicle',ccar:'',ask:[401,251,31,41]},{key:'n2',clin:'0002',desc:'engines',ccar:'',ask:[299,0,59,0]}]};
    S.clinAlloc={PRIME_P:{n1:[401,251,31,41], n2:[299,0,59,0]}};
    MS.rcn=${JSON.stringify(Object.keys(v198K).map(k => ({ k, rcn: v198K[k][0], eeic: v198K[k][1], t: '', svc: k === 'K2' ? ['ANG'] : (k === 'K3' ? ['AFRC'] : ['USAF', 'ANG', 'AFRC']) })))};
    ${state}
    applyState(S); save(); 'ok'`);
  return X;
};
// Read one section of the RCN-EEIC by Month tab: [service, label, TOTAL, the Ask column] for every row that carries money.
const v198Sec = (rc, a, b) => { const out = []; let sv = null;
  for (let j = a; j < b; j++) { const L = w6Lbl(rc[j]);
    if (['USAF', 'ANG', 'AFRC'].includes(L)) { sv = L; continue; }
    if (/TOTAL BY MONTH$/.test(L)) { sv = null; continue; }
    if (!sv || num((rc[j] || [])[14]) === null) continue;
    out.push([sv, L.replace(/\s+⚠ rides several combinations.*$/, ' ⚠'), num(rc[j][14]), num((rc[j] || [])[15])]); }
  return out; };
await (async () => {
  const name = 'v1.98 item 83 — a prime’s CLINs put each service’s money on its own RCN/EEIC, and the summary, the CLIN breakout, the Spend Plan Source and the ACE breakout agree';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify;
    const X = v198Board(`S.rcnAsg={PRIME_P:'K4', R:'K1'}; S.rcnSvc={PRIME_P:{ANG:'K2'}, R:{ANG:'K2'}};
      S.clinRcn={PRIME_P:{n1:'K1'}}; S.clinRcnSvc={PRIME_P:{n1:{AFRC:'K3'}}};
      S.wbs={R:[{w:'2.2', v:[]}]}; S.aceMap={PRIME_P:{w:['1.1'], ok:true}, R:{w:['2.2'], ok:true}};
      ACEDB.sets={'2027ACE':{lines:[{ap:mySlug(), pmo:'AV', wbs:'1.1', v:{}}, {ap:mySlug(), pmo:'AV', wbs:'2.2', v:{}}]}};
      ACEDB.sets['2027ACE'].lines[0].v[MS.cur]=900; ACEDB.sets['2027ACE'].lines[1].v[MS.cur]=600; aceYr='all';`);
    chk(name, 'fixture', 'every requirement is funded in full on every service (discretionary)',
      X.ev(`(function(){ var T=tiers(); return JSON.stringify(['PRIME_P','R','Q'].map(function(id){ return T[id].d.concat(T[id].m); })); })()`),
      J([[700, 251, 90, 41, 0, 0, 0, 0], [503, 127, 0, 0, 0, 0, 0, 0], [71, 0, 0, 0, 0, 0, 0, 0]]));
    // ---- RCN-EEIC by Month, from the workbook's bytes
    const bk = JSON.parse(await w6Book(X.w, 'exportExcel'));
    chk(name, 'workbook', 'the Excel workbook builds and reads back', bk.__err || 'ok', 'ok');
    const rc = bk['RCN-EEIC by Month'] || [];
    const iReq = rc.findIndex(r => w6Lbl(r) === 'WHICH REQUIREMENTS SIT UNDER EACH COMBINATION');
    const iPr = rc.findIndex(r => w6Lbl(r) === 'PRIME CONTRACTS, BROKEN OUT BY CLIN');
    chk(name, 'RCN-EEIC by Month', 'the summary, the requirements and the prime contracts sections are all there', iReq > 0 && iPr > iReq, true);
    chk(name, 'RCN-EEIC by Month · summary', 'each service’s money on the combination each CLIN puts it on; Q on none; each service total is its funded money',
      J(v198Sec(rc, 0, iReq).map(r => r.slice(0, 3))),
      J([['USAF', v198Lab('K1'), 401 + 503], ['USAF', v198Lab('K4'), 299], ['USAF', v198NONE, 71], ['USAF', 'USAF TOTAL', 700 + 503 + 71],
        ['ANG', v198Lab('K1'), 251], ['ANG', v198Lab('K2'), 127], ['ANG', 'ANG TOTAL', 251 + 127],
        ['AFRC', v198Lab('K3'), 31], ['AFRC', v198Lab('K4'), 59], ['AFRC', 'AFRC TOTAL', 90]]));
    chk(name, 'RCN-EEIC by Month · requirements', 'P under each combination its CLINs use, with that share of its money and its ask, marked; the rows add to their combination',
      J(v198Sec(rc, iReq, iPr)),
      J([['USAF', v198Lab('K1') + '   (2 requirements)', 904, null], ['USAF', '#1  Req PRIME_P ⚠', 401, 401], ['USAF', '#2  Req R', 503, 503],
        ['USAF', v198Lab('K4') + '   (1 requirement)', 299, null], ['USAF', '#1  Req PRIME_P ⚠', 299, 299],
        ['USAF', v198NONE + '   — 1 requirement still to assign', 71, null], ['USAF', '#3  Req Q', 71, 71], ['USAF', 'USAF TOTAL', 1274, null],
        ['ANG', v198Lab('K1') + '   (1 requirement)', 251, null], ['ANG', '#1  Req PRIME_P', 251, 251],
        ['ANG', v198Lab('K2') + '   (1 requirement)', 127, null], ['ANG', '#2  Req R', 127, 127], ['ANG', 'ANG TOTAL', 378, null],
        ['AFRC', v198Lab('K3') + '   (1 requirement)', 31, null], ['AFRC', '#1  Req PRIME_P ⚠', 31, 31],
        ['AFRC', v198Lab('K4') + '   (1 requirement)', 59, null], ['AFRC', '#1  Req PRIME_P ⚠', 59, 59], ['AFRC', 'AFRC TOTAL', 90, null]]));
    chk(name, 'RCN-EEIC by Month · prime contracts', 'each CLIN’s money on each service, under that service’s combination on that CLIN',
      J(v198Sec(rc, iPr, rc.length).map(r => r.slice(0, 3))),
      J([['USAF', 'Req PRIME_P   (2 CLINs funded)', 700], ['USAF', 'CLIN 0001   ' + v198Lab('K1'), 401], ['USAF', 'CLIN 0002   ' + v198Lab('K4'), 299], ['USAF', 'USAF — PRIMES TOTAL', 700],
        ['ANG', 'Req PRIME_P   (1 CLIN funded)', 251], ['ANG', 'CLIN 0001   ' + v198Lab('K1'), 251], ['ANG', 'ANG — PRIMES TOTAL', 251],
        ['AFRC', 'Req PRIME_P   (2 CLINs funded)', 90], ['AFRC', 'CLIN 0001   ' + v198Lab('K3'), 31], ['AFRC', 'CLIN 0002   ' + v198Lab('K4'), 59], ['AFRC', 'AFRC — PRIMES TOTAL', 90]]));
    // ---- the Spend Plan Source: every line, by its amount (each is unique), with its CLIN and its EEIC and RCN
    const sb = JSON.parse(await w6Book(X.w, 'exportSrc'));
    chk(name, 'Spend Plan Source', 'the file builds and reads back', sb.__err || 'ok', 'ok');
    const src = (Object.values(sb).find(rs => (rs || []).length > 1) || []).slice(1);
    const got = src.map(r => [num(r[9]), String(r[25] ?? ''), String(r[26] ?? ''), String(r[27] ?? '')]).sort((a, b) => a[0] - b[0]);
    const want = [[31, '0001', 'CCCCC', '33333'], [41, '0001', '', ''], [59, '0002', 'DDDDD', '44444'], [71, '', '', ''], [127, '', 'BBBBB', '22222'],
      [251, '0001', 'AAAAA', '11111'], [299, '0002', 'DDDDD', '44444'], [401, '0001', 'AAAAA', '11111'], [503, '', 'AAAAA', '11111']];
    chk(name, 'Spend Plan Source', 'every line: amount, CLIN, EEIC and RCN -- each service on each CLIN on its own combination', J(got), J(want));
    // ---- AGREEMENT: the summary's combination totals are the source file's lines on those combinations, service by service
    const srcBy = {}; [[401, 'USAF'], [299, 'USAF'], [503, 'USAF'], [71, 'USAF'], [251, 'ANG'], [127, 'ANG'], [31, 'AFRC'], [59, 'AFRC']].forEach(([a, sv]) => {
      const l = got.find(x => x[0] === a); const lab = l && l[3] ? l[3] + ' / ' + l[2] : v198NONE; srcBy[sv + '|' + lab] = (srcBy[sv + '|' + lab] || 0) + a; });
    const rollBy = {}; v198Sec(rc, 0, iReq).filter(r => !/TOTAL$/.test(r[1])).forEach(r => { rollBy[r[0] + '|' + r[1]] = r[2]; });
    chk(name, 'agreement', 'the summary and the Spend Plan Source put the same dollars on the same combinations', J(Object.keys(rollBy).sort().map(k => [k, rollBy[k]])), J(Object.keys(srcBy).sort().map(k => [k, srcBy[k]])));
    // ---- the ACE tie-out: the alignment breakout splits a line whose services differ; the mapping counts the combinations
    const ab = JSON.parse(await w6Book(X.w, 'exportAceTieout'));
    chk(name, 'ACE tie-out', 'the tie-out builds and reads back', ab.__err || 'ok', 'ok');
    const al = ab['Alignment Breakout'] || [], ah = headerRow(al, 'FY', 'PMO', 'Line total');
    const ac = k => colOf(al, ah, k);
    const lines = al.slice(ah + 1).filter(r => /^FY\d\d$/.test(w6Lbl(r))).map(r => [String(r[2]), String(r[3] ?? ''), String(r[4] ?? ''), num(r[5]), num(r[6]), num(r[7]), String(r[ac('RCN')] ?? ''), String(r[ac('EEIC')] ?? '')]);
    chk(name, 'ACE · alignment breakout', 'P’s CLIN 0001 is a line per combination and its Navy money a line of its own; CLIN 0002 one line; R a line per combination; the lines add to each CLIN',
      J(lines), J([['Req PRIME_P', '0001', '(no WBS)', 652, 652, 0, '11111', 'AAAAA'], ['Req PRIME_P', '0001', '(no WBS)', 31, 31, 0, '33333', 'CCCCC'], ['Req PRIME_P', '0001', '(no WBS)', 41, 0, 41, '', ''],
        ['Req PRIME_P', '0002', '(no WBS)', 358, 358, 0, '44444', 'DDDDD'],
        ['Req R', '', '2.2', 503, 503, 0, '11111', 'AAAAA'], ['Req R', '', '2.2', 127, 127, 0, '22222', 'BBBBB'], ['Req Q', '', '(no WBS)', 71, 71, 0, '', '']]));
    const mp = ab['Mapping by Requirement'] || [], mh = headerRow(mp, 'FY', 'PMO', 'Board funded');
    const codes = mp.slice(mh + 1).filter(r => /^FY\d\d$/.test(w6Lbl(r))).map(r => [String(r[colOf(mp, mh, 'Requirement (CCaR Record Name)')]), String(r[colOf(mp, mh, 'RCN')] ?? ''), String(r[colOf(mp, mh, 'EEIC')] ?? '')]);
    chk(name, 'ACE · mapping by requirement', 'P rides three combinations and R two, so both send the reader to the breakout; Q has none',
      J(codes), J([['Req PRIME_P', '(3 combinations)', '(see breakout)'], ['Req R', '(2 combinations)', '(see breakout)'], ['Req Q', '', '']]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// A CLIN STILL POINTING AT A COMBINATION THAT WAS REMOVED (v1.97's ✕ left the CLINs' pointers behind) is money on no
// combination. The summary prints only the list's combinations and the not-assigned row, so once it reads the CLINs
// (this version) a pointer to anything else would put that money in no row and no total: the service totals below guard
// it (a CONTROL on v1.97, whose summary read only the requirement). FAILS ON v1.97: the summary filed P under its own
// (none) rather than CLIN 0002's K1, and the CLIN breakout named CLIN 0001's combination "(blank combo)".
await (async () => {
  const name = 'v1.98 item 83 — a CLIN pointing at a removed combination: its money is not assigned, never out of the totals';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify;
    const X = v198Board(`S.clinRcn={PRIME_P:{n1:'GONE', n2:'K1'}}; S.rcnAsg={R:'K1'};`);
    const bk = JSON.parse(await w6Book(X.w, 'exportExcel'));
    const rc = bk['RCN-EEIC by Month'] || [];
    const iReq = rc.findIndex(r => w6Lbl(r) === 'WHICH REQUIREMENTS SIT UNDER EACH COMBINATION');
    chk(name, 'RCN-EEIC by Month · summary', 'USAF: K1 is CLIN 0002 and R; CLIN 0001’s money and Q’s are not assigned; the total is every funded dollar',
      J(v198Sec(rc, 0, iReq).filter(r => r[0] === 'USAF').map(r => r.slice(0, 3))),
      J([['USAF', v198Lab('K1'), 299 + 503], ['USAF', v198NONE, 401 + 71], ['USAF', 'USAF TOTAL', 700 + 503 + 71]]));
    chk(name, 'RCN-EEIC by Month · summary', 'ANG and AFRC on CLIN 0001 are not assigned either, and every service total is its funded money',
      J(v198Sec(rc, 0, iReq).filter(r => r[0] !== 'USAF' && /TOTAL$/.test(r[1])).map(r => r.slice(0, 3))),
      J([['ANG', 'ANG TOTAL', 251 + 127], ['AFRC', 'AFRC TOTAL', 90]]));
    const iPr = rc.findIndex(r => w6Lbl(r) === 'PRIME CONTRACTS, BROKEN OUT BY CLIN');
    chk(name, 'RCN-EEIC by Month · prime contracts', 'CLIN 0001 reads as not assigned on every service; CLIN 0002 is K1',
      J(v198Sec(rc, iPr, rc.length).filter(r => /^CLIN /.test(r[1])).map(r => r.slice(0, 3))),
      J([['USAF', 'CLIN 0001   ' + v198NONE, 401], ['USAF', 'CLIN 0002   ' + v198Lab('K1'), 299], ['ANG', 'CLIN 0001   ' + v198NONE, 251],
        ['AFRC', 'CLIN 0001   ' + v198NONE, 31], ['AFRC', 'CLIN 0002   ' + v198Lab('K1'), 59]]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// A PRIME FUNDED NOTHING still needs its combinations: the NOT FUNDED list under each service names it under the
// combination each CLIN puts that service on, with that CLIN grid's share of its ask, and the shares add to the ask.
// FAILS ON v1.97: it was listed once, under the requirement's own combination (K4), with the whole ask.
await (async () => {
  const name = 'v1.98 item 83 — a prime funded nothing is listed under each CLIN’s combination, with its share of the ask';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify;
    const X = v198Board(`S.order=['R','Q','PRIME_P']; S.rcnAsg={PRIME_P:'K4', R:'K1'}; S.clinRcn={PRIME_P:{n1:'K1'}};
      S.discSvc=[574,127,0,0]; S.mandSvc=[0,0,0,0]; S.bm={disc:[574,127,0,0], mand:[0,0,0,0], adds:[]};`);
    chk(name, 'fixture', 'R and Q, ranked above P, take the whole budget; P is funded nothing',
      X.ev(`(function(){ var T=tiers(); return JSON.stringify([T.R.d, T.Q.d, T.PRIME_P.d.concat(T.PRIME_P.m)]); })()`), J([[503, 127, 0, 0], [71, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0]]));
    const bk = JSON.parse(await w6Book(X.w, 'exportExcel'));
    const rc = bk['RCN-EEIC by Month'] || [];
    const iReq = rc.findIndex(r => w6Lbl(r) === 'WHICH REQUIREMENTS SIT UNDER EACH COMBINATION');
    const iPr = rc.findIndex(r => w6Lbl(r) === 'PRIME CONTRACTS, BROKEN OUT BY CLIN');
    const nf = []; let sv = null, on = false;
    for (let j = iReq; j < (iPr > 0 ? iPr : rc.length); j++) { const L = w6Lbl(rc[j]);
      if (['USAF', 'ANG', 'AFRC'].includes(L)) { sv = L; on = false; continue; }
      if (/^A requirement appears once/.test(L)) break;        // the section's note, after the last service
      if (/^NOT FUNDED/.test(L)) { on = true; nf.push([sv, 'NOT FUNDED', num((rc[j] || [])[15])]); continue; }
      if (on && L) nf.push([sv, L.replace(/\s+⚠ rides several combinations.*$/, ' ⚠'), num((rc[j] || [])[15])]); }
    chk(name, 'RCN-EEIC by Month · not funded', 'USAF: P under K1 (CLIN 0001, 401) and K4 (CLIN 0002, 299), marked; AFRC: K1 31 and K4 59; ANG: K1 251 -- each service’s shares add to its ask',
      J(nf), J([['USAF', 'NOT FUNDED', 700], ['USAF', v198Lab('K1') + '   (1)', 401], ['USAF', '#3  Req PRIME_P ⚠', 401], ['USAF', v198Lab('K4') + '   (1)', 299], ['USAF', '#3  Req PRIME_P ⚠', 299],
        ['ANG', 'NOT FUNDED', 251], ['ANG', v198Lab('K1') + '   (1)', 251], ['ANG', '#3  Req PRIME_P', 251],
        ['AFRC', 'NOT FUNDED', 90], ['AFRC', v198Lab('K1') + '   (1)', 31], ['AFRC', '#3  Req PRIME_P ⚠', 31], ['AFRC', v198Lab('K4') + '   (1)', 59], ['AFRC', '#3  Req PRIME_P ⚠', 59]]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v1.98 item 83 ====
// ==== v1.99 item 88 (review N04): a locked cycle keeps the RCN / EEIC list it was locked with ====
// On v1.98's fixture: P's CLIN 0001 is on K1 (11111 / AAAAA) with its AFRC on K3 (33333 / CCCCC). Lock the window; then,
// in the working list, give K1 new codes (99999 / ZZZZZ) and remove K3. FAILS ON v1.98: the cycle's view read today's
// list, so its RCN-EEIC tab printed 99999 / ZZZZZ for the money locked on 11111 / AAAAA, and filed K3's money under
// "no RCN/EEIC assigned"; the Spend Plan Source taken from the view did the same.
await (async () => {
  const name = 'v1.99 item 88 — a locked cycle’s view and every report from it read the RCN / EEIC list it was locked with';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify;
    const X = v198Board(`S.rcnAsg={PRIME_P:'K4', R:'K1'}; S.rcnSvc={PRIME_P:{ANG:'K2'}, R:{ANG:'K2'}};
      S.clinRcn={PRIME_P:{n1:'K1'}}; S.clinRcnSvc={PRIME_P:{n1:{AFRC:'K3'}}};`);
    const ev = c => { try { return X.ev(c); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 100); } };
    const key = ev(`window.confirm=function(){ return true; }; MS.base=MS.cur; blCyc='PB'; blYr=MS.cur; cycLock(); blKey('PB', MS.cur)`);
    w5Chk(name, 'lock', 'CONTROL — the window is locked', ev(`!!(blGet(${J(key)}) && blGet(${J(key)}).locked)`), 'true');
    // the working list changes: K1 renumbered, K3 removed (its pointers in the working plan cleared, as rcnDel does)
    ev(`(function(){ var L=rcnReg(), i=L.findIndex(function(e){ return e.k==='K1'; }); rcnSet(i,'rcn','99999'); rcnSet(i,'eeic','ZZZZZ');
      rcnDel(rcnReg().findIndex(function(e){ return e.k==='K3'; })); })(); 'ok'`);
    const summary = async () => { const bk = JSON.parse(await w6Book(X.w, 'exportExcel')); const rc = bk['RCN-EEIC by Month'] || [];
      const iReq = rc.findIndex(r => w6Lbl(r) === 'WHICH REQUIREMENTS SIT UNDER EACH COMBINATION');
      return { rows: v198Sec(rc, 0, iReq).map(r => r.slice(0, 3)), title: w6Lbl(rc[0] || []) }; };
    const srcLines = async () => { const sb = JSON.parse(await w6Book(X.w, 'exportSrc'));
      const src = (Object.values(sb).find(rs => (rs || []).length > 1) || []).slice(1);
      return src.map(r => [num(r[9]), String(r[25] ?? ''), String(r[26] ?? ''), String(r[27] ?? '')]).sort((a, b) => a[0] - b[0]); };
    const LOCKED = [['USAF', v198Lab('K1'), 401 + 503], ['USAF', v198Lab('K4'), 299], ['USAF', v198NONE, 71], ['USAF', 'USAF TOTAL', 1274],
      ['ANG', v198Lab('K1'), 251], ['ANG', v198Lab('K2'), 127], ['ANG', 'ANG TOTAL', 378],
      ['AFRC', v198Lab('K3'), 31], ['AFRC', v198Lab('K4'), 59], ['AFRC', 'AFRC TOTAL', 90]];
    const LOCKED_SRC = [[31, '0001', 'CCCCC', '33333'], [41, '0001', '', ''], [59, '0002', 'DDDDD', '44444'], [71, '', '', ''], [127, '', 'BBBBB', '22222'],
      [251, '0001', 'AAAAA', '11111'], [299, '0002', 'DDDDD', '44444'], [401, '0001', 'AAAAA', '11111'], [503, '', 'AAAAA', '11111']];
    // THE WORKING PLAN takes the change (a CONTROL: v1.98 did this too)
    const w = await summary();
    w5Chk(name, 'the working plan', 'CONTROL — K1’s money prints 99999 / ZZZZZ, and K3’s, its pointer cleared, falls to the CLIN’s standard',
      J(w.rows.filter(r => r[0] === 'USAF' || r[0] === 'AFRC').map(r => r[1])), J(['99999 / ZZZZZ', v198Lab('K4'), v198NONE, 'USAF TOTAL', '99999 / ZZZZZ', v198Lab('K4'), 'AFRC TOTAL']));
    // THE CYCLE'S VIEW: every code as locked
    ev(`cycView(${J(key)}); 'ok'`);
    const v = await summary();
    w5Chk(name, 'the cycle’s view · RCN-EEIC by Month', 'every dollar on the code it was locked on: K1 still 11111 / AAAAA, K3 still 33333 / CCCCC', J(v.rows), J(LOCKED));
    w5Chk(name, 'the cycle’s view · Spend Plan Source', 'every line’s EEIC and RCN as locked', J(await srcLines()), J(LOCKED_SRC));
    w5Chk(name, 'the cycle’s view', 'CONTROL — it says nothing about today’s list: this cycle kept its own',
      J([/today’s list/.test(ev(`(document.getElementById('shareStat')||{}).textContent||''`)), /today’s list/.test(v.title)]), J([false, false]));
    ev(`cycLeave(); 'ok'`);
    const w2 = await summary();
    w5Chk(name, 'back on the working plan', 'CONTROL — today’s codes again', J(w2.rows), J(w.rows));
    // SAVED AND REOPENED: the cycle's list is in the file
    const R = boot({ html: ev('buildSavedHtml()') });
    const rv = (() => { try { R.ev(`cycView(${J(key)}); 'ok'`); return 'ok'; } catch (e) { return 'threw'; } })();
    const rb = JSON.parse(await w6Book(R.w, 'exportExcel')); const rrc = rb['RCN-EEIC by Month'] || [];
    w5Chk(name, 'saved and reopened, the cycle’s view', 'still every code as locked',
      J([rv, v198Sec(rrc, 0, rrc.findIndex(r => w6Lbl(r) === 'WHICH REQUIREMENTS SIT UNDER EACH COMBINATION')).map(r => r.slice(0, 3))]), J(['ok', LOCKED]));
    // A CYCLE LOCKED BEFORE v1.99 kept no list: read against today's, and said so -- in the view, on its line, on the tab
    ev(`delete blGet(${J(key)}).rcn; cycView(${J(key)}); 'ok'`);
    const o = await summary();
    w5Chk(name, 'a cycle locked before v1.99', 'its view says its codes are read against today’s list',
      /read against today’s list/.test(ev(`(document.getElementById('shareStat')||{}).textContent||''`)), true);
    w5Chk(name, 'a cycle locked before v1.99', 'the RCN-EEIC tab’s title says so', /read against today’s list/.test(o.title), true);
    w5Chk(name, 'a cycle locked before v1.99', 'CONTROL — and no code is made up: it prints today’s', J(o.rows.filter(r => r[0] === 'USAF').map(r => r[1])),
      J(['99999 / ZZZZZ', v198Lab('K4'), v198NONE, 'USAF TOTAL']));
    ev(`cycLeave(); blOpen=true; blBody(); 'ok'`);
    w5Chk(name, 'a cycle locked before v1.99', 'its line under PPBE cycles says (RCN / EEIC: today’s list)',
      /\(RCN \/ EEIC: today’s list\)/.test(ev(`document.getElementById('blBody').textContent`)), true);
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v1.99 item 88 ====
// ==== v2.00 (U10): a refused edit in a locked cycle's view changes no code any export carries ====
// The review of main (Codex), as Brad supplied it on 11 Oct: lock PB27 with RCN / EEIC 11111 / AAAAA, move the working codes on,
// view PB27 and type 77777 in the enabled RCN field. Save said "the change was not kept", and RCN-EEIC by Month then exported
// PB27's dollars under 77777 / AAAAA, labelled LOCKED VIEW: a refused write put back the year on screen and nothing beside it.
// On v1.98 item 83's board (K1-K4, P's two CLINs, the ACE set), with a second held year (FY28, a copy of FY27) and an office ZED
// holding Q. PB27 is locked; the working list then moves on as v1.99 item 88's does (K1 renumbered 99999 / ZZZZZ, K3 removed).
// Each edit is made through the control the board renders for it -- the RCN / EEIC panel's three fields, its ✕ (answered OK),
// its + Add and a service box, and Setup › PMOs' ✎ (answered WRK) -- from a fresh view of PB27. After each, every export that
// carries a code is read from its bytes: RCN-EEIC by Month (summary, requirements, prime contracts), the Spend Plan Source
// (amount, CLIN, EEIC, RCN, PMO), the ACE tie-out (alignment breakout and mapping, FY27 and FY28) and the whole workbook (no
// cell names a code the cycle does not hold; the office ZED is everywhere it was). Every expected code and figure is the
// cycle's own, typed here: item 83's table. The record's own steps (saved, reopened, viewed, 77777 typed) are checked as well,
// and so is a cycle locked before v1.99, which kept no list: its view reads today's list (item 88), and a refusal leaves it so.
// FAILS ON 7ee498a (board fce8a391, U14's): each edit stays on the view's copy -- 77777, YYYYY and "Renamed" in every export
// that prints the code; K3 removed, so CLIN 0001's AFRC $31 is on no combination in FY27 and falls to K1 in FY28; ZED renamed,
// so Q's $71 is filed under AV; the older cycle's RCN-EEIC tab prints 77777 / ZZZZZ. CONTROLS: an edit to the year's own
// assignments (put back before as well), the cycle store and browser storage byte for byte, leaving the view, and an allowed
// edit on the working plan, which every export carries.
await (async () => {
  const name = 'v2.00 (U10) — a refused edit in a locked cycle’s view changes no code any export carries';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify;
    const ST = `S.rcnAsg={PRIME_P:'K4', R:'K1'}; S.rcnSvc={PRIME_P:{ANG:'K2'}, R:{ANG:'K2'}};
      S.clinRcn={PRIME_P:{n1:'K1'}}; S.clinRcnSvc={PRIME_P:{n1:{AFRC:'K3'}}};
      S.wbs={R:[{w:'2.2', v:[]}]}; S.aceMap={PRIME_P:{w:['1.1'], ok:true}, R:{w:['2.2'], ok:true}};
      ACEDB.sets={'2027ACE':{lines:[{ap:mySlug(), pmo:'AV', wbs:'1.1', v:{}}, {ap:mySlug(), pmo:'AV', wbs:'2.2', v:{}}]}};
      ACEDB.sets['2027ACE'].lines[0].v[MS.cur]=900; ACEDB.sets['2027ACE'].lines[1].v[MS.cur]=600; aceYr='all';
      MS.pmos=GROUPS.concat(['ZED']); S.grp={Q:'ZED'};`;
    const X = v198Board(ST);
    const ev = c => { try { return X.ev(c); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 100); } };
    const key = ev(`window.confirm=function(){ return true; }; window.prompt=function(){ return 'WRK'; };
      MS.base=MS.cur; MS.years[MS.cur]=S; MS.years[MS.cur+1]=JSON.parse(JSON.stringify(S)); save();
      blCyc='PB'; blYr=MS.cur; cycLock(); blKey('PB', MS.cur)`);
    w5Chk(name, 'fixture', 'CONTROL — PB27 is locked, holding FY27 and FY28, with the list K1-K4; Q is in ZED',
      J([key, ev(`JSON.stringify([!!(blGet('PB|2027')||{}).locked, Object.keys((blGet('PB|2027')||{}).years||{})])`), ev(`GROUPS.indexOf('ZED')>=0`), ev(`grpOf(itemById('Q'))`)]),
      J(['PB|2027', '[true,["2027","2028"]]', true, 'ZED']));
    // the working list moves on after the lock (item 88's own change)
    ev(`(function(){ var L=rcnReg(), i=L.findIndex(function(e){ return e.k==='K1'; }); rcnSet(i,'rcn','99999'); rcnSet(i,'eeic','ZZZZZ');
      rcnDel(rcnReg().findIndex(function(e){ return e.k==='K3'; })); })(); 'ok'`);
    const reg = () => JSON.parse(ev(`JSON.stringify(rcnReg().map(function(e){ return [e.rcn, e.eeic, e.t, (e.svc||[]).join('+')]; }))`));
    w5Chk(name, 'fixture', 'CONTROL — the working list is now 99999 / ZZZZZ, 22222 / BBBBB, 44444 / DDDDD',
      J(reg()), J([['99999', 'ZZZZZ', '', 'USAF+ANG+AFRC'], ['22222', 'BBBBB', '', 'ANG'], ['44444', 'DDDDD', '', 'USAF+ANG+AFRC']]));
    const cyc0 = ev('JSON.stringify(CYCDB)'), ls0 = ev('localStorage.getItem(_AP.key)');
    // the panel as drawn on screen: each combination's RCN | EEIC | title | USAF ANG AFRC boxes
    const panel = () => JSON.parse(ev(`JSON.stringify([].slice.call(document.querySelectorAll('#rcnBody tr')).slice(1).map(function(tr){
      return [].slice.call(tr.querySelectorAll('input')).map(function(i){ return i.type==='checkbox'? (i.checked?'x':'-') : i.value; }).join('|'); }))`));
    // a control the panel renders for one combination: its field (typed, change fired), a service box, its ✕, or + Add
    const fire = (k, kind, value) => ev(`(function(){ if(!rcnOpen) toggleRcn(); var i=rcnReg().findIndex(function(e){ return e.k===${J(k)}; });
      var els=[].slice.call(document.querySelectorAll('#rcnBody input, #rcnBody button')), on=function(e, a){ return e.getAttribute(a)||''; }, el=null;
      if(${J(kind)}==='add') el=els.filter(function(e){ return /^rcnAdd\\(/.test(on(e, 'onclick')); })[0];
      else if(${J(kind)}==='del') el=els.filter(function(e){ return on(e, 'onclick')==='rcnDel('+i+')'; })[0];
      else if(${J(kind)}==='svc') el=els.filter(function(e){ return on(e, 'onchange').indexOf('rcnToggleSvc('+i+',')===0 && on(e, 'onchange').indexOf(${J(value)})>0; })[0];
      else el=els.filter(function(e){ return on(e, 'onchange').indexOf('rcnSet('+i+',"'+${J(kind)}+'"')===0; })[0];
      if(!el) return 'no control';
      if(${J(kind)}==='add' || ${J(kind)}==='del') el.click();
      else if(${J(kind)}==='svc'){ el.checked=!el.checked; el.dispatchEvent(new Event('change', {bubbles:true})); }
      else { el.value=${J(value)}; el.dispatchEvent(new Event('change', {bubbles:true})); }
      return 'fired'; })()`);
    const notKept = () => /the change was not kept|Not kept/.test(ev(`(document.getElementById('shareStat')||{}).textContent||''`));
    // every export that carries a code, read from its bytes
    const exportsOf = async W => {
      const bk = JSON.parse(await w6Book(W, 'exportExcel')), rc = bk['RCN-EEIC by Month'] || [];
      const iReq = rc.findIndex(r => w6Lbl(r) === 'WHICH REQUIREMENTS SIT UNDER EACH COMBINATION'), iPr = rc.findIndex(r => w6Lbl(r) === 'PRIME CONTRACTS, BROKEN OUT BY CLIN');
      const cells = []; Object.keys(bk).filter(k => !k.startsWith('__')).forEach(sh => (bk[sh] || []).forEach(r => (r || []).forEach(c => cells.push(String(c ?? '').trim()))));
      const sb = JSON.parse(await w6Book(W, 'exportSrc')), src = (Object.values(sb).find(rs => (rs || []).length > 1) || []).slice(1);
      const ab = JSON.parse(await w6Book(W, 'exportAceTieout'));
      const al = ab['Alignment Breakout'] || [], ah = headerRow(al, 'FY', 'PMO', 'Line total');
      const mp = ab['Mapping by Requirement'] || [], mh = headerRow(mp, 'FY', 'PMO', 'Board funded');
      return {
        files: [bk.__err || 'ok', sb.__err || 'ok', ab.__err || 'ok'],
        summary: v198Sec(rc, 0, iReq).map(r => r.slice(0, 3)), requirements: v198Sec(rc, iReq, iPr), primes: v198Sec(rc, iPr, rc.length).map(r => r.slice(0, 3)),
        source: src.map(r => [num(r[9]), String(r[25] ?? ''), String(r[26] ?? ''), String(r[27] ?? ''), String(r[18] ?? '')]).sort((a, b) => a[0] - b[0]),
        alignment: al.slice(ah + 1).filter(r => /^FY\d\d$/.test(w6Lbl(r))).map(r => [w6Lbl(r), String(r[2]), String(r[3] ?? ''), num(r[5]), String(r[colOf(al, ah, 'RCN')] ?? ''), String(r[colOf(al, ah, 'EEIC')] ?? '')]),
        mapping: mp.slice(mh + 1).filter(r => /^FY\d\d$/.test(w6Lbl(r))).map(r => [w6Lbl(r), String(r[colOf(mp, mh, 'PMO')] ?? ''), String(r[colOf(mp, mh, 'Requirement (CCaR Record Name)')]), String(r[colOf(mp, mh, 'RCN')] ?? ''), String(r[colOf(mp, mh, 'EEIC')] ?? '')]),
        workbook: [cells.filter(t => /77777|YYYYY|99999|ZZZZZ|Renamed|WRK/.test(t)).length, 'PMO ZED' in bk, cells.filter(t => t === 'ZED').length] };
    };
    const exportsNow = () => exportsOf(X.w);
    const L = v198Lab, N = v198NONE;
    // THE CYCLE'S OWN CODES, as item 83's table has them; ZED holds Q; no cell names a code PB27 does not hold
    const ALIGN = fy => [[fy, 'Req PRIME_P', '0001', 652, '11111', 'AAAAA'], [fy, 'Req PRIME_P', '0001', 31, '33333', 'CCCCC'], [fy, 'Req PRIME_P', '0001', 41, '', ''],
      [fy, 'Req PRIME_P', '0002', 358, '44444', 'DDDDD'], [fy, 'Req R', '', 503, '11111', 'AAAAA'], [fy, 'Req R', '', 127, '22222', 'BBBBB'], [fy, 'Req Q', '', 71, '', '']];
    const MAP = fy => [[fy, 'AV', 'Req PRIME_P', '(3 combinations)', '(see breakout)'], [fy, 'AV', 'Req R', '(2 combinations)', '(see breakout)'], [fy, 'ZED', 'Req Q', '', '']];
    const LOCKED = { files: ['ok', 'ok', 'ok'],
      summary: [['USAF', L('K1'), 904], ['USAF', L('K4'), 299], ['USAF', N, 71], ['USAF', 'USAF TOTAL', 1274], ['ANG', L('K1'), 251], ['ANG', L('K2'), 127], ['ANG', 'ANG TOTAL', 378],
        ['AFRC', L('K3'), 31], ['AFRC', L('K4'), 59], ['AFRC', 'AFRC TOTAL', 90]],
      requirements: [['USAF', L('K1') + '   (2 requirements)', 904, null], ['USAF', '#1  Req PRIME_P ⚠', 401, 401], ['USAF', '#2  Req R', 503, 503],
        ['USAF', L('K4') + '   (1 requirement)', 299, null], ['USAF', '#1  Req PRIME_P ⚠', 299, 299],
        ['USAF', N + '   — 1 requirement still to assign', 71, null], ['USAF', '#3  Req Q', 71, 71], ['USAF', 'USAF TOTAL', 1274, null],
        ['ANG', L('K1') + '   (1 requirement)', 251, null], ['ANG', '#1  Req PRIME_P', 251, 251],
        ['ANG', L('K2') + '   (1 requirement)', 127, null], ['ANG', '#2  Req R', 127, 127], ['ANG', 'ANG TOTAL', 378, null],
        ['AFRC', L('K3') + '   (1 requirement)', 31, null], ['AFRC', '#1  Req PRIME_P ⚠', 31, 31],
        ['AFRC', L('K4') + '   (1 requirement)', 59, null], ['AFRC', '#1  Req PRIME_P ⚠', 59, 59], ['AFRC', 'AFRC TOTAL', 90, null]],
      primes: [['USAF', 'Req PRIME_P   (2 CLINs funded)', 700], ['USAF', 'CLIN 0001   ' + L('K1'), 401], ['USAF', 'CLIN 0002   ' + L('K4'), 299], ['USAF', 'USAF — PRIMES TOTAL', 700],
        ['ANG', 'Req PRIME_P   (1 CLIN funded)', 251], ['ANG', 'CLIN 0001   ' + L('K1'), 251], ['ANG', 'ANG — PRIMES TOTAL', 251],
        ['AFRC', 'Req PRIME_P   (2 CLINs funded)', 90], ['AFRC', 'CLIN 0001   ' + L('K3'), 31], ['AFRC', 'CLIN 0002   ' + L('K4'), 59], ['AFRC', 'AFRC — PRIMES TOTAL', 90]],
      source: [[31, '0001', 'CCCCC', '33333', 'AV'], [41, '0001', '', '', 'AV'], [59, '0002', 'DDDDD', '44444', 'AV'], [71, '', '', '', 'ZED'], [127, '', 'BBBBB', '22222', 'AV'],
        [251, '0001', 'AAAAA', '11111', 'AV'], [299, '0002', 'DDDDD', '44444', 'AV'], [401, '0001', 'AAAAA', '11111', 'AV'], [503, '', 'AAAAA', '11111', 'AV']],
      alignment: ALIGN('FY27').concat(ALIGN('FY28')), mapping: MAP('FY27').concat(MAP('FY28')), workbook: [0, true, 8] };
    const LIST = [['11111', 'AAAAA', '', 'USAF+ANG+AFRC'], ['22222', 'BBBBB', '', 'ANG'], ['33333', 'CCCCC', '', 'AFRC'], ['44444', 'DDDDD', '', 'USAF+ANG+AFRC']];
    const PANEL = ['11111|AAAAA||x|x|x', '22222|BBBBB||-|x|-', '33333|CCCCC||-|-|x', '44444|DDDDD||x|x|x'];
    const view = () => ev(`cycView(${J(key)}); 'ok'`), leave = () => ev(`if(rcnOpen) toggleRcn(); if(pmoOpen) togglePmo(); cycLeave(); 'ok'`);
    // ---- CONTROL: PB27 viewed, nothing typed
    view();
    w5Chk(name, 'PB27 viewed, nothing typed', 'CONTROL — every export carries the cycle’s own codes', J(await exportsNow()), J(LOCKED));
    leave();
    // ---- EACH EDIT THE RCN / EEIC PANEL OFFERS, refused. `exp`: the exports differed on 7ee498a (a combination with no money,
    // and the services a combination is set up for, are printed by no export: those two are CONTROLs there)
    const EDITS = [['RCN 77777 typed into K1’s field', () => fire('K1', 'rcn', '77777'), true], ['EEIC YYYYY typed into K1’s field', () => fire('K1', 'eeic', 'YYYYY'), true],
      ['title “Renamed” typed into K4’s field', () => fire('K4', 't', 'Renamed'), true], ['K3 removed with its ✕, answered OK', () => fire('K3', 'del'), true],
      ['+ Add RCN / EEIC', () => fire('K1', 'add'), false], ['K1’s ANG box switched off', () => fire('K1', 'svc', 'ANG'), false]];
    for (const [what, act, exp] of EDITS) {
      view(); const fired = act();
      w5Chk(name, 'PB27 viewed · ' + what, 'refused and said so; the list in the view, and the panel redrawn on screen, are the cycle’s: K1-K4 as locked',
        J([fired, notKept(), reg(), panel()]), J(['fired', true, LIST, PANEL]));
      w5Chk(name, 'PB27 viewed · ' + what, (exp ? '' : 'CONTROL — ') + 'every export carries the cycle’s own codes, as before the edit', J(await exportsNow()), J(LOCKED));
      leave();
    }
    // ---- ANOTHER YEAR THE CYCLE HOLDS: K3's ✕ clears its pointers in every year; refused on FY27, FY28 is read next
    view(); fire('K3', 'del'); ev(`if(rcnOpen) toggleRcn(); switchYear(MS.cur+1); 'ok'`);
    w5Chk(name, 'PB27 viewed · K3 removed on FY27, then FY28 on screen', 'FY28 still holds CLIN 0001’s AFRC on K3, and the list is the cycle’s',
      J([ev('MS.cur'), ev(`JSON.stringify(S.clinRcnSvc)`), reg()]), J([2028, J({ PRIME_P: { n1: { AFRC: 'K3' } } }), LIST]));
    w5Chk(name, 'PB27 viewed · K3 removed on FY27, then FY28 on screen', 'every export of FY28 carries the cycle’s own codes', J(await exportsNow()), J(LOCKED));
    leave();
    // ---- A REFUSAL WHILE FY28 IS ON SCREEN puts the copy back on FY28, not on the year the view opened on
    view(); ev(`switchYear(MS.cur+1); 'ok'`); const f28 = fire('K1', 'rcn', '77777');
    w5Chk(name, 'PB27 viewed · FY28 on screen, RCN 77777 typed into K1’s field', 'refused; still FY28, on FY28’s months; the list and the panel are the cycle’s',
      J([f28, notKept(), ev('MS.cur'), ev('FYMON[0][0]'), reg(), panel()]), J(['fired', true, 2028, '2027-10', LIST, PANEL]));
    w5Chk(name, 'PB27 viewed · FY28 on screen, RCN 77777 typed into K1’s field', 'every export of FY28 carries the cycle’s own codes', J(await exportsNow()), J(LOCKED));
    leave();
    // ---- THE PMO LIST: ZED renamed WRK with its ✎, refused (the rename moves every year's offices first)
    view();
    const fz = ev(`(function(){ if(!pmoOpen) togglePmo(); var b=[].slice.call(document.querySelectorAll('#pmoList button')).filter(function(e){
      return (e.getAttribute('onclick')||'')==='pmoRename('+GROUPS.indexOf('ZED')+')'; })[0]; if(!b) return 'no control'; b.click(); return 'fired'; })()`);
    w5Chk(name, 'PB27 viewed · ZED renamed WRK with its ✎', 'refused and said so; the list on screen still ends ZED; Q is in ZED in FY27 and FY28',
      J([fz, notKept(), ev(`[].slice.call(document.querySelectorAll('#pmoList .fr > div > b')).map(function(b){ return b.textContent; }).join(',')`), ev(`grpOf(itemById('Q'))`), ev(`JSON.stringify(MS.years[MS.cur+1].grp)`)]),
      J(['fired', true, 'ATL,PSM,PP,AV,MxS,CDS,TSS,BOP,ZED', 'ZED', J({ Q: 'ZED' })]));
    w5Chk(name, 'PB27 viewed · ZED renamed WRK with its ✎', 'every export carries the cycle’s own offices and codes: Q’s $71 under ZED', J(await exportsNow()), J(LOCKED));
    leave();
    // ---- CONTROL: an edit to the year's own assignments, refused (the year was put back before this version too)
    view(); ev(`setRcnAsg('Q','K2'); 'ok'`);
    w5Chk(name, 'PB27 viewed · Q given K2 (the year’s own assignment)', 'CONTROL — refused, and every export carries the cycle’s own codes',
      J([notKept(), await exportsNow()]), J([true, LOCKED]));
    leave();
    // ---- CONTROL: nothing durable moved, and leaving the view gives back the working plan
    w5Chk(name, 'after every refusal, the view left', 'CONTROL — the cycle store and browser storage are byte for byte as they were; the working list, ZED and Q are the working plan’s',
      J([ev('JSON.stringify(CYCDB)') === cyc0, ev('localStorage.getItem(_AP.key)') === ls0, ev('CYCVIEW'), reg(), ev(`GROUPS.join(',')`), ev(`grpOf(itemById('Q'))`)]),
      J([true, true, '', [['99999', 'ZZZZZ', '', 'USAF+ANG+AFRC'], ['22222', 'BBBBB', '', 'ANG'], ['44444', 'DDDDD', '', 'USAF+ANG+AFRC']], 'ATL,PSM,PP,AV,MxS,CDS,TSS,BOP,ZED', 'ZED']));
    // ---- THE RECORD'S OWN STEPS: the board saved and reopened, PB27 viewed, 77777 typed into the RCN field, Excel exported
    const R = boot({ html: ev('buildSavedHtml()') });
    const rv = (() => { try { return R.ev(`cycView(${J(key)}); (function(){ if(!rcnOpen) toggleRcn(); var el=[].slice.call(document.querySelectorAll('#rcnBody input')).filter(function(e){
      return (e.getAttribute('onchange')||'').indexOf('rcnSet(0,"rcn"')===0; })[0]; if(!el) return 'no control'; el.value='77777'; el.dispatchEvent(new Event('change', {bubbles:true}));
      return 'fired'; })()`); } catch (e) { return 'threw'; } })();
    // the status line is read at once: 'Not kept' is put in front of a message for 1.5 s after a refusal, and the exports write their own
    const rk = /the change was not kept|Not kept/.test(R.ev(`(document.getElementById('shareStat')||{}).textContent||''`));
    const rx = await exportsOf(R.w);
    w5Chk(name, 'the record’s steps: saved, reopened, PB27 viewed, 77777 typed', 'refused; RCN-EEIC by Month, the Spend Plan Source and the ACE tie-out (on its own year, FY27, as a reopened board shows it) carry the cycle’s own codes; no cell names 77777',
      J([rv, rk, rx]),
      J(['fired', true, Object.assign({}, LOCKED, { alignment: ALIGN('FY27'), mapping: MAP('FY27') })]));
    // ---- CONTROL: the working plan, no view -- an edit is allowed, and every export carries it
    fire('K4', 'rcn', '55555'); ev(`if(rcnOpen) toggleRcn(); 'ok'`);
    const w = await exportsNow(), WK = '99999 / ZZZZZ', W5 = '55555 / DDDDD';
    const WALIGN = fy => [[fy, 'Req PRIME_P', '0001', 724, '99999', 'ZZZZZ'], [fy, 'Req PRIME_P', '0002', 358, '55555', 'DDDDD'], [fy, 'Req R', '', 503, '99999', 'ZZZZZ'],
      [fy, 'Req R', '', 127, '22222', 'BBBBB'], [fy, 'Req Q', '', 71, '', '']];
    w5Chk(name, 'the working plan · K4 renumbered 55555 (allowed)', 'CONTROL — every export carries 55555 / DDDDD, and the working list (K3 removed: CLIN 0001’s AFRC on its standard, K1)',
      J([w.files, w.summary, w.primes, w.source, w.alignment]),
      J([['ok', 'ok', 'ok'], [['USAF', WK, 904], ['USAF', W5, 299], ['USAF', N, 71], ['USAF', 'USAF TOTAL', 1274], ['ANG', WK, 251], ['ANG', L('K2'), 127], ['ANG', 'ANG TOTAL', 378],
        ['AFRC', WK, 31], ['AFRC', W5, 59], ['AFRC', 'AFRC TOTAL', 90]],
        [['USAF', 'Req PRIME_P   (2 CLINs funded)', 700], ['USAF', 'CLIN 0001   ' + WK, 401], ['USAF', 'CLIN 0002   ' + W5, 299], ['USAF', 'USAF — PRIMES TOTAL', 700],
          ['ANG', 'Req PRIME_P   (1 CLIN funded)', 251], ['ANG', 'CLIN 0001   ' + WK, 251], ['ANG', 'ANG — PRIMES TOTAL', 251],
          ['AFRC', 'Req PRIME_P   (2 CLINs funded)', 90], ['AFRC', 'CLIN 0001   ' + WK, 31], ['AFRC', 'CLIN 0002   ' + W5, 59], ['AFRC', 'AFRC — PRIMES TOTAL', 90]],
        [[31, '0001', 'ZZZZZ', '99999', 'AV'], [41, '0001', '', '', 'AV'], [59, '0002', 'DDDDD', '55555', 'AV'], [71, '', '', '', 'ZED'], [127, '', 'BBBBB', '22222', 'AV'],
          [251, '0001', 'ZZZZZ', '99999', 'AV'], [299, '0002', 'DDDDD', '55555', 'AV'], [401, '0001', 'ZZZZZ', '99999', 'AV'], [503, '', 'ZZZZZ', '99999', 'AV']],
        WALIGN('FY27').concat(WALIGN('FY28'))]));
    // ---- A CYCLE LOCKED BEFORE v1.99 kept no list (item 88's own reading of one: the lock's list taken away), so its view reads
    // today's -- 99999 / ZZZZZ, 22222 / BBBBB, 55555 / DDDDD. 77777 typed into K1's field there is refused like any other.
    ev(`delete blGet(${J(key)}).rcn; 'ok'`);
    view(); const fo = fire('K1', 'rcn', '77777'), fk = notKept(), o = await exportsNow();
    w5Chk(name, 'a cycle locked before v1.99, viewed · RCN 77777 typed into K1’s field', 'refused; the view’s list and RCN-EEIC by Month are today’s list as it is',
      J([fo, fk, reg(), o.summary.filter(r => r[0] === 'USAF').map(r => r[1])]),
      J(['fired', true, [['99999', 'ZZZZZ', '', 'USAF+ANG+AFRC'], ['22222', 'BBBBB', '', 'ANG'], ['55555', 'DDDDD', '', 'USAF+ANG+AFRC']], [WK, W5, N, 'USAF TOTAL']]));
    leave();
    w5Chk(name, 'harness', 'CONTROL — no jsdom script errors on either board', J([X.errors.length, R.errors.length]), J([0, 0]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v2.00 (U10) ====
// ==== v2.00 (U10, beside the codes): a refusal in a locked view puts back the plan's settings, the year on screen, the CCaR records and the base year ====
// The U10 block above reads the codes. A refusal makes the whole copy again, so what the board keeps beside the codes comes back
// with it, and this block reads that in the exports (the U10 round-1 test review's cases, 13 Oct). On v1.98 item 83's board with
// every requirement in band 0, PB27 locked and viewed: band 0 renamed (bandSet, the handler the ✎ prompt calls) and the funds-flow
// axis set to destinations (flowSetAxis), each refused. A held year that is not a copy of the first: PB27's FY28 files R on K4,
// 77777 typed there. A CCaR Records file imported in the view (its Title and OPR are kept beside the years, in MS.ccarIdx, and the
// Spend Plan Source prints them). The cycle's own FYDP window after a refusal, when the working plan's base year has moved on.
// FAILS ON 7ee498a (board fce8a391): the workbook names band 0 RENAMED BAND, the funds-flow export is cut by destination, and the
// Spend Plan Source titles R and Q REFUSED TITLE R / Q with OPR REFUSED OPR. The FY28 case fails there too (77777 stays in the
// view's list, and RCN-EEIC by Month files K1's money under 77777). CONTROLS: nothing changed; nothing imported; the same CCaR
// file imported on the working plan, which the Source prints; the cycle's FYDP window (the year-only put-back never touched the
// base year); no jsdom errors. Every name, code and figure expected is typed here.
await (async () => {
  const name = 'v2.00 (U10) — a refusal in a locked view puts back the plan’s settings, the year on screen, the CCaR records and the cycle’s base year';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify;
    const X = v198Board(`S.band={PRIME_P:BANDS_LIST()[0].id, R:BANDS_LIST()[0].id, Q:BANDS_LIST()[0].id};`);
    const ev = c => { try { return X.ev(c); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 100); } };
    const key = ev(`window.confirm=function(){ return true; }; MS.base=MS.cur; MS.years[MS.cur]=S; save(); blCyc='PB'; blYr=MS.cur; cycLock(); blKey('PB', MS.cur)`);
    const notKept = () => /the change was not kept|Not kept/.test(ev(`(document.getElementById('shareStat')||{}).textContent||''`));
    const bandCells = async () => { const bk = JSON.parse(await w6Book(X.w, 'exportExcel')), o = [];
      Object.keys(bk).filter(k => !k.startsWith('__')).forEach(sh => (bk[sh] || []).forEach(r => (r || []).forEach(c => {
        const t = String(c ?? '').trim(); if (/NET FUNDING AVAILABLE|RENAMED/i.test(t)) o.push(sh + ': ' + t); }))); return [bk.__err || 'ok', o]; };
    const flowSheets = async () => { const bk = JSON.parse(await w6Book(X.w, 'exportFlow')); return [bk.__err || 'ok', Object.keys(bk).filter(k => !k.startsWith('__'))]; };
    ev(`cycView(${J(key)}); 'ok'`);
    const b0 = await bandCells(), f0 = await flowSheets();
    ev(`bandSet(0,'n','RENAMED BAND'); 'ok'`); const nk1 = notKept(), b1 = await bandCells();
    ev(`flowSetAxis('dest'); 'ok'`); const nk2 = notKept(), f1 = await flowSheets();
    ev(`cycLeave(); 'ok'`);
    // band 0 as the workbook prints it, and the funds-flow sheets cut by what the money buys: typed here
    const BANDS = ['ok', ['Decision Bands: Net Funding Available', 'Decision Bands: BAND 0 — NET FUNDING AVAILABLE  ·  fund in full  ·  counts toward the stoppage gap  ·  organization standard  ·  3 requirements',
      'Decision Bands: Net Funding Available', 'Decision Bands: Net Funding Available', 'Decision Bands: Net Funding Available']];
    const FLOW = ['ok', ['Funds Flow', 'Prime Detail', 'OGC Detail', 'Workforce & Travel', 'Depot, Repair & Materiel', 'Software, IT & Cyber', 'Engineering, Projects & Stud', 'Program Operations & Support']];
    w5Chk(name, 'PB27 viewed, nothing changed', 'CONTROL — the workbook names band 0 as locked, and the funds-flow export is cut by what the money buys', J([b0, f0]), J([BANDS, FLOW]));
    w5Chk(name, 'PB27 viewed · band 0 renamed RENAMED BAND (refused)', 'refused and said so; the workbook still names band 0 as it was locked', J([nk1, b1]), J([true, BANDS]));
    w5Chk(name, 'PB27 viewed · funds-flow axis set to destinations (refused)', 'refused and said so; the funds-flow export is still cut by what the money buys', J([nk2, f1]), J([true, FLOW]));
    // A HELD YEAR THAT DIFFERS FROM THE ONE THE VIEW OPENS ON: PB27's FY28 files R on K4 (FY27 files it on K1). The U10 block's FY28 is a
    // copy of FY27, so a refusal that put FY27's plan in FY28's place would read the same there. By hand (item 83's table, R on K4 in FY28):
    // USAF -- K1 401 (CLIN 0001's standard), K4 802 (CLIN 0002's 299 + R's 503), none 71 (Q), total 1274.
    const Y = v198Board(`S.rcnAsg={PRIME_P:'K4', R:'K1'}; S.rcnSvc={PRIME_P:{ANG:'K2'}, R:{ANG:'K2'}}; S.clinRcn={PRIME_P:{n1:'K1'}};`);
    const yv = c => { try { return Y.ev(c); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 100); } };
    const k2 = yv(`window.confirm=function(){ return true; }; MS.base=MS.cur; MS.years[MS.cur]=S; MS.years[MS.cur+1]=JSON.parse(JSON.stringify(S));
      MS.years[MS.cur+1].rcnAsg={PRIME_P:'K4', R:'K4'}; save(); blCyc='PB'; blYr=MS.cur; cycLock(); blKey('PB', MS.cur)`);
    yv(`cycView(${J(k2)}); switchYear(MS.cur+1); if(!rcnOpen) toggleRcn(); (function(){ var i=rcnReg().findIndex(function(e){ return e.k==='K1'; });
      var el=[].slice.call(document.querySelectorAll('#rcnBody input')).filter(function(e){ return (e.getAttribute('onchange')||'').indexOf('rcnSet('+i+',"rcn"')===0; })[0];
      el.value='77777'; el.dispatchEvent(new Event('change', {bubbles:true})); })(); 'ok'`);
    const yk = /the change was not kept|Not kept/.test(yv(`(document.getElementById('shareStat')||{}).textContent||''`)), ycur = yv('MS.cur');
    const ybk = JSON.parse(await w6Book(Y.w, 'exportExcel')), yrc = ybk['RCN-EEIC by Month'] || [];
    const yreq = yrc.findIndex(r => w6Lbl(r) === 'WHICH REQUIREMENTS SIT UNDER EACH COMBINATION');
    const ysum = v198Sec(yrc, 0, yreq).filter(r => r[0] === 'USAF').map(r => r.slice(0, 3));
    yv(`if(rcnOpen) toggleRcn(); cycLeave(); 'ok'`);
    w5Chk(name, 'PB27 viewed · FY28 (R on K4) on screen, RCN 77777 typed into K1’s field', 'refused; still FY28, and RCN-EEIC by Month files FY28’s USAF money as FY28 holds it',
      J([yk, ycur, ysum]), J([true, 2028, [['USAF', '11111 / AAAAA', 401], ['USAF', '44444 / DDDDD', 802], ['USAF', v198NONE, 71], ['USAF', 'USAF TOTAL', 1274]]]));
    // A CCaR RECORDS FILE IMPORTED WHILE PB27 IS ON SCREEN. R and Q carry CCaR numbers CCR and CCQ (the suite's it()); the import wrote
    // the index the working plan keeps beside its years, then saved, which the view refused (now it is refused before the file is read:
    // the shared-lists block below). By hand: the Spend Plan Source's Title column is the requirement's own name ("Ev R", "Ev Q") and
    // its OPR blank until a records file is kept.
    const CCAR = (t, o) => J([['CCaR No', 'Title', 'OPR', 'PMO', 'Control No'], ['CCR', t + ' R', o, 'AV', '7001'], ['CCQ', t + ' Q', o, 'AV', '7002']]);
    const ccarImp = rows => X.w.eval(`(async function(){ var b=buildXlsx([{name:'CCaR', cols:[12,30,14,8,10], rows:${rows}}]);
      var ab=b.buffer.slice(b.byteOffset, b.byteOffset+b.byteLength);
      await importCcarRecs({files:[{name:'ccar-records.xlsx', arrayBuffer:async function(){ return ab; }}]}); return 'ok'; })()`);
    const srcTitles = async () => { const sb = JSON.parse(await w6Book(X.w, 'exportSrc'));
      const s = Object.keys(sb).filter(k => !k.startsWith('__')).map(k => sb[k]).find(rs => Array.isArray(rs) && rs.length > 1) || [], seen = {};
      s.slice(1).forEach(r => { const k = String((r || [])[2] ?? ''); if (k === 'CCR' || k === 'CCQ') seen[[k, String(r[3] ?? ''), String(r[12] ?? '')].join(' | ')] = 1; });
      return [sb.__err || 'ok', String((s[0] || [])[3] ?? ''), String((s[0] || [])[12] ?? ''), Object.keys(seen).sort()]; };
    ev(`cycView(${J(key)}); 'ok'`);
    const s0 = await srcTitles();
    await ccarImp(CCAR('REFUSED TITLE', 'REFUSED OPR')); const nk3 = notKept(), s1 = await srcTitles();
    ev(`cycLeave(); 'ok'`);
    await ccarImp(CCAR('RECORD TITLE', 'RECORD OPR')); const s2 = await srcTitles();
    const SRC0 = ['ok', 'Title', 'OPR', ['CCQ | Ev Q | ', 'CCR | Ev R | ']];
    w5Chk(name, 'PB27 viewed, nothing imported', 'CONTROL — the Spend Plan Source titles R and Q by their own names, OPR blank', J(s0), J(SRC0));
    w5Chk(name, 'PB27 viewed · CCaR Records file imported (refused)', 'refused and said so; the Spend Plan Source still titles R and Q by their own names, OPR blank', J([nk3, s1]), J([true, SRC0]));
    w5Chk(name, 'the working plan · the same file imported (allowed)', 'CONTROL — the Spend Plan Source prints the records’ Title and OPR',
      J(s2), J(['ok', 'Title', 'OPR', ['CCQ | RECORD TITLE Q | RECORD OPR', 'CCR | RECORD TITLE R | RECORD OPR']]));
    // THE CYCLE'S OWN BASE YEAR. The working plan's FYDP window moves on after the lock (base FY28); PB27 was locked on FY27.
    // By hand: the view's window is FY27-FY31 before and after a refusal; the working plan's is FY28-FY32 with FY27 (on screen) beside it.
    ev(`MS.base=MS.cur+1; save(); cycView(${J(key)}); 'ok'`);
    const w0 = ev('JSON.stringify(fydpWindow())');
    ev(`bandSet(0,'n','RENAMED AGAIN'); 'ok'`); const nk4 = notKept(), w1 = ev('JSON.stringify(fydpWindow())');
    ev(`cycLeave(); 'ok'`); const w2 = ev('JSON.stringify(fydpWindow())');
    w5Chk(name, 'working base year moved to FY28 · PB27 viewed · band 0 renamed (refused)', 'CONTROL — the view keeps the cycle’s FYDP window FY27–FY31 after the refusal; the working plan’s is FY28–FY32',
      J([w0, nk4, w1, w2]), J(['[2027,2028,2029,2030,2031]', true, '[2027,2028,2029,2030,2031]', '[2027,2028,2029,2030,2031,2032]']));
    w5Chk(name, 'harness', 'CONTROL — no jsdom script errors', J([X.errors.length, Y.errors.length]), J([0, 0]));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v2.00 (U10, beside the codes) ====
// ==== v2.00 (U10, the shared lists): a cost estimate, a BAE list, CCaR records or a destination change is refused in a locked view before anything is kept ====
// The lists every appropriation shares -- the cost estimates, the BAE budget list, the destination list -- are no part of a locked
// view's copy, so making the copy again (the blocks above) cannot put them back. On 7ee498a each door wrote its list first and then
// saved, which the view refused: the board said "Not kept" and kept it (the U10 round-1 money review, 13 Oct). Now each is refused
// before the file is read or a question asked, and says so. A board of two requirements in AV -- A (USAF 900, ANG 200, confirmed on
// WBS 1.1) and R (USAF 503, ANG 127) -- with an approved 2027 estimate (AV, 1.1, $900) and the funds flow grouped by where the money
// goes. PB27 is locked with R going to Lockheed Martin; the working plan then adds Depot X (a government activity) and sends R there.
// With PB27 on screen, each door is used through the handler its control calls (the file pickers' importAce / importBud /
// importCcarRecs, with a workbook the board builds) or through the control Setup › Destinations renders (a name typed, + add,
// ✕ answered OK, reset answered OK). After each, in the view and again on the working plan after leaving: the status line, the
// questions asked, the three lists in the board and in browser storage, the panel, and the cells of the ACE tie-out, the FYDP
// Spend Plan, the Spend Plan Source and the funds flow -- every figure typed here. FAILS ON 7ee498a (board fce8a391): the approved
// estimate is replaced after "should not change. Replace it?" and the tie-out reads $4,321,000; the Source names the BAE budget
// and the refused CCaR titles; Lockheed Martin is RENAMED DEST in the funds flow; "Remove Depot X? Nothing points at it." is asked
// and, back on the working plan, R's $630 is not yet assigned. CONTROLS: PB27 viewed, nothing done; on the working plan each door
// is open -- the estimate replaced (asked first), the BAE list kept, a destination added and named -- and every export carries it.
await (async () => {
  const name = 'v2.00 (U10) — a cost estimate, a BAE list, CCaR records or a destination change is refused in a locked view before anything is kept';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify;
    const X = boot();
    seed(X.ev, { services: ['USAF', 'ANG', 'AFRC'], items: [it('A', 'AV', [900, 200, 0]), it('R', 'AV', [503, 127, 0])], disc: [5000, 5000, 5000], mand: [0, 0, 0], order: ['A', 'R'] });
    const ev = c => { try { return X.ev(c); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 100); } };
    ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.wbs={A:[{w:'1.1', v:[]}]}; S.aceMap={A:{w:['1.1'], ok:true}}; S.dest={R:{to:'lm'}};
      ACEDB.sets={'2027ACE':{lines:[{ap:mySlug(), pmo:'AV', wbs:'1.1', v:{}}], locked:true, by:'Approver', ts:1, file:'2027 ACE approved.xlsx'}};
      ACEDB.sets['2027ACE'].lines[0].v[MS.cur]=900; aceYr='all'; persistAce(); applyState(S); save(); flowSetAxis('dest');
      globalThis.__wb=function(sheets, name){ var b=buildXlsx(sheets); return {name:name, arrayBuffer: async function(){ return b.buffer.slice(b.byteOffset, b.byteOffset+b.byteLength); }}; };
      globalThis.__aceRows=function(){ var rows=[[],[],[],[],[]]; rows[4][ACE_COL.y0]=2027; var r=[]; r[ACE_COL.appn]='O&M'; r[ACE_COL.svc]='USAF';
        r[ACE_COL.managed]='Y'; r[ACE_COL.pmo]='AIR VEHICLE'; r[ACE_COL.y0]=4.321; r[ACE_COL.ce]='CE1'; rows.push(r);
        rows.forEach(function(x){ for(var i=0;i<x.length;i++) if(x[i]===undefined) x[i]=''; }); return rows; };
      'ok'`);
    const key = ev(`window.confirm=function(){ return true; }; MS.base=MS.cur; MS.years[MS.cur]=S; save(); blCyc='PB'; blYr=MS.cur; cycLock(); blKey('PB', MS.cur)`);
    // after the lock: the working plan adds Depot X, a government activity, and sends R's money there (PB27 still sends it to Lockheed Martin)
    ev(`flowAddEnt(); (function(){ var L=flowEnts(); flowSetEnt(L.length-1,'n','Depot X'); flowSetEnt(L.length-1,'kind','gov'); })();
      setDest('R','to',destByName('Depot X').k); 'ok'`);
    const said = () => ev(`(document.getElementById('shareStat')||{}).textContent||''`);
    const spy = () => ev(`window.__asked=[]; window.confirm=function(m){ window.__asked.push(String(m).slice(0,70)); return true; };
      window.alert=function(m){ window.__asked.push('alert: '+String(m).slice(0,70)); }; 'ok'`);
    const asked = () => JSON.parse(ev(`JSON.stringify(window.__asked||[])`));
    const lists = () => JSON.parse(ev(`JSON.stringify((function(){ var s=ACEDB.sets['2027ACE'];
      return [s? [s.file||'', !!s.locked, s.lines.map(function(l){ return [l.pmo, l.wbs, (l.v||{})[MS.cur]]; })] : null,
        (BUDDB.rows||[]).map(function(b){ return b.n; }), flowEnts().map(function(e){ return e.n; })]; })())`));
    const stored = () => JSON.parse(ev(`JSON.stringify((function(){ var a=JSON.parse(localStorage.getItem('prio27acedb')||'null'), b=JSON.parse(localStorage.getItem('prio27buddb')||'null'),
      d=JSON.parse(localStorage.getItem(DEST_KEY)||'null'), s=a&&a.sets&&a.sets['2027ACE'];
      return [s? [s.file||'', !!s.locked, (s.lines||[]).map(function(l){ return [l.pmo, l.wbs, (l.v||{})[MS.cur]]; })] : null,
        b? (b.rows||[]).map(function(x){ return x.n; }) : null, d? (d.ents||[]).map(function(e){ return e.n; }) : null]; })())`));
    // Setup › Destinations as drawn on screen: each destination's name field, A to Z
    const panel = () => JSON.parse(ev(`(function(){ if(!entOpen) toggleEnt(); return JSON.stringify([].slice.call(document.querySelectorAll('#entBody input')).filter(function(i){
      return /^flowSetEnt\\(\\d+,"n",/.test(i.getAttribute('onchange')||''); }).map(function(i){ return i.value; })); })()`));
    // a control Setup › Destinations renders for one destination: its name field (typed, change fired), its ✕, + add, or reset
    const fireDest = (kind, nm, value) => ev(`(function(){ if(!entOpen) toggleEnt(); var i=flowEnts().findIndex(function(e){ return e.n===${J(nm)}; });
      var els=[].slice.call(document.querySelectorAll('#entBody input, #entBody button')), on=function(e, a){ return e.getAttribute(a)||''; }, el=null;
      if(${J(kind)}==='name') el=els.filter(function(e){ return on(e, 'onchange')==='flowSetEnt('+i+',"n",this.value)'; })[0];
      else if(${J(kind)}==='del') el=els.filter(function(e){ return on(e, 'onclick')==='flowDelEnt('+i+')'; })[0];
      else el=els.filter(function(e){ return on(e, 'onclick')===${J(kind)}; })[0];
      if(!el) return 'no control';
      if(${J(kind)}==='name'){ el.value=${J(value || '')}; el.dispatchEvent(new Event('change', {bubbles:true})); } else el.click();
      return 'fired'; })()`);
    const hdr = (rows, ...must) => rows.findIndex(r => must.every(m => (r || []).some(c => String(c ?? '').trim() === m)));
    const col = (rows, h, n) => (rows[h] || []).findIndex(c => String(c ?? '').trim() === n);
    // every export that carries the estimate, the budget names, the CCaR titles or the destinations, read from its bytes
    const exportsNow = async () => {
      const ab = JSON.parse(await w6Book(X.w, 'exportAceTieout')), mp = ab['Mapping by Requirement'] || [], mh = hdr(mp, 'FY', 'PMO', 'Board funded');
      const rc = ab['Reconciliation by PMO'] || [], rh = hdr(rc, 'FY', 'PMO', 'Estimate');
      const fb = JSON.parse(await w6Book(X.w, 'exportFydpPlan')), bp = fb['By PMO'] || [], bh = hdr(bp, 'PMO', 'Requirements');
      const sb = JSON.parse(await w6Book(X.w, 'exportSrc')), s = Object.keys(sb).filter(k => !k.startsWith('__')).map(k => sb[k]).find(rs => Array.isArray(rs) && rs.length > 1) || [];
      const ff = JSON.parse(await w6Book(X.w, 'exportFlow'));
      return {
        files: [ab.__err || 'ok', fb.__err || 'ok', sb.__err || 'ok', ff.__err || 'ok'],
        mapping: mp.slice(mh + 1).filter(r => /^FY\d\d$/.test(w6Lbl(r))).map(r => ['Requirement (CCaR Record Name)', 'Match', 'WBS claimed', 'Board funded', 'Estimate', 'Delta'].map(n => r[col(mp, mh, n)] ?? '')),
        reconciliation: rc.slice(rh + 1).filter(r => w6Lbl(r) === 'FY27' && String(r[1] ?? '') === 'AV').map(r => [r[0], r[1], r[2], r[3], r[4]]),
        fydp: bp.slice(bh + 1).filter(r => w6Lbl(r) === 'AV').map(r => [r[0], r[col(bp, bh, 'FY27 ACE estimate')], r[col(bp, bh, 'FYDP ACE estimate')]]),
        source: [String((s[0] || [])[4] ?? ''), String((s[0] || [])[12] ?? ''), s.slice(1).map(r => [String(r[2] ?? ''), String(r[3] ?? ''), num(r[9]), String(r[4] ?? ''), String(r[12] ?? '')]).sort()],
        flow: (ff['Funds Flow'] || []).filter(r => (r || []).length >= 5 && ['Lockheed Martin', 'Depot X', 'Depot Z', 'Not yet assigned', 'RENAMED DEST', 'New destination'].includes(w6Lbl(r))).map(r => [w6Lbl(r), num(r[1]), num(r[4])]) };
    };
    // BY HAND. The view: R goes to Lockheed Martin (PB27's); the working plan: R goes to Depot X. A's $1,100 goes nowhere yet. The
    // estimate is the approved one: A confirmed on 1.1, $900 against A's $1,100; AV $900 against $1,730 funded. No budget, no records.
    const MAPPING = [['Req A', 'Confirmed - exact line', '1.1', 1100, 900, 200], ['Req R', 'No match', '', 630, '', '']];
    const SOURCE = ['Budget', 'OPR', [['CCA', 'Ev A', 200, '', ''], ['CCA', 'Ev A', 900, '', ''], ['CCR', 'Ev R', 127, '', ''], ['CCR', 'Ev R', 503, '', '']]];
    const VIEW = { files: ['ok', 'ok', 'ok', 'ok'], mapping: MAPPING, reconciliation: [['FY27', 'AV', 900, 1730, 830]], fydp: [['AV', 900, 900]], source: SOURCE,
      flow: [['Lockheed Martin', 630, 2], ['Depot X', 0, 0], ['Not yet assigned', 1100, 2]] };
    const WORK = Object.assign({}, VIEW, { flow: [['Lockheed Martin', 0, 0], ['Depot X', 630, 2], ['Not yet assigned', 1100, 2]] });
    const DEST = ['Lockheed Martin', 'Pratt & Whitney', 'NAWCAD Patuxent River', 'NAWCWD China Lake', 'FRC East, Cherry Point', 'NAWCAD Lakehurst', 'Defense Logistics Agency', 'OC-ALC Oklahoma City', 'Depot X'];
    const ACE0 = ['2027 ACE approved.xlsx', true, [['AV', '1.1', 900]]];
    const LISTS = [ACE0, [], DEST], STORED = [ACE0, null, DEST];
    const PANEL = ['Defense Logistics Agency', 'Depot X', 'FRC East, Cherry Point', 'Lockheed Martin', 'NAWCAD Lakehurst', 'NAWCAD Patuxent River', 'NAWCWD China Lake', 'OC-ALC Oklahoma City', 'Pratt & Whitney'];
    const OFF = what => '🔒 ' + what + ' is off while PB27 is on screen. It is a locked cycle, read only — the change was not kept. ↩ Leave the view to work the plan.';
    const view = () => ev(`cycView(${J(key)}); 'ok'`), leave = () => ev(`if(entOpen) toggleEnt(); cycLeave(); 'ok'`);
    const Rto = () => ev(`flowEntName(destOf(itemById('R')).to)`);
    // ---- CONTROL: PB27 viewed, nothing done; then the working plan
    view();
    w5Chk(name, 'PB27 viewed, nothing done', 'CONTROL — the lists, browser storage and the panel as they are; every export carries PB27’s own figures (R to Lockheed Martin)',
      J([lists(), stored(), panel(), await exportsNow()]), J([LISTS, STORED, PANEL, VIEW]));
    leave();
    w5Chk(name, 'the working plan, nothing done', 'CONTROL — R goes to Depot X, and every export says so', J([Rto(), await exportsNow()]), J(['Depot X', WORK]));
    // ---- EACH DOOR, with PB27 on screen
    const DOORS = [
      ['a cost estimate imported (2027 ACE.xlsx, AV $4.321M; the approved 2027ACE is loaded)', 'Importing a cost estimate', () => ev(`importAce({files:[__wb([{name:'ACE', rows:__aceRows()}], '2027 ACE.xlsx')], value:''})`)],
      ['a BAE list imported (an ANG budget for AV)', 'Importing a BAE budget list', () => ev(`importBud({files:[__wb([{name:'BAE', rows:[['Budget Name'], ['USAF O&M - ANG CAM ZZ9 Discretionary AV']]}], 'BAE.xlsx')], value:''})`)],
      ['a CCaR Records file imported (titles and OPR for CCA and CCR)', 'Importing CCaR records', () => ev(`importCcarRecs({files:[__wb([{name:'CCaR', rows:[['CCaR No','Title','OPR','PMO','Control No'],
        ['CCA','REFUSED TITLE A','REFUSED OPR','AV','7001'], ['CCR','REFUSED TITLE R','REFUSED OPR','AV','7002']]}], 'ccar-records.xlsx')], value:''})`)],
      ['Lockheed Martin renamed RENAMED DEST in its name field', 'Changing a destination', () => fireDest('name', 'Lockheed Martin', 'RENAMED DEST')],
      ['+ add a destination', 'Adding a destination', () => fireDest('flowAddEnt()')],
      ['Depot X removed with its ✕, answered OK', 'Removing a destination', () => fireDest('del', 'Depot X')],
      ['reset the list, answered OK', 'Resetting the destination list', () => fireDest('flowResetEnts()')]];
    for (const [what, door, act] of DOORS) {
      view(); panel(); spy();
      const r = await act(), st = said(), q = asked(), fired = (r === undefined || r === 'fired') ? 'ran' : String(r);
      w5Chk(name, 'PB27 viewed · ' + what, 'refused before anything is read or asked, and the status line says so', J([fired, st, q]), J(['ran', OFF(door), []]));
      w5Chk(name, 'PB27 viewed · ' + what, 'the lists, browser storage and the panel as they were; every export from the view carries PB27’s own figures',
        J([lists(), stored(), panel(), await exportsNow()]), J([LISTS, STORED, PANEL, VIEW]));
      leave();
      w5Chk(name, 'PB27 viewed · ' + what + ' · the view left', 'the working plan’s lists, R’s destination and every export are its own, as before',
        J([lists(), stored(), Rto(), await exportsNow()]), J([LISTS, STORED, 'Depot X', WORK]));
    }
    // ---- CONTROLS: on the working plan each door is open, and every export carries what it did (typed from the files)
    spy(); await ev(`importAce({files:[__wb([{name:'ACE', rows:__aceRows()}], '2027 ACE.xlsx')], value:''})`);
    const qa = asked().map(m => m.split('\n')[0]), la = lists(), sa = stored(), xa = await exportsNow();
    w5Chk(name, 'the working plan · a cost estimate imported (allowed)', 'CONTROL — it asks before replacing the approved 2027ACE, replaces it (AV $4,321,000, no WBS), and the tie-out and FYDP Spend Plan read it',
      J([qa, la[0], sa[0], xa.mapping, xa.reconciliation, xa.fydp]),
      J([['⚠ 2027ACE is already loaded and LOCKED.'], ['2027 ACE.xlsx', true, [['AV', '', 4321000]]], ['2027 ACE.xlsx', true, [['AV', '', 4321000]]],
        [['Req A', 'Confirmed', '1.1', 1100, 0, 1100], ['Req R', 'No match', '', 630, '', '']], [['FY27', 'AV', 4321000, 1730, -4319270]], [['AV', 4321000, 4321000]]]));
    await ev(`importBud({files:[__wb([{name:'BAE', rows:[['Budget Name'], ['USAF O&M - ANG CAM ZZ9 Discretionary AV']]}], 'BAE.xlsx')], value:''})`);
    const lb = lists(), sbud = stored(), xb = await exportsNow(), BUD = 'USAF O&M - ANG CAM ZZ9 Discretionary AV';
    w5Chk(name, 'the working plan · a BAE list imported (allowed)', 'CONTROL — the list is kept, and the Spend Plan Source names the ANG budget on A’s and R’s ANG lines',
      J([lb[1], sbud[1], xb.source]), J([[BUD], [BUD], ['Budget', 'OPR', [['CCA', 'Ev A', 200, BUD, ''], ['CCA', 'Ev A', 900, '', ''], ['CCR', 'Ev R', 127, BUD, ''], ['CCR', 'Ev R', 503, '', '']]]]));
    // + add a destination, named Depot Z in its name field, and R sent there: what the view refused, on the working plan
    const fa = fireDest('flowAddEnt()'), fd = fireDest('name', 'New destination', 'Depot Z');
    ev(`setDest('R','to',destByName('Depot Z').k); 'ok'`);
    const pd = panel(), ld = lists(), sd = stored(), xd = await exportsNow();
    ev(`if(entOpen) toggleEnt(); 'ok'`);
    w5Chk(name, 'the working plan · + add a destination, named Depot Z, R sent there (allowed)', 'CONTROL — the list, browser storage and the panel carry Depot Z, and the funds flow puts R’s $630 under it',
      J([fa, fd, pd.includes('Depot Z'), ld[2].slice(-1), sd[2].slice(-1), Rto(), xd.flow.filter(r => r[0] === 'Depot Z' || r[0] === 'Not yet assigned')]),
      J(['fired', 'fired', true, ['Depot Z'], ['Depot Z'], 'Depot Z', [['Depot Z', 630, 2], ['Not yet assigned', 1100, 2]]]));
    w5Chk(name, 'harness', 'CONTROL — no jsdom script errors', J(X.errors.length), J(0));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v2.00 (U10, the shared lists) ====
// ==== v2.00 (U10, the spend plan's choices): a spend-plan choice, a PPBE position or a destination's kind refused in a locked view leaves no trace ====
// The Spend Plan's choices -- its Cost data (the estimate the ACE tie-out ties out), By PMO / By Service and the two prior years --
// were set on the page first and then saved, which the view refused: the board said "the change was not kept" and kept the choice,
// so the ACE tie-out taken from the view, and from the working plan after leaving it, tied out the estimate chosen in the view (the
// U10 round-2 test review, 13 Oct). A PPBE position is kept beside the years (MS.ppbe), so only a refusal that makes the whole copy
// again puts it back (the blocks above read the codes, the bands and the funds flow, not the positions). A destination's kind is
// changed through a field of its own, which the shared-lists block above does not use (it renames). A board of two AV
// requirements -- A (USAF 900, ANG 200, confirmed on WBS 1.1) and R (USAF 503, ANG 127) -- with two approved estimates, 2027ACE (AV,
// 1.1, $900) and 2026ACE (AV, 1.1, $333 for FY27), the Spend Plan on 2027ACE by PMO, and the working plan tagged PB27 with USAF's
// FY27 position logged at $1,000. PB27 is locked and viewed; each choice is made through the control the Spend Plan renders, and
// the position through the handler its cell calls. FAILS ON 7ee498a (board fce8a391) and on the U10 commits: the Spend Plan shows
// 2026ACE by Service with the prior years, and the ACE tie-out from the view and from the working plan ties out 2026ACE ($333);
// on 7ee498a the FYDP Spend Plan from the view also prints the refused $5,000 position, and Lockheed Martin is kept a government
// activity for every appropriation and in browser storage. CONTROLS: PB27 viewed, nothing chosen; on
// the working plan the Cost data choice is open, kept, and the tie-out reads it; no jsdom errors. Every figure is typed here.
await (async () => {
  const name = 'v2.00 (U10) — a spend-plan choice, a PPBE position or a destination’s kind refused in a locked view leaves no trace';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify;
    const X = boot();
    seed(X.ev, { services: ['USAF', 'ANG', 'AFRC'], items: [it('A', 'AV', [900, 200, 0]), it('R', 'AV', [503, 127, 0])], disc: [5000, 5000, 5000], mand: [0, 0, 0], order: ['A', 'R'] });
    const ev = c => { try { return X.ev(c); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 100); } };
    ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.wbs={A:[{w:'1.1', v:[]}]}; S.aceMap={A:{w:['1.1'], ok:true}};
      ACEDB.sets={'2027ACE':{lines:[{ap:mySlug(), pmo:'AV', wbs:'1.1', v:{}}], locked:true, by:'Approver', ts:2, file:'2027 ACE approved.xlsx'},
        '2026ACE':{lines:[{ap:mySlug(), pmo:'AV', wbs:'1.1', v:{}}], locked:true, by:'Approver', ts:1, file:'2026 ACE approved.xlsx'}};
      ACEDB.sets['2027ACE'].lines[0].v[MS.cur]=900; ACEDB.sets['2026ACE'].lines[0].v[MS.cur]=333; aceYr='all';
      persistAce(); applyState(S); save(); setSpAce('2027ACE');
      cycSetWorking('PB', MS.cur); ppCyc='PB'; ppYr=MS.cur; ppLineAdd('USAF'); ppSetV('USAF', ppLines(ppPos(),'USAF')[0].k, MS.cur, 'd', '1000'); 'ok'`);
    const key = ev(`window.confirm=function(){ return true; }; MS.base=MS.cur; MS.years[MS.cur]=S; save(); blCyc='PB'; blYr=MS.cur; cycLock(); blKey('PB', MS.cur)`);
    const notKept = () => /the change was not kept|Not kept/.test(ev(`(document.getElementById('shareStat')||{}).textContent||''`));
    // the Spend Plan as drawn on screen: its Cost data choice, and which of By PMO / By Service / ◀ prior 2 FY is pressed
    const onScreen = () => JSON.parse(ev(`(function(){ if(!spOpen){ spOpen=true; render(); }
      var s=[].slice.call(document.querySelectorAll('select')).filter(function(e){ return (e.getAttribute('onchange')||'')==='setSpAce(this.value)'; }).map(function(e){ return e.value; });
      var b=[].slice.call(document.querySelectorAll('button')).filter(function(e){ return /^setSp(By|Prior)\\(/.test(e.getAttribute('onclick')||'') && e.classList.contains('on'); }).map(function(e){ return e.textContent; });
      return JSON.stringify([s, b]); })()`));
    // a control the Spend Plan renders: the Cost data select (a value chosen, change fired) or a button (clicked)
    const press = (on, value) => ev(`(function(){ if(!spOpen){ spOpen=true; render(); } var el=[].slice.call(document.querySelectorAll('select, button')).filter(function(e){
      return (e.getAttribute('onchange')||e.getAttribute('onclick')||'')===${J(on)}; })[0]; if(!el) return 'no control';
      if(el.tagName==='SELECT'){ el.value=${J(value || '')}; el.dispatchEvent(new Event('change', {bubbles:true})); } else el.click(); return 'fired'; })()`);
    const hdr = (rows, ...must) => rows.findIndex(r => must.every(m => (r || []).some(c => String(c ?? '').trim() === m)));
    const col = (rows, h, n) => (rows[h] || []).findIndex(c => String(c ?? '').trim() === n);
    // the ACE tie-out and the FYDP Spend Plan, read from their bytes
    const tie = async () => { const ab = JSON.parse(await w6Book(X.w, 'exportAceTieout')), mp = ab['Mapping by Requirement'] || [], mh = hdr(mp, 'FY', 'PMO', 'Board funded');
      const rc = ab['Reconciliation by PMO'] || [], rh = hdr(rc, 'FY', 'PMO', 'Estimate');
      return [ab.__err || 'ok', w6Lbl(mp[0]), mp.slice(mh + 1).filter(r => /^FY\d\d$/.test(w6Lbl(r))).map(r => ['Requirement (CCaR Record Name)', 'Board funded', 'Estimate', 'Delta'].map(n => r[col(mp, mh, n)] ?? '')),
        rc.slice(rh + 1).filter(r => w6Lbl(r) === 'FY27' && String(r[1] ?? '') === 'AV').map(r => [r[0], r[1], r[2], r[3], r[4]])]; };
    const pos = async () => { const fb = JSON.parse(await w6Book(X.w, 'exportFydpPlan')), bs = fb['By Service'] || [], h = hdr(bs, 'Service'), c = col(bs, h, 'FY27 PPBE position');
      return [fb.__err || 'ok', bs.slice(h + 1).filter(r => ['USAF', 'ANG', 'AFRC', 'TOTAL'].includes(w6Lbl(r))).map(r => [w6Lbl(r), r[c]])]; };
    const stored = () => ev(`(JSON.parse(localStorage.getItem(_AP.key)||'{}')||{}).spAce||''`);
    // BY HAND. 2027ACE: A's $1,100 funded against $900 on 1.1 (delta 200); AV $900 against $1,730 funded (A 1,100 + R 630; delta 830).
    // 2026ACE: $333 against the same (767; 1,397). USAF's FY27 position $1,000; no other service logs one.
    const T900 = ['ok', 'ACE TIE-OUT - MAPPING BY REQUIREMENT  (2027ACE, FY27)', [['Req A', 1100, 900, 200], ['Req R', 630, '', '']], [['FY27', 'AV', 900, 1730, 830]]];
    const T333 = ['ok', 'ACE TIE-OUT - MAPPING BY REQUIREMENT  (2026ACE, FY27)', [['Req A', 1100, 333, 767], ['Req R', 630, '', '']], [['FY27', 'AV', 333, 1730, 1397]]];
    const POS = ['ok', [['USAF', 1000], ['ANG', '—'], ['AFRC', '—'], ['TOTAL', 1000]]];
    const SCREEN = [['2027ACE'], ['By PMO']];
    const view = () => ev(`cycView(${J(key)}); 'ok'`), leave = () => ev(`cycLeave(); 'ok'`);
    // ---- CONTROL: PB27 viewed, nothing chosen
    view();
    w5Chk(name, 'PB27 viewed, nothing chosen', 'CONTROL — the Spend Plan shows 2027ACE by PMO; the ACE tie-out ties out 2027ACE ($900); the FYDP Spend Plan prints USAF’s FY27 position, $1,000',
      J([onScreen(), await tie(), await pos()]), J([SCREEN, T900, POS]));
    // ---- EACH CHOICE, with PB27 on screen; the status line is read at once ('Not kept' is put in front of a message for 1.5 s only)
    const fa = press('setSpAce(this.value)', '2026ACE'), ka = notKept();
    w5Chk(name, 'PB27 viewed · Cost data set to 2026ACE in its select', 'refused and said so; the Spend Plan still shows 2027ACE, and the ACE tie-out taken from the view ties out 2027ACE ($900)',
      J([fa, ka, onScreen(), await tie()]), J(['fired', true, SCREEN, T900]));
    const fb = press("setSpBy('svc')"), kb = notKept(), fp = press('setSpPrior(!spPrior)'), kp = notKept();
    w5Chk(name, 'PB27 viewed · By Service, then ◀ prior 2 FY, pressed', 'each refused and said so; the Spend Plan is still by PMO, without the prior years',
      J([fb, kb, fp, kp, onScreen()]), J(['fired', true, 'fired', true, SCREEN]));
    ev(`setSpPmo('AV'); setSpSvc('USAF'); setSpDrillSvc('USAF'); 'ok'`); const kf = notKept();
    w5Chk(name, 'PB27 viewed · the PMO filter, the service filter and the PMO drill’s service set (the handlers their controls call)', 'each refused and said so; each is still all',
      J([kf, ev('JSON.stringify([spPmo, spSvc, spDrillSvc])')]), J([true, J(['ALL', 'ALL', 'ALL'])]));
    ev(`ppCyc='PB'; ppYr=MS.cur; ppSetV('USAF', ppLines(ppPos(),'USAF')[0].k, MS.cur, 'd', '5000'); 'ok'`); const kv = notKept();
    w5Chk(name, 'PB27 viewed · USAF’s FY27 PPBE position typed as $5,000', 'refused and said so; the FYDP Spend Plan taken from the view prints the position as logged, $1,000',
      J([kv, await pos()]), J([true, POS]));
    const fd = ev(`(function(){ if(!entOpen) toggleEnt(); var i=flowEnts().findIndex(function(e){ return e.n==='Lockheed Martin'; });
      var s=[].slice.call(document.querySelectorAll('#entBody select')).filter(function(e){ return (e.getAttribute('onchange')||'')==='flowSetEnt('+i+',"kind",this.value)'; })[0];
      if(!s) return 'no control'; s.value='gov'; s.dispatchEvent(new Event('change', {bubbles:true})); return 'fired'; })()`), kd = notKept();
    const kinds = ev(`JSON.stringify([flowEnts().filter(function(e){ return e.n==='Lockheed Martin'; }).map(function(e){ return e.kind; }),
      ((JSON.parse(localStorage.getItem(DEST_KEY)||'null')||{}).ents||[]).filter(function(e){ return e.n==='Lockheed Martin'; }).map(function(e){ return e.kind; })])`);
    ev(`if(entOpen) toggleEnt(); 'ok'`);
    w5Chk(name, 'PB27 viewed · Lockheed Martin’s kind set to government in Setup › Destinations', 'refused and said so; it is still a prime contractor, in the board and in browser storage',
      J([fd, kd, kinds]), J(['fired', true, J([['prime'], ['prime']])]));
    leave();
    w5Chk(name, 'PB27 viewed · each choice refused · the view left', 'the working plan’s Spend Plan shows 2027ACE by PMO, browser storage keeps 2027ACE, and its ACE tie-out ties out 2027ACE ($900)',
      J([onScreen(), stored(), await tie()]), J([SCREEN, '2027ACE', T900]));
    // ---- CONTROL: on the working plan the choice is open, kept, and the tie-out reads it
    const fw = press('setSpAce(this.value)', '2026ACE');
    w5Chk(name, 'the working plan · Cost data set to 2026ACE (allowed)', 'CONTROL — the Spend Plan’s Cost data shows 2026ACE, browser storage keeps it, and the ACE tie-out ties out 2026ACE ($333)',
      J([fw, onScreen()[0], stored(), await tie()]), J(['fired', ['2026ACE'], '2026ACE', T333]));
    w5Chk(name, 'harness', 'CONTROL — no jsdom script errors', J(X.errors.length), J(0));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v2.00 (U10, the spend plan's choices) ====
// ==== v2.00 (U10, the files, packages, ladder and shared copies): a file, a package, the ladder or a shared copy is refused in a locked view before anything is kept ====
// The doors the round-2 reviews of 13 Oct and the builder's second door scan found beside the ones the blocks above close. Each
// wrote something no part of the view's copy -- this appropriation's browser storage, another appropriation's board, a list every
// appropriation shares, a kept-aside copy, the shared folder's record -- or handed a file out, and only then met the view's
// refusal, so the board said "Not kept" and kept it: a returned package taken through Import one appropriation put 77777 for K1
// into every export once the board reopened, and the work typed after the save was in no copy; a state file carrying cost
// estimates kept them (the ACE tie-out read $4,321,000 for $900); the band ladder copied to Full Fund replaced its own; a package
// issued, returned or sent back carried the cycle as the board; the shared state file kept the cycle aside as this browser's work;
// a Live refresh from the shared folder did the same and recorded the folder's newer copy as the one the work came from, so the
// first refresh after leaving the view replaced that work, kept nowhere. A cost estimate, BAE list or CCaR file whose import
// started on the working plan, with PB27 put on screen while it was read, was kept too. Boards of two AV requirements -- A (USAF 900, ANG 200, on RCN 11111 / EEIC AAAAA, confirmed on WBS
// 1.1) and R (USAF 503, ANG 127, no code) -- with an approved 2027 estimate (AV, 1.1, $900); PB27 locked; then the working plan
// gives A the description WORK DESC A. Each door is used through the handler its control calls, with PB27 on screen (or put on
// screen while the file is read), and then the status line, the questions asked, browser storage, the file handed out and the
// cells of the exports the door reaches are read -- every figure typed here. FAILS ON 7ee498a (board fce8a391) and on U10 1-3.
// CONTROLS: on the working plan each door is open and does what it did before.
await (async () => {
  const name = 'v2.00 (U10) — a file, a package, the band ladder or a shared copy is refused in a locked view before anything is kept';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  const boards = [];
  try {
    const J = JSON.stringify;
    // one board, booted twice so it holds requirement data of its own (not the empty template), PB27 locked, then WORK DESC A
    const mk = () => {
      const X0 = boot(); boards.push(X0);
      seed(X0.ev, { services: ['USAF', 'ANG', 'AFRC'], items: [it('A', 'AV', [900, 200, 0]), it('R', 'AV', [503, 127, 0])], disc: [5000, 5000, 5000], mand: [0, 0, 0], order: ['A', 'R'] });
      X0.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
        MS.rcn=[{k:'K1', rcn:'11111', eeic:'AAAAA', t:'', svc:['USAF','ANG','AFRC']}]; S.rcnAsg={A:'K1'};
        S.wbs={A:[{w:'1.1', v:[]}]}; S.aceMap={A:{w:['1.1'], ok:true}};
        ACEDB.sets={'2027ACE':{lines:[{ap:mySlug(), pmo:'AV', wbs:'1.1', v:{}}], locked:true, by:'Approver', ts:1, file:'2027 ACE approved.xlsx'}};
        ACEDB.sets['2027ACE'].lines[0].v[MS.cur]=900; aceYr='all'; persistAce(); applyState(S); save(); 'ok'`);
      const ls = JSON.parse(X0.ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })()`));
      const X = boot({ ls }); boards.push(X);
      const ev = c => { try { return X.ev(c); } catch (e) { return 'threw: ' + String((e && e.message) || e).slice(0, 100); } };
      ev(`globalThis.__wb=function(sheets, name){ var b=buildXlsx(sheets); return {name:name, arrayBuffer: async function(){ __reads++; return b.buffer.slice(b.byteOffset, b.byteOffset+b.byteLength); }}; };
        globalThis.__reads=0;
        globalThis.__aceRows=function(){ var rows=[[],[],[],[],[]]; rows[4][ACE_COL.y0]=2027; var r=[]; r[ACE_COL.appn]='O&M'; r[ACE_COL.svc]='USAF';
          r[ACE_COL.managed]='Y'; r[ACE_COL.pmo]='AIR VEHICLE'; r[ACE_COL.y0]=4.321; r[ACE_COL.ce]='CE1'; rows.push(r);
          rows.forEach(function(x){ for(var i=0;i<x.length;i++) if(x[i]===undefined) x[i]=''; }); return rows; };
        // what a download hands out: the text of every Blob made while the code runs
        globalThis.__handed=function(code){ var got=[], _B=window.Blob;
          window.Blob=function(p,o){ try{ (p||[]).forEach(function(x){ if(typeof x==='string' && x.indexOf('spmtPkg')>=0) got.push(x); }); }catch(e){} return new _B(p,o); };
          try{ (0,eval)(code); }catch(e){ got.push('threw '+String((e&&e.message)||e)); } window.Blob=_B; return JSON.stringify(got); };
        'ok'`);
      const key = ev(`window.confirm=function(){ return true; }; MS.base=MS.cur; MS.years[MS.cur]=S; save(); blCyc='PB'; blYr=MS.cur; cycLock(); blKey('PB', MS.cur)`);
      ev(`setDesc('A','WORK DESC A'); 'ok'`);
      return { X, ev, key };
    };
    const said = ev => ev(`(document.getElementById('shareStat')||{}).textContent||''`);
    const spy = ev => ev(`window.__asked=[]; window.confirm=function(m){ window.__asked.push(String(m).split('\\n')[0].slice(0,70)); return true; };
      window.alert=function(m){ window.__asked.push('alert: '+String(m).split('\\n')[0].slice(0,70)); }; 'ok'`);
    const asked = ev => JSON.parse(ev(`JSON.stringify(window.__asked||[])`));
    const wait = (X, ms) => X.ev(`new Promise(function(r){ setTimeout(r, ${ms}); })`);
    const fileOf = (ev, text, nm) => ev(`(function(){ globalThis.__f=new File([${J(text)}], ${J(nm)}, {type:'application/json'}); return 'ok'; })()`);
    // this appropriation's own copy in browser storage: its RCN codes and its descriptions
    const own = ev => JSON.parse(ev(`(function(){ var s=JSON.parse(localStorage.getItem(_AP.key)||'null'); if(!s) return 'null';
      var y=(s.years||{})[String(s.cur)]||{}; return JSON.stringify([(s.rcn||[]).map(function(e){ return e.rcn; }), (y.desc||{}).A||'', (y.desc||{}).R||'']); })()`));
    const keptAside = ev => ev(`(function(){ var k=localStorage.getItem(_AP.key+'.kept'); if(!k) return 'none'; var i=k.indexOf('\\n'), m=JSON.parse(k.slice(0,i)), s=JSON.parse(k.slice(i+1));
      var y=(s.years||{})[String(s.cur)]||{}; return JSON.stringify([m.why, (y.desc||{}).A||'']); })()`);
    const hdr = (rows, ...must) => rows.findIndex(r => must.every(m => (r || []).some(c => String(c ?? '').trim() === m)));
    const col = (rows, h, n) => (rows[h] || []).findIndex(c => String(c ?? '').trim() === n);
    // the codes every export carries: RCN-EEIC by Month's summary, and the Spend Plan Source's lines [$, EEIC, RCN]
    const codes = async W => { const bk = JSON.parse(await w6Book(W, 'exportExcel')), rc = bk['RCN-EEIC by Month'] || [];
      const iReq = rc.findIndex(r => w6Lbl(r) === 'WHICH REQUIREMENTS SIT UNDER EACH COMBINATION');
      const sb = JSON.parse(await w6Book(W, 'exportSrc')), src = (Object.values(sb).find(rs => (rs || []).length > 1) || []).slice(1);
      return [bk.__err || 'ok', sb.__err || 'ok', v198Sec(rc, 0, iReq).map(r => r.slice(0, 3)),
        src.map(r => [num(r[9]), String(r[26] ?? ''), String(r[27] ?? '')]).sort((a, b) => a[0] - b[0])]; };
    // the ACE tie-out's Mapping by Requirement: [requirement, match, WBS, board funded, estimate, delta]
    const tie = async W => { const ab = JSON.parse(await w6Book(W, 'exportAceTieout')), mp = ab['Mapping by Requirement'] || [], mh = hdr(mp, 'FY', 'PMO', 'Board funded');
      return [ab.__err || 'ok', mp.slice(mh + 1).filter(r => /^FY\d\d$/.test(w6Lbl(r))).map(r => ['Requirement (CCaR Record Name)', 'Match', 'WBS claimed', 'Board funded', 'Estimate', 'Delta'].map(n => r[col(mp, mh, n)] ?? ''))]; };
    // BY HAND. A's $1,100 sits on 11111 / AAAAA (USAF 900, ANG 200); R's $630 on no code (USAF 503, ANG 127); AFRC carries nothing,
    // and its section prints a total of 0. The approved 2027ACE ties out A: $900 against $1,100 on 1.1, delta 200.
    const N = v198NONE, K1 = '11111 / AAAAA';
    const CODES = ['ok', 'ok', [['USAF', K1, 900], ['USAF', N, 503], ['USAF', 'USAF TOTAL', 1403], ['ANG', K1, 200], ['ANG', N, 127], ['ANG', 'ANG TOTAL', 327], ['AFRC', 'AFRC TOTAL', 0]],
      [[127, '', ''], [200, 'AAAAA', '11111'], [503, '', ''], [900, 'AAAAA', '11111']]];
    const TIE = ['ok', [['Req A', 'Confirmed - exact line', '1.1', 1100, 900, 200], ['Req R', 'No match', '', 630, '', '']]];
    const OFF = what => '🔒 ' + what + ' is off while PB27 is on screen. It is a locked cycle, read only — the change was not kept. ↩ Leave the view to work the plan.';

    // ==== 1. a returned package, through Import one appropriation (MF1), and the same with PB27 put on screen while it is read
    {
      const { X, ev, key } = mk();
      const issued = JSON.parse(ev(`__handed("pkgIssue(mySlug(), true)")`)).map(t => JSON.parse(t))[0];
      const ret = JSON.parse(J(issued)); ret.dir = 'return'; ret.by = 'Manager M'; ret.ts = Date.now() + 1000;
      ret.ms.rcn = [{ k: 'K1', rcn: '77777', eeic: 'AAAAA', t: '', svc: ['USAF', 'ANG', 'AFRC'] }];
      ret.ms.years[String(ret.ms.cur)].desc = Object.assign({}, ret.ms.years[String(ret.ms.cur)].desc || {}, { R: 'MGR DESC R' });
      const fileHtml = ev(`buildSavedHtml()`);                 // the board saved to its file
      ev(`setDesc('A','UNSAVED EDIT A'); 'ok'`);                 // then one more edit, in browser storage only
      const OWN = [['11111'], 'UNSAVED EDIT A', ''];
      ev(`cycView(${J(key)}); 'ok'`); spy(ev); fileOf(ev, J(ret), 'ORBIT PACKAGE - O&M - return 1.json');
      ev(`importState({files:[__f], value:''}); 'ok'`); const st1 = said(ev); await wait(X, 2000);
      w5Chk(name, 'PB27 viewed · the manager’s return (K1 → 77777, MGR DESC R) taken through Import one appropriation', 'refused before the file is read or a question asked, and the status line says so; browser storage still holds 11111 and UNSAVED EDIT A',
        J([st1, asked(ev), own(ev)]), J([OFF('Importing a file'), [], OWN]));
      ev(`cycLeave(); 'ok'`);
      w5Chk(name, 'PB27 viewed · the return refused · the view left', 'the working plan’s exports carry 11111 for A and no 77777; browser storage as it was',
        J([await codes(X.w), own(ev)]), J([CODES, OWN]));
      // the same browser, reopened over the file saved before the view
      const lsNow = JSON.parse(ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })()`));
      const Y = boot({ html: fileHtml, ls: lsNow }); boards.push(Y);
      w5Chk(name, 'PB27 viewed · the return refused · the browser reopened over the saved file', 'the board reopens on the work typed after the save (UNSAVED EDIT A), and its exports carry 11111 for A, no 77777',
        J([Y.ev(`(S.desc||{}).A||''`), await codes(Y.w)]), J(['UNSAVED EDIT A', CODES]));
      // started on the working plan; PB27 put on screen before the file is read
      spy(ev); fileOf(ev, J(ret), 'ORBIT PACKAGE - O&M - return 1.json');
      ev(`importState({files:[__f], value:''}); cycView(${J(key)}); 'ok'`); await wait(X, 2000);
      w5Chk(name, 'the return taken on the working plan, PB27 put on screen before the file is read', 'refused once it is read, nothing asked; browser storage still holds 11111 and UNSAVED EDIT A',
        J([said(ev), asked(ev), own(ev)]), J([OFF('Importing a file'), [], OWN]));
      ev(`cycLeave(); 'ok'`);
      // CONTROL: on the working plan the return is merged (asked first), and every export carries 77777 for A
      spy(ev); fileOf(ev, J(ret), 'ORBIT PACKAGE - O&M - return 1.json');
      ev(`importState({files:[__f], value:''}); 'ok'`); await wait(X, 2000);
      const q = asked(ev).map(m => m.split(' — ')[0].split(' the returned')[0]);
      w5Chk(name, 'the working plan · the return taken (allowed)', 'CONTROL — asked (the conflict, then the merge), merged: browser storage and every export carry 77777 for A, and MGR DESC R',
        J([q, own(ev), await codes(X.w)]),
        J([['CONFLICT', 'Merge'], [['77777'], 'WORK DESC A', 'MGR DESC R'],
          ['ok', 'ok', [['USAF', '77777 / AAAAA', 900], ['USAF', N, 503], ['USAF', 'USAF TOTAL', 1403], ['ANG', '77777 / AAAAA', 200], ['ANG', N, 127], ['ANG', 'ANG TOTAL', 327], ['AFRC', 'AFRC TOTAL', 0]],
            [[127, '', ''], [200, 'AAAAA', '77777'], [503, '', ''], [900, 'AAAAA', '77777']]]]));
    }

    // ==== 2. a state file carrying a cost estimate beside its years (SF4)
    {
      const { X, ev, key } = mk();
      const stf = JSON.parse(ev(`JSON.stringify(MS)`));
      stf.aceDb = { sets: { '2028ACE': { lines: [{ ap: 'om', pmo: 'AV', wbs: '1.1', v: { [String(stf.cur)]: 4321000 } }], locked: true, by: 'Someone', ts: 9, file: '2028 ACE.xlsx' } } };
      const sets = () => ev(`JSON.stringify([Object.keys(ACEDB.sets||{}).sort(), Object.keys((JSON.parse(localStorage.getItem('prio27acedb')||'{}').sets)||{}).sort()])`);
      ev(`cycView(${J(key)}); 'ok'`); spy(ev); fileOf(ev, J(stf), 'board-state.json');
      ev(`importState({files:[__f], value:''}); 'ok'`); const st2 = said(ev); await wait(X, 2000);
      w5Chk(name, 'PB27 viewed · a state file carrying a 2028 estimate ($4,321,000 on 1.1) taken through Import one appropriation', 'refused before the file is read; the estimates in the board and in browser storage are 2027ACE alone, and the ACE tie-out from the view ties out $900',
        J([st2, asked(ev), sets(), await tie(X.w)]), J([OFF('Importing a file'), [], J([['2027ACE'], ['2027ACE']]), TIE]));
      ev(`cycLeave(); 'ok'`);
      w5Chk(name, 'PB27 viewed · the state file refused · the view left', 'the working plan’s estimates are 2027ACE alone, and its ACE tie-out ties out $900',
        J([sets(), await tie(X.w)]), J([J([['2027ACE'], ['2027ACE']]), TIE]));
      // CONTROL: on the working plan the state file is taken (asked first) with the estimate it carries
      spy(ev); ev(`importState({files:[__f], value:''}); 'ok'`); await wait(X, 2000);
      w5Chk(name, 'the working plan · the state file taken (allowed)', 'CONTROL — asked, taken: the board and browser storage hold 2027ACE and 2028ACE',
        J([asked(ev).length, sets()]), J([1, J([['2027ACE', '2028ACE'], ['2027ACE', '2028ACE']])]));
    }

    // ==== 3. the workbook imports: refused before the file is read in a view, and once it is read when a view was put on screen meanwhile
    {
      const { X, ev, key } = mk();
      const lists = () => JSON.parse(ev(`JSON.stringify((function(){ var s=ACEDB.sets['2027ACE'], a=JSON.parse(localStorage.getItem('prio27acedb')||'null'), b=JSON.parse(localStorage.getItem('prio27buddb')||'null'), t=a&&a.sets&&a.sets['2027ACE'];
        return [s? [s.file||'', s.lines.map(function(l){ return (l.v||{})[MS.cur]; })] : null, t? [t.file||'', t.lines.map(function(l){ return (l.v||{})[MS.cur]; })] : null,
          (BUDDB.rows||[]).map(function(r){ return r.n; }), b? (b.rows||[]).map(function(r){ return r.n; }) : null]; })())`));
      const LISTS = [['2027 ACE approved.xlsx', [900]], ['2027 ACE approved.xlsx', [900]], [], null];
      const FILES = {
        ace: ['Importing a cost estimate', `importAce({files:[__wb([{name:'ACE', rows:__aceRows()}], '2027 ACE.xlsx')], value:''})`],
        bud: ['Importing a BAE budget list', `importBud({files:[__wb([{name:'BAE', rows:[['Budget Name'], ['USAF O&M - ANG CAM ZZ9 Discretionary AV']]}], 'BAE.xlsx')], value:''})`],
        ccar: ['Importing CCaR records', `importCcarRecs({files:[__wb([{name:'CCaR', rows:[['CCaR No','Title','OPR','PMO','Control No'], ['CCA','REFUSED TITLE A','REFUSED OPR','AV','7001']]}], 'ccar-records.xlsx')], value:''})`] };
      // with PB27 on screen: the file is never read
      for (const k of ['ace', 'bud', 'ccar']) {
        const [door, code] = FILES[k];
        ev(`cycView(${J(key)}); __reads=0; 'ok'`); spy(ev);
        await ev(code);
        w5Chk(name, 'PB27 viewed · ' + door.toLowerCase().replace(/^importing /, '') + ' imported', 'refused before the file is read (it is read 0 times, nothing asked); the lists in the board and in browser storage as they were',
          J([said(ev), ev('__reads'), asked(ev), lists()]), J([OFF(door), 0, [], LISTS]));
        ev(`cycLeave(); 'ok'`);
      }
      // started on the working plan; PB27 put on screen before the file has been read (the import's first wait)
      for (const k of ['ace', 'bud', 'ccar']) {
        const [door, code] = FILES[k];
        spy(ev);
        await ev(`(function(){ var p=${code}; cycView(${J(key)}); return p; })()`);
        w5Chk(name, 'an import of ' + door.toLowerCase().replace(/^importing /, '') + ' started on the working plan, PB27 put on screen while the file is read', 'refused once it is read, nothing asked; the lists as they were, and the ACE tie-out from the view ties out $900',
          J([said(ev), asked(ev), lists(), await tie(X.w)]), J([OFF(door), [], LISTS, TIE]));
        ev(`cycLeave(); 'ok'`);
      }
      w5Chk(name, 'the three races · the view left', 'the working plan’s lists as they were, and its ACE tie-out ties out $900', J([lists(), await tie(X.w)]), J([LISTS, TIE]));

      // ==== 4. the band ladder copied to the other appropriations (MF2): Full Fund's own ladder is "FF ONLY BAND", F1 banded in it
      ev(`localStorage.setItem(_SLUGMAP.ff.key, JSON.stringify({base:2027, cur:2027, ts:5, years:{'2027':{order:[], band:{F1:'ffb'}}}, bands:[{id:'ffb', n:'FF ONLY BAND', rule:'', c:'#336699'}], bandsTs:5})); 'ok'`);
      const ff = () => ev(`JSON.stringify([((JSON.parse(localStorage.getItem(_SLUGMAP.ff.key))||{}).bands||[]).map(function(b){ return b.n; }), localStorage.getItem(BAND_PEND_KEY('ff'))===null])`);
      ev(`cycView(${J(key)}); 'ok'`); spy(ev);
      ev(`bandCopyAll(); 'ok'`);
      w5Chk(name, 'PB27 viewed · ⇉ Copy to the other appropriations', 'refused before anything is asked; Full Fund keeps its own ladder, and no ladder is held for it',
        J([said(ev), asked(ev), ff()]), J([OFF('Copying the band ladder'), [], J([['FF ONLY BAND'], true])]));
      ev(`cycLeave(); 'ok'`);

      // ==== 5. the packages: issued, pushed, returned, sent back (SF1)
      ev(`MS.pkg={ap:mySlug(), seq:3, baseSig:'SIG3', by:'Lead L', ts:1}; save(); 'ok'`);
      const seq = () => ev(`(JSON.parse(localStorage.getItem(_AP.key)||'{}').sync||{}).seq||0`);
      const PKGS = [['pkgIssue(mySlug(), true)', 'Issuing a package'], ['pkgPushAll()', 'Pushing baselines to the managers'],
        ['pkgReturn()', 'Saving a return package'], ['pkgSendBack(mySlug())', 'Sending a package back']];
      for (const [code, door] of PKGS) {
        ev(`cycView(${J(key)}); 'ok'`); spy(ev);
        const handed = JSON.parse(ev(`__handed(${J(code)})`)); await wait(X, 600);
        w5Chk(name, 'PB27 viewed · ' + code, 'refused before anything is asked or handed out; no file, and the package record as it was',
          J([said(ev), asked(ev), handed.length, seq()]), J([OFF(door), [], 0, 0]));
        ev(`cycLeave(); 'ok'`);
      }
      // CONTROL: on the working plan each hands out the working plan (A described WORK DESC A)
      spy(ev);
      const hw = ['pkgIssue(mySlug(), true)', 'pkgReturn()', 'pkgSendBack(mySlug())'].map(c => JSON.parse(ev(`__handed(${J(c)})`)).map(t => { const p = JSON.parse(t);
        return [p.dir, ((p.ms.years[String(p.ms.cur)] || {}).desc || {}).A || '']; }));
      w5Chk(name, 'the working plan · a package issued, a return saved, the appropriation sent back (allowed)', 'CONTROL — each hands out one file carrying the working plan (WORK DESC A)',
        J(hw), J([[['issue', 'WORK DESC A']], [['return', 'WORK DESC A']], [['return', 'WORK DESC A']]]));

      // CONTROL: on the working plan the ladder is copied, and Full Fund takes it
      ev(`bandCopyAll(); 'ok'`);
      w5Chk(name, 'the working plan · ⇉ Copy to the other appropriations (allowed)', 'CONTROL — Full Fund’s ladder is now this one (no FF ONLY BAND), and one is held for it',
        J([JSON.parse(ff())[0].includes('FF ONLY BAND'), JSON.parse(ff())[0].length > 1, JSON.parse(ff())[1]]), J([false, true, false]));
    }

    // ==== 6. the shared state file loaded (adoptShared), with work in this browser no saved copy has
    {
      const { ev, key } = mk();
      ev(`SHARED=JSON.parse(JSON.stringify(MS)); SHARED.ts=MS.ts+60000; SHARED.by='Colleague C'; SHARED.years[String(MS.cur)].desc={R:'SHARED DESC R'}; baseSet({dirty:true}); DIRTY=false; 'ok'`);
      ev(`cycView(${J(key)}); 'ok'`); spy(ev); ev(`adoptShared(); 'ok'`);
      w5Chk(name, 'PB27 viewed · the shared state file loaded (adoptShared)', 'refused, and the status line says so; nothing is kept aside, and the work is still this browser’s unsaved work',
        J([said(ev), keptAside(ev), own(ev), ev('!!baseGet().dirty')]), J([OFF('Loading the shared state file'), 'none', [['11111'], 'WORK DESC A', ''], true]));
      ev(`cycLeave(); 'ok'`);
    }
    {
      // CONTROL, on a board of its own: on the working plan the shared state file is loaded, the work kept aside first
      const { ev } = mk();
      ev(`SHARED=JSON.parse(JSON.stringify(MS)); SHARED.ts=MS.ts+60000; SHARED.by='Colleague C'; SHARED.years[String(MS.cur)].desc={R:'SHARED DESC R'}; baseSet({dirty:true}); DIRTY=false;
        adoptShared(); 'ok'`);
      w5Chk(name, 'the working plan · the shared state file loaded (allowed)', 'CONTROL — the work is kept aside first (WORK DESC A), and the shared copy is loaded (SHARED DESC R)',
        J([keptAside(ev), own(ev)]), J([J(['sidecar', 'WORK DESC A']), [['11111'], '', 'SHARED DESC R']]));
    }

    // ==== 7. a Live refresh from the shared folder finding a colleague's newer copy, with work in this browser no saved copy has
    {
      const { X, ev, key } = mk();
      const files = {};
      const dir = { kind: 'directory', name: 'shared', queryPermission: async () => 'granted', requestPermission: async () => 'granted',
        getFileHandle: async (n, o) => { if (!(n in files)) { if (o && o.create) files[n] = ''; else { const e = new Error('not found'); e.name = 'NotFoundError'; throw e; } }
          return { kind: 'file', name: n, getFile: async () => { const c = files[n]; return { text: async () => c }; },
            createWritable: async () => { let buf = ''; return { write: async x => { buf += String(x); }, close: async () => { files[n] = buf; } }; } }; },
        getDirectoryHandle: async () => dir, removeEntry: async n => { delete files[n]; },
        values: async function* () { for (const n of Object.keys(files)) yield { kind: 'file', name: n, getFile: async () => ({ text: async () => files[n] }) }; } };
      X.w.__fold = dir;
      ev(`_liveCfg=Object.assign(liveCfg(), {store:true, mode:'drive', on:false}); _driveDir=globalThis.__fold; 'ok'`);
      const pushed = await X.ev('driveStorePush(false)');
      const fn = Object.keys(files).find(n => /^spmt-2027-om\.json$/.test(n));
      const j = JSON.parse(files[fn]); j.store.ts = (+j.store.ts || 0) + 60000; j.ts = j.store.ts; j.by = 'Colleague C'; j.store.by = 'Colleague C';
      j.store.years[String(j.store.cur)].desc = Object.assign({}, j.store.years[String(j.store.cur)].desc || {}, { R: 'COLLEAGUE DESC R' });
      files[fn] = J(j);
      ev(`setDesc('A','MY UNSAVED A'); DIRTY=false; 'ok'`);        // typed, kept in browser storage only; then a new session
      ev(`cycView(${J(key)}); 'ok'`); spy(ev);
      const p1 = await X.ev('driveStorePull(true)');
      w5Chk(name, 'PB27 viewed · a Live refresh finds Colleague C’s newer copy in the shared folder', 'nothing loaded, nothing kept aside, and the work is still this browser’s unsaved work',
        J([pushed, p1, keptAside(ev), own(ev), ev('!!baseGet().dirty')]), J([true, false, 'none', [['11111'], 'MY UNSAVED A', ''], true]));
      const p2 = await X.ev('driveStorePull(false)');
      w5Chk(name, 'PB27 viewed · 📡 Connect (a refresh that speaks)', 'refused, and the status line says so', J([p2, said(ev)]), J([false, OFF('Loading from the shared folder')]));
      ev(`cycLeave(); 'ok'`);
      const p3 = await X.ev('driveStorePull(true)');
      w5Chk(name, 'PB27 viewed · the view left · the next Live refresh', 'the work (MY UNSAVED A) is kept aside first, and Colleague C’s copy is loaded (COLLEAGUE DESC R)',
        J([p3, keptAside(ev), own(ev)]), J([true, J(['folder', 'MY UNSAVED A']), [['11111'], 'WORK DESC A', 'COLLEAGUE DESC R']]));
    }
    w5Chk(name, 'harness', 'CONTROL — no jsdom script errors', J(boards.reduce((n, B) => n + B.errors.length, 0)), J(0));
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v2.00 (U10, the files, packages, ladder and shared copies) ====
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
