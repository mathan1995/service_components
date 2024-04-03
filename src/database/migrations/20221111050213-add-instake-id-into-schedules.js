const { Sequelize } = require('sequelize');
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface
      .addColumn('Schedules', 'intakeId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        after: 'courseId',
      })
      .then(() => {
        queryInterface.addIndex('Schedules', {
          fields: ['intakeId'],
          indexName: 'schedules_intakeId_index',
        });
      });
  },

  async down({ context: queryInterface }) {
    await queryInterface.removeColumn('Schedules', 'intakeId');
  },
};
