#!/usr/bin/env node
/**
 * גנרטור עמודי SEO — מניינים בהר חומה.
 *
 * קורא מ-Supabase עם ה-anon key (אותו מפתח ציבורי שהאפליקציה משתמשת בו)
 * ומייצר HTML סטטי לתוך הרפו. רץ פעם ביום ב-GitHub Actions.
 *
 *   node build.js --out ../ [--dry]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { SlugStore } from './lib/slugs.js';
import { computeZmanim, sortPrayers, formatPrayerTime } from './lib/prayers.js';
import { isPrayerInSeason } from './lib/season.js';
import { synagoguePage, indexPage, sitemap } from './lib/template.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * המפתח נקרא מ-app/.env שכבר קיים ברפו (הוא נוצר ע"י build של Flutter Web).
 * anon key נועד להיות ציבורי — RLS הוא שמגן על הנתונים, לא סודיות המפתח.
 * משתנה סביבה דורס, אם אי פעם נרצה להריץ מול פרויקט אחר.
 */
function fromDotEnv(file) {
  try {
    return Object.fromEntries(
      fs.readFileSync(file, 'utf8')
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#'))
        .map((l) => {
          const i = l.indexOf('=');
          return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
        })
    );
  } catch {
    return {};
  }
}

const env = fromDotEnv(path.resolve(__dirname, '../app/.env'));

const SUPABASE_URL = process.env.SUPABASE_URL || env.SUPABASE_URL;
const ANON_KEY     = process.env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
const COMMUNITY_ID = process.env.COMMUNITY_ID || '5e36552b-9fb2-45aa-90aa-03301111b2dd';
const BASE         = process.env.SITE_BASE || 'https://shchuna.co.il';

const args   = process.argv.slice(2);
const DRY    = args.includes('--dry');
const outIdx = args.indexOf('--out');
const OUT    = path.resolve(__dirname, outIdx > -1 ? args[outIdx + 1] : '../out');
const SECTION = 'minyanim-har-homa';

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('לא נמצאו SUPABASE_URL / SUPABASE_ANON_KEY — לא ב-app/.env ולא בסביבה');
  process.exit(1);
}

const write = (rel, content) => {
  const file = path.join(OUT, rel);
  if (DRY) { console.log(`  [dry] ${rel}  (${content.length} bytes)`); return; }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
};

async function main() {
  const db = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

  const [{ data: community, error: e0 }, { data: syns, error: e1 }] = await Promise.all([
    db.from('community').select('neighborhood,city,latitude,longitude').eq('id', COMMUNITY_ID).single(),
    db.from('synagogues')
      .select('id,name,address,access_notes,rabbi_name,prayer_nusach,latitude,longitude,' +
              'is_accessible,has_hall,can_study_during_day,study_during_day_details')
      .eq('community_id', COMMUNITY_ID)
      .order('name'),
  ]);
  if (e0 || e1) throw e0 || e1;

  const ids = syns.map((s) => String(s.id));
  const [{ data: prayers, error: e2 }, { data: lessons, error: e3 }] = await Promise.all([
    db.from('prayers').select('id,synagogue_id,type,time,set,season,is_open,selected_days,notes')
      .in('synagogue_id', ids),
    db.from('lessons').select('id,synagogue_id,topic,teacher,day,start_time,end_time,type')
      .in('synagogue_id', ids),
  ]);
  if (e2 || e3) throw e2 || e3;

  const zmanim = computeZmanim(community.latitude, community.longitude);
  const slugs  = new SlugStore(path.join(OUT, SECTION, 'slugs.json'));

  const byId = (rows) => rows.reduce((m, r) => ((m[String(r.synagogue_id)] ||= []).push(r), m), {});
  const P = byId(prayers || {});
  const L = byId(lessons || {});

  const urls = [{ loc: `${BASE}/${SECTION}/`, freq: 'weekly', pri: '0.9' }];
  const listed = [];
  let withPrayers = 0;

  for (const syn of syns) {
    syn.slug = slugs.get(syn.id, syn.name);
    const p = (P[String(syn.id)] || []).filter((x) => isPrayerInSeason(x));
    const l = L[String(syn.id)] || [];
    if (p.length) withPrayers++;

    write(path.join(SECTION, syn.slug, 'index.html'),
      synagoguePage({ syn, prayers: p, lessons: l, zmanim, base: BASE }));

    urls.push({ loc: `${BASE}/${SECTION}/${encodeURIComponent(syn.slug)}/`, freq: 'weekly', pri: '0.7' });

    // תצוגה מקדימה בעמוד האינדקס: התפילה הראשונה בכל סוג
    const seen = new Set();
    const preview = sortPrayers(p, zmanim)
      .filter((x) => !seen.has(x.type) && seen.add(x.type))
      .map((x) => `${x.type} ${formatPrayerTime(x.set, x.time)}`)
      .join(' · ');

    listed.push({ ...syn, preview });
  }

  write(path.join(SECTION, 'index.html'),
    indexPage({ synagogues: listed, base: BASE, counts: { total: syns.length, withPrayers } }));
  write('sitemap.xml', sitemap(urls));
  write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\n`);

  if (!DRY && slugs.save()) console.log('  slugs.json עודכן');

  console.log(`\n✓ ${syns.length} בתי כנסת · ${withPrayers} עם זמני תפילה · ${prayers.length} מניינים`);
  console.log(`  ${urls.length} כתובות ב-sitemap`);
  if (DRY) console.log('  (הרצה יבשה — לא נכתבו קבצים)');
}

main().catch((e) => { console.error(e); process.exit(1); });
