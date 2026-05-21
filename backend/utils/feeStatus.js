const calculateDynamicAmountDue = (ledger, student) => {
  if (!ledger) return 0;
  
  const studentProfile = student || ledger.student;
  if (!studentProfile) {
    return ledger.amountDue ?? 0;
  }

  const joiningDate = studentProfile.joiningDate || studentProfile.admissionDate || ledger.createdAt || new Date();
  const monthlyFeeAmount = ledger.monthlyFeeAmount || ledger.totalFee || 0;
  const totalPaidAmount = ledger.amountPaid || 0;

  const msDiff = new Date() - new Date(joiningDate);
  const monthsElapsed = Math.floor(msDiff / (1000 * 60 * 60 * 24 * 30)) + 1;
  
  const calculatedDue = (monthsElapsed * monthlyFeeAmount) - totalPaidAmount;
  return Math.max(0, calculatedDue);
};

const deriveFeeStatus = (ledger, student) => {
  const amountDue = calculateDynamicAmountDue(ledger, student);
  const amountPaid = ledger?.amountPaid ?? 0;

  if (amountDue <= 0) {
    return "PAID";
  }
  if (amountPaid > 0) {
    return "PARTIAL";
  }
  return "PENDING";
};

module.exports = { calculateDynamicAmountDue, deriveFeeStatus };
