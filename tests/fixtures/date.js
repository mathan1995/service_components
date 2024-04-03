const { dateAsString, durationInMillisecond, today: todayFn } = require('Utils/date');

const yesterday = new Date(Date.now() - durationInMillisecond({ days: 1 }));
const yesterdayDateString = dateAsString(yesterday);

const today = todayFn();
const todayDateString = dateAsString(today);

const tomorrow = new Date(Date.now() + durationInMillisecond({ days: 1 }));
const tomorrowDateString = dateAsString(tomorrow);

module.exports = {
  yesterday,
  yesterdayDateString,
  today,
  todayDateString,
  tomorrow,
  tomorrowDateString,
};
