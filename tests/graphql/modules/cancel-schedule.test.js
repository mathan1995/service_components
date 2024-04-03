const { SQSClient } = require('@aws-sdk/client-sqs');
const { mockClient } = require('aws-sdk-client-mock');
const { sequelize, Schedule } = require('Database/models');
const lambdaEventMock = require('lambda-event-mock');
const LambdaTester = require('lambda-tester');
const { graphqlHandler } = require('Graphql/graphql');
const { factory } = require('Database/factories/ScheduleFactory');
const config = require('Config/app');
const { errors } = require('Config/messages');
const { accessTokenSub1, accessTokenSub2 } = require('../../fixtures/access-token');
const { todayDateString, yesterdayDateString } = require('../../fixtures/date');
const {
  mockUdifyGetUserRoles,
  mockUdifyGenerateToken,
  mockUdifyUpdateStatus,
  nock,
} = require('../../mocks/axios');

// Mocking SQS client for unit test
const sqsMock = mockClient(SQSClient);

const validRoles = ['admin', 'EntryFull', 'QAFull', 'FormFull'];

const generateGQLBody = (scheduleId) => `
mutation {
  intake_control_cancelSchedule(
    input: {
      scheduleId: ${scheduleId}
    }
  ){
    id
    userId
    institutionId
    courseId
    closingDate
    nextOpenDate
    cancelledDate
  }
}
`;

describe('Graphql/modules/cancel-schedule', () => {
  let validSchedule = {};

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

    validSchedule = await factory({
      id: 1,
      cancelledDate: null,
    });

    factory({
      id: 2,
      closingDate: yesterdayDateString,
      nextOpenDate: todayDateString,
      cancelledDate: null,
    });

    factory({
      id: 3,
      intakeId: null,
      closingDate: yesterdayDateString,
      nextOpenDate: todayDateString,
      cancelledDate: null,
    });

    factory({
      id: 5,
      intakeId: 5,
      closingDate: yesterdayDateString,
      nextOpenDate: todayDateString,
      cancelledDate: null,
    });

    factory({
      id: 6,
      intakeId: 6,
      closingDate: yesterdayDateString,
      nextOpenDate: null,
      cancelledDate: null,
    });
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
        .body({ query: generateGQLBody(1) })
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
        .body({ query: generateGQLBody(1) })
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

    test('should return schedule when payload is valid', async () => {
      const event = lambdaEventMock
        .apiGateway()
        .path('/graphql')
        .method('POST')
        .header('Content-Type', 'application/json')
        .header('Authorization', `Bearer ${accessTokenSub1}`)
        .body({ query: generateGQLBody(1) })
        .build();
      event.multiValueHeaders = {
        'Content-Type': 'application/json',
      };

      const result = await LambdaTester(graphqlHandler).event(event).expectResult();
      expect(result.statusCode).toBe(200);

      const json = JSON.parse(result.body);
      const id = json?.data?.intake_control_cancelSchedule?.id;
      expect(id).not.toBeNull();

      const expectedSchedule = {
        id: validSchedule.id,
        userId: validSchedule.userId,
        institutionId: validSchedule.institutionId,
        courseId: validSchedule.courseId,
        closingDate: validSchedule.closingDate,
        nextOpenDate: validSchedule.nextOpenDate,
        cancelledDate: todayDateString,
      };

      const record = await Schedule.findByPk(id);
      expect(record.dataValues).toMatchObject(expectedSchedule);

      const sqsCommand = sqsMock.call(0);
      const sqsInput = JSON.parse(sqsCommand?.firstArg?.input?.MessageBody);
      expect(sqsInput.bodyValue.schedules).toEqual(
        expect.arrayContaining([expect.objectContaining(expectedSchedule)])
      );
      expect(sqsInput.bodyValue.status).toEqual(false);
    });

    test('should return error when invalid scheduled id', async () => {
      const event = lambdaEventMock
        .apiGateway()
        .path('/graphql')
        .method('POST')
        .header('Content-Type', 'application/json')
        .header('Authorization', `Bearer ${accessTokenSub1}`)
        .body({ query: generateGQLBody(100) })
        .build();
      event.multiValueHeaders = {
        'Content-Type': 'application/json',
      };

      const result = await LambdaTester(graphqlHandler).event(event).expectResult();
      expect(result.body).toContain('BAD_USER_INPUT');
      expect(result.body).toContain('Schedule not found');
    });

    test('should return error when the schedule has already been ended', async () => {
      const event = lambdaEventMock
        .apiGateway()
        .path('/graphql')
        .method('POST')
        .header('Content-Type', 'application/json')
        .header('Authorization', `Bearer ${accessTokenSub1}`)
        .body({ query: generateGQLBody(2) })
        .build();
      event.multiValueHeaders = {
        'Content-Type': 'application/json',
      };

      const result = await LambdaTester(graphqlHandler).event(event).expectResult();
      expect(result.body).toContain('BAD_USER_INPUT');
      expect(result.body).toContain('This course is currently accepting applications');
    });

    test('should return error when the schedule has already been cancelled', async () => {
      const event = lambdaEventMock
        .apiGateway()
        .path('/graphql')
        .method('POST')
        .header('Content-Type', 'application/json')
        .header('Authorization', `Bearer ${accessTokenSub1}`)
        .body({ query: generateGQLBody(3) })
        .build();
      event.multiValueHeaders = {
        'Content-Type': 'application/json',
      };

      const result = await LambdaTester(graphqlHandler).event(event).expectResult();
      expect(result.body).toContain('BAD_USER_INPUT');
      expect(result.body).toContain('This course is currently accepting applications');
    });

    test('should be able to cancel schedule with no nextOpenDate  ', async () => {
      const event = lambdaEventMock
        .apiGateway()
        .path('/graphql')
        .method('POST')
        .header('Content-Type', 'application/json')
        .header('Authorization', `Bearer ${accessTokenSub1}`)
        .body({ query: generateGQLBody(6) })
        .build();
      event.multiValueHeaders = {
        'Content-Type': 'application/json',
      };

      const result = await LambdaTester(graphqlHandler).event(event).expectResult();
      expect(result.statusCode).toBe(200);

      const json = JSON.parse(result.body);
      const id = json?.data?.intake_control_cancelSchedule?.id;
      expect(id).not.toBeNull();
    });

    test('should return error when course level feature flag disabled and schedule has no intake ID ', async () => {
      config.featureFlags.courseLevelControl = false;
      config.featureFlags.intakeLevelControl = true;
      const event = lambdaEventMock
        .apiGateway()
        .path('/graphql')
        .method('POST')
        .header('Content-Type', 'application/json')
        .header('Authorization', `Bearer ${accessTokenSub1}`)
        .body({ query: generateGQLBody(3) })
        .build();
      event.multiValueHeaders = {
        'Content-Type': 'application/json',
      };

      const result = await LambdaTester(graphqlHandler).event(event).expectResult();
      expect(result.body).toContain('BAD_USER_INPUT');
      expect(result.body).toContain(errors.courseLevel.disabledErrorMessage);
    });

    test('should return error when intake level feature flag disabled and schedule has intake ID ', async () => {
      config.featureFlags.courseLevelControl = true;
      config.featureFlags.intakeLevelControl = false;
      const event = lambdaEventMock
        .apiGateway()
        .path('/graphql')
        .method('POST')
        .header('Content-Type', 'application/json')
        .header('Authorization', `Bearer ${accessTokenSub1}`)
        .body({ query: generateGQLBody(5) })
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
