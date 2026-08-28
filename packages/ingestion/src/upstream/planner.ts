import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import type {
  UpstreamMasterRegistry,
  ExecutorRegistry,
  UpstreamExecutionPlan,
  ExecutionStatus
} from './types.js'
import { RecipeResolver } from './recipe-resolver.js'
import { defaultUpstreamAdapterRegistry, UpstreamAdapterRegistry } from './adapter-registry.js'

export interface PlannerOptions {
  rootDir?: string
  registryPath?: string
  executorsPath?: string
  adapterRegistry?: UpstreamAdapterRegistry
  defaultAllowFallback?: boolean
}

export class UpstreamPlanner {
  private readonly rootDir: string
  private readonly registryPath: string
  private readonly executorsPath: string
  private readonly recipeResolver: RecipeResolver
  private readonly adapterRegistry: UpstreamAdapterRegistry
  private readonly defaultAllowFallback: boolean

  constructor(options: PlannerOptions = {}) {
    this.rootDir = options.rootDir || process.cwd()
    this.registryPath = options.registryPath || path.join(this.rootDir, 'config/upstream-registry.json')
    this.executorsPath = options.executorsPath || path.join(this.rootDir, 'config/upstream-executors.json')
    this.recipeResolver = new RecipeResolver(this.rootDir)
    this.adapterRegistry = options.adapterRegistry || defaultUpstreamAdapterRegistry
    this.defaultAllowFallback = options.defaultAllowFallback ?? (process.env.MOONWITNESS_ALLOW_FALLBACK === '1')
  }

  async loadMasterRegistry(): Promise<UpstreamMasterRegistry> {
    if (!existsSync(this.registryPath)) {
      throw new Error(`Upstream master registry not found at: ${this.registryPath}`)
    }
    const raw = await readFile(this.registryPath, 'utf8')
    return JSON.parse(raw) as UpstreamMasterRegistry
  }

  async loadExecutorsRegistry(): Promise<ExecutorRegistry> {
    if (!existsSync(this.executorsPath)) {
      return { version: '1.0.0', jobs: [] }
    }
    const raw = await readFile(this.executorsPath, 'utf8')
    return JSON.parse(raw) as ExecutorRegistry
  }

  async buildPlan(): Promise<{
    version: string
    plans: UpstreamExecutionPlan[]
    unmappedEndpointCount: number
    readyCount: number
    defaultAllowFallback: boolean
  }> {
    const masterRegistry = await this.loadMasterRegistry()
    const executorsRegistry = await this.loadExecutorsRegistry()
    const recipes = await this.recipeResolver.loadAllRecipes()

    const plans: UpstreamExecutionPlan[] = []

    // Build lookup for executor jobs by endpoint ID
    const executorByEndpoint = new Map<string, { job: any; scriptExists: boolean }>()
    for (const job of executorsRegistry.jobs) {
      const scriptExists = job.script ? existsSync(path.join(this.rootDir, job.script)) : false
      for (const epId of job.endpointIds) {
        executorByEndpoint.set(epId, { job, scriptExists })
      }
    }

    for (const [traditionId, tradition] of Object.entries(masterRegistry.traditions)) {
      for (const endpoint of tradition.endpoints) {
        const endpointEnabled = endpoint.enabled !== false

        // Policy resolution: Executor overrides Endpoint overrides Defaults
        const executor = executorByEndpoint.get(endpoint.id)

        const isRequired = executor?.job.required ?? endpoint.required ?? false
        const allowRemote = executor?.job.allowRemote ?? endpoint.allowRemote ?? true
        const allowCache = executor?.job.allowCache ?? endpoint.allowCache ?? false
        const allowFallback = executor?.job.allowFallback ?? endpoint.allowFallback ?? this.defaultAllowFallback
        const fallbackSource = executor?.job.fallbackSource ?? endpoint.fallbackSource

        let status: ExecutionStatus = 'UNMAPPED'
        let mode: UpstreamExecutionPlan['mode'] = 'adapter'
        let recipeId: string | undefined
        let adapterId: string | undefined
        let script: string | undefined

        // 1. Check if there is an explicit script executor
        if (executor && executor.job.enabled) {
          script = executor.job.script
          mode = 'script'
          status = executor.scriptExists ? 'READY' : 'INVALID_RECIPE'
        }

        // 2. Check if there is a matching recipe
        if (status !== 'READY') {
          for (const [rId, recipe] of recipes.entries()) {
            const sourceLocation = recipe.source.kind === 'filesystem' ? recipe.source.path : recipe.source.url
            if (
              recipe.id.includes(endpoint.id) ||
              sourceLocation.includes(endpoint.id) ||
              endpoint.outputRecipeId === rId
            ) {
              recipeId = rId
              mode = 'recipe'
              status = 'READY'
              break
            }
          }
        }

        // 3. Check if there is an adapter for this endpoint
        if (status !== 'READY') {
          const adapter = this.adapterRegistry.findForEndpoint(endpoint)
          if (adapter) {
            adapterId = adapter.id
            mode = 'adapter'
            status = 'READY'
          } else {
            status = 'UNSUPPORTED_ADAPTER'
          }
        }

        if (!endpointEnabled) {
          status = 'DISABLED'
        }

        plans.push({
          id: `${traditionId}:${endpoint.id}`,
          traditionId,
          endpointId: endpoint.id,
          endpoint,
          recipeId,
          adapterId,
          script,
          fallbackSource,
          mode,
          status,
          enabled: endpointEnabled,
          required: isRequired,
          allowRemote,
          allowCache,
          allowFallback
        })
      }
    }

    // Deterministic sorting
    plans.sort((a, b) => a.id.localeCompare(b.id))

    return {
      version: masterRegistry.version,
      plans,
      unmappedEndpointCount: plans.filter(p => p.status === 'UNMAPPED' || p.status === 'UNSUPPORTED_ADAPTER').length,
      readyCount: plans.filter(p => p.status === 'READY').length,
      defaultAllowFallback: this.defaultAllowFallback
    }
  }
}
