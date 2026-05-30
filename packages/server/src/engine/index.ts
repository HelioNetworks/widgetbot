import config from 'config'
import { Client } from 'discord.js'
import * as Discord from 'discord.js'
import Commands from 'engine/commands'
import inCache from 'engine/inCache'
import options from 'engine/options'
import PlayingStatus from 'engine/util/playing-status'
import logger, { Meta } from 'logger'

import { io } from 'app'
import Guests from './guests'
import MessageStore from './message-store'
import Parse from './util/parse'
import Member from './util/parse/member'

export const client = new Client(options)
export const cache = new MessageStore()
export const guests = new Guests()

export async function Login(token: string) {
  const meta = Meta('Discord')

  await client.login(token)
  await new Promise<void>(resolve => {
    client.on('clientReady', () => resolve())
  })
  // await async(client).on('ready')

  // Start toggling playing status
  if (config.discord.statuses && config.discord.statuses.length) PlayingStatus.start()
  else client.user.setPresence({ activities: [{ name: null }] })

  /**
   * Message events
   */
  client.on('messageCreate', data => {
    // Command engine
    if (data.mentions.users.has(client.user.id)) Commands(data)

    inCache(data, async ({ server, channel }) => {
      const message = await Parse(data)
      cache.pushMessage({ server, channel }, message)

      io.to(`${server}/${channel}`).emit('message', {
        channel,
        message
      })
    })
  })

  /**
   * Message edit events
   */
  client.on('messageUpdate', (_, data) => {
    inCache({ guild: data.guild, channel: data.channel }, async ({ server, channel }) => {
      const message = await Parse(data as Discord.Message)
      cache.editMessage({ server, channel }, message)

      io.to(`${server}/${channel}`).emit('messageUpdate', {
        channel,
        message
      })
    })
  })

  /**
   * Message delete events
   */
  client.on('messageDelete', data => {
    inCache(data, async ({ server, channel }) => {
      cache.deleteMessage({ server, channel }, data.id)

      io.to(`${server}/${channel}`).emit('messageDelete', {
        channel,
        id: data.id
      })
    })
  })

  client.on('messageDeleteBulk', messages => {
    const data = messages.first()

    inCache(data, async ({ server, channel }) => {
      const ids = messages.map(message => message.id)

      cache.deleteMessage({ server, channel }, ids)

      io.to(`${server}/${channel}`).emit('messageDeleteBulk', {
        channel,
        ids
      })
    })
  })

  /**
   * Message reaction events
   */
  client.on('messageReactionAdd', data => {
    const { message } = data

    inCache(message, async ({ server, channel }) => {
      const reaction = {
        name: data.emoji.name,
        id: data.emoji.id,
        count: data.count
      }

      cache.addReaction({ server, channel }, message.id, reaction)

      io.to(`${server}/${channel}`).emit('messageReactionAdd', {
        channel,
        id: message.id,
        reaction
      })
    })
  })

  client.on('messageReactionRemove', data => {
    const { message } = data

    inCache(message, async ({ server, channel }) => {
      const reaction = {
        name: data.emoji.name,
        id: data.emoji.id,
        count: data.count
      }

      cache.removeReaction({ server, channel }, message.id, reaction)

      io.to(`${server}/${channel}`).emit('messageReactionRemove', {
        channel,
        id: message.id,
        reaction
      })
    })
  })

  /**
   * Join events
   */
  client.on('guildCreate', guild => {
    logger.info(`Joined server`, {
      ...meta('join'),
      discord: 'logs',
      name: guild.name,
      memberCount: guild.memberCount,
      id: guild.id
    })
  })

  client.on('guildDelete', guild => {
    logger.info(`Left server`, {
      ...meta('kick'),
      discord: 'logs',
      name: guild.name,
      memberCount: guild.memberCount,
      id: guild.id
    })
  })

  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const oldName = oldMember.displayName
    const newName = newMember.displayName
    const oldColor = oldMember.displayHexColor
    const newColor = newMember.displayHexColor

    const rolesChanged = oldMember.roles.cache.size !== newMember.roles.cache.size || !oldMember.roles.cache.every(role => newMember.roles.cache.has(role.id))

    if (oldName !== newName || oldColor !== newColor || rolesChanged) {
      const server = newMember.guild.id

      if (cache.store.has(server)) {
        const channelsStore = cache.store.get(server)
        const parsedMemberFields = await Member(newMember)

        for (const [channel, messagesCollection] of channelsStore.entries()) {
          for (const [messageId, message] of messagesCollection.entries()) {
            if (message.author.id === newMember.id) {
              message.author.name = parsedMemberFields.name || message.author.name
              message.author.color = parsedMemberFields.color
              message.author.roles = parsedMemberFields.roles

              io.to(`${server}/${channel}`).emit('messageUpdate', {
                channel,
                message
              })
            }
          }
        }
      }
    }
  })

  return client
}

// Debugging
;(<any>global).cache = cache
;(<any>global).client = client
;(<any>global).guests = guests
