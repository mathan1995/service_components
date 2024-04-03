require('dotenv').config();

module.exports = {
  aws: {
    region: process.env.AWS_REGION,
  },
  inventory: {
    url: process.env.INVENTORY_API_URL,
  },
  udify: {
    url: process.env.UDIFY_API_URL,
    client_id: process.env.UDIFY_CLIENT_ID,
    client_secret: process.env.UDIFY_CLIENT_SECRET,
  },
};
