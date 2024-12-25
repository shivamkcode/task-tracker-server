const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

const sequelize = require("./config/database");
const userRoutes = require("./routes/userRoutes");
const boardRoutes = require("./routes/boardRoutes");
const taskRoutes = require("./routes/taskRoutes");
const inviteRoutes = require("./routes/inviteRoutes");

require("dotenv").config({ path: "./config/.env" });

app.use(cors())

app.use(bodyParser.json());

// Routes
app.use("/", userRoutes);
app.use("/boards", boardRoutes);
app.use("/tasks", taskRoutes);
app.use("/invites", inviteRoutes);

sequelize
  .sync({})
  .then(() => {
    console.log("Connected to the database");
    app.listen(process.env.PORT, () => {
      console.log("Server is running on port 3000");
    });
  })
  .catch((error) => {
    console.log("Unable to connect to the database:", error);
  });
