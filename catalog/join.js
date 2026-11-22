/* קטלוג בשכונה — הצטרפות סוכן לצוות של משרד תיווך.
 * מגיעים לכאן מקישור שמנהל המשרד שולח: /catalog/join/?c=<כתובת המשרד>&k=<קוד>.
 * הסוכן מתחבר עם החשבון שלו בשכונה ומאשר את השם שיוצג. הטלפון נלקח מהחשבון (מאומת), לא מהטופס.
 * כל הבדיקות בשרת: bizcat_join_info, bizcat_join, bizcat_leave.
 */
(function () {
  'use strict';
  var A, sb, user, info = null, busy = false, booting = false, armLeave = false;
  var q = new URLSearchParams(location.search), slug = (q.get('c') || '').toLowerCase(), code = q.get('k') || '';
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function gate(html) { $('gate').innerHTML = '<div class="gate join">' + html + '</div>'; }
  function pageLink() { return '<a class="btn btn-blue" href="/catalog/' + encodeURIComponent(slug) + '/">לעמוד המשרד</a>'; }
  var MAIL = '<a href="mailto:info@shchuna.co.il">info@shchuna.co.il</a>';
  function badLink() { gate('<h1>הקישור לא בתוקף</h1><p class="lead">ייתכן שהמשרד החליף את קישור ההצטרפות. בקשו ממנהל המשרד קישור חדש, או כתבו לנו: ' + MAIL + '</p>'); }
  function errText(e) {
    var m = e && e.message || '';
    if (/bad_link/.test(m)) return null;
    if (/phone_required/.test(m)) return 'כדי להצטרף צריך טלפון מאומת בחשבון. מאמתים באפליקציית שכונה, ואז חוזרים לקישור.';
    if (/other_office/.test(m)) return 'החשבון הזה כבר רשום בצוות של משרד אחר. סוכן יכול להיות רשום במשרד אחד.';
    if (/bad_name/.test(m)) return 'השם צריך להיות בין 2 ל־40 תווים, והתפקיד עד 40 תווים.';
    return 'הפעולה נכשלה. בדקו את החיבור ונסו שוב.';
  }
  function form(err) {
    var here = info.member_here;
    if (info.other_office) return gate('<h1>כבר רשומים במשרד אחר</h1><p class="lead">החשבון הזה רשום בצוות של ' + esc(info.other_office) + '. סוכן יכול להיות רשום במשרד אחד. כדי לעבור משרד, עוזבים קודם את המשרד הקודם דרך קישור ההצטרפות שלו, או כותבים לנו: ' + MAIL + '</p>');
    if (!info.verified) return gate('<h1>הצטרפות לצוות של ' + esc(info.title) + '</h1><p class="lead">כדי להצטרף צריך טלפון מאומת בחשבון שלכם בשכונה. מאמתים את הטלפון באפליקציה, ואז נכנסים שוב לקישור הזה.</p>');
    gate('<h1>' + (here ? 'אתם בצוות של ' : 'הצטרפות לצוות של ') + esc(info.title) + '</h1>' +
      '<p class="lead">' + (here ? 'אפשר לעדכן כאן את השם והתפקיד שמוצגים בעמוד המשרד.' : 'אחרי ההצטרפות, הנכסים שאתם מפרסמים בשכונה עם החשבון הזה יופיעו גם בעמוד המשרד.') + '</p>' +
      (err ? '<p class="ferr" role="alert">' + esc(err) + '</p>' : '') +
      '<form id="joinForm" novalidate style="display:flex;flex-direction:column;gap:6px">' +
      '<label for="jName">השם שיוצג *</label><input id="jName" maxlength="40" required value="' + esc(info.name) + '" autocomplete="name">' +
      '<label for="jTitle">תפקיד (לא חובה)</label><input id="jTitle" maxlength="40" value="' + esc(info.role_title || '') + '" placeholder="למשל: סוכן נדל״ן">' +
      '<label for="jPhone">טלפון</label><input id="jPhone" readonly dir="ltr" value="' + esc(info.phone) + '">' +
      '<span class="hint">הטלפון המאומת בחשבון שלכם. הוא והשם יוצגו בעמוד המשרד, כדי שלקוחות יוכלו לפנות אליכם בוואטסאפ על הנכסים שלכם.</span>' +
      '<button type="submit" class="btn btn-blue" style="margin-top:10px">' + (here ? 'שמירה' : 'הצטרפות לצוות') + '</button></form>' +
      (here ? pageLink().replace('btn btn-blue', 'btn btn-ghost') + '<button type="button" class="linkbtn" id="jLeave">' + (armLeave ? 'לחצו שוב כדי לעזוב את המשרד' : 'עזיבת המשרד') + '</button>' : ''));
  }
  function join() {
    if (busy) return;
    var name = $('jName').value.trim(), title = $('jTitle').value.trim();
    info.name = name; info.role_title = title;
    if (name.length < 2) return form('כתבו את השם שיוצג בעמוד המשרד.');
    busy = true;
    sb.rpc('bizcat_join', { p_slug: slug, p_code: code, p_name: name, p_title: title || null }).then(function (r) {
      busy = false; if (r.error) throw r.error;
      gate('<h1>' + (info.member_here ? 'נשמר' : 'הצטרפתם לצוות של ' + esc(info.title)) + '</h1><p class="lead">הנכסים שאתם מפרסמים בשכונה עם החשבון הזה מופיעים בעמוד המשרד, עם השם והוואטסאפ שלכם. מפרסמים ועורכים נכסים באפליקציה או באתר שכונה, כרגיל.</p>' + pageLink());
    }).catch(function (e) { busy = false; var t = errText(e); t ? form(t) : badLink(); });
  }
  function leave() {
    if (!armLeave) { armLeave = true; return form(); }
    sb.rpc('bizcat_leave').then(function (r) {
      if (r.error) throw r.error;
      if (r.data !== true) return form('מנהל לא יכול לעזוב מכאן. כתבו לנו: info@shchuna.co.il');
      gate('<h1>עזבתם את הצוות</h1><p class="lead">הנכסים שלכם כבר לא מופיעים בעמוד של ' + esc(info.title) + '. הם נשארים אצלכם בשכונה כרגיל.</p>');
    }).catch(function () { form('הפעולה נכשלה. נסו שוב.'); });
  }
  function boot() {
    A = window.ShchunaAuth;
    if (!A) return gate('<h1>לא הצלחנו לטעון את העמוד</h1><p class="lead">נסו לרענן.</p>');
    if (!slug || !code) return badLink();
    if (booting) return; booting = true;
    A.getUser().then(function (r) {
      booting = false; sb = r.sb; user = r.user;
      if (!user) {
        gate('<h1>הצטרפות לצוות משרד</h1><p class="lead">כדי להצטרף צריך להתחבר לחשבון שלכם בשכונה, אותו חשבון שבו אתם מפרסמים נכסים.</p><button type="button" class="btn btn-blue" id="doLogin">התחברות</button>');
        $('doLogin').addEventListener('click', function () { A.login('כדי להצטרף לצוות המשרד'); });
        return;
      }
      return sb.rpc('bizcat_join_info', { p_slug: slug, p_code: code }).then(function (r2) {
        if (r2.error) { if (/bad_link/.test(r2.error.message || '')) return badLink(); throw r2.error; }
        info = r2.data;
        if (!info.member_here) return form();
        /* כבר בצוות: מציגים את השם והתפקיד כפי שהם רשומים במשרד */
        return sb.from('bizcat_members').select('display_name,title').eq('user_id', user.id).maybeSingle().then(function (m) {
          if (m.data) { info.name = m.data.display_name; info.role_title = m.data.title || ''; }
          form();
        });
      });
    }).catch(function () { booting = false; gate('<h1>לא הצלחנו לטעון</h1><p class="lead">בדקו את החיבור לאינטרנט ונסו לרענן את העמוד.</p>'); });
  }
  document.addEventListener('submit', function (e) { if (e.target.id === 'joinForm') { e.preventDefault(); join(); } });
  document.addEventListener('click', function (e) { if (e.target.id === 'jLeave') leave(); });
  document.addEventListener('shchuna:auth', function (e) {
    var u = e.detail && e.detail.user;
    if (u && !user) boot(); else if (!u && user) { user = null; info = null; boot(); }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
