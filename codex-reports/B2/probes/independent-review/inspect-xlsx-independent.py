import pathlib,zipfile,xml.etree.ElementTree as E,json,hashlib,time,datetime
p=pathlib.Path('/workspace/orbit-round2-20261013-1331ET/B2/runtime-only');out=pathlib.Path('/workspace/orbit-round2-20261013-1331ET/B2-review/logs');start=datetime.datetime.now(datetime.timezone.utc);t=time.monotonic();N={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'};R='http://schemas.openxmlformats.org/package/2006/relationships';records=[]
for f in sorted(p.glob('*.xlsx')):
 label=f.name.split('-',1)[0]
 if label not in ('base','snapshot'):continue
 combo='11111 / AAAAA' if any(x in f.name for x in ('duplicate-K1','ordinary-K1')) else '22222 / BBBBB' if 'single-__none__-assigned' in f.name else '— no RCN/EEIC assigned —'
 with zipfile.ZipFile(f) as z:
  w=E.fromstring(z.read('xl/workbook.xml'));rels={x.attrib['Id']:x.attrib['Target'] for x in E.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
  sh=next(x for x in w.findall('m:sheets/m:sheet',N) if x.attrib['name']=='RCN-EEIC by Month');q=E.fromstring(z.read('xl/'+rels[sh.attrib['{'+N['r']+'}id']]))
  shared=[]
  if 'xl/sharedStrings.xml' in z.namelist(): shared=[''.join(x.itertext()) for x in E.fromstring(z.read('xl/sharedStrings.xml'))]
  rows=[]
  for r in q.findall('m:sheetData/m:row',N):
   rr={}
   for c in r.findall('m:c',N):
    col=''.join(x for x in c.attrib['r'] if x.isalpha());v=c.find('m:v',N);s=c.find('m:is',N)
    if c.attrib.get('t')=='inlineStr': val=''.join(s.itertext())
    elif c.attrib.get('t')=='s':val=shared[int(v.text)]
    elif v is not None:val=int(v.text) if '.' not in v.text else float(v.text)
    else: val=''
    rr[col]=val
   rows.append(rr)
  first=[];service=''
  for r in rows:
   a=r.get('A','')
   if a=='WHICH REQUIREMENTS SIT UNDER EACH COMBINATION':break
   if a in ('USAF','ANG','AFRC'):service=a;continue
   if isinstance(r.get('O'),(int,float)):first.append(['ALL' if str(a).endswith('TOTAL BY MONTH') else service,a,r.get('D'),r.get('N'),r.get('O')])
  want=[['USAF',combo,900,0,900],['USAF','USAF TOTAL',900,0,900],['ANG',combo,200,0,200],['ANG','ANG TOTAL',200,0,200],['AFRC','AFRC TOTAL',0,0,0],['ALL','ALL SERVICES — TOTAL BY MONTH',1100,0,1100]]
  totals=[[r.get('O') for r in rows if r.get('A')==s+' TOTAL'] for s in ('USAF','ANG','AFRC')]
  records.append({'file':f.name,'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'topRows':first,'wantedTopRows':want,'topOk':first==want,'bothTotals':totals,'wantedBothTotals':[[900,900],[200,200],[0,0]],'bothOk':totals==[[900,900],[200,200],[0,0]]})
summary={label:{'files':sum(r['file'].startswith(label+'-') for r in records),'checks':2*sum(r['file'].startswith(label+'-') for r in records),'pass':sum(r[k] for r in records if r['file'].startswith(label+'-') for k in ('topOk','bothOk')),'fail':sum(not r[k] for r in records if r['file'].startswith(label+'-') for k in ('topOk','bothOk'))} for label in ('base','snapshot')}
data={'startUTC':start.isoformat(),'finishUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'seconds':time.monotonic()-t,'parser':'Python stdlib zipfile and XML ElementTree; no board reader or arithmetic helper','summary':summary,'records':records};(out/'independent-xml-results.json').write_text(json.dumps(data,indent=2)+'\n');print(json.dumps(summary));raise SystemExit(1 if summary['snapshot']['fail'] else 0)
