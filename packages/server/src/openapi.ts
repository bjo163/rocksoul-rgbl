export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'MoonWitness Corpus REST API',
    version: '0.1.0',
    description: 'High-performance Universal Scripture & Devotional API across 12 World Traditions. Over 536,000 canonical records indexed with sub-millisecond query latency.'
  },
  servers: [
    { url: 'http://localhost:3030', description: 'Local Daemon Server' }
  ],
  paths: {
    '/v1/health': {
      get: {
        summary: 'System health check and corpus statistics',
        responses: {
          '200': {
            description: 'Corpus health status and record counts',
            content: { 'application/json': { schema: { type: 'object' } } }
          }
        }
      }
    },
    '/v1/traditions': {
      get: {
        summary: 'List the 12 world traditions and their scriptures',
        responses: {
          '200': {
            description: 'List of world traditions',
            content: { 'application/json': { schema: { type: 'array' } } }
          }
        }
      }
    },
    '/v1/works': {
      get: {
        summary: 'List all canonical scripture works',
        parameters: [
          { name: 'tradition', in: 'query', schema: { type: 'string' }, description: 'Filter by tradition' }
        ],
        responses: {
          '200': {
            description: 'List of works',
            content: { 'application/json': { schema: { type: 'array' } } }
          }
        }
      }
    },
    '/v1/works/{workId}/passages': {
      get: {
        summary: 'Get passages for a specific work with pagination and translations',
        parameters: [
          { name: 'workId', in: 'path', required: true, schema: { type: 'string' }, description: 'Canonical work ID or slug' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Number of verses per page' }
        ],
        responses: {
          '200': {
            description: 'Paginated passage list with parallel translations',
            content: { 'application/json': { schema: { type: 'object' } } }
          }
        }
      }
    },
    '/v1/passages/{passageId}': {
      get: {
        summary: 'Get a specific passage with all parallel translations',
        parameters: [
          { name: 'passageId', in: 'path', required: true, schema: { type: 'string' }, description: 'Canonical passage ID' }
        ],
        responses: {
          '200': {
            description: 'Passage details and parallel contents',
            content: { 'application/json': { schema: { type: 'object' } } }
          }
        }
      }
    },
    '/v1/search': {
      get: {
        summary: 'Full-text search across all 536,000+ corpus records',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' }, description: 'Search term' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Max results' },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 }, description: 'Result offset' }
        ],
        responses: {
          '200': {
            description: 'Search results ranked by relevance',
            content: { 'application/json': { schema: { type: 'object' } } }
          }
        }
      }
    },
    '/v1/devotionals': {
      get: {
        summary: 'List devotionals, authentic supplications (duas), and Asmaul Husna',
        parameters: [
          { name: 'tradition', in: 'query', schema: { type: 'string' }, description: 'Filter by tradition' },
          { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Filter by category' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 }, description: 'Max items' }
        ],
        responses: {
          '200': {
            description: 'List of devotionals',
            content: { 'application/json': { schema: { type: 'array' } } }
          }
        }
      }
    }
  }
}

export function swaggerHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MoonWitness Scripture API — Swagger UI</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://moonwitness.org/favicon.ico" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #0f172a; color: #f8fafc; font-family: sans-serif; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui { filter: invert(88%) hue-rotate(180deg); }
    .swagger-ui .wrapper { max-width: 1100px; padding: 20px; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`
}
