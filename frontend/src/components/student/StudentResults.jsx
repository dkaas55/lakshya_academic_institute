import { useState, useEffect, useMemo } from 'react'
import api from '../../lib/api'
import {
  Trophy,
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Sparkles,
  Clock,
  Layers,
  BookOpen,
  GraduationCap,
  X,
  ArrowRight,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

const SUBJECT_ICONS = {
  Mathematics:        '📐',
  Maths:              '📐',
  Math:               '📐',
  Science:            '🔬',
  Physics:            '⚡',
  Chemistry:          '🧪',
  Biology:            '🧬',
  English:            '📖',
  History:            '🏛️',
  Geography:          '🌍',
  'Computer Science': '💻',
  Economics:          '📊',
  Civics:             '⚖️',
}

function getSubjectIcon(subject) {
  return SUBJECT_ICONS[subject] ?? '📝'
}

function getGradeBadge(pct) {
  if (pct >= 85) {
    return {
      label: 'Outstanding (A+)',
      pill: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      bar: 'bg-emerald-500',
    }
  }
  if (pct >= 75) {
    return {
      label: 'Distinction (A)',
      pill: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      bar: 'bg-emerald-500',
    }
  }
  if (pct >= 60) {
    return {
      label: 'First Class (B)',
      pill: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
      bar: 'bg-sky-500',
    }
  }
  if (pct >= 33) {
    return {
      label: 'Passed (C)',
      pill: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      bar: 'bg-amber-500',
    }
  }
  return {
    label: 'Needs Improvement',
    pill: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    bar: 'bg-rose-500',
  }
}

// ─── Main StudentResults Component ────────────────────────────────────────────

export default function StudentResults({ exams = [], student = null }) {
  // Local state for exams with resilient enrichment if peer stats are missing
  const [enrichedExams, setEnrichedExams] = useState(exams)

  useEffect(() => {
    // Check if any evaluated exam is missing peer stats
    const needsPeerStats = exams.some(
      (e) => !e.isAbsent && !e.isPending && e.marksObtained !== null && (e.highestMarks == null || e.averageMarks == null)
    )

    if (!needsPeerStats) {
      setEnrichedExams(exams)
      return
    }

    // Fallback: Fetch /api/exam-results to compute and merge peer stats for batch tests
    let cancelled = false
    api
      .get('/exam-results')
      .then(({ data }) => {
        if (cancelled) return
        if (data.success && Array.isArray(data.data)) {
          const examMap = new Map(data.data.map((ex) => [String(ex._id), ex]))
          const updated = exams.map((exam) => {
            if (exam.highestMarks != null && exam.averageMarks != null) return exam
            const fullExam = examMap.get(String(exam.id || exam._id))
            if (!fullExam?.studentMarks) return exam

            const validScores = fullExam.studentMarks
              .filter((s) => !s.isAbsent && s.marksObtained !== null && s.marksObtained !== undefined)
              .map((s) => Number(s.marksObtained))
              .sort((a, b) => b - a)

            const totalAppeared = validScores.length
            const highestMarks = totalAppeared > 0 ? Math.max(...validScores) : null
            const averageMarks =
              totalAppeared > 0
                ? Math.round((validScores.reduce((a, b) => a + b, 0) / totalAppeared) * 10) / 10
                : null

            let rank = exam.rank
            if (!exam.isAbsent && exam.marksObtained !== null && totalAppeared > 0) {
              rank = validScores.filter((score) => score > Number(exam.marksObtained)).length + 1
            }

            return {
              ...exam,
              highestMarks: highestMarks ?? exam.highestMarks,
              averageMarks: averageMarks ?? exam.averageMarks,
              rank: rank ?? exam.rank,
              totalAppeared: totalAppeared || exam.totalAppeared,
              totalStudents: fullExam.studentMarks.length,
            }
          })
          setEnrichedExams(updated)
        } else {
          setEnrichedExams(exams)
        }
      })
      .catch(() => {
        if (!cancelled) setEnrichedExams(exams)
      })

    return () => {
      cancelled = true
    }
  }, [exams])

  // 1. Identify all relevant batches
  const enrolledBatches = useMemo(() => {
    if (Array.isArray(student?.batches) && student.batches.length > 0) {
      return student.batches
    }
    if (student?.batch) {
      return student.batch.split(',').map((b) => b.trim()).filter(Boolean)
    }
    return []
  }, [student])

  const examBatches = useMemo(() => {
    return Array.from(new Set(enrichedExams.map((e) => e.batch).filter(Boolean)))
  }, [enrichedExams])

  const allBatches = useMemo(() => {
    const set = new Set([...enrolledBatches, ...examBatches])
    return Array.from(set).sort()
  }, [enrolledBatches, examBatches])

  // State
  const [selectedBatch, setSelectedBatch] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('All')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'graded' | 'absent' | 'pending'
  const [groupByBatch, setGroupByBatch] = useState(true)

  // 2. Filter exams by selected batch
  const batchScopedExams = useMemo(() => {
    if (selectedBatch === 'All') return enrichedExams
    return enrichedExams.filter((e) => e.batch === selectedBatch)
  }, [enrichedExams, selectedBatch])

  // Available subjects in current scope
  const availableSubjects = useMemo(() => {
    const set = new Set(batchScopedExams.map((e) => e.subject).filter(Boolean))
    return Array.from(set).sort()
  }, [batchScopedExams])

  // 3. Filter exams by search, subject, status
  const filteredExams = useMemo(() => {
    return batchScopedExams.filter((exam) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = exam.testName?.toLowerCase().includes(q)
        const matchSubj = exam.subject?.toLowerCase().includes(q)
        const matchBatch = exam.batch?.toLowerCase().includes(q)
        if (!matchName && !matchSubj && !matchBatch) return false
      }

      // Subject filter
      if (selectedSubject !== 'All' && exam.subject !== selectedSubject) {
        return false
      }

      // Status filter
      if (statusFilter === 'graded') {
        if (exam.isAbsent || exam.isPending || exam.marksObtained === null) return false
      } else if (statusFilter === 'absent') {
        if (!exam.isAbsent) return false
      } else if (statusFilter === 'pending') {
        if (!exam.isPending) return false
      }

      return true
    })
  }, [batchScopedExams, searchQuery, selectedSubject, statusFilter])

  // 4. Strict Sort by Date Descending (Most Recent Test First)
  const sortedExams = useMemo(() => {
    return [...filteredExams].sort((a, b) => {
      const timeA = new Date(a.examDate || a.createdAt || 0).getTime()
      const timeB = new Date(b.examDate || b.createdAt || 0).getTime()
      if (timeB !== timeA) return timeB - timeA
      return String(b.id || '').localeCompare(String(a.id || ''))
    })
  }, [filteredExams])

  // 5. Most Recent Test (First thing to show)
  const latestExam = useMemo(() => {
    if (!sortedExams.length) return null
    return sortedExams[0]
  }, [sortedExams])

  // 6. Batch / Scope Statistics
  const stats = useMemo(() => {
    const total = batchScopedExams.length
    const graded = batchScopedExams.filter(
      (e) => !e.isAbsent && !e.isPending && e.marksObtained !== null && e.marksObtained !== undefined
    )
    const absent = batchScopedExams.filter((e) => e.isAbsent)
    const pending = batchScopedExams.filter((e) => e.isPending)

    let totalMarksEarned = 0
    let totalMaxMarks = 0
    let bestPct = null
    let bestTestName = ''
    const ranks = []

    for (const e of graded) {
      const earned = Number(e.marksObtained) || 0
      const max = Number(e.totalMarks) || 100
      totalMarksEarned += earned
      totalMaxMarks += max

      const pct = Math.round((earned / max) * 100)
      if (bestPct === null || pct > bestPct) {
        bestPct = pct
        bestTestName = e.testName
      }

      if (e.rank) {
        ranks.push(e.rank)
      }
    }

    const overallPct = totalMaxMarks > 0 ? Math.round((totalMarksEarned / totalMaxMarks) * 100) : 0
    const bestRank = ranks.length > 0 ? Math.min(...ranks) : null
    const attendanceRate = total > 0 ? Math.round(((total - absent.length) / total) * 100) : 100

    return {
      total,
      gradedCount: graded.length,
      absentCount: absent.length,
      pendingCount: pending.length,
      overallPct,
      bestPct,
      bestTestName,
      bestRank,
      attendanceRate,
    }
  }, [batchScopedExams])

  // 7. Recent trend (last 6 graded exams in chronological order for the trend visualizer)
  const recentTrend = useMemo(() => {
    const evaluated = [...enrichedExams]
      .filter((e) => !e.isAbsent && !e.isPending && e.marksObtained !== null)
      .sort((a, b) => {
        const timeA = new Date(a.examDate || a.createdAt || 0).getTime()
        const timeB = new Date(b.examDate || b.createdAt || 0).getTime()
        return timeB - timeA
      })
      .slice(0, 6)
      .reverse() // oldest to newest for left-to-right timeline
    return evaluated.map((e) => {
      const pct = Math.round((Number(e.marksObtained) / (e.totalMarks || 100)) * 100)
      return {
        ...e,
        pct,
      }
    })
  }, [enrichedExams])

  // 8. Grouped by batch (ordered so that batch with the newest test is first)
  const groupedByBatch = useMemo(() => {
    const map = {}
    for (const exam of sortedExams) {
      const b = exam.batch || 'General Batch'
      if (!map[b]) map[b] = []
      map[b].push(exam)
    }
    const entries = Object.entries(map)
    entries.sort(([, aList], [, bList]) => {
      const timeA = new Date(aList[0]?.examDate || aList[0]?.createdAt || 0).getTime()
      const timeB = new Date(bList[0]?.examDate || bList[0]?.createdAt || 0).getTime()
      return timeB - timeA
    })
    return Object.fromEntries(entries)
  }, [sortedExams])

  return (
    <section className="flex flex-col gap-6">
      {/* ─── Header & Enrolled Information ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-brand-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary font-bold">
              <Award size={20} />
            </span>
            <h1 className="text-lg sm:text-xl font-black text-brand-text tracking-tight">
              Test Results
            </h1>
          </div>
          <p className="text-xs text-brand-text-muted mt-1">
            Track your performance, rankings, and scores across different tests according to your batches.
          </p>
        </div>

        {student && (
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {student.rollNo && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-surface-tint border border-brand-border text-xs font-bold text-brand-text">
                <span className="text-[10px] text-brand-text-muted font-normal">Roll No:</span>
                {student.rollNo}
              </span>
            )}
            {student.studentClass && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-surface-tint border border-brand-border text-xs font-bold text-brand-text">
                <GraduationCap size={13} className="text-brand-primary" />
                {student.studentClass}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ─── Batch Selector Pills ("According to Batches") ──────────────────── */}
      {allBatches.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-brand-text-muted flex items-center gap-1.5">
              <Layers size={14} className="text-brand-primary" />
              Select Batch
            </span>
            {allBatches.length > 1 && selectedBatch === 'All' && (
              <label className="flex items-center gap-1.5 text-xs text-brand-text-muted cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={groupByBatch}
                  onChange={(e) => setGroupByBatch(e.target.checked)}
                  className="rounded border-brand-border text-brand-primary focus:ring-brand-primary/30"
                />
                <span>Group by Batch</span>
              </label>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedBatch('All')}
              className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedBatch === 'All'
                  ? 'bg-brand-primary text-brand-surface shadow-xs font-black'
                  : 'bg-brand-surface border border-brand-border text-brand-text-muted hover:text-brand-text hover:bg-brand-surface-tint'
              }`}
            >
              <span>All Batches</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  selectedBatch === 'All'
                    ? 'bg-brand-surface/20 text-brand-surface'
                    : 'bg-brand-surface-tint text-brand-text-muted border border-brand-border'
                }`}
              >
                {enrichedExams.length}
              </span>
            </button>

            {allBatches.map((batchName) => {
              const count = enrichedExams.filter((e) => e.batch === batchName).length
              const isSelected = selectedBatch === batchName
              return (
                <button
                  key={batchName}
                  type="button"
                  onClick={() => setSelectedBatch(batchName)}
                  className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-brand-primary text-brand-surface shadow-xs font-black'
                      : 'bg-brand-surface border border-brand-border text-brand-text-muted hover:text-brand-text hover:bg-brand-surface-tint'
                  }`}
                >
                  <span>{batchName}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      isSelected
                        ? 'bg-brand-surface/20 text-brand-surface'
                        : 'bg-brand-surface-tint text-brand-text-muted border border-brand-border'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── 1. SPOTLIGHT: Recent Test Marks (First Thing Shown) ─────────────── */}
      {latestExam && (
        <section className="rounded-2xl border-2 border-brand-primary/30 bg-gradient-to-br from-brand-primary/5 via-brand-surface to-brand-surface p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-brand-border pb-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-brand-primary text-brand-surface shadow-xs">
                <Sparkles size={16} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-brand-text tracking-tight">
                    Recent Test Marks
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-primary text-brand-surface shadow-2xs">
                    Latest
                  </span>
                </div>
                <p className="text-[11px] text-brand-text-muted mt-0.5">
                  Your most recent test {selectedBatch === 'All' ? 'across all batches' : `in batch "${selectedBatch}"`}.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-bold text-brand-text">
              <Calendar size={14} className="text-brand-primary" />
              <span>{latestExam.examDate ? formatDate(latestExam.examDate) : 'Recently conducted'}</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1.2fr_1fr] items-center">
            {/* Left: Test Details & Score */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-brand-surface-tint border border-brand-border text-xs font-bold text-brand-text">
                  <span>{getSubjectIcon(latestExam.subject)}</span>
                  <span>{latestExam.subject || 'General'}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-xl border border-brand-primary/20">
                  <Layers size={12} />
                  <span>Batch: {latestExam.batch}</span>
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-brand-text">
                  {latestExam.testName}
                </h3>
              </div>

              {/* Score breakdown */}
              {latestExam.isAbsent ? (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-extrabold">
                  <XCircle size={16} />
                  <span>Marked Absent for this test</span>
                </div>
              ) : latestExam.isPending || latestExam.marksObtained === null ? (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-extrabold">
                  <Clock size={16} />
                  <span>Marks evaluation in progress</span>
                </div>
              ) : (
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-brand-primary tracking-tight">
                    {latestExam.marksObtained}
                    <span className="text-base text-brand-text-muted font-bold"> / {latestExam.totalMarks}</span>
                  </span>
                  {(() => {
                    const pct = Math.round((Number(latestExam.marksObtained) / (latestExam.totalMarks || 100)) * 100)
                    const g = getGradeBadge(pct)
                    return (
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-xl text-xs font-black border ${g.pill}`}>
                          {pct}%
                        </span>
                        <span className="text-xs font-bold text-brand-text-muted">
                          {g.label}
                        </span>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>

            {/* Right: Peer stats for this latest test */}
            {!latestExam.isAbsent && latestExam.marksObtained !== null && (
              <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-brand-surface border border-brand-border">
                <div className="text-center">
                  <span className="text-[10px] font-extrabold uppercase text-brand-text-muted block">
                    Batch Rank
                  </span>
                  <span className="text-sm sm:text-base font-black text-brand-primary flex items-center justify-center gap-1 mt-1">
                    {latestExam.rank != null ? (
                      <>
                        {latestExam.rank === 1 && <Trophy size={14} className="text-brand-gold" />}
                        #{latestExam.rank}
                      </>
                    ) : (
                      '—'
                    )}
                  </span>
                </div>

                <div className="text-center border-x border-brand-border/60">
                  <span className="text-[10px] font-extrabold uppercase text-brand-text-muted block">
                    Highest
                  </span>
                  <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                    {latestExam.highestMarks != null && !isNaN(Number(latestExam.highestMarks)) ? (
                      <>
                        {latestExam.highestMarks}
                        <span className="text-[10px] text-brand-text-muted font-normal">
                          /{latestExam.totalMarks}
                        </span>
                      </>
                    ) : (
                      '—'
                    )}
                  </span>
                </div>

                <div className="text-center">
                  <span className="text-[10px] font-extrabold uppercase text-brand-text-muted block">
                    Batch Avg
                  </span>
                  <span className="text-sm sm:text-base font-black text-brand-text mt-1 block">
                    {latestExam.averageMarks != null && !isNaN(Number(latestExam.averageMarks)) ? (
                      <>
                        {latestExam.averageMarks}
                        <span className="text-[10px] text-brand-text-muted font-normal">
                          /{latestExam.totalMarks}
                        </span>
                      </>
                    ) : (
                      '—'
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── Batch KPI Summary Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Tests & Attendance */}
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-brand-text-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tests Conducted</span>
            <span className="p-1.5 rounded-lg bg-brand-surface-tint text-brand-text">
              <Calendar size={14} />
            </span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-brand-text tracking-tight">
              {stats.total}
            </span>
            <p className="text-[11px] font-semibold text-brand-text-muted mt-0.5">
              {stats.gradedCount} appeared · {stats.absentCount} absent
            </p>
          </div>
          <div className="pt-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 size={10} />
              {stats.attendanceRate}% Attendance
            </span>
          </div>
        </div>

        {/* Card 2: Average Percentage */}
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-brand-text-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">Overall Average</span>
            <span className="p-1.5 rounded-lg bg-brand-primary/10 text-brand-primary">
              <Award size={14} />
            </span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-brand-primary tracking-tight">
              {stats.gradedCount > 0 ? `${stats.overallPct}%` : '—'}
            </span>
            <p className="text-[11px] font-semibold text-brand-text-muted mt-0.5">
              Across {stats.gradedCount} evaluated test{stats.gradedCount !== 1 ? 's' : ''}
            </p>
          </div>
          {stats.gradedCount > 0 && (
            <div className="pt-1">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                  getGradeBadge(stats.overallPct).pill
                }`}
              >
                {getGradeBadge(stats.overallPct).label}
              </span>
            </div>
          )}
        </div>

        {/* Card 3: Top Score */}
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-brand-text-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">Best Score</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sparkles size={14} />
            </span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {stats.bestPct !== null ? `${stats.bestPct}%` : '—'}
            </span>
            <p className="text-[11px] font-semibold text-brand-text-muted mt-0.5 truncate" title={stats.bestTestName}>
              {stats.bestTestName || 'No tests taken yet'}
            </p>
          </div>
          {stats.bestPct !== null && (
            <div className="pt-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Peak Performance
              </span>
            </div>
          )}
        </div>

        {/* Card 4: Top Rank */}
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-brand-text-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">Best Batch Rank</span>
            <span className="p-1.5 rounded-lg bg-brand-gold/15 text-brand-gold">
              <Trophy size={14} />
            </span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-brand-text tracking-tight">
              {stats.bestRank ? `#${stats.bestRank}` : '—'}
            </span>
            <p className="text-[11px] font-semibold text-brand-text-muted mt-0.5">
              {stats.bestRank === 1 ? '🌟 Batch Topper' : stats.bestRank ? 'In batch tests' : 'Pending exams'}
            </p>
          </div>
          {stats.bestRank && (
            <div className="pt-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
                Top Achievement
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Recent Performance Visualizer (Score Track) ───────────────────── */}
      {recentTrend.length >= 2 && (
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-brand-primary" />
              <h3 className="text-xs font-black uppercase tracking-wider text-brand-text">
                Recent Test Trend
              </h3>
            </div>
            <span className="text-[11px] text-brand-text-muted">Last {recentTrend.length} Tests</span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 pt-1">
            {recentTrend.map((t, idx) => {
              const badge = getGradeBadge(t.pct)
              return (
                <div
                  key={t.id || idx}
                  className="rounded-xl border border-brand-border bg-brand-surface-tint p-3 space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-brand-text-muted">
                      <span>{t.examDate ? formatDate(t.examDate) : '—'}</span>
                      <span className="font-extrabold text-brand-primary">{t.subject || 'Test'}</span>
                    </div>
                    <p className="text-xs font-bold text-brand-text truncate" title={t.testName}>
                      {t.testName}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-lg font-black text-brand-text">{t.pct}%</span>
                      <span className="text-[10px] text-brand-text-muted font-bold">
                        {t.marksObtained}/{t.totalMarks}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-brand-border/40 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${badge.bar}`}
                        style={{ width: `${Math.min(100, Math.max(0, t.pct))}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── Search & Filters Bar ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl border border-brand-border bg-brand-surface shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted"
          />
          <input
            type="text"
            placeholder="Search test name, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-brand-surface-tint border border-brand-border text-xs text-brand-text placeholder-brand-text-muted/70 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Subject Filter */}
          {availableSubjects.length > 0 && (
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 rounded-xl bg-brand-surface-tint border border-brand-border text-xs font-semibold text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            >
              <option value="All">All Subjects ({availableSubjects.length})</option>
              {availableSubjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <div className="flex items-center p-0.5 rounded-xl bg-brand-surface-tint border border-brand-border text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                statusFilter === 'all'
                  ? 'bg-brand-surface text-brand-text shadow-xs font-black'
                  : 'text-brand-text-muted hover:text-brand-text'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('graded')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                statusFilter === 'graded'
                  ? 'bg-brand-surface text-brand-text shadow-xs font-black'
                  : 'text-brand-text-muted hover:text-brand-text'
              }`}
            >
              Evaluated
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('absent')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                statusFilter === 'absent'
                  ? 'bg-brand-surface text-brand-text shadow-xs font-black'
                  : 'text-brand-text-muted hover:text-brand-text'
              }`}
            >
              Absent
            </button>
          </div>
        </div>
      </div>

      {/* ─── Test Cards List (Most Recent First) ─────────────────────────────── */}
      {sortedExams.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-border bg-brand-surface py-16 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-surface-tint border border-brand-border flex items-center justify-center text-brand-text-muted">
            <Award size={28} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-brand-text">No Test Results Found</h3>
            <p className="text-xs text-brand-text-muted mt-1 max-w-md mx-auto">
              {searchQuery || selectedSubject !== 'All' || statusFilter !== 'all'
                ? 'No tests matched your current filter criteria. Try clearing your filters.'
                : selectedBatch !== 'All'
                ? `No tests have been conducted or graded yet for "${selectedBatch}". Check back soon!`
                : 'No tests have been recorded for your batches yet. When tests are conducted and graded, your scores will appear here.'}
            </p>
          </div>
          {(searchQuery || selectedSubject !== 'All' || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setSelectedSubject('All')
                setStatusFilter('all')
              }}
              className="px-4 py-2 rounded-xl bg-brand-primary text-brand-surface text-xs font-bold shadow-xs hover:bg-brand-primary/90 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : groupByBatch && selectedBatch === 'All' && Object.keys(groupedByBatch).length > 1 ? (
        // Render Grouped by Batch (Batches ordered by most recent test)
        <div className="space-y-8">
          {Object.entries(groupedByBatch).map(([batchName, bExams]) => {
            const graded = bExams.filter((e) => !e.isAbsent && !e.isPending && e.marksObtained !== null)
            const bTotalEarned = graded.reduce((s, e) => s + Number(e.marksObtained || 0), 0)
            const bTotalMax = graded.reduce((s, e) => s + Number(e.totalMarks || 100), 0)
            const bAvg = bTotalMax > 0 ? Math.round((bTotalEarned / bTotalMax) * 100) : null

            return (
              <div key={batchName} className="space-y-4">
                {/* Batch Section Header */}
                <div className="flex items-center justify-between border-b border-brand-border pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-brand-primary/10 text-brand-primary">
                      <Layers size={16} />
                    </span>
                    <h3 className="text-sm font-black text-brand-text">
                      Batch: {batchName}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-surface-tint border border-brand-border text-brand-text-muted">
                      {bExams.length} test{bExams.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {bAvg !== null && (
                    <span className="text-xs font-extrabold text-brand-primary">
                      Batch Average: {bAvg}%
                    </span>
                  )}
                </div>

                {/* Cards for this batch */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {bExams.map((exam) => (
                    <ExamResultCard key={exam.id} exam={exam} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        // Standard Flat Grid (Most recent tests first)
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedExams.map((exam) => (
            <ExamResultCard key={exam.id} exam={exam} />
          ))}
        </div>
      )}
    </section>
  )
}

// ─── Individual Exam Result Card ──────────────────────────────────────────────

function ExamResultCard({ exam }) {
  const isAbsent = !!exam.isAbsent
  const isPending = !!exam.isPending || (!isAbsent && exam.marksObtained === null)
  const isGraded = !isAbsent && !isPending && exam.marksObtained !== null

  const pct = isGraded
    ? Math.round((Number(exam.marksObtained) / (exam.totalMarks || 100)) * 100)
    : null
  const grade = pct !== null ? getGradeBadge(pct) : null

  // Safely check peer statistics to avoid any undefined rendering
  const hasHighest = exam.highestMarks != null && !isNaN(Number(exam.highestMarks))
  const hasAverage = exam.averageMarks != null && !isNaN(Number(exam.averageMarks))
  const hasRank = exam.rank != null && !isNaN(Number(exam.rank))

  const diffFromAvg = isGraded && hasAverage
    ? Math.round((Number(exam.marksObtained) - Number(exam.averageMarks)) * 10) / 10
    : null

  return (
    <div className="w-full rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-sm hover:shadow-md hover:border-brand-border/80 transition-all flex flex-col justify-between space-y-4">
      {/* Top Meta Bar */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Subject Badge */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-brand-surface-tint border border-brand-border text-xs font-bold text-brand-text">
            <span>{getSubjectIcon(exam.subject)}</span>
            <span className="truncate max-w-[120px]">{exam.subject || 'General'}</span>
          </span>

          {/* Batch Pill */}
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-brand-primary bg-brand-primary/10 px-2.5 py-0.5 rounded-full border border-brand-primary/20 truncate max-w-[140px]" title={exam.batch}>
            {exam.batch}
          </span>
        </div>

        {/* Test Name & Date */}
        <div>
          <h4 className="text-sm sm:text-base font-extrabold text-brand-text line-clamp-2" title={exam.testName}>
            {exam.testName}
          </h4>
          <div className="flex items-center gap-2 text-[11px] text-brand-text-muted font-semibold mt-1">
            <Calendar size={12} />
            <span>{exam.examDate ? formatDate(exam.examDate) : 'Date not set'}</span>
            {exam.studentClass && (
              <>
                <span>•</span>
                <span>{exam.studentClass}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Score Area */}
      <div className="rounded-xl border border-brand-border bg-brand-surface-tint p-4 space-y-3">
        {isAbsent ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <XCircle size={22} />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Marked Absent
              </span>
              <p className="text-[11px] text-brand-text-muted mt-0.5">
                You were absent for this scheduled test paper.
              </p>
            </div>
          </div>
        ) : isPending ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock size={22} />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Evaluation Pending
              </span>
              <p className="text-[11px] text-brand-text-muted mt-0.5">
                Marks for this test will be published soon.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl sm:text-3xl font-black text-brand-text tracking-tight">
                  {exam.marksObtained}
                </span>
                <span className="text-xs font-bold text-brand-text-muted">
                  {' '}/ {exam.totalMarks}
                </span>
              </div>

              {pct !== null && grade && (
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black border ${grade.pill}`}>
                    {pct}%
                  </span>
                </div>
              )}
            </div>

            {/* Visual Score Progress Bar */}
            <div className="mt-2.5 space-y-1">
              <div className="relative w-full h-2 bg-brand-border/40 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${grade.bar} transition-all duration-500`}
                  style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-bold text-brand-text-muted pt-0.5">
                <span>{grade.label}</span>
                {diffFromAvg !== null && (
                  <span
                    className={`font-extrabold ${
                      diffFromAvg >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {diffFromAvg >= 0 ? `+${diffFromAvg}` : diffFromAvg} vs batch avg
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Peer & Batch Insights Footer */}
      {isGraded && (
        <div className="pt-1 border-t border-brand-border/60 grid grid-cols-3 gap-2 text-center text-xs">
          {/* Rank in batch */}
          <div className="p-2 rounded-xl bg-brand-surface-tint border border-brand-border/60">
            <span className="text-[10px] font-extrabold uppercase text-brand-text-muted block">
              Batch Rank
            </span>
            <span className="text-xs sm:text-sm font-black text-brand-primary flex items-center justify-center gap-1 mt-0.5">
              {hasRank ? (
                <>
                  {exam.rank === 1 && <Trophy size={13} className="text-brand-gold" />}
                  #{exam.rank}
                  <span className="text-[10px] text-brand-text-muted font-normal">
                    /{exam.totalAppeared || exam.totalStudents || '—'}
                  </span>
                </>
              ) : (
                '—'
              )}
            </span>
          </div>

          {/* Batch Topper */}
          <div className="p-2 rounded-xl bg-brand-surface-tint border border-brand-border/60">
            <span className="text-[10px] font-extrabold uppercase text-brand-text-muted block">
              Highest
            </span>
            <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {hasHighest ? (
                <>
                  {exam.highestMarks}
                  <span className="text-[10px] text-brand-text-muted font-normal">
                    /{exam.totalMarks}
                  </span>
                </>
              ) : (
                '—'
              )}
            </span>
          </div>

          {/* Batch Average */}
          <div className="p-2 rounded-xl bg-brand-surface-tint border border-brand-border/60">
            <span className="text-[10px] font-extrabold uppercase text-brand-text-muted block">
              Batch Avg
            </span>
            <span className="text-xs sm:text-sm font-black text-brand-text mt-0.5 block">
              {hasAverage ? (
                <>
                  {exam.averageMarks}
                  <span className="text-[10px] text-brand-text-muted font-normal">
                    /{exam.totalMarks}
                  </span>
                </>
              ) : (
                '—'
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
