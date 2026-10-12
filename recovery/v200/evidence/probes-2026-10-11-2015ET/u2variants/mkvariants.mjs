// Builds U2a / U2b / U2ab boards from the copied BASE board by exact text edits; each find must match exactly once.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const D = process.argv[2];
const blob = b => createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
const base = readFileSync(D + '/boards/BASE/prioritization-board-grid.html', 'utf8');
const count = (s, f) => s.split(f).length - 1;
const EDIT_A = { find: '  persist(); DIRTY=true; render();',
  repl: '  persist(); _saveGen++; DIRTY=true; render();   // v2.00 (U2): a save still writing finds the count moved and leaves this unsaved' };
const EDIT_B = { find: "function keptPutBack(){\n  const k=keptCopy();\n  if(!k){ _keptMeta=null; setStat('Nothing is kept aside in this browser.'); render(); return; }\n",
  repl: "function keptPutBack(){\n  const k=keptCopy();\n  if(!k){ _keptMeta=null; setStat('Nothing is kept aside in this browser.'); render(); return; }\n"
      + "  if(_saveBusy){ setStat('⏳ A save is under way — put the kept work back once it finishes. Nothing was changed: the kept work is still kept, and what is on screen is unchanged.'); render(); return; }   // v2.00 (U2)\n" };
const apply = (s, e, label) => { const n = count(s, e.find); console.log(`${label}: find count = ${n}`); if (n !== 1) throw new Error(label + ' find matched ' + n); return s.replace(e.find, () => e.repl); };
const out = { BASE: base };
out.U2a = apply(base, EDIT_A, 'U2a COUNTER');
out.U2b = apply(base, EDIT_B, 'U2b REFUSAL');
out.U2ab = apply(apply(base, EDIT_A, 'U2ab(COUNTER)'), EDIT_B, 'U2ab(REFUSAL)');
for (const v of ['U2a', 'U2b', 'U2ab']) writeFileSync(D + `/boards/${v}/prioritization-board-grid.html`, out[v]);
for (const v of Object.keys(out)) console.log(v, blob(Buffer.from(readFileSync(D + `/boards/${v}/prioritization-board-grid.html`))));
