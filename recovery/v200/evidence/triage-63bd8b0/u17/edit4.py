# edit4.py : the contract's literal alternatives name EVERY content of the fixtures ([n, true, n] for each), not only the
# route's two -- a record clean against a third copy that holds what is on screen (BRAD-1 in BTC/FBTC) satisfies the contract.
p='/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L4/u17/src/body.mjs'
s=open(p).read()
old="[[FAM.X, true, FAM.X], [FAM.Y, true, FAM.Y], [t[0], false, t[2]]], 'contract')"
assert s.count(old)==2
s=s.replace(old,"[...CONSISTENT, [t[0], false, t[2]]], 'contract')")
anchor="const falselyCleanOf = t => t[1] === true && t[0] !== t[2];"
assert s.count(anchor)==1
s=s.replace(anchor, anchor+"\n// recorded clean is allowed only against a copy holding what is on screen: every named content, literally\nconst CONSISTENT = [...KNOWN.map(([n]) => [n, true, n]), ['F1', true, 'F1']];")
open(p,'w').write(s); print('ok')
