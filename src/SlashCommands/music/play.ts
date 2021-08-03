import {
  AudioPlayerStatus,
  AudioResource,
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import {
  CommandInteraction,
  DMChannel,
  Guild,
  GuildMember,
  InteractionCollector,
  MessageActionRow,
  MessageButton,
  MessageComponentInteraction,
  MessageEmbed,
  MessageOptions,
  NewsChannel,
  PartialDMChannel,
  TextChannel,
  ThreadChannel,
} from "discord.js";
import { getInfo, validateID as validateVidID, videoInfo } from "ytdl-core";
import ytpl, { Result, validateID as validatePlID } from "ytpl";
import ytsr from "ytsr";
import ExtendedClient from "../../Client";
import { MusicSubscription, SlashCommand, Track } from "../../Interfaces";
import { Button } from "../../Interfaces/Button";
import { ComponentCollector } from "../../Interfaces/ComponentCollector";

const cooldowns = {};

const run = async ({
  client,
  args,
  interaction,
}: {
  client: ExtendedClient;
  args: string[];
  interaction: CommandInteraction;
}) => {
  const [{ guild, channel }, member] = [
    interaction,
    interaction.member as GuildMember,
  ];
  const query = args.shift();

  let subscription =
    client.subscriptions.get(guild.id) ?? createSubscription(client, member);

  if (!subscription) {
    await interaction
      .editReply("Join a voice channel and try again")
      .catch(console.warn);
    return;
  }

  if (cooldowns[guild.id] && cooldowns[guild.id] > Date.now()) {
    return await interaction
      .editReply(
        `Please wait for ${Math.ceil(
          cooldowns[guild.id] / 1000 - Date.now() / 1000
        )} more sec(s) to execute this command`
      )
      .catch((err) => {});
  }
  cooldowns[guild.id] = Date.now() + 1000 * 3; // 3 sec cooldown

  if (
    subscription.voiceConnection.state.status !== VoiceConnectionStatus.Ready
  ) {
    interaction.editReply("Connecting...");
    if (!(await connect(client, guild, subscription, interaction))) return;
    interaction.editReply("Connected!");
  }

  try {
    let links = await getLinks(query);
    if (!links) {
      console.log(query);
      const playerEmbed = new MessageEmbed()
        .setDescription("**Invalid link!** Please specify a youtube link!")
        .setColor("RED");

      await interaction
        .editReply({
          content: "",
          embeds: [playerEmbed],
        })
        .catch(console.warn);
      throw new Error("Invalid link!");
    }

    const info = await getInfo(links as string);
    const playlist = await getPlaylist(query);

    subscription.playerEmbed = createPlayerEmbed(
      info,
      playlist,
      links,
      query,
      member
    );
    subscription.playerActionRow = createPlayerButtons();

    const message = await sendMessage(
      interaction,
      channel,
      {
        embeds: [subscription.playerEmbed],
        components: [subscription.playerActionRow],
      },
      subscription
    );

    const collector =
      subscription.collector ??
      new ComponentCollector(channel, {
        collect: async (interaction) => {
          const idle =
            subscription.audioPlayer.state.status === AudioPlayerStatus.Idle;
          const playing =
            subscription.audioPlayer.state.status === AudioPlayerStatus.Playing;
          const paused =
            subscription.audioPlayer.state.status === AudioPlayerStatus.Paused;

          if (interaction.customId === "playlist") {
            Button.playlist(interaction, subscription);
            return;
          }

          if (interaction.customId === "firstplaylist") {
            Button.firstplaylist(subscription);
            return;
          }

          if (interaction.customId === "lastplaylist") {
            Button.lastplaylist(subscription);
            return;
          }

          if (interaction.customId === "prevplaylist") {
            Button.prevplaylist(subscription);
            return;
          }

          if (interaction.customId === "nextplaylist") {
            Button.nextplaylist(subscription);
            return;
          }

          const currentSongUrl = getCurrentSongUrl(subscription);
          const videoId = await getVideoId(currentSongUrl);
          const embed = new MessageEmbed({
            footer: {
              iconURL: member.user.displayAvatarURL(),
              text: member.displayName,
            },
            image: {
              url: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
            },
          });

          if (interaction.customId === "player" && !idle) {
            const info = await getInfo(getCurrentSongUrl(subscription));
            Button.player(subscription, {
              title: info.videoDetails.title,
              image: `https://i.ytimg.com/vi/${info.videoDetails.videoId}/mqdefault.jpg`,
              url: currentSongUrl,
            });
            return;
          }

          if (interaction.customId === "pause" && playing) {
            Button.pause(subscription, interaction, embed);
            return;
          }

          if (interaction.customId === "resume" && paused) {
            Button.resume(subscription, interaction, embed);
            return;
          }

          if (interaction.customId === "stop") {
            Button.stop(client, interaction, subscription);
          }

          if (interaction.customId === "skip" && !idle) {
            Button.skip(interaction, subscription);
            return;
          }
        },
      });
    subscription.collector = collector;
    client.on("voiceStateUpdate", async (oldState, newState) => {
      if (!newState.channelId) {
        if (newState.member.user.bot) {
          if (!collector.collector.ended) {
            subscription.collector = undefined;
            collector.collector.stop();
          }
          return;
        }

        const size = oldState.channel.members.filter(
          (member) => !member.user.bot && member != newState.member
        ).size;
        if (size == 0) {
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
            await subscription.message?.delete().catch(console.warn);
            subscription = null;
          }, 1000);
          client.subscriptions.delete(guild.id);
        }
      }
    });

    if (typeof links === "string") links = [links];

    let promises: Promise<Track>[] = [];
    for (const link of links) {
      if (!client.subscriptions.get(guild.id)) break;
      const track = Track.from(link, {
        async onStart() {
          if (!client.subscriptions.get(guild.id)) return;
          await createStartEvent(
            subscription,
            subscription.playerEmbed,
            subscription.playerActionRow,
            link
          );
        },
        onFinish() {},
        async onError(error) {
          if (!client.subscriptions.get(guild.id)) return;
          await createErrorEvent(
            subscription,
            subscription.playerEmbed,
            subscription.playerActionRow,
            link
          );
        },
      });

      if (subscription.playlist.length == 0) {
        subscription?.enqueue(await track);
        if (subscription.audioPlayer.state.status === AudioPlayerStatus.Idle)
          await subscription.play();

        continue;
      }
      promises.push(track);
    }

    (await Promise.all(promises)).map(async (track) => {
      subscription?.enqueue(track);
    });
  } catch (error) {
    console.warn(error);
  }
};

const createSubscription = (client: ExtendedClient, member: GuildMember) => {
  if (!(client.isReady() && member.voice.channel)) return undefined;
  const { guild } = member;
  const { channel } = member.voice;
  const subscription = new MusicSubscription(
    joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
    })
  );
  subscription.voiceConnection.on("error", console.warn);
  client.subscriptions.set(guild.id, subscription);
  return subscription;
};
const createPlayerEmbed = (
  info: videoInfo,
  playlist: Result,
  links: string | string[],
  query: string,
  member: GuildMember
) => {
  const details = {
    desc: playlist
      ? `**Queued** ${links.length} song from [${playlist.title}](${query}) playlist\nWaiting for all song to load..`
      : `**Queued** [${info.videoDetails.title}](${
          links as string
        })\nWaiting for the song to load..`,
    image: playlist
      ? playlist.bestThumbnail.url
      : `https://i.ytimg.com/vi/${info.videoDetails.videoId}/mqdefault.jpg`,
  };
  return new MessageEmbed({
    description: details.desc,
    image: {
      url: details.image,
    },
    color: "YELLOW",
    footer: {
      text: member.displayName,
      icon_url: member.user.displayAvatarURL(),
    },
  });
};
const createPlayerButtons = () => {
  return new MessageActionRow({
    type: "ACTION_ROW",
    components: [
      new MessageButton({
        style: "SUCCESS",
        customId: "skip",
        label: "Skip",
      }),
      new MessageButton({
        style: "SUCCESS",
        customId: "pause",
        label: "Pause",
      }),
      new MessageButton({
        style: "SUCCESS",
        customId: "resume",
        label: "Resume",
      }),
      new MessageButton({
        style: "SUCCESS",
        customId: "stop",
        label: "Stop",
      }),
      new MessageButton({
        style: "SUCCESS",
        customId: "playlist",
        label: "Playlist",
      }),
    ],
  });
};
const createStartEvent = async (
  subscription: MusicSubscription,
  embed: MessageEmbed,
  buttons: MessageActionRow,
  link: string
) => {
  const info = await getInfo(link).catch((error) => {
    throw error;
  });
  embed
    .setDescription(`**Now Playing** [${info.videoDetails.title}](${link})`)
    .setImage(
      `https://i.ytimg.com/vi/${info.videoDetails.videoId}/mqdefault.jpg`
    )
    .setColor("GREEN");

  if (subscription.message?.deleted) {
    const message = await subscription.message?.channel.send({
      embeds: [embed],
      components: [buttons],
    });
    subscription.message = message;
    return;
  }

  if (subscription.message?.channel.lastMessage !== subscription.message) {
    subscription.message?.delete();
    const message = await subscription.message?.channel.send({
      embeds: [embed],
      components: [buttons],
    });
    subscription.message = message;
    return;
  }

  subscription.message?.edit({ embeds: [embed] });
};
const createErrorEvent = async (
  subscription: MusicSubscription,
  embed: MessageEmbed,
  buttons: MessageActionRow,
  link: string
) => {
  const info = await getInfo(link).catch((error) => {
    throw error;
  });
  embed
    .setDescription(
      `**ERROR** [${info.videoDetails.title}](${link}) was failed to play`
    )
    .setColor("RED");

  if (subscription.message?.deleted) {
    const message = await subscription.message?.channel.send({
      embeds: [embed],
    });
    subscription.message = message;
    return;
  }

  if (subscription.message?.channel.lastMessage !== subscription.message) {
    subscription.message?.delete();
    const message = await subscription.message?.channel.send({
      embeds: [embed],
      components: [buttons],
    });
    subscription.message = message;
    return;
  }
  subscription.message?.edit({
    embeds: [embed],
  });
};

const connect = async (
  client: ExtendedClient,
  guild: Guild,
  subscription: MusicSubscription,
  interaction: CommandInteraction
) => {
  try {
    return await entersState(
      subscription.voiceConnection,
      VoiceConnectionStatus.Ready,
      20e3
    );
  } catch (error) {
    console.warn(error);
    await interaction
      .editReply(
        "Failed to join voice channel within 20 seconds, please try again later"
      )
      .catch(console.warn);
    subscription.voiceConnection.disconnect();
    client.subscriptions.delete(guild.id);
    return false;
  }
};

const getPlaylist = async (query: string) => {
  try {
    return await ytpl(query);
  } catch (error) {
    return undefined;
  }
};
const getLinks = async (query: string) => {
  try {
    return validatePlID(query)
      ? (await ytpl(query)).items.map((item) => item.shortUrl)
      : validateVidID(query)
      ? query
      : (await ytsr(query, { limit: 10 })).items
          .filter((item) => item.type === "video")
          .map((item) => {
            if (item.type === "video") return item.url;
          })
          .shift();
  } catch (err) {
    console.warn(err);
    return undefined;
  }
};

const sendMessage = async (
  interaction: CommandInteraction,
  channel:
    | TextChannel
    | DMChannel
    | NewsChannel
    | PartialDMChannel
    | ThreadChannel,
  options: MessageOptions,
  subscription: MusicSubscription
) => {
  await interaction.deleteReply().catch((err) => {});
  const message = await channel.send(options);
  if (channel.messages.cache.get(subscription.message?.id))
    await subscription.message.delete();
  subscription.message = message;
  setTimeout(() => {
    if (subscription.audioPlayer.state.status != AudioPlayerStatus.Idle)
      (
        subscription.audioPlayer.state.resource as AudioResource<Track>
      ).metadata.onStart();
  }, 3000);

  return message;
};
const getCurrentSongUrl = (subscription: MusicSubscription) => {
  if (subscription.audioPlayer.state.status !== AudioPlayerStatus.Idle) {
    return (subscription.audioPlayer.state.resource as AudioResource<Track>)
      .metadata.url;
  }
};
const getVideoId = async (url: string) => {
  const info = await getInfo(url).catch((err) => undefined);
  return info?.videoDetails.videoId;
};

export const command: SlashCommand = {
  name: "play",
  description: "play a song",
  options: [
    {
      name: "query",
      type: "STRING",

      description: "youtube url of song or playlist | query to search",
      required: true,
    },
  ],
  run,
};
