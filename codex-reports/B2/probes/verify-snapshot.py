import hashlib,json,sys
from pathlib import Path
p=Path(sys.argv[1]);checks=[]
for line in (p/'MANIFEST.sha256').read_text().splitlines():
 if not line.strip():continue
 expected,name=line.split(None,1);name=name.lstrip('* ')
 actual=hashlib.sha256((p/name).read_bytes()).hexdigest()
 checks.append({'file':name,'expected':expected,'actual':actual,'ok':actual==expected})
print(json.dumps({'checks':checks,'passed':sum(c['ok'] for c in checks),'failed':sum(not c['ok'] for c in checks)},indent=2))
raise SystemExit(0 if all(c['ok'] for c in checks) else 1)
