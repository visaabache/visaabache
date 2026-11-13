import numpy as np, wave, sys, json
cues=json.load(open(sys.argv[2]));T=lambda i:cues[i][0]
sr=44100;dur=52.5;N=int(sr*dur);t=np.arange(N)/sr;out=np.zeros(N);rng=np.random.default_rng(11)
def add(start,sig):
    i=int(start*sr);n=min(len(sig),N-i)
    if n>0 and i>=0: out[i:i+n]+=sig[:n]
def tone(f,length,amp,decay,harm=(1,.3,.1)):
    tt=np.arange(int(length*sr))/sr;env=np.exp(-tt*decay)*np.minimum(1,tt/.004)
    return amp*env*sum(h*np.sin(2*np.pi*f*(k+1)*tt) for k,h in enumerate(harm))
def lp(n,k):
    for _ in range(2): n=np.convolve(n,np.ones(k)/k,mode='same')
    return n
def noise(length,amp,decay,k=4):
    n=lp(rng.standard_normal(int(length*sr)),k);tt=np.arange(len(n))/sr;return amp*n*np.exp(-tt*decay)
def whoosh(s,L=.5,amp=.10):
    n=lp(rng.standard_normal(int(L*sr)),25);tt=np.arange(len(n))/sr;add(s,amp*n*np.sin(np.pi*tt/L)**2)
def rumble(s,L,amp): tt=np.arange(int(L*sr))/sr;n=lp(rng.standard_normal(len(tt)),120);add(s,amp*8*n*np.sin(np.pi*tt/L))
def crowd(a,b,amp):
    L=b-a;n=rng.standard_normal(int(L*sr));band=lp(n,5)-lp(n,40);tt=np.arange(len(band))/sr
    env=np.minimum(1,tt/.6)*np.minimum(1,(L-tt)/.8)*(0.75+.25*np.sin(tt*2.1)*np.sin(tt*.7));add(a,amp*band*env)
def ding(s,f,amp=.05,L=1.2): add(s,tone(f,L,amp,3.5))
def clank(s,amp=.14): add(s,tone(420,.8,amp*.5,5,(1,.7,.5,.3)));add(s,tone(1130,.6,amp*.3,6,(1,.4)));add(s,noise(.06,amp,60,3))
# hook
crowd(0,2.6,.20);whoosh(.05,.9,.10);rumble(T(1),1.6,.05)
for k in range(4): whoosh(T(1)+k*.25,.4,.05)
# map
add(T(2),tone(600,.1,.05,30));add(T(2)+.45,tone(150,.35,.07,6,(1,.6,.4)));whoosh(T(3)+.2,.8,.07);ding(T(3)+1.0,1318.5);add(T(3)+1.08,tone(1975.5,.9,.03,4))
# foundations: pile thuds
for i in range(10): s=T(4)+i*.24;add(s,tone(70,.25,.16,18,(1,.5)));add(s,noise(.05,.06,60,4))
rumble(T(4),2.6,.03)
# tiers + facade
for s in (T(5)+.15,T(6),T(6)+.7,T(7)): rumble(s,1.0,.06);add(s+.75,tone(90,.3,.14,14,(1,.6,.3)))
# seats counter clicks
for k in range(60): s=T(8)+k*.055;add(s,tone(2200+k*12,.03,.025,120,(1,)))
for k in range(5): add(T(9)+2.0+k*.5,tone(1900 if k%2 else 1500,.05,.05,60,(1,.3)))
# tent flap + roof drop
add(T(12),noise(.25,.10,12,3));add(T(12)+.15,noise(.18,.07,14,3));whoosh(T(13)-.05,.9,.11);clank(T(13)+.7)
# pitch, lights, trees
whoosh(T(14),.8,.08)
for k in range(3): add(T(14)+1.1+k*.12,tone(110,.2,.12,20,(1,.6)))
m=(t>=T(14)+1.1)&(t<T(15));out[m]+=.012*np.sin(2*np.pi*100*t[m])
for k in range(12): add(T(14)+2.0+k*.08,tone(700+rng.random()*500,.12,.03,22))
# coins
for k in range(18): add(T(16)+k*.07+rng.random()*.03,tone(3200+rng.random()*1200,.25,.025,14,(1,.5)))
# banners flap
for k in range(3): add(T(17)+2.2+k*.8,noise(.3,.08,10,3))
# 2030 boom + cheer, fireworks
add(T(18),tone(45,2.0,.30,1.8,(1,.4)));crowd(T(18),DUR:=dur-.3,.24)
for i in range(16):
    s=T(19)+i*.38;add(s,noise(.08,.14,50,2));add(s+.02,tone(180,.3,.06,12,(1,.5)))
    for c in range(6): add(s+.1+rng.random()*.6,noise(.02,.05,120,1))
ding(T(20),1046.5,.05,2.0);ding(T(20)+.08,1568,.04,2.0)
add(T(22),tone(880,.12,.06,18));add(T(23),tone(1320,.15,.06,16))
# music: uplifting D major, 110 bpm
beat=60/110;prog_=[[293.66,369.99,440.0],[246.94,293.66,369.99],[196.0,246.94,293.66],[220.0,277.18,329.63]]
k=0;s=0.0
while s<dur-.8:
    big=1.0+(.6 if s>T(18) else 0)-(.5 if T(2)<s<T(4) else 0);ch=prog_[(k//8)%4]
    add(s,tone(ch[k%3]*2,.35,.016*big,8,(1,.25)))
    if k%2==0: add(s,tone(ch[0]/2,.5,.045*big,5,(1,.4,.1)));add(s,tone(55,.2,.08*big,22,(1,)))
    if k%4==2: add(s,noise(.07,.035*big,45,2))
    k+=1;s+=beat/2
out*=np.minimum(1,(dur-t)/.8);out=np.clip(out,-1,1)
w=wave.open(sys.argv[1],'wb');w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((out*32000).astype('<i2').tobytes());w.close();print('ok')
