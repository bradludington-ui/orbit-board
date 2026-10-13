from pathlib import Path
import json,subprocess,os
r=Path('/workspace/orbit-codex-batches-20261013-1205ET');a=r/'A4';(a/'mutants').mkdir(exist_ok=True)
for mid in json.loads((a/'mutation-ids.json').read_text()):
 board=a/'mutants'/f'{mid}.html'
 cmd=['python3','-I',str(r/'helpers/mkmut.py'),str(a/'fix/tools/export-audit/mutate.mjs'),str(a/'fix/prioritization-board-grid.html'),mid,str(board)]
 p=subprocess.run(cmd,capture_output=True,text=True,timeout=30)
 (a/f'{mid}.apply.log').write_text(p.stdout+p.stderr)
 assert p.returncode==0
 env=os.environ.copy();env['BOARD']=str(board)
 cmd=['python3',str(r/'runner.py'),'--cap','180','--cwd',str(a),'--log',str(a/f'{mid}.log'),'--meta',str(a/f'{mid}.meta.json'),'--','node','--import',str(r/'runtime-encoding-shim.mjs'),str(a/'focused.mjs')]
 p=subprocess.run(cmd,env=env,timeout=190)
 assert p.returncode==0
 d=json.loads((a/f'{mid}.log').read_text());print(mid,len(d['failures']),flush=True)
 assert d['failures'] and not any(f['where']=='harness' for f in d['failures'])
