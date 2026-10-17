import { useEffect, useMemo, useState } from 'react'
import { BRANDING } from '../../config/branding'

/**
 * StudentFilterBar
 * ─────────────────────────────────────────────────────────────────────────────
 * Props:
 *   students                  – full array of student objects to filter
 *   onFilterChange            – callback(filteredArray) called on every input change
 *   onAttendanceFilterChange  – optional callback(filterKey, filterLabel) for export/reports
 *   showAttendanceFilter      – boolean to force show attendance % controls (default auto-detects)
 *   accentColor               – 'indigo' | 'emerald'  (default: 'indigo')
 */
export default function StudentFilterBar({
  students = [],
  onFilterChange,
  onAttendanceFilterChange,
  showAttendanceFilter = false,
  accentColor = 'indigo',
}) {
  const [query, setQuery]                         = useState('')
  const [batch, setBatch]                         = useState('all')
  const [cls,   setCls]                           = useState('all')
  const [attendanceFilter, setAttendanceFilter]   = useState('all')
  const [minPct, setMinPct]                       = useState('')
  const [maxPct, setMaxPct]                       = useState('')

  // Auto-detect if student dataset contains attendance data
  const hasAttendanceData = useMemo(() => {
    return showAttendanceFilter || students.some((s) => s.attendancePercentage !== undefined)
  }, [showAttendanceFilter, students])

  // ── Derive unique option lists from the student array ──────────────────────
  const batches = useMemo(() => {
    const set = new Set()
    students.forEach((s) => {
      if (Array.isArray(s.batches) && s.batches.length > 0) {
        s.batches.forEach((b) => {
          if (b && b.trim()) set.add(b.trim())
        })
      } else if (s.batch) {
        s.batch.split(',').forEach((b) => {
          if (b && b.trim()) set.add(b.trim())
        })
      }
    })
    return [...set].sort()
  }, [students])

  const classes = useMemo(
    () =>
      [...new Set(students.map((s) => s.studentClass).filter(Boolean))].sort(),
    [students]
  )

  // ── Counts for attendance presets ──────────────────────────────────────────
  const attendanceCounts = useMemo(() => {
    if (!hasAttendanceData) return {}
    let low75 = 0
    let crit60 = 0
    let avg = 0
    let good85 = 0

    students.forEach((s) => {
      const p = s.attendancePercentage
      if (p !== null && p !== undefined) {
        if (p < 75) low75++
        if (p < 60) crit60++
        if (p >= 75 && p <= 84) avg++
        if (p >= 85) good85++
      }
    })
    return { low75, crit60, avg, good85, total: students.length }
  }, [students, hasAttendanceData])

  // ── Filter logic ───────────────────────────────────────────────────────────
  useEffect(() => {
    const q = query.trim().toLowerCase()
    const filtered = students.filter((s) => {
      const matchBatch =
        batch === 'all' ||
        (Array.isArray(s.batches) && s.batches.includes(batch)) ||
        (s.batch && s.batch.split(',').map((b) => b.trim()).includes(batch))
      const matchCls   = cls === 'all' || s.studentClass === cls
      const matchQuery =
        !q ||
        (s.fullName  || '').toLowerCase().includes(q) ||
        (s.username  || '').toLowerCase().includes(q) ||
        (s.rollNo    || '').toLowerCase().includes(q)

      let matchAttendance = true
      if (hasAttendanceData && attendanceFilter !== 'all') {
        const pct = s.attendancePercentage
        if (pct === null || pct === undefined) {
          matchAttendance = false
        } else if (attendanceFilter === 'below75') {
          matchAttendance = pct < 75
        } else if (attendanceFilter === 'below60') {
          matchAttendance = pct < 60
        } else if (attendanceFilter === '75to84') {
          matchAttendance = pct >= 75 && pct <= 84
        } else if (attendanceFilter === 'above85') {
          matchAttendance = pct >= 85
        } else if (attendanceFilter === 'custom') {
          const min = minPct !== '' ? Number(minPct) : 0
          const max = maxPct !== '' ? Number(maxPct) : 100
          matchAttendance = pct >= min && pct <= max
        }
      }

      return matchBatch && matchCls && matchQuery && matchAttendance
    })

    onFilterChange?.(filtered)

    // Notify parent of active filter label
    const labels = {
      all: 'All Attendance %',
      below75: 'Low Attendance (< 75%)',
      below60: 'Critical Attendance (< 60%)',
      '75to84': 'Average Attendance (75% – 84%)',
      above85: 'Good Attendance (≥ 85%)',
      custom: `Custom Range (${minPct || 0}% – ${maxPct || 100}%)`,
    }
    onAttendanceFilterChange?.(attendanceFilter, labels[attendanceFilter] || 'All')
  }, [query, batch, cls, attendanceFilter, minPct, maxPct, students, onFilterChange, onAttendanceFilterChange, hasAttendanceData])

  const isFiltered =
    query !== '' ||
    batch !== 'all' ||
    cls !== 'all' ||
    (hasAttendanceData && (attendanceFilter !== 'all' || minPct !== '' || maxPct !== ''))

  function clearAll() {
    setQuery('')
    setBatch('all')
    setCls('all')
    setAttendanceFilter('all')
    setMinPct('')
    setMaxPct('')
  }

  // ── Style helpers ──────────────────────────────────────────────────────────
  const ring       = 'focus:ring-brand-primary focus:border-brand-primary'
  const clearBg    = 'bg-brand-accent/10 text-brand-accent border-brand-accent/20 hover:bg-brand-accent/20'
  const selectBase = `w-full rounded-xl border border-brand-border bg-brand-surface px-3 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 transition-all duration-200 ${ring}`
  const inputBase  = `w-full rounded-xl border border-brand-border bg-brand-surface pl-8 pr-3 py-2 text-xs text-brand-text placeholder:text-brand-text-muted/50 focus:outline-none focus:ring-2 transition-all duration-200 ${ring}`

  return (
    <div className="rounded-2xl border border-brand-border bg-brand-surface p-4 shadow-sm space-y-3">
      {/* ── Main Filter Bar ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        {/* Text search */}
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

        {/* Attendance % Dropdown (when dataset has attendance) */}
        {hasAttendanceData && (
          <div className="sm:w-52">
            <select
              id="sfb-attendance"
              value={attendanceFilter}
              onChange={(e) => setAttendanceFilter(e.target.value)}
              className={selectBase}
            >
              <option value="all">All Attendance % ({attendanceCounts.total || 0})</option>
              <option value="below75">⚠️ Low &lt; 75% ({attendanceCounts.low75 || 0})</option>
              <option value="below60">🚨 Critical &lt; 60% ({attendanceCounts.crit60 || 0})</option>
              <option value="75to84">⚡ Average 75–84% ({attendanceCounts.avg || 0})</option>
              <option value="above85">✓ Good ≥ 85% ({attendanceCounts.good85 || 0})</option>
              <option value="custom">⚙️ Custom Range %…</option>
            </select>
          </div>
        )}

        {/* Batch dropdown */}
        {batches.length > 1 && (
          <div className="sm:w-40">
            <select
              id="sfb-batch"
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              className={selectBase}
            >
              <option value="all">{BRANDING.allBatchesLabel}</option>
              {batches.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        )}

        {/* Class dropdown */}
        {classes.length > 0 && (
          <div className="sm:w-36">
            <select
              id="sfb-class"
              value={cls}
              onChange={(e) => setCls(e.target.value)}
              className={selectBase}
            >
              <option value="all">All Classes</option>
              {classes.map((c) => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          </div>
        )}

        {/* Clear chip */}
        {isFiltered && (
          <button
            type="button"
            onClick={clearAll}
            className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${clearBg}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Clear
          </button>
        )}
      </div>

      {/* ── Quick Attendance Filter Chips & Custom Inputs ─────────────── */}
      {hasAttendanceData && (
        <div className="pt-1 border-t border-brand-border/40 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider mr-1">
              Quick Filter:
            </span>

            <button
              type="button"
              onClick={() => setAttendanceFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                attendanceFilter === 'all'
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'bg-brand-surface-tint text-brand-text-muted hover:text-brand-text border border-brand-border/60'
              }`}
            >
              All ({attendanceCounts.total || 0})
            </button>

            <button
              type="button"
              onClick={() => setAttendanceFilter('below75')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                attendanceFilter === 'below75'
                  ? 'bg-brand-accent text-white shadow-xs'
                  : 'bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/20 border border-brand-accent/20'
              }`}
            >
              Low &lt; 75% ({attendanceCounts.low75 || 0})
            </button>

            <button
              type="button"
              onClick={() => setAttendanceFilter('below60')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                attendanceFilter === 'below60'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20'
              }`}
            >
              Critical &lt; 60% ({attendanceCounts.crit60 || 0})
            </button>

            <button
              type="button"
              onClick={() => setAttendanceFilter('75to84')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                attendanceFilter === '75to84'
                  ? 'bg-brand-gold text-white shadow-xs'
                  : 'bg-brand-gold/15 text-brand-gold hover:bg-brand-gold/25 border border-brand-gold/25'
              }`}
            >
              Average 75–84% ({attendanceCounts.avg || 0})
            </button>

            <button
              type="button"
              onClick={() => setAttendanceFilter('above85')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                attendanceFilter === 'above85'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20'
              }`}
            >
              Good ≥ 85% ({attendanceCounts.good85 || 0})
            </button>
          </div>

          {/* Custom Min / Max Inputs */}
          {attendanceFilter === 'custom' && (
            <div className="flex items-center gap-2 bg-brand-surface-tint border border-brand-border px-3 py-1 rounded-xl">
              <span className="text-[11px] font-semibold text-brand-text-muted">Range:</span>
              <input
                type="number"
                min="0"
                max="100"
                value={minPct}
                onChange={(e) => setMinPct(e.target.value)}
                placeholder="Min %"
                className="w-16 rounded-lg border border-brand-border bg-brand-surface px-2 py-1 text-xs text-brand-text text-center focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
              <span className="text-brand-text-muted font-bold text-xs">to</span>
              <input
                type="number"
                min="0"
                max="100"
                value={maxPct}
                onChange={(e) => setMaxPct(e.target.value)}
                placeholder="Max %"
                className="w-16 rounded-lg border border-brand-border bg-brand-surface px-2 py-1 text-xs text-brand-text text-center focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
              <span className="text-brand-text-muted font-bold text-xs">%</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
