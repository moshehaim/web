/**
 * נתונים לעמוד הבית של שכונה.
 *
 * fetchHome — שאילתות anon ל-Supabase (רק עמודות ציבוריות).
 * shapeHome — הופך את השורות למודל תצוגה. פונקציה טהורה, כדי שאפשר
 *             יהיה לבנות מקומית מקובץ fixture בלי גישה לרשת.
 *
 * כללים שחשוב לשמור עליהם:
 *  - אין מספרי טלפון פרטיים (יד שנייה, אבידות, דרושים) — לא נבחרים בכלל.
 *  - אין קודי קופון — הקוד נחשף רק באפליקציה.
 *  - אין ספירות / סטטיסטיקות (מספר עסקים, צפיות וכו׳).
 *  - image_women_only=true → הפריט לא מוצג בעמוד הבית.
 *  - content_audience לא מסנן באתר: הסינון לפיו רק למשתמש רשום שביקש (מסמך 'התאמת תצוגה מגדרית'),
 *    והאתר הסטטי מוצג לאורחים.
 *  - recommend_count בלבד (entity_recommendations לא קריא ל-anon).
 */

import { computeZmanim, sortKey, formatPrayerTime } from './prayers.js';
import { isPrayerInSeason } from './season.js';

/** סוגי עסקים / קטגוריות שלא מוצגים בעמוד הבית הציבורי. */
// אין סינון לפי קטגוריה: בקטגוריות רגישות התמונה עוברת אישור לפני שהיא נכנסת ל-image_url
// (טריגרים intercept_*_image + app_config.image_moderation_rules), ו-image_women_only מסתיר אותה.

// בעמוד הבית הכרטיסים בנויים על תמונה, אז תמונה לנשים בלבד = הפריט לא בקרוסלה
const SHOW = (r) => !r.image_women_only;
// עכשיו בשעון ישראל, בפורמט של timestamp without time zone (start_date/end_date של מבצעים)
const nowIL = () => new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jerusalem' }).replace(' ', 'T');
// קופונים: בלי code. אזל (נלקחו כולם) — לא מוצג
const COUPON_COLS = 'id,image_url,text_content,expires_at,image_women_only,content_audience,provider_name,quantity,current_redemptions';
const AVAIL = (c) => !(c.quantity > 0) || (c.current_redemptions || 0) < c.quantity;

export async function fetchHome(db, communityId) {
  const nowIso = new Date().toISOString();
  const q = (p) => p.then(({ data, error }) => { if (error) throw error; return data || []; });
  const byCommunity = (t, cols) => db.from(t).select(cols).eq('community_id', communityId);

  const [
    community, communities, subs, businessTypes, profCategories,
    businesses, professionals, promotions, coupons, sale, rent,
    jobs, secondHand, gmachim, volunteering, lostFound, syns,
  ] = await Promise.all([
    db.from('community').select('id,city,neighborhood,secondaryname,latitude,longitude')
      .eq('id', communityId).single().then(({ data, error }) => { if (error) throw error; return data; }),
    q(db.from('community').select('id,neighborhood,secondaryname,neighborhoods,is_active').order('neighborhood')),
    q(db.from('sub_neighborhoods').select('label,sort_order,is_active').eq('community_id', communityId).order('sort_order')),
    q(db.from('business_types').select('id,name_he')),
    q(db.from('professional_categories').select('id,name_he')),
    q(byCommunity('businesses', 'id,name,image_url,business_type,recommend_count,image_women_only,content_audience')
      .not('is_active', 'is', false).not('image_url', 'is', null)
      .order('is_prominent', { ascending: false, nullsFirst: false })
      .order('priority', { ascending: false, nullsFirst: false })
      .order('recommend_count', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false }).limit(40)),
    q(byCommunity('professionals', 'id,name,main_category,image_url,recommend_count,image_women_only,content_audience')
      .not('is_active', 'is', false).not('image_url', 'is', null)
      .order('is_prominent', { ascending: false, nullsFirst: false })
      .order('priority', { ascending: false, nullsFirst: false })
      .order('recommend_count', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false }).limit(30)),
    q(byCommunity('promotions', 'id,title,image_url,provider_name,end_date,image_women_only,content_audience')
      .eq('is_active', true).lte('start_date', nowIL()).or(`end_date.is.null,end_date.gte."${nowIL()}"`)
      .order('created_at', { ascending: false }).limit(12)),
    // בלי code — הקוד לא יוצא לאתר הסטטי. ה-view עוקף RLS, לכן מסננים כאן פעיל/התחיל/בתוקף
    q(byCommunity('coupons_with_provider', COUPON_COLS)
      .eq('status', 'active').lte('start_date', nowIso).gt('expires_at', nowIso)
      .order('priority', { ascending: false, nullsFirst: false }).limit(12)),
    q(byCommunity('approve_property', 'id,full_address,asking_price,num_rooms,area_in_sqm,floor,property_type,image_urls')
      .order('created_at', { ascending: false }).limit(20)),
    q(byCommunity('approved_rental_properties', 'id,full_address,monthly_rent,num_rooms,area_in_sqm,floor,property_type,image_urls')
      .order('created_at', { ascending: false }).limit(20)),
    q(byCommunity('jobs', 'id,title,company_name,employment_type,created_at')
      .not('is_active', 'is', false).or(`expires_at.is.null,expires_at.gt."${nowIso}"`)
      .order('created_at', { ascending: false }).limit(6)),
    q(byCommunity('second_hand_items', 'id,name,price,is_free,created_at')
      .order('created_at', { ascending: false }).limit(6)),
    q(byCommunity('gmachim', 'id,name,categories')
      .order('view_count', { ascending: false, nullsFirst: false }).limit(6)),
    q(byCommunity('volunteering', 'id,title,organization_name,created_at')
      .not('is_active', 'is', false).or(`expires_at.is.null,expires_at.gt."${nowIso}"`)
      .order('created_at', { ascending: false }).limit(6)),
    q(byCommunity('lost_and_found', 'id,status,title,created_at')
      .order('created_at', { ascending: false }).limit(6)),
    q(byCommunity('synagogues', 'id,name')),
  ]);

  const names = Object.fromEntries(syns.map((s) => [String(s.id), s.name]));
  const prayers = (await q(db.from('prayers')
    .select('synagogue_id,type,time,set,season,selected_days')
    .in('synagogue_id', Object.keys(names))))
    .map((p) => ({ syn: names[String(p.synagogue_id)], type: p.type, time: p.time,
      set: p.set, season: p.season, days: p.selected_days }));

  return {
    community, communities, subs: subs.filter((s) => s.is_active !== false),
    businessTypes: Object.fromEntries(businessTypes.map((t) => [t.id, t.name_he])),
    profCategories: Object.fromEntries(profCategories.map((t) => [t.id, t.name_he])),
    businesses, professionals, promotions, coupons, sale, rent,
    jobs, secondHand, gmachim, volunteering, lostFound, prayers,
  };
}

/* ── מודל תצוגה ─────────────────────────────────────────────────── */

const HE_DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
const PROPERTY_TYPES = {
  apartment: 'דירה', gardenApartment: 'דירת גן', penthouse: 'פנטהאוז', duplex: 'דופלקס',
  cottage: 'קוטג׳', privateHouse: 'בית פרטי', studio: 'סטודיו', business: 'שטח מסחרי',
  unit: 'יחידת דיור', miniPenthouse: 'מיני פנטהאוז',
};
const EMPLOYMENT = { full_time: 'משרה מלאה', part_time: 'משרה חלקית', freelance: 'פרילנס', temporary: 'זמני' };

const ils = (n) => '₪' + Math.round(n).toLocaleString('en-US');
const hhmm = (m) => {
  const mm = ((Math.round(m) % 1440) + 1440) % 1440;
  return String(Math.floor(mm / 60)).padStart(2, '0') + ':' + String(mm % 60).padStart(2, '0');
};
const firstImage = (arr) => (Array.isArray(arr) ? arr.find(Boolean) : null) || null;
const ago = (iso, now) => {
  const d = Math.floor((now - new Date(iso)) / 86400000);
  if (d <= 0) return 'היום';
  if (d === 1) return 'אתמול';
  if (d < 7) return `לפני ${d} ימים`;
  if (d < 14) return 'לפני שבוע';
  if (d < 31) return `לפני ${Math.floor(d / 7)} שבועות`;
  if (d < 60) return 'לפני חודש';
  return `לפני ${Math.floor(d / 30)} חודשים`;
};
const until = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `בתוקף עד ${d.getDate()}.${d.getMonth() + 1}`;
};

/**
 * תפילות היום: מחשבים זמני היום (העמוד נבנה פעם ביום ב-01:00 UTC),
 * ממירים כל מניין לדקות-מחצות ושולחים לדפדפן. הדפדפן בוחר את הבא בתור.
 */
export function shapePrayers(rows, community, today) {
  const z = computeZmanim(community.latitude, community.longitude, today);
  const inSeason = rows.filter((p) => isPrayerInSeason(p, today));

  // 'צמוד' — אחרי המנחה האחרונה של אותו בית כנסת
  const lastMincha = {};
  for (const p of inSeason) {
    if (!p.type?.includes('מנחה')) continue;
    const k = sortKey(p, z);
    if (k < 2000 && (lastMincha[p.syn] == null || k > lastMincha[p.syn])) lastMincha[p.syn] = k;
  }

  return inSeason
    .map((p) => {
      // צמוד: אין שעה משלו. ממוין מיד אחרי המנחה, ומוצג עם שעת המנחה + "מיד אחרי מנחה"
      const glued = p.set === 'צמוד';
      const m = glued ? (lastMincha[p.syn] != null ? lastMincha[p.syn] + 1 : null) : sortKey(p, z);
      if (m == null || m >= 2000) return null;          // FALLBACK / לא ניתן לחשב
      const days = String(p.days || '').split(',').map((d) => HE_DAYS.indexOf(d.trim())).filter((i) => i >= 0);
      return {
        n: p.syn, t: p.type, m: Math.round(m), c: hhmm(glued ? m - 1 : m),
        l: glued ? 'מיד אחרי מנחה' : p.set === 'בשעה' ? '' : formatPrayerTime(p.set, p.time),
        d: days.length ? days : [0, 1, 2, 3, 4, 5, 6],
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.m - b.m);
}

export function shapeHome(raw, { now = new Date(), base = '' } = {}) {
  const { community } = raw;
  const bt = raw.businessTypes || {};
  const pc = raw.profCategories || {};

  const businesses = raw.businesses
    .filter((b) => SHOW(b) && b.image_url)
    .slice(0, 18)
    .map((b) => ({ id: b.id, name: b.name, type: bt[b.business_type] || '', img: b.image_url }));

  const professionals = raw.professionals
    .filter((p) => SHOW(p) && p.image_url)
    .slice(0, 14)
    .map((p) => ({ id: p.id, name: p.name, field: pc[p.main_category] || '', img: p.image_url, rec: p.recommend_count || 0 }));

  const promos = [
    // image_women_only מסתיר רק את התמונה — לא את המבצע עצמו
    ...raw.promotions.map((p) => ({
      id: p.id, kind: 'מבצע', title: p.title, provider: p.provider_name || '', img: SHOW(p) ? p.image_url : null, until: until(p.end_date),
    })),
    ...(raw.coupons || []).filter(AVAIL).map((c) => ({
      id: c.id, kind: 'קופון', title: c.text_content || 'קופון', provider: c.provider_name || '', img: SHOW(c) ? c.image_url : null, until: until(c.expires_at), coupon: true,
    })),
  ];

  const home = (r, kind, price) => {
    const img = firstImage(r.image_urls);
    if (!img || !price || price < 300) return null;  // בלי תמונה או מחיר לא סביר — לא בקרוסלה
    const rooms = r.num_rooms ? `${r.num_rooms} חד׳` : '';
    return {
      id: r.id, kind, img,
      price: kind === 'להשכרה' ? `${ils(price)} לחודש` : ils(price),
      title: [PROPERTY_TYPES[r.property_type] || 'נכס', rooms].filter(Boolean).join(' · '),
      meta: [r.area_in_sqm ? `${r.area_in_sqm} מ״ר` : '', r.floor != null ? (r.floor === 0 ? 'קומת קרקע' : `קומה ${r.floor}`) : '']
        .filter(Boolean).join(' · '),
      street: r.full_address || community.neighborhood,
    };
  };
  const realEstate = [
    ...raw.sale.map((r) => home(r, 'למכירה', r.asking_price)),
    ...raw.rent.map((r) => home(r, 'להשכרה', r.monthly_rent)),
  ].filter(Boolean);

  const board = [
    { key: 'jobs', label: 'דרושים', more: 'לכל המשרות', items: raw.jobs.map((j) => ({
      id: j.id, t: j.title, sub: [j.company_name, ago(j.created_at, now)].filter(Boolean).join(' · '),
      b: EMPLOYMENT[j.employment_type] || '' })) },
    { key: 'second', label: 'יד שנייה', more: 'לכל המודעות', items: raw.secondHand.map((s) => ({
      id: s.id, t: s.name, sub: ago(s.created_at, now), b: s.is_free || !s.price ? 'למסירה' : ils(s.price) })) },
    { key: 'gmach', label: 'גמ״חים', more: 'לכל הגמ״חים', items: raw.gmachim.map((g) => ({
      id: g.id, t: g.name, sub: (g.categories || []).join(' · ') || 'גמ״ח', b: '' })) },
    { key: 'vol', label: 'התנדבות', more: 'לכל ההתנדבויות', items: raw.volunteering.map((v) => ({
      id: v.id, t: v.title, sub: [v.organization_name, ago(v.created_at, now)].filter(Boolean).join(' · '), b: '' })) },
    { key: 'lost', label: 'אבידות ומציאות', more: 'לכל המודעות', items: raw.lostFound.map((l) => ({
      id: l.id, t: l.title, sub: ago(l.created_at, now), b: l.status === 'lost' ? 'אבד' : 'נמצא' })) },
  ];

  const active = new Set(raw.communities.filter((c) => c.is_active).map((c) => c.id));
  const hoods = raw.communities
    .map((c) => ({ id: c.id, name: c.neighborhood, active: active.has(c.id), current: c.id === community.id,
      also: [c.secondaryname, ...(Array.isArray(c.neighborhoods) ? c.neighborhoods : [])].filter((x) => x && typeof x === 'string').join(' ') }))
    .sort((a, b) => (b.current - a.current) || (b.active - a.active) || a.name.localeCompare(b.name, 'he'));

  return {
    base,
    name: community.neighborhood,
    alias: community.secondaryname || '',
    city: community.city || 'ירושלים',
    subs: (raw.subs || []).map((s) => s.label),
    hoods,
    promos, professionals, businesses, realEstate, board,
    prayers: shapePrayers(raw.prayers || [], community, now),
    builtAt: now.toISOString(),
  };
}

/* ── אלפון: בעלי מקצוע ועסקים ───────────────────────────────────── */


export async function fetchDirectory(db, communityId) {
  const q = (p) => p.then(({ data, error }) => { if (error) throw error; return data || []; });
  const nowIso = new Date().toISOString();
  const [businesses, professionals, businessTypes, businessCategories, profCategories, promos] = await Promise.all([
    q(db.from('businesses')
      .select('id,name,phone,address,image_url,business_type,recommend_count,latitude,longitude,image_women_only,content_audience,' +
        'weekly_schedule,kosher_info,event_services_description,appointment_system_status,user_id,created_at')
      .eq('community_id', communityId).not('is_active', 'is', false)
      .order('is_prominent', { ascending: false, nullsFirst: false })
      .order('priority', { ascending: false, nullsFirst: false })
      .order('name')),
    q(db.from('professionals')
      .select('id,name,phone,main_category,sub_categories,image_url,recommend_count,image_women_only,content_audience,' +
        'description,weekly_schedule,experience_years,price_range,provides_warranty,tags,address,latitude,longitude,appointment_system_status,user_id,created_at')
      .eq('community_id', communityId).not('is_active', 'is', false)
      .order('is_prominent', { ascending: false, nullsFirst: false })
      .order('priority', { ascending: false, nullsFirst: false })
      .order('name')),
    q(db.from('business_types').select('id,category_id,name_he')),
    q(db.from('business_categories').select('id,name_he,display_order')),
    q(db.from('professional_categories').select('id,name_he,display_order')),
    q(db.from('promotions').select('id,title,image_url,end_date,provider_id,provider_name,image_women_only,created_at')
      .eq('community_id', communityId).eq('is_active', true).lte('start_date', nowIL()).or(`end_date.is.null,end_date.gte."${nowIL()}"`)),
  ]);
  return { businesses, professionals, businessTypes, businessCategories, profCategories, promos };
}

/** טלפון ישראלי → קישורי חיוג ו-WhatsApp (WhatsApp רק לנייד). */
export function phoneLinks(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  if (d.length < 9) return null;
  const local = d.startsWith('972') ? '0' + d.slice(3) : d;
  const intl = '972' + local.replace(/^0/, '');
  return {
    display: local.length === 10 ? `${local.slice(0, 3)}-${local.slice(3)}` : `${local.slice(0, 2)}-${local.slice(2)}`,
    tel: `tel:${local}`,
    wa: /^05\d{8}$/.test(local) ? `https://wa.me/${intl}` : null,
  };
}

// קטגוריות שתמונותיהן עוברות אישור (app_config.image_moderation_rules) — לא מקודמות ב"חדש בשכונה"
const QUIET_BIZ_TYPES = new Set(['clothing', 'shoes', 'cosmetics']);
const QUIET_BIZ_CATS = new Set(['personal_care', 'sports_leisure']);
const QUIET_PRO_CATS = new Set(['beauty']);

export function shapeDirectory(raw) {
  const promosOf = (id) => (raw.promos || []).filter((p) => p.provider_id === id)
    .map((p) => ({ title: p.title, img: p.image_women_only ? null : p.image_url, until: until(p.end_date) }));
  const bt = Object.fromEntries(raw.businessTypes.map((t) => [t.id, t]));
  const bc = Object.fromEntries(raw.businessCategories.map((c) => [c.id, c]));
  const pc = Object.fromEntries(raw.profCategories.map((c) => [c.id, c]));
  const byImageThenOrder = (a, b) => (!!b.img - !!a.img) || (a.i - b.i);
  const groupsOf = (rows, order) => [...new Set(rows.map((r) => r.group).filter(Boolean))]
    .sort((a, b) => (order[a] ?? 99) - (order[b] ?? 99));

  const pros = raw.professionals
    .map((p, i) => {
      const subs = String(p.sub_categories || '').split(',').map((s) => s.trim()).filter(Boolean);
      return {
        i, id: p.id, table: 'professionals', created: p.created_at || null, quiet: QUIET_PRO_CATS.has(p.main_category), name: p.name, cat: p.main_category || 'other', group: pc[p.main_category]?.name_he || 'אחר',
        field: subs.slice(0, 3).join(' · ') || pc[p.main_category]?.name_he || '',
        // תמונה לנשים בלבד: הכרטיס מוצג, רק בלי התמונה
        img: p.image_women_only ? null : p.image_url,
        rec: p.recommend_count || 0, where: p.address || '', phone: phoneLinks(p.phone),
        waze: p.latitude && p.longitude ? `https://waze.com/ul?ll=${p.latitude},${p.longitude}&navigate=yes` : null,
        owner: p.user_id ? 'owner' : 'team',
        detail: { desc: p.description || '', schedule: p.weekly_schedule, booking: [2, 3].includes(p.appointment_system_status),
          facts: [p.experience_years ? `${p.experience_years} שנות ניסיון` : '', p.price_range || '', p.provides_warranty ? 'נותן אחריות' : '']
            .filter(Boolean), tags: [...subs.slice(3), ...(p.tags || [])], lat: p.latitude, lng: p.longitude,
          promos: promosOf(p.id) },
      };
    }).sort(byImageThenOrder);

  const biz = raw.businesses
    .map((b, i) => {
      const t = bt[b.business_type];
      return {
        i, id: b.id, table: 'businesses', created: b.created_at || null,
        quiet: QUIET_BIZ_TYPES.has(b.business_type) || QUIET_BIZ_CATS.has(t?.category_id), name: b.name, cat: t?.category_id || 'other', group: bc[t?.category_id]?.name_he || 'שונות', field: t?.name_he || '',
        img: b.image_women_only ? null : b.image_url,
        rec: b.recommend_count || 0,
        where: b.address || '', phone: phoneLinks(b.phone),
        waze: b.latitude && b.longitude ? `https://waze.com/ul?ll=${b.latitude},${b.longitude}&navigate=yes` : null,
        owner: b.user_id ? 'owner' : 'team',
        detail: { desc: b.event_services_description || '', schedule: b.weekly_schedule, booking: [2, 3].includes(b.appointment_system_status),
          facts: [b.kosher_info ? `כשרות: ${b.kosher_info}` : ''].filter(Boolean), tags: [], lat: b.latitude, lng: b.longitude,
          promos: promosOf(b.id) },
      };
    }).sort(byImageThenOrder);

  const proOrder = Object.fromEntries(raw.profCategories.map((c) => [c.name_he, c.display_order]));
  const bizOrder = Object.fromEntries(raw.businessCategories.map((c) => [c.name_he, c.display_order]));
  return {
    pros: { items: pros, groups: groupsOf(pros, proOrder) },
    biz: { items: biz, groups: groupsOf(biz, bizOrder) },
    promos: (raw.promos || []).map((p) => ({ id: p.id, title: p.title, provider: p.provider_name || '', providerId: p.provider_id,
      img: p.image_women_only ? null : p.image_url, created: p.created_at || null })),
  };
}

/* ── רשימות נוספות: מבצעים, נדל״ן, לוח השכונה ─────────────────────── */

export async function fetchListings(db, communityId) {
  const nowIso = new Date().toISOString();
  const q = (p) => p.then(({ data, error }) => { if (error) throw error; return data || []; });
  const by = (t, cols) => db.from(t).select(cols).eq('community_id', communityId);
  const [promotions, coupons, sale, rent, jobs, secondHand, gmachim, volunteering, lostFound] = await Promise.all([
    q(by('promotions', 'id,title,image_url,provider_name,end_date,image_women_only')
      .eq('is_active', true).lte('start_date', nowIL()).or(`end_date.is.null,end_date.gte."${nowIL()}"`).order('created_at', { ascending: false })),
    q(by('coupons_with_provider', COUPON_COLS)
      .eq('status', 'active').lte('start_date', nowIso).gt('expires_at', nowIso)
      .order('priority', { ascending: false, nullsFirst: false })),
    q(by('approve_property', 'id,full_address,asking_price,num_rooms,area_in_sqm,floor,property_type,image_urls,created_at')
      .order('created_at', { ascending: false })),
    q(by('approved_rental_properties', 'id,full_address,monthly_rent,num_rooms,area_in_sqm,floor,property_type,image_urls,created_at')
      .order('created_at', { ascending: false })),
    q(by('jobs', 'id,title,company_name,employment_type,created_at')
      .not('is_active', 'is', false).or(`expires_at.is.null,expires_at.gt."${nowIso}"`).order('created_at', { ascending: false })),
    q(by('second_hand_items', 'id,name,price,is_free,image_urls,created_at').order('created_at', { ascending: false })),
    q(by('gmachim', 'id,name,categories,address').order('name')),
    q(by('volunteering', 'id,title,organization_name,created_at')
      .not('is_active', 'is', false).or(`expires_at.is.null,expires_at.gt."${nowIso}"`).order('created_at', { ascending: false })),
    q(by('lost_and_found', 'id,status,title,image_url,created_at').order('created_at', { ascending: false })),
  ]);
  return { promotions, coupons, sale, rent, jobs, secondHand, gmachim, volunteering, lostFound };
}

export function shapeListings(raw, community, now = new Date()) {
  const promos = [
    ...raw.promotions.map((p) => ({ id: p.id, group: 'מבצעים', kind: 'מבצע', title: p.title, provider: p.provider_name || '',
      img: p.image_women_only ? null : p.image_url, until: until(p.end_date), cat: 'retail' })),
    ...raw.coupons.filter(AVAIL).map((c) => ({ id: c.id, group: 'קופונים', kind: 'קופון', title: c.text_content || 'קופון', provider: c.provider_name || '',
      img: c.image_women_only ? null : c.image_url, until: until(c.expires_at), coupon: true, cat: 'retail' })),
  ];

  const home = (r, kind, price) => ({
    id: r.id, group: kind, kind, img: firstImage(r.image_urls), cat: 'household',
    price: price && price >= 300 ? (kind === 'להשכרה' ? `${ils(price)} לחודש` : ils(price)) : '',
    title: [PROPERTY_TYPES[r.property_type] || 'נכס', r.num_rooms ? `${r.num_rooms} חד׳` : ''].filter(Boolean).join(' · '),
    meta: [r.area_in_sqm ? `${r.area_in_sqm} מ״ר` : '', r.floor != null ? (r.floor === 0 ? 'קומת קרקע' : `קומה ${r.floor}`) : '']
      .filter(Boolean).join(' · '),
    street: r.full_address || community.neighborhood,
  });
  const realEstate = [...raw.sale.map((r) => home(r, 'למכירה', r.asking_price)),
    ...raw.rent.map((r) => home(r, 'להשכרה', r.monthly_rent))]
    .sort((a, b) => !!b.img - !!a.img);

  const board = [
    ...raw.jobs.map((j) => ({ id: j.id, key: 'jobs', group: 'דרושים', t: j.title,
      sub: [j.company_name, ago(j.created_at, now)].filter(Boolean).join(' · '), b: EMPLOYMENT[j.employment_type] || '' })),
    ...raw.secondHand.map((s) => ({ id: s.id, key: 'second', group: 'יד שנייה', t: s.name, sub: ago(s.created_at, now), img: firstImage(s.image_urls),
      b: s.is_free || !s.price ? 'למסירה' : ils(s.price) })),
    ...raw.gmachim.map((g) => ({ id: g.id, key: 'gmach', group: 'גמ״חים', t: g.name,
      sub: [(g.categories || []).join(' · '), g.address].filter(Boolean).join(' · ') || 'גמ״ח', b: '' })),
    ...raw.volunteering.map((v) => ({ id: v.id, key: 'vol', group: 'התנדבות', t: v.title,
      sub: [v.organization_name, ago(v.created_at, now)].filter(Boolean).join(' · '), b: '' })),
    ...raw.lostFound.map((l) => ({ id: l.id, key: 'lost', group: 'אבידות ומציאות', t: l.title, sub: ago(l.created_at, now), img: l.image_url || null,
      b: l.status === 'lost' ? 'אבד' : 'נמצא' })),
  ];
  // כל סוגי הלוח מופיעים תמיד, גם בלי מודעות — כדי שאנשים יידעו מה אפשר לפרסם
  const boardGroups = [['jobs', 'דרושים'], ['second', 'יד שנייה'], ['gmach', 'גמ״חים'], ['vol', 'התנדבות'], ['lost', 'אבידות ומציאות']];

  return {
    promos: { items: promos, groups: ['מבצעים', 'קופונים'].filter((g) => promos.some((p) => p.group === g)) },
    realEstate: { items: realEstate, groups: ['למכירה', 'להשכרה'].filter((g) => realEstate.some((r) => r.group === g)) },
    board: { items: board, groups: boardGroups },
  };
}

/* ── תחומים נוספים: שיעורים, אולמות, אירוח, חינוך, פארקים, שירותים ובריאות ── */

export async function fetchMore(db, communityId) {
  const q = (p) => p.then(({ data, error }) => { if (error) throw error; return data || []; });
  const by = (t, cols) => db.from(t).select(cols).eq('community_id', communityId);
  const syns = await q(by('synagogues', 'id,name'));
  const [lessonsSyn, lessonsCom, halls, hosting, edu, parks, services, health, events] = await Promise.all([
    syns.length ? q(db.from('lessons').select('id,topic,teacher,day,start_time,type,audience,location,synagogue_id,additional_info')
      .in('synagogue_id', syns.map((s) => String(s.id)))) : Promise.resolve([]),
    q(by('lessons', 'id,topic,teacher,day,start_time,type,audience,location,synagogue_id,additional_info')),
    q(by('halls', 'id,name,address,phone,images,capacity,has_catering,has_disabled_access,latitude,longitude')
      .eq('is_active', true).order('is_prominent', { ascending: false, nullsFirst: false }).order('priority', { ascending: false, nullsFirst: false }).order('name')),
    q(by('hospitality', 'id,name,address,images,type,number_of_rooms_text,max_guests_text,latitude,longitude')
      .eq('is_active', true).order('name')),
    q(by('education_institution', 'id,name,address,phone,image_url,institution_type,category,age_groups,gender_type,latitude,longitude').order('name')),
    q(by('parks', 'id,name,location,image,park_type,facilities,latitude,longitude').order('name')),
    q(by('community_services', 'id,name,type,address,phone,image_url,lat,lng').eq('is_active', true).order('name')),
    q(by('healthcare_facility', 'id,name,facility_type,address,phone,image_url,latitude,longitude,is_24_7').not('is_active', 'is', false).order('name')),
    q(by('events', 'id,title,start_date,location_name,location_address,target_audience,organizer_name,cost_info,image_url')
      .gte('start_date', new Date().toISOString()).order('start_date')),
  ]);
  const seen = new Set();
  const lessons = [...lessonsSyn, ...lessonsCom].filter((l) => !seen.has(l.id) && seen.add(l.id));
  return { syns, lessons, halls, hosting, edu, parks, services, health, events };
}

const waze = (lat, lng) => (lat && lng ? `https://waze.com/ul?ll=${lat},${lng}&navigate=yes` : null);
const SERVICE_TYPES = { atm: 'כספומטים', mikveh: 'מקוואות', post_office: 'דואר', interior_ministry: 'משרדי ממשלה',
  community_center: 'מרכז קהילתי', defibrillator: 'דפיברילטורים' };
const HOSTING_TYPES = { complex: 'מתחם אירוח', villa: 'וילה', apartment: 'דירה', unit: 'יחידת אירוח', room: 'חדר' };
const DAY_ORDER = ['כל יום', 'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת', 'מוצאי שבת'];

export function shapeMore(raw, dir, synSlugs = {}, minyanim = '/har-homa/minyanim/') {
  const synName = Object.fromEntries(raw.syns.map((s) => [String(s.id), s.name]));
  const order = (list, key) => [...new Set(list.map((x) => x[key]).filter(Boolean))];

  const lessons = raw.lessons.map((l) => {
    const syn = synName[String(l.synagogue_id)] || l.location || '';
    return { group: (l.day || 'אחר').trim(), t: l.topic || 'שיעור',
      sub: [l.teacher, l.start_time, syn].filter(Boolean).join(' · '), b: l.audience || '',
      href: synSlugs[syn] ? `${minyanim}${encodeURIComponent(synSlugs[syn])}/` : null, time: l.start_time || '' };
  }).sort((a, b) => (DAY_ORDER.indexOf(a.group) + 1 || 99) - (DAY_ORDER.indexOf(b.group) + 1 || 99) || a.time.localeCompare(b.time));
  const lessonGroups = order(lessons, 'group');

  const halls = raw.halls.map((h) => ({ id: h.id, table: 'halls', cat: 'hall', name: h.name, group: 'אולמות',
    field: [h.capacity > 1 ? `עד ${h.capacity} איש` : '', h.has_catering ? 'קייטרינג' : '', h.has_disabled_access ? 'נגיש' : ''].filter(Boolean).join(' · '),
    where: h.address || '', img: firstImage(h.images), phone: phoneLinks(h.phone), waze: waze(h.latitude, h.longitude), rec: 0 }));

  const hosting = raw.hosting.map((h) => ({ id: h.id, cat: 'hosting', group: HOSTING_TYPES[h.type] || 'אירוח', title: h.name,
    img: firstImage(h.images), lines: [[h.number_of_rooms_text && `${h.number_of_rooms_text} חדרים`, h.max_guests_text && `עד ${h.max_guests_text} אורחים`].filter(Boolean).join(' · '), h.address || ''] }));

  const edu = raw.edu.map((e) => ({ id: e.id, table: 'education_institution', cat: 'edu', name: e.name,
    group: e.institution_type || e.category || 'אחר',
    field: [e.category && e.category !== e.institution_type ? e.category : '', e.gender_type, (e.age_groups || []).length ? `גילאי ${(e.age_groups || []).join(', ')}` : ''].filter(Boolean).join(' · '),
    where: e.address || '', img: e.image_url, phone: phoneLinks(e.phone), waze: waze(e.latitude, e.longitude), rec: 0 }));

  const parks = raw.parks.map((p) => ({ id: p.id, table: 'parks', cat: 'park', name: p.name, group: p.park_type || 'פארק',
    field: (p.facilities || []).slice(0, 4).join(' · '), where: p.location || '', img: p.image, phone: null,
    waze: waze(p.latitude, p.longitude), rec: 0 }));

  const services = [
    ...raw.services.map((s) => ({ id: s.id, table: 'community_services', cat: 'service', name: s.name,
      group: SERVICE_TYPES[s.type] || 'שירותים', field: '', where: s.address || '', img: s.image_url,
      phone: phoneLinks(s.phone), waze: waze(s.lat, s.lng), rec: 0 })),
  ];
  const health = [
    ...raw.health.map((h) => ({ id: h.id, table: 'healthcare_facility', cat: 'health', name: h.name,
      group: h.facility_type || 'בריאות', field: h.is_24_7 ? 'פתוח 24/7' : '', where: h.address || '', img: h.image_url,
      phone: phoneLinks(h.phone), waze: waze(h.latitude, h.longitude), rec: 0 })),
  ];

  // הכל לאירוע: אולמות + עסקים ובעלי מקצוע מתחום האירועים
  const ev = (list, label) => list.filter((x) => x.group === 'אירועים ושמחות').map((x) => ({ ...x, group: label }));
  const events = [...halls.map((h) => ({ ...h, group: 'אולמות' })), ...ev(dir.biz.items, 'עסקים לאירועים'), ...ev(dir.pros.items, 'בעלי מקצוע לאירועים')];

  const fmtDate = (iso) => {
    const d = new Date(iso);
    const p = new Intl.DateTimeFormat('he-IL', { timeZone: 'Asia/Jerusalem', weekday: 'long', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });
    return p.format(d);
  };
  const happenings = (raw.events || []).map((e) => ({ cat: 'events', group: 'אירועים', title: e.title, img: e.image_url,
    lines: [fmtDate(e.start_date), [e.location_name || e.location_address, e.organizer_name].filter(Boolean).join(' · ')] }));
  const imgFirst = (a) => [...a].sort((x, y) => !!y.img - !!x.img);
  return {
    lessons: { items: lessons, groups: lessonGroups },
    halls: { items: imgFirst(halls), groups: [] },
    hosting: { items: hosting, groups: order(hosting, 'group') },
    edu: { items: imgFirst(edu), groups: order(edu, 'group') },
    parks: { items: imgFirst(parks), groups: order(parks, 'group') },
    services: { items: services, groups: order(services, 'group') },
    health: { items: imgFirst(health), groups: order(health, 'group') },
    events: { items: events, groups: order(events, 'group') },
    happenings: { items: happenings, groups: [] },
  };
}
