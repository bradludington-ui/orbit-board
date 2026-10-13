// vpaste.mjs <copyRoot> : does a real Chromium let XML-forbidden control characters into an <input type="text"> by PASTE (copy from a
// textarea, Ctrl+V into the input) and by keyboard insertText? Bears on U37's severity (the builder: "P1 if a real browser lets
// the character in by typing or paste"; not checked). Synthetic page only; the board is not opened.
import { createRequire } from 'node:module';
const require = createRequire(process.argv[2] + '/package.json');   // fix round: playwright-core from the copy's own node_modules
const { chromium } = require('playwright-core');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true });
try {
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  await p.setContent('<textarea id="src"></textarea><input id="dst" type="text"><input id="dst2" type="text">');
  const SRC = 'a\u000Bb\u0001c\u0007d\u001Fe\tf';
  await p.evaluate(s => { document.getElementById('src').value = s; }, SRC);
  const cps = s => Array.from(s).map(c => c.codePointAt(0).toString(16));
  console.log('textarea holds        ', JSON.stringify(cps(await p.evaluate(() => document.getElementById('src').value))));
  await p.focus('#src'); await p.keyboard.press('Control+A'); await p.keyboard.press('Control+C');
  await p.focus('#dst'); await p.keyboard.press('Control+V');
  console.log('input after Ctrl+V    ', JSON.stringify(cps(await p.evaluate(() => document.getElementById('dst').value))));
  await p.focus('#dst2'); await p.keyboard.insertText('x\u000By\u0001z');
  console.log('input after insertText', JSON.stringify(cps(await p.evaluate(() => document.getElementById('dst2').value))));
  console.log('chromium', b.version());
} finally { await b.close(); }
