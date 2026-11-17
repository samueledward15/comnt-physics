/* ===== Lesson 1-5: Stevin's wreath of spheres (animated video + experiment) ===== */
function stevinVideo(){
  const c=document.getElementById('svCanvas');if(!c)return;
  const cap=document.getElementById('svCap'),play=document.getElementById('svPlay'),seek=document.getElementById('svSeek'),tEl=document.getElementById('svTime');
  const DUR=60,t1=Math.asin(4*Math.sin(rad(60))/8),H=4*Math.sin(rad(60));
  const A=[0,0],B=[8*Math.cos(t1),H],Cc=[8*Math.cos(t1)+4*Math.cos(rad(60)),0],cx=Cc[0]/2,ax=Cc[0]/2;
  // hanging part: half-ellipse from C back to A, depth tuned so its length is exactly 13 bead spacings
  const ell=(d,n=400)=>{const p=[];for(let i=0;i<=n;i++){const ph=Math.PI*i/n;p.push([cx+ax*Math.cos(ph),-d*Math.sin(ph)]);}return p;};
  const plen=p=>p.reduce((s,q,i)=>i?s+Math.hypot(q[0]-p[i-1][0],q[1]-p[i-1][1]):0,0);
  let lo=0.5,hi2=10;for(let i=0;i<40;i++){const m=(lo+hi2)/2;plen(ell(m))<13?lo=m:hi2=m;}
  const DEP=(lo+hi2)/2,HANG=ell(DEP);
  const loop=[A,B,Cc,...HANG.slice(1)];const segs=[];let tot=0;
  for(let i=1;i<loop.length;i++){const l=Math.hypot(loop[i][0]-loop[i-1][0],loop[i][1]-loop[i-1][1]);segs.push([loop[i-1],loop[i],tot,l]);tot+=l;}
  const at=s=>{s=((s%tot)+tot)%tot;for(const [p,q,s0,l] of segs){if(s<=s0+l+1e-9){const u=l?(s-s0)/l:0;return[p[0]+(q[0]-p[0])*u,p[1]+(q[1]-p[1])*u,s];}}return[A[0],A[1],0];};
  const N=25;let t=0,playing=false,last=0;
  const CAPS=[[0,'سنة <span class="m">1586</span>، ستيفن تخيّل مثلث عنده منحدرين بنفس الارتفاع، وحوالينه سلسلة مقفولة من كرات زي بعض.'],
    [7,'المنحدر الطويل طوله ضعف القصير، فعليه <b>8</b> كرات، والقصير عليه <b>4</b> بس. وتحت فيه جزء متدلي.'],
    [15,'افترض إن المنحدر الطويل شدّ أكتر، والسلسلة لفّت…'],
    [21,'بعد ما كل كرة تاخد مكان اللي جنبها، الشكل بيرجع زي ما كان بالظبط! يعني هتفضل تلف للأبد من غير ما حد يزقها.'],
    [24,'وده اسمه <b>حركة دائمة</b>، ومستحيل تحصل. يبقى الافتراض غلط.'],
    [27,'السلسلة لازم تفضل <b>ساكنة</b>: متزنة.'],
    [33,'الجزء المتدلي متماثل: بيشد الناحيتين بالتساوي. لو شلناه، الاتزان مش هيتأثر.'],
    [41,'كل كرة بيشدها لتحت المنحدر <span class="m">W sin θ</span> بس. الطويل: كرات كتير وكل واحدة بتشد شوية. القصير: كرات أقل وكل واحدة بتشد أكتر.'],
    [52,'والنتيجة: القوة اللي بتمسك جسم على مستوى مايل أملس هي <span class="m">W sin θ = W h / L</span>. «العجيب مش عجيب»!']];
  const fmt=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
  const ease=u=>u<0?0:u>1?1:u*u*(3-2*u);
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);gridBg(x,w,h,30,C.grid,C.navyDeep);
    const xmin=-0.8,xmax=Cc[0]+0.8,ymin=-DEP-0.8,ymax=H+0.9,s=Math.min((w-30)/(xmax-xmin),(h-20)/(ymax-ymin));
    const ox=(w-(xmax-xmin)*s)/2-xmin*s,oy=(h-(ymax-ymin)*s)/2+ymax*s,X=v=>ox+v*s,Y=v=>oy-v*s;
    const fa=ease(t/2);x.globalAlpha=fa;
    x.fillStyle='rgba(201,230,255,0.12)';x.beginPath();x.moveTo(X(A[0]),Y(A[1]));x.lineTo(X(B[0]),Y(B[1]));x.lineTo(X(Cc[0]),Y(Cc[1]));x.closePath();x.fill();
    x.strokeStyle=C.sky;x.lineWidth=2;x.stroke();x.globalAlpha=1;
    [['A',A,-14,8],['B',B,0,-14],['C',Cc,14,8]].forEach(([n,p,dx,dy])=>label(x,n,X(p[0])+dx,Y(p[1])+dy,C.white,LAT(800,13),'center',false));
    // which phase
    const rot=t>=15&&t<27?(t-15)*0.9:0;const hangA=t<33?1:t<41?1-0.8*ease((t-33)/4):0.2;
    const shown=Math.min(N,Math.floor(t/5*N)+1);
    x.strokeStyle='rgba(239,211,73,0.55)';x.lineWidth=2;x.globalAlpha=Math.min(1,hangA+0.3);x.beginPath();loop.forEach((p,i)=>i?x.lineTo(X(p[0]),Y(p[1])):x.moveTo(X(p[0]),Y(p[1])));x.closePath();x.stroke();x.globalAlpha=1;
    for(let i=0;i<shown;i++){const [px,py,ss]=at(i+rot);const onHang=ss>12.001&&ss<tot-0.001;x.globalAlpha=onHang?hangA:1;
      x.fillStyle=onHang?'#7FA7D9':C.yellow;x.beginPath();x.arc(X(px),Y(py),Math.max(4,0.36*s),0,7);x.fill();x.globalAlpha=1;
      if(t>=41&&!onHang&&ss<12.001&&ss>0.001){const th=ss<8?t1:rad(60),dir=ss<8?[-Math.cos(t1),-Math.sin(t1)]:[Math.cos(rad(60)),-Math.sin(rad(60))];const L=Math.sin(th)*1.1*s*ease((t-41)/2);
        arrow(x,X(px),Y(py),X(px)+dir[0]*L,Y(py)-dir[1]*L,C.coral,2.5,7);}}
    if(t>=7&&t<33){const k=ease((t-7)/1.5);x.globalAlpha=k;
      pill(x,'8 كرات',X(B[0]/2)-0.9*s,Y(H/2)-0.7*s,C.yellow,C.navy,AR(800,13));pill(x,'4 كرات',X((B[0]+Cc[0])/2)+0.9*s,Y(H/2)-0.5*s,C.yellow,C.navy,AR(800,13));
      label(x,'2L',X(B[0]/2)+0.25*s,Y(H/2)+0.35*s,C.sky,LAT(800,13),'center',false);label(x,'L',X((B[0]+Cc[0])/2)-0.35*s,Y(H/2)+0.3*s,C.sky,LAT(800,13),'center',false);x.globalAlpha=1;}
    if(t>=15&&t<27)arrow(x,X(B[0]/2)-1.6*s,Y(H/2)+0.9*s,X(B[0]/2)-2.3*s,Y(H/2)+0.3*s,C.mint,4,11);
    if(t>=24&&t<27){x.strokeStyle=C.red;x.lineWidth=10;x.lineCap='round';const m=Math.min(w,h)*0.18;x.beginPath();x.moveTo(w/2-m,h/2-m);x.lineTo(w/2+m,h/2+m);x.moveTo(w/2+m,h/2-m);x.lineTo(w/2-m,h/2+m);x.stroke();
      pill(x,'حركة دائمة؟ مستحيل!',w/2,h/2+m+24,C.red,C.white,AR(800,15));}
    if(t>=27&&t<33)pill(x,'ساكنة = متزنة',w/2,24,C.mint,C.navy,AR(800,15));
    if(t>=44&&t<52){const k=ease((t-44)/1.5);x.globalAlpha=k;
      x.fillStyle='rgba(0,20,45,0.8)';x.fillRect(w/2-150,h-58,300,50);arNum(x,'الطويل:',`8 × W sin 25.7° ≈ 3.46 W`,w/2,h-42,C.coral,13,'center');arNum(x,'القصير:',`4 × W sin 60° ≈ 3.46 W`,w/2,h-20,C.coral,13,'center');x.globalAlpha=1;}
    if(t>=52){const k=ease((t-52)/1.5);x.globalAlpha=k;pill(x,'F = W sin θ = W h / L',w/2,28,C.yellow,C.navy,LAT(800,18));x.globalAlpha=1;}
  }
  const setCap=()=>{let cur=CAPS[0][1];CAPS.forEach(([s,tx])=>{if(t>=s)cur=tx;});if(cap.innerHTML!==cur)cap.innerHTML=cur;seek.value=t;tEl.textContent=`${fmt(t)} / ${fmt(DUR)}`;};
  function frame(ts){if(!playing)return;const dt=Math.min(0.1,(ts-(last||ts))/1000);last=ts;t=Math.min(DUR,t+dt);setCap();draw();
    if(t>=DUR){playing=false;play.textContent='شغّل تاني';return;}requestAnimationFrame(frame);}
  play.addEventListener('click',()=>{if(playing){playing=false;play.textContent='تشغيل';return;}if(t>=DUR)t=0;playing=true;play.textContent='إيقاف';last=0;
    if(RM){t=52;setCap();draw();playing=false;play.textContent='تشغيل';return;}requestAnimationFrame(frame);});
  seek.addEventListener('input',()=>{t=+seek.value;setCap();draw();});
  visible(c,v=>{if(!v&&playing){playing=false;play.textContent='تشغيل';}});
  onRedraw(c,draw);setCap();draw();
}

function stevinLab(){
  const c=document.getElementById('slCanvas');if(!c)return;
  const H=4;let a1=30,a2=60,n1=4,n2=4,ph=0,on=false,last=0;
  const L=a=>H/Math.sin(rad(a)),cap=a=>Math.max(1,Math.min(12,Math.floor(L(a)+0.5)));
  const p=()=>[n1*Math.sin(rad(a1)),n2*Math.sin(rad(a2))];
  const sync=(id,v)=>{const el=document.getElementById(id);el.value=v;el.dispatchEvent(new Event('input'));};
  function out(){const m1=cap(a1),m2=cap(a2);document.getElementById('slN1').max=m1;document.getElementById('slN2').max=m2;
    if(n1>m1){sync('slN1',m1);return;}if(n2>m2){sync('slN2',m2);return;}
    const [p1,p2]=p();document.getElementById('slP1').textContent=`${f(p1,2)} N`;document.getElementById('slP2').textContent=`${f(p2,2)} N`;
    const r=document.getElementById('slR'),d=p1-p2;
    if(Math.abs(d)<=0.08){r.textContent='متزنة!';r.style.color='var(--green)';}else{r.textContent=d>0?'هتتزحلق ناحية الشمال':'هتتزحلق ناحية اليمين';r.style.color='var(--red)';}
    draw();}
  range('slA1',v=>`${v}°`,()=>{a1=+document.getElementById('slA1').value;out();});
  range('slA2',v=>`${v}°`,()=>{a2=+document.getElementById('slA2').value;out();});
  range('slN1',v=>`${v}`,()=>{n1=+document.getElementById('slN1').value;out();});
  range('slN2',v=>`${v}`,()=>{n2=+document.getElementById('slN2').value;out();});
  document.getElementById('slFill').addEventListener('click',()=>{
    // fill both slopes with beads at equal spacing: make each slope an integer number of spacings
    [['slA1','slN1',a1],['slA2','slN2',a2]].forEach(([ia,inn,a])=>{const n=Math.max(5,Math.min(12,Math.round(L(a))));sync(ia,Math.round(deg(Math.asin(H/n))));sync(inn,n);});});
  document.getElementById('slEq').addEventListener('click',()=>{const n=Math.min(cap(a1),cap(a2),4);sync('slN1',n);sync('slN2',n);});
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);gridBg(x,w,h,30,C.grid,C.navyDeep);
    const L1=L(a1),L2=L(a2),bx1=L1*Math.cos(rad(a1)),bx2=L2*Math.cos(rad(a2)),span=bx1+bx2;
    const s=Math.min((w-50)/span,(h-70)/H),gy=h-26,apx=(w-span*s)/2+bx1*s,apy=gy-H*s;
    x.fillStyle='rgba(201,230,255,0.12)';x.beginPath();x.moveTo(apx-bx1*s,gy);x.lineTo(apx,apy);x.lineTo(apx+bx2*s,gy);x.closePath();x.fill();
    x.strokeStyle=C.sky;x.lineWidth=2;x.stroke();x.fillStyle='#5B6B7A';x.fillRect(0,gy,w,3);
    const [p1,p2]=p(),d=p1-p2,bal=Math.abs(d)<=0.08,shift=bal?0:Math.sign(d)*(ph%1)*0.6;
    const r=Math.max(5,0.38*s);
    const bead=(side,k)=>{const a=rad(side<0?a1:a2);const dist=0.5+k;return[apx+side*Math.cos(a)*dist*s,apy+Math.sin(a)*dist*s];};
    // chain over the top
    x.strokeStyle='rgba(239,211,73,0.6)';x.lineWidth=2;x.beginPath();const l0=bead(-1,n1-1+(shift>0?shift:0)),r0=bead(1,n2-1+(shift<0?-shift:0));x.moveTo(l0[0],l0[1]);x.lineTo(apx,apy);x.lineTo(r0[0],r0[1]);x.stroke();
    x.fillStyle=C.white;x.beginPath();x.arc(apx,apy,6,0,7);x.fill();
    const drawSide=(side,n,a)=>{for(let k=0;k<n;k++){const off=side<0?shift:-shift;const [px,py]=bead(side,k+off);
      x.fillStyle=C.yellow;x.beginPath();x.arc(px,py,r,0,7);x.fill();
      const L0=Math.sin(rad(a))*0.9*s;arrow(x,px,py,px+side*Math.cos(rad(a))*L0,py+Math.sin(rad(a))*L0,C.coral,2,6);}};
    drawSide(-1,n1,a1);drawSide(1,n2,a2);
    label(x,`θ1 = ${a1}°`,apx-bx1*s+30,gy-12,C.white,LAT(700,12),'left',false);label(x,`θ2 = ${a2}°`,apx+bx2*s-30,gy-12,C.white,LAT(700,12),'right',false);
    if(!bal)arrow(x,apx,apy-24,apx-60*Math.sign(d),apy-24,C.red,4,12);else pill(x,'متزنة',apx,apy-26,C.mint,C.navy,AR(800,13));
  }
  function loop(ts){if(!on)return;const dt=Math.min(50,ts-(last||ts))/1000;last=ts;ph+=dt*0.8;draw();requestAnimationFrame(loop);}
  visible(c,v=>{if(v&&!on){on=true;last=0;requestAnimationFrame(loop);}else if(!v)on=false;});
  onRedraw(c,draw);out();
}
