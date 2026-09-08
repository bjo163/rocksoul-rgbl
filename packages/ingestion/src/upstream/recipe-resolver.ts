import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import type { IngestionRecipe } from '../types.js'

export interface IngestionRegistryFile {
  version: string
  specVersion: string
  recipes: Record<string, { path: string }>
}

export class RecipeResolver {
  private readonly rootDir: string
  private recipesCache: Map<string, IngestionRecipe> | null = null

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir
  }

  private getResolvedRootDir(): string {
    let curr = this.rootDir
    while (curr !== path.dirname(curr)) {
      if (existsSync(path.join(curr, 'ingestion/registry.json'))) {
        return curr
      }
      curr = path.dirname(curr)
    }
    return this.rootDir
  }

  async loadAllRecipes(): Promise<Map<string, IngestionRecipe>> {
    if (this.recipesCache) return this.recipesCache

    const effectiveRoot = this.getResolvedRootDir()
    const registryPath = path.join(effectiveRoot, 'ingestion/registry.json')
    const cache = new Map<string, IngestionRecipe>()

    if (!existsSync(registryPath)) {
      this.recipesCache = cache
      return cache
    }

    const raw = await readFile(registryPath, 'utf8')
    const registry = JSON.parse(raw) as { specVersion?: string; recipes?: Array<{ id: string; path: string }> | Record<string, { path: string }> }

    const recipeEntries = Array.isArray(registry.recipes)
      ? registry.recipes
      : Object.entries(registry.recipes || {}).map(([id, entry]) => ({ id, path: (entry as { path: string }).path }))

    for (const entry of recipeEntries) {
      const recipeDir = path.isAbsolute(entry.path)
        ? entry.path
        : path.resolve(effectiveRoot, entry.path)

      const recipeJsonPath = path.join(recipeDir, 'recipe.json')
      if (existsSync(recipeJsonPath)) {
        try {
          const content = await readFile(recipeJsonPath, 'utf8')
          const recipe = JSON.parse(content) as IngestionRecipe
          cache.set(entry.id, recipe)
        } catch {
          // invalid json handled by validator
        }
      }
    }

    this.recipesCache = cache
    return cache
  }

  async findRecipe(recipeId: string): Promise<IngestionRecipe | null> {
    const recipes = await this.loadAllRecipes()
    return recipes.get(recipeId) || null
  }

  async findRecipeForEndpoint(endpointId: string): Promise<IngestionRecipe | null> {
    const recipes = await this.loadAllRecipes()
    for (const recipe of recipes.values()) {
      const sourceLocation = recipe.source.kind === 'filesystem' ? recipe.source.path : recipe.source.url
      if (recipe.id.includes(endpointId) || sourceLocation.includes(endpointId)) {
        return recipe
      }
    }
    return null
  }
}
