const ValidationError = require('Errors/ValidationError');
const ScheduleRepository = require('Repositories/schedule-repository');
const { today: todayFn } = require('Utils/date');
const validation = require('Utils/validator');
const { broadcastToUdifyIfAffectedDateIsToday } = require('Services/update-udify-course-status');
const config = require('Config/app');
const { errors } = require('Config/messages');

const scheduleRepository = new ScheduleRepository();

const validateCancelSchedule = async ({ userId, scheduleId }) => {
  const payload = {
    userId,
    scheduleId,
  };

  const rules = {
    userId: 'required|integer',
    scheduleId: 'required|integer',
  };

  validation(payload, rules);

  const schedule = await scheduleRepository.getScheduleById(scheduleId);

  if (!schedule) {
    throw new ValidationError('Schedule not found');
  }

  if (!schedule.intakeId && !config.featureFlags.courseLevelControl) {
    throw new ValidationError(errors.courseLevel.disabledErrorMessage);
  }

  if (schedule.intakeId && !config.featureFlags.intakeLevelControl) {
    throw new ValidationError(errors.intakeLevel.disabledErrorMessage);
  }

  if (schedule.cancelledDate) {
    throw new ValidationError('This course is currently accepting applications');
  }

  const today = todayFn();
  const nextOpenDate = schedule.nextOpenDate ? new Date(schedule.nextOpenDate) : null;

  if (nextOpenDate && nextOpenDate <= today) {
    throw new ValidationError('This course is currently accepting applications');
  }
};
const cancelSchedule = async (payload) => {
  const { scheduleId } = payload;

  await validateCancelSchedule(payload);

  const schedule = await scheduleRepository.cancelSchedule(scheduleId);

  // Send a message to the queue to update the status of the schedule
  try {
    await broadcastToUdifyIfAffectedDateIsToday(schedule.cancelledDate, [schedule], false);
    console.info(`Course close cancelled message sent to SQS scheduleID: ${schedule.id}`);
  } catch (error) {
    console.error(
      `Error sending course close cancelled message to SQS scheduleID: ${schedule.id}`,
      error
    );
  }

  return schedule;
};

module.exports = {
  cancelSchedule,
};
