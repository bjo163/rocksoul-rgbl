import type { AssertionScope } from './assertion-scope.js'
import type { AssertionObject } from './assertion-values.js'
import type { CanonicalId } from './identifiers.js'
import type { Label } from './labels.js'
import type { RecordLifecycle } from './lifecycle.js'

export * from './identifiers.js'
export * from './deterministic-ids.js'
export * from './identity-boundaries.js'
export * from './dataset-dependencies.js'
export * from './lifecycle.js'
export * from './labels.js'
export * from './assertion-scope.js'
export * from './assertion-values.js'

export interface BaseRecord { id: CanonicalId; record_type: 'entity'|'resource'|'assertion'|'evidence'|'provenance'|'assessment'; lifecycle?: RecordLifecycle }
export interface Entity extends BaseRecord { record_type:'entity'; kind:string; labels?:Label[]; description?:string; extensions?:Record<string,unknown> }
export interface Resource extends BaseRecord { record_type:'resource'; kind:string; labels?:Label[]; description?:string; extensions?:Record<string,unknown> }
export interface Assertion extends BaseRecord { record_type:'assertion'; subject:CanonicalId; predicate:CanonicalId; object:AssertionObject; assertion_class:string; scope?:AssertionScope; evidence?:CanonicalId[]; provenance?:CanonicalId; extensions?:Record<string,unknown> }
export interface EvidenceSelector { type:string; [key:string]:unknown }
export interface Evidence extends BaseRecord { record_type:'evidence'; target:CanonicalId; relation:string; selector?:EvidenceSelector; provenance?:CanonicalId; extensions?:Record<string,unknown> }
export interface Provenance extends BaseRecord { record_type:'provenance'; source:CanonicalId; source_reference?:string; activity?:Record<string,unknown>; extensions?:Record<string,unknown> }
export interface Assessment extends BaseRecord { record_type:'assessment'; target:CanonicalId; result:string; method:string; assessor?:CanonicalId; confidence?:number; evidence?:CanonicalId[]; extensions?:Record<string,unknown> }
export type CorpusRecord = Entity|Resource|Assertion|Evidence|Provenance|Assessment
