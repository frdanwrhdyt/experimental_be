const express = require("express");
const router = express.Router();
const LayerController = require("../controllers/layer/layer.controller");
const validatedToken = require("../middleware/verifyToken.middleware.js");
const { checkSuperuser } = require("../middleware/superuser.middleware.js");

router.get(
  "/layers",
  validatedToken,
  checkSuperuser,
  LayerController.getAllLayer
);
router.post(
  "/common-layers",
  validatedToken,
  checkSuperuser,
  LayerController.addCommonLayer
);
router.get("/common-layers", LayerController.commonLayer);
router.get("/mylayers", validatedToken, LayerController.userLayer);
module.exports = router;
