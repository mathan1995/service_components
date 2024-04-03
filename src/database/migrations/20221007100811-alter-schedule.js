module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.renameColumn('Schedules', 'startDate', 'closingDate');
    await queryInterface.renameColumn('Schedules', 'endDate', 'nextOpenDate');
  },

  down: async ({ context: queryInterface }) => {
    await queryInterface.renameColumn('Schedules', 'closingDate', 'startDate');
    await queryInterface.renameColumn('Schedules', 'nextOpenDate', 'endDate');
  },
};
