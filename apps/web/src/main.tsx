import { StrictMode, useEffect, useMemo, useState, type FormEvent } from "react"
import { createRoot } from "react-dom/client"
import {
  Badge,
  Button,
  DossierHeader,
  EvidenceMatrix,
  MoonWitnessAssetImage,
  MoonWitnessAssetProvider,
  MoonWitnessBrand,
  ObservatorySectionNav,
  ProvenanceRail,
  ThemeToggle,
} from "@rocksoul/ui"
import "@rocksoul/ui/styles.css"
import "./styles.css"
import {
  loadAssertionTraversal,
  loadHealth,
  loadPassageTrace,
  loadPassages,
  loadTraditions,
  loadWorkHierarchy,
  loadWorks,
  rgblApiBaseUrl,
  rgblApiConfigured,
  searchCorpus,
  type ApiHealth,
} from "./api"
import {
  evidenceRows,
  fallbackPassages,
  fallbackTraditions,
  fallbackWorks,
  type AssertionTraversal,
  type CorpusResource,
  type Passage,
  type PassageTrace,
  type SearchRecord,
  type Tradition,
  type Work,
  type WorkHierarchy,
} from "./data"

const sections = [
  { id: "explore", label: "Corpus" },
  { id: "passage", label: "Text trace" },
  { id: "evidence", label: "Evidence" },
  { id: "provenance", label: "Provenance" },
  { id: "principles", label: "Rules" },
]

function formatCount(value?: number) {
  if (typeof value !== "number") return "—"
  return new Intl.NumberFormat("en-US", { notation: value > 9999 ? "compact" : "standard" }).format(value)
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function labelsOf(resource?: CorpusResource | null) {
  if (!resource?.labels?.length) return resource?.id ?? "Unknown"
  return resource.labels.find((label) => label.role === "preferred")?.value ?? resource.labels[0]?.value ?? resource.id
}

function extension(resource: CorpusResource | undefined, key: string) {
  return object(object(resource?.extensions)[key])
}

function compactId(id?: string) {
  if (!id) return "—"
  return id.length > 48 ? `${id.slice(0, 26)}…${id.slice(-16)}` : id
}

function textDirection(script?: string) {
  return script === "Arab" || script === "Hebr" ? "rtl" : "ltr"
}

function updateQuery(params: Record<string, string | undefined>) {
  const url = new URL(window.location.href)
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value)
    else url.searchParams.delete(key)
  }
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`)
}

function initialParam(key: string) {
  return new URLSearchParams(window.location.search).get(key) ?? ""
}

function CorpusApp() {
  const [traditions, setTraditions] = useState<Tradition[]>(fallbackTraditions)
  const [works, setWorks] = useState<Work[]>(fallbackWorks)
  const [selectedTradition, setSelectedTradition] = useState(() => initialParam("tradition"))
  const [selectedWorkId, setSelectedWorkId] = useState(() => initialParam("work") || fallbackWorks[1]?.id || fallbackWorks[0]?.id || "")
  const [hierarchy, setHierarchy] = useState<WorkHierarchy | null>(null)
  const [passages, setPassages] = useState<Passage[]>(fallbackPassages.filter((item) => item.workId === selectedWorkId))
  const [passageOffset, setPassageOffset] = useState(0)
  const [passageTotal, setPassageTotal] = useState<number | undefined>()
  const [passageHasMore, setPassageHasMore] = useState(false)
  const [selectedPassageId, setSelectedPassageId] = useState(() => initialParam("passage"))
  const [trace, setTrace] = useState<PassageTrace | null>(null)
  const [query, setQuery] = useState(() => initialParam("q"))
  const [results, setResults] = useState<SearchRecord[]>([])
  const [searchOffset, setSearchOffset] = useState(0)
  const [searchHasMore, setSearchHasMore] = useState(false)
  const [searchLatency, setSearchLatency] = useState<number | undefined>()
  const [searching, setSearching] = useState(false)
  const [loadingPassages, setLoadingPassages] = useState(false)
  const [health, setHealth] = useState<ApiHealth | null>(null)
  const [sourceMode, setSourceMode] = useState<"api" | "fallback">("fallback")
  const [apiNotice, setApiNotice] = useState<string>("")
  const [assertionId, setAssertionId] = useState("")
  const [assertionTrace, setAssertionTrace] = useState<AssertionTraversal | null>(null)
  const [assertionLoading, setAssertionLoading] = useState(false)
  const [assertionNotice, setAssertionNotice] = useState("")

  const selectedWork = useMemo(
    () => works.find((work) => work.id === selectedWorkId) ?? works[0],
    [works, selectedWorkId],
  )
  const selectedPassage = useMemo(
    () => passages.find((passage) => passage.id === selectedPassageId) ?? passages[0],
    [passages, selectedPassageId],
  )
  const visibleWorks = useMemo(
    () => works.filter((work) => !selectedTradition || work.tradition === selectedTradition),
    [works, selectedTradition],
  )
  const aggregateRecords = useMemo(
    () => traditions.reduce((sum, tradition) => sum + (tradition.totalRecords ?? 0), 0),
    [traditions],
  )

  useEffect(() => {
    let active = true
    void Promise.all([loadHealth(), loadTraditions(), loadWorks()]).then(([healthResult, traditionResult, workResult]) => {
      if (!active) return
      setHealth(healthResult.data)
      setTraditions(traditionResult.data)
      setWorks(workResult.data)
      const live = healthResult.source === "api" && healthResult.data?.status === "healthy"
      setSourceMode(live ? "api" : "fallback")
      setApiNotice(healthResult.error || traditionResult.error || workResult.error || "")
      const requested = initialParam("work")
      const candidates = workResult.data
      if (!candidates.some((work) => work.id === (requested || selectedWorkId))) {
        setSelectedWorkId(candidates[0]?.id ?? "")
      }
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!selectedWorkId) return
    let active = true
    setLoadingPassages(true)
    setPassageOffset(0)
    void Promise.all([loadWorkHierarchy(selectedWorkId), loadPassages(selectedWorkId, 0, 12)]).then(([hierarchyResult, passageResult]) => {
      if (!active) return
      setHierarchy(hierarchyResult.data)
      setPassages(passageResult.data)
      setPassageTotal(passageResult.total)
      setPassageHasMore(passageResult.hasMore)
      setPassageOffset(passageResult.offset)
      setSourceMode(hierarchyResult.source === "api" || passageResult.source === "api" ? "api" : "fallback")
      setApiNotice(hierarchyResult.error || passageResult.error || "")
      const requestedPassage = initialParam("passage")
      const nextPassage = passageResult.data.find((item) => item.id === requestedPassage) ?? passageResult.data[0]
      setSelectedPassageId(nextPassage?.id ?? "")
      updateQuery({ work: selectedWorkId, passage: nextPassage?.id })
      setLoadingPassages(false)
    })
    return () => { active = false }
  }, [selectedWorkId])

  useEffect(() => {
    if (!selectedPassage) {
      setTrace(null)
      return
    }
    let active = true
    void loadPassageTrace(selectedPassage).then((result) => {
      if (!active) return
      setTrace(result.data)
      if (result.error) setApiNotice(result.error)
      if (result.source === "api") setSourceMode("api")
    })
    return () => { active = false }
  }, [selectedPassage?.id])

  useEffect(() => {
    if (query) void executeSearch(0)
  }, [])

  async function executeSearch(offset: number) {
    const clean = query.trim()
    if (!clean) {
      setResults([])
      setSearchOffset(0)
      setSearchHasMore(false)
      updateQuery({ q: undefined })
      return
    }
    setSearching(true)
    const page = await searchCorpus(clean, selectedTradition || undefined, offset, 20)
    setResults(page.data)
    setSearchOffset(page.offset)
    setSearchHasMore(page.hasMore)
    setSearchLatency(page.latencyMs)
    setSourceMode(page.source)
    if (page.error) setApiNotice(page.error)
    updateQuery({ q: clean, tradition: selectedTradition || undefined })
    setSearching(false)
  }

  async function runSearch(event?: FormEvent) {
    event?.preventDefault()
    await executeSearch(0)
  }

  function chooseWork(work: Work) {
    setSelectedWorkId(work.id)
    setSelectedPassageId("")
    updateQuery({ work: work.id, passage: undefined })
    document.getElementById("passage")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function choosePassage(passage: Passage) {
    setSelectedPassageId(passage.id)
    updateQuery({ work: selectedWork?.id, passage: passage.id })
  }

  async function movePassagePage(nextOffset: number) {
    if (!selectedWork) return
    setLoadingPassages(true)
    const page = await loadPassages(selectedWork.id, Math.max(0, nextOffset), 12)
    setPassages(page.data)
    setPassageOffset(page.offset)
    setPassageTotal(page.total)
    setPassageHasMore(page.hasMore)
    setSelectedPassageId(page.data[0]?.id ?? "")
    if (page.error) setApiNotice(page.error)
    setLoadingPassages(false)
  }

  async function traceAssertion(event: FormEvent) {
    event.preventDefault()
    const id = assertionId.trim()
    if (!id) return
    setAssertionLoading(true)
    setAssertionNotice("")
    const result = await loadAssertionTraversal(id)
    setAssertionTrace(result.data)
    setAssertionNotice(result.error || (result.data ? "" : "Live RGBL API is required for assertion traversal."))
    setAssertionLoading(false)
  }

  const selectedTraditionName = selectedTradition
    ? traditions.find((tradition) => tradition.id === selectedTradition)?.name ?? selectedTradition
    : "All traditions"

  const hierarchyArtifacts = hierarchy?.artifacts ?? []
  const provenanceNodes = trace?.provenanceRecords.length
    ? trace.provenanceRecords.slice(0, 4).map((record, index) => ({
        id: record.id,
        kind: index === 0 ? "source" as const : "evidence" as const,
        label: index === 0 ? "Pinned provenance" : `Provenance activity ${index + 1}`,
        detail: record.source_reference ?? record.source ?? record.id,
        active: index === 0,
      }))
    : [
        { id: "source-boundary", kind: "source" as const, label: "Source trace unavailable", detail: sourceMode === "api" ? "No provenance record returned for this passage." : "Connect the live RGBL API.", active: true },
        { id: "text-boundary", kind: "text" as const, label: "Canonical passage identity", detail: selectedPassage?.id ?? "No passage selected" },
      ]

  return (
    <MoonWitnessAssetProvider>
      <div className="rgbl-app">
        <header className="rgbl-header">
          <a className="brand-link" href="#top" aria-label="RGBL home">
            <MoonWitnessBrand ecosystem subtitle="RGBL · TEXT INTELLIGENCE" />
          </a>
          <nav className="rgbl-nav" aria-label="Primary navigation">
            <a href="#explore">Corpus</a>
            <a href="#passage">Text trace</a>
            <a href="#evidence">Evidence</a>
            <a href="#provenance">Provenance</a>
            <a href="https://github.com/bjo163/rocksoul-rgbl" target="_blank" rel="noreferrer">Repository</a>
          </nav>
          <div className="header-tools">
            <Badge variant={sourceMode === "api" ? "verified" : "partial"}>
              {sourceMode === "api" ? "LIVE CORPUS" : "METADATA FALLBACK"}
            </Badge>
            <ThemeToggle />
          </div>
        </header>

        <main id="top">
          <section className="hero-shell" aria-label="RGBL text intelligence">
            <DossierHeader
              eyebrow="RGBL / SCRIPTURE & REVELATION REFERENCE INTELLIGENCE"
              title="TRACE THE TEXT."
              summary="Inspect canonical work identity, expression, edition, source artifact, exact passage content, rights, provenance, evidence and explicit textual relations without collapsing their semantic boundaries."
              recordId="TEXT ≠ INTERPRETATION · TRANSLATION ≠ SOURCE IDENTITY"
              status={{ label: sourceMode === "api" ? "LIVE CANONICAL TEXT LAYER" : "CANONICAL METADATA MODE", variant: sourceMode === "api" ? "verified" : "partial" }}
              metadata={[
                { label: "Domain", value: "TEXT" },
                { label: "Hierarchy", value: "WORK → EXPRESSION → EDITION → ARTIFACT → PASSAGE → CONTENT" },
                { label: "Visual grammar", value: "@rocksoul/ui · stable rocksoul-assets v1.3.1" },
                { label: "Runtime", value: sourceMode === "api" ? `RGBL REST · ${health?.database ?? "healthy"}` : "Source-safe metadata fallback" },
              ]}
              actions={
                <>
                  <Button onClick={() => document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" })}>
                    Explore corpus
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => window.open("https://github.com/bjo163/rocksoul-rgbl/blob/main/docs/ROCKSOUL_INTEROP.md", "_blank", "noopener,noreferrer")}
                  >
                    Interop contract
                  </Button>
                </>
              }
            />
          </section>

          <div className="section-nav-shell">
            <ObservatorySectionNav items={sections} label="TEXT INDEX /" offset={108} />
          </div>

          <section className="runtime-band" aria-label="Runtime status">
            <div className="runtime-state">
              <span className={sourceMode === "api" ? "runtime-dot live" : "runtime-dot"} aria-hidden="true" />
              <div>
                <strong>{sourceMode === "api" ? "Canonical API connected" : "Metadata fallback active"}</strong>
                <small>{sourceMode === "api" ? rgblApiBaseUrl : rgblApiConfigured ? "Configured endpoint is unavailable" : "VITE_RGBL_API_URL is not configured"}</small>
              </div>
            </div>
            <div className="runtime-metrics">
              <span>ENGINE <b>{health?.version ?? "0.1"}</b></span>
              <span>RECORDS <b>{health?.totalRecords ? formatCount(health.totalRecords) : "537K+ baseline"}</b></span>
              <span>STATUS <b>{health?.status ?? "fallback"}</b></span>
            </div>
          </section>

          {apiNotice ? (
            <aside className="api-notice" role="status">
              <MoonWitnessAssetImage pack="state-illustrations" file="svg/source-missing.svg" alt="" aria-hidden="true" />
              <div><strong>Live corpus adapter degraded.</strong><p>{apiNotice}. The interface is preserving metadata-only behavior rather than inventing missing text.</p></div>
            </aside>
          ) : null}

          <section className="search-band" aria-label="Corpus search">
            <div>
              <p className="section-kicker">EXACT SEARCH / FTS5</p>
              <h2>Find the record before interpreting the record.</h2>
            </div>
            <form className="corpus-search" onSubmit={runSearch}>
              <label className="sr-only" htmlFor="corpus-query">Search corpus</label>
              <input
                id="corpus-query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search exact text, passage or indexed corpus term…"
              />
              <select
                aria-label="Filter by tradition"
                value={selectedTradition}
                onChange={(event) => {
                  const value = event.target.value
                  setSelectedTradition(value)
                  updateQuery({ tradition: value || undefined })
                }}
              >
                <option value="">All traditions</option>
                {traditions.map((tradition) => <option key={tradition.id} value={tradition.id}>{tradition.name}</option>)}
              </select>
              <Button type="submit" loading={searching}>Search</Button>
            </form>
            <div className="search-context">
              <span>FILTER · {selectedTraditionName}</span>
              <span>{typeof searchLatency === "number" ? `SERVER SEARCH · ${searchLatency.toFixed(2)} ms` : sourceMode === "api" ? "LIVE FTS5" : "LOCAL METADATA ONLY"}</span>
            </div>

            {results.length ? (
              <>
                <div className="search-results" aria-live="polite">
                  {results.map((result) => (
                    <article key={result.id} className="search-result">
                      <div>
                        <Badge variant="neutral">{result.kind}</Badge>
                        {result.tradition ? <Badge variant="info">{result.tradition}</Badge> : null}
                      </div>
                      <h3>{result.title}</h3>
                      <code title={result.id}>{result.id}</code>
                      {result.snippet ? <p>{result.snippet}</p> : null}
                      <small>{[result.datasetId, typeof result.score === "number" ? `score ${result.score.toFixed(3)}` : undefined].filter(Boolean).join(" · ")}</small>
                    </article>
                  ))}
                </div>
                <div className="pager">
                  <Button variant="secondary" disabled={searchOffset === 0 || searching} onClick={() => void executeSearch(Math.max(0, searchOffset - 20))}>Previous</Button>
                  <span>OFFSET {searchOffset}</span>
                  <Button variant="secondary" disabled={!searchHasMore || searching} onClick={() => void executeSearch(searchOffset + 20)}>Next</Button>
                </div>
              </>
            ) : query && !searching ? <p className="empty-note">No matching records in the active data source.</p> : null}
          </section>

          <section id="explore" className="content-section">
            <div className="section-heading">
              <div>
                <p className="section-kicker">01 / CORPUS ATLAS</p>
                <h2>Multi-tradition by design. Authority stays scoped.</h2>
              </div>
              <p>RGBL can preserve many textual traditions without collapsing translation, canon, revelation, identity or doctrinal status into a single global verdict.</p>
            </div>

            <div className="metric-strip" aria-label="Corpus metrics">
              <div><span>Indexed records</span><strong>{health?.totalRecords ? formatCount(health.totalRecords) : aggregateRecords ? formatCount(aggregateRecords) : "537K+"}</strong><small>{health ? "live database" : "repository baseline"}</small></div>
              <div><span>Traditions</span><strong>{traditions.length}</strong><small>registry scope</small></div>
              <div><span>Visible works</span><strong>{visibleWorks.length}</strong><small>{selectedTraditionName}</small></div>
              <div><span>API state</span><strong>{sourceMode === "api" ? "LIVE" : "SAFE"}</strong><small>{sourceMode === "api" ? "canonical records" : "no invented text"}</small></div>
            </div>

            <div className="atlas-layout">
              <aside className="tradition-panel" aria-label="Tradition filters">
                <div className="panel-title"><span>TRADITIONS /</span><button type="button" onClick={() => { setSelectedTradition(""); updateQuery({ tradition: undefined }) }}>RESET</button></div>
                {traditions.map((tradition) => (
                  <button
                    key={tradition.id}
                    type="button"
                    className={selectedTradition === tradition.id ? "tradition-row active" : "tradition-row"}
                    onClick={() => { setSelectedTradition(tradition.id); updateQuery({ tradition: tradition.id }) }}
                  >
                    <span><strong>{tradition.name}</strong><small>{tradition.primaryLanguage ?? "und"} · {(tradition.scripts ?? []).join(", ") || "script metadata"}</small></span>
                    <b>{formatCount(tradition.totalRecords)}</b>
                  </button>
                ))}
              </aside>

              <div className="works-panel">
                <div className="panel-title"><span>CANONICAL WORK INDEX</span><b>{visibleWorks.length.toString().padStart(2, "0")}</b></div>
                <div className="work-grid">
                  {visibleWorks.map((work) => (
                    <button type="button" className={selectedWork?.id === work.id ? "work-card selected" : "work-card"} key={work.id} onClick={() => chooseWork(work)}>
                      <div className="work-card-top"><Badge variant={selectedWork?.id === work.id ? "verified" : "neutral"}>{work.tradition}</Badge><span>{work.language ?? "mul"}</span></div>
                      <h3>{work.title}</h3>
                      <code>{work.id}</code>
                      <p>{work.description ?? "Canonical textual.work metadata."}</p>
                      <small>TRACE HIERARCHY →</small>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="passage" className="content-section passage-section">
            <div className="section-heading">
              <div>
                <p className="section-kicker">02 / CANONICAL TEXT TRACE</p>
                <h2>{selectedWork?.title ?? "Select a canonical work"}</h2>
              </div>
              <p>Work, expression, edition and source artifact remain separate identities. Passage content is displayed only when returned by the canonical corpus API.</p>
            </div>

            <div className="hierarchy-chain" aria-label="Canonical textual hierarchy">
              <div><span>WORK</span><strong>{selectedWork?.id ?? "—"}</strong></div>
              <div><span>EXPRESSIONS</span><strong>{hierarchy?.expressions.length ?? 0}</strong><small>{compactId(hierarchy?.expressions[0]?.id)}</small></div>
              <div><span>EDITIONS</span><strong>{hierarchy?.editions.length ?? 0}</strong><small>{compactId(hierarchy?.editions[0]?.id)}</small></div>
              <div><span>ARTIFACTS</span><strong>{hierarchyArtifacts.length}</strong><small>{compactId(hierarchyArtifacts[0]?.id)}</small></div>
            </div>

            <div className="rights-grid">
              <article>
                <span>DATASET</span>
                <strong>{hierarchy?.dataset?.id ?? selectedWork?.datasetId ?? "Metadata fallback"}</strong>
                <p>{hierarchy?.dataset?.rights ?? selectedWork?.rights ?? "Rights metadata is shown only when the canonical dataset/API supplies it."}</p>
              </article>
              <article>
                <span>AVAILABILITY</span>
                <strong>{hierarchy?.dataset?.availability ?? selectedWork?.availability ?? "unknown"}</strong>
                <p>Availability and redistribution are source-specific; corpus presence alone does not establish reuse rights.</p>
              </article>
            </div>

            {hierarchyArtifacts.length ? (
              <div className="artifact-grid">
                {hierarchyArtifacts.map((artifact) => {
                  const source = extension(artifact, "source")
                  const descriptor = object(source.descriptor)
                  const rights = object(source.rights)
                  return (
                    <article key={artifact.id} className="artifact-card">
                      <div><Badge variant="info">SOURCE ARTIFACT</Badge><span>{stringOr(source.language, "mul")}</span></div>
                      <h3>{stringOr(source.title, labelsOf(artifact))}</h3>
                      <code>{artifact.id}</code>
                      <dl>
                        <div><dt>Revision</dt><dd>{stringOr(source.revision, "not declared")}</dd></div>
                        <div><dt>Rights</dt><dd>{stringOr(rights.status, hierarchy?.dataset?.rights, "not declared")}</dd></div>
                        <div><dt>License</dt><dd>{stringOr(rights.license_expression, "not declared")}</dd></div>
                        <div><dt>SHA-256</dt><dd className="hash">{stringOr(descriptor.sha256, "not declared")}</dd></div>
                      </dl>
                    </article>
                  )
                })}
              </div>
            ) : null}

            <div className="passage-layout">
              <div className="passage-list">
                <div className="panel-title"><span>PASSAGES /</span><b>{typeof passageTotal === "number" ? passageTotal : passages.length}</b></div>
                {loadingPassages ? <p className="empty-note">Loading canonical passage index…</p> : passages.length ? passages.map((passage) => (
                  <button type="button" key={passage.id} className={selectedPassage?.id === passage.id ? "passage-row active" : "passage-row"} onClick={() => choosePassage(passage)}>
                    <span>{passage.locator}</span><small>{passage.contents?.length ? `${passage.contents.length} lanes` : passage.language ?? "meta"}</small>
                  </button>
                )) : <p className="empty-note">No passage page was returned for this work.</p>}
                <div className="pager passage-pager">
                  <Button variant="secondary" disabled={passageOffset === 0 || loadingPassages} onClick={() => void movePassagePage(passageOffset - 12)}>Previous</Button>
                  <span>{passageOffset + 1}–{passageOffset + passages.length}</span>
                  <Button variant="secondary" disabled={!passageHasMore || loadingPassages} onClick={() => void movePassagePage(passageOffset + 12)}>Next</Button>
                </div>
              </div>

              <article className="passage-detail">
                {selectedPassage ? (
                  <>
                    <div className="detail-topline"><Badge variant="verified">CANONICAL PASSAGE</Badge><span>{trace?.contents.length ?? selectedPassage.contents?.length ?? 0} CONTENT LANES</span></div>
                    <h3>{selectedPassage.label}</h3>
                    <code>{selectedPassage.id}</code>

                    {trace?.contents.length ? (
                      <div className="text-lanes" aria-label="Exact text content lanes">
                        {trace.contents.map((lane) => (
                          <article className="text-lane" key={lane.id}>
                            <header><div><Badge variant="neutral">{lane.language}</Badge><Badge variant="info">{lane.representation}</Badge></div><span>{lane.script ?? "script n/a"}</span></header>
                            <p lang={lane.language} dir={textDirection(lane.script)}>{lane.text}</p>
                            <footer><code>{lane.id}</code><small>{[lane.artifact, lane.provenance].filter(Boolean).join(" · ")}</small></footer>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state compact">
                        <MoonWitnessAssetImage pack="state-illustrations" file="svg/source-missing.svg" alt="" aria-hidden="true" />
                        <div><strong>Exact text is unavailable in the current source.</strong><p>{selectedPassage.note ?? "RGBL does not synthesize missing scripture text."}</p></div>
                      </div>
                    )}

                    <div className="source-grid">
                      <div><span>SOURCE</span><strong>{trace?.contents[0]?.artifact ?? selectedPassage.source}</strong></div>
                      <div><span>LOCATOR</span><strong>{selectedPassage.locator}</strong></div>
                      <div><span>DATASET</span><strong>{trace?.dataset?.id ?? hierarchy?.dataset?.id ?? "not available"}</strong></div>
                      <div><span>RELATIONS</span><strong>{trace?.relations.length ?? 0}</strong></div>
                      <div className="wide"><span>PROVENANCE</span><strong>{trace?.provenanceRecords[0]?.id ?? selectedPassage.provenance}</strong></div>
                    </div>
                  </>
                ) : (
                  <div className="empty-state">
                    <MoonWitnessAssetImage pack="state-illustrations" file="svg/empty-search.svg" alt="" aria-hidden="true" />
                    <p>Select a passage or connect the RGBL API.</p>
                  </div>
                )}
              </article>
            </div>

            <div className="relations-panel">
              <div className="panel-title"><span>ALIGNMENTS & VARIANTS /</span><b>{trace?.relations.length ?? 0}</b></div>
              {trace?.relations.length ? (
                <div className="relation-grid">
                  {trace.relations.map((relation) => {
                    const textual = extension(relation, "textual")
                    return (
                      <article key={relation.id}>
                        <Badge variant={relation.kind === "textual.variant" ? "partial" : "info"}>{relation.kind ?? "relation"}</Badge>
                        <h3>{labelsOf(relation)}</h3>
                        <code>{relation.id}</code>
                        <p>{stringOr(textual.method, textual.relation, "Explicit textual relation; no identity or theological equivalence is implied.")}</p>
                      </article>
                    )
                  })}
                </div>
              ) : <p className="empty-note">No alignment or variant record was returned for the selected passage.</p>}
            </div>
          </section>

          <section id="evidence" className="content-section">
            <div className="section-heading">
              <div><p className="section-kicker">03 / ASSERTION × EVIDENCE</p><h2>Actual evidence stays distinct from semantic guardrails.</h2></div>
              <p>The live evidence list below comes from corpus records targeting the selected passage/content. The matrix is explicitly a contract summary, not fabricated evidence counts.</p>
            </div>

            <div className="evidence-live">
              <div className="panel-title"><span>SELECTED PASSAGE EVIDENCE /</span><b>{trace?.evidence.length ?? 0}</b></div>
              {trace?.evidence.length ? trace.evidence.map((item) => (
                <article key={item.id}>
                  <div><Badge variant="verified">{item.relation ?? "evidence"}</Badge><span>{compactId(item.target)}</span></div>
                  <code>{item.id}</code>
                  <p>{item.provenance ? `Provenance · ${item.provenance}` : "No provenance pointer was returned on this evidence record."}</p>
                </article>
              )) : <p className="empty-note">No evidence record directly targets this passage/content page.</p>}
            </div>

            <div className="contract-matrix">
              <div className="panel-title"><span>STATIC SEMANTIC GUARDRAILS /</span><b>CONTRACT</b></div>
              <EvidenceMatrix rows={evidenceRows} caption="RGBL semantic guardrails — contract summary, not live evidence counts" />
            </div>

            <form className="assertion-trace" onSubmit={traceAssertion}>
              <div><p className="section-kicker">ASSERTION TRACE</p><h3>Resolve explicit evidence references by canonical assertion ID.</h3></div>
              <div className="assertion-controls">
                <label className="sr-only" htmlFor="assertion-id">Canonical assertion ID</label>
                <input id="assertion-id" value={assertionId} onChange={(event) => setAssertionId(event.target.value)} placeholder="mw:assertion:…" />
                <Button type="submit" loading={assertionLoading}>Trace</Button>
              </div>
              {assertionNotice ? <p className="empty-note">{assertionNotice}</p> : null}
              {assertionTrace ? (
                <div className="assertion-result">
                  <article><span>ASSERTION</span><code>{String(assertionTrace.assertion.id ?? assertionId)}</code><p>{String(assertionTrace.assertion.assertion_class ?? "scoped assertion")}</p></article>
                  <article><span>EVIDENCE</span><strong>{assertionTrace.evidence.length}</strong><p>{assertionTrace.evidence.map((item) => item.id).join(" · ") || "No explicit evidence IDs"}</p></article>
                  <article><span>TARGETS</span><strong>{assertionTrace.targets.length}</strong><p>{assertionTrace.targets.map((item) => String(item.id ?? "unknown")).join(" · ") || "No targets resolved"}</p></article>
                </div>
              ) : null}
            </form>
          </section>

          <section id="provenance" className="content-section">
            <div className="section-heading">
              <div><p className="section-kicker">04 / PROVENANCE & RIGHTS</p><h2>Every displayed text should be traceable to a pinned source.</h2></div>
              <p>Artifact revision, checksum, rights and acquisition activity are shown only when supplied by the selected canonical records.</p>
            </div>

            <ProvenanceRail
              nodes={provenanceNodes}
              description={trace?.provenanceRecords.length ? "Live provenance records resolved from the selected exact content lane." : "No live provenance record is available; the canonical passage identity remains visible without inventing source history."}
            />

            {trace?.provenanceRecords.length ? (
              <div className="provenance-grid">
                {trace.provenanceRecords.map((record) => (
                  <article key={record.id}>
                    <Badge variant="verified">PROVENANCE</Badge>
                    <h3>{record.source_reference ?? record.source ?? record.id}</h3>
                    <code>{record.id}</code>
                    <div className="activity-list">
                      {(record.activities ?? []).map((activity, index) => (
                        <div key={`${record.id}-${index}`}><span>{String(activity.type ?? "activity")}</span><p>{String(activity.method ?? "Method not declared")}</p></div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : null}

            <div className="asset-callout">
              <div>
                <p className="section-kicker">ROCKSOUL VISUAL SOURCE</p>
                <h3>Stable assets. Semantic HTML remains the research truth.</h3>
                <p>RGBL now uses the stable asset base built into <code>@rocksoul/ui</code> rather than tracking <code>rocksoul-assets/main</code> at runtime.</p>
                <div className="asset-links">
                  <a href="https://github.com/bjo163/rocksoul-ui" target="_blank" rel="noreferrer">@rocksoul/ui</a>
                  <a href="https://github.com/bjo163/rocksoul-assets/releases/tag/v1.3.1" target="_blank" rel="noreferrer">assets v1.3.1</a>
                </div>
              </div>
              <MoonWitnessAssetImage pack="application-screens" file="23-ai-workspace.svg" alt="MoonWitness research workspace visual reference" />
            </div>
          </section>

          <section id="principles" className="content-section principles-section">
            <div className="section-heading">
              <div><p className="section-kicker">05 / GOLDEN RULES</p><h2>Preserve first. Interpret downstream.</h2></div>
              <p>These boundaries are enforced in data presentation: missing text is unavailable, not false; source identity and translation identity remain separate.</p>
            </div>
            <div className="principles-grid">
              {[
                ["TEXTUAL PRESENCE", "≠ UNIVERSAL AUTHORITY"],
                ["TRANSLATION", "≠ SOURCE IDENTITY"],
                ["SIMILARITY", "≠ EQUIVALENCE"],
                ["ASSERTION", "≠ GLOBAL FACT"],
                ["MISSING", "≠ FALSE"],
                ["PROVENANCE", "IS REQUIRED"],
              ].map(([left, right]) => <article key={left}><span>{left}</span><strong>{right}</strong></article>)}
            </div>
          </section>
        </main>

        <footer className="rgbl-footer">
          <MoonWitnessBrand ecosystem subtitle="TRACE THE TEXT." />
          <p>RGBL owns canonical TEXT identity and provenance. Interpretation, event claims, person identity and legal conclusions stay downstream.</p>
          <div>
            <a href="https://github.com/bjo163/rocksoul-rgbl" target="_blank" rel="noreferrer">RGBL</a>
            <a href="https://github.com/bjo163/rocksoul-ui" target="_blank" rel="noreferrer">UI</a>
            <a href="https://github.com/bjo163/rocksoul-assets" target="_blank" rel="noreferrer">Assets</a>
          </div>
        </footer>
      </div>
    </MoonWitnessAssetProvider>
  )
}

function stringOr(...values: unknown[]) {
  for (const value of values) if (typeof value === "string" && value.trim()) return value
  return "—"
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CorpusApp />
  </StrictMode>,
)
