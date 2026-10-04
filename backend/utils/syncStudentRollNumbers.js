const StudentProfile = require("../models/StudentProfile");
const { generateRollNo } = require("./rollNumber");

/**
 * Ensures all students in the database have an admissionSerial and rollNo.
 * For students without admissionSerial, orders them by admissionDate (or createdAt)
 * and assigns sequential serial numbers and generated roll numbers.
 */
const syncStudentRollNumbers = async () => {
  try {
    // 1. Fetch all students sorted by admissionDate ascending
    const students = await StudentProfile.find()
      .populate("user", "name")
      .sort({ admissionDate: 1, createdAt: 1 });

    if (!students.length) return;

    // Track highest existing admissionSerial
    let maxSerial = 0;
    for (const s of students) {
      if (s.admissionSerial && s.admissionSerial > maxSerial) {
        maxSerial = s.admissionSerial;
      }
    }

    // Assign serials & roll numbers to any student missing either
    let currentSerial = 1;
    for (const student of students) {
      let needsSave = false;

      if (!student.admissionSerial) {
        // If there's an existing maxSerial we continue from there, otherwise sequential
        student.admissionSerial = currentSerial;
        needsSave = true;
      }

      if (!student.rollNo) {
        const studentName = student.user?.name || "Student";
        student.rollNo = generateRollNo(studentName, student.admissionSerial);
        needsSave = true;
      }

      if (needsSave) {
        await student.save();
        console.log(`Assigned Roll No [${student.rollNo}] (Serial #${student.admissionSerial}) to ${student.user?.name}`);
      }

      currentSerial = Math.max(currentSerial + 1, (student.admissionSerial || 0) + 1);
    }
  } catch (error) {
    console.error("Error in syncStudentRollNumbers:", error.message);
  }
};

module.exports = { syncStudentRollNumbers };
