import { useState, useEffect, useCallback } from 'react'
import api from '../../lib/api'
import useBatches from '../../hooks/useBatches'
import {
  ClipboardList,
  Plus,
  ChevronDown,
  ChevronUp,
  Save,
  Trash2,
  X,
  CheckSquare,
  Square,
  BarChart2,
  Trophy,
  Users,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react'

const CLASS_OPTIONS = [
  'All Classes',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
]

function fmtDate(d) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(d))
}

function calcStats(exam) {
  if (!exam?.studentMarks) return null
  const taken = exam.studentMarks.filter(
    (s) => !s.isAbsent && s.marksObtained !== null && s.marksObtained !== undefined
  )
  if (!taken.length) return null
  const total = exam.totalMarks || 100
  const scores = taken.map((s) => s.marksObtained)
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  const highest = Math.max(...scores)
  const lowest = Math.min(...scores)
  const passed = scores.filter((s) => (s / total) * 100 >= 33).length
  return {
    avg: avg.toFixed(1),
    highest,
    lowest,
    passed,
    appeared: taken.length,
    absent: exam.studentMarks.filter((s) => s.isAbsent).length,
  }
}

export default function ExamMarks({ allowedBatches = [], isAdmin = false }) {
  const { batches: allBatches } = useBatches()
  const batchOptions = allowedBatches.length > 0 ? allowedBatches : allBatches

  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [savingId, setSavingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [localMarks, setLocalMarks] = useState({})

  // Form State
  const [form, setForm] = useState({
    testName: '',
    subject: '',
    batch: '',
    studentClass: '',
    totalMarks: '100',
    examDate: new Date().toISOString().split('T')[0],
  })
  const [formStudents, setFormStudents] = useState([])
  const [formMarks, setFormMarks] = useState({}) // { [studentId]: { marksObtained: '', isAbsent: false } }
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [formErr, setFormErr] = useState('')
  const [creating, setCreating] = useState(false)

  // Load all exams
  const loadExams = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/exam-results', { params: { limit: 50 } })
      if (data.success) {
        setExams(data.data)
        const lm = {}
        for (const exam of data.data) {
          lm[exam._id] = {}
          for (const sm of exam.studentMarks) {
            lm[exam._id][String(sm.student)] = {
              marksObtained: sm.marksObtained ?? '',
              isAbsent: sm.isAbsent ?? false,
            }
          }
        }
        setLocalMarks(lm)
      } else {
        setError(data.message || 'Failed to load exams.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load test records.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadExams()
  }, [loadExams])

  // Set default batch when options load
  useEffect(() => {
    if (!form.batch && batchOptions.length > 0) {
      setForm((f) => ({ ...f, batch: batchOptions[0] }))
    }
  }, [batchOptions, form.batch])

  // Fetch students whenever Batch or Class changes in the form
  useEffect(() => {
    if (!showForm || !form.batch) return

    let isMounted = true
    async function fetchStudents() {
      setLoadingStudents(true)
      try {
        const { data } = await api.get('/exam-results/students', {
          params: {
            batch: form.batch,
            studentClass: form.studentClass && form.studentClass !== 'All Classes' ? form.studentClass : undefined,
          },
        })
        if (isMounted && data.success) {
          setFormStudents(data.data)
          // preserve existing entered marks where possible
          setFormMarks((prev) => {
            const next = {}
            for (const s of data.data) {
              next[s.id] = prev[s.id] || { marksObtained: '', isAbsent: false }
            }
            return next
          })
        }
      } catch (err) {
        console.error('Failed to load students for batch', err)
      } finally {
        if (isMounted) setLoadingStudents(false)
      }
    }

    fetchStudents()
    return () => {
      isMounted = false
    }
  }, [showForm, form.batch, form.studentClass])

  // Handle Form Mark Change
  function handleFormMarkChange(studentId, field, value) {
    setFormMarks((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }))
  }

  // Submit New Test & Marks
  async function handleCreate(e) {
    e.preventDefault()
    setFormErr('')

    if (!form.testName.trim()) {
      setFormErr('Test name is required.')
      return
    }
    if (!form.batch.trim()) {
      setFormErr('Please select a batch.')
      return
    }
    if (!form.totalMarks || Number(form.totalMarks) < 1) {
      setFormErr('Total marks must be at least 1.')
      return
    }

    setCreating(true)
    try {
      // Build student marks payload
      const studentMarksPayload = formStudents.map((s) => {
        const m = formMarks[s.id] || { marksObtained: '', isAbsent: false }
        return {
          studentId: s.id,
          studentName: s.name,
          studentRollNo: s.rollNo || '',
          isAbsent: !!m.isAbsent,
          marksObtained: m.isAbsent
            ? null
            : m.marksObtained !== '' && m.marksObtained !== null && m.marksObtained !== undefined
            ? Number(m.marksObtained)
            : null,
        }
      })

      const { data } = await api.post('/exam-results', {
        testName: form.testName.trim(),
        subject: form.subject.trim(),
        batch: form.batch.trim(),
        studentClass: form.studentClass && form.studentClass !== 'All Classes' ? form.studentClass.trim() : '',
        totalMarks: Number(form.totalMarks),
        examDate: form.examDate || undefined,
        studentMarks: studentMarksPayload,
      })

      if (data.success) {
        const newExam = data.data
        setExams((prev) => [newExam, ...prev])

        // initialise local marks for the new test in the list
        const lm = {}
        for (const sm of newExam.studentMarks) {
          lm[String(sm.student)] = {
            marksObtained: sm.marksObtained ?? '',
            isAbsent: sm.isAbsent ?? false,
          }
        }
        setLocalMarks((prev) => ({ ...prev, [newExam._id]: lm }))
        setExpandedId(newExam._id)
        setShowForm(false)
        setForm({
          testName: '',
          subject: '',
          batch: batchOptions[0] || '',
          studentClass: '',
          totalMarks: '100',
          examDate: new Date().toISOString().split('T')[0],
        })
        setFormMarks({})
      } else {
        setFormErr(data.message || 'Failed to create test.')
      }
    } catch (err) {
      setFormErr(err.response?.data?.message || err.message || 'Failed to create test.')
    } finally {
      setCreating(false)
    }
  }

  // Update marks for an existing test in the list
  async function handleSaveMarks(examId) {
    setSavingId(examId)
    const exam = exams.find((e) => e._id === examId)
    if (!exam) return

    const marks = exam.studentMarks.map((sm) => {
      const local = localMarks[examId]?.[String(sm.student)]
      return {
        studentId: sm.student,
        isAbsent: local?.isAbsent ?? false,
        marksObtained: local?.isAbsent
          ? null
          : local?.marksObtained === '' || local?.marksObtained === null || local?.marksObtained === undefined
          ? null
          : Number(local?.marksObtained),
      }
    })

    try {
      const { data } = await api.patch(`/exam-results/${examId}/marks`, { marks })
      if (data.success) {
        setExams((prev) => prev.map((e) => (e._id === examId ? data.data : e)))
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save marks.')
    } finally {
      setSavingId(null)
    }
  }

  // Delete test
  async function handleDelete(examId) {
    if (!window.confirm('Are you sure you want to delete this test and its marks?')) return
    setDeletingId(examId)
    try {
      await api.delete(`/exam-results/${examId}`)
      setExams((prev) => prev.filter((e) => e._id !== examId))
      if (expandedId === examId) setExpandedId(null)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete test.')
    } finally {
      setDeletingId(null)
    }
  }

  function handleMarkChange(examId, studentId, field, value) {
    setLocalMarks((prev) => ({
      ...prev,
      [examId]: {
        ...prev[examId],
        [String(studentId)]: {
          ...prev[examId]?.[String(studentId)],
          [field]: value,
        },
      },
    }))
  }

  const recentTests = exams.slice(0, 3)

  return (
    <div className="space-y-6">
      {/* ── Top Header Bar ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-brand-surface p-5 rounded-2xl border border-brand-border shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold">
              <ClipboardList size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-brand-text tracking-tight">
                Institute Tests &amp; Marks
              </h2>
              <p className="text-xs text-brand-text-muted">
                Record and manage offline class test scores for students.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowForm((v) => !v)
            setFormErr('')
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-primary text-brand-surface px-4 py-2.5 text-xs font-bold hover:bg-brand-primary/90 transition-all shadow-sm cursor-pointer shrink-0"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          <span>{showForm ? 'Close Form' : 'Add Test & Enter Marks'}</span>
        </button>
      </div>

      {/* ── Add Test & Enter Marks Form ───────────────────────────────── */}
      {showForm && (
        <div className="rounded-2xl border-2 border-brand-primary/30 bg-brand-surface p-4 sm:p-6 shadow-md animate-fadeIn space-y-5 sm:space-y-6">
          <div className="flex items-center justify-between border-b border-brand-border pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-brand-text flex items-center gap-2">
                <Sparkles size={16} className="text-brand-primary" />
                Add New Institute Test
              </h3>
              <p className="text-[11px] text-brand-text-muted mt-0.5">
                Select the batch &amp; class to view enrolled students, then add their marks directly below.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="p-1.5 rounded-lg text-brand-text-muted hover:bg-brand-surface-tint"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-6">
            {/* Step 1: Test Details */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Test Name */}
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-text-muted mb-1">
                  Test Name / Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weekly Test 3, Algebra Unit 1"
                  value={form.testName}
                  onChange={(e) => setForm((f) => ({ ...f, testName: e.target.value }))}
                  className="w-full rounded-xl border border-brand-border bg-brand-surface-tint px-3 py-2 text-xs font-semibold text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  required
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-text-muted mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics, Science"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  className="w-full rounded-xl border border-brand-border bg-brand-surface-tint px-3 py-2 text-xs font-semibold text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              {/* Batch */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-text-muted mb-1">
                  Select Batch *
                </label>
                {batchOptions.length > 0 ? (
                  <select
                    value={form.batch}
                    onChange={(e) => setForm((f) => ({ ...f, batch: e.target.value }))}
                    className="w-full rounded-xl border border-brand-border bg-brand-surface-tint px-3 py-2 text-xs font-bold text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
                    required
                  >
                    <option value="">Select batch…</option>
                    {batchOptions.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Enter batch name"
                    value={form.batch}
                    onChange={(e) => setForm((f) => ({ ...f, batch: e.target.value }))}
                    className="w-full rounded-xl border border-brand-border bg-brand-surface-tint px-3 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    required
                  />
                )}
              </div>

              {/* Class */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-text-muted mb-1">
                  Class (Filter Batch)
                </label>
                <select
                  value={form.studentClass}
                  onChange={(e) => setForm((f) => ({ ...f, studentClass: e.target.value }))}
                  className="w-full rounded-xl border border-brand-border bg-brand-surface-tint px-3 py-2 text-xs font-semibold text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
                >
                  <option value="">All Classes in Batch</option>
                  {CLASS_OPTIONS.filter((c) => c !== 'All Classes').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Total Marks */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-text-muted mb-1">
                  Total Marks *
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 50, 100"
                  value={form.totalMarks}
                  onChange={(e) => setForm((f) => ({ ...f, totalMarks: e.target.value }))}
                  className="w-full rounded-xl border border-brand-border bg-brand-surface-tint px-3 py-2 text-xs font-bold text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  required
                />
              </div>

              {/* Exam Date */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-text-muted mb-1">
                  Exam Date
                </label>
                <input
                  type="date"
                  value={form.examDate}
                  onChange={(e) => setForm((f) => ({ ...f, examDate: e.target.value }))}
                  className="w-full rounded-xl border border-brand-border bg-brand-surface-tint px-3 py-2 text-xs font-semibold text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            </div>

            {/* Step 2: Student Marks Entry Table */}
            <div className="rounded-2xl border border-brand-border bg-brand-surface-tint/40 p-3 sm:p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-brand-border/60 pb-2.5">
                <div className="flex items-center justify-between sm:justify-start gap-2.5 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Users size={16} className="text-brand-primary shrink-0" />
                    <span className="text-xs font-extrabold text-brand-text truncate">
                      Enter Marks for Students {form.batch ? `(${form.batch})` : ''}
                    </span>
                  </div>
                  <span className="inline-flex items-center justify-center shrink-0 whitespace-nowrap rounded-full bg-brand-primary/10 text-brand-primary px-2.5 py-0.5 text-[10px] font-bold leading-normal">
                    {formStudents.length} student{formStudents.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <span className="text-[10px] text-brand-text-muted font-medium">
                  Type marks or check Absent for each student
                </span>
              </div>

              {loadingStudents ? (
                <div className="py-8 text-center text-xs text-brand-text-muted animate-pulse">
                  Loading students for {form.batch}…
                </div>
              ) : formStudents.length === 0 ? (
                <div className="py-8 text-center text-xs text-brand-text-muted">
                  No active students found in batch{' '}
                  <span className="font-bold text-brand-text">"{form.batch}"</span>
                  {form.studentClass ? ` (${form.studentClass})` : ''}.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                  {/* Desktop Table Headers */}
                  <div className="hidden sm:grid sm:grid-cols-[120px_1fr_auto_65px] gap-3 items-center px-3 text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                    <span>Marks (/{form.totalMarks || 100})</span>
                    <span>Student Name</span>
                    <span className="text-center">Absent</span>
                    <span className="text-right">Score %</span>
                  </div>

                  {formStudents.map((s) => {
                    const m = formMarks[s.id] || { marksObtained: '', isAbsent: false }
                    const total = Number(form.totalMarks) || 100
                    const pct =
                      !m.isAbsent && m.marksObtained !== '' && m.marksObtained !== null
                        ? ((Number(m.marksObtained) / total) * 100).toFixed(1)
                        : null
                    const pctColor =
                      pct === null
                        ? ''
                        : Number(pct) >= 75
                        ? 'text-emerald-600 font-bold'
                        : Number(pct) >= 33
                        ? 'text-amber-600 font-semibold'
                        : 'text-red-500 font-bold'

                    return (
                      <div key={s.id}>
                        {/* Desktop View (sm and up) */}
                        <div
                          className={`hidden sm:grid sm:grid-cols-[120px_1fr_auto_65px] gap-3 items-center rounded-xl px-3 py-2 transition-all ${
                            m.isAbsent
                              ? 'bg-red-50/70 border border-red-200'
                              : 'bg-brand-surface border border-brand-border/70 hover:border-brand-primary/40'
                          }`}
                        >
                          {/* Marks Input */}
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max={form.totalMarks || 100}
                              disabled={m.isAbsent}
                              placeholder={m.isAbsent ? 'Absent' : `0–${form.totalMarks || 100}`}
                              value={m.isAbsent ? '' : m.marksObtained}
                              onChange={(e) => handleFormMarkChange(s.id, 'marksObtained', e.target.value)}
                              className="w-full rounded-lg border border-brand-border bg-brand-surface-tint px-2.5 py-1.5 text-xs font-bold text-center text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-40 disabled:bg-gray-100"
                            />
                          </div>

                          {/* Student Name & Class */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              {s.rollNo && (
                                <span className="font-mono text-[10px] font-extrabold text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded ring-1 ring-brand-primary/20 shrink-0">
                                  {s.rollNo}
                                </span>
                              )}
                              <p
                                className={`text-xs font-bold truncate ${
                                  m.isAbsent ? 'text-red-500 line-through' : 'text-brand-text'
                                }`}
                              >
                                {s.name}
                              </p>
                            </div>
                            {s.studentClass && (
                              <p className="text-[10px] text-brand-text-muted truncate">{s.studentClass}</p>
                            )}
                          </div>

                          {/* Absent Toggle */}
                          <button
                            type="button"
                            onClick={() => handleFormMarkChange(s.id, 'isAbsent', !m.isAbsent)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              m.isAbsent
                                ? 'text-red-500 hover:text-red-700 bg-red-100/60'
                                : 'text-brand-text-muted/40 hover:text-red-400 hover:bg-brand-surface-tint'
                            }`}
                            title={m.isAbsent ? 'Mark Present' : 'Mark Absent'}
                          >
                            {m.isAbsent ? <CheckSquare size={16} /> : <Square size={16} />}
                          </button>

                          {/* Calculated % */}
                          <span className={`text-xs text-right font-bold ${pctColor || 'text-brand-text-muted/40'}`}>
                            {pct !== null ? `${pct}%` : '—'}
                          </span>
                        </div>

                        {/* Mobile View (< sm) */}
                        <div
                          className={`sm:hidden rounded-xl p-3 space-y-2.5 transition-all ${
                            m.isAbsent
                              ? 'bg-red-50/80 border border-red-200'
                              : 'bg-brand-surface border border-brand-border/80 shadow-2xs'
                          }`}
                        >
                          {/* Student Info Top Row */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              {s.rollNo && (
                                <span className="font-mono text-[10px] font-extrabold text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded ring-1 ring-brand-primary/20 shrink-0">
                                  {s.rollNo}
                                </span>
                              )}
                              <div className="min-w-0">
                                <p
                                  className={`text-xs font-bold truncate ${
                                    m.isAbsent ? 'text-red-500 line-through' : 'text-brand-text'
                                  }`}
                                >
                                  {s.name}
                                </p>
                                {s.studentClass && (
                                  <p className="text-[10px] text-brand-text-muted truncate">{s.studentClass}</p>
                                )}
                              </div>
                            </div>

                            {/* Percentage or Absent Pill */}
                            {m.isAbsent ? (
                              <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-md shrink-0">
                                Absent
                              </span>
                            ) : pct !== null ? (
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded-md bg-brand-surface-tint border border-brand-border/60 shrink-0 ${pctColor}`}
                              >
                                {pct}%
                              </span>
                            ) : null}
                          </div>

                          {/* Marks Input & Absent Toggle Bottom Row */}
                          <div className="flex items-center gap-2 pt-1.5 border-t border-brand-border/40">
                            <div className="flex-1 flex items-center gap-1.5 min-w-0">
                              <span className="text-[10px] font-bold text-brand-text-muted uppercase shrink-0">Marks:</span>
                              <input
                                type="number"
                                min="0"
                                max={form.totalMarks || 100}
                                disabled={m.isAbsent}
                                placeholder={m.isAbsent ? 'Absent' : `0–${form.totalMarks || 100}`}
                                value={m.isAbsent ? '' : m.marksObtained}
                                onChange={(e) => handleFormMarkChange(s.id, 'marksObtained', e.target.value)}
                                className="w-full rounded-lg border border-brand-border bg-brand-surface-tint px-2.5 py-1.5 text-xs font-bold text-center text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-40 disabled:bg-gray-100"
                              />
                              <span className="text-[10px] font-bold text-brand-text-muted shrink-0">
                                /{form.totalMarks || 100}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleFormMarkChange(s.id, 'isAbsent', !m.isAbsent)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                m.isAbsent
                                  ? 'bg-red-100 text-red-600 border border-red-200'
                                  : 'bg-brand-surface-tint text-brand-text-muted hover:text-brand-text border border-brand-border'
                              }`}
                            >
                              {m.isAbsent ? <CheckSquare size={14} /> : <Square size={14} />}
                              <span>Absent</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {formErr && (
              <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5">
                {formErr}
              </div>
            )}

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3 pt-2">
              <button
                type="submit"
                disabled={creating}
                className="w-full sm:w-auto rounded-xl bg-brand-primary text-brand-surface px-6 py-2.5 text-xs font-bold hover:bg-brand-primary/90 disabled:opacity-60 transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <Save size={14} />
                <span>{creating ? 'Saving Test & Marks…' : 'Save Test & Marks'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setFormErr('')
                }}
                className="w-full sm:w-auto rounded-xl border border-brand-border bg-brand-surface text-brand-text-muted px-4 py-2.5 text-xs font-semibold hover:bg-brand-surface-tint transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Recent 3 Tests Section (Hidden on Mobile) ──────────────────── */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-brand-text">Recent Tests of Classes</h3>
            <span className="rounded-full bg-brand-primary/10 text-brand-primary px-2 py-0.5 text-[10px] font-bold">
              Recent {recentTests.length}
            </span>
          </div>
          {exams.length > 3 && (
            <span className="text-[11px] text-brand-text-muted">Total {exams.length} tests recorded</span>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-brand-text-muted animate-pulse">
            Loading recent tests…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">{error}</div>
        ) : recentTests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-brand-border bg-brand-surface px-6 py-10 text-center">
            <ClipboardList size={32} className="mx-auto text-brand-text-muted/40 mb-2" />
            <p className="text-xs font-bold text-brand-text">No tests recorded yet.</p>
            <p className="text-[11px] text-brand-text-muted mt-0.5">
              Click "Add Test &amp; Enter Marks" above to record marks for your classes.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {recentTests.map((t) => {
              const stats = calcStats(t)
              const markedCount = t.studentMarks.filter(
                (s) => s.isAbsent || (s.marksObtained !== null && s.marksObtained !== undefined)
              ).length

              return (
                <div
                  key={t._id}
                  className="rounded-2xl border border-brand-border bg-brand-surface p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-1.5 mb-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-primary/10 text-brand-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                        {t.studentClass || t.batch}
                      </span>
                      <span className="text-[10px] text-brand-text-muted shrink-0">{fmtDate(t.examDate)}</span>
                    </div>

                    <h4 className="text-xs font-extrabold text-brand-text line-clamp-1 leading-snug">
                      {t.testName}
                    </h4>

                    <p className="text-[10px] text-brand-text-muted mt-0.5 flex items-center gap-1">
                      {t.subject && <span className="font-semibold text-brand-text">{t.subject} · </span>}
                      <span>Batch: {t.batch}</span>
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-brand-border/60 space-y-2">
                    <div className="grid grid-cols-3 gap-1 text-center bg-brand-surface-tint rounded-xl p-2">
                      <div>
                        <p className="text-[11px] font-extrabold text-brand-primary">{t.totalMarks}</p>
                        <p className="text-[9px] text-brand-text-muted">Total</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-extrabold text-emerald-600">
                          {stats ? stats.highest : '—'}
                        </p>
                        <p className="text-[9px] text-brand-text-muted">High</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-extrabold text-amber-600">{stats ? stats.avg : '—'}</p>
                        <p className="text-[9px] text-brand-text-muted">Avg</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-brand-text-muted px-1">
                      <span>Marked:</span>
                      <span className="font-bold text-brand-text">
                        {markedCount}/{t.studentMarks.length} students
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedId(expandedId === t._id ? null : t._id)}
                      className="w-full rounded-xl bg-brand-surface-tint hover:bg-brand-primary hover:text-brand-surface text-brand-text text-xs font-bold py-1.5 transition-colors cursor-pointer text-center"
                    >
                      {expandedId === t._id ? 'Close Marks' : 'View / Edit Marks →'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── All Tests & Mark Sheets (Detailed List) ───────────────────── */}
      <div className="space-y-3 pt-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-brand-text">All Test Mark Sheets</h3>
        </div>

        {exams.map((exam) => {
          const isExpanded = expandedId === exam._id
          const stats = calcStats(exam)
          const markedCount = exam.studentMarks.filter(
            (s) => s.isAbsent || (s.marksObtained !== null && s.marksObtained !== undefined)
          ).length

          return (
            <div
              key={exam._id}
              className={`rounded-2xl border transition-all ${
                isExpanded
                  ? 'border-brand-primary/40 bg-brand-surface shadow-sm'
                  : 'border-brand-border bg-brand-surface'
              }`}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-primary/10 text-brand-primary ring-1 ring-brand-primary/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide">
                      📝 {exam.batch}
                    </span>
                    {exam.studentClass && (
                      <span className="inline-flex items-center rounded-full bg-brand-gold/10 text-brand-gold ring-1 ring-brand-gold/20 px-2 py-0.5 text-[9px] font-bold">
                        {exam.studentClass}
                      </span>
                    )}
                    <span className="text-[10px] text-brand-text-muted">{fmtDate(exam.examDate)}</span>
                  </div>

                  <p className="text-xs sm:text-sm font-bold text-brand-text mt-1 truncate">
                    {exam.testName}
                  </p>

                  <p className="text-[11px] text-brand-text-muted flex items-center gap-1.5 flex-wrap mt-0.5">
                    {exam.subject && (
                      <>
                        <span className="font-semibold text-brand-text">{exam.subject}</span>
                        <span>·</span>
                      </>
                    )}
                    <span>Total Marks: <strong>{exam.totalMarks}</strong></span>
                    <span>·</span>
                    <span>
                      {markedCount}/{exam.studentMarks.length} marked
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : exam._id)}
                    className="flex items-center gap-1.5 rounded-xl border border-brand-border bg-brand-surface-tint hover:bg-brand-surface text-brand-text px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    <span>{isExpanded ? 'Hide Marks' : 'Open Mark Sheet'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(exam._id)}
                    disabled={deletingId === exam._id}
                    className="p-1.5 rounded-xl border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors cursor-pointer disabled:opacity-50"
                    title="Delete test"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Expanded Mark Sheet */}
              {isExpanded && (
                <div className="border-t border-brand-border px-5 pb-5 pt-4 animate-fadeIn space-y-4">
                  {/* Summary Bar */}
                  {stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { label: 'Class Average', value: `${stats.avg} / ${exam.totalMarks}`, color: 'text-brand-primary' },
                        { label: 'Highest Score', value: `${stats.highest} / ${exam.totalMarks}`, color: 'text-emerald-600' },
                        { label: 'Lowest Score', value: stats.lowest, color: 'text-amber-600' },
                        { label: 'Pass Rate (≥33%)', value: `${stats.passed} of ${stats.appeared}`, color: 'text-brand-text' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="rounded-xl border border-brand-border bg-brand-surface-tint p-2.5 text-center">
                          <p className={`text-xs font-extrabold ${color}`}>{value}</p>
                          <p className="text-[9px] text-brand-text-muted mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {exam.studentMarks.length === 0 ? (
                    <p className="text-xs text-brand-text-muted py-3 text-center">
                      No students were attached to this test.
                    </p>
                  ) : (
                    <>
                      <div className="hidden sm:grid sm:grid-cols-[120px_1fr_auto_65px] gap-3 items-center px-3 text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                        <span>Marks (/{exam.totalMarks})</span>
                        <span>Student Name</span>
                        <span className="text-center">Absent</span>
                        <span className="text-right">Score %</span>
                      </div>

                      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                        {exam.studentMarks.map((sm) => {
                          const sid = String(sm.student)
                          const local = localMarks[exam._id]?.[sid] ?? { marksObtained: '', isAbsent: false }
                          const pct =
                            !local.isAbsent && local.marksObtained !== '' && local.marksObtained !== null
                              ? ((Number(local.marksObtained) / exam.totalMarks) * 100).toFixed(1)
                              : null
                          const pctColor =
                            pct === null
                              ? ''
                              : Number(pct) >= 75
                              ? 'text-emerald-600 font-bold'
                              : Number(pct) >= 33
                              ? 'text-amber-600 font-semibold'
                              : 'text-red-500 font-bold'

                          return (
                            <div key={sid}>
                              {/* Desktop View (sm and up) */}
                              <div
                                className={`hidden sm:grid sm:grid-cols-[120px_1fr_auto_65px] gap-3 items-center rounded-xl px-3 py-2 transition-all ${
                                  local.isAbsent
                                    ? 'bg-red-50/60 border border-red-200'
                                    : 'bg-brand-surface-tint border border-brand-border/60 hover:bg-brand-surface'
                                }`}
                              >
                                {/* Input before name */}
                                <input
                                  type="number"
                                  min="0"
                                  max={exam.totalMarks}
                                  disabled={local.isAbsent}
                                  value={local.isAbsent ? '' : (local.marksObtained ?? '')}
                                  onChange={(e) => handleMarkChange(exam._id, sid, 'marksObtained', e.target.value)}
                                  placeholder={local.isAbsent ? 'Absent' : `0–${exam.totalMarks}`}
                                  className="w-full rounded-lg border border-brand-border bg-brand-surface px-2.5 py-1.5 text-xs text-center text-brand-text font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-40"
                                />

                                {/* Student Name */}
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {sm.studentRollNo && (
                                    <span className="font-mono text-[10px] font-extrabold text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded ring-1 ring-brand-primary/20 shrink-0">
                                      {sm.studentRollNo}
                                    </span>
                                  )}
                                  <span
                                    className={`text-xs font-bold truncate ${
                                      local.isAbsent ? 'text-red-400 line-through' : 'text-brand-text'
                                    }`}
                                  >
                                    {sm.studentName || 'Student'}
                                  </span>
                                </div>

                                {/* Absent toggle */}
                                <button
                                  type="button"
                                  onClick={() => handleMarkChange(exam._id, sid, 'isAbsent', !local.isAbsent)}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    local.isAbsent
                                      ? 'text-red-500 hover:text-red-700 bg-red-100/60'
                                      : 'text-brand-text-muted/40 hover:text-red-400 hover:bg-brand-surface'
                                  }`}
                                  title={local.isAbsent ? 'Mark present' : 'Mark absent'}
                                >
                                  {local.isAbsent ? <CheckSquare size={16} /> : <Square size={16} />}
                                </button>

                                {/* Percentage */}
                                <span className={`text-xs text-right font-bold ${pctColor || 'text-brand-text-muted/40'}`}>
                                  {pct !== null ? `${pct}%` : '—'}
                                </span>
                              </div>

                              {/* Mobile View (< sm) */}
                              <div
                                className={`sm:hidden rounded-xl p-3 space-y-2.5 transition-all ${
                                  local.isAbsent
                                    ? 'bg-red-50/80 border border-red-200'
                                    : 'bg-brand-surface-tint border border-brand-border/80 shadow-2xs'
                                }`}
                              >
                                {/* Student Info Top Row */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    {sm.studentRollNo && (
                                      <span className="font-mono text-[10px] font-extrabold text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded ring-1 ring-brand-primary/20 shrink-0">
                                        {sm.studentRollNo}
                                      </span>
                                    )}
                                    <span
                                      className={`text-xs font-bold truncate ${
                                        local.isAbsent ? 'text-red-400 line-through' : 'text-brand-text'
                                      }`}
                                    >
                                      {sm.studentName || 'Student'}
                                    </span>
                                  </div>

                                  {local.isAbsent ? (
                                    <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-md shrink-0">
                                      Absent
                                    </span>
                                  ) : pct !== null ? (
                                    <span
                                      className={`text-xs font-bold px-2 py-0.5 rounded-md bg-brand-surface border border-brand-border/60 shrink-0 ${pctColor}`}
                                    >
                                      {pct}%
                                    </span>
                                  ) : null}
                                </div>

                                {/* Marks Input & Absent Toggle Bottom Row */}
                                <div className="flex items-center gap-2 pt-1.5 border-t border-brand-border/40">
                                  <div className="flex-1 flex items-center gap-1.5 min-w-0">
                                    <span className="text-[10px] font-bold text-brand-text-muted uppercase shrink-0">Marks:</span>
                                    <input
                                      type="number"
                                      min="0"
                                      max={exam.totalMarks}
                                      disabled={local.isAbsent}
                                      value={local.isAbsent ? '' : (local.marksObtained ?? '')}
                                      onChange={(e) => handleMarkChange(exam._id, sid, 'marksObtained', e.target.value)}
                                      placeholder={local.isAbsent ? 'Absent' : `0–${exam.totalMarks}`}
                                      className="w-full rounded-lg border border-brand-border bg-brand-surface px-2.5 py-1.5 text-xs text-center text-brand-text font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-40"
                                    />
                                    <span className="text-[10px] font-bold text-brand-text-muted shrink-0">/{exam.totalMarks}</span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleMarkChange(exam._id, sid, 'isAbsent', !local.isAbsent)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                      local.isAbsent
                                        ? 'bg-red-100 text-red-600 border border-red-200'
                                        : 'bg-brand-surface text-brand-text-muted hover:text-brand-text border border-brand-border'
                                    }`}
                                  >
                                    {local.isAbsent ? <CheckSquare size={14} /> : <Square size={14} />}
                                    <span>Absent</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-2">
                        <span className="text-[10px] text-brand-text-muted">
                          Click Save Marks to record changes to this test.
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSaveMarks(exam._id)}
                          disabled={savingId === exam._id}
                          className="flex items-center gap-2 rounded-xl bg-brand-primary text-brand-surface px-5 py-2 text-xs font-bold hover:bg-brand-primary/90 disabled:opacity-60 transition-all shadow-xs cursor-pointer"
                        >
                          <Save size={13} />
                          <span>{savingId === exam._id ? 'Saving…' : 'Save Marks'}</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
