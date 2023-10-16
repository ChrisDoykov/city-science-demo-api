import { expect } from "chai";

import db from "../api/src/models/index.js";

it("tests that we can connect to the db from tests", async () => {
  const users = await db.User.findAll();

  expect(users).to.not.be.empty;
});
