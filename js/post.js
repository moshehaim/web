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
    '.sp-f{display:flex;flex-direction:column;gap:14px}' +
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
    '.sp-done{font-size:44px;text-align:center;line-height:1}';

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
      (lost ? '' : '<label class="l">מקום איסוף <small>לא חובה</small><input type="text" name="addr" maxlength="120" placeholder="רחוב, מספר"></label>') +
      '<label class="l">שם איש קשר *<input type="text" name="cname" maxlength="60" autocomplete="name" required></label>' +
      '<label class="l">טלפון *<input type="tel" name="phone" dir="ltr" inputmode="tel" autocomplete="tel-national" placeholder="050-0000000" required></label>' +
      (lost ? '<p class="sp-hint">* יש למלא לפחות שם פריט, תיאור או תמונה</p>' : '') +
      '<div data-dup></div>' +
      '<p class="sa-msg" hidden></p>' +
      '<button class="sa-b pri" type="submit">פרסום</button>' +
      '<p class="sa-small">המודעה תופיע באפליקציה מיד, ובאתר תוך כשעה. עריכה ומחיקה — באפליקציה.</p>' +
      '</form>', true);
    var f = d.querySelector('form'), btn = f.querySelector('[type=submit]');

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

      checkDup(title).then(function (dup) {
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

    function checkDup(title) {
      if (!title) return Promise.resolve(null);
      var q = lost
        ? sb.from('lost_and_found').select('title').eq('community_id', cid).eq('status', st.status).ilike('title', title.replace(/[%_\\]/g, '\\$&'))
        : sb.from('second_hand_items').select('name').eq('community_id', cid).eq('is_blocked', false).ilike('name', title.replace(/[%_\\]/g, '\\$&'));
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
        var now = new Date().toISOString(), addr = f.elements.addr.value.trim();
        return sb.from('second_hand_items').insert({
          community_id: cid, user_id: user.id, name: title, description: desc, category: st.cat,
          is_free: st.free, condition: st.cond, price: st.free ? 0 : +f.elements.price.value, image_urls: urls,
          address: addr || null, latitude: null, longitude: null, seller_name: name, seller_phone: phone,
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

  window.ShchunaPost = { form: form };
})();
