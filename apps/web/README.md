# RGBL Web Observatory

React + Vite frontend for **rocksoul-rgbl**.

## Product boundary

- **RGBL** owns canonical TEXT identity, passages, content, assertions, evidence, provenance, and corpus assessments.
- **@rocksoul/ui** supplies reusable research/application components.
- **rocksoul-assets** is the canonical visual source.
- Missing text is rendered as unavailable. The web app never invents scripture content.
- Translation, source identity, textual correspondence, and theological equivalence remain distinct concepts.

## Stack

```text
React 19
Vite 8
TypeScript strict
@rocksoul/ui pinned to reviewed commit c7d3402614408c9812a7ab5370873dab3f821a2f
rocksoul-assets stable release v1.3.1 / commit 82f20b8a361a19abdc6591fe2f4c67e3fb9d4b05
Node 22
Vercel
```

The runtime asset provider deliberately uses the stable resolver built into `@rocksoul/ui`; it does not follow `rocksoul-assets/main`.

## Local development

```bash
cd apps/web
npm install
cp .env.example .env.local
npm run dev
```

Without `VITE_RGBL_API_URL`, the app runs in metadata-only fallback mode.

## Live RGBL REST contract

Set:

```bash
VITE_RGBL_API_URL=http://localhost:3000
```

The current UI consumes:

```text
GET /v1/health
GET /v1/traditions
GET /v1/works
GET /v1/works/:id
GET /v1/works/:id/passages?limit=&offset=
GET /v1/passages/:id
GET /v1/search?q=&tradition=&limit=&offset=
GET /v1/assertions/:id/traversal
```

The passage detail response exposes canonical passage identity, parallel content lanes, artifacts, rights/source metadata, provenance, evidence, and explicit alignment/variant relations. The work detail response preserves:

```text
WORK → EXPRESSION → EDITION → ARTIFACT → PASSAGE → CONTENT
```

After changing textual hierarchy/indexing code, rebuild the derived database:

```bash
pnpm build:sqlite
```

## Deep links

Research state is shareable without inventing a client-side route hierarchy:

```text
?work=mw:work:...
?passage=mw:passage:...
?q=mercy
?tradition=islam
```

Parameters can be combined.

## Validation

Frontend validation is independent from the corpus pnpm workspace:

```bash
cd apps/web
npm install
npm run typecheck
npm test
npm run build
```

`npm test` runs a lightweight contract smoke check for canonical IDs, stable Rocksoul dependency pins, API surfaces, semantic evidence labeling, language/direction metadata, focus visibility, and reduced-motion support.

The root GitHub Actions workflow runs both the corpus/API `pnpm check` job and this independent web job on Node 22.

## Vercel

The repository root `vercel.json` builds `apps/web` independently with npm. `apps/web` remains excluded from the root pnpm workspace so frontend dependencies do not alter the corpus engine lockfile.

Production requires `VITE_RGBL_API_URL` to point to a separately deployed RGBL REST service if exact corpus text is expected. A failed or absent API automatically degrades to metadata-only mode and is visibly labeled.

## Rocksoul design contract

The implementation consumes semantic components from `@rocksoul/ui`, including:

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

Research meaning remains semantic HTML/data. Assets support the interface rather than embedding claims into decorative imagery.
