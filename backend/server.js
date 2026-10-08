require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const { processMonthlyFees } = require("./utils/feeCron");
const { syncBatchTeacherAssignments } = require("./utils/syncBatchTeachers");
const { syncStudentRollNumbers } = require("./utils/syncStudentRollNumbers");
const { syncStudentBatches } = require("./utils/syncStudentBatches");

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

// Health check endpoints (used by monitoring tools like UptimeRobot, Render, and Cron-job.org)
const handleHealthCheck = (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const status = isDbConnected ? "ok" : "degraded";
  const statusCode = isDbConnected ? 200 : 503;

  res.status(statusCode).json({
    status,
    database: isDbConnected ? "connected" : "disconnected",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};

app.get("/health", handleHealthCheck);
app.get("/api/health", handleHealthCheck);

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
const examResultRoutes = require("./routes/examResultRoutes");
const { adminRouter: batchAdminRoutes, publicRouter: batchPublicRoutes } = require("./routes/batchRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/exam-results", examResultRoutes);
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

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB connection disconnected. Mongoose will retry automatically.");
  });

  await mongoose.connect(uri, {
    maxPoolSize: 10, // Limit open connections per instance to avoid exhausting MongoDB Atlas 500 limit
    minPoolSize: 1, // Keep at least 1 warm connection ready for instantaneous response
    serverSelectionTimeoutMS: 5000, // Fail fast (5s) instead of hanging indefinitely if Atlas is unreachable
    socketTimeoutMS: 45000, // Close inactive sockets after 45s
  });

  console.log("MongoDB connected successfully");
};

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

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
    await syncBatchTeacherAssignments();
    await syncStudentRollNumbers();
    await syncStudentBatches();

    // Run the automated monthly fee processor on startup
    await processMonthlyFees();
    
    // Schedule it to run every 24 hours
    setInterval(processMonthlyFees, 24 * 60 * 60 * 1000);

    const server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

    const gracefulShutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log("HTTP server closed.");
        try {
          await mongoose.connection.close(false);
          console.log("MongoDB connection closed cleanly.");
          process.exit(0);
        } catch (err) {
          console.error("Error closing MongoDB connection:", err.message);
          process.exit(1);
        }
      });

      // Force exit after 10s if graceful shutdown hangs
      setTimeout(() => {
        console.error("Could not close connections in time, forcefully shutting down");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
