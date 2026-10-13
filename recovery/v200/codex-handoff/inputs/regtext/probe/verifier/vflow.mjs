// vflow.mjs <copyRoot> [variantBoard] : destination names on the way OUT -- the funds-flow workbook on the destination axis
// gives every destination a sheet, named from its name (tabName: cut to 28 UTF-16 units, deduplicated). Read from the bytes:
// the sheet names in xl/workbook.xml, any U+FFFD (a lone surrogate the encoder replaced), any character XML 1.0 forbids.
// Synthetic data only; literals for what is expected.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const root = resolve(process.argv[2]);
if (process.argv[3]) process.env.BOARD = resolve(process.argv[3]); else delete process.env.BOARD;
await import(pathToFileURL(root + '/runtime-encoding-shim.mjs').href);
const { boot, seed, BOARD } = await import(pathToFileURL(root + '/tools/export-audit/boot.mjs').href);
console.log('BOARD', BOARD);
const J = JSON.stringify;
const out = (k, v, want) => console.log(k.padEnd(50) + ' got ' + (typeof v === 'string' ? v : J(v)) + (want !== undefined ? '   want ' + J(want) + (J(v) === J(want) ? '  OK' : '  DIFFERS') : ''));
const it = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: 'Req ' + id, event: 'Ev ' + id, ccar: 'CC' + id, fy26: ask.map(() => 0), ask, alloc: null });
const SC = { services: ['USAF', 'ANG', 'AFRC'], items: [it('R1', 'AV', [900, 0, 0])], disc: [5000, 5000, 5000], mand: [0, 0, 0], order: ['R1'] };
const X = boot();
seed(X.ev, SC);
X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); }); applyState(S); save(); 'ok'`);
const NAMES = ['D'.repeat(27) + '\u{1F600}' + 'tail', "'Quoted depot'", 'Ctl\u000Bname'];
X.ev(`(function(){ ${J(NAMES)}.forEach(function(n){ flowAddEnt(); var i=flowEnts().length-1; flowSetEnt(i,'n',n); }); flowSetAxis('dest'); return 'ok'; })()`);
out('axis, kept names', JSON.parse(X.ev(`JSON.stringify([flowAxis(), flowEnts().slice(-3).map(function(e){ return e.n; })])`)), ['dest', NAMES]);
const res = JSON.parse(await X.w.eval(`(async function(){
  var cap=null,_B=window.Blob,msg=''; window.alert=function(m){ msg+=String(m); }; window.confirm=function(){ return true; };
  window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
  try{ exportFlow(); }catch(e){ window.Blob=_B; return JSON.stringify({err:'threw '+String((e&&e.message)||e)}); }
  window.Blob=_B; if(!cap) return JSON.stringify({err:'no file: '+msg.slice(0,120)});
  var u=cap instanceof Uint8Array? cap : new Uint8Array(cap.buffer||cap), i=0, dec=new TextDecoder('utf-8'), wb='', bad=[];
  while(i+30<=u.length && u[i]===0x50 && u[i+1]===0x4b && u[i+2]===0x03 && u[i+3]===0x04){
    var meth=u[i+8]|(u[i+9]<<8), csz=(u[i+18]|(u[i+19]<<8)|(u[i+20]<<16)|(u[i+21]<<24))>>>0, nl=u[i+26]|(u[i+27]<<8), xl=u[i+28]|(u[i+29]<<8);
    var name=dec.decode(u.subarray(i+30,i+30+nl)), body=meth===0? dec.decode(u.subarray(i+30+nl+xl, i+30+nl+xl+csz)) : '';
    if(name==='xl/workbook.xml') wb=body;
    var b=(body.match(/[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F]/g)||[]).length, f=(body.match(/\\uFFFD/g)||[]).length;
    if(b||f) bad.push([name, 'forbidden '+b, 'fffd '+f]);
    i+=30+nl+xl+csz; }
  var names=[]; wb.replace(/<sheet name="([^"]*)"/g, function(m,n){ names.push(n); return m; });
  return JSON.stringify({names:names, bad:bad}); })()`));
out('workbook sheet names', res.names || res.err);
out('parts with U+FFFD or a forbidden character', res.bad || res.err, []);
console.log('done');
