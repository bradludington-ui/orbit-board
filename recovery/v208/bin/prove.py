# prove.py IDS.json OUT.jsonl [ID ...]   (run from the repository root: python3 -I -B recovery/v208/bin/prove.py ...)
# Each mutation against ITS OWN check only, on a mutant of the board in the working tree -- how v2.07's 154 mutations were
# proved one by one without a sweep (Brad's rule of 20 Oct: no sweep without his named go). Nothing from mutate.mjs is run:
# recovery/v200/bin/mkmut.py reads one entry AS TEXT and writes a mutant only when its find matches exactly once.
#
# IDS.json is a list of {"id": ..., "caughtBy": "<suite> / <scenario name substring>[; <another>]"}; the suite is one of
#   audit-board, audit-other, audit-import, audit-recon, audit-hostile, audit-inject, audit (the short forms board, other,
#   import, recon, hostile, inject work too). Scenario substrings pick the blocks slim.py keeps; audit-hostile and
#   audit-inject always run whole. Give ids after OUT to run only those.
# OUT.jsonl gets one line per mutation: CAUGHT (exit 1 with a FAILING CHECK banner), SURVIVED (exit 0 with ALL CHECKS
#   PASSED), or CRASHED (anything else: no verdict, which is never a catch). Ids already in OUT are skipped, so a run cut off
#   by a restart resumes. A block that "threw" is reported beside its verdict: a catch by a throw is weaker than by a check.
# Env: JOBS (default 4), HEAP (MB, default 6144 -- recon and import die at this container's ~2 GB default; keep JOBS x HEAP
#   within about 12 GB on a 15 GB machine), TIMEOUT (s, 1500). The heap is ADDED to NODE_OPTIONS, which here already carries
#   the proxy's --use-openssl-ca.
# Slimmed suites are written beside the originals as _slim-prove-<hash>.mjs (their imports are relative) and removed at the
# end, on Ctrl-C and on SIGTERM/SIGHUP; only SIGKILL or a container restart leaves them (git ignores them since v2.08's
# handoff). A scenario name that matches nothing is refused by slim.py before anything runs.
import json, subprocess, sys, os, re, hashlib, tempfile, shutil, signal
from concurrent.futures import ThreadPoolExecutor
R = os.getcwd(); EA = os.path.join(R, 'tools', 'export-audit'); BIN = os.path.dirname(os.path.abspath(__file__))
if not os.path.exists(os.path.join(EA, 'mutate.mjs')): sys.exit('run from the repository root')
A = json.load(open(sys.argv[1])); out = sys.argv[2]; only = set(sys.argv[3:])
SUITES = {'board': 'audit-board.mjs', 'other': 'audit-other.mjs', 'import': 'audit-import.mjs', 'recon': 'audit-recon.mjs',
          'hostile': 'audit-hostile.mjs', 'inject': 'audit-inject.mjs', 'audit': 'audit.mjs'}
WHOLE = {'audit-hostile.mjs', 'audit-inject.mjs'}
def suite_of(s):
    s = s.strip(); s = s[len('audit-'):] if s.startswith('audit-') else s
    if s.endswith('.mjs'): s = s[:-4]
    if s not in SUITES: raise SystemExit('unknown suite ' + repr(s))
    return SUITES[s]
done = set()
if os.path.exists(out):
    for l in open(out): done.add(json.loads(l)['id'])
MUT = tempfile.mkdtemp(prefix='prove-mut-')
slims = {}
def _stop(sig, frame): raise SystemExit(128 + sig)      # so the finally below still removes what this run wrote
for _s in (signal.SIGTERM, signal.SIGHUP): signal.signal(_s, _stop)
def slim_for(suite, keys):
    k = (suite, tuple(keys))
    if k in slims: return slims[k]
    f = os.path.join(EA, '_slim-prove-' + hashlib.md5(repr(k).encode()).hexdigest()[:8] + '.mjs')
    r = subprocess.run(['python3', '-I', '-B', os.path.join(BIN, 'slim.py'), os.path.join(EA, suite), f] + list(keys), capture_output=True, text=True)
    # a slim that kept no scenario would run nothing and read as SURVIVED -- slim.py refuses a name that matches nothing
    if r.returncode or not re.search(r'\((\d*[1-9]\d*) scenarios\)', r.stdout):
        try: os.remove(f)
        except OSError: pass
        raise SystemExit('slim failed for ' + suite + ': ' + (r.stdout + r.stderr).strip())
    slims[k] = f; return f
def plan():
    jobs = []
    for m in A:
        if m['id'] in done or (only and m['id'] not in only): continue
        s, _, rest = m['caughtBy'].partition(' / ')
        suite = suite_of(s)
        keys = [k.strip() for k in rest.split(';') if k.strip()]
        if suite not in WHOLE and not keys: raise SystemExit(m['id'] + ': no scenario named after the suite')
        jobs.append((m, os.path.join(EA, suite) if suite in WHOLE else slim_for(suite, keys)))
    return jobs
def run(job):
    m, f = job; mut = os.path.join(MUT, m['id'] + '.html')
    r = subprocess.run(['python3', '-I', '-B', os.path.join(R, 'recovery', 'v200', 'bin', 'mkmut.py'), os.path.join(EA, 'mutate.mjs'),
                        os.path.join(R, 'prioritization-board-grid.html'), m['id'], mut], capture_output=True, text=True)
    if r.returncode != 0: return {'id': m['id'], 'verdict': 'NOT APPLIED', 'detail': (r.stdout + r.stderr)[-400:]}
    env = dict(os.environ, BOARD=mut, NODE_OPTIONS=(os.environ.get('NODE_OPTIONS', '') + ' --max-old-space-size=' + os.environ.get('HEAP', '6144')).strip())
    try:
        p = subprocess.run(['node', f], capture_output=True, text=True, env=env, timeout=int(os.environ.get('TIMEOUT', '1500')), cwd=R)
        o = p.stdout + p.stderr
    except subprocess.TimeoutExpired:
        p = None; o = 'TIMEOUT'
    os.remove(mut)
    fails = re.findall(r'(\d+) FAILING CHECK', o)
    v = 'CAUGHT' if p and p.returncode == 1 and fails else ('SURVIVED' if p and p.returncode == 0 and 'ALL CHECKS PASSED' in o else 'CRASHED')
    threw = len(re.findall(r'the block threw', o))
    lines = [l for l in o.split('\n') if l.strip().startswith(('✗', 'FAIL', '-', '•')) or 'got' in l][:6]
    return {'id': m['id'], 'verdict': v, 'fails': fails[:1], 'threw': threw, 'suite': os.path.basename(f),
            'detail': '\n'.join(lines)[:600] if v != 'CAUGHT' or threw else ''}
ex = None
try:
    jobs = plan()
    ex = ThreadPoolExecutor(max_workers=int(os.environ.get('JOBS', '4')))
    for res in ex.map(run, jobs):
        with open(out, 'a') as fh: fh.write(json.dumps(res, ensure_ascii=False) + '\n')
        print(res['verdict'], res['id'], res.get('fails'), 'threw' if res.get('threw') else '', flush=True)
finally:
    if ex: ex.shutdown(wait=False, cancel_futures=True)
    for f in set(slims.values()):
        try: os.remove(f)
        except OSError: pass
    shutil.rmtree(MUT, ignore_errors=True)
