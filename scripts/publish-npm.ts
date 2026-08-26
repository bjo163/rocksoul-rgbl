import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const root = process.cwd()
const dryRun = process.argv.includes('--dry-run')
const contract = JSON.parse(await readFile(join(root, 'release/package-contract.json'), 'utf8'))
const manifest = JSON.parse(await readFile(join(root, 'dist/release/release-manifest.json'), 'utf8'))

if (!dryRun) {
  if (!contract.npmPublishEnabled) {
    throw new Error(`npm publication is disabled: ${contract.publicationBlockers.join(' | ')}`)
  }
  if (!process.env.NODE_AUTH_TOKEN) throw new Error('NODE_AUTH_TOKEN/NPM_TOKEN is required for npm publication')
}

for (const pkg of manifest.packages) {
  const tarball = join(root, 'dist/release', pkg.artifact)
  if (dryRun) {
    console.log(`[dry-run] npm publish ${pkg.name}@${pkg.version} from ${pkg.artifact}`)
  } else {
    console.log(`Publishing ${pkg.name}@${pkg.version}`)
    await execFileAsync('npm', ['publish', tarball, '--access', 'public', '--provenance'], {
      cwd: root,
      env: process.env
    })
  }
}
