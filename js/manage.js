/* שכונה — ניהול העסק באתר (/my-business/). שלב 1: פרטים, תמונה, שעות, בקשת המלצות, מצב השירותים.
 * שומר בדיוק כמו האפליקציה (BusinessManagementScreen / BusinessAddScreen), אבל רק את השדות שנערכו (update חלקי):
 *  - שעות: weekly_schedule = { sunday..saturday: null (סגור) | [{start:"HH:MM", end:"HH:MM"}] }
 *  - תמונה: bucket images, businesses/profiles/{id}.jpg (JPEG), URL עם ?v=, ואז image_url. מודרציה — טריגר בשרת.
 *  - שירותי אירועים: event_services_description — רק לסוגי העסק שבאפליקציה (_isEligibleForEventServices)
 * רענון באפליקציה: trg_businesses_modified מעדכן את table_last_modified.
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
    state('<h1>ניהול העסק</h1><p>התחברו עם החשבון שאיתו רשמתם את העסק באפליקציה. אותו חשבון, אותם נתונים.</p>' +
      '<button class="mb-btn" type="button" id="mb-login">התחברות</button>');
    $('#mb-login').addEventListener('click', function () { A.login('כניסה לניהול העסק — אותו חשבון כמו באפליקציה.'); });
  }
  function showNone() {
    state('<h1>לא מצאנו עסק בבעלותכם</h1><p>כאן מנהלים עסק שאישרתם שהוא שלכם. אם רשמתם את העסק עם חשבון אחר — התנתקו והתחברו איתו. רישום עסק או אישור בעלות — כרגע באפליקציה.</p>' +
      '<a class="mb-btn" href="/app/">לאפליקציה</a>');
  }
  function showError() {
    state('<h1>משהו השתבש</h1><p>לא הצלחנו לטעון את פרטי העסק.</p><button class="mb-btn" type="button" id="mb-retry">נסו שוב</button>');
    $('#mb-retry').addEventListener('click', start);
  }

  /* ── טעינה ── */
  function start() {
    state('<p>טוען…</p>');
    A.getUser().then(function (x) {
      sb = x.sb; user = x.user;
      if (!user) return showLogin();
      return sb.from('businesses').select(COLS).eq('user_id', user.id).eq('is_locked', true).eq('is_active', true).order('created_at', { ascending: true }).then(function (r) {
        if (r.error) throw r.error;
        list = r.data || [];
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
      return sb.from('subscriptions').select('id,status,next_charge_date').eq('entity_id', biz.id).eq('entity_type', 'business')
        .eq('payment_type', t).or('status.eq.active,status.eq.trial,status.eq.cancelled').gte('next_charge_date', today).maybeSingle();
    };
    var slugP = biz.community_id === HOME_COMMUNITY
      ? fetch('/har-homa/biz/slugs.json').then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
      : Promise.resolve({});
    return Promise.all([
      sb.from('app_config').select('key,value').in('key', ['features_monetization', 'monetization_excluded_business_types']),
      biz.business_type ? sb.from('business_types').select('name_he').eq('id', biz.business_type).maybeSingle() : Promise.resolve({ data: null }),
      sb.from('pending_entity_images').select('status,image_url').eq('entity_type', 'business').eq('entity_id', biz.id).maybeSingle(),
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
        excluded: (cfg.monetization_excluded_business_types || []).indexOf(biz.business_type) >= 0,
        typeName: r[1].data && r[1].data.name_he,
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
  function bizUrl() { return ctx.slug ? '/har-homa/biz/' + encodeURIComponent(ctx.slug) + '/' : null; }

  function render() {
    var hasSchedule = biz.weekly_schedule && DAYS.some(function (d) { return (biz.weekly_schedule[d[0]] || []).length; });
    var pend = ctx.pending && ctx.pending.image_url ? ctx.pending : null;
    var img = pend ? pend.image_url : biz.image_url;
    var started = ctx.coupons.filter(function (c) { return c.status === 'active' && (!c.start_date || new Date(c.start_date) <= new Date()); });
    var apptOk = (APPT_CATS.indexOf(biz.business_category) >= 0 || APPT_TYPES.indexOf(biz.business_type) >= 0);

    var chips = '<span class="mb-chip">' + svg(IC.eye, '#fff').replace(/24/g, '16') + (biz.view_count || 0) + ' צפיות</span>' +
      (ctx.promo ? '<span class="mb-chip">' + svg(IC.tag, '#fff').replace(/24/g, '16') + 'מבצע פעיל</span>' : '') +
      (ctx.coupons.length ? '<span class="mb-chip">' + svg(IC.ticket, '#fff').replace(/24/g, '16') + ctx.coupons.length + ' חבילות קופונים</span>' : '') +
      (apptOk && biz.appointment_system_status === 2 ? '<span class="mb-chip">' + svg(IC.cal, '#fff').replace(/24/g, '16') + 'תורים פעיל</span>' : '');

    var pick = list.length > 1 ? '<select class="mb-pick" id="mb-pick" aria-label="בחירת עסק">' + list.map(function (b) {
      return '<option value="' + esc(b.id) + '"' + (b.id === biz.id ? ' selected' : '') + '>' + esc(b.name) + '</option>'; }).join('') + '</select>' : '';

    var left = [
      item({ act: 'details', icon: IC.store, color: C.navy, title: 'פרטי העסק', sub: biz.address || 'צפייה ועריכה' }),
      item({ act: 'hours', icon: IC.clock, color: C.hours, title: 'שעות פתיחה', sub: hasSchedule ? 'הוגדרו שעות פתיחה' : 'עוד לא הוגדרו — להגדרה', badge: hasSchedule ? null : 'חסר', badgeColor: '#F59E0B' }),
      item({ act: 'rec', icon: IC.heart, color: C.rec, title: 'בקש המלצות מלקוחות', sub: biz.recommend_count > 0 ? '❤ ' + biz.recommend_count + ' ממליצים' : 'עוד אין המלצות' }),
      bizUrl() ? item({ act: 'page', icon: IC.link, color: C.site, title: 'העמוד שלכם באתר', sub: 'כך השכנים רואים את העסק' }) : ''
    ].join('');

    // שירותים — כמו EntityServicesSection: מוחרג ממונטיזציה (מספרות) רואה רק תורים
    var f = ctx.features, svc = [];
    if (!ctx.excluded && f.promotions !== false) {
      var si = subInfo(ctx.promoSub), pk = ctx.pkg;
      svc.push(item({ act: 'svc:promotions', icon: IC.tag, color: C.promo, title: 'מבצעים',
        sub: si ? si.s : pk ? 'נותרו ' + ((pk.total_promotions_bought || 0) - (pk.total_promotions_used || 0)) + ' מבצעים' : 'ניהול מבצעים',
        badge: si ? si.b : pk ? 'חבילה' : null }));
    }
    if (!ctx.excluded && f.coupons !== false) {
      var act = started.length, fut = ctx.coupons.filter(function (c) { return c.status === 'active' && c.start_date && new Date(c.start_date) > new Date(); }).length,
          drf = ctx.coupons.filter(function (c) { return c.status === 'draft'; }).length, parts = [];
      if (act) parts.push(act + ' פעילות'); if (fut) parts.push(fut + ' ישווקו בעתיד'); if (drf) parts.push(drf + ' חבילות להשלמה');
      var tot = ctx.coupons.reduce(function (n, c) { return n + (c.quantity || 0); }, 0);
      svc.push(item({ act: 'svc:coupons', icon: IC.ticket, color: C.coupons, title: 'קופונים',
        sub: ctx.coupons.length ? (parts.join(', ') || ctx.coupons.length + ' חבילות') : 'יצירה וניהול קופונים',
        badge: ctx.coupons.length ? ctx.coupons.length + ' חבילות · ' + tot + ' קופונים' : 'אין קופונים' }));
    }
    if (f.appointments === true && apptOk) {
      var st = biz.appointment_system_status;
      svc.push(item({ act: 'svc:appointments', icon: IC.cal, color: C.appt, title: 'מערכת תורים',
        sub: st === 3 ? 'מערכת פעילה' : st === 2 ? 'נדרש חידוש מנוי' : st === 1 ? 'המשך הגדרה' : 'הפעל מערכת תורים',
        badge: st === 2 ? 'פג תוקף' : st === 1 ? 'בהגדרה' : null, badgeColor: '#F59E0B' }));
    }
    if (!ctx.excluded && f.prominence !== false) {
      var pi = ctx.promSub;
      svc.push(item({ act: 'svc:prominence', icon: IC.star, color: C.prom, title: 'הבלטה',
        sub: pi ? (pi.status === 'cancelled' ? 'תסתיים ב-' + fmtDate(pi.next_charge_date) : 'מתחדש ב-' + fmtDate(pi.next_charge_date)) : 'הבלטת העסק ברשימות',
        badge: pi ? (pi.status === 'cancelled' ? 'ממתין לביטול' : '✓ פעיל') : null }));
    }
    var qs = ctx.promo ? '<h2 style="margin-top:10px">סטטוס מהיר</h2><div class="mb-qs">' + (ctx.promo.image_url ? '<img src="' + esc(ctx.promo.image_url) + '" alt="">' : '') +
      '<span><b>' + esc(ctx.promo.title || 'מבצע פעיל') + '</b><small>עד ' + fmtDate(ctx.promo.end_date) + '</small></span></div>' : '';

    $('#mb-app').innerHTML =
      '<div class="mb-hero"><div class="wrap">' +
      '<div class="mb-top"><div class="mb-img">' + (img ? '<img src="' + esc(img) + '" alt="">' : svg(IC.store, '#fff')) +
      (pend ? '<span class="pend' + (pend.status === 'pending' ? '' : ' no') + '">' + (pend.status === 'pending' ? 'בבדיקה' : 'לא אושרה') + '</span>' : '') + '</div>' +
      '<div class="mb-name"><h1>' + esc(biz.name) + '</h1><small>' + esc(ctx.typeName || 'עסק') + '</small></div>' + pick + '</div>' +
      '<div class="mb-chips">' + chips + '</div></div></div>' +
      '<div class="wrap mb-grid"><div class="mb-col"><h2>ניהול העסק</h2>' + left + '</div>' +
      '<div class="mb-col">' + (svc.length ? '<h2>שירותים</h2>' + svc.join('') : '') + qs + '</div></div>';
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
    return sb.from('businesses').update(patch).eq('id', biz.id).select(COLS).single().then(function (r) {
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
    var ev = EVENT_TYPES.indexOf(biz.business_type) >= 0, hasEv = !!(biz.event_services_description || '').trim();
    var d = dlg('<h2 id="sa-h">פרטי העסק</h2>' +
      '<div class="mb-field"><label>תמונת העסק</label><div class="mb-imgedit"><span class="pv" id="mb-pv">' + (biz.image_url ? '<img src="' + esc(biz.image_url) + '" alt="">' : 'אין תמונה') + '</span>' +
      '<span><input type="file" id="mb-file" accept="image/*" hidden><button class="mb-btn ghost" type="button" id="mb-pickimg">' + (biz.image_url ? 'החלפת תמונה' : 'הוספת תמונה') + '</button>' +
      '<p class="mb-note">תמונה של חזית העסק. בחלק מהתחומים התמונה עוברת בדיקה לפני שהיא מוצגת.</p></span></div></div>' +
      '<form class="sa-f" novalidate id="mb-df">' +
      '<div class="mb-field"><label for="mb-ph">טלפון העסק</label><input id="mb-ph" name="phone" type="tel" dir="ltr" inputmode="tel" value="' + esc(biz.phone || '') + '" placeholder="02-0000000"></div>' +
      (ev ? '<label class="mb-chk"><input type="checkbox" id="mb-ev"' + (hasEv ? ' checked' : '') + '> מספק שירותים לאירועים</label>' +
        '<div class="mb-field" id="mb-evw"' + (hasEv ? '' : ' hidden') + '><label for="mb-evd">תיאור השירותים</label><textarea id="mb-evd" maxlength="500">' + esc(biz.event_services_description || '') + '</textarea>' +
        '<p class="mb-note">העסק יוצג ברשימת ספקי האירועים.</p></div>' : '') +
      '<p class="mb-note">שם, כתובת וסוג העסק — משנים כרגע באפליקציה.</p>' +
      '<p class="sa-msg" hidden></p><button class="sa-b pri" type="submit">שמירה</button></form>', true);

    var file = d.querySelector('#mb-file');
    d.querySelector('#mb-pickimg').addEventListener('click', function () { file.click(); });
    file.addEventListener('change', function () { if (file.files[0]) uploadImage(d, file.files[0]); });
    var evc = d.querySelector('#mb-ev'); if (evc) evc.addEventListener('change', function () { d.querySelector('#mb-evw').hidden = !evc.checked; });

    d.querySelector('#mb-df').addEventListener('submit', function (e) {
      e.preventDefault();
      var ph = d.querySelector('#mb-ph').value.trim(), digits = ph.replace(/\D/g, '');
      if (ph && !/^0\d{8,9}$/.test(digits)) return msg(d, 'מספר טלפון לא תקין');
      var patch = { phone: ph || null };
      if (evc) {
        var t = d.querySelector('#mb-evd').value.trim();
        if (evc.checked && !t) return msg(d, 'נא לתאר את השירותים לאירועים');
        patch.event_services_description = evc.checked ? t : null;
      }
      var btn = d.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = 'שומרים…'; msg(d, '');
      save(patch).then(function () { A.close(); A.toast('הפרטים עודכנו ✓'); render(); })
        .catch(function () { btn.disabled = false; btn.textContent = 'שמירה'; msg(d, 'השמירה נכשלה. נסו שוב'); });
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
    var bucket = sb.storage.from('images'), base = 'businesses/profiles/' + biz.id;
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
        return sb.from('pending_entity_images').select('status,image_url').eq('entity_type', 'business').eq('entity_id', biz.id).maybeSingle();
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

  /* ── שעות פתיחה ── */
  function hoursView() {
    var sch = JSON.parse(JSON.stringify(biz.weekly_schedule || {}));
    function rowHtml(k, label) {
      var r = sch[k];
      var body = r && r.length
        ? '<div class="hr-rngs">' + r.map(function (x, i) {
          return '<div class="hr-r"><input type="time" data-k="' + k + '" data-i="' + i + '" data-f="start" value="' + esc(x.start || '') + '" aria-label="פתיחה ' + label + '">' +
            '–<input type="time" data-k="' + k + '" data-i="' + i + '" data-f="end" value="' + esc(x.end || '') + '" aria-label="סגירה ' + label + '">' +
            '<button class="hr-x" type="button" data-del="' + k + ':' + i + '" aria-label="הסרת טווח">×</button></div>'; }).join('') +
          '<div class="hr-acts"><button class="hr-lnk" type="button" data-add="' + k + '">+ טווח נוסף</button>' +
          '<button class="hr-lnk" type="button" data-copy="' + k + '">העתקה לכל הימים</button></div></div>'
        : '<div class="hr-rngs"><span class="hr-closed">סגור</span><div class="hr-acts"><button class="hr-lnk" type="button" data-add="' + k + '">+ הוספת שעות</button></div></div>';
      return '<div class="hr-day"><b>' + label + '</b>' + body + '</div>';
    }
    function draw() {
      var d = dlg('<h2 id="sa-h">שעות פתיחה</h2><div>' + DAYS.map(function (x) { return rowHtml(x[0], x[1]); }).join('') + '</div>' +
        '<p class="sa-msg" hidden></p><button class="sa-b pri" type="button" id="hr-save">שמירה</button>', true);
      d.querySelectorAll('input[type=time]').forEach(function (inp) {
        inp.addEventListener('change', function () { sch[inp.dataset.k][+inp.dataset.i][inp.dataset.f] = inp.value; });
      });
      d.querySelectorAll('[data-add]').forEach(function (b) { b.addEventListener('click', function () {
        var k = b.dataset.add, r = sch[k] || [], last = r[r.length - 1];
        r.push(last ? { start: last.end || '16:00', end: '20:00' } : { start: '08:00', end: '20:00' }); sch[k] = r; draw(); }); });
      d.querySelectorAll('[data-del]').forEach(function (b) { b.addEventListener('click', function () {
        var p = b.dataset.del.split(':'), r = sch[p[0]]; r.splice(+p[1], 1); sch[p[0]] = r.length ? r : null; draw(); }); });
      d.querySelectorAll('[data-copy]').forEach(function (b) { b.addEventListener('click', function () {
        var src = sch[b.dataset.copy];
        // שישי ומוצ״ש לא נדרסים — שעות שונות כמעט תמיד
        DAYS.forEach(function (x) { if (['friday', 'saturday'].indexOf(x[0]) < 0) sch[x[0]] = JSON.parse(JSON.stringify(src)); }); draw(); }); });
      d.querySelector('#hr-save').addEventListener('click', function () {
        var out = {}, bad = null;
        DAYS.forEach(function (x) {
          var r = (sch[x[0]] || []).filter(function (t) { return t.start || t.end; });
          r.forEach(function (t) { if (!t.start || !t.end || t.start >= t.end) bad = bad || x[1]; });
          out[x[0]] = r.length ? r.map(function (t) { return { start: t.start, end: t.end }; }) : null;
        });
        if (bad) return msg(d, 'ביום ' + bad + ' יש טווח שעות לא תקין');
        var btn = d.querySelector('#hr-save'); btn.disabled = true; btn.textContent = 'שומרים…';
        save({ weekly_schedule: out }).then(function () { A.close(); A.toast('שעות הפתיחה עודכנו ✓'); render(); })
          .catch(function () { btn.disabled = false; btn.textContent = 'שמירה'; msg(d, 'השמירה נכשלה. נסו שוב'); });
      });
    }
    draw();
  }

  /* ── בקשת המלצות ── */
  function recView() {
    var url = bizUrl() ? location.origin + bizUrl() : location.origin + '/app/business/' + biz.id + '?recommend=1';
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
