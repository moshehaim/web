/* פרסום מודעה מהאתר — יד שנייה, אבידות ומציאות.
 * נטען מ-/js/auth.js רק אחרי שהמשתמש מחובר ומאומת (gate). אותם שדות, כללים ומבנה אחסון כמו באפליקציה:
 *   יד שנייה  — AddSecondhandItemScreen: תמונות ב-images/secondhand/{ts}_{i}.jpg, ואז insert ל-second_hand_items
 *   אבידות    — AddLostAndFoundScreen: insert ל-lost_and_found, ואז תמונה ב-images/lost_and_found/{id}/0.jpg ועדכון image_url
 * המודעה מופיעה באפליקציה מיד, ובאתר בבנייה הבאה (פעם בשעה). עריכה ומחיקה — באפליקציה. */
(function () {
  var BUCKET = 'images', MAX_SIDE = 1920, QUALITY = 0.85, DOWNLOAD = '/b/';
  var CATS = [
    ['clothing', 'ביגוד והנעלה'], ['sports', 'ספורט ופנאי'], ['tech', 'מובייל ומחשבים'], ['electronics', 'מוצרי חשמל'],
    ['furniture', 'ריהוט ועיצוב'], ['baby', 'תינוקות'], ['other', 'שונות']
  ];
  var CSS = '' +
    '.sp-f{display:flex;flex-direction:column;gap:14px}.sp-f [hidden]{display:none!important}' +
    '.sp-f label.l{display:flex;flex-direction:column;gap:6px;font-weight:800;font-size:15px;color:#172F57}' +
    '.sp-f label.l small{font-weight:600;color:#8A94A6;font-size:13px}' +
    '.sp-f input[type=text],.sp-f input[type=tel],.sp-f input[type=number],.sp-f textarea{border-radius:14px;border:1.5px solid #DCE2EC;padding:12px 14px;font:inherit;font-size:16px;font-weight:400;color:#1C2B45;background:#fff;width:100%;box-sizing:border-box}' +
    '.sp-f input{height:50px;padding-block:0!important}.sp-f textarea{min-height:96px;resize:vertical}' +
    '.sp-f input:focus,.sp-f textarea:focus{outline:0;border-color:#2A6FB8;box-shadow:0 0 0 3px rgba(42,111,184,.15)}' +
    '.sp-f input[dir=ltr]{text-align:left}' +
    '.sp-seg{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#F1F4F9;border-radius:999px;padding:4px}' +
    '.sp-seg button{height:42px;border:0;border-radius:999px;background:none;font:inherit;font-size:16px;font-weight:800;color:#566173;cursor:pointer}' +
    '.sp-seg button[aria-pressed=true]{background:#172F57;color:#fff}' +
    '.sp-chips{display:flex;flex-wrap:wrap;gap:6px}' +
    '.sp-chips button{height:38px;padding:0 14px;border-radius:999px;border:1px solid #DCE2EC;background:#fff;font:inherit;font-size:14.5px;font-weight:700;color:#1C2B45;cursor:pointer}' +
    '.sp-chips button[aria-pressed=true]{background:#2A6FB8;border-color:#2A6FB8;color:#fff}' +
    '.sp-imgs{display:flex;flex-wrap:wrap;gap:8px}' +
    '.sp-th{position:relative;width:76px;height:76px;border-radius:12px;overflow:hidden;background:#F1F4F9}' +
    '.sp-th img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.sp-th button{position:absolute;top:4px;left:4px;width:24px;height:24px;border-radius:50%;border:0;background:rgba(15,25,45,.7);color:#fff;font-size:15px;line-height:1;cursor:pointer}' +
    '.sp-add{position:relative;width:76px;height:76px;border-radius:12px;border:1.5px dashed #B9C3D3;background:#F8FAFD;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:13px;font-weight:700;color:#566173;cursor:pointer}' +
    '.sp-add b{font-size:24px;line-height:1;color:#2A6FB8}' +
    '.sp-add input{position:absolute!important;width:1px!important;height:1px!important;opacity:0;padding:0!important;border:0!important}' +
    '.sp-sec{display:flex;flex-direction:column;gap:6px}.sp-sec>span{font-weight:800;font-size:15px;color:#172F57}' +
    '.sp-hint{font-size:13px!important;color:#8A94A6!important}' +
    '.sp-dup{background:#FFF6E0;border:1px solid #F3D27A;border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:8px}' +
    '.sp-dup p{color:#5C4400!important;font-size:15px!important}' +
    '.sp-done{font-size:44px;text-align:center;line-height:1}' +
    '.sp-f select{height:50px;border-radius:14px;border:1.5px solid #DCE2EC;padding:0 12px;font:inherit;font-size:16px;color:#1C2B45;background:#fff;width:100%}' +
    '.sp-f input[type=date],.sp-f input[type=email],.sp-f input[type=url],.sp-f input[type=time]{border-radius:14px;border:1.5px solid #DCE2EC;padding:0 14px;font:inherit;font-size:16px;color:#1C2B45;background:#fff;width:100%;box-sizing:border-box}' +
    '.sp-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}' +
    '.sp-chk{display:flex;align-items:center;gap:8px;font-weight:700;font-size:15px;color:#172F57;cursor:pointer}.sp-chk input{width:20px;height:20px;accent-color:#2A6FB8}' +
    '.sp-chkg{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
    '.sp-x{display:flex;flex-direction:column;gap:14px}.sp-x[hidden],.sp-more[hidden]{display:none}' +
    '.sp-more{border:0;background:none;color:#2A6FB8;font:inherit;font-weight:800;font-size:14.5px;cursor:pointer;padding:4px 0;text-align:right}' +
    '.sp-days{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}.sp-days button{height:40px;border-radius:10px;border:1px solid #DCE2EC;background:#fff;font:inherit;font-weight:800;color:#566173;cursor:pointer}.sp-days button[aria-pressed=true]{background:#172F57;border-color:#172F57;color:#fff}' +
    '.sp-sug{border:1px solid #DCE2EC;border-radius:12px;background:#fff;max-height:220px;overflow:auto;margin-top:4px}.sp-sug button{display:block;width:100%;text-align:right;padding:10px 12px;border:0;border-bottom:1px solid #F1F3F6;background:none;font:inherit;font-size:15px;cursor:pointer}.sp-sug button:hover{background:#F5F9FF}.sp-sug small{color:#6B7689;font-weight:600}';

  function css() { if (document.getElementById('sp-css')) return; var s = document.createElement('style'); s.id = 'sp-css'; s.textContent = CSS; document.head.appendChild(s); }

  /* הקטנת תמונה בדפדפן — צלע ארוכה עד 1920, JPEG באיכות 85 (כמו באפליקציה) */
  function shrink(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, MAX_SIDE / Math.max(w, h));
        var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
        var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? res(b) : rej(new Error('img')); }, 'image/jpeg', QUALITY);
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('img')); };
      img.src = url;
    });
  }
  function upload(sb, path, blob) {
    return sb.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false }).then(function (r) {
      if (r.error) throw r.error;
      return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    });
  }
  function phoneOk(v) { return /^0\d{8,9}$/.test(v); }
  function digits(v) { return String(v || '').replace(/\D/g, ''); }

  function form(kind, cid, A) {
    css();
    var esc = A.esc, sb = A.sb, user = A.user, lost = kind === 'lost';
    var st = { free: true, cat: null, cond: 2, status: 'lost', files: [], dupOk: false };
    var MAXI = lost ? 1 : 5;

    var d = A.open(
      '<h2 id="sa-h">' + (lost ? 'אבידה או מציאה' : 'מודעת יד שנייה') + '</h2>' +
      '<form class="sp-f" novalidate>' +
      (lost
        ? '<div class="sp-seg" role="group" aria-label="סוג הדיווח"><button type="button" data-st="lost" aria-pressed="true">אבד לי</button><button type="button" data-st="found" aria-pressed="false">מצאתי</button></div>' +
          '<label class="l">שם הפריט<input type="text" name="ttl" maxlength="80" placeholder="למשל: מפתחות עם מחזיק כחול"></label>' +
          '<label class="l">תיאור<textarea name="desc" maxlength="800" placeholder="איפה ומתי, סימנים מזהים…"></textarea></label>'
        : '<div class="sp-seg" role="group" aria-label="סוג המודעה"><button type="button" data-free="1" aria-pressed="true">מסירה בחינם</button><button type="button" data-free="0" aria-pressed="false">מכירה</button></div>' +
          '<label class="l">כותרת *<input type="text" name="ttl" maxlength="80" placeholder="למשל: עגלת תינוק" required></label>' +
          '<label class="l">תיאור<textarea name="desc" maxlength="800" placeholder="מצב, מידות, מתי אפשר לאסוף…"></textarea></label>' +
          '<div class="sp-sec" data-sale hidden><span>קטגוריה *</span><div class="sp-chips" data-cats>' +
            CATS.map(function (c) { return '<button type="button" data-cat="' + c[0] + '" aria-pressed="false">' + c[1] + '</button>'; }).join('') + '</div></div>' +
          '<label class="l" data-sale hidden>מחיר (₪) *<input type="number" name="price" inputmode="decimal" min="0" step="1" dir="ltr"></label>' +
          '<div class="sp-sec"><span>מצב</span><div class="sp-seg" role="group" aria-label="מצב"><button type="button" data-cond="2" aria-pressed="true">משומש</button><button type="button" data-cond="1" aria-pressed="false">חדש</button></div></div>'
      ) +
      '<div class="sp-sec"><span>' + (lost ? 'תמונה' : 'תמונות <small style="font-weight:600;color:#8A94A6">(עד 5)</small>') + '</span><div class="sp-imgs" data-imgs></div></div>' +
      (lost ? '' : addrHtml('addr', 'מקום איסוף', 'רחוב ומספר', false)) +
      '<label class="l">שם איש קשר *<input type="text" name="cname" maxlength="60" autocomplete="name" required></label>' +
      '<label class="l">טלפון *<input type="tel" name="phone" dir="ltr" inputmode="tel" autocomplete="tel-national" placeholder="050-0000000" required></label>' +
      (lost ? '<p class="sp-hint">* יש למלא לפחות שם פריט, תיאור או תמונה</p>' : '') +
      '<div data-dup></div>' +
      '<p class="sa-msg" hidden></p>' +
      '<button class="sa-b pri" type="submit">פרסום</button>' +
      '<p class="sa-small">המודעה תופיע באפליקציה מיד, ובאתר תוך כשעה. עריכה ומחיקה — באפליקציה.</p>' +
      '</form>', true);
    var f = d.querySelector('form'), btn = f.querySelector('[type=submit]');
    var ad = lost ? null : addrBind(A, f, { name: 'addr', cid: cid });
    var loc = null;

    // מילוי מוקדם של פרטי הקשר מהחשבון (כמו באפליקציה)
    var meta = user.user_metadata || {};
    if (meta.full_name || meta.name) f.elements.cname.value = meta.full_name || meta.name;
    sb.from('userdata').select('owner_name,owner_phone').eq('user_id', user.id).maybeSingle().then(function (r) {
      var u = r.data || {};
      if (u.owner_name && !f.elements.cname.value) f.elements.cname.value = u.owner_name;
      if (u.owner_phone && !f.elements.phone.value) f.elements.phone.value = u.owner_phone;
    }, function () {});

    function seg(attr, on) { [].forEach.call(f.querySelectorAll('[' + attr + ']'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute(attr) === on)); }); }
    f.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b || b.type === 'submit') return; A.setErr('');
      if (b.hasAttribute('data-st')) { st.status = b.getAttribute('data-st'); seg('data-st', st.status); }
      else if (b.hasAttribute('data-free')) {
        st.free = b.getAttribute('data-free') === '1'; seg('data-free', b.getAttribute('data-free'));
        [].forEach.call(f.querySelectorAll('[data-sale]'), function (x) { x.hidden = st.free; });
      }
      else if (b.hasAttribute('data-cat')) { st.cat = b.getAttribute('data-cat'); seg('data-cat', st.cat); }
      else if (b.hasAttribute('data-cond')) { st.cond = +b.getAttribute('data-cond'); seg('data-cond', String(st.cond)); }
      else if (b.hasAttribute('data-rm')) { st.files.splice(+b.getAttribute('data-rm'), 1); drawImgs(); }
    });
    f.addEventListener('input', function (e) { A.setErr(''); if (e.target.name === 'ttl') { st.dupOk = false; f.querySelector('[data-dup]').innerHTML = ''; } });

    var imgs = f.querySelector('[data-imgs]');
    function drawImgs() {
      imgs.innerHTML = st.files.map(function (x, i) {
        return '<span class="sp-th"><img src="' + x.url + '" alt=""><button type="button" data-rm="' + i + '" aria-label="הסרת תמונה">×</button></span>';
      }).join('') + (st.files.length < MAXI
        ? '<label class="sp-add"><b>+</b>' + (st.files.length ? 'עוד' : 'הוספה') + '<input type="file" accept="image/*"' + (MAXI > 1 ? ' multiple' : '') + '></label>' : '');
      var inp = imgs.querySelector('input[type=file]');
      if (inp) inp.addEventListener('change', function () {
        [].slice.call(inp.files || []).forEach(function (file) {
          if (st.files.length >= MAXI || !/^image\//.test(file.type || 'image/')) return;
          st.files.push({ file: file, url: URL.createObjectURL(file) });
        });
        drawImgs();
      });
    }
    drawImgs();

    function fail(msg) { A.busy(btn, false); A.setErr(msg); }
    function failDb(e) {
      var m = (e && (e.message || e.hint)) || '';
      if (/phone_not_verified|נדרש אימות טלפון/.test(m)) { A.busy(btn, false); return A.reverify(); }
      fail('לא הצלחנו לפרסם. נסו שוב');
    }

    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var title = f.elements.ttl.value.trim(), desc = f.elements.desc.value.trim(), name = f.elements.cname.value.trim(), phone = digits(f.elements.phone.value);
      if (lost) { if (!title && !desc && !st.files.length) return A.setErr('יש למלא לפחות שם פריט, תיאור או תמונה'); }
      else {
        if (!title) return A.setErr('נא למלא כותרת');
        if (!st.free && !st.cat) return A.setErr('נא לבחור קטגוריה');
        if (!st.free && f.elements.price.value === '') return A.setErr('במכירה צריך לציין מחיר');
        if (!st.free && !(+f.elements.price.value >= 0)) return A.setErr('מחיר לא תקין');
      }
      if (name.length < 2) return A.setErr('נא למלא שם איש קשר');
      if (!phoneOk(phone)) return A.setErr('נא למלא מספר טלפון תקין');
      A.setErr(''); A.busy(btn, true, 'בודקים…');

      (ad ? addrResolve(A, ad, { cid: cid }) : Promise.resolve({ cid: cid })).then(function (L) {
        loc = L;
        return checkDup(title, L.cid);
      }).then(function (dup) {
        if (dup === 'stop') return;
        if (dup && lost) return fail((st.status === 'lost' ? 'אבידה' : 'מציאה') + ' בשם "' + title + '" כבר קיימת בשכונה');
        if (dup && !st.dupOk) {
          A.busy(btn, false);
          var box = f.querySelector('[data-dup]');
          box.innerHTML = '<div class="sp-dup"><p>כבר יש בשכונה מודעה בשם "' + esc(dup) + '". להמשיך בכל זאת?</p><button class="sa-b" type="button" data-go>כן, לפרסם</button></div>';
          box.querySelector('[data-go]').addEventListener('click', function () { st.dupOk = true; box.innerHTML = ''; f.requestSubmit ? f.requestSubmit() : btn.click(); });
          return;
        }
        return (lost ? saveLost(title, desc, name, phone) : saveSecond(title, desc, name, phone)).then(done, function (e) {
          if (e && e.message === 'img') return fail('אחת התמונות לא נתמכת. נסו תמונה אחרת');
          failDb(e);
        });
      }).catch(function () { fail('אין חיבור. נסו שוב'); });
    });

    function checkDup(title, fcid) {
      if (!title) return Promise.resolve(null);
      var q = lost
        ? sb.from('lost_and_found').select('title').eq('community_id', fcid).eq('status', st.status).ilike('title', title.replace(/[%_\\]/g, '\\$&'))
        : sb.from('second_hand_items').select('name').eq('community_id', fcid).eq('is_blocked', false).ilike('name', title.replace(/[%_\\]/g, '\\$&'));
      return q.limit(1).then(function (r) { var x = r.data && r.data[0]; return x ? (x.title || x.name) : null; }, function () { return null; });
    }

    function shrinkAll() {
      return st.files.reduce(function (p, x) { return p.then(function (arr) { return shrink(x.file).then(function (b) { arr.push(b); return arr; }); }); }, Promise.resolve([]));
    }

    function saveSecond(title, desc, name, phone) {
      A.busy(btn, true, st.files.length ? 'מעלים תמונות…' : 'מפרסמים…');
      var ts = Date.now();
      return shrinkAll().then(function (blobs) {
        return Promise.all(blobs.map(function (b, i) { return upload(sb, 'secondhand/' + ts + '_' + i + '.jpg', b); }));
      }).then(function (urls) {
        A.busy(btn, true, 'מפרסמים…');
        var now = new Date().toISOString();
        return sb.from('second_hand_items').insert({
          community_id: loc.cid, user_id: user.id, name: title, description: desc, category: st.cat,
          is_free: st.free, condition: st.cond, price: st.free ? 0 : +f.elements.price.value, image_urls: urls,
          address: loc.address, latitude: loc.lat, longitude: loc.lng, seller_name: name, seller_phone: phone,
          created_at: now, updated_at: now
        }).then(function (r) { if (r.error) throw r.error; });
      });
    }

    function saveLost(title, desc, name, phone) {
      A.busy(btn, true, 'מפרסמים…');
      var blob = null;
      return (st.files.length ? shrink(st.files[0].file).then(function (b) { blob = b; }) : Promise.resolve()).then(function () {
        return sb.from('lost_and_found').insert({
          community_id: cid, status: st.status, title: title || null, description: desc || null,
          contact_name: name, contact_phone: phone, user_id: user.id
        }).select('id').single();
      }).then(function (r) {
        if (r.error) throw r.error;
        if (!blob) return;
        var id = r.data.id;
        A.busy(btn, true, 'מעלים תמונה…');
        // המודעה כבר פורסמה; אם התמונה נכשלה — לא מכשילים, אפשר להוסיף באפליקציה
        return upload(sb, 'lost_and_found/' + id + '/0.jpg', blob).then(function (url) {
          return sb.from('lost_and_found').update({ image_url: url + '?v=' + Date.now() }).eq('id', id);
        }).catch(function () { st.imgFailed = true; });
      });
    }

    function done() {
      try { if (window.shchunaTrack) window.shchunaTrack('post', kind); } catch (e) {}
      st.files.forEach(function (x) { URL.revokeObjectURL(x.url); });
      var dd = A.open(
        '<div class="sp-done" aria-hidden="true">🎉</div>' +
        '<h2 id="sa-h" style="text-align:center;padding:0">פורסם!</h2>' +
        '<p style="text-align:center">המודעה כבר באפליקציה, ותופיע כאן באתר תוך כשעה.' + (st.imgFailed ? ' התמונה לא עלתה — אפשר להוסיף אותה באפליקציה.' : '') + '</p>' +
        '<p class="sa-note">רוצים לערוך או להסיר את המודעה? זה באפליקציה, עם אותו חשבון.</p>' +
        '<a class="sa-b pri" href="' + DOWNLOAD + '">להורדת האפליקציה</a>' +
        '<button class="sa-b" type="button" data-c>סגירה</button>');
      dd.querySelector('[data-c]').addEventListener('click', A.close);
    }
  }

  /* מסך "פורסם!" משותף לכל הטפסים */
  function doneView(A, kind, o) {
    o = o || {};
    try { if (window.shchunaTrack) window.shchunaTrack('post', kind); } catch (e) {}
    var dd = A.open(
      '<div class="sp-done" aria-hidden="true">🎉</div>' +
      '<h2 id="sa-h" style="text-align:center;padding:0">' + (o.title || 'פורסם!') + '</h2>' +
      '<p style="text-align:center">' + (o.text || 'המודעה כבר באפליקציה, ותופיע כאן באתר תוך כשעה.') + (o.extra || '') + '</p>' +
      (o.noApp ? '' : '<p class="sa-note">' + (o.note || 'רוצים לערוך או להסיר את המודעה? זה באפליקציה, עם אותו חשבון.') + '</p>' +
      '<a class="sa-b pri" href="' + DOWNLOAD + '">להורדת האפליקציה</a>') +
      '<button class="sa-b" type="button" data-c>סגירה</button>');
    dd.querySelector('[data-c]').addEventListener('click', A.close);
  }
  /* מילוי מוקדם של שם וטלפון מהחשבון */
  function prefill(A, nameEl, phoneEl) {
    var meta = A.user.user_metadata || {};
    if (nameEl && !nameEl.value && (meta.full_name || meta.name)) nameEl.value = meta.full_name || meta.name;
    return A.sb.from('userdata').select('owner_name,owner_phone,email').eq('user_id', A.user.id).maybeSingle().then(function (r) {
      var u = r.data || {};
      if (nameEl && u.owner_name && !nameEl.value) nameEl.value = u.owner_name;
      if (phoneEl && u.owner_phone && !phoneEl.value) phoneEl.value = u.owner_phone;
      return u;
    }, function () { return {}; });
  }
  function ilikeEsc(v) { return String(v).replace(/[%_\\]/g, '\\$&'); }

  /* ════ כתובת כמו AddressLocationPicker באפליקציה ════
   * שדה אחד "רחוב ומספר", הצעות מ-search_streets (השכונה נקבעת לפי הרחוב — P-23),
   * geocoding ב-Nominatim רק כשיש מספר בית (כמו CommunityGeocoder; ניסיון שני בלי המספר).
   * רחוב שלא במאגר — נשמר כמו שהוקלד, בלי שאלה (מדיניות 7.11): השרת מכניס אותו לבדיקה
   * (trg_z_queue_unknown_address → new_streets, notes='auto'). האתר לא כותב ל-new_streets. */
  var cityCache = {};
  function cityOf(sb, cid) {
    if (cityCache[cid]) return cityCache[cid];
    return (cityCache[cid] = sb.from('community').select('id,neighborhood,city').eq('id', cid).maybeSingle().then(function (r) { return r.data || {}; }, function () { return {}; }));
  }
  function streetPart(v) { return String(v || '').replace(/^רחוב\s+/, '').replace(/\s+\d+.*$/, '').trim(); }
  function addrHtml(name, label, hint, req) {
    return '<div class="sp-sec"><span>' + label + (req ? ' *' : ' <small style="font-weight:600;color:#8A94A6">לא חובה</small>') + '</span><div style="position:relative">' +
      '<input type="text" name="' + name + '" maxlength="150" autocomplete="off" placeholder="' + (hint || 'התחל להקליד שם רחוב…') + '">' +
      '<div class="sp-sug" data-sug="' + name + '" hidden></div></div><p class="sp-hint" data-ahood="' + name + '"></p></div>';
  }
  function addrBind(A, f, o) {
    var inp = f.elements[o.name], sug = f.querySelector('[data-sug="' + o.name + '"]'), hint = f.querySelector('[data-ahood="' + o.name + '"]');
    var st = { pick: null }, t = null, seq = 0;
    function say(x) { hint.textContent = x ? 'שכונה: ' + x.community_name + (x.community_id !== o.cid ? ' (יפורסם שם)' : '') : ''; }
    inp.addEventListener('input', function () {
      if (st.pick && streetPart(inp.value) !== st.pick.street_name) { st.pick = null; say(null); }
      clearTimeout(t); var q = streetPart(inp.value);
      if (q.length < 2 || (st.pick && q === st.pick.street_name)) { sug.hidden = true; return; }
      t = setTimeout(function () {
        var my = ++seq;
        cityOf(A.sb, o.cid).then(function (c) {
          return A.sb.rpc('search_streets', { p_city: c.city || 'ירושלים', p_query: q, p_prefer_community: o.cid, p_limit: 12 });
        }).then(function (r) {
          if (my !== seq) return;
          var rows = (r && r.data) || [];
          if (!rows.length) { sug.hidden = true; return; }
          sug.innerHTML = rows.map(function (x, i) { return '<button type="button" data-i="' + i + '">' + A.esc(x.street_name) + ' <small>· ' + A.esc(x.community_name || '') + '</small></button>'; }).join('');
          sug.hidden = false;
          sug.onclick = function (e) {
            var b = e.target.closest('[data-i]'); if (!b) return;
            var x = rows[+b.getAttribute('data-i')], num = (inp.value.match(/\s+(\d+[א-ת]?)\s*$/) || [])[1];
            inp.value = x.street_name + (num ? ' ' + num : ' '); sug.hidden = true; st.pick = x; say(x); inp.focus();
          };
        });
      }, 250);
    });
    inp.addEventListener('blur', function () { setTimeout(function () { sug.hidden = true; }, 200); });
    st.set = function (x) { st.pick = x; say(x); };
    st.input = inp; st.hint = hint;
    return st;
  }
  function geocode(address, city) {
    function one(q) {
      return fetch('https://nominatim.openstreetmap.org/search?' + new URLSearchParams({ q: q + (city ? ', ' + city : '') + ', ישראל', format: 'json', limit: '1', countrycodes: 'il,ps', addressdetails: '1', 'accept-language': 'he' }))
        .then(function (r) { return r.ok ? r.json() : []; }).then(function (j) { return j && j[0] ? { lat: +j[0].lat, lng: +j[0].lon } : null; }, function () { return null; });
    }
    return one(address).then(function (p) {
      if (p) return p;
      var noNum = address.replace(/\s*\d+[א-ת]?\s*$/, '').trim();
      if (!noNum || noNum === address.trim()) return null;
      return new Promise(function (r) { setTimeout(r, 1000); }).then(function () { return one(noNum); });
    });
  }
  /* בזמן שמירה: { address, lat, lng, cid, cname }.
   * השכונה: לפי הרחוב שנבחר מההצעות; בלי בחירה — אם הרחוב קיים בשכונה של ההוספה, ממנה; אחרת נשאר בשכונה של ההוספה. */
  function addrResolve(A, st, o) {
    var address = st.input.value.trim().replace(/\s+/g, ' ');
    if (!address) return Promise.resolve({ address: null, lat: null, lng: null, cid: o.cid });
    var street = streetPart(address);
    var pickP = st.pick ? Promise.resolve(st.pick) : cityOf(A.sb, o.cid).then(function (c) {
      return A.sb.rpc('search_streets', { p_city: c.city || 'ירושלים', p_query: street, p_prefer_community: o.cid, p_limit: 10 }).then(function (r) {
        return ((r && r.data) || []).filter(function (x) { return x.street_name === street && x.community_id === o.cid; })[0] || null;
      }, function () { return null; });
    });
    return pickP.then(function (x) {
      if (x) st.set(x);
      var cid = x ? x.community_id : o.cid;
      return cityOf(A.sb, cid).then(function (c) {
        var res = { address: address, lat: null, lng: null, cid: cid, cname: x ? x.community_name : c.neighborhood };
        if (!/\d/.test(address)) return res;
        return geocode(address, c.city).then(function (p) { if (p) { res.lat = p.lat; res.lng = p.lng; } return res; });
      });
    });
  }
  /* תיבת אישור בתוך הטופס (לא מחליפה את החלון, כדי לא לאבד את מה שהוקלד) */
  function confirmIn(f, html, buttons) {
    var box = f.querySelector('[data-dup]');
    return new Promise(function (res) {
      box.innerHTML = '<div class="sp-dup">' + html + buttons.map(function (b, i) { return '<button class="sa-b' + (i === 0 ? '' : '') + '" type="button" data-k="' + i + '">' + b + '</button>'; }).join('') + '</div>';
      box.scrollIntoView({ block: 'center', behavior: 'smooth' });
      box.onclick = function (e) { var b = e.target.closest('[data-k]'); if (!b) return; box.innerHTML = ''; box.onclick = null; res(+b.getAttribute('data-k')); };
    });
  }
  /* אימות טלפון ליצירת קשר ששונה מהטלפון המאומת (Helper.verifyPhoneIfNeeded) — קו נייח לא מאומת.
   * המשתמש כבר מאומת, ולכן verify-sms-code לא נוגע ב-userdata (scope=entity). */
  function verifyContactPhone(A, f, phone) {
    var clean = String(phone || '').replace(/[\s\-]/g, '');
    if (!clean) return Promise.resolve(true);
    return A.sb.from('userdata').select('owner_phone').eq('user_id', A.user.id).maybeSingle().then(function (r) {
      var mine = String((r.data && r.data.owner_phone) || '').replace(/[\s\-]/g, '');
      if (mine && mine === clean) return true;
      if (!/^(\+?972|0)5\d{8}$/.test(clean)) return true; // לא נייד → כמו קו נייח באפליקציה
      var box = f.querySelector('[data-dup]');
      return new Promise(function (res) {
        function send() {
          box.innerHTML = '<div class="sp-dup"><p>שולחים קוד אימות ל-' + clean + '…</p></div>';
          A.sb.functions.invoke('send-verification-sms', { body: { phone: clean } }).then(function (x) {
            if (x.error || (x.data && x.data.success === false)) { box.innerHTML = '<div class="sp-dup"><p>לא הצלחנו לשלוח קוד. נסו שוב.</p><button class="sa-b" type="button" data-again>שליחה חוזרת</button><button class="sa-b" type="button" data-cancel>ביטול</button></div>'; return; }
            box.innerHTML = '<div class="sp-dup"><p>טלפון ליצירת קשר שונה מהטלפון שלך — יש לאמת אותו. הקלידו את הקוד שנשלח ב-SMS ל-' + clean + '</p>' +
              '<input type="text" inputmode="numeric" dir="ltr" maxlength="6" data-code style="height:46px;border-radius:12px;border:1.5px solid #DCE2EC;padding:0 12px;font-size:18px;text-align:center;letter-spacing:4px">' +
              '<button class="sa-b pri" type="button" data-ok>אימות</button><button class="sa-b" type="button" data-cancel>ביטול</button><p class="sp-hint" data-cerr></p></div>';
            box.querySelector('[data-code]').focus();
          });
        }
        box.onclick = function (e) {
          if (e.target.closest('[data-again]')) return send();
          if (e.target.closest('[data-cancel]')) { box.innerHTML = ''; box.onclick = null; return res(false); }
          if (e.target.closest('[data-ok]')) {
            var code = (box.querySelector('[data-code]').value || '').trim();
            if (!/^\d{4,6}$/.test(code)) { box.querySelector('[data-cerr]').textContent = 'הקוד חייב להכיל 4-6 ספרות'; return; }
            A.sb.functions.invoke('verify-sms-code', { body: { phone: clean, code: code } }).then(function (x) {
              if (!x.error && x.data && x.data.success) { box.innerHTML = ''; box.onclick = null; return res(true); }
              box.querySelector('[data-cerr]').textContent = (x.data && x.data.error) || 'הקוד שגוי, נסה שוב';
            });
          }
        };
        send();
      });
    });
  }
  function distM(a, b, c, d) { var R = 6371000, r = Math.PI / 180, x = (c - a) * r, y = (d - b) * r; var h = Math.sin(x / 2) * Math.sin(x / 2) + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) * Math.sin(y / 2); return 2 * R * Math.asin(Math.sqrt(h)); }

  window.ShchunaPost = { form: form };
  window.ShchunaKit = { css: css, shrink: shrink, upload: upload, phoneOk: phoneOk, digits: digits, doneView: doneView, prefill: prefill, ilikeEsc: ilikeEsc, DOWNLOAD: DOWNLOAD,
    addrHtml: addrHtml, addrBind: addrBind, addrResolve: addrResolve, confirmIn: confirmIn,
    verifyContactPhone: verifyContactPhone, geocode: geocode, distM: distM, cityOf: cityOf };
  window.ShchunaForms = window.ShchunaForms || {};
  window.ShchunaForms.second = function (cid, A) { form('second', cid, A); };
  window.ShchunaForms.lost = function (cid, A) { form('lost', cid, A); };
})();
