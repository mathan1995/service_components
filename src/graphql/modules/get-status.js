const { gql } = require('apollo-server-lambda');
const { getStatus } = require('Services/get-status');

const typeDefs = gql`
  "The currently active schedule"
  type CurrentSchedule {
    "The schedule's ID"
    id: Int!
    "The schedule's closing date"
    closingDate: String!
    "The schedule's next open date"
    nextOpenDate: String
  }

  "The course level status and it's current schedule"
  type CourseLevel {
    closed: Boolean
    currentSchedule: CurrentSchedule
  }

  "The intake level status and it's current schedule"
  type IntakeLevel {
    intakeId: Int!
    closed: Boolean
    currentSchedule: CurrentSchedule
  }

  "The control status of a course"
  type ControlStatus {
    courseId: Int!
    courseLevel: CourseLevel
    intakeLevels: [IntakeLevel]
  }

  type Query {
    "Show schedule status by course ID"
    getStatus(courseId: [Int]!): [ControlStatus]
  }
`;

const resolvers = {
  Query: {
    getStatus: async (_, { courseId }, { userId, dataloader }) =>
      getStatus(
        {
          userId,
          courseId,
        },
        dataloader
      ),
  },
};

module.exports = {
  typeDefs,
  resolvers,
};
