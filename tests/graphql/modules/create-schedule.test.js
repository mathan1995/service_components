const { SQSClient } = require('@aws-sdk/client-sqs');
const { mockClient } = require('aws-sdk-client-mock');
const { sequelize, Schedule } = require('Database/models');
const lambdaEventMock = require('lambda-event-mock');
const LambdaTester = require('lambda-tester');
const { graphqlHandler } = require('Graphql/graphql');
const config = require('Config/app');
const { errors } = require('Config/messages');
const { accessTokenSub1, accessTokenSub2 } = require('../../fixtures/access-token');
const { todayDateString, tomorrowDateString } = require('../../fixtures/date');
const {
  mockUdifyGetUserRoles,
  mockUdifyGenerateToken,
  mockUdifyUpdateStatus,
  nock,
} = require('../../mocks/axios');

// Mocking SQS client for unit test
const sqsMock = mockClient(SQSClient);

const validRoles = ['admin', 'EntryFull', 'QAFull', 'FormFull'];

const institutionId = 1;

const courseId = 1;

const intakeId = 1;

// Valid body to create a course level schedule
const courseLevelBody = `
mutation {
  intake_control_createSchedule(
    input: {
      institutionId: 1
      courseId: 1
      closingDate: "${todayDateString}"
      nextOpenDate: "${tomorrowDateString}"
    }
  ) {
    id
    userId
    institutionId
    courseId
    closingDate
    nextOpenDate
  }
}
`;

const expectedCourseSchedule = {
  userId: 1,
  institutionId,
  courseId,
  closingDate: todayDateString,
  nextOpenDate: tomorrowDateString,
};

// Valid body to create an intake level schedule
const intakeLevelBody = `
mutation {
  intake_control_createSchedule(
    input: {
      institutionId: 1
      courseId: 1
      intakeId: 1
      closingDate: "${todayDateString}"
      nextOpenDate: "${tomorrowDateString}"
    }
  ) {
    id
    userId
    institutionId
    courseId
    intakeId
    closingDate
    nextOpenDate
  }
}
`;

const expectedIntakeSchedule = {
  userId: 1,
  institutionId,
  courseId,
  intakeId,
  closingDate: todayDateString,
  nextOpenDate: tomorrowDateString,
};

describe('Graphql/modules/create-schedule', () => {
  beforeEach(() => {
    mockUdifyGetUserRoles({ roles: validRoles });
    mockUdifyGenerateToken();
    mockUdifyUpdateStatus();
  });

  afterEach(() => {
    nock.cleanAll();
    sqsMock.reset();
  });

  beforeAll(async () => {
    await sequelize.sync();
  });

  afterAll(async () => {
    await sequelize.drop();
  });

  describe('graphql', () => {
    test('should return error when there is no access token', async () => {
      const event = lambdaEventMock
        .apiGateway()
        .path('/graphql')
        .method('POST')
        .header('Content-Type', 'application/json')
        .body({ query: courseLevelBody })
        .build();
      event.multiValueHeaders = {
        'Content-Type': 'application/json',
      };

      const result = await LambdaTester(graphqlHandler).event(event).expectResult();
      expect(result.body).toContain('BAD_USER_INPUT');
    });

    test('should return error when Unauthorized', async () => {
      const event = lambdaEventMock
        .apiGateway()
        .path('/graphql')
        .method('POST')
        .header('Content-Type', 'application/json')
        .header('Authorization', `Bearer ${accessTokenSub2}`) // Use different token as it is being cached
        .body({ query: courseLevelBody })
        .build();
      event.multiValueHeaders = {
        'Content-Type': 'application/json',
      };

      nock.cleanAll();
      mockUdifyGetUserRoles({ roles: ['CounsellorFull', 'CustomerSupportFull'] });
      mockUdifyGenerateToken();
      mockUdifyUpdateStatus();

      const result = await LambdaTester(graphqlHandler).event(event).expectResult();
      expect(result.body).toContain('FORBIDDEN');
      expect(result.body).toContain('Not Authorized!');
    });

    test('should return course level schedule when payload is valid', async () => {
      const event = lambdaEventMock
        .apiGateway()
        .path('/graphql')
        .method('POST')
        .header('Content-Type', 'application/json')
        .header('Authorization', `Bearer ${accessTokenSub1}`)
        .body({ query: courseLevelBody })
        .build();
      event.multiValueHeaders = {
        'Content-Type': 'application/json',
      };

      const result = await LambdaTester(graphqlHandler).event(event).expectResult();
      expect(result.statusCode).toBe(200);

      const json = JSON.parse(result.body);
      const id = json?.data?.intake_control_createSchedule?.id;
      expect(id).not.toBeNull();

      const record = await Schedule.findByPk(id);
      expect(record.dataValues).toMatchObject(expectedCourseSchedule);

      const sqsCommand = sqsMock.call(0);
      const sqsInput = JSON.parse(sqsCommand?.firstArg?.input?.MessageBody);
      expect(sqsInput?.bodyValue?.schedules).toEqual(
        expect.arrayContaining([expect.objectContaining(expectedCourseSchedule)])
      );
      expect(sqsInput.bodyValue.status).toEqual(true);
    });

    test('should return intake level schedule when payload is valid', async () => {
      const event = lambdaEventMock
        .apiGateway()
        .path('/graphql')
        .method('POST')
        .header('Content-Type', 'application/json')
        .header('Authorization', `Bearer ${accessTokenSub1}`)
        .body({ query: intakeLevelBody })
        .build();
      event.multiValueHeaders = {
        'Content-Type': 'application/json',
      };

      const result = await LambdaTester(graphqlHandler).event(event).expectResult();
      expect(result.statusCode).toBe(200);

      const json = JSON.parse(result.body);
      const id = json?.data?.intake_control_createSchedule?.id;
      expect(id).not.toBeNull();

      const record = await Schedule.findByPk(id);
      expect(record.dataValues).toMatchObject(expectedIntakeSchedule);

      const sqsCommand = sqsMock.call(0);
      const sqsInput = JSON.parse(sqsCommand?.firstArg?.input?.MessageBody);
      expect(sqsInput?.bodyValue?.schedules).toEqual(
        expect.arrayContaining([expect.objectContaining(expectedIntakeSchedule)])
      );
      expect(sqsInput.bodyValue.status).toEqual(true);
    });

    test('should not send to SQS when schedule is in the future', async () => {
      const futureScheduleBody = `
        mutation {
          intake_control_createSchedule(
            input: {
              institutionId: 1
              courseId: 1
              intakeId: 1
              closingDate: "${tomorrowDateString}"
            }
          ) {
            id
            userId
            institutionId
            courseId
            intakeId
            closingDate
            nextOpenDate
          }
        }
      `;

      const expectedFutureSchedule = {
        userId: 1,
        institutionId,
        courseId,
        intakeId,
        closingDate: tomorrowDateString,
        nextOpenDate: null,
      };

      const event = lambdaEventMock
        .apiGateway()
        .path('/graphql')
        .method('POST')
        .header('Content-Type', 'application/json')
        .header('Authorization', `Bearer ${accessTokenSub1}`)
        .body({ query: futureScheduleBody })
        .build();
      event.multiValueHeaders = {
        'Content-Type': 'application/json',
      };

      const result = await LambdaTester(graphqlHandler).event(event).expectResult();
      expect(result.statusCode).toBe(200);

      const json = JSON.parse(result.body);
      const id = json?.data?.intake_control_createSchedule?.id;
      expect(id).not.toBeNull();

      const record = await Schedule.findByPk(id);
      expect(record.dataValues).toMatchObject(expectedFutureSchedule);

      const sqsCommand = sqsMock.call(0);
      expect(sqsCommand).toBeNull();
    });

    test('should return error if intake ID is not provided and course level feature flag is disabled', async () => {
      config.featureFlags.courseLevelControl = false;
      config.featureFlags.intakeLevelControl = true;
      const event = lambdaEventMock
        .apiGateway()
        .path('/graphql')
        .method('POST')
        .header('Content-Type', 'application/json')
        .header('Authorization', `Bearer ${accessTokenSub1}`)
        .body({ query: courseLevelBody })
        .build();
      event.multiValueHeaders = {
        'Content-Type': 'application/json',
      };

      const result = await LambdaTester(graphqlHandler).event(event).expectResult();
      expect(result.body).toContain('BAD_USER_INPUT');
      expect(result.body).toContain(errors.courseLevel.disabledErrorMessage);
    });

    test('should return error if intake ID is provided and intake level feature flag is disabled', async () => {
      config.featureFlags.intakeLevelControl = false;
      config.featureFlags.courseLevelControl = true;

      const event = lambdaEventMock
        .apiGateway()
        .path('/graphql')
        .method('POST')
        .header('Content-Type', 'application/json')
        .header('Authorization', `Bearer ${accessTokenSub1}`)
        .body({ query: intakeLevelBody })
        .build();
      event.multiValueHeaders = {
        'Content-Type': 'application/json',
      };

      const result = await LambdaTester(graphqlHandler).event(event).expectResult();
      expect(result.body).toContain('BAD_USER_INPUT');
      expect(result.body).toContain(errors.intakeLevel.disabledErrorMessage);
    });
  });
});
