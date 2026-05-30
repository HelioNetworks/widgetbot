import { store } from 'database'
import Guest from 'database/models/Guest'
import { cache, client } from 'engine'
import pmx from 'pmx'

import { io } from './app'

export const probe = pmx.probe()

const startMetrics = () => {
  probe.metric({
    name: 'Online guests',
    value: () => (<any>io.engine).clientsCount
  })

  probe.metric({
    name: 'Total guilds',
    value: () => client.guilds.cache.size
  })

  probe.metric({
    name: 'Total messages',
    async value() {
      let total = 0
      const guests = await store.guests.findAsync<Guest>({})

      guests.forEach(guest => (total += guest.log.messages.length))
      return total
    }
  })

  probe.metric({
    name: 'Cached servers',
    value: () => cache.store.size
  })

  probe.metric({
    name: 'Cached channels',
    value: () => {
      let total = 0
      cache.store.forEach(server => (total += server.size))
      return total
    }
  })

  probe.metric({
    name: 'Cached messages',
    value: () => {
      let total = 0
      cache.store.forEach(server => server.map(channel => (total += channel.size)))
      return total
    }
  })
}

export default startMetrics
