import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import Ajv2020 from 'ajv/dist/2020.js'
import fg from 'fast-glob'

export interface IngestionDefinitionFinding { file: string; code: string; message: string }

function rel(root: string, file: string): string { return path.relative(root, file).replaceAll(path.sep, '/') }
function inside(root: string, relativePath: string): string | null {
  if (path.isAbsolute(relativePath)) return null
  const resolvedRoot = path.resolve(root)
  const resolved = path.resolve(resolvedRoot, relativePath)
  return resolved.startsWith(`${resolvedRoot}${path.sep}`) ? resolved : null
}
async function exists(file: string): Promise<boolean> { try { await stat(file); return true } catch { return false } }

export async function validateIngestionDefinitions(root: string): Promise<IngestionDefinitionFinding[]> {
  const findings: IngestionDefinitionFinding[] = []
  const schemaDir = path.join(root, 'spec/v0.1/schemas/ingestion')
  if (!(await exists(schemaDir))) return findings
  const ajv = new Ajv2020({ allErrors: true, strict: false })
  const common = JSON.parse(await readFile(path.join(root, 'spec/v0.1/schemas/core/common.schema.json'), 'utf8'))
  const acquisition = JSON.parse(await readFile(path.join(schemaDir, 'acquisition.schema.json'), 'utf8'))
  ajv.addSchema(common)
  ajv.addSchema(acquisition)
  const validateRecipe = ajv.compile(JSON.parse(await readFile(path.join(schemaDir, 'recipe.schema.json'), 'utf8')))
  const validateRegistry = ajv.compile(JSON.parse(await readFile(path.join(schemaDir, 'registry.schema.json'), 'utf8')))
  const validateOverlay = ajv.compile(JSON.parse(await readFile(path.join(schemaDir, 'curation-overlay.schema.json'), 'utf8')))

  const registryFile = path.join(root, 'ingestion/registry.json')
  let registry: { recipes?: Array<{ id: string; path: string }> } = {}
  try { registry = JSON.parse(await readFile(registryFile, 'utf8')) } catch { findings.push({ file: rel(root, registryFile), code: 'ingestion-registry-json', message: 'Invalid ingestion registry JSON' }); return findings }
  if (!validateRegistry(registry)) findings.push({ file: rel(root, registryFile), code: 'ingestion-registry-schema', message: ajv.errorsText(validateRegistry.errors, { separator: '; ' }) })

  const byId = new Set<string>(), byPath = new Set<string>(), registeredRecipeFiles = new Set<string>()
  for (const entry of registry.recipes ?? []) {
    if (byId.has(entry.id)) findings.push({ file: rel(root, registryFile), code: 'duplicate-recipe-id', message: `Duplicate recipe id ${entry.id}` })
    byId.add(entry.id)
    if (byPath.has(entry.path)) findings.push({ file: rel(root, registryFile), code: 'duplicate-recipe-path', message: `Duplicate recipe path ${entry.path}` })
    byPath.add(entry.path)
    const recipeDir = inside(root, entry.path)
    if (!recipeDir) { findings.push({ file: rel(root, registryFile), code: 'recipe-path-escape', message: `Recipe path escapes repository: ${entry.path}` }); continue }
    const recipeFile = path.join(recipeDir, 'recipe.json')
    registeredRecipeFiles.add(recipeFile)
    let recipe: Record<string, unknown>
    try { recipe = JSON.parse(await readFile(recipeFile, 'utf8')) as Record<string, unknown> } catch { findings.push({ file: rel(root, recipeFile), code: 'recipe-json', message: 'Missing or invalid recipe.json' }); continue }
    if (!validateRecipe(recipe)) findings.push({ file: rel(root, recipeFile), code: 'recipe-schema', message: ajv.errorsText(validateRecipe.errors, { separator: '; ' }) })
    if (recipe.id !== entry.id) findings.push({ file: rel(root, recipeFile), code: 'recipe-registry-id-mismatch', message: `Registry id ${entry.id} does not match recipe id ${String(recipe.id)}` })
    const implementation = recipe.implementation as { module?: string } | undefined
    if (implementation?.module) {
      const moduleFile = inside(recipeDir, implementation.module)
      if (!moduleFile || !(await exists(moduleFile))) findings.push({ file: rel(root, recipeFile), code: 'recipe-module-missing', message: `Recipe implementation module is missing or escapes recipe directory: ${implementation.module}` })
    }
    const source = recipe.source as { kind?: string; path?: string; sha256?: string; byte_size?: number } | undefined
    if (source?.kind === 'filesystem' && source.path && source.sha256) {
      const sourceFile = inside(recipeDir, source.path)
      if (!sourceFile || !(await exists(sourceFile))) findings.push({ file: rel(root, recipeFile), code: 'recipe-source-missing', message: `Filesystem source is missing or escapes recipe directory: ${source.path}` })
      else {
        const bytes = await readFile(sourceFile)
        const sha256 = createHash('sha256').update(bytes).digest('hex')
        if (sha256 !== source.sha256) findings.push({ file: rel(root, sourceFile), code: 'raw-artifact-sha256-mismatch', message: `Pinned SHA-256 ${source.sha256} does not match ${sha256}` })
        if (source.byte_size !== undefined && source.byte_size !== bytes.byteLength) findings.push({ file: rel(root, sourceFile), code: 'raw-artifact-byte-size-mismatch', message: `Pinned byte_size ${source.byte_size} does not match ${bytes.byteLength}` })
      }
    }
    for (const overlayName of (recipe.overlays ?? []) as string[]) {
      const overlayFile = inside(recipeDir, overlayName)
      if (!overlayFile || !(await exists(overlayFile))) { findings.push({ file: rel(root, recipeFile), code: 'curation-overlay-missing', message: `Curation overlay is missing or escapes recipe directory: ${overlayName}` }); continue }
      try {
        const overlay = JSON.parse(await readFile(overlayFile, 'utf8'))
        if (!validateOverlay(overlay)) findings.push({ file: rel(root, overlayFile), code: 'curation-overlay-schema', message: ajv.errorsText(validateOverlay.errors, { separator: '; ' }) })
      } catch { findings.push({ file: rel(root, overlayFile), code: 'curation-overlay-json', message: 'Invalid curation overlay JSON' }) }
    }
  }

  const discovered = await fg('ingestion/recipes/**/recipe.json', { cwd: root, absolute: true, onlyFiles: true })
  for (const file of discovered) if (!registeredRecipeFiles.has(file)) findings.push({ file: rel(root, file), code: 'unregistered-ingestion-recipe', message: 'Recipe is not declared in ingestion/registry.json' })
  return findings
}
