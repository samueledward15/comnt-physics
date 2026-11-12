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
/* Arabic word + LTR number side by side, no bidi reordering */
function arNum(x,ar,num,px,py,col,size,align='right'){
  x.save();x.font=AR(800,size);const wa=x.measureText(ar).width;x.font=LAT(800,size);const wn=x.measureText(num).width;x.restore();
  const tot=wa+6+wn,right=align==='right'?px:align==='left'?px+tot:px+tot/2;
  label(x,ar,right,py,col,AR(800,size),'right',true);label(x,num,right-wa-6,py,col,LAT(800,size),'right',false);
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
    const a=rad(A),len=10+T(),Lmax=10+20/(2*Math.cos(rad(75)));const s=Math.min((h-110)/24,(w-40)/(2*Lmax*Math.sin(rad(75))),12);
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
    arNum(x,'الدخل',fmt(E),x0+6,top+TW+16,C.navy,13,'left');
    arNum(x,'مفيد',`${fmt(E*eta/100)} (${eta}%)`,xe-6,top+wu+18,C.green,14,'right');
    {const wl=150;const room=cx+ww/2+14+wl<w;arNum(x,'مهدر',fmt(E*(100-eta)/100),room?cx+ww/2+14:cx-ww/2-14,h-48,C.red,14,room?'left':'right');}
  }
  onRedraw(c,draw);out();
}

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
    if(frac>=1){arNum(x,'المساحة =',`${f(Math.abs(r.dp),3)} N s`,gx+gw*(0.05+dt/2)/Tm+8,gy-gh*0.55,C.yellow,13,'left');
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
    const dmax=Math.max(r.v1*r.v1,r.v2*r.v2)/(2*A),S=(w/2-70)/Math.max(dmax,0.6),cx=w/2,fy=h-46;x.fillStyle='#5B6B7A';x.fillRect(0,fy+14,w,3);
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
  let m1=1.2,v1=3,m2=2.8,v2=-2,type='stick',t=0,run=false,t0=0;const X1=-3.5,X2=3.5,hw=m=>0.3+0.1*m;
  const post=()=>{if(type==='stick'){const v=(m1*v1+m2*v2)/(m1+m2);return{a:v,b:v};}
    return{a:((m1-m2)*v1+2*m2*v2)/(m1+m2),b:((m2-m1)*v2+2*m1*v1)/(m1+m2)};};
  const tc=()=>v1-v2>0?(X2-X1-hw(m1)-hw(m2))/(v1-v2):Infinity;
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
    const drawCar=(xm,m,col,lab,v)=>{const px=cx+xm*S,ww=2*hw(m)*S;x.fillStyle=col;x.fillRect(px-ww/2,ty-16,ww,32);label(x,lab,px,ty,C.navy,LAT(800,13),'center',false);
      if(Math.abs(v)>0.05)arrow(x,px,ty-28,px+v*14,ty-28,C.mint,3,8);if(!(s.after&&type==='stick')||lab==='A')label(x,`${f(v,2)} m/s`,s.after&&type==='stick'?cx+((s.xa+s.xb)/2)*S:px,ty-42,C.mint,LAT(700,11),'center',false);};
    drawCar(s.xa,m1,C.sky,'A',s.va);drawCar(s.xb,m2,C.yellow,'B',s.vb);
    label(x,`A: ${f(m1,1)} kg   B: ${f(m2,1)} kg`,14,ty+40,C.white,LAT(700,12),'left',false);
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
  x.fillStyle=col;x.fillRect(xx-10,py-5,10,10);label(x,t,xx-16,py,C.navy,AR(700,12),'right');xx-=tw+34;});}

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
    arNum(x,'التيار',`${f(vc,1)} m/s`,w-12,bot+20,C.navy,13,'right');
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
    if(k.lv===1){arNum(x,'عزم الشمال',`${ML()} N m`,cx-12,24,C.coral,13,'right');arNum(x,'عزم اليمين',`${F2*d2} N m`,cx+12,24,C.mint,13,'left');}
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
      arNum(x,'الشد',`${f(t,0)} N`,bx,by-14,C.navy,12,'left');arNum(x,'الكابل يستحمل',`${P.lim} N`,bx+bw,by-14,C.navy,12,'right');}
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
    btns=mkPicks('eff',devs.map(([n,i,o])=>`<span class="badge" hidden></span><span style="display:flex;flex-direction:column;align-items:flex-start;gap:4px"><b>${n}</b>${l<3?svg(i,o,l===2?0.45+0.55*i/mx:1):''}${l>1?`<span style="font-size:13px">دخل <bdi class="m">${i} J</bdi> · مفيد <bdi class="m">${o} J</bdi></span>`:''}</span>`),(i,b)=>{
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
    if(k.lv===1&&mA){const pb=mA*P.vA+P.mB*P.vB;arNum(x,'قبل:',`Σp = ${f(pb,1)} kg m/s`,w/2-14,26,C.yellow,13,'right');arNum(x,'بعد:',`Σp = ${f((mA+P.mB)*vp(mA),1)} kg m/s`,w/2+14,26,C.mint,13,'left');}
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
  /* Mouse wheel scrolls the tab strip sideways when it overflows */
  const strip=$('.tabs');if(strip)strip.addEventListener('wheel',e=>{if(strip.scrollWidth>strip.clientWidth&&Math.abs(e.deltaY)>Math.abs(e.deltaX)){strip.scrollLeft+=(document.dir==='rtl'||strip.closest('[dir=rtl]')?-1:1)*e.deltaY;e.preventDefault();}},{passive:false});
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
  initStepper('exSteps5','exNext5','exReset5');ebSim();lmSim();plSim();initQuiz('q5',window.QUIZ_L5,window.FACES);
  initStepper('exSteps6','exNext6','exReset6');stSim();elSim();skSim();initQuiz('q6',window.QUIZ_L6,window.FACES);
  initStepper('exSteps7','exNext7','exReset7');imSim();phSim();hmSim();initQuiz('q7',window.QUIZ_L7,window.FACES);
  initStepper('exSteps8','exNext8','exReset8');chSim();coSim();rkSim();initQuiz('q8',window.QUIZ_L8,window.FACES);
  gamesHub();basicsTools();
  initFullscreen();initNav();
});
})();
