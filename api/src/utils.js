import jwt from "jsonwebtoken"; // For generating JWTs
import { includes } from "ramda";

export const env = (key) => {
  if (process.env[key]) return process.env[key].trim();
  return null;
};

export const getTokenPayload = (token) => jwt.verify(token, env("APP_SECRET"));

export const setSessionCookie = (res, sessionCookie) => {
  // Add token as a cookie
  res.cookie("sessionToken", sessionCookie, {
    httpOnly: true,
    secure: true,
    sameSite: env("NODE_ENV") !== "localhost",
    maxAge: 60 * 60 * 1000, // 1 hour
  });
};

export const generateSessionCookie = (userId) =>
  jwt.sign({ userId }, env("APP_SECRET"), { expiresIn: "1h" });

export const tokenIsValid = async (cookie, db) => {
  try {
    const tokenPair = cookie
      .split("; ")
      .find((pair) => includes("sessionToken", pair));

    let userId;
    try {
      const { userId: id } = getTokenPayload(
        tokenPair?.replace("sessionToken=", "")
      );

      userId = id || null;
    } catch (error) {
      // Invalid token
      console.error(error);
      return false;
    }

    if (userId) {
      const user = await db.User.findOne({
        where: {
          id: userId,
        },
      });

      // User is not found in our db
      if (!user?.id) return false;

      // User is found and the token is valid
      return true;
    }

    return false;
  } catch (error) {
    console.error(error);
    return false;
  }
};
