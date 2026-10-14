/* שכונה — ניהול העסק באתר (/my-business/). שלב 1: פרטים, תמונה, שעות, בקשת המלצות, מצב השירותים.
 * שומר בדיוק כמו האפליקציה (BusinessManagementScreen / BusinessAddScreen), אבל רק את השדות שנערכו (update חלקי):
 *  - שעות: weekly_schedule = { sunday..saturday: null (סגור) | [{start:"HH:MM", end:"HH:MM"}] }
 *  - תמונה: bucket images, businesses/profiles/{id}.jpg (JPEG), URL עם ?v=, ואז image_url. מודרציה — טריגר בשרת.
 *  - שירותי אירועים: event_services_description — רק לסוגי העסק שבאפליקציה (_isEligibleForEventServices)
 *  - בעל מקצוע (ProfessionalFormScreen): description, experience_years, price_range, provides_warranty; תמונה ב-professionals/profiles
 * רענון באפליקציה: trg_businesses_modified / trg_professionals_modified מעדכן את table_last_modified.
 * "העסקים שלי" = כמו getBusinessesByOwner: user_id שלי + is_locked (בעלות מאומתת) + is_active. מי שרק הוסיף עסק — לא בעלים.
 */
(function () {
  'use strict';
  var A, sb, user, list = [], biz = null, ctx = {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var HOME_COMMUNITY = '5e36552b-9fb2-45aa-90aa-03301111b2dd';
  var COLS = 'id,name,address,phone,image_url,weekly_schedule,business_category,business_type,view_count,recommend_count,event_services_description,community_id,appointment_system_status,is_active,created_at';
  var DAYS = [['sunday', 'ראשון'], ['monday', 'שני'], ['tuesday', 'שלישי'], ['wednesday', 'רביעי'], ['thursday', 'חמישי'], ['friday', 'שישי'], ['saturday', 'מוצ״ש']];
  // BusinessAddScreen._isEligibleForEventServices
  var EVENT_TYPES = ['catering', 'pastry', 'bakery', 'restaurant', 'candy_shop', 'flowers', 'jewelry', 'gifts', 'beauty_salon', 'hair_salon', 'bridal_salon', 'nails', 'photo_lab', 'printing'];
  // AppointmentEligibleBusinessCategories
  var APPT_CATS = ['personal_care'], APPT_TYPES = ['hair_salon', 'barber', 'beauty_salon', 'laser', 'nails', 'bridal_salon'];
  var PRO_COLS = 'id,name,address,phone,image_url,weekly_schedule,main_category,sub_categories,view_count,recommend_count,description,experience_years,price_range,provides_warranty,community_id,appointment_system_status,is_active,created_at';
  // סוג ישות: טבלה, עמודות, נתיב תמונה (SupabaseStorageService.EntityType), תיקייה באתר, נתיב באפליקציה
  var ENT = {
    business: { table: 'businesses', cols: COLS, label: 'עסק', img: 'businesses/profiles', seg: 'biz', app: 'business', hours: 'שעות פתיחה', details: 'פרטי העסק' },
    professional: { table: 'professionals', cols: PRO_COLS, label: 'בעל מקצוע', img: 'professionals/profiles', seg: 'pros', app: 'professional', hours: 'שעות פעילות', details: 'פרטי הכרטיס' }
  };
  // AppointmentEligibleProfessionalCategories
  var PRO_APPT = ['beauty', 'counseling', 'education'];
  function E() { return ENT[biz._k]; }
  var C = { navy: '#244782', hours: '#10B981', rec: '#E91E63', promo: '#7C3AED', coupons: '#F59E0B', appt: '#3B82F6', prom: '#EC4899', site: '#2A6FB8' };

  function svg(d, color) { return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>'; }
  var IC = {
    store: 'M3 9l1.5-5h15L21 9M4 9h16v11H4zM9 20v-6h6v6',
    clock: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18a9 9 0 0 0 0 18z',
    heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
    tag: 'M3 12V4h8l10 10-8 8zM7.5 7.5h.01',
    ticket: 'M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4zM12 7v10',
    cal: 'M5 5h14v15H5zM5 10h14M9 3v4M15 3v4',
    star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
    eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6a3 3 0 0 0 0 6z',
    link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'
  };

  /* ── מצבים ── */
  function state(html) { var s = $('#mb-state'); s.innerHTML = html; s.hidden = false; $('#mb-app').hidden = true; }
  function showLogin() {
    state('<h1>ניהול העסק</h1><p>לבעלי עסקים ובעלי מקצוע: התחברו עם החשבון שאיתו נרשמתם באפליקציה. אותו חשבון, אותם נתונים.</p>' +
      '<button class="mb-btn" type="button" id="mb-login">התחברות</button>');
    $('#mb-login').addEventListener('click', function () { A.login('כניסה לניהול העסק — אותו חשבון כמו באפליקציה.'); });
  }
  function showNone() {
    state('<h1>לא מצאנו עסק או כרטיס בעל מקצוע בבעלותכם</h1><p>כאן מנהלים עסק שאישרתם שהוא שלכם, או כרטיס בעל מקצוע שלכם. אם נרשמתם עם חשבון אחר — התנתקו והתחברו איתו. רישום חדש או אישור בעלות — כרגע באפליקציה.</p>' +
      '<a class="mb-btn" href="/app/">לאפליקציה</a>');
  }
  function showError() {
    state('<h1>משהו השתבש</h1><p>לא הצלחנו לטעון את הפרטים.</p><button class="mb-btn" type="button" id="mb-retry">נסו שוב</button>');
    $('#mb-retry').addEventListener('click', start);
  }

  /* ── טעינה ── */
  function start() {
    state('<p>טוען…</p>');
    A.getUser().then(function (x) {
      sb = x.sb; user = x.user;
      if (!user) return showLogin();
      return Promise.all([
        // getBusinessesByOwner: בעלות מאומתת בלבד
        sb.from('businesses').select(COLS).eq('user_id', user.id).eq('is_locked', true).eq('is_active', true).order('created_at', { ascending: true }),
        // ProfessionalService.getByUserId: בעל מקצוע תמיד רושם את עצמו
        sb.from('professionals').select(PRO_COLS).eq('user_id', user.id).eq('is_active', true).order('created_at', { ascending: true })
      ]).then(function (rs) {
        if (rs[0].error) throw rs[0].error;
        if (rs[1].error) throw rs[1].error;
        var tag = function (k) { return function (r) { r._k = k; return r; }; };
        list = (rs[0].data || []).map(tag('business')).concat((rs[1].data || []).map(tag('professional')));
        if (!list.length) return showNone();
        var want = new URLSearchParams(location.search).get('id'), last = null;
        try { last = localStorage.getItem('shchuna.mb'); } catch (e) {}
        biz = list.filter(function (b) { return b.id === want; })[0] || list.filter(function (b) { return b.id === last; })[0] || list[0];
        return loadBiz();
      });
    }).catch(function () { showError(); });
  }

  function loadBiz() {
    try { localStorage.setItem('shchuna.mb', biz.id); } catch (e) {}
    var today = new Date().toISOString().slice(0, 10), now = new Date().toISOString();
    var subQ = function (t) {
      return sb.from('subscriptions').select('id,status,next_charge_date').eq('entity_id', biz.id).eq('entity_type', biz._k)
        .eq('payment_type', t).or('status.eq.active,status.eq.trial,status.eq.cancelled').gte('next_charge_date', today).maybeSingle();
    };
    var slugP = biz.community_id === HOME_COMMUNITY
      ? fetch('/har-homa/' + E().seg + '/slugs.json').then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
      : Promise.resolve({});
    return Promise.all([
      sb.from('app_config').select('key,value').in('key', ['features_monetization', 'monetization_excluded_business_types']),
      biz._k === 'business' && biz.business_type ? sb.from('business_types').select('name_he').eq('id', biz.business_type).maybeSingle() : Promise.resolve({ data: null }),
      sb.from('pending_entity_images').select('status,image_url').eq('entity_type', biz._k).eq('entity_id', biz.id).maybeSingle(),
      sb.from('promotions').select('id,title,image_url,start_date,end_date').eq('provider_id', biz.id).eq('is_active', true).gte('end_date', now).order('start_date', { ascending: true }),
      subQ('promotions_subscription'),
      sb.from('promotion_packages').select('total_promotions_bought,total_promotions_used,expires_at').eq('provider_id', biz.id),
      sb.from('coupons').select('id,status,quantity,start_date,expires_at').eq('provider_id', biz.id).neq('status', 'cancelled'),
      subQ('prominence'),
      slugP
    ]).then(function (r) {
      var cfg = {}; (r[0].data || []).forEach(function (row) { var v = row.value; try { if (typeof v === 'string') v = JSON.parse(v); } catch (e) {} cfg[row.key] = v; });
      var nowD = new Date();
      var promos = r[3].data || [];
      ctx = {
        features: cfg.features_monetization || {},
        excluded: biz._k === 'business' && (cfg.monetization_excluded_business_types || []).indexOf(biz.business_type) >= 0,
        // בעל מקצוע: sub_categories שומר את השם העברי (כלל הטקסונומיה)
        typeName: biz._k === 'business' ? (r[1].data && r[1].data.name_he) : (biz.sub_categories || biz.main_category),
        pending: r[2].data,
        promo: promos.filter(function (p) { return !p.start_date || new Date(p.start_date) <= nowD; })[0] || null,
        promoSub: r[4].data,
        pkg: (r[5].data || []).filter(function (p) { return (p.total_promotions_bought || 0) - (p.total_promotions_used || 0) > 0 && (!p.expires_at || new Date(p.expires_at) > nowD); })[0] || null,
        coupons: (r[6].data || []).filter(function (c) { return ['expired', 'completed'].indexOf(c.status) < 0 && (!c.expires_at || new Date(c.expires_at) > nowD); }),
        promSub: r[7].data,
        slug: (r[8] || {})[biz.id] || null
      };
      render();
    }).catch(function () { showError(); });
  }

  /* ── תצוגה ── */
  function fmtDate(d) { if (!d) return ''; var x = new Date(d); return x.getDate() + '.' + (x.getMonth() + 1) + '.' + String(x.getFullYear()).slice(2); }
  function subInfo(sub) {
    if (!sub) return null;
    var d = fmtDate(sub.next_charge_date);
    if (sub.status === 'trial') return { s: 'פעיל עד ' + d, b: 'מתנת הצטרפות' };
    if (sub.status === 'cancelled') return { s: 'מנוי בוטל - פעיל עד ' + d, b: 'מנוי בוטל' };
    return { s: 'מנוי פעיל - מתחדש ' + d, b: 'מנוי פעיל' };
  }
  function item(o) {
    return '<button class="mb-item" type="button" data-act="' + o.act + '"' + (o.href ? '' : '') + '>' +
      '<i style="background:' + o.color + '1A">' + svg(o.icon, o.color) + '</i>' +
      '<span class="tx"><b>' + esc(o.title) + '</b><span class="s">' + esc(o.sub) + '</span></span>' +
      (o.badge ? '<em style="background:' + (o.badgeColor || o.color) + '1A;color:' + (o.badgeColor || o.color) + '">' + esc(o.badge) + '</em>' : '') + '</button>';
  }
  function bizUrl() { return ctx.slug ? '/har-homa/' + E().seg + '/' + encodeURIComponent(ctx.slug) + '/' : null; }

  function render() {
    var hasSchedule = biz.weekly_schedule && DAYS.some(function (d) { return (biz.weekly_schedule[d[0]] || []).length; });
    var pend = ctx.pending && ctx.pending.image_url ? ctx.pending : null;
    var img = pend ? pend.image_url : biz.image_url;
    var started = ctx.coupons.filter(function (c) { return c.status === 'active' && (!c.start_date || new Date(c.start_date) <= new Date()); });
    var apptOk = biz._k === 'business'
      ? (APPT_CATS.indexOf(biz.business_category) >= 0 || APPT_TYPES.indexOf(biz.business_type) >= 0)
      : PRO_APPT.indexOf(biz.main_category) >= 0;

    var chips = '<span class="mb-chip">' + svg(IC.eye, '#fff').replace(/24/g, '16') + (biz.view_count || 0) + ' צפיות</span>' +
      (ctx.promo ? '<span class="mb-chip">' + svg(IC.tag, '#fff').replace(/24/g, '16') + 'מבצע פעיל</span>' : '') +
      (ctx.coupons.length ? '<span class="mb-chip">' + svg(IC.ticket, '#fff').replace(/24/g, '16') + ctx.coupons.length + ' חבילות קופונים</span>' : '') +
      (apptOk && biz.appointment_system_status === 2 ? '<span class="mb-chip">' + svg(IC.cal, '#fff').replace(/24/g, '16') + 'תורים פעיל</span>' : '');

    var mixed = list.some(function (b) { return b._k !== list[0]._k; });
    var pick = list.length > 1 ? '<select class="mb-pick" id="mb-pick" aria-label="בחירת עסק">' + list.map(function (b) {
      return '<option value="' + esc(b.id) + '"' + (b.id === biz.id ? ' selected' : '') + '>' + esc(b.name) + (mixed ? ' · ' + ENT[b._k].label : '') + '</option>'; }).join('') + '</select>' : '';

    var left = [
      item({ act: 'details', icon: IC.store, color: C.navy, title: E().details, sub: biz.address || 'צפייה ועריכה' }),
      item({ act: 'hours', icon: IC.clock, color: C.hours, title: E().hours, sub: hasSchedule ? 'הוגדרו ' + E().hours : 'עוד לא הוגדרו — להגדרה', badge: hasSchedule ? null : 'חסר', badgeColor: '#F59E0B' }),
      item({ act: 'rec', icon: IC.heart, color: C.rec, title: 'בקש המלצות מלקוחות', sub: biz.recommend_count > 0 ? '❤ ' + biz.recommend_count + ' ממליצים' : 'עוד אין המלצות' }),
      bizUrl() ? item({ act: 'page', icon: IC.link, color: C.site, title: 'העמוד שלכם באתר', sub: biz._k === 'business' ? 'כך השכנים רואים את העסק' : 'כך השכנים רואים את הכרטיס' }) : ''
    ].join('');

    // שירותים — כמו EntityServicesSection: מוחרג ממונטיזציה (מספרות) רואה רק תורים
    var f = ctx.features, svc = [];
    var on = function (k, active) { return active || f[k] !== false; };
    if (!ctx.excluded && on('promotions', !!(ctx.promoSub || ctx.pkg || ctx.promo))) {
      var si = subInfo(ctx.promoSub), pk = ctx.pkg;
      svc.push(item({ act: 'svc:promotions', icon: IC.tag, color: C.promo, title: 'מבצעים',
        sub: si ? si.s : pk ? 'נותרו ' + ((pk.total_promotions_bought || 0) - (pk.total_promotions_used || 0)) + ' מבצעים' : 'ניהול מבצעים',
        badge: si ? si.b : pk ? 'חבילה' : null }));
    }
    if (!ctx.excluded && on('coupons', ctx.coupons.length > 0) && (biz._k === 'business' || ctx.coupons.length > 0)) {
      var act = started.length, fut = ctx.coupons.filter(function (c) { return c.status === 'active' && c.start_date && new Date(c.start_date) > new Date(); }).length,
          drf = ctx.coupons.filter(function (c) { return c.status === 'draft'; }).length, parts = [];
      if (act) parts.push(act + ' פעילות'); if (fut) parts.push(fut + ' ישווקו בעתיד'); if (drf) parts.push(drf + ' חבילות להשלמה');
      var tot = ctx.coupons.reduce(function (n, c) { return n + (c.quantity || 0); }, 0);
      svc.push(item({ act: 'svc:coupons', icon: IC.ticket, color: C.coupons, title: 'קופונים',
        sub: ctx.coupons.length ? (parts.join(', ') || ctx.coupons.length + ' חבילות') : 'יצירה וניהול קופונים',
        badge: ctx.coupons.length ? ctx.coupons.length + ' חבילות · ' + tot + ' קופונים' : 'אין קופונים' }));
    }
    if (apptOk && (f.appointments === true || biz.appointment_system_status >= 2)) {
      var st = biz.appointment_system_status;
      svc.push(item({ act: 'svc:appointments', icon: IC.cal, color: C.appt, title: 'מערכת תורים',
        sub: st === 3 ? 'מערכת פעילה' : st === 2 ? 'נדרש חידוש מנוי' : st === 1 ? 'המשך הגדרה' : 'הפעל מערכת תורים',
        badge: st === 2 ? 'פג תוקף' : st === 1 ? 'בהגדרה' : null, badgeColor: '#F59E0B' }));
    }
    if (!ctx.excluded && on('prominence', !!ctx.promSub)) {
      var pi = ctx.promSub;
      svc.push(item({ act: 'svc:prominence', icon: IC.star, color: C.prom, title: 'הבלטה',
        sub: pi ? (pi.status === 'cancelled' ? 'תסתיים ב-' + fmtDate(pi.next_charge_date) : 'מתחדש ב-' + fmtDate(pi.next_charge_date)) : (biz._k === 'business' ? 'הבלטת העסק ברשימות' : 'הבלטת הכרטיס ברשימות'),
        badge: pi ? (pi.status === 'cancelled' ? 'ממתין לביטול' : '✓ פעיל') : null }));
    }
    // סטטוס מהיר — אריח מבצע פעיל
    // מוחרג ממונטיזציה (מספרה) — בלי סטטוס מבצעים, כמו באפליקציה (A-19)
    var qs = ctx.promo && !ctx.excluded ? '<div class="mb-item qs"><i style="background:' + C.promo + '1A">' +
      (ctx.promo.image_url ? '<img src="' + esc(ctx.promo.image_url) + '" alt="">' : svg(IC.tag, C.promo)) + '</i>' +
      '<span class="tx"><b>' + esc(ctx.promo.title || 'מבצע פעיל') + '</b><span class="s">מבצע פעיל · עד ' + fmtDate(ctx.promo.end_date) + '</span></span></div>' : '';

    $('#mb-app').innerHTML =
      '<div class="mb-hero"><div class="wrap"><div class="mb-top">' +
      '<div class="mb-img">' + (img ? '<img src="' + esc(img) + '" alt="">' : svg(IC.store, '#fff')) +
      (pend ? '<span class="pend' + (pend.status === 'pending' ? '' : ' no') + '">' + (pend.status === 'pending' ? 'בבדיקה' : 'לא אושרה') + '</span>' : '') + '</div>' +
      '<div class="mb-name"><h1>' + esc(biz.name) + '</h1><small>' + esc(ctx.typeName || E().label) + '</small></div>' +
      '<div class="mb-chips">' + chips + '</div>' + pick + '</div></div></div>' +
      '<div class="wrap mb-grid"><h2 class="mb-sep">' + (biz._k === 'business' ? 'ניהול העסק' : 'ניהול הכרטיס') + '</h2>' + left +
      (svc.length || qs ? '<h2 class="mb-sep">שירותים</h2>' + svc.join('') + qs : '') + '</div>';
    $('#mb-state').hidden = true; $('#mb-app').hidden = false;

    var p = $('#mb-pick'); if (p) p.addEventListener('change', function () {
      biz = list.filter(function (b) { return b.id === p.value; })[0]; state('<p>טוען…</p>'); loadBiz();
    });
    [].forEach.call(document.querySelectorAll('.mb-item'), function (b) { b.addEventListener('click', function () { action(b.getAttribute('data-act')); }); });
  }

  function action(a) {
    if (a === 'details') return detailsView();
    if (a === 'hours') return hoursView();
    if (a === 'rec') return recView();
    if (a === 'page') { location.href = bizUrl(); return; }
    if (a.indexOf('svc:') === 0) return serviceView(a.slice(4));
  }

  /* ── שמירה (update חלקי) ── */
  function save(patch) {
    return sb.from(E().table).update(patch).eq('id', biz.id).select(E().cols).single().then(function (r) {
      if (r.error) throw r.error;
      for (var k in r.data) biz[k] = r.data[k];
      list = list.map(function (b) { return b.id === biz.id ? biz : b; });
      return r.data;
    });
  }
  function dlg(html, wide) { var d = A.open(html); if (wide) d.classList.add('wide'); else d.classList.remove('wide'); return d; }
  function msg(d, t, ok) { var p = d.querySelector('.sa-msg'); if (!p) return; p.className = 'sa-msg ' + (ok ? 'sa-ok' : 'sa-err'); p.textContent = t || ''; p.hidden = !t; }

  /* ── פרטי העסק: תמונה, טלפון, שירותי אירועים ── */
  function detailsView() {
    var isPro = biz._k === 'professional';
    // עסק: שירותי אירועים רק לסוגים של _isEligibleForEventServices
    var ev = !isPro && EVENT_TYPES.indexOf(biz.business_type) >= 0, hasEv = !!(biz.event_services_description || '').trim();
    // בעל מקצוע: כמו ProfessionalFormScreen; "יהדות ומסורת" נערך ב-AddReligiousFigureScreen — בלי "מספק אחריות"
    var religion = isPro && biz.main_category === 'יהדות ומסורת';
    var proFields = isPro ?
      '<div class="mb-field"><label for="mb-ds">תיאור</label><textarea id="mb-ds" maxlength="1000">' + esc(biz.description || '') + '</textarea></div>' +
      '<div class="mb-field"><label for="mb-xp">שנות ניסיון</label><input id="mb-xp" type="number" min="0" max="80" inputmode="numeric" dir="ltr" value="' + esc(biz.experience_years == null ? '' : biz.experience_years) + '"></div>' +
      '<div class="mb-field"><label for="mb-pr">טווח מחירים</label><input id="mb-pr" maxlength="60" value="' + esc(biz.price_range || '') + '" placeholder="לדוגמה: 200-500 ₪"></div>' +
      (religion ? '' : '<label class="mb-chk"><input type="checkbox" id="mb-wr"' + (biz.provides_warranty ? ' checked' : '') + '> מספק אחריות</label>') : '';
    var d = dlg('<h2 id="sa-h">' + E().details + '</h2>' +
      '<div class="mb-field"><label>תמונה</label><div class="mb-imgedit"><span class="pv" id="mb-pv">' + (biz.image_url ? '<img src="' + esc(biz.image_url) + '" alt="">' : 'אין תמונה') + '</span>' +
      '<span><input type="file" id="mb-file" accept="image/*" hidden><button class="mb-btn ghost" type="button" id="mb-pickimg">' + (biz.image_url ? 'החלפת תמונה' : 'הוספת תמונה') + '</button>' +
      '<p class="mb-note">' + (isPro ? 'תמונה או לוגו.' : 'תמונה של חזית העסק.') + ' בחלק מהתחומים התמונה עוברת בדיקה לפני שהיא מוצגת.</p></span></div></div>' +
      '<form class="sa-f" novalidate id="mb-df">' +
      '<div class="mb-field"><label for="mb-ph">טלפון</label><input id="mb-ph" name="phone" type="tel" dir="ltr" inputmode="tel" value="' + esc(biz.phone || '') + '" placeholder="05X-XXXXXXX"></div>' +
      proFields +
      (ev ? '<label class="mb-chk"><input type="checkbox" id="mb-ev"' + (hasEv ? ' checked' : '') + '> מספק שירותים לאירועים</label>' +
        '<div class="mb-field" id="mb-evw"' + (hasEv ? '' : ' hidden') + '><label for="mb-evd">תיאור השירותים</label><textarea id="mb-evd" maxlength="500">' + esc(biz.event_services_description || '') + '</textarea>' +
        '<p class="mb-note">העסק יוצג ברשימת ספקי האירועים.</p></div>' : '') +
      '<p class="mb-note">' + (isPro ? 'שם, כתובת ותחום העיסוק' : 'שם, כתובת וסוג העסק') + ' — משנים כרגע באפליקציה.</p>' +
      '<p class="sa-msg" hidden></p><button class="sa-b pri" type="submit">שמירה</button></form>', true);

    var file = d.querySelector('#mb-file');
    d.querySelector('#mb-pickimg').addEventListener('click', function () { file.click(); });
    file.addEventListener('change', function () { if (file.files[0]) uploadImage(d, file.files[0]); });
    var evc = d.querySelector('#mb-ev'); if (evc) evc.addEventListener('change', function () { d.querySelector('#mb-evw').hidden = !evc.checked; });

    d.querySelector('#mb-df').addEventListener('submit', function (e) {
      e.preventDefault();
      var ph = d.querySelector('#mb-ph').value.trim(), digits = ph.replace(/\D/g, '');
      if (isPro && !ph) return msg(d, 'נא למלא טלפון');
      if (ph && !/^0\d{8,9}$/.test(digits)) return msg(d, 'מספר טלפון לא תקין');
      var patch = { phone: ph || null };
      if (evc) {
        var t = d.querySelector('#mb-evd').value.trim();
        if (evc.checked && !t) return msg(d, 'נא לתאר את השירותים לאירועים');
        patch.event_services_description = evc.checked ? t : null;
      }
      if (isPro) {
        var xp = d.querySelector('#mb-xp').value.trim();
        if (xp && !/^\d+$/.test(xp)) return msg(d, 'שנות ניסיון — מספר שלם');
        patch.description = d.querySelector('#mb-ds').value.trim() || null;
        patch.experience_years = xp ? parseInt(xp, 10) : null;
        patch.price_range = d.querySelector('#mb-pr').value.trim() || null;
        var wr = d.querySelector('#mb-wr'); if (wr) patch.provides_warranty = wr.checked;
      }
      var btn = d.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = 'שומרים…'; msg(d, '');
      // בעל מקצוע: בדיקת כפילות שם+טלפון כמו ProfessionalService.checkDuplicate (רק כשהטלפון השתנה)
      var dup = isPro && ph !== (biz.phone || '')
        ? sb.from('professionals').select('id').eq('name', biz.name).eq('phone', ph).neq('id', biz.id).limit(1).then(function (r) { return !!(r.data && r.data.length); }, function () { return false; })
        : Promise.resolve(false);
      dup.then(function (isDup) {
        if (isDup) { btn.disabled = false; btn.textContent = 'שמירה'; return msg(d, 'קיים כבר איש מקצוע עם שם וטלפון זהים'); }
        return save(patch).then(function () { A.close(); A.toast('הפרטים עודכנו ✓'); render(); });
      }).catch(function () { btn.disabled = false; btn.textContent = 'שמירה'; msg(d, 'השמירה נכשלה. נסו שוב'); });
    });
  }

  // כיווץ כמו באפליקציה (1920px, איכות 85, JPEG)
  function toJpeg(fileObj) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(fileObj), im = new Image();
      im.onload = function () {
        var max = 1920, w = im.naturalWidth, h = im.naturalHeight, k = Math.min(1, max / Math.max(w, h));
        var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
        var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? res(b) : rej(new Error('blob')); }, 'image/jpeg', 0.85);
      };
      im.onerror = function () { URL.revokeObjectURL(url); rej(new Error('img')); };
      im.src = url;
    });
  }
  function uploadImage(d, f) {
    if (!/^image\//.test(f.type)) return msg(d, 'נא לבחור קובץ תמונה');
    var btn = d.querySelector('#mb-pickimg'); btn.disabled = true; btn.textContent = 'מעלים…'; msg(d, '');
    var bucket = sb.storage.from('images'), base = E().img + '/' + biz.id;
    toJpeg(f).then(function (blob) {
      // הנתיב של האפליקציה; אם אין הרשאה לדרוס קובץ קיים — שם חדש
      return bucket.upload(base + '.jpg', blob, { contentType: 'image/jpeg', upsert: true }).then(function (r) {
        if (!r.error) return base + '.jpg';
        var alt = base + '_' + Date.now() + '.jpg';
        return bucket.upload(alt, blob, { contentType: 'image/jpeg', upsert: false }).then(function (r2) { if (r2.error) throw r2.error; return alt; });
      });
    }).then(function (path) {
      var url = bucket.getPublicUrl(path).data.publicUrl + '?v=' + Date.now();
      return save({ image_url: url }).then(function () {
        return sb.from('pending_entity_images').select('status,image_url').eq('entity_type', biz._k).eq('entity_id', biz.id).maybeSingle();
      });
    }).then(function (r) {
      ctx.pending = r && r.data;
      var pv = d.querySelector('#mb-pv'), shown = ctx.pending && ctx.pending.image_url ? ctx.pending.image_url : biz.image_url;
      pv.innerHTML = shown ? '<img src="' + esc(shown) + '" alt="">' : 'אין תמונה';
      btn.disabled = false; btn.textContent = 'החלפת תמונה';
      msg(d, ctx.pending && ctx.pending.status === 'pending' ? 'התמונה נשלחה לבדיקה ותוצג אחרי אישור' : 'התמונה עודכנה ✓', true);
      render();
    }).catch(function () { btn.disabled = false; btn.textContent = biz.image_url ? 'החלפת תמונה' : 'הוספת תמונה'; msg(d, 'העלאת התמונה נכשלה. נסו שוב'); });
  }

  /* ── שעות פתיחה ──
   * כמו WeeklyScheduleEditor + ShabbatTimePicker באפליקציה. ערכים אפשריים בשדה (TimeRange):
   *  "HH:MM" קבוע · "חורף|קיץ" עונתי · "candle_lighting-60" יחסי לכניסת שבת · "havdalah+30" יחסי לצאת שבת · end ריק = טקסט חופשי
   * שישי-סגירה, מוצ"ש-פתיחה ומוצ"ש-סגירה נערכים בבורר שבת (יחסי / שעה אחידה / לפי עונה) עם אותן מגבלות. */
  var SH = { friWinMax: '15:30', friSumMax: '17:00', satWinMin: '18:30', satSumMin: '20:30' };
  var REL = [[30, 'חצי שעה'], [60, 'שעה'], [90, 'שעה וחצי'], [120, 'שעתיים']];
  function isPlain(v) { return /^\d{1,2}:\d{2}$/.test(v || ''); }
  function relLabel(n) { var r = REL.filter(function (x) { return x[0] === n; })[0]; return r ? r[1] : n + ' דק׳'; }
  function timeText(v) {
    if (!v) return '—';
    var m;
    if ((m = /^candle_lighting(?:-(\d+))?$/.exec(v))) return m[1] ? relLabel(+m[1]) + ' לפני כניסת שבת' : 'כניסת שבת';
    if ((m = /^havdalah(?:\+(\d+))?$/.exec(v))) return m[1] ? relLabel(+m[1]) + ' אחרי צאת שבת' : 'צאת שבת';
    if (v.indexOf('|') > 0) { var p = v.split('|'); return 'חורף ' + p[0] + ' · קיץ ' + p[1]; }
    return v;
  }
  // איזה בורר שבת לשדה (null = שדה שעה רגיל)
  function shabbatType(k, f) {
    if (k === 'friday' && f === 'end') return 'friClose';
    if (k === 'saturday' && f === 'start') return 'satOpen';
    if (k === 'saturday' && f === 'end') return 'satClose';
    return null;
  }

  function hoursView() {
    var sch = JSON.parse(JSON.stringify(biz.weekly_schedule || {}));
    var ed = null; // שדה בעריכה בבורר השבת: {k,i,f}

    function field(k, i, f, v, label) {
      var t = shabbatType(k, f);
      if (!t && isPlain(v)) return '<input type="time" data-k="' + k + '" data-i="' + i + '" data-f="' + f + '" value="' + esc(v) + '" aria-label="' + label + '">';
      return '<button type="button" class="hr-tok' + (ed && ed.k === k && ed.i === i && ed.f === f ? ' on' : '') + '" data-tok="' + k + ':' + i + ':' + f + '">' + esc(timeText(v)) + '</button>';
    }
    function picker() {
      var t = shabbatType(ed.k, ed.f), v = sch[ed.k][ed.i][ed.f] || '', m;
      var mode = /candle_lighting|havdalah/.test(v) ? 'rel' : v.indexOf('|') > 0 ? 'sea' : 'fix';
      if (t === 'satClose' && mode === 'rel') mode = 'fix';
      var relN = (m = /[-+](\d+)$/.exec(v)) ? +m[1] : 60;
      var sea = v.indexOf('|') > 0 ? v.split('|') : (t === 'friClose' ? ['14:00', '16:00'] : t === 'satOpen' ? ['19:00', '21:00'] : ['22:00', '23:30']);
      var fix = isPlain(v) ? v : (t === 'friClose' ? '14:00' : t === 'satOpen' ? '21:00' : '23:00');
      var title = t === 'friClose' ? 'שעת סגירה ביום שישי' : t === 'satOpen' ? 'שעת פתיחה במוצאי שבת' : 'שעת סגירה במוצאי שבת';
      var relWord = t === 'friClose' ? 'לפני כניסת שבת' : 'אחרי צאת שבת';
      var opt = function (id, label, sub, body) {
        return '<label class="sp-opt' + (mode === id ? ' on' : '') + '"><input type="radio" name="sp-m" value="' + id + '"' + (mode === id ? ' checked' : '') + '><span><b>' + label + '</b><small>' + sub + '</small></span></label>' +
          '<div class="sp-body" data-for="' + id + '"' + (mode === id ? '' : ' hidden') + '>' + body + '</div>';
      };
      return '<div class="sp"><b class="sp-t">' + title + '</b>' +
        (t !== 'satClose' ? opt('rel', 'זמן יחסי ' + relWord, 'משתנה אוטומטית לפי זמני השבת',
          '<div class="sp-chips">' + REL.map(function (x) { return '<button type="button" class="sp-chip' + (x[0] === relN ? ' on' : '') + '" data-rel="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>') : '') +
        opt('fix', 'שעה קבועה אחידה', t === 'friClose' ? 'עד ' + SH.friWinMax + ' (מוגבל לשעון חורף)' : 'אותה שעה כל השנה',
          '<input type="time" id="sp-fix" value="' + esc(fix) + '">') +
        opt('sea', 'שעה קבועה לפי עונה', t === 'friClose' ? 'חורף עד ' + SH.friWinMax + ', קיץ עד ' + SH.friSumMax : t === 'satOpen' ? 'חורף מ-' + SH.satWinMin + ', קיץ מ-' + SH.satSumMin : 'שעה שונה לחורף וקיץ',
          '<div class="sp-sea"><label>חורף <input type="time" id="sp-w" value="' + esc(sea[0]) + '"></label><label>קיץ <input type="time" id="sp-s" value="' + esc(sea[1]) + '"></label></div>') +
        '<p class="sp-err" hidden></p><div class="sp-acts"><button type="button" class="hr-lnk" id="sp-ok">אישור</button><button type="button" class="hr-lnk" id="sp-no" style="color:#6B7689">ביטול</button></div></div>';
    }
    function rowHtml(k, label) {
      var r = sch[k];
      var body = r && r.length
        ? '<div class="hr-rngs">' + r.map(function (x, i) {
          if (x.end === '' && x.start) // טקסט חופשי (TimeRange.customText) — נשמר כמו שהוא
            return '<div class="hr-r"><span class="hr-txt">' + esc(x.start) + '</span><button class="hr-x" type="button" data-del="' + k + ':' + i + '" aria-label="הסרה">×</button></div>';
          return '<div class="hr-r">' + field(k, i, 'start', x.start, 'פתיחה ' + label) + '–' + field(k, i, 'end', x.end, 'סגירה ' + label) +
            '<button class="hr-x" type="button" data-del="' + k + ':' + i + '" aria-label="הסרת טווח">×</button></div>' +
            (ed && ed.k === k && ed.i === i ? picker() : ''); }).join('') +
          '<div class="hr-acts"><button class="hr-lnk" type="button" data-add="' + k + '">+ טווח נוסף</button>' +
          (k !== 'friday' && k !== 'saturday' ? '<button class="hr-lnk" type="button" data-copy="' + k + '">העתקה לימים א׳–ה׳</button>' : '') + '</div></div>'
        : '<div class="hr-rngs"><span class="hr-closed">סגור</span><div class="hr-acts"><button class="hr-lnk" type="button" data-add="' + k + '">+ הוספת שעות</button></div></div>';
      return '<div class="hr-day"><b>' + label + '</b>' + body + '</div>';
    }
    function draw() {
      var d = dlg('<h2 id="sa-h">' + E().hours + '</h2><div>' + DAYS.map(function (x) { return rowHtml(x[0], x[1]); }).join('') + '</div>' +
        '<p class="mb-note">ביום שישי ובמוצאי שבת אפשר לבחור שעה יחסית לכניסת/צאת שבת, שעה אחידה או שעה לפי עונה.</p>' +
        '<p class="sa-msg" hidden></p><button class="sa-b pri" type="button" id="hr-save">שמירה</button>', true);
      d.querySelectorAll('input[type=time][data-k]').forEach(function (inp) {
        inp.addEventListener('change', function () { sch[inp.dataset.k][+inp.dataset.i][inp.dataset.f] = inp.value; });
      });
      d.querySelectorAll('[data-tok]').forEach(function (b) { b.addEventListener('click', function () {
        var p = b.dataset.tok.split(':');
        if (shabbatType(p[0], p[2])) { ed = { k: p[0], i: +p[1], f: p[2] }; }
        else { sch[p[0]][+p[1]][p[2]] = ''; } // ערך לא רגיל ביום חול — איפוס לשדה שעה
        draw();
      }); });
      d.querySelectorAll('[data-add]').forEach(function (b) { b.addEventListener('click', function () {
        var k = b.dataset.add, r = sch[k] || [], last = r[r.length - 1];
        // ברירות מחדל כמו ShabbatTimeConstraints
        var nr = k === 'friday' ? { start: '08:00', end: '14:00|16:00' } : k === 'saturday' ? { start: 'havdalah+30', end: '22:00|23:30' }
          : last && isPlain(last.end) ? { start: last.end, end: '20:00' } : { start: '08:00', end: '20:00' };
        r.push(nr); sch[k] = r; draw(); }); });
      d.querySelectorAll('[data-del]').forEach(function (b) { b.addEventListener('click', function () {
        var p = b.dataset.del.split(':'), r = sch[p[0]]; r.splice(+p[1], 1); sch[p[0]] = r.length ? r : null; ed = null; draw(); }); });
      d.querySelectorAll('[data-copy]').forEach(function (b) { b.addEventListener('click', function () {
        var src = sch[b.dataset.copy];
        // שישי ומוצ״ש לא נדרסים — יש להם כללים משלהם
        DAYS.forEach(function (x) { if (['friday', 'saturday'].indexOf(x[0]) < 0) sch[x[0]] = JSON.parse(JSON.stringify(src)); }); draw(); }); });

      // בורר שבת
      var sp = d.querySelector('.sp');
      if (sp) {
        var t = shabbatType(ed.k, ed.f), relN = null;
        try { sp.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {}
        sp.querySelectorAll('input[name=sp-m]').forEach(function (r) { r.addEventListener('change', function () {
          sp.querySelectorAll('.sp-opt').forEach(function (o) { o.classList.toggle('on', o.querySelector('input').checked); });
          sp.querySelectorAll('.sp-body').forEach(function (b) { b.hidden = b.dataset.for !== r.value; });
        }); });
        sp.querySelectorAll('[data-rel]').forEach(function (c) { c.addEventListener('click', function () {
          relN = +c.dataset.rel; sp.querySelectorAll('[data-rel]').forEach(function (x) { x.classList.toggle('on', x === c); }); }); });
        var on = sp.querySelector('.sp-chip.on'); if (on) relN = +on.dataset.rel;
        sp.querySelector('#sp-no').addEventListener('click', function () { ed = null; draw(); });
        sp.querySelector('#sp-ok').addEventListener('click', function () {
          var mode = sp.querySelector('input[name=sp-m]:checked').value, val, err = null;
          var w = sp.querySelector('#sp-w').value, s = sp.querySelector('#sp-s').value, fx = sp.querySelector('#sp-fix').value;
          if (mode === 'rel') {
            if (!relN) err = 'נא לבחור זמן';
            val = t === 'friClose' ? 'candle_lighting-' + relN : 'havdalah+' + relN;
          } else if (mode === 'fix') {
            if (!fx) err = 'נא לבחור שעה';
            else if (t === 'friClose' && fx > SH.friWinMax) err = 'שעה אחידה חייבת להיות מוקדמת מ-' + SH.friWinMax + ' (שעון חורף)';
            val = fx;
          } else {
            if (!w || !s) err = 'נא למלא שעת חורף ושעת קיץ';
            else if (t === 'friClose' && w > SH.friWinMax) err = 'בחורף לא ניתן לסגור אחרי ' + SH.friWinMax;
            else if (t === 'friClose' && s > SH.friSumMax) err = 'בקיץ לא ניתן לסגור אחרי ' + SH.friSumMax;
            else if (t === 'satOpen' && w < SH.satWinMin) err = 'בחורף לא ניתן לפתוח לפני ' + SH.satWinMin;
            else if (t === 'satOpen' && s < SH.satSumMin) err = 'בקיץ לא ניתן לפתוח לפני ' + SH.satSumMin;
            val = w + '|' + s;
          }
          if (err) { var e = sp.querySelector('.sp-err'); e.textContent = err; e.hidden = false; return; }
          sch[ed.k][ed.i][ed.f] = val; ed = null; draw();
        });
      }

      d.querySelector('#hr-save').addEventListener('click', function () {
        var out = {}, bad = null;
        DAYS.forEach(function (x) {
          var r = (sch[x[0]] || []).filter(function (t) { return t.start || t.end; });
          r.forEach(function (t) {
            if (t.end === '' && t.start) return; // טקסט חופשי
            if (!t.start || !t.end) bad = bad || x[1];
            // סגירה אחרי חצות (00:00, 01:00) — לא שגיאה
            else if (isPlain(t.start) && isPlain(t.end) && t.start >= t.end && t.end >= '05:00') bad = bad || x[1];
          });
          out[x[0]] = r.length ? r.map(function (t) { return { start: t.start, end: t.end }; }) : null;
        });
        if (bad) return msg(d, 'ביום ' + bad + ' יש טווח שעות לא תקין');
        var btn = d.querySelector('#hr-save'); btn.disabled = true; btn.textContent = 'שומרים…';
        save({ weekly_schedule: out }).then(function () { A.close(); A.toast(E().hours + ' עודכנו ✓'); render(); })
          .catch(function () { btn.disabled = false; btn.textContent = 'שמירה'; msg(d, 'השמירה נכשלה. נסו שוב'); });
      });
    }
    draw();
  }

  /* ── בקשת המלצות ── */
  function recView() {
    var url = bizUrl() ? location.origin + bizUrl() : location.origin + '/app/' + E().app + '/' + biz.id + '?recommend=1';
    var text = 'היי, אם נהניתם מהשירות שלנו, נשמח שתמליצו עלינו בשכונה 🙏 ' + url;
    var d = dlg('<h2 id="sa-h">בקשו המלצות מלקוחות</h2>' +
      '<p>שלחו ללקוחות מרוצים את הקישור. שם הם לוחצים "אני ממליץ" — אחרי התחברות ואימות טלפון, כדי שכל המלצה תהיה של אדם אמיתי.</p>' +
      '<div class="sa-f"><input readonly dir="ltr" value="' + esc(url) + '" id="mb-rl"></div>' +
      '<a class="sa-b pri" href="https://wa.me/?text=' + encodeURIComponent(text) + '" target="_blank" rel="noopener">שליחה ב-WhatsApp</a>' +
      '<button class="sa-b" type="button" id="mb-cp">העתקת הקישור</button>');
    d.querySelector('#mb-cp').addEventListener('click', function () {
      var inp = d.querySelector('#mb-rl'); inp.select();
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).catch(function () { try { document.execCommand('copy'); } catch (e) {} })
        .then(function () { A.toast('הקישור הועתק'); });
    });
  }

  /* ── שירותים: שלב 1 — מצב בלבד; הניהול באתר בשלבים הבאים ── */
  var SVC = { promotions: 'מבצעים', coupons: 'קופונים', appointments: 'מערכת התורים', prominence: 'הבלטה' };
  function serviceView(k) {
    var d = dlg('<h2 id="sa-h">' + SVC[k] + '</h2><p>ניהול ' + SVC[k] + ' יגיע לכאן בקרוב. בינתיים אפשר לנהל אותו באפליקציה, והשינויים יופיעו גם כאן.</p>' +
      '<a class="sa-b pri" href="/app/">לאפליקציה</a><button class="sa-b" type="button" data-c>סגירה</button>');
    d.querySelector('[data-c]').addEventListener('click', A.close);
  }

  function init() {
    A = window.ShchunaAuth; if (!A || !$('#mb-state')) return;
    document.addEventListener('shchuna:auth', function (e) { if (e.detail && e.detail.user) start(); else showLogin(); });
    start();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
