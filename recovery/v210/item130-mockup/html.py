import sys, html; sys.path.insert(0, sys.argv[1])
from model import *
def M(v):
  if v is None: return '—'
  m=round(v/1e6); s='${:,}'.format(abs(m))
  return '<span class="neg">('+s+')</span>' if m<0 else s
def P(v): return '—' if v is None else '{:.0f}%'.format(v*100)
def row(label, vals, cls='', kind='m', inp=False):
  tds=''.join('<td>'+('<input class="intl" value="$0" aria-label="'+html.escape(label)+' '+('FY%02d'%(YEARS[i]%100) if i<len(YEARS) else 'total')+'">' if (inp and i<len(YEARS)) else (P(v) if kind=='p' else M(v)))+'</td>' for i,v in enumerate(vals))
  return '<tr class="'+cls+'"><th>'+html.escape(label)+'</th>'+tds+'</tr>'
yh=''.join('<th>FY%02d</th>'%(y%100) for y in YEARS)+'<th>FY%02d-%02d</th>'%(SUMY[0]%100,SUMY[-1]%100)
def summary():
  out='<table class="dc"><thead><tr class="top"><th class="tp">(TY$M) Total Position</th><th colspan="7" class="navy">Delta from '+CYC+'</th></tr><tr class="navy"><th>Appropriation</th>'+yh+'</tr></thead><tbody>'
  tot={k:{y:0 for y in YEARS} for k in ('us','ir','d','m','if')}
  for a,title,req,ctl in APPNS:
    us=lambda y: ssum(ace,a,SVCS,y); ir=lambda y: intlReq[a][y]; dd=lambda y: ssum(disc,a,SVCS,y); mm=lambda y: ssum(mand,a,SVCS,y); fi=lambda y: intlFund[a][y]
    out+='<tr class="band"><th colspan="8">'+title+'</th></tr>'
    out+=row(ACE+' '+(req if a!='om' else 'O&M')+' Required', yrs(lambda y: us(y)+ir(y)), 'b')
    out+=row(ACE+' - '+req+' Req - US Only', yrs(us), 'sub')
    out+=row(ACE+' - International Req Total', yrs(ir), 'sub in', inp=True)
    out+=row(CYC+' '+req+' Controls', yrs(lambda y: dd(y)+mm(y)), 'b')
    out+=row('Discretionary', yrs(dd), 'i'); out+=row('Mandatory', yrs(mm), 'i')
    out+=row('International Funding', yrs(fi), 'b in', inp=True)
    out+=row('Delta ('+ACE+' vs '+CYC+')', yrs(lambda y: dd(y)+mm(y)+fi(y)-us(y)-ir(y)), 'delta')
    F=yrs(lambda y: dd(y)+mm(y)+fi(y)); A=yrs(lambda y: us(y)+ir(y)); out+=row('% Funded', [pct(f,x) for f,x in zip(F,A)], 'pc', 'p')
    out+='<tr class="gap"><td colspan="8"></td></tr>'
    for y in YEARS:
      tot['us'][y]+=us(y); tot['ir'][y]+=ir(y); tot['d'][y]+=dd(y); tot['m'][y]+=mm(y); tot['if'][y]+=fi(y)
  T=lambda k: (lambda y: tot[k][y])
  out+='<tr class="navyband"><th colspan="8">F-35 Sustainment - Total DoD</th></tr>'
  out+=row(ACE+' Required Funding', yrs(lambda y: tot['us'][y]+tot['ir'][y]), 'b')
  out+=row('Requirement - US Only', yrs(T('us')), 'sub'); out+=row('International Requirement Total', yrs(T('ir')), 'sub')
  out+=row(CYC+' Approved Funding', yrs(lambda y: tot['d'][y]+tot['m'][y]), 'b')
  out+=row('Discretionary', yrs(T('d')), 'i'); out+=row('Mandatory', yrs(T('m')), 'i')
  out+=row('International Approved Funding', yrs(T('if')), 'b')
  out+=row('DoD Delta ('+ACE+' vs '+CYC+')', yrs(lambda y: tot['d'][y]+tot['m'][y]+tot['if'][y]-tot['us'][y]-tot['ir'][y]), 'delta')
  F=yrs(lambda y: tot['d'][y]+tot['m'][y]+tot['if'][y]); A=yrs(lambda y: tot['us'][y]+tot['ir'][y]); out+=row('% Funded ('+CYC+')', [pct(f,x) for f,x in zip(F,A)], 'pc', 'p')
  return out+'</tbody></table>'
def service(svcs, air):
  out='<table class="dc svc"><thead><tr class="svchdr"><th>'+air+' TY$M</th>'+yh+'</tr></thead><tbody>'
  ta={y:0 for y in YEARS}; td={y:0 for y in YEARS}; tm={y:0 for y in YEARS}
  for a,title,req,ctl in APPNS:
    us=lambda y: ssum(ace,a,svcs,y); dd=lambda y: ssum(disc,a,svcs,y); mm=lambda y: ssum(mand,a,svcs,y)
    out+=row(ACE+' - '+req+' Req', yrs(us), 'b'); out+=row(CYC+' Controls', yrs(lambda y: dd(y)+mm(y)), 'b')
    out+=row('Discretionary', yrs(dd), 'i'); out+=row('Mandatory', yrs(mm), 'i')
    out+=row(air+' Delta', yrs(lambda y: dd(y)+mm(y)-us(y)), 'delta')
    F=yrs(lambda y: dd(y)+mm(y)); A=yrs(us); out+=row('% Funded', [pct(f,x) for f,x in zip(F,A)], 'pc', 'p')
    out+='<tr class="sep"><td colspan="8"></td></tr>'
    for y in YEARS: ta[y]+=us(y); td[y]+=dd(y); tm[y]+=mm(y)
  out+=row(ACE+' - Total Sustainment', yrs(lambda y: ta[y]), 'b'); out+=row(CYC+' Controls', yrs(lambda y: td[y]+tm[y]), 'b')
  out+=row('Discretionary', yrs(lambda y: td[y]), 'i'); out+=row('Mandatory', yrs(lambda y: tm[y]), 'i')
  out+=row(air+' Delta', yrs(lambda y: td[y]+tm[y]-ta[y]), 'delta')
  F=yrs(lambda y: td[y]+tm[y]); A=yrs(lambda y: ta[y]); out+=row('% Funded', [pct(f,x) for f,x in zip(F,A)], 'pc', 'p')
  return out+'</tbody></table>'
tabs=[('sum','Summary — all services','F-35 Sustainment Summary',ACE+' / '+CYC, summary())]+[(k.replace(' ','').lower(), k, 'F-35 Sustainment', CYC+' Service Detail – '+t, service(s,air)) for k,t,air,s in GROUPS]
tabbtns=''.join('<button type="button" class="tab'+(' on' if i==0 else '')+'" aria-pressed="'+('true' if i==0 else 'false')+'" onclick="show(\''+t[0]+'\', this)">'+html.escape(t[1])+'</button>' for i,t in enumerate(tabs))
panes=''.join('<section id="p-'+t[0]+'" class="pane"'+('' if i==0 else ' hidden')+'><h2>'+t[2]+'</h2><h3>'+html.escape(t[3])+'</h3>'+t[4]+'<p class="foot">October 2026 / Sustainment Finance / PSM</p></section>' for i,t in enumerate(tabs))
page='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>FYDP Disconnects mock-up</title><style>
:root{--bg:#e9edf2;--panel:#ffffff;--ink:#1d2733;--mut:#46505e;--edge:#627185;--gold:#b07a1a}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.4 "Segoe UI",Arial,sans-serif}
.note{max-width:1180px;margin:14px auto 0;padding:8px 14px;background:#fff7e0;border:1px solid #e0c27a;border-radius:6px;font-size:13px}
.box{max-width:1180px;margin:14px auto 30px;background:var(--panel);border:1px solid var(--edge);border-radius:8px;box-shadow:0 6px 24px rgba(0,0,0,.12)}
.hd{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #d5dbe3}
.hd h1{font-size:18px;margin:0;flex:1}.crumb{font-size:12px;color:var(--mut)}
.x{border:1px solid var(--edge);background:#fff;border-radius:4px;min-width:28px;min-height:28px;cursor:pointer}
.ctl{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end;padding:10px 16px;border-bottom:1px solid #e3e7ec}
.ctl label{font-size:12px;color:var(--mut);display:flex;flex-direction:column;gap:3px}
select,button.act{font:inherit;border:1px solid var(--edge);border-radius:4px;padding:4px 8px;background:#fff;min-height:28px}
button.act.pri{background:#1F3864;color:#fff;border-color:#1F3864;font-weight:600}
.sp{flex:1}.tabs{display:flex;gap:6px;padding:10px 16px 0;flex-wrap:wrap}
.tab{font:inherit;border:1px solid var(--edge);border-bottom:none;background:#f3f5f8;border-radius:6px 6px 0 0;padding:6px 12px;cursor:pointer;min-height:28px}
.tab.on{background:#fff;font-weight:600;box-shadow:inset 0 3px 0 var(--gold)}
.pane{padding:14px 16px 18px;border-top:1px solid var(--edge);overflow-x:auto}
.pane h2{text-align:center;font:700 26px Arial,sans-serif;margin:4px 0 0}.pane h3{text-align:center;font:700 21px Arial,sans-serif;margin:2px 0 12px}
table.dc{border-collapse:collapse;font:12.5px Arial,sans-serif;min-width:900px;width:100%}
.dc th,.dc td{border:1px solid #808080;padding:3px 7px}.dc td{text-align:right;white-space:nowrap}.dc tbody th{text-align:left;font-weight:400;white-space:nowrap}
.dc tr.top th{border:none}.dc th.tp{font-size:10px;text-align:left;font-weight:700}
.dc .navy th,.dc th.navy{background:#1F3864;color:#fff;font-weight:700;text-align:center}.dc .navy th:first-child{text-align:left}
.dc tr.band th{background:#8DB4E2;color:#fff;font-weight:700;text-align:left}
.dc tr.navyband th{background:#1F3864;color:#fff;font-weight:700;text-align:left}
.dc tr.b th,.dc tr.b td{font-weight:700}.dc tr.sub th{padding-left:22px}.dc tr.i th{font-style:italic;padding-left:22px}.dc tr.i td{font-style:italic}
.dc tr.delta th,.dc tr.delta td{border-top:2px solid #000}.neg{color:#c00000}
.dc tr.gap td{border:none;height:10px}.dc tr.sep td{background:#404040;height:7px;padding:0}
.dc tr.svchdr th{background:#9BC2E6;color:#000;font-weight:700;text-align:center}.dc tr.svchdr th:first-child{text-align:left}
.dc tr.in td{background:#fffbe6}input.intl{width:76px;text-align:right;font:inherit;border:1px solid var(--edge);border-radius:3px;padding:2px 4px;background:#fff;min-height:22px}
.foot{color:#595959;margin:10px 0 0;font:12px Arial,sans-serif}
.legend{font-size:12px;color:var(--mut);padding:0 16px 14px}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#1b2230;--panel:#232c3b;--ink:#e6ebf2;--mut:#b5bfcc;--edge:#8794a8}.note{background:#3a3220;border-color:#8a7440;color:#f3e3c0}.tab{background:#2b3446;color:var(--ink)}.tab.on{background:var(--panel)}.x,select,button.act{background:#2b3446;color:var(--ink)}.pane{background:#fff;color:#000}}
</style></head><body>
<div class="note"><b>Mock-up, invented figures.</b> How <i>FYDP Disconnects</i> would look in ORBIT. The tables keep a white page in every theme, because they are what the Excel export prints. Light-yellow rows on the Summary are the two International plug-ins.</div>
<div class="box" role="dialog" aria-label="FYDP Disconnects">
<div class="hd"><h1>FYDP Disconnects</h1><span class="crumb">FYDP ▸ FYDP Disconnects</span><button class="x" type="button" aria-label="Close">✕</button></div>
<div class="ctl">
<label>Cost estimate<select><option>2025 ACE (imported 14 Oct 2026)</option><option>2026 ACE</option></select></label>
<label>PPBE controls<select><option>BES28 — positions logged for O&amp;M, Full Fund, Spares</option><option>PB27</option></select></label>
<label>Years<select><option>FY27–FY32 · FYDP FY28–FY32</option></select></label>
<span class="sp"></span><button type="button" class="act pri">⬇ Export to Excel (5 sheets)</button></div>
<div class="tabs" role="group" aria-label="Slide">'''+tabbtns+'''</div>'''+panes+'''
<p class="legend">Money in TY$M on screen; the workbook keeps whole dollars and only displays millions, so every total foots. Delta = funding − requirement: short shows red in parentheses. % Funded = funding ÷ requirement. ANG and AFRC count in USAF. OPN is not included.</p>
</div>
<script>function show(id, b){document.querySelectorAll('.pane').forEach(p=>p.hidden=(p.id!=='p-'+id));document.querySelectorAll('.tab').forEach(t=>{t.classList.toggle('on',t===b);t.setAttribute('aria-pressed',t===b?'true':'false');});}</script>
</body></html>'''
open(sys.argv[2],'w',encoding='utf-8').write(page); print('saved', sys.argv[2])
