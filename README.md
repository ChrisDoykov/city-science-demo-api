# City Science Demo GraphQL API

A demo API that enables authenticated users to fetch traffic data between given years.

## Installation

In order to install the API locally, you need to place the `.env` I've provided you with inside the root of the project (next to the Dockerfile) and run:

```bash
yarn docker
```

This will get the API up and running on port 4000. Visiting `http://localhost:4000/` should open up the local Apollo Studio Sandbox which you can use to test the resolvers.

## Testing

In order to run all the unit tests for the API use the following command:

```bash
yarn test
```

**IMPORTANT:** Since the API uses cookie-based auth, you need to enable the sending of cookies between the Sandbox and the API by visiting Apollo Sandbox -> Settings (Gear Icon on top left next to the API URL) -> Toggling the "Include cookies" switch. This goes both for `localhost` and the official

**NOTE:** Obviously both the client app and the API could be made a lot more bullet-proof but the point of this project is to serve as a demo and an example of how much I can get done in a day or two.
