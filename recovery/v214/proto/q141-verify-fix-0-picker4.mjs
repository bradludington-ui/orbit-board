// Real Chromium save picker (headed, Xvfb, GTK dialog driven by XTest): pick the SOURCE board "ORBIT Live.html" as the target,
// read it the way the recommended fileTargetWhy would, and write NOTHING (the "refused target / write error" branch).
import { createRequire } from 'module';
const require = createRequire('/home/user/orbit-board/package.json');
const { chromium } = require('playwright');
import { CHROME } from '/home/user/orbit-board/tools/chrome.mjs';
import fs from 'fs'; import crypto from 'crypto'; import { execFileSync } from 'child_process';
const H='/tmp/claude-0/-home-user/25675cae-e62d-54ec-be43-d816f1dff607/scratchpad/quota/verify-fix-0';
const D=H+'/pk2'; fs.mkdirSync(D,{recursive:true});
const SRC=H+'/../sizes/out/e-v212.html';
fs.copyFileSync(SRC, D+'/ORBIT Live.html');
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').slice(0,16);
const before={size:fs.statSync(D+'/ORBIT Live.html').size, sha:sha(D+'/ORBIT Live.html')};
fs.writeFileSync(D+'/page.html','<!doctype html><button id=b>Write the imported board into a new file…</button><script>window.R=null;'
 +'document.getElementById("b").onclick=async()=>{try{const h=await showSaveFilePicker({suggestedName:"ORBIT Live (ORBIT v2.13).html"});'
 +'const old=await (await h.getFile()).text();const mm=old.match(/<script type="application\\/json" id="pubState">([\\s\\S]*?)<\\/script>/);'
 +'window.R={name:h.name,len:old.length,holdsState:!!(mm&&mm[1]!=="null"),targetRuleWouldSay:(old.length===0?"new or empty file: allowed":"checked")};'
 +'}catch(e){window.R={err:e.name+": "+e.message};}};</script>');
const b = await chromium.launch({executablePath: CHROME, headless:false, args:['--no-sandbox']});
const p = await b.newPage();
await p.goto('file://'+D+'/page.html');
await p.click('#b');
await p.waitForTimeout(2500);
execFileSync('python3',['-I',H+'/xkeys.py','Control_L+a','type:'+D+'/ORBIT','space','type:Live.html','Escape']);
await p.waitForTimeout(800);
execFileSync('import',['-window','root',H+'/p4-before-save.png']);
execFileSync('python3',['-I',H+'/xkeys.py','click:1074,798']);
await p.waitForTimeout(3000);
execFileSync('import',['-window','root',H+'/p4-after.png']);
const R=await p.evaluate(()=>window.R);
const after={size:fs.statSync(D+'/ORBIT Live.html').size};
console.log(JSON.stringify({chromium:b.version(), before, R, after},null,1));
fs.writeFileSync(H+'/picker4.out.json', JSON.stringify({chromium:b.version(), before, R, after},null,1));
await b.close();
