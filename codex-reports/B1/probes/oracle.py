# Independent integer arithmetic, fixtures and expected literals transcribed by hand.
# No import of, execution of, or expectations requested from the ORBIT board.
import json
from pathlib import Path
from fractions import Fraction
steps=[]
def split(t,w,label):
    if not any(w): w=[1]*len(w)
    den=sum(w);q=[t*v//den for v in w];r=[t*v%den for v in w];n=t-sum(q);order=sorted(range(len(w)),key=lambda i:(-r[i],i));result=q[:]
    for i in order[:n]:result[i]+=1
    steps.append(dict(label=label,total=t,weights=w,denominator=den,floors=q,remainders=r,leftover=n,recipient_indices=order[:n],result=result))
    return result

def parts(a,d,m,w,label):
    ask=split(a,w,label+' ask');disc=split(d,ask,label+' disc');left=[x-y for x,y in zip(ask,disc)];mand=split(m,left,label+' mand');unf=[x-y for x,y in zip(left,mand)]
    return dict(ask=ask,disc=disc,mand=mand,unfunded=unf,short=[x-y for x,y in zip(ask,disc)])

# A order MxS / AV / TSS / PRIMES
arows={
'USAF':(3,[1,2,3,0],[1,1,1,0]),
'ANG':(9,[1,2,3,0],[2,3,4,0]),
'AFRC':(999999999,[1,2,3,0],[166666667,333333333,499999999,0]),
'STOVL':(250000000,[1499958,241499956,357000087,0],[624982,100624982,148750036,0]),
'USMC-C':(3,[1,1,1,3],[1,1,0,1]),
'USN':(3,[1,0,2,3],[1,0,1,1]),
'CV':(5,[0,0,0,1],[0,0,0,5])}
for svc,(t,w,want) in arows.items():assert split(t,w,'A '+svc)==want
atot=[sum(row[2][i] for row in arows.values()) for i in range(4)]
assert atot==[167291654,433958320,648750041,7]
assert sum(atot)==1250000022

# B order TSS / AV / MxS / PRIMES. Expected ask and lane parts per service.
br={
'USAF':(3,3,0,[1,2,3,0],[[1,1,1,0],[1,1,1,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]),
'ANG':(5,5,0,[1,2,3,0],[[1,2,2,0],[1,2,2,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]),
'AFRC':(9,3,3,[1,2,3,0],[[2,3,4,0],[1,1,1,0],[1,1,1,0],[0,1,2,0],[1,2,3,0]]),
'STOVL':(7,7,0,[0,0,0,1],[[0,0,0,7],[0,0,0,7],[0,0,0,0],[0,0,0,0],[0,0,0,0]]),
'USMC-C':(100,100,0,[1,2,3,0],[[17,33,50,0],[17,33,50,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]])}
B={}
for svc,(a,d,m,w,want) in br.items():
    got=parts(a,d,m,w,'B '+svc);assert list(got.values())==want;B[svc]=got
btot={k:[sum(v[k][i] for v in B.values()) for i in range(4)] for k in B['USAF']}
assert btot==dict(ask=[21,39,57,7],disc=[20,37,54,7],mand=[1,1,1,0],unfunded=[0,1,2,0],short=[1,2,3,0])
bfund=[x+y for x,y in zip(btot['disc'],btot['mand'])];assert bfund==[21,38,55,7]
# Source lines apportion each funded lane independently by CLIN asks, not total ask first.
source_b=[sum(split(d,[1,2,3],'B source '+svc+' disc')[i]+split(m,[1,2,3],'B source '+svc+' mand')[i] for svc,(a,d,m,w,want) in br.items() if svc!='STOVL') for i in range(3)]
assert source_b==[21,38,55]

C=[Fraction(21,2)*Fraction(v,6) for v in [1,2,3]];assert C==[Fraction(7,4),Fraction(7,2),Fraction(21,4)]

D={}
for svc,a,d,m in [('USAF',3,3,0),('ANG',9,9,0),('AFRC',3,0,3)]:D[svc]=parts(a,d,m,[1,2,3],'D '+svc)
dtot={k:[sum(v[k][i] for v in D.values()) for i in range(3)] for k in D['USAF']}
assert dtot==dict(ask=[4,5,6],disc=[3,4,5],mand=[1,1,1],unfunded=[0,0,0],short=[1,1,1])
assert split(3,[2,1,3],'E grouped offices')==[1,1,1]
assert split(3,[1,1,1,3,0],'E source CLINs')==[1,1,0,1,0]

F={'USAF':parts(9,3,3,[1,2,3],'F USAF'),'ANG':parts(3,0,0,[1,2,3],'F ANG')}
ftot={k:[sum(v[k][i] for v in F.values()) for i in range(3)] for k in F['USAF']}
assert ftot==dict(ask=[3,4,5],disc=[1,1,1],mand=[1,1,1],unfunded=[1,2,3],short=[2,3,4])
assert split(779153421,[881836554,575398923,101071365],'G budget exact half')==[440918277,287699462,50535682]

out=dict(A=dict(rows={k:v[2] for k,v in arows.items()},totals=atot,source={'0010':167291654,'0002':433958320,'0008':648750041,'0001':2,'no CLIN':5}),B=dict(services=B,totals=btot,funded=bfund,source={'0008':21,'0002':38,'0010':55,'no CLIN':7}),C=[str(x) for x in C],D=dict(services=D,totals=dtot,planA=[3,4,5],planB=[4,5,6],source={'0010':4,'0002':5,'0008':6}),E=dict(offices=[1,1,1],source={'0002':1,'0010':1,'0008':1}),F=dict(services=F,totals=ftot),G=[440918277,287699462,50535682],quotient_remainder_steps=steps)
Path(__file__).with_name('arithmetic.json').write_text(json.dumps(out,indent=2)+'\n')
print('All manually transcribed expected figures verified independently; '+str(len(steps))+' integer quotient/remainder steps. No ORBIT expected helper used.')
