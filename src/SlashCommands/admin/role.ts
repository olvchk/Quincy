import { SlashCommand } from "../../Interfaces";
import { defaultRoleSchema } from "../../Schemas/default-role-schema";

const cache = {};

export const command: SlashCommand = {
  name: 'role',
  description: 'manage default role',
  options: [{
    name: 'role',
    description: 'mention a role',
    type: 'ROLE',
  }],
  defaultPermission: false,
  init: async(client) => {
    const results = await defaultRoleSchema.find();
    if (results) {
      for (const result of results) {
        const { roleID } = result;
        cache[result['_id']] = {
          roleID
        }
      }
    }

    client.on('guildMemberAdd', (member) => {
      const { guild } = member;
      if (cache[guild.id]) {
        const { roleID } = cache[guild.id];
        const role = guild.roles.cache.get(roleID);
        member.roles.add(role);
      }
    })
  },
  run: async({client, args, interaction}) => {
    const { guild } = interaction;

    if (args.length) {
      const roleID = args.shift()
      await defaultRoleSchema.findOneAndUpdate({
        _id: guild.id
      }, {
        _id: guild.id,
        server: guild.name,
        roleID
      }, {
        upsert: true
      })
      cache[guild.id] = {
        roleID  
      }
      interaction.editReply(`Set this server's default role to <@&${roleID}>`)
      return;
    }

    if (cache[guild.id]) {
      const { roleID } = cache[guild.id]
      interaction.editReply(`server's default role is <@&${roleID}>`)
      return;
    }

    interaction.editReply("This server doesn't has a default role!")
  }
}                               