const bcrypt = require("bcryptjs");
const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");
const FeeLedger = require("../models/FeeLedger");
const { calculateDynamicAmountDue, deriveFeeStatus } = require("../utils/feeStatus");
const { generateRollNo } = require("../utils/rollNumber");

const SALT_ROUNDS = 12;

const buildStudentUsername = async (fullName, phoneNumber) => {
  const digits = String(phoneNumber).replace(/\D/g, "");
  const name = String(fullName || "").trim().split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
  let baseUsername = `${name}.${digits.slice(-4)}`;
  if (!name) baseUsername = `student.${digits.slice(-4)}`;
  
  let username = baseUsername;
  let counter = 1;
  while (await User.findOne({ username })) {
    username = `${baseUsername}${counter}`;
    counter++;
  }
  return username;
};

const registerStudent = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only administrators can register students",
    });
  }

  const { fullName, phoneNumber, batch, batches: incomingBatches, studentClass, subjects, totalCourseFee, password, joiningDate } = req.body;

  const rawBatches = incomingBatches || (batch ? (Array.isArray(batch) ? batch : batch.split(",")) : []);
  const batches = [...new Set(rawBatches.map((b) => String(b).trim()).filter(Boolean))];

  if (!fullName?.trim() || !phoneNumber?.trim() || batches.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Full name, phone number, and at least one batch are required",
    });
  }

  const digits = String(phoneNumber).replace(/\D/g, "");
  if (digits.length < 10) {
    return res.status(400).json({
      success: false,
      message: "Phone number must contain at least 10 digits",
    });
  }

  const fee = Number(totalCourseFee);
  if (!Number.isFinite(fee) || fee < 0) {
    return res.status(400).json({
      success: false,
      message: "Total course fee must be a valid non-negative number",
    });
  }

  if (!password || String(password).length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters",
    });
  }

  const username = await buildStudentUsername(fullName, phoneNumber);
  const normalizedPhone = digits;

  // Removed existingProfile check to allow siblings with same phone number


  let user;
  let profile;

  try {
    const passwordHash = await bcrypt.hash(String(password), SALT_ROUNDS);

    user = await User.create({
      name: fullName.trim(),
      username,
      passwordHash,
      role: "student",
    });

    const now = new Date();
    const lastStudent = await StudentProfile.findOne({ admissionSerial: { $ne: null } })
      .sort({ admissionSerial: -1 })
      .lean();
    const nextSerial = (lastStudent?.admissionSerial || 0) + 1;
    const rollNo = generateRollNo(fullName, nextSerial);

    profile = await StudentProfile.create({
      user: user._id,
      rollNo,
      admissionSerial: nextSerial,
      batches,
      batch: batches.join(", "),
      studentClass: studentClass?.trim(),
      subjects: subjects?.trim(),
      parentContact: normalizedPhone,
      admissionDate: now,
      joiningDate: joiningDate ? new Date(joiningDate) : now,
      status: "active",
    });

    const ledger = await FeeLedger.create({
      student: profile._id,
      totalFee: fee,
      amountPaid: 0,
      amountDue: fee,
      monthlyFeeAmount: fee,
      paymentTiming: null,
      paymentHistory: [],
    });

    res.status(201).json({
      success: true,
      message: "Student registered successfully",
      data: {
        student: {
          id: profile._id,
          userId: user._id,
          fullName: user.name,
          username: user.username,
          rollNo: profile.rollNo,
          phoneNumber: profile.parentContact,
          batch: profile.batch,
          batches: profile.batches || batches,
          studentClass: profile.studentClass,
          subjects: profile.subjects,
          admissionDate: profile.admissionDate,
          joiningDate: profile.joiningDate,
          status: profile.status,
        },
        fee: {
          totalCourseFee: ledger.totalFee,
          amountPaid: ledger.amountPaid,
          amountDue: calculateDynamicAmountDue(ledger, profile),
        },
      },
    });
  } catch (error) {
    if (profile?._id) {
      await StudentProfile.deleteOne({ _id: profile._id }).catch(() => {});
    }
    if (user?._id) {
      await User.deleteOne({ _id: user._id }).catch(() => {});
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A duplicate record was found in the database (likely username). Please try again.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Student registration failed",
    });
  }
};

const getStudents = async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "teacher") {
    return res.status(403).json({
      success: false,
      message: "Only administrators and teachers can view students",
    });
  }

  try {
    const query = { status: { $ne: "removed" } };
    if (req.user.role === "teacher") {
      const assigned = req.user.assignedBatches || [];
      query.$or = [
        { batches: { $in: assigned } },
        { batch: { $in: assigned } },
      ];
    }

    // Exclude 'removed' students from the active roster
    const profiles = await StudentProfile.find(query)
      .populate("user", "name username")
      .sort({ createdAt: -1 })
      .lean();

    const profileIds = profiles.map((profile) => profile._id);
    const ledgers = await FeeLedger.find({
      student: { $in: profileIds },
    }).lean();

    const ledgerByStudent = Object.fromEntries(
      ledgers.map((ledger) => [String(ledger.student), ledger])
    );

    const students = profiles.map((profile) => {
      const ledger = ledgerByStudent[String(profile._id)];
      const feeStatus = deriveFeeStatus(ledger, profile);
      const sBatches = Array.isArray(profile.batches) && profile.batches.length > 0
        ? profile.batches
        : (profile.batch ? profile.batch.split(",").map((b) => b.trim()).filter(Boolean) : []);

      return {
        id: profile._id,
        fullName: profile.user?.name ?? "Unknown",
        username: profile.user?.username ?? "",
        rollNo: profile.rollNo ?? "",
        phoneNumber: profile.parentContact,
        batch: profile.batch || sBatches.join(", "),
        batches: sBatches,
        studentClass: profile.studentClass,
        subjects: profile.subjects,
        feeStatus,
        admissionDate: profile.admissionDate,
        joiningDate: profile.joiningDate ?? null,
        status: profile.status ?? "active",
      };
    });

    res.json({
      success: true,
      data: { students },
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to load students",
    });
  }
};

const updateStudent = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only administrators can update students",
    });
  }

  const { id } = req.params;
  const { fullName, phoneNumber, batch, batches: incomingBatches, studentClass, subjects } = req.body;

  try {
    const profile = await StudentProfile.findById(id).populate("user");
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (fullName && fullName.trim()) {
      profile.user.name = fullName.trim();
      await profile.user.save();
    }

    if (phoneNumber && phoneNumber.trim()) {
      const digits = String(phoneNumber).replace(/\D/g, "");
      if (digits.length >= 10) {
        profile.parentContact = digits;
      }
    }

    const rawBatches = incomingBatches !== undefined
      ? incomingBatches
      : (batch !== undefined ? (Array.isArray(batch) ? batch : batch.split(",")) : null);

    if (rawBatches !== null) {
      const cleanBatches = [...new Set(rawBatches.map((b) => String(b).trim()).filter(Boolean))];
      profile.batches = cleanBatches;
      profile.batch = cleanBatches.join(", ");
    }

    if (studentClass !== undefined) {
      profile.studentClass = studentClass.trim();
    }

    if (subjects !== undefined) {
      profile.subjects = subjects.trim();
    }

    await profile.save();

    const sBatches = Array.isArray(profile.batches) && profile.batches.length > 0
      ? profile.batches
      : (profile.batch ? profile.batch.split(",").map((b) => b.trim()).filter(Boolean) : []);

    res.json({
      success: true,
      message: "Student updated successfully",
      data: {
        id: profile._id,
        fullName: profile.user.name,
        rollNo: profile.rollNo ?? "",
        phoneNumber: profile.parentContact,
        batch: profile.batch || sBatches.join(", "),
        batches: sBatches,
        studentClass: profile.studentClass,
        subjects: profile.subjects,
        joiningDate: profile.joiningDate ?? null,
        status: profile.status ?? "active",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update student",
    });
  }
};

// ── PATCH /api/students/:id/status ────────────────────────────────────────────
const patchStudentStatus = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only administrators can change student status",
    });
  }

  const { id } = req.params;
  const { status } = req.body;

  if (!["active", "paused", "removed"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Status must be 'active', 'paused', or 'removed'",
    });
  }

  try {
    const profile = await StudentProfile.findById(id);
    if (!profile) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    profile.status = status;
    await profile.save();

    res.json({
      success: true,
      message: `Student status updated to '${status}'`,
      data: { id: profile._id, status: profile.status },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update status" });
  }
};

const getAdminStats = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only administrators can view stats",
    });
  }

  try {
    // Count only active students (not paused or removed)
    const studentCount = await StudentProfile.countDocuments({ status: { $ne: 'removed' } });

    const ledgers = await FeeLedger.find()
      .populate("student")
      .lean();

    let totalCollected = 0;
    let totalPending = 0;

    for (const ledger of ledgers) {
      if (!ledger.student || ledger.student.status === "removed") continue;
      totalCollected += ledger.amountPaid || 0;
      totalPending += calculateDynamicAmountDue(ledger, ledger.student);
    }

    res.json({
      success: true,
      data: {
        totalStudents: studentCount,
        totalCollected,
        totalPending,
        activeBatches: 5,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load admin stats",
    });
  }
};

module.exports = { registerStudent, getStudents, updateStudent, patchStudentStatus, getAdminStats };
