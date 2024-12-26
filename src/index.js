const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet"); // Import Helmet
const app = express();

const sequelize = require("./config/database");
const userRoutes = require("./routes/userRoutes");
const boardRoutes = require("./routes/boardRoutes");
const taskRoutes = require("./routes/taskRoutes");
const inviteRoutes = require("./routes/inviteRoutes");

require("dotenv").config({ path: "./config/.env" });

// Helmet configuration for CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://example.com"], // Add 'unsafe-inline' or use nonces/hashes
      styleSrc: ["'self'", "'unsafe-inline'"], // Adjust as needed
      imgSrc: ["'self'", "data:"], // Adjust as needed
      connectSrc: ["'self'", "https://example.com"], // Allow connections to necessary origins
      // Add other directives as needed
    },
  },
}));

// CORS Configuration
const corsOptions = {
  origin: '*', // Specify allowed origins as needed
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: "Content-Type, Authorization",
  preflightContinue: false,
  optionsSuccessStatus: 204,
  credentials: true,
  exposedHeaders: "Access-Control-Allow-Private-Network"
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Handle OPTIONS requests globally
app.options('*', cors(corsOptions));

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
