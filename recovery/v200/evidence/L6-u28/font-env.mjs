// font-env.mjs -- which installed font does this machine's Chromium draw for the board's font-family?
// Run from the repository root (it uses tools/chrome.mjs there): node <path>/font-env.mjs
// One line per weight the board draws ('Segoe UI', Arial, sans-serif at 400, 500, 600, 650, 700, 750, 800 and 900;
// 12.5px, tabular figures, the rows' money style), each with "$123,456,789" and a line of words. Chromium says which
// font drew it (CDP CSS.getPlatformFontsForNode) and how wide it is. Exit 0 only when, at every weight, both lines are
// drawn in Liberation Sans or Arial and run Arial's width at that weight, written below as figures (76.47px for the
// money; 236.23px for the words below 600, 251.45px from 600) -- Arial's widths, the font the browser checks say their
// first pass measures in. Exit 1 otherwise, naming the weight and the font. Read-only: a page of its own.
//
// U28 fix round (13 Oct): it measured weight 750 only, so a setting that still sent regular 'Segoe UI' to Inter
// passed; now every weight above is checked, and the Arial line itself must be Liberation Sans or Arial.
// U28 fix round 2 (13 Oct): the board draws text at 800 and 900 too, money among it (the posture strip, the RECORD
// panel's large figures), and a setting that sent only those weights to Inter passed. The width was compared with this
// machine's own Arial, so a machine that drew every bold line in a synthetic bold 6% narrower passed. Both weights are
// checked now, against the figures written below.
import { chromium } from 'playwright-core';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const chromeMjs = resolve('tools/chrome.mjs');
if (!existsSync(chromeMjs)) { console.log(`font-env: no ${chromeMjs}; run this from the repository root`); process.exit(2); }
const { CHROME } = await import(pathToFileURL(chromeMjs).href);
const WEIGHTS = [400, 500, 600, 650, 700, 750, 800, 900];
const TEXTS = { money: '$123,456,789', words: 'Reports & exports — Spend Plan Forecast' };
// Arial's widths for TEXTS at 12.5px (Liberation Sans Regular below 600, Bold from 600), measured once and written here
const ARIAL = { money: () => 76.47, words: w => (w < 600 ? 236.23 : 251.45) };
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const span = (id, fam, w, t) => `<span id="${id}" style="font:${w} 12.5px ${fam};font-variant-numeric:tabular-nums;white-space:nowrap">${esc(t)}</span><br>`;
let html = '<body style="font-family:\'Segoe UI\',Arial,sans-serif">';
for (const w of WEIGHTS) for (const k of Object.keys(TEXTS)) html += span(`s${w}${k}`, "'Segoe UI',Arial,sans-serif", w, TEXTS[k]) + span(`a${w}${k}`, 'Arial', w, TEXTS[k]);
const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setContent(html + '</body>');
const cdp = await p.context().newCDPSession(p); await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
const fontOf = async id => { const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '#' + id });
  return (await cdp.send('CSS.getPlatformFontsForNode', { nodeId })).fonts.map(f => f.familyName + ' (' + f.postScriptName + ')').join(' + '); };
const widthOf = id => p.evaluate(id => +document.getElementById(id).getBoundingClientRect().width.toFixed(2), id);
const isArial = f => /^(Liberation Sans|Arial) \([^)]*\)$/.test(f);
console.log(`FONTCONFIG_FILE=${process.env.FONTCONFIG_FILE || '(unset)'}`);
let bad = 0;
for (const w of WEIGHTS) for (const k of Object.keys(TEXTS)) {
  const sf = await fontOf(`s${w}${k}`), af = await fontOf(`a${w}${k}`), sw = await widthOf(`s${w}${k}`), aw = await widthOf(`a${w}${k}`);
  const ok = isArial(sf) && isArial(af) && Math.abs(sw - aw) < 0.01 && Math.abs(sw - ARIAL[k](w)) < 0.01;
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'BAD '} ${w} ${k}: 'Segoe UI', Arial, sans-serif draws in ${sf}, ${sw}px; Arial draws in ${af}, ${aw}px; Arial's width ${ARIAL[k](w)}px`);
}
await b.close();
console.log(bad ? `NOT Arial's widths at ${bad} of ${WEIGHTS.length * 2} lines: a browser check run here does not measure the font the checks were written for`
  : 'OK: the board is drawn in Arial\'s widths here, at every weight it uses');
process.exit(bad ? 1 : 0);
