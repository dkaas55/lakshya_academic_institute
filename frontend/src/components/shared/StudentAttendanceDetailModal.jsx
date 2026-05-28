import { useEffect, useState } from 'react'
import api from '../../lib/api'

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(iso))
}

function PctBadge({ pct }) {
  if (pct === null || pct === undefined) return <span className="text-[11px] text-brand-text-muted">—</span>
  const cls =
    pct >= 85 ? 'bg-brand-primary/10 text-brand-primary ring-brand-primary/20' :
    pct >= 75 ? 'bg-brand-gold/15 text-brand-gold ring-brand-gold/25' :
                'bg-brand-accent/10 text-brand-accent ring-brand-accent/20'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${cls}`}>
      {pct}%
    </span>
  )
}

function StatusDot({ status }) {
  const dotCfg = {
    Present: 'bg-emerald-500',
    Late:    'bg-amber-400',
    Absent:  'bg-rose-500',
  }[status] ?? 'bg-gray-400'

  const badgeCfg = {
    Present: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 ring-emerald-100 dark:ring-emerald-900/50',
    Late:    'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 ring-amber-100 dark:ring-amber-900/50',
    Absent:  'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-400 ring-rose-100 dark:ring-rose-900/50',
  }[status] ?? 'bg-brand-surface-tint text-brand-text-muted ring-brand-border'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ${badgeCfg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotCfg}`} />
      {status}
    </span>
  )
}

// ── Month names ───────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// ── Main Component ────────────────────────────────────────────────────────────
export default function StudentAttendanceDetailModal({ student, onClose }) {
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [data, setData]           = useState(null)

  // Filters
  const [lookupDate, setLookupDate]   = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')

  // Filtered sub-results
  const [dateResult, setDateResult]     = useState(null)
  const [monthResult, setMonthResult]   = useState(null)
  const [filterLoading, setFilterLoading] = useState(false)

  // Initial load — full session data
  useEffect(() => {
    if (!student) return
    const sId = student.studentId || student.id || student._id
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const { data: res } = await api.get(`/attendance/student/${sId}`)
        if (res.success) {
          setData(res.data)
        } else {
          setError(res.message || 'Failed to load attendance data.')
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load attendance data.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [student])

  // Fetch with date / month filter
  const fetchFiltered = async (params) => {
    const sId = student.studentId || student.id || student._id
    setFilterLoading(true)
    try {
      const { data: res } = await api.get(`/attendance/student/${sId}`, { params })
      if (res.success) {
        setDateResult(res.data.dateResult || null)
        setMonthResult(res.data.monthResult || null)
      }
    } catch (err) {
      // silent
    } finally {
      setFilterLoading(false)
    }
  }

  const handleDateLookup = () => {
    if (!lookupDate) return
    setMonthResult(null)
    fetchFiltered({ date: lookupDate })
  }

  const handleMonthSelect = (monthVal) => {
    setSelectedMonth(monthVal)
    if (!monthVal) {
      setMonthResult(null)
      return
    }
    setDateResult(null)
    fetchFiltered({ month: monthVal })
  }

  // Generate month options from history
  const monthOptions = []
  if (data?.history) {
    const seen = new Set()
    for (const h of data.history) {
      const d = new Date(h.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!seen.has(key)) {
        seen.add(key)
        monthOptions.push({ value: key, label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` })
      }
    }
  }

  if (!student) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-brand-text/30 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />

      {/* Modal */}
      <div className="relative bg-brand-surface border border-brand-border rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4 border-b border-brand-border bg-brand-surface-tint flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-sm font-bold shrink-0">
              {student.fullName?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-brand-text truncate">{student.fullName}</h3>
              <p className="text-[10px] text-brand-text-muted">Attendance Detail</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-brand-border bg-brand-surface px-3 py-1.5 text-xs font-bold text-brand-text hover:bg-brand-surface-tint transition-colors cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="py-14 text-center">
              <div className="inline-flex flex-col items-center gap-2">
                <svg className="animate-spin h-6 w-6 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-xs text-brand-text-muted font-bold">Loading attendance…</span>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-brand-accent/20 bg-brand-accent/5 p-6 text-center">
              <p className="text-sm text-brand-accent font-semibold">{error}</p>
            </div>
          ) : data ? (
            <>
              {/* ── Session Total Card ──────────────────────────────────── */}
              <div className="rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted/80 mb-3">Session Total</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: 'Total',   value: data.sessionTotal?.totalClasses ?? 0,  bg: 'bg-brand-surface-tint border-brand-border', color: 'text-brand-text' },
                    { label: 'Present', value: data.sessionTotal?.present ?? 0,       bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50', color: 'text-emerald-800 dark:text-emerald-300' },
                    { label: 'Late',    value: data.sessionTotal?.late ?? 0,          bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50', color: 'text-amber-800 dark:text-amber-300' },
                    { label: 'Absent',  value: data.sessionTotal?.absent ?? 0,        bg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/50', color: 'text-rose-800 dark:text-rose-300' },
                    { label: '%',       value: null,                                   bg: 'bg-brand-surface-tint border-brand-border', color: 'text-brand-text', isPct: true },
                  ].map((s) => (
                    <div key={s.label} className={`rounded-xl border px-3 py-2.5 ${s.bg}`}>
                      <p className="text-[9px] uppercase font-semibold tracking-wide text-brand-text-muted">{s.label}</p>
                      {s.isPct ? (
                        <div className="mt-1"><PctBadge pct={data.sessionTotal?.attendancePercentage ?? null} /></div>
                      ) : (
                        <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Filter Controls ─────────────────────────────────────── */}
              <div className="rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted/80 mb-3">Lookup Attendance</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Date lookup */}
                  <div>
                    <label className="block text-xs font-semibold text-brand-text mb-1.5">By Date</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={lookupDate}
                        onChange={(e) => setLookupDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="flex-1 rounded-xl border border-brand-border bg-brand-surface px-3 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                      />
                      <button
                        type="button"
                        onClick={handleDateLookup}
                        disabled={!lookupDate || filterLoading}
                        className="rounded-xl bg-brand-primary hover:bg-brand-primary/90 px-4 py-2.5 text-xs font-bold text-brand-surface disabled:opacity-60 transition-all shadow-sm cursor-pointer"
                      >
                        {filterLoading ? '…' : 'Check'}
                      </button>
                    </div>
                  </div>

                  {/* Month selector */}
                  <div>
                    <label className="block text-xs font-semibold text-brand-text mb-1.5">By Month</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => handleMonthSelect(e.target.value)}
                      className="w-full rounded-xl border border-brand-border bg-brand-surface px-3 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                    >
                      <option value="">Select month…</option>
                      {monthOptions.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ── Date Result ──────────────────────────────────────────── */}
              {dateResult && (
                <div className="rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted/80 mb-3">
                    Status on {formatDate(dateResult.date)}
                  </p>
                  {dateResult.status ? (
                    <div className="flex items-center gap-3">
                      <StatusDot status={dateResult.status} />
                      <span className="text-xs text-brand-text font-semibold">
                        {student.fullName} was marked <strong>{dateResult.status}</strong> on this date.
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-brand-text-muted">No attendance record found for this date.</p>
                  )}
                </div>
              )}

              {/* ── Month Result ─────────────────────────────────────────── */}
              {monthResult && (
                <div className="rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted/80">
                      {monthResult.month} Summary
                    </p>
                    <PctBadge pct={monthResult.attendancePercentage} />
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Classes',  value: monthResult.totalClasses, bg: 'bg-brand-surface-tint border-brand-border', color: 'text-brand-text' },
                      { label: 'Present',  value: monthResult.present,      bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50', color: 'text-emerald-800 dark:text-emerald-300' },
                      { label: 'Late',     value: monthResult.late,         bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50', color: 'text-amber-800 dark:text-amber-300' },
                      { label: 'Absent',   value: monthResult.absent,       bg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/50', color: 'text-rose-800 dark:text-rose-300' },
                    ].map((s) => (
                      <div key={s.label} className={`rounded-xl border px-3 py-2 ${s.bg}`}>
                        <p className="text-[9px] uppercase font-semibold tracking-wide text-brand-text-muted">{s.label}</p>
                        <p className={`text-lg font-bold mt-0.5 ${s.color}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Day-by-day list */}
                  {monthResult.history?.length > 0 && (
                    <div className="divide-y divide-brand-border max-h-52 overflow-y-auto pr-1">
                      {monthResult.history.map((h, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2.5 hover:bg-brand-surface-tint/60 transition-colors">
                          <span className="text-xs font-semibold text-brand-text">{formatDate(h.date)}</span>
                          <StatusDot status={h.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Full Session History Log ─────────────────────────────── */}
              <div className="rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted/80 mb-3">
                  Full Session Log · {data.history?.length ?? 0} records
                </p>
                {data.history?.length > 0 ? (
                  <div className="divide-y divide-brand-border max-h-64 overflow-y-auto pr-1">
                    {data.history.map((h, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2.5 hover:bg-brand-surface-tint/60 transition-colors">
                        <span className="text-xs font-semibold text-brand-text">{formatDate(h.date)}</span>
                        <StatusDot status={h.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-brand-text-muted py-4 text-center">No attendance records for this student.</p>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
