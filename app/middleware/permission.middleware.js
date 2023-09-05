const asyncHandler = require("express-async-handler");
const { UserRole, Group } = require("../models/user.model");

const checkEditPermission = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user.id; // Sesuaikan ini dengan cara Anda mengakses user_id
    const userRole = await UserRole.findOne({ user_id: userId });
    const group = await Group.findById(userRole.group_id);

    if (!group || userRole.role !== "superuser") {
      return res.status(403).json({ message: "User role not found" });
    }

    if (!group.permission.includes("edit") || userRole.role !== "superuser") {
      return res.status(403).json({ message: "Permission denied" });
    }

    next(); // Lanjutkan ke middleware/route berikutnya jika izin ada
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = { checkEditPermission };
