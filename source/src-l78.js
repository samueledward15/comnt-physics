/* ===== Lesson 1-7: momentum and impulse ===== */
function imSim(){
  const c=document.getElementById('imCanvas'); if(!c)return;
  let m=0.5,v=1,dt=0.05,ph=0,run=false,t0=0,ghost=null,k=0;const tb=document.getElementById('imTable');const E=0.8;
  const calc=()=>{const vf=-E*v,dp=m*(vf-v);return{vf,dp,Fav:Math.abs(dp)/dt,Fmax:Math.PI*Math.abs(dp)/(2*dt)};};
  const out=()=>{const r=calc();document.getElementById('imDp').textContent=`${f(r.dp,3)} N s`;document.getElementById('imJ').textContent=`${f(-Math.abs(r.dp),3)} N s`;
    document.getElementById('imF').textContent=`${f(r.Fav,1)} N`;if(!run)draw();};
  range('imM',v2=>`${f(v2,2)} kg`,()=>{m=+document.getElementById('imM').value;out();});
  range('imV',v2=>`${f(v2,2)} m/s`,()=>{v=+document.getElementById('imV').value;out();});
  range('imD',v2=>`${f(v2,2)} s`,()=>{dt=+document.getElementById('imD').value;out();});
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);gridBg(x,w,h,30,C.grid,C.navyDeep);const r=calc();
    // track
    const ty=h*0.26,bx=w-60;x.fillStyle='#5B6B7A';x.fillRect(20,ty+22,w-40,6);
    x.fillStyle=C.coral;const squash=ph>1&&ph<2?Math.sin((ph-1)*Math.PI)*Math.min(26,6+dt*60):0;x.fillRect(bx-14+squash,ty-14,14-squash,34);x.fillStyle='#9AA3AD';x.fillRect(bx,ty-30,16,60);
    label(x,'حساس قوة',bx+8,ty-40,C.sky,AR(700,11),'center');
    let cx;if(ph<=1)cx=40+(bx-14-60-40)*ph;else if(ph<=2)cx=bx-14-60+squash;else cx=bx-14-60-(bx-14-60-40)*Math.min(1,(ph-2)*E);
    x.fillStyle=C.yellow;x.fillRect(cx,ty-10,60,26);x.fillStyle=C.navy;x.beginPath();x.arc(cx+14,ty+20,6,0,7);x.arc(cx+46,ty+20,6,0,7);x.fill();
    if(ph<1)arrow(x,cx+30,ty-22,cx+30+30,ty-22,C.mint,3,8);else if(ph>2)arrow(x,cx+30,ty-22,cx+30-24,ty-22,C.mint,3,8);
    // F-t graph
    const gx=60,gy=h-30,gw=w-90,gh=h*0.52,Tm=0.5;
    const Fs=Math.max(r.Fmax,ghost?ghost.Fmax:0)*1.15;
    x.strokeStyle=C.white;x.lineWidth=1.5;x.beginPath();x.moveTo(gx,gy-gh);x.lineTo(gx,gy);x.lineTo(gx+gw,gy);x.stroke();
    label(x,'|F| (N)',gx-6,gy-gh-10,C.white,LAT(700,11),'left',false);label(x,'t (s)',gx+gw-4,gy+16,C.white,LAT(700,11),'right',false);
    x.fillStyle=C.white;x.font=LAT(500,10);x.textAlign='center';for(let s=0;s<=Tm+1e-9;s+=0.1){x.fillText(s.toFixed(1),gx+gw*s/Tm,gy+14);}
    const pulse=(p,col,fill,frac=1)=>{const t1=0.05;x.beginPath();x.moveTo(gx+gw*t1/Tm,gy);
      for(let i=0;i<=60*frac;i++){const u=i/60;const tt=t1+u*p.dt;x.lineTo(gx+gw*tt/Tm,gy-gh*(p.Fmax*Math.sin(Math.PI*u))/Fs);}
      if(fill){x.lineTo(gx+gw*(t1+frac*p.dt)/Tm,gy);x.closePath();x.fillStyle=fill;x.fill();}x.strokeStyle=col;x.lineWidth=2.5;x.stroke();};
    if(ghost)pulse(ghost,'rgba(201,230,255,0.45)',null);
    const frac=ph<1?0:ph<2?ph-1:1;
    if(frac>0)pulse({dt,Fmax:r.Fmax},C.yellow,'rgba(239,211,73,0.25)',frac);
    if(frac>=1){label(x,`المساحة = ${f(Math.abs(r.dp),3)} N s`,gx+gw*(0.05+dt/2)/Tm+8,gy-gh*0.55,C.yellow,AR(800,13),'left');
      label(x,`Fmax ≈ ${f(r.Fmax,0)} N`,gx+gw*(0.05+dt/2)/Tm+8,gy-gh*0.55+20,C.white,LAT(700,12),'left',false);}
    if(ghost)label(x,'المحاولة اللي فاتت',gx+gw-4,gy-gh+4,C.sky,AR(600,11),'right');
  }
  function loop(ts){if(!run)return;const e=(ts-t0)/1000;ph=e<1?e:e<1.8?1+(e-1)/0.8:Math.min(3.2,2+(e-1.8));draw();if(e<3.2)requestAnimationFrame(loop);else{run=false;}}
  let lastP=null;
  document.getElementById('imGo').addEventListener('click',()=>{if(run)return;if(lastP)ghost=lastP;lastP={dt,Fmax:calc().Fmax};
    if(RM){ph=3;draw();return;}ph=0;run=true;t0=performance.now();requestAnimationFrame(loop);});
  document.getElementById('imRec').addEventListener('click',()=>{k++;const e=tb.querySelector('.empty');if(e)e.remove();const r=calc(),tr=document.createElement('tr');
    tr.innerHTML=`<td>${k}</td><td class="m">${f(v,2)}</td><td class="m">${f(r.vf,2)}</td><td class="m">${f(dt,2)}</td><td class="m ylw">${f(r.dp,3)}</td><td class="m ylw">${f(-Math.abs(r.dp),3)}</td><td class="m">${f(r.Fmax,0)}</td>`;tb.appendChild(tr);});
  document.getElementById('imClear').addEventListener('click',()=>{k=0;tb.innerHTML='<tr class="empty"><td colspan="7" class="muted">لسه مفيش محاولات. دوس «اخبط» وبعدين «سجّل».</td></tr>';});
  onRedraw(c,draw);out();
}

function phSim(){
  const c=document.getElementById('phCanvas'); if(!c)return;
  const M=0.2,LIM=300;let H=1,dt=0.002,fr=1,run=false,t0=0,done=true;
  const calc=()=>{const v=Math.sqrt(2*G*H),p=M*v;return{v,p,F:p/dt};};
  const surf=()=>dt<0.005?{n:'بلاط',col:'#C9CDD2'}:dt<0.03?{n:'سجادة',col:'#B5524B'}:dt<0.12?{n:'سرير',col:'#7FA7D9'}:{n:'مخدة',col:'#F2E6C9'};
  const out=()=>{const r=calc();document.getElementById('phV').textContent=`${f(r.v,2)} m/s`;document.getElementById('phP').textContent=`${f(r.p,3)} N s`;
    document.getElementById('phF').textContent=`${f(r.F,0)} N`;const s=document.getElementById('phS');const br=r.F>LIM;
    s.textContent=br?'اتكسرت!':'سليمة';s.style.color=br?'var(--red)':'var(--green)';if(!run)draw();};
  range('phH',v=>`${f(v,2)} m`,()=>{H=+document.getElementById('phH').value;out();});
  range('phT',v=>`${f(v,3)} s`,()=>{dt=+document.getElementById('phT').value;out();});
  document.querySelectorAll('[data-ph]').forEach(b=>b.addEventListener('click',()=>{const el=document.getElementById('phT');el.value=b.dataset.ph;el.dispatchEvent(new Event('input'));}));
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);gridBg(x,w,h,30,C.grid,C.navyDeep);const r=calc(),s=surf();
    const fy=h-50,top=30,scale=(fy-top-60)/2;
    x.fillStyle=s.col;const thick=dt<0.005?10:dt<0.03?16:dt<0.12?34:44;x.fillRect(w*0.2,fy,w*0.6,thick);
    label(x,s.n,w*0.2-10,fy+thick/2,C.white,AR(700,13),'right');
    const y0=fy-H*scale-60,py=y0+(fy-60-y0)*fr*fr,cx=w/2;
    const sink=done?Math.min(thick*0.6,dt*200):0;
    x.fillStyle='#1B1F24';x.beginPath();x.roundRect?x.roundRect(cx-34,py+sink,68,58,8):x.rect(cx-34,py+sink,68,58);x.fill();
    x.fillStyle='#3B6EA8';x.fillRect(cx-29,py+sink+5,58,48);
    if(done&&r.F>LIM){x.strokeStyle=C.white;x.lineWidth=1.5;x.beginPath();x.moveTo(cx-20,py+sink+10);x.lineTo(cx,py+sink+28);x.lineTo(cx+22,py+sink+14);x.moveTo(cx,py+sink+28);x.lineTo(cx-6,py+sink+48);x.moveTo(cx,py+sink+28);x.lineTo(cx+18,py+sink+44);x.stroke();}
    x.setLineDash([4,4]);x.strokeStyle=C.sky;x.lineWidth=1;x.beginPath();x.moveTo(cx+60,y0+58);x.lineTo(cx+60,fy);x.stroke();x.setLineDash([]);
    label(x,`h = ${f(H,2)} m`,cx+68,(y0+fy)/2,C.sky,LAT(700,13),'left',false);
    if(done){const bw=Math.min(w*0.35,w*0.35*r.F/2000);x.fillStyle=r.F>LIM?C.red:C.green;x.fillRect(20,20,Math.max(4,bw),14);
      x.fillStyle=C.white;x.fillRect(20+w*0.35*LIM/2000,14,2,26);label(x,`F = ${f(r.F,0)} N`,24+Math.max(4,bw),27,C.white,LAT(700,12),'left',false);}
  }
  function loop(ts){if(!run)return;fr=Math.min(1,(ts-t0)/900);draw();if(fr<1)requestAnimationFrame(loop);else{run=false;done=true;draw();}}
  document.getElementById('phGo').addEventListener('click',()=>{if(run)return;done=false;if(RM){fr=1;done=true;draw();return;}fr=0;run=true;t0=performance.now();requestAnimationFrame(loop);});
  onRedraw(c,draw);out();
}

function hmSim(){
  const c=document.getElementById('hmCanvas'); if(!c)return;
  const M=5,V=6,D0=0.005;let d=3;
  const F=dd=>M*V/(2*dd/V);
  const out=()=>{const dd=D0+d/100;document.getElementById('hmT').textContent=`${f(2*dd/V*1000,1)} ms`;document.getElementById('hmF').textContent=`${f(F(dd),0)} N`;draw();};
  range('hmD',v=>`${f(v,1)} cm`,()=>{d=+document.getElementById('hmD').value;out();});
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);x.fillStyle=C.white;x.fillRect(0,0,w,h);
    const hx=90,hy=h/2;x.fillStyle='#E8C39E';x.beginPath();x.arc(hx,hy,34,0,7);x.fill();
    if(d>0){x.strokeStyle=C.navy;x.lineWidth=4+d*3;x.beginPath();x.arc(hx,hy,36+d*1.5,Math.PI*1.05,Math.PI*1.95,false);x.stroke();}
    const F0=F(D0),F1=F(D0+d/100),bw=w-260,bx=190;
    const bar=(y,val,col,t)=>{x.fillStyle='rgba(1,56,105,0.1)';x.fillRect(bx,y,bw,22);x.fillStyle=col;x.fillRect(bx,y,Math.max(3,bw*val/F0),22);
      label(x,t,bx,y-10,C.navy,AR(700,13),'left');label(x,`${f(val,0)} N`,bx+Math.max(3,bw*val/F0)+6,y+11,C.navy,LAT(800,13),'left',false);};
    bar(h*0.28,F0,C.red,'من غير خوذة');bar(h*0.66,F1,C.green,d>0?'بالخوذة':'بالخوذة (من غير فوم)');
  }
  onRedraw(c,draw);out();
}

/* ===== Lesson 1-8: conservation of momentum ===== */
function chSim(){
  const c=document.getElementById('chCanvas'); if(!c)return;
  let m1=60,m2=60,J=90,one=false,t=0,run=false,t0=0,k=0;const A=1.5;const tb=document.getElementById('chTable');
  const vel=()=>({v1:-J/m1,v2:J/m2});
  const out=()=>{const r=vel();document.getElementById('chV1').textContent=`${f(r.v1,2)} m/s`;document.getElementById('chV2').textContent=`+${f(r.v2,2)} m/s`;
    document.getElementById('chP').textContent=`${f(m1*r.v1+m2*r.v2,2)} kg m/s`;if(!run)draw();};
  range('chM1',v=>`${v} kg`,()=>{m1=+document.getElementById('chM1').value;t=0;out();});
  range('chM2',v=>`${v} kg`,()=>{m2=+document.getElementById('chM2').value;t=0;out();});
  range('chJ',v=>`${v} N s`,()=>{J=+document.getElementById('chJ').value;t=0;out();});
  document.getElementById('chOne').addEventListener('change',e=>{one=e.target.checked;draw();});
  const pos=(v0)=>{const tStop=Math.abs(v0)/A,tt=Math.min(t,tStop);return Math.sign(v0)*(Math.abs(v0)*tt-0.5*A*tt*tt);};
  function chair(x,cx,y,mass,col,txt){const r=10+mass/10;x.fillStyle='#5B6B7A';x.fillRect(cx-22,y-6,44,8);x.fillStyle=C.white;x.beginPath();x.arc(cx-16,y+8,5,0,7);x.arc(cx+16,y+8,5,0,7);x.fill();
    x.fillStyle=col;x.beginPath();x.arc(cx,y-30-r,r*0.55,0,7);x.fill();x.fillRect(cx-r*0.5,y-30-r*0.45,r,24+r*0.45);label(x,txt,cx,y+28,C.white,LAT(700,12),'center',false);}
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);gridBg(x,w,h,30,C.grid,C.navyDeep);const r=vel();
    const S=(w-80)/24,cx=w/2,fy=h-46;x.fillStyle='#5B6B7A';x.fillRect(0,fy+14,w,3);
    x.fillStyle=C.yellow;x.fillRect(cx-1,fy-90,3,104);label(x,'خط البداية',cx,fy-100,C.yellow,AR(700,11),'center');
    const x1=cx-26+pos(r.v1)*S,x2=cx+26+pos(r.v2)*S;
    chair(x,Math.max(30,x1),fy,m1,C.sky,`${m1} kg`);chair(x,Math.min(w-30,x2),fy,m2,C.coral,`${m2} kg`);
    if(t===0&&one)label(x,'الشمال بس اللي هيزق',cx,30,C.white,AR(700,13),'center');
    if(t>0){label(x,`${f(Math.abs(pos(r.v1)),2)} m`,Math.max(30,x1),fy-118,C.sky,LAT(700,12),'center',false);label(x,`${f(pos(r.v2),2)} m`,Math.min(w-30,x2),fy-118,C.coral,LAT(700,12),'center',false);}
    if(t>0&&one)pill(x,'الاتنين اتحركوا!',cx,30,C.mint,C.navy,AR(800,13));
  }
  function loop(ts){if(!run)return;t=(ts-t0)/1000*1.5;const tEnd=Math.max(J/m1,J/m2)/A;draw();if(t<tEnd)requestAnimationFrame(loop);else{t=tEnd;run=false;draw();}}
  document.getElementById('chGo').addEventListener('click',()=>{if(RM){t=Math.max(J/m1,J/m2)/A;draw();return;}t=0;run=true;t0=performance.now();requestAnimationFrame(loop);});
  document.getElementById('chRec').addEventListener('click',()=>{k++;const e=tb.querySelector('.empty');if(e)e.remove();const r=vel(),tr=document.createElement('tr');
    const far=Math.abs(r.v1)>Math.abs(r.v2)?'الشمال (الأخف)':Math.abs(r.v1)<Math.abs(r.v2)?'اليمين (الأخف)':'زي بعض';
    tr.innerHTML=`<td>${k}${one?' (واحد بيزق)':''}</td><td class="m">${m1}</td><td class="m">${m2}</td><td class="m">${f(r.v1,2)}</td><td class="m">+${f(r.v2,2)}</td><td class="m ylw">${f(m1*r.v1+m2*r.v2,2)}</td><td>${far}</td>`;tb.appendChild(tr);});
  document.getElementById('chClear').addEventListener('click',()=>{k=0;tb.innerHTML='<tr class="empty"><td colspan="7" class="muted">لسه مفيش محاولات. دوس «زقّوا» وبعدين «سجّل».</td></tr>';});
  onRedraw(c,draw);out();
}

function coSim(){
  const c=document.getElementById('coCanvas'); if(!c)return;
  let m1=1.2,v1=3,m2=2.8,v2=-2,type='stick',t=0,run=false,t0=0;const X1=-3,X2=3,GAP=0.6;
  const post=()=>{if(type==='stick'){const v=(m1*v1+m2*v2)/(m1+m2);return{a:v,b:v};}
    return{a:((m1-m2)*v1+2*m2*v2)/(m1+m2),b:((m2-m1)*v2+2*m1*v1)/(m1+m2)};};
  const tc=()=>v1-v2>0?(X2-X1-GAP)/(v1-v2):Infinity;
  const out=()=>{const p=post(),pb=m1*v1+m2*v2,pa=m1*p.a+m2*p.b;
    document.getElementById('coPb').textContent=`${f(pb,2)} kg m/s`;document.getElementById('coPa').textContent=`${f(pa,2)} kg m/s`;
    document.getElementById('coVa').textContent=`${f(p.a,2)} m/s`;document.getElementById('coVb').textContent=`${f(p.b,2)} m/s`;
    const msg=document.getElementById('coMsg');msg.textContent=tc()===Infinity?'العربيتين مش هيقابلوا بعض بالسرعات دي':'';msg.style.color='var(--pen-warn)';if(!run)draw();};
  const sl=(id,u,fn)=>range(id,v=>`${f(v,1)} ${u}`,()=>{fn(+document.getElementById(id).value);t=0;out();});
  sl('coM1','kg',v=>m1=v);sl('coV1','m/s',v=>v1=v);sl('coM2','kg',v=>m2=v);sl('coV2','m/s',v=>v2=v);
  document.querySelectorAll('[data-co]').forEach(b=>b.addEventListener('click',()=>{type=b.dataset.co;document.querySelectorAll('[data-co]').forEach(z=>{const on=z===b;z.setAttribute('aria-pressed',on);z.className='btn small '+(on?'navy':'ghost');});t=0;out();}));
  const state=()=>{const T=tc();if(t<=T)return{xa:X1+v1*t,xb:X2+v2*t,va:v1,vb:v2,after:false};const p=post(),d=t-T,xa=X1+v1*T,xb=X2+v2*T;return{xa:xa+p.a*d,xb:xb+p.b*d,va:p.a,vb:p.b,after:true};};
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);gridBg(x,w,h,30,C.grid,C.navyDeep);const s=state();
    const S=(w-60)/16,cx=w/2,ty=h*0.3;x.fillStyle='#5B6B7A';x.fillRect(10,ty+18,w-20,5);
    const cw=m=>24+m*10;
    const drawCar=(xm,m,col,lab,v)=>{const px=cx+xm*S,ww=cw(m);x.fillStyle=col;x.fillRect(px-ww/2,ty-16,ww,32);label(x,`${lab} · ${f(m,1)} kg`,px,ty,C.navy,LAT(800,11),'center',false);
      if(Math.abs(v)>0.05)arrow(x,px,ty-28,px+v*14,ty-28,C.mint,3,8);label(x,`${f(v,2)}`,px,ty-42,C.mint,LAT(700,11),'center',false);};
    drawCar(s.xa-cw(m1)/2/S*0,m1,C.sky,'A',s.va);drawCar(s.xb,m2,C.yellow,'B',s.vb);
    // momentum bars
    const by=h*0.62,bh=h*0.3,mx=Math.max(Math.abs(m1*v1),Math.abs(m2*v2),Math.abs(m1*v1+m2*v2),Math.abs(m1*s.va),Math.abs(m2*s.vb),1);
    const items=[['p A',m1*s.va,C.sky],['p B',m2*s.vb,C.yellow],['Σp',m1*s.va+m2*s.vb,C.mint]];
    x.strokeStyle=C.white;x.lineWidth=1;x.beginPath();x.moveTo(40,by);x.lineTo(w-40,by);x.stroke();
    items.forEach(([n,val,col],i)=>{const bx=w*(0.25+i*0.25),hh=bh*0.45*val/mx;x.fillStyle=col;x.fillRect(bx-26,Math.min(by,by-hh),52,Math.abs(hh));
      label(x,n,bx,by+bh*0.5+4,C.white,LAT(800,12),'center',false);label(x,f(val,2),bx,by-hh+(hh>=0?-10:12),col,LAT(700,12),'center',false);});
    label(x,s.after?'بعد التصادم':'قبل التصادم',w-14,22,s.after?C.mint:C.white,AR(800,13),'right');
  }
  function loop(ts){if(!run)return;t=(ts-t0)/1000;const T=tc();draw();if(t<T+1.6&&t<8)requestAnimationFrame(loop);else run=false;}
  document.getElementById('coGo').addEventListener('click',()=>{if(tc()===Infinity){out();return;}if(RM){t=tc()+1.2;draw();return;}t=0;run=true;t0=performance.now();requestAnimationFrame(loop);});
  document.getElementById('coReset').addEventListener('click',()=>{run=false;t=0;draw();});
  onRedraw(c,draw);out();
}

function rkSim(){
  const c=document.getElementById('rkCanvas'); if(!c)return;
  const M0=1000;let dm=5,u=2000,M=M0,v=0,gasP=0,puffs=[],xr=0,last=0,on=false;
  const out=()=>{document.getElementById('rkM').textContent=`${f(M,0)} kg`;document.getElementById('rkV').textContent=`${f(v,1)} m/s`;
    document.getElementById('rkP').textContent=`${f(M*v-gasP,1)} kg m/s`;};
  range('rkG',x=>`${x} kg`,()=>{dm=+document.getElementById('rkG').value;});
  range('rkU',x=>`${x} m/s`,()=>{u=+document.getElementById('rkU').value;});
  document.getElementById('rkFire').addEventListener('click',()=>{if(M-dm<200)return;v=(M*v+dm*u)/(M-dm);M-=dm;gasP+=dm*u;puffs.push({x:xr,age:0,n:dm});out();});
  document.getElementById('rkReset').addEventListener('click',()=>{M=M0;v=0;gasP=0;puffs=[];xr=0;out();});
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);x.fillStyle='#0A1630';x.fillRect(0,0,w,h);
    x.fillStyle='rgba(255,255,255,0.6)';for(let i=0;i<40;i++){const sx=((i*97)%w+w-((xr*0.2)%w))%w,sy=(i*53)%h;x.fillRect(sx,sy,1.5,1.5);}
    const rx=w*0.55,ry=h/2;
    puffs.forEach(p=>{const px=rx-(xr-p.x)-p.age*60;const r=4+p.n*0.6+p.age*6;x.fillStyle=`rgba(255,159,28,${Math.max(0,0.8-p.age*0.25)})`;x.beginPath();x.arc(px,ry,r,0,7);x.fill();});
    x.fillStyle=C.white;x.beginPath();x.moveTo(rx+60,ry);x.lineTo(rx+30,ry-14);x.lineTo(rx-40,ry-14);x.lineTo(rx-40,ry+14);x.lineTo(rx+30,ry+14);x.closePath();x.fill();
    x.fillStyle=C.red;x.beginPath();x.moveTo(rx-40,ry-14);x.lineTo(rx-56,ry-26);x.lineTo(rx-30,ry-14);x.fill();x.beginPath();x.moveTo(rx-40,ry+14);x.lineTo(rx-56,ry+26);x.lineTo(rx-30,ry+14);x.fill();
    x.fillStyle=C.sky;x.beginPath();x.arc(rx+14,ry,6,0,7);x.fill();
    if(v>0.01)arrow(x,rx+70,ry,rx+70+Math.min(120,v*4),ry,C.mint,3,9);
    label(x,`v = ${f(v,1)} m/s`,rx+74,ry-22,C.mint,LAT(700,12),'left',false);
  }
  function loop(ts){if(!on)return;const dt=Math.min(50,ts-(last||ts))/1000;last=ts;xr+=v*dt*2;puffs.forEach(p=>p.age+=dt);puffs=puffs.filter(p=>p.age<3.5);draw();requestAnimationFrame(loop);}
  visible(c,vis=>{if(vis&&!on){on=true;last=0;requestAnimationFrame(loop);}else if(!vis)on=false;});
  onRedraw(c,draw);out();draw();
}
