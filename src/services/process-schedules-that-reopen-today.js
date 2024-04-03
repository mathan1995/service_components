const ScheduleRepository = require('Repositories/schedule-repository');
const { broadcastToUdifyIfAffectedDateIsToday } = require('Services/update-udify-course-status');
const { dateAsString, today } = require('Utils/date');

/**
 * Handle schedules that reopen today.
 */
const processScheduleThatReopenToday = async () => {
  const todayDateString = dateAsString(today());

  const scheduleRepository = new ScheduleRepository({
    scope: ['notCancelled'],
  });
  const { data } = await scheduleRepository.findAllByNextOpenDate(todayDateString);

  if (data.length > 0) {
    try {
      await broadcastToUdifyIfAffectedDateIsToday(todayDateString, data, false);
      console.info('Course close message sent to SQS');
    } catch (error) {
      console.error('Error sending course close message to SQS', error);
    }
  } else {
    console.info('There are no schedules that reopen today');
  }

  return { data };
};

module.exports = {
  processScheduleThatReopenToday,
};