// idcheck.mjs : the probe, board, boot.mjs and shim blobs each run printed, counted per pass (reader only)
import { readdirSync, readFileSync } from 'node:fs';
const d = new URL('../out/', import.meta.url).pathname; const c = {};
for (const f of readdirSync(d).filter(f => /^(dev|dev2|r1|r2|r3)-.*\.json$/.test(f))) { const O = JSON.parse(readFileSync(d + f, 'utf8'));
  const k = f.split('-')[0] + ' probe=' + O.IDS.probe.slice(0, 8) + ' board=' + O.IDS.board.slice(0, 8) + ' boot=' + O.IDS.bootMjs.slice(0, 8) + ' shim=' + O.IDS.shim.slice(0, 8) + ' jsdom=' + O.IDS.jsdom + ' errors=' + O.errors.length + (O.incomplete ? ' INCOMPLETE' : '');
  c[k] = (c[k] || 0) + 1; }
for (const k of Object.keys(c).sort()) console.log(c[k], k);
