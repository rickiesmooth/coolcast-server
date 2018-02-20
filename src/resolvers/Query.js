const { getUserId } = require('../utils')

module.exports = {
  shows: async (parent, { id }, ctx, info) => {
    return ctx.db.query.shows({ where: { showId: id } }, info)
  },
  playlists: async (parent, { id }, ctx, info) => {
    return ctx.db.query.playlists({ where: { id: id } }, info)
  },
  me: async (parent, args, ctx, info) => {
    const id = getUserId(ctx)
    return ctx.db.query.user({ where: { id } }, info)
  },
  plays: async (parent, args, ctx, info) => {
    return ctx.db.query.podcastPlays(null, '{ id }')
  },
  users: async (parent, args, ctx, info) => {
    return ctx.db.query.users(null, '{ id name playlists {id name} }')
  },
  user: async (parent, { userId }, ctx, info) => {
    return ctx.db.query.user({ where: { id: userId } }, info)
  }
}
