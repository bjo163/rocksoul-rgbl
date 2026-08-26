import Link from 'next/link'
import type { Assertion, CanonicalId, CorpusRecord } from '@moonwitness/corpus-core'
import type { DatasetDescriptor } from '@moonwitness/corpus-repository'
import {
  assertionObjectText,
  canonicalHref,
  datasetHref,
  displayName,
  recordHref
} from '../lib/presentation.js'

export function Section({ title, children, eyebrow }: { title: string; children: React.ReactNode; eyebrow?: string }) {
  return (
    <section className="section">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
      {children}
    </section>
  )
}

export function CanonicalLink({ id, children }: { id: CanonicalId; children?: React.ReactNode }) {
  return <Link className="canonical-link" href={canonicalHref(id)}>{children ?? id}</Link>
}

export function DatasetLink({ dataset }: { dataset: DatasetDescriptor }) {
  return <Link className="dataset-link" href={datasetHref(dataset.manifest.id)}>{dataset.manifest.id}</Link>
}

export function RecordLink({ record, children }: { record: CorpusRecord; children?: React.ReactNode }) {
  return <Link href={recordHref(record)}>{children ?? displayName(record)}</Link>
}

export function RecordMetadata({ record, dataset }: { record: CorpusRecord; dataset: DatasetDescriptor | null }) {
  return (
    <dl className="metadata-grid">
      <div><dt>Canonical ID</dt><dd><code>{record.id}</code></dd></div>
      <div><dt>Record type</dt><dd>{record.record_type}</dd></div>
      {'kind' in record ? <div><dt>Kind</dt><dd>{record.kind}</dd></div> : null}
      <div><dt>Dataset</dt><dd>{dataset ? <DatasetLink dataset={dataset} /> : 'not recorded'}</dd></div>
      <div><dt>Dataset version</dt><dd>{dataset?.manifest.datasetVersion ?? 'not recorded'}</dd></div>
      <div><dt>Spec version</dt><dd>{dataset?.manifest.specVersion ?? 'not recorded'}</dd></div>
    </dl>
  )
}

export function Labels({ record }: { record: CorpusRecord }) {
  if (!('labels' in record) || !record.labels?.length) return null
  return (
    <ul className="label-list">
      {record.labels.map((label, index) => (
        <li key={`${label.value}-${index}`}>
          <span>{label.value}</span>
          <small>{[label.role, label.language, label.script].filter(Boolean).join(' · ')}</small>
        </li>
      ))}
    </ul>
  )
}

export function ScopeView({ assertion }: { assertion: Assertion }) {
  const entries = Object.entries(assertion.scope ?? {}) as Array<[string, CanonicalId]>
  if (!entries.length) return <span className="muted">unscoped</span>
  return (
    <dl className="scope-list">
      {entries.map(([key, value]) => <div key={key}><dt>{key}</dt><dd><CanonicalLink id={value} /></dd></div>)}
    </dl>
  )
}

export function AssertionCard({ assertion }: { assertion: Assertion }) {
  const objectEntity = 'entity' in assertion.object ? assertion.object.entity : null
  return (
    <article className="assertion-card">
      <div className="assertion-triplet">
        <CanonicalLink id={assertion.subject} />
        <span className="predicate"><CanonicalLink id={assertion.predicate} /></span>
        <span>{objectEntity ? <CanonicalLink id={objectEntity} /> : assertionObjectText(assertion.object)}</span>
      </div>
      <div className="assertion-meta">
        <span>{assertion.assertion_class}</span>
        <Link href={`/assertion/${encodeURIComponent(assertion.id)}`}>Open assertion</Link>
      </div>
      {assertion.scope ? <ScopeView assertion={assertion} /> : null}
    </article>
  )
}

export function JsonBlock({ value }: { value: unknown }) {
  return <pre className="json-block">{JSON.stringify(value, null, 2)}</pre>
}

export function RecordSummary({ record }: { record: CorpusRecord }) {
  return (
    <article className="record-summary">
      <p className="eyebrow">{record.record_type}{'kind' in record ? ` · ${record.kind}` : ''}</p>
      <h3><RecordLink record={record} /></h3>
      {'description' in record && record.description ? <p>{record.description}</p> : null}
      <code>{record.id}</code>
    </article>
  )
}
