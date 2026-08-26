import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="page-header">
      <p className="eyebrow">Not found</p>
      <h1>No matching corpus record.</h1>
      <p>The requested canonical ID or dataset is not available in the loaded corpus registry.</p>
      <div className="actions"><Link className="button" href="/search">Search the corpus</Link><Link className="button secondary" href="/datasets">Browse datasets</Link></div>
    </section>
  )
}
