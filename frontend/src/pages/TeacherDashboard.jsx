import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { clearToken, clearRole } from '../lib/auth'
import AttendanceManager from '../components/shared/AttendanceManager'
import StudentFilterBar from '../components/shared/StudentFilterBar'

// ── Constants ────────────────────────────────────────────────────────────────
const MATERIAL_TYPES = ['Notes', 'Assignment', 'Lecture Link']
const BATCH_OPTIONS = [
  'Morning Batch A',
  'Morning Batch B',
  'Evening Batch A',
  'Evening Batch B',
  'Weekend Batch',
]
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
  Notes: 'bg-violet-50 text-violet-700 ring-violet-200',
  Assignment: 'bg-amber-50 text-amber-700 ring-amber-200',
  'Lecture Link': 'bg-sky-50 text-sky-700 ring-sky-200',
}
const TYPE_ICON = { Notes: '📄', Assignment: '✏️', 'Lecture Link': '🎬' }

function typeBadge(type) {
  return TYPE_BADGE[type] ?? 'bg-slate-50 text-slate-700 ring-slate-200'
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
  const [dashData, setDashData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // Lift a refresh key so upload success refreshes the materials panel
  const [refreshKey, setRefreshKey] = useState(0)

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
    <div className="min-h-screen bg-slate-100 flex">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-20 bg-slate-900/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 flex w-56 flex-col border-r border-slate-200 bg-emerald-900 text-emerald-100 transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-4 py-4 border-b border-emerald-700/60">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300">
            Institute
          </p>
          <h1 className="text-sm font-semibold text-white mt-0.5">Teacher Portal</h1>
        </div>

        {/* Teacher identity */}
        {teacher && (
          <div className="px-4 py-3 border-b border-emerald-700/40">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {teacher.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{teacher.name}</p>
                <p className="text-[10px] text-emerald-400 truncate">{teacher.email}</p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
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
                className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-emerald-300 hover:bg-emerald-800 hover:text-white'
                }`}
              >
                <span className="w-4 text-center text-[11px] opacity-80" aria-hidden>
                  {item.icon}
                </span>
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="px-3 py-3 border-t border-emerald-700/60">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-lg px-2.5 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-800 hover:text-white transition-colors text-left"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
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
                Teacher Portal
              </p>
              <h2 className="text-sm font-semibold text-slate-900 truncate">
                {activeItem?.label ?? 'Dashboard'}
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
        <div className="md:col-span-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white shadow flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200">
              Welcome back
            </p>
            <h2 className="text-xl font-bold mt-1">{teacher.name}</h2>
          </div>
          <p className="text-sm text-emerald-100 mt-4">
            You are managing{' '}
            <span className="font-semibold">{teacher.assignedBatches.length}</span> batch
            {teacher.assignedBatches.length !== 1 ? 'es' : ''}
          </p>
        </div>

        {/* Earnings Card */}
        <div className="rounded-xl border border-teal-100 bg-white p-5 shadow flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-3 opacity-10 text-6xl pointer-events-none group-hover:scale-110 transition-transform">
            🪙
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600">
              Projected Earnings
            </p>
            <h3 className="text-sm font-semibold text-slate-800">This Month</h3>
          </div>
          <div className="mt-4">
            {salaryLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-7 w-28 bg-slate-200 rounded"></div>
                <div className="h-3 w-36 bg-slate-200 rounded"></div>
              </div>
            ) : salaryError ? (
              <div className="text-xs text-red-600">
                <p className="font-medium">Failed to load salary</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{salaryError}</p>
              </div>
            ) : salaryData ? (
              <div>
                <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  ₹{salaryData.salary.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  This Month's Projected Salary: <span className="font-medium text-emerald-600">₹{salaryData.salary}</span>
                </p>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-[9px] font-medium text-teal-700 ring-1 ring-teal-600/10">
                    {salaryData.compensationType === 'fixed' ? 'Fixed Salary' : `${salaryData.salaryPercentage}% Fee Split`}
                  </span>
                  {salaryData.compensationType === 'percentage' && (
                    <span className="text-[9px] text-slate-400">
                      calculated in real-time
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No salary configuration found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Assigned batches */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Assigned Batches</h3>
        {teacher.assignedBatches.length === 0 ? (
          <p className="text-xs text-slate-500 bg-white border border-dashed border-slate-200 rounded-xl px-4 py-6 text-center">
            No batches assigned yet. Contact your Admin to be added to a batch.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {teacher.assignedBatches.map((batch) => (
              <div
                key={batch}
                className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 flex items-center gap-3"
              >
                <span className="text-xl">🏫</span>
                <div>
                  <p className="text-xs font-semibold text-emerald-900">{batch}</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">Active batch</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My uploaded materials */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800">
            My Uploaded Materials
            <span className="ml-2 text-[10px] font-normal text-slate-400">
              {materials.length} item{materials.length !== 1 ? 's' : ''}
            </span>
          </h3>
        </div>
        {materials.length === 0 ? (
          <p className="text-xs text-slate-500 bg-white border border-dashed border-slate-200 rounded-xl px-4 py-6 text-center">
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
          <h3 className="text-sm font-semibold text-slate-800">
            My Uploaded Practice Tests
            <span className="ml-2 text-[10px] font-normal text-slate-400">
              {tests.length} item{tests.length !== 1 ? 's' : ''}
            </span>
          </h3>
        </div>
        {tests.length === 0 ? (
          <p className="text-xs text-slate-500 bg-white border border-dashed border-slate-200 rounded-xl px-4 py-6 text-center">
            You haven't uploaded any practice tests yet. Use the Upload tab to get started.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {tests.map((t) => (
              <div key={t._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 bg-violet-50 text-violet-700 ring-violet-200">
                    📝 Practice Test
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(
                      new Date(t.createdAt)
                    )}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-900 leading-snug line-clamp-2">
                  {t.testTitle}
                </p>
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <span className="font-medium text-slate-600">{t.subject}</span>
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
                    className="mt-auto w-full rounded-lg bg-violet-600 px-3 py-1.5 text-center text-[11px] font-semibold text-white hover:bg-violet-500 transition-colors"
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
    `w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
      errs[field] ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-emerald-400 focus:border-emerald-400'
    }`

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Upload Content</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Upload to: <span className="font-medium text-emerald-700">{assignedBatches.join(', ') || '—'}</span>
        </p>
      </div>

      {/* Sub-tab toggle */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {[
          { id: 'material', label: '📚 Study Material' },
          { id: 'test',     label: '📝 Practice Test'  },
        ].map((t) => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === t.id ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Study Material Form ─────────────────────────────────────────────── */}
      {subTab === 'material' && (
        <>
          {uploadedItem && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
              ✅ <span className="font-medium">"{uploadedItem.title}"</span> uploaded to <span className="font-medium">{uploadedItem.batch}</span>.
            </div>
          )}
          <form onSubmit={handleSubmit} noValidate className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Title *</label>
              <input type="text" value={form.title} onChange={(e) => updateField('title', e.target.value)} placeholder="e.g. Chapter 3 — Quadratic Equations" className={inputCls('title')} />
              {errors.title && <p className="mt-1 text-[11px] text-red-600">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
              <select value={form.materialType} onChange={(e) => updateField('materialType', e.target.value)} className={inputCls('materialType')}>
                {MATERIAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Batch *</label>
              <select value={form.batch} onChange={(e) => updateField('batch', e.target.value)} className={inputCls('batch')}>
                <option value="">— Select batch —</option>
                {assignedBatches.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              {errors.batch && <p className="mt-1 text-[11px] text-red-600">{errors.batch}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Subject *</label>
              <input type="text" list="subject-list" value={form.subject} onChange={(e) => updateField('subject', e.target.value)} placeholder="e.g. Mathematics" className={inputCls('subject')} />
              <datalist id="subject-list">{SUBJECT_OPTIONS.map((s) => <option key={s} value={s} />)}</datalist>
              {errors.subject && <p className="mt-1 text-[11px] text-red-600">{errors.subject}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Chapter <span className="text-slate-400">(optional)</span></label>
              <input type="text" value={form.chapter} onChange={(e) => updateField('chapter', e.target.value)} placeholder="e.g. Chapter 3 – Quadratic Equations" className={inputCls('chapter')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Resource Link / URL *</label>
              <input type="url" value={form.fileUrlOrLink} onChange={(e) => updateField('fileUrlOrLink', e.target.value)} placeholder="https://drive.google.com/..." className={inputCls('fileUrlOrLink')} />
              {errors.fileUrlOrLink && <p className="mt-1 text-[11px] text-red-600">{errors.fileUrlOrLink}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Description <span className="text-slate-400">(optional)</span></label>
              <textarea rows={2} value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Brief note…" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
            </div>
            {serverError && <p role="alert" className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{serverError}</p>}
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60 transition-colors">
              {loading ? 'Uploading…' : 'Upload Material'}
            </button>
          </form>
        </>
      )}

      {/* ── Practice Test Form ──────────────────────────────────────────────── */}
      {subTab === 'test' && (
        <>
          {uploadedTest && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
              ✅ <span className="font-medium">"{uploadedTest.testTitle}"</span> uploaded to <span className="font-medium">{uploadedTest.batch}</span>.
            </div>
          )}
          <form onSubmit={handleTestSubmit} noValidate className="rounded-xl border border-violet-100 bg-white p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Test Title *</label>
              <input type="text" value={testForm.testTitle} onChange={(e) => updateTestField('testTitle', e.target.value)} placeholder="e.g. Chapter 3 Mid-Term Test" className={inputCls('testTitle', testErrors)} />
              {testErrors.testTitle && <p className="mt-1 text-[11px] text-red-600">{testErrors.testTitle}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Batch *</label>
              <select value={testForm.batch} onChange={(e) => updateTestField('batch', e.target.value)} className={inputCls('batch', testErrors)}>
                <option value="">— Select batch —</option>
                {assignedBatches.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              {testErrors.batch && <p className="mt-1 text-[11px] text-red-600">{testErrors.batch}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Subject *</label>
              <input type="text" list="test-subject-list" value={testForm.subject} onChange={(e) => updateTestField('subject', e.target.value)} placeholder="e.g. Mathematics" className={inputCls('subject', testErrors)} />
              <datalist id="test-subject-list">{SUBJECT_OPTIONS.map((s) => <option key={s} value={s} />)}</datalist>
              {testErrors.subject && <p className="mt-1 text-[11px] text-red-600">{testErrors.subject}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Chapter <span className="text-slate-400">(optional)</span></label>
              <input type="text" value={testForm.chapter} onChange={(e) => updateTestField('chapter', e.target.value)} placeholder="e.g. Chapter 3 – Quadratic Equations" className={inputCls('chapter', testErrors)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">No. of Questions <span className="text-slate-400">(optional)</span></label>
              <input type="number" min="1" value={testForm.totalQuestions} onChange={(e) => updateTestField('totalQuestions', e.target.value)} placeholder="e.g. 30" className={inputCls('totalQuestions', testErrors)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Document URL *</label>
              <input type="url" value={testForm.documentUrl} onChange={(e) => updateTestField('documentUrl', e.target.value)} placeholder="https://drive.google.com/..." className={inputCls('documentUrl', testErrors)} />
              {testErrors.documentUrl && <p className="mt-1 text-[11px] text-red-600">{testErrors.documentUrl}</p>}
            </div>
            {testServerError && <p role="alert" className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{testServerError}</p>}
            <button type="submit" disabled={testLoading} className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60 transition-colors">
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
  'Morning Batch A': 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  'Morning Batch B': 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  'Evening Batch A': 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  'Evening Batch B': 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  'Weekend Batch':   'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
}
function batchPill(batch) {
  return BATCH_PILL[batch] ?? 'bg-slate-50 text-slate-600 ring-1 ring-slate-200'
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
          <h2 className="text-base font-semibold text-slate-900">My Students</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of{' '}
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
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">No students found in your assigned batches.</p>
          <p className="text-xs text-slate-400 mt-1">Contact the Admin to assign students to your batches.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">No students match your filter.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 font-semibold text-slate-500 w-10">#</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Student Name</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Batch</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Class</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Subjects</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-4 py-3 text-slate-400 tabular-nums">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {s.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-900">{s.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${batchPill(s.batch)}`}>
                        {s.batch}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{s.studentClass || <span className="text-slate-400">—</span>}</td>
                    <td className="px-4 py-3 text-slate-700">{s.subjects || <span className="text-slate-400">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Footer count */}
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/60 text-right">
            <span className="text-[11px] text-slate-400">
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
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${typeBadge(material.materialType)}`}
        >
          {TYPE_ICON[material.materialType]} {material.materialType}
        </span>
        <span className="text-[10px] text-slate-400 shrink-0">
          {new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(
            new Date(material.createdAt)
          )}
        </span>
      </div>
      <p className="text-xs font-semibold text-slate-900 leading-snug line-clamp-2">
        {material.title}
      </p>
      <p className="text-[11px] text-slate-500 flex items-center gap-1">
        <span className="font-medium text-slate-600">{material.subject}</span>
        <span>·</span>
        <span>{material.batch}</span>
      </p>
      {material.fileUrlOrLink && (
        <a
          href={material.fileUrlOrLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto w-full rounded-lg bg-emerald-600 px-3 py-1.5 text-center text-[11px] font-semibold text-white hover:bg-emerald-500 transition-colors"
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
    <div className="flex items-center justify-center py-20 text-sm text-slate-500">
      Loading your dashboard…
    </div>
  )
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center space-y-3">
      <p className="text-sm font-medium text-red-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors"
      >
        Retry
      </button>
    </div>
  )
}
