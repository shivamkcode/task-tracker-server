const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcrypt");
const Board = require('./Board')

const User = sequelize.define(
  "user",
  {
    username: Sequelize.STRING,
    email: Sequelize.STRING,
    password: Sequelize.STRING,
  },
  {
    updatedAt: false,
    hooks: {
      beforeCreate: async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        user.password = hashedPassword;
      },
    },
  }
);


module.exports = User;

