import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { clearToken, clearRole } from '../lib/auth'
import AttendanceManager from '../components/shared/AttendanceManager'
import StudentFilterBar from '../components/shared/StudentFilterBar'
import SettingsModal from '../components/shared/SettingsModal'
import ExamMarks from '../components/shared/ExamMarks'
import { useTheme } from '../context/ThemeContext'
import {
  LayoutDashboard,
  Upload,
  Users,
  CalendarCheck,
  Settings,
  LogOut,
  Menu,
  X,
  Wallet,
  IndianRupee,
  ClipboardList,
} from 'lucide-react'

// ── Constants ────────────────────────────────────────────────────────────────
const MATERIAL_TYPES = ['Notes', 'Assignment', 'Lecture Link']
const SUBJECT_OPTIONS = [
  'Mathematics',
  'Science',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'History',
  'Geography',
  'Computer Science',
  'Other',
]

const emptyForm = {
  title: '',
  description: '',
  materialType: MATERIAL_TYPES[0],
  fileUrlOrLink: '',
  batch: '',
  subject: '',
  chapter: '',
}

// ── Badge helpers ─────────────────────────────────────────────────────────────
const TYPE_BADGE = {
  Notes: 'bg-brand-primary/10 text-brand-primary ring-brand-primary/20',
  Assignment: 'bg-brand-accent/10 text-brand-accent ring-brand-accent/20',
  'Lecture Link': 'bg-brand-gold/10 text-brand-gold ring-brand-gold/20',
}
const TYPE_ICON = { Notes: '📄', Assignment: '✏️', 'Lecture Link': '🎬' }

function typeBadge(type) {
  return TYPE_BADGE[type] ?? 'bg-brand-surface-tint text-brand-text-muted ring-brand-border'
}

// ── Nav items ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'overview',   label: 'My Dashboard',       Icon: LayoutDashboard },
  { id: 'salary',     label: 'Salary & Payments',  Icon: Wallet },
  { id: 'upload',     label: 'Upload Content',      Icon: Upload },
  { id: 'tests',      label: 'Tests & Marks',       Icon: ClipboardList },
  { id: 'students',   label: 'My Students',         Icon: Users },
  { id: 'attendance', label: 'Take Attendance',     Icon: CalendarCheck },
]

// ─────────────────────────────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [dashData, setDashData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // Lift a refresh key so upload success refreshes the materials panel
  const [refreshKey, setRefreshKey] = useState(0)
  const { theme, setTheme, isDark } = useTheme()

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/teacher/dashboard')
      if (data.success) {
        setDashData(data.data)
      } else {
        setError(data.message || 'Failed to load dashboard.')
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.request ? 'Unable to reach the server.' : 'Something went wrong.')
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard, refreshKey])

  function handleSignOut() {
    clearToken()
    clearRole()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [activeTab])

  const teacher = dashData?.teacher
  const activeItem = NAV_ITEMS.find((n) => n.id === activeTab)

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden transition-colors duration-300">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-brand-text/30 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={`fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] h-screen flex-col border-r border-brand-border bg-brand-primary text-brand-surface transform transition-transform duration-300 ease-in-out shrink-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-5 py-5 border-b border-brand-border/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white overflow-hidden shrink-0 shadow-sm">
              <img src="/logo.png" alt="Logo" className="h-full w-full object-contain p-1" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold leading-tight truncate">
                Lakshya Academy
              </p>
              <h1 className="text-xs font-semibold text-brand-surface/90 mt-0.5 truncate">Teacher Portal</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-xl hover:bg-brand-surface/10 text-brand-surface/70 hover:text-brand-surface transition-colors cursor-pointer"
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Teacher identity */}
        {teacher && (
          <div className="px-5 py-3 border-b border-brand-border/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-surface/20 text-brand-surface flex items-center justify-center text-xs font-bold shrink-0">
                {teacher.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-brand-surface truncate">{teacher.name}</p>
                <p className="text-[10px] text-brand-surface/60 truncate">{teacher.username}</p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id
            const Icon = item.Icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id)
                  setSidebarOpen(false)
                }}
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

        <div className="px-3 py-3 border-t border-brand-border/20 space-y-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setShowSettings(true)
              setSidebarOpen(false)
            }}
            className="w-full rounded-xl px-4 py-3 text-xs font-semibold text-brand-surface/80 hover:bg-brand-surface/10 hover:text-brand-surface transition-all duration-200 text-left flex items-center gap-3 cursor-pointer"
          >
            <Settings size={16} strokeWidth={2} aria-hidden />
            Settings
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-xl px-4 py-3 text-xs font-semibold text-brand-surface/80 hover:bg-brand-surface/10 hover:text-brand-surface transition-all duration-200 text-left flex items-center gap-3 cursor-pointer"
          >
            <LogOut size={16} strokeWidth={2} aria-hidden />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 lg:h-screen lg:overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-brand-surface border-b border-brand-border px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-4 shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              className="lg:hidden p-2 rounded-xl border border-brand-border bg-brand-surface-tint hover:bg-brand-surface text-brand-text transition-colors flex items-center justify-center cursor-pointer"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} strokeWidth={2} />
            </button>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-semibold text-brand-text truncate">
                {teacher ? `Hello ${teacher.name}` : 'Teacher Portal'}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-3 text-xs font-semibold text-brand-text-muted">
              <span className="rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-2.5 py-0.5 font-bold">
                Live
              </span>
              <span>{new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
            </div>
            
            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="p-2 rounded-xl bg-brand-surface-tint hover:bg-brand-surface border border-brand-border text-brand-text-muted hover:text-brand-text transition-colors cursor-pointer text-xs font-semibold"
              title="Toggle Theme"
            >
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="lg:hidden p-2 rounded-xl bg-brand-surface-tint hover:bg-brand-surface border border-brand-border text-brand-text-muted hover:text-rose-500 hover:border-rose-500/30 transition-colors cursor-pointer"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={16} strokeWidth={2} />
            </button>

            <img src="/logo.png" alt="Logo" className="lg:hidden h-8 w-8 object-contain shrink-0" />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 lg:overflow-y-auto">
          {/* Top-Left Logo Card in Dashboard body canvas */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 mb-5 sm:mb-8 shadow-sm max-w-sm transition-all duration-300 hover:scale-[1.01]">
            <img src="/logo.png" alt="Lakshya Logo" className="h-9 sm:h-10 w-auto object-contain shrink-0" />
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-brand-primary leading-tight">
                Lakshya Academic Institute
              </h1>
              <p className="text-[9px] text-brand-text-muted uppercase tracking-widest font-bold mt-0.5">
                Teacher Portal
              </p>
            </div>
          </div>

          <div className="animate-fadeIn">
          {loading && !dashData ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={loadDashboard} />
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewTab
                  teacher={teacher}
                  materials={dashData?.myMaterials ?? []}
                  tests={dashData?.myTests ?? []}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}
              {activeTab === 'salary' && (
                <SalaryTab teacher={teacher} />
              )}
              {activeTab === 'upload' && (
                <UploadTab
                  assignedBatches={teacher?.assignedBatches ?? []}
                  onSuccess={() => setRefreshKey((k) => k + 1)}
                />
              )}
              {activeTab === 'tests' && (
                <ExamMarks allowedBatches={teacher?.assignedBatches ?? []} />
              )}
              {activeTab === 'students' && (
                <StudentsTab students={dashData?.students ?? []} />
              )}
              {activeTab === 'attendance' && (
                <AttendanceManager allowedBatches={teacher?.assignedBatches ?? []} />
              )}
            </>
          )}
          </div>
        </main>
      </div>
    </div>
  )
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ teacher, materials, tests, onNavigateTab }) {
  const [salaryData, setSalaryData] = useState(null)
  const [salaryLoading, setSalaryLoading] = useState(true)
  const [salaryError, setSalaryError] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [showBreakdown, setShowBreakdown] = useState(false)

  const fetchSalary = useCallback(async (targetMonth) => {
    setSalaryLoading(true)
    setSalaryError('')
    try {
      const { data } = await api.get('/teacher/salary-overview', {
        params: targetMonth ? { month: targetMonth } : {},
      })
      if (data.success) {
        setSalaryData(data.data)
        if (data.data.selectedMonth) {
          setSelectedMonth(data.data.selectedMonth)
        }
      } else {
        setSalaryError(data.message || 'Failed to load salary.')
      }
    } catch (err) {
      setSalaryError(
        err.response?.data?.message || 'Unable to load salary data.'
      )
    } finally {
      setSalaryLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSalary()
  }, [fetchSalary])

  if (!teacher) return null

  const calcDetails = salaryData?.calculationDetails || {}
  const monthlyLedger = salaryData?.monthlyLedger || []
  const monthsList = salaryData?.monthsList || []

  return (
    <div className="space-y-6">
      {/* Top Banner and Earnings Card */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Welcome banner */}
        <div className="md:col-span-2 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-primary/80 p-6 text-brand-surface shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-surface/80">
              Welcome back
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight mt-1">{teacher.name}</h2>
          </div>
          <p className="text-xs text-brand-surface/90 mt-4 font-medium">
            You are managing{' '}
            <span className="font-extrabold text-brand-gold">{teacher.assignedBatches.length}</span> batch
            {teacher.assignedBatches.length !== 1 ? 'es' : ''}
          </p>
        </div>

        {/* Earnings Card */}
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-accent">
                Earnings &amp; Due
              </p>
              <h3 className="text-sm font-semibold text-brand-text">
                {salaryData?.selectedMonth || 'This Month'}
              </h3>
            </div>
            {monthsList.length > 1 && (
              <select
                value={selectedMonth || salaryData?.selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value)
                  fetchSalary(e.target.value)
                }}
                className="rounded-xl border border-brand-border bg-brand-surface-tint px-2.5 py-1 text-[11px] font-bold text-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer shadow-xs"
              >
                {monthsList.map((m) => (
                  <option key={m} value={m}>
                    {m} {m === salaryData?.currentMonth ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="mt-4">
            {salaryLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-7 w-28 bg-brand-surface-tint rounded-lg"></div>
                <div className="h-3 w-36 bg-brand-surface-tint rounded-lg"></div>
              </div>
            ) : salaryError ? (
              <div className="text-xs text-brand-accent">
                <p className="font-semibold">Failed to load salary</p>
                <p className="text-[10px] text-brand-text-muted mt-0.5">{salaryError}</p>
              </div>
            ) : salaryData ? (
              <div className="space-y-3">
                <div>
                  <p className="text-2xl font-extrabold text-brand-text tracking-tight">
                    ₹{salaryData.salary.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-brand-text-muted mt-0.5">
                    Calculated Salary for {salaryData.selectedMonth}
                  </p>
                </div>

                <div className="pt-2 border-t border-brand-border/60 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-brand-text-muted">Paid for {salaryData.selectedMonth}:</span>
                    <span className="font-bold text-emerald-600">
                      ₹{(salaryData.totalPaidThisMonth || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  {(salaryData.totalPaidThisMonth || 0) > 0 && (
                    <div className="flex items-center justify-between text-[10px] text-brand-text-muted">
                      <span>Breakdown:</span>
                      <span>
                        <strong className="text-amber-700">Advance: ₹{(salaryData.advancePaidThisMonth || 0).toLocaleString('en-IN')}</strong>
                        {' · '}
                        <strong className="text-emerald-700">In End: ₹{(salaryData.endPaidThisMonth || 0).toLocaleString('en-IN')}</strong>
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-brand-text-muted font-medium">Due for {salaryData.selectedMonth}:</span>
                    <span className={`font-bold ${salaryData.remainingThisMonth > 0 ? 'text-brand-accent' : 'text-brand-primary'}`}>
                      ₹{(salaryData.remainingThisMonth || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Accumulated Dues Callout */}
                {(salaryData.totalAccumulatedDue > salaryData.remainingThisMonth || salaryData.pastOverdueArrears > 0) && (
                  <div className="rounded-xl bg-red-50/90 border border-red-200 p-2.5 text-xs text-red-900 mt-2">
                    <div className="flex items-center justify-between font-bold">
                      <span>Total Outstanding Dues:</span>
                      <span className="text-sm font-extrabold text-red-700">
                        ₹{(salaryData.totalAccumulatedDue || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    {salaryData.pastOverdueArrears > 0 && (
                      <p className="text-[10px] text-red-600 font-medium mt-0.5">
                        ⚠️ Includes ₹{(salaryData.pastOverdueArrears || 0).toLocaleString('en-IN')} from {salaryData.unpaidMonthsCount - (salaryData.currentMonthDue > 0 ? 1 : 0)} past unpaid month(s)
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between gap-1.5 flex-wrap">
                  <span className="inline-flex items-center rounded-full bg-brand-primary/10 px-2 py-0.5 text-[9px] font-bold text-brand-primary ring-1 ring-brand-primary/20">
                    {salaryData.compensationType === 'fixed'
                      ? 'Fixed Salary'
                      : salaryData.compensationType === 'batch_based'
                      ? `Batch Calculation (${salaryData.salaryPercentage || 100}%)`
                      : `${salaryData.salaryPercentage}% Fee Split`}
                  </span>
                  {salaryData.compensationType !== 'fixed' && (calcDetails.batches?.length > 0 || calcDetails.students?.length > 0) && (
                    <button
                      type="button"
                      onClick={() => setShowBreakdown(!showBreakdown)}
                      className="text-[10px] font-bold text-brand-primary hover:underline cursor-pointer"
                    >
                      {showBreakdown ? 'Hide Breakdown' : `Breakdown (${calcDetails.batches?.length || 0} batches)`}
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateTab && onNavigateTab('salary')}
                  className="w-full mt-2.5 rounded-xl border border-brand-primary/20 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary py-2 text-xs font-bold transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <Wallet size={14} />
                  <span>View Full Salary &amp; Payment Ledger →</span>
                </button>
              </div>
            ) : (
              <p className="text-xs text-brand-text-muted">No salary configuration found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Overdue Salary Notification Banner */}
      {salaryData?.pastOverdueArrears > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-xs text-red-900 shadow-xs flex items-start gap-3 animate-fadeIn">
          <span className="text-xl shrink-0 mt-0.5">⚠️</span>
          <div className="flex-1">
            <h4 className="font-extrabold text-sm text-red-900">
              Unpaid Past Salary: ₹{salaryData.pastOverdueArrears.toLocaleString('en-IN')}
            </h4>
            <p className="text-red-700 mt-0.5 leading-relaxed">
              You have pending salary disbursements from past months ({salaryData.unpaidMonthsList?.filter((m) => m !== salaryData.currentMonth).join(', ')}). Your total accumulated amount to receive across all cycles is <strong className="text-red-950 font-bold">₹{salaryData.totalAccumulatedDue?.toLocaleString('en-IN')}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Batch & Student Calculation Breakdown */}
      {showBreakdown && salaryData?.compensationType !== 'fixed' && (
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-4 sm:p-5 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-border/60 pb-3">
            <div>
              <h4 className="text-xs font-bold text-brand-text">
                Salary Calculation Breakdown for {salaryData.selectedMonth}
              </h4>
              <p className="text-[10px] text-brand-text-muted mt-0.5">
                Calculated from assigned batches: (Active Students × Fee Per Student) × {salaryData.salaryPercentage || 100}%
              </p>
            </div>
            <span className="text-[11px] font-bold text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-lg border border-brand-primary/20 self-start sm:self-auto">
              Total Batch Pool: ₹{(calcDetails.totalBatchFeePool || calcDetails.totalMonthlyFee)?.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Batches Table */}
          {calcDetails.batches?.length > 0 && (
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
                      Your Share ({salaryData.salaryPercentage || 100}%)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/60">
                  {calcDetails.batches.map((b) => (
                    <tr key={b.batchName} className="hover:bg-brand-surface-tint/40">
                      <td className="py-2.5 px-3 font-bold text-brand-text">{b.batchName}</td>
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
                        {b.feePerStudent > 0 ? `₹${b.feePerStudent.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-brand-text">
                        {b.studentCount} student{b.studentCount !== 1 ? 's' : ''}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-brand-text">
                        ₹{b.batchTotalFee?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-brand-primary text-right">
                        ₹{b.teacherShare?.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Student details if available */}
          {calcDetails.students?.length > 0 && (
            <div className="pt-2 border-t border-brand-border/60">
              <p className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wider mb-2">
                Enrolled Students ({calcDetails.students.length})
              </p>
              <div className="overflow-x-auto rounded-xl border border-brand-border">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-brand-border bg-brand-surface-tint text-brand-text-muted text-[10px] uppercase">
                      <th className="py-2 px-3 font-semibold">Student Name</th>
                      <th className="py-2 px-3 font-semibold">Batch</th>
                      <th className="py-2 px-3 font-semibold">Monthly Fee</th>
                      <th className="py-2 px-3 font-semibold text-right">Your Share ({salaryData.salaryPercentage || 100}%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/60">
                    {calcDetails.students.map((s) => (
                      <tr key={s.id} className="hover:bg-brand-surface-tint/50">
                        <td className="py-2 px-3 font-medium text-brand-text">{s.name}</td>
                        <td className="py-2 px-3 text-brand-text-muted">{s.batch}</td>
                        <td className="py-2 px-3 font-medium text-brand-text">₹{s.monthlyFee?.toLocaleString('en-IN')}</td>
                        <td className="py-2 px-3 font-bold text-brand-primary text-right">₹{s.teacherShare?.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assigned batches */}
      <div>
        <h3 className="text-sm font-semibold text-brand-text mb-3">Assigned Batches</h3>
        {teacher.assignedBatches.length === 0 ? (
          <p className="text-xs text-brand-text-muted bg-brand-surface border border-dashed border-brand-border rounded-2xl px-4 py-6 text-center">
            No batches assigned yet. Contact your Admin to be added to a batch.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {teacher.assignedBatches.map((batch) => (
              <div
                key={batch}
                className="rounded-2xl border border-brand-border bg-brand-surface px-4 py-3 flex items-center gap-3 shadow-sm"
              >
                <span className="text-xl">🏫</span>
                <div>
                  <p className="text-xs font-semibold text-brand-text">{batch}</p>
                  <p className="text-[10px] text-brand-text-muted mt-0.5">Active batch</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>



      {/* My uploaded materials */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-brand-text">
            My Uploaded Materials
            <span className="ml-2 text-[10px] font-normal text-brand-text-muted">
              {materials.length} item{materials.length !== 1 ? 's' : ''}
            </span>
          </h3>
        </div>
        {materials.length === 0 ? (
          <p className="text-xs text-brand-text-muted bg-brand-surface border border-dashed border-brand-border rounded-2xl px-4 py-6 text-center">
            You haven't uploaded any materials yet. Use the Upload tab to get started.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {materials.map((m) => (
              <MaterialCard key={m._id} material={m} />
            ))}
          </div>
        )}
      </div>

      {/* My uploaded practice tests */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-brand-text">
            My Uploaded Practice Tests
            <span className="ml-2 text-[10px] font-normal text-brand-text-muted">
              {tests.length} item{tests.length !== 1 ? 's' : ''}
            </span>
          </h3>
        </div>
        {tests.length === 0 ? (
          <p className="text-xs text-brand-text-muted bg-brand-surface border border-dashed border-brand-border rounded-2xl px-4 py-6 text-center">
            You haven't uploaded any practice tests yet. Use the Upload tab to get started.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {tests.map((t) => (
              <div key={t._id} className="rounded-2xl border border-brand-border bg-brand-surface p-4 shadow-sm flex flex-col gap-2 transition-all duration-200 hover:scale-[1.01]">
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 bg-brand-primary/10 text-brand-primary ring-brand-primary/20">
                    📝 Practice Test
                  </span>
                  <span className="text-[10px] text-brand-text-muted shrink-0">
                    {new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(
                      new Date(t.createdAt)
                    )}
                  </span>
                </div>
                <p className="text-xs font-bold text-brand-text leading-snug line-clamp-2">
                  {t.testTitle}
                </p>
                <p className="text-[11px] text-brand-text-muted flex items-center gap-1">
                  <span className="font-semibold text-brand-text">{t.subject}</span>
                  {t.chapter && (
                    <>
                      <span>·</span>
                      <span className="truncate">{t.chapter}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{t.batch}</span>
                </p>
                {t.documentUrl && (
                  <a
                    href={t.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto w-full rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-brand-surface py-2 text-center text-xs font-bold transition-all"
                  >
                    Open Test ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Salary & Payments Tab ────────────────────────────────────────────────────
function SalaryTab({ teacher }) {
  const [salaryData, setSalaryData] = useState(null)
  const [salaryLoading, setSalaryLoading] = useState(true)
  const [salaryError, setSalaryError] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [showBreakdown, setShowBreakdown] = useState(false)

  const fetchSalary = useCallback(async (targetMonth) => {
    setSalaryLoading(true)
    setSalaryError('')
    try {
      const { data } = await api.get('/teacher/salary-overview', {
        params: targetMonth ? { month: targetMonth } : {},
      })
      if (data.success) {
        setSalaryData(data.data)
        if (data.data.selectedMonth) {
          setSelectedMonth(data.data.selectedMonth)
        }
      } else {
        setSalaryError(data.message || 'Failed to load salary details.')
      }
    } catch (err) {
      setSalaryError(err.response?.data?.message || 'Unable to load salary data.')
    } finally {
      setSalaryLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSalary(selectedMonth)
  }, [fetchSalary, selectedMonth])

  if (!teacher) return null

  const calcDetails = salaryData?.calculationDetails || {}
  const monthlyLedger = salaryData?.monthlyLedger || []
  const monthsList = salaryData?.monthsList || []

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-brand-text tracking-tight">
              Salary &amp; Payments
            </h2>
            <span className="rounded-full bg-brand-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-primary">
              {teacher.compensationType === 'fixed'
                ? `Fixed: ₹${(teacher.salaryAmount || teacher.fixedSalary || 0).toLocaleString('en-IN')}/mo`
                : `${teacher.salaryPercentage || teacher.studentPercentage || 0}% Fee Split`}
            </span>
          </div>
          <p className="text-xs text-brand-text-muted mt-0.5">
            Track your monthly earnings, advance &amp; settled payments, and outstanding balances.
          </p>
        </div>

        {monthsList.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-brand-text-muted">Cycle:</label>
            <select
              value={selectedMonth || salaryData?.selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value)
                fetchSalary(e.target.value)
              }}
              className="rounded-xl border border-brand-border bg-brand-surface px-3 py-1.5 text-xs font-bold text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer shadow-xs"
            >
              {monthsList.map((m) => (
                <option key={m} value={m}>
                  {m} {m === salaryData?.currentMonth ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {salaryLoading && !salaryData ? (
        <div className="py-16 text-center text-sm text-brand-text-muted animate-pulse">
          Loading salary ledger and transactions...
        </div>
      ) : salaryError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          {salaryError}
        </div>
      ) : (
        <>
          {/* Top 3 Core Metrics */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* 1. Monthly Salary */}
            <div className="rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-brand-text-muted">
                  Monthly Salary ({salaryData?.selectedMonth})
                </p>
                <span className="text-base">💼</span>
              </div>
              <p className="text-2xl font-black text-brand-primary mt-2">
                ₹{(salaryData?.salary || 0).toLocaleString('en-IN')}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs text-brand-text-muted border-t border-brand-border/60 pt-2">
                <span>Paid for month:</span>
                <span className="font-bold text-emerald-600">
                  ₹{(salaryData?.totalPaidThisMonth || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-brand-text-muted mt-1">
                <span>Due for month:</span>
                <span className={`font-bold ${salaryData?.remainingThisMonth > 0 ? 'text-brand-accent' : 'text-emerald-600'}`}>
                  ₹{(salaryData?.remainingThisMonth || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* 2. Previous Salary / Arrears */}
            <div className={`rounded-2xl border p-5 shadow-sm relative overflow-hidden ${
              salaryData?.previousSalary > 0
                ? 'border-amber-300 bg-amber-50/40 text-amber-950'
                : 'border-brand-border bg-brand-surface'
            }`}>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-brand-text-muted">
                  Previous Salary (Past Dues)
                </p>
                <span className="text-base">{salaryData?.previousSalary > 0 ? '⚠️' : '✓'}</span>
              </div>
              <p className={`text-2xl font-black mt-2 ${
                salaryData?.previousSalary > 0 ? 'text-amber-700' : 'text-brand-text'
              }`}>
                ₹{(salaryData?.previousSalary || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-brand-text-muted mt-2 border-t border-brand-border/60 pt-2">
                {salaryData?.previousSalary > 0
                  ? `Unpaid: ${salaryData.previousUnpaidMonths?.join(', ') || 'Past cycles'}`
                  : 'All past cycles settled cleanly ✓'}
              </p>
            </div>

            {/* 3. Total Balance to Receive */}
            <div className="rounded-2xl border-2 border-brand-primary/30 bg-gradient-to-br from-brand-primary/5 to-transparent p-5 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-brand-primary">
                  Total Outstanding Balance
                </p>
              </div>
              <p className="text-2xl font-black text-brand-primary mt-2">
                ₹{(salaryData?.totalSalaryToBePaid ?? salaryData?.totalAccumulatedDue ?? 0).toLocaleString('en-IN')}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs text-brand-text-muted border-t border-brand-border/60 pt-2">
                <span>Total Received (All Time):</span>
                <span className="font-bold text-brand-text">
                  ₹{(salaryData?.totalPaidAllTime || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Batch & Student breakdown */}
          {salaryData?.compensationType !== 'fixed' && (calcDetails.batches?.length > 0 || calcDetails.students?.length > 0) && (
            <div className="rounded-2xl border border-brand-border bg-brand-surface p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-border/60 pb-3">
                <div>
                  <h4 className="text-xs font-bold text-brand-text">
                    Batch-Wise Fee Calculation ({salaryData.selectedMonth})
                  </h4>
                  <p className="text-[11px] text-brand-text-muted mt-0.5">
                    Total Batch Pool: ₹{(calcDetails.totalBatchFeePool || calcDetails.totalMonthlyFee)?.toLocaleString('en-IN')} × {salaryData.salaryPercentage || 100}% = <strong className="text-brand-primary">₹{(salaryData.salary || 0).toLocaleString('en-IN')}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="rounded-xl border border-brand-border bg-brand-surface-tint px-2.5 py-1 text-xs font-bold text-brand-primary hover:bg-brand-primary/10 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  {showBreakdown ? 'Hide Details' : `View Breakdown (${calcDetails.batches?.length || 0} Batches)`}
                </button>
              </div>

              {/* Batches Table */}
              {calcDetails.batches?.length > 0 && (
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
                          Your Share ({salaryData.salaryPercentage || 100}%)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/60">
                      {calcDetails.batches.map((b) => (
                        <tr key={b.batchName} className="hover:bg-brand-surface-tint/40">
                          <td className="py-2.5 px-3 font-bold text-brand-text">{b.batchName}</td>
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
                            {b.feePerStudent > 0 ? `₹${b.feePerStudent.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-brand-text">
                            {b.studentCount} student{b.studentCount !== 1 ? 's' : ''}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-brand-text">
                            ₹{b.batchTotalFee?.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-brand-primary text-right">
                            ₹{b.teacherShare?.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Student details if toggled on */}
              {showBreakdown && calcDetails.students?.length > 0 && (
                <div className="overflow-x-auto border-t border-brand-border pt-3">
                  <p className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wider mb-2">
                    Enrolled Students ({calcDetails.students.length})
                  </p>
                  <table className="min-w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-brand-border text-brand-text-muted text-[10px] uppercase">
                        <th className="py-2 px-3 font-semibold">Student Name</th>
                        <th className="py-2 px-3 font-semibold">Batch</th>
                        <th className="py-2 px-3 font-semibold">Monthly Fee</th>
                        <th className="py-2 px-3 font-semibold text-right">Your Share ({salaryData.salaryPercentage || 100}%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/60">
                      {calcDetails.students.map((s) => (
                        <tr key={s.id} className="hover:bg-brand-surface-tint/50">
                          <td className="py-2 px-3 font-medium text-brand-text">{s.name}</td>
                          <td className="py-2 px-3 text-brand-text-muted">{s.batch}</td>
                          <td className="py-2 px-3 font-medium text-brand-text">₹{s.monthlyFee?.toLocaleString('en-IN')}</td>
                          <td className="py-2 px-3 font-bold text-brand-primary text-right">₹{s.teacherShare?.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Monthly Salary Ledger (All Months Overview) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-brand-text">
                  Monthly Salary Ledger &amp; Due Amounts
                </h3>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  Complete history of monthly salary cycles, paid amounts, and dues
                </p>
              </div>
            </div>

            {monthlyLedger.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-brand-border bg-brand-surface p-6 text-center text-xs text-brand-text-muted">
                No monthly salary cycles recorded yet.
              </div>
            ) : (
              <div className="rounded-2xl border border-brand-border bg-brand-surface overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-brand-border bg-brand-surface-tint">
                        <th className="px-4 py-3 font-semibold text-brand-text">Month</th>
                        <th className="px-4 py-3 font-semibold text-brand-text">Calculated Salary</th>
                        <th className="px-4 py-3 font-semibold text-brand-text">Advance</th>
                        <th className="px-4 py-3 font-semibold text-brand-text">In End</th>
                        <th className="px-4 py-3 font-semibold text-brand-text">Total Paid</th>
                        <th className="px-4 py-3 font-semibold text-brand-accent">Must Receive (Due)</th>
                        <th className="px-4 py-3 font-semibold text-brand-text">Status</th>
                        <th className="px-4 py-3 font-semibold text-brand-text text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                      {monthlyLedger.map((row) => {
                        const isSelected = row.month === (salaryData?.selectedMonth || selectedMonth)
                        const isRowOverdue = row.isOverdue || row.status === 'OVERDUE'
                        return (
                          <tr
                            key={row.month}
                            className={`transition-colors ${
                              isRowOverdue
                                ? 'bg-red-50/40 hover:bg-red-50/70'
                                : isSelected
                                ? 'bg-brand-primary/5 font-medium'
                                : 'hover:bg-brand-surface-tint/50'
                            }`}
                          >
                            <td className="px-4 py-3 font-bold text-brand-text whitespace-nowrap">
                              {row.month}
                              {row.month === salaryData?.currentMonth && (
                                <span className="ml-2 rounded-full bg-brand-primary/10 text-brand-primary px-1.5 py-0.2 text-[9px] font-extrabold">
                                  Current
                                </span>
                              )}
                              {row.isProrated && (
                                <span className="ml-1.5 rounded-full bg-blue-500/10 text-blue-700 border border-blue-500/20 px-1.5 py-0.5 text-[9px] font-semibold" title={`Joined mid-month: worked ${row.daysWorked} of ${row.totalDaysInMonth} days`}>
                                  {row.daysWorked}d worked
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-semibold text-brand-text whitespace-nowrap">
                              ₹{row.salary?.toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3 text-amber-700 whitespace-nowrap">
                              ₹{row.advancePaid?.toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3 text-emerald-700 whitespace-nowrap">
                              ₹{row.endPaid?.toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3 font-bold text-brand-text whitespace-nowrap">
                              ₹{row.totalPaid?.toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3 font-extrabold text-brand-accent whitespace-nowrap">
                              ₹{row.amountDue?.toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {row.status === 'PAID' ? (
                                <span className="rounded-full bg-emerald-500/10 text-emerald-800 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold">
                                  ✓ Settled
                                </span>
                              ) : isRowOverdue ? (
                                <span className="rounded-full bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 text-[9px] font-extrabold flex items-center gap-1 w-fit">
                                  ⚠️ Overdue
                                </span>
                              ) : row.status === 'PARTIAL' ? (
                                <span className="rounded-full bg-amber-500/10 text-amber-800 border border-amber-500/30 px-2 py-0.5 text-[9px] font-bold">
                                  Partial
                                </span>
                              ) : row.isFuture || row.status === 'UPCOMING' ? (
                                <span className="rounded-full bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 text-[9px] font-bold">
                                  Upcoming
                                </span>
                              ) : row.status === 'UNPAID' ? (
                                <span className="rounded-full bg-rose-500/10 text-rose-800 border border-rose-500/30 px-2 py-0.5 text-[9px] font-bold">
                                  Due
                                </span>
                              ) : (
                                <span className="text-brand-text-muted/60 text-[10px]">N/A</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMonth(row.month)
                                  fetchSalary(row.month)
                                }}
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-brand-primary text-white'
                                    : 'bg-brand-surface-tint border border-brand-border text-brand-primary hover:bg-brand-primary/10'
                                }`}
                              >
                                {isSelected ? 'Viewing' : 'View Month'}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot className="border-t-2 border-brand-border bg-brand-surface-tint font-bold text-xs">
                      <tr>
                        <td className="px-4 py-3 text-brand-text">Total Across All Cycles</td>
                        <td className="px-4 py-3 text-brand-text">
                          ₹{(salaryData.totalEarnedAllTime || monthlyLedger.reduce((s, r) => s + (r.salary || 0), 0)).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-amber-700">
                          ₹{monthlyLedger.reduce((s, r) => s + (r.advancePaid || 0), 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-emerald-700">
                          ₹{monthlyLedger.reduce((s, r) => s + (r.endPaid || 0), 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-brand-text">
                          ₹{(salaryData.totalPaidAllTime || monthlyLedger.reduce((s, r) => s + (r.totalPaid || 0), 0)).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-red-600 font-extrabold text-sm">
                          ₹{(salaryData.totalAccumulatedDue ?? monthlyLedger.reduce((s, r) => s + (r.amountDue || 0), 0)).toLocaleString('en-IN')}
                        </td>
                        <td colSpan={2} className="px-4 py-3 text-right text-brand-text-muted text-[11px]">
                          Total Outstanding Balance to Receive
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* My Salary Payments History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-brand-text">
                  My Salary Payment Transactions
                </h3>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  Record of all payments received from the institute
                </p>
              </div>
              {salaryData?.payments?.length > 0 && (
                <span className="text-[11px] font-medium text-brand-text-muted">
                  {salaryData.payments.length} payment{salaryData.payments.length !== 1 ? 's' : ''} recorded
                </span>
              )}
            </div>

            {!salaryData?.payments || salaryData.payments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-brand-border bg-brand-surface p-6 text-center text-xs text-brand-text-muted">
                No salary payment transactions recorded yet.
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                      {salaryData.payments.map((p) => {
                        const isAdvance = p.paymentType === 'advance'
                        return (
                          <tr key={p.id} className="hover:bg-brand-surface-tint/50 transition-colors">
                            <td className="px-4 py-3 font-medium text-brand-text whitespace-nowrap">
                              {p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
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
                              ₹{p.amount?.toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3 text-brand-text-muted whitespace-nowrap">
                              {p.paymentMode || 'UPI'}
                            </td>
                            <td className="px-4 py-3 text-brand-text-muted max-w-xs truncate">
                              {p.notes || '—'}
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
  )
}

// ── Upload Tab (Study Material + Practice Test sub-tabs) ─────────────────────
function UploadTab({ assignedBatches, onSuccess }) {
  const [subTab, setSubTab] = useState('material') // 'material' | 'test'

  // ── Study material form state ─────────────────────────────────────────────
  const [form, setForm] = useState({ ...emptyForm, batch: assignedBatches[0] ?? '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [uploadedItem, setUploadedItem] = useState(null)

  // ── Practice test form state ──────────────────────────────────────────────
  const emptyTestForm = { testTitle: '', subject: '', chapter: '', totalQuestions: '', documentUrl: '', batch: assignedBatches[0] ?? '' }
  const [testForm, setTestForm] = useState(emptyTestForm)
  const [testErrors, setTestErrors] = useState({})
  const [testLoading, setTestLoading] = useState(false)
  const [testServerError, setTestServerError] = useState('')
  const [uploadedTest, setUploadedTest] = useState(null)

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
    setServerError(''); setUploadedItem(null)
  }

  function validate() {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required.'
    if (!form.fileUrlOrLink.trim()) errs.fileUrlOrLink = 'Link or URL is required.'
    if (!form.batch) errs.batch = 'Please select a batch.'
    if (!form.subject.trim()) errs.subject = 'Subject is required.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true); setServerError('')
    try {
      const { data } = await api.post('/content', {
        title: form.title.trim(), description: form.description.trim(),
        materialType: form.materialType, fileUrlOrLink: form.fileUrlOrLink.trim(),
        batch: form.batch, subject: form.subject.trim(), chapter: form.chapter.trim(),
      })
      if (!data.success) { setServerError(data.message || 'Upload failed.'); return }
      setUploadedItem(data.data)
      setForm({ ...emptyForm, batch: assignedBatches[0] ?? '' })
      onSuccess?.()
    } catch (err) {
      setServerError(err.response?.data?.message || (err.request ? 'Unable to reach the server.' : 'Something went wrong.'))
    } finally { setLoading(false) }
  }

  function updateTestField(field, value) {
    setTestForm((prev) => ({ ...prev, [field]: value }))
    setTestErrors((prev) => ({ ...prev, [field]: '' }))
    setTestServerError(''); setUploadedTest(null)
  }

  function validateTest() {
    const errs = {}
    if (!testForm.testTitle.trim()) errs.testTitle = 'Test title is required.'
    if (!testForm.subject.trim()) errs.subject = 'Subject is required.'
    if (!testForm.documentUrl.trim()) errs.documentUrl = 'Document URL is required.'
    if (!testForm.batch) errs.batch = 'Please select a batch.'
    return errs
  }

  async function handleTestSubmit(e) {
    e.preventDefault()
    const errs = validateTest()
    if (Object.keys(errs).length) { setTestErrors(errs); return }
    setTestLoading(true); setTestServerError('')
    try {
      const { data } = await api.post('/tests', {
        testTitle: testForm.testTitle.trim(), subject: testForm.subject.trim(),
        chapter: testForm.chapter.trim(), documentUrl: testForm.documentUrl.trim(),
        batch: testForm.batch,
        totalQuestions: testForm.totalQuestions ? Number(testForm.totalQuestions) : null,
      })
      if (!data.success) { setTestServerError(data.message || 'Upload failed.'); return }
      setUploadedTest(data.data)
      setTestForm(emptyTestForm)
      onSuccess?.()
    } catch (err) {
      setTestServerError(err.response?.data?.message || (err.request ? 'Unable to reach the server.' : 'Something went wrong.'))
    } finally { setTestLoading(false) }
  }

  const inputCls = (field, errs = errors) =>
    `w-full rounded-xl border px-4 py-2.5 text-sm text-brand-text placeholder:text-brand-text-muted/50 bg-brand-surface focus:outline-none focus:ring-2 transition-all ${
      errs[field] ? 'border-brand-accent focus:ring-brand-accent/30' : 'border-brand-border focus:ring-brand-primary focus:border-brand-primary'
    }`

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h2 className="text-lg font-extrabold text-brand-text tracking-tight">Upload Content</h2>
        <p className="text-xs text-brand-text-muted mt-0.5">
          Upload to: <span className="font-semibold text-brand-primary">{assignedBatches.join(', ') || '—'}</span>
        </p>
      </div>

      {/* Sub-tab toggle */}
      <div className="flex gap-1 p-1 bg-brand-surface-tint border border-brand-border rounded-xl w-fit">
        {[
          { id: 'material', label: '📚 Study Material' },
          { id: 'test',     label: '📝 Practice Test'  },
        ].map((t) => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              subTab === t.id ? 'bg-brand-surface text-brand-primary shadow-sm font-extrabold scale-[1.02]' : 'text-brand-text-muted hover:text-brand-text'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Study Material Form ─────────────────────────────────────────────── */}
      {subTab === 'material' && (
        <>
          {uploadedItem && (
            <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-4 py-3 text-xs text-brand-primary font-medium">
              ✅ <span className="font-semibold">"{uploadedItem.title}"</span> uploaded to <span className="font-semibold text-brand-accent">{uploadedItem.batch}</span>.
            </div>
          )}
          <form onSubmit={handleSubmit} noValidate className="rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1">Title *</label>
              <input type="text" value={form.title} onChange={(e) => updateField('title', e.target.value)} placeholder="e.g. Chapter 3 — Quadratic Equations" className={inputCls('title')} />
              {errors.title && <p className="mt-1 text-[11px] text-brand-accent">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1">Type</label>
              <select value={form.materialType} onChange={(e) => updateField('materialType', e.target.value)} className={inputCls('materialType')}>
                {MATERIAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1">Batch *</label>
              <select value={form.batch} onChange={(e) => updateField('batch', e.target.value)} className={inputCls('batch')}>
                <option value="">— Select batch —</option>
                {assignedBatches.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              {errors.batch && <p className="mt-1 text-[11px] text-brand-accent">{errors.batch}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1">Subject *</label>
              <input type="text" list="subject-list" value={form.subject} onChange={(e) => updateField('subject', e.target.value)} placeholder="e.g. Mathematics" className={inputCls('subject')} />
              <datalist id="subject-list">{SUBJECT_OPTIONS.map((s) => <option key={s} value={s} />)}</datalist>
              {errors.subject && <p className="mt-1 text-[11px] text-brand-accent">{errors.subject}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1">Chapter <span className="text-brand-text-muted/60 font-normal">(optional)</span></label>
              <input type="text" value={form.chapter} onChange={(e) => updateField('chapter', e.target.value)} placeholder="e.g. Chapter 3 – Quadratic Equations" className={inputCls('chapter')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1">Resource Link / URL *</label>
              <input type="url" value={form.fileUrlOrLink} onChange={(e) => updateField('fileUrlOrLink', e.target.value)} placeholder="https://drive.google.com/..." className={inputCls('fileUrlOrLink')} />
              {errors.fileUrlOrLink && <p className="mt-1 text-[11px] text-brand-accent">{errors.fileUrlOrLink}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1">Description <span className="text-brand-text-muted/60 font-normal">(optional)</span></label>
              <textarea rows={2} value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Brief note…" className="w-full rounded-xl border border-brand-border px-4 py-2.5 text-sm text-brand-text placeholder:text-brand-text-muted/50 bg-brand-surface focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none transition-all" />
            </div>
            {serverError && <p role="alert" className="text-xs text-brand-accent bg-brand-accent/5 border border-brand-accent/10 rounded-xl px-4 py-3">{serverError}</p>}
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-brand-surface px-4 py-3 text-sm font-bold disabled:opacity-60 transition-all duration-200 cursor-pointer shadow-sm">
              {loading ? 'Uploading…' : 'Upload Material'}
            </button>
          </form>
        </>
      )}

      {/* ── Practice Test Form ──────────────────────────────────────────────── */}
      {subTab === 'test' && (
        <>
          {uploadedTest && (
            <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-4 py-3 text-xs text-brand-primary font-medium">
              ✅ <span className="font-semibold">"{uploadedTest.testTitle}"</span> uploaded to <span className="font-semibold text-brand-accent">{uploadedTest.batch}</span>.
            </div>
          )}
          <form onSubmit={handleTestSubmit} noValidate className="rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1">Test Title *</label>
              <input type="text" value={testForm.testTitle} onChange={(e) => updateTestField('testTitle', e.target.value)} placeholder="e.g. Chapter 3 Mid-Term Test" className={inputCls('testTitle', testErrors)} />
              {testErrors.testTitle && <p className="mt-1 text-[11px] text-brand-accent">{testErrors.testTitle}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1">Batch *</label>
              <select value={testForm.batch} onChange={(e) => updateTestField('batch', e.target.value)} className={inputCls('batch', testErrors)}>
                <option value="">— Select batch —</option>
                {assignedBatches.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              {testErrors.batch && <p className="mt-1 text-[11px] text-brand-accent">{testErrors.batch}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1">Subject *</label>
              <input type="text" list="test-subject-list" value={testForm.subject} onChange={(e) => updateTestField('subject', e.target.value)} placeholder="e.g. Mathematics" className={inputCls('subject', testErrors)} />
              <datalist id="test-subject-list">{SUBJECT_OPTIONS.map((s) => <option key={s} value={s} />)}</datalist>
              {testErrors.subject && <p className="mt-1 text-[11px] text-brand-accent">{testErrors.subject}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1">Chapter <span className="text-brand-text-muted/60 font-normal">(optional)</span></label>
              <input type="text" value={testForm.chapter} onChange={(e) => updateTestField('chapter', e.target.value)} placeholder="e.g. Chapter 3 – Quadratic Equations" className={inputCls('chapter', testErrors)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1">No. of Questions <span className="text-brand-text-muted/60 font-normal">(optional)</span></label>
              <input type="number" min="1" value={testForm.totalQuestions} onChange={(e) => updateTestField('totalQuestions', e.target.value)} placeholder="e.g. 30" className={inputCls('totalQuestions', testErrors)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1">Document URL *</label>
              <input type="url" value={testForm.documentUrl} onChange={(e) => updateTestField('documentUrl', e.target.value)} placeholder="https://drive.google.com/..." className={inputCls('documentUrl', testErrors)} />
              {testErrors.documentUrl && <p className="mt-1 text-[11px] text-brand-accent">{testErrors.documentUrl}</p>}
            </div>
            {testServerError && <p role="alert" className="text-xs text-brand-accent bg-brand-accent/5 border border-brand-accent/10 rounded-xl px-4 py-3">{testServerError}</p>}
            <button type="submit" disabled={testLoading} className="w-full rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-brand-surface px-4 py-3 text-sm font-bold disabled:opacity-60 transition-all duration-200 cursor-pointer shadow-sm">
              {testLoading ? 'Uploading…' : 'Upload Test Paper'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}



// ── Students Tab ──────────────────────────────────────────────────────────────
const BATCH_PILL = {
  'Morning Batch A': 'bg-brand-primary/10 text-brand-primary ring-1 ring-brand-primary/20',
  'Morning Batch B': 'bg-brand-primary/10 text-brand-primary ring-1 ring-brand-primary/20',
  'Evening Batch A': 'bg-brand-accent/10 text-brand-accent ring-1 ring-brand-accent/20',
  'Evening Batch B': 'bg-brand-accent/10 text-brand-accent ring-1 ring-brand-accent/20',
  'Weekend Batch':   'bg-brand-gold/10 text-brand-gold dark:text-brand-gold/80 ring-1 ring-brand-gold/20',
}
function batchPill(batch) {
  return BATCH_PILL[batch] ?? 'bg-brand-surface-tint text-brand-text-muted ring-1 ring-brand-border'
}

function StudentsTab({ students }) {
  const [filtered, setFiltered] = useState(students)

  // Sync when the parent data changes (e.g. after dashboard reload)
  useEffect(() => {
    setFiltered(students)
  }, [students])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-brand-text tracking-tight">My Students</h2>
          <p className="text-xs text-brand-text-muted mt-0.5">
            Showing <span className="font-semibold text-brand-text">{filtered.length}</span> of{' '}
            {students.length} student{students.length !== 1 ? 's' : ''} across your assigned batches
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      {students.length > 0 && (
        <StudentFilterBar
          students={students}
          onFilterChange={setFiltered}
          accentColor="emerald"
        />
      )}

      {/* Data grid */}
      {students.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-border bg-brand-surface p-10 text-center">
          <p className="text-sm text-brand-text-muted">No students found in your assigned batches.</p>
          <p className="text-xs text-brand-text-muted/70 mt-1">Contact the Admin to assign students to your batches.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-border bg-brand-surface p-8 text-center">
          <p className="text-sm text-brand-text-muted">No students match your filter.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-brand-border bg-brand-surface shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brand-border bg-brand-surface-tint">
                  <th className="px-4 py-3.5 font-bold text-brand-text-muted w-10">#</th>
                  <th className="px-4 py-3.5 font-bold text-brand-text">Roll No</th>
                  <th className="px-4 py-3.5 font-bold text-brand-text">Student Name</th>
                  <th className="px-4 py-3.5 font-bold text-brand-text">Batch</th>
                  <th className="px-4 py-3.5 font-bold text-brand-text">Class</th>
                  <th className="px-4 py-3.5 font-bold text-brand-text">Subjects</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {filtered.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-brand-primary/5 transition-colors duration-150">
                    <td className="px-4 py-3 text-brand-text-muted tabular-nums">{idx + 1}</td>
                    <td className="px-4 py-3">
                      {s.rollNo ? (
                        <span className="font-mono text-[10px] font-extrabold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded ring-1 ring-brand-primary/20">
                          {s.rollNo}
                        </span>
                      ) : (
                        <span className="text-brand-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                          {s.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-brand-text">{s.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${batchPill(s.batch)}`}>
                        {s.batch}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-brand-text">{s.studentClass || <span className="text-brand-text-muted/50">—</span>}</td>
                    <td className="px-4 py-3 text-brand-text">{s.subjects || <span className="text-brand-text-muted/50">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Footer count */}
          <div className="px-4 py-3 border-t border-brand-border bg-brand-surface-tint text-right">
            <span className="text-[11px] text-brand-text-muted">
              {filtered.length} record{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Material Card ─────────────────────────────────────────────────────────────
function MaterialCard({ material }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-surface p-4 shadow-sm flex flex-col gap-2 transition-all duration-200 hover:scale-[1.01]">
      <div className="flex items-start justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${typeBadge(material.materialType)}`}
        >
          {TYPE_ICON[material.materialType]} {material.materialType}
        </span>
        <span className="text-[10px] text-brand-text-muted shrink-0">
          {new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(
            new Date(material.createdAt)
          )}
        </span>
      </div>
      <p className="text-xs font-bold text-brand-text leading-snug line-clamp-2">
        {material.title}
      </p>
      <p className="text-[11px] text-brand-text-muted flex items-center gap-1">
        <span className="font-semibold text-brand-text">{material.subject}</span>
        <span>·</span>
        <span>{material.batch}</span>
      </p>
      {material.fileUrlOrLink && (
        <a
          href={material.fileUrlOrLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto w-full rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-brand-surface py-2 text-center text-xs font-bold transition-all shadow-sm"
        >
          Open Resource ↗
        </a>
      )}
    </div>
  )
}

// ── Utility states ────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20 text-sm text-brand-text-muted">
      Loading your dashboard…
    </div>
  )
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-brand-accent/20 bg-brand-accent/5 p-6 text-center space-y-3">
      <p className="text-sm font-medium text-brand-accent">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-xl border border-brand-accent/30 bg-brand-surface px-4 py-2 text-xs font-bold text-brand-accent hover:bg-brand-accent/10 transition-all cursor-pointer shadow-sm"
      >
        Retry
      </button>
    </div>
  )
}
