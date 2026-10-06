import { useMemo, useState } from 'react'
import ActiveStudentsList from './ActiveStudentsList'
import api from '../../lib/api'
import useBatches from '../../hooks/useBatches'
import {
  buildWhatsAppInvite,
  generateUsername,
  tempPasswordFromPhone,
} from '../../utils/studentCredentials'



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

const initialForm = {
  fullName: '',
  phoneNumber: '',
  batches: [],
  studentClass: '',
  subjects: '',
  totalCourseFee: '',
  joiningDate: new Date().toISOString().split('T')[0],
}

export default function StudentRegistration() {
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)
  const [copiedInvite, setCopiedInvite] = useState(false)
  const [listRefreshKey, setListRefreshKey] = useState(0)
  const { batches: BATCH_OPTIONS } = useBatches()

  const tempPassword = useMemo(
    () => tempPasswordFromPhone(form.phoneNumber),
    [form.phoneNumber]
  )

  const loginUsername = useMemo(
    () => generateUsername(form.phoneNumber, form.fullName),
    [form.phoneNumber, form.fullName]
  )

  const whatsappMessage = useMemo(
    () =>
      buildWhatsAppInvite({
        fullName: form.fullName,
        rollNo: success?.student?.rollNo,
        phone: form.phoneNumber,
        batches: form.batches,
        batch: form.batches.join(', '),
        totalCourseFee: form.totalCourseFee,
        password: tempPassword,
      }),
    [form, tempPassword, success]
  )

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError('')
    setSuccess(null)
    setCopiedInvite(false)
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
    setSuccess(null)
    setCopiedInvite(false)
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
    setSuccess(null)

    if (!tempPassword) {
      setError('Enter a valid phone number (at least 10 digits) to generate a password.')
      return
    }

    if (form.batches.length === 0) {
      setError('Please select at least one batch for the student.')
      return
    }

    setLoading(true)

    try {
      const { data } = await api.post('/students/register', {
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        batches: form.batches,
        batch: form.batches.join(', '),
        studentClass: form.studentClass.trim(),
        subjects: form.subjects.trim(),
        totalCourseFee: Number(form.totalCourseFee),
        password: tempPassword,
        joiningDate: form.joiningDate,
      })

      if (!data.success) {
        setError(data.message || 'Registration failed.')
        return
      }

      setSuccess(data.data)
      setForm(initialForm)
      setListRefreshKey((key) => key + 1)
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

  async function handleCopyInvite() {
    if (!whatsappMessage.trim()) return

    try {
      await navigator.clipboard.writeText(whatsappMessage)
      setCopiedInvite(true)
      setTimeout(() => setCopiedInvite(false), 2500)
    } catch {
      setError('Could not copy to clipboard. Please copy the message manually.')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-brand-text">
            Student Registration
          </h2>
          <p className="text-xs text-brand-text-muted mt-0.5">
            Create a student account, fee ledger, and parent invite in one step.
          </p>
        </div>
      </div>

      {success && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-brand-primary/10 px-3 py-2.5 text-xs text-emerald-800"
        >
          <p className="font-medium">
            {success.student?.fullName} registered successfully.
          </p>
          <p className="mt-1 text-brand-primary">
            Login username: {success.student?.username} · Batch{success.student?.batches?.length > 1 ? 'es' : ''}: {success.student?.batches?.join(', ') || success.student?.batch}
          </p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-brand-border bg-brand-surface p-4 sm:p-5 shadow-sm"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name" htmlFor="fullName" className="sm:col-span-2">
              <input
                id="fullName"
                type="text"
                required
                value={form.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                placeholder="Student full name"
                className={inputClass}
              />
            </Field>

            <Field label="Phone Number" htmlFor="phoneNumber">
              <input
                id="phoneNumber"
                type="tel"
                required
                value={form.phoneNumber}
                onChange={(e) => updateField('phoneNumber', e.target.value)}
                placeholder="9876543210"
                className={inputClass}
              />
            </Field>

            <div className="sm:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-brand-text">
                  Enrolled Batches <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-brand-text-muted">
                    {form.batches.length} selected
                  </span>
                  <button
                    type="button"
                    onClick={selectAllBatches}
                    className="text-[11px] text-brand-primary hover:underline font-semibold"
                  >
                    Select All
                  </button>
                  <span className="text-brand-border">|</span>
                  <button
                    type="button"
                    onClick={clearAllBatches}
                    className="text-[11px] text-brand-text-muted hover:text-brand-text font-semibold"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {BATCH_OPTIONS.length === 0 ? (
                <p className="text-xs text-brand-text-muted">No active batches available. Please create a batch first.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 rounded-xl border border-brand-border bg-brand-surface-tint/40 max-h-48 overflow-y-auto">
                  {BATCH_OPTIONS.map((option) => {
                    const isSelected = form.batches.includes(option)
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => toggleBatch(option)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-left transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-brand-primary/10 border-brand-primary text-brand-primary shadow-xs font-bold'
                            : 'bg-brand-surface border-brand-border text-brand-text hover:bg-brand-surface-tint'
                        }`}
                      >
                        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
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
              )}

              {form.batches.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {form.batches.map((b) => (
                    <span
                      key={b}
                      className="inline-flex items-center gap-1 rounded-md bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-2.5 py-1 text-xs font-semibold"
                    >
                      <span>{b}</span>
                      <button
                        type="button"
                        onClick={() => toggleBatch(b)}
                        className="hover:text-red-500 transition-colors ml-0.5 text-xs font-bold"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <Field label="Class" htmlFor="studentClass">
              <select
                id="studentClass"
                value={form.studentClass}
                onChange={(e) => updateField('studentClass', e.target.value)}
                className={inputClass}
              >
                <option value="">— Select class —</option>
                {CLASS_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>

            <Field label="Subjects" htmlFor="subjects">
              <input
                id="subjects"
                type="text"
                list="reg-subject-list"
                value={form.subjects}
                onChange={(e) => updateField('subjects', e.target.value)}
                placeholder="e.g. Maths, Physics"
                className={inputClass}
              />
              <datalist id="reg-subject-list">
                {SUBJECT_OPTIONS.map((s) => <option key={s} value={s} />)}
              </datalist>
              <p className="mt-1 text-[10px] text-brand-text-muted/75">Comma-separate multiple subjects</p>
            </Field>

            <Field label="Monthly Fee (₹)" htmlFor="totalCourseFee">
              <input
                id="totalCourseFee"
                type="number"
                min="0"
                step="1"
                required
                value={form.totalCourseFee}
                onChange={(e) => updateField('totalCourseFee', e.target.value)}
                placeholder="e.g. 3600"
                className={inputClass}
              />
              <p className="mt-1 text-[10px] text-brand-text-muted/75">Monthly tuition fee for this student</p>
            </Field>

            <Field label="Joining Date" htmlFor="joiningDate">
              <input
                id="joiningDate"
                type="date"
                required
                value={form.joiningDate}
                onChange={(e) => updateField('joiningDate', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
            >
              {error}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={loading || !tempPassword}
              className="rounded-lg bg-brand-primary px-4 py-2 text-xs font-semibold text-brand-surface hover:bg-brand-primary/100 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary focus:ring-offset-2 disabled:bg-brand-surface-tint disabled:text-brand-text-muted/50 disabled:border disabled:border-brand-border/50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Registering…' : 'Register student'}
            </button>
          </div>
        </form>

        <aside className="rounded-xl border border-brand-border bg-brand-surface-tint/80 p-4 space-y-4 h-fit">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-text-muted">
              Parent utilities
            </p>
            <h3 className="text-sm font-semibold text-brand-text mt-1">
              Credentials & invite
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            {success?.student?.rollNo && (
              <div className="rounded-xl border border-brand-primary/30 bg-brand-primary/10 p-2.5">
                <CredentialRow label="Assigned Roll No" value={success.student.rollNo} mono highlight />
              </div>
            )}
            <CredentialRow label="Login username" value={loginUsername || '—'} mono />
            <CredentialRow
              label="Temporary password"
              value={tempPassword || 'Enter phone to generate'}
              mono
              highlight
            />
            <p className="text-[11px] text-brand-text-muted leading-relaxed">
              Password is derived from the last 6 digits of the phone number (
              <span className="font-mono text-brand-text">Stu@######</span>).
            </p>
          </div>

          <div>
            <p className="text-[10px] font-medium text-brand-text-muted mb-1.5">
              WhatsApp preview
            </p>
            <pre className="text-[10px] leading-relaxed text-brand-text bg-brand-surface border border-brand-border rounded-lg p-2.5 max-h-36 overflow-y-auto whitespace-pre-wrap font-sans">
              {whatsappMessage}
            </pre>
          </div>

          <button
            type="button"
            onClick={handleCopyInvite}
            disabled={!form.fullName.trim() || !tempPassword}
            className="w-full rounded-lg bg-brand-accent px-3 py-2 text-xs font-semibold text-white dark:text-brand-bg hover:bg-brand-accent-hover focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:bg-brand-surface-tint disabled:text-brand-text-muted/50 disabled:border disabled:border-brand-border/50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {copiedInvite ? 'Copied to clipboard' : 'Copy WhatsApp Invite'}
          </button>
        </aside>
      </div>

      <ActiveStudentsList refreshKey={listRefreshKey} />
    </div>
  )
}

function Field({ label, htmlFor, children, className = '' }) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-medium text-brand-text mb-1"
      >
        {label}
      </label>
      {children}
    </div>
  )
}

function CredentialRow({ label, value, mono, highlight }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-brand-text-muted">{label}</p>
      <p
        className={`mt-0.5 text-brand-text break-all ${
          mono ? 'font-mono text-[11px]' : ''
        } ${highlight ? 'font-semibold text-brand-primary' : ''}`}
      >
        {value}
      </p>
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-muted/75 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary focus:border-indigo-500'
