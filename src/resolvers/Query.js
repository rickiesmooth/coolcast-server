const { getUserId } = require('../utils')
const { Prisma } = require('prisma-binding')

// create a new prisma binding instance on demand
const getPrismaLink = () =>
  new Prisma({
    typeDefs: 'src/generated/prisma.graphql',
    endpoint: process.env.PRISMA_ENDPOINT,
    secret: process.env.PRISMA_SECRET,
    debug: false
  })

module.exports = {
  shows: async (parent, { id }, ctx, info) => {
    return ctx.db.query.shows({ where: { showId: id } }, info)
  },
  playlists: async (parent, { id }, ctx, info) => {
    return ctx.db.query.playlists({ where: { id: id } }, info)
  },
  me: async (parent, args, ctx, info) => {
    const id = getUserId(ctx)
    return getPrismaLink().query.user({ where: { id } }, info)
  },
  plays: async (parent, args, ctx, info) => {
    return ctx.db.query.podcastPlays(null, '{ id }')
  },
  users: async (parent, args, ctx, info) => {
    return ctx.db.query.users(null, '{ id }')
  },
  user: async (parent, { userId }, ctx, info) => {
    return ctx.db.query.user({ where: { id: userId } }, info)
  }
}
