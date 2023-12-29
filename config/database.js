const Sequelize = require("sequelize");

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

module.exports = sequelize