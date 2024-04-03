const { sequelize, Schedule } = require('Database/models');
const { listSchedule, validateCourseLevelSchedule } = require('Services/list-schedule');
const ValidationError = require('Errors/ValidationError');
const { factory } = require('Database/factories/ScheduleFactory');
const { todayDateString, tomorrowDateString } = require('../fixtures/date');

const validScheduleInput = {
  userId: 1,
  courseId: 1,
};

describe('Services/list-schedule', () => {
  describe('validateCourseLevelSchedule()', () => {
    test('should throw error if course ID is invalid', () => {
      const { courseId } = validScheduleInput;

      expect(() => validateCourseLevelSchedule(courseId)).toThrow(ValidationError);
    });

    test('should not throw error if inputs are valid', () => {
      expect(() => validateCourseLevelSchedule(validScheduleInput)).not.toThrow(ValidationError);
    });
  });

  describe('listSchedule()', () => {
    beforeAll(async () => {
      await sequelize.sync();
    });

    afterAll(async () => {
      await sequelize.drop();
    });

    afterEach(async () => {
      await Schedule.destroy({ truncate: true });
    });

    test('should list schedule if payload is valid', async () => {
      const schedule = await factory({
        courseId: 1,
        institutionId: 1,
        closingDate: todayDateString,
        nextOpenDate: tomorrowDateString,
      });
      const { data, total } = await listSchedule(validScheduleInput);

      // Result length should match 1
      expect(data.length).toBe(1);

      // Result total should match 1
      expect(total).toBe(1);

      // Result contain the above seeded data.
      expect(data).toEqual(expect.arrayContaining([expect.objectContaining(schedule.dataValues)]));
    });
  });
});
