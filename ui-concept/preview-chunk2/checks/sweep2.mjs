// Chunk-2 layout sweep: base vs new in Chromium, same synthetic seed (runtime only). Row overflow per mode per width,
// new in three configurations: sidebar open, sidebar as the rail, docked (sidebar open). Also the drawer's inputs.
import { chromium } from '/home/user/orbit-ui/node_modules/playwright-core/index.mjs';
import { pathToFileURL } from 'node:url';
const SP1 = '/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/uichunk1';
const BOARDS = { base: SP1 + '/rv-base.html', neu: '/home/user/orbit-ui/prioritization-board-grid.html' };
const STEP = +(process.env.STEP || 20);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const errs = [];
const PM = ['PSM', 'ATL', 'TSS', 'AV', 'MxS', 'LOG'];
const NAMES = ['Depot pod overhaul', 'Engine spares pool', 'Training system refresh', 'Avionics software drop', 'Maintenance data link', 'Logistics IT sustainment', 'Support equipment buy', 'Simulator concurrency', 'Field service reps', 'Repair network stand-up', 'Tech data update', 'Obsolescence redesign', 'Test equipment recal', 'Packaging & shipping'];
const items = NAMES.map((n, i) => ({ id: 'S' + String(i + 1).padStart(2, '0'), grp: PM[i % PM.length], team: PM[i % PM.length], sect: '', custom: false, title: 'Synthetic — ' + n, event: n, ccar: 'SYN-' + (100 + i), fy26: [0, 0, 0], ask: [(9 + (i * 7) % 23) * 1e6, (2 + (i * 3) % 7) * 1e6, (1 + (i * 5) % 4) * 1e6], alloc: null }));
async function open(file, w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('dialog', d => d.dismiss().catch(() => {}));
  page.on('pageerror', e => errs.push(file.slice(-30) + ' ' + w + ': ' + String(e)));
  await page.goto(pathToFileURL(file).href);
  await page.waitForTimeout(500);
  await page.evaluate(({ items }) => {
    SVC.length = 0; ['USAF', 'ANG', 'AFRC'].forEach(s => SVC.push(s)); DATA.services = SVC;
    MS.cur = 2027; MS.base = 2027;
    const order = items.map(i => i.id);
    const st = { order, alloc: {}, mc: {}, fsrc: {}, custom: [], removed: [], discSvc: [180e6, 40e6, 22e6], mandSvc: [25e6, 6e6, 3e6] };
    MS.years['2027'] = st; applyState(st);
    DATA.items.length = 0; items.forEach(i => DATA.items.push(i));
    BASE_ITEMS.length = 0; DATA.items.forEach(i => { BASE_ITEMS.push(i); BASE_ASK[i.id] = i.ask.slice(); });
    S.discSvc = st.discSvc; S.mandSvc = st.mandSvc; S.order = order; S.fsrc = {}; S.mc = {}; S.alloc = {};
    S.bm = { disc: st.discSvc, mand: st.mandSvc, adds: [] };
    render();
  }, { items });
  return page;
}
const M = () => { const row=document.querySelector('#list .row'); if(!row) return null; const R=row.getBoundingClientRect();
  const out=[...row.children].filter(c=>c.offsetParent!==null).filter(c=>c.getBoundingClientRect().right>R.right+1).map(c=>c.className.split(' ')[0]);
  const ins=document.getElementById('inspector'); const IR=ins? ins.getBoundingClientRect() : null;
  const insp=[...document.querySelectorAll('#inspector input')].filter(e=>e.offsetParent!==null && /\d/.test(e.value||'') && e.scrollWidth>e.clientWidth+1).length;
  const inspOff = (ins && getComputedStyle(ins).display!=='none' && IR.width>0 && (ins.classList.contains('open') || getComputedStyle(ins).position!=='fixed')) ? (IR.left < -1 || IR.right > window.innerWidth + 1) : false;
  return {over:Math.round(row.scrollWidth-row.clientWidth), out, insp, inspOff, doc:document.documentElement.scrollWidth-document.documentElement.clientWidth, cls:document.documentElement.className}; };
const widths=[]; for(let w=700; w<=1900; w+=STEP) widths.push(w);
const res={};
const cfgs = { base: [['base', null]], neu: [['open', {rail:false,dock:false}], ['rail', {rail:true,dock:false}], ['dock', {rail:false,dock:true}], ['dockrail', {rail:true,dock:true}]] };
for (const [lbl,file] of Object.entries(BOARDS)) {
  for (const [cn, cfg] of cfgs[lbl]) {
    const p=await open(file,1440,900);
    if (cfg) await p.evaluate(c=>{ UI2.rail=c.rail; UI2.dock=c.dock; uiRailApply(); uiSync(); uiCols(); }, cfg);
    for (const mode of ['review','rank','fund','compare','brief']) {
      await p.evaluate(m=>{ uiSetMode(m); render(); if(m!=='brief'){ const ids=gridIds(); curRow=ids[2]; gridMark(); inspectorBody(); try{ drawerClose(); }catch(e){} } },mode);
      for (const w of widths) {
        await p.setViewportSize({width:w,height:900}); await p.evaluate(()=>{ window.dispatchEvent(new Event('resize')); render(); }); await p.waitForTimeout(140);
        const m=await p.evaluate(M);
        let mo=null;
        if (mode!=='brief' && (w%100===0 || w===1050)) {  // drawer / docked panel open: its money inputs
          mo = await p.evaluate(()=>{ const ids=gridIds(); setCur(ids[2]); return null; }); await p.waitForTimeout(260);
          mo = await p.evaluate(M); await p.evaluate(()=>{ try{ drawerClose(); }catch(e){} });
        }
        (res[lbl+'/'+cn+' '+mode]=res[lbl+'/'+cn+' '+mode]||[]).push([w,m,mo]);
      }
    }
    await p.context().close();
  }
}
await browser.close();
const fmt={};
for (const [k,arr] of Object.entries(res)) {
  const bad=arr.filter(([w,m])=>m && (m.over>0||m.out.length||m.doc>0)).map(([w,m])=>w+':'+(m.out.join('+')||'')+(m.doc>0?' doc'+m.doc:''));
  const badOpen=arr.filter(([w,m,mo])=>mo && (mo.over>0||mo.out.length||mo.insp||mo.inspOff||mo.doc>0)).map(([w,m,mo])=>w+':'+(mo.out.join('+')||'')+(mo.insp?' insp'+mo.insp:'')+(mo.inspOff?' inspOff':'')+(mo.doc>0?' doc'+mo.doc:''));
  fmt[k]={closed:bad, panelOpen:badOpen, n:arr.length};
}
console.log(JSON.stringify({fmt,errs},null,1));
