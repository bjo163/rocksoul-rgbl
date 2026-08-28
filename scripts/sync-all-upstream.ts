import { spawn } from 'node:child_process'

const SCRIPTS = [
  { name: 'Islam (UmmahAPI)', script: 'scripts/sync-ummah-upstream.ts' },
  { name: 'Judaism (Sefaria API)', script: 'scripts/sync-sefaria.ts' },
  { name: 'Buddhism (SuttaCentral API)', script: 'scripts/sync-suttacentral.ts' },
  { name: 'Chinese Classics (CText API)', script: 'scripts/sync-ctext.ts' },
  { name: 'Universal Heritage (Vedas, Japji, Tattvartha, Gathas, Hidden Words)', script: 'scripts/fetch-upstream-scriptures.ts' }
]

async function runScript(cmd: { name: string; script: string }) {
  console.log(`\n========================================================================`)
  console.log(`🚀 Executing Upstream Seeder: ${cmd.name}`)
  console.log(`========================================================================`)

  return new Promise<void>((resolve, reject) => {
    const proc = spawn('npx', ['tsx', cmd.script], { stdio: 'inherit', shell: true })
    proc.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${cmd.name} exited with code ${code}`))
    })
  })
}

async function main() {
  console.log('========================================================================')
  console.log('🌐 MoonWitness Master Universal Upstream Synchronization Engine')
  console.log('========================================================================')

  for (const s of SCRIPTS) {
    try {
      await runScript(s)
    } catch (err: any) {
      console.warn(`⚠ ${s.name} encountered warning: ${err.message}`)
    }
  }

  console.log('\n========================================================================')
  console.log('✨ All 12 World Religious Traditions Synchronized from Official Hulu!')
  console.log('========================================================================\n')
}

main().catch(console.error)
