/* ===== Games tab (v2): one concept game per lesson, 3 levels, stars ===== */
const store={get:k=>{try{return +(localStorage.getItem(k)||0);}catch(e){return 0;}},set:(k,v)=>{try{localStorage.setItem(k,String(v));}catch(e){}}};
const rnd=(a,b,step=1)=>a+step*Math.floor(Math.random()*(Math.round((b-a)/step)+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const STAR=on=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.8 6.3 6.9.6-5.2 4.6 1.6 6.8L12 17.2l-6.1 3.6 1.6-6.8-5.2-4.6 6.9-.6z" fill="${on?'#EFD349':'none'}" stroke="#EFD349" stroke-width="1.7" stroke-linejoin="round"/></svg>`;
const HEART=on=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.2 0 3.6 1.2 5.3 3.1 1.7-1.9 3.1-3.1 5.3-3.1 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" fill="${on?'#D82B35':'none'}" stroke="#D82B35" stroke-width="1.7"/></svg>`;
function paintStars(id){const n=store.get('comnt-st-'+id);$$(`[data-cstars="${id}"]`).forEach(el=>{el.innerHTML=[0,1,2].map(i=>STAR(i<n)).join('');el.setAttribute('aria-label',`${n} من 3 نجوم`);});}
function gameKit(id,onLevel){
  const lvEl=document.getElementById(id+'-lv'),tipEl=document.getElementById(id+'-tip'),msg=document.getElementById(id+'-msg'),
    next=document.getElementById(id+'-next'),again=document.getElementById(id+'-again');
  const k={lv:1,won:false,
    say(t,ok){msg.textContent=t;msg.style.color=ok===undefined?'':ok?'var(--pen-check)':'var(--pen-warn)';},
    tip(t){tipEl.innerHTML=t||'';},
    start(l){k.lv=l;k.won=false;lvEl.textContent=l;next.hidden=true;again.hidden=true;k.say('');onLevel(l);},
    win(t){if(k.won)return;k.won=true;const best=store.get('comnt-st-'+id);if(k.lv>best){store.set('comnt-st-'+id,k.lv);paintStars(id);}
      if(k.lv<3){k.say(t+' كسبت نجمة!',true);next.hidden=false;}else{k.say(t+' خلّصت التلات مستويات!',true);again.hidden=false;}}};
  next.addEventListener('click',()=>k.start(k.lv+1));again.addEventListener('click',()=>k.start(1));
  return k;
}
function mkPicks(id,items,onPick){
  const row=document.getElementById(id+'-pick');row.innerHTML='';
  return items.map((it,i)=>{const b=document.createElement('button');b.type='button';b.className='pk';b.setAttribute('aria-pressed','false');b.innerHTML=it;
    b.addEventListener('click',()=>onPick(i,b));row.appendChild(b);return b;});
}
const press=(btns,b)=>btns.forEach(z=>z.setAttribute('aria-pressed',z===b?'true':'false'));
function legend(x,items,px,py){let xx=px;items.forEach(([t,col])=>{x.save();x.font=AR(700,12);const tw=x.measureText(t).width;x.restore();
  x.fillStyle=col;x.fillRect(xx-10,py-5,10,10);label(x,t,xx-16,py,col,AR(700,12),'right');xx-=tw+34;});}

/* 1-1: reach the dock */
function riverG(){
  const c=document.getElementById('river-cv');if(!c)return;
  const VB=5,W=60,TOL=4;let a=0,vc=2,dock=24,path=true,run=null,t0=0,land=null;
  const mot=()=>{const vx=vc+VB*Math.sin(rad(a)),vy=VB*Math.cos(rad(a));return{vx,vy,tf:W/vy,x:vx*W/vy};};
  const k=gameKit('river',l=>{run=null;land=null;
    if(l===1){vc=2;dock=24;path=true;k.tip('الخط المتقطع بيوريك هترسى فين. جرّب البوز مستقيم الأول.');}
    else if(l===2){vc=3;dock=0;path=true;k.tip('المرسى قصادك بالظبط! ميّل البوز عكس التيار.');}
    else{vc=pick([2,2.5,3,3.5]);do{dock=rnd(-15,15,5);}while(Math.abs(dock-vc*12)<6);path=false;k.tip('من غير خط: اعتمد على السهم الأخضر بس.');}
    draw();});
  range('river-a',v=>`${v}°`,()=>{a=+document.getElementById('river-a').value;if(!run){land=null;draw();}});
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);x.fillStyle='#E9D9A8';x.fillRect(0,0,w,h);
    const top=34,bot=h-40,s=w/100,X=m=>w/2+m*s,Y=m=>bot-(m/W)*(bot-top);
    x.fillStyle='#1F6FB2';x.fillRect(0,top,w,bot-top);
    for(let j=0;j<3;j++){const yy=top+(bot-top)*(j+0.5)/3;for(let i=0;i<6;i++){const xx=i*w/6+20;arrow(x,xx,yy,xx+vc*7,yy,'rgba(255,255,255,0.35)',2,7);}}
    x.fillStyle=C.yellow;x.fillRect(X(dock-TOL),top-14,2*TOL*s,14);label(x,'المرسى',X(dock),top-24,C.navy,AR(800,12),'center');
    const m=mot();
    if(path||land!==null){x.setLineDash([6,6]);x.strokeStyle='rgba(239,211,73,0.9)';x.lineWidth=2;x.beginPath();x.moveTo(X(0),Y(0));x.lineTo(X(land!==null?land:m.x),Y(W));x.stroke();x.setLineDash([]);}
    let bx=0,by=0;if(run){bx=m.vx*run.t;by=m.vy*run.t;}else if(land!==null){bx=land;by=W;}
    const px=X(bx),py=Y(by);
    x.save();x.translate(px,py);x.rotate(rad(a));x.fillStyle=C.red;x.beginPath();x.moveTo(0,-16);x.lineTo(9,10);x.lineTo(-9,10);x.closePath();x.fill();x.restore();
    if(!run&&land===null){const sc=10;
      arrow(x,px,py,px+VB*Math.sin(rad(a))*sc,py-VB*Math.cos(rad(a))*sc,C.yellow,3,9);
      arrow(x,px,py,px+vc*sc,py,C.sky,3,9);
      arrow(x,px,py,px+m.vx*sc,py-m.vy*sc,C.mint,4,11);}
    label(x,`التيار ${f(vc,1)} m/s`,w-12,bot+20,C.navy,AR(800,13),'right');
    legend(x,[['القارب',C.yellow],['التيار','#1F6FB2'],['المحصلة',C.green]],w*0.6,bot+20);
  }
  function loop(ts){if(!run)return;const m=mot();run.t=Math.min(m.tf,(ts-t0)/2500*m.tf);draw();
    if(run.t>=m.tf){land=m.x;run=null;draw();const off=Math.abs(land-dock);
      if(off<=TOL)k.win('رسيت على المرسى!');else k.say(`رسيت على بُعد ${f(off,0)} m من المرسى. ${land>dock?'التيار سحبك زيادة: ميّل البوز عكسه أكتر.':'ميّلت زيادة: قلّل الميل.'}`,false);return;}
    requestAnimationFrame(loop);}
  document.getElementById('river-go').addEventListener('click',()=>{if(run||k.won)return;land=null;run={t:0};t0=performance.now();if(RM)t0-=1e6;requestAnimationFrame(loop);});
  onRedraw(c,draw);k.start(1);
}

/* 1-2: drop the aid box */
function dropG(){
  const c=document.getElementById('drop-cv');if(!c)return;
  const L=[{v:20,H:45,TW:36},{v:30,H:45,TW:28},{v:40,H:80,TW:22}];let P=L[0],T=200,box=null,land=null,st=0,last=0,on=false;
  const tf=()=>Math.sqrt(2*P.H/G);
  const k=gameKit('drop',l=>{P=L[l-1];T=rnd(130,270,10);box=null;land=null;
    k.tip(l===1?'الدايرة الخفيفة على الأرض بتوريك الصندوق هينزل فين لو وقّعته دلوقتي.':l===2?'المساعدة اختفت! لاحظ الصندوق بيفضل تحت الطيارة وهو نازل.':'الطيارة أسرع وأعلى: لازم توقّع بدري أكتر بكتير.');});
  const planeX=()=>((st*P.v)%340)-20;
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);x.fillStyle=C.sky;x.fillRect(0,0,w,h);const gy=h-28,sx=(w-20)/300,X=m=>10+m*sx,sy=(gy-50)/P.H,Y=m=>gy-m*sy;
    x.fillStyle='#7BB526';x.fillRect(0,gy,w,h-gy);
    x.fillStyle='rgba(216,43,53,0.25)';x.fillRect(X(T-P.TW/2),gy-4,P.TW*sx,8);x.fillStyle=C.red;x.beginPath();x.arc(X(T),gy,6,0,7);x.fill();
    x.fillStyle=C.red;x.fillRect(X(T)-1,gy-34,3,30);x.beginPath();x.moveTo(X(T)+2,gy-34);x.lineTo(X(T)+18,gy-28);x.lineTo(X(T)+2,gy-22);x.fill();
    const px=planeX();
    if(k.lv===1&&!box){const lx=px+P.v*tf();x.fillStyle='rgba(1,56,105,0.25)';x.beginPath();x.ellipse(X(lx),gy,10,4,0,0,7);x.fill();
      x.setLineDash([4,5]);x.strokeStyle='rgba(1,56,105,0.45)';x.lineWidth=1.5;x.beginPath();for(let i=0;i<=20;i++){const tt=tf()*i/20;const xx=X(px+P.v*tt),yy=Y(P.H-0.5*G*tt*tt);i?x.lineTo(xx,yy):x.moveTo(xx,yy);}x.stroke();x.setLineDash([]);}
    // plane
    const pX=X(px),pY=Y(P.H);x.fillStyle=C.navy;x.beginPath();x.ellipse(pX,pY,26,7,0,0,7);x.fill();x.fillRect(pX-6,pY-16,10,32);x.fillRect(pX-26,pY-12,6,12);
    if(box){const tau=st-box.t0,done=tau>=tf();const tt=done?tf():tau;const bxm=box.x0+P.v*tt,bym=P.H-0.5*G*tt*tt;
      if(!done){x.setLineDash([3,4]);x.strokeStyle=C.navy;x.lineWidth=1;x.beginPath();x.moveTo(pX,pY+8);x.lineTo(X(bxm),Y(bym));x.stroke();x.setLineDash([]);}
      x.fillStyle='#8A5A35';x.fillRect(X(bxm)-8,Y(bym)-14,16,14);x.fillStyle=C.white;x.fillRect(X(bxm)-1,Y(bym)-14,2,14);
      x.strokeStyle='rgba(138,90,53,0.5)';x.setLineDash([2,4]);x.beginPath();for(let i=0;i<=20;i++){const t2=tt*i/20;const xx=X(box.x0+P.v*t2),yy=Y(P.H-0.5*G*t2*t2);i?x.lineTo(xx,yy):x.moveTo(xx,yy);}x.stroke();x.setLineDash([]);}
    label(x,`v = ${P.v} m/s · h = ${P.H} m`,w-10,16,C.navy,LAT(700,12),'right',false);
  }
  function loop(ts){if(!on)return;const dt=Math.min(50,ts-(last||ts))/1000;last=ts;st+=dt*1.4;
    if(box&&land===null&&st-box.t0>=tf()){land=box.x0+P.v*tf();const off=Math.abs(land-T);
      if(off<=P.TW/2)k.win('الصندوق نزل في الهدف!');else k.say(land<T?`نزل قبل الهدف بـ ${f(T-land,0)} m: استنى شوية.`:`نزل بعد الهدف بـ ${f(land-T,0)} m: وقّع بدري.`,false);}
    draw();requestAnimationFrame(loop);}
  visible(c,v=>{if(v&&!on){on=true;last=0;requestAnimationFrame(loop);}else if(!v)on=false;});
  const fire=()=>{if(k.won)return;if(box&&land===null)return;box={x0:planeX(),t0:st};land=null;k.say('');};
  document.getElementById('drop-go').addEventListener('click',fire);c.addEventListener('pointerdown',fire);
  onRedraw(c,draw);k.start(1);
}

/* 1-3: hit the flag */
function cannonG(){
  const c=document.getElementById('cannon-cv');if(!c)return;
  const L=[{a:20,b:40,tol:4,prev:1},{a:25,b:55,tol:3,prev:0.35},{a:35,b:70,tol:2,prev:0}];
  let P=L[0],T=30,v=16,A=45,shot=null,t0=0,ghost=null;
  const path=()=>{const vx=v*Math.cos(rad(A)),vy=v*Math.sin(rad(A)),tf=2*vy/G;return{vx,vy,tf,R:vx*tf};};
  const k=gameKit('cannon',l=>{P=L[l-1];T=rnd(P.a,P.b);shot=null;ghost=null;
    k.tip(l===1?'المسار المتقطع بيوريك الكورة هتنزل فين قبل ما تضرب.':l===2?'المسار بيبان في الأول بس. كمّله في دماغك!':'من غير مسار. خد بالك: 45° بتدي أبعد مسافة.');draw();});
  range('cannon-v',x=>`${f(x,1)} m/s`,()=>{v=+document.getElementById('cannon-v').value;if(!shot)draw();});
  range('cannon-a',x=>`${x}°`,()=>{A=+document.getElementById('cannon-a').value;if(!shot)draw();});
  function trace(x,p,frac,X,Y,col,dash){x.setLineDash(dash);x.strokeStyle=col;x.lineWidth=2.5;x.beginPath();for(let i=0;i<=60*frac;i++){const t=p.tf*i/60;const px=X(p.vx*t),py=Y(p.vy*t-0.5*G*t*t);i?x.lineTo(px,py):x.moveTo(px,py);}x.stroke();x.setLineDash([]);}
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);gridBg(x,w,h,30,C.grid,C.navyDeep);const Wm=Math.max(50,Math.ceil((P.b+15)/10)*10);
    const gy=h-30,s=(w-50)/Wm,X=m=>30+m*s,Y=m=>gy-m*s;
    x.fillStyle='#0B5A2E';x.fillRect(0,gy,w,h-gy);x.fillStyle=C.sky;x.font=LAT(500,10);x.textAlign='center';x.direction='ltr';
    for(let m=0;m<=Wm;m+=10){x.fillRect(X(m),gy,1,6);x.fillText(`${m}`,X(m),gy+16);}
    x.fillStyle='rgba(216,43,53,0.35)';x.fillRect(X(T-P.tol),gy-5,2*P.tol*s,5);
    x.fillStyle=C.white;x.fillRect(X(T)-1,gy-30,3,30);x.fillStyle=C.red;x.beginPath();x.moveTo(X(T)+2,gy-30);x.lineTo(X(T)+18,gy-24);x.lineTo(X(T)+2,gy-18);x.fill();
    label(x,`${T} m`,X(T),gy-40,C.white,LAT(800,12),'center',false);
    if(ghost)trace(x,ghost,1,X,Y,'rgba(201,230,255,0.35)',[3,5]);
    const p=path();if(!shot&&P.prev>0)trace(x,p,P.prev,X,Y,'rgba(239,211,73,0.85)',[6,6]);
    x.strokeStyle=C.yellow;x.lineWidth=8;x.lineCap='round';x.beginPath();x.moveTo(30,gy-4);x.lineTo(30+26*Math.cos(rad(A)),gy-4-26*Math.sin(rad(A)));x.stroke();
    x.fillStyle=C.white;x.beginPath();x.arc(30,gy-4,9,0,7);x.fill();
    if(shot){const t=shot.t;trace(x,{...shot.p,tf:t},1,X,Y,'rgba(239,211,73,0.7)',[]);x.fillStyle=C.yellow;x.beginPath();x.arc(X(shot.p.vx*t),Y(Math.max(0,shot.p.vy*t-0.5*G*t*t)),6,0,7);x.fill();}
  }
  function loop(ts){if(!shot)return;shot.t=Math.min(shot.p.tf,(ts-t0)/1000*Math.max(1,shot.p.tf/2));draw();
    if(shot.t>=shot.p.tf){const R=shot.p.R;ghost=shot.p;shot=null;draw();const off=R-T;
      if(Math.abs(off)<=P.tol)k.win(`إصابة! نزلت على ${f(R,1)} m.`);else k.say(`نزلت على ${f(R,1)} m، ${off<0?'قبل':'بعد'} العلم بـ ${f(Math.abs(off),1)} m.`,false);return;}
    requestAnimationFrame(loop);}
  document.getElementById('cannon-go').addEventListener('click',()=>{if(shot||k.won)return;shot={p:path(),t:0};t0=performance.now();if(RM)t0-=1e6;requestAnimationFrame(loop);});
  onRedraw(c,draw);k.start(1);
}

/* 1-4: balance the seesaw */
function seesawG(){
  const c=document.getElementById('seesaw-cv');if(!c)return;
  const PZ=[
    [[[[400,2]],400],[[[300,3]],300],[[[500,1]],500]],
    [[[[600,2]],400],[[[400,3]],300],[[[200,4]],400],[[[600,1]],200]],
    [[[[300,2],[200,3]],400],[[[200,2],[400,1]],200],[[[300,3],[300,1]],300]]];
  let left=[[400,2]],F2=400,d2=0,tilt=0,on=false,last=0,btns=[];
  const ML=()=>left.reduce((s,[F,d])=>s+F*d,0);
  const k=gameKit('seesaw',l=>{const p=pick(PZ[l-1]);left=p[0];F2=p[1];d2=0;
    k.tip(l===1?'الأرقام فوق بتوريك عزم كل ناحية.':l===2?'الطفل اللي على اليمين أخف أو أتقل: فكّر في الوزن × البُعد.':'اتنين على الشمال! اجمع عزومهم الأول.');press(btns,null);});
  btns=mkPicks('seesaw',[1,2,3,4].map(n=>`الكرسي <span class="m">${n} m</span>`),(i,b)=>{if(k.won)return;d2=i+1;press(btns,b);
    const net=F2*d2-ML();if(net===0)k.win('متزن!');else k.say(net>0?'مال ناحية اليمين: الطفل محتاج يقرّب من النص.':'مال ناحية الشمال: الطفل محتاج يبعد عن النص.',false);});
  function kid(x,px,py,F,col){const r=8+F/60;x.fillStyle=col;x.beginPath();x.arc(px,py-r-14,r*0.6,0,7);x.fill();x.fillRect(px-r*0.55,py-r-6,r*1.1,r+2);label(x,`${F} N`,px,py-r*2-26,C.white,LAT(800,12),'center',false);}
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);gridBg(x,w,h,30,C.grid,C.navyDeep);const cx=w/2,py=h*0.62,s=Math.min((w-60)/9,120);
    x.fillStyle='#0B5A2E';x.fillRect(0,py+48,w,h);x.fillStyle=C.yellow;x.beginPath();x.moveTo(cx,py+4);x.lineTo(cx-24,py+48);x.lineTo(cx+24,py+48);x.closePath();x.fill();
    x.save();x.translate(cx,py);x.rotate(tilt);x.fillStyle='#C98B4B';x.fillRect(-4.4*s,-4,8.8*s,10);
    for(let m=1;m<=4;m++)[-1,1].forEach(sg=>{x.fillStyle='#3B2A24';x.fillRect(sg*m*s-1,6,2,6);label(x,`${m}`,sg*m*s,20,C.white,LAT(700,11),'center',false);});
    left.forEach(([F,d])=>kid(x,-d*s,-4,F,C.coral));
    if(d2)kid(x,d2*s,-4,F2,C.mint);else{x.globalAlpha=0.5;kid(x,2.5*s,-40,F2,C.mint);x.globalAlpha=1;label(x,'؟',2.5*s,-30,C.white,AR(800,20),'center');}
    x.restore();
    if(k.lv===1){label(x,`عزم الشمال = ${ML()} N m`,cx-12,24,C.coral,AR(800,13),'right');label(x,`عزم اليمين = ${F2*d2} N m`,cx+12,24,C.mint,AR(800,13),'left');}
  }
  function loop(ts){if(!on)return;const dt=Math.min(50,ts-(last||ts))/1000;last=ts;const net=d2?F2*d2-ML():-ML();
    const tg=Math.max(-0.13,Math.min(0.13,net/1500*0.13));tilt+=(tg-tilt)*Math.min(1,dt*4);if(RM)tilt=tg;draw();requestAnimationFrame(loop);}
  visible(c,v=>{if(v&&!on){on=true;last=0;requestAnimationFrame(loop);}else if(!v)on=false;});
  onRedraw(c,draw);k.start(1);
}

/* 1-5: hang the sign */
function signG(){
  const c=document.getElementById('sign-cv');if(!c)return;
  const W=200,L=[{lim:400,meter:true,max:90},{lim:250,meter:false,max:90},{lim:180,meter:false,max:45}];
  let P=L[0],A=15,state='ready',fall=0,t0=0;
  const T=()=>W/(2*Math.sin(rad(A)));
  const k=gameKit('sign',l=>{P=L[l-1];state='ready';fall=0;
    k.tip(l===1?`الكابل بيستحمل ${P.lim} N. العداد بيوريك الشد وإنت بتغيّر الزاوية.`:l===2?`الكابل أضعف: ${P.lim} N، والعداد مستخبي لحد ما تعلّق.`:`الكابل ${P.lim} N، والسقف واطي: اليافطة لازم تفضل فوق الخط الأحمر.`);draw();});
  range('sign-a',x=>`${x}°`,()=>{A=+document.getElementById('sign-a').value;if(state!=='ok'){state='ready';fall=0;}draw();});
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);x.fillStyle=C.sky;x.fillRect(0,0,w,h);const top=26,cx=w/2,Lc=Math.min(w*0.42,(h-110)/0.75);
    x.fillStyle='#5B6B7A';x.fillRect(0,top-12,w,12);
    const a=rad(A),kx=cx,ky=top+Lc*Math.sin(a)*0.75,ax1=cx-Lc*Math.cos(a),ax2=cx+Lc*Math.cos(a);
    const limY=top+Lc*Math.sin(rad(45))*0.75+70;
    if(P.max<90){x.setLineDash([8,6]);x.strokeStyle=C.red;x.lineWidth=2;x.beginPath();x.moveTo(0,limY);x.lineTo(w,limY);x.stroke();x.setLineDash([]);label(x,'أوطى حد لليافطة',w-10,limY-12,C.red,AR(700,12),'right');}
    const broke=state==='snap';
    x.strokeStyle='#3E4A55';x.lineWidth=3;x.beginPath();x.moveTo(ax1,top);x.lineTo(kx,ky+fall);if(!broke){x.moveTo(ax2,top);x.lineTo(kx,ky);}else{x.moveTo(ax2,top);x.lineTo(ax2-20,top+30);}x.stroke();
    x.fillStyle=C.white;[ax1,ax2].forEach(px=>{x.beginPath();x.arc(px,top,5,0,7);x.fill();});
    const sy=ky+fall+10;x.fillStyle=C.navy;x.fillRect(kx-60,sy,120,46);label(x,'كومنت',kx,sy+23,C.yellow,AR(800,18),'center');
    x.strokeStyle='#3E4A55';x.lineWidth=2;x.beginPath();x.moveTo(kx,ky+fall);x.lineTo(kx,sy);x.stroke();
    label(x,`θ = ${A}°`,ax2-40,top+18,C.navy,LAT(800,13),'right',false);
    if(P.meter||state!=='ready'){const t=T(),bw=Math.min(w*0.4,260),bx=14,by=h-30;x.fillStyle='rgba(1,56,105,0.15)';x.fillRect(bx,by,bw,14);
      x.fillStyle=t>P.lim?C.red:C.green;x.fillRect(bx,by,Math.min(1,t/(P.lim*1.6))*bw,14);x.fillStyle=C.navy;x.fillRect(bx+bw/1.6-1,by-5,3,24);
      label(x,`الشد = ${f(t,0)} N (الكابل يستحمل ${P.lim} N)`,bx,by-14,C.navy,AR(700,12),'left');}
  }
  function loop(ts){if(state!=='snap')return;fall=Math.min(c.offsetHeight,((ts-t0)/1000)**2*600);draw();if(fall<c.offsetHeight)requestAnimationFrame(loop);}
  document.getElementById('sign-go').addEventListener('click',()=>{if(k.won)return;const t=T();
    if(t>P.lim){state='snap';t0=performance.now();k.say(`الكابل اتقطع! الشد كان ${f(t,0)} N. خلي الكابل أقرب للرأسي.`,false);if(RM){fall=c.offsetHeight;draw();}else requestAnimationFrame(loop);return;}
    if(A>P.max){state='low';draw();k.say('الكابلات استحملت، بس اليافطة نزلت تحت الخط الأحمر. صغّر الزاوية شوية.',false);return;}
    state='ok';draw();k.win(`اتعلّقت! الشد ${f(t,0)} N بس.`);});
  onRedraw(c,draw);k.start(1);
}

/* 1-6: which is most efficient? */
function effG(){
  const cv=document.getElementById('eff-cv');if(cv)cv.style.display='none';
  const SETS=[[['لمبة فتلة',100,10],['لمبة LED',100,40],['موتور كهربا',100,80]],
    [['مضخة مية',200,150],['شاحن موبايل',50,40],['دفاية كهربا',1000,300]],
    [['ونش',5000,3500],['خلاط',400,240],['سخان مية',2400,2040],['لمبة LED',20,8]]];
  let devs=[],order=[],btns=[];
  const svg=(i,o,scale)=>{const H=Math.max(10,46*scale),e=o/i,hu=Math.max(3,H*e),hw=Math.max(3,H-hu),y0=8;
    return `<svg width="150" height="${Math.round(y0+H+34)}" viewBox="0 0 150 ${Math.round(y0+H+34)}" aria-hidden="true"><rect x="2" y="${y0}" width="58" height="${H}" fill="#9AA3AD"/><rect x="60" y="${y0}" width="62" height="${hu}" fill="#2C9B5E"/><path d="M122 ${y0-4}L146 ${y0+hu/2}L122 ${y0+hu+4}Z" fill="#2C9B5E"/><rect x="60" y="${y0+hu}" width="${hw}" height="${H+18-hu}" fill="#FF7078"/><path d="M${56} ${y0+H+18}L${60+hw/2} ${y0+H+32}L${64+hw} ${y0+H+18}Z" fill="#FF7078"/></svg>`;};
  const k=gameKit('eff',l=>{devs=shuffle(SETS[l-1].map(d=>d.slice()));order=[];render(l);
    k.tip(l===1?'السهم الأخضر = المفيد، والأحمر = المهدر. قارن عرض السهم الأخضر بالسهم الرمادي.':l===2?'خلي بالك: الأجهزة دخلها مختلف. قارن النسبة مش الرقم.':'أرقام بس من غير أسهم. اقسم المفيد على الدخل في دماغك.');});
  function render(l){const mx=Math.max(...devs.map(d=>d[1]));
    btns=mkPicks('eff',devs.map(([n,i,o])=>`<span class="badge" hidden></span><span style="display:flex;flex-direction:column;align-items:flex-start;gap:4px"><b>${n}</b>${l<3?svg(i,o,l===2?0.45+0.55*i/mx:1):''}${l>1?`<span class="m" style="font-size:13px">دخل ${i} J · مفيد ${o} J</span>`:''}</span>`),(i,b)=>{
      if(k.won)return;if(order.length===devs.length){order=[];btns.forEach(z=>{z.querySelector('.badge').hidden=true;z.setAttribute('aria-pressed','false');});k.say('');}
      if(order.includes(i))return;order.push(i);const bd=b.querySelector('.badge');bd.textContent=order.length;bd.hidden=false;b.setAttribute('aria-pressed','true');
      if(order.length===devs.length){const eff=j=>devs[j][2]/devs[j][1];const right=[...devs.keys()].sort((p,q)=>eff(q)-eff(p));
        if(right.every((j,ix)=>j===order[ix]))k.win('ترتيب صح!');
        else k.say('مش بالظبط. الكفاءات: '+right.map(j=>`${devs[j][0]} ${Math.round(eff(j)*100)}%`).join('، ')+'. دوس على أي جهاز وجرّب تاني.',false);}});}
  k.start(1);
}

/* 1-7: save the egg */
function eggG(){
  const c=document.getElementById('egg-cv');if(!c)return;
  const S=[['بلاط',0.002,'#C9CDD2',8],['خشب',0.005,'#B07A45',12],['فوطة',0.015,'#7FA7D9',16],['مخدة',0.04,'#F2E6C9',30],['مرتبة هوا',0.12,'#EF8575',46]];
  const M=0.06,LIM=25,HS=[0.5,3,8];let H=0.5,sel=-1,fr=0,run=false,t0=0,btns=[];
  const F=i=>M*Math.sqrt(2*G*H)/S[i][1];
  const k=gameKit('egg',l=>{H=HS[l-1];sel=-1;fr=0;press(btns,null);
    k.tip(l===1?`البيضة هتقع من ${H} m. أي سطح هيخليها سليمة؟`:l===2?`اترفعت لـ ${H} m! محتاج سطح يوقفها في وقت أطول.`:`من ${H} m. المرة دي اختار <b>أرق</b> سطح يكفي، مش الأطرى وخلاص.`);draw();});
  btns=mkPicks('egg',S.map(s=>s[0]),(i,b)=>{if(run||k.won)return;sel=i;press(btns,b);fr=0;run=true;t0=performance.now();k.say('');if(RM){fr=1;run=false;done();draw();}else requestAnimationFrame(loop);});
  function done(){const f0=F(sel),ok=f0<=LIM;
    if(!ok){k.say(`اتكسرت! القوة ${f(f0,0)} N. السطح ده بيوقفها في ${f(S[sel][1]*1000,0)} ms بس.`,false);return;}
    if(k.lv===3){const min=S.findIndex((s,i)=>F(i)<=LIM);if(sel!==min){k.say(`نجت، بس فيه سطح أرق يكفي. القوة كانت ${f(f0,0)} N بس.`,false);return;}}
    k.win(`سليمة! القوة ${f(f0,1)} N بس.`);}
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);gridBg(x,w,h,30,C.grid,C.navyDeep);const gy=h-30,cx=w*0.45;
    const s=sel>=0?S[sel]:null,th=s?s[3]:0;
    if(s){x.fillStyle=s[2];x.fillRect(cx-90,gy-th,180,th);label(x,s[0],cx+100,gy-th/2,C.white,AR(700,13),'left');}
    x.fillStyle='#5B6B7A';x.fillRect(0,gy,w,h-gy);
    const y0=40,yl=gy-th-22,ey=y0+(yl-y0)*fr*fr;const broke=sel>=0&&fr>=1&&F(sel)>LIM;
    if(broke){x.fillStyle=C.white;x.beginPath();x.ellipse(cx,yl+16,34,6,0,0,7);x.fill();x.fillStyle=C.yellow;x.beginPath();x.arc(cx,yl+13,9,0,7);x.fill();
      x.fillStyle='#F4EFE3';x.beginPath();x.moveTo(cx-30,yl+12);x.lineTo(cx-22,yl-4);x.lineTo(cx-14,yl+6);x.lineTo(cx-10,yl+12);x.fill();}
    else{x.fillStyle='#F4EFE3';x.beginPath();x.ellipse(cx,ey,16,21,0,0,7);x.fill();}
    x.setLineDash([4,4]);x.strokeStyle=C.sky;x.lineWidth=1;x.beginPath();x.moveTo(cx-120,y0);x.lineTo(cx-120,gy);x.stroke();x.setLineDash([]);
    label(x,`h = ${H} m`,cx-128,(y0+gy)/2,C.sky,LAT(700,13),'right',false);
    if(sel>=0&&fr>=1){const f0=F(sel),bw=w*0.32,bx=w-bw-16;x.fillStyle='rgba(201,230,255,0.15)';x.fillRect(bx,24,bw,14);
      x.fillStyle=f0>LIM?C.red:C.green;x.fillRect(bx,24,Math.min(1,f0/(LIM*3))*bw,14);x.fillStyle=C.white;x.fillRect(bx+bw/3-1,18,2,26);
      label(x,`F = ${f(f0,1)} N`,bx,54,C.white,LAT(800,12),'left',false);label(x,`Δt = ${f(S[sel][1]*1000,0)} ms`,bx,72,C.sky,LAT(700,12),'left',false);}
  }
  function loop(ts){if(!run)return;fr=Math.min(1,(ts-t0)/800);draw();if(fr<1)requestAnimationFrame(loop);else{run=false;draw();done();}}
  onRedraw(c,draw);k.start(1);
}

/* 1-8: crash and stick */
function crashG(){
  const c=document.getElementById('crash-cv');if(!c)return;
  const L=[{mB:2,vA:3,vB:0,ans:4},{mB:2,vA:3,vB:-1,ans:3},{mB:3,vA:4,vB:0,ans:3}],AC=0.5,ZW=0.4;
  let P=L[0],mA=0,t=0,run=false,t0=0,btns=[];
  const vp=m=>(m*P.vA+P.mB*P.vB)/(m+P.mB),dist=m=>{const v=vp(m);return Math.sign(v)*v*v/(2*AC);};
  const tc=()=>3.5/(P.vA-P.vB);
  const k=gameKit('crash',l=>{P=L[l-1];mA=0;t=0;press(btns,null);
    k.tip(l===1?'الأرقام فوق بتوريك كمية التحرك قبل وبعد. لاحظ إنها مابتتغيرش.':l===2?'العربية الزرقا جاية عكسك! كمية تحركها سالبة.':'العربية الزرقا أتقل المرة دي.');draw();});
  btns=mkPicks('crash',[1,2,3,4,5].map(n=>`<span class="m">${n} kg</span>`),(i,b)=>{if(run||k.won)return;mA=i+1;press(btns,b);t=0;run=true;t0=performance.now();k.say('');
    if(RM){t=99;run=false;draw();res();}else requestAnimationFrame(loop);});
  function res(){const d=dist(mA),dz=dist(P.ans);if(Math.abs(d-dz)<=ZW)k.win('وقفوا في المنطقة الخضرا!');
    else k.say(d<dz?`وقفوا قبل المنطقة: العربيتين محتاجين كمية تحرك أكبر.`:`عدّوا المنطقة: كمية التحرك زيادة.`,false);}
  const pos=()=>{const T=tc();if(t<=T)return{a:-3.5+P.vA*t,b:-P.vB*T+P.vB*t,after:false};const v=vp(mA),tt=Math.min(t-T,Math.abs(v)/AC);return{a:Math.sign(v)*(Math.abs(v)*tt-0.5*AC*tt*tt),b:null,after:true};};
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);gridBg(x,w,h,30,C.grid,C.navyDeep);const ty=h*0.55,S=(w-40)/13,X=m=>20+(m+4.5)*S;
    x.fillStyle='#5B6B7A';x.fillRect(10,ty+18,w-20,5);
    const dz=dist(P.ans);x.fillStyle='rgba(88,214,150,0.35)';x.fillRect(X(dz-ZW),ty-30,2*ZW*S,48);
    for(let m=0;m<=8;m+=2){label(x,`${m} m`,X(m),ty+36,C.sky,LAT(600,11),'center',false);}
    const car=(xm,ww,col,txt)=>{x.fillStyle=col;x.fillRect(X(xm)-ww,ty-14,ww*2,30);x.fillStyle=C.navy;x.beginPath();x.arc(X(xm)-ww*0.55,ty+18,5,0,7);x.arc(X(xm)+ww*0.55,ty+18,5,0,7);x.fill();label(x,txt,X(xm),ty+1,C.navy,LAT(800,12),'center',false);};
    const wa=14+(mA||2)*4,wb=14+P.mB*4;
    if(!mA){car(-3.5,wa,C.yellow,'?');car(0,wb,C.sky,`${P.mB} kg`);}
    else{const p=pos();if(!p.after){car(p.a-wa/S,wa,C.yellow,`${mA} kg`);car(p.b+wb/S,wb,C.sky,`${P.mB} kg`);}
      else{car(p.a-wa/S,wa,C.yellow,`${mA}`);car(p.a+wb/S,wb,C.sky,`${P.mB}`);}}
    label(x,`v = ${P.vA} m/s`,X(-3.5),ty-30,C.yellow,LAT(700,12),'center',false);
    label(x,P.vB?`v = ${P.vB} m/s`:'ساكنة',X(0.5),ty-30,C.sky,P.vB?LAT(700,12):AR(700,12),'center',!P.vB);
    if(k.lv===1&&mA){const pb=mA*P.vA+P.mB*P.vB;label(x,`Σp قبل = ${f(pb,1)}    Σp بعد = ${f((mA+P.mB)*vp(mA),1)} kg m/s`,w/2,26,C.white,LAT(700,13),'center',false);}
  }
  function loop(ts){if(!run)return;t=(ts-t0)/1000*1.3;draw();const T=tc()+Math.abs(vp(mA))/AC;if(t<T)requestAnimationFrame(loop);else{run=false;draw();res();}}
  onRedraw(c,draw);k.start(1);
}

/* True / false: concepts, 3 hearts */
function tfG(){
  const qEl=document.getElementById('tf-q');if(!qEl)return;
  const Q=[
   ['1-1','سرعة القارب بالنسبة للضفة تساوي دائمًا سرعته في الماء الساكن.',0,'التيار بيتجمع مع سرعة القارب كمتجه، فالسرعة بالنسبة للضفة غالبًا بتختلف.'],
   ['1-1','إذا اتجهت مقدمة قارب عموديًا على الضفة، فإن زمن العبور لا يعتمد على سرعة التيار.',1,'التيار أفقي، فمابيأثرش على السرعة العمودية اللي بتعدّي بيها النهر. بيأثر بس على مكان الرسو.'],
   ['1-1','المطر الساقط رأسيًا يبدو مائلًا لراكب حافلة متحركة.',1,'بالنسبة للراكب، المطر جاي عليه بسرعة أفقية عكس حركة الحافلة، فبيبان مايل.'],
   ['1-1','محصلة سرعتين متعامدتين 3 m/s و 4 m/s تساوي 7 m/s.',0,'متعامدتين يبقى فيثاغورث: √(9 + 16) = 5 m/s.'],
   ['1-2','الصندوق الساقط من طائرة تطير أفقيًا يتحرك أفقيًا بسرعة الطائرة نفسها (بإهمال الهواء).',1,'مفيش قوة أفقية عليه، فبيحتفظ بسرعته الأفقية ويفضل تحت الطيارة.'],
   ['1-2','كرة قُذفت أفقيًا وأخرى سقطت من الارتفاع نفسه في اللحظة نفسها تصلان الأرض معًا.',1,'الحركة الرأسية للاتنين واحدة: بيبدأوا من صفر رأسيًا ونفس الجاذبية.'],
   ['1-2','السرعة الأفقية لمقذوف أفقي تزداد أثناء سقوطه.',0,'الأفقية ثابتة. اللي بيزيد هو الرأسية بس.'],
   ['1-3','عند أقصى ارتفاع لمقذوف بزاوية تكون سرعته صفرًا.',0,'الرأسية بس اللي صفر، والأفقية موجودة زي ما هي.'],
   ['1-3','الزاوية 45° تعطي أكبر مدى أفقي لنفس السرعة على أرض مستوية.',1,'المدى بيعتمد على sin 2θ، وأكبر قيمة ليها عند 2θ = 90°.'],
   ['1-3','قذيفتان بالسرعة نفسها بزاويتي 30° و 60° لهما المدى الأفقي نفسه.',1,'الزاويتين مجموعهم 90°، فـ sin 2θ واحد في الاتنين.'],
   ['1-4','كلما زاد البُعد العمودي للقوة عن محور الدوران زاد عزمها.',1,'M = F d: البُعد أكبر، العزم أكبر.'],
   ['1-4','القوة التي يمر خط عملها بمحور الدوران تُحدث أكبر عزم.',0,'بالعكس: البُعد العمودي صفر، فالعزم صفر.'],
   ['1-4','العزم الذي يدير الجسم مع اتجاه عقارب الساعة يكون موجبًا.',0,'الاتفاق: عكس عقارب الساعة موجب، ومعها سالب.'],
   ['1-5','الجسم الذي يتحرك بسرعة ثابتة في خط مستقيم يكون في حالة اتزان.',1,'سرعة ثابتة يعني مفيش عجلة، يبقى محصلة القوى صفر.'],
   ['1-5','عند تعليق جسم بكابلين متماثلين، يكون الشد في كل كابل دائمًا نصف الوزن.',0,'ده بيحصل بس لو الكابلين رأسيين. لو مايلين، الشد أكبر.'],
   ['1-5','كلما اقترب الكابل من الوضع الأفقي زاد الشد فيه لحمل الوزن نفسه.',1,'الجزء الرأسي من الشد بيصغر، فالشد كله لازم يكبر.'],
   ['1-5','في مخطط الجسم الحر نرسم القوى التي يؤثر بها الجسم على غيره.',0,'بنرسم القوى اللي بتأثر عليه هو بس.'],
   ['1-6','المصعد الأسرع يبذل شغلًا أكبر لرفع الحمل نفسه إلى الارتفاع نفسه.',0,'نفس الشغل (m g h). الأسرع قدرته أكبر بس.'],
   ['1-6','يمكن أن تصل كفاءة جهاز حقيقي إلى 100%.',0,'دايمًا فيه جزء بيضيع، غالبًا حرارة.'],
   ['1-6','الكفاءة ليس لها وحدة قياس.',1,'نسبة بين طاقتين، فالوحدات بتتلغي.'],
   ['1-6','في مخطط سانكي يتناسب عرض السهم مع مقدار الطاقة التي يمثلها.',1,'السهم العريض = طاقة أكبر.'],
   ['1-6','الوات يساوي جولًا لكل ثانية.',1,'القدرة = شغل ÷ زمن، يبقى W = J/s.'],
   ['1-7','الوسادة الهوائية تقلل التغير في كمية تحرك الراكب.',0,'التغير ثابت. هي بتطوّل زمن الوقوف، فالقوة تقل.'],
   ['1-7','الكرة التي ترتد عن الحائط تتلقى دفعًا أكبر من الكرة التي تلتصق به.',1,'اللي بترتد بتقف وترجع، فالتغير في كمية تحركها أكبر.'],
   ['1-7','وحدة الدفع N s هي نفسها وحدة كمية التحرك kg m/s.',1,'N = kg m/s²، فـ N s = kg m/s.'],
   ['1-7','كمية التحرك كمية قياسية.',0,'متجهة، واتجاهها نفس اتجاه السرعة.'],
   ['1-8','عندما تقفز من قارب ساكن إلى الرصيف يتحرك القارب للخلف.',1,'كمية التحرك الكلية كانت صفر، فإنت والقارب بتاخدوا كميتين متساويتين ومتعاكستين.'],
   ['1-8','في نظام معزول يمكن أن تتغير كمية التحرك الكلية.',0,'معزول يعني الدفع الخارجي صفر، فالكلية ثابتة.'],
   ['1-8','يتحرك الصاروخ في الفضاء لأنه يدفع الهواء خلفه.',0,'مفيش هوا في الفضاء! هو بيزق غازات العادم بتاعته، وهي بتزقه.'],
   ['1-8','عند تدافع شخصين ساكنين على الجليد، يتحرك الأخف بسرعة أكبر.',1,'نفس كمية التحرك، والكتلة الأصغر تاخد سرعة أكبر.']];
  const hearts=document.getElementById('tf-hearts'),sc=document.getElementById('tf-score'),bestEl=document.getElementById('tf-best'),les=document.getElementById('tf-les'),
    yes=document.getElementById('tf-yes'),no=document.getElementById('tf-no'),ex=document.getElementById('tf-ex'),st=document.getElementById('tf-start'),nx=document.getElementById('tf-nextq');
  let deck=[],cur=null,life=3,score=0,best=store.get('comnt-tf-best');bestEl.textContent=best;
  const paintH=()=>{hearts.innerHTML=[0,1,2].map(i=>HEART(i<life)).join('');};
  const stars=n=>n>=10?3:n>=6?2:n>=3?1:0;
  function ask(){if(!deck.length||life<=0)return end();cur=deck.pop();les.textContent=`الدرس ${cur[0]}`;qEl.textContent=cur[1];ex.hidden=true;nx.hidden=true;yes.disabled=no.disabled=false;}
  function answer(v){if(!cur)return;yes.disabled=no.disabled=true;const ok=v===cur[2];if(ok){score++;sc.textContent=score;}else{life--;paintH();}
    ex.hidden=false;ex.className='tfex '+(ok?'ok':'no');ex.innerHTML=`<b>${ok?'صح!':'لأ.'}</b> الجملة ${cur[2]?'صح':'غلط'}: ${cur[3]}`;cur=null;
    if(life<=0||!deck.length){st.hidden=false;end();}else nx.hidden=false;}
  function end(){yes.disabled=no.disabled=true;nx.hidden=true;les.textContent='';const n=stars(score);
    if(score>best){best=score;store.set('comnt-tf-best',best);bestEl.textContent=best;}
    if(n>store.get('comnt-st-tf')){store.set('comnt-st-tf',n);paintStars('tf');}
    qEl.textContent=`خلصت! جاوبت ${score} صح${n?` وخدت ${n} ${n===1?'نجمة':'نجوم'}`:''}.`;st.textContent='العب تاني';st.hidden=false;}
  st.addEventListener('click',()=>{deck=shuffle(Q.slice());life=3;score=0;sc.textContent=0;paintH();st.hidden=true;ask();});
  yes.addEventListener('click',()=>answer(1));no.addEventListener('click',()=>answer(0));nx.addEventListener('click',ask);
  paintH();
}

function gamesHub(){
  const root=document.getElementById('lesson-games');if(!root)return;
  const secs=$$('section.game',root),intro=document.getElementById('g-intro');
  const show=()=>{const h=decodeURIComponent(location.hash.slice(1));const g=secs.find(s=>s.id===h);secs.forEach(s=>s.hidden=s!==g);intro.hidden=!!g;if(g)setTimeout(()=>redrawers.forEach(fn=>fn()),30);};
  addEventListener('hashchange',show);show();
  ['river','drop','cannon','seesaw','sign','eff','egg','crash','tf'].forEach(paintStars);
  riverG();dropG();cannonG();seesawG();signG();effG();eggG();crashG();tfG();
}
