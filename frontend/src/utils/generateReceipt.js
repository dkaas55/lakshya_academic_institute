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

import { buildReceiptHtml } from '../hooks/usePdfGenerator'

export async function generateReceipt(receiptData) {
  const module = await import('html2pdf.js')
  const html2pdf = module.default || module

  const {
    studentName   = 'Student',
    studentClass  = '—',
    batch         = '—',
    batches       = [],
    rollNo        = '—',
    amount        = 0,
    amountDue     = 0,
    totalCourseFee = 0,
    monthlyFeeAmount = 0,
    paymentTiming = null,
    paymentMode   = '—',
    paidAt        = new Date().toISOString(),
    receiptNumber = `RCP-${Date.now().toString().slice(-8).toUpperCase()}`,
  } = receiptData || {}

  const receiptInfo = {
    amount,
    amountDue,
    totalCourseFee,
    monthlyFeeAmount,
    paymentTiming,
    paymentMode,
    paidAt,
    receiptNumber,
  }

  const student = {
    fullName: studentName,
    rollNo,
    batch,
    batches: Array.isArray(batches) && batches.length > 0 ? batches : (batch ? [batch] : []),
    studentClass,
  }

  const safeStudentName = studentName.replace(/[^a-zA-Z0-9]/g, '_')
  const safeDate = new Date(paidAt).toISOString().split('T')[0]
  const fileName = `Receipt_${safeStudentName}_${safeDate}.pdf`

  const html = buildReceiptHtml(receiptInfo, student)

  const options = {
    margin: [10, 10, 10, 10],
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

  const worker = html2pdf().set(options).from(html)

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
        if (document.body.contains(link)) {
          document.body.removeChild(link)
        }
        window.URL.revokeObjectURL(blobUrl)
      }, 2000)
    } else {
      await worker.save()
    }
  } catch (err) {
    console.warn('Blob generation/download fallback to worker.save():', err)
    await worker.save()
  }

  return fileName
}
