/* נדל"ן מהאתר — דירה למכירה (approve_property) ולהשכרה (approved_rental_properties), ופרסום מהיר למתווכים (AI).
 * אותם שדות וכללים כמו AddPropertyScreen / BrokerQuickListingScreen באפליקציה.
 * רחוב נבחר מרשימה (RPC search_streets) — השכונה נקבעת לפי הרחוב (P-23). בלי נקודה במפה: snap_location בשרת.
 * תמונות: אחרי ה-insert, ב-images/properties/{sale|rental}/{id}/{i}.jpg, ואז update של image_urls.
 * מסלול המתווך באתר עובר אימות טלפון ובדיקת כפילות (באפליקציה הוא מדלג עליהם). */
(function () {
  var K = window.ShchunaKit;
  var TYPES = [['apartment', 'דירה'], ['cottage', 'קוטג׳'], ['duplex', 'דופלקס'], ['penthouse', 'פנטהאוז'], ['gardenApartment', 'דירת גן'], ['lot', 'מגרש'], ['business', 'עסק'], ['other', 'אחר']];
  var CONDS = ['חדשה מקבלן', 'משופצת', 'במצב טוב', 'דרושה שיפוץ'];
  var FEATS = [['elev', 'has_elevator', 'מעלית'], ['park', 'has_parking', 'חניה'], ['safe', 'has_safe_room', 'ממ״ד'], ['balc', 'has_balcony', 'מרפסת'], ['sukka', 'has_sukkah_balcony', 'מרפסת סוכה'], ['stor', 'has_storage', 'מחסן']];
  var PHONE_RE = /^(\+972|0)(5[0-9]|7[0-9]|[2-4]|[8-9])[0-9]{7}$/;
  var MAXI = 10;
  function ymd(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function plusDays(n) { var d = new Date(); d.setDate(d.getDate() + n); return d; }
  function norm(s) { return String(s || '').toLowerCase().replace(/\s+/g, ''); }
  function num(v) { v = String(v == null ? '' : v).replace(/,/g, '').trim(); return v === '' ? null : +v; }

  function communityInfo(sb, cid) {
    return sb.from('community').select('neighborhood,city').eq('id', cid).maybeSingle().then(function (r) { return r.data || {}; }, function () { return {}; });
  }

  /* בוחר רחוב: הצעות מ-search_streets; בחירה קובעת שכונה. הקלדה חופשית — נשאר בשכונה של העמוד. */
  function streetPicker(A, root, info, cid, onPick) {
    var inp = root.querySelector('[name=street]'), sug = root.querySelector('[data-sug]'), t = null, seq = 0;
    inp.addEventListener('input', function () {
      onPick(null);
      clearTimeout(t); var q = inp.value.trim();
      if (q.length < 2) { sug.hidden = true; return; }
      t = setTimeout(function () {
        var my = ++seq;
        A.sb.rpc('search_streets', { p_city: info.city || 'ירושלים', p_query: q, p_prefer_community: cid, p_limit: 12 }).then(function (r) {
          if (my !== seq) return;
          var rows = r.data || [];
          if (!rows.length) { sug.hidden = true; return; }
          sug.innerHTML = rows.map(function (x, i) { return '<button type="button" data-i="' + i + '">' + A.esc(x.street_name) + ' <small>· ' + A.esc(x.community_name || '') + '</small></button>'; }).join('');
          sug.hidden = false;
          sug.onclick = function (e) {
            var b = e.target.closest('[data-i]'); if (!b) return;
            var x = rows[+b.getAttribute('data-i')];
            inp.value = x.street_name; sug.hidden = true; onPick(x);
          };
        });
      }, 250);
    });
  }

  /* הטופס המלא. o: { sale, draft (שדות מה-AI), files (תמונות שכבר נבחרו), broker } */
  function propForm(cid, A, o) {
    K.css();
    var esc = A.esc, sale = !!o.sale, dr = o.draft || {};
    var types = sale ? TYPES : TYPES.filter(function (t) { return t[0] !== 'lot'; });
    var st = { type: dr.property_type && types.some(function (t) { return t[0] === dr.property_type; }) ? dr.property_type : 'apartment', rooms: dr.num_rooms || 3, files: (o.files || []).slice(), street: null, dupOk: false, phoneOk: false };
    var d = A.open('<h2 id="sa-h">' + (sale ? 'דירה למכירה' : 'דירה להשכרה') + '</h2>' +
      '<form class="sp-f" novalidate>' +
      '<label class="l">סוג נכס *<select name="ptype">' + types.map(function (t) { return '<option value="' + t[0] + '"' + (t[0] === st.type ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') + '</select></label>' +
      '<div class="sp-sec"><span>כתובת</span><div class="sp-row"><div style="position:relative"><input type="text" name="street" maxlength="80" placeholder="התחל להקליד שם רחוב…" autocomplete="off" aria-label="רחוב"><div class="sp-sug" data-sug hidden></div></div>' +
        '<input type="text" name="house" maxlength="10" placeholder="מספר" aria-label="מספר בית" inputmode="numeric"></div><p class="sp-hint" data-hood></p></div>' +
      '<label class="l">' + (sale ? 'מחיר מבוקש' : 'שכר דירה חודשי') + ' (₪) *<input type="number" name="price" inputmode="numeric" min="1" dir="ltr"></label>' +
      '<div data-rooms class="sp-sec"><span>חדרים *</span><div class="sp-row" style="grid-template-columns:auto 1fr auto;align-items:center"><button type="button" class="sa-b" data-r="-1" style="width:50px">−</button><b data-rv style="text-align:center;font-size:20px"></b><button type="button" class="sa-b" data-r="1" style="width:50px">+</button></div></div>' +
      '<div class="sp-row"><label class="l">שטח (מ״ר) *<input type="number" name="area" inputmode="numeric" min="1" dir="ltr"></label>' +
        '<label class="l" data-floor>קומה *<input type="number" name="floor" inputmode="numeric" step="1" dir="ltr"></label></div>' +
      '<div class="sp-row" data-floor><label class="l">קומות בבניין <small>לא חובה</small><input type="number" name="tfloors" inputmode="numeric" step="1" dir="ltr"></label>' +
        '<label class="l" data-cond>מצב הנכס<select name="cond">' + CONDS.map(function (c) { return '<option' + ((dr.property_condition || 'משופצת') === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></label></div>' +
      '<div class="sp-sec" data-feats><span>תכונות הנכס</span><div class="sp-chkg">' + FEATS.map(function (x) { return '<label class="sp-chk"><input type="checkbox" name="' + x[0] + '"> ' + x[2] + '</label>'; }).join('') + '</div>' +
        '<div class="sp-row"><label class="l" data-park hidden>מקומות חניה<input type="number" name="pspots" min="1" value="1" dir="ltr"></label><label class="l" data-balc hidden>שטח מרפסת (מ״ר)<input type="number" name="barea" min="1" dir="ltr"></label></div>' +
        (sale ? '<label class="sp-chk"><input type="checkbox" name="units"> יש יחידות דיור להשכרה</label><label class="l" data-units hidden>מספר יחידות דיור<input type="number" name="ucount" min="1" dir="ltr"></label>' : '') +
      '</div>' +
      (sale ? '' : '<div class="sp-sec"><span>פרטים נוספים להשכרה</span><label class="sp-chk"><input type="checkbox" name="furn"> כולל ריהוט</label><div class="sp-row"><label class="l">ארנונה חודשית (₪)<input type="number" name="tax" min="0" dir="ltr"></label><label class="l">ועד בית חודשי (₪)<input type="number" name="fees" min="0" dir="ltr"></label></div></div>') +
      '<label class="l" data-date>' + (sale ? 'תאריך פינוי' : 'תאריך כניסה') + ' <small>לא חובה</small><input type="date" name="avail" min="' + ymd(new Date()) + '" max="' + ymd(plusDays(730)) + '"></label>' +
      '<label class="l">תיאור <small>לא חובה</small><textarea name="desc" rows="4" maxlength="3000" placeholder="ספר עוד על הנכס…"></textarea></label>' +
      '<div class="sp-sec"><span>תמונות <small style="font-weight:600;color:#8A94A6">(עד 10)</small></span><div class="sp-imgs" data-imgs></div></div>' +
      '<div class="sp-sec"><span>פרטי התקשרות</span><label class="sp-chk"><input type="checkbox" name="broker"> אני מתווך/סוכן נדל״ן</label>' +
        '<div class="sp-row"><input type="text" name="cname" maxlength="60" placeholder="שם איש קשר" aria-label="שם איש קשר"><input type="tel" name="phone" dir="ltr" inputmode="tel" placeholder="טלפון" aria-label="טלפון"></div>' +
        '<button type="button" class="sp-more" data-more2>+ איש קשר נוסף</button><div class="sp-row" data-c2 hidden><input type="text" name="cname2" maxlength="60" placeholder="שם איש קשר נוסף" aria-label="שם איש קשר נוסף"><input type="tel" name="phone2" dir="ltr" inputmode="tel" placeholder="טלפון נוסף" aria-label="טלפון נוסף"></div></div>' +
      '<div data-dup></div><p class="sa-msg" hidden></p>' +
      '<button class="sa-b pri" type="submit">' + (sale ? 'פרסם נכס למכירה' : 'פרסם נכס להשכרה') + '</button>' +
      '<p class="sa-small">המודעה תופיע באפליקציה מיד, ובאתר תוך כשעה. עריכה ומחיקה — באפליקציה.</p></form>', true);
    var f = d.querySelector('form'), E = f.elements, btn = f.querySelector('[type=submit]'), info = {};

    // מילוי מטיוטה (AI) או מהחשבון
    if (dr.street) E.street.value = dr.street;
    if (dr.house_number) E.house.value = dr.house_number;
    if (dr.asking_price) E.price.value = dr.asking_price;
    if (dr.area_in_sqm) E.area.value = dr.area_in_sqm;
    if (dr.floor != null) E.floor.value = dr.floor;
    if (dr.total_floors != null) E.tfloors.value = dr.total_floors;
    if (dr.description) E.desc.value = dr.description;
    FEATS.forEach(function (x) { if (dr[x[1]] === true) E[x[0]].checked = true; });
    if (dr.parking_spots) E.pspots.value = dr.parking_spots;
    if (dr.balcony_area_in_sqm) E.barea.value = dr.balcony_area_in_sqm;
    E.broker.checked = !!o.broker;
    K.prefill(A, E.cname, E.phone);

    function drawRooms() { f.querySelector('[data-rv]').textContent = st.rooms; }
    function drawType() {
      var t = E.ptype.value, lotBiz = t === 'lot' || t === 'business';
      f.querySelector('[data-rooms]').hidden = lotBiz;
      [].forEach.call(f.querySelectorAll('[data-floor]'), function (x) { x.hidden = lotBiz; });
      f.querySelector('[data-feats]').hidden = lotBiz;
      f.querySelector('[data-cond]').hidden = t === 'lot';
      f.querySelector('[data-date]').hidden = t === 'lot';
    }
    function drawFeats() {
      f.querySelector('[data-park]').hidden = !E.park.checked;
      f.querySelector('[data-balc]').hidden = !E.balc.checked && !E.sukka.checked;
      if (sale) f.querySelector('[data-units]').hidden = !E.units.checked;
    }
    drawRooms(); drawType(); drawFeats();
    f.addEventListener('change', function (e) {
      A.setErr('');
      if (e.target.name === 'ptype') drawType();
      if (e.target.name === 'sukka' && E.sukka.checked) E.balc.checked = true;
      drawFeats();
      if (e.target.name === 'phone') st.phoneOk = false;
    });
    f.addEventListener('input', function (e) { A.setErr(''); if (e.target.name === 'street' || e.target.name === 'house') { st.dupOk = false; f.querySelector('[data-dup]').innerHTML = ''; } });
    f.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b || b.type === 'submit') return;
      if (b.hasAttribute('data-r')) { st.rooms = Math.min(12, Math.max(1, st.rooms + 0.5 * +b.getAttribute('data-r'))); drawRooms(); }
      else if (b.hasAttribute('data-more2')) { b.hidden = true; f.querySelector('[data-c2]').hidden = false; }
      else if (b.hasAttribute('data-rm')) { st.files.splice(+b.getAttribute('data-rm'), 1); drawImgs(); }
    });

    var hoodP = f.querySelector('[data-hood]');
    communityInfo(A.sb, cid).then(function (x) { Object.assign(info, x); hoodP.textContent = 'שכונה: ' + (x.neighborhood || '') + ' — נקבעת לפי הרחוב שנבחר'; });
    streetPicker(A, f, info, cid, function (x) {
      st.street = x;
      if (x) hoodP.textContent = 'שכונה: ' + x.community_name + (x.community_id !== cid ? ' (המודעה תתפרסם שם)' : '');
    });
    // אם יש רחוב מה-AI — לנסות לזהות אותו מראש
    if (dr.street) A.sb.rpc('search_streets', { p_city: 'ירושלים', p_query: dr.street, p_prefer_community: cid, p_limit: 5 }).then(function (r) {
      var rows = (r.data || []).filter(function (x) { return x.street_name === dr.street; });
      var one = rows.filter(function (x) { return x.community_id === cid; })[0] || (rows.length === 1 ? rows[0] : null);
      if (one) { st.street = one; hoodP.textContent = 'שכונה: ' + one.community_name + (one.community_id !== cid ? ' (המודעה תתפרסם שם)' : ''); }
      else if (rows.length > 1) hoodP.textContent = 'הרחוב נמצא בכמה שכונות — בחרו אותו מהרשימה (הקלידו שוב את שם הרחוב)';
    });

    var imgs = f.querySelector('[data-imgs]');
    function drawImgs() {
      imgs.innerHTML = st.files.map(function (x, i) { return '<span class="sp-th"><img src="' + x.url + '" alt=""><button type="button" data-rm="' + i + '" aria-label="הסרת תמונה">×</button></span>'; }).join('') +
        (st.files.length < MAXI ? '<label class="sp-add"><b>+</b>' + (st.files.length ? 'עוד' : 'הוספה') + '<input type="file" accept="image/*" multiple></label>' : '');
      var inp = imgs.querySelector('input[type=file]');
      if (inp) inp.addEventListener('change', function () {
        [].slice.call(inp.files || []).forEach(function (file) {
          if (st.files.length >= MAXI) { A.setErr('ניתן להוסיף עד 10 תמונות'); return; }
          if (/^image\//.test(file.type || 'image/')) st.files.push({ file: file, url: URL.createObjectURL(file) });
        });
        drawImgs();
      });
    }
    drawImgs();

    function confirmBox(text, label, then) {
      A.busy(btn, false);
      var box = f.querySelector('[data-dup]');
      box.innerHTML = '<div class="sp-dup"><p>' + text + '</p><button class="sa-b" type="button" data-go>' + label + '</button></div>';
      box.querySelector('[data-go]').addEventListener('click', function () { box.innerHTML = ''; then(); f.requestSubmit ? f.requestSubmit() : btn.click(); });
      box.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }

    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var t = E.ptype.value, lotBiz = t === 'lot' || t === 'business';
      var price = num(E.price.value), area = num(E.area.value), floor = num(E.floor.value), tf = num(E.tfloors.value);
      if (!(price > 0)) return A.setErr(price == null ? (sale ? 'נא למלא מחיר' : 'נא למלא שכר דירה') : 'יש להזין מספר חיובי');
      if (!(area > 0)) return A.setErr(area == null ? 'נא למלא שטח' : 'שטח: יש להזין מספר חיובי');
      if (!lotBiz && (floor == null || floor !== Math.round(floor))) return A.setErr(floor == null ? 'קומה: חובה' : 'קומה: יש להזין מספר שלם');
      var phone = E.phone.value.trim();
      if (phone && !PHONE_RE.test(phone.replace(/[\s\-()]/g, ''))) return A.setErr('מספר טלפון לא תקין');
      var street = E.street.value.trim(), house = E.house.value.trim();
      var addr = street ? (street + (house ? ' ' + house : '')) : '';
      var finalCid = st.street ? st.street.community_id : cid;
      var table = sale ? 'approve_property' : 'approved_rental_properties';
      A.busy(btn, true, 'בודקים…');

      A.sb.from('userdata').select('owner_phone').eq('user_id', A.user.id).maybeSingle().then(function (ur) {
        var mine = K.digits(ur.data && ur.data.owner_phone);
        if (phone && !st.phoneOk && mine && K.digits(phone) !== mine) {
          return confirmBox('מספר הטלפון שהזנת שונה מהמספר שלך. להמשיך?', 'כן, להמשיך', function () { st.phoneOk = true; });
        }
        // כפילות: אותה כתובת בשכונה (באפליקציה גם 50 מ׳ + חדרים — כאן אין נקודה)
        var dupQ = addr && !st.dupOk ? A.sb.from(table).select('full_address').eq('community_id', finalCid).limit(500) : Promise.resolve({ data: [] });
        return dupQ.then(function (r) {
          var hit = (r.data || []).some(function (x) { return x.full_address && norm(x.full_address) === norm(addr); });
          if (hit) return confirmBox('כבר מפורסם נכס בכתובת "' + esc(addr) + '". להמשיך בכל זאת?', 'המשך בכל זאת', function () { st.dupOk = true; });
          return save(t, lotBiz, price, area, floor, tf, addr, finalCid, table);
        });
      }).catch(function () { A.busy(btn, false); A.setErr('אין חיבור. נסו שוב'); });
    });

    function save(t, lotBiz, price, area, floor, tf, addr, finalCid, table) {
      A.busy(btn, true, 'מפרסמים…');
      var feat = function (k) { return !lotBiz && E[k].checked; };
      var c2n = E.cname2.value.trim(), c2p = E.phone2.value.trim();
      var contact = { name: E.cname.value.trim() || 'לא צוין', phone: E.phone.value.trim() };
      var row = {
        full_address: addr || null, area_in_sqm: area, num_rooms: lotBiz ? 0 : st.rooms, floor: lotBiz ? 0 : floor, total_floors: lotBiz ? null : tf,
        description: E.desc.value.trim() || null, property_type: t, property_condition: t === 'lot' ? null : E.cond.value,
        available_date: t === 'lot' ? null : (E.avail.value || null),
        has_elevator: feat('elev'), has_parking: feat('park'), parking_spots: feat('park') ? (num(E.pspots.value) || 1) : null,
        has_storage: feat('stor'), has_balcony: feat('balc') || feat('sukka'), balcony_area_in_sqm: (feat('balc') || feat('sukka')) ? num(E.barea.value) : null,
        has_sukkah_balcony: feat('sukka'), has_safe_room: feat('safe'),
        additional_contact: c2n && c2p ? { name: c2n, phone: c2p } : null,
        image_urls: [], listing_date: new Date().toISOString(), community_id: finalCid, user_id: A.user.id,
        latitude: null, longitude: null, is_broker: E.broker.checked
      };
      if (sale) {
        row.asking_price = price; row.seller_contact = contact;
        row.has_rental_units = !!E.units.checked; row.rental_units_count = E.units.checked ? num(E.ucount.value) : null;
      } else {
        row.monthly_rent = price; row.renter_contact = contact; row.includes_furniture = !!E.furn.checked;
        row.municipal_tax = num(E.tax.value) || 0; row.maintenance_fees = num(E.fees.value) || 0;
      }
      var failedImgs = 0;
      return A.sb.from(table).insert(row).select('id').single().then(function (r) {
        if (r.error) throw r.error;
        var id = r.data.id;
        if (!st.files.length) return;
        A.busy(btn, true, 'מעלים תמונות…');
        var dir = 'properties/' + (sale ? 'sale' : 'rental') + '/' + id + '/', v = Date.now();
        return Promise.all(st.files.map(function (x, i) {
          return K.shrink(x.file).then(function (b) { return K.upload(A.sb, dir + i + '.jpg', b); }).then(function (u) { return u + '?v=' + v; }, function () { failedImgs++; return null; });
        })).then(function (urls) {
          urls = urls.filter(Boolean);
          if (urls.length) return A.sb.from(table).update({ image_urls: urls }).eq('id', id);
        });
      }).then(function () {
        st.files.forEach(function (x) { URL.revokeObjectURL(x.url); });
        var moved = finalCid !== cid && st.street ? ' המודעה פורסמה ב' + esc(st.street.community_name) + '.' : '';
        K.doneView(A, sale ? 'sale' : 'rent', { extra: moved + (failedImgs ? ' ' + failedImgs + ' תמונות לא הועלו — אפשר להוסיף אותן בעריכה באפליקציה.' : '') });
      }, function (e) {
        A.busy(btn, false);
        var m = (e && (e.message || e.hint)) || '';
        if (/phone_not_verified|נדרש אימות טלפון/.test(m)) return A.reverify();
        A.setErr('לא הצלחנו לפרסם. נסו שוב');
      });
    }
  }

  /* פרסום מהיר למתווכים — מדביקים מודעה (ופוסטר), ה-AI ממלא, ואז הטופס המלא לבדיקה ופרסום */
  function broker(cid, A) {
    K.css();
    var st = { files: [], poster: -1 };
    var d = A.open('<h2 id="sa-h">פרסום מהיר למתווכים</h2>' +
      '<p>מדביקים את המודעה כמו שהיא מוואטסאפ, ומוסיפים תמונות. אפשר לסמן תמונה אחת כ"פוסטר עם פרטים". הפרטים יתמלאו אוטומטית, ותוכלו לבדוק לפני הפרסום.</p>' +
      '<form class="sp-f" novalidate><textarea name="txt" rows="8" maxlength="6000" placeholder="הדביקו כאן את טקסט המודעה…" style="min-height:160px"></textarea>' +
      '<div class="sp-sec"><span>תמונות <small style="font-weight:600;color:#8A94A6">(עד 10 · לחיצה על תמונה מסמנת אותה כפוסטר)</small></span><div class="sp-imgs" data-imgs></div></div>' +
      '<p class="sa-msg" hidden></p><button class="sa-b pri" type="submit">קריאה אוטומטית</button>' +
      '<button class="sa-b" type="button" data-manual>למילוי ידני</button></form>', true);
    var f = d.querySelector('form'), btn = f.querySelector('[type=submit]'), imgs = f.querySelector('[data-imgs]');
    function drawImgs() {
      imgs.innerHTML = st.files.map(function (x, i) {
        return '<span class="sp-th" data-pi="' + i + '" style="cursor:pointer' + (st.poster === i ? ';outline:3px solid #2A6FB8' : '') + '"><img src="' + x.url + '" alt="">' + (st.poster === i ? '<i style="position:absolute;bottom:2px;right:2px;background:#2A6FB8;color:#fff;font-style:normal;font-size:11px;font-weight:800;padding:1px 6px;border-radius:6px">פוסטר</i>' : '') + '<button type="button" data-rm="' + i + '" aria-label="הסרת תמונה">×</button></span>';
      }).join('') + (st.files.length < MAXI ? '<label class="sp-add"><b>+</b>' + (st.files.length ? 'עוד' : 'הוספה') + '<input type="file" accept="image/*" multiple></label>' : '');
      var inp = imgs.querySelector('input[type=file]');
      if (inp) inp.addEventListener('change', function () {
        [].slice.call(inp.files || []).forEach(function (file) { if (st.files.length < MAXI && /^image\//.test(file.type || 'image/')) st.files.push({ file: file, url: URL.createObjectURL(file) }); });
        drawImgs();
      });
    }
    drawImgs();
    f.addEventListener('input', function () { A.setErr(''); });
    f.addEventListener('click', function (e) {
      var rm = e.target.closest('[data-rm]');
      if (rm) { var i = +rm.getAttribute('data-rm'); st.files.splice(i, 1); if (st.poster === i) st.poster = -1; else if (st.poster > i) st.poster--; drawImgs(); return; }
      var pi = e.target.closest('[data-pi]'); if (pi) { var j = +pi.getAttribute('data-pi'); st.poster = st.poster === j ? -1 : j; drawImgs(); return; }
      if (e.target.closest('[data-manual]')) propForm(cid, A, { sale: true, broker: true, files: st.files, draft: { description: f.elements.txt.value.trim() || null } });
    });
    var MSG = {
      unauthorized: 'החיבור פג. התחברו מחדש ונסו שוב.', not_broker: 'האפשרות זמינה רק למתווכים רשומים. אפשר למלא ידנית.',
      daily_limit: 'הגעתם למכסה היומית של קריאה אוטומטית. אפשר למלא ידנית או לנסות מחר.', empty: 'הדביקו את טקסט המודעה או סמנו פוסטר.',
      poster_too_large: 'הפוסטר גדול מדי. נסו תמונה קטנה יותר.'
    };
    function toB64(blob) { return new Promise(function (res) { var r = new FileReader(); r.onload = function () { res(String(r.result).split(',')[1] || ''); }; r.readAsDataURL(blob); }); }
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var text = f.elements.txt.value.trim();
      if (!text && st.poster < 0) return A.setErr(MSG.empty);
      A.busy(btn, true, 'קוראים את המודעה…');
      (st.poster >= 0 ? K.shrink(st.files[st.poster].file).then(toB64) : Promise.resolve('')).then(function (b64) {
        var body = { text: text }; if (b64) body.poster_base64 = b64;
        return A.sb.functions.invoke('parse-property-listing', { body: body });
      }).then(function (r) {
        if (r.error) {
          var code = '';
          return (r.error.context && r.error.context.json ? r.error.context.json().then(function (j) { code = j && j.error; }, function () {}) : Promise.resolve()).then(function () {
            A.busy(btn, false); A.setErr(MSG[code] || 'לא הצלחנו לקרוא אוטומטית — אפשר למלא ידנית.');
          });
        }
        var fl = (r.data && r.data.fields) || {};
        if (!fl.description) fl.description = text || null;
        var miss = [];
        if (!fl.asking_price) miss.push('מחיר'); if (!fl.num_rooms) miss.push('מספר חדרים'); if (!fl.area_in_sqm) miss.push('שטח במ"ר');
        if (fl.floor == null) miss.push('קומה'); if (!fl.street) miss.push('רחוב');
        if (fl.property_type && ['apartment', 'gardenApartment', 'penthouse', 'duplex'].indexOf(fl.property_type) < 0) fl.property_type = 'apartment';
        propForm(cid, A, { sale: true, broker: true, files: st.files, draft: fl });
        if (miss.length) A.setErr('לא נמצא בטקסט: ' + miss.join(', ') + '. השלימו בטופס.');
      }).catch(function () { A.busy(btn, false); A.setErr('לא הצלחנו לקרוא אוטומטית — אפשר למלא ידנית.'); });
    });
  }

  window.ShchunaForms = window.ShchunaForms || {};
  window.ShchunaForms.sale = function (cid, A) { propForm(cid, A, { sale: true }); };
  window.ShchunaForms.rent = function (cid, A) { propForm(cid, A, { sale: false }); };
  window.ShchunaForms.broker = broker;
})();
