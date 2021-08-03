import {
  GuildMember,
  Message,
  MessageComponentInteraction,
  MessageEmbed,
} from "discord.js";
import ExtendedClient from "../Client";
import { MusicSubscription } from "./Music Player Interface";

export const Button = {
  resume: async (
    subscription: MusicSubscription,
    interaction: MessageComponentInteraction,
    embed: MessageEmbed
  ) => {
    const [member] = [interaction.member as GuildMember];
    embed
      .setDescription("**Resumed** song")
      .setFooter(member.displayName)
      .setColor("YELLOW");
    subscription.message?.edit({ embeds: [embed] });
    subscription.audioPlayer.unpause();
  },
  pause: async (
    subscription: MusicSubscription,
    interaction: MessageComponentInteraction,
    embed: MessageEmbed
  ) => {
    const [member] = [interaction.member as GuildMember];
    embed
      .setDescription("**Paused** song")
      .setFooter(member.displayName)
      .setColor("YELLOW");
    subscription.message?.edit({ embeds: [embed] });
    subscription.audioPlayer.pause();
  },
  player: async (
    subscription: MusicSubscription,
    video: {
      title: string;
      url: string;
      image: string;
    }
  ) => {
    const { title, url, image } = video;
    subscription.playerEmbed
      .setDescription(`**Now Playing** [${title}](${url})`)
      .setImage(image)
      .setColor("GREEN");
    subscription.message?.edit({
      embeds: [subscription.playerEmbed],
      components: [subscription.playerActionRow],
    });
  },
  playlist: async (
    interaction: MessageComponentInteraction,
    subscription: MusicSubscription
  ) => {
    let index = subscription.playlistPage;
    subscription.playlistEmbed
      .setDescription(
        await subscription.getDesc(subscription, subscription.playlistPage)
      )
      .setFooter(
        `Page ${index + 1} of ${Math.ceil(subscription.playlist.length / 10)}`
      );
    subscription.message?.edit({
      embeds: [subscription.playlistEmbed],
      components: [subscription.playlistActionRow],
    });
  },
  firstplaylist: async (subscription: MusicSubscription) => {
    subscription.playlistPage = 0;
    const index = subscription.playlistPage;

    subscription.playlistEmbed
      .setDescription(
        await subscription.getDesc(subscription, subscription.playlistPage)
      )
      .setFooter(
        `Page ${index + 1} of ${Math.ceil(subscription.playlist.length / 10)}`
      );
    subscription.message?.edit({
      embeds: [subscription.playlistEmbed],
      components: [subscription.playlistActionRow],
    });
  },
  lastplaylist: async (subscription: MusicSubscription) => {
    subscription.playlistPage =
      Math.ceil(subscription.playlist.length / 10) - 1;
    const index = subscription.playlistPage;

    subscription.playlistEmbed
      .setDescription(
        await subscription.getDesc(subscription, subscription.playlistPage)
      )
      .setFooter(
        `Page ${index + 1} of ${Math.ceil(subscription.playlist.length / 10)}`
      );
    subscription.message?.edit({
      embeds: [subscription.playlistEmbed],
      components: [subscription.playlistActionRow],
    });
  },
  prevplaylist: async (subscription: MusicSubscription) => {
    subscription.playlistPage =
      subscription.playlistPage - 1 < 0 ? 0 : subscription.playlistPage - 1;
    const index = subscription.playlistPage;

    subscription.playlistEmbed
      .setDescription(
        await subscription.getDesc(subscription, subscription.playlistPage)
      )
      .setFooter(
        `Page ${index + 1} of ${Math.ceil(subscription.playlist.length / 10)}`
      );
    subscription.message?.edit({
      embeds: [subscription.playlistEmbed],
      components: [subscription.playlistActionRow],
    });
  },
  nextplaylist: async (subscription: MusicSubscription) => {
    subscription.playlistPage =
      subscription.playlistPage + 1 >=
      Math.ceil(subscription.playlist.length / 10)
        ? Math.ceil(subscription.playlist.length / 10) - 1
        : subscription.playlistPage + 1;

    const index = subscription.playlistPage;
    subscription.playlistEmbed
      .setDescription(
        await subscription.getDesc(subscription, subscription.playlistPage)
      )
      .setFooter(
        `Page ${index + 1} of ${Math.ceil(subscription.playlist.length / 10)}`
      );
    subscription.message?.edit({
      embeds: [subscription.playlistEmbed],
      components: [subscription.playlistActionRow],
    });
  },
  stop: async (
    client: ExtendedClient,
    interaction: MessageComponentInteraction,
    subscription: MusicSubscription
  ) => {
    subscription?.stop();
    const [{ guild }, member] = [
      interaction,
      interaction.member as GuildMember,
    ];
    const playerEmbed = new MessageEmbed()
      .setDescription("**Stop** music and **Cleared** queue")
      .setFooter(member.displayName)
      .setColor("GREEN");
    await subscription.message?.edit({ embeds: [playerEmbed] });
    setTimeout(async () => {
      await subscription.message?.delete();
      subscription = null;
    }, 1000);
    client.subscriptions.delete(guild.id);
  },
  skip: async (
    interaction: MessageComponentInteraction,
    subscription: MusicSubscription
  ) => {
    subscription.skip();
    const [member] = [interaction.member as GuildMember];
    const playerEmbed = new MessageEmbed()
      .setDescription("**Skip** waiting for next queue")
      .setFooter(member.displayName);
    subscription.message?.edit({ embeds: [playerEmbed] });
  },
};
