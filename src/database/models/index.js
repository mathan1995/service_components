const Sequelize = require('sequelize');

const env = process.env.NODE_ENV || 'development';
const config = require('Config/database')[env];

const sequelize = new Sequelize(config.database, config.username, config.password, config);

const schedule = require('./schedule');

const models = [schedule];

const db = {};
models.forEach((modelInit) => {
  const model = modelInit(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
});

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
