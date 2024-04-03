const { SQSClient } = require('@aws-sdk/client-sqs');
const { mockClient } = require('aws-sdk-client-mock');
const {
  updateUdifyCourseStatus,
  broadcastToUdifyIfAffectedDateIsToday,
} = require('Services/update-udify-course-status');
const { todayDateString, tomorrowDateString } = require('../fixtures/date');
const { mockUdifyGenerateToken, mockUdifyUpdateStatus, nock } = require('../mocks/axios');

// Mocking SQS client for unit test
const sqsMock = mockClient(SQSClient);

describe('Services/update-udify-course-status', () => {
  describe('updateUdifyCourseStatus()', () => {
    test('should update udify course status and return success', async () => {
      const courseId = 121122;
      const intakeId = 200;
      const closed = true;

      const schedules = [
        {
          id: 1,
          userId: 1,
          institutionId: 1,
          courseId,
          closingDate: todayDateString,
          nextOpenDate: tomorrowDateString,
          cancelledDate: null,
        },
        {
          id: 2,
          userId: 1,
          institutionId: 1,
          courseId,
          intakeId,
          closingDate: todayDateString,
          nextOpenDate: tomorrowDateString,
          cancelledDate: null,
        },
      ];

      mockUdifyGenerateToken();

      // Verify axios request is sent with the following payload
      mockUdifyUpdateStatus({
        requestBody: {
          data: [
            {
              courseId,
              intakeId: null,
              courseLevel: {
                closed,
              },
            },
            {
              courseId,
              intakeId,
              courseLevel: {
                closed,
              },
            },
          ],
        },
      });

      const result = await updateUdifyCourseStatus(schedules, closed);
      expect(result).toBe('success');

      nock.cleanAll();
    });
  });

  describe('broadcastToUdifyIfAffectedDateIsToday()', () => {
    test('should send message to AWS SQS', async () => {
      const schedules = [
        {
          id: 196,
          userId: 28,
          institutionId: 1,
          courseId: 121122,
          closingDate: todayDateString,
          nextOpenDate: tomorrowDateString,
          cancelledDate: null,
        },
      ];

      await broadcastToUdifyIfAffectedDateIsToday(todayDateString, schedules, true);

      const sqsCommand = sqsMock.call(0);
      const sqsInput = JSON.parse(sqsCommand?.firstArg?.input?.MessageBody);
      expect(sqsInput.bodyValue.schedules).toEqual(
        expect.arrayContaining([expect.objectContaining(schedules[0])])
      );
    });
  });
});
