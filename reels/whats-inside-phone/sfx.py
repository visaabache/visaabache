import numpy as np, wave, sys, json
cues=json.load(open(sys.argv[2]));T=lambda i:cues[i][0]
sr=44100;dur=57.5;N=int(sr*dur);t=np.arange(N)/sr;out=np.zeros(N);rng=np.random.default_rng(9)
def add(start,sig):
    i=int(start*sr);n=min(len(sig),N-i)
    if n>0 and i>=0: out[i:i+n]+=sig[:n]
def tone(f,length,amp,decay,harm=(1,.3,.1)):
    tt=np.arange(int(length*sr))/sr;env=np.exp(-tt*decay)*np.minimum(1,tt/.004)
    return amp*env*sum(h*np.sin(2*np.pi*f*(k+1)*tt) for k,h in enumerate(harm))
def noise(length,amp,decay,k=4):
    n=rng.standard_normal(int(length*sr))
    for _ in range(3): n=np.convolve(n,np.ones(k)/k,mode='same')
    tt=np.arange(len(n))/sr;return amp*n*np.exp(-tt*decay)
def whoosh(s,L=.45,amp=.10):
    n=rng.standard_normal(int(L*sr));n=np.convolve(n,np.ones(30)/30,mode='same');tt=np.arange(len(n))/sr;add(s,amp*n*np.sin(np.pi*tt/L)**2)
def clack(s,amp=.12): add(s,tone(1800,.05,amp*.5,90,(1,.4)));add(s,noise(.04,amp,90,3));add(s,tone(140,.12,amp*.8,35,(1,.5)))
def sweep(a,b,f0,f1,amp):
    m=(t>=a)&(t<b);x=(t[m]-a)/(b-a);ph=2*np.pi*np.cumsum(f0+(f1-f0)*x)/sr;out[m]+=amp*np.sin(ph)*np.sin(np.pi*x)
def ding(s,f=1318.5,amp=.05): add(s,tone(f,1.2,amp,3.5))
whoosh(.2,.6,.12)
for i in range(4): whoosh(T(1)+i*.22,.4,.07)
ARR=[T(9),T(12),T(15),T(17)+.05,T(20)+.1,T(21)+.1,T(21)+1.05,T(22)+.05,T(22)+.3,T(23)]
for a in ARR: whoosh(a-.05,.4,.08);clack(a+.38)
for s in (T(17)-.75,T(21)-.7,T(24)-.35): whoosh(s,.7,.09)
for s in np.arange(T(8),T(9)-.2,.45): add(s,tone(2093,.25,.035,14,(1,.2)))
sweep(T(9)+1.3,T(9)+2.3,300,900,.035)
ding(T(11),987.8,.05);add(T(11)+.12,tone(1318.5,.8,.04,4))
for s in (T(14)+.8,T(18)+.1): sweep(s,s+.35,1800,600,.04);whoosh(s,.35,.05)
add(T(16)+3.2,tone(180,.35,.06,6,(1,.6,.4)))
add(T(16)+4.2,noise(.05,.15,80,2));add(T(16)+4.27,noise(.04,.1,90,2));ding(T(16)+4.3,1568,.045)
for k in range(10): add(T(19)+k*.08,tone(2093*(1+.06*k),.3,.022,10))
add(T(20)+3.4,tone(320,.08,.08,40,(1,.3)));sweep(T(20)+3.42,T(20)+4.8,900,1600,.02)
m=(t>=T(21)+.5)&(t<T(21)+1.0);out[m]+=.04*np.sign(np.sin(2*np.pi*150*t[m]))
add(T(21)+1.5,tone(660,.15,.05,12));add(T(21)+1.65,tone(880,.15,.05,12))
for k,f in enumerate((523.25,659.25,783.99,1046.5,1318.5)): add(T(24)+k*.07,tone(f,1.6,.045,2.2))
add(T(27),tone(880,.12,.06,18));add(T(27)+.08,tone(1320,.15,.05,16))
# upbeat light music, 100 bpm
beat=.6;prog_=[[261.63,329.63,392.0],[196.0,246.94,293.66],[220.0,261.63,329.63],[174.61,220.0,261.63]]
k=0;s=0.0
while s<dur-.8:
    ch=prog_[(k//8)%4];add(s,tone(ch[k%3]*2,.4,.018,7,(1,.25)))
    if k%2==0: add(s,tone(ch[0]/2,.5,.04,5,(1,.4,.1)));add(s,tone(60,.18,.06,25,(1,)))
    if k%4==2: add(s,noise(.06,.03,50,2))
    k+=1;s+=beat/2
out*=np.minimum(1,(dur-t)/.8);out=np.clip(out,-1,1)
w=wave.open(sys.argv[1],'wb');w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((out*32000).astype('<i2').tobytes());w.close();print('ok')
