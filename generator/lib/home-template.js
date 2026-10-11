/**
 * עמוד הבית של שכונה — לפי העיצוב החדש (קנבס "Main").
 *
 * HTML מרונדר מראש (SEO, עובד בלי JS), ומעליו סקריפט קטן:
 * שעון + "התפילה הבאה", קרוסלות, לשוניות הלוח ובורר השכונה.
 * פעולות (התחברות, פרסום, יצירת קשר) עוברות לאפליקציה.
 */

export const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export const APP = '/app/';
const LOGIN = '/login.html';
const DOWNLOAD = '/b/';
const MINYANIM = '/minyanim-har-homa/';

export const ICON = {
  clock: 'M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16zM12 8v4l3 2',
  book: 'M4 5h7a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-5a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h5z',
  store: 'M3 9l1.5-5h15L21 9M3 9h18v2a3 3 0 0 1-6 0a3 3 0 0 1-6 0a3 3 0 0 1-6 0zM5 13v8h14v-8',
  wrench: 'M14.5 6.5a4 4 0 0 0-5.3 5.3L3 18l3 3 6.2-6.2a4 4 0 0 0 5.3-5.3l-2.6 2.6-2.4-.6-.6-2.4z',
  tag: 'M3 12V4h8l10 10-8 8zM7.5 7.5h.01',
  ticket: 'M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 0 0-4V4H3zM14 4v16',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  brief: 'M3 8h18v12H3zM8 8V5h8v3',
  bag: 'M4 7h16l-1.5 13h-13zM9 7V5a3 3 0 0 1 6 0v2',
  key: 'M3 11l9-7 9 7M5 10v10h14V10',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  tree: 'M12 3l6 9H6zM12 8l7 9H5zM12 17v4',
  school: 'M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5',
  hall: 'M4 20h16M6 20V8h12v12M9 8V5h6v3M10 20v-5h4v5',
  bed: 'M3 18V8M3 14h18v4M21 14v-3a3 3 0 0 0-3-3h-7v6',
  party: 'M4 20l4-12 8 8zM14 4v2M18 6l-1.5 1.5M20 10h-2M12 9l3-3',
  civic: 'M4 21V5h10v16M14 9h6v12M7 9h4M7 13h4M7 17h4',
  health: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',
};
export const svg = (d, size = 24, stroke = 'currentColor', w = 1.9) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

const ZONES = [
  ['מניינים', ICON.clock, 'blue', MINYANIM], ['שיעורי תורה', ICON.book, 'blue'],
  ['עסקים', ICON.store, 'sky', 'biz/'], ['בעלי מקצוע', ICON.wrench, 'sky', 'pros/'],
  ['מבצעים', ICON.tag, 'sky', '#promos'], ['קופונים', ICON.ticket, 'sky', '#promos'],
  ['שירותי קהילה', ICON.civic, 'teal'], ['גמ״חים', ICON.heart, 'green'], ['אירועים', ICON.star, 'green'],
  ['דרושים', ICON.brief, 'violet'], ['יד שנייה', ICON.bag, 'violet'], ['נדל״ן', ICON.key, 'violet', '#realestate'],
  ['אולמות אירועים', ICON.hall, 'amber'], ['אירוח', ICON.bed, 'amber'], ['הכל לאירוע', ICON.party, 'amber'],
  ['מוסדות חינוך', ICON.school, 'teal'], ['גנים ופארקים', ICON.tree, 'teal'], ['בריאות', ICON.health, 'teal'],
];

const PHONES = [['מוקד עירוני', '106'], ['מד״א', '101', 1], ['משטרה', '100', 1], ['כיבוי והצלה', '102', 1], ['חברת החשמל', '103']];

const FAQ = [
  ['מה זה שכונה?', 'אתר ואפליקציה שמרכזים את כל מה שקורה בשכונה: מניינים ושיעורים, עסקים ובעלי מקצוע, גמ״חים, מבצעים, דרושים ויד שנייה.'],
  ['מי מעדכן את זמני התפילה?', 'הגבאים והשכנים מעדכנים את הזמנים, וכל שינוי מופיע באתר ובאפליקציה.'],
  ['איך מוסיפים עסק או בעל מקצוע?', 'דרך כפתור "פרסם" באפליקציה. ממלאים פרטים, והעסק עולה לשכונה.'],
  ['באילו שכונות זה פועל?', 'כרגע בחומת שמואל, ושכונות נוספות בירושלים והסביבה בדרך.'],
];

export const CSS = `
*,*::before,*::after{box-sizing:border-box}
:root{--navy:#172F57;--navy2:#213E6E;--brand:#244782;--sky:#8CCBF2;--accent:#2A6FB8;--ink:#1C2B45;
--muted:#6B7689;--line:#E6E9EF;--bg:#F6F7F9;--soft:#EAF1FA;--ok:#5CD49A;--red:#B4233C}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font-family:'Assistant',-apple-system,'Segoe UI',sans-serif;line-height:1.5}
a{color:var(--brand)}a:hover{color:#1B3766}
img{display:block;max-width:100%}
button{font:inherit}
:focus-visible{outline:3px solid var(--sky);outline-offset:2px}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.wrap{max-width:1280px;margin:0 auto;padding-inline:28px}
@media (max-width:620px){.wrap{padding-inline:16px}}
.em{font-family:'Frank Ruhl Libre',serif;font-weight:900;color:var(--accent);background-image:linear-gradient(transparent 72%,rgba(42,147,213,.22) 72%);padding:0 2px}
.emd{font-family:'Frank Ruhl Libre',serif;font-weight:900;color:var(--sky);background-image:linear-gradient(transparent 72%,rgba(140,203,242,.25) 72%);padding:0 2px}
.lift{transition:transform .18s ease,box-shadow .18s ease}
.lift:hover{transform:translateY(-3px);box-shadow:0 14px 28px rgba(23,47,87,.14)}
.mono{font-family:'IBM Plex Mono',ui-monospace,monospace;font-weight:600}
.pill{display:inline-flex;align-items:center;gap:6px;height:46px;padding:0 18px;border-radius:999px;font-weight:800;text-decoration:none;white-space:nowrap}

/* header */
.hdr{background:#fff;border-bottom:1px solid var(--line);position:sticky;top:0;z-index:20}
.hdr-row{display:flex;flex-wrap:wrap;align-items:center;gap:12px 16px;padding-block:12px}
.logo img{width:52px;height:52px}
.hood{position:relative}
.hood-btn{display:flex;align-items:center;gap:10px;height:52px;padding:0 12px 0 10px;border-radius:14px;border:1.5px solid #DCE5F5;background:#F5F8FF;cursor:pointer;color:var(--navy)}
.hood-btn small{display:block;font-size:12px;font-weight:700;color:var(--muted);text-align:right}
.hood-btn b{display:block;font-size:18px;font-weight:800;max-width:230px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hood-pop{position:absolute;top:60px;right:0;width:min(440px,calc(100vw - 32px));background:#fff;border-radius:18px;box-shadow:0 18px 48px rgba(15,27,48,.22);border:1px solid var(--line);padding:14px;display:flex;flex-direction:column;gap:12px;z-index:30}
.hood-pop[hidden]{display:none}
.hood-q{display:flex;align-items:center;gap:8px;height:44px;padding:0 12px;border-radius:12px;background:#F4F5F7;border:1px solid var(--line)}
.hood-q input{flex:1;min-width:0;border:0;outline:0;background:transparent;font:inherit;font-size:15px;color:var(--ink)}
.hood-list{display:flex;flex-direction:column;max-height:340px;overflow-y:auto}
.hood-item{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px;border-radius:12px;text-decoration:none;color:var(--ink);font-size:16px;font-weight:800}
a.hood-item:hover{background:#F5F8FF}
.hood-item.off{color:#8A94A6;font-weight:700}
.badge{flex:none;font-size:12px;font-weight:800;border-radius:7px;padding:2px 9px;background:#EAF0F9;color:var(--brand)}
.badge.on{background:var(--brand);color:#fff}
.hdr-actions{display:flex;align-items:center;gap:8px;margin-inline-start:auto;flex-wrap:wrap}
.btn-ghost{color:var(--navy);padding:0 12px}
.btn-line{border:1.5px solid var(--brand);color:var(--brand)}
.btn-dark{background:var(--navy);color:#fff}.btn-dark:hover{color:#fff;background:#0F1F3B}
@media (max-width:760px){.hdr-row{flex-wrap:nowrap;gap:10px;padding-block:10px}.logo img{width:44px;height:44px}
.hood{min-width:0}.hood-btn{height:46px;max-width:100%}.hood-btn b{max-width:150px}
.hdr-actions .btn-line,.hdr-actions .btn-dark{display:none}.hdr-actions .btn-ghost{width:46px;padding:0;justify-content:center}
.btn-ghost .lbl{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}}
.m-only{display:none}@media (max-width:760px){.m-only{display:inline-flex}}
.chips{border-top:1px solid #EEF0F4;overflow-x:auto;scrollbar-width:none}.chips::-webkit-scrollbar{display:none}
.chips .wrap{display:flex;gap:6px;padding-block:8px;width:max-content;min-width:100%}
.chips a{flex:none;font-size:15px;font-weight:700;color:#3B4860;text-decoration:none;padding:6px 14px;border-radius:999px;background:#F4F5F7}
.chips a:hover{background:#EFF4FF;color:var(--brand)}

/* hero */
.hero{background:var(--navy);color:#fff;position:relative;overflow:hidden}
.hero-sky{position:absolute;bottom:46px;left:0}
.hero-row{display:flex;flex-wrap:wrap;gap:36px;padding-block:44px 40px;position:relative}
.hero-text{flex:1 1 420px;min-width:0;display:flex;flex-direction:column;gap:18px;justify-content:center}
.now{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:700;color:#A9BAD4}
.dot{width:8px;height:8px;border-radius:50%;background:var(--ok);animation:pulse 1.6s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
.hero h1{margin:0;font-size:clamp(36px,6vw,58px);font-weight:800;line-height:1.05}
.hero p{margin:0;font-size:19px;line-height:1.6;color:#C9D6EA;max-width:520px}
.tiles{flex:1 1 420px;min-width:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-content:center}
@media (max-width:460px){.tiles{grid-template-columns:minmax(0,1fr)}}
.tile{display:flex;align-items:center;gap:12px;padding:16px;border-radius:18px;background:var(--navy2);color:#fff;text-decoration:none}
.tile:hover{color:#fff}
.tile i{width:44px;height:44px;border-radius:12px;background:var(--sky);display:flex;align-items:center;justify-content:center;flex:none;color:var(--navy)}
.tile b{display:block;font-size:18px}.tile span{display:block;font-size:14px;color:#A9BAD4}
.tick-wrap{background:rgba(0,0,0,.18);border-top:1px solid rgba(255,255,255,.08);overflow:hidden}
.tick{display:flex;gap:48px;width:max-content;padding-block:12px;font-size:16px;font-weight:600;white-space:nowrap;animation:mq 45s linear infinite}
.tick-wrap:hover .tick{animation-play-state:paused}
.tick span{display:inline-flex;align-items:center;gap:10px}
.tick em{font-style:normal;background:var(--sky);color:var(--navy);font-size:12px;font-weight:800;padding:2px 8px;border-radius:6px}

/* sections */
.sec{padding-block:52px 8px;display:flex;flex-direction:column;gap:20px}
.sec-head{display:flex;align-items:end;justify-content:space-between;gap:16px;flex-wrap:wrap}
.sec-head small{display:block;font-size:14px;font-weight:800;color:var(--muted)}
.sec-head h2{margin:0;font-size:clamp(28px,4vw,38px);font-weight:800;color:var(--navy)}
.ctrls{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.arrow{width:44px;height:44px;border-radius:50%;border:1px solid #DCE2EC;background:#fff;cursor:pointer;font-size:20px;color:var(--navy)}
.more{font-weight:800;text-decoration:none;margin-inline-start:6px}

.car{--v:4;overflow:hidden;padding-block:4px 18px}
.car-pro{--v:5}
@media (max-width:1180px){.car{--v:3}.car-pro{--v:4}}
@media (max-width:900px){.car{--v:2}.car-pro{--v:3}}
@media (max-width:620px){.car{--v:1}.car-pro{--v:2}}
@media (max-width:340px){.car-pro{--v:1}}
.track{display:flex;gap:16px;transition:transform .7s cubic-bezier(.4,.1,.2,1)}
.slide{flex:0 0 calc((100% - (var(--v) - 1) * 16px) / var(--v));min-width:0}
.slide[hidden]{display:none}
.grid-auto{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(280px,100%),1fr));gap:16px}

.card{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.07);display:flex;flex-direction:column;height:100%;text-decoration:none;color:var(--ink)}
.card:hover{color:var(--ink)}
.media{position:relative;aspect-ratio:16/10;background:var(--brand);overflow:hidden}
.media img{width:100%;height:100%;object-fit:cover}
.media .tag{position:absolute;top:12px;right:12px;font-size:13px;font-weight:800;padding:4px 10px;border-radius:8px;background:#fff;color:var(--navy)}
.media .price{position:absolute;bottom:12px;right:12px;font-size:17px;background:rgba(15,27,48,.82);color:#fff;padding:4px 10px;border-radius:10px}
.body{padding:14px 16px 16px;display:flex;flex-direction:column;gap:6px;flex:1}
.body b{font-size:18px;font-weight:800;line-height:1.3}
.body .sub{font-size:14px;color:#566173}
.body .fine{font-size:12px;color:var(--muted);margin-top:auto}
.clamp2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.coupon{outline:2px dashed #9DB8DF;outline-offset:-2px}
.promo-cta{background:var(--navy);color:#fff;border-radius:20px;padding:24px;text-decoration:none;display:flex;flex-direction:column;justify-content:center;gap:8px;min-height:200px}
.promo-cta:hover{color:#fff}.promo-cta b{font-size:24px}.promo-cta span{color:#C9D6EA}

.pro .media{aspect-ratio:4/3;background:#DCE5F5}
.pro .field{font-size:14px;font-weight:700;color:var(--accent)}
.rec{display:inline-flex;align-items:center;gap:4px;font-size:13px;font-weight:800;color:#15803D}

.mq-wrap{overflow:hidden;display:flex;flex-direction:column;gap:14px;padding-block:6px}
.mq{display:flex;gap:14px;width:max-content;animation:mq 60s linear infinite}
.mq.rev{animation:mqr 70s linear infinite}
.mq-wrap:hover .mq{animation-play-state:paused}
@keyframes mq{from{transform:translateX(0)}to{transform:translateX(50%)}}
@keyframes mqr{from{transform:translateX(50%)}to{transform:translateX(0)}}
.biz{display:flex;align-items:center;gap:12px;padding:8px 18px 8px 8px;border-radius:999px;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.06);text-decoration:none;color:var(--ink);white-space:nowrap}
.biz:hover{color:var(--ink)}
.biz img{width:48px;height:48px;border-radius:50%;object-fit:cover;background:#DCE5F5}
.biz b{display:block;font-size:16px;max-width:260px;overflow:hidden;text-overflow:ellipsis}
.biz span{display:block;font-size:13px;color:var(--muted)}

.seg{display:flex;gap:4px;background:#EEF1F5;padding:4px;border-radius:12px}
.seg button{border:0;background:transparent;border-radius:9px;padding:8px 14px;font-size:15px;font-weight:700;color:#3B4860;cursor:pointer;white-space:nowrap}
.seg button[aria-pressed=true],.seg button[aria-selected=true]{background:#fff;color:var(--brand);font-weight:800;box-shadow:0 1px 4px rgba(0,0,0,.08)}

/* board */
.board-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;padding-block:52px}
.span2{grid-column:span 2}
@media (max-width:1100px){.board-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.span2{grid-column:1/-1;order:3}}
@media (max-width:700px){.board-grid{grid-template-columns:minmax(0,1fr)}}
.panel{background:#fff;border-radius:22px;padding:22px;display:flex;flex-direction:column;gap:2px;box-shadow:0 2px 12px rgba(0,0,0,.05);min-width:0}
.panel h2{margin:0 0 8px;font-size:24px;font-weight:800;color:var(--navy)}
.panel-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px}
.pray{background:var(--navy);color:#fff}
.pray h2{color:#fff}
.clock{font-size:16px;color:var(--sky);direction:ltr}
.prow{display:grid;grid-template-columns:62px minmax(0,1fr) auto;gap:10px;align-items:center;min-height:56px;border-top:1px solid rgba(255,255,255,.1);text-decoration:none;color:#fff}
.prow:hover{color:#fff;background:rgba(255,255,255,.04)}
.prow .t{font-size:17px;background:var(--navy2);border-radius:8px;text-align:center;padding:3px 0}
.prow b{display:block;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.prow small{display:block;font-size:13px;color:#A9BAD4}
.prow .when{font-size:13px;font-weight:800;color:var(--ok);white-space:nowrap}
.pray .all{color:var(--sky);font-weight:800;font-size:14px;text-decoration:none;padding-top:10px;margin-top:auto}
.tabs{overflow-x:auto;scrollbar-width:none;margin-bottom:6px}.tabs::-webkit-scrollbar{display:none}
.bitem{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:54px;border-bottom:1px solid #EEF0F4;text-decoration:none;color:var(--ink)}
.bitem:hover{color:var(--ink);background:#FAFBFC}
.bitem b{display:block;font-size:16px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bitem small{display:block;font-size:13px;color:var(--muted)}
.bitem>span:first-child{min-width:0}
.bbadge{flex:none;font-size:13px;font-weight:800;background:#EFF4FF;color:var(--brand);border-radius:8px;padding:3px 10px}
.bempty{padding:18px 0;color:var(--muted)}
[role=tabpanel][hidden]{display:none}
.phones{border-top:5px solid var(--red)}
.phone{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:48px;border-top:1px solid #EEF0F4;text-decoration:none;color:var(--ink);font-weight:700}
.phone .n{font-size:18px;color:var(--brand)}.phone .n.hot{color:var(--red)}

.zones{display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:10px}
.zone{background:#fff;border-radius:18px;padding:16px 10px;text-decoration:none;color:var(--ink);display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;box-shadow:0 2px 10px rgba(0,0,0,.04);font-size:15px;font-weight:800}
.zone:hover{color:var(--ink)}
.zone i{width:48px;height:48px;border-radius:15px;display:flex;align-items:center;justify-content:center}
.z-blue{background:#EFF4FF;color:#244782}.z-sky{background:#E7F1FB;color:#1F78B4}.z-green{background:#E7F7EC;color:#15803D}
.z-violet{background:#F1EDFB;color:#6D4BB8}.z-teal{background:#E3F5F3;color:#0F766E}.z-amber{background:#FBF3E1;color:#8A5A00}

.owners{background:var(--navy);color:#fff;margin-top:52px}
.owners .wrap{padding-block:52px;display:flex;flex-wrap:wrap;gap:36px;align-items:center}
.owners .txt{flex:1 1 420px;min-width:0;display:flex;flex-direction:column;gap:14px}
.owners h2{margin:0;font-size:clamp(30px,4.4vw,42px);font-weight:800;line-height:1.12}
.owners p{margin:0;font-size:18px;line-height:1.6;color:#C9D6EA}
.owners .feat{flex:1 1 340px;min-width:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.owners .feat div{background:var(--navy2);border-radius:18px;padding:18px}
.owners .feat b{display:block;font-size:18px}.owners .feat span{font-size:14px;color:#C9D6EA}
.btn-sky{background:var(--sky);color:var(--navy);height:52px;padding:0 26px}
.btn-out{border:2px solid rgba(255,255,255,.45);color:#fff;height:52px;padding:0 26px}.btn-out:hover{color:#fff}

.faq{padding-block:52px;display:flex;flex-wrap:wrap;gap:28px}
.faq h2{flex:1 1 240px;margin:0;font-size:30px;font-weight:800;color:var(--navy)}
.faq .list{flex:3 1 520px;min-width:0;display:flex;flex-direction:column;gap:8px}
.faq details{background:#fff;border-radius:14px;padding:16px 20px;box-shadow:0 2px 10px rgba(0,0,0,.04)}
.faq summary{cursor:pointer;list-style:none;font-size:17px;font-weight:800;display:flex;justify-content:space-between;gap:12px}
.faq summary::-webkit-details-marker{display:none}
.faq summary::after{content:'+';color:var(--brand)}
.faq details[open] summary::after{content:'−'}
.faq p{margin:10px 0 0;font-size:16px;line-height:1.6;color:#3B4860}

footer{background:#fff;border-top:1px solid var(--line)}
footer .wrap{padding-block:32px;display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;font-size:15px;color:var(--muted)}
footer img{width:48px;height:48px}
footer nav{display:flex;gap:18px;flex-wrap:wrap;justify-content:center}
footer a{color:var(--muted)}
footer .c{font-size:13px;color:#8A94A6}

@media (prefers-reduced-motion:reduce){.mq,.mq.rev,.tick,.dot{animation:none}.track{transition:none}.lift:hover{transform:none}}
`;

/* ── חלקים ──────────────────────────────────────────────────────── */

const head2 = (small, a, b) =>
  `<div><small>${esc(small)}</small><h2>${esc(a)} <span class="em">${esc(b)}</span></h2></div>`;

const arrows = (id) =>
  `<button type="button" class="arrow" data-prev="${id}" aria-label="הקודם">→</button>` +
  `<button type="button" class="arrow" data-next="${id}" aria-label="הבא">←</button>`;

const img = (src, alt) => `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async">`;

function promoCard(p) {
  return `<a href="${APP}" class="card lift${p.coupon ? ' coupon' : ''}">
<div class="media">${img(p.img, p.title)}<span class="tag">${esc(p.kind)}</span></div>
<div class="body"><b class="clamp2">${esc(p.title)}</b>${p.provider ? `<span class="sub">${esc(p.provider)}</span>` : ''}<span class="fine">${esc(p.until)}${p.coupon ? ' · הקוד באפליקציה' : ''}</span></div>
</a>`;
}

function promosSection(promos) {
  const cta = `<a href="${APP}" class="promo-cta lift"><b>המבצע שלך <span class="emd">כאן</span></b><span>פרסום מבצע עם התראה לשכונה</span></a>`;
  const carousel = promos.length > 4;
  const body = carousel
    ? `<div class="car" data-car="promos" data-auto="5000"><div class="track">${promos.map((p) => `<div class="slide">${promoCard(p)}</div>`).join('')}</div></div>`
    : `<div class="grid-auto">${promos.map(promoCard).join('')}${cta}</div>`;
  return `<section id="promos" aria-label="מבצעים וקופונים" style="background:var(--soft);padding-block:48px">
<div class="wrap" style="display:flex;flex-direction:column;gap:20px">
<div class="sec-head">${head2('מעסקי השכונה', 'מבצעים', 'וקופונים')}<div class="ctrls">${carousel ? arrows('promos') : ''}<a class="more" href="${APP}">הכל ←</a></div></div>
${body}
</div></section>`;
}

function prosSection(pros) {
  if (!pros.length) return '';
  return `<section id="pros" aria-label="בעלי מקצוע" class="wrap sec">
<div class="sec-head">${head2('לבית, למשפחה ולאירועים', 'בעלי מקצוע', 'בשכונה')}<div class="ctrls">${arrows('pros')}<a class="more" href="pros/">לכל בעלי המקצוע ←</a></div></div>
<div class="car car-pro" data-car="pros" data-auto="4000"><div class="track">
${pros.map((p) => `<div class="slide"><a href="pros/" class="card pro lift">
<div class="media">${img(p.img, p.name)}</div>
<div class="body"><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.name)}</b><span class="field">${esc(p.field)}</span>${p.rec ? `<span class="rec">${svg(ICON.heart, 14, 'currentColor', 2)}${p.rec === 1 ? 'המלצה אחת' : `${p.rec} המלצות`}</span>` : ''}</div>
</a></div>`).join('\n')}
</div></div>
</section>`;
}

function bizSection(biz) {
  if (!biz.length) return '';
  const pill = (b) => `<a href="biz/" class="biz lift">${img(b.img, '')}<span><b>${esc(b.name)}</b><span>${esc(b.type)}</span></span></a>`;
  const half = Math.ceil(biz.length / 2);
  const row = (list, cls) => `<div class="mq${cls}">${list.map(pill).join('')}<span style="display:contents" aria-hidden="true">${list.map(pill).join('')}</span></div>`;
  return `<section id="biz" aria-label="עסקים בשכונה" class="sec" style="padding-bottom:16px">
<div class="wrap sec-head">${head2('מעבירים עכבר כדי לעצור', 'עסקים', 'בשכונה')}<a class="more" href="biz/">לאלפון העסקים ←</a></div>
<div class="mq-wrap">${row(biz.slice(0, half), '')}${biz.length > 6 ? row(biz.slice(half), ' rev') : ''}</div>
</section>`;
}

function realEstateSection(list) {
  if (!list.length) return '';
  const kinds = ['הכל', ...['למכירה', 'להשכרה'].filter((k) => list.some((r) => r.kind === k))];
  return `<section id="realestate" aria-label="נדל״ן" class="wrap sec">
<div class="sec-head">${head2('דירות מהשכונה, עם תמונות', 'נדל״ן', 'בשכונה')}<div class="ctrls">
${kinds.length > 2 ? `<div class="seg" role="group" aria-label="סוג עסקה">${kinds.map((k, i) => `<button type="button" data-re="${esc(k)}" aria-pressed="${i === 0}">${esc(k)}</button>`).join('')}</div>` : ''}
${arrows('re')}<a class="more" href="${APP}">לכל הדירות ←</a></div></div>
<div class="car" data-car="re" data-auto="5000"><div class="track">
${list.map((r) => `<div class="slide" data-kind="${esc(r.kind)}"><a href="${APP}" class="card lift">
<div class="media">${img(r.img, r.title)}<span class="tag">${esc(r.kind)}</span><span class="price mono">${esc(r.price)}</span></div>
<div class="body"><b>${esc(r.title)}</b><span class="sub">${esc(r.meta)}</span><span class="fine">${esc(r.street)}</span></div>
</a></div>`).join('\n')}
</div></div>
</section>`;
}

const typeOrder = ['שחרית', 'מנחה', 'ערבית'];
/** שורות התפילה הבאה — אותו חישוב רץ גם בדפדפן (ראו CLIENT_JS). */
function nextPrayers(prayers, nowMin, dow) {
  return typeOrder.map((t) => {
    const of = prayers.filter((p) => p.t === t);
    let p = of.find((x) => x.d.includes(dow) && x.m >= nowMin);
    let when = '';
    if (p) when = p.m - nowMin <= 60 ? `בעוד ${p.m - nowMin} דק׳` : 'היום';
    else { p = of.find((x) => x.d.includes((dow + 1) % 7)); when = 'מחר'; }
    return p ? { ...p, when } : null;
  }).filter(Boolean);
}
const prow = (p) => `<a class="prow" href="${MINYANIM}"><span class="t mono">${esc(p.c)}</span><span><b>${esc(p.n)}</b><small>${esc(p.t)}${p.l ? ' · ' + esc(p.l) : ''}</small></span><span class="when">${esc(p.when)}</span></a>`;

function boardSection(vm) {
  const tabs = vm.board;
  const first = Math.max(0, tabs.findIndex((t) => t.items.length));
  const now = new Date(vm.builtAt);
  const jt = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
  const ssr = nextPrayers(vm.prayers, jt.getHours() * 60 + jt.getMinutes(), jt.getDay());

  return `<section id="board" aria-label="לוח השכונה" class="wrap"><div class="board-grid">

<div class="panel pray">
<div class="panel-head"><h2>תפילות <span class="emd">קרובות</span></h2><span class="clock mono" data-clock></span></div>
<div data-next-prayers>${ssr.map(prow).join('')}</div>
<a class="all" href="${MINYANIM}">כל המניינים ←</a>
</div>

<div class="panel span2">
<div class="panel-head"><h2>לוח <span class="em">השכונה</span></h2><a href="${APP}" style="font-weight:800;font-size:14px;text-decoration:none">+ פרסום בלוח</a></div>
<div class="seg tabs" role="tablist" aria-label="לוח השכונה">
${tabs.map((t, i) => `<button type="button" role="tab" id="tab-${t.key}" aria-controls="tp-${t.key}" aria-selected="${i === first}" tabindex="${i === first ? 0 : -1}">${esc(t.label)}</button>`).join('')}
</div>
${tabs.map((t, i) => `<div role="tabpanel" id="tp-${t.key}" aria-labelledby="tab-${t.key}"${i === first ? '' : ' hidden'}>
${t.items.length
    ? t.items.slice(0, 5).map((x) => `<a class="bitem" href="${APP}"><span><b>${esc(x.t)}</b><small>${esc(x.sub)}</small></span>${x.b ? `<span class="bbadge">${esc(x.b)}</span>` : ''}</a>`).join('')
    : `<p class="bempty">אין כרגע מודעות ב${esc(t.label)}. רוצים לפרסם? זה דרך האפליקציה.</p>`}
<a href="${APP}" style="display:inline-block;font-weight:800;font-size:14px;text-decoration:none;margin-top:10px">${esc(t.more)} ←</a>
</div>`).join('\n')}
</div>

<div class="panel phones">
<h2>טלפונים <span class="em">חשובים</span></h2>
${PHONES.map(([n, num, hot]) => `<a class="phone" href="tel:${num}"><span>${esc(n)}</span><span class="n mono${hot ? ' hot' : ''}">${num}</span></a>`).join('')}
</div>

</div></section>`;
}

function ticker(vm) {
  const items = [
    ...vm.promos.map((p) => ['מבצע', p.provider ? `${p.provider}: ${p.title}` : p.title]),
    ...(vm.board.find((b) => b.key === 'jobs')?.items || []).slice(0, 3).map((x) => ['דרושים', x.t]),
    ...(vm.board.find((b) => b.key === 'second')?.items || []).slice(0, 3).map((x) => ['יד שנייה', x.t]),
    ...(vm.board.find((b) => b.key === 'lost')?.items || []).slice(0, 2).map((x) => [x.b === 'אבד' ? 'אבידה' : 'מציאה', x.t]),
  ];
  if (items.length < 3) return '';
  const once = items.map(([t, s]) => `<span><em>${esc(t)}</em>${esc(s)}</span>`).join('');
  return `<div class="tick-wrap"><div class="tick">${once}<span style="display:contents" aria-hidden="true">${once}</span></div></div>`;
}

/* ── סקריפט לקוח ───────────────────────────────────────────────── */

export const HOOD_JS = `(function(){
/* בורר שכונה */
var hb=document.getElementById('hood-btn'),hp=document.getElementById('hood-pop'),hq=document.getElementById('hood-q');
function setHood(o){hp.hidden=!o;hb.setAttribute('aria-expanded',o);if(o)hq.focus();}
if(hb){hb.addEventListener('click',function(e){e.stopPropagation();setHood(hp.hidden);});
  hp.addEventListener('click',function(e){e.stopPropagation();});
  document.addEventListener('click',function(){setHood(false);});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!hp.hidden){setHood(false);hb.focus();}});
  hq.addEventListener('input',function(){var q=hq.value.trim();
    [].forEach.call(hp.querySelectorAll('.hood-item'),function(it){it.hidden=!!q&&it.textContent.indexOf(q)<0;});});}
})();`;

const CLIENT_JS = `
(function(){
var TZ='Asia/Jerusalem',DAYS=['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
function jnow(){var s=new Date().toLocaleString('en-US',{timeZone:TZ});return new Date(s);}
function pad(n){return(n<10?'0':'')+n;}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

/* שעון, ברכה, תפילה הבאה */
var P=[];try{P=JSON.parse(document.getElementById('prayers-data').textContent);}catch(e){}
var clock=document.querySelector('[data-clock]'),np=document.querySelector('[data-next-prayers]'),
    day=document.querySelector('[data-day]'),greet=document.querySelector('[data-greet]');
var TYPES=['שחרית','מנחה','ערבית'],lastMin=-1;
function nextList(nowMin,dow){return TYPES.map(function(t){
  var of=P.filter(function(p){return p.t===t;}),p=null,w='';
  for(var i=0;i<of.length;i++){if(of[i].d.indexOf(dow)>=0&&of[i].m>=nowMin){p=of[i];break;}}
  if(p){w=p.m-nowMin<=60?'בעוד '+(p.m-nowMin)+' דק׳':'היום';}
  else{for(var j=0;j<of.length;j++){if(of[j].d.indexOf((dow+1)%7)>=0){p=of[j];break;}}w='מחר';}
  return p?{p:p,w:w}:null;}).filter(Boolean);}
function tick(){
  var n=jnow(),h=n.getHours(),m=h*60+n.getMinutes();
  if(clock)clock.textContent=pad(h)+':'+pad(n.getMinutes())+':'+pad(n.getSeconds());
  if(m===lastMin)return;lastMin=m;
  if(day)day.textContent='יום '+DAYS[n.getDay()];
  if(greet)greet.textContent=h<5?'לילה טוב':h<12?'בוקר טוב':h<17?'צהריים טובים':h<21?'ערב טוב':'לילה טוב';
  if(np&&P.length){np.innerHTML=nextList(m,n.getDay()).map(function(x){var p=x.p;
    return '<a class="prow" href="${MINYANIM}"><span class="t mono">'+esc(p.c)+'</span><span><b>'+esc(p.n)+'</b><small>'+esc(p.t)+(p.l?' · '+esc(p.l):'')+'</small></span><span class="when">'+esc(x.w)+'</span></a>';}).join('');}
}
tick();setInterval(tick,1000);

/* קרוסלות */
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var cars={};
[].forEach.call(document.querySelectorAll('[data-car]'),function(el){
  var id=el.getAttribute('data-car'),track=el.querySelector('.track'),i=0,paused=false;
  function slides(){return [].filter.call(track.children,function(s){return !s.hidden;});}
  function per(){return parseInt(getComputedStyle(el).getPropertyValue('--v'),10)||1;}
  function go(n){var s=slides(),max=Math.max(0,s.length-per());i=n>max?0:n<0?max:n;
    var w=s[0]?s[0].getBoundingClientRect().width+16:0;track.style.transform='translateX('+(i*w)+'px)';}
  var c=cars[id]={go:go,get i(){return i;},reset:function(){i=0;go(0);}};
  el.addEventListener('mouseenter',function(){paused=true;});el.addEventListener('mouseleave',function(){paused=false;});
  el.addEventListener('focusin',function(){paused=true;});el.addEventListener('focusout',function(){paused=false;});
  var auto=+el.getAttribute('data-auto');
  if(auto&&!reduce)setInterval(function(){if(!paused&&!document.hidden)go(i+1);},auto);
  window.addEventListener('resize',function(){go(i);});
});
document.addEventListener('click',function(e){
  var b=e.target.closest('[data-next],[data-prev]');if(!b)return;
  var id=b.getAttribute('data-next')||b.getAttribute('data-prev'),c=cars[id];if(!c)return;
  c.go(c.i+(b.hasAttribute('data-next')?1:-1));
});

/* נדל״ן: הכל / למכירה / להשכרה */
[].forEach.call(document.querySelectorAll('[data-re]'),function(b){b.addEventListener('click',function(){
  var k=b.getAttribute('data-re');
  [].forEach.call(document.querySelectorAll('[data-re]'),function(x){x.setAttribute('aria-pressed',x===b);});
  [].forEach.call(document.querySelectorAll('[data-car=re] .slide'),function(s){s.hidden=k!=='הכל'&&s.getAttribute('data-kind')!==k;});
  cars.re&&cars.re.reset();
});});

/* לשוניות הלוח */
var tabs=[].slice.call(document.querySelectorAll('[role=tab]'));
function sel(t){tabs.forEach(function(x){var on=x===t;x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1;
  document.getElementById(x.getAttribute('aria-controls')).hidden=!on;});}
tabs.forEach(function(t,i){t.addEventListener('click',function(){sel(t);});
  t.addEventListener('keydown',function(e){var d=e.key==='ArrowLeft'?1:e.key==='ArrowRight'?-1:0;
    if(d){var n=tabs[(i+d+tabs.length)%tabs.length];sel(n);n.focus();e.preventDefault();}});});

})();
`;

/* ── העמוד ─────────────────────────────────────────────────────── */


/* ── מעטפת משותפת (ראש, כותרת, תחתית) לעמוד הבית ולרשימות ── */

export function pageHead({ title, desc, url, base, css = '' }) {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<link rel="icon" href="/app_icon.png">
<meta property="og:type" content="website">
<meta property="og:locale" content="he_IL">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(base)}/app_icon.png">
<meta name="theme-color" content="#172F57">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700;800&family=Frank+Ruhl+Libre:wght@900&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet">
<link rel="preconnect" href="https://mebomrqnfnbqijiuawdh.supabase.co">
<style>${CSS}${css}</style>
</head>
<body>
`;
}

export function siteHeader(vm, pagePath, navChips) {
  const multi = vm.subs.length > 1;
  return `<header class="hdr">
<div class="wrap hdr-row">
<a class="logo" href="/" aria-label="שכונה — דף הבית"><img src="/app_icon.png" alt="שכונה" width="52" height="52"></a>
<div class="hood">
<button type="button" class="hood-btn" id="hood-btn" aria-haspopup="dialog" aria-expanded="false" aria-controls="hood-pop">
${svg('M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 7a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5', 20, '#244782', 2)}
<span><small>${multi ? `קהילה · ${vm.subs.length} שכונות` : 'השכונה שלך'}</small><b>${esc(vm.name)}</b></span>
${svg('M6 9l6 6 6-6', 16, '#244782', 2.4)}
</button>
<div class="hood-pop" id="hood-pop" role="dialog" aria-label="בחירת שכונה" hidden>
<label class="hood-q">${svg('M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM20 20l-4-4', 17, '#6B7689', 2)}<span class="sr">חיפוש שכונה</span><input id="hood-q" type="search" placeholder="חיפוש שכונה…" autocomplete="off"></label>
<div class="hood-list">
${vm.hoods.map((h) => h.current
    ? `<a class="hood-item" href="${esc(pagePath)}" aria-current="page"><span>${esc(h.name)}</span><span class="badge on">נבחרה</span></a>`
    : h.active
      ? `<a class="hood-item" href="/"><span>${esc(h.name)}</span><span class="badge on">פעילה</span></a>`
      : `<div class="hood-item off"><span>${esc(h.name)}</span><span class="badge">בקרוב</span></div>`).join('\n')}
</div>
<a href="/" style="font-size:14px;font-weight:800;text-decoration:none;padding:4px 6px">לכל השכונות ←</a>
</div>
</div>
<div class="hdr-actions">
<a class="pill btn-ghost" href="${LOGIN}">${svg('M12 4a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM4 21a8 8 0 0 1 16 0', 20, 'currentColor', 2)}<span class="lbl">התחברות</span></a>
<a class="pill btn-line" href="${APP}">${svg('M12 5v14M5 12h14', 18, 'currentColor', 2.4)}פרסם</a>
<a class="pill btn-dark" href="${DOWNLOAD}">להורדת האפליקציה</a>
</div>
</div>
${navChips}</header>
`;
}

export function siteFooter() {
  return `<footer><div class="wrap">
<img src="/app_icon.png" alt="שכונה" width="48" height="48" loading="lazy">
<span>שכונה · <a href="mailto:info@shchuna.co.il">info@shchuna.co.il</a></span>
<nav aria-label="קישורים"><a href="/">כל השכונות</a><a href="/terms.html">תנאי שימוש</a><a href="/privacy.html">פרטיות</a></nav>
<span class="c">© שכונה, כל הזכויות שמורות</span>
</div></footer>`;
}

export function homePage(vm, { base, path: pagePath }) {
  const url = `${base}${pagePath}`;
  const title = `${vm.name}${vm.alias ? ` (${vm.alias})` : ''} — שכונה | מניינים, עסקים, גמ״חים ומבצעים`;
  const desc = `כל מה שקורה ב${vm.name}${vm.alias ? ` (${vm.alias})` : ''}, ${vm.city}: זמני תפילה, בעלי מקצוע, עסקים, מבצעים, נדל״ן, דרושים, יד שנייה וגמ״חים — מעודכן על ידי השכנים.`;

  return `${pageHead({ title, desc, url, base })}<a href="#main" class="sr">דלג לתוכן</a>

${siteHeader(vm, pagePath, `<nav class="chips" aria-label="תחומים"><div class="wrap">
<a href="#board">תפילות</a>${vm.promos.length ? '<a href="#promos">מבצעים</a>' : ''}<a href="#pros">בעלי מקצוע</a><a href="#biz">עסקים</a>${vm.realEstate.length ? '<a href="#realestate">נדל״ן</a>' : ''}<a href="#board">דרושים</a><a href="#board">יד שנייה</a><a href="#board">גמ״חים</a><a href="#zones">כל התחומים</a>
</div></nav>`)}

<main id="main">

<section class="hero" aria-label="עכשיו בשכונה">
<svg class="hero-sky" aria-hidden="true" width="100%" height="150" viewBox="0 0 1440 150" preserveAspectRatio="none" fill="none" stroke="#8CCBF2" stroke-opacity=".12" stroke-width="2"><path d="M0 150V110h50V85h40v40h30V70h60v45h25V55h50v40h40V45h70v70h30V80h50v30h40V40h70v80h30V70h50v35h40V85h60v65h40V60h50v65h30V95h60v55h40V75h70v75h50V90h60v60h40V70h60v80h50"/></svg>
<div class="wrap hero-row">
<div class="hero-text">
<span class="now"><span class="dot"></span><span data-day>${esc(vm.name)}</span> · <span data-greet>ברוכים הבאים</span></span>
<h1>כל ${esc(vm.name)}, <span class="emd">במקום אחד.</span></h1>
<p>מניינים, עסקים, בעלי מקצוע, מבצעים וגמ״חים — מעודכנים על ידי השכנים והעסקים עצמם.</p>
<a class="pill btn-sky m-only" href="${DOWNLOAD}" style="align-self:flex-start">להורדת האפליקציה</a>
</div>
<div class="tiles">
<a class="tile lift" href="#board"><i>${svg(ICON.brief, 22, 'currentColor', 2)}</i><span><b>לוח השכונה</b><span>דרושים, יד שנייה, גמ״חים</span></span></a>
<a class="tile lift" href="${vm.promos.length ? '#promos' : APP}"><i>${svg(ICON.tag, 22, 'currentColor', 2)}</i><span><b>מבצעים וקופונים</b><span>מעסקי השכונה</span></span></a>
<a class="tile lift" href="pros/"><i>${svg(ICON.wrench, 22, 'currentColor', 2)}</i><span><b>בעלי מקצוע</b><span>חשמל, אינסטלציה, שיפוצים ועוד</span></span></a>
<a class="tile lift" href="#board"><i>${svg(ICON.clock, 22, 'currentColor', 2)}</i><span><b>תפילות קרובות</b><span>המניין הבא בשכונה</span></span></a>
</div>
</div>
${ticker(vm)}
</section>

${promosSection(vm.promos)}
${prosSection(vm.professionals)}
${bizSection(vm.businesses)}
${realEstateSection(vm.realEstate)}
${boardSection(vm)}

<section id="zones" aria-label="כל התחומים" class="wrap" style="display:flex;flex-direction:column;gap:18px">
<h2 style="margin:0;font-size:30px;font-weight:800;color:var(--navy)">כל <span class="em">התחומים</span></h2>
<div class="zones">
${ZONES.map(([n, d, c, href]) => `<a class="zone lift" href="${href || APP}"><i class="z-${c}">${svg(d)}</i>${esc(n)}</a>`).join('\n')}
</div>
</section>

<section class="owners" aria-label="לבעלי עסקים"><div class="wrap">
<div class="txt">
<span style="font-size:15px;font-weight:800;color:var(--sky)">לבעלי עסקים ובעלי מקצוע</span>
<h2>השכנים כבר <span class="emd">מחפשים אותך.</span></h2>
<p>פרופיל עסק, מבצעים וקופונים, המלצות מלקוחות ומערכת תורים — במקום אחד.</p>
<div style="display:flex;gap:12px;flex-wrap:wrap"><a class="pill btn-sky" href="${APP}">להרשמת עסק</a><a class="pill btn-out" href="${DOWNLOAD}">להורדת האפליקציה</a></div>
</div>
<div class="feat">
<div><b>פרופיל עסק</b><span>שעות, טלפון, WhatsApp ו-Waze</span></div>
<div><b>מבצעים וקופונים</b><span>עם התראה לשכונה</span></div>
<div><b>המלצות</b><span>לקוחות ממליצים בלחיצה</span></div>
<div><b>תורים</b><span>יומן ותזכורות</span></div>
</div>
</div></section>

<section class="wrap faq" aria-label="שאלות נפוצות">
<h2>שאלות <span class="em">נפוצות</span></h2>
<div class="list">
${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}
</div>
</section>

</main>

${siteFooter()}

<script type="application/json" id="prayers-data">${JSON.stringify(vm.prayers).replace(/</g, '\\u003c')}</script>
<script>${CLIENT_JS}</script>
<script>${HOOD_JS}</script>
</body>
</html>
`;
}
