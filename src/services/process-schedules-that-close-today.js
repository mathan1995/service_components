const ScheduleRepository = require('Repositories/schedule-repository');
const { broadcastToUdifyIfAffectedDateIsToday } = require('Services/update-udify-course-status');
const { dateAsString, today } = require('Utils/date');

/**
 * Handle schedules that close today.
 */
const processScheduleThatCloseToday = async () => {
  const todayDateString = dateAsString(today());

  const scheduleRepository = new ScheduleRepository({
    scope: ['notExpired'],
  });
  const { data } = await scheduleRepository.findAllByClosingDate(todayDateString);

  if (data.length > 0) {
    try {
      await broadcastToUdifyIfAffectedDateIsToday(todayDateString, data, true);
      console.info('Course close message sent to SQS');
    } catch (error) {
      console.error('Error sending course close message to SQS', error);
    }
  } else {
    console.info('There are no schedules that close today');
  }

  return { data };
};

module.exports = {
  processScheduleThatCloseToday,
};
