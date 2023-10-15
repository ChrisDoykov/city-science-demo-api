/* Simply return the outcome of the isAuth middleware */
export const userIsLoggedIn = (_, __, { isAuth }) => isAuth;
