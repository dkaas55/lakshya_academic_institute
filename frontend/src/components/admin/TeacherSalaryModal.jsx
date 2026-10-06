import { useCallback, useEffect, useState } from 'react'
import api from '../../lib/api'
import {
  IndianRupee,
  CheckCircle2,
  Clock,
  Trash2,
  AlertCircle,
  AlertTriangle,
  CreditCard,
  X,
  TrendingUp,
  Calendar,
  ChevronDown,
  ChevronUp,
  Users,
  Sparkles,
} from 'lucide-react'

const PAYMENT_MODES = ['UPI', 'Cash', 'Bank Transfer', 'Cheque', 'Other']

function formatCurrency(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0)
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

export default function TeacherSalaryModal({ teacher, onClose, onPaymentRecorded }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const todayStr = new Date().toISOString().split('T')[0]
  const currentMonthName = `${new Date().toLocaleString('en-US', { month: 'long' })} ${new Date().getFullYear()}`

  // Month selection state
  const [selectedMonth, setSelectedMonth] = useState(currentMonthName)
  const [showBreakdown, setShowBreakdown] = useState(false)

  // Payment Form state
  const [paymentType, setPaymentType] = useState('end') // 'advance' | 'end'
  const [amount, setAmount] = useState('')
  const [paidAt, setPaidAt] = useState(todayStr)
  const [paymentMode, setPaymentMode] = useState('UPI')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const loadSalaryData = useCallback(async (monthToLoad) => {
    if (!teacher?.id) return
    setLoading(true)
    setError('')
    try {
      const targetMonth = monthToLoad || selectedMonth || currentMonthName
      const res = await api.get(`/admin/teachers/${teacher.id}/payments`, {
        params: { month: targetMonth },
      })
      if (res.data.success) {
        setData(res.data.data)
        if (res.data.data.selectedMonth) {
          setSelectedMonth(res.data.data.selectedMonth)
        }
      } else {
        setError(res.data.message || 'Failed to load teacher salary details.')
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.request ? 'Unable to reach the server.' : 'Something went wrong.')
      )
    } finally {
      setLoading(false)
    }
  }, [teacher?.id, selectedMonth, currentMonthName])

  useEffect(() => {
    loadSalaryData(selectedMonth)
  }, [loadSalaryData])

  const handleRecordPayment = async (e) => {
    e.preventDefault()
    setFormError('')
    setSuccessMsg('')

    const numAmount = Number(amount)
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid payment amount greater than ₹0')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        amount: numAmount,
        paymentType,
        paidAt: paidAt ? new Date(paidAt).toISOString() : new Date().toISOString(),
        paymentMode,
        notes: notes.trim(),
      }

      const res = await api.post(`/admin/teachers/${teacher.id}/payments`, payload)
      if (res.data.success) {
        setSuccessMsg(
          res.data.message ||
            `Payment of ${formatCurrency(numAmount)} recorded successfully!`
        )
        setAmount('')
        setNotes('')
        await loadSalaryData(selectedMonth)
        if (onPaymentRecorded) {
          onPaymentRecorded()
        }
      } else {
        setFormError(res.data.message || 'Failed to record payment.')
      }
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          (err.request ? 'Unable to reach server.' : 'Failed to record payment.')
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment record?')) return
    setDeletingId(paymentId)
    setFormError('')
    setSuccessMsg('')
    try {
      const res = await api.delete(`/admin/teachers/${teacher.id}/payments/${paymentId}`)
      if (res.data.success) {
        setSuccessMsg('Payment record deleted successfully.')
        await loadSalaryData(selectedMonth)
        if (onPaymentRecorded) {
          onPaymentRecorded()
        }
      } else {
        setFormError(res.data.message || 'Failed to delete payment record.')
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to delete payment record.')
    } finally {
      setDeletingId(null)
    }
  }

  const summary = data?.summary || {
    projectedSalary: 0,
    totalPaidThisMonth: 0,
    advancePaidThisMonth: 0,
    endPaidThisMonth: 0,
    remainingThisMonth: 0,
    totalPaidAllTime: 0,
  }

  const calcDetails = data?.calculationDetails || {}
  const monthsList = data?.monthsList || [currentMonthName]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-brand-text/30 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-brand-surface rounded-2xl border border-brand-border shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden transition-colors duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border bg-brand-surface-tint/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary text-white shadow-sm">
              <IndianRupee size={20} strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-brand-text">{teacher.name}</h3>
                {teacher.subject && (
                  <span className="rounded-md bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-2 py-0.5 text-[10px] font-bold">
                    {teacher.subject}
                  </span>
                )}
                <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-[10px] font-bold text-brand-primary">
                  {teacher.compensationType === 'fixed'
                    ? `Fixed: ${formatCurrency(teacher.salaryAmount || teacher.fixedSalary)}/mo`
                    : teacher.compensationType === 'batch_based'
                    ? `Batch Calculation (${teacher.studentPercentage || teacher.salaryPercentage || 100}%)`
                    : `${teacher.studentPercentage || teacher.salaryPercentage || 0}% Fee Split`}
                </span>
              </div>
              <p className="text-xs text-brand-text-muted mt-0.5">
                Teacher Salary &amp; Payment Management · {teacher.username}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-brand-text-muted hover:text-brand-text hover:bg-brand-surface transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-center justify-between gap-2 animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-brand-primary shrink-0" />
                <span>{successMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMsg('')}
                className="text-emerald-700 hover:text-emerald-900 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center text-sm text-brand-text-muted animate-pulse">
              Calculating salary details for {teacher.name}...
            </div>
          ) : (
            <>
              {/* The 3 Core Requested Metrics */}
              <div className="grid gap-4 sm:grid-cols-3">
                {/* 1. Monthly Salary */}
                <div className="rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-brand-text-muted">
                      Monthly Salary
                    </p>
                    <TrendingUp size={16} className="text-brand-primary" />
                  </div>
                  <p className="text-3xl font-extrabold text-brand-text mt-2.5">
                    {formatCurrency(
                      summary.monthlySalary ?? summary.projectedSalary ?? (teacher.salaryAmount || teacher.fixedSalary)
                    )}
                  </p>
                  <p className="text-xs mt-1.5 font-medium">
                    {summary.currentMonthPaid >= (summary.monthlySalary || 0) && (summary.monthlySalary || 0) > 0 ? (
                      <span className="text-emerald-700 font-semibold">✓ Current month fully settled</span>
                    ) : summary.currentMonthPaid > 0 ? (
                      <span className="text-brand-primary font-semibold">
                        {formatCurrency(summary.currentMonthPaid)} paid · {formatCurrency(summary.currentMonthDue)} remaining
                      </span>
                    ) : (
                      <span className="text-brand-text-muted">{currentMonthName} · Not yet paid</span>
                    )}
                  </p>
                </div>

                {/* 2. Previous Salary (strictly excluding current month) */}
                <div className={`rounded-2xl border p-5 shadow-sm relative overflow-hidden ${
                  (summary.previousSalary || 0) > 0
                    ? 'border-red-200 bg-red-50/60'
                    : 'border-brand-border bg-brand-surface'
                }`}>
                  <div className="flex items-center justify-between">
                    <p className={`text-[11px] font-bold uppercase tracking-wider ${
                      (summary.previousSalary || 0) > 0 ? 'text-red-800' : 'text-brand-text-muted'
                    }`}>
                      Previous Salary
                    </p>
                    <Clock size={16} className={(summary.previousSalary || 0) > 0 ? 'text-red-600' : 'text-brand-text-muted'} />
                  </div>
                  <p className={`text-3xl font-extrabold mt-2.5 ${
                    (summary.previousSalary || 0) > 0 ? 'text-red-700' : 'text-brand-text'
                  }`}>
                    {formatCurrency(summary.previousSalary || 0)}
                  </p>
                  <p className={`text-xs mt-1.5 ${
                    (summary.previousSalary || 0) > 0 ? 'text-red-700 font-semibold' : 'text-emerald-700 font-semibold'
                  }`}>
                    {(summary.previousSalary || 0) > 0
                      ? `Unpaid: ${summary.previousUnpaidMonths?.join(', ') || 'Past months'}`
                      : '✓ All past months settled'}
                  </p>
                </div>

                {/* 3. Total Salary to be Paid */}
                <div className="rounded-2xl border border-brand-primary/40 bg-brand-primary/5 p-5 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-brand-primary">
                      Total Salary to be Paid
                    </p>
                    <IndianRupee size={16} className="text-brand-primary" />
                  </div>
                  <p className="text-3xl font-extrabold text-brand-primary mt-2.5">
                    {formatCurrency(summary.totalSalaryToBePaid ?? 0)}
                  </p>
                  <p className="text-xs mt-1.5 font-medium">
                    {(summary.surplusAdvance || 0) > 0 ? (
                      <span className="text-emerald-700 font-bold">
                        ✓ All dues settled · Advance surplus: {formatCurrency(summary.surplusAdvance)}
                      </span>
                    ) : (summary.totalSalaryToBePaid || 0) === 0 ? (
                      <span className="text-emerald-700 font-bold">✓ All dues settled</span>
                    ) : (summary.previousSalary || 0) > 0 ? (
                      <span className="text-brand-text-muted">
                        Previous: {formatCurrency(summary.previousSalary)} + Current: {formatCurrency(summary.currentMonthDue || 0)}
                      </span>
                    ) : (
                      <span className="text-brand-text-muted">
                        Current Month Due: {formatCurrency(summary.currentMonthDue || summary.totalSalaryToBePaid || 0)}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Extra Advance Alert Banner if Teacher has surplus balance */}
              {(summary.surplusAdvance || 0) > 0 && (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50/90 p-3.5 text-xs text-emerald-900 flex items-center justify-between gap-3 animate-fadeIn shadow-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-emerald-600 shrink-0" />
                    <span>
                      <strong>Surplus Advance Balance: {formatCurrency(summary.surplusAdvance)}</strong>. Extra payment has been preserved on account and will automatically be credited toward future months' salary.
                    </span>
                  </div>
                </div>
              )}

              {/* Batch-wise Calculation Breakdown (for Batch-based & Percentage teachers) */}
              {teacher.compensationType !== 'fixed' && (calcDetails.batches?.length > 0 || calcDetails.students?.length > 0) && (
                <div className="rounded-2xl border border-brand-border bg-brand-surface p-4 sm:p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-border/60 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                        <Users size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-brand-text">
                          Batch-Wise Fee Calculation ({data?.selectedMonth || selectedMonth})
                        </h4>
                        <p className="text-[10px] text-brand-text-muted">
                          Salary is calculated from batches taught: Active Students in Batch × Fee Per Student × Share %
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                      <span className="text-[11px] font-bold text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-lg border border-brand-primary/20">
                        Total Pool: {formatCurrency(calcDetails.totalBatchFeePool || calcDetails.totalMonthlyFee)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowBreakdown(!showBreakdown)}
                        className="text-xs font-semibold text-brand-primary flex items-center gap-1 hover:underline cursor-pointer bg-brand-surface-tint border border-brand-border px-2.5 py-1 rounded-lg"
                      >
                        {showBreakdown ? (
                          <>
                            Hide Student List <ChevronUp size={14} />
                          </>
                        ) : (
                          <>
                            View Students ({calcDetails.students?.length || 0}) <ChevronDown size={14} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Batches Breakdown Table */}
                  {calcDetails.batches?.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-brand-border">
                      <table className="min-w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-brand-border bg-brand-surface-tint text-brand-text-muted text-[10px] uppercase">
                            <th className="py-2.5 px-3 font-semibold">Batch</th>
                            <th className="py-2.5 px-3 font-semibold">Subject</th>
                            <th className="py-2.5 px-3 font-semibold">Fee / Student</th>
                            <th className="py-2.5 px-3 font-semibold">Active Students</th>
                            <th className="py-2.5 px-3 font-semibold">Batch Total Fee</th>
                            <th className="py-2.5 px-3 font-semibold text-right">
                              Teacher Share ({teacher.studentPercentage || teacher.salaryPercentage || 100}%)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/60">
                          {calcDetails.batches.map((b) => (
                            <tr key={b.batchName} className="hover:bg-brand-surface-tint/40">
                              <td className="py-2.5 px-3 font-bold text-brand-text">
                                {b.batchName}
                              </td>
                              <td className="py-2.5 px-3">
                                {b.subject ? (
                                  <span className="rounded-md bg-brand-primary/10 text-brand-primary px-2 py-0.5 text-[10px] font-semibold border border-brand-primary/20">
                                    {b.subject}
                                  </span>
                                ) : (
                                  <span className="text-brand-text-muted italic text-[10px]">—</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-medium text-brand-text">
                                {b.feePerStudent > 0 ? formatCurrency(b.feePerStudent) : (
                                  <span className="text-brand-text-muted italic text-[10px]">From Student Fees</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-brand-text">
                                {b.studentCount} student{b.studentCount !== 1 ? 's' : ''}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-brand-text">
                                {formatCurrency(b.batchTotalFee)}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-brand-primary text-right">
                                {formatCurrency(b.teacherShare)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-brand-surface-tint/80 border-t border-brand-border font-bold">
                            <td colSpan={3} className="py-2.5 px-3 text-brand-text">
                              Total Across All Batches ({calcDetails.batches.length} batch{calcDetails.batches.length !== 1 ? 'es' : ''})
                            </td>
                            <td className="py-2.5 px-3 text-brand-text">
                              {calcDetails.studentCount} students
                            </td>
                            <td className="py-2.5 px-3 text-brand-text">
                              {formatCurrency(calcDetails.totalBatchFeePool || calcDetails.totalMonthlyFee)}
                            </td>
                            <td className="py-2.5 px-3 text-brand-primary text-right text-sm">
                              {formatCurrency(summary.monthlySalary ?? summary.projectedSalary)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-xs text-brand-text-muted italic border rounded-xl border-brand-border">
                      No batches assigned or no students enrolled for {data?.selectedMonth || selectedMonth}.
                    </div>
                  )}

                  {/* Individual Enrolled Students Table (Collapsible) */}
                  {showBreakdown && calcDetails.students?.length > 0 && (
                    <div className="pt-2 border-t border-brand-border/60">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wider">
                          Individual Enrolled Students
                        </p>
                        <span className="text-[10px] text-brand-text-muted">
                          {calcDetails.students.length} student{calcDetails.students.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-brand-border">
                        <table className="min-w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-brand-border bg-brand-surface-tint text-brand-text-muted text-[10px] uppercase">
                              <th className="py-2 px-3 font-semibold">Student</th>
                              <th className="py-2 px-3 font-semibold">Batch</th>
                              <th className="py-2 px-3 font-semibold">Monthly Fee</th>
                              <th className="py-2 px-3 font-semibold text-right">
                                Teacher Share ({teacher.studentPercentage || teacher.salaryPercentage || 100}%)
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-brand-border/60">
                            {calcDetails.students.map((st) => (
                              <tr key={st.id} className="hover:bg-brand-surface-tint/40">
                                <td className="py-2 px-3 font-medium text-brand-text">{st.name}</td>
                                <td className="py-2 px-3 text-brand-text-muted">
                                  {Array.isArray(st.batches) && st.batches.length > 0
                                    ? st.batches.join(', ')
                                    : (st.batch || '—')}
                                </td>
                                <td className="py-2 px-3 font-medium text-brand-text">
                                  {formatCurrency(st.monthlyFee)}
                                </td>
                                <td className="py-2 px-3 font-bold text-brand-primary text-right">
                                  {formatCurrency(st.teacherShare)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Record Salary Payment Section */}
              <div className="rounded-2xl border border-brand-border bg-brand-surface-tint/40 p-5 shadow-sm space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-brand-text flex items-center gap-2">
                    <CreditCard size={18} className="text-brand-primary" />
                    Record Teacher Salary Payment
                  </h4>
                  <p className="text-xs text-brand-text-muted mt-0.5">
                    Record payment for <strong>{teacher.name}</strong>. Payments automatically reduce earliest unpaid months first, and any extra payment is remembered on account.
                  </p>
                </div>

                {formError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleRecordPayment} className="space-y-4">
                  {/* Step 1: Advance vs In End Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-brand-text mb-2">
                      Payment Timing <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Advance Option */}
                      <button
                        type="button"
                        onClick={() => setPaymentType('advance')}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                          paymentType === 'advance'
                            ? 'border-amber-400 bg-amber-500/10 ring-2 ring-amber-400/40 shadow-sm'
                            : 'border-brand-border bg-brand-surface hover:bg-brand-surface-tint'
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            paymentType === 'advance'
                              ? 'border-amber-600 bg-amber-500 text-white'
                              : 'border-brand-border bg-brand-surface'
                          }`}
                        >
                          {paymentType === 'advance' && <span className="text-xs">✓</span>}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-brand-text">🟡 Advance Payment</span>
                            <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.2 text-[9px] font-extrabold uppercase">
                              Advance
                            </span>
                          </div>
                          <p className="text-[11px] text-brand-text-muted mt-0.5">
                            Salary paid in advance before the end of the month/period.
                          </p>
                        </div>
                      </button>

                      {/* In End Option */}
                      <button
                        type="button"
                        onClick={() => setPaymentType('end')}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                          paymentType === 'end'
                            ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/40 shadow-sm'
                            : 'border-brand-border bg-brand-surface hover:bg-brand-surface-tint'
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            paymentType === 'end'
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-brand-border bg-brand-surface'
                          }`}
                        >
                          {paymentType === 'end' && <span className="text-xs">✓</span>}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-brand-text">🟢 In End (Month End)</span>
                            <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.2 text-[9px] font-extrabold uppercase">
                              In End
                            </span>
                          </div>
                          <p className="text-[11px] text-brand-text-muted mt-0.5">
                            Salary paid at the end of the month / upon cycle completion.
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Payment Details Inputs */}
                  <div className="grid gap-3 sm:grid-cols-3">
                    {/* Amount */}
                    <div>
                      <label className="block text-xs font-semibold text-brand-text mb-1">
                        Amount (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="e.g. 15000"
                        className="w-full rounded-xl border border-brand-border bg-brand-surface px-3 py-2 text-xs font-semibold text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />
                    </div>

                    {/* Payment Date */}
                    <div>
                      <label className="block text-xs font-semibold text-brand-text mb-1">
                        Payment Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={paidAt}
                        onChange={(e) => setPaidAt(e.target.value)}
                        className="w-full rounded-xl border border-brand-border bg-brand-surface px-3 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />
                    </div>

                    {/* Payment Mode */}
                    <div>
                      <label className="block text-xs font-semibold text-brand-text mb-1">
                        Payment Mode <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value)}
                        className="w-full rounded-xl border border-brand-border bg-brand-surface px-3 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      >
                        {PAYMENT_MODES.map((mode) => (
                          <option key={mode} value={mode}>
                            {mode}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Notes / Remarks */}
                  <div>
                    <label className="block text-xs font-semibold text-brand-text mb-1">
                      Notes / Remarks (Optional)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. UPI Ref #4028591, festival advance, etc."
                      className="w-full rounded-xl border border-brand-border bg-brand-surface px-3 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-xl bg-brand-primary px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-primary/90 transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      {submitting ? (
                        'Recording...'
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          {amount && Number(amount) > 0
                            ? `Record ${paymentType === 'advance' ? 'Advance' : 'Salary'} Payment (${formatCurrency(Number(amount))})`
                            : `Record ${paymentType === 'advance' ? 'Advance' : 'Salary'} Payment`}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Salary Payment History Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-brand-text">Salary Payment History</h4>
                    <p className="text-xs text-brand-text-muted mt-0.5">
                      All previous salary disbursements recorded for {teacher.name}. Total Paid All Time: <strong className="text-brand-primary">{formatCurrency(summary.totalPaidAllTime)}</strong>
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-brand-text-muted">
                    {data?.payments?.length || 0} record{data?.payments?.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {!data?.payments || data.payments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-brand-border bg-brand-surface p-8 text-center text-xs text-brand-text-muted">
                    No salary payments recorded yet for this teacher.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-brand-border bg-brand-surface overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-brand-border bg-brand-surface-tint">
                            <th className="px-4 py-3 font-semibold text-brand-text">Date</th>
                            <th className="px-4 py-3 font-semibold text-brand-text">Month</th>
                            <th className="px-4 py-3 font-semibold text-brand-text">Timing</th>
                            <th className="px-4 py-3 font-semibold text-brand-text">Amount</th>
                            <th className="px-4 py-3 font-semibold text-brand-text">Mode</th>
                            <th className="px-4 py-3 font-semibold text-brand-text">Notes</th>
                            <th className="px-4 py-3 font-semibold text-brand-text text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                          {data.payments.map((p) => {
                            const isAdvance = p.paymentType === 'advance'
                            return (
                              <tr key={p.id} className="hover:bg-brand-surface-tint/50 transition-colors">
                                <td className="px-4 py-3 font-medium text-brand-text whitespace-nowrap">
                                  {formatDate(p.paidAt)}
                                </td>
                                <td className="px-4 py-3 text-brand-text whitespace-nowrap font-semibold">
                                  {p.month}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {isAdvance ? (
                                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-800 ring-1 ring-amber-500/30">
                                      🟡 Advance
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-800 ring-1 ring-emerald-500/30">
                                      🟢 In End
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 font-bold text-brand-primary whitespace-nowrap">
                                  {formatCurrency(p.amount)}
                                </td>
                                <td className="px-4 py-3 text-brand-text-muted whitespace-nowrap">
                                  {p.paymentMode || 'UPI'}
                                </td>
                                <td className="px-4 py-3 text-brand-text-muted max-w-xs truncate">
                                  {p.notes || '—'}
                                </td>
                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                  <button
                                    type="button"
                                    disabled={deletingId === p.id}
                                    onClick={() => handleDeletePayment(p.id)}
                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50 cursor-pointer"
                                    title="Delete payment record"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-brand-border bg-brand-surface-tint/60 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-brand-border bg-brand-surface px-4 py-2 text-xs font-semibold text-brand-text hover:bg-brand-surface-tint transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
