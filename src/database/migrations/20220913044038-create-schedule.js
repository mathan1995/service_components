const { Sequelize } = require('sequelize');

module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface
      .createTable('Schedules', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        userId: {
          allowNull: false,
          type: Sequelize.INTEGER,
        },
        institutionId: {
          allowNull: false,
          type: Sequelize.INTEGER,
        },
        courseId: {
          allowNull: false,
          type: Sequelize.INTEGER,
        },
        startDate: {
          allowNull: false,
          type: Sequelize.DATEONLY,
        },
        endDate: {
          type: Sequelize.DATEONLY,
        },
        cancelledDate: {
          type: Sequelize.DATEONLY,
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
      })
      .then(() => {
        queryInterface.addIndex('Schedules', {
          fields: ['courseId'],
          indexName: 'schedules_courseId_index',
        });
        queryInterface.addIndex('Schedules', {
          fields: ['startDate'],
          indexName: 'schedules_startDate_index',
        });
        queryInterface.addIndex('Schedules', {
          fields: ['endDate'],
          indexName: 'schedules_endDate_index',
        });
        queryInterface.addIndex('Schedules', {
          fields: ['cancelledDate'],
          indexName: 'schedules_cancelledDate_index',
        });
      });
  },
  down: ({ context: queryInterface }) => queryInterface.dropTable('Schedules'),
};
