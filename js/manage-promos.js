/* שכונה — ניהול מבצעים במסך ניהול העסק באתר (/my-business/). נטען לפי דרישה מ-manage.js.
 * זהה לאפליקציה (PromotionsManagementScreen + AddPromotionScreen + PromotionService):
 *  - טעינה: מבצעים לא-פגים (is_active, end_date >= עכשיו), 3 אחרונים שפגו, מנוי promotions_subscription
 *    (active/trial/cancelled ו-next_charge_date >= היום); אם אין מנוי — חבילת כמות עם יתרה (promotion_packages).
 *  - שמירה: RPC save_promotion (יצירה/עריכה, חפיפה P0409 → דיאלוג trim_existing/start_after, נעילה P0423 אחרי 15 דק׳).
 *  - משך: מנוי 30 יום, חבילה 7; ניסיון/מנוי מבוטל (ולא שילם) — עד next_charge_date. עריכה — לפי מקור המבצע.
 *  - בלי תמונה — חובה כותרת ותיאור. תמונה: images/promotions/general/{id}_{ts}.jpg (uniquePath), מודרציה בטריגר.
 *  - מבצע חדש מחבילה (בלי מנוי) → total_promotions_used + 1.
 *  - מחיקת מבצע עתידי = is_active=false (cancel). מחיקה מההיסטוריה = delete-entity.
 *  - תאריכים נשמרים כמו Dart toIso8601String של זמן מקומי (בלי Z); created_at חדש ב-UTC.
 *  - טקסטים ומגבלות מ-app_config: text_promotion_form, text_publish_notices, text_promotion_terms,
 *    limit_promotion_terms, promotion_default_days.
 * רכישה — עדיין באפליקציה (חלק ב׳).
 */
(function () {
  'use strict';
  var EDIT_MIN = 15, MAX_SUB = 30, MAX_PKG = 7, SEP = ' • ', TLH = 'ט.ל.ח', LEGAL = 'legal_disclaimer';
  // ברירות מחדל כמו RemoteConfig.defaults באפליקציה
  var DEF = {
    form: { no_access: 'אין מנוי או חבילת מבצעים פעילה', no_access_banner: 'אין חבילת מבצעים פעילה.\nיש לרכוש מנוי או חבילת מבצעים כדי לפרסם.',
      no_image_requires_title_desc: 'ללא תמונה חובה להזין כותרת ותיאור', duration_exceeds_max: 'משך מבצע לא יכול לעלות על {max_days} ימים',
      exceeds_subscription_end: 'המבצע לא יכול לחרוג מתאריך סיום המנוי ({end_date})', max_selected_terms: 'בחר עד {max_selected} תנאים מוכנים',
      max_selected_terms_hint: 'ניתן לבחור עד {max_selected} תנאים מוכנים',
      edit_banner: { active_title: 'עריכת מבצע פעיל', active_subtitle: 'ניתן לערוך עוד {edit_minutes} דקות', upcoming_title: 'עריכת מבצע עתידי', upcoming_subtitle: 'מתחיל בעוד {days} ימים' },
      overlap_dialog: { title: 'המבצע חופף ל{title}{extra}', extra_more: ' (ועוד {more_count})', active_until: '{title} פעיל עד {end_date}',
        start_after_title: 'להתחיל אחרי {title}', start_after_ok: 'המבצע החדש יפעל {after_start}–{after_end}', start_after_blocked: 'לא ניתן — {after_end} חורג מתאריך סיום המנוי',
        cancel_title: 'לבטל את {title}', cancel_subtitle: '{title} יבוטל', trim_title: 'לקצר את {title}', trim_subtitle: '{title} יסתיים {trimmed_end}, והחדש מתחיל {new_start}' } },
    terms: { legal_disclaimer_label: 'ט.ל.ח (טעות לעולם חוזרת)', terms: [] },
    limits: { max_selected: 2, custom_max_length: 80 }
  };

  var api, A, sb, biz, esc, st = {};
  var css = '.pm{display:flex;flex-direction:column;gap:12px}.pm-src{padding:12px 14px;border-radius:14px;font-size:15px;line-height:1.5}' +
    '.pm-src.ok{background:#ECFDF5;color:#065F46}.pm-src.tr{background:#EFF6FF;color:#1E40AF}.pm-src.cx{background:#FFF7ED;color:#9A3412}.pm-src.no{background:#FEF2F2;color:#991B1B;white-space:pre-line}' +
    '.pm-src b{display:block;font-size:16px}.pm-stats{display:flex;gap:8px}.pm-stats span{flex:1;background:#F5F3FF;color:#5B21B6;border-radius:12px;padding:8px;text-align:center;font-weight:800;font-size:14px}' +
    '.pm-stats em{display:block;font-style:normal;font-size:20px}.pm-h{margin:6px 0 0;font-size:16px;font-weight:800;color:#2A3342}' +
    '.pm-card{border:1px solid #EEF1F5;border-radius:14px;overflow:hidden;background:#fff}.pm-card.old{opacity:.75}.pm-card .im{position:relative;background:#F3F4F6}' +
    '.pm-card .im img{display:block;width:100%;max-height:260px;object-fit:contain}.pm-card .im .pb{position:absolute;top:8px;right:8px;background:#F59E0B;color:#fff;font-size:12px;font-weight:800;padding:2px 8px;border-radius:999px}' +
    '.pm-card .im .pb.no{background:#DC2626}.pm-card .bd{padding:10px 12px}.pm-card b{display:block;font-size:16px;color:#2A3342}.pm-card p{margin:4px 0 0;font-size:14px;color:#566173;white-space:pre-line}' +
    '.pm-card .mt{display:flex;gap:10px;flex-wrap:wrap;margin-top:6px;font-size:13px;color:#6B7689}.pm-card .tl{margin:6px 0 0;padding:0 18px 0 0;font-size:13px;color:#566173}.pm-card .lg{font-size:11px;color:#9AA3B2;margin-top:4px}' +
    '.pm-row{display:flex;gap:8px}.pm-row .sa-b{flex:1;margin:0}.sa-b.red{color:#B91C1C;border-color:#FCA5A5}' +
    '.pm-ban{padding:10px 12px;border-radius:12px;background:#F5F3FF;color:#5B21B6}.pm-ban b{display:block}' +
    '.pm-dates{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pm-dates input{width:100%}.pm-lim{font-size:13px;color:#6B7689;font-weight:700}' +
    '.pm-terms{display:flex;flex-direction:column;gap:6px;padding:4px 0}.pm-not{border:1px solid #FCD34D;background:#FFFBEB;border-radius:12px;padding:10px 12px;font-size:14px;line-height:1.6;color:#78350F}' +
    '.pm-not b{display:block;margin-bottom:2px}.pm-img{display:flex;flex-direction:column;gap:8px}.pm-img .pv{position:relative}.pm-img .pv img{display:block;width:100%;max-height:220px;object-fit:contain;border-radius:12px;background:#F3F4F6}' +
    '.pm-img .pv button{position:absolute;top:6px;right:6px;width:30px;height:30px;border-radius:50%;border:0;background:rgba(0,0,0,.6);color:#fff;font-size:18px;cursor:pointer}' +
    '.pm-ov{display:flex;flex-direction:column;gap:8px;border:1px solid #DDD6FE;background:#FAF5FF;border-radius:14px;padding:12px}.pm-ov b.t{font-size:16px}' +
    '.pm-opt{display:block;text-align:right;width:100%;border:1px solid #DCE2EC;background:#fff;border-radius:12px;padding:10px 12px;font:inherit;cursor:pointer}.pm-opt[disabled]{opacity:.55;cursor:default}' +
    '.pm-opt b{display:block;font-size:15px;color:#2A3342}.pm-opt small{display:block;font-size:13px;color:#6B7689;margin-top:2px}.pm-empty{color:#6B7689;font-size:14px;text-align:center;padding:6px}';

  /* ── עזרים ── */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function today() { var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }
  function sod(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0); }
  function eod(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59); }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  // Dart DateTime.toIso8601String() לזמן מקומי
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + '.000'; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function fromYmd(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  // timestamp בלי אזור זמן: start/end = מקומי; created_at = UTC
  function local(s) { return s ? new Date(String(s).replace(' ', 'T').replace(/Z|[+-]\d\d:\d\d$/, '')) : null; }
  function utc(s) { return s ? new Date(String(s).replace(' ', 'T').replace(/Z|[+-]\d\d:\d\d$/, '') + 'Z') : null; }
  function dayDiff(a, b) { return Math.round((sod(b) - sod(a)) / 864e5); }
  function short(d) { var dm = pad(d.getDate()) + '.' + pad(d.getMonth() + 1); return d.getFullYear() === new Date().getFullYear() ? dm : dm + '.' + d.getFullYear(); }
  function full(d) { return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear(); }
  function tx(s, o) { s = String(s || ''); for (var k in o) s = s.split('{' + k + '}').join(o[k]); return s; }
  function F(k) { var v = st.form[k]; return v == null ? DEF.form[k] : v; }
  function G(g, k) { var o = st.form[g]; var v = o && o[k]; return v == null ? DEF.form[g][k] : v; }
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
  }

  // Promotion getters
  function isExpired(p) { return today() > sod(local(p.end_date)); }
  function isUpcoming(p) { return today() < sod(local(p.start_date)); }
  function isCurrent(p) { return p.is_active !== false && !isExpired(p) && !isUpcoming(p); }
  function editLeft(p) { var c = utc(p.created_at); if (!c) return 0; var ms = c.getTime() + EDIT_MIN * 6e4 - Date.now(); return ms <= 0 ? 0 : Math.ceil(ms / 6e4); }
  function daysUntilStart(p) { return isUpcoming(p) ? Math.floor((local(p.start_date) - new Date()) / 864e5) : 0; }

  // ActiveSubscription
  function subActiveOrPaid(s) { return s.status === 'active' || (s.status === 'trial' && s.paid_subscription_start_date && s.last_charge_date); }
  function subEnd() { var s = st.sub; return s && !subActiveOrPaid(s) && s.next_charge_date ? local(s.next_charge_date) : null; }
  function hasAccess() { return !!(st.sub || st.pkg); }

  // תנאים (PromotionTermsConfig)
  function terms() {
    var cfg = st.terms || {}, lab = String(cfg.legal_disclaimer_label || '').trim() || DEF.terms.legal_disclaimer_label;
    var list = (Array.isArray(cfg.terms) ? cfg.terms : []).filter(function (t) {
      return t && String(t.id || '').trim() && t.id !== LEGAL && String(t.label || '').trim() && String(t.text || '').trim(); })
      .map(function (t) { return { id: String(t.id).trim(), label: String(t.label).trim(), text: String(t.text).trim() }; });
    return [{ id: LEGAL, label: lab, text: TLH }].concat(list);
  }
  function lim(k) { var v = (st.limits || {})[k]; return typeof v === 'number' && v > 0 ? v : DEF.limits[k]; }
  function parseTerms(s) { return String(s || '').split(SEP).map(function (t) { return t.trim(); }).filter(function (t) { return t && t !== TLH; }); }
  function hasTlh(s) { return String(s || '').split(SEP).map(function (t) { return t.trim(); }).indexOf(TLH) >= 0; }

  function cfgVal(v) { if (typeof v === 'string') { try { return JSON.parse(v); } catch (e) { return v; } } return v; }

  /* ── טעינה ── */
  function load() {
    var now = iso(new Date()), td = ymd(today());
    return Promise.all([
      sb.from('app_config').select('key,value').in('key', ['text_promotion_form', 'text_publish_notices', 'text_promotion_terms', 'limit_promotion_terms', 'promotion_default_days']),
      sb.from('promotions').select('*').eq('provider_id', biz.id).eq('is_active', true).gte('end_date', now).order('start_date', { ascending: true }),
      sb.from('promotions').select('*').eq('provider_id', biz.id).or('is_active.eq.false,end_date.lt.' + now).order('end_date', { ascending: false }).limit(3),
      sb.from('subscriptions').select('id,status,next_charge_date,last_charge_date,paid_subscription_start_date,amount')
        .eq('entity_id', biz.id).eq('entity_type', biz._k).eq('payment_type', 'promotions_subscription')
        .or('status.eq.active,status.eq.trial,status.eq.cancelled').gte('next_charge_date', td).maybeSingle(),
      sb.from('promotion_packages').select('*').eq('provider_id', biz.id).order('created_at', { ascending: false }),
      sb.from('promotions').select('view_count').eq('provider_id', biz.id)
    ]).then(function (r) {
      for (var i = 1; i < 6; i++) if (r[i].error && i !== 3) throw r[i].error;
      var c = {}; (r[0].data || []).forEach(function (x) { c[x.key] = cfgVal(x.value); });
      st.form = c.text_promotion_form && typeof c.text_promotion_form === 'object' ? c.text_promotion_form : {};
      st.notices = c.text_publish_notices && typeof c.text_publish_notices === 'object' ? c.text_publish_notices : {};
      st.terms = c.text_promotion_terms && typeof c.text_promotion_terms === 'object' ? c.text_promotion_terms : null;
      st.limits = c.limit_promotion_terms && typeof c.limit_promotion_terms === 'object' ? c.limit_promotion_terms : {};
      st.defDays = parseInt(c.promotion_default_days, 10) || 30;
      var live = r[1].data || [];
      st.active = live.filter(isCurrent)[0] || null;
      st.upcoming = live.filter(isUpcoming)[0] || null;
      st.history = r[2].data || [];
      st.sub = r[3].data || null;
      st.pkg = st.sub ? null : (r[4].data || []).filter(function (p) { return (p.total_promotions_bought || 0) - (p.total_promotions_used || 0) > 0; })[0] || null;
      var vs = r[5].data || []; st.count = vs.length; st.views = vs.reduce(function (n, x) { return n + (x.view_count || 0); }, 0);
      // תמונות בבדיקה (A-46: השורה האחרונה לכל מבצע, pending/rejected בלבד)
      var ids = [st.active, st.upcoming].filter(Boolean).map(function (p) { return p.id; });
      st.pend = {};
      if (!ids.length) return;
      return sb.from('pending_entity_images').select('entity_id,status,image_url,created_at').eq('entity_type', 'promotion').in('entity_id', ids)
        .in('status', ['pending', 'rejected']).order('created_at', { ascending: false }).then(function (x) {
          (x.data || []).forEach(function (row) { if (!st.pend[row.entity_id]) st.pend[row.entity_id] = row; });
        }, function () {});
    });
  }

  /* ── תצוגה ── */
  function card(p, opt) {
    opt = opt || {};
    var pend = st.pend[p.id], img = pend && pend.image_url ? pend.image_url : p.image_url;
    var tl = parseTerms(p.terms_and_conditions);
    var s = local(p.start_date), e = local(p.end_date);
    return '<div class="pm-card' + (opt.old ? ' old' : '') + '">' +
      (img ? '<div class="im"><img src="' + esc(img) + '" alt="">' + (pend ? '<span class="pb' + (pend.status === 'pending' ? '' : ' no') + '">' + (pend.status === 'pending' ? 'תמונה בבדיקה' : 'התמונה לא אושרה') + '</span>' : '') + '</div>' : '') +
      '<div class="bd">' + (p.title ? '<b>' + esc(p.title) + '</b>' : '') + (p.description ? '<p>' + esc(p.description) + '</p>' : '') +
      (tl.length ? '<ul class="tl">' + tl.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' : '') +
      (hasTlh(p.terms_and_conditions) ? '<div class="lg">' + TLH + '</div>' : '') +
      '<div class="mt"><span>' + short(s) + '–' + short(e) + '</span>' + (opt.preview ? '' : '<span>' + (p.view_count || 0) + ' צפיות</span>') +
      (opt.old && p.is_active === false ? '<span>בוטל</span>' : '') + '</div></div></div>';
  }
  function srcHtml() {
    var s = st.sub;
    if (s) {
      var d = full(local(s.next_charge_date));
      if (s.status === 'trial') return '<div class="pm-src tr"><b>תקופת ניסיון פעילה</b>עד ' + d + '</div>';
      if (s.status === 'cancelled') return '<div class="pm-src cx"><b>מנוי מבוטל (פעיל עד סוף התקופה)</b>עד ' + d + '</div>';
      return '<div class="pm-src ok"><b>מנוי פעיל</b>מתחדש ' + d + '</div>';
    }
    if (st.pkg) {
      var p = st.pkg, left = (p.total_promotions_bought || 0) - (p.total_promotions_used || 0);
      return '<div class="pm-src ok"><b>חבילת מבצעים</b>נרכשו ' + (p.total_promotions_bought || 0) + ' · פורסמו ' + (p.total_promotions_used || 0) + ' · <b style="display:inline">נותרו ' + left + '</b></div>';
    }
    return '<div class="pm-src no">' + esc(F('no_access_banner')) + '</div>';
  }

  function main() {
    var acc = hasAccess(), a = st.active, u = st.upcoming;
    var h = '<h2 id="sa-h">ניהול מבצעים</h2><div class="pm">' + srcHtml() +
      '<div class="pm-stats"><span><em>' + st.count + '</em>מבצעים שפורסמו</span><span><em>' + st.views + '</em>צפיות במבצעים</span></div>';
    if (a) {
      h += '<h3 class="pm-h">מבצע פעיל</h3>' + card(a);
      if (acc && editLeft(a) > 0) h += '<button class="sa-b" type="button" data-ed="' + esc(a.id) + '">ערוך — ניתן לערוך עוד ' + editLeft(a) + ' דקות</button>';
    }
    if (u) {
      h += '<h3 class="pm-h">מבצע מתוזמן</h3>' + card(u);
      if (acc) h += '<div class="pm-row"><button class="sa-b pri" type="button" data-ed="' + esc(u.id) + '">ערוך מבצע עתידי</button>' +
        (isUpcoming(u) ? '<button class="sa-b red" type="button" data-cx="' + esc(u.id) + '">מחק</button>' : '') + '</div>';
    }
    if (acc) h += '<button class="sa-b pri" type="button" data-new>' + (a ? 'מבצע חדש (יחליף או יתוזמן אחרי הנוכחי)' : 'צור מבצע חדש') + '</button>';
    else h += '<button class="sa-b pri" type="button" data-buy>לרכישת מנוי או חבילה</button>';
    if (acc) h += '<button class="sa-b" type="button" data-buy>מנוי וחבילות</button>';
    h += '<h3 class="pm-h">היסטוריה</h3>' + (st.history.length ? st.history.map(function (p) {
      return card(p, { old: true }) + '<button class="sa-b red" type="button" data-del="' + esc(p.id) + '">מחיקה</button>'; }).join('') +
      (st.history.length === 3 ? '<p class="pm-empty">מוצגים 3 המבצעים האחרונים שפג תוקפם</p>' : '') : '<p class="pm-empty">אין מבצעים בהיסטוריה</p>');
    h += '<p class="sa-msg" hidden></p></div>';
    var d = api.dlg(h, true);
    var byId = function (id) { return [a, u].concat(st.history).filter(function (p) { return p && p.id === id; })[0]; };
    d.querySelectorAll('[data-ed]').forEach(function (b) { b.addEventListener('click', function () { form(byId(b.dataset.ed)); }); });
    var nb = d.querySelector('[data-new]'); if (nb) nb.addEventListener('click', function () { form(null); });
    d.querySelectorAll('[data-buy]').forEach(function (b) { b.addEventListener('click', buy); });
    d.querySelectorAll('[data-cx]').forEach(function (b) { b.addEventListener('click', function () { confirmBox(d, b, byId(b.dataset.cx), 'cancel'); }); });
    d.querySelectorAll('[data-del]').forEach(function (b) { b.addEventListener('click', function () { confirmBox(d, b, byId(b.dataset.del), 'delete'); }); });
  }

  // אישור מחיקה בתוך החלון (בלי confirm של הדפדפן)
  function confirmBox(d, btn, p, kind) {
    if (!p) return;
    var old = d.querySelector('.pm-ov'); if (old) old.remove();
    var text = kind === 'cancel'
      ? "למחוק את '" + (p.title || 'המבצע') + "' (" + short(local(p.start_date)) + '–' + short(local(p.end_date)) + ')? המבצע עוד לא התחיל ולא פורסם.'
      : 'האם למחוק את המבצע "' + (p.title || '') + '"?\n\nפעולה זו אינה הפיכה.';
    var box = document.createElement('div'); box.className = 'pm-ov';
    box.innerHTML = '<b class="t">מחיקת מבצע</b><p style="margin:0;white-space:pre-line">' + esc(text) + '</p><div class="pm-row"><button class="sa-b" type="button" data-no>ביטול</button><button class="sa-b red" type="button" data-yes>מחק</button></div>';
    btn.insertAdjacentElement('afterend', box);
    box.querySelector('[data-no]').addEventListener('click', function () { box.remove(); });
    box.querySelector('[data-yes]').addEventListener('click', function () {
      var y = box.querySelector('[data-yes]'); y.disabled = true; y.textContent = 'מוחקים…';
      var job = kind === 'cancel'
        ? sb.from('promotions').update({ is_active: false }).eq('id', p.id).select('id').then(function (r) { if (r.error || !r.data || !r.data.length) throw r.error || new Error('none'); })
        : sb.functions.invoke('delete-entity', { body: { entityType: 'promotion', entityId: p.id } }).then(function (r) { if (r.error || !r.data || r.data.success !== true) throw r.error || new Error('fail'); });
      job.then(function () { A.toast(kind === 'cancel' ? 'המבצע נמחק' : 'המבצע נמחק בהצלחה'); return refresh(); })
        .catch(function () { y.disabled = false; y.textContent = 'מחק'; api.msg(d, 'שגיאה במחיקת המבצע. נסה שוב, ואם הבעיה חוזרת פנה לתמיכה.'); });
    });
  }

  function refresh() { return load().then(main, function () { A.toast('שגיאה בטעינת המבצעים'); }).then(function () { if (api.onChange) api.onChange(); }); }

  /* ── טופס מבצע (AddPromotionScreen) ── */
  function form(edit) {
    var editing = !!edit, id = editing ? edit.id : uuid();
    var maxDays = editing ? (edit.subscription_id ? MAX_SUB : MAX_PKG) : (st.sub ? MAX_SUB : MAX_PKG);
    var sEnd = subEnd(), t0 = today();
    var start, end, imgUrl = editing ? edit.image_url : null, file = null, blobUrl = null;
    // סדר כמו Set באפליקציה: ט.ל.ח מסומן תמיד בפתיחה (גם בעריכה), ואחריו לפי סדר ההוספה
    var sel = [LEGAL], custom = '', withTerms = true;
    var has = function (k) { return sel.indexOf(k) >= 0; };
    if (editing) {
      start = sod(local(edit.start_date)); end = eod(local(edit.end_date));
      var tt = edit.terms_and_conditions;
      if (tt && tt.trim()) {
        var unmatched = [], all = terms();
        String(tt).split(SEP).map(function (x) { return x.trim(); }).filter(function (x) { return x && x !== TLH; }).forEach(function (part) {
          var m = all.filter(function (t) { return t.text === part; })[0]; if (m) { if (!has(m.id)) sel.push(m.id); } else unmatched.push(part); });
        custom = unmatched.join(', ');
      }
    } else {
      start = t0;
      var defD = Math.min(st.defDays, maxDays) - 1, e0 = addDays(t0, defD);
      if (sEnd && e0 > sEnd) e0 = sEnd;
      end = eod(e0);
    }
    var minStart = editing && sod(local(edit.start_date)) < t0 ? sod(local(edit.start_date)) : t0;
    var maxStart = sEnd ? sod(sEnd) : addDays(minStart, 60);
    function maxEnd() { var dl = addDays(start, maxDays - 1); return sEnd && sEnd < dl ? sod(sEnd) : dl; }
    function limitText() {
      if (sEnd && dayDiff(t0, sEnd) < maxDays) return 'עד ' + full(sEnd) + ' (סיום המנוי)';
      return 'מקסימום ' + maxDays + ' ימים';
    }

    var noticeKey = editing ? 'promotion_edit_upcoming' : 'promotion_new', notice = st.notices[noticeKey] || {};
    var viaSub = !editing && !!st.sub;
    var lines = (Array.isArray(notice.lines) ? notice.lines : []).filter(function (l) { return l && l.text && (l.only !== 'subscription' || viaSub); })
      .map(function (l) { return tx(l.text, { edit_minutes: EDIT_MIN, max_days: maxDays }); });

    var banner = '';
    if (editing) {
      banner = !isUpcoming(edit)
        ? '<div class="pm-ban"><b>' + esc(G('edit_banner', 'active_title')) + '</b>' + esc(tx(G('edit_banner', 'active_subtitle'), { edit_minutes: editLeft(edit) })) + '</div>'
        : '<div class="pm-ban"><b>' + esc(G('edit_banner', 'upcoming_title')) + '</b>' + esc(tx(G('edit_banner', 'upcoming_subtitle'), { days: daysUntilStart(edit) })) + '</div>';
    }
    var maxSel = lim('max_selected'), cml = lim('custom_max_length');
    var d = api.dlg('<h2 id="sa-h">' + (editing ? 'עריכת מבצע' : 'פרסום מבצע חדש') + '</h2><form class="sa-f pm" novalidate id="pm-f">' + banner +
      '<div><div class="pm-lim" style="margin-bottom:4px">מקור פרסום</div>' + srcHtml() + '</div>' +
      '<div class="mb-field"><label for="pm-t">כותרת המבצע</label><input id="pm-t" maxlength="120" value="' + esc(editing ? edit.title || '' : '') + '"></div>' +
      '<div class="mb-field"><label for="pm-d">תיאור</label><textarea id="pm-d" rows="3">' + esc(editing ? edit.description || '' : '') + '</textarea></div>' +
      '<div class="mb-field"><label>תמונה</label><div class="pm-img"><div class="pv" id="pm-pv"></div><input type="file" id="pm-file" accept="image/*" hidden>' +
      '<button class="mb-btn ghost" type="button" id="pm-pick"></button><p class="mb-note">פלייר או תמונה של המבצע. בלי תמונה — חובה כותרת ותיאור.</p></div></div>' +
      '<div class="mb-field"><label style="display:flex;justify-content:space-between">תאריכים <span class="pm-lim" id="pm-lim"></span></label>' +
      '<div class="pm-dates"><label class="mb-note">תאריך התחלה<input type="date" id="pm-s"></label><label class="mb-note">תאריך סיום<input type="date" id="pm-e"></label></div>' +
      '<p class="mb-note" id="pm-dur"></p></div>' +
      '<div class="mb-field"><label class="mb-chk"><input type="checkbox" id="pm-ht"' + (withTerms ? ' checked' : '') + '> הוסף תנאים והגבלות</label>' +
      '<p class="mb-note">אם תוכן המבצע כבר כולל תנאים בתמונה — אין צורך</p><div class="pm-terms" id="pm-terms"></div></div>' +
      (lines.length ? '<div class="pm-not"><b>' + esc(notice.title || 'לפני הפרסום') + '</b>' + lines.map(function (l) { return '• ' + esc(l); }).join('<br>') + '</div>' : '') +
      '<div id="pm-prev"></div><div id="pm-ovw"></div>' +
      '<p class="sa-msg" hidden></p>' +
      '<div class="pm-row"><button class="sa-b" type="button" id="pm-pre">תצוגה מקדימה</button><button class="sa-b pri" type="submit">' + (editing ? 'עדכן מבצע' : 'פרסם מבצע') + '</button></div>' +
      '<button class="hr-lnk" type="button" id="pm-back">← חזרה לניהול מבצעים</button></form>', true);

    var $ = function (s) { return d.querySelector(s); };
    var si = $('#pm-s'), ei = $('#pm-e');
    function drawDates() {
      si.min = ymd(minStart); si.max = ymd(maxStart); si.value = ymd(start);
      ei.min = ymd(start); ei.max = ymd(maxEnd()); ei.value = ymd(end);
      $('#pm-lim').textContent = limitText();
      $('#pm-dur').textContent = 'משך המבצע: ' + (dayDiff(start, end) + 1) + ' ימים';
    }
    si.addEventListener('change', function () {
      if (!si.value) return drawDates();
      var v = fromYmd(si.value); if (v < minStart) v = minStart; if (v > maxStart) v = maxStart;
      start = v; var me = maxEnd();
      if (end > eod(me)) end = eod(me);
      if (end < start) end = eod(addDays(start, Math.max(0, Math.min(maxDays - 1, dayDiff(start, me)))));
      drawDates();
    });
    ei.addEventListener('change', function () {
      if (!ei.value) return drawDates();
      var v = fromYmd(ei.value), me = maxEnd(); if (v < start) v = start; if (v > me) v = me;
      end = eod(v); drawDates();
    });
    drawDates();

    function drawImg() {
      var src = blobUrl || imgUrl;
      $('#pm-pv').innerHTML = src ? '<img src="' + esc(src) + '" alt=""><button type="button" aria-label="הסרת תמונה">×</button>' : '';
      if (src) $('#pm-pv button').addEventListener('click', function () { file = null; if (blobUrl) URL.revokeObjectURL(blobUrl); blobUrl = null; imgUrl = null; drawImg(); });
      $('#pm-pick').textContent = src ? 'החלף תמונה' : 'בחר תמונה';
    }
    $('#pm-pick').addEventListener('click', function () { $('#pm-file').click(); });
    $('#pm-file').addEventListener('change', function () {
      var f = $('#pm-file').files[0]; if (!f) return;
      if (!/^image\//.test(f.type)) return api.msg(d, 'נא לבחור קובץ תמונה');
      file = f; if (blobUrl) URL.revokeObjectURL(blobUrl); blobUrl = URL.createObjectURL(f); drawImg(); $('#pm-file').value = '';
    });
    drawImg();

    function drawTerms() {
      var w = $('#pm-terms'), on = $('#pm-ht').checked;
      if (!on) { w.innerHTML = ''; return; }
      w.innerHTML = '<span class="mb-note">' + esc(tx(F('max_selected_terms'), { max_selected: maxSel })) + ':</span>' +
        terms().map(function (t) { return '<label class="mb-chk"><input type="checkbox" data-term="' + esc(t.id) + '"' + (has(t.id) ? ' checked' : '') + '> ' + esc(t.label) + '</label>'; }).join('') +
        '<div class="mb-field"><label for="pm-ct">תנאי נוסף (אופציונלי)</label><input id="pm-ct" maxlength="' + cml + '" placeholder="לדוגמה: מינימום הזמנה ₪50" value="' + esc(custom) + '"></div>';
      w.querySelectorAll('[data-term]').forEach(function (c) { c.addEventListener('change', function () {
        var tid = c.dataset.term;
        if (c.checked) {
          var count = sel.filter(function (k) { return k !== LEGAL; }).length;
          if (tid !== LEGAL && count >= maxSel) { c.checked = false; A.toast(tx(F('max_selected_terms_hint'), { max_selected: maxSel })); return; }
          if (!has(tid)) sel.push(tid);
        } else sel = sel.filter(function (k) { return k !== tid; });
      }); });
      $('#pm-ct').addEventListener('input', function () { custom = $('#pm-ct').value; });
    }
    $('#pm-ht').addEventListener('change', function () { withTerms = $('#pm-ht').checked; if (!withTerms) { sel = []; custom = ''; } drawTerms(); });
    drawTerms();

    function termsString() {
      if (!withTerms) return null;
      var parts = [];
      var all = terms();
      sel.forEach(function (k) { var t = all.filter(function (x) { return x.id === k; })[0]; if (t) parts.push(t.text); });
      var c = String(custom || '').trim(); if (c) parts.push(c);
      return parts.length ? parts.join(SEP) : null;
    }
    function current() {
      return { id: id, title: $('#pm-t').value.trim(), description: $('#pm-d').value.trim() || null,
        image_url: blobUrl || imgUrl, terms_and_conditions: termsString(), start_date: iso(start), end_date: iso(end), view_count: 0 };
    }
    $('#pm-pre').addEventListener('click', function () {
      var p = current(); if (!p.title) p.title = 'כותרת המבצע';
      $('#pm-prev').innerHTML = '<div class="pm-lim" style="margin-bottom:4px">תצוגה מקדימה</div>' + card(p, { preview: true });
      $('#pm-prev').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    $('#pm-back').addEventListener('click', function () { if (blobUrl) URL.revokeObjectURL(blobUrl); main(); });

    var btn = d.querySelector('[type=submit]');
    function fail(t) { btn.disabled = false; btn.textContent = editing ? 'עדכן מבצע' : 'פרסם מבצע'; api.msg(d, t); }

    d.querySelector('#pm-f').addEventListener('submit', function (ev) {
      ev.preventDefault(); api.msg(d, '');
      var title = $('#pm-t').value.trim(), desc = $('#pm-d').value.trim(), hadNew = !!file, hasImg = !!(file || imgUrl);
      if (!hasImg && (!title || !desc)) return api.msg(d, F('no_image_requires_title_desc'));
      if (!hasAccess()) return api.msg(d, F('no_access'));
      var dur = dayDiff(start, end) + 1;
      if (dur > maxDays) return api.msg(d, tx(F('duration_exceeds_max'), { max_days: maxDays }));
      if (sEnd && end > eod(sEnd)) return api.msg(d, tx(F('exceeds_subscription_end'), { end_date: full(sEnd) }));
      btn.disabled = true; btn.textContent = 'שומרים…';
      var uploaded = null;
      var imgP = file ? uploadImg(file, id).then(function (u) { uploaded = u; return u; }) : Promise.resolve(imgUrl || null);
      imgP.then(function (imageUrl) {
        var pkgId = null, subId = null;
        if (editing) { pkgId = edit.package_id || null; subId = edit.subscription_id || null; }
        else if (st.sub) subId = st.sub.id;
        else pkgId = st.pkg.id;
        var promo = { id: id, package_id: pkgId, subscription_id: subId, provider_id: biz.id, community_id: biz.community_id,
          title: title, description: desc || null, image_url: imageUrl, content: editing ? edit.content || null : null,
          terms_and_conditions: termsString(), start_date: iso(start), end_date: iso(end), is_active: true, provider_name: biz.name };
        if (editing) promo.created_at = edit.created_at; else promo.created_at = new Date().toISOString();
        return saveWithOverlap(d, promo).then(function (saved) {
          if (!saved) { cleanup(uploaded, editing); return fail(''); }
          var after = (!editing && st.pkg && !st.sub)
            ? sb.from('promotion_packages').update({ total_promotions_used: (st.pkg.total_promotions_used || 0) + 1, updated_at: iso(new Date()) }).eq('id', st.pkg.id).then(function () {}, function () {})
            : Promise.resolve();
          return after.then(function () {
            return hadNew ? sb.from('pending_entity_images').select('status').eq('entity_type', 'promotion').eq('entity_id', id).eq('status', 'pending').maybeSingle().then(function (r) { return r.data; }, function () { return null; }) : null;
          }).then(function (pend) {
            if (blobUrl) URL.revokeObjectURL(blobUrl);
            A.toast(pend ? (editing ? 'התמונה החדשה נשלחה לבדיקת מנהל. עד האישור תופיע התמונה הקודמת.' : 'התמונה נשלחה לבדיקת מנהל ותוצג לאחר אישור.')
              : (editing ? 'המבצע עודכן בהצלחה' : 'המבצע נוצר בהצלחה'));
            return refresh();
          });
        });
      }).catch(function (e) {
        cleanup(uploaded, editing);
        if (e && e.code === 'P0423') return fail('אפשר לערוך מבצע רק ב-' + EDIT_MIN + ' הדקות הראשונות מפרסומו');
        if (e && e.message === 'img') return fail('שגיאה בהעלאת התמונה. נסה שוב.');
        if (e && e.message === 'overlap_nodetails') return fail('המבצע חופף למבצע קיים. שנה את התאריכים ונסה שוב.');
        fail(navigator.onLine === false ? 'אין חיבור לאינטרנט. המבצע לא נשמר — נסה שוב.' : 'שגיאה בשמירת המבצע. נסה שוב, ואם הבעיה חוזרת פנה לתמיכה.');
      });
    });

    // שמירה עם 'none'; חפיפה (P0409) → בחירה בתוך הטופס → שמירה חוזרת
    function saveWithOverlap(d, promo) {
      return rpc(promo, 'none').catch(function (e) {
        if (!e || e.code !== 'P0409') throw e;
        var list = []; try { list = JSON.parse(e.details || '[]'); } catch (x) { list = []; }
        if (!Array.isArray(list) || !list.length) throw new Error('overlap_nodetails');
        return askOverlap(d, list, promo).then(function (res) { return res ? rpc(promo, res) : null; });
      });
    }
    function askOverlap(d, list, promo) {
      return new Promise(function (resolve) {
        var ov = list.map(function (o) { return { title: o.title, s: local(o.start_date), e: local(o.end_date) }; });
        var latest = ov.reduce(function (a, b) { return b.e > a.e ? b : a; });
        var title = "'" + (latest.title || '') + "'", extra = ov.length > 1 ? tx(G('overlap_dialog', 'extra_more'), { more_count: ov.length - 1 }) : '';
        var ps = local(promo.start_date), pe = local(promo.end_date);
        var cancels = ov.every(function (o) { return o.s >= ps; });
        var trimmedEnd = new Date(ps.getTime() - 1000);
        var len = pe - ps, aS = new Date(latest.e.getTime() + 1000), aE = new Date(aS.getTime() + len);
        var blocked = sEnd && aE > eod(sEnd);
        var w = d.querySelector('#pm-ovw');
        w.innerHTML = '<div class="pm-ov"><b class="t">' + esc(tx(G('overlap_dialog', 'title'), { title: title, extra: extra })) + '</b>' +
          '<span class="mb-note">' + esc(tx(G('overlap_dialog', 'active_until'), { title: title, end_date: short(latest.e) })) + '</span>' +
          '<button class="pm-opt" type="button" data-r="start_after"' + (blocked ? ' disabled' : '') + '><b>' + esc(tx(G('overlap_dialog', 'start_after_title'), { title: title })) + '</b><small>' +
          esc(blocked ? tx(G('overlap_dialog', 'start_after_blocked'), { after_end: short(aE) }) : tx(G('overlap_dialog', 'start_after_ok'), { after_start: short(aS), after_end: short(aE) })) + '</small></button>' +
          '<button class="pm-opt" type="button" data-r="trim_existing"><b>' + esc(cancels ? tx(G('overlap_dialog', 'cancel_title'), { title: title }) : tx(G('overlap_dialog', 'trim_title'), { title: title })) + '</b><small>' +
          esc(cancels ? tx(G('overlap_dialog', 'cancel_subtitle'), { title: title }) : tx(G('overlap_dialog', 'trim_subtitle'), { title: title, trimmed_end: short(trimmedEnd), new_start: short(ps) })) + '</small></button>' +
          '<button class="sa-b" type="button" data-r="">ביטול</button></div>';
        w.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        w.querySelectorAll('[data-r]').forEach(function (b) { b.addEventListener('click', function () { var r = b.dataset.r || null; w.innerHTML = ''; resolve(r); }); });
      });
    }
  }

  // מסך מנוי וחבילות (manage-buy.js) — כמו PurchasePromotionPackageScreen
  var BUY_JS = '/js/manage-buy.js?v=1', buyP = null;
  function buy() {
    buyP = buyP || new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = BUY_JS; s.onload = function () { res(window.ShchunaBuy); };
      s.onerror = function () { buyP = null; rej(new Error('load')); }; document.head.appendChild(s);
    });
    buyP.then(function (B) {
      B({ A: A, sb: sb, biz: biz, user: api.user, kind: api.kind || biz._k, table: api.table, esc: esc, dlg: api.dlg, msg: api.msg,
        back: function () { refresh(); }, onChange: api.onChange });
    }).catch(function () { A.toast('הטעינה נכשלה. נסו שוב'); });
  }

  function rpc(promo, res) {
    return sb.rpc('save_promotion', { p_promotion: promo, p_resolution: res }).then(function (r) {
      if (r.error) throw r.error;
      var row = Array.isArray(r.data) ? r.data[0] : r.data;
      if (!row) throw new Error('empty');
      return row;
    });
  }

  // כמו ImageHelper.uploadImageToStorage(EntityType.promotion, uniquePath: true) — בחירה ב-1200px, איכות 85
  function uploadImg(f, id) {
    var bucket = sb.storage.from('images'), path = 'promotions/general/' + id + '_' + Date.now() + '.jpg';
    return api.toJpeg(f, 1200).then(function (blob) {
      return bucket.upload(path, blob, { contentType: 'image/jpeg', upsert: false });
    }).then(function (r) {
      if (r.error) throw new Error('img');
      return bucket.getPublicUrl(path).data.publicUrl + '?v=' + Date.now();
    }, function (e) { if (e && e.message === 'img') throw e; throw new Error('img'); });
  }
  // מבצע חדש שלא נשמר — לא להשאיר קובץ יתום (כמו deleteByPublicUrl; אם אין הרשאה — שקט)
  function cleanup(url, editing) {
    if (!url || editing) return;
    var m = /\/object\/public\/images\/([^?]+)/.exec(url);
    if (m) sb.storage.from('images').remove([decodeURIComponent(m[1])]).then(function () {}, function () {});
  }

  window.ShchunaPromos = function (o) {
    api = o; A = o.A; sb = o.sb; biz = o.biz; esc = o.esc;
    if (!document.getElementById('pm-css')) { var s = document.createElement('style'); s.id = 'pm-css'; s.textContent = css; document.head.appendChild(s); }
    st = { pend: {}, history: [], form: {}, notices: {} };
    api.dlg('<h2 id="sa-h">ניהול מבצעים</h2><p>טוען…</p>', true);
    return load().then(main, function () {
      var d = api.dlg('<h2 id="sa-h">ניהול מבצעים</h2><p>לא הצלחנו לטעון את המבצעים.</p><button class="sa-b pri" type="button" data-r>נסו שוב</button>', true);
      d.querySelector('[data-r]').addEventListener('click', function () { window.ShchunaPromos(o); });
    });
  };
})();
