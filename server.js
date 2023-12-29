const express = require("express");
const jwt = require("jsonwebtoken");
const Sequelize = require("sequelize");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();

require("dotenv").config({ path: "./config/.env" });

app.use(cors());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(bodyParser.json());

//Db setup
const sequelize = new Sequelize(`${process.env.DB_STRING}`, {
  host: `${process.env.HOST}`,
  dialect: "mysql",
  pool: { max: 5, min: 0, idle: 10000 },
});
sequelize
  .authenticate()
  .then(() => {
    console.log("Success");
  })
  .catch((err) => {
    console.log("error" + err);
  });

//Models
const User = sequelize.define(
  "user",
  {
    username: Sequelize.STRING,
    email: Sequelize.STRING,
    password: Sequelize.STRING,
  },
  {
    updatedAt: false,
  }
);

const Board = sequelize.define(
  "board",
  {
    name: Sequelize.STRING,
  },
  {
    timestamps: false,
  }
);

const Column = sequelize.define(
  "column",
  {
    status: Sequelize.STRING,
  },
  {
    timestamps: false,
  }
);

const Task = sequelize.define("task", {
  title: Sequelize.STRING,
  description: Sequelize.TEXT,
  status: Sequelize.STRING,
});

const Subtask = sequelize.define(
  "subtask",
  {
    title: Sequelize.STRING,
    completed: {
      type: Sequelize.BOOLEAN,
      defaltValue: false,
    },
  },
  {
    timestamps: false,
  }
);

const Invite = sequelize.define("invite", {
  inviterId: Sequelize.INTEGER,
  inviteeId: Sequelize.INTEGER,
  boardId: Sequelize.INTEGER,
  status: Sequelize.STRING,
});

User.belongsToMany(Board, { through: "UserBoards" });
Board.belongsToMany(User, { through: "UserBoards" });
Board.hasMany(Column, { onDelete: "Cascade" });
Board.hasMany(Task, { onDelete: "Cascade" });
Column.belongsTo(Board);
Task.belongsTo(Board);
Task.hasMany(Subtask, { onDelete: "Cascade" });
Subtask.belongsTo(Task);
User.hasMany(Invite, { as: "SentInvites", foreignKey: "inviterId" });
User.hasMany(Invite, { as: "ReceivedInvites", foreignKey: "inviteeId" });
Board.hasMany(Invite, { foreignKey: "boardId" });

Invite.belongsTo(User, { as: "Inviter", foreignKey: "inviterId" });
Invite.belongsTo(User, { as: "Invitee", foreignKey: "inviteeId" });
Invite.belongsTo(Board, { foreignKey: "boardId" });

sequelize.sync();

app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  const existingUser =
    (await User.findOne({ where: { email } })) ||
    (await User.findOne({ where: { username } }));

  if (existingUser) {
    res.status(400).json({ error: "Email or username already exists" });
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);

    User.create({ username, email, password: hashedPassword }).then((user) => {
      jwt.sign({ user }, "secretKey", (err, token) => {
        res.json({ token });
      });
    });
  }
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  User.findOne({ where: { email } }).then(async (user) => {
    if (await bcrypt.compare(password, user.password)) {
      jwt.sign({ userId: user.id }, "secretKey", (err, token) => {
        res.json({ token });
      });
    } else {
      res.sendStatus(403);
    }
  });
});

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (token == null) return res.redirect("/login");

  jwt.verify(token, "secretKey", (err, user) => {
    if (err) return res.redirect("/login");

    req.user = user;
    next();
  });
};

app.post("/boards", async (req, res) => {
  const { name, columns } = req.body;
  const token = req.headers.authorization;
  const { userId } = jwt.verify(token, "secretKey");

  try {
    const user = await User.findOne({ where: { id: userId } });
    const board = await Board.create({ name });

    await user.addBoard(board);

    const columnPromises = columns.map((column) => {
      console.log(column);
      return Column.create({ status: column.status, boardId: board.id });
    });
    await Promise.all(columnPromises);

    res.json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/boards", async (req, res) => {
  const token = req.headers.authorization;
  const { userId } = jwt.verify(token, "secretKey");

  try {
    const user = await User.findOne({
      where: { id: userId },
      include: {
        model: Board,
        include: [
          { model: Column },
          {
            model: Task,
            required: false,
            include: [Subtask],
          },
        ],
      },
    });
    if (user && user.boards) {
      res.json(user.boards);
    } else {
      res.status(404).json({ error: "Board not found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/boards/:id", async (req, res) => {
  const { name, columns } = req.body;
  const { id } = req.params;

  try {
    const board = await Board.findOne({ where: { id } });

    if (!board) {
      return res.status(404).json({ error: "Board not found." });
    }

    board.name = name;
    await board.save();

    const columnIds = columns.map((column) => column.id).filter((id) => id);
    const columnsToDelete = await Column.findAll({
      where: { boardId: id, id: { [Sequelize.Op.notIn]: columnIds } },
    });
    await Column.destroy({
      where: { id: columnsToDelete.map((column) => column.id) },
    });

    const columnPromises = columns.map(async (column) => {
      if (column.id) {
        const existingColumn = await Column.findOne({
          where: { id: column.id },
        });
        if (existingColumn) {
          existingColumn.status = column.status;
          await existingColumn.save();
        }
      } else {
        await Column.create({ status: column.status, boardId: id });
      }
    });
    await Promise.all(columnPromises);

    res.json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/boards/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const board = await Board.findOne({ where: { id } });

    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }

    await board.destroy();
    res.json({ message: "Board deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/tasks", async (req, res) => {
  const { title, description, status, boardId, subTasks } = req.body;

  try {
    const task = await Task.create({ title, description, status, boardId });

    const subTaskPromises = subTasks.map((subtask) => {
      return Subtask.create({
        title: subtask.title,
        taskId: task.id,
        completed: subtask.completed,
      });
    });
    await Promise.all(subTaskPromises);

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/tasks/:id", async (req, res) => {
  const { title, description, status, subTasks } = req.body;
  const { id } = req.params;

  try {
    const task = await Task.findOne({ where: { id } });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    task.title = title;
    task.description = description;
    task.status = status;
    await task.save();

    const subTaskIds = subTasks.map((subtask) => subtask.id).filter((id) => id);
    const subTasksToDelete = await Subtask.findAll({
      where: { taskId: id, id: { [Sequelize.Op.notIn]: subTaskIds } },
    });
    await Subtask.destroy({
      where: { id: subTasksToDelete.map((subtask) => subtask.id) },
    });

    const subTaskPromises = subTasks.map(async (subtask) => {
      if (subtask.id) {
        const existingSubtask = await Subtask.findOne({
          where: { id: subtask.id },
        });
        if (existingSubtask) {
          existingSubtask.title = subtask.title;
          existingSubtask.completed = subtask.completed;
          await existingSubtask.save();
        }
      } else {
        await Subtask.create({
          title: subtask.title,
          taskId: task.id,
          completed: subtask.completed,
        });
      }
    });
    await Promise.all(subTaskPromises);

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/tasks/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const task = await Task.findOne({ where: { id } });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    await task.destroy();
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/users", async (req, res) => {
  const token = req.headers.authorization;
  const { userId } = jwt.verify(token, "secretKey");

  try {
    const user = await User.findOne({
      where: { id: userId },
      include: Board,
    });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/users/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [updated] = await User.update(req.body, {
      where: { id },
    });
    if (updated) {
      const updatedUser = await User.findByPk(id);
      res.status(200).json({ user: updatedUser });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/users/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await User.destroy({
      where: { id },
    });
    if (deleted) {
      res.status(204).send("User deleted");
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/invites", async (req, res) => {
  const { inviterId, inviteeEmail, boardId } = req.body;

  try {
    const invitee = await User.findOne({ where: { email: inviteeEmail } });
    if (!invitee) {
      return res.status(404).json({ error: "Invitee not found" });
    }

    const invite = await Invite.create({
      inviterId,
      inviteeId: invitee.id,
      boardId,
      status: "pending",
    });
    res.json(invite);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/invites/sent/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const invites = await Invite.findAll({
      where: { inviterId: id },
      include: [
        { model: User, as: "Inviter", attributes: ["username"] },
        { model: User, as: "Invitee", attributes: ["username"] },
        { model: Board, attributes: ["name"] },
      ],
    });
    res.json(invites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/invites/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const invites = await Invite.findAll({
      where: { inviteeId: id },
      include: [
        { model: User, as: "Inviter", attributes: ["username"] },
        { model: User, as: "Invitee", attributes: ["username"] },
        { model: Board, attributes: ["name"] },
      ],
    });
    res.json(invites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/invites/:id/:task", async (req, res) => {
  const { id, task } = req.params;

  try {
    const invite = await Invite.findOne({ where: { id } });
    if (!invite) {
      return res.status(404).json({ error: "Invite not found" });
    }

    if (task === "accept") {
      invite.status = "accepted";
      await invite.save();
    } else if (task === "reject") {
      invite.status = "rejected";
      await invite.save();
    }

    const user = await User.findOne({ where: { id: invite.inviteeId } });
    const board = await Board.findOne({ where: { id: invite.boardId } });

    const memberships = await user.getBoards();
    const isMember = memberships.some(
      (membership) => membership.id === board.id
    );

    if (!isMember) {
      await user.addBoard(board);
    }

    res.json(invite);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT, () =>
  console.log(`Server started on port ${process.env.PORT}`)
);
