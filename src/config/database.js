const Sequelize = require("sequelize");
const mysql2 = require("mysql2");
require("dotenv").config({ path: "./config/.env" });
 
const sequelize = new Sequelize(`${process.env.DB_STRING}`, {
    host: `${process.env.HOST}`,
    dialect: "mysql",
    pool: { max: 5, min: 0, idle: 10000 },
    dialectModule: mysql2,
  });

  module.exports = sequelize