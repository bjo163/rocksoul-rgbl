import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import fp from 'fastify-plugin'
import openTelemetryPlugin from '@autotelic/fastify-opentelemetry'
import { trace, context } from '@opentelemetry/api'
import { randomBytes } from 'node:crypto'

export const tracer = trace.getTracer('@moonwitness/corpus-api', '0.1.0')

export interface TelemetryMetrics {
  totalRequests: number
  requestsByRoute: Record<string, number>
  requestsByStatus: Record<string, number>
  totalDurationMs: number
  avgDurationMs: number
}

class TelemetryMetricsCollector {
  private totalRequests = 0
  private requestsByRoute: Record<string, number> = {}
  private requestsByStatus: Record<string, number> = {}
  private totalDurationMs = 0

  recordRequest(method: string, route: string, statusCode: number, durationMs: number) {
    this.totalRequests++
    const routeKey = `${method} ${route}`
    this.requestsByRoute[routeKey] = (this.requestsByRoute[routeKey] || 0) + 1
    const statusKey = String(statusCode)
    this.requestsByStatus[statusKey] = (this.requestsByStatus[statusKey] || 0) + 1
    this.totalDurationMs += durationMs
  }

  getMetrics(): TelemetryMetrics {
    return {
      totalRequests: this.totalRequests,
      requestsByRoute: { ...this.requestsByRoute },
      requestsByStatus: { ...this.requestsByStatus },
      totalDurationMs: Number(this.totalDurationMs.toFixed(2)),
      avgDurationMs: this.totalRequests > 0 ? Number((this.totalDurationMs / this.totalRequests).toFixed(2)) : 0
    }
  }

  toPrometheusFormat(totalRecords: number, traditionCount: number): string {
    const mem = process.memoryUsage()
    const lines: string[] = [
      '# HELP http_requests_total Total number of HTTP requests processed',
      '# TYPE http_requests_total counter',
      `http_requests_total ${this.totalRequests}`
    ]

    for (const [status, count] of Object.entries(this.requestsByStatus)) {
      lines.push(`http_requests_status_total{status="${status}"} ${count}`)
    }

    for (const [route, count] of Object.entries(this.requestsByRoute)) {
      const [method, path] = route.split(' ')
      lines.push(`http_requests_route_total{method="${method}",path="${path}"} ${count}`)
    }

    lines.push(
      '# HELP corpus_indexed_records_total Total sacred scripture records indexed in SQLite FTS5',
      '# TYPE corpus_indexed_records_total gauge',
      `corpus_indexed_records_total ${totalRecords}`,
      '# HELP corpus_active_traditions_total Total dynamic active traditions loaded',
      '# TYPE corpus_active_traditions_total gauge',
      `corpus_active_traditions_total ${traditionCount}`,
      '# HELP process_memory_rss_bytes Process resident memory size in bytes',
      '# TYPE process_memory_rss_bytes gauge',
      `process_memory_rss_bytes ${mem.rss}`,
      '# HELP process_uptime_seconds Process uptime in seconds',
      '# TYPE process_uptime_seconds gauge',
      `process_uptime_seconds ${process.uptime().toFixed(1)}`
    )

    return lines.join('\n') + '\n'
  }
}

export const telemetryMetrics = new TelemetryMetricsCollector()

const pluginFn: FastifyPluginAsync = async (fastify) => {
  // 1. Register official Fastify OpenTelemetry Plugin
  await fastify.register(openTelemetryPlugin, {
    wrapRoutes: true,
    exposeApi: true
  })

  // 2. Request Timing & OTel Context Injection
  fastify.addHook('onRequest', async (req: FastifyRequest) => {
    (req as any)._startTime = performance.now()
    const incomingTraceparent = req.headers['traceparent'] as string | undefined
    if (incomingTraceparent && incomingTraceparent.startsWith('00-')) {
      const parts = incomingTraceparent.split('-')
      ;(req as any)._traceId = parts[1] || randomBytes(16).toString('hex')
    } else {
      ;(req as any)._traceId = (req.headers['x-trace-id'] as string) || randomBytes(16).toString('hex')
    }
    ;(req as any)._spanId = randomBytes(8).toString('hex')
  })

  // 3. Response Hook: Inject W3C Traceparent & Metrics
  fastify.addHook('onSend', async (req: FastifyRequest, reply: FastifyReply, payload) => {
    const durationMs = performance.now() - ((req as any)._startTime || performance.now())
    const route = req.routeOptions?.url || req.url.split('?')[0] || 'unknown'

    telemetryMetrics.recordRequest(req.method, route, reply.statusCode, durationMs)

    const traceId = (req as any)._traceId || randomBytes(16).toString('hex')
    const spanId = (req as any)._spanId || randomBytes(8).toString('hex')

    reply.header('x-trace-id', traceId)
    reply.header('x-span-id', spanId)
    reply.header('traceparent', `00-${traceId}-${spanId}-01`)
    reply.header('x-response-time-ms', durationMs.toFixed(2))

    return payload
  })

  // 4. Prometheus & OTel Metrics Endpoint
  fastify.get('/metrics', {
    schema: {
      tags: ['Telemetry'],
      summary: 'Prometheus & OpenTelemetry Metrics',
      description: 'Exposes OpenTelemetry and Prometheus format telemetry metrics for monitoring collectors.'
    }
  }, async (req, reply) => {
    const stats = fastify.repo.getStats()
    const traditions = fastify.repo.getTraditions()
    reply.type('text/plain; version=0.0.4; charset=utf-8')
    return telemetryMetrics.toPrometheusFormat(stats.totalRecords, traditions.length)
  })
}

export const telemetryPlugin = fp(pluginFn, {
  name: 'corpus-telemetry'
})
