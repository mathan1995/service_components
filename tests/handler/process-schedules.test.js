const { SQSClient } = require('@aws-sdk/client-sqs');
const { mockClient } = require('aws-sdk-client-mock');
const { factory: scheduleFactory } = require('Database/factories/ScheduleFactory');
const { sequelize } = require('Database/models');
const LambdaTester = require('lambda-tester');
const { closeTodayHandler, reopenTodayHandler } = require('Handler/process-schedules');
const { yesterdayDateString, todayDateString } = require('../fixtures/date');

// Mocking SQS client for unit test
const sqsMock = mockClient(SQSClient);

const extractData = (schedule) => {
  const { updatedAt: _, createdAt: __, ...rest } = schedule.dataValues;

  return rest;
};

describe('Handler/process-schedules', () => {
  let closeTodaySchedule1;
  let closeTodaySchedule2;
  let closeTodayIntakeSchedule1;
  let closeTodayIntakeSchedule2;
  let reopenTodaySchedule1;
  let reopenTodaySchedule2;
  let reopenTodayIntakeSchedule1;
  let reopenTodayIntakeSchedule2;
  let cancelledTodaySchedule1;
  let cancelledTodaySchedule2;
  let cancelledTodayIntakeSchedule1;
  let cancelledTodayIntakeSchedule2;

  beforeAll(async () => {
    await sequelize.sync();

    // Common schedules for tests
    closeTodaySchedule1 = await scheduleFactory({
      closingDate: todayDateString,
      nextOpenDate: null,
      cancelledDate: null,
    });
    closeTodaySchedule2 = await scheduleFactory({
      closingDate: todayDateString,
      nextOpenDate: null,
      cancelledDate: null,
    });

    closeTodayIntakeSchedule1 = await scheduleFactory({
      intakeId: 11,
      closingDate: todayDateString,
      nextOpenDate: null,
      cancelledDate: null,
    });
    closeTodayIntakeSchedule2 = await scheduleFactory({
      intakeId: 12,
      closingDate: todayDateString,
      nextOpenDate: null,
      cancelledDate: null,
    });

    reopenTodaySchedule1 = await scheduleFactory({
      closingDate: yesterdayDateString,
      nextOpenDate: todayDateString,
      cancelledDate: null,
    });
    reopenTodaySchedule2 = await scheduleFactory({
      closingDate: yesterdayDateString,
      nextOpenDate: todayDateString,
      cancelledDate: null,
    });

    reopenTodayIntakeSchedule1 = await scheduleFactory({
      intakeId: 21,
      closingDate: yesterdayDateString,
      nextOpenDate: todayDateString,
      cancelledDate: null,
    });
    reopenTodayIntakeSchedule2 = await scheduleFactory({
      intakeId: 22,
      closingDate: yesterdayDateString,
      nextOpenDate: todayDateString,
      cancelledDate: null,
    });

    cancelledTodaySchedule1 = await scheduleFactory({
      closingDate: yesterdayDateString,
      cancelledDate: todayDateString,
    });
    cancelledTodaySchedule2 = await scheduleFactory({
      closingDate: yesterdayDateString,
      cancelledDate: todayDateString,
    });

    cancelledTodayIntakeSchedule1 = await scheduleFactory({
      intakeId: 31,
      closingDate: yesterdayDateString,
      cancelledDate: todayDateString,
    });
    cancelledTodayIntakeSchedule2 = await scheduleFactory({
      intakeId: 32,
      closingDate: yesterdayDateString,
      cancelledDate: todayDateString,
    });
  });

  afterAll(async () => {
    await sequelize.drop();
  });

  afterEach(() => {
    sqsMock.reset();
  });

  describe('closeTodayHandler()', () => {
    test('should return schedules that close today', async () => {
      const { data } = await LambdaTester(closeTodayHandler).event().expectResult();

      // Results contain today's schedules
      expect(data.map((item) => item.dataValues)).toEqual(
        expect.arrayContaining([
          expect.objectContaining(closeTodaySchedule1.dataValues),
          expect.objectContaining(closeTodaySchedule2.dataValues),
          expect.objectContaining(closeTodayIntakeSchedule1.dataValues),
          expect.objectContaining(closeTodayIntakeSchedule2.dataValues),
        ])
      );
      // Results do not contain other schedules
      const shouldNotAppear = [
        reopenTodaySchedule1,
        reopenTodaySchedule2,
        reopenTodayIntakeSchedule1,
        reopenTodayIntakeSchedule2,
        cancelledTodaySchedule1,
        cancelledTodaySchedule2,
        cancelledTodayIntakeSchedule1,
        cancelledTodayIntakeSchedule2,
      ];
      shouldNotAppear.forEach((schedule) => {
        expect(data.map((item) => item.dataValues)).not.toEqual(
          expect.arrayContaining([expect.objectContaining(schedule.dataValues)])
        );
      });

      const sqsCommand = sqsMock.call(0);
      const sqsInput = JSON.parse(sqsCommand?.firstArg?.input?.MessageBody);
      expect(sqsInput.bodyValue.schedules).toEqual(
        expect.arrayContaining([
          expect.objectContaining(extractData(closeTodaySchedule1)),
          expect.objectContaining(extractData(closeTodaySchedule2)),
          expect.objectContaining(extractData(closeTodayIntakeSchedule1)),
          expect.objectContaining(extractData(closeTodayIntakeSchedule2)),
        ])
      );
    });
  });

  describe('reopenTodayHandler()', () => {
    test('should return schedules that reopen today', async () => {
      const { data } = await LambdaTester(reopenTodayHandler).event().expectResult();

      // Results contain today's schedules
      expect(data.map((item) => item.dataValues)).toEqual(
        expect.arrayContaining([
          expect.objectContaining(reopenTodaySchedule1.dataValues),
          expect.objectContaining(reopenTodaySchedule2.dataValues),
          expect.objectContaining(reopenTodayIntakeSchedule1.dataValues),
          expect.objectContaining(reopenTodayIntakeSchedule2.dataValues),
        ])
      );
      // Results do not contain other schedules
      const shouldNotAppear = [
        closeTodaySchedule1,
        closeTodaySchedule2,
        closeTodayIntakeSchedule1,
        closeTodayIntakeSchedule2,
        cancelledTodaySchedule1,
        cancelledTodaySchedule2,
        cancelledTodayIntakeSchedule1,
        cancelledTodayIntakeSchedule2,
      ];
      shouldNotAppear.forEach((schedule) => {
        expect(data.map((item) => item.dataValues)).not.toEqual(
          expect.arrayContaining([expect.objectContaining(schedule.dataValues)])
        );
      });

      const sqsCommand = sqsMock.call(0);
      const sqsInput = JSON.parse(sqsCommand?.firstArg?.input?.MessageBody);
      expect(sqsInput.bodyValue.schedules).toEqual(
        expect.arrayContaining([
          expect.objectContaining(extractData(reopenTodaySchedule1)),
          expect.objectContaining(extractData(reopenTodaySchedule2)),
          expect.objectContaining(extractData(reopenTodayIntakeSchedule1)),
          expect.objectContaining(extractData(reopenTodayIntakeSchedule2)),
        ])
      );
    });
  });
});
