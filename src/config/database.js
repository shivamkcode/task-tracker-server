const Sequelize = require("sequelize");
require("dotenv").config({ path: "./src/config/.env" });

const sequelize = new Sequelize(`${process.env.DB_STRING}`, {
    dialect: "postgres",
    pool: {
        max: 5,
        min: 0,
        idle: 10000
    }
});

module.exports = sequelize;
