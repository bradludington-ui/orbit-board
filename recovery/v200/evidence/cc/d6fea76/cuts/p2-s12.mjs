// PART 2 OF A FOCUSED HARNESS (mksplit8.py from h-cycreg.mjs): audit-recon preamble helpers, the blocks v2.00 (U32, U33) and the guard, VERBATIM from /tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L8/cc/d6fea76/after/tools/export-audit/audit-recon.mjs
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
