import { createRequire } from 'node:module'
import { readdir, readFile, mkdir, unlink, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { resolveRecordOwnership, computeNormalizedTextHash } from '../packages/ingestion/src/depth/edition-ownership-resolver.js'

const require = createRequire(import.meta.url)
const { DatabaseSync } = require('node:sqlite')

const root = process.cwd()
const dbPath = path.join(root, 'dist/corpus.sqlite')

async function getAllJsonlFiles(dir: string): Promise<string[]> {
  const results: string[] = []
  if (!existsSync(dir)) return results
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...await getAllJsonlFiles(full))
    } else if (entry.isFile() && entry.name.endsWith('.jsonl')) {
      results.push(full)
    }
  }
  return results
}

export async function buildSqliteCorpus(targetPath = dbPath): Promise<{ recordCount: number; dbSize: number; timeMs: number }> {
  const startTime = Date.now()
  await mkdir(path.dirname(targetPath), { recursive: true })

  if (existsSync(targetPath)) {
    try { await unlink(targetPath) } catch {}
  }

  const db = new DatabaseSync(targetPath)

  // Configure SQLite for high performance ingestion
  db.exec(`
    PRAGMA journal_mode = OFF;
    PRAGMA synchronous = OFF;
    PRAGMA temp_store = MEMORY;
    PRAGMA cache_size = 50000;
  `)

  // Schema creation
  db.exec(`
    -- Datasets
    CREATE TABLE datasets (
      id TEXT PRIMARY KEY,
      version TEXT NOT NULL,
      spec_version TEXT NOT NULL,
      tradition TEXT,
      genre TEXT,
      source_language TEXT,
      rights TEXT,
      availability TEXT,
      record_count INTEGER DEFAULT 0
    );

    -- Works
    CREATE TABLE works (
      id TEXT PRIMARY KEY,
      dataset_id TEXT NOT NULL,
      work_type TEXT,
      title_en TEXT,
      title_id TEXT,
      title_native TEXT,
      labels_json TEXT,
      extensions_json TEXT
    );
    CREATE INDEX idx_works_dataset ON works(dataset_id);

    -- Passages (Verses / Chapters / Sutras / Hymns)
    CREATE TABLE passages (
      id TEXT PRIMARY KEY,
      dataset_id TEXT NOT NULL,
      work_id TEXT NOT NULL,
      sequence INTEGER NOT NULL,
      unit TEXT NOT NULL,
      label TEXT,
      labels_json TEXT
    );
    CREATE INDEX idx_passages_work_seq ON passages(work_id, sequence);
    CREATE INDEX idx_passages_dataset ON passages(dataset_id);

    -- Contents (Normalized records with deterministic edition ownership)
    CREATE TABLE contents (
      id TEXT PRIMARY KEY,
      passage_id TEXT NOT NULL,
      dataset_id TEXT NOT NULL,
      work_id TEXT NOT NULL,
      edition_id TEXT,
      source_id TEXT,
      tradition_id TEXT,
      language TEXT NOT NULL,
      script TEXT,
      representation TEXT NOT NULL,
      text TEXT NOT NULL,
      normalized_text_hash TEXT,
      ownership_status TEXT NOT NULL DEFAULT 'UNRESOLVED'
    );
    CREATE INDEX idx_contents_edition ON contents(edition_id);
    CREATE INDEX idx_contents_work ON contents(work_id);
    CREATE INDEX idx_contents_source ON contents(source_id);
    CREATE INDEX idx_contents_lang ON contents(language);
    CREATE INDEX idx_contents_passage ON contents(passage_id);
    CREATE INDEX idx_contents_passage_lang ON contents(passage_id, language);
    CREATE INDEX idx_contents_hash ON contents(normalized_text_hash);
    CREATE INDEX idx_contents_ownership ON contents(ownership_status);

    -- Normalized Records View (direct queryable view of normalized scriptural records)
    CREATE VIEW IF NOT EXISTS normalized_records AS
    SELECT id, passage_id, dataset_id, work_id, edition_id, source_id, tradition_id, language, script, representation, text, normalized_text_hash, ownership_status
    FROM contents;

    -- Devotionals (Duas, Asmaul Husna, Mantras, Prayers)
    CREATE TABLE devotionals (
      id TEXT PRIMARY KEY,
      dataset_id TEXT NOT NULL,
      tradition TEXT NOT NULL,
      category TEXT,
      title TEXT,
      arabic_text TEXT,
      latin_text TEXT,
      english_text TEXT,
      indonesian_text TEXT,
      meaning TEXT,
      reference TEXT,
      number INTEGER
    );
    CREATE INDEX idx_devotionals_tradition ON devotionals(tradition);
    CREATE INDEX idx_devotionals_category ON devotionals(category);

    -- Lexicon Terms
    CREATE TABLE lexicon_terms (
      id TEXT PRIMARY KEY,
      dataset_id TEXT NOT NULL,
      language TEXT NOT NULL,
      lemma TEXT NOT NULL,
      gloss_en TEXT,
      gloss_id TEXT,
      transliteration TEXT
    );
    CREATE INDEX idx_lexicon_lemma ON lexicon_terms(lemma);
    CREATE INDEX idx_lexicon_lang ON lexicon_terms(language);

    -- Assertions & Relations
    CREATE TABLE assertions (
      id TEXT PRIMARY KEY,
      dataset_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      predicate TEXT NOT NULL,
      object_value TEXT NOT NULL,
      assertion_class TEXT NOT NULL,
      scope_tradition TEXT
    );
    CREATE INDEX idx_assertions_subject ON assertions(subject);
    CREATE INDEX idx_assertions_predicate ON assertions(predicate);
    CREATE INDEX idx_assertions_tradition ON assertions(scope_tradition);

    -- Raw Records Store (for universal fallback lookup by canonical ID)
    CREATE TABLE raw_records (
      id TEXT PRIMARY KEY,
      dataset_id TEXT NOT NULL,
      record_type TEXT NOT NULL,
      kind TEXT,
      json TEXT NOT NULL
    );
    CREATE INDEX idx_raw_dataset ON raw_records(dataset_id);
    CREATE INDEX idx_raw_kind ON raw_records(kind);

    -- FTS5 Full-Text Search Virtual Table for sub-millisecond search across all languages
    CREATE VIRTUAL TABLE fts_contents USING fts5(
      passage_id UNINDEXED,
      dataset_id UNINDEXED,
      language UNINDEXED,
      text
    );
  `)

  // Prepared statements
  const insertFts = db.prepare(`
    INSERT INTO fts_contents (passage_id, dataset_id, language, text)
    VALUES (?, ?, ?, ?)
  `)
  const insertDataset = db.prepare(`
    INSERT INTO datasets (id, version, spec_version, tradition, genre, source_language, rights, availability, record_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertWork = db.prepare(`
    INSERT OR REPLACE INTO works (id, dataset_id, work_type, title_en, title_id, title_native, labels_json, extensions_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertPassage = db.prepare(`
    INSERT OR REPLACE INTO passages (id, dataset_id, work_id, sequence, unit, label, labels_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const insertContent = db.prepare(`
    INSERT OR REPLACE INTO contents (id, passage_id, dataset_id, work_id, edition_id, source_id, tradition_id, language, script, representation, text, normalized_text_hash, ownership_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertDevotional = db.prepare(`
    INSERT OR REPLACE INTO devotionals (id, dataset_id, tradition, category, title, arabic_text, latin_text, english_text, indonesian_text, meaning, reference, number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertLexicon = db.prepare(`
    INSERT OR REPLACE INTO lexicon_terms (id, dataset_id, language, lemma, gloss_en, gloss_id, transliteration)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const insertAssertion = db.prepare(`
    INSERT OR REPLACE INTO assertions (id, dataset_id, subject, predicate, object_value, assertion_class, scope_tradition)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const insertRaw = db.prepare(`
    INSERT OR REPLACE INTO raw_records (id, dataset_id, record_type, kind, json)
    VALUES (?, ?, ?, ?, ?)
  `)

  // Read config registries
  const editionsList = (JSON.parse(await readFile(path.join(root, 'config/editions.json'), 'utf8')) as { editions: any[] }).editions
  const worksList = (JSON.parse(await readFile(path.join(root, 'config/works.json'), 'utf8')) as { works: any[] }).works
  const sourcesList = (JSON.parse(await readFile(path.join(root, 'config/sources.json'), 'utf8')) as { sources: any[] }).sources

  // Read registry
  const registryPath = path.join(root, 'datasets/registry.json')
  const registry = JSON.parse(await readFile(registryPath, 'utf8')) as {
    datasets: Array<{
      id: string
      path: string
      status: string
      tradition?: string
      genre?: string
      sourceLanguage?: string
    }>
  }

  const datasetsDir = path.join(root, 'datasets')
  const datasetEntries = await readdir(datasetsDir, { withFileTypes: true })

  let totalRecords = 0

  db.exec('BEGIN TRANSACTION')

  for (const entry of datasetEntries) {
    if (!entry.isDirectory()) continue
    const manifestPath = path.join(datasetsDir, entry.name, 'manifest.json')
    if (!existsSync(manifestPath)) continue

    let manifest: any
    try {
      manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
    } catch {
      continue
    }

    const regMeta = registry.datasets.find((d) => d.id === manifest.id)
    const tradition = regMeta?.tradition || manifest.tradition || manifest.extensions?.tradition || (() => {
      const parts = manifest.id.split(':')
      if (parts.length >= 3) {
        const c = parts[2]
        if (c === 'hadith' || c === 'quran') return 'islam'
        if (c === 'dhammapada' || c === 'tipitaka') return 'buddhism'
        if (c === 'bible' || c === 'sblgnt' || c === 'ecw') return 'christianity'
        if (c === 'devotional') return 'universal'
        if (c === 'lexicon') {
          const sub = parts[3] || ''
          if (sub.startsWith('hebrew')) return 'judaism'
          if (sub.startsWith('greek')) return 'christianity'
          if (sub.startsWith('dhammapada')) return 'buddhism'
          return 'universal'
        }
        return c
      }
      return 'universal'
    })()
    const genre = regMeta?.genre ?? manifest.genre ?? 'scripture'
    const sourceLanguage = regMeta?.sourceLanguage ?? manifest.source_language ?? 'mul'

    const jsonlFiles = await getAllJsonlFiles(path.join(datasetsDir, entry.name, 'data/core'))
    let datasetRecordCount = 0

    for (const file of jsonlFiles) {
      const text = await readFile(file, 'utf8')
      const lines = text.split(/\r?\n/)

      for (const line of lines) {
        if (!line.trim()) continue
        let rec: any
        try {
          rec = JSON.parse(line)
        } catch {
          continue
        }

        totalRecords++
        datasetRecordCount++

        // 1. Raw Store
        insertRaw.run(rec.id, manifest.id, rec.record_type, rec.kind ?? null, line)

        // 2. Specialized relational indexing
        if (rec.record_type === 'resource') {
          if (rec.kind === 'textual.work') {
            const labels = rec.labels ?? []
            const titleEn = labels.find((l: any) => l.language === 'en')?.value ?? null
            const titleId = labels.find((l: any) => l.language === 'id')?.value ?? null
            const titleNative = labels.find((l: any) => ['ar', 'sa', 'zh', 'he', 'grc', 'ae', 'pi'].includes(l.language))?.value ?? null
            insertWork.run(
              rec.id,
              manifest.id,
              rec.extensions?.textual?.work_type ?? null,
              titleEn,
              titleId,
              titleNative,
              JSON.stringify(labels),
              JSON.stringify(rec.extensions ?? {})
            )
          } else if (rec.kind === 'textual.passage') {
            const ext = rec.extensions?.textual ?? {}
            const label = rec.labels?.[0]?.value ?? null
            insertPassage.run(
              rec.id,
              manifest.id,
              ext.container ?? ext.work ?? '',
              ext.sequence ?? 0,
              ext.unit ?? 'passage',
              label,
              JSON.stringify(rec.labels ?? [])
            )
          } else if (rec.kind === 'textual.content') {
            const ext = rec.extensions?.textual ?? {}
            const text = ext.text ?? ''
            const textHash = computeNormalizedTextHash(text)
            const ownership = resolveRecordOwnership(
              {
                datasetId: manifest.id,
                passageId: ext.target ?? '',
                language: ext.language ?? '',
                script: ext.script ?? null,
                artifactRef: rec.extensions?.source?.artifact ?? null,
                manifestTradition: tradition
              },
              editionsList,
              worksList,
              sourcesList
            )

            insertContent.run(
              rec.id,
              ext.target ?? '',
              manifest.id,
              ownership.workId,
              ownership.editionId,
              ownership.sourceId,
              ownership.traditionId,
              ext.language ?? '',
              ext.script ?? null,
              ext.representation ?? 'source',
              text,
              textHash,
              ownership.ownershipStatus
            )
            if (text && ext.target) {
              insertFts.run(ext.target, manifest.id, ext.language ?? '', text)
            }
          } else if (rec.kind === 'devotional.dua') {
            const ext = rec.extensions?.dua ?? rec.extensions?.devotional ?? {}
            insertDevotional.run(
              rec.id,
              manifest.id,
              'islam',
              ext.category ?? 'general',
              ext.title ?? null,
              ext.arabic ?? null,
              ext.latin ?? null,
              ext.english ?? null,
              ext.indonesian ?? null,
              ext.meaning ?? null,
              ext.reference ?? null,
              ext.number ?? null
            )
          } else if (rec.kind === 'devotional.divine_name') {
            const ext = rec.extensions?.asmaul_husna ?? rec.extensions?.devotional ?? {}
            insertDevotional.run(
              rec.id,
              manifest.id,
              'islam',
              'asmaul-husna',
              ext.nameLatin ?? null,
              ext.nameArabic ?? null,
              ext.nameLatin ?? null,
              ext.translationEn ?? null,
              ext.translationId ?? null,
              ext.meaning ?? null,
              ext.quranReference ?? null,
              ext.number ?? null
            )
          } else if (rec.kind === 'devotional.prayer' || rec.kind === 'devotional.mantra') {
            const ext = rec.extensions?.devotional ?? {}
            insertDevotional.run(
              rec.id,
              manifest.id,
              ext.tradition ?? tradition ?? 'world',
              ext.category ?? 'devotional',
              ext.title ?? null,
              ext.originalText ?? null,
              ext.transliteration ?? null,
              ext.translationEn ?? null,
              ext.translationId ?? null,
              ext.significance ?? null,
              ext.sourceReference ?? null,
              null
            )
          } else if (rec.kind === 'lexicon.term') {
            const ext = rec.extensions?.lexicon ?? {}
            insertLexicon.run(
              rec.id,
              manifest.id,
              ext.language ?? '',
              ext.lemma ?? '',
              ext.gloss_en ?? null,
              ext.gloss_id ?? null,
              ext.transliteration ?? null
            )
          }
        } else if (rec.record_type === 'assertion') {
          const objVal = typeof rec.object === 'object' ? (rec.object.value ?? JSON.stringify(rec.object)) : String(rec.object ?? '')
          insertAssertion.run(
            rec.id,
            manifest.id,
            rec.subject ?? '',
            rec.predicate ?? '',
            objVal,
            rec.assertion_class ?? 'general_assertion',
            rec.scope?.tradition ?? null
          )
        }
      }
    }

    insertDataset.run(
      manifest.id,
      manifest.datasetVersion ?? '0.1.0',
      manifest.specVersion ?? '0.1',
      tradition,
      genre,
      sourceLanguage,
      typeof manifest.rights === 'string' ? manifest.rights : JSON.stringify(manifest.rights ?? {}),
      manifest.availability ?? 'bundled',
      datasetRecordCount
    )
  }

  db.exec('COMMIT')

  // Optimize and vacuum
  db.exec(`
    PRAGMA optimize;
  `)

  db.close()

  const dbStat = await stat(targetPath)
  const duration = Date.now() - startTime

  return {
    recordCount: totalRecords,
    dbSize: dbStat.size,
    timeMs: duration
  }
}

// If run directly via CLI
if (process.argv[1]?.endsWith('build-sqlite-database.ts') || process.argv[1]?.endsWith('build-sqlite-database.js')) {
  console.log('--- Building Native Embedded SQLite Corpus Database ---')
  buildSqliteCorpus()
    .then((res) => {
      console.log(`✓ SQLite Database built successfully at: ${dbPath}`)
      console.log(`✓ Indexed Records: ${res.recordCount.toLocaleString()}`)
      console.log(`✓ File Size: ${(res.dbSize / (1024 * 1024)).toFixed(2)} MB`)
      console.log(`✓ Ingestion Time: ${(res.timeMs / 1000).toFixed(2)}s`)
    })
    .catch((err) => {
      console.error('Build SQLite error:', err)
      process.exit(1)
    })
}
