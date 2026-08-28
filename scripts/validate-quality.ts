import { validateCorpus } from '@moonwitness/corpus-ingestion'

async function main() {
  const result = await validateCorpus(process.cwd())
  console.log(JSON.stringify(result, null, 2))
  if (!result.valid) {
    process.exitCode = 1
  }
}

main().catch(err => {
  console.error(err)
  process.exitCode = 1
})
