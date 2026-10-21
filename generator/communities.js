/**
 * השכונות שנבנות באתר. slug = הכתובת (/slug/) — תעתיק של השם העברי, לא תרגום (משה, 18.10.2026).
 * אסור לשנות slug אחרי שהעמוד באוויר: גוגל כבר מכיר את הכתובת.
 *
 * build: true  → נבנית בכל ריצה.
 * primary      → השכונה הראשית: עמוד /my-business/ והכתובת הישנה /minyanim-har-homa/ (הפניות).
 * noindex      → נבנית אבל מוסתרת מגוגל (שלב בדיקה).
 */
export const COMMUNITIES = [
  { slug: 'har-homa', id: '5e36552b-9fb2-45aa-90aa-03301111b2dd', build: true, primary: true },
  { slug: 'gilo', id: '3fd4bab3-3f58-49d8-a19d-c106cda128d7', build: true },
  { slug: 'beit-vagan', id: '6d0987ac-b898-4469-886f-4173132d27ee', build: true },
  { slug: 'neve-yaakov', id: 'd7e4ce0d-d0a4-4a96-92f3-4a5755b02e57', build: true },
  { slug: 'pisgat-zeev', id: 'c0db1500-7701-4639-a30c-bcf78f88ec28', build: true },
  { slug: 'ramot', id: '9ae42566-e7de-44b4-a94f-1ef4005f5927', build: true },
  { slug: 'ramat-shlomo', id: 'b3a72945-1d26-4616-ba31-ed9d7a6b3a89', build: true },
  { slug: 'mea-shearim-geula', id: 'f018b563-384e-4c47-afe5-4f640faed6d4', build: true },
  { slug: 'romema-sanhedria', id: '42da6894-fca8-479a-93bf-87dd3ee3d2bd', build: true },
  { slug: 'kamash-gavash-har-nof', id: '742b8771-9a84-4438-ae30-350a251b27c3', build: true },
  { slug: 'givat-zeev', id: '7df29384-7fcd-4bcb-9b91-33c93f8a14b4', build: true },
  { slug: 'kiryat-yovel', id: 'cc1e88fc-b7fe-4995-85e9-6546323dc454', build: true },
  { slug: 'merkaz-hair-nachlaot', id: '821cabcc-062c-491a-8f28-2830236e7b35', build: true },
  { slug: 'ginot-hair', id: '52d4121b-0e73-4b19-a525-4eb41f029178', build: true },
  { slug: 'gonenim', id: 'a73f39f1-d71b-48c2-8ce9-72670738c0a4', build: true },
  { slug: 'baka-arnona-talpiot', id: '41a7729b-9a05-42fc-bcca-6d295853591b', build: true },
  { slug: 'hair-haatika-mamilla', id: '89e97875-96f6-4738-a914-01517dd6ed6a', build: true },
  { slug: 'givaa-tzarfatit-ramat-eshkol', id: '59e50e25-35b2-4029-9057-edcbfec9868f', build: true },
  { slug: 'beit-hakerem-givat-mordechai', id: '1bf6a3c4-db63-48a2-aa1e-89a60722801a', build: true },
  { slug: 'armon-hanatziv', id: '05fb476a-60f5-4636-86f1-429968d635da', build: true },
];

export const slugById = Object.fromEntries(COMMUNITIES.map((c) => [c.id, c.slug]));
