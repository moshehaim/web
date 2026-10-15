/* שכונה — התחברות, "החשבון שלי", אימות טלפון והמלצה באתר הסטטי.
 * סשן אחד משותף לאתר ולאפליקציה (/app/): אותו מפתח localStorage שבו supabase_flutter שומר.
 * הספרייה (supabase-js) נטענת רק כשצריך: לחיצה על התחברות/המלצה, חזרה מ-Google/Apple, או משתמש מחובר בעמוד ישות.
 */
(function () {
  'use strict';
  var SB_URL = 'https://mebomrqnfnbqijiuawdh.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lYm9tcnFuZm5icWlqaXVhd2RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkxOTc3MDEsImV4cCI6MjA1NDc3MzcwMX0.OSpzG4pnsgIiOEefWK0Z29ZHOo12bIhp0QXTdk2Hsg4';
  var SK = 'sb-mebomrqnfnbqijiuawdh-auth-token';
  var LIB = '/js/supabase-2.112.4.js';
  var APP = '/app/';
  var PENDING = 'shchuna.pending';

  /* ── אחסון: תואם בין supabase-js לבין supabase_flutter ──
   * Flutter שומר את הסשן בלי expires_at, ו-supabase-js מוחק סשן כזה כ"לא תקין" (והאפליקציה הייתה מתנתקת).
   * לכן בקריאה משלימים expires_at מתוך ה-JWT. שדה נוסף לא מפריע ל-Flutter. */
  function ls(fn) { try { return fn(window.localStorage); } catch (e) { return null; } }
  function jwtExp(t) { try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).exp; } catch (e) { return null; } }
  function fixSession(raw) {
    if (!raw) return raw;
    try {
      var s = JSON.parse(raw); if (typeof s === 'string') s = JSON.parse(s);
      if (s && s.access_token && !s.expires_at) { var x = jwtExp(s.access_token); if (x) s.expires_at = x; }
      return JSON.stringify(s);
    } catch (e) { return raw; }
  }
  var storage = {
    getItem: function (k) {
      return ls(function (st) {
        var v = st.getItem(k);
        if (v == null && k === SK) v = st.getItem('flutter.' + SK);
        return k === SK ? fixSession(v) : v;
      });
    },
    setItem: function (k, v) { ls(function (st) { st.setItem(k, v); }); },
    removeItem: function (k) { ls(function (st) { st.removeItem(k); }); }
  };
  function readSession() {
    var raw = storage.getItem(SK); if (!raw) return null;
    try { var s = JSON.parse(raw); return s && s.refresh_token && s.user ? s : null; } catch (e) { return null; }
  }
  function firstName(u) {
    var m = (u && u.user_metadata) || {};
    return String(m.full_name || m.name || '').trim().split(/\s+/)[0] || '';
  }

  /* ── טעינת הספרייה ── */
  var clientP = null;
  function client() {
    if (clientP) return clientP;
    clientP = new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = LIB; s.async = true;
      s.onload = function () {
        try {
          res(window.supabase.createClient(SB_URL, SB_KEY, {
            auth: { storageKey: SK, storage: storage, flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
          }));
        } catch (e) { rej(e); }
      };
      s.onerror = function () { clientP = null; rej(new Error('load')); };
      document.head.appendChild(s);
    });
    return clientP;
  }
  function getUser() {
    return client().then(function (sb) { return sb.auth.getSession().then(function (r) { return { sb: sb, user: r.data.session && r.data.session.user }; }); });
  }

  /* ── עיצוב ── */
  var CSS = '' +
    '.sa-dlg{border:0;padding:0;border-radius:22px;width:min(420px,calc(100vw - 32px));max-height:calc(100vh - 32px);box-shadow:0 24px 60px rgba(10,20,40,.35);font-family:Assistant,system-ui,sans-serif;color:#1C2B45;direction:rtl}' +
    '.sa-dlg::backdrop{background:rgba(15,25,45,.55)}' +
    '.sa-in{padding:26px 22px 22px;display:flex;flex-direction:column;gap:12px}' +
    '.sa-x{position:absolute;top:12px;left:12px;width:36px;height:36px;border-radius:50%;border:0;background:#F1F4F9;color:#172F57;font-size:20px;line-height:1;cursor:pointer}' +
    '.sa-in h2{margin:0;font-size:24px;font-weight:800;color:#172F57;padding-left:40px}' +
    '.sa-in p{margin:0;font-size:16px;color:#566173;line-height:1.5}' +
    '.sa-b{display:flex;align-items:center;justify-content:center;gap:8px;height:50px;border-radius:999px;border:1.5px solid #DCE2EC;background:#fff;color:#172F57;font:inherit;font-size:17px;font-weight:800;cursor:pointer;text-decoration:none;width:100%}' +
    '.sa-b:hover{background:#F5F8FF}.sa-b[disabled]{opacity:.6;cursor:default}' +
    '.sa-b.pri{background:#172F57;border-color:#172F57;color:#fff}.sa-b.pri:hover{background:#0F1F3B}' +
    /* Google / Apple — מלאים ובולטים (בלי לוגואים); כפתור האימייל משני */
    '.sa-b.sp-g,.sa-b.sp-a{height:56px;font-size:18px;color:#fff;box-shadow:0 6px 16px rgba(20,40,80,.18)}' +
    '.sa-b.sp-g{background:#1A73E8;border-color:#1A73E8}.sa-b.sp-g:hover{background:#1559B8;border-color:#1559B8}' +
    '.sa-b.sp-a{background:#000;border-color:#000}.sa-b.sp-a:hover{background:#262626;border-color:#262626}' +
    '.sa-b.em{background:#fff;color:#172F57;border-color:#172F57}.sa-b.em:hover{background:#F5F8FF}' +
    '.sa-b.rec{background:#E24B4A;border-color:#E24B4A;color:#fff}.sa-b.rec:hover{background:#C0362F}' +
    '.sa-or{display:flex;align-items:center;gap:10px;color:#8A94A6;font-size:14px;font-weight:700}.sa-or:before,.sa-or:after{content:"";flex:1;height:1px;background:#E6E9EF}' +
    '.sa-f{display:flex;flex-direction:column;gap:10px}' +
    '.sa-f input{height:50px;border-radius:14px;border:1.5px solid #DCE2EC;padding:0 14px;font:inherit;font-size:17px;color:#1C2B45;background:#fff;width:100%;box-sizing:border-box}' +
    '.sa-f input:focus{outline:0;border-color:#2A6FB8;box-shadow:0 0 0 3px rgba(42,111,184,.15)}' +
    '.sa-f input[dir=ltr]{text-align:left;letter-spacing:.5px}' +
    '.sa-err{color:#C0362F!important;font-weight:700;font-size:15px!important}' +
    '.sa-ok{color:#1E7A4C!important;font-weight:700}' +
    '.sa-lnk{background:none;border:0;padding:0;font:inherit;font-size:15px;font-weight:700;color:#2A6FB8;cursor:pointer;text-decoration:underline;align-self:center}' +
    '.sa-small{font-size:13px!important;color:#8A94A6!important;text-align:center}' +
    '.sa-menu{position:absolute;top:calc(100% + 8px);left:0;min-width:240px;background:#fff;border:1px solid #E6E9EF;border-radius:16px;box-shadow:0 14px 34px rgba(10,20,40,.16);padding:8px;z-index:60;display:flex;flex-direction:column;font-size:16px}' +
    '.sa-menu[hidden]{display:none}' +
    '.sa-menu .who{padding:8px 10px 10px;border-bottom:1px solid #EEF1F5;margin-bottom:4px}.sa-menu .who b{display:block;color:#172F57;font-size:17px}.sa-menu .who small{color:#6B7689;font-size:13px;direction:ltr;display:block;text-align:right}' +
    '.sa-menu a,.sa-menu button{display:block;text-align:right;padding:10px;border-radius:10px;border:0;background:none;font:inherit;font-weight:700;color:#172F57;text-decoration:none;cursor:pointer;width:100%}' +
    '.sa-menu a:hover,.sa-menu button:hover{background:#F5F8FF}' +
    '.sa-menu .v{font-size:13px;font-weight:700;padding:0 10px 6px;color:#1E7A4C}.sa-menu .v.no{color:#B26A00}' +
    '.acct-wrap{position:relative;display:inline-flex}' +
    '.e-rec.on{background:#E24B4A!important;color:#fff!important}.e-rec.on svg{color:#fff!important}' +
    '.e-rec[aria-busy=true],[data-coupon][aria-busy=true]{opacity:.65;pointer-events:none}' +
    '[data-coupon].taken{background:#E8F5EE!important;color:#1E7A4C!important}' +
    '.sa-note{background:#FFF6E0;border:1px solid #F3D27A;border-radius:14px;padding:10px 12px;color:#5C4400!important;font-size:15px!important}' +
    '.sa-qr{display:flex;align-items:center;gap:14px;padding:10px;border:1px solid #E6E9EF;border-radius:16px}.sa-qr img{flex:none;display:block}.sa-qr span{font-weight:700;color:#172F57}';

  function injectCss() { if (document.getElementById('sa-css')) return; var s = document.createElement('style'); s.id = 'sa-css'; s.textContent = CSS; document.head.appendChild(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ── חלון ── */
  var dlg = null, onDone = null;
  function dialog() {
    if (dlg) return dlg;
    injectCss();
    dlg = document.createElement('dialog'); dlg.className = 'sa-dlg'; dlg.setAttribute('aria-labelledby', 'sa-h');
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
    dlg.addEventListener('cancel', function () { onDone = null; });
    document.body.appendChild(dlg);
    return dlg;
  }
  function open(html) {
    var d = dialog();
    d.innerHTML = '<button class="sa-x" type="button" aria-label="סגירה">×</button><div class="sa-in">' + html + '</div>';
    d.querySelector('.sa-x').addEventListener('click', close);
    if (!d.open) { if (d.showModal) d.showModal(); else d.setAttribute('open', ''); }
    // בחלון ההתחברות לא ממקדים את האימייל — המקלדת בטלפון מסתירה את Google/Apple
    var f = d.querySelector('input'); if (f && !d.querySelector('[data-p]')) setTimeout(function () { f.focus(); }, 30);
    return d;
  }
  function close() { onDone = null; if (dlg && dlg.open) { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); } }
  function setErr(msg, ok) {
    var p = dlg && dlg.querySelector('.sa-msg'); if (!p) return;
    p.className = 'sa-msg ' + (ok ? 'sa-ok' : 'sa-err'); p.textContent = msg || ''; p.hidden = !msg;
  }
  function busy(btn, on, txt) {
    if (!btn) return; if (on) { btn.dataset.t = btn.textContent; btn.textContent = txt || 'רגע…'; btn.disabled = true; }
    else { btn.textContent = btn.dataset.t || btn.textContent; btn.disabled = false; }
  }
  function cleanHref() {
    var u = new URL(location.href);
    ['code', 'error', 'error_code', 'error_description', 'state'].forEach(function (k) { u.searchParams.delete(k); });
    u.hash = ''; return u.toString();
  }

  /* ── מסך התחברות ── */
  var AUTH_ERR = {
    'Invalid login credentials': 'האימייל או הסיסמה שגויים',
    'Email not confirmed': 'צריך לאשר את כתובת האימייל — בדקו את תיבת הדואר',
    'User already registered': 'כבר יש חשבון עם האימייל הזה — נסו להתחבר',
    'Password should be at least 6 characters': 'הסיסמה צריכה להכיל לפחות 6 תווים'
  };
  function authMsg(e) {
    var m = (e && e.message) || '';
    for (var k in AUTH_ERR) if (m.indexOf(k) === 0) return AUTH_ERR[k];
    if (/rate limit/i.test(m)) return 'יותר מדי ניסיונות. נסו שוב בעוד כמה דקות';
    if (/password/i.test(m) && /weak|short|least/i.test(m)) return 'הסיסמה חלשה מדי — לפחות 6 תווים';
    return 'משהו השתבש. נסו שוב';
  }

  function loginView(opts) {
    opts = opts || {};
    var signup = !!opts.signup;
    var d = open(
      '<h2 id="sa-h">' + (signup ? 'הרשמה לשכונה' : 'התחברות לשכונה') + '</h2>' +
      '<p>' + esc(opts.why || 'אותו חשבון כמו באפליקציה — מתחברים פעם אחת.') + '</p>' +
      '<button class="sa-b sp-g" type="button" data-p="google">המשך עם Google</button>' +
      '<button class="sa-b sp-a" type="button" data-p="apple">המשך עם Apple</button>' +
      '<div class="sa-or">או עם אימייל</div>' +
      '<form class="sa-f" novalidate>' +
      (signup ? '<input name="name" autocomplete="name" placeholder="שם מלא" required>' : '') +
      '<input name="email" type="email" dir="ltr" autocomplete="email" placeholder="אימייל" required>' +
      '<input name="pw" type="password" dir="ltr" autocomplete="' + (signup ? 'new-password' : 'current-password') + '" placeholder="סיסמה" required minlength="6">' +
      '<p class="sa-msg" hidden></p>' +
      '<button class="sa-b em" type="submit">' + (signup ? 'יצירת חשבון' : 'התחברות עם אימייל') + '</button>' +
      '</form>' +
      '<button class="sa-lnk" type="button" data-sw>' + (signup ? 'כבר יש לי חשבון — להתחברות' : 'אין לכם חשבון? להרשמה') + '</button>' +
      (signup ? '' : '<a class="sa-small" href="' + APP + '">שכחתם סיסמה? אפשר לאפס באפליקציה</a>')
    );
    [].forEach.call(d.querySelectorAll('[data-p]'), function (b) {
      b.addEventListener('click', function () {
        busy(b, true, 'מעבירים…');
        client().then(function (sb) {
          return sb.auth.signInWithOAuth({ provider: b.getAttribute('data-p'), options: { redirectTo: cleanHref() } });
        }).then(function (r) { if (r && r.error) throw r.error; }).catch(function (e) { busy(b, false); setErr(authMsg(e)); });
      });
    });
    d.querySelector('[data-sw]').addEventListener('click', function () { var o = {}; for (var k in opts) o[k] = opts[k]; o.signup = !signup; var keep = onDone; loginView(o); onDone = keep; });
    var f = d.querySelector('form');
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var email = f.email.value.trim(), pw = f.pw.value, name = f.name ? f.name.value.trim() : '';
      if (signup && name.length < 2) return setErr('נא למלא שם מלא');
      if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('נא למלא אימייל תקין');
      if (pw.length < 6) return setErr('הסיסמה צריכה להכיל לפחות 6 תווים');
      var btn = f.querySelector('[type=submit]'); busy(btn, true); setErr('');
      client().then(function (sb) {
        return signup
          ? sb.auth.signUp({ email: email, password: pw, options: { data: { full_name: name }, emailRedirectTo: cleanHref() } })
          : sb.auth.signInWithPassword({ email: email, password: pw });
      }).then(function (r) {
        busy(btn, false);
        if (r.error) return setErr(authMsg(r.error));
        if (!r.data.session) { // הרשמה שמחכה לאישור מייל
          open('<h2 id="sa-h">כמעט שם</h2><p>שלחנו אליכם מייל לאישור הכתובת. אחרי האישור תחזרו לכאן מחוברים.</p><button class="sa-b pri" type="button" data-c>הבנתי</button>');
          dlg.querySelector('[data-c]').addEventListener('click', close);
          return;
        }
        loggedIn(r.data.session.user);
      }).catch(function (e) { busy(btn, false); setErr(authMsg(e)); });
    });
  }

  function emitAuth(user) { try { document.dispatchEvent(new CustomEvent('shchuna:auth', { detail: { user: user || null } })); } catch (e) {} }
  function loggedIn(user) {
    renderAcct(user); emitAuth(user);
    var fn = onDone; onDone = null;
    if (fn) fn(user); else close();
  }

  /* ── אימות טלפון (פעם אחת לחשבון) ── */
  function fnError(r) {
    // functions.invoke מחזיר שגיאה כללית על כל סטטוס לא-2xx; ההודעה האמיתית בגוף התשובה
    if (!r.error) return Promise.resolve(r.data && r.data.success === false ? (r.data.error || 'שגיאה') : null);
    var ctx = r.error.context;
    if (ctx && ctx.json) return ctx.json().then(function (j) { return (j && j.error) || 'שגיאה. נסו שוב'; }, function () { return 'שגיאה. נסו שוב'; });
    return Promise.resolve('אין חיבור. נסו שוב');
  }
  function phoneView(sb, done) {
    var d = open(
      '<h2 id="sa-h">אימות מספר טלפון</h2>' +
      '<p>כדי שההמלצות בשכונה יהיו של שכנים אמיתיים, מאמתים טלפון פעם אחת. נשלח אליכם קוד ב-SMS.</p>' +
      '<form class="sa-f" novalidate><input name="phone" type="tel" dir="ltr" inputmode="numeric" autocomplete="tel-national" placeholder="050-0000000" required>' +
      '<p class="sa-msg" hidden></p><button class="sa-b pri" type="submit">שליחת קוד</button></form>' +
      '<p class="sa-small">המספר לא יוצג באתר.</p>'
    );
    var f = d.querySelector('form');
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var phone = f.phone.value.replace(/[^\d]/g, '');
      if (!/^05\d{8}$/.test(phone)) return setErr('נא למלא מספר נייד ישראלי (05X)');
      var btn = f.querySelector('[type=submit]'); busy(btn, true, 'שולחים…'); setErr('');
      sb.functions.invoke('send-verification-sms', { body: { phone: phone } }).then(fnError).then(function (err) {
        busy(btn, false);
        if (err) return setErr(err);
        codeView(sb, phone, done);
      }).catch(function () { busy(btn, false); setErr('אין חיבור. נסו שוב'); });
    });
  }
  function codeView(sb, phone, done) {
    var d = open(
      '<h2 id="sa-h">הזנת הקוד</h2>' +
      '<p>שלחנו קוד ב-SMS למספר <b dir="ltr">' + esc(phone.replace(/^(\d{3})/, '$1-')) + '</b>.</p>' +
      '<form class="sa-f" novalidate><input name="code" dir="ltr" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="קוד" required>' +
      '<p class="sa-msg" hidden></p><button class="sa-b pri" type="submit">אימות</button></form>' +
      '<button class="sa-lnk" type="button" data-back>מספר אחר / שליחה מחדש</button>'
    );
    d.querySelector('[data-back]').addEventListener('click', function () { phoneView(sb, done); });
    var f = d.querySelector('form');
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var code = f.code.value.replace(/\D/g, '');
      if (!/^\d{4,6}$/.test(code)) return setErr('הקוד מכיל 4–6 ספרות');
      var btn = f.querySelector('[type=submit]'); busy(btn, true, 'בודקים…'); setErr('');
      sb.functions.invoke('verify-sms-code', { body: { phone: phone, code: code } }).then(fnError).then(function (err) {
        busy(btn, false);
        if (err) return setErr(err);
        verifiedCache = true; done();
      }).catch(function () { busy(btn, false); setErr('אין חיבור. נסו שוב'); });
    });
  }
  var verifiedCache = null;
  function isVerified(sb, uid) {
    if (verifiedCache) return Promise.resolve(true);
    return sb.from('userdata').select('is_verified').eq('user_id', uid).maybeSingle().then(function (r) {
      verifiedCache = !!(r.data && r.data.is_verified); return verifiedCache;
    });
  }

  /* ── המלצה ── */
  var REC_ERR = {
    own_entity: 'אי אפשר להמליץ על עסק או מקצוע שלכם',
    not_found: 'העמוד הזה כבר לא פעיל',
    not_authenticated: 'צריך להתחבר מחדש',
    phone_not_verified: 'צריך לאמת טלפון קודם'
  };
  function recBtn() { return document.querySelector('.e-rec[data-rec]'); }
  function heartSvg() { var b = recBtn(), s = b && b.querySelector('svg'); return s ? s.outerHTML : ''; }
  function paintRec(on, count) {
    var b = recBtn(); if (!b) return;
    b.classList.toggle('on', !!on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.innerHTML = heartSvg() + (on ? 'המלצתם ✓' : (count > 0 || b.getAttribute('data-has') === '1' ? 'אני ממליץ' : 'היה הראשון להמליץ'));
    b.title = on ? 'לחיצה מסירה את ההמלצה' : '';
    if (typeof count === 'number') {
      b.setAttribute('data-has', count > 0 ? '1' : '0');
      var tags = document.querySelector('.e-tags'); if (!tags) return;
      var t = tags.querySelector('.e-tag.rec');
      if (count <= 0) { if (t) t.remove(); return; }
      if (!t) { t = document.createElement('span'); t.className = 'e-tag rec'; tags.appendChild(t); }
      t.innerHTML = heartSvg().replace(/width="\d+"/, 'width="14"').replace(/height="\d+"/, 'height="14"') + (count === 1 ? 'המלצה אחת' : count + ' המלצות');
    }
  }
  /* שער משותף לפעולות שדורשות משתמש מחובר עם טלפון מאומת (המלצה, לקיחת קופון).
   * pending נשמר ב-sessionStorage כדי שהפעולה תמשיך אחרי חזרה מ-Google/Apple. */
  function gate(pending, why, run) {
    return getUser().then(function (x) {
      if (!x.user) {
        try { pending.p = location.pathname; sessionStorage.setItem(PENDING, JSON.stringify(pending)); } catch (e) {}
        onDone = function () { close(); clearPending(); resume(pending); };
        loginView({ why: why });
        return false;
      }
      return isVerified(x.sb, x.user.id).then(function (ok) {
        if (!ok) { phoneView(x.sb, function () { close(); resume(pending); }); return false; }
        return run(x.sb, x.user);
      });
    });
  }
  function resume(p) {
    if (p.a === 'rec') doRecommend(p.t, p.id, true);
    else if (p.a === 'coupon') doCoupon(p.id);
  }

  function doRecommend(type, id, value) {
    var b = recBtn(); if (b) b.setAttribute('aria-busy', 'true');
    return getUser().then(function (x) {
      if (!x.user) { if (b) b.removeAttribute('aria-busy'); return askLogin(type, id); }
      return isVerified(x.sb, x.user.id).then(function (ok) {
        if (!ok && value) {
          if (b) b.removeAttribute('aria-busy');
          phoneView(x.sb, function () { close(); doRecommend(type, id, value); });
          return;
        }
        return x.sb.rpc('set_recommendation', { p_entity_type: type, p_entity_id: id, p_value: value }).then(function (r) {
          if (b) b.removeAttribute('aria-busy');
          if (r.error) {
            var m = r.error.message || '';
            if (m === 'phone_not_verified') { verifiedCache = false; return phoneView(x.sb, function () { close(); doRecommend(type, id, value); }); }
            return notice(REC_ERR[m] || 'לא הצלחנו לשמור. נסו שוב');
          }
          paintRec(r.data.recommended, r.data.count);
          if (value) toast('תודה! ההמלצה נשמרה');
        });
      });
    }).catch(function () { if (b) b.removeAttribute('aria-busy'); notice('אין חיבור. נסו שוב'); });
  }
  function askLogin(type, id) {
    gate({ a: 'rec', t: type, id: id }, 'כדי להמליץ צריך להתחבר. ההמלצה תישמר מיד אחרי ההתחברות.', function () { doRecommend(type, id, true); });
  }

  /* ── קופון: לוקחים באתר, מממשים רק באפליקציה ── */
  var DOWNLOAD = '/b/';
  function couponBtn(id) { return document.querySelector('[data-coupon="' + id + '"]'); }
  function paintCoupon(id) {
    var b = couponBtn(id); if (!b) return;
    b.classList.add('taken'); b.textContent = 'הקופון שמור לך ✓'; b.setAttribute('data-taken', '1');
  }
  function appOnlyView(title, lead) {
    var desk = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
    open('<h2 id="sa-h">' + esc(title) + '</h2>' +
      '<p>' + esc(lead) + '</p>' +
      '<p class="sa-note"><b>שימו לב:</b> ניתן לממש את הקופון רק באפליקציה שכונה. בעסק פותחים את הקופון באפליקציה ומציגים אותו בקופה.</p>' +
      (desk
        ? '<div class="sa-qr"><img src="/img/qr-app.svg" alt="קוד QR להורדת האפליקציה" width="148" height="148"><span>סרקו עם הטלפון להורדת האפליקציה</span></div>'
        : '<a class="sa-b pri" href="' + DOWNLOAD + '">להורדת האפליקציה</a>') +
      '<p class="sa-small">כבר יש לכם את האפליקציה? הקופון מחכה ב"הקופונים שלי".</p>' +
      '<button class="sa-b" type="button" data-c>סגירה</button>');
    dlg.querySelector('[data-c]').addEventListener('click', close);
  }
  function doCoupon(id) {
    var b = couponBtn(id);
    if (b && b.getAttribute('data-taken') === '1') return appOnlyView('הקופון שמור לך', 'לקחת כבר את הקופון הזה.');
    if (b) b.setAttribute('aria-busy', 'true');
    return gate({ a: 'coupon', id: id }, 'כדי לקחת קופון צריך להתחבר. הקופון יישמר מיד אחרי ההתחברות.', function (sb, user) {
      return sb.rpc('redeem_coupon_safe', { p_user_id: user.id, p_coupon_id: id }).then(function (r) {
        if (r.error) return notice('לא הצלחנו לשמור את הקופון. נסו שוב');
        var d = r.data || {};
        if (d.success) { paintCoupon(id); return appOnlyView('הקופון נשמר!', 'הקופון שמור על שמכם.'); }
        if (d.error_code === 'ALREADY_TAKEN') { paintCoupon(id); return appOnlyView('הקופון שמור לך', 'לקחת כבר את הקופון הזה.'); }
        return notice(d.message || 'לא הצלחנו לשמור את הקופון. נסו שוב');
      });
    }).catch(function () { notice('אין חיבור. נסו שוב'); }).then(function () { if (b) b.removeAttribute('aria-busy'); });
  }
  function loadMyCoupons() {
    var bs = document.querySelectorAll('[data-coupon]'); if (!bs.length) return;
    var ids = [].map.call(bs, function (b) { return b.getAttribute('data-coupon'); });
    getUser().then(function (x) {
      if (!x.user) return;
      return x.sb.from('user_coupon_redemptions').select('coupon_id').eq('user_id', x.user.id).in('coupon_id', ids)
        .then(function (r) { (r.data || []).forEach(function (row) { paintCoupon(row.coupon_id); }); });
    }).catch(function () {});
  }
  function clearPending() { try { sessionStorage.removeItem(PENDING); } catch (e) {} }
  function notice(msg) {
    open('<h2 id="sa-h">שימו לב</h2><p>' + esc(msg) + '</p><button class="sa-b pri" type="button" data-c>סגירה</button>');
    dlg.querySelector('[data-c]').addEventListener('click', close);
  }
  function toast(msg) {
    injectCss();
    var t = document.createElement('div');
    t.setAttribute('role', 'status');
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#172F57;color:#fff;padding:12px 20px;border-radius:999px;font:800 16px Assistant,system-ui,sans-serif;z-index:80;box-shadow:0 10px 28px rgba(0,0,0,.25)';
    t.textContent = msg; document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }
  function loadMyRec() {
    var b = recBtn(); if (!b) return;
    getUser().then(function (x) {
      if (!x.user) return;
      return x.sb.from('entity_recommendations').select('id').eq('entity_type', b.getAttribute('data-rec'))
        .eq('entity_id', b.getAttribute('data-id')).eq('user_id', x.user.id).maybeSingle()
        .then(function (r) { if (r.data) paintRec(true); });
    }).catch(function () {});
  }

  /* ── כפתור החשבון בכותרת ── */
  var acct = null, menu = null;
  function renderAcct(user) {
    acct = acct || document.getElementById('acct'); if (!acct) return;
    var lbl = acct.querySelector('.lbl');
    if (user) {
      var n = firstName(user);
      if (lbl) lbl.textContent = n ? 'שלום, ' + n : 'החשבון שלי';
      acct.setAttribute('aria-label', n ? 'החשבון של ' + n : 'החשבון שלי');
      acct.setAttribute('aria-haspopup', 'menu'); acct.setAttribute('aria-expanded', 'false');
      acct.classList.add('in');
    } else {
      if (lbl) lbl.textContent = 'התחברות';
      acct.setAttribute('aria-label', 'התחברות'); acct.removeAttribute('aria-haspopup'); acct.removeAttribute('aria-expanded');
      acct.classList.remove('in');
      if (menu) menu.hidden = true;
    }
  }
  function buildMenu(user) {
    injectCss();
    if (!menu) {
      var w = document.createElement('span'); w.className = 'acct-wrap';
      acct.parentNode.insertBefore(w, acct); w.appendChild(acct);
      menu = document.createElement('div'); menu.className = 'sa-menu'; menu.setAttribute('role', 'menu'); menu.hidden = true;
      w.appendChild(menu);
      menu.addEventListener('click', function (e) { e.stopPropagation(); });
      document.addEventListener('click', function () { if (!menu.hidden) toggleMenu(false); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { toggleMenu(false); acct.focus(); } });
    }
    var m = user.user_metadata || {};
    menu.innerHTML = '<div class="who"><b>' + esc(m.full_name || m.name || 'החשבון שלי') + '</b><small>' + esc(user.email || '') + '</small></div>' +
      '<div class="v" data-v hidden></div>' +
      '<div data-own></div>' +
      '<a role="menuitem" href="' + APP + '">לאפליקציה</a>' +
      '<button role="menuitem" type="button" data-out>התנתקות</button>';
    menu.querySelector('[data-out]').addEventListener('click', function () {
      client().then(function (sb) { return sb.auth.signOut({ scope: 'local' }); }).catch(function () {}).then(function () {
        ls(function (st) { st.removeItem(SK); st.removeItem('flutter.' + SK); });
        verifiedCache = null; renderAcct(null); paintRec(false); emitAuth(null);
      });
    });
    client().then(function (sb) {
      isVerified(sb, user.id).then(function (ok) {
        var v = menu.querySelector('[data-v]'); if (!v) return;
        v.hidden = false; v.className = 'v' + (ok ? '' : ' no');
        if (ok) v.textContent = 'טלפון מאומת ✓';
        else { v.innerHTML = '<button type="button" style="padding:0;color:#B26A00;font-size:13px">הטלפון עוד לא מאומת — לאימות</button>'; v.querySelector('button').addEventListener('click', function () { toggleMenu(false); phoneView(sb, function () { close(); toast('הטלפון אומת ✓'); }); }); }
      }).catch(function () {});
      Promise.all([
        sb.from('businesses').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_locked', true).eq('is_active', true),
        sb.from('professionals').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_active', true)
      ]).then(function (r) {
        var own = menu.querySelector('[data-own]'); if (!own) return;
        var h = '';
        if (r[0].count) h += '<a role="menuitem" href="/my-business/">ניהול העסק שלי</a>';
        if (r[1].count) h += '<a role="menuitem" href="/my-business/">ניהול כרטיס בעל המקצוע</a>';
        own.innerHTML = h;
      }).catch(function () {});
    }).catch(function () {});
  }
  function toggleMenu(on) { if (!menu) return; menu.hidden = !on; acct.setAttribute('aria-expanded', on ? 'true' : 'false'); }

  /* ── אתחול ── */
  function init() {
    acct = document.getElementById('acct');
    var s = readSession();
    renderAcct(s && s.user);
    if (acct) acct.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      var cur = readSession();
      if (cur && cur.user) { if (!menu || menu.hidden) { buildMenu(cur.user); toggleMenu(true); } else toggleMenu(false); }
      else loginView();
    });

    var b = recBtn();
    if (b) b.addEventListener('click', function (e) {
      e.preventDefault();
      var on = b.classList.contains('on');
      if (on && !window.confirm('להסיר את ההמלצה?')) return;
      doRecommend(b.getAttribute('data-rec'), b.getAttribute('data-id'), !on);
    });

    document.addEventListener('click', function (e) {
      var c = e.target.closest && e.target.closest('[data-coupon]'); if (!c) return;
      e.preventDefault(); doCoupon(c.getAttribute('data-coupon'));
    });
    var hasCoupons = !!document.querySelector('[data-coupon]');

    var q = new URLSearchParams(location.search);
    var oauthBack = q.has('code');
    if (q.has('error_description')) {
      history.replaceState(null, '', cleanHref());
      notice('ההתחברות לא הושלמה. נסו שוב.');
    }
    if (oauthBack || (s && (b || hasCoupons))) {
      client().then(function (sb) {
        // detectSessionInUrl מחליף את ה-code בסשן בזמן האתחול
        return sb.auth.getSession().then(function (r) {
          if (oauthBack) history.replaceState(null, '', cleanHref());
          var u = r.data.session && r.data.session.user;
          renderAcct(u); if (oauthBack) emitAuth(u);
          if (!u) return;
          var p = null; try { p = JSON.parse(sessionStorage.getItem(PENDING) || 'null'); } catch (e) {}
          if (p && p.p === location.pathname) { clearPending(); resume(p); }
          loadMyRec(); loadMyCoupons();
        });
      }).catch(function () {});
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.ShchunaAuth = {
    login: function (why) { loginView(why ? { why: why } : undefined); },
    client: client, getUser: getUser, session: readSession,
    toast: toast, notice: notice, open: open, close: close
  };
})();
