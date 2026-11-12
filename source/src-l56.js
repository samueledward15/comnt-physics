/* ===== Lesson 1-5: equilibrium of forces ===== */
function ebSim(){
  const c=document.getElementById('ebCanvas'); if(!c)return;
  let A=15,W=10,k=0;const tb=document.getElementById('ebTable');
  const T=()=>W/(2*Math.cos(rad(A)));
  const out=()=>{document.getElementById('ebT').textContent=`${f(T(),1)} N`;document.getElementById('ebX').textContent=`${f(T(),1)} cm`;draw();};
  range('ebA',v=>`${v}°`,()=>{A=+document.getElementById('ebA').value;out();});
  range('ebW',v=>`${f(v,1)} N`,()=>{W=+document.getElementById('ebW').value;out();});
  function band(x,x1,y1,x2,y2){const n=14,dx=(x2-x1)/n,dy=(y2-y1)/n,L=Math.hypot(x2-x1,y2-y1),px=-(y2-y1)/L*5,py=(x2-x1)/L*5;
    x.strokeStyle='#C98B4B';x.lineWidth=3;x.lineJoin='round';x.beginPath();x.moveTo(x1,y1);
    for(let i=1;i<n;i++){const s=i%2?1:-1;x.lineTo(x1+dx*i+px*s,y1+dy*i+py*s);}x.lineTo(x2,y2);x.stroke();}
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);gridBg(x,w,h,30,C.grid,C.navyDeep);
    const a=rad(A),len=10+T();const s=Math.min((h-120)/(len*Math.cos(a)+2),(w-60)/(2*len*Math.sin(a)+4),9);
    const kx=w/2,ky=40+len*Math.cos(a)*s;
    const hx1=kx-len*Math.sin(a)*s,hx2=kx+len*Math.sin(a)*s,hy=ky-len*Math.cos(a)*s;
    x.fillStyle='#5B6B7A';x.fillRect(Math.min(hx1,kx-40)-20,hy-10,(Math.max(hx2,kx+40)-Math.min(hx1,kx-40))+40,8);
    x.fillStyle=C.white;[hx1,hx2].forEach(px=>{x.beginPath();x.arc(px,hy,5,0,7);x.fill();});
    band(x,hx1,hy,kx,ky);band(x,hx2,hy,kx,ky);
    // bottle
    x.fillStyle='rgba(201,230,255,0.85)';x.beginPath();x.roundRect?x.roundRect(kx-16,ky+14,32,58,8):x.rect(kx-16,ky+14,32,58);x.fill();
    x.fillStyle=C.sky;x.fillRect(kx-6,ky+2,12,14);x.fillStyle='#1F6FB2';x.fillRect(kx-16,ky+40,32,30);
    const fs=Math.min(4,70/Math.max(T(),W));
    arrow(x,kx,ky,kx-T()*fs*Math.sin(a),ky-T()*fs*Math.cos(a),C.yellow,3,9);
    arrow(x,kx,ky,kx+T()*fs*Math.sin(a),ky-T()*fs*Math.cos(a),C.yellow,3,9);
    arrow(x,kx+26,ky+40,kx+26,ky+40+W*fs,C.coral,3,9);
    label(x,`W = ${f(W,1)} N`,kx+34,ky+44+W*fs/2,C.coral,LAT(700,12),'left',false);
    label(x,`T = ${f(T(),1)} N`,kx-24,ky-28,C.yellow,LAT(700,12),'right',false);
    if(A>2){x.strokeStyle=C.white;x.lineWidth=1;x.setLineDash([4,4]);x.beginPath();x.moveTo(hx2,hy);x.lineTo(hx2,hy+46);x.stroke();x.setLineDash([]);
      label(x,`θ = ${A}°`,hx2+8,hy+30,C.white,LAT(700,12),'left',false);}
  }
  document.getElementById('ebRec').addEventListener('click',()=>{k++;const e=tb.querySelector('.empty');if(e)e.remove();const tr=document.createElement('tr');
    tr.innerHTML=`<td>${k}</td><td class="m">${f(W,1)}</td><td class="m">${A}°</td><td class="m ylw">${f(T(),1)}</td><td class="m ylw">${f(T(),1)}</td>`;tb.appendChild(tr);});
  document.getElementById('ebClear').addEventListener('click',()=>{k=0;tb.innerHTML='<tr class="empty"><td colspan="5" class="muted">لسه مفيش قراءات. غيّر الزاوية ودوس «سجّل».</td></tr>';});
  onRedraw(c,draw);out();
}

function lmSim(){
  const c=document.getElementById('lmCanvas'); if(!c)return;
  let m=6,a1=30,a2=30,comp=false;
  const solve=()=>{const W=m*G,s=Math.sin(rad(a1+a2));return{W,T1:W*Math.cos(rad(a2))/s,T2:W*Math.cos(rad(a1))/s};};
  const out=()=>{const r=solve();document.getElementById('lmW').textContent=`${f(r.W,1)} N`;
    document.getElementById('lmT1').textContent=`${f(r.T1,1)} N`;document.getElementById('lmT2').textContent=`${f(r.T2,1)} N`;draw();};
  range('lmM',v=>`${f(v,1)} kg`,()=>{m=+document.getElementById('lmM').value;out();});
  range('lmA1',v=>`${v}°`,()=>{a1=+document.getElementById('lmA1').value;out();});
  range('lmA2',v=>`${v}°`,()=>{a2=+document.getElementById('lmA2').value;out();});
  document.getElementById('lmComp').addEventListener('change',e=>{comp=e.target.checked;draw();});
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);gridBg(x,w,h,30,C.grid,C.navyDeep);const r=solve();
    const top=24,kx=w*0.5,ky=h*0.42,t1=rad(a1),t2=rad(a2);
    x.fillStyle='#5B6B7A';x.fillRect(0,top-10,w,10);
    const L1=(ky-top)/Math.sin(t1),L2=(ky-top)/Math.sin(t2);
    x.strokeStyle='#C9CDD2';x.lineWidth=2.5;x.beginPath();x.moveTo(kx,ky);x.lineTo(kx-L1*Math.cos(t1),top);x.moveTo(kx,ky);x.lineTo(kx+L2*Math.cos(t2),top);x.stroke();
    // lamp
    x.beginPath();x.moveTo(kx,ky);x.lineTo(kx,ky+30);x.stroke();
    x.fillStyle=C.yellow;x.beginPath();x.moveTo(kx-26,ky+58);x.lineTo(kx-12,ky+30);x.lineTo(kx+12,ky+30);x.lineTo(kx+26,ky+58);x.closePath();x.fill();
    x.fillStyle='#FFF6C8';x.beginPath();x.arc(kx,ky+60,8,0,7);x.fill();
    // forces at the knot
    const fs=Math.min((h*0.38)/Math.max(r.T1,r.T2,r.W),3);
    const e1x=kx-r.T1*fs*Math.cos(t1),e1y=ky-r.T1*fs*Math.sin(t1),e2x=kx+r.T2*fs*Math.cos(t2),e2y=ky-r.T2*fs*Math.sin(t2);
    if(comp){x.setLineDash([5,5]);x.strokeStyle=C.sky;x.lineWidth=2;x.beginPath();
      x.moveTo(e1x,e1y);x.lineTo(e1x,ky);x.moveTo(e1x,e1y);x.lineTo(kx,e1y);x.moveTo(e2x,e2y);x.lineTo(e2x,ky);x.moveTo(e2x,e2y);x.lineTo(kx,e2y);x.stroke();x.setLineDash([]);
      arrow(x,kx,ky,e1x,ky,C.sky,2.5,8);arrow(x,kx,ky,e2x,ky,C.sky,2.5,8);
      label(x,`${f(r.T1*Math.cos(t1),1)}`,(kx+e1x)/2,ky+12,C.sky,LAT(700,11),'center',false);
      label(x,`${f(r.T2*Math.cos(t2),1)}`,(kx+e2x)/2,ky+12,C.sky,LAT(700,11),'center',false);
      label(x,`T1y + T2y = ${f(r.T1*Math.sin(t1)+r.T2*Math.sin(t2),1)} N`,w-12,h-40,C.sky,LAT(700,12),'right',false);
      label(x,`ΣFx = ${f(r.T2*Math.cos(t2)-r.T1*Math.cos(t1),1)} N , ΣFy = ${f(r.T1*Math.sin(t1)+r.T2*Math.sin(t2)-r.W,1)} N`,w-12,h-18,C.mint,LAT(700,12),'right',false);}
    arrow(x,kx,ky,e1x,e1y,C.yellow,4,11);arrow(x,kx,ky,e2x,e2y,C.yellow,4,11);
    arrow(x,kx+40,ky+30,kx+40,ky+30+r.W*fs,C.coral,4,11);
    label(x,`T1 = ${f(r.T1,1)} N`,e1x-6,e1y-12,C.yellow,LAT(700,13),'right',false);
    label(x,`T2 = ${f(r.T2,1)} N`,e2x+6,e2y-12,C.yellow,LAT(700,13),'left',false);
    label(x,`W = ${f(r.W,1)} N`,kx+48,ky+30+r.W*fs/2,C.coral,LAT(700,13),'left',false);
    label(x,`θ1 = ${a1}°`,kx-60,ky+14,C.white,LAT(700,12),'center',false);
    label(x,`θ2 = ${a2}°`,kx+60,ky+14,C.white,LAT(700,12),'center',false);
    x.fillStyle=C.white;x.beginPath();x.arc(kx,ky,5,0,7);x.fill();
  }
  onRedraw(c,draw);out();
}

function plSim(){
  const c=document.getElementById('plCanvas'); if(!c)return;
  const SP=40,WT=600;let s=2;
  const th=()=>Math.atan(4*s/SP);
  const out=()=>{const t=th(),T=WT/(2*Math.sin(t));document.getElementById('plA').textContent=`${f(deg(t),1)}°`;
    const el=document.getElementById('plT');el.textContent=`${f(T,0)} N`;el.style.color=T>3000?'var(--red)':'';draw();};
  range('plS',v=>`${f(v,1)} m`,()=>{s=+document.getElementById('plS').value;out();});
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);x.fillStyle=C.sky;x.fillRect(0,0,w,h);x.fillStyle='#7BB526';x.fillRect(0,h-22,w,22);
    const sx=(w-120)/SP,top=36,X0=60,X1=w-60,sy=Math.min(sx,(h-top-50)/8);
    x.fillStyle='#6B4A2E';[X0,X1].forEach(px=>{x.fillRect(px-5,top-6,10,h-top-16);x.fillRect(px-22,top,44,6);});
    x.strokeStyle=C.navy;x.lineWidth=3;x.beginPath();
    for(let i=0;i<=60;i++){const u=i/60;const px=X0+(X1-X0)*u,py=top+4*s*sy*u*(1-u);i?x.lineTo(px,py):x.moveTo(px,py);}x.stroke();
    const t=th(),T=WT/(2*Math.sin(t)),fl=Math.min(110,20+T/40);
    arrow(x,X0,top,X0+fl*Math.cos(t)*0.9,top+fl*Math.sin(t)*0.9*(sy/sx),C.red,3,9);
    arrow(x,X1,top,X1-fl*Math.cos(t)*0.9,top+fl*Math.sin(t)*0.9*(sy/sx),C.red,3,9);
    label(x,`T = ${f(T,0)} N`,X0+fl*0.5,top-16,C.red,LAT(700,13),'left',false);
    label(x,`${SP} m`,(X0+X1)/2,h-11,C.navy,LAT(700,12),'center',false);
    if(s>0.3){x.setLineDash([4,4]);x.strokeStyle=C.navy;x.lineWidth=1;x.beginPath();x.moveTo((X0+X1)/2,top);x.lineTo((X0+X1)/2,top+s*sy);x.stroke();x.setLineDash([]);
      label(x,`${f(s,1)} m`,(X0+X1)/2+8,top+s*sy/2,C.navy,LAT(700,12),'left',false);}
  }
  onRedraw(c,draw);out();
}

/* ===== Lesson 1-6: power and efficiency ===== */
function stSim(){
  const c=document.getElementById('stCanvas'); if(!c)return;
  let m=60,H=3,T=10,fr=0,run=false,t0=0,k=0;const tb=document.getElementById('stTable');
  range('stM',v=>`${v} kg`,()=>{m=+document.getElementById('stM').value;draw();});
  range('stH',v=>`${f(v,1)} m`,()=>{H=+document.getElementById('stH').value;draw();});
  range('stT',v=>`${f(v,1)} s`,()=>{T=+document.getElementById('stT').value;draw();});
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);gridBg(x,w,h,30,C.grid,C.navyDeep);
    const n=10,x0=60,y0=h-30,sw=(w*0.55)/n,sh=(h-90)/n;
    x.fillStyle='#5B6B7A';x.beginPath();x.moveTo(x0,y0);for(let i=0;i<n;i++){x.lineTo(x0+i*sw,y0-(i+1)*sh);x.lineTo(x0+(i+1)*sw,y0-(i+1)*sh);}x.lineTo(x0+n*sw,y0);x.closePath();x.fill();
    x.strokeStyle=C.white;x.setLineDash([4,4]);x.lineWidth=1;x.beginPath();x.moveTo(x0+n*sw+14,y0);x.lineTo(x0+n*sw+14,y0-n*sh);x.stroke();x.setLineDash([]);
    label(x,`h = ${f(H,1)} m`,x0+n*sw+22,y0-n*sh/2,C.white,LAT(700,13),'left',false);
    const px=x0+fr*n*sw+sw*0.4,py=y0-Math.min(n,Math.ceil(fr*n+0.001))*sh;
    x.fillStyle=C.yellow;x.beginPath();x.arc(px,py-36,8,0,7);x.fill();x.fillRect(px-6,py-28,12,20);x.fillRect(px-6,py-10,4,10);x.fillRect(px+2,py-10,4,10);
    const Wk=m*G*H;
    label(x,`W = m g h = ${f(Wk,0)} J`,w-16,30,C.yellow,LAT(700,14),'right',false);
    label(x,`P = W / t = ${f(Wk/T,0)} W`,w-16,56,C.mint,LAT(700,14),'right',false);
    label(x,`t = ${f(T*fr,1)} s`,w-16,82,C.white,LAT(700,13),'right',false);
  }
  function loop(ts){if(!run)return;fr=Math.min(1,(ts-t0)/1000/(T/3));draw();if(fr<1)requestAnimationFrame(loop);else run=false;}
  document.getElementById('stGo').addEventListener('click',()=>{fr=0;if(RM){fr=1;draw();return;}run=true;t0=performance.now();requestAnimationFrame(loop);});
  document.getElementById('stRec').addEventListener('click',()=>{k++;const e=tb.querySelector('.empty');if(e)e.remove();const Wk=m*G*H,tr=document.createElement('tr');
    tr.innerHTML=`<td>${k}</td><td class="m">${f(T,1)}</td><td class="m ylw">${f(Wk,0)}</td><td class="m ylw">${f(Wk/T,0)}</td>`;tb.appendChild(tr);});
  document.getElementById('stClear').addEventListener('click',()=>{k=0;tb.innerHTML='<tr class="empty"><td colspan="4" class="muted">لسه مفيش طلعات. دوس «اطلع» وبعدين «سجّل».</td></tr>';});
  onRedraw(c,draw);draw();
}

function elSim(){
  const c=document.getElementById('elCanvas'); if(!c)return;
  let m=600,H=9,TA=24,fr=0,run=false,t0=0;
  const kW=v=>v>=1000?`${f(v/1000,2)} kW`:`${f(v,0)} W`;
  const out=()=>{const W=m*G*H;document.getElementById('elW').textContent=W>=1e4?`${f(W/1000,1)} kJ`:`${f(W,0)} J`;
    document.getElementById('elPA').textContent=kW(W/TA);document.getElementById('elPB').textContent=kW(W/(TA/2));
    document.getElementById('elChk').textContent=`${kW(m*G*(H/TA))} (v = ${f(H/TA,2)} m/s)`;draw();};
  range('elM',v=>`${v} kg`,()=>{m=+document.getElementById('elM').value;out();});
  range('elH',v=>`${v} m`,()=>{H=+document.getElementById('elH').value;out();});
  range('elT',v=>`${v} s`,()=>{TA=+document.getElementById('elT').value;out();});
  function car(x,cx,y,lab,col){x.fillStyle=col;x.fillRect(cx-34,y-46,68,46);x.fillStyle=C.navy;x.fillRect(cx-24,y-30,48,22);label(x,lab,cx,y-38,C.navy,LAT(800,12),'center',false);}
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);gridBg(x,w,h,30,C.grid,C.navyDeep);
    const top=40,bot=h-24,cA=w*0.3,cB=w*0.62,Y=u=>bot-u*(bot-top-50);
    [cA,cB].forEach(cx=>{x.fillStyle='rgba(201,230,255,0.10)';x.fillRect(cx-42,top-10,84,bot-top+10);});
    x.strokeStyle=C.white;x.setLineDash([5,5]);x.beginPath();x.moveTo(cA-60,Y(1));x.lineTo(cB+60,Y(1));x.stroke();x.setLineDash([]);
    label(x,`h = ${H} m`,cB+64,Y(1),C.white,LAT(700,12),'left',false);
    const uA=Math.min(1,fr),uB=Math.min(1,fr*2);
    car(x,cA,Y(uA),`A · ${TA} s`,C.sky);car(x,cB,Y(uB),`B · ${TA/2} s`,C.yellow);
    label(x,`t = ${f(fr*TA,1)} s`,w-16,24,C.white,LAT(700,13),'right',false);
    if(uB>=1)pill(x,'B وصل!',cB,Y(1)-64,C.mint,C.navy,AR(800,12));if(uA>=1)pill(x,'A وصل!',cA,Y(1)-64,C.mint,C.navy,AR(800,12));
  }
  function loop(ts){if(!run)return;fr=Math.min(1,(ts-t0)/3000);draw();if(fr<1)requestAnimationFrame(loop);else run=false;}
  document.getElementById('elGo').addEventListener('click',()=>{fr=0;if(RM){fr=1;draw();return;}run=true;t0=performance.now();requestAnimationFrame(loop);});
  onRedraw(c,draw);out();
}

function skSim(){
  const c=document.getElementById('skCanvas'); if(!c)return;
  let E=100,eta=10,U='J';
  const fmt=v=>v>=1e4?`${+(v/1000).toFixed(1)} k${U}`:`${+v.toFixed(1)} ${U}`;
  const out=()=>{document.getElementById('skU').textContent=fmt(E*eta/100);document.getElementById('skW').textContent=fmt(E*(100-eta)/100);draw();};
  const inEl=range('skIn',v=>`${v} ${U}`,()=>{E=+document.getElementById('skIn').value;out();});
  range('skE',v=>`${v}%`,()=>{eta=+document.getElementById('skE').value;out();});
  document.querySelectorAll('[data-sk]').forEach(b=>b.addEventListener('click',()=>{const [e,p]=b.dataset.sk.split(',').map(Number);
    U=(e===2000||e===2400)?'W':'J';
    const si=document.getElementById('skIn'),se=document.getElementById('skE');si.value=e;se.value=p;si.dispatchEvent(new Event('input'));se.dispatchEvent(new Event('input'));}));
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);x.fillStyle=C.white;x.fillRect(0,0,w,h);
    const TW=Math.min(110,h*0.42),wu=Math.max(2,TW*eta/100),ww=Math.max(2,TW*(100-eta)/100);
    const x0=20,xs=w*0.38,xe=w-60,top=24;
    x.lineCap='butt';
    // input
    x.strokeStyle='#9AA3AD';x.lineWidth=TW;x.beginPath();x.moveTo(x0,top+TW/2);x.lineTo(xs,top+TW/2);x.stroke();
    // useful
    const yu=top+wu/2;x.strokeStyle=C.green;x.lineWidth=wu;x.beginPath();x.moveTo(xs-1,yu);x.lineTo(xe,yu);x.stroke();
    x.fillStyle=C.green;x.beginPath();x.moveTo(xe,top-8);x.lineTo(xe+34,yu);x.lineTo(xe,top+wu+8);x.closePath();x.fill();
    // wasted: turns downward
    const yw=top+wu+ww/2,R=ww/2+24;x.strokeStyle=C.coral;x.lineWidth=ww;x.beginPath();x.moveTo(xs-1,yw);x.lineTo(xs+20,yw);x.arc(xs+20,yw+R,R,-Math.PI/2,0);x.lineTo(xs+20+R,h-34);x.stroke();
    const cx=xs+20+R;x.fillStyle=C.coral;x.beginPath();x.moveTo(cx-ww/2-8,h-34);x.lineTo(cx,h-6);x.lineTo(cx+ww/2+8,h-34);x.closePath();x.fill();
    label(x,`الدخل ${fmt(E)}`,x0+6,top+TW+16,C.navy,AR(700,13),'left',true);
    label(x,`مفيد ${fmt(E*eta/100)} (${eta}%)`,xe-6,top+wu+18,C.green,AR(800,14),'right',true);
    label(x,`مهدر ${fmt(E*(100-eta)/100)}`,cx+ww/2+14,h-48,C.red,AR(800,14),'left',true);
  }
  onRedraw(c,draw);out();
}
