import { AudioPlayerStatus, AudioResource } from "@discordjs/voice";
import { GuildMember, MessageEmbed } from "discord.js";
import { getInfo } from "ytdl-core";
import { SlashCommand, Track } from "../../Interfaces";

export const command: SlashCommand = {
  name: "shift",
  description: "Shift a song to the first position",
  options: [
    {
      name: "index",
      description: "index of the song going to be shift",
      type: "INTEGER",
      required: true,
    },
  ],
  run: async ({ client, args, interaction }) => {
    const member = interaction.member as GuildMember;
    const { guild } = interaction;
    const subscription = client.subscriptions.get(guild.id);
    const index = args.shift() - 1;

    if (
      subscription &&
      subscription.audioPlayer.state.status !== AudioPlayerStatus.Idle
    ) {
      const totalQueue = subscription.queue.length;
      if (!(index >= 0 || index < totalQueue)) {
        const embed = new MessageEmbed()
          .setDescription("**Error** Invalid index of song!")
          .setColor("RED");
        interaction.editReply({ embeds: [embed] });
        return;
      }

      const track = subscription.queue.splice(index, 1)[0];
      subscription.queue.unshift(track);
      const queues = subscription.queue
        .slice(0, 5)
        .map((track, index) => `${index + 1}. [${track.title}](${track.url})`)
        .join("\n");

      const embed = new MessageEmbed()
        .setDescription(
          `**Shifted** [${track.title}](${track.url}) to the first of queue!\n\n${queues}`
        )
        .setColor("GREEN")
        .setFooter(member.displayName);
      interaction.editReply({ embeds: [embed] });
      return;
    }

    const embed = new MessageEmbed()
      .setDescription("**Error** No song to shift!")
      .setColor("RED");
    interaction.editReply({ embeds: [embed] });
  },
};
