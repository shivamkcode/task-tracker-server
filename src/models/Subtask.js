const Sequelize = require("sequelize");
const sequelize = require("../config/database");

const Subtask = sequelize.define(
    "subtask",
    {
      title: Sequelize.STRING,
      completed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      timestamps: false,
    }
  );
    
  module.exports = Subtask;
  