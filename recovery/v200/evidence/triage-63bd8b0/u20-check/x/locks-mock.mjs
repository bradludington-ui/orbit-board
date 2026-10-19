// locks-mock.mjs -- an in-process stand-in for the Web Locks API (navigator.locks), SHARED by every jsdom board that plays a
// tab of ONE browser profile (one origin). Written for the U20 probe; harness only, it changes nothing in any board.
//
// WHAT IT MODELS (W3C Web Locks API, "request a lock", "is grantable", "process the lock request queue", "release the lock"):
//  - request(name, callback) and request(name, options, callback); options.mode 'exclusive' (the default) or 'shared';
//    options.ifAvailable.
//  - ONE lock manager for the origin: every tab's requests for a name share one queue and one held set.
//  - FIFO per name: a request is grantable only if it is the first in its name's queue (spec step: "if queue is not empty
//    and request is not the first entry in queue, return false"); exclusive needs no lock of that name held; shared needs no
//    exclusive lock of that name held. Processing grants from the head of the queue while the head is grantable.
//  - A grant enqueues a TASK in the requesting window (that window's setTimeout 0) that calls the callback with a Lock
//    {name, mode}. The callback is never called synchronously inside request().
//  - The lock is held until the callback's result settles ("waiting promise"): a promise, when it settles; a plain value or
//    a synchronous throw, at once. Then it is released (the queue for that name is processed again), and only after that
//    does request()'s promise settle, with the callback's value or its rejection.
//  - request()'s promise is made in the requesting window's realm (new w.Promise).
//  - ifAvailable: a request that is not grantable at once is not queued; its callback gets null.
//  - query(): {held:[{name,mode,clientId}], pending:[{name,mode,clientId}]}, in the requesting window's realm.
//  - closeClient(id): a tab going away: its pending requests are dropped and the locks it holds are released.
//  - Argument errors the spec defines and the board can never hit: a name starting with '-' and a non-function callback
//    reject (NotSupportedError / TypeError).
// WHAT IT DOES NOT MODEL: options.steal and options.signal (AbortSignal) -- a request using either is REJECTED and counted in
// stats.unmodeled (the board uses neither: it calls request('orbit-save', {mode:'exclusive'}, go)); separate processes or
// threads (every tab here runs on one Node event loop, so "parallel" is interleaving at awaits, as in one browser's tabs'
// event loops it is not); storage buckets / partitioning; workers; the exact task source the spec names (a later task of the
// window is used); InvalidStateError for a document that is not fully active.
// INSTRUMENTATION (the probe's control 3): every request/grant/invoke/release/drop is logged with the client id and a
// sequence number; at every grant the held set is checked -- two holders of one name where either is exclusive is a
// VIOLATION, recorded; stats.maxHeld[name] is the most locks of that name held at once.
export function makeLockManager(label) {
  const held = [];                 // {name, mode, client, id}
  const queues = new Map();        // name -> [request]
  const log = [];
  const stats = { requests: 0, grants: 0, invokes: 0, releases: 0, dropped: 0, violations: [], maxHeld: {}, unmodeled: [], label };
  let seq = 0;
  const q = name => { if (!queues.has(name)) queues.set(name, []); return queues.get(name); };
  const note = (ev, r, extra = {}) => log.push({ n: log.length, ev, name: r.name, mode: r.mode, client: r.client, id: r.id, ...extra });
  function grantable(r) {
    const qq = q(r.name);
    if (qq.length && qq[0] !== r) return false;
    if (r.mode === 'exclusive') return !held.some(l => l.name === r.name);
    return !held.some(l => l.name === r.name && l.mode === 'exclusive');
  }
  function grant(r) {
    if (held.some(l => l.name === r.name && (r.mode === 'exclusive' || l.mode === 'exclusive')))
      stats.violations.push({ at: log.length, name: r.name, client: r.client, holders: held.filter(l => l.name === r.name).map(l => l.client) });
    const lock = { name: r.name, mode: r.mode, client: r.client, id: r.id };
    held.push(lock); stats.grants++;
    const n = held.filter(l => l.name === r.name).length;
    stats.maxHeld[r.name] = Math.max(stats.maxHeld[r.name] || 0, n);
    note('grant', r, { holdersNow: n });
    r.win.setTimeout(() => invoke(r, lock), 0);
  }
  function processQueue(name) {
    const qq = q(name);
    while (qq.length) {
      const r = qq[0];
      if (!grantable(r)) return;
      qq.shift();
      grant(r);
    }
  }
  function release(lock) {
    const i = held.indexOf(lock);
    if (i < 0) return;                 // already released (closeClient)
    held.splice(i, 1); stats.releases++;
    note('release', lock);
    processQueue(lock.name);
  }
  function lockObj(r) { const o = new r.win.Object(); o.name = r.name; o.mode = r.mode; return o; }
  function invoke(r, lock) {
    if (!held.includes(lock)) { note('invoke-skipped', r); return; }   // released by closeClient before its task ran
    stats.invokes++; note('invoke', r);
    let waiting;
    try { waiting = Promise.resolve(r.callback(lockObj(r))); } catch (e) { waiting = Promise.reject(e); }
    waiting.then(v => { release(lock); r.resolve(v); }, e => { release(lock); r.reject(e); });
  }
  function request(win, client, name, a, b) {
    const options = (typeof a === 'function') ? {} : (a || {});
    const callback = (typeof a === 'function') ? a : b;
    return new win.Promise((resolve, reject) => {
      name = String(name);
      const mode = options.mode === undefined ? 'exclusive' : String(options.mode);
      const r = { id: ++seq, name, mode, client, win, callback, resolve, reject, ifAvailable: !!options.ifAvailable };
      stats.requests++;
      if (options.steal || options.signal) { stats.unmodeled.push({ client, name, steal: !!options.steal, signal: !!options.signal });
        note('reject-unmodeled', r); reject(new win.Error('NotSupportedError: steal/signal are not modeled by this mock')); return; }
      if (mode !== 'exclusive' && mode !== 'shared') { note('reject-mode', r); reject(new win.TypeError('mode')); return; }
      if (typeof callback !== 'function') { note('reject-callback', r); reject(new win.TypeError('callback is not a function')); return; }
      if (name.startsWith('-')) { note('reject-name', r); reject(new win.Error('NotSupportedError: name starts with -')); return; }
      note('request', r, { queued: q(name).length, heldNow: held.filter(l => l.name === name).map(l => l.client) });
      if (r.ifAvailable && !(q(name).length === 0 && grantable(r))) {
        note('not-available', r);
        win.setTimeout(() => { let v; try { v = Promise.resolve(callback(null)); } catch (e) { v = Promise.reject(e); } v.then(resolve, reject); }, 0);
        return;
      }
      q(name).push(r);
      processQueue(name);
    });
  }
  const snapshot = () => ({
    held: held.map(l => ({ name: l.name, mode: l.mode, clientId: l.client })),
    pending: [...queues.entries()].flatMap(([, rs]) => rs.map(r => ({ name: r.name, mode: r.mode, clientId: r.client }))),
  });
  return {
    label, log, stats,
    snapshot,
    heldBy: name => held.filter(l => l.name === name).map(l => l.client),
    pendingOf: name => q(name).map(r => r.client),
    grantOrder: (name, fromN = 0) => log.filter(e => e.ev === 'grant' && e.name === name && e.n >= fromN).map(e => e.client),
    mark: () => log.length,
    // Gives a jsdom window (one tab) its navigator.locks. Asserted absent before (jsdom has none).
    install(w, client) {
      const had = 'locks' in w.navigator;
      const api = {
        request: (name, a, b) => request(w, client, name, a, b),
        query: () => new w.Promise(res => res(JSON.parse(JSON.stringify(snapshot())))),
      };
      Object.defineProperty(w.navigator, 'locks', { value: api, configurable: true, enumerable: true });
      return { had, client };
    },
    closeClient(client) {
      for (const [, rs] of queues) for (let i = rs.length - 1; i >= 0; i--) if (rs[i].client === client) { note('drop', rs[i]); rs.splice(i, 1); stats.dropped++; }
      for (const l of held.slice()) if (l.client === client) release(l);
      for (const name of queues.keys()) processQueue(name);
    },
  };
}
