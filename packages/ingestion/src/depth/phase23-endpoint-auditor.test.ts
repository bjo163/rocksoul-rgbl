import assert from 'node:assert/strict'
import test from 'node:test'
import { Phase23EndpointAuditor } from './phase23-endpoint-auditor.js'
test('Phase 23 accounts for every edition and preserves evidence levels', async()=>{const r=await new Phase23EndpointAuditor(process.cwd()).runAudit();assert.equal(r.summary.registered,618);assert.equal(r.inventory.length,618);assert.equal(r.summary.payloadRetained,38);assert.equal(r.summary.unmeasurable,580);assert.equal(Object.values(r.reasons).reduce((a,b)=>a+b,0),580);assert.ok(r.inventory.some(x=>x.association==='CANDIDATE'));assert.ok(r.inventory.some(x=>x.association==='CONFIRMED'))})
