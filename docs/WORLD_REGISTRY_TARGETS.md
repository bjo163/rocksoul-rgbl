# World Religions & Religious Persons Registry — P13 plan

Status: **parallel data track alongside P12**.

P13 builds a global registry of religious traditions, movements, communities, and religious/scriptural persons/figures. It is deliberately separate from the Foundation Text Corpus (P12), but it links to P12 passage evidence whenever a source text supports a role or relationship assertion.

## Non-negotiable modeling rules

### No final universal list of religions

There is no single neutral taxonomy that exhaustively defines every religion, denomination, school, sect, movement, folk/traditional religion, or syncretic community. P13 therefore stores:

```text
Entity: tradition / religion / denomination / school / movement / community
Labels: multilingual
External IDs: Wikidata and source-specific identifiers
Assertions: broader/narrower/related/derived-from/etc.
Scope: source / tradition / community / period / place where applicable
Provenance: exact source and ingestion revision
```

A hierarchy imported from one source is a source-attributed classification, not global truth.

### Prophet/nabi/founder/teacher is an assertion, not identity

A religious figure is represented as an Entity. Roles are contextual assertions:

```text
subject: figure
predicate: role / regarded-as / identified-as
object: prophet | messenger | apostle | guru | tirthankara | buddha | bodhisattva | sage | founder | reformer | saint | ...
scope: tradition/community/source
exact evidence: passage or external source
```

P13 must never encode `prophet=true` or `founder=true` as an unqualified global property.

Historical existence, legendary status, dates, identity-equivalence, and cross-tradition identification are separate assertions/assessments with provenance.

## Baseline structured-data source

### Wikidata

Wikidata is the baseline source for:

- stable external identifiers;
- multilingual labels and aliases (`en`, `id`, source languages where available);
- broad discovery of religion/tradition/movement entities;
- broad discovery of named persons/figures;
- selected external IDs and references useful for reconciliation.

Wikidata structured data is CC0. MoonWitness will still pin an exact retrieval date/query/revision artifact and checksum. Wikidata-derived hierarchy/role statements are not automatically promoted to corpus truth; they remain source-attributed assertions and may be superseded by better primary/academic evidence.

Official rights/data evidence:

- https://www.wikidata.org/wiki/Wikidata:Copyright
- https://www.wikidata.org/wiki/Wikidata:Licensing
- https://www.wikidata.org/wiki/Wikidata:Data_access

## Religion/tradition coverage strategy

P13 coverage is open-ended. Initial high-level audit families include, without implying they are equivalent categories:

```text
Abrahamic and related traditions
  Judaism and Jewish movements
  Christianity and Christian churches/denominations
  Islam and Muslim traditions/schools
  Baháʼí and related movements
  other historically related movements

South Asian / Dharmic traditions
  Hindu traditions/sampradayas
  Buddhism and Buddhist schools
  Jain traditions
  Sikh traditions
  other South Asian religious movements

East Asian traditions
  Daoist traditions
  Confucian traditions
  Shinto traditions
  Chinese folk/traditional religions
  Korean and Vietnamese traditional/new religious movements

Iranian / West & Central Asian traditions
  Zoroastrian traditions
  Yazidi tradition
  Mandaean tradition
  historical Iranian religions and movements

Indigenous / traditional / folk religions
  African traditional religions
  Indigenous American traditions
  Aboriginal Australian traditions
  Austronesian / Pacific traditions
  Arctic / Siberian / Central Asian traditional religions
  local and syncretic traditions

Ancient / historical religions
  ancient Mesopotamian traditions
  ancient Egyptian religion
  ancient Greek and Roman religions
  Germanic/Norse traditions
  Celtic traditions
  other historical religious systems

Modern/new religious movements
  new religious movements and restorationist traditions
  modern esoteric/occult movements where they self-identify or are classified as religious

Religiously unaffiliated classifications
  atheism / agnosticism / nonreligion are represented as worldview/affiliation classifications where useful, not forced into `religion` identity.
```

This list is a discovery frame only. It does not define a closed canonical enumeration.

## Person / figure coverage strategy

P13 distinguishes the entity from claims about the entity. Initial role vocabularies are data concepts, not fixed core enums:

```text
prophet
messenger
apostle
patriarch
founder
co-founder
teacher
spiritual teacher
guru
rishi
acharya
tirthankara
buddha
bodhisattva
lama
imam
caliph
rabbi
saint
martyr
sage
reformer
missionary
mystic
scriptural figure
legendary figure
historical religious leader
```

Additional roles can be added without schema changes.

## Primary-source enrichment lanes

Wikidata seeds identity and discovery. Role assertions should progressively be enriched from source-specific evidence:

### Islam

- Quran passages for named prophets/messengers and scriptural figures.
- Hadith or later sources only as separately identified datasets/sources.
- `nabi` and `rasul` distinctions remain source/tradition scoped.

### Judaism

- Tanakh/Hebrew Bible passage evidence for prophets, patriarchs, kings, priests, and other figures.
- Rabbinic classifications are separate source/tradition assertions.

### Christianity

- Hebrew Bible + Greek New Testament evidence for prophets, apostles, disciples, saints/figures.
- Later church tradition classifications are separate assertions.

### Buddhism

- Pali/SuttaCentral and later canonical traditions for Buddhas, disciples, teachers, bodhisattvas, etc.
- Theravāda/Mahāyāna/Vajrayāna-specific classifications remain scoped.

### Hindu traditions

- roles such as rishi, guru, avatar, acharya, deity/figure claims must be tied to exact textual/traditional sources and must not be flattened into a single universal Hindu taxonomy.

### Jainism

- Tirthankara and teacher lineages are tradition/source scoped.

### Sikhism

- Gurus and related persons are linked to Sikh textual/historical sources.

### Baháʼí

- central figures and offices/roles are represented from Baháʼí primary/institutional sources.

### Zoroastrian and other traditions

- figures are sourced from exact textual, institutional, or scholarly artifacts, with historical/legendary assessments kept separate.

## Multilingual policy

Every high-priority religion/tradition and person should aim for:

```text
preferred label: en
preferred label: id
native/source-language labels where available
alternate names/transliterations
```

Missing Indonesian labels remain explicit coverage gaps; they must not be filled by invented or machine-translated names when a conventional Indonesian form is unknown.

## Reconciliation policy

- Wikidata QID is an external identifier, not the MoonWitness canonical ID.
- Same-name figures are not merged automatically.
- Cross-tradition identifications (for example, two traditions identifying figures as the same person) are assertions supported by sources, never silent ID merges.
- Historical uncertainty is represented by assessments/assertions rather than by deleting contested identities.
- Aliases, honorifics, titles, regnal/religious names, and transliterations are labels/identifiers, not separate entities unless the sources actually distinguish entities.

## Geography and demographics

Country/region association and population statistics are optional sourced assertions, not intrinsic religion properties. Demographic sources such as Pew may use broad aggregation categories for cross-country comparability; those categories must be preserved as the methodology of that source rather than treated as the corpus's master taxonomy.

## P13 exit gate

P13 v0.1 is complete when:

1. a machine-readable open registry of traditions/religions/movements is source-pinned and reproducible;
2. a machine-readable registry of religious/scriptural persons/figures is source-pinned and reproducible;
3. `en` + `id` labels and aliases have explicit coverage reporting;
4. external identifiers and duplicate/reconciliation reports are deterministic;
5. role claims such as prophet/founder/guru/apostle are contextual assertions rather than global fields;
6. major Abrahamic, South Asian, East Asian, Iranian, indigenous/traditional, ancient/historical, and modern/new-religious-movement discovery lanes are represented without declaring the taxonomy exhaustive;
7. selected role assertions are linked to exact P12 passage evidence where available;
8. cross-tradition identity/equivalence is never inferred solely from name similarity;
9. all bundled metadata has explicit source/revision/rights/provenance;
10. a coverage report exposes known gaps instead of claiming that a finite list is literally “all religions in the world”.