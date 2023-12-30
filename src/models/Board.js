const Sequelize = require("sequelize");
const sequelize = require("../config/database");

const Board = sequelize.define(
    "board",
    {
      name: Sequelize.STRING,
    },
    {
      timestamps: false,
    }
  );
  

  module.exports = Board;
  