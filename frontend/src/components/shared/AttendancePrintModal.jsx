import { useRef, useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Printer, Download, Share2, Copy, Check, X, ArrowRightLeft, ZoomIn, ZoomOut, FileText } from 'lucide-react'
import { BRANDING } from '../../config/branding'

/**
 * Builds self-contained, inline-styled HTML string for Attendance Report
 * 100% resilient across mobile browsers, print media, and html2pdf canvas renderers.
 */
export function buildAttendanceReportHtml({
  branding = BRANDING,
  batchName = 'All Batches',
  periodText = 'All Recorded Sessions',
  activeFilterLabel = 'All Students',
  totalDays = 0,
  students = [],
  totalStudents = 0,
  avgPct = 0,
  lowAttendanceCount = 0,
  reportDate = new Date(),
}) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const fullLogoUrl = branding.logoUrl?.startsWith('/')
    ? `${origin}${branding.logoUrl}`
    : (branding.logoUrl || '')

  const dateStr = reportDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  const timeStr = reportDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return `
  <div class="attendance-report-page" style="width: 794px; min-width: 794px; max-width: 794px; background: #ffffff; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; line-height: 1.4; padding: 26px 30px; box-sizing: border-box; margin: 0 auto; position: relative;">
    
    <!-- ── Header / Letterhead ───────────────────────────────────── -->
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 14px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        ${fullLogoUrl ? `<img src="${fullLogoUrl}" alt="${branding.name}" style="height: 48px; max-height: 48px; width: auto; max-width: 120px; object-fit: contain; display: block;" onerror="this.style.display='none'" />` : ''}
        <div>
          <div style="font-size: 20px; font-weight: 900; color: #1e3a8a; letter-spacing: -0.3px; line-height: 1.2; text-transform: uppercase;">${branding.name}</div>
          <div style="font-size: 10px; font-weight: 700; color: #64748b; letter-spacing: 1px; text-transform: uppercase; margin-top: 2px;">${branding.tagline || 'Student & Academic Excellence Portal'}</div>
          <div style="font-size: 9px; color: #94a3b8; margin-top: 1px;">Official Student Attendance & Performance Compliance Record</div>
        </div>
      </div>
      <div style="text-align: right;">
        <div style="display: inline-block; background: #1e3a8a; color: #ffffff; font-size: 9px; font-weight: 800; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.8px;">OFFICIAL REPORT</div>
        <div style="font-size: 10px; font-weight: 700; color: #334155; margin-top: 4px;">Date: ${dateStr}</div>
        <div style="font-size: 9px; color: #64748b;">Time: ${timeStr}</div>
      </div>
    </div>

    <!-- ── Metadata Strip ────────────────────────────────────────── -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin-bottom: 14px; font-size: 10px;">
      <div>
        <div style="font-size: 8.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Batch</div>
        <div style="font-size: 11px; font-weight: 800; color: #0f172a; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${batchName === 'all' ? 'All Batches' : batchName}</div>
      </div>
      <div>
        <div style="font-size: 8.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Session Period</div>
        <div style="font-size: 11px; font-weight: 700; color: #0f172a; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${periodText}</div>
      </div>
      <div>
        <div style="font-size: 8.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Filter Criteria</div>
        <div style="font-size: 11px; font-weight: 800; color: #2563eb; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${activeFilterLabel}</div>
      </div>
      <div>
        <div style="font-size: 8.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Classes Held</div>
        <div style="font-size: 11px; font-weight: 800; color: #0f172a; margin-top: 2px;">${totalDays} Sessions</div>
      </div>
    </div>

    <!-- ── Summary Statistics Cards ──────────────────────────────── -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 14px;">
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; text-align: center;">
        <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Total Students</div>
        <div style="font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 2px;">${totalStudents}</div>
        <div style="font-size: 8.5px; color: #94a3b8;">listed in this report</div>
      </div>
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 8px; text-align: center;">
        <div style="font-size: 9px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Average Attendance</div>
        <div style="font-size: 18px; font-weight: 900; color: #15803d; margin-top: 2px;">${avgPct}%</div>
        <div style="font-size: 8.5px; color: #166534;">overall listed batch average</div>
      </div>
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 8px; text-align: center;">
        <div style="font-size: 9px; font-weight: 700; color: #991b1b; text-transform: uppercase; letter-spacing: 0.5px;">Defaulters (&lt;75%)</div>
        <div style="font-size: 18px; font-weight: 900; color: #b91c1c; margin-top: 2px;">${lowAttendanceCount}</div>
        <div style="font-size: 8.5px; color: #991b1b;">requires immediate attention</div>
      </div>
    </div>

    <!-- ── Table ─────────────────────────────────────────────────── -->
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; font-size: 10.5px; margin-bottom: 14px;">
      <thead>
        <tr style="background: #f1f5f9; border-bottom: 2px solid #94a3b8; color: #1e293b; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.5px;">
          <th style="padding: 6px 4px; text-align: center; border-right: 1px solid #cbd5e1; width: 28px;">#</th>
          <th style="padding: 6px 8px; text-align: left; border-right: 1px solid #cbd5e1;">Student Name</th>
          <th style="padding: 6px 4px; text-align: center; border-right: 1px solid #cbd5e1; width: 55px;">Roll No</th>
          <th style="padding: 6px 4px; text-align: center; border-right: 1px solid #cbd5e1; width: 45px;">Class</th>
          <th style="padding: 6px 4px; text-align: center; border-right: 1px solid #cbd5e1; width: 35px; color: #15803d;">P</th>
          <th style="padding: 6px 4px; text-align: center; border-right: 1px solid #cbd5e1; width: 35px; color: #b45309;">L</th>
          <th style="padding: 6px 4px; text-align: center; border-right: 1px solid #cbd5e1; width: 35px; color: #b91c1c;">A</th>
          <th style="padding: 6px 4px; text-align: center; border-right: 1px solid #cbd5e1; width: 45px;">Total</th>
          <th style="padding: 6px 4px; text-align: center; border-right: 1px solid #cbd5e1; width: 75px;">Attendance %</th>
          <th style="padding: 6px 4px; text-align: center; width: 65px;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${students.length === 0 ? `
          <tr>
            <td colspan="10" style="padding: 24px; text-align: center; color: #64748b; font-style: italic;">
              No students found matching the selected filter criteria.
            </td>
          </tr>
        ` : students.map((s, idx) => {
          const pct = s.attendancePercentage
          const isCritical = pct !== null && pct < 60
          const isLow = pct !== null && pct < 75
          const isGood = pct !== null && pct >= 85

          const statusText = pct === null ? '—' : isCritical ? 'Critical' : isLow ? 'Low' : isGood ? 'Regular' : 'Average'

          const badgeBg = isCritical ? '#fee2e2' : isLow ? '#fef3c7' : isGood ? '#dcfce7' : '#f1f5f9'
          const badgeText = isCritical ? '#991b1b' : isLow ? '#92400e' : isGood ? '#166534' : '#334155'
          const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc'

          return `
          <tr style="background: ${rowBg}; border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 5px 4px; text-align: center; border-right: 1px solid #e2e8f0; color: #64748b; font-weight: 500;">${idx + 1}</td>
            <td style="padding: 5px 8px; text-align: left; border-right: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${s.fullName || '—'}</td>
            <td style="padding: 5px 4px; text-align: center; border-right: 1px solid #e2e8f0; font-family: monospace; font-weight: 700; color: #334155;">${s.rollNo || '—'}</td>
            <td style="padding: 5px 4px; text-align: center; border-right: 1px solid #e2e8f0; color: #475569;">${s.studentClass || '—'}</td>
            <td style="padding: 5px 4px; text-align: center; border-right: 1px solid #e2e8f0; font-weight: 700; color: #16a34a;">${s.present || 0}</td>
            <td style="padding: 5px 4px; text-align: center; border-right: 1px solid #e2e8f0; font-weight: 700; color: #d97706;">${s.late || 0}</td>
            <td style="padding: 5px 4px; text-align: center; border-right: 1px solid #e2e8f0; font-weight: 700; color: #dc2626;">${s.absent || 0}</td>
            <td style="padding: 5px 4px; text-align: center; border-right: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${s.total || 0}</td>
            <td style="padding: 5px 4px; text-align: center; border-right: 1px solid #e2e8f0;">
              ${pct !== null ? `
                <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; background: ${badgeBg}; color: ${badgeText};">
                  ${pct}%
                </span>` : '—'}
            </td>
            <td style="padding: 5px 4px; text-align: center; font-size: 9.5px; font-weight: 700; color: ${badgeText};">
              ${statusText}
            </td>
          </tr>`
        }).join('')}
      </tbody>
    </table>

    <!-- ── Guidelines Notice ─────────────────────────────────────── -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 7px 10px; font-size: 9px; color: #475569; line-height: 1.4; margin-bottom: 22px;">
      <strong>Attendance Compliance Policy:</strong> P = Present, L = Late, A = Absent. Regular attendance (minimum 75%) is mandatory for all academic batches. Students with attendance below 75% are advised to report to the institute coordinator.
    </div>

    <!-- ── Signature Block ───────────────────────────────────────── -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center; margin-top: 10px;">
      <div style="border-top: 1px solid #94a3b8; padding-top: 4px;">
        <div style="font-size: 10px; font-weight: 700; color: #0f172a;">Class Faculty</div>
        <div style="font-size: 8.5px; color: #64748b;">Signature</div>
      </div>
      <div style="border-top: 1px solid #94a3b8; padding-top: 4px;">
        <div style="font-size: 10px; font-weight: 700; color: #0f172a;">Academic Coordinator</div>
        <div style="font-size: 8.5px; color: #64748b;">Verification</div>
      </div>
      <div style="border-top: 1px solid #94a3b8; padding-top: 4px;">
        <div style="font-size: 10px; font-weight: 700; color: #0f172a;">Principal / Director</div>
        <div style="font-size: 8.5px; color: #64748b;">Seal & Signature</div>
      </div>
    </div>

  </div>`
}

export default function AttendancePrintModal({
  isOpen,
  onClose,
  reportData,
  students = [],
  activeFilterLabel = 'All Students',
}) {
  const [copied, setCopied] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [fitScreen, setFitScreen] = useState(false)
  const printableRef = useRef(null)

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

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

  // Build HTML string
  const reportHtmlString = useMemo(() => {
    return buildAttendanceReportHtml({
      branding: BRANDING,
      batchName,
      periodText,
      activeFilterLabel,
      totalDays,
      students,
      totalStudents,
      avgPct,
      lowAttendanceCount,
      reportDate: new Date(),
    })
  }, [batchName, periodText, activeFilterLabel, totalDays, students, totalStudents, avgPct, lowAttendanceCount])

  if (!isOpen) return null

  // Build clean text summary for WhatsApp / clipboard
  const generateTextSummary = () => {
    let msg = `📊 *${BRANDING.name}* — Attendance Report\n`
    msg += `━━━━━━━━━━━━━━━━━━━━\n`
    msg += `📌 *Batch:* ${batchName === 'all' ? 'All Batches' : batchName}\n`
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

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(generateTextSummary())
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
  }

  const handlePrint = () => {
    window.print()
  }

  // Generates PDF using real DOM with inline styles and zero displacement
  const handleDownloadPdf = async () => {
    setDownloadingPdf(true)
    let tempContainer = null

    try {
      const module = await import('html2pdf.js')
      const html2pdf = module.default || module

      const safeBatch = (batchName || 'All').replace(/[^a-zA-Z0-9]/g, '_')
      const safeDate = new Date().toISOString().split('T')[0]
      const fileName = `Attendance_Report_${safeBatch}_${safeDate}.pdf`

      // Create an inline styled container positioned at (0, 0)
      // so html2canvas renders the exact canvas without blank coordinates
      tempContainer = document.createElement('div')
      tempContainer.id = 'attendance-pdf-render-temp'
      tempContainer.style.position = 'fixed'
      tempContainer.style.top = '0'
      tempContainer.style.left = '0'
      tempContainer.style.width = '794px'
      tempContainer.style.minWidth = '794px'
      tempContainer.style.maxWidth = '794px'
      tempContainer.style.zIndex = '99999'
      tempContainer.style.backgroundColor = '#ffffff'
      tempContainer.style.color = '#0f172a'
      tempContainer.style.pointerEvents = 'none'
      tempContainer.innerHTML = reportHtmlString
      document.body.appendChild(tempContainer)

      // Ensure all images are loaded before rasterizing
      const images = Array.from(tempContainer.querySelectorAll('img'))
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve()
          return new Promise((resolve) => {
            img.onload = resolve
            img.onerror = resolve
            setTimeout(resolve, 800)
          })
        })
      )

      const options = {
        margin: [6, 6, 6, 6],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
          width: 794,
          windowWidth: 794,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }

      const reportTarget = tempContainer.firstElementChild || tempContainer
      const worker = html2pdf().set(options).from(reportTarget)

      try {
        const pdfBlob = await worker.output('blob')
        if (pdfBlob && typeof window !== 'undefined') {
          const blobUrl = window.URL.createObjectURL(pdfBlob)
          const link = document.createElement('a')
          link.href = blobUrl
          link.download = fileName
          document.body.appendChild(link)
          link.click()
          setTimeout(() => {
            if (document.body.contains(link)) document.body.removeChild(link)
            window.URL.revokeObjectURL(blobUrl)
          }, 2000)
        } else {
          await worker.save()
        }
      } catch (blobErr) {
        console.warn('Blob generation fallback to worker.save():', blobErr)
        await worker.save()
      }
    } catch (err) {
      console.error('PDF download error:', err)
    } finally {
      if (tempContainer && document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer)
      }
      setDownloadingPdf(false)
    }
  }

  // Render via React Portal on document.body so print media query completely isolates it from #root
  return createPortal(
    <div className="attendance-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      {/* ── Scoped Print Stylesheet ────────────────────────────────────────── */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          html, body {
            height: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Completely hide the application root behind the modal */
          #root {
            display: none !important;
          }
          /* Hide any temporary rendering elements */
          #attendance-pdf-render-temp {
            display: none !important;
          }
          .no-print {
            display: none !important;
          }
          /* Reset modal wrappers so they are NOT position: fixed */
          .attendance-modal-backdrop {
            position: static !important;
            display: block !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          .attendance-modal-card {
            position: static !important;
            display: block !important;
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            max-height: none !important;
            height: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-preview-container {
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
          }
          #printable-attendance-report {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 auto !important;
            background: #ffffff !important;
          }
          tr {
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <div
        className="attendance-modal-card bg-brand-surface rounded-2xl border border-brand-border shadow-2xl max-w-5xl w-full max-h-[96vh] flex flex-col overflow-hidden text-brand-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Toolbar Header (Non-Printable) ─────────────────────────────────── */}
        <div className="no-print p-3 sm:p-4 border-b border-brand-border bg-brand-surface-tint flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Printer size={18} className="text-brand-primary shrink-0" />
              <h2 className="text-sm sm:text-base font-bold text-brand-text truncate">
                Attendance Report — Print & Share
              </h2>
            </div>
            <p className="text-[11px] text-brand-text-muted mt-0.5">
              Review A4 layout, download PDF, or share summary to WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
            {/* Mobile zoom/fit toggle */}
            <button
              type="button"
              onClick={() => setFitScreen(!fitScreen)}
              className="sm:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-surface border border-brand-border text-brand-text text-[11px] font-bold cursor-pointer"
              title="Toggle Fit to Screen vs Full Size"
            >
              {fitScreen ? <ZoomOut size={13} /> : <ZoomIn size={13} />}
              <span>{fitScreen ? 'Full 100%' : 'Fit View'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Printer size={13} />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-surface border border-brand-border text-brand-text text-xs font-bold hover:bg-brand-surface-tint active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download size={13} className="text-brand-primary" />
              <span>{downloadingPdf ? 'Saving PDF…' : 'Save PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
              title="Share on WhatsApp"
            >
              <Share2 size={13} />
              <span className="hidden xs:inline">WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-brand-surface border border-brand-border text-brand-text text-xs font-bold hover:bg-brand-surface-tint active:scale-95 transition-all cursor-pointer"
              title="Copy text summary"
            >
              {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-brand-text-muted hover:text-brand-text hover:bg-brand-surface transition-colors cursor-pointer ml-1"
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* ── Mobile Helper Bar ────────────────────────────────────────────── */}
        <div className="no-print sm:hidden px-3.5 py-1.5 bg-brand-primary/10 border-b border-brand-primary/20 flex items-center justify-between text-[11px] font-semibold text-brand-primary">
          <span className="flex items-center gap-1">
            <FileText size={12} />
            <span>Standard A4 Document</span>
          </span>
          <span className="text-[10px] text-brand-text-muted">
            {fitScreen ? 'Scaled to screen' : 'Swipe sideways to view table ➔'}
          </span>
        </div>

        {/* ── Document Preview Area (Scrollable & Responsive) ───────────────── */}
        <div className="print-preview-container flex-1 overflow-y-auto overflow-x-auto p-2.5 sm:p-6 bg-slate-200/80 dark:bg-slate-950/80">
          <div
            className="min-w-fit mx-auto flex justify-center transition-transform duration-200"
            style={
              fitScreen && typeof window !== 'undefined' && window.innerWidth < 768
                ? {
                    transform: `scale(${Math.max(0.42, (window.innerWidth - 24) / 794)})`,
                    transformOrigin: 'top center',
                    marginBottom: '-40%',
                  }
                : {}
            }
          >
            {/* The actual printable node rendered with 100% self-contained styling */}
            <div
              id="printable-attendance-report"
              ref={printableRef}
              className="shadow-xl rounded-sm"
              dangerouslySetInnerHTML={{ __html: reportHtmlString }}
            />
          </div>
        </div>

        {/* ── Modal Footer (Non-Printable) ─────────────────────────────────── */}
        <div className="no-print p-3 sm:px-6 border-t border-brand-border bg-brand-surface flex items-center justify-between text-xs text-brand-text-muted">
          <span className="truncate mr-2">
            Listed {totalStudents} student{totalStudents !== 1 ? 's' : ''} · <strong className="text-brand-text">{activeFilterLabel}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-brand-border bg-brand-surface-tint text-brand-text font-bold hover:bg-brand-surface transition-colors cursor-pointer shrink-0"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
