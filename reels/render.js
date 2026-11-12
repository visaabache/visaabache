// usage: node render.js scene.html outdir fps [t1,t2,...]
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{const [html,out,fpsS,list]=process.argv.slice(2);const fps=+fpsS;fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
p.on('pageerror',e=>console.error('PAGE ERR',e.message));
await p.goto('file://'+path.resolve(html));await p.evaluate(()=>document.fonts.ready);
const dur=await p.evaluate(()=>window.DURATION);
const times=list?list.split(',').map(Number):[...Array(Math.round(dur*fps)).keys()].map(i=>i/fps);
for(let i=0;i<times.length;i++){const d=await p.evaluate(t=>{render(t);return document.getElementById('c').toDataURL('image/jpeg',.94)},times[i]);
fs.writeFileSync(path.join(out,list?`k_${times[i]}.jpg`:`f${String(i).padStart(4,'0')}.jpg`),Buffer.from(d.split(',')[1],'base64'));}
await b.close();console.log('frames',times.length);})();
