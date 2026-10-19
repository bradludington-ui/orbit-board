// runs-table.mjs : every run recorded in logs/runs.txt (probe runs) and logs/runs-small.txt (small bounded commands) as markdown
// tables, and pids.txt grouped by label. Reader only.
import { readFileSync, existsSync } from 'node:fs';
const U = new URL('../', import.meta.url).pathname;
const parse = f => !existsSync(U + f) ? [] : readFileSync(U + f, 'utf8').split('\n').filter(Boolean).map(l => {
  const m = l.match(/^(\S+) start="([^"]+)" exit=(\d+) wall_s=([\d.]+)/);
  if (!m) return { raw: l };
  return { label: m[1], start: m[2].replace(/^2026-10-12 /, '').replace(' EDT', ''), exit: m[3], wall: (+m[4]).toFixed(1), note: /TIMED OUT/.test(l) ? 'TIMED OUT' : '' };
});
const big = parse('logs/runs.txt'), small = parse('logs/runs-small.txt');
console.log('\n### A. Probe runs (`logs/runs.txt`, via run.sh; each `setsid -w timeout -k 10 600 node …`)\n');
console.log('All times are ET (EDT) on Mon 12 Oct 2026. Output of each: `logs/<label>.log`, JSON `out/<label>.json`.\n');
console.log('| label | start ET | exit | wall s |\n|---|---|---|---|');
for (const r of big) console.log(r.raw ? `| (unparsed) ${r.raw} | | | |` : `| ${r.label} | ${r.start} | ${r.exit} | ${r.wall}${r.note ? ' ' + r.note : ''} |`);
console.log('\n### B. Small bounded commands (`logs/runs-small.txt`, via q.sh)\n');
console.log('| label | start ET | exit | wall s |\n|---|---|---|---|');
for (const r of small) console.log(r.raw ? `| (unparsed) ${r.raw} | | | |` : `| ${r.label} | ${r.start} | ${r.exit} | ${r.wall}${r.note ? ' ' + r.note : ''} |`);
console.log('\n### C. PIDs (`pids.txt`: the timeout PID and its child, with the command; grouped here by label)\n');
const P = readFileSync(U + 'pids.txt', 'utf8').split('\n').filter(Boolean).map(l => { const m = l.match(/^(\d+) (\S+) (\S+) (\S+) ::/); return m ? { pid: m[1], at: m[2], comm: m[3], label: m[4] } : null; }).filter(Boolean);
const by = {}; for (const p of P) (by[p.label] = by[p.label] || []).push(p.pid + '(' + p.comm + ')');
console.log('| label | PIDs (timeout, child; "gone" = exited before it was read) |\n|---|---|');
for (const k of Object.keys(by)) console.log(`| ${k} | ${by[k].join(', ')} |`);
console.log(`\n${P.length} PID lines in pids.txt. No process was killed by this probe.`);
