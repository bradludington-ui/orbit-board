// The top of the board must fit the window. v1.90 (item 27) made it one sticky stack: the context bar
// (appropriation, fiscal year, PMO, search, filter, save, help, File), the task bar (the five modes, the
// mode's tools, Reports & exports / Data / Setup) and the funding posture.
//
//   * Above 1100px each bar is ONE line -- the design leaves no room for a second, and a wrapped bar
//     pushes the requirements down the screen, which is what the redesign exists to stop.
//   * At every width no control runs past the right edge of the window, and the page never scrolls
//     sideways because of the top.
// Checked at the widths people actually use, down to a 1280 laptop at 125% (1024) and a tablet, in the
// mode with the fewest tools (Review) and the one with the most (Fund).
//
//   node tools/toolbar-fits.mjs
import { chromium } from 'playwright-core';
import { resolve } from 'node:path';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
let bad=0;
for(const f of ['prioritization-board-grid.html']){
 console.log('\n'+f);
 for(const w of [1920,1512,1440,1366,1280,1152,1024,960,900,820]){
  for(const mode of ['review','fund']){
   const p=await b.newPage({viewport:{width:w,height:900}});
   await p.goto('file://'+resolve(new URL('..', import.meta.url).pathname, f));
   await p.evaluate(m=>{ localStorage.setItem('spmtTheme','harbor'); localStorage.setItem('spmtMode', m); }, mode);
   await p.reload(); await p.waitForTimeout(400);
   const r=await p.evaluate(()=>{
     const q=s=>document.querySelector(s);
     const box=s=>{ const e=q(s); if(!e) return null; const c=e.getBoundingClientRect(); return c.width||c.height? c : null; };
     const tops=sel=>[...document.querySelectorAll(sel)].filter(e=>{ const c=e.getBoundingClientRect(); return c.width>0 && c.height>0; })
       .map(e=>Math.round(e.getBoundingClientRect().top+e.getBoundingClientRect().height/2));
     const spread=a=>a.length? Math.max(...a)-Math.min(...a) : 0;
     const right=['#m_share','#m_setup','#m_data','#m_reports','#saveBtn','#m_view','#m_pmo'].map(s=>{ const c=box(s); return c? Math.round(c.right) : -1; });
     return { hdrSpread: spread(tops('.hdr > *:not(.statwrap)')), tbarSpread: spread(tops('.tbar > *:not(input)')),
              maxRight: Math.max(...right), missing: right.filter(x=>x<0).length,
              docW: document.documentElement.scrollWidth, winW: window.innerWidth,
              hdrH: Math.round(q('.hdr').getBoundingClientRect().height), tbarH: Math.round(q('.tbar').getBoundingClientRect().height) };
   });
   const oneLine = w<=1100 || (r.hdrSpread<=6 && r.tbarSpread<=6);
   const ok = oneLine && r.maxRight<=w && r.docW<=w && r.missing===0;
   if(!ok) bad++;
   console.log(`  ${ok?'ok  ':'FAIL'} ${String(w).padStart(5)}px ${mode.padEnd(6)}  context bar ${r.hdrH}px${w>1100? (r.hdrSpread<=6?' one line':' WRAPS'):''}`
     + `  task bar ${r.tbarH}px${w>1100? (r.tbarSpread<=6?' one line':' WRAPS'):''}  rightmost control ${r.maxRight}  page ${r.docW}px wide${r.missing? '  '+r.missing+' control(s) missing':''}`);
   await p.close();
  }
 }
}
await b.close();
console.log(bad? `\n  ${bad} width(s) wrap or overflow\n` : '\n  The context bar and the task bar fit at every width tested: one line each above 1100px, nothing past the edge\n');
process.exit(bad?1:0);
