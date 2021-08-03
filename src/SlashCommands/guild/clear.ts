import { SlashCommand } from "../../Interfaces";

export const command: SlashCommand = {
  name: "clear",
  description: "clear out 50 messages",
  options: [
    {
      name: "number",
      description: "number of messages going to be deleted",
      type: "INTEGER",
      required: false,
    },
  ],
  run: ({ client, args, interaction }) => {
    const { channel } = interaction;
    const limit: any = args[0] ? args[0] : 50;

    if (channel.isText()) {
      channel.messages.fetch({ limit }).then(async (results) => {
        if (channel.type != "DM")
          await channel.bulkDelete(results).catch((err) => {});
      });
    }

    interaction.editReply("Deleted some messages");
  },
};
