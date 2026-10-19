import { chromium } from '/home/user/orbit-board/node_modules/playwright-core/index.mjs';
import { pathToFileURL } from 'node:url';
const [file, out] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
for (const s of ['A', 'A2', 'B', 'B4', 'C']) { await p.goto(pathToFileURL(file).href + '?s=' + s); await p.waitForTimeout(200); await p.screenshot({ path: `${out}/v2-${s}.png` }); }
await b.close(); console.log('ok');
