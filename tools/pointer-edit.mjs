// THE MOUSE CAN EDIT WHAT THE KEYBOARD CAN, IN THE ROWS AND THE CLIN DRILL (v2.09, item 125). In Chromium, on a populated
// board with a prime standing in it, clicked with page.mouse at each control's centre -- whatever is on top takes the click,
// as it takes a person's. Brad, 26 Oct 2026: "if I click a requirement amount on a CLIN, it sends me to the panel pop up and
// I'm unable to edit CLIN requirement amounts." Every browser check before this reached a row field by focusing it, which
// fires no click: the keyboard worked, the mouse could not get into a CLIN amount at all, and nothing saw it.
//
//   A. Every control the row and the CLIN drill record (tools/row-controls.json, surface "row"), pressed with the mouse, in
//      four layouts -- the RECORD panel sliding over (the default) and docked, at 1366 x 768 and 1920 x 1000: a box takes
//      the typing and stores it, a picker stores its choice, a button does what it says, and the RECORD panel never slides
//      over the table for any of them. CONTROL: a click on the row's own title still opens it, sliding over.
//   B. Type a figure, then click the next box (no Enter, no Tab), the way a grid is worked with a mouse: every figure is
//      stored, the box clicked takes the keyboard, and a drill button pressed after typing does its work on the first press.
//      In the rows, the drill, and the RECORD panel's value by service.
//   C. A redraw (what a Live view tick does, every 30 s by default) while a row figure is half typed commits nothing, and
//      the typing and the keyboard stay; leaving the box commits the whole figure. Fund's allocation box, a CLIN's request,
//      the rank box.
//   D. The two ways into the drill from elsewhere -- the edit box's "Open the 🧾 CLIN drill…" and the Classify grid's -- close
//      what is over it, open the drill (never shut it), and leave the keyboard on its first box, with nothing on top of it.
//      And a row's ⋯ menu left open does not eat the first click into the drill.
//   E. The drill's boxes, holding a billion-dollar figure, show it whole, at 1366 and 1920, sliding and docked.
//
// It stands its own prime up in the page, as standards-check.mjs does, and never changes the shared fixture
// (tools/ia-fixture.mjs), which every other browser check and the accessibility baseline read.
//
//   node tools/pointer-edit.mjs [--board FILE]
import { chromium } from 'playwright-core';
import { resolve, join } from 'node:path';
import { buildPopulated } from './ia-fixture.mjs';
import { CHROME } from './chrome.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2);
const bi = args.indexOf('--board');
const FILE = resolve(bi >= 0 ? args[bi + 1] : join(ROOT, 'prioritization-board-grid.html'));
const LIVE = buildPopulated(FILE);
const only = (() => { const i = args.indexOf('--only'); return i >= 0 ? args[i + 1].split(',') : null; })();
const want = s => !only || only.includes(s);

let bad = 0;
const chk = (what, ok, detail) => { if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}${ok || !detail ? '' : '   ' + detail}`); };

const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const LAYOUTS = [['sliding', 1366, 768], ['sliding', 1920, 1000], ['docked', 1366, 768], ['docked', 1920, 1000]];

// The prime: the populated board's third requirement, made a prime with two CLINs from the board data and one added, on an
// appropriation that carries RCN / EEIC, with two combinations for the pickers. Everything is put in the page, after it opens.
const PRIME = `(function(){
  const id=S.order[2]; if(!S.ptype) S.ptype={}; S.ptype[id]='PRIME';
  CLINS[id]=[{clin:'0001', desc:'Depot line', ccar:'JSF100', ask:[100000,20000,30000,40000,50000,60000]},
             {clin:'0002', desc:'Spares', ccar:'', ask:[200000,0,0,10000,0,0]}];
  if(!S.clinNew) S.clinNew={}; S.clinNew[id]=[{key:'n1', clin:'0003', desc:'Added line', ccar:'', ask:SVC.map(function(){ return 0; })}];
  if(S.clinAlloc) delete S.clinAlloc[id]; if(S.clinRcn) delete S.clinRcn[id]; if(S.clinRcnSvc) delete S.clinRcnSvc[id];
  MS.rcn=[{k:'K1', rcn:'12345', eeic:'ABCDE', t:'Standard', svc:['USAF','ANG','AFRC']}, {k:'K2', rcn:'54321', eeic:'EDCBA', t:'ANG own', svc:['ANG']}];
  clinOpen={}; clinOpen[id]=true; rowMenuId=null; openMenu=null; save(); render();
  return id; })()`;

// docked: View › Record panel › Docked beside the table, which keeps prio27uiDock = '1' in this browser
const open = async (layout, w, h, mode = 'review') => {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(([m, d]) => { try { localStorage.setItem('spmtTheme', 'harbor'); localStorage.setItem('spmtMode', m);
    localStorage.setItem('prio27who', 'BLL'); if (d) localStorage.setItem('prio27uiDock', '1'); } catch (e) {} }, [mode, layout === 'docked']);
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  // every native question is recorded and answered from a queue: a prompt with the next answer (null dismisses it), a
  // confirm with OK unless the queue says false
  const dlg = { seen: [], answers: [] };
  p.on('dialog', async d => { dlg.seen.push(d.type() + ': ' + d.message().slice(0, 80));
    const a = dlg.answers.length ? dlg.answers.shift() : (d.type() === 'prompt' ? null : true);
    if (d.type() === 'prompt') { if (a === null) await d.dismiss(); else await d.accept(String(a)); }
    else if (d.type() === 'confirm') { if (a === false) await d.dismiss(); else await d.accept(); }
    else await d.accept(); });
  await p.goto('file://' + LIVE);
  await p.waitForFunction(() => typeof render === 'function' && document.querySelectorAll('#list .row').length > 0, null, { timeout: 60000 });
  await p.waitForTimeout(250);
  const id = await p.evaluate(PRIME);
  await p.waitForTimeout(150);
  return { p, ctx, errs, dlg, id };
};
// what the page looks like: who has the keyboard, and whether the RECORD panel is over the table
const st = p => p.evaluate(() => {
  const a = document.activeElement, ins = document.getElementById('inspector'), sc = document.getElementById('drawerScrim');
  return { focus: a ? (a.tagName.toLowerCase() + (a.getAttribute('onchange') ? ' ' + a.getAttribute('onchange').replace(/,this\.value\)$/, ')') : a.getAttribute('onclick') ? ' ' + a.getAttribute('onclick').slice(0, 40) : '')) : 'none',
    drawer: !!(ins && ins.classList.contains('open')), scrim: !!(sc && sc.classList.contains('on')),
    inDrill: !!(a && a.closest && a.closest('.clin-detail')), inPanel: !!(a && a.closest && a.closest('#inspector')) };
});
// a click at the centre of the first element the selector names, the way a person clicks: scrolled to the middle of the
// window first, and whatever is on top at that point takes the click (that is reported)
const press = async (p, sel, o = {}) => {
  const h = await p.$(sel); if (!h) return { missing: sel };
  await h.evaluate(e => e.scrollIntoView({ block: 'center', inline: 'center' }));
  await p.waitForTimeout(60);
  const bb = await h.boundingBox(); if (!bb) return { nobox: sel };
  const x = bb.x + bb.width / 2, y = bb.y + bb.height / 2;
  const top = await p.evaluate(([x, y, sel]) => { const e = document.elementFromPoint(x, y), t = document.querySelector(sel);
    return { on: !!(e && t && (e === t || t.contains(e))), what: e ? e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') : 'none' }; }, [x, y, sel]);
  await p.mouse.click(x, y);
  await p.waitForTimeout(o.wait == null ? 160 : o.wait);
  return top;
};
const typeIn = async (p, txt, end = 'Enter') => {
  await p.keyboard.press('Control+A'); await p.keyboard.type(txt);
  if (end) await p.keyboard.press(end);
  await p.waitForTimeout(200);
};
// a box by the writer it calls, e.g. box(id, 'clinSetAsk', 'b0', 0)
const q = s => JSON.stringify(s);
const box = (id, fn, ...a) => `#row-${id} input[onchange^=${q(fn + '(' + [id, ...a].map(x => typeof x === 'number' ? x : q(x)).join(',') + ',')}]`;
const btn = (id, fn, ...a) => `#row-${id} button[onclick^=${q(fn + '(' + [id, ...a].map(x => typeof x === 'number' ? x : q(x)).join(','))}]`;
// the CLIN number, description and CCaR buttons write their field name in single quotes
const fld = (id, key, f) => `#row-${id} button[onclick=${q('clinSetField(' + q(id) + ',' + q(key) + ",'" + f + "')")}]`;
const read = (p, id) => p.evaluate(id => {
  const L = clinList(id), g = {}; L.forEach(c => { g[c.key] = clinVec(id, c).slice(); });
  return { ask: Object.fromEntries(L.map(c => [c.key, c.ask.slice()])), grid: g, keys: L.map(c => c.key + ':' + c.clin),
    rank: S.order.indexOf(id) + 1, alloc: JSON.stringify(S.alloc[id] === undefined ? null : S.alloc[id]), mc: !!S.mc[id],
    rcn: JSON.stringify(((S.clinRcn || {})[id]) || {}), rcnSvc: JSON.stringify(((S.clinRcnSvc || {})[id]) || {}),
    gone: JSON.stringify(((S.clinRm || {})[id]) || []), wbsOpen: !!document.querySelector('#wbsPanel.open, #wbsPanel[style*="block"]'),
    menu: rowMenuId, drill: !!clinOpen[id], meta: JSON.stringify(((S.clinMeta || {})[id]) || {}) };
}, id);
const quiet = (s, layout) => layout === 'docked' ? !s.scrim : (!s.drawer && !s.scrim);

console.log('\n' + FILE.split('/').pop());

// ── A. EVERY ROW AND DRILL CONTROL, PRESSED WITH THE MOUSE ──────────────────────────────────────────────────────────────
if (want('A')) for (const [layout, w, h] of LAYOUTS) {
  const tag = `A · ${layout} ${w}`;
  try {
    const { p, ctx, errs, dlg, id } = await open(layout, w, h);
    const r0 = await read(p, id);
    // the boxes: a request, the added CLIN's first request (its allocation starts there), an allocation, the rank
    const boxes = [
      ['a CLIN’s request (base line, USAF)', box(id, 'clinSetAsk', 'b0', 0), '400001', r => r.ask.b0[0] === 400001],
      ['the added CLIN’s first request (ANG): its allocation starts as that request', box(id, 'clinSetAsk', 'n1', 1), '70000', r => r.ask.n1[1] === 70000 && r.grid.n1[1] === 70000],
      ['a CLIN’s allocation (base line, AFRC)', box(id, 'setClinSvc', 'b0', 2), '33333', r => r.grid.b0[2] === 33333],
      ['the rank box', `#row-${id} input[onchange^="setRank("]`, '2', r => r.rank === 2],
    ];
    for (const [what, sel, val, ok] of boxes) {
      const top = await press(p, sel); const s1 = await st(p);
      await typeIn(p, val); const r = await read(p, id), s2 = await st(p);
      chk(`${tag} · ${what}: the click lands on it, the panel stays off the table, the keyboard stays, the figure is stored`,
        top.on && quiet(s1, layout) && /^input/.test(s1.focus) && ok(r) && quiet(s2, layout),
        JSON.stringify({ top, s1, s2, ask: r.ask, grid: r.grid, rank: r.rank }));
    }
    // the pickers: the CLIN's own RCN / EEIC, then (its by-service button opens the line) a service's own
    {
      const sel = `#row-${id} select[onchange^=${q('setRcnClin(' + q(id) + ',"b0"')}]`;
      const top = await press(p, sel); const s1 = await st(p);
      await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
      const r = await read(p, id), s2 = await st(p);
      chk(`${tag} · a CLIN’s RCN / EEIC picker: chosen with the mouse and the keys, stored, the panel stays off the table`,
        top.on && quiet(s1, layout) && /^select/.test(s1.focus) && r.rcn === q({ b0: 'K1' }) && quiet(s2, layout), JSON.stringify({ top, s1, s2, rcn: r.rcn }));
      const t2 = await press(p, btn(id, 'rcnClinToggle', 'b0'));
      const sel2 = `#row-${id} select[onchange^=${q('setRcnClinSvc(' + q(id) + ',"b0","ANG"')}]`;
      const top2 = await press(p, sel2); const s3 = await st(p);
      await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
      const r2 = await read(p, id), s4 = await st(p);
      chk(`${tag} · a service’s own RCN / EEIC on a CLIN (by service, then its picker): stored, the panel stays off the table`,
        t2.on && top2.on && quiet(s3, layout) && /"ANG":"K2"/.test(r2.rcnSvc) && quiet(s4, layout), JSON.stringify({ t2, top2, s3, s4, rcnSvc: r2.rcnSvc }));
    }
    // the drill's buttons: each does its work on the first press, and the panel stays off the table
    const steps = [
      ['the CLIN number', fld(id, 'b0', 'clin'), ['0001A'], r => /"clin":"0001A"/.test(r.meta)],
      ['the description', fld(id, 'b0', 'desc'), ['Depot line, renamed'], r => /Depot line, renamed/.test(r.meta)],
      ['the CCaR record', fld(id, 'b1', 'ccar'), ['JSF222'], r => /"ccar":"JSF222"/.test(r.meta)],
      ['＋ Add CLIN', btn(id, 'clinAdd'), ['0009', 'Ninth line'], r => r.keys.some(k => /:0009$/.test(k))],
      ['✕ on the added CLIN', btn(id, 'clinRemove', 'n1'), [true], r => !r.keys.some(k => /^n1:/.test(k))],
      ['✕ on a CLIN from the data', btn(id, 'clinRemove', 'b1'), [true], r => r.gone === q(['b1'])],
      ['↩ to put it back', btn(id, 'clinRestore', 'b1'), [], r => r.gone === '[]'],
      ['↓ Fill from row', btn(id, 'clinFromRow'), [true], r => Object.values(r.grid).every(v => v.every(Number.isInteger))],
      ['↑ Apply grid to row', btn(id, 'clinToRow'), [true], r => /"m":"s"/.test(r.alloc) && JSON.parse(r.alloc).v.every(Number.isInteger)],
      ['↺ Reset allocations', btn(id, 'clinResetGrid'), [true], r => q(r.grid.b0) === q(r.ask.b0)],
      ['a CLIN’s WBS', `#row-${id} button[onclick^='toggleWbs("clin"']`, [], r => r.wbsOpen],
    ];
    for (const [what, sel, ans, ok] of steps) {
      dlg.answers = ans.slice(); const n0 = dlg.seen.length;
      const top = await press(p, sel, { wait: 260 }); const s = await st(p), r = await read(p, id);
      chk(`${tag} · ${what}: one press does it, and the panel stays off the table`, top.on && ok(r) && quiet(s, layout),
        JSON.stringify({ top, s, asked: dlg.seen.slice(n0), r: { keys: r.keys, gone: r.gone, alloc: r.alloc, meta: r.meta, wbs: r.wbsOpen } }));
      await p.evaluate(() => { try { if (typeof wbsClose === 'function') wbsClose(); } catch (e) {}
        try { const x = document.querySelector('#wbsPanel .x'); if (x && x.offsetParent) x.click(); } catch (e) {} });
      await p.waitForTimeout(80);
    }
    // a prompt cancelled and a confirm declined leave the panel off the table too
    for (const [what, sel, ans] of [['a CLIN number prompt cancelled', fld(id, 'b0', 'clin'), [null]], ['Reset allocations declined', btn(id, 'clinResetGrid'), [false]]]) {
      dlg.answers = ans.slice(); await press(p, sel, { wait: 220 }); const s = await st(p);
      chk(`${tag} · ${what}: the panel stays off the table`, quiet(s, layout), JSON.stringify(s));
    }
    // the row's own controls: ★, ⋯, 🧾 (shut, then open again), and the ⋯ menu's items
    {
      const mc0 = (await read(p, id)).mc;
      await press(p, `#row-${id} button.mcb`); const r1 = await read(p, id), s1 = await st(p);
      chk(`${tag} · ★ Mission Critical: one press sets it, the panel stays off the table`, r1.mc === !mc0 && quiet(s1, layout), JSON.stringify({ mc0, r1: r1.mc, s1 }));
      await press(p, `#row-${id} button.mcb`);
      await press(p, `#row-${id} .rmbtn`); const r2 = await read(p, id), s2 = await st(p);
      chk(`${tag} · ⋯ opens the row’s menu, the panel stays off the table`, r2.menu === id && quiet(s2, layout), JSON.stringify({ menu: r2.menu, s2 }));
      dlg.answers = [];
      await press(p, `#rm_${id} button.mi[onclick*="resetAlloc("]`, { wait: 260 }); const r3 = await read(p, id), s3 = await st(p);
      chk(`${tag} · ⋯ › ↺ Reset to the full requirement: done, the panel stays off the table`, r3.alloc === 'null' && quiet(s3, layout), JSON.stringify({ alloc: r3.alloc, s3 }));
      await press(p, `#row-${id} .clinbtn`); const r4 = await read(p, id);
      await press(p, `#row-${id} .clinbtn`); const r5 = await read(p, id), s5 = await st(p);
      chk(`${tag} · 🧾 shuts the drill and opens it again, the panel stays off the table`, !r4.drill && r5.drill && quiet(s5, layout), JSON.stringify({ r4: r4.drill, r5: r5.drill, s5 }));
      // ⋯ › copy to another year: the menu's year picker, chosen with the keys after a click
      await press(p, `#row-${id} .rmbtn`);
      const y0 = await p.evaluate(() => MS.cur);
      dlg.answers = [true, true];
      await press(p, `#rm_${id} select[onchange*="xferYear("]`); await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
      const cp = await p.evaluate(([id, y0]) => { const ys = Object.keys(MS.years).map(Number).filter(y => y !== y0);
        return ys.some(y => ((MS.years[y] || {}).order || []).indexOf(id) >= 0); }, [id, y0]);
      chk(`${tag} · ⋯ › copy to another year: the copy is made`, cp, JSON.stringify({ asked: dlg.seen.slice(-3) }));
      await p.evaluate(() => { rowMenuId = null; render(); });
      // ⋯ › ✕ Remove, then put back
      await press(p, `#row-${id} .rmbtn`); dlg.answers = [true];
      await press(p, `#rm_${id} button.mi[onclick*="removeReq("]`, { wait: 300 });
      const rm = await p.evaluate(id => (S.removed || []).indexOf(id) >= 0, id), s6 = await st(p);
      chk(`${tag} · ⋯ › ✕ Remove from the board: removed, the panel stays off the table`, rm && quiet(s6, layout), JSON.stringify({ rm, s6 }));
      await p.evaluate(id => { restoreReq(id); clinOpen[id] = true; render(); }, id);
    }
    // the ⠿ handle: dragged with the mouse onto the row two above, the requirement moves up the order
    {
      const k0 = (await read(p, id)).rank;
      const up = await p.evaluate(([id, k]) => S.order[k - 3], [id, k0]);
      await p.evaluate(u => document.getElementById('row-' + u).scrollIntoView({ block: 'center' }), up); await p.waitForTimeout(80);
      const a = await (await p.$(`#row-${id} .grip`)).boundingBox(), t = await (await p.$(`#row-${up} .t1`)).boundingBox();
      await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await p.mouse.down();
      await p.mouse.move(t.x + t.width / 2, t.y + t.height / 3, { steps: 10 }); await p.mouse.up(); await p.waitForTimeout(300);
      const r = await read(p, id), s = await st(p);
      chk(`${tag} · ⠿ dragged onto the row two above: the requirement moves up, the panel stays off the table`, r.rank < k0 && quiet(s, layout), JSON.stringify({ k0, rank: r.rank, s }));
    }
    // the rank arrows, in Rank
    {
      await p.evaluate(() => { uiMode = 'rank'; uiApply(); render(); });
      const k0 = (await read(p, id)).rank;   // put back at the bottom just above, so ▲ first
      await press(p, `#row-${id} button[onclick^="bump("][onclick$=",-1)"]`); const r1 = await read(p, id), s1 = await st(p);
      chk(`${tag} · ▲ in Rank: one press moves it up one, the panel stays off the table`, r1.rank === k0 - 1 && quiet(s1, layout), JSON.stringify({ k0, r1: r1.rank, s1 }));
      await press(p, `#row-${id} button[onclick^="bump("][onclick$=",1)"]`); const r2 = await read(p, id);
      chk(`${tag} · ▼ in Rank: and back down`, r2.rank === k0, JSON.stringify({ k0, r2: r2.rank }));
    }
    // Fund's allocation box
    {
      await p.evaluate(() => { uiMode = 'fund'; uiApply(); render(); });
      const sel = `#row-${id} input[onchange^="setAlloc("]`;
      const top = await press(p, sel); const s1 = await st(p);
      await typeIn(p, '1000000'); const r = await read(p, id), s2 = await st(p);
      chk(`${tag} · Fund’s allocation box: the click lands on it, the keyboard stays, the figure is stored`,
        top.on && quiet(s1, layout) && /^input/.test(s1.focus) && r.alloc === q({ m: 't', v: 1000000 }) && quiet(s2, layout), JSON.stringify({ top, s1, s2, alloc: r.alloc }));
      await p.evaluate(() => { uiMode = 'review'; uiApply(); render(); });
    }
    // CONTROL: a click on the row's own title opens the RECORD panel when it slides over (docked, it is beside the table)
    {
      await p.evaluate(() => { try { drawerClose(); } catch (e) {} });
      await press(p, `#row-${id} .t1`); const s = await st(p);
      const cur = await p.evaluate(() => curRow);
      // docked below 1400 the panel is a drawer, on purpose (v1.90: one editor at every size)
      const slides = layout === 'sliding' || w <= 1400;
      chk(`${tag} · CONTROL: a click on the row’s title selects it${slides ? ' and opens the RECORD panel over the table' : ', beside the table'}`,
        cur === id && (slides ? (s.drawer && s.scrim) : !s.scrim), JSON.stringify({ cur, s }));
    }
    chk(`${tag} · nothing threw`, errs.length === 0, errs.slice(0, 3).join(' | '));
    await ctx.close();
  } catch (e) { chk(`${tag} · the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 200)); }
}

// ── B. TYPE, THEN CLICK THE NEXT BOX ────────────────────────────────────────────────────────────────────────────────────
// The figure's change is applied on the mousedown of the next click, and its redraw rebuilt the rows under the pointer: the
// box clicked was gone before it took the keyboard. Every figure must be stored, and the box clicked must have the keyboard.
if (want('B')) for (const [layout, w, h] of [['sliding', 1366, 768], ['docked', 1920, 1000]]) {
  const tag = `B · ${layout} ${w}`;
  try {
    const { p, ctx, errs, dlg, id } = await open(layout, w, h);
    // in the drill: a request, the next service's request, then an allocation, each reached by a click
    await press(p, box(id, 'clinSetAsk', 'b0', 0)); await typeIn(p, '400001', null);
    await press(p, box(id, 'clinSetAsk', 'b0', 1)); const s1 = await st(p); await typeIn(p, '77001', null);
    await press(p, box(id, 'setClinSvc', 'b0', 2)); const s2 = await st(p); await typeIn(p, '12345', 'Tab');
    const r = await read(p, id);
    chk(`${tag} · in the drill, three figures typed and moved between with the mouse: all three are stored`,
      r.ask.b0[0] === 400001 && r.ask.b0[1] === 77001 && r.grid.b0[2] === 12345, JSON.stringify({ ask: r.ask.b0, grid: r.grid.b0 }));
    chk(`${tag} · and each box clicked had the keyboard`, /clinSetAsk\("R\d+","b0",1\)/.test(s1.focus) && /setClinSvc\("R\d+","b0",2\)/.test(s2.focus) && quiet(s2, layout),
      JSON.stringify({ s1, s2 }));
    // a drill button pressed straight after typing does its work on that first press
    await press(p, box(id, 'setClinSvc', 'b0', 0)); await typeIn(p, '999', null);
    dlg.answers = [true]; const n0 = dlg.seen.length;
    await press(p, btn(id, 'clinToRow'), { wait: 300 });
    const r2 = await read(p, id);
    chk(`${tag} · typed, then ↑ Apply grid to row: the figure is stored and the button’s question comes on the first press`,
      r2.grid.b0[0] === 999 && dlg.seen.length === n0 + 1 && /"m":"s"/.test(r2.alloc), JSON.stringify({ grid: r2.grid.b0, asked: dlg.seen.slice(n0), alloc: r2.alloc }));
    // a row figure, then a CLIN box: the rank box, then the added CLIN's request
    await press(p, `#row-${id} input[onchange^="setRank("]`); await typeIn(p, '3', null);
    await press(p, box(id, 'clinSetAsk', 'n1', 3)); const s3 = await st(p); await typeIn(p, '5000', 'Enter');
    const r3 = await read(p, id);
    chk(`${tag} · the rank typed, then a CLIN box clicked: the rank is set and the CLIN box takes its figure`,
      r3.rank === 3 && r3.ask.n1[3] === 5000 && /clinSetAsk/.test(s3.focus), JSON.stringify({ rank: r3.rank, ask: r3.ask.n1, s3 }));
    // Fund: one row's allocation, then the next row's, by clicking
    await p.evaluate(() => { uiMode = 'fund'; uiApply(); render(); });
    const [a, c] = await p.evaluate(() => [S.order[4], S.order[5]]);
    await press(p, `#row-${a} input[onchange^="setAlloc("]`); await typeIn(p, '1234567', null);
    await press(p, `#row-${c} input[onchange^="setAlloc("]`); const s4 = await st(p); await typeIn(p, '2345678', 'Enter');
    const al = await p.evaluate(([a, c]) => [JSON.stringify(S.alloc[a]), JSON.stringify(S.alloc[c])], [a, c]);
    chk(`${tag} · Fund: one row’s allocation typed, the next row’s clicked and typed: both are stored`,
      al[0] === q({ m: 't', v: 1234567 }) && al[1] === q({ m: 't', v: 2345678 }) && /setAlloc/.test(s4.focus), JSON.stringify({ al, s4 }));
    // the RECORD panel's value by service, the same way
    await p.evaluate(() => { uiMode = 'review'; uiApply(); render(); });
    const rid = await p.evaluate(() => S.order[6]);
    await press(p, `#row-${rid} .t1`); await p.waitForTimeout(250);
    const pv = `#inspector input[onchange^=${q('setAsk(' + q(rid) + ',')}]`;
    await press(p, pv.replace(']', '][onchange*=",0,"]')); await typeIn(p, '111111', null);
    await press(p, pv.replace(']', '][onchange*=",1,"]')); const s5 = await st(p); await typeIn(p, '222222', 'Tab');
    const av = await p.evaluate(rid => itemById(rid).ask.slice(0, 2), rid);
    chk(`${tag} · the RECORD panel’s value by service, typed and moved between with the mouse: both stored`,
      av[0] === 111111 && av[1] === 222222 && /setAsk/.test(s5.focus), JSON.stringify({ av, s5 }));
    chk(`${tag} · nothing threw`, errs.length === 0, errs.slice(0, 3).join(' | '));
    await ctx.close();
  } catch (e) { chk(`${tag} · the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 200)); }
}

// ── C. A REDRAW WHILE A ROW FIGURE IS HALF TYPED ─────────────────────────────────────────────────────────────────────────
// What a Live view tick does every 30 s by default: render(), from outside, with the keyboard in a row's box. Chromium fires
// change on a focused field as innerHTML removes it, so the half-typed figure used to be committed by the redraw.
if (want('C')) for (const [layout, w, h] of [['sliding', 1920, 1000], ['docked', 1366, 768]]) {
  const tag = `C · ${layout} ${w}`;
  try {
    const { p, ctx, errs, id } = await open(layout, w, h, 'fund');
    const cases = [
      ['Fund’s allocation box', `#row-${id} input[onchange^="setAlloc("]`, () => p.evaluate(id => JSON.stringify(S.alloc[id] === undefined ? null : S.alloc[id]), id),
        v => v === q({ m: 't', v: 123456 })],
      ['a CLIN’s request', box(id, 'clinSetAsk', 'b1', 0), () => p.evaluate(id => clinList(id)[1].ask[0], id), v => v === 123456],
    ];
    for (const [what, sel, get, done] of cases) {
      const v0 = await get();
      await press(p, sel); await typeIn(p, '12', null);
      await p.evaluate(() => render());
      await p.waitForTimeout(120);
      const mid = await p.evaluate(sel => { const i = document.querySelector(sel); return { shown: i ? i.value : null, kb: document.activeElement === i }; }, sel);
      const v1 = await get();
      chk(`${tag} · ${what}: a redraw while it is half typed commits nothing, and the typing and the keyboard stay`,
        JSON.stringify(v1) === JSON.stringify(v0) && mid.shown === '12' && mid.kb, JSON.stringify({ before: v0, after: v1, mid }));
      await p.keyboard.type('3456'); await p.keyboard.press('Tab'); await p.waitForTimeout(200);
      const v2 = await get();
      chk(`${tag} · ${what}: leaving it commits the whole figure`, done(v2), JSON.stringify(v2));
    }
    // typed whole, then the redraw, then Tab with nothing typed since: a browser fires no change for a value a script put back
    {
      const sel = `#row-${id} input[onchange^="setAlloc("]`;
      await press(p, sel); await typeIn(p, '424242', null);
      await p.evaluate(() => render()); await p.waitForTimeout(120);
      const mid = await p.evaluate(id => JSON.stringify(S.alloc[id]), id);
      await p.keyboard.press('Tab'); await p.waitForTimeout(200);
      const v = await p.evaluate(id => JSON.stringify(S.alloc[id]), id);
      chk(`${tag} · Fund’s allocation typed whole, redrawn, then Tab with nothing typed since: applied then, and not before`,
        mid === q({ m: 't', v: 123456 }) && v === q({ m: 't', v: 424242 }), JSON.stringify({ mid, v }));
    }
    // the rank box, in Review
    await p.evaluate(() => { uiMode = 'review'; uiApply(); render(); });
    const k0 = await p.evaluate(id => S.order.indexOf(id) + 1, id);
    await press(p, `#row-${id} input[onchange^="setRank("]`); await typeIn(p, '1', null);
    await p.evaluate(() => render()); await p.waitForTimeout(120);
    const k1 = await p.evaluate(id => S.order.indexOf(id) + 1, id);
    const shown = await p.evaluate(id => { const i = document.querySelector('#row-' + id + ' input[onchange^="setRank("]'); return [i && i.value, document.activeElement === i]; }, id);
    chk(`${tag} · the rank box: a redraw while it is typed moves nothing, and keeps the typing and the keyboard`, k1 === k0 && shown[0] === '1' && shown[1], JSON.stringify({ k0, k1, shown }));
    await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    chk(`${tag} · the rank box: Enter then moves it`, (await p.evaluate(id => S.order.indexOf(id) + 1, id)) === 1, '');
    chk(`${tag} · nothing threw`, errs.length === 0, errs.slice(0, 3).join(' | '));
    await ctx.close();
  } catch (e) { chk(`${tag} · the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 200)); }
}

// ── D. THE WAYS INTO THE DRILL FROM ELSEWHERE ────────────────────────────────────────────────────────────────────────────
const drillState = (p, id) => p.evaluate(id => {
  const r = document.getElementById('row-' + id), d = r && r.querySelector('.clin-detail'), a = document.activeElement;
  const ins = document.getElementById('inspector'), sc = document.getElementById('drawerScrim'), ed = document.getElementById('editPanel'), mt = document.getElementById('matPanel');
  let onTop = false;
  if (a && d && d.contains(a)) { const b = a.getBoundingClientRect(), e = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2); onTop = e === a; }
  return { drill: !!d, kbInDrill: !!(a && d && d.contains(a)), kb: a ? a.tagName.toLowerCase() + ' ' + (a.getAttribute('onchange') || a.getAttribute('onclick') || '').slice(0, 40) : 'none',
    onTop, drawer: !!(ins && ins.classList.contains('open')), scrim: !!(sc && sc.classList.contains('on')),
    editOpen: !!(ed && ed.classList.contains('open')), classifyOpen: !!(mt && mt.classList.contains('open')), inPanel: !!(a && a.closest && a.closest('#inspector')) };
}, id);
if (want('D')) for (const [layout, w, h] of LAYOUTS) {
  const tag = `D · ${layout} ${w}`;
  try {
    const { p, ctx, errs, id } = await open(layout, w, h);
    // the edit box's way in, with the drill shut and with it already open
    for (const shut of [true, false]) {
      await p.evaluate(([id, shut]) => { if (shut) clinOpen[id] = false; try { drawerClose(); } catch (e) {} render(); }, [id, shut]);
      await press(p, `#row-${id} .t1`); await p.waitForTimeout(250);
      await press(p, `#inspector button[onclick^="toggleRec("]`, { wait: 300 });
      const opened = await p.evaluate(() => !!(document.getElementById('editPanel') || {}).classList && document.getElementById('editPanel').classList.contains('open'));
      await press(p, `#editPanel button[onclick="erGo('clin')"]`, { wait: 350 });
      const s = await drillState(p, id);
      chk(`${tag} · the edit box’s Open the 🧾 CLIN drill (drill ${shut ? 'shut' : 'already open'}): the box and the panel close, the drill is open, the keyboard is on its first box with nothing over it`,
        opened && s.drill && !s.editOpen && !s.scrim && !(layout === 'sliding' && s.drawer) && s.kbInDrill && s.onTop && !s.inPanel, JSON.stringify({ opened, s }));
      await typeIn(p, '515151');
      chk(`${tag} · and what is typed there is the CLIN’s`, (await read(p, id)).ask.b0[0] === 515151, '');
    }
    // the Classify grid's way in, twice: it opens the drill, and never shuts it
    for (const k of [1, 2]) {
      await p.evaluate(() => { matOpen = true; matPmo = 'ALL'; matMissing = ''; render(); });
      await p.waitForTimeout(150);
      const sel = `#matBody button[onclick^='clinGo(${q(id)})'], #matBody button[onclick^='toggleClin(${q(id)})']`;
      await press(p, sel, { wait: 350 });
      const s = await drillState(p, id);
      chk(`${tag} · the Classify grid’s Open the 🧾 CLIN drill (press ${k}): the grid closes, the drill is open, the keyboard is on its first box with nothing over it`,
        s.drill && !s.classifyOpen && !s.scrim && s.kbInDrill && s.onTop, JSON.stringify(s));
    }
    // a row's ⋯ menu left open does not eat the first click into the drill
    {
      const other = await p.evaluate(() => S.order[0]);
      await press(p, `#row-${other} .rmbtn`);
      const m = await p.evaluate(() => rowMenuId);
      await press(p, box(id, 'setClinSvc', 'b0', 1)); const s1 = await st(p);
      await typeIn(p, '24680');
      const r = await read(p, id);
      chk(`${tag} · with another row’s ⋯ menu open, the first click into a CLIN box takes the keyboard and the figure, and the menu closes`,
        m === other && /setClinSvc/.test(s1.focus) && r.grid.b0[1] === 24680 && r.menu === null
        && await p.evaluate(() => !document.querySelector('.rowmenu.open')), JSON.stringify({ m, s1, grid: r.grid.b0, menu: r.menu }));
    }
    chk(`${tag} · nothing threw`, errs.length === 0, errs.slice(0, 3).join(' | '));
    await ctx.close();
  } catch (e) { chk(`${tag} · the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 200)); }
}

// ── E. THE DRILL'S BOXES SHOW A BILLION-DOLLAR FIGURE WHOLE ─────────────────────────────────────────────────────────────
if (want('E')) for (const [layout, w, h] of LAYOUTS) {
  const tag = `E · ${layout} ${w}`;
  try {
    const { p, ctx, errs, id } = await open(layout, w, h);
    const m = await p.evaluate(id => {
      const L = clinList(id), big = 1234567890;
      L.forEach(c => { const ask = SVC.map(() => big); if (c.added) clinNew(id).find(x => x.key === c.key).ask = ask;
        else { const mm = clinMeta(id); mm[c.key] = Object.assign(mm[c.key] || {}, { ask }); }
        clinAllocMap(id)[c.key] = SVC.map(() => big); });
      render();
      const d = document.querySelector('#row-' + id + ' .clin-detail');
      const ins = [].slice.call(d.querySelectorAll('input'));
      const cut = ins.filter(i => i.scrollWidth > i.clientWidth + 1).map(i => (i.getAttribute('aria-label') || i.getAttribute('onchange')).slice(0, 40) + ' ' + i.scrollWidth + '>' + i.clientWidth);
      const cells = [].slice.call(d.querySelectorAll('td')).filter(t => !t.querySelector('input,select,button') && /\d/.test(t.textContent));
      const spill = cells.filter(t => t.scrollWidth > t.clientWidth + 1).map(t => t.textContent.trim().slice(0, 30));
      const req = ins.filter(i => /clinSetAsk/.test(i.getAttribute('onchange') || '')).length;
      return { boxes: ins.length, req, cut, spill };
    }, id);
    chk(`${tag} · every request and allocation box in the drill (${m.boxes}, ${m.req} of them requests) shows $1,234,567,890 whole, and no figure spills its cell`,
      m.boxes > 0 && m.req > 0 && !m.cut.length && !m.spill.length, JSON.stringify(m));
    chk(`${tag} · nothing threw`, errs.length === 0, errs.slice(0, 3).join(' | '));
    await ctx.close();
  } catch (e) { chk(`${tag} · the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 200)); }
}

await b.close();
console.log(bad ?`\n${bad} pointer check(s) failed\n` : '\nThe mouse reaches and edits every row and CLIN drill control, in every layout\n');
process.exit(bad ? 1 : 0);
