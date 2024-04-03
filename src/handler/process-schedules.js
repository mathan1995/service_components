const { processScheduleThatCloseToday } = require('Services/process-schedules-that-close-today');
const { processScheduleThatReopenToday } = require('Services/process-schedules-that-reopen-today');

const closeTodayHandler = async () => processScheduleThatCloseToday();

const reopenTodayHandler = async () => processScheduleThatReopenToday();

module.exports = {
  closeTodayHandler,
  reopenTodayHandler,
};
