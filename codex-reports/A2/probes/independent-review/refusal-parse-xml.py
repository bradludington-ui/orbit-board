import json, io, zipfile, xml.etree.ElementTree as ET
from pathlib import Path
items=json.loads(Path('refusal-packages.json').read_text()); errors=[]; rows=[]; ns={'x':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
for item in items:
 with zipfile.ZipFile(io.BytesIO(bytes(item['bytes']))) as z:
  docs={};parts=[]
  for name in z.namelist():
   if name.endswith(('.xml','.rels')):
    try:docs[name]=ET.fromstring(z.read(name))
    except ET.ParseError as e:errors.append({'label':item['label'],'name':name,'error':str(e)})
    parts.append(name)
  sh=docs['xl/worksheets/sheet1.xml']; gotcell=sh.find('x:sheetData/x:row/x:c/x:is/x:t',ns).text
  gotsheet=docs['xl/workbook.xml'].find('x:sheets/x:sheet',ns).get('name')
  gotfmt=docs['xl/styles.xml'].findall('x:numFmts/x:numFmt',ns)[-1].get('formatCode')
  if [gotcell,gotsheet,gotfmt]!=[item['value'],item['sheetName'],item['value']]: errors.append({'label':item['label'],'got':[gotcell,gotsheet,gotfmt],'want':[item['value'],item['sheetName'],item['value']]})
  rows.append({'label':item['label'],'xml_parts':len(parts),'exact':not errors})
result={'packages':len(rows),'xml_parts':sum(x['xml_parts'] for x in rows),'errors':errors,'rows':rows};Path('refusal-independent-xml-results.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:result[k] for k in ['packages','xml_parts','errors']}));raise SystemExit(bool(errors))
