from pathlib import Path
import json,subprocess,sys,os
r=Path('/workspace/orbit-codex-batches-20261013-1205ET/A3');root=r.parent
(r/'mutants').mkdir(exist_ok=True); results=[]
for e in json.loads((r/'mutations.json').read_text()):
 mid=e['id'];html=r/'mutants'/f'{mid}.html';log=r/'mutants'/f'{mid}.log';meta=r/'mutants'/f'{mid}-meta.json'
 p=subprocess.run(['python3',str(root/'runner.py'),'--cap','30','--cwd',str(r),'--log',str(r/'mutants'/f'{mid}-make.log'),'--meta',str(r/'mutants'/f'{mid}-make-meta.json'),'--','python3','-I',str(root/'helpers/mkmut.py'),str(r/'fix/tools/export-audit/mutate.mjs'),str(r/'fix/prioritization-board-grid.html'),mid,str(html)],capture_output=True,text=True);print(p.stdout,flush=True)
 p=subprocess.run(['python3',str(root/'runner.py'),'--cap','180','--cwd',str(r),'--log',str(log),'--meta',str(meta),'--','env','BOARD='+str(html),'node','--import',str(r/'base/runtime-encoding-shim.mjs'),'focused.mjs'],capture_output=True,text=True);print(p.stdout,flush=True)
 try:d=json.loads(log.read_text());results.append({'id':mid,'checks':d['checks'],'failed':d['failed'],'harness_failures':[x for x in d['failures'] if x['where']=='harness'],'failing_checks':[{'where':x['where'],'what':x['what']} for x in d['failures']]})
 except Exception as ex:results.append({'id':mid,'incomplete':str(ex)})
(r/'mutants/results.json').write_text(json.dumps(results,indent=2));print(json.dumps(results),flush=True)
