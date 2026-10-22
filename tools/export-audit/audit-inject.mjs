// INJECTED TEXT IS DRAWN AS TEXT (v2.00, item 99). A regression suite for the confirmed injection
// holes a security review of v1.99 found: values an imported board, package, workbook or peer file
// carries that reached the page as HTML without esc(), so a crafted file could run its own script.
//
// Four kinds of check, and each says which it is:
//  - a RUNTIME DRAW plants one hostile value in the exact state field the finding names, renders the surface that
//    draws it, and asks: did the payload become an ELEMENT (markup, or an attribute it broke out of), or an inline
//    handler that CALLS it? None of these surfaces draws an <img> or a __pw() call of its own, so either is proof the
//    value ran;
//  - a PROBE drives one structural guard (the import check, a merge, a path or link rule) with the input it refuses;
//  - a SOURCE PIN asserts the escaped form of a sink deep inside a panel render is in the board source. A pin proves the
//    fix is present; it is not a runtime draw, and no other suite plants these fields;
//  - the KEY checks (K1-K6, from the key sweep) drive the board's own functions with names every object already
//    answers to (toString, __proto__ ...) and ask that nothing reaches Object.prototype and every dollar is counted.
//
// The payload is the review's own marker, carrying all three break-outs:
//   <text>'"><img src=x onerror=__pw('<tag>')>');__pw('<tag>');//
// Run against the FIXED board every value draws as text: 0 injected. Run against the v1.99 board
// (`BOARD=…/board199.html node tools/export-audit/audit-inject.mjs`) the same values inject — which
// is the fail-before half the security team watches turn green.
//
//   node tools/export-audit/audit-inject.mjs
import { boot, seed, bootMark, bootRelease, stopAtFirstFailure, BOARD } from './boot.mjs';
import { readFileSync } from 'node:fs';

const P = t => `${t}'"><img src=x onerror=__pw('${t}')>');__pw('${t}');//`;

let failures = [];
stopAtFirstFailure(failures);
const SEEN = new Set();
const chk = (finding, what, got, want) => {
  SEEN.add(finding);
  if (String(got) !== String(want)) failures.push({ finding, what, got: String(got), want: String(want) });
};

// A standard little board most findings can be planted on.
const SC = { services: ['USAF', 'ANG'],
  items: [{ id: 'R0', grp: 'AV', team: 'AV', sect: '', custom: false, title: 'T0', event: 'E0',
    ccar: 'J1', fy26: [0, 0], ask: [900000, 200000], alloc: null }],
  disc: [1200000, 300000], mand: [300000, 80000], order: ['R0'], mc: { R0: true } };

// The detector, installed in the page: draw an HTML string into a scratch node and report whether the
// payload became live (an <img> element, or any on* attribute that calls __pw), and whether it was
// drawn at all (the marker text reached the node in some form).
const INSTALL = `
  window.__pw = function(){ window.__PWNED = (window.__PWNED||0)+1; };
  window.__scan = function(node){
    var live = node.getElementsByTagName('img').length > 0;
    if(!live){ var all = node.getElementsByTagName('*');
      for(var i=0;i<all.length && !live;i++){ var el=all[i];
        for(var j=0;j<el.attributes.length;j++){ var a=el.attributes[j];
          if(/^on/i.test(a.name) && a.value.indexOf('__pw')>=0){ live=true; break; } } } }
    return { live: live, drawn: node.innerHTML.indexOf('onerror')>=0 || node.innerHTML.indexOf('__pw')>=0 };
  };
  // draw(htmlExpr): evaluate a function that returns an HTML string, put it in a scratch div, scan it.
  window.__draw = function(html){ var d=document.createElement('div'); d.innerHTML=html; return window.__scan(d); };
  // show(id): scan an existing container a panel wrote into.
  window.__show = function(id){ var el=document.getElementById(id); return el? window.__scan(el) : {live:false, drawn:false, missing:true}; };
  'ok';`;

function fresh(extra) {
  const B = boot({ quiet: true });
  seed(B.ev, SC);
  B.ev(INSTALL);
  if (extra) B.ev(extra);
  return B;
}

// A display finding: run `expr` (sets up state and returns the surface's HTML, or '' after writing a
// container named by `container`). The payload must NOT be live. `drawn:true` (the default) also
// asserts the value reached the page as text; coercion fixes (a year, a count) deliberately reduce a
// hostile string to a number and so draw nothing — those pass `drawn:false`.
function display(finding, surface, exprOrContainer, { container = null, pre = null, drawn = true } = {}) {
  const B = fresh(pre);
  let r;
  try {
    if (container) { B.ev(exprOrContainer); r = JSON.parse(B.ev(`JSON.stringify(window.__show(${JSON.stringify(container)}))`)); }
    else r = JSON.parse(B.ev(`JSON.stringify(window.__draw(${exprOrContainer}))`));
  } catch (e) { r = { live: false, drawn: false, threw: e.message }; }
  if (r.threw) { SEEN.add(finding); failures.push({ finding, what: `${surface} threw: ${r.threw}`, got: 'threw', want: 'drew' }); }
  else {
    if (drawn) chk(finding, `${surface}: the value is drawn`, r.drawn, true);
    chk(finding, `${surface}: and it is text, not live`, r.live, false);
  }
  return B;
}

// A structural finding evaluates a probe that returns JSON. If the probe throws or a guard it needs
// is absent (as on a board from before the fix), that is itself the failure — the guard is not there.
function probe(B, finding, expr) {
  try { return JSON.parse(B.ev(expr)); }
  catch (e) { SEEN.add(finding); failures.push({ finding, what: `the guard is absent or threw: ${e.message}`.slice(0, 160), got: 'threw', want: 'guarded' }); return null; }
}

const bm = bootMark();

// ---- A1a — package sender and name in the status line (pkgApply) ---------------------------------
// The review's headline finding: two sinks. The success line names the sender (pkg.by) and the
// appropriation; the Cancel line names the appropriation — and with a code the board does not know,
// nm is the file's own text. Both are driven through the board's own pkgApply.
display('A1a package sender and name (pkgApply status lines)', 'status line after a package loads',
  `(function(){ window.confirm=function(){ return true; }; window.alert=function(){};
     var ms=JSON.parse(JSON.stringify(pkgStoreOf(mySlug())||MS));
     pkgApply({ spmtPkg:PKG_VER, dir:'issue', ap:mySlug(), by:${JSON.stringify(P('a1aby'))}, seq:1, ms:ms }, 'p.json');
     return ''; })()`,
  { container: 'shareStat' });
// The Cancel line: a package naming an appropriation this board does not have is refused before any line names it
// (its code is a key - PUBS, _SLUGMAP, the ledger - and __proto__ handed back Object.prototype as the store).
{
  const B = fresh();
  const out = probe(B, 'A1a package sender and name (pkgApply status lines)', `(function(){
    var alerts=[]; window.alert=function(m){ alerts.push(String(m)); }; window.confirm=function(){ return false; };
    var el=document.getElementById('shareStat'); if(el) el.innerHTML='';
    var r1=pkgApply({ spmtPkg:PKG_VER, dir:'issue', ap:${JSON.stringify(P('a1aap'))}, seq:1, ms:{ years:{} } }, 'p.json');
    var s=window.__show('shareStat');
    var r2=pkgApply({ spmtPkg:PKG_VER, dir:'issue', ap:'__proto__', seq:1, ms:{ years:{} } }, 'p.json');
    return JSON.stringify({ r1:r1, r2:r2, live:s.live, refused:alerts.filter(function(m){ return /does not have/.test(m); }).length,
      polluted: ({}).sync!==undefined }); })()`);
  if (out) {
    chk('A1a package sender and name (pkgApply status lines)', 'a package naming an unknown appropriation is not imported', out.r1, false);
    chk('A1a package sender and name (pkgApply status lines)', 'and no status line carries its text as markup', out.live, false);
    chk('A1a package sender and name (pkgApply status lines)', 'both unknown codes are refused, and say why', out.refused, 2);
    chk('A1a package sender and name (pkgApply status lines)', 'a package naming __proto__ does not write onto Object.prototype', out.polluted, false);
  }
}

// ---- A1b — ledger sequence in the Packages panel --------------------------------------------------
display('A1b ledger seq (pkgBody)', 'Appropriation Packages panel',
  `(function(){ var st=pkgStoreOf(mySlug())||MS; st.sync={seq:${JSON.stringify(P('seqA1b'))}, state:'out', issuedBy:'x'};
     pkgOpen=true; try{ pkgBody(); }catch(e){} return ''; })()`,
  { container: 'pkgBody' });

display('A1b ledger seq (pkgBody)', 'the Issue status line',
  `(function(){ window.confirm=function(){ return true; }; window.alert=function(){};
     var st=pkgStoreOf(mySlug())||MS; st.sync={seq:${JSON.stringify(P('seqA1bi'))}, state:'in'};
     pkgIssue(mySlug(), true); return ''; })()`,
  { container: 'shareStat' });

// ---- A3a — change-journal size marker -------------------------------------------------------------
display('A3a journal size marker (jrnlShow)', 'Change journal',
  `jrnlShow({_b:${JSON.stringify(P('a3a'))}})`);

// ---- A3b — locked-cycle name (blLbl) --------------------------------------------------------------
display('A3b locked-cycle name (blLbl)', 'cycle label',
  `blLbl(${JSON.stringify(P('a3b') + '|2027')})`);

// ---- A3d — snapshot execution counts (posExecLine) ------------------------------------------------
display('A3d snapshot exec counts (posExecLine)', 'Snapshots',
  `posExecLine({fy:2027, exec:{imported:true, read:${JSON.stringify(P('a3d'))}, asOf:'x', uniq:1, shared:0, none:0}})`);
display('A3d snapshot exec counts (posExecLine)', 'Snapshots, the per-requirement counts',
  `posExecLine({fy:2027, exec:{imported:true, read:1, asOf:'x', uniq:${JSON.stringify(P('a3du'))}, shared:${JSON.stringify(P('a3ds'))}, none:${JSON.stringify(P('a3dn'))}}})`);

// ---- A3i — PPBE position / Spruills funding note (ppLbl) -------------------------------------------
display('A3i ppbe cycle note (ppLbl)', 'PPBE positions / Spruills',
  `ppLbl(${JSON.stringify(P('a3i') + '|2027')})`);

// The other display sinks (A3e buys, A3f lane title, A3g award id, A3h funds-flow label and FYs, A3j budget list,
// A4 execution office, A5 live peers, A6 destination keys) sit deep inside panel renders. Each is pinned to its
// escaped form in the board source below, which fails on a board that draws it raw. (The first candidate, 608444e, also
// had runtime checks for these sinks that built their own escaped markup instead of calling the board; they passed on
// any board and proved nothing. 608444e was gated with them; they were removed in 23a18ee on 8 Oct, before any later
// candidate was gated.)

// ---- A3c — budget year kept as text: numbers on load fixes every sink at once ----------------------
// normalizeStore must turn a non-numeric year into a number, so the year sinks (rlgBody, ppBody, IDS)
// cannot carry markup. Prove the coercion: a store whose cur/base are hostile strings loads as numbers.
{
  const B = fresh();
  const out = probe(B, 'A3c year as text (normalizeStore)', `(function(){
    var raw = normalizeStore({ base:${JSON.stringify(P('a3cBase'))}, cur:${JSON.stringify(P('a3cCur'))},
      years:{'2027': JSON.parse(JSON.stringify(S)) } });
    return JSON.stringify({ curT: typeof raw.cur, baseT: typeof raw.base, cur: raw.cur, base: raw.base }); })()`);
  if (out) {
    chk('A3c year as text (normalizeStore)', 'MS.cur loads as a number', out.curT, 'number');
    chk('A3c year as text (normalizeStore)', 'MS.base loads as a number', out.baseT, 'number');
  }
}

// ---- A3g (door) — a plan with no order list is still shape-checked ---------------------------------
{
  const B = fresh();
  const out = probe(B, 'A3g plan without order (inboundCheck)', `(function(){
    var plan = { discSvc:[0,0], mandSvc:[0,0], alloc:{}, custom:[{ id:${JSON.stringify(P('a3gdoor'))}, grp:'AV',
      team:'AV', sect:'', custom:true, title:'x', ask:[0,0], fy26:[0,0] }] };   // note: NO order array
    var store = { base:2027, cur:2027, years:{ '2027': plan } };
    return JSON.stringify({ why: inboundCheck(JSON.stringify(store)) || '' }); })()`);
  if (out) chk('A3g plan without order (inboundCheck)', 'the hostile custom id is refused at the door', /id may not carry|not a requirement id|requirement id/.test(out.why), true);
}

// ---- D1 — journal Put back may not walk through __proto__ ------------------------------------------
{
  const B = fresh();
  const out = probe(B, 'D1 journal __proto__ path (jrnlSet)', `(function(){
    var ok = jrnlSet(MS.cur, ['__proto__','__pwnD1'], 'PWNED');
    return JSON.stringify({ ret: ok, polluted: ({}).__pwnD1==='PWNED' }); })()`);
  if (out) {
    chk('D1 journal __proto__ path (jrnlSet)', 'the write through __proto__ is refused', out.ret, false);
    chk('D1 journal __proto__ path (jrnlSet)', 'Object.prototype is not polluted', out.polluted, false);
  }
}

// ---- D1 (door) — the import check refuses a change-journal entry whose path names one of those fields --
// The key check in inWalk sees object keys only; a journal entry names its field as text in a path array.
{
  const B = fresh();
  const out = probe(B, 'D1 journal __proto__ path (import check)', `(function(){
    var store = { base:2027, cur:2027, years:{ '2027': JSON.parse(JSON.stringify(S)) },
      jrnl:[ { t:1, p:['__proto__','pwnD1door'], b:0, a:1 } ] };
    return JSON.stringify({ why: inboundCheck(JSON.stringify(store)) || '' }); })()`);
  if (out) chk('D1 journal __proto__ path (import check)', 'a journal entry whose path walks through __proto__ is refused at the door', /change journal entry/.test(out.why), true);
}

// ---- D2 — a package whose sequence is not a number is refused, not silently merged -----------------
{
  const B = fresh();
  const out = probe(B, 'D2 stale-package text sequence (pkgApply)', `(function(){
    var alerts=[]; window.alert=function(m){ alerts.push(String(m)); }; window.confirm=function(){ return true; };
    var ap=mySlug();
    var r; try{ r = pkgApply({ spmtPkg:PKG_VER, dir:'return', ap:ap, seq:'3x', ms:{ sync:{} }, by:'x' }, 'old.json'); }catch(e){ r='THREW '+e.message; }
    return JSON.stringify({ ret: r, saidNotANumber: alerts.some(function(m){ return /not a number/.test(m); }) }); })()`);
  if (out) {
    chk('D2 stale-package text sequence (pkgApply)', 'a non-numeric sequence is refused', out.ret, false);
    chk('D2 stale-package text sequence (pkgApply)', 'and the refusal says why', out.saidNotANumber, true);
  }
}

// ---- D3 retired in v2.04 (item 110): the Confluence and SharePoint transports are gone, and confSameHost with them -----------
// Brad, 22 Oct 2026: "Let's remove the confluence and SharePoint option entirely." What stands in D3's place: no network
// transport but the JSON endpoint is offered, nothing of the two is left to call, and a machine set up for either opens on
// the shared folder, OFF -- so nothing starts sending anywhere by itself -- and is told why.
{
  const B = fresh();
  const out = probe(B, 'v2.04 items 110-111 — Confluence, SharePoint and the JSON endpoint removed', `(function(){
    var modes=LIVE_MODES.map(function(m){ return m.k; }).join(',');
    var gone=['confSameHost','confPublish','confPoll','spPublish','spPoll','spDigest','liveNet','liveHdrs','liveKey','liveSetKey'].filter(function(n){ try{ return typeof eval(n)==='function'; }catch(e){ return false; } });
    var got=[];
    ['conf','sp','json'].forEach(function(m){
      localStorage.setItem(LIVE_KEY_LS, 'a-key-for-'+m);
      localStorage.setItem(LIVE_CFG_LS, JSON.stringify({mode:m, url:'https://wiki.example.com', on:true, every:30}));
      _liveCfg=null; var c=liveCfg();
      liveOpen=true; try{ liveBody(); }catch(e){}
      var h=(document.getElementById('liveBody')||document.body).innerHTML;
      got.push([c.mode, c.on, /option was removed in v2\\.04/.test(h), localStorage.getItem(LIVE_KEY_LS)===null].join(' '));
      liveOpen=false; });
    localStorage.removeItem(LIVE_CFG_LS); _liveCfg=null;
    return JSON.stringify({modes:modes, gone:gone.join(','), got:got}); })()`);
  if (out) {
    const N = 'v2.04 items 110-111 — Confluence, SharePoint and the JSON endpoint removed';
    chk(N, 'the live view offers the shared folder only', out.modes, 'drive');
    chk(N, 'nothing of the three transports, the network client or the key is left to call', out.gone, '');
    chk(N, 'a machine set up for Confluence, SharePoint or an endpoint opens on the shared folder, OFF, is told why, and its key is gone',
      JSON.stringify(out.got), JSON.stringify(['drive false true true', 'drive false true true', 'drive false true true']));
  }
}

// ---- found by the full sweep of the board (8 Oct) ----------------------------------------------------
// N2 — the reprogramming merge keys rows by id in a plain object; an id of __proto__ must not write onto Object.prototype
{
  const B = fresh();
  const out = probe(B, 'N2 reprogramming merge keys (rpMerge)', `(function(){
    var res=rpMerge({ entries:[ { id:'__proto__', ts:9e12, pwnRp:'PWNED' } ], gone:{ '__proto__':1 } });
    return JSON.stringify({ polluted: ({}).pwnRp==='PWNED', added: res.added+res.updated }); })()`);
  if (out) {
    chk('N2 reprogramming merge keys (rpMerge)', 'a folder or imported entry with id __proto__ does not pollute Object.prototype', out.polluted, false);
    chk('N2 reprogramming merge keys (rpMerge)', 'and it is refused, not merged as a row', out.added, 0);
  }
}
// N3 — the companion link opens a file, a path or a web page, never a script URL that happens to end in .html
{
  const B = fresh();
  const out = probe(B, 'N3 companion link scheme (linkOpenable)', `JSON.stringify({
    js: linkOpenable('javascript:alert(1)//x.html'), data: linkOpenable('data:text/html,x.html'),
    name: linkOpenable('Tool.html'), drive: linkOpenable('C:\\\\Tools\\\\Tool.html'), file: linkOpenable('file:///C:/Tools/Tool.html'),
    web: linkOpenable('https://host.example/Tool.html') })`);
  if (out) {
    chk('N3 companion link scheme (linkOpenable)', 'a javascript: link is refused', out.js, false);
    chk('N3 companion link scheme (linkOpenable)', 'a data: link is refused', out.data, false);
    chk('N3 companion link scheme (linkOpenable)', 'a plain .html name still opens', out.name, true);
    chk('N3 companion link scheme (linkOpenable)', 'a full Windows path still opens', out.drive, true);
    chk('N3 companion link scheme (linkOpenable)', 'a file:// address still opens', out.file, true);
    chk('N3 companion link scheme (linkOpenable)', 'an https address still opens', out.web, true);
  }
}
// A3g (door, list) — a store whose years is a LIST is checked as plans too
{
  const B = fresh();
  const out = probe(B, 'A3g plan without order (inboundCheck)', `(function(){
    var plan = { discSvc:[0,0], mandSvc:[0,0], alloc:{}, custom:[{ id:${JSON.stringify(P('a3glist'))}, grp:'AV',
      team:'AV', sect:'', custom:true, title:'x', ask:[0,0], fy26:[0,0] }] };
    var ys=[]; ys[2027]=plan;
    return JSON.stringify({ why: inboundCheck(JSON.stringify({ base:2027, cur:2027, years:ys })) || '' }); })()`);
  if (out) chk('A3g plan without order (inboundCheck)', 'a hostile id in a plan under a years LIST is refused at the door', /id may not carry|not a requirement id|requirement id/.test(out.why), true);
}

// E2 (typed) — an office or service name typed into the board follows the rule a name read from a file does
{
  const B = fresh();
  const out = probe(B, 'E2 typed office and service names (pmoAdd, pmoRename, svcAdd, svcRen)', `JSON.stringify({
    markup: inNameWhy(${JSON.stringify('x"><img src=x>')}, 'The office name'), proto: inNameWhy('__proto__', 'The office name'),
    method: inNameWhy('toString', 'The office name'), ok: inNameWhy('O&M Ops', 'The office name') })`);
  if (out) {
    chk('E2 typed office and service names (pmoAdd, pmoRename, svcAdd, svcRen)', 'a name with quotes or < > is refused', !!out.markup, true);
    chk('E2 typed office and service names (pmoAdd, pmoRename, svcAdd, svcRen)', 'a name that is an object key of Object.prototype is refused', !!out.proto, true);
    chk('E2 typed office and service names (pmoAdd, pmoRename, svcAdd, svcRen)', 'a name that is a method every object has (toString) is refused', !!out.method, true);
    chk('E2 typed office and service names (pmoAdd, pmoRename, svcAdd, svcRen)', 'an ordinary name with & is taken', out.ok, '');
  }
  const src = readFileSync(BOARD, 'utf8');
  chk('E2 typed office and service names (pmoAdd, pmoRename, svcAdd, svcRen)', 'all four prompts apply the rule',
    (src.match(/const why=inNameWhy\(v, 'The (office|service) name'\);/g) || []).length, 4);
}

// ---- found by the key sweep (8-9 Oct): THE NAMES EVERY OBJECT ALREADY ANSWERS TO -------------------
// A name Object.prototype carries (toString, constructor, hasOwnProperty, __proto__ ...) used as a key on an ordinary
// object reads back the built-in, and a write through it lands on every object in the page. The import check refuses
// them as fields, ids and names; the maps that group workbook rows and estimate lines by title, office, month, service
// or cost element have no prototype. Each check drives the board's own function with those names and asks that
// nothing is written onto Object.prototype, nothing throws, and every dollar is still counted.
const POLLUTED = `['tot','obl','ob','pl','n','ev','m','titles','vAll','vFile','2027','d','u','disc','mand','mc','ask','alloc','fund','call','pwnRp']
  .filter(function(k){ return ({})[k]!==undefined; }).join(',')`;
const XROW = (ym, title, amt, pmo) => `(function(){ var r=[]; for(var i=0;i<26;i++) r.push(''); r[1]=${JSON.stringify(ym)}; r[2]='J1';
  r[3]=${JSON.stringify(title)}; r[4]='USAF X'; r[7]='EV '+${JSON.stringify(title)}; r[9]=${amt};
  r[10]='Not Allocated'; r[18]=${JSON.stringify(pmo || 'Office (AV)')}; return r; })()`;   // not yet obligated, so the UPL scan groups it too
const XROWS = '[' + [XROW('2027-01', '__proto__', 1000), XROW('', 'constructor', 2000), XROW('2027-02', 'toString', 3000),
  XROW('2027-03', 'Plain', 4000, 'Office (__proto__)'), XROW('__proto__', 'hasOwnProperty', 5000)].join(',') + ']';
{
  const B = fresh();
  const out = probe(B, 'K1 built-in names at the import check (inboundCheck)', `JSON.stringify({
    key: inboundCheck(JSON.stringify({ a:{ toString:1 } })),
    id: inboundCheck(JSON.stringify({ services:['USAF'], items:[{ id:'valueOf', ask:[1] }] })),
    name: inboundCheck(JSON.stringify({ pmos:['hasOwnProperty'] })),
    pmo: inboundCheck(JSON.stringify({ spmtPkg:1, dir:'submit', pmo:'__proto__', items:{} })),
    ok: inboundCheck(JSON.stringify({ services:['USAF'], items:[{ id:'R1', grp:'AV', ask:[1] }], pmos:['AV','O&M Ops'], note:'constructor' })),
    order: inboundCheck(JSON.stringify({ order:['valueOf'], discSvc:[1] })),
    pmoChars: inboundCheck(JSON.stringify({ spmtPkg:1, dir:'submit', pmo:'A<b>V', items:{} })),
    every: Object.getOwnPropertyNames(Object.prototype).every(function(n){ return IN_KEY_BAD.has(n); }) })`);
  if (out) {
    const F = 'K1 built-in names at the import check (inboundCheck)';
    chk(F, 'a field named toString is refused', !!out.key, true);
    chk(F, 'a requirement id valueOf is refused', !!out.id, true);
    chk(F, 'an office name hasOwnProperty is refused', !!out.name, true);
    chk(F, 'a submittal from office __proto__ is refused', !!out.pmo, true);
    // v2.00 correction (11 Oct): the id and pmo above sit in fields IN_VAL_KEYS also refuses, so each is refused even with
    // the rule it is named for removed (v200-id-builtin-open and v200-spmt-pmo-open were not caught). These two reach only
    // that rule: a plan's priority order holds bare ids, which only inIdWhy reads; a submittal's office carrying markup is
    // a name IN_VAL_KEYS lets through, which only inNameWhy at the submittal refuses.
    chk(F, 'a requirement id valueOf in a plan\'s priority order is refused as an id',
      /\.order\[0\] “valueOf” is a name every object already answers to, so no board uses it as an id$/.test(out.order), true);
    chk(F, 'a submittal from an office whose name carries markup is refused as a name',
      /the office at .*\.pmo “A<b>V” contains a character a name may not carry/.test(out.pmoChars), true);
    chk(F, 'an ordinary file (and a note that merely reads "constructor") still imports', out.ok, '');
    chk(F, 'the rule covers every name this browser\'s Object.prototype carries', out.every, true);
  }
}
{
  const F = 'K2 execution rows keyed by title, office and month (exAgg, rlgExecYears, rlgCapacity, rlgUplScan, rlgPool, posExec)';
  const B = fresh();
  const out = probe(B, F, `(function(){ var rows=${XROWS}; EXDB.all={}; EXDB.all[mySlug()]={rows:{2027:rows}};
    var o={};
    try{ var a=exAgg({rows:{2027:rows}}, 2027), t=0;
      Object.keys(a.byP).forEach(function(g){ Object.keys(a.byP[g].titles).forEach(function(k){ t+=a.byP[g].titles[k].tot; }); });
      o.exTot=a.tot; o.exTitles=t; }catch(e){ o.exThrew=e.message; }
    try{ rlgExecYears(); rlgCapacity(2027); rlgUplScan(); rlgPool('exec:2027'); o.rlg='ran'; }catch(e){ o.rlg=e.message; }
    try{ var p=posExec(2027), s=0; Object.keys(p.pos).forEach(function(k){ var x=posTot(p.pos,k); s+=x.ob+x.pl; }); o.pos=s; }catch(e){ o.pos=e.message; }
    o.polluted=${POLLUTED}; return JSON.stringify(o); })()`);
  if (out) {
    chk(F, 'the execution grid aggregates without stopping', out.exThrew || '', '');
    chk(F, 'every title\'s dollars are under a title (15,000 of 15,000)', out.exTitles, 15000);
    chk(F, 'the reallocation scans run', out.rlg, 'ran');
    chk(F, 'the execution position counts every row (15,000 of 15,000)', out.pos, 15000);
    chk(F, 'nothing is written onto Object.prototype', out.polluted, '');
  }
}
{
  const F = 'K3 estimate lines, cost elements and MIPR types keyed by name (pmoDetail, ceSummary, MIPR_LBL)';
  const B = fresh();
  const out = probe(B, F, `(function(){ var o={};
    ACEDB.sets={ X:{ lines:[ { ap:mySlug(), pmo:'AV', svc:'__proto__', v:{2027:7} }, { ap:mySlug(), pmo:'AV', svc:'constructor', v:{2027:7} } ] } }; spAce='X';
    try{ pmoDetail('AV', [2027]); o.drill='ran'; }catch(e){ o.drill=e.message; }
    o.objectFn=(Object[2027]===undefined)? '' : String(Object[2027]);
    DATA.costElems=true;
    try{ S.costElem={ R0:'constructor' }; ceSummary(); S.costElem={ R0:'__proto__' }; ceSummary(); o.ce='ran'; }catch(e){ o.ce=e.message; }
    o.mipr=String(MIPR_LBL['constructor']||'');
    o.polluted=${POLLUTED}; return JSON.stringify(o); })()`);
  if (out) {
    chk(F, 'the PMO drill runs on estimate lines naming __proto__ and constructor', out.drill, 'ran');
    chk(F, 'nothing is written onto the Object constructor', out.objectFn, '');
    chk(F, 'the cost element panel runs on cost elements named constructor and __proto__', out.ce, 'ran');
    chk(F, 'a MIPR type of constructor is not a MIPR type', out.mipr, '');
    chk(F, 'nothing is written onto Object.prototype', out.polluted, '');
  }
}
{
  const F = 'K4 reprogramming merge, a method-named id (rpMerge)';
  const B = fresh();
  const out = probe(B, F, `(function(){ rpMerge({ entries:[ { id:'hasOwnProperty', ts:9e12, call:'x', pwnRp:'PWNED' } ] });
    var ok=true; try{ Object.prototype.hasOwnProperty.call({ a:1 }, 'a'); }catch(e){ ok=false; }
    return JSON.stringify({ callOk:ok, onBuiltin:Object.prototype.hasOwnProperty.pwnRp==='PWNED' }); })()`);
  if (out) {
    chk(F, 'every hasOwnProperty.call guard in the page still works', out.callOk, true);
    chk(F, 'nothing is written onto the built-in', out.onBuiltin, false);
  }
}
{
  const F = 'K6 destination keys and cycle names (inboundCheck, destFold, destRemap, destPkgIn, blGet)';
  const B = fresh();
  const out = probe(B, F, `(function(){ var o={};
    o.doorList=inboundCheck(JSON.stringify({ ap:'om', dest:[ { k:'constructor', n:'X' } ] }));
    o.doorMap=inboundCheck(JSON.stringify({ dest:{ R0:{ to:'toString' } } }));
    o.doorOk=inboundCheck(JSON.stringify({ dest:{ R0:{ to:'d1', end:'d2' } }, ents:[ { k:'d1', n:'Alpha' } ] }));
    var e0=DESTDB.ents[0]; var al=destFold([ { k:'zz9', n:e0.n } ], null, true, {});
    var st={ dest:{ R0:{ to:'constructor', end:'zz9' } } }; destRemap([st], al);
    o.remapTo=typeof st.dest.R0.to+':'+st.dest.R0.to; o.remapEnd=st.dest.R0.end===e0.k;
    var pkg={ ap:mySlug(), items:{ R0:{ dest:{ to:'constructor', end:'toString' } } } }; destPkgIn(pkg);
    o.pkgTo=typeof pkg.items.R0.dest.to+':'+pkg.items.R0.dest.to; o.pkgEnd=typeof pkg.items.R0.dest.end;
    MS.cycleRef='toString'; o.cycRef=cycDeltaRef();
    return JSON.stringify(o); })()`);
  if (out) {
    chk(F, 'a destination list keyed constructor is refused at the door', !!out.doorList, true);
    chk(F, 'a requirement sent to destination toString is refused at the door', !!out.doorMap, true);
    chk(F, 'ordinary destinations still import', out.doorOk, '');
    chk(F, 're-pointing leaves a destination named constructor as it is', out.remapTo, 'string:constructor');
    chk(F, 're-pointing still moves the destination it was asked to', out.remapEnd, true);
    chk(F, 'a package naming destination constructor keeps the name', out.pkgTo, 'string:constructor');
    chk(F, 'a package naming destination toString keeps text', out.pkgEnd, 'string');
    chk(F, 'a reference cycle named toString is not a locked cycle', out.cycRef, '');
  }
}
// ---- found by re-verifying the key sweep against the fixed board (11 Oct) ---------------------------
{
  const F = 'K7 values the board uses as keys, at the import check (IN_VAL_KEYS, items-only packs, ids the board keeps)';
  const B = fresh();
  const out = probe(B, F, `(function(){ var c=function(o){ return inboundCheck(JSON.stringify(o)); }; return JSON.stringify({
    packId: c({ svc:['USAF'], dataPack:{ items:[ { id:'constructor', ask:[1] } ] } }),
    packGrp: c({ svc:['USAF'], dataPack:{ items:[ { id:'R1', grp:'__proto__', ask:[1] } ] } }),
    packMarkup: c({ svc:['USAF'], dataPack:{ items:[ { id:'R<b>1', ask:[1] } ] } }),
    cycleGrp: c({ cycles:{ 'PB|2027':{ proj:{ 2027:{ reqs:[ { id:'R1', grp:'constructor' } ] } } } } }),
    clinKey: c({ clinNew:{ P1:[ { key:'__proto__', clin:'0001' } ] } }),
    flowCat: c({ flow:{ cats:[ { k:'constructor', n:'x' } ] } }),
    ppbeLine: c({ ppbe:{ 'PB|2027':{ lines:{ USAF:[ { k:'__proto__' } ] } } } }),
    rpEntry: c({ rpDb:{ entries:[ { id:'hasOwnProperty', amt:1 } ] } }),
    aceLine: c({ sets:{ X:{ lines:[ { ap:'om', pmo:'constructor', svc:'USAF', v:{} } ] } } }),
    aceAlign: c({ aceAlign:{ '2025ACE':{ PSM:'constructor' } } }),
    remId: c({ services:['USAF'], items:[ { id:'__rem', ask:[1] } ] }),
    remOrder: c({ years:{ 2027:{ order:[ 'R1', '__rem' ], discSvc:[0] } } }),
    ok: c({ svc:['USAF'], dataPack:{ items:[ { id:'R1', grp:'AV', ask:[1] } ] }, clinNew:{ P1:[ { key:'n0' } ] },
      flow:{ cats:[ { k:'work' } ] }, ppbe:{ 'PB|2027':{ lines:{ USAF:[ { k:'L1' } ] } } }, aceAlign:{ '2025ACE':{ PSM:'AV' } },
      rpDb:{ entries:[ { id:'RP1' } ] }, sets:{ X:{ lines:[ { ap:'om', pmo:'AV', svc:'USAF', v:{} } ] } } }) }); })()`);
  if (out) {
    chk(F, 'a data pack with only items is checked: an id constructor is refused', !!out.packId, true);
    chk(F, 'a data pack with only items is checked: an office __proto__ is refused', !!out.packGrp, true);
    chk(F, 'a data pack with only items is checked: an id carrying markup is refused', !!out.packMarkup, true);
    chk(F, "a locked cycle's requirement office constructor is refused", !!out.cycleGrp, true);
    chk(F, 'a CLIN key __proto__ is refused', !!out.clinKey, true);
    chk(F, 'a funds-flow category key constructor is refused', !!out.flowCat, true);
    chk(F, 'a PPBE line key __proto__ is refused', !!out.ppbeLine, true);
    chk(F, 'a reprogramming entry id hasOwnProperty is refused', !!out.rpEntry, true);
    chk(F, 'an estimate line naming office constructor is refused', !!out.aceLine, true);
    chk(F, 'an estimate office alignment to constructor is refused', !!out.aceAlign, true);
    chk(F, 'a requirement id __rem (the lane engine\'s own key) is refused', !!out.remId, true);
    chk(F, 'a plan whose order names __rem is refused', !!out.remOrder, true);
    chk(F, 'ordinary values of every one of these still import', out.ok, '');
  }
}
{
  const F = 'K8 lookups by a value the board uses as a key (flowSubOf, ppSetV, rpMerge tombstones, acePmoGroups, fydpAceShare, spProjByPmo, forecast)';
  const B = fresh();
  const out = probe(B, F, `(function(){ var o={};
    o.flowSub=[flowSubOf('constructor'), flowSubOf('hasOwnProperty'), flowSubOf('toString')].map(function(x){ return x===null? 'null' : typeof x; }).join(',');
    try{ var P=ppPos(); P.val={}; ppSetV(SVC[0], '__proto__', 2027, 'd', '5'); o.pp=({})[2027]===undefined? 'clean' : 'polluted'; }catch(e){ o.pp='threw '+e.message; }
    RPDB.entries=[ { id:'hasOwnProperty', amt:2500000 } ]; RPDB.gone={};
    var res=rpMerge({ entries:[], gone:{} }); o.rpKept=RPDB.entries.length+'/'+res.buried;
    MS.aceAlign={ X:{ AV:'constructor', PSM:'__proto__' } };
    try{ var g=acePmoGroups('X'); o.groups=['__proto__','constructor'].map(function(k){ return (Object.prototype.hasOwnProperty.call(g,k) && Array.isArray(g[k]))? g[k].join('+') : 'missing'; }).join(','); }catch(e){ o.groups='threw '+e.message; }
    try{ var sh=fydpAceShare('X', [ { grp:'AV' }, { grp:'PSM' }, { grp:'TSS' } ]);
      o.share=Object.keys(sh).map(function(k){ return typeof sh[k]; }).join(','); }catch(e){ o.share='threw '+e.message; }
    try{ var sp=spProjByPmo({ svc:['USAF'], reqs:[ { id:'R1', grp:'constructor', ask:[5], alloc:[5], fund:[5] }, { id:'R2', grp:'__proto__', ask:[7], alloc:[7], fund:[7] } ] }, null);
      o.sp=Object.keys(sp).sort().join(',')+':'+(sp['__proto__']? sp['__proto__'].ask[0] : 'none'); }catch(e){ o.sp='threw '+e.message; }
    try{ DATA.items[0].grp='__proto__'; forecast(); o.fc=(({}).tot===undefined && ({}).unsch===undefined)? 'clean' : 'polluted'; }catch(e){ o.fc='threw '+e.message; }
    return JSON.stringify(o); })()`);
  if (out) {
    chk(F, 'a category named after a built-in has no sub-ladder', out.flowSub, 'null,null,null');
    chk(F, 'a PPBE figure for a line keyed __proto__ is written to the line, not onto every object', out.pp, 'clean');
    chk(F, 'a reprogramming row is not buried by an inherited tombstone', out.rpKept, '1/0');
    chk(F, 'estimate offices named after built-ins group as text, each holding its own board office', out.groups, 'PSM,AV');
    chk(F, 'an office sharing an estimate office is named by text, never a built-in', out.share.indexOf('function')<0 && out.share.indexOf('threw')<0, true);
    chk(F, "a cycle's requirements under offices named after built-ins add up under those names", out.sp, '__proto__,constructor:7');
    chk(F, 'the forecast by office writes nothing onto Object.prototype', out.fc, 'clean');
  }
}

bootRelease(bm, []);

// ---- display sinks whose surface is deep in a panel render, checked at the source -----------------
// These are the same esc()-at-display pattern the runtime checks above prove; each lives inside a
// large panel (the funds-flow editors, the buy table, the execution and budget-list panels) that is
// awkward to drive in isolation. These are SOURCE PINS ONLY: the hostile sweep (audit-hostile, hostile-render) does not
// plant these fields, so nothing else covers them. Each fix is pinned to its exact escaped form in the board source,
// so the check is present on the fixed board and absent -- the raw sink -- on the pre-fix board.
{
  const src = readFileSync(BOARD, 'utf8');
  const srcSink = [
    ['A3e buy quantity (buysPanel)', 'value="${esc(b.base[i]||0)}"'],
    ['A3f fsrc mode (lane chip title)', "funding source SET manually ('+esc(t.set.toUpperCase()"],
    ['A3g award id attribute (awardBlockHtml)', 'id="awdM-${esc(it.id)}"'],
    ['A3h flow FY (matching-rules input)', `value="'+(parseInt(flowPseudo().from)||'')`],
    ['A3j budget-list file count (budBody)', `esc(x.file)+'</td><td>'+esc(x.n)`],
    ['A4 QPE office (exBody)', `esc(g)+' <span style="color:var(--dim);font-size:8.5px">`],
    ['A5 shared-folder peer reqs (liveBody)', 'sum? esc(sum.reqs)'],
    // found by the v2.00 self-audit, beyond the review's 27: an imported destination key and a funds-flow FY
    ['A6 destination key, "Goes to" picker (recFields)', `'<option value="'+esc(e.k)+'"'+(destOf(it).to===e.k`],
    ['A6 destination key, "Which awards to" picker (recFields)', `'<option value="'+esc(e.k)+'"'+(destOf(it).end===e.k`],
    ['A3h flow FY "counts as" (matching-rules input)', `value="'+(parseInt(flowPseudo().to)||'')`],
    ['A3h funds-flow label, export status line (exportFlow)', `setStat('⬇ Exported: funds flow '+esc(F.label)+'`],
    ['A3e buy quantity, adjusted (buysPanel)', 'value="${esc(b.adj[i]||0)}"'],
    ['A2 cost-estimate set names (importAceNote)', `esc(sets.sort().join(', '))`],
    // found by the final review of 23a18ee: siblings of fixed sinks that were still raw
    ['A3h CCaR import report counts (flowImportReport)', `'<td>'+esc(t.read||0)+'</td>'`],
    ['A3h CCaR import report counts (flowImportReport)', `+'">'+esc(t.kept||0)+'</td>'`],
    ['A3h CCaR import report counts (flowImportReport)', `+'">'+esc(t.noFy||0)+'</td>'`],
    ['N1 BAE import department token (importBud status line)', `('+esc(D.depts.join(', '))+')`],
    // lower severity: a file name a macOS/Linux/ZIP user can choose
    ['C1 file names in status lines (importState, importSrc, importAce)', `Imported saved state from '+esc(f.name)`],
    ['C1 file names in status lines (importState, importSrc, importAce)', `'\\ud83d\\udce5 Reading '+esc(f.name)`],
    ['C1 file names in status lines (importState, importSrc, importAce)', `'\\ud83d\\udcc8 Reading '+esc(f.name)`],
    ['C1 file names in status lines (importState, importSrc, importAce)', `— "'+esc(h.name||FNAME)+'" now carries this state.`],
    // found by the full sweep of the board (8 Oct)
    ['A2 cost-estimate set names (importAceNote)', `<b>' + esc(missing.sort().join(', ')) + '</b>, which was '`],
    ['N4 CCaR records count (Data menu)', `ccarIdx()? ((wholeOr(MS.ccarIdx.n,0))+' record'`],
    ['N5 roll panel year count (rollBody)', `n=st&&Array.isArray(st.order)? st.order.length : 0;`],
    ['N6 workbook and error text in status lines', `In-place save failed ('+esc((e&&e.message)||e)+')`],
    ['N6 workbook and error text in status lines', `esc(msg.join(' \\u00b7 '))`],
    ['N6 workbook and error text in status lines', `setStat('\\u26a0 Import failed: '+esc((e&&e.message)||e));`],
    ['N7 cost-estimate line count (aceStamp, ACE tie-out)', `+' \\u00b7 '+(Array.isArray(set.lines)?set.lines.length:0)+' cost lines'`],
    ['N7 cost-estimate line count (aceStamp, ACE tie-out)', `+(Array.isArray(set.lines)?set.lines.length:0)+' cost lines \\u00b7 '`],
    ['E2 writer, office, service and team names', `esc(WRITER.by)+' holds the pen'`],
    ['E2 writer, office, service and team names', 'title="${esc(s)} award for '],
    ['E2 writer, office, service and team names', "${g==='ALL'?'Cost Element (ALL PMOs)':esc(g)}</button>"],
    ['E2 writer, office, service and team names', "\">${esc(it.team)}</span>"],
    ['E2 writer, office, service and team names', '>⓪ Zero ${esc(filter)} allocations</button>'],
    ['E2 writer, office, service and team names', '↺ ${esc(filter)} as-requested</button>'],
    // the key sweep (8-9 Oct): every map a workbook or estimate value is a key in, and the two refusals
    ['K5 safe maps and refusals (source)', `const byT=Object.create(null); let tot=0, obl=0;`],
    ['K5 safe maps and refusals (source)', `ev:Object.create(null), evUpl:Object.create(null), pmo:PMO_SHORT(r[18]), file:false};`],
    ['K5 safe maps and refusals (source)', `pmo:PMO_SHORT(r[18]), ev:Object.create(null), ym:'',`],
    ['K5 safe maps and refusals (source)', `sharedNames:Object.create(null), byKey:{}};`],
    ['K5 safe maps and refusals (source)', `titles:Object.create(null), buds:Object.create(null), oprs:Object.create(null), pmos:Object.create(null), raw:`],
    ['K5 safe maps and refusals (source)', `const byP=Object.create(null), byS=Object.create(null); let tot=0, obl=0;`],
    ['K5 safe maps and refusals (source)', `none:0, pos:Object.create(null), cand:Object.create(null), imported:false};`],
    ['K5 safe maps and refusals (source)', `const reqs=[], pmo=Object.create(null);`],
    ['K5 safe maps and refusals (source)', `const block={name:d.name, rows:Object.create(null), req:{}, bud:{}, years,`],
    ['K5 safe maps and refusals (source)', `const ctl=Object.create(null), ctlSvcLevel=`],
    ['K5 safe maps and refusals (source)', `const byG=Object.create(null), seenIds={};`],
    ['K5 safe maps and refusals (source)', `ce:Object.create(null)};`],
    ['K5 safe maps and refusals (source)', `const forOf=Object.create(null);`],
    ['K5 safe maps and refusals (source)', `function flowEntUseMap(){\n  const out=Object.create(null);`],
    ['K5 safe maps and refusals (source)', `function flowDestResolve(ids, axis){\n  const seen=Object.create(null);`],
    ['K5 safe maps and refusals (source)', `function pmoChoices(){\n  const seen=Object.create(null);`],
    ['K5 safe maps and refusals (source)', `function ppKeysOf(P, sv){\n  const seen=Object.create(null), out=[];`],
    ['K5 safe maps and refusals (source)', `const P=ppNorm(Praw), seen=Object.create(null);`],
    ['K5 safe maps and refusals (source)', `const clean=[], seen=Object.create(null);`],
    ['K5 safe maps and refusals (source)', `const byId=Object.create(null); mine.forEach(`],
    ['K5 safe maps and refusals (source)', `if(spAce!=='board' && !Object.prototype.hasOwnProperty.call(ACEDB.sets||{}, spAce)) spAce='board';`],
    ['K5 safe maps and refusals (source)', `if(IN_KEY_BAD.has(key)) throw new Error('the estimate would be filed as '`],
    ['K5 safe maps and refusals (source)', `function destRefs(states){\n  const r=Object.create(null);`],
    // found by re-verifying the key sweep (11 Oct): maps no runtime check reaches
    ['K5 safe maps and refusals (source)', `let exOpen=false, exFy=null, exX=Object.create(null), exXT={}`],
    ['K5 safe maps and refusals (source)', `    exA=null; exFy=null; exX=Object.create(null); exXT={};`],
    ['K5 safe maps and refusals (source)', `exFy=null; exX=Object.create(null); exXT={}; exPmo='ALL'; render(); }`],
    ['K5 safe maps and refusals (source)', `function exSetSvc(v){ exSvc=v; exX=Object.create(null); exXT={}; render(); }`],
    ['K5 safe maps and refusals (source)', `  const byG=Object.create(null); order.forEach(function(k){ const g=rows[k].grp||'(no PMO)';`],
    ['K5 safe maps and refusals (source)', `  const byG=Object.create(null); D.order.forEach(id=>{ const g=D.rows[id].grp||'(no PMO)';`],
    ['K5 safe maps and refusals (source)', `  const byGX=Object.create(null);`],
    ['K5 safe maps and refusals (source)', `      const stray=Object.create(null);\n      (set.lines||[]).forEach(function(l){`],
    // maps no runtime check above reaches: the PMO panel, the deck's cost-element rollup, the workbook's two matrices
    ['K5 safe maps and refusals (source)', `  const byG=Object.create(null);\n  const allD=SVC.map(_=>0), allM=SVC.map(_=>0), allU=SVC.map(_=>0);`],
    ['K5 safe maps and refusals (source)', `    const byCE=Object.create(null);\n    S.order.forEach(id=>{const it=itemById(id),p=T[id]; if(!it||!p)return;`],
    ['K5 safe maps and refusals (source)', `    const byCE=Object.create(null);\n    S.order.forEach(id=>{\n      const it=itemById(id); if(!it) return;\n      const p=T[id], ce=ceOf(id);`],
    ['K5 safe maps and refusals (source)', `    // CE by PMO\n    byP=Object.create(null);`],
    ['K5 safe maps and refusals (source)', `function destPkgIn(pkg){\n  const refs=Object.create(null);`],
  ];
  for (const [finding, needle] of srcSink) {
    SEEN.add(finding);
    if (!src.includes(needle)) failures.push({ finding, what: `the escaped sink is not in the board source (the raw sink was not fixed)`, got: 'raw', want: 'esc()' });
  }
  // A fix in one branch must not leave its siblings raw: the raw form may not appear anywhere.
  const rawGone = [
    ['A1a package sender and name (pkgApply status lines)', /'Import cancelled — '\+nm\+/, 'an Import cancelled line draws the appropriation raw'],
    ['A1a package sender and name (pkgApply status lines)', /setStat\([^\n]*' from '\+pkg\.by\b/, 'a status line draws the package sender raw'],
    ['A3h CCaR import report counts (flowImportReport)', /\+\(t\.(read|kept|noFy)\|\|0\)\+'<\/td>'/, 'a report count is drawn raw'],
    ['N1 BAE import department token (importBud status line)', /\('\+D\.depts\.join\(/, 'the department list is drawn raw'],
    ['C1 file names in status lines (importState, importSrc, importAce)', /setStat\([^\n]*'\+f\.name\b/, 'a status line draws a file name raw'],
    ['N4 CCaR records count (Data menu)', /\(MS\.ccarIdx\.n\|\|0\)\+/, 'the records count is drawn raw'],
    ['N6 workbook and error text in status lines', /setStat\([^\n]*\+\(\(e&&e\.message\)\|\|e\)/, 'a status line draws error text raw'],
    ['E2 writer, office, service and team names', /\$\{filter\}/, 'the office filter is drawn raw'],
  ];
  for (const [finding, re, what] of rawGone) {
    SEEN.add(finding);
    if (re.test(src)) failures.push({ finding, what, got: 'raw form present', want: 'absent' });
  }
}

// ---- TEXT FIDELITY: an escape belongs where text is drawn as HTML, and nowhere else ----------------
// esc() turns & < " ' into entities. Applied where a value is BUILT, or to text that is not HTML (a confirm()
// dialog, a workbook cell), it changes what a person reads: "O&M" becomes "O&amp;M". v2.00's first candidate did
// exactly that twice, and these guard it. They pass on v1.99 too. T1 drives flowCalc at runtime; T2-T4 pin the plain
// forms in the source, so each guards the over-escapes it names -- not every possible over-escape.
const FID = new Set();
const fid = (name, what, got, want) => { FID.add(name); if (String(got) !== String(want)) failures.push({ finding: name, what, got: String(got), want: String(want) }); };
{
  // T1 — a pseudo-appropriation named with "&": the funds-flow label (the panel heading, the chart, the workbook's
  // Scope line) carries the name as typed.
  const B = fresh();
  const out = probe(B, 'T1 funds-flow label keeps "&" (flowCalc / exportFlow Scope)', `(function(){
    var row=[]; for(var i=0;i<25;i++) row.push(''); row[3]='Title A'; row[4]='O&M Carry, Mandatory'; row[7]='Event'; row[9]=1000; row[18]='AV';
    EXDB={ts:Date.now(), all:{}}; EXDB.all[mySlug()]={rows:{2026:[row]}};
    var C=flowCfg(); C.pseudo={on:true, label:'O&M Carry', token:'O&M Carry', from:2026, to:2027, col:4}; C.fys=[2027];
    var F=flowCalc();
    return JSON.stringify({ n:F.pseudo.n, label:F.label }); })()`);
  if (out) {
    fid('T1 funds-flow label keeps "&" (flowCalc / exportFlow Scope)', 'the fixture pulls one row into the pseudo-appropriation', out.n, 1);
    fid('T1 funds-flow label keeps "&" (flowCalc / exportFlow Scope)', 'the label reads "O&M Carry", not "O&amp;M Carry"',
      /O&M Carry/.test(out.label) && !/&amp;/.test(out.label), true);
  }
}
{
  // T2 — a confirm() dialog is plain text: the budget-authority question names the services a position is silent
  // about as they are, with no entities.
  const src = readFileSync(BOARD, 'utf8');
  fid('T2 budget-authority question is plain text (bmSeedFromPp confirm)', 'the confirm() text does not esc() the service names',
    src.includes(`says nothing about: '+esc(`), false);
}

{
  // T3 — plain-text uses of a markup label decode every entity (an apostrophe in a title read &#39; in the conflict
  // dialog and the pre-flight copy), and a title is cut before it is escaped, never after (an entity cut in half).
  const src = readFileSync(BOARD, 'utf8');
  const T3 = 'T3 plain-text uses decode every entity (conflict dialog, journal search, pre-flight copy, cut title)';
  fid(T3, 'the conflict dialog decodes the journal label with diagPlain', src.includes('const plain=function(h){ return diagPlain(h); };'), true);
  fid(T3, 'the journal search compares decoded text', src.includes('diagPlain(jrnlLabel(x.e))'), true);
  fid(T3, 'the Put back question decodes the journal label', src.includes("if(!confirm('Put '+diagPlain(jrnlLabel(e))+' back"), true);
  fid(T3, 'the pre-flight copy decodes its titles', src.includes('+diagPlain(f.t)+'), true);
  fid(T3, 'the runs-out-at title is cut before it is escaped', src.includes(`esc(String(dispTitle(itemById(cut.id))||'').slice(0,34))`), true);
}

{
  // T4 — a cycle or position key's label has a text form and an HTML form. Text goes to dialogs, the window title, file
  // names and workbook cells as it is; the HTML form is escaped once and never again. A key carrying "&" shows "&".
  const B = fresh();
  const T4 = 'T4 cycle and position labels: text as typed, HTML escaped once (blLblTxt/blLbl, ppLblTxt/ppLbl)';
  let out = null;
  try { out = JSON.parse(B.ev(`JSON.stringify({ bt: blLblTxt('A&B|2027'), bh: blLbl('A&B|2027'), pt: ppLblTxt('A&B|2027'), ph: ppLbl('A&B|2027') })`)); }
  catch (e) { fid(T4, 'the text and HTML label helpers exist', 'absent', 'present'); }
  if (out) {
    fid(T4, 'the cycle label as text keeps "&"', out.bt, 'A&B27');
    fid(T4, 'the cycle label as HTML is escaped once', out.bh, 'A&amp;B27');
    fid(T4, 'the position label as text keeps "&"', out.pt, 'A&B27');
    fid(T4, 'the position label as HTML is escaped once', out.ph, 'A&amp;B27');
  }
  const src = readFileSync(BOARD, 'utf8');
  fid(T4, 'no HTML label is escaped a second time', /esc\((blLbl|ppLbl)\(/.test(src), false);
  fid(T4, 'the window title of a locked view uses the text label', src.includes("document.title=_cycStash.title+' — '+blLblTxt(key)+' LOCKED VIEW';"), true);
  fid(T4, 'the delete-cycle question uses the text label', src.includes("if(!confirm('Delete the '+blLblTxt(key)+' cycle?"), true);
  fid(T4, 'the FYDP workbook file name uses the text label', src.includes("'ORBIT FYDP Spend Plan — '+(D.src==='working'? 'working plan' : blLblTxt(D.src))"), true);
  fid(T4, 'the changes inspector escapes its text label where it draws it', (src.match(/inspField\('Since '\+esc\(lbl\),/g) || []).length, 2);
  fid(T4, 'the cycle-comparison menu line escapes its text labels', src.includes("(cycCmpA? esc(cycCmpLbl(cycCmpA)+' ⇄ '+cycCmpLbl(cycCmpB)) :"), true);
}

// ---- report ---------------------------------------------------------------------------------------
const line = '='.repeat(96);
console.log(`\n${line}`);
if (failures.length) {
  console.log(`INJECTION REGRESSION — ${failures.length} FAILING CHECK(S) across ${SEEN.size} findings and ${FID.size} text-fidelity guards\n`);
  for (const f of failures) console.log(`  FAIL  [${f.finding}] ${f.what}  (got ${f.got}, want ${f.want})`);
  console.log(`\n${line}\n`);
  process.exit(1);
}
console.log(`INJECTION REGRESSION — all clear across ${SEEN.size} findings and ${FID.size} text-fidelity guards: every hostile value checked is drawn as text, the structural and key guards hold, and the text-fidelity guards hold`);
console.log(`\nALL CHECKS PASSED`);   // the gate counts this banner alongside the other suites
console.log(`${line}\n`);
process.exit(0);
