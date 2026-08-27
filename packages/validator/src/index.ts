import { readFile } from 'node:fs/promises'
import path from 'node:path'
import Ajv2020 from 'ajv/dist/2020.js'
import fg from 'fast-glob'

import { extractCanonicalReferences } from './references.js'
import { validateSemanticInvariants } from './semantic-invariants.js'
import {
  TEXTUAL_PROFILE_ID,
  TEXTUAL_SCHEMA_FILE_BY_KIND,
  TEXTUAL_SELECTOR_TYPES,
  validateTextSelector,
  validateTextualGraphInvariants,
  type TextualRecordSnapshot
} from './textual-profile.js'
import {
  SOURCE_PROFILE_ID,
  sourceMetadata,
  validateProvenanceRecordInvariants,
  validateSourceRecordInvariants,
  type SourceRecordSnapshot
} from './source-profile.js'
import { CONTEXTUAL_PROFILE_ID, CONTEXTUAL_SCHEMA_FILE_BY_KIND } from './contextual-profile.js'
import { ADVANCED_PROFILE_BY_KIND } from './advanced-profile.js'

export interface ValidationFinding {
  file: string
  line?: number
  code?: string
  message: string
}

export interface ValidationReport {
  valid: boolean
  datasetCount: number
  recordCount: number
  findings: ValidationFinding[]
}

export { CONTEXTUAL_PROFILE_ID, CONTEXTUAL_SCHEMA_FILE_BY_KIND } from './contextual-profile.js'

const recordTypes = ['entity', 'resource', 'assertion', 'evidence', 'provenance', 'assessment'] as const

interface DatasetContext {
  id: string
  version: string
  manifestFile: string
  dependencies: Map<string, string>
  profiles: Set<string>
}

interface RecordOwner {
  datasetId: string
  datasetVersion: string
  file: string
  line: number
}

interface PendingReference {
  sourceDatasetId: string
  file: string
  line: number
  field: string
  targetId: string
}

function relative(root: string, file: string): string {
  return path.relative(root, file).replaceAll(path.sep, '/')
}

async function loadVocabularyIds(root: string): Promise<Set<string>> {
  const ids = new Set<string>()
  const files = await fg('spec/v0.1/vocab/**/*.json', { cwd: root, absolute: true, onlyFiles: true })

  for (const file of files.sort()) {
    try {
      const document = JSON.parse(await readFile(file, 'utf8')) as { values?: unknown[] }
      if (!Array.isArray(document.values)) continue

      for (const value of document.values) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          const id = (value as Record<string, unknown>).id
          if (typeof id === 'string' && id.startsWith('mw:')) ids.add(id)
        }
      }
    } catch {
      // Vocabulary structure has its own validation lifecycle; malformed files
      // simply cannot contribute resolvable canonical IDs here.
    }
  }

  return ids
}

export async function validateRepository(root = process.cwd()): Promise<ValidationReport> {
  const report: ValidationReport = { valid: true, datasetCount: 0, recordCount: 0, findings: [] }
  const ajv = new Ajv2020({ allErrors: true, strict: false })
  const schemaDir = path.join(root, 'spec/v0.1/schemas/core')
  const validators = new Map<string, ReturnType<typeof ajv.compile>>()

  const commonSchema = JSON.parse(
    await readFile(path.join(schemaDir, 'common.schema.json'), 'utf8')
  ) as object
  ajv.addSchema(commonSchema)

  for (const recordType of recordTypes) {
    const raw = await readFile(path.join(schemaDir, `${recordType}.schema.json`), 'utf8')
    validators.set(recordType, ajv.compile(JSON.parse(raw)))
  }

  const datasetSchema = JSON.parse(
    await readFile(path.join(schemaDir, 'dataset.schema.json'), 'utf8')
  ) as object
  const validateDataset = ajv.compile(datasetSchema)

  const textualSchemaDir = path.join(root, 'spec/v0.1/schemas/profiles/textual')
  const textualCommonSchema = JSON.parse(
    await readFile(path.join(textualSchemaDir, 'common.schema.json'), 'utf8')
  ) as object
  ajv.addSchema(textualCommonSchema)
  const textualValidators = new Map<string, ReturnType<typeof ajv.compile>>()
  for (const [kind, fileName] of Object.entries(TEXTUAL_SCHEMA_FILE_BY_KIND)) {
    const schema = JSON.parse(await readFile(path.join(textualSchemaDir, fileName), 'utf8')) as object
    textualValidators.set(kind, ajv.compile(schema))
  }
  const validateTextualSelector = ajv.compile(
    JSON.parse(await readFile(path.join(textualSchemaDir, 'selector.schema.json'), 'utf8')) as object
  )

  const sourceSchemaDir = path.join(root, 'spec/v0.1/schemas/profiles/source')
  const sourceCommonSchema = JSON.parse(
    await readFile(path.join(sourceSchemaDir, 'common.schema.json'), 'utf8')
  ) as object
  ajv.addSchema(sourceCommonSchema)
  const validateSourceResource = ajv.compile(
    JSON.parse(await readFile(path.join(sourceSchemaDir, 'resource.schema.json'), 'utf8')) as object
  )

  const contextualSchemaDir = path.join(root, 'spec/v0.1/schemas/profiles/contextual')
  ajv.addSchema(JSON.parse(await readFile(path.join(contextualSchemaDir, 'common.schema.json'), 'utf8')) as object)
  const contextualValidators = new Map<string, ReturnType<typeof ajv.compile>>()
  for (const [kind, fileName] of Object.entries(CONTEXTUAL_SCHEMA_FILE_BY_KIND)) {
    contextualValidators.set(
      kind,
      ajv.compile(JSON.parse(await readFile(path.join(contextualSchemaDir, fileName), 'utf8')) as object)
    )
  }
  const advancedValidators = new Map<string, ReturnType<typeof ajv.compile>>()
  const advancedDirectories = [...new Set(
    Object.entries(ADVANCED_PROFILE_BY_KIND)
      .filter(([kind]) => !kind.startsWith('contextual.'))
      .map(([, definition]) => definition.directory)
  )]
  for (const directory of advancedDirectories) {
    const profileDir = path.join(root, 'spec/v0.1/schemas/profiles', directory)
    ajv.addSchema(JSON.parse(await readFile(path.join(profileDir, 'common.schema.json'), 'utf8')) as object)
  }
  for (const [kind, definition] of Object.entries(ADVANCED_PROFILE_BY_KIND)) {
    if (kind.startsWith('contextual.')) continue
    const profileDir = path.join(root, 'spec/v0.1/schemas/profiles', definition.directory)
    advancedValidators.set(
      kind,
      ajv.compile(JSON.parse(await readFile(path.join(profileDir, definition.schemaFile), 'utf8')) as object)
    )
  }

  const datasetRegistryFile = path.join(root, 'datasets/registry.json')
  let registeredDatasetRoots: Set<string> | null = null
  try {
    const registry = JSON.parse(await readFile(datasetRegistryFile, 'utf8')) as {
      datasets?: Array<{ path?: string }>
    }
    registeredDatasetRoots = new Set(
      (registry.datasets ?? [])
        .filter((entry): entry is { path: string } => typeof entry.path === 'string')
        .map((entry) => path.resolve(root, entry.path).replaceAll('\\', '/').toLowerCase())
    )
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      report.findings.push({ file: relative(root, datasetRegistryFile), code: 'dataset-registry-json', message: 'Invalid dataset registry JSON' })
    }
  }
  const manifests = (await fg('datasets/**/manifest.json', { cwd: root, absolute: true }))
    .filter((manifestFile) => !registeredDatasetRoots || registeredDatasetRoots.has(path.dirname(manifestFile).replaceAll('\\', '/').toLowerCase()))
  const partitionExpectations = new Map<string, string>()
  const partitionOwners = new Map<string, string>()
  const datasets = new Map<string, DatasetContext>()

  for (const manifestFile of manifests.sort()) {
    report.datasetCount++
    let manifest: Record<string, unknown>
    try {
      manifest = JSON.parse(await readFile(manifestFile, 'utf8')) as Record<string, unknown>
    } catch {
      report.findings.push({ file: relative(root, manifestFile), message: 'Invalid dataset manifest JSON' })
      continue
    }

    if (!validateDataset(manifest)) {
      report.findings.push({
        file: relative(root, manifestFile),
        message: ajv.errorsText(validateDataset.errors, { separator: '; ' })
      })
      continue
    }

    const datasetId = manifest.id as string
    const datasetVersion = manifest.datasetVersion as string
    const dependencies = new Map<string, string>()
    const profiles = new Set((manifest.profiles ?? []) as string[])

    for (const dependency of (manifest.dependencies ?? []) as Array<{ dataset: string; version: string }>) {
      if (dependency.dataset === datasetId) {
        report.findings.push({
          file: relative(root, manifestFile),
          code: 'dataset-self-dependency',
          message: `Dataset ${datasetId} must not depend on itself`
        })
      }
      if (dependencies.has(dependency.dataset)) {
        report.findings.push({
          file: relative(root, manifestFile),
          code: 'duplicate-dataset-dependency',
          message: `Dataset dependency ${dependency.dataset} is declared more than once`
        })
      } else {
        dependencies.set(dependency.dataset, dependency.version)
      }
    }

    if (datasets.has(datasetId)) {
      report.findings.push({
        file: relative(root, manifestFile),
        code: 'duplicate-dataset-id',
        message: `Duplicate canonical dataset id ${datasetId}`
      })
    } else {
      datasets.set(datasetId, {
        id: datasetId,
        version: datasetVersion,
        manifestFile,
        dependencies,
        profiles
      })
    }

    const datasetDir = path.dirname(manifestFile)
    const partitions = manifest.partitions as Array<{ recordType: string; path: string }>

    for (const partition of partitions) {
      const matches = await fg(partition.path, { cwd: datasetDir, absolute: true, onlyFiles: true })
      if (matches.length === 0) {
        report.findings.push({
          file: relative(root, manifestFile),
          code: 'empty-partition',
          message: `Partition '${partition.path}' matched no files`
        })
      }
      for (const file of matches) {
        const existing = partitionExpectations.get(file)
        if (existing && existing !== partition.recordType) {
          report.findings.push({
            file: relative(root, manifestFile),
            code: 'partition-type-conflict',
            message: `Partition file ${relative(root, file)} is declared as both '${existing}' and '${partition.recordType}'`
          })
        } else {
          partitionExpectations.set(file, partition.recordType)
        }

        const existingOwner = partitionOwners.get(file)
        if (existingOwner && existingOwner !== datasetId) {
          report.findings.push({
            file: relative(root, manifestFile),
            code: 'partition-owner-conflict',
            message: `Partition file ${relative(root, file)} is owned by both ${existingOwner} and ${datasetId}`
          })
        } else {
          partitionOwners.set(file, datasetId)
        }
      }
    }
  }

  for (const dataset of datasets.values()) {
    for (const [dependencyId, requiredVersion] of dataset.dependencies) {
      const target = datasets.get(dependencyId)
      if (!target) {
        report.findings.push({
          file: relative(root, dataset.manifestFile),
          code: 'unresolved-dataset-dependency',
          message: `Unresolved dataset dependency ${dependencyId}@${requiredVersion}`
        })
      } else if (target.version !== requiredVersion) {
        report.findings.push({
          file: relative(root, dataset.manifestFile),
          code: 'dataset-dependency-version-mismatch',
          message: `Dataset dependency ${dependencyId} requires ${requiredVersion} but workspace provides ${target.version}`
        })
      }
    }
  }

  const recordOwners = new Map<string, RecordOwner>()
  const recordValuesById = new Map<string, Record<string, unknown>>()
  const duplicateRecordIds = new Set<string>()
  const pendingReferences: PendingReference[] = []
  const textualSnapshots: TextualRecordSnapshot[] = []
  const sourceSnapshots: SourceRecordSnapshot[] = []
  const provenanceSnapshots: SourceRecordSnapshot[] = []

  for (const [file, expectedRecordType] of [...partitionExpectations.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const text = await readFile(file, 'utf8')
    const lines = text.split(/\r?\n/)
    const sourceDatasetId = partitionOwners.get(file)
    const sourceDataset = sourceDatasetId ? datasets.get(sourceDatasetId) : undefined

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index].trim()
      if (!line) continue
      report.recordCount++

      let record: Record<string, unknown>
      try {
        record = JSON.parse(line) as Record<string, unknown>
      } catch {
        report.findings.push({ file: relative(root, file), line: index + 1, code: 'invalid-json', message: 'Invalid JSON' })
        continue
      }

      const recordType = record.record_type
      if (recordType !== expectedRecordType) {
        report.findings.push({
          file: relative(root, file),
          line: index + 1,
          code: 'partition-record-type-mismatch',
          message: `Partition declares '${expectedRecordType}' but record_type is '${String(recordType)}'`
        })
      }

      if (typeof recordType !== 'string' || !validators.has(recordType)) {
        report.findings.push({
          file: relative(root, file),
          line: index + 1,
          code: 'unknown-record-type',
          message: `Unknown record_type: ${String(recordType)}`
        })
        continue
      }

      const validate = validators.get(recordType)!
      const schemaValid = validate(record)
      if (!schemaValid) {
        report.findings.push({
          file: relative(root, file),
          line: index + 1,
          code: 'schema-validation',
          message: ajv.errorsText(validate.errors, { separator: '; ' })
        })
      }

      let textualProfileValid = true
      const kind = record.kind
      if (schemaValid && recordType === 'resource' && typeof kind === 'string' && kind.startsWith('textual.')) {
        if (!sourceDataset?.profiles.has(TEXTUAL_PROFILE_ID)) {
          textualProfileValid = false
          report.findings.push({
            file: relative(root, file),
            line: index + 1,
            code: 'undeclared-textual-profile',
            message: `Resource kind ${kind} requires dataset profile ${TEXTUAL_PROFILE_ID}`
          })
        } else {
          const validateTextualResource = textualValidators.get(kind)
          if (!validateTextualResource) {
            textualProfileValid = false
            report.findings.push({
              file: relative(root, file),
              line: index + 1,
              code: 'unknown-textual-resource-kind',
              message: `Unknown textual resource kind: ${kind}`
            })
          } else if (!validateTextualResource(record)) {
            textualProfileValid = false
            report.findings.push({
              file: relative(root, file),
              line: index + 1,
              code: 'textual-profile-schema-validation',
              message: ajv.errorsText(validateTextualResource.errors, { separator: '; ' })
            })
          }
        }
      }

      let contextualProfileValid = true
      if (schemaValid && recordType === 'resource' && typeof kind === 'string' && kind.startsWith('contextual.')) {
        if (!sourceDataset?.profiles.has(CONTEXTUAL_PROFILE_ID)) {
          contextualProfileValid = false
          report.findings.push({
            file: relative(root, file), line: index + 1, code: 'undeclared-contextual-profile',
            message: `Resource kind ${kind} requires dataset profile ${CONTEXTUAL_PROFILE_ID}`
          })
        } else {
          const validateContextualResource = contextualValidators.get(kind)
          if (!validateContextualResource) {
            contextualProfileValid = false
            report.findings.push({
              file: relative(root, file), line: index + 1, code: 'unknown-contextual-resource-kind',
              message: `Unknown contextual resource kind: ${kind}`
            })
          } else if (!validateContextualResource(record)) {
            contextualProfileValid = false
            report.findings.push({
              file: relative(root, file), line: index + 1, code: 'contextual-profile-schema-validation',
              message: ajv.errorsText(validateContextualResource.errors, { separator: '; ' })
            })
          }
        }
      }

      if (
        schemaValid && recordType === 'resource' && typeof kind === 'string' &&
        !kind.startsWith('contextual.') && advancedValidators.has(kind)
      ) {
        const definition = ADVANCED_PROFILE_BY_KIND[kind]
        const validateAdvancedResource = advancedValidators.get(kind)!
        if (!sourceDataset?.profiles.has(definition.profileId)) {
          report.findings.push({
            file: relative(root, file), line: index + 1, code: 'undeclared-advanced-profile',
            message: `Resource kind ${kind} requires dataset profile ${definition.profileId}`
          })
        } else if (!validateAdvancedResource(record)) {
          report.findings.push({
            file: relative(root, file), line: index + 1, code: 'advanced-profile-schema-validation',
            message: ajv.errorsText(validateAdvancedResource.errors, { separator: '; ' })
          })
        }
      }

      let sourceProfileValid = true
      const source = sourceMetadata(record)
      if (
        schemaValid &&
        recordType === 'resource' &&
        sourceDataset?.profiles.has(SOURCE_PROFILE_ID) &&
        (kind === 'textual.content' || kind === 'textual.artifact') &&
        !source
      ) {
        sourceProfileValid = false
        report.findings.push({
          file: relative(root, file),
          line: index + 1,
          code: 'source-profile-metadata-required',
          message: `Resource kind ${String(kind)} in a ${SOURCE_PROFILE_ID} dataset must declare extensions.source metadata`
        })
      }
      if (schemaValid && recordType === 'resource' && source) {
        if (!sourceDataset?.profiles.has(SOURCE_PROFILE_ID)) {
          sourceProfileValid = false
          report.findings.push({
            file: relative(root, file),
            line: index + 1,
            code: 'undeclared-source-profile',
            message: `Resource source metadata requires dataset profile ${SOURCE_PROFILE_ID}`
          })
        } else if (!validateSourceResource(record)) {
          sourceProfileValid = false
          report.findings.push({
            file: relative(root, file),
            line: index + 1,
            code: 'source-profile-schema-validation',
            message: ajv.errorsText(validateSourceResource.errors, { separator: '; ' })
          })
        }
      }

      if (
        schemaValid &&
        sourceDataset?.profiles.has(TEXTUAL_PROFILE_ID) &&
        recordType === 'evidence' &&
        record.selector &&
        typeof record.selector === 'object' &&
        !Array.isArray(record.selector) &&
        TEXTUAL_SELECTOR_TYPES.has(String((record.selector as Record<string, unknown>).type))
      ) {
        if (!validateTextualSelector(record.selector)) {
          report.findings.push({
            file: relative(root, file),
            line: index + 1,
            code: 'textual-selector-schema-validation',
            message: ajv.errorsText(validateTextualSelector.errors, { separator: '; ' })
          })
        } else {
          for (const finding of validateTextSelector(record.selector, 'selector')) {
            report.findings.push({ file: relative(root, file), line: index + 1, code: finding.code, message: finding.message })
          }
        }
      }

      if (typeof record.id === 'string' && sourceDataset) {
        const previous = recordOwners.get(record.id)
        if (previous) {
          duplicateRecordIds.add(record.id)
          report.findings.push({
            file: relative(root, file),
            line: index + 1,
            code: 'duplicate-canonical-id',
            message: `Duplicate canonical id ${record.id}; first seen in ${previous.file}:${previous.line}`
          })
        } else {
          recordOwners.set(record.id, {
            datasetId: sourceDataset.id,
            datasetVersion: sourceDataset.version,
            file: relative(root, file),
            line: index + 1
          })
          recordValuesById.set(record.id, record)
        }
      }

      if (schemaValid && sourceDataset) {
        for (const finding of await validateSemanticInvariants(record)) {
          report.findings.push({
            file: relative(root, file),
            line: index + 1,
            code: finding.code,
            message: finding.message
          })
        }

        for (const reference of extractCanonicalReferences(record)) {
          pendingReferences.push({
            sourceDatasetId: sourceDataset.id,
            file: relative(root, file),
            line: index + 1,
            field: reference.field,
            targetId: reference.id
          })
        }

        if (
          textualProfileValid &&
          sourceDataset.profiles.has(TEXTUAL_PROFILE_ID) &&
          recordType === 'resource' &&
          typeof kind === 'string' &&
          textualValidators.has(kind)
        ) {
          textualSnapshots.push({
            record,
            datasetId: sourceDataset.id,
            file: relative(root, file),
            line: index + 1
          })
        }

        if (sourceProfileValid && sourceDataset.profiles.has(SOURCE_PROFILE_ID) && recordType === 'resource' && source) {
          sourceSnapshots.push({
            record,
            datasetId: sourceDataset.id,
            file: relative(root, file),
            line: index + 1
          })
        }

        if (recordType === 'provenance') {
          provenanceSnapshots.push({
            record,
            datasetId: sourceDataset.id,
            file: relative(root, file),
            line: index + 1
          })
        }
      }
    }
  }

  const vocabularyIds = await loadVocabularyIds(root)

  for (const reference of pendingReferences) {
    if (vocabularyIds.has(reference.targetId) || datasets.has(reference.targetId)) continue

    const target = recordOwners.get(reference.targetId)
    if (!target) {
      report.findings.push({
        file: reference.file,
        line: reference.line,
        code: 'dangling-canonical-reference',
        message: `Dangling canonical reference ${reference.field} -> ${reference.targetId}`
      })
      continue
    }

    if (duplicateRecordIds.has(reference.targetId)) {
      report.findings.push({
        file: reference.file,
        line: reference.line,
        code: 'ambiguous-canonical-reference',
        message: `Ambiguous canonical reference ${reference.field} -> ${reference.targetId} because the target ID has multiple owners`
      })
      continue
    }

    if (target.datasetId === reference.sourceDatasetId) continue

    const sourceDataset = datasets.get(reference.sourceDatasetId)
    const requiredVersion = sourceDataset?.dependencies.get(target.datasetId)
    if (!requiredVersion) {
      report.findings.push({
        file: reference.file,
        line: reference.line,
        code: 'undeclared-cross-dataset-reference',
        message: `Cross-dataset reference ${reference.field} -> ${reference.targetId} is owned by ${target.datasetId}@${target.datasetVersion}, but ${reference.sourceDatasetId} does not declare that dataset as a direct dependency`
      })
      continue
    }

    if (requiredVersion !== target.datasetVersion) {
      report.findings.push({
        file: reference.file,
        line: reference.line,
        code: 'cross-dataset-reference-version-mismatch',
        message: `Cross-dataset reference ${reference.field} -> ${reference.targetId} requires ${target.datasetId}@${requiredVersion}, but target is provided by ${target.datasetId}@${target.datasetVersion}`
      })
    }
  }

  for (const finding of validateTextualGraphInvariants(textualSnapshots, recordValuesById)) {
    report.findings.push({
      file: finding.snapshot.file,
      line: finding.snapshot.line,
      code: finding.code,
      message: finding.message
    })
  }

  for (const snapshot of sourceSnapshots) {
    for (const finding of validateSourceRecordInvariants(snapshot.record, recordValuesById)) {
      report.findings.push({ file: snapshot.file, line: snapshot.line, code: finding.code, message: finding.message })
    }
  }

  for (const snapshot of provenanceSnapshots) {
    for (const finding of validateProvenanceRecordInvariants(snapshot.record, recordValuesById)) {
      report.findings.push({ file: snapshot.file, line: snapshot.line, code: finding.code, message: finding.message })
    }
  }

  report.valid = report.findings.length === 0
  return report
}
