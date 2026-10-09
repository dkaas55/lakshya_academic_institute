/**
 * feeStatus.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Calculates dynamic monthly fees, amount to be paid, pending months,
 * and fee payment status based on student joining date and payment timing.
 *
 * Payment Timing:
 * - 'advance': Month 1 is billed immediately upon joining (in advance).
 * - 'after_month': Month 1 is billed only after the full month completes (end of month).
 * - null/undefined: Defaults to 'advance' for calculation until set on 1st payment.
 */

const getMonthDiff = (joiningDate, overrideNow) => {
  const now = overrideNow ? new Date(overrideNow) : new Date();
  const join = new Date(joiningDate || now);

  let monthDiff = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
  if (now.getDate() < join.getDate()) {
    monthDiff--;
  }
  return Math.max(0, monthDiff);
};

const getBilledCycles = (monthDiff, paymentTiming) => {
  if (paymentTiming === "after_month") {
    return monthDiff;
  }
  // Default to advance billing (1st cycle billed immediately on joining)
  return monthDiff + 1;
};

const getBillingCycleMonth = (joiningDate, cycleIndex, short = false) => {
  const join = new Date(joiningDate);
  const cycleDate = new Date(join.getFullYear(), join.getMonth() + cycleIndex, 1);
  return cycleDate.toLocaleString("en-US", {
    month: short ? "short" : "long",
    year: "numeric",
  });
};

const calculateDynamicAmountDue = (ledger, student, overrideNow) => {
  if (!ledger) return 0;

  const studentProfile = student || ledger.student;
  if (!studentProfile) {
    return ledger.amountDue ?? 0;
  }

  const joiningDate = studentProfile.joiningDate || studentProfile.admissionDate || ledger.createdAt || new Date();
  const monthlyFeeAmount = ledger.monthlyFeeAmount || ledger.totalFee || 0;
  const amountPaid = ledger.amountPaid || 0;
  const paymentTiming = ledger.paymentTiming;

  if (monthlyFeeAmount <= 0) {
    return Math.max(0, (ledger.totalFee || 0) - amountPaid);
  }

  const monthDiff = getMonthDiff(joiningDate, overrideNow);
  const billedCycles = getBilledCycles(monthDiff, paymentTiming);
  const totalBilled = billedCycles * monthlyFeeAmount;

  return Math.max(0, totalBilled - amountPaid);
};

const deriveFeeStatus = (ledger, student, overrideNow) => {
  if (!ledger) return "PENDING";

  const studentProfile = student || ledger.student;
  const dynamicAmountDue = calculateDynamicAmountDue(ledger, studentProfile, overrideNow);
  const amountPaid = ledger.amountPaid || 0;

  if (dynamicAmountDue <= 0) {
    return "PAID";
  }

  if (amountPaid > 0) {
    return "PARTIAL";
  }

  return "PENDING";
};

const calculateFeePendingForMonth = (ledger, student, overrideNow) => {
  if (!ledger) return "None";

  const studentProfile = student || ledger.student;
  const joiningDate = studentProfile?.joiningDate || studentProfile?.admissionDate || ledger.createdAt || new Date();
  const monthlyFeeAmount = ledger.monthlyFeeAmount || ledger.totalFee || 0;
  const amountPaid = ledger.amountPaid || 0;
  const paymentTiming = ledger.paymentTiming;

  if (monthlyFeeAmount <= 0) {
    return ledger.amountPaid >= (ledger.totalFee || 0) ? "None" : "Course Fee Pending";
  }

  const monthDiff = getMonthDiff(joiningDate, overrideNow);
  const billedCycles = getBilledCycles(monthDiff, paymentTiming);

  if (billedCycles === 0) {
    return "None (Due at end of month)";
  }

  const totalBilled = billedCycles * monthlyFeeAmount;
  const dynamicAmountDue = Math.max(0, totalBilled - amountPaid);
  const fullyPaidCycles = Math.floor(amountPaid / monthlyFeeAmount);

  if (dynamicAmountDue <= 0) {
    if (fullyPaidCycles > billedCycles && billedCycles > 0) {
      const advanceMonth = getBillingCycleMonth(joiningDate, fullyPaidCycles - 1, true);
      return `None (Paid in advance up to ${advanceMonth})`;
    }
    return "None";
  }

  const pendingCount = Math.max(0, billedCycles - fullyPaidCycles);

  if (pendingCount <= 0) {
    return "None";
  }

  const firstPendingMonth = getBillingCycleMonth(joiningDate, fullyPaidCycles);

  if (pendingCount === 1) {
    return firstPendingMonth;
  }

  const firstShort = getBillingCycleMonth(joiningDate, fullyPaidCycles, true);
  const lastShort = getBillingCycleMonth(joiningDate, billedCycles - 1, true);

  return `${pendingCount} Months (${firstShort} - ${lastShort})`;
};

const getFeeOverview = (ledger, student, overrideNow) => {
  if (!ledger) return null;

  const studentProfile = student || ledger.student;
  const monthlyFeeAmount = ledger.monthlyFeeAmount || ledger.totalFee || 0;
  const amountDue = calculateDynamicAmountDue(ledger, studentProfile, overrideNow);
  const feeStatus = deriveFeeStatus(ledger, studentProfile, overrideNow);
  const feePendingForMonth = calculateFeePendingForMonth(ledger, studentProfile, overrideNow);
  const paymentTiming = ledger.paymentTiming || null;

  return {
    monthlyFeeAmount,
    totalCourseFee: ledger.totalFee || monthlyFeeAmount,
    amountPaid: ledger.amountPaid || 0,
    amountDue,
    feeStatus,
    feePendingForMonth,
    paymentTiming,
    previousPending: 0,
  };
};

const calculatePreviousPending = () => 0;

module.exports = {
  calculateDynamicAmountDue,
  deriveFeeStatus,
  calculateFeePendingForMonth,
  getFeeOverview,
  calculatePreviousPending,
};
