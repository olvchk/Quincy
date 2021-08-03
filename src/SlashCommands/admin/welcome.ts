import { SlashCommand } from "../../Interfaces";
import { welcomeSchema } from "../../Schemas/welcome-schema";

const cache = {}

export const command: SlashCommand = {
  name: 'welcome',
  description: `manage server's default welcome message and channel`,
  options: [{
    name: 'message',
    description: 'welcome message',
    type: 'STRING'
  }],
  init: async(client) => {
    const results = await welcomeSchema.find();

    if (results) {
      for (const result of results) {
        const { channelID, text } = result;
        cache[result['_id']] = {
          channelID,
          text
        }
      }
    }

    client.on('guildMemberAdd', (member) => {
      const { guild } = member;
      if (cache[guild.id]) {
        const { channelID, text } = cache[guild.id];
        const channel = guild.channels.cache.get(channelID);
        if (channel.isText()) {
          channel.send(text.replace(/<@>/g, `<@${member.id}>` ))
        }
      }
    })
  },
  run: async({ client, args, interaction }) => {
    const { guild, channel } = interaction;
    if (args.length) {
      const text = args.join(' ');
      const channelID = channel.id;
      await welcomeSchema.findOneAndUpdate({
        _id: guild.id
      }, {
        _id: guild.id,
        server: guild.name,
        channelID,
        text
      }, {
        upsert: true
      })
      cache[guild.id] = {
        channelID,
        text
      }
      interaction.editReply(`Set this server's default welcome message to\n${text}`)
      return;
    }

    if (cache[guild.id]) {
      const { text } = cache[guild.id];
      interaction.editReply(text);
      return;
    }
    
    interaction.editReply("This server doesn't has a default welcome message and channel!");
  }
}