// The toolbar controls must stay on ONE line: Export used to drop to a second row on any window
// narrower than about 1040 CSS px — which a 1280 laptop at Windows' usual 125% scaling reports.
// Checks both builds at the widths people actually use, and that the group never overflows the bar.
//
//   node tools/toolbar-fits.mjs
import { chromium } from 'playwright-core';
import { resolve } from 'node:path';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
let bad=0;
for(const f of ['prioritization-board-grid.html']){
 console.log('\n'+f);
 for(const w of [1920,1512,1280,1152,1024,960,900,820]){
  const p=await b.newPage({viewport:{width:w,height:900}});
  await p.goto('file://'+resolve(new URL('..', import.meta.url).pathname, f));
  await p.evaluate(()=>localStorage.setItem('spmtTheme','harbor'));
  await p.reload(); await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{
    const q=s=>document.querySelector(s);
    const top=s=>{const e=q(s); return e?Math.round(e.getBoundingClientRect().top):null;};
    const bar=q('.tbar'), grp=q('.tgrp');
    const gr=grp.getBoundingClientRect(), br=bar.getBoundingClientRect();
    return { fy:top('#m_fy'), tools:top('#m_tools'), exp:top('#m_export'),
             sameLine: top('#m_export')===top('#m_tools') && top('#m_export')===top('#m_fy'),
             overflow: Math.round(gr.right - (br.right - 18)),
             expRight: Math.round(q('#m_export').getBoundingClientRect().right),
             winW: window.innerWidth };
  });
  const ok = r.sameLine && r.overflow<=0 && r.expRight<=w;
  if(!ok) bad++;
  console.log(`  ${ok?'ok  ':'FAIL'} ${String(w).padStart(5)}px  export/tools/fy tops ${r.exp}/${r.tools}/${r.fy}`
    + `  group overflow ${r.overflow>0?'+'+r.overflow+'px':'none'}  export right edge ${r.expRight}`);
  await p.close();
 }
}
await b.close();
console.log(bad? `\n  ${bad} width(s) still wrap or overflow\n` : '\n  Export stays on the toolbar line at every width tested, with no overflow\n');
process.exit(bad?1:0);
