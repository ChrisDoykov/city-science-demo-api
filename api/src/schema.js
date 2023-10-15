export default `
scalar DateTime
scalar JSON

type User {
    id: ID!
    name: String!
    email: String!
    createdAt: DateTime
    updatedAt: DateTime
}

type Record {
    id: ID!
    key: String!
    url: String!
    updatedAt: DateTime!
    createdAt: DateTime!
}

type Query {
    hello: String!
    getTrafficDataBetweenYears(fromYear: Int, toYear: Int): Record
    userIsLoggedIn: Boolean!
}

type Mutation {
    hello: String!
    register(name: String!, email: String!, password: String!): User
    login(email: String!, password: String!): User
    logout: Boolean!
}
`;
