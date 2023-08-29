// server.js
require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();

const dbConnection = require("./app/configs/database.config.js");
const UserRouter = require("./app/routers/user.router.js");
const LayerRouter = require("./app/routers/layer.router.js");

// Memanggil fungsi koneksi database
dbConnection();
const corsOption = {
  origin: "*",
};

// Middleware, rute, dan lain-lain
app.use(express.json());
app.use(cors(corsOption));
app.use(cookieParser());

app.use("/", UserRouter);
app.use("/", LayerRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
