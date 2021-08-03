import { SlashCommand } from "../../Interfaces";
import { prefixSchema } from "../../Schemas/prefixes";

export const command: SlashCommand = {
  name: "prefix",
  description: "ma\nage bot prefix",
  options: [
    {
      name: "prefix",
      description: "new prefix",
      required: false,
      type: "STRING",
    },
  ],
  init: async (client) => {
    const results = await prefixSchema.find();
    if (results) {
      for (const result of results) {
        const { prefix } = result;
        client.prefixes.set(result["_id"], prefix);
      }
    }
  },
  run: async ({ client, args, interaction }) => {
    const { guild } = interaction;
    let prefix = client.prefixes.get(guild.id) ?? client.config.prefix;

    if (args.length != 0) {
      prefix = args.shift();
      client.prefixes.set(guild.id, prefix);
      await prefixSchema.findOneAndUpdate(
        {
          _id: guild.id,
        },
        {
          _id: guild.id,
          prefix,
        },
        {
          upsert: true,
        }
      );
      interaction.editReply(`This bot's prefix is now set to ${prefix}`);
      return;
    }

    interaction.editReply(`This bot's prefix is ${prefix}`);
  },
};
