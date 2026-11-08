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
//   * v2.00 (UI S4, fix round): WHOLE means the whole control, not only its centre: its left edge clear of the sidebar's
//     right edge (as sweep3 judges the posture strip), and the control (or its own label) under a point just inside each
//     of its four sides. A context bar slid 60px under the sidebar left its first control's centre showing and passed.
//     The posture strip is drawn only beside data: on the empty template this tool opens it is empty and not shown, so
//     it is checked on a populated board by ui-concept/preview-chunk3/checks/sweep3.mjs (posture), not here.
//
//   * v2.00 (menu, 19 Oct): SAVE, REPORTS & EXPORTS, DATA, SETUP AND FILE LEFT THE TOP for the left menu. The controls this
//     counted at the top's right end are the ones that stay there (Help, Filter, PMO), and the ones that moved are counted
//     where they went -- 💾 Save and its ▾, and the left-menu entries that replaced the four menus -- so a missing one still
//     fails. Every control on the left menu is held to the same rule as every control at the top: on screen, whole and
//     clickable at every width (beside the sidebar's edge is where it belongs, so only the top's controls are held clear of it).
//
//   * v2.15 W1 (item 137; Brad, 2 Nov 2026: "No wrapping."): AND ON A TAGGED BOARD, not only the bare template. The template has no
//     PPBE cycle figure, so it never meets the bar at its widest. The second pass opens a populated board on BES28 whose controls
//     leave the year unallocated and over (tools/cyc-seed.mjs), with Full Fund on PB27 in this browser -- so the PPBE cycle reads
//     ⚠ Mixed and the opening's warning is unread -- and holds the CONTEXT BAR to one line at EVERY width tested, every control on
//     screen, whole and clickable (fitTop's steps make it fit; the task bar keeps its own rule, one line above 1100px).
//
//   node tools/toolbar-fits.mjs [--board FILE]
import { chromium } from 'playwright-core';
import { resolve } from 'node:path';
import { CHROME } from './chrome.mjs';
import { buildPopulated } from './ia-fixture.mjs';                                       // v2.15 W1 (item 137): the tagged pass
import { CYC_TAG_SEED, CYC_KEY, cycOtherStore, seedLs } from './cyc-seed.mjs';
const b=await chromium.launch({executablePath: CHROME});
let bad=0, unusableAt=0, layoutAt=0;
const _bi=process.argv.indexOf('--board'), BOARDF=_bi>=0? resolve(process.argv[_bi+1]) : resolve(new URL('..', import.meta.url).pathname, 'prioritization-board-grid.html');
const measure=()=>{
     const q=s=>document.querySelector(s);
     const box=s=>{ const e=q(s); if(!e) return null; const c=e.getBoundingClientRect(); return c.width||c.height? c : null; };
     const tops=sel=>[...document.querySelectorAll(sel)].filter(e=>{ const c=e.getBoundingClientRect(); return c.width>0 && c.height>0; })
       .map(e=>Math.round(e.getBoundingClientRect().top+e.getBoundingClientRect().height/2));
     const spread=a=>a.length? Math.max(...a)-Math.min(...a) : 0;
     const right=['#helpBtn','#m_view','#m_pmo','#saveBtn','#uiNav_save','#uiNav_rep','#uiNav_imp','#uiNav_data','#uiNav_setup'].map(s=>{ const c=box(s); return c? Math.round(c.right) : -1; });
     // every control: on screen, not clipped by an ancestor that clips, and the element under its own centre
     const ctl=[...document.querySelectorAll('#topStack button, #topStack input, #topStack select, #uiPage button, #uiPage input, #uiPage select, #uiSide button')]
       .filter(e=>e.type!=='file' && !e.closest('.mdd, .uiPop') && e.getClientRects().length && getComputedStyle(e).visibility!=='hidden')
       // v2.15 W1 (item 137): not the buttons inside a message on the status line -- it is one line, cut off by design, and the
       // Message button beside it opens it whole (the tagged pass meets the opening's offer; the template never has one)
       .filter(e=>!e.closest('#statWrap:not(.big)'));
     const unusable=[];
     const side=q('#uiSide'), sideR=(side && getComputedStyle(side).display!=='none')? side.getBoundingClientRect().right : 0;
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
       // v2.00 (UI S4, fix round): and whole -- clear of the sidebar, and itself (or its own label, which a click passes on
       // to it) just inside each side
       if(!e.closest('#uiSide') && c.left<sideR-0.5) why.push('under the sidebar ('+Math.round(c.left)+' < '+Math.round(sideR)+')');
       for(const [x,y,edge] of [[c.left+2, c.top+c.height/2, 'left'], [c.right-2, c.top+c.height/2, 'right'], [c.left+c.width/2, c.top+2, 'top'], [c.left+c.width/2, c.bottom-2, 'bottom']]){
         const t2=document.elementFromPoint(x, y);
         if(!t2 || !(t2===e || e.contains(t2) || [...(e.labels||[])].some(l=>l.contains(t2)))){ why.push('its '+edge+' edge covered by '+(t2? (t2.id? '#'+t2.id : t2.tagName.toLowerCase()) : 'nothing')); break; } }
       if(why.length) unusable.push(lbl+': '+why.join(', '));
     });
     return { controls: ctl.length, unusable, hdrSpread: spread(tops('.hdr > *:not(.statwrap)')), tbarSpread: spread(tops('.tbar > *:not(input)')),
              maxRight: Math.max(...right), missing: right.filter(x=>x<0).length,
              docW: document.documentElement.scrollWidth, winW: window.innerWidth,
              hdrH: Math.round(q('.hdr').getBoundingClientRect().height), tbarH: Math.round(q('.tbar').getBoundingClientRect().height),
              cls: q('.hdr').className, cyc: (q('#b_cyc')||{}).textContent||'', fit: (q('#cycFit')||{}).getAttribute? (q('#cycFit').getAttribute('data-l')||'') : '',
              unread: !!(q('#statKeep') && !q('#statKeep').hidden) };
};
for(const f of [BOARDF]){
 console.log('\n'+f);
 for(const w of [1920,1512,1440,1366,1280,1152,1024,960,900,820]){
  for(const mode of ['review','fund']){
   const p=await b.newPage({viewport:{width:w,height:900}});
   await p.goto('file://'+f);
   await p.evaluate(m=>{ localStorage.setItem('spmtTheme','harbor'); localStorage.setItem('spmtMode', m); }, mode);
   await p.reload(); await p.waitForTimeout(400);
   const r=await p.evaluate(measure);
   const oneLine = w<=1100 || (r.hdrSpread<=6 && r.tbarSpread<=6);
   const ok = oneLine && r.maxRight<=w && r.docW<=w && r.missing===0 && r.unusable.length===0;
   if(!ok) bad++;
   if(r.unusable.length) unusableAt++;
   if(!(oneLine && r.maxRight<=w && r.docW<=w && r.missing===0)) layoutAt++;
   console.log(`  ${ok?'ok  ':'FAIL'} ${String(w).padStart(5)}px ${mode.padEnd(6)}  context bar ${r.hdrH}px${w>1100? (r.hdrSpread<=6?' one line':' WRAPS'):''}`
     + `  task bar ${r.tbarH}px${w>1100? (r.tbarSpread<=6?' one line':' WRAPS'):''}  rightmost control ${r.maxRight}  page ${r.docW}px wide${r.missing? '  '+r.missing+' control(s) missing':''}`
     + `  ${r.controls} controls ${r.unusable.length? r.unusable.length+' NOT USABLE: '+r.unusable.slice(0,4).join(' | ') : 'all on screen, whole and clickable'}`);
   await p.close();
  }
 }
}
// v2.15 W1 (item 137): THE TAGGED BOARD. The context bar is held to one line at every width here (it carries the cycle's figure and an
// unread warning, which the template never does); the task bar to its own rule; every control usable.
{
 const TAGGED=buildPopulated(BOARDF, CYC_TAG_SEED);
 console.log('\na tagged board (BES28, Full Fund on PB27: ⚠ Mixed, its figure unallocated and over, a warning unread)');
 for(const w of [1920,1512,1440,1366,1280,1152,1024,960,900,820]){
  for(const mode of ['review','fund']){
   const ctx=await b.newContext({viewport:{width:w,height:900}});
   await seedLs(ctx, { spmtTheme:'harbor', spmtMode:mode, prio27who:'Pat', [CYC_KEY.ff]: cycOtherStore('PB|2027') }, [CYC_KEY.om, CYC_KEY.sp, CYC_KEY.opn]);
   const p=await ctx.newPage();
   await p.goto('file://'+TAGGED);
   await p.waitForFunction(()=>typeof render==='function' && document.querySelectorAll('#list .row').length>0, null, {timeout:40000});
   await p.waitForTimeout(400);
   const r=await p.evaluate(measure);
   const state = r.cyc==='⚠ Mixed ▾' && /unallocated/.test(r.fit) && / over$/.test(r.fit) && r.unread;
   const oneLine = r.hdrSpread<=6 && !/tight2/.test(r.cls) && (w<=1100 || r.tbarSpread<=6);
   const ok = state && oneLine && r.maxRight<=w && r.docW<=w && r.missing===0 && r.unusable.length===0;
   if(!ok) bad++;
   if(r.unusable.length) unusableAt++;
   if(!(oneLine && r.maxRight<=w && r.docW<=w && r.missing===0)) layoutAt++;
   console.log(`  ${ok?'ok  ':'FAIL'} ${String(w).padStart(5)}px ${mode.padEnd(6)}  context bar ${r.hdrH}px ${r.hdrSpread<=6 && !/tight2/.test(r.cls)?'one line':'WRAPS'} (${r.cls.replace(/^hdr ?/,'')||'no step'})`
     + `${state?'':'  NOT THE STATE MEANT ('+r.cyc+', '+(r.unread?'unread':'nothing unread')+', "'+r.fit+'")'}  task bar ${r.tbarH}px  page ${r.docW}px wide${r.missing? '  '+r.missing+' control(s) missing':''}`
     + `  ${r.controls} controls ${r.unusable.length? r.unusable.length+' NOT USABLE: '+r.unusable.slice(0,4).join(' | ') : 'all on screen, whole and clickable'}`);
   await ctx.close();
  }
 }
}
await b.close();
// v2.00 (UI S4, fix round): the summary names each cause on its own: a width can fail for a control that is not usable alone
console.log(bad? `\n  ${bad} width(s) failed: ${layoutAt} wrap, overflow or miss a control; ${unusableAt} with a control not usable`
    + `${unusableAt? '' : ' (at every width tested every control is on screen, whole and clickable)'}\n`
  : '\n  The context bar and the task bar fit at every width tested: one line each above 1100px, nothing past the edge, every control on screen, whole and clickable\n');
process.exit(bad?1:0);
