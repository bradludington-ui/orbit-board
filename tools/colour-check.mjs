// COLOUR, CHECKED WITH NUMBERS — CLAUDE.md says never by eye, and until now it was run by hand.
//
// What actually protects a reader here is NOT the lane hues. The charts carry meaning by fill
// DENSITY — solid discretionary, hatched mandatory, open dashed unfunded — off a single blue ramp,
// so they read the same in greyscale and under every colour vision deficiency. The lane hues
// (--green, --purp, --unf) tint labelled cards and chips, where the word is beside the colour.
//
// So this holds four things, in a real browser, for every theme and both builds:
//
//   1. the chart never reaches for a lane hue, and still draws its hatch  ← the real guarantee
//   2. the chart's solid fills stay one ramp, not a set of hues
//   3. Harbor's lanes clear the CVD gate            ← the theme that promises this
//   4. no theme's lane separation gets WORSE than the recorded baseline
//   5. text stays above WCAG AA on every theme
//
//   node tools/colour-check.mjs
import { chromium } from 'playwright-core';
import { validate, contrast } from './vendor/validate_palette.mjs';
import { boot, seed } from './export-audit/boot.mjs';
import { writeFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

// A BOARD WITH REQUIREMENTS ON IT. An empty board draws no chart, so every check about the chart
// would have nothing to look at -- and the first run of this tool said exactly that rather than
// reporting a pass, which is how it should fail.
const SVCN = ['USAF', 'ANG', 'AFRC'];
const items = Array.from({ length: 12 }, (_, i) => ({
  id: 'R' + i, grp: ['PSM', 'ATL', 'TSS'][i % 3], team: 't', sect: '', custom: false,
  title: 'Requirement ' + i, event: 'Ev ' + i, ccar: 'CC' + i,
  fy26: SVCN.map(() => 0), ask: SVCN.map((_, j) => ((i * 7 + j * 13) % 30 + 5) * 100000), alloc: null }));
const sc = { services: SVCN, items, disc: [6000000, 1500000, 800000],
             mand: [2000000, 500000, 300000], order: items.map(x => x.id), mc: { R0: true } };
const dir = mkdtempSync(join(tmpdir(), 'spmt-col-'));
process.on('exit', () => { try { rmSync(dir, { recursive: true, force: true }); } catch {} });   // the copies are scratch; leave nothing behind
const built = {};
for (const f of ['prioritization-board-grid.html']) {
  // Boot each build FROM ITS OWN BYTES -- boot.mjs resolves BOARD once at module load, so setting
  // process.env.BOARD here would silently give both fixtures the same build.
  const { ev } = boot({ html: readFileSync(resolve(ROOT, f), 'utf8') });
  seed(ev, sc);
  ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
      applyState(S); save(); 'ok'`);
  const out = join(dir, f);
  writeFileSync(out, ev('buildSavedHtml()'));
  built[f] = out;
}
const THEMES = [['', 'Midnight'], ['navy', 'Navy'], ['parchment', 'Parchment'],
                ['blueprint', 'Blueprint'], ['harbor', 'Harbor']];

// MEASURED, NOT CHOSEN. The worst all-pairs CVD ΔE for each theme's three lane accents as they
// stand. Four themes sit on the green/red axis and are close together for a deuteranope; that is
// the pre-existing design, and Harbor exists precisely because of it. These numbers are recorded so
// a token tweak that makes any theme WORSE fails loudly, without pretending the others pass a gate
// they were never built to pass.
const BASELINE = { '': 5.2, navy: 4.1, parchment: 4.8, blueprint: 4.7, harbor: 13.1 };
const CVD_GATE = 8.0;       // the validator's target, asserted only where the theme promises it
const ACCESSIBLE = 'harbor';
const HUE_SPREAD_MAX = 40;  // degrees; a ramp, not a set of hues

const lum = h => { const m = h.replace('#', '').match(/../g).map(x => parseInt(x, 16) / 255)
  .map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]; };
// OKLCH hue, for "is this one ramp or several hues".
const hueOf = h => { const [r, g, b] = h.replace('#', '').match(/../g).map(x => parseInt(x, 16) / 255)
  .map(c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
  return (Math.atan2(B, A) * 180 / Math.PI + 360) % 360; };
const spread = hs => { // smallest arc covering every hue
  const s = hs.slice().sort((a, b) => a - b);
  let gap = 0;
  for (let i = 0; i < s.length; i++) { const g = (s[(i + 1) % s.length] - s[i] + 360) % 360; if (g > gap) gap = g; }
  return 360 - gap; };

let bad = 0;

// THE DEFAULT IS PART OF THE COLOUR STORY. An unconfigured reader gets Harbor -- the only palette
// whose lane accents a red-green reader can tell apart -- and someone who CHOSE the dark theme
// keeps it. Both builds, and all four ways a browser can arrive: never chosen, chosen, chosen
// something else, and storage refused. That last one found a real disagreement: themeGet() answered
// Harbor while the pre-paint bootstrap swallowed the throw and painted Midnight, so the menu and
// the screen disagreed in every private window.
const DEFAULTS = [
  ['a fresh browser gets the accessible palette', null,        'harbor', 'harbor'],
  ['an explicit Midnight is kept',                '',          '',       '(none)'],
  ['and any other explicit choice is kept',       'parchment', 'parchment', 'parchment'],
  ['storage refused still paints the default',    '__throw__', 'harbor', 'harbor'],
];
const chk = (what, ok, detail) => { if (!ok) bad++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}${detail ? '   ' + detail : ''}`); };

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
                                  args: ['--no-sandbox'] });

for (const file of ['prioritization-board-grid.html']) {
  console.log('\n' + file + ' — the default theme');
  for (const [what, pre, wantGet, wantAttr] of DEFAULTS) {
    const ctx = await b.newContext();
    const p = await ctx.newPage();
    if (pre === '__throw__')
      await p.addInitScript(() => { Object.defineProperty(window, 'localStorage',
        { get() { throw new Error('blocked'); } }); });
    await p.goto('file://' + built[file]);
    if (pre !== null && pre !== '__throw__') {
      await p.evaluate(t => localStorage.setItem('spmtTheme', t), pre);
      await p.reload();
    }
    await p.waitForFunction(() => typeof themeGet === 'function', null, { timeout: 30000 });
    const r = await p.evaluate(() => ({
      get: themeGet(),
      attr: document.documentElement.getAttribute('data-theme') || '(none)' }));
    await ctx.close();
    // The two must AGREE. themeGet() drives the menu tick; data-theme drives what is painted.
    chk(what, r.get === wantGet && r.attr === wantAttr,
      `themeGet '${r.get}' · painted ${r.attr}`);
  }
}
for (const file of ['prioritization-board-grid.html']) {
  console.log('\n' + file);
  for (const [k, nm] of THEMES) {
    const ctx = await b.newContext({ viewport: { width: 1700, height: 900 } });
    const p = await ctx.newPage();
    await p.goto('file://' + built[file]);
    await p.evaluate(t => { try { localStorage.setItem('spmtTheme', t); } catch (e) {} }, k);
    await p.reload();
    await p.waitForFunction(() => typeof render === 'function' && document.querySelectorAll('.row').length > 0,
      null, { timeout: 30000 });
    const v = await p.evaluate(() => {
      const cs = getComputedStyle(document.documentElement), g = n => cs.getPropertyValue(n).trim();
      // The fit chart, as drawn. Reading the rendered SVG rather than the source is the point:
      // it is what a person actually looks at.
      const svg = [...document.querySelectorAll('svg')]
        .map(s => s.outerHTML).filter(h => /fcHatch|fcSolid/.test(h))[0] || '';
      return { disc: g('--green'), mand: g('--purp'), unf: g('--unf'),
               panel: g('--panel'), ink: g('--ink'), mut: g('--mut'), dim: g('--dim'),
               fcSolid: g('--fcSolid'), fcMand: g('--fcMand'), fcEdge: g('--fcEdge'),
               svg };
    });
    await ctx.close();

    const mode = lum(v.panel) > 0.4 ? 'light' : 'dark';
    console.log(`\n  ── ${nm} (${mode})  disc ${v.disc} · mand ${v.mand} · unf ${v.unf}`);

    // 1. THE REAL GUARANTEE: the chart carries meaning by density, off the ramp, never by lane hue.
    chk('the chart is drawn at all', !!v.svg, v.svg ? '' : 'no chart svg found — the rest proves nothing');
    if (v.svg) {
      chk('it still draws its hatch (density, not hue)', /url\(#fcHatch\)/.test(v.svg));
      const leaked = ['--green', '--purp', '--unf', '--red', '--amber']
        .filter(t => v.svg.includes('var(' + t + ')'));
      chk('and never reaches for a lane hue', !leaked.length, leaked.length ? 'leaked: ' + leaked.join(', ') : '');
    }
    // 2. the ramp is a ramp
    const ramp = [v.fcSolid, v.fcMand, v.fcEdge].filter(x => /^#/.test(x));
    const sp = ramp.length === 3 ? spread(ramp.map(hueOf)) : 999;
    chk('its fills stay one hue ramp', sp <= HUE_SPREAD_MAX, `hue spread ${sp.toFixed(0)}° (max ${HUE_SPREAD_MAX}°)`);

    // 3 & 4. the lane accents
    const r = validate([v.disc, v.mand, v.unf], { mode, surface: v.panel, pairs: 'all' });
    const cvd = r.report.find(x => x[0] === 'CVD separation');
    const worst = parseFloat(/ΔE\s+([\d.]+)/.exec(cvd[2])?.[1] ?? 'NaN');
    const base = BASELINE[k];
    if (k === ACCESSIBLE)
      chk('Harbor clears the CVD gate — it is the theme that promises it',
        cvd[1] !== 'fail' && worst >= CVD_GATE, `worst ΔE ${worst.toFixed(1)} (gate ${CVD_GATE})`);
    chk('lane separation is no worse than recorded', worst >= base - 0.15,
      `worst ΔE ${worst.toFixed(1)} · baseline ${base}${worst > base + 0.15 ? ' — IMPROVED, update BASELINE' : ''}`);
    const nor = r.report.find(x => x[0] === 'Normal-vision floor');
    chk('lanes are distinguishable with full colour vision', nor[1] === 'pass', nor[2].slice(0, 62));

    // 5. text
    const ink = contrast(v.ink, v.panel), mut = contrast(v.mut, v.panel), dim = contrast(v.dim, v.panel);
    chk('body text clears WCAG AAA on the panel', ink >= 7, `${ink.toFixed(1)}:1`);
    chk('muted text clears WCAG AA', mut >= 4.5, `${mut.toFixed(1)}:1`);
    chk('and the dimmest text still clears AA', dim >= 4.5, `${dim.toFixed(1)}:1`);
  }
}
await b.close();
console.log(bad ? `\n${bad} colour check(s) failed\n` : '\nColour holds: the charts carry meaning without hue, Harbor clears the gate, and no theme has regressed\n');
process.exit(bad ? 1 : 0);
