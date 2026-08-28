import assert from 'node:assert/strict'
import test from 'node:test'
import { MoonWitness } from './client.js'

test('@moonwitness/sdk provides elegant universal access to scriptures and devotionals', async () => {
  const corpus = await MoonWitness.open()

  // 1. Get Bhagavad Gita verse 1:1
  const gitaVerse = await corpus.passages.get('bhagavad-gita:1:1')
  assert.ok(gitaVerse, 'Gita verse 1:1 must resolve')
  assert.ok(gitaVerse.sourceText?.text.includes('धृतराष्ट्र'), 'Must contain Sanskrit text')
  assert.ok(gitaVerse.englishText?.text, 'Must contain English translation')

  // 2. Get Tao Te Ching Chapter 1
  const taoVerse = await corpus.passages.get('tao-te-ching:1')
  assert.ok(taoVerse, 'Tao Te Ching Chapter 1 must resolve')
  assert.ok(taoVerse.sourceText?.text, 'Must contain Classical Chinese text')

  // 3. Get Hadith Nawawi 1
  const hadith = await corpus.passages.get('hadith:nawawi-40:1')
  assert.ok(hadith, 'Hadith Nawawi 1 must resolve')
  assert.ok(hadith.sourceText?.text, 'Must contain Arabic Hadith text')

  // 4. Test Devotionals (Asmaul Husna)
  const asmaul = await corpus.devotionals.list({ category: 'asmaul-husna', limit: 10 })
  assert.equal(asmaul.length, 10, 'Must return 10 Asmaul Husna')
  assert.equal(asmaul[0].arabic_text, 'الرَّحْمَنُ')

  // 5. Test Paginated Works Passages
  const pageResult = await corpus.works.getPassages('bhagavad-gita', 1, 5)
  assert.equal(pageResult.passages.length, 5, 'Must return 5 passages')

  // 6. Test Search
  const hits = await corpus.search('Rahman', { limit: 5 })
  assert.ok(hits.length >= 1, 'Search must return results')

  corpus.close()
})
