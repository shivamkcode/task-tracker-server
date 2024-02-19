const User = require("./User");
const Board = require("./Board");
const Column = require("./Column");
const Task = require("./Task");
const Subtask = require("./Subtask");
const Invite = require("./Invite");
 
User.belongsToMany(Board, { through: "UserBoards" });
User.hasMany(Invite, { as: "SentInvites", foreignKey: "inviterId" });
User.hasMany(Invite, { as: "ReceivedInvites", foreignKey: "inviteeId" });

Board.belongsToMany(User, { through: "UserBoards" });
Board.hasMany(Column, { onDelete: "Cascade" });
Board.hasMany(Task, { onDelete: "Cascade" });
Board.hasMany(Invite, { foreignKey: "boardId" });

Column.belongsTo(Board);

Task.belongsTo(Board);
Task.hasMany(Subtask, { onDelete: "Cascade" });

Subtask.belongsTo(Task);

Invite.belongsTo(User, { as: "Inviter", foreignKey: "inviterId" });
Invite.belongsTo(User, { as: "Invitee", foreignKey: "inviteeId" });
Invite.belongsTo(Board, { foreignKey: "boardId" });

module.exports = {
    User,
    Board,
    Task,
    Column,
    Subtask,
    Invite
}