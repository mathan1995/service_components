const dateFormat = 'YYYY-MM-DD';

/**
 * Get the duration in milliseconds.
 *
 * @param {Object} payload - The payload for duration.
 * @param {number} payload.days - The number of days.
 * @param {number} payload.hours - The number of hours.
 * @param {number} payload.minutes - The number of minutes.
 * @param {number} payload.seconds - The number of seconds.
 * @returns {number}
 */
const durationInMillisecond = ({ days = 0, hours = 0, minutes = 0, seconds = 0 }) => {
  const millisecondsInASecond = 1000;
  const secondsInAMinute = 60;
  const minutesInAnHour = 60;
  const hoursInADay = 24;

  const daysInMillisecond =
    days * hoursInADay * minutesInAnHour * secondsInAMinute * millisecondsInASecond;
  const hoursInMillisecond = hours * minutesInAnHour * secondsInAMinute * millisecondsInASecond;
  const minutesInMillisecond = minutes * secondsInAMinute * millisecondsInASecond;
  const secondsInMillisecond = seconds * millisecondsInASecond;

  return daysInMillisecond + hoursInMillisecond + minutesInMillisecond + secondsInMillisecond;
};

/**
 * Get date as YYYY-MM-DD (UTC) string.
 *
 * @param {Date} date Date to be converted into YYYY-MM-DD string.
 * @returns {string|null}
 */
const dateAsString = (date) => {
  if (!(date instanceof Date && !Number.isNaN(date.getTime()))) return null;

  return date.toISOString().split('T')[0]; // get date as YYYY-MM-DD
};

/**
 * Get today in UTC.
 *
 * @returns {Date} Today in UTC
 */
const today = () => {
  const todayDate = new Date();
  todayDate.setUTCHours(0, 0, 0, 0);
  return todayDate;
};

module.exports = {
  dateAsString,
  dateFormat,
  durationInMillisecond,
  today,
};
