import numpy as np, wave, sys
sr=44100;dur=31.0;N=int(sr*dur);t=np.arange(N)/sr;out=np.zeros(N);rng=np.random.default_rng(3)
def add(start,sig):
    i=int(start*sr);n=min(len(sig),N-i)
    if n>0: out[i:i+n]+=sig[:n]
def tone(f,length,amp,decay,harm=(1,.3,.1)):
    tt=np.arange(int(length*sr))/sr;env=np.exp(-tt*decay)*np.minimum(1,tt/.005)
    return amp*env*sum(h*np.sin(2*np.pi*f*(k+1)*tt) for k,h in enumerate(harm))
def noise(length,amp,decay,k=4):
    n=rng.standard_normal(int(length*sr))
    for _ in range(3): n=np.convolve(n,np.ones(k)/k,mode='same')
    tt=np.arange(len(n))/sr;return amp*n*np.exp(-tt*decay)
def tick(s,amp=.05): add(s,tone(2400,.03,amp,180,(1,.2)));add(s,noise(.02,amp*.6,200,2))
def whoosh(s,length=.5,amp=.12):
    n=rng.standard_normal(int(length*sr));n=np.convolve(n,np.ones(40)/40,mode='same');tt=np.arange(len(n))/sr;add(s,amp*n*np.sin(np.pi*tt/length)**2)
for s in np.arange(0.12,21.2,1.0): tick(s,.045)
for s in np.arange(23.2,30.5,1.0): tick(s,.04)
for s in np.arange(8.56,9.45,.11): tick(s,.05)
add(6.1,tone(1568,1.0,.06,5));add(6.1,tone(2093,1.0,.05,5));add(6.1,noise(.12,.12,30,5))
for s in (6.05,8.55,11.55): whoosh(s)
add(11.57,tone(55,1.2,.25,3,(1,.5,.2)))
seg=(t>=14.9)&(t<16.4);x=t[seg]-14.9;out[seg]+=.03*np.sin(2*np.pi*(500+600*x/1.5)*t[seg])*np.sin(np.pi*x/1.5)
for s in np.arange(16.6,21.2,.95): add(s,tone(60,.25,.28,18,(1,.3)));add(s+.22,tone(52,.25,.2,18,(1,.3)))
for s in (19.35,19.85,20.3,20.75): add(s,tone(180,.25,.12,25,(1,.6,.3)));add(s,noise(.06,.1,60,4))
for k,f in enumerate((523.25,659.25,783.99,1046.5)): add(21.5+k*.07,tone(f,2.5,.05,1.6))
add(23.26,tone(41,2.5,.3,1.6,(1,.4)))
tense=[220.0,261.63,329.63,261.63]
for i,s in enumerate(np.arange(0.12,21.2,.25)):
    add(s,tone(tense[i%4]/(2 if i%8<4 else 1),.6,.018,6,(1,.35,.12)))
    if i%8==0: add(s,tone(55,2.2,.06,1.2,(1,.35,.12)))
warm=[[174.61,220,261.63,349.23],[130.81,196,261.63,329.63],[196,246.94,293.66,392],[220,261.63,329.63,440]]
for b in range(5):
    s=21.35+b*1.9;ch=warm[b%4]
    for k,f in enumerate(ch): add(s+k*.12,tone(f,3.0,.03,1.0,(1,.35,.12)))
    add(s,tone(ch[0]/2,3.5,.05,.6,(1,.35,.12)))
out*=np.minimum(1,(dur-t)/.8);out=np.clip(out,-1,1)
w=wave.open(sys.argv[1],'wb');w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((out*32000).astype('<i2').tobytes());w.close();print('ok')
