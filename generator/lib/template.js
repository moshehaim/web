import { formatPrayerTime, formatSelectedDays, sortPrayers, NUSACH } from './prayers.js';

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const enc = (s) => encodeURIComponent(s);

/* ── עיצוב ─────────────────────────────────────────────────────────
   ראש ורגל כהים בזהות המותג (navy + זהב), גוף בהיר וקריא.
   האלמנט החתימתי: טבלת המניינים מעוצבת כלוח המודעות של בית הכנסת —
   נייר קרם, קו זהב, טיפוגרפיה טבלאית. זה האובייקט האמיתי שהעמוד מחליף.
   ───────────────────────────────────────────────────────────────── */
const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
:root{--navy:#16294d;--navy-2:#1a3563;--blue:#2f5aa0;--gold:#f0a92d;--gold-2:#f6c56a;
--paper:#fffaf0;--paper-line:#e8d5b5;--ink:#2c3e50;--muted:#6b7280;--bg:#f5f7fa}
html{scroll-behavior:smooth}
body{font-family:'Assistant',-apple-system,'Segoe UI',sans-serif;background:var(--bg);
color:var(--ink);line-height:1.6}
a{color:inherit;text-decoration:none}
:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
.wrap{max-width:820px;margin:0 auto;padding:0 20px}

.top{background:radial-gradient(120% 140% at 85% -20%,var(--blue) 0%,var(--navy-2) 45%,var(--navy) 100%);
color:#fff;padding:14px 0}
.top .wrap{display:flex;align-items:center;justify-content:space-between;gap:12px}
.logo{display:flex;align-items:center;gap:9px;font-family:'Secular One',sans-serif;font-size:19px}
.logo img{width:32px;height:32px;border-radius:9px}
.top nav{font-size:14.5px;color:rgba(255,255,255,.72)}

.crumb{font-size:13.5px;color:var(--muted);padding:16px 0 0}
.crumb a{border-bottom:1px solid #d3d8e0}

header.hd{padding:14px 0 26px;border-bottom:1px solid #e3e7ee}
h1{font-family:'Secular One',sans-serif;font-weight:400;font-size:clamp(28px,5vw,40px);
line-height:1.15;color:var(--navy);margin-bottom:10px}
.meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.chip{font-size:13.5px;font-weight:600;background:#fff;border:1px solid #dfe4ec;
border-radius:999px;padding:5px 13px;color:#41506b}
.chip.gold{background:rgba(240,169,45,.13);border-color:rgba(240,169,45,.45);color:#8a5a00}
.addr{font-size:16.5px;color:#41506b}
.addr .note{display:block;font-size:14px;color:var(--muted);font-style:italic;margin-top:3px}

/* ── לוח המניינים ── */
.board{background:var(--paper);border:1px solid var(--paper-line);border-radius:14px;
padding:22px 20px;margin:26px 0;box-shadow:0 2px 14px rgba(22,41,77,.06)}
.board h2{font-family:'Secular One',sans-serif;font-weight:400;font-size:22px;color:var(--navy);
padding-bottom:12px;margin-bottom:4px;border-bottom:2px solid var(--gold)}
.row{display:grid;grid-template-columns:74px 1fr auto;gap:12px;align-items:baseline;
padding:11px 2px;border-bottom:1px solid rgba(232,213,181,.75)}
.row:last-child{border-bottom:0}
.row .t{font-weight:700;font-size:14.5px;color:#5d4e37}
.row .v{font-size:16.5px;font-weight:600;color:var(--ink);font-variant-numeric:tabular-nums}
.row .d{font-size:13px;color:var(--muted);text-align:left}
.row .n{grid-column:1/-1;font-size:13px;color:var(--muted);font-style:italic;margin-top:-4px}

.card{background:#fff;border:1px solid #e3e7ee;border-radius:14px;padding:20px;margin:20px 0}
.card h2{font-family:'Secular One',sans-serif;font-weight:400;font-size:20px;color:var(--navy);margin-bottom:12px}
.lesson{padding:10px 0;border-bottom:1px solid #eef1f6}
.lesson:last-child{border-bottom:0}
.lesson b{font-size:15.5px}
.lesson span{display:block;font-size:14px;color:var(--muted)}
.actions{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0}
.btn{border:1px solid #d7dce6;background:#fff;border-radius:11px;padding:11px 18px;
font-weight:600;font-size:15px;color:var(--navy)}
.btn:hover{border-color:var(--gold)}

.cta{background:linear-gradient(135deg,var(--navy-2),var(--navy));color:#fff;
border-radius:18px;padding:28px 24px;margin:30px 0;text-align:center}
.cta h2{font-family:'Secular One',sans-serif;font-weight:400;font-size:23px;margin-bottom:8px}
.cta p{color:rgba(255,255,255,.76);font-size:15.5px;margin-bottom:18px}
.cta a{display:inline-block;background:var(--gold);color:#3a2503;font-weight:700;
border-radius:12px;padding:13px 26px}

footer{background:var(--navy);color:rgba(255,255,255,.62);font-size:14px;
padding:26px 0;margin-top:40px}
footer a{color:rgba(255,255,255,.86);border-bottom:1px solid rgba(255,255,255,.3)}

.list{display:grid;gap:10px;margin:22px 0}
.item{background:#fff;border:1px solid #e3e7ee;border-radius:13px;padding:15px 17px;
transition:border-color .15s,transform .15s}
.item:hover{border-color:var(--gold);transform:translateY(-1px)}
.item .nm{font-size:17.5px;font-weight:700;color:var(--navy)}
.item .sub{font-size:14px;color:var(--muted);margin-top:2px}
.item .pv{font-size:14px;color:#41506b;margin-top:7px}
.lead{font-size:17px;color:#41506b;margin:14px 0 4px;max-width:44em}
@media(max-width:520px){.row{grid-template-columns:64px 1fr;gap:8px}.row .d{grid-column:2;text-align:right}}
`;

function shell({ title, desc, canonical, body, jsonld }) {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="he_IL">
<meta property="og:url" content="${esc(canonical)}">
<link rel="icon" href="/app_icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&family=Secular+One&display=swap" rel="stylesheet">
<style>${CSS}</style>
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
</head>
<body>
<div class="top"><div class="wrap">
  <a class="logo" href="/"><img src="/app_icon.png" alt=""><span>שכונה</span></a>
  <nav><a href="/minyanim-har-homa/">מניינים בהר חומה</a></nav>
</div></div>
${body}
<footer><div class="wrap">
  שכונה — מידע קהילתי להר חומה.
  הזמנים נמסרו על ידי מתפללים ועשויים להשתנות.
  <a href="/">על האפליקציה</a>
</div></footer>
</body>
</html>`;
}

export function synagoguePage({ syn, prayers, lessons, zmanim, base }) {
  const url = `${base}/minyanim-har-homa/${enc(syn.slug)}/`;
  const nusach = syn.prayer_nusach ? (NUSACH[syn.prayer_nusach] || NUSACH.other) : null;
  const sorted = sortPrayers(prayers, zmanim);

  const byType = {};
  for (const p of sorted) (byType[p.type] ||= []).push(p);

  const board = Object.entries(byType).map(([type, items]) => items.map((p, i) => {
    const time = formatPrayerTime(p.set, p.time);
    const days = formatSelectedDays(p.selected_days);
    const korb = p.is_open ? (type.includes('שחרית') ? ' (קרבנות)' :
                              type.includes('מנחה') ? ' (פתיחה)' : '') : '';
    return `<div class="row">
      <span class="t">${i === 0 ? esc(type) : ''}</span>
      <span class="v">${esc(time + korb)}</span>
      <span class="d">${esc(days)}</span>
      ${p.notes ? `<span class="n">${esc(p.notes)}</span>` : ''}
    </div>`;
  }).join('')).join('');

  const desc = prayers.length
    ? `זמני תפילה ב${syn.name}${syn.address ? `, ${syn.address}` : ''} — ` +
      `${Object.keys(byType).join(', ')}. ${prayers.length} מניינים בהר חומה, ירושלים.`
    : `${syn.name}${syn.address ? `, ${syn.address}` : ''} — בית כנסת בהר חומה, ירושלים.`;

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'PlaceOfWorship',
    name: syn.name,
    url,
    ...(syn.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: syn.address,
        addressLocality: 'ירושלים',
        addressCountry: 'IL',
      },
    }),
    ...(syn.latitude && {
      geo: { '@type': 'GeoCoordinates', latitude: syn.latitude, longitude: syn.longitude },
    }),
    ...(syn.is_accessible && { isAccessibleForFree: true }),
  };

  const body = `<div class="wrap">
<div class="crumb"><a href="/minyanim-har-homa/">מניינים בהר חומה</a> ← ${esc(syn.name)}</div>

<header class="hd">
  <h1>${esc(syn.name)}</h1>
  ${syn.address ? `<div class="addr">${esc(syn.address)}
    ${syn.access_notes ? `<span class="note">${esc(syn.access_notes)}</span>` : ''}</div>` : ''}
  <div class="meta">
    ${nusach ? `<span class="chip gold">נוסח ${esc(nusach)}</span>` : ''}
    ${syn.rabbi_name ? `<span class="chip">הרב ${esc(syn.rabbi_name)}</span>` : ''}
    ${syn.is_accessible ? '<span class="chip">נגיש</span>' : ''}
    ${syn.has_hall ? '<span class="chip">אולם אירועים</span>' : ''}
    ${syn.can_study_during_day ? '<span class="chip">פתוח ללמידה</span>' : ''}
  </div>
</header>

${sorted.length ? `<section class="board">
  <h2>זמני תפילה</h2>
  ${board}
</section>` : `<p class="lead">טרם נמסרו זמני תפילה לבית כנסת זה.</p>`}

${lessons.length ? `<section class="card">
  <h2>שיעורי תורה</h2>
  ${lessons.map((l) => `<div class="lesson">
    <b>${esc(l.topic || 'שיעור')}</b>
    <span>${esc([l.teacher && `נותן השיעור: ${l.teacher}`,
      l.day && `יום ${l.day}`, l.start_time].filter(Boolean).join(' · '))}</span>
  </div>`).join('')}
</section>` : ''}

${syn.latitude ? `<div class="actions">
  <a class="btn" href="https://waze.com/ul?ll=${syn.latitude},${syn.longitude}&navigate=yes"
     rel="nofollow noopener" target="_blank">ניווט ב-Waze</a>
  <a class="btn" href="https://www.google.com/maps/search/?api=1&query=${syn.latitude},${syn.longitude}"
     rel="nofollow noopener" target="_blank">פתיחה במפות</a>
</div>` : ''}

<section class="cta">
  <h2>המניין הקרוב אליך, עכשיו</h2>
  <p>באפליקציה: כל המניינים בהר חומה לפי מרחק ולפי השעה, בעלי מקצוע, גמ״חים ומבצעים.</p>
  <a href="/b">להורדת האפליקציה</a>
</section>
</div>`;

  return shell({ title: `זמני תפילה ב${syn.name} — הר חומה, ירושלים`, desc, canonical: url, body, jsonld });
}

export function indexPage({ synagogues, base, counts }) {
  const url = `${base}/minyanim-har-homa/`;
  const desc = `זמני תפילה ב-${counts.withPrayers} בתי כנסת בהר חומה (חומת שמואל), ירושלים — ` +
    `שחרית, מנחה וערבית, לפי נוסח וכתובת.`;

  const body = `<div class="wrap">
<header class="hd" style="margin-top:18px">
  <h1>מניינים וזמני תפילה בהר חומה</h1>
  <p class="lead">${counts.total} בתי כנסת בחומת שמואל, ירושלים.
     ${counts.withPrayers} מהם עם זמני תפילה מעודכנים שנמסרו על ידי מתפללי השכונה.</p>
</header>

<div class="list">
${synagogues.map((s) => `<a class="item" href="/minyanim-har-homa/${enc(s.slug)}/">
  <div class="nm">${esc(s.name)}</div>
  <div class="sub">${esc([s.address, s.prayer_nusach && `נוסח ${NUSACH[s.prayer_nusach] || NUSACH.other}`]
    .filter(Boolean).join(' · '))}</div>
  ${s.preview ? `<div class="pv">${esc(s.preview)}</div>` : ''}
</a>`).join('')}
</div>

<section class="cta">
  <h2>מצא את המניין הקרוב אליך</h2>
  <p>באפליקציה: כל המניינים לפי מרחק ולפי השעה הקרובה, וגם בעלי מקצוע, גמ״חים ומבצעים בשכונה.</p>
  <a href="/b">להורדת האפליקציה</a>
</section>
</div>`;

  return shell({
    title: 'מניינים וזמני תפילה בהר חומה — חומת שמואל, ירושלים',
    desc, canonical: url, body,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'בתי כנסת בהר חומה',
      numberOfItems: synagogues.length,
      itemListElement: synagogues.map((s, i) => ({
        '@type': 'ListItem', position: i + 1, name: s.name,
        url: `${base}/minyanim-har-homa/${enc(s.slug)}/`,
      })),
    },
  });
}

export function sitemap(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(u.loc)}</loc><changefreq>${u.freq}</changefreq><priority>${u.pri}</priority></url>`).join('\n')}
</urlset>
`;
}
