# edit3.py : adds the file-mode chunks (F63, F137) to matrix.sh
p='/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17/matrix.sh'
s=open(p).read()
old='''  *) echo "unknown chunk $1"; exit 2;;'''
assert s.count(old)==1
s=s.replace(old,'''  F63)   B=b63;  S="FBT FBTC FSHd FSHdC"; N="none save putback";;
  F137)  B=c137; S="FBT FBTC FSHd FSHdC"; N="none save putback";;
'''+old)
open(p,'w').write(s); print('ok')
