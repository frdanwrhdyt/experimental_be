const mongoose = require("mongoose");

const commonLayerSchema = new mongoose.Schema(
  {
    name: { type: String },
  },
  { timestamps: true }
);
const CommonLayer = mongoose.model("Layer", commonLayerSchema);

module.exports = CommonLayer;
