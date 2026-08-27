import type { CanonicalId } from './identifiers.js'
import type { Evidence, EvidenceSelector } from './index.js'

export type P13MentionCandidateReviewState = 'unreviewed' | 'reviewed' | 'rejected'

export interface P13MentionCandidateInput {
  id: CanonicalId
  passage: CanonicalId
  sourceDataset: CanonicalId
  sourceVersion: string
  selector: EvidenceSelector
  mentionText: string
  method: string
  provenance: CanonicalId
  candidateEntity?: CanonicalId
}

export interface P13MentionCandidateExtension {
  status: 'candidate'
  reviewState: 'unreviewed'
  sourceDataset: CanonicalId
  sourceVersion: string
  mentionText: string
  method: string
  candidateEntity?: CanonicalId
  prohibitedAutomaticClaims: ['identity', 'role', 'tradition_membership']
}

export function createP13MentionReviewCandidate(input: P13MentionCandidateInput): Evidence {
  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/u.test(input.sourceVersion)) {
    throw new TypeError(`Mention candidate sourceVersion must be exact semver: ${input.sourceVersion}`)
  }
  const mentionText = input.mentionText.trim()
  if (!mentionText) throw new TypeError('Mention candidate requires the exact mentioned text')
  const method = input.method.trim()
  if (!method) throw new TypeError('Mention candidate requires an extraction method')

  const extension: P13MentionCandidateExtension = {
    status: 'candidate',
    reviewState: 'unreviewed',
    sourceDataset: input.sourceDataset,
    sourceVersion: input.sourceVersion,
    mentionText,
    method,
    candidateEntity: input.candidateEntity,
    prohibitedAutomaticClaims: ['identity', 'role', 'tradition_membership'],
  }

  return {
    id: input.id,
    record_type: 'evidence',
    target: input.passage,
    relation: 'mention_candidate',
    selector: input.selector,
    provenance: input.provenance,
    extensions: { p14_p13: extension },
  }
}

export function isCanonicalizedMentionCandidate(record: Evidence): boolean {
  const extension = record.extensions?.p14_p13 as Partial<P13MentionCandidateExtension> | undefined
  return record.relation !== 'mention_candidate' || extension?.status !== 'candidate'
}
