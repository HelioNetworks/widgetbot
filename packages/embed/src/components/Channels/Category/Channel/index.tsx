import * as React from 'react'

import { Hashtag, Megaphone, Name, Pings, Root } from './elements'

interface Props {
  name: string
  unread: boolean
  type: number
  id: string
  order: number
  selected: boolean
}

class Channel extends React.PureComponent<Props> {
  name: HTMLDivElement

  componentDidMount() {
    const { selected } = this.props

    if (selected && this.name) {
      // this.name.scrollIntoView()
    }
  }

  render() {
    const { name, type } = this.props

    return (
      <Root {...this.props} className="channel">
        {type == 0 && <Hashtag className="hash" />}
        {type == 5 && <Megaphone className="megaphone" />}
        <Name ref={ref => (this.name = ref)} className="name">
          {name}
        </Name>
        {false && <Pings className="pings">1</Pings>}
      </Root>
    )
  }
}

export default Channel
