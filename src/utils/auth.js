const jwtDecode = require('jwt-decode');
const axios = require('axios');
const { udify } = require('Config/services');

/**
 * Get the user ID from access token if available.
 *
 * @param {string} accessToken The JWT access token.
 * @returns {number|null}
 */
const getIdFromToken = (accessToken) => {
  try {
    if (accessToken) {
      // Attempt to decode JWT and extract the subject as user ID
      const { sub: id = null } = jwtDecode(accessToken);
      return id;
    }
  } catch (error) {
    console.log(error);
  }
  return null;
};

// Associative array to cache token results in memory
let accessTokenCache = null;

const generateAccessToken = async () => {
  try {
    // Use cache if exist
    if (accessTokenCache) {
      console.log('Use cache for access token');
      return accessTokenCache;
    }

    const response = await axios.post(`${udify.url}/oauth/token`, {
      grant_type: 'client_credentials',
      client_id: udify.client_id,
      client_secret: udify.client_secret,
      scope: '*',
    });

    accessTokenCache = response?.data?.access_token;
    return accessTokenCache;
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  getIdFromToken,
  generateAccessToken,
};
