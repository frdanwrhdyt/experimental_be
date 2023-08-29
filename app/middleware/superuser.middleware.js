// app/middleware/checkSuperuser.js
const { User, UserRole } = require("../models/user.model");
const asyncHandler = require("express-async-handler");

const checkAdminOrSuperuser = asyncHandler(async (req, res, next) => {
  const userId = req.user.id; // Ambil ID pengguna dari token
  try {
    const userRole = (await UserRole.findOne({ user_id: userId })) || null;

    if (userRole.role === "admin" || userRole.role === "superuser") {
      // Lanjutkan jika pengguna adalah admin atau superuser
      next();
    } else {
      return res.status(403).json({ message: "Access denied" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

const checkSuperuser = asyncHandler(async (req, res, next) => {
  const userId = req.user.id; // Ambil ID pengguna dari token
  try {
    const userRole = (await UserRole.findOne({ user_id: userId })) || null;

    if (userRole.role === "superuser") {
      // Lanjutkan jika pengguna adalah admin atau superuser
      next();
    } else {
      return res.status(403).json({ message: "Access denied" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

const checkSuperuserKey = asyncHandler(async (req, res, next) => {
  const { key } = req.body;
  if (key !== process.env.SUPERUSER_KEY) {
    res.status(400).json({ message: "Superuser key is required" });
  }
  next();
});

module.exports = { checkSuperuser, checkAdminOrSuperuser, checkSuperuserKey };
