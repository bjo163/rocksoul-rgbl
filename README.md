<div align="center">

# RGBL

## SCRIPTURE & REVELATION REFERENCE INTELLIGENCE

### **TRACE THE TEXT.**

A provenance-first **multi-tradition text, scripture, sacred-literature, and evidence corpus** for exact passages, editions, expressions, scoped assertions, source provenance, and reproducible downstream use.

**ROCKSOUL RESEARCH · STORY × EVENT × PERSON × TEXT**

</div>

---

> **RGBL preserves what the source text says before any downstream engine decides how to weigh it.**

A text can exist in the corpus without being authoritative for every consumer.  
A community can call a work revelation without turning that scoped claim into universal corpus truth.  
A translation is not the source text.  
A textual parallel is not identity.  
An assessment is not a universal verdict.  
A corpus record is not a Mizan policy.

That separation is the foundation of RGBL.

## Core question

```text
WHAT is the exact work / expression / edition?
WHAT passage or content segment?
WHICH language and script?
WHICH source artifact?
WHAT rights permit use?
WHAT provenance produced this record?
WHAT scoped assertion does a source or community make?
WHICH evidence supports that assertion?
```

## Golden rule

### **TEXTUAL PRESENCE ≠ UNIVERSAL AUTHORITY**

RGBL can preserve many religious and philosophical traditions while keeping authority, revelation, canon, role, identity, and doctrinal status explicitly scoped.

```text
SOURCE ARTIFACT
      ↓
WORK / EXPRESSION / EDITION
      ↓
PASSAGE / CONTENT
      ↓
ASSERTION
      ↓
EVIDENCE + PROVENANCE
      ↓
DOWNSTREAM POLICY / ANALYSIS
```

## Rocksoul Research ecosystem

| Repository | Domain | Question | Mantra |
|---|---|---|---|
| **rocksoul-mftl** | Narrative Intelligence | What was told? | TRACE THE STORY. |
| **rocksoul-legend** | Historical & Event Intelligence | What happened? | TRACE THE EVENT. |
| **rocksoul-superhero** | Actor & Transmission Intelligence | Who was involved? | TRACE THE PERSON. |
| **rocksoul-rgbl** | Scripture & Revelation Reference | What does the exact text say? | TRACE THE TEXT. |

Ownership rule:

```text
STORY   → MFTL
EVENT   → LEGEND
PERSON  → SUPERHERO
TEXT    → RGBL
```

RGBL owns canonical `mw:*` corpus identity for works, passages, content, resources, assertions, evidence, provenance, and corpus assessments. It does **not** absorb MFTL narratives, LEGEND events, or SUPERHERO actor/transmission records.

[Read the interoperability contract →](docs/ROCKSOUL_INTEROP.md)

## Four-way proof case

### **CASE 001 — JERUSALEM 70 CE**

RGBL contributes **exact text only**:

```text
mw:passage:sblgnt:v1-2:mark:13:2
mw:passage:web-classic:2020:mar:13:2
```

Those existing canonical passage IDs are reused directly. No duplicate scripture object was created for the integration.

```text
RGBL      Mark 13:2 exact text
   ↓
MFTL      temple-destruction prediction narrative
   ↓
LEGEND    Jerusalem / Second Temple destruction, 70 CE
   ↑
SUPERHERO Flavius Josephus — witness / recorder
```

The proof works precisely because the repositories **do not collapse into each other**. RGBL proves what the selected text expression says; it does not prove event historicity or supernatural fulfillment.

[Read the shared case →](docs/cases/JERUSALEM-70-TEMPLE.md)

## Canonical corpus contract

RGBL keeps six universal record concerns separate:

```text
ENTITY
RESOURCE
ASSERTION
EVIDENCE
PROVENANCE
ASSESSMENT
```

Textual profiles add:

```text
WORK
EXPRESSION
EDITION
ARTIFACT
PASSAGE
CONTENT
ALIGNMENT
VARIANT
```

Database tables and search indexes are **derived artifacts**. Canonical knowledge remains in versioned corpus data and provenance.

## Multi-tradition coverage

The corpus includes source-preserving or source-pinned material across multiple traditions, including:

- Qur'an and Islamic textual/devotional datasets;
- Hebrew Bible / Westminster Leningrad Codex;
- SBL Greek New Testament and multiple Bible expressions/translations;
- Buddhist Pali and translated collections;
- Hindu, Daoist, Confucian, Zoroastrian, Sikh, Jain, Baháʼí, Shinto, and related textual datasets;
- lexicons, alignments, world-religion registries, and scoped person/role assertions.

Coverage does not imply theological equivalence, equal authority, or a closed universal taxonomy.

## Technical engine

The technical implementation retains the internal name **MoonWitness Corpus Engine**.

```text
TypeScript
pnpm + Turborepo
canonical JSON / JSONL
deterministic ingestion recipes
generated SQLite + FTS5
Fastify 5 REST API
OpenTelemetry + Prometheus
typed SDK + CLI
```

Runtime databases, FTS indexes, caches, and search artifacts must remain rebuildable from released corpus inputs.

## Quick start

```bash
pnpm install
pnpm check
```

Run the API:

```bash
pnpm serve
```

Useful endpoints:

```text
GET /docs
GET /metrics
GET /v1/health
GET /v1/traditions
GET /v1/works
GET /v1/works/:id/passages
GET /v1/search?q=...
GET /v1/devotionals?tradition=...
GET /v1/compare?theme=...
```

Use the CLI:

```bash
pnpm cli read bhagavad-gita 2:47
pnpm cli read hadith-nawawi 1
pnpm cli read kojiki 1:1
pnpm cli search "keadilan"
```

## Reproducible ingestion

```bash
pnpm upstream:audit
pnpm sync:all
pnpm check
```

The ingestion contract preserves:

```text
UPSTREAM SOURCE
      ↓
PINNED ARTIFACT / REVISION
      ↓
RECIPE + PARSER + NORMALIZER
      ↓
CANONICAL DATA
      ↓
CHECKSUM / PROVENANCE / RIGHTS
```

## Research principles

**ASSERTION ≠ GLOBAL FACT.**

**TRANSLATION ≠ SOURCE IDENTITY.**

**SIMILARITY ≠ EQUIVALENCE.**

**CORPUS INCLUSION ≠ NORMATIVE ADMISSIBILITY.**

**RELIGIOUS ROLE ≠ UNQUALIFIED IDENTITY.**

**ENGINE POLICY STAYS DOWNSTREAM.**

**MISSING ≠ FALSE.**

**PROVENANCE IS REQUIRED.**

## Documentation

Start with:

- [Documentation index](docs/README.md)
- [Rocksoul interoperability](docs/ROCKSOUL_INTEROP.md)
- [Implementation roadmap](docs/ROADMAP.md)
- [Dataset targets](docs/DATASET_TARGETS.md)
- [World registry targets](docs/WORLD_REGISTRY_TARGETS.md)
- [Case 001 — Jerusalem 70 CE](docs/cases/JERUSALEM-70-TEMPLE.md)

---

<div align="center">

### **TRACE THE TEXT.**

**SOURCE · PASSAGE · ASSERTION · EVIDENCE · PROVENANCE**

</div>
