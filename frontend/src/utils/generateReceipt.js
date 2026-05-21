/**
 * generateReceipt.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Dynamically generates a professional fee receipt PDF using html2pdf.js.
 * Renders a self-contained HTML string (no React), so it works completely
 * offline without any server round-trip.
 *
 * Usage:
 *   import { generateReceipt } from '../../utils/generateReceipt'
 *   await generateReceipt({ studentName, studentClass, batch, amount,
 *                            amountDue, paymentMode, paidAt, receiptNumber })
 */

export async function generateReceipt(receiptData) {
  const html2pdf = (await import('html2pdf.js')).default

  const {
    studentName   = 'Student',
    studentClass  = '—',
    batch         = '—',
    amount        = 0,
    amountDue     = 0,
    totalCourseFee = 0,
    paymentMode   = '—',
    paidAt        = new Date().toISOString(),
    receiptNumber = `RCP-${Date.now()}`,
  } = receiptData

  const fmtCurrency = (v) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(v ?? 0)

  const fmtDate = (iso) =>
    new Intl.DateTimeFormat('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso))

  const isPaid = amountDue <= 0

  // ── Self-contained HTML receipt template ──────────────────────────────────
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background: #fff;
      color: #1e293b;
      font-size: 11px;
      line-height: 1.4;
    }

    /* ── Page wrapper - responsive to fit A4 */
    .page {
      width: 100%;
      background: #fff;
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    /* ── Header */
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding-bottom: 18px;
      border-bottom: 2px solid #6366f1;
      margin-bottom: 24px;
    }
    .institute-name {
      font-size: 20px;
      font-weight: 800;
      color: #4f46e5;
      letter-spacing: -0.5px;
    }
    .institute-tagline {
      font-size: 9px;
      color: #64748b;
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .receipt-badge {
      text-align: right;
    }
    .receipt-title {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .receipt-number {
      font-size: 10px;
      color: #6366f1;
      font-weight: 600;
      margin-top: 3px;
    }
    .receipt-date {
      font-size: 9px;
      color: #94a3b8;
      margin-top: 1px;
    }

    /* ── Status banner */
    .status-banner {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border-radius: 100px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 22px;
    }
    .status-paid    { background: #dcfce7; color: #15803d; }
    .status-partial { background: #e0f2fe; color: #0369a1; }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; }
    .dot-paid    { background: #16a34a; }
    .dot-partial { background: #0284c7; }

    /* ── Section title */
    .section-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #94a3b8;
      margin-bottom: 8px;
    }

    /* ── Student info block */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 22px;
    }
    .info-cell {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
    }
    .info-cell-label {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      margin-bottom: 3px;
    }
    .info-cell-value {
      font-size: 12px;
      font-weight: 600;
      color: #1e293b;
    }

    /* ── Payment summary table */
    .payment-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 22px;
    }
    .payment-table thead tr {
      background: #f1f5f9;
    }
    .payment-table th {
      padding: 8px 12px;
      text-align: left;
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
    }
    .payment-table td {
      padding: 10px 12px;
      font-size: 11px;
      color: #334155;
      border-bottom: 1px solid #f1f5f9;
    }
    .payment-table .amount-col {
      font-weight: 700;
      color: #166534;
      font-size: 13px;
    }
    .payment-table .due-col {
      font-weight: 600;
      color: ${amountDue > 0 ? '#b45309' : '#166534'};
    }

    /* ── Amount highlight box */
    .amount-highlight {
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 22px;
    }
    .amount-highlight-label {
      color: #c7d2fe;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .amount-highlight-value {
      color: #fff;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -1px;
      margin-top: 3px;
    }
    .amount-mode-badge {
      background: rgba(255,255,255,0.18);
      color: #e0e7ff;
      border-radius: 100px;
      padding: 5px 12px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* ── Divider */
    .divider {
      border: none;
      border-top: 1px dashed #e2e8f0;
      margin: 16px 0;
    }

    /* ── Thank-you section */
    .thankyou {
      background: #fafafa;
      border: 1px solid #f1f5f9;
      border-radius: 10px;
      padding: 16px 18px;
      margin-bottom: 22px;
    }
    .thankyou-heading {
      font-size: 12px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 5px;
    }
    .thankyou-body {
      font-size: 10px;
      color: #64748b;
      line-height: 1.6;
    }
    .thankyou-body strong { color: #4f46e5; }

    /* ── Footer */
    .footer {
      margin-top: auto;
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .footer-note {
      font-size: 8px;
      color: #cbd5e1;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .footer-auth {
      text-align: right;
    }
    .footer-auth-line {
      width: 80px;
      border-top: 1px solid #cbd5e1;
      margin-bottom: 3px;
      margin-left: auto;
    }
    .footer-auth-label {
      font-size: 8px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }

    /* ── Watermark for fully paid */
    ${isPaid ? `
    .watermark {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      font-size: 64px;
      font-weight: 900;
      color: rgba(16, 185, 129, 0.05);
      text-transform: uppercase;
      letter-spacing: 5px;
      pointer-events: none;
      white-space: nowrap;
      z-index: 0;
    }` : ''}
  </style>
</head>
<body>
  <div class="page">
    ${isPaid ? '<div class="watermark">Paid in Full</div>' : ''}

    <!-- ── HEADER ───────────────────────────────────────────────────── -->
    <div class="header">
      <div>
        <div class="institute-name">📚 EduInstitute</div>
        <div class="institute-tagline">Excellence in Education</div>
      </div>
      <div class="receipt-badge">
        <div class="receipt-title">Fee Receipt</div>
        <div class="receipt-number">${receiptNumber}</div>
        <div class="receipt-date">${fmtDate(paidAt)}</div>
      </div>
    </div>

    <!-- ── STATUS BADGE ──────────────────────────────────────────────── -->
    <div class="status-banner ${isPaid ? 'status-paid' : 'status-partial'}">
      <span class="status-dot ${isPaid ? 'dot-paid' : 'dot-partial'}"></span>
      ${isPaid ? 'Fully Paid' : 'Partial Payment'}
    </div>

    <!-- ── STUDENT INFO ──────────────────────────────────────────────── -->
    <div class="section-label">Student Information</div>
    <div class="info-grid">
      <div class="info-cell">
        <div class="info-cell-label">Student Name</div>
        <div class="info-cell-value">${studentName}</div>
      </div>
      <div class="info-cell">
        <div class="info-cell-label">Batch</div>
        <div class="info-cell-value">${batch}</div>
      </div>
      <div class="info-cell">
        <div class="info-cell-label">Class</div>
        <div class="info-cell-value">${studentClass || '—'}</div>
      </div>
      <div class="info-cell">
        <div class="info-cell-label">Payment Mode</div>
        <div class="info-cell-value">${paymentMode}</div>
      </div>
    </div>

    <!-- ── AMOUNT HIGHLIGHT ──────────────────────────────────────────── -->
    <div class="amount-highlight">
      <div>
        <div class="amount-highlight-label">Amount Paid This Transaction</div>
        <div class="amount-highlight-value">${fmtCurrency(amount)}</div>
      </div>
      <div class="amount-mode-badge">${paymentMode}</div>
    </div>

    <!-- ── PAYMENT BREAKDOWN TABLE ───────────────────────────────────── -->
    <div class="section-label">Payment Breakdown</div>
    <table class="payment-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Total Course Fee</td>
          <td>${fmtCurrency(totalCourseFee)}</td>
        </tr>
        <tr>
          <td>This Installment</td>
          <td class="amount-col">${fmtCurrency(amount)}</td>
        </tr>
        <tr>
          <td>Balance Remaining After This Payment</td>
          <td class="due-col">${fmtCurrency(amountDue)}</td>
        </tr>
      </tbody>
    </table>

    <hr class="divider" />

    <!-- ── THANK-YOU NOTE ────────────────────────────────────────────── -->
    <div class="thankyou">
      <div class="thankyou-heading">Dear Parent / Guardian,</div>
      <div class="thankyou-body">
        Thank you for your payment of <strong>${fmtCurrency(amount)}</strong> towards
        <strong>${studentName}</strong>'s course fee. We truly appreciate your trust in
        <strong>EduInstitute</strong> and your commitment to your child's education.
        ${amountDue > 0
          ? `<br/><br/>A balance of <strong>${fmtCurrency(amountDue)}</strong> remains. Please ensure it is cleared before the due date to avoid any interruption in services.`
          : '<br/><br/>We are pleased to inform you that the course fee has been <strong>paid in full</strong>. No further payments are required for this course.'
        }
        <br/><br/>
        Please retain this receipt for your records. For any queries, contact our admin office.
      </div>
    </div>

    <!-- ── FOOTER ────────────────────────────────────────────────────── -->
    <div class="footer">
      <div>
        <div class="footer-note">Computer generated receipt · No signature required</div>
        <div class="footer-note" style="margin-top:3px;">${receiptNumber} · Issued ${fmtDate(paidAt)}</div>
      </div>
      <div class="footer-auth">
        <div class="footer-auth-line"></div>
        <div class="footer-auth-label">Authorised Signatory</div>
      </div>
    </div>

  </div>
</body>
</html>`

  const safeStudentName = studentName.replace(/[^a-zA-Z0-9]/g, '_')
  const safeDate = new Date(paidAt).toISOString().split('T')[0]
  const fileName = `Receipt_${safeStudentName}_${safeDate}.pdf`

  // ── Standard A4 PDF Options ────────────────────────────────────────────────
  const options = {
    margin:      15, // Standard 15mm margin
    filename:    fileName,
    image:       { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale:       2,
      useCORS:     true,
      logging:     false,
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  }

  // ── Call html2pdf directly from the HTML string! ──────────────────────────
  // This bypasses DOM rendering bugs, viewport scrolling bugs, and positioning issues.
  // We add a minor delay to ensure ESM modules and browser layout threads are idle.
  await new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        await html2pdf().from(html).set(options).save()
        resolve()
      } catch (err) {
        reject(err)
      }
    }, 250)
  })

  return fileName
}
