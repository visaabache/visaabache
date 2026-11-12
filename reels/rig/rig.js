// rig.js — jointed stick-figure rig: 2-bone IK limbs, planted-foot walk cycle,
// sitting via IK, breathing, blinking, age variants (kid / adult / old).
(function(){
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const frac=x=>x-Math.floor(x);
const sstep=t=>t*t*(3-2*t);
const CREAM='#f4d6a6',INK='#0d0b10';

// 2-bone IK: joint between a and b. bend = +1 / -1 picks which side the joint sits on.
function ik(ax,ay,bx,by,l1,l2,bend){
  let dx=bx-ax,dy=by-ay,d=Math.hypot(dx,dy);const mx=l1+l2-0.5;
  if(d>mx){const k=mx/d;dx*=k;dy*=k;bx=ax+dx;by=ay+dy;d=mx;}
  d=Math.max(d,Math.abs(l1-l2)+0.5);
  const a=Math.atan2(dy,dx),c=clamp((l1*l1+d*d-l2*l2)/(2*l1*d),-1,1),th=a+bend*Math.acos(c);
  return {j:[ax+l1*Math.cos(th),ay+l1*Math.sin(th)],e:[bx,by]};
}

// ---- pose solver ----
// o: x, y (ground), s, dir, kind('adult'|'kid'|'old'), t (seconds),
//    dist (distance walked, px), walk (0..1 walk weight), sit (0..1), seat [x,y] (hip target when seated),
//    hands: {front:[x,y], back:[x,y]} optional IK targets, look (head pitch, + = down), lean (extra)
function pose(o){
  const s=o.s||1,d=o.dir||1,kind=o.kind||'adult',t=o.t||0,w=clamp(o.walk||0),st=sstep(clamp(o.sit||0));
  const old=kind==='old',kid=kind==='kid';
  const TH=(kid?86:95)*s,SH=(kid?84:93)*s,SP=(kid?100:old?118:128)*s,UA=(kid?58:64)*s,FA=(kid?54:60)*s;
  const L=(old?150:kid?235:250)*s,REL=0.3*L,lift=(old?12:kid?30:26)*s;
  const hipH=(old?179:kid?160:172)*s;
  const cyc=(o.dist||0)/L;
  const legs=[0,1].map(i=>{
    const u=frac(cyc+i*.5);let rel,ly=0,heel=0;
    if(u<.6){const k=u/.6;rel=lerp(REL,-REL,k);heel=clamp((k-.72)/.28)*0.5;}
    else{const k=(u-.6)/.4;rel=lerp(-REL,REL,sstep(k));ly=lift*Math.sin(Math.PI*k);heel=-.25*Math.sin(Math.PI*k);}
    const idleRel=(i?-9:11)*s;
    return {rel:lerp(idleRel,rel,w),ly:ly*w,heel:heel*w,u};
  });
  const u0=legs[0].u;
  const bob=w*(old?3:6)*s*Math.cos(4*Math.PI*(u0-.3));
  const breathe=(1-w)*Math.sin(t*2.1+(o.seedP||0))*1.6*s;
  // standing hip
  let hx=o.x,hy=o.y-hipH-bob;
  // feet (world)
  let feet=legs.map(l=>({x:o.x+d*l.rel,y:o.y-l.ly,heel:l.heel}));
  // sitting: hip goes to seat, feet plant in front
  if(st>0){const seat=o.seat||[o.x,o.y-SH-4*s];
    const mid=Math.sin(Math.PI*st);  // lean forward during the motion
    hx=lerp(hx,seat[0],st);hy=lerp(hy,seat[1],st)+mid*6*s;
    feet=feet.map((f,i)=>({x:lerp(f.x,seat[0]+d*(TH*.92+(i?-6:8)*s),st),y:lerp(f.y,o.y,st),heel:f.heel*(1-st)}));}
  // spine
  const leanBase=(old?.3:kid?.05:.07)*w+(old?.2:0)*(1-w)+(o.lean||0)+Math.sin(Math.PI*st)*.35*(o.sitting?0:1);
  const lean=leanBase+(st>.99?-.05:0);
  const sx=hx+d*Math.sin(lean)*SP,sy=hy-Math.cos(lean)*SP-breathe;
  // head (lags the bob slightly, pitches with look)
  const HR=(kid?52:44)*s*(o.headScale||1);
  const neck=(kid?6:10)*s;
  const look=o.look||0;
  const hdx=sx+d*(Math.sin(lean)*(neck+HR)+look*10*s),hdy=sy-Math.cos(lean)*(neck+HR)+look*12*s+w*Math.cos(4*Math.PI*(u0-.38))*1.2*s;
  // arms
  const shoulders=[0,1].map(i=>[sx-d*(i?6:-4)*s,sy+14*s]);
  const arms=[0,1].map(i=>{
    const sh=shoulders[i];const tgt=o.hands&&(i===0?o.hands.front:o.hands.back);
    if(tgt){const r=ik(sh[0],sh[1],tgt[0],tgt[1],UA,FA,d);return {sh,el:r.j,hd:r.e};}
    const r=legs[i].rel/(REL||1);           // same-side leg forward => arm back
    const swing=-r*(old?.18:.5)*w;
    const ua=swing+lean*.6+(st>0?.5*st:0);
    const fa=ua+.22+.45*Math.max(0,swing)+(st>0?.9*st:0)+(1-w)*.04*Math.sin(t*2.1);
    const el=[sh[0]+d*UA*Math.sin(ua),sh[1]+UA*Math.cos(ua)];
    return {sh,el,hd:[el[0]+d*FA*Math.sin(fa),el[1]+FA*Math.cos(fa)]};
  });
  const knees=feet.map(f=>ik(hx,hy,f.x,f.y-6*s,TH,SH,-d).j);
  return {s,d,hx,hy,sx,sy,lean,hdx,hdy,HR,feet,knees,arms,old,kid,SH,TH};
}

// ---- drawing ----
function limb(g,pts,wd,s){
  g.lineCap='round';g.lineJoin='round';
  g.strokeStyle=CREAM;g.lineWidth=wd+5*s;g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(const p of pts.slice(1))g.lineTo(p[0],p[1]);g.stroke();
  g.strokeStyle=INK;g.lineWidth=wd;g.stroke();
}
function shoe(g,f,d,s,col){
  g.save();g.translate(f.x,f.y);g.rotate(-d*f.heel);
  g.fillStyle=col||INK;g.strokeStyle=CREAM;g.lineWidth=2.6*s;
  g.beginPath();g.roundRect(d>0?-10*s:-30*s,-14*s,40*s,15*s,[7*s]);g.fill();g.stroke();g.restore();
}
function hand(g,p,s){g.fillStyle=INK;g.strokeStyle=CREAM;g.lineWidth=2.6*s;g.beginPath();g.arc(p[0],p[1],8.5*s,0,7);g.fill();g.stroke();}
function blinkAt(t,seed){const p=3.3+(seed%7)*.37;return frac((t+seed*.71)/p)<.045;}

function draw(g,o){
  const P=pose(o),{s,d}=P,LW=(P.kid?13:15)*s;
  g.save();g.globalAlpha=o.alpha??1;
  if(!o.noShadow){g.fillStyle='rgba(0,0,0,.33)';g.beginPath();g.ellipse((P.feet[0].x+P.feet[1].x)/2+d*8*s,o.y+3,58*s,10*s,0,0,7);g.fill();}
  const legPts=i=>[[P.hx,P.hy],P.knees[i],[P.feet[i].x,P.feet[i].y-6*s]];
  const armPts=i=>[P.arms[i].sh,P.arms[i].el,P.arms[i].hd];
  // back side
  limb(g,legPts(1),LW*1.08,s);shoe(g,P.feet[1],d,s,o.shoe);
  if(!o.frontArmsOnly){limb(g,armPts(1),LW*.85,s);hand(g,P.arms[1].hd,s);}
  if(o.behindTorso)o.behindTorso(P);
  // torso (tapered, along spine)
  const ang=Math.atan2(P.sy-P.hy,P.sx-P.hx);const len=Math.hypot(P.sx-P.hx,P.sy-P.hy);
  g.save();g.translate(P.hx,P.hy);g.rotate(ang+Math.PI/2);
  const wTop=(P.kid?46:54)*s,wBot=(P.kid?42:46)*s,ext=10*s;
  g.fillStyle=o.col;g.strokeStyle=CREAM;g.lineWidth=3*s;g.beginPath();
  if(o.dress){g.moveTo(-wTop/2,-len);g.lineTo(wTop/2,-len);g.lineTo(wBot*.95,ext+40*s);g.lineTo(-wBot*.95,ext+40*s);g.closePath();}
  else g.roundRect(-wTop/2,-len-4*s,wTop,len+ext+4*s,[16*s,16*s,10*s,10*s]);
  g.fill();g.stroke();
  g.fillStyle='rgba(0,0,0,.17)';g.fillRect(d>0?-wTop/2+3*s:0,-len+4*s,wTop/2-3*s,len+ext-6*s);
  if(o.belt){g.fillStyle='rgba(0,0,0,.35)';g.fillRect(-wBot/2,0,wTop,7*s);}
  g.restore();
  if(o.prop)o.prop(P);
  // front side
  limb(g,legPts(0),LW*1.08,s);shoe(g,P.feet[0],d,s,o.shoe);
  // neck + head
  limb(g,[[P.sx,P.sy+4*s],[P.hdx-d*4*s,P.hdy+P.HR*.7]],LW*.7,s);
  head(g,P.hdx,P.hdy,P.HR,d,{...o,blink:blinkAt(o.t||0,o.seed||1)});
  if(o.onHead)o.onHead(P);
  limb(g,armPts(0),LW*.85,s);hand(g,P.arms[0].hd,s);
  if(o.inHand)o.inHand(P);
  g.restore();
  return P;
}
function head(g,hx,hy,HR,d,o){
  const s=HR/44,hc=o.hairCol||INK;g.strokeStyle=CREAM;g.lineWidth=3*s;
  if(o.hair==='pony'){g.fillStyle=hc;g.beginPath();g.ellipse(hx-d*HR*1.02,hy+6*s,13*s,25*s,d*.5,0,7);g.fill();g.stroke();}
  if(o.hair==='bun'){g.fillStyle=hc;g.beginPath();g.arc(hx-d*HR*.55,hy-HR*.86,17*s,0,7);g.fill();g.stroke();}
  g.fillStyle=INK;g.lineWidth=4*s;g.beginPath();g.arc(hx,hy,HR,0,7);g.fill();g.stroke();
  if(o.hair==='side'||o.hair==='bald'){g.fillStyle=hc;g.beginPath();g.ellipse(hx-d*HR*.72,hy+2*s,10*s,20*s,0,0,7);g.fill();}
  if(o.hat==='cap'){g.fillStyle=o.hatCol||'#e0703f';g.beginPath();g.arc(hx,hy-5*s,HR+2*s,Math.PI,0);g.fill();g.fillRect(d>0?hx:hx-HR*1.6,hy-9*s,HR*1.6,9*s);}
  const fx=hx+d*13*s,fy=hy+(o.look||0)*6*s;g.strokeStyle='#fff';g.fillStyle='#fff';g.lineWidth=3.6*s;g.lineCap='round';
  const face=o.face||'smile';
  if(o.blink||face==='calm'){for(const ex of [-13,13]){g.beginPath();g.moveTo(fx+ex*s-5*s,fy-4*s);g.lineTo(fx+ex*s+5*s,fy-4*s);g.stroke();}}
  else for(const ex of [-13,13]){g.beginPath();g.arc(fx+ex*s,fy-5*s,4.8*s,0,7);g.fill();}
  if(o.glasses){g.lineWidth=2.4*s;for(const ex of [-13,13]){g.beginPath();g.arc(fx+ex*s,fy-5*s,9.5*s,0,7);g.stroke();}g.beginPath();g.moveTo(fx-3.5*s,fy-5*s);g.lineTo(fx+3.5*s,fy-5*s);g.stroke();g.lineWidth=3.6*s;}
  if(face==='flat'||face==='sad'){g.beginPath();g.moveTo(fx-9*s,fy+14*s);g.lineTo(fx+9*s,fy+(face==='sad'?17:14)*s);g.stroke();}
  else if(face==='laugh'){g.beginPath();g.arc(fx,fy+7*s,11*s,0,Math.PI);g.fill();}
  else if(face==='o'){g.beginPath();g.arc(fx,fy+12*s,5*s,0,7);g.stroke();}
  else {g.beginPath();g.arc(fx,fy+8*s,12*s,.18*Math.PI,.82*Math.PI);g.stroke();}
  if(o.wrinkles){g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=2*s;g.beginPath();g.moveTo(fx-16*s,fy-22*s);g.lineTo(fx+8*s,fy-24*s);g.stroke();}
}
// distance helper for a walk that eases in and out: start/stop at t0/t1, cruise speed v, ramp r seconds
function walkPath(t,t0,t1,v,r=.45){
  const f=tt=>{ // distance at time tt (piecewise integral of trapezoid speed profile)
    if(tt<=t0)return 0;const T=t1-t0;const a=Math.min(r,T/2);const x=Math.min(tt,t1)-t0;
    let dd;if(x<a)dd=v*x*x/(2*a);else if(x<T-a)dd=v*a/2+v*(x-a);else{const y=T-x;dd=v*a/2+v*(T-2*a)+v*a/2-v*y*y/(2*a);}
    return dd;};
  const sp=t<=t0||t>=t1?0:Math.min(1,(t-t0)/r,(t1-t)/r);
  return {dist:f(t),walk:sp};
}
window.RIG={pose,draw,head,ik,walkPath,clamp,lerp,frac,sstep,CREAM,INK};
})();
