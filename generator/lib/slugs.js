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
    if (this.map[id]) return this.map[id];

    const base = slugify(name) || 'ללא-שם';
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
