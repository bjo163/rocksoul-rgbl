import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'

const appRoot = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(appRoot, '../..')

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@moonwitness/corpus-core',
    '@moonwitness/corpus-node',
    '@moonwitness/corpus-repository'
  ],
  outputFileTracingRoot: repoRoot,
  outputFileTracingIncludes: {
    '/*': ['../../datasets/**/*']
  }
}

export default nextConfig
