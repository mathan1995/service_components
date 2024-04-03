const { generateAccessToken } = require('Utils/auth');
const axios = require('axios');
const Dataloader = require('dataloader');
const { udify } = require('Config/services');

/**
 * Get key for dataloader mapping.
 *
 * @param {int} courseId
 * @param {string} termStart
 * @returns {string}
 */
const getKey = (courseId, termStart) => `${courseId}|${termStart || null}`;

/**
 * Dataloader function to get intake response from course and term start date key.
 *
 * @param {string[]} courseAndTermStartDates
 * @returns {object} Object that maps each key to an intake response
 */
const getIntakeIdByCourseAndTermStartDates = async (courseAndTermStartDates) => {
  const payloadData = {
    data: courseAndTermStartDates.map((courseAndTermStartDate) => {
      const [courseId, termStart] = courseAndTermStartDate.split('|');
      return {
        course_id: parseInt(courseId, 10) || null,
        term_start: termStart || null,
      };
    }),
  };

  const accessToken = await generateAccessToken();

  const response = await axios({
    method: 'post',
    url: `${udify.url}/api/v1/intake-control/intake-for-course`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    data: payloadData,
  });

  // Map each key to null by default
  const results = courseAndTermStartDates.reduce((obj, item) => {
    // eslint-disable-next-line no-param-reassign
    obj[item] = null;
    return obj;
  }, {});

  // Map each key to intake response from API
  const dataList = response?.data?.data || [];
  dataList.forEach((intakeIdResponse) => {
    const courseId = intakeIdResponse?.course_id;
    const termStart = intakeIdResponse?.term_start;
    const key = getKey(courseId, termStart);
    results[key] = intakeIdResponse;
  });

  return Object.values(results);
};

// Create dataloader that cache results as long as the Lambda instance is alive
const intakeRequestDataloader = new Dataloader(getIntakeIdByCourseAndTermStartDates);

const getIntakeForCourse = async (payload) => {
  const { intakeRequest } = payload;

  const intakeResponses = [];

  await Promise.all(
    intakeRequest.map(async (item) => {
      if (!item.termStart) {
        // If no term start is provided, intake ID is null
        // No need to check using API
        intakeResponses.push({
          courseId: item?.courseId,
          termStart: item?.termStart,
          intakeId: null,
          errors: null,
        });
      } else {
        const key = getKey(item.courseId, item.termStart);
        const intakeResponse = await intakeRequestDataloader.load(key);
        intakeResponses.push({
          courseId: intakeResponse?.course_id,
          termStart: intakeResponse?.term_start,
          intakeId: intakeResponse?.intake_id,
          errors: intakeResponse?.errors,
        });
      }
    })
  );

  return intakeResponses;
};

module.exports = {
  getIntakeForCourse,
};
