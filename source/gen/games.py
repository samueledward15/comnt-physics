# Generates src-games.html: a card hub + one section per game
G=[
 dict(id='river',les='1-1',title='اوصل للمرسى',idea='جمع المتجهات',
  goal='القارب بيمشي بسرعة <span class="m">5 m/s</span>، والتيار بيسحبه. لف بوز القارب ودوس «انطلق» عشان ترسى على المرسى الأصفر. السهم الأخضر هو سرعتك الحقيقية: سرعة القارب + سرعة التيار.',
  ctrls=[('river-a','اتجاه البوز (بالسالب = عكس التيار)','-70','70','1','0')],btn='انطلق',
  lesson='اللي بيحدد إنت رايح فين هو <b>المحصلة</b>، مش اتجاه البوز لوحده. لو عايز توصل قصادك بالظبط، لازم تميّل البوز عكس التيار لحد ما السهم الأخضر يبقى عمودي على الضفة.'),
 dict(id='drop',les='1-2',title='وقّع الصندوق',idea='المقذوف الأفقي',
  goal='طيارة مساعدات طايرة بسرعة ثابتة. دوس «وقّع» في اللحظة الصح عشان الصندوق ينزل جوه الدايرة الحمرا. خلي بالك: الصندوق مابينزلش تحت النقطة اللي وقع منها!',
  ctrls=[],btn='وقّع',
  lesson='الصندوق بيخرج من الطيارة بنفس سرعتها الأفقية، وبيفضل محتفظ بيها وهو نازل. عشان كده بيفضل <b>تحت الطيارة</b> طول ما هو بيقع، ولازم توقّعه <b>قبل</b> ما توصل فوق الهدف.'),
 dict(id='cannon',les='1-3',title='اضرب الهدف',idea='المقذوف بزاوية',
  goal='اختار سرعة الإطلاق والزاوية، ودوس «اطلق» عشان الكورة تنزل على العلم الأحمر. في المستوى الأول هتشوف المسار قبل ما تضرب.',
  ctrls=[('cannon-v','سرعة الإطلاق','8','30','0.5','16'),('cannon-a','الزاوية','10','80','1','45')],btn='اطلق',
  lesson='الزاوية <span class="m">45°</span> بتدي أكبر مدى لنفس السرعة. وأي زاويتين مجموعهم <span class="m">90°</span> (زي <span class="m">30°</span> و <span class="m">60°</span>) بيوصلوا لنفس المكان، بس واحدة عالية وواحدة واطية.'),
 dict(id='seesaw',les='1-4',title='وازن السيسو',idea='عزم القوة',
  goal='الأطفال على الشمال قاعدين. اختار الكرسي اللي هيقعد عليه الطفل اللي على اليمين عشان السيسو يتزن. الأرقام على اللوح هي البُعد بالمتر.',
  ctrls=[],btn=None,
  lesson='اللي بيتوازن هو <b>العزم</b> مش الوزن: الوزن × البُعد. الطفل الخفيف يقدر يوازن طفل تقيل لو قعد أبعد عن النص.'),
 dict(id='sign',les='1-5',title='علّق اليافطة',idea='اتزان القوى',
  goal='يافطة وزنها <span class="m">200 N</span> هتتعلق بكابلين. اختار زاوية الكابلين مع الأفقي ودوس «علّق». لو الشد عدّى قوة الكابل، الكابل هيتقطع!',
  ctrls=[('sign-a','زاوية الكابل مع الأفقي','5','85','1','15')],btn='علّق',
  lesson='الجزء الرأسي بس من الشد هو اللي شايل اليافطة. كل ما الكابل يقرب من الأفقي، الجزء ده يصغر، فالشد كله لازم يكبر: <span class="m">2 T sin θ = W</span>.'),
 dict(id='eff',les='1-6',title='مين الأكفأ؟',idea='الكفاءة',
  goal='رتّب الأجهزة من <b>الأكفأ</b> للأقل كفاءة: دوس على الأكفأ الأول، وبعدين اللي بعده… الأكفأ هو اللي بيحوّل أكبر <b>نسبة</b> من الطاقة اللي داخلاه لطاقة مفيدة.',
  ctrls=[],btn=None,
  lesson='الكفاءة نسبة: <span class="m">المفيد ÷ الدخل</span>. الجهاز اللي بيطلّع أكبر طاقة مفيدة مش شرط يبقى الأكفأ، لو كان بياخد طاقة دخل ضخمة.'),
 dict(id='egg',les='1-7',title='أنقذ البيضة',idea='الدفع وزمن التلامس',
  goal='بيضة هتقع من ارتفاع. اختار السطح اللي هتقع عليه. البيضة بتنكسر لو القوة عدّت <span class="m">25 N</span>.',
  ctrls=[],btn=None,
  lesson='البيضة بتقف في كل الحالات، فالتغير في كمية تحركها واحد. السطح الطري بيطوّل زمن الوقوف <span class="m">Δt</span>، ولأن <span class="m">F = Δp / Δt</span> القوة بتقل.'),
 dict(id='crash',les='1-8',title='تصادم العربيات',idea='حفظ كمية التحرك',
  goal='العربية الصفرا هتخبط في العربية الزرقا ويلتصقوا ويكملوا مع بعض. اختار كتلة العربية الصفرا عشان الاتنين يقفوا جوه المنطقة الخضرا.',
  ctrls=[],btn=None,
  lesson='كمية التحرك الكلية قبل = بعد. لو العربية الصفرا أتقل، كمية تحركها أكبر، فالعربيتين بعد الالتصاق بيمشوا أسرع ويروحوا أبعد.'),
]
def ctrl(c):
    i,l,a,b,s,v=c
    return f'<div class="ctrl"><label for="{i}">{l} <output data-out="{i}"></output></label><input id="{i}" type="range" min="{a}" max="{b}" step="{s}" value="{v}"></div>'
cards=''.join(f'<a class="gcard" href="#g-{g["id"]}"><span class="gles">الدرس <span class="m">{g["les"]}</span></span><b>{g["title"]}</b><span>{g["idea"]}</span><span class="cstars" data-cstars="{g["id"]}"></span></a>' for g in G)
cards+='<a class="gcard tf" href="#g-tf"><span class="gles">كل الدروس</span><b>صح ولا غلط؟</b><span>مفاهيم من غير حسابات</span><span class="cstars" data-cstars="tf"></span></a>'
out=['''<section class="lesson" id="lesson-games" data-lesson="games" hidden>
<main class="wrap">
<section class="board" id="g-intro">
  <div class="with-mint">
    <div class="stack">
      <span class="eyebrow on-navy-given">العب واتعلم</span>
      <h1 style="font-size:clamp(32px,5vw,52px);font-weight:800">ألعاب الفيزياء</h1>
      <p class="lead">لعبة لكل درس، ومن غير آلة حاسبة. كل لعبة فيها <span class="m">3</span> مستويات: الأول فيه مساعدة باينة، وبعدين المساعدة بتختفي شوية بشوية. كل مستوى تعدّيه بياخد نجمة.</p>
      <div class="ggrid">'''+cards+'''</div>
    </div>
    <div class="mint">
      <div class="bubble">اختار لعبة وجمّع النجوم كلها!</div>
      <img src="{{mint-gotit}}" alt="دكتور نعناع مبسوط">
    </div>
  </div>
</section>
''']
for g in G:
    i=g['id']
    btn=f'<button class="btn" id="{i}-go">{g["btn"]}</button>' if g['btn'] else ''
    cs=''.join(ctrl(c) for c in g['ctrls'])
    cs=f'<div class="ctrls">{cs}</div>' if cs else ''
    out.append(f'''<section class="board game" id="g-{i}" hidden>
  <div class="stack">
    <div class="gamehead"><a class="btn small ghost" href="#g-intro">→ كل الألعاب</a><span class="seg sky">الدرس <span class="m">{g["les"]}</span> · {g["idea"]}</span><span class="cstars big" data-cstars="{i}"></span></div>
    <h2 class="h2">{g["title"]}</h2>
    <p class="lead">{g["goal"]}</p>
    <div class="lvbar"><span class="lvpill">المستوى <b class="m" id="{i}-lv">1</b> من <span class="m">3</span></span><span class="lvtip" id="{i}-tip"></span></div>
    <div class="sim">
      <div id="{i}-pick" class="pickrow"></div>
      <canvas id="{i}-cv" class="gcv" aria-label="{g["title"]}"></canvas>
      {cs}
      <div class="btnrow">{btn}<button class="btn" id="{i}-next" hidden>المستوى اللي بعده ←</button><button class="btn ghost small" id="{i}-again" hidden>العب تاني من الأول</button><span class="gmsg" id="{i}-msg"></span></div>
    </div>
    <details class="idea"><summary>الفكرة من اللعبة</summary><p>{g["lesson"]}</p></details>
  </div>
</section>
''')
out.append('''<section class="board game" id="g-tf" hidden>
  <div class="stack">
    <div class="gamehead"><a class="btn small ghost" href="#g-intro">→ كل الألعاب</a><span class="seg sky">كل الدروس · مفاهيم</span><span class="cstars big" data-cstars="tf"></span></div>
    <h2 class="h2">صح ولا غلط؟</h2>
    <p class="lead">جملة عن الفيزياء، وإنت تقول صح ولا غلط. معاك <span class="m">3</span> قلوب، وكل غلطة بتاخد قلب. بعد كل إجابة هتشوف الشرح. <span class="m">10</span> إجابات صح = <span class="m">3</span> نجوم.</p>
    <div class="blitz">
      <div class="blitzhead"><span id="tf-hearts" class="hearts"></span><span>الصح: <b id="tf-score" class="m">0</b></span><span class="muted">أعلى سكور: <b id="tf-best" class="m">0</b></span></div>
      <div id="tf-les" class="tfles"></div>
      <div id="tf-q" class="blitzq">دوس «ابدأ» عشان تبدأ.</div>
      <div class="tfbtns"><button class="btn tfyes" id="tf-yes" disabled>صح</button><button class="btn tfno" id="tf-no" disabled>غلط</button></div>
      <div id="tf-ex" class="tfex" hidden></div>
      <div class="btnrow"><button class="btn navy" id="tf-start">ابدأ</button><button class="btn ghost small" id="tf-nextq" hidden>الجملة اللي بعدها ←</button></div>
    </div>
  </div>
</section>
</main>
</section>
''')
open('/home/claude/comnt/src-games.html','w').write(''.join(out))
