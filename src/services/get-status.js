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
    courseId: 'required|array',
  };

  validation(payload, rules);
};

// Dataloader function return all schedules by course ids
const getSchedulesByCourseIds = async (courseIds) => {
  const scope = [];
  if (!config.featureFlags.courseLevelControl) {
    scope.push('notCourseLevel');
  }
  if (!config.featureFlags.intakeLevelControl) {
    scope.push('notIntakeLevel');
  }

  const scheduleRepository = new ScheduleRepository({ scope });
  const { data } = await scheduleRepository.findAllActiveByCourseIds(courseIds);

  // Map schedules by course ID to schedules
  return courseIds.map((courseId) => data.filter((schedule) => schedule.courseId === courseId));
};

/**
 * List course level control schedule.
 *
 * @param {string} payload.userId - The ID of the user that want to create the schedule.
 * @param {string} payload.courseId - The ID of the course.
 */
const getStatus = async (payload, dataloader) => {
  const courseIds = payload.courseId;
  const getStatusDataLoader = dataloader.getStatusLoader;

  validateCourseLevelSchedule(payload);

  const controlStatus = [];

  await Promise.all(
    courseIds.map(async (courseId) => {
      // Loads course ids to the dataloader
      const schedulesForCourseId = await getStatusDataLoader.load(courseId);

      // Course Level Schedules
      const courseLevelSchedules =
        schedulesForCourseId.find((schedule) => schedule.intakeId == null) ?? null;

      // Intake Level Schedules
      const intakeLevelSchedules = schedulesForCourseId.filter(
        (schedule) => schedule.intakeId != null
      );

      const intakes = [];
      intakeLevelSchedules.forEach((intakeSchedule) => {
        intakes.push({
          intakeId: intakeSchedule.intakeId,
          closed: !!intakeSchedule,
          currentSchedule: intakeSchedule,
        });
      });

      controlStatus.push({
        courseId,
        courseLevel: {
          closed: !!courseLevelSchedules,
          currentSchedule: courseLevelSchedules,
        },
        intakeLevels: intakes,
      });
    })
  );

  return controlStatus;
};

module.exports = {
  getStatus,
  validateCourseLevelSchedule,
  getSchedulesByCourseIds,
};
