/* ===== CoMnt physics lessons — shared engine ===== */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const C={navy:'#013869',navyDeep:'#012B52',blue:'#054D8D',sky:'#C9E6FF',yellow:'#EFD349',white:'#FFFFFF',mint:'#58D696',coral:'#FF7078',orange:'#FF9F1C',red:'#D82B35',green:'#2C9B5E',leaf:'#7BB526',leafDark:'#347403',gray:'#EAECED',grid:'rgba(201,230,255,0.08)'};
const AR=(w,s)=>`${w} ${s}px "IBM Plex Sans Arabic","DM Sans",sans-serif`;
const LAT=(w,s)=>`${w} ${s}px "DM Sans","IBM Plex Sans Arabic",sans-serif`;
const RM=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const f=(v,d=1)=>(Math.round(v*10**d)/10**d).toFixed(d);
const rad=d=>d*Math.PI/180, deg=r=>r*180/Math.PI;

/* Accept English or Arabic-Indic digits and Arabic decimal separators */
function toNum(s){
  s=String(s||'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٫,،]/g,'.').replace(/[^\d.\-−]/g,'').replace('−','-');
  const v=parseFloat(s); return Number.isFinite(v)?v:NaN;
}
const near=(v,a,tol=0.03)=>Math.abs(v-a)<=Math.max(Math.abs(a)*tol,0.051);

/* Crisp canvas at device pixel ratio */
function hi(c){
  const r=c.getBoundingClientRect(), d=Math.min(window.devicePixelRatio||1,2);
  const w=Math.max(1,Math.round(r.width)), h=Math.max(1,Math.round(r.height));
  if(c.width!==w*d||c.height!==h*d){c.width=w*d;c.height=h*d;}
  const x=c.getContext('2d'); x.setTransform(d,0,0,d,0,0); return {x,w,h};
}
function arrow(x,x1,y1,x2,y2,col,lw=3,head=10){
  const a=Math.atan2(y2-y1,x2-x1), L=Math.hypot(x2-x1,y2-y1); if(L<2)return;
  const hh=Math.min(head,L*0.45);
  x.save();x.strokeStyle=col;x.fillStyle=col;x.lineWidth=lw;x.lineCap='round';
  x.beginPath();x.moveTo(x1,y1);x.lineTo(x2-Math.cos(a)*hh*0.8,y2-Math.sin(a)*hh*0.8);x.stroke();
  x.beginPath();x.moveTo(x2,y2);x.lineTo(x2-hh*Math.cos(a-0.42),y2-hh*Math.sin(a-0.42));x.lineTo(x2-hh*Math.cos(a+0.42),y2-hh*Math.sin(a+0.42));x.closePath();x.fill();
  x.restore();
}
function label(x,t,px,py,col,font,align='center',rtl=true){
  x.save();x.font=font;x.fillStyle=col;x.textAlign=align;x.textBaseline='middle';x.direction=rtl?'rtl':'ltr';x.fillText(t,px,py);x.restore();
}
function pill(x,t,px,py,bg,fg,font){
  x.save();x.font=font;const w=x.measureText(t).width+16;x.fillStyle=bg;
  x.beginPath();x.roundRect?x.roundRect(px-w/2,py-12,w,24,12):x.rect(px-w/2,py-12,w,24);x.fill();
  x.fillStyle=fg;x.textAlign='center';x.textBaseline='middle';x.direction='rtl';x.fillText(t,px,py+1);x.restore();
}
function gridBg(x,w,h,step,col,bg){x.fillStyle=bg;x.fillRect(0,0,w,h);x.strokeStyle=col;x.lineWidth=1;x.beginPath();for(let i=step;i<w;i+=step){x.moveTo(i+.5,0);x.lineTo(i+.5,h);}for(let j=step;j<h;j+=step){x.moveTo(0,j+.5);x.lineTo(w,j+.5);}x.stroke();}

/* Registry so each sim redraws on resize / font load */
const redrawers=[];
function onRedraw(c,fn){redrawers.push(fn);if('ResizeObserver'in window){new ResizeObserver(()=>fn()).observe(c);}}
window.addEventListener('resize',()=>redrawers.forEach(fn=>fn()));
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>redrawers.forEach(fn=>fn()));
function visible(el,cb){if(!('IntersectionObserver'in window)){cb(true);return;}new IntersectionObserver(es=>es.forEach(e=>cb(e.isIntersecting)),{rootMargin:'100px'}).observe(el);}

/* Typed number box next to every slider: type a value or drag, both stay in sync */
const unitOf=t=>String(t).replace(/^[+\-−]?[\d.]+\s*/,'');
function mkNum(out,label){
  const box=document.createElement('span');box.className='valbox';
  const num=document.createElement('input');num.type='text';num.inputMode='decimal';num.className='numin';num.setAttribute('aria-label',label||'القيمة');
  out.parentNode.insertBefore(box,out);box.appendChild(num);box.appendChild(out);return num;
}
function range(id,fmt,cb){
  const el=document.getElementById(id); if(!el)return null; const out=document.querySelector(`[data-out="${id}"]`);
  const lab=document.querySelector(`label[for="${id}"]`);
  const num=out?mkNum(out,lab?lab.textContent.trim():''):null;
  const show=()=>{if(num&&document.activeElement!==num)num.value=String(+(+el.value).toFixed(2));};
  const up=()=>{if(out)out.textContent=unitOf(fmt(+el.value));show();cb&&cb();};
  el.addEventListener('input',up);
  if(num){
    num.addEventListener('input',()=>{const v=toNum(num.value);if(Number.isNaN(v))return;const lo=+el.min,hi2=+el.max;if(v<lo||v>hi2){num.classList.add('bad');return;}num.classList.remove('bad');el.step='any';el.value=v;up();});
    num.addEventListener('change',()=>{let v=toNum(num.value);if(Number.isNaN(v))v=+el.value;v=Math.max(+el.min,Math.min(+el.max,v));num.classList.remove('bad');el.step='any';el.value=v;num.value=String(+v.toFixed(2));up();});
    num.title=`من ${el.min} لـ ${el.max}`;
  }
  up(); return el;
}
/* Typed seconds box for a 0..1 time scrubber */
function scrubBox(id,getT){
  const sl=document.getElementById(id),out=document.querySelector(`[data-out="${id}"]`);if(!sl||!out)return()=>{};
  const num=mkNum(out,'الزمن بالثانية');num.title='اكتب الزمن بالثانية';
  num.addEventListener('input',()=>{const v=toNum(num.value),T=getT();if(Number.isNaN(v)||T<=0)return;sl.value=Math.max(0,Math.min(1,v/T));sl.dispatchEvent(new Event('input'));});
  num.addEventListener('change',()=>{num.value=f(+sl.value*getT(),2);});
  return t=>{out.textContent='s';if(document.activeElement!==num)num.value=f(t,2);};
}

/* ===== Generic UI ===== */
function initPolls(root){
  $$('.poll',root).forEach(p=>{
    const btns=$$('.opt',p);
    btns.forEach((b,i)=>b.addEventListener('click',()=>{
      btns.forEach(x=>x.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');
      p.dataset.choice=i;$('.pollmsg',p).hidden=false;$('.pollrev',p).hidden=false;
    }));
    $('.pollrev',p).addEventListener('click',()=>{
      const r=$('.reveal',p);r.hidden=false;
      let v=$('.verdict',r); if(!v){v=document.createElement('div');v.className='verdict';v.style.marginBottom='4px';r.prepend(v);}
      const ok=+p.dataset.choice===+p.dataset.answer;
      v.innerHTML=ok?'<b class="mintc">توقعك كان صح!</b>':'<b class="coral">توقعك كان مختلف، ودي بالظبط فرصة نتعلم:</b>';
    });
  });
}
function initToggles(root){
  $$('[data-toggle]',root).forEach(b=>b.addEventListener('click',()=>{const t=document.getElementById(b.dataset.toggle);if(t)t.hidden=!t.hidden;}));
  $$('[data-copy]',root).forEach(b=>b.addEventListener('click',()=>{
    const t=document.getElementById(b.dataset.copy), msg=b.parentElement.querySelector('.copymsg');
    const done=ok=>{if(msg)msg.textContent=ok?'اتنسخ! الصقه في الكومنتات.':'حدد النص وانسخه بإيدك.';};
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t.value).then(()=>done(true),()=>{t.select();done(false);});}else{t.select();done(false);}
  }));
}
function initChecks(root){
  $$('.ansrow',root).forEach(row=>{
    const btn=$('.chk',row), fb=$('.fb',row); if(!btn)return;
    btn.addEventListener('click',()=>{
      let ok=false, empty=false;
      if(row.dataset.num!==undefined){const v=toNum($('input',row).value);empty=Number.isNaN(v);ok=!empty&&near(v,+row.dataset.num,+(row.dataset.tol||0.03));}
      else if(row.dataset.sel!==undefined){const v=$('select',row).value;empty=v==='';ok=v===row.dataset.sel;}
      fb.className='fb '+(empty?'':ok?'ok':'no');
      fb.textContent=empty?'اكتب إجابتك الأول':ok?'صح! كده إنت فهمتها':'مش مظبوطة، راجع خطواتك تاني';
    });
  });
}
function initStepper(stepsId,nextId,resetId){
  const steps=$$('.step',document.getElementById(stepsId)); let n=1;
  const show=()=>{steps.forEach((s,i)=>s.classList.toggle('hidden-step',i>=n));const b=document.getElementById(nextId);b.disabled=n>=steps.length;b.style.opacity=n>=steps.length?.5:1;};
  document.getElementById(nextId).addEventListener('click',()=>{n=Math.min(steps.length,n+1);show();});
  document.getElementById(resetId).addEventListener('click',()=>{n=1;show();});
  show();
}

/* ===== Scratch pad (pen / keyboard) ===== */
function makePad(holder){
  holder.innerHTML=`<div class="padtools"><span>القلم:</span>
    <button class="swatch" style="background:${C.navy}" aria-label="قلم كحلي" aria-pressed="true" data-c="${C.navy}"></button>
    <button class="swatch" style="background:${C.red}" aria-label="قلم أحمر" aria-pressed="false" data-c="${C.red}"></button>
    <button class="swatch" style="background:${C.green}" aria-label="قلم أخضر" aria-pressed="false" data-c="${C.green}"></button>
    <button class="btn small ghost" data-clear>امسح</button></div>
    <canvas aria-label="مساحة حل بالقلم"></canvas>
    <textarea placeholder="أو اكتب خطوات الحل هنا…" aria-label="خطوات الحل"></textarea>`;
  const c=$('canvas',holder); let ctx=null,col=C.navy,drawing=false,last=null;
  const size=()=>{const g=hi(c);ctx=g.x;ctx.lineCap='round';ctx.lineJoin='round';};
  requestAnimationFrame(size);
  const pos=e=>{const r=c.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};};
  c.addEventListener('pointerdown',e=>{if(!ctx)size();drawing=true;last=pos(e);c.setPointerCapture(e.pointerId);});
  c.addEventListener('pointermove',e=>{if(!drawing)return;const p=pos(e);ctx.strokeStyle=col;ctx.lineWidth=(e.pressure&&e.pointerType==='pen')?1.5+e.pressure*3:2.5;ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p;});
  ['pointerup','pointercancel','pointerleave'].forEach(t=>c.addEventListener(t,()=>{drawing=false;}));
  $$('.swatch',holder).forEach(s=>s.addEventListener('click',()=>{$$('.swatch',holder).forEach(z=>z.setAttribute('aria-pressed','false'));s.setAttribute('aria-pressed','true');col=s.dataset.c;}));
  $('[data-clear]',holder).addEventListener('click',()=>{const g=hi(c);g.x.clearRect(0,0,g.w,g.h);});
}

/* ===== Quiz engine (MCQ + typed numeric answers) ===== */
const FACES={};
function initQuiz(key,data,faces){
  const list=$(`[data-quiz="${key}"]`), sec=list.closest('section');
  const scoreEl=$('[data-score]',sec), faceEl=$('[data-face]',sec), end=$(`[data-end="${key}"]`);
  let state;
  function render(){
    state={done:0,right:0};list.innerHTML='';end.classList.remove('show');
    scoreEl.textContent=`0 / ${data.length}`; faceEl.src=faces.starry;
    data.forEach((q,i)=>{
      const card=document.createElement('div');card.className='qcard';
      const tag=q.type==='mcq'?'اختيار من متعدد':'اكتب الناتج';
      let body='';
      if(q.type==='mcq'){body=`<div class="choices" role="radiogroup">${q.opts.map((o,j)=>`<label class="choice"><input type="radio" name="${key}-${i}" value="${j}"><b class="ltr">${['أ','ب','ج','د'][j]})</b><span>${o}</span></label>`).join('')}</div>`;}
      else{body=`<div class="ansrow"><span>الناتج:</span><input type="text" inputmode="decimal" aria-label="الناتج"><span class="unit">${q.unit||''}</span></div>`;}
      card.innerHTML=`<div class="qtop"><span class="qn">${i+1}</span><div class="stack" style="gap:6px"><span class="qtype">${tag}</span><div>${q.q}</div></div></div>${body}
        <div class="btnrow"><button class="btn navy small" data-check>تحقق</button><button class="btn ghost small" data-pad>مساحة الحل</button><span class="fb"></span></div>
        <div class="pad" hidden></div><div class="ex" hidden></div>`;
      list.appendChild(card);
      const padH=$('.pad',card);
      $('[data-pad]',card).addEventListener('click',()=>{if(!padH.dataset.ready){makePad(padH);padH.dataset.ready=1;}padH.hidden=!padH.hidden;});
      $('[data-check]',card).addEventListener('click',()=>{
        if(card.dataset.locked)return;
        const fb=$('.fb',card);let ok,empty=false;
        if(q.type==='mcq'){const sel=$('input:checked',card);if(!sel){empty=true;}else{ok=+sel.value===q.a;
          $$('.choice',card).forEach((l,j)=>{if(j===q.a)l.classList.add('right');else if(j===+sel.value)l.classList.add('wrong');});}}
        else{const v=toNum($('input',card).value);if(Number.isNaN(v))empty=true;else ok=near(v,q.a,q.tol||0.03);}
        if(empty){fb.className='fb no';fb.textContent=q.type==='mcq'?'اختار إجابة الأول':'اكتب الناتج الأول';return;}
        card.dataset.locked=1;$$('input',card).forEach(el=>{if(!el.closest('.pad'))el.disabled=true;});
        card.classList.add(ok?'ok':'no');fb.className='fb '+(ok?'ok':'no');
        fb.textContent=ok?'صح!':`غلط. الإجابة الصحيحة: ${q.type==='mcq'?'('+['أ','ب','ج','د'][q.a]+')':(q.show||q.a)}`;
        const ex=$('.ex',card);ex.hidden=false;ex.innerHTML=`<b class="${ok?'okh':'noh'}">${ok?'كده إنت فهمتها!':'ولا يهمك، شوف الحل:'}</b> ${q.ex}`;
        state.done++;if(ok)state.right++;
        scoreEl.textContent=`${state.right} / ${data.length}`;faceEl.src=ok?faces.laugh:faces.sad;
        if(state.done===data.length){
          end.classList.add('show');const p=state.right/data.length;
          $('[data-endtitle]',end).textContent=p>=0.8?'برافو عليك!':p>=0.5?'شغل حلو، فاضل شوية':'محتاجين نراجع سوا';
          $('[data-endmsg]',end).innerHTML=`جبت <span class="m">${state.right} / ${data.length}</span>. ${p>=0.8?'إنت جاهز للدرس الجاي.':'ارجع لفخ الامتحان والمثال المحلول، وبعدين جرّب الكويز تاني.'}`;
        }
      });
    });
  }
  $(`[data-quiz-reset="${key}"]`).addEventListener('click',render);
  render();
}

/* ===== Lesson 1-1 sims ===== */
function penSim(){
  const c=document.getElementById('penCanvas'); if(!c)return;
  let vp=3,vq=4,t=0,run=false,t0=0;const T=4;const tb=document.getElementById('penTable');let n=0;
  range('penV',v=>`${f(v,1)} cm/s`,()=>{vp=+document.getElementById('penV').value;if(!run){t=0;draw();}});
  range('paperV',v=>`${f(v,1)} cm/s`,()=>{vq=+document.getElementById('paperV').value;if(!run){t=0;draw();}});
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c); gridBg(x,w,h,30,C.grid,C.navyDeep);
    const s=Math.min((w-110)/20,(h-90)/20), x0=Math.max(40,(w-20*s)/2), rY=52;
    const a=vp*t,b=vq*t;
    // paper (pulled down)
    const pTop=rY-12-20*s+b*s;
    x.fillStyle=C.white;x.fillRect(x0-18,Math.max(0,pTop),20*s+36,h+40);
    x.strokeStyle='rgba(5,77,141,0.10)';x.lineWidth=1;x.beginPath();
    for(let i=0;i<=20;i++){x.moveTo(x0+i*s+.5,pTop);x.lineTo(x0+i*s+.5,h);}
    for(let yy=pTop;yy<h;yy+=s)if(yy>0){x.moveTo(x0-18,yy+.5);x.lineTo(x0+20*s+18,yy+.5);}x.stroke();
    // ruler
    x.fillStyle='#E8D3A6';x.fillRect(x0-14,rY-40,20*s+28,26);x.fillStyle='#3B2A24';
    x.font=LAT(500,10);x.textAlign='center';x.textBaseline='middle';x.direction='ltr';
    for(let i=0;i<=20;i++){const tx=x0+i*s;x.fillRect(tx,rY-40,1,i%5===0?10:5);if(i%5===0)x.fillText(String(i),tx,rY-22);}
    // trace
    const sx=x0, sy=rY+b*s, px=x0+a*s;
    if(t>0){x.strokeStyle=C.navy;x.lineWidth=3;x.lineCap='round';x.beginPath();x.moveTo(sx,sy);x.lineTo(px,rY);x.stroke();}
    if(!run&&t>=T){
      x.setLineDash([6,5]);x.lineWidth=2;
      x.strokeStyle=C.blue;x.beginPath();x.moveTo(sx,sy);x.lineTo(px,sy);x.stroke();
      x.strokeStyle=C.green;x.beginPath();x.moveTo(px,sy);x.lineTo(px,rY);x.stroke();x.setLineDash([]);
      pill(x,`عبور a = ${f(a,1)} cm`,(sx+px)/2,sy+18,C.blue,C.white,AR(700,12));
      pill(x,`سحب b = ${f(b,1)} cm`,Math.min(px+70,w-70),(sy+rY)/2,C.green,C.white,AR(700,12));
      pill(x,`c = ${f(Math.hypot(a,b),1)} cm`,(sx+px)/2-30,(sy+rY)/2-10,C.yellow,C.navy,AR(700,12));
    }
    // pen
    x.save();x.translate(px,rY);x.fillStyle=C.navy;x.strokeStyle=C.white;x.lineWidth=1.5;
    x.beginPath();x.moveTo(0,0);x.lineTo(-5,-12);x.lineTo(-5,-44);x.lineTo(5,-44);x.lineTo(5,-12);x.closePath();x.fill();x.stroke();x.restore();
    // arrows
    if(run){arrow(x,px+14,rY-6,px+44,rY-6,C.yellow,3,8);arrow(x,x0+20*s+28,pTop+20,x0+20*s+28,pTop+52,C.sky,3,8);}

  }
  function loop(ts){if(!run)return;t=Math.min(T,(ts-t0)/1000);draw();if(t<T)requestAnimationFrame(loop);else{run=false;draw();record();}}
  function record(){
    const a=vp*T,b=vq*T,c2=Math.hypot(a,b),meas=Math.round((c2+(Math.random()-.5)*0.2)*10)/10;n++;
    const e=tb.querySelector('.empty');if(e)e.remove();
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${n}</td><td class="m">${f(a,1)}</td><td class="m">${f(b,1)}</td><td class="m coral">${f(a+b,1)}</td><td class="m">${f(meas,1)}</td><td class="m ylw">${f(c2,1)}</td>`;tb.appendChild(tr);
  }
  document.getElementById('penRun').addEventListener('click',()=>{if(run)return;run=true;t=0;t0=performance.now();requestAnimationFrame(loop);});
  document.getElementById('penClear').addEventListener('click',()=>{n=0;tb.innerHTML='<tr class="empty"><td colspan="6" class="muted">لسه مفيش محاولات. اضغط «ارسم».</td></tr>';});
  onRedraw(c,draw);draw();
}

function vecSim(){
  const c=document.getElementById('vecCanvas'); if(!c)return;
  let tip={x:4,y:3},drag=false,geo=null;
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);x.fillStyle=C.navyDeep;x.fillRect(0,0,w,h);
    const u=Math.min((w-90)/8,(h-70)/6), ox=50, oy=h-40; geo={u,ox,oy};
    x.strokeStyle='rgba(201,230,255,0.12)';x.lineWidth=1;x.beginPath();
    for(let i=0;i<=8;i++){x.moveTo(ox+i*u+.5,oy);x.lineTo(ox+i*u+.5,oy-6*u);}for(let j=0;j<=6;j++){x.moveTo(ox,oy-j*u+.5);x.lineTo(ox+8*u,oy-j*u+.5);}x.stroke();
    arrow(x,ox,oy,ox+8*u+18,oy,C.white,2,8);arrow(x,ox,oy,ox,oy-6*u-18,C.white,2,8);
    label(x,'x',ox+8*u+28,oy,C.white,LAT(700,14),'center',false);label(x,'y',ox,oy-6*u-28,C.white,LAT(700,14),'center',false);
    x.font=LAT(500,11);x.fillStyle=C.sky;x.textAlign='center';x.direction='ltr';for(let i=1;i<=8;i++)x.fillText(i,ox+i*u,oy+14);x.textAlign='right';for(let j=1;j<=6;j++)x.fillText(j,ox-8,oy-j*u+4);
    const tx=ox+tip.x*u, ty=oy-tip.y*u, v=Math.hypot(tip.x,tip.y), th=Math.atan2(tip.y,tip.x);
    arrow(x,ox,oy,tx,oy,C.sky,4,10);
    x.setLineDash([7,6]);arrow(x,tx,oy,tx,ty,C.mint,4,10);x.setLineDash([]);
    arrow(x,ox,oy,tx,ty,C.yellow,5,14);
    if(v>0.4){x.strokeStyle=C.white;x.lineWidth=1.5;x.beginPath();x.arc(ox,oy,Math.min(34,u*0.9),-th,0);x.stroke();
      label(x,'θ',ox+Math.min(46,u*1.2)*Math.cos(th/2),oy-Math.min(46,u*1.2)*Math.sin(th/2),C.white,LAT(700,14),'center',false);}
    label(x,'vx',(ox+tx)/2,oy-14,C.sky,LAT(700,14),'center',false);
    label(x,'vy',tx+22,(oy+ty)/2,C.mint,LAT(700,14),'center',false);
    label(x,'v',(ox+tx)/2-14,(oy+ty)/2-14,C.yellow,LAT(800,16),'center',false);
    x.fillStyle=C.yellow;x.beginPath();x.arc(tx,ty,9,0,Math.PI*2);x.fill();x.strokeStyle=C.navy;x.lineWidth=2;x.stroke();
    document.getElementById('vecV').textContent=`${f(v,2)} m/s`;
    document.getElementById('vecT').textContent=`${f(deg(th),1)}°`;
    document.getElementById('vecX').textContent=`${f(v,2)} cos ${f(deg(th),0)}° = ${f(tip.x,2)}`;
    document.getElementById('vecY').textContent=`${f(v,2)} sin ${f(deg(th),0)}° = ${f(tip.y,2)}`;
  }
  const setFrom=e=>{const r=c.getBoundingClientRect();let vx=(e.clientX-r.left-geo.ox)/geo.u,vy=(geo.oy-(e.clientY-r.top))/geo.u;
    tip={x:Math.max(0,Math.min(8,Math.round(vx*2)/2)),y:Math.max(0,Math.min(6,Math.round(vy*2)/2))};draw();};
  c.addEventListener('pointerdown',e=>{drag=true;c.setPointerCapture(e.pointerId);setFrom(e);});
  c.addEventListener('pointermove',e=>{if(drag)setFrom(e);});
  ['pointerup','pointercancel'].forEach(t=>c.addEventListener(t,()=>drag=false));
  c.tabIndex=0;c.addEventListener('keydown',e=>{const k={ArrowLeft:[-.5,0],ArrowRight:[.5,0],ArrowUp:[0,.5],ArrowDown:[0,-.5]}[e.key];if(!k)return;e.preventDefault();tip={x:Math.max(0,Math.min(8,tip.x+k[0])),y:Math.max(0,Math.min(6,tip.y+k[1]))};draw();});
  onRedraw(c,draw);draw();
}

function rainSim(){
  const c=document.getElementById('rainCanvas'); if(!c)return;
  let vr=6,vb=8,on=false,last=0,busX=0;
  const N=70, A=[],B=[];for(let i=0;i<N;i++){A.push({x:Math.random(),y:Math.random()});B.push({x:Math.random(),y:Math.random()});}
  const out=()=>{const rel=Math.hypot(vr,vb),th=deg(Math.atan2(vb,vr));
    document.getElementById('rainRel').textContent=`${f(rel,1)} m/s`;document.getElementById('rainAng').textContent=`${f(th,1)}°`;document.getElementById('rainTan').textContent=`${f(vb,1)} / ${f(vr,1)} = ${f(vb/vr,2)}`;};
  range('rainV',v=>`${f(v,1)} m/s`,()=>{vr=+document.getElementById('rainV').value;out();draw();});
  range('busV',v=>`${f(v,1)} m/s`,()=>{vb=+document.getElementById('busV').value;out();draw();});
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);x.fillStyle=C.navyDeep;x.fillRect(0,0,w,h);
    const pw=(w-14)/2, k=Math.min(pw,h)/320;
    // Right panel: ground frame
    const R=pw+14;
    x.save();x.beginPath();x.rect(R,0,pw,h);x.clip();x.fillStyle='#0B3F72';x.fillRect(R,0,pw,h);
    x.strokeStyle='rgba(201,230,255,0.7)';x.lineWidth=1.6;x.beginPath();
    const Lg=vr*3.2*k+4;A.forEach(d=>{const px=R+d.x*pw,py=d.y*h;x.moveTo(px,py);x.lineTo(px,py+Lg);});x.stroke();
    const bw=Math.min(150,pw*0.55),bh=bw*0.42,by=h-bh-18,bx=R+((busX%(pw+bw))+pw+bw)%(pw+bw)-bw;
    x.fillStyle=C.blue;x.strokeStyle=C.white;x.lineWidth=2;x.beginPath();x.roundRect?x.roundRect(bx,by,bw,bh,10):x.rect(bx,by,bw,bh);x.fill();x.stroke();
    x.fillStyle=C.sky;for(let i=0;i<3;i++)x.fillRect(bx+10+i*(bw-20)/3,by+8,(bw-20)/3-8,bh*0.42);
    x.fillStyle='#111';x.beginPath();x.arc(bx+bw*0.22,by+bh,7,0,7);x.arc(bx+bw*0.78,by+bh,7,0,7);x.fill();
    x.fillStyle=C.leafDark;x.fillRect(R,h-12,pw,12);
    if(vb>0)arrow(x,bx+bw/2-24,by-10,bx+bw/2+24,by-10,C.yellow,3,8);
    x.restore();pill(x,'من على الرصيف (إطار الأرض)',R+pw/2,18,C.sky,C.navy,AR(700,12));
    // Left panel: inside the bus
    x.save();x.beginPath();x.rect(0,0,pw,h);x.clip();x.fillStyle=C.blue;x.fillRect(0,0,pw,h);
    const m=26;x.fillStyle='#0B3F72';x.fillRect(m,m+14,pw-2*m,h-2*m-28);
    x.strokeStyle='rgba(201,230,255,0.85)';x.lineWidth=1.6;x.beginPath();
    const sp=Math.hypot(vr,vb)||1,L=sp*3.2*k+4,ux=-vb/sp,uy=vr/sp;
    B.forEach(d=>{const px=m+d.x*(pw-2*m),py=m+14+d.y*(h-2*m-28);x.moveTo(px,py);x.lineTo(px+ux*L,py+uy*L);});x.stroke();
    x.strokeStyle=C.white;x.lineWidth=5;x.strokeRect(m,m+14,pw-2*m,h-2*m-28);
    x.restore();pill(x,'من جوه الأتوبيس',pw/2,18,C.yellow,C.navy,AR(700,12));
    label(x,'حركة الأتوبيس',pw/2+30,h-12,C.white,AR(600,11),'center');arrow(x,pw/2-58,h-12,pw/2-22,h-12,C.yellow,3,7);
    if(vb>0){const th=Math.atan2(vb,vr);x.setLineDash([4,4]);x.strokeStyle=C.white;x.lineWidth=1.5;x.beginPath();x.moveTo(pw-60,50);x.lineTo(pw-60,110);x.stroke();x.setLineDash([]);
      arrow(x,pw-60,50,pw-60-60*Math.tan(th)*Math.cos(th),50+60*Math.cos(th)*1,C.coral,3,8);
      label(x,`θ = ${f(deg(th),0)}°`,pw-60,124,C.white,LAT(700,12),'center',false);}
  }
  function step(dt){
    const s=dt/1000, k=0.09;
    A.forEach(d=>{d.y+=vr*k*s;if(d.y>1)d.y-=1;});
    B.forEach(d=>{d.y+=vr*k*s;d.x-=vb*k*s*0.6;if(d.y>1)d.y-=1;if(d.x<0)d.x+=1;});
    busX+=vb*12*s;
  }
  function loop(ts){if(!on)return;const dt=Math.min(50,ts-(last||ts));last=ts;if(!RM)step(dt);draw();requestAnimationFrame(loop);}
  visible(c,v=>{if(v&&!on){on=true;last=0;requestAnimationFrame(loop);}else if(!v)on=false;});
  onRedraw(c,draw);out();draw();
}

function riverSim(){
  const c=document.getElementById('riverCanvas'); if(!c)return;
  let P={vb:4,vc:3,d:60,a:0},go=false,t0=0,tau=0,done=false,phase=0,on=false,last=0;
  const K=()=>{const a=rad(P.a),vy=P.vb*Math.cos(a),vx=P.vc+P.vb*Math.sin(a),t=P.d/vy;return{a,vy,vx,v:Math.hypot(vx,vy),t,x:vx*t};};
  const reset=()=>{go=false;tau=0;done=false;};
  const ids=['rvB','rvC','rvD','rvA'];
  range('rvB',v=>`${f(v,1)} m/s`,()=>{P.vb=+document.getElementById("rvB").value;reset();out();});
  range('rvC',v=>`${f(v,1)} m/s`,()=>{P.vc=+document.getElementById("rvC").value;reset();out();});
  range('rvD',v=>`${v} m`,()=>{P.d=+document.getElementById("rvD").value;reset();out();});
  range('rvA',v=>`${v>0?'+':''}${v}°`,()=>{P.a=+document.getElementById("rvA").value;reset();out();});
  function out(){const k=K();
    document.getElementById('rvVy').textContent=`${f(k.vy,2)} m/s`;document.getElementById('rvVx').textContent=`${f(k.vx,2)} m/s`;
    document.getElementById('rvV').textContent=`${f(k.v,2)} m/s`;document.getElementById('rvT').textContent=`${f(k.t,1)} s`;
    document.getElementById('rvX').textContent=`${f(k.x,1)} m`;draw();}
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c),k=K();
    const bank=26, avail=h-2*bank-10;
    let s=Math.min(avail/P.d,(w-100)/Math.max(Math.abs(k.x),0.001));
    const rH=P.d*s, top=(h-rH)/2;
    x.fillStyle=C.leafDark;x.fillRect(0,0,w,h);
    x.fillStyle=C.leaf;x.fillRect(0,top-8,w,8);x.fillRect(0,top+rH,w,8);
    x.fillStyle=C.blue;x.fillRect(0,top,w,rH);
    // flow lines
    x.strokeStyle='rgba(201,230,255,0.35)';x.lineWidth=2;x.lineCap='round';x.beginPath();
    const rows=Math.max(2,Math.floor(rH/26)),len=P.vc>0?10+P.vc*4:2;
    for(let r=0;r<rows;r++){const yy=top+(r+0.5)*rH/rows;for(let xx=-60;xx<w+60;xx+=70){const px=xx+((phase+r*23)%70);x.moveTo(px,yy);x.lineTo(px+len,yy);}}x.stroke();
    pill(x,'الضفة المقابلة',w-80,top-20>12?top-20:14,C.white,C.navy,AR(700,11));
    pill(x,'نقطة الانطلاق',w-80,Math.min(h-14,top+rH+20),C.white,C.navy,AR(700,11));
    let x0=w/2-k.x*s/2;x0=Math.max(40,Math.min(w-40,x0));
    const sy=top+rH, ex=x0+k.x*s;
    // target
    x.setLineDash([6,6]);x.strokeStyle='rgba(255,255,255,0.7)';x.lineWidth=2;x.beginPath();x.moveTo(x0,sy);x.lineTo(x0,top);x.stroke();
    x.strokeStyle=C.yellow;x.beginPath();x.moveTo(x0,sy);x.lineTo(ex,top);x.stroke();x.setLineDash([]);
    x.fillStyle=C.white;x.beginPath();x.arc(x0,top,6,0,7);x.fill();pill(x,'الهدف',x0,top+18,C.white,C.navy,AR(700,11));
    x.fillStyle=C.yellow;x.beginPath();x.arc(ex,top,7,0,7);x.fill();
    if(done){pill(x,'نقطة الرسو',ex,top+44,C.yellow,C.navy,AR(700,11));
      if(Math.abs(k.x)>0.5){x.strokeStyle=C.coral;x.lineWidth=3;x.beginPath();x.moveTo(x0,top-4);x.lineTo(ex,top-4);x.stroke();
        pill(x,`الانجراف = ${f(k.x,1)} m`,(x0+ex)/2,top+70>sy-10?top-22:top+70,C.coral,C.navy,AR(700,11));}}
    // boat
    const bx=x0+k.vx*tau*s, by=sy-k.vy*tau*s;
    x.save();x.translate(bx,by);x.rotate(k.a);
    x.fillStyle='#FFF6E8';x.strokeStyle=C.navy;x.lineWidth=2;x.beginPath();x.moveTo(0,-18);x.quadraticCurveTo(9,-6,8,14);x.lineTo(-8,14);x.quadraticCurveTo(-9,-6,0,-18);x.fill();x.stroke();
    x.fillStyle='#7B4B2A';x.fillRect(-4,-2,8,8);x.restore();
    // vectors (head-to-tail): heading + current = resultant
    const q=Math.min(14,Math.max(7,rH/18));
    const hx=bx+P.vb*Math.sin(k.a)*q, hy=by-P.vb*Math.cos(k.a)*q;
    arrow(x,bx,by,hx,hy,C.white,3,9);
    if(P.vc>0)arrow(x,hx,hy,hx+P.vc*q,hy,C.sky,3,9);
    arrow(x,bx,by,bx+k.vx*q,by-k.vy*q,C.yellow,4,11);
  }
  function loop(ts){
    if(!on)return;const dt=Math.min(50,ts-(last||ts));last=ts;
    if(!RM)phase=(phase+P.vc*dt*0.012+700)%70;
    if(go){const k=K();tau=Math.min(k.t,k.t*(ts-t0)/3500);if(tau>=k.t){go=false;done=true;}}
    draw();requestAnimationFrame(loop);
  }
  visible(c,v=>{if(v&&!on){on=true;last=0;requestAnimationFrame(loop);}else if(!v)on=false;});
  document.getElementById('rvGo').addEventListener('click',()=>{tau=0;done=false;go=true;t0=performance.now();if(RM){tau=K().t;go=false;done=true;draw();}});
  document.getElementById('rvZero').addEventListener('click',()=>{
    const el=document.getElementById('rvA');let a=P.vc<P.vb?-Math.round(deg(Math.asin(P.vc/P.vb))):-60;el.value=a;el.dispatchEvent(new Event('input'));});
  onRedraw(c,draw);out();
}

function planeSim(){
  const c=document.getElementById('planeCanvas'); if(!c)return;
  let w0=40,v0=220;
  range('plW',v=>`${v} km/h`,()=>{w0=+document.getElementById("plW").value;draw();});
  range('plV',v=>`${v} km/h`,()=>{v0=+document.getElementById("plV").value;draw();});
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);x.fillStyle=C.leaf;x.fillRect(0,0,w,h);
    const ry=h/2, rw=Math.min(90,h*0.42);
    x.fillStyle='#3E4A55';x.fillRect(0,ry-rw/2,w,rw);
    x.fillStyle=C.white;for(let i=0;i<w;i+=44)x.fillRect(i,ry-2,24,4);
    for(let j=0;j<6;j++)x.fillRect(w-46,ry-rw/2+8+j*(rw-16)/6,30,(rw-16)/6-5);
    const th=Math.asin(Math.min(1,w0/v0)), g=Math.sqrt(Math.max(0,v0*v0-w0*w0));
    const cx=w*0.36, k=Math.min(0.9,(w*0.5)/v0);
    // plane rotated into the wind (wind blows toward -y; nose turns toward +y)
    x.save();x.translate(cx,ry);x.rotate(th);x.fillStyle=C.white;x.strokeStyle=C.navy;x.lineWidth=2;
    x.beginPath();x.moveTo(38,0);x.quadraticCurveTo(30,-6,-30,-5);x.lineTo(-38,0);x.lineTo(-30,5);x.quadraticCurveTo(30,6,38,0);x.fill();x.stroke();
    x.beginPath();x.moveTo(6,-4);x.lineTo(-10,-38);x.lineTo(-18,-38);x.lineTo(-8,-4);x.moveTo(6,4);x.lineTo(-10,38);x.lineTo(-18,38);x.lineTo(-8,4);x.fill();x.stroke();
    x.beginPath();x.moveTo(-26,-3);x.lineTo(-34,-15);x.lineTo(-38,-15);x.lineTo(-34,-3);x.moveTo(-26,3);x.lineTo(-34,15);x.lineTo(-38,15);x.lineTo(-34,3);x.fill();x.stroke();x.restore();
    const ax=cx+v0*k*Math.cos(th), ay=ry+v0*k*Math.sin(th);
    arrow(x,cx,ry,ax,ay,C.navy,4,11);
    arrow(x,ax,ay,ax,ay-w0*k,C.red,4,11);
    arrow(x,cx,ry,cx+g*k,ry,C.yellow,4,11);
    pill(x,'سرعة الطائرة في الهواء',(cx+ax)/2+10,Math.min(h-14,(ry+ay)/2+30),C.navy,C.white,AR(700,11));
    pill(x,'الرياح',ax+34,ay-w0*k/2,C.red,C.white,AR(700,11));
    pill(x,'المحصلة: على طول المدرج',cx+g*k/2,ry-rw/2-14,C.yellow,C.navy,AR(700,11));
    for(let i=0;i<4;i++){arrow(x,w*0.82+i*14,h-10,w*0.82+i*14,h-34,'rgba(1,56,105,0.45)',2,6);}
    label(x,'اتجاه الرياح',w*0.82+20,h-46,C.navy,AR(700,11),'center');
    document.getElementById('plA').textContent=`${f(deg(th),1)}°`;document.getElementById('plG').textContent=`≈ ${f(g,0)} km/h`;
  }
  onRedraw(c,draw);draw();
}

/* ===== Lesson 1-2 sims ===== */
const G=9.8;
function coinSim(){
  const c=document.getElementById('coinCanvas'); if(!c)return;
  const H=0.8, T=Math.sqrt(2*H/G); let v0=1.5,t=0,run=false,t0=0,n=0,landed=false;const tb=document.getElementById('coinTable');
  range('coinF',v=>`${f(v,2)} m/s`,()=>{v0=+document.getElementById('coinF').value;if(!run){t=0;landed=false;draw();}});
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);gridBg(x,w,h,30,C.grid,C.navyDeep);
    const floor=h-28, s=Math.min((floor-40)/H,(w-240)/(3*T+0.05)), top=floor-H*s, edge=110, bx=w-120;
    // table
    x.fillStyle='#8A5A35';x.fillRect(20,top,edge-20,12);x.fillRect(34,top+12,12,floor-top-12);x.fillRect(edge-26,top+12,12,floor-top-12);
    x.fillStyle=C.leafDark;x.fillRect(0,floor,w,h-floor);
    // time lines every 0.1 s
    x.setLineDash([4,6]);x.strokeStyle='rgba(201,230,255,0.35)';x.lineWidth=1;
    for(let k=0;k*0.1<=T+1e-9;k++){const yy=top+0.5*G*(k*0.1)**2*s;x.beginPath();x.moveTo(edge,yy);x.lineTo(bx+30,yy);x.stroke();label(x,`t = ${f(k*0.1,1)} s`,bx+34,yy,C.sky,LAT(600,11),'left',false);}
    x.setLineDash([]);
    // strobe dots
    for(let k=0;k*0.1<=t+1e-9;k++){const tk=k*0.1,yy=top+0.5*G*tk*tk*s;
      x.fillStyle='rgba(255,112,120,0.55)';x.beginPath();x.arc(edge+v0*tk*s,yy,5,0,7);x.fill();
      x.fillStyle='rgba(201,230,255,0.55)';x.beginPath();x.arc(bx,yy,5,0,7);x.fill();}
    const ya=top+0.5*G*t*t*s;
    x.fillStyle=C.coral;x.beginPath();x.arc(edge+v0*t*s,ya-6,8,0,7);x.fill();
    x.fillStyle=C.sky;x.beginPath();x.arc(bx,ya-6,8,0,7);x.fill();
    pill(x,'العملة A: قُذفت أفقيًا',edge+90,top-22,C.coral,C.navy,AR(700,12));
    pill(x,'العملة B: أُسقطت رأسيًا',bx-30,top-22,C.sky,C.navy,AR(700,12));
    if(landed){pill(x,'طَق! (صوت واحد)',(edge+v0*T*s+bx)/2,floor-24,C.yellow,C.navy,AR(800,13));}
  }
  function loop(ts){if(!run)return;t=Math.min(T,(ts-t0)/1000/3);draw();if(t<T)requestAnimationFrame(loop);else{run=false;landed=true;draw();rec();}}
  function rec(){n++;const e=tb.querySelector('.empty');if(e)e.remove();const tr=document.createElement('tr');
    tr.innerHTML=`<td>${n}</td><td class="m">${f(v0,2)}</td><td class="m">${f(T,3)}</td><td class="m">${f(T,3)}</td><td class="m ylw">${f(v0*T,2)}</td><td class="mintc">واحد</td>`;tb.appendChild(tr);
    document.getElementById('coinSound').textContent='طَق! سمعت ارتطام واحد';}
  document.getElementById('coinGo').addEventListener('click',()=>{if(run)return;run=true;landed=false;t=0;t0=performance.now();document.getElementById('coinSound').textContent='';if(RM){t=T;run=false;landed=true;draw();rec();return;}requestAnimationFrame(loop);});
  document.getElementById('coinClear').addEventListener('click',()=>{n=0;tb.innerHTML='<tr class="empty"><td colspan="6" class="muted">لسه مفيش محاولات. اضغط «انقر المسطرة».</td></tr>';});
  onRedraw(c,draw);draw();
}

function labSim(){
  const c=document.getElementById('labCanvas'); if(!c)return;
  let H=19.6,v0=14.7,fr=1,run=false,t0=0;const tS=document.getElementById('labT');let setT=null;
  const TT=()=>Math.sqrt(2*H/G);
  const out=()=>{const T=TT(),t=fr*T,vy=G*t;
    if(!setT)setT=scrubBox('labT',TT);setT(t);
    document.getElementById('labTT').textContent=`${f(T,2)} s`;document.getElementById('labX').textContent=`${f(v0*T,1)} m`;
    document.getElementById('labVx').textContent=`${f(v0,1)} m/s`;document.getElementById('labVy').textContent=`${f(vy,1)} m/s`;
    document.getElementById('labVv').textContent=`${f(Math.hypot(v0,vy),1)} m/s`;draw();};
  range('labH',v=>`${f(v,1)} m`,()=>{H=+document.getElementById('labH').value;out();});
  range('labV',v=>`${f(v,1)} m/s`,()=>{v0=+document.getElementById('labV').value;out();});
  tS.addEventListener('input',()=>{fr=+tS.value;out();});
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);gridBg(x,w,h,30,C.grid,C.navyDeep);
    const T=TT(),X=v0*T, floor=h-30, bw=56, x0=30+bw, s=Math.min((floor-50)/H,(w-x0-60)/Math.max(X,1)), top=floor-H*s;
    x.fillStyle=C.leafDark;x.fillRect(0,floor,w,h-floor);
    x.fillStyle='#5B6B7A';x.fillRect(30,top,bw,floor-top);x.fillStyle=C.sky;for(let yy=top+10;yy<floor-14;yy+=22){x.fillRect(38,yy,14,12);x.fillRect(60,yy,14,12);}
    // full path
    x.setLineDash([5,6]);x.strokeStyle='rgba(239,211,73,0.5)';x.lineWidth=2;x.beginPath();
    for(let i=0;i<=60;i++){const tt=T*i/60;const px=x0+v0*tt*s,py=top+0.5*G*tt*tt*s;i?x.lineTo(px,py):x.moveTo(px,py);}x.stroke();x.setLineDash([]);
    // strobe
    for(let i=0;i<=8;i++){const tt=T*i/8;if(tt>fr*T+1e-9)break;x.fillStyle='rgba(255,112,120,0.4)';x.beginPath();x.arc(x0+v0*tt*s,top+0.5*G*tt*tt*s,5,0,7);x.fill();
      x.fillStyle='rgba(201,230,255,0.35)';x.beginPath();x.arc(x0+4,top+0.5*G*tt*tt*s,5,0,7);x.fill();}
    const t=fr*T,px=x0+v0*t*s,py=top+0.5*G*t*t*s,vy=G*t;
    x.setLineDash([3,4]);x.strokeStyle='rgba(255,255,255,0.4)';x.beginPath();x.moveTo(x0+4,py);x.lineTo(px,py);x.stroke();x.setLineDash([]);
    x.fillStyle=C.sky;x.beginPath();x.arc(x0+4,py,7,0,7);x.fill();
    x.fillStyle=C.coral;x.beginPath();x.arc(px,py,8,0,7);x.fill();
    const k=Math.min(6,120/Math.max(15,Math.hypot(v0,G*TT())));
    arrow(x,px,py,px+v0*k,py,C.sky,3,9);arrow(x,px+v0*k,py,px+v0*k,py+vy*k,C.mint,3,9);arrow(x,px,py,px+v0*k,py+vy*k,C.yellow,4,11);
    // dimension labels
    x.strokeStyle=C.white;x.lineWidth=1.5;x.beginPath();x.moveTo(x0,floor+12);x.lineTo(x0+X*s,floor+12);x.stroke();
    label(x,`x = ${f(X,1)} m`,x0+X*s/2,floor+21,C.white,LAT(700,12),'center',false);
    label(x,`y = ${f(H,1)} m`,x0+10,(top+floor)/2,C.white,LAT(700,12),'left',false);
    pill(x,`t = ${f(t,2)} s`,Math.min(w-50,px+40),Math.max(16,py-22),C.yellow,C.navy,LAT(700,12));
  }
  function loop(ts){if(!run)return;fr=Math.min(1,(ts-t0)/2500);tS.value=fr;out();if(fr<1)requestAnimationFrame(loop);else run=false;}
  document.getElementById('labGo').addEventListener('click',()=>{if(RM){fr=1;tS.value=1;out();return;}run=true;t0=performance.now();requestAnimationFrame(loop);});
  onRedraw(c,draw);out();
}

function dropGame(){
  const c=document.getElementById('dropCanvas'); if(!c)return;
  let V=60,Hh=80,run=false,px=0,last=0,bag=null,hint=false,hits=0,tries=0,res=null;const WM=700,TX=560,SP=3;
  const msg=document.getElementById('dropMsg'),btn=document.getElementById('dropBtn');
  const tf=()=>Math.sqrt(2*Hh/G);
  const out=()=>{document.getElementById('dropT').textContent=`${f(tf(),2)} s`;document.getElementById('dropX').textContent=`${f(V*tf(),0)} m`;draw();};
  range('dropV',v=>`${v} m/s`,()=>{V=+document.getElementById('dropV').value;out();});
  range('dropH',v=>`${v} m`,()=>{Hh=+document.getElementById('dropH').value;out();});
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);x.fillStyle=C.sky;x.fillRect(0,0,w,h);
    const s=Math.min(w/WM,(h-60)/170), ox=(w-WM*s)/2, ground=h-30, py=ground-Hh*s;
    x.fillStyle=C.leaf;x.fillRect(0,ground,w,h-ground);
    const tx=ox+TX*s;[18,12,6].forEach((r,i)=>{x.fillStyle=i%2?C.white:C.red;x.beginPath();x.ellipse(tx,ground+4,r*1.8,r*0.6,0,0,7);x.fill();});
    pill(x,'الهدف',tx,ground+18,C.red,C.white,AR(700,11));
    if(hint){const dx=tx-V*tf()*s;x.setLineDash([6,5]);x.strokeStyle=C.navy;x.lineWidth=2;x.beginPath();x.moveTo(dx,py+10);x.lineTo(dx,ground);x.stroke();x.setLineDash([]);
      pill(x,`أسقط هنا (${f(V*tf(),0)} m قبل الهدف)`,Math.max(90,dx),py-28,C.navy,C.white,AR(700,11));}
    // bag
    if(bag){x.fillStyle='#8A5A35';x.fillRect(ox+bag.x*s-6,ground-bag.y*s-8,12,14);
      if(bag.trail){x.fillStyle='rgba(1,56,105,0.35)';bag.trail.forEach(p=>{x.beginPath();x.arc(ox+p[0]*s,ground-p[1]*s,3,0,7);x.fill();});}}
    // plane
    const pxx=ox+px*s;x.save();x.translate(pxx,py);x.fillStyle=C.white;x.strokeStyle=C.navy;x.lineWidth=2;
    x.beginPath();x.moveTo(30,0);x.quadraticCurveTo(26,-9,-24,-8);x.lineTo(-34,-20);x.lineTo(-40,-20);x.lineTo(-36,-4);x.lineTo(-30,2);x.quadraticCurveTo(10,8,30,0);x.fill();x.stroke();
    x.fillStyle=C.navy;x.fillRect(-6,-2,22,4);x.restore();
    x.strokeStyle='rgba(1,56,105,0.3)';x.setLineDash([3,5]);x.beginPath();x.moveTo(0,py);x.lineTo(w,py);x.stroke();x.setLineDash([]);
    label(x,`${Hh} m`,ox+8,(py+ground)/2,C.navy,LAT(700,12),'left',false);
    if(res)pill(x,res,w/2,22,res.startsWith('إصابة')?C.green:C.red,C.white,AR(800,13));
  }
  function loop(ts){
    const dt=Math.min(50,ts-(last||ts))/1000*SP;last=ts;
    if(run){px+=V*dt;if(px>WM+40&&!bag){run=false;btn.disabled=true;if(!res){res='فاتتك اللحظة! جرّب تاني';tries++;score();}}}
    if(bag&&!bag.done){bag.t+=dt;bag.x=bag.x0+V*bag.t;bag.y=Hh-0.5*G*bag.t*bag.t;if((bag.trail.length===0)||bag.t-bag.lt>0.4){bag.trail.push([bag.x,bag.y]);bag.lt=bag.t;}
      if(bag.y<=0){bag.y=0;bag.done=true;const d=bag.x-TX;tries++;
        if(Math.abs(d)<=15){hits++;res=`إصابة! على بعد ${f(Math.abs(d),0)} m من المركز`;}else{res=d<0?`قبل الهدف بـ ${f(-d,0)} m: أسقطت بدري`:`بعد الهدف بـ ${f(d,0)} m: أسقطت متأخر`;}
        score();}}
    draw();if(run||(bag&&!bag.done))requestAnimationFrame(loop);
  }
  const score=()=>{document.getElementById('dropScore').textContent=`${hits} / ${tries}`;};
  document.getElementById('dropStart').addEventListener('click',()=>{px=-40;bag=null;res=null;run=true;last=0;btn.disabled=false;msg.textContent='';requestAnimationFrame(loop);});
  btn.addEventListener('click',()=>{if(!run||bag)return;bag={x0:px,x:px,y:Hh,t:0,lt:0,trail:[],done:false};btn.disabled=true;});
  document.getElementById('dropHint').addEventListener('click',()=>{hint=!hint;draw();});
  onRedraw(c,draw);out();
}

/* ===== Lesson 1-3 sims ===== */
function frameSim(){
  const c=document.getElementById('frameCanvas'); if(!c)return;
  const V=7, N=16; let th=45,n=8,play=null,frNum=null;
  const nS=document.getElementById('frN');
  const P=k=>{const a=rad(th),T=2*V*Math.sin(a)/G,t=T*k/N;return{x:V*Math.cos(a)*t,y:V*Math.sin(a)*t-0.5*G*t*t,T};};
  function out(){
    const p=P(n),q=n>0?P(n-1):null;
    if(!frNum){frNum=mkNum(document.querySelector('[data-out="frN"]'),'رقم الكادر');frNum.addEventListener('input',()=>{const v=Math.round(toNum(frNum.value));if(Number.isNaN(v)||v<0||v>N)return;n=v;nS.value=v;out();});}
    document.querySelector('[data-out="frN"]').textContent=`/ ${N}`;if(document.activeElement!==frNum)frNum.value=n;
    if(!q){['frDx','frDy'].forEach(i=>document.getElementById(i).textContent='—');document.getElementById('frDir').textContent='لحظة الإطلاق';}
    else{const dx=(p.x-q.x)*100,dy=(p.y-q.y)*100;document.getElementById('frDx').textContent=`${f(dx,1)} cm`;
      document.getElementById('frDy').textContent=`${dy>0?'+':''}${f(dy,1)} cm`;
      document.getElementById('frDir').textContent=Math.abs(dy)<1?'عند القمة تقريبًا':dy>0?'طالعة ↑':'نازلة ↓';}
    draw();
  }
  range('frAng',v=>`${v}°`,()=>{th=+document.getElementById('frAng').value;out();});
  nS.addEventListener('input',()=>{n=+nS.value;out();});
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);gridBg(x,w,h,30,C.grid,C.navyDeep);
    const a=rad(th),R=V*V*Math.sin(2*a)/G,H=(V*Math.sin(a))**2/(2*G);
    const floor=h-26,s=Math.min((w-80)/(V*V/G),(floor-50)/(V*V/(2*G))*0.95),ox=(w-R*s)/2;
    x.fillStyle=C.leafDark;x.fillRect(0,floor,w,h-floor);
    // door under apex
    const dx=ox+R*s/2,dh=Math.min(H*s*0.75,floor-60),dw=Math.min(90,R*s*0.25);
    x.strokeStyle='#8A5A35';x.lineWidth=8;x.beginPath();x.moveTo(dx-dw/2,floor);x.lineTo(dx-dw/2,floor-dh);x.lineTo(dx+dw/2,floor-dh);x.lineTo(dx+dw/2,floor);x.stroke();
    for(let k=0;k<=N;k++){const p=P(k),px=ox+p.x*s,py=floor-p.y*s;
      x.fillStyle=k<=n?'rgba(255,255,255,0.85)':'rgba(255,255,255,0.18)';x.beginPath();x.arc(px,py,k===n?9:6,0,7);x.fill();}
    const p=P(n),px=ox+p.x*s,py=floor-p.y*s;
    x.fillStyle=C.yellow;x.beginPath();x.arc(px,py,9,0,7);x.fill();
    if(n>0){const q=P(n-1),qx=ox+q.x*s,qy=floor-q.y*s;
      x.strokeStyle=C.sky;x.lineWidth=3;x.beginPath();x.moveTo(qx,Math.min(qy,py)-22);x.lineTo(px,Math.min(qy,py)-22);x.stroke();
      label(x,'أفقي',(qx+px)/2,Math.min(qy,py)-34,C.sky,AR(700,11),'center');
      x.strokeStyle=C.mint;x.beginPath();x.moveTo(px+18,qy);x.lineTo(px+18,py);x.stroke();
      if(Math.abs(py-qy)>3)label(x,'رأسي',px+42,(qy+py)/2,C.mint,AR(700,11),'center');}
    label(x,`θ ≈ ${th}°`,ox+40,floor-12,C.white,LAT(700,12),'center',false);
    pill(x,'حافة الباب ثابتة',dx,floor-dh-16,C.white,C.navy,AR(700,11));
  }
  document.getElementById('frPrev').addEventListener('click',()=>{n=Math.max(0,n-1);nS.value=n;out();});
  document.getElementById('frNext').addEventListener('click',()=>{n=Math.min(N,n+1);nS.value=n;out();});
  document.getElementById('frPlay').addEventListener('click',()=>{clearInterval(play);n=0;nS.value=0;out();play=setInterval(()=>{n++;nS.value=n;out();if(n>=N)clearInterval(play);},RM?60:380);});
  onRedraw(c,draw);out();
}

function angSim(){
  const c=document.getElementById('angCanvas'),rc=document.getElementById('rangeCanvas'); if(!c)return;
  let v0=19.6,th=30,fr=0.5,comp=false,run=false,t0=0,setS=null;const sS=document.getElementById('angS');
  const K=(t=th)=>{const a=rad(t),vy=v0*Math.sin(a),tt=vy/G,T=2*tt;return{a,vx:v0*Math.cos(a),vy,tt,T,H:vy*vy/(2*G),R:v0*Math.cos(a)*T};};
  function out(){const k=K(),t=fr*k.T,vy=k.vy-G*t;
    if(!setS)setS=scrubBox('angS',()=>K().T);setS(t);
    document.getElementById('angTt').textContent=`${f(k.tt,2)} s`;document.getElementById('angTT').textContent=`${f(k.T,2)} s`;
    document.getElementById('angH').textContent=`${f(k.H,2)} m`;document.getElementById('angR').textContent=`${f(k.R,1)} m`;
    document.getElementById('angVx').textContent=`${f(k.vx,1)} m/s`;document.getElementById('angVy').textContent=`${f(vy,1)} m/s`;draw();drawR();}
  range('angV',v=>`${f(v,1)} m/s`,()=>{v0=+document.getElementById('angV').value;out();});
  range('angT',v=>`${v}°`,()=>{th=+document.getElementById('angT').value;out();});
  sS.addEventListener('input',()=>{fr=+sS.value;out();});
  function path(x,k,ox,floor,s,col){x.setLineDash([5,6]);x.strokeStyle=col;x.lineWidth=2;x.beginPath();for(let i=0;i<=80;i++){const t=k.T*i/80;const px=ox+k.vx*t*s,py=floor-(k.vy*t-0.5*G*t*t)*s;i?x.lineTo(px,py):x.moveTo(px,py);}x.stroke();x.setLineDash([]);}
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);gridBg(x,w,h,30,C.grid,C.navyDeep);
    const k=K(),floor=h-30,ox=40,s=Math.min((w-80)/(v0*v0/G),(floor-40)/(v0*v0/(2*G)));
    x.fillStyle=C.leafDark;x.fillRect(0,floor,w,h-floor);
    if(comp)path(x,K(90-th),ox,floor,s,'rgba(201,230,255,0.7)');
    path(x,k,ox,floor,s,'rgba(239,211,73,0.75)');
    // H marker
    const ax=ox+k.vx*k.tt*s,ay=floor-k.H*s;
    x.setLineDash([3,4]);x.strokeStyle='rgba(255,255,255,0.45)';x.beginPath();x.moveTo(ax,ay);x.lineTo(ax,floor);x.stroke();x.setLineDash([]);
    label(x,`H = ${f(k.H,1)} m`,ax+8,(ay+floor)/2,C.white,LAT(700,12),'left',false);
    x.strokeStyle=C.white;x.lineWidth=1.5;x.beginPath();x.moveTo(ox,floor+12);x.lineTo(ox+k.R*s,floor+12);x.stroke();
    label(x,`R = ${f(k.R,1)} m`,ox+k.R*s/2,floor+21,C.white,LAT(700,12),'center',false);
    // cannon
    x.save();x.translate(ox,floor);x.rotate(-k.a);x.fillStyle=C.gray;x.fillRect(-4,-7,34,14);x.restore();
    x.fillStyle='#5B6B7A';x.beginPath();x.arc(ox,floor,12,Math.PI,0);x.fill();
    // ball + vectors
    const t=fr*k.T,px=ox+k.vx*t*s,py=floor-(k.vy*t-0.5*G*t*t)*s,vy=k.vy-G*t,q=Math.min(5,110/Math.max(10,v0));
    arrow(x,px,py,px+k.vx*q,py,C.sky,3,9);
    if(Math.abs(vy)>0.05)arrow(x,px+k.vx*q,py,px+k.vx*q,py-vy*q,C.mint,3,9);
    arrow(x,px,py,px+k.vx*q,py-vy*q,C.yellow,4,11);
    x.fillStyle=C.coral;x.beginPath();x.arc(px,py,8,0,7);x.fill();
    if(Math.abs(fr-0.5)<0.006)pill(x,'vy = 0 هنا… بس vx لسه شغالة!',Math.min(w-120,Math.max(120,px)),Math.max(16,py-30),C.yellow,C.navy,AR(700,12));
    if(comp){const kc=K(90-th);label(x,`${90-th}°: R = ${f(kc.R,1)} m`,w-20,22,C.sky,LAT(700,12),'right',false);}
  }
  function drawR(){if(rc.offsetWidth<40)return;
    const {x,w,h}=hi(rc);x.fillStyle=C.navyDeep;x.fillRect(0,0,w,h);
    const L=40,B=h-24,Rm=v0*v0/G,X=d=>L+(w-L-16)*d/90,Y=r=>B-(B-14)*r/Rm;
    x.strokeStyle='rgba(201,230,255,0.25)';x.lineWidth=1;x.beginPath();x.moveTo(L,B);x.lineTo(w-10,B);x.moveTo(L,B);x.lineTo(L,8);x.stroke();
    x.font=LAT(500,11);x.fillStyle=C.sky;x.textAlign='center';x.direction='ltr';for(let d=0;d<=90;d+=15)x.fillText(d+'°',X(d),B+15);
    x.textAlign='right';x.fillText(f(Rm,0)+' m',L-4,Y(Rm)+4);x.fillText('0',L-4,B);
    x.strokeStyle=C.yellow;x.lineWidth=2.5;x.beginPath();for(let d=0;d<=90;d++){const r=v0*v0*Math.sin(2*rad(d))/G;d?x.lineTo(X(d),Y(r)):x.moveTo(X(d),Y(r));}x.stroke();
    const r=K().R;x.fillStyle=C.yellow;x.beginPath();x.arc(X(th),Y(r),6,0,7);x.fill();
    x.strokeStyle=C.sky;x.lineWidth=2;x.beginPath();x.arc(X(90-th),Y(r),6,0,7);x.stroke();
    x.setLineDash([3,4]);x.strokeStyle='rgba(255,255,255,0.4)';x.beginPath();x.moveTo(X(th),Y(r));x.lineTo(X(90-th),Y(r));x.stroke();x.setLineDash([]);
  }
  function loop(ts){if(!run)return;fr=Math.min(1,(ts-t0)/3000);sS.value=fr;out();if(fr<1)requestAnimationFrame(loop);else run=false;}
  document.getElementById('angGo').addEventListener('click',()=>{if(RM){fr=1;sS.value=1;out();return;}run=true;t0=performance.now();requestAnimationFrame(loop);});
  document.getElementById('angTop').addEventListener('click',()=>{run=false;fr=0.5;sS.value=0.5;out();});
  const cb=document.getElementById('angComp');cb.addEventListener('click',()=>{comp=!comp;cb.setAttribute('aria-pressed',comp);cb.textContent=comp?'اخفي الزاوية المتممة':'قارن بالزاوية المتممة';out();});
  onRedraw(c,draw);onRedraw(rc,drawR);out();
}

function fireworks(){
  const c=document.getElementById('fwCanvas'); if(!c)return;
  let V=15,run=false,t0=0,tau=-1,ghost=true;const N=36,WH=80,TS=0.5;
  range('fwV',v=>`${v} m/s`,()=>{V=+document.getElementById('fwV').value;if(!run)draw();});
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);x.fillStyle='#071B33';x.fillRect(0,0,w,h);
    const s=h/WH,cx=w/2,cy=h*0.3;
    x.fillStyle='#0B2747';for(let i=0;i<w;i+=38){const bh=20+((i*37)%55);x.fillRect(i,h-bh,32,bh);}
    if(tau<0){label(x,'دوس «فرقع»',cx,cy,C.sky,AR(700,16),'center');return;}
    const drop=0.5*G*tau*tau*s;
    if(ghost){x.setLineDash([5,6]);x.strokeStyle='rgba(201,230,255,0.6)';x.lineWidth=1.5;x.beginPath();x.arc(cx,cy+drop,Math.max(1,V*tau*s),0,7);x.stroke();x.setLineDash([]);
      x.fillStyle=C.sky;x.beginPath();x.arc(cx,cy+drop,4,0,7);x.fill();}
    for(let i=0;i<N;i++){const a=2*Math.PI*i/N,ux=Math.cos(a)*V,uy=Math.sin(a)*V;
      x.strokeStyle='rgba(239,211,73,0.35)';x.lineWidth=1.5;x.beginPath();
      for(let j=0;j<=12;j++){const tt=tau*j/12;const px=cx+ux*tt*s,py=cy+(uy*tt+0.5*G*tt*tt)*s;j?x.lineTo(px,py):x.moveTo(px,py);}x.stroke();
      const px=cx+ux*tau*s,py=cy+(uy*tau)*s+drop;x.fillStyle=i%3?C.yellow:C.coral;x.beginPath();x.arc(px,py,3.5,0,7);x.fill();}
    pill(x,`t = ${f(tau,1)} s`,60,20,C.yellow,C.navy,LAT(700,12));
  }
  function loop(ts){if(!run)return;tau=Math.min(3,(ts-t0)/1000*TS*2);draw();if(tau<3)requestAnimationFrame(loop);else run=false;}
  document.getElementById('fwGo').addEventListener('click',()=>{if(RM){tau=1.5;draw();return;}run=true;t0=performance.now();requestAnimationFrame(loop);});
  const gb=document.getElementById('fwGhost');gb.addEventListener('click',()=>{ghost=!ghost;gb.setAttribute('aria-pressed',ghost);gb.textContent=ghost?'اخفي الدايرة':'بيّن الدايرة';draw();});
  gb.textContent='اخفي الدايرة';
  onRedraw(c,draw);draw();
}

/* ===== Lesson 1-4 sims ===== */
function coin(x,cx,cy,r){x.fillStyle='#C9CDD2';x.strokeStyle='#6B7480';x.lineWidth=1.5;x.beginPath();x.ellipse(cx,cy,r,r*0.32,0,0,7);x.fill();x.stroke();}
function balSim(){
  const c=document.getElementById('balCanvas'); if(!c)return;
  let n=3,d1=4,d2=10,ang=0,on=false,last=0;const tb=document.getElementById('balTable');let k=0;
  const net=()=>d2-n*d1; // positive -> right side heavier (clockwise)
  const msg=()=>{const m=document.getElementById('balMsg');const t=net();m.textContent=t===0?'متزنة!':t>0?'المسطرة مايلة ناحية اليمين':'المسطرة مايلة ناحية الشمال';m.style.color=t===0?'var(--pen-check)':'var(--pen-warn)';};
  range('balN',v=>`${v}`,()=>{n=+document.getElementById('balN').value;msg();});
  range('balD1',v=>`${v} cm`,()=>{d1=+document.getElementById('balD1').value;msg();});
  range('balD2',v=>`${v} cm`,()=>{d2=+document.getElementById('balD2').value;msg();});
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);gridBg(x,w,h,30,C.grid,C.navyDeep);
    const cx=w/2,py=h*0.62,s=Math.min((w-60)/32,26);
    x.fillStyle='#8A5A35';x.fillRect(20,py+40,w-40,10);
    // pencil pivot
    x.fillStyle=C.yellow;x.beginPath();x.moveTo(cx,py+4);x.lineTo(cx-10,py+40);x.lineTo(cx+10,py+40);x.closePath();x.fill();
    x.save();x.translate(cx,py);x.rotate(ang);
    x.fillStyle='#E8D3A6';x.fillRect(-16*s,-8,32*s,12);x.fillStyle='#3B2A24';x.font=LAT(500,9);x.textAlign='center';x.direction='ltr';
    for(let i=-15;i<=15;i++){x.fillRect(i*s,-8,1,i%5===0?7:4);if(i%5===0)x.fillText(String(Math.abs(i)),i*s,12);}
    for(let i=0;i<n;i++)coin(x,-d1*s,-12-i*5,s*0.8);
    coin(x,d2*s,-12,s*0.8);
    x.restore();
    label(x,`n × d1 = ${n*d1}`,cx-8*s,30,C.sky,LAT(700,14),'center',false);
    label(x,`1 × d2 = ${d2}`,cx+8*s,30,C.sky,LAT(700,14),'center',false);
    if(net()===0)pill(x,'متزنة!',cx,58,C.mint,C.navy,AR(800,13));
  }
  function loop(ts){if(!on)return;const dt=Math.min(50,ts-(last||ts))/1000;last=ts;
    const target=Math.max(-0.2,Math.min(0.2,net()*0.02));ang+=(target-ang)*Math.min(1,dt*6);if(RM)ang=target;draw();requestAnimationFrame(loop);}
  visible(c,v=>{if(v&&!on){on=true;last=0;requestAnimationFrame(loop);}else if(!v)on=false;});
  document.getElementById('balRec').addEventListener('click',()=>{k++;const e=tb.querySelector('.empty');if(e)e.remove();const tr=document.createElement('tr');const ok=net()===0;
    tr.innerHTML=`<td>${k}</td><td class="m">${d1}</td><td class="m">${n}</td><td class="m">${d2}</td><td class="m ylw">${n*d1}</td><td class="m ylw">${d2}</td><td class="${ok?'mintc':'coral'}">${ok?'أيوه':'لأ'}</td>`;tb.appendChild(tr);});
  document.getElementById('balClear').addEventListener('click',()=>{k=0;tb.innerHTML='<tr class="empty"><td colspan="7" class="muted">لسه مفيش محاولات. لما المسطرة تتزن دوس «سجّل».</td></tr>';});
  onRedraw(c,draw);msg();draw();
}

function tqSim(){
  const c=document.getElementById('tqCanvas'); if(!c)return;
  let F=4,L=4,A=60;
  const out=()=>{const d=L*Math.sin(rad(A)),M=F*d;
    document.getElementById('tqD').textContent=`${f(Math.abs(d),2)} m`;
    document.getElementById('tqM').textContent=`${M>0.005?'+':''}${f(M,1)} N m`;
    document.getElementById('tqDir').textContent=Math.abs(M)<0.005?'مفيش لف (العزم صفر)':M>0?'عكس عقارب الساعة (+)':'مع عقارب الساعة (−)';draw();};
  range('tqF',v=>`${f(v,1)} N`,()=>{F=+document.getElementById('tqF').value;out();});
  range('tqL',v=>`${f(v,1)} m`,()=>{L=+document.getElementById('tqL').value;out();});
  range('tqA',v=>`${v}°`,()=>{A=+document.getElementById('tqA').value;out();});
  function draw(){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);gridBg(x,w,h,30,C.grid,C.navyDeep);
    const ox=70,oy=h/2,s=(w-140)/5;
    x.fillStyle='#5B6B7A';x.fillRect(ox,oy-7,5*s,14);
    x.fillStyle=C.white;x.beginPath();x.arc(ox,oy,9,0,7);x.fill();label(x,'O',ox-20,oy,C.white,LAT(800,15),'center',false);
    const px=ox+L*s,py=oy,a=rad(A),fl=Math.min(120,30+F*7),fx=Math.cos(a)*fl,fy=-Math.sin(a)*fl;
    // line of action
    x.setLineDash([6,6]);x.strokeStyle='rgba(255,255,255,0.55)';x.lineWidth=1.5;x.beginPath();x.moveTo(px-fx*6,py-fy*6);x.lineTo(px+fx*6,py+fy*6);x.stroke();x.setLineDash([]);
    // perpendicular from O to line of action
    const ux=Math.cos(a),uy=-Math.sin(a),t=(ox-px)*ux+(oy-py)*uy,fx0=px+ux*t,fy0=py+uy*t;
    if(Math.abs(Math.sin(a))>0.01){x.strokeStyle=C.mint;x.lineWidth=4;x.beginPath();x.moveTo(ox,oy);x.lineTo(fx0,fy0);x.stroke();
      label(x,'d',(ox+fx0)/2-12,(oy+fy0)/2,C.mint,LAT(800,16),'center',false);
      x.strokeStyle=C.mint;x.lineWidth=1.5;const q=10,nx=(ox-fx0),ny=(oy-fy0),nl=Math.hypot(nx,ny)||1;x.beginPath();
      x.moveTo(fx0+ux*q,fy0+uy*q);x.lineTo(fx0+ux*q+nx/nl*q,fy0+uy*q+ny/nl*q);x.lineTo(fx0+nx/nl*q,fy0+ny/nl*q);x.stroke();}
    arrow(x,px,py,px+fx,py+fy,C.yellow,5,13);
    label(x,`F = ${f(F,1)} N`,px+fx+(fx>=0?34:-34),py+fy,C.yellow,LAT(700,13),'center',false);
    label(x,`L = ${f(L,1)} m`,ox+L*s/2,oy+26,C.white,LAT(700,12),'center',false);
    if(Math.abs(A)>2&&Math.abs(A)<178){x.strokeStyle=C.white;x.lineWidth=1.5;x.beginPath();x.arc(px,py,26,0,-a,A>0);x.stroke();label(x,`θ = ${A}°`,px+44*Math.cos(a/2),py-44*Math.sin(a/2),C.white,LAT(700,12),'center',false);}
    const M=F*L*Math.sin(a);
    if(Math.abs(M)>0.01){x.strokeStyle=M>0?C.mint:C.coral;x.lineWidth=3;x.beginPath();x.arc(ox,oy,34,M>0?0.6:-0.6,M>0?-1.8:1.8,M>0);x.stroke();
      const ea=M>0?-1.8:1.8;arrow(x,ox+34*Math.cos(ea+(M>0?0.25:-0.25)),oy+34*Math.sin(ea+(M>0?0.25:-0.25)),ox+34*Math.cos(ea),oy+34*Math.sin(ea),M>0?C.mint:C.coral,3,9);}
  }
  onRedraw(c,draw);out();
}

function wrSim(){
  const c=document.getElementById('wrCanvas'); if(!c)return;
  const T=40;let d=0.2,F=100,clicked=false;
  const out=()=>{const M=F*d;document.getElementById('wrM').textContent=`${f(M,1)} N m`;document.getElementById('wrNeed').textContent=`${f(T/d,0)} N`;
    const st=document.getElementById('wrState');const was=clicked;clicked=M>=T-0.01;st.textContent=clicked?'تِك! وصلت للعزم':'لسه، شد أكتر';st.style.color=clicked?'var(--green)':'var(--red)';draw(!was&&clicked);};
  range('wrD',v=>`${f(v,2)} m`,()=>{d=+document.getElementById('wrD').value;out();});
  range('wrF',v=>`${v} N`,()=>{F=+document.getElementById('wrF').value;out();});
  function draw(flash){if(c.offsetWidth<40)return;
    const {x,w,h}=hi(c);x.fillStyle=C.sky;x.fillRect(0,0,w,h);
    const cx=90,cy=h/2,s=(w-200)/0.6;
    x.fillStyle='#3E4A55';x.beginPath();x.arc(cx,cy,60,0,7);x.fill();x.fillStyle='#9AA3AD';x.beginPath();x.arc(cx,cy,40,0,7);x.fill();
    x.fillStyle='#5B6B7A';for(let i=0;i<5;i++){const a=i*2*Math.PI/5;x.beginPath();x.arc(cx+24*Math.cos(a),cy+24*Math.sin(a),6,0,7);x.fill();}
    x.fillStyle=C.navy;x.fillRect(cx,cy-8,d*s,16);x.beginPath();x.arc(cx,cy,14,0,7);x.fill();
    x.fillStyle=C.red;x.fillRect(cx+d*s-30,cy-11,30,22);
    const fl=Math.min(90,F*0.3);arrow(x,cx+d*s-15,cy+12,cx+d*s-15,cy+12+fl,C.red,4,11);
    label(x,`F = ${F} N`,cx+d*s+30,cy+40,C.navy,LAT(700,13),'left',false);
    label(x,`d = ${f(d,2)} m`,cx+d*s/2,cy-24,C.navy,LAT(700,13),'center',false);
    const M=F*d,bw=w-260,bx=200,by=h-26;x.fillStyle='rgba(1,56,105,0.15)';x.fillRect(bx,by,bw,12);
    x.fillStyle=M>=T-0.01?C.green:C.orange;x.fillRect(bx,by,Math.min(1,M/80)*bw,12);
    x.fillStyle=C.navy;x.fillRect(bx+bw*T/80-1,by-6,3,24);label(x,'40 N m',bx+bw*T/80,by-14,C.navy,LAT(700,11),'center',false);
    if(M>=T-0.01)pill(x,'تِك!',w-60,30,C.green,C.white,AR(800,15));
  }
  onRedraw(c,()=>draw(false));out();
}

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
  range('grA',v=>`${v}°`,()=>{a=+document.getElementById('grA').value;if(!run){lastX=null;draw();}});
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
    if(!run&&lastX!==null){bx=lastX;by=WID;}
    const px=X(bx),py=Y(by);
    x.save();x.translate(px,py);x.rotate(rad(a));x.fillStyle=C.red;x.beginPath();x.moveTo(0,-16);x.lineTo(8,8);x.lineTo(-8,8);x.closePath();x.fill();x.restore();
    if(!run&&lastX===null){arrow(x,px,py,px+VB*Math.sin(rad(a))*9,py-VB*Math.cos(rad(a))*9,C.yellow,3,9);arrow(x,px,py,px+vc*9,py,C.sky,3,9);}
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
    target=ok?0:(net>0?0.12:-0.12)*Math.min(1,0.4+Math.abs(net)/(F1*d1));
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

/* ===== Navigation: tabs, active chip, progress ===== */
function initNav(){
  $$('.tab').forEach(t=>t.addEventListener('click',()=>{
    if(t.disabled)return;const n=t.dataset.tab;
    $$('.tab').forEach(z=>z.setAttribute('aria-selected',z===t?'true':'false'));
    $$('.lesson').forEach(l=>l.hidden=l.dataset.lesson!==n);
    $$('.chips').forEach(ch=>ch.hidden=ch.dataset.chips!==n);
    if(!t._silent){window.scrollTo({top:0,behavior:RM?'auto':'smooth'});try{history.replaceState(null,'','#tab-'+n);}catch(e){}}
    try{t.scrollIntoView({inline:'center',block:'nearest'});}catch(e){}
    redrawers.forEach(fn=>fn());
  }));
  /* Deep links: #tab-3 opens a tab, #l3-lab opens its lesson and scrolls there */
  const openHash=()=>{const h=decodeURIComponent(location.hash.slice(1));if(!h)return;
    let n=null,el=null;if(h.indexOf('tab-')===0)n=h.slice(4);else{el=document.getElementById(h);const l=el&&el.closest('.lesson');if(l)n=l.dataset.lesson;}
    const t=n&&$(`.tab[data-tab="${n}"]`);if(!t)return;t._silent=true;t.click();t._silent=false;
    if(el)setTimeout(()=>{const tb=document.querySelector('.topbar');window.scrollTo(0,el.getBoundingClientRect().top+scrollY-(tb?tb.offsetHeight:0)-10);},60);else window.scrollTo(0,0);};
  openHash();addEventListener('hashchange',openHash);
  $$('[data-next-lesson]').forEach(a=>a.addEventListener('click',e=>{const t=$(`.tab[data-tab="${a.dataset.nextLesson}"]`);if(t&&!t.disabled){e.preventDefault();t.click();}}));
  const prog=document.getElementById('prog');
  const onScroll=()=>{
    const H=document.documentElement.scrollHeight-innerHeight;prog.style.width=(H>0?scrollY/H*100:0)+'%';
    const ch=$$('.chips:not([hidden]) a');let cur=null;
    ch.forEach(a=>{const s=document.querySelector(a.getAttribute('href'));if(s&&s.getBoundingClientRect().top<180)cur=a;});
    ch.forEach(a=>a.classList.toggle('on',a===cur));
  };
  addEventListener('scroll',onScroll,{passive:true});onScroll();
}

/* ===== Fullscreen ===== */
function initFullscreen(){
  const b=document.getElementById('fsBtn');if(!b)return;const el=document.documentElement;
  const req=el.requestFullscreen||el.webkitRequestFullscreen, exit=document.exitFullscreen||document.webkitExitFullscreen;
  const isFs=()=>document.fullscreenElement||document.webkitFullscreenElement;
  const sync=()=>{b.querySelector('span').textContent=isFs()?'خروج من ملء الشاشة':'ملء الشاشة';redrawers.forEach(fn=>fn());};
  const toast=t=>{let m=document.querySelector('.fsmsg');if(!m){m=document.createElement('div');m.className='fsmsg';document.body.appendChild(m);}m.textContent=t;clearTimeout(m._t);m._t=setTimeout(()=>m.remove(),5000);};
  const fail=()=>toast('المتصفح هنا مش سامح بملء الشاشة. افتح ملف الـ HTML نفسه في Chrome أو Edge، أو دوس F11.');
  b.addEventListener('click',()=>{try{if(isFs()){exit&&exit.call(document);return;}if(!req){fail();return;}const r=req.call(el);if(r&&r.catch)r.catch(fail);}catch(e){fail();}});
  document.addEventListener('fullscreenchange',sync);document.addEventListener('webkitfullscreenchange',sync);
}

/* ===== Boot ===== */
const L1Q=window.QUIZ_L1;
document.addEventListener('DOMContentLoaded',()=>{
  initPolls(document);initToggles(document);initChecks(document);
  initStepper('exSteps','exNext','exReset');
  penSim();vecSim();rainSim();riverSim();planeSim();
  initQuiz('q1',L1Q,window.FACES);
  initStepper('exSteps2','exNext2','exReset2');coinSim();labSim();dropGame();initQuiz('q2',window.QUIZ_L2,window.FACES);
  initStepper('exSteps3','exNext3','exReset3');frameSim();angSim();fireworks();initQuiz('q3',window.QUIZ_L3,window.FACES);
  initStepper('exSteps4','exNext4','exReset4');balSim();tqSim();wrSim();initQuiz('q4',window.QUIZ_L4,window.FACES);
  cannonGame();riverGame();seesawGame();blitzGame();basicsTools();
  initFullscreen();initNav();
});
})();
