import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { clearToken, clearRole } from '../lib/auth'
import SettingsModal from '../components/shared/SettingsModal'
import { useTheme } from '../context/ThemeContext'
import {
  LayoutDashboard,
  CalendarCheck,
  BookOpen,
  ClipboardList,
  IndianRupee,
  Settings,
  LogOut,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Sparkles,
  Clock,
} from 'lucide-react'


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
    label: 'Paid',
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
  { id: 'overview',    label: 'Overview',       Icon: LayoutDashboard },
  { id: 'attendance',  label: 'Attendance',     Icon: CalendarCheck },
  { id: 'materials',   label: 'Materials',      Icon: BookOpen },
  { id: 'tests',       label: 'Practice Tests', Icon: ClipboardList },
  { id: 'payments',    label: 'Payments',       Icon: IndianRupee },
]

// ─── Remark generator ─────────────────────────────────────────────────────────

function getStudentRemark(student, attnData, exams) {
  const attendance = attnData?.summary?.attendancePercentage
  if (attendance !== undefined && attendance >= 90) {
    return 'Outstanding dedication! Your exceptional attendance reflects true discipline and focus.'
  }
  if (attendance !== undefined && attendance >= 75) {
    return 'Great consistency! Keep up the steady effort and active engagement in your classes.'
  }
  if (exams && exams.length > 0) {
    const validScores = exams.filter((e) => !e.isAbsent && e.totalMarks > 0)
    if (validScores.length > 0) {
      const avg = validScores.reduce((sum, e) => sum + (e.marksObtained / e.totalMarks), 0) / validScores.length
      if (avg >= 0.75) {
        return 'Commendable test performance! Continue sharpening your concepts and aiming high.'
      }
    }
  }
  return 'Every effort counts! Stay curious, practice consistently, and strive for excellence every single day.'
}

function formatSubjects(subjects) {
  if (!subjects || !subjects.trim()) return 'Not Specified'
  return subjects
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(', ')
}

// ─── Welcome Banner (Black Box) ───────────────────────────────────────────────

function StudentWelcomeBanner({ student, attnData, exams }) {
  const remark = getStudentRemark(student, attnData, exams)

  return (
    <div className="md:col-span-2 rounded-2xl bg-[#141824] dark:bg-[#0c1017] border border-slate-800/80 p-6 text-white shadow-sm flex flex-col justify-between relative overflow-hidden group">
      {/* Subtle background ambient glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 bg-brand-primary/20 rounded-full blur-3xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Welcome back
          </p>
          {student?.rollNo && (
            <span className="font-mono text-xs font-bold bg-white/10 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-300/30">
              Roll No: {student.rollNo}
            </span>
          )}
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
          {student?.fullName || 'Student'}
        </h2>

        {/* Student details chips: Subject opted & Batch timing */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
            <BookOpen size={16} className="text-sky-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Subject Opted</span>
              <span className="font-semibold text-slate-100 truncate block">
                {formatSubjects(student?.subjects)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
            <Clock size={16} className="text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Batch Timing</span>
              <span className="font-semibold text-slate-100 truncate block">
                {student?.batchTiming
                  ? `${student.batchTiming} (${student?.batch || 'Batch'})`
                  : (student?.batch ? `${student.batch} · Regular Hours` : 'Regular Hours')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Remark Box */}
      <div className="mt-5 pt-3.5 border-t border-slate-800/90 flex items-start gap-2.5">
        <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5 animate-pulse" />
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
            Academic Remark
          </span>
          <p className="text-xs text-slate-200 mt-0.5 italic leading-relaxed">
            "{remark}"
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Top Fee & Due Summary Card ───────────────────────────────────────────────

function StudentFeeDueCard({ fee, onViewLedger }) {
  const currentMonthYear = new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  const statusConfig = FEE_STATUS_CONFIG[fee?.feeStatus] || FEE_STATUS_CONFIG.PENDING

  return (
    <div className="rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-accent">
            Fee &amp; Due
          </p>
          <h3 className="text-sm font-semibold text-brand-text">
            {fee?.feePendingForMonth || currentMonthYear}
          </h3>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ${statusConfig.pill}`}>
          {statusConfig.icon}
          {statusConfig.label}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-2xl sm:text-3xl font-extrabold text-brand-text tracking-tight">
          {formatCurrency(fee?.amountDue ?? 0)}
        </p>
        <p className="text-xs text-brand-text-muted mt-0.5">
          Calculated Due for {fee?.feePendingForMonth || currentMonthYear}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-brand-border/60 text-xs space-y-1.5">
        <div className="flex justify-between items-center text-brand-text-muted">
          <span>Paid so far:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(fee?.amountPaid ?? 0)}
          </span>
        </div>
        <div className="flex justify-between items-center text-brand-text-muted">
          <span>Total Course Fee:</span>
          <span className="font-semibold text-brand-text">
            {formatCurrency(fee?.totalCourseFee ?? 0)}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onViewLedger}
        className="mt-4 w-full rounded-xl border border-brand-border bg-brand-surface-tint hover:bg-brand-surface py-2.5 px-3 text-xs font-bold text-brand-text flex items-center justify-center gap-2 hover:border-brand-primary/40 transition-all cursor-pointer shadow-xs"
      >
        <span>View Full Fee &amp; Payment Ledger →</span>
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab]   = useState('overview')
  const [dashData, setDashData]     = useState(null)
  const [attnData, setAttnData]     = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const { theme, setTheme, isDark } = useTheme()

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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [activeTab])

  const student   = dashData?.student
  const fee       = dashData?.fee
  const materials = dashData?.materials ?? []
  const tests     = dashData?.tests ?? []

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden transition-colors duration-300">
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      
      {/* ── Desktop Sidebar (hidden on mobile) ─────────────────────────────── */}
      <aside className="hidden lg:flex sticky top-0 inset-y-0 left-0 z-30 w-60 h-screen flex-col shrink-0 border-r border-brand-border bg-brand-primary text-brand-surface transition-transform duration-300">
        <div className="px-6 py-6 border-b border-brand-border/20 flex items-center gap-3 shrink-0">
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
            const Icon = item.Icon
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
                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} aria-hidden />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-brand-border/20 space-y-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="w-full rounded-xl px-4 py-3 text-xs font-semibold text-brand-surface/80 hover:bg-brand-surface/10 hover:text-brand-surface transition-all duration-200 text-left flex items-center gap-3"
          >
            <Settings size={16} strokeWidth={2} aria-hidden />
            Settings
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-xl px-4 py-3 text-xs font-semibold text-brand-surface/80 hover:bg-brand-surface/10 hover:text-brand-surface transition-all duration-200 text-left flex items-center gap-3"
          >
            <LogOut size={16} strokeWidth={2} aria-hidden />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 lg:h-screen lg:overflow-hidden">
        {/* Top Header (visible on all screens) */}
        <header className="sticky top-0 z-20 bg-brand-surface border-b border-brand-border px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-4 shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm overflow-hidden shrink-0">
              <img src="/logo.png" alt="Logo" className="h-full w-full object-contain p-0.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-semibold text-brand-text truncate">
                  Student Portal
                </h2>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-xs font-semibold text-brand-text-muted">
            {student?.batch && (
              <span className="hidden sm:inline-flex items-center rounded-full bg-brand-surface-tint px-2.5 py-0.5 text-[10px] font-bold text-brand-text border border-brand-border">
                {student.batch}
              </span>
            )}
            
            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="p-2 rounded-xl bg-brand-surface-tint hover:bg-brand-surface border border-brand-border text-brand-text-muted hover:text-brand-text transition-colors cursor-pointer text-xs font-semibold"
              title="Toggle Theme"
            >
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </button>

            <span className="hidden sm:inline-flex rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-2.5 py-1 text-[10px] uppercase font-bold tracking-wide">
              Live
            </span>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-xl bg-brand-surface-tint border border-brand-border text-brand-text-muted hover:text-brand-text hover:bg-brand-surface transition-colors cursor-pointer"
              title="Settings"
            >
              <Settings size={16} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="lg:hidden p-2 rounded-xl bg-brand-surface-tint border border-brand-border text-brand-text-muted hover:text-rose-500 hover:border-rose-500/30 transition-colors cursor-pointer"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={16} strokeWidth={2} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-32 lg:pb-8 lg:overflow-y-auto">
          {/* Top-Left Logo Card in Dashboard body canvas */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6 shadow-sm max-w-sm transition-all duration-300 hover:scale-[1.01]">
            <img src="/logo.png" alt="Lakshya Logo" className="h-9 sm:h-10 w-auto object-contain shrink-0" />
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-brand-primary leading-tight">
                Lakshya Academic Institute
              </h1>
              <p className="text-[9px] text-brand-text-muted uppercase tracking-widest font-bold mt-0.5">
                Student Portal
              </p>
            </div>
          </div>

          <div className="mx-auto max-w-5xl flex flex-col gap-6">
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
                {/* ── Top Hero: Black Box Welcome Banner & Fee Due Card ── */}
                <div className="grid gap-6 md:grid-cols-3">
                  <StudentWelcomeBanner
                    student={student}
                    attnData={attnData}
                    exams={dashData?.instituteExams || []}
                  />
                  <StudentFeeDueCard
                    fee={fee}
                    onViewLedger={() => setActiveTab('payments')}
                  />
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

                {/* ── MY PROGRESS (Comparing last 2 test marks + compliment) ── */}
                <MyProgressCard exams={dashData?.instituteExams || []} />

                {/* ── PRACTICE TESTS BLOCK (Below My Progress) ── */}
                <PracticeTestsPreviewBlock tests={tests} onViewAll={() => setActiveTab('tests')} />

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
      <nav className="lg:hidden fixed bottom-3 sm:bottom-5 left-3 sm:left-6 right-3 sm:right-6 z-50 bg-brand-primary text-brand-surface rounded-2xl sm:rounded-[2rem] px-2 sm:px-3 py-1.5 sm:py-2 flex justify-around items-center shadow-2xl border border-brand-border/20 backdrop-blur-xl">
        {TABS.map((item) => {
          const isActive = activeTab === item.id
          const Icon = item.Icon

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex-1 flex flex-col items-center justify-center py-1 sm:py-1.5 px-1 rounded-xl transition-all duration-200 min-w-0 ${
                isActive ? 'bg-brand-surface/15 text-brand-gold font-bold scale-[1.03]' : 'text-brand-surface/60 hover:text-brand-surface'
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
              <span className={`text-[9px] sm:text-[10px] truncate mt-0.5 sm:mt-1 leading-tight ${isActive ? 'text-brand-gold font-bold' : 'text-brand-surface/70'}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

// ─── My Progress Component (Comparing last 2 test marks + Compliments) ───────

function getTestProgressCompliment(latest, previous) {
  if (!latest) {
    return {
      title: 'Ready for Your Next Challenge! 🚀',
      message:
        'No test records found yet. Once your teacher enters marks for your institute tests, your performance comparison and personalized feedback will appear right here!',
      type: 'neutral',
      color: 'text-brand-text',
      bg: 'bg-brand-surface-tint border-brand-border',
      badge: 'Getting Started',
    }
  }

  const latestScore = latest.marksObtained
  const latestTotal = latest.totalMarks || 100
  const latestPct =
    latest.isAbsent || latestScore === null
      ? null
      : Math.round((Number(latestScore) / latestTotal) * 100)

  if (!previous) {
    if (latest.isAbsent) {
      return {
        title: 'Recent Test Missed 📋',
        message: `You were marked absent for "${latest.testName}". Be sure to ask your teacher for the test paper to practice at home!`,
        type: 'warning',
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40',
        badge: 'Absent',
      }
    }
    if (latestPct >= 85) {
      return {
        title: 'Spectacular Debut! 🌟🏆',
        message: `Outstanding score of ${latestPct}% (${latestScore}/${latestTotal}) on "${latest.testName}"! You have set a fantastic standard for yourself. Keep up this magnificent dedication!`,
        type: 'praise',
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40',
        badge: 'Top Tier',
      }
    }
    if (latestPct >= 60) {
      return {
        title: 'Solid Foundation! 👏✨',
        message: `Great effort with ${latestPct}% (${latestScore}/${latestTotal}) on "${latest.testName}". Regular practice on tricky questions will elevate your next score even higher!`,
        type: 'praise',
        color: 'text-brand-primary',
        bg: 'bg-brand-primary/10 border-brand-primary/20',
        badge: 'Good Start',
      }
    }
    return {
      title: 'Step One Completed! 💪🌱',
      message: `Scored ${latestPct}% (${latestScore}/${latestTotal}) on "${latest.testName}". Review the questions you missed, clear any doubts with your teacher, and aim higher on the next test!`,
      type: 'encouraging',
      color: 'text-brand-primary',
      bg: 'bg-brand-surface-tint border-brand-border',
      badge: 'Keep Pushing',
    }
  }

  // Both tests exist
  if (latest.isAbsent) {
    return {
      title: 'Absent in Latest Test 📋',
      message: `You missed the latest test ("${latest.testName}"). Don't forget to practice the test questions so you don't miss any critical topics!`,
      type: 'warning',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40',
      badge: 'Absent',
    }
  }

  if (previous.isAbsent) {
    return {
      title: 'Welcome Back to the Arena! 🎯🔥',
      message: `Splendid comeback after missing the earlier test! You scored ${latestPct}% (${latestScore}/${latestTotal}) on "${latest.testName}". Keep this consistency going!`,
      type: 'praise',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40',
      badge: 'Comeback',
    }
  }

  const prevScore = previous.marksObtained
  const prevTotal = previous.totalMarks || 100
  const prevPct = Math.round((Number(prevScore) / prevTotal) * 100)
  const diff = latestPct - prevPct

  if (diff > 15) {
    return {
      title: 'Tremendous Leap Forward! 🚀🔥',
      message: `Incredible improvement! You jumped by an impressive +${diff}% (rising from ${prevPct}% in "${previous.testName}" to ${latestPct}% in "${latest.testName}"). Your hard work and focused revision are visibly paying off!`,
      type: 'praise',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800',
      badge: `+${diff}% Surge`,
      diff,
    }
  }

  if (diff > 5) {
    return {
      title: 'Great Upward Growth! 📈✨',
      message: `Splendid work! You gained +${diff}% (moving from ${prevPct}% in "${previous.testName}" to ${latestPct}% in "${latest.testName}"). Consistency and smart revision are driving you forward!`,
      type: 'praise',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40',
      badge: `+${diff}% Gain`,
      diff,
    }
  }

  if (diff > 0) {
    return {
      title: 'Steady Positive Progress! 👍🌱',
      message: `Encouraging momentum! You scored +${diff}% higher than your previous test (from ${prevPct}% in "${previous.testName}" to ${latestPct}% in "${latest.testName}"). Keep up this positive cadence—every step counts!`,
      type: 'encouraging',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40',
      badge: `+${diff}% Up`,
      diff,
    }
  }

  if (diff === 0) {
    if (latestPct >= 80) {
      return {
        title: 'Rock-Solid Consistency! 🏆🛡️',
        message: `Maintained a stellar ${latestPct}% across both tests ("${previous.testName}" and "${latest.testName}")! This high level of accuracy reflects deep understanding!`,
        type: 'praise',
        color: 'text-brand-primary',
        bg: 'bg-brand-primary/10 border-brand-primary/20',
        badge: 'Maintained Score',
        diff: 0,
      }
    }
    return {
      title: 'Holding Steady Ground! 🎯',
      message: `Maintained ${latestPct}% across your last two tests. Pick 2–3 questions you felt unsure about during revision to push this score higher on your next practice test!`,
      type: 'encouraging',
      color: 'text-brand-primary',
      bg: 'bg-brand-surface-tint border-brand-border',
      badge: 'Consistent',
      diff: 0,
    }
  }

  // diff < 0
  if (latestPct >= 75) {
    return {
      title: 'Strong High Standard! ⭐',
      message: `Even with a minor variation of ${Math.abs(diff)}% (from ${prevPct}% in "${previous.testName}" to ${latestPct}% in "${latest.testName}"), you are holding a commendable high standard. A quick review of tricky errors will put you right back at your peak!`,
      type: 'neutral',
      color: 'text-brand-primary',
      bg: 'bg-brand-surface-tint border-brand-border',
      badge: `-${Math.abs(diff)}% Variation`,
      diff,
    }
  }

  return {
    title: 'Bounce Back Stronger! 🛡️💪',
    message: `Your score dipped by ${Math.abs(diff)}% (from ${prevPct}% in "${previous.testName}" to ${latestPct}% in "${latest.testName}"). Don't be discouraged—every test is a stepping stone. Pinpoint where marks were lost, consult your teacher, and conquer the next test!`,
    type: 'supportive',
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50/80 dark:bg-amber-950/25 border-amber-200 dark:border-amber-900/40',
    badge: `-${Math.abs(diff)}% Dip`,
    diff,
  }
}

function MyProgressCard({ exams = [] }) {
  const latest = exams[0] || null
  const previous = exams[1] || null

  const compliment = getTestProgressCompliment(latest, previous)

  const latestPct =
    latest && !latest.isAbsent && latest.marksObtained !== null
      ? Math.round((Number(latest.marksObtained) / (latest.totalMarks || 100)) * 100)
      : null

  const prevPct =
    previous && !previous.isAbsent && previous.marksObtained !== null
      ? Math.round((Number(previous.marksObtained) / (previous.totalMarks || 100)) * 100)
      : null

  const diff =
    latestPct !== null && prevPct !== null ? latestPct - prevPct : null

  return (
    <section className="w-full rounded-2xl border border-brand-border bg-brand-surface p-5 sm:p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-brand-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-brand-primary/10 text-brand-primary font-bold">
              <Trophy size={18} />
            </span>
            <h2 className="text-base font-extrabold text-brand-text tracking-tight">
              My Progress
            </h2>
          </div>
          <p className="text-xs text-brand-text-muted mt-0.5">
            Test score comparison and personalized teacher compliment based on your last 2 tests
          </p>
        </div>

        {diff !== null && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            {diff > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-600 px-3.5 py-1 text-sm font-extrabold border border-emerald-500/20">
                <TrendingUp size={16} />
                +{diff}% Improvement
              </span>
            ) : diff < 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 text-amber-600 px-3.5 py-1 text-sm font-extrabold border border-amber-500/20">
                <TrendingDown size={16} />
                {diff}% Change
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 text-brand-primary px-3.5 py-1 text-sm font-extrabold border border-brand-primary/20">
                <Minus size={16} />
                Consistent (0%)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tests Comparison Grid */}
      {!latest ? (
        <div className="rounded-xl border border-dashed border-brand-border bg-brand-surface-tint p-6 text-center">
          <Sparkles size={28} className="mx-auto text-brand-text-muted/50 mb-2" />
          <p className="text-xs font-bold text-brand-text">No Institute Tests Recorded Yet</p>
          <p className="text-[11px] text-brand-text-muted mt-0.5">
            When your teacher conducts tests and enters your scores, your last 2 test marks comparison and compliments will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr] items-center">
            {/* Latest Test Card (Placed First) */}
            <div className="rounded-2xl border-2 border-brand-primary/40 bg-brand-primary/5 p-4 sm:p-5 space-y-2.5 shadow-xs transition-all">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-brand-primary">
                  <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                  Your Score in Latest Test
                </span>
                <span className="text-[11px] font-semibold text-brand-text-muted">
                  {latest.examDate ? formatDate(latest.examDate) : '—'}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-brand-text truncate">
                  {latest.testName}
                </h4>
                <p className="text-sm font-semibold text-brand-text-muted capitalize mt-0.5">
                  {latest.subject || 'All Subjects'}
                </p>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-2xl sm:text-3xl font-black text-brand-primary tracking-tight">
                  {latest.isAbsent ? (
                    <span className="text-red-500 text-sm font-bold">Absent</span>
                  ) : (
                    <>
                      {latest.marksObtained}
                      <span className="text-sm text-brand-text-muted font-bold"> / {latest.totalMarks}</span>
                    </>
                  )}
                </span>
                {latestPct !== null && (
                  <span
                    className={`text-base sm:text-lg font-black px-3.5 py-1 rounded-xl border shadow-xs ${
                      latestPct >= 75
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : latestPct >= 33
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {latestPct}%
                  </span>
                )}
              </div>
            </div>

            {/* Comparison Bridge / Arrow */}
            <div className="hidden lg:flex flex-col items-center justify-center px-2">
              <div className="w-9 h-9 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center text-brand-text-muted shadow-xs">
                {diff !== null && diff > 0 ? (
                  <TrendingUp size={18} className="text-emerald-500" />
                ) : diff !== null && diff < 0 ? (
                  <TrendingDown size={18} className="text-amber-500" />
                ) : (
                  <Sparkles size={18} className="text-brand-primary" />
                )}
              </div>
              <span className="text-[9px] font-bold text-brand-text-muted mt-1 uppercase tracking-wider">
                Trend
              </span>
            </div>

            {/* Previous Test Card (Placed After) */}
            {previous ? (
              <div className="rounded-2xl border border-brand-border bg-brand-surface-tint/60 p-4 sm:p-5 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                    Previous Test
                  </span>
                  <span className="text-[11px] text-brand-text-muted">
                    {previous.examDate ? formatDate(previous.examDate) : '—'}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-brand-text truncate">
                    {previous.testName}
                  </h4>
                  <p className="text-sm font-semibold text-brand-text-muted capitalize mt-0.5">
                    {previous.subject || 'All Subjects'}
                  </p>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-xl sm:text-2xl font-extrabold text-brand-text">
                    {previous.isAbsent ? (
                      <span className="text-red-500 text-xs font-bold">Absent</span>
                    ) : (
                      <>
                        {previous.marksObtained}
                        <span className="text-xs text-brand-text-muted font-normal"> / {previous.totalMarks}</span>
                      </>
                    )}
                  </span>
                  {prevPct !== null && (
                    <span className="text-sm font-bold text-brand-text-muted bg-brand-surface px-3 py-1 rounded-lg border border-brand-border shadow-2xs">
                      {prevPct}%
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-brand-border bg-brand-surface-tint/40 p-4 sm:p-5 flex flex-col items-center justify-center text-center h-full min-h-[120px]">
                <p className="text-xs font-semibold text-brand-text-muted">Previous Test</p>
                <p className="text-[11px] text-brand-text-muted/70 mt-0.5">Only 1 test recorded so far</p>
              </div>
            )}
          </div>

          {/* Compliment / Feedback Banner */}
          <div className={`rounded-xl border p-4 sm:p-5 transition-all shadow-xs ${compliment.bg}`}>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-brand-surface shadow-xs border border-brand-border shrink-0 text-brand-gold">
                <Award size={22} />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className={`text-sm sm:text-base font-extrabold ${compliment.color}`}>
                    {compliment.title}
                  </h4>
                  {compliment.badge && (
                    <span className="rounded-full bg-brand-surface text-brand-text text-[11px] font-extrabold px-2.5 py-0.5 border border-brand-border shadow-xs">
                      {compliment.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-brand-text font-medium">
                  {compliment.message}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

// ─── Practice Tests Preview Block (Overview tab - Below My Progress) ──────────

function PracticeTestsPreviewBlock({ tests, onViewAll }) {
  return (
    <section className="bg-brand-surface rounded-2xl border border-brand-border shadow-sm p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-brand-border pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-xl bg-brand-primary/10 text-brand-primary font-bold">
            <ClipboardList size={18} />
          </span>
          <div>
            <h2 className="text-base font-extrabold text-brand-text tracking-tight">Practice Tests</h2>
            <p className="text-xs text-brand-text-muted mt-0.5">Test papers and assignments uploaded for your batch</p>
          </div>
        </div>
        {tests && tests.length > 0 && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-semibold text-brand-primary hover:underline cursor-pointer"
          >
            View all ({tests.length}) →
          </button>
        )}
      </div>

      {tests && tests.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {tests.slice(0, 2).map((test) => (
            <div
              key={test._id}
              className="w-full flex flex-col justify-between rounded-xl border border-brand-border bg-brand-surface-tint p-4 shadow-sm hover:shadow-md hover:border-brand-border/80 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="rounded-md bg-brand-surface border border-brand-border px-2 py-0.5 text-[10px] font-bold text-brand-primary">
                      {test.subject || 'General'}
                    </span>
                    {test.chapter && (
                      <span className="rounded-md bg-brand-accent/10 border border-brand-accent/20 px-2 py-0.5 text-[10px] font-semibold text-brand-accent">
                        {test.chapter}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-brand-text-muted/80">{formatDate(test.createdAt)}</span>
                </div>

                <h3 className="text-sm font-bold text-brand-text leading-snug line-clamp-2">
                  {test.testTitle}
                </h3>

                {test.totalQuestions && (
                  <p className="text-[11px] text-brand-text-muted mt-1.5 flex items-center gap-1">
                    <span className="font-semibold text-brand-text">{test.totalQuestions}</span> Questions
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-brand-border/60 flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold text-brand-text-muted uppercase tracking-wider">
                  Practice Paper
                </span>
                <a
                  href={test.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-brand-accent px-3 py-1.5 text-[11px] font-bold text-white dark:text-brand-bg hover:bg-brand-accent-hover transition-colors shadow-sm inline-flex items-center gap-1.5"
                >
                  <span>Open Test</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-brand-border bg-brand-surface-tint p-6 text-center">
          <ClipboardList size={28} className="mx-auto text-brand-text-muted/50 mb-2" />
          <p className="text-xs font-bold text-brand-text">No Practice Tests Uploaded Yet</p>
          <p className="text-[11px] text-brand-text-muted mt-0.5">
            When your teachers post practice tests and papers for your batch, they will appear right here.
          </p>
        </div>
      )}
    </section>
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <FeeMetric label="Monthly Fee" value={formatCurrency(fee.monthlyFeeAmount || fee.totalCourseFee)} />
        <FeeMetric label="Amount to be Paid" value={formatCurrency(fee.amountDue)} accent={fee.amountDue > 0 ? 'amber' : 'emerald'} />
        <FeeMetric label="Fee Pending for Month" value={fee.feePendingForMonth || 'None'} />
        <FeeMetric
          label="Payment Time"
          value={
            fee.paymentTiming === 'advance'
              ? 'In Advance'
              : fee.paymentTiming === 'after_month'
              ? 'End of Month'
              : 'Not Set'
          }
        />
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

