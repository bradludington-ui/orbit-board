// EXPORT DELTA — which numbers moved, and where?
//
// "Is the math right" and "what did this change move" are DIFFERENT QUESTIONS. Two versions of the
// board can both be internally consistent, both pass every suite, and still print different figures
// in the workbook someone is about to brief. The suites answer the first question. Nothing answered
// the second, and on a programme where the stated bar is "I can't brief incorrect or error-prone
// numbers", the second is the one asked in the room.
//
// NO BASELINE FILE TO MAINTAIN. It builds the exports twice -- once from the working tree, once from
// a git ref -- and diffs. A stored baseline is a file someone has to remember to refresh, and a
// stale one reports movement that already happened; git already knows what the board used to be.
//
// EVERY CELL IS ADDRESSED BY NAME: sheet, row label, column header. Never by index. A column
// inserted between two versions would otherwise show up as "every figure to its right moved", which
// is a report nobody reads twice.
//
//   node tools/export-delta.mjs                  working tree vs HEAD
//   node tools/export-delta.mjs --ref HEAD~3     against an older commit
//   node tools/export-delta.mjs --ref v1.57      against a tag
import { boot, seed } from './export-audit/boot.mjs';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const argOf = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const REF = argOf('--ref', 'HEAD');
const BOARD = argOf('--board', 'prioritization-board-grid.html');
const TOL = Number(argOf('--tol', '0.005'));

// A FIXED fixture. Deterministic on purpose: the whole point is that the INPUT is constant so any
// difference in the output belongs to the code. A randomized board here would report noise as
// movement and the tool would be useless.
const SVC = ['USAF', 'ANG', 'AFRC'];
const mk = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false,
  title: id + ' title', event: id + ' event', ccar: 'JSF' + id, fy26: ask.map(() => 0), ask, alloc: null });
const FIX = {
  services: SVC,
  items: [mk('A', 'PSM', [12000000, 1500000, 900000]), mk('B', 'AV', [6000000, 2200000, 400000]),
          mk('C', 'MxS', [5000000, 800000, 300000]), mk('D', 'TSS', [3000000, 600000, 250000])],
  disc: [14000000, 2000000, 1000000], mand: [4000000, 900000, 300000],
  order: ['A', 'B', 'C', 'D'], mc: { B: true },
  alloc: { C: { m: 's', v: [3000000, 500000, 200000] } },
};

const EXPORTS = ['exportExcel', 'exportCSV', 'exportSrc', 'exportPlans', 'exportFlow', 'exportCoa', 'exportFydpPlan', 'exportCycCompare'];
const cv = c => (c && typeof c === 'object' && 'v' in c) ? c.v : c;
const txt = c => String(cv(c) ?? '').trim();

// Harvest every numeric cell, addressed by sheet + row label + column header.
function harvest(html) {
  const { ev } = boot({ html });
  seed(ev, FIX);
  ev(`S.awards['A']={mode:'single',d:FYMON[1][0],day:1};
      S.awards['B']={mode:'single',d:FYMON[2][0],day:1};
      S.awards['C']={mode:'single',d:FYMON[3][0],day:1}; save(); 'ok'`);
  // the cycle comparison needs a lock for A: a scratch PB lock of this fixture, against the working plan
  if (ev(`typeof cycLock==='function' && typeof exportCycCompare==='function'`))
    ev(`MS.years[MS.cur]=S; blCyc='PB'; blYr=MS.cur; cycLock(); cycCmpA='PB|'+MS.cur; cycCmpB='working'; 'ok'`);
  const cells = {};
  for (const fn of EXPORTS) {
    let sheets;
    try {
      sheets = JSON.parse(ev(`(function(){ var got='[]';
        if(!globalThis.__ob) globalThis.__ob=buildXlsx;
        buildXlsx=function(sh){ got=JSON.stringify(sh); return new Uint8Array(0); };
        try{ ${fn}(); }catch(e){ got='[]'; }
        buildXlsx=globalThis.__ob; return got; })()`));
    } catch { continue; }
    for (const sh of sheets) {
      const rows = sh.rows || sh.data || [];
      // THE NEAREST HEADER ABOVE, not one header per sheet. Decision Bands carries TWO header
      // blocks -- a BAND SUMMARY and the detail table -- and addressing the detail rows against the
      // summary's header put every column past it on `col#30`, which then read as "Funded % moved by
      // $14.4M" the moment a column was inserted. Phantom movement is the one thing this tool must
      // not produce: a report that cries wolf gets skimmed, and then a real move goes past unread.
      const isHeader = r => (r || []).filter(c => txt(c)).length >= 3
        && (r || []).every(c => typeof cv(c) !== 'number');
      const headerAt = [];
      let cur = [];
      rows.forEach((r, i) => { if (isHeader(r)) cur = (r || []).map(txt); headerAt[i] = cur; });

      // A ROW KEY THAT IS ACTUALLY UNIQUE. Column 0 is not a label on every sheet -- on the Spend
      // Plan Source it is the fiscal year, so every row keyed as "2027" and collided into one.
      // Built from the row's leading TEXT cells, with an occurrence counter for genuine duplicates.
      const seen = {};
      rows.forEach((r, ri) => {
        const hdr = headerAt[ri] || [];
        if (isHeader(r)) return;
        const words = (r || []).map(txt).filter(Boolean).filter(t => isNaN(Number(t))).slice(0, 3);
        let label = words.join(' / ').slice(0, 70) || `row#${ri}`;
        seen[label] = (seen[label] || 0) + 1;
        if (seen[label] > 1) label += ` [${seen[label]}]`;
        (r || []).forEach((c, ci) => {
          const v = cv(c);
          if (typeof v !== 'number') return;
          const col = hdr[ci] || `col#${ci}`;
          // sheet ▸ row ▸ column — stable across an inserted column, which an index is not
          cells[`${fn} ▸ ${sh.name} ▸ ${label} ▸ ${col}`] = v;
        });
      });
    }
  }
  return cells;
}

const now = readFileSync(join(ROOT, BOARD), 'utf8');
let was;
try { was = execFileSync('git', ['show', `${REF}:${BOARD}`], { cwd: ROOT, maxBuffer: 1 << 28 }).toString(); }
catch (e) { console.log(`cannot read ${BOARD} at ${REF}: ${String(e.message).slice(0, 120)}`); process.exit(2); }

const refShort = (() => { try { return execFileSync('git', ['rev-parse', '--short', REF], { cwd: ROOT }).toString().trim(); } catch { return REF; } })();

console.log(`EXPORT DELTA — working tree vs ${REF} (${refShort}), board ${BOARD}`);
console.log('='.repeat(104));
console.log('a fixed fixture in both runs, so every difference belongs to the code\n');

const A = harvest(was), B = harvest(now);
const keys = [...new Set([...Object.keys(A), ...Object.keys(B)])].sort();
const moved = [], added = [], removed = [];
for (const k of keys) {
  const a = A[k], b = B[k];
  if (a === undefined) { added.push({ k, b }); continue; }
  if (b === undefined) { removed.push({ k, a }); continue; }
  if (Math.abs(a - b) > TOL) moved.push({ k, a, b, d: b - a });
}

const fm = v => (v === undefined ? '--' : '$' + Math.round(v).toLocaleString());
const show = (title, rows, fmt, cap = 40) => {
  console.log(`${title}: ${rows.length}`);
  rows.slice(0, cap).forEach(r => console.log('  ' + fmt(r)));
  if (rows.length > cap) console.log(`  … and ${rows.length - cap} more`);
  console.log('');
};

console.log(`${Object.keys(A).length} figures before · ${Object.keys(B).length} after\n`);
if (moved.length) show('FIGURES THAT MOVED', moved,
  r => `${r.k}\n      ${fm(r.a)}  ->  ${fm(r.b)}   (${r.d > 0 ? '+' : ''}${fm(r.d).replace('$', '$')})`);
if (added.length) show('FIGURES THAT ARE NEW', added, r => `${r.k}   ${fm(r.b)}`);
if (removed.length) show('FIGURES THAT ARE GONE', removed, r => `${r.k}   was ${fm(r.a)}`);

console.log('='.repeat(104));
if (!moved.length && !added.length && !removed.length) {
  console.log('NO FIGURE MOVED — every export prints exactly what it printed at ' + refShort);
} else {
  console.log(`${moved.length} moved · ${added.length} new · ${removed.length} gone`);
  console.log('\nThis is a REPORT, not a failure. Figures move for good reasons — a fixed defect, a');
  console.log('column added on purpose, a rule corrected. The question it answers is whether the ones');
  console.log('that moved are the ones you MEANT to move. Anything here you cannot explain is the finding.');
}
// Always exit 0: movement is information, not a fault. The nightly job reads it and says what moved.
process.exit(0);
