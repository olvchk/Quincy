import { GuildMember, MessageEmbed } from "discord.js";
import { SlashCommand } from "../../Interfaces";

export const command: SlashCommand = {
  name: "skip",
  description: "skip x song!",
  options: [
    {
      name: "number",
      description: "song to be skipped, empty to skip current song",
      type: "INTEGER",
    },
  ],
  run: ({ client, args, interaction }) => {
    const member = interaction.member as GuildMember;
    const { guild } = interaction;
    const subscription = client.subscriptions.get(guild.id);
    const skip = args.shift();

    if (subscription) {
      if (skip && skip > 1) {
        subscription.queue.splice(0, skip - 1);
      }
      subscription.skip();
      const desc =
        skip && skip > 1 ? `**Skipped** ${skip} songs!` : "**Skipped** a song!";
      const embed = new MessageEmbed()
        .setDescription(desc)
        .setFooter(member.displayName);
      interaction.editReply({ embeds: [embed] });
      return;
    }

    const embed = new MessageEmbed()
      .setDescription("**Error** No song to skip!")
      .setColor("RED");
    interaction.editReply({ embeds: [embed] });
  },
};
