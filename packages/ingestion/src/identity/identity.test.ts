import assert from 'node:assert/strict'
import test from 'node:test'
import { formatCanonicalPosition, validateCanonicalPosition } from './canonical-position.js'
import { buildCanonicalRecordId, parseCanonicalRecordId } from './canonical-record-id.js'

test('Identity: formats various canonical scripture positions correctly', () => {
  // Quran
  assert.equal(formatCanonicalPosition({ workId: 'quran', surah: 2, ayah: 255 }), '2:255')

  // Bible / Tanakh
  assert.equal(formatCanonicalPosition({ workId: 'tanakh', book: 'Genesis', chapter: 1, verse: 1 }), 'genesis:1:1')

  // Bhagavad Gita
  assert.equal(formatCanonicalPosition({ workId: 'bhagavad-gita', chapter: 1, verse: 1 }), '1:1')

  // Dhammapada
  assert.equal(formatCanonicalPosition({ workId: 'dhammapada', vagga: 1, verse: 1 }), '1:1')

  // Rigveda
  assert.equal(formatCanonicalPosition({ workId: 'rigveda', mandala: 1, sukta: 1, rik: 1 }), '1:1:1')

  // Talmud Bavli
  assert.equal(formatCanonicalPosition({ workId: 'talmud-bavli', tractate: 'Berakhot', daf: '2a' }), 'berakhot:2a')

  // Mishnah
  assert.equal(formatCanonicalPosition({ workId: 'mishnah', tractate: 'Berakhot', chapter: 1, mishnah: 1 }), 'berakhot:1:1')
})

test('Identity: builds and parses deterministic canonical record IDs', () => {
  const quranId = buildCanonicalRecordId('quran', { workId: 'quran', surah: 2, ayah: 255 })
  assert.equal(quranId, 'mw:quran:2:255')

  const parsed = parseCanonicalRecordId(quranId)
  assert.equal(parsed.prefix, 'mw')
  assert.equal(parsed.workId, 'quran')
  assert.equal(parsed.positionString, '2:255')

  const gitaId = buildCanonicalRecordId('bhagavad-gita', '1:1')
  assert.equal(gitaId, 'mw:bhagavad-gita:1:1')
})

test('Identity: validates canonical positions', () => {
  assert.equal(validateCanonicalPosition({ workId: 'quran', surah: 1, ayah: 1 }), true)
  assert.equal(validateCanonicalPosition({ workId: 'quran' }), false)
})
