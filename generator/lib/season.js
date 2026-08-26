import { HDate, months } from '@hebcal/core';

/**
 * שכפול של _isPrayerInSeason ו-SeasonalPrayerHelper.
 *
 * בלי זה העמוד הסטטי יציג סליחות בדצמבר ומנייני חורף באוגוסט —
 * מידע שגוי שגוגל יאנדקס ושמתפלל יסתמך עליו.
 */

/** שעון קיץ בישראל: יום שישי האחרון לפני 2 באפריל → יום ראשון האחרון באוקטובר. */
export function isIsraeliDST(d = new Date()) {
  const y = d.getFullYear();

  const apr2 = new Date(y, 3, 2);
  const start = new Date(apr2);
  start.setDate(apr2.getDate() - ((apr2.getDay() + 2) % 7 || 7));  // שישי אחרון לפני 2.4

  const oct31 = new Date(y, 9, 31);
  const end = new Date(oct31);
  end.setDate(oct31.getDate() - oct31.getDay());                    // ראשון אחרון באוקטובר

  return d >= start && d < end;
}

/** חופש הגדול — 1 ביולי עד 31 באוגוסט. */
export function isSummerVacation(d = new Date()) {
  const m = d.getMonth();
  return m === 6 || m === 7;
}

/**
 * עונת הסליחות: שבוע לפני ר"ח אלול ועד יום הכיפורים ועד בכלל.
 * תואם ל-canAddSelichot() שפותח שבוע מראש.
 */
export function isSelichotSeason(d = new Date()) {
  const hy = new HDate(d).getFullYear();

  // אחרי ר"ה השנה העברית כבר התקדמה, ואלול הרלוונטי שייך לשנה הקודמת.
  // לכן בודקים את שני החלונות.
  const inWindow = (year) => {
    const from = new HDate(1, months.ELUL, year).greg();
    from.setDate(from.getDate() - 7);
    const to = new HDate(10, months.TISHREI, year + 1).greg();
    to.setDate(to.getDate() + 1);
    return d >= from && d < to;
  };

  return inWindow(hy) || inWindow(hy - 1);
}

/** מקביל ל-_isPrayerInSeason. */
export function isPrayerInSeason(prayer, d = new Date()) {
  if (prayer.type === 'סליחות') return isSelichotSeason(d);

  switch (prayer.season) {
    case 'חופש': return isSummerVacation(d);
    case 'קיץ':  return isIsraeliDST(d);
    case 'חורף': return !isIsraeliDST(d);
    default:     return true;   // 'שנתי' או null
  }
}
