const axios = require('axios');
const { dateAsString, today } = require('Utils/date');
const { generateAccessToken } = require('Utils/auth');
const { sendMessage } = require('Utils/sqs');
const { udify } = require('Config/services');
const { updateStatus } = require('Config/queues');

const broadcastToUdifyIfAffectedDateIsToday = async (affectedDate, schedules, status) => {
  if (affectedDate === dateAsString(today())) {
    try {
      await sendMessage(updateStatus.url, {
        schedules,
        status,
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
};

const updateUdifyCourseStatus = async (schedules, status = false) => {
  try {
    const payload = {
      data: schedules.map((schedule) => ({
        courseId: schedule.courseId,
        intakeId: schedule?.intakeId ?? null,
        courseLevel: {
          closed: status,
        },
      })),
    };

    const accessToken = await generateAccessToken();

    const response = await axios({
      method: 'post',
      url: `${udify.url}/api/v1/intake-control/status`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      data: payload,
    });

    return response.data;
  } catch (error) {
    console.error('Error updating Udify course status:', error);
    throw new Error(error);
  }
};

module.exports = {
  updateUdifyCourseStatus,
  broadcastToUdifyIfAffectedDateIsToday,
};
