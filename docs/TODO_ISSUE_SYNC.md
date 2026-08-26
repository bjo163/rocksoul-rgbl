# TODO ↔ GitHub Issues synchronization

MoonWitness Corpus keeps `TODO.md` and GitHub Issues synchronized automatically.

The synchronization intentionally has **split ownership** instead of treating both sides as fully editable copies of one document:

- `TODO.md` owns task identity, canonical task text, ordering, and roadmap phase.
- GitHub Issues own day-to-day discussion and open/closed workflow state.
- The TODO checkbox and issue open/closed state are bidirectional.

This prevents issue-title edits, bot formatting, or discussion metadata from silently rewriting the roadmap document.

## Stable task identity

Every roadmap checkbox under a `P<n>` section receives a hidden stable marker:

```md
- [ ] Define canonical ID grammar. <!-- mw-todo:P1-001 -->
```

The same marker is embedded in the synchronized issue body:

```html
<!-- mw-todo:P1-001 -->
```

The marker, not the issue number or task text, is the synchronization identity. Once assigned, do not change or reuse it for a different task.

New tasks without markers are assigned the next available ID in their phase automatically. Reordering tasks does not change existing IDs.

## TODO → Issues

The workflow runs when `TODO.md` or the sync implementation changes on `main`, and can also be started manually with `workflow_dispatch`.

For every roadmap task under `P0`, `P1`, ...:

1. assign a stable marker when missing;
2. find the GitHub Issue carrying the same marker;
3. create an issue when an unchecked task does not yet have one;
4. update the issue title/body when canonical TODO text or phase changes;
5. close the issue when the TODO checkbox becomes checked;
6. reopen the issue when the TODO checkbox becomes unchecked;
7. ensure `todo-sync`, `roadmap`, and phase labels such as `P1` exist.

Already-completed historical tasks that never had an issue are not backfilled as synthetic closed issues.

## Issue → TODO

When a managed issue is closed or reopened:

1. the workflow reads its `mw-todo` marker;
2. locates the matching checkbox in `TODO.md`;
3. closing the issue checks the task;
4. reopening the issue unchecks the task;
5. the bot commits only the resulting `TODO.md` status/marker change.

Issues without an `mw-todo` marker are ignored.

## Loop prevention

The workflow uses the repository `GITHUB_TOKEN`. GitHub does not normally create a new workflow run for events caused by that token, which prevents the bot commit/issue update from recursively triggering itself.

The workflow additionally uses one concurrency group so TODO/issue changes are serialized rather than racing each other.

## Deleting or replacing tasks

Deletion is intentionally conservative.

Removing a task from `TODO.md` does **not** automatically delete or close its GitHub Issue. The old issue remains an audit/discussion record and the synchronizer logs that the marker is no longer present.

For cancelled work, prefer closing the issue explicitly and documenting the reason before removing or replacing the roadmap task.

Never reuse an old task ID for unrelated work.

## Manual commands

The same implementation can be run from a checkout:

```bash
# Requires GITHUB_TOKEN/GH_TOKEN and GITHUB_REPOSITORY=owner/repo
pnpm todo:sync

# Validate that all currently tracked roadmap tasks have stable markers
pnpm todo:check
```

`pnpm todo:sync:issue` is intended for the GitHub `issues` event because it reads `GITHUB_EVENT_PATH`.

## Security and permissions

The workflow declares only the permissions it needs:

```yaml
permissions:
  contents: write
  issues: write
```

No personal access token is required for the normal repository-local synchronization path.

If branch protection later prevents `github-actions[bot]` from committing checkbox changes to `main`, change the reverse-sync path to create/update a bot PR, or authenticate with a dedicated GitHub App under an explicit governance decision. Do not silently bypass branch protection.

## Source files

- workflow: `.github/workflows/todo-issues-sync.yml`
- implementation: `scripts/sync-todo-issues.ts`
- canonical task list: `TODO.md`
