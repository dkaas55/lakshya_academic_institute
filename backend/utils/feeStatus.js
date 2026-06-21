const calculateDynamicAmountDue = (ledger, student, overrideNow) => {
  if (!ledger) return 0;
  
  const studentProfile = student || ledger.student;
  if (!studentProfile) {
    return ledger.amountDue ?? 0;
  }

  const joiningDate = studentProfile.joiningDate || studentProfile.admissionDate || ledger.createdAt || new Date();
  const monthlyFeeAmount = ledger.monthlyFeeAmount || ledger.totalFee || 0;
  const totalPaidAmount = ledger.amountPaid || 0;

  const now = overrideNow || new Date();
  const join = new Date(joiningDate);
  let monthDiff = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
  
  // If the current day of the month is less than the joining day, a full month hasn't passed yet
  if (now.getDate() < join.getDate()) {
    monthDiff--;
  }
  
  monthDiff = Math.max(0, monthDiff);
  const monthsElapsed = monthDiff + 1;
  
  const calculatedDue = (monthsElapsed * monthlyFeeAmount) - totalPaidAmount;
  return Math.max(0, calculatedDue);
};

const deriveFeeStatus = (ledger, student, overrideNow) => {
  if (!ledger) return "PENDING";

  const studentProfile = student || ledger.student;
  if (!studentProfile) {
    const amountDue = ledger.amountDue ?? 0;
    const amountPaid = ledger.amountPaid ?? 0;
    if (amountDue <= 0) return "PAID";
    if (amountPaid > 0) return "PARTIAL";
    return "PENDING";
  }

  const joiningDate = studentProfile.joiningDate || studentProfile.admissionDate || ledger.createdAt || new Date();
  const monthlyFeeAmount = ledger.monthlyFeeAmount || ledger.totalFee || 0;
  const amountPaid = ledger.amountPaid || 0;

  const now = overrideNow || new Date();
  const join = new Date(joiningDate);
  
  // Calculate month difference using the billing day rule
  let monthDiff = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
  
  const currentCalendarMonthBilled = now.getDate() >= join.getDate();
  if (!currentCalendarMonthBilled) {
    monthDiff--;
  }
  monthDiff = Math.max(0, monthDiff);
  const monthsElapsed = monthDiff + 1;

  // Calculate dynamic amount due
  const totalBilled = monthsElapsed * monthlyFeeAmount;
  const dynamicAmountDue = Math.max(0, totalBilled - amountPaid);

  if (dynamicAmountDue <= 0) {
    return "PAID";
  }

  if (!currentCalendarMonthBilled) {
    // Current calendar month has not been billed yet.
    // So any outstanding amountDue > 0 must be from previous months.
    return "PREVIOUS PENDING";
  }

  // Get name of the current billing month (Month M, index M - 1)
  const getBillingMonthName = (dateVal, index) => {
    const j = new Date(dateVal);
    const d = new Date(j.getFullYear(), j.getMonth() + index, 15);
    return d.toLocaleString("en-US", { month: "long" }).toUpperCase();
  };

  const currentMonthName = getBillingMonthName(joiningDate, monthsElapsed - 1);
  const previousMonthsDue = (monthsElapsed - 1) * monthlyFeeAmount;
  const isPreviousCleared = amountPaid >= previousMonthsDue;

  if (isPreviousCleared) {
    const currentPaid = amountPaid - previousMonthsDue;
    if (currentPaid > 0) {
      return "PARTIAL";
    }
    return `PENDING - ${currentMonthName}`;
  }

  // Previous is NOT cleared (so previous months are pending).
  // Since amountPaid < previousMonthsDue, the current month has 0 paid.
  // If there is at least one previous month (monthsElapsed > 1):
  if (monthsElapsed > 1) {
    return "PENDING";
  }
  
  // If monthsElapsed === 1, there is no previous month. The only month (Month 1) is current.
  // But wait, if currentCalendarMonthBilled is true, then Month 1 is the current month and is due.
  // Since amountPaid < monthlyFeeAmount, if amountPaid > 0, it's partially paid.
  if (amountPaid > 0) {
    return "PARTIAL";
  }
  return `PENDING - ${currentMonthName}`;
};

module.exports = { calculateDynamicAmountDue, deriveFeeStatus };
