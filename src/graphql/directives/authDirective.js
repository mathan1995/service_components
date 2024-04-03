const { mapSchema, getDirective, MapperKind } = require('@graphql-tools/utils');
const { ForbiddenError } = require('apollo-server-errors');
const { defaultFieldResolver } = require('graphql');
const axios = require('axios');
const { skipAccessTokenCheck } = require('Config/app');
const config = require('Config/services');

// Associative array to cache token results in memory
const tokenCache = {};

const getUserRoles = async ({ accessToken, userId, url }) => {
  // Use cache if exist
  if (accessToken && tokenCache[accessToken]) {
    return tokenCache[accessToken];
  }

  // Use Udify URL if no custom base URL is provided
  const baseUrl = url ?? config.udify.url;
  try {
    const response = await axios.get(`${baseUrl}/api/v2/users/${userId}`, {
      headers: {
        // Ensure only one occurrence of "Bearer"
        Authorization: `Bearer ${accessToken.replace(/Bearer/g, '')}`,
      },
    });

    tokenCache[accessToken] = response.data.data.roles;
    return tokenCache[accessToken];
  } catch (error) {
    console.log(error);
    // Try with Inventory URL first before failing
    if (config.inventory.url && baseUrl !== config.inventory.url) {
      return getUserRoles({ accessToken, userId, url: config.inventory.url });
    }
    throw new ForbiddenError('Not Authorized!');
  }
};

// eslint-disable-next-line arrow-body-style
const authDirectiveTransformer = (schema, directiveName) => {
  return mapSchema(schema, {
    // Executes once for each object field in the schema
    // eslint-disable-next-line consistent-return
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      // Check whether this field has the specified directive
      const authDirective = getDirective(schema, fieldConfig, directiveName)?.[0];

      if (!skipAccessTokenCheck && authDirective) {
        const { resolve = defaultFieldResolver } = fieldConfig;
        // eslint-disable-next-line no-param-reassign, func-names
        fieldConfig.resolve = async function (source, args, context, info) {
          // Get user roles from UdifyAPI
          const roles = await getUserRoles(context);

          const directiveRoles = new Set(authDirective.roles);
          const hasAccess = roles.some((role) => directiveRoles.has(role.name));

          if (!hasAccess && authDirective.roles.length > 0) {
            throw new ForbiddenError('Not Authorized!');
          }

          const result = await resolve.call(this, source, args, context, info);
          return result;
        };
        return fieldConfig;
      }
    },
  });
};

module.exports = {
  authDirectiveTransformer,
  getUserRoles,
};
