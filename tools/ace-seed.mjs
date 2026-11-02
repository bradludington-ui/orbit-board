// v2.12 (item 132): THE COST ESTIMATE IMPORT'S TWO BOXES, put on a board for the browser checks to measure -- the same state
// for panels-render, dialogs-keyboard, standards-check, layout-fits P and keyboard-reach S, so each check measures one box.
//
// ACE_REP_SEED puts a 2026 estimate on the board as the import builds it: lines with the 2026 fields, a WBS tree, and an import
// report carrying every reason with rows and dollars by year, named rows (some with long text, as the 2026 file's own rows read),
// a conflicting name and a remembered column. ACE_COL_ASK opens the mapping box for a file in the 2026 layout whose two titles
// were renamed, listing that file's own headers. Both are page code (a string, evaluated in the board).
export const ACE_HDR_2026 = ['Index', 'Sub Index', 'PALS/O&S', '$ Type', 'US/PTN/FMS', 'Service', 'T/M/S', 'Roll-up Flag', 'JPO Managed',
  'Shared/Unique', 'Share Type', 'Cost Allocation Rule', 'Primary Requirement Driver', 'Govt/LM/PW', 'Labor/Material', 'Contract Requirement',
  'Bi/Multilat', 'Budget Element (US Only)', 'Appropriation (US Only)', 'Support Line Category', 'CCAR Element', 'CCAR Budget',
  'CCAR Description', 'PMO', 'Owning IPT', 'Work Breakdown Structure', 'Level', 'CES1', 'CES2', 'CES3', 'CES4', 'CES5', 'CES6', 'CES7', 'CES8',
  2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 'Account Family (PALS or O&S)'];

export const ACE_REP_SEED = `(function(){
  var Y=[2024,2025,2026,2027,2028,2029,2030,2031], vy=function(b){ var o={}; Y.forEach(function(y,i){ o[y]=b+i*1013; }); return o; };
  var add=function(t, o){ Object.keys(o).forEach(function(y){ t[y]=(t[y]||0)+o[y]; }); return t; };
  var R={}, total={}, kept=vy(812345671);
  [['dtype',3,90000001],['rollup',412,3400000001],['blank',38,170000001],['milpers',22,61000001],['partner',57,250000001],
   ['jpo',130,93000001],['svcmgd',211,1250000001],['pmo',2,4000001],['slc',4,7000001],['pals',3,1000001],['svc',1,500001]].forEach(function(x){
     R[x[0]]={rows:x[1], v:vy(x[2]), by:[]}; add(total, R[x[0]].v); });
  R.dtype.by=[['CY$',2], ['BY$ FY24',1]]; R.pmo.by=[['Owning IPT Sustainment Engineering',2]]; R.slc.by=[['Modifications',3], ['RDT&E Support',1]];
  R.svc.by=[['USMC',1]]; add(total, kept);
  var named=[];
  for(var i=0;i<38;i++) named.push({k:'blank', row:400+i, wbs:'1.'+(i%7+1)+'.'+(i%3+1), what:'Rollup Value? “No”', v:vy(1000000+i)});
  named.push({k:'pmo', row:1205, wbs:'2.4.1.1', what:'Owning IPT Sustainment Engineering', v:vy(2000001)});
  named.push({k:'slc', row:1311, wbs:'P4.2.1', what:'Modifications', v:vy(3000001)});
  named.push({k:'pals', row:1402, wbs:'P8.2', what:'O&S with Airframe PGSE', v:vy(400001)});
  named.push({k:'svc', row:1500, wbs:'1.8.2', what:'USMC / F-35A', v:vy(500001)});
  named.push({k:'p', row:1601, wbs:'P1.4', what:'O&S', v:vy(600001)});
  named.push({k:'level', row:1702, wbs:'1.3.1', what:'Level 4, the paragraph has 3 segments', v:vy(700001)});
  named.push({k:'depot', row:1803, wbs:'P6.6.1', what:'Maintenance Systems · CES2 Organic Depot Activation Planning and Site Survey', v:vy(800001)});
  var map={}; [['wbs','Work Breakdown Structure','Z'],['lv','Level','AA'],['ces1','CES1','AB'],['svc','Service','F'],['tms','T/M/S','G'],
    ['jpo','JPO Managed','I'],['dtype','$ Type','D'],['roll','Roll-up Flag','H'],['slc','Support Line Category','T'],['pals','Account Family (PALS or O&S)','AR'],
    ['appus','Appropriation (US Only)','S'],['pmo','PMO','X']].forEach(function(x){ map[x[0]]={t:x[1], c:x[2], how:(x[0]==='roll'||x[0]==='pals')? 'remembered' : 'title'}; });
  var v=vy(812345671);
  ACEDB.sets['2026ACE']={label:'2026ACE', ts:Date.now(), years:Y, locked:true, by:'Cost', file:'2026 SUST ACE COMPLETE Detail File.xlsx',
    appn:{om:{tot:v, pmo:{AV:v}, svc:{USAF:v}}},
    lines:[{ap:'om', pmo:'AV', svc:'USAF', wbs:'1.2.1.1', lv:4, ce:'', slc:'O&S', ccar:'JSF5594', cdesc:'Sustainment operations', sub:'', v:v}],
    wbs:{om:{'1':{n:'Unit-Level Manpower', lv:1, up:''}, '1.2':{n:'Unit-Level Maintenance', lv:2, up:'1'}, '1.2.1':{n:'Organizational Maintenance', lv:3, up:'1.2'},
      '1.2.1.1':{n:'Officer', lv:4, up:'1.2.1'}}},
    rep:{v:1, file:'2026 SUST ACE COMPLETE Detail File.xlsx', sheet:'PMO Database Output', row:3, sheets:['Cover','Notes','PMO Database Output'], years:Y,
      map:map, absent:['ces6','ces7','ces8','usptn'], reasons:R, named:named, kept:{rows:4021, lines:3988, zero:33, v:kept}, total:{rows:4901, v:total},
      notData:12, types:[['CY$',2], ['BY$ FY24',1]], tree:{om:1412, ff:388, sp:61, opn:24},
      conflicts:[{ap:'om', code:'1.2', n:'Unit-Level Maintenance', also:[{n:'Unit Level Maint.', rows:[1412, 1499]}]},
        {ap:'ff', code:'P6.2.2', n:'Propulsion', also:[{n:'Propulsion Depot Standup (CONUS, organic and contract performed)', rows:[2211]}]}], ties:true}};
  ACEDB.ts=Date.now(); spAce='2026ACE'; })(); `;

export const ACE_COL_CTX = JSON.stringify({ file: '2026 SUST ACE COMPLETE Detail File.xlsx', key: '2026ACE', sheets: {},
  H: { sheet: 'PMO Database Output', row: 2, rowNo: null, hdr: ACE_HDR_2026, sig: 'panels', need: ['roll', 'pals'], col: {}, how: {}, years: {} } });
export const ACE_COL_ASK = `aceColAsk(${ACE_COL_CTX});`;
