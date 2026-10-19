// mkmut.cjs <name> <line> <exact old line> <new line> : copy verify/cur to verify/<name>, replace ONE line, refusing unless it matches exactly.
const fs=require('fs'), path=require('path'), cp=require('child_process');
const [,,name,ln,oldL,newL]=process.argv; const V=__dirname; const src=path.join(V,'cur'), dst=path.join(V,name);
const lines=fs.readFileSync(path.join(src,'prioritization-board-grid.html'),'utf8').split('\n');
if(lines[+ln-1]!==oldL) { console.error('REFUSED: line '+ln+' is '+JSON.stringify(lines[+ln-1])); process.exit(2); }
fs.mkdirSync(dst,{recursive:true});
cp.execSync(`cp -r ${src}/tools ${src}/package.json ${src}/runtime-encoding-shim.mjs ${dst}/ && ln -sfn /home/user/orbit-board/node_modules ${dst}/node_modules`);
lines[+ln-1]=newL; fs.writeFileSync(path.join(dst,'prioritization-board-grid.html'), lines.join('\n'));
const d=cp.spawnSync('diff',[path.join(src,'prioritization-board-grid.html'), path.join(dst,'prioritization-board-grid.html')]).stdout.toString();
fs.writeFileSync(path.join(V,name+'.diff'), d);
console.log(name, cp.execSync('git hash-object '+path.join(dst,'prioritization-board-grid.html')).toString().trim()); process.stdout.write(d);
