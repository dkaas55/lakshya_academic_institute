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
      {status}
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
      const { data } = await api.post(`/fees/collect/${student.id}`, {
        amount: paymentAmount,
        paymentMode,
      })

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
        className="relative z-10 w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] overflow-hidden flex flex-col rounded-t-2xl sm:rounded-2xl border border-brand-border bg-brand-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3 px-4 sm:px-5 py-4 border-b border-brand-border bg-brand-surface-tint/80 shrink-0">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-text-muted">Fee Ledger</p>
            <h2 id="fee-ledger-title" className="text-base font-semibold text-brand-text mt-0.5">
              {student.fullName}
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
                  student={student}
                  onDismiss={() => setLastReceipt(null)}
                />
              )}

              {/* ── Fee status + summary cards ──────────────────────────── */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-brand-text-muted">Fee Status</span>
                <FeeStatusPill status={ledgerData.feeStatus} />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-brand-border bg-brand-surface-tint/80 px-3 py-2.5">
                  <p className="text-[10px] font-medium text-brand-text-muted uppercase tracking-wide">Total Fee</p>
                  <p className="text-sm font-semibold text-brand-text mt-1">{formatCurrency(ledgerData.totalCourseFee)}</p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-brand-primary/10/50 px-3 py-2.5">
                  <p className="text-[10px] font-medium text-brand-primary/80 uppercase tracking-wide">Paid</p>
                  <p className="text-sm font-semibold text-emerald-800 mt-1">{formatCurrency(ledgerData.amountPaid)}</p>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2.5">
                  <p className="text-[10px] font-medium text-amber-800/80 uppercase tracking-wide">Due</p>
                  <p className="text-sm font-semibold text-amber-900 mt-1">{formatCurrency(ledgerData.amountDue)}</p>
                </div>
              </div>


              {/* ── Collect Installment Form ────────────────────────────── */}
              {amountDue > 0 && (
                <form onSubmit={handleCollect} className="rounded-2xl border border-brand-border bg-brand-surface p-3 space-y-3">
                  <h3 className="text-xs font-semibold text-brand-text">Collect Installment</h3>

                  {collectError && (
                    <p role="alert" className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5">
                      {collectError}
                    </p>
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
                        max={amountDue}
                        step="1"
                        value={amount}
                        onChange={(e) => {
                          setAmount(e.target.value)
                          setCollectError('')
                          setLastReceipt(null)
                        }}
                        placeholder={`Max ${amountDue}`}
                        className="w-full rounded-lg border border-brand-border px-2.5 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                        disabled={collecting}
                      />
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
              )}

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
