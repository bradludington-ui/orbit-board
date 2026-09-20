#!/usr/bin/env node
// VERIFY A SAVED BOARD FILE — the certificate for the file you brief from.
//
// Everything else in tools/ proves the math on fixtures. This opens the board you actually brief
// from, in the harness, and asks the questions the fixtures cannot: did every container in it come
// back, does what is on the screen tie to what the exports print, do the workbook totals add up,
// does the file survive being saved and reopened, and -- when the build about to ship differs from
// the one that wrote the file -- which of YOUR figures a release moves.
//
//   node tools/verify-file.mjs <saved-board.html>            certify the file under its own code
//   node tools/verify-file.mjs <file> --with <build.html>    ... and under that build, with the delta
//   node tools/verify-file.mjs <file> --json <out.json>      machine-readable certificate too
//   node tools/verify-file.mjs --selftest                    prove the verifier notices a loss
//
// THE FILE IS READ, NEVER COPIED INTO THE REPO. Keep it outside the working tree (the scratch
// folder, a temp directory); .gitignore refuses every other .html regardless.
//
// Exit code: 0 when every section holds under every build examined; 1 otherwise. MOVED is a report,
// never a failure: figures move for good reasons, and the question it answers is whether the ones
// that moved are the ones you meant to move.
import { readFileSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { boot, seed, capture, cv } from './export-audit/boot.mjs';
import { harvest, grabSheets, ORDER, LABEL } from './trace-lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, '..');
const argv = process.argv.slice(2);
const opt = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const flag = k => argv.includes(k);
const positional = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && ['--with', '--json'].includes(argv[i - 1])));
const FILE = positional[0] || null;
const WITH = opt('--with');
const JSON_OUT = opt('--json');
const TOL = 0.5;                                          // cents, after rounding to the cent

// ---- the reading of a saved file ---------------------------------------------------------------
const STATE_RE = /<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/;
const MODE_RE = /<script type="application\/json" id="pubMode">([\s\S]*?)<\/script>/;
function readSaved(html) {
  const m = STATE_RE.exec(html), mm = MODE_RE.exec(html);
  let state = null, stateErr = '';
  try { state = m ? JSON.parse(m[1]) : null; } catch (e) { stateErr = String(e.message).slice(0, 120); }
  let mode = null; try { mode = mm ? JSON.parse(mm[1]) : null; } catch { mode = null; }
  const build = (/const BUILD='([^']+)'/.exec(html) || [])[1] || '(no BUILD stamp)';
  const flavour = /^function gridRows\b/m.test(html) ? 'grid' : 'card';
  return { state, stateErr, mode, build, flavour, bytes: Buffer.byteLength(html, 'utf8') };
}
const SLUG_NAME = { om: 'O&M', ff: 'FULL FUND', sp: 'INITIAL SPARES', opn: 'OPN' };
// The board opens whichever appropriation the browser last chose; a saved file carries every slot.
// Each slot with a plan in it is examined in turn, by telling the boot which one to open.
const withAppn = (html, name) => html.replace('<script type="application/json" id="pubMode">',
  `<script>try{localStorage.setItem('prio27appn',${JSON.stringify(name)});}catch(e){}</script><script type="application/json" id="pubMode">`);
const bootAs = (html, name) => boot({ html: withAppn(html, name) });

// ---- helpers ------------------------------------------------------------------------------------
const sum = a => (a || []).reduce((x, y) => x + (+y || 0), 0);
const fm = v => v === undefined || v === null || isNaN(v) ? '--' : '$' + Math.round(v).toLocaleString();
const num = c => { const v = cv(c); return typeof v === 'number' ? v : NaN; };
const txt = c => String(cv(c) ?? '').trim();
// Where exactly do two stores differ? A path and two values, never "they differ".
function diffPaths(a, b, path = '', out = [], depth = 0) {
  if (out.length >= 40 || depth > 14) return out;
  if (a === b) return out;
  const ta = a === null ? 'null' : Array.isArray(a) ? 'array' : typeof a;
  const tb = b === null ? 'null' : Array.isArray(b) ? 'array' : typeof b;
  if (ta !== tb) { out.push({ path, a: JSON.stringify(a)?.slice(0, 60), b: JSON.stringify(b)?.slice(0, 60) }); return out; }
  if (ta === 'object' || ta === 'array') {
    const keys = [...new Set([...Object.keys(a || {}), ...Object.keys(b || {})])];
    for (const k of keys) diffPaths(a?.[k], b?.[k], path ? `${path}.${k}` : k, out, depth + 1);
    return out;
  }
  if (JSON.stringify(a) !== JSON.stringify(b)) out.push({ path, a: JSON.stringify(a)?.slice(0, 60), b: JSON.stringify(b)?.slice(0, 60) });
  return out;
}
// The store with the stamps that move on every save zeroed, so two saves of the same plan compare equal.
const settledOf = ev => ev(`(function(){ var m=JSON.parse(JSON.stringify(MS));
  Object.keys(m.years||{}).forEach(function(y){ delete m.years[y].pmoOrder; });
  m.ts=0; delete m.by; (m.log||[]).forEach(function(e){ e.ts=0; }); (m.jrnl||[]).forEach(function(e){ e.t=0; });
  return JSON.stringify(m); })()`);

// ---- the certificate ------------------------------------------------------------------------------
const report = { file: FILE, sections: [], ok: true };
let indent = '';
const say = s => console.log(indent + s);
function section(title) { console.log(`\n${title}\n${'-'.repeat(96)}`); indent = '  '; const sec = { title, checks: [], notes: [] }; report.sections.push(sec); return sec; }
function check(sec, ok, what, detail) {
  sec.checks.push({ ok, what, detail: detail ?? '' });
  if (!ok) report.ok = false;
  say(`${ok ? 'ok  ' : 'FAIL'}  ${what}${detail ? '   ' + detail : ''}`);
}
function note(sec, what) { sec.notes.push(what); say(`      ${what}`); }

// ============================== LOADS =============================================================
function loads(sec, html, saved, slug) {
  const st = saved.state.appns[slug];
  const { ev, errors } = bootAs(html, SLUG_NAME[slug]);
  check(sec, errors.length === 0, 'the board booted without a script error', errors.length ? errors.slice(0, 2).join(' | ').slice(0, 200) : '');
  const stat = ev(`(document.getElementById('shareStat')||{}).innerHTML||''`);
  check(sec, !/Could not read/.test(stat), 'nothing was reported unreadable on opening', /Could not read/.test(stat) ? stat.replace(/<[^>]+>/g, '').slice(0, 200) : '');
  const opened = ev('APPN');
  check(sec, opened === SLUG_NAME[slug], `the ${SLUG_NAME[slug]} slot opened`, opened !== SLUG_NAME[slug] ? 'opened as ' + opened : '');
  const adopted = +ev('MS.ts') === +(st.ts || 0);
  check(sec, adopted, 'the file’s saved state was adopted, not a default or a refused load',
    adopted ? `saved ${new Date(st.ts || 0).toISOString()}${st.by ? ' by ' + st.by : ''}` : `board ts ${ev('MS.ts')} vs file ${st.ts}`);
  if (!adopted) return null;
  const facts = JSON.parse(ev(`JSON.stringify({
    years:Object.keys(MS.years).sort(), cur:MS.cur, base:MS.base, cycle:MS.cycle||'', cycleRef:MS.cycleRef||'',
    svc:SVC.slice(), items:DATA.items.length, base_items:BASE_ITEMS.length, order:S.order.length,
    custom:(S.custom||[]).length, removed:(S.removed||[]).length,
    ghosts:S.order.filter(function(id){ return !itemById(id); }),
    badAsks:Object.keys(S.asks||{}).filter(function(k){ var v=S.asks[k]; return !(Array.isArray(v)&&v.length===SVC.length); }),
    badPots:[S.discSvc,S.mandSvc].map(function(v){ return Array.isArray(v)&&v.length===SVC.length; }),
    strayAlloc:Object.keys(S.alloc||{}).filter(function(k){ return !itemById(k) && (S.removed||[]).indexOf(k)<0; }),
    exdb:(typeof EXDB!=='undefined'&&EXDB&&EXDB.all)? Object.keys(EXDB.all).map(function(k){ var r=EXDB.all[k].rows||{}; return k+':'+Object.keys(r).map(function(y){ return y+'('+(r[y]||[]).length+')'; }).join(' '); }) : [],
    ace:(typeof ACEDB!=='undefined'&&ACEDB&&ACEDB.sets)? Object.keys(ACEDB.sets).map(function(k){ return k+'('+((ACEDB.sets[k].lines||[]).length)+' lines)'; }) : [],
    rp:(typeof RPDB!=='undefined'&&RPDB&&RPDB.entries)? RPDB.entries.length : 0,
    cyc:(typeof CYCDB!=='undefined'&&CYCDB&&CYCDB.cycles)? Object.keys(CYCDB.cycles).map(function(k){ return k+'['+Object.keys(CYCDB.cycles[k].years||{}).join(',')+']'; }) : [],
    subs:(typeof PMOSUBS!=='undefined'&&Array.isArray(PMOSUBS))? PMOSUBS.length : 0,
    ppbe:Object.keys(MS.ppbe||{}), snaps:Object.keys(MS.snaps||{}).length, jrnl:(MS.jrnl||[]).length,
    log:(MS.log||[]).slice(-3).map(function(e){ return (e.by||'?')+' '+new Date(e.ts||0).toISOString().slice(0,16); }),
    census:(function(){ var y=MS.years[MS.cur], o={}; Object.keys(y).forEach(function(k){ var v=y[k];
      o[k]= Array.isArray(v)? v.length : (v&&typeof v==='object')? Object.keys(v).length : (v===undefined||v===null||v==='')? 0 : 1; }); return o; })()
  })`));
  note(sec, `years ${facts.years.map(y => 'FY' + String(y).slice(-2)).join(', ')} · on FY${String(facts.cur).slice(-2)} · base FY${String(facts.base).slice(-2)}`
    + (facts.cycle ? ` · working ${facts.cycle}` : '') + (facts.cycleRef ? ` vs ${facts.cycleRef}` : ''));
  note(sec, `services ${facts.svc.join(', ')} · ${facts.order} requirements on the drill (${facts.custom} added here, ${facts.removed} removed) · ${facts.items} in the data pack`);
  check(sec, facts.base_items > 0, 'the requirement baseline is populated', `${facts.base_items} baseline requirements`);
  check(sec, facts.ghosts.length === 0, 'every id in the priority order resolves to a requirement', facts.ghosts.length ? 'ghosts: ' + facts.ghosts.join(', ') : '');
  check(sec, facts.badAsks.length === 0, 'every per-service requirement value has one figure per service', facts.badAsks.length ? facts.badAsks.join(', ') : '');
  check(sec, facts.badPots.every(Boolean), 'both budget-authority pots have one figure per service');
  check(sec, facts.strayAlloc.length === 0, 'no allocation is parked on a requirement the board cannot find', facts.strayAlloc.length ? facts.strayAlloc.join(', ') : '');
  // every store the file carries is held, and held whole
  const stores = [['execDb', 'EXDB', 'execution data'], ['aceDb', 'ACEDB', 'cost estimates'], ['rpDb', 'RPDB', 'reprogramming log'], ['cycDb', null, 'locked PPBE cycles']];
  for (const [key, g, label] of stores) {
    const inFile = saved.state[key];
    if (!inFile) { note(sec, `the file carries no ${label}`); continue; }
    const held = key === 'cycDb'
      ? JSON.parse(ev(`JSON.stringify((typeof CYCDB!=='undefined'&&CYCDB)||null)`))
      : JSON.parse(ev(`JSON.stringify((typeof ${g}!=='undefined'&&${g})||null)`));
    const want = key === 'cycDb' ? ((inFile.byAp || {})[slug] || null) : inFile;
    if (!want) { note(sec, `the file carries no ${label} for this slot`); continue; }
    // A build from before the store existed cannot hold it: opening the file there is fine, SAVING
    // from there would drop it. Said as a failure under that build, because that is the loss.
    check(sec, held !== null, `this build holds the ${label} store`, held === null ? 'it predates the store — saving from this build would drop the ' + label : '');
    if (held === null) continue;
    const d = diffPaths(want, held);
    const lost = d.filter(x => x.b === undefined);
    check(sec, lost.length === 0, `the ${label} came back whole`, lost.length ? 'missing: ' + lost.slice(0, 4).map(x => x.path).join(', ') : (d.length ? `${d.length} path(s) normalised on load` : ''));
  }
  // the year on screen, as saved vs as held: a path that vanished is a loss, a changed one is normalisation
  const dY = diffPaths(st.years[String(facts.cur)] || {}, JSON.parse(ev(`JSON.stringify(MS.years[MS.cur])`)));
  const lostY = dY.filter(x => x.b === undefined && !/^pmoOrder/.test(x.path));
  check(sec, lostY.length === 0, `FY${String(facts.cur).slice(-2)}’s state came back whole`, lostY.length ? 'missing: ' + lostY.slice(0, 4).map(x => x.path).join(', ') : (dY.length ? `${dY.length} path(s) normalised on load` : 'byte for byte'));
  note(sec, `stores: execution ${facts.exdb.length ? facts.exdb.join(' · ') : 'none'} · estimates ${facts.ace.length ? facts.ace.join(' · ') : 'none'} · reprogramming ${facts.rp} · cycles ${facts.cyc.length ? facts.cyc.join(' · ') : 'none'} · submittals held ${facts.subs}`);
  note(sec, `positions ${facts.ppbe.length ? facts.ppbe.join(', ') : 'none'} · snapshots ${facts.snaps} · journal ${facts.jrnl} · last saves ${facts.log.join(' | ') || 'unstamped'}`);
  const empty = Object.keys(facts.census).filter(k => !facts.census[k]).sort();
  const full = Object.keys(facts.census).filter(k => facts.census[k]).sort();
  note(sec, `FY${String(facts.cur).slice(-2)} carries ${full.length} populated container(s): ${full.join(', ')}`);
  if (empty.length) note(sec, `and ${empty.length} empty: ${empty.join(', ')}`);
  return facts;
}

// ============================== SURVIVES ==========================================================
function survives(sec, html, slug) {
  const { ev } = bootAs(html, SLUG_NAME[slug]);
  const before = settledOf(ev), s0 = ev(`JSON.stringify([typeof EXDB!=='undefined'?EXDB:null, typeof ACEDB!=='undefined'?ACEDB:null, typeof RPDB!=='undefined'?RPDB:null, typeof CYCDB!=='undefined'?CYCDB:null])`);
  let html2; try { html2 = ev('buildSavedHtml()'); } catch (e) { check(sec, false, 'the board can be saved from this file', String(e.message).slice(0, 120)); return; }
  const r = bootAs(html2, SLUG_NAME[slug]);
  const after = settledOf(r.ev);
  const d = diffPaths(JSON.parse(before), JSON.parse(after));
  check(sec, d.length === 0, 'save → reopen returns every value', d.length ? d.slice(0, 3).map(x => `${x.path}: ${x.a} → ${x.b}`).join(' | ') : 'the settled state is byte for byte');
  const s1 = r.ev(`JSON.stringify([typeof EXDB!=='undefined'?EXDB:null, typeof ACEDB!=='undefined'?ACEDB:null, typeof RPDB!=='undefined'?RPDB:null, typeof CYCDB!=='undefined'?CYCDB:null])`);
  check(sec, s0 === s1, 'the four side stores travel byte for byte');
  let html3; try { html3 = r.ev('buildSavedHtml()'); } catch (e) { check(sec, false, 'the reopened board can be saved again', String(e.message).slice(0, 120)); return; }
  const again = settledOf(bootAs(html3, SLUG_NAME[slug]).ev);
  const d2 = diffPaths(JSON.parse(after), JSON.parse(again));
  check(sec, d2.length === 0, 'and a second save is stable — nothing is re-encoded on the next trip', d2.length ? d2.slice(0, 3).map(x => `${x.path}: ${x.a} → ${x.b}`).join(' | ') : '');
}

// ============================== TIES ==============================================================
function ties(sec, html, slug) {
  const { ev } = bootAs(html, SLUG_NAME[slug]);
  const eng = JSON.parse(ev(`JSON.stringify((function(){
    var T=tiers(), o={rows:[], svc:SVC.slice()};
    S.order.forEach(function(id){ var x=itemById(id), p=T[id]; if(!x||!p) return;
      o.rows.push({id:id, ask:x.ask.slice(), d:p.d.slice(), m:p.m.slice(), u:p.u.slice(), basis:basisSvcOf(x), beyond:beyondSvcOf(x,p), trim:trimSvcOf(x), unf:unfSvcOf(x,p)}); });
    return o; })())`));
  // the identities a comptroller can check by hand on any row
  let idOk = 0, idBad = [];
  for (const r of eng.rows) for (let i = 0; i < eng.svc.length; i++) {
    const a = r.d[i] + r.m[i] + r.u[i], b = r.basis[i];
    if (Math.abs(a - b) > 0.005) idBad.push(`${r.id}/${eng.svc[i]}: d+m+u ${a} ≠ basis ${b}`); else idOk++;
    const c = r.beyond[i] + r.trim[i], e = r.unf[i];
    if (Math.abs(c - e) > 0.005) idBad.push(`${r.id}/${eng.svc[i]}: beyond+trim ${c} ≠ unfunded ${e}`); else idOk++;
  }
  check(sec, idBad.length === 0, `the lane identities hold on every requirement, per service (${idOk} checked)`, idBad.slice(0, 3).join(' | '));
  const surfaces = harvest(ev, { cyc: 'POM', cycYr: 2999, scratch: true });
  const engine = surfaces.find(s => s.name === 'engine (tiers)');
  check(sec, !!engine, 'the engine could be read');
  if (!engine) return;
  let cells = 0; const bad = [], silent = [];
  for (const s of surfaces) {
    if (s === engine) continue;
    for (const k of ORDER) {
      const v = s.cells[k];
      if (v === undefined) { silent.push(`${s.name} · ${k}`); continue; }
      cells++;
      const want = engine.cells[k];
      if (want === undefined || want === null) continue;
      if (Math.abs(v - want) > s.tol) bad.push(`${LABEL[k]} on ${s.name}: ${fm(v)} vs engine ${fm(want)} (off by ${fm(v - want)})`);
    }
  }
  check(sec, bad.length === 0, `every surface that states a figure states the engine’s (${surfaces.length} surfaces, ${cells} cells)`, bad.slice(0, 4).join(' | '));
  const T = engine.cells;
  note(sec, `requirement ${fm(T.ask)} · disc BA ${fm(T.discBA)} · mand BA ${fm(T.mandBA)} · funded ${fm(T.funded)} (disc ${fm(T.disc)} + mand ${fm(T.mand)})`);
  note(sec, `unfunded vs DISC ${fm(T.ufr1)} · TOTAL unfunded ${fm(T.ufr2)} = trim ${fm(T.trim)} + beyond ${fm(T.beyond)} · MC ${fm(T.mcTotal)} short ${fm(T.mcShort)}`);
  if (silent.length) note(sec, `${silent.length} cell(s) silent on this data (a block the data does not produce is silence, not a fault)`);
  return T;
}

// ============================== CROSS-FOOTS =======================================================
function crossFoots(sec, html, slug) {
  const { ev } = bootAs(html, SLUG_NAME[slug]);
  const svc = JSON.parse(ev('JSON.stringify(SVC)'));
  let sheets; try { sheets = JSON.parse(capture(ev)); } catch (e) { check(sec, false, 'the main workbook builds', String(e.message).slice(0, 120)); return; }
  const rowsOf = n => { const s = sheets.find(x => x.name === n); return s ? (s.rows || s.data || []) : null; };
  // A TOTAL row equals the rows between it and its header, column by column. Only columns that are
  // numeric on the total row are closed; a header cell naming a percentage is skipped.
  const closeTotal = (name, hdrFirst, totalRe) => {
    const rows = rowsOf(name);
    if (!rows) { note(sec, `${name}: not in this workbook`); return; }
    const hi = rows.findIndex(r => txt((r || [])[0]) === hdrFirst);
    if (hi < 0) { note(sec, `${name}: no "${hdrFirst}" header`); return; }
    const ti = rows.findIndex((r, i) => i > hi && totalRe.test(txt((r || [])[0])));
    if (ti < 0) { note(sec, `${name}: no total row`); return; }
    const hdr = (rows[hi] || []).map(txt);
    const bad = []; let cols = 0;
    (rows[ti] || []).forEach((c, ci) => {
      const t = num(c); if (isNaN(t) || ci === 0 || /%/.test(hdr[ci] || '')) return;
      let s = 0, n = 0;
      for (let r = hi + 1; r < ti; r++) { const v = num((rows[r] || [])[ci]); if (!isNaN(v)) { s += v; n++; } }
      if (!n) return;
      cols++;
      if (Math.abs(s - t) > TOL) bad.push(`${hdr[ci] || 'col#' + ci}: rows ${fm(s)} vs total ${fm(t)}`);
    });
    check(sec, bad.length === 0, `${name}: the ${txt(rows[ti][0])} row is the ${ti - hi - 1} rows above it, in ${cols} column(s)`, bad.slice(0, 3).join(' | '));
  };
  closeTotal('Funding Streams', 'Service', /^TOTAL$/);
  closeTotal('Decision Bands', 'Band', /^ALL BANDS$/);
  closeTotal('PMO Matrix', 'PMO', /^TOTAL$/);
  closeTotal('Unfunded Requirements', 'Rank', /^TOTAL$/);
  // every breakout: a run of service columns adds back to the figure they break out (the recon's rule)
  let rowsChecked = 0, blocks = 0; const bad = [];
  for (const sh of sheets) {
    const rows = sh.rows || sh.data || [];
    rows.forEach((hdrRow, h) => {
      const hdr = (hdrRow || []).map(txt);
      const runAt = k0 => { const c0 = hdr[k0] || ''; if (!c0.startsWith(svc[0])) return null;
        const suffix = c0.slice(svc[0].length); return svc.every((sv, k) => (hdr[k0 + k] || '') === sv + suffix) ? suffix : null; };
      for (let k = 1; k < hdr.length; k++) {
        const sfx = runAt(k); if (sfx === null) continue;
        let totCol = k - 1;
        if (sfx.trim()) { const want = sfx.trim().toLowerCase();
          let named = hdr.findIndex((x, j) => j < k && x.toLowerCase() === want);
          if (named < 0) named = hdr.findIndex((x, j) => j < k && new RegExp('^' + want + '\\b', 'i').test(x));
          if (named < 0) { k += svc.length - 1; continue; } totCol = named; }
        if (!hdr[totCol] || /^(PID|CCaR|Plan Event|PMO|Rank|Status|Band)/i.test(hdr[totCol])) { k += svc.length - 1; continue; }
        blocks++;
        for (let r = h + 1; r < rows.length; r++) {
          const row = rows[r] || [], label = txt(row[0]);
          if (!label || /^(Rank|Service)$/i.test(label)) break;
          const tot = num(row[totCol]), parts = svc.map((_, j) => num(row[k + j]));
          if (isNaN(tot) || parts.some(isNaN)) continue;
          rowsChecked++;
          if (Math.abs(sum(parts) - tot) > TOL) bad.push(`${sh.name} · ${hdr[totCol]} · "${label.slice(0, 28)}": ${fm(sum(parts))} vs ${fm(tot)}`);
        }
        k += svc.length - 1;
      }
    });
  }
  check(sec, bad.length === 0, `every per-service breakout adds back to its figure (${rowsChecked} rows across ${blocks} blocks)`, bad.slice(0, 3).join(' | '));
  // the other workbooks build at all on this data
  for (const fn of ['exportCSV', 'exportSrc', 'exportPlans', 'exportFlow', 'exportCoa', 'exportReprog']) {
    let n = 0; try { n = grabSheets(ev, fn).length; } catch { n = 0; }
    check(sec, n > 0, `${fn} builds on this data`, n ? `${n} sheet(s)` : 'no sheets came back');
  }
}

// ============================== MOVED =============================================================
function cellsOf(html, slug) {
  const { ev } = bootAs(html, SLUG_NAME[slug]);
  const cells = {};
  for (const fn of ['exportExcel', 'exportCSV', 'exportSrc', 'exportPlans', 'exportFlow', 'exportCoa', 'exportReprog']) {
    let sheets; try { sheets = grabSheets(ev, fn); } catch { continue; }
    for (const sh of sheets) {
      const rows = sh.rows || sh.data || [];
      const isHeader = r => (r || []).filter(c => txt(c)).length >= 3 && (r || []).every(c => typeof cv(c) !== 'number');
      const headerAt = []; let cur = [];
      rows.forEach((r, i) => { if (isHeader(r)) cur = (r || []).map(txt); headerAt[i] = cur; });
      const seen = {};
      rows.forEach((r, ri) => {
        if (isHeader(r)) return;
        const hdr = headerAt[ri] || [];
        const words = (r || []).map(txt).filter(Boolean).filter(t => isNaN(Number(t))).slice(0, 3);
        let label = words.join(' / ').slice(0, 70) || `row#${ri}`;
        seen[label] = (seen[label] || 0) + 1; if (seen[label] > 1) label += ` [${seen[label]}]`;
        (r || []).forEach((c, ci) => { const v = cv(c); if (typeof v !== 'number') return;
          cells[`${fn} ▸ ${sh.name} ▸ ${label} ▸ ${hdr[ci] || 'col#' + ci}`] = v; });
      });
    }
  }
  return cells;
}
function moved(sec, htmlA, htmlB, slug, labelA, labelB) {
  const A = cellsOf(htmlA, slug), B = cellsOf(htmlB, slug);
  const keys = [...new Set([...Object.keys(A), ...Object.keys(B)])].sort();
  const mv = [], gone = [], fresh = [];
  for (const k of keys) { const a = A[k], b = B[k];
    if (a === undefined) fresh.push(k); else if (b === undefined) gone.push(k); else if (Math.abs(a - b) > 0.005) mv.push({ k, a, b }); }
  note(sec, `${Object.keys(A).length} figures under ${labelA} · ${Object.keys(B).length} under ${labelB}`);
  say(`      ${mv.length} moved · ${fresh.length} new · ${gone.length} gone   (a report, not a failure)`);
  mv.slice(0, 25).forEach(x => say(`        ${x.k}\n            ${fm(x.a)}  ->  ${fm(x.b)}   (${x.b - x.a >= 0 ? '+' : ''}${fm(x.b - x.a)})`));
  gone.slice(0, 12).forEach(k => say(`        gone: ${k}   was ${fm(A[k])}`));
  fresh.slice(0, 12).forEach(k => say(`        new:  ${k}   ${fm(B[k])}`));
  if (mv.length > 25 || gone.length > 12 || fresh.length > 12) say('        … (the JSON certificate carries the full list)');
  sec.moved = { moved: mv, gone, fresh };
}

// ============================== CERTIFY ONE BUILD ================================================
function certify(html, saved, label) {
  const slugs = Object.keys(saved.state.appns || {}).filter(k => saved.state.appns[k] && saved.state.appns[k].years);
  console.log(`\n${'='.repeat(96)}\nUNDER ${label}\n${'='.repeat(96)}`);
  if (!slugs.length) { const sec = section('LOADS'); check(sec, false, 'the file carries a board with fiscal years in it', 'no appropriation slot holds a plan'); return; }
  const T = {};
  for (const slug of slugs) {
    console.log(`\n  ── ${SLUG_NAME[slug] || slug} ${'─'.repeat(80)}`);
    const sec1 = section(`LOADS — ${SLUG_NAME[slug]}`);
    const facts = loads(sec1, html, saved, slug);
    if (!facts) continue;
    const sec2 = section(`SURVIVES — ${SLUG_NAME[slug]}`); survives(sec2, html, slug);
    const sec3 = section(`TIES — ${SLUG_NAME[slug]}`); T[slug] = ties(sec3, html, slug);
    const sec4 = section(`CROSS-FOOTS — ${SLUG_NAME[slug]}`); crossFoots(sec4, html, slug);
  }
  return { slugs, T };
}

// ============================== SELF-TEST =========================================================
// Builds a saved file from the working tree with an awkward plan on it, certifies it (must hold),
// then plants two losses and certifies again (must be noticed). A verifier that cannot fail is
// a rumour.
if (flag('--selftest')) {
  const it = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: 'Req ' + id, event: 'Ev ' + id, ccar: 'CC' + id, fy26: ask.map(() => 0), ask, alloc: null });
  const sc = { services: ['USAF', 'ANG', 'AFRC', 'STOVL', 'USMC-C', 'USN'],
    items: [it('A', 'PSM', [9000000, 2000000, 1000000, 4000000, 1500000, 2500001]), it('B', 'ATL', [3000000, 500000, 250000, 1000000, 0, 750000]),
            it('C', 'TSS', [1200000, 300000, 150000, 333333, 200000, 100000]), it('D', 'SE', [750000, 125000, 62500, 400000, 175000, 87500]),
            it('E', 'LOG', [2400000, 600000, 300000, 900000, 450000, 225000])],
    disc: [8000000, 1500000, 600000, 3000000, 1400000, 1600000], mand: [3000000, 600000, 400000, 1500000, 800000, 900000],
    order: ['A', 'B', 'C', 'D', 'E'], mc: { A: true, C: true } };
  const { ev } = boot(); seed(ev, sc);
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.alloc['B']={m:'t', v:3900001}; seedSplit('C'); S.minInc['E']=250000; S.band['A']='pdm';
      S.awards['A']={mode:'single', d:FYMON[2][0], day:7}; S.notes['D']='a note with a literal </script> in it';
      var E=rpAll(); E.push({id:'RP1', ts:1, ap:mySlug(), fy:MS.cur, type:'BTR', svc:0, appn:'', pec:'', bpac:'', title:'BTR add USAF', amtM:1.5, dir:'add', pool:'disc', status:'Pending', remarks:''}); persistRp();
      ACEDB.sets['2026ACE']={lines:[{ap:mySlug(), pmo:'PSM', wbs:'1.1', v:{}}]}; ACEDB.sets['2026ACE'].lines[0].v[MS.cur]=9500000; persistAce();
      applyState(S); save(); blCyc='PB'; blYr=MS.cur; cycLock(); 'ok'`);
  const html = ev('buildSavedHtml()');
  const dir = mkdtempSync(join(tmpdir(), 'spmt-verify-'));
  const good = join(dir, 'board-good.html'); writeFileSync(good, html);
  const saved = readSaved(html);
  console.log(`SELF-TEST — a synthetic saved board (${saved.build}, ${saved.flavour}) at ${good}`);
  certify(html, saved, `its own code (${saved.build})`);
  const clean = report.ok;
  console.log(`\n${clean ? 'ok  ' : 'FAIL'}  the clean file holds`);
  // planted loss 1: a ghost in the priority order
  report.ok = true; report.sections.length = 0;
  const ghost = html.replace(/"order":\["A","B","C","D","E"\]/, '"order":["A","B","C","D","E","GHOST"]');
  if (ghost === html) { console.log('FAIL  could not plant the ghost (the order was not found in the file)'); process.exit(1); }
  console.log('\n… planting a ghost id in the priority order');
  certify(ghost, readSaved(ghost), 'planted ghost');
  const caught1 = !report.ok;
  console.log(`\n${caught1 ? 'ok  ' : 'FAIL'}  the ghost was noticed`);
  // planted loss 2: the saved state cannot be read
  report.ok = true; report.sections.length = 0;
  const broken = html.replace(STATE_RE, (m, a) => m.replace(a, a.slice(0, Math.floor(a.length / 2))));
  console.log('\n… truncating the saved state');
  const sv = readSaved(broken);
  let caught2 = false;
  if (sv.stateErr) { console.log(`ok    the file reads as damaged before boot: ${sv.stateErr}`); caught2 = true; }
  else { certify(broken, sv, 'planted damage'); caught2 = !report.ok; }
  console.log(`\n${caught2 ? 'ok  ' : 'FAIL'}  the damage was noticed`);
  const all = clean && caught1 && caught2;
  console.log(`\n${'='.repeat(96)}\n${all ? 'VERIFIER SELF-TEST PASSED — a clean file holds, and a planted loss is noticed' : 'VERIFIER SELF-TEST FAILED'}`);
  process.exit(all ? 0 : 1);
}

// ============================== MAIN ==============================================================
if (!FILE) { console.log('usage: node tools/verify-file.mjs <saved-board.html> [--with <build.html>] [--json <out.json>]   |   --selftest'); process.exit(2); }
const path = resolve(FILE);
if (!existsSync(path)) { console.log(`no such file: ${path}`); process.exit(2); }
const html = readFileSync(path, 'utf8');
const saved = readSaved(html);
const gitShort = (() => { try { return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT }).toString().trim(); } catch { return '?'; } })();
console.log(`VERIFY — ${basename(path)}  (${(saved.bytes / 1048576).toFixed(2)} MB, ${saved.flavour} build, ${saved.build}${saved.mode && saved.mode.sandbox ? ', a PMO COPY' : ''})`);
console.log(`working tree ${gitShort} · ${new Date().toISOString()}`);
if (saved.stateErr) { console.log(`\nFAIL  the saved state in this file cannot be read: ${saved.stateErr}`); process.exit(1); }
if (!saved.state || !saved.state.appns) { console.log('\nFAIL  this is not a saved board: it carries no state'); process.exit(1); }
report.build = saved.build; report.flavour = saved.flavour;

const own = certify(html, saved, `its own code (${saved.build})`);
const ownOk = report.ok;

// the build about to ship, holding the same data
let withHtml = null, withLabel = '';
if (WITH) { withHtml = readFileSync(resolve(WITH), 'utf8'); withLabel = basename(WITH); }
else {
  const cand = join(ROOT, saved.flavour === 'grid' ? 'prioritization-board-grid.html' : 'prioritization-board.html');
  const cur = readSaved(readFileSync(cand, 'utf8'));
  if (cur.build !== saved.build) { withHtml = readFileSync(cand, 'utf8'); withLabel = `${basename(cand)} (${cur.build})`; }
  else console.log(`\nthe working tree is the same build (${cur.build}); nothing to compare it with — pass --with to force`);
}
if (withHtml) {
  const m = STATE_RE.exec(html), mm = MODE_RE.exec(html);
  const injected = withHtml.replace(STATE_RE, (x, a) => x.replace(a, m[1])).replace(MODE_RE, (x, a) => x.replace(a, mm ? mm[1] : 'null'));
  const okBefore = report.ok; report.ok = true;
  certify(injected, readSaved(injected), `the current build — ${withLabel}`);
  const curOk = report.ok; report.ok = okBefore && curOk;
  const sec = section(`MOVED — ${withLabel} vs the file’s own code`);
  for (const slug of own.slugs) { say(`  ${SLUG_NAME[slug]}`); moved(sec, html, injected, slug, saved.build, withLabel); }
  report.underCurrent = curOk;
}
console.log(`\n${'='.repeat(96)}`);
console.log(report.ok ? `CERTIFIED — the file loads whole, survives a trip, ties across every surface, and its totals add up${withHtml ? ', under its own code and the current build' : ''}`
                      : 'NOT CERTIFIED — at least one section failed; the lines marked FAIL above are the finding');
if (JSON_OUT) { writeFileSync(resolve(JSON_OUT), JSON.stringify(report, null, 2)); console.log(`certificate written to ${resolve(JSON_OUT)}`); }
process.exit(report.ok ? 0 : 1);
