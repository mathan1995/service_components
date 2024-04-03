const { mergeResolvers, mergeTypeDefs } = require('@graphql-tools/merge');
const core = require('./core');
const createSchedule = require('./create-schedule');
const cancelSchedule = require('./cancel-schedule');
const listSchedule = require('./list-schedule');
const getStatus = require('./get-status');
const getIntake = require('./get-intake');

const typeDefs = [];
const resolvers = [];

// Merge all typeDefs and resolvers for the provided modules
const modules = [core, createSchedule, cancelSchedule, listSchedule, getStatus, getIntake];
modules.forEach((module) => {
  typeDefs.push(module.typeDefs);
  resolvers.push(module.resolvers);
});

module.exports = {
  typeDefs: mergeTypeDefs(typeDefs),
  resolvers: mergeResolvers(resolvers),
};
