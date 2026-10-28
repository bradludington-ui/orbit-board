// THE HOSTILE BOARD (v1.88), shared by tools/hostile-render.mjs (Chromium) and audit-hostile.mjs (jsdom,
// and so the mutation sweep).
//
// Every name, id, key and piece of text a board shows can arrive in a file from someone else. The
// fixture below puts script-shaped text in every field it knows how to fill -- requirement ids, titles,
// events, notes, descriptions, impact statements, record names, CCaR and PID numbers, cost elements, WBS
// lines, CLIN keys and descriptions, service and office names, band names and colours, destinations, the
// BAE list, execution rows, cost estimates, the reprogramming log, the journal, a held submittal, snapshot
// names -- each tagged with where it was planted. A payload does three things if it is ever treated as
// more than text:
//   <img src=x onerror=__pw('tag')>        is markup, the moment it is drawn as HTML
//   "><img src=x onerror=__pw('tag')>      breaks out of an attribute it was written into
//   ');__pw('tag');//                      breaks out of a quoted argument in an inline handler
// hostileSweep() opens every requirement, row menu, pop-up, record panel, WBS panel, the CLIN drill, every
// panel and every menu, and after each reads every inline handler on the page as TOKENS: one that calls
// __pw outside a string literal is a planted value that became code -- whether it was written into a
// handler, or arrived as markup carrying one. That reading needs no browser, so the same sweep runs in
// jsdom inside the test suites. In Chromium an <img onerror> also FIRES; hostile-render.mjs counts that too.
import { boot, seed } from './boot.mjs';

export const P = t => `${t}'"><img src=x onerror=__pw('${t}')>');__pw('${t}');//`;

// Does this handler CALL __pw -- outside a string or a comment? With the encoding working, a handler that
// names a hostile value holds "__pw(" only inside a string literal: the value arriving as the text it is.
export function callsPw(code) {
  let i = 0; const n = code.length;
  while (i < n) {
    const c = code[i];
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < n && code[j] !== c) j += code[j] === '\\' ? 2 : 1;
      i = j + 1; continue;
    }
    if (c === '/' && code[i + 1] === '/') { while (i < n && code[i] !== '\n') i++; continue; }
    if (c === '/' && code[i + 1] === '*') { const j = code.indexOf('*/', i + 2); i = j < 0 ? n : j + 2; continue; }
    if (/[A-Za-z_$]/.test(c)) {
      let j = i; while (j < n && /[\w$]/.test(code[j])) j++;
      const w = code.slice(i, j); i = j;
      if (w === '__pw') { let k = i; while (k < n && /\s/.test(code[k])) k++; if (code[k] === '(') return true; }
      continue;
    }
    i++;
  }
  return false;
}

// Build the hostile board from the board's own source and return the file it saves. A hostile SERVICE
// name and a hostile OFFICE name sit beside ordinary ones, and one hostile REQUIREMENT id among ordinary
// ids, so the board still has something sensible to draw. Nothing here goes through the import door --
// this is the board as a file saved before v1.88 (when nothing was checked) could hold it.
export function buildHostile(html) {
  const SVCN = ['USAF', P('svc'), 'USN'];
  const items = ['R0', 'R1', 'PRIME-2', 'H' + P('id'), 'R4', 'R5'].map((id, i) => ({
    id, grp: i === 4 ? P('grp') : ['PSM', 'AV', 'MxS'][i % 3], team: P('team'), sect: '', custom: false,
    title: P('title' + i), event: P('event' + i), ccar: 'JSF' + (5000 + i),
    fy26: SVCN.map(() => 0), ask: SVCN.map((_, j) => (i + 1) * (j + 2) * 250000), alloc: null }));
  const sc = { services: SVCN, items, disc: [4e6, 1e6, 1.5e6], mand: [1e6, 3e5, 4e5],
    order: items.map(x => x.id), mc: { R0: true } };
  const B = boot(html ? { html } : {});
  seed(B.ev, sc);
  B.ev(`URL.createObjectURL=function(){ return 'blob:x'; }; URL.revokeObjectURL=function(){}; 'ok'`);
  const n = B.ev(`(function(){
    var P=function(t){ return ${JSON.stringify(P('@@'))}.split('@@').join(t); };
    BASE_ITEMS.length=0; DATA.items.forEach(function(i){ BASE_ITEMS.push(i); BASE_ASK[i.id]=i.ask.slice(); });
    if(!Array.isArray(MS.pmos)) MS.pmos=GROUPS.slice();
    if(MS.pmos.indexOf(P('grp'))<0) MS.pmos.push(P('grp'));
    var n=0;
    S.order.forEach(function(id){ n++;
      S.titles[id]=P('rename'+n); S.notes[id]=P('note'+n); S.desc[id]=P('desc'+n); S.cons[id]=P('cons'+n);
      if(!S.recNames) S.recNames={}; S.recNames[id]=P('recname'+n);
      S.ccar[id]=P('ccar'+n); S.pid[id]=P('pid'+n);
      if(!S.costElem) S.costElem={}; S.costElem[id]=P('ce'+n);
      if(!S.wbs) S.wbs={}; S.wbs[id]=[{w:P('wbs'+n), v:[]}];
      if(!S.rcnAsg) S.rcnAsg={}; S.rcnAsg[id]=P('rcn'+n);
      if(!S.budgetAsg) S.budgetAsg={}; S.budgetAsg[id]={}; S.budgetAsg[id][SVC[0]]=P('bae'+n);
      S.band[id]= n%2? 'pdm' : P('bandid');
      S.alloc[id]={m:'t', v:1000000*n};
      if(!S.dest) S.dest={}; S.dest[id]={to:P('destkey'), end:P('destend'+n)};
    });
    // a prime's CLIN grid: a base line in the data pack, an edit over it, an addition, a WBS line
    var pr='PRIME-2';
    DATA.clins=DATA.clins||{}; DATA.clins[pr]=[{key:'c1', clin:'0001', desc:P('clinbasedesc'), ccar:'', ask:SVC.map(function(){ return 2000; })}];
    ['clinAlloc','clinMeta','clinNew','clinRm','clinWbs','clinRcn','clinRcnSvc'].forEach(function(k){ if(!S[k]||typeof S[k]!=='object') S[k]={}; });
    S.clinNew[pr]=[{key:P('clinnewkey'), clin:P('clinno'), desc:P('clinnewdesc'), ccar:P('clinccar'), ask:SVC.map(function(){ return 500; })}];
    S.clinWbs[pr]={}; S.clinWbs[pr][P('clinkey')]=[{w:P('clinwbs'), v:[]}];
    // v1.98 (item 83): a hostile CLIN key, service name and combination key in the CLIN's per-service choice
    S.clinRcnSvc[pr]={}; S.clinRcnSvc[pr][P('clinnewkey')]={}; S.clinRcnSvc[pr][P('clinnewkey')][SVC[1]]=P('clinrcnsvc');
    S.ptype[pr]='PRIME';
    // a custom requirement, a removed one, the absorber, the ATR/BTR log, an added funding source
    S.custom.push({id:'NEW-9', grp:'PSM', team:'PSM', sect:'new', custom:true, title:P('customtitle'), event:P('customevent'),
      ccar:'', fy26:SVC.map(function(){ return 0; }), ask:SVC.map(function(){ return 70000; }), alloc:null});
    DATA.items.push(S.custom[S.custom.length-1]); S.order.push('NEW-9');
    S.removed.push(P('removedid'));
    S.absorb='R1';
    if(!Array.isArray(S.reprog)) S.reprog=[];
    S.reprog.push({type:'ATR', svc:0, appn:P('lgappn'), fy:'FY'+(MS.cur%100), pec:'', bpac:'', title:P('lgtitle'), amtM:1});
    if(!S.bm) S.bm={disc:S.discSvc.slice(), mand:S.mandSvc.slice(), adds:[]};
    S.bm.adds.push({name:P('bmadd'), pool:'disc', vec:SVC.map(function(){ return 100; })});
    // the band ladder: a band whose id, name, description and colour are all hostile
    BANDS_LIST().push({id:P('bandid'), n:P('bandname'), d:P('banddesc'), rule:'skip', crit:false, consReq:false,
      c:'#123456" onmouseover="__pw(\\'bandcolour\\')'});
    // the board-wide stores
    // v2.07 (item 121): the list is read by each row's NAME (n), re-parsed by budReg(); a row carrying only 'name' is never
    // parsed, so it reached no screen. Two that parse, with hostile text inside them, one for PSM and one for the hostile
    // office -- the Add box offers an office's names per service, and so does the RECORD panel's budget section.
    BUDDB={ts:Date.now(), rows:[{ap:mySlug(), svc:SVC[0], name:'USAF O&M - CAM Discretionary AV '+P('baename'), amt:1234},
      {n:'USAF O&M - CAM '+P('baepsm')+' Discretionary PSM'}, {n:'USAF O&M - CAM '+P('baegrp')+' Discretionary '+P('grp')}],
      // a file entry is {dept, file, ts, n}, as importBud writes it: one written as a bare string carried no ts, and the
      // register's 'Imported' date threw on it inside render() -- every redraw after the register opened stopped there, so
      // the rest of this sweep looked at a board that had stopped drawing (v2.07, found while extending the sweep)
      files:[{dept:P('baedept'), file:P('baefile'), ts:Date.now(), n:2}]}; persistBud();
    EXDB={ts:Date.now(), all:{om:{fy:2026, rows:[[P('execccar'), 812345]]}}}; persistExdb();
    ACEDB={ts:Date.now(), sets:{}}; ACEDB.sets[P('aceset')]={fp:'fp-1', locked:true, appn:{om:{tot:{2027:900}, pmo:{AV:{2027:900}}, svc:{}}}, lines:[]}; persistAce();
    // v2.12 (item 132): a 2026 estimate as the import builds it -- its lines' new fields, its WBS tree, its import report and a
    // remembered column mapping -- with hostile text wherever a file can put text. The report box draws the file, the sheet, the
    // column titles, a reason's values, the named rows and the conflicting names; the tie-out's lines nothing claims draw a line's
    // cost element. (The tree's names and a line's category and CCaR fields are planted for the pickers that read them.)
    (function(){ var v={}; v[MS.cur]=1000; var by=[[P('acebyval'), 1]];
      ACEDB.sets['2026ACE']={label:'2026ACE', ts:Date.now(), years:[MS.cur], locked:true, by:P('aceby'), file:P('acefile'),
        appn:{om:{tot:v, pmo:{AV:v}, svc:{USAF:v}}},
        lines:[{ap:mySlug(), pmo:'AV', svc:'USAF', wbs:'9.1', lv:2, ce:P('acece'), slc:P('aceslc'), ccar:P('aceccar'), cdesc:P('acecdesc'), sub:'', v:v}],
        wbs:{om:{'9':{n:P('acetree1'), lv:1, up:''}, '9.1':{n:P('acetree2'), lv:2, up:'9'}}},
        rep:{v:1, file:P('acefile'), sheet:P('acesheet'), row:3, sheets:[P('acesheet')], years:[MS.cur], map:{wbs:{t:P('acecoltitle'), c:'Z', how:'asked'}},
          absent:[], reasons:{pmo:{rows:1, v:v, by:by}}, named:[{k:'pmo', row:4, wbs:P('acenamedwbs'), what:P('acenamedwhat'), v:v}],
          kept:{rows:1, lines:1, zero:0, v:v}, total:{rows:2, v:{}}, notData:0, types:{}, tree:{om:2},
          conflicts:[{ap:'om', code:P('aceconfcode'), n:P('aceconfname'), also:[{n:P('aceconfalso'), rows:[5]}]}], ties:true}};
      ACEDB.cols={}; ACEDB.cols[P('acesig')]={map:{wbs:P('acecolmem')}, ts:1, by:P('acecolby')}; persistAce(); })();
    // v2.12 RV1 (review R01, R02, R08): an estimate whose report carries hostile text where the board writes NUMBERS -- a reason's
    // rows, the kept lines, a year -- and the newest, so the Data card draws its line on every redraw. The import check does not know
    // a report's shape, and the card once summed those counts straight into its markup. Its row counts (skip) carry hostile text as
    // well: the report box names them when it says the report cannot be read.
    (function(){ var v={}; v[MS.cur]=1000;
      ACEDB.sets['2025ACE']={label:'2025ACE', ts:Date.now()+60000, years:[MS.cur], locked:true, appn:{om:{tot:v, pmo:{}, svc:{}}}, lines:[],
        skip:{pmo:P('aceskipv')}, rep:{v:1, sheet:'S', row:3, years:[P('aceyear')], reasons:{dtype:{rows:P('acerows'), v:{}}},
          kept:{rows:1, lines:P('acekeptlines'), v:{}}, total:{rows:1, v:{}}, named:[], conflicts:[]}};
      persistAce(); })();
    // (an appropriation is {tot, pmo, svc}, as the estimate import builds it: one with no 'tot' threw inside render() from the
    // Spruills panel on, so the sweep after that panel looked at a board that had stopped drawing -- v2.07, as BUDDB.files)
    // v2.12 W2 (item 132): the estimate's WBS tree, in the builders' contract's shape -- the names a picker shows beside a
    // paragraph, and the CCaR record its suggestions are offered for. NEW-9 is on 1.2, so its path is drawn beside it in the WBS
    // panel and the edit box, and its CCaR's suggestion is named; every other requirement's planted paragraph is not in the tree,
    // so it is flagged as stored, there and in Needs attention's list.
    // v2.12 (integration): planted in the 2026 estimate beside W1's own plants -- the newest estimate is the one the pickers offer
    // (wbsPickKey), so a tree planted in an older set would never be drawn.
    (function(){ var K=ACEDB.sets['2026ACE'], m=K.wbs[mySlug()]=K.wbs[mySlug()]||{};
      m['1']={n:P('wbstop'), lv:1, up:''}; m['1.2']={n:P('wbsname'), lv:2, up:'1'};
      K.lines.push({ap:mySlug(), pmo:'AV', svc:SVC[0], wbs:'1.2', ccar:P('wbsccar'), v:{}}); persistAce(); })();
    S.wbs['NEW-9']=[{w:'1.2', v:[]}]; S.ccar['NEW-9']=P('wbsccar');
    RPDB={ts:Date.now(), entries:[{id:P('rpid'), ap:mySlug(), fy:MS.cur, type:'BTR', svc:0, appn:P('rpappn'), pec:P('rppec'), bpac:P('rpbpac'),
      title:P('rptitle'), amtM:2, dir:'deduct', pool:'disc', status:'Pending', hac:'', sac:''}]}; persistRp();
    try{ flowAddEnt(); flowSetEnt(flowEnts().length-1,'n',P('destname')); flowSetEnt(flowEnts().length-1,'t',P('destterms')); }catch(e){}
    // v2.07 (item 121): the CCaR records list -- a record's title and short description are read into the Add box when its
    // number is typed (the record title shown, the description filled)
    MS.ccarIdx={ts:Date.now(), file:P('ccarfile'), n:1, rows:{JSF9001:{t:P('ccarlisttitle'), o:P('ccaropr'), p:'PSM', k:'9001', s:P('ccarlistdesc'), d:1}}};
    // v2.07 (item 121): A SECOND YEAR, for the Add box's From another year tab: its rows draw that year's titles, events, CCaR
    // and PID numbers, and one brought in that is not complete opens in the New tab filled in from its record. The year on
    // screen's own requirements are listed as already here; an added one of PSM's and one of the hostile office's are not.
    (function(){ var Y=MS.cur-1, ask=SVC.map(function(){ return 30000; });
      var T={order:['R0', 'H'+P('id'), 'R4', 'NEW-1', 'NEW-'+P('yrid'), 'NEW-3'], alloc:{}, mc:{}, removed:[], titles:{}, ccar:{}, pid:{},
        desc:{}, cons:{}, notes:{}, recNames:{}, wbs:{}, dest:{}, budgetAsg:{},
        custom:[{id:'NEW-1', grp:'PSM', sect:'new', custom:true, title:P('yrtitle1'), event:P('yrevent1'), ccar:'', fy26:SVC.map(function(){ return 0; }), ask:ask.slice(), alloc:null},
                {id:'NEW-'+P('yrid'), grp:'PSM', sect:'new', custom:true, title:P('yrtitle2'), event:P('yrevent2'), ccar:'', fy26:SVC.map(function(){ return 0; }), ask:ask.slice(), alloc:null},
                {id:'NEW-3', grp:P('grp'), sect:'new', custom:true, title:P('yrtitle3'), event:P('yrevent3'), ccar:'', fy26:SVC.map(function(){ return 0; }), ask:ask.slice(), alloc:null}],
        discSvc:SVC.map(function(){ return 0; }), mandSvc:SVC.map(function(){ return 0; })};
      T.titles.R0=P('yrrename0'); T.ccar.R0=P('yrccar0');
      T.ccar['NEW-1']=P('yrccar1'); T.pid['NEW-1']=P('yrpid1'); T.desc['NEW-1']=P('yrdesc1'); T.cons['NEW-1']=P('yrcons1');
      T.notes['NEW-1']=P('yrnote1'); T.recNames['NEW-1']=P('yrrecname1'); T.wbs['NEW-1']=[{w:P('yrwbs1'), v:[]}, {w:P('yrwbs1b'), v:[]}];
      var dk=(flowEnts().filter(function(e){ return String(e.n).indexOf('destname')>=0; })[0]||{}).k||'';
      T.dest['NEW-1']={to:dk, end:dk}; T.budgetAsg['NEW-1']={USAF:'USAF O&M - CAM '+P('baepsm')+' Discretionary PSM'};
      T.ccar['NEW-3']=P('yrccar3'); T.pid['NEW-3']=P('yrpid3');
      MS.years[Y]=T; })();
    // the journal and the save log name people; a person's name is text from another machine
    if(!Array.isArray(MS.jrnl)) MS.jrnl=[];
    MS.jrnl.push({t:Date.now()-5000, by:P('jrnlby'), fy:MS.cur, p:['titles','R0'], a:P('jrnla'), b:P('jrnlb')});
    if(!Array.isArray(MS.log)) MS.log=[];
    MS.log.push({by:P('logby'), ts:Date.now()-9000});
    try{ posTake(P('snapname')); }catch(e){}
    applyState(S); save();
    return String(S.order.length); })()`);
  return { saved: B.ev('buildSavedHtml()'), n: Number(n), board: B };
}

// Run in the page once it is open: a held submittal (submittals are held for the session, not saved, so
// it is taken where the panels will be opened, through the board's own door for one -- pmoTake) and a
// CLIN edit (applyState keeps an edit only for a CLIN the board has, so it is set where the list is live).
export const SETUP = `(function(){ var P=function(t){ return ${JSON.stringify(P('@@'))}.split('@@').join(t); };
  var a0=window.alert, c0=window.confirm; window.alert=function(){}; window.confirm=function(){ return true; };
  try{ pmoTake({spmtPkg:1, dir:'submit', ap:mySlug(), fy:MS.cur, svc:SVC.slice(), by:P('subby'), pmo:'PSM', ts:Date.now(),
    items:{R0:{titles:P('subtitle'), notes:P('subnote'), desc:P('subdesc'), cons:P('subcons')}},
    added:[{nid:'NEW-PSM-1', grp:'PSM', title:P('subnewtitle'), event:P('subnewevent'), ask:SVC.map(function(){ return 1000; })}]}, P('subfile')); }catch(e){}
  try{ S.clinMeta['PRIME-2']={b0:{desc:P('clindesc'), clin:P('clinmetano')}}; render(); }catch(e){}
  window.alert=a0; window.confirm=c0; return 'ok'; })()`;

// What the page says now: every inline handler that mentions __pw (with where it sits), and the text a
// reader can see -- text nodes outside scripts and templates, titles, field values, element ids.
const SCAN = `JSON.stringify((function(){
  var out=[], txt=[];
  var at=function(el){ var a=el.parentElement, path=[];
    while(a && path.length<3){ if(a.id){ path.push('#'+a.id); break; }
      if(a.className && typeof a.className==='string') path.push('.'+a.className.split(' ')[0]); a=a.parentElement; }
    return path.reverse().join(' '); };
  document.querySelectorAll('*').forEach(function(el){ for(var i=0;i<el.attributes.length;i++){ var a=el.attributes[i];
    if(/^on/i.test(a.name) && a.value.indexOf('__pw')>=0) out.push([el.tagName, a.name, a.value, at(el)]);
    // AN ATTRIBUTE CUT SHORT BY A PLANTED QUOTE: the value was written in unescaped, its " ended the attribute, and
    // what followed became markup. A browser shows that as an element; jsdom, inside a <select>, drops the element
    // and keeps only the stub -- so the stub is what is looked for: a value ending in a planted tag's first quote.
    else if(!/^on/i.test(a.name) && /[A-Za-z0-9]'$/.test(a.value) && a.value.indexOf('__pw')<0)
      out.push([el.tagName, a.name, a.value+' (cut short)', at(el)]); } });
  var tw=document.createTreeWalker(document.body, 4, null), t;
  while((t=tw.nextNode())){ var p=t.parentElement; if(p && /^(SCRIPT|STYLE|TEMPLATE)$/.test(p.tagName)) continue; txt.push(t.nodeValue); }
  document.querySelectorAll('[title]').forEach(function(e){ txt.push(e.getAttribute('title')); });
  document.querySelectorAll('input,textarea,select').forEach(function(e){ txt.push(e.value||''); });
  document.querySelectorAll('[id]').forEach(function(e){ txt.push(e.id); });
  return {h:out, t:txt.join('\\n')}; })())`;

// Panels whose opener needs a context -- the same list tools/panels-render.mjs keeps.
const SPECIAL = {
  matPanel: `matOpen=true; matBody();`, rollPanel: `rollOpen=true; rollBody();`, editPanel: `openEdit(S.order[0], 'rec');`,
  wbsPanel: `toggleWbs('req', S.order[0], '');`, subPanel: `subOpenReview();`,
  ndPanel: `ndOpen=true; render();`, helpPanel: `openHelp('');`,
  // v2.00 (menu, 19 Oct): the left menu's three boxes close by uiImpClose / uiRepClose / uiDataClose; each opens as its entry opens it
  uiImpPanel: `uiImpOpen();`, uiRepPanel: `uiRepOpen();`, uiDataPanel: `uiDataOpen();`,
  // v2.12 (item 132): the cost estimate import's report, for the planted estimate; and the mapping box, asking about a file whose
  // name, sheet and headers are hostile (the box lists the file's own headers)
  aceRepPanel: `aceRepShow('2026ACE');`,
  aceColPanel: `aceColAsk(${JSON.stringify({ file: P('acecolfile'), key: '2026ACE', sheets: {}, H: { sheet: P('acecolsheet'), row: 2, rowNo: null,
    hdr: ['Level', P('acecolhdr')], sig: 'x', need: ['wbs', 'roll'], col: {}, how: {}, years: {} } })});`,
  // v2.12 W2 (item 132): Needs attention's list of WBS paragraphs the estimate does not hold -- every planted paragraph, as stored
  // (its backdrop's own function only closes it, so the list was never drawn in the sweep)
  attPanel: `attShow('wbsx');`,
};
const tryIt = code => `(function(){ try{ ${code} }catch(e){} return 'ok'; })()`;
// v2.07 (item 121): the Add box is open while arOpen says so -- render() puts its class back -- so it is closed by its own code
const CLOSE = tryIt(`document.querySelectorAll('.modal-bg').forEach(function(e){ e.className='modal-bg'; });
  document.querySelectorAll('.menu.open').forEach(function(m){ m.classList.remove('open'); });
  if(typeof arOn==='function' && arOn()) arHide();
  if(typeof erOn==='function' && erOn()) erClose();`);

// NOT HOLLOW: a field that was planted and never drawn proves nothing about how it is drawn. Each of these
// must be seen somewhere in the sweep as the text it is. (The BAE list's first row is planted under 'name', which the
// board never reads -- budReg() reads 'n' -- so it reaches no screen; it is kept as it was. The two planted under 'n'
// since v2.07 are offered whole by the Add box and the RECORD panel, and are below.)
export const MUST_SHOW = ['id', 'svc', 'grp', 'title0', 'event0', 'rename1', 'note1', 'desc1', 'cons1', 'recname1', 'ccar1',
  'pid1', 'ce1', 'wbs1', 'bandname', 'clindesc', 'clinnewdesc', 'customtitle', 'aceset', 'destname',
  'jrnlby', 'subtitle', 'subnewtitle', 'snapname', 'bmadd',
  // v2.07 (item 121): the Add box -- the budget names it offers each office (these two are offered whole, as the list holds
  // them), the CCaR list's record title and description read in when a number is typed, and another year's rows: a here
  // row's renamed title, an added one's plan event, CCaR and PID, the hostile office's, and one filled in to finish
  'baepsm', 'baegrp', 'ccarlisttitle', 'ccarlistdesc', 'yrrename0', 'yrevent1', 'yrccar1', 'yrpid1', 'yrevent2', 'yrevent3',
  'yrccar3', 'yrdesc1', 'yrcons1', 'yrrecname1', 'baefile',
  // v2.12 (item 132): the cost estimate import's report and mapping box, and the tie-out's lines nothing claims
  'acefile', 'aceby', 'acesheet', 'acecoltitle', 'acebyval', 'acenamedwbs', 'acenamedwhat', 'aceconfcode', 'aceconfname', 'aceconfalso',
  'acece', 'acecolfile', 'acecolsheet', 'acecolhdr',
  // v2.12 RV1: the row counts named when an estimate's report cannot be read (its rows, lines and years are never drawn: they are
  // not numbers, so the report is said to be unreadable -- and the sweep fails if any of them becomes an element)
  'aceskipv',
  // v2.12 W2 (item 132): the estimate's WBS names, drawn beside the paragraph they name, and the CCaR its suggestion is for
  'wbstop', 'wbsname', 'wbsccar'];

// Open everything, reading the page after each step. `run(code)` evaluates a JavaScript expression in
// the page and returns its value; `settle()` lets the page's next turn run (an <img onerror> fires then).
export async function hostileSweep(run, settle = async () => {}) {
  const found = new Map(), shown = new Set();
  const look = async (where) => {
    await settle();
    const r = JSON.parse(await run(SCAN));
    for (const m of r.t.matchAll(/onerror=__pw\('([^']+)'\)/g)) shown.add(m[1]);
    for (const [tag, name, v, loc] of r.h) if (callsPw(v) || / \(cut short\)$/.test(v)) {
      const t = (/__pw\(\\?'([^'\\]*)\\?'\)/.exec(v) || /([A-Za-z0-9]+)' \(cut short\)$/.exec(v) || [])[1] || '?';
      const k = t + ' @ ' + loc;
      if (!found.has(k)) found.set(k, `${where}: <${tag.toLowerCase()} ${name}="${v.slice(0, 60)}"> in ${loc}`);
    }
  };
  await run(SETUP);
  await look('the board');
  const ids = JSON.parse(await run('JSON.stringify(S.order.slice())'));
  for (const id of ids) {
    const q = JSON.stringify(id), w = id.slice(0, 12);
    await run(tryIt(`setCur(${q});`)); await look(`requirement ${w}`);
    await run(tryIt(`toggleRowMenu(${q}, {stopPropagation:function(){}});`)); await look(`row menu ${w}`);
    await run(tryIt(`rowMenuId=null; render();`));
    // v2.08 (item 122): the edit box holds the record, the written fields included (the pop-ups and Requirement edit went)
    await run(tryIt(`openEdit(${q}, 'rec');`)); await look(`edit box ${w}`); await run(CLOSE);
    await run(tryIt(`toggleWbs('req', ${q}, '');`)); await look(`WBS ${w}`);
    await run(tryIt(`wbsOpen=null; render();`)); await run(CLOSE);
  }
  await run(tryIt(`toggleClin('PRIME-2');`)); await look('the CLIN drill');
  await run(tryIt(`clinOpen={}; render();`));
  const panels = JSON.parse(await run(`JSON.stringify([].slice.call(document.querySelectorAll('.modal-bg')).map(function(el){
    var m=(el.getAttribute('onclick')||'').match(/([A-Za-z_$][\\w$]*)\\s*\\(\\s*\\)/); return {id:el.id, fn:m? m[1] : null}; }))`));
  let opened = 0;
  for (const { id, fn } of panels) {
    if (id === 'addPanel') continue;                 // swept step by step below
    const setup = SPECIAL[id] || (fn ? `${fn}();` : null); if (!setup) continue;
    await run(tryIt(setup)); await look(`panel ${id}`); await run(CLOSE); opened++;
  }
  // v2.07 (item 121): THE ADD BOX, the whole way through. Opened bare it asks only for the office -- the strip's old opener,
  // 'toggleAdd();', reached nothing else -- so it is opened for an office chosen at the top (PSM) and for the hostile office
  // chosen in the box, with values typed so each service's budget names are offered, a CCaR number from the records list
  // typed, a destination that is not a prime chosen so the OGC fields show, Add pressed early and with a code over its
  // limit (each refusal is said inside the box), then From another year: the other year's rows for each office, two
  // incomplete ones ticked and brought in, each filled in to finish, and skipped.
  const G = JSON.stringify(P('grp')), HY = JSON.stringify('NEW-' + P('yrid'));
  const fill = `arEl('arV0').value='1,000'; arEl('arV1').value='2,000'; arUpdate();
    var dk=(flowEnts().filter(function(e){ return String(e.n).indexOf('destname')>=0; })[0]||{}).k||'';
    arPt('OGC'); arEl('arTo').value=dk; arUpdate(); arEl('arEnd').value=dk; arEl('arMipr').value='direct';
    var o=[].filter.call(arEl('arB0').options, function(x){ return x.value; })[0]; if(o) arEl('arB0').value=o.value; arUpdate();`;
  const BOX = [
    ['the Add box: which office', `setPmoFilter('ALL'); if(arOn()) arHide(); toggleAdd();`],
    ['the Add box: PSM, chosen at the top', `arHide(); setPmoFilter('PSM'); toggleAdd(); ${fill}
      arEl('arCcar').value='JSF9001'; arCcarTyped();`],
    ['the Add box: PSM, Add pressed early', `arAdd(false);`],
    ['the Add box: PSM, a code over its limit', `arEl('arPid').value=${JSON.stringify(P('boxpid') + 'x'.repeat(40))}; arAdd(false);`],
    ['the Add box: the hostile office, chosen in the box', `arHide(); setPmoFilter('ALL'); toggleAdd(); arSetOffice(${G}); ${fill}`],
    ['the Add box: the hostile office, from another year', `arTab('yr'); naFromPick(String(MS.cur-1)); naFromTick('NEW-3', true);`],
    ['the Add box: PSM, from another year', `arHide(); setPmoFilter('PSM'); toggleAdd(); arTab('yr'); naFromPick(String(MS.cur-1));
      naFromTick('NEW-1', true); naFromTick(${HY}, true);`],
    ['the Add box: finishing one brought in', `naFromAdd();`],
    ['the Add box: the next one to finish', `arSkip();`],
  ];
  for (const [w, s] of BOX) { await run(tryIt(s)); await look(w); }
  await run(tryIt(`arHide(); setPmoFilter('ALL');`)); opened++;
  // v2.12 (item 132): the tie-out's list of the estimate lines nothing claims, for the planted 2026 estimate
  for (const s of ['rmOpen=true; render();']) { await run(tryIt(s)); await look(s); }
  // v2.12 (item 132): the tie-out's list of the estimate lines nothing claims, for the planted 2026 estimate
  await run(tryIt(`spAce='2026ACE'; aceOnly='orph'; aceOpen=true; render();`)); await look('the ACE tie-out: lines nothing claims');
  await run(tryIt(`aceOpen=false; aceOnly=''; render();`)); await run(CLOSE);
  // v2.12 RV1: the import report of the estimate whose report is not ORBIT's shape (the Data card draws its line on every look)
  await run(tryIt(`aceRepShow('2025ACE');`)); await look('the import report that cannot be read'); await run(tryIt(`aceRepClose();`)); await run(CLOSE);
  const menus = JSON.parse(await run(`JSON.stringify([].slice.call(document.querySelectorAll('.menu[id^="m_"]')).map(function(e){ return e.id.slice(2); }))`));
  for (const k of menus) { await run(tryIt(`toggleMenu(${JSON.stringify(k)});`)); await look(`menu ${k}`); await run(CLOSE); }
  // v2.00 (menu, 19 Oct): what the toolbar's Reports & exports, Data, Setup and File menus held is on the LEFT MENU: its boxes
  // are swept with the panels above, and each of its flyouts is opened here as a menu was -- Setup with each folded group open
  const flys = JSON.parse(await run(`JSON.stringify(typeof UI_FLY!=='undefined'? UI_FLY.slice() : [])`));
  for (const k of flys) {
    const q = JSON.stringify(k);
    await run(tryIt(`uiFlyOpen(${q}, document.getElementById('uiNav_'+${q}));`)); await look(`left menu ${k}`);
    const gs = JSON.parse(await run(`JSON.stringify([].slice.call(document.querySelectorAll('#uiFly .gh')).map(function(h){ return h.getAttribute('data-g'); }))`));
    for (const g of gs) { await run(tryIt(`menuGrpOpen[${q}]=${JSON.stringify(g)}; syncBtns();`)); await look(`left menu ${k} › ${g}`); }
    await run(tryIt(`uiFlyClose();`));
  }
  return { found, shown, unseen: MUST_SHOW.filter(t => !shown.has(t)), ids: ids.length, panels: opened, menus: menus.length + flys.length };
}
