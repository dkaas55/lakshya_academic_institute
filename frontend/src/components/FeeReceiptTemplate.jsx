import React from 'react'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value ?? 0)
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

const tailwindHexColors = {
  '--color-slate-50': '#f8fafc',
  '--color-slate-100': '#f1f5f9',
  '--color-slate-200': '#e2e8f0',
  '--color-slate-300': '#cbd5e1',
  '--color-slate-400': '#64748b',
  '--color-slate-500': '#475569',
  '--color-slate-600': '#334155',
  '--color-slate-700': '#1e293b',
  '--color-slate-800': '#0f172a',
  '--color-slate-900': '#0f172a',
  '--color-emerald-50': '#f0fdf4',
  '--color-emerald-100': '#dcfce7',
  '--color-emerald-200': '#bbf7d0',
  '--color-emerald-500': '#10b981',
  '--color-emerald-600': '#16a34a',
  '--color-emerald-700': '#15803d',
  '--color-emerald-800': '#065f46',
  '--color-indigo-50': '#eef2ff',
  '--color-indigo-100': '#e0e7ff',
  '--color-indigo-200': '#c7d2fe',
  '--color-indigo-600': '#4f46e5',
  '--color-indigo-700': '#4338ca',
  '--color-violet-600': '#7c3aed',
  '--color-sky-50': '#f0f9ff',
  '--color-sky-200': '#bae6fd',
  '--color-sky-500': '#0ea5e9',
  '--color-sky-700': '#0369a1',
  '--color-amber-50': '#fffbeb',
  '--color-amber-600': '#d97706',
  '--color-amber-700': '#b45309',
  '--color-white': '#ffffff',
  '--color-primary': '#4f46e5',
  '--color-brand-primary': '#4f46e5',
  '--color-brand-text': '#0f172a',
  '--color-brand-border': '#e2e8f0',
  '--color-brand-surface': '#ffffff',
}

export default function FeeReceiptTemplate({ receiptInfo, student }) {
  if (!receiptInfo || !student) return null

  const {
    amount = 0,
    amountDue = 0,
    totalCourseFee = 0,
    monthlyFeeAmount = 0,
    paymentTiming = null,
    paymentMode = '—',
    paidAt = new Date().toISOString(),
    receiptNumber = '—',
  } = receiptInfo

  const totalAmountToPay = amountDue + amount;
  const isPaid = amountDue <= 0

  return (
    <div
      className="w-[700px] h-[980px] max-h-[980px] bg-white text-slate-800 px-10 py-7 flex flex-col justify-between relative border border-slate-100 font-sans box-border overflow-hidden"
      style={{ ...tailwindHexColors, fontFamily: '"Source Sans 3", sans-serif' }}
    >
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap');` }} />
      {/* Watermark for fully paid */}
      {isPaid && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
          <div className="text-[80px] font-black uppercase tracking-[12px] rotate-[-35deg] whitespace-nowrap" style={{ color: 'rgba(16, 185, 129, 0.05)' }}>
            Paid in Full
          </div>
        </div>
      )}

      <div className="relative z-10 space-y-4">
        {/* ─── Header ─── */}
        <div className="flex items-start justify-between pb-3.5 border-b-2 border-indigo-600">
          <div>
            <h1 className="text-xl font-extrabold text-indigo-600 tracking-tight flex items-center gap-2">
              <img src="/logo.png" alt="Lakshya Academic Institute" className="h-7 object-contain" />
              Lakshya Academic Institute
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">
              Excellence in Education
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              Fee Receipt
            </h2>
            <p className="text-xs font-semibold text-indigo-600 mt-0.5">
              {receiptNumber}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {formatDate(paidAt)}
            </p>
          </div>
        </div>

        {/* ─── Status Badge ─── */}
        <div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: isPaid ? '#f0fdf4' : '#eff6ff',
              color: isPaid ? '#047857' : '#1d4ed8',
              border: `1px solid ${isPaid ? '#bbf7d0' : '#bfdbfe'}`
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: isPaid ? '#10b981' : '#3b82f6' }}
            />
            {isPaid ? 'Fully Paid' : 'Partial Payment'}
          </span>
        </div>

        {/* ─── Student Info Grid ─── */}
        <div className="space-y-1.5">
          <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            Student Information
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                Student Name
              </p>
              <p className="text-xs font-semibold text-slate-900 mt-0.5">
                {student.fullName}
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                Roll Number
              </p>
              <p className="text-xs font-semibold text-indigo-700 font-mono mt-0.5">
                {student.rollNo || '—'}
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                Batch
              </p>
              <p className="text-xs font-semibold text-slate-900 mt-0.5">
                {Array.isArray(student.batches) && student.batches.length > 0
                  ? student.batches.join(', ')
                  : (student.batch || '—')}
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                Class
              </p>
              <p className="text-xs font-semibold text-slate-900 mt-0.5">
                {student.studentClass || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Amount Highlight Banner ─── */}
        <div
          className="rounded-xl px-5 py-3.5 flex items-center justify-between"
          style={{
            background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div>
            <p className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest">
              Amount Paid This Transaction
            </p>
            <p className="text-2xl font-black text-white mt-0.5 tracking-tight">
              {formatCurrency(amount)}
            </p>
          </div>
          <div className="text-indigo-50 rounded-full px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.2)', borderWidth: '1px' }}>
            {paymentMode}
          </div>
        </div>

        {/* ─── Breakdown Table ─── */}
        <div className="space-y-1.5">
          <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            Payment Breakdown
          </h3>
          <div className="border border-slate-100 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    Description
                  </th>
                  <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wider text-right text-[10px]">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-2.5 text-slate-600">Monthly Fee</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-800">
                    {formatCurrency(monthlyFeeAmount || totalCourseFee)}
                  </td>
                </tr>
                {paymentTiming && (
                  <tr>
                    <td className="px-4 py-2.5 text-slate-600">Payment Schedule</td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-700">
                      {paymentTiming === 'advance' ? 'In Advance' : 'End of Month'}
                    </td>
                  </tr>
                )}
                <tr className="bg-slate-50/80">
                  <td className="px-4 py-2.5 text-slate-700 font-bold">Total Amount to be Paid</td>
                  <td className="px-4 py-2.5 text-right font-bold text-slate-800">
                    {formatCurrency(totalAmountToPay)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-slate-600 font-semibold">Amount Paid</td>
                  <td className="px-4 py-2.5 text-right font-bold text-emerald-600">
                    {formatCurrency(amount)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-slate-600">Pending Amount</td>
                  <td className={`px-4 py-2.5 text-right font-bold ${amountDue > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {formatCurrency(amountDue)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <hr className="border-t border-dashed border-slate-200 my-1" />

        {/* ─── Thank-you Section ─── */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
          <h4 className="text-[11px] font-bold text-slate-900 mb-1">
            Dear Parent / Guardian,
          </h4>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Thank you for your payment of <strong className="text-indigo-600 font-semibold">{formatCurrency(amount)}</strong> towards{' '}
            <strong className="text-slate-800 font-semibold">{student.fullName}</strong>'s course fee. We appreciate your partnership with{' '}
            <strong className="text-indigo-600 font-semibold">Lakshya Academic Institute</strong>.
            {amountDue > 0 ? (
              <span>
                {' '}A balance of <strong className="text-amber-700 font-semibold">{formatCurrency(amountDue)}</strong> remains. Please make timely payments to avoid interruption.
              </span>
            ) : (
              <span>
                {' '}We are pleased to inform you that the course fee has been <strong className="text-emerald-700 font-semibold">paid in full</strong>.
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <div className="pt-3 border-t border-slate-200 flex items-end justify-between relative z-10">
        <div>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
            Computer Generated Receipt
          </p>
          <p className="text-[8px] text-slate-400 mt-0.5">
            {receiptNumber} · Issued on {formatDate(paidAt)}
          </p>
        </div>
        <div className="text-right">
          <div className="w-24 border-t border-slate-300 ml-auto mb-1" />
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
            Authorised Signatory
          </p>
        </div>
      </div>
    </div>
  )
}
