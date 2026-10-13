import json, io, zipfile, xml.etree.ElementTree as ET
from pathlib import Path
p=Path('packages.json'); packages=json.loads(p.read_text()); errors=[]; rows=[]
for item in packages:
 with zipfile.ZipFile(io.BytesIO(bytes(item['bytes']))) as z:
  parts=[]
  for name in z.namelist():
   raw=z.read(name)
   if name.endswith(('.xml','.rels')):
    try: ET.fromstring(raw)
    except ET.ParseError as e: errors.append({'label':item['label'],'name':name,'error':str(e)})
    parts.append(name)
  rows.append({'label':item['label'],'parts':parts,'xml_count':len(parts)})
result={'packages':len(rows),'xml_parts':sum(x['xml_count'] for x in rows),'errors':errors,'rows':rows}
Path('independent-xml-results.json').write_text(json.dumps(result,indent=2)+'\n'); print(json.dumps({k:result[k] for k in ['packages','xml_parts','errors']})); raise SystemExit(bool(errors))
