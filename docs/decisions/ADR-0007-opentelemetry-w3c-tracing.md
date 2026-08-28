# ADR-0007: OpenTelemetry (OTel) Distributed Tracing and Prometheus Metrics

## Status
Accepted

## Context
Production deployments of the MoonWitness Corpus API require complete observability, request tracing, latency monitoring, and W3C context propagation across distributed microservices.

## Decision
1. Integrate `@autotelic/fastify-opentelemetry` and `@opentelemetry/api` globally across the Fastify instance in `apps/api/src/plugins/telemetry.ts`.
2. Automatically attach W3C TraceContext headers (`traceparent`, `x-trace-id`, `x-span-id`, `x-response-time-ms`) to every outgoing HTTP response in the `onSend` hook.
3. Expose standard Prometheus and OTel format metrics on `GET /metrics` and `GET /v1/metrics`.

## Consequences
- Full distributed tracing compatibility with OpenTelemetry collectors, Jaeger, Datadog, and Grafana.
- Real-time monitoring of query counts, route response times, RSS memory usage, and active tradition stats.
