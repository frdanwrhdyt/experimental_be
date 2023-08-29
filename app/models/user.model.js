const mongoose = require("mongoose");

const permissions = ["CREATE", "READ", "UPDATE", "DELETE"];
const role = ["superuser", "admin", "staff"];
const userSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true },
    password: { type: String },
  },
  { timestamps: true }
);

const userRoleSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    role: {
      type: String,
      enum: role,
    },

    group_id: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    permissions: [
      {
        type: String,
        enum: permissions,
      },
    ],
  },
  { timestamps: true }
);

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, unique: true },
    layers: [{ type: String }],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const Group = mongoose.model("Group", groupSchema);
const UserRole = mongoose.model("UserRole", userRoleSchema);

module.exports = {
  User,
  Group,
  UserRole,
};
