const { factory: scheduleFactory } = require('Database/factories/ScheduleFactory');
const { sequelize, Schedule } = require('Database/models');
const ScheduleRepository = require('Repositories/schedule-repository');
const { yesterdayDateString, todayDateString, tomorrowDateString } = require('../fixtures/date');

const scheduleData = {
  userId: 1,
  institutionId: 1,
  courseId: 1,
  closingDate: '2022-01-01',
  nextOpenDate: '2022-01-02',
};

const courseId = [1];

describe('Repositories/schedule-repository', () => {
  beforeAll(async () => {
    await sequelize.sync();
  });

  afterAll(async () => {
    await sequelize.drop();
  });

  afterEach(async () => {
    await Schedule.destroy({ truncate: true });
  });

  describe('create()', () => {
    test('should create schedule', async () => {
      const scheduleRepository = new ScheduleRepository();
      const schedule = await scheduleRepository.create(scheduleData);

      const record = await Schedule.findByPk(schedule.id);
      expect(record.dataValues).toMatchObject(scheduleData);
    });

    test('should cancel schedule', async () => {
      const scheduleRepository = new ScheduleRepository();
      const schedule1 = await scheduleRepository.create(scheduleData);
      const schedule = await scheduleRepository.cancelSchedule(schedule1.id);

      const record = await Schedule.findByPk(schedule.id);
      expect(record.cancelledDate).not.toBeNull();
    });
  });

  describe('findAllByCourseId()', () => {
    test('should list schedules by given course ID', async () => {
      const schedule1 = await scheduleFactory({
        courseId: 1,
        institutionId: 1,
        closingDate: todayDateString,
        nextOpenDate: todayDateString,
      });

      const schedule2 = await scheduleFactory({
        courseId: 2,
        institutionId: 1,
        closingDate: yesterdayDateString,
        nextOpenDate: todayDateString,
      });

      const schedule3 = await scheduleFactory({
        courseId: 3,
        institutionId: 1,
        closingDate: tomorrowDateString,
        nextOpenDate: tomorrowDateString,
      });

      const scheduleRepository = new ScheduleRepository();
      const { data } = await scheduleRepository.findAllByCourseId(courseId);

      // Result length should match 1
      expect(data.length).toBe(1);

      // Results contain schedules that match the course ID
      expect(data.map((item) => item.dataValues)).toEqual(
        expect.arrayContaining([expect.objectContaining(schedule1.dataValues)])
      );
      // Results do not contain other schedules
      const shouldNotAppear = [schedule2, schedule3];
      shouldNotAppear.forEach((schedule) => {
        expect(data.map((item) => item.dataValues)).not.toEqual(
          expect.arrayContaining([expect.objectContaining(schedule.dataValues)])
        );
      });
    });

    // TODO: test pagination

    // TODO: test sorting
  });

  describe('findAllByClosingDate()', () => {
    test('should return schedules that match the closing date only', async () => {
      const yesterdaySchedule1 = await scheduleFactory({
        closingDate: yesterdayDateString,
      });

      const todaySchedule1 = await scheduleFactory({
        closingDate: todayDateString,
      });

      const tomorrowSchedule1 = await scheduleFactory({
        closingDate: tomorrowDateString,
      });

      const scheduleRepository = new ScheduleRepository();
      const { data } = await scheduleRepository.findAllByClosingDate(todayDateString);

      expect(data.length).toBe(1);

      // Results contain schedules that match the closing date
      expect(data.map((item) => item.dataValues)).toEqual(
        expect.arrayContaining([expect.objectContaining(todaySchedule1.dataValues)])
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

  describe('findAllByNextOpenDate()', () => {
    test('should return schedules that match the next open date only', async () => {
      const yesterdaySchedule1 = await scheduleFactory({
        closingDate: yesterdayDateString,
        nextOpenDate: yesterdayDateString,
      });

      const todaySchedule1 = await scheduleFactory({
        closingDate: yesterdayDateString,
        nextOpenDate: todayDateString,
      });

      const tomorrowSchedule1 = await scheduleFactory({
        closingDate: yesterdayDateString,
        nextOpenDate: tomorrowDateString,
      });

      const scheduleRepository = new ScheduleRepository();
      const { data } = await scheduleRepository.findAllByNextOpenDate(todayDateString);

      expect(data.length).toBe(1);

      // Results contain schedules that match the next open date
      expect(data.map((item) => item.dataValues)).toEqual(
        expect.arrayContaining([expect.objectContaining(todaySchedule1.dataValues)])
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

  describe('getStatusByCourseId()', () => {
    test('should return course status by given course ID', async () => {
      const activeCourse = await scheduleFactory({
        courseId: 1,
        closingDate: todayDateString,
        nextOpenDate: tomorrowDateString,
        cancelledDate: null,
      });

      const inActiveCourse = await scheduleFactory({
        courseId: 1,
        closingDate: yesterdayDateString,
        nextOpenDate: todayDateString,
        cancelledDate: null,
      });

      const inActiveFutureCourse = await scheduleFactory({
        courseId: 1,
        closingDate: tomorrowDateString,
        cancelledDate: null,
      });

      const activeNoNextOpenDateCourse = await scheduleFactory({
        courseId: 1,
        closingDate: todayDateString,
        nextOpenDate: null,
        cancelledDate: null,
      });

      const activeCanceledCourse = await scheduleFactory({
        courseId: 1,
        closingDate: todayDateString,
        nextOpenDate: tomorrowDateString,
        cancelledDate: todayDateString,
      });

      const scheduleRepository = new ScheduleRepository();
      const { data } = await scheduleRepository.findAllActiveByCourseIds(courseId);

      expect(data.length).toBe(2);

      // Results contain schedules that match the closing date and next open date
      expect(data.map((item) => item.dataValues)).toEqual(
        expect.arrayContaining([expect.objectContaining(activeCourse.dataValues)]),
        expect.arrayContaining([expect.objectContaining(activeNoNextOpenDateCourse.dataValues)])
      );

      // Results do not contain other schedules
      const shouldNotAppear = [inActiveCourse, inActiveFutureCourse, activeCanceledCourse];
      shouldNotAppear.forEach((schedule) => {
        expect(data.map((item) => item.dataValues)).not.toEqual(
          expect.arrayContaining([expect.objectContaining(schedule.dataValues)])
        );
      });
    });
  });
});
