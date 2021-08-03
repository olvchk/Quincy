import { AudioPlayerStatus, AudioResource } from "@discordjs/voice";
import { GuildMember, MessageEmbed } from "discord.js";
import { getInfo } from "ytdl-core";
import { SlashCommand, Track } from "../../Interfaces";

export const command: SlashCommand = {
  name: "volume",
  description: "control song volume",
  options: [
    {
      name: "volume",
      description: "range between 0 to 100 inclusively",
      type: "INTEGER",
      required: false,
    },
  ],
  run: async ({ client, args, interaction }) => {
    const member = interaction.member as GuildMember;
    const { guild } = interaction;
    const subscription = client.subscriptions.get(guild.id);

    if (
      subscription &&
      subscription.audioPlayer.state.status !== AudioPlayerStatus.Idle
    ) {
      if (args.length !== 0) {
        const volume = args.shift();
        if (volume >= 0 && volume <= 100) {
          subscription.audioPlayer.state.resource.volume.setVolume(
            volume / 100
          );
          subscription.setVolume(volume);
        }
      }
      const embed = new MessageEmbed().setDescription(
        `**Volume** set to ${
          subscription.audioPlayer.state.resource.volume.volume * 100
        }`
      );
      interaction.editReply({ embeds: [embed] });
      return;
    }

    const embed = new MessageEmbed()
      .setDescription("**Error** No song is currently playing!")
      .setColor("RED");
    interaction.editReply({ embeds: [embed] });
  },
};
