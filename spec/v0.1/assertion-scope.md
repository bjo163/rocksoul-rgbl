# Scoped assertions — v0.1

Assertions are not global facts by default. `scope` qualifies the context in which an assertion is being represented without changing evidence or provenance semantics.

The universal core defines exactly five optional dimensions:

- `tradition` — a tradition/perspective context;
- `community` — a community/group context;
- `agent` — an individual or institutional asserting/interpreting agent;
- `period` — a canonical entity representing the relevant historical/temporal period;
- `place` — a canonical place/geographic context.

Every populated scope value is a canonical ID. A present `scope` must contain at least one dimension and unknown keys are rejected.

```json
{
  "scope": {
    "tradition": "mw:tradition:example",
    "community": "mw:community:example"
  }
}
```

Scope is optional. An assertion may be unscoped when its semantics genuinely do not require one. Consumers must not invent a tradition/community scope merely from dataset location or source name.

The core intentionally does not allow free-form literal date ranges inside `period`. Exact/approximate dates, intervals, calendars, and temporal uncertainty require a dedicated temporal contract/profile later. Until then, a named period is referenced through a canonical entity.

Scope is semantic identity for deterministic assertions: changing a scope dimension remints a v1 deterministic assertion ID. Evidence and provenance remain separate and can change without reminting that assertion ID.

Scope does not establish authority, truth, doctrinal weight, or application policy.
