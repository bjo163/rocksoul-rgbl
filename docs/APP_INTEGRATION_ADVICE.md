# MoonWitness App Integration Advice

Status: **guidance for app-side (`X:\REPO\moonwitness`) seed/model work**.
Written from the perspective of the corpus project (`moonwitness-corpus`) to inform app development.

Goal: **Seed all 12 world religions** with scripture, tradition, figures, devotional, and provenance data from corpus.

---

## 1. Critical Bugs in `demo-data.ts`

### Bug A — `wx.tradition` missing required `slug`

**File:** `packages/moon-witness/src/models/wx-tradition.ts`
```typescript
slug = fields.Char({ required: true, unique: true, size: 80, index: true })
```

**File:** `packages/moon-witness/src/demo-data.ts` (line ~311)
```typescript
const row = await Tradition.spawn(Tradition, env, { scriptureId: quranScriptureId, ...t })
```

**Problem:** `traditionSeeds` array does NOT include a `slug` field. Since `slug` is `required: true`, this will throw a database constraint error on fresh installs.

**Fix:** Add `slug` to every tradition seed and change the idempotent check:
```diff
- const rows = await Tradition.fetch(Tradition, env, [['name', '=', t.name]])
+ const rows = await Tradition.fetch(Tradition, env, [['slug', '=', t.slug]])
```

---

### Bug B — `wx.source` missing required `stableKey`

**File:** `packages/moon-witness/src/models/wx-source.ts`
```typescript
stableKey = fields.Char({ required: true, unique: true, index: true, size: 180 })
sourceClass = fields.Selection({ ..., required: true })
capability = fields.Selection({ ..., required: true })
```

**File:** `packages/moon-witness/src/demo-data.ts` (lines ~80-84) — `stableKey`, `sourceClass`, and `capability` are all `required: true` but not provided in `sourceSeeds`.

**Fix:** Add `stableKey`, `sourceClass`, `capability` and change the idempotent check:
```diff
- const rows = await Source.fetch(Source, env, [['name', '=', s.name]])
+ const rows = await Source.fetch(Source, env, [['stableKey', '=', s.stableKey]])
```

---

## 2. Seed Architecture — Consolidate Religion Seeds

### Problem

Two separate code paths seed religions and may conflict:

1. **`seed/graph-core.ts`** — seeds **3 religions** (Islam, Judaism, Christianity) with `IrModelData.setXmlid()`.
2. **`demo-data.ts`** — seeds **12 religions** without `IrModelData.setXmlid()`.

### Recommended Fix

Expand `graph-core.ts` to seed all 12 religions and remove religion seeding from `demo-data.ts`:

```typescript
const RELIGION_CONTEXTS = [
  { code: 'ISLAM', name: 'Islam', description: 'Abrahamic monotheistic religion centered on the Quran and the teachings of Prophet Muhammad.' },
  { code: 'CHRISTIANITY', name: 'Christianity', description: 'Abrahamic religion centered on the life and teachings of Jesus Christ.' },
  { code: 'JUDAISM', name: 'Judaism', description: 'Abrahamic religion of the Jewish people, based on the Torah and Talmud.' },
  { code: 'HINDUISM', name: 'Hinduism', description: 'Dharma religion from the Indian subcontinent with diverse traditions and scriptures like Vedas and Bhagavad Gita.' },
  { code: 'BUDDHISM', name: 'Buddhism', description: 'Dharma religion founded by Siddhartha Gautama (Buddha) focusing on the path to enlightenment.' },
  { code: 'SIKHISM', name: 'Sikhism', description: 'Monotheistic religion founded by Guru Nanak in Punjab, centered on Guru Granth Sahib.' },
  { code: 'JAINISM', name: 'Jainism', description: 'Ancient Indian religion emphasizing non-violence (ahimsa) and spiritual liberation.' },
  { code: 'TAOISM', name: 'Taoism', description: 'Chinese philosophy and religion based on the Tao Te Ching and teachings of Laozi.' },
  { code: 'CONFUCIANISM', name: 'Confucianism', description: 'Chinese ethical and philosophical system based on the teachings of Confucius.' },
  { code: 'SHINTO', name: 'Shinto', description: 'Indigenous spirituality of Japan centered on kami (spirits) and shrine worship.' },
  { code: 'ZOROASTRIANISM', name: 'Zoroastrianism', description: 'Ancient Persian monotheistic religion founded by Zoroaster (Zarathustra).' },
  { code: 'BAHAI', name: "Bahá'í", description: "Monotheistic religion founded by Bahá'u'lláh emphasizing unity of humanity and religions." }
] as const
```

---

## 3. Seed Refactor — Replace API Fetch with Corpus Bundle

### Current Problem

`demo-data.ts` fetches Quran from `api.quran.com` at runtime:
- Seed fails if API is down or rate-limited
- Only seeds 10 out of 114 surahs
- Not reproducible (API may change)
- Violates provenance principle

### Recommended Approach

1. Add corpus as dependency (git submodule or npm package)
2. Create `packages/moon-witness/src/seed/corpus-import.ts` that reads static seed bundles
3. Replace API fetch calls in `demo-data.ts` with corpus bundle reads

---

## 4. Model Status — No Changes Needed

All 51 `wx.*` models are ready. No model changes required for corpus expansion.

---

## 5. Complete Seed Data Specification — All 12 Religions

The following sections contain the **complete** seed data that `demo-data.ts` (or `corpus-import.ts`) should insert. Currently much of this is missing.

### 5A. Sources (`wx.source`) — Per Corpus Dataset

```typescript
const sourceSeeds = [
  // Islam
  { stableKey: 'source:tanzil-quran-uthmani', name: 'Tanzil Quran Text — Uthmani', sourceClass: 'REVELATION', capability: 'BUNDLED_TEXT', sourceUrl: 'https://tanzil.net', notes: 'Source-preserving Uthmani representation of the Quran.' },
  { stableKey: 'source:quranenc-rwwad-en', name: 'QuranEnc — Rwwad English Translation', sourceClass: 'TEXTUAL_WITNESS', capability: 'BUNDLED_TEXT', sourceUrl: 'https://quranenc.com', notes: 'English Quran translation by Rwwad Translation Center.' },
  { stableKey: 'source:quranenc-kemenag-id', name: 'QuranEnc — Kemenag Indonesian Translation', sourceClass: 'TEXTUAL_WITNESS', capability: 'BUNDLED_TEXT', sourceUrl: 'https://quranenc.com', notes: 'Indonesian Quran translation by Kementerian Agama RI.' },
  { stableKey: 'source:open-hadith-data', name: 'Open Hadith Data (CC0)', sourceClass: 'TRADITION_REPORT', capability: 'BUNDLED_TEXT', sourceUrl: 'https://github.com/Jaguar16/open-hadith-data', notes: 'CC0 Arabic hadith text; English excluded per rights audit.' },
  // Judaism
  { stableKey: 'source:oshb-wlc', name: 'Open Scriptures Hebrew Bible — Westminster Leningrad Codex', sourceClass: 'REVELATION', capability: 'BUNDLED_TEXT', sourceUrl: 'https://github.com/openscriptures/morphhb', notes: 'Public domain WLC text; morphology CC BY 4.0.' },
  // Christianity
  { stableKey: 'source:sblgnt-v1-2', name: 'SBL Greek New Testament v1.2', sourceClass: 'REVELATION', capability: 'BUNDLED_TEXT', sourceUrl: 'https://github.com/Faithlife/SBLGNT', notes: 'CC BY 4.0 critical edition.' },
  { stableKey: 'source:ebible-web-classic-2020', name: 'World English Bible Classic 2020', sourceClass: 'TEXTUAL_WITNESS', capability: 'BUNDLED_TEXT', sourceUrl: 'https://ebible.org/eng-web/', notes: 'Public domain; WEB name is trademark.' },
  { stableKey: 'source:ebible-tsi-2021', name: 'Terjemahan Sederhana Indonesia 2021', sourceClass: 'TEXTUAL_WITNESS', capability: 'BUNDLED_TEXT', sourceUrl: 'https://ebible.org', notes: 'Indonesian Bible translation.' },
  // Buddhism
  { stableKey: 'source:suttacentral-bilara-sujato', name: 'SuttaCentral Bilara — Bhikkhu Sujato', sourceClass: 'TEXTUAL_WITNESS', capability: 'BUNDLED_TEXT', sourceUrl: 'https://github.com/suttacentral/bilara-data', notes: 'CC0 English translations of Pali Canon.' },
  // Hinduism
  { stableKey: 'source:sacred-texts-gita', name: 'Bhagavad Gita — Sacred Texts Archive', sourceClass: 'TEXTUAL_WITNESS', capability: 'REFERENCE_ONLY', sourceUrl: 'https://sacred-texts.com', notes: 'PD Sanskrit text and pre-1928 translations.' },
  // Cross-tradition
  { stableKey: 'source:corpus-curated', name: 'MoonWitness Corpus Curated Data', sourceClass: 'RESEARCH_DATASET', capability: 'BUNDLED_TEXT', notes: 'Curated seed data from MoonWitness Corpus project.' }
]
```

### 5B. Scripture Registry (`wx.scripture`) — All Traditions

```typescript
const scriptureSeeds = [
  // ── Abrahamic Canonical (REVELATION) ──
  {
    canonicalCode: 'QURAN', slug: 'al-quran',
    name: "Al-Qur'an Al-Karim", originalName: 'القرآن الكريم',
    sourceClass: 'REVELATION', authorityClass: 'PRIMARY_SOURCE',
    type: 'canonical', religion: 'Islam',
    booksCount: 114, versesCount: 6236,
    prophet: 'Nabi Muhammad SAW', revelationEra: '610–632 M',
    description: 'Kalamullah yang diturunkan kepada Nabi Muhammad SAW sebagai mukjizat abadi dan petunjuk bagi seluruh umat manusia.'
  },
  {
    canonicalCode: 'TAWRAT', slug: 'torah',
    name: 'Torah / Taurat', originalName: 'תורה',
    sourceClass: 'REVELATION', authorityClass: 'PRIMARY_SOURCE',
    type: 'canonical', religion: 'Judaism',
    booksCount: 39, versesCount: 23213,
    prophet: 'Nabi Musa AS', revelationEra: '~1400 SM',
    description: 'Kitab suci agama Yahudi, diturunkan kepada Nabi Musa AS di Gunung Sinai.'
  },
  {
    canonicalCode: 'ZABUR', slug: 'zabur',
    name: 'Zabur / Mazmur', originalName: 'תהילים',
    sourceClass: 'REVELATION', authorityClass: 'PRIMARY_SOURCE',
    type: 'canonical', religion: 'Judaism',
    booksCount: 1, versesCount: 2461,
    prophet: 'Nabi Daud AS', revelationEra: '~1000 SM',
    description: 'Kitab Mazmur (Psalms) yang diturunkan kepada Nabi Daud AS.'
  },
  {
    canonicalCode: 'INJIL', slug: 'injil',
    name: 'Injil / New Testament', originalName: 'Εὐαγγέλιον',
    sourceClass: 'REVELATION', authorityClass: 'PRIMARY_SOURCE',
    type: 'canonical', religion: 'Christianity',
    booksCount: 27, versesCount: 7941,
    prophet: 'Nabi Isa AS', revelationEra: '~30 M',
    description: 'Perjanjian Baru / Injil yang diturunkan kepada Nabi Isa AS.'
  },

  // ── Non-Abrahamic (TEXTUAL_WITNESS) ──
  {
    canonicalCode: null, slug: 'dhammapada',
    name: 'Dhammapada', originalName: 'ธรรมบท / धम्मपद',
    sourceClass: 'TEXTUAL_WITNESS', authorityClass: 'PRIMARY_SOURCE',
    type: 'additional', religion: 'Buddhism',
    booksCount: 26, versesCount: 423,
    description: 'Kumpulan 423 syair ajaran Buddha dari Khuddaka Nikaya, Sutta Pitaka.'
  },
  {
    canonicalCode: null, slug: 'tipitaka-sutta',
    name: 'Sutta Pitaka (Selections)', originalName: 'สุตตันตปิฎก',
    sourceClass: 'TEXTUAL_WITNESS', authorityClass: 'PRIMARY_SOURCE',
    type: 'additional', religion: 'Buddhism',
    booksCount: 4, versesCount: 3937,
    description: 'Kumpulan ajaran Buddha dari DN, MN, SN, AN — Bhikkhu Sujato English translations.'
  },
  {
    canonicalCode: null, slug: 'bhagavad-gita',
    name: 'Bhagavad Gita', originalName: 'भगवद्गीता',
    sourceClass: 'TEXTUAL_WITNESS', authorityClass: 'PRIMARY_SOURCE',
    type: 'philosophy', religion: 'Hinduism',
    booksCount: 18, versesCount: 700,
    description: 'Dialog antara Arjuna dan Krishna tentang dharma, bagian dari Mahabharata.'
  },
  {
    canonicalCode: null, slug: 'yoga-sutras',
    name: 'Yoga Sutras of Patanjali', originalName: 'योगसूत्र',
    sourceClass: 'TEXTUAL_WITNESS', authorityClass: 'PRIMARY_SOURCE',
    type: 'philosophy', religion: 'Hinduism',
    booksCount: 4, versesCount: 196,
    description: '196 sutra tentang praktik yoga dan pencapaian spiritual, disusun oleh Rishi Patanjali.'
  },
  {
    canonicalCode: null, slug: 'guru-granth-sahib',
    name: 'Guru Granth Sahib', originalName: 'ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ',
    sourceClass: 'TEXTUAL_WITNESS', authorityClass: 'PRIMARY_SOURCE',
    type: 'additional', religion: 'Sikhism',
    booksCount: 31, versesCount: 5894,
    description: 'Kitab suci Sikhisme yang dianggap sebagai Guru abadi, berisi 5.894 shabad.'
  },
  {
    canonicalCode: null, slug: 'tao-te-ching',
    name: 'Tao Te Ching', originalName: '道德經',
    sourceClass: 'TEXTUAL_WITNESS', authorityClass: 'PRIMARY_SOURCE',
    type: 'philosophy', religion: 'Taoism',
    booksCount: 2, versesCount: 81,
    description: 'Karya klasik Laozi tentang Tao (Jalan) dan De (Kebajikan), fondasi filosofi Taoisme.'
  },
  {
    canonicalCode: null, slug: 'analects',
    name: 'Analects of Confucius', originalName: '論語',
    sourceClass: 'TEXTUAL_WITNESS', authorityClass: 'PRIMARY_SOURCE',
    type: 'philosophy', religion: 'Confucianism',
    booksCount: 20, versesCount: 500,
    description: 'Kumpulan ajaran dan percakapan Kongzi (Confucius) yang direkam oleh murid-muridnya.'
  },
  {
    canonicalCode: null, slug: 'gathas-avesta',
    name: 'Gathas', originalName: 'گاتها',
    sourceClass: 'TEXTUAL_WITNESS', authorityClass: 'PRIMARY_SOURCE',
    type: 'additional', religion: 'Zoroastrianism',
    booksCount: 5, versesCount: 238,
    description: 'Nyanyian suci Zarathustra, bagian tertua dari Avesta, dalam bahasa Avestan kuno.'
  },
  {
    canonicalCode: null, slug: 'kitab-i-aqdas',
    name: "Kitáb-i-Aqdas", originalName: 'الكتاب الأقدس',
    sourceClass: 'TEXTUAL_WITNESS', authorityClass: 'PRIMARY_SOURCE',
    type: 'additional', religion: "Bahá'í",
    booksCount: 1, versesCount: 380,
    description: "Kitab Paling Suci, karya utama Bahá'u'lláh, berisi hukum dan ajaran Bahá'í."
  },
  {
    canonicalCode: null, slug: 'tattvartha-sutra',
    name: 'Tattvartha Sutra', originalName: 'तत्त्वार्थसूत्र',
    sourceClass: 'TEXTUAL_WITNESS', authorityClass: 'PRIMARY_SOURCE',
    type: 'philosophy', religion: 'Jainism',
    booksCount: 10, versesCount: 357,
    description: 'Karya sistematis Umasvati tentang realitas (tattva), diterima oleh semua sekte Jain.'
  },
  {
    canonicalCode: null, slug: 'kojiki',
    name: 'Kojiki', originalName: '古事記',
    sourceClass: 'TEXTUAL_WITNESS', authorityClass: 'HISTORICAL_REPORT',
    type: 'additional', religion: 'Shinto',
    booksCount: 3, versesCount: 340,
    description: 'Catatan tertua sejarah Jepang (712 M), berisi mitologi penciptaan dan silsilah kami.'
  }
]
```

### 5C. Tradition Collections (`wx.tradition`) — Multi-Religion

```typescript
const traditionSeeds = [
  // ── Islam ──
  { slug: 'sahih-bukhari', name: 'Shahih al-Bukhari', originalName: 'صحيح البخاري', author: 'Imam Muhammad bin Ismail al-Bukhari (194–256 H)', totalItems: 7563, gradeLevel: 'SHAHIH', category: 'Hadits Shahih', description: 'Kitab hadits paling otentik setelah Al-Quran.', religion: 'ISLAM' },
  { slug: 'sahih-muslim', name: 'Sahih Muslim', originalName: 'صحيح مسلم', author: 'Imam Muslim bin al-Hajjaj (202–261 H)', totalItems: 7458, gradeLevel: 'SHAHIH', category: 'Hadits Shahih', description: 'Kitab hadits shahih kedua paling otentik.', religion: 'ISLAM' },
  { slug: 'arbain-nawawiyyah', name: "Arba'in An-Nawawiyyah", originalName: 'الأربعون النووية', author: 'Imam An-Nawawi (631–676 H)', totalItems: 42, gradeLevel: 'SHAHIH', category: 'Kompilasi Tematik', description: 'Kumpulan 42 hadits pokok.', religion: 'ISLAM' },
  { slug: 'sunan-abu-dawud', name: 'Sunan Abu Dawud', originalName: 'سنن أبي داود', author: 'Imam Abu Dawud (202–275 H)', totalItems: 5274, gradeLevel: 'MIXED', category: 'Sunan', description: 'Salah satu dari Kutub al-Sittah.', religion: 'ISLAM' },
  { slug: 'jami-tirmidhi', name: "Jami' at-Tirmidhi", originalName: 'جامع الترمذي', author: 'Imam at-Tirmidhi (209–279 H)', totalItems: 3956, gradeLevel: 'MIXED', category: 'Sunan', description: 'Salah satu dari Kutub al-Sittah.', religion: 'ISLAM' },

  // ── Judaism ──
  { slug: 'mishnah', name: 'Mishnah', originalName: 'מִשְׁנָה', author: 'Rabbi Yehudah HaNasi (~200 M)', totalItems: 4200, gradeLevel: 'SHAHIH', category: 'Hukum Yahudi', description: 'Kodifikasi pertama hukum lisan Yahudi, terdiri dari 6 ordo dan 63 traktat.', religion: 'JUDAISM' },
  { slug: 'pirkei-avot', name: 'Pirkei Avot', originalName: 'פרקי אבות', author: 'Tradisi Tannaim', totalItems: 100, gradeLevel: 'SHAHIH', category: 'Etika Yahudi', description: 'Bab-bab Para Bapa — ajaran etika dari para rabbi Mishnah.', religion: 'JUDAISM' },

  // ── Christianity ──
  { slug: 'didache', name: 'Didache', originalName: 'Διδαχή', author: 'Anonim (~60-100 M)', totalItems: 16, gradeLevel: 'SHAHIH', category: 'Tulisan Apostolik', description: 'Pengajaran Dua Belas Rasul — manual gereja Kristen tertua.', religion: 'CHRISTIANITY' },
  { slug: 'first-clement', name: '1 Clement', originalName: 'Κλήμεντος πρὸς Κορινθίους', author: 'Clemens Romanus (~96 M)', totalItems: 65, gradeLevel: 'SHAHIH', category: 'Tulisan Apostolik', description: 'Surat dari Clemens Roma ke jemaat Korintus.', religion: 'CHRISTIANITY' },

  // ── Buddhism ──
  { slug: 'dhammapada-commentary', name: 'Dhammapada Atthakatha', originalName: 'ธัมมปทัฏฐกถา', author: 'Buddhaghosa (~5th century)', totalItems: 423, gradeLevel: 'SHAHIH', category: 'Komentar', description: 'Komentar klasik terhadap Dhammapada oleh Buddhaghosa.', religion: 'BUDDHISM' },

  // ── Hinduism ──
  { slug: 'brahma-sutras', name: 'Brahma Sutras', originalName: 'ब्रह्मसूत्र', author: 'Rishi Badarayana', totalItems: 555, gradeLevel: 'SHAHIH', category: 'Filsafat Vedanta', description: 'Ringkasan sistematis ajaran Upanishad.', religion: 'HINDUISM' },

  // ── Sikhism ──
  { slug: 'dasam-granth', name: 'Dasam Granth', originalName: 'ਦਸਮ ਗ੍ਰੰਥ', author: 'Guru Gobind Singh Ji', totalItems: 1428, gradeLevel: 'MIXED', category: 'Kitab Pelengkap', description: 'Kumpulan tulisan yang diatribusikan kepada Guru Gobind Singh.', religion: 'SIKHISM' },

  // ── Confucianism ──
  { slug: 'mencius', name: 'Mencius (Mengzi)', originalName: '孟子', author: 'Mengzi (~372–289 SM)', totalItems: 260, gradeLevel: 'SHAHIH', category: 'Empat Buku', description: 'Karya Mengzi, salah satu dari Empat Buku klasik Konfusianisme.', religion: 'CONFUCIANISM' }
]
```

### 5D. Figure Seeds (`wx.figure`) — Expanded All Traditions

```typescript
const figureSeeds = [
  // ── Islam (Prophets) ──
  { stableKey: 'figure:adam', name: 'Adam AS', religionCode: 'ISLAM', roleCode: 'PROPHET', certainty: 'ESTABLISHED', notes: 'First human and first prophet in Islamic tradition.' },
  { stableKey: 'figure:nuh', name: 'Nuh AS', religionCode: 'ISLAM', roleCode: 'PROPHET', certainty: 'ESTABLISHED', notes: 'Prophet Noah, built the ark.' },
  { stableKey: 'figure:ibrahim', name: 'Ibrahim AS', religionCode: 'ISLAM', roleCode: 'PROPHET', certainty: 'ESTABLISHED', notes: 'Prophet Abraham, father of monotheism.' },
  { stableKey: 'figure:ismail', name: 'Ismail AS', religionCode: 'ISLAM', roleCode: 'PROPHET', certainty: 'ESTABLISHED', notes: 'Son of Ibrahim, ancestor of Arab people.' },
  { stableKey: 'figure:ishaq', name: 'Ishaq AS', religionCode: 'ISLAM', roleCode: 'PROPHET', certainty: 'ESTABLISHED', notes: 'Son of Ibrahim, ancestor of Bani Israel.' },
  { stableKey: 'figure:yaqub', name: 'Yaqub AS', religionCode: 'ISLAM', roleCode: 'PROPHET', certainty: 'ESTABLISHED', notes: 'Prophet Jacob / Israel.' },
  { stableKey: 'figure:yusuf', name: 'Yusuf AS', religionCode: 'ISLAM', roleCode: 'PROPHET', certainty: 'ESTABLISHED', notes: 'Prophet Joseph, known for his beauty and wisdom.' },
  { stableKey: 'figure:musa', name: 'Musa AS', religionCode: 'ISLAM', roleCode: 'PROPHET', certainty: 'ESTABLISHED', notes: 'Prophet Moses, received the Taurat.' },
  { stableKey: 'figure:harun', name: 'Harun AS', religionCode: 'ISLAM', roleCode: 'PROPHET', certainty: 'ESTABLISHED', notes: 'Prophet Aaron, brother and aide of Musa.' },
  { stableKey: 'figure:daud', name: 'Daud AS', religionCode: 'ISLAM', roleCode: 'PROPHET', certainty: 'ESTABLISHED', notes: 'Prophet David, received the Zabur.' },
  { stableKey: 'figure:sulaiman', name: 'Sulaiman AS', religionCode: 'ISLAM', roleCode: 'PROPHET', certainty: 'ESTABLISHED', notes: 'Prophet Solomon, king with dominion over jinn and nature.' },
  { stableKey: 'figure:isa', name: 'Isa AS', religionCode: 'ISLAM', roleCode: 'PROPHET', certainty: 'ESTABLISHED', notes: 'Prophet Jesus, received the Injil.' },
  { stableKey: 'figure:muhammad', name: 'Muhammad SAW', religionCode: 'ISLAM', roleCode: 'PROPHET', certainty: 'ESTABLISHED', notes: 'Last prophet of Islam, received the Quran.' },
  { stableKey: 'figure:maryam', name: 'Maryam', religionCode: 'ISLAM', roleCode: 'MOTHER', certainty: 'ESTABLISHED', notes: 'Mother of Isa AS. Only woman mentioned by name in the Quran.' },
  { stableKey: 'figure:khadijah', name: 'Khadijah RA', religionCode: 'ISLAM', roleCode: 'COMPANION', certainty: 'ESTABLISHED', notes: 'First wife of Muhammad SAW and first Muslim.' },
  { stableKey: 'figure:abubakar', name: 'Abu Bakar RA', religionCode: 'ISLAM', roleCode: 'CALIPH', certainty: 'ESTABLISHED', notes: 'First caliph of Islam.' },

  // ── Judaism ──
  { stableKey: 'figure:abraham', name: 'Abraham', religionCode: 'JUDAISM', roleCode: 'PATRIARCH', certainty: 'ESTABLISHED', notes: 'Patriarch of Judaism, Christianity, and Islam.' },
  { stableKey: 'figure:moses', name: 'Moses', religionCode: 'JUDAISM', roleCode: 'PROPHET', certainty: 'ESTABLISHED', notes: 'Greatest prophet in Judaism, received the Torah at Sinai.' },
  { stableKey: 'figure:david', name: 'David', religionCode: 'JUDAISM', roleCode: 'KING', certainty: 'ESTABLISHED', notes: 'King of Israel and author of Psalms.' },
  { stableKey: 'figure:solomon', name: 'Solomon', religionCode: 'JUDAISM', roleCode: 'KING', certainty: 'ESTABLISHED', notes: 'King Solomon, builder of the First Temple.' },
  { stableKey: 'figure:elijah', name: 'Elijah', religionCode: 'JUDAISM', roleCode: 'PROPHET', certainty: 'ESTABLISHED', notes: 'Great prophet who confronted Baal worship.' },
  { stableKey: 'figure:hillel', name: 'Hillel the Elder', religionCode: 'JUDAISM', roleCode: 'SAGE', certainty: 'ESTABLISHED', notes: 'One of the most important figures in Jewish history, founder of Beit Hillel.' },

  // ── Christianity ──
  { stableKey: 'figure:jesus', name: 'Jesus Christ', religionCode: 'CHRISTIANITY', roleCode: 'MESSIAH', certainty: 'ESTABLISHED', notes: 'Central figure of Christianity.' },
  { stableKey: 'figure:mary', name: 'Mary', religionCode: 'CHRISTIANITY', roleCode: 'MOTHER', certainty: 'ESTABLISHED', notes: 'Mother of Jesus Christ, Theotokos.' },
  { stableKey: 'figure:paul', name: 'Paul of Tarsus', religionCode: 'CHRISTIANITY', roleCode: 'APOSTLE', certainty: 'ESTABLISHED', notes: 'Apostle who spread Christianity across the Roman Empire.' },
  { stableKey: 'figure:peter', name: 'Peter', religionCode: 'CHRISTIANITY', roleCode: 'APOSTLE', certainty: 'ESTABLISHED', notes: 'Chief apostle, considered first Bishop of Rome.' },
  { stableKey: 'figure:john', name: 'John', religionCode: 'CHRISTIANITY', roleCode: 'APOSTLE', certainty: 'ESTABLISHED', notes: 'Beloved disciple, author attributed to Gospel of John.' },

  // ── Hinduism ──
  { stableKey: 'figure:krishna', name: 'Krishna', religionCode: 'HINDUISM', roleCode: 'DEITY', certainty: 'ESTABLISHED', notes: 'Avatar of Vishnu, central figure of Bhagavad Gita.' },
  { stableKey: 'figure:rama', name: 'Rama', religionCode: 'HINDUISM', roleCode: 'DEITY', certainty: 'ESTABLISHED', notes: 'Avatar of Vishnu, hero of Ramayana.' },
  { stableKey: 'figure:shiva', name: 'Shiva', religionCode: 'HINDUISM', roleCode: 'DEITY', certainty: 'ESTABLISHED', notes: 'The Destroyer/Transformer in the Trimurti.' },
  { stableKey: 'figure:vyasa', name: 'Vyasa', religionCode: 'HINDUISM', roleCode: 'SAGE', certainty: 'PROVISIONAL', notes: 'Sage who compiled the Vedas and authored Mahabharata.' },
  { stableKey: 'figure:patanjali', name: 'Patanjali', religionCode: 'HINDUISM', roleCode: 'SAGE', certainty: 'PROVISIONAL', notes: 'Compiler of the Yoga Sutras.' },
  { stableKey: 'figure:arjuna', name: 'Arjuna', religionCode: 'HINDUISM', roleCode: 'WARRIOR', certainty: 'ESTABLISHED', notes: 'Pandava prince, student of Krishna in the Bhagavad Gita.' },

  // ── Buddhism ──
  { stableKey: 'figure:buddha', name: 'Siddhartha Gautama', religionCode: 'BUDDHISM', roleCode: 'BUDDHA', certainty: 'ESTABLISHED', notes: 'Founder of Buddhism, attained enlightenment under the Bodhi tree.' },
  { stableKey: 'figure:ananda', name: 'Ananda', religionCode: 'BUDDHISM', roleCode: 'DISCIPLE', certainty: 'ESTABLISHED', notes: 'Primary attendant of Buddha, key transmitter of teachings.' },
  { stableKey: 'figure:sariputta', name: 'Sariputta', religionCode: 'BUDDHISM', roleCode: 'DISCIPLE', certainty: 'ESTABLISHED', notes: 'Chief disciple of Buddha, foremost in wisdom.' },
  { stableKey: 'figure:moggallana', name: 'Moggallana', religionCode: 'BUDDHISM', roleCode: 'DISCIPLE', certainty: 'ESTABLISHED', notes: 'Chief disciple of Buddha, foremost in psychic powers.' },
  { stableKey: 'figure:nagarjuna', name: 'Nagarjuna', religionCode: 'BUDDHISM', roleCode: 'SAGE', certainty: 'ESTABLISHED', notes: 'Founder of Madhyamaka philosophy, most influential Buddhist philosopher.' },

  // ── Sikhism ──
  { stableKey: 'figure:nanak', name: 'Guru Nanak', religionCode: 'SIKHISM', roleCode: 'GURU', certainty: 'ESTABLISHED', notes: 'Founder and first Guru of Sikhism (1469–1539).' },
  { stableKey: 'figure:angad', name: 'Guru Angad', religionCode: 'SIKHISM', roleCode: 'GURU', certainty: 'ESTABLISHED', notes: 'Second Sikh Guru, standardized Gurmukhi script.' },
  { stableKey: 'figure:arjan', name: 'Guru Arjan', religionCode: 'SIKHISM', roleCode: 'GURU', certainty: 'ESTABLISHED', notes: 'Fifth Sikh Guru, compiled the Adi Granth.' },
  { stableKey: 'figure:gobind', name: 'Guru Gobind Singh', religionCode: 'SIKHISM', roleCode: 'GURU', certainty: 'ESTABLISHED', notes: 'Tenth and last human Sikh Guru, founded the Khalsa.' },

  // ── Jainism ──
  { stableKey: 'figure:mahavira', name: 'Mahavira', religionCode: 'JAINISM', roleCode: 'TIRTHANKARA', certainty: 'ESTABLISHED', notes: '24th and last Tirthankara of Jainism (~599–527 SM).' },
  { stableKey: 'figure:rishabhanatha', name: 'Rishabhanatha', religionCode: 'JAINISM', roleCode: 'TIRTHANKARA', certainty: 'PROVISIONAL', notes: 'First Tirthankara, also known as Adinatha.' },
  { stableKey: 'figure:parshvanatha', name: 'Parshvanatha', religionCode: 'JAINISM', roleCode: 'TIRTHANKARA', certainty: 'ESTABLISHED', notes: '23rd Tirthankara (~872–772 SM), historically documented.' },

  // ── Taoism ──
  { stableKey: 'figure:laozi', name: 'Laozi', religionCode: 'TAOISM', roleCode: 'FOUNDER', certainty: 'PROVISIONAL', notes: 'Traditional author of Tao Te Ching, founder of Taoism.' },
  { stableKey: 'figure:zhuangzi', name: 'Zhuangzi', religionCode: 'TAOISM', roleCode: 'SAGE', certainty: 'ESTABLISHED', notes: 'Key Taoist philosopher, author of the Zhuangzi.' },

  // ── Confucianism ──
  { stableKey: 'figure:confucius', name: 'Confucius', religionCode: 'CONFUCIANISM', roleCode: 'FOUNDER', certainty: 'ESTABLISHED', notes: 'Chinese philosopher, founder of Confucianism (551–479 SM).' },
  { stableKey: 'figure:mencius', name: 'Mencius', religionCode: 'CONFUCIANISM', roleCode: 'SAGE', certainty: 'ESTABLISHED', notes: 'Most famous Confucian after Confucius himself (372–289 SM).' },
  { stableKey: 'figure:xunzi', name: 'Xunzi', religionCode: 'CONFUCIANISM', roleCode: 'SAGE', certainty: 'ESTABLISHED', notes: 'Influential Confucian philosopher (310–235 SM).' },

  // ── Shinto ──
  { stableKey: 'figure:amaterasu', name: 'Amaterasu', religionCode: 'SHINTO', roleCode: 'DEITY', certainty: 'ESTABLISHED', notes: 'Sun goddess, chief deity of Shinto and ancestor of the Imperial line.' },
  { stableKey: 'figure:susanoo', name: 'Susanoo', religionCode: 'SHINTO', roleCode: 'DEITY', certainty: 'ESTABLISHED', notes: 'Storm deity, brother of Amaterasu.' },
  { stableKey: 'figure:okuninushi', name: 'Okuninushi', religionCode: 'SHINTO', roleCode: 'DEITY', certainty: 'ESTABLISHED', notes: 'Deity of nation-building and medicine.' },

  // ── Zoroastrianism ──
  { stableKey: 'figure:zoroaster', name: 'Zoroaster', religionCode: 'ZOROASTRIANISM', roleCode: 'PROPHET', certainty: 'ESTABLISHED', notes: 'Founder of Zoroastrianism, composer of the Gathas.' },

  // ── Bahá'í ──
  { stableKey: 'figure:bahaullah', name: "Bahá'u'lláh", religionCode: 'BAHAI', roleCode: 'FOUNDER', certainty: 'ESTABLISHED', notes: "Founder of the Bahá'í Faith (1817–1892)." },
  { stableKey: 'figure:bab', name: 'The Báb', religionCode: 'BAHAI', roleCode: 'HERALD', certainty: 'ESTABLISHED', notes: "Herald and forerunner of Bahá'u'lláh (1819–1850)." },
  { stableKey: 'figure:abdulbaha', name: "'Abdu'l-Bahá", religionCode: 'BAHAI', roleCode: 'EXEMPLAR', certainty: 'ESTABLISHED', notes: "Son of Bahá'u'lláh, Center of the Covenant (1844–1921)." }
]
```

### 5E. Devotional Seeds (`wx.devotion`) — Multi-Religion

```typescript
const devotionSeeds = [
  // ── Islam ──
  { type: 'dhikr', title: 'Tasbih & Tahmid Harian', textOriginal: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ', textTransliteration: 'Subhanallahi wa bihamdihi, subhanallahil-azim', translationId: 'Maha Suci Allah dengan segala puji, Maha Suci Allah Yang Maha Agung.', translationEn: 'Glory be to Allah and His praise, glory be to Allah the Supreme.', category: 'Dzikir Pagi & Petang', source: 'HR. Bukhari & Muslim' },
  { type: 'dua', title: 'Doa Kebaikan Dunia & Akhirat', textOriginal: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', translationId: 'Ya Tuhan kami, berilah kami kebaikan di dunia dan akhirat, dan lindungilah kami dari azab neraka.', translationEn: 'Our Lord, give us good in this world and good in the Hereafter, and save us from the torment of the Fire.', category: 'Doa Universal', reference: 'QS 2:201' },
  { type: 'dhikr', title: 'Istighfar', textOriginal: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ', translationId: 'Aku memohon ampun kepada Allah Yang Maha Agung, tiada tuhan selain Dia, Yang Maha Hidup lagi Maha Berdiri Sendiri, dan aku bertaubat kepada-Nya.', translationEn: 'I seek forgiveness of Allah the Almighty, there is no deity except Him, the Ever-Living, the Self-Sustaining, and I repent to Him.', category: 'Dzikir Harian', source: 'HR. Abu Dawud & Tirmidhi' },
  { type: 'dua', title: 'Doa Sebelum Tidur', textOriginal: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', translationId: 'Dengan nama-Mu ya Allah, aku mati dan aku hidup.', translationEn: 'In Your name, O Allah, I die and I live.', category: 'Doa Tidur', source: 'HR. Bukhari' },
  { type: 'dua', title: 'Doa Setelah Adzan', textOriginal: 'اللَّهُمَّ رَبَّ هَٰذِهِ الدَّعْوَةِ التَّامَّةِ وَالصَّلَاةِ الْقَائِمَةِ آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ', translationId: 'Ya Allah, Tuhan pemilik seruan yang sempurna ini dan shalat yang akan didirikan, karuniakanlah kepada Muhammad wasilah dan keutamaan.', translationEn: 'O Allah, Lord of this perfect call and established prayer, grant Muhammad the intercession and virtue.', category: 'Doa Shalat', source: 'HR. Bukhari' },

  // ── Christianity ──
  { type: 'dua', title: 'The Lord\'s Prayer', textOriginal: 'Πάτερ ἡμῶν ὁ ἐν τοῖς οὐρανοῖς ἁγιασθήτω τὸ ὄνομά σου', textTransliteration: 'Pater hēmōn ho en tois ouranois hagiasthētō to onoma sou', translationId: 'Bapa kami yang di surga, dikuduskanlah nama-Mu.', translationEn: 'Our Father in heaven, hallowed be your name.', category: 'Doa Utama', reference: 'Matius 6:9-13' },
  { type: 'hymn', title: 'Gloria in Excelsis Deo', textOriginal: 'Gloria in excelsis Deo et in terra pax hominibus bonae voluntatis', translationId: 'Kemuliaan bagi Allah di tempat yang mahatinggi, dan damai sejahtera di bumi bagi orang yang berkenan.', translationEn: 'Glory to God in the highest, and on earth peace to people of good will.', category: 'Himne Liturgi', reference: 'Lukas 2:14' },
  { type: 'dua', title: 'Doa Serenity', textOriginal: null, translationId: 'Allah, berikan aku ketenangan untuk menerima hal-hal yang tidak bisa kuubah, keberanian untuk mengubah yang bisa kuubah, dan kebijaksanaan untuk mengetahui perbedaannya.', translationEn: 'God, grant me the serenity to accept the things I cannot change, courage to change the things I can, and wisdom to know the difference.', category: 'Doa Kontemplasi', source: 'Reinhold Niebuhr' },

  // ── Judaism ──
  { type: 'dua', title: 'Shema Yisrael', textOriginal: 'שְׁמַע יִשְׂרָאֵל יְהוָה אֱלֹהֵינוּ יְהוָה אֶחָד', textTransliteration: 'Shema Yisrael Adonai Eloheinu Adonai Echad', translationId: 'Dengarlah, hai Israel: Tuhan Allah kita, Tuhan itu esa.', translationEn: 'Hear, O Israel: the LORD our God, the LORD is one.', category: 'Doa Utama', reference: 'Ulangan 6:4' },
  { type: 'dua', title: 'Modeh Ani', textOriginal: 'מוֹדֶה אֲנִי לְפָנֶיךָ מֶלֶךְ חַי וְקַיָּם שֶׁהֶחֱזַרְתָּ בִּי נִשְׁמָתִי בְּחֶמְלָה', translationId: 'Aku bersyukur di hadapan-Mu, Raja yang hidup dan kekal, yang telah mengembalikan jiwaku dengan belas kasihan.', translationEn: 'I give thanks before You, living and eternal King, who has returned my soul with compassion.', category: 'Doa Pagi', source: 'Siddur' },

  // ── Buddhism ──
  { type: 'meditation', title: 'Tisarana — Tiga Perlindungan', textOriginal: 'Buddhaṃ saraṇaṃ gacchāmi. Dhammaṃ saraṇaṃ gacchāmi. Saṅghaṃ saraṇaṃ gacchāmi.', textTransliteration: 'Buddham saranam gacchami. Dhammam saranam gacchami. Sangham saranam gacchami.', translationId: 'Aku berlindung kepada Buddha. Aku berlindung kepada Dhamma. Aku berlindung kepada Sangha.', translationEn: 'I go for refuge in the Buddha. I go for refuge in the Dharma. I go for refuge in the Sangha.', category: 'Perlindungan', source: 'Khuddakapatha' },
  { type: 'meditation', title: 'Metta Sutta — Kasih Sayang Universal', textOriginal: 'Sabbe sattā bhavantu sukhitattā', translationId: 'Semoga semua makhluk berbahagia.', translationEn: 'May all beings be happy.', category: 'Meditasi Metta', reference: 'Sutta Nipata 1.8' },

  // ── Hinduism ──
  { type: 'meditation', title: 'Gayatri Mantra', textOriginal: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्', textTransliteration: 'Om bhur bhuvah svah tat savitur varenyam bhargo devasya dhimahi dhiyo yo nah prachodayat', translationId: 'Kami merenungkan kemuliaan Sang Pencipta alam semesta, semoga Ia menerangi pikiran kami.', translationEn: 'We meditate on the glory of the Creator of the universe; may He enlighten our minds.', category: 'Mantra Suci', reference: 'Rigveda 3.62.10' },
  { type: 'meditation', title: 'Mahamrityunjaya Mantra', textOriginal: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्', textTransliteration: 'Om tryambakam yajamahe sugandhim pushti-vardhanam', translationId: 'Kami menyembah Yang Bermata Tiga, Yang harum dan menumbuhkan kekuatan.', translationEn: 'We worship the three-eyed One, who is fragrant and nourishes all beings.', category: 'Mantra Penyembuhan', reference: 'Rigveda 7.59.12' },

  // ── Sikhism ──
  { type: 'dua', title: 'Mool Mantar', textOriginal: 'ੴ ਸਤਿ ਨਾਮੁ ਕਰਤਾ ਪੁਰਖੁ ਨਿਰਭਉ ਨਿਰਵੈਰੁ ਅਕਾਲ ਮੂਰਤਿ ਅਜੂਨੀ ਸੈਭੰ ਗੁਰ ਪ੍ਰਸਾਦਿ', textTransliteration: 'Ik Onkar Sat Nam Karta Purakh Nirbhau Nirvair Akal Murat Ajuni Saibhang Gur Prasad', translationId: 'Satu Tuhan Universal, Nama-Nya adalah Kebenaran, Pencipta, Tanpa takut, Tanpa dendam, Abadi, Tidak terlahir, Berdiri sendiri, Atas berkah Guru.', translationEn: 'One Universal Creator, Truth is the Name, Creative Being, Without Fear, Without Hatred, Timeless, Beyond Birth, Self-Existent, By Guru\'s Grace.', category: 'Mantra Utama', reference: 'Guru Granth Sahib, Ang 1' },

  // ── Taoism ──
  { type: 'meditation', title: 'Tao Te Ching — Bab 1', textOriginal: '道可道非常道名可名非常名', textTransliteration: 'Dao ke dao fei chang dao, ming ke ming fei chang ming', translationId: 'Tao yang dapat dikatakan bukanlah Tao yang abadi. Nama yang dapat disebutkan bukanlah nama yang abadi.', translationEn: 'The Tao that can be told is not the eternal Tao. The name that can be named is not the eternal name.', category: 'Kontemplasi', reference: 'Tao Te Ching 1' },

  // ── Confucianism ──
  { type: 'meditation', title: 'Ajaran Inti Confucius', textOriginal: '己所不欲勿施於人', textTransliteration: 'Ji suo bu yu, wu shi yu ren', translationId: 'Apa yang tidak kamu inginkan dilakukan terhadapmu, jangan lakukan terhadap orang lain.', translationEn: 'What you do not wish for yourself, do not do to others.', category: 'Golden Rule', reference: 'Analects 15:23' },

  // ── Zoroastrianism ──
  { type: 'dua', title: 'Ashem Vohu', textOriginal: 'Ašəm Vohū vahištəm astī', textTransliteration: 'Ashem Vohu vahishtem asti', translationId: 'Kebenaran adalah kebaikan tertinggi.', translationEn: 'Righteousness is the highest good.', category: 'Doa Utama', reference: 'Yasna 27.14' },

  // ── Bahá'í ──
  { type: 'dua', title: 'Doa Kesatuan', textOriginal: null, translationId: 'Ya Tuhanku! Ya Tuhanku! Satukanlah hati hamba-hamba-Mu, dan nyatakanlah kepada mereka rencana-Mu yang agung.', translationEn: 'O my God! O my God! Unite the hearts of Thy servants, and reveal to them Thy great purpose.', category: 'Doa Persatuan', source: "Bahá'u'lláh" },

  // ── Jainism ──
  { type: 'meditation', title: 'Namokar Mantra', textOriginal: 'णमो अरिहंताणं, णमो सिद्धाणं, णमो आयरियाणं, णमो उवज्झायाणं, णमो लोए सव्वसाहूणं', textTransliteration: 'Namo Arihantanam, Namo Siddhanam, Namo Ayariyanam, Namo Uvajjhayanam, Namo Loe Savva Sahunam', translationId: 'Hormat kepada para Arihanta, hormat kepada para Siddha, hormat kepada para Acharya, hormat kepada para Upadhyaya, hormat kepada semua sadhu di dunia.', translationEn: 'I bow to the Arihantas, I bow to the Siddhas, I bow to the Acharyas, I bow to the Upadhyayas, I bow to all Sadhus in the world.', category: 'Mantra Utama', source: 'Tradisi Jain' },

  // ── Shinto ──
  { type: 'ritual', title: 'Norito — Doa Pembersihan', textOriginal: '祓え給い清め給え', textTransliteration: 'Harae tamae kiyome tamae', translationId: 'Bersihkanlah dan sucikanlah.', translationEn: 'Purify and cleanse.', category: 'Doa Ritual', source: 'Tradisi Shinto' }
]
```

### 5F. Asmaul Husna — Complete 99

The corpus will provide all 99 names. The app currently only seeds 20. The model `wx.asmaul.husna` is ready — no changes needed. Replace the hardcoded 20-item array with the corpus-provided complete 99.

---

## 6. Model Status — No Changes Needed

All 51 `wx.*` models are ready for multi-religion corpus expansion:

| Need | Model | Status |
|---|---|---|
| Non-Abrahamic scriptures | `wx.scripture` with `type: 'additional'` or `'philosophy'` | ✅ Ready |
| Hadith matn/isnad separation | `wx.tradition.unit` with `unitType: 'REPORT'` | ✅ Ready |
| Multi-tradition figures | `wx.figure` + `wx.figure.role` per `religionId` | ✅ Ready |
| Figure names in multiple languages | `wx.figure.name` | ✅ Ready |
| Lexicon/morphology | `wx.lexeme` + `wx.root` + `wx.lexical.occurrence` | ✅ Ready |
| Divine expressions (Asmaul Husna etc) | `wx.divine.expression` + `wx.divine.expression.occurrence` | ✅ Ready |
| Multi-tradition devotional | `wx.devotion` with `type: dhikr/dua/hymn/meditation/ritual` | ✅ Ready |
| Transmission chains (sanad) | `wx.transmission.chain` + `wx.transmission.link` | ✅ Ready |
| Source provenance tracking | `wx.source` + `wx.provenance` + `wx.source.artifact` | ✅ Ready |

### `wx.scripture` Canonical Code Constraint

The `beforeSave` hook enforces:
- `canonicalCode` must be `QURAN`, `TAWRAT`, `ZABUR`, or `INJIL` for `type: 'canonical'` + `sourceClass: 'REVELATION'`
- Non-Abrahamic texts use `type: 'additional'` or `'philosophy'` with `sourceClass: 'TEXTUAL_WITNESS'`
- Set `canonicalCode` to `null` for non-Abrahamic scriptures

---

## 7. Priority Action Items for App

```text
Priority  Action                                                Effort
──────────────────────────────────────────────────────────────────────
🔴 HIGH   Fix wx.tradition slug bug in demo-data.ts            10 min
🔴 HIGH   Fix wx.source stableKey/sourceClass bug              10 min
🔴 HIGH   Expand scripture seeds to all 12 religions           1 hour
🟡 MED    Consolidate religion seeds (graph-core + demo)       30 min
🟡 MED    Add all 55+ figures across 12 religions              1 hour
🟡 MED    Add 25+ multi-religion devotional items              1 hour
🟡 MED    Add 15+ tradition collections (non-Islam)            1 hour
🟡 MED    Add corpus as dependency (submodule or npm)          1 hour
🟡 MED    Create seed/corpus-import.ts                         2 hours
🟢 LOW    Replace API fetch with corpus bundle read            2 hours
🟢 LOW    Complete Asmaul Husna to 99 via corpus bundle        30 min
```

Items marked 🔴 should be fixed first — they likely cause errors on fresh installs and block the multi-religion demo experience.

---

## 8. Checklist Summary

```text
[x] 12 religions defined and seeded
[ ] 15+ scriptures across all traditions (currently only Quran)
[ ] 55+ figures across all traditions (currently 26, missing some traditions)
[ ] 15+ tradition collections (currently only 3 Islamic)
[ ] 25+ devotional items multi-religion (currently only 2 Islamic)
[ ] 99 Asmaul Husna (currently 20)
[ ] 10+ sources per corpus dataset (currently 3)
[ ] Fix slug bug in wx.tradition
[ ] Fix stableKey bug in wx.source
[ ] Consolidate religion seeds
[ ] Replace API fetch with corpus bundle
```
