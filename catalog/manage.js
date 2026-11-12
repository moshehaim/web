/* קטלוג בשכונה — מסך הניהול של בעל העסק (/catalog/manage/).
 * התחברות: אותה התחברות של האתר והאפליקציה (ShchunaAuth מתוך /js/auth.js).
 * הרשאה: נבדקת בשרת (RLS + bizcat_can_edit) — בעל העסק לפי אותו כלל של "העסקים שלי", או מנהל המערכת.
 * נתונים: רק טבלאות bizcat_* ותיקיית התמונות catalog. לא כותב לשום טבלה של האפליקציה.
 * מנהל המערכת יכול לפתוח כל קטלוג עם ?c=<slug>.
 */
(function () {
  'use strict';
  var A, sb, user, C = null, cats = [], items = [], images = [];
  var TINTS = ['#FFE08A', '#A8E0F5', '#D9C8FF', '#FFC2AE', '#F6D9C4', '#FFD1A8', '#B5EBD9', '#D4DCF2', '#C9D6FF', '#F1E3C8', '#E9E1D2', '#CFEBC9', '#E3E6EC'];
  /* הפלטות של העמוד. הצבעים כאן הם להמחשה בבורר בלבד — ההגדרה עצמה ב-catalog.css (data-palette). */
  var PALETTES = [
    { id: 'blue',  name: 'כחול שכונה', desc: 'צעיר וצבעוני, עם דגלונים',        n: '#12305E', s: '#1A56C4', f: '#EEF4FF', p: '#FFFFFF' },
    { id: 'gold',  name: 'קרם וזהב',   desc: 'חגיגי ואלגנטי, פתיחה כהה',        n: '#3A2E22', s: '#96620A', f: '#F6EBD7', p: '#FDFAF4', dark: 1 },
    { id: 'slate', name: 'אפור פחם',   desc: 'נקי ועסקי, פתיחה כהה',            n: '#1F2733', s: '#3F4A5C', f: '#ECEFF3', p: '#FAFBFC', dark: 1 },
    { id: 'teal',  name: 'טורקיז',     desc: 'רענן וקליל',                      n: '#0F3B44', s: '#0B7482', f: '#E3F4F6', p: '#FFFFFF' },
    { id: 'green', name: 'ירוק',       desc: 'טבעי ורגוע',                      n: '#12402E', s: '#17794F', f: '#E9F6EF', p: '#FFFFFF' },
    { id: 'plum',  name: 'סגול',       desc: 'עדין ומיוחד',                     n: '#35204F', s: '#6B3FA8', f: '#F3ECFA', p: '#FFFFFF' },
    { id: 'rose',  name: 'ורוד עמוק',  desc: 'חם ונשי',                         n: '#4A1730', s: '#B3265A', f: '#FBE8EF', p: '#FFFFFF' },
    { id: 'warm',  name: 'טרקוטה',     desc: 'חם וביתי',                        n: '#4A2413', s: '#B4481C', f: '#FBEFE6', p: '#FFFFFF' }
  ];
  /* כרטיס בבורר: המחשה קטנה של העמוד בצבעי הפלטה */
  function paletteCard(p, on) {
    return '<button type="button" class="pal" role="radio" aria-checked="' + on + '" data-pal="' + p.id + '" style="--n:' + p.n + ';--s:' + p.s + ';--f:' + p.f + ';--p:' + p.p + '">' +
      '<span class="pv' + (p.dark ? ' dark' : '') + '" aria-hidden="true"><i class="t"></i><i class="h"><b></b><em></em><u></u></i><i class="r"><s></s><s></s><s></s></i></span>' +
      '<span class="pn"><b>' + p.name + '</b><small>' + p.desc + '</small></span></button>';
  }
  var BUCKET = 'catalog';
  /* מה כלול בכל מסלול (אותם מספרים גם ב-catalog.js). קטלוג בלי עמודת plan נחשב מורחב. */
  var LIMITS = { basic: { items: 40, images: 3 }, plus: { items: 100000, images: 6 } };
  function PLUS() { return !C || C.plan !== 'basic'; }
  /* עמודת מחיר המבצע קיימת במסד? (לפני העדכון במסד השדה פשוט לא מוצג) */
  function hasSale() { return !items.length || 'sale_price' in items[0]; }
  function lim() { return LIMITS[PLUS() ? 'plus' : 'basic']; }
  var UPSELL = 'במסלול המורחב: פריטים בלי הגבלה, עד 6 תמונות לפריט, בחירה מ־8 סגנונות, לוגו, תמונת פתיחה, "הכי מבוקשים" ושאלות נפוצות. לשדרוג כתבו לנו: info@shchuna.co.il';
  var state = { tab: 'items', q: '', cat: '', edit: null, err: '', saved: '', arm: null, busy: false, up: '', catEdit: null };

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(n) { return Number(n).toLocaleString('he-IL') + ' ₪'; }
  function bySort(a, b) { return (a.sort_order - b.sort_order) || (a.created_at < b.created_at ? -1 : 1); }
  function now() { return new Date().toISOString(); }
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
  }
  function ok(r) { if (r.error) throw r.error; return r.data; }
  var toastT;
  function toast(t) { var el = $('toast'); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { el.hidden = true; }, 3200); }
  function fail(e) {
    state.busy = false;
    var m = e && e.message || '';
    state.err = /row-level security|permission denied|JWT|not authorized/i.test(m) ? 'אין הרשאה לשמור. נסו להתחבר מחדש.' : 'השמירה נכשלה. בדקו את החיבור ונסו שוב.';
    render();
  }

  /* ── עזרי נתונים ── */
  function catOf(id) { for (var i = 0; i < cats.length; i++) if (cats[i].id === id) return cats[i]; return null; }
  function itemOf(id) { for (var i = 0; i < items.length; i++) if (items[i].id === id) return items[i]; return null; }
  function imagesOf(itemId) { return images.filter(function (m) { return m.item_id === itemId; }).sort(bySort); }
  function tintOf(catId) { var i = cats.findIndex(function (c) { return c.id === catId; }); return TINTS[(i < 0 ? 12 : i) % TINTS.length]; }
  function nextOrder(list) { return list.reduce(function (m, x) { return Math.max(m, x.sort_order || 0); }, 0) + 10; }
  function pathOf(url) { var k = '/object/public/' + BUCKET + '/', i = String(url).indexOf(k); return i < 0 ? null : decodeURIComponent(url.slice(i + k.length).split('?')[0]); }

  /* ── שער: התחברות, בחירת קטלוג ── */
  function gate(html) { $('adminView').hidden = true; $('gate').hidden = false; $('gate').innerHTML = '<div class="gate">' + html + '</div>'; }
  var booting = false;
  function boot() {
    A = window.ShchunaAuth;
    if (!A) return gate('<h1>לא הצלחנו לטעון את העמוד</h1><p>נסו לרענן.</p>');
    if (booting) return; booting = true;
    A.getUser().then(function (r) {
      booting = false;
      sb = r.sb; user = r.user;
      if (!user) {
        gate('<h1>ניהול הקטלוג</h1><p>כדי לנהל את הקטלוג של העסק צריך להתחבר לחשבון שלכם בשכונה.</p><button type="button" class="btn btn-blue" id="doLogin">התחברות</button>');
        $('doLogin').addEventListener('click', function () { A.login('כדי לנהל את הקטלוג'); });
        return;
      }
      return findCatalogs().then(function (list) {
        if (!list.length) return gate('<h1>אין קטלוג בחשבון הזה</h1><p>לא מצאנו קטלוג שמשויך לעסק שלכם. אם הזמנתם קטלוג, כתבו לנו ונסדר: <a href="mailto:info@shchuna.co.il">info@shchuna.co.il</a></p>');
        if (list.length === 1) return openCatalog(list[0]);
        gate('<h1>איזה קטלוג לנהל?</h1><div class="pick">' + list.map(function (c, i) { return '<button type="button" data-pick="' + i + '">' + esc(c.title) + '</button>'; }).join('') + '</div>');
        $('gate').querySelectorAll('[data-pick]').forEach(function (b) { b.addEventListener('click', function () { openCatalog(list[Number(b.dataset.pick)]); }); });
      });
    }).catch(function () { booting = false; gate('<h1>לא הצלחנו לטעון</h1><p>בדקו את החיבור לאינטרנט ונסו לרענן את העמוד.</p>'); });
  }
  function findCatalogs() {
    var slug = (new URLSearchParams(location.search).get('c') || '').toLowerCase();
    if (slug) {
      return sb.from('bizcat_catalogs').select('*').eq('slug', slug).maybeSingle().then(function (r) {
        var c = ok(r); if (!c) return [];
        return sb.rpc('bizcat_can_edit', { p_catalog_id: c.id }).then(function (p) { return ok(p) === true ? [c] : []; });
      });
    }
    return Promise.all([
      sb.from('businesses').select('id').eq('user_id', user.id).eq('is_locked', true).eq('is_active', true),
      sb.from('professionals').select('id').eq('user_id', user.id).eq('is_active', true)
    ]).then(function (rs) {
      var ids = ok(rs[0]).concat(ok(rs[1])).map(function (x) { return x.id; });
      if (!ids.length) return [];
      return sb.from('bizcat_catalogs').select('*').in('entity_id', ids).order('created_at', { ascending: true }).then(ok);
    });
  }
  function openCatalog(c) {
    C = c;
    return Promise.all([
      sb.from('bizcat_categories').select('*').eq('catalog_id', C.id),
      sb.from('bizcat_items').select('*').eq('catalog_id', C.id),
      sb.from('bizcat_images').select('*').eq('catalog_id', C.id)
    ]).then(function (rs) {
      cats = ok(rs[0]).sort(bySort); items = ok(rs[1]); images = ok(rs[2]);
      $('gate').hidden = true; $('adminView').hidden = false;
      render();
    });
  }

  /* ── לשונית פריטים ── */
  function sortedItems() {
    return items.slice().sort(function (a, b) {
      var ca = catOf(a.category_id), cb = catOf(b.category_id);
      return a.category_id === b.category_id ? bySort(a, b) : bySort(ca || { sort_order: 1e9 }, cb || { sort_order: 1e9 });
    });
  }
  function viewItems() {
    if (state.edit) return itemForm();
    if (!cats.length) return '<p class="aempty">קודם מוסיפים קטגוריה אחת לפחות (בלשונית "קטגוריות"), ואז אפשר להוסיף פריטים.</p>';
    var q = state.q.trim().toLowerCase();
    var rows = sortedItems().filter(function (i) { return (!state.cat || i.category_id === state.cat) && (!q || i.name.toLowerCase().indexOf(q) >= 0); });
    return '<div class="atool">' +
      '<label class="sr" for="aq">חיפוש פריט</label><input id="aq" type="search" placeholder="חיפוש פריט…" value="' + esc(state.q) + '" autocomplete="off">' +
      '<label for="acat" class="sr">קטגוריה</label><select id="acat"><option value="">כל הקטגוריות</option>' + cats.map(function (c) { return '<option value="' + c.id + '"' + (c.id === state.cat ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select>' +
      '<button class="btn-sm primary push" type="button" data-new="1">+ פריט חדש</button></div>' +
      (state.err ? '<p class="ferr" role="alert">' + esc(state.err) + '</p>' : '') +
      '<div class="atable"><div class="arow ahd"><span>תמונה</span><span>שם</span><span class="ct">קטגוריה</span><span>מחיר</span><span>מוצג</span><span></span></div>' +
      (rows.map(function (i) {
        var im = imagesOf(i.id)[0], c = catOf(i.category_id), sib = siblings(i), at = sib.indexOf(i);
        return '<div class="arow">' +
          '<span class="th" style="background:' + tintOf(i.category_id) + '">' + (im ? '<img src="' + esc(im.thumb_url) + '" alt="" loading="lazy">' : '') + '</span>' +
          '<span class="nm">' + esc(i.name) + (i.is_featured && PLUS() ? ' <span class="star">★ מבוקש</span>' : '') + (im ? '' : ' <span class="fhid">· בלי תמונה</span>') + '</span>' +
          '<span class="ct">' + esc(c ? c.name : '') + '</span>' +
          '<span class="pr">' + (i.price == null ? 'לפי פנייה' : i.sale_price != null ? fmt(i.sale_price) + ' <span class="saleb">מבצע</span>' : fmt(i.price)) + '</span>' +
          '<button type="button" class="sw" role="switch" aria-checked="' + !i.is_hidden + '" aria-label="' + (i.is_hidden ? 'מוסתר' : 'מוצג') + ': ' + esc(i.name) + '" data-flip="' + i.id + '"><i></i></button>' +
          '<span class="racts">' + (q ? '' :
            '<button type="button" class="mini" data-itemup="' + i.id + '" aria-label="הזזה למעלה: ' + esc(i.name) + '"' + (at === 0 ? ' disabled' : '') + '>▲</button>' +
            '<button type="button" class="mini" data-itemdown="' + i.id + '" aria-label="הזזה למטה: ' + esc(i.name) + '"' + (at === sib.length - 1 ? ' disabled' : '') + '>▼</button>') +
          '<button type="button" class="lnk" data-edit="' + i.id + '">עריכה</button></span></div>';
      }).join('') || '<p class="aempty">' + (items.length ? 'אין פריטים שמתאימים לחיפוש.' : 'עדיין אין פריטים. לחצו "+ פריט חדש" כדי להתחיל.') + '</p>') + '</div>' +
      (rows.length > 1 && !q ? '<p class="hint">החיצים מזיזים פריט בתוך הקטגוריה שלו. את סדר הקטגוריות משנים בלשונית "קטגוריות".</p>' : '');
  }
  /* הפריטים של אותה קטגוריה, לפי הסדר שבו הם מוצגים */
  function siblings(it) { return items.filter(function (x) { return x.category_id === it.category_id; }).sort(bySort); }
  function moveItem(id, dir) {
    var it = itemOf(id); if (!it) return;
    var sib = siblings(it), i = sib.indexOf(it), j = i + dir;
    if (j < 0 || j >= sib.length) return;
    sib[i] = sib[j]; sib[j] = it;
    /* מספור מחדש של הקטגוריה כולה — הסדר נשמר גם אם היו מספרים זהים */
    var base = sib.reduce(function (m, x) { return Math.min(m, x.sort_order || 0); }, Infinity), ups = [], t = now();
    sib.forEach(function (x, n) { var so = base + n * 10; if (x.sort_order !== so) { x.sort_order = so; ups.push(sb.from('bizcat_items').update({ sort_order: so, updated_at: t }).eq('id', x.id)); } });
    state.err = ''; render();
    Promise.all(ups).then(function (rs) { rs.forEach(ok); }).catch(fail);
  }
  function itemForm() {
    var isNew = state.edit === 'new';
    var it = isNew ? { id: null, name: '', category_id: state.cat || cats[0].id, price: null, description: '', is_hidden: false, is_featured: false } : itemOf(state.edit);
    var ims = isNew ? [] : imagesOf(it.id), U = C.price_unit ? ' ' + C.price_unit : '';
    return '<form class="aform" id="itemForm" novalidate><h2>' + (isNew ? 'פריט חדש' : 'עריכת פריט') + '</h2>' +
      (state.err ? '<p class="ferr" role="alert">' + esc(state.err) + '</p>' : '') +
      '<div class="fgrid"><div class="fcol">' +
      '<label for="fName">שם הפריט *</label><input id="fName" maxlength="80" value="' + esc(it.name) + '">' +
      '<div class="two"><div><label for="fCat">קטגוריה *</label><select id="fCat">' + cats.map(function (c) { return '<option value="' + c.id + '"' + (c.id === it.category_id ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select></div>' +
      '<div><label for="fPrice">מחיר' + esc(U) + ' (₪)</label><input id="fPrice" type="number" min="0" step="any" inputmode="decimal" value="' + (it.price == null ? '' : esc(it.price)) + '"></div></div>' +
      (!hasSale() ? '' : '<label for="fSale">מחיר מבצע (₪) — לא חובה</label><input id="fSale" type="number" min="0" step="any" inputmode="decimal" value="' + (it.sale_price == null ? '' : esc(it.sale_price)) + '">' +
      '<span class="hint">כשממלאים, הפריט מסומן "מבצע": המחיר הרגיל מוצג מחוק ולידו מחיר המבצע. כדי לסיים את המבצע מוחקים את השדה.</span>') +
      '<span class="hint">אם משאירים את המחיר ריק, בעמוד יופיע "מחיר לפי פנייה".</span>' +
      '<label for="fDesc">תיאור</label><textarea id="fDesc" rows="6">' + esc(it.description) + '</textarea>' +
      '<span class="hint">כל שורה מופיעה כשורה נפרדת בעמוד הפריט. בכרטיס מוצגת השורה הראשונה.</span>' +
      '<label class="chk"><input type="checkbox" id="fShow"' + (it.is_hidden ? '' : ' checked') + '> מוצג בקטלוג</label>' +
      (PLUS() ? '<label class="chk"><input type="checkbox" id="fFeat"' + (it.is_featured ? ' checked' : '') + '> להציג גם ב"הכי מבוקשים" בראש העמוד</label>' : '') +
      '</div><div class="fcol"><span class="flabel">תמונות (עד ' + lim().images + ')</span>' +
      (isNew ? '<p class="info" style="margin:0">קודם שומרים את הפריט, ואז אפשר להוסיף לו תמונות.</p>'
        : '<div class="aimgs">' + ims.map(function (m, n) {
            return '<span class="aimg"><img src="' + esc(m.thumb_url) + '" alt="תמונה ' + (n + 1) + '">' + (n === 0 ? '<span class="first">ראשית</span>' : '') +
              '<span class="ib">' + (n > 0 ? '<button type="button" data-imgfirst="' + m.id + '">ראשית</button>' : '') +
              '<button type="button" class="del" data-imgdel="' + m.id + '">' + (state.arm === 'img:' + m.id ? 'למחוק?' : 'מחיקה') + '</button></span></span>';
          }).join('') +
          (ims.length < lim().images ? '<label class="aimg add">+ הוספת תמונה<small>אפשר לבחור כמה</small><input type="file" id="fImgs" accept="image/*" multiple' + (state.busy ? ' disabled' : '') + '></label>' : '') + '</div>' +
          '<span class="upmsg" role="status">' + esc(state.up) + '</span>' +
          '<p class="imgnote">מעלים רק תמונות של הציוד, בלי אנשים. תמונה שמופיעים בה אנשים תוסר.</p>') +
      '</div></div><div class="facts">' +
      '<button type="submit" class="btn-sm primary"' + (state.busy ? ' disabled' : '') + '>' + (isNew ? 'שמירה והמשך לתמונות' : 'שמירה') + '</button>' +
      '<button type="button" class="btn-sm" data-cancel="1">' + (isNew ? 'ביטול' : 'חזרה לרשימה') + '</button>' +
      (isNew ? '' : '<button type="button" class="btn-sm danger push" data-del="' + it.id + '">' + (state.arm === 'item:' + it.id ? 'לחצו שוב כדי למחוק' : 'מחיקת הפריט') + '</button>') +
      '</div></form>';
  }
  function saveItem() {
    var name = $('fName').value.trim(), raw = $('fPrice').value.trim(), price = raw === '' ? null : Number(raw);
    if (!name) { state.err = 'צריך לכתוב שם לפריט.'; return render(); }
    if (price !== null && !(price >= 0)) { state.err = 'המחיר צריך להיות מספר, למשל 250. אפשר גם להשאיר ריק.'; return render(); }
    var rawS = hasSale() ? $('fSale').value.trim() : '', sale = rawS === '' ? null : Number(rawS);
    if (sale !== null && price === null) { state.err = 'כדי להגדיר מחיר מבצע צריך למלא גם את המחיר הרגיל.'; return render(); }
    if (sale !== null && !(sale >= 0 && sale < price)) { state.err = 'מחיר המבצע צריך להיות נמוך מהמחיר הרגיל.'; return render(); }
    var f = { name: name, price: price, category_id: $('fCat').value, description: $('fDesc').value.trim(), is_hidden: !$('fShow').checked, is_featured: PLUS() ? $('fFeat').checked : !!(itemOf(state.edit) || {}).is_featured, updated_at: now() };
    if (hasSale()) f.sale_price = sale;
    state.err = ''; state.busy = true; render();
    var isNew = state.edit === 'new', p;
    if (isNew) {
      f.catalog_id = C.id; f.sort_order = nextOrder(items);
      p = sb.from('bizcat_items').insert(f).select().single().then(function (r) { var row = ok(r); items.push(row); state.edit = row.id; toast('הפריט נשמר. עכשיו אפשר להוסיף תמונות'); });
    } else {
      var id = state.edit;
      p = sb.from('bizcat_items').update(f).eq('id', id).select().single().then(function (r) { var row = ok(r); items[items.indexOf(itemOf(id))] = row; state.edit = null; toast('נשמר ✓'); });
    }
    p.then(function () { state.busy = false; render(); }, fail);
  }
  function flipItem(id) {
    var it = itemOf(id), v = !it.is_hidden;
    it.is_hidden = v; render();
    sb.from('bizcat_items').update({ is_hidden: v, updated_at: now() }).eq('id', id).then(function (r) { if (r.error) { it.is_hidden = !v; fail(r.error); } });
  }
  function removeFiles(list) {
    var paths = [];
    list.forEach(function (m) { [m.image_url, m.thumb_url].forEach(function (u) { var p = pathOf(u); if (p && paths.indexOf(p) < 0) paths.push(p); }); });
    return paths.length ? sb.storage.from(BUCKET).remove(paths).then(function () {}, function () {}) : Promise.resolve();
  }
  function deleteItem(id) {
    state.busy = true; render();
    var ims = imagesOf(id);
    sb.from('bizcat_items').delete().eq('id', id).then(function (r) {
      ok(r);
      items = items.filter(function (i) { return i.id !== id; }); images = images.filter(function (m) { return m.item_id !== id; });
      state.edit = null; state.arm = null; state.busy = false; toast('הפריט נמחק'); render();
      return removeFiles(ims);
    }).catch(fail);
  }

  /* ── תמונות ── */
  function scale(file, max, q) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var w = im.naturalWidth, h = im.naturalHeight, k = Math.min(1, max / Math.max(w, h));
        var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
        var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? res(b) : rej(new Error('blob')); }, 'image/jpeg', q);
      };
      im.onerror = function () { URL.revokeObjectURL(url); rej(new Error('img')); };
      im.src = url;
    });
  }
  function uploadOne(itemId, file, order) {
    var base = C.id + '/' + itemId + '/' + uuid(), bucket = sb.storage.from(BUCKET);
    return Promise.all([scale(file, 1600, 0.82), scale(file, 520, 0.78)]).then(function (bl) {
      return Promise.all([
        bucket.upload(base + '.jpg', bl[0], { contentType: 'image/jpeg', upsert: false }),
        bucket.upload(base + '_t.jpg', bl[1], { contentType: 'image/jpeg', upsert: false })
      ]);
    }).then(function (rs) {
      ok(rs[0]); ok(rs[1]);
      return sb.from('bizcat_images').insert({
        catalog_id: C.id, item_id: itemId, sort_order: order,
        image_url: bucket.getPublicUrl(base + '.jpg').data.publicUrl, thumb_url: bucket.getPublicUrl(base + '_t.jpg').data.publicUrl
      }).select().single();
    }).then(function (r) { images.push(ok(r)); });
  }
  function addImages(fileList) {
    var id = state.edit, have = imagesOf(id), room = lim().images - have.length;
    var files = Array.prototype.filter.call(fileList, function (f) { return /^image\//.test(f.type); });
    if (!files.length) { state.err = 'נא לבחור קובצי תמונה.'; return render(); }
    var skipped = Math.max(0, files.length - room); files = files.slice(0, room);
    state.err = ''; state.busy = true; var order = nextOrder(have), done = 0, failed = 0;
    function step() {
      if (done + failed >= files.length) {
        state.busy = false;
        state.up = failed ? 'חלק מהתמונות לא עלו (' + failed + '). נסו שוב.' : '';
        if (!failed) toast(files.length === 1 ? 'התמונה נוספה ✓' : files.length + ' תמונות נוספו ✓');
        if (skipped) state.err = 'אפשר עד ' + lim().images + ' תמונות לפריט. ' + (skipped === 1 ? 'תמונה אחת לא נוספה.' : skipped + ' תמונות לא נוספו.');
        return render();
      }
      state.up = 'מעלים תמונה ' + (done + failed + 1) + ' מתוך ' + files.length + '…'; render();
      uploadOne(id, files[done + failed], order + (done + failed) * 10).then(function () { done++; }, function () { failed++; }).then(step);
    }
    step();
  }
  function deleteImage(imgId) {
    var m = images.filter(function (x) { return x.id === imgId; })[0]; if (!m) return;
    state.arm = null;
    sb.from('bizcat_images').delete().eq('id', imgId).then(function (r) {
      ok(r); images = images.filter(function (x) { return x.id !== imgId; }); render();
      return removeFiles([m]);
    }).catch(fail);
  }
  function makeFirst(imgId) {
    var m = images.filter(function (x) { return x.id === imgId; })[0]; if (!m) return;
    var min = imagesOf(m.item_id)[0].sort_order - 10;
    sb.from('bizcat_images').update({ sort_order: min }).eq('id', imgId).then(function (r) { ok(r); m.sort_order = min; render(); }).catch(fail);
  }

  /* ── לשונית קטגוריות ── */
  function viewCats() {
    return (state.err ? '<p class="ferr" role="alert">' + esc(state.err) + '</p>' : '') +
      '<div class="clist">' + (cats.map(function (c, n) {
        var cnt = items.filter(function (i) { return i.category_id === c.id; }).length;
        if (state.catEdit === c.id) {
          return '<form class="crow" id="catRename"><span class="cdot" style="background:' + TINTS[n % TINTS.length] + '"></span>' +
            '<label class="sr" for="catName">שם הקטגוריה</label><input id="catName" maxlength="40" value="' + esc(c.name) + '">' +
            '<span class="cacts"><button type="submit" class="mini">שמירה</button><button type="button" class="mini" data-catcancel="1">ביטול</button></span></form>';
        }
        return '<div class="crow"><span class="cdot" style="background:' + TINTS[n % TINTS.length] + '"></span><span class="cn">' + esc(c.name) + '</span>' +
          '<span class="cc">' + (cnt === 1 ? 'פריט אחד' : cnt + ' פריטים') + '</span><span class="cacts">' +
          '<button type="button" class="mini" data-catup="' + c.id + '" aria-label="הזזה למעלה: ' + esc(c.name) + '"' + (n === 0 ? ' disabled' : '') + '>▲</button>' +
          '<button type="button" class="mini" data-catdown="' + c.id + '" aria-label="הזזה למטה: ' + esc(c.name) + '"' + (n === cats.length - 1 ? ' disabled' : '') + '>▼</button>' +
          '<button type="button" class="mini" data-catedit="' + c.id + '">שינוי שם</button>' +
          (cnt === 0 ? '<button type="button" class="mini danger" data-catdel="' + c.id + '">' + (state.arm === 'cat:' + c.id ? 'למחוק?' : 'מחיקה') + '</button>' : '') +
          '</span></div>';
      }).join('') || '<p class="aempty">עדיין אין קטגוריות.</p>') + '</div>' +
      '<form class="cadd" id="catForm"><label for="newCat">קטגוריה חדשה</label><input id="newCat" maxlength="40" placeholder="למשל: עמדות צילום" autocomplete="off"><button class="btn-sm primary" type="submit">הוספה</button></form>' +
      '<p class="hint">סדר הקטגוריות כאן הוא הסדר שבו הן מופיעות בעמוד. קטגוריה אפשר למחוק רק כשאין בה פריטים.</p>';
  }
  function catNameError(name, exceptId) {
    if (!name) return 'צריך לכתוב שם לקטגוריה.';
    if (cats.some(function (c) { return c.id !== exceptId && c.name === name; })) return 'כבר יש קטגוריה בשם הזה.';
    return '';
  }
  function addCat() {
    var name = $('newCat').value.trim(); state.err = catNameError(name, null);
    if (state.err) return render();
    sb.from('bizcat_categories').insert({ catalog_id: C.id, name: name, sort_order: nextOrder(cats) }).select().single().then(function (r) { cats.push(ok(r)); render(); $('newCat').focus(); }).catch(fail);
  }
  function renameCat() {
    var id = state.catEdit, name = $('catName').value.trim(); state.err = catNameError(name, id);
    if (state.err) return render();
    sb.from('bizcat_categories').update({ name: name }).eq('id', id).then(function (r) { ok(r); catOf(id).name = name; state.catEdit = null; render(); }).catch(fail);
  }
  function moveCat(id, dir) {
    var i = cats.findIndex(function (c) { return c.id === id; }), j = i + dir;
    if (i < 0 || j < 0 || j >= cats.length) return;
    var a = cats[i], b = cats[j];
    cats[i] = b; cats[j] = a;
    /* מספור מחדש של כל הרשימה — כך הסדר נשמר גם אם היו מספרים זהים */
    var ups = [];
    cats.forEach(function (c, n) { var so = (n + 1) * 10; if (c.sort_order !== so) { c.sort_order = so; ups.push(sb.from('bizcat_categories').update({ sort_order: so }).eq('id', c.id)); } });
    render();
    Promise.all(ups).then(function (rs) { rs.forEach(ok); }).catch(fail);
  }
  function deleteCat(id) {
    state.arm = null;
    sb.from('bizcat_categories').delete().eq('id', id).then(function (r) { ok(r); cats = cats.filter(function (c) { return c.id !== id; }); if (state.cat === id) state.cat = ''; render(); }).catch(fail);
  }

  /* ── לשונית הגדרות ── */
  function waLocal(w) { return w && w.indexOf('972') === 0 ? '0' + w.slice(3) : (w || ''); }
  function waIntl(v) { var d = String(v).replace(/[^0-9]/g, ''); if (d.indexOf('0') === 0) d = '972' + d.slice(1); return d; }
  function viewSettings() {
    var url = 'shchuna.co.il/catalog/' + C.slug + '/';
    return '<form class="aform" id="setForm" novalidate><h2>הגדרות העמוד</h2>' +
      (state.err ? '<p class="ferr" role="alert">' + esc(state.err) + '</p>' : '') +
      '<span class="flabel">כתובת העמוד</span><div class="addr"><span dir="ltr">' + esc(url) + '</span><button type="button" class="btn-sm" data-copyaddr="1">העתקה</button></div><span class="hint">הכתובת נקבעת בהקמה.</span>' +
      '<label for="sTitle">שם העסק בעמוד *</label><input id="sTitle" maxlength="60" value="' + esc(C.title) + '">' +
      (!PLUS() ? '' : '<span class="flabel">לוגו (לא חובה)</span><div class="logo-row"><span class="logo-pv">' + (C.header_image_url ? '<img src="' + esc(C.header_image_url) + '" alt="">' : '') + '</span>' +
      '<label class="btn-sm filebtn">' + (C.header_image_url ? 'החלפת לוגו' : 'העלאת לוגו') + '<input type="file" id="sLogo" accept="image/*"></label>' +
      (C.header_image_url ? '<button type="button" class="btn-sm" data-logodel="1">הסרה</button>' : '') + '</div><span class="hint">בלי לוגו מוצג ציור של הקטגוריה הראשונה.</span>') +
      '<label for="sHead">כותרת ראשית</label><input id="sHead" maxlength="80" value="' + esc(C.headline) + '" placeholder="למשל: כל הציוד לאירוע שלכם, במקום אחד!"><span class="hint">מה שכתוב אחרי הפסיק האחרון מודגש בצבע.</span>' +
      '<label for="sDesc">תיאור קצר</label><input id="sDesc" maxlength="160" value="' + esc(C.description) + '">' +
      '<label for="sArea">אזור שירות</label><input id="sArea" maxlength="120" value="' + esc(C.service_area) + '" placeholder="למשל: ירושלים, מבשרת, מעלה אדומים וגוש עציון"><span class="hint">טקסט חופשי. אם ריק, לא מוצג בעמוד.</span>' +
      '<div class="two"><div><label for="sWa">וואטסאפ להזמנות *</label><input id="sWa" dir="ltr" inputmode="tel" value="' + esc(waLocal(C.whatsapp)) + '"></div>' +
      '<div><label for="sPhone">טלפון</label><input id="sPhone" dir="ltr" inputmode="tel" value="' + esc(C.phone) + '"></div></div>' +
      '<label class="chk"><input type="checkbox" id="sShow"' + (C.show_phone ? ' checked' : '') + '> להציג את מספר הטלפון בעמוד (אם לא מסומן, מופיע רק כפתור "חיוג")</label>' +
      '<div class="two"><div><label for="sUnit">המחירים הם…</label><input id="sUnit" maxlength="20" value="' + esc(C.price_unit) + '" placeholder="למשל: ליום"></div>' +
      '<div><label for="sWord">איך קוראים לפריטים</label><input id="sWord" maxlength="20" value="' + esc(C.items_word) + '" placeholder="פריטים / ציוד / מוצרים"></div></div>' +
      (!PLUS() ? '<input type="hidden" id="sPal" value="' + esc(C.palette) + '"><p class="info" style="margin:0">' + esc(UPSELL) + '</p>' : '<span class="flabel" id="palL">סגנון וצבעי העמוד</span><input type="hidden" id="sPal" value="' + esc(C.palette) + '">' +
      '<div class="pals" role="radiogroup" aria-labelledby="palL">' + PALETTES.map(function (p) { return paletteCard(p, p.id === C.palette); }).join('') + '</div>' +
      '<span class="hint">הבחירה נשמרת בלחיצה על "שמירה". <a id="palPeek" href="/catalog/' + esc(C.slug) + '/?palette=' + esc(C.palette) + '" target="_blank" rel="noopener">הצצה בעמוד בסגנון שנבחר</a></span>') +
      (PLUS() && 'hero_image_url' in C ? '<span class="flabel">תמונת פתיחה (לא חובה)</span><div class="logo-row"><span class="hero-pv">' + (C.hero_image_url ? '<img src="' + esc(C.hero_image_url) + '" alt="">' : '') + '</span>' +
        '<label class="btn-sm filebtn">' + (C.hero_image_url ? 'החלפת תמונה' : 'העלאת תמונה') + '<input type="file" id="sHero" accept="image/*"></label>' +
        (C.hero_image_url ? '<button type="button" class="btn-sm" data-herodel="1">הסרה</button>' : '') + '</div><span class="hint">תמונה רחבה של הציוד, בלי אנשים. מוצגת ברקע של ראש העמוד, מאחורי הכותרת.</span>' : '') +
      (PLUS() && 'faq' in C ? '<span class="flabel">שאלות נפוצות (לא חובה)</span><div id="faqRows">' + (Array.isArray(C.faq) ? C.faq : []).map(faqRow).join('') + '</div>' +
        '<div><button type="button" class="btn-sm" data-faqadd="1">+ הוספת שאלה</button></div><span class="hint">למשל: האם יש משלוח? מה כולל המחיר? צריך פיקדון? מופיע בעמוד רק אם יש לפחות שאלה אחת עם תשובה.</span>' : '') +
      '<div class="facts"><button type="submit" class="btn-sm primary"' + (state.busy ? ' disabled' : '') + '>שמירה</button><span class="saved" role="status">' + esc(state.saved) + '</span></div></form>';
  }
  function faqRow(f) {
    return '<div class="faqrow"><input class="fq" maxlength="120" placeholder="השאלה" aria-label="שאלה" value="' + esc(f && f.q) + '">' +
      '<textarea class="fa" rows="2" maxlength="600" placeholder="התשובה" aria-label="תשובה">' + esc(f && f.a) + '</textarea>' +
      '<button type="button" class="mini danger" data-faqdel="1" aria-label="הסרת השאלה">הסרה</button></div>';
  }
  function readFaq() {
    return Array.prototype.map.call(document.querySelectorAll('#faqRows .faqrow'), function (r) {
      return { q: r.querySelector('.fq').value.trim(), a: r.querySelector('.fa').value.trim() };
    }).filter(function (f) { return f.q && f.a; });
  }
  function saveSettings() {
    var title = $('sTitle').value.trim(), wa = waIntl($('sWa').value);
    if (!title) { state.err = 'צריך לכתוב את שם העסק.'; return render(); }
    if (!/^[0-9]{9,15}$/.test(wa)) { state.err = 'צריך מספר וואטסאפ תקין, למשל 052-1234567.'; return render(); }
    var f = { title: title, headline: $('sHead').value.trim(), description: $('sDesc').value.trim(), service_area: $('sArea').value.trim(), whatsapp: wa, phone: $('sPhone').value.trim(),
      show_phone: $('sShow').checked, price_unit: $('sUnit').value.trim(), items_word: $('sWord').value.trim() || 'פריטים', palette: $('sPal').value, updated_at: now() };
    if (PLUS() && 'faq' in C) f.faq = readFaq();
    state.err = ''; state.saved = ''; state.busy = true; render();
    sb.from('bizcat_catalogs').update(f).eq('id', C.id).then(function (r) { ok(r); Object.assign(C, f); state.busy = false; state.saved = 'נשמר. השינוי מופיע בעמוד.'; render(); }).catch(fail);
  }
  function setLogo(url, old) {
    return sb.from('bizcat_catalogs').update({ header_image_url: url, updated_at: now() }).eq('id', C.id).then(function (r) {
      ok(r); C.header_image_url = url; render();
      var p = old && pathOf(old); if (p) sb.storage.from(BUCKET).remove([p]).then(function () {}, function () {});
    });
  }
  function uploadLogo(file) {
    if (!/^image\//.test(file.type)) { state.err = 'נא לבחור קובץ תמונה.'; return render(); }
    var path = C.id + '/_logo/' + uuid() + '.jpg', bucket = sb.storage.from(BUCKET), old = C.header_image_url;
    state.err = ''; toast('מעלים את הלוגו…');
    scale(file, 400, 0.85).then(function (b) { return bucket.upload(path, b, { contentType: 'image/jpeg', upsert: false }); })
      .then(function (r) { ok(r); return setLogo(bucket.getPublicUrl(path).data.publicUrl, old); }).then(function () { toast('הלוגו עודכן ✓'); }).catch(fail);
  }

  function setHero(url, old) {
    return sb.from('bizcat_catalogs').update({ hero_image_url: url, updated_at: now() }).eq('id', C.id).then(function (r) {
      ok(r); C.hero_image_url = url;
      var pv = document.querySelector('.hero-pv');   // בלי ציור מחדש — כדי לא לאבד שדות שעוד לא נשמרו
      if (pv) { pv.innerHTML = url ? '<img src="' + esc(url) + '" alt="">' : ''; }
      var p = old && pathOf(old); if (p) sb.storage.from(BUCKET).remove([p]).then(function () {}, function () {});
    });
  }
  function uploadHero(file) {
    if (!/^image\//.test(file.type)) { toast('נא לבחור קובץ תמונה'); return; }
    var path = C.id + '/_hero/' + uuid() + '.jpg', bucket = sb.storage.from(BUCKET), old = C.hero_image_url;
    toast('מעלים את התמונה…');
    scale(file, 1920, 0.8).then(function (b) { return bucket.upload(path, b, { contentType: 'image/jpeg', upsert: false }); })
      .then(function (r) { ok(r); return setHero(bucket.getPublicUrl(path).data.publicUrl, old); }).then(function () { toast('תמונת הפתיחה עודכנה ✓'); })
      .catch(function () { toast('ההעלאה נכשלה. נסו שוב.'); });
  }

  /* ── ציור ── */
  function render() {
    var act = document.activeElement, keep = act && act.id, pos = null;
    try { pos = act && act.selectionStart; } catch (e) {}
    $('aTitle').textContent = C.title;
    $('aStatus').textContent = C.is_published ? 'מפורסם' : 'טיוטה — עוד לא פורסם';
    $('aStatus').className = 'badge' + (C.is_published ? '' : ' draft');
    $('aPlan').hidden = PLUS(); $('aPlan').textContent = 'מסלול בסיסי';   // כרגע מסלול אחיד — התווית מופיעה רק אם קטלוג הוגדר בסיסי
    $('viewPage').href = '/catalog/' + C.slug + '/';
    $('viewPage').textContent = C.is_published ? 'צפייה בעמוד' : 'תצוגה מקדימה';
    document.querySelectorAll('.atabs [data-tab]').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.tab === state.tab); });
    $('tItems').textContent = '(' + items.length + ')'; $('tCats').textContent = '(' + cats.length + ')';
    $('abody').innerHTML = state.tab === 'items' ? viewItems() : state.tab === 'cats' ? viewCats() : viewSettings();
    if (keep && $(keep) && $(keep).type !== 'file') { $(keep).focus(); try { if (pos != null) $(keep).setSelectionRange(pos, pos); } catch (e) {} }
  }
  function arm(key, fn) { if (state.arm !== key) { state.arm = key; render(); } else fn(); }

  document.addEventListener('click', function (e) {
    if (!C) return;
    var t = e.target.closest('[data-tab],[data-new],[data-edit],[data-flip],[data-itemup],[data-itemdown],[data-cancel],[data-del],[data-imgdel],[data-imgfirst],[data-catup],[data-catdown],[data-catedit],[data-catcancel],[data-catdel],[data-copyaddr],[data-logodel],[data-herodel],[data-faqadd],[data-faqdel],[data-pal]');
    if (!t || t.disabled) return;
    var d = t.dataset;
    if (d.tab) { state.tab = d.tab; state.edit = null; state.err = ''; state.saved = ''; state.arm = null; state.catEdit = null; state.up = ''; render(); }
    else if (d.new && items.length >= lim().items) { state.err = 'המסלול הבסיסי כולל עד ' + lim().items + ' פריטים. ' + UPSELL; render(); }
    else if (d.new) { state.edit = 'new'; state.err = ''; state.up = ''; render(); $('fName').focus(); window.scrollTo(0, 0); }
    else if (d.edit) { state.edit = d.edit; state.err = ''; state.arm = null; state.up = ''; render(); window.scrollTo(0, 0); }
    else if (d.flip) flipItem(d.flip);
    else if (d.itemup) moveItem(d.itemup, -1);
    else if (d.itemdown) moveItem(d.itemdown, 1);
    else if (d.cancel) { state.edit = null; state.err = ''; state.arm = null; render(); }
    else if (d.del) arm('item:' + d.del, function () { deleteItem(d.del); });
    else if (d.imgdel) arm('img:' + d.imgdel, function () { deleteImage(d.imgdel); });
    else if (d.imgfirst) makeFirst(d.imgfirst);
    else if (d.catup) moveCat(d.catup, -1);
    else if (d.catdown) moveCat(d.catdown, 1);
    else if (d.catedit) { state.catEdit = d.catedit; state.err = ''; render(); $('catName').focus(); }
    else if (d.catcancel) { state.catEdit = null; state.err = ''; render(); }
    else if (d.catdel) arm('cat:' + d.catdel, function () { deleteCat(d.catdel); });
    else if (d.logodel) setLogo(null, C.header_image_url).catch(fail);
    else if (d.herodel) setHero(null, C.hero_image_url).then(function () { toast('התמונה הוסרה. לחצו שמירה אם שיניתם עוד דברים.'); }).catch(fail);
    else if (d.faqadd) { $('faqRows').insertAdjacentHTML('beforeend', faqRow(null)); var rows = document.querySelectorAll('#faqRows .fq'); rows[rows.length - 1].focus(); }
    else if (d.faqdel) t.closest('.faqrow').remove();
    else if (d.pal) {   // בחירת פלטה: מסמנים בלי לצייר מחדש, כדי לא לאבד שדות שעוד לא נשמרו
      $('sPal').value = d.pal;
      document.querySelectorAll('.pals .pal').forEach(function (b) { b.setAttribute('aria-checked', b === t); });
      $('palPeek').href = '/catalog/' + C.slug + '/?palette=' + d.pal;
    }
    else if (d.copyaddr) { try { navigator.clipboard.writeText('https://shchuna.co.il/catalog/' + C.slug + '/').then(function () { t.textContent = 'הועתק ✓'; }, function () {}); } catch (err) {} }
  });
  document.addEventListener('submit', function (e) {
    if (!C) return;
    var id = e.target.id;
    if (id === 'itemForm') { e.preventDefault(); if (!state.busy) saveItem(); }
    else if (id === 'catForm') { e.preventDefault(); addCat(); }
    else if (id === 'catRename') { e.preventDefault(); renameCat(); }
    else if (id === 'setForm') { e.preventDefault(); if (!state.busy) saveSettings(); }
  });
  document.addEventListener('input', function (e) { if (C && e.target.id === 'aq') { state.q = e.target.value; render(); } });
  document.addEventListener('change', function (e) {
    if (!C) return;
    if (e.target.id === 'acat') { state.cat = e.target.value; render(); }
    else if (e.target.id === 'fImgs' && e.target.files.length) addImages(e.target.files);
    else if (e.target.id === 'sLogo' && e.target.files.length) uploadLogo(e.target.files[0]);
    else if (e.target.id === 'sHero' && e.target.files.length) uploadHero(e.target.files[0]);
  });
  document.addEventListener('shchuna:auth', function (e) {
    var u = e.detail && e.detail.user;
    if (u && !user) boot();
    else if (!u && user) { user = null; C = null; boot(); }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
