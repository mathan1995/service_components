const { sequelize, Schedule } = require('Database/models');
const lambdaEventMock = require('lambda-event-mock');
const LambdaTester = require('lambda-tester');
const { graphqlHandler } = require('Graphql/graphql');
const { factory } = require('Database/factories/ScheduleFactory');
const config = require('Config/app');
const { accessTokenSub1 } = require('../../fixtures/access-token');
const { todayDateString, tomorrowDateString, yesterdayDateString } = require('../../fixtures/date');

const extractData = (schedule) => ({
  id: schedule.id,
  courseId: schedule.courseId,
  institutionId: schedule.institutionId,
  closingDate: schedule.closingDate,
  nextOpenDate: schedule.nextOpenDate,
});

const courseId = 1;

const validBody = `
query{
  intake_control_listSchedule(
    courseId: ${courseId}, 
  ) {
    data {
      id
      courseId
      intakeId
      institutionId
      closingDate
      nextOpenDate
      userId
    }
    total
    limit
    offset
  }
}
`;

describe('Graphql/modules/list-schedule', () => {
  beforeAll(async () => {
    await sequelize.sync();
  });

  afterAll(async () => {
    await sequelize.drop();
  });

  afterEach(async () => {
    await Schedule.destroy({ truncate: true });
  });

  describe('graphql', () => {
    test('should return error when there is no access token', async () => {
      const event = lambdaEventMock
        .apiGateway()
        .path('/graphql')
        .method('POST')
        .header('Content-Type', 'application/json')
        .body({ query: validBody })
        .build();
      event.multiValueHeaders = {
        'Content-Type': 'application/json',
      };

      const result = await LambdaTester(graphqlHandler).event(event).expectResult();
      expect(result.body).toContain('BAD_USER_INPUT');
    });

    test('should return schedule lists when payload is valid', async () => {
      const schedule1 = await factory({
        courseId: 1,
        institutionId: 1,
        closingDate: todayDateString,
        nextOpenDate: todayDateString,
      });

      const schedule2 = await factory({
        courseId: 1,
        institutionId: 1,
        closingDate: yesterdayDateString,
        nextOpenDate: todayDateString,
      });

      const schedule3 = await factory({
        courseId: 1,
        institutionId: 1,
        closingDate: tomorrowDateString,
        nextOpenDate: tomorrowDateString,
      });

      const event = lambdaEventMock
        .apiGateway()
        .path('/graphql')
        .method('POST')
        .header('Content-Type', 'application/json')
        .header('Authorization', `Bearer ${accessTokenSub1}`)
        .body({ query: validBody })
        .build();
      event.multiValueHeaders = {
        'Content-Type': 'application/json',
      };

      const result = await LambdaTester(graphqlHandler).event(event).expectResult();
      expect(result.statusCode).toBe(200);

      const json = JSON.parse(result.body);
      const data = json?.data?.intake_control_listSchedule?.data ?? [];

      expect(data.length).toBe(3);
      // Results contain schedules for the course ID
      expect(data).toEqual(
        expect.arrayContaining([
          expect.objectContaining(extractData(schedule1)),
          expect.objectContaining(extractData(schedule2)),
          expect.objectContaining(extractData(schedule3)),
        ])
      );
    });

    test('should return schedules with intake id', async () => {
      config.featureFlags.courseLevelControl = false;
      config.featureFlags.intakeLevelControl = true;

      const courseSchedule1 = await factory({
        courseId: 1,
        institutionId: 1,
        intakeId: null,
        closingDate: yesterdayDateString,
        nextOpenDate: todayDateString,
      });

      const intakeSchedule1 = await factory({
        courseId: 1,
        institutionId: 1,
        intakeId: 1,
        closingDate: yesterdayDateString,
        nextOpenDate: todayDateString,
      });

      const intakeSchedule2 = await factory({
        courseId: 1,
        institutionId: 1,
        intakeId: 2,
        closingDate: yesterdayDateString,
        nextOpenDate: todayDateString,
      });

      const event = lambdaEventMock
        .apiGateway()
        .path('/graphql')
        .method('POST')
        .header('Content-Type', 'application/json')
        .header('Authorization', `Bearer ${accessTokenSub1}`)
        .body({ query: validBody })
        .build();
      event.multiValueHeaders = {
        'Content-Type': 'application/json',
      };

      const result = await LambdaTester(graphqlHandler).event(event).expectResult();
      expect(result.statusCode).toBe(200);

      const json = JSON.parse(result.body);
      const data = json?.data?.intake_control_listSchedule?.data ?? [];

      expect(data.length).toBe(2);

      // Results contain intake level schedules
      expect(data).toEqual(
        expect.arrayContaining([
          expect.objectContaining(extractData(intakeSchedule1)),
          expect.objectContaining(extractData(intakeSchedule2)),
        ])
      );

      // Results do not contain course level schedules
      const shouldNotAppear = [courseSchedule1];
      shouldNotAppear.forEach((schedule) => {
        expect(data.map((item) => item.dataValues)).not.toEqual(
          expect.arrayContaining([expect.objectContaining(schedule.dataValues)])
        );
      });
    });

    test('should return schedules with no intake id', async () => {
      config.featureFlags.intakeLevelControl = false;
      config.featureFlags.courseLevelControl = true;

      const courseSchedule1 = await factory({
        courseId: 1,
        institutionId: 1,
        intakeId: null,
        closingDate: todayDateString,
        nextOpenDate: todayDateString,
      });

      const intakeSchedule1 = await factory({
        courseId: 1,
        institutionId: 1,
        intakeId: 1,
        closingDate: yesterdayDateString,
        nextOpenDate: todayDateString,
      });

      const intakeSchedule2 = await factory({
        courseId: 1,
        institutionId: 1,
        intakeId: 2,
        closingDate: tomorrowDateString,
        nextOpenDate: tomorrowDateString,
      });

      const event = lambdaEventMock
        .apiGateway()
        .path('/graphql')
        .method('POST')
        .header('Content-Type', 'application/json')
        .header('Authorization', `Bearer ${accessTokenSub1}`)
        .body({ query: validBody })
        .build();
      event.multiValueHeaders = {
        'Content-Type': 'application/json',
      };

      const result = await LambdaTester(graphqlHandler).event(event).expectResult();
      expect(result.statusCode).toBe(200);

      const json = JSON.parse(result.body);
      const data = json?.data?.intake_control_listSchedule?.data ?? [];

      expect(data.length).toBe(1);

      // Results contain course level schedules
      expect(data).toEqual(
        expect.arrayContaining([expect.objectContaining(extractData(courseSchedule1))])
      );

      // Results do not contain intake level schedules
      const shouldNotAppear = [intakeSchedule1, intakeSchedule2];
      shouldNotAppear.forEach((schedule) => {
        expect(data.map((item) => item.dataValues)).not.toEqual(
          expect.arrayContaining([expect.objectContaining(schedule.dataValues)])
        );
      });
    });

    test('should return empty schedules with both course and intake level feature flags are disables', async () => {
      config.featureFlags.intakeLevelControl = false;
      config.featureFlags.courseLevelControl = false;

      const courseSchedule1 = await factory({
        courseId: 1,
        institutionId: 1,
        intakeId: 1,
        closingDate: todayDateString,
        nextOpenDate: todayDateString,
      });

      const intakeSchedule1 = await factory({
        courseId: 1,
        institutionId: 1,
        intakeId: null,
        closingDate: yesterdayDateString,
        nextOpenDate: todayDateString,
      });

      const intakeSchedule2 = await factory({
        courseId: 1,
        institutionId: 1,
        intakeId: null,
        closingDate: tomorrowDateString,
        nextOpenDate: tomorrowDateString,
      });

      const event = lambdaEventMock
        .apiGateway()
        .path('/graphql')
        .method('POST')
        .header('Content-Type', 'application/json')
        .header('Authorization', `Bearer ${accessTokenSub1}`)
        .body({ query: validBody })
        .build();
      event.multiValueHeaders = {
        'Content-Type': 'application/json',
      };

      const result = await LambdaTester(graphqlHandler).event(event).expectResult();
      expect(result.statusCode).toBe(200);

      const json = JSON.parse(result.body);
      const data = json?.data?.intake_control_listSchedule?.data ?? [];

      expect(data.length).toBe(0);

      // Results do not contain course or intake level schedules
      const shouldNotAppear = [courseSchedule1, intakeSchedule1, intakeSchedule2];
      shouldNotAppear.forEach((schedule) => {
        expect(data.map((item) => item.dataValues)).not.toEqual(
          expect.arrayContaining([expect.objectContaining(schedule.dataValues)])
        );
      });
    });
  });
});
