import {
  getTrafficDataBetweenYears,
  // importDataFromCsv,
} from "./queries/data.js";
import { userIsLoggedIn } from "./queries/user.js";

export default {
  hello: (_, __, { isAuth }) => {
    return isAuth ? `Hello world!` : "Someone's been a bad boy ;)";
  },
  getTrafficDataBetweenYears,
  userIsLoggedIn,
  // importDataFromCsv,
};
