// Mutation sweep: break the export math on purpose, one edit at a time, and check that the audit
// suites notice. A suite that passes a mutated board is not protecting that line.
//
//   npm run mutate            all mutations
//   npm run mutate -- lane    only mutations whose id or area contains "lane"
//
// Every mutation must match its target EXACTLY ONCE. A mutation that fails to apply is reported as
// NOT APPLIED, never as caught or survived — otherwise a stale search string would masquerade as
// proof that a line is covered.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
// Which build to sweep. There are two now, and parity.mjs proves their math is byte-identical,
// so a clean sweep of one covers both — but 'proves' is worth checking rather than trusting.
const BOARD = process.env.BOARD || join(HERE, '..', '..', 'prioritization-board.html');
const SUITES = [
  ['excel', join(HERE, 'audit.mjs')],
  ['ppt', join(HERE, 'audit-ppt.mjs')],
  ['other', join(HERE, 'audit-other.mjs')],
  // The board derives figures it never exports — the cumulative among them. Without a suite that
  // can see them, a mutation to those lines passes everything and proves nothing.
  ['board', join(HERE, 'audit-board.mjs')],
];

// area: which surface the line belongs to. find/replace: the deliberate break.
const MUTATIONS = [
  // ---- the lane engine: the basis for every printed figure ------------------------------------
  // ---- the spend forecast: where the money lands, month by month -------------------------------
  { id: 'fc-weights-not-dollars', area: 'monSpreadOf', what: 'increments back to weights against the whole funded amount',
    find: '          const dAmt=w[j]*dScale;          // discretionary: literally this increment',
    repl: '          const dAmt=fsv*w[j]/wsum;        // discretionary: literally this increment' },
  { id: 'fc-drops-unscheduled', area: 'monSpreadOf', what: 'unscheduled discretionary silently dropped instead of held',
    find: '        unsch[i]+=Math.max(0, dsv-dPlaced);',
    repl: '        unsch[i]+=0;' },
  { id: 'fc-plan-literal', area: 'forecast', what: 'a modelled plan spreads increments as dollars, stranding its topline in UNSCHEDULED',
    find: '  const literal = !fundOf;', repl: '  const literal = true;' },
  { id: 'fc-board-weighted', area: 'forecast', what: "the board's own forecast goes back to weights, inflating every month",
    find: '  const literal = !fundOf;', repl: '  const literal = false;' },
  { id: 'fc-mand-not-carried', area: 'monSpreadOf', what: 'mandatory left out of the forecast entirely',
    find: '          const mAmt=msv*w[j]/wsum;        // mandatory: no increments of its own, rides the same dates',
    repl: '          const mAmt=0;                    // mandatory: no increments of its own, rides the same dates' },

  // ---- the incremental-funding residual: the number that goes on a contract mod ----------------
  { id: 'inc-residual-netted', area: 'fillLastAwd', what: 'residual netted across services instead of computed per service',
    find: '    const alloc=(p.d[i]||0);',
    repl: '    const alloc=SVC.reduce((q,s2,j)=>q+(p.d[j]||0),0)/SVC.length;' },
  { id: 'inc-residual-basis', area: 'fillLastAwd', what: 'residual reverts to discretionary + mandatory instead of discretionary alone',
    find: '    const alloc=(p.d[i]||0);', repl: '    const alloc=(p.d[i]||0)+(p.m[i]||0);' },
  { id: 'inc-residual-ignores-prior', area: 'fillLastAwd', what: 'last increment set to the whole allocation, ignoring earlier increments',
    find: '    last.sv[i]=Math.max(0, Math.round(alloc-others));',
    repl: '    last.sv[i]=Math.max(0, Math.round(alloc));' },

  // ---- the scoreboard tiles and the discretionary fit strip ------------------------------------
  // Board-only figures: nothing here reaches an export, so only audit-board.mjs can see them. They
  // are what someone reads before deciding where the cutline falls, which makes them worth as much
  // as anything printed.
  { id: 'sb-left-unfloored', area: 'scoreboard', equivalent: 'dRem is clamped at 0 by every draw, so it can never be negative — audit-board.mjs asserts that invariant',
    what: 'discretionary left nets an overdrawn lane against a healthy one',
    find: '  const dBA=discTot(), mBA=mandTot();\n  const dLeft=T.__rem.dRem.reduce((a,b)=>a+Math.max(0,b),0);',
    repl: '  const dBA=discTot(), mBA=mandTot();\n  const dLeft=T.__rem.dRem.reduce((a,b)=>a+b,0);' },
  { id: 'sb-floor-drops-mc', area: 'scoreboard', what: 'program floor reverts to the discretionary BA alone',
    find: '  const floor=discTot()+mcNeed;', repl: '  const floor=discTot();' },
  { id: 'sb-mc-coverage', area: 'scoreboard', what: 'MC drawn-from-mandatory reads the discretionary draw',
    find: '  S.order.forEach(id=>{ if(S.mc[id]&&T[id]){ mcCov+=T[id].mT; mcUnf+=T[id].uT; } });',
    repl: '  S.order.forEach(id=>{ if(S.mc[id]&&T[id]){ mcCov+=T[id].dT; mcUnf+=T[id].uT; } });' },
  { id: 'fit-left-unfloored', area: 'fitBySvc', equivalent: 'a service can never draw more discretionary than its BA — audit-board.mjs asserts that invariant',
    what: 'per-service discretionary left allowed to go negative',
    find: 'left:Math.max(0,ba-d)', repl: 'left:(ba-d)' },
  { id: 'fit-over-drops-unf', area: 'fitBySvc', what: 'what went past the lane forgets the unfunded part',
    find: 'over:m+u}', repl: 'over:m}' },
  { id: 'fit-count-disc', area: 'fitCounts', what: '"fits in disc" counts rows that also spilled',
    find: '    if(t.dT>0.005 && t.mT<=0.005 && t.uT<=0.005) disc++; });',
    repl: '    if(t.dT>0.005) disc++; });' },
  { id: 'sb-split-as-mand', area: 'tierTotals', what: 'split D+M rows counted as fully mandatory',
    find: '    else if(p.mT>0.005 && p.dT>0.005) splitN++;',
    repl: '    else if(p.mT>0.005 && p.dT>0.005) mN++;' },
  { id: 'svcshort-netted', area: 'svcShort', what: 'unfunded-by-service piles every service onto the first',
    find: '  S.order.forEach(id=>{ const p=T[id]; if(p) p.u.forEach((v,i)=>u[i]+=v); });',
    repl: '  S.order.forEach(id=>{ const p=T[id]; if(p) p.u.forEach((v,i)=>u[0]+=v); });' },

  // ---- svcAlloc: how a TRIMMED allocation splits across services -------------------------------
  // Added after a review found this function carried no mutation at all. It decides how one scalar
  // allocation becomes per-service dollars, and money is not fungible across services — so getting
  // it wrong misstates every service column while the totals still tie. That is the same shape as
  // the PMO Matrix averaging bug, which printed a plausible total over a wrong split.
  { id: 'svc-alloc-even', area: 'svcAlloc', what: 'trimmed allocation split evenly instead of by each service ask',
    find: '  if(at>0) return it.ask.map(x=>a.v*x/at);',
    repl: '  if(at>0) return SVC.map(_=>a.v/SVC.length);' },
  { id: 'svc-alloc-override', area: 'svcAlloc', what: 'per-service allocation override ignored',
    find: "  if(a.m==='s') return a.v.slice();",
    repl: "  if(a.m==='s') return it.ask.slice();" },
  { id: 'basis-fsrc', area: 'model', what: 'funding-source override no longer bases on the full ask',
    find: 'function basisSvcOf(it){ return S.fsrc[it.id]? it.ask.slice() : svcAlloc(it); }',
    repl: 'function basisSvcOf(it){ return svcAlloc(it); }' },
  { id: 'cum-skips-unfunded', area: 'tiers', what: 'cumulative counts only what a lane covered',
    find: '    const e=dT+mT+uT;\n    cum+=e;',
    repl: '    const e=dT+mT+uT;\n    cum+=dT+mT;' },

  { id: 'lane-disc-draw', area: 'tiers', what: 'discretionary draw short-changed by 10%',
    find: 'const dd=Math.min(v, Math.max(0,dRem[i])); dRem[i]-=dd; d[i]=dd;',
    repl: 'const dd=Math.min(v*0.9, Math.max(0,dRem[i])); dRem[i]-=dd; d[i]=dd;' },
  { id: 'lane-mand-draw', area: 'tiers', what: 'mandatory draw ignores the remaining lane',
    find: 'const mm=Math.min(rem, Math.max(0,mRem[i])); mRem[i]-=mm; m[i]=mm;',
    repl: 'const mm=rem; mRem[i]-=mm; m[i]=mm;' },

  // ---- Mission Critical: the two stated rules --------------------------------------------------
  { id: 'mc-total-basis', area: 'mcCalc', what: 'MC Total reverts to the allocation basis',
    find: '      tot[i]  += it.ask[i]||0;', repl: '      tot[i]  += (t.d[i]||0)+(t.m[i]||0)+(t.u[i]||0);' },
  { id: 'mc-short-nets-mand', area: 'model', what: 'MC shortage nets off mandatory',
    find: '  return SVC.map((s,i)=>Math.max(0, (it.ask[i]||0) - ((p&&p.d[i])||0)));',
    repl: '  return SVC.map((s,i)=>Math.max(0, (it.ask[i]||0) - ((p&&p.d[i])||0) - ((p&&p.m[i])||0)));' },
  { id: 'mc-short-unfloored', area: 'model', what: 'MC shortage not floored per service',
    find: '  return SVC.map((s,i)=>Math.max(0, (it.ask[i]||0) - ((p&&p.d[i])||0)));',
    repl: '  return SVC.map((s,i)=>((it.ask[i]||0) - ((p&&p.d[i])||0)));' },
  { id: 'mc-excel-total', area: 'excel', what: 'Excel MC memo reverts to mandatory+unfunded',
    find: '    mc:  [(p,it)=>mcShortOf(it)>0.005, (p,it)=>askTot(it), (p,it)=>it.ask.slice()],',
    repl: '    mc:  [(p,it)=>p.spill>0.005, (p,it)=>p.spill, (p,it)=>SVC.map((s,i)=>p.m[i]+p.u[i])],' },
  { id: 'mc-matrix-weight', area: 'excel', what: 'PMO Matrix MC ignores the per-service share',
    find: '        a.mcs+=SVC.reduce((x,s,i)=>x+mcShortSvc(it)[i]*(frac? frac[i]:1),0);',
    repl: '        a.mcs+=mcShortOf(it);' },
  { id: 'mc-ce-matrix', area: 'excel', what: 'Cost Element Matrix MC reverts to spill',
    find: '      if(S.mc[id]){ a.mc+=askTot(it); a.mcs+=mcShortOf(it); }',
    repl: '      if(S.mc[id]){ a.mc+=p.spill; a.mcs+=mcShortOf(it); }' },
  { id: 'mc-ppt-row', area: 'ppt', what: 'MC slide rows print the allocation, not the ask',
    find: '{t:fSM(askTot(it)),b:1,c:_PPT.AMBER}',
    repl: '{t:fSM(T[it.id].dT+T[it.id].mT+T[it.id].uT),b:1,c:_PPT.AMBER}' },
  { id: 'mc-ppt-filter', area: 'ppt', what: 'MC slide drops zero-allocation starred requirements',
    find: 'const mcIts=S.order.map(itemById).filter(it=>it&&S.mc[it.id]&&askTot(it)>0.5);',
    repl: 'const mcIts=S.order.map(itemById).filter(it=>it&&S.mc[it.id]&&(T[it.id].dT+T[it.id].mT+T[it.id].uT)>0.5);' },

  // ---- by-PMO attribution -----------------------------------------------------------------------
  { id: 'pmo-residual', area: 'shares', what: 'uncovered-service residual dropped again',
    find: '    const gap = tot.map(v=>v>0? 0 : 1);', repl: '    const gap = tot.map(v=>0);' },
  { id: 'pmo-frac', area: 'shares', what: 'CLIN shares computed against the wrong denominator',
    find: 'Object.keys(bag).forEach(g=>out.push([g, bag[g].map((v,i)=>tot[i]>0? v/tot[i]:0)]));',
    repl: 'Object.keys(bag).forEach(g=>out.push([g, bag[g].map((v,i)=>tot[i]>0? v/(tot[i]*1.1):0)]));' },
  { id: 'pmo-keys', area: 'excel', what: 'unknown PMOs dropped from the row list again',
    find: '  return GROUPS.filter(g=>obj[g]).concat(Object.keys(obj).filter(k=>GROUPS.indexOf(k)<0).sort());',
    repl: '  return GROUPS.filter(g=>obj[g]);' },
  { id: 'pmo-matrix-disc', area: 'excel', what: 'PMO Matrix disc unweighted by share',
    find: '      SVC.forEach((s,i)=>{ const f=frac? frac[i]:1; a.disc[i]+=p.d[i]*f; a.mand[i]+=p.m[i]*f; });',
    repl: '      SVC.forEach((s,i)=>{ a.disc[i]+=p.d[i]; a.mand[i]+=p.m[i]; });' },
  { id: 'ce-by-pmo-share', area: 'excel', what: 'CE by PMO reverts to whole-requirement attribution',
    find: '        const dv =SVC.reduce((x,sv,i)=>x+p.d[i]*w(i),0);',
    repl: '        const dv =p.dT;' },

  // ---- unfunded is per service (service AND variant; money never nets across them) --------------
  { id: 'unf-not-per-service', area: 'model', what: 'unfunded netted across services again',
    find: '  return SVC.map((s,i)=>Math.max(0, (it.ask[i]||0) - ((p&&p.d[i])||0) - ((p&&p.m[i])||0)));',
    repl: '  const t=Math.max(0,_vsum(it.ask)-_vsum(SVC.map((s,i)=>((p&&p.d[i])||0)+((p&&p.m[i])||0)))); return SVC.map((s,i)=>i===0?t:0);' },
  { id: 'unf-trim-not-per-service', area: 'model', what: 'trim netted across services again',
    find: '  const b=basisSvcOf(it);\n  return SVC.map((s,i)=>Math.max(0, (it.ask[i]||0) - (b[i]||0)));',
    repl: '  const b=basisSvcOf(it);\n  const t=Math.max(0,_vsum(it.ask)-_vsum(b)); return SVC.map((s,i)=>i===0?t:0);' },
  { id: 'unf-beyond-uncapped', area: 'model', what: 'beyond-both-lanes not capped at the ask',
    find: '  return SVC.map((s,i)=>Math.max(0, Math.min(it.ask[i]||0, b[i]||0) - ((p&&p.d[i])||0) - ((p&&p.m[i])||0)));',
    repl: '  return SVC.map((s,i)=>Math.max(0, (b[i]||0) - ((p&&p.d[i])||0) - ((p&&p.m[i])||0)));' },

  // ---- the deck's PMO rollup ---------------------------------------------------------------------
  { id: 'ppt-pmo-share', area: 'ppt', what: 'PMO rollup ignores the per-service CLIN share',
    find: '          a.ask+=it.ask[i]*w(i); a.d+=p.d[i]*w(i); a.m+=p.m[i]*w(i); a.u+=uv[i]*w(i);',
    repl: '          a.ask+=it.ask[i]; a.d+=p.d[i]; a.m+=p.m[i]; a.u+=uv[i];' },
  { id: 'ppt-pmo-keys', area: 'ppt', what: 'PMO rollup drops offices not on the configured list',
    find: '    const keys=pmoKeys(byG);', repl: '    const keys=GROUPS.filter(g=>byG[g]);' },
  { id: 'ppt-pmo-count', area: 'ppt', what: 'PMO rollup TOTAL counts a split requirement more than once',
    find: "{t:''+Object.keys(seenIds).length,b:1,c:'FFFFFF',...TOTF},",
    repl: "{t:''+tt.n,b:1,c:'FFFFFF',...TOTF}," },

  // ---- the Priority Drill and the Executive Synopsis ---------------------------------------------
  { id: 'synopsis-mc-spill', area: 'other', what: 'Exec Synopsis MC reverts to mandatory+unfunded',
    find: '      mcTot+=askTot(it); SVC.forEach((s,i)=>mcSvc[i]+=it.ask[i]);',
    repl: '      mcTot+=p.spill; SVC.forEach((s,i)=>mcSvc[i]+=p.m[i]+p.u[i]);' },
  { id: 'synopsis-mc-short-mand', area: 'other', what: 'Exec Synopsis MC shortage nets off mandatory',
    find: '      const sh=mcShortSvcOf(it,p), sT=sh.reduce((a,b)=>a+b,0);',
    repl: '      const sh=SVC.map((s,i)=>Math.max(0,it.ask[i]-p.d[i]-p.m[i])), sT=sh.reduce((a,b)=>a+b,0);' },
  { id: 'synopsis-unf', area: 'other', what: 'Exec Synopsis unfunded reverts to the lane shortfall only',
    find: '    const uv=unfTotOf(it,p);\n    if(uv>0.005){ uN++; uTot+=uv; }',
    repl: '    const uv=p.uT;\n    if(uv>0.005){ uN++; uTot+=uv; }' },
  { id: 'synopsis-floor', area: 'other', what: 'Exec Synopsis PROGRAM FLOOR built on funded, not BA',
    find: "  line('','PROGRAM FLOOR (Discretionary BA + MC short)','',fD(dBA+mcShortTot));",
    repl: "  line('','PROGRAM FLOOR (Discretionary BA + MC short)','',fD(dTot+mcShortTot));" },
  { id: 'drill-pmo-keys', area: 'other', what: 'Priority Drill drops offices not on the configured list',
    find: '  const PMOS=pmoKeys(_pmoSeen);', repl: '  const PMOS=GROUPS.filter(g=>_pmoSeen[g]);' },
  { id: 'drill-unf', area: 'other', what: 'Priority Drill unfunded netted across services again',
    find: '    return {ask, d:p.dT, m:p.mT, fn, u:unfTotOf(it,p), p}; };',
    repl: '    return {ask, d:p.dT, m:p.mT, fn, u:Math.max(0,ask-fn), p}; };' },

  { id: 'excel-forecast-pmo', area: 'excel', what: 'Spend Forecast BY PMO drops offices not on the list',
    find: '    const ks=pmoKeys(FF.byPMO);', repl: '    const ks=GROUPS.filter(g=>FF.byPMO[g]);' },

  // ---- Excel portions ---------------------------------------------------------------------------
  { id: 'excel-disc-vec', area: 'excel', what: 'Discretionary sheet prints the mandatory vector',
    find: '    disc:[p=>p.dT>0.005, p=>p.dT, p=>p.d],', repl: '    disc:[p=>p.dT>0.005, p=>p.dT, p=>p.m],' },
  { id: 'excel-unf-vec', area: 'excel', what: 'Unfunded vector forgets the mandatory draw',
    find: '    unf: [(p,it)=>unfTotOf(it,p)>0.005, (p,it)=>unfTotOf(it,p), (p,it)=>unfSvcOf(it,p)]};',
    repl: '    unf: [(p,it)=>unfTotOf(it,p)>0.005, (p,it)=>unfTotOf(it,p), (p,it)=>SVC.map((s,i)=>Math.max(0,it.ask[i]-p.d[i]))]};' },
  { id: 'excel-aof', area: 'excel', what: '"Allocated" reverts to the funded total for overrides',
    find: '  const aOf=it=> S.fsrc[it.id]? askTot(it) : eff(it);',
    repl: '  const aOf=it=> S.fsrc[it.id]? (T[it.id].dT+T[it.id].mT) : eff(it);' },

  // ---- PowerPoint aggregates --------------------------------------------------------------------
  { id: 'ppt-streams-disc', area: 'ppt', what: 'Funding-by-stream discretionary double counts',
    find: 'SVC.forEach((s,i)=>{allAsk[i]+=it.ask[i]; aD[i]+=p.d[i]; aM[i]+=p.m[i]; aU[i]+=uv[i];});});',
    repl: 'SVC.forEach((s,i)=>{allAsk[i]+=it.ask[i]; aD[i]+=p.d[i]*1.05; aM[i]+=p.m[i]; aU[i]+=uv[i];});});' },
  { id: 'ppt-unfunded-total', area: 'ppt', what: 'UFR slide total drops the trim deltas',
    find: '    const totalU=uIts.reduce((a,it)=>a+unf2(it),0);',
    repl: '    const totalU=uIts.reduce((a,it)=>a+T[it.id].uT,0);' },
  { id: 'ppt-ce-rollup', area: 'ppt', what: 'CE rollup swaps discretionary and mandatory',
    find: '      const a=byCE[ce]; a.n++; a.d+=p.dT; a.m+=p.mT; a.u+=unf2(it);});',
    repl: '      const a=byCE[ce]; a.n++; a.d+=p.mT; a.m+=p.dT; a.u+=unf2(it);});' },
  { id: 'ppt-kpi-disc', area: 'ppt', what: 'KPI "Discretionary funded" reads the mandatory total',
    find: "['Discretionary BA', fSM(dBA), _PPT.GREEN], ['Discretionary funded', fSM(TT.dUsed), _PPT.GREEN],",
    repl: "['Discretionary BA', fSM(dBA), _PPT.GREEN], ['Discretionary funded', fSM(TT.mUsed), _PPT.GREEN]," },
];

const only = process.argv.slice(2).filter(a => !a.startsWith('-'));
const picked = only.length
  ? MUTATIONS.filter(m => only.some(q => m.id.includes(q) || m.area.includes(q)))
  : MUTATIONS;

const src = readFileSync(BOARD, 'utf8');
const dir = mkdtempSync(join(tmpdir(), 'spmt-mut-'));
const results = [];

console.log(`\nmutation sweep — ${picked.length} mutation(s), ${SUITES.length} suite(s)\n`);

for (const m of picked) {
  const hits = src.split(m.find).length - 1;
  if (hits !== 1) {
    results.push({ ...m, status: 'NOT APPLIED', by: `target matched ${hits} times, expected 1` });
    console.log(`  NOT APPLIED  ${m.id.padEnd(22)} target matched ${hits}x`);
    continue;
  }
  const file = join(dir, m.id + '.html');
  writeFileSync(file, src.replace(m.find, m.repl));

  let caughtBy = null;
  for (const [suite, path] of SUITES) {
    try {
      execFileSync(process.execPath, [path], { env: { ...process.env, BOARD: file }, stdio: 'pipe' });
    } catch {
      caughtBy = suite;                 // non-zero exit == the suite failed == mutation caught
      break;
    }
  }
  // An EQUIVALENT mutation changes the source without changing any observable behaviour, so no
  // suite can catch it and none should be written to try. Reporting it as SURVIVED forever would
  // teach the reader to skim past that word, which is the one word here that has to keep its force.
  // It is a claim, not an excuse: each one names the invariant that makes it equivalent, and that
  // invariant is asserted in audit-board.mjs — so if the clamp ever goes, the mutation stops being
  // equivalent and the suites fail on the invariant instead.
  const status = caughtBy ? 'caught' : (m.equivalent ? 'equivalent' : 'SURVIVED');
  results.push({ ...m, status, by: caughtBy || '' });
  const note = caughtBy ? '(' + caughtBy + ')'
             : m.equivalent ? '<- no observable difference: ' + m.equivalent
             : '<- NOT COVERED: ' + m.what;
  console.log(`  ${status.padEnd(12)} ${m.id.padEnd(22)} ${note}`);
}

const caught = results.filter(r => r.status === 'caught');
const survived = results.filter(r => r.status === 'SURVIVED');
const skipped = results.filter(r => r.status === 'NOT APPLIED');
const equiv = results.filter(r => r.status === 'equivalent');

console.log('\n' + '='.repeat(96));
console.log(`caught ${caught.length}/${picked.length - skipped.length - equiv.length}` +
  (equiv.length ? `   (${equiv.length} equivalent, no observable difference)` : '') +
  (skipped.length ? `   (${skipped.length} could not be applied)` : ''));
if (equiv.length) {
  console.log(`\n${equiv.length} EQUIVALENT — behaviour is unchanged, so nothing can or should catch them:\n`);
  equiv.forEach(r => console.log(`  ${r.area}/${r.id}\n      ${r.equivalent}`));
}
if (survived.length) {
  console.log(`\n${survived.length} SURVIVING MUTATION(S) — these lines are not protected:\n`);
  survived.forEach(r => console.log(`  ${r.area}/${r.id}\n      ${r.what}`));
}
if (skipped.length) {
  console.log(`\n${skipped.length} NOT APPLIED — the search string no longer matches, so nothing was proven:\n`);
  skipped.forEach(r => console.log(`  ${r.area}/${r.id}\n      ${r.by}`));
}
console.log('');
process.exit(survived.length || skipped.length ? 1 : 0);
