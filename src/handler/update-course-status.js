const { updateUdifyCourseStatus } = require('Services/update-udify-course-status');

const updateStatusHandler = async (event) => {
  const { schedules, status } = JSON.parse(event.Records[0].body).bodyValue;

  const response = await updateUdifyCourseStatus(schedules, status);

  console.info(response);
};

module.exports = {
  updateStatusHandler,
};
