const asyncHandler = require("express-async-handler");
const { UserRole, Group } = require("../../models/user.model");
const { CommonLayer, Layer } = require("../../models/layer.model");
const { pgConnection } = require("../../configs/database.config");

const grcImport = require("geoserver-node-client");
const GeoServerRestClient = grcImport.GeoServerRestClient;
const grc = new GeoServerRestClient(
  process.env.GEOSERVER_URL,
  process.env.GEOSERVER_USERNAME,
  process.env.GEOSERVER_PASSWORD
);

const getAllLayerUnsave = asyncHandler(async (req, res) => {
  try {
    const data = await grc.layers.getAll();
    const query = `
      SELECT table_name
      FROM information_schema.columns
      WHERE table_schema='public' AND data_type='USER-DEFINED' AND udt_name='geometry'
    `;
    const { rows } = await pgConnection.query(query);
    const tableNames = rows.map((row) => row.table_name);
    const mergedData = data.layers.layer.map((layerObj) => {
      const layerNameParts = layerObj.name.split(":");
      const tableName =
        tableNames.find((name) => name === layerNameParts[1]) || "N/A";
      return {
        layer: layerObj.name,
        tableName: tableName,
      };
    });

    res.status(200).json(mergedData);
  } catch (e) {
    console.log(e);
    res.status(505).json({ message: "Internal server error" });
  }
});

const addLayer = asyncHandler(async (req, res) => {
  try {
    const layersData = req.body.layers;

    if (!layersData || !Array.isArray(layersData) || layersData.length === 0) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const layersToCreate = layersData.map((layerObj) => {
      const layerNameParts = layerObj.layer.split(":");
      return {
        layer: layerObj.layer,
        tableName: layerObj.tableName,
        actualTableName: layerNameParts[1] || "N/A",
      };
    });

    const createdLayers = await Layer.insertMany(layersToCreate);
    res.status(201).json({ layers: createdLayers, message: "success" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
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
    const layers = group.layers;

    const detailLayers = await Promise.all(
      layers.map(async (layer) => {
        const layerDocument = await Layer.findById(layer);
        return layerDocument;
      })
    );
    res.status(200).json({ data: detailLayers });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
});
const commonLayer = asyncHandler(async (req, res) => {
  try {
    const layers = await CommonLayer.find();

    const detailLayers = await Promise.all(
      layers.map(async (layer) => {
        const layerDocument = await Layer.findById(layer.layer_id);
        return {
          _id: layer.id,
          layer: layerDocument ? layerDocument.layer : null,
          tableName: layerDocument ? layerDocument.tableName : null,
          createdAt: layer.createdAt,
          updatedAt: layer.updatedAt,
        };
      })
    );

    res.status(200).json(detailLayers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const addCommonLayer = asyncHandler(async (req, res) => {
  try {
    const layerDataArray = req.body;

    if (
      !layerDataArray ||
      !Array.isArray(layerDataArray) ||
      layerDataArray.length === 0
    ) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const createdLayers = await CommonLayer.create(layerDataArray);

    res.status(200).json({ data: createdLayers, status: "success" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const listTable = asyncHandler(async (req, res) => {
  try {
    const query = `
      SELECT table_name
      FROM information_schema.columns
      WHERE table_schema='public' AND data_type='USER-DEFINED' AND udt_name='geometry'
    `;
    const { rows } = await pgConnection.query(query);
    const tableNames = rows.map((row) => row.table_name);
    res.status(201).json(tableNames);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

const showTableData = asyncHandler(async (req, res) => {
  try {
    const { tablename } = req.params;
    const { page } = req.query; // Mendapatkan parameter halaman dari query string
    const itemsPerPage = 20; // Jumlah item per halaman

    if (!tablename) {
      res.status(400).json({ message: "Missing 'tablename' parameter" });
      return;
    }

    const offset = (page - 1) * itemsPerPage;
    // const query = `SELECT *, ST_AsGeoJSON(geom) AS geom FROM "${tablename}" ORDER BY id OFFSET ${offset} LIMIT ${itemsPerPage}`;
    const query = `SELECT *, ST_AsGeoJSON(geom) AS geom FROM "${tablename}" OFFSET ${offset} LIMIT ${itemsPerPage}`;

    const result = await pgConnection.query(query);

    const tableData = result.rows.map((row) => ({
      ...row,
      geom: JSON.parse(row.geom), // Konversi GeoJSON teks ke objek JSON
    }));

    // Menghitung total halaman berdasarkan total data dan itemsPerPage
    const queryTotal = `SELECT COUNT(*) FROM "${tablename}"`;
    const resultTotal = await pgConnection.query(queryTotal);
    const totalItems = resultTotal.rows[0].count;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    res.status(200).json({ data: tableData, totalPages, totalItems }); // Menambahkan totalItems ke dalam respons
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

const editData = asyncHandler(async (req, res) => {
  try {
    const { tablename } = req.params;
    const { id } = req.query; // Mendapatkan parameter ID dari query string
    const updateData = req.body; // Mendapatkan data yang ingin diubah

    if (!tablename || !id || !updateData) {
      res.status(400).json({ message: "Missing required parameters" });
      return;
    }

    const setColumns = Object.keys(updateData)
      .map((key, index) => `"${key}" = $${index + 1}`)
      .join(", ");

    const query = `
      UPDATE "${tablename}"
      SET ${setColumns}
      WHERE id = $${Object.keys(updateData).length + 1}
    `;

    const values = [...Object.values(updateData), id];
    await pgConnection.query(query, values);

    res.status(200).json({ message: "Data updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

const findDataById = asyncHandler(async (req, res) => {
  try {
    const { tablename } = req.params;
    const { id } = req.query; // Mendapatkan parameter ID dari query string

    if (!tablename || !id) {
      res.status(400).json({ message: "Missing required parameters" });
      return;
    }

    const query = `
      SELECT *, ST_AsGeoJSON(geom) AS geom
      FROM "${tablename}"
      WHERE id = $1
    `;

    const result = await pgConnection.query(query, [id]);
    const rowData = result.rows[0];

    if (!rowData) {
      res.status(404).json({ message: "Data not found" });
      return;
    }

    const geomData = JSON.parse(rowData.geom);
    const { geom, ...otherData } = rowData;

    res.status(200).json({
      geom: geomData,
      ...otherData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});
const addRowToTable = asyncHandler(async (req, res) => {
  try {
    const { tablename } = req.params;
    const { data } = req.body;

    if (!tablename || !data) {
      res.status(400).json({ message: "Missing required parameters" });
      return;
    }

    const columns = Object.keys(data).join(", ");
    const values = Object.values(data)
      .map((value) => `'${value}'`)
      .join(", ");
    const query = `INSERT INTO "${tablename}" (${columns}) VALUES (${values}) RETURNING *`;

    const result = await pgConnection.query(query);
    const newRow = result.rows[0];

    res.status(201).json(newRow);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

const createSpatialTable = asyncHandler(async (req, res) => {
  try {
    const { tableName, data } = req.body;
    const user_id = req.user.id;

    if (!tableName || !data) {
      res.status(400).json({ message: "Missing required parameters" });
      return;
    }

    // Pastikan bahwa "data" memiliki struktur yang sesuai dengan GeoJSON
    const { type, geometry, properties } = data;

    if (!type || !geometry || !properties) {
      res.status(400).json({ message: "Invalid 'data' structure" });
      return;
    }

    // Buat query untuk membuat tabel dengan kolom geometri dan properti sebagai kolom tambahan
    const createTableQuery = `
      CREATE TABLE "${tableName}" (
        id SERIAL PRIMARY KEY,
        geom geometry(Geometry, 4326),
        ${Object.keys(properties)
          .map((prop) => `"${prop}" TEXT`) // Ubah 'string' menjadi 'TEXT'
          .join(", ")}
      );
    `;

    // Eksekusi query untuk membuat tabel
    await pgConnection.query(createTableQuery);

    // Insert data ke dalam tabel
    const insertDataQuery = `
      INSERT INTO "${tableName}" (geom, ${Object.keys(properties).join(", ")})
      VALUES (ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(
        geometry
      )}'), 4326), ${Object.values(properties)
      .map((propValue) => `'${propValue}'`)
      .join(", ")});
    `;

    await pgConnection.query(insertDataQuery);

    const layerName = tableName;
    const nativeBoundingBox = {
      minx: -180,
      maxx: 180,
      miny: -90,
      maxy: 90,
      crs: {
        "@class": "projected",
        $: "EPSG:4326",
      },
    };
    await grc.layers.publishFeatureType(
      process.env.GEOSERVER_WORKSPACE_NAME,
      process.env.GEOSERVER_WORKSPACE_NAME,
      tableName,
      layerName,
      layerName,
      "EPSG:4326",
      true,
      "",
      nativeBoundingBox
    );
    const layersList = await Layer.create({
      layer: `${process.env.GEOSERVER_WORKSPACE_NAME}:${layerName}`,
      tableName: layerName,
    });
    const userRole = await UserRole.find({ user_id });
    const layers = await Group.findById(userRole.group_id);
    await Group.findByIdAndUpdate(layers.id, {
      layers: [...layers, layersList.id],
    });
    const bod_layers = await Group.find({ name: "BOD" });
    await Group.findByIdAndUpdate(bod_layers.id, {
      layers: [...bod_layers, layersList.id],
    });

    res.status(201).json({ message: "Spatial table created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

const getLayerById = asyncHandler(async (req, res) => {
  try {
    const id = req.params.id;
    const layers = Layer.findById(id);
    if (!layers) res.status(404).json({ message: "Layers not found" });
    res.status(200).json(layers);
  } catch (e) {
    console.log(e);
    res.status(505).json({ mesage: "Internal server error" });
  }
});

module.exports = {
  getAllLayerUnsave,
  userLayer,
  commonLayer,
  addCommonLayer,
  listTable,
  showTableData,
  editData,
  findDataById,
  addRowToTable,
  createSpatialTable,
  addLayer,
  getLayerById,
};
