// FOCUSED HARNESS: audit-recon preamble helpers, the blocks v2.00 (U32, U33) and the guard, VERBATIM from /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/d6fea76/after/tools/export-audit/audit-recon.mjs
import { boot, seed, stopAtFirstFailure, capture } from './boot.mjs';

let failures = [];
stopAtFirstFailure(failures);   // in the mutation sweep only: see boot.mjs
// EVERY NAMED SCENARIO MUST RUN. A block appended after process.exit() never executes and reads as
// a pass -- the proposal scenario in audit-import.mjs sat there for a whole verification round and
// five mutations aimed at it survived. chk() records every scenario it hears from; at the summary,
// any `const name = '...'` in this file it never heard from is a failure, not a pass.
import { readFileSync as _selfRead } from 'node:fs';
import { fileURLToPath as _selfPath } from 'node:url';
const SEEN = new Set();
const chk = (scenario, where, what, got, want) => {
  SEEN.add(scenario);
  const ok = (typeof got === 'number' && typeof want === 'number')
    ? Math.abs(got - want) <= 0.005 : String(got) === String(want);
  if (!ok) failures.push({ scenario, where, what, got, want });
};
// Compare at CENTS. Summing floats gives 2422222.0000000005, which is the same money as 2422222
// and a different string -- the first run of this suite reported exactly that as a mismatch.
const money = n => String(Math.round(n * 100) / 100);

const it = (id, grp, ask) => ({ id, grp, team: grp, sect: '', custom: false, title: 'Req ' + id,
  event: 'Ev ' + id, ccar: 'CC' + id, fy26: ask.map(() => 0), ask, alloc: null });
const num = v => { if (typeof v === 'number') return v;
  const n = parseFloat(String(v ?? '').replace(/[$,\s]/g, '')); return isFinite(n) ? n : null; };
const w6Book = (W, fn) => W.eval(`(async function(){
  var cap=null,_B=window.Blob,msg='';
  window.alert=function(m){ msg+=String(m); }; window.confirm=function(){ return true; };
  window.Blob=function(p,o){ if(p&&p[0]&&p[0].byteLength) cap=p[0]; return new _B(p,o); };
  try{ ${fn}(); }catch(e){ window.Blob=_B; return JSON.stringify({__err:'threw '+String((e&&e.message)||e)}); }
  window.Blob=_B;
  if(!cap) return JSON.stringify({__err:'no file: '+msg.slice(0,80)});
  var ab=cap.buffer.slice(cap.byteOffset,cap.byteOffset+cap.byteLength);
  return JSON.stringify(await xlsxRead(ab)); })()`);
const w6Lbl = r => String((r || [])[0] ?? '').trim();
import { appendFileSync as _w5Append } from 'node:fs';
const w5Chk = (scenario, where, what, got, want) => {
  if (process.env.SUITE_CHECKS) _w5Append(process.env.SUITE_CHECKS, JSON.stringify([scenario, where, what, String(got) === String(want), String(got).slice(0, 300)]) + '\n');
  chk(scenario, where, String(what), String(got), String(want));
};
// ==== v2.00 (U32, U33): an RCN / EEIC list that repeats a key, or holds “__none__” or a key that is not text, never counts money twice; a file handed over with one is refused, and the user’s own board comes across saying what it holds ====
// Codex, 12 Oct (P1), as Brad supplied it: "Duplicate K1 registry entries." and "One registry entry named __none__." "Both accept an
// imported cycle and export USAF $1,800 / ANG $400 from independently expected $900 / $200. Preserve those expectations, include
// ordinary-key controls, and verify actual XLSX after import and reopening."
// THE MONEY, BY HAND: O&M, services USAF / ANG / AFRC, one requirement R1 asking USAF 900, ANG 200, AFRC 0. FUNDED: pots of 5,000 on
// each service, so discretionary funds all of it -- USAF 900, ANG 200, AFRC 0. Its one award is in FYMON[2], so every dollar sits in
// that month's column (the sheet's column 3) and none in NO DATE. R1 is the only requirement, so each service total is R1's money on
// it -- USAF 900, ANG 200, AFRC 0 -- and the grand total by month is 900 + 200 + 0 = 1,100. UNFUNDED: pots of 0, so R1 draws nothing
// and is listed under NOT FUNDED with its ask, the only figure there (the sheet's column 15): USAF 900, ANG 200 (AFRC asks 0, so it
// is not listed), every total 0. A list entry is a NAME for a combination: naming K1 twice adds no money, and no entry can add money
// that sits on no combination. The row R1 sits under is the entry the board shows R1 on: the FIRST entry whose key is R1's pointer
// exactly -- the number 1 is not the text "1" -- as the screen and the Spend Plan Source find it; none, when no entry's is.
// THE CASES: the user's own board -- R1, the list [K1] -- then that board's file with a list replaced. PB27's own list (Codex): [K1, K1]
// with R1 on K1 (Codex 1); [K1, “__none__”] with R1 on none (Codex 2), and with R1 on “__none__”. The working plan's list (the first
// round of verification): [K1, K1]; [1, "1"] -- a number, and the same name as text -- with R1 on "1"; and that list read by PB27 locked
// before v1.99, which kept no list of its own (an imported cycle). R1 UNFUNDED on [K1, K1] (the NOT FUNDED Ask). The second round of
// verification: R1 on the NUMBER 1 beside [1] and [1, "1"] (under 11111 / AAAAA, as the screen shows it -- d66dd60 got [1] right);
// [1] with R1 on "1" (no entry is "1": not assigned); [K1, K1] on two codes (the first row's); PB27 [K1, K1, “__none__”] (the full
// import names both); PB27 [null, K1] (the user's own board is taken: a cycle's reader leaves null out); and a hand-made file whose
// list has an entry keyed “constructor” (d66dd60's export threw). The third round: [K1, an entry keyed “”] with R1 on none (no
// pointer is on no combination, never on that entry); the working plan's [“K9”, K1] (the user's own board is taken: its readers
// stop only at null); PB27's [the number 1] with R1 on the number 1 (a locked cycle's list leaves that entry out, and the full
// import says so). The fourth round: the full import's words, written out whole and true for each requirement (Codex B2, 13 Oct,
// P2) -- PB27's [{k: 1, 99999 / ZZZZZ}] with R1 on the number 1, which reads none there, beside K1; the working plan's [{k: 0},
// K1] with R1 on the number 0, which no list reads; the working plan's [0, K1] and [[], K1] (the user's own board is taken); the
// user's own board holding PB27 [K1, K1], and what it writes -- its saved file and its one-appropriation file refused in words
// true for a file this version saved, its package taken; a file naming an earlier version, and a state file naming none. The
// fifth round: the user's own board whose working plan's list and PB27's both repeat K1 (a board that locked PB27 while its list
// repeated K1 holds both) -- its files are refused naming the locked cycle too, and only the ways that work; ✕ on the working plan's
// row leaves them refused, for PB27; its package is refused until that row goes, then taken; ⬇ Export one appropriation names no way
// back that refuses the file it wrote; the working plan's list kept as the file holds it through the full import ([K1, K1 on two
// codes], "K9", 0, []); a file whose working plan's list repeats K1 beside PB27's ordinary [K1] (the working plan's advice); PB27's
// [K1, K1, the number 1] (the full import says both); a board .html refused for "K9" or 0 in its working plan, told the ways that take
// it; a PMO copy, told no way that would put its reference of PB27 in place of the board's own; the help for Import one appropriation.
// The sixth round: a null entry in the working plan's list, refused among several files by ⇊ Import several boards -- the batch adds
// how many were not taken, and the words still name no way (beside PB27 [K1, K1], that locked cycle too); the user's own board whose
// working plan lists K1 twice, no locked cycle amiss -- ⬇ Export one appropriation's line before and after ✕, and an ordinary
// board's; a file whose working plan holds "K9" beside PB27 [K1, K1], and one whose working plan repeats K1 beside PB27 [null, K1],
// each told of the locked cycle too; a package and a PMO copy refused for "K9" in the working plan's list, told ✕, and for 0, no way.
// The seventh round: a lock while the working plan's list repeats K1, or holds "K9" -- the question says what the list it keeps holds,
// and that every file carrying the cycle will be refused, which holds after the lock and after ✕; ✕ on the repeated row first, and
// the lock asks what it always did; the ✕ way for every kind of entry it is said or not said for -- never for a locked cycle's "K9",
// not for false or "", but for 5 and [] (✕ clicked in the panel); a null entry among three files.
// The eighth round: the user's own board holding PB27 [K1, K1] unlocks it -- its saved file is refused in words that say only what
// holds, never that no board changes the list -- then deletes it, or locks over it, and the file written again is taken; a lock while
// the working plan's list holds the number 1 as a key, or “__none__”, says so first, as the door says it.
// CONTROLS: the same money on ordinary distinct keys, which every route exports right here and on d66dd60.
// THE ROUTES: (a) the door a file handed over passes (inboundCheck): refused, saying which list, what it holds and why. (a2) ⬅ Import
// one appropriation with that file: refused whole, in true words, browser storage byte-identical; (a3) ⇊ Import several boards, the
// same. (b) ⬅ Import a full board into the
// user's own board: taken -- an ORBIT before this one took such a list without a word and saved it, so refusing kept a whole board out
// of the new version -- and the question asked before anything is replaced says what the list holds; (b2) the same browser reopened,
// which says it again, PB27 (or the working plan) exported and the workbook read back from its bytes; (b3) saved, reopened, exported.
// (c) The file opened as a board (no door), exported; (c2) saved, reopened, exported. Then: a null entry in the working plan's list,
// refused at the door and by the full import; the door on a key repeated apart, three times, beginning with two underscores,
// missing, not text; the team's own copies -- the shared folder's, the sidecar's -- read with their lists as before; ✕ on a row
// that repeats a key; and Add
// RCN / EEIC in one millisecond, after a removal; ✕ on the FIRST of two rows with one key (as d66dd60: every assignment cleared).
// The third round: the door on keys every object answers to (refused in words, never a throw); the team's own copies holding
// null, then K1 (read as before); a full import that stops early (not a board, or answered no) leaves the next file handed over
// held to the whole rule; ✕ on a row that repeats a key is saved.
// FAILS ON d66dd60 (U14, the board of 7ee498a), 177 of its 288 checks: the door passes every list; Import one appropriation and Import
// several boards take the file; the full import takes it without a word; PB27 and the working plan export USAF 1,800 / ANG 400 / 2,200 --
// K1's row twice, the money on no combination under “__none__”'s codes and again as not assigned, 1 and "1" printed as two rows -- and
// the NOT FUNDED Ask USAF 1,800 / ANG 400; [1] with R1 on "1" prints under the number's codes, which the screen does not show it on; the
// “constructor” file's export throws; ✕ on the repeated row clears R1's assignment, and the same browser reopened has R1 off it;
// adds in one millisecond after a removal share a key; “constructor” twice is not refused; the words are not said; a file this
// version saved is taken by Import one appropriation and Import several boards, and its one-appropriation file prints 1,800 / 400;
// ⬇ Export one appropriation says to take that file back by Import one appropriation; the help says nothing of such a file; a
// package or a PMO copy whose working plan's list holds "K9", 0, false, "", 5 or [] is taken; a lock asks nothing of the list it keeps.
// Its 111 passes are the fixtures, the CONTROLS and the GUARDS' money, lists and reading -- what d66dd60 did right: the
// GUARDS' door, full-import and statement checks fail there.
await (async () => {
  const name = 'v2.00 (U32, U33) — an RCN / EEIC list that repeats a key, or holds “__none__” or a key that is not text, never counts money twice: a file handed over with one is refused, and the user’s own board comes across saying what it holds';
  const { bootMark, bootRelease, settleBoards } = await import('./boot.mjs');
  const __bm = bootMark();
  try {
    const J = JSON.stringify;
    const SV = ['USAF', 'ANG', 'AFRC'];
    const E = (k, rcn, eeic) => { const e = { rcn, eeic, t: '', svc: SV.slice() }; if (k !== undefined) e.k = k; return e; };
    const K1 = E('K1', '11111', 'AAAAA'), K2 = E('K2', '22222', 'BBBBB'), NN = E('__none__', '22222', 'BBBBB'),
      N1 = E(1, '11111', 'AAAAA'), T1 = E('1', '22222', 'BBBBB'), K1b = E('K1', '22222', 'BBBBB');
    // the user's own board: R1, the list [K1], R1 on `asg`, PB27 locked when the case has a cycle; then its file, PB27's list replaced
    // (`cyc`; 'pre199': locked before v1.99, no list kept) and the working plan's (`plan`)
    const make = o => {
      const X = boot();
      seed(X.ev, { services: SV, items: [it('R1', 'AV', [900, 200, 0])], disc: o.disc || [5000, 5000, 5000], mand: [0, 0, 0], order: ['R1'] });
      X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
        S.awards={R1:{mode:'single', d:FYMON[2][0], day:3}}; MS.rcn=${J([K1])}; S.rcnAsg=${J(o.asg ? { R1: o.asg } : {})};
        applyState(S); save(); window.confirm=function(){ return true; }; ${o.cyc ? "MS.base=MS.cur; blCyc='PB'; blYr=MS.cur; cycLock();" : ''} 'ok'`);
      const fund = X.ev(`JSON.stringify([tiers().R1.d, tiers().R1.m])`), own = X.ev('buildSavedHtml()');
      if (o.cyc === 'pre199') X.ev(`delete blGet('PB|2027').rcn; persistCyc(); 'ok'`);
      else if (o.cyc) X.ev(`blGet('PB|2027').rcn=${J(o.cyc)}; persistCyc(); 'ok'`);
      if (o.plan) X.ev(`MS.rcn=${J(o.plan)}; save(); 'ok'`);
      return { fund, own, file: X.ev('buildSavedHtml()') };
    };
    const lsOf = ev => JSON.parse(ev(`(function(){ var o={}; for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); o[k]=localStorage.getItem(k); } return JSON.stringify(o); })()`));
    const moved = (a, b) => Object.keys(Object.assign({}, a, b)).filter(k => a[k] !== b[k]).sort();
    // the RCN-EEIC sheet from the workbook's bytes, PB27 on screen or the working plan: [service, row, the award month's cell, NO DATE,
    // TOTAL] for every row up to the breakout, then the TOTAL of every "<SERVICE> TOTAL" row in the whole sheet (the summary's and the
    // breakout's)
    const sheet = async (W, ev, view) => {
      const on = view ? ev(`cycView('${view}'); CYCVIEW||'not on screen'`) : 'the working plan';
      const bk = JSON.parse(await w6Book(W, 'exportExcel')); if (view) ev(`cycLeave(); 'ok'`);
      const rc = bk['RCN-EEIC by Month'] || [], iReq = rc.findIndex(r => w6Lbl(r) === 'WHICH REQUIREMENTS SIT UNDER EACH COMBINATION');
      const rows = []; let sv = null;
      for (let j = 0; j < (iReq < 0 ? rc.length : iReq); j++) { const L = w6Lbl(rc[j]);
        if (SV.includes(L)) { sv = L; continue; }
        if (num((rc[j] || [])[14]) === null) continue;
        rows.push([/TOTAL BY MONTH$/.test(L) ? 'ALL' : sv, L, num(rc[j][3]), num(rc[j][13]), num(rc[j][14])]); }
      const tot = SV.map(s => rc.filter(r => w6Lbl(r) === s + ' TOTAL').map(r => num(r[14])));
      return J({ on, err: bk.__err || '', rows, tot });
    };
    // NOT FUNDED, from the bytes: each "NOT FUNDED — asks on <SERVICE>" row and the rows under it, as [row, Ask]; every service total
    const notFunded = async (W, ev) => {
      const bk = JSON.parse(await w6Book(W, 'exportExcel'));
      const rc = bk['RCN-EEIC by Month'] || [], nf = [];
      rc.forEach((r, j) => { if (/^NOT FUNDED — asks on /.test(w6Lbl(r))) for (let i = j; i < rc.length && w6Lbl(rc[i]); i++) nf.push([w6Lbl(rc[i]), num((rc[i] || [])[15])]); });
      const tot = SV.map(s => rc.filter(r => w6Lbl(r) === s + ' TOTAL').map(r => num(r[14])));
      return J({ err: bk.__err || '', sheet: !!bk['RCN-EEIC by Month'], nf, tot });
    };
    const ROWS = lab => [['USAF', lab, 900, 0, 900], ['USAF', 'USAF TOTAL', 900, 0, 900], ['ANG', lab, 200, 0, 200], ['ANG', 'ANG TOTAL', 200, 0, 200],
      ['AFRC', 'AFRC TOTAL', 0, 0, 0], ['ALL', 'ALL SERVICES — TOTAL BY MONTH', 1100, 0, 1100]];
    const WANT = (on, lab) => J({ on, err: '', rows: ROWS(lab), tot: [[900, 900], [200, 200], [0, 0]] });
    const NF_HEAD = sv => 'NOT FUNDED — asks on ' + sv + ' and draws nothing, so it is not in the total above   (1 requirement)';
    const WANT_NF = lab => J({ err: '', sheet: true, nf: [[NF_HEAD('USAF'), 900], [lab, 900], ['#1  Req R1', 900], [NF_HEAD('ANG'), 200], [lab, 200], ['#1  Req R1', 200]],
      tot: [[0, 0], [0, 0], [0, 0]] });
    const ON_K1 = '11111 / AAAAA', ON_K2 = '22222 / BBBBB', ON_NONE = '— no RCN/EEIC assigned —';
    // ⬅ Import a full board, every question answered yes and kept; ⬅ Import one appropriation with the file, every alert kept
    const full = (ev, file) => JSON.parse(ev(`(function(){ var qs=[], al=[]; window.confirm=function(q){ qs.push(String(q)); return true; };
      window.alert=function(m){ al.push(String(m)); };
      var ret, threw=''; try{ ret=fullImportText(${J(file)}, 'cycle.html'); }catch(e){ threw=String((e&&e.message)||e); }
      return JSON.stringify({ret:ret, threw:threw, qs:qs, al:al, stat:(document.getElementById('shareStat')||{}).textContent||''}); })()`));
    const one = (ev, file) => ev(`new Promise(function(res){ var al=[]; window.alert=function(m){ al.push(String(m)); };
      window.confirm=function(){ return true; }; window.prompt=function(){ return '1'; };
      var inp={files:[new File([${J(file)}], 'cycle.html')], value:'x'};
      try{ importState(inp); }catch(e){ al.push('THREW '+e.message); }
      (function wait(n){ if(inp.value==='' || n>600) return res(JSON.stringify(al)); setTimeout(function(){ wait(n+1); }, 5); })(0); })`);
    // ⇊ Import several boards with the file alone, every alert kept
    const several = (ev, file) => ev(`new Promise(function(res){ var al=[]; window.alert=function(m){ al.push(String(m)); };
      window.confirm=function(){ return true; };
      var inp={files:[new File([${J(file)}], 'cycle.html')], value:'x'};
      try{ importBoards(inp); }catch(e){ al.push('THREW '+e.message); }
      (function wait(n){ if(inp.value==='' || n>600) return res(JSON.stringify(al)); setTimeout(function(){ wait(n+1); }, 5); })(0); })`);
    const QLINE = q => (String(q || '').split('\n').find(l => l.startsWith('  • RCN / EEIC lists')) || '');
    const SAID = s => ((String(s).match(/RCN \/ EEIC lists as the file holds them[^]*?only as not assigned\./) || [''])[0]);
    const SAYS = (what, cy) => 'RCN / EEIC lists as the file holds them, which a file handed over is refused for: ' + what + '. A requirement on a key '
      + 'that is text (not empty) reads the first entry with that key, as the ORBIT that saved the file did.'
      + (cy ? ' A locked cycle’s entry whose key is not text is kept but not read, as in every ORBIT since v1.99: a requirement on it shows no code there, '
        + 'and its money is on no combination.' : '')
      + ' The RCN-EEIC sheet counts each key once and money on no combination only as not assigned';
    // the refusal's words: the rule; who saved the file, as the file says it (a fixture is saved by the board under test, v2.00);
    // and a way that works for that kind of file -- a locked cycle's list is never put right on a board
    const RULE = 'An RCN / EEIC list names each combination once, by a text key of its own.';
    const NOW = 'This file says ORBIT v2.00 saved it, from a board that held such a list.';
    const OLD = 'An ORBIT before this one took such a list without a word and could save it with its board.';
    const PLAN = 'A list that is not a locked cycle’s can be put right on a board of this version, in 🗂 RCN / EEIC, where ✕ on a row marked ⚠ repeats '
      + 'removes that row alone, and the file written again.';
    const CYCLE = 'A locked cycle’s list stays as it was locked, so ⬅ Import one appropriation and ⇊ Import several boards '
      + 'refuse every file that carries that cycle. The file itself opens as a board.';
    const FULL = 'A whole board of your own comes across with its lists as they are by 📁 File → ⬅ Import a full board, which says first what they '
      + 'hold. That replaces this board’s whole BAE list and execution data with the file’s, when it carries them, so it is not the way to take one '
      + 'appropriation.';
    // a file that also carries a locked cycle whose list a file handed over is refused for; a board .html opens as a board
    const TOO = 'This file also carries a locked cycle whose RCN / EEIC list a file handed over is refused for.';
    const OPENS = 'The file itself opens as a board.';
    // a locked cycle's words for a file that is not said to open as a board (a null entry in its working plan's list)
    const CYCLE_ONLY = 'A locked cycle’s list stays as it was locked, so ⬅ Import one appropriation and ⇊ Import several '
      + 'boards refuse every file that carries that cycle.';
    const LIST_TAIL = why => RULE + ' ' + NOW + ' ' + (/\.cycles\./.test(why) ? CYCLE : PLAN) + ' ' + FULL;
    const ENTRY_TAIL = 'An RCN / EEIC list holds combinations and nothing else. No ORBIT makes such an entry. This file says ORBIT v2.00 saved it, '
      + 'from a board that held one.';
    const AT_PB = 'the RCN / EEIC list at the saved state.cycDb.byAp.om.cycles.PB|2027.rcn ', AT_WP = 'the RCN / EEIC list at the saved state.appns.om.rcn ';
    const TWICE = 'holds the key “K1” twice (rcn[0] and rcn[1]); a key names one combination';
    const NOT_TEXT = 'holds a key that is not text (rcn[0].k is the number 1); a key is text';
    const ALL = ['door', 'one', 'several', 'full', 'reopened', 'saved', 'opened', 'opened-saved'];
    const R6 = ['door', 'full', 'reopened', 'saved', 'opened', 'opened-saved'];
    const WP_NT = 'O&M working plan’s list holds a key that is not text (rcn[0].k is the number 1)';
    const CASES = [
      { c: 'Codex 1 · PB27 lists K1 twice', o: { asg: 'K1', cyc: [K1, K1] }, view: 'PB|2027', lab: ON_K1, why: AT_PB + TWICE,
        says: 'O&M PB27’s list holds the key “K1” twice (rcn[0] and rcn[1])', routes: ALL },
      { c: 'Codex 2 · PB27 lists K1 and an entry named “__none__”, R1 on none', o: { asg: '', cyc: [K1, NN] }, view: 'PB|2027', lab: ON_NONE,
        why: AT_PB + 'holds the key “__none__” (rcn[1]); a key beginning with two underscores is one the board keeps for its own bookkeeping',
        says: 'O&M PB27’s list holds the key “__none__” (rcn[1])', routes: ALL },
      { c: 'CONTROL · PB27 lists ordinary K1, K2, R1 on K1', o: { asg: 'K1', cyc: [K1, K2] }, view: 'PB|2027', lab: ON_K1, why: '', says: '', routes: ALL },
      { c: 'CONTROL · PB27 lists ordinary K1, K2, R1 on none', o: { asg: '', cyc: [K1, K2] }, view: 'PB|2027', lab: ON_NONE, why: '', says: '',
        routes: ['door', 'full', 'reopened', 'saved', 'opened', 'opened-saved'] },
      { c: 'Codex 2 · R1 on the entry named “__none__”', o: { asg: '__none__', cyc: [K1, NN] }, view: 'PB|2027', lab: ON_K2, routes: ['opened', 'opened-saved'] },
      { c: 'CONTROL · PB27 lists ordinary K1, K2, R1 on K2', o: { asg: 'K2', cyc: [K1, K2] }, view: 'PB|2027', lab: ON_K2, routes: ['opened'] },
      { c: 'PB27 lists K1 twice and an entry named “__none__”', o: { asg: 'K1', cyc: [K1, K1, NN] }, view: 'PB|2027', lab: ON_K1, why: AT_PB + TWICE,
        says: 'O&M PB27’s list holds the key “K1” twice (rcn[0] and rcn[1]), holds the key “__none__” (rcn[2])', routes: ['door', 'full', 'reopened', 'opened'] },
      { c: 'PB27 lists K1 twice, then the number 1, R1 on K1', o: { asg: 'K1', cyc: [K1, K1, N1] }, view: 'PB|2027', lab: ON_K1, why: AT_PB + TWICE,
        says: 'O&M PB27’s list holds the key “K1” twice (rcn[0] and rcn[1]), holds a key that is not text (rcn[2].k is the number 1)', cyNT: true,
        routes: ['door', 'full', 'reopened'] },
      { c: 'GUARD on the money (d66dd60 took this board and exported it right) · PB27’s list holds null, then K1, R1 on K1', o: { asg: 'K1', cyc: [null, K1] }, view: 'PB|2027', lab: ON_K1,
        why: 'the RCN / EEIC entry at the saved state.cycDb.byAp.om.cycles.PB|2027.rcn[0] is not a combination (“null”); a list holds combinations and nothing else',
        says: 'O&M PB27’s list holds rcn[0], which is not a combination (“null”)', routes: ['door', 'full', 'reopened', 'saved', 'opened'] },
      { c: 'GUARD on the money (d66dd60 printed this right) · PB27’s list holds the number 1 alone, R1 on the number 1, which a locked cycle’s list leaves out', o: { asg: 1, cyc: [N1] }, view: 'PB|2027', lab: ON_NONE,
        why: AT_PB + NOT_TEXT, says: 'O&M PB27’s list holds a key that is not text (rcn[0].k is the number 1)', cyNT: true, routes: ['door', 'full', 'reopened', 'opened'] },
      { c: 'GUARD on the money (d66dd60 took this board and exported it right) · the working plan’s list holds “K9”, then K1, R1 on K1', o: { asg: 'K1', plan: ['K9', K1] }, view: '', lab: ON_K1,
        why: 'the RCN / EEIC entry at the saved state.appns.om.rcn[0] is not a combination (“"K9"”); a list holds combinations and nothing else',
        says: 'O&M working plan’s list holds rcn[0], which is not a combination (“"K9"”)', tail: ENTRY_TAIL + ' ' + OPENS + ' ' + FULL,
        routes: ['door', 'one', 'full', 'reopened', 'saved', 'opened'] },
      { c: 'GUARD on the money (d66dd60 took this board and exported it right) · the working plan’s list holds the number 0, then K1, R1 on K1', o: { asg: 'K1', plan: [0, K1] }, view: '', lab: ON_K1,
        why: 'the RCN / EEIC entry at the saved state.appns.om.rcn[0] is not a combination (“0”); a list holds combinations and nothing else',
        says: 'O&M working plan’s list holds rcn[0], which is not a combination (“0”)', tail: ENTRY_TAIL + ' ' + OPENS + ' ' + FULL,
        routes: ['door', 'one', 'full', 'reopened', 'saved'] },
      { c: 'GUARD on the money (d66dd60 took this board and exported it right) · the working plan’s list holds [], then K1, R1 on K1', o: { asg: 'K1', plan: [[], K1] }, view: '', lab: ON_K1,
        why: 'the RCN / EEIC entry at the saved state.appns.om.rcn[0] is not a combination (“[]”); a list holds combinations and nothing else',
        says: 'O&M working plan’s list holds rcn[0], which is not a combination (“[]”)', routes: ['door', 'full', 'reopened', 'saved'] },
      { c: 'the working plan lists K1 twice', o: { asg: 'K1', plan: [K1, K1] }, view: '', lab: ON_K1, why: AT_WP + TWICE,
        says: 'O&M working plan’s list holds the key “K1” twice (rcn[0] and rcn[1])', routes: ['door', 'one', 'full', 'reopened', 'opened', 'opened-saved'] },
      { c: 'the working plan lists K1 twice beside PB27’s ordinary [K1]', o: { asg: 'K1', plan: [K1, K1], cyc: [K1] }, view: '', lab: ON_K1, why: AT_WP + TWICE,
        routes: ['door', 'one', 'several'] },
      { c: 'the working plan and PB27 each list K1 twice', o: { asg: 'K1', plan: [K1, K1], cyc: [K1, K1] }, view: '', lab: ON_K1, why: AT_WP + TWICE,
        tail: RULE + ' ' + NOW + ' ' + TOO + ' ' + CYCLE + ' ' + FULL, routes: ['door', 'one', 'several'] },
      { c: 'the working plan holds “K9”, then K1, beside PB27 [K1, K1]', o: { asg: 'K1', plan: ['K9', K1], cyc: [K1, K1] }, view: '', lab: ON_K1,
        why: 'the RCN / EEIC entry at the saved state.appns.om.rcn[0] is not a combination (“"K9"”); a list holds combinations and nothing else',
        tail: ENTRY_TAIL + ' ' + TOO + ' ' + CYCLE + ' ' + FULL, routes: ['door', 'one'] },
      { c: 'the working plan lists K1 twice beside PB27 [null, K1]', o: { asg: 'K1', plan: [K1, K1], cyc: [null, K1] }, view: '', lab: ON_K1, why: AT_WP + TWICE,
        tail: RULE + ' ' + NOW + ' ' + TOO + ' ' + CYCLE + ' ' + FULL, routes: ['door', 'one'] },
      { c: 'CONTROL · the working plan lists ordinary K1, K2', o: { asg: 'K1', plan: [K1, K2] }, view: '', lab: ON_K1, why: '', routes: ['door', 'opened'] },
      { c: 'CONTROL (as d66dd60) · the working plan lists K1 and an entry keyed “”, R1 on none', o: { asg: '', plan: [K1, E('', '33333', 'CCCCC')] }, view: '', lab: ON_NONE,
        why: '', routes: ['door', 'opened'] },
      { c: 'the working plan lists K1 twice, on two codes, R1 on K1', o: { asg: 'K1', plan: [K1, K1b] }, view: '', lab: ON_K1, why: AT_WP + TWICE,
        says: 'O&M working plan’s list holds the key “K1” twice (rcn[0] and rcn[1])', routes: ['door', 'full', 'reopened', 'opened', 'opened-saved'] },
      { c: 'the working plan lists 1 and “1”, R1 on “1”', o: { asg: '1', plan: [N1, T1] }, view: '', lab: ON_K2, why: AT_WP + NOT_TEXT,
        says: 'O&M working plan’s list holds a key that is not text (rcn[0].k is the number 1)', routes: ['door', 'full', 'reopened', 'saved', 'opened', 'opened-saved'] },
      { c: 'CONTROL · the working plan lists ordinary “1”, K1, R1 on “1”', o: { asg: '1', plan: [T1, K1] }, view: '', lab: ON_K2, why: '', routes: ['door', 'opened'] },
      { c: 'the working plan lists 1 and “1”, R1 on the number 1', o: { asg: 1, plan: [N1, T1] }, view: '', lab: ON_K1, why: AT_WP + NOT_TEXT, says: WP_NT, routes: R6 },
      { c: 'GUARD (d66dd60 printed this right) · the working plan lists the number 1 alone, R1 on the number 1', o: { asg: 1, plan: [N1] }, view: '', lab: ON_K1, why: AT_WP + NOT_TEXT, says: WP_NT, routes: R6 },
      { c: 'the working plan lists the number 1 alone, R1 on “1”', o: { asg: '1', plan: [N1] }, view: '', lab: ON_NONE, why: AT_WP + NOT_TEXT, says: WP_NT, routes: R6 },
      { c: 'a hand-made file: the working plan lists K1 and an entry keyed “constructor”, R1 on K1', o: { asg: 'K1', plan: [K1, E('constructor', '33333', 'CCCCC')] }, view: '',
        lab: ON_K1, routes: ['opened', 'opened-saved'] },
      { c: 'PB27 locked before v1.99 reads today’s list, 1 and “1”', o: { asg: '1', plan: [N1, T1], cyc: 'pre199' }, view: 'PB|2027', lab: ON_K2, why: AT_WP + NOT_TEXT,
        says: 'O&M working plan’s list holds a key that is not text (rcn[0].k is the number 1)', routes: ['door', 'full', 'reopened', 'opened'] },
      { c: 'CONTROL · PB27 locked before v1.99 reads today’s ordinary “1”, K1', o: { asg: '1', plan: [T1, K1], cyc: 'pre199' }, view: 'PB|2027', lab: ON_K2, routes: ['opened'] },
      { c: 'NOT FUNDED · the working plan lists K1 twice, R1 on K1', o: { asg: 'K1', plan: [K1, K1], disc: [0, 0, 0] }, nf: true, lab: ON_K1 + '   (1)', routes: ['opened', 'opened-saved'] },
      { c: 'CONTROL · NOT FUNDED, ordinary K1, K2, R1 on K1', o: { asg: 'K1', plan: [K1, K2], disc: [0, 0, 0] }, nf: true, lab: ON_K1 + '   (1)', routes: ['opened'] },
      { c: 'CONTROL · NOT FUNDED, R1 on no combination', o: { asg: '', plan: [K1, K2], disc: [0, 0, 0] }, nf: true, lab: ON_NONE + '   — 1 still to assign', routes: ['opened'] },
    ];
    for (const C of CASES) {
      const mk = bootMark();
      const F = make(C.o), has = r => C.routes.includes(r);
      const read = (W, ev) => C.nf ? notFunded(W, ev) : sheet(W, ev, C.view);
      const want = C.nf ? WANT_NF(C.lab) : WANT(C.view || 'the working plan', C.lab);
      const what = C.nf ? 'the RCN-EEIC sheet’s NOT FUNDED list, read from the workbook’s bytes: R1 once under each service, Ask USAF 900, ANG 200, every total 0'
        : 'the RCN-EEIC sheet, read from the workbook’s bytes: USAF 900, ANG 200, all services 1,100, each once, in the award month, under the entry the board shows R1 on';
      w5Chk(name, C.c + ' · fixture', 'CONTROL — ' + (C.nf ? 'pots of 0: R1 draws nothing' : 'R1 funded in full, discretionary: USAF 900, ANG 200, AFRC 0'),
        F.fund, J(C.nf ? [[0, 0, 0], [0, 0, 0]] : [[900, 200, 0], [0, 0, 0]]));
      // (a) the door, (b) Import a full board: into the user's own board
      const T = (has('door') || has('full')) ? boot({ html: F.own }) : null;
      if (has('door')) w5Chk(name, C.c + ' · the door', C.why ? 'a file handed over is refused, saying which list, what it holds and why' : 'CONTROL — the file passes',
        T.ev(`inboundCheck(${J(F.file)})`), C.why);
      // (a2) Import one appropriation: a file handed over
      if (has('one')) {
        const T1b = boot({ html: F.own }), held = lsOf(T1b.ev), al = JSON.parse(await one(T1b.ev, F.file)), mv = moved(held, lsOf(T1b.ev));
        if (C.why) w5Chk(name, C.c + ' · ⬅ Import one appropriation', 'refused whole, in true words -- the file says this version saved it, from a board that held such a list, and the way named works for it -- and browser storage is byte-identical',
          J([al, mv]), J([['“cycle.html” was not imported: ' + C.why + '.\n\n' + (C.tail || LIST_TAIL(C.why)) + ' Nothing on this board was changed.'], []]));
        else w5Chk(name, C.c + ' · ⬅ Import one appropriation', 'CONTROL — taken: nothing refused, and the plan is written', J([al, mv.includes('prio27om')]), J([[], true]));
      }
      // (a3) ⇊ Import several boards with that file alone: a file handed over
      if (has('several')) {
        const T3 = boot({ html: F.own }), held = lsOf(T3.ev), al = JSON.parse(await several(T3.ev, F.file)), mv = moved(held, lsOf(T3.ev));
        if (C.why) w5Chk(name, C.c + ' · ⇊ Import several boards', 'the batch is refused whole, in true words, and browser storage is byte-identical',
          J([al, mv]), J([['“cycle.html” was not imported: ' + C.why + '.\n\n' + (C.tail || LIST_TAIL(C.why)) + ' Nothing on this board was changed.'], []]));
        else w5Chk(name, C.c + ' · ⇊ Import several boards', 'CONTROL — taken: nothing refused, and the plan is written', J([al, mv.includes('prio27om')]), J([[], true]));
      }
      if (has('full')) {
        const held = lsOf(T.ev), r = full(T.ev, F.file), after = lsOf(T.ev), mv = moved(held, after);
        w5Chk(name, C.c + ' · ⬅ Import a full board', C.says ? 'the user’s own board is taken, and the question asked before anything is replaced says what the list holds'
          : 'CONTROL — taken, and the question says nothing about the lists',
          J([r.ret, r.threw, r.al, QLINE(r.qs[r.qs.length - 1]), mv.includes('prio27om') && (!C.view || mv.includes('prio27om-cyc'))]),
          J([true, '', [], C.says ? '  • ' + SAYS(C.says, C.cyNT) : '', true]));
        const R = boot({ html: F.own, ls: after });
        if (has('reopened')) {
          w5Chk(name, C.c + ' · imported, the same browser reopened', C.says ? 'the reopened board says what the list holds' : 'CONTROL — and says nothing about the lists',
            SAID(R.ev(`(document.getElementById('shareStat')||{}).textContent||''`)), C.says ? SAYS(C.says, C.cyNT) + '.' : '');
          w5Chk(name, C.c + ' · imported, the same browser reopened', what, await read(R.w, R.ev), want);
        }
        if (has('saved')) { const R2 = boot({ html: R.ev('buildSavedHtml()') });
          w5Chk(name, C.c + ' · imported, saved and reopened', 'the same, from the saved file', await read(R2.w, R2.ev), want); }
      }
      // (c) the file opened as a board: no door
      if (has('opened')) {
        const O = boot({ html: F.file });
        w5Chk(name, C.c + ' · the file opened', what, await read(O.w, O.ev), want);
        if (has('opened-saved')) { const O2 = boot({ html: O.ev('buildSavedHtml()') });
          w5Chk(name, C.c + ' · the file opened, saved and reopened', 'the same, from the saved file', await read(O2.w, O2.ev), want); }
      }
      bootRelease(mk, []); await settleBoards();
    }
    // THE FULL IMPORT'S WORDS, TRUE FOR EACH REQUIREMENT (Codex B2, 13 Oct, P2), written out whole. PB27's list holds {k: 1,
    // 99999 / ZZZZZ} and R1 is on the number 1: a locked cycle reads only the entries whose key is text (cycRcnOf, as every ORBIT
    // since v1.99), so in PB27 the list read is [], R1 shows no code and its USAF 900 / ANG 200 print as not assigned -- and the list
    // itself is kept exactly as the file holds it, written by the import, reopened, saved and reopened. "Each requirement reads the
    // first entry with its key" was untrue of R1, with round 3's parenthesis or without it. Beside it K1, with R1 on K1, reads
    // 11111 / AAAAA. The working plan's [{k: 0}, K1] with R1 on the number 0: no list reads a pointer of 0 (rcnAsgOf), and the words
    // claim nothing of it.
    {
      const Z1 = E(1, '99999', 'ZZZZZ'), Z0 = E(0, '99999', 'ZZZZZ');
      const RAW_N = '[{"rcn":"99999","eeic":"ZZZZZ","t":"","svc":["USAF","ANG","AFRC"],"k":1}]';
      const RAW_M = '[{"rcn":"99999","eeic":"ZZZZZ","t":"","svc":["USAF","ANG","AFRC"],"k":1},{"rcn":"11111","eeic":"AAAAA","t":"","svc":["USAF","ANG","AFRC"],"k":"K1"}]';
      const SAY_N = 'RCN / EEIC lists as the file holds them, which a file handed over is refused for: O&M PB27’s list holds a key that is not text '
        + '(rcn[0].k is the number 1). A requirement on a key that is text (not empty) reads the first entry with that key, as the ORBIT that saved the '
        + 'file did. A locked cycle’s entry whose key is not text is kept but not read, as in every ORBIT since v1.99: a requirement on it shows no code '
        + 'there, and its money is on no combination. The RCN-EEIC sheet counts each key once and money on no combination only as not assigned';
      for (const [c, asg, L, raw, read, lab] of [
        ['PB27 holds {k: 1} alone, R1 on the number 1', 1, [Z1], RAW_N, { pointer: 1, list: [], label: '' }, ON_NONE],
        ['PB27 holds {k: 1}, then K1, R1 on K1', 'K1', [Z1, K1], RAW_M, { pointer: 'K1', list: ['K1'], label: ON_K1 }, ON_K1]]) {
        const mk = bootMark(), at = 'the words · ' + c;
        const F = make({ asg, cyc: L }), T = boot({ html: F.own }), r = full(T.ev, F.file), after = lsOf(T.ev);
        w5Chk(name, at + ' · ⬅ Import a full board', 'taken, and the question is true for each requirement: a requirement on a key that is text reads the first entry with it; a locked cycle’s entry whose key is not text is kept but not read, and a requirement on it shows no code',
          J([r.ret, r.threw, r.al, QLINE(r.qs[r.qs.length - 1])]), J([true, '', [], '  • ' + SAY_N]));
        w5Chk(name, at + ' · ⬅ Import a full board', 'GUARD (as d66dd60) — the locked list is written to browser storage exactly as the file holds it',
          J((JSON.parse(after['prio27om-cyc'] || '{"cycles":{}}').cycles['PB|2027'] || {}).rcn), raw);
        const R = boot({ html: F.own, ls: after });
        w5Chk(name, at + ' · imported, the same browser reopened', 'the reopened board says the same', SAID(R.ev(`(document.getElementById('shareStat')||{}).textContent||''`)), SAY_N + '.');
        w5Chk(name, at + ' · imported, the same browser reopened', 'GUARD (as d66dd60) — the locked list as the file holds it; in PB27, R1’s pointer, the keys the cycle reads and the code R1 shows',
          R.ev(`(function(){ var kept=JSON.stringify(blGet('PB|2027').rcn); cycView('PB|2027'); var o=JSON.stringify([kept, {pointer:rcnAsgOf('R1'), list:rcnReg().map(function(e){ return e.k; }), label:rcnLabel(rcnAsgOf('R1'))}]); cycLeave(); return o; })()`),
          J([raw, read]));
        w5Chk(name, at + ' · imported, the same browser reopened', 'GUARD (as d66dd60) — the RCN-EEIC sheet, read from the workbook’s bytes: USAF 900, ANG 200, all services 1,100, each once, in the award month, under the code R1 shows',
          await sheet(R.w, R.ev, 'PB|2027'), WANT('PB|2027', lab));
        const R2 = boot({ html: R.ev('buildSavedHtml()') });
        w5Chk(name, at + ' · imported, saved and reopened', 'GUARD (as d66dd60) — the locked list as the file holds it', R2.ev(`JSON.stringify(blGet('PB|2027').rcn)`), raw);
        bootRelease(mk, []); await settleBoards();
      }
      // the working plan's [{k: 0}, K1], R1 on the number 0 -- rcnAsgOf reads a pointer of 0 as none, in every list
      const mk = bootMark();
      const X = boot();
      seed(X.ev, { services: SV, items: [it('R1', 'AV', [900, 200, 0])], disc: [5000, 5000, 5000], mand: [0, 0, 0], order: ['R1'] });
      X.ev(`BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
        S.awards={R1:{mode:'single', d:FYMON[2][0], day:3}}; MS.rcn=${J([K1])}; S.rcnAsg={}; applyState(S); save(); 'ok'`);
      const own0 = X.ev('buildSavedHtml()');
      X.ev(`MS.rcn=${J([Z0, K1])}; S.rcnAsg={R1:0}; applyState(S); save(); 'ok'`);
      const T0 = boot({ html: own0 }), r0 = full(T0.ev, X.ev('buildSavedHtml()')), R0 = boot({ html: own0, ls: lsOf(T0.ev) });
      const SAY_0 = 'RCN / EEIC lists as the file holds them, which a file handed over is refused for: O&M working plan’s list holds a key that is not '
        + 'text (rcn[0].k is the number 0). A requirement on a key that is text (not empty) reads the first entry with that key, as the ORBIT that saved '
        + 'the file did. The RCN-EEIC sheet counts each key once and money on no combination only as not assigned';
      w5Chk(name, 'the words · the working plan holds {k: 0}, then K1, R1 on the number 0 · ⬅ Import a full board', 'taken, and the question claims nothing of a requirement on a key that is not text -- R1 on 0 reads none',
        J([r0.ret, r0.threw, r0.al, QLINE(r0.qs[r0.qs.length - 1])]), J([true, '', [], '  • ' + SAY_0]));
      w5Chk(name, 'the words · the working plan holds {k: 0}, then K1, R1 on the number 0 · imported, the same browser reopened', 'the reopened board says the same',
        SAID(R0.ev(`(document.getElementById('shareStat')||{}).textContent||''`)), SAY_0 + '.');
      w5Chk(name, 'the words · the working plan holds {k: 0}, then K1, R1 on the number 0 · imported, the same browser reopened', 'CONTROL (as d66dd60) — the list and R1’s pointer kept as the file holds them; R1 shows no code',
        R0.ev(`JSON.stringify([JSON.stringify(MS.rcn), JSON.stringify((S.rcnAsg||{}).R1), rcnLabel(rcnAsgOf('R1'))])`),
        J(['[{"rcn":"99999","eeic":"ZZZZZ","t":"","svc":["USAF","ANG","AFRC"],"k":0},{"rcn":"11111","eeic":"AAAAA","t":"","svc":["USAF","ANG","AFRC"],"k":"K1"}]', '0', '']));
      w5Chk(name, 'the words · the working plan holds {k: 0}, then K1, R1 on the number 0 · imported, the same browser reopened', 'CONTROL (as d66dd60) — the RCN-EEIC sheet, read from the workbook’s bytes: USAF 900, ANG 200, all services 1,100, each once, in the award month, as not assigned',
        await sheet(R0.w, R0.ev, ''), WANT('the working plan', ON_NONE));
      bootRelease(mk, []); await settleBoards();
    }
    // THE USER'S OWN BOARD HOLDING SUCH A CYCLE, AND WHAT IT WRITES (the lead, 13 Oct, from U44's round-1 money M1). PB27's list holds
    // K1 twice, taken whole by ⬅ Import a full board and the browser reopened. Brad (13 Oct): a locked cycle's list stays as it was
    // locked, and a way to correct one is deferred -- so the board's saved file and its one-appropriation file are refused by
    // ⬅ Import one appropriation and ⇊ Import several boards, on this very board as well, in words true for a file this version
    // saved: never "an ORBIT before this one", and a way that works for that file. What it can send is taken: its saved file by
    // ⬅ Import a full board, its package, which carries no locked cycle. Its one-appropriation file, opened, prints the money once.
    {
      const mk = bootMark();
      const F = make({ asg: 'K1', cyc: [K1, K1] }), T = boot({ html: F.own }); full(T.ev, F.file);
      const R = boot({ html: F.own, ls: lsOf(T.ev) });
      const saved = R.ev('buildSavedHtml()'), oneAp = R.ev(`oneAppnHtml(mySlug())||''`);
      const pkg = R.ev(`(function(){ var cap=null, _B=window.Blob; window.Blob=function(pt,o){ if(!cap && o && o.type==='application/json') cap=String(pt[0]); return new _B(pt,o); };
        window.confirm=function(){ return true; }; window.alert=function(){}; try{ localStorage.setItem('prio27who','BLL'); }catch(e){}
        try{ pkgIssue(mySlug(), true); }catch(e){ cap='threw: '+e.message; } window.Blob=_B; return cap||''; })()`);
      const at = 'the user’s own board holding PB27 [K1, K1] · ', why = AT_PB + TWICE;
      // what it says when it writes the one-appropriation file: no way back that refuses it -- why, and what works
      const stat1 = R.ev(`(function(){ var _P=window.uiPrompt; window.uiPrompt=function(m,d,cb){ cb('1'); }; window.alert=function(){};
        try{ exportOneAppn(); }finally{ window.uiPrompt=_P; } return (document.getElementById('shareStat')||{}).textContent||''; })()`);
      w5Chk(name, at + '⬇ Export one appropriation', 'the status line names no way back that refuses the file: Import one appropriation and Import several boards refuse it, and it says why and what works',
        stat1, '⬇ O&M exported as a working board of its own — its plan, its locked cycles, its execution data and its BAE rows, with the destination list, '
          + 'cost estimates and reprogramming log. It is not taken back by ⬅ Import one appropriation or ⇊ Import several boards, which refuse it: ' + why + '. '
          + RULE + ' ' + NOW + ' ' + CYCLE + ' ' + FULL);
      const told = '“cycle.html” was not imported: ' + why + '.\n\n' + RULE + ' ' + NOW + ' ' + CYCLE + ' ' + FULL + ' Nothing on this board was changed.';
      const held = lsOf(R.ev), al = JSON.parse(await one(R.ev, saved)), mv = moved(held, lsOf(R.ev));
      w5Chk(name, at + 'its saved file, ⬅ Import one appropriation on the same board', 'refused whole, in words true for a file this version saved -- never “an ORBIT before this one” -- naming a way that works for it; browser storage is byte-identical',
        J([al, mv]), J([[told], []]));
      const held2 = lsOf(R.ev), al2 = JSON.parse(await several(R.ev, oneAp)), mv2 = moved(held2, lsOf(R.ev));
      w5Chk(name, at + 'its one-appropriation file, ⇊ Import several boards on the same board', 'refused whole, in the same words; browser storage is byte-identical',
        J([al2, mv2]), J([[told], []]));
      // three files at once, the refused one between two clean boards that say v1.99 saved them: the refusal is of the file it
      // names, told who saved THAT file, whichever of the three was read last
      const clean = F.own.replace(/const BUILD='v2\.00[^']*'/, "const BUILD='v1.99 (6 Oct 2026)'");
      const held3 = lsOf(R.ev), al3 = JSON.parse(await R.ev(`new Promise(function(res){ var al=[]; window.alert=function(m){ al.push(String(m)); };
        window.confirm=function(){ return true; };
        var inp={files:[new File([${J(clean)}], 'a.html'), new File([${J(oneAp)}], 'cycle.html'), new File([${J(clean)}], 'c.html')], value:'x'};
        try{ importBoards(inp); }catch(e){ al.push('THREW '+e.message); }
        (function wait(n){ if(inp.value==='' || n>600) return res(JSON.stringify(al)); setTimeout(function(){ wait(n+1); }, 5); })(0); })`));
      w5Chk(name, at + 'its one-appropriation file between two boards an earlier version saved, ⇊ Import several boards on the same board',
        'the batch is refused whole, the refusal telling who saved the file it names; browser storage is byte-identical',
        J([al3, moved(held3, lsOf(R.ev))]), J([['“cycle.html” was not imported: ' + why + ' (so none of the 3 files was taken).\n\n' + RULE + ' ' + NOW + ' '
          + CYCLE + ' ' + FULL + ' Nothing on this board was changed.'], []]));
      const O = boot({ html: oneAp });
      w5Chk(name, at + 'its one-appropriation file, opened', 'the RCN-EEIC sheet of PB27, read from the workbook’s bytes: USAF 900, ANG 200, all services 1,100, each once, under 11111 / AAAAA',
        await sheet(O.w, O.ev, 'PB|2027'), WANT('PB|2027', ON_K1));
      const P = boot(), heldP = lsOf(P.ev), alP = JSON.parse(await one(P.ev, pkg)), mvP = moved(heldP, lsOf(P.ev));
      w5Chk(name, at + 'its package, File → Import on a new board', 'CONTROL (as d66dd60) — taken: a package carries the working plan’s list [K1] and no locked cycle',
        J([alP.filter(a => /was not imported/.test(a)), mvP.includes('prio27om')]), J([[], true]));
      const r = full(R.ev, saved);
      w5Chk(name, at + 'its saved file, ⬅ Import a full board on the same board', 'CONTROL (as d66dd60) — taken whole, as the advice says', J([r.ret, r.threw, r.al]), J([true, '', []]));
      bootRelease(mk, []); await settleBoards();
    }
    // THE USER'S OWN BOARD WHOSE WORKING PLAN'S LIST AND PB27'S BOTH LIST K1 TWICE -- a board that locked PB27 while its list repeated
    // K1 holds both -- taken whole and the browser reopened (verification round 5, money MF1). The door names the working plan's list,
    // the first it meets; the refusal says the file also carries a locked cycle whose list is refused, and names only the ways that
    // work for such a file -- not ✕ and the file written again, which leaves it refused, for PB27's list, as the board then says. Its
    // package carries the working plan's list alone: refused until ✕ on the repeated row, then taken. The money is printed once.
    {
      const mk = bootMark();
      const F = make({ asg: 'K1', plan: [K1, K1], cyc: [K1, K1] }), T = boot({ html: F.own }); full(T.ev, F.file);
      const R = boot({ html: F.own, ls: lsOf(T.ev) });
      const at = 'the user’s own board whose working plan and PB27 each list K1 twice · ', why = AT_WP + TWICE;
      const tail = RULE + ' ' + NOW + ' ' + TOO + ' ' + CYCLE + ' ' + FULL;
      const pkgOf = ev => ev(`(function(){ var cap=null, _B=window.Blob; window.Blob=function(pt,o){ if(!cap && o && o.type==='application/json') cap=String(pt[0]); return new _B(pt,o); };
        window.confirm=function(){ return true; }; window.alert=function(){}; try{ localStorage.setItem('prio27who','BLL'); }catch(e){}
        try{ pkgIssue(mySlug(), true); }catch(e){ cap='threw: '+e.message; } window.Blob=_B; return cap||''; })()`);
      w5Chk(name, at + 'the working plan, exported', 'the RCN-EEIC sheet, read from the workbook’s bytes: USAF 900, ANG 200, all services 1,100, each once, under 11111 / AAAAA',
        await sheet(R.w, R.ev, ''), WANT('the working plan', ON_K1));
      w5Chk(name, at + 'PB27, exported', 'the RCN-EEIC sheet, read from the workbook’s bytes: USAF 900, ANG 200, all services 1,100, each once, under 11111 / AAAAA',
        await sheet(R.w, R.ev, 'PB|2027'), WANT('PB|2027', ON_K1));
      const stat1 = R.ev(`(function(){ var _P=window.uiPrompt; window.uiPrompt=function(m,d,cb){ cb('1'); }; window.alert=function(){};
        try{ exportOneAppn(); }finally{ window.uiPrompt=_P; } return (document.getElementById('shareStat')||{}).textContent||''; })()`);
      w5Chk(name, at + '⬇ Export one appropriation', 'the status line names no way back that refuses the file, and says the file also carries a locked cycle whose list is refused',
        stat1, '⬇ O&M exported as a working board of its own — its plan, its locked cycles, its execution data and its BAE rows, with the destination list, '
          + 'cost estimates and reprogramming log. It is not taken back by ⬅ Import one appropriation or ⇊ Import several boards, which refuse it: ' + why + '. ' + tail);
      const saved = R.ev('buildSavedHtml()'), oneAp = R.ev(`oneAppnHtml(mySlug())||''`), pkg = pkgOf(R.ev);
      const told = '“cycle.html” was not imported: ' + why + '.\n\n' + tail + ' Nothing on this board was changed.';
      const held = lsOf(R.ev), al = JSON.parse(await one(R.ev, saved)), mv = moved(held, lsOf(R.ev));
      w5Chk(name, at + 'its saved file, ⬅ Import one appropriation on the same board', 'refused whole, naming the locked cycle whose list is refused as well, and only the ways that work for such a file; browser storage is byte-identical',
        J([al, mv]), J([[told], []]));
      const held2 = lsOf(R.ev), al2 = JSON.parse(await several(R.ev, oneAp)), mv2 = moved(held2, lsOf(R.ev));
      w5Chk(name, at + 'its one-appropriation file, ⇊ Import several boards on the same board', 'refused whole, in the same words; browser storage is byte-identical',
        J([al2, mv2]), J([[told], []]));
      const P = boot(), heldP = lsOf(P.ev), alP = JSON.parse(await one(P.ev, pkg)), mvP = moved(heldP, lsOf(P.ev));
      w5Chk(name, at + 'its package, File → Import on a new board', 'refused whole: a package carries the working plan’s list and no locked cycle, so the way named is ✕ and the file written again; browser storage is byte-identical',
        J([alP, mvP]), J([['“cycle.html” was not imported: the RCN / EEIC list at the file.ms.rcn holds the key “K1” twice (rcn[0] and rcn[1]); a key names one combination.\n\n'
          + RULE + ' ' + PLAN + ' Nothing on this board was changed.'], []]));
      // its PMO copy carries the working plan's list and only the reference of PB27 (no list): refused for the working plan's list,
      // and told only the way that works for a PMO copy -- not Import a full board, which would put the copy's reference of PB27 in
      // place of the board's own
      const pmo = R.ev(`(function(){ var cap=null, _B=window.Blob; window.Blob=function(pt,o){ if(!cap && o && o.type==='text/html') cap=String(pt[0]); return new _B(pt,o); };
        window.confirm=function(){ return true; }; window.alert=function(){}; try{ publishPmoCopy(); }catch(e){ cap='threw: '+e.message; } window.Blob=_B; return cap||''; })()`);
      const PM = boot(), heldM = lsOf(PM.ev), alM = JSON.parse(await one(PM.ev, pmo)), mvM = moved(heldM, lsOf(PM.ev));
      w5Chk(name, at + 'its PMO copy, File → Import on a new board', 'refused whole, told only the way that works for a PMO copy -- the list put right and the copy published again, not Import a full board; browser storage is byte-identical',
        J([alM, mvM]), J([['“cycle.html” was not imported: ' + why + '.\n\n' + RULE + ' ' + NOW + ' ' + PLAN + ' Nothing on this board was changed.'], []]));
      // ✕ on the working plan's repeated row: its saved file is refused still, now for PB27's list; its package is taken
      const keys = R.ev(`(function(){ window.confirm=function(){ return true; }; rcnDel(1); return JSON.stringify([rcnReg().map(function(e){ return e.k; }), rcnAsgOf('R1')]); })()`);
      const saved2 = R.ev('buildSavedHtml()'), held3 = lsOf(R.ev), al3 = JSON.parse(await one(R.ev, saved2)), mv3 = moved(held3, lsOf(R.ev));
      w5Chk(name, at + '✕ on the working plan’s row 2, then its saved file, ⬅ Import one appropriation on the same board', 'R1 stays on K1; the file is refused still, now for PB27’s list, as the words said; browser storage is byte-identical',
        J([JSON.parse(keys), al3, mv3]), J([[['K1'], 'K1'], ['“cycle.html” was not imported: ' + AT_PB + TWICE + '.\n\n' + RULE + ' ' + NOW + ' ' + CYCLE + ' ' + FULL
          + ' Nothing on this board was changed.'], []]));
      const P2 = boot(), heldP2 = lsOf(P2.ev), alP2 = JSON.parse(await one(P2.ev, pkgOf(R.ev))), mvP2 = moved(heldP2, lsOf(P2.ev));
      w5Chk(name, at + '✕ on the working plan’s row 2, then its package, File → Import on a new board', 'CONTROL (as d66dd60) — taken: the package’s list is [K1]',
        J([alP2.filter(a => /was not imported/.test(a)), mvP2.includes('prio27om')]), J([[], true]));
      bootRelease(mk, []); await settleBoards();
    }
    // THE USER'S OWN BOARD WHOSE WORKING PLAN LISTS K1 TWICE, NO LOCKED CYCLE AMISS, taken whole and the browser reopened (verification
    // round 6, tests S1). ⬇ Export one appropriation names no way back that refuses the file it wrote: it says why, and the working
    // plan's way -- ✕ on the repeated row, and the file written again. After ✕ it says to take the file back, and a board takes it.
    // CONTROL: an ordinary board's export says to take its file back, as d66dd60's did.
    {
      const mk = bootMark();
      const EXP = '⬇ O&M exported as a working board of its own — its plan, its locked cycles, its execution data and its BAE rows, with the destination list, '
        + 'cost estimates and reprogramming log. ';
      const BACK = 'Take it back with 📁 File → ⬅ Import one appropriation.';
      const NOT_BACK = 'It is not taken back by ⬅ Import one appropriation or ⇊ Import several boards, which refuse it: ';
      const stat = ev => ev(`(function(){ var _P=window.uiPrompt; window.uiPrompt=function(m,d,cb){ cb('1'); }; window.alert=function(){};
        try{ exportOneAppn(); }finally{ window.uiPrompt=_P; } return (document.getElementById('shareStat')||{}).textContent||''; })()`);
      const F = make({ asg: 'K1', plan: [K1, K1] }), T = boot({ html: F.own }); full(T.ev, F.file);
      const R = boot({ html: F.own, ls: lsOf(T.ev) });
      const at = 'the user’s own board whose working plan lists K1 twice, no locked cycle amiss · ', why = AT_WP + TWICE;
      w5Chk(name, at + '⬇ Export one appropriation', 'the status line names no way back that refuses the file: it says why, and the working plan’s way -- ✕, and the file written again',
        stat(R.ev), EXP + NOT_BACK + why + '. ' + RULE + ' ' + NOW + ' ' + PLAN + ' ' + FULL);
      const oneAp = R.ev(`oneAppnHtml(mySlug())||''`), held = lsOf(R.ev), al = JSON.parse(await one(R.ev, oneAp)), mv = moved(held, lsOf(R.ev));
      w5Chk(name, at + 'its one-appropriation file, ⬅ Import one appropriation on the same board', 'refused whole, as the status line said; browser storage is byte-identical',
        J([al, mv]), J([['“cycle.html” was not imported: ' + why + '.\n\n' + RULE + ' ' + NOW + ' ' + PLAN + ' ' + FULL + ' Nothing on this board was changed.'], []]));
      const keys = R.ev(`(function(){ window.confirm=function(){ return true; }; rcnDel(1); return JSON.stringify([rcnReg().map(function(e){ return e.k; }), rcnAsgOf('R1')]); })()`);
      w5Chk(name, at + '✕ on row 2, then ⬇ Export one appropriation', 'R1 stays on K1, and the status line says to take the file back',
        J([JSON.parse(keys), stat(R.ev)]), J([[['K1'], 'K1'], EXP + BACK]));
      const P = boot(), heldP = lsOf(P.ev), alP = JSON.parse(await one(P.ev, R.ev(`oneAppnHtml(mySlug())||''`))), mvP = moved(heldP, lsOf(P.ev));
      w5Chk(name, at + '✕ on row 2, then its one-appropriation file, ⬅ Import one appropriation on a new board', 'CONTROL (as d66dd60) — taken, as the status line says',
        J([alP.filter(a => /was not imported/.test(a)), mvP.includes('prio27om')]), J([[], true]));
      const K = make({ asg: 'K1', cyc: [K1] }), O = boot({ html: K.file });
      w5Chk(name, 'CONTROL (as d66dd60) · an ordinary board, PB27 [K1] · ⬇ Export one appropriation', 'the status line says to take the file back by Import one appropriation',
        stat(O.ev), EXP + BACK);
      bootRelease(mk, []); await settleBoards();
    }
    // A PACKAGE OR A PMO COPY REFUSED FOR AN ENTRY IN THE WORKING PLAN'S LIST THAT IS NOT ONE (verification round 6, money SF1). The
    // user's own board takes its working plan's ["K9", K1], or [0, K1], whole and the browser is reopened; its package and its PMO copy
    // are handed to a new board. Neither is a board of one's own, so neither is told it opens as one. ✕ on its row removes "K9", so
    // that way is named, and after it the door passes both; ✕ does nothing on 0 (rcnDel stops at it), so no way is named, and the
    // package is refused still.
    {
      const ENTRY = 'An RCN / EEIC list holds combinations and nothing else. No ORBIT makes such an entry.';
      const ENTRYX = 'It can be taken out on a board of this version, in 🗂 RCN / EEIC, where ✕ on its row removes it, and the file written again.';
      const pkgOf = ev => ev(`(function(){ var cap=null, _B=window.Blob; window.Blob=function(pt,o){ if(!cap && o && o.type==='application/json') cap=String(pt[0]); return new _B(pt,o); };
        window.confirm=function(){ return true; }; window.alert=function(){}; try{ localStorage.setItem('prio27who','BLL'); }catch(e){}
        try{ pkgIssue(mySlug(), true); }catch(e){ cap='threw: '+e.message; } window.Blob=_B; return cap||''; })()`);
      const pmoOf = ev => ev(`(function(){ var cap=null, _B=window.Blob; window.Blob=function(pt,o){ if(!cap && o && o.type==='text/html') cap=String(pt[0]); return new _B(pt,o); };
        window.confirm=function(){ return true; }; window.alert=function(){}; try{ publishPmoCopy(); }catch(e){ cap='threw: '+e.message; } window.Blob=_B; return cap||''; })()`);
      const W1 = '{"rcn":"11111","eeic":"AAAAA","t":"","svc":["USAF","ANG","AFRC"],"k":"K1"}';
      for (const [c, plan, shown, gone] of [['“K9”', ['K9', K1], '“"K9"”', true], ['the number 0', [0, K1], '“0”', false]]) {
        const mk = bootMark();
        const F = make({ asg: 'K1', plan }), T = boot({ html: F.own }); full(T.ev, F.file);
        const R = boot({ html: F.own, ls: lsOf(T.ev) });
        const at = 'the user’s own board whose working plan holds ' + c + ', then K1 · ';
        const told = (p, tail) => '“cycle.html” was not imported: the RCN / EEIC entry at ' + p + '.rcn[0] is not a combination (' + shown
          + '); a list holds combinations and nothing else.\n\n' + tail + ' Nothing on this board was changed.';
        const pkg = pkgOf(R.ev), pmo = pmoOf(R.ev);
        const P = boot(), heldP = lsOf(P.ev), alP = JSON.parse(await one(P.ev, pkg)), mvP = moved(heldP, lsOf(P.ev));
        w5Chk(name, at + 'its package, File → Import on a new board', gone ? 'refused whole, told the way that works: ✕ on its row, and the file written again; browser storage is byte-identical'
          : 'refused whole, told no way: ✕ does nothing on 0, and a package is not a board; browser storage is byte-identical',
          J([alP, mvP]), J([[told('the file.ms', gone ? ENTRY + ' ' + ENTRYX : ENTRY)], []]));
        const M = boot(), heldM = lsOf(M.ev), alM = JSON.parse(await one(M.ev, pmo)), mvM = moved(heldM, lsOf(M.ev));
        w5Chk(name, at + 'its PMO copy, File → Import on a new board', gone ? 'refused whole, told the way that works for a PMO copy: ✕ on its row, and the copy written again; browser storage is byte-identical'
          : 'refused whole, told no way: ✕ does nothing on 0, and a PMO copy is not a board of one’s own; browser storage is byte-identical',
          J([alM, mvM]), J([[told('the saved state.appns.om', gone ? ENTRY_TAIL + ' ' + ENTRYX : ENTRY_TAIL)], []]));
        const L = R.ev(`(function(){ window.confirm=function(){ return true; }; rcnDel(0); return JSON.stringify(rcnReg()); })()`);
        if (gone) {
          const pkg2 = pkgOf(R.ev), P2 = boot(), heldP2 = lsOf(P2.ev), alP2 = JSON.parse(await one(P2.ev, pkg2)), mvP2 = moved(heldP2, lsOf(P2.ev));
          w5Chk(name, at + '✕ on row 1, then its package and its PMO copy', 'CONTROL (as d66dd60) — the row is gone; the door passes both, and a new board takes the package',
            J([L, P2.ev(`inboundCheck(${J(pkg2)})`), P2.ev(`inboundCheck(${J(pmoOf(R.ev))})`), alP2.filter(a => /was not imported/.test(a)), mvP2.includes('prio27om')]),
            J(['[' + W1 + ']', '', '', [], true]));
        } else {
          const P2 = boot(), heldP2 = lsOf(P2.ev), alP2 = JSON.parse(await one(P2.ev, pkgOf(R.ev))), mvP2 = moved(heldP2, lsOf(P2.ev));
          w5Chk(name, at + '✕ on row 1, then its package, File → Import on a new board', 'the row stays, as ✕ does nothing on 0; the package is refused still, in the same words; browser storage is byte-identical',
            J([L, alP2, mvP2]), J(['[0,' + W1 + ']', [told('the file.ms', ENTRY)], []]));
        }
        bootRelease(mk, []); await settleBoards();
      }
    }
    // THE ✕ WAY, FOR EVERY KIND OF ENTRY IT IS SAID OR NOT SAID FOR (verification round 7, tests S1). A locked cycle's entry that ✕
    // would remove from a working plan ("K9" in PB27) is never told ✕ -- a locked cycle's list stays as it was locked -- by ⬅ Import one
    // appropriation or ⇊ Import several boards. A package or a PMO copy refused for false or "" (rcnDel stops at them) is told no way;
    // for 5 or [] it is told ✕, and ✕ clicked on that row in 🗂 RCN / EEIC takes it out, after which a new board takes the package. A
    // null entry among three files through ⇊ Import several boards is told no way, as among two.
    {
      const ENTRY = 'An RCN / EEIC list holds combinations and nothing else. No ORBIT makes such an entry.';
      const ENTRYX = 'It can be taken out on a board of this version, in 🗂 RCN / EEIC, where ✕ on its row removes it, and the file written again.';
      const W1 = '{"rcn":"11111","eeic":"AAAAA","t":"","svc":["USAF","ANG","AFRC"],"k":"K1"}';
      const pkgOf = ev => ev(`(function(){ var cap=null, _B=window.Blob; window.Blob=function(pt,o){ if(!cap && o && o.type==='application/json') cap=String(pt[0]); return new _B(pt,o); };
        window.confirm=function(){ return true; }; window.alert=function(){}; try{ localStorage.setItem('prio27who','BLL'); }catch(e){}
        try{ pkgIssue(mySlug(), true); }catch(e){ cap='threw: '+e.message; } window.Blob=_B; return cap||''; })()`);
      const pmoOf = ev => ev(`(function(){ var cap=null, _B=window.Blob; window.Blob=function(pt,o){ if(!cap && o && o.type==='text/html') cap=String(pt[0]); return new _B(pt,o); };
        window.confirm=function(){ return true; }; window.alert=function(){}; try{ publishPmoCopy(); }catch(e){ cap='threw: '+e.message; } window.Blob=_B; return cap||''; })()`);
      // ✕ on row 1, clicked in the open 🗂 RCN / EEIC panel, every question answered yes; the list after
      const clickX = ev => ev(`(function(){ window.confirm=function(){ return true; }; if(!rcnOpen) toggleRcn();
        var b=document.querySelectorAll('#rcnBody button.qb'), r=b.length? (b[0].click(), JSON.stringify(rcnReg())) : 'no ✕ button';
        if(rcnOpen) toggleRcn(); return r; })()`);
      {
        const mk = bootMark();
        const C = make({ asg: 'K1', cyc: ['K9', K1] });
        const whyC = 'the RCN / EEIC entry at the saved state.cycDb.byAp.om.cycles.PB|2027.rcn[0] is not a combination (“"K9"”); a list holds combinations and nothing else';
        for (const [rt, fn] of [['⬅ Import one appropriation', one], ['⇊ Import several boards', several]]) {
          const P = boot(), h = lsOf(P.ev), al = JSON.parse(await fn(P.ev, C.file)), mv = moved(h, lsOf(P.ev));
          w5Chk(name, 'the user’s own board whose PB27 holds “K9”, then K1 · its saved file, ' + rt + ' on a new board', 'refused whole, told the locked cycle’s words and never ✕; browser storage is byte-identical',
            J([al, mv]), J([['“cycle.html” was not imported: ' + whyC + '.\n\n' + ENTRY_TAIL + ' ' + CYCLE_ONLY + ' ' + OPENS + ' ' + FULL + ' Nothing on this board was changed.'], []]));
        }
        bootRelease(mk, []); await settleBoards();
      }
      for (const [c, plan, shown, gone, raw] of [['false', [false, K1], '“false”', false, '[false,' + W1 + ']'], ['“”', ['', K1], '“""”', false, '["",' + W1 + ']'],
        ['the number 5', [5, K1], '“5”', true, ''], ['[]', [[], K1], '“[]”', true, '']]) {
        const mk = bootMark();
        const F = make({ asg: 'K1', plan }), T = boot({ html: F.own }); full(T.ev, F.file);
        const R = boot({ html: F.own, ls: lsOf(T.ev) });
        const at = 'the user’s own board whose working plan holds ' + c + ', then K1 · ';
        const told = (p, tail) => '“cycle.html” was not imported: the RCN / EEIC entry at ' + p + '.rcn[0] is not a combination (' + shown
          + '); a list holds combinations and nothing else.\n\n' + tail + ' Nothing on this board was changed.';
        const pkg = pkgOf(R.ev), pmo = pmoOf(R.ev);
        const P = boot(), heldP = lsOf(P.ev), alP = JSON.parse(await one(P.ev, pkg)), mvP = moved(heldP, lsOf(P.ev));
        w5Chk(name, at + 'its package, File → Import on a new board', gone ? 'refused whole, told ✕ on its row and the file written again; browser storage is byte-identical'
          : 'refused whole, told no way: ✕ does nothing there; browser storage is byte-identical', J([alP, mvP]), J([[told('the file.ms', gone ? ENTRY + ' ' + ENTRYX : ENTRY)], []]));
        const M = boot(), heldM = lsOf(M.ev), alM = JSON.parse(await one(M.ev, pmo)), mvM = moved(heldM, lsOf(M.ev));
        w5Chk(name, at + 'its PMO copy, File → Import on a new board', gone ? 'refused whole, told ✕ on its row and the copy written again; browser storage is byte-identical'
          : 'refused whole, told no way; browser storage is byte-identical', J([alM, mvM]), J([[told('the saved state.appns.om', gone ? ENTRY_TAIL + ' ' + ENTRYX : ENTRY_TAIL)], []]));
        const after = clickX(R.ev);
        const P2 = boot(), held2 = lsOf(P2.ev), al2 = JSON.parse(await one(P2.ev, pkgOf(R.ev))), mv2 = moved(held2, lsOf(P2.ev));
        if (gone) w5Chk(name, at + '✕ clicked on row 1 in 🗂 RCN / EEIC, then its package, File → Import on a new board', 'CONTROL (as d66dd60) — the row is gone, and the package is taken',
          J([after, al2.filter(a => /was not imported/.test(a)), mv2.includes('prio27om')]), J(['[' + W1 + ']', [], true]));
        else w5Chk(name, at + '✕ clicked on row 1 in 🗂 RCN / EEIC, then its package, File → Import on a new board', 'the row stays, as ✕ does nothing there; the package is refused still, in the same words; browser storage is byte-identical',
          J([after, al2, mv2]), J([raw, [told('the file.ms', ENTRY)], []]));
        bootRelease(mk, []); await settleBoards();
      }
      {
        const mk = bootMark();
        const F = make({ asg: 'K1', plan: [null, K1] });
        const three = ev => ev(`new Promise(function(res){ var al=[]; window.alert=function(m){ al.push(String(m)); }; window.confirm=function(){ return true; };
          var inp={files:[new File([${J(F.file)}], 'cycle.html'), new File([${J(F.own)}], 'a.html'), new File([${J(F.own)}], 'b.html')], value:'x'};
          try{ importBoards(inp); }catch(e){ al.push('THREW '+e.message); }
          (function wait(n){ if(inp.value==='' || n>600) return res(JSON.stringify(al)); setTimeout(function(){ wait(n+1); }, 5); })(0); })`);
        const P = boot(), h = lsOf(P.ev), al = JSON.parse(await three(P.ev)), mv = moved(h, lsOf(P.ev));
        w5Chk(name, 'an entry that is not one · beside two board files, ⇊ Import several boards', 'the batch of three is refused whole, naming no way; browser storage is byte-identical',
          J([al, mv]), J([['“cycle.html” was not imported: the RCN / EEIC entry at the saved state.appns.om.rcn[0] is not a combination (“null”); a list holds combinations and nothing else'
            + ' (so none of the 3 files was taken).\n\n' + ENTRY_TAIL + ' Nothing on this board was changed.'], []]));
        bootRelease(mk, []); await settleBoards();
      }
    }
    // A LOCK WHILE THE WORKING PLAN'S LIST BREAKS THE RULE (verification round 7, money MF1). A lock keeps the list as it is, and a
    // locked cycle's list stays as it was locked. The user's own board took its file whole -- its working plan listing K1 twice -- and
    // locked POM27, and was asked nothing of the list; every file of that board was then refused by ⬅ Import one appropriation and
    // ⇊ Import several boards, for POM27, though ✕ on the repeated row put the working plan right. The question now says so first, and
    // what it says holds: Cancel locks nothing; answered yes, POM27 keeps [K1, K1] and exports R1's money once, and the saved file is
    // refused on a new board and on the same one, before ✕ and after it. ✕ on the repeated row first, and the lock asks what it
    // always did, POM27 keeps [K1], and a new board takes the saved file. An entry that is not one ("K9") is said as the door says it.
    // CONTROL: an ordinary [K1, K2] is asked what it always was.
    {
      const Q = 'Lock the FYDP window as POM27?\n\nFY27 — every requirement, its value, allocation and funding by service, the PMO roll-up and the '
        + 'budget authority of each year — are copied whole and LOCKED.\n\nFY28, FY29, FY30, FY31 hold no plan yet and will be recorded as such.';
      const QEND = '\n\nThe working board is not changed.';
      const KEEPS = what => '\n\nThe RCN / EEIC list it keeps ' + what + '. A locked cycle’s list stays as it was locked, so ⬅ Import one '
        + 'appropriation and ⇊ Import several boards will refuse every file that carries this cycle, on every board of this version.';
      // Lock POM27 (FY27), every question kept and answered `yes`; whether POM27 is there after, and the list it keeps
      const lock = (ev, yes) => JSON.parse(ev(`(function(){ var qs=[]; window.confirm=function(q){ qs.push(String(q)); return ${yes}; };
        window.alert=function(){}; blCyc='POM'; blYr=2027; cycLock(); var c=blGet('POM|2027'); return JSON.stringify({qs:qs, made:!!c, rcn:c? c.rcn : null}); })()`));
      const at = 'the user’s own board whose working plan lists K1 twice, taken whole · ';
      {
        const mk = bootMark();
        const F = make({ asg: 'K1', cyc: [K1], plan: [K1, K1] }), T = boot({ html: F.own }); full(T.ev, F.file);
        const R = boot({ html: F.own, ls: lsOf(T.ev) });
        const held = lsOf(R.ev), c0 = lock(R.ev, false);
        w5Chk(name, at + 'Lock POM27, answered Cancel', 'the question says what the list it keeps holds, and that every file carrying the cycle will be refused; nothing is locked, and browser storage is byte-identical',
          J([c0.qs, c0.made, moved(held, lsOf(R.ev))]), J([[Q + KEEPS(TWICE) + QEND], false, []]));
        const c1 = lock(R.ev, true);
        w5Chk(name, at + 'Lock POM27, answered yes', 'GUARD (as d66dd60) — asked once; POM27 keeps the list as it is', J([c1.qs.length, c1.made, c1.rcn]), J([1, true, [K1, K1]]));
        w5Chk(name, at + 'Lock POM27, answered yes, then POM27 exported', 'the RCN-EEIC sheet, read from the workbook’s bytes: USAF 900, ANG 200, all services 1,100, each once, under 11111 / AAAAA',
          await sheet(R.w, R.ev, 'POM|2027'), WANT('POM|2027', ON_K1));
        const told = '“cycle.html” was not imported: ' + AT_WP + TWICE + '.\n\n' + RULE + ' ' + NOW + ' ' + TOO + ' ' + CYCLE + ' ' + FULL + ' Nothing on this board was changed.';
        const sv = R.ev('buildSavedHtml()'), P = boot(), hP = lsOf(P.ev), alP = JSON.parse(await one(P.ev, sv)), mvP = moved(hP, lsOf(P.ev));
        const hR = lsOf(R.ev), alR = JSON.parse(await several(R.ev, sv)), mvR = moved(hR, lsOf(R.ev));
        w5Chk(name, at + 'Lock POM27, answered yes, then its saved file, ⬅ Import one appropriation on a new board and ⇊ Import several boards on the same one',
          'refused whole by each, as the question said; browser storage is byte-identical', J([alP, mvP, alR, mvR]), J([[told], [], [told], []]));
        R.ev(`(function(){ window.confirm=function(){ return true; }; rcnDel(1); return 'ok'; })()`);
        const sv2 = R.ev('buildSavedHtml()'), P2 = boot(), h2 = lsOf(P2.ev), al2 = JSON.parse(await one(P2.ev, sv2)), mv2 = moved(h2, lsOf(P2.ev));
        w5Chk(name, at + 'Lock POM27, answered yes, then ✕ on row 2, then its saved file, ⬅ Import one appropriation on a new board',
          'the working plan is put right, and the file is refused still, for POM27’s list, which stays as it was locked; browser storage is byte-identical',
          J([R.ev(`JSON.stringify(rcnReg().map(function(e){ return e.k; }))`), al2, mv2]),
          J(['["K1"]', ['“cycle.html” was not imported: the RCN / EEIC list at the saved state.cycDb.byAp.om.cycles.POM|2027.rcn ' + TWICE + '.\n\n' + RULE + ' '
            + NOW + ' ' + CYCLE + ' ' + FULL + ' Nothing on this board was changed.'], []]));
        bootRelease(mk, []); await settleBoards();
      }
      {
        const mk = bootMark();
        const F = make({ asg: 'K1', cyc: [K1], plan: [K1, K1] }), T = boot({ html: F.own }); full(T.ev, F.file);
        const R = boot({ html: F.own, ls: lsOf(T.ev) });
        const keys = R.ev(`(function(){ window.confirm=function(){ return true; }; rcnDel(1); return JSON.stringify([rcnReg().map(function(e){ return e.k; }), rcnAsgOf('R1')]); })()`);
        w5Chk(name, at + '✕ on row 2 first', 'the row goes, and R1 stays on K1', keys, J([['K1'], 'K1']));
        const c = lock(R.ev, true);
        w5Chk(name, at + '✕ on row 2 first, then Lock POM27', 'CONTROL (as d66dd60) — the lock asks what it always did, and POM27 keeps [K1]', J([c.qs, c.made, c.rcn]), J([[Q + QEND], true, [K1]]));
        w5Chk(name, at + '✕ on row 2 first, then Lock POM27, then POM27 exported', 'the RCN-EEIC sheet, read from the workbook’s bytes: USAF 900, ANG 200, all services 1,100, each once, under 11111 / AAAAA',
          await sheet(R.w, R.ev, 'POM|2027'), WANT('POM|2027', ON_K1));
        const P = boot(), hP = lsOf(P.ev), alP = JSON.parse(await one(P.ev, R.ev('buildSavedHtml()'))), mvP = moved(hP, lsOf(P.ev));
        w5Chk(name, at + '✕ on row 2 first, then Lock POM27, then its saved file, ⬅ Import one appropriation on a new board', 'CONTROL (as d66dd60) — taken',
          J([alP.filter(a => /was not imported/.test(a)), mvP.includes('prio27om')]), J([[], true]));
        bootRelease(mk, []); await settleBoards();
      }
      {
        const mk = bootMark();
        const O = boot({ html: make({ asg: 'K1', cyc: [K1], plan: ['K9', K1] }).file }), held = lsOf(O.ev), c = lock(O.ev, false);
        w5Chk(name, 'a board whose working plan holds “K9”, then K1, opened from its file · Lock POM27, answered Cancel',
          'the question says the entry as the door says it, and that every file carrying the cycle will be refused; nothing is locked, and browser storage is byte-identical',
          J([c.qs, c.made, moved(held, lsOf(O.ev))]),
          J([[Q + KEEPS('holds rcn[0], which is not a combination (“"K9"”); a list holds combinations and nothing else') + QEND], false, []]));
        const N = boot({ html: make({ asg: 'K1', cyc: [K1], plan: [K1, K2] }).file }), d = lock(N.ev, true);
        w5Chk(name, 'CONTROL (as d66dd60) · a board whose working plan lists ordinary K1, K2, opened from its file · Lock POM27', 'the lock asks what it always did, and POM27 keeps [K1, K2]',
          J([d.qs, d.made, d.rcn]), J([[Q + QEND], true, [K1, K2]]));
        bootRelease(mk, []); await settleBoards();
      }
      // v2.00 (U32, U33; verification round 8): THE QUESTION FOR THE OTHER WAYS A LIST BREAKS THE RULE. The lock asks when the list it
      // keeps breaks the rule in any way the door refuses -- a key that is not text, and a key beginning with two underscores, as
      // well as a key repeated and an entry that is not one -- and says it as the door says it; answered yes, POM27 keeps the list as
      // it is, and the saved file is refused, as the question said.
      {
        const mk = bootMark();
        for (const [c, plan, what] of [['the number 1 as a key', [N1, K1], NOT_TEXT],
          ['an entry named “__none__”', [NN, K1], 'holds the key “__none__” (rcn[0]); a key beginning with two underscores is one the board keeps for its own bookkeeping']]) {
          const at2 = 'a board whose working plan holds ' + c + ', then K1, opened from its file · ';
          const O = boot({ html: make({ asg: 'K1', cyc: [K1], plan }).file }), held = lsOf(O.ev), c0 = lock(O.ev, false);
          w5Chk(name, at2 + 'Lock POM27, answered Cancel', 'the question says what the list it keeps holds, as the door says it; nothing is locked, and browser storage is byte-identical',
            J([c0.qs, c0.made, moved(held, lsOf(O.ev))]), J([[Q + KEEPS(what) + QEND], false, []]));
          const c1 = lock(O.ev, true), P = boot(), hP = lsOf(P.ev), alP = JSON.parse(await one(P.ev, O.ev('buildSavedHtml()'))), mvP = moved(hP, lsOf(P.ev));
          w5Chk(name, at2 + 'Lock POM27, answered yes, then its saved file, ⬅ Import one appropriation on a new board',
            'POM27 keeps the list as it is, and the file is refused, as the question said; browser storage is byte-identical',
            J([c1.rcn, alP, mvP]), J([plan, ['“cycle.html” was not imported: ' + AT_WP + what + '.\n\n' + RULE + ' ' + NOW + ' ' + TOO + ' ' + CYCLE + ' '
              + FULL + ' Nothing on this board was changed.'], []]));
        }
        bootRelease(mk, []); await settleBoards();
      }
    }
    // A LOCKED CYCLE UNLOCKED, THEN DELETED OR LOCKED OVER (verification round 8, money MF1). The refusal said of such a cycle's
    // list "and no board changes it", and the board that wrote the file changes it: 🔓 Unlock asks "Unlocking lets it be overwritten
    // or deleted", and then 🗑 Delete removes the cycle, or 🔒 Lock over it replaces it with the working plan's. So the refusal says
    // only what holds: a locked cycle's list stays as it was locked. The user's own board holding PB27 [K1, K1], taken whole and the
    // browser reopened: PB27 unlocked, its saved file carries PB27 unlocked, [K1, K1], and is refused by ⬅ Import one appropriation on
    // a new board in those words, browser storage byte-identical; then PB27 deleted -- or, on a second such board, locked over, its
    // list now the working plan's [K1] -- and the saved file written again is taken. That gives up PB27 as it was locked.
    {
      const UNLOCK = 'Unlock PB27?\n\nA locked cycle is meant to be a fixed point in time. Unlocking lets it be overwritten or deleted. The unlock is '
        + 'stamped with your name.';
      const QPB = 'Lock the FYDP window as PB27?\n\nFY27 — every requirement, its value, allocation and funding by service, the PMO roll-up and the '
        + 'budget authority of each year — are copied whole and LOCKED.\n\nFY28, FY29, FY30, FY31 hold no plan yet and will be recorded as such.'
        + '\n\nThis replaces the existing PB27 cycle.\n\nThe working board is not changed.';
      const told = '“cycle.html” was not imported: ' + AT_PB + TWICE + '.\n\n' + RULE + ' ' + NOW + ' ' + CYCLE + ' ' + FULL + ' Nothing on this board was changed.';
      // every question `code` asks, kept and answered yes, and what `out` reads after
      const asked = (ev, code, out) => JSON.parse(ev(`(function(){ var qs=[]; window.confirm=function(q){ qs.push(String(q)); return true; };
        window.alert=function(){}; ${code} return JSON.stringify({qs:qs, out:${out}}); })()`));
      // PB27 as the saved file carries it: [locked, its list]
      const pb27 = file => { const st = JSON.parse(file.match(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/)[1]) || {};
        const c = ((((st.cycDb || {}).byAp || {}).om || {}).cycles || {})['PB|2027']; return c ? [c.locked, c.rcn] : null; };
      for (const way of ['🗑 Delete PB27', '🔒 Lock PB27 over it']) {
        const mk = bootMark();
        const F = make({ asg: 'K1', cyc: [K1, K1] }), T = boot({ html: F.own }); full(T.ev, F.file);
        const R = boot({ html: F.own, ls: lsOf(T.ev) });
        const at = (way === '🗑 Delete PB27' ? 'the user’s own board holding PB27 [K1, K1], taken whole' : 'a second such board') + ' · 🔓 Unlock PB27, ';
        const u = asked(R.ev, `blLock('PB|2027', false);`, `blGet('PB|2027').locked`), sv = R.ev('buildSavedHtml()');
        const P = boot(), hP = lsOf(P.ev), alP = JSON.parse(await one(P.ev, sv)), mvP = moved(hP, lsOf(P.ev));
        w5Chk(name, at + 'then its saved file, ⬅ Import one appropriation on a new board',
          'unlocked, as its question says; the file carries PB27 unlocked, [K1, K1], and is refused whole in words true after it -- never that no board changes the list; browser storage is byte-identical',
          J([u.qs, u.out, pb27(sv), alP, mvP]), J([[UNLOCK], false, [false, [K1, K1]], [told], []]));
        if (way === '🗑 Delete PB27') {
          const d = asked(R.ev, `blDelete('PB|2027');`, `!blGet('PB|2027')`);
          w5Chk(name, at + 'then 🗑 Delete PB27', 'CONTROL (as d66dd60) — asked, and PB27 is gone', J([d.qs, d.out]), J([['Delete the PB27 cycle?\n\nIt cannot be recovered.'], true]));
        } else {
          const c = asked(R.ev, `blCyc='PB'; blYr=2027; cycLock();`, `(function(c){ return c? [c.locked, c.rcn] : null; })(blGet('PB|2027'))`);
          w5Chk(name, at + 'then 🔒 Lock PB27 over it', 'CONTROL (as d66dd60) — asked once, as for any cycle it replaces; PB27 is locked again, its list the working plan’s [K1]',
            J([c.qs, c.out]), J([[QPB], [true, [K1]]]));
          w5Chk(name, at + 'then 🔒 Lock PB27 over it, then PB27 exported', 'GUARD (as d66dd60) — the RCN-EEIC sheet, read from the workbook’s bytes: USAF 900, ANG 200, all services 1,100, each once, under 11111 / AAAAA',
            await sheet(R.w, R.ev, 'PB|2027'), WANT('PB|2027', ON_K1));
        }
        const sv2 = R.ev('buildSavedHtml()'), P2 = boot(), h2 = lsOf(P2.ev), al2 = JSON.parse(await one(P2.ev, sv2)), mv2 = moved(h2, lsOf(P2.ev));
        w5Chk(name, at + 'then ' + way + ', then its saved file written again, ⬅ Import one appropriation on a new board', 'CONTROL (as d66dd60) — taken: the file no longer carries PB27 as it was locked',
          J([pb27(sv2), al2.filter(a => /was not imported/.test(a)), mv2.includes('prio27om')]), J([way === '🗑 Delete PB27' ? null : [true, [K1]], [], true]));
        bootRelease(mk, []); await settleBoards();
      }
    }
    // WHO SAVED THE FILE, AS THE FILE SAYS IT: Codex 1's file naming v1.99 is from an ORBIT before this one, and is told so; a state
    // file (.json) names no version and is said to come from none, and is told only of the way that works for it -- the working
    // plan's list put right, the file saved again -- never of Import a full board or opening it, which take a board .html alone.
    {
      const mk = bootMark();
      const F = make({ asg: 'K1', cyc: [K1, K1] }), T = boot({ html: F.own });
      const old = F.file.replace(/const BUILD='v2\.00[^']*'/, "const BUILD='v1.99 (6 Oct 2026)'");
      const heldO = lsOf(T.ev), alO = JSON.parse(await one(T.ev, old)), mvO = moved(heldO, lsOf(T.ev));
      w5Chk(name, 'a file that says v1.99 saved it · ⬅ Import one appropriation', 'refused whole: an ORBIT before this one took such a list, and the way named works for a locked cycle’s; browser storage is byte-identical',
        J([alO, mvO]), J([['“cycle.html” was not imported: ' + AT_PB + TWICE + '.\n\n' + RULE + ' ' + OLD + ' ' + CYCLE + ' ' + FULL + ' Nothing on this board was changed.'], []]));
      const W = make({ asg: 'K1', plan: [K1, K1] });
      const st = JSON.parse(W.file.match(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/)[1]);
      const heldJ = lsOf(T.ev), alJ = JSON.parse(await one(T.ev, J(st.appns ? st.appns.om : st))), mvJ = moved(heldJ, lsOf(T.ev));
      w5Chk(name, 'a state file (.json) of the working plan’s [K1, K1] · File → Import', 'refused whole: it names no version and is not said to come from one; only the way that works for it is named; browser storage is byte-identical',
        J([alJ, mvJ]), J([['“cycle.html” was not imported: the RCN / EEIC list at the file.rcn holds the key “K1” twice (rcn[0] and rcn[1]); a key names one combination.\n\n'
          + RULE + ' ' + PLAN + ' Nothing on this board was changed.'], []]));
      bootRelease(mk, []); await settleBoards();
    }
    // THE WORKING PLAN'S LIST AS THE FILE HOLDS IT (verification round 5, tests S1). The full import says "RCN / EEIC lists as the file
    // holds them": a list that repeats a key on two codes, or holds an entry that is not one, comes across row for row -- written,
    // reopened, saved and reopened. GUARD: d66dd60 kept them too; a full import that tidied the list would lose a row of the user's own
    // board without a word, and the money would not show it (the first row wins).
    {
      const W1 = '{"rcn":"11111","eeic":"AAAAA","t":"","svc":["USAF","ANG","AFRC"],"k":"K1"}', W2 = '{"rcn":"22222","eeic":"BBBBB","t":"","svc":["USAF","ANG","AFRC"],"k":"K1"}';
      for (const [c, plan, raw] of [['K1 twice, on two codes', [K1, K1b], '[' + W1 + ',' + W2 + ']'], ['“K9”, then K1', ['K9', K1], '["K9",' + W1 + ']'],
        ['the number 0, then K1', [0, K1], '[0,' + W1 + ']'], ['[], then K1', [[], K1], '[[],' + W1 + ']']]) {
        const mk = bootMark(), F = make({ asg: 'K1', plan }), T = boot({ html: F.own }), r = full(T.ev, F.file), after = lsOf(T.ev);
        const R = boot({ html: F.own, ls: after }), R2 = boot({ html: R.ev('buildSavedHtml()') });
        w5Chk(name, 'the working plan’s list holds ' + c + ' · ⬅ Import a full board into the user’s own board', 'GUARD (as d66dd60) — the list is kept as the file holds it: written, the same browser reopened, saved and reopened',
          J([r.ret, J((JSON.parse(after.prio27om || '{}')).rcn), R.ev('JSON.stringify(MS.rcn)'), R2.ev('JSON.stringify(MS.rcn)')]), J([true, raw, raw, raw]));
        bootRelease(mk, []); await settleBoards();
      }
    }
    // a null entry in the working plan's list: every reader of that list stops at it, so even the user's own board is refused for it
    {
      const mk = bootMark();
      const F = make({ asg: 'K1', plan: [null, K1] }), T = boot({ html: F.own });
      const why = 'the RCN / EEIC entry at the saved state.appns.om.rcn[0] is not a combination (“null”); a list holds combinations and nothing else';
      w5Chk(name, 'an entry that is not one · the door', 'a file handed over is refused, saying where', T.ev(`inboundCheck(${J(F.file)})`), why);
      const held = lsOf(T.ev), r = full(T.ev, F.file), mv = moved(held, lsOf(T.ev));
      w5Chk(name, 'an entry that is not one · ⬅ Import a full board', 'refused whole, in true words, and browser storage is byte-identical',
        J([r.ret, r.threw, r.al, r.stat, mv]),
        J([false, '', ['“cycle.html” was not imported: ' + why + '.\n\n' + ENTRY_TAIL + ' Nothing on this board was changed.'], '⚠ Nothing imported — “cycle.html” was refused: ' + why + '.', []]));
      // beside the user's own board file, through ⇊ Import several boards (verification round 6, MF1 of both lenses): the batch adds how
      // many files were not taken to the reason, and the refusal still names no way -- not that the file opens as a board, nor ⬅ Import
      // a full board, which refuses it as above. A file that also carries PB27 [K1, K1] is told of that locked cycle too, and no way.
      const two = (ev, a, b) => ev(`new Promise(function(res){ var al=[]; window.alert=function(m){ al.push(String(m)); };
        window.confirm=function(){ return true; };
        var inp={files:[new File([${J(a)}], 'cycle.html'), new File([${J(b)}], 'a.html')], value:'x'};
        try{ importBoards(inp); }catch(e){ al.push('THREW '+e.message); }
        (function wait(n){ if(inp.value==='' || n>600) return res(JSON.stringify(al)); setTimeout(function(){ wait(n+1); }, 5); })(0); })`);
      const Q = boot(), heldQ = lsOf(Q.ev), alQ = JSON.parse(await two(Q.ev, F.file, F.own)), mvQ = moved(heldQ, lsOf(Q.ev));
      w5Chk(name, 'an entry that is not one · beside the user’s own board file, ⇊ Import several boards', 'the batch is refused whole, naming no way -- not opening the file, nor ⬅ Import a full board, which refuses it; browser storage is byte-identical',
        J([alQ, mvQ]), J([['“cycle.html” was not imported: ' + why + ' (so none of the 2 files was taken).\n\n' + ENTRY_TAIL + ' Nothing on this board was changed.'], []]));
      const F2 = make({ asg: 'K1', plan: [null, K1], cyc: [K1, K1] });
      const Q1 = boot(), held1 = lsOf(Q1.ev), al1 = JSON.parse(await several(Q1.ev, F2.file)), mv1 = moved(held1, lsOf(Q1.ev));
      w5Chk(name, 'an entry that is not one, beside PB27 [K1, K1] · ⇊ Import several boards', 'refused whole, naming the locked cycle too, and no way; browser storage is byte-identical',
        J([al1, mv1]), J([['“cycle.html” was not imported: ' + why + '.\n\n' + ENTRY_TAIL + ' ' + TOO + ' ' + CYCLE_ONLY + ' Nothing on this board was changed.'], []]));
      const Q2 = boot(), held2 = lsOf(Q2.ev), al2 = JSON.parse(await two(Q2.ev, F2.file, F2.own)), mv2 = moved(held2, lsOf(Q2.ev));
      w5Chk(name, 'an entry that is not one, beside PB27 [K1, K1] · beside the user’s own board file, ⇊ Import several boards', 'the batch is refused whole, in the same words; browser storage is byte-identical',
        J([al2, mv2]), J([['“cycle.html” was not imported: ' + why + ' (so none of the 2 files was taken).\n\n' + ENTRY_TAIL + ' ' + TOO + ' ' + CYCLE_ONLY + ' Nothing on this board was changed.'], []]));
      bootRelease(mk, []); await settleBoards();
    }
    // the help for Import one appropriation: which files it refuses, whichever board saved them, and what takes them
    {
      const X = boot();
      w5Chk(name, 'the help · ⬅ Import one appropriation', 'it says a file carrying a locked cycle whose list breaks the rule is refused, whichever board saved it, and what takes it',
        X.ev(`(function(){ var s=helpSections().filter(function(x){ return x.id==='t-one'; })[0]; if(!s) return 'no section';
          var p=[].slice.call(s.el.querySelectorAll('p')).filter(function(p){ return /⬅ Import one appropriation…/.test(p.textContent); })[0]; return p? p.textContent : 'no paragraph'; })()`),
        '📁 File ▾ › Boards and appropriations › ⬅ Import one appropriation… takes appropriations back from any board file. It lists what the file holds and '
          + 'takes only what you name; each one is checked for work this board did meanwhile and previewed before it replaces anything, and its locked '
          + 'cycles come with it. Nothing else on the board changes. A file that carries a locked cycle whose RCN / EEIC list breaks the rule for one — a '
          + 'key repeated, missing, not text or beginning with two underscores, or something in it that is not an entry — is refused, whichever board saved '
          + 'it: a locked cycle’s list stays as it was locked. Such a file opens as a board, and 📁 File ▾ › Boards and appropriations › ⬅ Import a full '
          + 'board (new version)… takes it whole.');
    }
    // the door on the rest of the rule
    {
      const X = boot(), at = 'the RCN / EEIC list at the file.rcn ';
      const door = L => X.ev(`inboundCheck(${J(J({ rcn: L }))})`);
      [[[K1, K2, K1], 'holds the key “K1” twice (rcn[0] and rcn[2]); a key names one combination', 'K1 repeated apart'],
       [[K1, K1, K1], 'holds the key “K1” 3 times (rcn[0], rcn[1] and rcn[2]); a key names one combination', 'K1 three times'],
       [[E('__x', '33333', 'CCCCC')], 'holds the key “__x” (rcn[0]); a key beginning with two underscores is one the board keeps for its own bookkeeping', 'a key beginning with two underscores, not “__none__”'],
       [[E(undefined, '33333', 'CCCCC')], 'holds an entry with no key (rcn[0]); a key is text', 'an entry with no key'],
       [[E(true, '33333', 'CCCCC')], 'holds a key that is not text (rcn[0].k is the value true); a key is text', 'a key that is not text']]
        .forEach(([L, w, c]) => w5Chk(name, 'the door · ' + c, 'refused, saying what the list holds and why', door(L), at + w));
      // keys every object answers to: refused in words, never a throw -- once each by the rule every key value meets, twice as repeated
      const doorT = L => X.ev(`(function(){ try{ return inboundCheck(${J(J({ rcn: L }))}); }catch(e){ return 'threw: '+e.message; } })()`);
      w5Chk(name, 'the door · keys every object answers to, each once', 'CONTROL (as d66dd60) — refused in words, by the rule every key value meets',
        doorT([K1, E('constructor', '33333', 'CCCCC'), E('toString', '44444', 'DDDDD'), E('valueOf', '55555', 'EEEEE')]),
        'the k at the file.rcn[1] is “constructor”, a name the board keeps for itself or every object already answers to');
      w5Chk(name, 'the door · “constructor” twice', 'refused, saying what the list holds and why',
        doorT([E('constructor', '33333', 'CCCCC'), E('constructor', '44444', 'DDDDD')]),
        at + 'holds the key “constructor” twice (rcn[0] and rcn[1]); a key names one combination');
    }
    // a full import that stops early -- the file is not a board, or the answer is no -- leaves nothing behind: the next file handed
    // over is held to the whole rule
    {
      const mk = bootMark();
      const F = make({ asg: 'K1', cyc: [K1, K1] }), T = boot({ html: F.own });
      const al = T.ev(`(function(){ var al=[]; window.alert=function(m){ al.push(String(m).split('\\n')[0]); }; fullImportText('{"x":1}', 'notes.json'); return JSON.stringify(al); })()`);
      w5Chk(name, 'after ⬅ Import a full board of a file that is not a board', 'it says so, and the next file handed over is refused for K1 twice',
        J([al, T.ev(`inboundCheck(${J(F.file)})`)]), J([J(['“notes.json” is not a board file.']), AT_PB + TWICE]));
      T.ev(`window.confirm=function(){ return false; }; window.alert=function(){}; fullImportText(${J(F.file)}, 'cycle.html'); 'ok'`);
      w5Chk(name, 'after ⬅ Import a full board answered no', 'the next file handed over is refused for K1 twice', T.ev(`inboundCheck(${J(F.file)})`), AT_PB + TWICE);
      bootRelease(mk, []); await settleBoards();
    }
    // the team's own copies: a copy in the shared folder and the sidecar were written by a board -- a list an earlier ORBIT took
    // and saved is read as it is, never refused (refused, every later Save to the folder was refused and the work stayed unsaved)
    {
      const mk = bootMark();
      const F = make({ asg: 'K1', plan: [K1, K1] }), T = boot({ html: F.own });
      const st = JSON.parse(F.file.match(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/)[1]), om = st.appns ? st.appns.om : st;
      const copy = J({ store: om, by: 'Teammate', ts: 1 });
      w5Chk(name, 'the team’s own copies · the shared folder’s', 'CONTROL (d66dd60 has no list rule) — read, its list [K1, K1] as a board saved it',
        T.ev(`(function(){ try{ return JSON.stringify(driveParse(${J(copy)}).store.rcn.map(function(e){ return e.k; })); }catch(e){ return 'threw: '+e.message; } })()`), J(['K1', 'K1']));
      w5Chk(name, 'the team’s own copies · the same text, handed over', 'refused', T.ev(`inboundCheck(${J(copy)})`),
        'the RCN / EEIC list at the file.store.rcn holds the key “K1” twice (rcn[0] and rcn[1]); a key names one combination');
      w5Chk(name, 'the team’s own copies · the sidecar beside the board', 'CONTROL (d66dd60 has no list rule) — read, its list [K1, K1] as a board saved it',
        await T.ev(`new Promise(function(res){ var f0=window.fetch; window.fetch=function(){ return Promise.resolve({ok:true, text:function(){ return Promise.resolve(${J(J(om))}); }}); };
          loadShared(function(s){ window.fetch=f0; res(s && s.rcn? JSON.stringify(s.rcn.map(function(e){ return e.k; })) : String(s)); }); })`), J(['K1', 'K1']));
      // a list holding null, then K1, which even the user's own board is refused for: the team's copies are read as before all the same
      const Fn = make({ asg: 'K1', plan: [null, K1] }), Tn = boot({ html: Fn.own });
      const stn = JSON.parse(Fn.file.match(/<script type="application\/json" id="pubState">([\s\S]*?)<\/script>/)[1]), omn = stn.appns ? stn.appns.om : stn;
      w5Chk(name, 'the team’s own copies, null then K1 · the shared folder’s', 'CONTROL (as d66dd60) — read, its list [null, K1] as a board saved it',
        Tn.ev(`(function(){ try{ return JSON.stringify(driveParse(${J(J({ store: omn, by: 'Teammate', ts: 1 }))}).store.rcn.map(function(e){ return e && e.k; })); }catch(e){ return 'threw: '+e.message; } })()`), J([null, 'K1']));
      w5Chk(name, 'the team’s own copies, null then K1 · the sidecar beside the board', 'CONTROL (as d66dd60) — read, its list [null, K1] as a board saved it',
        await Tn.ev(`new Promise(function(res){ var f0=window.fetch; window.fetch=function(){ return Promise.resolve({ok:true, text:function(){ return Promise.resolve(${J(J(omn))}); }}); };
          loadShared(function(s){ window.fetch=f0; res(s && s.rcn? JSON.stringify(s.rcn.map(function(e){ return e && e.k; })) : String(s)); }); })`), J([null, 'K1']));
      bootRelease(mk, []); await settleBoards();
    }
    // ✕ on a row that repeats a key: the list [K1 11111 / AAAAA, K1 22222 / BBBBB], R1 on K1 -- which the board shows as 11111 / AAAAA
    {
      const mk = bootMark();
      const FR = make({ asg: 'K1', plan: [K1, K1b] }), O = boot({ html: FR.file });
      w5Chk(name, 'a row that repeats a key · the RCN / EEIC panel', 'the second row says it repeats the first; the first is used by R1',
        O.ev(`(function(){ rcnOpen=true; render(); return JSON.stringify([].slice.call(document.querySelectorAll('#rcnBody tr')).slice(1).map(function(tr){ return tr.cells[6].textContent; })); })()`),
        J(['1', '⚠ repeats row 1']));
      w5Chk(name, 'a row that repeats a key · ✕ on row 2', 'that row alone goes, R1 stays on K1 (11111 / AAAAA, where the board showed it), and the question says so',
        O.ev(`(function(){ var qs=[]; window.confirm=function(q){ qs.push(String(q)); return true; }; rcnDel(1);
          return JSON.stringify({qs:qs, list:rcnReg().map(function(e){ return [e.k, e.rcn]; }), r1:rcnAsgOf('R1'), label:rcnLabel(rcnAsgOf('R1'))}); })()`),
        J({ qs: ['Remove RCN 22222 / EEIC BBBBB?\n\nIt has the same key as row 1 (11111 / AAAAA), and every assignment to that key reads row 1, which stays. No assignment is changed.'],
          list: [['K1', '11111']], r1: 'K1', label: ON_K1 }));
      const OR = boot({ html: FR.file, ls: lsOf(O.ev) });
      w5Chk(name, 'a row that repeats a key · ✕ on row 2, the same browser reopened', 'saved: the list is [K1 11111 / AAAAA] and R1 is still on K1',
        OR.ev(`JSON.stringify({list:rcnReg().map(function(e){ return [e.k, e.rcn]; }), r1:rcnAsgOf('R1')})`), J({ list: [['K1', '11111']], r1: 'K1' }));
      const O1 = boot({ html: make({ asg: 'K1', plan: [K1, K1b] }).file });
      w5Chk(name, 'a row that repeats a key · ✕ on row 1', 'CONTROL (as d66dd60) — row 1 goes, and every assignment to K1 is cleared, as the question says: none is moved onto row 2’s codes',
        O1.ev(`(function(){ var qs=[]; window.confirm=function(q){ qs.push(String(q)); return true; }; rcnDel(0);
          return JSON.stringify({qs:qs, list:rcnReg().map(function(e){ return [e.k, e.rcn]; }), r1:rcnAsgOf('R1')}); })()`),
        J({ qs: ['Remove RCN 11111 / EEIC AAAAA?\n\n1 assignment (requirements, services and CLINs) point at it across all fiscal years. Every one is cleared -- none is left pointing at something that no longer exists.'],
          list: [['K1', '22222']], r1: '' }));
      bootRelease(mk, []); await settleBoards();
    }
    // Add RCN / EEIC twice in one millisecond, the first removed, then once more in the same millisecond
    {
      const X = boot();
      seed(X.ev, { services: SV, items: [it('R1', 'AV', [900, 200, 0])], disc: [5000, 5000, 5000], mand: [0, 0, 0], order: ['R1'] });
      const k = JSON.parse(X.ev(`(function(){ var _n=Date.now; Date.now=function(){ return 1760000000000; }; window.confirm=function(){ return true; };
        MS.rcn=[]; rcnAdd(); rcnAdd(); var kept=rcnReg()[1].k; rcnDel(0); rcnAdd(); Date.now=_n;
        return JSON.stringify({kept:kept, keys:rcnReg().map(function(e){ return e.k; })}); })()`));
      w5Chk(name, 'Add RCN / EEIC', 'two entries, two keys: the one kept keeps its key and the new one has a key of its own',
        J([k.keys.length, new Set(k.keys).size, k.keys[0] === k.kept]), J([2, 2, true]));
      const k4 = JSON.parse(X.ev(`(function(){ var _n=Date.now; Date.now=function(){ return 1760000000000; }; window.confirm=function(){ return true; };
        MS.rcn=[]; rcnAdd(); rcnAdd(); rcnAdd(); rcnAdd(); rcnDel(0); rcnDel(0); rcnAdd(); Date.now=_n;
        return JSON.stringify(rcnReg().map(function(e){ return e.k; })); })()`));
      w5Chk(name, 'Add RCN / EEIC, two keys in use', 'four added in one millisecond, the first two removed, one more: three entries, three keys',
        J([k4.length, new Set(k4).size]), J([3, 3]));
    }
  } catch (e) {
    failures.push({ scenario: name, where: 'harness', what: 'the block threw: ' + String((e && e.message) || e).slice(0, 160), got: 'threw', want: 'ran' });
  }
  bootRelease(__bm, []);
  await settleBoards();
})();
// ==== end v2.00 (U32, U33) ====
{
  const src = _selfRead(_selfPath(import.meta.url), 'utf8');
  const named = [...src.matchAll(/^  const name = '([^']+)'/gm)].map(m => m[1]);   // a scenario's own line, never this one
  // A name built by concatenation ('convert to split — ' + label) is heard only in its finished
  // forms, so a literal that any heard scenario STARTS WITH has run. A dead block's literal has none.
  named.forEach(n => { if (![...SEEN].some(s => s === n || s.startsWith(n))) failures.push({ scenario: n, where: 'harness',
    what: 'this scenario never ran — is its block after process.exit()?', got: 'never ran', want: 'ran' }); });
}
console.log('\n' + '='.repeat(96));
if (!failures.length) { console.log('ALL CHECKS PASSED'); process.exit(0); }
const by = {};
failures.forEach(f => { const k = f.scenario + ' | ' + f.where; (by[k] ||= []).push(f); });
console.log(`${failures.length} FAILING CHECK(S)\n`);
for (const [k, fs] of Object.entries(by)) {
  console.log(`--- ${k}`);
  fs.forEach(f => console.log(`    ${f.what}\n        got ${f.got}   want ${f.want}`));
}
process.exit(1);
