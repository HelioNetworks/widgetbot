import { app, server } from 'app'
import config from 'config'
import { connect } from 'database'
import { Login } from 'engine'
import startup from 'engine/winston-transport/startup'
import logger from 'logger'
import raven from 'raven'
import events from 'server-api'

import startMetrics from './controllers/pmx'

export async function main() {
  /// #if DEBUG
  app.use(require('errorhandler')())
  /// #endif

  /**
   * Connect to database
   */
  {
    const meta = { from: 'Database' }
    await connect()
    logger.verbose(`loaded into memory`, meta)
  }

  /**
   * Login to Discord
   */
  {
    const meta = { from: 'Discord' }
    logger.info(`logging in...`, meta)
    logger.profile('discord-login')

    const client = await Login(config.discord.token)

    logger.profile('discord-login', `logged in!`, {
      ...meta,
      discord: 'status',
      embed: startup,
      username: client.user.tag,
      id: client.user.id
    })
  }

  startMetrics()

  /**
   * Express
   */
  {
    const meta = { from: 'Express' }
    server.listen(app.get('port'), () => {
      logger.info(`listening on ${app.get('port')}`, {
        ...meta,
        discord: 'status'
      })
    })
  }
}

raven.context(main)

if (global) {
  ;(global as any).raven = raven
  ;(global as any).main = main
}
