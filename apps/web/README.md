# RGBL Web Observatory

React + Vite frontend for **rocksoul-rgbl**.

## Product boundary

- **RGBL** owns canonical TEXT identity, passages, assertions, evidence and provenance.
- **@rocksoul/ui** supplies reusable application/research components.
- **rocksoul-assets** is the canonical visual source.
- This frontend does not duplicate scripture text when the live API is unavailable.

## Stack

```text
React 19
Vite 8
TypeScript strict
@rocksoul/ui (Git dependency, main)
rocksoul-assets (canonical remote asset base)
Vercel
```

## Local development

```bash
cd apps/web
npm install
npm run dev
```

## Live API

The UI remains usable with curated metadata fallback. To enable live traditions, works, passage lists and FTS5 search:

```bash
VITE_RGBL_API_URL=https://your-rgbl-api.example.com npm run dev
```

The configured service must expose the RGBL REST contract:

```text
GET /v1/traditions
GET /v1/works
GET /v1/works/:id/passages
GET /v1/search?q=...
```

## Build

```bash
npm run typecheck
npm run build
```

The repository root `vercel.json` builds this app independently with npm. `apps/web` is intentionally excluded from the corpus pnpm workspace so the existing engine/API lockfile and Turbo build contract remain unchanged.

## Design consumption

```tsx
import "@rocksoul/ui/styles.css"
import {
  DossierHeader,
  EvidenceMatrix,
  MoonWitnessAssetProvider,
  ObservatorySectionNav,
  ProvenanceRail,
} from "@rocksoul/ui"
```

Runtime assets resolve from the canonical Rocksoul source:

```text
https://raw.githubusercontent.com/bjo163/rocksoul-assets/main/moonwitness
```

The UI uses semantic HTML as the research truth; visual assets support those semantics rather than embedding claims in images.
