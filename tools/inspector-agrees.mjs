// The inspector is meant to be a second VIEW of the selected row, not a second copy of its data.
// That is a claim about the code; this makes it a measured fact. For every row, select it and
// compare the panel's figures against the lane engine's own numbers for that requirement.
import { chromium } from 'playwright-core';
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const FILE = process.argv[2] || new URL('../prioritization-board-grid.html', import.meta.url).pathname;

const it = (id,grp,title,ask)=>({id,grp,team:grp,sect:'',custom:false,title,event:title,ccar:'',fy26:ask.map(()=>0),ask,alloc:null});
const SC = { services:['STOVL','USMC CV','USN'],
  items:[it('A','PSM','Engine depot overhaul',[42,18,26]), it('B','AV','Avionics spares',[31,22,14]),
         it('C','ATL','Airframe structural repair',[28,11,19]), it('D','MxS','Support equipment',[22,9,13]),
         it('E','TSS','Training device',[17,12,8]), it('F','CDS','Software maintenance',[15,7,11]),
         it('G','PP','Tooling and GSE',[12,6,5])],
  disc:[100,45,55], mand:[40,20,25], order:['A','B','C','D','E','F','G'], mc:{A:true,C:true} };

const b = await chromium.launch({ executablePath: CHROME });
const p = await b.newPage({ viewport:{width:1700,height:1000} });
const errs = []; p.on('pageerror', e => errs.push(String(e)));
await p.goto('file://' + FILE);
await p.evaluate(()=>localStorage.setItem('spmtTheme','harbor'));
await p.reload(); await p.waitForTimeout(700);
await p.evaluate(sc=>{ SVC.length=0; sc.services.forEach(s=>SVC.push(s)); DATA.services=SVC; MS.cur=2027; MS.base=2027;
  const st={order:sc.order,alloc:{},mc:sc.mc,fsrc:{},custom:[],removed:[],discSvc:sc.disc,mandSvc:sc.mand};
  MS.years['2027']=st; applyState(st); DATA.items.length=0; sc.items.forEach(i=>DATA.items.push(i));
  S.discSvc=sc.disc; S.mandSvc=sc.mand; S.order=sc.order; S.fsrc={}; S.mc=sc.mc; S.alloc={};
  S.pmoOrder={}; sc.items.forEach(i=>{ (S.pmoOrder[i.grp]=S.pmoOrder[i.grp]||[]).push(i.id); }); render(); }, SC);
await p.waitForTimeout(300);

let bad = 0;
for (const id of SC.order) {
  await p.click('#row-' + id); await p.waitForTimeout(120);
  const r = await p.evaluate(rid => {
    const sum = a => (a||[]).reduce((x,y)=>x+y,0);
    const t = tiers(null, scenOpt())[rid];
    const item = DATA.items.filter(x=>x.id===rid)[0];
    const fields = {};
    document.querySelectorAll('#inspector .insp-f').forEach(f => {
      fields[f.querySelector('.fl').textContent.trim().toLowerCase()] = f.querySelector('.fv').textContent.trim();
    });
    // ★ MC shortage is one of the two STATED Mission Critical rules and the inspector is where it
    // is read per requirement. It went unchecked here, and the panel spent that whole time saying
    // "covered" for every starred row because it was reading an identifier that is not in scope.
    const mcs = SVC.map((s,i)=>Math.max(0, (item.ask[i]||0) - ((t.d[i])||0)));
    return { fields, mc: !!S.mc[rid],
             truth: { ask: sum(item.ask), d: sum(t.d), m: sum(t.m), u: sum(t.u), mcShort: sum(mcs) } };
  }, id);
  // fM() formats; compare the rendered string to the same formatter applied to the engine's number
  const fmt = await p.evaluate(n => fM(n), r.truth.ask);
  const fd = await p.evaluate(n => fM(n), r.truth.d);
  const fm2 = await p.evaluate(n => fM(n), r.truth.m);
  const fu = await p.evaluate(n => fM(n), r.truth.u);
  const want = { requirement: fmt, discretionary: fd, mandatory: fm2 };
  const got = { requirement: r.fields[Object.keys(r.fields).find(k=>k.includes('requirement'))],
                discretionary: r.fields['discretionary'], mandatory: r.fields['mandatory'] };
  const unfGot = r.fields['unfunded'];
  const unfWant = r.truth.u > 0.005 ? fu : '—';
  const fmc = await p.evaluate(n => fM(n), r.truth.mcShort);
  const mcKey = Object.keys(r.fields).find(k => k.includes('mc shortage'));
  const mcGot = mcKey ? r.fields[mcKey] : '(field missing)';
  const mcWant = !r.mc ? '—' : (r.truth.mcShort > 0.005 ? fmc : 'covered');
  const ok = got.requirement===want.requirement && got.discretionary===want.discretionary
          && got.mandatory===want.mandatory && unfGot===unfWant && mcGot===mcWant;
  if (!ok) { bad++;
    console.log(`  FAIL  ${id}  panel ${JSON.stringify({...got, unfunded:unfGot, mcShortage:mcGot})}  engine ${JSON.stringify({...want, unfunded:unfWant, mcShortage:mcWant})}`); }
  else console.log(`  ok    ${id}  req ${got.requirement} · D ${got.discretionary} · M ${got.mandatory} · unf ${unfGot} · ★ ${mcGot}`);
}
await b.close();
if (errs.length) { console.log('\n  page errors:', errs.length); errs.slice(0,3).forEach(e=>console.log('   ', e.slice(0,140))); }
console.log(bad ? `\n  ${bad} row(s) where the inspector disagrees with the lane engine\n`
                : '\n  the inspector agrees with the lane engine on every row\n');
process.exit(bad || errs.length ? 1 : 0);
