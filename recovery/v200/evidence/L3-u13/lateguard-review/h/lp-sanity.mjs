// lp-sanity.mjs: does `liveOpen=true; render()` (what run X1 did) draw the Live view panel, and does its draw call
// driveProbePerm (once, _drivePermProbed) on the after/ board? Prints only.
import { pathToFileURL } from 'node:url';
const ROOT = process.env.ROOT;
await import(pathToFileURL(ROOT + '/runtime-encoding-shim.mjs').href);
const { boot } = await import(pathToFileURL(ROOT + '/tools/export-audit/boot.mjs').href);
const A = boot(); await new Promise(r => setTimeout(r, 80));
A.ev(`localStorage.setItem('prio27who','Brad'); _liveCfg=Object.assign(liveCfg(), {store:true, mode:'drive', on:false, folder:'shared'}); 'ok'`);
const before = A.ev(`(document.getElementById('liveBody')||{innerHTML:''}).innerHTML.length+'/'+_drivePermProbed`);
A.ev(`liveOpen=true; _drivePermProbed=false; render(); 'ok'`);
const after = A.ev(`(document.getElementById('liveBody')||{innerHTML:''}).innerHTML.length+'/'+_drivePermProbed+'/'+(document.getElementById('livePanel')||{style:{}}).style.display`);
console.log('liveBody chars/probed before:', before, ' after liveOpen+render:', after);
process.exit(0);
