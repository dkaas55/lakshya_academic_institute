import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { BRANDING } from '../../config/branding'
import {
  Clock,
  IndianRupee,
  Users,
  Sparkles,
  GraduationCap,
  UserCheck,
  Search,
  X,
} from 'lucide-react'

const SUBJECT_OPTIONS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Science',
  'English',
  'Hindi',
  'History',
  'Geography',
  'Economics',
  'Computer Science',
  'Accountancy',
  'Business Studies',
  'Political Science',
  'Psychology',
]

const initialForm = {
  name: '',
  subject: '',
  feePerStudent: '',
  timing: '',
  assignedTeachers: [],
}

export default function BatchManagement() {
  const [batches, setBatches] = useState([])
  const [teachers, setTeachers] = useState([])
  const [studentCounts, setStudentCounts] = useState({})
  const [allStudents, setAllStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingBatch, setEditingBatch] = useState(null)

  // Batch detail modal state
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [detailSearch, setDetailSearch] = useState('')

  // Enrollment modal state
  const [enrollModalBatch, setEnrollModalBatch] = useState(null)
  const [selectedStudentIds, setSelectedStudentIds] = useState([])
  const [enrollSearch, setEnrollSearch] = useState('')
  const [enrollFilter, setEnrollFilter] = useState('all') // 'all' | 'enrolled' | 'not_enrolled'
  const [savingEnroll, setSavingEnroll] = useState(false)

  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const loadBatches = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/admin/batches')
      if (data.success) {
        setBatches(data.data.batches)
      } else {
        setError(data.message || 'Failed to load batches.')
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

  const loadTeachers = async () => {
    try {
      const { data } = await api.get('/admin/teachers')
      if (data.success) {
        setTeachers(data.data.teachers)
      }
    } catch {
      /* ignore — teachers list is supplementary */
    }
  }

  const loadStudentCounts = async () => {
    try {
      const { data } = await api.get('/students')
      if (data.success) {
        const studentList = data.data.students || []
        setAllStudents(studentList)
        const counts = {}
        for (const s of studentList) {
          const studentBatches = Array.isArray(s.batches) && s.batches.length > 0
            ? s.batches
            : (s.batch || '').split(',').map((b) => b.trim()).filter(Boolean)

          for (const bName of studentBatches) {
            counts[bName] = (counts[bName] || 0) + 1
          }
        }
        setStudentCounts(counts)
      }
    } catch {
      /* ignore — student counts are supplementary */
    }
  }

  useEffect(() => {
    loadBatches()
    loadTeachers()
    loadStudentCounts()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedBatch(null)
      }
    }
    if (selectedBatch) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedBatch])

  /* ---- Modal helpers ---- */

  const openAddModal = () => {
    setEditingBatch(null)
    setForm({ ...initialForm })
    setFormError('')
    setShowModal(true)
  }

  const openEditModal = (batch) => {
    setEditingBatch(batch)
    setForm({
      name: batch.name || '',
      subject: batch.subject || '',
      feePerStudent: batch.feePerStudent != null ? batch.feePerStudent : '',
      timing: batch.timing || '',
      assignedTeachers: (batch.assignedTeachers || []).map((t) => String(t.id || t._id || t)),
    })
    setFormError('')
    setShowModal(true)
  }

  const openEnrollModal = (batch) => {
    setEnrollModalBatch(batch)
    const enrolledIds = allStudents
      .filter((s) => {
        const sBatches = Array.isArray(s.batches) && s.batches.length > 0
          ? s.batches
          : (s.batch || '').split(',').map((b) => b.trim()).filter(Boolean)
        return sBatches.includes(batch.name)
      })
      .map((s) => s.id)
    setSelectedStudentIds(enrolledIds)
    setEnrollSearch('')
    setEnrollFilter('all')
  }

  const handleToggleStudentEnroll = (studentId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleSaveEnrollments = async () => {
    if (!enrollModalBatch) return
    setSavingEnroll(true)
    try {
      const { data } = await api.put(`/admin/batches/${enrollModalBatch.id}/students`, {
        studentIds: selectedStudentIds,
      })
      if (data.success) {
        await loadStudentCounts()
        setEnrollModalBatch(null)
      } else {
        alert(data.message || 'Failed to update batch enrollments.')
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update batch enrollments.')
    } finally {
      setSavingEnroll(false)
    }
  }

  /* ---- CRUD ---- */

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete batch "${name}"?`)) return
    try {
      const { data } = await api.delete(`/admin/batches/${id}`)
      if (data.success) {
        setBatches(batches.filter((b) => b.id !== id))
        if (selectedBatch?.id === id) {
          setSelectedBatch(null)
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete batch.')
    }
  }

  const handleTeacherToggle = (teacherId) => {
    const idStr = String(teacherId)
    setForm((prev) => {
      const active = prev.assignedTeachers.some((id) => String(id) === idStr)
      return {
        ...prev,
        assignedTeachers: active
          ? prev.assignedTeachers.filter((id) => String(id) !== idStr)
          : [...prev.assignedTeachers, idStr],
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)

    try {
      const payload = {
        name: form.name.trim(),
        subject: form.subject.trim(),
        feePerStudent: form.feePerStudent !== '' ? Math.max(0, Number(form.feePerStudent)) : 0,
        timing: form.timing.trim() || null,
        assignedTeachers: form.assignedTeachers,
      }

      if (editingBatch) {
        const { data } = await api.put(`/admin/batches/${editingBatch.id}`, payload)
        if (data.success) {
          setBatches(batches.map((b) => (b.id === editingBatch.id ? data.data : b)))
          setShowModal(false)
        } else {
          setFormError(data.message || 'Update failed.')
        }
      } else {
        const { data } = await api.post('/admin/batches', payload)
        if (data.success) {
          setBatches([data.data, ...batches])
          setShowModal(false)
        } else {
          setFormError(data.message || 'Creation failed.')
        }
      }
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          (err.request ? 'Unable to reach the server.' : 'Something went wrong.')
      )
    } finally {
      setSubmitting(false)
    }
  }

  /* ---- Render ---- */

  const activeSelectedBatch = selectedBatch
    ? batches.find((b) => b.id === selectedBatch.id) || selectedBatch
    : null

  const currentEnrolledStudents = activeSelectedBatch
    ? allStudents.filter((s) => {
        const sBatches = Array.isArray(s.batches) && s.batches.length > 0
          ? s.batches
          : (s.batch || '').split(',').map((b) => b.trim()).filter(Boolean)
        return sBatches.includes(activeSelectedBatch.name)
      })
    : []

  const displayedRoster = currentEnrolledStudents.filter((s) => {
    if (!detailSearch.trim()) return true
    const q = detailSearch.toLowerCase().trim()
    return (
      (s.fullName || '').toLowerCase().includes(q) ||
      (s.rollNo || '').toLowerCase().includes(q) ||
      (s.phoneNumber || '').includes(q) ||
      (s.studentClass || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-brand-text">{BRANDING.batchManagementLabel}</h2>
          <p className="text-xs text-brand-text-muted mt-0.5">
            Create, edit and manage {BRANDING.batchesLabel.toLowerCase()}, subjects, per-student fees, and teacher assignments.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="rounded-lg bg-brand-primary px-4 py-2 text-xs font-semibold text-brand-surface hover:bg-brand-primary/100 transition-colors cursor-pointer"
        >
          + {BRANDING.createBatchLabel}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12 text-center text-sm text-brand-text-muted">Loading {BRANDING.batchesLabel.toLowerCase()}...</div>
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-700">
          {error}
        </div>
      ) : batches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-border bg-brand-surface p-12 text-center">
          <p className="text-sm text-brand-text-muted">
            No {BRANDING.batchesLabel.toLowerCase()} created yet. Click &quot;+ {BRANDING.createBatchLabel}&quot; to get started.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-brand-border bg-brand-surface shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brand-border bg-brand-surface-tint">
                  <th className="px-4 py-3 font-semibold text-brand-text">{BRANDING.batchNameLabel}</th>
                  <th className="px-4 py-3 font-semibold text-brand-text">Timing</th>
                  <th className="px-4 py-3 font-semibold text-brand-text">Assigned Teachers</th>
                  <th className="hidden md:table-cell px-4 py-3 font-semibold text-brand-text text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {batches.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => {
                      setSelectedBatch(b)
                      setDetailSearch('')
                    }}
                    className="hover:bg-brand-surface-tint/60 transition-colors cursor-pointer group"
                    title={`Click to view full ${BRANDING.batchLabel.toLowerCase()} details`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-brand-text group-hover:text-brand-primary transition-colors">
                        {b.name}
                      </p>
                      {b.subject ? (
                        <span className="inline-block mt-0.5 rounded-md bg-brand-primary/10 text-brand-primary px-2 py-0.5 text-[10px] font-semibold border border-brand-primary/20">
                          {b.subject}
                        </span>
                      ) : (
                        <span className="text-brand-text-muted/75 italic text-[10px]">No subject</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {b.timing ? (
                        <span className="text-brand-text">{b.timing}</span>
                      ) : (
                        <span className="text-brand-text-muted/75 italic text-[10px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {b.assignedTeachers?.length > 0 ? (
                          b.assignedTeachers.map((t) => (
                            <span
                              key={t.id || t._id || t}
                              className="inline-flex flex-col items-start rounded-md bg-brand-surface-tint px-2 py-1 text-brand-text border border-brand-border"
                            >
                              <span className="font-medium text-[11px] leading-tight">
                                {t.name || t.username || t}
                              </span>
                              {t.subject && (
                                <span className="text-brand-primary font-semibold text-[10px] leading-tight mt-0.5">
                                  {t.subject}
                                </span>
                              )}
                            </span>
                          ))
                        ) : (
                          <span className="text-brand-text-muted/75 italic text-[10px]">
                            No teachers
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openEnrollModal(b)}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary px-2.5 py-1 text-xs font-semibold mr-3 transition-colors cursor-pointer"
                        title="Enroll or remove students in this batch"
                      >
                        <span>👥 Enroll Students</span>
                      </button>
                      <button
                        onClick={() => openEditModal(b)}
                        className="text-brand-primary hover:text-indigo-800 font-medium mr-3 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(b.id, b.name)}
                        className="text-red-600 hover:text-red-800 font-medium cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Batch Detail Modal (opened on clicking batch row) */}
      {activeSelectedBatch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-brand-text/40 backdrop-blur-sm"
          onClick={() => setSelectedBatch(null)}
        >
          <div
            className="bg-brand-surface rounded-2xl border border-brand-border shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-brand-border bg-brand-surface-tint/60 shrink-0">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-lg font-bold text-brand-text tracking-tight">
                    {activeSelectedBatch.name}
                  </h3>
                  {activeSelectedBatch.subject && (
                    <span className="rounded-full bg-brand-primary/10 text-brand-primary px-3 py-0.5 text-xs font-bold border border-brand-primary/20">
                      {activeSelectedBatch.subject}
                    </span>
                  )}
                </div>
                {activeSelectedBatch.timing && (
                  <p className="flex items-center gap-1.5 text-xs text-brand-text-muted mt-1 font-medium">
                    <Clock size={13} className="text-brand-text-muted shrink-0" />
                    <span>Timing: {activeSelectedBatch.timing}</span>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedBatch(null)}
                className="p-1.5 rounded-xl text-brand-text-muted hover:text-brand-text hover:bg-brand-surface border border-transparent hover:border-brand-border transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Stat Cards Overview: Fee, Enrolled Students, Fee Pool, Assigned Teachers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Fee / Student */}
                <div className="rounded-xl border border-brand-border bg-brand-surface-tint/40 p-3.5 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted flex items-center gap-1">
                    <IndianRupee size={12} /> Fee / Student
                  </span>
                  <p className="text-base sm:text-lg font-black text-brand-text">
                    {activeSelectedBatch.feePerStudent > 0
                      ? `₹${activeSelectedBatch.feePerStudent.toLocaleString('en-IN')}`
                      : '₹0'}
                    <span className="text-xs font-normal text-brand-text-muted"> / mo</span>
                  </p>
                </div>

                {/* Students Enrolled */}
                <div className="rounded-xl border border-brand-border bg-brand-surface-tint/40 p-3.5 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted flex items-center gap-1">
                    <Users size={12} /> Students
                  </span>
                  <p className="text-base sm:text-lg font-black text-brand-primary">
                    {currentEnrolledStudents.length}
                    <span className="text-xs font-semibold text-brand-text-muted"> enrolled</span>
                  </p>
                </div>

                {/* Monthly Fee Pool */}
                <div className="rounded-xl border border-brand-border bg-brand-surface-tint/40 p-3.5 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted flex items-center gap-1">
                    <Sparkles size={12} /> Fee Pool
                  </span>
                  <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                    ₹{(currentEnrolledStudents.length * (activeSelectedBatch.feePerStudent || 0)).toLocaleString('en-IN')}
                    <span className="text-xs font-normal text-brand-text-muted"> / mo</span>
                  </p>
                </div>

                {/* Assigned Teachers */}
                <div className="rounded-xl border border-brand-border bg-brand-surface-tint/40 p-3.5 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted flex items-center gap-1">
                    <GraduationCap size={12} /> Teachers
                  </span>
                  <p className="text-base sm:text-lg font-black text-brand-text">
                    {activeSelectedBatch.assignedTeachers?.length || 0}
                    <span className="text-xs font-normal text-brand-text-muted"> assigned</span>
                  </p>
                </div>
              </div>

              {/* Assigned Teachers Section */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text-muted flex items-center gap-1.5">
                  <UserCheck size={14} className="text-brand-primary" />
                  Assigned Teachers
                </h4>
                {activeSelectedBatch.assignedTeachers?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeSelectedBatch.assignedTeachers.map((t) => (
                      <div
                        key={t.id || t._id || t}
                        className="rounded-xl border border-brand-border bg-brand-surface p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {(t.name || t.username || 'T')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-brand-text truncate">
                              {t.name || t.username}
                            </p>
                            {t.subject && (
                              <p className="text-[10px] text-brand-text-muted truncate">
                                Subject: {t.subject}
                              </p>
                            )}
                          </div>
                        </div>
                        {t.phone && (
                          <span className="text-[10px] font-medium text-brand-text-muted">
                            {t.phone}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-brand-border p-4 text-center text-xs text-brand-text-muted italic bg-brand-surface-tint/30">
                    No teachers assigned to this batch yet.
                  </div>
                )}
              </div>

              {/* Enrolled Students Roster */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text-muted flex items-center gap-1.5">
                    <Users size={14} className="text-brand-primary" />
                    Enrolled Students ({currentEnrolledStudents.length})
                  </h4>
                  {currentEnrolledStudents.length > 0 && (
                    <div className="relative">
                      <Search size={13} className="absolute left-2.5 top-2.5 text-brand-text-muted" />
                      <input
                        type="text"
                        placeholder="Filter roster..."
                        value={detailSearch}
                        onChange={(e) => setDetailSearch(e.target.value)}
                        className="rounded-lg border border-brand-border bg-brand-surface pl-8 pr-3 py-1 text-xs focus:ring-2 focus:ring-brand-primary outline-none"
                      />
                    </div>
                  )}
                </div>

                {currentEnrolledStudents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-brand-border p-6 text-center space-y-2 bg-brand-surface-tint/30">
                    <p className="text-xs text-brand-text-muted">
                      No students are currently enrolled in this batch.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const b = activeSelectedBatch
                        setSelectedBatch(null)
                        openEnrollModal(b)
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-primary/90 cursor-pointer"
                    >
                      <span>👥 Enroll Students Now</span>
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-brand-border overflow-hidden">
                    <div className="max-h-56 overflow-y-auto divide-y divide-brand-border">
                      {displayedRoster.length === 0 ? (
                        <p className="p-4 text-center text-xs text-brand-text-muted">
                          No enrolled students match &quot;{detailSearch}&quot;.
                        </p>
                      ) : (
                        displayedRoster.map((s) => (
                          <div
                            key={s.id}
                            className="px-3.5 py-2.5 flex items-center justify-between bg-brand-surface hover:bg-brand-surface-tint/40 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {s.rollNo ? (
                                <span className="font-mono text-[10px] font-extrabold bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded ring-1 ring-brand-primary/20 shrink-0">
                                  {s.rollNo}
                                </span>
                              ) : (
                                <span className="text-[10px] text-brand-text-muted/60">—</span>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-brand-text truncate">
                                  {s.fullName}
                                </p>
                                <p className="text-[10px] text-brand-text-muted truncate">
                                  {s.studentClass || 'No class'} {s.phoneNumber ? `· ${s.phoneNumber}` : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {s.feeStatus && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  s.feeStatus === 'PAID'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : s.feeStatus === 'PARTIAL'
                                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {s.feeStatus}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-brand-border bg-brand-surface-tint/60 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const batchToDelete = activeSelectedBatch
                  setSelectedBatch(null)
                  handleDelete(batchToDelete.id, batchToDelete.name)
                }}
                className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 transition-colors cursor-pointer"
              >
                Delete Batch
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const b = activeSelectedBatch
                    setSelectedBatch(null)
                    openEditModal(b)
                  }}
                  className="rounded-lg border border-brand-border bg-brand-surface px-4 py-2 text-xs font-semibold text-brand-text hover:bg-brand-surface-tint transition-colors cursor-pointer shadow-2xs"
                >
                  Edit Batch
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const b = activeSelectedBatch
                    setSelectedBatch(null)
                    openEnrollModal(b)
                  }}
                  className="rounded-lg bg-brand-primary px-4 py-2 text-xs font-semibold text-white hover:bg-brand-primary/90 transition-colors cursor-pointer shadow-xs"
                >
                  👥 Enroll Students
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-text/30 backdrop-blur-sm">
          <div
            className="bg-brand-surface rounded-2xl border border-brand-border shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border bg-brand-surface-tint/50">
              <h3 className="font-semibold text-brand-text">
                {editingBatch ? BRANDING.editBatchLabel : BRANDING.createBatchLabel}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-brand-text-muted/75 hover:text-brand-text"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-6">
              {formError && (
                <div className="rounded-lg bg-red-50 text-red-700 text-xs px-3 py-2 border border-red-100">
                  {formError}
                </div>
              )}

              {/* Batch Details */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted/75 mb-3 border-b pb-1">
                  {BRANDING.batchDetailsLabel}
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-brand-text mb-1">
                      {BRANDING.batchNameLabel} <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder={BRANDING.isSchool ? "e.g. Class 10-A" : "e.g. Morning Batch A"}
                      className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brand-text mb-1">
                      Teaching Subject
                    </label>
                    <input
                      type="text"
                      list="batch-subjects-list"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      placeholder="e.g. Mathematics, Physics"
                      className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-text focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                    />
                    <datalist id="batch-subjects-list">
                      {SUBJECT_OPTIONS.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                    <p className="text-[10px] text-brand-text-muted/75 mt-1">
                      Assigning a subject matches teachers with this specialty
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brand-text mb-1">
                      Fee Per Student (₹ / month)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.feePerStudent}
                      onChange={(e) => setForm({ ...form, feePerStudent: e.target.value })}
                      placeholder="e.g. 1500"
                      className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                    />
                    <p className="text-[10px] text-brand-text-muted/75 mt-1">
                      Used for teacher salary calculation: (Enrolled Students × Fee Per Student)
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brand-text mb-1">Timing</label>
                    <input
                      type="text"
                      value={form.timing}
                      onChange={(e) => setForm({ ...form, timing: e.target.value })}
                      placeholder="e.g. 9:00 AM – 12:00 PM"
                      className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Teacher Assignment */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted/75 mb-3 border-b pb-1">
                  Assign Teachers
                </h4>
                {teachers.length === 0 ? (
                  <p className="text-xs text-brand-text-muted italic">
                    No teachers available. Add teachers first.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {teachers.map((t) => {
                        const isSelected = form.assignedTeachers.some(
                          (id) => String(id) === String(t.id)
                        )
                        const isSubjectMatch = Boolean(
                          form.subject &&
                          t.subject &&
                          t.subject.toLowerCase() === form.subject.toLowerCase()
                        )
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleTeacherToggle(t.id)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-medium border text-left transition-all ${
                              isSelected
                                ? 'bg-brand-primary/10 border-brand-primary text-brand-primary ring-1 ring-brand-primary/20'
                                : 'bg-brand-surface border-brand-border text-brand-text hover:bg-brand-surface-tint'
                            }`}
                          >
                            <span className="font-semibold">
                              {isSelected && <span className="mr-1 font-bold">✓</span>}
                              {t.name}
                            </span>
                            {t.subject && (
                              <span className={`ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                isSelected ? 'bg-brand-primary/20 text-brand-primary' : 'bg-brand-surface-tint text-brand-text-muted'
                              }`}>
                                {t.subject}
                              </span>
                            )}
                            {isSubjectMatch && (
                              <span className="ml-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">
                                Match
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                    <p className="text-[10px] text-brand-text-muted/75 mt-2">
                      Select the teachers responsible for this batch. Teacher subjects help make batch assignment easy and accurate.
                    </p>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg px-4 py-2 text-xs font-medium text-brand-text hover:bg-brand-surface-tint"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-brand-primary px-5 py-2 text-xs font-semibold text-brand-surface hover:bg-brand-primary/100 disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : 'Save Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enroll Students Modal */}
      {enrollModalBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-text/30 backdrop-blur-sm">
          <div
            className="bg-brand-surface rounded-2xl border border-brand-border shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border bg-brand-surface-tint/50 shrink-0">
              <div>
                <h3 className="font-semibold text-brand-text">
                  Enroll Students — {enrollModalBatch.name}
                </h3>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  Select students to enroll in this {BRANDING.batchLabel.toLowerCase()}. Students can be enrolled in multiple {BRANDING.batchesLabel.toLowerCase()} simultaneously.
                </p>
              </div>
              <button
                onClick={() => setEnrollModalBatch(null)}
                className="text-brand-text-muted/75 hover:text-brand-text text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-4 border-b border-brand-border/60 bg-brand-surface space-y-3 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 justify-between">
                <input
                  type="search"
                  value={enrollSearch}
                  onChange={(e) => setEnrollSearch(e.target.value)}
                  placeholder="Search students by name, roll no, or phone..."
                  className="w-full sm:flex-1 rounded-xl border border-brand-border px-3 py-2 text-xs focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const q = enrollSearch.trim().toLowerCase()
                      const matchingIds = allStudents
                        .filter((s) => {
                          if (!q) return true
                          return (
                            (s.fullName || '').toLowerCase().includes(q) ||
                            (s.rollNo || '').toLowerCase().includes(q) ||
                            (s.phoneNumber || '').includes(q)
                          )
                        })
                        .map((s) => s.id)
                      setSelectedStudentIds((prev) => [...new Set([...prev, ...matchingIds])])
                    }}
                    className="text-[11px] font-semibold text-brand-primary hover:underline px-1 py-0.5"
                  >
                    Select All
                  </button>
                  <span className="text-brand-border">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      const q = enrollSearch.trim().toLowerCase()
                      if (!q) {
                        setSelectedStudentIds([])
                      } else {
                        const matchingIds = new Set(
                          allStudents
                            .filter((s) => {
                              return (
                                (s.fullName || '').toLowerCase().includes(q) ||
                                (s.rollNo || '').toLowerCase().includes(q) ||
                                (s.phoneNumber || '').includes(q)
                              )
                            })
                            .map((s) => s.id)
                        )
                        setSelectedStudentIds((prev) => prev.filter((id) => !matchingIds.has(id)))
                      }
                    }}
                    className="text-[11px] font-semibold text-brand-text-muted hover:text-brand-text px-1 py-0.5"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEnrollFilter('all')}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    enrollFilter === 'all'
                      ? 'bg-brand-primary text-white font-bold'
                      : 'bg-brand-surface-tint text-brand-text-muted hover:text-brand-text'
                  }`}
                >
                  All ({allStudents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setEnrollFilter('enrolled')}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    enrollFilter === 'enrolled'
                      ? 'bg-brand-primary text-white font-bold'
                      : 'bg-brand-surface-tint text-brand-text-muted hover:text-brand-text'
                  }`}
                >
                  Enrolled ({selectedStudentIds.length})
                </button>
                <button
                  type="button"
                  onClick={() => setEnrollFilter('not_enrolled')}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    enrollFilter === 'not_enrolled'
                      ? 'bg-brand-primary text-white font-bold'
                      : 'bg-brand-surface-tint text-brand-text-muted hover:text-brand-text'
                  }`}
                >
                  Not Enrolled ({Math.max(0, allStudents.length - selectedStudentIds.length)})
                </button>
              </div>
            </div>

            {/* Students List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-brand-border/40">
              {(() => {
                const q = enrollSearch.trim().toLowerCase()
                const filtered = allStudents.filter((s) => {
                  const isEnrolled = selectedStudentIds.includes(s.id)
                  if (enrollFilter === 'enrolled' && !isEnrolled) return false
                  if (enrollFilter === 'not_enrolled' && isEnrolled) return false
                  if (!q) return true
                  return (
                    (s.fullName || '').toLowerCase().includes(q) ||
                    (s.rollNo || '').toLowerCase().includes(q) ||
                    (s.phoneNumber || '').includes(q) ||
                    (s.username || '').toLowerCase().includes(q)
                  )
                })

                if (filtered.length === 0) {
                  return (
                    <div className="py-12 text-center text-xs text-brand-text-muted">
                      No students found matching your search.
                    </div>
                  )
                }

                return filtered.map((s) => {
                  const isSelected = selectedStudentIds.includes(s.id)
                  const studentOtherBatches = (
                    Array.isArray(s.batches) && s.batches.length > 0
                      ? s.batches
                      : (s.batch || '').split(',').map((b) => b.trim()).filter(Boolean)
                  ).filter((b) => b !== enrollModalBatch.name)

                  return (
                    <div
                      key={s.id}
                      onClick={() => handleToggleStudentEnroll(s.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-brand-primary/5 border border-brand-primary/30'
                          : 'hover:bg-brand-surface-tint/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleStudentEnroll(s.id)}
                          className="h-4 w-4 rounded text-brand-primary border-brand-border focus:ring-brand-primary"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-brand-text truncate">
                              {s.fullName}
                            </span>
                            {s.rollNo && (
                              <span className="font-mono text-[10px] bg-brand-primary/10 text-brand-primary px-1.5 py-0.2 rounded font-bold">
                                {s.rollNo}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-brand-text-muted">
                              {s.studentClass || 'No class'} · {s.phoneNumber || 'No phone'}
                            </span>
                            {studentOtherBatches.length > 0 && (
                              <span className="text-[10px] text-brand-text-muted/80">
                                (Also in: {studentOtherBatches.join(', ')})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        {isSelected ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                            ✓ Enrolled
                          </span>
                        ) : (
                          <span className="text-[10px] text-brand-text-muted">Not in {BRANDING.batchLabel.toLowerCase()}</span>
                        )}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-brand-border bg-brand-surface-tint/50 flex items-center justify-between gap-3 shrink-0">
              <p className="text-xs font-semibold text-brand-text">
                <span className="text-brand-primary font-bold">{selectedStudentIds.length}</span> student{selectedStudentIds.length !== 1 ? 's' : ''} enrolled in this batch
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEnrollModalBatch(null)}
                  className="rounded-lg px-4 py-2 text-xs font-medium text-brand-text hover:bg-brand-surface-tint cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEnrollments}
                  disabled={savingEnroll}
                  className="rounded-lg bg-brand-primary px-5 py-2 text-xs font-semibold text-white hover:bg-brand-primary/100 disabled:opacity-60 cursor-pointer shadow-xs"
                >
                  {savingEnroll ? 'Saving...' : 'Save Enrollments'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
