const { Sequelize } = require('sequelize');

const connectDB = async () => {
  try {
    const sequelize = new Sequelize(process.env.DB_STRING, {
      dialect: 'mysql',
      logging: false
    });

    await sequelize.authenticate();
    console.log('MySQL Database Connected');
  } catch (err) {
    console.error('Unable to connect to the database:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
