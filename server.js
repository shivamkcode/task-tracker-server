const express = require("express");
const jwt = require("jsonwebtoken");
const Sequelize = require("sequelize");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cors = require('cors')

const app = express();

app.use(cors())
app.use(bodyParser.json());

const sequelize = new Sequelize(db-string-add-krli,
  {
    host: "task-management-app-do-user-14624530-0.c.db.ondigitalocean.com",
    dialect: "mysql",
    pool: { max: 5, min: 0, idle: 1000 },
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

const Board = sequelize.define("board", {
  name: Sequelize.STRING,
}, {
  timestamps: false,
});

const Column = sequelize.define('column', {
  status: Sequelize.STRING,
},{
  timestamps:false
})

const Task = sequelize.define("task", {
  title: Sequelize.STRING,
  description: Sequelize.TEXT,
  status: Sequelize.STRING,
});

const Subtask = sequelize.define('subtask', {
  title: Sequelize.STRING
}, {
  timestamps: false,
})

User.hasMany(Board);
Board.hasMany(User);
Board.hasMany(Task);
Task.belongsTo(Board);
Task.hasMany(Subtask)
Subtask.belongsTo(Task)
Board.hasMany(Column);
Column.belongsTo(Board);

sequelize.sync();

app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  const existingUser = await User.findOne({ where: { email } }) || await User.findOne({ where: { username } });

  if (existingUser) {
    res.status(400).json({ error: 'Email or username already exists' });
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
      jwt.sign({ user }, "sercretKey", (err, token) => {
        res.json({ token });
      });
    } else {
      res.sendStatus(403);
    }
  });
});

app.post("/boards", async (req, res) => {
  const { name, userId, columns } = req.body;

  try {
    const board = await Board.create({ name, userId });

    const columnPromises = columns.map(columnName => {
      return Column.create({ name: columnName, boardId: board.id });
    });
    await Promise.all(columnPromises);

    res.json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/tasks", (req, res) => {
  const { title, description, boardId } = req.body;

  Task.create({ title, description, boardId })
    .then((task) => res.json(task))
    .catch((err) => res.status(500).json({ error: err.message }));
});

app.post('/subtasks', (req, res) => {
  const { title, taskID } = req.body

  Subtask.create({ title, taskID })
    .then((subtask) => res.json(subtask))
    .catch((err) => res.status(500).json({error: err.message}))
})

app.get("/tasks", (req, res) => {
  jwt.verify(req.token, "secretkey", (err) => {
    if (err) {
      res.sendStatus(403);
    } else {
      Task.findAll().then((tasks) => res.json(tasks));
    }
  });
});

app.listen(3000, () => console.log("Server started on port 3000"));
