require('dotenv').config();

module.exports = {
  // Flag to skip access token verification
  skipAccessTokenCheck: process.env.SKIP_ACCESS_TOKEN_CHECK === 'true',
  featureFlags: {
    courseLevelControl: process.env.COURSE_LEVEL_CONTROL_ENABLED === 'true',
    intakeLevelControl: process.env.INTAKE_LEVEL_CONTROL_ENABLED === 'true',
  },
};
