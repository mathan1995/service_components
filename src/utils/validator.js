const Validator = require('validatorjs');
const ValidationError = require('Errors/ValidationError');

const isValidDate = (dateString) => !Number.isNaN(Date.parse(dateString));

Validator.register(
  'date_after',
  (val, req) => isValidDate(val) && isValidDate(req) && new Date(val) > new Date(req),
  'The :attribute must be after :date_after.'
);

Validator.register(
  'date_after_or_on',
  (val, req) => isValidDate(val) && isValidDate(req) && new Date(val) >= new Date(req),
  'The :attribute must be on or after :date_after_or_on.'
);

Validator.register(
  'date_before',
  (val, req) => isValidDate(val) && isValidDate(req) && new Date(val) < new Date(req),
  'The :attribute must be before :date_before.'
);

Validator.register(
  'date_before_or_on',
  (val, req) => isValidDate(val) && isValidDate(req) && new Date(val) <= new Date(req),
  'The :attribute must be on or before :date_before_or_on.'
);

const validation = (body, rules, customMessages, attributeValues) => {
  const validate = new Validator(body, rules, customMessages);

  const attributeValueList = attributeValues || {
    userId: 'user ID',
    institutionId: 'institution ID',
    courseId: 'course ID',
    intakeId: 'intake ID',
    closingDate: 'closing date',
    nextOpenDate: 'next open date',
  };

  validate.setAttributeNames(attributeValueList);

  if (validate.fails()) {
    const errors = validate.errors.all();
    const [firstError] = Object.values(errors);
    throw new ValidationError(firstError);
  }
};

module.exports = validation;
