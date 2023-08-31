const mongoose = require("mongoose");
const { Pool } = require("pg");

const dbConnection = async () => {
  try {
    const connect = await mongoose.connect(process.env.CONNECTION_STRING);
    console.log(
      "Database connected: ",
      connect.connection.host,
      connect.connection.name
    );
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

const pgConnection = new Pool({
  user: "postgres",
  host: "10.83.253.52",
  database: "tsat_db",
  password: "T3lk0msat",
  port: 5432,
});

module.exports = { dbConnection, pgConnection };
