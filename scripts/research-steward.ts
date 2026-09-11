import { pathToFileURL } from 'node:url';

export type ResearchState = 'discovered' | 'triaged' | 'needs_sources' | 'source_inspected' | 'ready_for_observation';

export interface TextResearchItem {
  id: number | string;
  state: ResearchState;
  witnessInspected?: boolean;
  exactTextIdentityPreserved?: boolean;
  ownershipBoundaryPreserved?: boolean;
  evidenceGain?: number;
  crossDomainValue?: number;
  noveltyValue?: number;
}

export const TEXT_EPISTEMIC_GUARDS = Object.freeze({
  exactWitnessProvenanceRequired: true,
  textualPersonLabelDoesNotResolvePerson: true,
  translationIsNotIdenticalToSourceWitness: true,
  personReasoningMustRemainForeignToTextPass: true,
});

const PRIORITY: Record<ResearchState, number> = {
  ready_for_observation: 100,
  source_inspected: 90,
  needs_sources: 70,
  triaged: 55,
  discovered: 35,
};

export function textWipPressure(items: TextResearchItem[], softLimit = 8, hardLimit = 16) {
  const actionable = items.length;
  return {
    actionable,
    preferProgression: actionable >= softLimit,
    suppressDiscovery: actionable >= hardLimit,
  };
}

export function textRpsV1(item: TextResearchItem, pressure = textWipPressure([item])) {
  const progressionValue = Math.round((PRIORITY[item.state] / 100) * 30);
  const evidenceGain = Math.min(25, Math.max(0, item.evidenceGain ?? (item.witnessInspected ? 10 : 0)));
  const crossDomainValue = Math.min(15, Math.max(0, item.crossDomainValue ?? 0));
  const novelty = Math.min(20, Math.max(0, item.noveltyValue ?? 0));
  const discoveryPenalty = item.state === 'discovered'
    ? pressure.suppressDiscovery ? 30 : pressure.preferProgression ? 15 : 0
    : 0;
  return Math.max(0, Math.min(100, progressionValue + evidenceGain + crossDomainValue + novelty - discoveryPenalty));
}

export function rankTextResearch(items: TextResearchItem[]) {
  const pressure = textWipPressure(items);
  return items
    .map((item) => ({ ...item, rps: textRpsV1(item, pressure) }))
    .sort((a, b) => PRIORITY[b.state] - PRIORITY[a.state] || b.rps - a.rps || String(a.id).localeCompare(String(b.id)));
}

export function nextTextState(item: TextResearchItem): ResearchState {
  if (
    item.state === 'source_inspected'
    && item.witnessInspected
    && item.exactTextIdentityPreserved
    && item.ownershipBoundaryPreserved
  ) return 'ready_for_observation';
  return item.state;
}

function metadata(body: string, key: string) {
  const matches = [...body.matchAll(new RegExp(`${key}:([^\\n]+)`, 'g'))];
  return matches.at(-1)?.[1]?.trim() ?? null;
}

function checked(body: string, text: string) {
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`- \\[x\\] ${escaped}`, 'i').test(body);
}

function signal(issue: { number: number; title: string }, before: ResearchState, after: ResearchState, rps: number, evidence: string[]) {
  return {
    run_id: `RGBL-STEW-${issue.number}`,
    timestamp: new Date().toISOString(),
    slot: 'attestation-bootstrap:TEXT',
    action: before === after ? 'NO_UPDATE' : 'ADVANCED',
    domain: 'TEXT',
    repository: 'rocksoul-rgbl',
    headline: issue.title,
    why_it_matters: 'Preserve exact witness provenance: textual person labels do not resolve PERSON identity, and a translation is not identical to its source witness.',
    evidence_gain: after !== before ? 10 : 0,
    cross_domain_value: 0,
    novelty: 0,
    lifecycle_before: before,
    lifecycle_after: after,
    related_domains: [],
    relationship_handoff: null,
    next_gate: after === 'ready_for_observation' ? 'SOURCE_SCOPED_TEXT_EXTRACTION' : 'WITNESS_OR_EDITION_INSPECTION',
    evidence: [`issue:#${issue.number}`, `rps_v1:${rps}`, ...evidence],
  };
}

async function githubJson(url: string, token: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'user-agent': 'rocksoul-rgbl-steward/0.1',
      'x-github-api-version': '2022-11-28',
      ...(options.headers ?? {}),
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
  return response.json();
}

export async function runTextSteward(repo = process.env.GITHUB_REPOSITORY, token = process.env.GITHUB_TOKEN) {
  if (!repo || !token) throw new Error('GITHUB_REPOSITORY and GITHUB_TOKEN are required');
  const [owner, name] = repo.split('/');
  const issues = await githubJson(`https://api.github.com/repos/${owner}/${name}/issues?state=open&per_page=100`, token) as Array<Record<string, unknown>>;
  const researchIssues = issues.filter((issue) => !issue.pull_request && /^\[(?:AUTO-)?RESEARCH\]/.test(String(issue.title ?? '')));
  const items = researchIssues.map((issue) => {
    const body = String(issue.body ?? '');
    return {
      id: Number(issue.number),
      state: (metadata(body, 'ROCKSOUL-RESEARCH-STATE') ?? 'discovered') as ResearchState,
      witnessInspected: checked(body, 'Actual witness/edition/source content has been inspected'),
      exactTextIdentityPreserved: checked(body, 'Exact-text identity is preserved'),
      ownershipBoundaryPreserved: checked(body, 'TEXT ownership boundary is preserved'),
      evidenceGain: checked(body, 'Actual witness/edition/source content has been inspected') ? 10 : 0,
      issue,
    };
  });
  const ranked = rankTextResearch(items);
  const pressure = textWipPressure(items);
  const signals = [];

  for (const item of ranked) {
    const issue = item.issue as Record<string, unknown>;
    const before = item.state;
    const after = nextTextState(item);
    const evidence = [
      `witness_inspected:${Boolean(item.witnessInspected)}`,
      `exact_text_identity:${Boolean(item.exactTextIdentityPreserved)}`,
      `text_ownership:${Boolean(item.ownershipBoundaryPreserved)}`,
    ];
    if (after !== before) {
      const marker = '## RGBL Steward review';
      let body = String(issue.body ?? '').split(marker)[0].trim();
      body += `\n\n${marker}\n\n- **RPS_V1:** ${item.rps}/100\n- **Decision:** advance_ready_for_observation\n- **Reviewed at:** ${new Date().toISOString()}\n\nROCKSOUL-RESEARCH-STATE:${after}\nRGBL-RESEARCH-STATE:advance_ready_for_observation`;
      await githubJson(`https://api.github.com/repos/${owner}/${name}/issues/${issue.number}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ body }),
      });
    }
    const actionBefore = before === 'discovered' && pressure.suppressDiscovery ? before : before;
    signals.push(signal(
      { number: Number(issue.number), title: String(issue.title ?? '') },
      actionBefore,
      after,
      item.rps,
      before === 'discovered' && pressure.suppressDiscovery ? [...evidence, 'routine_discovery_suppressed_by_wip'] : evidence,
    ));
  }

  const batch = { schema_version: 'rocksoul.research-signal-batch.v1', signals };
  console.log(JSON.stringify(batch, null, 2));
  return batch;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runTextSteward();
}
