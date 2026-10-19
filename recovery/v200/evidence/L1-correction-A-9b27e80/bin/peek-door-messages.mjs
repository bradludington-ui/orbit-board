import { boot } from '/home/user/orbit-board/tools/export-audit/boot.mjs';
const B = boot();
console.log(B.ev(`JSON.stringify({
  order: inboundCheck(JSON.stringify({ order:['valueOf'], discSvc:[1] })),
  pmoChars: inboundCheck(JSON.stringify({ spmtPkg:1, dir:'submit', pmo:'A<b>V', items:{} })),
  look: inboundCheck(JSON.stringify({ zz_keys:{ ToString:1, valueOf_:2, hasOwnproperty:3, isPrototype:4, proto:5, __proto:6, Constructor:7 } })),
  each: ['toString','valueOf','hasOwnProperty','isPrototypeOf'].map(function(n){ var o={zz_keys:{}}; o.zz_keys[n]=1; return inboundCheck(JSON.stringify(o)); }) })`));
process.exit(0);
