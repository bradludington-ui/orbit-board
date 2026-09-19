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
import { execFileSync, execFile } from 'node:child_process';
import { cpus } from 'node:os';
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
  // Every suite above derives what it expects from the board's own helpers. Reconciliation does
  // not: it asserts arithmetic that must hold whatever the algorithm does, and cross-foots every
  // printed total against the rows under it. A break that tiers() and the exports AGREE about is
  // invisible to all of them and visible here.
  ['recon', join(HERE, 'audit-recon.mjs')],
  // LAST ON PURPOSE, AND THE ORDER OF THIS LIST IS A COST DECISION. The loop stops at the first
  // suite that catches, so a suite placed early is paid for by every mutation the ones before it
  // miss. Measured on an idle box: other 2.9s, ppt 3.7s, recon 4.2s, excel 8.2s, board 12.4s,
  // import 23.8s. Import is four times the average and catches the narrowest slice -- it is the
  // one place the board takes numbers it did not compute, and every suite above it is on the way
  // OUT -- so it goes at the end. Moving it after recon alone takes ~20s off every mutation that
  // recon catches and costs 4s on the few import catches.
  ['import', join(HERE, 'audit-import.mjs')],
];

// area: which surface the line belongs to. find/replace: the deliberate break.
const DREW_LINE_FIND = "const drewLine = (directedV, drawnV, capV) => drewGap(directedV, drawnV)\n  ? '<div class=\"drew\" title=\"'+drewWhy(drawnV, capV)+'\">drew '+fM(drawnV)+'</div>' : '';";
const DREW_LINE_ECHO = "const drewLine = (directedV, drawnV, capV) => drewGap(directedV, drawnV)\n  ? '<div class=\"drew\" title=\"'+drewWhy(drawnV, capV)+'\">drew '+fM(directedV)+'</div>' : '';";
const DIRECTED_LINE_FIND = "const directedLine = (directedV, drawnV, capV) => drewGap(directedV, drawnV)\n  ? '<div class=\"drew\" title=\"the cells above were directed higher than '\n    + ((typeof capV === 'number' && drawnV >= capV - 0.005)? 'the allocation covers'\n                                                           : 'the lanes could supply')+'\">'\n    + 'directed '+fM(directedV)+'</div>' : '';";
// WHICH LIMIT REFUSED THE DOLLAR. Shared by both builds' split editors, so one spelling covers both.
const DREW_WHY_FIND = "const drewWhy = (drawnV, capV) => (typeof capV === 'number' && drawnV >= capV - 0.005)\n  ? 'the allocation for this service stops at '+fM(capV)\n    +' \\u2014 raise the allocation to draw more'\n  : 'the lane could not supply the rest';";

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
    find: '    const room=Math.max(0, (alloc[i]||0) - floorV[i]);',
    repl: '    const room=(alloc[i]||0) - floorV[i];' },
  { id: 'abs-floor-not-spread', area: 'absorbCalc', what: 'the floor lands wholly on each service instead of in the shape of the allocation',
    find: '    const room=Math.max(0, (alloc[i]||0) - floorV[i]);',
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
  // The line this aims at gained an ask-based unfunded reading and a second guard, so the search
  // string moved with it. mcCov is still the target: what MANDATORY paid for the must-pays.
  { id: 'sb-mc-coverage', area: 'scoreboard', what: 'MC drawn-from-mandatory reads the discretionary draw',
    find: '    if(S.mc[id]&&T[id]&&it2){ mcCov+=T[id].mT; mcUnf+=unfTotOf(it2,T[id]); } });',
    repl: '    if(S.mc[id]&&T[id]&&it2){ mcCov+=T[id].dT; mcUnf+=unfTotOf(it2,T[id]); } });' },
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
    find: '  return apportion(a.v, at>0? it.ask : SVC.map(_=>1));',
    repl: '  return apportion(a.v, SVC.map(_=>1));' },
  { id: 'svc-alloc-override', area: 'svcAlloc', what: 'per-service allocation override ignored',
    find: "  if(a.m==='s') return a.v.map(D$);",
    repl: "  if(a.m==='s') return it.ask.map(D$);" },
  // Inverted when the rule changed: a directed source used to re-base the requirement on its full
  // ask, which reported a trim as "beyond both lanes" and let the act of recording a source change
  // what a requirement was short. This puts that back, so the guards that now forbid it stay honest.
  { id: 'basis-fsrc', area: 'model', what: 'a recorded funding source re-bases on the full ask again',
    find: '  const a = svcAlloc(it);',
    repl: '  const a = S.fsrc[it.id]? it.ask.slice() : svcAlloc(it);' },
  // seedSplit recorded the lane draw rounded to whole dollars. Harmless while the basis was the
  // ask (the rounded value sat under that ceiling); against the allocation it makes converting a
  // board to Split lossy by cents, on every requirement at once.
  { id: 'seed-split-rounds', area: 'model', equivalent: 'p.d and p.m are whole dollars now -- tiers() draws them with Math.min of integers, so rounding or flooring them at conversion is the identity. This was a real mutation while money was a float. audit-board.mjs asserts Number.isInteger on every lane draw, so if that invariant ever breaks THAT check fails first and this stops being equivalent', what: 'converting to Split rounds the directed dollars',
    find: "  S.fsrc[id]={m:'split', dv:p.d.slice(), mv:p.m.slice()};",
    repl: "  S.fsrc[id]={m:'split', dv:p.d.map(v=>Math.round(v)), mv:p.m.map(v=>Math.round(v))};" },
  // The Spruills grid took the consolidated payload for the board's OWN appropriation. It is empty
  // on any board that simply carries its own requirements, so the panel reported $0.00M of
  // requirements and a DELTA of the whole budget as surplus.
  { id: 'spdefs-no-fallback', area: 'model', what: "Spruills ignores the board's own requirements",
    find: 'data:_hasData(APPNS[a])? APPNS[a] : DATA',
    repl: 'data:APPNS[a]' },
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
  { id: 'mc-short-unfloored', area: 'model', equivalent: 'basisSvcOf() clamps the allocation to the ask, so no service can be funded above its own requirement and ask - d [- m] is never negative -- this floor is now arithmetically unreachable. It was a real mutation while an over-allocation could be drawn in full. audit.mjs asserts \'funded never exceeds the requirement\' per service on every scenario, and basis-over-ask proves the clamp is enforced, so if either gives way THOSE fail first and this stops being equivalent', what: 'MC shortage not floored per service',
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
  { id: 'unf-beyond-uncapped', area: 'model', equivalent: 'min(ask, basis) == basis now that basisSvcOf() clamps the allocation to the ask, so the cap is the identity. It was a real mutation while the basis could exceed the requirement -- which is the defect over-allocation-became-unfunded records. The clamp is guarded by basis-over-ask and basis-clamps-to-alloc, so removing it fails those first', what: 'beyond-both-lanes not capped at the ask',
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
  // RE-AIMED when mOf() grew the second unfunded reading: the old find carried the whole return
  // statement, so adding u1 to it matched nothing -- NOT APPLIED, a check proving nothing. Aimed at
  // the single u: term now, which is the thing the mutation is actually about and does not move
  // when a sibling field is added beside it.
  { id: 'drill-unf', area: 'other', equivalent: 'basisSvcOf() clamps the allocation to the ask, so no service can be funded above its own requirement and ask - d [- m] is never negative -- this floor is now arithmetically unreachable. It was a real mutation while an over-allocation could be drawn in full. audit.mjs asserts \'funded never exceeds the requirement\' per service on every scenario, and basis-over-ask proves the clamp is enforced, so if either gives way THOSE fail first and this stops being equivalent', what: 'Priority Drill unfunded netted across services again',
    find: 'u:unfTotOf(it,p), u1:discUnfTotOf(it,p), p}; };',
    repl: 'u:Math.max(0,ask-fn), u1:discUnfTotOf(it,p), p}; };' },
  // and the same net-across-services error on the SECOND reading, which has its own subtraction
  { id: 'drill-unf-disc', area: 'other', equivalent: 'basisSvcOf() clamps the allocation to the ask, so no service can be funded above its own requirement and ask - d [- m] is never negative -- this floor is now arithmetically unreachable. It was a real mutation while an over-allocation could be drawn in full. audit.mjs asserts \'funded never exceeds the requirement\' per service on every scenario, and basis-over-ask proves the clamp is enforced, so if either gives way THOSE fail first and this stops being equivalent', what: 'Priority Drill vs-DISC reading netted across services',
    find: 'u:unfTotOf(it,p), u1:discUnfTotOf(it,p), p}; };',
    repl: 'u:unfTotOf(it,p), u1:Math.max(0,ask-p.dT), p}; };' },

  { id: 'excel-forecast-pmo', area: 'excel', what: 'Two-Plan Forecast BY PMO drops offices not on the list',
    find: '    const ks=pmoKeys(FF.byPMO);', repl: '    const ks=GROUPS.filter(g=>FF.byPMO[g]);' },

  // ---- Excel portions ---------------------------------------------------------------------------
  { id: 'excel-disc-vec', area: 'excel', what: 'Discretionary sheet prints the mandatory vector',
    find: '    disc:[p=>p.dT>0.005, p=>p.dT, p=>p.d],', repl: '    disc:[p=>p.dT>0.005, p=>p.dT, p=>p.m],' },
  { id: 'excel-unf-vec', area: 'excel', what: 'Unfunded vector forgets the mandatory draw',
    find: '    unf: [(p,it)=>unfTotOf(it,p)>0.005, (p,it)=>unfTotOf(it,p), (p,it)=>unfSvcOf(it,p)]};',
    repl: '    unf: [(p,it)=>unfTotOf(it,p)>0.005, (p,it)=>unfTotOf(it,p), (p,it)=>SVC.map((s,i)=>Math.max(0,it.ask[i]-p.d[i]))]};' },
  // Rewritten when aOf stopped carrying its own copy of the basis rule. The old find string
  // targeted the line that used to read `S.fsrc[it.id]? askTot(it) : eff(it)`, so after that change
  // it matched nothing and the mutation quietly stopped proving anything -- which is why NOT APPLIED
  // fails this run rather than passing quietly.
  { id: 'excel-aof', area: 'excel', what: '"Allocated" shows the funded total instead of the basis',
    find: '  const aOf=it=> basisSvcOf(it).reduce((a,b)=>a+b,0);',
    repl: '  const aOf=it=> (T[it.id].dT+T[it.id].mT);' },

  // ---- PowerPoint aggregates --------------------------------------------------------------------
  // RE-AIMED when the stream slide gained its second unfunded reading: the find carried the whole
  // accumulation line, so adding aU1 to it matched nothing. Aimed at the aD term alone now.
  { id: 'ppt-streams-disc', area: 'ppt', what: 'Funding-by-stream discretionary double counts',
    find: 'allAsk[i]+=it.ask[i]; aD[i]+=p.d[i];',
    repl: 'allAsk[i]+=it.ask[i]; aD[i]+=p.d[i]*1.05;' },
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
    // scenTitle() grew a second caveat (the PMO-copy mark) and stopped being one line. Target the
    // WHAT-IF clause itself rather than the whole function, so it survives the next thing that is
    // added beside it -- a mutation whose target drifts is a check that silently stopped running.
    find: String.raw`scenOn()? (t+'   \u2014   \u25e8 '+SCEN_TAG+' (WHAT-IF, not the funded plan)') : t`,
    repl: 't' },
  { id: 'scen-marker-file', area: 'marker', what: 'a what-if workbook saves under the ordinary file name',
    find: "function scenFile(n){ return scenOn()? (n+' [DISC-ONLY]') : n; }",
    repl: 'function scenFile(n){ return n; }' },
  // The impact chip moved OUT of the grid inspector and into the row, where both builds render it
  // and no band gates it. The mutation moved with it: gate it on a band again and the row of an
  // ordinary requirement has no way in -- which is the state this feature shipped in.
  // MIPR type. The first is the trap the Kind test exists to avoid: hardcode the two primes by
  // NAME and it works perfectly until somebody renames one or adds a third.
  { id: 'mipr-gate-by-name', area: 'destIsOgc', what: 'the OGC test hardcodes the primes by name',
    find: "  const e=flowEnt(to); return !!e && e.kind!=='prime';",
    repl: "  const e=flowEnt(to); return !!e && e.n!=='Lockheed Martin' && e.n!=='Pratt & Whitney';" },
  { id: 'mipr-takes-anything', area: 'setMipr', what: 'MIPR type stores a value that is not one of the two',
    find: "  if(v && MIPR_LBL[v]) S.mipr[id]=v; else delete S.mipr[id];",
    repl: "  if(v) S.mipr[id]=v; else delete S.mipr[id];" },
  // The matrix draws a column for every record field and bulk-sets from a list it does NOT derive.
  // Dropping the setter is silent in the UI apart from one hint, so it is the suites that must see it.
  // ── THE SPEND PLAN SOURCE, and the two unfunded readings ──────────────────────────────────
  // Every one of these shipped green once. The Amount column had no money check at all, so moving
  // its basis changed a fixture total by 45% with all twelve suites passing.
  { id: 'src-basis-allocation', area: 'srcSvcOf', what: 'the spend plan sends the allocation basis, so unfunded money is exported with an obligation date',
    find: "  const p=(T||{})[it.id];\n  return p? p.d.slice() : SVC.map(_=>0);",
    repl: "  return svcAlloc(it)||[];" },
  { id: 'src-basis-disc-plus-mand', area: 'srcSvcOf', what: 'the spend plan sends mandatory dollars as well as discretionary',
    find: "  return p? p.d.slice() : SVC.map(_=>0);",
    repl: "  return p? p.d.map(function(v,i){ return v+(p.m[i]||0); }) : SVC.map(_=>0);" },
  // The row set of the Unfunded Requirements sheet decides whether reading #1 can be right at all:
  // drop the requirements the two readings disagree about and the column is left stating reading #2.
  { id: 'unf-sheet-one-reading-filter', area: 'exportExcel', what: 'the unfunded sheet lists only what BOTH pots leave short, so its vs-DISC total is wrong',
    find: "    && (unfTotOf(it,T[it.id])>0.005 || discUnfTotOf(it,T[it.id])>0.005));",
    repl: "    && (unfTotOf(it,T[it.id])>0.005));" },
  { id: 'discunf-agg-is-unf', area: 'exportExcel', what: 'the per-service reading #1 aggregate quietly sums reading #2',
    find: "    S.order.forEach(id=>{ const it=itemById(id); if(!it) return; discUnfSvcOf(it,T[id]).forEach((x,i)=>v[i]+=x); });",
    repl: "    S.order.forEach(id=>{ const it=itemById(id); if(!it) return; unfSvcOf(it,T[id]).forEach((x,i)=>v[i]+=x); });" },
  { id: 'tile-reading1-is-reading2', area: 'tierTotals', what: 'the dashboard states reading #2 twice and never reading #1',
    find: "    u1Amt+=discUnfTotOf(it,p); u2Amt+=unfTotOf(it,p);",
    repl: "    u1Amt+=unfTotOf(it,p); u2Amt+=unfTotOf(it,p);" },
  // A money column padded instead of filled: the sheet still opens, still cross-foots, and simply
  // never states the second reading on any subtotal.
  { id: 'drill-sub-pads-reading1', area: 'exportCSV', what: 'the drill subtotals pad the vs-DISC column instead of printing it',
    find: "{v:a2.fn,s:MB},{v:a2.u,s:MB},{v:a2.u1,s:MB},",
    repl: "{v:a2.fn,s:MB},{v:a2.u,s:MB},''," },
  // The 1A9A is a formal external return with nowhere to stamp a what-if marker.
  { id: 'cr-1a9a-follows-view', area: 'crExportRows', what: 'the 1A9A cash return follows the discretionary-only view, sending a what-if under a real heading',
    find: "  const svc=crData(), idx=CR_SVCS.map",
    repl: "  const svc=crData(scenOpt()), idx=CR_SVCS.map" },
  { id: 'cr-sheet-ignores-view', area: 'exportExcel', what: 'CR Cash Needs stops following the toggle, so a discretionary-only workbook states the funded plan',
    find: "  const crW=crWins(), crD=crData(scenOpt());",
    repl: "  const crW=crWins(), crD=crData();" },
  { id: 'mipr-no-bulk-setter', area: 'matBulk', what: 'the matrix draws a MIPR column it cannot sweep',
    find: "  out['MIPR type']={opts:Object.keys(MIPR_LBL).map(function(k){ return [k, MIPR_LBL[k]]; }),",
    repl: "  if(false) out['MIPR type']={opts:Object.keys(MIPR_LBL).map(function(k){ return [k, MIPR_LBL[k]]; }),"},
  { id: 'mipr-bulk-writes-label', area: 'matBulk', what: 'a bulk MIPR set writes the label, not the value',
    find: "              get:function(it){ return miprOf(it.id); },\n              set:function(id,v){ setMipr(id,v); }};",
    repl: "              get:function(it){ return miprOf(it.id); },\n              set:function(id,v){ setMipr(id, MIPR_LBL[v]||v); }};" },
  // The pop-up editor, driven directly by audit-board in BOTH builds -- the machinery is shared and
  // only the routing differs, so a mutation here cannot survive on whichever build does not route
  // through it in the UI.
  { id: 'fld-save-drops-edit', area: 'fldSave', what: 'the pop-up reports a save and writes nothing',
    find: "  const id=fldOpen.id, v=a.value;",
    repl: "  const id=fldOpen.id, v=D.get(fldOpen.id);" },
  { id: 'fld-stale-stays-open', area: 'fldBody', what: 'the editor stays open on a requirement that has gone',
    find: "  if(!it) fldOpen=null;                      // removed out from under the editor",
    repl: "  // removed out from under the editor" },
  { id: 'impact-band-gated', area: 'rowChipsHtml', what: 'the impact statement is reachable only where a band demands one',
    find: `onclick="toggleCons(&quot;'+id+'&quot;)" `,
    repl: `data-x="'+id+'" ` },

  // ---- the handoff, both directions: the no-fail path ------------------------------------------
  // The first two put back the defects found by auditing this feature after it was built.
  { id: 'handoff-custom-ask-lost', area: 'pmoApply', what: 'an accepted value on a CUSTOM requirement is written where applyState ignores it',
    find: "    if(r.key==='asks'){ if(applyAskVec(r.id, r.prop)) n++; return; }",
    repl: "    /* straight to the store */" },
  { id: 'handoff-no-svc-list', area: 'pmoSubmit', what: 'the submittal leaves its service list behind, so per-service figures cannot be aligned',
    find: '             ts:Date.now(), by:who, pmo:pmo, fromTs:(PMODE&&PMODE.ts)||0, svc:SVC.slice(),',
    repl: '             ts:Date.now(), by:who, pmo:pmo, fromTs:(PMODE&&PMODE.ts)||0,' },
  { id: 'handoff-svc-by-position', area: 'pmoTake', what: 'a reordered service list is taken at face value, landing each figure on the wrong service',
    find: "      fix(pkg.items); fix(pkg.base);",
    repl: "      /* positional */" },
  { id: 'handoff-svc-mismatch-ok', area: 'pmoTake', what: 'a submittal written for other services is loaded anyway',
    find: "    if(c.state==='mismatch'){",
    repl: "    if(false){" },
  { id: 'handoff-ask-custom-store', area: 'applyAskVec',
    equivalent: 'applyState() rebuilds DATA.items from the S.custom objects THEMSELVES, so itemById() '
      + 'on a custom returns the stored object and `it.ask=` has already written it \u2014 this line is '
      + 'belt and braces, not the only writer. audit-import.mjs asserts that aliasing invariant, so '
      + 'if it ever stops holding this stops being equivalent and that check fails first',
    what: 'a custom requirement\u2019s value never reaches the store a reload reads',
    find: "    if(c) c.ask=v.slice();                       // the store's own copy, belt and braces",
    repl: "    if(c) c.ask=c.ask;                            // the store's own copy, belt and braces" },
  { id: 'handoff-ask-stale-key', area: 'applyAskVec', what: 'a stale S.asks entry is left behind on a custom requirement',
    find: "    if(S.asks) delete S.asks[id];                // never leave a value applyState will ignore",
    repl: "    if(S.asks) S.asks[id]=v.slice();             // never leave a value applyState will ignore" },
  { id: 'handoff-copy-drops-store', area: 'buildSavedHtml', what: 'the PMO copy goes out without the reprogramming log it was built from',
    find: 'rpDb:RPDB})',
    repl: 'rpDb:null})' },
  { id: 'handoff-copy-drops-exec', area: 'buildSavedHtml', what: 'the PMO copy goes out without the execution data it was built from',
    find: 'execDb:EXDB,',
    repl: 'execDb:null,' },
  { id: 'handoff-copy-drops-ace', area: 'buildSavedHtml', what: 'the PMO copy goes out without the cost estimate it was built from',
    find: 'aceDb:ACEDB,',
    repl: 'aceDb:null,' },
  // A RENAME THAT MISSES A CALL SITE. This is the shape of the defect that shipped: the markup is
  // there, the box draws, the click raises a ReferenceError into a console nobody reads, and the
  // reviewer's only working control is "Tick all" -- accept everything or nothing.
  { id: 'handoff-tick-dead', area: 'subBody', what: 'the per-row tick box calls a function that does not exist',
    find: `\n          +' onchange="subPick(`,
    repl: `\n          +' onchange="pmoPick(` },
  { id: 'handoff-sends-added-req', area: 'pmoSubmit', what: 'a requirement added in the copy is sent as a row nobody can ever tick',
    find: "  Object.keys(items).forEach(function(id){ if(!base0[id]) delete items[id]; });   // travels whole, below",
    repl: "  /* send it anyway */" },
  { id: 'handoff-added-req-silent', area: 'pmoSubmit', what: 'the office is never told the requirement it added is not being sent',
    find: "  if(gaps.length){\n    alert(",
    repl: "  if(false){\n    alert(" },
  { id: 'handoff-listless-pkg', area: 'pmoTake', what: 'a submittal with no service list has its per-service figures read by position',
    find: "     && (Object.keys(pkg.items).some(function(id){ return Array.isArray((pkg.items[id]||{}).asks); })\n         || pkg.added.some(function(a){ return Array.isArray(a.ask); }))){",
    repl: "     && false){" },
  // The copy's storage isolation. Sharing the key let an office's older board win over the file
  // whenever its clock was later -- the copy showed the wrong portfolio and said nothing.
  { id: 'handoff-copy-shares-storage', area: 'boot', what: 'a PMO copy reads and writes the portfolio board\u2019s browser storage',
    find: "  _AP.key+=_ck;",
    repl: "  /* shared */" },
  { id: 'handoff-copy-appn-drift', area: 'boot', what: 'a copy opens as whichever appropriation the reader\u2019s browser last had',
    find: "  if(PMODE && PMODE.sandbox && APPNS[PMODE.ap]) return PMODE.ap;",
    repl: "  /* whatever they had */" },
  // The change report is the record the team signs off from.
  { id: 'report-drops-status', area: 'pmoReport', what: 'the report does not say which rows are ticked to apply',
    find: "      r.gone? 'requirement missing' : (PMOPICK[pickKey(r)]? 'ticked to apply' : 'not applied'),",
    repl: "      ''," },
  { id: 'report-hides-conflict', area: 'pmoReport', what: 'the report does not flag a field this board changed too',
    find: "      r.conflict? 'YES \\u2014 this board changed too' : '',",
    repl: "      '',                                    // the conflict column" },
  { id: 'report-proposed-is-current', area: 'pmoReport', what: 'the report prints the board\u2019s own value in the Proposed column',
    find: "      pmoFmtVal(r.key, r.prop),",
    repl: "      pmoFmtVal(r.key, r.now)," },
  // What is reviewed must be what would land.
  { id: 'review-promises-unstorable', area: 'pmoTake', what: 'the review shows a proposed value the board will never store',
    find: "      one.asks=askVecOf(one.asks);",
    repl: "      /* as sent */" },
  { id: 'review-pads-short-vector', area: 'pmoTake', what: 'a value with too few services is padded, zeroing a service in silence',
    find: "      if(!Array.isArray(one.asks) || one.asks.length!==SVC.length){ _wrong.push(id); return; }",
    repl: "      if(false){ _wrong.push(id); return; }" },
  // A file that leaves a PMO copy and does not say so can be briefed as the current plan.
  { id: 'export-name-unmarked', area: 'expName', what: 'a file exported from a PMO copy keeps the live board\u2019s filename',
    find: "  if(!SANDBOX) return String(n);",
    repl: "  if(true) return String(n);" },
  { id: 'export-title-unmarked', area: 'expTitle', what: 'a workbook exported from a PMO copy keeps the live board\u2019s title row',
    find: "  return SANDBOX? ('\u25e8 PMO COPY (snapshot of '+expStamp()",
    repl: "  return false? ('\u25e8 PMO COPY (snapshot of '+expStamp()" },
  { id: 'export-mark-undated', area: 'expStamp', what: 'the mark does not say WHEN the copy was published, so staleness cannot be judged',
    find: "function expStamp(){ return (PMODE && PMODE.ts)? new Date(PMODE.ts).toISOString().slice(0,10) : ''; }",
    repl: "function expStamp(){ return ''; }" },
  { id: 'export-mark-buried', area: 'expTitle', what: 'the caveat is appended, so it lands mid-line and reads as part of the sheet name',
    find: "+', NOT the current plan)  \u2014  '+t) : t;",
    repl: "+', NOT the current plan)') : t;" },
  { id: 'export-double-marks', area: 'expName', what: 'a submittal, which already says what it is, is marked a second time',
    find: "  if(/PMO COPY|SUBMITTAL/.test(s)) return s;          // already says exactly what it is",
    repl: "  /* mark it anyway */" },
  // ---- the totals themselves: does the arithmetic close? --------------------------------------
  // These break CONSERVATION, which no suite written against the board's own helpers can see --
  // tiers() and every export would agree about the broken number.
  { id: 'recon-trim-dropped', area: 'trimSvcOf', what: 'money asked for but never allocated stops being counted as unfunded',
    find: "  return SVC.map((s,i)=>Math.max(0, (it.ask[i]||0) - (b[i]||0)));\n}",
    repl: "  return SVC.map(()=>0);\n}" },
  { id: 'recon-beyond-netted', area: 'beyondSvcOf', what: 'the lane shortfall is netted across services instead of held per service',
    find: "  return SVC.map((s,i)=>Math.max(0, Math.min(it.ask[i]||0, b[i]||0) - ((p&&p.d[i])||0) - ((p&&p.m[i])||0)));",
    repl: "  const t=SVC.reduce((a,_,i)=>a+Math.max(0, Math.min(it.ask[i]||0, b[i]||0) - ((p&&p.d[i])||0) - ((p&&p.m[i])||0)),0);\n  return SVC.map(()=>t/SVC.length);" },
  { id: 'recon-unf-off-allocation', area: 'unfSvcOf', what: 'total unfunded is measured against the trimmed allocation instead of the ask',
    find: "  return SVC.map((s,i)=>Math.max(0, (it.ask[i]||0) - ((p&&p.d[i])||0) - ((p&&p.m[i])||0)));\n}\nfunction beyondSvcOf",
    repl: "  const b=basisSvcOf(it);\n  return SVC.map((s,i)=>Math.max(0, (b[i]||0) - ((p&&p.d[i])||0) - ((p&&p.m[i])||0)));\n}\nfunction beyondSvcOf" },
  { id: 'recon-discunf-nets-mand', area: 'discUnfSvcOf', what: 'the vs-DISC reading nets mandatory off, making it the other reading',
    find: "  return SVC.map((s,i)=>Math.max(0, (it.ask[i]||0) - ((p&&p.d[i])||0)));",
    repl: "  return SVC.map((s,i)=>Math.max(0, (it.ask[i]||0) - ((p&&p.d[i])||0) - ((p&&p.m[i])||0)));" },
  { id: 'recon-month-scope-unnamed', area: 'monSheet', what: 'a month sheet claims ALL SERVICES while covering only its own list',
    find: "    const _all = (svcNames.length===SVC.length)",
    repl: "    const _all = true || (svcNames.length===SVC.length)" },
  // ---- the other exportable products -----------------------------------------------------------
  // exportExcel and the deck are not the only things that get briefed.
  { id: 'plans-svc-mislabel', area: 'planSheet', what: 'the spend plans call this plan\u2019s per-service ask "allocated", so it disagrees with the Allocated column beside it',
    find: "      ...SVC.map(sv=>sv+' asked'), ...SVC.map(sv=>sv+' funded')].map(v=>({v,s:H})));",
    repl: "      ...SVC.map(sv=>sv+' allocated'), ...SVC.map(sv=>sv+' funded')].map(v=>({v,s:H})));" },
  { id: 'plans-svc-funded-wrong', area: 'planSheet', what: 'the per-service funded breakout prints the ask instead of what was funded',
    find: "        ...SVC.map((sv,i)=>({v:p.want[i]||0,s:N})), ...SVC.map((sv,i)=>({v:p.got[i]||0,s:N}))]);",
    repl: "        ...SVC.map((sv,i)=>({v:p.want[i]||0,s:N})), ...SVC.map((sv,i)=>({v:p.want[i]||0,s:N}))]);" },
  { id: 'plans-alloc-not-split', area: 'planSheet', what: 'Allocated stops being Disc allocated plus Mand allocated',
    find: "        {v:dr.d+dr.m,s:N},{v:dr.d,s:N},{v:dr.m,s:N},{v:p.gotT,s:N},",
    repl: "        {v:dr.d,s:N},{v:dr.d,s:N},{v:dr.m,s:N},{v:p.gotT,s:N}," },
  // ---- appropriation packages: the other path that takes numbers this board did not compute -----
  { id: 'pkg-svc-unguarded', area: 'pkgApply', what: 'a package for another appropriation lands its per-service figures with no check at all',
    find: "      if(!svcGuardImport(pkg.ms, _in, (fname||(nm+' package')), _to)) return false;",
    repl: "      /* unguarded */" },
  { id: 'pkg-svc-wrong-list', area: 'pkgApply', what: 'a package is checked against the services ON SCREEN, not the ones that appropriation holds',
    find: "      if(!svcGuardImport(pkg.ms, _in, (fname||(nm+' package')), _to)) return false;",
    repl: "      if(!svcGuardImport(pkg.ms, _in, (fname||(nm+' package')))) return false;" },
  { id: 'pkg-pack-order-stale', area: 'pkgApply', what: 'the remapped state still says it is in the sender\u2019s service order, so a reload undoes the remap',
    find: "      if(_in && Array.isArray(_in.services)) _in.services = _to.slice();",
    repl: "      /* left as sent */" },

  // ---- the change journal: the safety net under every accepted change -----------------------------
  { id: 'jrnl-undo-wrong-way', area: 'jrnlUndo', what: 'undo writes the value back that it was meant to remove',
    find: "  if(!jrnlSet(fy, e.p, e.a)){",
    repl: "  if(!jrnlSet(fy, e.p, e.b)){" },
  { id: 'jrnl-reversal-unrecorded', area: 'jrnlUndo', what: 'a reversal leaves no trail, so the change it undid cannot be seen to have been undone',
    find: "  jrnlAdd({t:Date.now(), by:whoAmI()||'unknown', fy:fy, p:e.p.slice(), a:e.b, b:e.a, f:1});",
    repl: "  /* no trail */" },
  { id: 'jrnl-big-undoable', area: 'jrnlUndoable', what: 'a value too large to have been recorded is offered as undoable, so undoing it puts back a placeholder',
    find: "  && !(e.a&&e.a._b) && !(e.b&&e.b._b)); }",
    repl: "  ); }" },

  // ---- the PMO copy, and what a programme office may send back ---------------------------------
  { id: 'pmo-gate-open', area: 'sandboxBlock', what: 'a PMO copy can write back over the team\u2019s board',
    find: '  if(!SANDBOX) return false;',
    repl: '  if(true) return false;' },
  { id: 'pmo-persist-blocked', area: 'persist', what: 'a PMO copy cannot keep its own work either, losing an afternoon on refresh',
    find: 'function persist(){\n  MS.years[MS.cur]=S;',
    repl: 'function persist(){\n  if(SANDBOX) return false;\n  MS.years[MS.cur]=S;' },
  { id: 'pmo-submits-everything', area: 'pmoSubmitBuild', what: 'a submittal carries fields a PMO was never invited to propose',
    find: "    PMO_KEYS.forEach(function(k){\n      let now=pmoVal(S,k,id);",
    repl: "    ['desc','cons','notes','asks','ccar','pid','recNames','mc','band','alloc'].forEach(function(k){\n      let now=pmoVal(S,k,id);" },
  { id: 'pmo-no-baseline', area: 'pmoSubmit', what: 'the submittal leaves its baseline behind, so no conflict can ever be seen',
    find: '             items:items, base:base, added:added};',
    repl: '             items:items, base:{}, added:added};' },
  { id: 'pmo-conflict-blind', area: 'pmoRows', what: 'a field this board changed too is applied without a word',
    find: '                 conflict: was!==undefined && !pmoSame(now, was)});',
    repl: '                 conflict: false});' },
  { id: 'pmo-prechecked', area: 'pmoTake', what: 'proposed changes arrive already ticked',
    find: '  PMOPICK={};\n  const n=pmoRows().length;',
    repl: '  PMOPICK={}; pmoRows().forEach(function(r){ PMOPICK[r.id+\'|\'+r.key]=true; });\n  const n=pmoRows().length;' },
  { id: 'pmo-applies-unticked', area: 'pmoApply', what: 'apply takes every proposed change, not only the ticked ones',
    find: "  const rows=pmoRows().filter(function(r){ return PMOPICK[pickKey(r)] && !r.gone && !r.taken; });",
    repl: "  const rows=pmoRows().filter(function(r){ return !r.gone && !r.taken; });" },
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
  // RE-AIMED TWICE NOW, and the second time says what the first did not. It first dropped the band
  // copy and left the tier one; when tier went the find matched nothing. It was re-aimed onto two
  // ADJACENT LINES of copies -- and adding the MIPR container put cp(T.mipr,...) on the end of the
  // band line, so the two-line find matched nothing again. Both misses reported NOT APPLIED, which
  // fails the sweep rather than passing it, which is the only reason either was ever noticed.
  //
  // The lesson is about the TARGET, not the container: a find spanning lines that GROW every time
  // someone adds a container is a target that disarms itself on schedule. It is aimed at a single
  // whole statement now, and at the NEWEST container, because the copy a person forgets to write is
  // the one they just added to the normalise list. audit-import.mjs reads that list out of the
  // board's own source and proves every container in it actually receives data, so dropping any
  // one of them fails there -- this mutation is what proves that check still bites.
  { id: 'year-drops-a-container', area: 'yearCopy', what: 'one attached container is normalised on the target but never filled',
    find: " cp(T.mipr, (S.mipr||{})[id]);",
    repl: "" },
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
  // Re-aimed when seedSplit stopped rounding. Both used to target the rounded line; after the
  // change they matched nothing and proved nothing -- which is why NOT APPLIED fails the run.
  { id: 'split-seed-drops-mand', area: 'seedSplit', what: 'conversion freezes discretionary but forgets the mandatory draw',
    find: "  S.fsrc[id]={m:'split', dv:p.d.slice(), mv:p.m.slice()};",
    repl: "  S.fsrc[id]={m:'split', dv:p.d.slice(), mv:p.m.map(function(){return 0;})};" },
  { id: 'split-seed-floors', area: 'seedSplit', equivalent: 'p.d and p.m are whole dollars now -- tiers() draws them with Math.min of integers, so rounding or flooring them at conversion is the identity. This was a real mutation while money was a float. audit-board.mjs asserts Number.isInteger on every lane draw, so if that invariant ever breaks THAT check fails first and this stops being equivalent', what: 'conversion floors each service, losing a fraction per service',
    find: "  S.fsrc[id]={m:'split', dv:p.d.slice(), mv:p.m.slice()};",
    repl: "  S.fsrc[id]={m:'split', dv:p.d.map(v=>Math.floor(v)), mv:p.m.map(v=>Math.floor(v))};" },
  // Declaring the two rounding mutations equivalent would leave this line with nothing aimed at
  // it, which is how a line quietly stops being covered while the sweep still looks healthy. This
  // one is not about rounding and bites whatever the money model is: freeze the draw into the
  // WRONG lane and the conversion stops being lossless.
  { id: 'split-seed-swaps-lanes', area: 'seedSplit', what: 'conversion freezes the mandatory draw as directed DISCRETIONARY and the discretionary draw as MANDATORY',
    find: "  S.fsrc[id]={m:'split', dv:p.d.slice(), mv:p.m.slice()};",
    repl: "  S.fsrc[id]={m:'split', dv:p.m.slice(), mv:p.d.slice()};" },
  { id: 'convert-skips-some', area: 'convertAllToSplit', what: 'the bulk convert quietly leaves some requirements on the lane walk',
    find: "  const ids=S.order.filter(id=>!S.fsrc[id] && T[id]);",
    repl: "  const ids=S.order.filter(id=>!S.fsrc[id] && T[id]).slice(0,1);" },
  { id: 'discunf-nets-mandatory', area: 'discUnfSvcOf', what: 'unfunded vs DISC nets off mandatory, so it stops being a one-pot reading',
    find: "  return SVC.map((s,i)=>Math.max(0, (it.ask[i]||0) - ((p&&p.d[i])||0)));",
    repl: "  return SVC.map((s,i)=>Math.max(0, (it.ask[i]||0) - ((p&&p.d[i])||0) - ((p&&p.m[i])||0)));" },
  { id: 'discunf-off-allocation', area: 'discUnfSvcOf', what: 'unfunded vs DISC measured off the trimmed allocation instead of the ask',
    find: "function discUnfSvcOf(it, p){",
    repl: "function discUnfSvcOf(it, p){ const _b=basisSvcOf(it); return SVC.map((s,i)=>Math.max(0,(_b[i]||0)-((p&&p.d[i])||0)));" },
  { id: 'discunf-not-floored', area: 'discUnfSvcOf', equivalent: 'basisSvcOf() clamps the allocation to the ask, so no service can be funded above its own requirement and ask - d [- m] is never negative -- this floor is now arithmetically unreachable. It was a real mutation while an over-allocation could be drawn in full. audit.mjs asserts \'funded never exceeds the requirement\' per service on every scenario, and basis-over-ask proves the clamp is enforced, so if either gives way THOSE fail first and this stops being equivalent', what: 'unfunded vs DISC lets an over-funded service pay down another service',
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

  // ---- an allocation above the ask must not become money -----------------------------------------
  // Over-allocate a service and, unclamped, the engine SPENDS lane money the requirement never
  // asked for and reports whatever the lane could not cover as UNFUNDED -- so a service drawn to
  // its full requirement shows a shortfall. Both mutations put that back. The check that settles
  // it is the identity, not the figure: beyond + trim == the requirement's own shortfall.
  { id: 'basis-over-ask', area: 'basisSvcOf', what: 'an allocation above a service\u2019s ask is drawn in full, spending lane money nothing asked for',
    find: '  return SVC.map(function(_,i){ return Math.min(D$(a[i]), Math.max(0, D$(it.ask[i]))); });',
    repl: '  return a.map(D$);' },
  { id: 'basis-clamps-to-alloc', area: 'basisSvcOf', what: 'the clamp is applied the wrong way round, so a trim is erased instead of an over-allocation',
    find: '  return SVC.map(function(_,i){ return Math.min(D$(a[i]), Math.max(0, D$(it.ask[i]))); });',
    repl: '  return SVC.map(function(_,i){ return Math.max(D$(a[i]), Math.max(0, D$(it.ask[i]))); });' },

  // ---- unspent discretionary vs the trims that could take it -----------------------------------
  // The ORDER is the claim. Sorted by size, or netted across services, the list still looks
  // plausible and names requirements the lane cannot actually fund -- which is worse than not
  // answering the question, because someone would type those figures into allocation boxes.
  { id: 'trim-absorb-unordered', area: 'trimAbsorb', what: 'the list hands the remaining lane to the biggest trim instead of the highest priority',
    find: '  S.order.forEach(function(id){\n    const it = itemById(id); if(!it) return;\n    const basis = basisSvcOf(it);',
    repl: '  S.order.slice().sort(function(x,y){ const a=itemById(x), b=itemById(y);\n    return (b?askTot(b):0)-(a?askTot(a):0); }).forEach(function(id){\n    const it = itemById(id); if(!it) return;\n    const basis = basisSvcOf(it);' },
  { id: 'trim-absorb-uncapped', area: 'trimAbsorb', what: 'a row is offered its whole trim whether the lane can cover it or not',
    find: '    const take = SVC.map((_,i)=>Math.min(trim[i], left[i]));',
    repl: '    const take = trim.slice();' },
  { id: 'trim-absorb-netted', area: 'trimAbsorb', what: 'one service\u2019s spare lane money is shown covering another service\u2019s trim',
    find: '    const take = SVC.map((_,i)=>Math.min(trim[i], left[i]));',
    repl: '    const _pool=left.reduce((a,b)=>a+b,0);\n    const take = SVC.map((_,i)=>Math.min(trim[i], _pool));' },
  { id: 'trim-absorb-lists-funded', area: 'trimAbsorb', what: 'requirements allocated in full are listed as having something to absorb',
    find: '    if(trimTot <= 0) return;                       // not trimmed: nothing here to absorb anything',
    repl: '    /* everything is listed */' },
  { id: 'trim-absorb-beyond-hidden', area: 'trimAbsorb', what: 'trim no lane can reach is reported as zero, so it reads as fully placeable',
    find: '    const beyond = SVC.map((_,i)=>trim[i] - take[i]);',
    repl: '    const beyond = SVC.map(()=>0);' },

  // ---- whole dollars: the model must not carry fractions ---------------------------------------
  // Money was stored as a float and rounded only FOR DISPLAY, so a third of a cent per service
  // passed every 0.005 tolerance in this codebase while still tripping the >0.005 tests that decide
  // what counts as unfunded -- a UFR nobody was short of. audit-board asserts Number.isInteger for
  // exactly that reason: the rule cannot be expressed with the tolerance it exists to eliminate.
  // These five put each route back.
  { id: 'money-floats-again', area: 'D$', what: 'money stops being rounded at the door, so fractions re-enter the model',
    find: 'const D$ = v => { const n = Math.round(Number(v)); return isFinite(n)? n : 0; };',
    repl: 'const D$ = v => { const n = Number(v); return isFinite(n)? n : 0; };' },
  { id: 'apportion-naive-round', area: 'apportion', what: 'each service is rounded on its own, so the parts stop summing to the total',
    find: '  const out = raw.map(Math.floor);',
    repl: '  const out = raw.map(Math.round);' },
  { id: 'apportion-drops-remainder', area: 'apportion', what: 'the leftover dollars are never handed out, so an allocation quietly shrinks',
    find: '  for(let k=0; left>0 && k<order.length; k++){ out[order[k].i]++; left--; }',
    repl: '  /* the remainder is dropped */' },
  { id: 'svcalloc-prorates-raw', area: 'svcAlloc', what: 'a scalar allocation goes back to a raw pro-rata spread, leaving a fraction on every lane',
    find: '  return apportion(a.v, at>0? it.ask : SVC.map(_=>1));',
    repl: '  return at>0? it.ask.map(x=>a.v*x/at) : SVC.map(_=>a.v/SVC.length);' },
  { id: 'split-share-fractional', area: 'tiers', what: 'a legacy whole-requirement split spreads fractional dollars across the services',
    find: '        const Dv=apportion(D, basis), Mv=apportion(M, basis);',
    repl: '        const Dv=basis.map(v=>D*(tot>0? v/tot : 0)), Mv=basis.map(v=>M*(tot>0? v/tot : 0));' },

  // ---- directed is not drawn -------------------------------------------------------------------
  // ONE rule, shared by both builds' split editors -- the grid's RECORD panel and the card's row
  // expander -- so a single spelling covers both. A cell stating only what was DIRECTED shows a
  // service as fully funded beside its own non-zero UFR and stops its column footing to its own
  // total, which is precisely the defect this replaced.
  { id: 'drew-line-silent', area: 'drewLine', what: 'the cell states only what was directed, so a short lane reads as fully funded',
    find: DREW_LINE_FIND,
    repl: "const drewLine = (directedV, drawnV, capV) => '';" },
  { id: 'drew-echoes-directed', area: 'drewLine', what: 'the second reading echoes the directed figure instead of what the lane supplied',
    find: DREW_LINE_FIND,
    repl: DREW_LINE_ECHO },
  { id: 'directed-total-silent', area: 'directedLine', what: 'the column total stops stating the directed sum, so the column does not foot on screen',
    find: DIRECTED_LINE_FIND,
    repl: "const directedLine = (directedV, drawnV, capV) => '';" },
  { id: 'drew-gap-never', area: 'drewGap', what: 'a shortfall is never judged worth stating, silencing both readings at once',
    find: 'const drewGap = (directedV, drawnV) => (directedV - drawnV) > 0.005;',
    repl: 'const drewGap = (directedV, drawnV) => false;' },

  // ---- the allocation is the cap, and it has to be settable ------------------------------------
  // Two limits can refuse a directed dollar and they are not the same decision: a trimmed ROW
  // ALLOCATION can be raised here in a minute, a dry LANE is the topline. Naming the wrong one sent
  // a reader hunting money that was never the constraint -- it shipped, on a prime contract whose
  // CLIN work had left the row under the ask, beside a lane still holding $704M.
  { id: 'why-always-lane', area: 'drewWhy', what: 'an allocation cap is reported as a lane shortage, the exact defect v1.62 fixed',
    find: DREW_WHY_FIND,
    repl: "const drewWhy = (drawnV, capV) => 'the lane could not supply the rest';" },
  { id: 'why-always-alloc', area: 'drewWhy', what: 'a genuinely dry lane is blamed on the allocation instead',
    find: DREW_WHY_FIND,
    repl: "const drewWhy = (drawnV, capV) => 'the allocation for this service stops at '+fM(capV)+' \\u2014 raise the allocation to draw more';" },
  // THE TRAP ITSELF. v1.61 made the allocation the basis every draw is measured against and left
  // the control that sets it disabled under a funding-source override, so the figure that capped
  // the requirement could not be edited anywhere. Both builds share render(), so one spelling does.
  { id: 'row-alloc-disabled-again', area: 'render', what: 'the row allocation goes read-only for a forced source, leaving it unsettable',
    find: `        : \`<input class="\${isSvc?'svcmode':''}" style="\${S.fsrc[id]?'border-color:var(--gold)':''}"`,
    repl: `        : \`<input \${S.fsrc[id]?'disabled':''} class="\${isSvc?'svcmode':''}" style="\${S.fsrc[id]?'border-color:var(--gold)':''}"` },
  // The same trap one layer down: the control is there and does nothing. Targets the SETTER, which
  // both builds share, rather than either editor's markup.
  { id: 'alloc-locked-under-override', area: 'setAlloc', what: 'the allocation setter silently refuses to write while a funding source is set',
    find: `function setAlloc(id,val){
  const v=parseAmt(val);`,
    repl: `function setAlloc(id,val){
  if(S.fsrc[id]) return;
  const v=parseAmt(val);` },

  // ---- a directed split states its own allocation -----------------------------------------------
  // The second authority. A per-service split types its dollars per service; a row allocation held
  // beside it said the same thing in a different number, capped what could be typed, and produced a
  // UFR nothing could clear. These put the second number back, one way each.
  { id: 'split-alloc-ignores-directed', area: 'svcAlloc', what: 'a directed split goes back to drawing against a separate row allocation',
    find: `  const fo=(S.fsrc||{})[it.id];
  if(fo && fo.m==='split' && Array.isArray(fo.dv)){`,
    repl: `  const fo=null;
  if(fo && fo.m==='split' && Array.isArray(fo.dv)){` },
  { id: 'split-alloc-drops-mand', area: 'svcAlloc', what: 'a split counts only its discretionary dollars as allocated, so every directed mandatory dollar falls outside the basis',
    find: `    return SVC.map(function(_,i){ return D$(fo.dv[i]||0) + D$((fo.mv||[])[i]||0); });`,
    repl: `    return SVC.map(function(_,i){ return D$(fo.dv[i]||0); });` },
  // THE CLIN GRID IS A VISUAL BREAKOUT AND FEEDS NOTHING. This offers it a way into the funding
  // math on exactly the requirements that state their own allocation by hand.
  // ---- "unfunded" means the same thing on every surface that says it ------------------------------
  // p.u is BEYOND BOTH LANES -- allocated, and no lane could pay it. It is strictly smaller than
  // either ask-based reading, and on a board of hand-directed requirements with flush lanes it is
  // ZERO. Printing it under the word UNFUNDED made seven panels read $0 while the portfolio carried
  // hundreds of millions. Each of these puts one of those panels back.
  { id: 'lane-table-unf-beyond', area: 'svcSummary', what: 'the service lane table prints BEYOND under its Unfunded column again',
    find: `    const uv=unfSvcOf(it,p);
    SVC.forEach((s,i)=>{ d[i]+=p.d[i]; m[i]+=p.m[i]; u[i]+=uv[i]; });
    it.ask.forEach((v,i)=>ask[i]+=v);`,
    repl: `    const uv=p.u;
    SVC.forEach((s,i)=>{ d[i]+=p.d[i]; m[i]+=p.m[i]; u[i]+=uv[i]; });
    it.ask.forEach((v,i)=>ask[i]+=v);` },
  { id: 'team-table-unf-beyond', area: 'teamSummary', what: 'the team table reports BEYOND as unfunded again',
    find: `    a.disc+=p.dT; a.mand+=p.mT; a.unf+=unfTotOf(it,p);   // ask-based, not BEYOND`,
    repl: `    a.disc+=p.dT; a.mand+=p.mT; a.unf+=p.uT;` },
  { id: 'mc-warn-unf-beyond', area: 'scoreboard', what: 'the must-pay warning measures the shortfall against the allocation again',
    find: `    if(S.mc[id]&&T[id]&&it2){ mcCov+=T[id].mT; mcUnf+=unfTotOf(it2,T[id]); } });`,
    repl: `    if(S.mc[id]&&T[id]&&it2){ mcCov+=T[id].mT; mcUnf+=T[id].uT; } });` },

  // ---- every requirement takes a typed Disc and Mand ----------------------------------------------
  // The gate. A cell that refuses the keystroke until you have flipped a setting is the automatic
  // lane walk defending itself, on a board whose direction is that every requirement is hand-set.
  { id: 'disc-mand-gated', area: 'setFsrcSvc', what: 'Disc and Mand refuse a typed dollar until the requirement has been converted first',
    find: `  let fo=S.fsrc[id];
  if(!fo || fo.m!=='split'){ seedSplit(id); fo=S.fsrc[id]; }`,
    // The boxes are still offered; they simply stop working, which is the worse half of the defect.
    repl: `  let fo=S.fsrc[id];` },
  // Converting on a keystroke must move NO money. A seed that re-bases on the ask changes figures
  // the user never touched, on a board they are about to brief.
  { id: 'seed-on-type-rebases', area: 'setFsrcSvc', what: 'the first keystroke seeds the split from the ask instead of the draw, moving money nobody touched',
    find: `  if(!fo || fo.m!=='split'){ seedSplit(id); fo=S.fsrc[id]; }`,
    repl: `  if(!fo || fo.m!=='split'){ const _it=itemById(id); S.fsrc[id]={m:'split', dv:_it.ask.slice(), mv:SVC.map(_=>0)}; fo=S.fsrc[id]; }` },

  // ---- the PMO tabs' obligation report ------------------------------------------------------------
  // A row that does not cross-foot is worse than no row: a reader adds the month columns across,
  // expects Total (Disc+Mand), and finds a hole against a figure printed on the same line.
  { id: 'oblig-drops-unscheduled', area: 'exportExcel', what: 'funded dollars with no award date vanish from the PMO report instead of landing in Unscheduled',
    find: `      const uns=sp.unsch.reduce((a,b)=>a+b,0);`,
    repl: `      const uns=0;` },
  { id: 'oblig-widths-stale', area: 'exportExcel', what: 'the PMO report column widths are one block short, so every figure prints under the wrong heading',
    find: `  const obligCols=[8,10,22,44,44,13,17, 16,17,18,
                   ...SVC.map(_=>13), ...SVC.map(_=>13), 18, ...FYMON.map(_=>12), 14];`,
    repl: `  const obligCols=[8,10,22,44,44,13,17, 16,17,18,
                   ...SVC.map(_=>13), 18, ...FYMON.map(_=>12), 14];` },

  // ---- the banded headings over the PMO report ------------------------------------------------
  // A band is a heading that claims a block of columns. One column short or long and it claims
  // figures it does not describe, on the row a reader uses to know what they are looking at.
  { id: 'band-disc-short', area: 'exportExcel', what: 'the Disc Allocations band stops one column short of the services it heads',
    find: `                     {r:bandRow, c:I_SM,  cs:nS},`,
    repl: `                     {r:bandRow, c:I_SM,  cs:nS-1},` },
  { id: 'band-not-painted', area: 'exportExcel', what: 'only the labelled cell of each band is painted, so the colour stops after the first column',
    find: `    for(let i=I_SD;i<I_SM;i++) band[i]={v:'',s:BAND_D};`,
    repl: `    for(let i=I_SD;i<I_SM;i++) band[i]='';` },
  { id: 'band-one-colour', area: 'exportExcel', what: 'all three bands take the same fill, so three headings in a row read as one',
    find: `  const BAND_D=XF_EXTRA0, BAND_M=XF_EXTRA0+1, BAND_P=XF_EXTRA0+2;`,
    repl: `  const BAND_D=XF_EXTRA0, BAND_M=XF_EXTRA0, BAND_P=XF_EXTRA0;` },
  // THE ONE THAT STOPS THE FILE OPENING. mergeCells belongs after sheetData; before it, Excel
  // refuses the part outright and the workbook does not open at all.
  { id: 'merge-before-sheetdata', area: 'buildXlsx', what: 'mergeCells is written before sheetData, which makes Excel refuse the whole sheet',
    find: `'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+views+cols+'<sheetData>'+rows+'</sheetData>'+merges+'</worksheet>')]);`,
    repl: `'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+views+cols+merges+'<sheetData>'+rows+'</sheetData></worksheet>')]);` },
  { id: 'merge-count-wrong', area: 'buildXlsx', what: 'the declared merge count does not match the merges written, which Excel repairs the file over',
    find: `      ? '<mergeCells count="'+s.merges.length+'">'`,
    repl: `      ? '<mergeCells count="'+(s.merges.length+1)+'">'` },

  // ---- the three summary columns --------------------------------------------------------------
  { id: 'oblig-ask-unshared', area: 'exportExcel', what: 'the Ask column shows the whole requirement while every figure beside it is the office\u2019s share, so the row stops closing',
    find: `      const av=it.ask.map((v,i)=>v*f(i));`,
    repl: `      const av=it.ask.slice();` },
  { id: 'oblig-disc-is-funded', area: 'exportExcel', what: 'the Disc allocated column carries disc + mand, so the two summary columns say the same thing',
    find: `      {v:r.aT,s:N}, {v:r.dT,s:N}, {v:r.dT+r.mT,s:N},`,
    repl: `      {v:r.aT,s:N}, {v:r.dT+r.mT,s:N}, {v:r.dT+r.mT,s:N},` },
  // The office's SHARE, scaled per service exactly as the sections above it are. Dropping the
  // scaling makes a requirement spanning two offices count whole on both, and the tab stops adding
  // back to its row on the PMO Matrix.
  { id: 'oblig-ignores-share', area: 'exportExcel', what: 'the PMO report shows the whole requirement on every office that owns a piece of it',
    find: `      const dv=p.d.map((v,i)=>v*f(i)), mv=p.m.map((v,i)=>v*f(i));`,
    repl: `      const dv=p.d.slice(), mv=p.m.slice();` },
  // UFR is what the office is still SHORT. Folding it into the funded total makes the report state
  // money the board does not have, on the line somebody reads the obligation plan from.
  { id: 'oblig-ufr-inside-total', area: 'exportExcel', what: 'the PMO report adds UFR into Total (Disc+Mand)',
    // The row layout moved: the funded total is one of three summary columns after PID now, and
    // UFR sits on its own further right. Same claim, aimed at where the figure actually is.
    find: `      {v:r.aT,s:N}, {v:r.dT,s:N}, {v:r.dT+r.mT,s:N},`,
    repl: `      {v:r.aT,s:N}, {v:r.dT,s:N}, {v:r.dT+r.mT+r.uT,s:N},` },
  // Two placement rules for one question. This one buckets every funded dollar into the first
  // month, which is what a second implementation drifts into looking like.
  { id: 'oblig-months-collapse', area: 'exportExcel', what: 'the PMO report stops reading the award dates and piles every dollar into October',
    find: `      const mon=FYMON.map((x,k)=>SVC.reduce((a,sv,i)=>a+(sp.m[i][k]||0),0));`,
    repl: `      const mon=FYMON.map((x,k)=>k? 0 : SVC.reduce((a,sv,i)=>a+sp.m[i].reduce((q,w)=>q+w,0),0));` },

  // ---- a submittal carries one office's requirements ---------------------------------------------
  // The scope is what lets several submittals be reviewed side by side: two of them can never
  // contest one field. Break it and the review is back to arbitrating between offices, silently.
  { id: 'submit-sends-other-office', area: 'pmoSubmit', what: 'a submittal carries requirements another office owns',
    find: `  foreign.forEach(function(id){ delete items[id]; });`,
    repl: `  foreign.forEach(function(id){ void id; });` },
  { id: 'submit-foreign-silent', area: 'pmoSubmit', what: 'the office is never told which of its edits are not being sent',
    find: `  if(foreign.length){
    const nm=foreign.map(function(id){ const it=itemById(id);`,
    repl: `  if(false){
    const nm=foreign.map(function(id){ const it=itemById(id);` },
  { id: 'submit-no-pmo-in-pkg', area: 'pmoSubmit', what: 'the package does not say which office it is from, so nothing downstream can scope it',
    find: `             ts:Date.now(), by:who, pmo:pmo, fromTs:(PMODE&&PMODE.ts)||0, svc:SVC.slice(),`,
    repl: `             ts:Date.now(), by:who, fromTs:(PMODE&&PMODE.ts)||0, svc:SVC.slice(),` },
  // THE BOARD DOES NOT TRUST THE SENDER TO HAVE DONE IT. The package is a JSON file; a hand edit
  // or an older build is all it takes for another office's row to arrive anyway.
  { id: 'take-ignores-scope', area: 'pmoTake', what: 'a row the sending office does not own is reviewed anyway',
    find: `      outOfScope.push(grpOf(it)+' \\u2014 '+(recName(it)||dispTitle(it)));
      delete pkg.items[id];`,
    repl: `      outOfScope.push(grpOf(it)+' \\u2014 '+(recName(it)||dispTitle(it)));` },
  { id: 'take-stacks-same-office', area: 'pmoTake', what: 'a second round from one office is held beside the first, offering the same field twice',
    find: `  dup.slice().reverse().forEach(function(i){ PMOSUBS.splice(i,1); });`,
    repl: `  dup.slice().reverse().forEach(function(i){ void i; });` },
  // Clearing the packages on apply throws away every proposal that was NOT accepted, the moment
  // the first batch goes in -- which is what the single-package version did.
  { id: 'apply-discards-unapplied', area: 'pmoApply', what: 'applying clears every held submittal, losing what was not accepted',
    find: `  applyState(MS.years[MS.cur]);
  PMOPICK={};
  save(); render();`,
    repl: `  applyState(MS.years[MS.cur]);
  PMOPICK={}; PMOSUBS=[];
  save(); render();` },

  // ---- the PMO menu ------------------------------------------------------------------------------
  // The offices moved off a chip strip that showed the selection at a glance. A menu does not, so
  // the button has to carry it -- otherwise the board shows one office's requirements while looking
  // like it shows the portfolio, which is a briefing error waiting to happen.
  { id: 'pmo-button-silent', area: 'syncBtns', what: 'the PMO button stops naming the office that is selected',
    find: `    if(bp) bp.textContent='🏢 '
      + (filter==='ALL'? 'PMO' : filter)`,
    repl: `    if(bp) bp.textContent='🏢 '
      + 'PMO'` },
  { id: 'pmo-hides-empty-office', area: 'syncBtns', what: 'an office with no requirements is left out of the menu, so one just added looks like it failed',
    find: `        const empty=keys.filter(function(g){ return !counts[g]; });
        if(!empty.length) return '';`,
    repl: `        const empty=keys.filter(function(g){ return !counts[g]; });
        if(empty.length>=0) return '';` },
  { id: 'pmo-counts-ignore-moves', area: 'pmoCounts', what: 'the menu counts requirements by their file value, so a reassignment never shows',
    find: `  GROUPS.forEach(function(g){ counts[g]=DATA.items.filter(function(i){ return grpOf(i)===g; }).length; });`,
    repl: `  GROUPS.forEach(function(g){ counts[g]=DATA.items.filter(function(i){ return i.grp===g; }).length; });` },

  // ---- CR cash needs: crData's own arithmetic ------------------------------------------------------
  { id: 'cr-half-ignored', area: 'crData', what: 'a requirement flipped to the 16-EOM half is placed in the 1-15 half anyway',
    find: "      const half=(S.crHalf[id]&&S.crHalf[id][e.ym])?1:0;", repl: "      const half=0;" },
  { id: 'cr-nodate-dropped', area: 'crData', what: 'funded money with no award date vanishes instead of landing in the no-date bucket',
    find: "    if(!scheduled) SVC.forEach((s,i)=>{ if(fSv[i]>0.005) svc[i].nodate+=fSv[i]; });",
    repl: "    if(!scheduled) SVC.forEach((s,i)=>{ if(fSv[i]>0.005) svc[i].nodate+=0; });" },
  { id: 'cr-inc-equal-split', area: 'crData', what: 'increments are split equally instead of by their own per-service amounts',
    find: "            const amt=fSv[i]*w[j]/wsum;", repl: "            const amt=fSv[i]/w.length;" },
  { id: 'cr-tot-untallied', area: 'crData', what: 'a service’s TOTAL IN WINDOW stops counting what lands',
    find: "        svc[i].win[w]+=e.amts[i]; svc[i].tot+=e.amts[i];", repl: "        svc[i].win[w]+=e.amts[i];" },
  { id: 'cr-window-not-doubled', area: 'crData', what: 'the window index forgets there are two halves per month, so November lands in the second half of October',
    find: "      const w=mi[e.ym]*2+half;", repl: "      const w=mi[e.ym]+half;" },
  { id: 'cr-zero-weight-lost', area: 'crData', what: 'an incremental award with no weights loses its money instead of reporting it as undated',
    find: "          if(wsum<=0){ svc[i].nodate+=fSv[i]; return; }", repl: "          if(wsum<=0){ return; }" },

  // ---- the funds flow: a plan year is the lane draw, and every total closes -------------------------
  { id: 'flow-plan-year-allocation', area: 'flowPlanRecs', what: 'a plan year is answered from the allocation, so the flow counts money beyond both lanes as funding',
    find: "      const vals=SVC.map(function(_,i){ return (p.d[i]||0)+(p.m[i]||0); });", repl: "      const vals=svcAlloc(it)||[];" },
  { id: 'flow-prime-not-in-total', area: 'flowCalc', what: 'a prime’s money reaches its own line and not the prime total',
    find: "      if(k){ F.prime[k].v+=amt; F.prime[k].rows.push(rec); F.primeTot+=amt; return; }",
    repl: "      if(k){ F.prime[k].v+=amt; F.prime[k].rows.push(rec); return; }" },
  { id: 'flow-grand-drops-other', area: 'flowCalc', what: 'TOTAL FUNDING forgets the other sources typed in',
    find: "  F.grand=F.tot+F.ip+F.fms;", repl: "  F.grand=F.tot;" },
  { id: 'flow-appn-uncounted', area: 'flowCalc', what: 'a dollar is counted in the total and in no appropriation',
    find: "      F.tot+=amt; F.appn[sl]+=amt; F.rows++;", repl: "      F.tot+=amt; F.rows++;" },
  { id: 'flow-sheet-us-funding-prints-grand', area: 'exportFlow', what: 'the US SERVICE FUNDING row prints the grand total instead of US funding',
    find: "  sum.push([{v:'US SERVICE FUNDING',s:4},{v:F.tot,s:MB},'100.0%']);",
    repl: "  sum.push([{v:'US SERVICE FUNDING',s:4},{v:F.grand,s:MB},'100.0%']);" },

  // ---- the chart of accounts: the requirement, resolved the way the board resolves it ---------------
  { id: 'coa-ask-ignores-override', area: 'coaAsk', what: 'the chart prints the payload’s ask and ignores this year’s override',
    find: "  const v=(Array.isArray(o) && o.length===nsvc)? o : (it.ask||[]);", repl: "  const v=(it.ask||[]);" },
  { id: 'coa-summary-drops-ask', area: 'coaSummary', what: 'the appropriation row counts requirements and no money',
    find: "    b.n++; b.ask+=r.ask;", repl: "    b.n++;" },

  // ---- the reprogramming log: deducts are negative, and the types stay apart ----------------------
  { id: 'rp-deduct-not-negative', area: 'exportReprog', what: 'a deduct adds to the net by service instead of subtracting',
    find: "      bySvcTot[key]=(bySvcTot[key]||0)+((parseFloat(r.amtM)||0)*(r.dir==='deduct'?-1:1));",
    repl: "      bySvcTot[key]=(bySvcTot[key]||0)+(parseFloat(r.amtM)||0);" },
  { id: 'rp-svc-key-mixes-types', area: 'exportReprog', what: 'BTRs and ATRs net together under one service',
    find: "      const key=t+'|'+(SVC[r.svc]||'');", repl: "      const key='|'+(SVC[r.svc]||'');" },
  { id: 'rp-total-drops-atr', area: 'exportReprog', what: 'the grand net forgets the ATRs',
    find: "  sheet.rows.push([{v:'TOTAL',s:B},{v:gB,s:NB2},{v:gA,s:NB2},{v:gB+gA,s:NB2}]);",
    repl: "  sheet.rows.push([{v:'TOTAL',s:B},{v:gB,s:NB2},{v:gA,s:NB2},{v:gB,s:NB2}]);" },
  { id: 'rp-subtotal-adds-deducts', area: 'exportReprog', what: 'a type’s subtotal adds deducts instead of netting them',
    find: "{v:es.reduce((a,r)=>a+((parseFloat(r.amtM)||0)*(r.dir==='deduct'?-1:1)),0),s:NB2}",
    repl: "{v:es.reduce((a,r)=>a+(parseFloat(r.amtM)||0),0),s:NB2}" },

  // ---- the ACE tie-out: funded, estimate, delta, and the line no office reports under ---------------
  { id: 'ace-total-skips-unconfirmed', area: 'exportAceTieout', what: 'the board-funded total forgets every requirement that has not confirmed a line',
    find: "        bTot+=r.f; if(e!=null) eTot+=e;", repl: "        if(e!=null){ bTot+=r.f; eTot+=e; }" },
  { id: 'ace-delta-sign', area: 'exportAceTieout', what: 'the delta is estimate less funded, so a shortfall reads as a surplus',
    find: "                   (e==null? '' : {v:r.f-e,s:N}),", repl: "                   (e==null? '' : {v:e-r.f,s:N})," },
  { id: 'ace-pmo-total-drops-est', area: 'exportAceTieout', what: 'the per-PMO FY total forgets the estimate',
    find: "        eY+=est; bY+=bd;", repl: "        bY+=bd;" },
  { id: 'ace-stray-line-lost', area: 'exportAceTieout', what: 'an estimate line under a PMO no office reports under vanishes from the per-PMO sheet',
    find: "        if(l.ap!==mySlug() || groups[l.pmo]) return;", repl: "        return;" },

  // ---- a copy proposes a new requirement -----------------------------------------------------------
  { id: 'proposal-dropped', area: 'pmoTake', what: 'a proposed requirement arrives and is never offered for review',
    find: "  held.added=(pkg.added||[]).slice();", repl: "  held.added=[];" },
  { id: 'proposal-gate-open', area: 'pmoProposalGate', what: 'a proposal with mandatory fields blank can be sent',
    find: "  if(!aw || !(aw.d || (Array.isArray(aw.inc) && aw.inc.length))) miss.push('Projected award date');\n  return miss;",
    repl: "  if(!aw || !(aw.d || (Array.isArray(aw.inc) && aw.inc.length))) miss.push('Projected award date');\n  return [];" },
  { id: 'proposal-double-add', area: 'pmoTakenAs', what: 'the same submittal imported twice adds the requirement twice',
    find: "  return (S.custom||[]).filter(function(c){ return c.from && c.from.nid===a.nid && c.from.pmo===subFrom(pkg); }).map(function(c){ return c.id; })[0]||null;",
    repl: "  return null;" },
  { id: 'proposal-lands-on-top', area: 'pmoAcceptProposal', what: 'an accepted proposal lands at the top of the consolidated listing instead of the bottom',
    find: "  S.custom.push(it); DATA.items.push(it);\n  S.order.push(it.id);\n  if(!Array.isArray(S.pmoOrder[g])) S.pmoOrder[g]=[];",
    repl: "  S.custom.push(it); DATA.items.push(it);\n  S.order.unshift(it.id);\n  if(!Array.isArray(S.pmoOrder[g])) S.pmoOrder[g]=[];" },
  { id: 'proposal-ask-dropped', area: 'pmoAcceptProposal', what: 'an accepted proposal loses the office’s ask values',
    find: "            ccar:'', fy26:SVC.map(function(){ return 0; }), ask:askVecOf(a.ask), alloc:null,\n            from:{pmo:r.from, nid:a.nid, by:r.by, ts:Date.now()}};",
    repl: "            ccar:'', fy26:SVC.map(function(){ return 0; }), ask:SVC.map(function(){ return 0; }), alloc:null,\n            from:{pmo:r.from, nid:a.nid, by:r.by, ts:Date.now()}};" },
  { id: 'proposal-unscoped', area: 'pmoTake', what: 'a proposal for an office the package is not from is held anyway',
    find: "    pkg.added=pkg.added.filter(function(a){ if(a.grp===pkg.pmo) return true;",
    repl: "    pkg.added=pkg.added.filter(function(a){ if(true) return true;" },

  // ---- the classification matrix: a bulk write lands only where the field is offered --------------
  { id: 'bulk-lands-everywhere', area: 'matApplyBulk', what: 'a bulk classification write lands on every row, including requirements that never offer the field',
    find: "  return matRows().filter(function(it){ return !B.applies || B.applies(it); });",
    repl: "  return matRows();" },
  { id: 'second-hop-gov-only', area: 'recFields', what: 'the second-hop control is offered only for a gov destination, so an other-kind OGC can never satisfy the completeness rule',
    find: "  if(destIsOgc(it))\n    F.push(recF('Which awards to', destOf(it).end,",
    repl: "  if(destOf(it).to && (flowEnt(destOf(it).to)||{}).kind==='gov')\n    F.push(recF('Which awards to', destOf(it).end," },

  // ---- the buy lines: seated at boot, and only once -----------------------------------------------
  { id: 'buy-lines-repushed', area: 'boot', what: 'the aircraft buy line is seated again on every reopen of a saved board',
    find: "  if(!_hasBuy('BUY-AC')) DATA.items.push({id:'BUY-AC', grp:'ATL', team:'ATL', sect:'', custom:false,",
    repl: "  DATA.items.push({id:'BUY-AC', grp:'ATL', team:'ATL', sect:'', custom:false," },

  // ---- the Two Spend Plans, A vs B tab -----------------------------------------------------------
  // Identity columns wedged into the middle of a tab nothing was checking. The risk is not that a
  // date comes out wrong; it is that a column count goes stale and every figure on the tab prints
  // under the wrong heading in a workbook that opens perfectly.
  { id: 'avsb-widths-stale', area: 'exportPlans', what: 'the A vs B column widths are left at the old count, so every heading sits over the wrong column',
    find: `  const cmp={name:'A vs B', cols:[7,30,9,46,13,26,15,15,15,17,19,14,14],`,
    repl: `  const cmp={name:'A vs B', cols:[7,30,9,46,15,15,15,17,19,14,14],` },
  { id: 'avsb-drops-ccar', area: 'exportPlans', what: 'the A vs B rows stop stating the CCaR record, shifting every cell after it',
    find: `      {v:ccarOf(x.it),s:1},{v:awdDateLbl(x.id),s:0},{v:dr.d+dr.m,s:N},`,
    repl: `      {v:awdDateLbl(x.id),s:0},{v:dr.d+dr.m,s:N},` },
  // An obligation plan is opened to find out WHEN money lands. A count of increments answers a
  // different question, and answering it under a heading that says "Award date(s)" is worse than
  // leaving the column out.
  { id: 'awd-dates-counted', area: 'awdDateLbl', what: 'incremental funding reports how many increments there are instead of when they land',
    find: `  if(aw.mode==='inc'){
    const key=x=>(x.d||'')+String(x.day||0).padStart(2,'0');`,
    repl: `  if(aw.mode==='inc'){
    return 'incremental \\u00d7'+((aw.inc||[]).length);
    const key=x=>(x.d||'')+String(x.day||0).padStart(2,'0');` },
  { id: 'awd-dates-unsorted', area: 'awdDateLbl', what: 'the increment dates are printed in stored order, which a later month edit leaves stale',
    find: `    return (aw.inc||[]).slice()
      .sort(function(a,b){ const ka=key(a), kb=key(b); return ka<kb? -1 : (ka>kb? 1 : 0); })
      .map(one).filter(Boolean).join('; ');`,
    repl: `    return (aw.inc||[]).slice()
      .map(one).filter(Boolean).join('; ');` },

  { id: 'clin-writes-the-money', area: 'clinTable', what: 'the CLIN drill offers to overwrite a hand-typed split from the grid',
    find: `      +(clinSplitRow(pid)? ''
        : '<button class="qb" onclick="clinToRow(\\''+pid+'\\')"`,
    repl: `      +(false? ''
        : '<button class="qb" onclick="clinToRow(\\''+pid+'\\')"` },

];

const only = process.argv.slice(2).filter(a => !a.startsWith('-'));
const picked = only.length
  ? MUTATIONS.filter(m => only.some(q => m.id.includes(q) || m.area.includes(q)))
  : MUTATIONS;

const src = readFileSync(BOARD, 'utf8');
const dir = mkdtempSync(join(tmpdir(), 'spmt-mut-'));
const results = [];

console.log(`\nmutation sweep — ${picked.length} mutation(s), ${SUITES.length} suite(s)\n`);

// MUTATIONS RUN CONCURRENTLY; the SUITES within one mutation stay sequential, because the loop
// short-circuits on the first catch and running them in parallel would pay for suites it does not
// need. One sweep on its own was using a single core of four while the box sat idle -- and
// validate-math runs two sweeps (one per build) side by side, so half the default here is the
// right share. MUT_JOBS overrides it.
const JOBS = Math.max(1, Number(process.env.MUT_JOBS) || Math.ceil(cpus().length / 2));
const runSuite = (path, file) => new Promise(done => {
  execFile(process.execPath, [path], { env: { ...process.env, BOARD: file }, maxBuffer: 1 << 26 },
    err => done(!err));               // err == non-zero exit == the suite failed == mutation caught
});

// The NOT APPLIED test is a string match on source we already hold: cheap, and worth doing for
// every mutation up front so a stale target is reported even if the sweep is interrupted later.
const queue = [];
for (const m of picked) {
  const hits = src.split(m.find).length - 1;
  if (hits !== 1) {
    results.push({ ...m, status: 'NOT APPLIED', by: `target matched ${hits} times, expected 1`, seq: results.length });
    console.log(`  NOT APPLIED  ${m.id.padEnd(22)} target matched ${hits}x`);
    continue;
  }
  queue.push(m);
}

console.log(`  running ${queue.length} mutation(s) ${JOBS} at a time\n`);

async function runOne(m) {
  const file = join(dir, m.id + '.html');
  writeFileSync(file, src.replace(m.find, m.repl));

  let caughtBy = null;
  for (const [suite, path] of SUITES) {
    if (!(await runSuite(path, file))) { caughtBy = suite; break; }
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
  // Printed as each finishes, so the line order is completion order rather than list order. The
  // SUMMARY is what is read and what validate-math parses, and that is sorted below.
  console.log(`  ${status.padEnd(12)} ${m.id.padEnd(22)} ${note}`);
}

{
  let next = 0;
  const worker = async () => { while (next < queue.length) await runOne(queue[next++]); };
  await Promise.all(Array.from({ length: JOBS }, worker));
}
// Completion order is not list order. Restore it so two runs of the same sweep read the same.
results.sort((a, b) => picked.findIndex(x => x.id === a.id) - picked.findIndex(x => x.id === b.id));

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
