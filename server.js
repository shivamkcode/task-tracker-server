const express = require("express");
const jwt = require("jsonwebtoken");
const Sequelize = require("sequelize");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();

require("dotenv").config({ path: "./config/.env" });


app.use(cors());
app.use(bodyParser.json());

const sequelize = new Sequelize(`${process.env.DB_STRING}`,
  {
    host: `${process.env.HOST}`,
    dialect: "mysql",
    pool: { max: 5, min: 0, idle: 10000 },
  }
);
sequelize
  .authenticate()
  .then(() => {
    console.log("Success");
  })
  .catch((err) => {
    console.log("error" + err);
  });

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

User.hasMany(Board);
Board.hasMany(User);
Board.hasMany(Column, { onDelete: "Cascade" });
Board.hasMany(Task, { onDelete: "Cascade" });
Column.belongsTo(Board);
Task.belongsTo(Board);
Task.hasMany(Subtask, { onDelete: "Cascade" });
Subtask.belongsTo(Task);

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

// const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1];

//   if (token == null) return res.sendStatus(401); // if there isn't any token

//   jwt.verify(token, 'secretKey', (err, user) => {
//     if (err) return res.sendStatus(403);

//     req.user = user;
//     next(); // pass the execution off to whatever request the client intended
//   });
// };
// You can then use this middleware in your routes like so:

// JavaScript
// AI-generated code. Review and use carefully. More info on FAQ.

// app.put("/boards/:id", authenticateToken, async (req, res) => {
//   // your code here
// });

app.post("/boards", async (req, res) => {
  const { name, columns } = req.body;
  const token = req.headers.authorization;
  console.log(token);
  const { userId } = jwt.verify(token, "secretKey");

  try {
    const board = await Board.create({ name, userId });

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

app.delete("/boards/:id", async (req, res) => {
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

    const subTaskIds = subTasks.map(subtask => subtask.id).filter(id => id);
    const subTasksToDelete = await Subtask.findAll({ where: { taskId: id, id: { [Sequelize.Op.notIn]: subTaskIds } } });
    await Subtask.destroy({ where: { id: subTasksToDelete.map(subtask => subtask.id) } });

    const subTaskPromises = subTasks.map(async (subtask) => {
      if (subtask.id) {
        const existingSubtask = await Subtask.findOne({ where: { id: subtask.id } });
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


app.delete("/tasks/:id", async (req, res) => {
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

app.get("/boards", async (req, res) => {
  const token = req.headers.authorization;
  console.log(token);
  const { userId } = jwt.verify(token, "secretKey");
  const { boardId } = req.query;

  try {
    const boards = await Board.findAll({
      where: { userId },
      include: [
        { model: Column },
        {
          model: Task,
          where: { boardId },
          required: false,
          include: [Subtask],
        },
      ],
    });
    res.json(boards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT, () => console.log(`Server started on port ${process.env.PORT}`));
