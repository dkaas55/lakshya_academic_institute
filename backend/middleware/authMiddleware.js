const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Not authorized — no token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized — user no longer exists",
      });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Not authorized — invalid or expired token",
    });
  }
};

// Factory middleware: restrict to specific roles after protect() has run
const requireRole = (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied — requires role: ${roles.join(' or ')}`,
      });
    }
    next();
  };

// Convenience: protect + require teacher
const protectTeacher = [protect, requireRole('teacher')];

// Convenience: protect + require admin OR teacher
const protectAdminOrTeacher = [protect, requireRole('admin', 'teacher')];

module.exports = { protect, requireRole, protectTeacher, protectAdminOrTeacher };
