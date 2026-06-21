import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { clearToken, clearRole } from '../lib/auth'
import AttendanceManager from '../components/shared/AttendanceManager'
import StudentFilterBar from '../components/shared/StudentFilterBar'
import SettingsModal from '../components/shared/SettingsModal'
import { useTheme } from '../context/ThemeContext'

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
  { id: 'overview', label: 'My Dashboard', icon: '◫' },
  { id: 'upload', label: 'Upload Content', icon: '⬆' },
  { id: 'students', label: 'My Students', icon: '◎' },
  { id: 'attendance', label: 'Take Attendance', icon: '📅' },
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
  const { theme, setTheme } = useTheme()

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

  const teacher = dashData?.teacher
  const activeItem = NAV_ITEMS.find((n) => n.id === activeTab)

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex transition-colors duration-300">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-20 bg-brand-text/20 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-brand-border bg-brand-primary text-brand-surface transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-6 py-6 border-b border-brand-border/20 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white overflow-hidden shrink-0 shadow-sm">
            <img src="/logo.png" alt="Logo" className="h-full w-full object-contain p-1" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold leading-tight">
              Lakshya Academy
            </p>
            <h1 className="text-xs font-semibold text-brand-surface/90 mt-0.5">Teacher Portal</h1>
          </div>
        </div>

        {/* Teacher identity */}
        {teacher && (
          <div className="px-6 py-4 border-b border-brand-border/10">
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
            onClick={() => {
              setShowSettings(true)
              setSidebarOpen(false)
            }}
            className="w-full rounded-xl px-4 py-3 text-xs font-semibold text-brand-surface/80 hover:bg-brand-surface/10 hover:text-brand-surface transition-all duration-200 text-left flex items-center gap-3"
          >
            <span className="text-[14px]" aria-hidden>⚙️</span>
            Settings
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-xl px-4 py-3 text-xs font-semibold text-brand-surface/80 hover:bg-brand-surface/10 hover:text-brand-surface transition-all duration-200 text-left flex items-center gap-3"
          >
            <span className="text-[14px]" aria-hidden>🚪</span>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-brand-surface border-b border-brand-border px-6 py-4 flex items-center justify-between gap-4 transition-colors duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="lg:hidden rounded-xl border border-brand-border bg-brand-surface-tint hover:bg-brand-surface px-3 py-1.5 text-xs font-semibold text-brand-text transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              Menu
            </button>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-brand-text truncate">
                {teacher ? `Hello ${teacher.name}` : ''}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 text-xs font-semibold text-brand-text-muted">
              <span className="rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-2.5 py-0.5 font-bold">
                Live
              </span>
              <span>{new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
            </div>
            
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl bg-brand-surface-tint hover:bg-brand-surface border border-brand-border text-brand-text-muted hover:text-brand-text transition-colors cursor-pointer text-xs font-semibold"
              title="Toggle Theme"
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>

            <img src="/logo.png" alt="Logo" className="lg:hidden h-8 w-8 object-contain" />
          </div>
        </header>

        <main className="flex-1 p-6 sm:p-8 overflow-auto">
          {/* Top-Left Logo Card in Dashboard body canvas */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 flex items-center gap-4 mb-8 shadow-sm max-w-sm transition-all duration-300 hover:scale-[1.01]">
            <img src="/logo.png" alt="Lakshya Logo" className="h-10 w-auto object-contain" />
            <div>
              <h1 className="text-base font-extrabold text-brand-primary leading-tight">
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
                />
              )}
              {activeTab === 'upload' && (
                <UploadTab
                  assignedBatches={teacher?.assignedBatches ?? []}
                  onSuccess={() => setRefreshKey((k) => k + 1)}
                />
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
function OverviewTab({ teacher, materials, tests }) {
  const [salaryData, setSalaryData] = useState(null)
  const [salaryLoading, setSalaryLoading] = useState(true)
  const [salaryError, setSalaryError] = useState('')

  useEffect(() => {
    let isMounted = true
    async function fetchSalary() {
      setSalaryLoading(true)
      setSalaryError('')
      try {
        const { data } = await api.get('/teacher/salary-overview')
        if (data.success && isMounted) {
          setSalaryData(data.data)
        } else if (isMounted) {
          setSalaryError(data.message || 'Failed to load salary.')
        }
      } catch (err) {
        if (isMounted) {
          setSalaryError(
            err.response?.data?.message || 'Unable to load salary data.'
          )
        }
      } finally {
        if (isMounted) {
          setSalaryLoading(false)
        }
      }
    }
    fetchSalary()
    return () => {
      isMounted = false
    }
  }, [])

  if (!teacher) return null

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
          <div className="absolute top-0 right-0 p-3 opacity-15 text-6xl pointer-events-none group-hover:scale-110 transition-transform duration-300">
            🪙
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-accent">
              Projected Earnings
            </p>
            <h3 className="text-sm font-semibold text-brand-text">This Month</h3>
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
              <div>
                <p className="text-2xl font-extrabold text-brand-text tracking-tight">
                  ₹{salaryData.salary.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-brand-text-muted mt-1">
                  This Month's Projected Salary: <span className="font-semibold text-brand-primary">₹{salaryData.salary}</span>
                </p>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="inline-flex items-center rounded-full bg-brand-primary/10 px-2 py-0.5 text-[9px] font-bold text-brand-primary ring-1 ring-brand-primary/20">
                    {salaryData.compensationType === 'fixed' ? 'Fixed Salary' : `${salaryData.salaryPercentage}% Fee Split`}
                  </span>
                  {salaryData.compensationType === 'percentage' && (
                    <span className="text-[9px] text-brand-text-muted/70">
                      calculated in real-time
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-brand-text-muted">No salary configuration found.</p>
            )}
          </div>
        </div>
      </div>

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
