/* מדידת כניסות לאתר — אנונימי, בלי עוגיות ובלי צד שלישי.
 * כותב לטבלה web_events דרך הפונקציה log_web_event בלבד (הטבלה סגורה לקריאה מבחוץ).
 * לא לספור את הדפדפן שלי: להיכנס פעם אחת ל- https://shchuna.co.il/?notrack=1  (לביטול: ?notrack=0)
 * אירועים מקוד אחר: window.shchunaTrack('post'|'coupon'|'recommend', target) */
(function () {
  var URL = 'https://mebomrqnfnbqijiuawdh.supabase.co/rest/v1/rpc/log_web_event';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lYm9tcnFuZm5icWlqaXVhd2RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkxOTc3MDEsImV4cCI6MjA1NDc3MzcwMX0.OSpzG4pnsgIiOEefWK0Z29ZHOo12bIhp0QXTdk2Hsg4';
  var SK = 'sb-mebomrqnfnbqijiuawdh-auth-token';
  var NOT_HOOD = { b: 1, w: 1, app: 1, js: 1, img: 1, 'my-business': 1, 'minyanim-har-homa': 1 };

  function ls(fn) { try { return fn(window.localStorage); } catch (e) { return null; } }
  window.shchunaTrack = function () {};

  // הפעלה / כיבוי לדפדפן הזה
  var q = location.search;
  if (/[?&]notrack=1/.test(q)) ls(function (s) { s.setItem('shchuna.notrack', '1'); });
  if (/[?&]notrack=0/.test(q)) ls(function (s) { s.removeItem('shchuna.notrack'); });
  if (ls(function (s) { return s.getItem('shchuna.notrack'); }) === '1') return;
  if (location.hostname !== 'shchuna.co.il' && !window.__trackTest) return;
  var ua = navigator.userAgent || '';
  if (navigator.webdriver || /bot|crawl|spider|slurp|lighthouse|headless|preview/i.test(ua)) return;

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16);
    });
  }
  var visitor = ls(function (s) { var v = s.getItem('shchuna.vid'); if (!v) { v = uuid(); s.setItem('shchuna.vid', v); } return v; }) || uuid();

  // מאיפה הגיעו (רק שם האתר, לא הכתובת המלאה)
  var refHost = '', refKind = 'direct';
  try { if (document.referrer) refHost = new window.URL(document.referrer).hostname.replace(/^www\./, ''); } catch (e) {}
  if (refHost) {
    // חזרה מהתחברות (Google/Apple) — לא הגעה מחיפוש
    if (refHost === location.hostname || /^(accounts\.google\.|appleid\.apple\.com$|[a-z0-9]+\.supabase\.co$)/.test(refHost)) { refKind = 'internal'; refHost = ''; }
    else if (/(^|\.)google\./.test(refHost)) refKind = 'google';
    else if (/whatsapp|^wa\.me$/.test(refHost)) refKind = 'whatsapp';
    else if (/(^|\.)(facebook\.com|fb\.com|fb\.me)$/.test(refHost)) refKind = 'facebook';
    else if (/instagram\.com$/.test(refHost)) refKind = 'instagram';
    else refKind = 'other';
  }
  var utm = null;
  try { var p = new window.URLSearchParams(q); utm = p.get('utm_source'); if (utm && p.get('utm_campaign')) utm += ':' + p.get('utm_campaign'); } catch (e) {}

  var os = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'ios'
    : /Android/.test(ua) ? 'android' : /Windows/.test(ua) ? 'windows' : /Macintosh/.test(ua) ? 'mac' : 'other';
  var device = /iPad|Tablet/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) || (/Android/.test(ua) && !/Mobile/.test(ua)) ? 'tablet'
    : /Mobi|iPhone|Android/.test(ua) ? 'mobile' : 'desktop';

  // עמוד ושכונה מתוך הכתובת: /gilo/ → בית שכונה, /gilo/minyanim/ → minyanim, /gilo/biz/x/ → biz:item
  var path = location.pathname;
  try { path = decodeURIComponent(path); } catch (e) {}
  var seg = path.split('/').filter(Boolean), hood = null, type = 'landing';
  if (seg.length) {
    if (!NOT_HOOD[seg[0]] && /^[a-z0-9-]+$/.test(seg[0])) {
      hood = seg[0];
      type = seg.length === 1 ? 'home' : seg[1] + (seg.length > 2 ? ':item' : '');
    } else type = seg[0];
  }
  var loggedIn = !!ls(function (s) { return s.getItem(SK); });

  function send(kind, target) {
    var body = JSON.stringify({
      p_kind: kind, p_path: path, p_visitor: visitor, p_page_type: type.slice(0, 30), p_hood: hood,
      p_ref_kind: refKind, p_ref_host: refHost || null, p_utm: utm, p_target: target || null,
      p_device: device, p_os: os, p_logged_in: loggedIn
    });
    try {
      fetch(URL, { method: 'POST', keepalive: true, headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' }, body: body })['catch'](function () {});
    } catch (e) {}
  }
  window.shchunaTrack = function (kind, target) { send(kind, target); };

  // כניסה לעמוד — אחרי שהעמוד נטען, כדי לא להאט אותו
  function view() { send('view'); }
  if (document.readyState === 'complete') setTimeout(view, 0); else window.addEventListener('load', function () { setTimeout(view, 0); });

  var lastT = null, lastAt = 0;
  // לחיצות הורדה: חנויות, /b/ (מפנה לחנות), והאתר הדינמי /app/
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var h = a.href || '', t = null;
    if (/apps\.apple\.com/.test(h)) t = 'ios';
    else if (/play\.google\.com/.test(h)) t = 'android';
    else if (/^https?:\/\/[^/]*shchuna\.co\.il\/b\/?(\?|#|$)/.test(h) || a.getAttribute('href') === '/b/') t = 'b';
    else if (/^https?:\/\/[^/]*shchuna\.co\.il\/app\//.test(h) || /^\/app\//.test(a.getAttribute('href') || '')) {
      if (a.hasAttribute('data-post') || a.hasAttribute('data-coupon') || a.hasAttribute('data-rec')) return; // נתפס ע"י auth.js
      t = 'webapp';
    }
    // לחיצה כפולה — נספרת פעם אחת (3 שניות)
    if (t) { var now = Date.now(); if (t === lastT && now - lastAt < 3000) return; lastT = t; lastAt = now; send('download', t); }
  }, true);
})();
