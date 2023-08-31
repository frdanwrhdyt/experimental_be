const { UserRole, User, Role, Group } = require("../../models/user.model.js");
const asyncHandler = require("express-async-handler");

const roleUserController = {
  getUserRoles: async (req, res) => {
    try {
      const userRoles = await UserRole.find();
      // .populate("user_id", "username")
      // .populate("role", "name", "permissions");

      res.json(userRoles);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  assignUserRole: asyncHandler(async (req, res) => {
    try {
      const { user_id, group_id, role } = req.body;

      if (role === "superuser") {
        if (req.body.key === process.env.SUPERUSER_KEY) {
          const userRole = await UserRole.create(req.body);
          return res.status(200).json({
            status: "success",
            message: {
              user_id: userRole.user_id,
              role: userRole.role,
            },
          });
        }
      }

      if (!user_id || !role || !group_id) {
        return res
          .status(400)
          .json({ message: "User ID, role, and group ID are required" });
      }

      const group = await Group.findById(group_id);
      const user = await User.findById(user_id);

      if (!group || !user) {
        return res
          .status(400)
          .json({ message: "User ID or group ID are invalid" });
      }

      const userRole = await UserRole.create(req.body);
      res.status(200).json({ message: userRole });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }),
};

module.exports = roleUserController;
