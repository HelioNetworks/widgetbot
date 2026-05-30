import * as hljs from 'highlight.js'
import * as Moment from 'moment'
import { Video } from 'markdown/render/elements/media'
import * as React from 'react'
import SimpleMarkdown from 'simple-markdown'

import controller from '../../../controllers/cerebral'
import message from '../../../types/message'
import Embed from '../../Messages/Message/Embed'
import { Channel, Code, Edited, Emoji, Image, Link, Mention, Role, Spoiler, Timestamp, Twemoji } from './elements'

// import Emoji from "./emoji"
const $Emoji = { people: [{ names: ['disabled'], surrogates: '😀' }] }

export function parseText(msg: message) {
  function attachment(msg, setPopup?) {
    return msg.attachment ? <Image src={msg.attachment.url} height={+msg.attachment.height} width={+msg.attachment.width} /> : null
  }

  function embed(msg: message) {
    if (msg.embeds.length === 0) return null

    return msg.embeds.map((embed, i) => {
      if (embed.video) {
        return <Video src={embed.video.url} width={+embed.video.width} height={+embed.video.height} key={i} />
      }
      return <Embed key={i} {...embed} mentions={msg.mentions} />
    })
  }

  return (
    <React.Fragment>
      {msg.content && parse(msg.content, false, { mentions: msg.mentions })}
      {msg.editedAt && <Edited className="edited">{`(edited)`}</Edited>}
      {attachment(msg)}
      {embed(msg)}
    </React.Fragment>
  )
}

// this is mostly translated from discord's client,
// although it's not 1:1 since the client js is minified
// and also is transformed into some tricky code

// names are weird and sometimes missing, as i'm not sure
// what all of these are doing exactly.

const emojiTipOptions = {
  'data-type': 'dark',
  'data-effect': 'solid',
  'data-delay-show': 450,
  'data-place': 'top',
  'data-offset': "{ 'top': 3 }"
}

// this function seems to be duplicated quite a bit in the original source...
function createReactElement(type, props, key?, ...children) {
  const defaultProps = type && type.defaultProps

  if (props && defaultProps) {
    for (const prop in defaultProps) {
      if (props[prop] === undefined) {
        props[prop] = defaultProps[prop]
      }
    }
  } else if (!props) {
    props = defaultProps || {}
  }

  props.children = children[0]
  if (children.length > 1) {
    props.children = children
  }

  return {
    $$typeof: Symbol.for('react.element'),
    type: type,
    key: key == null ? null : `${key}`,
    ref: null,
    props: props,
    _owner: null
  }
}

function flattenAst(node, parent?) {
  if (Array.isArray(node)) {
    for (let n = 0; n < node.length; n++) {
      node[n] = flattenAst(node[n], parent)
    }

    return node
  }

  if (node.content != null) {
    node.content = flattenAst(node.content, node)
  }

  if (parent != null && node.type === parent.type) {
    return node.content
  }

  return node
}

function astToString(node) {
  function inner(node, result = []) {
    if (Array.isArray(node)) {
      node.forEach(subNode => astToString(subNode))
    } else if (typeof node.content === 'string') {
      result.push(node.content)
    } else if (node.content != null) {
      astToString(node.content)
    }

    return result
  }

  return inner(node).join('')
}

function recurse(node, recurseOutput, state) {
  if (typeof node.content === 'string') {
    return node.content
  }

  return recurseOutput(node.content, state)
}

function parserFor(rules, returnAst?) {
  const parser = SimpleMarkdown.parserFor(rules)
  const renderer = SimpleMarkdown.reactFor(SimpleMarkdown.ruleOutput(rules, 'react'))
  return function(input = '', inline = true, state = {}, transform = null) {
    if (!inline) {
      input += '\n\n'
    }

    const parseState = { inline, ...state }
    let ast = parser(input, parseState)
    ast = flattenAst(ast)
    if (!inline) {
      const blockTypes = ['heading', 'subtext', 'blockQuote', 'list', 'codeBlock']
      ast = ast.filter((node, index) => {
        if (node.type === 'newline') {
          const prev = ast[index - 1]
          const next = ast[index + 1]
          if (
            (prev && blockTypes.indexOf(prev.type) !== -1) ||
            (next && blockTypes.indexOf(next.type) !== -1)
          ) {
            return false
          }
        }
        return true
      })
    }
    if (transform) {
      ast = transform(ast)
    }

    if (returnAst) {
      return ast
    }

    return renderer(ast, parseState)
  }
}

function omit(object, excluded) {
  return Object.keys(object).reduce((result, key) => {
    if (excluded.indexOf(key) === -1) {
      result[key] = object[key]
    }

    return result
  }, {})
}

// emoji stuff

const getEmoteURL = emote => `https://cdn.discordapp.com/emojis/${emote.id}.png`

function getEmojiURL(surrogate) {
  if (['™', '©', '®'].indexOf(surrogate) > -1) {
    return ''
  }

  try {
    // we could link to discord's cdn, but there's a lot of these
    // and i'd like to minimize the amount of data we need directly from them
    return `https://twemoji.maxcdn.com/2/svg/aaa.svg`
  } catch (error) {
    return ''
  }
}

// emoji lookup tables

const DIVERSITY_SURROGATES = ['🏻', '🏼', '🏽', '🏾', '🏿']
const NAME_TO_EMOJI = {}
const EMOJI_TO_NAME = {}

Object.keys($Emoji).forEach(category => {
  $Emoji[category].forEach(emoji => {
    EMOJI_TO_NAME[emoji.surrogates] = emoji.names[0] || ''

    emoji.names.forEach(name => {
      NAME_TO_EMOJI[name] = emoji.surrogates

      DIVERSITY_SURROGATES.forEach((d, i) => {
        NAME_TO_EMOJI[`${name}::skin-tone-${i + 1}`] = emoji.surrogates.concat(d)
      })
    })

    DIVERSITY_SURROGATES.forEach((d, i) => {
      const surrogates = emoji.surrogates.concat(d)
      const name = emoji.names[0] || ''

      EMOJI_TO_NAME[surrogates] = `${name}::skin-tone-${i + 1}`
    })
  })
})

const EMOJI_NAME_AND_DIVERSITY_RE = /^:([^\s:]+?(?:::skin-tone-\d)?):/

function convertNameToSurrogate(name, t = '') {
  // what is t for?
  return NAME_TO_EMOJI.hasOwnProperty(name) ? NAME_TO_EMOJI[name] : t
}

function convertSurrogateToName(surrogate, colons = true, n = '') {
  // what is n for?
  let a = n

  if (EMOJI_TO_NAME.hasOwnProperty(surrogate)) {
    a = EMOJI_TO_NAME[surrogate]
  }

  return colons ? `:${a}:` : a
}

const escape = str => str.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&')

const replacer = (function() {
  const surrogates = Object.keys(EMOJI_TO_NAME)
    .sort(surrogate => -surrogate.length)
    .map(surrogate => escape(surrogate))
    .join('|')

  return new RegExp('(' + surrogates + ')', 'g')
})()

function translateSurrogatesToInlineEmoji(surrogates) {
  return surrogates.replace(replacer, (_, match) => convertSurrogateToName(match))
}

function formatTimestamp(unixSeconds: number, style: string): string {
  const m = Moment(unixSeconds * 1000)
  switch (style) {
    case 't': return m.format('LT')
    case 'T': return m.format('LTS')
    case 'd': return m.format('L')
    case 'D': return m.format('LL')
    case 'f': return m.format('LLL')
    case 'F': return m.format('LLLL')
    case 'R': return m.fromNow()
    default: return m.format('LLL')
  }
}

function getFullTimestamp(unixSeconds: number): string {
  return Moment(unixSeconds * 1000).format('LLLL')
}

// i am not sure why are these rules split like this.

const baseRules = {
  timestamp: {
    order: SimpleMarkdown.defaultRules.text.order - 1,
    match(source) {
      return /^<t:(-?\d+)(?::([tTdDfFR]))?>/.exec(source)
    },
    parse(capture) {
      return {
        timestamp: parseInt(capture[1], 10),
        style: capture[2] || 'f'
      }
    },
    react(node, recurseOutput, state) {
      return createReactElement(
        Timestamp,
        {
          title: getFullTimestamp(node.timestamp)
        },
        state.key,
        formatTimestamp(node.timestamp, node.style)
      )
    }
  },
  newline: SimpleMarkdown.defaultRules.newline,
  paragraph: SimpleMarkdown.defaultRules.paragraph,
  escape: SimpleMarkdown.defaultRules.escape,
  link: SimpleMarkdown.defaultRules.link,
  autolink: {
    ...SimpleMarkdown.defaultRules.autolink,
    match: SimpleMarkdown.inlineRegex(/^<(https?:\/\/[^ >]+)>/)
  },
  url: SimpleMarkdown.defaultRules.url,
  strong: SimpleMarkdown.defaultRules.strong,
  em: SimpleMarkdown.defaultRules.em,
  u: SimpleMarkdown.defaultRules.u,
  br: SimpleMarkdown.defaultRules.br,
  inlineCode: SimpleMarkdown.defaultRules.inlineCode,
  emoticon: {
    order: SimpleMarkdown.defaultRules.text.order,
    match: function(source) {
      return /^(¯\\_\(ツ\)_\/¯)/.exec(source)
    },
    parse: function(capture) {
      return { type: 'text', content: capture[1] }
    }
  },
  codeBlock: {
    order: SimpleMarkdown.defaultRules.codeBlock.order,
    match(source) {
      return /^```(([A-z0-9-]+?)\n+)?\n*([^]+?)\n*```/.exec(source)
    },
    parse(capture) {
      return { lang: (capture[2] || '').trim(), content: capture[3] || '' }
    }
  },
  emoji: {
    order: SimpleMarkdown.defaultRules.text.order,
    match(source) {
      return EMOJI_NAME_AND_DIVERSITY_RE.exec(source)
    },
    parse(capture) {
      const match = capture[0]
      const name = capture[1]
      const surrogate = convertNameToSurrogate(name)
      return surrogate
        ? {
            name: `:${name}:`,
            surrogate: surrogate,
            src: getEmojiURL(surrogate)
          }
        : {
            type: 'text',
            content: match
          }
    },
    react(node, recurseOutput, state) {
      return node.src
        ? createReactElement(Emoji, {
            draggable: false,
            enlarged: node.jumboable,
            alt: node.surrogate,
            // 'data-tip': node.name,
            src: node.src,
            ...emojiTipOptions
          })
        : createReactElement('span', {}, state.key, node.surrogate)
    }
  },
  customEmoji: {
    order: SimpleMarkdown.defaultRules.text.order,
    match(source) {
      return /^<:(\w+):(\d+)>/.exec(source)
    },
    parse(capture) {
      const name = capture[1]
      const id = capture[2]
      return {
        emojiId: id,
        // NOTE: we never actually try to fetch the emote
        // so checking if colons are required (for 'name') is not
        // something we can do to begin with
        name: name,
        src: getEmoteURL({
          id: id
        })
      }
    },
    react(node) {
      return createReactElement(Emoji, {
        draggable: false,
        enlarged: node.jumboable,
        alt: `<:${node.name}:${node.emojiId}>`,
        // 'data-tip': `:${node.name}:`,
        src: node.src,
        ...emojiTipOptions
      })
    }
  },
  text: {
    ...SimpleMarkdown.defaultRules.text,
    parse(capture, recurseParse, state) {
      return state.nested
        ? {
            content: capture[0]
          }
        : recurseParse(translateSurrogatesToInlineEmoji(capture[0]), {
            ...state,
            nested: true
          })
    },
    react(node, recurseOutput, state) {
      return createReactElement(
        Twemoji,
        {
          resolveNames: true,
          onlyEmojiClassName: 'enlarged',
          text: node.content
        },
        state.key
      )
    }
  },
  s: {
    order: SimpleMarkdown.defaultRules.u.order,
    match: SimpleMarkdown.inlineRegex(/^~~([\s\S]+?)~~(?!_)/),
    parse: SimpleMarkdown.defaultRules.u.parse
  },
  spoiler: {
    order: SimpleMarkdown.defaultRules.text.order - 1,
    match: SimpleMarkdown.inlineRegex(/^\|\|([\s\S]+?)\|\|/),
    parse: function(capture, parse, state) {
      return {
        content: parse(capture[1], state)
      }
    },
    react: function(node, output, state) {
      return createReactElement(
        Spoiler,
        {},
        state.key,
        output(node.content, state)
      )
    }
  },
  heading: {
    ...SimpleMarkdown.defaultRules.heading,
    match(source, state) {
      if (state.inline) {
        return null
      }
      return SimpleMarkdown.blockRegex(/^ *(#{1,3}) ([^\n]+?)(?:\n|$)/)(source, state)
    },
    parse(capture, recurseParse, state) {
      return {
        level: capture[1].length,
        content: recurseParse(capture[2], state)
      }
    },
    react(node, recurseOutput, state) {
      const level = Math.min(3, node.level)
      return createReactElement(
        `h${level}`,
        {},
        state.key,
        recurseOutput(node.content, state)
      )
    }
  },
  subtext: {
    order: SimpleMarkdown.defaultRules.paragraph.order - 0.5,
    match(source, state) {
      if (state.inline) {
        return null
      }
      return SimpleMarkdown.blockRegex(/^ *-\# (.*?)(?:\n|$)/)(source, state)
    },
    parse(capture, recurseParse, state) {
      return {
        content: recurseParse(capture[1], state)
      }
    },
    react(node, recurseOutput, state) {
      return createReactElement(
        'small',
        { className: 'markdown-subtext' },
        state.key,
        recurseOutput(node.content, state)
      )
    }
  },
  blockQuote: {
    ...SimpleMarkdown.defaultRules.blockQuote,
    match(source, state) {
      if (state.inline) {
        return null
      }
      return /^(?:>>> ([\s\S]*)|> (.*(?:\n> .*)*))/.exec(source)
    },
    parse(capture, recurseParse, state) {
      const content = capture[1] || capture[2] || ''
      const cleanContent = capture[1] ? content : content.replace(/^> ?/gm, '')
      return {
        content: recurseParse(cleanContent, state)
      }
    },
    react(node, recurseOutput, state) {
      return createReactElement(
        'blockquote',
        {},
        state.key,
        recurseOutput(node.content, state)
      )
    }
  },
  list: {
    ...SimpleMarkdown.defaultRules.list,
    match(source, state) {
      if (state.inline) {
        return null
      }
      return SimpleMarkdown.defaultRules.list.match(source, state)
    },
    react(node, recurseOutput, state) {
      const Tag = node.ordered ? 'ol' : 'ul'
      return createReactElement(
        Tag,
        { className: 'markdown-list' },
        state.key,
        node.items.map((item, i) =>
          createReactElement('li', {}, `${i}`, recurseOutput(item, state))
        )
      )
    }
  },
  mention: {
    order: SimpleMarkdown.defaultRules.text.order - 2,
    match: SimpleMarkdown.inlineRegex(/^<@!?(\d+)>/),
    parse(capture) {
      return { id: capture[1] }
    },
    react(node, recurseOutput, state) {
      const member = state.mentions?.members?.find(m => m.id === node.id)
      const name = member ? member.name : 'unknown-user'
      let color
      if (member && member.roles) {
        const roles = [...member.roles].sort((a, b) => (a.position < b.position ? 1 : -1))
        for (let role of roles) {
          if (role.color !== '#000') {
            color = role.color
            break
          }
        }
      }
      return createReactElement(
        Mention,
        {
          key: node.id,
          color: color
        },
        state.key,
        `@${name}`
      )
    }
  },
  channelMention: {
    order: SimpleMarkdown.defaultRules.text.order - 2,
    match: SimpleMarkdown.inlineRegex(/^<#(\d+)>/),
    parse(capture) {
      return { id: capture[1] }
    },
    react(node, recurseOutput, state) {
      const channel = controller.state.channels?.get(node.id)
      const name = channel ? channel.name : 'deleted-channel'
      return createReactElement(
        Channel,
        {
          id: node.id
        },
        state.key,
        `#${name}`
      )
    }
  },
  roleMention: {
    order: SimpleMarkdown.defaultRules.text.order - 2,
    match: SimpleMarkdown.inlineRegex(/^<@&(\d+)>/),
    parse(capture) {
      return { id: capture[1] }
    },
    react(node, recurseOutput, state) {
      const role = state.mentions?.roles?.find(r => r.id === node.id)
      const name = role ? role.name : 'deleted-role'
      return createReactElement(
        Role,
        {
          role: role,
          color: role?.color
        },
        state.key,
        `@${name}`
      )
    }
  },
  everyoneMention: {
    order: SimpleMarkdown.defaultRules.text.order - 2,
    match(source, state) {
      if (state.mentions?.everyone) {
        return /^@(everyone|here)/.exec(source)
      }
      return null
    },
    parse(capture) {
      return { text: capture[1] }
    },
    react(node, recurseOutput, state) {
      return createReactElement(
        Role,
        { everyone: true },
        state.key,
        `@${node.text}`
      )
    }
  }
}

function escaped(data) {
  data = data.replace(/</gim, '&lt;')
  data = data.replace(/>/gim, '&gt;')
  return data
}

function createRules(r) {
  const paragraph = r.paragraph
  const url = r.url
  const link = r.link
  const codeBlock = r.codeBlock
  const inlineCode = r.inlineCode

  return {
    // rules we don't care about:
    //  mention
    //  channel
    //  highlight

    // what is highlight?

    ...r,
    s: {
      order: r.u.order,
      match: SimpleMarkdown.inlineRegex(/^~~([\s\S]+?)~~(?!_)/),
      parse: r.u.parse,
      react(node, recurseOutput, state) {
        return createReactElement('s', {}, state.key, recurseOutput(node.content, state))
      }
    },
    paragraph: {
      ...paragraph,
      react(node, recurseOutput, state) {
        return createReactElement('p', {}, state.key, recurseOutput(node.content, state))
      }
    },
    url: {
      ...url,
      match: SimpleMarkdown.inlineRegex(/^((https?|steam):\/\/[^\s<]+[^<.,:;"')\]\s])/)
    },
    link: {
      ...link,
      react(node, recurseOutput, state) {
        // this contains some special casing for invites (?)
        // or something like that.
        // we don't really bother here
        const children = recurseOutput(node.content, state)
        const title = node.title || astToString(node.content)
        return createReactElement(
          Link,
          {
            title: title,
            href: SimpleMarkdown.sanitizeUrl(node.target),
            target: '_blank',
            rel: 'noreferrer'
          },
          state.key,
          children
        )
      }
    },
    inlineCode: {
      ...inlineCode,
      react(node, recurseOutput, state) {
        return createReactElement(
          Code,
          {
            inline: true,
            className: 'inline'
          },
          state.key,
          recurse(node, recurseOutput, state)
        )
      }
    },
    codeBlock: {
      ...codeBlock,
      react(node, recurseOutput, state) {
        if (node.lang && hljs.getLanguage(node.lang) != null) {
          const highlightedBlock = hljs.highlight(node.lang, node.content, true)
          return createReactElement(
            Code,
            {
              language: highlightedBlock.language,
              dangerouslySetInnerHTML: {
                __html: highlightedBlock.value
              }
            },
            state.key
          )
        }

        return createReactElement(Code, {}, undefined, recurse(node, recurseOutput, state))
      }
    }
  }
}

const rulesWithoutMaskedLinks = createRules(baseRules)

// used in:
//  message content (non-webhook mode)
const parse = parserFor(rulesWithoutMaskedLinks)

// used in:
//  message content (webhook mode)
//  embed description
//  embed field values
const parseAllowLinks = parserFor(createRules(baseRules))

// used in:
//  embed title (obviously)
//  embed field names
const parseEmbedTitle = parserFor(omit(rulesWithoutMaskedLinks, [
  'codeBlock',
  'br',
  'mention',
  'channelMention',
  'roleMention',
  'everyoneMention',
  'heading',
  'subtext',
  'blockQuote',
  'list'
]))

// used in:
//  message content
function jumboify(ast) {
  const nonEmojiNodes = ast.some(node => {
    return node.type !== 'img' && (typeof node.content !== 'string' || node.content.trim() !== '')
  })

  if (nonEmojiNodes) {
    return ast
  }

  const maximum = 27
  let count = 0

  ast.forEach((node, i) => {
    node.props.key = i

    if (node.type === 'img') {
      count += 1
    }

    if (count > maximum) {
      return false
    }
  })

  if (count < maximum) {
    ast.forEach(node => (node.props.className += ' jumboable'))
  }

  return ast
}

export { parse, parseAllowLinks, parseEmbedTitle, jumboify }

export default parseText
