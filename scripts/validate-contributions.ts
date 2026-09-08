import { validateContributions } from '../packages/ingestion/src/contribution/contribution-validator.js'

async function main() {
  const result = await validateContributions(process.cwd())
  console.log(JSON.stringify(result, null, 2))

  if (!result.valid) {
    process.exit(1)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
