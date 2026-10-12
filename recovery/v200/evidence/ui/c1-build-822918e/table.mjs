// Markdown evidence table from a cmp.mjs report and the two ex.mjs results it compared.
import { readFileSync } from 'node:fs';
const [cmpPath] = process.argv.slice(2);
const r = JSON.parse(readFileSync(cmpPath, 'utf8'));
const ry = JSON.parse(readFileSync(r.Y + '/result.json', 'utf8'));
const pairs = new Map(r.handlerPairs.map(p => [p.x, p]));
const code = s => s ? '`' + s.replace(/\|/g, '\\|') + '`' : '';
for (const k of ['A', 'R']) {
  console.log(`\n**Context ${k}** (${k === 'A' ? 'the board file, seeded in memory' : 'the saved file reopened'}): every row identical at c41a7c2 and 822918e (state, whole DOM with on* values blanked, storage writes, input clicks, errors)\n`);
  console.log('| step (the person\'s click) | handler at c41a7c2 | handler at 822918e | the call both make (evaluated) | state after the click | storage writes | input.click / chooser | same? |');
  console.log('|---|---|---|---|---|---|---|---|');
  const chooser = ry.contexts[k].choosers;
  for (const s of r.contexts[k].steps) {
    const p = s.handlerX ? pairs.get(s.handlerX) : null;
    // this.checked as the click leaves it: a hide click unticks the box (false), a show click ticks it (true)
    const ev = p ? p.eval[s.step.startsWith('cols:hide') ? 1 : 0] : null;
    const calls = ev ? ev.calls.map(c => c[0] === '.click()' ? '.click() on that element' : c[0] + '(' + c.slice(1).map(a => a[0] === 'string' ? JSON.stringify(a[1]) : a[0] === 'boolean' ? String(a[1]) : a[0]).join(', ') + ')').join('; ') : '';
    const st = Object.assign({}, s.state, { curRow: (ry.contexts[k].steps.find(t => t.step === s.step) || { snap: { state: {} } }).snap.state.curRow });
    const stTxt = s.step.startsWith('cols') ? 'boxes ' + st.colsBoxes.map(b => b.replace(/=true$/, ' ✓').replace(/=false$/, ' ✗')).join(', ') + '; --rowcols ' + (st.rowcols ? '`' + st.rowcols + '`' : '(none)')
      : s.step.startsWith('dens') ? 'uiDensity ' + st.uiDensity + '; pops open [' + st.popsOpen.join(',') + ']'
      : s.step.startsWith('fly') || s.step.startsWith('esc') ? 'openMenu ' + st.openMenu + '; flyout ' + (st.flyOpen ? 'open' : 'closed')
      : 'curRow ' + st.curRow + ', UI_DTAB ' + st.UI_DTAB + '; tabs ' + st.dtabs.join(',') + '; scrolled ' + (st.scrolled.length ? st.scrolled.join(' ') : 'none');
    const ch = chooser.filter(c => c.ph === s.step).map(c => 'chooser on #' + c.id);
    const same = s.sameState && s.sameDom && s.sameWrites && (!p || p.eval.every(e => e.same));
    console.log(`| ${s.step} | ${code(s.handlerX)} | ${code(s.handlerY)} | ${calls ? code(calls) : ''} | ${stTxt.replace(/\|/g, '\\|')} | ${s.writes.map(w => code(w)).join(' ') || '—'} | ${[...s.clicks.map(c => 'click #' + c), ...ch].join(', ') || '—'} | ${same ? 'yes' : '**NO**'} |`);
  }
  const c = r.contexts[k];
  console.log(`\nOpening writes (both): ${c.openingWrites.map(code).join(', ')}; page/console errors at c41a7c2: ${c.errorsX.length}, at 822918e: ${c.errorsY.length}; dialogs: ${c.dialogs.length}; on* attribute values that differ across all ${c.steps.length + 1} whole-document snapshots: ${c.onAttrDiffEntries}, all of these shapes: ${c.onAttrDiffShapes.map(code).join(', ')}; census (handlers rendered at the five sites, every mode): ${Object.entries(c.census).map(([a, b]) => a + ' ' + b).join(', ')}.`);
}
