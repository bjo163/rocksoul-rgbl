import { datasetDependencyKey, type CanonicalId } from '@moonwitness/corpus-core'
import type { DatasetDependencyResolution, DatasetDescriptor } from './types.js'

function compareStrings(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0 }

export function indexDatasets(datasets: readonly DatasetDescriptor[]): Map<CanonicalId, DatasetDescriptor> {
  const index = new Map<CanonicalId, DatasetDescriptor>()
  for (const dataset of datasets) {
    if (index.has(dataset.manifest.id)) {
      throw new Error(`Duplicate dataset identity: ${dataset.manifest.id}`)
    }
    if (dataset.entry.id !== dataset.manifest.id) {
      throw new Error(`Dataset registry id ${dataset.entry.id} does not match manifest id ${dataset.manifest.id}`)
    }
    index.set(dataset.manifest.id, dataset)
  }
  return index
}

export function resolveDatasetDependencies(
  datasets: readonly DatasetDescriptor[],
  rootId: CanonicalId
): DatasetDependencyResolution | null {
  const index = indexDatasets(datasets)
  const root = index.get(rootId)
  if (!root) return null

  const ordered: DatasetDescriptor[] = []
  const visited = new Set<CanonicalId>()
  const visiting = new Set<CanonicalId>()

  const visit = (dataset: DatasetDescriptor): void => {
    const id = dataset.manifest.id
    if (visited.has(id)) return
    if (visiting.has(id)) throw new Error(`Dataset dependency cycle detected at ${id}`)
    visiting.add(id)

    const dependencies = [...(dataset.manifest.dependencies ?? [])].sort((a, b) =>
      compareStrings(datasetDependencyKey(a), datasetDependencyKey(b))
    )
    for (const dependency of dependencies) {
      const resolved = index.get(dependency.dataset)
      if (!resolved) {
        throw new Error(`Dataset ${id} requires missing dependency ${datasetDependencyKey(dependency)}`)
      }
      if (resolved.manifest.datasetVersion !== dependency.version) {
        throw new Error(
          `Dataset ${id} requires ${datasetDependencyKey(dependency)} but registry provides ${resolved.manifest.datasetVersion}`
        )
      }
      visit(resolved)
    }

    visiting.delete(id)
    visited.add(id)
    ordered.push(dataset)
  }

  visit(root)
  return { root, ordered }
}
