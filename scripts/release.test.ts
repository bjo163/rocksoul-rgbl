import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'
import { assertReleaseChangePlan, bumpSemver } from './release-versioning.js'

const root = process.cwd()

test('release versioning uses strict SemVer and independent bump domains', () => {
  assert.equal(bumpSemver('0.1.0', 'patch'), '0.1.1')
  assert.equal(bumpSemver('0.1.0', 'minor'), '0.2.0')
  assert.equal(bumpSemver('0.1.0', 'major'), '1.0.0')
  assert.throws(() => bumpSemver('0.1', 'patch'))
})

test('release change plans cannot mutate spec or dataset versions', () => {
  assert.doesNotThrow(() => assertReleaseChangePlan({
    format: 'moonwitness-release-change-v1',
    summary: 'Patch core runtime.',
    packages: { '@moonwitness/corpus-core': 'patch' },
    corpusRelease: 'patch'
  }))
  assert.throws(() => assertReleaseChangePlan({
    format: 'moonwitness-release-change-v1',
    summary: 'Invalid cross-domain change.',
    specVersion: '0.2'
  }))
  assert.throws(() => assertReleaseChangePlan({
    format: 'moonwitness-release-change-v1',
    summary: 'Invalid cross-domain change.',
    datasetVersion: '1.0.0'
  }))
})

test('public package contract fixes the @moonwitness scope and all P8 targets', async () => {
  const contract = JSON.parse(await readFile(join(root, 'release/package-contract.json'), 'utf8'))
  assert.equal(contract.scope, '@moonwitness')
  const targetNames = contract.packages
    .filter((pkg: { role: string }) => pkg.role === 'p8-target')
    .map((pkg: { name: string }) => pkg.name)
    .sort()
  assert.deepEqual(targetNames, [
    '@moonwitness/corpus-cli',
    '@moonwitness/corpus-core',
    '@moonwitness/corpus-repository',
    '@moonwitness/corpus-schema',
    '@moonwitness/corpus-validator'
  ])
})

test('npm publishing remains explicitly gated while license/scope authorization is unresolved', async () => {
  const contract = JSON.parse(await readFile(join(root, 'release/package-contract.json'), 'utf8'))
  assert.equal(contract.npmPublishEnabled, false)
  assert.ok(contract.publicationBlockers.length >= 2)
})

test('aggregate release version is stored separately from spec and dataset versions', async () => {
  const release = JSON.parse(await readFile(join(root, 'release/corpus-release.json'), 'utf8'))
  const registry = JSON.parse(await readFile(join(root, 'datasets/registry.json'), 'utf8'))
  const rootPackage = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
  assert.match(release.version, /^\d+\.\d+\.\d+$/)
  assert.equal(release.specVersion, registry.specVersion)
  assert.equal(rootPackage.private, true)
  assert.notEqual(join(root, 'release/corpus-release.json'), join(root, 'package.json'))
})
