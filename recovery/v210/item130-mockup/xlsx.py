import sys; sys.path.insert(0, sys.argv[1])
from model import *
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
NAVY='1F3864'; BAND='8DB4E2'; SVCHDR='9BC2E6'; SEP='404040'; GRID='808080'
MONEY='$#,##0,,;[Red]($#,##0,,)'; PCT='0%'
thin=Side(style='thin', color=GRID); med=Side(style='medium', color='000000')
def fill(c): return PatternFill('solid', start_color=c, end_color=c)
def put(ws, r, label, vals, bold=False, ital=False, indent=0, kind='money', topline=False, fillc=None, white=False, size=11):
  c=ws.cell(r,1,label); c.font=Font(name='Arial', bold=bold, italic=ital, size=size, color='FFFFFF' if white else '000000')
  c.alignment=Alignment(indent=indent, vertical='center')
  for j,v in enumerate(vals):
    x=ws.cell(r,2+j,v); x.font=Font(name='Arial', bold=bold, italic=ital, size=size, color='FFFFFF' if white else '000000')
    x.number_format=PCT if kind=='pct' else MONEY; x.alignment=Alignment(horizontal='right', vertical='center')
  for j in range(1, 2+len(YEARS)+1):
    cell=ws.cell(r,j); cell.border=Border(left=thin,right=thin,top=med if topline else thin,bottom=thin)
    if fillc: cell.fill=fill(fillc)
def band(ws, r, text, color, white=True, size=11, h=None):
  for j in range(1, 2+len(YEARS)+1):
    c=ws.cell(r,j); c.fill=fill(color); c.border=Border(left=thin,right=thin,top=thin,bottom=thin)
  c=ws.cell(r,1,text); c.font=Font(name='Arial', bold=True, size=size, color='FFFFFF' if white else '000000')
  if h: ws.row_dimensions[r].height=h
def heads(ws, r, first, color, white):
  vals=[first]+['FY%02d'%(y%100) for y in YEARS]+['FY%02d-%02d'%(SUMY[0]%100, SUMY[-1]%100)]
  for j,v in enumerate(vals):
    c=ws.cell(r,1+j,v); c.fill=fill(color); c.font=Font(name='Arial', bold=True, color='FFFFFF' if white else '000000')
    c.alignment=Alignment(horizontal='left' if j==0 else 'center'); c.border=Border(left=thin,right=thin,top=thin,bottom=thin)
def titles(ws, t1, t2):
  ws.merge_cells(start_row=1,start_column=1,end_row=1,end_column=8); ws.merge_cells(start_row=2,start_column=1,end_row=2,end_column=8)
  a=ws.cell(1,1,t1); a.font=Font(name='Arial', bold=True, size=26); a.alignment=Alignment(horizontal='center')
  b=ws.cell(2,1,t2); b.font=Font(name='Arial', bold=True, size=22); b.alignment=Alignment(horizontal='center')
  ws.row_dimensions[1].height=36; ws.row_dimensions[2].height=30
  ws.column_dimensions['A'].width=52
  for j in range(2,9): ws.column_dimensions[get_column_letter(j)].width=13
def footer(ws, r): ws.cell(r,1,'October 2026 / Sustainment Finance / PSM').font=Font(name='Arial', size=12, color='595959')
wb=Workbook(); ws=wb.active; ws.title='Summary'
titles(ws, 'F-35 Sustainment Summary', ACE+' / '+CYC)
ws.cell(4,1,'(TY$M) Total Position').font=Font(name='Arial', bold=True, size=9)
ws.merge_cells(start_row=4,start_column=2,end_row=4,end_column=8)
d=ws.cell(4,2,'Delta from '+CYC); d.fill=fill(NAVY); d.font=Font(name='Arial', bold=True, color='FFFFFF'); d.alignment=Alignment(horizontal='center')
for j in range(2,9): ws.cell(4,j).fill=fill(NAVY)
heads(ws, 5, 'Appropriation', NAVY, True)
r=6; tot={k:{y:0 for y in YEARS} for k in ('us','ir','d','m','if')}
for a,title,req,ctl in APPNS:
  band(ws, r, title, BAND); r+=1
  us=lambda y: ssum(ace,a,SVCS,y); ir=lambda y: intlReq[a][y]; dd=lambda y: ssum(disc,a,SVCS,y); mm=lambda y: ssum(mand,a,SVCS,y); fi=lambda y: intlFund[a][y]
  put(ws, r, ACE+' '+(req if a!='om' else 'O&M')+' Required', yrs(lambda y: us(y)+ir(y)), bold=True); r+=1
  put(ws, r, ACE+' - '+req+' Req - US Only', yrs(us), indent=2); r+=1
  put(ws, r, ACE+' - International Req Total', yrs(ir), indent=2); r+=1
  put(ws, r, CYC+' '+req+' Controls', yrs(lambda y: dd(y)+mm(y)), bold=True); r+=1
  put(ws, r, 'Discretionary', yrs(dd), ital=True, indent=2); r+=1
  put(ws, r, 'Mandatory', yrs(mm), ital=True, indent=2); r+=1
  put(ws, r, 'International Funding', yrs(fi), bold=True); r+=1
  put(ws, r, 'Delta ('+ACE+' vs '+CYC+')', yrs(lambda y: dd(y)+mm(y)+fi(y)-us(y)-ir(y)), topline=True); r+=1
  F=yrs(lambda y: dd(y)+mm(y)+fi(y)); A=yrs(lambda y: us(y)+ir(y))
  put(ws, r, '% Funded', [pct(f,x) for f,x in zip(F,A)], kind='pct'); r+=2
  for y in YEARS:
    tot['us'][y]+=us(y); tot['ir'][y]+=ir(y); tot['d'][y]+=dd(y); tot['m'][y]+=mm(y); tot['if'][y]+=fi(y)
band(ws, r, 'F-35 Sustainment - Total DoD', NAVY); r+=1
T=lambda k: (lambda y: tot[k][y])
put(ws, r, ACE+' Required Funding', yrs(lambda y: tot['us'][y]+tot['ir'][y]), bold=True); r+=1
put(ws, r, 'Requirement - US Only', yrs(T('us')), indent=2); r+=1
put(ws, r, 'International Requirement Total', yrs(T('ir')), indent=2); r+=1
put(ws, r, CYC+' Approved Funding', yrs(lambda y: tot['d'][y]+tot['m'][y]), bold=True); r+=1
put(ws, r, 'Discretionary', yrs(T('d')), ital=True, indent=2); r+=1
put(ws, r, 'Mandatory', yrs(T('m')), ital=True, indent=2); r+=1
put(ws, r, 'International Approved Funding', yrs(T('if')), bold=True); r+=1
put(ws, r, 'DoD Delta ('+ACE+' vs '+CYC+')', yrs(lambda y: tot['d'][y]+tot['m'][y]+tot['if'][y]-tot['us'][y]-tot['ir'][y]), topline=True); r+=1
F=yrs(lambda y: tot['d'][y]+tot['m'][y]+tot['if'][y]); A=yrs(lambda y: tot['us'][y]+tot['ir'][y])
put(ws, r, '% Funded ('+CYC+')', [pct(f,x) for f,x in zip(F,A)], kind='pct'); r+=2
footer(ws, r)
for key,ttl,air,svcs in GROUPS:
  ws=wb.create_sheet(key); titles(ws, 'F-35 Sustainment', CYC+' Service Detail – '+ttl)
  heads(ws, 4, air+' TY$M', SVCHDR, False); r=5
  ta={y:0 for y in YEARS}; td={y:0 for y in YEARS}; tm={y:0 for y in YEARS}
  for a,title,req,ctl in APPNS:
    us=lambda y: ssum(ace,a,svcs,y); dd=lambda y: ssum(disc,a,svcs,y); mm=lambda y: ssum(mand,a,svcs,y)
    put(ws, r, ACE+' - '+req+' Req', yrs(us), bold=True); r+=1
    put(ws, r, CYC+' Controls', yrs(lambda y: dd(y)+mm(y)), bold=True); r+=1
    put(ws, r, 'Discretionary', yrs(dd), ital=True, indent=2); r+=1
    put(ws, r, 'Mandatory', yrs(mm), ital=True, indent=2); r+=1
    put(ws, r, air+' Delta', yrs(lambda y: dd(y)+mm(y)-us(y)), topline=True); r+=1
    F=yrs(lambda y: dd(y)+mm(y)); A=yrs(us)
    put(ws, r, '% Funded', [pct(f,x) for f,x in zip(F,A)], kind='pct'); r+=1
    band(ws, r, '', SEP, h=9); r+=1
    for y in YEARS: ta[y]+=us(y); td[y]+=dd(y); tm[y]+=mm(y)
  put(ws, r, ACE+' - Total Sustainment', yrs(lambda y: ta[y]), bold=True); r+=1
  put(ws, r, CYC+' Controls', yrs(lambda y: td[y]+tm[y]), bold=True); r+=1
  put(ws, r, 'Discretionary', yrs(lambda y: td[y]), ital=True, indent=2); r+=1
  put(ws, r, 'Mandatory', yrs(lambda y: tm[y]), ital=True, indent=2); r+=1
  put(ws, r, air+' Delta', yrs(lambda y: td[y]+tm[y]-ta[y]), topline=True); r+=1
  F=yrs(lambda y: td[y]+tm[y]); A=yrs(lambda y: ta[y])
  put(ws, r, '% Funded', [pct(f,x) for f,x in zip(F,A)], kind='pct'); r+=2
  footer(ws, r)
for w in wb.worksheets:
  w.page_setup.orientation='landscape'; w.sheet_properties.pageSetUpPr.fitToPage=True; w.page_setup.fitToWidth=1; w.page_setup.fitToHeight=1
  w.sheet_view.showGridLines=False
wb.save(sys.argv[2]); print('saved', sys.argv[2])
