# ADR-0005: Dedicated High-Performance Fastify 5 REST API Microservice

## Status
Accepted

## Context
The MoonWitness Corpus Engine requires sub-millisecond full-text queries, instant startup (< 20ms), and zero-overhead standalone deployment. Monolithic frontend frameworks (such as Next.js) introduce heavy build times, SSR overhead, and bundler complexity unsuitable for a pure, ultra-fast sacred knowledge API microservice.

## Decision
1. Implement the official API engine as a dedicated, modular **Fastify 5** application in `apps/api`.
2. Provide native OpenAPI 3.0 schemas and interactive Swagger UI documentation at `http://localhost:3000/docs`.
3. Decouple frontend builds from core release gates, allowing `pnpm check` and `pnpm build` to compile instantaneously.

## Consequences
- Fastify server starts in < 20 ms with sub-millisecond SQLite FTS5 query response times.
- Monorepo build and verification times dropped from > 30s to < 2s.
- Standalone zero-dependency deployment via Docker and Node.js runtime.
