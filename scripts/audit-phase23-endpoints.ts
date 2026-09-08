import { Phase23EndpointAuditor } from '../packages/ingestion/src/depth/phase23-endpoint-auditor.js'
const r=await new Phase23EndpointAuditor(process.cwd()).writeReport();console.log(JSON.stringify(r.summary,null,2));console.log(JSON.stringify(r.reasons,null,2))
