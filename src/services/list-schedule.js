const ScheduleRepository = require('Repositories/schedule-repository');
const validation = require('Utils/validator');
const config = require('Config/app');

/**
 * Validate the payload for course level control schedule.
 *
 * @param {Object} payload - The payload for course level control schedule.
 * @param {string} payload.userId - The ID of the user that want to create the schedule.
 * @param {string} payload.courseId - The ID of the course.
 */
const validateCourseLevelSchedule = ({ userId, courseId }) => {
  const payload = {
    userId,
    courseId,
  };

  const rules = {
    userId: 'required|integer',
    courseId: 'required|integer',
  };

  validation(payload, rules);
};

/**
 * List course level control schedule.
 *
 * @param {string} payload.userId - The ID of the user that want to create the schedule.
 * @param {string} payload.courseId - The ID of the course.
 */
const listSchedule = async (payload) => {
  validateCourseLevelSchedule(payload);

  const scope = [];
  if (!config.featureFlags.courseLevelControl) {
    scope.push('notCourseLevel');
  }
  if (!config.featureFlags.intakeLevelControl) {
    scope.push('notIntakeLevel');
  }

  const scheduleRepository = new ScheduleRepository({
    scope,
  });

  const schedules = await scheduleRepository.findAllByCourseId(
    payload.courseId,
    payload.paginate,
    payload.sort
  );

  return schedules;
};

module.exports = {
  listSchedule,
  validateCourseLevelSchedule,
};
