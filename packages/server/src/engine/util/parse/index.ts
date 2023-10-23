import config from 'config'
import { Enhance } from 'database/guest-message'
import { GuildChannel } from 'discord.js'
import * as Discord from 'discord.js'

import Message, { Embed as EmbedType } from '../../../types/message'
import Embed from './embed'
import Role from './role'
import Reactions from 'engine/util/parse/reactions'
import Attachment from 'engine/util/parse/attachment'
import Roles from 'engine/util/parse/roles'
import Member from 'engine/util/parse/member'

//TODO: Fix member parsing, as it is still inconsistent.
async function Parse(message: Discord.Message) {
  const parsed: Message = {
    id: message.id,
    author: {
      name: message.author.globalName ?? message.author.tag,
      type: message.author.bot ? 'bot' : config.discord.admins.includes(message.author.id) ? 'sysadmin' : 'member',
      avatar: message.author.avatarURL()
        ? message.author.avatarURL().replace(/\?size=(.*)/, '?size=64')
        : message.author.defaultAvatarURL.replace(/\?size=(.*)/, '?size=64'),
      id: message.author.id,

      ...(await Member(message.member))
    },
    timestamp: message.createdTimestamp,
    content: message.content || null,
    embeds: message.embeds.map((embed): EmbedType => new Embed(embed) as any) || [],
    editedAt: message.editedTimestamp == 0 ? null : message.editedTimestamp,
    type: message.type,
    reactions: await Reactions([...message.reactions.cache.values()]),
    attachment: await Attachment([...message.attachments.values()]),
    mentions: {
      channels: message.mentions.channels.map(channel => ({
        name: channel instanceof GuildChannel ? (channel as GuildChannel).name : 'unknown',
        id: channel.id
      })),
      members: message.mentions.members.map(member => ({
        name: member.displayName,
        id: member.id,
        roles: member.roles.cache.map(role => Role(role)),
        avatar: member.user.avatarURL() ? member.user.avatarURL().replace(/\?size=(.*)/, '?size=128') : null
      })),
      roles: await Roles([...message.mentions.roles.values()]),
      everyone: message.mentions.everyone
    }
  }

  return await Enhance(parsed)
}

export default Parse
