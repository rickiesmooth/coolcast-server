const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { APP_SECRET, getUserId } = require('../utils')

function getPrismaUser(ctx, fbid) {
  return ctx.db.query.user({ where: { fbid } })
}

async function createPrismaUser(ctx, facebookUser) {
  const user = await ctx.db.mutation.createUser({
    data: {
      fbid: facebookUser.id,
      email: facebookUser.email,
      name: facebookUser.name
    }
  })

  ctx.db.mutation.createUserHistory({
    data: {
      user: { connect: { id: user.id } },
      shows: []
    }
  })

  return user
}

async function getFacebookUser(facebookToken) {
  const endpoint = `https://graph.facebook.com/v2.12/me?fields=id%2Cemail%2Cname%2Cfriends&access_token=${facebookToken}`
  const data = await global.fetch(endpoint).then(response => response.json())
  if (data.error) {
    throw new Error(JSON.stringify(data.error))
  }

  return data
}

async function authenticate(parent, { facebookToken }, ctx, info) {
  const facebookUser = await getFacebookUser(facebookToken)
  let user = await getPrismaUser(ctx, facebookUser.id)

  if (!user) {
    user = await createPrismaUser(ctx, facebookUser)
  }

  return {
    token: jwt.sign({ userId: user.id }, APP_SECRET),
    user
  }
}

async function addPlay(parent, { episodeId, showId, sessionId }, ctx, info) {
  const userId = getUserId(ctx)

  if (sessionId) {
    console.log('✨sessionId', sessionId)
    // for src
    return ctx.db.query.podcastPlay({ where: { id: sessionId } }, info)
  }

  const play = await ctx.db.mutation.createPodcastPlay(
    {
      data: {
        user: { connect: { id: userId } },
        episode: { connect: { id: episodeId } }
      }
    },
    info
  )

  const user = await ctx.db.query.user(
    { where: { id: userId } },
    '{ history { id shows { id show { showId } } } }'
  )

  const inHistory = user.history.shows.find(e => e.show.showId === showId)

  if (!inHistory) {
    // not in history
    ctx.db.mutation.updateUserHistory(
      {
        where: { id: user.history.id },
        data: {
          shows: {
            create: {
              show: { connect: { showId: showId } },
              plays: { connect: { id: play.id } }
            }
          }
        }
      },
      info
    )
  } else {
    ctx.db.mutation.updateUserHistoryShow(
      {
        where: { id: inHistory.id },
        data: {
          plays: { connect: { id: play.id } }
        }
      },
      info
    )
    // update userhistory show
  }
  return play
}

function addPlaylist(parent, { name }, ctx, info) {
  const userId = getUserId(ctx)
  return ctx.db.mutation.createPlaylist(
    {
      data: {
        name,
        user: { connect: { id: userId } }
      }
    },
    info
  )
}

async function followUser(parent, { userId }, ctx, info) {
  const currentUserId = getUserId(ctx)
  console.log('✨userId', userId)
  ctx.db.mutation.updateUser(
    {
      where: { id: userId },
      data: {
        followers: {
          connect: { id: currentUserId }
        }
      }
    },
    info
  )
  return ctx.db.mutation.updateUser(
    {
      where: { id: currentUserId },
      data: {
        following: {
          connect: { id: userId }
        }
      }
    },
    info
  )
}

async function removePlaylist(parent, { id }, ctx, info) {
  const userId = getUserId(ctx)
  console.log('✨userId', userId) // check if owns playlist
  return ctx.db.mutation.deletePlaylist({ where: { id } }, info)
}

function updatePlay(parent, { sessionId, progress }, ctx, info) {
  const userId = getUserId(ctx)
  return ctx.db.mutation.updatePodcastPlay(
    {
      where: { id: sessionId },
      data: { progress }
    },
    info
  )
}

function updatePlaylist(parent, { playlistId, episodeId }, ctx, info) {
  // const userId = getUserId(ctx)
  return ctx.db.mutation.updatePlaylist(
    {
      where: { id: playlistId },
      data: {
        episodes: { connect: { id: episodeId } }
      }
    },
    info
  )
}

module.exports = {
  authenticate,
  addPlay,
  followUser,
  addPlaylist,
  updatePlaylist,
  removePlaylist,
  updatePlay,
  deleteUser: (parent, { userId }, ctx, info) => {
    return ctx.db.mutation.deleteUser({ where: { id: userId } }, '{ id }')
  }
}
