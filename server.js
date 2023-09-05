// server.js
require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();

const { dbConnection } = require("./app/configs/database.config.js");
const UserRouter = require("./app/routers/user.router.js");
const LayerRouter = require("./app/routers/layer.router.js");
const credentials = require("./app/middleware/credentials.middleware");
const { logger } = require("./app/middleware/logEvents.middleware");
const corsOptions = require("./app/configs/corsOptions.config");
const errorHandler = require("./app/middleware/errorHandler.middleware.js");

// Memanggil fungsi koneksi database
dbConnection();

// Middleware, rute, dan lain-lain
// const corsOptions = {
//   credentials: true,
// };
app.use(credentials);
app.use(logger);
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

app.use("/", UserRouter);
app.use("/", LayerRouter);

app.all("*", (req, res) => {
  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "404.html"));
  } else if (req.accepts("json")) {
    res.json({ error: "404 Not Found" });
  } else {
    res.type("txt").send("404 Not Found");
  }
});
app.use(errorHandler);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
