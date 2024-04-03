const { SQSClient } = require('@aws-sdk/client-sqs');
const { mockClient } = require('aws-sdk-client-mock');
const { sequelize, Schedule } = require('Database/models');
const {
  createIntakeLevelSchedule,
  validateCourseLevelSchedule,
  isScheduleOverlapped,
} = require('Services/create-intake-schedule');
const { dateAsString, durationInMillisecond } = require('Utils/date');
const ValidationError = require('Errors/ValidationError');
const { validations } = require('Config/messages');
const { factory } = require('Database/factories/ScheduleFactory');
const { faker } = require('@faker-js/faker');
const { yesterdayDateString, todayDateString, tomorrowDateString } = require('../fixtures/date');
const { mockUdifyGenerateToken, mockUdifyUpdateStatus, nock } = require('../mocks/axios');

// Mocking SQS client for unit test
mockClient(SQSClient);

const validScheduleInput = {
  userId: 1,
  institutionId: 1,
  courseId: 1,
  intakeId: 1,
  closingDate: todayDateString,
  nextOpenDate: tomorrowDateString,
};

const validScheduleInputWithoutNexTOpeningDate = {
  userId: 1,
  institutionId: 1,
  courseId: 1,
  intakeId: 1,
  closingDate: todayDateString,
};

describe('Services/create-intake-schedule', () => {
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

      await expect(() => createIntakeLevelSchedule(input)).rejects.toThrow(ValidationError);
    });

    test('should create schedule if payload is valid', async () => {
      const { id } = await createIntakeLevelSchedule(validScheduleInput);
      const record = await Schedule.findByPk(id);
      expect(record.dataValues).toMatchObject(validScheduleInput);
    });

    test('should create schedule if payload is valid without next opening date', async () => {
      const { id } = await createIntakeLevelSchedule(validScheduleInputWithoutNexTOpeningDate);
      const record = await Schedule.findByPk(id);
      expect(record.dataValues).toMatchObject(validScheduleInputWithoutNexTOpeningDate);
    });

    test('should create schedule with valid date format', async () => {
      const closingDateFormat = new Date(todayDateString).toString();
      const nextOpenDateFormat = new Date(tomorrowDateString).toString();

      const input = {
        ...validScheduleInput,
        closingDate: closingDateFormat,
        nextOpenDate: nextOpenDateFormat,
      };

      const { id } = await createIntakeLevelSchedule(input);
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
        intakeId: 1,
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
        closingDate: notOverlappedClosingDate,
        nextOpenDate: notOverlappedNextOpenDate,
      };
      await expect(() => isScheduleOverlapped(input)).resolves;
    });

    test('should create schedule if payload is valid without next open date', async () => {
      const input = {
        ...validScheduleInputWithoutNexTOpeningDate,
        closingDate: notOverlappedClosingDate,
      };
      await expect(() => isScheduleOverlapped(input)).resolves;
    });

    test('should throw error if when payload has overlapped closing date without next open date', async () => {
      const input = {
        ...validScheduleInputWithoutNexTOpeningDate,
        closingDate: overlappedClosingDate,
      };

      await expect(() => isScheduleOverlapped(input)).rejects.toThrow(ValidationError);
    });
  });

  describe('Resolve Schedule Overlapped with Hardcoded Scenario', () => {
    beforeAll(async () => {
      await sequelize.sync();

      await factory({
        id: 1,
        courseId: 1,
        intakeId: 1,
        closingDate: '2024-01-01',
        nextOpenDate: null,
        cancelledDate: null,
      });

      await factory({
        id: 2,
        courseId: 1,
        intakeId: 1,
        closingDate: '2023-02-01',
        nextOpenDate: '2023-02-28',
        cancelledDate: null,
      });
    });

    afterAll(async () => {
      await sequelize.drop();
    });

    test('Scenario 1', async () => {
      const input = {
        ...validScheduleInput,
        closingDate: '2025-01-01',
        nextOpenDate: null,
      };

      await expect(() => isScheduleOverlapped(input)).rejects.toThrow(ValidationError);
      await expect(() => isScheduleOverlapped(input)).rejects.toThrow(
        'These dates conflict with an already scheduled closure'
      );
    });

    test('Scenario 2', async () => {
      const input = {
        ...validScheduleInput,
        closingDate: '2023-01-01',
        nextOpenDate: null,
      };

      await expect(() => isScheduleOverlapped(input)).rejects.toThrow(ValidationError);
      await expect(() => isScheduleOverlapped(input)).rejects.toThrow(
        'These dates conflict with an already scheduled closure'
      );
    });

    test('Scenario 3', async () => {
      const input = {
        ...validScheduleInput,
        closingDate: '2024-02-01',
        nextOpenDate: '2024-01-28',
      };

      await expect(() => isScheduleOverlapped(input)).rejects.toThrow(ValidationError);
      await expect(() => isScheduleOverlapped(input)).rejects.toThrow(
        'These dates conflict with an already scheduled closure'
      );
    });

    test('scenario 4', async () => {
      const input = {
        ...validScheduleInput,
        closingDate: '2023-01-01',
        nextOpenDate: '2023-01-28',
      };

      await expect(isScheduleOverlapped(input)).resolves.toBeUndefined();
    });

    test('Scenario 5', async () => {
      const input = {
        ...validScheduleInput,
        closingDate: '2023-02-02',
        nextOpenDate: '2023-02-10',
      };

      await expect(() => isScheduleOverlapped(input)).rejects.toThrow(ValidationError);
      await expect(() => isScheduleOverlapped(input)).rejects.toThrow(
        'These dates conflict with an already scheduled closure'
      );
    });

    test('Scenario 6', async () => {
      const input = {
        ...validScheduleInput,
        closingDate: '2023-01-01',
        nextOpenDate: '2023-02-10',
      };

      await expect(() => isScheduleOverlapped(input)).rejects.toThrow(ValidationError);
      await expect(() => isScheduleOverlapped(input)).rejects.toThrow(
        'These dates conflict with an already scheduled closure'
      );
    });

    test('Scenario 7', async () => {
      const input = {
        ...validScheduleInput,
        closingDate: '2023-02-10',
        nextOpenDate: '2023-03-10',
      };

      await expect(() => isScheduleOverlapped(input)).rejects.toThrow(ValidationError);
      await expect(() => isScheduleOverlapped(input)).rejects.toThrow(
        'These dates conflict with an already scheduled closure'
      );
    });

    test('Scenario 8', async () => {
      const input = {
        ...validScheduleInput,
        closingDate: '2023-01-10',
        nextOpenDate: '2023-03-10',
      };

      await expect(() => isScheduleOverlapped(input)).rejects.toThrow(ValidationError);
      await expect(() => isScheduleOverlapped(input)).rejects.toThrow(
        'These dates conflict with an already scheduled closure'
      );
    });

    test('scenario 9', async () => {
      const input = {
        ...validScheduleInput,
        closingDate: '2023-04-01',
        nextOpenDate: '2023-04-30',
      };
      await expect(isScheduleOverlapped(input)).resolves.toBeUndefined();
    });

    test('scenario 10', async () => {
      const input = {
        ...validScheduleInput,
        closingDate: '2023-01-01',
        nextOpenDate: '2023-01-31',
      };
      await expect(isScheduleOverlapped(input)).resolves.toBeUndefined();
    });

    test('scenario 11', async () => {
      const input = {
        ...validScheduleInput,
        closingDate: '2023-03-01',
        nextOpenDate: '2023-03-31',
      };
      await expect(isScheduleOverlapped(input)).resolves.toBeUndefined();
    });

    // additional validation

    test('scenario 12', async () => {
      const input = {
        ...validScheduleInput,
        closingDate: '2023-01-01',
        nextOpenDate: '2023-02-01',
      };

      await expect(isScheduleOverlapped(input)).resolves.toBeUndefined();
    });

    test('scenario 13', async () => {
      const input = {
        ...validScheduleInput,
        closingDate: '2023-02-28',
        nextOpenDate: '2023-03-01',
      };

      await expect(isScheduleOverlapped(input)).resolves.toBeUndefined();
    });

    test('should return error when closing date is not provided and when it is required', async () => {
      const input = {
        ...validScheduleInput,
        closingDate: null,
        nextOpenDate: tomorrowDateString,
      };

      await expect(() => createIntakeLevelSchedule(input)).rejects.toThrow(ValidationError);
      await expect(() => createIntakeLevelSchedule(input)).rejects.toThrow(
        validations.closingDate.required
      );
    });
  });
});
