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
//   * v2.00 (UI S4): EVERY CONTROL AT THE TOP IS ON SCREEN, WHOLE AND CLICKABLE, at every width: in the context bar, the
//     task bar and the posture strip, and in the page's heading and toolbar below them (the search box and Filter moved
//     there) -- inside the window, not cut by anything around it that clips, and the thing under its own centre
//     (elementFromPoint), so nothing covers it, the sidebar included. The one-line rule above is kept as it was: beside
//     the sidebar the context bar has a narrower window's room, and where it wraps this says so and fails.
//
//   node tools/toolbar-fits.mjs
import { chromium } from 'playwright-core';
import { resolve } from 'node:path';
import { CHROME } from './chrome.mjs';
const b=await chromium.launch({executablePath: CHROME});
let bad=0, unusableAt=0;
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
     // every control: on screen, not clipped by an ancestor that clips, and the element under its own centre
     const ctl=[...document.querySelectorAll('#topStack button, #topStack input, #topStack select, #uiPage button, #uiPage input, #uiPage select')]
       .filter(e=>e.type!=='file' && !e.closest('.mdd, .uiPop') && e.getClientRects().length && getComputedStyle(e).visibility!=='hidden');
     const unusable=[];
     ctl.forEach(e=>{
       const c=e.getBoundingClientRect(), why=[], lbl=(e.id? '#'+e.id : (e.textContent||e.getAttribute('aria-label')||e.tagName).replace(/\s+/g,' ').trim().slice(0,24));
       if(!(c.width>0 && c.height>0)) why.push('no size');
       if(c.left<-0.5 || c.top<-0.5 || c.right>innerWidth+0.5 || c.bottom>innerHeight+0.5) why.push('outside the window');
       for(let a=e.parentElement; a && a!==document.documentElement; a=a.parentElement){
         const cs=getComputedStyle(a); if(cs.overflowX==='visible' && cs.overflowY==='visible') continue;
         const r=a.getBoundingClientRect();
         if(c.left<r.left-0.5 || c.right>r.right+0.5 || c.top<r.top-0.5 || c.bottom>r.bottom+0.5){ why.push('cut by '+(a.id? '#'+a.id : a.className.split(' ')[0])); break; } }
       const t=document.elementFromPoint(c.left+c.width/2, c.top+c.height/2);
       if(!t || !(t===e || e.contains(t))) why.push('covered by '+(t? (t.id? '#'+t.id : t.tagName.toLowerCase()) : 'nothing'));
       if(why.length) unusable.push(lbl+': '+why.join(', '));
     });
     return { controls: ctl.length, unusable, hdrSpread: spread(tops('.hdr > *:not(.statwrap)')), tbarSpread: spread(tops('.tbar > *:not(input)')),
              maxRight: Math.max(...right), missing: right.filter(x=>x<0).length,
              docW: document.documentElement.scrollWidth, winW: window.innerWidth,
              hdrH: Math.round(q('.hdr').getBoundingClientRect().height), tbarH: Math.round(q('.tbar').getBoundingClientRect().height) };
   });
   const oneLine = w<=1100 || (r.hdrSpread<=6 && r.tbarSpread<=6);
   const ok = oneLine && r.maxRight<=w && r.docW<=w && r.missing===0 && r.unusable.length===0;
   if(!ok) bad++;
   if(r.unusable.length) unusableAt++;
   console.log(`  ${ok?'ok  ':'FAIL'} ${String(w).padStart(5)}px ${mode.padEnd(6)}  context bar ${r.hdrH}px${w>1100? (r.hdrSpread<=6?' one line':' WRAPS'):''}`
     + `  task bar ${r.tbarH}px${w>1100? (r.tbarSpread<=6?' one line':' WRAPS'):''}  rightmost control ${r.maxRight}  page ${r.docW}px wide${r.missing? '  '+r.missing+' control(s) missing':''}`
     + `  ${r.controls} controls ${r.unusable.length? r.unusable.length+' NOT USABLE: '+r.unusable.slice(0,4).join(' | ') : 'all on screen, whole and clickable'}`);
   await p.close();
  }
 }
}
await b.close();
console.log(bad? `\n  ${bad} width(s) wrap or overflow${unusableAt? ', '+unusableAt+' of them with a control not usable' : ', and at every one every control is on screen, whole and clickable'}\n`
  : '\n  The context bar and the task bar fit at every width tested: one line each above 1100px, nothing past the edge, every control on screen, whole and clickable\n');
process.exit(bad?1:0);
