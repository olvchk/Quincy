import { CommandInteraction } from "discord.js";
import ExtendedClient from "../Client";
import { SlashCommand } from "../Interfaces";

export const command: SlashCommand = {
  name: "load",
  description: "load a saved playlist",
  options: [
    {
      name: "title",

      description: "name of playlist you want to load",
      type: "STRING",
      required: true,
    },
  ],
  run: ({ client, args, interaction }) => {
    const [{ guild }] = [interaction];
    const title = args.shift();
    const playlist = client.playlists.get(guild.id);

    if (playlist[title]) {
      interaction.editReply(`Waiting to load ${title}...`);
      const urls: string[] = playlist[title];
      play(client, urls, interaction);
      return;
    }

    interaction.editReply(
      `No playlist named ${title}! Please make sure to input correct title!`
    );
  },
};

const play = (
  client: ExtendedClient,
  urls: string[],
  interaction: CommandInteraction
) => {
  const url = urls.shift();
  if (url) {
    client.slashCommands.get("play").run({ client, args: [url], interaction });
    setTimeout(() => play(client, urls, interaction), 4000);
  }
};
