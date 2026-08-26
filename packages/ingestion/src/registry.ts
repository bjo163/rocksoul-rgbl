import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { IngestionRecipe } from './types.js'

export interface RecipeRegistryEntry { id: string; path: string; status?: 'fixture' | 'active' | 'deprecated' }
export interface RecipeRegistry { specVersion: '0.1'; recipes: RecipeRegistryEntry[] }

export async function loadRecipeRegistry(root: string): Promise<RecipeRegistry> {
  return JSON.parse(await readFile(path.join(root, 'ingestion/registry.json'), 'utf8')) as RecipeRegistry
}

export async function loadRecipe(recipeDir: string): Promise<IngestionRecipe> {
  return JSON.parse(await readFile(path.join(recipeDir, 'recipe.json'), 'utf8')) as IngestionRecipe
}

export async function resolveRecipe(root: string, idOrPath: string): Promise<{ recipe: IngestionRecipe; recipeDir: string }> {
  if (idOrPath.startsWith('mw:recipe:')) {
    const registry = await loadRecipeRegistry(root)
    const entry = registry.recipes.find((candidate) => candidate.id === idOrPath)
    if (!entry) throw new Error(`Unknown ingestion recipe: ${idOrPath}`)
    const recipeDir = path.resolve(root, entry.path)
    return { recipe: await loadRecipe(recipeDir), recipeDir }
  }
  const recipeDir = path.resolve(root, idOrPath)
  return { recipe: await loadRecipe(recipeDir), recipeDir }
}
