import { validateDepth } from '../packages/ingestion/src/depth/depth-validator.js'

async function main() {
  const result = await validateDepth(process.cwd())
  console.log(JSON.stringify(result, null, 2))

  if (!result.valid) {
    process.exit(1)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
