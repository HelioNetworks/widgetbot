import * as React from 'react'
import Message from '../../../../types/message'
import scrollIntoView from 'scroll-into-view-if-needed'
import { RepliedTextContent, ReplyText, ReplyTextPreview, Root } from './elements'

const Reply = ({ id, messages }) => {
  const message = messages.find((msg: Message) => id === msg.id)
  if (!message) {
    return (
      <Root>
        <ReplyText>
          <em>Message could not be retrieved.</em>
        </ReplyText>
      </Root>
    )
  }

  const handleClick = () => {
    const el = document.getElementById(`message-${id}`)
    if (el) {
      scrollIntoView(el, {
        scrollMode: 'always',
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
        skipOverflowHiddenElements: true
      })
    }
  }

  return (
    <Root className="message-reply-context" onClick={handleClick}>
      <img src={message.author.avatar} alt={''} style={{ borderRadius: '50%', width: '16px', height: '16px', userSelect: 'none', marginRight: '0.25rem' }} />
      <span
        style={{
          color: message.author.color,
          fontSize: '14px',
          marginRight: '0.25rem',
          opacity: 0.64,
          lineHeight: '1.125rem',
          verticalAlign: '1.5px'
        }}
      >
        @{message.author.name}
      </span>
      <ReplyTextPreview className="replyTextPreview">
        <RepliedTextContent className="repliedTextContent">{message.content}</RepliedTextContent>
      </ReplyTextPreview>
    </Root>
  )
}

export default Reply
