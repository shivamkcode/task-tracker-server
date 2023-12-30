const Sequelize = require("sequelize");
const sequelize = require("../config/database");

const Invite = sequelize.define("invite", {
    inviterId: Sequelize.INTEGER,
    inviteeId: Sequelize.INTEGER,
    boardId: Sequelize.INTEGER,
    status: Sequelize.STRING,
  });
  
  
  module.exports = Invite;
  