/**
 * עמודי המניינים בעיצוב החדש: אינדקס (/minyanim-har-homa/) ועמוד לכל בית כנסת.
 * אותה מעטפת כמו עמוד השכונה (ראש, ניווט, תחתית), אותם צבעים.
 */

import { pageHead, siteHeader, siteFooter, HOOD_JS, esc, svg, navChips, APP } from './home-template.js';
import { MAP_CSS, MAP_ICON, mapScript } from './map.js';
import { sortPrayers, formatPrayerTime, formatSelectedDays, NUSACH } from './prayers.js';

const SECTION = '/har-homa/minyanim/';
const enc = (s) => encodeURIComponent(s);
const TYPES = ['שחרית', 'מנחה', 'ערבית'];
const typeOf = (t = '') => TYPES.find((x) => t.includes(x)) || t;
const nusachOf = (s) => (s.prayer_nusach ? NUSACH[s.prayer_nusach] || NUSACH.other : '');

const CSS = `${MAP_CSS}
.syn-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.syn-head h2{margin:0}
.mn-sec .map-btn{background:#EFF4FF;color:var(--navy)}.mn-sec .map-btn[aria-pressed=true]{background:var(--brand);color:#fff}

.mn-hero{background:var(--navy);color:#fff}
.mn-hero .wrap{padding-block:28px 30px;display:flex;flex-direction:column;gap:14px}
.crumb{font-size:14px;color:#A9BAD4}.crumb a{color:#C9D6EA}
.mn-hero h1{margin:0;font-size:clamp(30px,5vw,46px);font-weight:800;line-height:1.1;text-wrap:balance}
.mn-hero p{margin:0;font-size:17px;color:#C9D6EA;max-width:40em}
.mn-tabs{display:flex;flex-wrap:wrap;gap:8px}.mn-tabs a{height:40px;padding:0 16px;border-radius:999px;display:inline-flex;align-items:center;font-weight:800;font-size:15px;text-decoration:none;background:rgba(255,255,255,.12);color:#fff}.mn-tabs a:hover{background:rgba(255,255,255,.2);color:#fff}.mn-tabs a.on{background:var(--sky);color:var(--navy)}
.mn-chips{display:flex;flex-wrap:wrap;gap:8px}
.mn-chip{font-size:14px;font-weight:700;background:rgba(255,255,255,.12);color:#fff;border-radius:999px;padding:5px 12px}
.mn-chip.hi{background:var(--sky);color:var(--navy)}
.mn-q{max-width:520px;display:flex;align-items:center;gap:10px;height:48px;padding:0 16px;border-radius:14px;background:#fff;color:var(--muted)}
.mn-q input{flex:1;min-width:0;border:0;outline:0;background:transparent;font:inherit;font-size:16px;color:var(--ink)}
.mn-sec{padding-block:28px 8px;display:flex;flex-direction:column;gap:16px}
.mn-sec h2{margin:0;font-size:clamp(24px,3.4vw,30px);font-weight:800;color:var(--navy)}
.mn-head{display:flex;align-items:end;justify-content:space-between;gap:12px;flex-wrap:wrap}
.mn-clock{font-family:'IBM Plex Mono',ui-monospace,monospace;font-weight:600;color:var(--brand);direction:ltr}
.seg{display:flex;gap:4px;background:#EEF1F5;padding:4px;border-radius:12px;width:max-content;max-width:100%;margin-inline:auto}
.seg button{border:0;background:transparent;border-radius:9px;padding:8px 18px;font-size:15px;font-weight:700;color:#3B4860;cursor:pointer}
.seg button[aria-selected=true]{background:#fff;color:var(--brand);font-weight:800;box-shadow:0 1px 4px rgba(0,0,0,.08)}
.next{background:#fff;border-radius:22px;box-shadow:0 2px 12px rgba(0,0,0,.05);padding:8px 18px}
.nrow{display:grid;grid-template-columns:70px minmax(0,1fr) auto;gap:12px;align-items:center;min-height:58px;border-bottom:1px solid #EEF0F4;text-decoration:none;color:var(--ink)}
.nrow:last-child{border-bottom:0}
.nrow:hover{color:var(--ink);background:#FAFBFC}
.nrow .t{font-family:'IBM Plex Mono',ui-monospace,monospace;font-weight:600;font-size:18px;background:#EFF4FF;color:var(--navy);border-radius:9px;text-align:center;padding:4px 0}
.nrow b{display:block;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nrow small{display:block;font-size:13px;color:var(--muted)}
.nrow .when{font-size:13px;font-weight:800;color:#15803D;white-space:nowrap}
.nrow.past{opacity:.45}
.nmore{display:block;margin:8px auto 4px;border:0;background:transparent;color:var(--brand);font-weight:800;font-size:15px;cursor:pointer}
.nempty{padding:18px 0;color:var(--muted);text-align:center}
/* סינון: במחשב שורות ממורכזות; בטלפון גלילה לצד עם דהייה בקצה */
.fchips{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}
@media (max-width:620px){.fchips{flex-wrap:nowrap;justify-content:flex-start;overflow-x:auto;padding-bottom:2px;scrollbar-width:none;margin-inline:-16px;padding-inline:16px;-webkit-mask-image:linear-gradient(to left,#000 calc(100% - 28px),transparent);mask-image:linear-gradient(to left,#000 calc(100% - 28px),transparent)}.fchips::-webkit-scrollbar{display:none}}
.fchips button{flex:none;height:40px;padding:0 16px;border-radius:999px;font-size:15px;cursor:pointer;border:1px solid #DCE2EC;background:#fff;color:var(--ink);font-weight:600}
.fchips button[aria-pressed=true]{border-color:var(--brand);background:var(--brand);color:#fff;font-weight:800}
.sgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(300px,100%),1fr));gap:14px}
.scard{background:#fff;border-radius:18px;padding:16px 18px;box-shadow:0 2px 10px rgba(0,0,0,.05);text-decoration:none;color:var(--ink);display:flex;flex-direction:column;gap:6px}
.scard:hover{color:var(--ink)}.scard[hidden]{display:none}
.scard h3{margin:0;font-size:18px;font-weight:800;color:var(--navy)}
.scard .a{font-size:14px;color:var(--muted)}
.scard .tm{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
.scard .tm span{font-size:13px;font-weight:700;background:#F1F4F8;border-radius:8px;padding:3px 9px;color:#3B4860}
.scard .tm span b{color:var(--brand)}
.nchip{align-self:flex-start;font-size:12px;font-weight:800;color:var(--brand);background:#EFF4FF;border-radius:7px;padding:2px 8px}
.empty2{background:#fff;border-radius:18px;padding:28px;text-align:center;color:#566173}
.empty2[hidden]{display:none}
.syn{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:18px;align-items:start;padding-block:28px 8px}
@media (max-width:900px){.syn{grid-template-columns:minmax(0,1fr)}}
.pcard{background:#fff;border-radius:22px;padding:20px 22px;box-shadow:0 2px 12px rgba(0,0,0,.05)}
.pcard h2{margin:0 0 6px;font-size:22px;font-weight:800;color:var(--navy)}
.pt{margin-top:14px}
.pt h3{margin:0 0 4px;font-size:15px;font-weight:800;color:var(--accent);display:flex;align-items:center;gap:8px}
.pt h3::after{content:'';flex:1;height:1px;background:#E6E9EF}
.prow2{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 12px;align-items:baseline;padding:10px 0;border-bottom:1px solid #F1F3F6}
.prow2:last-child{border-bottom:0}
.prow2 .v{font-size:17px;font-weight:700;font-variant-numeric:tabular-nums}
.prow2 .v small{font-size:13px;font-weight:600;color:var(--muted);margin-inline-start:6px}
.prow2 .d{font-size:13px;color:var(--muted);text-align:left;white-space:nowrap}
.prow2 .n{grid-column:1/-1;font-size:13px;color:var(--muted)}
.side{display:flex;flex-direction:column;gap:14px}
.info{background:#fff;border-radius:22px;padding:18px 20px;box-shadow:0 2px 12px rgba(0,0,0,.05);display:flex;flex-direction:column;gap:10px}
.info h2{margin:0;font-size:18px;font-weight:800;color:var(--navy)}
.info p{margin:0;font-size:15px;color:#3B4860}
.btns{display:flex;gap:8px;flex-wrap:wrap}
.btns a{flex:1 1 120px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:6px;font-weight:800;text-decoration:none;font-size:15px}
.b-waze{background:#E3F4FB;color:#0E7FAE}.b-map{background:#EFF4FF;color:var(--navy)}
.lesson{padding:8px 0;border-bottom:1px solid #F1F3F6}.lesson:last-child{border-bottom:0}
.lesson b{display:block;font-size:15px}.lesson span{font-size:13px;color:var(--muted)}
.note2{font-size:13px;color:var(--muted);text-align:center;padding-block:18px 0}
.app-cta{background:var(--soft);border-radius:22px;padding:22px;display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between;margin-block:28px 56px}
.app-cta b{display:block;font-size:20px;color:var(--navy)}.app-cta span{font-size:15px;color:#3B4860}
`;

const nav = (home) => navChips(home, 'minyanim');

const appCta = `<div class="app-cta"><div style="min-width:0;flex:1 1 300px"><b>המניין הקרוב אליך, עכשיו</b><span>באפליקציה: כל המניינים לפי מרחק ולפי השעה, עם התראות על שינויים.</span></div><a class="pill btn-dark" href="/b/">להורדת האפליקציה</a></div>`;

/* ── אינדקס ───────────────────────────────────────────────────── */

export function minyanimIndexPage({ vm, home, synagogues, today, base }) {
  const url = `${base}${SECTION}`;
  const title = `מניינים וזמני תפילה ב${vm.name}${vm.alias ? ` (${vm.alias})` : ''} — ${vm.city} | שכונה`;
  const desc = `זמני תפילה בבתי הכנסת ב${vm.name}${vm.alias ? ` (${vm.alias})` : ''}, ${vm.city} — שחרית, מנחה וערבית, לפי נוסח וכתובת, והמניין הבא בתור.`;
  const nusachim = [...new Set(synagogues.map(nusachOf).filter(Boolean))];
  const slugByName = Object.fromEntries(synagogues.map((s) => [s.name, s.slug]));

  const cards = synagogues.map((s) => {
    const n = nusachOf(s);
    return `<a class="scard lift" href="${SECTION}${enc(s.slug)}/"${s.latitude && s.longitude ? ` data-ll="${(+s.latitude).toFixed(5)},${(+s.longitude).toFixed(5)}"` : ''} data-n="${esc(n)}" data-text="${esc([s.name, s.address, n].filter(Boolean).join(' '))}">
${n ? `<span class="nchip">${esc(n)}</span>` : ''}<h3>${esc(s.name)}</h3>${s.address ? `<span class="a">${esc(s.address)}</span>` : ''}
${s.first.length ? `<span class="tm">${s.first.map((f) => `<span>${esc(f.type)} <b>${esc(f.time)}</b></span>`).join('')}</span>` : '<span class="a">טרם נמסרו זמנים</span>'}
</a>`;
  }).join('\n');

  const jsonld = {
    '@context': 'https://schema.org', '@type': 'ItemList', name: `בתי כנסת ב${vm.name}`,
    itemListElement: synagogues.map((s, i) => ({ '@type': 'ListItem', position: i + 1, name: s.name, url: `${base}${SECTION}${enc(s.slug)}/` })),
  };

  const JS = `(function(){
var P=JSON.parse(document.getElementById('today-data').textContent),S=JSON.parse(document.getElementById('slug-data').textContent);
var TZ='Asia/Jerusalem',box=document.getElementById('next-list'),more=document.getElementById('next-more'),clk=document.getElementById('mn-clock');
var tabs=[].slice.call(document.querySelectorAll('.seg button')),type='',all=false,lastMin=-1;
function now(){return new Date(new Date().toLocaleString('en-US',{timeZone:TZ}));}
function pad(n){return(n<10?'0':'')+n;}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function row(p,w,past){var href=S[p.n]?'${SECTION}'+encodeURIComponent(S[p.n])+'/':'#';
  return '<a class="nrow'+(past?' past':'')+'" href="'+href+'"><span class="t">'+esc(p.c)+'</span><span><b>'+esc(p.n)+'</b><small>'+esc(p.l||p.t)+'</small></span><span class="when">'+w+'</span></a>';}
function draw(){var n=now(),m=n.getHours()*60+n.getMinutes(),d=n.getDay();
  var list=P.filter(function(p){return p.t===type&&p.d.indexOf(d)>=0;});
  var up=list.filter(function(p){return p.m>=m;});
  if(all){more.hidden=true;box.innerHTML=list.length?list.map(function(p){var x=p.m-m;return row(p,x>=0&&x<=60?'בעוד '+x+' דק׳':'',x<0);}).join(''):'<p class="nempty">אין '+esc(type)+' היום.</p>';return;}
  if(!up.length){var t2=P.filter(function(p){return p.t===type&&p.d.indexOf((d+1)%7)>=0;}).slice(0,8);
    more.hidden=!list.length;more.textContent='כל המניינים של היום ('+type+')';
    box.innerHTML=t2.length?'<p class="nempty">אין עוד '+esc(type)+' היום. מחר:</p>'+t2.map(function(p){return row(p,'מחר',false);}).join(''):'<p class="nempty">אין עוד '+esc(type)+' היום.</p>';return;}
  more.hidden=up.length<=8&&list.length===up.length;more.textContent='כל המניינים של היום ('+type+')';
  box.innerHTML=up.slice(0,8).map(function(p){var x=p.m-m;return row(p,x===0?'עכשיו':x<=60?'בעוד '+x+' דק׳':'',false);}).join('');}
function pick(t){type=t;all=false;tabs.forEach(function(b){b.setAttribute('aria-selected',b.getAttribute('data-t')===t);});draw();}
tabs.forEach(function(b){b.addEventListener('click',function(){pick(b.getAttribute('data-t'));});});
more.addEventListener('click',function(){all=true;draw();});
var h=now().getHours();pick(h<12?'שחרית':h<17?'מנחה':h<23?'ערבית':'שחרית');
setInterval(function(){var n=now();clk.textContent=pad(n.getHours())+':'+pad(n.getMinutes());if(n.getMinutes()!==lastMin){lastMin=n.getMinutes();draw();}},1000);
var q=document.getElementById('mn-q'),cards=[].slice.call(document.querySelectorAll('.scard')),chips=[].slice.call(document.querySelectorAll('.fchips button')),g='',empty=document.getElementById('syn-empty');
function run(){var t=(q.value||'').trim(),k=0;cards.forEach(function(c){var ok=(!g||c.getAttribute('data-n')===g)&&(!t||c.getAttribute('data-text').indexOf(t)>=0);c.hidden=!ok;if(ok)k++;});empty.hidden=k>0;if(window.__mapRefresh)window.__mapRefresh();}
chips.forEach(function(b){b.addEventListener('click',function(){g=b.getAttribute('data-g');chips.forEach(function(x){x.setAttribute('aria-pressed',x===b);});run();});});
q.addEventListener('input',run);
})();`;

  return `${pageHead({ title, desc, url, base, css: CSS })}<a href="#next" class="sr">דלג לתוכן</a>

${siteHeader(vm, home, nav(home))}

<main id="main">
<section class="mn-hero" aria-label="כותרת"><div class="wrap">
<nav class="crumb" aria-label="פירורי לחם"><a href="${home}">${esc(vm.name)}</a> · תפילות</nav>
<h1>מניינים <span class="emd">ב${esc(vm.name)}</span></h1>
<p>זמני התפילה בבתי הכנסת בשכונה, כפי שנמסרו על ידי הגבאים והמתפללים. הזמנים לפי שקיעה והנץ מחושבים להיום.</p>
<nav class="mn-tabs" aria-label="מניינים ושיעורים"><a class="on" href="#next" aria-current="page">מניינים</a><a href="${home}lessons/">שיעורי תורה</a><a href="#syns">בתי כנסת</a></nav>
<label class="mn-q">${svg('M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM20 20l-4-4', 19, 'currentColor', 2)}<span class="sr">חיפוש בית כנסת</span><input id="mn-q" type="search" autocomplete="off" placeholder="שם בית כנסת, רחוב או נוסח…"></label>
</div></section>

<section id="next" class="wrap mn-sec" aria-label="המניין הבא">
<div class="mn-head"><h2>המניין <span class="em">הבא</span></h2><span class="mn-clock" id="mn-clock"></span></div>
<div class="seg" role="tablist" aria-label="סוג תפילה">${TYPES.map((t) => `<button type="button" role="tab" data-t="${t}" aria-selected="false">${t}</button>`).join('')}</div>
<div class="next"><div id="next-list"><p class="nempty">טוען את הזמנים…</p></div><button type="button" class="nmore" id="next-more" hidden></button></div>
</section>

<section id="syns" class="wrap mn-sec" aria-label="בתי כנסת">
<div class="syn-head"><h2>בתי <span class="em">הכנסת</span></h2>${synagogues.some((s) => s.latitude) ? `<button type="button" class="map-btn" id="map-btn" aria-pressed="false" aria-controls="dmap">${svg(MAP_ICON, 19, 'currentColor', 2)}מפה</button>` : ''}</div>
${nusachim.length > 1 ? `<div class="fchips" role="group" aria-label="סינון לפי נוסח"><button type="button" data-g="" aria-pressed="true">כל הנוסחים</button>${nusachim.map((n) => `<button type="button" data-g="${esc(n)}" aria-pressed="false">${esc(n)}</button>`).join('')}</div>` : ''}
<div id="dmap" class="dmap" hidden></div>
<div class="sgrid">
${cards}
</div>
<div class="empty2" id="syn-empty" hidden>לא מצאנו בית כנסת כזה. נסו שם אחר או רחוב.</div>
<p class="note2">הזמנים נמסרו על ידי מתפללים ועשויים להשתנות. מצאתם טעות? כל משתמש רשום יכול לעדכן באפליקציה.</p>
${appCta}
</section>
</main>

${siteFooter()}

<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>
<script type="application/json" id="today-data">${JSON.stringify(today).replace(/</g, '\\u003c')}</script>
<script type="application/json" id="slug-data">${JSON.stringify(slugByName).replace(/</g, '\\u003c')}</script>
<script>${JS}</script>
<script>${mapScript('.scard', '.a')}</script>
<script>${HOOD_JS}</script>
</body>
</html>
`;
}

/* ── עמוד בית כנסת ─────────────────────────────────────────────── */

export function synagoguePageNew({ vm, home, syn, prayers, lessons, zmanim, today, base }) {
  const url = `${base}${SECTION}${enc(syn.slug)}/`;
  const nusach = nusachOf(syn);
  const sorted = sortPrayers(prayers, zmanim);
  const clockOf = {};               // שעה משוערת להיום לזמנים יחסיים (שקיעה, הנץ, פלג)
  for (const t of today.filter((x) => x.n === syn.name)) (clockOf[`${t.t}|${t.l}`] ||= t.c);

  const groups = {};
  for (const p of sorted) (groups[typeOf(p.type)] ||= []).push(p);
  const order = [...TYPES, ...Object.keys(groups).filter((k) => !TYPES.includes(k))].filter((k) => groups[k]);

  const sections = order.map((type) => `<div class="pt"><h3>${esc(type)}</h3>
${groups[type].map((p) => {
    const label = formatPrayerTime(p.set, p.time);
    const korb = p.is_open ? (type === 'שחרית' ? ' (קרבנות)' : type === 'מנחה' ? ' (פתיחה)' : '') : '';
    const approx = p.set !== 'בשעה' ? clockOf[`${p.type}|${p.set === 'צמוד' ? 'מיד אחרי מנחה' : label}`] : null;
    return `<div class="prow2"><span class="v">${esc(label + korb)}${approx ? `<small>היום ≈ ${esc(approx)}</small>` : ''}</span><span class="d">${esc(formatSelectedDays(p.selected_days))}</span>${p.notes ? `<span class="n">${esc(p.notes)}</span>` : ''}</div>`;
  }).join('')}
</div>`).join('');

  const types = order.filter((t) => TYPES.includes(t));
  const desc = prayers.length
    ? `זמני תפילה ב${syn.name}${syn.address ? `, ${syn.address}` : ''} — ${types.join(', ')}. ${vm.name}${vm.alias ? ` (${vm.alias})` : ''}, ${vm.city}.`
    : `${syn.name}${syn.address ? `, ${syn.address}` : ''} — בית כנסת ב${vm.name}, ${vm.city}.`;

  const jsonld = {
    '@context': 'https://schema.org', '@type': 'PlaceOfWorship', name: syn.name, url,
    ...(syn.address && { address: { '@type': 'PostalAddress', streetAddress: syn.address, addressLocality: vm.city, addressCountry: 'IL' } }),
    ...(syn.latitude && { geo: { '@type': 'GeoCoordinates', latitude: syn.latitude, longitude: syn.longitude } }),
  };

  return `${pageHead({ title: `זמני תפילה ב${syn.name} — ${vm.name}, ${vm.city} | שכונה`, desc, url, base, css: CSS })}<a href="#times" class="sr">דלג לזמנים</a>

${siteHeader(vm, home, nav(home))}

<main id="main">
<section class="mn-hero" aria-label="כותרת"><div class="wrap">
<nav class="crumb" aria-label="פירורי לחם"><a href="${home}">${esc(vm.name)}</a> · <a href="${SECTION}">תפילות</a> · ${esc(syn.name)}</nav>
<h1>${esc(syn.name)}</h1>
${syn.address ? `<p>${esc(syn.address)}${syn.access_notes ? ` · ${esc(syn.access_notes)}` : ''}</p>` : ''}
<div class="mn-chips">
${nusach ? `<span class="mn-chip hi">נוסח ${esc(nusach)}</span>` : ''}${syn.rabbi_name ? `<span class="mn-chip">הרב ${esc(syn.rabbi_name)}</span>` : ''}${syn.is_accessible ? '<span class="mn-chip">נגיש</span>' : ''}${syn.has_hall ? '<span class="mn-chip">אולם אירועים</span>' : ''}${syn.can_study_during_day ? '<span class="mn-chip">פתוח ללמידה ביום</span>' : ''}
</div>
</div></section>

<div class="wrap syn">
<section id="times" class="pcard" aria-label="זמני תפילה">
<h2>זמני <span class="em">תפילה</span></h2>
${sorted.length ? sections : '<p class="nempty">טרם נמסרו זמני תפילה לבית כנסת זה.</p>'}
</section>
<aside class="side">
${syn.latitude ? `<div class="info"><h2>הגעה</h2>${syn.address ? `<p>${esc(syn.address)}</p>` : ''}<div class="btns">
<a class="b-waze" href="https://waze.com/ul?ll=${syn.latitude},${syn.longitude}&navigate=yes" rel="nofollow noopener" target="_blank">${svg('M12 3l7 18-7-4-7 4z', 17, 'currentColor', 2)}Waze</a>
<a class="b-map" href="https://www.google.com/maps/search/?api=1&query=${syn.latitude},${syn.longitude}" rel="nofollow noopener" target="_blank">${svg('M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 7a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5', 17, 'currentColor', 2)}מפות</a>
</div></div>` : ''}
${lessons.length ? `<div class="info"><h2>שיעורי תורה</h2>${lessons.map((l) => `<div class="lesson"><b>${esc(l.topic || 'שיעור')}</b><span>${esc([l.teacher, l.day && `יום ${l.day}`, l.start_time].filter(Boolean).join(' · '))}</span></div>`).join('')}</div>` : ''}
${syn.study_during_day_details ? `<div class="info"><h2>לימוד ביום</h2><p>${esc(syn.study_during_day_details)}</p></div>` : ''}
<div class="info"><h2>שינוי בזמנים?</h2><p>הזמנים נמסרו על ידי מתפללים ועשויים להשתנות. כל משתמש רשום יכול לעדכן אותם.</p><div class="btns"><a class="b-map" href="${APP}">${svg('M4 20h4L19 9l-4-4L4 16zM14 6l4 4', 17, 'currentColor', 2)}עדכון זמנים</a></div></div>
</aside>
</div>

<div class="wrap">${appCta}</div>
</main>

${siteFooter()}

<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>
<script>${HOOD_JS}</script>
</body>
</html>
`;
}
