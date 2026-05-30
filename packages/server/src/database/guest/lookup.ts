import { store } from 'database'
import Guest from 'database/models/Guest'

type Method = 'ip' | 'id' | 'message'

async function Lookup(method: Method, search: string) {
  // Construct a NeDB query to fetch the user
  const query = method === 'id' ? { 'user.id': search } : method === 'ip' ? { 'log.ips': search } : { 'log.messages': search }

  // Fetch the guest from the database
  let doc = await store.guests.findOneAsync<Guest>(query)
  if (!doc) throw 'User not in database'

  return doc
}

export default Lookup
