# Assemble the single-file lesson page: inline SVGs as data URIs, stitch sections, add scripts.
import base64, re, pathlib
D = pathlib.Path(__file__).parent
def uri(name):
    return "data:image/svg+xml;base64," + base64.b64encode((D / f"{name}.svg").read_bytes()).decode()

lessons = [D / "src-l1.html"]
extra = ["src-l4.html", "src-games.html", "src-basics.html"]
placeholders = {
    2: ("1-2", "حركة المقذوفات الأفقية"),
    3: ("1-3", "حركة المقذوفات بزاوية"),
}
parts = [(D / "src-head.html").read_text(), '<body dir="rtl" lang="ar">' if False else "",
         '<div dir="rtl" lang="ar">', (D / "src-shell-top.html").read_text()]
for p in lessons:
    parts.append(p.read_text())
for n, (code, name) in placeholders.items():
    if (D / f"src-l{n}.html").exists():
        parts.append((D / f"src-l{n}.html").read_text()); continue
    parts.append(f'''<section class="lesson" data-lesson="{n}" hidden><main class="wrap"><section class="board"><div class="coming">
<span class="seg">الدرس <span class="m">{code}</span></span><h2 class="h2">{name}</h2><p class="on-navy-given">قريبًا</p></div></section></main></section>''')
for e in extra:
    parts.append((D / e).read_text())
parts.append('<footer class="wrap">Comnt Academy · كومنت أكاديمي — مبني على كتاب الفيزياء، البكالوريا المصرية، الصف الثاني، الجزء الأول.</footer></div>')
faces = {"laugh": uri("face-laugh"), "sad": uri("face-sad"), "starry": uri("face-starry")}
quiz = "".join((D / f).read_text() for f in sorted(x.name for x in D.glob("src-quiz*.js"))) + (D / "src-glossary.js").read_text()
parts.append("<script>window.FACES=" + repr(faces).replace("'", '"') + ";" + quiz + "</script>")
parts.append("<script>" + (D / "src-app.js").read_text() + "</script>")
def norm(t):
    t = t.replace("V\u20d7", '<span class="vec">V</span>').replace("v\u20d7", '<span class="vec">v</span>')
    for a, c in [("\u2080","0"),("\u2081","1"),("\u2082","2"),("\u2093","x")]:
        t = t.replace(a, f"<sub>{c}</sub>")
    t = t.replace("\u207b\u00b9", "<sup>\u22121</sup>").replace("\u207b\u00b2", "<sup>\u22122</sup>")
    return t
parts = [norm(x) if ('<section class="lesson"' in x or x.startswith("<script>window.FACES")) else x for x in parts]
html = "\n".join(parts)
names = sorted(set(re.findall(r'src="\{\{((?:mint|face)-[a-z]+)\}\}"', html)))
html = re.sub(r'src="\{\{((?:mint|face)-[a-z]+)\}\}"', r'data-img="\1"', html)
imgjs = "<script>window.IMG={" + ",".join(f'"{n}":"{uri(n)}"' for n in names) + "};document.querySelectorAll('[data-img]').forEach(function(i){i.src=window.IMG[i.dataset.img];});</script>"
html = html.replace("<script>window.FACES=", imgjs + "<script>window.FACES=", 1)
html = re.sub(r"\{\{([a-z\-]+)\}\}", lambda m: uri(m.group(1)), html)
out = D / "comnt-physics-lessons.html"
out.write_text(html)
title = re.search(r"<title>(.*?)</title>", html).group(1)
std = D / "standalone" / "comnt-physics-lessons.html"
std.parent.mkdir(exist_ok=True)
std.write_text('<!doctype html>\n<html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body style="margin:0">' + html + '</body></html>')
print(out, len(html) // 1024, "KB")

# ---- Web app (PWA) build ----
APP = pathlib.Path("/home/claude/comnt-app")
APP.mkdir(exist_ok=True)
pwa_head = '''<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="دروس فيزياء تفاعلية لتانية ثانوي (البكالوريا): المتجهات، المقذوفات، عزم القوة، ألعاب وأساسيات.">
<meta name="theme-color" content="#013869"><link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" type="image/svg+xml" href="/icons/favicon.svg"><link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png"><link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="فيزياء كومنت">'''
sw_reg = '''<script>if('serviceWorker' in navigator&&location.protocol==='https:'){addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}</script>'''
(APP / "index.html").write_text('<!doctype html>\n<html lang="ar" dir="rtl"><head>' + pwa_head + '</head><body style="margin:0;background:#FFF6E8">' + html + sw_reg + '</body></html>')
print(APP / "index.html")
