// UI-C1: compare two ex.mjs runs (X = before, Y = after, or a repeat).
//   node cmp.mjs <dirX> <dirY> <outJson>
// Everything recorded must be identical, except the on* attribute text at the five affected sites; each such pair
// of handler texts is then EVALUATED with recording stubs (the handler's own code, as the browser holds it) and
// the calls, with their argument values and types, must be identical.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const [X, Y, OUT] = process.argv.slice(2);
const rx = JSON.parse(readFileSync(X + '/result.json', 'utf8')), ry = JSON.parse(readFileSync(Y + '/result.json', 'utf8'));
const fails = [], notes = [];
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const chk = (ok, what, extra) => { if (!ok) fails.push(what + (extra !== undefined ? ' :: ' + JSON.stringify(extra).slice(0, 600) : '')); return ok; };
const AFFECTED = /uiColSet\(|uiSetDensity\(|getElementById\(|uiMenuSoon\(|uiDTab\(/;

// run a handler's code with stubs that record every call; `this` as the browser would give it
function evalHandler(code, self) {
  const calls = [];
  const rec = name => (...a) => { calls.push([name, ...a.map(v => [typeof v, v])]); };
  const document = { getElementById: id => { calls.push(['document.getElementById', [typeof id, id]]); return { click: () => calls.push(['.click()', [typeof id, id]]) }; } };
  const mRun = fn => { calls.push(['mRun', [typeof fn]]); if (typeof fn === 'function') fn(); };
  const names = ['uiColSet', 'uiPopsClose', 'uiSetDensity', 'uiFlyClose', 'uiMenuSoon', 'uiDTab'];
  const f = new Function('event', 'document', 'mRun', ...names, code);
  f.call(self, {}, document, mRun, ...names.map(rec));
  return calls;
}
const pairEval = (a, b, where) => {
  const out = [];
  for (const self of [{ checked: true }, { checked: false }]) {
    let ca, cb; try { ca = evalHandler(a, self); } catch (e) { ca = 'THROW ' + e.message; } try { cb = evalHandler(b, self); } catch (e) { cb = 'THROW ' + e.message; }
    chk(eq(ca, cb), 'handler calls differ at ' + where, { a, b, ca, cb });
    out.push({ this: self, calls: ca, same: eq(ca, cb) });
  }
  return out;
};
const handlerPairs = [];   // every distinct (X text, Y text) pair seen, evaluated
const seenPair = new Set();
const notePair = (a, b, where) => {
  if (a === b) return;
  chk(AFFECTED.test(a) && AFFECTED.test(b), 'a handler outside the five sites differs at ' + where, { a, b });
  chk(b.replace(/"/g, "'") === a, 'the two handler texts differ by more than the quote character at ' + where, { a, b });
  const key = a + '\u0000' + b; if (seenPair.has(key)) return; seenPair.add(key);
  handlerPairs.push({ where, x: a, y: b, eval: pairEval(a, b, where) });
};

const report = { X, Y, xBoardSha: rx.boardSha, yBoardSha: ry.boardSha, contexts: {} };
for (const k of ['A', 'R']) {
  const a = rx.contexts[k], b = ry.contexts[k], R = report.contexts[k] = { steps: [] };
  chk(eq(a.opening.writes, b.opening.writes), k + ': storage writes at opening differ', [a.opening.writes, b.opening.writes]);
  chk(eq(a.opening.storage, b.opening.storage), k + ': storage after opening differs');
  chk(a.opening.uiOn === b.opening.uiOn, k + ': ui-on at opening differs');
  chk(!a.opening.writes.some(w => /^prio27ui/.test(w.k)) && !b.opening.writes.some(w => /^prio27ui/.test(w.k)), k + ': a prio27ui* key written at opening');
  R.openingWrites = b.opening.writes.map(w => w.op + ' ' + w.k); R.openingStorageKeys = Object.keys(b.opening.storage);
  chk(eq(a.opening.snap.state, b.opening.snap.state), k + ': state at opening differs');
  chk(a.opening.snap.domSha === b.opening.snap.domSha, k + ': DOM at opening differs');
  if (k === 'A') chk(eq(a.seed, b.seed), 'A: seed writes differ');
  if (k === 'R') { chk(a.rows === b.rows, 'R: rows differ'); R.rows = b.rows; }
  chk(eq(a.errors, b.errors), k + ': page/console errors differ', [a.errors, b.errors]);
  chk(eq(a.dialogs, b.dialogs), k + ': dialogs differ'); chk(eq(a.choosers, b.choosers), k + ': file choosers differ', [a.choosers, b.choosers]);
  R.errorsX = a.errors; R.errorsY = b.errors; R.dialogs = b.dialogs; R.choosers = b.choosers;
  chk(a.steps.length === b.steps.length, k + ': step count differs');
  const snapsAll = [['opening', a.opening.snap, b.opening.snap], ...a.steps.map((s, i) => [s.step, s.snap, b.steps[i] && b.steps[i].snap])];
  a.steps.forEach((s, i) => {
    const t = b.steps[i] || {};
    chk(s.step === t.step, k + ': step name differs at ' + i, [s.step, t.step]);
    chk(!s.harnessError && !t.harnessError, k + ': harness error at ' + s.step, [s.harnessError, t.harnessError]);
    chk(eq(s.writes, t.writes), k + ': storage writes differ at ' + s.step, [s.writes, t.writes]);
    chk(eq(s.clicks, t.clicks), k + ': input clicks differ at ' + s.step);
    chk(eq(s.snap.state, t.snap.state), k + ': state differs at ' + s.step, [s.snap.state, t.snap.state]);
    chk(s.snap.domSha === t.snap.domSha, k + ': DOM (on* values blanked, script text emptied) differs at ' + s.step);
    const hx = s.info && (s.info.onclick || s.info.onchange), hy = t.info && (t.info.onclick || t.info.onchange);
    if (hx || hy) notePair(hx, hy, k + ' ' + s.step + ' (clicked)');
    R.steps.push({ step: s.step, handlerX: hx || null, handlerY: hy || null, writes: t.writes.map(w => w.op + ' ' + w.k + (w.v !== undefined ? '=' + (w.v.length > 80 ? 'len ' + w.v.length : w.v) : '')), clicks: t.clicks.map(c => c.id),
      sameState: eq(s.snap.state, t.snap.state), sameDom: s.snap.domSha === t.snap.domSha, sameWrites: eq(s.writes, t.writes), handlersSame: s.snap.handlersSha === t.snap.handlersSha,
      state: (({ uiMode, uiDensity, openMenu, UI_DTAB, popsOpen, flyOpen, colsBoxes, rowcols, dtabs, scrolled, active }) => ({ uiMode, uiDensity, openMenu, UI_DTAB, popsOpen, flyOpen, colsBoxes, rowcols, dtabs, scrolled, active }))(t.snap.state) });
  });
  // every on* attribute in the whole document at every snapshot
  let diffEntries = 0; const diffSites = new Set();
  snapsAll.forEach(([name, sa, sb]) => {
    if (!sb) return;
    if (sa.handlersSha === sb.handlersSha) return;
    const la = JSON.parse(readFileSync(`${X}/handlers-${k}-${sa.n}.json`, 'utf8')), lb = JSON.parse(readFileSync(`${Y}/handlers-${k}-${sb.n}.json`, 'utf8'));
    chk(la.length === lb.length, k + ': on* attribute count differs at ' + name, [la.length, lb.length]);
    la.forEach((h, i) => { const g = lb[i]; if (!g) return;
      chk(eq(h.slice(0, 4), g.slice(0, 4)), k + ': on* attribute position differs at ' + name, [h, g]);
      if (h[4] !== g[4]) { diffEntries++; diffSites.add(h[4].replace(/'[^']*'/g, "'…'")); notePair(h[4], g[4], k + ' ' + name + ' doc#' + h[0] + ' ' + h[1] + ' ' + h[3]); } });
  });
  R.onAttrDiffEntries = diffEntries; R.onAttrDiffShapes = [...diffSites];
  // the census: every handler the five sites render in every mode
  const ca = a.census, cb = b.census, cen = R.census = {};
  for (const site of ['cols', 'dens', 'fly']) for (const m of Object.keys(ca[site])) {
    chk(ca[site][m].length === cb[site][m].length, k + ': census count differs ' + site + ' ' + m);
    ca[site][m].forEach((h, i) => notePair(h, cb[site][m][i], k + ' census ' + site + ' ' + m));
    cen[site + ':' + m] = cb[site][m].length;
  }
  chk(ca.dtabs.length === cb.dtabs.length, k + ': census dtabs count differs'); ca.dtabs.forEach((h, i) => notePair(h, cb.dtabs[i], k + ' census dtabs'));
  cen.dtabs = cb.dtabs.length;
  if (k === 'A') chk(eq(a.censusWrites, b.censusWrites), 'A: census writes differ');
}
// the saved file
{
  const a = rx.contexts.S, b = ry.contexts.S, S = report.saved = {};
  chk(eq(a.saveWrites, b.saveWrites), 'save: storage writes differ', [a.saveWrites, b.saveWrites]);
  chk(eq(a.errors, b.errors), 'save: errors differ');
  S.suggestedFilename = [a.saved.suggestedFilename, b.saved.suggestedFilename];
  chk(a.saved.suggestedFilename === b.saved.suggestedFilename, 'save: file name differs');
  const hx = readFileSync(X + '/saved.html', 'utf8'), hy = readFileSync(Y + '/saved.html', 'utf8');
  S.bytes = [Buffer.byteLength(hx), Buffer.byteLength(hy)]; S.sha256 = [a.saved.sha256, b.saved.sha256];
  // 1. the payload, as the board's own writer puts it in (savedHtmlOf's regex) ...
  const RE = /(<script type="application\/json" id="pubState">)([\s\S]*?)(<\/script>)/;
  const px = hx.match(RE)[2], py = hy.match(RE)[2];
  // ... and as the board's own reader takes it out (document.getElementById('pubState').textContent, in Chromium,
  // on the reopened saved file)
  const rdx = readFileSync(X + '/pubstate-reader.txt', 'utf8'), rdy = readFileSync(Y + '/pubstate-reader.txt', 'utf8');
  S.payloadBytes = [Buffer.byteLength(px), Buffer.byteLength(py)];
  S.payloadIdentical = chk(px === py, 'saved payload (regex) differs');
  S.readerIdentical = chk(rdx === rdy, 'saved payload (reader) differs');
  S.readerEqualsRegex = chk(rdx === px && rdy === py, 'reader text != regex text');
  chk(Buffer.byteLength(px) > 1000, 'payload suspiciously small');
  // the payload's own timestamps and stamps, listed
  const P = JSON.parse(px), stamps = [];
  const walk = (o, p) => { if (o && typeof o === 'object') { for (const [kk, v] of Object.entries(o)) walk(v, p + '.' + kk); } else if (/(^|\.)(ts|t|at|by|fp|ver|build|BUILD|stamp|saved|when)$/i.test(p)) stamps.push([p, o]); };
  walk(P, '$'); S.payloadStamps = stamps;
  // 2. the whole saved files, line by line
  const lx = hx.split('\n'), ly = hy.split('\n');
  S.lines = [lx.length, ly.length];
  chk(lx.length === ly.length, 'saved files have different line counts');
  const hunks = []; lx.forEach((l, i) => { if (l !== ly[i]) hunks.push({ line: i + 1, x: l, y: ly[i] }); });
  S.hunks = hunks;
  // each differing line must be one of the five changed source lines, before -> after, verbatim
  const srcX = readFileSync(process.env.SRC_X, 'utf8').split('\n'), srcY = readFileSync(process.env.SRC_Y, 'utf8').split('\n');
  const srcPairs = []; srcX.forEach((l, i) => { if (l !== srcY[i]) srcPairs.push({ line: i + 1, x: l, y: srcY[i] }); });
  S.sourceChangedLines = srcPairs.map(p => p.line);
  chk(srcX.length === srcY.length, 'source line counts differ');
  hunks.forEach(h => chk(srcPairs.some(p => p.x === h.x && p.y === h.y), 'saved-file hunk is not one of the source changes at saved line ' + h.line, h));
  chk(hunks.length === srcPairs.length, 'saved-file hunks != source changes', [hunks.length, srcPairs.length]);
  S.hunkToSource = hunks.map(h => ({ savedLine: h.line, sourceLine: (srcPairs.find(p => p.x === h.x && p.y === h.y) || {}).line }));
  // outside the payload, the saved file is the program: the two files with the five lines put back are identical
  const yBack = ly.map((l, i) => { const p = srcPairs.find(q => q.y === l && lx[i] === q.x); return p ? p.x : l; }).join('\n');
  S.identicalWithChangesPutBack = chk(yBack === hx, 'saved files differ beyond the source changes');
}
report.handlerPairs = handlerPairs;
report.distinctHandlerPairs = handlerPairs.length;
report.fails = fails;
writeFileSync(OUT, JSON.stringify(report, null, 1));
console.log(JSON.stringify({ fails, distinctHandlerPairs: handlerPairs.length, onAttrDiffEntries: { A: report.contexts.A.onAttrDiffEntries, R: report.contexts.R.onAttrDiffEntries },
  saved: { bytes: report.saved.bytes, payloadIdentical: report.saved.payloadIdentical, readerIdentical: report.saved.readerIdentical, hunks: report.saved.hunks.length, sourceChangedLines: report.saved.sourceChangedLines, identicalWithChangesPutBack: report.saved.identicalWithChangesPutBack } }, null, 1));
process.exit(fails.length ? 1 : 0);
