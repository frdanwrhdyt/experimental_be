// app/controllers/group.controller.js
const { Group } = require("../../models/user.model.js");
const { Layer } = require("../../models/layer.model.js");

const groupController = {
  createGroup: async (req, res) => {
    try {
      const newGroup = new Group(req.body);
      await newGroup.save();
      res.status(201).json(newGroup);
    } catch (error) {
      res.status(400).json({ message: "Bad Request" });
    }
  },

  getAllGroups: async (req, res) => {
    try {
      const groups = await Group.find();
      const layerGroup = await Promise.all(
        groups.map(async (group) => {
          const layerPromises = group.layers.map(async (layer) => {
            const lay = await Layer.findById(layer);
            return lay;
          });
          const layers = await Promise.all(layerPromises);

          return {
            id: group.id,
            name: group.name,
            layers: layers,
            permission: group.permission,
          };
        })
      );
      res.json(layerGroup);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  getGroupById: async (req, res) => {
    console.log(req.params.id);
    try {
      const group = await Group.findById(req.params.id);
      if (!group) {
        res.status(404).json({ message: "Group not found" });
        return;
      }

      res.json(group);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
  updateGroup: async (req, res) => {
    try {
      const group = await Group.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true } // Return the updated group
      );

      if (!group) {
        res.status(404).json({ message: "Group not found" });
        return;
      }

      res.json(group);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  deleteGroup: async (req, res) => {
    try {
      const group = await Group.findByIdAndDelete(req.params.id);

      if (!group) {
        res.status(404).json({ message: "Group not found" });
        return;
      }

      res.json({ message: "Group deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

module.exports = groupController;
