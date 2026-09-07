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
