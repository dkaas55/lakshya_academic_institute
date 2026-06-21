require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const { processMonthlyFees } = require("./utils/feeCron");

const SALT_ROUNDS = 12;
const SEED_ADMIN = {
  name: "Admin User",
  username: "admin",
  password: "password123",
  role: "admin",
};

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Institute Management System API is running" });
});

app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "Test route is working" });
});

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const feeRoutes = require("./routes/feeRoutes");
const contentRoutes = require("./routes/contentRoutes");
const studentPortalRoutes = require("./routes/studentPortalRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const adminTeacherRoutes = require("./routes/adminTeacherRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const testRoutes = require("./routes/testRoutes");
const { adminRouter: batchAdminRoutes, publicRouter: batchPublicRoutes } = require("./routes/batchRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/student", studentPortalRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/admin/teachers", adminTeacherRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/admin/batches", batchAdminRoutes);
app.use("/api/batches", batchPublicRoutes);

const connectDatabase = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  console.log("MongoDB connected successfully");
};

const seedAdminUser = async () => {
  const existing = await User.findOne({ username: SEED_ADMIN.username });

  if (existing) {
    return;
  }

  const passwordHash = await bcrypt.hash(SEED_ADMIN.password, SALT_ROUNDS);

  await User.create({
    name: SEED_ADMIN.name,
    username: SEED_ADMIN.username,
    passwordHash,
    role: SEED_ADMIN.role,
  });

  console.log(
    `Seeded master admin account (${SEED_ADMIN.username}). Change the password after first login.`
  );
};

const Batch = require("./models/Batch");

const seedDefaultBatches = async () => {
  const defaults = [
    "Morning Batch A",
    "Morning Batch B",
    "Evening Batch A",
    "Evening Batch B",
    "Weekend Batch",
  ];

  const existing = await Batch.countDocuments();
  if (existing > 0) return;

  await Batch.insertMany(defaults.map((name) => ({ name })));
  console.log(`Seeded ${defaults.length} default batches.`);
};

const startServer = async () => {
  try {
    await connectDatabase();
    await seedAdminUser();
    await seedDefaultBatches();

    // Run the automated monthly fee processor on startup
    await processMonthlyFees();
    
    // Schedule it to run every 24 hours
    setInterval(processMonthlyFees, 24 * 60 * 60 * 1000);

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
