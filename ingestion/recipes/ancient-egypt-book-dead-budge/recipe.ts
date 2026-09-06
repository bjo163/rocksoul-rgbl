import type { CorpusRecord } from '@moonwitness/corpus-core'
import type { RecipeHooks } from '@moonwitness/corpus-ingestion'

export const hooks: RecipeHooks<string, string> = {
  parse(bytes) {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    if (!text.includes('PROJECT GUTENBERG EBOOK 7145')) throw new Error('Unexpected Gutenberg payload')
    if (/<(?:html|body|form|script)[\s>]/iu.test(text)) throw new Error('HTML/challenge payload rejected')
    return text
  },
  normalize(value) { return value },
  map() { return [] as CorpusRecord[] },
  validate() { return [] }
}
