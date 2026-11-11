/* דרושים, גמ"ח והתנדבות מהאתר — אותם שדות וכללים כמו באפליקציה (JobFormScreen, AddOrEditGmachScreen, VolunteerFormScreen).
 * נטען דרך auth.js אחרי התחברות + אימות טלפון. כתובת בדרושים ובגמ"ח — כמו AddressLocationPicker (ShchunaKit.addr*, רחוב לא מזוהה נשמר כמו שהוא);
 * בהתנדבות — טקסט חופשי, כמו באפליקציה. טלפון ליצירת קשר ששונה מהמאומת — אימות SMS (verifyPhoneIfNeeded). */
(function () {
  var K = window.ShchunaKit;
  var JOB_CATS = [['education', 'חינוך והוראה'], ['healthcare', 'בריאות ורפואה'], ['retail', 'מכירות ושירות'], ['technology', 'טכנולוגיה והייטק'],
    ['hospitality', 'אירוח ומסעדנות'], ['construction', 'בנייה ותחזוקה'], ['administration', 'מינהל ומשרד'], ['community_service', 'שירותים קהילתיים'],
    ['elderly_care', 'טיפול בקשישים'], ['children_care', 'טיפול בילדים'], ['other', 'אחר']];
  var EMP = [['full_time', 'משרה מלאה'], ['part_time', 'משרה חלקית'], ['temporary', 'זמני'], ['freelance', 'פרילנס']];
  var GMACH_CATS = ['הלוואות', 'ביגוד', 'ציוד תינוקות', 'ריהוט', 'ספרים', 'מזון', 'מכשירי חשמל', 'שמלות כלה', 'חליפות חתן', 'כסאות ושולחנות',
    'כלי הגשה', 'מפות ומפיות', 'קישוטים לאירועים', 'ציוד לבר/בת מצווה', 'תפילין', 'ריבת אתרוגים', 'פלטות ומיחמים', 'תרופות', 'ציוד רפואי'];
  var PHONE_RE = /^(\+972|0)(5[0-9]|7[0-9]|[2-4]|[8-9])[0-9]{7}$/;
  var EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  var URL_RE = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  function phoneIsrael(v) { return PHONE_RE.test(String(v).replace(/[\s\-()]/g, '')); }
  function ymd(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function plusDays(n) { var d = new Date(); d.setDate(d.getDate() + n); return d; }
  function opt(list, sel) { return list.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === sel ? ' selected' : '') + '>' + o[1] + '</option>'; }).join(''); }
  function inp(name, label, o) {
    o = o || {};
    var t = o.type || 'text', req = o.req ? ' *' : '', sm = o.opt ? ' <small>לא חובה</small>' : '';
    var attrs = ' name="' + name + '"' + (o.max ? ' maxlength="' + o.max + '"' : '') + (o.ph ? ' placeholder="' + o.ph + '"' : '') + (o.ltr ? ' dir="ltr"' : '') + (o.extra || '');
    return '<label class="l">' + label + req + sm + (t === 'area'
      ? '<textarea' + attrs + ' rows="' + (o.rows || 4) + '"></textarea>'
      : '<input type="' + t + '"' + attrs + '>') + '</label>';
  }
  function expiry(defDays) {
    return '<label class="l">תוקף המודעה <small>' + (defDays ? 'ברירת מחדל: 30 יום' : 'לא חובה') + '</small><input type="date" name="exp" min="' + ymd(new Date()) + '" max="' + ymd(plusDays(365)) + '"' + (defDays ? ' value="' + ymd(plusDays(defDays)) + '"' : '') + '></label>';
  }
  function expIso(f) { var v = f.elements.exp.value; return v ? new Date(v + 'T23:59:59').toISOString() : null; }

  function shell(A, title, body, submit) {
    K.css();
    var d = A.open('<h2 id="sa-h">' + title + '</h2><form class="sp-f" novalidate>' + body +
      '<p class="sa-msg" hidden></p><button class="sa-b pri" type="submit">' + submit + '</button>' +
      '<p class="sa-small">המודעה תופיע באפליקציה מיד, ובאתר תוך כשעה. עריכה ומחיקה — באפליקציה.</p></form>', true);
    var f = d.querySelector('form');
    f.addEventListener('input', function () { A.setErr(''); });
    return f;
  }
  function failer(A, btn) {
    return function (e) {
      A.busy(btn, false);
      if (e === 'stop') return;
      var m = (e && (e.message || e.hint)) || '';
      if (/phone_not_verified|נדרש אימות טלפון/.test(m)) return A.reverify();
      A.setErr(e && e.userMsg ? e.userMsg : 'לא הצלחנו לפרסם. נסו שוב');
    };
  }
  function userErr(msg) { var e = new Error(msg); e.userMsg = msg; return e; }

  /* ── דרושים (jobs) ── */
  function job(cid, A) {
    var f = shell(A, 'פרסום משרה',
      inp('title', 'כותרת המשרה', { req: 1, max: 100, ph: 'למשל: מורה למתמטיקה' }) +
      inp('desc', 'תיאור מפורט', { req: 1, type: 'area', rows: 6, max: 3000 }) +
      '<div class="sp-row"><label class="l">תחום *<select name="cat">' + opt(JOB_CATS, 'other') + '</select></label>' +
      '<label class="l">היקף משרה *<select name="emp">' + opt(EMP, 'full_time') + '</select></label></div>' +
      inp('salary', 'מידע על שכר', { opt: 1, max: 100, ph: '10,000-12,000 ₪ / לפי ניסיון' }) +
      inp('company', 'שם החברה / הארגון', { req: 1, max: 100 }) +
      '<button type="button" class="sp-more" data-more>+ פרטים נוספים (דרישות, מיקום, תיאור החברה)</button>' +
      '<div class="sp-x" data-extra hidden>' +
        inp('req', 'דרישות כלליות', { opt: 1, type: 'area', rows: 3, max: 1500 }) +
        '<div class="sp-row">' + inp('exp_req', 'ניסיון נדרש', { opt: 1, max: 100 }) + inp('edu', 'השכלה נדרשת', { opt: 1, max: 100 }) + '</div>' +
        inp('loc', 'שם המקום', { opt: 1, max: 100, ph: 'שם החברה או המוסד' }) +
        K.addrHtml('addr', 'כתובת', 'הכתובת של מקום העבודה', false) +
        '<label class="sp-chk"><input type="checkbox" name="remote"> אפשרות לעבודה מרחוק</label>' +
        inp('cdesc', 'תיאור החברה / הארגון', { opt: 1, type: 'area', rows: 3, max: 1500 }) +
        inp('link', 'קישור להגשת מועמדות', { opt: 1, type: 'url', ltr: 1, max: 300 }) +
      '</div>' +
      '<div class="sp-row">' + inp('cname', 'איש קשר', { opt: 1, max: 60, extra: ' autocomplete="name"' }) + inp('phone', 'טלפון', { req: 1, type: 'tel', ltr: 1, extra: ' inputmode="tel"' }) + '</div>' +
      inp('email', 'אימייל', { opt: 1, type: 'email', ltr: 1, max: 120 }) +
      expiry(30) + '<div data-dup></div>', 'פרסם משרה');
    var btn = f.querySelector('[type=submit]'), E = f.elements, ad = K.addrBind(A, f, { name: 'addr', cid: cid });
    f.querySelector('[data-more]').addEventListener('click', function (e) { e.target.hidden = true; f.querySelector('[data-extra]').hidden = false; });
    K.prefill(A, E.cname, E.phone).then(function (u) { if (u.email && !E.email.value) E.email.value = u.email; });
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var v = function (n) { return (E[n].value || '').trim(); };
      if (!v('title')) return A.setErr('נא למלא כותרת');
      if (!v('desc')) return A.setErr('נא למלא תיאור');
      if (!v('company')) return A.setErr('נא למלא שם חברה או ארגון');
      if (!v('phone')) return A.setErr('נא למלא טלפון');
      if (!phoneIsrael(v('phone'))) return A.setErr('מספר טלפון לא תקין');
      if (v('email') && !EMAIL_RE.test(v('email'))) return A.setErr('כתובת אימייל לא תקינה');
      if (v('link') && !URL_RE.test(v('link'))) return A.setErr('כתובת URL לא תקינה');
      A.busy(btn, true, 'בודקים…');
      var L;
      K.addrResolve(A, ad, { cid: cid }).then(function (x) {
        L = x;
        return A.sb.from('jobs').select('id').eq('community_id', L.cid).ilike('title', K.ilikeEsc(v('title'))).ilike('company_name', K.ilikeEsc(v('company'))).eq('is_active', true).limit(1);
      }).then(function (r) {
        if (r.data && r.data.length) throw userErr('משרה בשם "' + v('title') + '" כבר קיימת עבור "' + v('company') + '"');
        return K.verifyContactPhone(A, f, v('phone'));
      }).then(function (okPhone) {
        if (!okPhone) throw userErr('יש לאמת את מספר הטלפון');
        A.busy(btn, true, 'מפרסמים…');
        var now = new Date().toISOString();
        return A.sb.from('jobs').insert({
          title: v('title'), description: v('desc'), job_type: 'paid', category: E.cat.value, employment_type: E.emp.value,
          salary_info: v('salary'), requirements: v('req'), experience_required: v('exp_req'), education_required: v('edu'),
          volunteer_hours: null, volunteer_duration: null, location_name: v('loc'), location_address: L.address || '',
          location_latitude: L.lat, location_longitude: L.lng, remote_option: E.remote.checked,
          company_name: v('company'), company_description: v('cdesc'), contact_person: v('cname'), contact_phone: v('phone'),
          contact_email: v('email'), application_link: v('link'), expires_at: expIso(f), community_id: L.cid,
          user_id: A.user.id, updated_at: now
        }).then(function (x) { if (x.error) throw x.error; });
      }).then(function () { K.doneView(A, 'job'); }, failer(A, btn));
    });
  }

  /* ── גמ"ח (gmachim) ── */
  function gmach(cid, A) {
    var cats = [];
    var f = shell(A, 'הוספת גמ״ח',
      inp('name', 'שם הגמ״ח', { req: 1, max: 100 }) +
      '<div class="sp-sec"><span>קטגוריות * <small style="font-weight:600;color:#8A94A6">(אפשר כמה)</small></span><div class="sp-chips" data-cats>' +
        GMACH_CATS.map(function (c) { return '<button type="button" data-cat="' + c + '" aria-pressed="false">' + c + '</button>'; }).join('') + '</div>' +
        '<input type="text" name="custom" maxlength="40" placeholder="קטגוריה אחרת? כתבו ולחצו Enter"></div>' +
      inp('desc', 'תיאור', { opt: 1, type: 'area', rows: 3, max: 1500 }) +
      '<div class="sp-row">' + inp('manager', 'שם המנהל', { req: 1, max: 60 }) + inp('phone', 'טלפון', { req: 1, type: 'tel', ltr: 1, extra: ' inputmode="tel"' }) + '</div>' +
      K.addrHtml('addr', 'כתובת', 'רחוב ומספר (או רק רחוב)', false) + '<div data-dup></div>', 'הוסף גמ״ח');
    var btn = f.querySelector('[type=submit]'), E = f.elements, box = f.querySelector('[data-cats]'), ad = K.addrBind(A, f, { name: 'addr', cid: cid });
    K.prefill(A, E.manager, E.phone);
    function toggle(c) {
      var i = cats.indexOf(c); if (i >= 0) cats.splice(i, 1); else cats.push(c);
      [].forEach.call(box.querySelectorAll('[data-cat]'), function (b) { b.setAttribute('aria-pressed', String(cats.indexOf(b.getAttribute('data-cat')) >= 0)); });
    }
    box.addEventListener('click', function (e) { var b = e.target.closest('[data-cat]'); if (b) { A.setErr(''); toggle(b.getAttribute('data-cat')); } });
    E.custom.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return; e.preventDefault();
      var c = E.custom.value.trim(); if (!c) return;
      if (!box.querySelector('[data-cat="' + c.replace(/"/g, '') + '"]')) {
        var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-cat', c); b.textContent = c; box.appendChild(b);
      }
      if (cats.indexOf(c) < 0) toggle(c);
      E.custom.value = '';
    });
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var v = function (n) { return (E[n].value || '').trim(); };
      if (v('custom') && cats.indexOf(v('custom')) < 0) { cats.push(v('custom')); E.custom.value = ''; }
      if (!v('name')) return A.setErr('נא להזין שם גמ״ח');
      if (!cats.length) return A.setErr('יש לבחור לפחות קטגוריה אחת');
      if (!v('manager')) return A.setErr('נא להזין שם מנהל');
      if (!v('phone')) return A.setErr('נא להזין מספר טלפון');
      A.busy(btn, true, 'בודקים…');
      var L;
      K.addrResolve(A, ad, { cid: cid }).then(function (x) {
        L = x;
        var q = A.sb.from('gmachim').select('id').eq('community_id', L.cid).ilike('name', K.ilikeEsc(v('name')));
        if (L.address) q = q.ilike('address', K.ilikeEsc(L.address));
        return q.limit(1);
      }).then(function (r) {
        if (r.data && r.data.length) throw userErr('גמ״ח עם שם "' + v('name') + '" כבר קיים במערכת');
        return K.verifyContactPhone(A, f, v('phone'));
      }).then(function (okPhone) {
        if (!okPhone) throw userErr('יש לאמת את מספר הטלפון');
        A.busy(btn, true, 'מפרסמים…');
        return A.sb.from('gmachim').insert({
          community_id: L.cid, user_id: A.user.id, name: v('name'), categories: cats, manager: v('manager'), phone: v('phone'),
          address: L.address || null, description: v('desc') || null, weekly_schedule: null, latitude: L.lat, longitude: L.lng
        }).then(function (x) { if (x.error) throw x.error; });
      }).then(function () { K.doneView(A, 'gmach', { text: 'הגמ״ח כבר באפליקציה, ויופיע כאן באתר תוך כשעה.', note: 'רוצים להוסיף שעות פעילות, לערוך או להסיר? זה באפליקציה, עם אותו חשבון.' }); }, failer(A, btn));
    });
  }

  /* ── התנדבות (volunteering) ── */
  function volunteer(cid, A) {
    var f = shell(A, 'פרסום התנדבות',
      inp('title', 'כותרת / תחום ההתנדבות', { req: 1, max: 100 }) +
      inp('desc', 'תיאור ההתנדבות', { req: 1, type: 'area', rows: 5, max: 3000 }) +
      '<div class="sp-row">' + inp('hours', 'שעות נדרשות', { opt: 1, max: 60 }) + inp('freq', 'תדירות', { opt: 1, max: 60 }) + '</div>' +
      '<div class="sp-row">' + inp('cname', 'שם איש הקשר', { req: 1, max: 60 }) + inp('phone', 'טלפון ליצירת קשר', { req: 1, type: 'tel', ltr: 1, extra: ' inputmode="tel"' }) + '</div>' +
      '<button type="button" class="sp-more" data-more>+ פרטים נוספים (ארגון, מיקום, אימייל)</button>' +
      '<div class="sp-x" data-extra hidden>' +
        inp('org', 'שם הארגון / עמותה', { opt: 1, max: 100 }) +
        inp('orgd', 'תיאור הארגון', { opt: 1, type: 'area', rows: 3, max: 1500 }) +
        inp('loc', 'שם המקום', { opt: 1, max: 100 }) +
        inp('addr', 'כתובת', { opt: 1, max: 150, ph: 'רחוב ומספר' }) +
        inp('email', 'אימייל', { opt: 1, type: 'email', ltr: 1, max: 120 }) +
      '</div>' + expiry(0), 'שמור ופרסם');
    var btn = f.querySelector('[type=submit]'), E = f.elements;
    f.querySelector('[data-more]').addEventListener('click', function (e) { e.target.hidden = true; f.querySelector('[data-extra]').hidden = false; });
    K.prefill(A, E.cname, E.phone);
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var v = function (n) { return (E[n].value || '').trim(); }, nn = function (n) { return v(n) || null; };
      if (!v('title')) return A.setErr('נא למלא כותרת');
      if (!v('desc')) return A.setErr('נא למלא תיאור');
      if (!v('cname')) return A.setErr('נא למלא שם איש קשר');
      if (!v('phone')) return A.setErr('נא למלא טלפון');
      A.busy(btn, true, 'מפרסמים…');
      A.sb.from('volunteering').insert({
        community_id: cid, title: v('title'), description: v('desc'), organization_name: nn('org'), organization_description: nn('orgd'),
        volunteer_hours: nn('hours'), frequency: nn('freq'), location_name: nn('loc'), location_address: nn('addr'),
        contact_person: v('cname'), contact_phone: v('phone'), contact_email: nn('email'), is_active: true,
        expires_at: expIso(f), user_id: A.user.id, updated_at: new Date().toISOString()
      }).then(function (x) { if (x.error) throw x.error; }).then(function () { K.doneView(A, 'volunteer'); }, failer(A, btn));
    });
  }

  window.ShchunaForms = window.ShchunaForms || {};
  window.ShchunaForms.job = job;
  window.ShchunaForms.gmach = gmach;
  window.ShchunaForms.volunteer = volunteer;
})();
