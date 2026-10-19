// A SEGOE-LIKE STAND-IN FOR THE BROWSER CHECKS (v1.95, item 57). The board's font is 'Segoe UI', Arial, sans-serif.
// Windows has Segoe UI; the machines these checks run on do not, so they measured the board in Liberation Sans
// (Arial's widths) and passed with no margin at all. An outside review measured the board in Edge on Windows and
// found the Reports menu 3px past the window's left edge at 761px and the RECORD panel's editor labels cut off
// at 1440x900; giving 'Segoe UI' Segoe's real height and 3% more width reproduced both here, and at the width
// this machine's font has, both passed.
//
// So a check can run a second pass with 'Segoe UI' declared for the page as Liberation Sans (Arial where that is
// missing) with Segoe UI's vertical metrics -- ascent 107.9% and descent 25.1% of the size, no line gap -- and
// its width scaled by size-adjust: +6% by default, twice what reproduced the failures, so the margin is tested.
// The overrides are divided by the scale because Chromium applies size-adjust to them as well.
//
//   import { STANDIN_SCALE, withStandin, standinProblem } from './font-standin.mjs';
//   writeFileSync(copy, withStandin(readFileSync(board, 'utf8')));   // a copy of the board in the stand-in
//   const why = await standinProblem(page);                          // null, or why the pass would prove nothing

export const STANDIN_SCALE = 106;

export function standinCss(scale = STANDIN_SCALE) {
  const k = scale / 100, pc = v => (v / k).toFixed(1) + '%';
  const face = (weight, src) => `@font-face{font-family:'Segoe UI';font-style:normal;font-weight:${weight};src:${src};`
    + `size-adjust:${scale}%;ascent-override:${pc(107.9)};descent-override:${pc(25.1)};line-gap-override:0%}`;
  return `<style id="segoe-standin">${face(400, "local('Liberation Sans'),local('LiberationSans'),local('Arial'),local('ArialMT')")}`
    + `\n${face(700, "local('Liberation Sans Bold'),local('LiberationSans-Bold'),local('Arial Bold'),local('Arial-BoldMT')")}</style>`;
}

// The board (or a saved copy of it) with the stand-in declared at the end of its <head>.
export function withStandin(html, scale = STANDIN_SCALE) {
  const i = html.indexOf('</head>');
  if (i < 0) throw new Error('font stand-in: the board has no </head> to put it in');
  return html.slice(0, i) + standinCss(scale) + html.slice(i);
}

// A pass in the stand-in proves nothing if the stand-in is not the font being drawn: a machine with neither
// Liberation Sans nor Arial would quietly draw a fallback. Measured on the page: text in 'Segoe UI' must run the
// scale's width against Arial's, and stand as tall as Segoe UI's ascent.
export async function standinProblem(page, scale = STANDIN_SCALE) {
  return page.evaluate(async scale => {
    try { await document.fonts.load('400 40px "Segoe UI"'); await document.fonts.load('700 40px "Segoe UI"'); await document.fonts.ready; }
    catch (e) { return 'the stand-in font could not be loaded: ' + e.message; }
    if (!document.getElementById('segoe-standin')) return 'the stand-in is not declared on this page';
    const c = document.createElement('canvas').getContext('2d'), T = 'Reports & exports — Spend Plan Forecast 0123456789';
    const at = f => { c.font = f; return c.measureText(T); };
    const s = at('400 40px "Segoe UI"'), a = at('400 40px Arial'), sb = at('700 40px "Segoe UI"'), ab = at('700 40px Arial');
    const w = s.width / a.width, wb = sb.width / ab.width, asc = s.fontBoundingBoxAscent / 40;
    if (Math.abs(w - scale / 100) > 0.01 || Math.abs(wb - scale / 100) > 0.01)
      return `the stand-in is not the font drawn: 'Segoe UI' runs ${w.toFixed(3)}x Arial (bold ${wb.toFixed(3)}x), not ${scale / 100}x`;
    if (Math.abs(asc - 1.079) > 0.02) return `the stand-in does not have Segoe UI's height: ascent ${asc.toFixed(3)} of the size, not 1.079`;
    return null;
  }, scale);
}
