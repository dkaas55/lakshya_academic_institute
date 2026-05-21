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
        (s.email     || '').toLowerCase().includes(q)
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

  // ── Accent-aware class helpers ─────────────────────────────────────────────
  const ring   = accentColor === 'emerald' ? 'focus:ring-emerald-400 focus:border-emerald-400' : 'focus:ring-indigo-500 focus:border-indigo-400'
  const clearBg = accentColor === 'emerald'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
    : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'

  const selectBase = `w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 transition-colors ${ring}`
  const inputBase  = `w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${ring}`

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">

        {/* ── Text search ─────────────────────────────────────────────────── */}
        <div className="relative flex-1 min-w-0">
          <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </span>
          <input
            id="sfb-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
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
