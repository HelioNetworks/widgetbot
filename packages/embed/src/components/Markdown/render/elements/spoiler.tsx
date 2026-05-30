import * as React from 'react'
import styled from 'typed-emotion'

interface Props {
  revealed: boolean
}

const SpoilerContainer = styled.span<Props>`
  background-color: ${({ revealed }) => (revealed ? 'rgba(255, 255, 255, 0.1)' : '#202225')};
  border-radius: 3px;
  cursor: pointer;
  padding: 0 2px;
  transition: background-color 0.1s ease;

  &:hover {
    background-color: ${({ revealed }) => (revealed ? 'rgba(255, 255, 255, 0.1)' : '#2b2d31')};
  }
`

const SpoilerContent = styled.span<Props>`
  opacity: ${({ revealed }) => (revealed ? 1 : 0)};
  transition: opacity 0.1s ease;
`

export class Spoiler extends React.Component<any, { revealed: boolean }> {
  state = {
    revealed: false
  }

  handleClick = (e: React.MouseEvent) => {
    if (!this.state.revealed) {
      this.setState({ revealed: true })
    }
  }

  render() {
    const { children } = this.props
    const { revealed } = this.state

    return (
      <SpoilerContainer revealed={revealed} onClick={this.handleClick} className="markdown-spoiler">
        <SpoilerContent revealed={revealed}>{children}</SpoilerContent>
      </SpoilerContainer>
    )
  }
}
