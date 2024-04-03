const { Umzug, SequelizeStorage } = require('umzug');
const { sequelize } = require('Database/models');

const umzug = new Umzug({
  migrations: { glob: 'src/database/migrations/*.js' },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

const up = async () => {
  try {
    const response = await umzug.up();
    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 400,
    };
  }
};

const down = async () => {
  try {
    const response = await umzug.down();
    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 400,
    };
  }
};

module.exports = {
  up,
  down,
};
