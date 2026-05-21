import { useState, useEffect, useCallback } from 'react'
import api from '../../lib/api'

const BATCH_OPTIONS = [
  'Morning Batch A',
  'Morning Batch B',
  'Evening Batch A',
  'Evening Batch B',
  'Weekend Batch',
]

const MATERIAL_TYPES = ['Notes', 'Assignment', 'Lecture Link']

// Per-type visual config
const TYPE_CONFIG = {
  Notes: {
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  Assignment: {
    badge: 'bg-amber-50 text-amber-700 ring-amber-200',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
  },
  'Lecture Link': {
    badge: 'bg-sky-50 text-sky-700 ring-sky-200',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    ),
  },
}

const initialMaterialForm = { title: '', description: '', materialType: MATERIAL_TYPES[0], fileUrlOrLink: '', batch: BATCH_OPTIONS[0], subject: '', chapter: '' }
const initialTestForm = { testTitle: '', subject: '', chapter: '', totalQuestions: '', documentUrl: '', batch: BATCH_OPTIONS[0] }

function validateMaterialForm(form) {
  const errs = {}
  if (!form.title.trim()) errs.title = 'Title is required.'
  if (!form.subject.trim()) errs.subject = 'Subject is required.'
  if (!form.fileUrlOrLink.trim()) { errs.fileUrlOrLink = 'A URL is required.' }
  else { try { new URL(form.fileUrlOrLink.trim()) } catch { errs.fileUrlOrLink = 'Enter a valid URL (https://…).' } }
  return errs
}
function validateTestForm(form) {
  const errs = {}
  if (!form.testTitle.trim()) errs.testTitle = 'Test title is required.'
  if (!form.subject.trim()) errs.subject = 'Subject is required.'
  if (!form.documentUrl.trim()) { errs.documentUrl = 'A URL is required.' }
  else { try { new URL(form.documentUrl.trim()) } catch { errs.documentUrl = 'Enter a valid URL (https://…).' } }
  return errs
}

// ── Field wrapper with inline error ──────────────────────────────────────────
function FormField({ label, htmlFor, error, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      {children}
      {error && (
        <p className="mt-1 text-[11px] text-red-600 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          {error}
        </p>
      )}
    </div>
  )
}

// ── Material Card ─────────────────────────────────────────────────────────────
function MaterialCard({ item, onDelete }) {
  const config = TYPE_CONFIG[item.materialType] ?? TYPE_CONFIG['Notes']
  return (
    <div className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ring-1 ${config.badge}`}>
          {config.icon}{item.materialType}
        </span>
        <button type="button" onClick={() => onDelete(item._id)} title="Delete"
          className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-0.5 rounded">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
        </button>
      </div>
      <h4 className="text-sm font-semibold text-slate-900 leading-snug mb-1.5">{item.title}</h4>
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{item.subject}</span>
        {item.chapter && <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">{item.chapter}</span>}
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{item.batch}</span>
      </div>
      {item.description && <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 mb-2.5 flex-1">{item.description}</p>}
      <a href={item.fileUrlOrLink} target="_blank" rel="noopener noreferrer"
        className="mt-auto block text-center rounded-lg bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-700 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors">
        Open Resource ↗
      </a>
    </div>
  )
}

// ── Test Card ─────────────────────────────────────────────────────────────────
function TestCard({ item, onDelete }) {
  return (
    <div className="group relative flex flex-col rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50/60 to-white p-3.5 shadow-sm hover:shadow-md hover:border-violet-200 transition-all">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide bg-violet-50 text-violet-700 ring-1 ring-violet-200">
          📝 Practice Test
        </span>
        <button type="button" onClick={() => onDelete(item._id)} title="Delete"
          className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-0.5 rounded">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
        </button>
      </div>
      <h4 className="text-sm font-semibold text-slate-900 leading-snug mb-1.5">{item.testTitle}</h4>
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{item.subject}</span>
        {item.chapter && <span className="rounded-md bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600">{item.chapter}</span>}
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{item.batch}</span>
        {item.totalQuestions && <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-600">{item.totalQuestions} Qs</span>}
      </div>
      <a href={item.documentUrl} target="_blank" rel="noopener noreferrer"
        className="mt-auto block text-center rounded-lg bg-violet-50 px-3 py-1.5 text-[11px] font-semibold text-violet-700 border border-violet-200 hover:bg-violet-100 transition-colors">
        Open Test Paper ↗
      </a>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ContentManager() {
  const [activeTab, setActiveTab] = useState('materials')  // 'materials' | 'tests'

  // ── Study Materials state ─────────────────────────────────────────────────
  const [materials,     setMaterials]     = useState([])
  const [matLoading,    setMatLoading]    = useState(true)
  const [matListError,  setMatListError]  = useState('')
  const [matForm,       setMatForm]       = useState(initialMaterialForm)
  const [matFieldErrs,  setMatFieldErrs]  = useState({})
  const [matUploading,  setMatUploading]  = useState(false)
  const [matUploadErr,  setMatUploadErr]  = useState('')
  const [matUploadOk,   setMatUploadOk]   = useState('')

  // ── Practice Tests state ──────────────────────────────────────────────────
  const [tests,         setTests]         = useState([])
  const [testLoading,   setTestLoading]   = useState(true)
  const [testListError, setTestListError] = useState('')
  const [testForm,      setTestForm]      = useState(initialTestForm)
  const [testFieldErrs, setTestFieldErrs] = useState({})
  const [testUploading, setTestUploading] = useState(false)
  const [testUploadErr, setTestUploadErr] = useState('')
  const [testUploadOk,  setTestUploadOk]  = useState('')

  // ── Loaders ───────────────────────────────────────────────────────────────
  const loadMaterials = useCallback(async () => {
    setMatLoading(true); setMatListError('')
    try {
      const { data } = await api.get('/content')
      if (data.success) setMaterials(data.data)
      else setMatListError(data.message || 'Failed to load materials.')
    } catch (err) {
      setMatListError(err.response?.data?.message || (err.request ? 'Unable to reach the server.' : 'Failed to load.'))
    } finally { setMatLoading(false) }
  }, [])

  const loadTests = useCallback(async () => {
    setTestLoading(true); setTestListError('')
    try {
      const { data } = await api.get('/tests')
      if (data.success) setTests(data.data)
      else setTestListError(data.message || 'Failed to load tests.')
    } catch (err) {
      setTestListError(err.response?.data?.message || (err.request ? 'Unable to reach the server.' : 'Failed to load.'))
    } finally { setTestLoading(false) }
  }, [])

  useEffect(() => { loadMaterials() }, [loadMaterials])
  useEffect(() => { loadTests() }, [loadTests])

  // ── Material form handlers ─────────────────────────────────────────────────
  function updateMatField(field, value) {
    setMatForm((p) => ({ ...p, [field]: value }))
    if (matFieldErrs[field]) setMatFieldErrs((p) => { const n = { ...p }; delete n[field]; return n })
    setMatUploadErr(''); setMatUploadOk('')
  }

  async function handleMaterialUpload(e) {
    e.preventDefault()
    const errs = validateMaterialForm(matForm)
    if (Object.keys(errs).length) { setMatFieldErrs(errs); return }
    setMatFieldErrs({}); setMatUploading(true); setMatUploadErr(''); setMatUploadOk('')
    try {
      const { data } = await api.post('/content', {
        title: matForm.title.trim(), description: matForm.description.trim(),
        materialType: matForm.materialType, fileUrlOrLink: matForm.fileUrlOrLink.trim(),
        batch: matForm.batch, subject: matForm.subject.trim(), chapter: matForm.chapter.trim(),
      })
      if (data.success) {
        setMatUploadOk(`"${data.data.title}" uploaded successfully!`)
        setMaterials((p) => [data.data, ...p])
        setMatForm(initialMaterialForm); setMatFieldErrs({})
      } else { setMatUploadErr(data.message || 'Upload failed.') }
    } catch (err) {
      setMatUploadErr(err.response?.data?.message || (err.request ? 'Unable to reach the server.' : 'Something went wrong.'))
    } finally { setMatUploading(false) }
  }

  async function handleMaterialDelete(id) {
    if (!window.confirm('Delete this material? This cannot be undone.')) return
    setMaterials((p) => p.filter((m) => m._id !== id))
    try { const { data } = await api.delete(`/content/${id}`); if (!data.success) { loadMaterials(); alert(data.message || 'Failed.') } }
    catch { loadMaterials(); alert('Error deleting material.') }
  }

  // ── Test form handlers ─────────────────────────────────────────────────────
  function updateTestField(field, value) {
    setTestForm((p) => ({ ...p, [field]: value }))
    if (testFieldErrs[field]) setTestFieldErrs((p) => { const n = { ...p }; delete n[field]; return n })
    setTestUploadErr(''); setTestUploadOk('')
  }

  async function handleTestUpload(e) {
    e.preventDefault()
    const errs = validateTestForm(testForm)
    if (Object.keys(errs).length) { setTestFieldErrs(errs); return }
    setTestFieldErrs({}); setTestUploading(true); setTestUploadErr(''); setTestUploadOk('')
    try {
      const { data } = await api.post('/tests', {
        testTitle: testForm.testTitle.trim(), subject: testForm.subject.trim(),
        chapter: testForm.chapter.trim(), documentUrl: testForm.documentUrl.trim(),
        batch: testForm.batch,
        totalQuestions: testForm.totalQuestions ? Number(testForm.totalQuestions) : null,
      })
      if (data.success) {
        setTestUploadOk(`"${data.data.testTitle}" uploaded successfully!`)
        setTests((p) => [data.data, ...p])
        setTestForm(initialTestForm); setTestFieldErrs({})
      } else { setTestUploadErr(data.message || 'Upload failed.') }
    } catch (err) {
      setTestUploadErr(err.response?.data?.message || (err.request ? 'Unable to reach the server.' : 'Something went wrong.'))
    } finally { setTestUploading(false) }
  }

  async function handleTestDelete(id) {
    if (!window.confirm('Delete this test? This cannot be undone.')) return
    setTests((p) => p.filter((t) => t._id !== id))
    try { const { data } = await api.delete(`/tests/${id}`); if (!data.success) { loadTests(); alert(data.message || 'Failed.') } }
    catch { loadTests(); alert('Error deleting test.') }
  }

  function inputCls(errs, field) {
    const base = 'w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors'
    return errs[field] ? `${base} border-red-400 bg-red-50/40 focus:ring-red-400` : `${base} border-slate-300 bg-white focus:ring-indigo-500`
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Content Manager</h2>
          <p className="text-xs text-slate-500 mt-0.5">Upload and manage study materials and practice tests across batches.</p>
        </div>
        {/* Tab pills */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
          {[
            { id: 'materials', label: '📚 Study Materials', count: materials.length },
            { id: 'tests',     label: '📝 Practice Tests',  count: tests.length     },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeTab === tab.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── STUDY MATERIALS TAB ───────────────────────────────────────────────── */}
      {activeTab === 'materials' && (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr] items-start">
          {/* Upload Form */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm lg:sticky lg:top-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Upload New Material</h3>
            {matUploadOk && <p role="status" className="mb-4 flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">✓ {matUploadOk}</p>}
            {matUploadErr && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{matUploadErr}</p>}
            <form onSubmit={handleMaterialUpload} noValidate className="space-y-4">
              <FormField label="Title" htmlFor="cm-title" error={matFieldErrs.title}>
                <input id="cm-title" type="text" value={matForm.title} onChange={(e) => updateMatField('title', e.target.value)} placeholder="e.g. Algebra Basics" className={inputCls(matFieldErrs, 'title')} />
              </FormField>
              <FormField label="Subject" htmlFor="cm-subject" error={matFieldErrs.subject}>
                <input id="cm-subject" type="text" value={matForm.subject} onChange={(e) => updateMatField('subject', e.target.value)} placeholder="e.g. Mathematics" className={inputCls(matFieldErrs, 'subject')} />
              </FormField>
              <FormField label="Chapter (optional)" htmlFor="cm-chapter" error={matFieldErrs.chapter}>
                <input id="cm-chapter" type="text" value={matForm.chapter} onChange={(e) => updateMatField('chapter', e.target.value)} placeholder="e.g. Chapter 3 – Quadratic Equations" className={inputCls(matFieldErrs, 'chapter')} />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Batch" htmlFor="cm-batch">
                  <select id="cm-batch" value={matForm.batch} onChange={(e) => updateMatField('batch', e.target.value)} className={inputCls(matFieldErrs, 'batch')}>
                    {BATCH_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </FormField>
                <FormField label="Type" htmlFor="cm-type">
                  <select id="cm-type" value={matForm.materialType} onChange={(e) => updateMatField('materialType', e.target.value)} className={inputCls(matFieldErrs, 'materialType')}>
                    {MATERIAL_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </FormField>
              </div>
              <FormField label="File URL or Link" htmlFor="cm-url" error={matFieldErrs.fileUrlOrLink}>
                <input id="cm-url" type="url" value={matForm.fileUrlOrLink} onChange={(e) => updateMatField('fileUrlOrLink', e.target.value)} placeholder="https://..." className={inputCls(matFieldErrs, 'fileUrlOrLink')} />
              </FormField>
              <FormField label="Description (optional)" htmlFor="cm-desc">
                <textarea id="cm-desc" rows={2} value={matForm.description} onChange={(e) => updateMatField('description', e.target.value)} placeholder="Short description..." className={`${inputCls(matFieldErrs, 'description')} resize-none`} />
              </FormField>
              <button type="submit" disabled={matUploading} className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-60 transition-all">
                {matUploading ? 'Uploading…' : 'Upload Material'}
              </button>
            </form>
          </section>

          {/* List */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Uploaded Materials</h3>
                {!matLoading && <p className="text-[11px] text-slate-400 mt-0.5">{materials.length === 0 ? 'No materials yet' : `${materials.length} item${materials.length === 1 ? '' : 's'}`}</p>}
              </div>
              <button onClick={loadMaterials} disabled={matLoading} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">
                {matLoading ? 'Loading…' : 'Refresh'}
              </button>
            </div>
            {matLoading ? <div className="p-10 text-center text-xs text-slate-400">Loading materials…</div>
              : matListError ? <p role="alert" className="m-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">{matListError}</p>
              : materials.length === 0 ? <div className="p-10 text-center"><p className="text-xs text-slate-400">No materials uploaded yet. Use the form to add your first resource.</p></div>
              : <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">{materials.map((item) => <MaterialCard key={item._id} item={item} onDelete={handleMaterialDelete} />)}</div>
            }
          </section>
        </div>
      )}

      {/* ── PRACTICE TESTS TAB ────────────────────────────────────────────────── */}
      {activeTab === 'tests' && (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr] items-start">
          {/* Upload Form */}
          <section className="rounded-xl border border-violet-100 bg-white p-4 sm:p-5 shadow-sm lg:sticky lg:top-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Upload Practice Test</h3>
            <p className="text-[11px] text-slate-500 mb-4">Upload exam papers, sample tests, or practice PDFs.</p>
            {testUploadOk && <p role="status" className="mb-4 flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">✓ {testUploadOk}</p>}
            {testUploadErr && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{testUploadErr}</p>}
            <form onSubmit={handleTestUpload} noValidate className="space-y-4">
              <FormField label="Test Title" htmlFor="ct-title" error={testFieldErrs.testTitle}>
                <input id="ct-title" type="text" value={testForm.testTitle} onChange={(e) => updateTestField('testTitle', e.target.value)} placeholder="e.g. Chapter 3 – Mid-Term Test" className={inputCls(testFieldErrs, 'testTitle')} />
              </FormField>
              <FormField label="Subject" htmlFor="ct-subject" error={testFieldErrs.subject}>
                <input id="ct-subject" type="text" value={testForm.subject} onChange={(e) => updateTestField('subject', e.target.value)} placeholder="e.g. Mathematics" className={inputCls(testFieldErrs, 'subject')} />
              </FormField>
              <FormField label="Chapter (optional)" htmlFor="ct-chapter">
                <input id="ct-chapter" type="text" value={testForm.chapter} onChange={(e) => updateTestField('chapter', e.target.value)} placeholder="e.g. Chapter 3 – Quadratic Equations" className={inputCls(testFieldErrs, 'chapter')} />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Batch" htmlFor="ct-batch">
                  <select id="ct-batch" value={testForm.batch} onChange={(e) => updateTestField('batch', e.target.value)} className={inputCls(testFieldErrs, 'batch')}>
                    {BATCH_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </FormField>
                <FormField label="No. of Questions" htmlFor="ct-qs">
                  <input id="ct-qs" type="number" min="1" value={testForm.totalQuestions} onChange={(e) => updateTestField('totalQuestions', e.target.value)} placeholder="Optional" className={inputCls(testFieldErrs, 'totalQuestions')} />
                </FormField>
              </div>
              <FormField label="Document URL" htmlFor="ct-url" error={testFieldErrs.documentUrl}>
                <input id="ct-url" type="url" value={testForm.documentUrl} onChange={(e) => updateTestField('documentUrl', e.target.value)} placeholder="https://..." className={inputCls(testFieldErrs, 'documentUrl')} />
              </FormField>
              <button type="submit" disabled={testUploading} className="w-full rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 active:scale-[0.98] disabled:opacity-60 transition-all">
                {testUploading ? 'Uploading…' : 'Upload Test Paper'}
              </button>
            </form>
          </section>

          {/* List */}
          <section className="rounded-xl border border-violet-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-violet-100 bg-violet-50/40">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Uploaded Practice Tests</h3>
                {!testLoading && <p className="text-[11px] text-slate-400 mt-0.5">{tests.length === 0 ? 'No tests yet' : `${tests.length} test${tests.length === 1 ? '' : 's'}`}</p>}
              </div>
              <button onClick={loadTests} disabled={testLoading} className="rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-violet-600 hover:bg-violet-50 disabled:opacity-50 transition-colors">
                {testLoading ? 'Loading…' : 'Refresh'}
              </button>
            </div>
            {testLoading ? <div className="p-10 text-center text-xs text-slate-400">Loading tests…</div>
              : testListError ? <p role="alert" className="m-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">{testListError}</p>
              : tests.length === 0 ? <div className="p-10 text-center"><p className="text-xs text-slate-400">No tests uploaded yet. Use the form to add your first practice paper.</p></div>
              : <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">{tests.map((item) => <TestCard key={item._id} item={item} onDelete={handleTestDelete} />)}</div>
            }
          </section>
        </div>
      )}
    </div>
  )
}
