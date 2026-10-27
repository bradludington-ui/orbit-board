# One invented data model for both mock-ups (no real figures). Whole dollars, as the board keeps them.
import random
YEARS=[2027,2028,2029,2030,2031,2032]; SUMY=[2028,2029,2030,2031,2032]
APPNS=[('om','O&M','O&M','O&M'), ('ff','PROCUREMENT','Prod Support','Procurement'), ('sp','INITIAL SPARES','Initial Spares','Initial Spares')]
SVCS=['USAF','ANG','AFRC','STOVL','USMC-C','USN']
GROUPS=[('USAF','USAF CTOL','USAF F-35A',['USAF','ANG','AFRC']),('STOVL','USMC STOVL','USMC F-35B',['STOVL']),
        ('USMC CV','USMC CV','USMC F-35C',['USMC-C']),('USN CV','USN CV','USN F-35C',['USN'])]
ACE='2025 ACE'; CYC='BES28'
rnd=random.Random(20261027)
base={'om':{'USAF':1900,'ANG':260,'AFRC':140,'STOVL':980,'USMC-C':310,'USN':720},
      'ff':{'USAF':640,'ANG':0,'AFRC':0,'STOVL':330,'USMC-C':95,'USN':260},
      'sp':{'USAF':520,'ANG':40,'AFRC':25,'STOVL':290,'USMC-C':120,'USN':240}}
ace={}; disc={}; mand={}
for a,_,_,_ in APPNS:
  ace[a]={}; disc[a]={}; mand[a]={}
  for s in SVCS:
    ace[a][s]={}; disc[a][s]={}; mand[a][s]={}
    for i,y in enumerate(YEARS):
      b=base[a][s]*(1+0.045*i)*(1+rnd.uniform(-0.06,0.06))
      v=int(round(b*1e6/1000))*1000
      ace[a][s][y]=v
      fund=rnd.uniform(0.80,1.02) if y>2027 else rnd.uniform(0.70,0.92)
      tot=int(round(v*fund/1000))*1000
      m=int(round(tot*rnd.uniform(0.05,0.12)/1000))*1000 if y==2027 else 0
      disc[a][s][y]=tot-m; mand[a][s][y]=m
intlReq={a:{y:0 for y in YEARS} for a,_,_,_ in APPNS}
intlFund={a:{y:0 for y in YEARS} for a,_,_,_ in APPNS}
def ssum(d, a, svcs, y): return sum(d[a][s][y] for s in svcs)
def yrs(f): return [f(y) for y in YEARS]+[sum(f(y) for y in SUMY)]
def pct(n,d): return (n/d) if d else None
