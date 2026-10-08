import { useCallback, useEffect, useState } from 'react'
import api from '../../lib/api'
import FeeLedgerModal from './FeeLedgerModal'
import StudentEditModal from './StudentEditModal'
import StudentDetailModal from './StudentDetailModal'
import StudentFilterBar from '../shared/StudentFilterBar'
import { BRANDING } from '../../config/branding'

function FeeStatusBadge({ status }) {
  const styles = {
    PAID:    'bg-brand-primary/10 text-brand-primary ring-emerald-200',
    PARTIAL: 'bg-sky-50 text-sky-700 ring-sky-200',
    PENDING: 'bg-amber-50 text-amber-800 ring-amber-200',
  }
  const cleanStatus = status || '';
  let baseStatus = 'PENDING';
  if (cleanStatus === 'PAID') {
    baseStatus = 'PAID';
  } else if (cleanStatus === 'PARTIAL') {
    baseStatus = 'PARTIAL';
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${styles[baseStatus]}`}>
      {status}
    </span>
  )
}

function AccountStatusBadge({ status }) {
  const styles = {
    active: 'bg-brand-primary/10 text-brand-primary ring-emerald-200',
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
  const [feeStudent,       setFeeStudent]       = useState(null)
  const [editStudent,      setEditStudent]       = useState(null)

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
    const studentToUpdate = feeStudent || selectedStudent
    if (!studentToUpdate) return
    setStudents((prev) =>
      prev.map((s) => s.id === studentToUpdate.id ? { ...s, feeStatus } : s)
    )
    if (selectedStudent && selectedStudent.id === studentToUpdate.id) {
      setSelectedStudent((prev) => (prev ? { ...prev, feeStatus } : null))
    }
  }

  function handleStudentUpdated(updatedStudent) {
    setStudents((prev) =>
      prev.map((s) => (s.id === updatedStudent.id ? { ...s, ...updatedStudent } : s))
    )
    if (selectedStudent && selectedStudent.id === updatedStudent.id) {
      setSelectedStudent((prev) => (prev ? { ...prev, ...updatedStudent } : null))
    }
  }

  function handleStudentRemoved(studentId) {
    setStudents((prev) => prev.filter((s) => s.id !== studentId))
    if (selectedStudent && selectedStudent.id === studentId) {
      setSelectedStudent(null)
    }
  }

  return (
    <>
      <section className="rounded-2xl border border-brand-border bg-brand-surface shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-brand-border bg-brand-surface-tint/60">
          <div>
            <h3 className="text-sm font-semibold text-brand-text">Active Students List</h3>
            <p className="text-[11px] text-brand-text-muted mt-0.5">
              {students.length === 0
                ? 'No students registered yet.'
                : `Showing ${filteredStudents.length} of ${students.length} student${students.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <button
            type="button"
            onClick={loadStudents}
            disabled={loading}
            className="self-start sm:self-auto rounded-lg border border-brand-border bg-brand-surface px-2.5 py-1.5 text-[11px] font-medium text-brand-text hover:bg-brand-surface-tint disabled:opacity-50 transition-colors"
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
          <div className="px-4 py-10 text-center text-xs text-brand-text-muted">Loading students…</div>
        ) : students.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-xs text-brand-text-muted">Register a student above to see them listed here.</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-xs text-brand-text-muted">No students match your filters.</p>
          </div>
        ) : (
          <div className={`overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brand-border bg-brand-surface-tint/80">
                  <th className="px-3 sm:px-4 py-2.5 font-semibold text-brand-text">Roll No</th>
                  <th className="px-3 sm:px-4 py-2.5 font-semibold text-brand-text">Name</th>
                  <th className="hidden md:table-cell px-4 py-2.5 font-semibold text-brand-text">{BRANDING.batchSectionLabel}</th>
                  <th className="hidden md:table-cell px-4 py-2.5 font-semibold text-brand-text">Joined</th>
                  <th className="hidden md:table-cell px-4 py-2.5 font-semibold text-brand-text">Status</th>
                  <th className="hidden md:table-cell px-4 py-2.5 font-semibold text-brand-text">Fee</th>
                  <th className="px-3 sm:px-4 py-2.5 font-semibold text-brand-text text-right sm:text-left w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className={`hover:bg-brand-surface-tint/80 transition-colors cursor-pointer ${student.status === 'paused' ? 'opacity-70' : ''}`}
                    onClick={() => setSelectedStudent(student)}
                  >
                    <td className="px-3 sm:px-4 py-2.5 font-mono text-[11px] whitespace-nowrap">
                      {student.rollNo ? (
                        <span className="inline-block rounded-md bg-brand-primary/10 text-brand-primary px-2 py-0.5 font-extrabold ring-1 ring-brand-primary/20">
                          {student.rollNo}
                        </span>
                      ) : (
                        <span className="text-brand-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 font-medium text-brand-text">
                      <span className="block truncate max-w-[130px] sm:max-w-none">{student.fullName}</span>
                    </td>
                    <td className="hidden md:table-cell px-4 py-2.5 text-brand-text">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {(student.batches && student.batches.length > 0
                          ? student.batches
                          : (student.batch ? student.batch.split(',').map((b) => b.trim()).filter(Boolean) : [])
                        ).map((b, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center rounded-md bg-brand-surface-tint border border-brand-border px-1.5 py-0.5 text-[10px] font-medium text-brand-text"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-2.5 text-brand-text-muted whitespace-nowrap">{student.joiningDate ? new Date(student.joiningDate).toLocaleDateString('en-GB') : '—'}</td>
                    <td className="hidden md:table-cell px-4 py-2.5"><AccountStatusBadge status={student.status ?? 'active'} /></td>
                    <td className="hidden md:table-cell px-4 py-2.5"><FeeStatusBadge status={student.feeStatus} /></td>
                    <td className="px-3 sm:px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end sm:justify-start gap-1 sm:gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedStudent(student)}
                          className="rounded-lg border border-brand-border bg-brand-surface px-2 py-1 text-[10px] font-semibold text-brand-text hover:bg-brand-surface-tint transition-colors"
                          title="View complete student information"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditStudent(student)}
                          className="rounded-lg border border-brand-border bg-brand-surface px-2 py-1 text-[10px] font-semibold text-brand-text hover:bg-brand-surface-tint transition-colors"
                          title="Edit student profile"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setFeeStudent(student)}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2 py-1 text-[10px] font-semibold transition-colors"
                          title="Collect fee or view ledger"
                        >
                          Fee
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

      {/* Complete Student Information Modal */}
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onCollectFee={(student) => {
            setSelectedStudent(null)
            setFeeStudent(student)
          }}
          onEdit={(student) => {
            setSelectedStudent(null)
            setEditStudent(student)
          }}
        />
      )}

      {/* Collect Fee / Fee Ledger Modal */}
      {feeStudent && (
        <FeeLedgerModal
          student={feeStudent}
          onClose={() => setFeeStudent(null)}
          onPaymentCollected={handlePaymentCollected}
        />
      )}

      {/* Student Edit Modal */}
      {editStudent && (
        <StudentEditModal
          student={editStudent}
          onClose={() => setEditStudent(null)}
          onUpdated={handleStudentUpdated}
          onRemoved={handleStudentRemoved}
        />
      )}
    </>
  )
}
