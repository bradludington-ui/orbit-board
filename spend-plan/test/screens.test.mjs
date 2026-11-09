// The screens, as the 9 Nov screens review met them (S2-S12), in Chromium: the page is opened from file:// as Brad opens
// it, with the synthetic fixture saved in it, and driven with the keyboard and the mouse. Every check here failed on
// the page as that review found it.
//
// What it holds the page to:
//   - Data through takes only a month from 1990 to 2100. A year half typed changes nothing and marks nothing unsaved;
//     a box left half typed or empty is put back to the month the figures use, with a reason in the box's own words
//     (S3, S12);
//   - a view changed starts at its top, Help too (S4);
//   - the keyboard's place is never under the sticky top, a tree's stuck headings, or the bottom CUI line (S5);
//   - a long tree keeps its column headings on screen as it scrolls (S6);
//   - a message can be dismissed, and the top shrinks back (S7);
//   - a Save that could only download says so in the top bar, and does not read Saved (S8);
//   - removing a special CCaR leaves the keyboard on the list; each budget picker is named by its budget (S10);
//   - the words: $0.00M, a negative amount said, an unchanged goal said, counts that agree, pulls told apart (S11);
//   - the seventh switch, once its rows are gone, makes nothing read "filtered" (S2).
//
//   node spend-plan/test/screens.test.mjs
import { chromium } from 'playwright-core';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CHROME } from '../../tools/chrome.mjs';
import { pageHtml, loadTool, scratchDir, checks } from './harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const C = checks('screens');
const tmp = scratchDir('sfcbsp-screens-');
const NOW = '2026-11-09T12:00:00.000Z';
const J = o => JSON.stringify(o);

function py(args) {
  const r = spawnSync('python3', ['-I', ...args], { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error('python3 ' + args[0] + ' failed: ' + r.stderr.slice(-800));
  return r;
}
const FX = join(tmp.dir, 'fx');
mkdirSync(FX);
py([join(HERE, 'fixture', 'make_fixture.py'), '--out', FX]);

// a saved plan made from the fixture by the tool's own import, so the page opens Saved with every view drawn
async function savedState() {
  const t = loadTool({ modules: ['util', 'xlsx-read', 'import', 'engine'] });
  const b = readFileSync(join(FX, 'pull-all.xlsx'));
  const parsed = await t.SP.parseFiles([{ name: 'pull-all.xlsx', data: b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) }], { now: NOW });
  const st = JSON.parse(J({ v: 1, tool: 'sfcb-spend-plan', savedAt: '2026-11-09T12:30:00.000Z',
    settings: t.SP.defaultSettings('2026-11-09'), pulls: { current: parsed.pulls, previous: {} },
    history: [{ importedAt: NOW, aps: ['om', 'ff', 'sp', 'opn'], totals: {} }], lastImport: { report: parsed.report } }));
  t.close();
  return st;
}
function pageFile(name, state) {
  const f = join(tmp.dir, name);
  writeFileSync(f, pageHtml({ state }));
  return pathToFileURL(f).href;
}

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
try {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, acceptDownloads: true });
  const STATE = await savedState();
  const p = await ctx.newPage();
  const errors = [], dialogs = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  p.on('dialog', d => { dialogs.push(d.type() + ': ' + d.message()); d.dismiss().catch(() => {}); });
  await p.goto(pageFile('sfcb-spend-plan.html', STATE));
  await p.waitForSelector('tr[data-bk=total]');
  const text = sel => p.$eval(sel, e => e.textContent).catch(() => null);
  const msg = () => text('#uiMsg');
  const saveWord = () => text('#uiSave');
  const asOf = () => p.evaluate(() => SP.state.settings.asOf);
  const until = fn => p.waitForFunction(fn, null, { timeout: 5000 }).then(() => true, () => false);
  const settle = () => p.evaluate(() => new Promise(r => setTimeout(r, 0)));
  // leave the month box: Tab moves between its month, its year and its calendar button before it leaves the box
  async function tabOut() {
    for (let i = 0; i < 5 && await p.evaluate(() => document.activeElement && document.activeElement.id === 'uiAsOf'); i++) await p.keyboard.press('Tab');
    await settle();
  }
  C.chk('the saved plan opens Saved, Data through Oct-2026', (await saveWord()) === 'Saved' && (await asOf()) === '2026-10', (await saveWord()) + ' ' + (await asOf()));

  // ======================================================================== S3, S12: Data through
  const title0 = await text('h2.title');
  for (const typed of ['202', '2', '20261']) {
    await p.focus('#uiAsOf');
    await p.keyboard.press('ArrowRight');           // the year part of the box
    await p.keyboard.type(typed, { delay: 30 });
    await settle();
    C.chk('S3 "' + typed + '": a year half typed is not taken, and nothing is unsaved', (await asOf()) === '2026-10' && (await saveWord()) === 'Saved'
      && (await text('h2.title')) === title0, (await asOf()) + ' ' + (await saveWord()) + ' ' + (await text('h2.title')));
    await tabOut();
    const box = await p.inputValue('#uiAsOf');
    C.chk('S3 "' + typed + '": left, the box is put back to the month in use', box === '2026-10' && (await asOf()) === '2026-10', box);
    const m = await msg();
    C.chk('S3 "' + typed + '": and the reason is said, in the box’s own words', /from January 1990 to December 2100/.test(m) && /stays Oct-2026/.test(m)
      && !/YYYY-MM/.test(m), m);
  }
  C.chk('S3: nothing half typed was ever taken: still Saved', (await saveWord()) === 'Saved', await saveWord());
  // a whole year typed is taken, and typing the month in use back is no change
  await p.focus('#uiAsOf'); await p.keyboard.press('ArrowRight'); await p.keyboard.type('2025', { delay: 30 });
  C.chk('S3: a whole year in the range is taken at once', await until(() => SP.state.settings.asOf === '2025-10') && /Data through set to Oct-2025/.test(await msg()), await msg());
  await p.keyboard.type('2026', { delay: 30 });
  await until(() => SP.state.settings.asOf === '2026-10');
  await tabOut();
  C.chk('S3: and typed back, the figures use it again', (await asOf()) === '2026-10' && (await p.inputValue('#uiAsOf')) === '2026-10');
  // S12: cleared and left
  await p.focus('#uiAsOf');
  await p.keyboard.press('Backspace');
  await tabOut();
  const m12 = await msg();
  C.chk('S12: a box cleared and left shows the month the figures use again', (await p.inputValue('#uiAsOf')) === '2026-10' && (await asOf()) === '2026-10',
    await p.inputValue('#uiAsOf'));
  C.chk('S12: and says why, never naming a YYYY-MM form the box does not show', /left empty/.test(m12) && /stays Oct-2026/.test(m12) && !/YYYY-MM/.test(m12), m12);

  // ======================================================================== S4, S5, S6: a long tree
  await p.click('[data-act=view][data-v=om]');
  const nBlk = await p.$$eval('#uiMain select[data-act=lvl]', l => l.length);
  for (let i = 0; i < nBlk; i++) { await p.selectOption('#uiMain section.blk-sec >> nth=' + i + ' >> select[data-act=lvl]', '4'); }
  const pageH = await p.evaluate(() => document.documentElement.scrollHeight);
  C.chk('the O&M trees opened to CCaR make a page several windows tall', pageH > 4 * 768, String(pageH));
  // where the sticky top ends, and where the bottom CUI line starts
  const edges = () => p.evaluate(() => ({ top: document.getElementById('uiTop').getBoundingClientRect().bottom,
    bottom: document.querySelector('.cui-bottom').getBoundingClientRect().top, h: innerHeight }));

  // S6: half way down the first tree, its column headings are on screen under the sticky top, and nothing covers them
  const heads = await p.evaluate(() => {
    const sec = document.querySelector('#uiMain section.blk-sec');
    const t = sec.querySelector('table.tree');
    const r = t.getBoundingClientRect();
    window.scrollTo(0, window.scrollY + r.top + r.height / 2);
    const th = [...t.querySelectorAll('thead th')].find(x => x.textContent === 'Oct');
    const b = th.getBoundingClientRect(), top = document.getElementById('uiTop').getBoundingClientRect().bottom;
    const at = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
    return { thTop: Math.round(b.top), headerBottom: Math.round(top), seen: !!at && (at === th || th.contains(at)), tableTop: Math.round(t.getBoundingClientRect().top) };
  });
  C.chk('S6: half way down a tree, its column headings stay on screen just under the sticky top', heads.tableTop < 0 && heads.seen
    && Math.abs(heads.thTop - heads.headerBottom) <= 2, J(heads));

  // S5: every control the keyboard reaches, going up the trees from the bottom and down from the top, is drawn on top
  // where it sits: never under the sticky top, a tree's stuck headings, or the bottom CUI line
  async function walk(key, n, label) {
    const hidden = [];
    let seen = 0;
    for (let i = 0; i < n; i++) {
      await p.keyboard.press(key);
      const r = await p.evaluate(() => {
        const a = document.activeElement;
        if (!a || a === document.body || !a.getBoundingClientRect) return null;
        const b = a.getBoundingClientRect();
        if (!b.width) return null;
        const at = document.elementFromPoint(b.left + Math.min(b.width / 2, 20), b.top + b.height / 2);
        return { k: a.getAttribute('data-fkey') || a.tagName, top: Math.round(b.top), bottom: Math.round(b.bottom),
          onTop: !!at && (at === a || a.contains(at)), by: at ? (at.closest('header, .cui, thead') || at).tagName : null };
      });
      if (!r) continue;
      seen++;
      if (!r.onTop) hidden.push(r);
    }
    C.chk('S5: ' + label + ': no focused control is covered (' + seen + ' reached)', seen > n / 2 && !hidden.length, J(hidden.slice(0, 3)));
  }
  await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await p.mouse.click(683, (await edges()).bottom - 4);   // a spot near the bottom with nothing to press: the keyboard starts there
  await walk('Shift+Tab', 60, 'Shift+Tab up the trees from the bottom');
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.focus('#uiMain select[data-act=lvl]');
  await walk('Tab', 60, 'Tab down the first tree');

  // S4: from the bottom of the trees, another view opens at its top, its title under the sticky top
  for (const [sel, name] of [['[data-act=view][data-v=na]', 'Not Allocated'], ['[data-act=help]', 'Help'], ['[data-act=view][data-v=report]', 'Import report']]) {
    if (name !== 'Not Allocated') { await p.click('[data-act=view][data-v=om]'); }
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const y0 = await p.evaluate(() => window.scrollY);
    await p.click(sel);
    const r = await p.evaluate(() => {
      const t = document.querySelector('#uiMain h2.title').getBoundingClientRect(), h = document.getElementById('uiTop').getBoundingClientRect().bottom;
      return { y: window.scrollY, titleTop: Math.round(t.top), headerBottom: Math.round(h), viewH: document.documentElement.scrollHeight };
    });
    C.chk('S4: ' + name + ' opens at its top, its title on screen (was scrolled to ' + y0 + ')', y0 > 768 && r.y === 0 && r.titleTop >= r.headerBottom
      && r.titleTop < 768, J(r));
  }
  await p.click('[data-act=help]');      // Help again: back to the view it came from

  // ======================================================================== S7: a long message can be put away
  await p.click('[data-act=view][data-v=summary]');
  await p.evaluate(() => SP.say(''));
  const h0 = await p.evaluate(() => document.getElementById('uiTop').offsetHeight);
  await p.evaluate(() => SP.say(('The import was refused: every sheet named here holds rows of two appropriations. ').repeat(10), 'err'));
  await settle();
  const h1 = await p.evaluate(() => document.getElementById('uiTop').offsetHeight);
  C.chk('S7: a long message makes the top taller, and a Dismiss button is there', h1 > h0 + 20 && await p.isVisible('#uiMsgX'), h0 + ' -> ' + h1);
  if (await p.$('#uiMsgX')) { await p.focus('#uiMsgX'); await p.keyboard.press('Enter'); }
  await settle();
  const after7 = await p.evaluate(() => ({ h: document.getElementById('uiTop').offsetHeight, msg: document.getElementById('uiMsg').textContent,
    btn: !!(document.getElementById('uiMsgX') || {}).hidden, focus: document.activeElement && document.activeElement.getAttribute('data-fkey'),
    pad: getComputedStyle(document.documentElement).scrollPaddingTop }));
  C.chk('S7: Dismiss empties the message line and the top shrinks back', after7.msg === '' && after7.h === h0 && after7.btn, J(after7) + ' was ' + h0);
  C.chk('S7: the keyboard goes to the view it was reading, never the top of the page', after7.focus === 'view:summary', J(after7));
  C.chk('S5: the page’s scroll padding follows the top as it shrinks', parseFloat(after7.pad) >= h0 && parseFloat(after7.pad) < h1, J(after7) + ' top ' + h0);
  C.chk('S7: no message, no Dismiss', await p.evaluate(() => !!(document.getElementById('uiMsgX') || {}).hidden));

  // ======================================================================== S10, S11: Settings
  await p.click('[data-act=view][data-v=settings]');
  await p.fill('#uiSpecNew', 'ZZ-9001');
  await p.press('#uiSpecNew', 'Enter');
  const specs = await p.$$eval('.speclist li span', l => l.map(e => e.textContent));
  C.chk('S10: three special CCaRs to remove', specs.length === 3 && specs[2] === 'ZZ-9001', J(specs));
  await p.focus('[data-act=specdel][data-i="2"]');
  await p.keyboard.press('Enter');
  C.chk('S10: removing the last one leaves the keyboard on the Remove before it', await p.evaluate(() => document.activeElement.getAttribute('data-fkey')) === 'specdel:1');
  await p.focus('[data-act=specdel][data-i="0"]');
  await p.keyboard.press('Enter');
  C.chk('S10: removing the first leaves the keyboard on the Remove now in its place', await p.evaluate(() => document.activeElement.getAttribute('data-fkey')) === 'specdel:0');
  await p.keyboard.press('Enter');
  C.chk('S10: removing the only one left leaves the keyboard on the box that adds one', await p.evaluate(() => document.activeElement.id) === 'uiSpecNew');
  await p.click('[data-act=specreset]');
  const labels = await p.$$eval('.budgets tbody tr', l => l.map(r => [r.querySelector('td').childNodes[0].textContent.trim(),
    r.querySelector('select[data-act=bsvc]').getAttribute('aria-label'), r.querySelector('select[data-act=blane]').getAttribute('aria-label')]));
  const badLab = labels.filter(([n, s, l]) => s !== 'Service for budget “' + n + '”' || l !== 'Lane for budget “' + n + '”');
  C.chk('S10: every budget picker is named by its budget', labels.length > 5 && !badLab.length, J(badLab.slice(0, 3)));

  const auth = async v => { await p.fill('input[data-act=auth][data-i="0"]', v); await p.press('input[data-act=auth][data-i="0"]', 'Tab'); await settle(); return msg(); };
  const m0 = await auth('0');
  C.chk('S11: an Authorized of 0 is said as $0.00M, never $-M', /set to \$0\.00M\./.test(m0) && !/\$-M/.test(m0), m0);
  const mn = await auth('(5)');
  C.chk('S11: an Authorized in parentheses is said to be negative', /set to \$\(5\.00\)M, a negative amount/.test(mn), mn);
  const ms = await auth('-5');
  C.chk('S11: the same Authorized again is said to be unchanged', /unchanged: it is already \$\(5\.00\)M/.test(ms), ms);
  await auth('');
  const gsel = 'input[data-act=goal][data-curve=om1][data-i="1"]';
  await p.fill(gsel, '150'); await p.press(gsel, 'Tab'); await settle();
  C.chk('S11: a goal of 150 is refused', /“150” was not taken/.test(await msg()), await msg());
  await p.fill(gsel, '8.33%'); await p.press(gsel, 'Tab'); await settle();
  const mg = await msg();
  C.chk('S11: typed back to the goal it holds, the refusal of 150 no longer stands on the message line', !/150/.test(mg) && /Goal unchanged: it is already 8\.33%/.test(mg), mg);

  // ======================================================================== S2: the seventh switch, once its rows are gone
  const has7 = async () => (await p.$$('[data-act=svc][data-i="6"]')).length === 1;
  C.chk('S2: the fixture has rows with no service, so a seventh switch', await has7());
  await p.click('[data-act=svc][data-i="6"]');
  C.chk('S2: turned off, the page says it is filtered', await until(() => /Services shown/.test(document.querySelector('.shownline').textContent)));
  await p.click('[data-act=view][data-v=settings]');
  for (let k = 0; k < 20; k++) {
    const u = await p.$('.budgets tr.unknown select[data-act=bsvc]');
    if (!u) break;
    await u.selectOption('0');
    await settle();
  }
  C.chk('S2: every name no rule knew is given a service in Settings, and the seventh switch goes', !(await has7()) && !(await p.$('.budgets tr.unknown')));
  const line = await text('.shownline');
  C.chk('S2: with its rows gone, the switch left off makes nothing read filtered', line === 'All services, both lanes'
    && !(await p.$('.shownline.filtered')), line);
  await p.click('[data-act=view][data-v=summary]');
  C.chk('S2: the Summary says everything is shown, and draws no "Showing only part" notice', (await text('p.l3')) === 'All services, both lanes'
    && !(await p.$('#uiMain .shown')), await text('p.l3'));
  await p.click('[data-act=svc][data-i="0"]');
  const l0 = await text('.shownline');
  C.chk('S2: USAF off there: the list names no service without a switch', /^Services shown: USAF ANG, /.test(l0) && !/Service not identified/.test(l0), l0);
  await p.click('[data-act=svc][data-i="0"]');

  // ======================================================================== S11: What changed, two pulls on one day
  await p.setInputFiles('#uiFile', [join(FX, 'gen2', 'pull-om.xlsx'), join(FX, 'gen2', 'pull-ff.csv')]);
  await until(() => /Imported/.test(document.getElementById('uiMsg').textContent));
  await p.click('[data-act=view][data-v=changes]');
  const hs = await p.$$eval('section.chg h3.bar', l => l.map(e => e.textContent));
  const told = hs.map(h => /pull of (.+) → pull of (.+)$/.exec(h)).filter(Boolean);
  C.chk('S11: each section names its two pulls so they can be told apart', told.length === hs.length && hs.length > 0 && told.every(m => m[1] !== m[2]), J(hs));
  const btns = await p.$$eval('section.chg button[data-act=diff]', l => l.map(e => e.textContent));
  C.chk('S11: the Show buttons’ words agree with their counts', btns.length > 0 && btns.every(t => /^Show the 1 (row whose amount changed|new row|row gone) /.test(t)
    || /^Show the (\d+) (rows whose amount changed|new rows|rows gone) /.test(t) && !/^Show the 1 /.test(t)), J(btns));
  C.eq('S2-S12: no script error, no question asked', [errors, dialogs], [[], []]);
  await ctx.close();

  // ======================================================================== S8: no file windows: Save downloads
  const ctx2 = await browser.newContext({ viewport: { width: 1366, height: 768 }, acceptDownloads: true });
  await ctx2.addInitScript(() => { window.showOpenFilePicker = undefined; window.showSaveFilePicker = undefined; });
  const q = await ctx2.newPage();
  const qd = [];
  q.on('dialog', d => { qd.push(d.type()); d.dismiss().catch(() => {}); });
  await q.goto(pageFile('downloads.html', STATE));
  await q.waitForSelector('tr[data-bk=total]');
  await q.fill('#uiFirst', '2026'); await q.press('#uiFirst', 'Tab');
  await q.waitForFunction(() => document.getElementById('uiSave').textContent === 'Unsaved changes');
  const [dl] = await Promise.all([q.waitForEvent('download', { timeout: 10000 }), q.click('[data-act=save]')]);
  await q.waitForFunction(() => /downloaded/.test(document.getElementById('uiMsg').textContent));
  await q.evaluate(() => new Promise(r => setTimeout(r, 0)));
  const sw = await q.$eval('#uiSave', e => e.textContent);
  C.chk('S8: after Save downloads, the top bar does not say Saved: it says the file is not updated', !!dl && sw === 'Downloaded, not in the file yet', sw);
  await q.close({ runBeforeUnload: true });
  await new Promise(r => setTimeout(r, 500));
  C.chk('S8: and leaving asks', qd.includes('beforeunload'), J(qd));
  await ctx2.close();
} catch (e) {
  const at = ((e && e.stack) || '').split('\n').find(l => l.includes('screens.test.mjs')) || '';
  C.chk('the run stopped before the end: ' + String((e && e.message) || e).split('\n')[0] + ' ' + at.trim(), false);
} finally {
  await browser.close().catch(() => {});
  tmp.rm();
}
C.done();
