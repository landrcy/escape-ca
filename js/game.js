import * as THREE from 'three';
const $=id=>document.getElementById(id);
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches,COARSE=matchMedia('(pointer:coarse)').matches;
const CAST={ashaad:{n:'ASHAAD',img:'assets/ashaad-fullbody.jpg',back:'ashaad-back',side:'ashaad-run',fx:'the one they\'re looking for.',spd:5},
 emmanuel:{n:'EMMANUEL',img:'assets/emmanuel-survivor.jpg',back:'emmanuel-back',side:'emmanuel-run',fx:'fast legs. bad cardio.',spd:5.3},
 landry:{n:'LANDRY',img:'assets/landry-fullbody.jpg',back:'landry-back',side:'landry-run',fx:'saw verity first. didn\'t say.',spd:4.9}};
let who=null;
// ---------- audio ----------
let ac,nextBeat=0,drone;function audio(){if(!ac)try{ac=new AudioContext()}catch{}ac?.resume()}
function tone(type,f0,f1,dur,v,delay=0){if(!ac)return;const t=ac.currentTime+delay,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(ac.destination);o.start(t);o.stop(t+dur+.05)}
function noise(dur,v){if(!ac)return;const b=ac.createBuffer(1,ac.sampleRate*dur,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);const s=ac.createBufferSource(),g=ac.createGain();g.gain.value=v;s.buffer=b;s.connect(g).connect(ac.destination);s.start()}
const thump=(f,v)=>tone('sine',f,f*.7,.18,v);
function scream(long){const L=long?2.6:.9;tone('sawtooth',1200,90,L,.35);tone('square',1500,140,L*.9,.15,.03);tone('sawtooth',700,60,L,.2,.06);noise(L*.7,.4)}
function distantScream(){tone('sine',900+Math.random()*300,500,1.4,.03);tone('triangle',1100,700,1.2,.02,.1)}
function startDrone(){if(!ac||drone)return;const o=ac.createOscillator(),o2=ac.createOscillator(),g=ac.createGain();o.frequency.value=41;o2.frequency.value=43.3;o.type=o2.type='sawtooth';g.gain.value=.035;const f=ac.createBiquadFilter();f.frequency.value=180;o.connect(f);o2.connect(f);f.connect(g).connect(ac.destination);o.start();o2.start();drone=g}
// ---------- flow ----------
let state='title';
const cards=document.querySelector('#sel .cards'),goB=document.querySelector('#sel .go');
for(const k in CAST){const d=document.createElement('div');d.className='card';d.innerHTML=`<img src="${CAST[k].img}"><b>${CAST[k].n}</b><small>${CAST[k].fx}</small>`;
 d.onclick=()=>{who=k;cards.querySelectorAll('.card').forEach(c=>c.classList.toggle('on',c==d));goB.disabled=false;thump(80,.4)};cards.append(d)}
goB.onclick=()=>who&&begin();
addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys[k]=1;
 if(k==' '){if(state=='title')toIntro();else if(state=='intro')CUT.t0=Math.min(CUT.t0,performance.now()-9300)}if(state=='pick'&&'123'.includes(k)&&k)pickRig(CUT.rigs[+k-1]);
 if(k=='r'&&state=='over')begin();if(k=='c'&&state=='play')P.crouch^=1;if((k==' '||k=='f')&&state=='qte')mash()});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=0);
// =====================================================================
//  WORLD: hand-laid campus (buildings w/ carved hallways + open outdoor)
// =====================================================================
const W=48,H=36,S=4;let seed=1337;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const G=[...Array(H)].map(()=>Array(W).fill('.'));      // '.' walk, 'D' door, solids: # c F T ~ K
const F=[...Array(H)].map(()=>Array(W).fill('grass'));  // floor kind
const IN=[...Array(H)].map(()=>Array(W).fill(0));       // 1 = indoor (ceiling)
const PERIM=new Set();                                   // building shell walls (tall facades)
const set=(x0,z0,x1,z1,fn)=>{for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++)if(G[z]?.[x]!==undefined)fn(x,z)};
const walk=(x,z)=>G[z]?.[x]=='.'||G[z]?.[x]=='D';
// --- outdoor ground ---
set(0,12,47,16,(x,z)=>F[z][x]=(z==12||z==16)?'path':'asph');            // Seahawk Lane + sidewalks
set(14,1,20,11,(x,z)=>F[z][x]=(x==17||z==6)?'path':'grass');            // courtyard
set(34,1,34,11,(x,z)=>F[z][x]='path');
set(1,17,16,34,(x,z)=>F[z][x]='asph');                                   // parking lot
set(17,17,31,34,(x,z)=>F[z][x]='grass');                                 // lake park
set(46,17,46,34,(x,z)=>F[z][x]='path');set(32,17,32,34,(x,z)=>F[z][x]='path');
// courtyard trees / planters
const PLANTERS=[];
set(14,1,20,11,(x,z)=>{if(F[z][x]=='grass'&&x>14&&x<20&&rnd()<.22)G[z][x]='T'});
// parking rows (cars) with drive aisles
const CARS=[];for(const z of[19,20,24,25,29,30])for(let x=2;x<=15;x++){if(rnd()<.62){G[z][x]='K';CARS.push([x,z])}}
// lake: water ellipse, path ring, trees
const LC=[24.5,25.5];set(17,17,31,34,(x,z)=>{const d=Math.hypot((x-LC[0])/5.2,(z-LC[1])/4.2);if(d<1)G[z][x]='~';else if(d<1.45)F[z][x]='path';else if(rnd()<.2)G[z][x]='T'});
set(17,17,31,17,(x,z)=>{F[z][x]='path';if(G[z][x]=='T')G[z][x]='.'});
// border hedge
for(let x=0;x<W;x++){G[0][x]=G[H-1][x]='F'}for(let z=0;z<H;z++){G[z][0]=G[z][W-1]='F'}
// --- buildings ---
const BUILD=[];
function building(name,x0,z0,x1,z1,opt={}){
 BUILD.push({name,x0,z0,x1,z1,...opt});
 set(x0,z0,x1,z1,(x,z)=>{IN[z][x]=1;F[z][x]=opt.garage?'conc':'lino';const edge=x==x0||x==x1||z==z0||z==z1;
  G[z][x]=edge?(opt.garage?'c':'#'):(opt.garage?'.':'#');if(edge&&!opt.garage)PERIM.add(x+','+z)});
 if(opt.garage){set(x0+1,z0+1,x1-1,z1-1,(x,z)=>{if((x-x0)%3==0&&(z-z0)%3==0)G[z][x]='c'});return}
 // DFS hallway maze on odd lattice
 const st=[[x0+1,z0+1]];G[z0+1][x0+1]='.';
 while(st.length){const[x,z]=st.at(-1),n=[[2,0],[-2,0],[0,2],[0,-2]].map(([a,b])=>[x+a,z+b,x+a/2,z+b/2]).filter(([a,b])=>a>x0&&b>z0&&a<x1&&b<z1&&G[b][a]=='#');
  if(!n.length){st.pop();continue}const[a,b,c,d]=n[Math.floor(rnd()*n.length)];G[d][c]=G[b][a]='.';st.push([a,b])}
 // braid: knock out walls between two halls (fewer dead ends = better chases)
 set(x0+1,z0+1,x1-1,z1-1,(x,z)=>{if(G[z][x]=='#'&&rnd()<.33&&((walk(x-1,z)&&walk(x+1,z)&&!walk(x,z-1)&&!walk(x,z+1))||(walk(x,z-1)&&walk(x,z+1)&&!walk(x-1,z)&&!walk(x+1,z))))G[z][x]='.'});
 // main hallway + a commons room
 if(opt.hall!=null)set(x0+1,opt.hall,x1-1,opt.hall,(x,z)=>G[z][x]='.');
 if(opt.room)set(...opt.room,(x,z)=>G[z][x]='.');
}
building('BAILEY HALL',1,1,13,11,{hall:7,room:[5,3,9,5]});
building('LIBRARY',21,1,33,11,{hall:5,room:[25,7,29,9]});
building('PARKING GARAGE',35,1,46,11,{garage:1});
building('STUDENT SERVICES',33,17,45,33,{hall:25,room:[37,19,41,21]});
// doors: carve the door + inward until a hallway is reached
const DOORS=[];
function door(x,z,dx,dz){G[z][x]='D';DOORS.push({x,z,dx,dz});for(let i=1;i<4;i++){const a=x+dx*i,b=z+dz*i;if(walk(a,b))break;G[b][a]='.'}}
door(5,11,0,-1);door(9,11,0,-1);door(13,3,-1,0);door(13,9,-1,0);       // Bailey: front (lane) + courtyard
door(21,4,1,0);door(21,9,1,0);door(27,11,0,-1);door(31,1,0,1);           // Library
for(const x of[37,40,43])door(x,11,0,-1);door(35,4,1,0);door(35,8,1,0); // Garage open bays
door(36,17,0,1);door(42,17,0,1);door(33,22,1,0);door(33,29,1,0);         // Student Services
// garage bays are open-air openings, not glass doors
DOORS.forEach(d=>d.garage=G[d.z][d.x]&&IN[d.z][d.x]&&F[d.z][d.x]=='conc');
const ZONES=[['BAILEY HALL',1,1,13,11],['BAILEY COURTYARD',14,1,20,11],['LIBRARY',21,1,33,11],['LIBRARY WALK',34,1,34,11],['PARKING GARAGE',35,1,46,11],
 ['SEAHAWK LANE',0,12,47,16],['PARKING LOT 4',1,17,16,34],['MEMORIAL LAKE PATH',17,17,32,34],['STUDENT SERVICES',33,17,45,33],['EAST WALK',46,17,46,34]];
const zoneAt=(gx,gz)=>(ZONES.find(([,a,b,c,d])=>gx>=a&&gx<=c&&gz>=b&&gz<=d)||['CENTRAL CAMPUS'])[0];
const nearestWalk=(x,z)=>{for(let r=0;r<10;r++)for(let a=-r;a<=r;a++)for(let b=-r;b<=r;b++)if(walk(x+a,z+b))return[(x+a)*S,(z+b)*S];return[x*S,z*S]};
const pStart=nearestWalk(7,9),jStart=nearestWalk(43,31),vStart=nearestWalk(31,3);

// =====================================================================
//  RENDERER / SCENE
// =====================================================================
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;document.body.prepend(renderer.domElement);
const scene=new THREE.Scene();const FOG_IN=new THREE.Color(0x060505),FOG_OUT=new THREE.Color(0x0b1020);scene.fog=new THREE.FogExp2(FOG_IN.clone(),.07);scene.background=scene.fog.color;
const cam=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.08,400);
const hemi=new THREE.HemisphereLight(0x5a6a99,0x1a1410,.25);scene.add(hemi);
const moonL=new THREE.DirectionalLight(0x9fb4ff,.0);moonL.position.set(-60,90,-40);scene.add(moonL);
const ANISO=renderer.capabilities.getMaxAnisotropy();
// ---------- procedural textures ----------
function ctex(w,h,draw,rx=1,ry=1,srgb=true){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.anisotropy=ANISO;if(srgb)t.colorSpace=THREE.SRGBColorSpace;return t}
const speck=(g,w,h,n,cols,sz=2)=>{for(let i=0;i<n;i++){g.fillStyle=cols[Math.floor(Math.random()*cols.length)];g.fillRect(Math.random()*w,Math.random()*h,Math.random()*sz+.5,Math.random()*sz+.5)}};
const grime=(g,w,h,n,a=.25)=>{for(let i=0;i<n;i++){const x=Math.random()*w,y=Math.random()*h,r=10+Math.random()*60,gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,`rgba(20,14,8,${a*Math.random()})`);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2)}};
const T={};
T.lino=ctex(256,256,(g,w)=>{const s=w/4;for(let y=0;y<4;y++)for(let x=0;x<4;x++){g.fillStyle=(x+y)%2?'#b9b29a':'#8f9a8c';g.fillRect(x*s,y*s,s,s)}speck(g,w,w,2500,['#6d6a5e','#d8d2bb','#575a50']);
 g.strokeStyle='rgba(40,36,28,.7)';g.lineWidth=2;for(let i=0;i<=4;i++){g.beginPath();g.moveTo(i*s,0);g.lineTo(i*s,w);g.moveTo(0,i*s);g.lineTo(w,i*s);g.stroke()}grime(g,w,w,14,.35);
 g.fillStyle='rgba(255,255,255,.05)';g.fillRect(0,w*.4,w,w*.2)});
T.asph=ctex(256,256,(g,w)=>{g.fillStyle='#232325';g.fillRect(0,0,w,w);speck(g,w,w,9000,['#2e2e31','#18181a','#3a3a3c','#121213'],1.6);g.strokeStyle='rgba(8,8,8,.8)';g.lineWidth=1.2;
 for(let i=0;i<3;i++){g.beginPath();let x=Math.random()*w,y=Math.random()*w;g.moveTo(x,y);for(let k=0;k<8;k++){x+=(Math.random()-.5)*40;y+=(Math.random()-.5)*40;g.lineTo(x,y)}g.stroke()}grime(g,w,w,6,.4)});
T.grass=ctex(256,256,(g,w)=>{g.fillStyle='#16210f';g.fillRect(0,0,w,w);for(let i=0;i<7000;i++){const x=Math.random()*w,y=Math.random()*w;g.strokeStyle=`hsl(${85+Math.random()*30},${30+Math.random()*25}%,${7+Math.random()*14}%)`;g.beginPath();g.moveTo(x,y);g.lineTo(x+(Math.random()-.5)*3,y-3-Math.random()*5);g.stroke()}grime(g,w,w,8,.5)});
T.path=ctex(256,256,(g,w)=>{g.fillStyle='#5c5a55';g.fillRect(0,0,w,w);speck(g,w,w,5000,['#6b6963','#4c4a46','#77746c']);g.strokeStyle='#33312d';g.lineWidth=3;for(let i=0;i<=2;i++){g.beginPath();g.moveTo(i*w/2,0);g.lineTo(i*w/2,w);g.moveTo(0,i*w/2);g.lineTo(w,i*w/2);g.stroke()}grime(g,w,w,10,.4)});
T.conc=ctex(256,256,(g,w)=>{g.fillStyle='#4a4a4b';g.fillRect(0,0,w,w);speck(g,w,w,7000,['#555556','#3d3d3e','#5f5f60']);grime(g,w,w,16,.5);g.fillStyle='rgba(240,200,40,.8)';g.fillRect(0,w*.48,w,6)});
T.ceil=ctex(256,256,(g,w)=>{g.fillStyle='#8a877d';g.fillRect(0,0,w,w);speck(g,w,w,6000,['#6f6c63','#9a978c','#77746a'],1.2);g.strokeStyle='#3c3a34';g.lineWidth=4;g.strokeRect(0,0,w/2,w/2);g.strokeRect(w/2,0,w/2,w/2);g.strokeRect(0,w/2,w/2,w/2);g.strokeRect(w/2,w/2,w/2,w/2);
 g.fillStyle='rgba(120,90,40,.35)';g.beginPath();g.arc(w*.7,w*.3,24,0,7);g.fill()});
T.block=ctex(256,205,(g,w,h)=>{g.fillStyle='#b8b2a0';g.fillRect(0,0,w,h);g.fillStyle='#2f5f62';g.fillRect(0,h*.62,w,h*.06);g.fillStyle='#7b766a';g.fillRect(0,h*.68,w,h*.32);
 g.strokeStyle='rgba(60,56,48,.55)';g.lineWidth=2;for(let y=0;y<h;y+=17){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();for(let x=((y/17)%2)*32;x<w;x+=64){g.beginPath();g.moveTo(x,y);g.lineTo(x,y+17);g.stroke()}}
 speck(g,w,h,3000,['#a29c8b','#c9c3b0','#8c8678']);grime(g,w,h,10,.45);g.fillStyle='#262320';g.fillRect(0,h-8,w,8)});
function facade(lit){const em=document.createElement('canvas');em.width=256;em.height=416;const e=em.getContext('2d');e.fillStyle='#000';e.fillRect(0,0,256,416);
 const map=ctex(256,416,(g,w,h)=>{g.fillStyle='#2b1712';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=10)for(let x=-((y/10)%2)*14;x<w;x+=28){g.fillStyle=`hsl(${8+Math.random()*10},${30+Math.random()*25}%,${16+Math.random()*12}%)`;g.fillRect(x+1,y+1,26,8)}
  grime(g,w,h,20,.5);g.fillStyle='#8d877b';g.fillRect(0,h*.47,w,8);g.fillRect(0,0,w,10);
  for(const wy of[.12,.55])for(const wx of[.12,.56]){const X=wx*w,Y=wy*h,ww=w*.32,wh=h*.26,on=lit&&Math.random()<.55;g.fillStyle='#55524c';g.fillRect(X-4,Y-4,ww+8,wh+8);
   const gr=g.createLinearGradient(X,Y,X,Y+wh);if(on){gr.addColorStop(0,'#f5d48a');gr.addColorStop(1,'#a86a22')}else{gr.addColorStop(0,'#1d2633');gr.addColorStop(1,'#07090d')}g.fillStyle=gr;g.fillRect(X,Y,ww,wh);
   g.fillStyle='#3d3a35';g.fillRect(X+ww/2-2,Y,4,wh);g.fillRect(X,Y+wh/2-2,ww,4);
   if(on){const eg=e.createLinearGradient(X,Y,X,Y+wh);eg.addColorStop(0,'#c99a4c');eg.addColorStop(1,'#6b3c10');e.fillStyle=eg;e.fillRect(X,Y,ww,wh);e.fillStyle='#000';e.fillRect(X+ww/2-2,Y,4,wh);e.fillRect(X,Y+wh/2-2,ww,4)}}});
 const et=new THREE.CanvasTexture(em);et.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshStandardMaterial({map,emissiveMap:et,emissive:0xffffff,emissiveIntensity:lit?1.1:0,roughness:.92})}
T.cwall=ctex(256,220,(g,w,h)=>{g.fillStyle='#57575a';g.fillRect(0,0,w,h);speck(g,w,h,6000,['#606064','#4a4a4d','#6c6c70']);grime(g,w,h,18,.55);g.fillStyle='rgba(30,26,20,.5)';for(let i=0;i<6;i++)g.fillRect(Math.random()*w,h*.3,2+Math.random()*3,h*.7);
 g.fillStyle='#c9a227';g.fillRect(0,h-28,w,10);g.fillStyle='#222';for(let x=0;x<w;x+=32){g.beginPath();g.moveTo(x,h-28);g.lineTo(x+16,h-28);g.lineTo(x+6,h-18);g.lineTo(x-10,h-18);g.fill()}});
T.hedge=ctex(256,128,(g,w,h)=>{g.fillStyle='#0d1709';g.fillRect(0,0,w,h);for(let i=0;i<5000;i++){g.fillStyle=`hsl(${90+Math.random()*30},${35+Math.random()*25}%,${5+Math.random()*16}%)`;g.beginPath();g.arc(Math.random()*w,Math.random()*h,1+Math.random()*2.5,0,7);g.fill()}});
T.locker=ctex(256,128,(g,w,h)=>{const n=8,s=w/n;for(let i=0;i<n;i++){g.fillStyle=`hsl(${205+Math.random()*6},${22+Math.random()*8}%,${30+Math.random()*6}%)`;g.fillRect(i*s,0,s,h);g.fillStyle='#1b232b';g.fillRect(i*s,0,2,h);
 for(let v=0;v<4;v++)g.fillRect(i*s+8,10+v*5,s-16,2);g.fillStyle='#aab';g.fillRect(i*s+s-9,h*.5,3,12);if(Math.random()<.25){g.fillStyle='rgba(120,40,30,.6)';g.fillRect(i*s+5,h*.3,s-10,h*.4)}}grime(g,w,h,6,.4)});
T.bark=ctex(64,256,(g,w,h)=>{g.fillStyle='#2a1d14';g.fillRect(0,0,w,h);for(let i=0;i<300;i++){g.fillStyle=Math.random()<.5?'#1a120c':'#3b2a1d';g.fillRect(Math.random()*w,Math.random()*h,2,10+Math.random()*20)}});
T.leaf=ctex(128,128,(g,w,h)=>{g.fillStyle='#0f1d0c';g.fillRect(0,0,w,h);for(let i=0;i<2500;i++){g.fillStyle=`hsl(${85+Math.random()*40},${35+Math.random()*30}%,${6+Math.random()*16}%)`;g.beginPath();g.arc(Math.random()*w,Math.random()*h,1+Math.random()*3,0,7);g.fill()}});
T.water=ctex(256,256,(g,w,h)=>{g.fillStyle='#04090f';g.fillRect(0,0,w,h);for(let i=0;i<500;i++){g.strokeStyle=`rgba(${90+Math.random()*60},${110+Math.random()*60},160,${.05+Math.random()*.12})`;g.beginPath();const x=Math.random()*w,y=Math.random()*h;g.moveTo(x,y);g.lineTo(x+6+Math.random()*20,y);g.stroke()}},3,3);
const text=(str,{w=512,h=128,bg='#0c3b22',fg='#e8f2e8',font='bold 64px Arial',border='#dfe'}={})=>ctex(w,h,(g)=>{g.fillStyle=bg;g.fillRect(0,0,w,h);if(border){g.strokeStyle=border;g.lineWidth=6;g.strokeRect(8,8,w-16,h-16)}g.fillStyle=fg;g.font=font;g.textAlign='center';g.textBaseline='middle';g.fillText(str,w/2,h/2+4)});
// ---------- materials ----------
const M={};for(const k of['lino','asph','grass','path','conc'])M[k]=new THREE.MeshStandardMaterial({map:T[k],roughness:k=='lino'?.45:.95,metalness:0});
M.ceil=new THREE.MeshStandardMaterial({map:T.ceil,roughness:1});M.block=new THREE.MeshStandardMaterial({map:T.block,roughness:.85});M.cwall=new THREE.MeshStandardMaterial({map:T.cwall,roughness:1});
M.hedge=new THREE.MeshStandardMaterial({map:T.hedge,roughness:1});M.locker=new THREE.MeshStandardMaterial({map:T.locker,roughness:.5,metalness:.4});M.bark=new THREE.MeshStandardMaterial({map:T.bark,roughness:1});
M.leaf=new THREE.MeshStandardMaterial({map:T.leaf,roughness:1});M.water=new THREE.MeshStandardMaterial({map:T.water,color:0x99aacc,roughness:.08,metalness:.85,emissive:0x050a14});
M.metal=new THREE.MeshStandardMaterial({color:0x3a3d42,roughness:.5,metalness:.7});M.dark=new THREE.MeshStandardMaterial({color:0x111113,roughness:.8});M.stone=new THREE.MeshStandardMaterial({color:0xb8b2a4,roughness:.85,map:T.path});
M.wood=new THREE.MeshStandardMaterial({color:0x4a3322,roughness:.9});M.glass=new THREE.MeshStandardMaterial({color:0x223344,roughness:.05,metalness:.6,transparent:true,opacity:.45});
M.fluor=[0,1,2].map(i=>new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xfff0d0,emissiveIntensity:i==2?.05:2.2}));
M.sodium=new THREE.MeshStandardMaterial({color:0xffcf90,emissive:0xff9a3c,emissiveIntensity:3});M.exit=new THREE.MeshStandardMaterial({map:text('EXIT',{w:256,h:96,bg:'#300',fg:'#ff3030',font:'bold 70px Arial',border:null}),emissive:0xff2020,emissiveIntensity:1.4,emissiveMap:null});
M.exit.emissiveMap=M.exit.map;
const FACADES=[facade(true),facade(true),facade(false)];
// ---------- instancing helper ----------
const _o=new THREE.Object3D();
function inst(geo,mat,items,{shadow=false,colors=null}={}){if(!items.length)return null;const m=new THREE.InstancedMesh(geo,mat,items.length);items.forEach((it,i)=>{_o.position.set(it[0],it[1],it[2]);_o.rotation.set(it[4]||0,it[3]||0,0);_o.scale.set(it[5]||1,it[6]||1,it[7]||1);_o.updateMatrix();m.setMatrixAt(i,_o.matrix);if(colors)m.setColorAt(i,colors[i])});scene.add(m);return m}
const cellPlane=new THREE.PlaneGeometry(S,S);cellPlane.rotateX(-Math.PI/2);
// floors + ceilings
const floors={};for(let z=0;z<H;z++)for(let x=0;x<W;x++){const k=F[z][x];(floors[k]??=[]).push([x*S,0,z*S])}
for(const k in floors)inst(cellPlane,M[k],floors[k]);
const ceilG=new THREE.PlaneGeometry(S,S);ceilG.rotateX(Math.PI/2);
const ceils=[],gceils=[];for(let z=0;z<H;z++)for(let x=0;x<W;x++)if(IN[z][x]&&G[z][x]!='#'&&G[z][x]!='c')(F[z][x]=='conc'?gceils:ceils).push([x*S,3.2,z*S]);
inst(ceilG,M.ceil,ceils);inst(ceilG,new THREE.MeshStandardMaterial({map:T.asph,color:0x9a9a9a,roughness:1}),gceils.map(p=>[p[0],3.5,p[2]]));
// walls
const WALL_IN=3.2,WALL_OUT=6.6;
const wallIn=[],wallG=[],fac=[[],[],[]],hedges=[];
for(let z=0;z<H;z++)for(let x=0;x<W;x++){const c=G[z][x];
 if(c=='#'){if(PERIM.has(x+','+z))fac[Math.floor(rnd()*3)].push([x*S,WALL_OUT/2,z*S,0,0,1,1,1]);else wallIn.push([x*S,WALL_IN/2,z*S])}
 else if(c=='c')wallG.push([x*S,1.75,z*S]);else if(c=='F')hedges.push([x*S,.8,z*S])}
inst(new THREE.BoxGeometry(S,WALL_IN,S),M.block,wallIn);inst(new THREE.BoxGeometry(S,3.5,S),M.cwall,wallG);inst(new THREE.BoxGeometry(S,1.6,S),M.hedge,hedges);
FACADES.forEach((m,i)=>inst(new THREE.BoxGeometry(S,WALL_OUT,S),m,fac[i]));
// building roofs (parapet slab hides interior from outside)
for(const b of BUILD){const w=(b.x1-b.x0+1)*S,d=(b.z1-b.z0+1)*S,h=b.garage?3.6:WALL_OUT;const r=new THREE.Mesh(new THREE.BoxGeometry(w,.4,d),M.dark);r.position.set((b.x0+b.x1)/2*S,h+.2,(b.z0+b.z1)/2*S);scene.add(r);
 if(!b.garage){const ib=new THREE.Mesh(new THREE.BoxGeometry(w-S*.9,WALL_OUT-WALL_IN-.05,d-S*.9),M.dark);ib.position.set(r.position.x,WALL_IN+(WALL_OUT-WALL_IN)/2+.02,r.position.z);scene.add(ib)}}
// ---------- sky ----------
const skyT=ctex(2048,1024,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#000003');gr.addColorStop(.35,'#03050d');gr.addColorStop(.47,'#141a2c');gr.addColorStop(.5,'#3a2a22');gr.addColorStop(.52,'#08080a');gr.addColorStop(1,'#050505');g.fillStyle=gr;g.fillRect(0,0,w,h);
 for(let i=0;i<2600;i++){const y=Math.pow(Math.random(),1.4)*h*.48,a=Math.random()*.9*(1-y/(h*.5));g.fillStyle=`rgba(${200+Math.random()*55},${200+Math.random()*55},255,${a})`;const s=Math.random()<.04?2:1;g.fillRect(Math.random()*w,y,s,s)}
 for(let i=0;i<14;i++){const x=Math.random()*w,y=h*(.3+Math.random()*.15),r=80+Math.random()*200,c=g.createRadialGradient(x,y,0,x,y,r);c.addColorStop(0,'rgba(40,40,55,.25)');c.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=c;g.fillRect(x-r,y-r,2*r,2*r)}});
skyT.wrapS=THREE.RepeatWrapping;skyT.repeat.set(1,1);
const sky=new THREE.Mesh(new THREE.SphereGeometry(300,48,24),new THREE.MeshBasicMaterial({map:skyT,side:THREE.BackSide,fog:false,depthWrite:false}));scene.add(sky);
const moon=new THREE.Sprite(new THREE.SpriteMaterial({map:ctex(256,256,(g,w)=>{const c=g.createRadialGradient(w/2,w/2,0,w/2,w/2,w/2);c.addColorStop(0,'rgba(255,250,235,1)');c.addColorStop(.17,'rgba(235,232,215,1)');c.addColorStop(.2,'rgba(160,170,200,.35)');c.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=c;g.fillRect(0,0,w,w);
 g.fillStyle='rgba(150,145,130,.5)';for(const[a,b,r]of[[.46,.45,8],[.55,.53,6],[.5,.58,4]]){g.beginPath();g.arc(a*w,b*w,r,0,7);g.fill()}}),fog:false,depthWrite:false,transparent:true}));moon.scale.set(60,60,1);scene.add(moon);
// ---------- light fixtures (emissive meshes) + pooled real lights ----------
const FIX=[],COLLIDE=[];   // {x,y,z,col,range,int,grp}
const fluor=[[],[],[]];
for(let z=0;z<H;z++)for(let x=0;x<W;x++)if(IN[z][x]&&walk(x,z)&&(x*7+z*3)%4==0){const grp=rnd()<.15?2:rnd()<.3?1:0;const along=walk(x+1,z)||walk(x-1,z)?0:Math.PI/2;
 fluor[grp].push([x*S,(F[z][x]=='conc'?3.45:3.17),z*S,along]);FIX.push({x:x*S,y:2.9,z:z*S,col:F[z][x]=='conc'?0xd8f0ff:0xffe6b8,range:11,int:F[z][x]=='conc'?14:16,grp})}
const fluorG=new THREE.BoxGeometry(2.4,.06,.5);fluor.forEach((l,i)=>inst(fluorG,M.fluor[i],l));
// outdoor sodium poles
const poles=[];const pole=(gx,gz,ox=1.5,oz=1.5)=>{const px=gx*S+ox,pz=gz*S+oz;poles.push([px,0,pz]);COLLIDE.push([px,pz,.22]);FIX.push({x:px,y:5.6,z:pz,col:0xff9440,range:26,int:170,grp:rnd()<.2?1:0,out:1})};
for(let x=3;x<W-2;x+=6){pole(x,12,0,1.7);pole(x+3,16,0,-1.7)}
for(const[x,z]of[[1,22],[8,22],[15,22],[1,27],[8,27],[15,27],[1,33],[8,33],[15,33],[18,18],[30,18],[18,32],[30,32],[24,33],[17,4],[17,9],[34,6]])if(G[z]?.[x]=='.'||G[z]?.[x]=='T'){G[z][x]='.';pole(x,z)}
inst(new THREE.CylinderGeometry(.09,.13,5.8,8).translate(0,2.9,0),M.metal,poles);
inst(new THREE.BoxGeometry(.9,.22,.45).translate(.35,5.85,0),M.sodium,poles);
const POOL=[];for(let i=0;i<14;i++){const l=new THREE.PointLight(0xffffff,0,10,2);scene.add(l);POOL.push(l)}
// ---------- props ----------
// trees
const trees=[];for(let z=0;z<H;z++)for(let x=0;x<W;x++)if(G[z][x]=='T')trees.push([x*S+(rnd()-.5),0,z*S+(rnd()-.5),rnd()*6,0,.8+rnd()*.5,.8+rnd()*.6,.8+rnd()*.5]);
inst(new THREE.CylinderGeometry(.18,.32,3.4,7).translate(0,1.7,0),M.bark,trees);
inst(new THREE.IcosahedronGeometry(1.9,1).translate(0,4.3,0),M.leaf,trees);inst(new THREE.IcosahedronGeometry(1.4,1).translate(.8,3.5,.4),M.leaf,trees);
// water
const water=new THREE.Mesh(new THREE.CircleGeometry(1,48),M.water);water.rotation.x=-Math.PI/2;water.scale.set(5.6*S,4.6*S,1);water.position.set(LC[0]*S,.04,LC[1]*S);scene.add(water);
// cars
const carCols=[0x1f2a3a,0x5a1414,0x2b2b2e,0x8a8a8a,0x173322,0xcfcfcf,0x3a2a14].map(c=>new THREE.Color(c));
const carBodyM=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.35,metalness:.6});
const ci=CARS.map(([x,z])=>[x*S,.55,z*S,(rnd()-.5)*.15]);const cc=CARS.map(()=>carCols[Math.floor(rnd()*carCols.length)]);
inst(new THREE.BoxGeometry(1.9,.8,4.2),carBodyM,ci,{colors:cc});inst(new THREE.BoxGeometry(1.7,.6,2.2).translate(0,.65,-.2),M.glass,ci);
inst(new THREE.CylinderGeometry(.36,.36,2,12).rotateZ(Math.PI/2).translate(0,-.2,1.3),M.dark,ci);inst(new THREE.CylinderGeometry(.36,.36,2,12).rotateZ(Math.PI/2).translate(0,-.2,-1.3),M.dark,ci);
// parking stripes + lane dashes
const stripeM=new THREE.MeshBasicMaterial({color:0xbfbfae,fog:true});const yel=new THREE.MeshBasicMaterial({color:0xb08a1c});
const stripes=[];for(const z of[19.5,24.5,29.5])for(let x=1.5;x<16;x+=1)stripes.push([x*S,.02,z*S,0,0,1,1,1]);
inst(new THREE.PlaneGeometry(.12,S*2-.4).rotateX(-Math.PI/2),stripeM,stripes);
const dash=[];for(let x=1;x<W-1;x+=1)dash.push([x*S,.02,14*S]);inst(new THREE.PlaneGeometry(1.8,.16).rotateX(-Math.PI/2),yel,dash);
const curbs=[];for(let x=1;x<W-1;x++){curbs.push([x*S,.08,12.5*S]);curbs.push([x*S,.08,15.5*S])}inst(new THREE.BoxGeometry(S,.16,.3),M.stone,curbs);
// indoor props: lockers on hallway walls, benches, trash, vending
const lockers=[],benches=[],trash=[],vend=[],posters=[];
const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
for(let z=0;z<H;z++)for(let x=0;x<W;x++){if(!walk(x,z))continue;
 const solidN=dirs.filter(([a,b])=>{const c=G[z+b]?.[x+a];return c=='#'||c=='c'});
 if(IN[z][x]&&F[z][x]=='lino'){
  for(const[a,b]of solidN){const r=rnd();const px=x*S+a*(S/2-.28),pz=z*S+b*(S/2-.28),ry=a?Math.PI/2:0;
   if(r<.28)lockers.push([px,1.0,pz,ry]);else if(r<.34)posters.push([x*S+a*(S/2-.02),1.6,z*S+b*(S/2-.02),Math.atan2(-a,-b)]);}
  if(solidN.length==3&&rnd()<.5){const[a,b]=solidN.find(([a,b])=>!walk(x+a,z+b));vend.push([x*S+a*(S/2-.5),1,z*S+b*(S/2-.5),Math.atan2(-a,-b)]);FIX.push({x:x*S+a*(S/2-1.2),y:1.2,z:z*S+b*(S/2-1.2),col:0x9fd0ff,range:6,int:5,grp:0})}
  else if(solidN.length==2&&rnd()<.12)trash.push([x*S+(rnd()-.5)*2,.45,z*S+(rnd()-.5)*2]);
 }else if(!IN[z][x]){
  if((F[z][x]=='path'||F[z][x]=='grass')&&rnd()<.04)benches.push([x*S+(rnd()-.5)*2,0,z*S+(rnd()-.5)*2,Math.floor(rnd()*4)*Math.PI/2]);
  else if(F[z][x]=='path'&&rnd()<.05)trash.push([x*S+1.4,.45,z*S+1.4]);}}
inst(new THREE.BoxGeometry(S-.2,2,.5),M.locker,lockers);
const benchG=new THREE.BoxGeometry(2.2,.1,.6).translate(0,.5,0);inst(benchG,M.wood,benches);inst(new THREE.BoxGeometry(2.2,.5,.08).translate(0,.85,.28),M.wood,benches);inst(new THREE.BoxGeometry(.1,.5,.5).translate(-1,.25,0),M.metal,benches);inst(new THREE.BoxGeometry(.1,.5,.5).translate(1,.25,0),M.metal,benches);
inst(new THREE.CylinderGeometry(.32,.28,.9,12),new THREE.MeshStandardMaterial({color:0x2c3a2c,roughness:.6,metalness:.3}),trash);
const vendFront=ctex(128,256,(g,w,h)=>{g.fillStyle='#101418';g.fillRect(0,0,w,h);g.fillStyle='#bfe3ff';g.fillRect(8,10,w*.68,h*.75);for(let r=0;r<6;r++)for(let c=0;c<4;c++){g.fillStyle=`hsl(${Math.random()*360},70%,50%)`;g.fillRect(14+c*20,18+r*31,14,22)}g.fillStyle='#d22';g.fillRect(w*.8,20,18,40);g.fillStyle='#000';g.fillRect(14,h*.82,w*.6,24)});
const vendM=new THREE.MeshStandardMaterial({map:vendFront,emissive:0xffffff,emissiveMap:vendFront,emissiveIntensity:.9,roughness:.3});
for(const v of vend){const m=new THREE.Mesh(new THREE.BoxGeometry(1.1,2,.9),[M.dark,M.dark,M.dark,M.dark,vendM,M.dark]);m.position.set(v[0],v[1],v[2]);m.rotation.y=v[3];scene.add(m)}
const posterT=[0,1,2,3].map(i=>ctex(128,180,(g,w,h)=>{g.fillStyle=['#e9e3d0','#1d3b6b','#7a1a1a','#e2c84a'][i];g.fillRect(0,0,w,h);g.fillStyle=i==0?'#222':'#f2f2f2';g.font='bold 18px Arial';g.textAlign='center';
 g.fillText(['CLUB FAIR','SEAHAWKS','MISSING','FINALS'][i],w/2,34);g.font='11px Arial';for(let l=0;l<7;l++)g.fillRect(14,56+l*14,w-28-Math.random()*30,4);if(i==2){g.fillStyle='#000';g.fillRect(34,60,60,70)}}));
for(const p of posters){const m=new THREE.Mesh(new THREE.PlaneGeometry(.8,1.1),new THREE.MeshStandardMaterial({map:posterT[Math.floor(rnd()*4)],roughness:.9}));m.position.set(p[0],p[1],p[2]);m.rotation.y=p[3];scene.add(m)}
// doors: frame, transom, open glass leaves, EXIT sign
for(const d of DOORS){const cx=d.x*S,cz=d.z*S,ry=d.dx?Math.PI/2:0;const grp=new THREE.Group();grp.position.set(cx,0,cz);grp.rotation.y=ry;scene.add(grp);
 const isG=F[d.z][d.x]=='conc';const top=isG?3.5:WALL_IN,wallH=isG?3.5:(PERIM.has(d.x+','+d.z)?WALL_OUT:WALL_IN);
 const lintel=new THREE.Mesh(new THREE.BoxGeometry(S,wallH-2.6,S),isG?M.cwall:FACADES[2]);lintel.position.y=2.6+(wallH-2.6)/2;grp.add(lintel);
 for(const s of[-1,1]){const jamb=new THREE.Mesh(new THREE.BoxGeometry(.5,2.6,S),isG?M.cwall:M.metal);jamb.position.set(s*(S/2-.25),1.3,0);grp.add(jamb);
  if(!isG){const leaf=new THREE.Mesh(new THREE.BoxGeometry(1.3,2.4,.06),M.glass);leaf.position.set(s*1.2,1.2,-.8);leaf.rotation.y=s*1.2;grp.add(leaf);
   const fr=new THREE.Mesh(new THREE.BoxGeometry(1.32,.1,.1),M.metal);fr.position.copy(leaf.position);fr.position.y=2.4;fr.rotation.y=leaf.rotation.y;grp.add(fr)}}
 if(!isG){const ex=new THREE.Mesh(new THREE.BoxGeometry(.7,.28,.1),M.exit);ex.position.set(0,2.85,-(S/2)-.06);grp.add(ex);const ex2=ex.clone();ex2.position.z=S/2+.06;ex2.rotation.y=Math.PI;grp.add(ex2)}}
// Bailey Hall portico: pillars + canopy + name. Library columns too.
const pillarG=new THREE.CylinderGeometry(.34,.4,6.2,16).translate(0,3.1,0);
const pillars=[];for(let k=2;k<=9;k++){const x=(k+.5)*S;pillars.push([x,0,12.4*S]);COLLIDE.push([x,12.4*S,.45])}
for(let i=0;i<4;i++){const x=(24.5+i*2)*S;pillars.push([x,0,12.4*S]);COLLIDE.push([x,12.4*S,.45])}
inst(pillarG,M.stone,pillars);
const canopy=new THREE.Mesh(new THREE.BoxGeometry(8*S+1.5,.5,2.6),M.stone);canopy.position.set(6*S,6.3,12.15*S);scene.add(canopy);
const lc=canopy.clone();lc.scale.x=(6*S+1.5)/(8*S+1.5);lc.position.set(27.5*S,6.3,12.15*S);scene.add(lc);
const sign=(str,x,y,z,ry,w=6,h=1.5,o)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:text(str,o),roughness:.7,emissive:0xffffff,emissiveIntensity:.08,emissiveMap:null}));m.material.emissiveMap=m.material.map;m.position.set(x,y,z);m.rotation.y=ry;scene.add(m);return m};
const slate={bg:'#1b1b1b',fg:'#d9d2c0',border:null,font:'bold 58px Georgia'};
sign('BAILEY HALL',7*S,5.3,11.5*S+.06,0,8,1.6,slate);sign('LIBRARY',27*S,5.3,11.5*S+.06,0,6,1.5,slate);sign('STUDENT SERVICES',39*S,5.3,16.5*S-.06,Math.PI,9,1.5,slate);
sign('BAILEY HALL',13.5*S+.06,5.3,6*S,Math.PI/2,7,1.4,slate);sign('LIBRARY',20.5*S-.06,5.3,6*S,-Math.PI/2,6,1.4,slate);
const street=(str,x,z,ry)=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,3.4,6).translate(0,1.7,0),M.metal);p.position.set(x,0,z);scene.add(p);sign(str,x,3.2,z,ry,2.4,.5,{w:512,h:110,font:'bold 56px Arial'});sign(str,x,3.2,z,ry+Math.PI,2.4,.5,{w:512,h:110,font:'bold 56px Arial'})};
street('SEAHAWK LN',14.3*S,12.3*S,0);street('SEAHAWK LN',32.3*S,16.3*S,0);street('MEMORIAL LAKE',17.4*S,17.5*S,Math.PI/2);street('LOT 4 · PERMIT',1.5*S,17.4*S,0);street('BROWARD COLLEGE',46.6*S,13.5*S,-Math.PI/2);
// courtyard planters
const pl=[];for(const[x,z]of[[15,3],[19,3],[15,9],[19,9]])if(walk(x,z)){pl.push([x*S,0,z*S]);COLLIDE.push([x*S,z*S,.9])}
inst(new THREE.CylinderGeometry(.85,.95,.7,16).translate(0,.35,0),M.stone,pl);inst(new THREE.IcosahedronGeometry(.75,1).translate(0,1,0),M.leaf,pl);
// grass tufts outdoors for depth
const tufts=[];for(let z=0;z<H;z++)for(let x=0;x<W;x++)if(F[z][x]=='grass'&&walk(x,z))for(let i=0;i<5;i++)tufts.push([x*S+(rnd()-.5)*S,0,z*S+(rnd()-.5)*S,rnd()*3,0,1,.6+rnd()*.8,1]);
const tuftG=new THREE.ConeGeometry(.12,.45,4).translate(0,.22,0);inst(tuftG,new THREE.MeshStandardMaterial({color:0x1d3014,roughness:1}),tufts);

// =====================================================================
//  3D CHARACTERS: procedural low-poly rigs (hips > torso > head/arms, hips > legs)
// =====================================================================
const faceTex=(kind,skin,hair)=>ctex(256,256,(g,w,h)=>{g.fillStyle=skin;g.fillRect(0,0,w,h);
 if(kind=='verity'){g.fillStyle='#f5d21a';g.beginPath();g.arc(128,128,124,0,7);g.fill();g.fillStyle='#000';g.beginPath();g.ellipse(88,100,14,30,0,0,7);g.ellipse(168,100,14,30,0,0,7);g.fill();g.lineWidth=14;g.beginPath();g.arc(128,130,80,.25,Math.PI-.25);g.stroke();g.fillStyle='rgba(120,0,0,.7)';for(let i=0;i<5;i++)g.fillRect(84+i*20,190+Math.random()*10,4,30+Math.random()*30);return}
 if(kind=='julian'){g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,0,w,h);g.fillStyle='#000';g.beginPath();g.ellipse(90,105,26,32,0,0,7);g.ellipse(166,105,26,32,0,0,7);g.fill();g.fillStyle='#f22';g.beginPath();g.arc(92,108,5,0,7);g.arc(164,108,5,0,7);g.fill();g.fillStyle='#120000';g.beginPath();g.ellipse(128,190,62,22,0,0,7);g.fill();g.fillStyle='#ddd';for(let i=0;i<10;i++){g.fillRect(72+i*11,172,6,14);g.fillRect(72+i*11,196,6,12)}g.fillStyle=hair;g.fillRect(0,0,w,40);return}
 g.fillStyle=hair;g.fillRect(0,0,w,46);g.fillStyle='#fff';g.fillRect(70,100,36,18);g.fillRect(150,100,36,18);g.fillStyle='#1a1008';g.fillRect(80,101,16,16);g.fillRect(160,101,16,16);g.fillStyle=hair;g.fillRect(66,84,44,8);g.fillRect(146,84,44,8);g.fillStyle='rgba(60,20,20,.8)';g.fillRect(100,180,56,8)});
const LOOKS={ashaad:{skin:'#7a5440',hair:'#1a120c',shirt:0xd2d1d6,pants:0x0e141d,shoe:0x4b4c50},
 emmanuel:{skin:'#5a3d2c',hair:'#120c08',shirt:0x62435f,pants:0x0b0c0b,shoe:0x060504},
 landry:{skin:'#c99a82',hair:'#3a2a20',shirt:0x6a8dd7,pants:0x090f1d,shoe:0x12141b},
 julian:{skin:'#b8a89c',hair:'#0c0808',shirt:0x18131a,pants:0x1e1918,shoe:0x080606,kind:'julian',h:1.22},
 verity:{skin:'#3f2d10',hair:'#2a1a06',shirt:0x463a1a,pants:0x2a2010,shoe:0x040301,kind:'verity',h:1.12}};
const BX=(w,h,d,y=0)=>new THREE.BoxGeometry(w,h,d).translate(0,y,0);
// photo crop boxes [x0,y0,x1,y1] in 864x1152 source: face, torso (shirt only), viewer-left leg, viewer-right leg, hips
const PHOTO={ashaad:['assets/ashaad-fullbody.jpg',[372,72,482,195],[310,200,545,555],[312,560,428,1000],[432,560,545,1000],[310,545,545,640]],
 emmanuel:['assets/emmanuel-survivor.jpg',[388,88,505,205],[300,215,570,595],[250,610,425,985],[430,610,600,985],[285,590,580,690]],
 landry:['assets/landry-fullbody.jpg',[365,85,485,200],[345,200,560,490],[352,495,452,1000],[452,495,560,1000],[320,480,540,580]],
 julian:['assets/julian-horror.jpg',[362,115,505,275],[300,265,540,665],[268,680,405,1080],[420,680,600,1080],[290,660,530,760]],
 verity:['assets/verity-landry-evil.jpg',[342,35,535,245],[300,230,560,515],[240,540,385,1045],[415,540,600,1045],[280,505,560,600]]};
const PIMG={},PTEX={};
// texture from a sub-rectangle of a crop box (fy0..fy1 = vertical fraction), stretched to fill the canvas
const photoTex=(key,i,fy0=0,fy1=1)=>{const id=key+i+'_'+fy0+'_'+fy1;if(PTEX[id])return PTEX[id];const [src]=PHOTO[key],B=PHOTO[key][i],c=document.createElement('canvas');c.width=256;c.height=i==1?256:512;const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=ANISO;
 const y0=B[1]+(B[3]-B[1])*fy0,y1=B[1]+(B[3]-B[1])*fy1;
 const draw=im=>{const g=c.getContext('2d');g.drawImage(im,B[0],y0,B[2]-B[0],y1-y0,0,0,c.width,c.height);t.needsUpdate=true};
 let im=PIMG[src];if(!im){im=PIMG[src]=new Image();im.src=src}if(im.complete&&im.naturalWidth)draw(im);else im.addEventListener('load',()=>draw(im));return PTEX[id]=t};
// front planar projection: u from x, v from y over the geometry's own bounds, so the photo stretches over the faceted mesh
// facing the camera (+z) the right way up; back faces get the mirrored same image instead of a wrapped seam
const planarUV=(geo,mirror=false)=>{geo.computeBoundingBox();const bb=geo.boundingBox,p=geo.attributes.position,uv=geo.attributes.uv,w=bb.max.x-bb.min.x||1,h=bb.max.y-bb.min.y||1;
 for(let i=0;i<p.count;i++){let u=(p.getX(i)-bb.min.x)/w;if(mirror)u=1-u;uv.setXY(i,u,(p.getY(i)-bb.min.y)/h)}uv.needsUpdate=true;return geo};
const TAPER=(rt,rb,len,y,seg=7)=>new THREE.CylinderGeometry(rt,rb,len,seg,2).translate(0,y,0);
function rig(key,glow=0){const L=LOOKS[key],std=(c,map)=>new THREE.MeshStandardMaterial({color:map?0xffffff:c,map:map||null,roughness:.8,flatShading:true,emissive:c,emissiveIntensity:glow*(map?.4:1),emissiveMap:map||null});
 const skinM=std(new THREE.Color(L.skin).getHex()),shirtM=std(L.shirt,photoTex(key,2)),pantsM=std(L.pants,photoTex(key,5)),shoeM=std(L.shoe),sleeveM=std(L.shirt),hairM=std(new THREE.Color(L.hair).getHex());
 const root=new THREE.Group(),hips=new THREE.Group(),torso=new THREE.Group();root.add(hips);hips.position.y=.95;hips.add(torso);
 const add=(p,geo,m,x=0,y=0,z=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);p.add(o);return o};
 add(hips,planarUV(TAPER(.17,.18,.2,0,8)),pantsM).scale.z=.7;
 const ch=add(torso,planarUV(TAPER(.23,.17,.52,.3,8)),shirtM);ch.scale.z=.62;add(torso,new THREE.SphereGeometry(.23,8,3,0,Math.PI*2,0,Math.PI/2).translate(0,.555,0),sleeveM).scale.set(1,.25,.62);
 add(torso,TAPER(.06,.07,.12,.62,6),skinM);
 const neck=new THREE.Group();neck.position.y=.66;torso.add(neck);
 const hd=add(neck,new THREE.IcosahedronGeometry(.155,1),skinM,0,.15,0);hd.scale.set(.92,1.12,1);
 const faceM=new THREE.MeshStandardMaterial({map:photoTex(key,1),roughness:.7,flatShading:true,emissive:0xffffff,emissiveMap:photoTex(key,1),emissiveIntensity:L.kind?.35:.18});
 add(neck,planarUV(new THREE.SphereGeometry(.152,10,7,0,Math.PI,Math.PI*.12,Math.PI*.72)),faceM,0,.15,.012).scale.set(.95,1.15,1.04);
 if(L.kind!='verity')add(neck,new THREE.SphereGeometry(.165,8,4,0,Math.PI*2,0,Math.PI*.42),hairM,0,.17,-.01).scale.set(.95,1.1,1.02);
 if(L.kind!='verity')add(neck,new THREE.SphereGeometry(.16,8,5,Math.PI,Math.PI,0,Math.PI*.7),hairM,0,.155,-.012).scale.set(.95,1.13,1.02);
 const limb=(p,x,y,len,m1,m2,w=.12,end)=>{const a=new THREE.Group();a.position.set(x,y,0);p.add(a);add(a,planarUV(TAPER(w*.62,w*.5,len/2,-len/4)),m1);add(a,planarUV(new THREE.IcosahedronGeometry(w*.55,0)),m1);const b=new THREE.Group();b.position.y=-len/2;a.add(b);add(b,planarUV(TAPER(w*.5,w*.38,len/2,-len/4)),m2);if(end)add(b,end,shoeM,0,-len/2,.05);return[a,b]};
 const hand=new THREE.IcosahedronGeometry(.055,0).translate(0,-.33,0);
 const al=limb(torso,-.27,.5,.62,sleeveM,skinM,.12),ar=limb(torso,.27,.5,.62,sleeveM,skinM,.12);add(al[1],hand,skinM);add(ar[1],hand,skinM);
 const shoe=new THREE.BoxGeometry(.13,.08,.27,1,1,2);
 const legM=(i,a,b)=>std(L.pants,photoTex(key,i,a,b));
 // character's left leg (-x) appears on the viewer's left when facing camera
 const ll=limb(hips,-.1,-.06,.86,legM(3,0,.5),legM(3,.5,1),.17,shoe),lr=limb(hips,.1,-.06,.86,legM(4,0,.5),legM(4,.5,1),.17,shoe);
 root.traverse(o=>{if(o.isMesh)o.castShadow=false});
 root.scale.setScalar(L.h||1);root.userData={hips,torso,neck,al,ar,ll,lr,crouch:0,key,mats:[skinM,shirtM,pantsM,shoeM]};
 const sh=new THREE.Mesh(new THREE.CircleGeometry(.45,20).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.55,depthWrite:false}));sh.position.y=.03;scene.add(sh);root.userData.shadow=sh;scene.add(root);return root}
// style: 'run' | 'back' | 'idle' | 'strafe' | 'julian' | 'verity' | 'grab'
function pose(r,ph,amp,style,crouchT,dt,tt){const u=r.userData;u.crouch+=(crouchT-u.crouch)*Math.min(1,dt*8);const c=u.crouch,s=Math.sin(ph),s2=Math.sin(ph*2),k=Math.max(0,Math.sin(ph+1.6));
 let lean=.06*amp,legA=.55*amp,knee=.7*amp,armA=.6*amp,elbow=-.4,armOff=0,headY=0,headX=0,bob=Math.abs(s)*.06*amp,twist=0,armX=0;
 if(style=='back'){lean=-.2;legA=.4*amp;knee=.9*amp;armA=.25*amp;armOff=-.9;elbow=-1.2;headY=Math.sin(tt*1.7)*.9;bob=Math.abs(s)*.08*amp}
 if(style=='strafe'){twist=.5*Math.sign(amp);lean=.1;legA=.45;knee=.6;armA=.5}
 if(style=='julian'){lean=.55;legA=.8*amp;knee=1.0*amp;armA=.25*amp;armOff=-1.35;elbow=-.15;headX=-.45+Math.sin(tt*23)*.06*(amp>0);headY=Math.sin(tt*17)*.12;bob=Math.abs(s)*.12*amp}
 if(style=='verity'){lean=-.04;legA=.38*amp;knee=.25*amp;armA=.05;armOff=0;elbow=0;headX=.05;headY=0;twist=0;bob=.02;r.userData.neck.rotation.z=.45+Math.sin(tt*3)*.1;armX=.15}
 if(style=='grab'){lean=.35;armOff=-1.55;elbow=-.1;armA=.08;legA=.1;knee=.1;headX=-.2;headY=Math.sin(tt*30)*.15}
 if(style=='idle'){const b=Math.sin(tt*2.2);lean=.02;legA=0;knee=0;armA=0;elbow=-.15;bob=b*.01;headY=Math.sin(tt*.7)*.25}
 if(style!='verity')u.neck.rotation.z=0;
 u.hips.position.y=.95-c*.42+bob;u.hips.rotation.y=twist*.4;u.torso.rotation.x=lean+c*.35;u.torso.rotation.y=-twist*.3;u.neck.rotation.x=headX-c*.25;u.neck.rotation.y=headY;
 u.ll[0].rotation.x=-s*legA-c*1.25;u.lr[0].rotation.x=s*legA-c*1.25;u.ll[1].rotation.x=(Math.max(0,-Math.sin(ph))*knee)+c*2.0;u.lr[1].rotation.x=(Math.max(0,Math.sin(ph))*knee)+c*2.0;
 u.al[0].rotation.x=s*armA+armOff+c*.3;u.ar[0].rotation.x=-s*armA+armOff+c*.3;u.al[1].rotation.x=u.ar[1].rotation.x=elbow-c*.5;u.al[0].rotation.z=-armX;u.ar[0].rotation.z=armX;
 r.userData.shadow.position.set(r.position.x,.03,r.position.z)}
const jul=rig('julian',.12);const jl=new THREE.PointLight(0xff1010,6,7,2);scene.add(jl);
const ver=rig('verity',.1);ver.visible=ver.userData.shadow.visible=false;
let me=null;
const flash=new THREE.SpotLight(0xfff1d8,60,30,.48,.45,1.6);scene.add(flash,flash.target);

// =====================================================================
//  GAME
// =====================================================================
const P={x:0,z:0,yaw:0,stride:0,mv:0,crouch:0},J={x:0,z:0,stride:0,vx:0,vz:0},V={x:0,z:0,on:false,stride:0,vx:0,vz:0};
let qte=null,grace=0,hidden=false,keys={},t0=0,spd=3.6,lastScare=-99,frozenUntil=0,lastZone='',jSeen=false,envK=1,camYaw=0,camPos=new THREE.Vector3();
const solidCell=(gx,gz)=>gx<0||gz<0||gx>=W||gz>=H||!walk(gx,gz);
const hit=(x,z,r)=>{for(const gx of[Math.round((x-r)/S),Math.round((x+r)/S)])for(const gz of[Math.round((z-r)/S),Math.round((z+r)/S)])if(solidCell(gx,gz))return true;
 for(const[cx,cz,cr]of COLLIDE)if(Math.hypot(x-cx,z-cz)<cr+r)return true;return false};
function move(o,dx,dz,r){let m=0;if(!hit(o.x+dx,o.z,r)){o.x+=dx;m+=dx*dx}if(!hit(o.x,o.z+dz,r)){o.z+=dz;m+=dz*dz}return Math.sqrt(m)}
const tallSolid=(gx,gz)=>{const c=G[gz]?.[gx];return c===undefined||c=='#'||c=='c'};
const los=(a,b)=>{const d=Math.hypot(b.x-a.x,b.z-a.z),n=Math.ceil(d/.5);for(let i=1;i<n;i++){const x=a.x+(b.x-a.x)*i/n,z=a.z+(b.z-a.z)*i/n;if(tallSolid(Math.round(x/S),Math.round(z/S)))return false}return true};
// BFS distance field from the player (shared by both hunters, refreshed 5x/sec)
let DF=null,dfT=0;function buildDF(){DF=new Int16Array(W*H).fill(-1);const sx=Math.round(P.x/S),sz=Math.round(P.z/S),q=[sx+sz*W];DF[q[0]]=0;
 for(let i=0;i<q.length;i++){const c=q[i],x=c%W,z=(c/W)|0;for(const[a,b]of dirs){const nx=x+a,nz=z+b;if(walk(nx,nz)&&DF[nx+nz*W]<0){DF[nx+nz*W]=DF[c]+1;q.push(nx+nz*W)}}}}
function nextStep(M){const gx=Math.round(M.x/S),gz=Math.round(M.z/S);const here=DF[gx+gz*W];if(here<=1||here<0)return[P.x,P.z];let best=null,bd=here;
 for(const[a,b]of dirs){const d=DF[(gx+a)+(gz+b)*W];if(walk(gx+a,gz+b)&&d>=0&&d<bd){bd=d;best=[(gx+a)*S,(gz+b)*S]}}return best||[P.x,P.z]}
function begin(){audio();startDrone();startAmb();if(me){scene.remove(me,me.userData.shadow)}catches=0;$('qte').hidden=true;me=rig(who,.06);P.crouch=0;qte=null;grace=0;
 [P.x,P.z]=pStart;[J.x,J.z]=jStart;[V.x,V.z]=vStart;V.on=false;ver.visible=ver.userData.shadow.visible=false;P.yaw=0;camYaw=0;P.stride=0;spd=3.4;t0=performance.now();lastScare=-99;lastZone='';state='play';
 camPos.set(P.x,2,P.z+3);buildDF();
 ['title','intro','sel','over'].forEach(i=>$(i).hidden=true);$('over').classList.remove('strobe');$('hud').hidden=false;$('crouchB').hidden=false;document.body.classList.remove('shake');
 if(!COARSE)renderer.domElement.requestPointerLock?.()}
$('over').onclick=()=>state=='over'&&begin();
renderer.domElement.onclick=()=>{if(state=='play'&&!COARSE)renderer.domElement.requestPointerLock?.()};
addEventListener('mousemove',e=>{if(document.pointerLockElement&&state=='play')P.yaw-=e.movementX*.0024});
if(COARSE){$('touch').style.display='grid';$('touch').querySelectorAll('button').forEach(b=>{const k=b.dataset.k;b.ontouchstart=e=>{e.preventDefault();if(k=='c'){if(state=='play')P.crouch^=1;return}if(k=='mash'){mash();return}keys[k]=1};b.ontouchend=b.ontouchcancel=()=>keys[k]=0});
 let lx=null;renderer.domElement.addEventListener('touchmove',e=>{const x=e.touches[0].clientX;if(lx!=null)P.yaw-=(x-lx)*.006;lx=x},{passive:true});renderer.domElement.addEventListener('touchend',()=>lx=null)}
const cb=$('crouchB');cb.onclick=()=>{if(state=='play')P.crouch^=1};cb.ontouchstart=e=>{e.preventDefault();cb.onclick()};const qb=$('qkeyB');qb.onclick=e=>{e.stopPropagation();mash()};qb.ontouchstart=e=>{e.preventDefault();mash()};
const SCARE={};[['j','assets/anims/julian-jumpscare.png','assets/julian-horror.jpg'],['v','assets/anims/verity-jumpscare.png','assets/verity-landry-evil.jpg']].forEach(([k,a,b])=>{SCARE[k]={u:b,sheet:false};const i=new Image();i.onload=()=>SCARE[k]={u:a,sheet:true};i.src=a});
function jumpscare(k,now){const sc=SCARE[k],img=sc.u,D=RM?600:2400;$('js').classList.toggle('sheet',sc.sheet);lastScare=now/1000;frozenUntil=now+D;const j=$('js'),v=$('jsv');j.style.backgroundImage=`url(${img})`;[j,v].forEach(e=>{e.classList.remove('on');void e.offsetWidth;e.classList.add('on')});
 tone('sine',60,30,.4,.25);noise(.12,.15);setTimeout(()=>{scream(true);thump(50,.6);if(!RM)document.body.classList.add('shake')},300);setTimeout(()=>{tone('square',2200,1800,.5,.06);noise(.5,.3)},1100);setTimeout(()=>{thump(40,.7);tone('sawtooth',110,40,1,.15)},1550);
 setTimeout(()=>{[j,v].forEach(e=>e.classList.remove('on'));document.body.classList.remove('shake')},D)}
function showZone(z,sub){const e=$('zone');e.innerHTML=`${z}<small>${sub}</small>`;e.style.opacity=1;clearTimeout(e._t);e._t=setTimeout(()=>e.style.opacity=0,2400)}
function gotcha(now,by){state='over';scream(true);document.exitPointerLock?.();$('hud').hidden=true;$('crouchB').hidden=true;$('obj').textContent='';$('over').hidden=false;
 $('score').textContent=`${CAST[who].n} survived ${((now-t0)/1000).toFixed(1)}s`;$('overline').textContent=by=='v'?'\u201cverity was never landry.\u201d':'\u201cjulian has finded '+CAST[who].n.toLowerCase()+'.\u201d';
 if(!RM){$('over').classList.add('strobe');document.body.classList.add('shake')}}
// ambience: fluorescent hum indoors, crickets outdoors, footsteps
let hum=null,crick=null;function startAmb(){if(!ac||hum)return;const o=ac.createOscillator(),g=ac.createGain();o.type='sawtooth';o.frequency.value=120;const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=240;f.Q.value=6;g.gain.value=0;o.connect(f).connect(g).connect(ac.destination);o.start();hum=g;
 const c=ac.createGain();c.gain.value=0;c.connect(ac.destination);crick=c}
function chirp(){if(!ac||!crick)return;const t=ac.currentTime;for(let i=0;i<3;i++){const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=4200+Math.random()*400;g.gain.setValueAtTime(0,t+i*.07);g.gain.linearRampToValueAtTime(.5,t+i*.07+.01);g.gain.linearRampToValueAtTime(0,t+i*.07+.04);o.connect(g).connect(crick);o.start(t+i*.07);o.stop(t+i*.07+.05)}}
function footstep(outside){if(!ac)return;const d=.07,b=ac.createBuffer(1,ac.sampleRate*d,ac.sampleRate),x=b.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=(Math.random()*2-1)*Math.pow(1-i/x.length,3);
 const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();f.type='lowpass';f.frequency.value=outside?900:2200;g.gain.value=.12;s.buffer=b;s.connect(f).connect(g).connect(ac.destination);s.start()}

let last=performance.now(),poolT=0,flick={};
const fwd=y=>[-Math.sin(y),-Math.cos(y)],rgt=y=>[Math.cos(y),-Math.sin(y)];
function flickerVal(grp,tt,id){if(grp==2)return Math.random()<.015?1:0;if(grp==1){const n=Math.sin(tt*37+id)*Math.sin(tt*13.3+id*2);return n>.75?.1:(Math.random()<.03?.2:1)}return .93+Math.sin(tt*100+id)*.04}
function animActor(a,M,dt,moved,style,tt){M.stride+=moved;if(Math.hypot(M.vx,M.vz)>.2)a.rotation.y=Math.atan2(M.vx,M.vz);
 const stalk=hidden&&state=='play';pose(a,M.stride*(style=='julian'?2.6:3.4),moved>.001?1:0,state=='qte'&&qte?.by==(a==jul?'j':'v')?'grab':style,stalk?1:0,dt,tt)}
function mash(){if(!qte)return;qte.n++;tone('square',300+qte.n*40,200,.08,.12);const b=$('qbar');b.style.width=Math.min(100,qte.n/qte.need*100)+'%';$('qkey').textContent=qte.n%2?'F':'SPACE';
 if(qte.n>=qte.need){const M=qte.by=='j'?J:V,[sx,sz]=qte.by=='j'?jStart:vStart;const d=Math.hypot(P.x-M.x,P.z-M.z)||1;let pushed=false;for(let r=9;r>2&&!pushed;r--){const nx=P.x+(M.x-P.x)/d*r,nz=P.z+(M.z-P.z)/d*r;if(!hit(nx,nz,.3)){M.x=nx;M.z=nz;pushed=true}}if(!pushed){M.x=sx;M.z=sz}
  qte=null;state='play';grace=performance.now()+2500;$('qte').hidden=true;tone('sawtooth',200,900,.3,.2);showZone('BROKE FREE','run.');catches++}}
let catches=0,qte0by='j';
function startQTE(now,by){state='qte';qte0by=by;qte={start0:now,by,n:0,need:10+catches*4,end:now+(2600-Math.min(900,catches*250))};$('qte').hidden=false;$('qwho').textContent=(by=='j'?'JULIAN':'VERITY')+' HAS YOU';$('qbar').style.width='0%';scream(false);if(!RM)document.body.classList.add('shake');setTimeout(()=>document.body.classList.remove('shake'),600)}
function loop(now){requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;const tt=now/1000;
 if(state=='qte'&&qte){$('qtime').style.width=Math.max(0,(qte.end-now)/(qte.end-qte.start0||1)*100)+'%';if(now>qte.end){qte=null;$('qte').hidden=true;gotcha(now,qte0by)}}
 if(state!='play'&&state!='over'&&state!='qte'){renderer.render(scene,cam);return}
 // lights: pool the N nearest fixtures to the player
 poolT-=dt;if(poolT<=0){poolT=.15;FIX.sort((a,b)=>((a.x-P.x)**2+(a.z-P.z)**2)-((b.x-P.x)**2+(b.z-P.z)**2));}
 POOL.forEach((l,i)=>{const fx=FIX[i];if(!fx){l.intensity=0;return}l.position.set(fx.x,fx.y,fx.z);l.color.setHex(fx.col);l.distance=fx.range;const v=RM?Math.max(.6,flickerVal(fx.grp,tt*.2,i)):flickerVal(fx.grp,tt,fx.x+fx.z);l.intensity=fx.int*v});
 M.fluor[1].emissiveIntensity=RM?1.6:2.2*flickerVal(1,tt,3);M.sodium.emissiveIntensity=2.6+Math.sin(tt*2)*.2;
 let dist=99,vd=99;const [fx0,fz0]=fwd(P.yaw),[rx0,rz0]=rgt(P.yaw);
 if(state=='play'&&now>frozenUntil){
  if(keys.q||keys.arrowleft)P.yaw+=2.3*dt;if(keys.e||keys.arrowright)P.yaw-=2.3*dt;
  const f=(keys.w||keys.arrowup?1:0)-(keys.s||keys.arrowdown?1:0),s=(keys.d?1:0)-(keys.a?1:0),run=keys.shift&&!P.crouch?1.25:1,v=CAST[who].spd*dt*run*(f<0?.75:1)*(P.crouch?.45:1);
  const l=Math.hypot(f,s)||1;const moved=move(P,(fx0*f+rx0*s)/l*v,(fz0*f+rz0*s)/l*v,.38);
  const pf=Math.floor(P.stride/.5);P.stride+=moved*(f<0?-1:1);if(Math.floor(P.stride/.5)!=pf)footstep(!IN[Math.round(P.z/S)][Math.round(P.x/S)]);
  P.mv=moved>.0005?(s&&!f?(s>0?2:3):(f<0?4:1)):0;
  spd=Math.min(5.3,spd+dt*.03);dfT-=dt;if(dfT<=0){dfT=.2;buildDF()}
  const step=(M,sp)=>{const[tx,tz]=nextStep(M),dx=tx-M.x,dz=tz-M.z,d=Math.hypot(dx,dz)||1;const ox=M.x,oz=M.z;const st=Math.min(sp*dt,d);if(move(M,dx/d*st,dz/d*st,.3)<st*.2)move(M,-dz/d*st*(M.side||=1),dx/d*st*M.side,.3)||(M.side*=-1);M.vx=(M.x-ox)/dt;M.vz=(M.z-oz)/dt;return Math.hypot(M.x-ox,M.z-oz)};
  {const gx=Math.round(P.x/S),gz=Math.round(P.z/S),dk=Math.min(Math.hypot(P.x-J.x,P.z-J.z),V.on?Math.hypot(P.x-V.x,P.z-V.z):99);hidden=!!P.crouch&&dk>3.2&&(!los(P,J)||!IN[gz][gx]||P.mv==0)}
  const hs=(hidden?.35:1)*(window.__freeze?0:1);J.moved=step(J,spd*hs);const el=(now-t0)/1000;if(!V.on&&el>45){V.on=true;ver.visible=ver.userData.shadow.visible=true;showZone('SHE IS HERE TOO','verity is awake')}
  V.moved=V.on?step(V,spd*.82*hs):0;
  dist=Math.hypot(P.x-J.x,P.z-J.z);vd=V.on?Math.hypot(P.x-V.x,P.z-V.z):99;
  const gx=Math.round(P.x/S),gz=Math.round(P.z/S),z=zoneAt(gx,gz);if(z!=lastZone){lastZone=z;showZone(z,IN[gz][gx]?'— inside —':'— outside —')}
  const seen=!hidden&&dist<10&&los(P,J),cool=tt-lastScare>10;
  if(cool&&(dist<3||(seen&&!jSeen&&dist<7)))jumpscare('j',now);else if(cool&&vd<3)jumpscare('v',now);jSeen=seen;
  $('obj').textContent=hidden?'HIDDEN. STAY LOW AND LET THEM PASS':(!V.on?'OBJECTIVE: ESCAPE COLLEGE ACADEMY. DON\'T GET CAUGHT':'OBJECTIVE: VERITY IS AWAKE. KEEP RUNNING OR CROUCH (C) TO HIDE');$('crouchB').classList.toggle('on',!!P.crouch);
  $('hud').textContent=`${CAST[who].n} · ${el.toFixed(1)}s · ${z} · JULIAN ${dist.toFixed(0)}m${V.on?` · VERITY ${vd.toFixed(0)}m`:''}`;
  const near=Math.min(dist,vd);$('vig').style.setProperty('--r',Math.max(0,(14-near)*16)+'px');
  cam.fov+=((near<8?54:62)-cam.fov)*dt*2;cam.updateProjectionMatrix();
  if(drone)drone.gain.value=.03+Math.max(0,(12-near))*.006;
  if(ac&&ac.currentTime>nextBeat){thump(55,.6);setTimeout(()=>thump(45,.4),130);nextBeat=ac.currentTime+Math.max(.28,Math.min(1.4,near/8))}
  if(Math.random()<dt*.04)distantScream();
  if(now>grace){if(dist<1.1)startQTE(now,'j');else if(vd<1.1)startQTE(now,'v')}
 }
 // ---- environment blend indoor/outdoor ----
 const inside=IN[Math.round(P.z/S)]?.[Math.round(P.x/S)]?1:0;envK+=(inside-envK)*Math.min(1,dt*1.6);
 scene.fog.color.copy(FOG_OUT).lerp(FOG_IN,envK);scene.fog.density=.022+.056*envK;hemi.intensity=.26+.8*(1-envK);hemi.color.setHex(0x5a6a99);moonL.intensity=1.5*(1-envK)+.02;renderer.toneMappingExposure=1.15+.5*(1-envK);
 if(hum)hum.gain.value=.018*envK;if(crick){crick.gain.value=.025*(1-envK);if(Math.random()<dt*1.5*(1-envK))chirp()}
 // ---- over-the-shoulder camera ----
 let dy=P.yaw-camYaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));camYaw+=dy*Math.min(1,dt*14);
 const[fx,fz]=fwd(camYaw),[rx,rz]=rgt(camYaw);const BACK=2.55,SIDE=.62,EYE=2.05-me?.userData.crouch*.6||2.05;
 const px=P.x+rx*SIDE*.4,pz=P.z+rz*SIDE*.4;let k=1;const tx=P.x-fx*BACK+rx*SIDE,tz=P.z-fz*BACK+rz*SIDE;
 for(;k>.15;k-=.05){const x=px+(tx-px)*k,z=pz+(tz-pz)*k;let ok=true;for(const[ox,oz]of[[.25,.25],[-.25,.25],[.25,-.25],[-.25,-.25]])if(tallSolid(Math.round((x+ox)/S),Math.round((z+oz)/S)))ok=false;if(ok)break}
 const want=new THREE.Vector3(px+(tx-px)*k,EYE-(1-k)*.25,pz+(tz-pz)*k);camPos.lerp(want,Math.min(1,dt*12));
 const sh=(!RM&&dist<6)?(6-dist)*.025:0,bobC=(!RM&&P.mv)?Math.sin(P.stride*Math.PI*2/1.0)*.035:0;
 cam.position.set(camPos.x+(Math.random()-.5)*sh,camPos.y+bobC+(Math.random()-.5)*sh,camPos.z+(Math.random()-.5)*sh);
 cam.lookAt(P.x+fx*6+rx*SIDE*.5,1.45-(me?.userData.crouch||0)*.45,P.z+fz*6+rz*SIDE*.5);
 sky.position.copy(cam.position);moon.position.set(cam.position.x-120,cam.position.y+130,cam.position.z-160);
 // flashlight from the player's chest, pointing forward
 flash.position.set(P.x+rx*.3,1.5,P.z+rz*.3);flash.target.position.set(P.x+fx*9,.7,P.z+fz*9);flash.intensity=(!RM&&Math.random()<.012)?6:(inside?55:40);
 // ---- player 3D rig ----
 if(me){me.position.set(P.x,0,P.z);const st=P.mv==4?'back':P.mv==2||P.mv==3?'strafe':P.mv==1?'run':'idle';me.rotation.y=camYaw+Math.PI+(P.mv==2?-.25:P.mv==3?.25:0);
  pose(me,Math.abs(P.stride)*Math.PI*2/1.0*(P.mv==4?1.3:1),P.mv?(P.mv==3?-1:1)*(keys.shift&&!P.crouch?1.2:1):0,st,P.crouch?1:0,dt,tt);if(st=='strafe')me.userData.hips.rotation.y=0}
 jul.position.set(J.x,0,J.z);jl.position.set(J.x,1.8,J.z);animActor(jul,J,dt,J.moved||0,'julian',tt);
 if(V.on){ver.position.set(V.x,0,V.z);animActor(ver,V,dt,V.moved||0,'verity',tt)}
 renderer.render(scene,cam)}
requestAnimationFrame(loop);
// ---------- 3D intro cutscene: car drop-off at Bailey Hall, click a survivor ----------
const CUT={on:false,t:0,rigs:[],car:null,hover:null,picked:null,lights:[]};
const cutLamp=new THREE.PointLight(0xffb060,0,26,1.6);cutLamp.position.set(6*S,6,13.6*S);const cutFill=new THREE.PointLight(0x8090ff,0,40,1.2);cutFill.position.set(6*S,4,17*S);const cutRed=new THREE.PointLight(0xff1020,0,14,2);scene.add(cutLamp,cutFill,cutRed);
function makeCar(){const g=new THREE.Group(),bm=new THREE.MeshStandardMaterial({color:0x15171c,roughness:.3,metalness:.7,flatShading:true}),gl=new THREE.MeshStandardMaterial({color:0x0a0d12,roughness:.1,metalness:.9});
 const b=new THREE.Mesh(new THREE.BoxGeometry(4.4,.8,1.9),bm);b.position.y=.7;g.add(b);const c=new THREE.Mesh(new THREE.CylinderGeometry(.9,1.25,.7,4,1).rotateY(Math.PI/4).scale(1.6,1,1.05),gl);c.position.set(-.2,1.45,0);g.add(c);
 const wg=new THREE.CylinderGeometry(.36,.36,.25,10).rotateX(Math.PI/2),wm=new THREE.MeshStandardMaterial({color:0x050505,flatShading:true});for(const[x,z]of[[1.4,.9],[-1.4,.9],[1.4,-.9],[-1.4,-.9]]){const w=new THREE.Mesh(wg,wm);w.position.set(x,.36,z);g.add(w)}
 const hl=new THREE.MeshBasicMaterial({color:0xfff2cc}),tl=new THREE.MeshBasicMaterial({color:0xff1010});for(const z of[.65,-.65]){const h=new THREE.Mesh(new THREE.BoxGeometry(.05,.16,.32),hl);h.position.set(2.21,.85,z);g.add(h);const t=new THREE.Mesh(new THREE.BoxGeometry(.05,.14,.3),tl);t.position.set(-2.21,.85,z);g.add(t)}
 const beam=new THREE.SpotLight(0xfff0d0,80,40,.5,.6,1.4);beam.position.set(2.3,.9,0);beam.target.position.set(12,0,0);g.add(beam,beam.target);const rl=new THREE.PointLight(0xff0000,4,6,2);rl.position.set(-2.6,.9,0);g.add(rl);scene.add(g);return g}
const label=document.createElement('div');label.id='plabel';document.body.append(label);
const caps=$('cap');
function cap(s){caps.style.opacity=0;setTimeout(()=>{caps.textContent=s;caps.style.opacity=s?1:0},300)}
function toIntro(){if(state!='title')return;audio();startDrone();state='intro';$('title').hidden=true;$('intro').hidden=false;document.body.classList.add('cine');
 CUT.on=true;CUT.t=0;CUT.t0=performance.now();CUT.picked=null;CUT.car=CUT.car||makeCar();CUT.car.visible=true;CUT.rigs.forEach(r=>{scene.remove(r,r.userData.shadow)});
 CUT.rigs=['ashaad','emmanuel','landry'].map((k,i)=>{const r=rig(k,.05);r.visible=r.userData.shadow.visible=false;r.userData.slot=(i-1)*1.5;return r});
 tone('sawtooth',90,60,3,.06);cap('BAILEY HALL  ·  11:47 PM');
 let last=performance.now();(function tick(now){if(!CUT.on)return;requestAnimationFrame(tick);const dt=Math.min(.25,(now-last)/1000);last=now;cutStep(dt,now/1000)})(last)}
function cutStep(dt,tt){CUT.t=(performance.now()-CUT.t0)/1000;const t=CUT.t,car=CUT.car,X=6*S,Z=12.95*S;cutLamp.intensity=26*(Math.random()<.03?.3:1);cutFill.intensity=8;
 // car: drive in, stop, idle, drive off
 const CX=X+7,cx=t<3.2?CX-46+46*(1-Math.pow(1-t/3.2,3)):t<7?CX:CX+(t-7)**2*6;car.position.set(cx,0,14.2*S);car.visible=t<11;
 if(t>1&&t<1.1)tone('sine',50,40,2.5,.08);if(t>7&&t<7.05){tone('sawtooth',70,140,1.4,.05);cap('they left us here.')}
 // exit + walk to marks
 CUT.rigs.forEach((r,i)=>{const go=3.6+i*.55;r.visible=r.userData.shadow.visible=t>go;if(!r.visible)return;const k=Math.min(1,(t-go)/1.6),sx=CX-1.2+i*.9,sz=14.2*S-1.2,tx=X+r.userData.slot,tz=Z+.6;
  r.position.set(sx+(tx-sx)*k,0,sz+(tz-sz)*k);r.userData.shadow.position.set(r.position.x,.03,r.position.z);
  r.rotation.y=k<1?Math.atan2(tx-sx,tz-sz):(CUT.picked==r?0:Math.sin(tt*.6+i)*.15);pose(r,tt*7,k<1?1:0,k<1?'run':'idle',0,dt,tt);
  const hv=CUT.hover==r||CUT.picked==r;r.userData.mats.forEach(m=>m.emissiveIntensity+=((hv?.35:.05)-m.emissiveIntensity)*.15)});
 if(t>9.4&&state=='intro'){state='pick';cap('');$('pickhint').hidden=false}
 // camera: low tracking shot then settle on the three
 let cp,lk;if(CUT.picked){const p=CUT.picked.position,k=Math.min(1,(t-CUT.pt)/1.4);cp=new THREE.Vector3(X,2.2-.6*k,Z+7-5.4*k);cp.x+=(p.x-X)*k;lk=new THREE.Vector3(p.x,1.5,p.z);cutRed.position.set(p.x,2.5,p.z+1.5);cutRed.intensity=k*14}
 else if(t<3.4){cp=new THREE.Vector3(cx-6,1.1,14.2*S+4.5);lk=new THREE.Vector3(cx+3,.8,14.2*S)}else if(t<7){const k=(t-3.4)/3.6;cp=new THREE.Vector3(X-2+2*k,1.6+k*.5,Z+4.2+k*1.2);lk=new THREE.Vector3(X+3.5-3.5*k,1.2,Z+2)}else{const k=Math.min(1,(t-7)/2.2);cp=new THREE.Vector3(X+Math.sin(tt*.3)*.4,1.9+.2*k,Z+5.4-1*k);lk=new THREE.Vector3(X,1.25,Z+.4)}
 cam.position.lerp(cp,CUT.picked?1:Math.min(1,dt*3.5));cam.lookAt(lk);
 if(CUT.hover&&!CUT.picked){const v=CUT.hover.position.clone();v.y=2.25;v.project(cam);label.style.left=(v.x+1)/2*innerWidth+'px';label.style.top=(1-v.y)/2*innerHeight+'px';label.style.opacity=1;label.innerHTML=`${CAST[CUT.hover.userData.key].n}<small>${CAST[CUT.hover.userData.key].fx}</small>`}else label.style.opacity=0;
 if(CUT.picked&&t-CUT.pt>1.9)endCut()}
function endCut(){CUT.on=false;CUT.car.visible=false;CUT.rigs.forEach(r=>{scene.remove(r,r.userData.shadow)});CUT.rigs=[];cutLamp.intensity=cutFill.intensity=cutRed.intensity=0;label.style.opacity=0;$('pickhint').hidden=true;document.body.classList.remove('cine');begin()}
function pickRig(r){if(state!='pick'||!r)return;CUT.picked=r;CUT.pt=CUT.t;who=r.userData.key;thump(70,.5);tone('sawtooth',300,60,1.2,.12);cap(CAST[who].n);label.style.opacity=0}
const ray=new THREE.Raycaster(),mv=new THREE.Vector2();
function rigAt(e){mv.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);ray.setFromCamera(mv,cam);let best=null,bd=1e9;for(const r of CUT.rigs){const h=ray.intersectObject(r,true)[0];if(h&&h.distance<bd){bd=h.distance;best=r}}
 if(!best)for(const r of CUT.rigs){const v=r.position.clone();v.y=1;v.project(cam);const d=Math.hypot((v.x-mv.x)*innerWidth,(v.y-mv.y)*innerHeight);if(d<90&&d<bd){bd=d;best=r}}return best}
addEventListener('pointermove',e=>{if(state=='pick'&&!CUT.picked){CUT.hover=rigAt(e);document.body.style.cursor=CUT.hover?'pointer':''}});
$('intro').onclick=e=>{if(state=='intro'){CUT.t0=Math.min(CUT.t0,performance.now()-9300)}else if(state=='pick')pickRig(rigAt(e))};
$('title').onclick=toIntro;
function toSelect(){}

// idle backdrop for menus: slow orbit over Bailey Hall front
(function menuCam(){if(state=='play'||state=='over')return;if(CUT.on){requestAnimationFrame(menuCam);return}cutLamp.intensity=30;cutFill.intensity=10;hemi.intensity=.7;moonL.intensity=1.4;renderer.toneMappingExposure=1.5;const t=performance.now()/9000;cam.position.set(7*S+Math.sin(t)*14,4,15*S+Math.cos(t)*4);cam.lookAt(7*S,3,11*S);P.x=7*S;P.z=14*S;requestAnimationFrame(menuCam)})();
addEventListener('resize',()=>{cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});

// debug hook for automated screenshots
window.__boa={mash,qteS:()=>qte,startQTE,R:{jul,ver},P,J,V,G,cam,camPos,walk,DFc:()=>DF,W,H,begin:k=>{who=k||'ashaad';begin()},CUT,toIntro,pickRig,jumpscare:k=>jumpscare(k,performance.now()),gotcha:b=>gotcha(performance.now(),b),keys};
if(location.hash=='#lineup')window.__dbg={THREE,rig,pose,scene,cam,renderer};
