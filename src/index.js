require('isomorphic-fetch')

const { GraphQLServer } = require('graphql-yoga')
const { Prisma } = require('prisma-binding')
const Query = require('./resolvers/Query')
const Mutation = require('./resolvers/Mutation')

const resolvers = { Query, Mutation }

const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers,
  context: req => ({
    ...req,
    db: new Prisma({
      typeDefs: 'src/generated/prisma.graphql',
      // endpoint: 'https://eu1.prisma.sh/rick/hackernews-graphql-js/dev',
      // endpoint: 'http://192.168.1.241:4466/hackernews-graphql-js/dev',
      endpoint: process.env.PRISMA_ENDPOINT,
      secret: 'mysecret123'
    })
  })
})

server.start(() => console.log('Server is running on http://localhost:4000'))
