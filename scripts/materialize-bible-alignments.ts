import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { deterministicJsonl } from '@moonwitness/corpus-ingestion'
import type { CorpusRecord } from '@moonwitness/corpus-core'

const root = process.cwd()
const provenance = 'mw:provenance:bible-passage-alignments:v1'
const artifact = 'mw:artifact:bible-passage-alignments:v1'

const wlcToWeb: Record<string, string> = { gen: 'gen', exod: 'exo', lev: 'lev', num: 'num', deut: 'deu', josh: 'jos', judg: 'jdg', ruth: 'rut', '1sam': '1sa', '2sam': '2sa', '1kgs': '1ki', '2kgs': '2ki', '1chr': '1ch', '2chr': '2ch', ezra: 'ezr', neh: 'neh', esth: 'est', job: 'job', ps: 'psa', prov: 'pro', eccl: 'ecc', song: 'sol', isa: 'isa', jer: 'jer', lam: 'lam', ezek: 'eze', dan: 'dan', hos: 'hos', joel: 'joe', amos: 'amo', obad: 'oba', jonah: 'jon', mic: 'mic', nah: 'nah', hab: 'hab', hag: 'hag', zech: 'zec', zeph: 'zep', mal: 'mal' }
const sblToWeb: Record<string, string> = { matt: 'mat', mark: 'mar', luke: 'luk', john: 'joh', acts: 'act', rom: 'rom', '1cor': '1co', '2cor': '2co', gal: 'gal', eph: 'eph', phil: 'phi', col: 'col', '1thess': '1th', '2thess': '2th', '1tim': '1ti', '2tim': '2ti', titus: 'tit', phlm: 'phm', heb: 'heb', jas: 'jam', '1pet': '1pe', '2pet': '2pe', '1john': '1jo', '2john': '2jo', '3john': '3jo', jude: 'jud', rev: 'rev' }

async function records(file: string): Promise<Array<Record<string, unknown>>> {
  return (await readFile(path.join(root, file), 'utf8')).trimEnd().split('\n').map((line) => JSON.parse(line) as Record<string, unknown>)
}

function passageIndex(input: Array<Record<string, unknown>>): Set<string> {
  return new Set(input.filter((record) => record.record_type === 'resource' && record.kind === 'textual.passage').map((record) => String(record.id)))
}

function mappedRecords(source: Set<string>, target: Set<string>, map: Record<string, string>, family: 'wlc' | 'sblgnt'): CorpusRecord[] {
  const output: CorpusRecord[] = []
  for (const id of [...source].sort()) {
    const parts = id.split(':')
    const book = parts.at(-3); const chapter = parts.at(-2); const verse = parts.at(-1)
    if (!book || !chapter || !verse || !map[book]) continue
    const targetId = `mw:passage:web-classic:2020:${map[book]}:${chapter}:${verse}`
    if (!target.has(targetId)) continue
    output.push({
      id: `mw:alignment:${family}-web:${book}:${chapter}:${verse}`, record_type: 'resource', kind: 'textual.alignment',
      extensions: { textual: { relation: 'corresponding_passage', sources: [{ target: id }], targets: [{ target: targetId }], method: `Exact book/chapter/verse match via documented ${family}-to-WEB code map; does not assert textual, translation, or semantic identity. Non-matching versification remains unaligned.`, provenance } }
    } as CorpusRecord)
  }
  return output
}

const wlc = passageIndex(await records('datasets/oshb-wlc/data/core/resources/oshb-wlc.jsonl'))
const sbl = passageIndex(await records('datasets/sblgnt-v1-2/data/core/resources/sblgnt-v1-2.jsonl'))
const web = passageIndex(await records('datasets/web-classic-2020/data/core/resources/web-classic-2020.jsonl'))
const alignments = [...mappedRecords(wlc, web, wlcToWeb, 'wlc'), ...mappedRecords(sbl, web, sblToWeb, 'sblgnt')]
const recordsOut: CorpusRecord[] = [
  { id: artifact, record_type: 'resource', kind: 'alignment.artifact', labels: [{ value: 'Deterministic Bible passage-reference alignment', role: 'preferred', language: 'en', script: 'Latn' }] },
  { id: provenance, record_type: 'provenance', source: artifact, source_reference: 'Exact passage-reference joins among pinned OSHB/WLC, SBLGNT, and WEB Classic datasets', activities: [{ type: 'mapping', method: 'Code-map and exact chapter/verse join only; unmatched references are retained as gaps.', software: { name: 'scripts/materialize-bible-alignments.ts', version: '1' }, ended_at: '2026-08-27T00:00:00Z' }] },
  ...alignments
]
const output = deterministicJsonl(recordsOut)
await mkdir(path.join(root, 'datasets/bible-passage-alignments/data/core/resources'), { recursive: true })
await mkdir(path.join(root, 'datasets/bible-passage-alignments/data/core/provenance'), { recursive: true })
await writeFile(path.join(root, 'datasets/bible-passage-alignments/data/core/resources/alignments.jsonl'), deterministicJsonl(recordsOut.filter((record) => record.record_type === 'resource')), 'utf8')
await writeFile(path.join(root, 'datasets/bible-passage-alignments/data/core/provenance/alignments.jsonl'), deterministicJsonl(recordsOut.filter((record) => record.record_type === 'provenance')), 'utf8')
console.log(`materialized ${alignments.length} passage alignments; output sha256 basis length ${output.length}`)
