/**
 * עמודי האלפון: /<שכונה>/pros/ ו-/<שכונה>/biz/.
 * HTML מלא מרונדר מראש (לגוגל), וסקריפט קטן לחיפוש ולסינון לפי תחום.
 */

import { pageHead, siteHeader, siteFooter, HOOD_JS, esc, svg, APP } from './home-template.js';

const ICON_PHONE = 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2';
const ICON_WA = 'M4 20l1.3-4A8 8 0 1 1 8 18.7zM9 9.5c.3 2 2.3 4.2 4.5 4.6l1-1.2 1.8.8-.4 1.6c-3.3.2-7-3.4-7-6.8l1.5-.5.8 1.8z';
const ICON_WAZE = 'M12 3l7 18-7-4-7 4z';
const ICON_HEART = 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z';

/* כרטיס בלי תמונה: אייקון התחום על רקע בצבע התחום (כמו באפליקציה — לוגו / אייקון קטגוריה) */
const CAT_ICON = {
  food_and_restaurants: ['M4 3v8a3 3 0 0 0 6 0V3M7 3v18M17 3c-2 2-3 5-3 8h4V3M17 11v10', 'amber'],
  food_culinary: ['M4 3v8a3 3 0 0 0 6 0V3M7 3v18M17 3c-2 2-3 5-3 8h4V3M17 11v10', 'amber'],
  retail: ['M4 7h16l-1.5 13h-13zM9 7V5a3 3 0 0 1 6 0v2', 'violet'],
  automotive: ['M5 16V11l2-5h10l2 5v5M3 16h18v3H3zM7.5 13h.01M16.5 13h.01', 'sky'],
  personal_care: ['M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18', 'rose'],
  beauty: ['M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18', 'rose'],
  sports_leisure: ['M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM3.5 9h17M3.5 15h17M12 3c-3 3-3 15 0 18M12 3c3 3 3 15 0 18', 'green'],
  home_garden: ['M12 21c-5-3-7-7-7-11 4 0 7 2 7 6 0-4 3-6 7-6 0 4-2 8-7 11zM12 21V10', 'green'],
  services_repairs: ['M14.5 6.5a4 4 0 0 0-5.3 5.3L3 18l3 3 6.2-6.2a4 4 0 0 0 5.3-5.3l-2.6 2.6-2.4-.6-.6-2.4z', 'blue'],
  home_maintenance: ['M14.5 6.5a4 4 0 0 0-5.3 5.3L3 18l3 3 6.2-6.2a4 4 0 0 0 5.3-5.3l-2.6 2.6-2.4-.6-.6-2.4z', 'blue'],
  household: ['M4 21V10l8-6 8 6v11M9 21v-6h6v6', 'teal'],
  pets: ['M8 9a1.8 2.2 0 1 0 0-.1zM16 9a1.8 2.2 0 1 0 0-.1zM5 13a1.6 2 0 1 0 0-.1zM19 13a1.6 2 0 1 0 0-.1zM12 13c-3 0-5 3-5 5s2 2 5 1c3 1 5 1 5-1s-2-5-5-5z', 'amber'],
  events: ['M4 20l4-12 8 8zM14 4v2M18 6l-1.5 1.5M20 10h-2M12 9l3-3', 'violet'],
  legal_finance: ['M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0zM8 21h8', 'blue'],
  education: ['M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5', 'teal'],
  technology: ['M4 5h16v11H4zM2 19h20', 'sky'],
  design_architecture: ['M3 21L21 3M15 3h6v6M6 21l-3-3 12-12 3 3z', 'violet'],
  delivery: ['M3 7h11v9H3zM14 10h4l3 3v3h-7M7 18.5a1.5 1.5 0 1 0 0-.1M17 18.5a1.5 1.5 0 1 0 0-.1', 'sky'],
  counseling: ['M4 5h16v10H9l-5 4z', 'teal'],
  judaism: ['M4 5h7a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-5a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h5z', 'blue'],
  health_parenting: ['M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z', 'rose'],
  other: ['M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8', 'blue'],
};

const CSS = `
.t-blue{--t1:#EFF4FF;--t2:#DCE6FB;--tf:#244782}.t-sky{--t1:#E9F4FC;--t2:#D3E8F7;--tf:#1F78B4}
.t-green{--t1:#EAF7EE;--t2:#D4EEDC;--tf:#15803D}.t-violet{--t1:#F3EFFC;--t2:#E4DCF7;--tf:#6D4BB8}
.t-teal{--t1:#E6F6F4;--t2:#CDEBE7;--tf:#0F766E}.t-amber{--t1:#FCF5E6;--t2:#F4E5C2;--tf:#8A5A00}
.t-rose{--t1:#FCEFF2;--t2:#F5D9E0;--tf:#9F2D4B}
.dcard.compact .dmedia{display:none}
.dcard.compact .dbody{padding-top:18px}
.dmedia.noimg{background:radial-gradient(120% 90% at 85% 0%,var(--t1) 0%,var(--t2) 100%)}
.dmedia.noimg svg{width:64px;height:64px;color:var(--tf);opacity:.9}
.dmedia.noimg::after{content:'';position:absolute;inset:auto 0 0 0;height:36%;opacity:.35;
background:linear-gradient(to top,var(--t2),transparent)}
.dir-hero{background:var(--navy);color:#fff}
.dir-hero .wrap{padding-block:28px 30px;display:flex;flex-direction:column;gap:18px}
.crumb{font-size:14px;color:#A9BAD4}.crumb a{color:#C9D6EA}
.dir-hero h1{margin:0;font-size:clamp(30px,5vw,46px);font-weight:800;line-height:1.1}
.dir-tools{display:flex;flex-wrap:wrap;gap:12px;align-items:center}
.dir-tabs{display:flex;gap:4px;background:rgba(255,255,255,.1);padding:4px;border-radius:14px}
.dir-tabs a{height:40px;padding:0 18px;border-radius:10px;display:flex;align-items:center;color:#fff;font-weight:600;text-decoration:none;font-size:16px}
.dir-tabs a[aria-current]{background:#fff;color:var(--navy);font-weight:800}
.dir-q{flex:1 1 280px;max-width:520px;display:flex;align-items:center;gap:10px;height:48px;padding:0 16px;border-radius:14px;background:#fff;color:var(--muted)}
.dir-q input{flex:1;min-width:0;border:0;outline:0;background:transparent;font:inherit;font-size:16px;color:var(--ink)}
.dir-list{padding-block:22px 56px;display:flex;flex-direction:column;gap:18px}
.fchips{display:flex;gap:8px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}.fchips::-webkit-scrollbar{display:none}
.fchips button{flex:none;height:40px;padding:0 16px;border-radius:999px;font-size:15px;cursor:pointer;border:1px solid #DCE2EC;background:#fff;color:var(--ink);font-weight:600}
.fchips button[aria-pressed=true]{border-color:var(--brand);background:var(--brand);color:#fff;font-weight:800}
.dgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(280px,100%),1fr));gap:16px}
.dcard{background:#fff;border-radius:20px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 2px 12px rgba(0,0,0,.07)}
.dcard[hidden]{display:none}
.dmedia{position:relative;aspect-ratio:4/3;max-width:100%;background:#DCE5F5;overflow:hidden;display:flex;align-items:center;justify-content:center}
.dmedia img{width:100%;height:100%;object-fit:cover}
.drec{position:absolute;top:10px;right:10px;display:inline-flex;align-items:center;gap:4px;font-size:13px;font-weight:800;background:#fff;color:#15803D;border-radius:8px;padding:3px 9px}
.dbody{padding:14px 16px 4px;display:flex;flex-direction:column;gap:4px;flex:1}
.dbody h3{margin:0;font-size:19px;font-weight:800;line-height:1.25}
.dbody .f{font-size:14px;font-weight:700;color:var(--accent)}
.dbody .w{font-size:14px;color:var(--muted)}
.dact{padding:12px 16px 16px;display:flex;gap:8px}
.dact a{flex:1 1 0;min-width:0;white-space:nowrap;height:44px;border-radius:12px;font-weight:800;font-size:15px;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px}
.a-tel{background:#EFF4FF;color:var(--navy)}.a-tel:hover{color:var(--navy);background:#E2EBFF}
.a-tel .ld{display:none}
@media (hover:hover) and (pointer:fine){.a-tel{flex:1.6 1 0!important}.a-tel .lm{display:none}.a-tel .ld{display:inline;font-variant-numeric:tabular-nums}}
.a-wa{background:#E7F7EC;color:#14532D}.a-wa:hover{color:#14532D;background:#D8F1E0}
.a-waze{flex:none!important;width:44px;background:#E3F4FB;color:#0E7FAE}
.a-app{background:#F1F4F8;color:var(--navy)}
.dempty[hidden]{display:none}
.dempty{background:#fff;border-radius:20px;padding:36px 24px;text-align:center;display:flex;flex-direction:column;gap:8px;align-items:center}
.dempty b{font-size:20px}.dempty span{font-size:16px;color:#566173}
.dgrid .dcard:hover{transform:none}
@media (max-width:620px){
.dcard{display:grid;grid-template-columns:96px minmax(0,1fr);grid-template-areas:"m b" "a a"}
.dmedia{grid-area:m;aspect-ratio:1/1;margin:14px 14px 0 0;border-radius:14px;width:82px}
.dmedia.noimg svg{width:36px;height:36px}
.drec{position:static;grid-area:auto}
.dbody{grid-area:b;padding:14px 12px 0 16px}
.dbody h3{font-size:17px}
.dact{grid-area:a;padding:12px 14px 14px}
.dmedia .drec{display:none}
}
.join{background:var(--soft);border-radius:22px;padding:26px;display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:space-between;margin-bottom:56px}
.join b{display:block;font-size:24px;color:var(--navy)}.join span{font-size:16px;color:#3B4860}
`;

const JS = `(function(){
var q=document.getElementById('dir-q'),cards=[].slice.call(document.querySelectorAll('.dcard')),
    chips=[].slice.call(document.querySelectorAll('.fchips button')),empty=document.getElementById('dir-empty'),g='';
function run(){var t=(q.value||'').trim(),n=0;
  cards.forEach(function(c){var ok=(!g||c.getAttribute('data-group')===g)&&(!t||c.getAttribute('data-text').indexOf(t)>=0);c.hidden=!ok;if(ok)n++;});
  empty.hidden=n>0;}
chips.forEach(function(b){b.addEventListener('click',function(){g=b.getAttribute('data-g');
  chips.forEach(function(x){x.setAttribute('aria-pressed',x===b);});run();});});
q.addEventListener('input',function(){run();});
/* כרטיס בלי תמונה: מקוצר (כיתוב בלבד), אלא אם הוא באותה שורה עם כרטיס שיש לו תמונה — לגובה אחיד */
function fit(){var vis=cards.filter(function(c){return !c.hidden;}),rows={};
  vis.forEach(function(c){c.classList.remove('compact');});
  vis.forEach(function(c){var y=c.offsetTop;(rows[y]=rows[y]||[]).push(c);});
  Object.keys(rows).forEach(function(y){var r=rows[y];
    if(!r.some(function(c){return !c.querySelector('.dmedia.noimg');}))
      r.forEach(function(c){c.classList.add('compact');});});}
var _run=run;run=function(){_run();fit();};
fit();var rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(fit,120);});
/* ספירת יצירת קשר — אותו RPC כמו באפליקציה, פעם אחת לכל עסק בכל ביקור */
var API=window.__SB||null,sent={};
function count(card){if(!API||!card)return;var id=card.getAttribute('data-id'),t=card.getAttribute('data-t');
  if(!id||sent[id])return;sent[id]=1;
  try{fetch(API.url+'/rest/v1/rpc/increment_entity_contact',{method:'POST',keepalive:true,
    headers:{'apikey':API.key,'Authorization':'Bearer '+API.key,'Content-Type':'application/json'},
    body:JSON.stringify({entity_id:id,entity_table:t})}).catch(function(){});}catch(_){}}
var desk=window.matchMedia&&matchMedia('(hover: hover) and (pointer: fine)').matches;
document.addEventListener('click',function(e){
  var wa=e.target.closest('.a-wa');if(wa){count(wa.closest('.dcard'));return;}
  var a=e.target.closest('.a-tel');if(!a)return;
  count(a.closest('.dcard'));
  if(!desk)return;                       /* בטלפון: חיוג רגיל */
  e.preventDefault();                    /* במחשב: לחיצה ראשונה מציגה, שנייה מעתיקה */
  var d=a.querySelector('.ld'),num=a.getAttribute('data-num');
  if(!a.classList.contains('shown')){a.classList.add('shown');d.textContent=num;d.dir='ltr';a.title='לחיצה מעתיקה';return;}
  if(navigator.clipboard){navigator.clipboard.writeText(num).then(function(){d.textContent='הועתק ✓';
    setTimeout(function(){d.textContent=num;},1500);},function(){});}
});
})();`;

function card(p, kind) {
  const text = [p.name, p.field, p.group, p.where].join(' ');
  const media = p.img
    ? `<img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy" decoding="async">`
    : svg((CAT_ICON[p.cat] || CAT_ICON.other)[0], 64, 'currentColor', 1.6);
  const tone = p.img ? '' : ` noimg t-${(CAT_ICON[p.cat] || CAT_ICON.other)[1]}`;
  const rec = p.rec > 0 ? `<span class="drec">${svg(ICON_HEART, 14, 'currentColor', 2)}${p.rec === 1 ? 'המלצה אחת' : `${p.rec} המלצות`}</span>` : '';
  const acts = [];
  if (p.phone) acts.push(`<a class="a-tel" href="${esc(p.phone.tel)}" data-num="${esc(p.phone.display)}" aria-label="חיוג ל${esc(p.name)} ${esc(p.phone.display)}">${svg(ICON_PHONE, 17, 'currentColor', 2.2)}<span class="lm">חיוג</span><span class="ld">הצג מספר</span></a>`);
  if (p.phone?.wa) acts.push(`<a class="a-wa" href="${esc(p.phone.wa)}" target="_blank" rel="noopener" aria-label="WhatsApp ל${esc(p.name)}">${svg(ICON_WA, 17, '#15803D', 2)}WhatsApp</a>`);
  if (p.waze) acts.push(`<a class="a-waze" href="${esc(p.waze)}" target="_blank" rel="noopener" aria-label="ניווט ל${esc(p.name)} ב-Waze">${svg(ICON_WAZE, 18, 'currentColor', 2)}</a>`);
  if (!acts.length) acts.push(`<a class="a-app" href="${APP}">לפרטים באפליקציה</a>`);
  return `<article class="dcard lift" data-group="${esc(p.group)}" data-text="${esc(text)}" data-id="${esc(p.id)}" data-t="${esc(p.table)}">
<div class="dmedia${tone}">${media}${rec}</div>
<div class="dbody"><h3>${esc(p.name)}</h3>${p.field ? `<span class="f">${esc(p.field)}</span>` : ''}${p.where ? `<span class="w">${esc(p.where)}</span>` : ''}</div>
<div class="dact">${acts.join('')}</div>
</article>`;
}

export function listPage(vm, dir, kind, { base, home, api }) {
  const isPro = kind === 'pros';
  const data = isPro ? dir.pros : dir.biz;
  const label = isPro ? 'בעלי מקצוע' : 'עסקים';
  const pagePath = `${home}${kind}/`;
  const where = `${vm.name}${vm.alias ? ` (${vm.alias})` : ''}`;
  const title = `${label} ב${where} — שכונה`;
  const desc = isPro
    ? `בעלי מקצוע ב${where}, ${vm.city}: ${data.groups.slice(0, 5).join(', ')} ועוד — עם טלפון ו-WhatsApp.`
    : `עסקים ב${where}, ${vm.city}: ${data.groups.slice(0, 5).join(', ')} ועוד — עם טלפון, WhatsApp וניווט.`;
  const nav = `<nav class="chips" aria-label="תחומים"><div class="wrap">
<a href="${home}">דף השכונה</a><a href="/minyanim-har-homa/">תפילות</a><a href="${home}pros/"${isPro ? ' aria-current="page" style="background:var(--brand);color:#fff"' : ''}>בעלי מקצוע</a><a href="${home}biz/"${!isPro ? ' aria-current="page" style="background:var(--brand);color:#fff"' : ''}>עסקים</a><a href="${home}#realestate">נדל״ן</a><a href="${home}#board">דרושים</a><a href="${home}#board">יד שנייה</a><a href="${home}#board">גמ״חים</a>
</div></nav>`;

  return `${pageHead({ title, desc, url: `${base}${pagePath}`, base, css: CSS })}<a href="#list" class="sr">דלג לרשימה</a>

${siteHeader(vm, home, nav)}

<main id="main">
<section class="dir-hero" aria-label="כותרת"><div class="wrap">
<nav class="crumb" aria-label="פירורי לחם"><a href="${home}">${esc(vm.name)}</a> · ${label}</nav>
<h1>${label} <span class="emd">ב${esc(vm.name)}</span></h1>
<div class="dir-tools">
<nav class="dir-tabs" aria-label="סוג"><a href="${home}pros/"${isPro ? ' aria-current="page"' : ''}>בעלי מקצוע</a><a href="${home}biz/"${!isPro ? ' aria-current="page"' : ''}>עסקים</a></nav>
<label class="dir-q">${svg('M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM20 20l-4-4', 19, 'currentColor', 2)}<span class="sr">חיפוש</span><input id="dir-q" type="search" autocomplete="off" placeholder="${isPro ? 'חשמלאי, אינסטלטור, מורה פרטי…' : 'מכולת, קצבייה, מתנות…'}"></label>
</div>
</div></section>

<section id="list" class="wrap dir-list" aria-label="${label}">
<div class="fchips" role="group" aria-label="סינון לפי תחום">
<button type="button" data-g="" aria-pressed="true">הכל</button>${data.groups.map((g) => `<button type="button" data-g="${esc(g)}" aria-pressed="false">${esc(g)}</button>`).join('')}
</div>
<div class="dgrid">
${data.items.map((p) => card(p, kind)).join('\n')}
</div>
<div class="dempty" id="dir-empty" hidden><b>לא מצאנו בשכונה את מה שחיפשת</b><span>נסו מילה אחרת, או בחרו "הכל".</span></div>
</section>

<section class="wrap" aria-label="לבעלי עסקים"><div class="join">
<div style="min-width:0;flex:1 1 320px"><b>עובדים בשכונה? <span class="em">תופיעו כאן.</span></b><span>פרופיל עם תמונה, טלפון, WhatsApp ו-Waze, מבצעים והמלצות מלקוחות.</span></div>
<a class="pill btn-dark" href="${APP}">להרשמת עסק</a>
</div></section>
</main>

${siteFooter()}

${api ? `<script>window.__SB=${JSON.stringify(api).replace(/</g, '\\u003c')};</script>` : ''}
<script>${JS}</script>
<script>${HOOD_JS}</script>
</body>
</html>
`;
}
