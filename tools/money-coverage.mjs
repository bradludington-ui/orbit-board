// MONEY COVERAGE — does every surface that emits dollars have a mutation aimed at it?
//
// Green suites prove nothing on their own. The Spend Plan Source shipped with its Amount column
// asserted by NOTHING: audit-recon asked only whether the workbook was readable, so changing the
// column's basis moved a fixture total from 285 to 150 with all twelve suites still green. No check
// failed because no check existed. This is the detector for that class of hole.
//
// THE DETECTOR IS THE MUTATION SWEEP. A money surface with no mutation aimed at it is a surface
// nothing is proving anything about. So this maps every mutation's search string to the function
// whose body contains it, and reports any money surface with none.
//
// THREE WAYS IT REFUSES TO GO STALE:
//   1. A surface in the board but absent from the REGISTRY fails the run — a new export cannot
//      appear without someone saying whether it emits money.
//   2. A registry entry naming a function the board no longer has fails — a renamed export must not
//      leave a dead promise of coverage behind it.
//   3. A `gap` that has since been covered fails — debt that was paid must be struck off, or the
//      list of known holes slowly becomes fiction.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const BOARD = process.env.BOARD || join(ROOT, 'prioritization-board.html');
const src = readFileSync(BOARD, 'utf8');
const mutSrc = readFileSync(join(HERE, 'export-audit', 'mutate.mjs'), 'utf8');

// ---- THE REGISTRY -------------------------------------------------------------------------------
//   money : emits dollars, so it needs a mutation aimed at it
//   via   : helper functions whose mutations count as covering this surface. A surface that does its
//           arithmetic in a helper is covered by a mutation in that helper -- naming it here is the
//           difference between "covered" and "covered, and we know where".
//   gap   : dated acknowledgement that this surface has NO mutation yet, and what it would take.
//           A gap is debt, not a pass: the run reports every one, every night, until it is paid.
const REGISTRY = {
  tiers:        { money: true,  what: 'the lane walk — every dollar on the board starts here' },
  tierTotals:   { money: true,  what: 'board-wide totals, including both unfunded readings' },
  mcCalc:       { money: true,  what: 'Mission Critical total and shortage' },
  trimAbsorb:   { money: true,  what: 'unspent discretionary against the trims that could take it — '
                                    + 'read as an instruction to type a figure into an allocation box' },
  forecast:     { money: true,  what: 'the spend forecast — when funded dollars land' },
  srcRowsOf:    { money: true,  what: 'Spend Plan Source rows — the Amount column',
                  via: ['srcSvcOf'] },
  exportSrc:    { money: true,  what: 'the Spend Plan Source workbook', via: ['srcSvcOf', 'srcRowsOf'] },
  crExportRows: { money: true,  what: 'the 1A9A CR cash return' },
  exportExcel:  { money: true,  what: 'the breakouts workbook — lanes, bands, matrices, unfunded' },
  exportCSV:    { money: true,  what: 'the Priority Drill' },
  exportPPT:    { money: true,  what: 'the PowerPoint deck' },
  exportPlans:  { money: true,  what: 'Plan A / Plan B two-plan forecast' },

  // The five below were recorded gaps from 15 Sep 2026 and were closed on 19 Sep 2026, each with a
  // check that derives the figure from the fixture and a mutation inside the surface that the check
  // catches. Closing the funds flow found a shipped defect (flow-plan-year-printed-the-allocation).
  crData:       { money: true,  what: 'CR cash needs by half-month window' },
  exportFlow:   { money: true,  what: 'the funds flow', via: ['flowCalc', 'flowPlanRecs'] },
  exportCoa:    { money: true,  what: 'chart of accounts', via: ['coaRows', 'coaSummary', 'coaAsk'] },
  exportReprog: { money: true,  what: 'the ATR/BTR reprogramming log' },
  execSynopsis: { money: true,  what: 'the Executive Funding Synopsis' },
  exportAceTieout: { money: true, what: 'the ACE tie-out' },
  exportCycCompare: { money: true, what: 'the two-cycle comparison — A, B and Δ per year, the Changes sheet, and the rows accounting for the totals',
                  via: ['cycCmpData', 'cycCmpBody'] },
  exportFydpPlan: { money: true, what: 'the FYDP spend plan — one cycle or the working plan across its window, by requirement, PMO and service',
                  via: ['fydpData', 'fydpRows', 'fydpSub', 'fydpSvc', 'fydpUnf', 'fydpWindow', 'fydpBody', 'fydpPos', 'fydpPosTot', 'fydpPosKey'] },
  cycDelta:     { money: true,  what: 'the deltas against the reference cycle — the row chips, the record panel and the Changes panel',
                  via: ['cycDeltaChip', 'cycDeltaInsp', 'cycChgBody', 'cycWho', 'cycNextOf', 'cycRetagNext'] },
  cycProjOf:    { money: true,  what: 'a locked PPBE cycle’s projection — value, allocation and funding per requirement, per year',
                  via: ['cycLock', 'cycWindowYears', 'cycMigrateLegacy'] },

  // surfaces that carry no arithmetic of their own -- each needs a reason, not a shrug
  exportProposedOrder: { money: false, reason:
    'writes the ORDER — rank and identity only. It moves no dollars and prints none.' },
  exportIdsReq:  { money: false, reason: 'IDS requirement text: identity and prose, no dollar columns.' },
  exportRlgPlan: { money: false, reason: 'RLG plan narrative fields, no dollar columns.' },
  exportExView:  { money: false, reason: 'writes the saved VIEW (filters, sort, open panel), not figures.' },
};

// ---- each top-level function's body span ---------------------------------------------------------
// Top-level declarations in this board sit at column 0, so a function's body runs to the next one.
// That is deliberately NOT brace matching: a brace counter is thrown by braces inside strings and
// regex literals, of which this file has thousands, and it fails silently by reporting no span --
// which would have read here as "this surface does not exist" rather than "I could not parse it".
const TOP = /^(?:function\s+([A-Za-z0-9_$]+)|(?:const|let|var)\s+([A-Za-z0-9_$]+)|class\s+([A-Za-z0-9_$]+))/gm;
const tops = [];
for (const m of src.matchAll(TOP)) tops.push({ name: m[1] || m[2] || m[3], at: m.index });
tops.sort((a, b) => a.at - b.at);
const spanOf = name => {
  const i = tops.findIndex(t => t.name === name);
  if (i < 0) return null;
  return { start: tops[i].at, end: i + 1 < tops.length ? tops[i + 1].at : src.length };
};

// ---- the mutations, and where each lands ---------------------------------------------------------
const muts = [];
for (const blk of mutSrc.split(/\{\s*id:\s*'/).slice(1)) {
  const id = blk.slice(0, blk.indexOf("'"));
  const findM = /find:\s*(["'])((?:\\.|(?!\1)[\s\S])*?)\1/.exec(blk);
  if (!findM) continue;
  let find;
  try { find = JSON.parse('"' + findM[2].replace(/"/g, '\\"').replace(/\\'/g, "'") + '"'); }
  catch { continue; }
  muts.push({ id, find });
}

const fails = [], spans = {};
for (const name of Object.keys(REGISTRY)) {
  const sp = spanOf(name);
  if (!sp) fails.push(`REGISTRY names "${name}" but the board has no top-level function by that `
    + `name — a renamed export must not leave a dead promise of coverage behind it.`);
  else spans[name] = sp;
}
// helpers named in `via` must exist too, or the promise points nowhere
for (const [name, v] of Object.entries(REGISTRY))
  for (const h of v.via || [])
    if (!spanOf(h)) fails.push(`"${name}" claims coverage via "${h}", which the board does not have.`);

const landed = {};                             // function name -> [mutation ids]
for (const m of muts) {
  const at = src.indexOf(m.find);
  if (at < 0) continue;                        // stale target; the sweep reports it NOT APPLIED
  for (let i = 0; i < tops.length; i++) {
    const start = tops[i].at, end = i + 1 < tops.length ? tops[i + 1].at : src.length;
    if (at >= start && at < end) { (landed[tops[i].name] ||= []).push(m.id); break; }
  }
}
// a surface is covered by mutations in its OWN body or in any helper it names in `via`
const coverOf = name => [name, ...(REGISTRY[name].via || [])]
  .flatMap(n => landed[n] || []);

// ---- report ---------------------------------------------------------------------------------
console.log('MONEY COVERAGE — every surface that emits dollars, and the mutations aimed at it');
console.log('='.repeat(96));
const money = Object.entries(REGISTRY).filter(([, v]) => v.money);
const gaps = [];
for (const [name, v] of money) {
  const got = coverOf(name);
  if (got.length) {
    console.log(`  ok    ${name.padEnd(18)} ${String(got.length).padStart(2)} mutation(s)  `
      + got.slice(0, 4).join(', ') + (got.length > 4 ? ', …' : ''));
    // debt that was paid must be struck off, or the list of known holes becomes fiction
    if (v.gap) fails.push(`"${name}" is marked as a known gap but now HAS coverage (`
      + got.slice(0, 3).join(', ') + '). Remove its `gap:` line — a hole that was filled must not '
      + 'stay on the list.');
  } else if (v.gap) {
    gaps.push([name, v]);
    console.log(`  GAP   ${name.padEnd(18)}  0 mutation(s)  <<< known, recorded`);
  } else {
    fails.push(`"${name}" emits money (${v.what}) and NO mutation is aimed at it. Nothing is `
      + `proving anything about these dollars. Add a mutation that breaks them and a check that `
      + `catches it — or, if this is to be accepted for now, record it as a dated gap.`);
    console.log(`  NEW GAP  ${name.padEnd(15)}  0 mutation(s)  <<< ${v.what}`);
  }
}
console.log('\n  carrying no arithmetic of their own:');
for (const [name, v] of Object.entries(REGISTRY).filter(([, x]) => !x.money))
  console.log(`    ${name.padEnd(20)} ${v.reason.slice(0, 74)}`);

// a surface the board has but the registry does not is the stale-list trap: fail, never pass
const declared = new Set(Object.keys(REGISTRY));
const found = [...src.matchAll(/^function\s+(export[A-Za-z0-9_]*|execSynopsis|crExportRows|srcRowsOf|crData)\s*\(/gm)]
  .map(m => m[1]);
const undeclared = [...new Set(found)].filter(n => !declared.has(n));
if (undeclared.length) fails.push('in the board but not in the REGISTRY: ' + undeclared.join(', ')
  + ' — a new export cannot appear without someone saying whether it emits money.');

if (gaps.length) {
  console.log('\n' + '-'.repeat(96));
  console.log(`${gaps.length} SURFACE(S) WITH NO MUTATION — known, recorded, and still owed:\n`);
  gaps.forEach(([n, v]) => console.log(`  ${n}\n      ${v.gap}\n`));
  console.log('  These do not fail the run. They are reported every night so they get paid down,');
  console.log('  and the run DOES fail the moment a NEW one appears or a recorded one is quietly');
  console.log('  covered without being struck off.');
}

console.log('\n' + '='.repeat(96));
if (!fails.length) {
  const covered = money.length - gaps.length;
  console.log(`money coverage holds — ${covered}/${money.length} surfaces have mutations aimed at `
    + `them, ${gaps.length} recorded gap(s) outstanding`);
  process.exit(0);
}
console.log(`${fails.length} COVERAGE FAILURE(S)\n`);
fails.forEach(f => console.log('  - ' + f + '\n'));
process.exit(1);
