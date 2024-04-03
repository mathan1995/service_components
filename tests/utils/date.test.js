const { dateAsString, durationInMillisecond, today } = require('Utils/date');
const { today: todayDate } = require('../fixtures/date');

describe('Utils/date', () => {
  describe('durationInMillisecond()', () => {
    test('should return correct duration for seconds', () => {
      const seconds = 30;
      expect(durationInMillisecond({ seconds })).toBe(seconds * 1000);
    });

    test('should return correct duration for minutes', () => {
      const minutes = 30;
      expect(durationInMillisecond({ minutes })).toBe(minutes * 60 * 1000);
    });

    test('should return correct duration for hours', () => {
      const hours = 30;
      expect(durationInMillisecond({ hours })).toBe(hours * 3600 * 1000);
    });

    test('should return correct duration for days', () => {
      const days = 30;
      expect(durationInMillisecond({ days })).toBe(days * 24 * 3600 * 1000);
    });
  });

  describe('today()', () => {
    test('should return today as Date in UTC', () => {
      expect(today() instanceof Date).toBe(true);
      expect(today().toISOString()).toBe(todayDate.toISOString());
    });
  });

  describe('dateAsString()', () => {
    test('should return null if date is null', () => {
      expect(dateAsString(null)).toBe(null);
    });

    test('should return null if date is invalid', () => {
      expect(dateAsString(new Date('random'))).toBe(null);
    });

    test('should return YYYY-MM-DD if date is valid', () => {
      const year = todayDate.getUTCFullYear();
      const month = (todayDate.getUTCMonth() + 1).toString().padStart(2, '0');
      const date = todayDate.getUTCDate().toString().padStart(2, '0');
      const todayDateString = `${year}-${month}-${date}`;
      expect(dateAsString(today())).toBe(todayDateString);
    });
  });
});
