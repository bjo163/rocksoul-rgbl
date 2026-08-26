import { join } from 'node:path'
import { writeDerivedArtifacts } from '@moonwitness/corpus-build'
import { FileSystemCorpusRepository } from '@moonwitness/corpus-node'

const root = process.cwd()
const repository = await FileSystemCorpusRepository.open(root)
const outputDir = join(root, 'dist')
const manifest = await writeDerivedArtifacts(repository, outputDir)
const datasets = await repository.listDatasets()
let records = 0
for await (const _record of repository.iterateRecords()) records += 1
console.log(`Built ${manifest.files.length + 1} deterministic artifacts for ${datasets.length} datasets / ${records} records in dist/`)
