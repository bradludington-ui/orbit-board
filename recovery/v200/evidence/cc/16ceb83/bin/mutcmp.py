# mutcmp.py <F> <H> <ids.txt> : per mutant, the failing checks (case — check) of this check's run, the run's IDS line (BOARD, its blob,
# harness blob), and whether the failing set and every verdict/value equals the builder's fm-f2-<id> record. Text only.
import json, sys, re
F,H,ids=sys.argv[1],sys.argv[2],[l.strip() for l in open(sys.argv[3]) if l.strip()]
def load(p): return [json.loads(l) for l in open(p, encoding='utf-8') if l.strip()]
mb={}
for l in open(F+'/out/mutants.txt'):
    p=l.split(); mb[p[0]]=p[1].split('=')[1]
for i in ids:
    a=load(F+'/out/M-'+i+'.checks.jsonl'); b=load(H+'/out/fm-f2-'+i+'.checks.jsonl')
    log=open(F+'/logs/M-'+i+'.log',encoding='utf-8').read()
    m=re.search(r'^IDS (\{.*\})$',log,re.M); ids_=json.loads(m.group(1))
    fa=[(r[1],r[2]) for r in a if r[3] is not True]; fb=[(r[1],r[2]) for r in b if r[3] is not True]
    key=lambda r:(r[0],r[1],r[2]); da={key(r):(r[3],r[4]) for r in a}; db={key(r):(r[3],r[4]) for r in b}
    ex=re.search(r'# end: .*exit: (\d+)',log).group(1)
    print('%s: checks %d, FAIL %d, exit %s, caught=%s | board blob %s (mutant %s, BOARD_set %s), harness %s | builder fm-f2: fail %d, same failing set %s, all verdicts+values equal %s'
      % (i,len(a),len(fa),ex,len(fa)>0,ids_['board'][:8],mb[i][:8],ids_['BOARD_set'],ids_['harnessBlob'][:8],len(fb),set(fa)==set(fb),da==db))
    for c,k in fa: print('     - %s — %s' % (c, k))
