import { useCallback, useEffect, useState } from 'react'
import api from '../../lib/api'
import FeeLedgerModal from './FeeLedgerModal'
import StudentEditModal from './StudentEditModal'
import StudentFilterBar from '../shared/StudentFilterBar'

function FeeStatusBadge({ status }) {
  const styles = {
    PAID:    'bg-emerald-50 text-emerald-700 ring-emerald-200',
    PARTIAL: 'bg-sky-50 text-sky-700 ring-sky-200',
    PENDING: 'bg-amber-50 text-amber-800 ring-amber-200',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${styles[status] ?? styles.PENDING}`}>
      {status}
    </span>
  )
}

function AccountStatusBadge({ status }) {
  const styles = {
    active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    paused: 'bg-amber-50 text-amber-800 ring-amber-200',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ring-1 ${styles[status] ?? styles.active}`}>
      {status === 'active' ? '● Active' : '⏸ Paused'}
    </span>
  )
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
}

export default function ActiveStudentsList({ refreshKey = 0 }) {
  const [students,         setStudents]         = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [loading,          setLoading]          = useState(true)
  const [error,            setError]            = useState('')
  const [selectedStudent,  setSelectedStudent]  = useState(null)
  const [editStudent,      setEditStudent]       = useState(null)
  const [statusLoading,    setStatusLoading]    = useState(null)  // studentId being toggled

  const loadStudents = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/students')
      if (!data.success) {
        setError(data.message || 'Could not load students.')
        setStudents([])
        setFilteredStudents([])
        return
      }
      const list = data.data?.students ?? []
      setStudents(list)
      setFilteredStudents(list)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.request ? 'Unable to reach the server. Is the backend running?' : 'Failed to load students.')
      )
      setStudents([])
      setFilteredStudents([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStudents()
  }, [loadStudents, refreshKey])

  function handlePaymentCollected(feeStatus) {
    if (!selectedStudent) return
    setStudents((prev) =>
      prev.map((s) => s.id === selectedStudent.id ? { ...s, feeStatus } : s)
    )
  }

  function handleStudentUpdated(updatedStudent) {
    setStudents((prev) =>
      prev.map((s) => (s.id === updatedStudent.id ? { ...s, ...updatedStudent } : s))
    )
  }

  async function handleStatusChange(student, newStatus) {
    const confirmed =
      newStatus === 'removed'
        ? window.confirm(`Are you sure you want to REMOVE ${student.fullName}? They will be hidden from all dashboards and blocked from login.`)
        : true

    if (!confirmed) return

    setStatusLoading(student.id)
    try {
      const { data } = await api.patch(`/students/${student.id}/status`, { status: newStatus })
      if (data.success) {
        if (newStatus === 'removed') {
          // Remove from the list immediately
          setStudents((prev) => prev.filter((s) => s.id !== student.id))
        } else {
          setStudents((prev) =>
            prev.map((s) => s.id === student.id ? { ...s, status: newStatus } : s)
          )
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update student status.')
    } finally {
      setStatusLoading(null)
    }
  }

  return (
    <>
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Active Students List</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {students.length === 0
                ? 'No students registered yet.'
                : `Showing ${filteredStudents.length} of ${students.length} student${students.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <button
            type="button"
            onClick={loadStudents}
            disabled={loading}
            className="self-start sm:self-auto rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* Filter Bar */}
        {students.length > 0 && (
          <div className="px-4 pt-3 pb-1">
            <StudentFilterBar
              students={students}
              onFilterChange={setFilteredStudents}
              accentColor="indigo"
            />
          </div>
        )}

        {error && (
          <p role="alert" className="mx-4 mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {loading && students.length === 0 ? (
          <div className="px-4 py-10 text-center text-xs text-slate-500">Loading students…</div>
        ) : students.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-xs text-slate-500">Register a student above to see them listed here.</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-xs text-slate-500">No students match your filters.</p>
          </div>
        ) : (
          <div className={`overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-2.5 font-semibold text-slate-600">Name</th>
                  <th className="px-4 py-2.5 font-semibold text-slate-600">Phone</th>
                  <th className="px-4 py-2.5 font-semibold text-slate-600">Batch</th>
                  <th className="px-4 py-2.5 font-semibold text-slate-600">Class</th>
                  <th className="px-4 py-2.5 font-semibold text-slate-600">Joined</th>
                  <th className="px-4 py-2.5 font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-2.5 font-semibold text-slate-600">Fee</th>
                  <th className="px-4 py-2.5 font-semibold text-slate-600 w-48">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${student.status === 'paused' ? 'opacity-70' : ''}`}
                    onClick={() => setSelectedStudent(student)}
                  >
                    <td className="px-4 py-2.5 font-medium text-slate-900">{student.fullName}</td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-700">{student.phoneNumber}</td>
                    <td className="px-4 py-2.5 text-slate-700">{student.batch}</td>
                    <td className="px-4 py-2.5 text-slate-700">{student.studentClass || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{student.joiningDate ? new Date(student.joiningDate).toLocaleDateString('en-GB') : '—'}</td>
                    <td className="px-4 py-2.5"><AccountStatusBadge status={student.status ?? 'active'} /></td>
                    <td className="px-4 py-2.5"><FeeStatusBadge status={student.feeStatus} /></td>
                    <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setEditStudent(student)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedStudent(student)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          Ledger
                        </button>
                        {/* Pause / Resume toggle */}
                        {student.status === 'paused' ? (
                          <button
                            type="button"
                            disabled={statusLoading === student.id}
                            onClick={() => handleStatusChange(student, 'active')}
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                          >
                            {statusLoading === student.id ? '…' : '▶ Resume'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={statusLoading === student.id}
                            onClick={() => handleStatusChange(student, 'paused')}
                            className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition-colors"
                          >
                            {statusLoading === student.id ? '…' : '⏸ Pause'}
                          </button>
                        )}
                        {/* Remove */}
                        <button
                          type="button"
                          disabled={statusLoading === student.id}
                          onClick={() => handleStatusChange(student, 'removed')}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50 transition-colors"
                        >
                          {statusLoading === student.id ? '…' : '✕ Remove'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedStudent && (
        <FeeLedgerModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onPaymentCollected={handlePaymentCollected}
        />
      )}

      {editStudent && (
        <StudentEditModal
          student={editStudent}
          onClose={() => setEditStudent(null)}
          onUpdated={handleStudentUpdated}
        />
      )}
    </>
  )
}
