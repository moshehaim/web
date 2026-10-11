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
 *  - content_audience שונה מ-'all' → לא מוצג.
 *  - recommend_count בלבד (entity_recommendations לא קריא ל-anon).
 */

import { computeZmanim, sortKey, formatPrayerTime } from './prayers.js';
import { isPrayerInSeason } from './season.js';

/** סוגי עסקים / קטגוריות שלא מוצגים בעמוד הבית הציבורי. */
// אין סינון לפי קטגוריה: בקטגוריות רגישות התמונה עוברת אישור לפני שהיא נכנסת ל-image_url
// (טריגרים intercept_*_image + app_config.image_moderation_rules), ו-image_women_only מסתיר אותה.

const SHOW = (r) => !r.image_women_only && (r.content_audience == null || r.content_audience === 'all');

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
    q(db.from('community').select('id,neighborhood,is_active').order('neighborhood')),
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
      .eq('is_active', true).or(`end_date.is.null,end_date.gte."${nowIso}"`)
      .order('created_at', { ascending: false }).limit(12)),
    // בלי code — הקוד לא יוצא לאתר הסטטי
    q(byCommunity('coupons', 'id,image_url,text_content,expires_at,image_women_only,content_audience')
      .eq('status', 'active').order('priority', { ascending: false, nullsFirst: false }).limit(12)),
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
    .map((b) => ({ name: b.name, type: bt[b.business_type] || '', img: b.image_url }));

  const professionals = raw.professionals
    .filter((p) => SHOW(p) && p.image_url)
    .slice(0, 14)
    .map((p) => ({ name: p.name, field: pc[p.main_category] || '', img: p.image_url, rec: p.recommend_count || 0 }));

  const promos = [
    ...raw.promotions.filter(SHOW).map((p) => ({
      kind: 'מבצע', title: p.title, provider: p.provider_name || '', img: p.image_url, until: until(p.end_date),
    })),
    ...(raw.coupons || []).filter(SHOW).map((c) => ({
      kind: 'קופון', title: c.text_content, provider: '', img: c.image_url, until: until(c.expires_at), coupon: true,
    })),
  ];

  const home = (r, kind, price) => {
    const img = firstImage(r.image_urls);
    if (!img || !price || price < 300) return null;  // בלי תמונה או מחיר לא סביר — לא בקרוסלה
    const rooms = r.num_rooms ? `${r.num_rooms} חד׳` : '';
    return {
      kind, img,
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
      t: j.title, sub: [j.company_name, ago(j.created_at, now)].filter(Boolean).join(' · '),
      b: EMPLOYMENT[j.employment_type] || '' })) },
    { key: 'second', label: 'יד שנייה', more: 'לכל המודעות', items: raw.secondHand.map((s) => ({
      t: s.name, sub: ago(s.created_at, now), b: s.is_free || !s.price ? 'למסירה' : ils(s.price) })) },
    { key: 'gmach', label: 'גמ״חים', more: 'לכל הגמ״חים', items: raw.gmachim.map((g) => ({
      t: g.name, sub: (g.categories || []).join(' · ') || 'גמ״ח', b: '' })) },
    { key: 'vol', label: 'התנדבות', more: 'לכל ההתנדבויות', items: raw.volunteering.map((v) => ({
      t: v.title, sub: [v.organization_name, ago(v.created_at, now)].filter(Boolean).join(' · '), b: '' })) },
    { key: 'lost', label: 'אבידות ומציאות', more: 'לכל המודעות', items: raw.lostFound.map((l) => ({
      t: l.title, sub: ago(l.created_at, now), b: l.status === 'lost' ? 'אבד' : 'נמצא' })) },
  ];

  const active = new Set(raw.communities.filter((c) => c.is_active).map((c) => c.id));
  const hoods = raw.communities
    .map((c) => ({ name: c.neighborhood, active: active.has(c.id), current: c.id === community.id }))
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
  const [businesses, professionals, businessTypes, businessCategories, profCategories] = await Promise.all([
    q(db.from('businesses')
      .select('id,name,phone,address,image_url,business_type,recommend_count,latitude,longitude,image_women_only,content_audience')
      .eq('community_id', communityId).not('is_active', 'is', false)
      .order('is_prominent', { ascending: false, nullsFirst: false })
      .order('priority', { ascending: false, nullsFirst: false })
      .order('name')),
    q(db.from('professionals')
      .select('id,name,phone,main_category,sub_categories,image_url,recommend_count,image_women_only,content_audience')
      .eq('community_id', communityId).not('is_active', 'is', false)
      .order('is_prominent', { ascending: false, nullsFirst: false })
      .order('priority', { ascending: false, nullsFirst: false })
      .order('name')),
    q(db.from('business_types').select('id,category_id,name_he')),
    q(db.from('business_categories').select('id,name_he,display_order')),
    q(db.from('professional_categories').select('id,name_he,display_order')),
  ]);
  return { businesses, professionals, businessTypes, businessCategories, profCategories };
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

export function shapeDirectory(raw) {
  const bt = Object.fromEntries(raw.businessTypes.map((t) => [t.id, t]));
  const bc = Object.fromEntries(raw.businessCategories.map((c) => [c.id, c]));
  const pc = Object.fromEntries(raw.profCategories.map((c) => [c.id, c]));
  const byImageThenOrder = (a, b) => (!!b.img - !!a.img) || (a.i - b.i);
  const groupsOf = (rows, order) => [...new Set(rows.map((r) => r.group).filter(Boolean))]
    .sort((a, b) => (order[a] ?? 99) - (order[b] ?? 99));

  const pros = raw.professionals
    .filter((p) => p.content_audience == null || p.content_audience === 'all')
    .map((p, i) => {
      const subs = String(p.sub_categories || '').split(',').map((s) => s.trim()).filter(Boolean);
      return {
        i, name: p.name, group: pc[p.main_category]?.name_he || 'אחר',
        field: subs.slice(0, 3).join(' · ') || pc[p.main_category]?.name_he || '',
        // תמונה לנשים בלבד: הכרטיס מוצג, רק בלי התמונה
        img: p.image_women_only ? null : p.image_url,
        rec: p.recommend_count || 0, where: '', phone: phoneLinks(p.phone), waze: null,
      };
    }).sort(byImageThenOrder);

  const biz = raw.businesses
    .filter((b) => b.content_audience == null || b.content_audience === 'all')
    .map((b, i) => {
      const t = bt[b.business_type];
      return {
        i, name: b.name, group: bc[t?.category_id]?.name_he || 'שונות', field: t?.name_he || '',
        img: b.image_women_only ? null : b.image_url,
        rec: b.recommend_count || 0,
        where: b.address || '', phone: phoneLinks(b.phone),
        waze: b.latitude && b.longitude ? `https://waze.com/ul?ll=${b.latitude},${b.longitude}&navigate=yes` : null,
      };
    }).sort(byImageThenOrder);

  const proOrder = Object.fromEntries(raw.profCategories.map((c) => [c.name_he, c.display_order]));
  const bizOrder = Object.fromEntries(raw.businessCategories.map((c) => [c.name_he, c.display_order]));
  return {
    pros: { items: pros, groups: groupsOf(pros, proOrder) },
    biz: { items: biz, groups: groupsOf(biz, bizOrder) },
  };
}
