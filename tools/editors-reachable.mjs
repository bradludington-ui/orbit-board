// EVERY EDITOR MUST BE REACHABLE AT EVERY WIDTH PEOPLE ACTUALLY USE, AND THE PAGE MUST NOT SCROLL
// SIDEWAYS.
//
// The grid build hid its docked RECORD panel below 1400px (`.inspector{display:none}`), and because
// that build deliberately RETIRED the row editor — the row is triage, the panel is the editor —
// hiding it left no editor at all. On a 1366x768 laptop, the commonest screen there is, the
// description, the per-service requirement value and the record fields were simply gone, with
// nothing on screen to say why. Every suite passed: jsdom has no layout, so nothing in the audit
// could see it. Only a real browser at a real width can, which is what this does.
//
// It also holds two affordance rules that went wrong the same way — invisibly, because they are
// geometry and cursor, not arithmetic:
//   * the document must never scroll sideways (the scoreboard's 1fr tracks could not shrink below
//     their nowrap content, and the grid's own column minimums added to a 1150px floor);
//   * a chip may look clickable ONLY if it is (`.rchip` gave every chip a pointer and a hover
//     highlight, including the RECORD panel's echo of the impact chip — the one field the whole
//     PMO workflow exists to collect, inviting a click that went nowhere).
//
// TWICE, THE SECOND TIME IN WINDOWS' FONT (v1.95, item 57). The board asks for 'Segoe UI', which this machine does
// not have, so the first pass measures it in Liberation Sans (Arial's widths) -- where v1.94's editor labels fitted
// with nothing to spare, and Edge on Windows cut them off at 1440x900. The second pass runs every check again on a
// copy that declares a Segoe-like stand-in, 6% wider and as tall as Segoe UI (font-standin.mjs), after proving on
// each page that the stand-in is the font being drawn.
//
//   node tools/editors-reachable.mjs
import { chromium } from 'playwright-core';
import { boot, seed } from './export-audit/boot.mjs';
import { writeFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { CHROME } from './chrome.mjs';
import { STANDIN_SCALE, withStandin, standinProblem } from './font-standin.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
// A board with requirements on it. An empty board has no row to select and no editor to miss, so
// it would pass this every time while saying nothing.
const SVCN = ['USAF','ANG','AFRC','STOVL','USMC-C','USN'];
const items = Array.from({length:40}, (_,i)=>({
  id:'R'+String(i).padStart(3,'0'), grp:['PSM','ATL','TSS','SE'][i%4], team:'t', sect:'', custom:false,
  title:'Sustainment of fielded capability '+i, event:'Plan event '+i, ccar:'CC'+(40000+i),
  fy26:SVCN.map(()=>0), ask:SVCN.map((_,j)=>((i*7+j*13)%38+4)*100000), alloc:null }));
const sc = { services:SVCN, items, disc:SVCN.map(()=>18000000), mand:SVCN.map(()=>6000000),
             order:items.map(x=>x.id) };

const dir = mkdtempSync(join(tmpdir(),'spmt-view-'));
process.on('exit', () => { try { rmSync(dir, { recursive: true, force: true }); } catch {} });   // the copies are scratch; leave nothing behind
const made = {};
for (const f of ['prioritization-board-grid.html']) {
  // Boot each build FROM ITS OWN BYTES. boot.mjs resolves BOARD once at module load, so setting
  // process.env.BOARD here would be ignored and both fixtures would silently be the same build --
  // which is exactly what happened first time round, and the grid fixture then failed at every
  // width because a card board has no row selection to open an editor with.
  const { ev } = boot({ html: readFileSync(resolve(ROOT, f), 'utf8') });
  seed(ev, sc);
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.order.forEach(function(id,i){ if(i%3!==2) S.desc[id]='A description.'; });
      S.awards.R004={mode:'inc', d:FYMON[1][0], inc:[1,3,5,7].map(function(k){ return {d:FYMON[k][0], day:1, sv:SVC.map(function(){ return 100000; })}; })};
      applyState(S); save(); 'ok'`);
  const out = join(dir, f);
  writeFileSync(out, ev('buildSavedHtml()'));
  made[f] = out;
  const seg = join(dir, 'segoe-standin-' + f);
  writeFileSync(seg, withStandin(readFileSync(out, 'utf8')));
  made[f + `, Segoe stand-in +${STANDIN_SCALE - 100}%`] = seg;
}
const standin = f => /Segoe stand-in/.test(f);

// 1400 and 1366 straddle the breakpoint the drawer turns on; 1024 is a half-tiled window.
const WIDTHS = [1920, 1600, 1440, 1400, 1366, 1280, 1024];
const b = await chromium.launch({ executablePath: CHROME,
                                  args:['--no-sandbox'] });
let bad = 0;
for (const [f, file] of Object.entries(made)) {
  const grid = /grid/.test(f);
  console.log('\n' + f);
  for (const w of WIDTHS) {
    const ctx = await b.newContext({ viewport:{width:w, height:768} });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + file);
    await p.waitForFunction(()=>typeof render==='function' && document.querySelectorAll('.row').length>0,
      null, {timeout:30000});
    const font = standin(f) ? await standinProblem(p) : null;
    // Open the editor the way a person does: select the row in grid, open the detail in card.
    if (grid) { await p.click('#row-R003'); }
    else { await p.evaluate(()=>toggleDetail('R003')); }
    await p.waitForTimeout(300);
    const r = await p.evaluate(()=>{
      const vis = el => { if(!el) return false; const c=el.getBoundingClientRect();
        return c.width>0 && c.height>0 && getComputedStyle(el).visibility!=='hidden'; };
      // WHERE the panel is, not just whether it exists. Docked, it must sit BESIDE the rows; the
      // drawer's scrim once sat between them as a grid item, took column two, and pushed the panel
      // onto a second implicit row in column one -- rendering it underneath the rows while the
      // column beside them stayed empty. Every reachability check still passed: the editors were
      // all there, in the wrong place, and the board looked like the panel had stopped appearing.
      const _ins = document.querySelector('#inspector'), _wrap = document.querySelector('.gridwrap');
      const _place = (() => {
        if (!_ins || !_wrap) return 'n/a';
        const i = _ins.getBoundingClientRect(), w = _wrap.getBoundingClientRect();
        if (!(i.width > 0 && i.height > 0)) return 'not shown';
        if (getComputedStyle(_ins).position === 'fixed') return 'drawer';
        return i.left >= w.right - 1 ? 'beside the rows'
             : (i.top >= w.bottom - 1 ? 'BELOW the rows' : 'OVERLAPPING the rows');
      })();
      const _scrim = document.querySelector('.drawerscrim');
      const _scrimShown = !!(_scrim && getComputedStyle(_scrim).display !== 'none');
      const reach = pred => [...document.querySelectorAll('[onclick],input,textarea,select,button')]
        .filter(e => pred(((e.getAttribute('onclick')||'')+' '+(e.getAttribute('onchange')||''))) && vis(e)).length;
      const lookalike = [...document.querySelectorAll('.rchip')].filter(e => {
        const c = e.getBoundingClientRect();
        return c.width>0 && !e.getAttribute('onclick') && getComputedStyle(e).cursor==='pointer'; }).length;
      // v1.95 (item 57): the RECORD panel's editor buttons say what they are in full at every width -- a label that
      // does not fit wraps, it is never cut off
      const clipped = [...document.querySelectorAll('#inspector .insp-act > span')]
        .filter(t => t.getBoundingClientRect().width > 0 && t.scrollWidth > t.clientWidth + 1).map(t => t.textContent);
      return { ask:reach(h=>/setAsk\(/.test(h)), impact:reach(h=>/toggleCons/.test(h)),
               lookalike, over: document.documentElement.scrollWidth - innerWidth,
               place:_place, scrim:_scrimShown, clipped };
    });
    const fails = [];
    if (r.ask < 1)     fails.push('no requirement-value editor');
    if (r.impact < 1)  fails.push('no way to write an impact statement');
    if (r.over > 0)    fails.push(`document scrolls sideways by ${r.over}px`);
    if (r.lookalike)   fails.push(`${r.lookalike} chip(s) look clickable and are not`);
    if (r.clipped.length) fails.push(`an editor button's label is cut off: ${r.clipped.join(' | ')}`);
    if (grid) {
      const wantDocked = w > 1400;
      if (wantDocked && r.place !== 'beside the rows')
        fails.push(`the RECORD panel is ${r.place}, not beside the rows`);
      if (!wantDocked && r.place !== 'drawer')
        fails.push(`below the breakpoint the panel should be a drawer, not ${r.place}`);
      // The scrim only belongs on screen while the drawer is open over the grid.
      if (wantDocked && r.scrim) fails.push('the drawer scrim is showing on a docked layout');
    }
    if (font)          fails.push(font);
    if (errs.length)   fails.push(errs[0]);
    if (fails.length) bad++;
    console.log(`  ${fails.length?'FAIL':'ok  '} ${String(w).padStart(5)}px  REQ editor:${String(r.ask).padStart(2)}`
      + `  impact:${String(r.impact).padStart(3)}  dead chips:${r.lookalike}  overflow:${r.over}px`
      + (grid ? `  panel:${r.place}` : '')
      + (fails.length? '\n         ' + fails.join('; ') : ''));
    await ctx.close();
  }
}
// THE WRITTEN EDITORS ARE ABOVE THE FOLD ON A LAPTOP (v1.86). They sat last on the RECORD panel, under
// "Open on the row", below the fold for every requirement -- the impact statement included, the one
// field the PMO workflow exists to collect. Now they sit straight under the title: at the two laptop
// sizes people use, with and without an award schedule (which makes the panel longer), all three must
// be on screen without scrolling, and none clipped.
for (const [f, file] of Object.entries(made)) {
  console.log('\n' + f + ' — the three written editors, above the fold');
  for (const [w, h] of [[1366, 768], [1440, 900]]) {
    for (const id of ['R003', 'R004']) {
      const ctx = await b.newContext({ viewport:{width:w, height:h} });
      const p = await ctx.newPage();
      const errs = [];
      p.on('pageerror', e => errs.push(e.message));
      await p.goto('file://' + file);
      await p.waitForFunction(()=>typeof render==='function' && document.querySelectorAll('.row').length>0, null, {timeout:30000});
      const font = standin(f) ? await standinProblem(p) : null;
      await p.click('#row-' + id);
      await p.waitForTimeout(300);
      const r = await p.evaluate(() => {
        const acts = [...document.querySelectorAll('#inspector .insp-act')];
        const ins = document.querySelector('#inspector');
        const box = ins ? ins.getBoundingClientRect() : null;
        return { n: acts.length, award: !!document.querySelector('#inspector input[onchange^="setAwdIncDate("]'),
          labels: acts.map(a => a.querySelector('.a1').textContent),
          seen: acts.map(a => { const c = a.getBoundingClientRect();
            return c.top >= 0 && c.bottom <= innerHeight && (!box || (c.top >= box.top && c.bottom <= box.bottom)) && c.width > 0; }),
          clipped: acts.map(a => { const t = a.querySelector('.a1'); return t.scrollWidth > t.clientWidth + 1; }) };
      });
      const fails = [];
      if (r.n !== 3) fails.push(`${r.n} editor button(s), not 3`);
      if (r.labels.join('|') !== '\u26a0 Impact statement|\ud83d\udcc4 Description & note|\ud83d\udccb Requirement edit') fails.push('labels read ' + r.labels.join(' | '));
      if (r.seen.some(v => !v)) fails.push('not all on screen without scrolling');
      if (r.clipped.some(v => v)) fails.push('a label is cut off');
      if (id === 'R004' && !r.award) fails.push('the award schedule did not render, so the long panel was not measured');
      if (font) fails.push(font);
      if (errs.length) fails.push(errs[0]);
      if (fails.length) bad++;
      console.log(`  ${fails.length?'FAIL':'ok  '} ${w}x${h}  ${id === 'R004' ? 'with an award schedule   ' : 'without an award schedule'}`
        + (fails.length ? '\n         ' + fails.join('; ') : ''));
      await ctx.close();
    }
  }
}
await b.close();
console.log(bad ? `\n${bad} width(s) failed\n` : '\nEvery editor is reachable at every width, neither build scrolls sideways, and the written editors are above the fold'
  + ` and unclipped, in this machine's font and in a Segoe-like stand-in +${STANDIN_SCALE - 100}%\n`);
process.exit(bad ? 1 : 0);
