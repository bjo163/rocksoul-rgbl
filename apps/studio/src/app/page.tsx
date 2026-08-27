'use client'

import { useMemo, useState } from 'react'
import { buildCurationOverlay, type PatchOperation } from '../lib/patch'

export default function StudioPage() {
  const [operation, setOperation] = useState<PatchOperation>('replace')
  const [target, setTarget] = useState('mw:content:example:1')
  const [path, setPath] = useState('/extensions/textual/text')
  const [reason, setReason] = useState('')
  const [curator, setCurator] = useState('mw:person:curator')
  const [provenance, setProvenance] = useState('mw:provenance:review')
  const [value, setValue] = useState('')
  const result = useMemo(() => {
    try { return JSON.stringify(buildCurationOverlay({ operation, target, path, reason, curator, provenance, value }), null, 2) }
    catch (error) { return `// ${error instanceof Error ? error.message : 'Complete the required fields.'}` }
  }, [operation, target, path, reason, curator, provenance, value])

  return <main>
    <p className="eyebrow">Git-first curation studio</p>
    <h1>Author a reviewable dataset patch.</h1>
    <p className="muted">MoonWitness Studio generates a curation overlay for a pull request. It does not save hidden database state or silently edit generated corpus output.</p>
    <div className="notice">Commit the generated JSON under the relevant recipe or dataset, run validation, and open a normal reviewable PR.</div>
    <div className="layout">
      <section className="card"><h2>Patch details</h2><form>
        <label>Operation<select value={operation} onChange={(e) => setOperation(e.target.value as PatchOperation)}><option value="replace">replace</option><option value="add">add</option><option value="remove">remove</option></select></label>
        <label>Target canonical ID<input value={target} onChange={(e) => setTarget(e.target.value)} /></label>
        <label>JSON Pointer path<input value={path} onChange={(e) => setPath(e.target.value)} /></label>
        <label>Reason<input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this correction needed?" /></label>
        <label>Curator canonical ID<input value={curator} onChange={(e) => setCurator(e.target.value)} /></label>
        <label>Provenance canonical ID<input value={provenance} onChange={(e) => setProvenance(e.target.value)} /></label>
        {operation !== 'remove' && <label>Replacement value<textarea value={value} onChange={(e) => setValue(e.target.value)} /></label>}
      </form></section>
      <section className="card"><h2>Reviewable overlay</h2><p className="muted">Copy this JSON into a tracked curation overlay file and review it in Git.</p><pre>{result}</pre></section>
    </div>
  </main>
}
