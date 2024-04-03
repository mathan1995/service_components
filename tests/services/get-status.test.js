const Dataloader = require('dataloader');
const { sequelize, Schedule } = require('Database/models');
const { getStatus, validateCourseLevelSchedule } = require('Services/get-status');
const ValidationError = require('Errors/ValidationError');
const { factory } = require('Database/factories/ScheduleFactory');
const { getSchedulesByCourseIds } = require('Services/get-status');
const { todayDateString, tomorrowDateString, yesterdayDateString } = require('../fixtures/date');

const validScheduleInput = {
  userId: 1,
  courseId: [1, 2],
};

const dataloader = {
  getStatusLoader: new Dataloader(getSchedulesByCourseIds),
};

describe('Services/course-status', () => {
  describe('validateCourseLevelSchedule()', () => {
    test('should throw error if course ID is invalid', () => {
      const { courseId } = validScheduleInput;

      expect(() => validateCourseLevelSchedule(courseId)).toThrow(ValidationError);
    });

    test('should not throw error if inputs are valid', () => {
      expect(() => validateCourseLevelSchedule(validScheduleInput)).not.toThrow(ValidationError);
    });
  });

  describe('courseStatus()', () => {
    beforeAll(async () => {
      await sequelize.sync();
    });

    afterAll(async () => {
      await sequelize.drop();
    });

    afterEach(async () => {
      await Schedule.destroy({ truncate: true });

      // Clear All Dataloader Cache
      await dataloader.getStatusLoader.clearAll();
    });

    test('should return course level true if there is active schedule', async () => {
      const courseSchedule1 = await factory({
        courseId: 1,
        closingDate: todayDateString,
        nextOpenDate: tomorrowDateString,
        cancelledDate: null,
      });

      const courseSchedule2 = await factory({
        courseId: 2,
        closingDate: yesterdayDateString,
        nextOpenDate: todayDateString,
        cancelledDate: null,
      });

      const data = await getStatus(validScheduleInput, dataloader);

      expect(data).toEqual(
        expect.objectContaining([
          {
            courseId: courseSchedule1.courseId,
            courseLevel: {
              closed: true,
              currentSchedule: expect.objectContaining(courseSchedule1.dataValues),
            },
            intakeLevels: [],
          },
          {
            courseId: courseSchedule2.courseId,
            courseLevel: { closed: false, currentSchedule: null },
            intakeLevels: [],
          },
        ])
      );
    });

    test('should return course level true with intake levels', async () => {
      const courseSchedule1 = await factory({
        courseId: 1,
        closingDate: todayDateString,
        nextOpenDate: tomorrowDateString,
        cancelledDate: null,
      });

      const intakeSchedule1 = await factory({
        courseId: 1,
        intakeId: 2,
        closingDate: yesterdayDateString,
        nextOpenDate: tomorrowDateString,
        cancelledDate: null,
      });

      const courseSchedule2 = await factory({
        courseId: 2,
        closingDate: yesterdayDateString,
        nextOpenDate: tomorrowDateString,
        cancelledDate: null,
      });

      const intakeSchedule2 = await factory({
        courseId: 2,
        intakeId: 3,
        closingDate: todayDateString,
        nextOpenDate: tomorrowDateString,
        cancelledDate: null,
      });

      const data = await getStatus(validScheduleInput, dataloader);

      expect(data).toEqual(
        expect.objectContaining([
          {
            courseId: courseSchedule1.courseId,
            courseLevel: {
              closed: true,
              currentSchedule: expect.objectContaining(courseSchedule1.dataValues),
            },
            intakeLevels: [
              {
                closed: true,
                currentSchedule: expect.objectContaining(intakeSchedule1.dataValues),
                intakeId: intakeSchedule1.intakeId,
              },
            ],
          },
          {
            courseId: courseSchedule2.courseId,
            courseLevel: {
              closed: true,
              currentSchedule: expect.objectContaining(courseSchedule2.dataValues),
            },
            intakeLevels: [
              {
                closed: true,
                currentSchedule: expect.objectContaining(intakeSchedule2.dataValues),
                intakeId: intakeSchedule2.intakeId,
              },
            ],
          },
        ])
      );
    });
  });
});
