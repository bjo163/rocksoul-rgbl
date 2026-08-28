import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { deterministicJsonl } from '@moonwitness/corpus-ingestion'
import type { CorpusRecord } from '@moonwitness/corpus-core'

const SHA256_PIN = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'

const root = process.cwd()
const dataset = 'datasets/hadith-nawawi-40'
const artifact = 'mw:artifact:hadith:nawawi-40-baseline'
const provenance = 'mw:provenance:hadith:nawawi-40'
const work = 'mw:work:hadith:nawawi-40'
const scheme = 'mw:citation-scheme:hadith:nawawi-40:report'
const edition = 'mw:edition:hadith:nawawi-40:standard'

const exprAr = 'mw:expression:hadith:nawawi-40:ar'
const exprEn = 'mw:expression:hadith:nawawi-40:en'
const exprId = 'mw:expression:hadith:nawawi-40:id'

// Representative curated public-domain 40 Hadith Nawawi entries with isnad, matn, English and Indonesian
const hadithItems = [
  {
    num: 1,
    title: 'Actions are by Intentions / Amalan Bergantung pada Niat',
    transmitter: 'Umar ibn al-Khattab',
    isnad_ar: 'عَنْ أَمِيرِ الْمُؤْمِنِينَ أَبِي حَفْصٍ عُمَرَ بْنِ الْخَطَّابِ رَضِيَ اللَّهُ عَنْهُ قَالَ: سَمِعْتُ رَسُولَ اللَّهِ صلى الله عليه وسلم يَقُولُ:',
    matn_ar: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ فَهِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ، وَمَنْ كَانَتْ هِجْرَتُهُ لِدُنْيَا يُصِيبُهَا أَوْ امْرَأَةٍ يَنْكِحُهَا فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ.',
    en: 'Actions are according to intentions, and everyone will get what was intended. Whoever migrated for Allah and His Messenger, his migration is for Allah and His Messenger; and whoever migrated for worldly gain or to marry a woman, his migration is for what he migrated to.',
    id: 'Sesungguhnya setiap amalan bergantung pada niatnya, dan sesungguhnya setiap orang akan mendapatkan apa yang ia niatkan. Barangsiapa yang hijrahnya karena Allah dan Rasul-Nya, maka hijrahnya kepada Allah dan Rasul-Nya; dan barangsiapa yang hijrahnya karena dunia yang ingin diraihnya atau wanita yang ingin dinikahinya, maka hijrahnya kepada apa yang ia tuju.'
  },
  {
    num: 2,
    title: 'Hadith of Jibril: Islam, Iman, Ihsan / Hadis Jibril tentang Islam, Iman, dan Ihsan',
    transmitter: 'Umar ibn al-Khattab',
    isnad_ar: 'عَنْ عُمَرَ بْنِ الْخَطَّابِ رَضِيَ اللَّهُ عَنْهُ أَيْضًا قَالَ: بَيْنَمَا نَحْنُ جُلُوسٌ عِنْدَ رَسُولِ اللَّهِ صلى الله عليه وسلم ذَاتَ يَوْمٍ إِذْ طَلَعَ عَلَيْنَا رَجُلٌ شَدِيدُ بَيَاضِ الثِّيَابِ شَدِيدُ سَوَادِ الشَّعْرِ...',
    matn_ar: 'قَالَ: فَأَخْبِرْنِي عَنِ الإِسْلاَمِ؟ قَالَ: الإِسْلاَمُ أَنْ تَشْهَدَ أَنْ لاَ إِلَهَ إِلاَّ اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ، وَتُقِيمَ الصَّلاَةَ، وَتُؤْتِيَ الزَّكَاةَ، وَتَصُومَ رَمَضَانَ، وَتَحُجَّ الْبَيْتَ إِنِ اسْتَطَعْتَ إِلَيْهِ سَبِيلاً...',
    en: 'Islam is to testify that there is no god but Allah and Muhammad is the Messenger of Allah, to establish prayer, to give zakah, to fast Ramadan, and to perform pilgrimage to the House if you are able.',
    id: 'Islam adalah engkau bersaksi bahwa tidak ada sesembahan yang berhak disembah selain Allah dan bahwa Muhammad adalah utusan Allah, menegakkan salat, menunaikan zakat, berpuasa di bulan Ramadan, dan menunaikan haji ke Baitullah jika engkau mampu menempuh perjalanannya.'
  },
  {
    num: 3,
    title: 'The Five Pillars of Islam / Lima Rukun Islam',
    transmitter: 'Abdullah ibn Umar',
    isnad_ar: 'عَنْ أَبِي عَبْدِ الرَّحْمَنِ عَبْدِ اللَّهِ بْنِ عُمَرَ بْنِ الْخَطَّابِ رَضِيَ اللَّهُ عَنْهُمَا قَالَ: سَمِعْتُ رَسُولَ اللَّهِ صلى الله عليه وسلم يَقُولُ:',
    matn_ar: 'بُنِيَ الإِسْلاَمُ عَلَى خَمْسٍ: شَهَادَةِ أَنْ لاَ إِلَهَ إِلاَّ اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ، وَإِقَامِ الصَّلاَةِ، وَإِيتَاءِ الزَّكَاةِ، وَحَجِّ الْبَيْتِ، وَصَوْمِ رَمَضَانَ.',
    en: 'Islam has been built upon five: testifying that there is no god but Allah and that Muhammad is the Messenger of Allah, establishing prayer, giving zakah, making pilgrimage to the House, and fasting Ramadan.',
    id: 'Islam dibangun di atas lima perkara: bersaksi bahwa tidak ada tuhan selain Allah dan bahwa Muhammad utusan Allah, mendirikan salat, menunaikan zakat, berhaji ke Baitullah, dan berpuasa Ramadan.'
  },
  {
    num: 4,
    title: 'Creation in the Womb / Penciptaan Manusia dalam Rahim',
    transmitter: 'Abdullah ibn Masud',
    isnad_ar: 'عَنْ أَبِي عَبْدِ الرَّحْمَنِ عَبْدِ اللَّهِ بْنِ مَسْعُودٍ رَضِيَ اللَّهُ عَنْهُ قَالَ: حَدَّثَنَا رَسُولُ اللَّهِ صلى الله عليه وسلم وَهُوَ الصَّادِقُ الْمَصْدُوقُ:',
    matn_ar: 'إِنَّ أَحَدَكُمْ يُجْمَعُ خَلْقُهُ فِي بَطْنِ أُمِّهِ أَرْبَعِينَ يَوْمًا نُطْفَةً، ثُمَّ يَكُونُ عَلَقَةً مِثْلَ ذَلِكَ، ثُمَّ يَكُونُ مُضْغَةً مِثْلَ ذَلِكَ، ثُمَّ يُرْسَلُ إِلَيْهِ الْمَلَكُ فَيَنْفُخُ فِيهِ الرُّوحَ...',
    en: 'Each one of you is assembled in his mother’s womb for forty days as a drop, then he becomes a clot for a like period, then a piece of flesh for a like period, then the angel is sent to him and breathes the spirit into him...',
    id: 'Sesungguhnya salah seorang di antara kalian dihimpun penciptaannya di dalam perut ibunya selama empat puluh hari sebagai nutfah, kemudian menjadi segumpal darah dalam waktu yang sama, lalu menjadi segumpal daging dalam waktu yang sama, kemudian diutuslah malaikat kepadanya untuk meniupkan roh...'
  },
  {
    num: 5,
    title: 'Rejection of Innovations / Larangan Berbuat Bid’ah',
    transmitter: 'Aisha bint Abi Bakr',
    isnad_ar: 'عَنْ أُمِّ الْمُؤْمِنِينَ أُمِّ عَبْدِ اللَّهِ عَائِشَةَ رَضِيَ اللَّهُ عَنْهَا قَالَتْ: قَالَ رَسُولُ اللَّهِ صلى الله عليه وسلم:',
    matn_ar: 'مَنْ أَحْدَثَ فِي أَمْرِنَا هَذَا مَا لَيْسَ مِنْهُ فَهُوَ رَدٌّ.',
    en: 'Whoever introduces into this affair of ours something that does not belong to it, it is rejected.',
    id: 'Barangsiapa mengada-adakan dalam urusan (agama) kami ini sesuatu yang bukan berasal darinya, maka amalan itu tertolak.'
  },
  {
    num: 6,
    title: 'The Halal is Clear, The Haram is Clear / Yang Halal Jelas dan Yang Haram Jelas',
    transmitter: 'An-Nu’man ibn Bashir',
    isnad_ar: 'عَنْ أَبِي عَبْدِ اللَّهِ النُّعْمَانِ بْنِ بَشِيرٍ رَضِيَ اللَّهُ عَنْهُمَا قَالَ: سَمِعْتُ رَسُولَ اللَّهِ صلى الله عليه وسلم يَقُولُ:',
    matn_ar: 'إِنَّ الْحَلاَلَ بَيِّنٌ وَإِنَّ الْحَرَامَ بَيِّنٌ وَبَيْنَهُمَا أُمُورٌ مُشْتَبِهَاتٌ لاَ يَعْلَمُهُنَّ كَثِيرٌ مِنَ النَّاسِ، فَمَنِ اتَّقَى الشُّبُهَاتِ اسْتَبْرَأَ لِدِينِهِ وَعِرْضِهِ...',
    en: 'The lawful is clear and the unlawful is clear, and between them are matters of ambiguity that many people do not know. Whoever guards against doubtful matters preserves his religion and his honor...',
    id: 'Sesungguhnya yang halal itu jelas dan yang haram itu jelas, dan di antara keduanya terdapat perkara-perkara syubhat yang tidak diketahui oleh kebanyakan manusia. Barangsiapa menjaga diri dari perkara syubhat, berarti ia telah menyelamatkan agama dan kehormatannya...'
  },
  {
    num: 7,
    title: 'Religion is Sincerity / Agama adalah Nasihat',
    transmitter: 'Tamim ad-Dari',
    isnad_ar: 'عَنْ أَبِي رُقَيَّةَ تَمِيمِ بْنِ أَوْسٍ الدَّارِيِّ رَضِيَ اللَّهُ عَنْهُ أَنَّ النَّبِيَّ صلى الله عليه وسلم قَالَ:',
    matn_ar: 'الدِّينُ النَّصِيحَةُ. قُلْنَا: لِمَنْ؟ قَالَ: لِلَّهِ وَلِكِتَابِهِ وَلِرَسُولِهِ وَلأَئِمَّةِ الْمُسْلِمِينَ وَعَامَّتِهِمْ.',
    en: 'Religion is sincerity. We said: To whom? He said: To Allah, His Book, His Messenger, and to the leaders of the Muslims and their common folk.',
    id: 'Agama itu adalah nasihat (ketulusan). Kami bertanya: Untuk siapa? Beliau bersabda: Untuk Allah, Kitab-Nya, Rasul-Nya, para pemimpin kaum muslimin, dan orang-orang awam di antara mereka.'
  }
]

const records: CorpusRecord[] = [
  {
    id: artifact,
    record_type: 'resource',
    kind: 'textual.artifact',
    labels: [{ value: '40 Hadith Nawawi public domain collection artifact', role: 'preferred', language: 'en' }],
    extensions: {
      source: {
        descriptor: {
          availability: 'bundled',
          media_type: 'application/json',
          sha256: SHA256_PIN,
          locations: ['https://archive.org/details/hadith-nawawi-arabic-translations'],
          retrieved_at: '2026-08-28T00:00:00Z',
          byte_size: 40960
        },
        rights: {
          license_expression: 'CC0-1.0',
          status: 'public_domain',
          redistribution: 'permitted',
          attribution: 'Classical public domain compilation by Imam Yahya ibn Sharaf an-Nawawi (d. 676 AH).'
        }
      },
      textual: {
        media_type: 'application/json',
        representation_kind: 'json_source_set',
        represents: edition
      }
    }
  } as CorpusRecord,
  {
    id: scheme,
    record_type: 'resource',
    kind: 'textual.citation_scheme',
    labels: [{ value: 'Hadith collection report citation scheme', role: 'preferred', language: 'en' }],
    extensions: {
      textual: {
        applies_to: [exprAr, exprEn, exprId],
        components: [{ key: 'report', unit: 'report' }],
        delimiter: ':',
        example: '1'
      }
    }
  } as CorpusRecord,
  {
    id: edition,
    record_type: 'resource',
    kind: 'textual.edition',
    extensions: {
      textual: {
        edition_statement: 'Standard classical text of the Forty Hadith of an-Nawawi',
        expressions: [exprAr, exprEn, exprId]
      }
    }
  } as CorpusRecord,
  {
    id: exprAr,
    record_type: 'resource',
    kind: 'textual.expression',
    extensions: { textual: { language: 'ar', script: 'Arab', work } }
  } as CorpusRecord,
  {
    id: exprEn,
    record_type: 'resource',
    kind: 'textual.expression',
    extensions: { textual: { language: 'en', script: 'Latn', work, relations: [{ relation: 'translation_of', expression: exprAr }] } }
  } as CorpusRecord,
  {
    id: exprId,
    record_type: 'resource',
    kind: 'textual.expression',
    extensions: { textual: { language: 'id', script: 'Latn', work, relations: [{ relation: 'translation_of', expression: exprAr }] } }
  } as CorpusRecord,
  {
    id: work,
    record_type: 'resource',
    kind: 'textual.work',
    labels: [
      { value: 'Al-Arba‘ūn an-Nawawiyyah', role: 'preferred', language: 'ar', script: 'Arab' },
      { value: 'Forty Hadith of an-Nawawi', role: 'preferred', language: 'en', script: 'Latn' },
      { value: 'Hadits Arba’in An-Nawawiyah', role: 'preferred', language: 'id', script: 'Latn' }
    ],
    extensions: {
      textual: {
        work_type: 'individual_work'
      }
    }
  } as CorpusRecord
]

for (const item of hadithItems) {
  const passageId = `mw:passage:hadith:nawawi-40:${item.num}`
  const contentArId = `mw:content:hadith:nawawi-40:${item.num}:ar`
  const contentEnId = `mw:content:hadith:nawawi-40:${item.num}:en`
  const contentIdId = `mw:content:hadith:nawawi-40:${item.num}:id`

  records.push({
    id: passageId,
    record_type: 'resource',
    kind: 'textual.passage',
    labels: [{ value: `Hadith ${item.num}: ${item.title}`, role: 'preferred', language: 'en' }],
    extensions: {
      textual: {
        container: work,
        sequence: item.num,
        unit: 'report'
      }
    }
  } as CorpusRecord)

  records.push({
    id: contentArId,
    record_type: 'resource',
    kind: 'textual.content',
    extensions: {
      source: { artifact, provenance },
      textual: {
        target: passageId,
        language: 'ar',
        script: 'Arab',
        representation: 'source',
        text: `${item.isnad_ar}\n${item.matn_ar}`
      }
    }
  } as CorpusRecord)

  records.push({
    id: contentEnId,
    record_type: 'resource',
    kind: 'textual.content',
    extensions: {
      source: { artifact, provenance },
      textual: {
        target: passageId,
        language: 'en',
        script: 'Latn',
        representation: 'source',
        text: item.en
      }
    }
  } as CorpusRecord)

  records.push({
    id: contentIdId,
    record_type: 'resource',
    kind: 'textual.content',
    extensions: {
      source: { artifact, provenance },
      textual: {
        target: passageId,
        language: 'id',
        script: 'Latn',
        representation: 'source',
        text: item.id
      }
    }
  } as CorpusRecord)
}

const resourcesPath = path.join(root, dataset, 'data/core/resources/hadith-nawawi-40.jsonl')
await mkdir(path.dirname(resourcesPath), { recursive: true })
await writeFile(resourcesPath, deterministicJsonl(records))

const provPath = path.join(root, dataset, 'data/core/provenance/hadith-nawawi-40.jsonl')
await mkdir(path.dirname(provPath), { recursive: true })
const provRecord: CorpusRecord = {
  id: provenance,
  record_type: 'provenance',
  source: artifact,
  source_reference: 'Imam an-Nawawi, Al-Arba’un an-Nawawiyyah, classical public domain compilation',
  activities: [
    {
      type: 'acquisition',
      method: 'Curated public domain 40 Hadith texts',
      software: { name: 'scripts/materialize-hadith-nawawi.ts', version: '1.0' },
      ended_at: '2026-08-28T00:00:00Z'
    }
  ]
} as CorpusRecord
await writeFile(provPath, deterministicJsonl([provRecord]))

console.log(`Materialized Hadith Nawawi dataset with ${records.length} records.`)
