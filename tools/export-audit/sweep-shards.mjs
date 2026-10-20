// A SHARDED MUTATION SWEEP (20 Oct 2026). The same question mutate.mjs asks -- does any check fail on
// this mutated board? -- answered with the two long suites cut into pieces, so that no process lives
// long enough to run out of memory and a mutant pays for the piece that catches it, not the whole suite.
//
//   node tools/export-audit/sweep-shards.mjs --ids FILE [--extra FILE] [--board FILE] [--out DIR]
//        [--jobs N] [--budget MB] [--pack SECONDS] [--calibrate-only] [--recalibrate]
//
// WHY. mutate.mjs runs whole suites, one after another, until one prints its failing-check banner, each
// capped at 2.5 GB of heap. audit-recon (~14 min) and audit-import (~16 min) run dozens of scenario blocks
// in one process and their memory accumulates block over block; most of the v2.00/v2.01 targets are
// guarded by blocks near their ends, so a mutant paid for the whole file before reaching its check, and
// 6 of a 19-target pilot died out of heap under the cap -- CRASHED, no verdict. Here each block (or a few
// consecutive blocks) is its own process.
//
// HOW A SUITE IS CUT. Both suites are a prelude, then top-level blocks -- `await (async () => {` ...
// `})();`, and in recon's first part bare `{` ... `}` -- with helper code between them, and a closing
// self-check that fails every `const name = '...'` in the FILE it never heard. A shard is the suite's
// text with every block it does not keep REMOVED (not disabled: a disabled block's names would still be
// in the file and the self-check would fail every shard on a clean board). Everything outside the blocks
// -- the prelude, the helpers between them, the self-check and the summary -- is kept in every shard.
// A block that reads a top-level `let` it does not write (audit-import's V185W, V186L, V14, W2FX ...)
// takes the earlier blocks that write it along with it.
//
// CALIBRATION IS THE SAFETY NET. Every shard is run on the CLEAN board first. A shard that fails there
// would fail on every mutant and read every mutant as caught, so it is never used: a block that does not
// pass alone is merged with the one before it until the merge passes, and a suite that cannot be cut
// cleanly runs whole. Then passing blocks are packed into shards of about --pack seconds (each pack is
// run on the clean board too; a pack that fails is split back into its pieces). Wall time and peak RSS
// are recorded per shard in <out>/calibration.json and reused while the board and every file in this
// folder hash the same.
//
// THE VERDICT IS mutate.mjs's. Caught = a shard exits 1 AND prints a failing-check banner ("FAILING
// CHECK", recon's "did not build", legacy-fsrc's own sentence). An exit without one is a death: retried
// once with twice the heap; dead again is CRASHED -- unless another shard catches the mutant, which is a
// catch like any other (mutate.mjs stops at the crash; trying the rest can only turn a CRASHED into a
// verdict). Nothing catches: SURVIVED, or equivalent for a mutation that declares itself so. A find that
// does not occur exactly once is NOT APPLIED. ORDER is a cost decision only: shards that name the
// mutation's area or the rarer words of its id first, then the rest by calibrated time. Every shard is
// tried before a mutant is called SURVIVED, so the order cannot change a verdict.
//
// It never imports or runs mutate.mjs (loading it starts the old sweep): mut-json.py reads the list as text.
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const PLAN_VERSION = 3;   // (heaps tried per piece are part of the runs' ids, not the key)       // bump when the cutting rules change, so an old calibration is not reused

// ---------------------------------------------------------------- arguments
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const flag = k => argv.includes(k);
const BOARD = resolve(arg('--board', join(ROOT, 'prioritization-board-grid.html')));
const OUT = resolve(arg('--out', join(ROOT, '.math-reports', 'sweep-shards')));
const JOBS = Math.max(1, Number(arg('--jobs', cpus().length)) || 1);
const BUDGET = Math.max(2560, Number(arg('--budget', 12000)) || 12000);   // MB of heap across running shards
const PACK = Math.max(0, Number(arg('--pack', 90)));                      // target seconds per packed shard
const IDS = arg('--ids', null), EXTRA = arg('--extra', null);
const CAL_ONLY = flag('--calibrate-only'), RECAL = flag('--recalibrate'), PLAN_ONLY = flag('--plan-only');
mkdirSync(OUT, { recursive: true });

// The suites, in mutate.mjs's order. `split` = cut into blocks. legacy-fsrc is not in mutate.mjs's list;
// it runs whole here, and its failure sentence is its banner (it prints no "FAILING CHECK").
const SUITES = [
  ['excel', 'audit.mjs'], ['ppt', 'audit-ppt.mjs'], ['other', 'audit-other.mjs'], ['board', 'audit-board.mjs'],
  ['recon', 'audit-recon.mjs', 'split'], ['import', 'audit-import.mjs', 'split'],
  ['hostile', 'audit-hostile.mjs'], ['inject', 'audit-inject.mjs'], ['ui', 'audit-ui.mjs'],
  ['legacy', 'legacy-fsrc.mjs'],
];
const BANNER = /FAILING CHECK|did not build|legacy mode\(s\) changed behaviour/;

// ---------------------------------------------------------------- the mutations
// An id asked for that the list does not hold fails the run before anything is built.
function loadMutations() {
  const r = spawnSync('python3', ['-I', join(HERE, 'mut-json.py'), join(HERE, 'mutate.mjs')], { maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error('mut-json.py failed: ' + String(r.stderr).slice(0, 400));
  const all = JSON.parse(String(r.stdout));
  const byId = new Map(all.map(m => [m.id, m]));
  const want = IDS ? readFileSync(IDS, 'utf8').split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#')) : [];
  const missing = want.filter(id => !byId.has(id));
  if (missing.length) { console.error('not in mutate.mjs: ' + missing.join(', ')); process.exit(2); }
  const picked = want.map(id => byId.get(id));
  const bad = picked.filter(m => m.unreadable);
  if (bad.length) { console.error('mut-json.py could not read find/repl of: ' + bad.map(m => m.id).join(', ')); process.exit(2); }
  // --extra: mutations that are not in mutate.mjs (the controls), as a JSON list of {id, find, repl, ...}
  if (EXTRA) for (const m of JSON.parse(readFileSync(EXTRA, 'utf8'))) {
    if (byId.has(m.id) || picked.some(p => p.id === m.id)) { console.error('extra id already used: ' + m.id); process.exit(2); }
    picked.push({ area: '', what: '', equivalent: false, ...m });
  }
  return picked;
}

// ---------------------------------------------------------------- cutting a suite
function blocksOf(text) {
  const L = text.split('\n');
  const blocks = [];
  for (let i = 0; i < L.length; i++) {
    let endRe = null;
    if (L[i].startsWith('await (async () => {')) endRe = /^\}\)\(\);/;
    else if (/^\{\s*(\/\/.*)?$/.test(L[i])) endRe = /^\}\s*(\/\/.*)?$/;
    if (!endRe) continue;
    let j = i + 1; while (j < L.length && !endRe.test(L[j])) j++;
    if (j >= L.length) throw new Error('unclosed block at line ' + (i + 1));
    const body = L.slice(i, j + 1).join('\n');
    blocks.push({ s: i, e: j, body, self: body.includes('this scenario never ran'),
      names: [...body.matchAll(/^  const name = '([^']+)'/gm)].map(m => m[1]) });
    i = j;
  }
  const inBlock = new Int32Array(L.length).fill(-1);
  blocks.forEach((b, k) => { for (let i = b.s; i <= b.e; i++) inBlock[i] = k; });
  // top-level `let`s outside every block: what a block may hand to a later one
  const lets = [];
  L.forEach((l, i) => { const m = inBlock[i] < 0 && /^let\s+([A-Za-z_$][\w$]*)/.exec(l); if (m && m[1] !== 'failures') lets.push(m[1]); });
  for (const b of blocks) {
    b.writes = lets.filter(v => new RegExp('\\b' + v.replace(/\$/g, '\\$') + '\\s*=(?![=>])').test(b.body));
    b.reads = lets.filter(v => !b.writes.includes(v) && new RegExp('\\b' + v.replace(/\$/g, '\\$') + '\\b').test(b.body));
  }
  return { L, blocks, inBlock };
}
// a block's own index plus every earlier block that writes what it reads, recursively
function closure(cut, keep) {
  const out = new Set(keep), todo = [...keep];
  while (todo.length) {
    const k = todo.pop();
    for (const v of cut.blocks[k].reads) cut.blocks.forEach((b, j) => {
      if (j < k && b.writes.includes(v) && !out.has(j)) { out.add(j); todo.push(j); } });
  }
  return [...out].sort((a, b) => a - b);
}
function shardText(cut, keep) {
  const K = new Set(closure(cut, keep));
  cut.blocks.forEach((b, k) => { if (b.self) K.add(k); });
  const head = '// GENERATED by sweep-shards.mjs from this suite: blocks ' + [...K].join(',') + ' kept. Deleted at exit.\n';
  return head + cut.L.filter((_, i) => cut.inBlock[i] < 0 || K.has(cut.inBlock[i])).join('\n');
}

// ---------------------------------------------------------------- running one shard
const RSS_HOOK = join(OUT, '_rss-hook.mjs');
writeFileSync(RSS_HOOK, "import { writeSync } from 'node:fs';\n"
  + "process.on('exit', () => { try { writeSync(2, '\\n@@MAXRSS_KB=' + process.resourceUsage().maxRSS + '\\n'); } catch {} });\n");
const WRITTEN = new Set();
function cleanup() { for (const f of WRITTEN) try { unlinkSync(f); } catch {} WRITTEN.clear(); }
process.on('exit', cleanup);
for (const s of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(s, () => { cleanup(); process.exit(130); });

// the heap budget: a shard waits until its heap fits beside the ones running
let heapInUse = 0; const waiters = [];
const acquire = mb => new Promise(r => { const w = { mb: Math.min(mb, BUDGET), r }; waiters.push(w); pump(); });
const release = mb => { heapInUse -= Math.min(mb, BUDGET); pump(); };
function pump() { for (let i = 0; i < waiters.length; i++) { const w = waiters[i];
  if (heapInUse + w.mb <= BUDGET || heapInUse === 0) { heapInUse += w.mb; waiters.splice(i--, 1); w.r(); } } }

function runShard(file, board, heapMB, timeoutMs) {
  return new Promise(done => {
    const t0 = Date.now();
    const env = { ...process.env, BOARD: board, MUT_FIRST_FAIL: '1',
      NODE_OPTIONS: ((process.env.NODE_OPTIONS || '').replace(/--max-old-space-size=\d+/g, '') + ' --max-old-space-size=' + heapMB).trim() };
    const ch = spawn(process.execPath, ['--import', pathToFileURL(RSS_HOOK).href, file], { env, cwd: ROOT });
    let out = '', err = '', banner = false, timedOut = false;
    const keep = (s, d) => (s + d).slice(-200000);
    ch.stdout.on('data', d => { out = keep(out, d); if (!banner && BANNER.test(out.slice(-4000))) banner = true; });
    ch.stderr.on('data', d => { err = keep(err, d); });
    const timer = setTimeout(() => { timedOut = true; ch.kill('SIGKILL'); }, timeoutMs);
    ch.on('close', (code, sig) => {
      clearTimeout(timer);
      const rss = /@@MAXRSS_KB=(\d+)/.exec(err);
      const lines = (err.replace(/@@MAXRSS_KB=\d+/, '') || out).split('\n').map(s => s.trim()).filter(Boolean);
      const msg = lines.find(l => /Error|error:|heap/.test(l)) || '';
      const tail = [msg].concat(lines.slice(-2).filter(l => l !== msg)).filter(Boolean).join(' | ').slice(0, 240);
      done({ code, sig, ms: Date.now() - t0, rssMB: rss ? Math.round(Number(rss[1]) / 1024) : null,
        pass: code === 0, caught: code === 1 && banner, death: !(code === 0 || (code === 1 && banner)),
        why: timedOut ? 'timed out after ' + Math.round(timeoutMs / 1000) + 's' : (tail || 'exit ' + (code ?? sig)) });
    });
  });
}
const heapOf = sh => Math.max(sh.heap || 2560, Math.ceil(1.5 * (sh.rssMB || 0)));
const timeoutOf = sh => Math.max(15 * 60e3, 6 * (sh.ms || 0));

async function pool(items, n, fn) {
  let next = 0; const res = new Array(items.length);
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (next < items.length) { const k = next++; res[k] = await fn(items[k], k); } }));
  return res;
}

// ---------------------------------------------------------------- calibration
const sha = s => createHash('sha256').update(s).digest('hex');
function calKey() {
  const h = createHash('sha256').update('v' + PLAN_VERSION + '|pack' + PACK + '|').update(readFileSync(BOARD));
  for (const f of readdirSync(HERE).filter(f => /\.(mjs|py)$/.test(f) && !f.startsWith('_shard-') && f !== 'sweep-shards.mjs').sort())
    h.update(f).update(readFileSync(join(HERE, f)));
  return h.digest('hex');
}
// a shard as stored: {suite, file, blocks|null (whole), ms, rssMB}; its text is rebuilt from the suite
const CUTS = {};
for (const [name, f, mode] of SUITES) if (mode === 'split') CUTS[name] = blocksOf(readFileSync(join(HERE, f), 'utf8'));
let shardSeq = 0;
function materialise(sh) {
  if (!sh.blocks) { sh.file = join(HERE, SUITES.find(s => s[0] === sh.suite)[1]); return sh; }
  const file = join(HERE, `_shard-${sh.suite}-${String(++shardSeq).padStart(3, '0')}.mjs`);
  writeFileSync(file, shardText(CUTS[sh.suite], sh.blocks)); WRITTEN.add(file); sh.file = file;
  sh.text = sh.blocks.map(k => CUTS[sh.suite].blocks[k].body).join('\n');
  return sh;
}

async function calibrate() {
  const calFile = join(OUT, 'calibration.json'), key = calKey();
  if (!RECAL && existsSync(calFile)) {
    const c = JSON.parse(readFileSync(calFile, 'utf8'));
    if (c.key === key) { console.log(`calibration reused (${c.shards.length} shards, ${c.at})`); return c; }
    console.log('calibration is stale (board or suites changed): calibrating again');
  }
  const t0 = Date.now(), log = [], merges = [];
  // Every clean run is kept as it finishes (cal-runs.jsonl, under this key), so a calibration cut off by a
  // restart or a time limit picks up where it stopped instead of starting again.
  const RUNS = join(OUT, 'cal-runs.jsonl'), seen = new Map();
  if (existsSync(RUNS)) for (const l of readFileSync(RUNS, 'utf8').split('\n').filter(Boolean)) {
    try { const r = JSON.parse(l); if (r.key === key) seen.set(r.id, r.res); } catch {} }
  let nDone = 0;
  // A piece that DIES on the clean board (no banner -- in practice out of heap: recon's block 80 and import's
  // 105 and 107 cannot run in 2.5 GB even alone, which is what the 20 Oct pilot's six CRASHED were) is not a
  // failing piece: it is run again with twice the heap, up to HEAPS' last, and the heap it passed with is the
  // heap it is given in the sweep. Only a piece that fails a CHECK on the clean board is merged.
  const HEAPS = [2560, 5120, 8192];
  const clean = async (shs, what) => {
    const res = await pool(shs, JOBS, async sh => {
      const id = sh.suite + ':' + (sh.blocks ? sh.blocks.join(',') : 'whole');
      let r = null;
      for (const h of HEAPS) {
        const hid = id + '@' + h;
        if (seen.has(hid)) r = seen.get(hid);
        else if (h === 2560 && seen.has(id)) r = seen.get(id);          // a run recorded before heaps were tried
        else {
          materialise(sh); await acquire(h);
          try { r = await runShard(sh.file, BOARD, h, 40 * 60e3); }
          finally { release(h); if (sh.blocks) { try { unlinkSync(sh.file); } catch {} WRITTEN.delete(sh.file); } }
          appendFileSync(RUNS, JSON.stringify({ key, id: hid, res: r }) + '\n'); seen.set(hid, r);
          console.log(`  [${++nDone}] ${what} ${id} @${h}MB ${r.pass ? 'pass' : (r.death ? 'DIED ' : 'FAIL ') + r.why} ${(r.ms / 1000).toFixed(1)}s ${r.rssMB}MB`);
        }
        r = { ...r, heap: h };
        if (!r.death) break;
      }
      return r; });
    shs.forEach((sh, k) => { Object.assign(sh, { ms: res[k].ms, rssMB: res[k].rssMB, heap: res[k].heap, ok: res[k].pass,
        died: res[k].death, why: res[k].pass ? '' : res[k].why });
      log.push(`${what} ${sh.suite} ${sh.blocks ? '[' + sh.blocks.join(',') + ']' : 'whole'} @${res[k].heap}MB ${res[k].pass ? 'pass' : 'FAIL ' + res[k].why} ${(res[k].ms / 1000).toFixed(1)}s ${res[k].rssMB}MB`); });
    return shs;
  };
  // 1. every block of every split suite alone (with what it reads), every other suite whole
  const units = [];
  for (const [name, , mode] of SUITES) {
    if (mode !== 'split') { units.push({ suite: name, blocks: null }); continue; }
    CUTS[name].blocks.forEach((b, k) => { if (!b.self) units.push({ suite: name, blocks: [k] }); });
  }
  console.log(`calibrating ${units.length} pieces on the clean board, ${JOBS} at a time`);
  await clean(units, 'unit');
  const whole = units.filter(u => !u.blocks && !u.ok);
  if (whole.length) throw new Error('a suite fails on the clean board, so it cannot judge anything: '
    + whole.map(u => u.suite + ' (' + u.why + ')').join('; '));
  // 2. a piece that fails alone is merged with the one before it until the merge passes
  const final = [];
  for (const [name, f, mode] of SUITES) {
    if (mode !== 'split') { final.push(units.find(u => u.suite === name)); continue; }
    const groups = units.filter(u => u.suite === name);
    for (let k = 0; k < groups.length; k++) {
      let g = groups[k];
      while (!g.ok) {
        const prev = k > 0 ? groups[k - 1] : null;
        // a piece that dies at the largest heap, or a merge grown past MERGE_MAX blocks, is not going to pass by
        // taking on more: the suite runs whole (the merge walk once cost 20 runs and 90 minutes before this)
        if (g.died || g.blocks.length > 6) {
          merges.push(`${name}: [${g.blocks.join(',')}] ${g.died ? 'dies at ' + g.heap + ' MB' : 'still fails merged'} (${g.why}); the suite runs whole`);
          g = null; break; }
        if (!prev) { // nothing before it to lean on: the suite runs whole
          merges.push(`${name}: block ${g.blocks.join(',')} fails even with everything before it; the suite runs whole`);
          g = null; break; }
        const m = { suite: name, blocks: [...new Set([...prev.blocks, ...g.blocks])].sort((a, b) => a - b) };
        merges.push(`${name}: [${g.blocks.join(',')}] failed alone (${g.why}); merged with [${prev.blocks.join(',')}]`);
        await clean([m], 'merge');
        groups.splice(k - 1, 2, m); k--; g = m;
      }
      if (g === null) { groups.length = 0; break; }
    }
    if (!groups.length) { const w = { suite: name, blocks: null }; await clean([w], 'whole');
      if (!w.ok) throw new Error(name + ' fails whole on the clean board: ' + w.why); final.push(w); continue; }
    // 3. pack consecutive pieces into shards of about PACK seconds, and prove each pack on the clean board
    const packs = []; let cur = null;
    for (const g of groups) {
      if (cur && cur.est + g.ms / 1000 <= PACK) { cur.parts.push(g); cur.est += g.ms / 1000; }
      else { cur = { parts: [g], est: g.ms / 1000 }; packs.push(cur); }
    }
    const multi = packs.filter(p => p.parts.length > 1).map(p => ({ suite: name, blocks: [...new Set(p.parts.flatMap(x => x.blocks))].sort((a, b) => a - b), parts: p.parts }));
    if (multi.length) await clean(multi, 'pack');
    for (const p of packs) {
      if (p.parts.length === 1) { final.push(p.parts[0]); continue; }
      const m = multi.find(x => x.parts === p.parts);
      if (m.ok) final.push(m);
      else { merges.push(`${name}: pack [${m.blocks.join(',')}] failed (${m.why}); its pieces run alone`); final.push(...p.parts); }
    }
  }
  const shards = final.map(s => ({ suite: s.suite, blocks: s.blocks, ms: s.ms, rssMB: s.rssMB, heap: s.heap }));
  const cal = { key, at: new Date().toISOString(), board: BOARD, pack: PACK, minutes: +((Date.now() - t0) / 60e3).toFixed(1), shards, merges, log };
  writeFileSync(calFile, JSON.stringify(cal, null, 1));
  return cal;
}

// ---------------------------------------------------------------- ordering
// Cost only, never the verdict. Strongest first: a v200-* mutation tries audit-inject (14 s) first, as
// mutate.mjs's FIRST_BY_PREFIX does; then shards that carry the id's workstream tag (u44, r5, d41 -- the
// scenario names say "(U44)", and that tag found the catcher in the 20 Oct pilot where words did not); then
// shards naming the mutation's area; then the rarer words of its id; then everything else by calibrated time.
const FIRST_BY_PREFIX = [['v200-', 'inject']];
const STOP = new Set(['only', 'plain', 'raw', 'open', 'html', 'unread', 'unsaid', 'first', 'kept', 'unkept', 'silent']);
function orderFor(m, shards) {
  const area = ((m.area || '').match(/[A-Za-z_$][\w$]*/) || [''])[0];
  const toks = m.id.split(/[-_]/);
  const tags = toks.filter(w => /^[a-uw-z]\d+$/.test(w)).map(w => new RegExp('\\b' + w + '\\b', 'i'));
  const words = toks.filter(w => w.length >= 4 && !/^[a-z]?\d+$/.test(w) && !STOP.has(w));
  const first = (FIRST_BY_PREFIX.find(p => m.id.startsWith(p[0])) || [])[1];
  const df = w => shards.filter(s => s.lc.includes(w)).length || 1;
  const score = s => (s.suite === first && !s.blocks ? 1000 : 0)
    + (tags.some(t => t.test(s.text)) ? 20 : 0)
    + (area && area.length > 2 && new RegExp('\\b' + area.replace(/\$/g, '\\$') + '\\b').test(s.text) ? 10 : 0)
    + words.reduce((a, w) => a + (s.lc.includes(w) ? Math.log((shards.length + 1) / df(w)) : 0), 0);
  return shards.map(s => ({ s, k: score(s) })).sort((a, b) => (b.k - a.k) || (a.s.ms - b.s.ms)).map(x => x.s);
}

// ---------------------------------------------------------------- the sweep
async function main() {
  if (PLAN_ONLY) {   // cut every block alone and check each shard parses; runs nothing
    for (const [name] of SUITES) if (CUTS[name]) {
      const c = CUTS[name], bad = [];
      c.blocks.forEach((b, k) => { if (b.self) return; const sh = materialise({ suite: name, blocks: [k] });
        const r = spawnSync(process.execPath, ['--check', sh.file]); if (r.status) bad.push(k + ': ' + String(r.stderr).split('\n').slice(0, 4).join(' ')); });
      console.log(`${name}: ${c.blocks.length} blocks (${c.blocks.filter(b => b.self).length} self-check), `
        + `${c.blocks.filter(b => b.reads.length).length} read a let another block writes; ${bad.length} do not parse`);
      c.blocks.forEach((b, k) => { if (b.reads.length || b.writes.length) console.log(`   [${k}] line ${b.s + 1} reads ${b.reads.join(',') || '-'} writes ${b.writes.join(',') || '-'} -> keeps ${closure(c, [k]).join(',')}`); });
      bad.forEach(x => console.log('   ' + x));
    }
    return;
  }
  const muts = CAL_ONLY ? [] : loadMutations();
  const cal = await calibrate();
  const bySuite = {};
  cal.shards.forEach(s => { (bySuite[s.suite] ||= []).push(s); });
  console.log('shards: ' + Object.entries(bySuite).map(([k, v]) => `${k} ${v.length}`).join(', ')
    + (cal.merges.length ? `\nmerges:\n  ${cal.merges.join('\n  ')}` : '\nmerges: none'));
  if (CAL_ONLY) return;

  const shards = cal.shards.map(s => {
    const sh = materialise({ ...s, blocks: s.blocks ? [...s.blocks] : null });
    if (!sh.blocks) sh.text = readFileSync(sh.file, 'utf8');
    sh.name = s.suite + (s.blocks ? '[' + s.blocks.join(',') + ']' : '');
    sh.lc = sh.text.toLowerCase();
    return sh;
  });
  const src = readFileSync(BOARD, 'utf8');
  const RES = join(OUT, 'results.jsonl');
  const done = new Set(existsSync(RES) ? readFileSync(RES, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l).id) : []);
  const todo = muts.filter(m => !done.has(m.id));
  console.log(`\nsharded sweep — ${muts.length} mutation(s), ${todo.length} to run (${done.size} already in results.jsonl), ${shards.length} shard(s), ${JOBS} at a time, heap budget ${BUDGET} MB\n`);
  const MUTS = join(OUT, 'mutants'); mkdirSync(MUTS, { recursive: true });
  const t0 = Date.now();
  const record = r => { appendFileSync(RES, JSON.stringify(r) + '\n');
    const note = r.status === 'caught' ? '(' + r.by + ')' : r.status === 'CRASHED' ? '<- ' + r.why : r.status === 'NOT APPLIED' ? r.why : '';
    console.log(`  ${r.status.padEnd(12)} ${r.id.padEnd(44)} ${(r.ms / 60e3).toFixed(1)} min ${note}`); };

  await pool(todo, JOBS, async m => {
    const t = Date.now();
    const hits = src.split(m.find).length - 1;
    if (hits !== 1) return record({ id: m.id, status: 'NOT APPLIED', by: '', ms: 0, why: `target matched ${hits} times, expected 1` });
    const file = join(MUTS, m.id.replace(/[^\w.-]/g, '_') + '.html');
    writeFileSync(file, src.replace(m.find, () => m.repl));
    let caughtBy = null, crashed = null; const tried = [];
    try {
      for (const sh of orderFor(m, shards)) {
        let heap = heapOf(sh); await acquire(heap);
        let r; try { r = await runShard(sh.file, file, heap, timeoutOf(sh)); } finally { release(heap); }
        if (r.death) { heap = Math.min(heap * 2, 10240); await acquire(heap);    // once more, with room: load, not the mutation, may have killed it
          try { r = await runShard(sh.file, file, heap, timeoutOf(sh)); } finally { release(heap); } }
        tried.push(sh.name);
        if (r.caught) { caughtBy = sh.name; break; }
        if (r.death && !crashed) crashed = { by: sh.name, why: r.why };
      }
    } finally { try { unlinkSync(file); } catch {} }
    const status = caughtBy ? 'caught' : crashed ? 'CRASHED' : m.equivalent ? 'equivalent' : 'SURVIVED';
    record({ id: m.id, status, by: caughtBy || (crashed ? crashed.by : ''), ms: Date.now() - t,
      why: crashed && !caughtBy ? crashed.why : undefined, tried: caughtBy ? tried.length : tried });
  });

  // the summary, in mutate.mjs's style, over everything results.jsonl holds for the ids asked
  const want = new Set(muts.map(m => m.id));
  const all = readFileSync(RES, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)).filter(r => want.has(r.id));
  const of = s => all.filter(r => r.status === s);
  const ran = all.filter(r => r.status !== 'NOT APPLIED');
  const mean = ran.length ? ran.reduce((a, r) => a + r.ms, 0) / ran.length / 60e3 : 0;
  console.log('\n' + '='.repeat(96));
  console.log(`${of('caught').length}/${all.length - of('NOT APPLIED').length - of('equivalent').length} caught`
    + (of('equivalent').length ? `   (${of('equivalent').length} equivalent, no observable difference)` : ''));
  if (of('CRASHED').length) { console.log(`\n${of('CRASHED').length} CRASHED — a shard died twice and nothing else caught it:\n`);
    of('CRASHED').forEach(r => console.log(`  ${r.id}\n      ${r.by}: ${r.why}`)); }
  if (of('SURVIVED').length) { console.log(`\n${of('SURVIVED').length} SURVIVED — every shard passed:\n`);
    of('SURVIVED').forEach(r => console.log(`  ${r.id}\n      tried ${r.tried.length} shard(s)`)); }
  if (of('NOT APPLIED').length) { console.log(`\n${of('NOT APPLIED').length} NOT APPLIED — the search string no longer matches, so nothing was proven:\n`);
    of('NOT APPLIED').forEach(r => console.log(`  ${r.id}\n      ${r.why}`)); }
  console.log(`\nwall ${((Date.now() - t0) / 60e3).toFixed(1)} min this run; mean ${mean.toFixed(2)} min per target (${ran.length} run)`);
  process.exitCode = (of('SURVIVED').length || of('CRASHED').length || of('NOT APPLIED').length) ? 1 : 0;
}
main().catch(e => { console.error(e && e.stack || e); cleanup(); process.exit(2); });
