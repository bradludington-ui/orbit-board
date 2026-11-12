// SCOPE's frame and Overview in a real browser (CONTRACT §18): what the review of §18 found that jsdom cannot see, because
// jsdom has no layout, no scrollbar and no print. Every name and amount is the synthetic fixture's (make_fixture.py).
//
//   UX-1        at 1366 px with a real 15 px scrollbar, every tree opened to CCaR keeps its full width beside the menu
//   RF-2, UX-4  at 900 px and narrower the Overview, the switches and the sheet keep a gutter on the left as on the right
//   UX-2        a printed Overview's charts keep their names
//   UX-3        a printed Overview's words and marks can be read on white, and its keys and status fills are printed
//   RF-1        a chart with nothing in Oct to Sep says so, inside its own picture
//
//   node scope/test/scope-review.test.mjs
process.env.TZ = 'America/New_York';
import { chromium } from 'playwright-core';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CHROME } from '../../tools/chrome.mjs';
import { pageHtml, checks, scratchDir } from './harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const C = checks('scope-review');
const tmp = scratchDir('scope-rev-');
const J = x => JSON.stringify(x);

// in the page: WCAG contrast of a colour against white
const CONTRAST = `(c => { const m = String(c).match(/[0-9.]+/g).map(Number); const a = m.length > 3 ? m[3] : 1;
  const ch = v => { v = (v * a + 255 * (1 - a)) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = 0.2126 * ch(m[0]) + 0.7152 * ch(m[1]) + 0.0722 * ch(m[2]); return 1.05 / (L + 0.05); })`;

let browser = null;
try {
  const FX = join(tmp.dir, 'fx');
  mkdirSync(FX);
  const mk = spawnSync('python3', ['-I', join(HERE, 'fixture', 'make_fixture.py'), '--out', FX], { encoding: 'utf8' });
  if (mk.status !== 0) throw new Error('make_fixture.py failed: ' + mk.stderr.slice(-400));
  const file = join(tmp.dir, 'scope.html');
  writeFileSync(file, pageHtml({}));
  // a REAL scrollbar, as Windows draws it: Playwright hides scrollbars unless told not to, which is how UX-1 passed the suite
  browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'], ignoreDefaultArgs: ['--hide-scrollbars'] });
  const open = async (w, h) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, timezoneId: 'America/New_York' });
    const p = await ctx.newPage();
    p.errs = [];
    p.on('pageerror', e => p.errs.push(e.message));
    p.on('dialog', d => d.accept().catch(() => {}));
    await p.goto(pathToFileURL(file).href);
    await p.waitForSelector('#uiMain');
    await p.setInputFiles('#uiFile', [join(FX, 'pull-all.xlsx'), join(FX, 'bae.xlsx')]);
    await p.waitForSelector('#uiMain .tiles', { timeout: 60000 });
    await p.fill('#uiAsOf', '2026-10'); await p.dispatchEvent('#uiAsOf', 'change');
    await p.waitForTimeout(400);
    return p;
  };
  const view = async (p, v) => { await p.click('#uiNav [data-act=view][data-v=' + v + ']'); await p.waitForTimeout(250); };

  // ================================================================================================= UX-1: 1366 px
  {
    const p = await open(1366, 768);
    let all = 0; const boxed = [], side = [];
    let sb = null;
    for (const v of ['om', 'ff', 'sp', 'opn', 'pmos']) {
      await view(p, v);
      const k = await p.locator('#uiMain select[data-act=lvl]').count();
      for (let i = 0; i < k; i++) await p.locator('#uiMain select[data-act=lvl]').nth(i).selectOption('4');
      await p.waitForTimeout(400);
      const r = await p.evaluate(() => ({ sb: innerWidth - document.documentElement.clientWidth, sx: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        trees: [...document.querySelectorAll('#uiMain .tw.treew')].map(tw => ({ box: tw.classList.contains('box'), w: tw.querySelector('table').offsetWidth, room: tw.clientWidth })) }));
      sb = r.sb; all += r.trees.length;
      for (const t of r.trees) if (t.box || t.w > t.room + 1) boxed.push(v + ' ' + t.w + '/' + t.room);
      if (r.sx > 0) side.push(v + ' ' + r.sx);
    }
    C.chk('UX-1: the window has a real scrollbar taking room (the suite’s other browsers hide it)', sb >= 10, 'scrollbar ' + sb + ' px');
    C.chk('UX-1: at 1366 px, scrollbar included, every tree opened to CCaR keeps its full width beside the menu (' + all + ' trees)', all >= 20 && !boxed.length, J(boxed));
    C.chk('UX-1: … and no view scrolls sideways', !side.length, J(side));
    const nav = await p.evaluate(() => { const n = document.getElementById('uiNav'), m = document.getElementById('uiMain').getBoundingClientRect();
      return { beside: n.getBoundingClientRect().right <= m.left + 1, cut: [...n.querySelectorAll('button')].filter(b => b.scrollWidth > b.clientWidth + 1 || b.offsetHeight > 40).map(b => b.textContent) }; });
    C.chk('UX-1: the menu is still beside the view, and no name in it is cut or wrapped', nav.beside && !nav.cut.length, J(nav));
    C.eq('1366 px: no script error', p.errs, []);
    await p.context().close();
  }

  // ================================================================================================= RF-2, UX-4: narrow
  for (const w of [900, 600]) {
    const p = await open(w, 800);
    const g = sel => p.evaluate(s => { const cw = document.documentElement.clientWidth;
      return s.map(x => { const e = document.querySelector(x); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(cw - r.right)]; }); }, sel);
    const ov = await g(['#uiMain .ovtitle', '#uiMain .ovshown', '#uiMain .tiles', '.filters']);
    C.chk('RF-2: at ' + w + ' px the Overview’s heading, its “shown” line, its tiles and the switches keep 8 px off the left edge, as off the right',
      ov.every(x => x && x[0] >= 8 && x[1] >= 8), J(ov));
    await view(p, 'summary');
    const su = await g(['main.sheet', '.filters']);
    C.chk('UX-4: at ' + w + ' px the sheet and the switches keep 8 px off both edges', su.every(x => x && x[0] >= 8 && x[1] >= 8), J(su));
    C.eq('at ' + w + ' px nothing scrolls sideways', await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0);
    await p.context().close();
  }

  // ================================================================================================= print, and RF-1
  {
    const p = await open(1366, 768);
    await p.click('#uiMain [data-act=ovfy][data-fy=all]'); await p.waitForTimeout(300);
    // RF-1: the fixture has a block for the year after the execution year
    const rf = await p.evaluate(() => [...document.querySelectorAll('figure.ovc')].filter(f => f.querySelector('text.ovnone')).map(f => {
      const s = f.querySelector('svg'), vb = s.viewBox.baseVal;
      return { k: f.getAttribute('data-bk'), words: [...f.querySelectorAll('text.ovnone')].map(t => t.textContent),
        inside: [...f.querySelectorAll('text.ovnone')].every(t => { const b = t.getBBox(); return b.x >= 0 && b.x + b.width <= vb.width && b.y >= 0 && b.y + b.height <= vb.height; }),
        tall: [...f.querySelectorAll('rect.b')].filter(r => Number(r.getAttribute('height')) > 0).length, goal: !!f.querySelector('polyline.gline') };
    }));
    C.chk('RF-1: a chart with no bar and no goal line says why, inside its picture', rf.length >= 1 && rf.every(x => x.inside && !x.tall && !x.goal
      && x.words.slice(0, 2).join(' ') === 'Nothing obligated or planned in Oct to Sep, and no OSD goal'), J(rf));
    const bare = await p.evaluate(() => [...document.querySelectorAll('figure.ovc')].filter(f => !f.querySelector('text.ovnone')
      && ![...f.querySelectorAll('rect.b')].some(r => Number(r.getAttribute('height')) > 0) && !f.querySelector('polyline.gline')).map(f => f.getAttribute('data-bk')));
    C.eq('RF-1: no chart is an empty plot with no word on it', bare, []);

    await p.click('#uiFilters input[data-act=svc] >> nth=1'); await p.waitForTimeout(400);     // one switch off: the amber line
    const names = await p.evaluate(() => [...document.querySelectorAll('figure.ovc')].map(f => f.getAttribute('data-bk')));
    await p.emulateMedia({ media: 'print' });
    const pr = await p.evaluate(`(() => { const contrast = ${CONTRAST};
      const vis = e => !!e && getComputedStyle(e).display !== 'none' && e.getClientRects().length > 0;
      const cs = (s, k) => [...document.querySelectorAll(s)].map(e => getComputedStyle(e)[k]);
      const min = a => Math.min(...a.map(contrast));
      return { names: [...document.querySelectorAll('figure.ovc')].map(f => { const b = f.querySelector('.ovopen'); return vis(b) ? b.textContent : null; }),
        nameInk: min(cs('figure.ovc .ovopen', 'color')), under: cs('figure.ovc .ovopen', 'textDecorationLine')[0],
        otherButtons: [...document.querySelectorAll('main.ov button:not(.ovopen)')].filter(vis).length, nOther: document.querySelectorAll('main.ov button:not(.ovopen)').length,
        ts: min(cs('.ts', 'color')), nTs: document.querySelectorAll('.ts').length, shown: min(cs('.ovshown.filtered', 'color')), nShown: document.querySelectorAll('.ovshown.filtered').length,
        ba: min(cs('.ovsvg rect.ba', 'fill')), bp: min(cs('.ovsvg rect.bp', 'stroke')), ka: min(cs('.ovleg .ka', 'backgroundColor')), kp: min(cs('.ovleg .kp', 'borderTopColor')),
        adjust: ['.ovaps .k', '.ovleg .k', '.ovstatus .stc', 'figure.ovc .stc'].map(s => [...new Set(cs(s, 'printColorAdjust').concat(cs(s, 'webkitPrintColorAdjust')))].join('/')) }; })()`);
    C.eq('UX-2: printed, every chart keeps its name (the appropriation and FY)', pr.names, names.map(k => ({ om: 'O&M', ff: 'Full Fund', sp: 'Initial Spares', opn: 'OPN' })[k.split('|')[0]] + ' FY' + k.split('|')[1]));
    C.chk('UX-2: … in dark ink, not underlined as a link, and every other button of the Overview stays off the paper', pr.nameInk >= 7 && pr.under === 'none' && pr.nOther >= 3 && pr.otherButtons === 0, J([pr.nameInk, pr.under, pr.otherButtons, pr.nOther]));
    C.chk('UX-3: printed, the tiles’ lower lines clear 4.5:1 on white', pr.nTs === 4 && pr.ts >= 4.5, pr.ts.toFixed(2) + ':1');
    C.chk('UX-3: printed, the line saying a switch is off clears 4.5:1 on white', pr.nShown === 1 && pr.shown >= 4.5, pr.shown.toFixed(2) + ':1');
    C.chk('UX-3: printed, the actual bar and the plan bar’s outline clear 3:1 on white, and their keys with them', Math.min(pr.ba, pr.bp, pr.ka, pr.kp) >= 3, J([pr.ba, pr.bp, pr.ka, pr.kp].map(x => x.toFixed(2))));
    C.chk('UX-3: printed, the colour keys and the status fills are kept (print-color-adjust: exact)', pr.adjust.every(a => a === 'exact'), J(pr.adjust));
    await p.emulateMedia({ media: null });
    const scr = await p.evaluate(() => ({ ts: getComputedStyle(document.querySelector('.ts')).color, ba: getComputedStyle(document.querySelector('.ovsvg rect.ba')).fill,
      hidden: getComputedStyle(document.querySelector('main.ov .seg button')).display }));
    C.eq('on screen nothing changed: the tile’s lower line, the actual bar and the FY buttons are as before', scr, { ts: 'rgb(195, 211, 234)', ba: 'rgb(47, 214, 200)', hidden: 'block' });
    C.eq('print: no script error', p.errs, []);
    await p.context().close();
  }
} catch (e) {
  C.chk('the run stopped before the end: ' + String((e && e.stack) || e).split('\n').slice(0, 3).join(' | '), false);
} finally {
  if (browser) await browser.close().catch(() => {});
  tmp.rm();
}
C.done();
