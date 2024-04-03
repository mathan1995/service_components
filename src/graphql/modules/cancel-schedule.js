const { gql } = require('apollo-server-lambda');
const { cancelSchedule } = require('Services/cancel-schedule');

const typeDefs = gql`
  "Payload to cancel existing schedule"
  input CancelScheduleInput {
    "The schedule ID"
    scheduleId: Int!
  }

  extend type Mutation {
    """
    Cancel a schedule by ID

    Auth: This is restricted to IDR user only
    """
    cancelSchedule(input: CancelScheduleInput!): Schedule
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
    cancelSchedule: (_, { input }, { userId }) =>
      cancelSchedule({
        userId,
        ...input,
      }),
  },
};

module.exports = {
  typeDefs,
  resolvers,
};
