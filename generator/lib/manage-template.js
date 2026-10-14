/**
 * ניהול העסק באתר — /my-business/
 * מעטפת האתר (כותרת, תחתית) + שלד ריק. הלוגיקה ב-/js/manage.js (התחברות דרך /js/auth.js).
 * העיצוב לפי BusinessManagementScreen באפליקציה: כותרת עם גרדיאנט, כרטיסים לבנים עם אייקון צבעוני,
 * כרטיסי שירותים בצבע של כל שירות. במסך רחב — שתי עמודות.
 */
import { pageHead, siteHeader, siteFooter, HOOD_JS, navChips } from './home-template.js';

const CSS = `
.mb{min-height:60vh}
.mb [hidden]{display:none!important}
.mb *{box-sizing:border-box}
.mb-state{max-width:520px;margin:48px auto;padding:28px 22px;background:#fff;border:1px solid var(--line);border-radius:22px;text-align:center;display:flex;flex-direction:column;gap:12px;align-items:center}
.mb-state h1{margin:0;font-size:26px;font-weight:800;color:var(--navy)}.mb-state p{margin:0;color:#566173;font-size:17px;line-height:1.5}
.mb-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:48px;padding:0 22px;border-radius:999px;border:0;background:var(--navy);color:#fff;font:inherit;font-size:17px;font-weight:800;cursor:pointer;text-decoration:none}
.mb-btn:hover{background:#0F1F3B;color:#fff}.mb-btn.ghost{background:#fff;color:var(--navy);border:1.5px solid #DCE2EC}.mb-btn.ghost:hover{background:#F5F8FF;color:var(--navy)}
.mb-btn[disabled]{opacity:.6;cursor:default}
.mb-hero{background:linear-gradient(135deg,#00C4B4,#244782);color:#fff}
.mb-hero .wrap{padding-top:22px;padding-bottom:20px;display:flex;flex-direction:column;gap:16px}
.mb-top{display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap}
.mb-img{position:relative;width:72px;height:72px;border-radius:16px;overflow:hidden;flex:none;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center}
.mb-img img{width:100%;height:100%;object-fit:cover;display:block}
.mb-img .pend{position:absolute;top:4px;right:4px;font-size:11px;font-weight:800;padding:1px 6px;border-radius:6px;background:#F59E0B;color:#fff}.mb-img .pend.no{background:#DC2626}
.mb-name{flex:1;min-width:0}.mb-name h1{margin:0;font-size:clamp(24px,3.4vw,32px);font-weight:800;line-height:1.15}
.mb-name small{display:block;margin-top:4px;font-size:16px;opacity:.92}
.mb-pick{height:42px;border-radius:12px;border:0;background:rgba(255,255,255,.2);color:#fff;font:inherit;font-weight:700;padding:0 10px;max-width:220px}
.mb-pick option{color:#1C2B45}
@media(max-width:620px){.mb-pick{flex-basis:100%;max-width:none}}
.mb-chips{display:flex;gap:8px;flex-wrap:wrap}
.mb-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.2);font-size:14px;font-weight:700}
.mb-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:22px;padding-top:22px;padding-bottom:36px}.mb-col{min-width:0}
@media(min-width:900px){.mb-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start}}
.mb-col h2{margin:0 0 12px;font-size:20px;font-weight:800;color:var(--navy)}
.mb-item{display:flex;align-items:center;gap:14px;width:100%;padding:16px;margin-bottom:12px;background:#fff;border:1px solid #EEF1F5;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.06);font:inherit;text-align:right;cursor:pointer;color:inherit;text-decoration:none}
.mb-item:hover{box-shadow:0 6px 16px rgba(20,40,80,.1);color:inherit}
.mb-item i{width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex:none;font-style:normal}
.mb-item b{display:block;font-size:17px;font-weight:800;color:#2A3342}.mb-item span.s{display:block;font-size:14px;color:#6B7689;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mb-item .tx{flex:1;min-width:0}
.mb-item em{font-style:normal;font-size:12px;font-weight:800;padding:4px 9px;border-radius:8px;white-space:nowrap}
.mb-qs{background:#fff;border:1px solid #EEF1F5;border-radius:14px;padding:14px;display:flex;gap:12px;align-items:center}
.mb-qs img{width:72px;height:72px;border-radius:10px;object-fit:cover;flex:none}
.mb-qs b{display:block;font-size:16px}.mb-qs small{color:#6B7689}
.mb-note{font-size:14px;color:#6B7689;margin:4px 0 0}
/* עורך שעות */
.hr-day{display:grid;grid-template-columns:64px 1fr;gap:8px;align-items:start;padding:10px 0;border-bottom:1px solid #EEF1F5}
.hr-day>b{padding-top:10px;color:var(--navy)}
.hr-rngs{display:flex;flex-direction:column;gap:6px}
.hr-r{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.hr-r input[type=time]{height:40px;border:1.5px solid #DCE2EC;border-radius:10px;padding:0 8px;font:inherit;font-size:16px;direction:ltr}
.hr-x{width:32px;height:32px;border-radius:50%;border:0;background:#F1F4F9;color:#566173;cursor:pointer;font-size:16px}
.hr-acts{display:flex;gap:8px;flex-wrap:wrap}
.hr-lnk{background:none;border:0;padding:4px 0;font:inherit;font-size:14px;font-weight:700;color:#2A6FB8;cursor:pointer}
.hr-closed{color:#8A94A6;font-weight:700;padding:8px 0}
.sa-dlg.wide{width:min(560px,calc(100vw - 32px))}
.mb-field{display:flex;flex-direction:column;gap:6px;text-align:right}
.mb-field label{font-weight:800;color:var(--navy);font-size:15px}
.mb-field textarea{min-height:90px;border-radius:14px;border:1.5px solid #DCE2EC;padding:10px 14px;font:inherit;font-size:16px;resize:vertical}
.mb-imgedit{display:flex;gap:14px;align-items:center}
.mb-imgedit .pv{width:96px;height:96px;border-radius:14px;background:#EEF2F8;overflow:hidden;flex:none;display:flex;align-items:center;justify-content:center;color:#8A94A6;font-size:13px}
.mb-imgedit .pv img{width:100%;height:100%;object-fit:cover}
.mb-chk{display:flex;gap:10px;align-items:center;font-weight:700}
.sa-f .mb-chk input,.mb-chk input{width:22px;height:22px;flex:none;padding:0;margin:0;accent-color:#244782}
`;

export function managePage(vm, { base, home }) {
  const head = pageHead({ title: 'ניהול העסק | שכונה', desc: 'ניהול העסק שלכם בשכונה: פרטים, שעות, תמונה, המלצות ושירותים.', url: `${base}/my-business/`, base, css: CSS })
    .replace('<meta name="description"', '<meta name="robots" content="noindex">\n<meta name="description"');
  return `${head}<a href="#main" class="sr">דלג לתוכן</a>

${siteHeader(vm, home, navChips(home, ''))}

<main id="main" class="mb" data-home="${home}">
<div class="mb-state" id="mb-state"><p>טוען…</p></div>
<section id="mb-app" hidden aria-label="ניהול העסק"></section>
</main>

${siteFooter()}
<script>${HOOD_JS}</script>
<script src="/js/manage.js?v=1" defer></script>
</body>
</html>`;
}
