const mongoose = require("mongoose");

const permissions = ["edit", "view"];
const role = ["superuser", "user"];

const userSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    refreshToken: [String],
  },
  { timestamps: true }
);

// Hook middleware untuk menghapus semua UserRole saat User dihapus
userSchema.pre("remove", async function (next) {
  try {
    // Hapus semua UserRole yang memiliki user_id yang sesuai dengan User yang akan dihapus
    await UserRole.deleteMany({ user_id: this._id });
    next();
  } catch (error) {
    next(error);
  }
});

const userRoleSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    group_id: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    role: {
      type: String,
      enum: role,
    },
  },
  { timestamps: true }
);

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, unique: true },
    permission: { type: String, enum: permissions },
    layers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Layer" }],
  },
  { timestamps: true }
);

// Hook middleware untuk menghapus semua UserRole saat Group dihapus
groupSchema.pre("remove", async function (next) {
  try {
    // Hapus semua UserRole yang memiliki group_id yang sesuai dengan Group yang akan dihapus
    await UserRole.deleteMany({ group_id: this._id });
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model("User", userSchema);
const Group = mongoose.model("Group", groupSchema);
const UserRole = mongoose.model("UserRole", userRoleSchema);

module.exports = {
  User,
  Group,
  UserRole,
};
