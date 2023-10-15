import bcrypt from "bcryptjs";
import { generateSessionCookie, setSessionCookie } from "../../utils.js";
import { prop } from "ramda";
import { GraphQLError } from "graphql";

export async function register(
  _,
  { name, email, password },
  { res, db, isAuth }
) {
  if (isAuth) return null;

  try {
    const hashedPass = await bcrypt.hash(password, 8);
    const user = await db.User.create({
      name,
      email,
      password: hashedPass,
    });

    // Create token for the user
    const sessionCookieToken = generateSessionCookie(user?.id);

    // Add token as a cookie
    setSessionCookie(res, sessionCookieToken);

    return user;
  } catch (error) {
    console.error("Failed to register user: ", error);
    throw new GraphQLError(
      `Failed to register! (${prop("message", error) || error})`,
      {
        extensions: { code: "REG_FAIL" },
      }
    );
  }
}

export async function login(_, { email, password }, { res, db, isAuth }) {
  if (isAuth) return null;

  // Lookup user by email
  let userFromEmail = await db.User.findOne({
    where: {
      email,
    },
  });

  if (!userFromEmail)
    throw new GraphQLError("Failed to find user.", {
      extensions: { code: "NO_USER" },
    });

  const valid = await bcrypt.compare(password, userFromEmail.password);

  if (!valid)
    throw new GraphQLError("Incorrect password!", {
      extensions: { code: "WRONG_PASS" },
    });

  // Create token for the user
  const sessionCookieToken = generateSessionCookie(userFromEmail?.id);

  // Add token as a cookie
  setSessionCookie(res, sessionCookieToken);

  return userFromEmail;
}

export async function logout(_, __, { res }) {
  res.clearCookie("sessionToken");
  return true;
}
