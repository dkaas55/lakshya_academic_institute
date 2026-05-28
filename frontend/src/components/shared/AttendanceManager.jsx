import { useEffect, useMemo, useState } from 'react'
import api from '../../lib/api'
import StudentFilterBar from './StudentFilterBar'
import StudentAttendanceDetailModal from './StudentAttendanceDetailModal'

const ALL_BATCH_OPTIONS = [
  'Morning Batch A',
  'Morning Batch B',
  'Evening Batch A',
  'Evening Batch B',
  'Weekend Batch',
]

// ── Small helpers ─────────────────────────────────────────────────────────────
function StatusPill({ status, count }) {
  const cfg = {
    Present: { bg: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20', dot: 'bg-brand-primary' },
    Late:    { bg: 'bg-brand-gold/15 text-brand-gold border-brand-gold/25',         dot: 'bg-brand-gold'   },
    Absent:  { bg: 'bg-brand-accent/10 text-brand-accent border-brand-accent/20',    dot: 'bg-brand-accent'    },
  }[status] ?? { bg: 'bg-brand-surface-tint text-brand-text-muted border-brand-border', dot: 'bg-brand-text-muted' }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-all ${cfg.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {count} {status}
    </span>
  )
}

function PctBadge({ pct }) {
  if (pct === null) return <span className="text-[11px] text-brand-text-muted">—</span>
  const cls =
    pct >= 85 ? 'bg-brand-primary/10 text-brand-primary ring-brand-primary/20' :
    pct >= 75 ? 'bg-brand-gold/15 text-brand-gold ring-brand-gold/25' :
                'bg-brand-accent/10 text-brand-accent ring-brand-accent/20'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${cls}`}>
      {pct}%
    </span>
  )
}

// ── History View Sub-panel ────────────────────────────────────────────────────
function AttendanceHistoryView({ allowedBatches }) {
  const batches = allowedBatches || ALL_BATCH_OPTIONS
  const [batch, setBatch] = useState(batches[0] || '')

  // ── Student search & filtering state ────────────────────────────────────────
  const [studentList,    setStudentList]    = useState([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [searchQuery,    setSearchQuery]    = useState('')
  const [filterBatch,    setFilterBatch]    = useState('all')
  const [filterClass,    setFilterClass]    = useState('all')
  const [showDropdown,   setShowDropdown]   = useState(false)
  const [selectedStudentForModal, setSelectedStudentForModal] = useState(null)

  // ── Batch report state ──────────────────────────────────────────────────────
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [result,   setResult]   = useState(null)
  const [filtered, setFiltered] = useState([])

  // ── Fetch students once on mount ────────────────────────────────────────────
  const fetchStudents = async () => {
    setStudentsLoading(true)
    try {
      const { data } = await api.get('/students')
      if (data.success) {
        setStudentList(data.data?.students ?? [])
      }
    } catch { /* silent */ }
    finally { setStudentsLoading(false) }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  // ── Derive unique option lists from student registry ────────────────────────
  const uniqueBatches = useMemo(() => {
    return [...new Set(studentList.map((s) => s.batch).filter(Boolean))].sort()
  }, [studentList])

  const uniqueClasses = useMemo(() => {
    return [...new Set(studentList.map((s) => s.studentClass).filter(Boolean))].sort()
  }, [studentList])

  // ── Search & Filter Logic ───────────────────────────────────────────────────
  const q = searchQuery.trim().toLowerCase()
  const filteredSearchList = useMemo(() => {
    return studentList.filter((s) => {
      const matchBatch = filterBatch === 'all' || s.batch === filterBatch
      const matchClass = filterClass === 'all' || s.studentClass === filterClass
      const matchText = !q ||
        (s.fullName || '').toLowerCase().includes(q) ||
        (s.phoneNumber || '').includes(q) ||
        (s.username || '').toLowerCase().includes(q)
      return matchBatch && matchClass && matchText
    })
  }, [studentList, filterBatch, filterClass, q])

  const isActivelyFiltering = q.length > 0 || filterBatch !== 'all' || filterClass !== 'all'

  const handlePickStudentFromSearch = (student) => {
    setSelectedStudentForModal(student)
    setSearchQuery('')
    setFilterBatch('all')
    setFilterClass('all')
    setShowDropdown(false)
  }

  // ── Batch report fetch ──────────────────────────────────────────────────────
  const fetchHistory = async () => {
    if (!batch) return
    setLoading(true)
    setError('')
    setResult(null)
    setFiltered([])
    try {
      const params = { batch }
      if (dateFrom) params.dateFrom = dateFrom
      if (dateTo)   params.dateTo   = dateTo
      const { data } = await api.get('/attendance/history', { params })
      if (data.success) {
        setResult(data.data)
        setFiltered(data.data.students || [])
      }
      else setError(data.message || 'Failed to fetch history.')
    } catch (err) {
      setError(err.response?.data?.message || (err.request ? 'Unable to reach server.' : 'Something went wrong.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 🔍 Global Student Search Card */}
      <div className="rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-brand-text">🔍 Student Attendance Lookup</h3>
          <p className="text-[10px] text-brand-text-muted mt-0.5">
            Search for a specific student or filter by batch and class to view their detailed attendance.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Search by Name */}
          <div className="relative">
            <label className="block text-xs font-semibold text-brand-text mb-1.5">Search Student</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-brand-text-muted/60">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder={studentsLoading ? 'Loading registry…' : 'Type name, phone…'}
                className="w-full rounded-xl border border-brand-border bg-brand-surface pl-9 pr-10 py-2.5 text-xs text-brand-text placeholder:text-brand-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setShowDropdown(false) }}
                  className="absolute inset-y-0 right-3 flex items-center text-brand-text-muted hover:text-brand-accent transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Batch Filter */}
          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1.5">Batch</label>
            <select
              value={filterBatch}
              onChange={(e) => {
                setFilterBatch(e.target.value)
                setShowDropdown(true)
              }}
              className="w-full rounded-xl border border-brand-border bg-brand-surface px-3 py-2.5 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
            >
              <option value="all">All Batches</option>
              {uniqueBatches.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1.5">Class</label>
            <select
              value={filterClass}
              onChange={(e) => {
                setFilterClass(e.target.value)
                setShowDropdown(true)
              }}
              className="w-full rounded-xl border border-brand-border bg-brand-surface px-3 py-2.5 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
            >
              <option value="all">All Classes</option>
              {uniqueClasses.map((c) => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dropdown panel positioned relative to the container */}
        {showDropdown && isActivelyFiltering && (
          <div className="relative">
            <div className="absolute z-30 left-0 right-0 mt-1 rounded-xl border border-brand-border bg-brand-surface shadow-lg max-h-56 overflow-y-auto">
              <div className="flex justify-between items-center px-4 py-2 border-b border-brand-border/60 bg-brand-surface-tint">
                <span className="text-[10px] font-bold text-brand-text-muted">
                  Matching Students ({filteredSearchList.length})
                </span>
                <div className="flex items-center gap-2">
                  {(filterBatch !== 'all' || filterClass !== 'all' || searchQuery !== '') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('')
                        setFilterBatch('all')
                        setFilterClass('all')
                        setShowDropdown(false)
                      }}
                      className="text-[10px] text-brand-accent font-bold hover:underline cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                  <span className="text-brand-border/30">|</span>
                  <button
                    type="button"
                    onClick={() => setShowDropdown(false)}
                    className="text-[10px] text-brand-primary font-bold hover:underline cursor-pointer"
                  >
                    Hide Results
                  </button>
                </div>
              </div>
              {filteredSearchList.length === 0 ? (
                <div className="px-4 py-3 text-xs text-brand-text-muted">No students found matching your criteria.</div>
              ) : (
                filteredSearchList.map((s) => (
                  <button
                    key={s.id || s._id}
                    type="button"
                    onClick={() => handlePickStudentFromSearch(s)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-brand-primary/5 transition-colors border-b border-brand-border/50 last:border-b-0 cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                      {s.fullName?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-brand-text truncate">{s.fullName}</p>
                      <p className="text-[10px] text-brand-text-muted truncate">
                        Batch: <span className="font-semibold text-brand-text">{s.batch}</span> {s.studentClass ? `· Class ${s.studentClass}` : ''}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* 📊 Batch Attendance Report Card */}
      <div className="rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-brand-text">📊 Batch Attendance Report</h3>
          <p className="text-[10px] text-brand-text-muted mt-0.5">Select a batch and date range to load student overview stats.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1.5">Batch</label>
            <select
              value={batch}
              onChange={(e) => {
                setBatch(e.target.value)
                setResult(null)
                setFiltered([])
              }}
              className="w-full rounded-xl border border-brand-border bg-brand-surface px-4 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
            >
              {batches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1.5">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full rounded-xl border border-brand-border bg-brand-surface px-4 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1.5">To Date</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="flex-1 rounded-xl border border-brand-border bg-brand-surface px-4 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
              />
              <button
                onClick={fetchHistory}
                disabled={loading}
                className="rounded-xl bg-brand-primary hover:bg-brand-primary/90 px-4 py-2.5 text-xs font-bold text-brand-surface disabled:opacity-60 transition-all shadow-sm cursor-pointer whitespace-nowrap"
              >
                {loading ? 'Loading…' : 'Load Report'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs text-brand-accent bg-brand-accent/5 border border-brand-accent/10 rounded-xl px-4 py-3">{error}</p>
      )}

      {result && (
        <div className="space-y-4 animate-fadeIn">
          {/* Summary strip */}
          <div className="flex items-center gap-3 flex-wrap text-[11px] text-brand-text-muted">
            <span className="font-bold text-brand-text">{result.batch}</span>
            <span>·</span>
            <span>{result.totalClassDays} class day{result.totalClassDays !== 1 ? 's' : ''} recorded</span>
            {result.dateFrom && <><span>·</span><span>From {result.dateFrom} to {result.dateTo || 'today'}</span></>}
          </div>

          {/* Student Filter Bar */}
          <StudentFilterBar
            students={result.students || []}
            onFilterChange={setFiltered}
            accentColor="emerald"
          />

          {/* Table */}
          <div className="rounded-2xl border border-brand-border bg-brand-surface shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-brand-border bg-brand-surface-tint">
                    <th className="px-4 py-3.5 font-bold text-brand-text-muted">Student</th>
                    <th className="px-4 py-3.5 font-bold text-brand-text-muted text-center">Present</th>
                    <th className="px-4 py-3.5 font-bold text-brand-text-muted text-center">Late</th>
                    <th className="px-4 py-3.5 font-bold text-brand-text-muted text-center">Absent</th>
                    <th className="px-4 py-3.5 font-bold text-brand-text-muted text-center">Total</th>
                    <th className="px-4 py-3.5 font-bold text-brand-text-muted text-center">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-brand-text-muted text-xs">
                        No students match your filter criteria.
                      </td>
                    </tr>
                  ) : filtered.map((s) => (
                    <tr
                      key={s.studentId}
                      onClick={() => setSelectedStudentForModal(s)}
                      className="hover:bg-brand-primary/5 transition-colors duration-150 cursor-pointer"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                            {s.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-brand-text block">{s.fullName}</span>
                            <span className="text-[9px] text-brand-text-muted block mt-0.5">Click to view detail</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-primary/10 text-brand-primary text-[11px] font-bold">{s.present}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-gold/15 text-brand-gold text-[11px] font-bold">{s.late}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-accent/10 text-brand-accent text-[11px] font-bold">{s.absent}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center text-brand-text font-semibold">{s.total}</td>
                      <td className="px-4 py-3.5 text-center">
                        {s.attendancePercentage !== null ? (
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${
                            s.attendancePercentage >= 85 ? 'bg-brand-primary/10 text-brand-primary ring-brand-primary/20' :
                            s.attendancePercentage >= 75 ? 'bg-brand-gold/15 text-brand-gold ring-brand-gold/25' :
                                                           'bg-brand-accent/10 text-brand-accent ring-brand-accent/20'
                          }`}>
                            {s.attendancePercentage}%
                          </span>
                        ) : (
                          <span className="text-[11px] text-brand-text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length > 0 && (
              <div className="px-4 py-3 border-t border-brand-border bg-brand-surface-tint">
                <span className="text-[11px] text-brand-text-muted">
                  {filtered.length} student{filtered.length !== 1 ? 's' : ''} ·&nbsp;
                  <span className="text-brand-primary font-bold">≥85% = Good</span>&nbsp;·&nbsp;
                  <span className="text-brand-gold font-bold">75–84% = Average</span>&nbsp;·&nbsp;
                  <span className="text-brand-accent font-bold">&lt;75% = Low</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Student Attendance History Modal ────────────────────────────────── */}
      {selectedStudentForModal && (
        <StudentAttendanceDetailModal
          student={selectedStudentForModal}
          onClose={() => setSelectedStudentForModal(null)}
        />
      )}
    </div>
  )
}


// ── Main Component ────────────────────────────────────────────────────────────
export default function AttendanceManager({ allowedBatches = null }) {
  const batches = allowedBatches || ALL_BATCH_OPTIONS
  const [activeView,    setActiveView]    = useState('take')   // 'take' | 'history'
  const [selectedBatch, setSelectedBatch] = useState(batches[0] || '')
  const [selectedDate, setSelectedDate]   = useState(new Date().toISOString().split('T')[0])
  const [records, setRecords]             = useState([])
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')
  const [saving, setSaving]               = useState(false)
  const [saveSuccess, setSaveSuccess]     = useState('')
  const [isSaved, setIsSaved]             = useState(false)
  const [isEditMode, setIsEditMode]       = useState(false)

  const summary = records.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1
      return acc
    },
    { Present: 0, Late: 0, Absent: 0 }
  )

  const fetchAttendanceSheet = async () => {
    if (!selectedBatch || !selectedDate) return
    setLoading(true)
    setError('')
    setSaveSuccess('')
    setIsEditMode(false)
    try {
      const { data } = await api.get('/attendance/sheet', {
        params: { batch: selectedBatch, date: selectedDate },
      })
      if (data.success) {
        setRecords(data.data.records)
        setIsSaved(!!data.data.isSaved)
      } else {
        setError(data.message || 'Failed to load attendance sheet.')
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.request ? 'Unable to reach the server.' : 'Something went wrong.')
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeView === 'take') fetchAttendanceSheet()
  }, [selectedBatch, selectedDate, activeView])

  const handleStatusChange = (studentId, status) => {
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
    )
    setSaveSuccess('')
  }

  const handleMarkAll = (status) => {
    setRecords((prev) => prev.map((r) => ({ ...r, status })))
    setSaveSuccess('')
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSaveSuccess('')
    try {
      const { data } = await api.post('/attendance/sheet', {
        batch: selectedBatch,
        date: selectedDate,
        records: records.map((r) => ({ studentId: r.studentId, status: r.status })),
      })
      if (data.success) {
        setSaveSuccess('Attendance saved successfully!')
        setIsSaved(true)
      } else {
        setError(data.message || 'Failed to save attendance.')
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.request ? 'Unable to reach the server.' : 'Something went wrong.')
      )
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    setSaving(true)
    setError('')
    setSaveSuccess('')
    try {
      const { data } = await api.put('/attendance/sheet', {
        batch: selectedBatch,
        date: selectedDate,
        records: records.map((r) => ({ studentId: r.studentId, status: r.status })),
      })
      if (data.success) {
        setSaveSuccess('Attendance updated successfully!')
        setIsEditMode(false)
        setIsSaved(true)
      } else {
        setError(data.message || 'Failed to update attendance.')
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.request ? 'Unable to reach the server.' : 'Something went wrong.')
      )
    } finally {
      setSaving(false)
    }
  }

  const locked = isSaved && !isEditMode

  return (
    <div className="space-y-5">
      {/* ── View Toggle ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 bg-brand-surface-tint border border-brand-border rounded-xl w-fit">
        {[
          { id: 'take',    label: '📋 Take Attendance' },
          { id: 'history', label: '📊 View History'    },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeView === tab.id
                ? 'bg-brand-surface text-brand-primary shadow-sm font-extrabold scale-[1.02]'
                : 'text-brand-text-muted hover:text-brand-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── History View ────────────────────────────────────────────────────── */}
      {activeView === 'history' && (
        <AttendanceHistoryView allowedBatches={allowedBatches} />
      )}

      {/* ── Take Attendance View ─────────────────────────────────────────────── */}
      {activeView === 'take' && (
        <>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-extrabold text-brand-text tracking-tight">Attendance Tracker</h2>
              <p className="text-xs text-brand-text-muted mt-0.5">
                Select a batch and date to record or review daily attendance.
              </p>
            </div>
            {records.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <StatusPill status="Present" count={summary.Present} />
                <StatusPill status="Late"    count={summary.Late}    />
                <StatusPill status="Absent"  count={summary.Absent}  />
              </div>
            )}
          </div>

          {/* Control Panel */}
          <div className="rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label htmlFor="attn-batch" className="block text-xs font-semibold text-brand-text mb-1.5">
                  Select Batch
                </label>
                <select
                  id="attn-batch"
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full rounded-xl border border-brand-border bg-brand-surface px-4 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                >
                  {batches.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="attn-date" className="block text-xs font-semibold text-brand-text mb-1.5">
                  Select Date
                </label>
                <input
                  id="attn-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-xl border border-brand-border bg-brand-surface px-4 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                />
              </div>

              {records.length > 0 && !locked && (
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleMarkAll('Present')}
                    className="flex-1 rounded-xl border border-brand-primary/20 bg-brand-primary/10 px-3 py-2.5 text-xs font-bold text-brand-primary hover:bg-brand-primary/20 transition-all cursor-pointer"
                  >
                    ✓ All Present
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkAll('Absent')}
                    className="flex-1 rounded-xl border border-brand-accent/20 bg-brand-accent/10 px-3 py-2.5 text-xs font-bold text-brand-accent hover:bg-brand-accent/20 transition-all cursor-pointer"
                  >
                    ✗ All Absent
                  </button>
                </div>
              )}

              {records.length > 0 && locked && (
                <div className="flex items-end">
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-brand-primary/10 border border-brand-primary/20 px-4 py-2.5 text-xs font-bold text-brand-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Attendance saved for this day
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Main area */}
          {loading ? (
            <div className="rounded-2xl border border-brand-border bg-brand-surface py-14 text-center">
              <div className="inline-flex flex-col items-center gap-2">
                <svg className="animate-spin h-6 w-6 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-xs text-brand-text-muted font-bold">Loading students…</span>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-brand-accent/20 bg-brand-accent/5 p-6 text-center">
              <p className="text-sm text-brand-accent font-semibold">{error}</p>
              <button onClick={fetchAttendanceSheet} className="mt-2 text-xs text-brand-accent font-bold hover:underline">Retry</button>
            </div>
          ) : records.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand-border bg-brand-surface p-12 text-center">
              <p className="text-sm text-brand-text-muted">No students registered in this batch yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-brand-border bg-brand-surface shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-brand-border bg-brand-surface-tint">
                        <th className="px-4 py-3.5 font-bold text-brand-text-muted w-10 text-center">#</th>
                        <th className="px-4 py-3.5 font-bold text-brand-text">Student Name</th>
                        <th className="px-4 py-3.5 font-bold text-brand-text text-center">
                          Status
                          {locked && (
                            <span className="ml-2 text-[9px] font-bold text-brand-text-muted/65 normal-case tracking-normal">
                              (read-only — click Edit to change)
                            </span>
                          )}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                      {records.map((r, idx) => {
                        const statusColors = {
                          Present: 'bg-brand-primary/5',
                          Late:    'bg-brand-gold/5',
                          Absent:  'bg-brand-accent/5',
                        }
                        return (
                          <tr
                            key={r.studentId}
                            className={`transition-colors duration-150 ${locked ? statusColors[r.status] ?? '' : 'hover:bg-brand-primary/5'}`}
                          >
                            <td className="px-4 py-3.5 text-center text-brand-text-muted tabular-nums">{idx + 1}</td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {r.fullName?.charAt(0)?.toUpperCase() ?? '?'}
                                </div>
                                <span className="font-semibold text-brand-text">{r.fullName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex justify-center items-center gap-3">
                                {[
                                  { value: 'Present', activeClass: 'bg-brand-primary text-brand-surface border-brand-primary' },
                                  { value: 'Late',    activeClass: 'bg-brand-gold text-brand-surface border-brand-gold'   },
                                  { value: 'Absent',  activeClass: 'bg-brand-accent text-brand-surface border-brand-accent'     },
                                ].map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    disabled={locked}
                                    onClick={() => !locked && handleStatusChange(r.studentId, opt.value)}
                                    className={`rounded-full border px-3 py-1.5 text-[10px] font-bold transition-all duration-200
                                      ${r.status === opt.value
                                        ? opt.activeClass
                                        : 'border-brand-border bg-brand-surface text-brand-text-muted hover:border-brand-border hover:bg-brand-surface-tint'
                                      }
                                      ${locked ? 'cursor-default' : 'cursor-pointer'}`}
                                  >
                                    {opt.value}
                                  </button>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 border-t border-brand-border bg-brand-surface-tint flex items-center justify-between">
                  <span className="text-[11px] text-brand-text-muted">{records.length} student{records.length !== 1 ? 's' : ''} in this batch</span>
                  {isSaved && (
                    <span className="text-[11px] text-brand-text-muted font-semibold">
                      {summary.Present} present · {summary.Late} late · {summary.Absent} absent
                    </span>
                  )}
                </div>
              </div>

              {/* Footer action row */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  {saveSuccess && (
                    <p className="text-xs text-brand-primary font-bold flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {saveSuccess}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!isSaved && (
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="rounded-xl bg-brand-accent hover:bg-brand-accent-hover px-5 py-3 text-xs font-bold text-brand-surface disabled:opacity-60 transition-all cursor-pointer shadow-sm"
                    >
                      {saving ? 'Saving…' : 'Save Attendance'}
                    </button>
                  )}
                  {isSaved && !isEditMode && (
                    <button
                      type="button"
                      onClick={() => setIsEditMode(true)}
                      className="rounded-xl bg-brand-primary hover:bg-brand-primary/90 px-5 py-3 text-xs font-bold text-brand-surface transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Edit Attendance
                    </button>
                  )}
                  {isSaved && isEditMode && (
                    <>
                      <button
                        type="button"
                        onClick={() => { setIsEditMode(false); fetchAttendanceSheet() }}
                        disabled={saving}
                        className="rounded-xl border border-brand-border bg-brand-surface px-4 py-3 text-xs font-bold text-brand-text hover:bg-brand-surface-tint disabled:opacity-60 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdate}
                        disabled={saving}
                        className="rounded-xl bg-brand-accent hover:bg-brand-accent-hover px-5 py-3 text-xs font-bold text-brand-surface disabled:opacity-60 transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {saving ? 'Updating…' : 'Update Attendance'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
