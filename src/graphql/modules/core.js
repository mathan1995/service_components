const { gql } = require('apollo-server-lambda');
const { sampleFunction } = require('Services/sample-function');

const typeDefs = gql`
  "Auth directive for permissions and roles"
  directive @auth(
    "Authorization to check if the requested user has the correct role/roles to access specific schema"
    roles: [String]
  ) on OBJECT | FIELD_DEFINITION

  "A schedule to close application to a course"
  type Schedule {
    "The schedule's ID"
    id: Int!
    "The user that created this schedule"
    userId: Int!
    "The institution that the course belongs to"
    institutionId: Int!
    "The course ID"
    courseId: Int!
    "The intake ID for intake level schedule - optional"
    intakeId: Int
    "The schedule's closing date"
    closingDate: String!
    "The schedule's next open date"
    nextOpenDate: String
    "The schedule's cancel date"
    cancelledDate: String
  }

  extend type Query {
    "Test Query"
    hello: String
  }
`;

const resolvers = {
  Query: {
    hello: () => sampleFunction(),
  },
};

module.exports = {
  typeDefs,
  resolvers,
};
