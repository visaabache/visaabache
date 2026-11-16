import numpy as np, wave, sys, json
cues=json.load(open(sys.argv[2]));T=lambda i:cues[i][0]
sr=44100;dur=55.2;N=int(sr*dur);t=np.arange(N)/sr;out=np.zeros(N);rng=np.random.default_rng(33)
def add(start,sig):
    i=int(start*sr);n=min(len(sig),N-i)
    if n>0 and i>=0: out[i:i+n]+=sig[:n]
def tone(f,length,amp,decay,harm=(1,.3,.1)):
    tt=np.arange(int(length*sr))/sr;env=np.exp(-tt*decay)*np.minimum(1,tt/.004)
    return amp*env*sum(h*np.sin(2*np.pi*f*(k+1)*tt) for k,h in enumerate(harm))
def lp(n,k):
    for _ in range(2): n=np.convolve(n,np.ones(k)/k,mode='same')
    return n
def noise_seg(a,b,amp,k=40,shape='hump'):
    L=b-a;n=lp(rng.standard_normal(int(L*sr)),k);tt=np.arange(len(n))/sr
    env=np.sin(np.pi*tt/L) if shape=='hump' else np.minimum(1,tt/.3)*np.minimum(1,(L-tt)/.5);add(a,amp*n*env*6)
def whoosh(s,L=.5,amp=.10): n=lp(rng.standard_normal(int(L*sr)),25);tt=np.arange(len(n))/sr;add(s,amp*n*np.sin(np.pi*tt/L)**2)
def sweep(a,b,f0,f1,amp):
    m=(t>=a)&(t<b);x=(t[m]-a)/(b-a);ph=2*np.pi*np.cumsum(f0+(f1-f0)*x)/sr;out[m]+=amp*np.sin(ph)*np.sin(np.pi*np.clip(x*1.2,0,1))
def pop(s,amp=.07): add(s,tone(1400,.08,amp,40,(1,)));add(s+.06,tone(2100,.1,amp*.8,35,(1,)))
def ding(s,f,amp=.05,L=1.2): add(s,tone(f,L,amp,3.5))
# hook: jet roar + rushing world
noise_seg(0,T(2)+.2,.05,60,'flat');noise_seg(.5,T(2),.03,8,'flat');whoosh(.5,.8,.12);pop(.25)
sweep(1.5,3.7,120,900,.035)
# globe
whoosh(T(2),.9,.10);noise_seg(T(2),T(4),.02,12,'flat');sweep(T(4)+1.6,T(4)+3.7,120,900,.035);pop(T(4)+.9,.05)
sweep(T(6),T(6)+1.1,120,600,.03)
# hover clock ticking faster
s=T(8)-.2;k=0
while s<T(9)+.6: add(s,tone(2300,.03,.035,170,(1,.2)));k+=1;s+=max(.07,.4-.03*k)
# record scratch + boom
sw=(t>=T(10)+.15)&(t<T(10)+.5);x=t[sw]-(T(10)+.15);out[sw]+=.08*np.sin(2*np.pi*(900-2200*x)*x)*lp(rng.standard_normal(sw.sum()),3)*3
add(T(11),tone(45,1.6,.30,2,(1,.4)))
# air + takeoff
noise_seg(T(12),T(17),.025,30,'flat');noise_seg(T(14)+.3,T(16)+1.0,.04,60)
# train rumble, jump, landing
noise_seg(T(17),T(21),.04,80,'flat')
for s2 in np.arange(T(17),T(21),.55): add(s2,tone(70,.12,.05,30,(1,.5)))
whoosh(T(18)-.15,.4,.07);add(T(19)+.25,tone(95,.25,.18,22,(1,.6,.3)))
ding(T(19)+.4,1318.5,.04)
# jet stream wind
noise_seg(T(22),T(25),.06,18)
# race
noise_seg(T(26),T(26)+3.9,.03,50);ding(T(26)+3.0,1568,.06);add(T(26)+3.08,tone(2093,1.0,.04,4))
# end
pop(T(27))
for k2,f in enumerate((523.25,659.25,783.99,1046.5)): add(T(28)+k2*.08,tone(f,1.6,.04,2.2))
pop(T(28)+.45,.06)
# driving music, 104 bpm
beat=60/104;prog_=[[220.0,261.63,329.63],[174.61,220.0,261.63],[261.63,329.63,392.0],[196.0,246.94,293.66]]
k=0;s=0.0
while s<dur-.8:
    quiet=T(10)<s<T(12)
    ch=prog_[(k//8)%4];g=.35 if quiet else 1
    add(s,tone(ch[k%3]*2,.35,.016*g,8,(1,.25)))
    if k%2==0: add(s,tone(ch[0]/2,.45,.04*g,5,(1,.4,.1)))
    if k%2==0: add(s,tone(56,.18,.06*g,25,(1,)))
    if k%4==2: add(s,lp(rng.standard_normal(int(.06*sr)),2)*.03*g)
    k+=1;s+=beat/2
out*=np.minimum(1,(dur-t)/.8);out=np.clip(out,-1,1)
w=wave.open(sys.argv[1],'wb');w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((out*32000).astype('<i2').tobytes());w.close();print('ok')
