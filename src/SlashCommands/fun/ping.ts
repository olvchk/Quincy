import { SlashCommand } from "../../Interfaces";

export const command: SlashCommand = {
  name: "ping",
  description: "reply with a pong!",
  // test: true,
  run: ({ client, interaction }) => {
    if (interaction.isCommand()) interaction.editReply("pong");
  },
};
