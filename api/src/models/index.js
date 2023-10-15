import pg from "pg";
import Sequelize from "sequelize";
import { env } from "../utils.js";
import userModel from "./user.js";
import recordModel from "./record.js";
import trafficDataModel from "./trafficData.js";

const sequelize = new Sequelize({
  database: env("POSTGRES_DATABASE"),
  username: env("POSTGRES_USER"),
  password: env("POSTGRES_PASSWORD"),
  host: env("POSTGRES_HOST"),
  dialect: "postgres",
  dialectModule: pg,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

try {
  await sequelize.authenticate();
  console.log("Postgres connection has been established successfully.");
} catch (error) {
  console.error("Unable to connect to the database:", error);
}

const db = {
  User: userModel(sequelize, Sequelize.DataTypes),
  Record: recordModel(sequelize, Sequelize.DataTypes),
  TrafficData: trafficDataModel(sequelize, Sequelize.DataTypes),
};

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
