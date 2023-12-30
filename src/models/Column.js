const Sequelize = require("sequelize");
const sequelize = require("../config/database");

const Column = sequelize.define(
    "column",
    {
      status: Sequelize.STRING,
    },
    {
      timestamps: false,
    }
  );
    
  module.exports = Column;
  