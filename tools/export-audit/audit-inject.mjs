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
// escaped form in the board source below, which fails on a board that draws it raw. (An earlier draft of this suite
// had runtime checks for these sinks that built their own escaped markup instead of calling the board; they passed on
// any board, proved nothing, and were removed before v2.00 was gated.)

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

// ---- found by the full sweep of the board (8 Oct) ----------------------------------------------------
// N2 — the reprogramming merge keys rows by id in a plain object; an id of __proto__ must not write onto Object.prototype
{
  const B = fresh();
  const out = probe(B, 'N2 reprogramming merge keys (rpMerge)', `(function(){
    rpMerge({ entries:[ { id:'__proto__', ts:9e12, pwnRp:'PWNED' } ], gone:{ '__proto__':1 } });
    return JSON.stringify({ polluted: ({}).pwnRp==='PWNED' }); })()`);
  if (out) chk('N2 reprogramming merge keys (rpMerge)', 'a folder or imported entry with id __proto__ does not pollute Object.prototype', out.polluted, false);
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
    markup: typedNameWhy(${JSON.stringify('x"><img src=x>')}, 'The office name'), proto: typedNameWhy('__proto__', 'The office name'),
    ok: typedNameWhy('O&M Ops', 'The office name') })`);
  if (out) {
    chk('E2 typed office and service names (pmoAdd, pmoRename, svcAdd, svcRen)', 'a name with quotes or < > is refused', !!out.markup, true);
    chk('E2 typed office and service names (pmoAdd, pmoRename, svcAdd, svcRen)', 'a name that is an object key of Object.prototype is refused', !!out.proto, true);
    chk('E2 typed office and service names (pmoAdd, pmoRename, svcAdd, svcRen)', 'an ordinary name with & is taken', out.ok, '');
  }
  const src = readFileSync(BOARD, 'utf8');
  chk('E2 typed office and service names (pmoAdd, pmoRename, svcAdd, svcRen)', 'all four prompts apply the rule',
    (src.match(/const why=typedNameWhy\(v, 'The (office|service) name'\);/g) || []).length, 4);
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
// exactly that twice, and these guard it. They pass on v1.99 too; they exist to fail on a board that over-escapes.
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
console.log(`INJECTION REGRESSION — all clear across ${SEEN.size} findings and ${FID.size} text-fidelity guards: every hostile value is drawn as text, the structural guards hold, and nothing is escaped where it is not drawn as HTML`);
console.log(`\nALL CHECKS PASSED`);   // the gate counts this banner alongside the other suites
console.log(`${line}\n`);
process.exit(0);
