import { useCallback, useEffect, useRef, useState } from 'react'
import api from '../../lib/api'
import { usePdfGenerator } from '../../hooks/usePdfGenerator'

const PAYMENT_MODES = ['Cash', 'UPI', 'GPay', 'PhonePe']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value ?? 0)
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function FeeStatusPill({ status }) {
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
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${styles[baseStatus]}`}>
      {status || 'PENDING'}
    </span>
  )
}

// ─── Receipt success banner ───────────────────────────────────────────────────

function ReceiptSuccessBanner({ receiptInfo, student, onDismiss }) {
  const { generatePdf, generating: downloading } = usePdfGenerator()
  const [downloaded, setDownloaded]   = useState(false)
  const [dlError, setDlError]         = useState('')

  const downloadReceipt = async () => {
    setDlError('')
    try {
      const safeStudentName = student.fullName.replace(/[^a-zA-Z0-9]/g, '_')
      const safeDate = new Date(receiptInfo.paidAt).toISOString().split('T')[0]
      const fileName = `Receipt_${safeStudentName}_${safeDate}.pdf`

      await generatePdf(receiptInfo, student, fileName)
      setDownloaded(true)
    } catch (err) {
      console.error('PDF generation failed:', err)
      setDlError(`Could not generate PDF: ${err.message || String(err)}`)
    }
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 space-y-3">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-primary/100 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-900">Payment recorded successfully!</p>
            <p className="text-[11px] text-brand-primary mt-0.5">
              {formatCurrency(receiptInfo.amount)} via {receiptInfo.paymentMode}
              {receiptInfo.amountDue > 0
                ? ` · ${formatCurrency(receiptInfo.amountDue)} remaining`
                : ' · Fully paid 🎉'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDismiss()
          }}
          className="text-emerald-400 hover:text-brand-primary transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Download button */}
      <button
        type="button"
        onClick={downloadReceipt}
        disabled={downloading}
        className={`w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all shadow-sm
          ${downloaded
            ? 'bg-emerald-600 text-white dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/30 hover:bg-emerald-700'
            : 'bg-brand-surface border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-brand-surface-tint'
          }
          ${downloading ? 'opacity-70 cursor-wait' : ''}`}
      >
        {downloading ? (
          <>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating PDF…
          </>
        ) : downloaded ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Downloaded! Click to re-download
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download Receipt for Parents (PDF)
          </>
        )}
      </button>

      {dlError && (
        <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {dlError}
        </p>
      )}

      <p className="text-[10px] text-brand-primary/70 text-center">
        Receipt #{receiptInfo.receiptNumber}
      </p>
    </div>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function FeeLedgerModal({ student, onClose, onPaymentCollected }) {
  const [ledger,         setLedger]         = useState(null)
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState('')
  const [amount,         setAmount]         = useState('')
  const [paymentMode,    setPaymentMode]    = useState(PAYMENT_MODES[0])
  const [paymentTiming,  setPaymentTiming]  = useState('advance')
  const [collecting,     setCollecting]     = useState(false)
  const [collectError,   setCollectError]   = useState('')
  // ── Receipt state ─────────────────────────────────────────────────────────
  const [lastReceipt,    setLastReceipt]    = useState(null)   // holds receipt data for banner
  const receiptCounter = useRef(1)

  const loadLedger = useCallback(async () => {
    if (!student?.id) return
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get(`/fees/ledger/${student.id}`)
      if (!data.success) {
        setError(data.message || 'Could not load fee ledger.')
        setLedger(null)
        return
      }
      setLedger(data.data)
      if (data.data?.ledger?.paymentTiming) {
        setPaymentTiming(data.data.ledger.paymentTiming)
      } else {
        setPaymentTiming('advance')
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.request ? 'Unable to reach the server. Is the backend running?' : 'Failed to load fee ledger.')
      )
      setLedger(null)
    } finally {
      setLoading(false)
    }
  }, [student?.id])

  useEffect(() => {
    loadLedger()
  }, [loadLedger])

  useEffect(() => {
    function onKeyDown(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  async function handleCollect(e) {
    e.preventDefault()
    setCollectError('')
    setLastReceipt(null)

    const paymentAmount = Number(amount)
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      setCollectError('Enter a valid payment amount greater than zero.')
      return
    }

    setCollecting(true)
    try {
      const payload = {
        amount: paymentAmount,
        paymentMode,
      }
      if (!ledger?.ledger?.paymentTiming) {
        payload.paymentTiming = paymentTiming
      }

      const { data } = await api.post(`/fees/collect/${student.id}`, payload)

      if (!data.success) {
        setCollectError(data.message || 'Payment could not be recorded.')
        return
      }

      // Update ledger in state
      setLedger((prev) => ({
        ...prev,
        student: data.data.student,
        ledger:  data.data.ledger,
      }))
      if (data.data.ledger.paymentTiming) {
        setPaymentTiming(data.data.ledger.paymentTiming)
      }
      onPaymentCollected?.(data.data.ledger.feeStatus)
      setAmount('')

      // Build receipt info and show banner
      const now = new Date().toISOString()
      const rNum = `RCP-${Date.now().toString().slice(-8)}-${String(receiptCounter.current++).padStart(3, '0')}`
      setLastReceipt({
        amount:         paymentAmount,
        amountDue:      data.data.ledger.amountDue,
        totalCourseFee: data.data.ledger.totalCourseFee,
        monthlyFeeAmount: data.data.ledger.monthlyFeeAmount,
        paymentTiming:  data.data.ledger.paymentTiming,
        paymentMode,
        paidAt:         now,
        receiptNumber:  rNum,
      })
    } catch (err) {
      setCollectError(
        err.response?.data?.message ||
          (err.request ? 'Unable to reach the server.' : 'Failed to record payment.')
      )
    } finally {
      setCollecting(false)
    }
  }

  const ledgerData = ledger?.ledger
  const amountDue  = ledgerData?.amountDue ?? 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fee-ledger-title"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 -z-10 bg-brand-text/30 backdrop-blur-[2px] transition-opacity"
        aria-hidden="true"
      />

      <div
        className="relative z-10 w-full max-w-xl lg:max-w-2xl max-h-[92vh] sm:max-h-[88vh] overflow-hidden flex flex-col rounded-t-2xl sm:rounded-2xl border border-brand-border bg-brand-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3 px-4 sm:px-5 py-4 border-b border-brand-border bg-brand-surface-tint/80 shrink-0">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-text-muted">Fee Ledger</p>
            <h2 id="fee-ledger-title" className="text-base font-semibold text-brand-text mt-0.5 flex items-center gap-2">
              <span>{student.fullName}</span>
              {(student.rollNo || ledger?.student?.rollNo) && (
                <span className="rounded-md bg-brand-primary/10 text-brand-primary px-2 py-0.5 text-xs font-mono font-bold">
                  {student.rollNo || ledger?.student?.rollNo}
                </span>
              )}
            </h2>
            <p className="text-[11px] text-brand-text-muted mt-0.5">
              {student.batch}
              {student.studentClass && ` · Class ${student.studentClass}`}
              {student.phoneNumber && ` · ${student.phoneNumber}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-brand-text-muted/75 hover:bg-brand-surface-tint hover:text-brand-text transition-colors cursor-pointer relative z-50"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* ── Scrollable Body ───────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-4 sm:px-5 py-4 space-y-4">

          {loading ? (
            <div className="py-10 flex flex-col items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-xs text-brand-text-muted">Loading fee ledger…</p>
            </div>
          ) : error ? (
            <p role="alert" className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          ) : ledgerData ? (
            <>
              {/* ── Receipt Success Banner ──────────────────────────────── */}
              {lastReceipt && (
                <ReceiptSuccessBanner
                  receiptInfo={lastReceipt}
                  student={{ ...student, rollNo: student.rollNo || ledger?.student?.rollNo }}
                  onDismiss={() => setLastReceipt(null)}
                />
              )}

              {/* ── Fee status + summary cards ──────────────────────────── */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-brand-text-muted">Fee Status</span>
                <FeeStatusPill status={ledgerData.feeStatus} />
              </div>

              {/* ── 4 Summary Cards: Monthly Fee, Amount to be Paid, Fee Pending for Month, Payment Time ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="rounded-xl border border-brand-border bg-brand-surface-tint/80 px-3 py-2.5 flex flex-col justify-between min-h-[80px]">
                  <p className="text-[10px] font-medium text-brand-text-muted uppercase tracking-wide">Monthly Fee</p>
                  <p className="text-sm font-semibold text-brand-text mt-1">
                    {formatCurrency(ledgerData.monthlyFeeAmount || ledgerData.totalCourseFee)}
                  </p>
                </div>
                <div className={`rounded-xl border px-3 py-2.5 flex flex-col justify-between min-h-[80px] ${
                  amountDue > 0
                    ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800/40 dark:bg-amber-950/20'
                    : 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/40 dark:bg-emerald-950/20'
                }`}>
                  <p className={`text-[10px] font-medium uppercase tracking-wide ${
                    amountDue > 0 ? 'text-amber-800/80 dark:text-amber-400' : 'text-emerald-800/80 dark:text-emerald-400'
                  }`}>Amount to be Paid</p>
                  <p className={`text-sm font-semibold mt-1 ${
                    amountDue > 0 ? 'text-amber-900 dark:text-amber-300' : 'text-emerald-900 dark:text-emerald-300'
                  }`}>{formatCurrency(amountDue)}</p>
                </div>
                <div className="rounded-xl border border-brand-border bg-brand-surface-tint/80 px-3 py-2.5 flex flex-col justify-between min-h-[80px]">
                  <p className="text-[10px] font-medium text-brand-text-muted uppercase tracking-wide">Fee Pending for Month</p>
                  {(() => {
                    const text = ledgerData.feePendingForMonth || 'None'
                    const match = text.match(/^(.*?)\s*\((.*?)\)$/)
                    if (match) {
                      return (
                        <div className="mt-1" title={text}>
                          <p className="text-xs font-bold text-brand-text">{match[1]}</p>
                          <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 mt-0.5 leading-snug break-words">
                            {match[2]}
                          </p>
                        </div>
                      )
                    }
                    return (
                      <p className="text-xs font-semibold text-brand-text mt-1 leading-snug break-words" title={text}>
                        {text}
                      </p>
                    )
                  })()}
                </div>
                <div className="rounded-xl border border-brand-border bg-brand-surface-tint/80 px-3 py-2.5 flex flex-col justify-between min-h-[80px]">
                  <p className="text-[10px] font-medium text-brand-text-muted uppercase tracking-wide">Payment Time</p>
                  <p className="text-xs font-semibold text-brand-text mt-1">
                    {ledgerData.paymentTiming === 'advance'
                      ? 'In Advance'
                      : ledgerData.paymentTiming === 'after_month'
                      ? 'End of Month'
                      : 'Set on 1st Payment'}
                  </p>
                </div>
              </div>


              {/* ── Collect Installment Form ────────────────────────────── */}
              <form onSubmit={handleCollect} className="rounded-2xl border border-brand-border bg-brand-surface p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-brand-text">Collect Installment</h3>
                  {!ledgerData.paymentTiming ? (
                    <span className="text-[10px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800">
                      First Payment Setup
                    </span>
                  ) : amountDue === 0 ? (
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                      Advance Payment
                    </span>
                  ) : null}
                </div>

                {collectError && (
                  <p role="alert" className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5">
                    {collectError}
                  </p>
                )}

                {/* Payment Timing: ONLY rendered for 1st payment when paymentTiming is not yet saved */}
                {!ledgerData.paymentTiming && (
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 dark:border-indigo-900/40 dark:bg-indigo-950/20 p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-brand-text">
                        Payment Time
                      </label>
                      <span className="text-[10px] text-brand-text-muted">Set once for this student</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          paymentTiming === 'advance'
                            ? 'border-indigo-600 bg-white dark:bg-brand-surface shadow-xs font-semibold text-brand-text ring-1 ring-indigo-500'
                            : 'border-brand-border bg-white/60 dark:bg-brand-surface/60 text-brand-text-muted hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentTiming"
                          value="advance"
                          checked={paymentTiming === 'advance'}
                          onChange={() => setPaymentTiming('advance')}
                          className="accent-indigo-600"
                        />
                        <span>In Advance</span>
                      </label>
                      <label
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          paymentTiming === 'after_month'
                            ? 'border-indigo-600 bg-white dark:bg-brand-surface shadow-xs font-semibold text-brand-text ring-1 ring-indigo-500'
                            : 'border-brand-border bg-white/60 dark:bg-brand-surface/60 text-brand-text-muted hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentTiming"
                          value="after_month"
                          checked={paymentTiming === 'after_month'}
                          onChange={() => setPaymentTiming('after_month')}
                          className="accent-indigo-600"
                        />
                        <span>End of Month</span>
                      </label>
                    </div>
                    <p className="text-[10px] text-brand-text-muted">
                      {paymentTiming === 'advance'
                        ? 'Fees will be billed in advance at the start of each month.'
                        : 'Fees will be billed after each month completes (end of month).'}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="installment-amount" className="block text-[10px] font-medium text-brand-text mb-1">
                      Amount (₹)
                    </label>
                    <input
                      id="installment-amount"
                      type="number"
                      min="1"
                      step="1"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value)
                        setCollectError('')
                        setLastReceipt(null)
                      }}
                      placeholder="Enter amount (more or less)"
                      className="w-full rounded-lg border border-brand-border px-2.5 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                      disabled={collecting}
                    />
                    <p className="mt-1 text-[10px] text-brand-text-muted">Pay any amount — partial, exact, or advance.</p>
                  </div>
                  <div>
                    <label htmlFor="payment-mode" className="block text-[10px] font-medium text-brand-text mb-1">
                      Payment Mode
                    </label>
                    <select
                      id="payment-mode"
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full rounded-lg border border-brand-border px-2.5 py-2 text-xs text-brand-text bg-brand-surface focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                      disabled={collecting}
                    >
                      {PAYMENT_MODES.map((mode) => (
                        <option key={mode} value={mode}>{mode}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={collecting || !amount}
                  className="w-full rounded-lg bg-brand-accent px-3 py-2 text-xs font-semibold text-white dark:text-brand-bg hover:bg-brand-accent-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {collecting ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Recording…
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                      </svg>
                      Record Payment
                    </>
                  )}
                </button>
              </form>

              {/* ── Payment History ─────────────────────────────────────── */}
              <div>
                <h3 className="text-xs font-semibold text-brand-text mb-2">
                  Payment History
                  <span className="ml-1.5 text-[10px] font-normal text-brand-text-muted/75">
                    ({ledgerData.paymentHistory?.length ?? 0} transactions)
                  </span>
                </h3>
                {!ledgerData.paymentHistory?.length ? (
                  <p className="text-[11px] text-brand-text-muted py-4 text-center border border-dashed border-brand-border rounded-lg">
                    No payments recorded yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-brand-border">
                    <table className="min-w-full text-left text-[11px]">
                      <thead>
                        <tr className="bg-brand-surface-tint border-b border-brand-border">
                          <th className="px-3 py-2 font-semibold text-brand-text">Date</th>
                          <th className="px-3 py-2 font-semibold text-brand-text">Amount</th>
                          <th className="px-3 py-2 font-semibold text-brand-text">Mode</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border">
                        {ledgerData.paymentHistory.map((entry) => (
                          <tr key={entry._id} className="hover:bg-brand-surface-tint/60 transition-colors">
                            <td className="px-3 py-2 text-brand-text whitespace-nowrap">{formatDate(entry.paidAt)}</td>
                            <td className="px-3 py-2 font-semibold text-brand-primary">{formatCurrency(entry.amount)}</td>
                            <td className="px-3 py-2 text-brand-text">{entry.method || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Receipt template is rendered dynamically by the usePdfGenerator hook */}
    </div>
  )
}
