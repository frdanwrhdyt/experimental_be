const mongoose = require("mongoose");
const { Group } = require("./user.model");
const layerSchema = new mongoose.Schema(
  {
    layer: { type: String },
    tableName: { type: String },
  },
  { timestamps: true }
);
const commonLayerSchema = new mongoose.Schema(
  {
    layer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Layer" },
  },
  { timestamps: true }
);
layerSchema.pre("remove", async function (next) {
  try {
    await Group.updateMany({}, { $pull: { layers: this._id } });
    next();
  } catch (error) {
    next(error);
  }
});

const Layer = mongoose.model("Layer", layerSchema);
const CommonLayer = mongoose.model("CommonLayer", commonLayerSchema);

module.exports = { Layer, CommonLayer };
