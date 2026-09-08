import { validatePhase18Ownership } from '../packages/ingestion/src/depth/phase18-ownership-validator.js'

async function main() {
  const result = await validatePhase18Ownership(process.cwd())
  console.log(JSON.stringify(result, null, 2))
  if (!result.valid) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
