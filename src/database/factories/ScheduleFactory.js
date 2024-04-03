const { faker } = require('@faker-js/faker');
const { Schedule } = require('../models');

const data = (props = {}) => {
  const defaultProps = {
    id: faker.datatype.number(),
    userId: faker.datatype.number(),
    studentId: faker.datatype.number(),
    institutionId: faker.datatype.number(),
    courseId: faker.datatype.number(),
    closingDate: faker.date.future(),
    nextOpenDate: faker.date.future(),
    cancelledDate: faker.date.future(),
  };
  return { ...defaultProps, ...props };
};

const factory = (props = {}) => Schedule.create(data(props));

module.exports = {
  data,
  factory,
};
