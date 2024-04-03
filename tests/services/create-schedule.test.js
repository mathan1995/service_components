const { SQSClient } = require('@aws-sdk/client-sqs');
const { mockClient } = require('aws-sdk-client-mock');
const { sequelize, Schedule } = require('Database/models');
const {
  createSchedule,
  validateCourseLevelSchedule,
  isScheduleOverlapped,
} = require('Services/create-schedule');
const ValidationError = require('Errors/ValidationError');
const { validations } = require('Config/messages');
const { factory } = require('Database/factories/ScheduleFactory');
const { dateAsString, durationInMillisecond } = require('Utils/date');
const { faker } = require('@faker-js/faker');
const { yesterdayDateString, todayDateString, tomorrowDateString } = require('../fixtures/date');
const { mockUdifyGenerateToken, mockUdifyUpdateStatus, nock } = require('../mocks/axios');

// Mocking SQS client for unit test
mockClient(SQSClient);

const validScheduleInput = {
  userId: 1,
  institutionId: 1,
  courseId: 1,
  closingDate: todayDateString,
  nextOpenDate: tomorrowDateString,
};

describe('Services/create-schedule', () => {
  beforeEach(() => {
    mockUdifyGenerateToken();
    mockUdifyUpdateStatus();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('validateCourseLevelSchedule()', () => {
    test('should throw error if institution ID is invalid', () => {
      const { institutionId, ...noInstitutionId } = validScheduleInput;

      expect(() => validateCourseLevelSchedule(noInstitutionId)).toThrow(ValidationError);
    });

    test('should throw error if course ID is invalid', () => {
      const { courseId, ...noCourseId } = validScheduleInput;

      expect(() => validateCourseLevelSchedule(noCourseId)).toThrow(ValidationError);
    });

    test('should throw error if closing date is yesterday', () => {
      const input = {
        ...validScheduleInput,
        closingDate: yesterdayDateString,
      };

      expect(() => validateCourseLevelSchedule(input)).toThrow(ValidationError);
    });

    test('should throw error if next open date is before closing date', () => {
      const input = {
        ...validScheduleInput,
        closingDate: tomorrowDateString,
        nextOpenDate: todayDateString,
      };

      expect(() => validateCourseLevelSchedule(input)).toThrow(ValidationError);
    });

    test('should throw error if next open date is on closing date', () => {
      const input = {
        ...validScheduleInput,
        closingDate: todayDateString,
        nextOpenDate: todayDateString,
      };

      expect(() => validateCourseLevelSchedule(input)).toThrow(ValidationError);
    });

    test('should not throw error if inputs are valid', () => {
      expect(() => validateCourseLevelSchedule(validScheduleInput)).not.toThrow(ValidationError);
    });
  });

  describe('createSchedule()', () => {
    beforeAll(async () => {
      await sequelize.sync();
    });

    afterAll(async () => {
      await sequelize.drop();
    });

    afterEach(async () => {
      await Schedule.destroy({ truncate: true });
    });

    test('should throw error if payload is invalid', async () => {
      const input = {
        ...validScheduleInput,
        closingDate: yesterdayDateString,
      };

      await expect(() => createSchedule(input)).rejects.toThrow(ValidationError);
    });

    test('should create schedule if payload is valid', async () => {
      const { id } = await createSchedule(validScheduleInput);
      const record = await Schedule.findByPk(id);
      expect(record.dataValues).toMatchObject(validScheduleInput);
    });

    test('should create schedule with valid date format', async () => {
      const closingDateFormat = new Date(todayDateString).toString();
      const nextOpenDateFormat = new Date(tomorrowDateString).toString();

      const input = {
        ...validScheduleInput,
        closingDate: closingDateFormat,
        nextOpenDate: nextOpenDateFormat,
      };

      const { id } = await createSchedule(input);
      const record = await Schedule.findByPk(id);

      expect(record.dataValues).not.toMatchObject(input);

      expect(record.dataValues).toMatchObject(validScheduleInput);
    });
  });

  describe('isScheduleOverlapped()', () => {
    const nextMonth = new Date(Date.now() + durationInMillisecond({ days: 30 }));
    const closingDate = dateAsString(nextMonth);
    const nextOpenDate = dateAsString(
      new Date(Date.parse(closingDate) + durationInMillisecond({ days: 10 }))
    );

    const overlappedClosingDate = dateAsString(
      new Date(Date.parse(closingDate) + durationInMillisecond({ days: 1 }))
    );

    const overlappedNextOpenDate = dateAsString(
      new Date(Date.parse(nextOpenDate) - durationInMillisecond({ days: 1 }))
    );

    const notOverlappedClosingDate = dateAsString(
      new Date(Date.parse(nextOpenDate) + durationInMillisecond({ days: 0 }))
    );

    const notOverlappedNextOpenDate = dateAsString(
      new Date(Date.parse(notOverlappedClosingDate) - durationInMillisecond({ days: 1 }))
    );

    beforeAll(async () => {
      await sequelize.sync();

      await factory({
        id: 1,
        courseId: 1,
        closingDate,
        nextOpenDate,
        cancelledDate: null,
      });
    });

    afterAll(async () => {
      await sequelize.drop();
    });

    test('should throw error if closing date is overlapped', async () => {
      const input = {
        ...validScheduleInput,
        courseId: 1,
        closingDate: overlappedClosingDate,
        nextOpenDate: faker.date.future(10, overlappedClosingDate).toISOString().split('T')[0],
      };

      await expect(() => isScheduleOverlapped(input)).rejects.toThrow(ValidationError);
      await expect(() => isScheduleOverlapped(input)).rejects.toThrow(
        'These dates conflict with an already scheduled closure'
      );
    });

    test('should throw error if next open date is overlapped', async () => {
      const input = {
        ...validScheduleInput,
        courseId: 1,
        closingDate: faker.date.past(0, overlappedNextOpenDate).toISOString().split('T')[0],
        nextOpenDate: overlappedNextOpenDate,
      };

      await expect(() => isScheduleOverlapped(input)).rejects.toThrow(ValidationError);
      await expect(() => isScheduleOverlapped(input)).rejects.toThrow(
        'These dates conflict with an already scheduled closure'
      );
    });

    test('should create schedule if payload is valid', async () => {
      const input = {
        ...validScheduleInput,
        courseId: 1,
        closingDate: notOverlappedClosingDate,
        nextOpenDate: notOverlappedNextOpenDate,
      };
      await expect(() => isScheduleOverlapped(input)).resolves;
    });

    test('should return error when closing date is not provided and it is required', async () => {
      const input = {
        ...validScheduleInput,
        courseId: 1,
        closingDate: null,
        nextOpenDate: tomorrowDateString,
      };

      await expect(() => createSchedule(input)).rejects.toThrow(ValidationError);
      await expect(() => createSchedule(input)).rejects.toThrow(validations.closingDate.required);
    });

    test('should return error when next open date is not provided and it is required', async () => {
      const input = {
        ...validScheduleInput,
        courseId: 1,
        closingDate: todayDateString,
        nextOpenDate: null,
      };

      await expect(() => createSchedule(input)).rejects.toThrow(ValidationError);
      await expect(() => createSchedule(input)).rejects.toThrow(validations.nextOpenDate.required);
    });
  });
});
