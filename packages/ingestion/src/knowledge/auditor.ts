import { KNOWLEDGE_DOMAIN_SCHEMA_VERSION, type KnowledgeAudit, type KnowledgeRelationType } from './types.js'

const relationKeys: KnowledgeRelationType[] = [
  'TRADITION_PERSON', 'TRADITION_WORK', 'TRADITION_EVENT', 'TRADITION_LANGUAGE', 'TRADITION_SOURCE',
  'PERSON_TRADITION', 'PERSON_WORK', 'PERSON_EVENT', 'PERSON_PLACE',
  'EVENT_TRADITION', 'EVENT_PERSON', 'EVENT_WORK', 'EVENT_PLACE'
]

function prefix(id: string): string {
  return id.split(':')[1] ?? ''
}

function addRelation(counts: Record<KnowledgeRelationType, number>, left: string, right: string): void {
  const a = prefix(left); const b = prefix(right)
  const key = a === 'tradition' && b === 'person' ? 'TRADITION_PERSON'
    : a === 'tradition' && b === 'work' ? 'TRADITION_WORK'
    : a === 'tradition' && b === 'event' ? 'TRADITION_EVENT'
    : a === 'tradition' && b === 'language' ? 'TRADITION_LANGUAGE'
    : a === 'tradition' && b === 'source' ? 'TRADITION_SOURCE'
    : a === 'person' && b === 'tradition' ? 'PERSON_TRADITION'
    : a === 'person' && b === 'work' ? 'PERSON_WORK'
    : a === 'person' && b === 'event' ? 'PERSON_EVENT'
    : a === 'person' && b === 'place' ? 'PERSON_PLACE'
    : a === 'event' && b === 'tradition' ? 'EVENT_TRADITION'
    : a === 'event' && b === 'person' ? 'EVENT_PERSON'
    : a === 'event' && b === 'work' ? 'EVENT_WORK'
    : a === 'event' && b === 'place' ? 'EVENT_PLACE'
    : undefined
  if (key) counts[key] += 1
}

export function auditKnowledgeRecords(records: Array<Record<string, any>>): KnowledgeAudit {
  const entities = new Map<string, string>()
  const relationCounts = Object.fromEntries(relationKeys.map((key) => [key, 0])) as Record<KnowledgeRelationType, number>
  const linked = new Set<string>()
  for (const record of records) {
    if (typeof record.id !== 'string') continue
    const kind = typeof record.kind === 'string' ? record.kind : ''
    if (['tradition', 'person', 'event', 'era', 'work', 'place', 'language', 'source'].includes(prefix(record.id))) entities.set(record.id, prefix(record.id))
    const object = record.object?.entity ?? record.object?.id
    if (typeof record.subject === 'string' && typeof object === 'string') {
      addRelation(relationCounts, record.subject, object)
      if (['tradition', 'person', 'event', 'work', 'place', 'language', 'source'].includes(prefix(record.subject)) && ['tradition', 'person', 'event', 'work', 'place', 'language', 'source'].includes(prefix(object))) {
        linked.add(record.subject); linked.add(object)
      }
    }
    if (typeof record.subject === 'string' && typeof record.scope?.tradition === 'string') {
      addRelation(relationCounts, record.scope.tradition, record.subject)
      if (prefix(record.scope.tradition) === 'tradition' && prefix(record.subject) === 'person') {
        linked.add(record.scope.tradition); linked.add(record.subject)
      }
    }
    const textual = record.extensions?.textual
    if (textual && typeof record.id === 'string') {
      for (const value of Object.values(textual)) if (typeof value === 'string' && entities.has(value)) linked.add(value)
    }
    void kind
  }
  const count = (kind: string) => [...entities.values()].filter((value) => value === kind).length
  const ids = (kind: string) => [...entities.entries()].filter(([, value]) => value === kind).map(([id]) => id).sort()
  const depth = {
    traditionsWithPersons: new Set(records.flatMap((r) => typeof r.scope?.tradition === 'string' && prefix(r.scope.tradition) === 'tradition' && typeof r.subject === 'string' && prefix(r.subject) === 'person' ? [r.scope.tradition] : [])).size + new Set(records.filter((r) => r.subject && typeof r.object?.entity === 'string' && prefix(r.subject) === 'tradition' && prefix(r.object.entity) === 'person').map((r) => r.subject)).size,
    traditionsWithEvents: new Set(records.filter((r) => r.subject && typeof r.object?.entity === 'string' && prefix(r.subject) === 'tradition' && prefix(r.object.entity) === 'event').map((r) => r.subject)).size,
    traditionsWithWorks: new Set(records.filter((r) => r.subject && typeof r.object?.entity === 'string' && prefix(r.subject) === 'tradition' && prefix(r.object.entity) === 'work').map((r) => r.subject)).size,
    personsWithWorks: new Set(records.filter((r) => r.subject && typeof r.object?.entity === 'string' && prefix(r.subject) === 'person' && prefix(r.object.entity) === 'work').map((r) => r.subject)).size,
    personsWithEvents: new Set(records.filter((r) => r.subject && typeof r.object?.entity === 'string' && prefix(r.subject) === 'person' && prefix(r.object.entity) === 'event').map((r) => r.subject)).size,
    eventsWithTraditions: new Set(records.filter((r) => r.subject && typeof r.object?.entity === 'string' && prefix(r.subject) === 'event' && prefix(r.object.entity) === 'tradition').map((r) => r.subject)).size,
    eventsWithPersons: new Set(records.filter((r) => r.subject && typeof r.object?.entity === 'string' && prefix(r.subject) === 'event' && prefix(r.object.entity) === 'person').map((r) => r.subject)).size
  }
  return {
    schemaVersion: KNOWLEDGE_DOMAIN_SCHEMA_VERSION,
    entityCounts: { traditions: count('tradition'), persons: count('person'), events: count('event'), eras: count('era'), works: count('work'), places: count('place'), languages: count('language'), sources: count('source') },
    relationshipCounts: relationCounts,
    depth,
    orphans: { traditions: ids('tradition').filter((id) => !linked.has(id)), persons: ids('person').filter((id) => !linked.has(id)), events: ids('event').filter((id) => !linked.has(id)), works: ids('work').filter((id) => !linked.has(id)) },
    temporal: { datedEvents: 0, approximateEvents: 0, disputedEvents: 0, undatedEvents: count('event') }
  }
}
