// app/routers/user.router.js
const express = require("express");
const router = express.Router();

const userController = require("../controllers/user-management/user.controller.js");
const groupController = require("../controllers/user-management/group.controller.js");
const userRoleController = require("../controllers/user-management/roleuser.controller.js");

const { checkSuperuser } = require("../middleware/superuser.middleware.js");
const validatedToken = require("../middleware/verifyToken.middleware.js");

// Routes for User management
router.get(
  "/users",
  validatedToken,
  checkSuperuser,
  userController.getAllUsers
);
router.post("/createsuperuser", userController.createSuperUser);
router.post("/register", userController.createUser);
router.post("/login", userController.loginUser);
router.get("/refresh-token", userController.refreshToken);
router.get("/users/:id", validatedToken, userController.getUserById);
router.get("/current-user", validatedToken, userController.currentUser);
router.get("/logout", userController.handleLogout);

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
router.put("/groups/:id", validatedToken, groupController.updateGroup);

router.post(
  "/user-role",
  validatedToken,
  checkSuperuser,
  userRoleController.assignUserRole
);
router.put(
  "/user-role/:id",
  validatedToken,
  checkSuperuser,
  userRoleController.updateUserRole
);
router.get(
  "/user-role",
  validatedToken,
  checkSuperuser,
  userRoleController.getUserRoles
);

module.exports = router;
