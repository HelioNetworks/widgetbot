import { store } from 'database'
import * as Pending from 'database/guest-message/pending'
import Guest from 'database/models/Guest'
import GuestMessage from 'database/models/GuestMessage'
import { client } from 'engine'

import Message from '../../types/message'

export const enhanceMessage = (message: Message, enhancer: GuestMessage): Message => ({
  ...message,
  content: message.author.id === client.user.id ? message.content.replace(/[^`]*`[^`]*` /, '') : message.content,
  author: {
    ...message.author,
    type: 'guest',
    // TODO: Resolve signed-in user
    id: enhancer.user.id || message.author.id,
    name: enhancer.user.name,
    avatar: enhancer.user.avatar || message.author.avatar
  }
})

/**
 * Enhances a message with Guest message data
 * @param message The message to enhance
 */
export async function Enhance(message: Message) {
  // The guest message has to be from a bot
  // so don't make DB requests if it's not
  if (message.author.type === 'bot') {
    // The message does not exist in the database, but
    // it'll be available in the future.
    const pending = Pending.is(message.content)
    if (pending) {
      const enhanced = await pending.enhancer(message)
      return enhanced
    }

    const doc = await store.guests.findOneAsync<Guest>({
      'log.messages': message.id
    })

    if (doc) {
      return enhanceMessage(message, {
        id: message.id,
        user: doc.user
      })
    }
  }

  return message
}

/**
 * Inserts a message with enhanced detail into the store
 * @param message The message enhancer data
 */
export async function SetEnhancer(enhancer: GuestMessage, content: string) {
  Pending.resolve(content, enhancer)

  await store.guests.updateAsync(
    { 'user.id': enhancer.user.id },
    {
      $push: {
        'log.messages': enhancer.id
      }
    }
  )
}

// Debugging
;(global as any).guestMessage = { Enhance, SetEnhancer }
