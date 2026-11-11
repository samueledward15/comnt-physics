/* ===== Games tab ===== */
const store={get:k=>{try{return +(localStorage.getItem(k)||0);}catch(e){return 0;}},set:(k,v)=>{try{localStorage.setItem(k,String(v));}catch(e){}}};
const rnd=(a,b,step=1)=>a+step*Math.floor(Math.random()*(Math.round((b-a)/step)+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const setMsg=(id,t,ok)=>{const m=document.getElementById(id);if(!m)return;m.textContent=t;m.style.color=ok===undefined?'':ok?'var(--pen-check)':'var(--pen-warn)';};

/* Game 1: hit the target with an angled projectile */
function cannonGame(){
  const c=document.getElementById('gcCanvas');if(!c)return;
  const G=9.8,TOL=1.5;let v=18,A=45,T=25,wall=null,hits=0,best=store.get('comnt-gc-best'),shot=null,anim=false,t0=0,last=null;
  const lvl=()=>1+Math.floor(hits/3);
  const W=()=>Math.max(50,Math.ceil((T+15)/10)*10);
  const ui=()=>{document.getElementById('gcT').textContent=`${T} m`;document.getElementById('gcLv').textContent=lvl();document.getElementById('gcSc').textContent=hits;document.getElementById('gcBest').textContent=best;};
  function newTarget(){
    const L=lvl();T=L===1?rnd(15,35):L===2?rnd(25,50):rnd(30,60);
    wall=L>=3?{x:Math.round(T*0.5),h:rnd(4,Math.min(12,3+L*2))}:null;
    shot=null;last=null;ui();setMsg('gcMsg',wall?`فيه حيطة ارتفاعها ${wall.h} m على بُعد ${wall.x} m`:'');draw();
  }
  range('gcV',v=>`${v} m/s`,()=>{v=+document.getElementById('gcV').value;if(!anim)draw();});
  range('gcA',v=>`${v}°`,()=>{A=+document.getElementById('gcA').value;if(!anim)draw();});
  /* full path until it lands or hits the wall */
  function path(vv,aa){
    const vx=vv*Math.cos(rad(aa)),vy=vv*Math.sin(rad(aa)),tf=2*vy/G;
    let land=vx*tf,blocked=false,tEnd=tf;
    if(wall&&vx>0){const tw=wall.x/vx;if(tw<tf){const yw=vy*tw-0.5*G*tw*tw;if(yw<wall.h){blocked=true;tEnd=tw;land=wall.x;}}}
    return {vx,vy,tEnd,land,blocked};
  }
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);gridBg(x,w,h,30,C.grid,C.navyDeep);
    const Wm=W(),s=(w-50)/Wm,ox=30,gy=h-34,X=m=>ox+m*s,Y=m=>gy-m*s;
    x.fillStyle='#0B5A2E';x.fillRect(0,gy,w,h-gy);
    x.fillStyle=C.sky;x.font=LAT(500,10);x.textAlign='center';x.direction='ltr';
    for(let m=0;m<=Wm;m+=10){x.fillRect(X(m),gy,1,6);x.fillText(`${m} m`,X(m),gy+16);}
    // target
    x.fillStyle=C.red;x.fillRect(X(T-TOL),gy-6,TOL*2*s,6);x.fillStyle=C.white;x.fillRect(X(T)-1,gy-26,3,20);
    x.fillStyle=C.red;x.beginPath();x.moveTo(X(T)+2,gy-26);x.lineTo(X(T)+16,gy-21);x.lineTo(X(T)+2,gy-16);x.fill();
    if(wall){x.fillStyle='#8A5A35';x.fillRect(X(wall.x)-5,Y(wall.h),10,wall.h*s);label(x,`${wall.h} m`,X(wall.x),Y(wall.h)-12,C.white,LAT(700,11),'center',false);}
    // cannon + aim line
    const a=rad(A);x.strokeStyle=C.yellow;x.lineWidth=8;x.lineCap='round';x.beginPath();x.moveTo(ox,gy-4);x.lineTo(ox+26*Math.cos(a),gy-4-26*Math.sin(a));x.stroke();
    x.fillStyle=C.white;x.beginPath();x.arc(ox,gy-4,9,0,7);x.fill();
    if(last){x.setLineDash([4,6]);x.strokeStyle='rgba(201,230,255,0.45)';x.lineWidth=2;x.beginPath();
      for(let i=0;i<=40;i++){const t=last.tEnd*i/40;const px=X(last.vx*t),py=Y(last.vy*t-0.5*G*t*t);i?x.lineTo(px,py):x.moveTo(px,py);}x.stroke();x.setLineDash([]);}
    if(shot){const t=shot.t;const bx=X(shot.vx*t),by=Y(Math.max(0,shot.vy*t-0.5*G*t*t));
      x.strokeStyle='rgba(239,211,73,0.6)';x.lineWidth=2;x.beginPath();for(let i=0;i<=30;i++){const tt=t*i/30;const px=X(shot.vx*tt),py=Y(shot.vy*tt-0.5*G*tt*tt);i?x.lineTo(px,py):x.moveTo(px,py);}x.stroke();
      x.fillStyle=C.yellow;x.beginPath();x.arc(bx,by,6,0,7);x.fill();}
    pill(x,`v₀ = ${v} m/s · θ = ${A}°`.replace('₀','0'),w-110,20,C.yellow,C.navy,LAT(700,12));
  }
  function finish(p){
    anim=false;last=p;shot=null;
    if(p.blocked){setMsg('gcMsg','الكورة خبطت في الحيطة! جرّب زاوية أكبر.',false);}
    else{const err=p.land-T;
      if(Math.abs(err)<=TOL){hits++;if(hits>best){best=hits;store.set('comnt-gc-best',best);}const up=hits%3===0;ui();
        setMsg('gcMsg',`إصابة! نزلت على ${f(p.land,1)} m.${up?' طلعت مستوى جديد!':''}`,true);setTimeout(newTarget,1300);}
      else setMsg('gcMsg',`نزلت على ${f(p.land,1)} m، يعني ${err<0?'قبل':'بعد'} الهدف بـ ${f(Math.abs(err),1)} m.`,false);}
    draw();
  }
  function loop(ts){if(!anim)return;const t=Math.min(shot.tEnd,(ts-t0)/1000*Math.max(1,shot.tEnd/2.2));shot.t=t;draw();
    if(t>=shot.tEnd){finish(shot);return;}requestAnimationFrame(loop);}
  document.getElementById('gcFire').addEventListener('click',()=>{if(anim)return;const p=path(v,A);
    if(RM){finish(p);return;}shot=Object.assign({t:0},p);anim=true;t0=performance.now();setMsg('gcMsg','');requestAnimationFrame(loop);});
  document.getElementById('gcNew').addEventListener('click',()=>{if(!anim)newTarget();});
  document.getElementById('gcHint').addEventListener('click',()=>{const hb=document.getElementById('gcHelp');hb.hidden=!hb.hidden;});
  onRedraw(c,draw);newTarget();
}

/* Game 2: reach the dock across the river */
function riverGame(){
  const c=document.getElementById('grCanvas');if(!c)return;
  const VB=5,WID=60,TOL=3;let a=0,vc=2,dock=0,won=0,played=0,run=null,t0=0,lastX=null;
  const ui=()=>{document.getElementById('grC').textContent=`${f(vc,1)} m/s`;
    document.getElementById('grDock').textContent=dock===0?'قصادك بالظبط':`${dock>0?'+':'−'}${Math.abs(dock)} m (${dock>0?'مع':'عكس'} التيار)`;
    document.getElementById('grSc').textContent=`${won} / ${played}`;};
  function newRound(){vc=rnd(1,4,0.5);dock=rnd(-20,20,5);run=null;lastX=null;ui();setMsg('grMsg','');draw();}
  range('grA',v=>`${v}°`,()=>{a=+document.getElementById('grA').value;if(!run)draw();});
  const motion=()=>{const vx=vc+VB*Math.sin(rad(a)),vy=VB*Math.cos(rad(a));return{vx,vy,tf:WID/vy};};
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);x.fillStyle='#E9D9A8';x.fillRect(0,0,w,h);
    const top=34,bot=h-34,s=w/100,cx=w/2,X=m=>cx+m*s,Y=m=>bot-(m/WID)*(bot-top);
    x.fillStyle='#1F6FB2';x.fillRect(0,top,w,bot-top);
    x.strokeStyle='rgba(255,255,255,0.35)';x.lineWidth=2;
    for(let j=0;j<4;j++){const yy=top+(bot-top)*(j+0.5)/4;for(let i=0;i<5;i++){const xx=((i*w/5)+(performance.now()/40*vc)%(w/5));arrow(x,xx,yy,xx+24,yy,'rgba(255,255,255,0.4)',2,7);}}
    // dock
    x.fillStyle=C.yellow;x.fillRect(X(dock-TOL),top-14,TOL*2*s,14);label(x,'المرسى',X(dock),top-24<8?8:top-22,C.navy,AR(700,12),'center');
    x.fillStyle=C.white;x.fillRect(cx-1,bot,2,12);
    // boat
    const m=motion();let bx=0,by=0;
    if(run){bx=m.vx*run.t;by=m.vy*run.t;
      x.strokeStyle='rgba(239,211,73,0.8)';x.setLineDash([5,5]);x.lineWidth=2;x.beginPath();x.moveTo(X(0),Y(0));x.lineTo(X(bx),Y(by));x.stroke();x.setLineDash([]);}
    else if(lastX!==null){x.strokeStyle='rgba(239,211,73,0.6)';x.setLineDash([5,5]);x.lineWidth=2;x.beginPath();x.moveTo(X(0),Y(0));x.lineTo(X(lastX),Y(WID));x.stroke();x.setLineDash([]);}
    const px=X(bx),py=Y(by),hd=Math.atan2(-m.vy,VB*Math.sin(rad(a))+0);
    x.save();x.translate(px,py);x.rotate(rad(a));x.fillStyle=C.red;x.beginPath();x.moveTo(0,-16);x.lineTo(8,8);x.lineTo(-8,8);x.closePath();x.fill();x.restore();
    if(!run){arrow(x,px,py,px+VB*Math.sin(rad(a))*9,py-VB*Math.cos(rad(a))*9,C.yellow,3,9);arrow(x,px,py,px+vc*9,py,C.sky,3,9);}
    label(x,`v_c = ${f(vc,1)} m/s`.replace('_',''),70,bot+18,C.navy,LAT(700,12),'center',false);
    label(x,`${WID} m`,w-24,(top+bot)/2,C.white,LAT(700,12),'center',false);
  }
  function loop(ts){if(!run)return;const m=motion();run.t=Math.min(m.tf,(ts-t0)/1000*Math.max(1,m.tf/2.5));draw();
    if(run.t>=m.tf){const xl=m.vx*m.tf;lastX=xl;run=null;played++;const ok=Math.abs(xl-dock)<=TOL;if(ok)won++;ui();
      setMsg('grMsg',ok?`رسيت على ${f(xl,1)} m. كسبت الجولة!`:`رسيت على ${f(xl,1)} m، والمرسى على ${dock} m. الفرق ${f(Math.abs(xl-dock),1)} m.`,ok);draw();if(ok)setTimeout(newRound,1500);return;}
    requestAnimationFrame(loop);}
  document.getElementById('grGo').addEventListener('click',()=>{if(run)return;setMsg('grMsg','');
    if(RM){run={t:motion().tf};t0=performance.now()-1e9;}else{run={t:0};t0=performance.now();}requestAnimationFrame(loop);});
  document.getElementById('grNew').addEventListener('click',()=>{if(!run)newRound();});
  onRedraw(c,draw);newRound();
}

/* Game 3: balance the seesaw */
function seesawGame(){
  const c=document.getElementById('gsCanvas');if(!c)return;
  let F1=400,d1=1.5,F2=300,d2=1.5,won=0,played=0,tilt=0,target=0,held=true,on=false,lastTs=0;
  const need=()=>F1*d1/F2;
  function newRound(){
    do{F1=rnd(200,500,50);d1=rnd(1,2.5,0.5);F2=rnd(200,600,50);}while(F2===F1||need()<0.3||need()>2.95);
    held=true;target=0;tilt=0;
    document.getElementById('gsL').textContent=`${F1} × ${d1} = ${f(F1*d1,0)} N m`;document.getElementById('gsW2').textContent=`${F2} N`;
    setMsg('gsMsg','');draw();
  }
  range('gsD',v=>`${f(v,2)} m`,()=>{d2=+document.getElementById('gsD').value;if(!held){held=true;target=0;}draw();});
  function kid(x,px,py,F,col,txt){const r=8+F/60;x.fillStyle=col;x.beginPath();x.arc(px,py-r-12,r*0.6,0,7);x.fill();x.fillRect(px-r*0.55,py-r-4,r*1.1,r);label(x,txt,px,py-r*2-24,C.white,LAT(700,12),'center',false);}
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);gridBg(x,w,h,30,C.grid,C.navyDeep);
    const cx=w/2,py=h*0.62,s=Math.min((w-60)/6.4,110);
    x.fillStyle='#0B5A2E';x.fillRect(0,py+46,w,h);
    x.fillStyle=C.yellow;x.beginPath();x.moveTo(cx,py+4);x.lineTo(cx-22,py+46);x.lineTo(cx+22,py+46);x.closePath();x.fill();
    if(held){x.fillStyle='#5B6B7A';x.fillRect(cx+2.9*s,py+6,10,40);x.fillRect(cx-2.9*s-10,py+6,10,40);}
    x.save();x.translate(cx,py);x.rotate(tilt);
    x.fillStyle='#C98B4B';x.fillRect(-3.1*s,-4,6.2*s,10);
    x.fillStyle='#3B2A24';x.font=LAT(500,9);x.textAlign='center';x.direction='ltr';
    for(let m=-3;m<=3;m+=0.5){x.fillRect(m*s,6,1,m%1===0?6:3);if(m%1===0&&m)x.fillText(`${Math.abs(m)}`,m*s,20);}
    kid(x,-d1*s,-4,F1,C.coral,`${F1} N`);kid(x,d2*s,-4,F2,C.mint,`${F2} N`);
    x.restore();
    label(x,`d1 = ${d1} m`,cx-d1*s/2,py+64,C.white,LAT(700,12),'center',false);
    label(x,`d2 = ${f(d2,2)} m`,cx+d2*s/2,py+64,C.white,LAT(700,12),'center',false);
    if(held)label(x,'السيسو مسنود لحد ما تدوس «جرّب»',cx,22,C.sky,AR(600,13),'center');
  }
  function loop(ts){if(!on)return;const dt=Math.min(50,ts-(lastTs||ts))/1000;lastTs=ts;tilt+=(target-tilt)*Math.min(1,dt*5);if(RM)tilt=target;draw();requestAnimationFrame(loop);}
  visible(c,v=>{if(v&&!on){on=true;lastTs=0;requestAnimationFrame(loop);}else if(!v)on=false;});
  document.getElementById('gsCheck').addEventListener('click',()=>{
    const net=F2*d2-F1*d1,ok=Math.abs(d2-need())<=0.05;played++;if(ok)won++;held=false;
    target=ok?0:Math.max(-0.25,Math.min(0.25,net/F1*0.25));
    document.getElementById('gsSc').textContent=`${won} / ${played}`;
    setMsg('gsMsg',ok?`متزن! ${F2} × ${f(d2,2)} ≈ ${f(F1*d1,0)} N m`:net>0?`مال ناحية اليمين: عزمه ${f(F2*d2,0)} N m أكبر. قرّب الطفل من النص.`:`مال ناحية الشمال: عزم اليمين ${f(F2*d2,0)} N m أصغر. بعّد الطفل عن النص.`,ok);
    draw();if(ok)setTimeout(newRound,1600);
  });
  document.getElementById('gsNew').addEventListener('click',newRound);
  onRedraw(c,draw);newRound();
}

/* Game 4: one-minute blitz with generated questions */
function blitzGame(){
  const box=document.getElementById('gbOpts');if(!box)return;
  const qEl=document.getElementById('gbQ'),tEl=document.getElementById('gbTime'),sEl=document.getElementById('gbScore'),bEl=document.getElementById('gbBest'),st=document.getElementById('gbStart');
  let best=store.get('comnt-gb-best'),score=0,left=60,timer=null,lock=false;bEl.textContent=best;
  const n=v=>String(+(+v).toFixed(2));
  const TRIG={30:[0.5,0.866],37:[0.6,0.8],53:[0.8,0.6],60:[0.866,0.5]};
  const gens=[
    ()=>{const v=pick([10,20,30,40,50]),th=pick([30,37,53,60]),[sn,cs]=TRIG[th];return{q:`جسم سرعته ${v} m/s بزاوية ${th}° مع الأفقي. المركبة الأفقية للسرعة تساوي:`,a:`${n(v*cs)} m/s`,w:[`${n(v*sn)} m/s`,`${v} m/s`,`${n(v/2+5)} m/s`]};},
    ()=>{const [p,q,r]=pick([[3,4,5],[6,8,10],[5,12,13],[8,15,17],[9,12,15]]);return{q:`سرعتان متعامدتان ${p} m/s و ${q} m/s. مقدار السرعة المحصلة:`,a:`${r} m/s`,w:[`${p+q} m/s`,`${q-p} m/s`,`${r+2} m/s`]};},
    ()=>{const a=pick([60,70,80,90]),b=pick([40,50,30]);const same=Math.random()<0.5;return{q:`سيارتان سرعتاهما ${a} km/h و ${b} km/h تتحركان في ${same?'الاتجاه نفسه':'اتجاهين متضادين'}. سرعة إحداهما بالنسبة للأخرى:`,a:`${same?a-b:a+b} km/h`,w:[`${same?a+b:a-b} km/h`,`${a} km/h`,`${a*b/10} km/h`]};},
    ()=>{const t=pick([1,2,3,4]),h=5*t*t;return{q:`يسقط حجر سقوطًا حرًا من ارتفاع ${h} m. زمن الوصول للأرض (اعتبر g = 10 m/s²):`,a:`${t} s`,w:[`${t*2} s`,`${h/10} s`,`${t+0.5} s`].map(z=>z===`${t} s`?`${t*3} s`:z)};},
    ()=>{const v=pick([10,20,30]);return{q:`قذيفة سرعتها ${v} m/s بزاوية 45°. أقصى مدى أفقي لها (g = 10 m/s²):`,a:`${v*v/10} m`,w:[`${v*v/20} m`,`${v*v/5} m`,`${v} m`]};},
    ()=>{const F=pick([10,20,40,50]),d=pick([20,25,30,50]);const M=F*d/100;return{q:`قوة ${F} N تؤثر عموديًا على بُعد ${d} cm من محور الدوران. العزم:`,a:`${n(M)} N m`,w:[`${F*d} N m`,`${n(M*2)} N m`,`${n(F/d*10)} N m`]};},
    ()=>{const v=pick([36,54,72,90,108]);return{q:`السرعة ${v} km/h تساوي بالمتر لكل ثانية:`,a:`${v/3.6} m/s`,w:[`${n(v*3.6)} m/s`,`${v/10} m/s`,`${v/3.6+5} m/s`]};},
    ()=>{const v=pick([5,10,15,20]),t=pick([2,3,4]);return{q:`كرة قُذفت أفقيًا بسرعة ${v} m/s، ووصلت للأرض بعد ${t} s. مداها الأفقي:`,a:`${v*t} m`,w:[`${v*t/2} m`,`${5*t*t} m`,`${v+t} m`]};},
    ()=>{const F=pick([20,30,40]),d=pick([1,2,3]),F2=pick([10,60,80].filter(z=>z!==F));return{q:`طفل وزنه ${F*10} N يجلس على بُعد ${d} m من نقطة ارتكاز. على أي بُعد يجلس طفل وزنه ${F2*10} N في الجهة الأخرى ليتزن اللوح؟`,a:`${n(F*d/F2)} m`,w:[`${n(F2*d/F)} m`,`${d} m`,`${n(F*d/F2+1)} m`]};}
  ];
  const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  function next(){
    let g;do{g=pick(gens)();}while(new Set([g.a,...g.w]).size<4);
    qEl.innerHTML=g.q;box.innerHTML='';lock=false;
    shuffle([g.a,...g.w]).forEach(o=>{const b=document.createElement('button');b.type='button';b.className='choice';b.textContent=o;
      b.addEventListener('click',()=>{if(lock||!timer)return;lock=true;const ok=o===g.a;b.classList.add(ok?'right':'wrong');
        if(!ok)$$('.choice',box).forEach(z=>{if(z.textContent===g.a)z.classList.add('right');});
        if(ok){score++;sEl.textContent=score;}setTimeout(()=>{if(timer)next();},ok?350:900);});box.appendChild(b);});
  }
  function end(){clearInterval(timer);timer=null;$$('.choice',box).forEach(b=>b.disabled=true);
    const rec=score>best;if(rec){best=score;store.set('comnt-gb-best',best);bEl.textContent=best;}
    qEl.textContent=`خلص الوقت! جبت ${score} ${score===1?'نقطة':'نقط'}.`;setMsg('gbMsg',rec?'رقم قياسي جديد!':'جرّب تاني وحاول تكسر رقمك.',rec);st.textContent='العب تاني';st.disabled=false;}
  st.addEventListener('click',()=>{score=0;left=60;sEl.textContent=0;tEl.textContent=60;setMsg('gbMsg','');st.disabled=true;
    timer=setInterval(()=>{left--;tEl.textContent=left;if(left<=0)end();},1000);next();});
}

/* ===== Basics tab ===== */
function basicsTools(){
  const sup=e=>`10<sup>${e<0?'−'+(-e):e}</sup>`;
  function sci(v){if(v===0)return'0';const e=Math.floor(Math.log10(Math.abs(v)));if(e>=-3&&e<6)return String(+v.toPrecision(6));const m=v/10**e;return `${+m.toPrecision(4)} × ${sup(e)}`;}
  const pv=document.getElementById('pxVal');
  if(pv){const pf=document.getElementById('pxFrom'),pu=document.getElementById('pxUnit'),po=document.getElementById('pxOut');
    const up=()=>{const v=toNum(pv.value),e=+pf.value,u=pu.value;if(Number.isNaN(v)){po.textContent='—';return;}
      const base=v*10**e;
      if(u==='g'){po.innerHTML=`${sci(base)} g = ${sci(base/1000)} kg`;}else po.innerHTML=`${sci(base)} ${u}`;};
    [pv,pf,pu].forEach(el=>el.addEventListener('input',up));up();}
  const k=document.getElementById('cvKmh'),ms=document.getElementById('cvMs');
  if(k){k.addEventListener('input',()=>{const v=toNum(k.value);if(!Number.isNaN(v))ms.value=String(+(v/3.6).toFixed(3));});
    ms.addEventListener('input',()=>{const v=toNum(ms.value);if(!Number.isNaN(v))k.value=String(+(v*3.6).toFixed(3));});}
  const c=document.getElementById('trCanvas'),ta=document.getElementById('trA'),tb=document.getElementById('trB');
  if(c){
    const draw=()=>{if(c.offsetWidth<40)return;const a=toNum(ta.value),b=toNum(tb.value);const {x,w,h}=hi(c);gridBg(x,w,h,30,C.grid,C.navyDeep);
      const okv=a>0&&b>0;document.getElementById('trC').textContent=okv?`${f(Math.hypot(a,b),2)}`:'—';document.getElementById('trT').textContent=okv?`${f(deg(Math.atan2(b,a)),1)}°`:'—';
      if(!okv){label(x,'اكتب أرقام أكبر من صفر',w/2,h/2,C.sky,AR(700,15),'center');return;}
      const s=Math.min((w-120)/a,(h-50)/b),ox=(w-a*s)/2,oy=h-22;
      x.fillStyle='rgba(239,211,73,0.12)';x.beginPath();x.moveTo(ox,oy);x.lineTo(ox+a*s,oy);x.lineTo(ox+a*s,oy-b*s);x.closePath();x.fill();
      x.lineWidth=3;x.strokeStyle=C.sky;x.beginPath();x.moveTo(ox,oy);x.lineTo(ox+a*s,oy);x.lineTo(ox+a*s,oy-b*s);x.stroke();
      x.strokeStyle=C.yellow;x.beginPath();x.moveTo(ox,oy);x.lineTo(ox+a*s,oy-b*s);x.stroke();
      x.strokeStyle=C.white;x.lineWidth=1.5;x.strokeRect(ox+a*s-12,oy-12,12,12);
      const th=Math.atan2(b,a);x.beginPath();x.arc(ox,oy,30,-th,0);x.stroke();
      label(x,'θ',ox+42*Math.cos(th/2),oy-42*Math.sin(th/2),C.white,LAT(700,14),'center',false);
      label(x,`a = ${+a.toFixed(2)}`,ox+a*s/2,oy+12,C.sky,LAT(700,13),'center',false);
      label(x,`b = ${+b.toFixed(2)}`,ox+a*s+8,oy-b*s/2,C.sky,LAT(700,13),'left',false);
      label(x,`c = ${f(Math.hypot(a,b),2)}`,ox+a*s/2-14,oy-b*s/2-14,C.yellow,LAT(700,14),'right',false);
    };
    [ta,tb].forEach(el=>el.addEventListener('input',draw));onRedraw(c,draw);draw();
  }
  const gb=document.getElementById('glBody'),gq=document.getElementById('glQ');
  if(gb){
    const rows=(window.GLOSSARY||[]).map(([ar,en,mean])=>{const tr=document.createElement('tr');tr.innerHTML=`<td><b>${ar}</b></td><td>${en}</td><td>${mean}</td>`;tr._k=(ar+' '+en+' '+mean).toLowerCase();gb.appendChild(tr);return tr;});
    const strip=s=>s.toLowerCase().replace(/[ًٌٍَُِّْـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي');
    rows.forEach(r=>r._k=strip(r._k));
    gq.addEventListener('input',()=>{const q=strip(gq.value.trim());rows.forEach(r=>r.hidden=q&&!r._k.includes(q));});
  }
}
