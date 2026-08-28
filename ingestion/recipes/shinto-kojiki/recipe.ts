import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'

export async function materializeShintoKojiki() {
  const recipeDir = path.join(process.cwd(), 'ingestion/recipes/shinto-kojiki')
  const rawPath = path.join(recipeDir, 'source/kojiki-raw.json')
  const rawContent = await readFile(rawPath, 'utf8')
  const rawSha256 = createHash('sha256').update(rawContent).digest('hex')
  const rawJson = JSON.parse(rawContent) as {
    source: string
    url: string
    license: string
    entries: Array<{
      section: string
      title: string
      japanese: string
      english: string
      indonesian: string
    }>
  }

  const datasetDir = path.join(process.cwd(), 'datasets/shinto-kojiki-baseline')
  const coreDir = path.join(datasetDir, 'data/core')

  await mkdir(path.join(coreDir, 'resources'), { recursive: true })
  await mkdir(path.join(coreDir, 'provenance'), { recursive: true })
  await mkdir(path.join(coreDir, 'entities'), { recursive: true })

  // 1. Manifest conforming to specVersion 0.2
  const manifest = {
    id: 'mw:dataset:shinto:kojiki',
    datasetVersion: '0.1.0',
    specVersion: '0.2',
    profiles: [
      'textual@0.1',
      'source@0.1'
    ],
    partitions: [
      {
        recordType: 'entity',
        path: 'data/core/entities/*.jsonl'
      },
      {
        recordType: 'resource',
        path: 'data/core/resources/*.jsonl'
      },
      {
        recordType: 'provenance',
        path: 'data/core/provenance/*.jsonl'
      }
    ],
    sources: [
      rawJson.source
    ],
    rights: 'CC0-1.0; Public domain classical Shinto Kojiki chronicle.',
    availability: 'bundled'
  }
  await writeFile(path.join(datasetDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8')

  const artifactId = 'mw:artifact:shinto:kojiki:chamberlain-1882'
  const workId = 'mw:work:shinto:kojiki'
  const editionId = 'mw:edition:shinto:kojiki:classical'
  const schemeId = 'mw:citation-scheme:shinto:kojiki:section'
  const provId = 'mw:provenance:shinto:kojiki:rec-2026'

  // 2. Resources
  const resources: any[] = [
    {
      id: artifactId,
      record_type: 'resource',
      kind: 'textual.artifact',
      extensions: {
        source: {
          descriptor: {
            media_type: 'application/json',
            byte_size: Buffer.byteLength(rawContent),
            sha256: rawSha256,
            availability: 'bundled',
            locations: [rawJson.url],
            retrieved_at: '2026-08-29T00:00:00Z'
          },
          rights: {
            license_expression: 'CC0-1.0',
            attribution: rawJson.source,
            redistribution: 'permitted',
            status: 'public_domain'
          }
        },
        textual: {
          media_type: 'application/json',
          representation_kind: 'json_source_set',
          represents: editionId
        }
      }
    },
    {
      id: schemeId,
      record_type: 'resource',
      kind: 'textual.citation_scheme',
      extensions: {
        textual: {
          delimiter: ':',
          example: '1:1',
          components: [
            { key: 'section', unit: 'section' }
          ],
          applies_to: ['mw:expression:shinto:kojiki:ja', 'mw:expression:shinto:kojiki:en', 'mw:expression:shinto:kojiki:id']
        }
      }
    },
    {
      id: editionId,
      record_type: 'resource',
      kind: 'textual.edition',
      extensions: {
        textual: {
          edition_statement: 'Standard classical Kojiki digital multilingual edition',
          expressions: ['mw:expression:shinto:kojiki:ja', 'mw:expression:shinto:kojiki:en', 'mw:expression:shinto:kojiki:id']
        }
      }
    },
    {
      id: 'mw:expression:shinto:kojiki:ja',
      record_type: 'resource',
      kind: 'textual.expression',
      extensions: {
        textual: {
          work: workId,
          language: 'ja',
          script: 'Jpan'
        }
      }
    },
    {
      id: 'mw:expression:shinto:kojiki:en',
      record_type: 'resource',
      kind: 'textual.expression',
      extensions: {
        textual: {
          work: workId,
          language: 'en',
          script: 'Latn',
          relations: [{ relation: 'translation_of', expression: 'mw:expression:shinto:kojiki:ja' }]
        }
      }
    },
    {
      id: 'mw:expression:shinto:kojiki:id',
      record_type: 'resource',
      kind: 'textual.expression',
      extensions: {
        textual: {
          work: workId,
          language: 'id',
          script: 'Latn',
          relations: [{ relation: 'translation_of', expression: 'mw:expression:shinto:kojiki:ja' }]
        }
      }
    },
    {
      id: workId,
      record_type: 'resource',
      kind: 'textual.work',
      labels: [
        { language: 'en', role: 'preferred', value: 'Kojiki (Records of Ancient Matters)' },
        { language: 'ja', role: 'preferred', value: '古事記 (Kojiki)' },
        { language: 'id', role: 'preferred', value: 'Kojiki (Catatan Peristiwa Kuno)' }
      ],
      extensions: {
        textual: {
          work_type: 'scripture'
        }
      }
    }
  ]

  let seq = 1
  for (const entry of rawJson.entries) {
    const passageId = `mw:passage:shinto:kojiki:${entry.section}`

    resources.push({
      id: passageId,
      record_type: 'resource',
      kind: 'textual.passage',
      labels: [
        { language: 'en', role: 'preferred', value: `Kojiki ${entry.section}: ${entry.title}` }
      ],
      extensions: {
        textual: {
          container: workId,
          sequence: seq++,
          unit: 'section'
        }
      }
    })

    // Japanese
    resources.push({
      id: `mw:content:shinto:kojiki:${entry.section}:ja`,
      record_type: 'resource',
      kind: 'textual.content',
      extensions: {
        textual: {
          target: passageId,
          language: 'ja',
          script: 'Jpan',
          representation: 'source',
          text: entry.japanese
        },
        source: {
          artifact: artifactId,
          provenance: provId
        }
      }
    })

    // English
    resources.push({
      id: `mw:content:shinto:kojiki:${entry.section}:en`,
      record_type: 'resource',
      kind: 'textual.content',
      extensions: {
        textual: {
          target: passageId,
          language: 'en',
          script: 'Latn',
          representation: 'source',
          text: entry.english
        },
        source: {
          artifact: artifactId,
          provenance: provId
        }
      }
    })

    // Indonesian
    resources.push({
      id: `mw:content:shinto:kojiki:${entry.section}:id`,
      record_type: 'resource',
      kind: 'textual.content',
      extensions: {
        textual: {
          target: passageId,
          language: 'id',
          script: 'Latn',
          representation: 'source',
          text: entry.indonesian
        },
        source: {
          artifact: artifactId,
          provenance: provId
        }
      }
    })
  }

  // 3. Provenance
  const provenance = [
    {
      id: provId,
      record_type: 'provenance',
      source: artifactId,
      source_reference: rawJson.source,
      activities: [
        {
          type: 'acquisition',
          method: 'Materialized from raw source JSON file ingestion/recipes/shinto-kojiki/source/kojiki-raw.json into canonical corpus dataset.',
          ended_at: '2026-08-29T00:00:00Z',
          software: {
            name: 'ingestion/recipes/shinto-kojiki/recipe.ts',
            version: '1.0'
          }
        }
      ]
    }
  ]

  // 4. Entities
  const entities = [
    {
      id: 'mw:entity:tradition:shinto',
      record_type: 'entity',
      kind: 'tradition.shinto',
      labels: [
        { language: 'en', role: 'preferred', value: 'Shinto Tradition' },
        { language: 'ja', role: 'preferred', value: '神道 (Shintō)' },
        { language: 'id', role: 'preferred', value: 'Tradisi Shinto' }
      ]
    }
  ]

  const fileName = 'shinto-kojiki-baseline.jsonl'
  await writeFile(path.join(coreDir, 'resources', fileName), resources.map(r => JSON.stringify(r)).join('\n') + '\n', 'utf8')
  await writeFile(path.join(coreDir, 'provenance', fileName), provenance.map(p => JSON.stringify(p)).join('\n') + '\n', 'utf8')
  await writeFile(path.join(coreDir, 'entities', fileName), entities.map(e => JSON.stringify(e)).join('\n') + '\n', 'utf8')

  console.log(`✓ [Recipe] Materialized Shinto Kojiki from raw source file (${rawJson.entries.length} sections, SHA: ${rawSha256.slice(0, 16)}...) -> datasets/shinto-kojiki-baseline`)
}

if (process.argv[1] && process.argv[1].includes('recipe.ts')) {
  materializeShintoKojiki().catch(console.error)
}
