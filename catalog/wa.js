/* קטלוג בשכונה — נכס שמתווך שלח בוואטסאפ למספר של שכונה.
 * מגיעים לכאן מהקישור שנשלח בתשובה: /catalog/wa/?d=<מזהה טיוטה>.
 * העמוד קורא את הטיוטה (פונקציית השרת wa-intake, רק לבעל הטיוטה), ופותח את "פרסום מהיר למתווכים" הקיים עם הטקסט והתמונות.
 * הפרסום עצמו הוא הטופס הרגיל של האתר (js/property.js), בחשבון של המתווך. אחרי הפרסום הטיוטה נסגרת והקבצים נמחקים.
 */
(function () {
  'use strict';
  var A, sb, user, draft = null, booting = false, busy = false;
  var id = new URLSearchParams(location.search).get('d') || '';
  function $(x) { return document.getElementById(x); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function gate(html) { $('gate').innerHTML = '<div class="gate join">' + html + '</div>'; }
  var MAIL = '<a href="mailto:info@shchuna.co.il">info@shchuna.co.il</a>';
  function call(action) {
    return sb.functions.invoke('wa-intake', { body: { action: action, id: id } }).then(function (r) {
      if (r.error) { var e = new Error('fn'); e.status = (r.error.context && r.error.context.status) || 0; throw e; }
      return r.data;
    });
  }
  function missing() { gate('<h1>הקישור לא נמצא</h1><p class="lead">ייתכן שהוא נשלח לחשבון אחר, או שעבר יותר משבוע מאז ששלחתם את ההודעה. שלחו את המודעה שוב בוואטסאפ, או כתבו לנו: ' + MAIL + '</p>'); }
  function officeLink(cls) { return draft && draft.slug ? '<a class="btn ' + (cls || 'btn-blue') + '" href="/catalog/' + encodeURIComponent(draft.slug) + '/">לעמוד המשרד</a>' : ''; }
  function show(err) {
    var n = draft.images.length, t = draft.text.trim();
    gate('<h1>נכס מוואטסאפ</h1><p class="lead">' + esc(draft.title) + '</p>' +
      (err ? '<p class="ferr" role="alert">' + esc(err) + '</p>' : '') +
      (t ? '<label>הטקסט שהתקבל</label><div class="wtext">' + esc(t.length > 400 ? t.slice(0, 400) + '…' : t) + '</div>' : '<p class="hint">לא התקבל טקסט. אפשר להדביק אותו בשלב הבא, או לסמן תמונה כפוסטר.</p>') +
      '<label>תמונות שהתקבלו: ' + n + '</label>' + (n ? '<div class="wimgs">' + draft.images.map(function (u) { return '<img src="' + esc(u) + '" alt="" loading="lazy">'; }).join('') + '</div>' : '') +
      '<button type="button" class="btn btn-blue" id="wGo" style="margin-top:10px">המשך לבדיקה ולפרסום</button>' +
      '<span class="hint">בשלב הבא הפרטים מתמלאים אוטומטית מהטקסט, ואתם בודקים ומתקנים לפני הפרסום. שלחתם עוד תמונות בינתיים? רעננו את העמוד.</span>');
  }
  function toFiles() {
    return Promise.all(draft.images.map(function (u, i) {
      return fetch(u).then(function (r) { if (!r.ok) throw new Error('img'); return r.blob(); })
        .then(function (b) { return new File([b], 'wa-' + (i + 1) + '.jpg', { type: b.type || 'image/jpeg' }); }, function () { return null; });
    })).then(function (fs) { return fs.filter(Boolean); });
  }
  function go() {
    if (busy) return; busy = true;
    var btn = $('wGo'); btn.disabled = true; btn.textContent = 'מכינים את התמונות…';
    toFiles().then(function (files) {
      busy = false;
      if (files.length < draft.images.length && !files.length) return show('לא הצלחנו לטעון את התמונות. בדקו את החיבור ונסו שוב.');
      window.__SHCHUNA_WA = { text: draft.text, files: files, onDone: published };
      var b = document.createElement('button'); b.type = 'button'; b.hidden = true; b.setAttribute('data-post', 'broker'); b.setAttribute('data-c', draft.community_id);
      document.body.appendChild(b); b.click(); b.remove();
      show();
    });
  }
  function published() {
    call('done').catch(function () {});
    gate('<h1>הנכס פורסם</h1><p class="lead">הוא מופיע בעמוד של ' + esc(draft.title) + ' ובאפליקציה. לנכס הבא, שלחו עוד מודעה בוואטסאפ.</p>' + officeLink());
  }
  function boot() {
    A = window.ShchunaAuth;
    if (!A) return gate('<h1>לא הצלחנו לטעון את העמוד</h1><p class="lead">נסו לרענן.</p>');
    if (!/^[0-9a-f-]{36}$/i.test(id)) return missing();
    if (booting) return; booting = true;
    A.getUser().then(function (r) {
      booting = false; sb = r.sb; user = r.user;
      if (!user) {
        gate('<h1>נכס מוואטסאפ</h1><p class="lead">כדי לבדוק ולפרסם את הנכס צריך להתחבר לחשבון שלכם בשכונה, זה שהטלפון שלו שלח את ההודעה.</p><button type="button" class="btn btn-blue" id="doLogin">התחברות</button>');
        $('doLogin').addEventListener('click', function () { A.login('כדי לפרסם את הנכס'); });
        return;
      }
      return call('get').then(function (d) {
        draft = d;
        if (!draft.community_id) return gate('<h1>חסרה שכונה למשרד</h1><p class="lead">לא הצלחנו לקבוע את השכונה של המשרד. כתבו לנו: ' + MAIL + '</p>');
        show();
      }, function (e) {
        if (e.status === 410) return gate('<h1>הנכס הזה כבר פורסם</h1><p class="lead">לנכס נוסף, שלחו מודעה חדשה בוואטסאפ.</p>');
        if (e.status === 404 || e.status === 400) return missing();
        if (e.status === 401) return gate('<h1>החיבור פג</h1><p class="lead">התחברו מחדש לחשבון שלכם בשכונה, ורעננו את העמוד.</p>');
        gate('<h1>לא הצלחנו לטעון</h1><p class="lead">בדקו את החיבור לאינטרנט ונסו לרענן את העמוד.</p>');
      });
    }).catch(function () { booting = false; gate('<h1>לא הצלחנו לטעון</h1><p class="lead">בדקו את החיבור לאינטרנט ונסו לרענן את העמוד.</p>'); });
  }
  document.addEventListener('click', function (e) { if (e.target.id === 'wGo') go(); });
  document.addEventListener('shchuna:auth', function (e) {
    var u = e.detail && e.detail.user;
    if (u && !user) boot(); else if (!u && user) { user = null; draft = null; boot(); }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
