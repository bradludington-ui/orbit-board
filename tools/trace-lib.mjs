// TRACE LIBRARY — the harvests the trace matrix reads, shared with the file verifier.
//
// One harvest per surface, EVERY CELL LOCATED BY NAME. The trace matrix runs them on its fixture
// and holds every cell to a truth computed from the fixture's own numbers; the file verifier runs
// the same harvests on a real saved board and holds every cell to the engine. Two readers, one
// set of harvests, so the surface a briefing figure is read from is read the same way in both.
import { capture, cv } from './export-audit/boot.mjs';

const sum = a => a.reduce((x, y) => x + y, 0);

export const LABEL = {
  ask: 'FY requirement (ask)', discBA: 'Discretionary BA', mandBA: 'Mandatory BA',
  disc: 'Discretionary drawn', mand: 'Mandatory drawn', funded: 'Funded (disc+mand)',
  ufr1: 'UNFUNDED vs DISC  (ask-disc)', ufr2: 'TOTAL unfunded  (ask-disc-mand)',
  trim: 'Trim (ask not allocated)', beyond: 'Beyond both lanes',
  mcTotal: 'MC requirement value', mcShort: 'MC short vs discretionary',
};
// THE RULEBOOK. One statement of each formula, in the same place as the oracle that computes it,
// so the definition a surface is held to and the definition printed in the report cannot drift.
// [svc] means the rule is applied PER SERVICE and then summed -- money is not fungible across
// services, so a figure netted across them is a different and wrong number. max(0, ...) is the
// per-service FLOOR: a service with money left over never offsets a service that is short.
export const FORMULA = {
  ask:     'Σ[svc] ask                      the requirement as stated, before any decision',
  discBA:  'Σ[svc] discSvc                  discretionary budget authority',
  mandBA:  'Σ[svc] mandSvc                  mandatory budget authority',
  disc:    'Σ[svc] d                        drawn from discretionary by tiers()',
  mand:    'Σ[svc] m                        drawn from mandatory by tiers()',
  funded:  'disc + mand                     money that actually exists against the requirement',
  ufr1:    'Σ[svc] max(0, ask − d)          READING #1 — short against discretionary alone',
  ufr2:    'Σ[svc] max(0, ask − d − m)      READING #2 — short against both lanes',
  trim:    'Σ[svc] max(0, ask − basis)      ask never allocated: a decision, not a shortfall',
  beyond:  'Σ[svc] max(0, min(ask, basis) − d − m)   allocated but no lane could pay it',
  mcTotal: 'Σ[svc] ask, starred rows only   MC is a MEMO, never a third lane',
  mcShort: 'Σ[svc] max(0, ask − d), starred rows only',
};
// The identity every surface is held to, and the one a reader can check by hand on any row:
//     d + m + u == basis      (per service)        beyond + trim == ufr2
export const ORDER = ['ask', 'discBA', 'mandBA', 'disc', 'mand', 'funded', 'ufr1', 'ufr2', 'trim', 'beyond', 'mcTotal', 'mcShort'];


// Every surface, harvested off a booted board. opts.cyc / opts.cycYr name the cycle the two
// lock-and-view surfaces use ('PB' and the year on screen unless told otherwise); opts.scratch
// deletes that cycle again afterwards and restores the working plan's tags.
export function harvest(ev, opts = {}) {
  const cyc = opts.cyc || 'PB';
  const cycYr = opts.cycYr || +ev('MS.cur');
  const key = cyc + '|' + cycYr;
  const tag0 = JSON.parse(ev(`JSON.stringify({cycle:MS.cycle||'', cycleRef:MS.cycleRef||''})`));
const num = c => { const v = cv(c); return typeof v === 'number' ? v : NaN; };
const txt = c => String(cv(c) ?? '').trim();
const rowsOf = sh => sh ? (sh.rows || sh.data || []) : [];
// a cell located by COLUMN HEADER and ROW LABEL -- the only lookup this file uses
const cellAt = (rows, headerRe, colName, rowRe) => {
  const hi = rows.findIndex(r => (r || []).some(c => headerRe.test(txt(c))));
  if (hi < 0) return undefined;
  const ci = (rows[hi] || []).findIndex(c => txt(c) === colName);
  if (ci < 0) return undefined;
  const r = rows.slice(hi + 1).find(x => rowRe.test(txt((x || [])[0])));
  if (!r) return undefined;
  const v = num(r[ci]);
  return isNaN(v) ? undefined : v;
};
// a labelled row whose figure is the LAST number on it (the matrix blocks are shaped this way)
const rowTotal = (rows, rowRe) => {
  const r = rows.find(x => rowRe.test(txt((x || [])[0])));
  if (!r) return undefined;
  const ns = r.map(num).filter(v => !isNaN(v));
  return ns.length ? ns[ns.length - 1] : undefined;
};
const grab = fn => JSON.parse(ev(`(function(){ var got='[]';
  if(!globalThis.__ob) globalThis.__ob=buildXlsx;
  buildXlsx=function(sh){ got=JSON.stringify(sh); return new Uint8Array(0); };
  try{ ${fn}(); }catch(e){ got='[]'; }
  buildXlsx=globalThis.__ob; return got; })()`));

const surfaces = [];
const add = (name, kind, tol, cells) => surfaces.push({ name, kind, tol, cells });

// 1. THE ENGINE — the requirement math every other surface is a view of
{
  const e = JSON.parse(ev(`JSON.stringify((function(){
    var Tt=tiers(), t=tierTotals(Tt), o={ask:0,disc:0,mand:0,ufr1:0,ufr2:0,trim:0,beyond:0};
    S.order.forEach(function(id){ var it=itemById(id), p=Tt[id];
      o.ask+=askTot(it); o.disc+=p.dT; o.mand+=p.mT;
      o.ufr1+=discUnfTotOf(it,p); o.ufr2+=unfTotOf(it,p);
      o.trim+=trimTotOf(it); o.beyond+=beyondTotOf(it,p); });
    o.funded=o.disc+o.mand; o.discBA=discTot(); o.mandBA=mandTot();
    o.mcTotal=t.mcTot; o.mcShort=t.mcSvc.shortTot!==undefined? t.mcSvc.shortTot : null;
    return o; })())`));
  if (e.mcShort === null) { // mcCalc names it differently across builds; recompute from the rule
    e.mcShort = JSON.parse(ev(`JSON.stringify((function(){ var Tt=tiers(), s=0;
      S.order.forEach(function(id){ if(!S.mc[id]) return; var it=itemById(id);
        s+=mcShortSvcOf(it,Tt[id]).reduce(function(a,b){return a+b;},0); }); return s; })())`));
  }
  add('engine (tiers)', 'requirement math', 0.5, e);
}

// A build from before PPBE cycles (v1.70 and earlier) has no lock to take and no view to open;
// the verifier certifies a file under the build that wrote it, so these two surfaces are simply
// absent there -- silence, not a throw.
const hasCycles = !!ev(`typeof cycLock==='function' && typeof cycView==='function' && typeof cycProj==='function'`);
if (hasCycles) {
// 1b. A LOCKED CYCLE'S PROJECTION of this year -- what a PB lock says this year was, read back out
//     of the store rather than the live engine. Funded there must be the lane draw here.
{
  const p = JSON.parse(ev(`JSON.stringify((function(){
    MS.years[MS.cur]=S; blCyc='${cyc}'; blYr=${cycYr}; cycLock();
    var P=cycProj('${key}', MS.cur), o={ask:0,disc:0,mand:0,funded:0};
    var sum=function(a){ return (a||[]).reduce(function(x,y){ return x+y; },0); };
    P.reqs.forEach(function(r){ o.ask+=sum(r.ask); o.disc+=sum(r.d); o.mand+=sum(r.m); o.funded+=sum(r.fund); });
    o.discBA=sum(P.disc); o.mandBA=sum(P.mand);
    return o; })())`));
  add('locked cycle (projection)', 'store', 0.5, p);
}

// 1c. THE LOCKED CYCLE ON THE DRILL -- the same lock, put on screen read-only, and the engine read
//     off it. Every quantity must be the engine's: a view that reads differently is a second board.
{
  const v = JSON.parse(ev(`JSON.stringify((function(){
    cycView('${key}');
    var Tt=tiers(), t=tierTotals(Tt), o={ask:0,disc:0,mand:0,ufr1:0,ufr2:0,trim:0,beyond:0};
    S.order.forEach(function(id){ var it=itemById(id), p=Tt[id];
      o.ask+=askTot(it); o.disc+=p.dT; o.mand+=p.mT;
      o.ufr1+=discUnfTotOf(it,p); o.ufr2+=unfTotOf(it,p);
      o.trim+=trimTotOf(it); o.beyond+=beyondTotOf(it,p); });
    o.funded=o.disc+o.mand; o.discBA=discTot(); o.mandBA=mandTot();
    o.mcTotal=t.mcTot;
    var s=0; S.order.forEach(function(id){ if(!S.mc[id]) return; var it=itemById(id); s+=mcShortSvcOf(it,Tt[id]).reduce(function(a,b){return a+b;},0); });
    o.mcShort=s;
    o.viewing=CYCVIEW;
    cycLeave();
    o.left=CYCVIEW;
    return o; })())`));
  if (v.viewing !== key || v.left !== '') throw new Error('the locked view did not open and close cleanly: ' + JSON.stringify([v.viewing, v.left]));
  delete v.viewing; delete v.left;
  add('locked view (drill)', 'visual', 0.5, v);
}
}

// 2. THE DASHBOARD, as rendered. Read off the DOM, because a figure that is computed correctly and
//    displayed wrongly is still wrong on the screen someone is briefing from.
{
  // The tiles live in #scores. This said #scoreboard, which does not exist, and fell back to the
  // whole document -- the regexes are specific enough that it still read the right figures, but a
  // selector that silently matches everything is one edit away from reading the wrong one.
  const sc = ev(`(function(){ var e=document.getElementById('scores');
    if(!e) throw new Error('#scores not found — the scoreboard moved and this harvest is blind');
    return e.textContent; })()`);
  const money = re => { const m = re.exec(sc); return m ? Number(m[1].replace(/,/g, '')) : undefined; };
  add('dashboard (screen)', 'visual', 1, {
    discBA:  money(/Discretionary \(basis\)[\s\S]*?BA:\s*\$([\d,]+)/),
    mandBA:  money(/Mandatory \(spillover\)[\s\S]*?BA:\s*\$([\d,]+)/),
    funded:  money(/\$([\d,]+) funded when whole/),
    beyond:  money(/\$([\d,]+) beyond both lanes/),
    ufr1:    money(/UNFUNDED vs DISC \$([\d,]+)/),
    ufr2:    money(/TOTAL \$([\d,]+)/),
    mcTotal: money(/\$([\d,]+)\s*allocated to \d+ must-pay/),
  });
}

// 3. THE WORKBOOK
{
  const sheets = JSON.parse(capture(ev));
  const sheet = n => rowsOf(sheets.find(s => s.name === n));
  const fs = sheet('Funding Streams');
  add('xl · Funding Streams', 'Excel', 0.5, {
    ask:    cellAt(fs, /^Service$/, 'FY27 Ask', /^TOTAL$/),
    discBA: cellAt(fs, /^Service$/, 'Disc BA', /^TOTAL$/),
    disc:   cellAt(fs, /^Service$/, 'Disc Funded', /^TOTAL$/),
    mandBA: cellAt(fs, /^Service$/, 'Mand BA', /^TOTAL$/),
    mand:   cellAt(fs, /^Service$/, 'Mand Funded', /^TOTAL$/),
    funded: cellAt(fs, /^Service$/, 'Funded Total', /^TOTAL$/),
    trim:   cellAt(fs, /^Service$/, 'Ask Not Allocated (delta)', /^TOTAL$/),
    beyond: cellAt(fs, /^Service$/, 'Beyond Both Lanes', /^TOTAL$/),
    ufr1:   cellAt(fs, /^Service$/, 'Unfunded vs DISC', /^TOTAL$/),
    ufr2:   cellAt(fs, /^Service$/, 'TOTAL UNFUNDED', /^TOTAL$/),
  });

  const db = sheet('Decision Bands');
  add('xl · Decision Bands', 'Excel', 0.5, {
    ask:    cellAt(db, /^Band$/, 'FY27 Requirement', /^ALL BANDS$/),
    disc:   cellAt(db, /^Band$/, 'Disc', /^ALL BANDS$/),
    mand:   cellAt(db, /^Band$/, 'Mand', /^ALL BANDS$/),
    funded: cellAt(db, /^Band$/, 'Funded', /^ALL BANDS$/),
    ufr2:   cellAt(db, /^Band$/, 'Unfunded', /^ALL BANDS$/),
    ufr1:   cellAt(db, /^Band$/, 'Unfunded vs DISC', /^ALL BANDS$/),
  });

  const pm = sheet('PMO Matrix');
  add('xl · PMO Matrix', 'Excel', 0.5, {
    beyond: rowTotal(pm, /^UNFUNDED \(beyond both lanes\)$/),
    trim:   rowTotal(pm, /^ASK NOT ALLOCATED \(trim deltas\)$/),
    ufr2:   rowTotal(pm, /^TOTAL UNFUNDED \(deltas \+ beyond lanes\)$/),
    ufr1:   rowTotal(pm, /^UNFUNDED vs DISC \(mandatory not counted\)$/),
  });

  const ur = sheet('Unfunded Requirements');
  add('xl · Unfunded Requirements', 'Excel', 0.5, {
    // Its ask/allocated columns cover only the LISTED requirements, so they are not board-wide and
    // are deliberately not mapped here. The two unfunded totals ARE board-wide: every requirement
    // short on either reading is listed, which is what makes them comparable.
    ufr1: cellAt(ur, /^Rank$/, 'Unfunded vs DISC', /^TOTAL$/),
    ufr2: cellAt(ur, /^Rank$/, 'TOTAL Unfunded', /^TOTAL$/),
  });
}

// 4. THE PRIORITY DRILL — band subtotals, summed. No grand total on the tab by design, so the
//    subtotals ARE the portfolio; adding them is also the check that nothing was double-counted.
{
  const sheets = grab('exportCSV');
  const band = rowsOf(sheets.find(s => /1-N by Band/.test(s.name)));
  const hi = band.findIndex(r => txt((r || [])[0]) === 'Rank');
  const subs = band.filter(r => /^Subtotal/.test(txt((r || [])[0])));
  const col = h => { const i = (band[hi] || []).findIndex(c => txt(c) === h);
    return i < 0 ? undefined : sum(subs.map(r => num(r[i]) || 0)); };
  add('drill · 1-N by Band', 'Excel', 0.5, {
    ask: col('FY27 Requirement'), disc: col('Discretionary'), mand: col('Mandatory'),
    funded: col('Funded'), ufr2: col('Unfunded'), ufr1: col('Unfunded vs DISC'),
  });
}

// 5. THE SPEND PLAN SOURCE — states one quantity: what the lanes PAID, discretionary + mandatory,
//    each lane on its own line (v1.83; it was discretionary only until the owner ruled otherwise).
{
  const sheets = grab('exportSrc');
  const rows = rowsOf(sheets[0]).slice(1);
  let t = 0; rows.forEach(r => { const a = num(r[9]); if (!isNaN(a)) t += a; });
  add('xl · Spend Plan Source', 'Excel', 0.5, { funded: rows.length ? t : undefined });
}

// 6. (v2.05, item 114: the deck's two surfaces went with the PowerPoint deck.)


  // 1d. THE DELTAS' NOW SIDE -- what the Changes panel prints as 'Now' against the lock. The lock
  //     just taken is the reference, so the deltas are zero and 'Now' must be the engine.
  if (ev(`typeof cycDelta==='function'`)) {
    const d = JSON.parse(ev(`JSON.stringify((function(){ var keep=MS.cycleRef; MS.cycleRef='${key}'; _cycDeltaCache=null;
      var D=cycDelta(MS.cur); MS.cycleRef=keep; _cycDeltaCache=null;
      return D? {ask:D.tot.askNow, funded:D.tot.fundNow, discBA:D.pots.discNow, mandBA:D.pots.mandNow, zero:Math.abs(D.tot.ask)+Math.abs(D.tot.fund)} : null; })())`));
    if (d) { if (d.zero > 0.5) throw new Error('the deltas against the lock just taken are not zero: ' + d.zero); delete d.zero; add('cycle deltas (panel, now)', 'visual', 0.5, d); }
  }
  // 1e. THE FYDP SPEND PLAN (v2.04, item 112) -- the working plan's appropriation tab, the year on screen. Requirement is
  //     the requirement and Funded (headed Allocated until v2.15) is discretionary + mandatory drawn. Printed in $M; read in dollars.
  if (ev(`typeof exportFydpPlan==='function'`)) {
    const FY = 'FY' + (+ev('MS.cur') % 100), keepSrc = ev('fydpSrc'), app = ev('appnName(mySlug())');
    ev(`fydpSrc='working'; 'ok'`);
    const sheets = grab('exportFydpPlan');
    ev(`fydpSrc=${JSON.stringify(keepSrc)}; 'ok'`);
    const at = rowsOf(sheets.find(s => s.name === app));
    const h = at.findIndex(r => txt((r || [])[0]) === 'CCaR Record'), c = h < 0 ? -1 : at[h].findIndex(x => txt(x) === FY);
    const tot = at.find((r, i) => i > h && txt((r || [])[0]) === 'TOTAL');
    const $ = x => { const v = num(x); return isNaN(v) ? undefined : Math.round(v * 1e6); };
    add('xl · FYDP Spend Plan', 'Excel', 0.5, {
      ask:    tot && c >= 0 ? $(tot[c]) : undefined,
      funded: tot && c >= 0 ? $(tot[c + 1]) : undefined,
    });
  }
  // 1f. THE CYCLE COMPARISON -- the lock just taken against the working plan. Every Δ must be
  //     zero, and the B side (the working plan) must be the engine.
  if (hasCycles && ev(`typeof exportCycCompare==='function'`)) {
    const FY = 'FY' + (+ev('MS.cur') % 100), keep = JSON.parse(ev(`JSON.stringify([cycCmpA, cycCmpB])`));
    ev(`cycCmpA='${key}'; cycCmpB='working'; 'ok'`);
    const sheets = grab('exportCycCompare');
    ev(`cycCmpA=${JSON.stringify(keep[0])}; cycCmpB=${JSON.stringify(keep[1])}; 'ok'`);
    const cs = rowsOf(sheets.find(s => s.name === 'Compare'));
    const dz = ['Requirement', 'Allocated', 'Funded', 'Unfunded'].map(k => cellAt(cs, /^PMO$/, FY + ' Δ ' + k, /^TOTAL$/));
    if (dz.some(v => v === undefined || Math.abs(v) > 0.5)) throw new Error('the comparison of the lock just taken against the working plan is not zero: ' + JSON.stringify(dz));
    add('xl · Cycle Comparison', 'Excel', 0.5, {
      ask:    cellAt(cs, /^PMO$/, FY + ' WORKING Requirement', /^TOTAL$/),
      funded: cellAt(cs, /^PMO$/, FY + ' WORKING Funded', /^TOTAL$/),
      ufr2:   cellAt(cs, /^PMO$/, FY + ' WORKING Unfunded', /^TOTAL$/),
    });
  }
  // 1g. THE SPRUILLS AND ITS PMO DRILL (v1.95) -- Spruills › By PMO, the table and each PMO in detail,
  //     from the board's own requirements. Each states the year's requirement, and the drill's added
  //     over every PMO must be the engine's. Its Controls are held here as well: per PMO, whole
  //     dollars, the year's projection by PMO in total, and the SAME from Board budgets as from the
  //     lock just taken -- a cycle locked from a plan prints that plan's Controls.
  if (ev(`typeof pmoDetail==='function' && typeof spGather==='function' && typeof spDefs==='function'`)) {
    const sp = JSON.parse(ev(`JSON.stringify((function(){
      var keep=[spAce, spFund, spBy, spPmo], own=spDefs().map(function(d){ return d.ms===MS; }).indexOf(true), y=MS.cur;
      var sum=function(b,k){ var t=0; b.svcs.forEach(function(sv){ t+=(b[k][sv]||{})[y]||0; }); return t; };
      var ints=function(b){ var n=0; ['req','ctl'].forEach(function(k){ b.svcs.forEach(function(sv){ var v=(b[k][sv]||{})[y]; if(v!==undefined && !Number.isInteger(v)) n++; }); }); return n; };
      try{
        spAce='board'; spFund='board'; spBy='pmo';
        var G=spGather().blocks[own], keys=Object.keys(G.rows).sort(), o={tbl:G.req[y], req:0, ctl:[], lock:null, frac:0, proj:0};
        cycProjOf().reqs.forEach(function(r){ o.proj+=r.alloc.reduce(function(a,v){ return a+v; },0); });
        keys.forEach(function(g){ var b=pmoDetail(g,[y])[own]; o.req+=sum(b,'req'); o.ctl.push(sum(b,'ctl')); o.frac+=ints(b); });
        ${hasCycles ? `spFund='bl|${key}'; o.lock=keys.map(function(g){ return sum(pmoDetail(g,[y])[own],'ctl'); });` : ''}
        o.keys=keys; return o;
      } finally { spAce=keep[0]; spFund=keep[1]; spBy=keep[2]; spPmo=keep[3]; }
    })())`));
    const ctlTot = sp.ctl.reduce((a, b) => a + b, 0);
    if (sp.frac) throw new Error('the PMO drill holds ' + sp.frac + ' figure(s) that are not whole dollars');
    if (Math.abs(ctlTot - sp.proj) > 0.5) throw new Error('the PMO drill’s Controls, added over every PMO, are not the year’s projection: ' + ctlTot + ' vs ' + sp.proj);
    if (sp.lock && sp.lock.some((v, i) => Math.abs(v - sp.ctl[i]) > 0.5))
      throw new Error('the PMO drill prints different Controls from Board budgets and from the lock just taken: ' + JSON.stringify([sp.keys, sp.ctl, sp.lock]));
    add('Spruills (screen)', 'visual', 0.5, { ask: sp.tbl });
    add('Spruills · PMO drill', 'visual', 0.5, { ask: sp.req });
  }
  // A SCRATCH LOCK, when asked for: the verifier runs this on a real file, where 'PB|<year>' may
  // already be a real lock taken weeks ago (and would then read the plan as it stood, not as it
  // is). The scratch key is deleted again and the working plan's tags are put back.
  if (opts.scratch && hasCycles) ev(`blLock('${key}', false); blDelete('${key}');
    MS.cycle=${JSON.stringify(tag0.cycle)}; MS.cycleRef=${JSON.stringify(tag0.cycleRef)}; 'ok'`);
  return surfaces;
}

// A workbook other than the main one, captured as its sheet list.
export const grabSheets = (ev, fn) => JSON.parse(ev(`(function(){ var got='[]';
  if(!globalThis.__ob) globalThis.__ob=buildXlsx;
  buildXlsx=function(sh){ got=JSON.stringify(sh); return new Uint8Array(0); };
  try{ ${fn}(); }catch(e){ got='[]'; }
  buildXlsx=globalThis.__ob; return got; })()`));
