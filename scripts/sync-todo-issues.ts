import { readFile, writeFile } from 'node:fs/promises'

const TODO_PATH = process.env.TODO_SYNC_FILE ?? 'TODO.md'
const MARKER_RE = /<!--\s*mw-todo:([A-Za-z0-9._-]+)\s*-->/
const SECTION_RE = /^##\s+(P\d+)\s+—\s+(.+)$/
const TASK_RE = /^(\s*)-\s+\[([ xX])\]\s+(.+?)\s*$/

interface TodoTask {
  id: string
  phase: string
  section: string
  text: string
  checked: boolean
  lineIndex: number
}

interface ParsedTodo {
  content: string
  tasks: TodoTask[]
  changed: boolean
}

interface GitHubIssue {
  number: number
  title: string
  body: string | null
  state: 'open' | 'closed'
  pull_request?: unknown
  labels: Array<string | { name?: string }>
}

const requiredLabels = ['todo-sync', 'roadmap']

function taskMarker(id: string): string {
  return `<!-- mw-todo:${id} -->`
}

function issueTitle(task: TodoTask): string {
  return `[${task.id}] ${task.text}`
}

function issueBody(task: TodoTask): string {
  return `${taskMarker(task.id)}

Synced automatically from \`TODO.md\`.

**Roadmap phase:** ${task.phase} — ${task.section}

**Task:** ${task.text}

### Synchronization contract

- Task text, ordering, and roadmap grouping are owned by \`TODO.md\`.
- Issue open/closed state is synchronized with the TODO checkbox.
- Editing this issue title does not rewrite \`TODO.md\`; the next TODO sync restores the canonical task title.
- Do not remove the hidden \`mw-todo\` marker from this issue body.

See \`docs/TODO_ISSUE_SYNC.md\` for details.`
}

function normalizeLabelNames(labels: GitHubIssue['labels']): string[] {
  return labels
    .map((label) => (typeof label === 'string' ? label : label.name))
    .filter((label): label is string => Boolean(label))
}

async function parseTodo(assignMissingIds: boolean): Promise<ParsedTodo> {
  const original = await readFile(TODO_PATH, 'utf8')
  const lines = original.split(/\r?\n/)

  const maxByPhase = new Map<string, number>()
  const seen = new Set<string>()
  let phase: string | null = null

  for (const line of lines) {
    const section = line.match(SECTION_RE)
    if (section) {
      phase = section[1]
      continue
    }
    if (!phase) continue

    const task = line.match(TASK_RE)
    if (!task) continue
    const marker = line.match(MARKER_RE)
    if (!marker) continue

    const id = marker[1]
    if (seen.has(id)) throw new Error(`Duplicate TODO task id: ${id}`)
    seen.add(id)

    const numeric = id.match(new RegExp(`^${phase}-(\\d+)$`))
    if (numeric) {
      maxByPhase.set(phase, Math.max(maxByPhase.get(phase) ?? 0, Number(numeric[1])))
    }
  }

  phase = null
  let sectionName = ''
  const tasks: TodoTask[] = []
  let changed = false

  for (let index = 0; index < lines.length; index++) {
    const section = lines[index].match(SECTION_RE)
    if (section) {
      phase = section[1]
      sectionName = section[2]
      continue
    }

    // Only numbered roadmap phases P0..Pn are synchronized. Definition-of-done
    // checklists and other Markdown task lists remain documentation-only.
    if (!phase) continue

    const match = lines[index].match(TASK_RE)
    if (!match) continue

    const checked = match[2].toLowerCase() === 'x'
    const existingMarker = lines[index].match(MARKER_RE)
    let id = existingMarker?.[1]
    let text = match[3].replace(MARKER_RE, '').trim()

    if (!id) {
      if (!assignMissingIds) {
        throw new Error(`Missing mw-todo marker in ${phase}: ${text}`)
      }
      const next = (maxByPhase.get(phase) ?? 0) + 1
      maxByPhase.set(phase, next)
      id = `${phase}-${String(next).padStart(3, '0')}`
      lines[index] = `${match[1]}- [${checked ? 'x' : ' '}] ${text} ${taskMarker(id)}`
      changed = true
    }

    if (seen.has(id) && !existingMarker) {
      throw new Error(`Generated duplicate TODO task id: ${id}`)
    }
    seen.add(id)

    tasks.push({ id, phase, section: sectionName, text, checked, lineIndex: index })
  }

  const content = lines.join('\n')
  return { content, tasks, changed: changed || content !== original }
}

function repositoryParts(): { owner: string; repo: string } {
  const full = process.env.GITHUB_REPOSITORY
  if (!full || !full.includes('/')) {
    throw new Error('GITHUB_REPOSITORY must be set to owner/repo')
  }
  const [owner, repo] = full.split('/', 2)
  return { owner, repo }
}

function githubToken(): string {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
  if (!token) throw new Error('GITHUB_TOKEN or GH_TOKEN is required')
  return token
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = githubToken()
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...init.headers
    }
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`GitHub API ${response.status} ${response.statusText}: ${detail}`)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

async function listIssues(): Promise<GitHubIssue[]> {
  const { owner, repo } = repositoryParts()
  const issues: GitHubIssue[] = []
  for (let page = 1; ; page++) {
    const batch = await api<GitHubIssue[]>(
      `/repos/${owner}/${repo}/issues?state=all&per_page=100&page=${page}`
    )
    issues.push(...batch.filter((issue) => !issue.pull_request))
    if (batch.length < 100) break
  }
  return issues
}

async function ensureLabel(name: string, color: string, description: string): Promise<void> {
  const { owner, repo } = repositoryParts()
  const encoded = encodeURIComponent(name)
  const existing = await fetch(`https://api.github.com/repos/${owner}/${repo}/labels/${encoded}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${githubToken()}`,
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })
  if (existing.ok) return
  if (existing.status !== 404) {
    throw new Error(`Unable to inspect label ${name}: ${existing.status} ${await existing.text()}`)
  }
  await api(`/repos/${owner}/${repo}/labels`, {
    method: 'POST',
    body: JSON.stringify({ name, color, description })
  })
}

async function syncTodoToIssues(): Promise<void> {
  const parsed = await parseTodo(true)
  if (parsed.changed) {
    await writeFile(TODO_PATH, parsed.content, 'utf8')
  }

  await ensureLabel('todo-sync', '1D76DB', 'Automatically synchronized with TODO.md')
  await ensureLabel('roadmap', '5319E7', 'MoonWitness Corpus roadmap task')
  for (const phase of new Set(parsed.tasks.map((task) => task.phase))) {
    await ensureLabel(phase, 'BFD4F2', `Roadmap phase ${phase}`)
  }

  const issues = await listIssues()
  const issueByTaskId = new Map<string, GitHubIssue>()
  for (const issue of issues) {
    const marker = issue.body?.match(MARKER_RE)
    if (!marker) continue
    if (issueByTaskId.has(marker[1])) {
      throw new Error(`Multiple GitHub issues claim TODO task ${marker[1]}`)
    }
    issueByTaskId.set(marker[1], issue)
  }

  const { owner, repo } = repositoryParts()
  let created = 0
  let updated = 0

  for (const task of parsed.tasks) {
    const existing = issueByTaskId.get(task.id)

    // Historical completed bootstrap tasks do not need synthetic closed issues.
    if (!existing && task.checked) continue

    const title = issueTitle(task)
    const body = issueBody(task)
    const desiredState: 'open' | 'closed' = task.checked ? 'closed' : 'open'
    const labels = [...requiredLabels, task.phase]

    if (!existing) {
      await api(`/repos/${owner}/${repo}/issues`, {
        method: 'POST',
        body: JSON.stringify({ title, body, labels })
      })
      created++
      continue
    }

    const existingLabels = normalizeLabelNames(existing.labels)
    const mergedLabels = Array.from(new Set([...existingLabels, ...labels])).sort()
    const currentLabels = [...existingLabels].sort()
    const needsUpdate =
      existing.title !== title ||
      existing.body !== body ||
      existing.state !== desiredState ||
      JSON.stringify(currentLabels) !== JSON.stringify(mergedLabels)

    if (needsUpdate) {
      await api(`/repos/${owner}/${repo}/issues/${existing.number}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title,
          body,
          state: desiredState,
          labels: mergedLabels
        })
      })
      updated++
    }
  }

  console.log(
    `TODO → Issues sync complete: ${parsed.tasks.length} tracked tasks, ${created} created, ${updated} updated.`
  )
}

async function syncIssueToTodo(): Promise<void> {
  const eventPath = process.env.GITHUB_EVENT_PATH
  if (!eventPath) throw new Error('GITHUB_EVENT_PATH is required for issue-to-todo sync')

  const event = JSON.parse(await readFile(eventPath, 'utf8')) as {
    issue?: { body?: string | null; state?: 'open' | 'closed'; number?: number }
  }
  const marker = event.issue?.body?.match(MARKER_RE)
  if (!marker) {
    console.log('Issue is not managed by TODO sync; nothing to do.')
    return
  }

  const parsed = await parseTodo(true)
  const task = parsed.tasks.find((candidate) => candidate.id === marker[1])
  if (!task) {
    console.log(`Managed issue references ${marker[1]}, which is no longer in TODO.md; no automatic deletion action taken.`)
    return
  }

  const desiredChecked = event.issue?.state === 'closed'
  const lines = parsed.content.split(/\r?\n/)
  const current = lines[task.lineIndex]
  lines[task.lineIndex] = current.replace(/-\s+\[[ xX]\]/, `- [${desiredChecked ? 'x' : ' '}]`)
  const next = lines.join('\n')

  if (next !== parsed.content || parsed.changed) {
    await writeFile(TODO_PATH, next, 'utf8')
    console.log(`Issue #${event.issue?.number ?? '?'} → TODO sync updated ${task.id}.`)
  } else {
    console.log(`TODO task ${task.id} already matches issue state.`)
  }
}

async function checkTodo(): Promise<void> {
  const parsed = await parseTodo(false)
  console.log(`TODO sync metadata valid: ${parsed.tasks.length} tracked roadmap tasks.`)
}

const mode = process.argv[2]

switch (mode) {
  case 'todo-to-issues':
    await syncTodoToIssues()
    break
  case 'issue-to-todo':
    await syncIssueToTodo()
    break
  case 'check':
    await checkTodo()
    break
  default:
    throw new Error('Usage: sync-todo-issues.ts <todo-to-issues|issue-to-todo|check>')
}
