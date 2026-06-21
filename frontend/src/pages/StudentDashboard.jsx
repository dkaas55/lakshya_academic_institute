import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { clearToken, clearRole } from '../lib/auth'
import SettingsModal from '../components/shared/SettingsModal'
import { useTheme } from '../context/ThemeContext'


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
    pill: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 ring-emerald-100 dark:ring-emerald-900/50',
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
    pill: 'bg-sky-50 dark:bg-sky-950/30 text-sky-800 dark:text-sky-400 ring-sky-100 dark:ring-sky-900/50',
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
    pill: 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 ring-amber-100 dark:ring-amber-900/50',
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
  Notes: { badge: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 ring-emerald-100 dark:ring-emerald-900/50' },
  Assignment: { badge: 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 ring-amber-100 dark:ring-amber-900/50' },
  'Lecture Link': { badge: 'bg-sky-50 dark:bg-sky-950/30 text-sky-800 dark:text-sky-400 ring-sky-100 dark:ring-sky-900/50' },
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
  const [showSettings, setShowSettings] = useState(false)
  const { theme, setTheme } = useTheme()

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
    <div className="min-h-screen bg-brand-bg text-brand-text flex relative pb-28 lg:pb-0 transition-colors duration-300">
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      
      {/* ── Desktop Sidebar (hidden on mobile) ─────────────────────────────── */}
      <aside className="hidden lg:flex inset-y-0 left-0 z-30 w-60 flex-col border-r border-brand-border bg-brand-primary text-brand-surface transition-transform duration-300">
        <div className="px-6 py-6 border-b border-brand-border/20 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm overflow-hidden shrink-0">
            <img src="/logo.png" alt="Logo" className="h-full w-full object-contain p-1" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold leading-tight">
              Lakshya Academy
            </p>
            <h1 className="text-xs font-semibold text-brand-surface/90 mt-0.5">Student Portal</h1>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {TABS.map((item) => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-surface text-brand-primary shadow-sm font-extrabold scale-[1.02]'
                    : 'text-brand-surface/80 hover:bg-brand-surface/10 hover:text-brand-surface'
                }`}
              >
                <span className="text-[14px]" aria-hidden>
                  {item.icon}
                </span>
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-brand-border/20 space-y-1.5">
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="w-full rounded-xl px-4 py-3 text-xs font-semibold text-brand-surface/80 hover:bg-brand-surface/10 hover:text-brand-surface transition-all duration-200 text-left flex items-center gap-3"
          >
            <span className="text-[14px]">⚙️</span>
            Settings
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header (visible on all screens) */}
        <header className="sticky top-0 z-10 bg-brand-surface border-b border-brand-border px-6 py-4 flex items-center justify-between gap-4 transition-colors duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm overflow-hidden">
              <img src="/logo.png" alt="Logo" className="h-full w-full object-contain p-0.5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-brand-text truncate">
                {student ? `Hello ${student.fullName}` : ''}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold text-brand-text-muted">
             {student?.batch && (
              <span className="hidden sm:inline-flex items-center rounded-full bg-brand-primary/10 px-3 py-1 text-[10px] font-bold text-brand-primary border border-brand-primary/20">
                {student.batch}
              </span>
            )}
            
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl bg-brand-surface-tint hover:bg-brand-surface border border-brand-border text-brand-text-muted hover:text-brand-text transition-colors cursor-pointer text-xs font-semibold"
              title="Toggle Theme"
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>

            <span className="hidden sm:inline-flex rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-2.5 py-1 text-[10px] uppercase font-bold tracking-wide">
              Live
            </span>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="lg:hidden rounded-xl bg-brand-surface-tint border border-brand-border px-3 py-1.5 text-xs font-bold text-brand-text hover:bg-brand-surface transition-colors"
            >
              ⚙️
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 sm:p-8">
          {/* Top-Left Logo Card in Dashboard body canvas */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 flex items-center gap-4 mb-8 shadow-sm max-w-sm transition-all duration-300 hover:scale-[1.01]">
            <img src="/logo.png" alt="Lakshya Logo" className="h-10 w-auto object-contain" />
            <div>
              <h1 className="text-base font-extrabold text-brand-primary leading-tight">
                Lakshya Academic Institute
              </h1>
              <p className="text-[9px] text-brand-text-muted uppercase tracking-widest font-bold mt-0.5">
                Student Portal
              </p>
            </div>
          </div>

          <div className="mx-auto max-w-5xl flex flex-col gap-6">
            {/* Header Section inside main area for desktop feel */}
            {!loading && student && (
              <div className="hidden lg:flex flex-col gap-1 mb-2 animate-fadeIn">
                <h1 className="text-2xl font-bold text-brand-primary tracking-tight">Student Dashboard</h1>
                <p className="text-xs text-brand-text-muted">
                  Welcome back, {student.fullName}! Here is an overview of your academic progress, learning materials, and fee status.
                </p>
              </div>
            )}

        {/* ── Global loading skeleton ──────────────────────────────────────── */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-40 rounded-xl bg-brand-surface-tint/60" />
            <div className="h-6 w-48 rounded bg-brand-surface-tint/60" />
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="h-28 rounded-xl bg-brand-surface-tint/60" />
              <div className="h-28 rounded-xl bg-brand-surface-tint/60" />
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
              <div className="flex flex-col gap-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Attendance Card */}
                  <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-sm p-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted/80">Attendance</span>
                      <div className="rounded-lg bg-brand-primary/10 p-2 rounded-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl font-bold text-brand-text">{attnData?.summary?.attendancePercentage ?? 0}%</p>
                      <p className="text-xs text-brand-text-muted mt-1">
                        {attnData?.summary ? `Present: ${attnData.summary.present}/${attnData.summary.totalClasses} classes` : 'No records'}
                      </p>
                    </div>
                  </div>

                  {/* Pending Fees Card */}
                  <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-sm p-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted/80">Pending Fees</span>
                      <div className="rounded-lg bg-brand-primary/10 p-2 rounded-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl font-bold text-brand-text">{formatCurrency(fee?.amountDue ?? 0)}</p>
                      <p className="text-xs text-brand-text-muted mt-1">
                        {fee ? `Total paid: ${formatCurrency(fee.amountPaid)}` : 'No fee info'}
                      </p>
                    </div>
                  </div>

                  {/* Next Exam Card */}
                  <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-sm p-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted/80">Next Practice Test</span>
                      <div className="rounded-lg bg-brand-primary/10 p-2 rounded-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-lg font-bold text-brand-text truncate" title={tests[0]?.subject ?? 'No Exam'}>
                        {tests[0]?.subject ?? 'No Exam'}
                      </p>
                      <p className="text-xs text-brand-text-muted mt-1 truncate" title={tests[0]?.testTitle ?? 'All caught up!'}>
                        {tests[0]?.testTitle ?? 'All caught up!'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick materials preview */}
                {materials.length > 0 && (
                  <section className="bg-brand-surface rounded-2xl border border-brand-border shadow-sm p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-brand-border pb-3">
                      <div>
                        <h2 className="text-base font-bold text-brand-text">Recent Materials</h2>
                        <p className="text-xs text-brand-text-muted mt-0.5">Quick access to newly uploaded study materials</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('materials')}
                        className="text-xs font-semibold text-brand-primary hover:text-brand-primary"
                      >
                        View all →
                      </button>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
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
              <div className="flex flex-col gap-6">
                <FeeStatusCard fee={fee} />
                {fee?.paymentHistory?.length > 0 && (
                  <PaymentHistoryTable history={fee.paymentHistory} />
                )}
                {!fee?.paymentHistory?.length && (
                  <div className="rounded-xl border border-dashed border-brand-border bg-brand-surface py-10 text-center">
                    <p className="text-xs text-brand-text-muted/80">No payments recorded yet.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
          </div>
        </main>
      </div>

      {/* ── Mobile Bottom Nav (hidden on desktop) ──────────────────────────── */}
      <nav className="lg:hidden fixed bottom-6 left-4 right-4 z-50 bg-brand-primary text-brand-surface rounded-[2rem] px-4 py-3 flex justify-between items-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] border border-brand-border/20 backdrop-blur-xl">
        {TABS.map((item) => {
          const isActive = activeTab === item.id
          // Custom SVG icons matching the tabs
          const renderIcon = (id, active) => {
            const color = active ? 'text-brand-gold' : 'text-brand-surface/60'
            const fill = active ? 'currentColor' : 'none'
            switch (id) {
              case 'overview':
                return (
                  <svg className={`w-6 h-6 ${color} transition-all duration-300`} fill={fill} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                )
              case 'materials':
                return (
                  <svg className={`w-6 h-6 ${color} transition-all duration-300`} fill={fill} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                )
              case 'tests':
                return (
                  <svg className={`w-6 h-6 ${color} transition-all duration-300`} fill={fill} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                )
              case 'attendance':
                return (
                  <svg className={`w-6 h-6 ${color} transition-all duration-300`} fill={fill} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )
              case 'payments':
                return (
                  <svg className={`w-6 h-6 ${color} transition-all duration-300`} fill={fill} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              default:
                return null
            }
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="relative flex-1 flex flex-col items-center justify-center p-2 group"
            >
              {isActive && (
                <div className="absolute inset-0 bg-brand-surface/10 rounded-xl scale-105 transition-transform duration-300" />
              )}
              <div className={`relative transition-transform duration-300 ${isActive ? '-translate-y-1' : 'group-hover:-translate-y-0.5'}`}>
                {renderIcon(item.id, isActive)}
              </div>
              {isActive && (
                <span className="absolute bottom-0 text-[10px] font-bold text-brand-gold mt-1 opacity-100 transition-opacity">
                  {item.label}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

// ─── Attendance Summary Card (Overview tab) ───────────────────────────────────

function AttendanceSummaryCard({ attnData, onViewAll }) {
  if (!attnData?.summary) {
    return (
      <section className="rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-brand-text">My Attendance</h2>
        </div>
        <p className="text-xs text-brand-text-muted/80 py-2">No attendance records yet.</p>
      </section>
    )
  }

  const { attendancePercentage, present, late, absent, totalClasses } = attnData.summary
  const pctColor = attendancePercentage >= 85 ? '#10b981' : attendancePercentage >= 75 ? '#f59e0b' : '#f43f5e'
  const circumference = 2 * Math.PI * 36
  const dash = (attendancePercentage / 100) * circumference

  return (
    <section className="w-full rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-text-muted/80">My Attendance</p>
          <h2 className="text-base font-bold text-brand-text mt-0.5">Quick Overview</h2>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs text-brand-primary hover:text-brand-primary font-semibold transition-colors"
        >
          Full history →
        </button>
      </div>

      <div className="flex items-center gap-6">
        {/* SVG circle progress */}
        <div className="shrink-0">
          <svg width="88" height="88" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r="36" fill="none" stroke="#f3f4f6" strokeWidth="8" />
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
            <text x="44" y="47" textAnchor="middle" fontSize="14" fontWeight="700" fill="currentColor" className="text-brand-text">
              {attendancePercentage}%
            </text>
          </svg>
        </div>

        {/* Stat pills */}
        <div className="grid grid-cols-2 gap-2 flex-1">
          {[
            { label: 'Total',   value: totalClasses, color: 'text-brand-text', labelColor: 'text-brand-text-muted', bg: 'bg-brand-surface-tint border-brand-border' },
            { label: 'Present', value: present,       color: 'text-emerald-800 dark:text-emerald-300', labelColor: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50' },
            { label: 'Late',    value: late,          color: 'text-amber-800 dark:text-amber-300', labelColor: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50'   },
            { label: 'Absent',  value: absent,        color: 'text-rose-800 dark:text-rose-300', labelColor: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/50'     },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border px-3 py-2 ${s.bg}`}>
              <p className={`text-[9px] font-semibold uppercase tracking-wide ${s.labelColor}`}>{s.label}</p>
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

  // ── Date and Month lookup state ────────────────────────────────────────────
  const [lookupDate, setLookupDate]       = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [dateResult, setDateResult]       = useState(null)
  const [monthResult, setMonthResult]     = useState(null)
  const [filterLoading, setFilterLoading] = useState(false)

  if (!attnData?.summary) {
    return (
      <div className="rounded-xl border border-dashed border-brand-border bg-brand-surface p-12 text-center">
        <p className="text-2xl mb-2">📅</p>
        <p className="text-sm font-bold text-brand-text">No attendance data yet</p>
        <p className="text-xs text-brand-text-muted mt-1">Your teacher hasn't recorded any sessions for your batch yet.</p>
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

  // ── Month options from history ──────────────────────────────────────────────
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  const monthOptions = []
  const seenMonths = new Set()
  for (const h of history) {
    const d = new Date(h.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!seenMonths.has(key)) {
      seenMonths.add(key)
      monthOptions.push({ value: key, label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` })
    }
  }

  // ── Date lookup handler ─────────────────────────────────────────────────────
  const handleDateLookup = () => {
    if (!lookupDate) return
    setMonthResult(null)
    const target = new Date(lookupDate)
    target.setUTCHours(0, 0, 0, 0)
    const match = history.find((h) => {
      const hd = new Date(h.date)
      hd.setUTCHours(0, 0, 0, 0)
      return hd.getTime() === target.getTime()
    })
    setDateResult({ date: lookupDate, status: match?.status || null })
  }

  // ── Month filter handler ────────────────────────────────────────────────────
  const handleMonthSelect = (monthVal) => {
    setSelectedMonth(monthVal)
    setDateResult(null)
    if (!monthVal) { setMonthResult(null); return }
    const [year, mon] = monthVal.split('-').map(Number)
    const monthHistory = history.filter((h) => {
      const d = new Date(h.date)
      return d.getFullYear() === year && d.getMonth() + 1 === mon
    })
    let mp = 0, ml = 0, ma = 0
    monthHistory.forEach((h) => {
      if (h.status === 'Present') mp++
      else if (h.status === 'Late') ml++
      else if (h.status === 'Absent') ma++
    })
    const total = monthHistory.length
    const pct = total > 0 ? Math.round(((mp + ml) / total) * 100) : null
    setMonthResult({
      month: `${MONTH_NAMES[mon - 1]} ${year}`,
      totalClasses: total,
      present: mp,
      late: ml,
      absent: ma,
      attendancePercentage: pct,
      history: monthHistory,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header metric card ────────────────────────────────────────────── */}
      <div className="w-full rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Large donut */}
          <div className="shrink-0 flex flex-col items-center gap-2">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#f3f4f6" strokeWidth="10" />
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
              <text x="60" y="56" textAnchor="middle" fontSize="22" fontWeight="800" fill="#1f2937">
                {attendancePercentage}%
              </text>
              <text x="60" y="72" textAnchor="middle" fontSize="9" fill="#9ca3af">
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
            <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-text-muted/80 mb-3">Breakdown</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Classes', value: totalClasses, accent: 'text-brand-text',   labelColor: 'text-brand-text-muted', bg: 'bg-brand-surface-tint border-brand-border' },
                { label: 'Present',       value: present,      accent: 'text-emerald-800 dark:text-emerald-300', labelColor: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50' },
                { label: 'Late',          value: late,         accent: 'text-amber-800 dark:text-amber-300', labelColor: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50' },
                { label: 'Absent',        value: absent,       accent: 'text-rose-800 dark:text-rose-300', labelColor: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/50' },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.bg}`}>
                  <p className={`text-[9px] uppercase font-semibold tracking-wide ${s.labelColor}`}>{s.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${s.accent}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Streak */}
            {streak > 0 && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-primary/10 border border-brand-border/40 px-3 py-2">
                <span className="text-base">🔥</span>
                <span className="text-xs font-semibold text-brand-primary">
                  {streak}-day attendance streak
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Calendar dot heatmap ──────────────────────────────────────────── */}
      {history.length > 0 && (
        <section className="w-full rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-text-muted/80 mb-4">Session Heatmap</p>
          <div className="flex flex-wrap gap-1.5">
            {[...history].reverse().slice(0, 60).map((h, i) => (
              <div
                key={i}
                title={`${formatDate(h.date)} — ${h.status}`}
                className={`h-5 w-5 rounded-sm ${STATUS_DOT[h.status] ?? 'bg-gray-200'} opacity-90 hover:opacity-100 hover:scale-110 transition-transform cursor-default`}
              />
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4">
            {[['Present', 'bg-emerald-500'], ['Late', 'bg-amber-400'], ['Absent', 'bg-rose-500']].map(([label, dot]) => (
              <span key={label} className="flex items-center gap-1.5 text-[10px] text-brand-text-muted font-medium">
                <span className={`h-3 w-3 rounded-sm ${dot}`} />
                {label}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Date / Month Lookup Controls ────────────────────────────────────── */}
      <section className="w-full rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-text-muted/80 mb-4">Lookup Attendance</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Date lookup */}
          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1.5">By Date</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={lookupDate}
                onChange={(e) => setLookupDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="flex-1 rounded-xl border border-brand-border bg-brand-surface px-3 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
              />
              <button
                type="button"
                onClick={handleDateLookup}
                disabled={!lookupDate}
                className="rounded-xl bg-brand-primary hover:bg-brand-primary/90 px-4 py-2.5 text-xs font-bold text-brand-surface disabled:opacity-60 transition-all shadow-sm cursor-pointer"
              >
                Check
              </button>
            </div>
          </div>

          {/* Month selector */}
          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1.5">By Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthSelect(e.target.value)}
              className="w-full rounded-xl border border-brand-border bg-brand-surface px-3 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
            >
              <option value="">Select month…</option>
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ── Date Result ──────────────────────────────────────────────────────── */}
      {dateResult && (
        <section className="w-full rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-text-muted/80 mb-3">
            Status on {new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateResult.date))}
          </p>
          {dateResult.status ? (
            <div className="flex items-center gap-3">
              {(() => {
                const dotCfg = { Present: 'bg-emerald-500', Late: 'bg-amber-400', Absent: 'bg-rose-500' }[dateResult.status] ?? 'bg-gray-400'
                const badgeCfg = {
                  Present: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 ring-emerald-100 dark:ring-emerald-900/50',
                  Late:    'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 ring-amber-100 dark:ring-amber-900/50',
                  Absent:  'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-400 ring-rose-100 dark:ring-rose-900/50',
                }[dateResult.status] ?? 'bg-brand-surface-tint text-brand-text-muted ring-brand-border'
                return (
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ${badgeCfg}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${dotCfg}`} />
                    {dateResult.status}
                  </span>
                )
              })()}
              <span className="text-xs text-brand-text font-semibold">
                You were marked <strong>{dateResult.status}</strong> on this date.
              </span>
            </div>
          ) : (
            <p className="text-xs text-brand-text-muted">No attendance record found for this date.</p>
          )}
        </section>
      )}

      {/* ── Month Result ─────────────────────────────────────────────────────── */}
      {monthResult && (
        <section className="w-full rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-text-muted/80">
              {monthResult.month} Summary
            </p>
            {(() => {
              const pct = monthResult.attendancePercentage
              if (pct === null) return <span className="text-[11px] text-brand-text-muted">—</span>
              const cls =
                pct >= 85 ? 'bg-brand-primary/10 text-brand-primary ring-brand-primary/20' :
                pct >= 75 ? 'bg-brand-gold/15 text-brand-gold ring-brand-gold/25' :
                            'bg-brand-accent/10 text-brand-accent ring-brand-accent/20'
              return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${cls}`}>{pct}%</span>
            })()}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Classes',  value: monthResult.totalClasses, bg: 'bg-brand-surface-tint border-brand-border', color: 'text-brand-text' },
              { label: 'Present',  value: monthResult.present,      bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50', color: 'text-emerald-800 dark:text-emerald-300' },
              { label: 'Late',     value: monthResult.late,         bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50', color: 'text-amber-800 dark:text-amber-300' },
              { label: 'Absent',   value: monthResult.absent,       bg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/50', color: 'text-rose-800 dark:text-rose-300' },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl border px-3 py-2 ${s.bg}`}>
                <p className="text-[9px] uppercase font-semibold tracking-wide text-brand-text-muted">{s.label}</p>
                <p className={`text-lg font-bold mt-0.5 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Day-by-day list */}
          {monthResult.history?.length > 0 && (
            <div className="divide-y divide-brand-border max-h-52 overflow-y-auto pr-1">
              {monthResult.history.map((h, idx) => {
                const dotCfg = { Present: 'bg-emerald-500', Late: 'bg-amber-400', Absent: 'bg-rose-500' }[h.status] ?? 'bg-gray-400'
                const badgeCfg = {
                  Present: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 ring-emerald-100 dark:ring-emerald-900/50',
                  Late:    'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 ring-amber-100 dark:ring-amber-900/50',
                  Absent:  'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-400 ring-rose-100 dark:ring-rose-900/50',
                }[h.status] ?? 'bg-brand-surface-tint text-brand-text-muted ring-brand-border'
                return (
                  <div key={idx} className="flex items-center justify-between py-2.5 hover:bg-brand-surface-tint/60 transition-colors">
                    <span className="text-xs font-semibold text-brand-text">
                      {new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(h.date))}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ${badgeCfg}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${dotCfg}`} />
                      {h.status}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* ── Log with filter ───────────────────────────────────────────────── */}
      <section className="w-full rounded-2xl border border-brand-border bg-brand-surface shadow-sm p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap border-b border-brand-border pb-3">
          <div>
            <h2 className="text-base font-bold text-brand-text">Attendance Log</h2>
            <p className="text-xs text-brand-text-muted mt-0.5">
              {filtered.length} record{filtered.length !== 1 ? 's' : ''}
              {filter !== 'all' && ` · filtered by ${filter}`}
            </p>
          </div>
          {/* Filter pills */}
          <div className="flex items-center gap-1.5">
            {['all', 'Present', 'Late', 'Absent'].map((f) => {
              const active = filter === f
               const colors = {
                all:     active ? 'bg-brand-primary text-brand-surface'   : 'bg-brand-surface text-brand-text-muted border-brand-border hover:bg-brand-surface-tint',
                Present: active ? 'bg-emerald-600 text-white' : 'bg-brand-surface text-emerald-700 dark:text-emerald-400 border-brand-border hover:bg-emerald-50/10',
                Late:    active ? 'bg-amber-500 text-white'   : 'bg-brand-surface text-amber-700 dark:text-amber-400 border-brand-border hover:bg-amber-50/10',
                Absent:  active ? 'bg-rose-600 text-white'    : 'bg-brand-surface text-rose-700 dark:text-rose-400 border-brand-border hover:bg-rose-50/10',
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
            <p className="text-xs text-brand-text-muted">No records matching this filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-brand-border max-h-96 overflow-y-auto pr-1">
            {filtered.map((log, idx) => {
              const badgeCfg = {
                Present: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 ring-emerald-100 dark:ring-emerald-900/50',
                Late:    'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 ring-amber-100 dark:ring-amber-900/50',
                Absent:  'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-400 ring-rose-100 dark:ring-rose-900/50',
              }[log.status] ?? 'bg-brand-surface-tint text-brand-text-muted ring-brand-border'

              const dotCfg = {
                Present: 'bg-emerald-500',
                Late:    'bg-amber-400',
                Absent:  'bg-rose-500',
              }[log.status] ?? 'bg-gray-400'

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between py-3 hover:bg-brand-surface-tint/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${dotCfg}`} />
                    <span className="text-xs font-semibold text-brand-text">
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
      <div className="rounded-xl border border-dashed border-brand-border bg-brand-surface py-8 text-center">
        <p className="text-xs text-brand-text-muted/80">Fee information is not available yet.</p>
      </div>
    )
  }

  let config = FEE_STATUS_CONFIG[fee.feeStatus]
  if (!config) {
    const status = fee.feeStatus || '';
    if (status === 'PAID') {
      config = FEE_STATUS_CONFIG.PAID;
    } else if (status === 'PARTIAL') {
      config = FEE_STATUS_CONFIG.PARTIAL;
    } else {
      config = { ...FEE_STATUS_CONFIG.PENDING, label: status };
    }
  }
  const paidPercent =
    fee.totalCourseFee > 0
      ? Math.min(100, Math.round((fee.amountPaid / fee.totalCourseFee) * 100))
      : 0

  return (
    <section className="w-full rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-text-muted/80">My Fee Status</p>
          <h2 className="text-base font-bold text-brand-text mt-0.5">Course Fee Overview</h2>
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

    </section>
  )
}

function FeeMetric({ label, value, accent = 'slate' }) {
  const colours = { 
    emerald: 'text-emerald-700 dark:text-emerald-400', 
    amber: 'text-amber-700 dark:text-amber-400', 
    slate: 'text-brand-text' 
  }
  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface-tint px-3 py-2.5">
      <p className="text-[10px] font-medium text-brand-text-muted/80 uppercase tracking-wide">{label}</p>
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
  Notes:          { icon: '📄', badge: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 ring-emerald-100 dark:ring-emerald-900/50' },
  Assignment:     { icon: '✏️', badge: 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 ring-amber-100 dark:ring-amber-900/50' },
  'Lecture Link': { icon: '🎬', badge: 'bg-sky-50 dark:bg-sky-950/30 text-sky-800 dark:text-sky-400 ring-sky-100 dark:ring-sky-900/50' },
}

function subjectIcon(subject) {
  return SUBJECT_ICONS[subject] ?? '📂'
}

function StudyVault({ materials }) {
  const [openSubjects, setOpenSubjects] = useState({})
  const [openChapters, setOpenChapters] = useState({})

  if (materials.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-brand-border bg-brand-surface py-16 text-center">
        <p className="text-4xl mb-3">📚</p>
        <p className="text-sm font-bold text-brand-text">No materials yet</p>
        <p className="text-xs text-brand-text-muted mt-1">Your teacher hasn't uploaded any materials.<br />Check back soon!</p>
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
    <section className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-brand-border pb-3">
        <div>
          <h2 className="text-base font-bold text-brand-text">Study Vault</h2>
          <p className="text-xs text-brand-text-muted mt-0.5">
            {totalCount} resource{totalCount !== 1 ? 's' : ''} across {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-text-muted/80">📚 Your Batch</span>
      </div>

      {/* Subject folder grid */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {subjects.map((subj) => {
          const chapters = Object.keys(grouped[subj]).sort()
          const fileCount = Object.values(grouped[subj]).flat().length
          const isOpen = !!openSubjects[subj]

          return (
            <div key={subj} className={`w-full rounded-2xl border border-brand-border bg-brand-surface shadow-sm overflow-hidden transition-all duration-300 ${
              isOpen ? 'border-brand-border shadow-sm' : 'border-brand-border hover:border-gray-200 hover:shadow-md'
            }`}>
              {/* Subject header card */}
              <button
                type="button"
                onClick={() => toggleSubject(subj)}
                className="w-full flex items-center gap-3 px-4 py-4 text-left group"
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 transition-colors ${
                  isOpen ? 'bg-brand-primary/10' : 'bg-gray-100 group-hover:bg-brand-primary/10'
                }`}>
                  {subjectIcon(subj)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate transition-colors ${
                    isOpen ? 'text-brand-primary' : 'text-brand-text'
                  }`}>{subj}</p>
                  <p className="text-[10px] text-brand-text-muted/80 mt-0.5">
                    {chapters.length} chapter{chapters.length !== 1 ? 's' : ''} · {fileCount} file{fileCount !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Chevron */}
                <svg
                  className={`w-4 h-4 text-brand-text-muted/80 shrink-0 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-blue-500' : ''
                  }`}
                  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Chapters list — revealed when subject is open */}
              {isOpen && (
                <div className="border-t border-brand-border/40 bg-brand-surface-tint/70 divide-y divide-brand-border">
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
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-brand-surface-tint transition-colors"
                        >
                          <span className="text-sm">{isChapOpen ? '📂' : '📁'}</span>
                          <span className="flex-1 text-xs font-bold text-brand-text truncate">{chap}</span>
                          <span className="shrink-0 rounded-full bg-brand-primary/10 text-brand-primary text-[9px] font-bold px-1.5 py-0.5">
                            {files.length}
                          </span>
                          <svg
                            className={`w-3.5 h-3.5 text-brand-text-muted/80 shrink-0 transition-transform duration-200 ${
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
                                  className="w-full rounded-2xl border border-brand-border bg-brand-surface p-3 flex items-start gap-3 hover:border-brand-border hover:shadow-sm transition-all"
                                >
                                  <span className="text-lg mt-0.5 shrink-0">{typeCfg.icon}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-brand-text leading-snug line-clamp-2">
                                      {file.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ring-1 ${typeCfg.badge}`}>
                                        {file.materialType}
                                      </span>
                                      <span className="text-[10px] text-brand-text-muted/80">{formatDate(file.createdAt)}</span>
                                    </div>
                                    {file.description && (
                                      <p className="text-[10px] text-brand-text-muted mt-1 line-clamp-1">{file.description}</p>
                                    )}
                                  </div>
                                  <a
                                    href={file.fileUrlOrLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="shrink-0 rounded-lg bg-brand-accent px-2.5 py-1.5 text-[10px] font-bold text-white dark:text-brand-bg hover:bg-brand-accent-hover transition-colors whitespace-nowrap shadow-sm"
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
    <div className="w-full flex flex-col rounded-xl border border-brand-border bg-brand-surface-tint p-3.5 shadow-sm hover:shadow-md hover:border-brand-border/60 transition-all">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ring-1 ${typeConfig.badge}`}>
          {item.materialType}
        </span>
        <span className="text-[10px] text-brand-text-muted/80">{formatDate(item.createdAt)}</span>
      </div>
      <h3 className="text-sm font-semibold text-brand-text mb-1 leading-snug">{item.title}</h3>
      <div className="flex flex-wrap gap-1.5 mb-2">
        <span className="rounded-md bg-brand-surface border border-brand-border px-2 py-0.5 text-[10px] font-semibold text-brand-text-muted">{item.subject}</span>
        {item.chapter && (
          <span className="rounded-md bg-brand-accent/10 border border-brand-accent/20 px-2 py-0.5 text-[10px] font-semibold text-brand-accent">{item.chapter}</span>
        )}
      </div>
      {item.description && (
        <p className="text-[11px] text-brand-text-muted leading-relaxed line-clamp-2 mb-3 flex-1">{item.description}</p>
      )}
      <a
        href={item.fileUrlOrLink}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto block text-center rounded-lg bg-brand-accent px-3 py-1.5 text-[11px] font-bold text-white dark:text-brand-bg hover:bg-brand-accent-hover transition-colors shadow-sm"
      >
        Open Resource ↗
      </a>
    </div>
  )
}

// ─── Payment History Table ────────────────────────────────────────────────────

function PaymentHistoryTable({ history }) {
  return (
    <section className="w-full rounded-2xl border border-brand-border bg-brand-surface shadow-sm p-6">
      <div className="border-b border-brand-border pb-3 mb-4">
        <h2 className="text-sm font-semibold text-brand-text">Payment History</h2>
        <p className="text-xs text-brand-text-muted mt-0.5">{history.length} transaction{history.length !== 1 ? 's' : ''} recorded</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead>
            <tr className="border-b border-brand-border bg-brand-surface-tint/50">
              <th className="px-4 py-2.5 font-semibold text-brand-text-muted">Date</th>
              <th className="px-4 py-2.5 font-semibold text-brand-text-muted">Amount</th>
              <th className="px-4 py-2.5 font-semibold text-brand-text-muted">Mode</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {history.map((entry) => (
              <tr key={entry._id} className="hover:bg-brand-surface-tint/60 transition-colors">
                <td className="px-4 py-2.5 text-brand-text-muted whitespace-nowrap">
                  {new Intl.DateTimeFormat('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  }).format(new Date(entry.paidAt))}
                </td>
                <td className="px-4 py-2.5 font-bold text-emerald-700 dark:text-emerald-400">
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(entry.amount)}
                </td>
                <td className="px-4 py-2.5 text-brand-text">{entry.method || '—'}</td>
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
      <div className="rounded-xl border border-dashed border-brand-border bg-brand-surface py-16 text-center">
        <p className="text-4xl mb-3">📝</p>
        <p className="text-sm font-semibold text-brand-text">No practice tests yet</p>
        <p className="text-xs text-brand-text-muted/80 mt-1">Your teacher hasn't uploaded any practice tests.<br />Check back later!</p>
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
    <section className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-brand-border pb-3">
        <div>
          <h2 className="text-base font-bold text-brand-text">Practice Tests</h2>
          <p className="text-xs text-brand-text-muted mt-0.5">
            {totalCount} test{totalCount !== 1 ? 's' : ''} across {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-text-muted/80">📝 Practice Zone</span>
      </div>

      {/* Subject folder grid */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {subjects.map((subj) => {
          const chapters = Object.keys(grouped[subj]).sort()
          const fileCount = Object.values(grouped[subj]).flat().length
          const isOpen = !!openSubjects[subj]

          return (
            <div key={subj} className={`w-full rounded-2xl border border-brand-border bg-brand-surface shadow-sm overflow-hidden transition-all duration-300 ${
              isOpen ? 'border-brand-border shadow-sm' : 'border-brand-border hover:border-gray-200 hover:shadow-md'
            }`}>
              {/* Subject header card */}
              <button
                type="button"
                onClick={() => toggleSubject(subj)}
                className="w-full flex items-center gap-3 px-4 py-4 text-left group"
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 transition-colors ${
                  isOpen ? 'bg-brand-primary/10' : 'bg-gray-100 group-hover:bg-brand-primary/10'
                }`}>
                  {subjectIcon(subj)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate transition-colors ${
                    isOpen ? 'text-brand-primary' : 'text-brand-text'
                  }`}>{subj}</p>
                  <p className="text-[10px] text-brand-text-muted/80 mt-0.5">
                    {chapters.length} chapter{chapters.length !== 1 ? 's' : ''} · {fileCount} test{fileCount !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Chevron */}
                <svg
                  className={`w-4 h-4 text-brand-text-muted/80 shrink-0 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-blue-500' : ''
                  }`}
                  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Chapters list — revealed when subject is open */}
              {isOpen && (
                <div className="border-t border-brand-border/40 bg-brand-surface-tint/70 divide-y divide-brand-border">
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
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-brand-surface-tint transition-colors"
                        >
                          <span className="text-sm">{isChapOpen ? '📂' : '📁'}</span>
                          <span className="flex-1 text-xs font-semibold text-brand-text truncate">{chap}</span>
                          <span className="shrink-0 rounded-full bg-brand-accent/10 text-brand-accent text-[9px] font-bold px-1.5 py-0.5">
                            {files.length}
                          </span>
                          <svg
                            className={`w-3.5 h-3.5 text-brand-text-muted/80 shrink-0 transition-transform duration-200 ${
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
                                  className="w-full rounded-2xl border border-brand-border bg-brand-surface p-3 flex items-start gap-3 hover:border-brand-border hover:shadow-sm transition-all"
                                >
                                  <span className="text-lg mt-0.5 shrink-0">📝</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-brand-text leading-snug line-clamp-2">
                                      {file.testTitle}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                      {file.totalQuestions && (
                                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide bg-brand-accent/10 text-brand-accent ring-1 ring-brand-accent/25">
                                          {file.totalQuestions} Questions
                                        </span>
                                      )}
                                      <span className="text-[10px] text-brand-text-muted/80">{formatDate(file.createdAt)}</span>
                                    </div>
                                  </div>
                                  <a
                                    href={file.documentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="shrink-0 rounded-lg bg-brand-accent px-2.5 py-1.5 text-[10px] font-bold text-white dark:text-brand-bg hover:bg-brand-accent-hover transition-colors whitespace-nowrap shadow-sm"
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

