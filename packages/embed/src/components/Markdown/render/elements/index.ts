import styled from 'typed-emotion'

export const Link = styled.a`
  & code {
    color: inherit;
  }
`

export const Edited = styled.span`
  font-size: 0.625rem;
  line-height: 0.625rem;
  margin-left: 3px;
  opacity: 0.3;
`

export { Twemoji, Emoji } from './emoji'
export { Code } from './code'
export { Channel, Mention, Role } from './mentions'
export { Image } from './media'
export { Spoiler } from './spoiler'

export const Timestamp = styled.span`
  background: rgba(255, 255, 255, 0.08);
  color: #dee0e3;
  border-radius: 3px;
  padding: 0 4px;
  font-weight: 500;
  font-size: 0.85em;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }
`
