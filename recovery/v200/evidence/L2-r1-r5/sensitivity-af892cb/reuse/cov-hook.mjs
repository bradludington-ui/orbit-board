// cov-hook.mjs -- preloaded with node --import. Counts the board's '__COVHIT__ <function>' console lines, which jsdom hands
// to each window's VirtualConsole, in this Node process, and writes the counts to $COV_OUT at exit. It changes nothing
// else: every other console event goes through unchanged. It resolves the same jsdom installation as boot.mjs.
import { VirtualConsole } from 'jsdom';
import { writeFileSync } from 'node:fs';
const hits = {};
const orig = VirtualConsole.prototype.emit;
VirtualConsole.prototype.emit = function (ev, ...a) {
  if (ev === 'log' && typeof a[0] === 'string' && a[0].startsWith('__COVHIT__ ')) { const k = a[0].slice(11); hits[k] = (hits[k] || 0) + 1; return true; }
  return orig.call(this, ev, ...a);
};
process.on('exit', () => { try { writeFileSync(process.env.COV_OUT, JSON.stringify(hits, null, 1) + '\n'); } catch {} });
