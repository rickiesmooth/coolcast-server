require('isomorphic-fetch')

const { GraphQLServer } = require('graphql-yoga')
const { Prisma, extractFragmentReplacements } = require('prisma-binding')
const Query = require('./resolvers/Query')
const Mutation = require('./resolvers/Mutation')
// const User = require('./resolvers/User')

const resolvers = { Query, Mutation }

const fragmentReplacements = extractFragmentReplacements({ Query })

const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers,
  context: req => ({
    ...req,
    db: new Prisma({
      fragmentReplacements,
      typeDefs: 'src/generated/prisma.graphql',
      endpoint: process.env.PRISMA_ENDPOINT,
      secret: process.env.PRISMA_SECRET
    })
  })
})

server.start(() => console.log('Server is running on http://localhost:4000'))
