import config from 'config'
import { store } from 'database'
import Guest, { Log, User } from 'database/models/Guest'
import jwt from 'jsonwebtoken'
import UUID from 'uuid'

interface IRegister {
  name: string
  avatar: string
  discord_id?: string
  ip?: string
}

async function Register(data: IRegister) {
  const user: User = {
    name: data.name,
    avatar: data.avatar,
    id: data.discord_id || UUID()
  }

  const log: Log = {
    ips: data.ip ? [data.ip] : [],
    lastSeen: new Date(),
    messages: []
  }

  const guest: Guest = {
    user,
    log,
    discord: !!data.discord_id
  }

  const doc = await store.guests.insertAsync(guest)
  const token = jwt.sign({ id: doc._id }, config.database.jwt_secret)

  return { doc, token }
}

export default Register
