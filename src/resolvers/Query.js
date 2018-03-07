const { getUserId } = require('../utils')
const GET_FEED_URL =
  'https://us-central1-personal-180010.cloudfunctions.net/getFeed'

const API_URL = 'https://itunes.apple.com'

// create a new prisma binding instance on demand
async function createShow(ctx, showId) {
  const { results } = await global
    .fetch(`${API_URL}/lookup?id=${showId}`)
    .then(res => res.json())
  const episodes = await global
    .fetch(`${GET_FEED_URL}?url=${results[0].feedUrl}`)
    .then(res => res.json())
    .catch(error => console.error('Error:', error))
  return ctx.db.mutation.createShow(
    {
      data: {
        title: encodeURI(results[0].collectionName),
        showId,
        thumbLarge: results[0].artworkUrl600,
        episodes: {
          create: episodes
        }
      }
    },
    `{
      id
      title
      thumbLarge
      episodes { id title } }`
  )
}

module.exports = {
  show: async (parent, { showId }, ctx, info) => {
    const userId = getUserId(ctx)
    const query = `{
      id
      title
      thumbLarge
      episodes {
        id
        title
        plays(where: { user: { id: "${userId}" } }) {
          id
          progress
        }
      }
    }`
    const show = await ctx.db.query.show({ where: { showId } }, query)
    if (!show) {
      return createShow(ctx, showId)
    } else {
      return show
    }
  },
  playlist: async (parent, { id }, ctx, info) => {
    return ctx.db.query.playlist({ where: { id } }, info)
  },
  me: async (parent, args, ctx, info) => {
    const userId = getUserId(ctx)
    if (userId) {
      return ctx.db.query.user({ where: { id: userId } }, info)
    }
  },
  user: async (parent, { userId }, ctx, info) => {
    return ctx.db.query.user({ where: { id: userId } }, info)
  },
  users: async (parent, args, ctx, info) => {
    return ctx.db.query.users(null, '{ id }')
  }
}
