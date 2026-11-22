/* קטלוג בשכונה — עמוד מתווך (קטלוג מסוג "דירות").
 * הדירות אינן נשמרות בקטלוג: הן נקראות חי מטבלאות האפליקציה (approve_property, approved_rental_properties)
 * דרך הפונקציה bizcat_properties(slug), שמחזירה את הנכסים של בעל הקטלוג. כך דירה שעולה באפליקציה או באתר מופיעה כאן מיד.
 * אין רשימת בחירה: הלקוח פונה על נכס מסוים בוואטסאפ.
 * נטען מ-catalog.js רק כשסוג הקטלוג הוא properties.
 */
(function () {
  'use strict';
  var H, C, sale = [], rent = [], byId = {};
  var st = { tab: 'sale', type: '', rooms: '', maxPrice: '', minArea: '', sort: 'new', open: null, img: 0 };
  var TYPES = { apartment: 'דירה', cottage: 'קוטג׳', duplex: 'דופלקס', penthouse: 'פנטהאוז', gardenApartment: 'דירת גן', lot: 'מגרש', business: 'נכס מסחרי', other: 'נכס' };
  var HOUSE = '<path d="M3 11.5L12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>';
  function $(id) { return document.getElementById(id); }
  function esc(s) { return H.esc(s); }
  function num(v) { return v == null || v === '' ? null : Number(v); }
  function typeOf(p) { return TYPES[p.type] || 'נכס'; }
  function roomsTxt(p) { var r = num(p.rooms); return r ? (r === 1 ? 'חדר אחד' : r + ' חדרים') : ''; }
  function floorTxt(p) { var f = num(p.floor); if (f == null) return ''; var t = num(p.total_floors); return (f === 0 ? 'קומת קרקע' : 'קומה ' + f) + (t ? ' מתוך ' + t : ''); }
  function priceTxt(p) { var v = num(p.price); return v ? H.fmt(v) + (p.rent ? ' לחודש' : '') : 'מחיר לא צוין'; }
  function titleOf(p) { return [typeOf(p), roomsTxt(p)].filter(Boolean).join(', '); }
  function placeOf(p) { var a = (p.address || '').trim(), h = (p.hood || '').trim(); return a && h && a.indexOf(h) < 0 ? a + ', ' + h : (a || h); }
  function imgs(p) { return Array.isArray(p.images) ? p.images.filter(Boolean) : []; }
  function list() { return st.tab === 'sale' ? sale : rent; }

  function load() {
    return fetch(H.SB_URL + '/rest/v1/rpc/bizcat_properties', {
      method: 'POST',
      headers: { apikey: H.SB_KEY, Authorization: 'Bearer ' + (H.token || H.SB_KEY), 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_slug: C.slug })
    }).then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); }).then(function (j) {
      j = j || {};
      sale = (j.sale || []).map(function (p) { p.rent = false; return p; });
      rent = (j.rent || []).map(function (p) { p.rent = true; return p; });
      sale.concat(rent).forEach(function (p) { byId[p.id] = p; });
      if (!sale.length && rent.length) st.tab = 'rent';
    });
  }

  /* ── מסגרת: מסתירים את חלקי קטלוג המוצרים ומוסיפים לשוניות וסינון ── */
  function frame() {
    /* ניסוחים שמתאימים למתווך במקום לקטלוג מוצרים */
    document.title = C.title + ' | נכסים בשכונה';
    var md = document.querySelector('meta[name=description]'); if (md) md.setAttribute('content', (C.description || C.title) + ' — עמוד מתווך בשכונה');
    var topr = document.querySelector('.topr span'); if (topr) topr.textContent = 'עמוד מתווך בשכונה';
    var pv = $('preview'); if (pv && pv.firstChild) pv.firstChild.nodeValue = 'תצוגה מקדימה — העמוד עדיין לא פורסם, ורק אתם רואים אותו. ';
    var db = $('demoBar'); if (db && !db.hidden) db.innerHTML = 'זו <b>הדגמה</b> של עמוד מתווך בשכונה. המשרד לדוגמה בלבד.';
    document.querySelectorAll('[data-wa]').forEach(function (a) { if (C.whatsapp) a.href = H.waUrl('שלום, הגעתי מהעמוד שלכם ב"שכונה".'); });
    if (!C.header_image_url) ['logoMark', 'logoMark2'].forEach(function (id) { $(id).innerHTML = H.ico(HOUSE); });
    ['cats', 'featuredSec', 'note'].forEach(function (id) { var el = $(id); if (el) el.hidden = true; });
    var s = document.querySelector('.search'); if (s) s.hidden = true;
    var perks = document.querySelector('.perks'); if (perks) perks.hidden = true;
    document.querySelectorAll('[data-go="cats"]').forEach(function (b) { b.hidden = true; });
    document.querySelectorAll('[data-w]').forEach(function (el) { el.textContent = el.getAttribute('data-w').replace('{W}', 'נכסים'); });
    var total = sale.length + rent.length, bits = [];
    bits.push(total === 1 ? 'נכס אחד' : total + ' נכסים');
    if (sale.length && rent.length) { bits.push(sale.length + ' למכירה'); bits.push(rent.length + ' להשכרה'); }
    var lic = (C.license_no || '').trim(); if (lic) bits.push('רישיון תיווך ' + lic);
    var area = (C.service_area || '').trim();
    $('heroArea').hidden = false;
    $('heroArea').textContent = (area ? area + ' · ' : '') + bits.join(' · ');
    $('howSteps').innerHTML = [
      ['בוחרים נכס', 'עוברים על הנכסים, ומסננים לפי חדרים, מחיר וגודל.'],
      ['שולחים הודעה', 'בלחיצה אחת נפתחת הודעת וואטסאפ עם פרטי הנכס שמעניין אתכם.'],
      ['מתאמים ביקור', 'חוזרים אליכם עם פרטים נוספים, ומתאמים ביקור בנכס.']
    ].map(function (x, i) { return '<li><span class="num">' + (i + 1) + '</span><div><b>' + esc(x[0]) + '</b><p>' + esc(x[1]) + '</p></div></li>'; }).join('');
    var head = document.querySelector('#all .sec-h');
    var box = document.createElement('div'); box.className = 'pbar'; box.id = 'pbar';
    head.parentNode.insertBefore(box, head);
    var d = document.createElement('div'); d.className = 'shade'; d.id = 'pshade'; d.hidden = true;
    d.innerHTML = '<div class="dialog pdlg" role="dialog" aria-modal="true" aria-labelledby="pTitle"></div>';
    $('wrap').appendChild(d);
  }
  function opt(v, label, cur) { return '<option value="' + v + '"' + (String(cur) === String(v) ? ' selected' : '') + '>' + label + '</option>'; }
  function renderBar() {
    var types = {}; list().forEach(function (p) { if (p.type) types[p.type] = 1; });
    var tk = Object.keys(types);
    $('pbar').innerHTML =
      (sale.length && rent.length ? '<div class="ptabs" role="tablist">' +
        '<button type="button" role="tab" data-ptab="sale" aria-selected="' + (st.tab === 'sale') + '">מכירה <span>' + sale.length + '</span></button>' +
        '<button type="button" role="tab" data-ptab="rent" aria-selected="' + (st.tab === 'rent') + '">השכרה <span>' + rent.length + '</span></button></div>' : '') +
      '<div class="pfilters">' +
      (tk.length > 1 ? '<label>סוג נכס<select data-pf="type">' + opt('', 'הכל', st.type) + tk.map(function (t) { return opt(t, TYPES[t] || t, st.type); }).join('') + '</select></label>' : '') +
      '<label>חדרים<select data-pf="rooms">' + opt('', 'הכל', st.rooms) + [2, 3, 4, 5, 6].map(function (n) { return opt(n, n + '+', st.rooms); }).join('') + '</select></label>' +
      '<label>מחיר עד (₪)<input type="number" inputmode="numeric" min="0" data-pf="maxPrice" value="' + esc(st.maxPrice) + '" dir="ltr"></label>' +
      '<label>שטח מינימלי (מ״ר)<input type="number" inputmode="numeric" min="0" data-pf="minArea" value="' + esc(st.minArea) + '" dir="ltr"></label>' +
      '<label>מיון<select data-pf="sort">' + opt('new', 'חדשים קודם', st.sort) + opt('cheap', 'מחיר: מהנמוך', st.sort) + opt('dear', 'מחיר: מהגבוה', st.sort) + '</select></label>' +
      '<button type="button" class="pclear" data-pclear="1" hidden>ביטול סינון</button>' +
      '</div>';
  }
  function filtered() {
    var mp = num(st.maxPrice), ma = num(st.minArea), mr = num(st.rooms);
    var out = list().filter(function (p) {
      return (!st.type || p.type === st.type) && (!mr || num(p.rooms) >= mr) &&
        (!mp || (num(p.price) && num(p.price) <= mp)) && (!ma || (num(p.area) && num(p.area) >= ma));
    });
    if (st.sort !== 'new') out = out.slice().sort(function (a, b) {
      var x = num(a.price), y = num(b.price); if (!x) return 1; if (!y) return -1; return st.sort === 'cheap' ? x - y : y - x;
    });
    return out;
  }
  function card(p) {
    var im = imgs(p), facts = [num(p.area) ? num(p.area) + ' מ״ר' : '', floorTxt(p).split(' מתוך ')[0]].filter(Boolean);
    return '<article class="card pcard"><button type="button" class="open" data-popen="' + esc(p.id) + '" aria-label="פרטים: ' + esc(titleOf(p)) + '">' +
      '<div class="pic">' + (im.length ? '<img src="' + esc(im[0]) + '" alt="" loading="lazy" decoding="async">' + (im.length > 1 ? '<span class="more">' + im.length + ' תמונות</span>' : '') : H.ico(HOUSE)) + '</div>' +
      '<div class="cbody"><h3>' + esc(titleOf(p)) + '</h3><p>' + esc(placeOf(p)) + '</p>' +
      (facts.length ? '<div class="pfacts">' + facts.map(function (f) { return '<span>' + esc(f) + '</span>'; }).join('') + '</div>' : '') + '</div>' +
      '<div class="cprice' + (num(p.price) ? '' : ' ask') + '"><b>' + esc(priceTxt(p)) + '</b></div></button></article>';
  }
  function filtering() { return !!(st.type || st.rooms || st.maxPrice || st.minArea); }
  function renderGrid() {
    var l = filtered(), all = list();
    var cl = document.querySelector('[data-pclear]'); if (cl) cl.hidden = !filtering();
    $('heading').textContent = sale.length && rent.length ? (st.tab === 'sale' ? 'נכסים למכירה' : 'נכסים להשכרה') : rent.length ? 'נכסים להשכרה' : 'נכסים למכירה';
    $('count').textContent = l.length === 1 ? 'נכס אחד' : l.length + ' נכסים';
    $('grid').innerHTML = l.length ? l.map(card).join('')
      : '<p class="empty">' + (all.length ? 'אין נכסים שמתאימים לסינון. נסו להרחיב אותו, או כתבו לנו בוואטסאפ.' : 'עדיין אין כאן נכסים. בקרוב יופיעו.') + '</p>';
  }

  /* ── חלון נכס ── */
  function waText(p) {
    return 'שלום, ראיתי בעמוד שלכם ב"שכונה" את הנכס: ' + [titleOf(p), placeOf(p), priceTxt(p)].filter(Boolean).join(', ') + '.\nאשמח לפרטים נוספים.\n' + location.href.split('#')[0] + '#' + p.id;
  }
  function renderDialog() {
    var p = byId[st.open], sh = $('pshade');
    sh.hidden = !p; document.body.style.overflow = p ? 'hidden' : '';
    if (!p) return;
    var im = imgs(p); if (st.img >= im.length) st.img = 0;
    var facts = [['חדרים', num(p.rooms) || ''], ['שטח', num(p.area) ? num(p.area) + ' מ״ר' : ''], ['קומה', floorTxt(p).replace(/^קומה /, '')], ['מצב', p.condition || ''],
      [p.rent ? 'כניסה' : 'פינוי', p.available ? new Date(p.available).toLocaleDateString('he-IL') : ''],
      ['ארנונה', p.rent && num(p.tax) ? H.fmt(num(p.tax)) + ' לחודש' : ''], ['ועד בית', p.rent && num(p.fees) ? H.fmt(num(p.fees)) + ' לחודש' : '']
    ].filter(function (f) { return f[1] !== '' && f[1] != null; });
    var feats = [[p.elevator, 'מעלית'], [p.parking, num(p.parking_spots) > 1 ? num(p.parking_spots) + ' חניות' : 'חניה'], [p.safe_room, 'ממ״ד'],
      [p.balcony, num(p.balcony_area) ? 'מרפסת ' + num(p.balcony_area) + ' מ״ר' : 'מרפסת'], [p.sukkah, 'מרפסת סוכה'], [p.storage, 'מחסן'],
      [p.furniture, 'כולל ריהוט'], [p.rental_units, num(p.rental_units_count) > 1 ? num(p.rental_units_count) + ' יחידות דיור' : 'יחידת דיור']
    ].filter(function (f) { return f[0]; }).map(function (f) { return f[1]; });
    sh.firstChild.innerHTML =
      '<div class="dpic' + (im.length ? ' has' : '') + '">' + (im.length
        ? '<img src="' + esc(im[st.img]) + '" alt="">' + (im.length > 1 ? '<button type="button" class="gnav prev" data-pimg="-1" aria-label="התמונה הקודמת">' + H.ico('<path d="M9 6l6 6-6 6"/>') + '</button><button type="button" class="gnav next" data-pimg="1" aria-label="התמונה הבאה">' + H.ico('<path d="M15 6l-6 6 6 6"/>') + '</button><span class="gcount" dir="ltr">' + (st.img + 1) + ' / ' + im.length + '</span>' : '')
        : H.ico(HOUSE)) + '</div>' +
      '<div class="info"><div class="row"><span class="dtag">' + (p.rent ? 'להשכרה' : 'למכירה') + '</span>' +
      '<button class="close" type="button" data-pclose aria-label="סגירה">' + H.ico('<path d="M6 6l12 12M18 6L6 18"/>') + '</button></div>' +
      '<h2 id="pTitle">' + esc(titleOf(p)) + '</h2><p class="pplace">' + esc(placeOf(p)) + '</p>' +
      '<div class="pr"><b>' + esc(priceTxt(p)) + '</b></div>' +
      (facts.length ? '<dl class="pdl">' + facts.map(function (f) { return '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>'; }).join('') + '</dl>' : '') +
      (feats.length ? '<div class="pfeats">' + feats.map(function (f) { return '<span>' + esc(f) + '</span>'; }).join('') + '</div>' : '') +
      (p.description ? '<p class="desc">' + esc(p.description) + '</p>' : '') +
      '<div class="acts">' + (C.whatsapp ? '<a class="add pwa" href="' + esc(H.waUrl(waText(p))) + '" target="_blank" rel="noopener">שאלה על הנכס בוואטסאפ</a>' : '') +
      '<button class="share" type="button" data-pshare>' + H.ico('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>') + '<span>העתקת קישור</span></button></div></div>';
  }
  function openProp(id) { if (!byId[id]) return; st.open = id; st.img = 0; renderDialog(); try { history.replaceState(null, '', '#' + id); } catch (e) {} }
  function closeProp() { st.open = null; renderDialog(); try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} }

  function bind() {
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-ptab],[data-popen],[data-pclose],[data-pimg],[data-pshare],[data-pclear],[data-go]');
      if (!t) { if (e.target.id === 'pshade') closeProp(); return; }
      var d = t.dataset;
      if (d.ptab) { st.tab = d.ptab; st.type = ''; renderBar(); renderGrid(); }
      else if (d.pclear) { st.type = ''; st.rooms = ''; st.maxPrice = ''; st.minArea = ''; renderBar(); renderGrid(); }
      else if (d.popen) openProp(d.popen);
      else if ('pclose' in d) closeProp();
      else if (d.pimg) { var n = imgs(byId[st.open]).length; st.img = (st.img + Number(d.pimg) + n) % n; renderDialog(); }
      else if ('pshare' in d) {
        var url = location.href.split('#')[0] + '#' + st.open, label = t.querySelector('span');
        try { navigator.clipboard.writeText(url).then(function () { label.textContent = 'הקישור הועתק'; }, function () { label.textContent = url; }); } catch (err) { label.textContent = url; }
      }
      else if (d.go) { var el = $(d.go === 'top' ? 'top' : d.go); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
    $('pbar').addEventListener('input', function (e) { var k = e.target.getAttribute('data-pf'); if (!k) return; st[k] = e.target.value; renderGrid(); });
    document.addEventListener('keydown', function (e) {
      if (!st.open) return;
      if (e.key === 'Escape') closeProp();
      else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && imgs(byId[st.open]).length > 1) { var n = imgs(byId[st.open]).length; st.img = (st.img + (e.key === 'ArrowLeft' ? 1 : -1) + n) % n; renderDialog(); }
    });
  }

  window.BizcatProps = {
    /* row: שורת הקטלוג. helpers: כלים משותפים מ-catalog.js. מחזיר Promise שמסתיים כשהעמוד מוכן להצגה. */
    start: function (row, helpers) {
      C = row; H = helpers;
      return load().then(function () {
        frame(); renderBar(); renderGrid(); bind();
        var h = location.hash.slice(1); if (byId[h]) { if (byId[h].rent) { st.tab = 'rent'; renderBar(); renderGrid(); } openProp(h); }
      });
    }
  };
})();
