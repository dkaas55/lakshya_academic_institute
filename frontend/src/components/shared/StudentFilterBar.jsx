import { useEffect, useMemo, useState } from 'react'

/**
 * StudentFilterBar
 * ─────────────────────────────────────────────────────────────────────────────
 * Props:
 *   students       – full array of student objects to filter
 *   onFilterChange – callback(filteredArray) called on every input change
 *   accentColor    – 'indigo' | 'emerald'  (default: 'indigo')
 */
export default function StudentFilterBar({
  students = [],
  onFilterChange,
  accentColor = 'indigo',
}) {
  const [query, setQuery]       = useState('')
  const [batch, setBatch]       = useState('all')
  const [cls,   setCls]         = useState('all')

  // ── Derive unique option lists from the student array ──────────────────────
  const batches = useMemo(
    () => [...new Set(students.map((s) => s.batch).filter(Boolean))].sort(),
    [students]
  )
  const classes = useMemo(
    () =>
      [...new Set(students.map((s) => s.studentClass).filter(Boolean))].sort(),
    [students]
  )

  // ── Filter logic ───────────────────────────────────────────────────────────
  useEffect(() => {
    const q = query.trim().toLowerCase()
    const filtered = students.filter((s) => {
      const matchBatch = batch === 'all' || s.batch === batch
      const matchCls   = cls   === 'all' || s.studentClass === cls
      const matchQuery =
        !q ||
        (s.fullName  || '').toLowerCase().includes(q) ||
        (s.username  || '').toLowerCase().includes(q) ||
        (s.rollNo    || '').toLowerCase().includes(q)
      return matchBatch && matchCls && matchQuery
    })
    onFilterChange?.(filtered)
  }, [query, batch, cls, students, onFilterChange])

  const isFiltered = query !== '' || batch !== 'all' || cls !== 'all'

  function clearAll() {
    setQuery('')
    setBatch('all')
    setCls('all')
  }

  // ── Design System style helpers ─────────────────────────────────────────────
  const ring   = 'focus:ring-brand-primary focus:border-brand-primary'
  const clearBg = 'bg-brand-accent/10 text-brand-accent border-brand-accent/20 hover:bg-brand-accent/20'

  const selectBase = `w-full rounded-xl border border-brand-border bg-brand-surface px-3 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 transition-all duration-200 ${ring}`
  const inputBase  = `w-full rounded-xl border border-brand-border bg-brand-surface pl-8 pr-3 py-2 text-xs text-brand-text placeholder:text-brand-text-muted/50 focus:outline-none focus:ring-2 transition-all duration-200 ${ring}`

  return (
    <div className="rounded-2xl border border-brand-border bg-brand-surface p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">

        {/* ── Text search ─────────────────────────────────────────────────── */}
        <div className="relative flex-1 min-w-0">
          <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-brand-text-muted/60">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </span>
          <input
            id="sfb-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, roll no, or username…"
            className={inputBase}
          />
        </div>

        {/* ── Batch dropdown ──────────────────────────────────────────────── */}
        <div className="sm:w-44">
          <select
            id="sfb-batch"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            className={selectBase}
          >
            <option value="all">All Batches</option>
            {batches.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* ── Class dropdown ──────────────────────────────────────────────── */}
        {classes.length > 0 && (
          <div className="sm:w-40">
            <select
              id="sfb-class"
              value={cls}
              onChange={(e) => setCls(e.target.value)}
              className={selectBase}
            >
              <option value="all">All Classes</option>
              {classes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        {/* ── Clear chip ──────────────────────────────────────────────────── */}
        {isFiltered && (
          <button
            type="button"
            onClick={clearAll}
            className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${clearBg}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
