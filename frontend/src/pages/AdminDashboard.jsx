import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StudentRegistration from '../components/admin/StudentRegistration'
import ContentManager from '../components/admin/ContentManager'
import ActiveStudentsList from '../components/admin/ActiveStudentsList'
import MasterFeeLedger from '../components/admin/MasterFeeLedger'
import TeacherManagement from '../components/admin/TeacherManagement'
import AttendanceManager from '../components/shared/AttendanceManager'
import api from '../lib/api'
import { useEffect } from 'react'
import { clearToken, clearRole } from '../lib/auth'

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: '◫' },
  { id: 'register', label: 'Student Registration', icon: '✎' },
  { id: 'students', label: 'Students', icon: '◎', disabled: false },
  { id: 'teachers', label: 'Teachers', icon: '👩‍🏫', disabled: false },
  { id: 'attendance', label: 'Attendance', icon: '📅', disabled: false },
  { id: 'fees', label: 'Fee Ledger', icon: '₹', disabled: false },
  { id: 'content', label: 'Content', icon: '▤', disabled: false },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('register')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function handleSignOut() {
    clearToken()
    clearRole()
    navigate('/login', { replace: true })
  }

  const activeItem = NAV_ITEMS.find((item) => item.id === activeTab)

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-20 bg-slate-900/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 flex w-56 flex-col border-r border-slate-200 bg-slate-900 text-slate-100 transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-4 py-4 border-b border-slate-700/80">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-300">
            Institute
          </p>
          <h1 className="text-sm font-semibold text-white mt-0.5">Admin Workspace</h1>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id
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
                className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                  item.disabled
                    ? 'text-slate-500 cursor-not-allowed'
                    : isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="w-4 text-center text-[11px] opacity-80" aria-hidden>
                  {item.icon}
                </span>
                {item.label}
                {item.disabled && (
                  <span className="ml-auto text-[9px] uppercase tracking-wide text-slate-500">
                    Soon
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="px-3 py-3 border-t border-slate-700/80">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-lg px-2.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="lg:hidden rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600"
              onClick={() => setSidebarOpen(true)}
            >
              Menu
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                Dashboard
              </p>
              <h2 className="text-sm font-semibold text-slate-900 truncate">
                {activeItem?.label ?? 'Workspace'}
              </h2>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-500">
            <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 font-medium">
              Live
            </span>
            <span>{new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-5 overflow-auto">
          { activeTab === 'overview' && <OverviewPanel /> }
          { activeTab === 'register' && <StudentRegistration /> }
          { activeTab === 'content' && <ContentManager /> }
          { activeTab === 'teachers' && <TeacherManagement /> }
          { activeTab === 'attendance' && <AttendanceManager /> }
          { activeTab === 'students' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Students Directory</h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage all active student profiles.</p>
              </div>
              <ActiveStudentsList />
            </div>
          )}
          { activeTab === 'fees' && <MasterFeeLedger /> }
          { activeTab !== 'overview' &&
            activeTab !== 'register' &&
            activeTab !== 'content' &&
            activeTab !== 'teachers' &&
            activeTab !== 'attendance' &&
            activeTab !== 'students' &&
            activeTab !== 'fees' && <PlaceholderPanel title={activeItem?.label} /> }
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
    activeBatches: 5,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const { data } = await api.get('/students/stats')
        if (data.success) {
          setStats(data.data)
        }
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
    { label: 'Active Students', value: loading ? '…' : stats.totalStudents, hint: 'Currently enrolled' },
    { label: 'Total Collected', value: loading ? '…' : formatCurrency(stats.totalCollected), hint: 'System-wide revenue' },
    { label: 'Pending Dues', value: loading ? '…' : formatCurrency(stats.totalPending), hint: 'Unpaid balances' },
    { label: 'Active Batches', value: loading ? '…' : stats.activeBatches, hint: 'Configured' },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Overview Dashboard</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time metrics for your institute.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {stat.label}
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
            <p className="text-[11px] text-slate-400 mt-1.5">{stat.hint}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PlaceholderPanel({ title }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <p className="text-sm text-slate-600">
        <span className="font-medium text-slate-800">{title}</span> module coming soon.
      </p>
    </div>
  )
}
