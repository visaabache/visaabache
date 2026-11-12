import numpy as np, wave, sys
sr=44100;dur=28.9;N=int(sr*dur);t=np.arange(N)/sr;out=np.zeros(N);rng=np.random.default_rng(5)
def add(start,sig):
    i=int(start*sr);n=min(len(sig),N-i)
    if n>0 and i>=0: out[i:i+n]+=sig[:n]
def tone(f,length,amp,decay,harm=(1,.3,.1)):
    tt=np.arange(int(length*sr))/sr;env=np.exp(-tt*decay)*np.minimum(1,tt/.005)
    return amp*env*sum(h*np.sin(2*np.pi*f*(k+1)*tt) for k,h in enumerate(harm))
def noise(length,amp,decay,k=4):
    n=rng.standard_normal(int(length*sr))
    for _ in range(3): n=np.convolve(n,np.ones(k)/k,mode='same')
    tt=np.arange(len(n))/sr;return amp*n*np.exp(-tt*decay)
def sweep(a,b,f0,f1,amp):
    m=(t>=a)&(t<b);x=(t[m]-a)/(b-a);ph=2*np.pi*np.cumsum(f0+(f1-f0)*x)/sr;out[m]+=amp*np.sin(ph)*np.sin(np.pi*x)
def lowbat(s,amp=.07): add(s,tone(880,.12,amp,25,(1,.2)));add(s+.18,tone(660,.16,amp,20,(1,.2)))
def plug(s): add(s,tone(2600,.03,.06,150,(1,)));add(s,noise(.03,.08,120,2))
for s in (0.5,2.6,4.3): lowbat(s)
for s in (15.6,17.9): lowbat(s,.05)
plug(5.62);sweep(5.8,6.5,400,1100,.04);add(6.5,tone(1318.5,1.2,.04,3))
for s in np.arange(5.4,6.7,.19): add(s,tone(3200+rng.random()*600,.05,.025,90,(1,.4)))
plug(7.32);sweep(7.45,8.05,400,1100,.04);add(8.05,tone(1318.5,1.0,.04,3))
for s in np.arange(8.2,11.5,.25): add(s,tone(2400,.03,.035,180,(1,.2)))
for s in np.arange(8.3,11.4,.13): add(s+rng.random()*.04,noise(.025,.03,150,2))
for i in range(4): plug(11.85+i*.4);sweep(11.9+i*.4,12.8+i*.4,450,1200,.02)
m=(t>=13.8)&(t<14.9);out[m]+=.02*np.sign(np.sin(2*np.pi*120*t[m]))*(np.sin(t[m]*37)*np.sin(t[m]*13)>.2)
m=(t>=19.2)&(t<19.75);x=(t[m]-19.2)/.55;out[m]+=.05*rng.standard_normal(m.sum())*np.sin(np.pi*x)*.6
add(19.25,tone(220,.5,.04,6,(1,.5,.2)))
for s in np.arange(19.6,21.2,.45): add(s,tone(90,.12,.12,40,(1,.4)))
add(21.05,tone(120,.3,.18,22,(1,.6,.3)));add(21.05,noise(.08,.12,50,4))
sweep(21.7,23.3,300,900,.05);add(23.3,tone(1046.5,2.0,.05,2));add(23.32,tone(1568,2.0,.04,2.2))
sweep(24.2,27.8,350,800,.02);add(27.8,tone(1318.5,1.0,.035,3))
# music
def pluck(f,s,amp,dec,L): add(s,tone(f,L,amp,dec,(1,.35,.12)))
prog_=[[220.0,261.63,329.63,440.0],[174.61,220.0,261.63,349.23],[130.81,196.0,261.63,329.63],[196.0,246.94,293.66,392.0]]
k=0;s=0.1
while s<17.2:
    ch=prog_[(k//8)%4];pluck(ch[[0,1,2,3,2,1,2,3][k%8]],s,.035,2.4,2.2)
    if k%8==0: pluck(ch[0]/2,s,.05,.7,4.0)
    k+=1;s+=.5
m=(t>=17.2)&(t<21.5);out[m]+=.025*np.sin(2*np.pi*55*t[m])*np.sin(np.pi*np.clip((t[m]-17.2)/4.3,0,1))
warm=[[174.61,220,261.63,349.23],[130.81,196,261.63,329.63],[196,246.94,293.66,392],[130.81,196,261.63,329.63]]
for b in range(4):
    s=21.4+b*1.9;ch=warm[b%4]
    for j,f in enumerate(ch): pluck(f,s+j*.12,.035,.9,3.2)
    pluck(ch[0]/2,s,.06,.5,3.8)
out*=np.minimum(1,(dur-t)/.8);out=np.clip(out,-1,1)
w=wave.open(sys.argv[1],'wb');w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((out*32000).astype('<i2').tobytes());w.close();print('ok')
