import config from 'config'
import fs from 'fs'
import { graphqlHTTP } from 'express-graphql'
import path from 'path'
import { buildSchema } from 'graphql'

import root from '../graphql/root'

const schema = buildSchema(fs.readFileSync(path.join(__dirname, '../graphql/schema.gql'), 'utf8'))

const controller = graphqlHTTP((req, res, params) => ({
  schema: schema,
  rootValue: root,
  graphiql: !!config.express.graphiql,
  customFormatErrorFn(error) {
    if (error.path || error.name !== 'GraphQLError') {
      if (config.development) {
        console.error(error.message)
      }
      // raven.captureException(error, {
      //   req,
      //   tags: { graphql: 'exec_error' },
      //   extra: {
      //     source: error.source && error.source.body,
      //     variables: params.variables,
      //     positions: error.positions,
      //     path: error.path
      //   }
      // })
    } else {
      if (config.development) {
        console.error(error.message)
      }
      // raven.captureMessage(`GraphQLWrongQuery: ${error.message}`, {
      //   req,
      //   tags: { graphql: 'wrong_query' },
      //   extra: {
      //     source: error.source && error.source.body,
      //     variables: params.variables,
      //     positions: error.positions
      //   }
      // })
    }
    return {
      message: error.message,
      stack: config.development ? error.stack.split('\n') : null
    }
  }
}))

export default controller
