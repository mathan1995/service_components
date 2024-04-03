/* eslint-disable camelcase */
const { gql } = require('apollo-server-lambda');
const { createSchedule } = require('Services/create-schedule');
const { createIntakeLevelSchedule } = require('Services/create-intake-schedule');

const typeDefs = gql`
  "Payload to create a new schedule"
  input CreateScheduleInput {
    "The institution that the course belongs to"
    institutionId: Int!
    "The course ID"
    courseId: Int!
    "The intake ID for intake level schedule - optional"
    intakeId: Int
    "The schedule's closing date"
    closingDate: String
    "The schedule's next open date"
    nextOpenDate: String
  }

  type Mutation {
    """
    Create a new schedule

    Auth: This is restricted to IDR user only
    """
    createSchedule(input: CreateScheduleInput!): Schedule
      @auth(
        roles: [
          "admin"
          "EntryFull"
          "EntryPartial"
          "QAFull"
          "QAPartial"
          "FormFull"
          "FormPartial"
        ]
      )
  }
`;

const resolvers = {
  Mutation: {
    createSchedule: (_, { input }, { userId }) => {
      if (!input.intakeId) {
        return createSchedule({
          userId,
          ...input,
        });
      }
      return createIntakeLevelSchedule({
        userId,
        ...input,
      });
    },
  },
};

module.exports = {
  typeDefs,
  resolvers,
};
