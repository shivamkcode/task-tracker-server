const Sequelize = require("sequelize");
const sequelize = require("../config/database");

const Task = sequelize.define("task", {
    title: Sequelize.STRING,
    description: Sequelize.TEXT,
    status: Sequelize.STRING,
  });
  
  
  
  module.exports = Task;
  