import { AudioPlayerStatus, AudioResource } from "@discordjs/voice";
import {
  GuildMember,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from "discord.js";
import { getInfo, videoInfo } from "ytdl-core";
import { MusicSubscription, SlashCommand, Track } from "../../Interfaces";

export const command: SlashCommand = {
  name: "playlist",
  description: "displays current playlist",
  run: async ({ client, args, interaction }) => {
    const [{ guild, channel }, member] = [
      interaction,
      interaction.member as GuildMember,
    ];

    const subscription = client.subscriptions.get(guild.id);
    if (subscription && subscription.playlist.length !== 0) {
      const embed = new MessageEmbed({
        color: "GREEN",
        description: await getDesc(subscription, 0),
        footer: {
          text: `Page 1 of ${Math.ceil(subscription.playlist.length / 10)}`,
        },
      });
      const buttons = new MessageActionRow({
        type: "ACTION_ROW",
        components: [
          new MessageButton({
            style: "PRIMARY",
            customId: "prevplaylist",
            label: "Prev",
          }),
          new MessageButton({
            style: "SUCCESS",
            customId: "nextplaylist",
            label: "Next",
          }),
          new MessageButton({
            style: "PRIMARY",
            customId: "player",
            label: "Player",
          }),
        ],
      });

      interaction.deleteReply().catch(console.warn);
      if (subscription.message) {
        subscription.message.edit({
          embeds: [embed],
          components: [buttons],
        });
        return;
      }
      subscription.message = await channel.send({
        embeds: [embed],
        components: [buttons],
      });

      return;
    }

    const embed = new MessageEmbed()
      .setDescription("**Error** No song(s) in playlist!")
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
  const playlist = await Promise.all(
    subscription.playlist.map(async (track, index) => {
      const idx = (index + 1)
        .toString()
        .padStart(2, "\u2005")
        .padEnd(4, "\u2005");
      const title = `[${track.title.slice(0, 70)}](${track.url})`;
      let output = `${idx}${title}`;
      if (
        subscription.audioPlayer.state.status !== AudioPlayerStatus.Idle &&
        track === subscription.audioPlayer.state.resource.metadata
      )
        output = `__**${output}**__`;
      return output;
    })
  );
  const pages: string[][] = split(playlist, 10);
  if (subscription.audioPlayer.state.status !== AudioPlayerStatus.Idle) {
    const current = subscription.audioPlayer.state
      .resource as AudioResource<Track>;
    const info = await getInfo(current.metadata.url);
    const duration = Math.round(current.playbackDuration / 1000);
    const length = Number.parseInt(info.videoDetails.lengthSeconds);
    const queueNum = subscription.playlist.indexOf(current.metadata);

    return `**Now Playing** [${current.metadata.title}](${
      current.metadata.url
    }) ${time(duration).min}:${time(duration).sec} / ${time(length).min}:${
      time(length).sec
    } - **#${queueNum + 1}** \n\n${pages[index].join("\n")}`;
  }

  return `**Idling**\n\n${pages[index].join("\n")}`;
};
