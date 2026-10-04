require("../models/User");
const ExamResult = require("../models/ExamResult");
const StudentProfile = require("../models/StudentProfile");

// ── GET /api/exam-results ────────────────────────────────────────────────────
const getExamResults = async (req, res) => {
  try {
    const { role } = req.user;
    const assignedBatches = req.user.assignedBatches || [];
    const { batch, limit = 50 } = req.query;

    let query = {};

    if (batch) {
      query.batch = batch;
    }

    if (role === "teacher") {
      if (batch && !assignedBatches.includes(batch)) {
        return res.status(403).json({ success: false, message: "You are not assigned to this batch." });
      }
      if (!batch) {
        query.batch = { $in: assignedBatches };
      }
    }

    const exams = await ExamResult.find(query)
      .sort({ examDate: -1, createdAt: -1 })
      .limit(Number(limit))
      .populate("conductedBy", "name")
      .lean();

    res.json({ success: true, data: exams });
  } catch (error) {
    console.error("getExamResults error:", error);
    res.status(500).json({ success: false, message: "Failed to load exam results." });
  }
};

// ── POST /api/exam-results ───────────────────────────────────────────────────
const createExamResult = async (req, res) => {
  const { role } = req.user;
  const assignedBatches = req.user.assignedBatches || [];

  if (role !== "admin" && role !== "teacher") {
    return res.status(403).json({ success: false, message: "Only admin or teachers can create exams." });
  }

  const { testName, subject, batch, studentClass, totalMarks, examDate, studentMarks: initialMarks } = req.body;

  if (!testName?.trim() || !batch?.trim() || !totalMarks) {
    return res.status(400).json({ success: false, message: "Test name, batch, and total marks are required." });
  }

  if (role === "teacher" && !assignedBatches.includes(batch.trim())) {
    return res.status(403).json({ success: false, message: `You are not assigned to batch "${batch}".` });
  }

  try {
    let finalStudentMarks = [];

    if (Array.isArray(initialMarks) && initialMarks.length > 0) {
      // Use marks passed from frontend
      finalStudentMarks = initialMarks.map((m) => ({
        student: m.student || m.studentId,
        studentName: m.studentName || m.name || "Unknown",
        studentRollNo: m.studentRollNo || m.rollNo || "",
        marksObtained: m.isAbsent
          ? null
          : m.marksObtained !== undefined && m.marksObtained !== "" && m.marksObtained !== null
          ? Number(m.marksObtained)
          : null,
        isAbsent: !!m.isAbsent,
      }));

      // Ensure roll numbers are populated if missing
      const missingRollIds = finalStudentMarks
        .filter((m) => !m.studentRollNo && m.student)
        .map((m) => m.student);
      if (missingRollIds.length > 0) {
        const foundProfiles = await StudentProfile.find({ _id: { $in: missingRollIds } }).lean();
        const pMap = new Map(foundProfiles.map((p) => [String(p._id), p.rollNo || ""]));
        for (const m of finalStudentMarks) {
          if (!m.studentRollNo && m.student && pMap.has(String(m.student))) {
            m.studentRollNo = pMap.get(String(m.student));
          }
        }
      }
    } else {
      // Fetch students of the batch/class
      const query = { batch: batch.trim(), status: { $ne: "removed" } };
      if (studentClass?.trim() && !["All", "All Classes"].includes(studentClass.trim())) {
        query.studentClass = studentClass.trim();
      }

      const profiles = await StudentProfile.find(query)
        .populate("user", "name")
        .lean();

      finalStudentMarks = profiles.map((p) => ({
        student: p._id,
        studentName: p.user?.name ?? "Unknown",
        studentRollNo: p.rollNo || "",
        marksObtained: null,
        isAbsent: false,
      }));
    }

    const exam = await ExamResult.create({
      testName: testName.trim(),
      subject: subject?.trim() || "",
      batch: batch.trim(),
      studentClass: studentClass?.trim() || "",
      totalMarks: Number(totalMarks),
      examDate: examDate ? new Date(examDate) : new Date(),
      conductedBy: req.user._id,
      studentMarks: finalStudentMarks,
    });

    const populated = await ExamResult.findById(exam._id).populate("conductedBy", "name").lean();

    res.status(201).json({ success: true, message: "Exam created successfully.", data: populated });
  } catch (error) {
    console.error("createExamResult error:", error);
    res.status(500).json({ success: false, message: "Failed to create exam: " + error.message });
  }
};

// ── PATCH /api/exam-results/:id/marks ────────────────────────────────────────
const saveExamMarks = async (req, res) => {
  const { role } = req.user;
  const assignedBatches = req.user.assignedBatches || [];

  if (role !== "admin" && role !== "teacher") {
    return res.status(403).json({ success: false, message: "Only admin or teachers can update marks." });
  }

  const { id } = req.params;
  const { marks } = req.body;

  if (!Array.isArray(marks)) {
    return res.status(400).json({ success: false, message: "marks must be an array." });
  }

  try {
    const exam = await ExamResult.findById(id);
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found." });

    if (role === "teacher" && !assignedBatches.includes(exam.batch)) {
      return res.status(403).json({ success: false, message: "You are not assigned to this batch." });
    }

    for (const entry of marks) {
      const studentId = entry.student || entry.studentId;
      const studentMark = exam.studentMarks.find(
        (sm) => String(sm.student) === String(studentId)
      );
      if (studentMark) {
        studentMark.isAbsent = !!entry.isAbsent;
        studentMark.marksObtained = entry.isAbsent
          ? null
          : entry.marksObtained !== undefined && entry.marksObtained !== "" && entry.marksObtained !== null
          ? Number(entry.marksObtained)
          : null;
      }
    }

    await exam.save();
    const populated = await ExamResult.findById(exam._id).populate("conductedBy", "name").lean();
    res.json({ success: true, message: "Marks saved successfully.", data: populated });
  } catch (error) {
    console.error("saveExamMarks error:", error);
    res.status(500).json({ success: false, message: "Failed to save marks." });
  }
};

// ── DELETE /api/exam-results/:id ─────────────────────────────────────────────
const deleteExamResult = async (req, res) => {
  const { role, _id: userId } = req.user;
  const assignedBatches = req.user.assignedBatches || [];

  if (role !== "admin" && role !== "teacher") {
    return res.status(403).json({ success: false, message: "Only admin or teachers can delete exams." });
  }

  try {
    const exam = await ExamResult.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found." });

    if (role === "teacher") {
      if (!assignedBatches.includes(exam.batch)) {
        return res.status(403).json({ success: false, message: "You are not assigned to this batch." });
      }
      if (String(exam.conductedBy) !== String(userId)) {
        return res.status(403).json({ success: false, message: "You can only delete exams you created." });
      }
    }

    await ExamResult.deleteOne({ _id: exam._id });
    res.json({ success: true, message: "Exam deleted successfully." });
  } catch (error) {
    console.error("deleteExamResult error:", error);
    res.status(500).json({ success: false, message: "Failed to delete exam." });
  }
};

// ── GET /api/exam-results/students?batch=xxx&studentClass=yyy ──────────────────
const getStudentsByBatch = async (req, res) => {
  const { role } = req.user;
  const assignedBatches = req.user.assignedBatches || [];
  const { batch, studentClass } = req.query;

  if (!batch) return res.status(400).json({ success: false, message: "batch query param required." });

  if (role === "teacher" && !assignedBatches.includes(batch)) {
    return res.status(403).json({ success: false, message: "You are not assigned to this batch." });
  }

  try {
    const query = { batch: batch.trim(), status: { $ne: "removed" } };
    if (studentClass && studentClass.trim() && !["All", "All Classes"].includes(studentClass.trim())) {
      query.studentClass = studentClass.trim();
    }

    const profiles = await StudentProfile.find(query)
      .populate("user", "name")
      .lean();

    const students = profiles.map((p) => ({
      id: p._id,
      name: p.user?.name ?? "Unknown",
      rollNo: p.rollNo || "",
      batch: p.batch,
      studentClass: p.studentClass || "",
    })).sort((a, b) => (a.rollNo || a.name).localeCompare(b.rollNo || b.name));

    res.json({ success: true, data: students });
  } catch (error) {
    console.error("getStudentsByBatch error:", error);
    res.status(500).json({ success: false, message: "Failed to load students." });
  }
};

module.exports = { getExamResults, createExamResult, saveExamMarks, deleteExamResult, getStudentsByBatch };
