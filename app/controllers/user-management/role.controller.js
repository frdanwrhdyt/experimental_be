// app/controllers/role.controller.js
const { Role } = require("../../models/user.model.js");

const roleController = {
  createRole: async (req, res) => {
    try {
      const newRole = new Role(req.body);
      await newRole.save();
      res.status(201).json(newRole);
    } catch (error) {
      res.status(400).json({ message: "Bad Request" });
    }
  },

  getAllRoles: async (req, res) => {
    try {
      const roles = await Role.find();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  updateRole: async (req, res) => {
    try {
      const roleId = req.params.id;
      const updatedRole = await Role.findByIdAndUpdate(roleId, req.body, {
        new: true,
      });
      if (!updatedRole) {
        res.status(404).json({ message: "Role not found" });
      }
      res.json(updatedRole);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  deleteRole: async (req, res) => {
    try {
      const roleId = req.params.id;
      const deletedRole = await Role.findByIdAndDelete(roleId);
      if (!deletedRole) {
        res.status(404).json({ message: "Role not found" });
      }
      res.json({ message: "Role deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

module.exports = roleController;
