import { useEffect, useState } from 'react'
import api from '../../lib/api'
import {
  User,
  Phone,
  BookOpen,
  GraduationCap,
  Calendar,
  CreditCard,
  Edit,
  X,
  Clock,
  ShieldCheck,
  AlertTriangle,
  IndianRupee,
} from 'lucide-react'

function formatDate(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value ?? 0)
}

function FeeStatusBadge({ status }) {
  const styles = {
    PAID: 'bg-emerald-50 text-emerald-700 ring-emerald-200 border-emerald-200',
    PARTIAL: 'bg-sky-50 text-sky-700 ring-sky-200 border-sky-200',
    PENDING: 'bg-amber-50 text-amber-800 ring-amber-200 border-amber-200',
  }
  const cleanStatus = status || 'PENDING'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide border ${
        styles[cleanStatus] ?? styles.PENDING
      }`}
    >
      {cleanStatus}
    </span>
  )
}

export default function StudentDetailModal({
  student,
  onClose,
  onCollectFee,
  onEdit,
}) {
  const [ledgerData, setLedgerData] = useState(null)
  const [loadingLedger, setLoadingLedger] = useState(true)

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

  useEffect(() => {
    if (!student?.id) return
    let isMounted = true

    async function fetchLedger() {
      try {
        setLoadingLedger(true)
        const { data } = await api.get(`/fees/ledger/${student.id}`)
        if (isMounted && data.success) {
          setLedgerData(data.data)
        }
      } catch {
        // Silently catch error - base student info will still display
      } finally {
        if (isMounted) setLoadingLedger(false)
      }
    }

    fetchLedger()

    return () => {
      isMounted = false
    }
  }, [student?.id])

  if (!student) return null

  const isPaused = student.status === 'paused'
  const ledger = ledgerData?.ledger
  const overview = ledgerData?.overview

  const studentBatches = Array.isArray(student.batches) && student.batches.length > 0
    ? student.batches
    : (student.batch || '').split(',').map((b) => b.trim()).filter(Boolean)

  const totalFee = overview?.totalCourseFee ?? ledger?.totalCourseFee ?? 0
  const amountPaid = overview?.amountPaid ?? ledger?.amountPaid ?? 0
  const amountDue = overview?.amountDue ?? ledger?.amountDue ?? 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-detail-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-brand-text/40 backdrop-blur-[2px]"
        aria-label="Close modal backdrop"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-brand-border bg-brand-surface shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border bg-brand-surface-tint/80 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-text-muted">
                Student Profile
              </p>
              <h2
                id="student-detail-title"
                className="text-sm font-semibold text-brand-text"
              >
                Complete Information
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-brand-text-muted hover:bg-brand-surface-tint hover:text-brand-text transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-brand-text">
          {/* Student Profile Card */}
          <div className="rounded-2xl border border-brand-border bg-gradient-to-br from-brand-surface to-brand-surface-tint/60 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-primary text-white font-bold text-lg shadow-sm">
                {(student.fullName || 'S').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-brand-text">
                    {student.fullName}
                  </h3>
                  {student.rollNo && (
                    <span className="rounded-md bg-brand-primary/10 text-brand-primary px-2 py-0.5 text-xs font-mono font-extrabold ring-1 ring-brand-primary/20">
                      {student.rollNo}
                    </span>
                  )}
                </div>
                <p className="text-xs text-brand-text-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>@{student.username || 'student'}</span>
                  <span>•</span>
                  <span>{studentBatches.length > 0 ? studentBatches.join(', ') : 'Unassigned Batch'}</span>
                </p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${
                  isPaused
                    ? 'bg-amber-50 text-amber-800 ring-amber-200'
                    : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                }`}
              >
                {isPaused ? '⏸ Paused' : '● Active'}
              </span>
              <FeeStatusBadge status={student.feeStatus} />
            </div>
          </div>

          {/* Academic & Contact Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Phone / Parent Contact */}
            <div className="rounded-xl border border-brand-border bg-brand-surface-tint/30 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-text-muted">
                <Phone className="h-3.5 w-3.5" />
                <span>Contact Number</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-brand-text">
                  {student.phoneNumber || '—'}
                </span>
                {student.phoneNumber && (
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${student.phoneNumber}`}
                      className="rounded-md border border-brand-border bg-brand-surface px-2 py-0.5 text-[10px] font-medium text-brand-text hover:bg-brand-surface-tint transition-colors"
                    >
                      Call
                    </a>
                    <a
                      href={`https://wa.me/91${student.phoneNumber.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      WhatsApp
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Class */}
            <div className="rounded-xl border border-brand-border bg-brand-surface-tint/30 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-text-muted">
                <GraduationCap className="h-3.5 w-3.5" />
                <span>Class / Grade</span>
              </div>
              <p className="text-xs font-bold text-brand-text">
                {student.studentClass || 'Not Specified'}
              </p>
            </div>

            {/* Batch */}
            <div className="rounded-xl border border-brand-border bg-brand-surface-tint/30 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-text-muted">
                <BookOpen className="h-3.5 w-3.5" />
                <span>Enrolled Batch{studentBatches.length > 1 ? 'es' : ''}</span>
              </div>
              {studentBatches.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {studentBatches.map((bName, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-md bg-brand-surface border border-brand-border px-2 py-0.5 text-xs font-semibold text-brand-primary"
                    >
                      {bName}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-bold text-brand-text">—</p>
              )}
            </div>

            {/* Joining Date */}
            <div className="rounded-xl border border-brand-border bg-brand-surface-tint/30 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-text-muted">
                <Calendar className="h-3.5 w-3.5" />
                <span>Joining Date</span>
              </div>
              <p className="text-xs font-bold text-brand-text">
                {formatDate(student.joiningDate || student.admissionDate)}
              </p>
            </div>
          </div>

          {/* Subjects */}
          <div className="rounded-xl border border-brand-border bg-brand-surface-tint/30 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-text-muted">
                <BookOpen className="h-3.5 w-3.5" />
                <span>Enrolled Subjects</span>
              </div>
            </div>
            {student.subjects ? (
              <div className="flex flex-wrap gap-1.5">
                {student.subjects
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((subj, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-brand-surface border border-brand-border px-2.5 py-1 text-xs font-medium text-brand-text shadow-2xs"
                    >
                      {subj}
                    </span>
                  ))}
              </div>
            ) : (
              <p className="text-xs text-brand-text-muted italic">
                No subjects assigned yet.
              </p>
            )}
          </div>

          {/* Fee Overview Card */}
          <div className="rounded-2xl border border-brand-border bg-brand-surface p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <IndianRupee className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-text">
                    Fee Status & Ledger
                  </h4>
                  <p className="text-[10px] text-brand-text-muted">
                    Payment overview for this student
                  </p>
                </div>
              </div>
              <FeeStatusBadge status={student.feeStatus} />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="rounded-xl border border-brand-border bg-brand-surface-tint/40 p-2.5 text-center">
                <p className="text-[10px] font-medium text-brand-text-muted">
                  Total Fee
                </p>
                <p className="text-xs font-bold text-brand-text mt-0.5">
                  {loadingLedger ? '…' : formatCurrency(totalFee)}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5 text-center">
                <p className="text-[10px] font-medium text-emerald-800">
                  Paid
                </p>
                <p className="text-xs font-bold text-emerald-700 mt-0.5">
                  {loadingLedger ? '…' : formatCurrency(amountPaid)}
                </p>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-2.5 text-center">
                <p className="text-[10px] font-medium text-amber-800">
                  Due Balance
                </p>
                <p
                  className={`text-xs font-bold mt-0.5 ${
                    amountDue > 0 ? 'text-amber-700' : 'text-emerald-700'
                  }`}
                >
                  {loadingLedger ? '…' : formatCurrency(amountDue)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="px-5 py-3.5 border-t border-brand-border bg-brand-surface-tint/50 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl border border-brand-border bg-brand-surface px-4 py-2 text-xs font-semibold text-brand-text hover:bg-brand-surface-tint transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Edit Option Button */}
            <button
              type="button"
              onClick={() => {
                onClose()
                onEdit(student)
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-brand-border bg-brand-surface px-3.5 py-2 text-xs font-semibold text-brand-text hover:bg-brand-surface-tint shadow-xs transition-colors"
            >
              <Edit className="h-3.5 w-3.5 text-brand-text-muted" />
              <span>Edit Student</span>
            </button>

            {/* Collect Fee Button */}
            <button
              type="button"
              onClick={() => {
                onClose()
                onCollectFee(student)
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Collect Fee</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
