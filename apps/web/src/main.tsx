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
import { loadPassages, loadTraditions, loadWorks, rgblApiConfigured, searchCorpus } from "./api"
import {
  evidenceRows,
  fallbackPassages,
  fallbackTraditions,
  fallbackWorks,
  type Passage,
  type SearchRecord,
  type Tradition,
  type Work,
} from "./data"

const ASSET_BASE = "https://raw.githubusercontent.com/bjo163/rocksoul-assets/main/moonwitness"

const sections = [
  { id: "explore", label: "Explore" },
  { id: "passage", label: "Passage" },
  { id: "evidence", label: "Evidence" },
  { id: "provenance", label: "Provenance" },
  { id: "principles", label: "Principles" },
]

function formatCount(value?: number) {
  if (typeof value !== "number") return "LIVE"
  return new Intl.NumberFormat("en-US", { notation: value > 9999 ? "compact" : "standard" }).format(value)
}

function CorpusApp() {
  const [traditions, setTraditions] = useState<Tradition[]>(fallbackTraditions)
  const [works, setWorks] = useState<Work[]>(fallbackWorks)
  const [passages, setPassages] = useState<Passage[]>(fallbackPassages)
  const [selectedTradition, setSelectedTradition] = useState("")
  const [selectedWork, setSelectedWork] = useState<Work>(fallbackWorks[1] ?? fallbackWorks[0])
  const [selectedPassage, setSelectedPassage] = useState<Passage | undefined>(fallbackPassages[0])
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [sourceMode, setSourceMode] = useState<"api" | "fallback">(rgblApiConfigured ? "api" : "fallback")

  useEffect(() => {
    let active = true
    void Promise.all([loadTraditions(), loadWorks()]).then(([nextTraditions, nextWorks]) => {
      if (!active) return
      setTraditions(nextTraditions)
      setWorks(nextWorks)
      if (nextWorks.length && !nextWorks.some((work) => work.id === selectedWork?.id)) {
        setSelectedWork(nextWorks[0])
      }
      if (!rgblApiConfigured) setSourceMode("fallback")
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!selectedWork) return
    let active = true
    void loadPassages(selectedWork.id).then((nextPassages) => {
      if (!active) return
      setPassages(nextPassages)
      setSelectedPassage(nextPassages[0])
    })
    return () => {
      active = false
    }
  }, [selectedWork])

  const visibleWorks = useMemo(
    () => works.filter((work) => !selectedTradition || work.tradition === selectedTradition),
    [works, selectedTradition],
  )

  const aggregateRecords = useMemo(
    () => traditions.reduce((sum, tradition) => sum + (tradition.totalRecords ?? 0), 0),
    [traditions],
  )

  async function runSearch(event?: FormEvent) {
    event?.preventDefault()
    setLoading(true)
    const next = await searchCorpus(query, selectedTradition || undefined)
    setResults(next)
    setSourceMode(rgblApiConfigured ? "api" : "fallback")
    setLoading(false)
  }

  function chooseWork(work: Work) {
    setSelectedWork(work)
    document.getElementById("passage")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const selectedTraditionName = selectedTradition
    ? traditions.find((tradition) => tradition.id === selectedTradition)?.name ?? selectedTradition
    : "All traditions"

  return (
    <MoonWitnessAssetProvider baseUrl={ASSET_BASE}>
      <div className="rgbl-app">
        <header className="rgbl-header">
          <a className="brand-link" href="#top" aria-label="RGBL home">
            <MoonWitnessBrand ecosystem subtitle="RGBL · TEXT INTELLIGENCE" />
          </a>
          <nav className="rgbl-nav" aria-label="Primary navigation">
            <a href="#explore">Corpus</a>
            <a href="#evidence">Evidence</a>
            <a href="#provenance">Provenance</a>
            <a href="https://github.com/bjo163/rocksoul-rgbl" target="_blank" rel="noreferrer">Repository</a>
          </nav>
          <div className="header-tools">
            <Badge variant={sourceMode === "api" ? "verified" : "partial"}>
              {sourceMode === "api" ? "API READY" : "FALLBACK MODE"}
            </Badge>
            <ThemeToggle />
          </div>
        </header>

        <main id="top">
          <section className="hero-shell" aria-labelledby="rgbl-title">
            <DossierHeader
              eyebrow="RGBL / SCRIPTURE & REVELATION REFERENCE INTELLIGENCE"
              title="TRACE THE TEXT."
              summary="A provenance-first multi-tradition corpus for exact works, expressions, passages, scoped assertions, evidence and reproducible downstream research."
              recordId="TEXT ≠ INTERPRETATION · INCLUSION ≠ AUTHORITY"
              status={{ label: "CANONICAL TEXT LAYER", variant: "verified" }}
              metadata={[
                { label: "Domain", value: "TEXT" },
                { label: "Engine", value: "TypeScript · Fastify · SQLite FTS5" },
                { label: "Visual grammar", value: "@rocksoul/ui · rocksoul-assets v1.3" },
                { label: "Runtime", value: rgblApiConfigured ? "Configured API + local fallback" : "Local metadata fallback · set VITE_RGBL_API_URL for live corpus" },
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

          <section className="search-band" aria-label="Corpus search">
            <div>
              <p className="section-kicker">EXACT SEARCH / FTS5 READY</p>
              <h2>Find the record before interpreting the record.</h2>
            </div>
            <form className="corpus-search" onSubmit={runSearch}>
              <label className="sr-only" htmlFor="corpus-query">Search corpus</label>
              <input
                id="corpus-query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search work, passage, language, source or concept…"
              />
              <select
                aria-label="Filter by tradition"
                value={selectedTradition}
                onChange={(event) => setSelectedTradition(event.target.value)}
              >
                <option value="">All traditions</option>
                {traditions.map((tradition) => (
                  <option key={tradition.id} value={tradition.id}>{tradition.name}</option>
                ))}
              </select>
              <Button type="submit" loading={loading}>Search</Button>
            </form>
            <div className="search-context">
              <span>FILTER · {selectedTraditionName}</span>
              <span>{rgblApiConfigured ? "LIVE ADAPTER · VITE_RGBL_API_URL" : "DEPLOYED FALLBACK · API OPTIONAL"}</span>
            </div>
            {results.length ? (
              <div className="search-results" aria-live="polite">
                {results.map((result) => (
                  <article key={result.id} className="search-result">
                    <div>
                      <Badge variant="neutral">{result.kind}</Badge>
                      {result.tradition ? <Badge variant="info">{result.tradition}</Badge> : null}
                    </div>
                    <h3>{result.title}</h3>
                    <code>{result.id}</code>
                    {result.snippet ? <p>{result.snippet}</p> : null}
                    <small>{[result.language, result.source].filter(Boolean).join(" · ")}</small>
                  </article>
                ))}
              </div>
            ) : query && !loading ? <p className="empty-note">No matching fallback metadata. Connect the live RGBL API for full FTS5 corpus search.</p> : null}
          </section>

          <section id="explore" className="content-section">
            <div className="section-heading">
              <div>
                <p className="section-kicker">01 / CORPUS ATLAS</p>
                <h2>Multi-tradition by design. Authority stays scoped.</h2>
              </div>
              <p>
                RGBL can preserve many textual traditions without collapsing translation, canon, revelation,
                identity or doctrinal status into a single global verdict.
              </p>
            </div>

            <div className="metric-strip" aria-label="Corpus metrics">
              <div><span>Indexed records</span><strong>{aggregateRecords ? formatCount(aggregateRecords) : "537K+"}</strong><small>API docs baseline</small></div>
              <div><span>Traditions</span><strong>{traditions.length}</strong><small>dynamic registry</small></div>
              <div><span>Visible works</span><strong>{visibleWorks.length}</strong><small>{selectedTraditionName}</small></div>
              <div><span>Contract</span><strong>0.1</strong><small>corpus spec</small></div>
            </div>

            <div className="atlas-layout">
              <aside className="tradition-panel" aria-label="Tradition filters">
                <div className="panel-title">
                  <span>TRADITIONS /</span>
                  <button type="button" onClick={() => setSelectedTradition("")}>RESET</button>
                </div>
                {traditions.map((tradition) => (
                  <button
                    key={tradition.id}
                    type="button"
                    className={selectedTradition === tradition.id ? "tradition-row active" : "tradition-row"}
                    onClick={() => setSelectedTradition(tradition.id)}
                  >
                    <span>
                      <strong>{tradition.name}</strong>
                      <small>{tradition.primaryLanguage ?? "und"} · {(tradition.scripts ?? []).join(", ") || "script metadata"}</small>
                    </span>
                    <b>{formatCount(tradition.totalRecords)}</b>
                  </button>
                ))}
              </aside>

              <div className="works-panel">
                <div className="panel-title">
                  <span>WORK / EXPRESSION INDEX</span>
                  <b>{visibleWorks.length.toString().padStart(2, "0")}</b>
                </div>
                <div className="work-grid">
                  {visibleWorks.map((work) => (
                    <button
                      type="button"
                      className={selectedWork?.id === work.id ? "work-card selected" : "work-card"}
                      key={work.id}
                      onClick={() => chooseWork(work)}
                    >
                      <div className="work-card-top">
                        <Badge variant={selectedWork?.id === work.id ? "verified" : "neutral"}>{work.tradition}</Badge>
                        <span>{work.language ?? "und"}</span>
                      </div>
                      <h3>{work.title}</h3>
                      <code>{work.id}</code>
                      <p>{work.description ?? "Canonical work metadata available from RGBL."}</p>
                      <small>OPEN PASSAGE TRACE →</small>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="passage" className="content-section passage-section">
            <div className="section-heading">
              <div>
                <p className="section-kicker">02 / EXACT PASSAGE</p>
                <h2>{selectedWork?.title ?? "Select a work"}</h2>
              </div>
              <p>
                The UI preserves locator, source and provenance boundaries. Exact text is loaded from the corpus API
                when available; fallback mode never invents missing scripture content.
              </p>
            </div>

            <div className="passage-layout">
              <div className="passage-list">
                <div className="panel-title"><span>PASSAGES /</span><b>{passages.length.toString().padStart(2, "0")}</b></div>
                {passages.length ? passages.map((passage) => (
                  <button
                    type="button"
                    key={passage.id}
                    className={selectedPassage?.id === passage.id ? "passage-row active" : "passage-row"}
                    onClick={() => setSelectedPassage(passage)}
                  >
                    <span>{passage.locator}</span>
                    <small>{passage.language ?? "und"}</small>
                  </button>
                )) : <p className="empty-note">No local passage fixture for this work. Connect the RGBL API to load its passage index.</p>}
              </div>

              <article className="passage-detail">
                {selectedPassage ? (
                  <>
                    <div className="detail-topline">
                      <Badge variant="verified">CANONICAL ID</Badge>
                      <span>{selectedPassage.language ?? "und"}</span>
                    </div>
                    <h3>{selectedPassage.label}</h3>
                    <code>{selectedPassage.id}</code>
                    <div className="source-grid">
                      <div><span>SOURCE</span><strong>{selectedPassage.source}</strong></div>
                      <div><span>LOCATOR</span><strong>{selectedPassage.locator}</strong></div>
                      <div className="wide"><span>PROVENANCE</span><strong>{selectedPassage.provenance}</strong></div>
                    </div>
                    <div className="text-boundary">
                      <MoonWitnessAssetImage pack="source-file" file="svg/file-jsonl.svg" alt="" aria-hidden="true" />
                      <div>
                        <span>TEXT DELIVERY BOUNDARY</span>
                        <p>{selectedPassage.note ?? "Exact text content is available from the canonical corpus record."}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="empty-state">
                    <MoonWitnessAssetImage pack="state-illustrations" file="empty.svg" alt="" aria-hidden="true" />
                    <p>Select a passage or configure the RGBL API.</p>
                  </div>
                )}
              </article>
            </div>
          </section>

          <section id="evidence" className="content-section">
            <div className="section-heading">
              <div>
                <p className="section-kicker">03 / ASSERTION × EVIDENCE</p>
                <h2>Presence is inspectable. Authority is not assumed.</h2>
              </div>
              <p>
                This matrix expresses RGBL corpus rules, not theological verdicts. Support, counter-evidence and context
                stay separately visible.
              </p>
            </div>
            <EvidenceMatrix rows={evidenceRows} caption="RGBL corpus contract evidence matrix" />
          </section>

          <section id="provenance" className="content-section">
            <div className="section-heading">
              <div>
                <p className="section-kicker">04 / PROVENANCE RAIL</p>
                <h2>Every text record should explain where it came from.</h2>
              </div>
              <p>
                RGBL keeps source artifact, textual identity, scoped assertion and evidence traceable before any
                downstream story, event, person or legal engine evaluates them.
              </p>
            </div>

            <ProvenanceRail
              nodes={[
                { id: "source", kind: "source", label: "Pinned artifact", detail: "revision · rights · checksum" },
                { id: "text", kind: "text", label: "Exact passage", detail: "work · expression · edition", active: true },
                { id: "claim", kind: "claim", label: "Scoped assertion", detail: "source/community attribution" },
                { id: "evidence", kind: "evidence", label: "Evidence", detail: "supports or contextualizes" },
              ]}
              description="Pinned source artifact → exact TEXT identity → scoped assertion → evidence. Downstream policy remains outside the canonical text record."
            />

            <div className="asset-callout">
              <div>
                <p className="section-kicker">ROCKSOUL VISUAL SOURCE</p>
                <h3>One visual language, semantic HTML on top.</h3>
                <p>
                  Research meaning remains live and accessible. Rocksoul assets support the interface rather than baking
                  claims into decorative imagery.
                </p>
                <div className="asset-links">
                  <a href="https://github.com/bjo163/rocksoul-ui" target="_blank" rel="noreferrer">@rocksoul/ui</a>
                  <a href="https://github.com/bjo163/rocksoul-assets" target="_blank" rel="noreferrer">rocksoul-assets</a>
                </div>
              </div>
              <MoonWitnessAssetImage
                pack="application-screens"
                file="23-ai-workspace.svg"
                alt="MoonWitness AI workspace reference"
              />
            </div>
          </section>

          <section id="principles" className="content-section principles-section">
            <div className="section-heading">
              <div>
                <p className="section-kicker">05 / GOLDEN RULES</p>
                <h2>Preserve first. Interpret downstream.</h2>
              </div>
              <p>These boundaries are the product behavior, not just documentation copy.</p>
            </div>
            <div className="principles-grid">
              {[
                ["TEXTUAL PRESENCE", "≠ UNIVERSAL AUTHORITY"],
                ["TRANSLATION", "≠ SOURCE IDENTITY"],
                ["SIMILARITY", "≠ EQUIVALENCE"],
                ["ASSERTION", "≠ GLOBAL FACT"],
                ["MISSING", "≠ FALSE"],
                ["PROVENANCE", "IS REQUIRED"],
              ].map(([left, right]) => (
                <article key={left}>
                  <span>{left}</span>
                  <strong>{right}</strong>
                </article>
              ))}
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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CorpusApp />
  </StrictMode>,
)
