# edit1.py : text edits of src/body.mjs (adds SHdk / SHdkC: the shared state file stamped an hour ahead, as REMOTE is)
p='/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17/src/body.mjs'
s=open(p).read()
def rep(old,new):
    global s
    assert s.count(old)==1, old[:60]
    s=s.replace(old,new)
rep("""  SHdC:       { fam: 'adopt', mode: 'click',  held: false },
""","""  SHdC:       { fam: 'adopt', mode: 'click',  held: false },
  SHdk:       { fam: 'adopt', mode: 'click',  held: true,  ahead: HOUR },   // as SHd, the shared state file stamped an hour ahead (Carol's clock fast)
  SHdkC:      { fam: 'adopt', mode: 'click',  held: false, ahead: HOUR },
""")
rep("""  SHa:  { adopt: both(['SHARED', 1, true, null, true]), u17: both(true),""","""  SHdk: { adopt: both(['SHARED', 1, true, 'BRAD-2', true]), u17: both(true),
          v3: both([0, 'SHARED', 'BRAD-2', 'SHARED', 'saved', true, true]),
          v4: both(['BRAD-2', 'in-file', 'SHARED', 'BRAD-2', 'put back', null, 'BRAD-2', 'BRAD-2', 'clash']) },
  SHdkC: { adopt: both(['SHARED', 0, true, 'BRAD-2', true]), u17: both(false),
          v3: both([0, 'SHARED', 'BRAD-1', 'SHARED', 'saved', true, true]),
          v4: both(['BRAD-2', 'in-place', 'SHARED', 'BRAD-1', 'put back', 'SHARED', 'BRAD-2', 'BRAD-2', 'saved']) },
  SHa:  { adopt: both(['SHARED', 1, true, null, true]), u17: both(true),""")
rep("""  const mkShared = async () => { const R0 = boot({ html: F1 }); await pause(80); wire(R0.ev, 'Carol', KEY.carol);
    R0.ev(`setNote('A', 'SHARED'); setAlloc('A', '600'); 'ok'`); return JSON.parse(R0.ev('JSON.stringify(MS)')); };""",
"""  const mkShared = async () => { const R0 = boot({ html: F1 }); await pause(80); wire(R0.ev, 'Carol', KEY.carol);
    if (CFG.ahead) R0.ev(`(function(){ var real=Date.now; Date.now=function(){ return real.call(Date)+${CFG.ahead}; }; return 'ok'; })()`);
    R0.ev(`setNote('A', 'SHARED'); setAlloc('A', '600'); 'ok'`); return JSON.parse(R0.ev('JSON.stringify(MS)')); };""")
rep("""  if (CFG.mode === 'click') st = await mkShared();           // published earlier: older than Brad's edit, as it arrives at opening
""","""  if (CFG.mode === 'click') st = await mkShared();           // published earlier: older than Brad's edit, as it arrives at opening
  if (st) { const d = st.ts - Date.now(); step('sharedFile', { ts: st.ts, tsET: et(st.ts), minusRealNow: d });
    ck('fixture.sharedClock', CFG.ahead ? 'PREREQUISITE: the shared state file is stamped about an hour ahead of real time (59:55 to 60:00 min)' : 'the shared state file is stamped at or before real time',
      CFG.ahead ? (d > HOUR - 5000 && d <= HOUR) : d <= 0, true, 'fixture'); }
""")
open(p,'w').write(s)
print('ok')
