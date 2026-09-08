# Rocksoul Research Interoperability

## Role

`rocksoul-rgbl` provides the **TEXT / SCRIPTURE / REVELATION-REFERENCE** side of Rocksoul Research.

~~~text
MFTL       STORY       What was told?
LEGEND     EVENT       What happened?
SUPERHERO  PERSON      Who was involved?
RGBL       TEXT        What does the source text say?
~~~

A compact mnemonic is:

~~~text
STORY · EVENT · PERSON · TEXT
~~~

When a consumer specifically works in a revelation-oriented mode, RGBL is the **revelation reference corpus**. The canonical corpus itself remains tradition-neutral.

## Ownership

RGBL owns canonical corpus objects such as:

~~~text
mw:work:...
mw:passage:...
mw:resource:...
mw:assertion:...
mw:evidence:...
mw:provenance:...
mw:assessment:...
~~~

Its primary responsibility is exact text/resource identity, editions/expressions, passage structure, scoped assertions, evidence, provenance, rights, and reproducible ingestion.

RGBL does not own:

~~~text
MYTH-* / narrative research         → MFTL
EVT-* / canonical historical event → LEGEND
PER-* / actor transmission          → SUPERHERO
~~~

## Revelation and authority boundary

RGBL may record that a source, tradition, community, or agent regards a work/passage as:

~~~text
revelation
scripture
canonical
authoritative
inspired
prophetic
~~~

when that status is represented as a **scoped assertion with evidence/provenance**.

RGBL must not silently convert that contextual assertion into one universal theological fact.

This follows existing RGBL ADRs:

- assertions are not unqualified global facts;
- consumer engine policy remains outside canonical corpus truth.

## Downstream analysis

A downstream Rocksoul analysis may combine all four repositories:

~~~text
MFTL narrative claim
        │
        ├──── related historical core ────► LEGEND EVT-*
        │
        ├──── recorded/transmitted by ────► SUPERHERO PER-*
        │
        └──── compared with exact text ───► RGBL mw:passage:*
                                              │
                                              ▼
                                  scoped assertion / evidence
                                              │
                                              ▼
                                  OPTIONAL downstream Mizan
~~~

The comparison itself must preserve the distinction between:

- what a narrative says;
- what historical evidence supports;
- who transmitted or interpreted it;
- what the exact scripture/source passage says;
- what a downstream normative framework concludes.

## Cross-repository notation

Native IDs remain unchanged.

Examples:

~~~text
MFTL
MYTH-MES-INANA-DESCENT-000001

LEGEND
EVT-COL-GUATAVITA-OFFERINGS

SUPERHERO
PER-COL-JUAN-RODRIGUEZ-FREYLE

RGBL
mw:work:quran
mw:passage:...
~~~

When explicit owner qualification is useful in an external graph or document:

~~~text
mftl:MYTH-...
legend:EVT-...
superhero:PER-...
rgbl:mw:work:quran
rgbl:mw:passage:...
~~~

This notation is an interoperability convention only; it does not rename RGBL canonical `mw:*` IDs.

## Independence rule

Each repository must remain independently buildable.

Do not make normal CI remotely dereference every cross-repository target. Validate:

1. local graph integrity locally;
2. external namespace/ID grammar locally where implemented;
3. actual remote target existence during research/audit/integration checks.

This prevents a temporary failure in one repository from breaking all four.

## Non-goals

Do not create a fifth repository solely for shared sources, claims, or IDs.

Do not merge the four repositories into one database just to make cross-references easier.

For v0.1, stable ownership plus explicit provenance-backed links are sufficient.


## Same referent across repositories

RGBL canonical identity is repository-global **inside RGBL**, not automatically global across all Rocksoul repositories.

A single real-world referent may therefore have different domain records:

```text
RGBL mw:person:*
→ corpus identity / labels / external IDs / scoped religious-role assertions

SUPERHERO PER-*
→ actor / witness / authorship / transmission intelligence

MFTL ENTITY-*
→ narrative portrayal / cultural-symbolic entity context

LEGEND EVT-* / ART-* / PLC-*
→ event, material-evidence, or place context
```

Cross-repository identity must be reconciled explicitly. Name similarity, title similarity, shared labels, or matching translations are not sufficient to auto-merge IDs.

Example crosswalk:

```text
rgbl:mw:person:...
↔
superhero:PER-...
```

must carry evidence/provenance and may remain disputed if historical identity is contested.

## Text vs narrative vs event

Keep these layers separate:

```text
RGBL
"this passage says X"
        ↓
MFTL
"this narrative/claim means or retells X"
        ↓
LEGEND
"historical evidence supports / disputes event Y"
        ↓
SUPERHERO
"person Z recorded / transmitted / interpreted it"
```

No layer should silently overwrite another.


## Assessment boundary

RGBL may contain `mw:assessment:*` records when an assessment itself is part of the corpus contract and carries explicit target, assessor/method, evidence, scope, confidence where applicable, and provenance.

That is different from downstream Rocksoul analysis:

```text
RGBL mw:assessment:*
→ contextual corpus assessment
→ method/provenance explicit
→ not a universal normative policy

MFTL Integrity / Deviation / optional Mizan
→ downstream analysis of narrative claims/practices
→ may reference RGBL passages/assertions/evidence
→ remains a separate result
```

**Corpus inclusion ≠ normative admissibility.** A downstream profile may deliberately use only a subset of RGBL works, passages, or source classes. That policy must stay outside canonical RGBL corpus truth.


## Proof case

The first end-to-end four-way integration is:

`CASE-JERUSALEM-70-TEMPLE`

RGBL reuses existing canonical Mark 13:2 passage identities rather than creating integration-specific duplicate text records.

[Read the shared case →](cases/JERUSALEM-70-TEMPLE.md)

## Six-domain ecosystem contract

The current semantic-domain ownership map is:

```text
MFTL       STORY        What was told?
LEGEND     EVENT        What happened?
SUPERHERO  PERSON       Who was involved?
RGBL       TEXT         What does the exact source text say?
AWS        LAW          Was it legally applicable?
JIZZ       PERSPECTIVE  How is the record observed, framed, or situated?
```

Qualified owner notation extends accordingly:

```text
aws:LAW-...
jizz:PERSP-...
correlation:CORR-...
```

RGBL may preserve text in which an observer, community, narrator, court, scholar, or tradition expresses a perspective. That textual presence remains TEXT evidence. A canonical ecosystem PERSPECTIVE record belongs to `rocksoul-jizz`.

```text
TEXTUAL EXPRESSION OF A VIEW ≠ PERSPECTIVE OWNERSHIP
PERSPECTIVE ≠ TEXT
```

## Relationship layer — Correlation

`rocksoul-correlation` owns reviewed RELATIONSHIP semantics between canonical records and the explainability/freshness metadata attached to those edges.

RGBL's own alignments, variants, assertions, evidence and provenance remain TEXT-internal corpus structures. They are not a competing global correlation store.

```text
RGBL alignment / assertion / evidence   local TEXT semantics
correlation:CORR-*                      reviewed ecosystem relationship
```

Correlation must reference RGBL canonical IDs rather than copying exact passages or corpus records into its own data.
