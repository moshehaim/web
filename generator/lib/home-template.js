/**
 * עמוד הבית של שכונה — לפי העיצוב החדש (קנבס "Main").
 *
 * HTML מרונדר מראש (SEO, עובד בלי JS), ומעליו סקריפט קטן:
 * שעון + "התפילה הבאה", קרוסלות, לשוניות הלוח ובורר השכונה.
 * פעולות (התחברות, פרסום, יצירת קשר) עוברות לאפליקציה.
 */

import { CAT_ICON } from './cat-icons.js';

export const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export const APP = '/app/';
// התחברות = האפליקציה (מי שלא מחובר נוחת שם על מסך הכניסה).
const LOGIN = '/app/';
// בעלי עסקים — לעמוד ניהול העסק באתר (/my-business/, js/manage.js)
const BIZ_PORTAL = '/my-business/';
const DOWNLOAD = '/b/';
let MINYANIM = '/har-homa/minyanim/';
/** השכונה שנבנית עכשיו — קובע את כתובת המניינים בכל התבניות (הבנייה רצה שכונה אחרי שכונה) */
export function setSiteHome(home) { MINYANIM = `${home}minyanim/`; }

export const ICON = {
  clock: 'M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16zM12 8v4l3 2',
  lost: 'M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM20 20l-4-4M11 8v3M11 14h.01',
  hand: 'M7 11V6a1.5 1.5 0 0 1 3 0v4M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V11M16 11V8a1.5 1.5 0 0 1 3 0v6a7 7 0 0 1-7 7h-.5a6 6 0 0 1-5-2.7L4 14a1.5 1.5 0 0 1 2.5-1.7L7 13',
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
  health: 'M11 2v2M5 2v2M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1M8 15a6 6 0 0 0 12 0v-3M20 8a2 2 0 1 0 0 4a2 2 0 1 0 0-4',
};
/** וריאציה קבועה לפריט (0–2) לפי המזהה שלו — ברשימה ארוכה מתחלפות, אותו פריט תמיד נראה אותו דבר */
export const artV = (id) => { let h = 0; for (const ch of String(id ?? '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % 3; };
/** תוכן תמונת ברירת המחדל: אייקון על משטח לבן. המחלקות לעטיפה: art v{artV} t-{tone} */
export const artIcon = (d) => `<span class="art-ic">${svg(d, 44, 'currentColor', 1.7)}</span>`;
export const svg = (d, size = 24, stroke = 'currentColor', w = 1.9) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

const ZONES = [
  ['מניינים ושיעורים', ICON.clock, 'blue', '@minyanim'],
  ['עסקים', ICON.store, 'sky', 'biz/'], ['בעלי מקצוע', ICON.wrench, 'sky', 'pros/'],
  ['מבצעים וקופונים', ICON.tag, 'sky', 'promos/'],
  ['שירותי קהילה', ICON.civic, 'teal', 'services/'], ['גמ״חים', ICON.heart, 'green', 'board/#gmach'], ['אירועים', ICON.star, 'green', 'happenings/', 'happenings'],
  ['דרושים', ICON.brief, 'violet', 'board/#jobs'], ['יד שנייה', ICON.bag, 'violet', 'board/#second'], ['אבידות ומציאות', ICON.lost, 'violet', 'board/#lost'], ['נדל״ן', ICON.key, 'violet', 'realestate/'], ['התנדבות', ICON.hand, 'green', 'board/#vol'],
  ['אולמות ואירוח', ICON.hall, 'amber', 'halls/'], ['הכל לאירוע', ICON.party, 'amber', 'events/'],
  ['מוסדות חינוך', ICON.school, 'teal', 'education/'], ['גנים ופארקים', ICON.tree, 'teal', 'parks/'], ['בריאות', ICON.health, 'teal', 'health/'],
];

/** מפתח התחום של אריח לפי הכתובת שלו ('board/#gmach' → gmach, 'biz/' → biz) — כדי להסתיר תחום ריק */
const zoneKey = (href) => (href === '@minyanim' ? 'minyanim' : String(href).replace(/^board\/#/, '').replace(/\/$/, ''));

const PHONES = [['מוקד עירוני', '106'], ['מד״א', '101', 1], ['משטרה', '100', 1], ['כיבוי והצלה', '102', 1], ['חברת החשמל', '103']];

const FAQ = [
  ['מה זה שכונה?', 'אתר ואפליקציה שמרכזים את כל מה שקורה בשכונה: מניינים ושיעורים, עסקים ובעלי מקצוע, גמ״חים, מבצעים, דרושים ויד שנייה.'],
  ['מי מעדכן את זמני התפילה?', 'הגבאים והשכנים מעדכנים את הזמנים, וכל שינוי מופיע באתר ובאפליקציה.'],
  ['איך מוסיפים עסק או בעל מקצוע?', 'דרך כפתור "פרסם" באפליקציה. ממלאים פרטים, והעסק עולה לשכונה.'],
  ['באילו שכונות זה פועל?', 'בשכונות ירושלים והסביבה. בוחרים שכונה בראש העמוד, ושכונות נוספות בדרך.'],
];

export const CSS = `
.t-blue{--t1:#EFF4FF;--t2:#DCE6FB;--tf:#244782}.t-sky{--t1:#E9F4FC;--t2:#D3E8F7;--tf:#1F78B4}
.t-green{--t1:#EAF7EE;--t2:#D4EEDC;--tf:#15803D}.t-violet{--t1:#F3EFFC;--t2:#E4DCF7;--tf:#6D4BB8}
.t-teal{--t1:#E6F6F4;--t2:#CDEBE7;--tf:#0F766E}.t-amber{--t1:#FCF5E6;--t2:#F4E5C2;--tf:#8A5A00}
.t-rose{--t1:#FCEFF2;--t2:#F5D9E0;--tf:#9F2D4B}
/* תמונת ברירת מחדל: רקע בגוון הקטגוריה + דוגמה (נקודות / פסים / קו רקיע) + אייקון על משטח לבן */
.art{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--t1),var(--t2))!important;color:var(--tf)}
.art::before{content:'';position:absolute;inset:0;pointer-events:none}
.art.v0::before{background:radial-gradient(color-mix(in srgb,var(--tf) 16%,transparent) 1.5px,transparent 1.8px) 0 0/16px 16px}
.art.v1::before{background:repeating-linear-gradient(35deg,color-mix(in srgb,var(--tf) 8%,transparent) 0 9px,transparent 9px 22px)}
.art.v2::before{background:color-mix(in srgb,var(--tf) 13%,transparent);-webkit-mask:url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20300%22%20preserveAspectRatio%3D%22none%22%3E%3Crect%20x%3D%220%22%20y%3D%22230%22%20width%3D%2246%22%20height%3D%2270%22%20rx%3D%223%22%2F%3E%3Crect%20x%3D%2250%22%20y%3D%22190%22%20width%3D%2234%22%20height%3D%22110%22%20rx%3D%223%22%2F%3E%3Crect%20x%3D%2288%22%20y%3D%22215%22%20width%3D%2252%22%20height%3D%2285%22%20rx%3D%223%22%2F%3E%3Crect%20x%3D%22144%22%20y%3D%22170%22%20width%3D%2230%22%20height%3D%22130%22%20rx%3D%223%22%2F%3E%3Crect%20x%3D%22178%22%20y%3D%22205%22%20width%3D%2258%22%20height%3D%2295%22%20rx%3D%223%22%2F%3E%3Crect%20x%3D%22240%22%20y%3D%22180%22%20width%3D%2240%22%20height%3D%22120%22%20rx%3D%223%22%2F%3E%3Crect%20x%3D%22284%22%20y%3D%22225%22%20width%3D%2250%22%20height%3D%2275%22%20rx%3D%223%22%2F%3E%3Crect%20x%3D%22338%22%20y%3D%22195%22%20width%3D%2230%22%20height%3D%22105%22%20rx%3D%223%22%2F%3E%3Crect%20x%3D%22372%22%20y%3D%22220%22%20width%3D%2240%22%20height%3D%2280%22%20rx%3D%223%22%2F%3E%3Ccircle%20cx%3D%22330%22%20cy%3D%2270%22%20r%3D%2226%22%2F%3E%3C%2Fsvg%3E") 0 0/100% 100% no-repeat;mask:url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20300%22%20preserveAspectRatio%3D%22none%22%3E%3Crect%20x%3D%220%22%20y%3D%22230%22%20width%3D%2246%22%20height%3D%2270%22%20rx%3D%223%22%2F%3E%3Crect%20x%3D%2250%22%20y%3D%22190%22%20width%3D%2234%22%20height%3D%22110%22%20rx%3D%223%22%2F%3E%3Crect%20x%3D%2288%22%20y%3D%22215%22%20width%3D%2252%22%20height%3D%2285%22%20rx%3D%223%22%2F%3E%3Crect%20x%3D%22144%22%20y%3D%22170%22%20width%3D%2230%22%20height%3D%22130%22%20rx%3D%223%22%2F%3E%3Crect%20x%3D%22178%22%20y%3D%22205%22%20width%3D%2258%22%20height%3D%2295%22%20rx%3D%223%22%2F%3E%3Crect%20x%3D%22240%22%20y%3D%22180%22%20width%3D%2240%22%20height%3D%22120%22%20rx%3D%223%22%2F%3E%3Crect%20x%3D%22284%22%20y%3D%22225%22%20width%3D%2250%22%20height%3D%2275%22%20rx%3D%223%22%2F%3E%3Crect%20x%3D%22338%22%20y%3D%22195%22%20width%3D%2230%22%20height%3D%22105%22%20rx%3D%223%22%2F%3E%3Crect%20x%3D%22372%22%20y%3D%22220%22%20width%3D%2240%22%20height%3D%2280%22%20rx%3D%223%22%2F%3E%3Ccircle%20cx%3D%22330%22%20cy%3D%2270%22%20r%3D%2226%22%2F%3E%3C%2Fsvg%3E") 0 0/100% 100% no-repeat}
.art-ic{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;width:84px;height:84px;border-radius:24px;background:rgba(255,255,255,.86);box-shadow:0 6px 18px rgba(20,40,80,.10);color:var(--tf)}
.art-ic svg{width:44px;height:44px}
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
.hdr-row{display:flex;align-items:center;gap:12px 16px;padding-block:12px}
.hdr-mid{display:flex;align-items:center;gap:12px;min-width:0;flex:1}
@media (min-width:1440px){.hdr-row{display:grid;grid-template-columns:minmax(420px,1fr) minmax(0,680px) minmax(420px,1fr);max-width:1600px;gap:20px}.hdr-mid{justify-content:center}.hdr-actions{justify-self:end;flex-wrap:nowrap}}
@media (max-width:1100px) and (min-width:761px){.hdr-actions .btn-line{display:none}}
.logo{display:inline-flex;align-items:center;gap:12px;text-decoration:none;color:var(--navy)}.logo img{width:52px;height:52px;flex:none}
.brand b{display:block;font-size:24px;font-weight:800;line-height:1.1}.brand small{display:block;font-size:13px;font-weight:700;color:var(--muted);white-space:nowrap}
@media (max-width:1100px){.brand small{display:none}}@media (max-width:760px){.brand{display:none}}
.hood{position:relative}
.hood-btn{display:flex;align-items:center;gap:10px;height:52px;padding:0 12px 0 10px;border-radius:14px;border:1.5px solid #DCE5F5;background:#F5F8FF;cursor:pointer;color:var(--navy)}
.hood-btn{min-width:200px}.hood-btn>span{flex:1}
.hood-btn small{display:block;font-size:12px;font-weight:700;color:var(--muted);text-align:right;white-space:nowrap}
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
.gs{position:relative;flex:1 1 440px;max-width:460px;min-width:0}
.gs-box{display:flex;align-items:center;gap:8px;height:46px;padding:0 14px;border-radius:999px;background:#F6F7F9;border:1px solid var(--line)}
.gs-box:focus-within{border-color:#9DB8DF;background:#fff}
.gs-box input{flex:1;min-width:0;border:0;outline:0;background:transparent;font:inherit;font-size:15px;color:var(--ink)}
.gs-res{position:absolute;top:52px;inset-inline:0;background:#fff;border:1px solid var(--line);border-radius:16px;box-shadow:0 18px 48px rgba(15,27,48,.18);padding:6px;z-index:40;max-height:70vh;overflow-y:auto}
.gs-res[hidden]{display:none}
.gs-res a{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:10px;text-decoration:none;color:var(--ink)}
.gs-res a:hover,.gs-res a.sel{background:#F5F8FF}
.gs-res b{display:block;font-size:15px}.gs-res small{display:block;font-size:12.5px;color:var(--muted)}
.gs-res .ty{flex:none;font-size:12px;font-weight:800;color:var(--brand);background:#EFF4FF;border-radius:7px;padding:2px 8px}
.gs-res p{margin:0;padding:12px;color:var(--muted);font-size:14px}
.gs-open{display:none}
@media (max-width:760px){.gs{display:none;order:9;flex:1 0 100%;max-width:none}.hdr.gs-on .gs{display:block}.gs-open{display:inline-flex;width:46px;padding:0;justify-content:center;border-color:var(--line);color:var(--ink,#0f1b30)}}
.hood-item small{display:block;font-size:12px;font-weight:600;color:var(--muted)}
.hood-item[hidden]{display:none}
.hood-none{margin:0;padding:10px;font-size:14px;color:var(--muted)}
.hdr-actions{display:flex;align-items:center;gap:8px;margin-inline-start:auto;flex-wrap:wrap}
.btn-ghost{color:var(--navy);padding:0 12px}
.btn-line{border:1.5px solid var(--brand);color:var(--brand)}
.btn-dark{background:var(--navy);color:#fff}.btn-dark:hover{color:#fff;background:#0F1F3B}
@media (max-width:760px){.hdr-row{display:flex;flex-wrap:wrap;gap:10px;padding-block:10px}.hdr-mid{display:contents}.hdr-actions{margin-inline-start:auto}.logo img{width:44px;height:44px}
.hood{min-width:0}.hood-btn{height:46px;max-width:100%;min-width:150px}.hood-btn b{max-width:150px}
.hdr-actions .btn-line,.hdr-actions .btn-dark{display:none}.hdr-actions .btn-ghost{width:46px;padding:0;justify-content:center}
.btn-ghost .lbl{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}}
.m-only{display:none}@media (max-width:760px){.m-only{display:inline-flex}}
/* שורת התחומים: שורה אחת ברוחב המסך, נגללת לצד; חיצים במחשב */
.chips{border-top:1px solid #EEF0F4;position:relative}
.chips .wrap{display:flex;gap:6px;padding-block:8px;padding-inline:16px;max-width:none;overflow-x:auto;scrollbar-width:none;scroll-behavior:smooth}
.chips .wrap::-webkit-scrollbar{display:none}
.chips .wrap>a{flex:none}
.chips .wrap>a:first-child{margin-inline-start:auto}.chips .wrap>a:last-child{margin-inline-end:auto}
.cnav{position:absolute;top:50%;transform:translateY(-50%);width:34px;height:34px;border-radius:50%;border:1px solid var(--line);background:#fff;color:var(--navy);font-size:16px;font-weight:800;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.08);z-index:2;display:none}
.cnav.prev{right:6px}.cnav.next{left:6px}
.chips.more-start .cnav.prev,.chips.more-end .cnav.next{display:block}
.chips.more-end .wrap{-webkit-mask-image:linear-gradient(to left,#000 calc(100% - 56px),transparent);mask-image:linear-gradient(to left,#000 calc(100% - 56px),transparent)}
.chips.more-start.more-end .wrap{-webkit-mask-image:linear-gradient(to left,transparent,#000 56px,#000 calc(100% - 56px),transparent);mask-image:linear-gradient(to left,transparent,#000 56px,#000 calc(100% - 56px),transparent)}
.chips.more-start:not(.more-end) .wrap{-webkit-mask-image:linear-gradient(to right,#000 calc(100% - 56px),transparent);mask-image:linear-gradient(to right,#000 calc(100% - 56px),transparent)}
@media (hover:none){.cnav{display:none!important}}
.chips a{flex:none;font-size:15px;font-weight:700;color:#3B4860;text-decoration:none;padding:6px 14px;border-radius:999px;background:#F4F5F7}
.chips a:hover{background:#EFF4FF;color:var(--brand)}
.chips a.on{background:var(--brand);color:#fff}

/* hero */
.hero{background:var(--navy);color:#fff;position:relative;overflow:hidden}
.hero-sky{position:absolute;bottom:46px;left:0}
.hero-row{display:flex;flex-wrap:wrap;align-items:center;gap:24px 32px;padding-block:34px 32px;position:relative}
.hero-text{flex:1 1 420px;min-width:0;display:flex;flex-direction:column;gap:18px;justify-content:center}
.now{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:700;color:#A9BAD4}
.dot{width:8px;height:8px;border-radius:50%;background:var(--ok);animation:pulse 1.6s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
.hero h1{margin:0;font-size:clamp(32px,4.6vw,52px);font-weight:800;line-height:1.1}
.hero p{margin:0;font-size:19px;line-height:1.6;color:#C9D6EA;max-width:520px}
.shab{align-self:flex-start;display:inline-flex;flex-wrap:wrap;align-items:center;gap:6px 16px;margin:0!important;padding:9px 16px;border-radius:14px;background:var(--navy2);border:1px solid rgba(140,203,242,.35);font-size:16px!important;color:#C9D6EA!important;max-width:none!important}
.shab[hidden]{display:none}.shab svg{color:var(--sky)}.shab>b{color:#fff}.shab span b{color:var(--sky);font-size:17px;margin-inline-start:4px}
.fr{display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid var(--line);color:var(--ink);text-decoration:none}
.fr:first-of-type{border-top:0}.fr:hover{color:var(--brand)}
.fr i{width:44px;height:44px;border-radius:12px;overflow:hidden;flex:none;background:var(--soft);color:var(--brand);display:flex;align-items:center;justify-content:center}
.fr i img{width:100%;height:100%;object-fit:cover}
.fr-t{flex:1;min-width:0}.fr-t b{display:block;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fr-t small{display:block;font-size:13px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hero-row .dl{align-self:center}
/* הכותרת והמשפט באותה שורה — חוסך גובה */
.h-row{display:flex;flex-direction:column;gap:12px}
@media (min-width:1101px){.h-row{flex-direction:row;align-items:center;gap:24px}.h-row h1{flex:none}.h-row p{max-width:320px;min-width:280px;font-size:16px;line-height:1.5;padding-inline-start:24px;border-inline-start:2px solid rgba(140,203,242,.4)}}
/* מקום לפרסום בהירו — עד שיש מפרסם: מודעה של שכונה עצמה, רק במסך רחב */
.adslot{flex:0 1 360px;min-height:128px;display:flex;align-items:center;gap:16px;padding:16px 20px;border-radius:20px;border:1.5px dashed rgba(140,203,242,.45);background:rgba(23,47,87,.92);color:#C9D6EA;text-decoration:none;position:relative}
.adslot:hover{background:#1D3A68;color:#fff}.adslot i{width:56px;height:56px;border-radius:14px;background:rgba(140,203,242,.15);color:var(--sky);display:flex;align-items:center;justify-content:center;flex:none}
.adslot b{display:block;font-size:18px;color:#fff}.adslot small{display:block;font-size:14px;margin-top:2px}.adslot em{position:absolute;top:8px;left:12px;font-style:normal;font-size:11px;font-weight:800;color:#8FA3C2}
@media (max-width:900px){.adslot{display:none}}
.disc{padding-block:48px 8px;display:flex;flex-direction:column;gap:18px}
.disc-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
@media (max-width:900px){.disc-row{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}}
.disc-card{background:#fff;border-radius:20px;overflow:hidden;text-decoration:none;color:var(--ink);box-shadow:0 2px 12px rgba(0,0,0,.06);display:flex;flex-direction:column}
.disc-card:hover{color:var(--ink)}.disc-media{aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;overflow:hidden}
.disc-media img{width:100%;height:100%;object-fit:cover}
.disc-body{padding:12px 14px 14px;display:flex;flex-direction:column;gap:3px}.disc-body em{align-self:flex-start;font-style:normal;font-size:12px;font-weight:800;background:var(--soft);color:var(--brand);border-radius:6px;padding:1px 8px}
.disc-body b{font-size:17px;font-weight:800;line-height:1.3}.disc-body small{font-size:13px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.phstrip{background:#fff;border-top:1px solid var(--line);margin-top:40px}.phstrip .wrap{display:flex;flex-wrap:wrap;gap:6px 22px;padding-block:12px;font-size:14px;color:#566173}
.phstrip a{font-weight:800;text-decoration:none;color:var(--brand);font-variant-numeric:tabular-nums}.phstrip a.hot{color:var(--red)}
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
.grid-auto{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr));gap:16px}

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
/* המלצות: אותו אדום של הלב באפליקציה (RecommendHeartBadge.heartColor) */
.media .rec{position:absolute;top:10px;right:10px;display:inline-flex;align-items:center;gap:4px;font-size:13px;font-weight:800;background:#E24B4A;color:#fff;border-radius:999px;padding:3px 10px;box-shadow:0 2px 8px rgba(0,0,0,.22)}
.media .rec .rp{display:inline-flex;align-items:center;gap:4px}
.rh{display:none}
@media (max-width:620px){.media .rec{background:none;padding:0;box-shadow:none;border:0;border-radius:0}.media .rec .rp{display:none}.rh{display:block;position:relative;width:36px;height:36px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.28))}.rh svg{display:block}.rh b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding-bottom:2px;font-size:13px;font-weight:800;color:#fff;font-variant-numeric:tabular-nums}}

.mq-wrap{overflow:hidden;display:flex;flex-direction:column;gap:14px;padding-block:6px}
.mq{display:flex;gap:14px;width:max-content;animation:mq 60s linear infinite}
.mq.rev{animation:mqr 70s linear infinite}
.mq-wrap:hover .mq{animation-play-state:paused}
@keyframes mq{from{transform:translateX(0)}to{transform:translateX(50%)}}
@keyframes mqr{from{transform:translateX(50%)}to{transform:translateX(0)}}
.biz{display:flex;align-items:center;gap:12px;padding:8px 18px 8px 8px;border-radius:999px;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.06);text-decoration:none;color:var(--ink);white-space:nowrap}
.biz:hover{color:var(--ink)}
.biz img{width:48px;height:48px;border-radius:50%;object-fit:cover;background:#DCE5F5}
.biz-art{flex:none;width:48px;height:48px;border-radius:50%}.biz-art .art-ic{width:30px;height:30px;border-radius:9px;box-shadow:none}.biz-art .art-ic svg{width:18px;height:18px}.biz span.biz-art{display:flex}
.pro-art{position:absolute;inset:0}
.biz b{display:block;font-size:16px;max-width:260px;overflow:hidden;text-overflow:ellipsis}
.biz span{display:block;font-size:13px;color:var(--muted)}

.seg{display:flex;gap:4px;background:#EEF1F5;padding:4px;border-radius:12px}
.seg button{border:0;background:transparent;border-radius:9px;padding:8px 14px;font-size:15px;font-weight:700;color:#3B4860;cursor:pointer;white-space:nowrap}
.seg button[aria-pressed=true],.seg button[aria-selected=true]{background:#fff;color:var(--brand);font-weight:800;box-shadow:0 1px 4px rgba(0,0,0,.08)}

/* board */
.board-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;padding-block:40px 12px}
.pstrip{padding-block:36px 4px;display:flex;flex-direction:column;gap:12px}
.ps-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.ps-head h2{margin:0;font-size:22px;font-weight:800;color:var(--navy)}
.ps-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px}
.ps-item{display:flex;align-items:center;gap:12px;background:#fff;border-radius:18px;padding:12px;text-decoration:none;color:var(--ink);box-shadow:0 2px 10px rgba(0,0,0,.04);min-width:0}
.ps-item:hover{color:var(--ink)}.ps-item i{width:130px;height:130px;border-radius:12px;overflow:hidden;flex:none;display:flex;align-items:center;justify-content:center;background:var(--soft);color:var(--brand)}
.ps-item i img{width:100%;height:100%;object-fit:contain}.ps-item span{min-width:0}.ps-item em{display:inline-block;font-style:normal;font-size:12px;font-weight:800;background:var(--soft);color:var(--brand);border-radius:6px;padding:1px 7px}
.ps-item b{display:block;font-size:16px;font-weight:800;line-height:1.3}.ps-item small{display:block;font-size:13px;color:var(--muted)}
.ps-item{min-height:154px}
.ps-cta{background:var(--soft);box-shadow:none;border:1.5px dashed #C9D6EA;padding-inline:20px}
@media (max-width:620px){.ps-item i{width:96px;height:96px}.ps-item{min-height:0}}
/* מבצע = פלאייר שהעסק עיצב: מוצג שלם, לאורך, לא חתוך */
.card.promo .media{aspect-ratio:4/5;background:#EEF2F8}.media .ph{display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#7C3AED;background:#F3EEFF}.card.promo .media img{object-fit:contain}.ps-cta b{color:var(--navy)}
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

.zones{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:10px}
@media (min-width:1000px){.zones{grid-template-columns:repeat(8,minmax(0,1fr))}.zones .zone{padding-inline:6px;font-size:14.5px;line-height:1.3}}
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

/** תמונת ברירת מחדל לכרטיס לפי הקטגוריה (עסק / בעל מקצוע) */
const catArt = (x, cls) => { const [d, tone] = CAT_ICON[x.cat] || CAT_ICON.other; return `<span class="${cls} art v${artV(x.id || x.name)} t-${tone}">${artIcon(d)}</span>`; };
const img = (src, alt) => `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async">`;

function promoCard(p) {
  return `<a href="${esc(p.href || APP)}" class="card promo lift${p.coupon ? ' coupon' : ''}">
<div class="media">${p.img ? img(p.img, p.title) : `<span class="ph art v${artV(p.id || p.title)} t-violet">${artIcon(p.coupon ? ICON.ticket || ICON.tag : ICON.tag)}</span>`}<span class="tag">${esc(p.kind)}</span></div>
<div class="body"><b class="clamp2">${esc(p.title)}</b>${p.provider ? `<span class="sub">${esc(p.provider)}</span>` : ''}<span class="fine">${esc(p.until)}${p.coupon ? ' · מימוש באפליקציה' : ''}</span></div>
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
<div class="sec-head">${head2('מעסקי השכונה', 'מבצעים', 'וקופונים')}<div class="ctrls">${carousel ? arrows('promos') : ''}<a class="more" href="promos/">הכל ←</a></div></div>
${body}
</div></section>`;
}

function prosSection(pros) {
  if (!pros.length) return '';
  return `<section id="pros" aria-label="בעלי מקצוע" class="wrap sec">
<div class="sec-head">${head2('לבית, למשפחה ולאירועים', 'בעלי מקצוע', 'בשכונה')}<div class="ctrls">${arrows('pros')}<a class="more" href="pros/">לכל בעלי המקצוע ←</a></div></div>
<div class="car car-pro" data-car="pros" data-auto="4000"><div class="track">
${pros.map((p) => `<div class="slide"><a href="${esc(p.href || 'pros/')}" class="card pro lift">
<div class="media">${p.img ? img(p.img, p.name) : catArt(p, 'pro-art')}${p.rec ? `<span class="rec" role="img" aria-label="${p.rec === 1 ? 'המלצה אחת' : `${p.rec} המלצות`}"><span class="rp">${svg(ICON.heart, 14, 'currentColor', 2)}${p.rec === 1 ? 'המלצה אחת' : `${p.rec} המלצות`}</span><span class="rh" aria-hidden="true"><svg viewBox="0 0 24 24" width="36" height="36"><path d="M12 21.3s-8.3-5.3-8.3-11.6A4.8 4.8 0 0 1 12 6.4a4.8 4.8 0 0 1 8.3 3.3c0 6.3-8.3 11.6-8.3 11.6z" fill="#E24B4A" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"></path></svg><b>${p.rec}</b></span></span>` : ''}</div>
<div class="body"><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.name)}</b><span class="field">${esc(p.field)}</span></div>
</a></div>`).join('\n')}
</div></div>
</section>`;
}

function bizSection(biz) {
  if (!biz.length) return '';
  const pill = (b) => `<a href="${esc(b.href || 'biz/')}" class="biz lift">${b.img ? img(b.img, '') : catArt(b, 'biz-art')}<span><b>${esc(b.name)}</b><span>${esc(b.type)}</span></span></a>`;
  const half = Math.ceil(biz.length / 2);
  const row = (list, cls) => `<div class="mq${cls}">${list.map(pill).join('')}<span style="display:contents" aria-hidden="true">${list.map(pill).join('')}</span></div>`;
  return `<section id="biz" aria-label="עסקים בשכונה" class="sec" style="padding-bottom:16px">
<div class="wrap sec-head">${head2('טלפון, וואטסאפ וניווט בלחיצה', 'עסקים', 'בשכונה')}<a class="more" href="biz/">לאלפון העסקים ←</a></div>
<div class="mq-wrap">${row(biz.slice(0, half), '')}${biz.length > 6 ? row(biz.slice(half), ' rev') : ''}</div>
</section>`;
}

function realEstateSection(list) {
  if (!list.length) return '';
  const kinds = ['הכל', ...['למכירה', 'להשכרה'].filter((k) => list.some((r) => r.kind === k))];
  return `<section id="realestate" aria-label="נדל״ן" class="wrap sec">
<div class="sec-head">${head2('דירות מהשכונה, עם תמונות', 'נדל״ן', 'בשכונה')}<div class="ctrls">
${kinds.length > 2 ? `<div class="seg" role="group" aria-label="סוג עסקה">${kinds.map((k, i) => `<button type="button" data-re="${esc(k)}" aria-pressed="${i === 0}">${esc(k)}</button>`).join('')}</div>` : ''}
${arrows('re')}<a class="more" href="realestate/">לכל הדירות ←</a></div></div>
<div class="car" data-car="re" data-auto="5000"><div class="track">
${list.map((r) => `<div class="slide" data-kind="${esc(r.kind)}"><a href="${esc(r.href || APP)}" class="card lift">
<div class="media">${img(r.img, r.title)}<span class="tag">${esc(r.kind)}</span><span class="price mono">${esc(r.price)}</span></div>
<div class="body"><b>${esc(r.title)}</b><span class="sub">${esc(r.meta)}</span><span class="fine">${esc(r.street)}</span></div>
</a></div>`).join('\n')}
</div></div>
</section>`;
}

const typeOrder = ['שחרית', 'מנחה', 'ערבית'];
/** שורות התפילה הבאה — אותו חישוב רץ גם בדפדפן (ראו clientJs). */
function nextPrayers(prayers, nowMin, dow) {
  return typeOrder.map((t) => {
    const of = prayers.filter((p) => p.t === t && !p.sh);   // שטיבלך — רק בדפדפן (תלוי בשעה)
    let p = of.find((x) => x.d.includes(dow) && x.m >= nowMin);
    let when = '';
    if (p) when = p.m - nowMin <= 60 ? `בעוד ${p.m - nowMin} דק׳` : 'היום';
    else { p = of.find((x) => x.d.includes((dow + 1) % 7)); when = 'מחר'; }
    return p ? { ...p, when } : null;
  }).filter(Boolean);
}
const prow = (p) => `<a class="prow" href="${MINYANIM}"><span class="t mono">${esc(p.c)}</span><span><b>${esc(p.n)}</b><small>${esc(p.t)}${p.l ? ' · ' + esc(p.l) : ''}</small></span><span class="when">${esc(p.when)}</span></a>`;

/** פחות משלושה מבצעים: שורה אחת צנועה, בלי כותרת ענקית. בלי מבצעים — כלום. */
function promosStrip(promos) {
  if (!promos.length) return '';
  return `<section id="promos" aria-label="מבצעים וקופונים" class="wrap pstrip">
<div class="ps-head"><h2>מבצעים <span class="em">בשכונה</span></h2><a class="more" href="promos/">הכל ←</a></div>
<div class="ps-row">${promos.map((p) => `<a class="ps-item lift" href="${esc(p.href || APP)}">${p.img ? `<i>${img(p.img, '')}</i>` : `<i class="ps-ic">${svg(ICON.tag, 22, 'currentColor', 2)}</i>`}<span><em>${esc(p.kind)}</em><b class="clamp2">${esc(p.title)}</b><small>${esc([p.provider, p.until].filter(Boolean).join(' · '))}</small></span></a>`).join('')}
<a class="ps-item ps-cta" href="${APP}"><span><b>יש לכם עסק בשכונה?</b><small>פרסום מבצע עם התראה לשכונה ←</small></span></a></div>
</section>`;
}

function boardSection(vm) {
  // כל הלשוניות תמיד — גם ריקות ("אין כרגע מודעות... רוצים לפרסם?"), כדי שיידעו מה אפשר לפרסם
  const tabs = vm.board;
  const first = Math.max(0, tabs.findIndex((t) => t.items.length));
  const now = new Date(vm.builtAt);
  const jt = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
  // בלי תלות בשעת הבנייה (נבנה כל שעה, ושינוי רק בגלל השעה ייצור commit מיותר) — הדפדפן מחליף מיד
  const ssr = nextPrayers(vm.prayers, 0, jt.getDay());

  return `<section id="board" aria-label="לוח השכונה" class="wrap"><div class="board-grid">

${freshPanel(vm.fresh)}

<div class="panel span2">
<div class="panel-head"><h2>לוח <span class="em">השכונה</span></h2><a href="${APP}" style="font-weight:800;font-size:14px;text-decoration:none">+ פרסום בלוח</a></div>
<div class="seg tabs" role="tablist" aria-label="לוח השכונה">
${tabs.map((t, i) => `<button type="button" role="tab" id="tab-${t.key}" aria-controls="tp-${t.key}" aria-selected="${i === first}" tabindex="${i === first ? 0 : -1}">${esc(t.label)}</button>`).join('')}
</div>
${tabs.map((t, i) => `<div role="tabpanel" id="tp-${t.key}" aria-labelledby="tab-${t.key}"${i === first ? '' : ' hidden'}>
${t.items.length
    ? t.items.slice(0, 5).map((x) => `<a class="bitem" href="${esc(x.href || APP)}"><span><b>${esc(x.t)}</b><small>${esc(x.sub)}</small></span>${x.b ? `<span class="bbadge">${esc(x.b)}</span>` : ''}</a>`).join('')
    : `<p class="bempty">אין כרגע מודעות ב${esc(t.label)}. רוצים לפרסם? זה דרך האפליקציה.</p>`}
<a href="board/#${t.key}" style="display:inline-block;font-weight:800;font-size:14px;text-decoration:none;margin-top:10px">${esc(t.more)} ←</a>
</div>`).join('\n')}
</div>

<div class="panel pray">
<div class="panel-head"><h2>תפילות <span class="emd">קרובות</span></h2><span class="clock mono" data-clock></span></div>
<div data-next-prayers>${ssr.map(prow).join('')}</div>
<a class="all" href="${MINYANIM}">כל המניינים והשיעורים ←</a>
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
/* התחברות / החשבון שלי — ב-/js/auth.js */
/* תחום נוכחי בשורת התחומים — לגלול אליו שיהיה גלוי */
var on=document.querySelector('.chips a.on');if(on&&on.scrollIntoView){try{on.scrollIntoView({block:'nearest',inline:'center'});}catch(_){}}
/* חיצים לשורת התחומים */
var nav=document.querySelector('.chips'),nw=nav&&nav.querySelector('.wrap');
function navState(){if(!nw)return;var max=nw.scrollWidth-nw.clientWidth,x=Math.abs(nw.scrollLeft);
  nav.classList.toggle('more-start',x>4);nav.classList.toggle('more-end',x<max-4);}
if(nw){nw.addEventListener('scroll',navState,{passive:true});window.addEventListener('resize',navState);navState();
  [].forEach.call(nav.querySelectorAll('.cnav'),function(b){b.addEventListener('click',function(){
    var d=b.classList.contains('next')?-1:1;nw.scrollBy({left:d*Math.max(200,nw.clientWidth*0.6)});});});}
function norm(s){return String(s||'').toLowerCase().replace(/[\\u0591-\\u05C7]/g,'').replace(/["'׳״]/g,'').replace(/[.,()–-]/g,' ').replace(/\\s+/g,' ').trim();}
/* בורר שכונה */
var hb=document.getElementById('hood-btn'),hp=document.getElementById('hood-pop'),hq=document.getElementById('hood-q');
function setHood(o){hp.hidden=!o;hb.setAttribute('aria-expanded',o);if(o)hq.focus();}
if(hb){hb.addEventListener('click',function(e){e.stopPropagation();setHood(hp.hidden);});
  hp.addEventListener('click',function(e){e.stopPropagation();});
  document.addEventListener('click',function(){setHood(false);});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!hp.hidden){setHood(false);hb.focus();}});
  hq.addEventListener('input',function(){var q=norm(hq.value),n=0;
    [].forEach.call(hp.querySelectorAll('.hood-item'),function(it){var ok=!q||norm(it.getAttribute('data-s')).indexOf(q)>=0;it.hidden=!ok;if(ok)n++;});
    hp.querySelector('.hood-none').hidden=n>0;});}
/* חיפוש בשכונה — אינדקס search.json נטען בפוקוס הראשון */
var gf=document.querySelector('.gs'),gq=document.getElementById('g-q'),gr=document.getElementById('g-res'),IDX=null,sel=-1;
if(gf){var hdr=document.querySelector('.hdr'),gopen=document.querySelector('.gs-open');
  if(gopen)gopen.addEventListener('click',function(){hdr.classList.toggle('gs-on');if(hdr.classList.contains('gs-on'))gq.focus();});
  function load(){if(IDX)return;IDX=[];fetch(gf.getAttribute('data-home')+'search.json').then(function(r){return r.json();}).then(function(d){IDX=d.map(function(x){x.k=norm(x.n+' '+x.t+' '+(x.s||''));x.nk=norm(x.n);return x;});show();}).catch(function(){});}
  function esc2(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function show(){var q=norm(gq.value);sel=-1;if(!q){gr.hidden=true;gq.setAttribute('aria-expanded','false');return;}
    var w=q.split(' '),res=(IDX||[]).filter(function(x){return w.every(function(t){return x.k.indexOf(t)>=0;});});
    res.sort(function(a,b){return (b.nk.indexOf(q)===0)-(a.nk.indexOf(q)===0)||(b.nk.indexOf(q)>=0)-(a.nk.indexOf(q)>=0)||(a.o||9)-(b.o||9);});
    gr.innerHTML=res.length?res.slice(0,10).map(function(x){return '<a role="option" href="'+esc2(x.h)+'"><span><b>'+esc2(x.n)+'</b>'+(x.s?'<small>'+esc2(x.s.slice(0,60))+'</small>':'')+'</span><span class="ty">'+esc2(x.t)+'</span></a>';}).join(''):(IDX&&IDX.length?'<p>לא מצאנו בשכונה. נסו מילה אחרת.</p>':'<p>טוען…</p>');
    gr.hidden=false;gq.setAttribute('aria-expanded','true');}
  gq.addEventListener('focus',load);gq.addEventListener('input',function(){load();show();});
  gq.addEventListener('keydown',function(e){var a=gr.querySelectorAll('a');if(!a.length)return;
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();sel=(sel+(e.key==='ArrowDown'?1:-1)+a.length)%a.length;[].forEach.call(a,function(x,i){x.classList.toggle('sel',i===sel);});}
    else if(e.key==='Enter'){location.href=a[Math.max(0,sel)].getAttribute('href');}
    else if(e.key==='Escape'){gr.hidden=true;}});
  document.addEventListener('click',function(e){if(!gf.contains(e.target))gr.hidden=true;});}
})();`;

const clientJs = () => `
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
function shOn(p,m){var x=(m<300&&p.b>1440)?m+1440:m;return x>=p.a&&x<p.b;}
function nextList(nowMin,dow){return TYPES.map(function(t){
  for(var s=0;s<P.length;s++){if(P[s].sh&&P[s].t===t&&shOn(P[s],nowMin))return{p:P[s],w:'עכשיו'};}
  var of=P.filter(function(p){return p.t===t&&!p.sh;}),p=null,w='';
  for(var i=0;i<of.length;i++){if(of[i].d.indexOf(dow)>=0&&of[i].m>=nowMin){p=of[i];break;}}
  if(p){w=p.m===nowMin?'עכשיו':p.m-nowMin<=60?'בעוד '+(p.m-nowMin)+' דק׳':'היום';}
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
/* זמני שבת: רק מיום ההדלקה (שישי / ערב חג) ועד צאת השבת */
(function(){var n=jnow(),iso=n.getFullYear()+'-'+pad(n.getMonth()+1)+'-'+pad(n.getDate());
[].forEach.call(document.querySelectorAll('.shab[data-from]'),function(c){c.hidden=!(iso>=c.getAttribute('data-from')&&iso<=c.getAttribute('data-to'));});})();

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


/** שורת התחומים מתחת לכותרת — אותה רשימה בכל עמודי האתר. current = המפתח של העמוד הנוכחי. */
/** תחומים שמוסתרים כשאין בהם תוכן (נקבע בזמן הבנייה) */
export const HIDDEN_NAV = new Set(['happenings']);

export function navChips(home, current = '') {
  const M = MINYANIM;
  const items = [
    ['home', 'דף השכונה', home], ['minyanim', 'מניינים ושיעורים', M],
    ['biz', 'עסקים', `${home}biz/`], ['pros', 'בעלי מקצוע', `${home}pros/`],
    ['promos', 'מבצעים וקופונים', `${home}promos/`],
    ['gmach', 'גמ״חים', `${home}board/#gmach`], ['jobs', 'דרושים', `${home}board/#jobs`],
    ['second', 'יד שנייה', `${home}board/#second`], ['realestate', 'נדל״ן', `${home}realestate/`],
    ['vol', 'התנדבות', `${home}board/#vol`], ['lost', 'אבידות ומציאות', `${home}board/#lost`],
    ['halls', 'אולמות ואירוח', `${home}halls/`], ['events', 'הכל לאירוע', `${home}events/`],
    ['education', 'מוסדות חינוך', `${home}education/`], ['parks', 'גנים ופארקים', `${home}parks/`],
    ['services', 'שירותי קהילה', `${home}services/`], ['health', 'בריאות', `${home}health/`], ['happenings', 'אירועים', `${home}happenings/`],
  ];
  return `<nav class="chips" aria-label="תחומים"><button type="button" class="cnav prev" aria-label="תחומים קודמים">→</button><button type="button" class="cnav next" aria-label="תחומים נוספים">←</button><div class="wrap">
${items.filter(([k]) => !HIDDEN_NAV.has(k)).map(([k, l, h]) => `<a href="${h}"${k === current ? ' aria-current="page" class="on"' : ''}>${l}</a>`).join('')}
</div></nav>`;
}

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
  return `<header class="hdr">
<div class="wrap hdr-row">
<a class="logo" href="/" aria-label="שכונה — דף הבית"><img src="/app_icon.png" alt="" width="52" height="52"><span class="brand"><b>שכונה</b><small>הכל בשכונה, במקום אחד</small></span></a>
<div class="hdr-mid">
<div class="hood">
<button type="button" class="hood-btn" id="hood-btn" aria-haspopup="dialog" aria-expanded="false" aria-controls="hood-pop">
${svg('M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 7a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5', 20, '#244782', 2)}
<span><small>השכונה שלך</small><b>${esc(vm.name)}</b></span>
${svg('M6 9l6 6 6-6', 16, '#244782', 2.4)}
</button>
<div class="hood-pop" id="hood-pop" role="dialog" aria-label="בחירת שכונה" hidden>
<label class="hood-q">${svg('M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM20 20l-4-4', 17, '#6B7689', 2)}<span class="sr">חיפוש שכונה</span><input id="hood-q" type="search" placeholder="חיפוש שכונה…" autocomplete="off"></label>
<div class="hood-list">
${vm.hoods.map((h) => {
    const ds = ` data-s="${esc([h.name, h.also].filter(Boolean).join(' '))}"`;
    const sub = h.also ? `<small>${esc(h.also)}</small>` : '';
    return h.current
      ? `<a class="hood-item" href="${esc(pagePath)}" aria-current="page"${ds}><span>${esc(h.name)}${sub}</span><span class="badge on">נבחרה</span></a>`
      : h.href
        ? `<a class="hood-item" href="${esc(h.href)}"${ds}><span>${esc(h.name)}${sub}</span>${h.active ? '<span class="badge on">פעילה</span>' : ''}</a>`
      : h.active
        ? `<a class="hood-item" href="/"${ds}><span>${esc(h.name)}${sub}</span><span class="badge on">פעילה</span></a>`
        : `<div class="hood-item off"${ds}><span>${esc(h.name)}${sub}</span><span class="badge">בקרוב</span></div>`;
  }).join('\n')}
<p class="hood-none" hidden>לא מצאנו שכונה בשם הזה. שכונות נוספות בירושלים בדרך.</p>
</div>
<a href="/" style="font-size:14px;font-weight:800;text-decoration:none;padding:4px 6px">לכל השכונות ←</a>
</div>
</div>
<form class="gs" role="search" data-home="${esc(pagePath)}" onsubmit="return false">
<label class="gs-box">${svg('M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM20 20l-4-4', 18, '#6B7689', 2)}<span class="sr">חיפוש בשכונה</span><input id="g-q" type="search" placeholder="חשמלאי, גמ״ח עריסות, בית כנסת…" autocomplete="off" aria-controls="g-res" aria-expanded="false"></label>
<div class="gs-res" id="g-res" role="listbox" hidden></div>
</form>
</div>
<div class="hdr-actions">
<button type="button" class="pill btn-ghost gs-open" aria-label="חיפוש">${svg('M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM20 20l-4-4', 20, 'currentColor', 2)}</button>
<a class="pill btn-ghost acct" id="acct" href="${LOGIN}" aria-label="התחברות">${svg('M12 4a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM4 21a8 8 0 0 1 16 0', 20, 'currentColor', 2)}<span class="lbl">התחברות</span></a>
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
<nav aria-label="קישורים"><a href="/">כל השכונות</a><a href="${BIZ_PORTAL}">כניסה לבעלי עסקים</a><a href="/terms.html">תנאי שימוש</a><a href="/privacy.html">פרטיות</a></nav>
<span class="c">© שכונה, כל הזכויות שמורות</span>
</div></footer>
<script src="/js/auth.js?v=8" defer></script>`;
}

function shabbatCard(sh) {
  if (!sh) return '';
  const out = sh.chag ? (sh.havdalah.d === 'מוצאי שבת' ? 'צאת שבת וחג' : 'צאת החג') : 'צאת שבת';
  // מוסתר כברירת מחדל; הסקריפט מציג אותו מיום ההדלקה ועד צאת השבת/החג
  return `<p class="shab" data-from="${sh.candle.iso}" data-to="${sh.havdalah.iso}" title="מנהג ירושלים: הדלקה 40 דקות לפני השקיעה" hidden>${svg('M12 3c2 2.6 3 4.2 3 6a3 3 0 0 1-6 0c0-1.8 1-3.4 3-6zM9.5 14h5v7h-5z', 18, 'currentColor', 2)}<b>${esc(sh.title)}</b><span>הדלקת נרות <b class="mono">${sh.candle.t}</b></span><span>${out} <b class="mono">${sh.havdalah.t}</b></span></p>`;
}

const FRESH_ICON = { 'מבצע': ICON.tag, 'עסק': ICON.store, 'בעל מקצוע': ICON.wrench, 'נדל״ן': ICON.key, 'יד שנייה': ICON.bag, 'דרושים': ICON.brief, 'גמ״ח': ICON.heart, 'התנדבות': ICON.hand, 'אבידה': ICON.lost, 'מציאה': ICON.lost };
function freshPanel(rows) {
  if (!rows?.length) return '';
  const av = (r) => r.img ? `<img src="${esc(r.img)}" alt="" loading="lazy" width="44" height="44">` : svg(FRESH_ICON[r.k] || ICON.star, 22, 'currentColor', 2);
  return `<div class="panel fresh">
<div class="panel-head"><h2>חדש <span class="em">בשכונה</span></h2></div>
${rows.map((r) => `<a class="fr" href="${esc(r.h)}"><i>${av(r)}</i><span class="fr-t"><b>${esc(r.n)}</b><small>${esc(r.k)}${r.s && r.s !== r.k ? ` · ${esc(r.s)}` : ''}</small></span></a>`).join('\n')}
</div>`;
}

const DISC_ICON = { parks: ICON.tree, education: ICON.school, health: ICON.health, services: ICON.civic, gmach: ICON.heart, halls: ICON.hall };
const DISC_TONE = { parks: 'green', education: 'teal', health: 'rose', services: 'teal', gmach: 'violet', halls: 'amber' };
function discoverSection(rows) {
  if (!rows?.length) return '';
  return `<section id="discover" aria-label="גלו את השכונה" class="wrap disc">
<div class="sec-head">${head2('מקומות ושירותים קרובים', 'גלו את', 'השכונה')}</div>
<div class="disc-row">${rows.map((r) => `<a class="disc-card lift" href="${esc(r.h)}">${r.img ? `<div class="disc-media">${img(r.img, r.n)}</div>` : `<div class="disc-media art v${artV(r.h)} t-${DISC_TONE[r.seg] || 'blue'}">${artIcon(DISC_ICON[r.seg] || ICON.star)}</div>`}<div class="disc-body"><em>${esc(r.label)}</em><b class="clamp2">${esc(r.n)}</b>${r.s ? `<small>${esc(r.s)}</small>` : ''}</div></a>`).join('')}</div>
</section>`;
}

function adSlot() {
  return `<a class="adslot" href="${APP}"><i>${svg(ICON.store, 26, 'currentColor', 2)}</i><span><b>המקום הזה פנוי לעסק שלכם</b><small>הופיעו כאן מול כל השכונה ←</small></span></a>`;
}

function phonesStrip() {
  return `<div class="phstrip" aria-label="טלפונים חשובים"><div class="wrap">${PHONES.map(([n, num, hot]) => `<span>${esc(n)} <a${hot ? ' class="hot"' : ''} href="tel:${num}">${num}</a></span>`).join('')}</div></div>`;
}

export function homePage(vm, { base, path: pagePath, shabbat = null, fresh = [], discover = [] }) {
  vm.fresh = fresh;
  const url = `${base}${pagePath}`;
  const title = `${vm.name}${vm.alias ? ` (${vm.alias})` : ''} — שכונה | מניינים, עסקים, גמ״חים ומבצעים`;
  const desc = `כל מה שקורה ב${vm.name}${vm.alias ? ` (${vm.alias})` : ''}, ${vm.city}: זמני תפילה, בעלי מקצוע, עסקים, מבצעים, נדל״ן, דרושים, יד שנייה וגמ״חים — מעודכן על ידי השכנים.`;

  return `${pageHead({ title, desc, url, base })}<a href="#main" class="sr">דלג לתוכן</a>

${siteHeader(vm, pagePath, navChips(pagePath, 'home'))}

<main id="main">

<section class="hero" aria-label="עכשיו בשכונה">
<svg class="hero-sky" aria-hidden="true" width="100%" height="150" viewBox="0 0 1440 150" preserveAspectRatio="none" fill="none" stroke="#8CCBF2" stroke-opacity=".12" stroke-width="2"><path d="M0 150V110h50V85h40v40h30V70h60v45h25V55h50v40h40V45h70v70h30V80h50v30h40V40h70v80h30V70h50v35h40V85h60v65h40V60h50v65h30V95h60v55h40V75h70v75h50V90h60v60h40V70h60v80h50"/></svg>
<div class="wrap hero-row">
<div class="hero-text">
<span class="now"><span class="dot"></span><span data-day>${esc(vm.name)}</span> · <span data-greet>ברוכים הבאים</span></span>
<div class="h-row"><h1>מה חדש <span class="emd">ב${esc(vm.name)}</span></h1>
<p>מניינים, עסקים, בעלי מקצוע, מבצעים וגמ״חים — מעודכנים על ידי השכנים והעסקים עצמם.</p></div>
${shabbatCard(shabbat)}
</div>
<a class="pill btn-sky dl m-only" href="${DOWNLOAD}">להורדת האפליקציה</a>
${adSlot()}
</div>
${ticker(vm)}
</section>

${boardSection(vm)}
${vm.promos.length >= 3 ? promosSection(vm.promos) : promosStrip(vm.promos)}
${prosSection(vm.professionals)}
${bizSection(vm.businesses)}
${realEstateSection(vm.realEstate)}
${discoverSection(discover)}

<section id="zones" aria-label="כל התחומים" class="wrap" style="display:flex;flex-direction:column;gap:18px">
<h2 style="margin:0;font-size:30px;font-weight:800;color:var(--navy)">כל <span class="em">התחומים</span></h2>
<div class="zones">
${ZONES.filter((z) => !HIDDEN_NAV.has(z[4] || zoneKey(z[3]))).map(([n, d, c, href]) => `<a class="zone lift" href="${href === '@minyanim' ? MINYANIM : href || APP}"><i class="z-${c}">${svg(d)}</i>${esc(n)}</a>`).join('\n')}
</div>
</section>

<section class="owners" aria-label="לבעלי עסקים"><div class="wrap">
<div class="txt">
<span style="font-size:15px;font-weight:800;color:var(--sky)">לבעלי עסקים ובעלי מקצוע</span>
<h2>השכנים כבר <span class="emd">מחפשים אותך.</span></h2>
<p>פרופיל עסק, מבצעים וקופונים והמלצות מלקוחות — במקום אחד. ההרשמה בחינם.</p>
<div style="display:flex;gap:12px;flex-wrap:wrap"><a class="pill btn-sky" href="${APP}">להרשמת עסק בחינם</a><a class="pill btn-out" href="${DOWNLOAD}">להורדת האפליקציה</a></div>
<a href="${BIZ_PORTAL}" style="color:var(--sky);font-weight:800;font-size:15px">כבר רשומים? לכניסה ולניהול העסק ←</a>
</div>
<div class="feat">
<div><b>פרופיל עסק</b><span>שעות, טלפון, WhatsApp ו-Waze</span></div>
<div><b>מבצעים וקופונים</b><span>עם התראה לשכונה</span></div>
<div><b>המלצות</b><span>לקוחות ממליצים בלחיצה</span></div>
<div><b>עמוד משלכם באתר</b><span>שמופיע בחיפוש בגוגל</span></div>
</div>
</div></section>

<section class="wrap faq" aria-label="שאלות נפוצות">
<h2>שאלות <span class="em">נפוצות</span></h2>
<div class="list">
${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}
</div>
</section>

</main>

${phonesStrip()}
${siteFooter()}

<script type="application/json" id="prayers-data">${JSON.stringify(vm.prayers).replace(/</g, '\\u003c')}</script>
<script>${clientJs()}</script>
<script>${HOOD_JS}</script>
</body>
</html>
`;
}
