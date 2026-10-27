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
//   F. What the review of v2.09 found here (v2.09 review, clin-pointer), with real keys, wheel and mouse:
//      F1. Typing taken back to the board's own figure writes nothing, whichever side of a redraw it is taken back on --
//          Fund's box on a per-service allocation, the RECORD panel's Disc box on the lane walk, a CLIN's request from the
//          board's data -- and a figure typed whole, redrawn, then left is still applied (CONTROL).
//      F2. Where the drill scrolls sideways (1366 sliding, 1920 docked), a figure typed, the drill wheeled to its end, then
//          ✕ or a CLIN's WBS pressed: the drill stays where it was, and the press does its work on the first press.
//      F3. Fund's allocation box on a per-service allocation (↑ Apply grid to row with the mouse, and a nine-digit one an
//          older board may carry) shows its figure whole, inside its cell, and a click at its centre goes into it -- not
//          onto ★ -- at 1366 and 1920, sliding and docked, and at the narrow Fund columns (1600 docked, 1000).
//   G. What the second review of v2.09 found here (clin), with real keys and the mouse: after a commit the keyboard goes back to
//      the same control of the SAME requirement, or nowhere. Two primes put on a per-service allocation by ↑ Apply grid to
//      row, pressed with the mouse; in Fund, a figure typed into the first one's box and Entered keeps the keyboard there and
//      the next figure is that requirement's (on ba3c294 it went to the second's box, and replaced its allocation); Tabbed,
//      the keyboard is on the first one's ★ (it was the second's, where Space cleared its Mission Critical). And the rest keep
//      their place: the rank box, a CLIN's boxes and the RECORD panel's -- Enter stays, Tab goes to the control after it, in
//      the same requirement (the RECORD panel's lost the keyboard on every commit). And ✕ on a CLIN from the keyboard leaves
//      the keyboard nowhere, not on the next CLIN's ✕ moved into its place. 1366 and 1920, sliding and docked.
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

// ── F. THE REVIEW OF v2.09 (clin-pointer) ───────────────────────────────────────────────────────────────────────────────
// F1. A REDRAW NEVER TURNS TYPING THAT WAS TAKEN BACK INTO A WRITE. Keys as a person presses them; 'R' is render() from
// outside, as a Live view tick does. On 9bc5496 a per-service allocation of $1,000,000 on USAF became six services' shares.
const keyRun = async (p, steps) => {
  for (const s of steps) {
    if (s === 'R') { await p.evaluate(() => render()); await p.waitForTimeout(80); }
    else if (s.startsWith('type:')) await p.keyboard.type(s.slice(5));
    else await p.keyboard.press(s);
  }
  await p.waitForTimeout(250);
};
if (want('F')) {
  const tag = 'F1 · sliding 1920 (Fund) and docked 1920 (the RECORD panel)';
  try {
    {
      const { p, ctx, errs, id } = await open('sliding', 1920, 1000, 'fund');
      const rid = await p.evaluate(pid => S.order.find((x, i) => i > 2 && x !== pid && !S.fsrc[x] && !CLINS[x]), id);
      const reset = () => p.evaluate(r => { S.alloc[r] = { m: 's', v: SVC.map((s, i) => i === 0 ? 1000000 : 0) }; try { document.activeElement.blur(); } catch (e) {} save(); render(); }, rid);
      const snap = () => p.evaluate(r => JSON.stringify([S.alloc[r], svcAlloc(itemById(r))]), rid);
      const sel = `#row-${rid} input[onchange^="setAlloc("]`;
      for (const [what, steps, applied] of [
        ['a digit typed and taken back, a redraw, then Tab', ['End', 'type:7', 'Backspace', 'R', 'Tab'], false],
        ['a digit typed and taken back, a redraw, then Enter', ['End', 'type:7', 'Backspace', 'R', 'Enter'], false],
        ['a digit typed, a redraw, then taken back and Tab', ['End', 'type:7', 'R', 'Backspace', 'Tab'], false],
        ['CONTROL: a figure typed whole (1,200,000), a redraw, then Tab', ['Control+A', 'type:1,200,000', 'R', 'Tab'], true],
      ]) {
        await reset(); const s0 = await snap();
        // the keyboard is put in the box by focus, not a click: a click there is F3's to judge (on 9bc5496 it landed on ★)
        const h = await p.$(sel); await h.evaluate(e => { e.scrollIntoView({ block: 'center' }); e.focus(); });
        await keyRun(p, steps); const s1 = await snap();
        const ok = applied ? JSON.parse(s1)[0].m === 't' && JSON.parse(s1)[0].v === 1200000 : s1 === s0;
        chk(`${tag} · Fund’s box on a per-service allocation, ${what}: ${applied ? 'the figure is applied' : 'nothing is written'}`, ok, JSON.stringify({ before: s0, after: s1 }));
      }
      // a CLIN from the board's data: its request taken back around a redraw records no override over the data
      await p.evaluate(() => { uiMode = 'review'; uiApply(); render(); });
      for (const steps of [['End', 'type:7', 'Backspace', 'R', 'Tab'], ['End', 'type:7', 'R', 'Backspace', 'Tab']]) {
        await press(p, box(id, 'clinSetAsk', 'b0', 0)); await keyRun(p, steps); const r = await read(p, id);
        chk(`${tag} · a CLIN’s request from the board’s data, ${steps.join(' ')}: no override recorded over the data`, r.meta === '{}' && r.ask.b0[0] === 100000, JSON.stringify({ meta: r.meta, ask: r.ask.b0 }));
      }
      chk(`${tag} · Fund: nothing threw`, errs.length === 0, errs.slice(0, 3).join(' | '));
      await ctx.close();
    }
    {
      const { p, ctx, errs, id } = await open('docked', 1920, 1000);
      const rid = await p.evaluate(pid => S.order.find((x, i) => i > 2 && x !== pid && !S.fsrc[x] && !S.alloc[x] && !CLINS[x]), id);
      for (const steps of [['End', 'type:7', 'Backspace', 'R', 'Tab'], ['End', 'type:7', 'R', 'Backspace', 'Tab']]) {
        await p.evaluate(r => { delete S.fsrc[r]; try { document.activeElement.blur(); } catch (e) {} setCur(r); save(); render(); }, rid); await p.waitForTimeout(150);
        const sel = `#inspector input[onchange^=${q('setFsrcSvc(' + q(rid) + ',"d",0,')}]`;
        const top = await press(p, sel); await keyRun(p, steps);
        const f = await p.evaluate(r => JSON.stringify(S.fsrc[r] || null), rid);
        chk(`${tag} · the RECORD panel’s Disc box on the lane walk, ${steps.join(' ')}: the requirement is not converted to a Split`, top.on && f === 'null', JSON.stringify({ top, fsrc: f }));
      }
      chk(`${tag} · the panel: nothing threw`, errs.length === 0, errs.slice(0, 3).join(' | '));
      await ctx.close();
    }
  } catch (e) { chk(`${tag} · the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 200)); }

  // F2. THE DRILL KEEPS ITS SIDEWAYS SCROLL, SO A BUTTON PRESSED AFTER TYPING IS STILL UNDER THE POINTER WHEN IT COMES UP
  for (const [layout, w, h] of [['sliding', 1366, 768], ['docked', 1920, 1000]]) {
    const t2 = `F2 · ${layout} ${w}`;
    try {
      const { p, ctx, errs, dlg, id } = await open(layout, w, h);
      const sc = `#row-${id} .cscroll`;
      const geo = await p.evaluate(sc => { const c = document.querySelector(sc); return { box: c.clientWidth, table: c.scrollWidth }; }, sc);
      chk(`${t2} · CONTROL: the drill here is wider than its row (${geo.table} in ${geo.box}), so ✕ and WBS are reached by scrolling it`, geo.table > geo.box + 20, JSON.stringify(geo));
      // a figure typed, the drill wheeled to its end with the pointer over it, then the button pressed where it now is
      const typeWheelPress = async (j, fig, target, answers) => {
        await press(p, box(id, 'clinSetAsk', 'b0', j)); await typeIn(p, fig, null);
        const cb = await (await p.$(sc)).boundingBox();
        await p.mouse.move(cb.x + cb.width / 2, cb.y + Math.min(cb.height / 2, 40)); await p.mouse.wheel(4000, 0); await p.waitForTimeout(250);
        const s0 = await p.evaluate(sc => document.querySelector(sc).scrollLeft, sc);
        const bb = await (await p.$(target)).boundingBox(); const x = bb.x + bb.width / 2, y = bb.y + bb.height / 2;
        const on = await p.evaluate(([x, y, t]) => { const e = document.elementFromPoint(x, y), n = document.querySelector(t); return !!(e && n && (e === n || n.contains(e))); }, [x, y, target]);
        dlg.answers = answers.slice(); const n0 = dlg.seen.length;
        await p.mouse.click(x, y); await p.waitForTimeout(350);
        const s1 = await p.evaluate(sc => document.querySelector(sc).scrollLeft, sc);
        return { s0, s1, on, asked: dlg.seen.slice(n0), r: await read(p, id) };
      };
      const x1 = await typeWheelPress(0, '12345', btn(id, 'clinRemove', 'b1'), [false]);
      chk(`${t2} · a request typed, the drill wheeled to its end (${x1.s0}px), then ✕ on CLIN 0002 pressed: the drill stays at ${x1.s0}px and the button asks its question on that press`,
        x1.on && x1.s0 > 0 && x1.s1 === x1.s0 && x1.asked.length === 1 && /Remove CLIN/.test(x1.asked[0]) && x1.r.ask.b0[0] === 12345 && x1.r.keys.length === 3,
        JSON.stringify({ on: x1.on, s0: x1.s0, s1: x1.s1, asked: x1.asked, ask: x1.r.ask.b0, keys: x1.r.keys }));
      const wsel = `#row-${id} button[onclick=${q('toggleWbs("clin",' + q(id) + ',"b1")')}]`;
      const x2 = await typeWheelPress(1, '23456', wsel, []);
      chk(`${t2} · a request typed, the drill wheeled to its end, then CLIN 0002’s WBS pressed: the drill stays put and the WBS panel opens on that press`,
        x2.on && x2.s0 > 0 && x2.s1 === x2.s0 && x2.r.wbsOpen && x2.r.ask.b0[1] === 23456, JSON.stringify({ on: x2.on, s0: x2.s0, s1: x2.s1, wbs: x2.r.wbsOpen, ask: x2.r.ask.b0 }));
      chk(`${t2} · nothing threw`, errs.length === 0, errs.slice(0, 3).join(' | '));
      await ctx.close();
    } catch (e) { chk(`${t2} · the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 200)); }
  }

  // F3. FUND'S ALLOCATION BOX ON A PER-SERVICE ALLOCATION SHOWS ITS FIGURE AND TAKES A CLICK. Its SVC tag took the whole cell:
  // the box was 14px under ★, and a click on it set Mission Critical (9bc5496, and v2.08).
  for (const [layout, w, h] of [['sliding', 1366, 768], ['sliding', 1920, 1000], ['docked', 1920, 1000], ['docked', 1600, 900], ['sliding', 1000, 768]]) {
    const t3 = `F3 · ${layout} ${w}`;
    try {
      const { p, ctx, errs, dlg, id } = await open(layout, w, h);
      dlg.answers = [true]; await press(p, btn(id, 'clinToRow'), { wait: 300 });
      const big = await p.evaluate(pid => { const r = S.order.find((x, i) => i > 2 && x !== pid && !S.fsrc[x] && !CLINS[x]);
        S.alloc[r] = { m: 's', v: SVC.map((s, i) => i === 0 ? 704562659 : 0) }; try { drawerClose(); } catch (e) {} uiMode = 'fund'; uiApply(); save(); render(); return r; }, id);
      for (const [what, rid, fig] of [['the prime, after ↑ Apply grid to row with the mouse', id, null], ['a nine-digit per-service allocation', big, '704,562,659']]) {
        const sel = `#row-${rid} .acts.alloc input`;
        // the box itself to the middle of the window: the prime's row holds its open drill, and centring the whole row put
        // the box under the sticky top
        await p.evaluate(sel => document.querySelector(sel).scrollIntoView({ block: 'center' }), sel); await p.waitForTimeout(100);
        const g = await p.evaluate(([r, sel]) => { const row = document.getElementById('row-' + r), c = row.querySelector('.acts.alloc'), i = document.querySelector(sel),
            tg = c.querySelector('.mode-tag'), mc = row.querySelector('.mcb');
          const R = e => e.getBoundingClientRect(), ir = R(i), cr = R(c), tr = tg ? R(tg) : null, mr = R(mc);
          const at = document.elementFromPoint(ir.left + ir.width / 2, ir.top + ir.height / 2);
          return { alloc: JSON.stringify(S.alloc[r]), value: i.value, client: i.clientWidth, scroll: i.scrollWidth, width: Math.round(ir.width),
            inCell: ir.left >= cr.left - 0.5 && ir.right <= cr.right + 0.5, besideStar: ir.right <= mr.left + 0.5,
            tag: !!tr && tr.width > 0 && tr.left >= cr.left - 0.5 && tr.right <= cr.right + 0.5, onTop: at === i, mc: !!S.mc[r] }; }, [rid, sel]);
        chk(`${t3} · ${what} (${g.alloc}): its box shows ${g.value} whole (${g.scroll} in ${g.client}), inside its cell beside ★, the SVC tag on it, and nothing over its centre`,
          /"m":"s"/.test(g.alloc) && (!fig || g.value === fig) && g.scroll <= g.client + 1 && g.inCell && g.besideStar && g.tag && g.onTop, JSON.stringify(g));
        const top = await press(p, sel); const s = await st(p);
        const after = await p.evaluate(r => !!S.mc[r], rid);
        await typeIn(p, '2,500,000');
        const a2 = await p.evaluate(r => JSON.stringify(S.alloc[r]), rid);
        chk(`${t3} · ${what}: a click at its centre goes into the box (★ left as it was, the RECORD panel off the table), and the figure typed is stored`,
          top.on && /setAlloc/.test(s.focus) && quiet(s, layout) && after === g.mc && a2 === q({ m: 't', v: 2500000 }), JSON.stringify({ top, s, mc: [g.mc, after], alloc: a2 }));
      }
      chk(`${t3} · nothing threw`, errs.length === 0, errs.slice(0, 3).join(' | '));
      await ctx.close();
    } catch (e) { chk(`${t3} · the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 200)); }
  }
}

// ── G. THE SECOND REVIEW OF v2.09 (clin): AFTER A COMMIT, THE SAME REQUIREMENT'S CONTROL OR NOWHERE ─────────────────────────
// The keyboard's place across a redraw was found again by the control's first class; Fund's box on a per-service allocation
// is class svcmode and loses it once a total is typed, so the count across the list took the next per-service requirement's.
if (want('G')) for (const [layout, w, h] of LAYOUTS) {
  const tag = `G · ${layout} ${w}`;
  try {
    const { p, ctx, errs, dlg, id } = await open(layout, w, h);
    // a second prime, after the first in the list; neither on a Split, so ↑ Apply grid to row is offered on both
    const id2 = await p.evaluate(pid => { const r = S.order.find((x, i) => i > S.order.indexOf(pid) + 1 && !CLINS[x]);
      S.ptype[r] = 'PRIME'; CLINS[r] = [{ clin: '0101', desc: 'Second prime line', ccar: '', ask: [300000, 40000, 0, 0, 0, 0] }];
      delete S.fsrc[pid]; delete S.fsrc[r]; delete S.alloc[pid]; delete S.alloc[r]; clinOpen[r] = true; save(); render(); return r; }, id);
    for (const r of [id, id2]) { dlg.answers = [true]; await press(p, btn(r, 'clinToRow'), { wait: 300 }); }
    const al = () => p.evaluate(([a, c]) => [S.alloc[a], S.alloc[c]].map(x => JSON.stringify(x === undefined ? null : x)), [id, id2]);
    const [a0, c0] = await al();
    const others = () => p.evaluate(([a, c]) => JSON.stringify(Object.keys(S.alloc).filter(k => k !== a && k !== c).sort().map(k => [k, S.alloc[k]]).concat(Object.keys(S.mc).filter(k => k !== a && k !== c).sort().map(k => [k, !!S.mc[k]]))), [id, id2]);
    chk(`${tag} · CONTROL: ↑ Apply grid to row pressed with the mouse on both primes puts each on a per-service allocation`, /"m":"s"/.test(a0) && /"m":"s"/.test(c0), JSON.stringify({ a0, c0 }));
    await p.evaluate(() => { try { drawerClose(); } catch (e) {} uiMode = 'fund'; uiApply(); render(); });
    const fb = r => `#row-${r} input[onchange^="setAlloc("]`;
    const o0 = await others();
    // G1. Enter: the keyboard stays on the first prime's box, and the next figure is the first prime's
    await press(p, fb(id)); await typeIn(p, '500,000');
    const s1 = await st(p);
    await typeIn(p, '520,000');
    const s2 = await st(p), [a1, c1] = await al();
    chk(`${tag} · Fund: 500,000 typed into the first prime’s box and Entered: the keyboard stays on that box, not the second prime’s`,
      s1.focus === `input setAlloc(${q(id)})`, JSON.stringify(s1));
    chk(`${tag} · and the next figure typed and Entered, 520,000, is the first prime’s total; the second keeps its per-service allocation, and nothing else moved`,
      a1 === q({ m: 't', v: 520000 }) && c1 === c0 && s2.focus === `input setAlloc(${q(id)})` && (await others()) === o0, JSON.stringify({ a1, c1, c0, s2 }));
    // G2. Tab: the keyboard is on the first prime's ★, and Space there is the first prime's
    await p.evaluate(([r, v]) => { S.alloc[r] = JSON.parse(v); save(); render(); }, [id, a0]);
    const mc0 = await p.evaluate(([a, c]) => [!!S.mc[a], !!S.mc[c]], [id, id2]);
    await press(p, fb(id)); await typeIn(p, '500,000', 'Tab');
    const s3 = await st(p);
    await p.keyboard.press('Space'); await p.waitForTimeout(200);
    const mc1 = await p.evaluate(([a, c]) => [!!S.mc[a], !!S.mc[c]], [id, id2]), [, c3] = await al();
    chk(`${tag} · Fund: 500,000 typed into the first prime’s box and Tabbed: the keyboard is on the first prime’s ★, not the second’s`,
      s3.focus.startsWith(`button S.mc[${q(id)}]`), JSON.stringify(s3));
    chk(`${tag} · and Space there turns the first prime’s ★, the second prime’s ★ and allocation as they were, and nothing else moved`,
      mc1[0] === !mc0[0] && mc1[1] === mc0[1] && c3 === c0 && (await others()) === o0, JSON.stringify({ mc0, mc1, c3, c0 }));
    // G3. the rank box, in Review: Enter stays on it where the row has moved to; Tab goes on within the same requirement
    await p.evaluate(() => { uiMode = 'review'; uiApply(); render(); });
    const rr = await p.evaluate(pid => S.order.find((x, i) => i > 6 && !CLINS[x]), id), rb = `#row-${rr} input[onchange^="setRank("]`;
    await press(p, rb); await typeIn(p, '4');
    const s4 = await st(p), k4 = await p.evaluate(r => S.order.indexOf(r) + 1, rr);
    await press(p, rb); await typeIn(p, '6', 'Tab');
    const s5 = await p.evaluate(r => { const a = document.activeElement, row = a && a.closest && a.closest('.row[id]'); return { row: row ? row.id : '', h: a ? (a.getAttribute('onclick') || a.getAttribute('onchange') || '').slice(0, 40) : '' }; }, rr);
    chk(`${tag} · the rank box: 4 Entered moves the requirement to 4 and the keyboard stays on its rank box; 6 Tabbed moves it again and the keyboard goes on to a control of the same requirement`,
      k4 === 4 && s4.focus === `input setRank(${q(rr)})` && s5.row === 'row-' + rr && s5.h.indexOf(q(rr)) >= 0 && (await p.evaluate(r => S.order.indexOf(r) + 1, rr)) === 6,
      JSON.stringify({ k4, s4, s5 }));
    // G4. a CLIN's boxes: Enter stays on the box; Tab goes to the next service's box of the same CLIN
    await press(p, box(id, 'clinSetAsk', 'b0', 1)); await typeIn(p, '33333');
    const s6 = await st(p);
    await press(p, box(id, 'setClinSvc', 'b0', 1)); await typeIn(p, '4444', 'Tab');
    const s7 = await st(p), r7 = await read(p, id);
    chk(`${tag} · a CLIN’s boxes: a request Entered keeps the keyboard on it; an allocation Tabbed goes on to the next service’s allocation of the same CLIN; both stored`,
      s6.focus === `input clinSetAsk(${q(id)},"b0",1)` && s7.focus === `input setClinSvc(${q(id)},"b0",2)` && r7.ask.b0[1] === 33333 && r7.grid.b0[1] === 4444,
      JSON.stringify({ s6, s7, ask: r7.ask.b0, grid: r7.grid.b0 }));
    // a control removed: ✕ on CLIN 0001 from the keyboard; the keyboard must not be left on CLIN 0002's ✕, moved into its place
    await p.evaluate(sel => { const b = document.querySelector(sel); b.scrollIntoView({ block: 'center' }); b.focus(); }, btn(id, 'clinRemove', 'b0'));
    dlg.answers = [true]; await p.keyboard.press('Enter'); await p.waitForTimeout(250);
    const s10 = await st(p), r10 = await read(p, id);
    chk(`${tag} · ✕ on CLIN 0001 from the keyboard: the line is removed and the keyboard goes nowhere -- not to CLIN 0002’s ✕ in its place, where the next Enter would remove it`,
      s10.focus === 'body' && r10.keys.join() === 'b1:0002,n1:0003', JSON.stringify({ s10, keys: r10.keys }));
    // G5. the RECORD panel's boxes: Enter stays; Tab goes on to the box after it, in the same requirement's panel
    const rid = await p.evaluate(pid => S.order.find((x, i) => i > 3 && !CLINS[x] && x !== pid), id);
    await press(p, `#row-${rid} .t1`); await p.waitForTimeout(250);
    const pv = j => `#inspector input[onchange^=${q('setAsk(' + q(rid) + ',' + j + ',')}]`;
    await press(p, pv(0)); await typeIn(p, '123456');
    const s8 = await st(p);
    await press(p, pv(1)); await typeIn(p, '23456', 'Tab');
    const s9 = await p.evaluate(r => { const a = document.activeElement; return { inPanel: !!(a && a.closest && a.closest('#inspector')), cur: curRow,
      h: a ? (a.getAttribute('onchange') || a.getAttribute('onclick') || '').slice(0, 40) : '' }; }, rid);
    const av = await p.evaluate(r => itemById(r).ask.slice(0, 2), rid);
    chk(`${tag} · the RECORD panel: the value by service Entered keeps the keyboard on that box; the next one Tabbed goes on to the box after it in the same requirement’s panel; both stored`,
      s8.focus === `input setAsk(${q(rid)},0)` && s8.inPanel && s9.inPanel && s9.cur === rid && s9.h.indexOf(q(rid)) >= 0 && s9.h.indexOf('setAsk(' + q(rid) + ',1,') < 0 && av[0] === 123456 && av[1] === 23456,
      JSON.stringify({ s8, s9, av }));
    chk(`${tag} · nothing threw`, errs.length === 0, errs.slice(0, 3).join(' | '));
    await ctx.close();
  } catch (e) { chk(`${tag} · the section ran on this board`, false, String(e.message || e).split('\n')[0].slice(0, 200)); }
}

await b.close();
console.log(bad ?`\n${bad} pointer check(s) failed\n` : '\nThe mouse reaches and edits every row and CLIN drill control, in every layout\n');
process.exit(bad ? 1 : 0);
