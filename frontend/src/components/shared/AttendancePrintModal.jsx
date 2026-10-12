import { useRef, useState } from 'react'
import { Printer, Download, Share2, Copy, Check, X, ShieldAlert, Users, Calendar, Award } from 'lucide-react'
import { BRANDING } from '../../config/branding'

export default function AttendancePrintModal({
  isOpen,
  onClose,
  reportData,
  students = [],
  activeFilterLabel = 'All Students',
}) {
  const [copied, setCopied] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const printableRef = useRef(null)

  if (!isOpen) return null

  const batchName = reportData?.batch || 'All Batches'
  const totalDays = reportData?.totalClassDays || 0
  const dateFrom = reportData?.dateFrom || ''
  const dateTo = reportData?.dateTo || ''
  const periodText = dateFrom
    ? `${dateFrom} to ${dateTo || 'Today'}`
    : 'All Recorded Sessions'

  // Summary statistics for listed students
  const totalStudents = students.length
  const avgPct = totalStudents > 0
    ? Math.round(
        students.reduce((acc, s) => acc + (s.attendancePercentage ?? 0), 0) / totalStudents
      )
    : 0

  const lowAttendanceCount = students.filter((s) => (s.attendancePercentage ?? 0) < 75).length
  const criticalCount = students.filter((s) => (s.attendancePercentage ?? 0) < 60).length

  // Build clean text summary for WhatsApp / clipboard
  const generateTextSummary = () => {
    let msg = `📊 *${BRANDING.name}* - Attendance Report\n`
    msg += `━━━━━━━━━━━━━━━━━━━━\n`
    msg += `📌 *Batch:* ${batchName}\n`
    msg += `📅 *Period:* ${periodText}\n`
    msg += `🎯 *Filter:* ${activeFilterLabel}\n`
    msg += `👥 *Students Listed:* ${totalStudents}\n`
    msg += `📈 *Average Attendance:* ${avgPct}%\n\n`
    msg += `*Student Details:*\n`

    students.forEach((s, idx) => {
      const roll = s.rollNo ? `(Roll: ${s.rollNo}) ` : ''
      const pct = s.attendancePercentage !== null ? `${s.attendancePercentage}%` : '—'
      const statusTag = pct !== '—' && s.attendancePercentage < 60
        ? '🚨 Critical'
        : pct !== '—' && s.attendancePercentage < 75
        ? '⚠️ Low'
        : pct !== '—' && s.attendancePercentage >= 85
        ? '✓ Good'
        : 'Average'

      msg += `${idx + 1}. ${s.fullName} ${roll}— *${pct}* [${s.present || 0}P/${s.total || 0} days] (${statusTag})\n`
    })

    msg += `━━━━━━━━━━━━━━━━━━━━\n`
    msg += `Generated on ${new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' })} via ${BRANDING.shortName} Portal`
    return msg
  }

  // Handle Copy to Clipboard
  const handleCopyText = async () => {
    try {
      const text = generateTextSummary()
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      console.warn('Copy failed:', err)
    }
  }

  // Handle WhatsApp Share
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(generateTextSummary())
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
  }

  // Handle Native Print
  const handlePrint = () => {
    window.print()
  }

  // Handle PDF Download via html2pdf
  const handleDownloadPdf = async () => {
    setDownloadingPdf(true)
    try {
      const module = await import('html2pdf.js')
      const html2pdf = module.default || module

      const safeBatch = batchName.replace(/[^a-zA-Z0-9]/g, '_')
      const safeDate = new Date().toISOString().split('T')[0]
      const fileName = `Attendance_Report_${safeBatch}_${safeDate}.pdf`

      const element = printableRef.current
      if (!element) return

      const options = {
        margin: [8, 8, 8, 8],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }

      await html2pdf().set(options).from(element).save()
    } catch (err) {
      console.error('PDF download error:', err)
    } finally {
      setDownloadingPdf(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      {/* ── Scoped Print Stylesheet ────────────────────────────────────────── */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-attendance-report, #printable-attendance-report * {
            visibility: visible !important;
          }
          #printable-attendance-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 16px !important;
            background: #ffffff !important;
            color: #0f172a !important;
            font-size: 11px !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          tr {
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <div
        className="bg-brand-surface rounded-2xl border border-brand-border shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-brand-text my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Toolbar Header (Screen Only) ─────────────────────────────────── */}
        <div className="no-print p-4 sm:px-6 border-b border-brand-border bg-brand-surface-tint flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-brand-text flex items-center gap-2">
              <Printer size={18} className="text-brand-primary" />
              <span>Attendance Report — Print & Share</span>
            </h2>
            <p className="text-xs text-brand-text-muted mt-0.5">
              Review, print to paper/PDF, or copy and send to parents via WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-primary text-brand-surface text-xs font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-surface-tint border border-brand-border text-brand-text text-xs font-bold hover:bg-brand-surface active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download size={14} className="text-brand-primary" />
              <span>{downloadingPdf ? 'Exporting…' : 'Download PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
              title="Share report summary directly on WhatsApp"
            >
              <Share2 size={14} />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-surface-tint border border-brand-border text-brand-text text-xs font-bold hover:bg-brand-surface active:scale-95 transition-all cursor-pointer"
              title="Copy text summary to clipboard"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-brand-text-muted hover:text-brand-text hover:bg-brand-surface transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Document Body (Printable Area) ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50 dark:bg-slate-950/40">
          <div
            id="printable-attendance-report"
            ref={printableRef}
            className="bg-white text-slate-900 rounded-xl p-6 sm:p-8 shadow-sm border border-slate-200 mx-auto max-w-3xl space-y-6"
            style={{ minHeight: '840px' }}
          >
            {/* 1. Header / Letterhead */}
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-5">
              <div className="flex items-center gap-3.5">
                {BRANDING.logoUrl && (
                  <img
                    src={BRANDING.logoUrl}
                    alt="Logo"
                    className="w-14 h-14 object-contain"
                  />
                )}
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                    {BRANDING.name}
                  </h1>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    {BRANDING.tagline || 'Student & Academic Excellence Portal'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Official Student Attendance Record & Compliance Report
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider rounded">
                  OFFICIAL REPORT
                </span>
                <p className="text-[11px] text-slate-600 font-bold mt-1.5">
                  Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* 2. Metadata Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-100 rounded-lg text-xs border border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Batch</span>
                <span className="font-extrabold text-slate-900 text-xs">{batchName}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Period</span>
                <span className="font-bold text-slate-900 text-xs">{periodText}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Filter Applied</span>
                <span className="font-bold text-indigo-700 text-xs">{activeFilterLabel}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Classes</span>
                <span className="font-extrabold text-slate-900 text-xs">{totalDays} Sessions</span>
              </div>
            </div>

            {/* 3. Summary Statistics Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-slate-200 bg-white text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Listed</span>
                <span className="text-lg font-black text-slate-900">{totalStudents}</span>
                <span className="text-[10px] text-slate-500 block">students</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-white text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Average Attendance</span>
                <span className="text-lg font-black text-indigo-600">{avgPct}%</span>
                <span className="text-[10px] text-slate-500 block">overall listed</span>
              </div>
              <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-center">
                <span className="text-[10px] font-bold text-rose-700 uppercase block">Defaulters (&lt;75%)</span>
                <span className="text-lg font-black text-rose-600">{lowAttendanceCount}</span>
                <span className="text-[10px] text-rose-700 block">need attention</span>
              </div>
            </div>

            {/* 4. Student Attendance Table */}
            <div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-800 bg-slate-100 text-slate-800 text-[11px]">
                    <th className="py-2.5 px-2 font-extrabold w-8 text-center">#</th>
                    <th className="py-2.5 px-2 font-extrabold">Student Name</th>
                    <th className="py-2.5 px-2 font-extrabold w-16 text-center">Roll No</th>
                    <th className="py-2.5 px-2 font-extrabold w-16 text-center">Class</th>
                    <th className="py-2.5 px-2 font-extrabold w-12 text-center text-emerald-800">P</th>
                    <th className="py-2.5 px-2 font-extrabold w-12 text-center text-amber-800">L</th>
                    <th className="py-2.5 px-2 font-extrabold w-12 text-center text-rose-800">A</th>
                    <th className="py-2.5 px-2 font-extrabold w-16 text-center">Total</th>
                    <th className="py-2.5 px-2 font-extrabold w-24 text-center">Attendance %</th>
                    <th className="py-2.5 px-2 font-extrabold w-20 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500 text-xs italic">
                        No students found matching the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    students.map((s, idx) => {
                      const pct = s.attendancePercentage
                      const isLow = pct !== null && pct < 75
                      const isCritical = pct !== null && pct < 60
                      const isGood = pct !== null && pct >= 85

                      const statusText =
                        pct === null ? '—' :
                        isCritical ? 'Critical' :
                        isLow ? 'Low' :
                        isGood ? 'Good' : 'Average'

                      return (
                        <tr
                          key={s.studentId || idx}
                          className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}
                        >
                          <td className="py-2 px-2 text-center text-slate-500 font-medium tabular-nums">{idx + 1}</td>
                          <td className="py-2 px-2 font-bold text-slate-900">
                            {s.fullName}
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-slate-700">
                            {s.rollNo || '—'}
                          </td>
                          <td className="py-2 px-2 text-center text-slate-600">
                            {s.studentClass || '—'}
                          </td>
                          <td className="py-2 px-2 text-center font-bold text-emerald-700">{s.present || 0}</td>
                          <td className="py-2 px-2 text-center font-bold text-amber-700">{s.late || 0}</td>
                          <td className="py-2 px-2 text-center font-bold text-rose-700">{s.absent || 0}</td>
                          <td className="py-2 px-2 text-center font-bold text-slate-800">{s.total || 0}</td>
                          <td className="py-2 px-2 text-center">
                            {pct !== null ? (
                              <span
                                className={`inline-block font-extrabold px-1.5 py-0.5 rounded text-[11px] ${
                                  isCritical
                                    ? 'bg-rose-100 text-rose-800 font-black'
                                    : isLow
                                    ? 'bg-amber-100 text-amber-900'
                                    : isGood
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-200 text-slate-800'
                                }`}
                              >
                                {pct}%
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-2 px-2 text-center text-[10px] font-bold">
                            <span
                              className={`px-1.5 py-0.5 rounded ${
                                isCritical
                                  ? 'text-rose-700'
                                  : isLow
                                  ? 'text-amber-800'
                                  : isGood
                                  ? 'text-emerald-700'
                                  : 'text-slate-600'
                              }`}
                            >
                              {statusText}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* 5. Official Guidelines Notice */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-600 leading-relaxed">
              <strong>Notice & Guidelines:</strong> P = Present, L = Late, A = Absent. Regular attendance (minimum 75%) is mandatory for all scheduled sessions. Students with attendance below 75% are advised to meet their respective faculty/coordinator immediately.
            </div>

            {/* 6. Signature Block */}
            <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs">
              <div className="border-t border-slate-400 pt-1.5">
                <span className="font-bold text-slate-800 block">Class Teacher / Faculty</span>
                <span className="text-[10px] text-slate-500">Signature</span>
              </div>
              <div className="border-t border-slate-400 pt-1.5">
                <span className="font-bold text-slate-800 block">Academic Coordinator</span>
                <span className="text-[10px] text-slate-500">Verification</span>
              </div>
              <div className="border-t border-slate-400 pt-1.5">
                <span className="font-bold text-slate-800 block">Director / Principal</span>
                <span className="text-[10px] text-slate-500">Seal & Signature</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Modal Footer ─────────────────────────────────────────────────── */}
        <div className="no-print p-3 sm:px-6 border-t border-brand-border bg-brand-surface flex items-center justify-between text-xs text-brand-text-muted">
          <span>
            Showing {totalStudents} student{totalStudents !== 1 ? 's' : ''} under active filter: <strong className="text-brand-text">{activeFilterLabel}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-brand-border bg-brand-surface-tint text-brand-text font-bold hover:bg-brand-surface transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
