import fs from 'node:fs';
import path from 'node:path';

/**
 * Slugים בעברית, יציבים לנצח.
 *
 * ברגע ש-slug הוקצה לישות הוא נשמר ב-slugs.json ולא משתנה — גם אם שם
 * בית הכנסת משתנה במסד. זה מונע שבירת קישורים שגוגל כבר אינדקס.
 */

const STRIP = /["'׳״`.,()[\]{}<>|\\/?!:;*+=~^$@#%&]/g;

export function slugify(name) {
  return String(name || '')
    .replace(/\u200f|\u200e/g, '')   // סימני כיווניות
    .replace(STRIP, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
/**
 * האם הטקסט נראה כמו כתובת מייל (או slug שנבנה ממנה, כמו "namegmailcom").
 * שם כזה לא מתפרסם באתר: לא בכותרת, לא בכתובת העמוד ולא בחיפוש.
 */
const MAIL_HOSTS = /(gmail|googlemail|hotmail|outlook|icloud|yahoo|walla|live\.?com|012\.?net|bezeqint|netvision)/i;
export function looksLikeEmail(name) {
  const s = String(name || '');
  return s.includes('@') || MAIL_HOSTS.test(s);
}

export class SlugStore {
  constructor(file) {
    this.file = file;
    this.map = {};
    this.dirty = false;
    if (fs.existsSync(file)) {
      this.map = JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  }

  /** מחזיר slug קיים, או מקצה חדש עם שובר-שוויון על התנגשות. */
  get(id, name) {
    // החריג היחיד ל"slug יציב לנצח": slug שמור שנראה כמו מייל מוחלף, כדי שהמייל לא יישאר בכתובת העמוד
    if (this.map[id] && looksLikeEmail(this.map[id])) delete this.map[id];
    if (this.map[id]) return this.map[id];

    const base = (looksLikeEmail(name) ? '' : slugify(name)) || `ללא-שם-${String(id).slice(0, 6)}`;
    const taken = new Set(Object.values(this.map));

    let slug = base;
    let n = 2;
    while (taken.has(slug)) slug = `${base}-${n++}`;

    this.map[id] = slug;
    this.dirty = true;
    return slug;
  }

  save() {
    if (!this.dirty) return false;
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(this.file, JSON.stringify(this.map, null, 2) + '\n', 'utf8');
    return true;
  }
}
