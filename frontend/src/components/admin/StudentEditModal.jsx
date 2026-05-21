import { useEffect, useState } from 'react'
import api from '../../lib/api'

const BATCH_OPTIONS = [
  'Morning Batch A',
  'Morning Batch B',
  'Evening Batch A',
  'Evening Batch B',
  'Weekend Batch',
]

const CLASS_OPTIONS = [
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

export default function StudentEditModal({ student, onClose, onUpdated }) {
  const [form, setForm] = useState({
    fullName: '',
    phoneNumber: '',
    batch: BATCH_OPTIONS[0],
    studentClass: '',
    subjects: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (student) {
      setForm({
        fullName: student.fullName || '',
        phoneNumber: student.phoneNumber || '',
        batch: student.batch || BATCH_OPTIONS[0],
        studentClass: student.studentClass || '',
        subjects: student.subjects || '',
      })
    }
  }, [student])

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

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await api.put(`/students/${student.id}`, {
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        batch: form.batch,
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
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        aria-label="Close edit modal"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-md overflow-hidden flex flex-col rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-4 sm:px-5 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Edit Profile
            </p>
            <h2 id="student-edit-title" className="text-base font-semibold text-slate-900 mt-0.5">
              {student.fullName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
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
              <label htmlFor="edit-fullName" className="block text-xs font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <input
                id="edit-fullName"
                type="text"
                required
                value={form.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="edit-phoneNumber" className="block text-xs font-medium text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                id="edit-phoneNumber"
                type="tel"
                required
                value={form.phoneNumber}
                onChange={(e) => updateField('phoneNumber', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="edit-batch" className="block text-xs font-medium text-slate-700 mb-1">
                Batch
              </label>
              <select
                id="edit-batch"
                required
                value={form.batch}
                onChange={(e) => updateField('batch', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {BATCH_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="edit-class" className="block text-xs font-medium text-slate-700 mb-1">
                Class
              </label>
              <select
                id="edit-class"
                value={form.studentClass}
                onChange={(e) => updateField('studentClass', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">— Select class —</option>
                {CLASS_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="edit-subjects" className="block text-xs font-medium text-slate-700 mb-1">
                Subjects
              </label>
              <input
                id="edit-subjects"
                type="text"
                list="edit-subject-list"
                value={form.subjects}
                onChange={(e) => updateField('subjects', e.target.value)}
                placeholder="e.g. Mathematics, Physics"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <datalist id="edit-subject-list">
                {SUBJECT_OPTIONS.map((s) => <option key={s} value={s} />)}
              </datalist>
              <p className="mt-1 text-[10px] text-slate-400">Comma-separate multiple subjects</p>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
