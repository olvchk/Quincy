import { AudioPlayerStatus, AudioResource } from "@discordjs/voice";
import {
  GuildMember,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from "discord.js";
import { getInfo } from "ytdl-core";
import { MusicSubscription, SlashCommand, Track } from "../../Interfaces";

export const command: SlashCommand = {
  name: "queue",
  description: "displays available queue list",
  run: async ({ client, args, interaction }) => {
    const [{ guild, channel }, member] = [
      interaction,
      interaction.member as GuildMember,
    ];
    const subscription = client.subscriptions.get(guild.id);

    if (subscription.queueMessage) {
      await subscription.queueMessage.delete();
      subscription.queueMessage = undefined;
    }

    let index = 0;
    if (subscription && subscription.queue.length !== 0) {
      const embed = new MessageEmbed({
        color: "GREEN",
        description: await getDesc(subscription, index),
        footer: {
          text: `Page ${index + 1} of ${Math.ceil(
            subscription.queue.length / 10
          )}`,
        },
      });
      const buttons = new MessageActionRow({
        type: "ACTION_ROW",
        components: [
          new MessageButton({
            style: "PRIMARY",
            customId: "prevsearch",
            label: "Prev",
          }),
          new MessageButton({
            style: "SUCCESS",
            customId: "nextsearch",
            label: "Next",
          }),
        ],
      });

      interaction.deleteReply().catch(console.warn);
      if (subscription.queueMessage) {
        subscription.queueMessage.edit({
          embeds: [embed],
          components: [buttons],
        });
        return;
      }

      subscription.queueMessage = await channel.send({
        embeds: [embed],
        components: [buttons],
      });

      const collector = channel.createMessageComponentCollector({
        componentType: "BUTTON",
        time: 1000 * 60 * 5,
      });
      collector.on("collect", async (interaction) => {
        if (interaction.customId === "prevsearch") {
          index = index - 1 < 0 ? 0 : index - 1;
          embed
            .setDescription(await getDesc(subscription, index))
            .setFooter(
              `Page ${index + 1} of ${Math.ceil(
                subscription.playlist.length / 10
              )}`
            );
          subscription.queueMessage?.edit({
            embeds: [embed],
            components: [buttons],
          });
          return;
        }

        if (interaction.customId === "nextsearch") {
          index =
            index + 1 >= Math.ceil(subscription.queue.length / 10)
              ? Math.ceil(subscription.queue.length / 10) - 1
              : index + 1;
          embed
            .setDescription(await getDesc(subscription, index))
            .setFooter(
              `Page ${index + 1} of ${Math.ceil(
                subscription.playlist.length / 10
              )}`
            );
          subscription.queueMessage?.edit({
            embeds: [embed],
            components: [buttons],
          });
          return;
        }
      });
      collector.on("end", async (interaction) => {
        await subscription.queueMessage?.delete();
        subscription.queueMessage = undefined;
      });

      return;
    }

    const embed = new MessageEmbed()
      .setDescription("**Error** No song(s) in queue!")
      .setColor("RED");
    interaction.editReply({ embeds: [embed] });
  },
};

const split = (arr, size: number) => {
  const res = [];
  while (arr.length > 0) {
    const chunk = arr.splice(0, size);
    res.push(chunk);
  }
  return res;
};

const time = (second: number) => {
  const min = Math.floor(second / 60);
  const sec = second % 60;
  return { min, sec: ("0" + sec).slice(-2) };
};

const getDesc = async (subscription: MusicSubscription, index: number) => {
  const queue = await Promise.all(
    subscription.queue.map(async (track, index) => {
      const idx = (index + 1)
        .toString()
        .padStart(2, "\u2005")
        .padEnd(4, "\u2005");
      const title = `[${track.title.slice(0, 70)}](${track.url})`;
      return `${idx}${title}`;
    })
  );
  const pages: string[][] = split(queue, 10);
  if (subscription.audioPlayer.state.status !== AudioPlayerStatus.Idle) {
    const current = subscription.audioPlayer.state
      .resource as AudioResource<Track>;
    const info = await getInfo(current.metadata.url);
    const duration = Math.round(current.playbackDuration / 1000);
    const length = Number.parseInt(info.videoDetails.lengthSeconds);

    return `**Now Playing** [${current.metadata.title}](${
      current.metadata.url
    }) ${time(duration).min}:${time(duration).sec} / ${time(length).min}:${
      time(length).sec
    }\n\n${pages[index].join("\n")}`;
  }

  return `**Idling**\n\n${pages[index].join("\n")}`;
};
