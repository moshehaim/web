import SunCalc from 'suncalc';

/**
 * שכפול של prayer_sort_service.dart ו-prayer_utils.dart.
 *
 * חובה שהעמודים באתר יסכימו עם האפליקציה. כל שינוי במיפוי בדארט
 * חייב להשתקף כאן, אחרת המשתמש יראה שני סדרים שונים לאותם נתונים.
 *
 * שני הבדלים מכוונים מול הדארט:
 *  1. הזמנים מחושבים לתאריך ייחוס אחד (אמצע השנה) ולא ליום הנוכחי —
 *     העמוד סטטי ונבנה פעם ביום. הסדר היחסי כמעט לא משתנה לאורך השנה.
 *  2. אין פתרון 'צמוד' חוצה-בתי-כנסת, כי כל עמוד הוא בית כנסת אחד.
 */

const FALLBACK = new Date('2099-12-31T00:00:00Z').getTime();

/** זמני היום לקהילה. SunCalc מחזיר UTC; אנחנו עובדים בדקות-מחצות מקומיות. */
export function computeZmanim(lat, lng, date = new Date(new Date().getFullYear(), 3, 15)) {
  const t = SunCalc.getTimes(date, lat, lng);

  const mins = (d) => {
    if (!d || isNaN(d)) return null;
    const s = d.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem', hour12: false,
      hour: '2-digit', minute: '2-digit' });
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  };

  const sunrise = mins(t.sunrise);
  const sunset  = mins(t.sunset);

  return {
    sunrise,
    sunset,
    // פלג המנחה: 10.75 שעות זמניות מהזריחה
    plag_hamincha: sunrise != null && sunset != null
      ? Math.round(sunrise + ((sunset - sunrise) / 12) * 10.75) : null,
    chatzot: sunrise != null && sunset != null
      ? Math.round((sunrise + sunset) / 2) : null,
    midnight: sunrise != null && sunset != null
      ? Math.round((sunrise + sunset) / 2) + 720 : null,
    tzait: sunset != null ? sunset + 20 : null,      // קירוב לתצוגה סטטית
    tzait_72: sunset != null ? sunset + 72 : null,
    candle_lighting: sunset != null ? sunset - 40 : null,  // ירושלים
    shabbat_end: sunset != null ? sunset + 20 : null,
  };
}

const parseMinutes = (s) => {
  if (!s) return 0;
  const m = String(s).match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
};

const parseClock = (s) => {
  if (!s) return null;
  const m = String(s).match(/^(\d{1,2}):(\d{2})/);
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
};

/** מקביל ל-_calculateSortKey. מחזיר דקות מחצות. */
export function sortKey(prayer, z) {
  const set = prayer.set;
  const time = prayer.time;
  if (!set) return FALLBACK;

  const rel = (base, sign) =>
    base == null ? FALLBACK : base + sign * parseMinutes(time);

  switch (set) {
    case 'בשעה':          return parseClock(time) ?? FALLBACK;
    // הנץ החמה: התפילה מסתיימת בזריחה, הדקות הן אורך הפתיחה.
    // ממוין לפי שעת ההתחלה בפועל — זריחה פחות הדקות.
    case 'הנץ החמה':      return rel(z.sunrise, -1);
    case 'לפני נץ':
    case 'לפני הנץ':      return rel(z.sunrise, -1);
    case 'בפלג':          return z.plag_hamincha ?? FALLBACK;
    case 'לפני שקיעה':    return rel(z.sunset, -1);
    case 'אחרי שקיעה':    return rel(z.sunset, +1);
    case 'בחצות':         return rel(z.midnight, +1);
    case 'צאת הכוכבים':   return z.tzait ?? FALLBACK;
    case 'זמן רבינו תם':  return z.tzait_72 ?? FALLBACK;
    case 'הדלקת נרות':    return z.candle_lighting ?? FALLBACK;
    case 'לפני צאת שבת':  return rel(z.shabbat_end, -1);
    // צמוד: אחרי המנחה האחרונה של אותו בית כנסת. נפתר ב-sortPrayers.
    case 'צמוד':          return FALLBACK;
    default:              return FALLBACK;
  }
}

const TYPE_ORDER = (t = '') =>
  t.includes('שחרית') ? 1 :
  t.includes('מנחה')  ? 2 :
  t.includes('ערבית') ? 3 :
  t.includes('סליחות') ? 4 : 99;

/** מקביל ל-sortPrayers: type → sortKey → סדר מקורי. */
export function sortPrayers(prayers, z) {
  const keyed = prayers.map((p, i) => ({ p, i, k: sortKey(p, z) }));

  // פתרון 'צמוד' — אחרי המנחה המאוחרת ביותר באותו בית כנסת
  const lastMincha = keyed
    .filter((x) => x.p.type?.includes('מנחה') && x.k !== FALLBACK)
    .reduce((max, x) => (max == null || x.k > max ? x.k : max), null);

  for (const x of keyed) {
    if (x.p.set === 'צמוד') {
      x.k = lastMincha != null ? lastMincha + 1 : (z.sunset ?? FALLBACK);
    }
  }

  keyed.sort((a, b) =>
    TYPE_ORDER(a.p.type) - TYPE_ORDER(b.p.type) ||
    a.k - b.k ||
    a.i - b.i
  );

  return keyed.map((x) => x.p);
}

/** מקביל ל-formatPrayerTime. התצוגה מילולית, בדיוק כמו באפליקציה. */
export function formatPrayerTime(set, time) {
  if (!set) return '';
  const has = time != null && String(time).length > 0;

  switch (set) {
    case 'בשעה':          return has ? String(time) : '';
    case 'לפני שקיעה':    return has ? `${time} דקות לפני השקיעה` : 'לפני השקיעה';
    case 'אחרי שקיעה':    return has ? `${time} דקות אחרי השקיעה` : 'אחרי השקיעה';
    case 'הנץ החמה':      return has ? `${time} דקות לפני הנץ` : 'הנץ החמה';
    case 'לפני נץ':
    case 'לפני הנץ':      return has ? `${time} דקות לפני הנץ` : 'לפני הנץ';
    case 'בפלג':          return 'בפלג המנחה';
    case 'צמוד':          return 'צמוד למנחה';
    case 'צאת הכוכבים':   return 'צאת הכוכבים';
    case 'זמן רבינו תם':  return 'זמן רבינו תם';
    case 'הדלקת נרות':    return 'הדלקת נרות';
    case 'לפני צאת שבת':  return has ? `${time} דקות לפני צאת שבת` : 'לפני צאת שבת';
    case 'בחצות':         return 'חצות הלילה';
    default:              return set;
  }
}

/** מקביל ל-formatSelectedDays. */
export function formatSelectedDays(selectedDays) {
  if (!selectedDays) return '';
  const days = new Set(String(selectedDays).split(',').map((d) => d.trim()).filter(Boolean));
  const eq = (arr) => days.size === arr.length && arr.every((d) => days.has(d));

  if (eq(['א', 'ב', 'ג', 'ד', 'ה', 'ו']))           return 'ימי חול';
  if (eq(['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']))      return 'כל השבוע';
  if (eq(['א', 'ב', 'ג', 'ד', 'ה']))                return 'א׳-ה׳';
  if (eq(['ו', 'ש']))                                return 'שישי ושבת';
  if (eq(['ש']))                                     return 'שבת';
  if (eq(['ו']))                                     return 'שישי';

  const order = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
  return [...days].sort((a, b) => order.indexOf(a) - order.indexOf(b))
    .map((d) => `${d}׳`).join(', ');
}

export const NUSACH = {
  ashkenaz: 'אשכנז',
  sfarad: 'ספרד',
  edot_mizrach: 'עדות המזרח',
  chabad: 'חב״ד',
  teiman: 'תימן',
  other: 'אחר',
};
