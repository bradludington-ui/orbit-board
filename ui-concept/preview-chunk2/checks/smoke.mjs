import { boot } from '/home/user/orbit-ui/tools/export-audit/boot.mjs';
const X = boot();
const r = X.ev(`JSON.stringify({on:document.documentElement.className, keys:Object.keys(localStorage).sort(), kpi:document.getElementById('uiKpis').innerHTML.length, src0:(typeof SRC0==='string')? [SRC0.indexOf('ui-on')>=0 && /class="[^"]*ui-on/.test(SRC0), SRC0.indexOf('uiCycBtn'), SRC0.indexOf('uiEdChip')] : 'none', drawer:drawerNarrow()})`);
console.log(r); console.log('errors', JSON.stringify(X.errors));
process.exit(0);
