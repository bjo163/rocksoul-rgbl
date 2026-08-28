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

  async loadAllRecipes(): Promise<Map<string, IngestionRecipe>> {
    if (this.recipesCache) return this.recipesCache

    const registryPath = path.join(this.rootDir, 'ingestion/registry.json')
    const cache = new Map<string, IngestionRecipe>()

    if (!existsSync(registryPath)) {
      this.recipesCache = cache
      return cache
    }

    const raw = await readFile(registryPath, 'utf8')
    const registry = JSON.parse(raw) as IngestionRegistryFile

    for (const [recipeId, entry] of Object.entries(registry.recipes || {})) {
      const recipePath = path.isAbsolute(entry.path)
        ? entry.path
        : path.join(this.rootDir, 'ingestion', entry.path)

      if (existsSync(recipePath)) {
        try {
          const content = await readFile(recipePath, 'utf8')
          const recipe = JSON.parse(content) as IngestionRecipe
          cache.set(recipeId, recipe)
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
