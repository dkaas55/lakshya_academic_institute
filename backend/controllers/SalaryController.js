const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");
const FeeLedger = require("../models/FeeLedger");
const TeacherSalaryPayment = require("../models/TeacherSalaryPayment");

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * Returns formatted month string like "October 2026"
 */
const formatMonthString = (date = new Date()) => {
  const d = new Date(date);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
};

/**
 * Parses a month string like "October 2026" or "2026-10" or a Date
 * Returns { monthName, year, monthIndex, startDate, endDate }
 */
const parseMonth = (monthInput) => {
  if (!monthInput) {
    const now = new Date();
    const year = now.getFullYear();
    const monthIndex = now.getMonth();
    return {
      monthName: `${MONTH_NAMES[monthIndex]} ${year}`,
      year,
      monthIndex,
      startDate: new Date(year, monthIndex, 1, 0, 0, 0, 0),
      endDate: new Date(year, monthIndex + 1, 0, 23, 59, 59, 999),
    };
  }

  if (typeof monthInput === "string") {
    const trimmed = monthInput.trim();
    const parts = trimmed.split(/\s+/);
    if (parts.length === 2 && MONTH_NAMES.includes(parts[0])) {
      const monthIndex = MONTH_NAMES.indexOf(parts[0]);
      const year = parseInt(parts[1], 10);
      if (!isNaN(year)) {
        return {
          monthName: `${parts[0]} ${year}`,
          year,
          monthIndex,
          startDate: new Date(year, monthIndex, 1, 0, 0, 0, 0),
          endDate: new Date(year, monthIndex + 1, 0, 23, 59, 59, 999),
        };
      }
    }
  }

  const d = new Date(monthInput);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const monthIndex = d.getMonth();
    return {
      monthName: `${MONTH_NAMES[monthIndex]} ${year}`,
      year,
      monthIndex,
      startDate: new Date(year, monthIndex, 1, 0, 0, 0, 0),
      endDate: new Date(year, monthIndex + 1, 0, 23, 59, 59, 999),
    };
  }

  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  return {
    monthName: `${MONTH_NAMES[monthIndex]} ${year}`,
    year,
    monthIndex,
    startDate: new Date(year, monthIndex, 1, 0, 0, 0, 0),
    endDate: new Date(year, monthIndex + 1, 0, 23, 59, 59, 999),
  };
};

/**
 * Returns a list of month names (e.g. ["October 2026", "September 2026", ...])
 * starting from teacher's joining date up to current month (descending).
 * Future months are not included as dues because the month has not arrived yet.
 */
const getMonthsListForTeacher = (teacher, numMonthsAhead = 0) => {
  const now = new Date();
  const joinDate = teacher?.joiningDate
    ? new Date(teacher.joiningDate)
    : new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const endLimitDate = new Date(now.getFullYear(), now.getMonth() + numMonthsAhead, 1);
  const startLimitDate = new Date(joinDate.getFullYear(), joinDate.getMonth(), 1);

  const months = [];
  const cur = new Date(endLimitDate);
  while (cur >= startLimitDate) {
    months.push(`${MONTH_NAMES[cur.getMonth()]} ${cur.getFullYear()}`);
    cur.setMonth(cur.getMonth() - 1);
  }

  const currentMonthStr = formatMonthString(now);
  if (!months.includes(currentMonthStr)) {
    months.unshift(currentMonthStr);
  }

  return months;
};

/**
 * Calculates a teacher's salary for a specific month.
 * If compensationType is 'fixed', returns the fixedSalary/salaryAmount.
 * If 'percentage', sums the monthly fees of all active students enrolled in the teacher's assigned batches
 * on or before the target month, and multiplies by the teacher's salaryPercentage.
 */
const calculateTeacherSalaryForMonth = async (teacherOrId, monthInput) => {
  const teacher =
    typeof teacherOrId === "object" && teacherOrId?._id
      ? teacherOrId
      : await User.findById(teacherOrId).lean();

  if (!teacher || teacher.role !== "teacher") {
    return {
      salary: 0,
      month: formatMonthString(),
      compensationType: "fixed",
      studentCount: 0,
      students: [],
    };
  }

  const monthObj = parseMonth(monthInput);
  const targetMonthStr = monthObj.monthName;

  // If month is prior to teacher's joining month
  if (teacher.joiningDate) {
    const teacherJoin = new Date(teacher.joiningDate);
    if (monthObj.endDate < teacherJoin) {
      return {
        salary: 0,
        month: targetMonthStr,
        compensationType: teacher.compensationType || "fixed",
        isPriorToJoining: true,
        studentCount: 0,
        students: [],
        totalMonthlyFee: 0,
      };
    }
  }

  // Calculate days in month & check for partial/prorated joining month
  const totalDaysInMonth = new Date(monthObj.year, monthObj.monthIndex + 1, 0).getDate();
  let daysWorked = totalDaysInMonth;
  let isProrated = false;

  if (teacher.joiningDate) {
    const teacherJoin = new Date(teacher.joiningDate);
    if (
      teacherJoin.getFullYear() === monthObj.year &&
      teacherJoin.getMonth() === monthObj.monthIndex &&
      teacherJoin.getDate() > 1
    ) {
      isProrated = true;
      daysWorked = Math.max(1, totalDaysInMonth - teacherJoin.getDate() + 1);
    }
  }
  const prorationRatio = isProrated ? daysWorked / totalDaysInMonth : 1;

  if (teacher.compensationType === "fixed") {
    const fixedAmount = teacher.fixedSalary ?? teacher.salaryAmount ?? 0;
    const proratedSalary = isProrated ? Math.round(fixedAmount * prorationRatio) : fixedAmount;
    return {
      salary: proratedSalary,
      fullSalary: fixedAmount,
      isProrated,
      daysWorked,
      totalDaysInMonth,
      month: targetMonthStr,
      compensationType: "fixed",
      fixedSalary: fixedAmount,
      studentCount: 0,
      students: [],
    };
  }

  if (teacher.compensationType === "percentage") {
    const students = await StudentProfile.find({
      batch: { $in: teacher.assignedBatches || [] },
      status: { $ne: "removed" },
      joiningDate: { $lte: monthObj.endDate },
    })
      .populate("user", "name")
      .lean();

    const studentIds = students.map((s) => s._id);
    const ledgers = await FeeLedger.find({ student: { $in: studentIds } }).lean();
    const ledgerMap = new Map();
    for (const l of ledgers) {
      ledgerMap.set(l.student.toString(), l);
    }

    const percentage = teacher.salaryPercentage ?? teacher.studentPercentage ?? 0;
    const studentBreakdown = [];
    let totalMonthlyFee = 0;
    let totalCollectedThisMonth = 0;

    for (const s of students) {
      const ledger = ledgerMap.get(s._id.toString());
      const monthlyFee = ledger?.monthlyFeeAmount || ledger?.totalFee || 0;
      totalMonthlyFee += monthlyFee;

      let collectedForMonth = 0;
      if (ledger?.paymentHistory) {
        for (const p of ledger.paymentHistory) {
          if (p.paidAt && p.paidAt >= monthObj.startDate && p.paidAt <= monthObj.endDate) {
            collectedForMonth += p.amount || 0;
          }
        }
      }
      totalCollectedThisMonth += collectedForMonth;

      const baseTeacherShare = monthlyFee * (percentage / 100);
      const proratedTeacherShare = isProrated ? Math.round(baseTeacherShare * prorationRatio) : baseTeacherShare;

      studentBreakdown.push({
        id: s._id,
        name: s.user?.name || "Unknown",
        batch: s.batch,
        monthlyFee,
        teacherShare: proratedTeacherShare,
        baseTeacherShare,
        feeCollectedThisMonth: collectedForMonth,
        teacherShareOfCollected: collectedForMonth * (percentage / 100),
      });
    }

    const baseCalculatedSalary = totalMonthlyFee * (percentage / 100);
    const finalSalary = isProrated ? Math.round(baseCalculatedSalary * prorationRatio) : baseCalculatedSalary;

    return {
      salary: finalSalary,
      fullSalary: baseCalculatedSalary,
      isProrated,
      daysWorked,
      totalDaysInMonth,
      month: targetMonthStr,
      compensationType: "percentage",
      salaryPercentage: percentage,
      totalMonthlyFee,
      studentCount: students.length,
      students: studentBreakdown,
      totalCollectedThisMonth,
      teacherShareOfCollected: totalCollectedThisMonth * (percentage / 100),
    };
  }

  // Fallback
  const fallbackSalary = teacher.fixedSalary ?? teacher.salaryAmount ?? 0;
  const proratedFallback = isProrated ? Math.round(fallbackSalary * prorationRatio) : fallbackSalary;
  return {
    salary: proratedFallback,
    fullSalary: fallbackSalary,
    isProrated,
    daysWorked,
    totalDaysInMonth,
    month: targetMonthStr,
    compensationType: "fixed",
    studentCount: 0,
    students: [],
  };
};

/**
 * Backward compatibility helper:
 * calculateTeacherSalary(teacherId, monthInput)
 */
const calculateTeacherSalary = async (teacherId, monthInput) => {
  const result = await calculateTeacherSalaryForMonth(teacherId, monthInput);
  return result.salary;
};

/**
 * Builds month-by-month salary ledger for teacher across their months list
 */
const buildTeacherMonthlyLedger = async (teacher, allPayments, monthsList, stats = null) => {
  if (!stats) {
    stats = await calculateTeacherAccumulatedStats(teacher, allPayments, monthsList);
  }
  const currentMonthObj = parseMonth();
  const currentMonthStart = currentMonthObj.startDate;
  const ledger = [];

  for (const m of monthsList) {
    const mObj = parseMonth(m);
    const alloc = stats.monthLedgerAllocations?.[m] || {
      salary: 0,
      totalPaid: 0,
      amountDue: 0,
      studentCount: 0,
      isPriorToJoining: false,
    };
    const isPast = mObj.endDate < currentMonthStart;
    const isCurrent =
      mObj.year === currentMonthObj.year &&
      mObj.monthIndex === currentMonthObj.monthIndex;
    const isFuture = mObj.startDate > currentMonthObj.endDate;
    const isOverdue = isPast && alloc.amountDue > 0 && !alloc.isPriorToJoining;

    let status = "PAID";
    if (alloc.isPriorToJoining || (alloc.salary === 0 && alloc.totalPaid === 0)) {
      status = "N/A";
    } else if (isFuture) {
      status = alloc.totalPaid > 0 ? (alloc.amountDue === 0 ? "PAID" : "ADVANCE") : "UPCOMING";
    } else if (alloc.amountDue === 0 && alloc.totalPaid > 0) {
      status = "PAID";
    } else if (isOverdue) {
      status = alloc.totalPaid > 0 ? "PARTIAL" : "OVERDUE";
    } else if (alloc.totalPaid > 0 && alloc.amountDue > 0) {
      status = "PARTIAL";
    } else if (alloc.totalPaid === 0 && alloc.salary > 0) {
      status = "UNPAID";
    }

    ledger.push({
      month: m,
      salary: alloc.salary,
      advancePaid: 0,
      endPaid: alloc.totalPaid,
      totalPaid: alloc.totalPaid,
      amountDue: alloc.amountDue,
      status,
      isPast,
      isCurrent,
      isFuture,
      isOverdue,
      isProrated: alloc.isProrated || false,
      daysWorked: alloc.daysWorked,
      totalDaysInMonth: alloc.totalDaysInMonth,
      studentCount: alloc.studentCount || 0,
      isPriorToJoining: alloc.isPriorToJoining || false,
    });
  }
  return ledger;
};

/**
 * Calculates cumulative / accumulated salary statistics across all months since teacher joined.
 * Uses a universal chronological FIFO running ledger against total payments pool:
 * Payments automatically reduce earliest unpaid months first up to the current month.
 * Any surplus payment beyond the current month is remembered as surplusAdvance for future months.
 */
const calculateTeacherAccumulatedStats = async (teacher, allPayments, monthsList = null) => {
  if (!monthsList) {
    monthsList = getMonthsListForTeacher(teacher);
  }

  const currentMonthObj = parseMonth();
  const currentMonthStart = currentMonthObj.startDate;

  // Chronological order (earliest month to latest)
  const sortedMonths = [...monthsList].sort((a, b) => {
    const ma = parseMonth(a);
    const mb = parseMonth(b);
    return ma.startDate - mb.startDate;
  });

  const totalPaidAllTime = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  let remainingPaymentPool = totalPaidAllTime;

  let totalEarnedAllTime = 0;
  let pastOverdueArrears = 0; // unpaid salary strictly before current month
  let currentMonthSalary = 0;
  let currentMonthPaid = 0;
  let currentMonthDue = 0;
  const unpaidMonths = [];
  const monthLedgerAllocations = {};

  for (const m of sortedMonths) {
    const mObj = parseMonth(m);
    const calc = await calculateTeacherSalaryForMonth(teacher, m);
    if (calc.isPriorToJoining) {
      monthLedgerAllocations[m] = {
        salary: 0,
        totalPaid: 0,
        amountDue: 0,
        studentCount: 0,
        isPriorToJoining: true,
      };
      continue;
    }

    const isPast = mObj.endDate < currentMonthStart;
    const isCurrent =
      mObj.year === currentMonthObj.year &&
      mObj.monthIndex === currentMonthObj.monthIndex;
    const isFuture = mObj.startDate > currentMonthObj.endDate;

    if (isFuture) {
      monthLedgerAllocations[m] = {
        salary: calc.salary,
        totalPaid: 0,
        amountDue: 0,
        studentCount: calc.studentCount || 0,
        isPriorToJoining: false,
      };
      continue;
    }

    totalEarnedAllTime += calc.salary;
    const paidForMonth = Math.min(remainingPaymentPool, calc.salary);
    remainingPaymentPool -= paidForMonth;
    const amountDue = Math.max(0, calc.salary - paidForMonth);

    monthLedgerAllocations[m] = {
      salary: calc.salary,
      totalPaid: paidForMonth,
      amountDue,
      studentCount: calc.studentCount || 0,
      isPriorToJoining: false,
      isProrated: calc.isProrated || false,
      daysWorked: calc.daysWorked,
      totalDaysInMonth: calc.totalDaysInMonth,
    };

    if (isPast) {
      if (amountDue > 0) {
        pastOverdueArrears += amountDue;
        unpaidMonths.push({
          month: m,
          salary: calc.salary,
          totalPaid: paidForMonth,
          amountDue,
          isPast: true,
          isCurrent: false,
          isOverdue: true,
        });
      }
    } else if (isCurrent) {
      currentMonthSalary = calc.salary;
      currentMonthPaid = paidForMonth;
      currentMonthDue = amountDue;
      if (amountDue > 0) {
        unpaidMonths.push({
          month: m,
          salary: calc.salary,
          totalPaid: paidForMonth,
          amountDue,
          isPast: false,
          isCurrent: true,
          isOverdue: false,
        });
      }
    }
  }

  // Any surplus advance payment beyond all earned months up to current month.
  // This surplus is remembered and will automatically offset future months.
  const surplusAdvance = Math.max(0, remainingPaymentPool);
  const totalAccumulatedDue = pastOverdueArrears + currentMonthDue;
  const oldestUnpaidMonth = unpaidMonths.length > 0 ? unpaidMonths[0].month : null;

  return {
    totalEarnedAllTime,
    totalPaidAllTime,
    totalAccumulatedDue,
    pastOverdueArrears,
    currentMonthSalary,
    currentMonthPaid,
    currentMonthDue,
    surplusAdvance,
    unpaidMonths,
    unpaidMonthsCount: unpaidMonths.length,
    oldestUnpaidMonth,
    hasOverdue: pastOverdueArrears > 0,
    monthLedgerAllocations,
  };
};

/**
 * GET /api/teacher/salary-overview
 * Provides the logged-in teacher with their salary calculation, month selection, and payment history.
 * Query params: ?month=October+2026
 */
const getSalaryOverview = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const teacher = await User.findById(teacherId).lean();

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    const currentMonth = formatMonthString(new Date());
    const selectedMonth = req.query.month ? req.query.month.trim() : currentMonth;

    const monthsList = getMonthsListForTeacher(teacher);
    if (!monthsList.includes(selectedMonth)) {
      monthsList.unshift(selectedMonth);
    }

    const calcResult = await calculateTeacherSalaryForMonth(teacher, selectedMonth);
    const salary = calcResult.salary;

    const allPayments = await TeacherSalaryPayment.find({ teacher: teacherId })
      .sort({ paidAt: -1 })
      .lean();

    const accumulatedStats = await calculateTeacherAccumulatedStats(teacher, allPayments, monthsList);
    const monthlyLedger = await buildTeacherMonthlyLedger(teacher, allPayments, monthsList, accumulatedStats);

    const allocThisMonth = accumulatedStats.monthLedgerAllocations[selectedMonth] || {
      salary,
      totalPaid: 0,
      amountDue: salary,
    };
    const totalPaidThisMonth = allocThisMonth.totalPaid;
    const remainingThisMonth = allocThisMonth.amountDue;
    const totalPaidAllTime = accumulatedStats.totalPaidAllTime;

    const monthlySalary = accumulatedStats.currentMonthSalary;
    const previousSalary = accumulatedStats.pastOverdueArrears;
    const totalSalaryToBePaid = accumulatedStats.totalAccumulatedDue;
    const currentMonthDue = accumulatedStats.currentMonthDue;
    const currentMonthPaid = accumulatedStats.currentMonthPaid;
    const surplusAdvance = accumulatedStats.surplusAdvance;
    const previousUnpaidMonths = accumulatedStats.unpaidMonths
      .filter((u) => u.isPast)
      .map((u) => u.month);

    res.json({
      success: true,
      data: {
        salary,
        selectedMonth,
        currentMonth,
        monthsList,
        compensationType: teacher.compensationType || "fixed",
        fixedSalary: teacher.fixedSalary ?? teacher.salaryAmount ?? 0,
        salaryPercentage: teacher.salaryPercentage ?? teacher.studentPercentage ?? 0,
        totalPaidThisMonth,
        advancePaidThisMonth: 0,
        endPaidThisMonth: totalPaidThisMonth,
        remainingThisMonth,
        totalPaidAllTime,
        // Core 3 Metrics:
        monthlySalary,
        previousSalary,
        totalSalaryToBePaid,
        currentMonthSalary: monthlySalary,
        currentMonthPaid,
        currentMonthDue,
        surplusAdvance,
        previousUnpaidMonths,
        // Cumulative & Overdue Statistics across all months:
        totalAccumulatedDue: totalSalaryToBePaid,
        pastOverdueArrears: previousSalary,
        totalEarnedAllTime: accumulatedStats.totalEarnedAllTime,
        unpaidMonthsCount: accumulatedStats.unpaidMonthsCount,
        unpaidMonthsList: accumulatedStats.unpaidMonths.map((u) => u.month),
        oldestUnpaidMonth: accumulatedStats.oldestUnpaidMonth,
        hasOverdue: previousSalary > 0,
        calculationDetails: {
          totalMonthlyFee: calcResult.totalMonthlyFee || 0,
          studentCount: calcResult.studentCount || 0,
          students: calcResult.students || [],
          totalCollectedThisMonth: calcResult.totalCollectedThisMonth || 0,
          teacherShareOfCollected: calcResult.teacherShareOfCollected || 0,
        },
        monthlyLedger,
        payments: allPayments.map((p) => ({
          id: p._id,
          amount: p.amount,
          paymentType: p.paymentType,
          month: p.month,
          paidAt: p.paidAt,
          paymentMode: p.paymentMode,
          notes: p.notes,
        })),
      },
    });
  } catch (error) {
    console.error("Error in getSalaryOverview:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate salary overview",
    });
  }
};

/**
 * GET /api/admin/teachers/:id/payments
 * Admin endpoint: returns payment history and salary summary for a specific teacher.
 * Query params: ?month=October+2026
 */
const getTeacherSalaryPayments = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }

  const { id } = req.params;

  try {
    const teacher = await User.findOne({ _id: id, role: "teacher" }).lean();
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    const currentMonth = formatMonthString(new Date());
    const selectedMonth = req.query.month ? req.query.month.trim() : currentMonth;

    const monthsList = getMonthsListForTeacher(teacher);
    if (!monthsList.includes(selectedMonth)) {
      monthsList.unshift(selectedMonth);
    }

    const calcResult = await calculateTeacherSalaryForMonth(teacher, selectedMonth);
    const projectedSalary = calcResult.salary;

    const allPayments = await TeacherSalaryPayment.find({ teacher: id })
      .sort({ paidAt: -1 })
      .lean();

    const accumulatedStats = await calculateTeacherAccumulatedStats(teacher, allPayments, monthsList);
    const monthlyLedger = await buildTeacherMonthlyLedger(teacher, allPayments, monthsList, accumulatedStats);

    const allocThisMonth = accumulatedStats.monthLedgerAllocations[selectedMonth] || {
      salary: projectedSalary,
      totalPaid: 0,
      amountDue: projectedSalary,
    };
    const totalPaidThisMonth = allocThisMonth.totalPaid;
    const remainingThisMonth = allocThisMonth.amountDue;
    const totalPaidAllTime = accumulatedStats.totalPaidAllTime;

    const monthlySalary = accumulatedStats.currentMonthSalary;
    const previousSalary = accumulatedStats.pastOverdueArrears;
    const totalSalaryToBePaid = accumulatedStats.totalAccumulatedDue;
    const currentMonthDue = accumulatedStats.currentMonthDue;
    const currentMonthPaid = accumulatedStats.currentMonthPaid;
    const surplusAdvance = accumulatedStats.surplusAdvance;
    const previousUnpaidMonths = accumulatedStats.unpaidMonths
      .filter((u) => u.isPast)
      .map((u) => u.month);

    res.json({
      success: true,
      data: {
        teacher: {
          id: teacher._id,
          name: teacher.name,
          username: teacher.username,
          compensationType: teacher.compensationType || "fixed",
          fixedSalary: teacher.fixedSalary ?? teacher.salaryAmount ?? 0,
          salaryPercentage: teacher.salaryPercentage ?? teacher.studentPercentage ?? 0,
          assignedBatches: teacher.assignedBatches || [],
          joiningDate: teacher.joiningDate,
        },
        selectedMonth,
        currentMonth,
        monthsList,
        summary: {
          // The 3 Requested Primary Figures:
          monthlySalary,
          previousSalary,
          totalSalaryToBePaid,
          currentMonthSalary: monthlySalary,
          currentMonthPaid,
          currentMonthDue,
          surplusAdvance,
          previousUnpaidMonths,
          // Month-specific info:
          projectedSalary,
          totalPaidAllTime,
          totalPaidThisMonth,
          advancePaidThisMonth: 0,
          endPaidThisMonth: totalPaidThisMonth,
          remainingThisMonth,
          // Cumulative totals:
          totalAccumulatedDue: totalSalaryToBePaid,
          pastOverdueArrears: previousSalary,
          totalEarnedAllTime: accumulatedStats.totalEarnedAllTime,
          unpaidMonthsCount: accumulatedStats.unpaidMonthsCount,
          unpaidMonthsList: accumulatedStats.unpaidMonths.map((u) => u.month),
          oldestUnpaidMonth: accumulatedStats.oldestUnpaidMonth,
        },
        calculationDetails: {
          totalMonthlyFee: calcResult.totalMonthlyFee || 0,
          studentCount: calcResult.studentCount || 0,
          students: calcResult.students || [],
          totalCollectedThisMonth: calcResult.totalCollectedThisMonth || 0,
          teacherShareOfCollected: calcResult.teacherShareOfCollected || 0,
        },
        monthlyLedger,
        payments: allPayments.map((p) => ({
          id: p._id,
          amount: p.amount,
          paymentType: p.paymentType,
          month: p.month,
          paidAt: p.paidAt,
          paymentMode: p.paymentMode,
          notes: p.notes,
        })),
      },
    });
  } catch (error) {
    console.error("Error in getTeacherSalaryPayments:", error);
    res.status(500).json({ success: false, message: "Failed to load salary payments" });
  }
};

/**
 * POST /api/admin/teachers/:id/payments
 * Admin endpoint: records a salary payment (advance or in end).
 * Supports auto-allocation (FIFO) across unpaid months or payment for a specific month.
 */
const recordTeacherSalaryPayment = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }

  const { id } = req.params;
  const { amount, paymentType = "end", paidAt, paymentMode, notes } = req.body;

  const numAmount = Number(amount);
  if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: "A valid positive payment amount is required",
    });
  }

  const timing = paymentType && ["advance", "end"].includes(paymentType) ? paymentType : "end";

  try {
    const teacher = await User.findOne({ _id: id, role: "teacher" });
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    const paymentDate = paidAt ? new Date(paidAt) : new Date();
    const curMonthStr = formatMonthString(paymentDate);

    const payment = await TeacherSalaryPayment.create({
      teacher: id,
      amount: numAmount,
      paymentType: timing,
      month: curMonthStr,
      paidAt: paymentDate,
      paymentMode: paymentMode || "UPI",
      notes: notes ? notes.trim() : "",
      recordedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: `Salary payment of ₹${numAmount.toLocaleString("en-IN")} recorded successfully`,
      data: {
        id: payment._id,
        amount: payment.amount,
        paymentType: payment.paymentType,
        month: payment.month,
        paidAt: payment.paidAt,
        paymentMode: payment.paymentMode,
        notes: payment.notes,
      },
    });
  } catch (error) {
    console.error("Error in recordTeacherSalaryPayment:", error);
    res.status(500).json({ success: false, message: "Failed to record salary payment" });
  }
};

/**
 * DELETE /api/admin/teachers/:id/payments/:paymentId
 * Admin endpoint: deletes a recorded salary payment entry.
 */
const deleteTeacherSalaryPayment = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }

  const { id, paymentId } = req.params;

  try {
    const payment = await TeacherSalaryPayment.findOneAndDelete({
      _id: paymentId,
      teacher: id,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    res.json({
      success: true,
      message: "Payment record removed successfully",
    });
  } catch (error) {
    console.error("Error in deleteTeacherSalaryPayment:", error);
    res.status(500).json({ success: false, message: "Failed to delete payment record" });
  }
};

module.exports = {
  calculateTeacherSalary,
  calculateTeacherSalaryForMonth,
  calculateTeacherAccumulatedStats,
  getMonthsListForTeacher,
  buildTeacherMonthlyLedger,
  getSalaryOverview,
  getTeacherSalaryPayments,
  recordTeacherSalaryPayment,
  deleteTeacherSalaryPayment,
};
