// mkmut.mjs -- disposable sensitivity mutants for the verifier (never a proposed repair). Each starts from the builder's
// U2b or U2a board text and applies ONE exact text edit whose find must match exactly once. usage: node mkmut.mjs <verifyDir> <builderDir>
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const [V, D] = process.argv.slice(2);
const blob = b => createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
const count = (s, f) => s.split(f).length - 1;
const REF = "  if(_saveBusy){ setStat('⏳ A save is under way — put the kept work back once it finishes. Nothing was changed: the kept work is still kept, and what is on screen is unchanged.'); render(); return; }   // v2.00 (U2)\n";
const M = {
  // U2b, but the refusal also rewrites the kept slot (one extra trailing space): only the kept-copy byte identity should change.
  'M1-keptTouch': { from: 'U2b', find: REF, repl: REF.replace("render(); return; }", "try{ localStorage.setItem(_AP.key+'.kept', localStorage.getItem(_AP.key+'.kept')+' '); }catch(e){} render(); return; }") },
  // U2b, but the refusal also moves MS.ts by 1 ms: only the on-screen (MS JSON) byte identity should change.
  'M2-msTouch': { from: 'U2b', find: REF, repl: REF.replace("render(); return; }", "MS.ts=(+MS.ts||0)+1; render(); return; }") },
  // U2b, but it refuses whether or not a save runs: the no-race control and the retry should change.
  'M3-alwaysRefuse': { from: 'U2b', find: REF, repl: REF.replace('if(_saveBusy){', 'if(_saveBusy>=0){') },
  // U2a, plus a landing that does not record the copy it wrote as the checkpoint when the count moved (folder and file).
  // Causal probe of the builder's explanation of U2a's unasked Save -- NOT a repair (it would make an ordinary edit typed
  // during a write clash against the person's own save next time).
  'M5-noCheckpointOverwrite': { from: 'U2a', edits: [
    { find: '  driveBaseSet(ap, wroteTs, clean, fy);   // the copy it WROTE is the one this work came from\n',
      repl: '  if(clean) driveBaseSet(ap, wroteTs, clean, fy); else baseSet({dirty:true});   // VERIFIER MUTANT M5\n' },
    { find: '    LASTKNOWN=wrote;\n    const clean=(_saveGen===gen);   // nothing changed while it was writing\n',
      repl: '    const clean=(_saveGen===gen);   // nothing changed while it was writing\n    if(clean) LASTKNOWN=wrote;   // VERIFIER MUTANT M5\n' } ] },
};
for (const [name, m] of Object.entries(M)) {
  let s = readFileSync(`${D}/boards/${m.from}/prioritization-board-grid.html`, 'utf8');
  for (const e of (m.edits || [m])) { const n = count(s, e.find); console.log(`${name}: find count = ${n}`); if (n !== 1) throw new Error(name + ' find matched ' + n); s = s.replace(e.find, () => e.repl); }
  writeFileSync(`${V}/mut/boards/${name}/prioritization-board-grid.html`, s);
  console.log(name, 'from', m.from, 'blob', blob(Buffer.from(readFileSync(`${V}/mut/boards/${name}/prioritization-board-grid.html`))));
}
