/**
 * importStudents.js
 *
 * Fault-tolerant bulk importer for student records from Excel (.xlsx/.xls) or CSV files
 * into MongoDB for Institute Management System.
 *
 * CLI Usage:
 *   node importStudents.js --file ./students.xlsx --instituteId <INSTITUTE_MONGO_ID> [--defaultBatch "General"]
 *   node importStudents.js --generate-template [--output ./students_template.xlsx]
 *   node importStudents.js --help
 */

const path = require("path");
const fs = require("fs");

// Load .env from current directory, parent directory, or backend directory
const envPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, ".env"),
  path.resolve(__dirname, "../.env"),
];
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require("dotenv").config({ path: envPath });
    break;
  }
}

const mongoose = require("mongoose");
const xlsx = require("xlsx");

// Load Student model
let Student;
try {
  Student = require("./models/Student");
} catch (e) {
  Student = require("./backend/models/Student");
}

// ─── CLI ARGUMENT PARSER ────────────────────────────────────────────────────────
function parseArgs(args) {
  const parsed = {
    file: null,
    instituteId: null,
    defaultBatch: null,
    generateTemplate: false,
    templateOutput: "students_template.xlsx",
    uri: process.env.MONGODB_URI || null,
    syncPortal: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else if (arg === "--generate-template" || arg === "--generateTemplate") {
      parsed.generateTemplate = true;
    } else if (arg.startsWith("--output=")) {
      parsed.templateOutput = arg.split("=")[1].trim();
    } else if (arg === "--output" && args[i + 1] && !args[i + 1].startsWith("--")) {
      parsed.templateOutput = args[++i].trim();
    } else if (arg.startsWith("--file=")) {
      parsed.file = arg.split("=").slice(1).join("=").trim();
    } else if (arg === "--file" && args[i + 1] && !args[i + 1].startsWith("--")) {
      parsed.file = args[++i].trim();
    } else if (arg.startsWith("--instituteId=")) {
      parsed.instituteId = arg.split("=")[1].trim();
    } else if (arg === "--instituteId" && args[i + 1] && !args[i + 1].startsWith("--")) {
      parsed.instituteId = args[++i].trim();
    } else if (arg.startsWith("--defaultBatch=")) {
      parsed.defaultBatch = arg.split("=")[1].trim();
    } else if (arg === "--defaultBatch" && args[i + 1] && !args[i + 1].startsWith("--")) {
      parsed.defaultBatch = args[++i].trim();
    } else if (arg.startsWith("--uri=")) {
      parsed.uri = arg.split("=").slice(1).join("=").trim();
    } else if (arg === "--uri" && args[i + 1] && !args[i + 1].startsWith("--")) {
      parsed.uri = args[++i].trim();
    } else if (arg === "--sync-portal" || arg === "--syncPortal") {
      parsed.syncPortal = true;
    }
  }

  return parsed;
}

// ─── TEMPLATE GENERATION ────────────────────────────────────────────────────────
function generateTemplate(outputPath) {
  const targetPath = path.resolve(process.cwd(), outputPath);
  console.log(`\n📄 Generating student import template at: ${targetPath}`);

  const sampleHeaders = [
    "Student Name",
    "Phone Number",
    "Parent Phone",
    "Roll Number",
    "Class / Grade",
    "Batch",
    "Admission Fee",
    "Pending Fee",
  ];

  const demoData = [
    {
      "Student Name": "Aarav Sharma",
      "Phone Number": "9876543210",
      "Parent Phone": "9876543211",
      "Roll Number": "AS01",
      "Class / Grade": "Class 10",
      "Batch": "Morning Batch A",
      "Admission Fee": 5000,
      "Pending Fee": 1500,
    },
    {
      "Student Name": "Diya Patel",
      "Phone Number": "+91 91234 56780",
      "Parent Phone": "", // Missing parent phone will copy student phone
      "Roll Number": "",  // Blank roll number will be auto-generated
      "Class / Grade": "Class 12",
      "Batch": "",        // Blank batch will fallback to classGrade / defaultBatch
      "Admission Fee": 8000,
      "Pending Fee": 0,
    },
  ];

  const ws = xlsx.utils.json_to_sheet(demoData, { header: sampleHeaders });

  // Set friendly column widths
  ws["!cols"] = [
    { wch: 22 }, // Student Name
    { wch: 18 }, // Phone Number
    { wch: 18 }, // Parent Phone
    { wch: 15 }, // Roll Number
    { wch: 16 }, // Class / Grade
    { wch: 20 }, // Batch
    { wch: 16 }, // Admission Fee
    { wch: 16 }, // Pending Fee
  ];

  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Students");

  xlsx.writeFile(wb, targetPath);

  console.log("✅ Successfully generated template file!");
  console.log(`   File saved to: ${targetPath}`);
  console.log(`   Columns included: ${sampleHeaders.join(", ")}`);
  console.log("   Demo rows: 2 sample student records included\n");
}

// ─── FIELD NORMALIZATION HELPERS ────────────────────────────────────────────────

/**
 * Normalizes phone numbers:
 * - Handles scientific notation (e.g. 9.87654e+09)
 * - Removes country code (+91)
 * - Removes leading zeroes
 * - Strips non-digit characters
 * - Validates standard 10-digit format
 */
function cleanPhoneNumber(raw) {
  if (raw === null || raw === undefined) return "";
  let str = String(raw).trim();
  if (!str) return "";

  // Handle scientific notation e.g. 9.8765432100e+09
  if (/[eE][+-]?\d+/.test(str)) {
    const num = Number(str);
    if (!Number.isNaN(num) && Number.isFinite(num)) {
      str = BigInt(Math.round(num)).toString();
    }
  }

  // Handle float with decimal from Excel formatting (e.g. 9876543210.0)
  if (str.includes(".")) {
    const num = Number(str);
    if (!Number.isNaN(num) && Number.isFinite(num)) {
      str = Math.floor(num).toString();
    }
  }

  // Extract all digits
  let digits = str.replace(/\D/g, "");

  // If 12 digits starting with India country code 91, strip it
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }

  // Strip leading zeroes
  digits = digits.replace(/^0+/, "");

  // If longer than 10 digits, slice the last 10 digits
  if (digits.length > 10) {
    digits = digits.slice(-10);
  }

  return digits.length === 10 ? digits : "";
}

/**
 * Safely parses fee values into non-negative finite numbers.
 * Strips currency symbols (₹, $), commas, etc.
 * Defaults to 0 if invalid, negative, or NaN.
 */
function parseFee(raw) {
  if (raw === null || raw === undefined || raw === "") return 0;
  let str = String(raw).trim();
  if (!str) return 0;

  // Remove currency signs, spaces, and commas
  str = str.replace(/[^0-9.-]+/g, "");
  const num = Number(str);
  return Number.isFinite(num) && num >= 0 ? num : 0;
}

/**
 * Auto-generates a unique roll number based on institute and sequential counter
 */
function generateAutoRollNumber(instituteId, counter) {
  const instSuffix = String(instituteId).slice(-4).toUpperCase();
  const timeSuffix = Date.now().toString().slice(-4);
  const countStr = String(counter).padStart(3, "0");
  return `REG-${instSuffix}-${timeSuffix}-${countStr}`;
}

/**
 * Maps raw spreadsheet row keys to standard entity fields using fuzzy key detection
 */
function mapRowKeys(row) {
  const mapped = {
    name: "",
    phone: "",
    parentPhone: "",
    rollNumber: "",
    classGrade: "",
    batch: "",
    admissionFee: 0,
    pendingFee: 0,
  };

  for (const [key, val] of Object.entries(row)) {
    const cleanKey = String(key).toLowerCase().replace(/[^a-z0-9]/g, "");

    // Name
    if (["name", "studentname", "fullname", "candidatename", "student", "nameofstudent"].includes(cleanKey)) {
      mapped.name = val;
    }
    // Parent Phone (check parent first so 'parentphone' isn't absorbed by 'phone')
    else if (
      [
        "parentphone",
        "parentphonenumber",
        "parentphoneno",
        "parentmobile",
        "parentcontact",
        "fatherphone",
        "fathermobile",
        "motherphone",
        "mothermobile",
        "guardianphone",
        "guardianmobile",
        "guardiancontact",
        "emergencycontact",
        "emergencyphone",
        "parent",
      ].includes(cleanKey)
    ) {
      mapped.parentPhone = val;
    }
    // Student Phone
    else if (
      [
        "phone",
        "phonenumber",
        "phoneno",
        "mobile",
        "mobileno",
        "mobilenumber",
        "contact",
        "contactno",
        "contactnumber",
        "studentphone",
        "studentmobile",
        "studentcontact",
        "studentphonenumber",
      ].includes(cleanKey)
    ) {
      mapped.phone = val;
    }
    // Roll Number
    else if (
      [
        "rollnumber",
        "rollno",
        "roll",
        "regno",
        "registrationno",
        "registrationnumber",
        "admissionserial",
        "admissionno",
        "studentrollno",
        "rollnum",
        "id",
      ].includes(cleanKey)
    ) {
      mapped.rollNumber = val;
    }
    // Class / Grade
    else if (
      ["class", "grade", "classgrade", "studentclass", "standard", "std", "course", "stream"].includes(cleanKey)
    ) {
      mapped.classGrade = val;
    }
    // Batch
    else if (["batch", "batchname", "batches", "group", "section"].includes(cleanKey)) {
      mapped.batch = val;
    }
    // Admission Fee / Total Fee
    else if (
      [
        "admissionfee",
        "admissionfees",
        "fee",
        "fees",
        "totalfee",
        "totalfees",
        "coursefee",
        "coursefees",
        "totalcoursefee",
        "feeamount",
        "monthlyfee",
        "monthlyfees",
        "monthly",
        "monthfee",
        "feesmonthly",
        "feeamountmonthly",
      ].includes(cleanKey)
    ) {
      mapped.admissionFee = val;
    }
    // Pending Fee / Amount Due
    else if (
      [
        "pendingfee",
        "pendingfees",
        "amountdue",
        "duefee",
        "duefees",
        "balancefee",
        "balancefees",
        "balance",
        "due",
        "pending",
      ].includes(cleanKey)
    ) {
      mapped.pendingFee = val;
    }
  }

  return mapped;
}

// ─── OPTIONAL PORTAL SYNC ───────────────────────────────────────────────────────
async function syncToPortalAccounts(validRecords, instituteId) {
  let User, StudentProfile, FeeLedger, bcrypt;
  try {
    User = require("./models/User");
    StudentProfile = require("./models/StudentProfile");
    FeeLedger = require("./models/FeeLedger");
    bcrypt = require("bcryptjs");
  } catch (err) {
    console.log("⚠️  Portal models not found or bcryptjs unavailable; skipping portal sync.");
    return;
  }

  console.log(`\n🔄 Syncing ${validRecords.length} records into User, StudentProfile & FeeLedger...`);
  let synced = 0;

  for (const rec of validRecords) {
    try {
      const phoneDigits = rec.phone || rec.parentPhone;
      const firstName = rec.name.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "") || "student";
      const baseUsername = `${firstName}.${phoneDigits.slice(-4)}`;

      let username = baseUsername;
      let counter = 1;
      while (await User.findOne({ username })) {
        username = `${baseUsername}${counter++}`;
      }

      const tempPassword = `Stu@${phoneDigits.slice(-6)}`;
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      const user = await User.create({
        name: rec.name,
        username,
        passwordHash,
        role: "student",
      });

      const profile = await StudentProfile.create({
        user: user._id,
        rollNo: rec.rollNumber,
        batches: [rec.batch],
        batch: rec.batch,
        studentClass: rec.classGrade,
        parentContact: rec.parentPhone || rec.phone,
        admissionDate: new Date(),
        joiningDate: new Date(),
        status: rec.status || "active",
      });

      const totalFee = (rec.admissionFee || 0) + (rec.pendingFee || 0);
      const monthlyFee = rec.admissionFee || totalFee || (rec.pendingFee || 0);
      await FeeLedger.create({
        student: profile._id,
        totalFee: monthlyFee,
        amountPaid: rec.admissionFee || 0,
        amountDue: rec.pendingFee !== undefined && rec.pendingFee !== null && rec.pendingFee > 0 ? rec.pendingFee : Math.max(0, monthlyFee - (rec.admissionFee || 0)),
        monthlyFeeAmount: monthlyFee,
        paymentTiming: "advance",
        paymentHistory: [],
      });

      synced++;
    } catch (e) {
      // Continue sync even if one user fails
    }
  }

  console.log(`✨ Portal Sync Complete: ${synced} students available in LMS dashboard.`);
}

// ─── MAIN IMPORT CONTROLLER ─────────────────────────────────────────────────────
async function runImport() {
  const args = parseArgs(process.argv.slice(2));

  // Help display
  if (args.help) {
    console.log(`
Institute Student Bulk Importer
================================
CLI Usage:
  node importStudents.js --file ./students.xlsx --instituteId <INSTITUTE_MONGO_ID> [--defaultBatch "General"]
  node importStudents.js --generate-template [--output ./students_template.xlsx]

Options:
  --file <path>              Path to Excel (.xlsx, .xls) or CSV file (Required for import)
  --instituteId <ID>         Target Institute MongoDB ObjectId (Required for import)
  --defaultBatch <batch>     Fallback batch if column is missing or empty (Default: classGrade or "General")
  --generate-template        Outputs a clean students_template.xlsx with demo rows and exits
  --output <path>            Target path when generating template (Default: students_template.xlsx)
  --uri <connection_string>  MongoDB connection URI override
  --sync-portal              Also creates User, StudentProfile & FeeLedger records for web portal
  --help, -h                 Display this help screen
    `);
    process.exit(0);
  }

  // Generate template branch
  if (args.generateTemplate) {
    generateTemplate(args.templateOutput);
    process.exit(0);
  }

  // Mandatory parameter validation
  if (!args.file) {
    console.error("❌ Error: Missing required flag '--file <path>'.");
    console.log("Usage: node importStudents.js --file ./students.xlsx --instituteId <INSTITUTE_MONGO_ID>");
    console.log("Run 'node importStudents.js --help' for full options.");
    process.exit(1);
  }

  if (!args.instituteId) {
    console.error("❌ Error: Missing required flag '--instituteId <INSTITUTE_MONGO_ID>'.");
    console.log("Usage: node importStudents.js --file ./students.xlsx --instituteId <INSTITUTE_MONGO_ID>");
    process.exit(1);
  }

  if (!mongoose.Types.ObjectId.isValid(args.instituteId)) {
    console.error(`❌ Error: Provided instituteId "${args.instituteId}" is not a valid 24-character hex MongoDB ObjectId.`);
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), args.file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: File not found at path: ${filePath}`);
    process.exit(1);
  }

  const uri = args.uri;
  if (!uri) {
    console.error("❌ Error: MONGODB_URI is not set in .env or passed via --uri.");
    process.exit(1);
  }

  // 1. Connect to MongoDB
  console.log(`\n⏳ Connecting to database: ${uri.split("@").pop()}...`);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log("✅ Database connected successfully.");
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }

  // 2. Read Workbook
  console.log(`📂 Reading data from: ${filePath}...`);
  let rawRows = [];
  try {
    const workbook = xlsx.readFile(filePath, { cellDates: true, raw: true });
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error("No worksheets found in file.");
    }
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    rawRows = xlsx.utils.sheet_to_json(sheet, { defval: "" });
  } catch (err) {
    console.error("❌ Error reading spreadsheet:", err.message);
    await mongoose.disconnect();
    process.exit(1);
  }

  const totalRows = rawRows.length;
  console.log(`📊 Found ${totalRows} row(s) to process.`);

  if (totalRows === 0) {
    console.log("⚠️  Spreadsheet is empty. Nothing to import.");
    await mongoose.disconnect();
    process.exit(0);
  }

  // 3. Preload Existing Records for Duplicate Protection ($O(1)$ set lookups)
  const targetInstituteId = new mongoose.Types.ObjectId(args.instituteId);
  console.log(`🔍 Checking existing students under institute [${args.instituteId}]...`);

  const existingDbStudents = await Student.find({ instituteId: targetInstituteId })
    .select("name phone parentPhone rollNumber")
    .lean();

  const existingStudentKeys = new Set();
  const existingRolls = new Set();

  for (const s of existingDbStudents) {
    const studentName = String(s.name || "").trim().toLowerCase();
    if (studentName && s.phone) {
      existingStudentKeys.add(`${studentName}_${s.phone}`);
    }
    if (studentName && s.parentPhone) {
      existingStudentKeys.add(`${studentName}_${s.parentPhone}`);
    }
    if (s.rollNumber) existingRolls.add(s.rollNumber.toUpperCase());
  }

  console.log(`ℹ️  Found ${existingDbStudents.length} existing student(s) in institute database.`);

  // 4. Processing & Normalization
  const validRecords = [];
  const duplicatesSkipped = [];
  const failedRows = [];

  const batchStudentKeys = new Set();
  const batchRolls = new Set();

  let autoRollCounter = existingDbStudents.length + 1;

  for (let idx = 0; idx < rawRows.length; idx++) {
    const rowNumber = idx + 2; // Row 1 is header
    const rawRow = rawRows[idx];
    const row = mapRowKeys(rawRow);

    // Trim text fields
    const name = String(row.name || "").trim();
    const classGrade = String(row.classGrade || "").trim();
    const admissionFee = parseFee(row.admissionFee);
    const pendingFee = parseFee(row.pendingFee);

    // Rule: Strict Mandatory Fields -> Reject if Name is blank
    if (!name) {
      failedRows.push({
        row: rowNumber,
        name: "(Blank)",
        reason: "Student name is blank or missing",
      });
      continue;
    }

    // Phone & Parent Contact Normalization
    let phone = cleanPhoneNumber(row.phone);
    let parentPhone = cleanPhoneNumber(row.parentPhone);

    // If parentPhone missing, copy student's phone; if phone missing, copy parentPhone
    if (!parentPhone && phone) {
      parentPhone = phone;
    } else if (!phone && parentPhone) {
      phone = parentPhone;
    }

    // Rule: Strict Mandatory Fields -> Reject if both phone numbers are missing/invalid
    if (!phone && !parentPhone) {
      failedRows.push({
        row: rowNumber,
        name,
        reason: "Both student and parent phone numbers are missing or invalid (10-digit number required)",
      });
      continue;
    }

    // Batch Fallback Hierarchy
    let batch = String(row.batch || "").trim();
    if (!batch) {
      if (args.defaultBatch && args.defaultBatch.trim()) {
        batch = args.defaultBatch.trim();
      } else if (classGrade) {
        batch = classGrade;
      } else {
        batch = "General";
      }
    }

    // Roll Number Handling & Auto-generation
    let rollNumber = String(row.rollNumber || "").trim().toUpperCase();
    if (!rollNumber) {
      rollNumber = generateAutoRollNumber(args.instituteId, autoRollCounter++);
      // Ensure auto-generated roll number doesn't collide
      while (existingRolls.has(rollNumber) || batchRolls.has(rollNumber)) {
        rollNumber = generateAutoRollNumber(args.instituteId, autoRollCounter++);
      }
    }

    // Duplicate Checking against Database (Allows siblings with same phone but different names)
    const studentKey = `${name.toLowerCase()}_${phone}`;
    if (existingStudentKeys.has(studentKey)) {
      duplicatesSkipped.push({
        row: rowNumber,
        name,
        reason: `Student "${name}" with phone (${phone}) is already registered in this institute`,
      });
      continue;
    }

    if (existingRolls.has(rollNumber)) {
      duplicatesSkipped.push({
        row: rowNumber,
        name,
        reason: `Roll number (${rollNumber}) already exists in this institute`,
      });
      continue;
    }

    // Duplicate Checking against current file batch
    if (batchStudentKeys.has(studentKey)) {
      duplicatesSkipped.push({
        row: rowNumber,
        name,
        reason: `Duplicate student "${name}" with phone (${phone}) appears earlier in this spreadsheet`,
      });
      continue;
    }

    if (batchRolls.has(rollNumber)) {
      duplicatesSkipped.push({
        row: rowNumber,
        name,
        reason: `Duplicate roll number (${rollNumber}) appears earlier in this spreadsheet`,
      });
      continue;
    }

    // Track for intra-batch duplicate prevention
    batchStudentKeys.add(studentKey);
    if (parentPhone && parentPhone !== phone) {
      batchStudentKeys.add(`${name.toLowerCase()}_${parentPhone}`);
    }
    batchRolls.add(rollNumber);

    validRecords.push({
      instituteId: targetInstituteId,
      name,
      phone,
      parentPhone,
      rollNumber,
      classGrade,
      batch,
      admissionFee,
      pendingFee,
      status: "active",
    });
  }

  // 5. Database Execution (ordered: false allows valid rows to persist even if one fails)
  let successfullyImported = 0;

  if (validRecords.length > 0) {
    try {
      const insertResult = await Student.insertMany(validRecords, { ordered: false });
      successfullyImported = insertResult.length;
    } catch (bulkError) {
      // In ordered: false, some rows succeed while others fail with BulkWriteError
      if (bulkError.insertedDocs) {
        successfullyImported = bulkError.insertedDocs.length;
      } else if (bulkError.result && bulkError.result.nInserted) {
        successfullyImported = bulkError.result.nInserted;
      }

      if (bulkError.writeErrors && Array.isArray(bulkError.writeErrors)) {
        for (const wErr of bulkError.writeErrors) {
          const failedDoc = validRecords[wErr.index];
          if (wErr.code === 11000) {
            duplicatesSkipped.push({
              row: `Doc #${wErr.index + 1}`,
              name: failedDoc?.name || "Unknown",
              reason: "Database unique constraint violation (duplicate key)",
            });
          } else {
            failedRows.push({
              row: `Doc #${wErr.index + 1}`,
              name: failedDoc?.name || "Unknown",
              reason: wErr.errmsg || "Database insert error",
            });
          }
        }
      } else {
        console.error("⚠️  Database bulk insert warning:", bulkError.message);
      }
    }
  }

  // Optional: Sync to LMS Web Portal
  if (args.syncPortal && successfullyImported > 0) {
    await syncToPortalAccounts(validRecords.slice(0, successfullyImported), args.instituteId);
  }

  // 6. Formatted Console Report
  printReport({
    instituteId: args.instituteId,
    file: args.file,
    defaultBatch: args.defaultBatch || "None (Using class/General)",
    totalRows,
    successfullyImported,
    duplicatesSkipped,
    failedRows,
  });

  await mongoose.disconnect();
  console.log("🔌 Database disconnected cleanly.\n");
}

// ─── CONSOLE REPORT PRINTER ─────────────────────────────────────────────────────
function printReport({
  instituteId,
  file,
  defaultBatch,
  totalRows,
  successfullyImported,
  duplicatesSkipped,
  failedRows,
}) {
  const line = "═".repeat(68);
  const subLine = "─".repeat(68);

  console.log(`\n${line}`);
  console.log("               STUDENT BULK IMPORT SUMMARY REPORT               ");
  console.log(line);
  console.log(`  Institute ID         : ${instituteId}`);
  console.log(`  Source File          : ${file}`);
  console.log(`  Default Batch Fallback: ${defaultBatch}`);
  console.log(subLine);
  console.log(`  📋 Total Rows in File    : ${totalRows}`);
  console.log(`  ✅ Successfully Imported : ${successfullyImported}`);
  console.log(`  ⚠️  Duplicates Skipped    : ${duplicatesSkipped.length}`);
  console.log(`  ❌ Failed Rows (Invalid) : ${failedRows.length}`);
  console.log(line);

  if (duplicatesSkipped.length > 0) {
    console.log("\n─── DUPLICATES SKIPPED ───────────────────────────────────────────────");
    console.log(
      `${"Row".padEnd(8)} | ${"Student Name".padEnd(22)} | ${"Reason"}`
    );
    console.log(subLine);
    for (const dup of duplicatesSkipped) {
      const r = String(dup.row).padEnd(8);
      const n = String(dup.name).slice(0, 20).padEnd(22);
      console.log(`${r} | ${n} | ${dup.reason}`);
    }
  }

  if (failedRows.length > 0) {
    console.log("\n─── FAILED ROWS (INVALID DATA) ───────────────────────────────────────");
    console.log(
      `${"Row".padEnd(8)} | ${"Student Name".padEnd(22)} | ${"Reason"}`
    );
    console.log(subLine);
    for (const fail of failedRows) {
      const r = String(fail.row).padEnd(8);
      const n = String(fail.name).slice(0, 20).padEnd(22);
      console.log(`${r} | ${n} | ${fail.reason}`);
    }
  }

  console.log(`\n${line}\n`);
}

// Execute
runImport().catch((err) => {
  console.error("\n💥 Fatal Import Failure:", err);
  mongoose.disconnect().finally(() => process.exit(1));
});
