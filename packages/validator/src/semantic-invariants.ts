import {
  deterministicAssertionId,
  deterministicEvidenceId,
  isDeterministicId,
  parseCanonicalId,
  type AssertionIdentityInput,
  type EvidenceIdentityInput
} from '@moonwitness/corpus-core'

export interface SemanticInvariantFinding { code:string; message:string }

const FIXED_ID_KIND_BY_RECORD_TYPE: Readonly<Record<string,string>> = {
  assertion:'assertion', evidence:'evidence', provenance:'provenance', assessment:'assessment'
}

function requireNonBlank(findings:SemanticInvariantFinding[], record:Record<string,unknown>, field:string, code:string):void {
  const value=record[field]
  if(typeof value==='string'&&value.trim().length===0) findings.push({code,message:`${field} must contain a non-whitespace semantic value`})
}

function validateLabels(findings:SemanticInvariantFinding[], record:Record<string,unknown>):void {
  if(!Array.isArray(record.labels)) return
  const preferredScopes=new Set<string>()
  for(let index=0; index<record.labels.length; index++){
    const label=record.labels[index]
    if(!label||typeof label!=='object'||Array.isArray(label)) continue
    const v=label as Record<string,unknown>
    if(typeof v.value==='string'&&v.value.trim().length===0) findings.push({code:'blank-label-value',message:`labels[${index}].value must contain non-whitespace text`})
    if(v.role==='preferred'){
      const scope=`${typeof v.language==='string'?v.language:''}\u0000${typeof v.script==='string'?v.script:''}`
      if(preferredScopes.has(scope)) findings.push({code:'duplicate-preferred-label-scope',message:'Only one preferred label is allowed per exact language/script scope'})
      else preferredScopes.add(scope)
    }
  }
}

function validateAssertionLiteral(findings:SemanticInvariantFinding[], record:Record<string,unknown>):void {
  if(!record.object||typeof record.object!=='object'||Array.isArray(record.object)) return
  const object=record.object as Record<string,unknown>
  if(!Object.prototype.hasOwnProperty.call(object,'value')) return
  if(object.language!==undefined&&typeof object.value!=='string') findings.push({code:'literal-language-nonstring',message:'Assertion literal language is valid only when value is a string'})
  if(typeof object.datatype==='string'&&object.datatype.trim().length===0) findings.push({code:'blank-literal-datatype',message:'Assertion literal datatype must contain a non-whitespace semantic value'})
}

function looksLikeDeterministicV1Id(id:string):boolean {
  try { const parsed=parseCanonicalId(id); return parsed.segments[0]==='v1'&&parsed.segments[1]==='sha256' } catch { return false }
}

export async function validateSemanticInvariants(record:Record<string,unknown>):Promise<SemanticInvariantFinding[]> {
  const findings:SemanticInvariantFinding[]=[]
  const recordType=record.record_type
  const id=record.id
  if(typeof recordType!=='string'||typeof id!=='string') return findings

  const fixedKind=FIXED_ID_KIND_BY_RECORD_TYPE[recordType]
  if(fixedKind){ const parsed=parseCanonicalId(id); if(parsed.kind!==fixedKind) findings.push({code:'record-family-id-kind',message:`${recordType} records must use canonical ID kind '${fixedKind}', not '${parsed.kind}'`}) }

  switch(recordType){
    case 'entity': case 'resource': requireNonBlank(findings,record,'kind','nonblank-kind'); validateLabels(findings,record); break
    case 'assertion': requireNonBlank(findings,record,'assertion_class','nonblank-assertion-class'); validateAssertionLiteral(findings,record); break
    case 'evidence': requireNonBlank(findings,record,'relation','nonblank-evidence-relation'); break
    case 'assessment': requireNonBlank(findings,record,'result','nonblank-assessment-result'); requireNonBlank(findings,record,'method','nonblank-assessment-method'); break
  }

  if(record.lifecycle&&typeof record.lifecycle==='object'&&!Array.isArray(record.lifecycle)){
    const replacements=(record.lifecycle as Record<string,unknown>).replacements
    if(Array.isArray(replacements)&&replacements.includes(id)) findings.push({code:'lifecycle-self-replacement',message:'A record must not name its own canonical ID as a lifecycle replacement'})
  }

  if((recordType==='assertion'||recordType==='evidence')&&looksLikeDeterministicV1Id(id)){
    if(!isDeterministicId(id)){ findings.push({code:'malformed-deterministic-id',message:`Deterministic ${recordType} ID must use mw:${recordType}:v1:sha256:<64 lowercase hex>`}); return findings }
    const expected=recordType==='assertion'?await deterministicAssertionId(record as unknown as AssertionIdentityInput):await deterministicEvidenceId(record as unknown as EvidenceIdentityInput)
    if(expected!==id) findings.push({code:'deterministic-id-mismatch',message:`Deterministic ${recordType} ID does not match its v1 semantic identity payload; expected ${expected}`})
  }
  return findings
}
