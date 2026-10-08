import { useEffect, useState } from 'react'
import api from '../../lib/api'
import useBatches from '../../hooks/useBatches'
import { BRANDING } from '../../config/branding'


const CLASS_OPTIONS = [
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11 (Science)',
  'Class 11 (Commerce)',
  'Class 11 (Arts)',
  'Class 12 (Science)',
  'Class 12 (Commerce)',
  'Class 12 (Arts)',
  'Competitive Prep',
  'Foundation',
  'Other',
]

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

export default function StudentEditModal({ student, onClose, onUpdated, onRemoved }) {
  const { batches: BATCH_OPTIONS } = useBatches()
  const [form, setForm] = useState({
    fullName: '',
    phoneNumber: '',
    batches: [],
    studentClass: '',
    subjects: '',
  })
  const [currentStatus, setCurrentStatus] = useState(student?.status || 'active')
  const [loading, setLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (student) {
      const initialBatches = Array.isArray(student.batches) && student.batches.length > 0
        ? student.batches
        : (student.batch ? student.batch.split(',').map((b) => b.trim()).filter(Boolean) : []);

      setForm({
        fullName: student.fullName || '',
        phoneNumber: student.phoneNumber || '',
        batches: initialBatches,
        studentClass: student.studentClass || '',
        subjects: student.subjects || '',
      })
      setCurrentStatus(student.status || 'active')
    }
  }, [student, BATCH_OPTIONS])

  async function handleStatusChange(newStatus) {
    if (!student?.id) return

    if (newStatus === 'removed') {
      const confirmed = window.confirm(
        `Are you sure you want to REMOVE ${student.fullName}? They will be hidden from all dashboards and blocked from login.`
      )
      if (!confirmed) return
    } else if (newStatus === 'paused') {
      const confirmed = window.confirm(
        `Are you sure you want to PAUSE ${student.fullName}? They will not be able to log in until resumed.`
      )
      if (!confirmed) return
    }

    setStatusLoading(newStatus)
    setError('')

    try {
      const { data } = await api.patch(`/students/${student.id}/status`, { status: newStatus })
      if (data.success) {
        if (newStatus === 'removed') {
          onRemoved?.(student.id)
          onClose()
        } else {
          setCurrentStatus(newStatus)
          onUpdated?.({ ...student, status: newStatus })
        }
      } else {
        setError(data.message || 'Failed to update student status.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update student status.')
    } finally {
      setStatusLoading(null)
    }
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError('')
  }

  function toggleBatch(batchName) {
    setForm((prev) => {
      const exists = prev.batches.includes(batchName)
      const newBatches = exists
        ? prev.batches.filter((b) => b !== batchName)
        : [...prev.batches, batchName]
      return { ...prev, batches: newBatches }
    })
    setError('')
  }

  function selectAllBatches() {
    setForm((prev) => ({ ...prev, batches: [...BATCH_OPTIONS] }))
    setError('')
  }

  function clearAllBatches() {
    setForm((prev) => ({ ...prev, batches: [] }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.batches.length === 0) {
      setError('Please select at least one batch for the student.')
      return
    }

    setLoading(true)

    try {
      const { data } = await api.put(`/students/${student.id}`, {
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        batches: form.batches,
        batch: form.batches.join(', '),
        studentClass: form.studentClass.trim(),
        subjects: form.subjects.trim(),
      })

      if (!data.success) {
        setError(data.message || 'Update failed.')
        return
      }

      onUpdated(data.data)
      onClose()
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.request
            ? 'Unable to reach the server. Is the backend running?'
            : 'Something went wrong. Please try again.')
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-edit-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-brand-text/30 backdrop-blur-[2px]"
        aria-label="Close edit modal"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col rounded-t-2xl sm:rounded-2xl border border-brand-border bg-brand-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-4 sm:px-5 py-4 border-b border-brand-border bg-brand-surface-tint/80 shrink-0">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-text-muted">
              Edit Profile
            </p>
            <h2 id="student-edit-title" className="text-base font-semibold text-brand-text mt-0.5 flex items-center gap-2">
              <span>{student.fullName}</span>
              {student.rollNo && (
                <span className="rounded-md bg-brand-primary/10 text-brand-primary px-2 py-0.5 text-xs font-mono font-bold">
                  {student.rollNo}
                </span>
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-brand-text-muted/75 hover:bg-brand-surface-tint hover:text-brand-text transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {error && (
            <p
              role="alert"
              className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
            >
              {error}
            </p>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="edit-fullName" className="block text-xs font-medium text-brand-text mb-1">
                Full Name
              </label>
              <input
                id="edit-fullName"
                type="text"
                required
                value={form.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
              />
            </div>

            <div>
              <label htmlFor="edit-phoneNumber" className="block text-xs font-medium text-brand-text mb-1">
                Phone Number
              </label>
              <input
                id="edit-phoneNumber"
                type="tel"
                required
                value={form.phoneNumber}
                onChange={(e) => updateField('phoneNumber', e.target.value)}
                className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-brand-text">
                  Enrolled {BRANDING.batchesLabel} <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-brand-text-muted">
                    {form.batches.length} selected
                  </span>
                  <button
                    type="button"
                    onClick={selectAllBatches}
                    className="text-[10px] text-brand-primary hover:underline font-semibold"
                  >
                    Select All
                  </button>
                  <span className="text-brand-border text-xs">|</span>
                  <button
                    type="button"
                    onClick={clearAllBatches}
                    className="text-[10px] text-brand-text-muted hover:text-brand-text font-semibold"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-2 rounded-xl border border-brand-border bg-brand-surface-tint/40 max-h-40 overflow-y-auto">
                {BATCH_OPTIONS.map((option) => {
                  const isSelected = form.batches.includes(option)
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleBatch(option)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-brand-primary/10 border-brand-primary text-brand-primary font-bold'
                          : 'bg-brand-surface border-brand-border text-brand-text hover:bg-brand-surface-tint'
                      }`}
                    >
                      <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border text-[9px] ${
                        isSelected
                          ? 'border-brand-primary bg-brand-primary text-white font-bold'
                          : 'border-brand-border bg-brand-surface'
                      }`}>
                        {isSelected ? '✓' : ''}
                      </span>
                      <span className="truncate">{option}</span>
                    </button>
                  )
                })}
              </div>

              {form.batches.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {form.batches.map((b) => (
                    <span
                      key={b}
                      className="inline-flex items-center gap-1 rounded-md bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-2 py-0.5 text-[11px] font-semibold"
                    >
                      <span>{b}</span>
                      <button
                        type="button"
                        onClick={() => toggleBatch(b)}
                        className="hover:text-red-500 transition-colors ml-0.5 text-[11px] font-bold"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="edit-class" className="block text-xs font-medium text-brand-text mb-1">
                Class
              </label>
              <select
                id="edit-class"
                value={form.studentClass}
                onChange={(e) => updateField('studentClass', e.target.value)}
                className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
              >
                <option value="">— Select class —</option>
                {CLASS_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="edit-subjects" className="block text-xs font-medium text-brand-text mb-1">
                Subjects
              </label>
              <input
                id="edit-subjects"
                type="text"
                list="edit-subject-list"
                value={form.subjects}
                onChange={(e) => updateField('subjects', e.target.value)}
                placeholder="e.g. Mathematics, Physics"
                className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
              />
              <datalist id="edit-subject-list">
                {SUBJECT_OPTIONS.map((s) => <option key={s} value={s} />)}
              </datalist>
              <p className="mt-1 text-[10px] text-brand-text-muted/75">Comma-separate multiple subjects</p>
            </div>
          </div>

          {/* Action buttons row: Pause, Delete, Cancel, Save Changes */}
          <div className="pt-3 border-t border-brand-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Left: Pause / Delete */}
            <div className="flex items-center gap-2">
              {currentStatus === 'paused' ? (
                <button
                  type="button"
                  disabled={!!statusLoading || loading}
                  onClick={() => handleStatusChange('active')}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {statusLoading === 'active' ? 'Resuming…' : '▶ Resume Student'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!!statusLoading || loading}
                  onClick={() => handleStatusChange('paused')}
                  className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {statusLoading === 'paused' ? 'Pausing…' : '⏸ Pause Student'}
                </button>
              )}

              <button
                type="button"
                disabled={!!statusLoading || loading}
                onClick={() => handleStatusChange('removed')}
                className="rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-950/20 px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-100 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {statusLoading === 'removed' ? 'Deleting…' : '✕ Delete Student'}
              </button>
            </div>

            {/* Right: Cancel / Save Changes */}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading || !!statusLoading}
                className="rounded-lg px-3.5 py-2 text-xs font-medium text-brand-text hover:bg-brand-surface-tint border border-brand-border/60 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !!statusLoading}
                className="rounded-lg bg-brand-primary px-4 py-2 text-xs font-semibold text-white hover:bg-brand-primary/100 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {loading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
