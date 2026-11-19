/* שכונה — מסך "מנוי וחבילות מבצעים" במסך ניהול העסק באתר. נטען לפי דרישה מ-manage-promos.js.
 * זהה ל-PurchasePromotionPackageScreen באפליקציה:
 *  - 5 מצבים: ניסיון פעיל (>7 ימים), ניסיון מסתיים (≤7), אין רכישה, מנוי פעיל (כולל מבוטל בתוקף), חבילה פעילה.
 *  - מחירים מ-pricing_plans (pricing_plan_id של העסק), חבילות וטקסטים מ-app_config (text_promotion_packages,
 *    text_trial_purchase, text_publish_notices, limit_promotions, vat_enabled/vat_rate, features_monetization).
 *  - ביטול חידוש: cancel-subscription. חידוש: renew-subscription (בתוקף → הפעלה מחדש; אחרת חיוב או דף סליקה).
 *  - לפני רכישה ראשונה: פרטים לקבלה (business_registration_type + tax_id בטבלת הישות, כמו BusinessRegistrationSheet).
 *  - סיכום הזמנה ותשלום (PaymentSummarySheet): create-payment במצב web → דף הסליקה → payment-success-web.html.
 *  - ביטול רכישה בתקופת ניסיון (החזר) — באפליקציה.
 */
(function () {
  'use strict';
  var api, A, sb, biz, esc, kind, table, st = {};
  var TERMS_URL = 'https://shchuna.co.il/terms.html';
  var REG = [
    ['individual', 'יחיד', ''], ['exempt', 'עוסק פטור', ''], ['licensed', 'עוסק מורשה', 'מספר עוסק מורשה'],
    ['company', 'חברה בע"מ', 'ח.פ. (חברה פרטית)'], ['nonprofit', 'עמותה / מלכ"ר', 'מספר עמותה']
  ];
  // ברירות מחדל — כמו RemoteConfig.defaults באפליקציה
  var DEF_PKGS = {
    subscriptions: [{ id: 'monthly', pricing_key: 'promo_monthly', name: 'מנוי חודשי', package_type: 'monthly', popular: true,
      description: 'מבצע אחד פעיל בכל זמן נתון, פרסום עד 30 יום', features: ['✓ מבצע אחד פעיל', '✓ פרסום עד 30 יום לכל מבצע', '✓ חידוש אוטומטי'] }],
    quantity: [
      { id: 'promo_single', pricing_key: 'promo_single', name: 'מבצע בודד', promotions_count: 1, max_duration_days: 7, purchase_validity_days: 30, features: ['✓ מבצע אחד', '✓ פרסום עד 7 ימים', '✓ תוקף לרכישה: 30 יום'] },
      { id: 'promo_bundle4', pricing_key: 'promo_bundle4', name: '4 מבצעים', badge: '💎 משתלם', promotions_count: 4, max_duration_days: 7, purchase_validity_days: 60, features: ['✓ 4 מבצעים', '✓ כל מבצע עד 7 ימים', '✓ תוקף לרכישה: 60 יום'] }],
    subscription_rules: ['חיוב חודשי אוטומטי', 'ביטול בכל עת - השירות ימשיך עד סוף התקופה', 'לא ניתן לצבור מבצעים'],
    quantity_rules: ['יש להשתמש תוך {validity_days} יום מהרכישה', 'רק מבצע אחד פעיל בכל זמן נתון', 'לא ניתן לרכוש מנוי עד שימוש בכל המבצעים']
  };
  var DEF_TRIAL = {
    free_line: { promotions_subscription: { emoji: '✓', bold: 'ימי הניסיון לא הולכים לאיבוד.', rest: ' המבצעים חינם עד {last_free_day}, כולל.' } },
    charge_line: { emoji: '💳', bold: 'היום יחויבו {price}', rest: ' עבור החודש הראשון בתשלום, שמתחיל ב-{first_paid_day}.' },
    recurring_line: { emoji: '🔄', bold: 'מ-{first_recurring} החיוב מתחדש אוטומטית כל חודש.', rest: ' אפשר לבטל בכל רגע.' }
  };
  var css = '.by{display:flex;flex-direction:column;gap:12px}.by-hero{border-radius:14px;padding:14px 16px;border-right:4px solid}' +
    '.by-hero.ok{background:#ECFDF5;border-color:#10B981;color:#065F46}.by-hero.warn{background:#FFF7ED;border-color:#F97316;color:#9A3412}' +
    '.by-hero .pill{display:inline-block;font-size:12px;font-weight:800;padding:2px 10px;border-radius:999px;background:rgba(255,255,255,.75)}' +
    '.by-hero .lb{display:block;font-size:13px;margin-top:8px;opacity:.85}.by-hero .big{display:block;font-size:22px;font-weight:800;margin:2px 0 8px}' +
    '.by-hero hr{border:0;border-top:1px solid currentColor;opacity:.2;margin:8px 0}.by-hero .row{font-size:14px}' +
    '.by-box{border:1px solid #EEF1F5;border-radius:14px;padding:12px 14px;background:#fff}.by-box b{display:block;font-size:16px;color:#2A3342}' +
    '.by-box.org{border-color:#FED7AA}.by-box.blu{border-color:#BFDBFE}.by-bar{height:8px;border-radius:99px;background:#DBEAFE;overflow:hidden;margin:8px 0}' +
    '.by-bar i{display:block;height:100%;background:#2563EB}.by-note{background:#F3F4F6;border-radius:12px;padding:10px 12px;font-size:14px;color:#4B5563}' +
    '.by-block{background:#FEF2F2;color:#991B1B;border-radius:12px;padding:8px 12px;font-size:13px;font-weight:700}' +
    '.by-sec{display:flex;flex-direction:column;gap:10px}.by-sec.off{opacity:.5;pointer-events:none}.by-sh b{display:block;font-size:17px;color:#2A3342}.by-sh span{font-size:13px;color:#6B7689}' +
    '.by-pk{display:block;width:100%;text-align:right;border:2px solid #E5E7EB;border-radius:14px;background:#fff;padding:12px 14px;font:inherit;cursor:pointer}' +
    '.by-pk.on.g{border-color:#16A34A;background:#F0FDF4}.by-pk.on.o{border-color:#F97316;background:#FFF7ED}' +
    '.by-pk .hd{display:flex;align-items:center;gap:8px}.by-pk .nm{font-weight:800;font-size:16px;color:#2A3342}.by-pk .bg{font-size:11px;font-weight:800;background:#FEF3C7;color:#92400E;border-radius:999px;padding:2px 8px}' +
    '.by-pk .pr{margin-inline-start:auto;font-weight:800;font-size:18px;color:#2A3342}.by-pk .pr small{font-size:11px;color:#9CA3AF;font-weight:600}' +
    '.by-pk ul{margin:8px 0 0;padding:0;list-style:none;font-size:13px;color:#374151}.by-pk .tm{margin-top:8px;padding-top:8px;border-top:1px solid #F3F4F6;font-size:11px;color:#6B7280}' +
    '.by-or{text-align:center;color:#9CA3AF;font-weight:700;font-size:13px}.by-terms{display:flex;gap:8px;align-items:flex-start;font-size:14px}' +
    '.by-buy{position:sticky;bottom:-1px;background:#fff;border-top:1px solid #EEF1F5;padding:10px 0 2px;display:flex;flex-direction:column;gap:6px}' +
    '.by-buy .sum{font-size:14px;font-weight:700;color:#2A3342;text-align:center}.by-fl{font-size:13px;color:#92400E;line-height:1.5}' +
    '.sa-b.grn{background:#16A34A;border-color:#16A34A;color:#fff}.sa-b.orn{background:#F97316;border-color:#F97316;color:#fff}.sa-b.red{color:#B91C1C;border-color:#FCA5A5}' +
    '.by-sum b,.by-note b{display:block}.by-sum>.mb-note{display:block;margin-bottom:6px}.by-sum{border:1px solid #EEF1F5;border-radius:14px;padding:12px 14px}.by-sum .r{display:flex;justify-content:space-between;font-size:14px;padding:2px 0}.by-sum .t{font-size:22px;font-weight:800}';

  /* ── עזרים ── */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function sod(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function today() { return sod(new Date()); }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function day(s) { if (!s) return null; var p = String(s).slice(0, 10).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, d.getDate()); }  // DateTimeHelper.addCalendarMonths
  function daysUntil(d) { return Math.round((sod(d) - today()) / 864e5); }
  function short(d) { var b = d.getDate() + '.' + (d.getMonth() + 1); return d.getFullYear() === new Date().getFullYear() ? b : b + '.' + (d.getFullYear() % 100); }
  function fmt(v) { return v === Math.floor(v) ? String(v) : v.toFixed(2); }
  function tx(s, o) { s = String(s || ''); for (var k in o) s = s.split('{' + k + '}').join(o[k]); return s; }
  function validUntil(next) { return next ? 'בתוקף עד ' + short(addDays(next, -1)) + ', כולל' : 'בתוקף עד סוף התקופה'; }
  function cfgVal(v) { if (typeof v === 'string') { try { return JSON.parse(v); } catch (e) { return v; } } return v; }
  function list(v, d) { return Array.isArray(v) && v.length ? v : d; }

  /* ── טעינה ── */
  function load() {
    var td = ymd(today());
    return Promise.all([
      sb.from('app_config').select('key,value').in('key', ['text_promotion_packages', 'text_trial_purchase', 'text_publish_notices', 'limit_promotions', 'vat_enabled', 'vat_rate', 'features_monetization']),
      sb.from(table).select('name,pricing_plan_id,business_registration_type,tax_id').eq('id', biz.id).maybeSingle(),
      sb.from('subscriptions').select('id,status,cancelled_at,next_charge_date,paid_subscription_start_date,last_charge_date,amount')
        .eq('entity_id', biz.id).eq('entity_type', kind).eq('payment_type', 'promotions_subscription')
        .or('status.eq.active,status.eq.trial,status.eq.cancelled').gte('next_charge_date', td).maybeSingle(),
      sb.from('promotion_packages').select('total_promotions_bought,total_promotions_used').eq('provider_id', biz.id)
    ]).then(function (r) {
      if (r[1].error || !r[1].data) throw r[1].error || new Error('entity');
      var c = {}; (r[0].data || []).forEach(function (x) { c[x.key] = cfgVal(x.value); });
      var pk = c.text_promotion_packages && typeof c.text_promotion_packages === 'object' ? c.text_promotion_packages : {};
      st.subs = list(pk.subscriptions, DEF_PKGS.subscriptions).filter(function (p) { return p && p.id && p.pricing_key && p.name; });
      st.qty = list(pk.quantity, DEF_PKGS.quantity).filter(function (p) { return p && p.id && p.pricing_key && p.name && p.promotions_count > 0; });
      st.subRules = Array.isArray(pk.subscription_rules) ? pk.subscription_rules : DEF_PKGS.subscription_rules;
      st.qtyRules = Array.isArray(pk.quantity_rules) ? pk.quantity_rules : DEF_PKGS.quantity_rules;
      st.trialTx = c.text_trial_purchase && typeof c.text_trial_purchase === 'object' ? c.text_trial_purchase : {};
      var lp = c.limit_promotions || {}; st.maxSubDays = lp.max_subscription_duration_days > 0 ? lp.max_subscription_duration_days : 30;
      var nt = c.text_publish_notices || {}; st.trialSub = tx(nt.trial_card_subtitle || 'מבצע אחד פעיל בכל זמן נתון, פרסום עד {max_days} יום', { max_days: st.maxSubDays });
      st.vat = (c.vat_enabled === true || c.vat_enabled === 'true') ? (parseFloat(c.vat_rate) || 0) : 0;
      var fm = c.features_monetization; st.enabled = !(fm && typeof fm === 'object' && fm.promotions === false);
      st.ent = r[1].data;
      var sub = st.sub = r[2].data || null;
      var pkgs = r[3].data || [];
      st.bought = 0; st.used = 0; st.left = 0;
      pkgs.forEach(function (p) { var rem = (p.total_promotions_bought || 0) - (p.total_promotions_used || 0); if (rem > 0) { st.left += rem; st.bought += p.total_promotions_bought || 0; st.used += p.total_promotions_used || 0; } });
      st.cancelled = !!(sub && (sub.cancelled_at || sub.status === 'cancelled'));
      st.end = sub ? day(sub.next_charge_date) : null;
      st.paidStart = sub && sub.status === 'trial' ? day(sub.paid_subscription_start_date) : null;
      st.paidTrial = !!(sub && sub.status === 'trial' && sub.paid_subscription_start_date && sub.last_charge_date);
      st.state = state();
      return sb.from('pricing_plans').select('*').eq('id', st.ent.pricing_plan_id).maybeSingle();
    }).then(function (r) {
      var pp = r.data || {};
      st.monthlyCat = pp.promo_monthly != null ? +pp.promo_monthly : null;
      st.subAmt = st.sub && st.sub.amount != null ? +st.sub.amount : null;
      st.subs.forEach(function (p) { p.price = pp[p.pricing_key] != null ? +pp[p.pricing_key] : null; });
      st.qty.forEach(function (p) { p.price = pp[p.pricing_key] != null ? +pp[p.pricing_key] : null; });
      st.selSub = st.subs.filter(function (p) { return p.popular; })[0] || st.subs[0] || null;
      st.selQty = st.qty.filter(function (p) { return p.badge; })[0] || st.qty[0] || null;
      st.isSub = true; st.terms = false;
    });
  }
  // _determineState
  function state() {
    var s = st.sub;
    if (s && s.status === 'trial') {
      st.trialLeft = daysUntil(addDays(day(s.next_charge_date), -1));
      if (st.trialLeft > 7) return 'trial';
      if (st.trialLeft > 0) return 'trialEnd';
    }
    if (s && (s.status === 'active' || (s.status === 'cancelled' && s.next_charge_date && day(s.next_charge_date) > today()))) return 'sub';
    if (st.left > 0) return 'pkg';
    return 'none';
  }
  function net() { var p = st.isSub ? st.selSub : st.selQty; return p && p.price ? p.price : 0; }

  /* ── תצוגה ── */
  function trialCard() {
    var paid = st.paidTrial;
    return '<div class="by-hero ok"><span class="pill">' + (paid ? '✓ מנוי פעיל' : 'מתנת הצטרפות') + '</span>' +
      '<span class="lb">' + esc(paid ? 'מנוי חודשי - מבצעים' : st.trialSub) + '</span><span class="big">' + (paid ? 'מנוי פעיל' : 'תקופת ניסיון') + '</span><hr>' +
      '<div class="row">' + (paid && st.end ? 'מתחדש: ' + short(addMonths(st.end, 1)) : 'נותרו ' + st.trialLeft + ' ימים') + '</div></div>';
  }
  function trialEndCard() {
    return '<div class="by-hero warn"><span class="pill">מסתיים בקרוב</span><span class="lb">מתנת הצטרפות</span>' +
      '<span class="big">נותרו ' + st.trialLeft + ' ימים</span><hr><div class="row">בחר תוכנית להמשך פרסום</div></div>';
  }
  function cancelPurchaseCard() {
    var last = st.paidStart ? addDays(st.paidStart, -1) : null, dl = last ? daysUntil(last) : 0;
    return '<div class="by-box org"><b>ביטול רכישה אפשרי</b><span class="mb-note">' +
      (last ? 'תחזור למצב ניסיון עד ' + short(last) + ', כולל' + (dl > 0 ? ' (' + dl + ' ימים)' : '') : 'תחזור למצב ניסיון') +
      '</span><p class="mb-note" style="margin:6px 0 0">ביטול הרכישה וההחזר — כרגע באפליקציה.</p><a class="sa-b" href="/app/" style="margin-top:8px">לביטול באפליקציה</a></div>';
  }
  function subCard() {
    var cx = st.cancelled, amt = st.subAmt != null ? st.subAmt : st.monthlyCat;
    return '<div class="by-hero ' + (cx ? 'warn' : 'ok') + '"><span class="pill">' + (cx ? 'ממתין לביטול' : '✓ מנוי פעיל') + '</span>' +
      '<span class="lb">מנוי חודשי - מבצעים</span>' + (amt != null ? '<span class="big">₪' + fmt(amt) + ' <small style="font-size:13px;font-weight:600">/חודש</small></span>' : '<span class="big"></span>') + '<hr>' +
      '<div class="row">' + (cx ? validUntil(st.end) : 'חיוב הבא: ' + (st.end ? short(st.end) : '-')) + '</div></div>';
  }
  function pkgCard() {
    var p = st.bought > 0 ? Math.round(st.used / st.bought * 100) : 0;
    return '<div class="by-box blu"><b>חבילה פעילה</b><span class="mb-note">פורסמו ' + st.used + ' מתוך ' + st.bought + ' מבצעים</span>' +
      '<div class="by-bar"><i style="width:' + p + '%"></i></div><span class="mb-note">נותרו ' + st.left + ' מבצעים לפרסום</span></div>';
  }
  function block(m) { return '<div class="by-block">' + esc(m) + '</div>'; }
  function subSection() {
    var off = st.state === 'pkg' || st.state === 'sub';
    return '<div class="by-sec' + (off ? ' off' : '') + '"><div class="by-sh"><b>מנוי חודשי</b><span>מבצע אחד פעיל בכל זמן נתון</span></div>' +
      (st.state === 'pkg' ? block('סיים להשתמש במבצעים שנותרו לפני מעבר למנוי') : '') +
      st.subs.map(function (p) {
        var on = st.isSub && st.selSub && st.selSub.id === p.id;
        return '<button type="button" class="by-pk g' + (on ? ' on' : '') + '" data-sub="' + esc(p.id) + '"' + (off ? ' disabled' : '') + '><div class="hd"><span class="nm">' + esc(p.name) + '</span>' +
          (p.badge ? '<span class="bg">' + esc(p.badge) + '</span>' : '') + '<span class="pr">' + (p.price != null ? '₪' + fmt(p.price) : 'טוען...') + '<small>/חודש</small></span></div>' +
          '<ul>' + (p.features || []).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' +
          (st.subRules.length ? '<div class="tm">תנאים: ' + st.subRules.map(function (t) { return '• ' + esc(t); }).join(' ') + '</div>' : '') + '</button>';
      }).join('') + '</div>';
  }
  function qtySection() {
    var off = st.state === 'sub' || st.state === 'pkg';
    return '<div class="by-sec' + (off ? ' off' : '') + '"><div class="by-sh"><b>רכישת מבצעים בודדים</b><span>רכישה חד-פעמית של מבצעים</span></div>' +
      (st.state === 'sub' ? block('לא ניתן לרכוש מבצעים בודדים כאשר יש מנוי פעיל') : '') +
      (st.state === 'pkg' ? block('סיים להשתמש במבצעים שנותרו לפני רכישה חדשה') : '') +
      st.qty.map(function (p) {
        var on = !st.isSub && st.selQty && st.selQty.id === p.id;
        var rules = st.qtyRules.map(function (r) { return String(r).split('{validity_days}').join(p.purchase_validity_days); });
        return '<button type="button" class="by-pk o' + (on ? ' on' : '') + '" data-qty="' + esc(p.id) + '"' + (off ? ' disabled' : '') + '><div class="hd"><span class="nm">' + esc(p.name) + '</span>' +
          (p.badge ? '<span class="bg">' + esc(p.badge) + '</span>' : '') + '<span class="pr">' + (p.price != null ? '₪' + fmt(p.price) : 'טוען...') + '</span></div>' +
          '<ul>' + (p.features || []).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' +
          (rules.length ? '<div class="tm">תנאים: ' + rules.map(function (t) { return '• ' + esc(t); }).join(' ') + '</div>' : '') + '</button>';
      }).join('') + '</div>';
  }
  function termsBox() {
    return '<label class="by-terms"><input type="checkbox" id="by-t"' + (st.terms ? ' checked' : '') + '><span>הבנתי ואני מאשר את <a href="' + TERMS_URL + '" target="_blank" rel="noopener">תנאי השימוש המלאים</a></span></label>';
  }
  // TrialPurchaseText.lines — שלוש השורות ל"ניסיון מסתיים"
  function futureLines() {
    var first = st.end, last = first ? addDays(first, -1) : null, rec = addMonths(first || new Date(), 1);
    var o = { last_free_day: last ? short(last) : 'סיום התקופה', price: '₪' + fmt(net()), first_paid_day: first ? short(first) : 'תחילת התשלום', first_recurring: short(rec) };
    var c = st.trialTx || {};
    var L = function (raw, d) { raw = raw || {}; return (raw.emoji || d.emoji) + ' <b>' + esc(tx(raw.bold || d.bold, o)) + '</b>' + esc(tx(raw.rest || d.rest, o)); };
    return [L((c.free_line || {}).promotions_subscription, DEF_TRIAL.free_line.promotions_subscription), L(c.charge_line, DEF_TRIAL.charge_line), L(c.recurring_line, DEF_TRIAL.recurring_line)]
      .map(function (l) { return '<div class="by-fl">' + l + '</div>'; }).join('');
  }
  function buyBar() {
    var p = st.isSub ? st.selSub : st.selQty, n = net(), vat = n * st.vat / 100;
    var sum = p ? (vat > 0 ? esc(p.name) + '<br><span style="font-weight:600">מחיר: ₪' + fmt(n) + ' + מע"מ: ₪' + fmt(vat) + ' = ₪' + fmt(n + vat) + '</span>' : esc(p.name) + ' | ₪' + fmt(n)) : '';
    return '<div class="by-buy">' + (sum ? '<div class="sum">' + sum + '</div>' : '') + (st.state === 'trialEnd' ? futureLines() : '') +
      '<button class="sa-b ' + (st.isSub ? 'grn' : 'orn') + '" type="button" id="by-go"' + (st.terms ? '' : ' disabled') + '>' + (st.isSub ? 'הרשמה למנוי' : 'רכוש חבילה') + '</button></div>';
  }

  function main() {
    var s = st.state, h = '';
    if (!st.enabled) {
      // המוצר כבוי בשרת — ניהול בלבד (כמו _buildIosScreen)
      h = (s === 'trial' || s === 'trialEnd') ? trialCard() : s === 'sub' ? subCard() : s === 'pkg' ? pkgCard() : '<div class="by-note">רכישת מבצעים אינה זמינה כרגע.</div>';
    } else if (s === 'trial') {
      h = trialCard() + (st.paidTrial ? cancelPurchaseCard() : '') + '<div class="by-note">תוכניות ההמשך יוצגו כאן לקראת סיום מתנת ההצטרפות</div>';
    } else if (s === 'trialEnd') {
      h = trialEndCard() + (st.paidTrial ? cancelPurchaseCard() : '') + subSection() + '<div class="by-or">או</div>' + qtySection() + termsBox() + buyBar();
    } else if (s === 'none') {
      h = subSection() + '<div class="by-or">או</div>' + qtySection() + termsBox() + buyBar();
    } else if (s === 'sub') {
      h = subCard() + qtySection() + (st.cancelled
        ? '<div class="by-note">' + validUntil(st.end) + '</div><button class="sa-b grn" type="button" id="by-renew">חידוש מנוי</button>'
        : '<button class="sa-b red" type="button" id="by-cancel">ביטול חידוש</button>');
    } else {
      h = pkgCard() + block('רכישות נוספות חסומות עד לניצול כל המבצעים') + subSection() + '<div class="by-or">או</div>' + qtySection();
    }
    var d = api.dlg('<h2 id="sa-h">רכישת חבילת מבצעים</h2><div class="by">' + h + '<div id="by-ov"></div><p class="sa-msg" hidden></p>' +
      '<button class="hr-lnk" type="button" id="by-back">← חזרה לניהול מבצעים</button></div>', true);
    var $ = function (q) { return d.querySelector(q); };
    d.querySelectorAll('[data-sub]').forEach(function (b) { b.addEventListener('click', function () { st.isSub = true; st.selSub = st.subs.filter(function (p) { return p.id === b.dataset.sub; })[0]; keep(main); }); });
    d.querySelectorAll('[data-qty]').forEach(function (b) { b.addEventListener('click', function () { st.isSub = false; st.selQty = st.qty.filter(function (p) { return p.id === b.dataset.qty; })[0]; keep(main); }); });
    if ($('#by-t')) $('#by-t').addEventListener('change', function () { st.terms = $('#by-t').checked; var g = $('#by-go'); if (g) g.disabled = !st.terms; });
    if ($('#by-go')) $('#by-go').addEventListener('click', function () { purchase(d); });
    if ($('#by-cancel')) $('#by-cancel').addEventListener('click', function () { cancelBox(d); });
    if ($('#by-renew')) $('#by-renew').addEventListener('click', function () { renewBox(d); });
    $('#by-back').addEventListener('click', function () { api.back(); });
  }
  // רינדור מחדש בלי לקפוץ לראש החלון
  function keep(fn) { var b = document.querySelector('.sa-dlg .sa-body') || document.querySelector('.sa-dlg'); var y = b ? b.scrollTop : 0; fn(); b = document.querySelector('.sa-dlg .sa-body') || document.querySelector('.sa-dlg'); if (b) b.scrollTop = y; }

  /* ── ביטול חידוש / חידוש ── */
  function cancelBox(d) {
    var w = d.querySelector('#by-ov');
    w.innerHTML = '<div class="by-box org"><b>ביטול מנוי</b><span class="mb-note">המנוי ימשיך עד סוף התקופה הנוכחית</span>' +
      '<div class="by-note" style="margin-top:8px"><b style="font-size:14px">ביטול חידוש</b>' + validUntil(st.end) + ' — לא יחודש</div>' +
      '<p style="margin:8px 0">האם לבטל את חידוש המנוי?</p><div class="pm-row" style="display:flex;gap:8px"><button class="sa-b" type="button" data-no style="flex:1">סגור</button>' +
      '<button class="sa-b red" type="button" data-yes style="flex:1">אישור</button></div></div>';
    w.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    w.querySelector('[data-no]').addEventListener('click', function () { w.innerHTML = ''; });
    w.querySelector('[data-yes]').addEventListener('click', function () {
      var y = w.querySelector('[data-yes]'); y.disabled = true; y.textContent = 'מבטלים…';
      sb.functions.invoke('cancel-subscription', { body: { entity_id: biz.id, entity_type: kind, payment_type: 'promotions_subscription' } }).then(function (r) {
        if (!r.data || r.data.success !== true) throw new Error((r.data && r.data.error) || 'fail');
        A.toast('המנוי בוטל. השירות ימשיך עד ' + (r.data.end_date ? short(day(r.data.end_date)) : 'סוף התקופה'));
        return reload();
      }).catch(function () { y.disabled = false; y.textContent = 'אישור'; api.msg(d, 'שגיאה בביטול המנוי. נסה שוב, ואם הבעיה חוזרת פנה לתמיכה.'); });
    });
  }
  function renewBox(d) {
    var w = d.querySelector('#by-ov');
    var when = st.end && st.end > new Date() ? 'מיד (' + validUntil(st.end) + ')' : 'ויחויב';
    w.innerHTML = '<div class="by-box"><b>חידוש מנוי</b><p style="margin:6px 0;white-space:pre-line">האם לחדש את המנוי?\n\nהמנוי יחודש ' + esc(when) + '.</p>' +
      '<div style="display:flex;gap:8px"><button class="sa-b" type="button" data-no style="flex:1">ביטול</button><button class="sa-b grn" type="button" data-yes style="flex:1">חדש מנוי</button></div></div>';
    w.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    w.querySelector('[data-no]').addEventListener('click', function () { w.innerHTML = ''; });
    w.querySelector('[data-yes]').addEventListener('click', function () {
      var y = w.querySelector('[data-yes]'); y.disabled = true; y.textContent = 'מחדשים…';
      renew(st.sub.id).then(function (res) {
        if (res && res.success && res.action === 'reactivated') { A.toast('המנוי הופעל מחדש בהצלחה'); return reload(); }
        if (res && res.success && res.action === 'charged') { A.toast('המנוי חודש בהצלחה'); return reload(); }
        if (res && res.success && res.action === 'needs_payment' && res.clearing_url) {
          // אין כרטיס שמור (או שהחיוב בו נכשל) → דף הסליקה; payment-success-web.html מקבל order_id מ-create-payment
          try { sessionStorage.setItem('shchuna.pay', JSON.stringify({ b: biz.id, o: '', t: Date.now() })); } catch (e) {}
          location.href = res.clearing_url; return;
        }
        throw new Error((res && res.error) || 'fail');
      }).catch(function (e) { y.disabled = false; y.textContent = 'חדש מנוי'; api.msg(d, e && e.message && e.message !== 'fail' ? e.message : 'שגיאה בחידוש המנוי. נסו שוב.'); });
    });
  }
  // renew-subscription מאפשר רק Content-Type/Authorization/apikey בכותרות — לכן fetch ישיר (supabase-js מוסיף x-client-info)
  // renew-subscription v27: בודקת משתמש ובעלות; web_return → אם צריך תשלום חדש, החזרה לאתר אחרי הסליקה
  function renew(id) {
    return sb.functions.invoke('renew-subscription', { body: { subscription_id: id, web_return: true } }).then(function (r) {
      if (r.data) return r.data;
      if (r.error && r.error.context && r.error.context.json) return r.error.context.json().catch(function () { return null; });
      return null;
    });
  }
  function reload() { return load().then(main, function () { A.toast('שגיאה בטעינה'); }).then(function () { if (api.onChange) api.onChange(); }); }

  /* ── רכישה: פרטים לקבלה → סיכום הזמנה ── */
  function purchase(d) {
    api.msg(d, '');
    if (!st.terms) return api.msg(d, 'יש לקבל את תנאי השימוש');
    if (st.isSub && !st.selSub) return api.msg(d, 'יש לבחור חבילת מנוי');
    if (!st.isSub && !st.selQty) return api.msg(d, 'יש לבחור חבילת מבצעים');
    if (st.state === 'pkg') return api.msg(d, 'יש לך ' + st.left + ' מבצעים שנותרו. סיים להשתמש בהם לפני רכישה חדשה.');
    if (st.state === 'sub' && !st.isSub) return api.msg(d, 'לא ניתן לרכוש מבצעים כאשר יש מנוי פעיל.');
    if (!st.ent.business_registration_type) return regView();
    summary();
  }
  function regView() {
    var d = api.dlg('<h2 id="sa-h">פרטים לקבלה</h2><form class="sa-f by" novalidate id="by-reg"><p class="mb-note">הפרטים ישמשו להפקת קבלה עבור ' + esc(st.ent.name || biz.name) + '</p>' +
      '<div class="mb-field"><label for="by-rt">סוג רישום</label><select id="by-rt"><option value="">בחר סוג רישום</option>' +
      REG.map(function (r) { return '<option value="' + r[0] + '">' + esc(r[1]) + '</option>'; }).join('') + '</select></div>' +
      '<div class="mb-field" id="by-tw" hidden><label for="by-tx" id="by-tl"></label><input id="by-tx" inputmode="numeric" maxlength="9" dir="ltr"></div>' +
      '<p class="sa-msg" hidden></p><button class="sa-b pri" type="submit">המשך לתשלום</button><button class="sa-b" type="button" id="by-rc">ביטול</button></form>', true);
    var $ = function (q) { return d.querySelector(q); };
    var cur = function () { return REG.filter(function (r) { return r[0] === $('#by-rt').value; })[0]; };
    $('#by-rt').addEventListener('change', function () { var r = cur(); api.msg(d, ''); $('#by-tw').hidden = !(r && r[2]); if (r && r[2]) { $('#by-tl').textContent = r[2]; $('#by-tx').placeholder = r[0] === 'nonprofit' ? '58XXXXXXX' : '9 ספרות'; } });
    $('#by-tx').addEventListener('input', function () { $('#by-tx').value = $('#by-tx').value.replace(/\D/g, '').slice(0, 9); api.msg(d, ''); });
    $('#by-rc').addEventListener('click', main);
    $('#by-reg').addEventListener('submit', function (e) {
      e.preventDefault();
      var r = cur(); if (!r) return api.msg(d, 'יש לבחור סוג רישום');
      var t = null;
      if (r[2]) {
        t = $('#by-tx').value.replace(/[\s-]/g, '');
        if (!t) return api.msg(d, 'שדה חובה');
        if (r[0] === 'nonprofit' ? !/^58\d{7}$/.test(t) : !/^\d{9}$/.test(t)) return api.msg(d, r[0] === 'nonprofit' ? 'מספר עמותה חייב להתחיל ב-58 ולהכיל 9 ספרות' : 'מספר חייב להכיל 9 ספרות');
      }
      var b = d.querySelector('[type=submit]'); b.disabled = true; b.textContent = 'שומרים…';
      sb.from(table).update({ business_registration_type: r[0], tax_id: t }).eq('id', biz.id).select('id').then(function (x) {
        if (x.error || !x.data || !x.data.length) throw x.error || new Error('none');
        st.ent.business_registration_type = r[0]; st.ent.tax_id = t; summary();
      }).catch(function () { b.disabled = false; b.textContent = 'המשך לתשלום'; api.msg(d, 'שגיאה בשמירה. נסה שוב.'); });
    });
  }
  function regLabel(v) { var r = REG.filter(function (x) { return x[0] === v; })[0]; return r ? r[1] : ''; }
  function summary() {
    var isSub = st.isSub, p = isSub ? st.selSub : st.selQty, n = net(), vat = n * st.vat / 100;
    var desc = isSub ? 'מנוי מבצעים - ' + p.name : 'חבילת מבצעים - ' + p.promotions_count + ' מבצעים';
    Promise.all([
      isSub ? sb.from('payment_customers').select('customer_id,card_suffix').eq('entity_id', biz.id).eq('entity_type', kind).maybeSingle().then(function (r) { return r.data; }, function () { return null; }) : Promise.resolve(null),
      sb.from('userdata').select('owner_name,owner_phone,email').eq('user_id', api.user.id).maybeSingle().then(function (r) { return r.data || {}; }, function () { return {}; })
    ]).then(function (r) {
      var tok = r[0], u = r[1];
      var name = st.ent.name || biz.name || u.owner_name || 'לקוח', email = u.email || api.user.email || '', phone = u.owner_phone || '';
      var reg = st.ent.business_registration_type, needTax = reg === 'licensed' || reg === 'company' || reg === 'nonprofit';
      var d = api.dlg('<h2 id="sa-h">סיכום הזמנה</h2><div class="sa-f by">' +
        '<div class="by-sum"><b>' + esc(desc) + '</b><span class="mb-note">' + (isSub ? 'מנוי חודשי' : 'תשלום חד-פעמי') + '</span>' +
        (vat > 0 ? '<div class="r"><span>לפני מע"מ</span><span>₪' + fmt(n) + '</span></div><div class="r"><span>מע"מ</span><span>₪' + fmt(vat) + '</span></div>' : '') +
        '<div class="r"><span>' + (isSub ? 'לחודש' : 'לתשלום') + '</span><span class="t">₪' + fmt(n + vat) + '</span></div></div>' +
        (tok ? '<label class="mb-chk"><input type="checkbox" id="by-tok" checked> ' + esc(tok.card_suffix ? 'כרטיס המסתיים ב-' + tok.card_suffix : 'כרטיס אשראי שמור') + '</label><p class="mb-note" id="by-tokn">לחיוב עם כרטיס אחר כבה את המתג</p>' : '') +
        '<div id="by-rcpt"><b class="pm-lim" style="display:block;margin-bottom:6px">פרטים לקבלה</b>' +
        '<div class="mb-field"><label for="by-n">שם</label><input id="by-n" value="' + esc(name) + '"></div>' +
        '<div class="mb-field"><label for="by-e">אימייל</label><input id="by-e" type="email" dir="ltr" value="' + esc(email) + '"></div>' +
        '<div class="mb-field"><label for="by-p">טלפון</label><input id="by-p" type="tel" dir="ltr" value="' + esc(phone) + '"></div>' +
        '<p class="mb-note">סוג רישום: ' + esc(regLabel(reg)) + (needTax && st.ent.tax_id ? ' · ' + (reg === 'company' ? 'ח.פ.' : reg === 'nonprofit' ? 'מספר עמותה' : 'מספר עוסק') + ': ' + esc(st.ent.tax_id) : '') + '</p></div>' +
        (isSub ? '<p class="mb-note">פרטי הכרטיס ישמרו לחיוב חודשי אוטומטי</p>' : '') +
        '<p class="sa-msg" hidden></p><button class="sa-b pri" type="button" id="by-pay">לתשלום ₪' + fmt(n + vat) + '</button>' +
        '<button class="sa-b" type="button" id="by-sb">ביטול</button></div>', true);
      d.querySelector('#by-pay').addEventListener('click', function () {
        pay(d, { isSub: isSub, desc: desc, amount: n, useTok: !!(tok && d.querySelector('#by-tok') && d.querySelector('#by-tok').checked),
          name: d.querySelector('#by-n').value.trim(), email: d.querySelector('#by-e').value.trim(), phone: d.querySelector('#by-p').value.trim() });
      });
      var t = d.querySelector('#by-tok');
      if (t) { var sync = function () { d.querySelector('#by-rcpt').hidden = t.checked; d.querySelector('#by-tokn').textContent = t.checked ? 'לחיוב עם כרטיס אחר כבה את המתג' : 'יפתח דף תשלום להזנת כרטיס חדש'; }; t.addEventListener('change', sync); sync(); }
      d.querySelector('#by-sb').addEventListener('click', main);
    });
  }

  /* ── תשלום (PaymentSummarySheet._onPay + PaymentService.createPayment) ──
   * create-payment מחשב את הסכום בשרת לפי המחירון ובודק שהמשתמש בעל הישות.
   * מנוי: save_token=true (חיוב חודשי), charge_with_token כשיש כרטיס שמור והמתג דולק — החיוב מיידי, בלי דף סליקה.
   * אחרת: web_return=true → מעבר לדף הסליקה של Invoice4U, והחזרה ל-payment-success-web.html?order_id=… */
  function pay(d, o) {
    var btn = d.querySelector('#by-pay'), label = btn.textContent;
    api.msg(d, ''); btn.disabled = true; btn.textContent = o.useTok ? 'מחייבים…' : 'מעבירים לתשלום…';
    var body = {
      entity_id: biz.id, entity_type: kind, user_id: api.user.id,
      customer_name: o.name, customer_email: o.email, customer_phone: o.phone,
      business_registration_type: st.ent.business_registration_type || null, tax_id: st.ent.tax_id || null,
      amount: o.amount, payment_type: o.isSub ? 'promotions_subscription' : 'promotions_package', description: o.desc,
      payments_num: 1, save_token: o.isSub, charge_with_token: o.isSub && o.useTok,
      community_id: biz.community_id || null, coupon_id: null, web_return: true
    };
    sb.functions.invoke('create-payment', { body: body }).then(function (r) {
      var data = r.data;
      if (!data && r.error && r.error.context && r.error.context.json) return r.error.context.json().then(function (j) { return { data: j }; }, function () { return { data: null }; });
      return { data: data };
    }).then(function (r) {
      var x = r.data || {};
      if (body.charge_with_token) {
        if (x.success) { A.toast('התשלום בוצע בהצלחה! המנוי פעיל. הקבלה נשלחה למייל'); return reload(); }
        throw new Error(x.error || x.message || 'החיוב נכשל');
      }
      if (!x.success || !x.clearing_url) throw new Error(x.error || 'שגיאה ביצירת התשלום');
      try { sessionStorage.setItem('shchuna.pay', JSON.stringify({ b: biz.id, o: x.order_id || '', t: Date.now() })); } catch (e) {}
      location.href = x.clearing_url;
    }).catch(function (e) {
      btn.disabled = false; btn.textContent = label;
      api.msg(d, (e && e.message && !/^(Failed|NetworkError|Load failed)/.test(e.message)) ? e.message : 'שגיאה ביצירת התשלום. נסו שוב.');
    });
  }

  window.ShchunaBuy = function (o) {
    api = o; A = o.A; sb = o.sb; biz = o.biz; esc = o.esc; kind = o.kind; table = o.table;
    if (!document.getElementById('by-css')) { var s = document.createElement('style'); s.id = 'by-css'; s.textContent = css; document.head.appendChild(s); }
    st = {};
    api.dlg('<h2 id="sa-h">רכישת חבילת מבצעים</h2><p>טוען…</p>', true);
    return load().then(main, function () {
      var d = api.dlg('<h2 id="sa-h">רכישת חבילת מבצעים</h2><p>שגיאה בטעינת מחירים</p><button class="sa-b pri" type="button" data-r>נסו שוב</button><button class="hr-lnk" type="button" data-b>← חזרה</button>', true);
      d.querySelector('[data-r]').addEventListener('click', function () { window.ShchunaBuy(o); });
      d.querySelector('[data-b]').addEventListener('click', function () { api.back(); });
    });
  };
})();
