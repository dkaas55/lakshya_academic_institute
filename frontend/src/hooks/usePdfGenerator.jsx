import { useState, useCallback } from 'react'
import { BRANDING } from '../config/branding'

function formatCurrency(val) {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val ?? 0)
  } catch {
    return `₹${val ?? 0}`
  }
}

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return String(iso)
  }
}

// We attach inline styles to all critical layout elements so styles are 100% resilient
// across mobile browsers, html2pdf clones, and print modes.
export function buildReceiptHtml(receiptInfo, student) {
  const {
    amount = 0,
    amountDue = 0,
    totalCourseFee = 0,
    monthlyFeeAmount = 0,
    paymentTiming = null,
    paymentMode = '—',
    paidAt = new Date().toISOString(),
    receiptNumber = `RCP-${Date.now().toString().slice(-8).toUpperCase()}`,
  } = receiptInfo || {}

  const studentName = student?.fullName || student?.name || 'Student'
  const rollNo = student?.rollNo || '—'
  const batchDisplay = Array.isArray(student?.batches) && student.batches.length > 0
    ? student.batches.join(', ')
    : (student?.batch || '—')
  const studentClass = student?.studentClass || '—'

  const totalAmountToPay = (Number(amountDue) || 0) + (Number(amount) || 0)
  const isPaid = (Number(amountDue) || 0) <= 0

  const timingDisplay = paymentTiming === 'advance'
    ? 'In Advance'
    : (paymentTiming === 'postpaid' || paymentTiming === 'end_of_month')
      ? 'End of Month'
      : null

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const fullLogoUrl = (BRANDING.logoUrl && BRANDING.logoUrl.startsWith('/'))
    ? `${origin}${BRANDING.logoUrl}`
    : (BRANDING.logoUrl || '')

  return `
  <div class="receipt-page" style="width: 794px; min-width: 794px; background: #ffffff; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.5; padding: 32px 36px; box-sizing: border-box; position: relative; margin: 0 auto;">
    ${isPaid ? `
      <div style="position: absolute; top: 48%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 72px; font-weight: 900; color: rgba(16, 185, 129, 0.06); text-transform: uppercase; letter-spacing: 10px; pointer-events: none; white-space: nowrap; z-index: 0;">
        PAID IN FULL
      </div>` : ''}

    <!-- ── Header ─────────────────────────────────────────────── -->
    <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 3px solid #4f46e5; margin-bottom: 20px; position: relative; z-index: 1;">
      <div style="display: flex; align-items: center; gap: 14px;">
        ${fullLogoUrl ? `<img src="${fullLogoUrl}" alt="${BRANDING.name}" style="height: 48px; max-height: 48px; width: auto; max-width: 140px; object-fit: contain; display: block;" onerror="this.style.display='none'" />` : ''}
        <div>
          <div style="font-size: 22px; font-weight: 800; color: #4f46e5; letter-spacing: -0.5px; line-height: 1.2;">${BRANDING.name}</div>
          <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 3px;">${BRANDING.tagline || 'Excellence in Education'}</div>
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 16px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 1px;">Fee Receipt</div>
        <div style="font-size: 13px; font-weight: 700; color: #4f46e5; font-family: monospace; margin-top: 3px; letter-spacing: 0.5px;">${receiptNumber}</div>
        <div style="font-size: 10px; color: #64748b; margin-top: 3px;">${formatDate(paidAt)}</div>
      </div>
    </div>

    <!-- ── Status Badge ───────────────────────────────────────── -->
    <div style="display: inline-flex; align-items: center; gap: 8px; padding: 5px 14px; border-radius: 9999px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 18px; position: relative; z-index: 1; ${
      isPaid
        ? 'background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0;'
        : 'background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;'
    }">
      <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: ${isPaid ? '#16a34a' : '#2563eb'};"></span>
      ${isPaid ? 'Fully Paid' : 'Partial Payment'}
    </div>

    <!-- ── Student Info Grid ──────────────────────────────────── -->
    <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #64748b; margin-bottom: 8px; position: relative; z-index: 1;">Student Information</div>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; position: relative; z-index: 1;">
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px;">
        <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; margin-bottom: 3px;">Student Name</div>
        <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${studentName}</div>
      </div>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px;">
        <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; margin-bottom: 3px;">Roll Number</div>
        <div style="font-size: 13px; font-weight: 700; color: #4338ca; font-family: monospace;">${rollNo}</div>
      </div>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px;">
        <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; margin-bottom: 3px;">${BRANDING.isSchool ? 'Class & Section' : 'Batch'}</div>
        <div style="font-size: 13px; font-weight: 600; color: #0f172a;">${batchDisplay}</div>
      </div>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px;">
        <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; margin-bottom: 3px;">Class</div>
        <div style="font-size: 13px; font-weight: 600; color: #0f172a;">${studentClass}</div>
      </div>
    </div>

    <!-- ── Amount Highlight Card ──────────────────────────────── -->
    <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border-radius: 10px; padding: 16px 22px; display: flex; align-items: center; justify-content: space-between; color: #ffffff; margin-bottom: 20px; position: relative; z-index: 1;">
      <div>
        <div style="color: #e0e7ff; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Amount Paid This Transaction</div>
        <div style="color: #ffffff; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; margin-top: 4px;">${formatCurrency(amount)}</div>
      </div>
      <div style="background: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.35); border-radius: 9999px; padding: 6px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #ffffff;">
        ${paymentMode}
      </div>
    </div>

    <!-- ── Payment Breakdown Table ────────────────────────────── -->
    <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #64748b; margin-bottom: 8px; position: relative; z-index: 1;">Payment Breakdown</div>
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 20px; font-size: 12px; position: relative; z-index: 1;">
      <thead>
        <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
          <th style="padding: 10px 14px; text-align: left; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Description</th>
          <th style="padding: 10px 14px; text-align: right; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 14px; color: #334155;">${BRANDING.isSchool ? 'School / Course Fee' : 'Monthly Fee'}</td>
          <td style="padding: 10px 14px; text-align: right; font-weight: 600; color: #0f172a;">${formatCurrency(monthlyFeeAmount || totalCourseFee)}</td>
        </tr>
        ${timingDisplay ? `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 14px; color: #334155;">Payment Schedule</td>
          <td style="padding: 10px 14px; text-align: right; color: #64748b;">${timingDisplay}</td>
        </tr>` : ''}
        <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 14px; font-weight: 700; color: #0f172a;">Total Amount to be Paid</td>
          <td style="padding: 10px 14px; text-align: right; font-weight: 800; color: #0f172a;">${formatCurrency(totalAmountToPay)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 14px; font-weight: 700; color: #15803d;">Amount Paid</td>
          <td style="padding: 10px 14px; text-align: right; font-weight: 800; color: #16a34a;">${formatCurrency(amount)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; color: #334155;">Pending Amount (Due Balance)</td>
          <td style="padding: 10px 14px; text-align: right; font-weight: 700; color: ${amountDue > 0 ? '#b45309' : '#15803d'};">
            ${formatCurrency(amountDue)}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- ── Thank-you Section ──────────────────────────────────── -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px; position: relative; z-index: 1;">
      <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">Dear Parent / Guardian,</div>
      <div style="font-size: 11px; color: #475569; line-height: 1.6;">
        Thank you for your payment of <strong style="color: #4f46e5;">${formatCurrency(amount)}</strong> towards
        <strong>${studentName}</strong>'s course fee. We truly appreciate your trust in
        <strong>${BRANDING.name}</strong>.
        ${amountDue > 0
          ? `<br/><br/>A balance of <strong style="color: #b45309;">${formatCurrency(amountDue)}</strong> remains. Please ensure it is cleared before the due date.`
          : '<br/><br/>We are pleased to inform you that the course fee has been <strong style="color: #15803d;">paid in full</strong>. No further payments are required for this billing cycle.'
        }
        <br/><br/>
        Please retain this receipt for your records. For any queries, contact our administrative office.
      </div>
    </div>

    <!-- ── Footer ─────────────────────────────────────────────── -->
    <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; display: flex; align-items: flex-end; justify-content: space-between; position: relative; z-index: 1;">
      <div>
        <div style="font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px;">Computer Generated Receipt · No Signature Required</div>
        <div style="font-size: 9px; color: #64748b; margin-top: 3px;">${receiptNumber} · Issued on ${formatDate(paidAt)}</div>
      </div>
      <div style="text-align: right;">
        <div style="width: 100px; border-top: 1px solid #cbd5e1; margin-bottom: 5px; margin-left: auto;"></div>
        <div style="font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px;">Authorised Signatory</div>
      </div>
    </div>

  </div>`
}

export function usePdfGenerator() {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  const generatePdf = useCallback(async (receiptInfo, student, fileName) => {
    setGenerating(true)
    setError(null)

    // Mount an offscreen container to document.body so html2pdf can render real DOM with full styling
    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.left = '-9999px'
    container.style.top = '0'
    container.style.width = '794px'
    container.style.minWidth = '794px'
    container.style.background = '#ffffff'
    container.style.zIndex = '-9999'
    container.innerHTML = buildReceiptHtml(receiptInfo, student)
    document.body.appendChild(container)

    try {
      // Ensure images inside container are loaded before generating PDF
      const images = Array.from(container.querySelectorAll('img'))
      await Promise.all(
        images.map(img => {
          if (img.complete) return Promise.resolve()
          return new Promise(resolve => {
            img.onload = resolve
            img.onerror = resolve
            setTimeout(resolve, 800)
          })
        })
      )

      const module = await import('html2pdf.js')
      const html2pdf = module.default || module

      const safeFileName = fileName || `Receipt_${Date.now()}.pdf`

      const options = {
        margin: [8, 8, 8, 8],
        filename: safeFileName,
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

      const receiptElement = container.firstElementChild || container
      const worker = html2pdf().set(options).from(receiptElement)

      try {
        const pdfBlob = await worker.output('blob')
        if (pdfBlob && typeof window !== 'undefined') {
          const blobUrl = window.URL.createObjectURL(pdfBlob)
          const link = document.createElement('a')
          link.href = blobUrl
          link.download = safeFileName
          document.body.appendChild(link)
          link.click()
          setTimeout(() => {
            if (document.body.contains(link)) {
              document.body.removeChild(link)
            }
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
      console.error('PDF generation error:', err)
      setError(err)
      throw err
    } finally {
      if (document.body.contains(container)) {
        document.body.removeChild(container)
      }
      setGenerating(false)
    }
  }, [])

  return { generatePdf, generating, error }
}
