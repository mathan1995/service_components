// Mocking SQS client for unit test
const { mockClient } = require('aws-sdk-client-mock');
const { SQSClient } = require('@aws-sdk/client-sqs');
const LambdaTester = require('lambda-tester');
const { updateStatusHandler } = require('Handler/update-course-status');
const { mockUdifyGenerateToken, mockUdifyUpdateStatus, nock } = require('../mocks/axios');

mockClient(SQSClient);
describe('Handler/update-course-status', () => {
  beforeEach(() => {
    mockUdifyGenerateToken();
    mockUdifyUpdateStatus();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('updateStatusHandler()', () => {
    test('should send message to sqs', async () => {
      const sqsEventMock = {
        Records: [
          {
            messageId: '22de149f-111d-4d60-a37c-baefb2e9729a',
            receiptHandle: 'AQEBGCJ/PZWJ091J1g0+7TVFJm1ekfbwGRGzJi1z2ELbu+Y',
            body:
              '{"bodyValue":' +
              '{"schedules":[{' +
              '"id":190,' +
              '"userId":"28",' +
              '"institutionId":1,' +
              '"courseId":9898,' +
              '"closingDate":"2022-11-04",' +
              '"nextOpenDate":"2022-11-10",' +
              '"updatedAt":"2022-11-04T05:29:11.668Z",' +
              '"createdAt":"2022-11-04T05:29:11.668Z"' +
              '}],' +
              '"status":true}}',
            attributes: [Object],
            messageAttributes: {},
            md5OfBody: '735b09799c0de01cb6d1d0963c006bc3',
            eventSource: 'aws:sqs',
            eventSourceARN:
              'arn:aws:sqs:ap-southeast-1:460134934561:institution-control-service-dev-dev-update-status-queue',
            awsRegion: 'ap-southeast-1',
          },
        ],
      };

      await LambdaTester(updateStatusHandler).event(sqsEventMock).expectResolve();
    });
  });
});
