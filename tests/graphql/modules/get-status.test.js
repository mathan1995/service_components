const { sequelize, Schedule } = require('Database/models');
const lambdaEventMock = require('lambda-event-mock');
const LambdaTester = require('lambda-tester');
const { graphqlHandler } = require('Graphql/graphql');
const { factory } = require('Database/factories/ScheduleFactory');
const config = require('Config/app');
const { accessTokenSub1 } = require('../../fixtures/access-token');
const { todayDateString, tomorrowDateString, yesterdayDateString } = require('../../fixtures/date');

const courseId = [1, 2];

const validBody = `
query {
    intake_control_getStatus(courseId:[${courseId}]) {
      courseId
      courseLevel {
        closed
        currentSchedule {
          id
          closingDate
          nextOpenDate
        }
      }
      intakeLevels {
        intakeId
        closed
        currentSchedule {
          id
          closingDate
          nextOpenDate
        }
      }
    }
  }
`;

describe('Graphql/modules/course-status', () => {
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

    test('should return when course closed status is true', async () => {
      const courseSchedule1 = await factory({
        courseId: 1,
        closingDate: todayDateString,
        nextOpenDate: tomorrowDateString,
        cancelledDate: null,
      });

      const courseSchedule2 = await factory({
        courseId: 2,
        closingDate: yesterdayDateString,
        nextOpenDate: tomorrowDateString,
        cancelledDate: null,
      });

      const expectedResponse = [
        {
          courseId: courseSchedule1.courseId,
          courseLevel: {
            closed: true,
            currentSchedule: {
              id: courseSchedule1.id,
              closingDate: courseSchedule1.closingDate,
              nextOpenDate: courseSchedule1.nextOpenDate,
            },
          },
          intakeLevels: [],
        },
        {
          courseId: courseSchedule2.courseId,
          courseLevel: {
            closed: true,
            currentSchedule: {
              id: courseSchedule2.id,
              closingDate: courseSchedule2.closingDate,
              nextOpenDate: courseSchedule2.nextOpenDate,
            },
          },
          intakeLevels: [],
        },
      ];

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
      const data = json?.data?.intake_control_getStatus ?? {};

      expect(data).toEqual(expect.objectContaining(expectedResponse));
    });

    test('should return when course closed status is false', async () => {
      const courseSchedule1 = await factory({
        courseId: 1,
        closingDate: yesterdayDateString,
        nextOpenDate: todayDateString,
        cancelledDate: null,
      });

      const courseSchedule2 = await factory({
        courseId: 2,
        closingDate: yesterdayDateString,
        nextOpenDate: todayDateString,
        cancelledDate: null,
      });

      const expectedResponse = [
        {
          courseId: courseSchedule1.courseId,
          courseLevel: {
            closed: false,
            currentSchedule: null,
          },
          intakeLevels: [],
        },
        {
          courseId: courseSchedule2.courseId,
          courseLevel: {
            closed: false,
            currentSchedule: null,
          },
          intakeLevels: [],
        },
      ];

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
      const data = json?.data?.intake_control_getStatus ?? {};

      expect(data).toEqual(expect.objectContaining(expectedResponse));
    });

    test('should return when course closed status is true and false', async () => {
      const courseSchedule1 = await factory({
        courseId: 1,
        closingDate: yesterdayDateString,
        nextOpenDate: todayDateString,
        cancelledDate: null,
      });

      const courseSchedule2 = await factory({
        courseId: 2,
        closingDate: yesterdayDateString,
        nextOpenDate: tomorrowDateString,
        cancelledDate: null,
      });

      const expectedResponse = [
        {
          courseId: courseSchedule1.courseId,
          courseLevel: {
            closed: false,
            currentSchedule: null,
          },
          intakeLevels: [],
        },
        {
          courseId: courseSchedule2.courseId,
          courseLevel: {
            closed: true,
            currentSchedule: {
              id: courseSchedule2.id,
              closingDate: courseSchedule2.closingDate,
              nextOpenDate: courseSchedule2.nextOpenDate,
            },
          },
          intakeLevels: [],
        },
      ];

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
      const data = json?.data?.intake_control_getStatus ?? {};

      expect(data).toEqual(expect.objectContaining(expectedResponse));
    });

    test('should return course schedule with intake levels', async () => {
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

      const expectedResponse = [
        {
          courseId: courseSchedule1.courseId,
          courseLevel: {
            closed: true,
            currentSchedule: {
              id: courseSchedule1.id,
              closingDate: courseSchedule1.closingDate,
              nextOpenDate: courseSchedule1.nextOpenDate,
            },
          },
          intakeLevels: [
            {
              intakeId: intakeSchedule1.intakeId,
              closed: true,
              currentSchedule: {
                id: intakeSchedule1.id,
                closingDate: intakeSchedule1.closingDate,
                nextOpenDate: intakeSchedule1.nextOpenDate,
              },
            },
          ],
        },
        {
          courseId: courseSchedule2.courseId,
          courseLevel: {
            closed: true,
            currentSchedule: {
              id: courseSchedule2.id,
              closingDate: courseSchedule2.closingDate,
              nextOpenDate: courseSchedule2.nextOpenDate,
            },
          },
          intakeLevels: [
            {
              intakeId: intakeSchedule2.intakeId,
              closed: true,
              currentSchedule: {
                id: intakeSchedule2.id,
                closingDate: intakeSchedule2.closingDate,
                nextOpenDate: intakeSchedule2.nextOpenDate,
              },
            },
          ],
        },
      ];

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
      const data = json?.data?.intake_control_getStatus ?? {};

      expect(data).toEqual(expect.objectContaining(expectedResponse));
    });

    test('should return course level schedule without intake levels', async () => {
      config.featureFlags.courseLevelControl = true;
      config.featureFlags.intakeLevelControl = false;

      const courseSchedule1 = await factory({
        courseId: 1,
        closingDate: yesterdayDateString,
        nextOpenDate: tomorrowDateString,
        cancelledDate: null,
      });

      await factory({
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

      await factory({
        courseId: 2,
        intakeId: 3,
        closingDate: todayDateString,
        nextOpenDate: tomorrowDateString,
        cancelledDate: null,
      });

      const expectedResponse = [
        {
          courseId: courseSchedule1.courseId,
          courseLevel: {
            closed: true,
            currentSchedule: {
              id: courseSchedule1.id,
              closingDate: courseSchedule1.closingDate,
              nextOpenDate: courseSchedule1.nextOpenDate,
            },
          },
          intakeLevels: [],
        },
        {
          courseId: courseSchedule2.courseId,
          courseLevel: {
            closed: true,
            currentSchedule: {
              id: courseSchedule2.id,
              closingDate: courseSchedule2.closingDate,
              nextOpenDate: courseSchedule2.nextOpenDate,
            },
          },
          intakeLevels: [],
        },
      ];

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
      const data = json?.data?.intake_control_getStatus ?? {};

      expect(data).toEqual(expect.objectContaining(expectedResponse));
    });

    test('should return intake levels schedule without course levels ', async () => {
      config.featureFlags.intakeLevelControl = true;
      config.featureFlags.courseLevelControl = false;

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
        closingDate: yesterdayDateString,
        nextOpenDate: tomorrowDateString,
        cancelledDate: null,
      });

      const expectedResponse = [
        {
          courseId: courseSchedule1.courseId,
          courseLevel: {
            closed: false,
            currentSchedule: null,
          },
          intakeLevels: [
            {
              intakeId: intakeSchedule1.intakeId,
              closed: true,
              currentSchedule: {
                id: intakeSchedule1.id,
                closingDate: intakeSchedule1.closingDate,
                nextOpenDate: intakeSchedule1.nextOpenDate,
              },
            },
          ],
        },
        {
          courseId: courseSchedule2.courseId,
          courseLevel: {
            closed: false,
            currentSchedule: null,
          },
          intakeLevels: [
            {
              intakeId: intakeSchedule2.intakeId,
              closed: true,
              currentSchedule: {
                id: intakeSchedule2.id,
                closingDate: intakeSchedule2.closingDate,
                nextOpenDate: intakeSchedule2.nextOpenDate,
              },
            },
          ],
        },
      ];

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
      const data = json?.data?.intake_control_getStatus ?? {};

      expect(data).toEqual(expect.objectContaining(expectedResponse));
    });

    test('should return empty if both intake and course level feature flags are false', async () => {
      config.featureFlags.courseLevelControl = false;
      config.featureFlags.intakeLevelControl = false;

      const courseSchedule1 = await factory({
        courseId: 1,
        closingDate: yesterdayDateString,
        nextOpenDate: tomorrowDateString,
        cancelledDate: null,
      });

      await factory({
        courseId: 1,
        intakeId: 1,
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

      await factory({
        courseId: 2,
        intakeId: 2,
        closingDate: yesterdayDateString,
        nextOpenDate: tomorrowDateString,
        cancelledDate: null,
      });

      const expectedResponse = [
        {
          courseId: courseSchedule1.courseId,
          courseLevel: {
            closed: false,
            currentSchedule: null,
          },
          intakeLevels: [],
        },
        {
          courseId: courseSchedule2.courseId,
          courseLevel: {
            closed: false,
            currentSchedule: null,
          },
          intakeLevels: [],
        },
      ];

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
      const data = json?.data?.intake_control_getStatus ?? {};

      expect(data).toEqual(expect.objectContaining(expectedResponse));
    });
  });
});
