/* עריכה והוספה של זמני תפילה מעמוד בית הכנסת — אותם כללים כמו AddPrayer.dart באפליקציה (5.11.2026).
 * בלי מחיקה (החלטת משה: באתר רק עריכה). התחברות + טלפון מאומת (gate ב-auth.js) + שם תצוגה.
 * extra: { syn: <synagogue id>, name: <שם>, nusach: <prayer_nusach>, prayer: <id לעריכה | null> } */
(function () {
  var K = window.ShchunaKit;
  var TYPES = ['שחרית', 'מנחה', 'ערבית'];
  var NO_KORB = { ashkenaz: 1, sfarad: 1, chabad: 1, teiman_baladi: 1, teiman_shami: 1 };
  var DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
  var SEASONS = [['חורף', '❄️'], ['שנתי', '🌸'], ['קיץ', '☀️'], ['חופש', '🏖️']];
  var CLOCK = { 'בשעה': 1, 'בפלג': 1, 'צמוד': 1 };
  var MINUTES = { 'הנץ החמה': 'כמה דקות לפני הנץ החמה המניין מתחיל?', 'לפני הנץ': 'כמה דקות לפני הנץ החמה?', 'לפני שקיעה': 'כמה דקות לפני שקיעה?', 'אחרי שקיעה': 'כמה דקות אחרי שקיעה?', 'לפני צאת שבת': 'כמה דקות לפני צאת שבת?' };
  var DEF_MIN = { 'הנץ החמה': 35, 'לפני הנץ': 35, 'לפני שקיעה': 20, 'אחרי שקיעה': 15 };
  var HOURS = { 'שחרית': [4, 12, '07:00'], 'מנחה': [11, 20, '13:30'], 'ערבית': [16, 23, '20:00'], 'סליחות': [0, 23, '00:00'] };
  var LABEL = { 'צמוד': 'צמוד למנחה' };

  function ctxOf(days) { return days.length === 1 && days[0] === 'ו' ? 'erev' : days.length === 1 && days[0] === 'ש' ? 'shabbat' : 'week'; }
  function setsFor(type, days) {
    var c = ctxOf(days);
    if (type === 'שחרית') return ['בשעה', 'הנץ החמה'];
    if (type === 'מנחה') return c === 'erev' ? ['בשעה', 'לפני שקיעה', 'בפלג', 'הדלקת נרות'] : ['בשעה', 'לפני שקיעה', 'בפלג'];
    if (type === 'ערבית') return c === 'erev' ? ['בשעה', 'אחרי שקיעה', 'צמוד'] : c === 'shabbat' ? ['בשעה', 'אחרי שקיעה', 'צמוד', 'צאת שבת', 'לפני צאת שבת'] : ['בשעה', 'אחרי שקיעה', 'צמוד', 'צאת הכוכבים'];
    return ['לפני הנץ', 'בשעה', 'בחצות'];
  }
  /* סליחות: מכ"ב באב, כל אלול, ועד ט' בתשרי (canAddSelichot) */
  function canSelichot() {
    try {
      var p = new Intl.DateTimeFormat('en-u-ca-hebrew', { month: 'long', day: 'numeric' }).formatToParts(new Date());
      var m = (p.find(function (x) { return x.type === 'month'; }) || {}).value || '', d = +((p.find(function (x) { return x.type === 'day'; }) || {}).value || 0);
      return (m === 'Av' && d >= 22) || m === 'Elul' || (/^Tishri/.test(m) && d <= 9);
    } catch (e) { return false; }
  }
  function overlap(a, b) { return a === b || a === 'שנתי' || b === 'שנתי'; }
  function daysOf(s) { return String(s || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean); }

  function start(cid, A, x) {
    K.css();
    if (!x || !x.syn) return;
    var sb = A.sb, esc = A.esc;
    var d = A.open('<h2 id="sa-h">זמני תפילה — ' + esc(x.name || '') + '</h2><p class="sa-small">טוענים…</p>', true);
    Promise.all([
      sb.from('prayers').select('id,type,time,set,season,is_open,selected_days,notes').eq('synagogue_id', x.syn),
      sb.from('userdata').select('display_name').eq('user_id', A.user.id).maybeSingle()
    ]).then(function (r) {
      if (r[0].error) throw r[0].error;
      var prayers = r[0].data || [], dn = r[1].data && r[1].data.display_name;
      var go = function () {
        if (x.prayer) {
          var p = prayers.filter(function (q) { return q.id === x.prayer; })[0];
          return p ? form(A, x, prayers, p) : list(A, x, prayers);
        }
        return x.add ? form(A, x, prayers, null) : list(A, x, prayers);
      };
      if (dn && String(dn).trim()) go(); else nameView(A, go);
    }).catch(function () { A.open('<h2 id="sa-h">זמני תפילה</h2><p>אין חיבור. נסו שוב.</p><button class="sa-b" type="button" data-c>סגירה</button>').querySelector('[data-c]').addEventListener('click', A.close); });
  }

  /* שם תצוגה — מופיע ב"עודכן על ידי". חד-פעמי (DisplayNameHelper באפליקציה) */
  function nameView(A, then) {
    var d = A.open('<h2 id="sa-h">איך להציג את שמך?</h2>' +
      '<p>השם יופיע ליד הזמנים: "עודכן על ידי…". פעם אחת בלבד.</p>' +
      '<form class="sp-f" novalidate><label class="l">שם לתצוגה<input type="text" name="dn" maxlength="40" autocomplete="name"></label>' +
      '<p class="sa-msg" hidden></p><button class="sa-b pri" type="submit">שמירה</button>' +
      '<button class="sa-b" type="button" data-anon>להציג "אנונימי"</button></form>', true);
    var f = d.querySelector('form'), btn = f.querySelector('[type=submit]');
    var meta = A.user.user_metadata || {};
    f.elements.dn.value = meta.full_name || meta.name || '';
    function save(v) {
      A.busy(btn, true, 'שומרים…');
      A.sb.from('userdata').update({ display_name: v }).eq('user_id', A.user.id).then(function (r) {
        if (r.error) { A.busy(btn, false); return A.setErr('לא הצלחנו לשמור. נסו שוב'); }
        then();
      }, function () { A.busy(btn, false); A.setErr('אין חיבור. נסו שוב'); });
    }
    f.addEventListener('submit', function (e) { e.preventDefault(); var v = f.elements.dn.value.trim(); if (v.length < 2) return A.setErr('נא למלא שם'); save(v); });
    f.querySelector('[data-anon]').addEventListener('click', function () { save('אנונימי'); });
  }

  function describe(p) {
    var t = p.set === 'בשעה' || p.set === 'בפלג' || p.set === 'צמוד' ? (p.set === 'בשעה' ? p.time : (LABEL[p.set] || p.set) + (p.time ? ' ' + p.time : ''))
      : MINUTES[p.set] ? p.time + ' דק׳ ' + p.set : (LABEL[p.set] || p.set);
    var dd = daysOf(p.selected_days);
    var days = dd.length === 7 ? 'כל יום' : dd.join(',') === 'א,ב,ג,ד,ה,ו' ? "א'–ו'" : dd.map(function (x) { return x + "'"; }).join(' ');
    return t + ' · ' + days + (p.season && p.season !== 'שנתי' ? ' · ' + p.season : '');
  }

  function list(A, x, prayers) {
    var esc = A.esc;
    var order = ['שחרית', 'מנחה', 'ערבית', 'סליחות'];
    prayers = prayers.slice().sort(function (a, b) { return order.indexOf(a.type) - order.indexOf(b.type) || String(a.time).localeCompare(String(b.time)); });
    var d = A.open('<h2 id="sa-h">זמני תפילה — ' + esc(x.name || '') + '</h2>' +
      '<style>.pl-i{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #F1F3F6}.pl-i span{flex:1;min-width:0}.pl-i b{display:block;color:#172F57}.pl-i small{color:#6B7689;font-weight:600}.pl-i button{border:1px solid #DCE2EC;background:#fff;border-radius:999px;padding:6px 14px;font:inherit;font-weight:800;color:#2A6FB8;cursor:pointer}</style>' +
      (prayers.length ? prayers.map(function (p) {
        return '<div class="pl-i"><span><b>' + esc(p.type) + '</b><small>' + esc(describe(p)) + (p.notes ? ' · ' + esc(p.notes) : '') + '</small></span><button type="button" data-ed="' + esc(p.id) + '">עריכה</button></div>';
      }).join('') : '<p>עדיין אין זמנים לבית כנסת זה.</p>') +
      '<button class="sa-b pri" type="button" data-add style="margin-top:14px">+ הוספת מניין</button>' +
      '<p class="sa-small">שינוי מופיע באפליקציה מיד, ובאתר תוך כשעה.</p>', true);
    d.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-add')) form(A, x, prayers, null);
      else if (b.hasAttribute('data-ed')) form(A, x, prayers, prayers.filter(function (p) { return p.id === b.getAttribute('data-ed'); })[0]);
    });
  }

  function form(A, x, prayers, ex) {
    var esc = A.esc, sb = A.sb;
    var types = TYPES.slice(); if (canSelichot() || (ex && ex.type === 'סליחות')) types.push('סליחות');
    var st = {
      type: ex ? ex.type : 'שחרית', days: ex ? daysOf(ex.selected_days) : ['א', 'ב', 'ג', 'ד', 'ה', 'ו'],
      set: ex ? ex.set : 'בשעה', season: ex ? (ex.season || 'שנתי') : 'שנתי', open: ex ? !!ex.is_open : false
    };
    var clock0 = ex && CLOCK[ex.set] && /^\d{1,2}:\d{2}$/.test(ex.time || '') ? ex.time : null;
    var min0 = ex && /^\d+$/.test(String(ex.time || '')) ? +ex.time : null;
    if (types.indexOf(st.type) < 0) types.push(st.type);

    var d = A.open('<h2 id="sa-h">' + (ex ? 'עדכון תפילה' : 'הוספת מניין') + ' — ' + esc(x.name || '') + '</h2>' +
      '<form class="sp-f" novalidate>' +
      '<div class="sp-sec"><span>סוג תפילה</span><div class="sp-chips" data-types>' + types.map(function (t) { return '<button type="button" data-type="' + t + '" aria-pressed="false">' + (t === 'סליחות' ? '🌙 ' : '') + t + '</button>'; }).join('') + '</div></div>' +
      '<div class="sp-sec"><span>ימי תפילה</span><div class="sp-days">' + DAYS.map(function (x) { return '<button type="button" data-day="' + x + '" aria-pressed="false">' + x + "'" + '</button>'; }).join('') + '</div></div>' +
      '<div class="sp-sec"><span>זמן תפילה</span><div class="sp-chips" data-sets></div></div>' +
      '<div data-time></div>' +
      '<label class="sp-chk" data-korb hidden><input type="checkbox" name="korb"><span></span></label>' +
      '<label class="l">הערות <small>לא חובה</small><textarea name="notes" maxlength="300" rows="3" placeholder="לדוגמה: בימי ב׳ וה׳ בשעה 6:00"></textarea></label>' +
      '<div class="sp-sec"><span>עונה</span><div class="sp-chips">' + SEASONS.map(function (s) { return '<button type="button" data-season="' + s[0] + '" aria-pressed="false">' + s[1] + ' ' + s[0] + '</button>'; }).join('') + '</div></div>' +
      '<p class="sa-msg" hidden></p>' +
      '<button class="sa-b pri" type="submit">שמור תפילה</button>' +
      (prayers.length ? '<button class="sa-b" type="button" data-back>חזרה לרשימה</button>' : '') +
      '</form>', true);
    var f = d.querySelector('form'), btn = f.querySelector('[type=submit]');
    if (ex && ex.notes) f.elements.notes.value = ex.notes;
    f.elements.korb.checked = st.open;

    function press(attr, val) { [].forEach.call(f.querySelectorAll('[' + attr + ']'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute(attr) === val)); }); }
    function drawDays() { [].forEach.call(f.querySelectorAll('[data-day]'), function (b) { b.setAttribute('aria-pressed', String(st.days.indexOf(b.getAttribute('data-day')) >= 0)); }); }
    function drawSets() {
      var sets = setsFor(st.type, st.days);
      if (sets.indexOf(st.set) < 0) st.set = sets[0];
      f.querySelector('[data-sets]').innerHTML = sets.map(function (s) { return '<button type="button" data-set="' + s + '" aria-pressed="' + (s === st.set) + '">' + (LABEL[s] || s) + '</button>'; }).join('');
      drawTime();
    }
    function drawTime() {
      var box = f.querySelector('[data-time]'), s = st.set;
      if (CLOCK[s]) {
        var h = HOURS[st.type] || [0, 23, '07:00'], cur = (box.dataset.clock || clock0 || h[2]).split(':');
        var hh = '', mm = '';
        for (var i = h[0]; i <= h[1]; i++) hh += '<option value="' + i + '"' + (+cur[0] === i ? ' selected' : '') + '>' + (i < 10 ? '0' : '') + i + '</option>';
        var curM = Math.round(+cur[1] / 5) * 5 % 60;
        for (var m = 0; m < 60; m += 5) mm += '<option value="' + m + '"' + (curM === m ? ' selected' : '') + '>' + (m < 10 ? '0' : '') + m + '</option>';
        box.innerHTML = '<div class="sp-sec"><span>שעה</span><div class="sp-row" dir="ltr"><select name="hh" aria-label="שעה">' + hh + '</select><select name="mm" aria-label="דקות">' + mm + '</select></div></div>';
      } else if (MINUTES[s]) {
        var v = box.dataset.min || (min0 != null ? min0 : DEF_MIN[s] || 35);
        box.innerHTML = '<label class="l">' + MINUTES[s] + '<input type="number" name="min" min="1" max="120" step="1" inputmode="numeric" dir="ltr" value="' + v + '"></label>';
      } else {
        box.innerHTML = s === 'בחצות' ? '<p class="sp-hint">הסליחות יתקיימו בחצות הלילה</p>' : '';
      }
      // קרבנות/פתיחה: שחרית ומנחה, רק כשהנוסח לא ברשימה הידועה
      var k = f.querySelector('[data-korb]');
      var show = (st.type === 'שחרית' || st.type === 'מנחה') && !NO_KORB[x.nusach];
      k.hidden = !show; k.querySelector('span').textContent = st.type === 'שחרית' ? 'התפילה מתחילה מקרבנות' : 'התפילה מתחילה מהפתיחה';
    }
    f.addEventListener('change', function (e) {
      var box = f.querySelector('[data-time]');
      if (e.target.name === 'hh' || e.target.name === 'mm') box.dataset.clock = f.elements.hh.value + ':' + f.elements.mm.value;
      if (e.target.name === 'min') box.dataset.min = f.elements.min.value;
    });
    f.addEventListener('input', function () { A.setErr(''); });
    f.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b || b.type === 'submit') return; A.setErr('');
      if (b.hasAttribute('data-type')) { st.type = b.getAttribute('data-type'); press('data-type', st.type); st.set = setsFor(st.type, st.days)[0]; f.querySelector('[data-time]').dataset.clock = ''; clock0 = null; drawSets(); }
      else if (b.hasAttribute('data-day')) {
        var v = b.getAttribute('data-day'), i = st.days.indexOf(v);
        if (i >= 0) st.days.splice(i, 1); else st.days.push(v);
        st.days.sort(function (a, c) { return DAYS.indexOf(a) - DAYS.indexOf(c); });
        drawDays(); drawSets();
      }
      else if (b.hasAttribute('data-set')) { st.set = b.getAttribute('data-set'); press('data-set', st.set); drawTime(); }
      else if (b.hasAttribute('data-season')) { st.season = b.getAttribute('data-season'); press('data-season', st.season); }
      else if (b.hasAttribute('data-back')) list(A, x, prayers);
    });
    press('data-type', st.type); press('data-season', st.season); drawDays(); drawSets();

    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!st.days.length) return A.setErr('נא לבחור לפחות יום אחד');
      var time = '';
      if (CLOCK[st.set]) {
        var h = +f.elements.hh.value, m = +f.elements.mm.value;
        time = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
      } else if (MINUTES[st.set]) {
        var mv = f.elements.min.value.trim();
        if (!mv) return A.setErr('נא להזין מספר דקות');
        if (!/^\d+$/.test(mv) || +mv < 1 || +mv > 120) return A.setErr('המספר חייב להיות בין 1 ל-120');
        time = String(+mv);
      }
      // כפילות — אותו סוג וזמן (ובבשעה אותה שעה), עונה חופפת, יום משותף
      var dup = prayers.some(function (p) {
        if (ex && p.id === ex.id) return false;
        if (p.type !== st.type || p.set !== st.set) return false;
        if (st.set === 'בשעה' && p.time !== time) return false;
        if (!overlap(p.season || 'שנתי', st.season)) return false;
        var pd = daysOf(p.selected_days);
        return st.days.some(function (x) { return pd.indexOf(x) >= 0; });
      });
      if (dup) return A.setErr('קיים כבר מניין ' + st.type + ' באותו זמן ועונה');
      var korbBox = f.querySelector('[data-korb]');
      var data = {
        type: st.type, time: time, set: st.set, season: st.season, is_open: !korbBox.hidden && f.elements.korb.checked,
        selected_days: st.days.join(','), synagogue_id: x.syn, user_id: A.user.id,
        last_updated: new Date().toISOString(), notes: f.elements.notes.value.trim() || null
      };
      A.busy(btn, true, 'שומרים…');
      var q = ex ? sb.from('prayers').update(data).eq('id', ex.id).select('id') : sb.from('prayers').insert(data).select('id');
      q.then(function (r) {
        if (r.error || !r.data || !r.data.length) { A.busy(btn, false); return A.setErr('לא ניתן לשמור את התפילה. נסו שוב'); }
        K.doneView(A, 'prayer', { title: ex ? 'התפילה עודכנה' : 'המניין נוסף', text: 'הזמנים כבר מעודכנים באפליקציה, ויתעדכנו כאן באתר תוך כשעה. תודה!', noApp: true });
      }, function () { A.busy(btn, false); A.setErr('אין חיבור. נסו שוב'); });
    });
  }

  window.ShchunaForms = window.ShchunaForms || {};
  window.ShchunaForms.prayer = start;
})();
