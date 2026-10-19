// cmpout.mjs <a.json> <b.json> -- compares two probe outputs, ignoring timing fields and ident paths; prints differing paths
import { readFileSync } from 'node:fs';
const [a, b] = process.argv.slice(2).map(p => JSON.parse(readFileSync(p, 'utf8')));
const skip = new Set(['totalMs', 'ms', 'boardPath', 'bootBOARD', 'probeBlob']);
const diffs = [];
const walk = (x, y, p) => {
  if (typeof x !== typeof y || Array.isArray(x) !== Array.isArray(y) || (x === null) !== (y === null)) { diffs.push(p); return; }
  if (x && typeof x === 'object') { const ks = new Set([...Object.keys(x), ...Object.keys(y)]);
    for (const k of ks) { if (skip.has(k)) continue; if (!(k in x) || !(k in y)) { diffs.push(p + '.' + k + ' (missing one side)'); continue; } walk(x[k], y[k], p + '.' + k); } return; }
  if (x !== y) diffs.push(p + ' : ' + JSON.stringify(x).slice(0, 120) + ' vs ' + JSON.stringify(y).slice(0, 120));
};
walk(a, b, '$');
console.log(diffs.length + ' differences'); diffs.slice(0, 40).forEach(d => console.log(' ', d));
