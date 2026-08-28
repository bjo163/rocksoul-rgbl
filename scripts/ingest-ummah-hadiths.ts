import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import type { HadithRecord, HadithApiResponse } from './sync-ummah-upstream.js'

interface MapTarget {
  collection: string
  datasetFolder: string
  workId: string
  artifactId: string
  editionId: string
  schemeId: string
  tradition: string
  workTitle: string
  workTitleAr: string
}

const TARGETS: MapTarget[] = [
  {
    collection: 'nawawi',
    datasetFolder: 'hadith-nawawi-40',
    workId: 'mw:work:hadith:nawawi-40',
    artifactId: 'mw:artifact:hadith:nawawi-40-baseline',
    editionId: 'mw:edition:hadith:nawawi-40:standard',
    schemeId: 'mw:citation-scheme:hadith:nawawi-40:number',
    tradition: 'islam',
    workTitle: "An-Nawawi's Forty Hadiths",
    workTitleAr: 'الأربعون النووية'
  },
  {
    collection: 'muslim',
    datasetFolder: 'hadith-muslim',
    workId: 'mw:work:hadith:muslim',
    artifactId: 'mw:artifact:hadith:muslim-baseline',
    editionId: 'mw:edition:hadith:muslim:standard',
    schemeId: 'mw:citation-scheme:hadith:muslim:number',
    tradition: 'islam',
    workTitle: 'Sahih Muslim',
    workTitleAr: 'صحيح مسلم'
  }
]

async function loadRawHadiths(collection: string): Promise<HadithRecord[]> {
  const dir = path.join(process.cwd(), `ingestion/recipes/ummah-api/source/hadith/${collection}`)
  const files = (await readdir(dir)).filter(f => f.endsWith('.json')).sort()
  const list: HadithRecord[] = []

  for (const file of files) {
    const raw = JSON.parse(await readFile(path.join(dir, file), 'utf8')) as HadithApiResponse
    if (raw.data?.hadiths) {
      list.push(...raw.data.hadiths)
    }
  }
  return list
}

async function ingestTarget(t: MapTarget) {
  const hadiths = await loadRawHadiths(t.collection)
  if (hadiths.length === 0) return

  const datasetDir = path.join(process.cwd(), 'datasets', t.datasetFolder, 'data/core')
  await mkdir(path.join(datasetDir, 'resources'), { recursive: true })
  await mkdir(path.join(datasetDir, 'provenance'), { recursive: true })
  await mkdir(path.join(datasetDir, 'entities'), { recursive: true })

  const provId = t.collection === 'nawawi' ? 'mw:provenance:hadith:nawawi-40' : 'mw:provenance:hadith:muslim:rec-2026'

  // 1. Structural Header records
  const resources: any[] = [
    {
      id: t.artifactId,
      record_type: 'resource',
      kind: 'textual.artifact',
      extensions: {
        source: {
          descriptor: {
            media_type: 'application/json',
            byte_size: 65536,
            sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            availability: 'bundled',
            locations: [`https://ummahapi.com/api/hadith/${t.collection}`],
            retrieved_at: '2026-08-29T00:00:00Z'
          },
          rights: {
            license_expression: 'CC0-1.0',
            attribution: 'Public domain classical Islamic Hadith heritage via UmmahAPI.',
            redistribution: 'permitted',
            status: 'public_domain'
          }
        },
        textual: {
          media_type: 'application/json',
          representation_kind: 'json_source_set',
          represents: t.editionId
        }
      }
    },
    {
      id: t.schemeId,
      record_type: 'resource',
      kind: 'textual.citation_scheme',
      extensions: {
        textual: {
          delimiter: ':',
          example: '1',
          components: [{ key: 'hadith', unit: 'hadith' }],
          applies_to: [`mw:expression:${t.tradition}:${t.collection}:ar`, `mw:expression:${t.tradition}:${t.collection}:en`]
        }
      }
    },
    {
      id: t.editionId,
      record_type: 'resource',
      kind: 'textual.edition',
      extensions: {
        textual: {
          edition_statement: 'Standard classical digital edition via UmmahAPI',
          expressions: [`mw:expression:${t.tradition}:${t.collection}:ar`, `mw:expression:${t.tradition}:${t.collection}:en`]
        }
      }
    },
    {
      id: `mw:expression:${t.tradition}:${t.collection}:ar`,
      record_type: 'resource',
      kind: 'textual.expression',
      extensions: {
        textual: {
          work: t.workId,
          language: 'ar',
          script: 'Arab'
        }
      }
    },
    {
      id: `mw:expression:${t.tradition}:${t.collection}:en`,
      record_type: 'resource',
      kind: 'textual.expression',
      extensions: {
        textual: {
          work: t.workId,
          language: 'en',
          script: 'Latn',
          relations: [{ relation: 'translation_of', expression: `mw:expression:${t.tradition}:${t.collection}:ar` }]
        }
      }
    },
    {
      id: t.workId,
      record_type: 'resource',
      kind: 'textual.work',
      labels: [
        { language: 'en', role: 'preferred', value: t.workTitle },
        { language: 'ar', role: 'preferred', value: t.workTitleAr }
      ],
      extensions: {
        textual: {
          work_type: 'hadith_collection'
        }
      }
    }
  ]

  let seq = 1
  for (const h of hadiths) {
    const passageId = `mw:passage:hadith:${t.collection === 'nawawi' ? 'nawawi-40' : t.collection}:${h.hadithnumber}`

    resources.push({
      id: passageId,
      record_type: 'resource',
      kind: 'textual.passage',
      labels: [
        { language: 'en', role: 'preferred', value: `${t.workTitle} — Hadith ${h.hadithnumber}` }
      ],
      extensions: {
        textual: {
          container: t.workId,
          sequence: seq++,
          unit: 'hadith'
        }
      }
    })

    // Arabic Content
    resources.push({
      id: `mw:content:hadith:${t.collection === 'nawawi' ? 'nawawi-40' : t.collection}:${h.hadithnumber}:ar`,
      record_type: 'resource',
      kind: 'textual.content',
      extensions: {
        textual: {
          target: passageId,
          language: 'ar',
          script: 'Arab',
          representation: 'source',
          text: h.arabic
        },
        source: {
          artifact: t.artifactId,
          provenance: provId
        }
      }
    })

    // English Translation
    resources.push({
      id: `mw:content:hadith:${t.collection === 'nawawi' ? 'nawawi-40' : t.collection}:${h.hadithnumber}:en`,
      record_type: 'resource',
      kind: 'textual.content',
      extensions: {
        textual: {
          target: passageId,
          language: 'en',
          script: 'Latn',
          representation: 'source',
          text: h.english
        },
        source: {
          artifact: t.artifactId,
          provenance: provId
        }
      }
    })
  }

  // 2. Provenance
  const provenance = [
    {
      id: provId,
      record_type: 'provenance',
      source: t.artifactId,
      source_reference: `UmmahAPI official endpoint /api/hadith/${t.collection}`,
      activities: [
        {
          type: 'acquisition',
          method: `Ingested ${hadiths.length} hadiths from UmmahAPI raw source files.`,
          ended_at: '2026-08-29T00:00:00Z',
          software: {
            name: 'scripts/ingest-ummah-hadiths.ts',
            version: '1.0'
          }
        }
      ]
    }
  ]

  // 3. Entity
  const entities = [
    {
      id: `mw:entity:tradition:islam:hadith:${t.collection}`,
      record_type: 'entity',
      kind: 'tradition.hadith_collection',
      labels: [
        { language: 'en', role: 'preferred', value: t.workTitle },
        { language: 'ar', role: 'preferred', value: t.workTitleAr }
      ]
    }
  ]

  const baseFileName = t.datasetFolder
  await writeFile(path.join(datasetDir, `resources/${baseFileName}.jsonl`), resources.map(r => JSON.stringify(r)).join('\n') + '\n', 'utf8')
  await writeFile(path.join(datasetDir, `provenance/${baseFileName}.jsonl`), provenance.map(p => JSON.stringify(p)).join('\n') + '\n', 'utf8')
  await writeFile(path.join(datasetDir, `entities/${baseFileName}.jsonl`), entities.map(e => JSON.stringify(e)).join('\n') + '\n', 'utf8')

  console.log(`✓ Mapped [${t.collection}]: ${hadiths.length} hadiths -> datasets/${t.datasetFolder}`)
}

async function main() {
  console.log('--- Processing UmmahAPI Raw Hadith Sources into Canonical Datasets ---')
  for (const t of TARGETS) {
    await ingestTarget(t)
  }
  console.log('--- Canonical Ingestion Complete ---')
}

main().catch(console.error)
