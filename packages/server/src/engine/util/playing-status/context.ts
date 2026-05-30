import { store } from 'database'
import Guest from 'database/models/Guest'
import { client } from 'engine'

import { io } from '../../../controllers/app'

const Context = {
  shard: 'widgetbot.io',

  async accountCount() {
    return (await store.guests.findAsync({})).length
  },

  visitorCount() {
    return (<any>io.engine).clientsCount
  },

  async messageCount() {
    const guests = await store.guests.findAsync<Guest>({})

    let count = 0
    guests.forEach(guest => (count += guest.log.messages.length))

    return count
  },

  guildCount() {
    return client.guilds.cache.size
  }
}

// Resolves a context object
async function getContext() {
  const context = {} as { [key in keyof typeof Context]: string }

  for (const item of Object.keys(Context)) {
    const value = Context[item]
    context[item] = await (typeof value === 'function' ? value() : value)
  }

  return context
}

export default getContext
