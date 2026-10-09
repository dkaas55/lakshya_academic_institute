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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #ffffff;
      color: #0f172a;
      font-size: 11px;
      line-height: 1.45;
      padding: 0;
    }
    .receipt-page {
      width: 100%;
      background: #ffffff;
      position: relative;
      box-sizing: border-box;
      padding: 6px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 14px;
      border-bottom: 2.5px solid #4f46e5;
      margin-bottom: 16px;
    }
    .brand-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .institute-logo {
      height: 36px;
      max-width: 120px;
      object-fit: contain;
    }
    .institute-name {
      font-size: 19px;
      font-weight: 800;
      color: #4f46e5;
      letter-spacing: -0.4px;
      line-height: 1.2;
    }
    .institute-tagline {
      font-size: 9px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      margin-top: 2px;
    }
    .receipt-badge {
      text-align: right;
    }
    .receipt-title {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .receipt-number {
      font-size: 11px;
      font-weight: 700;
      color: #4f46e5;
      margin-top: 2px;
      font-family: monospace;
      letter-spacing: 0.5px;
    }
    .receipt-date {
      font-size: 9px;
      color: #64748b;
      margin-top: 2px;
    }
    .status-banner {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 14px;
    }
    .status-paid {
      background: #f0fdf4;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }
    .status-partial {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    .dot-paid { background: #16a34a; }
    .dot-partial { background: #2563eb; }
    .section-title {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #94a3b8;
      margin-bottom: 6px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 16px;
    }
    .info-cell {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 12px;
    }
    .info-cell-label {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
      margin-bottom: 2px;
    }
    .info-cell-value {
      font-size: 11px;
      font-weight: 600;
      color: #0f172a;
    }
    .info-cell-roll {
      color: #4338ca;
      font-family: monospace;
      font-weight: 700;
    }
    .amount-highlight {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      border-radius: 10px;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #ffffff;
      margin-bottom: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .amount-highlight-label {
      color: #e0e7ff;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .amount-highlight-value {
      color: #ffffff;
      font-size: 22px;
      font-weight: 900;
      letter-spacing: -0.5px;
      margin-top: 2px;
    }
    .amount-mode-badge {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 9999px;
      padding: 5px 12px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }
    .breakdown-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 16px;
      font-size: 11px;
    }
    .breakdown-table thead tr {
      background: #f8fafc;
    }
    .breakdown-table th {
      padding: 8px 12px;
      text-align: left;
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
    }
    .breakdown-table td {
      padding: 9px 12px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .breakdown-table tr.total-row {
      background: #f8fafc;
    }
    .breakdown-table .amount-col {
      font-weight: 700;
      color: #16a34a;
      text-align: right;
    }
    .breakdown-table .due-col {
      font-weight: 700;
      text-align: right;
    }
    .breakdown-table .num-col {
      text-align: right;
      font-weight: 600;
      color: #0f172a;
    }
    .thankyou {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 18px;
    }
    .thankyou-heading {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .thankyou-body {
      font-size: 10px;
      color: #475569;
      line-height: 1.55;
    }
    .thankyou-body strong {
      color: #4f46e5;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
    }
    .footer-note {
      font-size: 8px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .footer-meta {
      font-size: 8px;
      color: #64748b;
      margin-top: 2px;
    }
    .footer-auth {
      text-align: right;
    }
    .footer-auth-line {
      width: 90px;
      border-top: 1px solid #cbd5e1;
      margin-bottom: 4px;
      margin-left: auto;
    }
    .footer-auth-label {
      font-size: 8px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 68px;
      font-weight: 900;
      color: rgba(16, 185, 129, 0.05);
      text-transform: uppercase;
      letter-spacing: 8px;
      pointer-events: none;
      white-space: nowrap;
      z-index: 0;
    }
  </style>
</head>
<body>
  <div class="receipt-page">
    ${isPaid ? '<div class="watermark">Paid in Full</div>' : ''}

    <!-- ── Header ─────────────────────────────────────────────── -->
    <div class="header">
      <div class="brand-section">
        ${fullLogoUrl ? `<img src="${fullLogoUrl}" alt="${BRANDING.name}" class="institute-logo" onerror="this.style.display='none'" />` : ''}
        <div>
          <div class="institute-name">${BRANDING.name}</div>
          <div class="institute-tagline">${BRANDING.tagline || 'Excellence in Education'}</div>
        </div>
      </div>
      <div class="receipt-badge">
        <div class="receipt-title">Fee Receipt</div>
        <div class="receipt-number">${receiptNumber}</div>
        <div class="receipt-date">${formatDate(paidAt)}</div>
      </div>
    </div>

    <!-- ── Status Badge ───────────────────────────────────────── -->
    <div class="status-banner ${isPaid ? 'status-paid' : 'status-partial'}">
      <span class="status-dot ${isPaid ? 'dot-paid' : 'dot-partial'}"></span>
      ${isPaid ? 'Fully Paid' : 'Partial Payment'}
    </div>

    <!-- ── Student Info ───────────────────────────────────────── -->
    <div class="section-title">Student Information</div>
    <div class="info-grid">
      <div class="info-cell">
        <div class="info-cell-label">Student Name</div>
        <div class="info-cell-value">${studentName}</div>
      </div>
      <div class="info-cell">
        <div class="info-cell-label">Roll Number</div>
        <div class="info-cell-value info-cell-roll">${rollNo}</div>
      </div>
      <div class="info-cell">
        <div class="info-cell-label">${BRANDING.isSchool ? 'Class & Section' : 'Batch'}</div>
        <div class="info-cell-value">${batchDisplay}</div>
      </div>
      <div class="info-cell">
        <div class="info-cell-label">Class</div>
        <div class="info-cell-value">${studentClass}</div>
      </div>
    </div>

    <!-- ── Amount Highlight ───────────────────────────────────── -->
    <div class="amount-highlight">
      <div>
        <div class="amount-highlight-label">Amount Paid This Transaction</div>
        <div class="amount-highlight-value">${formatCurrency(amount)}</div>
      </div>
      <div class="amount-mode-badge">${paymentMode}</div>
    </div>

    <!-- ── Payment Breakdown Table ────────────────────────────── -->
    <div class="section-title">Payment Breakdown</div>
    <table class="breakdown-table">
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${BRANDING.isSchool ? 'School / Course Fee' : 'Monthly Fee'}</td>
          <td class="num-col">${formatCurrency(monthlyFeeAmount || totalCourseFee)}</td>
        </tr>
        ${timingDisplay ? `
        <tr>
          <td>Payment Schedule</td>
          <td class="num-col" style="color: #64748b; font-weight: normal;">${timingDisplay}</td>
        </tr>` : ''}
        <tr class="total-row">
          <td><strong>Total Amount to be Paid</strong></td>
          <td class="num-col"><strong>${formatCurrency(totalAmountToPay)}</strong></td>
        </tr>
        <tr>
          <td style="font-weight: 600; color: #15803d;">Amount Paid</td>
          <td class="amount-col">${formatCurrency(amount)}</td>
        </tr>
        <tr>
          <td>Pending Amount (Due Balance)</td>
          <td class="due-col" style="color: ${amountDue > 0 ? '#b45309' : '#15803d'};">
            ${formatCurrency(amountDue)}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- ── Thank-you Section ──────────────────────────────────── -->
    <div class="thankyou">
      <div class="thankyou-heading">Dear Parent / Guardian,</div>
      <div class="thankyou-body">
        Thank you for your payment of <strong>${formatCurrency(amount)}</strong> towards
        <strong>${studentName}</strong>'s course fee. We truly appreciate your trust in
        <strong>${BRANDING.name}</strong>.
        ${amountDue > 0
          ? `<br/><br/>A balance of <strong style="color: #b45309;">${formatCurrency(amountDue)}</strong> remains. Please ensure it is cleared before the due date to avoid any interruption in services.`
          : '<br/><br/>We are pleased to inform you that the course fee has been <strong style="color: #15803d;">paid in full</strong>. No further payments are required for this billing cycle.'
        }
        <br/><br/>
        Please retain this receipt for your records. For any queries, contact our administrative office.
      </div>
    </div>

    <!-- ── Footer ─────────────────────────────────────────────── -->
    <div class="footer">
      <div>
        <div class="footer-note">Computer Generated Receipt · No Signature Required</div>
        <div class="footer-meta">${receiptNumber} · Issued on ${formatDate(paidAt)}</div>
      </div>
      <div class="footer-auth">
        <div class="footer-auth-line"></div>
        <div class="footer-auth-label">Authorised Signatory</div>
      </div>
    </div>

  </div>
</body>
</html>`
}

export function usePdfGenerator() {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  const generatePdf = useCallback(async (receiptInfo, student, fileName) => {
    setGenerating(true)
    setError(null)

    try {
      const html = buildReceiptHtml(receiptInfo, student)
      const module = await import('html2pdf.js')
      const html2pdf = module.default || module

      const safeFileName = fileName || `Receipt_${Date.now()}.pdf`

      const options = {
        margin: [10, 10, 10, 10], // standard 10mm margins
        filename: safeFileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }

      const worker = html2pdf().set(options).from(html)

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
        console.warn('Blob generation/download fallback to worker.save():', blobErr)
        await worker.save()
      }
    } catch (err) {
      console.error('PDF generation error:', err)
      setError(err)
      throw err
    } finally {
      setGenerating(false)
    }
  }, [])

  return { generatePdf, generating, error }
}
