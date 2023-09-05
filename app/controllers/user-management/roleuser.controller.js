const { UserRole, User, Group } = require("../../models/user.model.js");
const asyncHandler = require("express-async-handler");

const roleUserController = {
  getUserRoles: async (req, res) => {
    try {
      const userRoles = await UserRole.find();
      res.json(userRoles);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  assignUserRole: asyncHandler(async (req, res) => {
    try {
      const { user_id, group_id, role } = req.body;

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
      console.log(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }),
  updateUserRole: asyncHandler(async (req, res) => {
    try {
      const id = req.params.id;
      const userRole = await UserRole.findByIdAndUpdate(id, req.body, {
        new: true,
      });
      res.status(200).json({ message: userRole });
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }),
};

module.exports = roleUserController;
