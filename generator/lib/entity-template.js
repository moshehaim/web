/**
 * עמוד מלא לעסק / בעל מקצוע: /<שכונה>/biz/<slug>/ ו-/<שכונה>/pros/<slug>/.
 * נפתח בלחיצה על כרטיס ברשימה. כולל שעות, תיאור, מבצעים, יצירת קשר והגעה.
 * "קביעת תור" מופיע רק כשמערכת התורים פעילה (appointment_system_status 2/3), ורק כאן.
 */

import { isIsraeliDST } from './season.js';
import { pageHead, siteHeader, siteFooter, HOOD_JS, esc, svg, APP, navChips } from './home-template.js';

const DAYS = [['sunday', 'ראשון'], ['monday', 'שני'], ['tuesday', 'שלישי'], ['wednesday', 'רביעי'],
  ['thursday', 'חמישי'], ['friday', 'שישי'], ['saturday', 'שבת']];
const ICON = {
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',
  wa: 'M4 20l1.3-4A8 8 0 1 1 8 18.7zM9 9.5c.3 2 2.3 4.2 4.5 4.6l1-1.2 1.8.8-.4 1.6c-3.3.2-7-3.4-7-6.8l1.5-.5.8 1.8z',
  waze: 'M12 3l7 18-7-4-7 4z',
  pin: 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 7a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5',
  cal: 'M3 5h18v16H3zM3 10h18M8 3v4M16 3v4',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  share: 'M18 8a3 3 0 1 0 0-.1zM6 15a3 3 0 1 0 0-.1zM18 22a3 3 0 1 0 0-.1zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
};

const OWNER_NOTE = {
  owner: 'הפרטים נמסרו על ידי בעל העסק ומתעדכנים על ידו באפליקציה.',
  team: 'הפרטים נאספו על ידי צוות שכונה ועשויים להשתנות. בעל המקום? כתבו לנו לעדכון: info@shchuna.co.il',
  user: 'המודעה פורסמה על ידי משתמש באפליקציה. פרטי הקשר של המפרסם זמינים באפליקציה.',
};

const CSS = `
.e-hero{background:var(--navy);color:#fff}
.e-hero .wrap{padding-block:26px 28px;display:flex;flex-direction:column;gap:12px}
.crumb{font-size:14px;color:#A9BAD4}.crumb a{color:#C9D6EA}
.e-hero h1{margin:0;font-size:clamp(28px,4.6vw,44px);font-weight:800;line-height:1.12;text-wrap:balance}
.e-price{font-size:24px;font-weight:800;color:var(--sky);font-variant-numeric:tabular-nums}
.e-gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px}
.e-gal a{aspect-ratio:1/1;border-radius:12px;overflow:hidden;background:#DCE5F5;display:block}.e-gal img{width:100%;height:100%;object-fit:cover}
.e-tags{display:flex;flex-wrap:wrap;gap:8px}
.e-tag{font-size:14px;font-weight:700;background:rgba(255,255,255,.12);color:#fff;border-radius:999px;padding:5px 12px}
.e-tag.hi{background:var(--sky);color:var(--navy)}
.e-tag.rec{background:#E24B4A;color:#fff;display:inline-flex;align-items:center;gap:5px}
.e-rec{background:#FDECEC;color:#C0362F}.e-rec:hover{color:#C0362F;background:#FBDCDC}.e-rec svg{color:#E24B4A}
.e-grid{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:18px;align-items:start;padding-block:24px 8px}
@media (max-width:900px){.e-grid{grid-template-columns:minmax(0,1fr)}.e-grid:not(.ad) .e-side{order:-1}}
.rel{padding-block:8px 24px;display:flex;flex-direction:column;gap:14px}.rel h2{margin:0;font-size:26px;font-weight:800;color:var(--navy)}
.rel-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}@media (max-width:900px){.rel-row{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}}
.rel-card{background:#fff;border-radius:18px;overflow:hidden;text-decoration:none;color:var(--ink);box-shadow:0 2px 10px rgba(0,0,0,.05)}.rel-card:hover{color:var(--ink)}
.rel-media{aspect-ratio:16/10;background:var(--soft)}.rel-media img{width:100%;height:100%;object-fit:cover}
.rel-body{padding:10px 12px 12px}.rel-body b{display:block;font-size:16px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rel-body small{display:block;font-size:13px;color:var(--accent);font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.e-card{background:#fff;border-radius:22px;padding:20px 22px;box-shadow:0 2px 12px rgba(0,0,0,.05);display:flex;flex-direction:column;gap:12px}
.e-card h2{margin:0;font-size:20px;font-weight:800;color:var(--navy)}
.e-img{border-radius:22px;overflow:hidden;background:#DCE5F5;aspect-ratio:16/10;max-width:100%}
.e-img img{width:100%;height:100%;object-fit:cover}
.e-desc{font-size:17px;line-height:1.75;color:#2B3A55;white-space:pre-line;margin:0}
.e-chips{display:flex;flex-wrap:wrap;gap:8px}
.e-chips span{font-size:14px;font-weight:700;background:#F1F4F8;border-radius:999px;padding:5px 12px;color:#3B4860}
.e-main{display:flex;flex-direction:column;gap:18px;min-width:0}
.e-side{display:flex;flex-direction:column;gap:14px}
.e-acts{display:flex;flex-direction:column;gap:10px}
.e-acts a{height:50px;border-radius:14px;display:flex;align-items:center;justify-content:center;gap:8px;font-weight:800;font-size:16px;text-decoration:none}
.e-tel{background:var(--navy);color:#fff}.e-tel:hover{color:#fff;background:#0F1F3B}
.e-tel .num{font-variant-numeric:tabular-nums}
.e-wa{background:#E7F7EC;color:#14532D}.e-wa:hover{color:#14532D}
.e-waze{background:#E3F4FB;color:#0E7FAE}.e-waze:hover{color:#0E7FAE}
.e-map{background:#EFF4FF;color:var(--navy)}.e-map:hover{color:var(--navy)}
.e-book{background:var(--sky);color:var(--navy)}.e-book:hover{color:var(--navy)}
.hours{display:flex;flex-direction:column}
.hrow{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #F1F3F6;font-size:15px}
.hrow:last-child{border-bottom:0}
.hrow b{font-weight:700;flex:none}.hrow span{font-variant-numeric:tabular-nums;color:#3B4860;text-align:left}
.hrow small{font-size:12px;color:var(--muted)}
.hrow.today{font-weight:800}.hrow.today b,.hrow.today span{color:var(--brand)}
.hrow .closed{color:var(--muted)}
.e-addr{font-size:15px;color:#3B4860;margin:0}
.e-promos{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(240px,100%),1fr));gap:12px}
.e-promo{border-radius:16px;overflow:hidden;background:#F5F8FF;display:flex;flex-direction:column}
.e-promo .pi{aspect-ratio:16/9;background:#DCE5F5}.e-promo .pi img{width:100%;height:100%;object-fit:cover}
.e-promo b{display:block;padding:10px 12px 2px;font-size:16px}.e-promo span{padding:0 12px 12px;font-size:13px;color:var(--muted)}
.e-note{font-size:13px;color:var(--muted);text-align:center}
.app-cta{background:var(--soft);border-radius:22px;padding:22px;display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between;margin-block:24px 56px}
.app-cta b{display:block;font-size:20px;color:var(--navy)}.app-cta span{font-size:15px;color:#3B4860}
`;

/** כמו TimeRange.formatTimeForDisplay באפליקציה + שעה משוערת לשבת הקרובה */
const REL = (n, before, what) => {
  const a = Math.abs(n);
  const w = a === 30 ? 'חצי שעה' : a === 60 ? 'שעה' : a === 90 ? 'שעה וחצי' : a === 120 ? 'שעתיים' : `${a} דק׳`;
  return `${w} ${before ? 'לפני' : 'אחרי'} ${what}`;
};
function fmtTime(t, st) {
  if (!t) return '';
  const m = /^(candle_lighting|havdalah)([+-]\d+)?$/.exec(t);
  if (m) {
    const off = parseInt(m[2] || '0', 10);
    const isCandle = m[1] === 'candle_lighting';
    const base = isCandle ? st?.candle : st?.havdalah;
    const label = off === 0 ? (isCandle ? 'כניסת שבת' : 'צאת שבת') : REL(off, off < 0, isCandle ? 'כניסת שבת' : 'צאת שבת');
    const approx = base ? st.fmt(new Date(base.getTime() + off * 60000)) : '';
    return `${label}${approx ? ` <small>(השבוע ≈ <span dir="ltr">${approx}</span>)</small>` : ''}`;
  }
  if (t.includes('|')) { const [w, su] = t.split('|'); return `<span dir="ltr">${esc(isIsraeliDST() ? su : w)}</span>`; }   // חורף|קיץ — מציגים את העונה הנוכחית
  return `<span dir="ltr">${esc(t)}</span>`;
}
const isTimeLike = (t) => /^(\d{1,2}:\d{2}|candle_lighting|havdalah)/.test(t || '') || (t || '').includes('|');

function hours(schedule, st) {
  if (!schedule || typeof schedule !== 'object') return '';
  if (!DAYS.some(([k]) => Array.isArray(schedule[k]) && schedule[k].length)) return '';
  const rows = DAYS.map(([k, he], i) => {
    const r = schedule[k];
    const txt = Array.isArray(r) && r.length ? r.map((x) => {
      if (!isTimeLike(x.start)) return esc(x.start || '');            // טקסט חופשי
      const plain = (t) => /^\d{1,2}:\d{2}$/.test(t || '');
      if (plain(x.start) && plain(x.end)) return `<span dir="ltr">${esc(x.start)}–${esc(x.end)}</span>`;
      return x.end ? `${fmtTime(x.start, st)} – ${fmtTime(x.end, st)}` : fmtTime(x.start, st);
    }).join('<br>') : '';
    return `<div class="hrow" data-d="${i}"><b>${he}</b>${txt ? `<span>${txt}</span>` : '<span class="closed">סגור</span>'}</div>`;
  });
  return `<div class="e-card"><h2>שעות פעילות</h2><div class="hours">${rows.join('')}</div></div>`;
}

function ldHours(schedule) {
  if (!schedule) return undefined;
  const map = { sunday: 'Sunday', monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday' };
  const out = [];
  for (const [k, en] of Object.entries(map)) for (const r of schedule[k] || []) {
    if (r.start && r.end && /^\d/.test(r.start)) out.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: en, opens: r.start, closes: r.end });
  }
  return out.length ? out : undefined;
}

/** עמוד מלא גנרי. e: { id, table, name, slug, field, group, img, gallery, price, rec, where, phone, waze, appOnly, detail{...}, owner } */
export function detailPage(vm, e, { base, home, kind, listLabel, ldType, listHref, api, st }) {
  const isPro = kind === 'pros';
  const url = `${base}${home}${kind}/${encodeURIComponent(e.slug)}/`;
  const d = e.detail || {};
  const title = `${e.name} — ${e.field || e.kicker || e.group} ב${vm.name} | שכונה`;
  const desc = (d.desc ? d.desc.replace(/\s+/g, ' ').slice(0, 150) : `${e.name}, ${e.field || e.kicker || e.group} ב${vm.name}, ${vm.city}.`) +
    (e.phone ? ' טלפון, WhatsApp ושעות פעילות.' : '');
  const maps = d.lat && d.lng ? `https://www.google.com/maps/search/?api=1&query=${d.lat},${d.lng}` : null;

  const jsonld = {
    '@context': 'https://schema.org', '@type': ldType || (isPro ? 'ProfessionalService' : 'LocalBusiness'), name: e.name, url,
    ...(e.img && { image: e.img }), ...(e.phone && { telephone: e.phone.display }),
    ...(e.where && { address: { '@type': 'PostalAddress', streetAddress: e.where, addressLocality: vm.city, addressCountry: 'IL' } }),
    ...(d.lat && { geo: { '@type': 'GeoCoordinates', latitude: d.lat, longitude: d.lng } }),
    ...(ldHours(d.schedule) && { openingHoursSpecification: ldHours(d.schedule) }),
  };

  const acts = [];
  if (e.phone && !e.appOnly) acts.push(`<a class="e-tel" href="${esc(e.phone.tel)}" data-num="${esc(e.phone.display)}">${svg(ICON.phone, 19, 'currentColor', 2.2)}<span class="lbl">התקשרו</span><span class="num" dir="ltr" hidden>${esc(e.phone.display)}</span></a>`);
  if (e.phone?.wa && !e.appOnly) acts.push(`<a class="e-wa" href="${esc(e.phone.wa)}" target="_blank" rel="noopener">${svg(ICON.wa, 19, 'currentColor', 2)}WhatsApp</a>`);
  if (e.providerHref) acts.push(`<a class="e-map" href="${esc(e.providerHref)}">לעמוד העסק</a>`);
  if (d.booking) acts.push(`<a class="e-book" href="${APP}">${svg(ICON.cal, 19, 'currentColor', 2)}קביעת תור</a>`);
  const noContact = !acts.length;
  // המלצה: באתר עצמו (/js/auth.js — התחברות + אימות טלפון + set_recommendation). בלי JS: לאפליקציה (?recommend=1)
  const recPath = e.table === 'professionals' ? 'professional' : e.table === 'businesses' ? 'business' : null;
  if (recPath && e.id) acts.push(`<a class="e-rec" href="${APP}${recPath}/${encodeURIComponent(e.id)}?recommend=1" data-rec="${recPath}" data-id="${esc(e.id)}" data-has="${e.rec > 0 ? 1 : 0}" aria-pressed="false">${svg(ICON.heart, 19, 'currentColor', 2.2)}${e.rec > 0 ? 'אני ממליץ' : 'היה הראשון להמליץ'}</a>`);
  if (noContact) acts.push(`<a class="e-map" href="${APP}">${e.appOnly ? 'ליצירת קשר באפליקציה' : 'לפרטים באפליקציה'}</a>`);

  const JS = `(function(){
var API=window.__SB||null,el=document.querySelector('[data-entity]'),sent=0;
function count(){if(!API||sent)return;sent=1;try{fetch(API.url+'/rest/v1/rpc/increment_entity_contact',{method:'POST',keepalive:true,
  headers:{'apikey':API.key,'Authorization':'Bearer '+API.key,'Content-Type':'application/json'},
  body:JSON.stringify({entity_id:el.getAttribute('data-id'),entity_table:el.getAttribute('data-t')})}).catch(function(){});}catch(_){}}
var desk=window.matchMedia&&matchMedia('(hover: hover) and (pointer: fine)').matches;
document.addEventListener('click',function(ev){
  if(ev.target.closest('.e-wa')){count();return;}
  var a=ev.target.closest('.e-tel');if(!a)return;count();if(!desk)return;ev.preventDefault();
  var n=a.querySelector('.num'),l=a.querySelector('.lbl');
  if(n.hidden){n.hidden=false;l.hidden=true;a.title='לחיצה מעתיקה';return;}
  if(navigator.clipboard){var t=n.textContent;navigator.clipboard.writeText(t).then(function(){n.textContent='הועתק ✓';setTimeout(function(){n.textContent=t;},1500);},function(){});}
});
var dow=new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Jerusalem'})).getDay();
var r=document.querySelector('.hrow[data-d="'+dow+'"]');if(r)r.classList.add('today');
})();`;

  return `${pageHead({ title, desc, url, base, css: CSS })}<a href="#main" class="sr">דלג לתוכן</a>

${siteHeader(vm, home, navChips(home, kind))}

<main id="main" data-entity data-id="${esc(e.id)}" data-t="${esc(e.table)}">
<section class="e-hero" aria-label="כותרת"><div class="wrap">
<nav class="crumb" aria-label="פירורי לחם"><a href="${home}">${esc(vm.name)}</a> · <a href="${listHref || `${home}${kind}/`}">${esc(listLabel)}</a> · ${esc(e.name)}</nav>
<h1>${esc(e.name)}</h1>${e.price ? `<span class="e-price">${esc(e.price)}</span>` : ''}
<div class="e-tags">${e.field || e.kicker ? `<span class="e-tag hi">${esc(e.field || e.kicker)}</span>` : ''}${e.group && e.group !== e.field ? `<span class="e-tag">${esc(e.group)}</span>` : ''}${e.rec > 0 ? `<span class="e-tag rec">${svg(ICON.heart, 14, 'currentColor', 2)}${e.rec === 1 ? 'המלצה אחת' : `${e.rec} המלצות`}</span>` : ''}</div>
</div></section>

<div class="wrap e-grid${e.appOnly ? ' ad' : ''}">
<div class="e-main">
${e.img ? `<div class="e-img"><img src="${esc(e.img)}" alt="${esc(e.name)}" decoding="async"></div>` : ''}
${(e.gallery || []).length ? `<div class="e-gal">${e.gallery.slice(0, 8).map((g) => `<a href="${esc(g)}" target="_blank" rel="noopener"><img src="${esc(g)}" alt="" loading="lazy"></a>`).join('')}</div>` : ''}
${d.desc ? `<div class="e-card"><h2>אודות</h2><p class="e-desc">${esc(d.desc)}</p></div>` : ''}
${(d.facts || []).length || (d.tags || []).length ? `<div class="e-card"><h2>פרטים</h2><div class="e-chips">${[...(d.facts || []), ...(d.tags || [])].map((t) => `<span>${esc(t)}</span>`).join('')}</div></div>` : ''}
${(d.sections || []).filter((x) => (x.chips || []).length || x.text).map((x) => `<div class="e-card"><h2>${esc(x.title)}</h2>${x.text ? `<p class="e-desc">${esc(x.text)}</p>` : `<div class="e-chips">${x.chips.map((c) => `<span>${esc(c)}</span>`).join('')}</div>`}</div>`).join('')}
${(d.promos || []).length ? `<div class="e-card"><h2>מבצעים <span class="em">פעילים</span></h2><div class="e-promos">${d.promos.map((p) => `<a class="e-promo lift" href="${home}promos/" style="text-decoration:none;color:inherit">${p.img ? `<span class="pi"><img src="${esc(p.img)}" alt="" loading="lazy"></span>` : ''}<b>${esc(p.title)}</b><span>${esc(p.until)}</span></a>`).join('')}</div></div>` : ''}
</div>
<aside class="e-side">
<div class="e-card"><h2>יצירת קשר</h2><div class="e-acts">${acts.join('')}</div></div>
${e.where || d.lat ? `<div class="e-card"><h2>הגעה</h2>${e.where ? `<p class="e-addr">${esc(e.where)}</p>` : ''}${d.lat ? `<div class="e-acts">${e.waze ? `<a class="e-waze" href="${esc(e.waze)}" target="_blank" rel="nofollow noopener"><img src="/img/waze.png" alt="" width="24" height="24" style="display:block">ניווט ב-Waze</a>` : ''}${maps ? `<a class="e-map" href="${esc(maps)}" target="_blank" rel="nofollow noopener">${svg(ICON.pin, 18, 'currentColor', 2)}פתיחה במפות</a>` : ''}</div>` : ''}</div>` : ''}
${hours(d.schedule, st)}
<p class="e-note">${OWNER_NOTE[e.owner] || OWNER_NOTE.team}</p>
</aside>
</div>

${e.related?.length ? `<section class="wrap rel" aria-label="עוד ב${esc(e.group || listLabel)}"><h2>עוד ב<span class="em">${esc(e.group || listLabel)}</span></h2>
<div class="rel-row">${e.related.map((o) => `<a class="rel-card lift" href="${esc(o.href)}"><div class="rel-media">${o.img ? `<img src="${esc(o.img)}" alt="" loading="lazy">` : ''}</div><div class="rel-body"><b>${esc(o.name)}</b>${o.field ? `<small>${esc(o.field)}</small>` : ''}</div></a>`).join('')}</div></section>` : ''}
<div class="wrap"><div class="app-cta"><div style="min-width:0;flex:1 1 300px"><b>עוד ב${esc(listLabel)}</b><span>כל הרשימה ב${esc(vm.name)}, עם חיפוש וסינון.</span></div><a class="pill btn-dark" href="${listHref || `${home}${kind}/`}">ל${esc(listLabel)} ←</a></div></div>
</main>

${siteFooter()}

<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>
${api ? `<script>window.__SB=${JSON.stringify(api).replace(/</g, '\\u003c')};</script>` : ''}
<script>${JS}</script>
<script>${HOOD_JS}</script>
</body>
</html>
`;
}

/** עסק / בעל מקצוע — עטיפה של detailPage */
export function entityPage(vm, e, { base, home, kind, api, st }) {
  return detailPage(vm, e, { base, home, kind, api, st, listLabel: kind === 'pros' ? 'בעלי מקצוע' : 'עסקים' });
}
