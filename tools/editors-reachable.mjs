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
//   node tools/editors-reachable.mjs
import { chromium } from 'playwright-core';
import { boot, seed } from './export-audit/boot.mjs';
import { writeFileSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

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
const made = {};
for (const f of ['prioritization-board.html','prioritization-board-grid.html']) {
  // Boot each build FROM ITS OWN BYTES. boot.mjs resolves BOARD once at module load, so setting
  // process.env.BOARD here would be ignored and both fixtures would silently be the same build --
  // which is exactly what happened first time round, and the grid fixture then failed at every
  // width because a card board has no row selection to open an editor with.
  const { ev } = boot({ html: readFileSync(resolve(ROOT, f), 'utf8') });
  seed(ev, sc);
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      S.order.forEach(function(id,i){ if(i%3!==2) S.desc[id]='A description.'; });
      applyState(S); save(); 'ok'`);
  const out = join(dir, f);
  writeFileSync(out, ev('buildSavedHtml()'));
  made[f] = out;
}

// 1400 and 1366 straddle the breakpoint the drawer turns on; 1024 is a half-tiled window.
const WIDTHS = [1920, 1600, 1440, 1400, 1366, 1280, 1024];
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
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
    // Open the editor the way a person does: select the row in grid, open the detail in card.
    if (grid) { await p.click('#row-R003'); }
    else { await p.evaluate(()=>toggleDetail('R003')); }
    await p.waitForTimeout(300);
    const r = await p.evaluate(()=>{
      const vis = el => { if(!el) return false; const c=el.getBoundingClientRect();
        return c.width>0 && c.height>0 && getComputedStyle(el).visibility!=='hidden'; };
      const reach = pred => [...document.querySelectorAll('[onclick],input,textarea,select,button')]
        .filter(e => pred(((e.getAttribute('onclick')||'')+' '+(e.getAttribute('onchange')||''))) && vis(e)).length;
      const lookalike = [...document.querySelectorAll('.rchip')].filter(e => {
        const c = e.getBoundingClientRect();
        return c.width>0 && !e.getAttribute('onclick') && getComputedStyle(e).cursor==='pointer'; }).length;
      return { ask:reach(h=>/setAsk\(/.test(h)), impact:reach(h=>/toggleCons/.test(h)),
               lookalike, over: document.documentElement.scrollWidth - innerWidth };
    });
    const fails = [];
    if (r.ask < 1)     fails.push('no requirement-value editor');
    if (r.impact < 1)  fails.push('no way to write an impact statement');
    if (r.over > 0)    fails.push(`document scrolls sideways by ${r.over}px`);
    if (r.lookalike)   fails.push(`${r.lookalike} chip(s) look clickable and are not`);
    if (errs.length)   fails.push(errs[0]);
    if (fails.length) bad++;
    console.log(`  ${fails.length?'FAIL':'ok  '} ${String(w).padStart(5)}px  REQ editor:${String(r.ask).padStart(2)}`
      + `  impact:${String(r.impact).padStart(3)}  dead chips:${r.lookalike}  overflow:${r.over}px`
      + (fails.length? '\n         ' + fails.join('; ') : ''));
    await ctx.close();
  }
}
await b.close();
console.log(bad ? `\n${bad} width(s) failed\n` : '\nEvery editor is reachable at every width, and neither build scrolls sideways\n');
process.exit(bad ? 1 : 0);
