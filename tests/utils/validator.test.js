const validation = require('Utils/validator');
const ValidationError = require('Errors/ValidationError');

const createDateValidation = ({ date, comparedDate, rule }) => {
  const payload = {
    date,
  };

  const rules = {
    date: `${rule}:${comparedDate}`,
  };

  return validation(payload, rules);
};

describe('Utils/validator', () => {
  describe('date_after rule', () => {
    test('should fail if date is before compared date', () => {
      expect(() =>
        createDateValidation({
          date: '2022-01-01',
          comparedDate: '2022-01-02',
          rule: 'date_after',
        })
      ).toThrow(ValidationError);
    });

    test('should fail if date is on compared date', () => {
      expect(() =>
        createDateValidation({
          date: '2022-01-01',
          comparedDate: '2022-01-01',
          rule: 'date_after',
        })
      ).toThrow(ValidationError);
    });

    test('should pass if date is after compared date', () => {
      expect(() =>
        createDateValidation({
          date: '2022-01-02',
          comparedDate: '2022-01-01',
          rule: 'date_after',
        })
      ).not.toThrow(ValidationError);
    });
  });

  describe('date_after_or_on rule', () => {
    test('should fail if date is before compared date', () => {
      expect(() =>
        createDateValidation({
          date: '2022-01-01',
          comparedDate: '2022-01-02',
          rule: 'date_after_or_on',
        })
      ).toThrow(ValidationError);
    });

    test('should pass if date is on compared date', () => {
      expect(() =>
        createDateValidation({
          date: '2022-01-01',
          comparedDate: '2022-01-01',
          rule: 'date_after_or_on',
        })
      ).not.toThrow(ValidationError);
    });

    test('should pass if date is after compared date', () => {
      expect(() =>
        createDateValidation({
          date: '2022-01-02',
          comparedDate: '2022-01-01',
          rule: 'date_after_or_on',
        })
      ).not.toThrow(ValidationError);
    });
  });

  describe('date_before rule', () => {
    test('should pass if date is before compared date', () => {
      expect(() =>
        createDateValidation({
          date: '2022-01-01',
          comparedDate: '2022-01-02',
          rule: 'date_before',
        })
      ).not.toThrow(ValidationError);
    });

    test('should fail if date is on compared date', () => {
      expect(() =>
        createDateValidation({
          date: '2022-01-01',
          comparedDate: '2022-01-01',
          rule: 'date_before',
        })
      ).toThrow(ValidationError);
    });

    test('should fail if date is after compared date', () => {
      expect(() =>
        createDateValidation({
          date: '2022-01-02',
          comparedDate: '2022-01-01',
          rule: 'date_before',
        })
      ).toThrow(ValidationError);
    });
  });

  describe('date_before_or_on rule', () => {
    test('should pass if date is before compared date', () => {
      expect(() =>
        createDateValidation({
          date: '2022-01-01',
          comparedDate: '2022-01-02',
          rule: 'date_before_or_on',
        })
      ).not.toThrow(ValidationError);
    });

    test('should pass if date is on compared date', () => {
      expect(() =>
        createDateValidation({
          date: '2022-01-01',
          comparedDate: '2022-01-01',
          rule: 'date_before_or_on',
        })
      ).not.toThrow(ValidationError);
    });

    test('should fail if date is after compared date', () => {
      expect(() =>
        createDateValidation({
          date: '2022-01-02',
          comparedDate: '2022-01-01',
          rule: 'date_before_or_on',
        })
      ).toThrow(ValidationError);
    });
  });
});
