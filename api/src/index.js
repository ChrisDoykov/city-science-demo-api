// Apollo Server
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
// import { ApolloServerPluginLandingPageDisabled } from "@apollo/server/plugin/disabled";
import { makeExecutableSchema } from "@graphql-tools/schema";

// Rate Limiting
import {
  rateLimitDirective,
  defaultKeyGenerator,
} from "graphql-rate-limit-directive";

// Depth Limiting
import depthLimit from "graphql-depth-limit";

// Standard Express and Node http
import http from "http";
import cors from "cors";
import bodyParser from "body-parser";
const { json } = bodyParser;
import express from "express";
import * as requestIp from "request-ip";

// Utils
import { env, tokenIsValid } from "./utils.js";

// Resolvers
import Query from "./resolvers/Query.js";
import Mutation from "./resolvers/Mutation.js";

// The main GraphQL schema
import typeDefs from "./schema.js";

// Import our DB
import db from "./models/index.js";
import { equals, includes } from "ramda";

const app = express();
const httpServer = http.createServer(app);

// Specifes how the rate limiter should determine uniqueness of operations
const keyGenerator = (directiveArgs, obj, args, context, info) =>
  `${context.ip}:${defaultKeyGenerator(
    directiveArgs,
    obj,
    args,
    context,
    info
  )}`;

const { rateLimitDirectiveTypeDefs, rateLimitDirectiveTransformer } =
  rateLimitDirective({ keyGenerator });

// Setup the resolvers
const resolvers = {
  Query,
  Mutation,
};

// Create the schema
const schema = rateLimitDirectiveTransformer(
  makeExecutableSchema({
    typeDefs: [rateLimitDirectiveTypeDefs, typeDefs],
    resolvers,
  })
);

let plugins = [ApolloServerPluginDrainHttpServer({ httpServer })];

/* Typically I'd disable the GraphQL playground in production
 * but in order for City Science devs to test I'm leaving it enabled.
 */

// if (!equals("localhost", env("NODE_ENV")))
//   plugins.push(ApolloServerPluginLandingPageDisabled());

const server = new ApolloServer({
  /* For the same reason above I'm leaving in introspection */
  // introspection: env("NODE_ENV") === "localhost",
  schema,
  plugins,
  validationRules: [depthLimit(7)],
});

/* Typically I like to use a CORS whitelist but
 * in this case I'm leaving it open for testing.
 */

const whitelist = env("ALLOWED_ORIGINS")
  ? env("ALLOWED_ORIGINS").split(",")
  : [];

// Ensure we wait for our server to start
server.start().then(() => {
  // Set up our Express middleware to handle CORS, body parsing,
  // and our expressMiddleware function.
  app.use(
    "/",
    cors({
      origin: (origin, callback) =>
        equals("localhost", process.env.NODE_ENV) || includes(origin, whitelist)
          ? callback(null, true)
          : callback("Forbidden origin."),
      credentials: true,
    }),
    json(),
    expressMiddleware(server, {
      context: async ({ req, res }) => ({
        isAuth: req?.headers?.cookie
          ? await tokenIsValid(req?.headers?.cookie, db)
          : false,
        db,
        ip: requestIp.getClientIp(req),
        res,
        req,
      }),
    })
  );

  // Start the server
  const port = env("PORT") || 4000;

  new Promise((resolve) =>
    httpServer.listen({ port }, () => {
      console.log(`🚀 Server ready at http://localhost:${port}/`);
      resolve();
    })
  );
});
