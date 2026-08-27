import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = { title: 'MoonWitness Corpus Studio', description: 'Git-first curation patch authoring for MoonWitness Corpus.' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}
