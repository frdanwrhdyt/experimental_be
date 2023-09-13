const express = require("express");
const router = express.Router();
const LayerController = require("../controllers/layer/layer.controller");
const validatedToken = require("../middleware/verifyToken.middleware.js");
const { checkSuperuser } = require("../middleware/superuser.middleware.js");
const {
  checkEditPermission,
} = require("../middleware/permission.middleware.js");

// Endpoints untuk menampilkan data layer
router.get(
  "/layer-desa-berpotensi",
  validatedToken,
  LayerController.showDesaData
);
router.get(
  "/show-layers",
  validatedToken,
  checkSuperuser,
  LayerController.getAllLayerUnsave
);
router.get("/common-layers", LayerController.commonLayer);
router.get("/mylayers", validatedToken, LayerController.userLayer);

// Endpoints untuk mengelola layer
router.post(
  "/layers",
  validatedToken,
  checkSuperuser,
  LayerController.addLayer
);
router.post(
  "/common-layers",
  validatedToken,
  checkSuperuser,
  LayerController.addCommonLayer
);
router.delete(
  "/show-layers/:id",
  validatedToken,
  checkEditPermission,
  LayerController.deleteLayer
);
router.put(
  "/layer/:id",
  validatedToken,
  checkSuperuser,
  LayerController.getLayerById
);

// Endpoints untuk mengelola data spasial dalam tabel
router.get("/table", validatedToken, LayerController.listTable);
router.get("/table/:tablename", validatedToken, LayerController.showTableData);
router.get(
  "/table/:tablename/find",
  validatedToken,
  LayerController.findDataById
);
router.put(
  "/table/:tablename/edit",
  validatedToken,
  checkEditPermission,
  LayerController.editData
);
router.post(
  "/table/:tablename/add-row",
  validatedToken,
  checkEditPermission,
  LayerController.addRowToTable
);
router.post(
  "/table",
  validatedToken,
  checkEditPermission,
  LayerController.createSpatialTable
);

module.exports = router;
