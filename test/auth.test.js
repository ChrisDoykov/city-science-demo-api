import { ApolloServer } from "@apollo/server";
import { assert, expect } from "chai";
import typeDefs from "../api/src/schema.js";
// Resolvers
import Query from "../api/src/resolvers/Query.js";
import Mutation from "../api/src/resolvers/Mutation.js";

// Context
import db from "../api/src/models/index.js";
import { head, omit, prop } from "ramda";

const REGISTER_TEST_MUTATION = `mutation RegisterMutation($name: String!, $email: String!, $password: String!) { 
              register(name: $name, email: $email, password: $password) {
                name
              }
           }`;
const LOGIN_TEST_MUTATION = `mutation LoginMutation($email: String!, $password: String!) { 
              login(email: $email, password: $password) {
                name
              }
           }`;

const VARIABLES = {
  name: "Test Account",
  email: "test@noonesdomain.com",
  password: "1234567",
};

const resolvers = {
  Query,
  Mutation,
};

let testServer;

describe("auth tests", function () {
  // Setup
  before(async function () {
    testServer = new ApolloServer({
      typeDefs,
      resolvers,
    });

    // Ensure our test user does not exist
    await db.User.destroy({
      where: {
        email: prop("email", VARIABLES),
      },
    });
  });

  // Teardown
  after(async function () {
    // Ensure our test user is deleted after testing
    await db.User.destroy({
      where: {
        email: prop("email", VARIABLES),
      },
    });
  });

  // ############################### ORDER MATTERS ###############################

  it("registering a user succeeds with correct input", async () => {
    const response = await testServer?.executeOperation(
      {
        query: REGISTER_TEST_MUTATION,
        variables: VARIABLES,
      },
      {
        contextValue: {
          isAuth: false,
          db,
          testing: true,
        },
      }
    );

    assert(response.body.kind === "single");
    expect(response.body.singleResult.errors).to.be.undefined;
    expect(response.body.singleResult.data?.register?.name).to.equal(
      prop("name", VARIABLES)
    );
  });

  it("registering a user fails when email is taken", async () => {
    const response = await testServer?.executeOperation(
      {
        query: REGISTER_TEST_MUTATION,
        variables: VARIABLES,
      },
      {
        contextValue: {
          isAuth: false,
          db,
          testing: true,
        },
      }
    );

    assert(response.body.kind === "single");
    expect(response.body.singleResult.errors).to.exist;
    expect(prop("message", head(response.body.singleResult.errors))).to.include(
      "Validation error"
    );
  });

  it("login succeeds with correct credentials", async () => {
    const response = await testServer?.executeOperation(
      {
        query: LOGIN_TEST_MUTATION,
        variables: omit(["name"], VARIABLES),
      },
      {
        contextValue: {
          isAuth: false,
          db,
          testing: true,
        },
      }
    );

    assert(response.body.kind === "single");
    expect(response.body.singleResult.errors).to.be.undefined;
    expect(response.body.singleResult.data?.login?.name).to.equal(
      prop("name", VARIABLES)
    );
  });

  it("login fails with incorrect credentials", async () => {
    const response = await testServer?.executeOperation(
      {
        query: LOGIN_TEST_MUTATION,
        variables: {
          email: prop("email", VARIABLES),
          password: "wrongpass",
        },
      },
      {
        contextValue: {
          isAuth: false,
          db,
          testing: true,
        },
      }
    );

    assert(response.body.kind === "single");
    expect(response.body.singleResult.errors).to.exist;
    expect(prop("message", head(response.body.singleResult.errors))).to.equal(
      "Incorrect password!"
    );
  });
});
