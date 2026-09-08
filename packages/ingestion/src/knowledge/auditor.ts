import { KNOWLEDGE_DOMAIN_SCHEMA_VERSION, type KnowledgeAudit, type KnowledgeRelationType } from './types.js'

const relationKeys: KnowledgeRelationType[] = [
  'TRADITION_PERSON', 'TRADITION_WORK', 'TRADITION_EVENT', 'TRADITION_LANGUAGE', 'TRADITION_SOURCE',
  'PERSON_TRADITION', 'PERSON_WORK', 'PERSON_EVENT', 'PERSON_PLACE',
  'EVENT_TRADITION', 'EVENT_PERSON', 'EVENT_WORK', 'EVENT_PLACE', 'EVENT_ERA', 'EVENT_SOURCE'
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
    : a === 'event' && b === 'era' ? 'EVENT_ERA'
    : a === 'event' && b === 'source' ? 'EVENT_SOURCE'
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
  const events = ids('event')
  const eventRecords = records.filter((r) => typeof r.id === 'string' && events.includes(r.id))
  const eventSources = new Map<string, Set<string>>()
  const eventReferences = new Map<string, Set<string>>()
  for (const r of records) {
    const event = r.subject?.startsWith('mw:event:') ? r.subject : r.object?.entity?.startsWith('mw:event:') ? r.object.entity : undefined
    if (event && typeof r.provenance === 'string') (eventSources.get(event) ?? (eventSources.set(event, new Set()), eventSources.get(event)!)).add(r.provenance)
    if (event) for (const source of r.extensions?.timeline?.sourceIds ?? []) if (typeof source === 'string') (eventReferences.get(event) ?? (eventReferences.set(event, new Set()), eventReferences.get(event)!)).add(source)
    if (r.id?.startsWith('mw:event:')) for (const source of r.extensions?.timeline?.sourceIds ?? []) if (typeof source === 'string') (eventReferences.get(r.id) ?? (eventReferences.set(r.id, new Set()), eventReferences.get(r.id)!)).add(source)
  }
  const temporal = eventRecords.map((r) => r.extensions?.timeline?.temporal).filter(Boolean)
  const depth = {
    traditionsWithPersons: new Set(records.flatMap((r) => typeof r.scope?.tradition === 'string' && prefix(r.scope.tradition) === 'tradition' && typeof r.subject === 'string' && prefix(r.subject) === 'person' ? [r.scope.tradition] : [])).size + new Set(records.filter((r) => r.subject && typeof r.object?.entity === 'string' && prefix(r.subject) === 'tradition' && prefix(r.object.entity) === 'person').map((r) => r.subject)).size,
    traditionsWithEvents: new Set(records.filter((r) => r.subject && typeof r.object?.entity === 'string' && prefix(r.subject) === 'tradition' && prefix(r.object.entity) === 'event').map((r) => r.subject)).size,
    traditionsWithWorks: new Set(records.filter((r) => r.subject && typeof r.object?.entity === 'string' && prefix(r.subject) === 'tradition' && prefix(r.object.entity) === 'work').map((r) => r.subject)).size,
    personsWithWorks: new Set(records.filter((r) => r.subject && typeof r.object?.entity === 'string' && prefix(r.subject) === 'person' && prefix(r.object.entity) === 'work').map((r) => r.subject)).size,
    personsWithEvents: new Set(records.filter((r) => r.subject && typeof r.object?.entity === 'string' && prefix(r.subject) === 'person' && prefix(r.object.entity) === 'event').map((r) => r.subject)).size,
    eventsWithTraditions: new Set(records.filter((r) => r.subject && typeof r.object?.entity === 'string' && prefix(r.subject) === 'event' && prefix(r.object.entity) === 'tradition').map((r) => r.subject)).size,
    eventsWithPersons: new Set(records.filter((r) => r.subject && typeof r.object?.entity === 'string' && prefix(r.subject) === 'event' && prefix(r.object.entity) === 'person').map((r) => r.subject)).size,
    worksWithEvents: new Set(records.flatMap((r) => [r.subject, r.object?.entity].filter((id) => typeof id === 'string' && prefix(id) === 'work' && ((r.subject && prefix(r.subject) === 'event') || prefix(r.object?.entity ?? '') === 'event')))).size,
    erasWithEvents: new Set(records.flatMap((r) => [r.subject, r.object?.entity].filter((id) => typeof id === 'string' && prefix(id) === 'era' && ((r.subject && prefix(r.subject) === 'event') || prefix(r.object?.entity ?? '') === 'event')))).size,
    placesWithEvents: new Set(records.flatMap((r) => [r.subject, r.object?.entity].filter((id) => typeof id === 'string' && prefix(id) === 'place' && ((r.subject && prefix(r.subject) === 'event') || prefix(r.object?.entity ?? '') === 'event')))).size,
    eventsWithSources: events.filter((id) => (eventSources.get(id)?.size ?? 0) > 0 || (eventReferences.get(id)?.size ?? 0) > 0).length,
    eventsWithMultipleSources: [...eventReferences.values()].filter((s) => s.size > 1).length,
    eventsWithIndependentSources: 0
  }
  return {
    schemaVersion: KNOWLEDGE_DOMAIN_SCHEMA_VERSION,
    entityCounts: { traditions: count('tradition'), persons: count('person'), events: count('event'), eras: count('era'), works: count('work'), places: count('place'), languages: count('language'), sources: count('source') },
    relationshipCounts: relationCounts,
    depth,
    orphans: { traditions: ids('tradition').filter((id) => !linked.has(id)), persons: ids('person').filter((id) => !linked.has(id)), events: ids('event').filter((id) => !linked.has(id)), works: ids('work').filter((id) => !linked.has(id)) },
    temporal: { datedEvents: temporal.filter((t) => t.precision && t.precision !== 'UNKNOWN').length, approximateEvents: temporal.filter((t) => t.precision === 'APPROXIMATE').length, disputedEvents: temporal.filter((t) => t.status === 'DISPUTED' || t.precision === 'DISPUTED').length, undatedEvents: count('event') - temporal.length }
  }
}
