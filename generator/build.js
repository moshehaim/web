#!/usr/bin/env node
/**
 * גנרטור עמודי SEO — מניינים בהר חומה.
 *
 * קורא מ-Supabase עם ה-anon key (אותו מפתח ציבורי שהאפליקציה משתמשת בו)
 * ומייצר HTML סטטי לתוך הרפו. רץ פעם ביום ב-GitHub Actions.
 *
 *   node build.js --out ../ [--dry]
 *   node build.js --fixture data.json --out /tmp/preview   ← עמוד הבית בלבד, בלי רשת
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { SlugStore } from './lib/slugs.js';
import { computeZmanim, sortPrayers, formatPrayerTime, NUSACH } from './lib/prayers.js';
import { isPrayerInSeason } from './lib/season.js';
import { sitemap } from './lib/template.js';
import { minyanimIndexPage, synagoguePageNew } from './lib/minyanim-template.js';
import { fetchHome, shapeHome, shapePrayers, fetchDirectory, shapeDirectory, fetchListings, shapeListings, fetchMore, shapeMore } from './lib/home-data.js';
import { homePage, HIDDEN_NAV, navChips, setSiteHome } from './lib/home-template.js';
import { setMinyanimSection } from './lib/minyanim-template.js';
import { COMMUNITIES, slugById } from './communities.js';
import { entityPage, detailPage } from './lib/entity-template.js';
import { fetchDetails, shapeDetails, shabbatTimes, nextShabbat } from './lib/details.js';
import { isIsraeliDST } from './lib/season.js';
import { managePage } from './lib/manage-template.js';
import { compactHours, listPage, promosPage, realEstatePage, boardPage, lessonsPage, hallsPage, hostingPage, eduPage, parksPage, servicesPage, healthPage, eventsPage, happeningsPage } from './lib/list-template.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * המפתח נקרא מ-app/.env שכבר קיים ברפו (הוא נוצר ע"י build של Flutter Web).
 * anon key נועד להיות ציבורי — RLS הוא שמגן על הנתונים, לא סודיות המפתח.
 * משתנה סביבה דורס, אם אי פעם נרצה להריץ מול פרויקט אחר.
 */
function fromDotEnv(file) {
  try {
    return Object.fromEntries(
      fs.readFileSync(file, 'utf8')
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#'))
        .map((l) => {
          const i = l.indexOf('=');
          return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
        })
    );
  } catch {
    return {};
  }
}

const env = fromDotEnv(path.resolve(__dirname, '../app/.env'));

const SUPABASE_URL = process.env.SUPABASE_URL || env.SUPABASE_URL;
const ANON_KEY     = process.env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
const BASE         = process.env.SITE_BASE || 'https://shchuna.co.il';

const args   = process.argv.slice(2);
const DRY    = args.includes('--dry');
const outIdx = args.indexOf('--out');
const OUT    = path.resolve(__dirname, outIdx > -1 ? args[outIdx + 1] : '../out');
// השכונה שנבנית עכשיו (הבנייה רצה שכונה אחרי שכונה — ראו communities.js)
let COMMUNITY_ID, HOME, SECTION, PRIMARY = false;  // HOME: /har-homa/ · SECTION: /har-homa/minyanim/
const OLD_SECTION = 'minyanim-har-homa';  // הכתובת הישנה של השכונה הראשית — נשארת כהפניות, גוגל כבר מכיר אותה
const onlyIdx = args.indexOf('--only');   // --only gilo,beit-vagan  → רק השכונות האלה
const ONLY = onlyIdx > -1 ? args[onlyIdx + 1].split(',') : null;

function setCommunity(c) {
  COMMUNITY_ID = c.id; HOME = c.slug; SECTION = `${HOME}/minyanim`; PRIMARY = !!c.primary;
  EXTRA_URLS = []; SEARCH = [];
  setSiteHome(`/${HOME}/`); setMinyanimSection(`/${SECTION}/`);
}
const fxIdx   = args.indexOf('--fixture');
const FIXTURE = fxIdx > -1 ? path.resolve(process.cwd(), args[fxIdx + 1]) : null;

if (!FIXTURE && (!SUPABASE_URL || !ANON_KEY)) {
  console.error('לא נמצאו SUPABASE_URL / SUPABASE_ANON_KEY — לא ב-app/.env ולא בסביבה');
  process.exit(1);
}

const write = (rel, content) => {
  const file = path.join(OUT, rel);
  if (DRY) { console.log(`  [dry] ${rel}  (${content.length} bytes)`); return; }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
};

// ספירת לחיצות מהדפדפן: אותו anon key ציבורי שהאפליקציה בווב משתמשת בו
const API = SUPABASE_URL && ANON_KEY ? { url: SUPABASE_URL, key: ANON_KEY } : null;

let EXTRA_URLS = [];
/** תחומים בלי תוכן בשכונה הנוכחית */
let EMPTY = new Set();
let LIVE = new Set();
const NAV_KEYS = ['biz', 'pros', 'promos', 'gmach', 'jobs', 'second', 'realestate', 'vol', 'lost', 'halls', 'events', 'education', 'parks', 'services', 'health', 'board', 'lessons', 'hosting'];
function emptyKeys(dirRaw, lsRaw, moreRaw) {
  const n = (...a) => a.reduce((s, x) => s + (Array.isArray(x) ? x.length : 0), 0);
  const e = new Set();
  const add = (k, cnt) => { if (!cnt) e.add(k); };
  if (dirRaw) {
    const d = shapeDirectory(dirRaw); add('biz', d.biz.items.length); add('pros', d.pros.items.length);
    add('events', d.biz.items.length + d.pros.items.length);  // "הכל לאירוע" נבנה מהעסקים ובעלי המקצוע
  }
  if (lsRaw) {
    const L = lsRaw;
    add('promos', n(L.promotions, L.coupons)); add('realestate', n(L.sale, L.rent));
    add('gmach', n(L.gmachim)); add('jobs', n(L.jobs)); add('second', n(L.secondHand)); add('vol', n(L.volunteering)); add('lost', n(L.lostFound));
    add('board', n(L.gmachim, L.jobs, L.secondHand, L.volunteering, L.lostFound));
  }
  if (moreRaw) {
    const M = moreRaw;
    add('halls', n(M.halls, M.hosting)); add('hosting', n(M.hosting)); add('lessons', n(M.lessons));
    add('education', n(M.edu)); add('parks', n(M.parks)); add('services', n(M.services)); add('health', n(M.health));
  }
  return e;
}
/** עמוד רשימה של תחום ריק: noindex (שגוגל לא יציג עמוד ריק) */
const listHtml = (key, html) => (EMPTY.has(key)
  ? html.replace('<meta name="description"', '<meta name="robots" content="noindex,follow">\n<meta name="description"') : html);
/** אינדקס החיפוש שבראש העמוד: {n שם, t סוג, s תיאור, h קישור, o סדר} → har-homa/search.json */
let SEARCH = [];
const addSearch = (n, t, s, h, o) => { if (n && h) SEARCH.push({ n: String(n).trim(), t, s: (s || '').trim() || undefined, h, o }); };
const writeSearch = () => {
  const seen = new Set();
  const out = SEARCH.filter((x) => !seen.has(x.h + '|' + x.n) && seen.add(x.h + '|' + x.n));
  write(path.join(HOME, 'search.json'), JSON.stringify(out));
  console.log(`  ${HOME}/search.json · ${out.length} פריטים`);
};

/** מוחק עמודים של ישויות שכבר לא קיימות (מבצע שפג, מודעה שירדה) — שומר רק את מה שנכתב עכשיו */
function prune(dir, keep) {
  if (DRY || !fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory() && !keep.has(name)) fs.rmSync(full, { recursive: true, force: true });
  }
}

/** "גלו את השכונה": 4 מקומות מהתחומים הקבועים, מתחלפים פעם ביום (לפי התאריך בירושלים) */
const DISCOVER = [['parks', 'גנים ופארקים'], ['education', 'מוסדות חינוך'], ['health', 'בריאות'], ['services', 'שירותי קהילה'], ['gmach', 'גמ״חים'], ['halls', 'אולמות']];
function discoverItems(details, now = new Date()) {
  const day = Math.floor(new Date(now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' })).getTime() / 86400000);
  const pool = DISCOVER.map(([seg, label]) => {
    // דפיברילטור הוא נקודת חירום, לא "מקום לגלות"
    const all = (details || []).filter((d) => d.href && (seg === 'gmach' ? d.boardKey === 'gmach' : d.seg === seg) && d.kicker !== 'דפיברילטור');
    const withImg = all.filter((d) => d.img);
    return { seg, label, items: withImg.length >= 3 ? withImg : all };
  }).filter((c) => c.items.length);
  const out = [];
  for (let i = 0; i < pool.length && out.length < 4; i++) {
    const c = pool[(day + i) % pool.length];
    const d = c.items[(day * 7 + i * 3) % c.items.length];
    out.push({ seg: c.seg, label: c.label, n: d.name, s: d.where || ([d.kicker].find((k) => k && k !== c.label && k !== d.name && !c.label.replace(/״/g, '').startsWith(k.replace(/״/g, ''))) || ''), img: d.img, h: d.href });
  }
  return out;
}

/** "חדש בשכונה": 4 הפריטים האחרונים מכל הקטגוריות, חלון של 14 יום */
const BOARD_KIND = { jobs: 'דרושים', second: 'יד שנייה', gmach: 'גמ״ח', vol: 'התנדבות' };
function freshItems(dir, details, detRaw, hrefById) {
  const now = Date.now(), MAX = 14 * 86400000;
  const created = {};
  for (const rows of Object.values(detRaw || {})) for (const r of rows || []) if (r?.id && r.created_at) created[r.id] = r.created_at;
  const ok = (c) => c && now - new Date(c) < MAX && now >= new Date(c);
  const rows = [
    ...dir.pros.items.filter((x) => ok(x.created) && !x.quiet && x.href).map((x) => ({ k: 'בעל מקצוע', n: x.name, s: x.field, img: x.img, h: x.href, c: x.created })),
    ...dir.biz.items.filter((x) => ok(x.created) && !x.quiet && x.href).map((x) => ({ k: 'עסק', n: x.name, s: x.field, img: x.img, h: x.href, c: x.created })),
    ...(details || []).filter((d) => ['promos', 'realestate', 'board'].includes(d.seg) && d.href && ok(created[d.id])).map((d) => ({
      k: d.seg === 'promos' ? 'מבצע' : d.seg === 'realestate' ? 'נדל״ן' : BOARD_KIND[d.boardKey] || d.kicker,
      n: d.name, s: d.seg === 'promos' ? (d.provider || d.kicker) : d.seg === 'realestate' ? d.kicker : '', img: d.img, h: d.href, c: created[d.id] })),
  ].sort((a, b) => new Date(b.c) - new Date(a.c));
  const seen = new Set();
  return rows.filter((r) => !seen.has(r.h) && seen.add(r.h)).slice(0, 4);
}

const writeHome = (raw, dirRaw, lsRaw, moreRaw, synSlugs, detRaw) => {
  // "אירועים" מופיע בשורת התחומים רק כשיש אירועים קרובים
  if (moreRaw?.events?.length) HIDDEN_NAV.delete('happenings'); else HIDDEN_NAV.add('happenings');
  // תחומים ריקים בשכונה: לא בשורת התחומים, לא באריחים, noindex ולא ב-sitemap.
  // עסקים ובעלי מקצוע נשארים בניווט גם כשהם ריקים — שם ההזמנה להירשם.
  for (const k of NAV_KEYS) HIDDEN_NAV.delete(k);
  EMPTY = emptyKeys(dirRaw, lsRaw, moreRaw);
  for (const k of EMPTY) if (k !== 'biz' && k !== 'pros') HIDDEN_NAV.add(k);
  const home = `/${HOME}/`;
  const vm = shapeHome(raw, { now: new Date(), base: BASE });
  // בורר השכונות: כל שכונה שיש לה עמודים — לעמוד שלה
  for (const h of vm.hoods) if (!h.current && LIVE.has(h.id)) h.href = `/${slugById[h.id]}/`;
  vm.hoods.sort((a, b) => (b.current - a.current) || (b.active - a.active) || (!!b.href - !!a.href) || a.name.localeCompare(b.name, 'he'));
  const st = raw.community.latitude ? shabbatTimes(raw.community.latitude, raw.community.longitude) : null;

  // 1. עסקים ובעלי מקצוע — slug יציב לכל ישות (נשמר ב-slugs.json)
  const hrefById = {};
  let allDetails = [];
  // התחומים עצמם — "גמ״ח" או "אולמות" מובילים לרשימה
  for (const m of navChips(home).matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g)) if (m[1] !== home) addSearch(m[2], 'תחום', '', m[1], 1);
  const dir = dirRaw ? shapeDirectory(dirRaw) : null;
  if (dir) for (const kind of ['pros', 'biz']) {
    const store = new SlugStore(path.join(OUT, HOME, kind, 'slugs.json'));
    const keep = new Set();
    for (const e of dir[kind].items) {
      e.slug = store.get(e.id, e.name); keep.add(e.slug);
      e.href = hrefById[e.id] = `${home}${kind}/${encodeURIComponent(e.slug)}/`;
    }
    // "עוד באותו תחום": 4 מאותה קבוצה (עם תמונה קודם), בלי הדף עצמו
    for (const e of dir[kind].items) {
      e.related = dir[kind].items.filter((o) => o !== e && o.group === e.group)
        .sort((a, b) => (!!b.img - !!a.img) || (a.i - b.i)).slice(0, 4)
        .map((o) => ({ name: o.name, field: o.field, img: o.img, href: o.href, rec: o.rec }));
      write(path.join(HOME, kind, e.slug, 'index.html'), entityPage(vm, e, { base: BASE, home, kind, api: API, st }));
      EXTRA_URLS.push({ loc: `${BASE}${e.href}`, freq: 'weekly', pri: '0.6' });
      addSearch(e.name, kind === 'pros' ? 'בעל מקצוע' : 'עסק',
        [e.field, e.group !== e.field ? e.group : '', ...(e.detail?.tags || [])].filter(Boolean).join(' · '), e.href, 2);
    }
    prune(path.join(OUT, HOME, kind), keep);
    if (!DRY) store.save();
  }

  // 2. כל שאר הרכיבים — עמוד מלא לכל אחד
  if (detRaw) {
    const all = allDetails = shapeDetails(detRaw, raw.community);
    const bySeg = {};
    for (const d of all) (bySeg[d.seg] ||= []).push(d);
    for (const [seg, items] of Object.entries(bySeg)) {
      const store = new SlugStore(path.join(OUT, HOME, seg, 'slugs.json'));
      const keep = new Set();
      for (const d of items) {
        d.slug = store.get(d.id, d.name); keep.add(d.slug);
        d.href = hrefById[d.id] = `${home}${seg}/${encodeURIComponent(d.slug)}/`;
      }
      for (const d of items) {
        const e = { ...d, field: d.kicker, group: d.kicker, detail: { desc: d.desc, facts: d.facts, tags: [], sections: d.sections,
          schedule: d.schedule, lat: d.lat, lng: d.lng, promos: [] }, providerHref: d.providerId ? hrefById[d.providerId] : null };
        write(path.join(HOME, seg, d.slug, 'index.html'), detailPage(vm, e, { base: BASE, home, kind: seg, api: API, st,
          listLabel: d.list, ldType: d.ld, listHref: d.boardKey ? `${home}board/#${d.boardKey}` : `${home}${seg}/` }));
        EXTRA_URLS.push({ loc: `${BASE}${d.href}`, freq: 'weekly', pri: '0.5' });
        addSearch(d.name, d.list, [d.kicker].filter(Boolean).join(' · '), d.href, 3);
      }
      prune(path.join(OUT, HOME, seg), keep);
      if (!DRY) store.save();
    }
    console.log(`  עמודים מלאים · ${all.length}`);
  }
  const link = (items) => { for (const x of items) {
    if (x.coupon && x.id) { x.href = `${home}promos/#c-${x.id}`; continue; }  // קופון: לכרטיס שלו בעמוד המבצעים (שם לוקחים)
    if (!x.href && hrefById[x.id]) x.href = hrefById[x.id];
  } };

  // לוח השכונה בעמוד הבית: כל מודעה לעמוד המלא שלה
  // כל כרטיס בעמוד הבית — לעמוד המלא שלו
  for (const t of vm.board || []) link(t.items);
  [vm.professionals, vm.businesses, vm.promos, vm.realEstate].forEach((a) => a && link(a));
  // תחומים שאוחדו בשורת התחומים — עדיין נמצאים בחיפוש
  addSearch('שיעורי תורה', 'תחום', '', `${home}lessons/`, 1); addSearch('אירוח', 'תחום', '', `${home}halls/`, 1); addSearch('קופונים', 'תחום', '', `${home}promos/#coupons`, 1);
  // 0. עמוד הבית — אחרי שלכל ישות יש קישור (בשביל "חדש בשכונה")
  const shabbat = raw.community.latitude ? nextShabbat(raw.community.latitude, raw.community.longitude) : null;
  write(path.join(HOME, 'index.html'), homePage(vm, { base: BASE, path: home, shabbat, fresh: dir ? freshItems(dir, allDetails, detRaw, hrefById) : [], discover: discoverItems(allDetails) }));
  // ניהול העסק (שלד; הלוגיקה ב-/js/manage.js) — noindex, לא ב-sitemap. עמוד אחד לכל האתר
  if (PRIMARY) write(path.join('my-business', 'index.html'), managePage(vm, { base: BASE, home }));
  console.log(`  ${HOME}/  · ${vm.promos.length} מבצעים · ${vm.professionals.length} בעלי מקצוע · ` +
    `${vm.businesses.length} עסקים · ${vm.realEstate.length} נכסים · ${vm.prayers.length} מניינים היום`);

  // 3. רשימות — עכשיו, כשלכל פריט יש קישור לעמוד המלא
  if (lsRaw) {
    const ls = shapeListings(lsRaw, raw.community);
    [ls.promos, ls.realEstate, ls.board].forEach((x) => link(x.items));
    const o = { base: BASE, home };
    write(path.join(HOME, 'promos', 'index.html'), listHtml('promos', promosPage(vm, ls, o)));
    write(path.join(HOME, 'realestate', 'index.html'), listHtml('realestate', realEstatePage(vm, ls, o)));
    write(path.join(HOME, 'board', 'index.html'), listHtml('board', boardPage(vm, ls, o)));
    console.log(`  promos · ${ls.promos.items.length}   realestate · ${ls.realEstate.items.length}   board · ${ls.board.items.length}`);
  }
  if (!dir) return vm;
  // שעות לתג "פתוח עכשיו" ברשימות
  for (const x of [...dir.pros.items, ...dir.biz.items]) x.hoursJ = compactHours(x.detail?.schedule, st, isIsraeliDST());
  for (const kind of ['pros', 'biz']) {
    write(path.join(HOME, kind, 'index.html'), listHtml(kind, listPage(vm, dir, kind, { base: BASE, home, api: API })));
  }
  console.log(`  ${HOME}/pros/ · ${dir.pros.items.length}   ${HOME}/biz/ · ${dir.biz.items.length}`);
  if (moreRaw) {
    const m = shapeMore(moreRaw, dir, synSlugs || {}, `${home}minyanim/`);
    // שיעורים בחיפוש — לפי נושא, רב ובית כנסת
    for (const l of m.lessons.items) addSearch(l.t, 'שיעור', [l.group, l.sub].filter(Boolean).join(' · '), l.href || `${home}lessons/`, 3);
    [m.halls, m.hosting, m.edu, m.parks, m.services, m.health, m.events].forEach((x) => link(x.items));
    const o = { base: BASE, home, api: API };
    const pages = { lessons: lessonsPage, halls: hallsPage, hosting: hostingPage, education: eduPage,
      parks: parksPage, services: servicesPage, health: healthPage, events: eventsPage };
    if (m.happenings.items.length) pages.happenings = happeningsPage;
    for (const [slug, fn] of Object.entries(pages)) write(path.join(HOME, slug, 'index.html'), listHtml(slug, fn(vm, m, o)));
    console.log(`  lessons · ${m.lessons.items.length}  halls · ${m.halls.items.length}  hosting · ${m.hosting.items.length}  education · ${m.edu.items.length}  parks · ${m.parks.items.length}  services · ${m.services.items.length}  events · ${m.events.items.length}`);
  }
  return vm;
};

/** slug יציב לבתי הכנסת: בפעם הראשונה בכתובת החדשה — יורש את ה-slugs מהכתובת הישנה */
function synSlugStore() {
  const file = path.join(OUT, SECTION, 'slugs.json'), old = path.join(OUT, OLD_SECTION, 'slugs.json');
  if (PRIMARY && !DRY && !fs.existsSync(file) && fs.existsSync(old)) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.copyFileSync(old, file); }
  return new SlugStore(file);
}

/** הפניה מכתובת ישנה: canonical + meta refresh מיידי (גוגל מתייחס לזה כהפניה קבועה) */
const redirectPage = (to) => `<!DOCTYPE html>
<html lang="he" dir="rtl"><head><meta charset="utf-8"><title>הועבר</title>
<link rel="canonical" href="${BASE}${to}"><meta name="robots" content="noindex,follow">
<meta http-equiv="refresh" content="0; url=${to}"><script>location.replace(${JSON.stringify(to)}+location.hash)</script>
</head><body><p>העמוד עבר: <a href="${to}">${BASE}${to}</a></p></body></html>
`;

/** עמודי המניינים (אינדקס + בית כנסת). vm — לראש העמוד המשותף. */
function writeMinyanim({ vm, community, syns, prayers, lessons, slugs, urls }) {
  const home = `/${HOME}/`;
  const today = new Date();
  const zmanim = computeZmanim(community.latitude, community.longitude, today);
  const byId = (rows) => rows.reduce((m, r) => ((m[String(r.synagogue_id)] ||= []).push(r), m), {});
  const P = byId(prayers || []);
  const L = byId(lessons || []);
  const name = Object.fromEntries(syns.map((s) => [String(s.id), s.name]));
  const todayList = shapePrayers((prayers || []).map((p) => ({ syn: name[String(p.synagogue_id)], type: p.type,
    time: p.time, set: p.set, season: p.season, days: p.selected_days })).filter((p) => p.syn), community, today);

  const listed = [];
  for (const syn of syns) {
    syn.slug = slugs.get(syn.id, syn.name);
    const p = (P[String(syn.id)] || []).filter((x) => isPrayerInSeason(x));
    const l = L[String(syn.id)] || [];
    if (PRIMARY) write(path.join(OLD_SECTION, syn.slug, 'index.html'), redirectPage(`/${SECTION}/${encodeURIComponent(syn.slug)}/`));
    write(path.join(SECTION, syn.slug, 'index.html'),
      synagoguePageNew({ vm, home, syn, prayers: p, lessons: l, zmanim, today: todayList, base: BASE }));
    urls.push({ loc: `${BASE}/${SECTION}/${encodeURIComponent(syn.slug)}/`, freq: 'weekly', pri: '0.7' });
    // תצוגה מקדימה: התפילה הראשונה של היום בכל סוג
    const seen = new Set();
    const first = todayList.filter((t) => t.n === syn.name && !seen.has(t.t) && seen.add(t.t))
      .sort((a, b) => ['שחרית', 'מנחה', 'ערבית'].indexOf(a.t) - ['שחרית', 'מנחה', 'ערבית'].indexOf(b.t))
      .filter((t) => ['שחרית', 'מנחה', 'ערבית'].includes(t.t))
      .map((t) => ({ type: t.t, time: t.c }));
    listed.push({ ...syn, first, has: p.length > 0 });
    addSearch(syn.name, 'בית כנסת', [NUSACH[syn.prayer_nusach] && syn.prayer_nusach !== 'other' ? `נוסח ${NUSACH[syn.prayer_nusach]}` : '', syn.address].filter(Boolean).join(' · '),
      `/${SECTION}/${encodeURIComponent(syn.slug)}/`, 2);
  }
  // בתי כנסת עם זמנים קודם, ואז לפי א״ב
  listed.sort((a, b) => (b.has - a.has) || a.name.localeCompare(b.name, 'he'));
  if (PRIMARY) write(path.join(OLD_SECTION, 'index.html'), redirectPage(`/${SECTION}/`));
  write(path.join(SECTION, 'index.html'), minyanimIndexPage({ vm, home, synagogues: listed, today: todayList, base: BASE }));
  console.log(`  ${SECTION}/ · ${syns.length} בתי כנסת · ${todayList.length} מניינים היום`);
}

/** ראש עמוד מינימלי אם עמוד הבית לא נבנה */
const fallbackVm = (c) => ({ name: c.neighborhood, alias: c.secondaryname || '', city: c.city || 'ירושלים', subs: [],
  hoods: [{ name: c.neighborhood, active: true, current: true }] });

async function main() {
  const list = COMMUNITIES.filter((c) => (ONLY ? ONLY.includes(c.slug) : c.build));
  // שכונות עם עמודים באוויר: הקבועות (build) + מה שנבנה בריצה הזו
  LIVE = new Set([...COMMUNITIES.filter((c) => c.build), ...list].map((c) => c.id));
  if (!list.length) { console.error('אין שכונות לבנייה'); process.exit(1); }

  if (FIXTURE) {
    setCommunity(list[0]);
    const fx = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
    const vm = writeHome(fx, fx.directory, fx.listings, fx.more, {}, fx.details);
    if (fx.minyanim) {
      writeMinyanim({ vm, community: fx.community, ...fx.minyanim,
        slugs: synSlugStore(), urls: [] });
    }
    writeSearch();
    return;
  }

  const db = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

  // דפי השורש הידניים. חייבים להיות זהים תו-לתו ל-canonical שבקבצים
  // עצמם (index.html, privacy.html, terms.html) — פער ביניהם הוא סתירה.
  const urls = [
    { loc: `${BASE}/`,             freq: 'monthly', pri: '1.0' },
    { loc: `${BASE}/privacy.html`, freq: 'yearly',  pri: '0.2' },
    { loc: `${BASE}/terms.html`,   freq: 'yearly',  pri: '0.2' },
  ];
  let totals = { syns: 0, prayers: 0 };
  for (const c of list) {
    setCommunity(c);
    console.log(`\n— ${HOME} —`);
    const r = await buildCommunity(db, urls);
    totals.syns += r.syns; totals.prayers += r.prayers;
  }

  // מזהה קהילה → כתובת, לעמוד ניהול העסק (js/manage.js). רק שכונות שנבנות קבוע
  write('hoods.json', JSON.stringify(Object.fromEntries(COMMUNITIES.filter((c) => c.build).map((c) => [c.id, c.slug]))));
  write('sitemap.xml', sitemap(urls));
  write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\n`);

  console.log(`\n✓ ${list.length} שכונות · ${totals.syns} בתי כנסת · ${totals.prayers} מניינים`);
  console.log(`  ${urls.length} כתובות ב-sitemap`);
  if (DRY) console.log('  (הרצה יבשה — לא נכתבו קבצים)');
}

/** שכונה אחת: עמוד הבית, הרשימות, העמודים המלאים והמניינים. מוסיף את הכתובות שלה ל-urls. */
async function buildCommunity(db, urls) {
  const [{ data: community, error: e0 }, { data: syns, error: e1 }] = await Promise.all([
    db.from('community').select('neighborhood,secondaryname,city,latitude,longitude').eq('id', COMMUNITY_ID).single(),
    db.from('synagogues')
      .select('id,name,address,access_notes,rabbi_name,prayer_nusach,latitude,longitude,' +
              'is_accessible,has_hall,can_study_during_day,study_during_day_details')
      .eq('community_id', COMMUNITY_ID)
      .order('name'),
  ]);
  if (e0 || e1) throw e0 || e1;

  const ids = syns.map((s) => String(s.id));
  const [{ data: prayers, error: e2 }, { data: lessons, error: e3 }] = await Promise.all([
    db.from('prayers').select('id,synagogue_id,type,time,set,season,is_open,selected_days,notes')
      .in('synagogue_id', ids),
    db.from('lessons').select('id,synagogue_id,topic,teacher,day,start_time,end_time,type')
      .in('synagogue_id', ids),
  ]);
  if (e2 || e3) throw e2 || e3;

  const slugs  = synSlugStore();



  // עמוד הבית והרשימות — כשל בהם לא יעצור את עמודי המניינים
  let vm = fallbackVm(community);
  EMPTY = new Set();
  try {
    const [home, dirRaw, lsRaw, moreRaw, detRaw] = await Promise.all([
      fetchHome(db, COMMUNITY_ID), fetchDirectory(db, COMMUNITY_ID), fetchListings(db, COMMUNITY_ID), fetchMore(db, COMMUNITY_ID),
      fetchDetails(db, COMMUNITY_ID)]);
    // slugs של בתי הכנסת — לקישור משיעור לעמוד בית הכנסת
    const synSlugs = Object.fromEntries(syns.map((s) => [s.name, slugs.get(s.id, s.name)]));
    vm = writeHome(home, dirRaw, lsRaw, moreRaw, synSlugs, detRaw);
  }
  catch (e) { console.error(`  ⚠ ${HOME}/ לא נבנה:`, e.message || e); process.exitCode = 0; }

  // תחומים ריקים לא נכנסים ל-sitemap
  urls.push(...[
    { loc: `${BASE}/${SECTION}/`,  freq: 'weekly',  pri: '0.9' },
    { loc: `${BASE}/${HOME}/`,     freq: 'daily',   pri: '0.9' },
    { loc: `${BASE}/${HOME}/pros/`, freq: 'weekly', pri: '0.8' },
    { loc: `${BASE}/${HOME}/biz/`,  freq: 'weekly', pri: '0.8' },
    { loc: `${BASE}/${HOME}/promos/`, freq: 'daily', pri: '0.7' },
    { loc: `${BASE}/${HOME}/realestate/`, freq: 'daily', pri: '0.8' },
    { loc: `${BASE}/${HOME}/board/`, freq: 'daily', pri: '0.7' },
    ...['lessons', 'halls', 'hosting', 'education', 'parks', 'services', 'health', 'events']
      .map((k) => ({ loc: `${BASE}/${HOME}/${k}/`, freq: 'weekly', pri: '0.6' })),
  ].filter((u) => !EMPTY.has(u.loc.slice(`${BASE}/${HOME}/`.length).replace(/\/$/, ''))));
  writeMinyanim({ vm, community, syns, prayers, lessons, slugs, urls });
  urls.push(...EXTRA_URLS);
  writeSearch();

  if (!DRY && slugs.save()) console.log('  slugs.json עודכן');
  return { syns: syns.length, prayers: prayers.length };
}

main().catch((e) => { console.error(e); process.exit(1); });
