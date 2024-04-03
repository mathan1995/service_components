require('dotenv').config();

module.exports = {
  test: {
    username: null,
    password: null,
    database: 'test',
    host: null,
    port: null,
    storage: ':memory:',
    logging: false,
    dialect: 'sqlite',
  },
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ?? 3306,
    dialect: 'mysql',
  },
  stage: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ?? 3306,
    dialect: 'mysql',
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ?? 3306,
    dialect: 'mysql',
  },
};
