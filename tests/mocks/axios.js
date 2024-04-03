const nock = require('nock');
const { udify } = require('Config/services');

const mockUdifyGetUserRoles = ({ roles = [], status = 200 } = {}) => {
  const response = {
    data: {
      roles: roles.map((role) => ({
        name: role,
      })),
    },
  };
  nock(udify.url)
    .get(/api\/v2\/users\//)
    .reply(status, response);
};

const mockUdifyGenerateToken = ({ accessToken = 'access_token', status = 200 } = {}) => {
  nock(udify.url).post('/oauth/token').reply(status, { access_token: accessToken });
};

const mockUdifyUpdateStatus = ({ message = 'success', status = 200, requestBody } = {}) => {
  if (requestBody) {
    nock(udify.url).post('/api/v1/intake-control/status', requestBody).reply(status, message);
  } else {
    nock(udify.url).post('/api/v1/intake-control/status').reply(status, message);
  }
};

const mockUdifyGetIntakeByCourse = ({ message = {}, status = 200, requestBody } = {}) => {
  if (requestBody) {
    nock(udify.url)
      .post('/api/v1/intake-control/intake-for-course', requestBody)
      .reply(status, message);
  } else {
    nock(udify.url).post('/api/v1/intake-control/intake-for-course').reply(status, message);
  }
};

module.exports = {
  mockUdifyGetUserRoles,
  mockUdifyGenerateToken,
  mockUdifyUpdateStatus,
  mockUdifyGetIntakeByCourse,
  nock,
};
