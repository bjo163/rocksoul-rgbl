import type { FastifyPluginAsync } from 'fastify'
import type { CanonicalId, Evidence, Provenance, Resource } from '@moonwitness/corpus-core'

function canonical(input: string): CanonicalId {
  return input as CanonicalId
}

function sourceRefs(record: unknown): { artifact?: CanonicalId; provenance?: CanonicalId } {
  if (!record || typeof record !== 'object') return {}
  const extensions = (record as { extensions?: unknown }).extensions
  if (!extensions || typeof extensions !== 'object') return {}
  const source = (extensions as { source?: unknown }).source
  if (!source || typeof source !== 'object') return {}
  const artifact = (source as { artifact?: unknown }).artifact
  const provenance = (source as { provenance?: unknown }).provenance
  return {
    artifact: typeof artifact === 'string' ? canonical(artifact) : undefined,
    provenance: typeof provenance === 'string' ? canonical(provenance) : undefined
  }
}

export const recordsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/records/:id', {
    schema: {
      tags: ['Records & Provenance'],
      summary: 'Get Canonical Record',
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      }
    }
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const recordId = canonical(id)
    const record = await fastify.repo.getRecord(recordId)
    if (!record) return reply.code(404).send({ success: false, error: 'record_not_found', id: recordId })
    const datasetId = await fastify.repo.getRecordDataset(recordId)
    return {
      success: true,
      data: {
        record,
        dataset: datasetId ? fastify.repo.getDatasetInfo(datasetId) : null
      }
    }
  })

  fastify.get('/passages/:id', {
    schema: {
      tags: ['Works & Scriptures'],
      summary: 'Get Exact Passage, Contents & Trace',
      description: 'Returns the passage, parallel content lanes, source artifacts, provenance, evidence and textual alignment/variant relations.',
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      }
    }
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const passageId = canonical(id)
    const detail = fastify.repo.getPassageWithContents(passageId)
    if (!detail) return reply.code(404).send({ success: false, error: 'passage_not_found', id: passageId })

    const artifactIds = new Set<CanonicalId>()
    const provenanceIds = new Set<CanonicalId>()
    for (const record of [detail.passage, ...detail.contents]) {
      const refs = sourceRefs(record)
      if (refs.artifact) artifactIds.add(refs.artifact)
      if (refs.provenance) provenanceIds.add(refs.provenance)
    }

    const artifacts = (await Promise.all([...artifactIds].map((ref) => fastify.repo.getResource(ref))))
      .filter((record): record is Resource => Boolean(record))
    for (const artifact of artifacts) {
      const refs = sourceRefs(artifact)
      if (refs.provenance) provenanceIds.add(refs.provenance)
    }
    const provenance = (await Promise.all([...provenanceIds].map((ref) => fastify.repo.getProvenance(ref))))
      .filter((record): record is Provenance => Boolean(record))

    const evidenceMap = new Map<CanonicalId, Evidence>()
    for (const target of [detail.passage.id, ...detail.contents.map((content) => content.id)]) {
      for (const item of fastify.repo.getEvidenceTargeting(target)) evidenceMap.set(item.id, item)
    }
    const relations = fastify.repo.getRelatedTextualResources(passageId)
    const datasetId = await fastify.repo.getRecordDataset(passageId)

    return {
      success: true,
      data: {
        passage: detail.passage,
        contents: detail.contents,
        artifacts,
        provenance,
        evidence: [...evidenceMap.values()],
        relations,
        dataset: datasetId ? fastify.repo.getDatasetInfo(datasetId) : null
      }
    }
  })

  fastify.get('/assertions/:id/traversal', {
    schema: {
      tags: ['Assertions & Evidence'],
      summary: 'Traverse Assertion Evidence',
      description: 'Resolves an assertion to its explicitly referenced evidence and evidence targets.',
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      }
    }
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const assertionId = canonical(id)
    const traversal = await fastify.repo.traverseAssertionEvidence(assertionId)
    if (!traversal) return reply.code(404).send({ success: false, error: 'assertion_not_found', id: assertionId })
    return { success: true, data: traversal }
  })
}
