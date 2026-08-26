import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { acquireFilesystem } from './connectors/filesystem.js'
import { acquireHttp } from './connectors/http.js'
import { applyCurationOverlays } from './curation.js'
import { deterministicJsonl } from './canonical-jsonl.js'
import { sha256Bytes } from './checksum.js'
import { loadRecipe } from './registry.js'
import type { CurationOverlay, IngestionResult, IngestionRunOptions, RecipeHooks } from './types.js'

async function loadHooks(recipeDir: string, modulePath: string): Promise<RecipeHooks> {
  if (path.isAbsolute(modulePath)) throw new Error('Recipe implementation module must be relative')
  const resolved = path.resolve(recipeDir, modulePath)
  if (!resolved.startsWith(`${path.resolve(recipeDir)}${path.sep}`)) throw new Error('Recipe implementation module escapes recipe directory')
  const imported = await import(pathToFileURL(resolved).href)
  const hooks = imported.hooks as RecipeHooks | undefined
  if (!hooks?.parse || !hooks.normalize || !hooks.map) throw new Error('Recipe module must export hooks with parse, normalize, and map functions')
  return hooks
}

async function loadOverlays(recipeDir: string, files: string[] = []): Promise<CurationOverlay[]> {
  const root = path.resolve(recipeDir)
  const overlays: CurationOverlay[] = []
  for (const fileName of files) {
    if (path.isAbsolute(fileName)) throw new Error('Curation overlay path must be relative')
    const file = path.resolve(root, fileName)
    if (!file.startsWith(`${root}${path.sep}`)) throw new Error('Curation overlay path escapes recipe directory')
    overlays.push(JSON.parse(await readFile(file, 'utf8')) as CurationOverlay)
  }
  return overlays
}

export async function runIngestion(options: IngestionRunOptions): Promise<IngestionResult> {
  const recipeDir = path.resolve(options.recipeDir)
  const recipe = await loadRecipe(recipeDir)
  const acquisition = recipe.source.kind === 'filesystem'
    ? await acquireFilesystem(recipe.source, recipeDir)
    : await acquireHttp(recipe.source, { allowNetwork: options.allowNetwork, fetchImpl: options.fetchImpl })
  const hooks = await loadHooks(recipeDir, recipe.implementation.module)
  const context = { recipe, acquisition }
  const parsed = await hooks.parse(acquisition.bytes, context)
  const normalized = await hooks.normalize(parsed, context)
  const mapped = await hooks.map(normalized, context)
  const curated = applyCurationOverlays(mapped, await loadOverlays(recipeDir, recipe.overlays))
  const findings = hooks.validate ? await hooks.validate(curated.records, context) : []
  if (findings.length) throw new Error(`Recipe validation failed:\n${findings.map((finding) => `- ${finding}`).join('\n')}`)
  const output = deterministicJsonl(curated.records)
  const outputSha256 = sha256Bytes(new TextEncoder().encode(output))
  if (options.writeOutput !== false) {
    const outputPath = path.resolve(options.outputPath ?? path.join(recipeDir, recipe.output.path))
    await mkdir(path.dirname(outputPath), { recursive: true })
    await writeFile(outputPath, output, 'utf8')
  }
  const { bytes: _bytes, ...acquisitionMetadata } = acquisition
  return { recipe, records: curated.records, output, outputSha256, acquisition: acquisitionMetadata, appliedCorrections: curated.operations, findings }
}
