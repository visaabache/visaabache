import numpy as np, wave, sys, json
cues=json.load(open(sys.argv[2]));T=lambda i:cues[i][0]
sr=44100;dur=61.6;N=int(sr*dur);t=np.arange(N)/sr;out=np.zeros(N);rng=np.random.default_rng(21)
def add(start,sig):
    i=int(start*sr);n=min(len(sig),N-i)
    if n>0 and i>=0: out[i:i+n]+=sig[:n]
def tone(f,length,amp,decay,harm=(1,.3,.1)):
    tt=np.arange(int(length*sr))/sr;env=np.exp(-tt*decay)*np.minimum(1,tt/.004)
    return amp*env*sum(h*np.sin(2*np.pi*f*(k+1)*tt) for k,h in enumerate(harm))
def lp(n,k):
    for _ in range(2): n=np.convolve(n,np.ones(k)/k,mode='same')
    return n
def whoosh(s,L=.6,amp=.09): n=lp(rng.standard_normal(int(L*sr)),25);tt=np.arange(len(n))/sr;add(s,amp*n*np.sin(np.pi*tt/L)**2)
def sweep(a,b,f0,f1,amp):
    m=(t>=a)&(t<b);x=(t[m]-a)/(b-a);ph=2*np.pi*np.cumsum(f0+(f1-f0)*x)/sr;out[m]+=amp*np.sin(ph)*np.sin(np.pi*x)
def ding(s,f,amp=.05,L=1.2): add(s,tone(f,L,amp,3.5))
# plane flyby (filtered engine hum)
def jet(a,b,amp):
    L=b-a;n=lp(rng.standard_normal(int(L*sr)),60);tt=np.arange(len(n))/sr;add(a,amp*6*n*np.sin(np.pi*tt/L))
jet(.1,T(3)+1.2,.05);jet(T(20),T(21),.04);jet(T(21)+.4,T(22)+1.0,.04)
for s in (T(5),T(7)): whoosh(s,.4,.05)
for k in range(30): add(T(6)+k*.04,tone(2400,.02,.02,150,(1,)))
for k in range(30): add(T(8)+k*.04,tone(2600,.02,.02,150,(1,)))
ding(T(9),1318.5,.06);add(T(9)+.08,tone(1975.5,1.0,.04,4))
sweep(T(11),T(11)+1.4,220,120,.05)          # stretch
whoosh(T(13)+.1,1.6,.10);sweep(T(13)+.2,T(15)+1.0,180,520,.03)  # wrap
whoosh(T(16)-.1,1.2,.07);ding(T(18)+.4,1046.5,.05)
add(T(19)+2.2,tone(196,1.6,.08,3,(1,.6,.4,.25)))   # string twang when tight
ding(T(23),1318.5,.06)
whoosh(W2:=T(24)+.75,1.3,.09)
for k in range(3): add(T(25)+.2+k*.9,tone(880,.15,.04,14))
sweep(T(27)+.2,T(28)+.9,600,260,.04)          # greenland shrinking slide
add(T(29),tone(48,1.8,.28,2,(1,.4)));ding(T(29)+.05,987.8,.05)
whoosh(T(31)-.1,1.4,.09)
for k,f in enumerate((523.25,659.25,783.99,1046.5)): add(T(32)+k*.08,tone(f,1.6,.04,2.2))
add(T(32)+2.0,tone(880,.12,.06,18));add(T(32)+2.08,tone(1320,.15,.05,16))
# curious light music, 96 bpm
beat=60/96;prog_=[[220.0,261.63,329.63],[174.61,220.0,261.63],[261.63,329.63,392.0],[196.0,246.94,293.66]]
k=0;s=0.0
while s<dur-.8:
    ch=prog_[(k//8)%4];add(s,tone(ch[k%3]*2,.4,.016,7,(1,.25)))
    if k%2==0: add(s,tone(ch[0]/2,.5,.04,5,(1,.4,.1)))
    if k%4==0: add(s,tone(58,.18,.05,25,(1,)))
    k+=1;s+=beat/2
out*=np.minimum(1,(dur-t)/.8);out=np.clip(out,-1,1)
w=wave.open(sys.argv[1],'wb');w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((out*32000).astype('<i2').tobytes());w.close();print('ok')
