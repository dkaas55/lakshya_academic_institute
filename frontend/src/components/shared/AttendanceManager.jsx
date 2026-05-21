import { useEffect, useState } from 'react'
import api from '../../lib/api'
import StudentFilterBar from './StudentFilterBar'

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
    Present: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    Late:    { bg: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-400'   },
    Absent:  { bg: 'bg-rose-50 text-rose-700 border-rose-200',          dot: 'bg-rose-500'    },
  }[status] ?? { bg: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'bg-slate-400' }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cfg.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {count} {status}
    </span>
  )
}

function PctBadge({ pct }) {
  if (pct === null) return <span className="text-[11px] text-slate-400">—</span>
  const cls =
    pct >= 85 ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' :
    pct >= 75 ? 'bg-amber-50 text-amber-700 ring-amber-200' :
                'bg-rose-50 text-rose-700 ring-rose-200'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${cls}`}>
      {pct}%
    </span>
  )
}

// ── History View Sub-panel ────────────────────────────────────────────────────
function AttendanceHistoryView({ allowedBatches }) {
  const batches = allowedBatches || ALL_BATCH_OPTIONS
  const [batch,    setBatch]    = useState(batches[0] || '')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [result,   setResult]   = useState(null)
  const [filtered, setFiltered] = useState([])

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
    <div className="space-y-5">
      {/* Controls */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Batch</label>
            <select
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {batches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors shadow-sm"
            >
              {loading ? 'Loading…' : 'Load Report'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}

      {result && (
        <div className="space-y-4">
          {/* Summary strip */}
          <div className="flex items-center gap-3 flex-wrap text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700">{result.batch}</span>
            <span>·</span>
            <span>{result.totalClassDays} class day{result.totalClassDays !== 1 ? 's' : ''} recorded</span>
            {result.dateFrom && <><span>·</span><span>From {result.dateFrom} to {result.dateTo || 'today'}</span></>}
          </div>

          {/* Student Filter Bar */}
          <StudentFilterBar
            students={result.students || []}
            onFilterChange={setFiltered}
            accentColor="indigo"
          />

          {/* Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 font-semibold text-slate-600">Student</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-center">Present</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-center">Late</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-center">Absent</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-center">Total</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-center">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-xs">
                        {search ? 'No students match your search.' : 'No records found for this filter.'}
                      </td>
                    </tr>
                  ) : filtered.map((s) => (
                    <tr key={s.studentId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {s.fullName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-900">{s.fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">{s.present}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold">{s.late}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold">{s.absent}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center text-slate-600 font-medium">{s.total}</td>
                      <td className="px-4 py-2.5 text-center"><PctBadge pct={s.attendancePercentage} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length > 0 && (
              <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/60">
                <span className="text-[11px] text-slate-400">
                  {filtered.length} student{filtered.length !== 1 ? 's' : ''} ·&nbsp;
                  <span className="text-emerald-600 font-medium">≥85% = Good</span>&nbsp;·&nbsp;
                  <span className="text-amber-600 font-medium">75–84% = Average</span>&nbsp;·&nbsp;
                  <span className="text-rose-600 font-medium">&lt;75% = Low</span>
                </span>
              </div>
            )}
          </div>
        </div>
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
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {[
          { id: 'take',    label: '📋 Take Attendance' },
          { id: 'history', label: '📊 View History'    },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeView === tab.id
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
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
              <h2 className="text-base font-semibold text-slate-900">Attendance Tracker</h2>
              <p className="text-xs text-slate-500 mt-0.5">
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
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label htmlFor="attn-batch" className="block text-xs font-medium text-slate-700 mb-1">
                  Select Batch
                </label>
                <select
                  id="attn-batch"
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {batches.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="attn-date" className="block text-xs font-medium text-slate-700 mb-1">
                  Select Date
                </label>
                <input
                  id="attn-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {records.length > 0 && !locked && (
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleMarkAll('Present')}
                    className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    ✓ All Present
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkAll('Absent')}
                    className="flex-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
                  >
                    ✗ All Absent
                  </button>
                </div>
              )}

              {records.length > 0 && locked && (
                <div className="flex items-end">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
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
            <div className="rounded-xl border border-slate-200 bg-white py-14 text-center">
              <div className="inline-flex flex-col items-center gap-2">
                <svg className="animate-spin h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm text-slate-500">Loading students…</span>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center">
              <p className="text-sm text-red-700 font-medium">{error}</p>
              <button onClick={fetchAttendanceSheet} className="mt-2 text-xs text-red-600 hover:underline">Retry</button>
            </div>
          ) : records.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
              <p className="text-sm text-slate-500">No students registered in this batch yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="px-4 py-3 font-semibold text-slate-500 w-10 text-center">#</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Student Name</th>
                        <th className="px-4 py-3 font-semibold text-slate-600 text-center">
                          Status
                          {locked && (
                            <span className="ml-2 text-[9px] font-medium text-slate-400 normal-case tracking-normal">
                              (read-only — click Edit to change)
                            </span>
                          )}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {records.map((r, idx) => {
                        const statusColors = {
                          Present: 'bg-emerald-50/60',
                          Late:    'bg-amber-50/60',
                          Absent:  'bg-rose-50/60',
                        }
                        return (
                          <tr
                            key={r.studentId}
                            className={`transition-colors ${locked ? statusColors[r.status] ?? '' : 'hover:bg-slate-50/50'}`}
                          >
                            <td className="px-4 py-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {r.fullName?.charAt(0)?.toUpperCase() ?? '?'}
                                </div>
                                <span className="font-semibold text-slate-900">{r.fullName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-center items-center gap-3">
                                {[
                                  { value: 'Present', activeClass: 'bg-emerald-500 text-white border-emerald-500' },
                                  { value: 'Late',    activeClass: 'bg-amber-500 text-white border-amber-500'   },
                                  { value: 'Absent',  activeClass: 'bg-rose-500 text-white border-rose-500'     },
                                ].map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    disabled={locked}
                                    onClick={() => !locked && handleStatusChange(r.studentId, opt.value)}
                                    className={`rounded-full border px-3 py-1 text-[10px] font-semibold transition-all
                                      ${r.status === opt.value
                                        ? opt.activeClass
                                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
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
                <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">{records.length} student{records.length !== 1 ? 's' : ''} in this batch</span>
                  {isSaved && (
                    <span className="text-[11px] text-slate-400">
                      {summary.Present} present · {summary.Late} late · {summary.Absent} absent
                    </span>
                  )}
                </div>
              </div>

              {/* Footer action row */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  {saveSuccess && (
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
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
                      className="rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors shadow-sm"
                    >
                      {saving ? 'Saving…' : 'Save Attendance'}
                    </button>
                  )}
                  {isSaved && !isEditMode && (
                    <button
                      type="button"
                      onClick={() => setIsEditMode(true)}
                      className="rounded-lg bg-amber-500 px-5 py-2.5 text-xs font-semibold text-white hover:bg-amber-400 transition-colors shadow-sm flex items-center gap-1.5"
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
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdate}
                        disabled={saving}
                        className="rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60 transition-colors shadow-sm flex items-center gap-1.5"
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
