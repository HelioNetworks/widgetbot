import config from 'config'
import { store } from 'database'
import Guest, { JWT } from 'database/models/Guest'
import jwt from 'jsonwebtoken'

interface ILogin {
  // The guest's JWT token
  token: string
  // The guest's IP address (stored in database)
  ip: string
}

async function Login(data: ILogin) {
  // Validate the JWT token and extract data
  const { id } = jwt.verify(data.token, config.database.jwt_secret) as JWT

  // Construct a NeDB query to fetch the user
  const query = { _id: id }

  // Fetch the guest from the database
  let doc = await store.guests.findOneAsync<Guest>(query)
  if (!doc) throw 'User not in database'

  // Update the document
  const transaction = { $set: { 'log.lastSeen': new Date() } } as any

  // Insert their IP address into the document
  if (!doc.log.ips.includes(data.ip)) transaction.$push = { 'log.ips': data.ip }

  // Update document
  const { affectedDocuments } = await store.guests.updateAsync(query, transaction, {
    returnUpdatedDocs: true
  })
  doc = affectedDocuments as any

  return doc
}

export default Login
