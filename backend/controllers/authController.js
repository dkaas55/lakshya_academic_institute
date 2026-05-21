const bcrypt = require("bcryptjs");
const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");
const generateToken = require("../utils/generateToken");

const SALT_ROUNDS = 12;
const VALID_ROLES = ["admin", "teacher", "student"];

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name?.trim() || !email?.trim() || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, and role are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be admin, teacher, or student",
      });
    }

    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role,
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        user: formatUser(user),
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

const LOGIN_ROLES = ["admin", "teacher", "student"];

const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email?.trim() || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and role are required",
      });
    }

    const normalizedRole = String(role).trim().toLowerCase();

    if (!LOGIN_ROLES.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: "Role must be admin, teacher, or student",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.role !== normalizedRole) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: Role mismatch.",
      });
    }

    // ── Student account status guard ──────────────────────────────────────────
    if (normalizedRole === "student") {
      const profile = await StudentProfile.findOne({ user: user._id }).lean();
      if (profile) {
        if (profile.status === "removed") {
          return res.status(403).json({
            success: false,
            message: "Your account has been removed. Please contact the institute.",
          });
        }
        if (profile.status === "paused") {
          return res.status(403).json({
            success: false,
            message: "Your account is temporarily paused. Please contact the institute.",
          });
        }
      }
    }

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: formatUser(user),
        token: generateToken(user._id),
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

const getMe = async (req, res) => {
  res.json({
    success: true,
    data: {
      user: formatUser(req.user),
    },
  });
};

module.exports = { register, login, getMe };
