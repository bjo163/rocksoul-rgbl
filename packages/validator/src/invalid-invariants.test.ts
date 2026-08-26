import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { validateSemanticInvariants } from './semantic-invariants.js'

interface Fixture { name:string; expected:string; record:Record<string,unknown> }
const fixturePath=fileURLToPath(new URL('../../../fixtures/invalid/semantic-invariants.json', import.meta.url))
const fixtures=JSON.parse(await readFile(fixturePath,'utf8')) as Fixture[]

for(const fixture of fixtures){
  test(`invalid invariant fixture: ${fixture.name}`, async()=>{
    const findings=await validateSemanticInvariants(fixture.record)
    assert.equal(findings.some((finding)=>finding.code===fixture.expected),true,JSON.stringify(findings))
  })
}
