import numpy as np, wave, sys, json
L=json.load(open(sys.argv[2]));A=lambda i:L[i-1][0];B=lambda i:L[i-1][1];F=lambda i,f:A(i)+(B(i)-A(i))*f
sr=48000;dur=73.8;N=int(sr*dur);t=np.arange(N)/sr;out=np.zeros(N);rng=np.random.default_rng(8)
def add(start,sig):
    i=int(start*sr);n=min(len(sig),N-i)
    if n>0 and i>=0: out[i:i+n]+=sig[:n]
def tone(f,length,amp,decay,harm=(1,.3,.1),att=.005):
    tt=np.arange(int(length*sr))/sr;env=np.exp(-tt*decay)*np.minimum(1,tt/att)
    return amp*env*sum(h*np.sin(2*np.pi*f*(k+1)*tt) for k,h in enumerate(harm))
def lp(n,k):
    for _ in range(2): n=np.convolve(n,np.ones(k)/k,mode='same')
    return n
def whoosh(s,L=.8,amp=.05): n=lp(rng.standard_normal(int(L*sr)),40);tt=np.arange(len(n))/sr;add(s,amp*n*np.sin(np.pi*tt/L)**2*4)
def swell(a,b,amp):
    m=(t>=a)&(t<b);x=(t[m]-a)/(b-a);n=lp(rng.standard_normal(m.sum()),30)*3;out[m]+=amp*n*x**2+amp*.6*np.sin(2*np.pi*(110+220*x)*t[m])*x**2
def impact(s,amp=.25): add(s,tone(42,3.0,amp,1.4,(1,.5,.25)));add(s,lp(rng.standard_normal(int(.25*sr)),6)*.08)
def chime(s,f=1318.5,amp=.035): add(s,tone(f,2.2,amp,2.2,(1,.2)));add(s+.03,tone(f*1.5,1.8,amp*.5,2.6,(1,)))
# warm drone bed (D minor), slowly breathing; lifts to D major after the reveal
for f,a in ((73.42,.05),(110.0,.03),(146.83,.02)):
    out+=a*np.sin(2*np.pi*f*t)*(0.7+0.3*np.sin(2*np.pi*t/9.0))*np.minimum(1,t/2.5)
# soft piano motif
notes=[293.66,349.23,440.0,523.25,440.0,349.23];s=.4;k=0
while s<dur-2:
    big=s>F(10,.24);f=notes[k%6]*(1.0 if not big else (1.26 if notes[k%6]==349.23 else 1.0))
    add(s,tone(f,2.8,.028,1.6,(1,.25,.08)));
    if k%6==0: add(s,tone(f/2,3.5,.03,1.0,(1,.3)))
    k+=1;s+=.95
# transitions
for i in (3,6,7,8,9,10,11,12,13): whoosh(A(i)-.25,.7,.035)
# ruler ticks while measuring shadows
for i in (7,8):
    for k in range(10): add(A(i)+.8+k*.1,tone(2600,.02,.018,200,(1,)))
# checks
chime(F(3,.72),1046.5);chime(F(5,.75));chime(F(10,.72),1568)
# build to the 40,000 km reveal
swell(A(10),F(10,.25),.05);impact(F(10,.25))
# eclipse + clocks
chime(A(12)+.8,880,.03);for_t=[F(12,.48),F(12,.74)]
for s2 in for_t: add(s2,tone(1760,.08,.03,30,(1,)));add(s2+.12,tone(1320,.1,.025,30,(1,)))
# end
chime(A(13)+.5,1046.5,.03)
out*=np.minimum(1,(dur-t)/1.2);out=np.clip(out,-1,1)
w=wave.open(sys.argv[1],'wb');w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((out*32000).astype('<i2').tobytes());w.close();print('ok')
