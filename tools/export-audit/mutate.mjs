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
  // Import is the one place the board takes numbers it did not compute, and every suite above it
  // is on the way OUT. A break in the service-alignment guard is invisible to all of them.
  ['import', join(HERE, 'audit-import.mjs')],
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

  // ---- the month-by-month sheets: the blocks and their ALL SERVICES roll-up --------------------
  { id: 'mon-grand-skips-none', area: 'monSheet', what: 'ALL SERVICES stops counting the unassigned bucket',
    find: `        rows.push(line(noneLbl, b, 1));
        b.m.forEach(function(v,j){ sub.m[j]+=v; grand.m[j]+=v; });`,
    repl: `        rows.push(line(noneLbl, b, 1));
        b.m.forEach(function(v,j){ sub.m[j]+=v; });` },
  { id: 'mon-block-drops-nod', area: 'monSheet', what: 'a service block forgets its undated dollars',
    find: `        sub.nod+=b.nod; grand.nod+=b.nod;
      });
      if(bag[g][NONE]){`,
    repl: `        grand.nod+=b.nod;
      });
      if(bag[g][NONE]){` },

  // ---- the incremental-funding residual: the number that goes on a contract mod ----------------
  { id: 'inc-residual-netted', area: 'fillLastAwd', what: 'residual netted across services instead of computed per service',
    find: '    const alloc=(p.d[i]||0);',
    repl: '    const alloc=SVC.reduce((q,s2,j)=>q+(p.d[j]||0),0)/SVC.length;' },
  { id: 'inc-residual-basis', area: 'fillLastAwd', what: 'residual reverts to discretionary + mandatory instead of discretionary alone',
    find: '    const alloc=(p.d[i]||0);', repl: '    const alloc=(p.d[i]||0)+(p.m[i]||0);' },
  { id: 'inc-residual-ignores-prior', area: 'fillLastAwd', what: 'last increment set to the whole allocation, ignoring earlier increments',
    find: '    last.sv[i]=Math.max(0, Math.round(alloc-others));',
    repl: '    last.sv[i]=Math.max(0, Math.round(alloc));' },

  // ---- the cutline banners: where the board says the money runs out ----------------------------
  // natM/natU gate them, and the rule is subtle: they only count a draw where that service's lane
  // was ALREADY dry. Drop the guard and a requirement forced to MANDATORY high in the order drags
  // the discretionary cutline up the list with it, telling everyone the money ran out sooner than
  // it did.
  { id: 'cut-natm-unguarded', area: 'tiers', what: 'discretionary cutline fires on a forced draw, not an exhausted lane',
    find: '      if(dryA[i]) natM+=m[i];', repl: '      natM+=m[i];' },
  { id: 'cut-natu-half-guarded', area: 'tiers', what: 'full-budget cutline fires while the mandatory lane still has money',
    find: '      if(dryA[i]&&mDryA[i]) natU+=u[i];', repl: '      if(dryA[i]) natU+=u[i];' },

  // ---- the absorb line: what the nominated contract would be giving up --------------------------
  { id: 'abs-take-netted', area: 'absorbCalc', what: 'absorbed netted across services instead of capped per service',
    find: '    const take=Math.min(sf.bySvc[i]||0, room);',
    repl: '    const take=Math.min(sf.total/SVC.length, room);' },
  { id: 'abs-room-unfloored', area: 'absorbCalc', equivalent: 'the floor is clamped to the allocation total before it is spread, so a service\'s share of it can never exceed that service\'s own allocation — audit-board.mjs asserts that invariant',
    what: 'room to absorb allowed to go negative',
    find: '    const room=Math.max(0, (alloc[i]||0) - (aTot>0? floor*(alloc[i]||0)/aTot : 0));',
    repl: '    const room=(alloc[i]||0) - (aTot>0? floor*(alloc[i]||0)/aTot : 0);' },
  { id: 'abs-floor-not-spread', area: 'absorbCalc', what: 'the floor lands wholly on each service instead of in the shape of the allocation',
    find: '    const room=Math.max(0, (alloc[i]||0) - (aTot>0? floor*(alloc[i]||0)/aTot : 0));',
    repl: '    const room=Math.max(0, (alloc[i]||0) - floor);' },

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

  { id: 'excel-forecast-pmo', area: 'excel', what: 'Two-Plan Forecast BY PMO drops offices not on the list',
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
  // ---- the ◨/◧ view toggle, and the marker that has to travel with it -------------------------
  // The toggle changes what the spend-plan family prints. A build that ignores it, or that lets it
  // leak into the rest of the workbook, is wrong in a way that looks like a normal export.
  { id: 'scen-forecast-ignores', area: 'forecast', what: "the board's forecast ignores the view toggle",
    find: '  const T = fundOf ? null : tiers(null, scenOpt());',
    repl: '  const T = fundOf ? null : tiers(null, null);' },
  { id: 'scen-months-ignore', area: 'monSheet', what: 'the month sheets read the truth walk instead of the view',
    find: '  const Tv = scenOn()? tiers(null, scenOpt()) : T;',
    repl: '  const Tv = T;' },
  { id: 'scen-leaks-everywhere', area: 'excel', what: 'the view leaks past the spend-plan family into the whole workbook',
    find: '      const it=itemById(id), pt=Tv[id];',
    repl: '      const it=itemById(id), pt=Tv[id]; T[id]=pt;' },
  { id: 'scen-opt-inert', area: 'scenOpt', what: 'the toggle is wired up but withholds nothing',
    find: "function scenOpt(){ return scenView==='disc'? {noMand:true} : null; }",
    repl: 'function scenOpt(){ return null; }' },
  { id: 'scen-marker-sheet', area: 'marker', what: 'a what-if workbook prints sheet titles that look like the funded plan',
    find: String.raw`function scenTitle(t){ return scenOn()? (t+'   \u2014   \u25e8 '+SCEN_TAG+' (WHAT-IF, not the funded plan)') : t; }`,
    repl: 'function scenTitle(t){ return t; }' },
  { id: 'scen-marker-file', area: 'marker', what: 'a what-if workbook saves under the ordinary file name',
    find: "function scenFile(n){ return scenOn()? (n+' [DISC-ONLY]') : n; }",
    repl: 'function scenFile(n){ return n; }' },
  // ---- reading a workbook: every offset comes out of the file being read ------------------------
  { id: 'xlsx-cdoff-unchecked', area: 'xlsxRead', what: 'a damaged directory offset throws a raw RangeError instead of naming the problem',
    find: "  need(cdOff,4,'its directory starts at byte '+cdOff+', past the end of a '+SZ+'-byte file');",
    repl: "  /* unchecked */" },
  { id: 'xlsx-count-unchecked', area: 'xlsxRead', what: 'a corrupt entry count walks off the end of the buffer',
    find: "    need(p,46,'its directory claims '+cnt+' entries but runs out of file after '+k);",
    repl: "    /* unchecked */" },
  { id: 'xlsx-no-workbook-part', area: 'xlsxRead', what: 'a zip with no workbook part reports a TypeError on null',
    find: "  if(!wbx)  throw BAD('it contains no workbook part (xl/workbook.xml)');",
    repl: "  /* unchecked */" },
  { id: 'xlsx-sst-unbounded', area: 'xlsxRead', what: 'a shared-string index past the table yields a silently blank cell',
    find: "                       if(!(ix>=0 && ix<sst.length)) throw BAD('a cell points at text #'+ix",
    repl: "                       if(false) throw BAD('a cell points at text #'+ix" },
  { id: 'xlsx-inline-unescaped', area: 'xlsxRead', what: 'inline strings come back escaped, so every O&M reads as O&amp;M',
    find: "        if(t==='inlineStr'){ const im=body.match(/<t[^>]*>([\\s\\S]*?)<\\/t>/); v=im? _xunesc(im[1]):''; }",
    repl: "        if(t==='inlineStr'){ const im=body.match(/<t[^>]*>([\\s\\S]*?)<\\/t>/); v=im? im[1]:''; }" },

  // ---- moving a requirement between fiscal years -------------------------------------------------
  { id: 'year-awards-not-shifted', area: 'yearCopy', what: 'a requirement copied forward keeps last year\u2019s award dates',
    find: '  const dy=y-MS.cur;',
    repl: '  const dy=0;' },
  { id: 'year-move-leaves-source', area: 'yearCopy', what: 'a MOVE leaves the requirement in this year too, funding it twice',
    find: "    S.order=S.order.filter(x=>x!==id);",
    repl: "    S.order=S.order.slice();" },
  { id: 'year-drops-a-container', area: 'yearCopy', what: 'one attached container is normalised on the target but never filled',
    find: "  cp(T.band, (S.band||{})[id]); cp(T.tier, (S.tier||{})[id]);",
    repl: "  cp(T.tier, (S.tier||{})[id]);" },
  { id: 'year-ask-not-carried', area: 'yearCopy', what: 'the requirement value is left behind, so the copy arrives worth nothing',
    find: "    T.asks[id]=it.ask.slice();                           // carry the current requirement value",
    repl: "    T.asks[id]=SVC.map(function(){return 0;});           // carry the current requirement value" },

  // ---- saving: the board rewrites its own HTML, and reopening it is the only way back ----------
  { id: 'save-no-lt-escape', area: 'buildSavedHtml', what: 'a literal </script> in a note ends the payload early and truncates the whole store',
    find: String.raw`rpDb:RPDB}).replace(/</g,'\\u003c');`,
    repl: "rpDb:RPDB});" },
  { id: 'save-drops-awards', area: 'dataPackOf', what: 'the saved file loses the requirement list, so every non-custom row drops on reopen',
    find: "    items:BASE_ITEMS.map(it=>Object.assign({}, it, {ask:(BASE_ASK[it.id]||it.ask).slice()}))",
    repl: "    items:[]" },
  { id: 'save-rounds-money', area: 'buildSavedHtml', what: 'saved dollars are rounded to thousands on the way out',
    find: "  return SRC0.replace(/(<script type=\"application\\/json\" id=\"pubState\">)[\\s\\S]*?(<\\/script>)/,",
    repl: "  json=json.replace(/(\\d{4,})/g,function(m){return String(Math.round(+m/1000)*1000);});\n  return SRC0.replace(/(<script type=\"application\\/json\" id=\"pubState\">)[\\s\\S]*?(<\\/script>)/," },

  // ---- importing a state file: the service-alignment guard --------------------------------------
  // Every figure below the guard is positional. These break it in the four ways that matter, and
  // each one leaves a board whose totals still reconcile perfectly.
  { id: 'svc-guard-off', area: 'applyStore', what: 'imported state is adopted without checking whose services it describes',
    find: '  if(raw && !svcGuardImport(raw, packOfStore(raw), raw.__srcName)) return false;',
    repl: '  if(false && raw) return false;' },
  { id: 'svc-pack-top-only', area: 'packOfStore', what: 'the service list is looked for only at the top, so a state file hides it under years',
    find: '  const ys = raw.years || {};',
    repl: '  const ys = {};' },
  { id: 'svc-guard-allows-mismatch', area: 'svcGuardImport', what: 'a file for a different set of services is accepted anyway',
    find: "  if(c.state==='match' || c.state==='unknown') return true;",
    repl: "  if(c.state==='match' || c.state==='unknown' || c.state==='mismatch') return true;" },
  { id: 'svc-check-order-blind', area: 'svcCheckPack', what: 'a reordered service list reads as a match, so nothing is remapped',
    find: "  if(mine.length===theirs.length && mine.every(function(s,i){ return s===theirs[i]; }))\n    return {state:'match'};",
    repl: "  if(mine.length===theirs.length) return {state:'match'};" },
  { id: 'svc-remap-identity', area: 'svcRemapState', what: 'the remap returns every vector untouched',
    find: '    return map.map(function(j){ return (j>=0 && j<v.length)? v[j] : 0; });',
    repl: '    return v.slice();' },
  { id: 'svc-remap-misses-fsrc', area: 'svcRemapState', what: 'the split vectors are left in the file\u2019s service order',
    find: "    if(f && Array.isArray(f.dv)){ f.dv=pick(f.dv); f.mv=pick(f.mv); } });",
    repl: "    if(f && Array.isArray(f.dv)){ f.mv=f.mv; } });" },
  { id: 'svc-remap-misses-awards', area: 'svcRemapState', what: 'award increments keep the file\u2019s service order',
    find: "    (aw && aw.inc || []).forEach(function(x){ if(Array.isArray(x.sv)) x.sv=pick(x.sv); }); });",
    repl: "    (aw && aw.inc || []).forEach(function(x){ if(Array.isArray(x.sv)) x.sv=x.sv; }); });" },
  { id: 'svc-arity-blind', area: 'svcCheckPack', what: 'a state with no service list and the wrong vector width is let through',
    find: "    return (n!==null && n!==mine.length)? {state:'arity', n:n, to:mine} : {state:'unknown'};",
    repl: "    return {state:'unknown'};" },

  // ---- the MC shortage, per requirement, on the Mission Critical sheet -------------------------
  { id: 'mc-short-col-nets-mand', area: 'excel', what: 'the per-requirement MC shortage nets off mandatory, against the stated rule',
    find: "      if(isMC){ const sh=mcShortSvcOf(it,T[it.id]);",
    repl: "      if(isMC){ const sh=unfSvcOf(it,T[it.id]);" },
  { id: 'mc-short-col-prints-ask', area: 'excel', what: 'the shortage column prints the requirement value instead of the shortfall',
    find: "        row.push({v:sh.reduce((a,b)=>a+b,0),s:NB}, ...sh.map(v=>({v,s:N}))); }",
    repl: "        row.push({v:askTot(it),s:NB}, ...sh.map(v=>({v,s:N}))); }" },
  { id: 'mc-short-total-drifts', area: 'excel', what: 'the MC shortage TOTAL stops matching the rows above it',
    find: "      const shT=SVC.map((s,i)=>its.reduce((a,it)=>a+mcShortSvcOf(it,T[it.id])[i],0));",
    repl: "      const shT=SVC.map((s,i)=>its.reduce((a,it)=>a+unfSvcOf(it,T[it.id])[i],0));" },

  // ---- converting to an explicit Split, and the two ask-based unfunded readings ---------------
  { id: 'split-seed-drops-mand', area: 'seedSplit', what: 'conversion freezes discretionary but forgets the mandatory draw',
    find: "  S.fsrc[id]={m:'split', dv:p.d.map(v=>Math.round(v)), mv:p.m.map(v=>Math.round(v))};",
    repl: "  S.fsrc[id]={m:'split', dv:p.d.map(v=>Math.round(v)), mv:p.m.map(function(){return 0;})};" },
  { id: 'split-seed-floors', area: 'seedSplit', what: 'conversion floors each service instead of rounding, losing a dollar per service',
    find: "  S.fsrc[id]={m:'split', dv:p.d.map(v=>Math.round(v)), mv:p.m.map(v=>Math.round(v))};",
    repl: "  S.fsrc[id]={m:'split', dv:p.d.map(v=>Math.floor(v)), mv:p.m.map(v=>Math.floor(v))};" },
  { id: 'convert-skips-some', area: 'convertAllToSplit', what: 'the bulk convert quietly leaves some requirements on the lane walk',
    find: "  const ids=S.order.filter(id=>!S.fsrc[id] && T[id]);",
    repl: "  const ids=S.order.filter(id=>!S.fsrc[id] && T[id]).slice(0,1);" },
  { id: 'discunf-nets-mandatory', area: 'discUnfSvcOf', what: 'unfunded vs DISC nets off mandatory, so it stops being a one-pot reading',
    find: "  return SVC.map((s,i)=>Math.max(0, (it.ask[i]||0) - ((p&&p.d[i])||0)));",
    repl: "  return SVC.map((s,i)=>Math.max(0, (it.ask[i]||0) - ((p&&p.d[i])||0) - ((p&&p.m[i])||0)));" },
  { id: 'discunf-off-allocation', area: 'discUnfSvcOf', what: 'unfunded vs DISC measured off the trimmed allocation instead of the ask',
    find: "function discUnfSvcOf(it, p){",
    repl: "function discUnfSvcOf(it, p){ const _b=basisSvcOf(it); return SVC.map((s,i)=>Math.max(0,(_b[i]||0)-((p&&p.d[i])||0)));" },
  { id: 'discunf-not-floored', area: 'discUnfSvcOf', what: 'unfunded vs DISC lets an over-funded service pay down another service',
    find: "  return SVC.map((s,i)=>Math.max(0, (it.ask[i]||0) - ((p&&p.d[i])||0)));",
    repl: "  return SVC.map((s,i)=>((it.ask[i]||0) - ((p&&p.d[i])||0)));" },
  { id: 'usheet-discunf-col', area: 'excel', what: 'the Unfunded sheet prints the total in the vs-DISC column',
    find: "      {v:discUnfTotOf(it,p),s:N},{v:tu,s:NB},",
    repl: "      {v:tu,s:N},{v:tu,s:NB}," },
  { id: 'scen-footer-stale', area: 'marker', what: 'the month-sheet footer claims mandatory money the view withheld',
    find: "    rows.push([{v:'Funded dollars ('+(scenOn()? 'DISCRETIONARY ONLY \\u2014 mandatory withheld'",
    repl: "    rows.push([{v:'Funded dollars ('+(false? 'DISCRETIONARY ONLY \\u2014 mandatory withheld'" },
  { id: 'fc-sheet-renamed', area: 'excel', what: 'the forecast sheet is renamed, which used to silently skip every check on it',
    find: "  const fcSheet={name:FYL()+' Two-Plan Forecast', cols:[34,...FYMON.map(_=>9),9,11],",
    repl: "  const fcSheet={name:FYL()+' Something Else', cols:[34,...FYMON.map(_=>9),9,11]," },
  { id: 'scen-marker-panel', area: 'marker', what: 'the on-screen forecast panel drops its what-if marker',
    find: "      + (scenOn()? ' <span style=\"color:var(--amber);font-weight:800\">\\u25e8 '+esc(SCEN_TAG)+'</span>' : ''); }",
    repl: "      + ''; }" },
  { id: 'scen-marker-always', area: 'marker', what: 'the marker is stamped on the funded plan too',
    find: 'function scenOn(){ return scenView===\'disc\'; }',
    repl: 'function scenOn(){ return true; }' },
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
