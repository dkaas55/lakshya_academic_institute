import { useEffect, useState, useCallback, useMemo } from 'react'
import api from '../../lib/api'
import StudentFilterBar from '../shared/StudentFilterBar'
import FeeLedgerModal from './FeeLedgerModal'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value ?? 0)
}

export default function MasterFeeLedger() {
  const [activeTab, setActiveTab] = useState('pending') // 'pending' | 'history'
  
  const [transactions, setTransactions] = useState([])
  const [pendingDues, setPendingDues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // State for filtering
  const [filteredPending, setFilteredPending] = useState([])
  const [filteredHistory, setFilteredHistory] = useState([])

  // Modal state
  const [selectedStudent, setSelectedStudent] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [txRes, pendingRes] = await Promise.all([
        api.get('/fees/transactions'),
        api.get('/fees/pending')
      ])

      if (txRes.data.success) {
        setTransactions(txRes.data.data)
        setFilteredHistory(txRes.data.data)
      }
      
      if (pendingRes.data.success) {
        setPendingDues(pendingRes.data.data)
        setFilteredPending(pendingRes.data.data)
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.request ? 'Unable to reach the server.' : 'Failed to load ledger data.')
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Map pending dues to match StudentFilterBar expectations
  const filterablePending = useMemo(() => {
    return pendingDues.map(p => ({
      ...p,
      fullName: p.studentName // StudentFilterBar expects fullName
    }))
  }, [pendingDues])

  // Map transactions to match StudentFilterBar expectations
  const filterableHistory = useMemo(() => {
    return transactions.map(t => ({
      ...t,
      fullName: t.studentName
    }))
  }, [transactions])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-brand-text">Master Fee Ledger</h2>
          <p className="text-xs text-brand-text-muted mt-0.5">
            System-wide view of all fee installments and dues.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="self-start sm:self-auto rounded-lg border border-brand-border bg-brand-surface px-3 py-1.5 text-xs font-medium text-brand-text hover:bg-brand-surface-tint disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {loading && (
             <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
             </svg>
          )}
          {loading ? 'Refreshing…' : 'Refresh Ledger'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-brand-border">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-indigo-600 text-brand-primary'
              : 'border-transparent text-brand-text-muted hover:text-brand-text hover:border-brand-border'
          }`}
        >
          Pending Dues Tracker
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-emerald-600 text-brand-primary'
              : 'border-transparent text-brand-text-muted hover:text-brand-text hover:border-brand-border'
          }`}
        >
          Settled / History Ledger
        </button>
      </div>

      {/* Filter Bar */}
      <StudentFilterBar
        students={activeTab === 'pending' ? filterablePending : filterableHistory}
        onFilterChange={activeTab === 'pending' ? setFilteredPending : setFilteredHistory}
        accentColor={activeTab === 'pending' ? 'indigo' : 'emerald'}
      />

      <section className="rounded-2xl border border-brand-border bg-brand-surface shadow-sm overflow-hidden">
        {error && (
          <p
            role="alert"
            className="mx-4 mt-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
          >
            {error}
          </p>
        )}

        {loading && (activeTab === 'pending' ? pendingDues.length === 0 : transactions.length === 0) ? (
          <div className="px-4 py-12 text-center text-xs text-brand-text-muted">
            Loading ledger data…
          </div>
        ) : activeTab === 'pending' ? (
          /* PENDING DUES TRACKER */
          filteredPending.length === 0 ? (
            <div className="px-4 py-12 text-center text-xs text-brand-text-muted">
              No pending dues found matching the filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-brand-border bg-brand-surface-tint/80">
                    <th className="px-4 py-3 font-semibold text-brand-text">Student Name</th>
                    <th className="px-4 py-3 font-semibold text-brand-text">Batch</th>
                    <th className="px-4 py-3 font-semibold text-brand-text">Class</th>
                    <th className="px-4 py-3 font-semibold text-brand-text">Monthly Fee</th>
                    <th className="px-4 py-3 font-semibold text-brand-text">Fee Pending for Month</th>
                    <th className="px-4 py-3 font-semibold text-brand-text text-right">Amount to be Paid</th>
                    <th className="px-4 py-3 font-semibold text-brand-text text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {filteredPending.map((due) => (
                    <tr key={due.id} className="hover:bg-brand-surface-tint/60 transition-colors">
                      <td className="px-4 py-3 font-medium text-brand-text">{due.studentName}</td>
                      <td className="px-4 py-3 text-brand-text">{due.batch}</td>
                      <td className="px-4 py-3 text-brand-text">{due.studentClass || '—'}</td>
                      <td className="px-4 py-3 font-medium text-brand-text">
                        {formatCurrency(due.monthlyFeeAmount || due.totalCourseFee)}
                      </td>
                      <td className="px-4 py-3 text-brand-text">
                        <span className="inline-block max-w-[200px] truncate" title={due.feePendingForMonth || '1 Month'}>
                          {due.feePendingForMonth || '1 Month'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-amber-600 text-right">
                        {formatCurrency(due.amountDue)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedStudent({
                            id: due.id,
                            fullName: due.studentName,
                            batch: due.batch,
                            studentClass: due.studentClass
                          })}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary/10 px-3 py-1.5 text-xs font-semibold text-brand-primary hover:bg-indigo-100 transition-colors"
                        >
                          Collect Fee
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* SETTLED / HISTORY LEDGER */
          filteredHistory.length === 0 ? (
            <div className="px-4 py-12 text-center text-xs text-brand-text-muted">
              No historical transactions found matching the filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-brand-border bg-brand-surface-tint/80">
                    <th className="px-4 py-3 font-semibold text-brand-text">Date & Time</th>
                    <th className="px-4 py-3 font-semibold text-brand-text">Student Name</th>
                    <th className="px-4 py-3 font-semibold text-brand-text">Batch</th>
                    <th className="px-4 py-3 font-semibold text-brand-text text-right">Amount Paid</th>
                    <th className="px-4 py-3 font-semibold text-brand-text">Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {filteredHistory.map((tx) => (
                    <tr key={tx.id} className="hover:bg-brand-surface-tint/60 transition-colors">
                      <td className="px-4 py-3 text-brand-text whitespace-nowrap">
                        {new Intl.DateTimeFormat('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(new Date(tx.paidAt))}
                      </td>
                      <td className="px-4 py-3 font-medium text-brand-text">{tx.studentName}</td>
                      <td className="px-4 py-3 text-brand-text">{tx.batch}</td>
                      <td className="px-4 py-3 font-semibold text-brand-primary text-right">
                        {new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          maximumFractionDigits: 0,
                        }).format(tx.amount)}
                      </td>
                      <td className="px-4 py-3 text-brand-text">{tx.method || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </section>

      {/* Render FeeLedgerModal if a student is selected for collection */}
      {selectedStudent && (
        <FeeLedgerModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onPaymentCollected={() => {
            // Optional: immediately refresh data
            loadData()
          }}
        />
      )}
    </div>
  )
}
