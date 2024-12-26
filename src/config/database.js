// const Sequelize = require("sequelize");
// const mysql2 = require("mysql2");
// require("dotenv").config({ path: "./src/config/.env" });

// const sequelize = new Sequelize(`${process.env.DB_STRING}`, {
//     host: `${process.env.HOST}`,
//     dialect: "mysql",
//     pool: { max: 5, min: 0, idle: 10000 },
//     dialectModule: mysql2,
//   });

//   module.exports = sequelize

const Sequelize = require("sequelize");
const pg = require("pg");
require("dotenv").config({ path: "./src/config/.env" });

const sequelize = new Sequelize(`${process.env.DB_STRING}`, {
  host: `${process.env.HOST}`,
  dialect: "postgres",
  pool: {
    max: 5,
    min: 0,
    idle: 10000,
  },
  dialectModule: pg,
});

module.exports = sequelize;
