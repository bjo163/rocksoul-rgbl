import { assertCanonicalId, type CanonicalId } from './identifiers.js'

export const EXACT_DATASET_VERSION_PATTERN =
  /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/

export interface DatasetDependency {
  /** Repository-global canonical dataset identity. */
  dataset: CanonicalId
  /** Exact pinned dataset release version; ranges are intentionally forbidden in v0.1. */
  version: string
}

export function assertExactDatasetVersion(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !EXACT_DATASET_VERSION_PATTERN.test(value)) {
    throw new TypeError(
      'Dataset dependency version must be an exact MAJOR.MINOR.PATCH-style release version; ranges and wildcards are not allowed'
    )
  }
}

export function assertDatasetDependency(value: unknown): asserts value is DatasetDependency {
  if (value === null || Array.isArray(value) || typeof value !== 'object') {
    throw new TypeError('Dataset dependency must be an object')
  }

  const dependency = value as Record<string, unknown>
  assertCanonicalId(dependency.dataset)
  assertExactDatasetVersion(dependency.version)
}

export function isDatasetDependency(value: unknown): value is DatasetDependency {
  try {
    assertDatasetDependency(value)
    return true
  } catch {
    return false
  }
}

/**
 * Validate dependency-list invariants that JSON Schema cannot express cleanly.
 * Full I/O resolution belongs to the repository/build layer (P6).
 */
export function assertDatasetDependencyList(
  ownerDataset: CanonicalId,
  dependencies: readonly DatasetDependency[]
): void {
  assertCanonicalId(ownerDataset)
  const seenDatasets = new Set<CanonicalId>()

  for (const dependency of dependencies) {
    assertDatasetDependency(dependency)

    if (dependency.dataset === ownerDataset) {
      throw new TypeError(`Dataset ${ownerDataset} must not depend on itself`)
    }

    if (seenDatasets.has(dependency.dataset)) {
      throw new TypeError(
        `Dataset dependency ${dependency.dataset} is declared more than once; v0.1 allows one exact version per dataset identity`
      )
    }
    seenDatasets.add(dependency.dataset)
  }
}

export function datasetDependencyKey(dependency: DatasetDependency): string {
  assertDatasetDependency(dependency)
  return `${dependency.dataset}@${dependency.version}`
}
