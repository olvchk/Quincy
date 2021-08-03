import { GuildMember, MessageEmbed } from "discord.js";
import { SlashCommand } from "../../Interfaces";

export const command: SlashCommand = {
  name: "stop",
  description: "stop song and clear playlist queue",
  run: ({ client, args, interaction }) => {
    const member = interaction.member as GuildMember;
    const { guild } = interaction;
    const subscription = client.subscriptions.get(guild.id);

    if (subscription) {
      subscription.stop();
      const embed = new MessageEmbed()
        .setDescription("**Stop** music and **Cleared** queue")
        .setFooter(member.displayName)
        .setColor("GREEN");
      interaction.editReply({ embeds: [embed] });
      client.subscriptions.delete(guild.id);
      return;
    }

    const embed = new MessageEmbed()
      .setDescription("**Error** No music or queue to stop!")
      .setColor("RED");
    interaction.editReply({ embeds: [embed] });
  },
};
