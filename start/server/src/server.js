const { ApolloServer } = require("apollo-server");

const typeDefs = require("./schema");
const resolvers = require("./resolvers");

const LaunchDataSource = require("./datasources/LaunchDataSource");
const UserDataSource = require("./datasources/UserDataSource");

const { createStore } = require("./utils");
const isEmail = require("isemail");

const store = createStore();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    // simple auth check on every request
    const auth = (req.headers && req.headers.authorization) || "";
    const email = Buffer.from(auth, "base64").toString("ascii");
    // if the email isn't formatted validly, return null for user
    if (!isEmail.validate(email)) return { user: null };
    // find a user by their email
    const users = await store.users.findOrCreate({ where: { email } });
    const user = users && users[0] ? users[0] : null;

    return { user: { ...user.dataValues } };
  },
  dataSources: () => ({
    LaunchDataSource: new LaunchDataSource(),
    UserDataSource: new UserDataSource({ store })
  }),
  introspection: true,
  engine: {
    //TO PUSH API FROM TERMINAL TO APOLLO ENGINE 
    //npx apollo service: push--endpoint=http://localhost:4000
    //apiKey: "service:LeakeyMaina-7182:fy-8DBcvNV9vBN3SbdkGFQ"
    apiKey: process.env.ENGINE_API_KEY
  }
});

//const port = process.env.PORT || 5000;
//server.listen(port).then(({ url }) => {


server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
