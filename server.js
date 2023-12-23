const express = require("express");
const jwt = require("jsonwebtoken");
const Sequelize = require("sequelize");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(bodyParser.json());



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
  },
  {
    timestamps: false,
  }
);

User.hasMany(Board);
Board.hasMany(User);
Board.hasMany(Column);
Board.hasMany(Task);
Column.belongsTo(Board);
Task.belongsTo(Board);
Task.hasMany(Subtask);
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

app.post("/boards", async (req, res) => {
  const { name, columns } = req.body;
  const token = req.headers.authorization;
  console.log(token)
  const { userId } = jwt.verify(token, "secretKey");

  try {
    const board = await Board.create({ name, userId });

    const columnPromises = columns.map((columnName) => {
      return Column.create({ status: columnName, boardId: board.id });
    });
    await Promise.all(columnPromises);

    res.json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/tasks", async (req, res) => {
  const { title, description, status, boardId, subTasks } = req.body;

  try {
    const task = await Task.create({ title, description, status, boardId });

    const subTaskPromises = subTasks.map((subtask) => {
      return Subtask.create({ title: subtask, taskId: task.id });
    });
    await Promise.all(subTaskPromises);

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
   
app.get("/boards", async (req, res) => {
  const token = req.headers.authorization;
  console.log(token)
  const { userId } = jwt.verify(token, "secretKey");

  try {
    const boards = await Board.findAll({
      where: { userId },
      include: Column // Include the associated column
    });
    res.json(boards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/tasks", async (req, res) => {
  const { boardId } = req.query;

  try {
    const tasks = await Task.findAll({
      where: { boardId },
      include: [Subtask]
    });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(3000, () => console.log("Server started on port 3000"));
