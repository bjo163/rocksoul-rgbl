# 🚀 @moonwitness/corpus-api

Modular, ultra-high-throughput Fastify 5 REST API Microservice for the **MoonWitness Universal Scripture Corpus**.

---

## 🌟 Key Capabilities

- **Sub-Millisecond Queries**: Sub-millisecond FTS5 search across **537,512+ sacred records**.
- **Full OpenTelemetry (OTel)**: Automatic W3C `traceparent` context propagation, `x-trace-id`, and Prometheus metrics exporter on `GET /metrics`.
- **Dynamic Traditions**: Zero static limit — dynamically aggregates all active world religious traditions from SQLite and upstream registry.
- **Interactive Swagger UI**: Interactive API documentation at `http://localhost:3000/docs`.

---

## 🚀 Quick Start

```bash
# Start server in production mode:
pnpm serve

# Start server in development mode:
pnpm api:dev
```

Server runs by default on `http://0.0.0.0:3000`.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/docs` | Interactive Swagger UI API documentation |
| `GET` | `/metrics` | Prometheus & OpenTelemetry metrics exporter |
| `GET` | `/v1/health` | Healthcheck, memory RSS, and database record stats |
| `GET` | `/v1/traditions` | Dynamic list of active world religious traditions |
| `GET` | `/v1/works` | List all sacred works and scriptures |
| `GET` | `/v1/works/:id/passages` | Get paginated passages/verses for a work |
| `GET` | `/v1/search?q={query}` | High-speed FTS5 full-text search |
| `GET` | `/v1/devotionals?tradition=islam` | Duas, Asmaul Husna, and sacred invocations |
| `GET` | `/v1/compare?theme={theme}` | Parallel wisdom comparison across traditions |

---

## 🔭 OpenTelemetry Tracing Example

Every outgoing response includes standard W3C trace headers:

```http
HTTP/1.1 200 OK
content-type: application/json; charset=utf-8
x-trace-id: 9a7b2c5d1e4f8a0b3c6d9e2f5a8b1c4d
x-span-id: 4e7a1b9c3f5d2e80
traceparent: 00-9a7b2c5d1e4f8a0b3c6d9e2f5a8b1c4d-4e7a1b9c3f5d2e80-01
x-response-time-ms: 0.92
```
