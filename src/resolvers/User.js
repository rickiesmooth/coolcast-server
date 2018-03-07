const { getUserId } = require('../utils')

module.exports = {
  onlyEpisodesWithHistory: {
    fragment: `fragment Play on Show { id }`,
    resolve: async ({ id }, args, ctx, info) => {
      const withPlays = await getHistory(ctx, id)
      // const all =
      // console.log('✨all', all)
      return withPlays[0].episodes.filter(ep => ep.plays.length > 0)
    }
  }
}

function getHistory(ctx, id) {
  const userId = getUserId(ctx)
  const query = `{
    episodes {
      id
      title
      src
      plays(where: { user:{id: "${userId}"} }) {
        id
        progress
        episode {
          id
          title
          src
        }
      }
    }
  }`
  return ctx.db.query.shows({ where: { id } }, query)
}
