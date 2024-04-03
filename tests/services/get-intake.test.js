const { getIntakeForCourse } = require('Services/get-intake');
const { mockUdifyGetIntakeByCourse, nock, mockUdifyGenerateToken } = require('../mocks/axios');

describe('Services/get-intake', () => {
  describe('getIntakeForCourse()', () => {
    test('should return intake id if the request payload is valid', async () => {
      // udify request body with snakeCase
      const requestBody = {
        data: [
          {
            course_id: 1095,
            term_start: '2022-11-25',
          },
          {
            course_id: 13568,
            term_start: '2022-12-25',
          },
        ],
      };

      // udify response body with snakeCase
      const message = {
        data: [
          {
            course_id: 1095,
            intake_id: 1024,
            term_start: '2022-11-25',
            errors: null,
          },
          {
            course_id: 13568,
            intake_id: null,
            term_start: '2022-12-25',
            errors: null,
          },
        ],
      };

      // Institution control request body with camelCase
      const request = {
        intakeRequest: [
          {
            courseId: 1095,
            termStart: '2022-11-25',
          },
          {
            courseId: 13568,
            termStart: '2022-12-25',
          },
          {
            courseId: 99999,
            termStart: '', // No API request expected for this entry
          },
        ],
      };

      // Institution control response body with camelCase
      const expectedResponse = [
        {
          courseId: 1095,
          intakeId: 1024,
          termStart: '2022-11-25',
          errors: null,
        },
        {
          courseId: 13568,
          intakeId: null,
          termStart: '2022-12-25',
          errors: null,
        },
        {
          courseId: 99999,
          intakeId: null,
          termStart: '',
          errors: null,
        },
      ];

      mockUdifyGenerateToken();

      mockUdifyGetIntakeByCourse({
        message,
        requestBody,
      });

      const result = await getIntakeForCourse(request);
      expect(result).toEqual(
        expect.arrayContaining(
          expectedResponse.map((response) => expect.objectContaining(response))
        )
      );

      nock.cleanAll();
    });

    test('should not send request to Udify if term start is empty', async () => {
      // Institution control request body with camelCase
      const request = {
        intakeRequest: [
          {
            courseId: 1095,
            termStart: '',
          },
          {
            courseId: 13568,
            termStart: null,
          },
        ],
      };

      // Institution control response body with camelCase
      const expectedResponse = [
        {
          courseId: 1095,
          intakeId: null,
          termStart: '',
          errors: null,
        },
        {
          courseId: 13568,
          intakeId: null,
          termStart: null,
          errors: null,
        },
      ];

      const result = await getIntakeForCourse(request);
      expect(result).toEqual(
        expect.arrayContaining(
          expectedResponse.map((response) => expect.objectContaining(response))
        )
      );
    });
  });
});
