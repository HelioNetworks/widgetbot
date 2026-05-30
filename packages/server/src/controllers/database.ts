import config from 'config'
import path from 'path'
import Datastore from '@seald-io/nedb'
let stores: string[]

// Function that converts an array of stores into
// a typed store object
const Stores = <T extends string, U = { [K in T]: Datastore }>(s: T[]) => {
  stores = s
  return (s as any) as U
}

// Export the store
export const store = Stores(['servers', 'guests'])

// Connects to the database
export async function connect() {
  // Iterate through the stores
  for (const name of stores) {
    // Instantate the database
    store[name] = new Datastore({
      filename: path.join(config.database.dir, `${name}.db`),
      timestampData: true
    })

    // Load the database
    await store[name].loadDatabaseAsync()
  }

  return store
}

// Debugging
;(global as any).store = store
