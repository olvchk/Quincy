import { AudioPlayerStatus } from "@discordjs/voice";
import { GuildMember, MessageEmbed } from "discord.js";
import { SlashCommand } from "../../Interfaces";

export const command: SlashCommand = {
  name: "resume",
  description: "resumes player!",
  run: ({ client, args, interaction }) => {
    const member = interaction.member as GuildMember;
    const { guild } = interaction;
    const subscription = client.subscriptions.get(guild.id);

    if (
      subscription &&
      subscription.audioPlayer.state.status === AudioPlayerStatus.Paused
    ) {
      subscription.audioPlayer.unpause();
      const embed = new MessageEmbed()
        .setDescription("**Resumed** song")
        .setFooter(member.displayName)
        .setColor("GREEN");
      interaction.editReply({ embeds: [embed] });
      return;
    }

    const embed = new MessageEmbed()
      .setDescription("**Error** No song is currently paused!")
      .setColor("RED");
    interaction.editReply({ embeds: [embed] });
  },
};
