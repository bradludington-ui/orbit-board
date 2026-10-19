import './runtime-encoding-shim.mjs';
import { boot, bootRelease } from './tools/export-audit/boot.mjs';
import { writeFileSync } from 'node:fs';
const X=boot(); const {w,ev}=X;
const results=[];
const check=(name,actual,expected,kind='control')=>results.push({name,actual,expected,kind,
  status:JSON.stringify(actual)===JSON.stringify(expected)?'passed':'failed'});
ev(`MS.rcn=[{k:'rsynthetic',rcn:'12345',eeic:'ABCDE',t:'Synthetic test',svc:['USAF','ANG']}]; 'ok'`);
const input=w.document.createElement('input'); input.id='synthetic-eeic-input'; w.document.body.appendChild(input);
input.value='ABCDEFGHIJK';
ev(`rcnSet(0,'eeic',document.getElementById('synthetic-eeic-input').value,document.getElementById('synthetic-eeic-input')); 'ok'`);
check('ASCII over-limit typed EEIC refused; old code unchanged',ev('rcnReg()[0].eeic'),'ABCDE');
check('ASCII refusal preserves typed field text',input.value,'ABCDEFGHIJK');
input.value='  abcde  ';
ev(`rcnSet(0,'eeic',document.getElementById('synthetic-eeic-input').value,document.getElementById('synthetic-eeic-input')); 'ok'`);
check('permitted trimmed code normalized to uppercase',ev('rcnReg()[0].eeic'),'ABCDE');
input.value='ß'.repeat(10);
ev(`rcnSet(0,'eeic',document.getElementById('synthetic-eeic-input').value,document.getElementById('synthetic-eeic-input')); 'ok'`);
check('R2 normalized over-limit Unicode expansion refused; previous code retained',ev('rcnReg()[0].eeic'),'ABCDE','defect');
check('R2 accepted EEIC may not exceed10after uppercase normalization',ev('rcnReg()[0].eeic.length<=10'),true,'defect');
check('whole-board boot has no jsdom script errors',X.errors,[]);
const summary={mainSHA:'f9b441365551cd691a20a8f0b08a374a92a12f0e',
  boardBlob:'b160bc031c7f70a4492f64394893d9b74bb0f327',
  evidenceKind:'fresh whole-board jsdom synthetic typed-code runtime; actual rcnSet save/render and DOM field',
  runtimeAdaptation:'Node TextEncoder/Decoder shim plus boot.mjs standard non-math browser stubs',
  independentExpected:'ten U+00DF characters normalize to twenty ASCII S; ten-character persisted limit requires refusal',
  results,passed:results.filter(r=>r.status==='passed').length,failed:results.filter(r=>r.status==='failed').length};
writeFileSync(new URL('../code-runtime-results.json',import.meta.url),JSON.stringify(summary,null,2)+'\n');
results.forEach(r=>console.log(JSON.stringify(r))); console.log(JSON.stringify({passed:summary.passed,failed:summary.failed}));
bootRelease(0); process.exit(summary.failed?1:0);
