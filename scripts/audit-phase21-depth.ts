import { Phase21DepthAuditor } from '../packages/ingestion/src/depth/phase21-depth-auditor.js'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'

const root=process.cwd(); const result=await new Phase21DepthAuditor(root).runAudit(); await mkdir(path.join(root,'dist'),{recursive:true}); await writeFile(path.join(root,'dist/phase21-depth-report.json'),JSON.stringify(result,null,2)+'\n'); console.log(JSON.stringify(result.totals,null,2)); console.log(JSON.stringify(result.works,null,2));
