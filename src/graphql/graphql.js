const { makeExecutableSchema } = require('@graphql-tools/schema');
const { wrapSchema, RenameTypes, RenameRootFields } = require('@graphql-tools/wrap');
const { UserInputError } = require('apollo-server-errors');
const { ApolloServer } = require('apollo-server-lambda');
const Dataloader = require('dataloader');
const { prefix } = require('Config/graphql');
const ValidationError = require('Errors/ValidationError');
const { typeDefs, resolvers } = require('Graphql/modules');
const { getIdFromToken } = require('Utils/auth');
const { getSchedulesByCourseIds } = require('Services/get-status');
const { authDirectiveTransformer } = require('./directives/authDirective');

let schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

schema = authDirectiveTransformer(schema, 'auth');

schema = wrapSchema({
  schema,
  transforms: [
    // Add prefix for Type, excluding Query, Mutation, and Subscription
    new RenameTypes((name) => `${prefix}${name}`),
    // Add prefix for fields on the Query, Mutation, and Subscription
    new RenameRootFields((_, fieldName) => `${prefix}${fieldName}`),
  ],
});

const server = new ApolloServer({
  schema,
  csrfPrevention: true,
  cache: 'bounded',
  context: ({ event }) => {
    // Get user ID from access token in Authorization header
    const accessToken = event?.headers?.Authorization || '';
    const userId = getIdFromToken(accessToken);

    const dataloader = {
      getStatusLoader: new Dataloader(getSchedulesByCourseIds),
    };

    return {
      accessToken,
      userId,
      dataloader,
    };
  },
  formatError: (err) => {
    // Convert ValidationError to UserInputError
    if (
      err?.originalError instanceof ValidationError ||
      err?.originalError?.originalError instanceof ValidationError
    ) {
      return new UserInputError(err.message);
    }

    // Otherwise return the original error. The error can also
    // be manipulated in other ways, as long as it's returned.
    return err;
  },
});

exports.graphqlHandler = server.createHandler();
