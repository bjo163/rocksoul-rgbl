import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const TODO_PATH = process.env.TODO_SYNC_FILE ?? 'TODO.md'
const MARKER_RE = /<!--\s*mw-todo:([A-Za-z0-9._-]+)\s*-->/
const TASK_RE = /^(\s*)-\s+\[([ xX])\]\s+(.+?)\s*$/

export interface GitHubIssue {
  number: number
  body: string | null
  state: 'open' | 'closed'
  pull_request?: unknown
}

function repositoryParts(): { owner: string; repo: string } {
  const full = process.env.GITHUB_REPOSITORY
  if (!full || !full.includes('/')) throw new Error('GITHUB_REPOSITORY must be set to owner/repo')
  const [owner, repo] = full.split('/', 2)
  return { owner, repo }
}

function githubToken(): string {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
  if (!token) throw new Error('GITHUB_TOKEN or GH_TOKEN is required')
  return token
}

async function api<T>(path: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${githubToken()}`,
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })
  if (!response.ok) throw new Error(`GitHub API ${response.status}: ${await response.text()}`)
  return (await response.json()) as T
}

async function listIssues(): Promise<GitHubIssue[]> {
  const { owner, repo } = repositoryParts()
  const issues: GitHubIssue[] = []
  for (let page = 1; ; page += 1) {
    const batch = await api<GitHubIssue[]>(`/repos/${owner}/${repo}/issues?state=all&per_page=100&page=${page}`)
    issues.push(...batch.filter((issue) => !issue.pull_request))
    if (batch.length < 100) break
  }
  return issues
}

export function reconcileTodoContent(content: string, issues: GitHubIssue[]): { content: string; changed: number } {
  const stateByTaskId = new Map<string, 'open' | 'closed'>()
  for (const issue of issues) {
    const marker = issue.body?.match(MARKER_RE)
    if (!marker) continue
    if (stateByTaskId.has(marker[1])) throw new Error(`Multiple GitHub issues claim TODO task ${marker[1]}`)
    stateByTaskId.set(marker[1], issue.state)
  }

  const lines = content.split(/\r?\n/)
  let changed = 0
  for (let index = 0; index < lines.length; index += 1) {
    const task = lines[index].match(TASK_RE)
    const marker = lines[index].match(MARKER_RE)
    if (!task || !marker) continue

    const issueState = stateByTaskId.get(marker[1])
    if (!issueState) continue
    const desired = issueState === 'closed' ? 'x' : ' '
    if (task[2].toLowerCase() === desired.toLowerCase()) continue

    lines[index] = lines[index].replace(/-\s+\[[ xX]\]/, `- [${desired}]`)
    changed += 1
  }
  return { content: lines.join('\n'), changed }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const original = await readFile(TODO_PATH, 'utf8')
  const issues = await listIssues()
  const reconciled = reconcileTodoContent(original, issues)
  if (reconciled.changed > 0) await writeFile(TODO_PATH, reconciled.content, 'utf8')
  console.log(`Issues → TODO reconciliation complete: ${reconciled.changed} checkbox(es) updated.`)
}
