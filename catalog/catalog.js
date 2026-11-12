/* קטלוג בשכונה — העמוד הציבורי.
 * כתובת: /catalog/<slug>/ (או /catalog/?c=<slug>). הנתונים מטבלאות bizcat_* (נפרדות מהאפליקציה), קריאה אחת דרך REST.
 * אורח רואה רק קטלוג שפורסם ופריטים גלויים (RLS). בעל העסק המחובר רואה גם קטלוג שעוד לא פורסם — כתצוגה מקדימה.
 */
(function () {
  'use strict';
  var SB_URL = 'https://mebomrqnfnbqijiuawdh.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lYm9tcnFuZm5icWlqaXVhd2RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkxOTc3MDEsImV4cCI6MjA1NDc3MzcwMX0.OSpzG4pnsgIiOEefWK0Z29ZHOo12bIhp0QXTdk2Hsg4';
  var SK = 'sb-mebomrqnfnbqijiuawdh-auth-token';

  var ICONS = {
    'הכל': '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    'מתנפחים': '<path d="M3 20V11l2.5-2.5L8 11V8.5l2-2 2 2 2-2 2 2V11l2.5-2.5L21 11v9z"/><path d="M10 20v-4a2 2 0 0 1 4 0v4"/><path d="M6.5 14h1M16.5 14h1"/>',
    'מתנפחים רטובים': '<path d="M12 3c-3 4.2-6 7.2-6 11a6 6 0 0 0 12 0c0-3.8-3-6.8-6-11z"/><path d="M9 14.5a3 3 0 0 0 3 3"/>',
    'אטרקציות': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    'דוכני מזון': '<path d="M7.5 10a4.5 4.5 0 0 1 9 0z"/><path d="M7.5 10L12 21l4.5-11"/><path d="M9.5 13.5l5 0M10.6 16.5h2.8"/>',
    'ציוד מטבח': '<path d="M4 10h16"/><path d="M5 10v7a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-7"/><path d="M9 10V8.5a3 3 0 0 1 6 0V10"/><path d="M2 12h2M20 12h2"/>',
    'חימום': '<path d="M12 3c1 4 5.5 5.5 5.5 10.5a5.5 5.5 0 0 1-11 0c0-3 2-4.5 2.5-7 1.8 1.2 2.7 3 2.7 5"/>',
    'איוורור וקירור': '<circle cx="12" cy="11" r="1.6"/><path d="M12 9.4C11.6 5.6 13.4 3.8 15.3 4.6s1.2 3.8-2.1 5.6"/><path d="M13.5 12C16.8 14 17.7 16.4 16 17.6s-3.6-.6-4.1-4.2"/><path d="M10.4 11.6C6.8 13 4.5 12.3 4.4 10.3s2.6-2.6 5.9-1"/><path d="M12 13v5M8.5 21h7"/>',
    'הגברה': '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><circle cx="12" cy="14.5" r="3.5"/><circle cx="12" cy="7" r="1.3"/>',
    'תאורה': '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c1 1 1 2.2 1 3.5h6c0-1.3 0-2.5 1-3.5A6 6 0 0 0 12 3z"/>',
    'ריהוט': '<path d="M4.5 11V8a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><path d="M2 13.5a2 2 0 0 1 4 0V15h12v-1.5a2 2 0 0 1 4 0V18H2z"/><path d="M5 18v2.5M19 18v2.5"/>',
    'שולחנות בר': '<ellipse cx="12" cy="6" rx="8" ry="2.5"/><path d="M12 8.5V19"/><path d="M8 21h8"/>',
    'הצללה ואוהלים': '<path d="M2.5 12A9.5 9.5 0 0 1 21.5 12z"/><path d="M12 2.5V21"/><path d="M9 21h6"/><path d="M7 12c0-4 2-7.5 5-9.5M17 12c0-4-2-7.5-5-9.5"/>',
    'שונות': '<rect x="3.5" y="9" width="17" height="11.5" rx="1.5"/><path d="M2.5 9h19V6.5H2.5z"/><path d="M12 6.5v14"/><path d="M12 6.5C10 3 7 3.5 7.5 5.3S11 6.5 12 6.5c1 0 4-.2 4.5-1.2S14 3 12 6.5z"/>'
  };
  /* קטגוריה שאין לה ציור משלה מקבלת תיבה כללית */
  var ICON_DEFAULT = '<path d="M3.5 8L12 3.5 20.5 8v8L12 20.5 3.5 16z"/><path d="M3.5 8L12 12.5 20.5 8M12 12.5v8"/>';
  /* בפלטת קרם־זהב הקטגוריות מקבלות גוונים חמים ושקטים במקום צבעי הפסטל */
  var TINTS_WARM = ['#F3E3C3', '#EAD9BC', '#F5E9D2', '#E6D3B1', '#F0DFC6', '#EBDCC4', '#F7ECD9', '#E3D2B4'];
  var TINTS_COOL = ['#E3E8EF', '#D6DDE7', '#ECEFF4', '#DCE2EA', '#E8ECF1', '#D0D8E2', '#F0F2F6', '#DFE5EC'];
  /* פלטות שהפתיחה שלהן כהה וממורכזת */
  var DARK_HERO = { gold: 1, slate: 1 };
  var TINTS = ['#FFE08A', '#A8E0F5', '#D9C8FF', '#FFC2AE', '#F6D9C4', '#FFD1A8', '#B5EBD9', '#D4DCF2', '#C9D6FF', '#F1E3C8', '#E9E1D2', '#CFEBC9', '#E3E6EC'];
  var ALL = '__all';
  function ico(inner) { return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + inner + '</svg>'; }
  function icon(name) { return ico(ICONS[name] || ICON_DEFAULT); }
  var SVG_PLUS = ico('<path d="M12 5v14M5 12h14"/>'), SVG_CHECK = ico('<path d="M5 12.5l4.5 4.5L19 7.5"/>');
  var SVG_PREV = ico('<path d="M9 6l6 6-6 6"/>'), SVG_NEXT = ico('<path d="M15 6l-6 6 6 6"/>');

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(n) { return Number(n).toLocaleString('he-IL') + ' ₪'; }
  function bySort(a, b) { return (a.sort_order - b.sort_order) || (a.created_at < b.created_at ? -1 : 1); }

  var C = null, cats = [], items = [], catById = {}, itemById = {};
  var state = { cat: ALL, q: '', picked: [], open: null, img: 0 };
  var LIST_KEY = '';

  /* ── כתובת ── */
  function slugFromUrl() {
    var q = new URLSearchParams(location.search).get('c');
    if (q) return q.toLowerCase();
    var parts = location.pathname.split('/').filter(Boolean);
    var i = parts.indexOf('catalog');
    var s = i >= 0 ? parts[i + 1] : '';
    return s && s !== 'index.html' && s !== 'manage' ? s.toLowerCase() : '';
  }

  /* ── נתונים ── */
  function sessionToken() {
    try {
      var raw = localStorage.getItem(SK) || localStorage.getItem('flutter.' + SK); if (!raw) return null;
      var s = JSON.parse(raw); if (typeof s === 'string') s = JSON.parse(s);
      if (!s || !s.access_token) return null;
      var exp = s.expires_at;
      if (!exp) { try { exp = JSON.parse(atob(s.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).exp; } catch (e) { exp = 0; } }
      return exp && exp * 1000 > Date.now() + 30000 ? s.access_token : null;
    } catch (e) { return null; }
  }
  function fetchCatalog(slug, token) {
    /* '*' ולא רשימת עמודות: כך עמודה חדשה בקטלוג (שאלות נפוצות, תמונת פתיחה) לא שוברת את העמוד לפני/אחרי העדכון */
    var sel = '*,' +
      'bizcat_categories(id,name,sort_order,created_at),' +
      'bizcat_items(id,category_id,name,price,description,is_hidden,is_featured,sort_order,created_at,bizcat_images(image_url,thumb_url,sort_order,created_at))';
    return fetch(SB_URL + '/rest/v1/bizcat_catalogs?slug=eq.' + encodeURIComponent(slug) + '&select=' + encodeURIComponent(sel), {
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + (token || SB_KEY) }
    }).then(function (r) {
      if (r.status === 401 && token) return fetchCatalog(slug, null);   // סשן שפג — ממשיכים כאורח
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json();
    }).then(function (rows) {
      if (rows && rows.length) return rows[0];
      if (token) return fetchCatalog(slug, null);
      return null;
    });
  }

  function showState(title, text, withLink) {
    $('siteView').hidden = true;
    $('state').hidden = false;
    $('state').innerHTML = '<div><h1>' + esc(title) + '</h1><p>' + esc(text) + '</p>' + (withLink ? '<a class="btn btn-blue" href="https://shchuna.co.il">לאתר שכונה</a>' : '') + '</div>';
  }

  /* ── הכנת הנתונים ── */
  function prepare(row) {
    C = row;
    cats = (row.bizcat_categories || []).slice().sort(bySort);
    var pv = new URLSearchParams(location.search).get('palette');   // ?palette=gold — הצצה בפלטה אחרת בלי לשמור
    if (pv && /^[a-z]{2,12}$/.test(pv)) row.palette = pv;
    var tints = row.palette === 'gold' ? TINTS_WARM : row.palette === 'slate' ? TINTS_COOL : TINTS;
    cats.forEach(function (c, i) { c.tint = tints[i % tints.length]; catById[c.id] = c; });
    items = (row.bizcat_items || []).filter(function (i) { return !i.is_hidden && catById[i.category_id]; });
    items.forEach(function (i) {
      i.cat = catById[i.category_id];
      i.images = (i.bizcat_images || []).slice().sort(bySort);
      i.desc = i.description || '';
      itemById[i.id] = i;
    });
    /* סדר התצוגה: לפי סדר הקטגוריות, ובתוך קטגוריה לפי סדר הפריטים */
    items.sort(function (a, b) { return a.cat === b.cat ? bySort(a, b) : bySort(a.cat, b.cat); });
    cats = cats.filter(function (c) { return items.some(function (i) { return i.category_id === c.id; }); });
    LIST_KEY = 'bizcat-list-' + row.slug;
    try { var s = JSON.parse(localStorage.getItem(LIST_KEY) || 'null'); if (Array.isArray(s)) state.picked = s.filter(function (id) { return itemById[id]; }); } catch (e) {}
  }
  function savePicks() { try { localStorage.setItem(LIST_KEY, JSON.stringify(state.picked)); } catch (e) {} }

  /* ── מסגרת העמוד (פעם אחת) ── */
  function waUrl(text) { return 'https://wa.me/' + C.whatsapp + (text ? '?text=' + encodeURIComponent(text) : ''); }
  function renderFrame() {
    var W = C.items_word || 'פריטים', U = C.price_unit || '';
    $('wrap').setAttribute('data-palette', C.palette || 'blue');
    document.title = C.title + ' | קטלוג בשכונה';
    var md = document.querySelector('meta[name=description]'); if (md) md.setAttribute('content', (C.description || C.title) + ' — קטלוג בשכונה');
    $('bizName').textContent = C.title; $('bizName2').textContent = C.title;
    $('logoLink').setAttribute('aria-label', C.title + ' – לראש העמוד');
    var mark = C.header_image_url ? '<img src="' + esc(C.header_image_url) + '" alt="">' : icon(cats[0] ? cats[0].name : '');
    $('logoMark').innerHTML = mark; $('logoMark2').innerHTML = mark;
    /* כותרת: החלק שאחרי הפסיק האחרון מודגש בצבע, עם קו מתחתיו */
    var hl = C.headline || C.title, cut = hl.lastIndexOf(', ');
    $('headline').innerHTML = cut > 0
      ? esc(hl.slice(0, cut + 2)) + '<span>' + esc(hl.slice(cut + 2)) + '<svg viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true"><path d="M4 10C60 2 140 2 196 7" fill="none" stroke="#FFC93C" stroke-width="5" stroke-linecap="round"/></svg></span>'
      : esc(hl);
    $('heroDesc').textContent = C.description || ''; $('heroDesc').hidden = !C.description;
    $('heroArea').textContent = C.service_area ? 'אזור שירות: ' + C.service_area : ''; $('heroArea').hidden = !(C.service_area || '').trim();
    document.querySelectorAll('[data-w]').forEach(function (el) { el.textContent = el.getAttribute('data-w').replace('{W}', W); });
    $('q').setAttribute('placeholder', 'חיפוש ' + W + '…');
    $('perkCats').textContent = cats.length + ' קטגוריות';
    $('perkPrice').textContent = 'מחירים שקופים' + (U ? ' ' + U : '');
    $('note').textContent = (U ? 'המחירים ' + U + '. ' : '') + 'בוחרים כמה פריטים, שולחים את הרשימה בוואטסאפ, וסוגרים ישירות מול העסק.';
    $('dUnit').textContent = U;
    var hasWa = !!C.whatsapp;
    document.querySelectorAll('[data-wa]').forEach(function (a) { a.hidden = !hasWa; if (hasWa) a.href = waUrl('שלום, הגעתי מהקטלוג שלכם ב"שכונה".'); });
    var tel = String(C.phone || '').replace(/[^0-9+]/g, '');
    document.querySelectorAll('[data-phone]').forEach(function (a) { a.hidden = !tel; a.href = 'tel:' + tel; a.setAttribute('aria-label', 'חיוג לעסק'); });
    document.querySelectorAll('[data-phone-txt]').forEach(function (s) { s.textContent = C.show_phone ? C.phone : 'חיוג'; });
    document.querySelectorAll('[data-phone-wrap]').forEach(function (s) { s.hidden = !tel || !hasWa; });
    $('send').hidden = !hasWa;
    var cs = $('circles').children;
    for (var i = 0; i < cs.length; i++) { var c = cats[i]; cs[i].hidden = !c; if (c) { cs[i].style.background = c.tint; cs[i].innerHTML = icon(c.name); } }
    $('preview').hidden = C.is_published !== false;
    /* פתיחה כהה וממורכזת: בפלטת קרם־זהב, או כשהעסק העלה תמונת פתיחה */
    var hero = document.querySelector('.banner'), img = C.hero_image_url || '';
    hero.classList.toggle('hero-dark', !!DARK_HERO[C.palette] || !!img);
    hero.style.backgroundImage = img ? 'linear-gradient(rgba(22,17,12,.58), rgba(22,17,12,.7)), url("' + String(img).replace(/["\\\n]/g, '') + '")' : '';
    /* איך זה עובד */
    $('howSteps').innerHTML = [
      ['בוחרים מהקטלוג', 'עוברים על ה' + W + ', ומסמנים "הוספה לרשימה" בכל מה שמתאים לכם.'],
      ['שולחים בוואטסאפ', 'בלחיצה אחת הרשימה נשלחת אלינו בהודעה מסודרת, עם המחירים.'],
      ['סוגרים ישירות איתנו', 'חוזרים אליכם, מתאמים תאריך ופרטים, וסוגרים. בלי תשלום דרך האתר.']
    ].map(function (s, i) { return '<li><span class="num">' + (i + 1) + '</span><div><b>' + esc(s[0]) + '</b><p>' + esc(s[1]) + '</p></div></li>'; }).join('');
    /* שאלות נפוצות — רק אם העסק מילא */
    var faq = Array.isArray(C.faq) ? C.faq.filter(function (f) { return f && f.q && f.a; }) : [];
    $('faq').hidden = !faq.length;
    document.querySelectorAll('[data-go="faq"]').forEach(function (b) { b.hidden = !faq.length; });
    $('faqList').innerHTML = faq.map(function (f) { return '<details><summary>' + esc(f.q) + '</summary><p>' + esc(f.a) + '</p></details>'; }).join('');
  }

  /* ── רשימות ── */
  function renderCats() {
    var html = '<button type="button" class="tile" data-cat="' + ALL + '" aria-pressed="' + (state.cat === ALL) + '"><span class="disc" style="background:var(--soft)">' + icon('הכל') + '</span>הכל</button>';
    html += cats.map(function (c) {
      return '<button type="button" class="tile" data-cat="' + c.id + '" aria-pressed="' + (c.id === state.cat) + '"><span class="disc" style="background:' + c.tint + '">' + icon(c.name) + '</span>' + esc(c.name) + '</button>';
    }).join('');
    $('cats').innerHTML = html;
  }
  function priceHTML(it, U) {
    return it.price == null ? '<div class="cprice ask"><b>מחיר לפי פנייה</b></div>'
      : '<div class="cprice"><b>' + fmt(it.price) + '</b>' + (U ? '<span>' + esc(U) + '</span>' : '') + '</div>';
  }
  function cardHTML(it) {
    var on = state.picked.indexOf(it.id) >= 0, im = it.images[0];
    var pic = im ? '<img src="' + esc(im.thumb_url || im.image_url) + '" alt="" loading="lazy" decoding="async">' + (it.images.length > 1 ? '<span class="more">' + it.images.length + ' תמונות</span>' : '') : icon(it.cat.name);
    return '<article class="card">' +
      '<button type="button" class="open" data-open="' + it.id + '" aria-label="פרטים על ' + esc(it.name) + '">' +
      '<div class="pic" style="background:' + it.cat.tint + '">' + pic + '</div>' +
      '<div class="cbody"><h3>' + esc(it.name) + '</h3><p>' + esc(it.desc.split('\n')[0]) + '</p></div>' + priceHTML(it, C.price_unit) +
      '</button>' +
      '<div class="cfoot"><button type="button" class="add" data-add="' + it.id + '" aria-pressed="' + on + '">' + (on ? SVG_CHECK + 'נבחר' : SVG_PLUS + 'הוספה לרשימה') + '</button></div>' +
      '</article>';
  }
  function renderGrid() {
    var q = state.q.trim().toLowerCase(), W = C.items_word || 'פריטים';
    var list = items.filter(function (it) {
      return (state.cat === ALL || it.category_id === state.cat) &&
        (!q || it.name.toLowerCase().indexOf(q) >= 0 || it.desc.toLowerCase().indexOf(q) >= 0 || it.cat.name.toLowerCase().indexOf(q) >= 0);
    });
    var feat = items.filter(function (i) { return i.is_featured; });
    $('featuredSec').hidden = !!q || state.cat !== ALL || !feat.length;
    $('featured').innerHTML = feat.map(cardHTML).join('');
    $('heading').textContent = q ? 'תוצאות עבור "' + state.q.trim() + '"' : state.cat === ALL ? 'כל ה' + W : catById[state.cat].name;
    $('count').textContent = list.length === 1 ? 'פריט אחד' : list.length + ' פריטים';
    $('grid').innerHTML = list.length ? list.map(cardHTML).join('')
      : '<p class="empty">' + (items.length ? 'לא נמצאו פריטים. נסו מילה אחרת, או כתבו לנו בוואטסאפ ונבדוק.' : 'הקטלוג עדיין ריק. בקרוב יופיעו כאן פריטים.') + '</p>';
  }
  function pickedItems() { return state.picked.map(function (id) { return itemById[id]; }).filter(Boolean); }
  function renderBar() {
    var picked = pickedItems(), total = 0, ask = 0;
    picked.forEach(function (i) { if (i.price == null) ask++; else total += Number(i.price); });
    $('bar').hidden = !picked.length;
    $('barTitle').textContent = picked.length === 1 ? 'פריט אחד ברשימה' : picked.length + ' פריטים ברשימה';
    $('chips').innerHTML = picked.map(function (i) {
      return '<button type="button" class="chip" data-remove="' + i.id + '" aria-label="הסרה מהרשימה: ' + esc(i.name) + '" style="background:' + i.cat.tint + '">' + esc(i.name) + ' <span aria-hidden="true">×</span></button>';
    }).join('');
    var totalTxt = fmt(total) + (ask ? ' + ' + (ask === 1 ? 'פריט אחד' : ask + ' פריטים') + ' לפי פנייה' : '');
    $('total').textContent = totalTxt;
    var U = C.price_unit ? ' ' + C.price_unit : '';
    var msg = 'שלום, הגעתי מהקטלוג שלכם ב"שכונה". אשמח לבדוק את הפריטים הבאים:\n' +
      picked.map(function (i, n) { return (n + 1) + '. ' + i.name + ' – ' + (i.price == null ? 'מחיר לפי פנייה' : fmt(i.price) + U); }).join('\n') +
      '\nסה"כ משוער: ' + totalTxt + '\nתאריך מבוקש: \nמיקום: ';
    $('send').href = waUrl(msg);
  }
  function renderDialog() {
    var it = state.open && itemById[state.open];
    $('shade').hidden = !it;
    document.body.style.overflow = it ? 'hidden' : '';
    if (!it) return;
    var on = state.picked.indexOf(it.id) >= 0, n = it.images.length;
    if (state.img >= n) state.img = 0;
    $('dPic').style.background = n ? '' : it.cat.tint;
    $('dPic').innerHTML = n
      ? '<img src="' + esc(it.images[state.img].image_url) + '" alt="' + esc(it.name) + (n > 1 ? ' – תמונה ' + (state.img + 1) + ' מתוך ' + n : '') + '">' +
        (n > 1 ? '<button type="button" class="gnav prev" data-img="-1" aria-label="התמונה הקודמת">' + SVG_PREV + '</button><button type="button" class="gnav next" data-img="1" aria-label="התמונה הבאה">' + SVG_NEXT + '</button>' +
          '<div class="gdots" aria-hidden="true">' + it.images.map(function (_, i) { return '<i class="' + (i === state.img ? 'on' : '') + '"></i>'; }).join('') + '</div>' : '')
      : icon(it.cat.name);
    $('dCat').textContent = it.cat.name;
    $('dTitle').textContent = it.name;
    $('dPr').className = 'pr' + (it.price == null ? ' ask' : '');
    $('dPrice').textContent = it.price == null ? 'מחיר לפי פנייה' : fmt(it.price);
    $('dUnit').hidden = it.price == null || !C.price_unit;
    $('dDesc').textContent = it.desc; $('dDesc').hidden = !it.desc;
    $('dAdd').innerHTML = on ? SVG_CHECK + 'נבחר (ברשימה)' : SVG_PLUS + 'הוספה לרשימה';
    $('dAdd').setAttribute('aria-pressed', on);
  }
  function toggle(id) {
    var i = state.picked.indexOf(id);
    if (i >= 0) state.picked.splice(i, 1); else state.picked.push(id);
    savePicks(); renderGrid(); renderBar(); renderDialog();
  }
  function openItem(id) {
    state.open = id; state.img = 0; renderDialog();
    $('dShare').querySelector('span').textContent = 'העתקת קישור';
    try { history.replaceState(null, '', '#' + id); } catch (e) {}
    $('dClose').focus();
  }
  function closeItem() {
    var was = state.open; state.open = null; renderDialog();
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    var b = document.querySelector('[data-open="' + was + '"]'); if (b) b.focus();
  }

  /* ── אירועים ── */
  function bind() {
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-go],[data-cat],[data-add],[data-open],[data-remove],[data-img]');
      if (!t) return;
      var d = t.dataset;
      if (d.go) {
        e.preventDefault();
        document.querySelectorAll('.nav [data-go]').forEach(function (b) { b.classList.toggle('cur', b.dataset.go === d.go); });
        if (d.go === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
        else { var el = $(d.go); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      }
      else if (d.cat) { state.cat = d.cat; renderCats(); renderGrid(); }
      else if (d.add) toggle(d.add);
      else if (d.remove) toggle(d.remove);
      else if (d.open) openItem(d.open);
      else if (d.img) { var n = itemById[state.open].images.length; state.img = (state.img + Number(d.img) + n) % n; renderDialog(); }
    });
    $('q').addEventListener('input', function (e) { state.q = e.target.value; renderGrid(); });
    $('dAdd').addEventListener('click', function () { toggle(state.open); });
    $('dClose').addEventListener('click', closeItem);
    $('shade').addEventListener('click', function (e) { if (e.target === $('shade')) closeItem(); });
    document.addEventListener('keydown', function (e) {
      if (!state.open) return;
      if (e.key === 'Escape') closeItem();
      else if (itemById[state.open].images.length > 1 && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        var n = itemById[state.open].images.length; state.img = (state.img + (e.key === 'ArrowLeft' ? 1 : -1) + n) % n; renderDialog();
      }
    });
    $('dShare').addEventListener('click', function () {
      var url = location.href.split('#')[0] + '#' + state.open, label = $('dShare').querySelector('span');
      try { navigator.clipboard.writeText(url).then(function () { label.textContent = 'הקישור הועתק'; }, function () { label.textContent = url; }); } catch (err) { label.textContent = url; }
    });
    window.addEventListener('hashchange', fromHash);
  }
  function fromHash() { var h = location.hash.slice(1); if (itemById[h]) openItem(h); }

  /* ── התחלה ── */
  function start() {
    var slug = slugFromUrl();
    if (!/^[a-z0-9][a-z0-9-]{1,39}$/.test(slug)) return showState('הקטלוג לא נמצא', 'הכתובת לא מובילה לקטלוג קיים.', true);
    fetchCatalog(slug, sessionToken()).then(function (row) {
      if (!row) return showState('הקטלוג לא נמצא', 'ייתכן שהוא עדיין לא פורסם, או שהכתובת השתנתה.', true);
      prepare(row); renderFrame(); renderCats(); renderGrid(); renderBar(); bind();
      $('state').hidden = true; $('siteView').hidden = false;
      fromHash();
    }).catch(function () {
      showState('לא הצלחנו לטעון את הקטלוג', 'בדקו את החיבור לאינטרנט ונסו לרענן את העמוד.', false);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
