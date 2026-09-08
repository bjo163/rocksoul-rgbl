# RGBL Web Observatory

React + Vite research frontend for **rocksoul-rgbl**.

## Product boundary

- **RGBL** owns canonical TEXT identity, passages, exact content, assertions, evidence, provenance, textual relations, and corpus assessments.
- **@rocksoul/ui** supplies reusable research/application components.
- **rocksoul-assets** is the canonical visual source.
- Missing text is rendered as unavailable. The web app never invents scripture content.
- Translation, source identity, textual correspondence, authority, and theological equivalence remain distinct concepts.

## Runtime architecture

Production has three deterministic data planes, in precedence order:

```text
1. RGBL REST API (when VITE_RGBL_API_URL is configured and healthy)
2. Immutable browser SQLite over HTTP-range/WASM
3. Generated canonical catalog
```

The browser SQLite database is the default production runtime when no REST endpoint is configured. It is generated from the same non-fixture corpus inputs as the server database and includes:

```text
datasets
work / expression / edition / artifact hierarchy
passages
exact searchable content
provenance
evidence
alignment / variant relations
assertions + evidence references
```

Search and passage reads therefore do **not** depend on hardcoded UI fixtures.

### Content-addressed browser database

`scripts/build-browser-search-db.mjs` builds the browser-compatible SQLite database.

`scripts/chunk-browser-search-db.mjs` publishes it as HTTP-range-friendly chunks. GitHub Actions attaches the compressed chunk set to an immutable release named:

```text
browser-db-<corpusHash>
```

At Vercel build time, `apps/web/scripts/ensure-browser-db.mjs` downloads that matching release and serves chunks from:

```text
/corpus-db/<corpusHash>/db.sqlite3.<chunk>
```

The stable `/corpus-db/config.json` always revalidates. Content-addressed chunks may be cached immutably.

## Generated catalog

`scripts/export-web-catalog.mjs` derives `apps/web/public/corpus-catalog.json` from:

```text
datasets/registry.json
dataset manifests
config/upstream-registry.json
config/textual-semantic-rules.json
canonical JSONL records
```

The catalog provides startup metadata, semantic rules, and a safe fallback if the browser database cannot initialize. It is data-derived; it is not a hand-maintained React fallback.

## Stack

```text
React 19
Vite 8
TypeScript strict
sql.js-httpvfs
@rocksoul/ui pinned to reviewed merge 1730eda55564654dc8d4131bbdbf126d0c2d1eca
rocksoul-assets stable visual sync 4050b6b5ea88f187a31a304bf978abfe637db9ce
Node 22
npm 11.6
Vercel
```

The runtime asset provider uses the stable resolver supplied by `@rocksoul/ui`; it does not follow `rocksoul-assets/main`.

## Local development

Install the frontend:

```bash
cd apps/web
npm install
```

A production build materializes both generated data planes automatically:

```bash
npm run build
```

For Vite development against an existing generated/public data plane:

```bash
npm run dev
```

Optionally connect the REST service:

```bash
cp .env.example .env.local
# set VITE_RGBL_API_URL
npm run dev
```

## REST contract

When configured, REST takes precedence over the browser data plane:

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

The same UI continues to work if REST is absent or temporarily unavailable because the full browser graph is separately generated and content-addressed.

## Canonical trace

The interface preserves:

```text
WORK → EXPRESSION → EDITION → ARTIFACT → PASSAGE → CONTENT
```

Passage trace surfaces exact content lanes, artifact and rights metadata, provenance, evidence, explicit alignment/variant relations, and assertion traversal without collapsing those identities.

## Deep links

Research state is shareable:

```text
?work=mw:work:...
?passage=mw:passage:...
?q=mercy
?tradition=islam
```

Parameters can be combined. Search results that resolve to canonical passages can open their trace directly.

## Validation

Frontend validation remains independent from the root pnpm workspace:

```bash
cd apps/web
npm install
npm run typecheck
npm test
npm run build
```

The smoke contract verifies, among other things:

- no hardcoded corpus fallback arrays;
- generated catalog integrity and full-corpus inventory;
- reviewed `@rocksoul/ui` pin;
- stable Rocksoul asset sync;
- full browser graph surfaces;
- dynamic corpus metrics rather than literal counts;
- canonical hierarchy visualization;
- reduced-motion and visible-focus contracts.

Root GitHub Actions also runs the corpus/API `pnpm check` job on Node 22.

## Vercel

The root `vercel.json` builds `apps/web` independently with npm 11.6 and Node 22-compatible dependencies.

No production secret is required for the default browser data plane. `VITE_RGBL_API_URL` is optional and upgrades the runtime to the REST service when supplied.

The generated catalog and browser database are matched by `corpusHash`; a mismatched schema/hash causes the build to fail instead of silently serving mixed corpus versions.

## Rocksoul visual contract

The implementation consumes semantic `@rocksoul/ui` components rather than reproducing domain graphics locally:

```tsx
import "@rocksoul/ui/styles.css"
import {
  DossierHeader,
  EvidenceMatrix,
  MoonWitnessAssetProvider,
  ObservatorySectionNav,
  ParallelTextLanes,
  ProvenanceRail,
  SourceRightsSummary,
  TextualHierarchyTrace,
  TextualRelationTrace,
} from "@rocksoul/ui"
```

Editable RGBL textual-intelligence vector sources live in `rocksoul-assets` under the Penpot design source. Runtime meaning remains accessible semantic HTML/SVG and corpus data; decorative imagery never substitutes for canonical record identity or provenance.
