const asyncHandler = require("express-async-handler");
const { UserRole, Group } = require("../../models/user.model");
const CommonLayer = require("../../models/layer.model");

const grcImport = require("geoserver-node-client");
const GeoServerRestClient = grcImport.GeoServerRestClient;

const url = "http://10.83.253.52:8080/geoserver/rest/";
const user = "admin";
const pw = "geoserver";

const getAllLayer = asyncHandler(async (req, res) => {
  try {
    const grc = new GeoServerRestClient(url, user, pw);

    const data = await grc.layers.getAll();
    res.status(200).json(data);
  } catch (e) {
    console.log(e);
    res.status(505).json({ message: "Internal server error" });
  }
});

const userLayer = asyncHandler(async (req, res) => {
  try {
    const user_id = req.user.id;
    const userRole = await UserRole.find({ user_id });
    if (!userRole) {
      res.status(404).json({ message: "Layer not found" });
      return;
    }
    const group_id = userRole.map((g) => {
      return g.group_id;
    });
    const group = await Group.findById(group_id);
    if (!group) {
      res.status(404).json({ message: "Group not found" });
      return;
    }
    const layerNames = group.layers;

    res.status(200).json({ data: layerNames });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
});
const commonLayer = asyncHandler(async (req, res) => {
  try {
    const Layers = await CommonLayer.find();
    res.status(200).json(Layers);
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
});

const addCommonLayer = asyncHandler(async (req, res) => {
  try {
    const { layers } = req.body;
    console.log(layers);
    if (!layers) {
      res.status().json({ message: "All field are mandatory" });
    }
    const Layers = await CommonLayer.create({ name: layers });
    res.status(200).json({ data: Layers, status: "success" });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = { getAllLayer, userLayer, commonLayer, addCommonLayer };
