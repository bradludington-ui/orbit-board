// MONEY MAP — every registered money surface against the seven dimensions money is reconciled by (item 59).
//
// Codex's acceptance condition for launch: integer-dollar reconciliation by APPROPRIATION, FISCAL YEAR,
// SERVICE, REQUIREMENT, MONTH, CR HALF and FUNDING LANE across every applicable visual and export --
// and a map that says what is proven, what does not apply, and what remains, so that nothing is
// "satisfied" silently. This is that map.
//
// THE SURFACES ARE READ, NOT LISTED. Every money surface in tools/money-coverage.mjs's REGISTRY and every
// surface the trace matrix harvests (tools/trace-lib.mjs, tools/trace-stated.json) is a row, found from
// their sources each run. A surface added to either one appears here at once -- and fails the run until
// tools/money-map.json says, dimension by dimension, what proves it.
//
// THE EVIDENCE IS WRITTEN DOWN, BY HAND, IN tools/money-map.json. Each cell is one of three things:
//   proven  the checks that prove it to the dollar, each by suite file and scenario name, and whether the
//           check computes its expectation independently (ARITHMETIC: from the fixture's own numbers or
//           an identity that must hold whatever the code does) or reads it from the board's own helpers
//           (AGREEMENT: the surface agrees with tiers(), crData() ... -- right only if they are)
//   n/a     the surface does not carry that dimension, and why
//   open    what is missing, roughly what closing it costs, and the group it is reported under
// Any cell may also name `see`: checks that bear on it without proving it (an n/a cell whose reason a
// check holds, for one), validated like the rest.
// Strict on purpose. A check on a TOTAL does not prove the breakdown beneath it; a cross-foot does not
// prove the rows it adds; a figure compared in $M is not compared to the dollar.
//
// IT CANNOT DRIFT. The run fails when: a registered surface has no entry; an entry names a surface no
// registry has (unless it is marked pending); an entry lacks a dimension or a cell lacks what its status
// needs; a cited check's file is gone or its anchor text is no longer in it (a renamed scenario must not
// leave a promise of proof behind it); a check in the catalogue is cited by nothing; a pending surface has
// arrived in the registries and still says pending (someone must confirm it); or, with --check, the
// committed report is not what this data generates.
//
//   node tools/money-map.mjs           validate, print the summary, write tools/money-map.md
//   node tools/money-map.mjs --check   validate, and fail if tools/money-map.md is stale (writes nothing)
//   node tools/money-map.mjs --json    validate, print the summary as JSON (writes nothing)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const DATA_PATH = join(HERE, 'money-map.json');
const MD_PATH = join(HERE, 'money-map.md');
const CHECK = process.argv.includes('--check'), JSON_OUT = process.argv.includes('--json');

// The seven dimensions, in Codex's order. The data file must define exactly these, no more, no fewer.
const DIMS = ['appropriation', 'fiscalYear', 'service', 'requirement', 'month', 'crHalf', 'lane'];
const STATUS = ['proven', 'n/a', 'open'];
const BASIS = ['arithmetic', 'agreement'];
const fails = [];
const fail = m => fails.push(m);

// ---- the registries ----------------------------------------------------------------------------------
// money-coverage.mjs runs on import and exits, so its REGISTRY is read from its source: the object
// literal is sliced out and evaluated on its own (strings and string concatenation only). If that ever
// stops working the keys are still read by pattern, so a surface is never missed for want of a parser.
function coverageRegistry() {
  const src = readFileSync(join(HERE, 'money-coverage.mjs'), 'utf8');
  const at = src.indexOf('const REGISTRY = {');
  if (at < 0) { fail('tools/money-coverage.mjs has no `const REGISTRY = {` — the map cannot find the money surfaces.'); return []; }
  const end = src.indexOf('\n};', at);
  const body = src.slice(at + 'const REGISTRY = '.length, end + 2);
  try {
    const R = new Function('return (' + body + ');')();
    return Object.entries(R).map(([name, v]) => ({ name, money: !!v.money, what: v.what || '', reason: v.reason || '' }));
  } catch (e) {
    console.log(`  (the REGISTRY literal did not evaluate — ${e.message}; reading its keys by pattern instead)`);
    return [...body.matchAll(/^ {2}([A-Za-z0-9_$]+):\s*\{\s*money:\s*(true|false)/gm)]
      .map(m => ({ name: m[1], money: m[2] === 'true', what: '', reason: '' }));
  }
}
// The trace matrix's surfaces: every add('<name>', ...) in trace-lib.mjs, and every name trace-stated.json
// pins. Both are read, so a surface added to either is a row here.
function traceSurfaces() {
  const lib = readFileSync(join(HERE, 'trace-lib.mjs'), 'utf8');
  const names = new Set([...lib.matchAll(/\badd\(\s*(['"`])((?:(?!\1).)+)\1\s*,/g)].map(m => m[2]));
  try {
    const st = JSON.parse(readFileSync(join(HERE, 'trace-stated.json'), 'utf8'));
    Object.values(st).forEach(list => (list || []).forEach(n => names.add(n)));
  } catch (e) { fail('tools/trace-stated.json could not be read: ' + e.message); }
  return [...names];
}

// ---- the data -------------------------------------------------------------------------------------------
let D;
try { D = JSON.parse(readFileSync(DATA_PATH, 'utf8')); }
catch (e) { console.log('MONEY MAP — tools/money-map.json could not be read: ' + e.message); process.exit(1); }
const REASONS = D.reasons || {}, CHECKS = D.checks || {}, SURF = D.surfaces || {};

// the dimensions: exactly the seven, in order, each defined
const dimIds = (D.dimensions || []).map(d => d.id);
if (JSON.stringify(dimIds) !== JSON.stringify(DIMS))
  fail(`money-map.json defines the dimensions [${dimIds.join(', ')}]; the map needs exactly [${DIMS.join(', ')}], in that order.`);
(D.dimensions || []).forEach(d => { if (!d.label || !d.carried || !d.proven) fail(`dimension "${d.id}" needs a label, when it is carried, and what proves it.`); });

// the check catalogue: every file there, every anchor still in it, every basis stated
const fileText = {};
const textOf = f => { if (!(f in fileText)) { const p = join(ROOT, f); fileText[f] = existsSync(p) ? readFileSync(p, 'utf8') : null; } return fileText[f]; };
for (const [id, c] of Object.entries(CHECKS)) {
  if (c.pending) { if (!c.scenario || !c.asserts) fail(`pending check "${id}" needs a scenario and what it asserts.`); continue; }
  if (!c.file || !c.scenario || !c.anchor || !c.asserts) { fail(`check "${id}" needs file, scenario, anchor and asserts.`); continue; }
  if (!BASIS.includes(c.basis)) fail(`check "${id}" has basis "${c.basis}"; it must be one of ${BASIS.join(' / ')}.`);
  const t = textOf(c.file);
  if (t === null) fail(`check "${id}" cites ${c.file}, which does not exist.`);
  else if (!t.includes(c.anchor)) fail(`check "${id}" cites "${c.anchor}" in ${c.file}, which is no longer there — `
    + 'a renamed or removed check must not leave a promise of proof behind it. Point the map at what proves the cell now, or open the cell.');
}

// ---- rows: every registered surface, bound to its entry ------------------------------------------------
const COV = coverageRegistry(), TRACE = traceSurfaces();
const covNames = new Set(COV.map(c => c.name));
const pendingEntries = Object.entries(SURF).filter(([, e]) => e.pending);
const rows = [], bound = new Set(), arrived = [];
const bindPending = (registry, name) => {
  for (const [k, e] of pendingEntries) {
    if (k === name) return k;
    const re = (e.binds || {})[registry];
    if (re && new RegExp(re, 'i').test(name)) return k;
  }
  return null;
};
for (const c of COV) {
  let key = SURF[c.name] && !SURF[c.name].pending ? c.name : null, via = '';
  if (!key) { const p = bindPending('money-coverage', c.name); if (p) { key = p; via = 'pending'; arrived.push([p, 'money-coverage', c.name]); } }
  if (!key) { fail(`"${c.name}" is in the money-coverage REGISTRY but not in the map — add it to tools/money-map.json, every dimension.`); continue; }
  const e = SURF[key];
  if (!via && e.registry !== 'money-coverage') fail(`"${c.name}" is a money-coverage surface; its entry says registry "${e.registry}".`);
  if (!via && (e.money !== false) !== c.money) fail(`the REGISTRY says "${c.name}" ${c.money ? 'emits money' : 'carries no money'}; the map says the opposite — map it again.`);
  bound.add(key); rows.push({ key, name: c.name, registry: 'money-coverage', e, money: c.money, regWhat: c.what || c.reason, via });
}
for (const t of TRACE) {
  let key = SURF[t] && !SURF[t].pending ? t : null, via = '';
  if (!key) { const p = bindPending('trace', t); if (p) { key = p; via = 'pending'; arrived.push([p, 'trace', t]); } }
  if (!key) { fail(`"${t}" is a trace-matrix surface but not in the map — add it to tools/money-map.json, every dimension.`); continue; }
  const e = SURF[key];
  if (!via && e.registry !== 'trace') fail(`"${t}" is a trace-matrix surface; its entry says registry "${e.registry}".`);
  if (!via && !covNames.has(e.parent)) fail(`trace surface "${t}" names parent "${e.parent}", which is not in the money-coverage REGISTRY.`);
  bound.add(key); rows.push({ key, name: t, registry: 'trace', e, via });
}
for (const [k, e] of Object.entries(SURF)) {
  if (bound.has(k)) continue;
  if (e.pending) { rows.push({ key: k, name: k, registry: 'pending', e, via: 'not yet registered' }); continue; }
  fail(`"${k}" is in the map but in no registry — a surface that was renamed or removed must leave the map too (or be marked pending).`);
}
// A PENDING SURFACE THAT HAS ARRIVED MUST BE CONFIRMED, never carried as pending: its checks were written in
// another branch, and the only way to know they prove what the map says is to read them and cite them.
for (const [k, reg, name] of arrived)
  fail(`"${k}" was pending (${SURF[k].pending.by}) and is now registered as "${name}" (${reg}). Confirm it: give "${name}" an entry of its own `
    + `(registry "${reg}"${reg === 'trace' ? ', with its money-coverage parent' : ''}), cite the real checks (file, scenario, anchor) in place of the pending `
    + `ones, set each cell's status from what they prove, and when every registered name has its entry, delete the pending one.`);

// ---- cells ----------------------------------------------------------------------------------------------
const used = new Set();
const why = w => (typeof w === 'string' && w.startsWith('@')) ? (REASONS[w.slice(1)] || null) : w;
for (const r of rows) {
  const e = r.e, cells = e.cells || {};
  const extra = Object.keys(cells).filter(d => !DIMS.includes(d));
  if (extra.length) fail(`"${r.key}" has cells for [${extra.join(', ')}], which are not dimensions of the map.`);
  if (!e.what) fail(`"${r.key}" needs a line saying what the surface is.`);
  for (const d of DIMS) {
    const c = cells[d];
    if (!c) { fail(`"${r.key}" is missing the "${d}" dimension — every surface states all seven.`); continue; }
    if (!STATUS.includes(c.status)) { fail(`"${r.key}" · ${d}: status "${c.status}" must be one of ${STATUS.join(' / ')}.`); continue; }
    (c.checks || []).concat(c.partial || [], c.see || []).forEach(id => {
      used.add(id);
      if (!CHECKS[id]) fail(`"${r.key}" · ${d} cites check "${id}", which is not in the catalogue.`);
      else if (CHECKS[id].pending && !e.pending) fail(`"${r.key}" · ${d} cites the pending check "${id}"; only a pending surface may.`);
    });
    if (c.status === 'proven' && !(c.checks || []).length) fail(`"${r.key}" · ${d} is proven by nothing — name the checks.`);
    if (c.status !== 'proven' && (c.checks || []).length) fail(`"${r.key}" · ${d} is ${c.status} but names proving checks — use partial (open) or see (n/a).`);
    if (c.status === 'n/a' && !why(c.why)) fail(`"${r.key}" · ${d} is n/a without a reason${typeof c.why === 'string' && c.why.startsWith('@') ? ' (no reason ' + c.why + ')' : ''}.`);
    if (c.status === 'open' && (!c.why || !c.effort || !c.group)) fail(`"${r.key}" · ${d} is open: say what is missing (why), what closing it takes (effort) and its group.`);
    if (r.registry === 'money-coverage' && r.money === false && c.status !== 'n/a')
      fail(`"${r.key}" carries no money (the REGISTRY says so) but its ${d} cell is ${c.status}.`);
  }
}
for (const id of Object.keys(CHECKS)) if (!used.has(id)) fail(`check "${id}" is in the catalogue but no cell cites it — strike it, or cite it where it proves something.`);
// the data file must reach the repository: .gitignore refuses *.json unless excepted, and a map that is
// never committed is a promise nobody can read
try {
  execFileSync('git', ['check-ignore', '-q', 'tools/money-map.json'], { cwd: ROOT, stdio: 'ignore' });
  fail('tools/money-map.json is git-ignored — add `!tools/money-map.json` to .gitignore, or the map is never committed.');
} catch (e) { if (e.status !== 1 && e.status !== 128) fail('could not ask git whether tools/money-map.json is ignored: ' + e.message); }

// ---- the tally -------------------------------------------------------------------------------------------
const basisOf = c => {
  const b = new Set((c.checks || []).map(id => (CHECKS[id] || {}).pending ? 'pending' : (CHECKS[id] || {}).basis));
  if (b.has('pending')) return 'pending';
  return b.size === 1 ? [...b][0] : 'both';
};
const tally = rs => {
  const t = { surfaces: rs.length, cells: 0, proven: 0, arithmetic: 0, agreement: 0, both: 0, display: 0, pending: 0, na: 0, open: 0 };
  rs.forEach(r => DIMS.forEach(d => { const c = (r.e.cells || {})[d]; if (!c) return; t.cells++;
    if (c.status === 'n/a') t.na++; else if (c.status === 'open') t.open++;
    else { t.proven++; const b = basisOf(c); t[b]++; if (c.precision) t.display++; } }));
  return t;
};
const T = { all: tally(rows), coverage: tally(rows.filter(r => r.registry === 'money-coverage')),
  trace: tally(rows.filter(r => r.registry === 'trace')), pending: tally(rows.filter(r => r.registry === 'pending')) };
const line = (lbl, t) => `${lbl.padEnd(30)} ${String(t.surfaces).padStart(3)} surfaces  ${String(t.cells).padStart(4)} cells   `
  + `proven ${String(t.proven).padStart(3)} (arithmetic ${t.arithmetic}, agreement ${t.agreement}, both ${t.both}${t.pending ? ', pending ' + t.pending : ''}`
  + `${t.display ? '; ' + t.display + ' at display precision' : ''})   n/a ${String(t.na).padStart(3)}   OPEN ${t.open}`;

// ---- the report -------------------------------------------------------------------------------------------
const esc = s => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const short = c => c.status === 'n/a' ? 'n/a' : c.status === 'open' ? '**OPEN**'
  : ({ arithmetic: 'proven·A', agreement: 'proven·G', both: 'proven·AG', pending: 'pending' })[basisOf(c)] + (c.precision ? '·d' : '');
const dimLbl = Object.fromEntries((D.dimensions || []).map(d => [d.id, d.label]));
const cite = id => { const c = CHECKS[id]; if (!c) return id;
  return c.pending ? `*${c.scenario}* (${c.pending}, pending merge)` : `\`${c.file.replace(/^tools\//, '')}\` › *${c.scenario}* [${c.basis}]`; };
const md = [];
md.push('# ORBIT money reconciliation map', '');
md.push('> Generated by `tools/money-map.mjs` from `tools/money-map.json`. Do not edit by hand: change the JSON and run `npm run money-map`.', '');
md.push(D.about || '', '');
md.push('## The count', '');
md.push('| | surfaces | cells | proven | of which arithmetic / agreement / both | n/a | **open** |', '|---|---:|---:|---:|---|---:|---:|');
const trow = (l, t) => `| ${l} | ${t.surfaces} | ${t.cells} | ${t.proven}${t.pending ? ` (${t.pending} pending merge)` : ''} | ${t.arithmetic} / ${t.agreement} / ${t.both}${t.display ? ` — ${t.display} at display precision` : ''} | ${t.na} | **${t.open}** |`;
md.push(trow('**every registered surface**', T.all), trow('money-coverage registry', T.coverage), trow('trace-matrix surfaces', T.trace));
if (T.pending.surfaces) md.push(trow('pending another branch', T.pending));
md.push('', 'The two registries overlap (a trace surface is a sheet, slide or view of a money-coverage surface), so a figure can be counted under both; each row is mapped on its own evidence.', '');
md.push('## How to read it', '');
md.push('| status | means |', '|---|---|');
md.push('| `proven·A` | proven to the dollar by checks that compute what they expect independently — from the fixture\'s own numbers, or an identity that must hold whatever the code does (**arithmetic**) |');
md.push('| `proven·G` | proven to the dollar by checks that read what they expect from the board\'s own helpers (tiers(), crData(), forecast() …): the surface **agrees** with the board, which is right only if the helper is |');
md.push('| `proven·AG` | both kinds of check |');
md.push('| `·d` | proven at the surface\'s own display precision (the deck: fSM), not to the dollar |');
md.push('| `n/a` | the surface does not carry that dimension (the reason is given) |');
md.push('| **OPEN** | not proven: what is missing, what closing it takes, listed below for Brad to build or defer |');
md.push('', '| dimension | carried when | proven when |', '|---|---|---|');
(D.dimensions || []).forEach(d => md.push(`| **${esc(d.label)}** | ${esc(d.carried)} | ${esc(d.proven)} |`));
md.push('', '## The map', '');
md.push('| surface | registry | ' + DIMS.map(d => dimLbl[d]).join(' | ') + ' |', '|---|---|' + DIMS.map(() => '---').join('|') + '|');
rows.forEach(r => md.push(`| \`${esc(r.name)}\` | ${r.registry === 'trace' ? 'trace › `' + esc(r.e.parent) + '`' : r.registry} | ` + DIMS.map(d => short((r.e.cells || {})[d] || { status: '?' })).join(' | ') + ' |'));
// THE OPEN CELLS, grouped
const open = [];
rows.forEach(r => DIMS.forEach(d => { const c = (r.e.cells || {})[d]; if (c && c.status === 'open') open.push({ r, d, c }); }));
const groups = {}; open.forEach(o => (groups[o.c.group] ||= []).push(o));
md.push('', `## What remains open — ${open.length} cell(s), for Brad to build or explicitly defer`, '');
Object.keys(groups).sort().forEach(g => {
  md.push(`### ${g}`, '');
  groups[g].forEach(({ r, d, c }) => {
    md.push(`- **\`${r.name}\` × ${dimLbl[d]}** — ${c.why}`);
    md.push(`  - *To close:* ${c.effort}`);
    if ((c.partial || []).length) md.push(`  - *Holds already:* ${c.partial.map(cite).join('; ')}`);
  });
  md.push('');
});
if ((D.findings || []).length) {
  md.push('## Found while mapping', '');
  D.findings.forEach(f => { md.push(`### ${f.id}. ${f.title}`, '', f.detail, '', `*Observed:* ${f.observed}`, '', `*Cells it keeps open or qualifies:* ${f.cells}`, ''); });
}
md.push('## Every cell, with its evidence', '');
rows.forEach(r => {
  md.push(`### \`${r.name}\``, '', `${r.registry === 'trace' ? 'Trace-matrix surface of `' + r.e.parent + '`. ' : r.registry === 'pending' ? '**Pending — ' + esc(r.e.pending.by) + '.** ' : 'Money-coverage surface. '}${r.e.what}`, '');
  if (r.e.pending) md.push(`> ${r.e.pending.note}`, '');
  DIMS.forEach(d => {
    const c = (r.e.cells || {})[d]; if (!c) return;
    if (c.status === 'proven') md.push(`- **${dimLbl[d]}** — ${short(c)}: ${(c.checks || []).map(cite).join('; ')}${c.precision ? ` — *precision:* ${c.precision}` : ''}${c.note ? ' — ' + c.note : ''}${(c.see || []).length ? ' *Also bearing on it (totals or identities, not proof of the breakdown):* ' + c.see.map(cite).join('; ') : ''}`);
    else if (c.status === 'n/a') md.push(`- **${dimLbl[d]}** — n/a: ${why(c.why)}${(c.see || []).length ? ' *See:* ' + c.see.map(cite).join('; ') : ''}`);
    else md.push(`- **${dimLbl[d]}** — **OPEN** (${c.group}): ${c.why}`);
  });
  md.push('');
});
if ((D.unregistered || []).length) {
  md.push('## Money on screen that neither registry lists', '', D.unregisteredNote || '', '');
  D.unregistered.forEach(u => md.push(`- \`${u.name}\` — ${u.what}${u.held ? ' *Held by:* ' + u.held : ''}`));
  md.push('');
}
md.push('## Checks cited', '');
md.push('| id | file › scenario | basis | what it asserts |', '|---|---|---|---|');
Object.entries(CHECKS).forEach(([id, c]) => md.push(`| \`${id}\` | ${c.pending ? '*' + esc(c.scenario) + '* (' + esc(c.pending) + ')' : '`' + c.file + '` › *' + esc(c.scenario) + '*'} | ${c.pending ? 'pending' : c.basis} | ${esc(c.asserts)} |`));
md.push('');
const MD = md.join('\n');

// ---- output ------------------------------------------------------------------------------------------
if (JSON_OUT) {
  console.log(JSON.stringify({ ok: !fails.length, fails, tally: T,
    open: open.map(o => ({ surface: o.r.name, dimension: o.d, group: o.c.group, effort: o.c.effort })) }, null, 2));
  process.exit(fails.length ? 1 : 0);
}
console.log('MONEY MAP — every registered money surface against appropriation, fiscal year, service, requirement, month, CR half and lane');
console.log('='.repeat(110));
console.log(line('every registered surface', T.all));
console.log(line('  money-coverage registry', T.coverage));
console.log(line('  trace-matrix surfaces', T.trace));
if (T.pending.surfaces) console.log(line('  pending another branch', T.pending));
console.log('');
Object.keys(groups).sort().forEach(g => console.log(`  OPEN  ${String(groups[g].length).padStart(2)}  ${g}: ` + groups[g].map(o => `${o.r.name} × ${dimLbl[o.d]}`).join(', ')));
if (CHECK) {
  const have = existsSync(MD_PATH) ? readFileSync(MD_PATH, 'utf8') : null;
  if (have !== MD) fail('tools/money-map.md is not what tools/money-map.json generates — run `npm run money-map` and commit the report with the data.');
} else if (!fails.length) writeFileSync(MD_PATH, MD);
console.log('\n' + '='.repeat(110));
if (!fails.length) {
  console.log(`money map holds — ${T.all.cells} cells: ${T.all.proven} proven, ${T.all.na} n/a, ${T.all.open} open`
    + (CHECK ? '; the report is current' : '; tools/money-map.md written'));
  process.exit(0);
}
console.log(`${fails.length} MONEY MAP FAILURE(S)\n`);
fails.forEach(f => console.log('  - ' + f + '\n'));
process.exit(1);
