import { applyReleaseChangePlan } from './release-versioning.js'

const plan = process.argv[2]
if (!plan) throw new Error('Usage: pnpm release:version release/changes/<plan>.json')

await applyReleaseChangePlan(process.cwd(), plan)
console.log(`Applied release plan: ${plan}`)
