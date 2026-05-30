import is from '@sindresorhus/is'
import { Notification } from 'react-notification-system'

import SocketController from '.'
import Messages from './messages'

export const sendErrors = (notification: Notification) => (target: SocketController, propertyKey: string, descriptor: PropertyDescriptor) => {
  const method = descriptor.value

  descriptor.value = async function(...args) {
    try {
      await method.bind(this)(...args)
    } catch (message) {
      console.error(`Error handling '${propertyKey}':`, message)
      this.notify({
        level: 'warning',
        autoDismiss: 20,
        title: `Something went wrong! (while handling '${propertyKey}')`,
        message,
        ...notification
      })
    }
  }
}

type Callback = (value: any, expected: keyof typeof is | 'special') => string
type Validate = (value: any) => boolean

type Expected = keyof typeof is | Validate

export function Expect(value: any, expected: Expected | Expected[], name?: string | Callback, error?: string) {
  if (!is.array(expected)) expected = [expected]

  let message: string

  const valid = expected.find(expect => {
    const validateFn = (is.string(expect) ? (is as any)[expect] : expect) as Validate
    const thisValid: boolean = validateFn(value)
    if (thisValid) return true

    const expectedType = is.string(expect) ? expect : 'special'

    message = is.function_(name) ? name(value, expectedType) : Messages.TYPE_ERROR(name || 'value', expectedType, is(value))
  })

  if (!valid) throw message
}
