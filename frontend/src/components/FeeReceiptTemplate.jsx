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
  '--color-slate-50': '#f1f5f9',      // Light steel grey bg tint
  '--color-slate-100': '#cbd5e1',     // Soft slate border
  '--color-slate-200': '#cbd5e1',     // Border
  '--color-slate-300': '#cbd5e1',     
  '--color-slate-400': '#475569',     // Muted text
  '--color-slate-500': '#334155',     // Text muted
  '--color-slate-600': '#090d16',     // Main body text
  '--color-slate-700': '#090d16',     
  '--color-slate-800': '#090d16',     
  '--color-slate-900': '#090d16',     // Dark headings
  '--color-emerald-50': '#f0fdf4',    // Soft Green bg (paid status)
  '--color-emerald-200': '#bbf7d0',   // Soft Green border
  '--color-emerald-500': '#10b981',   // Green accent
  '--color-emerald-600': '#059669',
  '--color-emerald-700': '#047857',
  '--color-indigo-50': '#f1f5f9',     // Highlight tint
  '--color-indigo-200': '#cbd5e1',    // Slate border
  '--color-indigo-600': '#090d16',    // Deep Steel brand primary
  '--color-violet-600': '#1e293b',    // Secondary Steel Blue
  '--color-sky-50': '#eff6ff',        // Soft Cobalt Blue bg
  '--color-sky-200': '#bfdbfe',       // Soft Cobalt Blue border
  '--color-sky-500': '#1d4ed8',       // Cobalt Blue brand accent
  '--color-sky-700': '#1e40af',
  '--color-amber-600': '#d97706',     // Amber for warning states
  '--color-amber-700': '#b45309',
  '--color-white': '#ffffff',
}

export default function FeeReceiptTemplate({ receiptInfo, student }) {
  if (!receiptInfo || !student) return null

  const {
    amount = 0,
    amountDue = 0,
    totalCourseFee = 0,
    monthlyFeeAmount = 0,
    paymentMode = '—',
    paidAt = new Date().toISOString(),
    receiptNumber = '—',
  } = receiptInfo

  const totalAmountToPay = amountDue + amount;
  const previousDue = totalAmountToPay - monthlyFeeAmount;

  const isPaid = amountDue <= 0

  return (
    <div className="w-[700px] min-h-[950px] bg-white text-slate-800 p-12 flex flex-col justify-between relative border border-slate-100 font-sans" style={{ ...tailwindHexColors, fontFamily: '"Source Sans 3", sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap');` }} />
      {/* Watermark for fully paid */}
      {isPaid && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
          <div className="text-[90px] font-black uppercase tracking-[12px] rotate-[-35deg] whitespace-nowrap" style={{ color: 'rgba(16, 185, 129, 0.05)' }}>
            Paid in Full
          </div>
        </div>
      )}

      <div className="relative z-10 space-y-8">
        {/* ─── Header ─── */}
        <div className="flex items-start justify-between pb-6 border-b-2 border-indigo-600">
          <div>
            <h1 className="text-2xl font-extrabold text-indigo-600 tracking-tight flex items-center gap-2">
              <img src="/logo.png" alt="Lakshya Academic Institute" className="h-8 object-contain" />
              Lakshya Academic Institute
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-1">
              Excellence in Education
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider">
              Fee Receipt
            </h2>
            <p className="text-xs font-semibold text-indigo-600 mt-1">
              {receiptNumber}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              {formatDate(paidAt)}
            </p>
          </div>
        </div>

        {/* ─── Status Badge ─── */}
        <div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider ${
              isPaid
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                : 'bg-sky-50 text-sky-700 ring-1 ring-sky-200'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isPaid ? 'bg-emerald-500' : 'bg-sky-500'
              }`}
            />
            {isPaid ? 'Fully Paid' : 'Partial Payment'}
          </span>
        </div>

        {/* ─── Student Info Grid ─── */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Student Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Student Name
              </p>
              <p className="text-sm font-semibold text-slate-900 mt-1">
                {student.fullName}
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Batch
              </p>
              <p className="text-sm font-semibold text-slate-900 mt-1">
                {student.batch}
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Class
              </p>
              <p className="text-sm font-semibold text-slate-900 mt-1">
                {student.studentClass || '—'}
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Payment Mode
              </p>
              <p className="text-sm font-semibold text-slate-900 mt-1">
                {paymentMode}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Amount Highlight Banner ─── */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">
              Amount Paid This Transaction
            </p>
            <p className="text-3xl font-black text-white mt-1.5 tracking-tight">
              {formatCurrency(amount)}
            </p>
          </div>
          <div className="text-indigo-50 rounded-full px-4.5 py-1.5 text-xs font-bold uppercase tracking-wider" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.1)', borderWidth: '1px' }}>
            {paymentMode}
          </div>
        </div>

        {/* ─── Breakdown Table ─── */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Payment Breakdown
          </h3>
          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-right">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-5 py-4 text-slate-600">This Month's Fee</td>
                  <td className="px-5 py-4 text-right font-semibold text-slate-800">
                    {formatCurrency(monthlyFeeAmount)}
                  </td>
                </tr>
                {previousDue > 0 && (
                  <tr>
                    <td className="px-5 py-4 text-slate-600">Previous Due Amount</td>
                    <td className="px-5 py-4 text-right font-semibold text-slate-800">
                      {formatCurrency(previousDue)}
                    </td>
                  </tr>
                )}
                <tr className="bg-slate-50">
                  <td className="px-5 py-4 text-slate-600 font-bold">Total Amount to be Paid</td>
                  <td className="px-5 py-4 text-right font-bold text-slate-800 text-sm">
                    {formatCurrency(totalAmountToPay)}
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-4 text-slate-600 font-semibold">Amount Paid</td>
                  <td className="px-5 py-4 text-right font-bold text-emerald-600 text-sm">
                    {formatCurrency(amount)}
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-4 text-slate-600">Pending Amount</td>
                  <td className={`px-5 py-4 text-right font-bold text-sm ${amountDue > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {formatCurrency(amountDue)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <hr className="border-t border-dashed border-slate-200" />

        {/* ─── Thank-you Section ─── */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
          <h4 className="text-xs font-bold text-slate-900 mb-2">
            Dear Parent / Guardian,
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
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
      <div className="pt-6 border-t border-slate-100 flex items-end justify-between relative z-10">
        <div>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
            Computer Generated Receipt
          </p>
          <p className="text-[8px] text-slate-400 mt-1">
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
