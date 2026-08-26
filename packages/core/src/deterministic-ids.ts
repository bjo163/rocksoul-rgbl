import { assertAssertionScope, type AssertionScope } from './assertion-scope.js'
import { assertAssertionObject, type AssertionObject } from './assertion-values.js'
import { assertCanonicalId, formatCanonicalId, parseCanonicalId, type CanonicalId } from './identifiers.js'

export const DETERMINISTIC_ID_RECIPE_VERSION = 'v1' as const
export const DETERMINISTIC_ID_HASH_ALGORITHM = 'sha256' as const
export const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/

export interface ParsedDeterministicId { kind:string; recipeVersion:typeof DETERMINISTIC_ID_RECIPE_VERSION; algorithm:typeof DETERMINISTIC_ID_HASH_ALGORITHM; digest:string }
export interface AssertionIdentityInput { subject:CanonicalId; predicate:CanonicalId; object:AssertionObject; assertion_class:string; scope?:Readonly<AssertionScope>; id?:CanonicalId; record_type?:'assertion'; evidence?:readonly CanonicalId[]; provenance?:CanonicalId; extensions?:Readonly<Record<string,unknown>> }
export interface EvidenceIdentityInput { target:CanonicalId; relation:string; selector?:Readonly<Record<string,unknown>>; id?:CanonicalId; record_type?:'evidence'; provenance?:CanonicalId; extensions?:Readonly<Record<string,unknown>> }

function encodedPrimitive(value:string|number):string { const encoded=JSON.stringify(value); if(encoded===undefined) throw new TypeError('Value cannot be represented as canonical JSON'); return encoded }
function canonicalize(value:unknown, stack:Set<object>):string {
  if(value===null) return 'null'
  if(typeof value==='string') return encodedPrimitive(value)
  if(typeof value==='boolean') return value?'true':'false'
  if(typeof value==='number'){ if(!Number.isFinite(value)) throw new TypeError('Canonical deterministic JSON rejects non-finite numbers'); return encodedPrimitive(value) }
  if(Array.isArray(value)){ if(stack.has(value)) throw new TypeError('Canonical deterministic JSON rejects cyclic structures'); stack.add(value); try{ const encoded:string[]=[]; for(let i=0;i<value.length;i++){ if(!(i in value)) throw new TypeError('Canonical deterministic JSON rejects sparse arrays'); encoded.push(canonicalize(value[i],stack)) } return `[${encoded.join(',')}]` } finally { stack.delete(value) } }
  if(typeof value==='object'){ const object=value as Record<string,unknown>; const proto=Object.getPrototypeOf(object); if(proto!==Object.prototype&&proto!==null) throw new TypeError('Canonical deterministic JSON accepts only plain objects'); if(Object.getOwnPropertySymbols(object).length>0) throw new TypeError('Canonical deterministic JSON rejects symbol keys'); if(stack.has(object)) throw new TypeError('Canonical deterministic JSON rejects cyclic structures'); stack.add(object); try{ const entries=Object.entries(object).sort(([a],[b])=>a<b?-1:a>b?1:0); return `{${entries.map(([k,v])=>`${encodedPrimitive(k)}:${canonicalize(v,stack)}`).join(',')}}` } finally { stack.delete(object) } }
  throw new TypeError(`Unsupported deterministic JSON value type: ${typeof value}`)
}
export function canonicalizeDeterministicJson(value:unknown):string { return canonicalize(value,new Set<object>()) }
export async function sha256Hex(value:string):Promise<string> { const subtle=globalThis.crypto?.subtle; if(!subtle) throw new Error('SHA-256 deterministic IDs require Web Crypto SubtleCrypto support'); const digest=await subtle.digest('SHA-256',new TextEncoder().encode(value)); return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('') }
export async function deterministicCanonicalId(kind:string,payload:unknown):Promise<CanonicalId>{ const digest=await sha256Hex(canonicalizeDeterministicJson(payload)); return formatCanonicalId(kind,DETERMINISTIC_ID_RECIPE_VERSION,DETERMINISTIC_ID_HASH_ALGORITHM,digest) }

function assertionObjectIdentityPayload(object:AssertionObject):Record<string,unknown>{
  assertAssertionObject(object)
  if('entity' in object) return {entity:object.entity}
  const payload:Record<string,unknown>={value:object.value}
  if(object.datatype!==undefined) payload.datatype=object.datatype
  if(object.language!==undefined) payload.language=object.language
  return payload
}

export function assertionIdentityPayload(input:AssertionIdentityInput):Record<string,unknown>{
  assertCanonicalId(input.subject); assertCanonicalId(input.predicate)
  if(typeof input.assertion_class!=='string') throw new TypeError('Assertion class must be a string')
  const payload:Record<string,unknown>={assertion_class:input.assertion_class,object:assertionObjectIdentityPayload(input.object),predicate:input.predicate,record_type:'assertion',subject:input.subject}
  if(input.scope!==undefined){ assertAssertionScope(input.scope); payload.scope={...input.scope} }
  return payload
}
export function evidenceIdentityPayload(input:EvidenceIdentityInput):Record<string,unknown>{ assertCanonicalId(input.target); if(typeof input.relation!=='string') throw new TypeError('Evidence relation must be a string'); const payload:Record<string,unknown>={record_type:'evidence',relation:input.relation,target:input.target}; if(input.selector!==undefined){ if(input.selector===null||Array.isArray(input.selector)||typeof input.selector!=='object') throw new TypeError('Evidence selector must be a plain JSON object when present'); canonicalizeDeterministicJson(input.selector); payload.selector=input.selector } return payload }
export async function deterministicAssertionId(input:AssertionIdentityInput):Promise<CanonicalId>{ return deterministicCanonicalId('assertion',assertionIdentityPayload(input)) }
export async function deterministicEvidenceId(input:EvidenceIdentityInput):Promise<CanonicalId>{ return deterministicCanonicalId('evidence',evidenceIdentityPayload(input)) }
export function parseDeterministicId(value:string):ParsedDeterministicId{ const parsed=parseCanonicalId(value); const [recipeVersion,algorithm,digest]=parsed.segments; if(parsed.segments.length!==3||recipeVersion!==DETERMINISTIC_ID_RECIPE_VERSION||algorithm!==DETERMINISTIC_ID_HASH_ALGORITHM||!SHA256_HEX_PATTERN.test(digest)) throw new TypeError("Invalid deterministic ID: expected 'mw:<kind>:v1:sha256:<64 lowercase hex characters>'"); return {kind:parsed.kind,recipeVersion,algorithm,digest} }
export function isDeterministicId(value:unknown):value is CanonicalId{ if(typeof value!=='string') return false; try{parseDeterministicId(value);return true}catch{return false} }
export async function verifyDeterministicId(value:string,payload:unknown):Promise<boolean>{ let parsed:ParsedDeterministicId; try{parsed=parseDeterministicId(value)}catch{return false}; return (await deterministicCanonicalId(parsed.kind,payload))===value }
