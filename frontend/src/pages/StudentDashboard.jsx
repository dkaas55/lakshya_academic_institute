import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { clearToken, clearRole } from '../lib/auth'

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
  }).format(new Date(iso))
}

// ─── Fee badge ────────────────────────────────────────────────────────────────

const FEE_STATUS_CONFIG = {
  PAID: {
    pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    bar: 'bg-emerald-500',
    label: 'Fully Paid',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  PARTIAL: {
    pill: 'bg-sky-50 text-sky-700 ring-sky-200',
    bar: 'bg-sky-400',
    label: 'Partially Paid',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  PENDING: {
    pill: 'bg-amber-50 text-amber-700 ring-amber-200',
    bar: 'bg-amber-400',
    label: 'Payment Pending',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
}

// ─── Material type badge config ───────────────────────────────────────────────

const MATERIAL_TYPE_CONFIG = {
  Notes: { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  Assignment: { badge: 'bg-amber-50 text-amber-700 ring-amber-200' },
  'Lecture Link': { badge: 'bg-sky-50 text-sky-700 ring-sky-200' },
}

// ─── Nav tabs for the student portal ─────────────────────────────────────────

const TABS = [
  { id: 'overview',    label: 'Overview',    icon: '◫' },
  { id: 'attendance',  label: 'Attendance',  icon: '📅' },
  { id: 'materials',   label: 'Materials',   icon: '📚' },
  { id: 'tests',       label: 'Practice Tests', icon: '📝' },
  { id: 'payments',    label: 'Payments',    icon: '₹'  },
]

// ─── Main component ───────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab]   = useState('overview')
  const [dashData, setDashData]     = useState(null)
  const [attnData, setAttnData]     = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  useEffect(() => {
    let cancelled = false

    async function fetchDashboard() {
      setLoading(true)
      setError('')
      try {
        const [dashRes, attnRes] = await Promise.all([
          api.get('/student/dashboard'),
          api.get('/attendance/my-history').catch(() => ({ data: { success: false } }))
        ])
        if (!cancelled) {
          if (dashRes.data.success) {
            setDashData(dashRes.data.data)
          } else {
            setError(dashRes.data.message || 'Failed to load your dashboard.')
          }
          if (attnRes.data.success) {
            setAttnData(attnRes.data.data)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              (err.request
                ? 'Unable to reach the server. Please check your connection.'
                : 'Something went wrong. Please try again.')
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchDashboard()
    return () => { cancelled = true }
  }, [])

  function handleSignOut() {
    clearToken()
    clearRole()
    navigate('/login', { replace: true })
  }

  const student   = dashData?.student
  const fee       = dashData?.fee
  const materials = dashData?.materials ?? []
  const tests     = dashData?.tests ?? []

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Top nav ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white select-none">
              {student?.fullName?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Student Portal</p>
              <p className="text-sm font-semibold text-slate-900 leading-none mt-0.5">
                {loading ? 'Loading…' : (student?.fullName ?? 'My Dashboard')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {student?.batch && (
              <span className="hidden sm:inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-semibold text-indigo-700 ring-1 ring-indigo-200">
                {student.batch}
              </span>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <span className="text-[11px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {/* ── Global loading skeleton ──────────────────────────────────────── */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-40 rounded-2xl bg-slate-200" />
            <div className="h-6 w-48 rounded bg-slate-200" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="h-28 rounded-xl bg-slate-200" />
              <div className="h-28 rounded-xl bg-slate-200" />
            </div>
          </div>
        )}

        {/* ── Error state ──────────────────────────────────────────────────── */}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center">
            <p className="text-sm font-medium text-red-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-xs text-red-600 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Loaded content ───────────────────────────────────────────────── */}
        {!loading && dashData && (
          <>
            {/* ── OVERVIEW TAB ───────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="flex flex-col gap-6 p-4">
                <FeeStatusCard fee={fee} />
                {/* Quick materials preview */}
                {materials.length > 0 && (
                  <section className="w-full">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-semibold text-slate-900">Recent Materials</h2>
                      <button
                        type="button"
                        onClick={() => setActiveTab('materials')}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        View all →
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {materials.slice(0, 2).map((item) => (
                        <MaterialCard key={item._id} item={item} />
                      ))}
                    </div>
                  </section>
                )}
                <AttendanceSummaryCard attnData={attnData} onViewAll={() => setActiveTab('attendance')} />
              </div>
            )}

            {/* ── ATTENDANCE TAB ─────────────────────────────────────────── */}
            {activeTab === 'attendance' && (
              <AttendanceHistoryPage attnData={attnData} />
            )}

            {/* ── MATERIALS TAB ──────────────────────────────────────────── */}
            {activeTab === 'materials' && (
              <StudyVault materials={materials} />
            )}

            {/* ── PRACTICE TESTS TAB ───────────────────────────────────────── */}
            {activeTab === 'tests' && (
              <PracticeTests tests={tests} />
            )}

            {/* ── PAYMENTS TAB ───────────────────────────────────────────── */}
            {activeTab === 'payments' && (
              <div className="space-y-5">
                <FeeStatusCard fee={fee} />
                {fee?.paymentHistory?.length > 0 && (
                  <PaymentHistoryTable history={fee.paymentHistory} />
                )}
                {!fee?.paymentHistory?.length && (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white py-10 text-center">
                    <p className="text-xs text-slate-400">No payments recorded yet.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

// ─── Attendance Summary Card (Overview tab) ───────────────────────────────────

function AttendanceSummaryCard({ attnData, onViewAll }) {
  if (!attnData?.summary) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-slate-900">My Attendance</h2>
        </div>
        <p className="text-xs text-slate-400 py-2">No attendance records yet.</p>
      </section>
    )
  }

  const { attendancePercentage, present, late, absent, totalClasses } = attnData.summary
  const pctColor = attendancePercentage >= 85 ? '#10b981' : attendancePercentage >= 75 ? '#f59e0b' : '#f43f5e'
  const circumference = 2 * Math.PI * 36
  const dash = (attendancePercentage / 100) * circumference

  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">My Attendance</p>
          <h2 className="text-base font-semibold text-slate-900 mt-0.5">Quick Overview</h2>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs text-indigo-600 hover:underline font-medium"
        >
          Full history →
        </button>
      </div>

      <div className="flex items-center gap-6">
        {/* SVG circle progress */}
        <div className="shrink-0">
          <svg width="88" height="88" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r="36" fill="none" stroke="#e2e8f0" strokeWidth="8" />
            <circle
              cx="44" cy="44" r="36"
              fill="none"
              stroke={pctColor}
              strokeWidth="8"
              strokeDasharray={`${dash} ${circumference}`}
              strokeLinecap="round"
              transform="rotate(-90 44 44)"
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
            <text x="44" y="47" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1e293b">
              {attendancePercentage}%
            </text>
          </svg>
        </div>

        {/* Stat pills */}
        <div className="grid grid-cols-2 gap-2 flex-1">
          {[
            { label: 'Total',   value: totalClasses, color: 'text-slate-800',  bg: 'bg-slate-50 border-slate-100' },
            { label: 'Present', value: present,       color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
            { label: 'Late',    value: late,          color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-100'   },
            { label: 'Absent',  value: absent,        color: 'text-rose-700',   bg: 'bg-rose-50 border-rose-100'     },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border px-3 py-2 ${s.bg}`}>
              <p className="text-[9px] font-medium uppercase text-slate-400 tracking-wide">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Full Attendance History Page (Attendance tab) ────────────────────────────

function AttendanceHistoryPage({ attnData }) {
  const [filter, setFilter] = useState('all')   // 'all' | 'Present' | 'Late' | 'Absent'

  if (!attnData?.summary) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
        <p className="text-2xl mb-2">📅</p>
        <p className="text-sm font-semibold text-slate-700">No attendance data yet</p>
        <p className="text-xs text-slate-400 mt-1">Your teacher hasn't recorded any sessions for your batch yet.</p>
      </div>
    )
  }

  const { attendancePercentage, present, late, absent, totalClasses } = attnData.summary
  const history = attnData.history ?? []

  const pctColor       = attendancePercentage >= 85 ? '#10b981' : attendancePercentage >= 75 ? '#f59e0b' : '#f43f5e'
  const pctLabelColor  = attendancePercentage >= 85 ? 'text-emerald-600' : attendancePercentage >= 75 ? 'text-amber-600' : 'text-rose-600'
  const pctBg          = attendancePercentage >= 85 ? 'bg-emerald-50 border-emerald-100' : attendancePercentage >= 75 ? 'bg-amber-50 border-amber-100' : 'bg-rose-50 border-rose-100'
  const circumference  = 2 * Math.PI * 52
  const dash           = (attendancePercentage / 100) * circumference

  // ── Calendar heatmap for the last 60 entries ─────────────────────────────
  const STATUS_DOT = {
    Present: 'bg-emerald-500',
    Late:    'bg-amber-400',
    Absent:  'bg-rose-500',
  }

  // filter for the log
  const filtered = filter === 'all' ? history : history.filter((h) => h.status === filter)

  // ── Streak calculation ────────────────────────────────────────────────────
  let streak = 0
  for (const h of [...history]) {
    if (h.status === 'Present' || h.status === 'Late') streak++
    else break
  }

  return (
    <div className="space-y-6">
      {/* ── Header metric card ────────────────────────────────────────────── */}
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Large donut */}
          <div className="shrink-0 flex flex-col items-center gap-2">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#f1f5f9" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke={pctColor}
                strokeWidth="10"
                strokeDasharray={`${dash} ${circumference}`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dasharray 1.2s ease' }}
              />
              <text x="60" y="56" textAnchor="middle" fontSize="22" fontWeight="800" fill="#0f172a">
                {attendancePercentage}%
              </text>
              <text x="60" y="72" textAnchor="middle" fontSize="9" fill="#94a3b8">
                Attendance
              </text>
            </svg>
            {/* Status label */}
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${pctBg} ${pctLabelColor}`}>
              {attendancePercentage >= 85 ? '🟢 Great' : attendancePercentage >= 75 ? '🟡 At Risk' : '🔴 Low'}
            </span>
          </div>

          {/* Stats grid */}
          <div className="flex-1 w-full">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-3">Breakdown</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Classes', value: totalClasses, accent: 'text-slate-900',   bg: 'bg-slate-50  border-slate-200'   },
                { label: 'Present',       value: present,      accent: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
                { label: 'Late',          value: late,         accent: 'text-amber-700',   bg: 'bg-amber-50  border-amber-200'   },
                { label: 'Absent',        value: absent,       accent: 'text-rose-700',    bg: 'bg-rose-50   border-rose-200'    },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.bg}`}>
                  <p className="text-[9px] uppercase font-medium text-slate-400 tracking-wide">{s.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${s.accent}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Streak */}
            {streak > 0 && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-2">
                <span className="text-base">🔥</span>
                <span className="text-xs font-semibold text-indigo-700">
                  {streak}-day attendance streak
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Calendar dot heatmap ──────────────────────────────────────────── */}
      {history.length > 0 && (
        <section className="w-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-4">Session Heatmap</p>
          <div className="flex flex-wrap gap-1.5">
            {[...history].reverse().slice(0, 60).map((h, i) => (
              <div
                key={i}
                title={`${formatDate(h.date)} — ${h.status}`}
                className={`h-5 w-5 rounded-sm ${STATUS_DOT[h.status] ?? 'bg-slate-200'} opacity-90 hover:opacity-100 hover:scale-110 transition-transform cursor-default`}
              />
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4">
            {[['Present', 'bg-emerald-500'], ['Late', 'bg-amber-400'], ['Absent', 'bg-rose-500']].map(([label, dot]) => (
              <span key={label} className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                <span className={`h-3 w-3 rounded-sm ${dot}`} />
                {label}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Log with filter ───────────────────────────────────────────────── */}
      <section className="w-full rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Attendance Log</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {filtered.length} record{filtered.length !== 1 ? 's' : ''}
              {filter !== 'all' && ` · filtered by ${filter}`}
            </p>
          </div>
          {/* Filter pills */}
          <div className="flex items-center gap-1.5">
            {['all', 'Present', 'Late', 'Absent'].map((f) => {
              const active = filter === f
              const colors = {
                all:     active ? 'bg-slate-800 text-white'   : 'bg-white text-slate-600 border-slate-200',
                Present: active ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700 border-emerald-200',
                Late:    active ? 'bg-amber-500 text-white'   : 'bg-white text-amber-700 border-amber-200',
                Absent:  active ? 'bg-rose-600 text-white'    : 'bg-white text-rose-700 border-rose-200',
              }
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded-full border px-3 py-1 text-[10px] font-semibold transition-colors ${colors[f]}`}
                >
                  {f === 'all' ? 'All' : f}
                </button>
              )
            })}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-xs text-slate-400">No records matching this filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {filtered.map((log, idx) => {
              const badgeCfg = {
                Present: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
                Late:    'bg-amber-50 text-amber-700 ring-amber-200',
                Absent:  'bg-rose-50 text-rose-700 ring-rose-200',
              }[log.status] ?? 'bg-slate-50 text-slate-600 ring-slate-200'

              const dotCfg = {
                Present: 'bg-emerald-500',
                Late:    'bg-amber-400',
                Absent:  'bg-rose-500',
              }[log.status] ?? 'bg-slate-300'

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${dotCfg}`} />
                    <span className="text-xs font-medium text-slate-700">
                      {new Intl.DateTimeFormat('en-IN', {
                        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                      }).format(new Date(log.date))}
                    </span>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ${badgeCfg}`}>
                    {log.status}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

// ─── Fee Status Card ──────────────────────────────────────────────────────────

function FeeStatusCard({ fee }) {
  if (!fee) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-8 text-center">
        <p className="text-xs text-slate-400">Fee information is not available yet.</p>
      </div>
    )
  }

  const config = FEE_STATUS_CONFIG[fee.feeStatus] ?? FEE_STATUS_CONFIG.PENDING
  const paidPercent =
    fee.totalCourseFee > 0
      ? Math.min(100, Math.round((fee.amountPaid / fee.totalCourseFee) * 100))
      : 0

  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">My Fee Status</p>
          <h2 className="text-base font-semibold text-slate-900 mt-0.5">Course Fee Overview</h2>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ${config.pill}`}>
          {config.icon}
          {config.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <FeeMetric label="Total Fee"    value={formatCurrency(fee.totalCourseFee)} />
        <FeeMetric label="Amount Paid"  value={formatCurrency(fee.amountPaid)}  accent="emerald" />
        <FeeMetric label="Balance Due"  value={formatCurrency(fee.amountDue)}   accent={fee.amountDue > 0 ? 'amber' : 'slate'} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-slate-500">Payment progress</span>
          <span className="text-[10px] font-semibold text-slate-700">{paidPercent}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${config.bar}`}
            style={{ width: `${paidPercent}%` }}
          />
        </div>
      </div>
    </section>
  )
}

function FeeMetric({ label, value, accent = 'slate' }) {
  const colours = { emerald: 'text-emerald-800', amber: 'text-amber-800', slate: 'text-slate-900' }
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-bold mt-1 ${colours[accent] ?? colours.slate}`}>{value}</p>
    </div>
  )
}

// ─── Study Vault — 3-level Accordion (Subject → Chapter → Files) ─────────────

const SUBJECT_ICONS = {
  Mathematics:       '📐',
  Maths:             '📐',
  Math:              '📐',
  Science:           '🔬',
  Physics:           '⚡',
  Chemistry:         '🧪',
  Biology:           '🧬',
  English:           '📖',
  History:           '🏛️',
  Geography:         '🌍',
  'Computer Science':'💻',
  Economics:         '📊',
  Civics:            '⚖️',
}

const TYPE_ICON_MAP = {
  Notes:          { icon: '📄', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  Assignment:     { icon: '✏️', badge: 'bg-amber-50 text-amber-700 ring-amber-200' },
  'Lecture Link': { icon: '🎬', badge: 'bg-sky-50 text-sky-700 ring-sky-200' },
}

function subjectIcon(subject) {
  return SUBJECT_ICONS[subject] ?? '📂'
}

function StudyVault({ materials }) {
  const [openSubjects, setOpenSubjects] = useState({})
  const [openChapters, setOpenChapters] = useState({})

  if (materials.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <p className="text-4xl mb-3">📚</p>
        <p className="text-sm font-semibold text-slate-700">No materials yet</p>
        <p className="text-xs text-slate-400 mt-1">Your teacher hasn't uploaded any materials.<br />Check back soon!</p>
      </div>
    )
  }

  // Group: subject → chapter → files
  const grouped = {}
  for (const m of materials) {
    const subj = m.subject || 'General'
    const chap = m.chapter?.trim() || 'General'
    if (!grouped[subj]) grouped[subj] = {}
    if (!grouped[subj][chap]) grouped[subj][chap] = []
    grouped[subj][chap].push(m)
  }

  const subjects = Object.keys(grouped).sort()
  const totalCount = materials.length

  function toggleSubject(subj) {
    setOpenSubjects((prev) => ({ ...prev, [subj]: !prev[subj] }))
  }

  function toggleChapter(key) {
    setOpenChapters((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Study Vault</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {totalCount} resource{totalCount !== 1 ? 's' : ''} across {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">📚 Your Batch</span>
      </div>

      {/* Subject folder grid */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {subjects.map((subj) => {
          const chapters = Object.keys(grouped[subj]).sort()
          const fileCount = Object.values(grouped[subj]).flat().length
          const isOpen = !!openSubjects[subj]

          return (
            <div key={subj} className={`w-full rounded-2xl border bg-white shadow-sm overflow-hidden transition-all duration-300 ${
              isOpen ? 'border-indigo-200 shadow-indigo-100/60' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
            }`}>
              {/* Subject header card */}
              <button
                type="button"
                onClick={() => toggleSubject(subj)}
                className="w-full flex items-center gap-3 px-4 py-4 text-left group"
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 transition-colors ${
                  isOpen ? 'bg-indigo-100' : 'bg-slate-100 group-hover:bg-indigo-50'
                }`}>
                  {subjectIcon(subj)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate transition-colors ${
                    isOpen ? 'text-indigo-700' : 'text-slate-900'
                  }`}>{subj}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {chapters.length} chapter{chapters.length !== 1 ? 's' : ''} · {fileCount} file{fileCount !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Chevron */}
                <svg
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-indigo-500' : ''
                  }`}
                  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Chapters list — revealed when subject is open */}
              {isOpen && (
                <div className="border-t border-indigo-100 bg-slate-50/70 divide-y divide-slate-100">
                  {chapters.map((chap) => {
                    const chapKey = `${subj}::${chap}`
                    const files = grouped[subj][chap]
                    const isChapOpen = !!openChapters[chapKey]

                    return (
                      <div key={chap}>
                        {/* Chapter row */}
                        <button
                          type="button"
                          onClick={() => toggleChapter(chapKey)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/70 transition-colors"
                        >
                          <span className="text-sm">{isChapOpen ? '📂' : '📁'}</span>
                          <span className="flex-1 text-xs font-semibold text-slate-700 truncate">{chap}</span>
                          <span className="shrink-0 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-bold px-1.5 py-0.5">
                            {files.length}
                          </span>
                          <svg
                            className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                              isChapOpen ? 'rotate-180' : ''
                            }`}
                            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>

                        {/* Files list */}
                        {isChapOpen && (
                          <div className="pb-2 px-3 space-y-2">
                            {files.map((file) => {
                              const typeCfg = TYPE_ICON_MAP[file.materialType] ?? TYPE_ICON_MAP.Notes
                              return (
                                <div
                                  key={file._id}
                                  className="w-full rounded-xl border border-slate-200 bg-white p-3 flex items-start gap-3 hover:border-indigo-200 hover:shadow-sm transition-all"
                                >
                                  <span className="text-lg mt-0.5 shrink-0">{typeCfg.icon}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-slate-900 leading-snug line-clamp-2">
                                      {file.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ring-1 ${typeCfg.badge}`}>
                                        {file.materialType}
                                      </span>
                                      <span className="text-[10px] text-slate-400">{formatDate(file.createdAt)}</span>
                                    </div>
                                    {file.description && (
                                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{file.description}</p>
                                    )}
                                  </div>
                                  <a
                                    href={file.fileUrlOrLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="shrink-0 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-indigo-500 transition-colors whitespace-nowrap"
                                  >
                                    Open ↗
                                  </a>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ─── Material Card (used in Overview quick-preview) ───────────────────────────

function MaterialCard({ item }) {
  const typeConfig = MATERIAL_TYPE_CONFIG[item.materialType] ?? MATERIAL_TYPE_CONFIG.Notes
  return (
    <div className="w-full flex flex-col rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ring-1 ${typeConfig.badge}`}>
          {item.materialType}
        </span>
        <span className="text-[10px] text-slate-400">{formatDate(item.createdAt)}</span>
      </div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1 leading-snug">{item.title}</h3>
      <div className="flex flex-wrap gap-1.5 mb-2">
        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{item.subject}</span>
        {item.chapter && (
          <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">{item.chapter}</span>
        )}
      </div>
      {item.description && (
        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 mb-3 flex-1">{item.description}</p>
      )}
      <a
        href={item.fileUrlOrLink}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto block text-center rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-500 transition-colors"
      >
        Open Resource ↗
      </a>
    </div>
  )
}

// ─── Payment History Table ────────────────────────────────────────────────────

function PaymentHistoryTable({ history }) {
  return (
    <section className="w-full rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
        <h2 className="text-sm font-semibold text-slate-900">Payment History</h2>
        <p className="text-[11px] text-slate-500 mt-0.5">{history.length} transaction{history.length !== 1 ? 's' : ''} recorded</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-4 py-2.5 font-semibold text-slate-600">Date</th>
              <th className="px-4 py-2.5 font-semibold text-slate-600">Amount</th>
              <th className="px-4 py-2.5 font-semibold text-slate-600">Mode</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {history.map((entry) => (
              <tr key={entry._id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                  {new Intl.DateTimeFormat('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  }).format(new Date(entry.paidAt))}
                </td>
                <td className="px-4 py-2.5 font-semibold text-emerald-700">
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(entry.amount)}
                </td>
                <td className="px-4 py-2.5 text-slate-700">{entry.method || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// ─── Practice Tests accordion (Subject → Chapter → Test files) ───────────────

function PracticeTests({ tests }) {
  const [openSubjects, setOpenSubjects] = useState({})
  const [openChapters, setOpenChapters] = useState({})

  if (tests.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <p className="text-4xl mb-3">📝</p>
        <p className="text-sm font-semibold text-slate-700">No practice tests yet</p>
        <p className="text-xs text-slate-400 mt-1">Your teacher hasn't uploaded any practice tests.<br />Check back later!</p>
      </div>
    )
  }

  // Group: subject → chapter → tests
  const grouped = {}
  for (const t of tests) {
    const subj = t.subject || 'General'
    const chap = t.chapter?.trim() || 'General'
    if (!grouped[subj]) grouped[subj] = {}
    if (!grouped[subj][chap]) grouped[subj][chap] = []
    grouped[subj][chap].push(t)
  }

  const subjects = Object.keys(grouped).sort()
  const totalCount = tests.length

  function toggleSubject(subj) {
    setOpenSubjects((prev) => ({ ...prev, [subj]: !prev[subj] }))
  }

  function toggleChapter(key) {
    setOpenChapters((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Practice Tests</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {totalCount} test{totalCount !== 1 ? 's' : ''} across {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">📝 Practice Zone</span>
      </div>

      {/* Subject folder grid */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {subjects.map((subj) => {
          const chapters = Object.keys(grouped[subj]).sort()
          const fileCount = Object.values(grouped[subj]).flat().length
          const isOpen = !!openSubjects[subj]

          return (
            <div key={subj} className={`w-full rounded-2xl border bg-white shadow-sm overflow-hidden transition-all duration-300 ${
              isOpen ? 'border-violet-200 shadow-violet-100/60' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
            }`}>
              {/* Subject header card */}
              <button
                type="button"
                onClick={() => toggleSubject(subj)}
                className="w-full flex items-center gap-3 px-4 py-4 text-left group"
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 transition-colors ${
                  isOpen ? 'bg-violet-100' : 'bg-slate-100 group-hover:bg-violet-50'
                }`}>
                  {subjectIcon(subj)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate transition-colors ${
                    isOpen ? 'text-violet-700' : 'text-slate-900'
                  }`}>{subj}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {chapters.length} chapter{chapters.length !== 1 ? 's' : ''} · {fileCount} test{fileCount !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Chevron */}
                <svg
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-violet-500' : ''
                  }`}
                  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Chapters list — revealed when subject is open */}
              {isOpen && (
                <div className="border-t border-violet-100 bg-slate-50/70 divide-y divide-slate-100">
                  {chapters.map((chap) => {
                    const chapKey = `${subj}::${chap}`
                    const files = grouped[subj][chap]
                    const isChapOpen = !!openChapters[chapKey]

                    return (
                      <div key={chap}>
                        {/* Chapter row */}
                        <button
                          type="button"
                          onClick={() => toggleChapter(chapKey)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/70 transition-colors"
                        >
                          <span className="text-sm">{isChapOpen ? '📂' : '📁'}</span>
                          <span className="flex-1 text-xs font-semibold text-slate-700 truncate">{chap}</span>
                          <span className="shrink-0 rounded-full bg-violet-100 text-violet-700 text-[9px] font-bold px-1.5 py-0.5">
                            {files.length}
                          </span>
                          <svg
                            className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                              isChapOpen ? 'rotate-180' : ''
                            }`}
                            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>

                        {/* Files list */}
                        {isChapOpen && (
                          <div className="pb-2 px-3 space-y-2">
                            {files.map((file) => {
                              return (
                                <div
                                  key={file._id}
                                  className="w-full rounded-xl border border-slate-200 bg-white p-3 flex items-start gap-3 hover:border-violet-200 hover:shadow-sm transition-all"
                                >
                                  <span className="text-lg mt-0.5 shrink-0">📝</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-slate-900 leading-snug line-clamp-2">
                                      {file.testTitle}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                      {file.totalQuestions && (
                                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide bg-violet-50 text-violet-700 ring-1 ring-violet-200">
                                          {file.totalQuestions} Questions
                                        </span>
                                      )}
                                      <span className="text-[10px] text-slate-400">{formatDate(file.createdAt)}</span>
                                    </div>
                                  </div>
                                  <a
                                    href={file.documentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="shrink-0 rounded-lg bg-violet-600 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-violet-500 transition-colors whitespace-nowrap"
                                  >
                                    Open ↗
                                  </a>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
