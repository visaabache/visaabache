// usage: node render3d.js scene.html outdir fps [t1,t2,...]  — serves the scene folder over local http (ES modules), WebGL via SwiftShader
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const http=require('http');
(async()=>{const [html,out,fpsS,list]=process.argv.slice(2);const fps=+fpsS;fs.mkdirSync(out,{recursive:true});
const root=path.dirname(path.resolve(html));const types={'.html':'text/html','.js':'text/javascript','.woff2':'font/woff2','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'};
const srv=http.createServer((q,r)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(!f.startsWith(root)||!fs.existsSync(f)){r.writeHead(404);return r.end();}r.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});
await new Promise(res=>srv.listen(0,'127.0.0.1',res));const port=srv.address().port;
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1080,height:1920}});p.on('pageerror',e=>console.error('PAGE ERR',e.message));p.on('console',m=>{if(m.type()==='error')console.error('CONSOLE',m.text())});
await p.goto(`http://127.0.0.1:${port}/${path.basename(html)}`);await p.waitForFunction(()=>window.render&&window.ready,null,{timeout:60000});await p.evaluate(async()=>{await document.fonts.ready;await window.ready;});
const dur=await p.evaluate(()=>window.DURATION);let idx=[...Array(Math.round(dur*fps)).keys()];const rg=process.env.RANGE;if(rg){const [a0,b0]=rg.split('-').map(Number);idx=idx.filter(i=>i>=a0&&i<b0);}
const times=list?list.split(',').map(Number):idx.map(i=>i/fps);
const t0=Date.now();
for(let i=0;i<times.length;i++){const d=await p.evaluate(t=>{render(t);return document.getElementById('c').toDataURL('image/jpeg',.93)},times[i]);
fs.writeFileSync(path.join(out,list?`k_${times[i]}.jpg`:`f${String(idx[i]).padStart(4,'0')}.jpg`),Buffer.from(d.split(',')[1],'base64'));}
console.log('frames',times.length,'ms/frame',Math.round((Date.now()-t0)/times.length));await b.close();srv.close();})();
