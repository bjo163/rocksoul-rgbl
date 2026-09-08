import test from 'node:test'
import assert from 'node:assert/strict'
import { AdapterRegistry } from './adapters.js'

test('AdapterRegistry rejects duplicate adapters', () => {
  const registry = new AdapterRegistry()
  registry.register({
    id: 'example',
    kind: 'generic',
    parse: (bytes) => bytes,
    normalize: (value) => value,
    map: () => []
  })

  assert.throws(
    () => registry.register({
      id: 'example',
      kind: 'generic',
      parse: (bytes) => bytes,
      normalize: (value) => value,
      map: () => []
    }),
    /Duplicate upstream adapter/
  )
})

test('AdapterRegistry resolves and lists adapters deterministically', () => {
  const registry = new AdapterRegistry()
  registry
    .register({ id: 'z-adapter', kind: 'generic', parse: (bytes) => bytes, normalize: (value) => value, map: () => [] })
    .register({ id: 'a-adapter', kind: 'generic', parse: (bytes) => bytes, normalize: (value) => value, map: () => [] })

  assert.equal(registry.resolve('a-adapter').id, 'a-adapter')
  assert.deepEqual(registry.ids(), ['a-adapter', 'z-adapter'])
  assert.equal(registry.has('z-adapter'), true)
  assert.equal(registry.has('missing'), false)
})

test('default JSON adapter parses UTF-8 JSON', () => {
  const bytes = new TextEncoder().encode('{"ok":true}')
  const registry = new AdapterRegistry()
  registry.register({
    id: 'json',
    kind: 'http_json',
    parse: (input) => JSON.parse(new TextDecoder().decode(input)),
    normalize: (value) => value,
    map: () => []
  })

  assert.deepEqual(registry.resolve('json').parse(bytes, {} as never), { ok: true })
})
