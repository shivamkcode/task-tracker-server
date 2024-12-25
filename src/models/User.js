const Sequelize = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define(
  "user",
  {
    username: Sequelize.STRING,
    email: Sequelize.STRING,
    password: Sequelize.STRING,
    sampleBoardsCreated: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    updatedAt: false,
  }
);

module.exports = User;
