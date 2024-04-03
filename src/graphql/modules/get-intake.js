const { gql } = require('apollo-server-lambda');
const { getIntakeForCourse } = require('Services/get-intake');

const typeDefs = gql`
  "The Intake from date"
  type IntakeResponse {
    "The Course's ID"
    courseId: Int!
    "The Intake ID"
    intakeId: Int
    "Intake term start date"
    termStart: String
    "The Intake from date error object"
    errors: errorObject
  }

  "The Intake from date input"
  input IntakeResponseInput {
    "The Course's ID"
    courseId: Int!
    "Intake term start date"
    termStart: String
  }

  "The Intake from date error object"
  type errorObject {
    "The Course's ID"
    course_id: String
    "The Term Start Date"
    term_start: String
    "The Intake ID"
    intake_id: String
  }

  type Query {
    "Show intake for course from date"
    getIntakeForCourse(intakeRequest: [IntakeResponseInput]): [IntakeResponse]
  }
`;

const resolvers = {
  Query: {
    getIntakeForCourse: async (_, { intakeRequest }, { userId }) =>
      getIntakeForCourse({
        intakeRequest,
        userId,
      }),
  },
};

module.exports = {
  typeDefs,
  resolvers,
};
