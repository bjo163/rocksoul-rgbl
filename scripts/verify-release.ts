import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { buildRelease } from './build-release.js'

const root = process.cwd()
await buildRelease(root)
const firstManifest = await readFile(join(root, 'dist/release/release-manifest.json'))
const firstChecksums = await readFile(join(root, 'dist/release/SHA256SUMS'))

await buildRelease(root)
const secondManifest = await readFile(join(root, 'dist/release/release-manifest.json'))
const secondChecksums = await readFile(join(root, 'dist/release/SHA256SUMS'))

if (!firstManifest.equals(secondManifest)) throw new Error('Release manifest is not deterministic')
if (!firstChecksums.equals(secondChecksums)) throw new Error('Release checksums are not deterministic')

console.log('Release bundle is byte-deterministic across two builds.')
