import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StudentRegistration from '../components/admin/StudentRegistration'
import ContentManager from '../components/admin/ContentManager'
import ActiveStudentsList from '../components/admin/ActiveStudentsList'
import MasterFeeLedger from '../components/admin/MasterFeeLedger'
import TeacherManagement from '../components/admin/TeacherManagement'
import BatchManagement from '../components/admin/BatchManagement'
import AttendanceManager from '../components/shared/AttendanceManager'
import api from '../lib/api'
import { useEffect } from 'react'
import { clearToken, clearRole } from '../lib/auth'
import SettingsModal from '../components/shared/SettingsModal'
import { useTheme } from '../context/ThemeContext'
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Layers,
  GraduationCap,
  CalendarCheck,
  IndianRupee,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

const NAV_ITEMS = [
  { id: 'overview',    label: 'Overview',              Icon: LayoutDashboard },
  { id: 'register',   label: 'Student Registration',   Icon: UserPlus },
  { id: 'students',   label: 'Students',               Icon: Users,          disabled: false },
  { id: 'batches',    label: 'Batches',                Icon: Layers,         disabled: false },
  { id: 'teachers',   label: 'Teachers',               Icon: GraduationCap,  disabled: false },
  { id: 'attendance', label: 'Attendance',             Icon: CalendarCheck,  disabled: false },
  { id: 'fees',       label: 'Fee Ledger',             Icon: IndianRupee,    disabled: false },
  { id: 'content',    label: 'Content',                Icon: BookOpen,       disabled: false },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const { theme, setTheme, isDark } = useTheme()

  function handleSignOut() {
    clearToken()
    clearRole()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [activeTab])

  const activeItem = NAV_ITEMS.find((item) => item.id === activeTab)

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden transition-colors duration-300">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-brand-text/30 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

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
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold truncate">
                Lakshya Academy
              </p>
              <h1 className="text-xs font-semibold text-brand-surface/90 mt-0.5 truncate">Admin Workspace</h1>
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

        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id
            const Icon = item.Icon
            return (
              <button
                key={item.id}
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  if (!item.disabled) {
                    setActiveTab(item.id)
                    setSidebarOpen(false)
                  }
                }}
                className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left text-xs font-semibold transition-all duration-200 ${
                  item.disabled
                    ? 'text-brand-surface/40 cursor-not-allowed'
                    : isActive
                      ? 'bg-brand-surface text-brand-primary shadow-sm font-extrabold scale-[1.02]'
                      : 'text-brand-surface/80 hover:bg-brand-surface/10 hover:text-brand-surface'
                }`}
              >
                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} aria-hidden />
                {item.label}
                {item.disabled && (
                  <span className="ml-auto text-[8px] uppercase tracking-wide text-brand-surface/40 bg-brand-surface/5 px-1.5 py-0.5 rounded">
                    Soon
                  </span>
                )}
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

      <div className="flex-1 flex flex-col min-w-0 lg:h-screen lg:overflow-hidden">
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
                Admin Panel
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
                Admin Workspace
              </p>
            </div>
          </div>

          <div className="animate-fadeIn">
            { activeTab === 'overview' && <OverviewPanel /> }
            { activeTab === 'register' && <StudentRegistration /> }
            { activeTab === 'content' && <ContentManager /> }
            { activeTab === 'batches' && <BatchManagement /> }
            { activeTab === 'teachers' && <TeacherManagement /> }
            { activeTab === 'attendance' && <AttendanceManager /> }
            { activeTab === 'students' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-brand-primary">Students Directory</h2>
                  <p className="text-xs text-brand-text-muted mt-0.5">Manage all active student profiles.</p>
                </div>
                <ActiveStudentsList />
              </div>
            )}
            { activeTab === 'fees' && <MasterFeeLedger /> }
            { activeTab !== 'overview' &&
              activeTab !== 'register' &&
              activeTab !== 'content' &&
              activeTab !== 'batches' &&
              activeTab !== 'teachers' &&
              activeTab !== 'attendance' &&
              activeTab !== 'students' &&
              activeTab !== 'fees' && <PlaceholderPanel title={activeItem?.label} /> }
          </div>
        </main>
      </div>
    </div>
  )
}

function OverviewPanel() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCollected: 0,
    totalPending: 0,
    activeBatches: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const [statsRes, batchesRes] = await Promise.all([
          api.get('/students/stats'),
          api.get('/batches'),
        ])
        const statsData = statsRes.data.success ? statsRes.data.data : {}
        const batchCount = batchesRes.data.success ? batchesRes.data.data.batches.length : 0
        setStats({ ...statsData, activeBatches: batchCount })
      } catch (err) {
        console.error('Failed to load stats', err)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0)

  const cards = [
    { label: 'Active Students', value: loading ? '…' : stats.totalStudents, hint: 'Currently enrolled', accent: 'primary' },
    { label: 'Total Collected', value: loading ? '…' : formatCurrency(stats.totalCollected), hint: 'System-wide revenue', accent: 'gold' },
    { label: 'Pending Dues', value: loading ? '…' : formatCurrency(stats.totalPending), hint: 'Unpaid balances', accent: 'accent' },
    { label: 'Active Batches', value: loading ? '…' : stats.activeBatches, hint: 'Configured', accent: 'primary' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-brand-primary">Overview Dashboard</h2>
        <p className="text-xs text-brand-text-muted mt-0.5">
          Real-time metrics for your institute.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-brand-border bg-brand-surface px-6 py-6 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01]"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
              {stat.label}
            </p>
            <p className={`text-3xl font-extrabold mt-2 ${
              stat.accent === 'primary' 
                ? 'text-brand-primary' 
                : stat.accent === 'accent' 
                  ? 'text-brand-accent' 
                  : 'text-brand-gold'
            }`}>{stat.value}</p>
            <p className="text-[11px] text-brand-text-muted/70 mt-2 font-medium">{stat.hint}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PlaceholderPanel({ title }) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-border bg-brand-surface p-12 text-center shadow-sm">
      <p className="text-sm text-brand-text-muted">
        <span className="font-bold text-brand-primary">{title}</span> module coming soon.
      </p>
    </div>
  )
}

