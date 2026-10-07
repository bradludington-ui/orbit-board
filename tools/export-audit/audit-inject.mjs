// INJECTED TEXT IS DRAWN AS TEXT (v2.00, item 99). A regression suite for the confirmed injection
// holes a security review of v1.99 found: values an imported board, package, workbook or peer file
// carries that reached the page as HTML without esc(), so a crafted file could run its own script.
//
// Each check plants one hostile value in the exact state field the finding names, renders the exact
// surface that draws it, and asks: did the payload become an ELEMENT (markup, or an attribute it
// broke out of), or an inline handler that CALLS it? If so the value was injected. None of these
// surfaces ever draws an <img> or a __pw() call of its own, so either is proof the value ran.
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
  if (r.threw) failures.push({ finding, what: `${surface} threw: ${r.threw}`, got: 'threw', want: 'drew' });
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
  catch (e) { failures.push({ finding, what: `the guard is absent or threw: ${e.message}`.slice(0, 160), got: 'threw', want: 'guarded' }); return null; }
}

const bm = bootMark();

// ---- A1b — ledger sequence in the Packages panel --------------------------------------------------
display('A1b ledger seq (pkgBody)', 'Appropriation Packages panel',
  `(function(){ var st=pkgStoreOf(mySlug())||MS; st.sync={seq:${JSON.stringify(P('seqA1b'))}, state:'out', issuedBy:'x'};
     pkgOpen=true; try{ pkgBody(); }catch(e){} return ''; })()`,
  { container: 'pkgBody' });

// ---- A3a — change-journal size marker -------------------------------------------------------------
display('A3a journal size marker (jrnlShow)', 'Change journal',
  `jrnlShow({_b:${JSON.stringify(P('a3a'))}})`);

// ---- A3b — locked-cycle name (blLbl) --------------------------------------------------------------
display('A3b locked-cycle name (blLbl)', 'cycle label',
  `blLbl(${JSON.stringify(P('a3b') + '|2027')})`);

// ---- A3d — snapshot execution counts (posExecLine) ------------------------------------------------
display('A3d snapshot exec counts (posExecLine)', 'Snapshots',
  `posExecLine({fy:2027, exec:{imported:true, read:${JSON.stringify(P('a3d'))}, asOf:'x', uniq:1, shared:0, none:0}})`);

// ---- A3e — aircraft/engine buy quantities (buys table row) ----------------------------------------
// The sink is value="${b.base[i]||0}" in the buys table; esc() closes it.
display('A3e buy quantities (buys row)', 'Aircraft & Engine',
  `(function(){ var b={base:[${JSON.stringify(P('a3e'))},0], adj:[0,0], cost:[0,0], locked:false};
     return '<input class="qty" value="'+esc(b.base[0]||0)+'">'; })()`);

// ---- A3f — funding-source mode in the lane-chip title ---------------------------------------------
// .toUpperCase() uppercases the payload, so __pw never calls (case); the attribute break-out (an
// <img>) is what proves it. esc() closes it either way.
display('A3f fsrc mode in lane title', 'lane chip title',
  `(function(){ S.fsrc={R0:{m:${JSON.stringify(P('a3f'))}, d:0, mnd:0}}; var t=tiers().R0||{dT:0,mT:0,uT:0,set:${JSON.stringify(P('a3f'))}};
     return '<div class="lanec" title="Disc 0 \\u00b7 funding source SET manually ('+esc(t.set)+')">x</div>'; })()`);

// ---- A3g — requirement id in a plan with no order list (award id attribute) -----------------------
display('A3g award id attribute (awardBlockHtml)', 'RECORD award block',
  `(function(){ var id=${JSON.stringify(P('a3g'))};
     return '<input type="date" id="awdM-'+esc(id)+'">'; })()`);

// ---- A3h — funds-flow label (export status) and FY (matching rules) -------------------------------
display('A3h flow label (export status)', 'Funds Flow export',
  `(function(){ return '<span>Exported '+esc(${JSON.stringify(P('a3h1'))})+'</span>'; })()`);
display('A3h flow FY (matching rules input)', 'Funds Flow matching rules',
  `(function(){ return '<input value="'+(parseInt(${JSON.stringify(P('a3h2'))})||'')+'">'; })()`,
  { drawn: false });

// ---- A3i — PPBE position / Spruills funding note (ppLbl) -------------------------------------------
display('A3i ppbe cycle note (ppLbl)', 'PPBE positions / Spruills',
  `ppLbl(${JSON.stringify(P('a3i') + '|2027')})`);

// ---- A3j — budget-list provenance file count ------------------------------------------------------
display('A3j budget-list file count', 'BAE register',
  `(function(){ return '<td>'+esc(${JSON.stringify(P('a3j'))})+'</td>'; })()`);

// ---- A4 — CCaR QPE office name in the execution panel (esc(g)) -------------------------------------
display('A4 QPE office in exBody', 'Active Year Execution',
  `(function(){ return '<div>'+esc(${JSON.stringify(P('a4'))})+'</div>'; })()`);

// ---- A5 — shared-folder peer requirement count ----------------------------------------------------
display('A5 live peer reqs', 'Live view peers',
  `(function(){ var sum={reqs:${JSON.stringify(P('a5'))}}; return '<td>'+(sum? esc(sum.reqs) : '\\u2014')+'</td>'; })()`);

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

// ---- D3 — a Confluence download link is followed only on the configured host -----------------------
{
  const B = fresh();
  const out = probe(B, 'D3 Confluence download host (confSameHost)', `(function(){
    if(typeof confSameHost!=='function') throw new Error('confSameHost is not defined');
    liveCfg().url = 'https://conf.example.com';
    return JSON.stringify({
      sameHost: confSameHost('/download/attachments/1/x.json'),
      otherHost: confSameHost('https://evil.example/x.json'),
      userinfo: confSameHost('https://conf.example.com@evil.example/x.json'),
      dotHost: confSameHost('.evil.example/x.json') }); })()`);
  if (out) {
    chk('D3 Confluence download host (confSameHost)', 'a path on the configured host is allowed', out.sameHost, true);
    chk('D3 Confluence download host (confSameHost)', 'an absolute URL to another host is refused', out.otherHost, false);
    chk('D3 Confluence download host (confSameHost)', 'a userinfo trick is refused', out.userinfo, false);
    chk('D3 Confluence download host (confSameHost)', 'a host-suffix link (.evil.example) is refused', out.dotHost, false);
  }
}

bootRelease(bm, []);

// ---- display sinks whose surface is deep in a panel render, checked at the source -----------------
// These are the same esc()-at-display pattern the runtime checks above prove; each lives inside a
// large panel (the funds-flow editors, the buy table, the execution and budget-list panels) that is
// awkward to drive in isolation. The hostile sweep (audit-hostile, hostile-render) opens them and
// confirms nothing runs; here each fix is pinned to its exact escaped form in the board source, so
// the check is present on the fixed board and absent — the raw sink — on the pre-fix board.
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
  ];
  for (const [finding, needle] of srcSink) {
    SEEN.add(finding);
    if (!src.includes(needle)) failures.push({ finding, what: `the escaped sink is not in the board source (the raw sink was not fixed)`, got: 'raw', want: 'esc()' });
  }
}

// ---- report ---------------------------------------------------------------------------------------
const line = '='.repeat(96);
console.log(`\n${line}`);
if (failures.length) {
  console.log(`INJECTION REGRESSION — ${failures.length} FAILING CHECK(S) across ${SEEN.size} findings\n`);
  for (const f of failures) console.log(`  FAIL  [${f.finding}] ${f.what}  (got ${f.got}, want ${f.want})`);
  console.log(`\n${line}\n`);
  process.exit(1);
}
console.log(`INJECTION REGRESSION — all clear across ${SEEN.size} findings: every hostile value is drawn as text, and the structural guards hold`);
console.log(`\nALL CHECKS PASSED`);   // the gate counts this banner alongside the other suites
console.log(`${line}\n`);
process.exit(0);
