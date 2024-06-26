import { GuildMember } from 'discord.js'
import { Reaction } from '../../../types/message'
import Roles from 'engine/util/parse/roles'

async function Member(member: GuildMember) {
  return member
    ? {
        name: member.displayName,
        color: member.displayHexColor,
        roles: await Roles([...member.roles.cache.values()])
      }
    : {
        roles: null,
        color: '#000000'
      }
}

export default Member
