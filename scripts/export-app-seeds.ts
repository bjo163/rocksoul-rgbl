import fs from 'node:fs';
import path from 'node:path';

// Output directories for app seed bundles
const outputDir = path.resolve('dist/app-seeds');
fs.mkdirSync(outputDir, { recursive: true });

const mirrorDir = path.resolve('x:/REPO/moonwitness/packages/moon-witness/src/seed/data');
try { fs.mkdirSync(mirrorDir, { recursive: true }); } catch (e) {}

function writeSeed(fileName: string, data: any) {
  const jsonStr = JSON.stringify(data, null, 2);
  fs.writeFileSync(path.join(outputDir, fileName), jsonStr);
  if (fs.existsSync(mirrorDir)) {
    try {
      fs.writeFileSync(path.join(mirrorDir, fileName), jsonStr);
    } catch (e) {}
  }
}

console.log('--- MoonWitness Corpus: Exporting App Seed Bundles ---');

// 1. Export 12 Traditions
const traditions = [
  { slug: 'islam', name: 'Islam', description: 'Islamic tradition based on the Holy Quran and authentic Sunnah.', traditionFamily: 'Abrahamic', isMajor: true },
  { slug: 'christianity', name: 'Christianity', description: 'Christian tradition centered on the life and teachings of Jesus Christ and the Holy Bible.', traditionFamily: 'Abrahamic', isMajor: true },
  { slug: 'judaism', name: 'Judaism', description: 'Jewish tradition centered on the Tanakh (Hebrew Bible) and Rabbinic ethical-legal tradition.', traditionFamily: 'Abrahamic', isMajor: true },
  { slug: 'hinduism', name: 'Hinduism', description: 'Sanatana Dharma traditions based on the Vedas, Upanishads, and the Bhagavad Gita.', traditionFamily: 'Dharmic', isMajor: true },
  { slug: 'buddhism', name: 'Buddhism', description: 'Buddhist tradition based on the Teachings of Gautama Buddha preserved in the Pali Canon.', traditionFamily: 'Dharmic', isMajor: true },
  { slug: 'sikhism', name: 'Sikhism', description: 'Sikh tradition founded by Guru Nanak Dev Ji centered on the Guru Granth Sahib.', traditionFamily: 'Dharmic', isMajor: true },
  { slug: 'jainism', name: 'Jainism', description: 'Jain tradition of non-violence (Ahimsa) and truth based on the Tirthankaras and Agamas.', traditionFamily: 'Dharmic', isMajor: false },
  { slug: 'taoism', name: 'Taoism', description: 'Philosophical and spiritual tradition centered on living in harmony with the Tao (Tao Te Ching).', traditionFamily: 'East Asian', isMajor: false },
  { slug: 'confucianism', name: 'Confucianism', description: 'Ethical and philosophical tradition centered on benevolence (Ren) and ritual propriety (Li).', traditionFamily: 'East Asian', isMajor: false },
  { slug: 'shinto', name: 'Shinto', description: 'Indigenous spiritual tradition of Japan centered on reverence for the Kami and nature.', traditionFamily: 'East Asian', isMajor: false },
  { slug: 'zoroastrianism', name: 'Zoroastrianism', description: 'Ancient monotheistic tradition founded by Zarathustra centered on the Avesta and Gathas.', traditionFamily: 'Persian', isMajor: false },
  { slug: 'bahai', name: "Bahá'í Faith", description: 'Global monotheistic faith emphasizing the spiritual unity of all humankind and progressive revelation.', traditionFamily: 'Abrahamic', isMajor: false }
];
writeSeed('traditions.json', traditions);
console.log(`✓ Exported ${traditions.length} traditions -> traditions.json`);

// 2. Export Asmaul Husna
const asmaulHusnaPath = path.resolve('datasets/asmaul-husna-99/data/core/resources/asmaul-husna-99.jsonl');
if (fs.existsSync(asmaulHusnaPath)) {
  const lines = fs.readFileSync(asmaulHusnaPath, 'utf-8').trim().split('\n');
  const asmaulList: Array<{
    number: number;
    nameArabic: string;
    nameLatin: string;
    translationId: string;
    translationEn: string;
    meaning: string;
    quranReference: string;
  }> = [];
  lines.forEach(l => {
    try {
      const o = JSON.parse(l);
      if (o.kind === 'devotional.divine_name') {
        const ext = o.extensions?.asmaul_husna || o.extensions?.devotional || {};
        asmaulList.push({
          number: ext.number,
          nameArabic: ext.nameArabic,
          nameLatin: ext.nameLatin,
          translationId: ext.translationId,
          translationEn: ext.translationEn,
          meaning: ext.meaning,
          quranReference: ext.quranReference
        });
      }
    } catch (e) {}
  });
  asmaulList.sort((a, b) => a.number - b.number);
  writeSeed('asmaul-husna.json', asmaulList);
  console.log(`✓ Exported ${asmaulList.length} Asmaul Husna -> asmaul-husna.json`);
}

// 3. Export Authentic Islamic Duas
const duasRawPath = path.resolve('datasets/islamic-duas-raw.json');
if (fs.existsSync(duasRawPath)) {
  const duas = JSON.parse(fs.readFileSync(duasRawPath, 'utf-8'));
  writeSeed('islamic-duas.json', duas);
  console.log(`✓ Exported ${duas.length} Authentic Duas -> islamic-duas.json`);
}

// 4. Export Hadith Nawawi 40
const nawawiPath = path.resolve('datasets/hadith-nawawi-40/data/core/resources/hadith-nawawi-40.jsonl');
if (fs.existsSync(nawawiPath)) {
  const lines = fs.readFileSync(nawawiPath, 'utf-8').trim().split('\n');
  const nawawiList: Record<number, { number: number; title: string; arabic: string; english: string; indonesian: string }> = {};
  
  lines.forEach(l => {
    try {
      const o = JSON.parse(l);
      if (o.kind === 'textual.passage') {
        const seq = o.extensions?.textual?.sequence;
        if (!nawawiList[seq]) nawawiList[seq] = { number: seq, title: '', arabic: '', english: '', indonesian: '' };
        nawawiList[seq].title = o.labels?.[0]?.value || '';
      } else if (o.kind === 'textual.content') {
        const target = o.extensions?.textual?.target || '';
        const match = target.match(/nawawi-40:(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          if (!nawawiList[num]) nawawiList[num] = { number: num, title: '', arabic: '', english: '', indonesian: '' };
          const lang = o.extensions?.textual?.language;
          if (lang === 'ar') nawawiList[num].arabic = o.extensions?.textual?.text || '';
          if (lang === 'en') nawawiList[num].english = o.extensions?.textual?.text || '';
          if (lang === 'id') nawawiList[num].indonesian = o.extensions?.textual?.text || '';
        }
      }
    } catch (e) {}
  });

  const nawawiArr = Object.values(nawawiList).sort((a, b) => a.number - b.number);
  writeSeed('hadith-nawawi-40.json', nawawiArr);
  console.log(`✓ Exported ${nawawiArr.length} Hadith Nawawi -> hadith-nawawi-40.json`);
}

// 5. Export Devotional Baseline (12 Religions)
const devPath = path.resolve('datasets/devotional-baseline/data/core/resources/devotional-baseline.jsonl');
if (fs.existsSync(devPath)) {
  const lines = fs.readFileSync(devPath, 'utf-8').trim().split('\n');
  const devItems: Record<string, { id: string; tradition: string; title: string; source: string; english: string; indonesian: string }> = {};

  lines.forEach(l => {
    try {
      const o = JSON.parse(l);
      if (o.kind === 'textual.passage') {
        const id = o.id;
        const trad = o.extensions?.devotional?.community_scope?.replace('mw:tradition:', '') || '';
        if (!devItems[id]) devItems[id] = { id, tradition: trad, title: o.labels?.[0]?.value || '', source: '', english: '', indonesian: '' };
        devItems[id].title = o.labels?.[0]?.value || '';
        devItems[id].tradition = trad;
      } else if (o.kind === 'textual.content') {
        const target = o.extensions?.textual?.target || '';
        if (target) {
          if (!devItems[target]) devItems[target] = { id: target, tradition: '', title: '', source: '', english: '', indonesian: '' };
          const rep = o.extensions?.textual?.representation;
          const lang = o.extensions?.textual?.language;
          if (rep === 'source') devItems[target].source = o.extensions?.textual?.text || '';
          if (lang === 'en') devItems[target].english = o.extensions?.textual?.text || '';
          if (lang === 'id') devItems[target].indonesian = o.extensions?.textual?.text || '';
        }
      }
    } catch (e) {}
  });

  const devArr = Object.values(devItems);
  writeSeed('devotional-all-religions.json', devArr);
  console.log(`✓ Exported ${devArr.length} Devotional items across 12 religions -> devotional-all-religions.json`);
}

// 6. Export Bhagavad Gita (700 Verses)
const gitaPath = path.resolve('datasets/bhagavad-gita/data/core/resources/bhagavad-gita.jsonl');
if (fs.existsSync(gitaPath)) {
  const lines = fs.readFileSync(gitaPath, 'utf-8').trim().split('\n');
  const gitaList: Record<string, { chapter: number; verse: number; sanskrit: string; transliteration: string; english: string }> = {};

  lines.forEach(l => {
    try {
      const o = JSON.parse(l);
      if (o.kind === 'textual.passage') {
        const pathArr = o.extensions?.textual?.citation_path || [];
        const ch = parseInt(pathArr[0]);
        const vs = parseInt(pathArr[1]);
        const key = `${ch}:${vs}`;
        if (!gitaList[key]) gitaList[key] = { chapter: ch, verse: vs, sanskrit: '', transliteration: '', english: '' };
      } else if (o.kind === 'textual.content') {
        const target = o.extensions?.textual?.target || '';
        const match = target.match(/bhagavad-gita:(\d+):(\d+)/);
        if (match) {
          const ch = parseInt(match[1]);
          const vs = parseInt(match[2]);
          const key = `${ch}:${vs}`;
          if (!gitaList[key]) gitaList[key] = { chapter: ch, verse: vs, sanskrit: '', transliteration: '', english: '' };
          const rep = o.extensions?.textual?.representation;
          const lang = o.extensions?.textual?.language;
          if (lang === 'sa' && rep === 'source') gitaList[key].sanskrit = o.extensions?.textual?.text || '';
          if (lang === 'en') gitaList[key].english = o.extensions?.textual?.text || '';
          if (rep === 'transliteration') gitaList[key].transliteration = o.extensions?.textual?.text || '';
        }
      }
    } catch (e) {}
  });

  const gitaArr = Object.values(gitaList).sort((a, b) => a.chapter !== b.chapter ? a.chapter - b.chapter : a.verse - b.verse);
  writeSeed('bhagavad-gita.json', gitaArr);
  console.log(`✓ Exported ${gitaArr.length} Bhagavad Gita verses -> bhagavad-gita.json`);
}

// 7. Export Tao Te Ching (81 Chapters)
const ttcPath = path.resolve('datasets/tao-te-ching/data/core/resources/tao-te-ching.jsonl');
if (fs.existsSync(ttcPath)) {
  const lines = fs.readFileSync(ttcPath, 'utf-8').trim().split('\n');
  const ttcList: Record<number, { chapter: number; title: string; chinese: string; english: string }> = {};

  lines.forEach(l => {
    try {
      const o = JSON.parse(l);
      if (o.kind === 'textual.passage') {
        const seq = o.extensions?.textual?.sequence;
        if (!ttcList[seq]) ttcList[seq] = { chapter: seq, title: o.labels?.[0]?.value || '', chinese: '', english: '' };
        ttcList[seq].title = o.labels?.[0]?.value || '';
      } else if (o.kind === 'textual.content') {
        const target = o.extensions?.textual?.target || '';
        const match = target.match(/tao-te-ching:(\d+)/);
        if (match) {
          const ch = parseInt(match[1]);
          if (!ttcList[ch]) ttcList[ch] = { chapter: ch, title: '', chinese: '', english: '' };
          const lang = o.extensions?.textual?.language;
          if (lang === 'lzh') ttcList[ch].chinese = o.extensions?.textual?.text || '';
          if (lang === 'en') ttcList[ch].english = o.extensions?.textual?.text || '';
        }
      }
    } catch (e) {}
  });

  const ttcArr = Object.values(ttcList).sort((a, b) => a.chapter - b.chapter);
  writeSeed('tao-te-ching.json', ttcArr);
  console.log(`✓ Exported ${ttcArr.length} Tao Te Ching chapters -> tao-te-ching.json`);
}

// 8. Export Analects of Confucius (20 Books / 512 Chapters)
const analectsPath = path.resolve('datasets/analects-confucius/data/core/resources/analects-confucius.jsonl');
if (fs.existsSync(analectsPath)) {
  const lines = fs.readFileSync(analectsPath, 'utf-8').trim().split('\n');
  const analectsList: Record<string, { book: number; chapter: number; title: string; chinese: string }> = {};

  lines.forEach(l => {
    try {
      const o = JSON.parse(l);
      if (o.kind === 'textual.passage') {
        const pathArr = o.extensions?.textual?.citation_path || [];
        const bk = parseInt(pathArr[0]);
        const ch = parseInt(pathArr[1]);
        const key = `${bk}:${ch}`;
        if (!analectsList[key]) analectsList[key] = { book: bk, chapter: ch, title: o.labels?.[0]?.value || '', chinese: '' };
      } else if (o.kind === 'textual.content') {
        const target = o.extensions?.textual?.target || '';
        const match = target.match(/analects:(\d+):(\d+)/);
        if (match) {
          const bk = parseInt(match[1]);
          const ch = parseInt(match[2]);
          const key = `${bk}:${ch}`;
          if (!analectsList[key]) analectsList[key] = { book: bk, chapter: ch, title: '', chinese: '' };
          analectsList[key].chinese = o.extensions?.textual?.text || '';
        }
      }
    } catch (e) {}
  });

  const analectsArr = Object.values(analectsList).sort((a, b) => a.book !== b.book ? a.book - b.book : a.chapter - b.chapter);
  writeSeed('analects-confucius.json', analectsArr);
  console.log(`✓ Exported ${analectsArr.length} Analects chapters/sayings -> analects-confucius.json`);
}

// 9. Export Yoga Sutras of Patanjali (195 Sutras)
const yogaPath = path.resolve('datasets/yoga-sutras/data/core/resources/yoga-sutras.jsonl');
if (fs.existsSync(yogaPath)) {
  const lines = fs.readFileSync(yogaPath, 'utf-8').trim().split('\n');
  const yogaList: Record<string, { pada: number; sutra: number; title: string; sanskrit: string; transliteration: string; english: string }> = {};

  lines.forEach(l => {
    try {
      const o = JSON.parse(l);
      if (o.kind === 'textual.passage') {
        const pathArr = o.extensions?.textual?.citation_path || [];
        const p = parseInt(pathArr[0]);
        const s = parseInt(pathArr[1]);
        const key = `${p}:${s}`;
        if (!yogaList[key]) yogaList[key] = { pada: p, sutra: s, title: o.labels?.[0]?.value || '', sanskrit: '', transliteration: '', english: '' };
        yogaList[key].title = o.labels?.[0]?.value || '';
      } else if (o.kind === 'textual.content') {
        const target = o.extensions?.textual?.target || '';
        const match = target.match(/yoga-sutras:(\d+):(\d+)/);
        if (match) {
          const p = parseInt(match[1]);
          const s = parseInt(match[2]);
          const key = `${p}:${s}`;
          if (!yogaList[key]) yogaList[key] = { pada: p, sutra: s, title: '', sanskrit: '', transliteration: '', english: '' };
          const rep = o.extensions?.textual?.representation;
          const lang = o.extensions?.textual?.language;
          if (lang === 'sa' && rep === 'source') yogaList[key].sanskrit = o.extensions?.textual?.text || '';
          if (lang === 'en') yogaList[key].english = o.extensions?.textual?.text || '';
          if (rep === 'transliteration') yogaList[key].transliteration = o.extensions?.textual?.text || '';
        }
      }
    } catch (e) {}
  });

  const yogaArr = Object.values(yogaList).sort((a, b) => a.pada !== b.pada ? a.pada - b.pada : a.sutra - b.sutra);
  writeSeed('yoga-sutras.json', yogaArr);
  console.log(`✓ Exported ${yogaArr.length} Yoga Sutras -> yoga-sutras.json`);
}

// 10. Export Gathas of Zarathustra (17 Hymns)
const gathasPath = path.resolve('datasets/gathas-zarathustra/data/core/resources/gathas-zarathustra.jsonl');
if (fs.existsSync(gathasPath)) {
  const lines = fs.readFileSync(gathasPath, 'utf-8').trim().split('\n');
  const gathasList: Record<number, { yasna: number; title: string; avestan: string; english: string; indonesian: string }> = {};

  lines.forEach(l => {
    try {
      const o = JSON.parse(l);
      if (o.kind === 'textual.passage') {
        const seq = o.extensions?.textual?.sequence;
        if (!gathasList[seq]) gathasList[seq] = { yasna: seq, title: o.labels?.[0]?.value || '', avestan: '', english: '', indonesian: '' };
        gathasList[seq].title = o.labels?.[0]?.value || '';
      } else if (o.kind === 'textual.content') {
        const target = o.extensions?.textual?.target || '';
        const match = target.match(/gathas:(\d+)/);
        if (match) {
          const y = parseInt(match[1]);
          if (!gathasList[y]) gathasList[y] = { yasna: y, title: '', avestan: '', english: '', indonesian: '' };
          const lang = o.extensions?.textual?.language;
          if (lang === 'ae') gathasList[y].avestan = o.extensions?.textual?.text || '';
          if (lang === 'en') gathasList[y].english = o.extensions?.textual?.text || '';
          if (lang === 'id') gathasList[y].indonesian = o.extensions?.textual?.text || '';
        }
      }
    } catch (e) {}
  });

  const gathasArr = Object.values(gathasList).sort((a, b) => a.yasna - b.yasna);
  writeSeed('gathas-zarathustra.json', gathasArr);
  console.log(`✓ Exported ${gathasArr.length} Gatha Hymns -> gathas-zarathustra.json`);
}

console.log('\n--- All Seed Bundles Exported Successfully to dist/app-seeds/ and moonwitness/seed/data/ ---');
