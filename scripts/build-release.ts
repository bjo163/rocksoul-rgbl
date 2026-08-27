import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdir, readFile, readdir, rm, writeFile, cp } from 'node:fs/promises'
import { join, relative, resolve, sep } from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { canonicalJson } from '@moonwitness/corpus-build'
import { FileSystemCorpusRepository } from '@moonwitness/corpus-node'

const execFileAsync = promisify(execFile)

interface ContractPackage {
  path: string
  name: string
  description: string
  role: 'p8-target' | 'support'
  entrypoints?: Record<string, string>
  bin?: Record<string, string>
  includeSpec?: boolean
}

interface PackageContract {
  format: 'moonwitness-package-contract-v1'
  scope: string
  registry: string
  npmPublishEnabled: boolean
  publicationBlockers: string[]
  packages: ContractPackage[]
}

interface CorpusReleaseVersion {
  format: 'moonwitness-corpus-release-version-v1'
  version: string
  specVersion: string
}

interface ArtifactDigest {
  path: string
  bytes: number
  sha256: string
}

interface PackedPackage {
  name: string
  version: string
  role: string
  artifact: ArtifactDigest
}

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T
}

async function listSourceFiles(dir: string): Promise<string[]> {
  const files: string[] = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...await listSourceFiles(path))
    else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) files.push(path)
  }
  return files.sort(compareStrings)
}

function diagnosticText(diagnostic: ts.Diagnostic): string {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
  if (!diagnostic.file || diagnostic.start === undefined) return message
  const pos = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
  return `${diagnostic.file.fileName}:${pos.line + 1}:${pos.character + 1} ${message}`
}

async function compilePackage(
  packageRoot: string,
  outputDir: string,
  releasePaths: Record<string, string[]>
): Promise<void> {
  const src = join(packageRoot, 'src')
  const rootNames = await listSourceFiles(src)
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2022,
    lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    rootDir: src,
    outDir: outputDir,
    declaration: true,
    declarationMap: false,
    sourceMap: false,
    strict: true,
    skipLibCheck: true,
    resolveJsonModule: true,
    esModuleInterop: true,
    forceConsistentCasingInFileNames: true,
    types: ['node'],
    baseUrl: process.cwd(),
    paths: releasePaths,
    noEmitOnError: true
  }
  const program = ts.createProgram(rootNames, options)
  const diagnostics = ts.getPreEmitDiagnostics(program)
  if (diagnostics.length) throw new Error(diagnostics.map(diagnosticText).join('\n'))
  const emitted = program.emit()
  if (emitted.emitSkipped) throw new Error(`TypeScript emit skipped for ${packageRoot}`)
}

function rewriteDependencies(
  dependencies: Record<string, string> | undefined,
  versions: Map<string, string>
): Record<string, string> | undefined {
  if (!dependencies) return undefined
  return Object.fromEntries(Object.entries(dependencies).map(([name, version]) => {
    if (!version.startsWith('workspace:')) return [name, version]
    const resolved = versions.get(name)
    if (!resolved) throw new Error(`Release package depends on unpublished workspace package ${name}`)
    return [name, resolved]
  }))
}

function packageExports(pkg: ContractPackage): Record<string, { types: string; import: string }> | undefined {
  if (!pkg.entrypoints) return undefined
  return Object.fromEntries(Object.entries(pkg.entrypoints).map(([key, base]) => [
    key,
    { types: `./dist/${base}.d.ts`, import: `./dist/${base}.js` }
  ]))
}

function stageKey(name: string): string {
  return name.replace('@', '').replace('/', '__')
}

function registerReleasePaths(
  releasePaths: Record<string, string[]>,
  root: string,
  releaseDir: string,
  pkg: ContractPackage
): void {
  const stageRoot = join(releaseDir, 'staging', stageKey(pkg.name))
  for (const [key, base] of Object.entries(pkg.entrypoints ?? {})) {
    const specifier = key === '.' ? pkg.name : `${pkg.name}${key.slice(1)}`
    releasePaths[specifier] = [relative(root, join(stageRoot, 'dist', `${base}.d.ts`))]
  }
}

function generatedReadme(pkg: ContractPackage): string {
  return `# ${pkg.name}\n\n${pkg.description}\n\nThis package is generated from the MoonWitness Corpus monorepo release pipeline.\nCanonical schema and dataset truth remain in the repository's spec/ and datasets/ trees.\n`
}

async function sha256File(path: string): Promise<ArtifactDigest> {
  const bytes = await readFile(path)
  return {
    path: '',
    bytes: bytes.byteLength,
    sha256: createHash('sha256').update(bytes).digest('hex')
  }
}

async function packPackage(
  root: string,
  releaseDir: string,
  pkg: ContractPackage,
  contract: PackageContract,
  versions: Map<string, string>,
  releasePaths: Record<string, string[]>
): Promise<PackedPackage> {
  const sourceRoot = join(root, pkg.path)
  const sourceManifest = await readJson<any>(join(sourceRoot, 'package.json'))
  if (sourceManifest.name !== pkg.name) throw new Error(`Package contract/name mismatch at ${pkg.path}`)
  if (!pkg.name.startsWith(`${contract.scope}/`)) throw new Error(`Package ${pkg.name} is outside ${contract.scope}`)

  const stageRoot = join(releaseDir, 'staging', stageKey(pkg.name))
  await rm(stageRoot, { recursive: true, force: true })
  await mkdir(join(stageRoot, 'dist'), { recursive: true })
  await compilePackage(sourceRoot, join(stageRoot, 'dist'), releasePaths)

  if (pkg.includeSpec) {
    await cp(join(root, 'spec/v0.1'), join(stageRoot, 'spec/v0.1'), { recursive: true })
  }

  const manifest: Record<string, unknown> = {
    name: pkg.name,
    version: sourceManifest.version,
    description: pkg.description,
    type: 'module',
    engines: { node: '>=20' },
    repository: {
      type: 'git',
      url: 'git+https://github.com/bjo163/moonwitness-corpus.git',
      directory: pkg.path
    },
    homepage: `https://github.com/bjo163/moonwitness-corpus/tree/main/${pkg.path}`,
    bugs: { url: 'https://github.com/bjo163/moonwitness-corpus/issues' },
    files: ['dist', 'spec', 'README.md'],
    publishConfig: { access: 'public', registry: contract.registry },
    dependencies: rewriteDependencies(sourceManifest.dependencies, versions)
  }

  const exports = packageExports(pkg)
  if (exports) {
    manifest.exports = exports
    if (exports['.']) {
      manifest.types = exports['.'].types
      manifest.module = exports['.'].import
      manifest.main = exports['.'].import
    }
  }
  if (pkg.bin) {
    manifest.bin = Object.fromEntries(Object.entries(pkg.bin).map(([name, base]) => [name, `./dist/${base}.js`]))
  }

  if (pkg.includeSpec) {
    manifest.exports = {
      ...(manifest.exports as object),
      './spec/v0.1/*': './spec/v0.1/*'
    }
  }

  await writeFile(join(stageRoot, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  await writeFile(join(stageRoot, 'README.md'), generatedReadme(pkg), 'utf8')

  const packageDir = join(releaseDir, 'packages')
  await mkdir(packageDir, { recursive: true })
  const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const { stdout } = await execFileAsync(npmExecutable, ['pack', '--silent', '--pack-destination', packageDir], { cwd: stageRoot, shell: process.platform === 'win32' })
  const filename = stdout.trim().split(/\r?\n/).filter(Boolean).at(-1)
  if (!filename) throw new Error(`npm pack did not return a filename for ${pkg.name}`)
  const artifactPath = join(packageDir, filename)
  const digest = await sha256File(artifactPath)
  digest.path = `packages/${filename}`
  return { name: pkg.name, version: sourceManifest.version, role: pkg.role, artifact: digest }
}

async function writePortableExports(root: string, releaseDir: string): Promise<void> {
  const repository = await FileSystemCorpusRepository.open(root)
  const records = []
  for await (const record of repository.iterateRecords()) records.push(record)
  records.sort((a, b) => compareStrings(a.id, b.id))

  const jsonLd = {
    '@context': {
      '@vocab': 'urn:moonwitness:corpus:',
      mw: 'urn:moonwitness:id:',
      id: '@id'
    },
    '@graph': records
  }
  await writeFile(join(releaseDir, 'corpus.jsonld'), `${canonicalJson(jsonLd)}\n`, 'utf8')

  const baseArtifacts = ['catalog.json', 'records.jsonl', 'search-index.jsonl', 'build-manifest.json']
  const crate = {
    '@context': 'https://w3id.org/ro/crate/1.1/context',
    '@graph': [
      {
        '@id': 'ro-crate-metadata.json',
        '@type': 'CreativeWork',
        about: { '@id': './' },
        conformsTo: { '@id': 'https://w3id.org/ro/crate/1.1' }
      },
      {
        '@id': './',
        '@type': 'Dataset',
        name: 'MoonWitness Corpus release bundle',
        hasPart: baseArtifacts.map((path) => ({ '@id': `../${path}` }))
      },
      ...baseArtifacts.map((path) => ({ '@id': `../${path}`, '@type': 'File' }))
    ]
  }
  await writeFile(join(releaseDir, 'ro-crate-metadata.json'), `${canonicalJson(crate)}\n`, 'utf8')
}

async function digestRelative(root: string, path: string): Promise<ArtifactDigest> {
  const absolute = join(root, path)
  const digest = await sha256File(absolute)
  digest.path = path.split(sep).join('/')
  return digest
}

async function allFiles(dir: string): Promise<string[]> {
  const result: string[] = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) result.push(...await allFiles(path))
    else if (entry.isFile()) result.push(path)
  }
  return result.sort(compareStrings)
}

export async function buildRelease(root = process.cwd()): Promise<void> {
  const releaseDir = join(root, 'dist/release')
  await rm(releaseDir, { recursive: true, force: true })
  await mkdir(releaseDir, { recursive: true })

  const contract = await readJson<PackageContract>(join(root, 'release/package-contract.json'))
  const releaseVersion = await readJson<CorpusReleaseVersion>(join(root, 'release/corpus-release.json'))
  if (contract.format !== 'moonwitness-package-contract-v1') throw new Error('Unsupported package contract')
  if (releaseVersion.format !== 'moonwitness-corpus-release-version-v1') throw new Error('Unsupported corpus release version')

  const versions = new Map<string, string>()
  for (const pkg of contract.packages) {
    const manifest = await readJson<any>(join(root, pkg.path, 'package.json'))
    versions.set(pkg.name, manifest.version)
  }

  const packed: PackedPackage[] = []
  const releasePaths: Record<string, string[]> = {}
  for (const pkg of contract.packages) {
    packed.push(await packPackage(root, releaseDir, pkg, contract, versions, releasePaths))
    registerReleasePaths(releasePaths, root, releaseDir, pkg)
  }

  await writePortableExports(root, releaseDir)

  const repository = await FileSystemCorpusRepository.open(root)
  const descriptors = await repository.listDatasets()
  const datasets = descriptors.map((descriptor) => ({
    id: descriptor.manifest.id,
    datasetVersion: descriptor.manifest.datasetVersion,
    specVersion: descriptor.manifest.specVersion,
    status: descriptor.entry.status
  })).sort((a, b) => compareStrings(a.id, b.id))

  const artifactPaths = [
    'dist/catalog.json',
    'dist/records.jsonl',
    'dist/search-index.jsonl',
    'dist/build-manifest.json',
    ...packed.map((item) => `dist/release/${item.artifact.path}`),
    'dist/release/corpus.jsonld',
    'dist/release/ro-crate-metadata.json'
  ].sort(compareStrings)
  const artifacts: ArtifactDigest[] = []
  for (const path of artifactPaths) artifacts.push(await digestRelative(root, path))

  const manifest = {
    format: 'moonwitness-release-manifest-v1',
    corpusReleaseVersion: releaseVersion.version,
    specVersion: releaseVersion.specVersion,
    packages: packed.map((item) => ({
      name: item.name,
      version: item.version,
      role: item.role,
      artifact: item.artifact.path,
      sha256: item.artifact.sha256,
      bytes: item.artifact.bytes
    })),
    datasets,
    artifacts
  }
  const manifestPath = join(releaseDir, 'release-manifest.json')
  await writeFile(manifestPath, `${canonicalJson(manifest)}\n`, 'utf8')

  const checksumCandidates = (await allFiles(releaseDir))
    .filter((path) => !path.includes(`${sep}staging${sep}`) && !path.endsWith('SHA256SUMS'))
  const checksumLines: string[] = []
  for (const path of checksumCandidates) {
    const digest = await sha256File(path)
    checksumLines.push(`${digest.sha256}  ${relative(releaseDir, path).split(sep).join('/')}`)
  }
  checksumLines.sort(compareStrings)
  await writeFile(join(releaseDir, 'SHA256SUMS'), `${checksumLines.join('\n')}\n`, 'utf8')
  await rm(join(releaseDir, 'staging'), { recursive: true, force: true })

  console.log(`Prepared corpus release ${releaseVersion.version}: ${packed.length} npm tarballs, ${datasets.length} datasets.`)
}

const invoked = process.argv[1] ? resolve(process.argv[1]) : ''
if (invoked && fileURLToPath(import.meta.url) === invoked) await buildRelease()
