// A STAND-IN for the store (80-store.js, builder C3), used by ui.test.mjs ONLY while the real store does not yet provide
// its API (CONTRACT §11). It keeps the state in memory and does the least §11 says an import and a setting do, so the
// screens can be tested on their own. It is never part of the built page: ui.test.mjs injects it after the program and
// says so in its output, and uses the real store the moment that store defines SP.applyImport.
(function () {
  const SP = window.SP;
  let dirty = false, view = SP.defaultView();
  const subs = [];
  const fire = () => subs.forEach(f => { try { f(); } catch (e) {} });
  const empty = () => ({ v: 1, tool: 'sfcb-spend-plan', savedAt: null, settings: null, pulls: { current: {}, previous: {} }, history: [], lastImport: null });
  SP.state = empty();
  SP.storeInit = function () {
    let st = null;
    try { st = JSON.parse(document.getElementById('spState').textContent); } catch (e) {}
    if (st && st.tool === 'sfcb-spend-plan' && st.v === 1 && st.pulls) { SP.state = st; return { ok: true, message: 'Opened the plan saved ' + (st.savedAt || '') + '.' }; }
    SP.state = empty();
    return { ok: true, message: '' };
  };
  SP.getView = () => JSON.parse(JSON.stringify(view));
  SP.setView = v => { view = JSON.parse(JSON.stringify(v)); };
  SP.applyImport = function (parsed) {
    const st = SP.state, aps = [];
    for (const ap of ['om', 'ff', 'sp', 'opn', 'unidentified']) {
      if (!parsed.pulls[ap]) continue;
      if (st.pulls.current[ap]) st.pulls.previous[ap] = st.pulls.current[ap];
      st.pulls.current[ap] = parsed.pulls[ap];
      if (ap !== 'unidentified') aps.push(ap);
    }
    const def = SP.defaultSettings(parsed.report.importedAt);
    st.settings = st.settings ? Object.assign({}, st.settings, { asOf: def.asOf }) : def;
    st.history.push({ importedAt: parsed.report.importedAt, aps, totals: {} });
    st.lastImport = { report: parsed.report };
    dirty = true; fire();
    return { message: 'Imported ' + aps.join(', ') + ' (test stand-in). Data through set to ' + def.asOf + '.' };
  };
  SP.setSettings = function (patch) { SP.state.settings = Object.assign({}, SP.state.settings, patch); dirty = true; fire(); };
  SP.isDirty = () => dirty;
  SP.onStateChange = fn => { subs.push(fn); };
  SP.saveFile = async () => { dirty = false; SP.state.savedAt = new Date().toISOString(); fire(); return { ok: true, message: 'Saved (test stand-in).' }; };
  SP.saveCopy = async () => ({ ok: true, message: 'Saved a copy (test stand-in).' });
})();
