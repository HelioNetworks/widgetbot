import { ThemeProvider } from 'emotion-theming'
import { parseText } from 'markdown/render'
import * as React from 'react'
import { FormattedMessage } from 'react-intl'

import message from '../../../types/message'
import MessageType from '../../../types/messagetype'
import Author, { Timestamp } from './Author'
import { Avatar, Content, Group, JoinMember, JoinText, Messages, Reactions, Root, Sys } from './elements'
import parseUsername from './parseUsername'
import Reaction from './Reaction'
import Reply from './Reply'

interface Props {
  messages: message[]
  lastSeen: string
  all: message[]
}

class Message extends React.PureComponent<Props, any> {
  theme = message => theme => ({
    ...theme,
    message
  })

  render() {
    const { messages, lastSeen, all } = this.props
    const [message] = messages

    if (message.type == MessageType.UserJoin) {
      const { name } = parseUsername(message.author.name)

      return (
        <Group className="message join">
          <Messages className="content">
            <JoinText>
              <FormattedMessage id="message.join_message" values={{ name: <JoinMember>{name}</JoinMember> }} />
            </JoinText>
            <Timestamp time={message.timestamp} />
          </Messages>
        </Group>
      )
    }

    return (
      <div>
        {message.reference && <Reply id={message.reference.messageId} messages={all} />}
        <Group className="group">
          <Avatar url={message.author.avatar} className="avatar" />
          <Messages className="messages">
            <Author author={message.author} time={message.timestamp} />

            {messages.map((message, i) => (
              <ThemeProvider key={message.id} theme={this.theme(message)}>
                <Root className="message" id={`message-${message.id}`}>
                  <Content className="content">{parseText(message)}</Content>

                  {message.reactions && (
                    <Reactions className="reactions">{message.reactions.map((reaction, i) => <Reaction key={i} {...reaction} />)}</Reactions>
                  )}

                  {// If the message is the last one seen by the user
                  message.id === lastSeen &&
                    // And it's not at the end of the list
                    i !== messages.length - 1 && (
                      <Sys.Container className="system-message">
                        <Sys.Lines>
                          <Sys.Message>New Messages</Sys.Message>
                        </Sys.Lines>
                      </Sys.Container>
                    )}
                </Root>
              </ThemeProvider>
            ))}
          </Messages>
        </Group>
      </div>
    )
  }
}

export default Message
