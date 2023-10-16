import { ApolloServer } from "@apollo/server";
import depthLimit from "graphql-depth-limit";
import { assert, expect } from "chai";
import typeDefs from "../api/src/schema.js";
// Resolvers
import Query from "../api/src/resolvers/Query.js";
import Mutation from "../api/src/resolvers/Mutation.js";

it("returns the correct response when user is not logged in", async () => {
  const resolvers = {
    Query,
    Mutation,
  };
  const testServer = new ApolloServer({
    typeDefs,
    resolvers,
    validationRules: [depthLimit(3)],
  });

  const response = await testServer.executeOperation(
    {
      query: "query HelloWorld { hello }",
    },
    {
      contextValue: {
        isAuth: false,
      },
    }
  );

  assert(response.body.kind === "single");
  expect(response.body.singleResult.errors).to.be.undefined;
  expect(response.body.singleResult.data?.hello).to.equal(
    "Someone's been a bad boy ;)"
  );
});

it("returns the correct response when user is logged in", async () => {
  const resolvers = {
    Query,
    Mutation,
  };
  const testServer = new ApolloServer({
    typeDefs,
    resolvers,
    validationRules: [depthLimit(3)],
  });

  const response = await testServer.executeOperation(
    {
      query: "query HelloWorld { hello }",
    },
    {
      contextValue: {
        isAuth: true,
      },
    }
  );

  assert(response.body.kind === "single");
  expect(response.body.singleResult.errors).to.be.undefined;
  expect(response.body.singleResult.data?.hello).to.equal("Hello world!");
});
