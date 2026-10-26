// A PMO copy's five years, in Chromium (v2.09, item 126; Brad, 26 Oct 2026).
//
//   node tools/pmo-years-render.mjs [--board FILE]
//
// jsdom has no layout. The audit suites can show that the copy's bar names its years and that the review groups its rows
// under each year; they cannot show that either can be read. This tool opens both from file:// URLs, at 1920, 1366 and 1024
// wide, in Harbor and Midnight, and checks:
//   - the copy's bar names the years it submits for, on screen and not cut off;
//   - the copy's year menu says which year opens blank, for new requirements, and the hint is not cut off;
//   - on the board, the review of a five-year submittal has one heading per year. Each heading is on screen, its text is not
//     cut off, its words are readable on its row's ground (4.5:1, WCAG 1.4.3), and the review does not scroll sideways.
// The fixture, built in jsdom through the board's own paths:
//   - a board whose base year holds plans for the base year and the three after it, the fifth year not started;
//   - a copy published from it;
//   - a submittal from that copy, with edits in three years and a proposal in the year the board had not started.
// Proved on v2.08 (ebe702e): the copy's bar names no years and the review has no headings, so every check but the controls
// fails there (42 of 61). A review that does not scroll sideways is a control: v2.08's does not either.
import { chromium } from 'playwright-core';
import { boot, seed } from './export-audit/boot.mjs';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { CHROME } from './chrome.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const bi = process.argv.indexOf('--board');
const FILE = resolve(bi >= 0 ? process.argv[bi + 1] : join(ROOT, 'prioritization-board-grid.html'));
let bad = 0;
const chk = (what, ok, detail) => { if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}${detail && !ok ? '   ' + detail : ''}`); };

// ── THE FIXTURE, IN JSDOM ───────────────────────────────────────────────────────────────────────────────────────────────
const it = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: 'Requirement ' + id + ' — a sustainment line with a long name',
  event: 'EV-' + id, ccar: '', fy26: ask.map(() => 0), ask, alloc: null });
const SC = { services: ['USAF', 'ANG', 'AFRC'],
  items: [it('A', 'PSM', [900000, 200000, 100000]), it('B', 'PSM', [300000, 80000, 40000]), it('C', 'AV', [500000, 0, 0])],
  disc: [3000000, 600000, 300000], mand: [500000, 100000, 50000], order: ['A', 'B', 'C'] };
const B = boot({ html: readFileSync(FILE, 'utf8') });
seed(B.ev, SC);
B.ev(`window.confirm=function(){ return true; }; window.alert=function(){};
  URL.createObjectURL=function(){ return 'blob:x'; }; URL.revokeObjectURL=function(){};
  BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
  S.bm={disc:S.discSvc, mand:S.mandSvc, adds:[]}; save();
  var b=MS.cur; MS.base=b; [b+1,b+2,b+3].forEach(function(y){ switchYear(b); switchYear(y); }); switchYear(b);
  try{ localStorage.setItem('prio27who','Portfolio Lead'); }catch(e){} save(); 'ok'`);
const Y0 = Number(B.ev('MS.cur'));
const yl = (y) => 'FY' + (y % 100);
const capture = (ev, type, call) => ev(`(function(){ var cap=null, _B=window.Blob;
  window.Blob=function(pt,o){ if(!cap && o && o.type===${JSON.stringify(type)}) cap=String(pt[0]); return new _B(pt,o); };
  try{ ${call}; }catch(e){ cap='THREW '+e.message; } window.Blob=_B; return cap||''; })()`);
const copyHtml = capture(B.ev, 'text/html', 'publishPmoCopy()');
const boardHtml = B.ev('buildSavedHtml()');
const P = boot({ html: copyHtml });
P.ev(`window.confirm=function(){ return true; }; window.alert=function(){};
  URL.createObjectURL=function(){ return 'blob:x'; }; URL.revokeObjectURL=function(){};
  try{ localStorage.setItem('prio27who','PSM Lead'); localStorage.setItem('prio27pmo','PSM'); }catch(e){}
  setDesc('A', 'A, written by PSM in the base year');
  switchYear(${Y0 + 1}); setDesc('B', 'B, written by PSM a year out');
  switchYear(${Y0 + 2}); setDesc('A', 'A, written by PSM two years out'); setNote('B', 'A note two years out');
  switchYear(${Y0 + 4});
  reqCreate('PSM', {title:'', event:'Proposed in a year the board had not started', ask:[250000,0,0]}, null,
    {event:'Proposed in a year the board had not started', ptype:'PRIME', obCat:OB_CATS[0], to:'lm', end:'', desc:'Described.', cons:'Stops without it.'});
  save(); switchYear(${Y0}); 'ok'`);
const pkgTxt = capture(P.ev, 'application/json', 'pmoSubmit()');
let pkg = null; try { pkg = JSON.parse(pkgTxt); } catch (e) {}
chk('control — the copy wrote a submittal', !!pkg, pkgTxt.slice(0, 120));

const dir = mkdtempSync(join(tmpdir(), 'orbit-pmo-years-'));
const copyFile = join(dir, 'copy.html'), boardFile = join(dir, 'board.html');
writeFileSync(copyFile, copyHtml); writeFileSync(boardFile, boardHtml);
const span = yl(Y0) + '–' + yl(Y0 + 4);

// contrast as WCAG reads it, from the colours the browser painted
const LUM = `function(c){ var m=/rgba?\\(([^)]+)\\)/.exec(c||''); if(!m) return null; var p=m[1].split(',').map(function(x){ return parseFloat(x); });
  var f=function(v){ v/=255; return v<=0.03928? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
  return {l:0.2126*f(p[0])+0.7152*f(p[1])+0.0722*f(p[2]), a:(p.length>3? p[3] : 1)}; }`;

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
try {
  for (const theme of ['harbor', '']) {
    for (const width of [1920, 1366, 1024]) {
      const tag = `${theme || 'midnight'} ${width}`;
      // ── THE COPY ───────────────────────────────────────────────────────────────────────────────────────────────────────
      {
        const ctx = await browser.newContext({ viewport: { width, height: 900 } });
        await ctx.addInitScript(t => { try { localStorage.setItem('spmtTheme', t); } catch (e) {} }, theme);
        const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
        await p.goto('file://' + copyFile);
        await p.waitForFunction(() => typeof render === 'function' && document.querySelectorAll('.row').length > 0, null, { timeout: 40000 });
        await p.waitForTimeout(200);
        const bar = await p.evaluate(() => {
          const s = document.querySelector('#subBanner .subyrs'), b = document.getElementById('subBanner');
          if (!s) return { found: false };
          const r = s.getBoundingClientRect(), br = b.getBoundingClientRect();
          return { found: true, text: s.textContent, on: r.width > 0 && r.left >= br.left - 1 && r.right <= br.right + 1 && r.right <= innerWidth + 1,
            cut: b.scrollWidth > b.clientWidth + 1 };
        });
        chk(`${tag} · copy: the bar names the years it submits for`, bar.found && bar.text === span, JSON.stringify(bar));
        chk(`${tag} · copy: the years are on screen, and the bar is not cut off`, bar.found && bar.on && !bar.cut, JSON.stringify(bar));
        const menu = await p.evaluate(fy => {
          openMenu = 'fy'; syncBtns();
          const items = [].slice.call(document.querySelectorAll('#dd_fy .mi'));
          const one = items.filter(i => i.textContent.indexOf(fy) >= 0)[0];
          if (!one) return { found: false };
          const sub = one.querySelector('.sub') || one;
          const r = sub.getBoundingClientRect();
          return { found: true, text: one.textContent.replace(/\s+/g, ' '), on: r.width > 0 && r.right <= innerWidth + 1,
            cut: sub.scrollWidth > sub.clientWidth + 1 };
        }, yl(Y0 + 4));
        chk(`${tag} · copy: the year menu says ${yl(Y0 + 4)} opens blank, for new requirements, and the hint is whole`,
          menu.found && /opens blank, for new requirements/.test(menu.text) && menu.on && !menu.cut, JSON.stringify(menu));
        chk(`${tag} · copy: control — no script error`, errs.length === 0, errs.slice(0, 2).join(' | '));
        await ctx.close();
      }
      // ── THE BOARD, REVIEWING THE SUBMITTAL ────────────────────────────────────────────────────────────────────────────
      {
        const ctx = await browser.newContext({ viewport: { width, height: 900 } });
        await ctx.addInitScript(t => { try { localStorage.setItem('spmtTheme', t); } catch (e) {} }, theme);
        const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
        await p.goto('file://' + boardFile);
        await p.waitForFunction(() => typeof render === 'function' && document.querySelectorAll('.row').length > 0, null, { timeout: 40000 });
        await p.waitForTimeout(200);
        const got = await p.evaluate(([pk, LUMs]) => {
          const lum = eval('(' + LUMs + ')');
          window.confirm = function () { return true; }; window.alert = function () {};
          PMOSUBS = []; PMOPICK = {}; pmoTake(pk, 'psm.json'); subOpen = true; render();
          const body = document.getElementById('subBody'), modal = body && body.closest('.modal');
          const heads = [].slice.call(document.querySelectorAll('#subBody tr.subyr'));
          const ground = function (el) { while (el) { const c = getComputedStyle(el).backgroundColor, L = lum(c); if (L && L.a > 0.99) return L.l; el = el.parentElement; } return 1; };
          return { n: heads.length, modalScroll: modal ? modal.scrollWidth > modal.clientWidth + 1 : true,
            heads: heads.map(function (tr) {
              const td = tr.cells[0], r = td.getBoundingClientRect(), g = ground(td);
              const parts = [td].concat([].slice.call(td.querySelectorAll('span'))).map(function (el) {
                const L = lum(getComputedStyle(el).color); if (!L) return 0;
                const hi = Math.max(L.l, g), lo = Math.min(L.l, g); return (hi + 0.05) / (lo + 0.05); });
              return { text: td.textContent.replace(/\s+/g, ' ').trim(), on: r.width > 0 && r.left >= -1 && r.right <= innerWidth + 1,
                cut: td.scrollWidth > td.clientWidth + 1, worst: Math.min.apply(null, parts) };
            }) };
        }, [pkg, LUM]);
        const want = [Y0, Y0 + 1, Y0 + 2, Y0 + 4].map(yl);
        chk(`${tag} · board: the review has a heading for each year the submittal carries`, J(got.heads.map(h => h.text.slice(0, 4))) === J(want), J(got.heads.map(h => h.text)));
        chk(`${tag} · board: each heading is on screen and its text is whole`, got.n > 0 && got.heads.every(h => h.on && !h.cut), J(got.heads));
        chk(`${tag} · board: each heading reads at 4.5:1 or better on its own ground (WCAG 1.4.3)`, got.n > 0 && got.heads.every(h => h.worst >= 4.5),
          J(got.heads.map(h => h.text.slice(0, 4) + ' ' + h.worst.toFixed(2))));
        chk(`${tag} · board: the year the board had not started says so in its heading`,
          got.heads.some(h => h.text.indexOf(yl(Y0 + 4)) === 0 && /not started on this board/.test(h.text)), J(got.heads.map(h => h.text)));
        chk(`${tag} · board: control — the review, its year headings in it, does not scroll sideways`, !got.modalScroll);
        chk(`${tag} · board: control — no script error`, errs.length === 0, errs.slice(0, 2).join(' | '));
        await ctx.close();
      }
    }
  }
} finally { await browser.close(); rmSync(dir, { recursive: true, force: true }); }
function J(x) { return JSON.stringify(x); }
console.log(bad ? `\n${bad} PMO-years check(s) failed` : '\nA copy names the years it submits for, and the review reads each year under its own heading, in both themes at every width');
process.exit(bad ? 1 : 0);
