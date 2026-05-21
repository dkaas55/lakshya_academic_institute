const Attendance = require("../models/Attendance");
const StudentProfile = require("../models/StudentProfile");

// Helper to normalize dates to UTC midnight to keep indexing consistent
const getNormalizedDate = (dateStr) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

// ── GET /api/attendance/sheet ────────────────────────────────────────────────
const getAttendanceSheet = async (req, res) => {
  const { batch, date } = req.query;

  if (!batch || !date) {
    return res.status(400).json({
      success: false,
      message: "Batch and date are required query parameters",
    });
  }

  // Auth & Batch Scope Check for Teachers
  if (req.user.role === "teacher") {
    const assigned = req.user.assignedBatches || [];
    if (!assigned.includes(batch)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view attendance for this batch",
      });
    }
  } else if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }

  try {
    const targetDate = getNormalizedDate(date);

    // Fetch all active students currently enrolled in this batch
    const students = await StudentProfile.find({ batch, status: { $ne: "removed" } })
      .populate("user", "name email")
      .sort({ "user.name": 1 })
      .lean();

    // Find if attendance is already saved for this batch and day
    const attendanceDoc = await Attendance.findOne({
      batch,
      date: targetDate,
    }).lean();

    const recordMap = {};
    if (attendanceDoc && attendanceDoc.records) {
      attendanceDoc.records.forEach((r) => {
        recordMap[String(r.student)] = r.status;
      });
    }

    // Build the records list, defaulting missing records to 'Present'
    const records = students.map((s) => ({
      studentId: s._id,
      fullName: s.user?.name ?? "Unknown Student",
      status: recordMap[String(s._id)] || "Present",
    }));

    res.json({
      success: true,
      data: {
        date: targetDate,
        batch,
        records,
        isSaved: !!attendanceDoc,
      },
    });
  } catch (error) {
    console.error("getAttendanceSheet error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance sheet",
    });
  }
};

// ── POST /api/attendance/sheet ───────────────────────────────────────────────
const saveAttendanceSheet = async (req, res) => {
  const { batch, date, records } = req.body;

  if (!batch || !date || !Array.isArray(records)) {
    return res.status(400).json({
      success: false,
      message: "Batch, date, and records array are required",
    });
  }

  // Auth & Batch Scope Check for Teachers
  if (req.user.role === "teacher") {
    const assigned = req.user.assignedBatches || [];
    if (!assigned.includes(batch)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to save attendance for this batch",
      });
    }
  } else if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }

  try {
    const targetDate = getNormalizedDate(date);

    const formattedRecords = records.map((r) => ({
      student: r.studentId,
      status: r.status,
    }));

    const updatedSheet = await Attendance.findOneAndUpdate(
      { batch, date: targetDate },
      { batch, date: targetDate, records: formattedRecords },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Attendance saved successfully",
      data: updatedSheet,
    });
  } catch (error) {
    console.error("saveAttendanceSheet error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save attendance sheet",
    });
  }
};

// ── PUT /api/attendance/sheet ────────────────────────────────────────────────
const updateAttendanceSheet = async (req, res) => {
  const { batch, date, records } = req.body;

  if (!batch || !date || !Array.isArray(records)) {
    return res.status(400).json({
      success: false,
      message: "Batch, date, and records array are required",
    });
  }

  // Auth & Batch Scope Check for Teachers
  if (req.user.role === "teacher") {
    const assigned = req.user.assignedBatches || [];
    if (!assigned.includes(batch)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update attendance for this batch",
      });
    }
  } else if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }

  try {
    const targetDate = getNormalizedDate(date);

    const formattedRecords = records.map((r) => ({
      student: r.studentId,
      status: r.status,
    }));

    const updated = await Attendance.findOneAndUpdate(
      { batch, date: targetDate },
      { $set: { records: formattedRecords } },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "No saved attendance found for this batch and date. Use Save first.",
      });
    }

    res.json({
      success: true,
      message: "Attendance updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("updateAttendanceSheet error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update attendance sheet",
    });
  }
};

// ── GET /api/attendance/my-history ───────────────────────────────────────────
const getMyAttendanceHistory = async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({
      success: false,
      message: "This endpoint is for students only",
    });
  }

  try {
    const profile = await StudentProfile.findOne({ user: req.user._id }).lean();
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const attendanceLogs = await Attendance.find({ batch: profile.batch })
      .sort({ date: -1 })
      .lean();

    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    const history = [];

    attendanceLogs.forEach((log) => {
      const studentRecord = log.records.find(
        (r) => String(r.student) === String(profile._id)
      );
      if (studentRecord) {
        const status = studentRecord.status;
        if (status === "Present") presentCount++;
        else if (status === "Late") lateCount++;
        else if (status === "Absent") absentCount++;
        history.push({ date: log.date, status });
      }
    });

    const totalClasses = history.length;
    const attendedCount = presentCount + lateCount;
    const attendancePercentage =
      totalClasses > 0 ? Math.round((attendedCount / totalClasses) * 100) : 100;

    res.json({
      success: true,
      data: {
        summary: { totalClasses, present: presentCount, late: lateCount, absent: absentCount, attendancePercentage },
        history,
      },
    });
  } catch (error) {
    console.error("getMyAttendanceHistory error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch attendance history" });
  }
};

// ── GET /api/attendance/history ──────────────────────────────────────────────
// Admin / Teacher: audit view with batch + date range + optional student filter
const getAttendanceHistory = async (req, res) => {
  const { batch, dateFrom, dateTo } = req.query;

  if (!batch) {
    return res.status(400).json({ success: false, message: "batch query param is required" });
  }

  // Teachers may only view their assigned batches
  if (req.user.role === "teacher") {
    const assigned = req.user.assignedBatches || [];
    if (!assigned.includes(batch)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view attendance for this batch",
      });
    }
  }

  try {
    // Build date filter
    const dateFilter = {};
    if (dateFrom) dateFilter.$gte = getNormalizedDate(dateFrom);
    if (dateTo) {
      const end = getNormalizedDate(dateTo);
      end.setUTCHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }

    const query = { batch };
    if (Object.keys(dateFilter).length) query.date = dateFilter;

    // Fetch all attendance logs for this batch in the range
    const logs = await Attendance.find(query).sort({ date: -1 }).lean();

    // Fetch all students in this batch (excluding removed)
    const students = await StudentProfile.find({ batch, status: { $ne: "removed" } })
      .populate("user", "name email")
      .lean();

    // Build per-student summary
    const summaryMap = {};
    students.forEach((s) => {
      summaryMap[String(s._id)] = {
        studentId: String(s._id),
        fullName: s.user?.name ?? "Unknown",
        email: s.user?.email ?? "",
        studentClass: s.studentClass ?? "",
        batch: s.batch,
        present: 0,
        late: 0,
        absent: 0,
        total: 0,
      };
    });

    logs.forEach((log) => {
      log.records.forEach((r) => {
        const key = String(r.student);
        if (!summaryMap[key]) return;
        summaryMap[key].total++;
        if (r.status === "Present") summaryMap[key].present++;
        else if (r.status === "Late") summaryMap[key].late++;
        else if (r.status === "Absent") summaryMap[key].absent++;
      });
    });

    const result = Object.values(summaryMap).map((s) => ({
      ...s,
      attendancePercentage:
        s.total > 0 ? Math.round(((s.present + s.late) / s.total) * 100) : null,
    }));

    res.json({
      success: true,
      data: {
        batch,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
        totalClassDays: logs.length,
        students: result,
      },
    });
  } catch (error) {
    console.error("getAttendanceHistory error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch attendance history" });
  }
};

module.exports = {
  getAttendanceSheet,
  saveAttendanceSheet,
  updateAttendanceSheet,
  getMyAttendanceHistory,
  getAttendanceHistory,
};
