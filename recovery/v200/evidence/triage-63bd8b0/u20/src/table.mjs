// table.mjs -- the observed outcome of every scenario as a markdown table row (reads out/*.<pass>.json only), and whether
// the two passes agree on everything the table shows.
import { readFileSync, existsSync } from 'node:fs';
const dir = new URL('../out/', import.meta.url).pathname;
const SC = ['PB-W', 'PB-Wtick', 'PB-C1', 'PB-C2a', 'PB-C2b', 'PB-NL', 'AD-W', 'AD-Wtick', 'AD-C1', 'AD-C2a', 'AD-C2b',
  'BR-W', 'BR-Wtick', 'BR-C1', 'BR-C2a', 'BR-C2b', 'BR-Wperm', 'BR-C1perm', 'BR-Wh', 'BR-C1h', 'BR-Wpermh', 'BR-C2ah', 'BR-C2bh',
  'PF-W', 'PF-C1', 'PF-C2a'];
const short = s => String(s || '').replace(/\s+/g, ' ').slice(0, 70).replace(/\|/g, '/');
const place = (st, m) => ((st.reach || {})[m] || []).join('+') || '**none**';
const row = O => { const R = O.steps, sc = O.scenario; const D = R.during, V = R.save, N = R.next, Z = R.reopen;
  const P = R.premise;
  const pre = P ? `${P.Bbusy}/${P.Abusy === null ? '-' : P.Abusy}/${(P.heldBy || []).join('')}/${(P.pendingOf || []).join('') || '-'}` : '-';
  const act = D ? `${D.screen}; kept ${D.kept ? D.kept.note : 'none'}; “${short(D.status)}”` : '-';
  const sv = V ? `${V.rec.wrote ? 'WROTE ' + V.rec.before + '→' + V.rec.after : 'wrote nothing'}; asked ${V.rec.asked.length}; “${short(V.status)}”` : '-';
  const nx = N ? `${N.rec.wrote ? 'WROTE ' + N.rec.before + '→' + N.rec.after : 'wrote nothing'}` : '-';
  const leaves = Object.keys(Z.reach || {}).map(m => `${m}: ${place(Z, m)}`).join('; ');
  return { sc, cells: [pre, act, sv, V ? String(!!V.falselyClean) : '-', nx, String(!!Z.falselyClean), leaves] };
};
const pass = process.argv[2] || 'r1', other = process.argv[3] || 'r2';
console.log('| scenario | premise B busy/A busy/held/pending | after the action (screen; kept; status) | B’s save | falsely clean | next Save | reopen falsely clean | at the reopen, where each copy is |');
console.log('|---|---|---|---|---|---|---|---|');
let agree = 0, differ = [];
for (const sc of SC) {
  const p1 = dir + sc + '.' + pass + '.json', p2 = dir + sc + '.' + other + '.json';
  if (!existsSync(p1)) { console.log('| ' + sc + ' | (missing) |'); continue; }
  const a = row(JSON.parse(readFileSync(p1, 'utf8')));
  console.log('| ' + sc + ' | ' + a.cells.join(' | ') + ' |');
  if (existsSync(p2)) { const b = row(JSON.parse(readFileSync(p2, 'utf8')));
    // times inside the status text differ between passes; compare with digits removed
    const norm = x => JSON.stringify(x.cells).replace(/\d/g, '#');
    if (norm(a) === norm(b)) agree++; else differ.push(sc); }
}
console.log('\n' + pass + ' vs ' + other + ': identical (digits aside) for ' + agree + ' of ' + SC.length + (differ.length ? '; differ: ' + differ.join(', ') : ''));
