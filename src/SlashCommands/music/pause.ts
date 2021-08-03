import { AudioPlayerStatus } from "@discordjs/voice";
import { GuildMember, MessageEmbed } from "discord.js";
import { SlashCommand } from "../../Interfaces";

export const command: SlashCommand = {
  name: "pause",
  description: "pauses player!",
  run: ({ client, args, interaction }) => {
    const member = interaction.member as GuildMember;
    const { guild, channel } = interaction;
    const subscription = client.subscriptions.get(guild.id);

    if (
      subscription &&
      subscription.audioPlayer.state.status === AudioPlayerStatus.Playing
    ) {
      subscription.audioPlayer.pause();
      const embed = new MessageEmbed()
        .setDescription("**Paused** song")
        .setFooter(member.displayName)
        .setColor("YELLOW");
      interaction.editReply({ embeds: [embed] });
      return;
    }

    const embed = new MessageEmbed()
      .setDescription("**Error** No song is currently playing!")
      .setColor("RED");
    interaction.editReply({ embeds: [embed] });
  },
};
