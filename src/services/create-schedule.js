const ValidationError = require('Errors/ValidationError');
const ScheduleRepository = require('Repositories/schedule-repository');
const { dateAsString, today } = require('Utils/date');
const validation = require('Utils/validator');
const { broadcastToUdifyIfAffectedDateIsToday } = require('Services/update-udify-course-status');
const config = require('Config/app');
const { errors, validations } = require('Config/messages');

/**
 * Validate the payload for course level control schedule.
 *
 * @param {Object} payload - The payload for course level control schedule.
 * @param {string} payload.userId - The ID of the user that want to create the schedule.
 * @param {string} payload.institutionId - The ID of the institution.
 * @param {string} payload.courseId - The ID of the course.
 * @param {string} payload.closingDate - The closing date when the course should be closed.
 * @param {string} payload.nextOpenDate - The next open date when the course should be re-open.
 */
const validateCourseLevelSchedule = ({
  userId,
  institutionId,
  courseId,
  closingDate,
  nextOpenDate,
}) => {
  const todayDateString = dateAsString(today());

  const request = {
    userId,
    institutionId,
    courseId,
    closingDate,
    nextOpenDate,
  };

  const rules = {
    userId: 'required|integer',
    institutionId: 'required|integer',
    courseId: 'required|integer',
    closingDate: `required|date|date_after_or_on:${todayDateString}`,
    nextOpenDate: `required|date|date_after:${closingDate}`,
  };

  const messages = {
    'required.closingDate': validations.closingDate.required,
    'date.closingDate': validations.closingDate.date,
    'date_after_or_on.closingDate': validations.closingDate.date_after_or_on,
    'required.nextOpenDate': validations.nextOpenDate.required,
    'date.nextOpenDate': validations.nextOpenDate.date,
    'date_after.nextOpenDate': validations.nextOpenDate.date_after,
  };

  validation(request, rules, messages);
};

const isScheduleOverlapped = async ({ courseId, closingDate, nextOpenDate }) => {
  const scheduleRepository = new ScheduleRepository();

  const scheduleList = await scheduleRepository.getOverlapsByCourseId(
    courseId,
    closingDate,
    nextOpenDate
  );

  if (scheduleList && scheduleList.length > 0) {
    throw new ValidationError('These dates conflict with an already scheduled closure');
  }
};

/**
 * Create a course level control schedule.
 *
 * @param {Object} payload - The payload for course level control schedule.
 * @param {string} payload.userId - The ID of the user that want to create the schedule.
 * @param {string} payload.institutionId - The ID of the institution.
 * @param {string} payload.courseId - The ID of the course.
 * @param {string} payload.closingDate - The closing date when the course should be closed.
 * @param {string} payload.nextOpenDate - The next open date when the course should be re-open.
 */
const createSchedule = async (payload) => {
  if (!config.featureFlags.courseLevelControl) {
    throw new ValidationError(errors.courseLevel.disabledErrorMessage);
  }

  const newPayload = { ...payload };
  newPayload.closingDate = payload.closingDate ? dateAsString(new Date(payload.closingDate)) : null;
  newPayload.nextOpenDate = payload.nextOpenDate
    ? dateAsString(new Date(payload.nextOpenDate))
    : null;

  validateCourseLevelSchedule(newPayload);

  // check if the schedule overlaps with any other schedule
  await isScheduleOverlapped(newPayload);

  const scheduleRepository = new ScheduleRepository();
  const schedule = await scheduleRepository.create(newPayload);

  // send course close message to SQS if only closing date is today
  try {
    await broadcastToUdifyIfAffectedDateIsToday(schedule.closingDate, [schedule], true);
    console.info(`Course close message sent to SQS scheduleID: ${schedule.id}`);
  } catch (error) {
    console.error(`Error sending course close message to SQS scheduleID: ${schedule.id}`, error);
  }

  return schedule;
};

module.exports = {
  createSchedule,
  validateCourseLevelSchedule,
  isScheduleOverlapped,
};
