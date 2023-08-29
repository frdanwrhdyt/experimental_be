// app/routers/user.router.js
const express = require("express");
const router = express.Router();

const userController = require("../controllers/user-management/user.controller.js");
const roleController = require("../controllers/user-management/role.controller.js");
const groupController = require("../controllers/user-management/group.controller.js");
const userRoleController = require("../controllers/user-management/roleuser.controller.js");

const {
  checkSuperuser,
  checkAdminOrSuperuser,
} = require("../middleware/superuser.middleware.js");
const validatedToken = require("../middleware/verifyToken.middleware.js");

// Routes for User management
router.get(
  "/users",
  validatedToken,
  checkSuperuser,
  userController.getAllUsers
);
router.post("/register", userController.createUser);
router.post("/login", userController.loginUser);
router.post("/refresh-token", userController.refreshToken);
router.get("/users/:id", validatedToken, userController.getUserById);
router.get("/current-user", validatedToken, userController.currentUser);

router.get(
  "/groups",
  validatedToken,
  checkSuperuser,
  groupController.getAllGroups
);
router.post(
  "/groups",
  validatedToken,
  checkSuperuser,
  groupController.createGroup
);
router.get("/groups/:id", validatedToken, groupController.getGroupById);
router.patch("/groups/:id", validatedToken, groupController.updateGroup);

router.post("/user-role", validatedToken, userRoleController.assignUserRole);
router.get(
  "/user-role",
  validatedToken,
  checkSuperuser,
  userRoleController.getUserRoles
);

module.exports = router;
