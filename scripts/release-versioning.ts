import { readFile, writeFile, mkdir, rename } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'

export type ReleaseBump = 'patch' | 'minor' | 'major'

export interface ReleaseChangePlan {
  format: 'moonwitness-release-change-v1'
  summary: string
  packages?: Record<string, ReleaseBump>
  corpusRelease?: ReleaseBump
}

interface PackageContract {
  packages: Array<{ path: string; name: string }>
}

interface CorpusReleaseVersion {
  format: 'moonwitness-corpus-release-version-v1'
  version: string
  specVersion: string
}

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/

export function bumpSemver(version: string, bump: ReleaseBump): string {
  const match = SEMVER.exec(version)
  if (!match) throw new Error(`Expected SemVer x.y.z, received ${version}`)
  let major = Number(match[1])
  let minor = Number(match[2])
  let patch = Number(match[3])
  if (bump === 'major') {
    major += 1
    minor = 0
    patch = 0
  } else if (bump === 'minor') {
    minor += 1
    patch = 0
  } else {
    patch += 1
  }
  return `${major}.${minor}.${patch}`
}

export function assertReleaseChangePlan(value: unknown): asserts value is ReleaseChangePlan {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Release plan must be an object')
  const plan = value as Record<string, unknown>
  const allowed = new Set(['format', 'summary', 'packages', 'corpusRelease'])
  for (const key of Object.keys(plan)) {
    if (!allowed.has(key)) throw new Error(`Unsupported release-plan field: ${key}`)
  }
  if (plan.format !== 'moonwitness-release-change-v1') throw new Error('Unsupported release plan format')
  if (typeof plan.summary !== 'string' || plan.summary.trim().length === 0) throw new Error('Release plan summary is required')
  if (plan.corpusRelease !== undefined && !['patch', 'minor', 'major'].includes(String(plan.corpusRelease))) {
    throw new Error('corpusRelease must be patch, minor, or major')
  }
  if (plan.packages !== undefined) {
    if (!plan.packages || typeof plan.packages !== 'object' || Array.isArray(plan.packages)) {
      throw new Error('packages must be an object')
    }
    for (const [name, bump] of Object.entries(plan.packages as Record<string, unknown>)) {
      if (!name.startsWith('@moonwitness/')) throw new Error(`Unexpected package scope: ${name}`)
      if (!['patch', 'minor', 'major'].includes(String(bump))) throw new Error(`Invalid bump for ${name}`)
    }
  }
}

async function json(path: string): Promise<any> {
  return JSON.parse(await readFile(path, 'utf8'))
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

export async function applyReleaseChangePlan(root: string, planPath: string): Promise<void> {
  const absolutePlan = resolve(root, planPath)
  const plan = await json(absolutePlan)
  assertReleaseChangePlan(plan)

  const contract = await json(join(root, 'release/package-contract.json')) as PackageContract
  const packageByName = new Map(contract.packages.map((item) => [item.name, item.path]))

  for (const [name, bump] of Object.entries(plan.packages ?? {})) {
    const packagePath = packageByName.get(name)
    if (!packagePath) throw new Error(`Package is not in the public contract: ${name}`)
    const manifestPath = join(root, packagePath, 'package.json')
    const manifest = await json(manifestPath)
    manifest.version = bumpSemver(manifest.version, bump)
    await writeJson(manifestPath, manifest)
  }

  if (plan.corpusRelease) {
    const releasePath = join(root, 'release/corpus-release.json')
    const release = await json(releasePath) as CorpusReleaseVersion
    release.version = bumpSemver(release.version, plan.corpusRelease)
    await writeJson(releasePath, release)
  }

  const appliedDir = join(root, 'release/changes/applied')
  await mkdir(appliedDir, { recursive: true })
  await rename(absolutePlan, join(appliedDir, basename(absolutePlan)))
}
