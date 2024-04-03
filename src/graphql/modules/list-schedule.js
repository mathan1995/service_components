/* eslint-disable camelcase */
const { gql } = require('apollo-server-lambda');
const { listSchedule } = require('Services/list-schedule');

const typeDefs = gql`
  "Pagination Inputs for course schedule list"
  input PaginationInput {
    offset: Int!
    limit: Int!
  }

  "Sort schedule by Ascending or Descending order"
  enum SortOrder {
    ASC
    DESC
  }

  "Sort inputs for course schedule list"
  input SortInput {
    fieldName: String!
    order: SortOrder!
  }

  "The course schedule list"
  type CourseScheduleList {
    data: [Schedule]
    total: Int
    offset: Int
    limit: Int
  }

  type Query {
    "List schedule by course ID"
    listSchedule(courseId: Int!, paginate: PaginationInput, sort: SortInput): CourseScheduleList
  }
`;

const resolvers = {
  Query: {
    listSchedule: (_, { courseId, paginate, sort }, { userId }) =>
      listSchedule({
        userId,
        courseId,
        paginate,
        sort,
      }),
  },
};

module.exports = {
  typeDefs,
  resolvers,
};
