import { Interaction } from "discord.js";
import { ErrorHandler } from "../Handler/ErrorHandler";
import { Event } from "../Interfaces";

export const event: Event = {
  name: "interactionCreate",
  run: async (client, interaction: Interaction) => {
    if (interaction.isButton()) {
      await interaction.defer().catch(() => {});
      await interaction.deleteReply().catch((err) => {});
    }

    if (interaction.isSelectMenu()) {
      await interaction.defer().catch(() => {});
      await interaction.deleteReply().catch((err) => {});
    }

    if (interaction.isCommand()) {
      await interaction.defer().catch(() => {});

      const command = client.slashCommands.get(interaction.commandName);
      if (!command)
        return interaction.followUp({ content: "An error has occured" });

      const args = [];

      let options = interaction.options.data;
      const getArgs = (options) =>
        options.map((x) => {
          if (x.value) args.push(x.value);

          if (x.options) {
            getArgs(x.options);
          }
        });
      getArgs(options);

      command.run({ client, interaction, args });
    }
  },
};
