import argparse, json, os, signal, subprocess, time, datetime
from pathlib import Path
from zoneinfo import ZoneInfo
p=argparse.ArgumentParser()
p.add_argument('--cap',type=float,required=True);p.add_argument('--cwd',required=True);p.add_argument('--log',required=True);p.add_argument('--meta',required=True);p.add_argument('command',nargs=argparse.REMAINDER)
a=p.parse_args();cmd=a.command[1:] if a.command[:1]==['--'] else a.command
cap=min(a.cap,600)
assert cap>0
clock=lambda:datetime.datetime.now(ZoneInfo('America/New_York')).isoformat()
start=time.monotonic();started=clock();timed=False
Path(a.log).parent.mkdir(parents=True,exist_ok=True)
with open(a.log,'wb') as out:
 proc=subprocess.Popen(cmd,cwd=a.cwd,stdout=out,stderr=subprocess.STDOUT,start_new_session=True)
 try:code=proc.wait(timeout=cap)
 except subprocess.TimeoutExpired:
  timed=True;os.killpg(proc.pid,signal.SIGTERM)
  try:code=proc.wait(timeout=3)
  except subprocess.TimeoutExpired:
   os.killpg(proc.pid,signal.SIGKILL);code=proc.wait(timeout=3)
 finally:
  for sig in [signal.SIGTERM,signal.SIGKILL]:
   try:os.killpg(proc.pid,sig)
   except ProcessLookupError:pass
result={'command':cmd,'cwd':a.cwd,'cap_seconds':cap,'started_ET':started,'finished_ET':clock(),'duration_seconds':round(time.monotonic()-start,3),'exit':code,'timed_out':timed,'owned_process_group':proc.pid,'log':a.log,'completion':'incomplete' if timed else 'passed' if code==0 else 'failed'}
Path(a.meta).write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
