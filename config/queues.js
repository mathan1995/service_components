require('dotenv').config();

module.exports = {
  updateStatus: {
    url: process.env.SQS_QUEUE_UPDATE_STATUS_URL,
  },
};
