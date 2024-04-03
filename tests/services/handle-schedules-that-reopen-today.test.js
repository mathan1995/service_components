const { SQSClient } = require('@aws-sdk/client-sqs');
const { mockClient } = require('aws-sdk-client-mock');
const { sequelize, Schedule } = require('Database/models');
const { factory: scheduleFactory } = require('Database/factories/ScheduleFactory');
const { processScheduleThatReopenToday } = require('Services/process-schedules-that-reopen-today');
const { yesterdayDateString, todayDateString, tomorrowDateString } = require('../fixtures/date');

// Mocking SQS client for unit test
mockClient(SQSClient);

describe('Services/process-schedules-that-reopen-today', () => {
  describe('processScheduleThatReopenToday()', () => {
    beforeAll(async () => {
      await sequelize.sync();
    });

    afterAll(async () => {
      await sequelize.drop();
    });

    afterEach(async () => {
      await Schedule.destroy({ truncate: true });
    });

    test('should return empty if no schedules reopen today', async () => {
      const { data } = await processScheduleThatReopenToday();
      expect(data.length).toBe(0);
    });

    test('should return schedules that reopen today', async () => {
      const schedule = await scheduleFactory({
        closingDate: yesterdayDateString,
        nextOpenDate: todayDateString,
        cancelledDate: null,
      });

      const { data } = await processScheduleThatReopenToday();
      expect(data.length).toBe(1);
      expect(data.map((item) => item.dataValues)).toEqual(
        expect.arrayContaining([expect.objectContaining(schedule.dataValues)])
      );
    });

    test('should not return schedules that reopen today but is cancelled', async () => {
      const todayScheduleActive = await scheduleFactory({
        closingDate: yesterdayDateString,
        nextOpenDate: todayDateString,
        cancelledDate: null,
      });
      const todayScheduleCancelled = await scheduleFactory({
        closingDate: yesterdayDateString,
        nextOpenDate: todayDateString,
        cancelledDate: todayDateString,
      });

      const { data } = await processScheduleThatReopenToday();
      expect(data.length).toBe(1);
      // Results contain active schedules
      expect(data.map((item) => item.dataValues)).toEqual(
        expect.arrayContaining([expect.objectContaining(todayScheduleActive.dataValues)])
      );
      // Results do not cancelled schedules
      expect(data.map((item) => item.dataValues)).not.toEqual(
        expect.arrayContaining([expect.objectContaining(todayScheduleCancelled.dataValues)])
      );
    });

    test('should return schedules that reopen today only', async () => {
      const yesterdaySchedule1 = await scheduleFactory({
        closingDate: yesterdayDateString,
        nextOpenDate: yesterdayDateString,
        cancelledDate: null,
      });

      const todaySchedule1 = await scheduleFactory({
        closingDate: yesterdayDateString,
        nextOpenDate: todayDateString,
        cancelledDate: null,
      });
      const todaySchedule2 = await scheduleFactory({
        closingDate: yesterdayDateString,
        nextOpenDate: todayDateString,
        cancelledDate: null,
      });
      const todaySchedule3 = await scheduleFactory({
        closingDate: todayDateString,
        nextOpenDate: todayDateString,
        cancelledDate: null,
      });

      const tomorrowSchedule1 = await scheduleFactory({
        closingDate: tomorrowDateString,
        nextOpenDate: tomorrowDateString,
        cancelledDate: null,
      });

      const { data } = await processScheduleThatReopenToday();
      expect(data.length).toBe(3);
      // Results contain today's schedules
      expect(data.map((item) => item.dataValues)).toEqual(
        expect.arrayContaining([
          expect.objectContaining(todaySchedule1.dataValues),
          expect.objectContaining(todaySchedule2.dataValues),
          expect.objectContaining(todaySchedule3.dataValues),
        ])
      );
      // Results do not contain other schedules
      const shouldNotAppear = [yesterdaySchedule1, tomorrowSchedule1];
      shouldNotAppear.forEach((schedule) => {
        expect(data.map((item) => item.dataValues)).not.toEqual(
          expect.arrayContaining([expect.objectContaining(schedule.dataValues)])
        );
      });
    });
  });
});
