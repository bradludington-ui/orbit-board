from pathlib import Path
import hashlib,json,time,datetime
from zoneinfo import ZoneInfo
root=Path(__file__).resolve().parents[2]
out=Path(__file__).resolve().parent
start=time.monotonic();started=datetime.datetime.now(ZoneInfo("America/New_York")).isoformat()
expected={
"inputs/recovery/v200/codex-handoff/README.md":"c2429dd177f6da5462605677a398ea7324b102f8",
"inputs/recovery/v200/UNRESOLVED-LEDGER.md":"456ccd2bc12e1376492e901bf399f3e1f144d1c0",
"inputs/recovery/v200/STATUS-2026-10-13.md":"78f88fc487e8a71636c7afa1dd319f9b3c198379",
"base/prioritization-board-grid.html":"fce8a391bd8a248d5185e199d22190c1687eaea0"}
rows=[]
for path,sha in expected.items():
 b=(root/path).read_bytes();blob=hashlib.sha1(b"blob "+str(len(b)).encode()+b"\0"+b).hexdigest()
 assert blob==sha,(path,sha,blob)
 rows.append({"path":path,"bytes":len(b),"git_blob_sha1":blob,"sha256":hashlib.sha256(b).hexdigest(),"result":"matches pinned source"})
font=root/"base/tools/font-standin.mjs";b=font.read_bytes()
rows.append({"path":"base/tools/font-standin.mjs","bytes":len(b),"git_blob_sha1":hashlib.sha1(b"blob "+str(len(b)).encode()+b"\0"+b).hexdigest(),"sha256":hashlib.sha256(b).hexdigest(),"result":"inspected as text only; unchanged"})
result={"input_commit":"3e38ac8323fa984fe0612fd00475f07c0495219c","base_commit":"7ee498a46507972f803cd48ce9f27d5d668acb63","started_ET":started,"finished_ET":datetime.datetime.now(ZoneInfo("America/New_York")).isoformat(),"duration_seconds":time.monotonic()-start,"exit_status":0,"command":"timeout 30 python3 -I C2/logs/verify_source_identities.py","verified_pinned_files":4,"text_only_font_contracts_inspected":1,"fresh_application_runtime_tests":0,"files":rows}
(out/"final-source-receipts.json.txt").write_text(json.dumps(result,indent=2)+"\n")
print(json.dumps(result,indent=2))
