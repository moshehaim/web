/**
 * עמודים מלאים לכל רכיב באתר: אולמות, אירוח, חינוך, גנים, שירותים, בריאות,
 * נדל״ן, מבצעים, ולוח (דרושים, יד שנייה, גמ״חים, התנדבות, אבידות).
 *
 * כל ישות הופכת לאובייקט "detail" אחיד שנכנס לתבנית detailPage.
 * בלי פרטי קשר של אנשים פרטיים (מוכרים, מפרסמי מודעות, מנהלי גמ״ח) —
 * יצירת קשר עם אנשים פרטיים עוברת באפליקציה.
 */

import { Location, Zmanim } from '@hebcal/core';
import { phoneLinks } from './home-data.js';

const q = (p) => p.then(({ data, error }) => { if (error) throw error; return data || []; });
const ils = (n) => '₪' + Math.round(n).toLocaleString('en-US');
const first = (a) => (Array.isArray(a) ? a.filter(Boolean) : []);
const waze = (lat, lng) => (lat && lng ? `https://waze.com/ul?ll=${lat},${lng}&navigate=yes` : null);
const yes = (cond, label) => (cond ? label : '');
const dateHe = (iso) => (iso ? new Date(iso).toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem', day: 'numeric', month: 'numeric', year: 'numeric' }) : '');

export async function fetchDetails(db, communityId) {
  const by = (t, cols) => db.from(t).select(cols).eq('community_id', communityId);
  const nowIso = new Date().toISOString();
  const [halls, hosting, edu, parks, services, health, sale, rent, promos, jobs, second, gmachim, vol, lost] = await Promise.all([
    q(by('halls', 'id,name,address,phone,images,capacity,description,price,has_catering,allow_external_catering,has_kitchenette,has_water_heater,has_fridge,can_reheat_food,has_projector,parking_spaces,has_disabled_access,kosher_certificate,latitude,longitude,user_id').eq('is_active', true)),
    q(by('hospitality', 'id,name,address,images,description,type,number_of_rooms_text,max_guests_text,number_of_beds,has_kitchen,has_air_conditioning,has_wifi,has_parking,has_washer,has_dryer,available_for_events,has_disabled_access,has_elevator,floor_number,house_rules,price_per_shabbat,latitude,longitude,user_id').eq('is_active', true)),
    q(by('education_institution', 'id,name,address,phone,image_url,description,institution_type,category,subcategory,affiliation,network,ownership_type,age_groups,gender_type,latitude,longitude,user_id')),
    q(by('parks', 'id,name,description,location,image,park_type,facilities,has_restrooms,has_picnic_area,has_parking,is_accessible,latitude,longitude,user_id')),
    q(by('community_services', 'id,name,type,address,phone,notes,image_url,image_gallery,lat,lng,user_id').eq('is_active', true)),
    q(by('healthcare_facility', 'id,name,facility_type,address,phone,image_url,services,is_24_7,has_parking,has_accessibility,has_emergency,network,weekly_schedule,latitude,longitude,user_id').not('is_active', 'is', false)),
    q(by('approve_property', 'id,full_address,asking_price,area_in_sqm,num_rooms,floor,total_floors,description,property_type,property_condition,available_date,has_elevator,has_parking,parking_spots,has_storage,has_balcony,balcony_area_in_sqm,has_sukkah_balcony,has_safe_room,has_rental_units,image_urls,latitude,longitude,is_broker')),
    q(by('approved_rental_properties', 'id,full_address,monthly_rent,area_in_sqm,num_rooms,floor,total_floors,description,property_type,property_condition,available_date,has_elevator,has_parking,has_storage,has_balcony,has_sukkah_balcony,has_safe_room,includes_furniture,municipal_tax,maintenance_fees,image_urls,latitude,longitude,is_broker')),
    q(by('promotions', 'id,title,description,content,image_url,end_date,terms_and_conditions,provider_id,provider_name,image_women_only')
      .eq('is_active', true).or(`end_date.is.null,end_date.gte."${nowIso}"`)),
    q(by('jobs', 'id,title,description,job_type,category,employment_type,salary_info,requirements,experience_required,education_required,location_name,location_address,remote_option,company_name,company_description,created_at')
      .not('is_active', 'is', false).or(`expires_at.is.null,expires_at.gt."${nowIso}"`)),
    q(by('second_hand_items', 'id,name,description,price,is_free,category,condition,address,image_urls,created_at')),
    q(by('gmachim', 'id,name,address,description,categories,weekly_schedule,latitude,longitude')),
    q(by('volunteering', 'id,title,description,organization_name,organization_description,volunteer_hours,frequency,location_name,location_address,created_at')
      .not('is_active', 'is', false).or(`expires_at.is.null,expires_at.gt."${nowIso}"`)),
    q(by('lost_and_found', 'id,status,title,description,image_url,created_at')),
  ]);
  return { halls, hosting, edu, parks, services, health, sale, rent, promos, jobs, second, gmachim, vol, lost };
}

/** זמני כניסת ויציאת השבת הקרובה — להצגת "שעה לפני כניסת שבת ≈ 17:05" */
export function shabbatTimes(lat, lng, now = new Date()) {
  const loc = new Location(lat, lng, true, 'Asia/Jerusalem', 'Jerusalem', 'IL');
  const fri = new Date(now); fri.setDate(now.getDate() + ((5 - now.getDay() + 7) % 7));
  const sat = new Date(fri); sat.setDate(fri.getDate() + 1);
  const hm = (d) => d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit' });
  const candle = new Date(new Zmanim(loc, fri, false).sunset().getTime() - 40 * 60000);
  const havdalah = new Zmanim(loc, sat, false).tzeit(8.5);
  return { candle, havdalah, fmt: hm };
}

const PROPERTY = { apartment: 'דירה', gardenApartment: 'דירת גן', penthouse: 'פנטהאוז', duplex: 'דופלקס', cottage: 'קוטג׳',
  privateHouse: 'בית פרטי', studio: 'סטודיו', business: 'שטח מסחרי', unit: 'יחידת דיור', miniPenthouse: 'מיני פנטהאוז' };
const CONDITION = { new: 'חדש', renovated: 'משופץ', good: 'במצב טוב', needsRenovation: 'דורש שיפוץ', original: 'שמור' };
const SH_CONDITION = { 1: 'כמו חדש', 2: 'במצב טוב', 3: 'משומש', 4: 'דורש תיקון' };
const SERVICE_TYPES = { atm: 'כספומט', mikveh: 'מקווה', post_office: 'דואר', interior_ministry: 'משרד ממשלתי', community_center: 'מרכז קהילתי', defibrillator: 'דפיברילטור' };
const HOSTING = { complex: 'מתחם אירוח', villa: 'וילה', apartment: 'דירה', unit: 'יחידת אירוח', room: 'חדר' };
const EMPLOYMENT = { full_time: 'משרה מלאה', part_time: 'משרה חלקית', freelance: 'פרילנס', temporary: 'זמני' };
const ago = (iso) => {
  const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
  return d <= 0 ? 'היום' : d === 1 ? 'אתמול' : d < 7 ? `לפני ${d} ימים` : d < 31 ? `לפני ${Math.max(1, Math.floor(d / 7))} שבועות` : `לפני ${Math.floor(d / 30) || 1} חודשים`;
};

/**
 * ממיר את כל השורות לאובייקטי detail. seg = תיקיית העמוד מתחת לשכונה.
 * owner: 'owner' (בעל העסק עדכן), 'team' (צוות שכונה), 'user' (מודעה של תושב).
 */
export function shapeDetails(raw, community) {
  const out = [];
  const add = (x) => out.push({ gallery: [], facts: [], sections: [], phone: null, ...x });

  for (const h of raw.halls) add({ seg: 'halls', list: 'אולמות', ld: 'EventVenue', id: h.id, table: 'halls', cat: 'hall',
    name: h.name, kicker: 'אולם', img: first(h.images)[0], gallery: first(h.images).slice(1), desc: h.description,
    facts: [h.capacity > 1 ? `עד ${h.capacity} איש` : '', h.price > 0 ? `מ-${ils(h.price)}` : '', h.parking_spaces ? `${h.parking_spaces} מקומות חניה` : '', h.kosher_certificate ? `כשרות: ${h.kosher_certificate}` : ''].filter(Boolean),
    sections: [{ title: 'מה יש באולם', chips: [yes(h.has_catering, 'קייטרינג'), yes(h.allow_external_catering, 'אפשר קייטרינג חיצוני'), yes(h.has_kitchenette, 'מטבחון'), yes(h.has_water_heater, 'מיחם'), yes(h.has_fridge, 'מקרר'), yes(h.can_reheat_food, 'חימום אוכל'), yes(h.has_projector, 'מקרן'), yes(h.has_disabled_access, 'נגיש')].filter(Boolean) }],
    where: h.address, lat: h.latitude, lng: h.longitude, phone: phoneLinks(h.phone), owner: h.user_id ? 'owner' : 'team' });

  for (const h of raw.hosting) add({ seg: 'hosting', list: 'אירוח', ld: 'LodgingBusiness', id: h.id, table: 'hospitality', cat: 'hosting',
    name: h.name, kicker: HOSTING[h.type] || 'אירוח', img: first(h.images)[0], gallery: first(h.images).slice(1), desc: h.description,
    facts: [h.number_of_rooms_text && `${h.number_of_rooms_text} חדרים`, h.max_guests_text && `עד ${h.max_guests_text} אורחים`, h.number_of_beds && `${h.number_of_beds} מיטות`, h.price_per_shabbat > 0 && `${ils(h.price_per_shabbat)} לשבת`, h.floor_number != null && `קומה ${h.floor_number}`].filter(Boolean),
    sections: [{ title: 'מה יש במקום', chips: [yes(h.has_kitchen, 'מטבח'), yes(h.has_air_conditioning, 'מיזוג'), yes(h.has_wifi, 'WiFi'), yes(h.has_parking, 'חניה'), yes(h.has_washer, 'מכונת כביסה'), yes(h.has_dryer, 'מייבש'), yes(h.has_elevator, 'מעלית'), yes(h.has_disabled_access, 'נגיש'), yes(h.available_for_events, 'מתאים לאירועים')].filter(Boolean) },
      ...(h.house_rules ? [{ title: 'כללי הבית', text: h.house_rules }] : [])],
    where: h.address, lat: h.latitude, lng: h.longitude, owner: h.user_id ? 'owner' : 'team', appOnly: true });

  for (const e of raw.edu) add({ seg: 'education', list: 'מוסדות חינוך', ld: 'School', id: e.id, table: 'education_institution', cat: 'edu',
    name: e.name, kicker: e.institution_type || e.category || 'מוסד חינוך', img: e.image_url, desc: e.description,
    facts: [e.gender_type, first(e.age_groups).length ? `גילאי ${first(e.age_groups).join(', ')}` : '', e.category && e.category !== e.institution_type ? e.category : '', e.subcategory, e.network && `רשת: ${e.network}`, e.affiliation, e.ownership_type].filter(Boolean),
    where: e.address, lat: e.latitude, lng: e.longitude, phone: phoneLinks(e.phone), owner: e.user_id ? 'owner' : 'team' });

  for (const p of raw.parks) add({ seg: 'parks', list: 'גנים ופארקים', ld: 'Park', id: p.id, table: 'parks', cat: 'park',
    name: p.name, kicker: p.park_type || 'פארק', img: p.image, desc: p.description,
    sections: [{ title: 'מה יש בגן', chips: [...first(p.facilities), yes(p.has_restrooms, 'שירותים'), yes(p.has_picnic_area, 'פינת פיקניק'), yes(p.has_parking, 'חניה'), yes(p.is_accessible, 'נגיש')].filter(Boolean) }],
    where: p.location, lat: p.latitude, lng: p.longitude, owner: 'team' });

  for (const s of raw.services) add({ seg: 'services', list: 'שירותים ובריאות', ld: 'GovernmentOffice', id: s.id, table: 'community_services', cat: 'service',
    name: s.name, kicker: SERVICE_TYPES[s.type] || 'שירות', img: s.image_url, gallery: first(s.image_gallery), desc: s.notes,
    where: s.address, lat: s.lat, lng: s.lng, phone: phoneLinks(s.phone), owner: 'team' });

  for (const h of raw.health) {
    const svc = Array.isArray(h.services) ? h.services.map((x) => (typeof x === 'string' ? x : x?.name)).filter(Boolean) : [];
    add({ seg: 'services', list: 'שירותים ובריאות', ld: 'MedicalClinic', id: h.id, table: 'healthcare_facility', cat: 'health',
      name: h.name, kicker: h.facility_type || 'בריאות', img: h.image_url,
      facts: [yes(h.is_24_7, 'פתוח 24/7'), yes(h.has_emergency, 'מוקד חירום'), yes(h.has_accessibility, 'נגיש'), yes(h.has_parking, 'חניה'), h.network].filter(Boolean),
      sections: svc.length ? [{ title: 'שירותים', chips: svc }] : [], schedule: h.weekly_schedule,
      where: h.address, lat: h.latitude, lng: h.longitude, phone: phoneLinks(h.phone), owner: h.user_id ? 'owner' : 'team' });
  }

  const home = (r, kind, price) => {
    const imgs = first(r.image_urls);
    const t = [PROPERTY[r.property_type] || 'נכס', r.num_rooms ? `${r.num_rooms} חדרים` : ''].filter(Boolean).join(' ');
    add({ seg: 'realestate', list: 'נדל״ן', ld: 'Residence', id: r.id, table: kind === 'להשכרה' ? 'approved_rental_properties' : 'approve_property', cat: 'household',
      name: `${t}${r.full_address ? ` ב${r.full_address}` : ''}`, kicker: kind, img: imgs[0], gallery: imgs.slice(1), desc: r.description,
      price: price && price >= 300 ? (kind === 'להשכרה' ? `${ils(price)} לחודש` : ils(price)) : '',
      facts: [r.area_in_sqm && `${r.area_in_sqm} מ״ר`, r.floor != null && (r.floor === 0 ? 'קומת קרקע' : `קומה ${r.floor}${r.total_floors ? ` מתוך ${r.total_floors}` : ''}`),
        CONDITION[r.property_condition], r.available_date && `כניסה: ${dateHe(r.available_date)}`, r.is_broker ? 'באמצעות תיווך' : '',
        r.municipal_tax > 0 && `ארנונה ${ils(r.municipal_tax)}`, r.maintenance_fees > 0 && `ועד ${ils(r.maintenance_fees)}`].filter(Boolean),
      sections: [{ title: 'מה יש בנכס', chips: [yes(r.has_elevator, 'מעלית'), yes(r.has_parking, r.parking_spots > 1 ? `${r.parking_spots} חניות` : 'חניה'), yes(r.has_storage, 'מחסן'), yes(r.has_balcony, r.balcony_area_in_sqm ? `מרפסת ${r.balcony_area_in_sqm} מ״ר` : 'מרפסת'), yes(r.has_sukkah_balcony, 'מרפסת סוכה'), yes(r.has_safe_room, 'ממ״ד'), yes(r.has_rental_units, 'יחידת דיור'), yes(r.includes_furniture, 'מרוהטת')].filter(Boolean) }],
      where: r.full_address || community.neighborhood, lat: r.latitude, lng: r.longitude, owner: 'user', appOnly: true });
  };
  raw.sale.forEach((r) => home(r, 'למכירה', r.asking_price));
  raw.rent.forEach((r) => home(r, 'להשכרה', r.monthly_rent));

  for (const p of raw.promos) add({ seg: 'promos', list: 'מבצעים וקופונים', ld: 'Offer', id: p.id, table: null, cat: 'retail',
    name: p.title, kicker: 'מבצע', img: p.image_women_only ? null : p.image_url, desc: [p.description, p.content].filter(Boolean).join('\n\n'),
    facts: [p.provider_name, p.end_date && `בתוקף עד ${dateHe(p.end_date)}`].filter(Boolean),
    sections: p.terms_and_conditions ? [{ title: 'תנאים', text: p.terms_and_conditions }] : [], providerId: p.provider_id, owner: 'owner', appOnly: true });

  for (const j of raw.jobs) add({ seg: 'board', list: 'לוח השכונה', ld: 'JobPosting', id: j.id, table: 'jobs', cat: 'other', boardKey: 'jobs',
    name: j.title, kicker: 'דרושים', desc: j.description,
    facts: [j.company_name, EMPLOYMENT[j.employment_type], j.salary_info, j.remote_option ? 'אפשר מהבית' : '', j.location_name, ago(j.created_at)].filter(Boolean),
    sections: [...(j.requirements ? [{ title: 'דרישות', text: j.requirements }] : []),
      ...(j.experience_required || j.education_required ? [{ title: 'ניסיון והשכלה', chips: [j.experience_required, j.education_required].filter(Boolean) }] : []),
      ...(j.company_description ? [{ title: 'על החברה', text: j.company_description }] : [])],
    where: j.location_address, owner: 'user', appOnly: true });

  for (const s of raw.second) { const imgs = first(s.image_urls); add({ seg: 'board', list: 'לוח השכונה', ld: 'Product', id: s.id, table: 'second_hand_items', cat: 'retail', boardKey: 'second',
    name: s.name, kicker: 'יד שנייה', img: imgs[0], gallery: imgs.slice(1), desc: s.description,
    price: s.is_free || !s.price ? 'למסירה' : ils(s.price), facts: [s.category, SH_CONDITION[s.condition], ago(s.created_at)].filter(Boolean),
    owner: 'user', appOnly: true }); }

  for (const g of raw.gmachim) add({ seg: 'board', list: 'לוח השכונה', ld: 'NGO', id: g.id, table: 'gmachim', cat: 'health_parenting', boardKey: 'gmach',
    name: g.name, kicker: 'גמ״ח', desc: g.description, sections: first(g.categories).length ? [{ title: 'מה יש בגמ״ח', chips: first(g.categories) }] : [],
    schedule: g.weekly_schedule, where: g.address, lat: g.latitude, lng: g.longitude, owner: 'team', appOnly: true });

  for (const v of raw.vol) add({ seg: 'board', list: 'לוח השכונה', ld: 'VolunteerAction', id: v.id, table: 'volunteering', cat: 'counseling', boardKey: 'vol',
    name: v.title, kicker: 'התנדבות', desc: v.description, facts: [v.organization_name, v.frequency, v.volunteer_hours, v.location_name, ago(v.created_at)].filter(Boolean),
    sections: v.organization_description ? [{ title: 'על הארגון', text: v.organization_description }] : [], where: v.location_address, owner: 'user', appOnly: true });

  for (const l of raw.lost) add({ seg: 'board', list: 'לוח השכונה', ld: 'Thing', id: l.id, table: null, cat: 'other', boardKey: 'lost',
    name: l.title, kicker: l.status === 'lost' ? 'אבידה' : 'מציאה', img: l.image_url, desc: l.description, facts: [ago(l.created_at)],
    owner: 'user', appOnly: true });

  for (const d of out) d.waze = waze(d.lat, d.lng);
  return out;
}
